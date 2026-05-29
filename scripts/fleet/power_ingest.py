#!/usr/bin/env python3
"""
Sartor fleet power ingest — pull per-machine daily kWh into the ITC substantiation ledger.

WHY THIS EXISTS: gpuserver1 runs an always-on energy logger (/home/alton/sartor-power/,
installed 2026-04-11; see sartor/memory/reference/gpuserver1-power-logging.md) that produces
daily kWh + USD summaries. Those numbers never reached the repo, so the §48E ITC business-use
fraction — the load-bearing unknown in fleet.yaml (`solar.business_use_fraction: null`) — had
no measured input. This script closes that gap: it SSHes to each fleet.yaml machine that has
`power.logger` set, pulls the daily summaries, and appends them to the gitignored dollar ledger
at data/financial/solar-inference/power-2026.csv.

PRIVACY BOUNDARY (CLAUDE.md): the output CSV carries an est_cost_usd column (a dollar amount),
so it lives ONLY under data/financial/solar-inference/ (gitignored, local). This script must
never write kWh/USD into any committed file.

SUBSTANTIATION GAP: machines with `power.logger: null` (currently rtxserver) have NO measured
kWh. We refuse to fabricate. For those we print a clear gap warning and write NO row — the
absence is itself the finding the ITC business-use analysis must reckon with.

CONFIG SPINE: iterate sartor/memory/business/fleet.yaml `machines`; never hardcode a machine.
Adding rig 3 with a logger = it gets ingested automatically.

Style mirrors scripts/fleet-watchdog.py: argparse, --dry-run, pathlib, defensive subprocess,
PyYAML the only non-stdlib dep, never crash on missing data.
"""

from __future__ import annotations

import argparse
import csv
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

# Output carries em-dashes / kWh / § in human-readable lines. Make stdout/stderr
# tolerate a non-UTF-8 console (Windows Task Scheduler defaults to cp1252) instead
# of raising UnicodeEncodeError mid-run.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

REPO_ROOT = Path(__file__).resolve().parents[2]
FLEET_PATH = REPO_ROOT / "sartor" / "memory" / "business" / "fleet.yaml"
# Dollar amounts -> gitignored local-only ledger. NEVER a committed path.
OUT_DIR = REPO_ROOT / "data" / "financial" / "solar-inference"
OUT_CSV = OUT_DIR / "power-2026.csv"

CSV_HEADER = [
    "date", "hostname", "machine_id",
    "business_kwh", "total_kwh", "est_cost_usd",
    "source", "notes",
]

# Date stamps in the summary filenames / content we accept.
_DATE_RE = re.compile(r"(\d{4}-\d{2}-\d{2})")


def utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# --- ssh helpers (pattern inlined from fleet-watchdog.py) ----------------------

def parse_logger(logger: str) -> tuple[str | None, str | None]:
    """Parse a `power.logger` value into (ssh_target, remote_path).

    fleet.yaml form: "ssh:alton@gpuserver1:/home/alton/sartor-power/"
    Returns (None, None) if the value is not an ssh:<user@host>:<path> spec.
    """
    if not logger or not isinstance(logger, str):
        return None, None
    if not logger.startswith("ssh:"):
        return None, None
    rest = logger[len("ssh:"):]
    # rest = "alton@gpuserver1:/home/alton/sartor-power/"
    if ":" not in rest:
        return None, None
    target, path = rest.split(":", 1)
    return target.strip(), path.strip()


def ssh_run(target: str, remote_cmd: str, timeout_s: int = 40) -> tuple[bool, str, str]:
    """Run a remote command. Returns (ok, stdout, detail). Never raises."""
    cmd = [
        "ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8",
        "-o", "StrictHostKeyChecking=accept-new", target, remote_cmd,
    ]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_s,
                             encoding="utf-8", errors="replace")
    except subprocess.TimeoutExpired:
        return False, "", "ssh timeout"
    except FileNotFoundError:
        return False, "", "ssh binary not found"
    if out.returncode != 0:
        err = (out.stderr or "").strip().splitlines()
        return False, "", (err[-1][:120] if err else f"rc={out.returncode}")
    return True, out.stdout, "ok"


# --- summary discovery + parse -------------------------------------------------

# INSPECTED 2026-05-28 on gpuserver1 (the only machine with a logger). Ground truth:
#   - bin/daily_summary.py writes a markdown summary named `YYYY-MM-DD_power.md`
#     into the REPO inbox at sartor/memory/inbox/gpuserver1/power/. BUT that cron was
#     SUPERSEDED 2026-04-12 ("folded into gather_mirror 4h pass") and only ever produced
#     one file (2026-04-11_power.md), which is no longer present in the synced repo.
#   - The DURABLE artifact that is actually current is the raw per-day TSV at
#     <logger>/data/YYYY-MM-DD.tsv (9-col schema, ~8640 rows/day; see the reference doc).
# So the ingest strategy is two-tier:
#   (A) if a YYYY-MM-DD_power.md summary exists (logger dir OR repo inbox), parse it;
#   (B) otherwise INTEGRATE the raw TSV the same way daily_summary.py does — sum
#       estimated_total_watts*dt for total kWh, gpu_watts_interval*dt for the GPU-only
#       (business-use proxy) kWh, cost = total_kwh * rate. This is the substantiation.
# Tier B computes the real number from the durable raw data rather than depending on an
# ephemeral summary file that the superseded cron no longer writes.

RATE_USD_PER_KWH = 0.1789  # matches daily_summary.py (2025 NJ residential avg, EIA)


def list_summary_files(target: str, base_path: str) -> tuple[list[str], str]:
    """Locate pre-rendered daily-summary markdown files (named YYYY-MM-DD_power.md).

    Uses `find` (NOT shell globs): a nullglob set with every pattern unmatched makes
    bare `ls` list the cwd and drag in unrelated files. find returns empty cleanly.
    Empty list is NOT an error — we fall back to raw-TSV integration.
    """
    base = base_path.rstrip("/")
    inbox = "/home/alton/Sartor-claude-network/sartor/memory/inbox/gpuserver1/power"
    # Match only the dated power-summary filename, in the logger dir and the repo inbox.
    remote = (
        f"find {base} {inbox} -maxdepth 2 -type f "
        f"-name '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]_power.md' "
        f"2>/dev/null | sort"
    )
    ok, out, detail = ssh_run(target, remote)
    if not ok:
        return [], detail
    files = [ln.strip() for ln in out.splitlines() if ln.strip()]
    return files, "ok"


def list_raw_tsv_files(target: str, base_path: str) -> tuple[list[str], str]:
    """List raw per-day TSV files under <logger>/data/. These are the durable artifact."""
    base = base_path.rstrip("/")
    remote = (f"ls -1 {base}/data/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].tsv "
              f"2>/dev/null | sort")
    ok, out, detail = ssh_run(target, remote)
    if not ok:
        return [], detail
    files = [ln.strip() for ln in out.splitlines() if ln.strip()]
    return files, "ok"


def fetch_file(target: str, remote_path: str) -> tuple[str | None, str]:
    ok, out, detail = ssh_run(target, f"cat {remote_path} 2>/dev/null", timeout_s=60)
    if not ok:
        return None, detail
    return out, "ok"


def integrate_tsv(text: str, fname: str) -> dict | None:
    """Integrate a raw sartor-power TSV into one daily record, mirroring daily_summary.py.

    9-col schema (see gpuserver1-power-logging.md / bin/daily_summary.py):
      timestamp_iso, cpu_package_joules_cumulative, cpu_package_watts_interval,
      dram_joules_cumulative, dram_watts_interval, gpu_joules_cumulative,
      gpu_watts_instantaneous, gpu_watts_interval, estimated_total_watts

    Riemann-sum watts*dt (dt capped at 600s to skip gaps), /3.6e6 -> kWh:
      total_kwh    = integral of estimated_total_watts   (whole-system estimate)
      business_kwh = integral of gpu_watts_interval       (GPU-only; ITC business-use proxy)
      est_cost_usd = total_kwh * RATE_USD_PER_KWH
    Returns {date,total_kwh,business_kwh,cost_usd,covered_hours,rows} or None if unusable.
    """
    lines = [ln for ln in (text or "").splitlines() if ln.strip()]
    if len(lines) < 2:
        return None
    header = lines[0].split("\t")
    idx = {c.strip(): i for i, c in enumerate(header)}
    needed = ("timestamp_iso", "gpu_watts_interval", "estimated_total_watts")
    if not all(k in idx for k in needed):
        return None  # not the expected schema; let caller TODO it

    def fnum(s):
        try:
            return float(s)
        except (TypeError, ValueError):
            return None

    prev_ts = None
    gpu_joules = 0.0
    total_joules = 0.0
    covered_s = 0.0
    nrows = 0
    for ln in lines[1:]:
        parts = ln.split("\t")
        if len(parts) < len(header):
            continue
        ts_raw = parts[idx["timestamp_iso"]]
        try:
            ts = datetime.fromisoformat(ts_raw)
        except ValueError:
            continue
        gpu_w = fnum(parts[idx["gpu_watts_interval"]])
        est_w = fnum(parts[idx["estimated_total_watts"]])
        if prev_ts is not None:
            dt_s = (ts - prev_ts).total_seconds()
            if 0 < dt_s <= 600:
                covered_s += dt_s
                if gpu_w is not None:
                    gpu_joules += gpu_w * dt_s
                if est_w is not None:
                    total_joules += est_w * dt_s
        prev_ts = ts
        nrows += 1

    if covered_s <= 0:
        return None
    m = _DATE_RE.search(fname)
    date = m.group(1) if m else None
    total_kwh = total_joules / 3.6e6
    gpu_kwh = gpu_joules / 3.6e6
    return {
        "date": date,
        "total_kwh": round(total_kwh, 4),
        "business_kwh": round(gpu_kwh, 4),
        "cost_usd": round(total_kwh * RATE_USD_PER_KWH, 3),
        "covered_hours": round(covered_s / 3600.0, 2),
        "rows": nrows,
    }


# Tokens we'll hunt for when parsing free-form summary text.
_KWH_KEYS = ("total_kwh", "kwh", "energy_kwh", "total_energy_kwh")
_BUSINESS_KWH_KEYS = ("business_kwh", "gpu_kwh", "rental_kwh")
_COST_KEYS = ("cost_usd", "usd", "est_cost_usd", "cost", "total_cost_usd")


def _coerce_float(v) -> float | None:
    try:
        return float(str(v).replace("$", "").replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def parse_summary(text: str, fname: str) -> list[dict]:
    """Best-effort parse of a summary file into [{date,total_kwh,business_kwh,cost_usd}, ...].

    Handles three shapes, in priority order:
      1. JSON object or list of objects with kwh/cost keys.
      2. CSV/TSV with a header row naming the columns.
      3. Free-form text: scrape a date + the first kWh-looking and $-looking number.

    Returns [] if nothing parseable — the caller then leaves a TODO with the path it
    inspected, rather than inventing a number.
    """
    import json

    text = (text or "").strip()
    if not text:
        return []

    # 1. JSON
    if text[0] in "{[":
        try:
            obj = json.loads(text)
            records = obj if isinstance(obj, list) else [obj]
            rows = []
            for rec in records:
                if not isinstance(rec, dict):
                    continue
                date = _first_date_from(rec, fname)
                rows.append({
                    "date": date,
                    "total_kwh": _first_key(rec, _KWH_KEYS),
                    "business_kwh": _first_key(rec, _BUSINESS_KWH_KEYS),
                    "cost_usd": _first_key(rec, _COST_KEYS),
                })
            if rows:
                return rows
        except (ValueError, TypeError):
            pass  # fall through to delimited / free-form

    # 2. delimited (CSV/TSV) with a header
    delim = "\t" if (fname.endswith(".tsv") or "\t" in text.splitlines()[0]) else ","
    lines = [ln for ln in text.splitlines() if ln.strip()]
    if len(lines) >= 2 and delim in lines[0]:
        reader = csv.DictReader(lines, delimiter=delim)
        rows = []
        for rec in reader:
            norm = { (k or "").strip().lower(): v for k, v in rec.items() }
            date = _first_date_from(norm, fname)
            tk = _first_key(norm, _KWH_KEYS)
            ck = _first_key(norm, _COST_KEYS)
            if date or tk is not None or ck is not None:
                rows.append({
                    "date": date,
                    "total_kwh": tk,
                    "business_kwh": _first_key(norm, _BUSINESS_KWH_KEYS),
                    "cost_usd": ck,
                })
        if rows:
            return rows

    # 2.5 sartor-power markdown (bin/daily_summary.py shape). The table has SEVERAL
    # kWh rows; we must grab the right ones by label, not the first kWh number.
    if "Power Summary" in text or "Estimated system total" in text:
        m = _DATE_RE.search(fname) or _DATE_RE.search(text)
        date = m.group(1) if m else None
        # | **Estimated system total** | **3.1527** | ... |
        total = _scrape_number(text, r"Estimated system total\**\s*\|\s*\**\s*([\d.,]+)")
        # | GPU (nvidia-smi integrated) | 1.2345 | ... |
        gpu = _scrape_number(text, r"GPU[^|]*\|\s*([\d.,]+)")
        # **Estimated electricity cost today:** **$0.564** ...
        cost = _scrape_number(text, r"cost today:\**\s*\**\$?\s*([\d.,]+)")
        if total is not None or cost is not None:
            return [{"date": date, "total_kwh": total, "business_kwh": gpu, "cost_usd": cost}]

    # 3. free-form text scrape (last resort)
    date = None
    m = _DATE_RE.search(fname) or _DATE_RE.search(text)
    if m:
        date = m.group(1)
    kwh = _scrape_number(text, r"([\d.,]+)\s*kwh")
    cost = _scrape_number(text, r"\$\s*([\d.,]+)") or _scrape_number(text, r"([\d.,]+)\s*usd")
    if date or kwh is not None or cost is not None:
        return [{"date": date, "total_kwh": kwh, "business_kwh": None, "cost_usd": cost}]
    return []


def _first_key(rec: dict, keys: tuple) -> float | None:
    low = { (k or "").lower(): v for k, v in rec.items() }
    for k in keys:
        if k in low and low[k] not in (None, "", "null"):
            val = _coerce_float(low[k])
            if val is not None:
                return val
    return None


def _first_date_from(rec: dict, fname: str) -> str | None:
    low = { (k or "").lower(): v for k, v in rec.items() }
    for k in ("date", "day", "summary_date", "timestamp", "date_iso"):
        if k in low and low[k]:
            m = _DATE_RE.search(str(low[k]))
            if m:
                return m.group(1)
    m = _DATE_RE.search(fname)
    return m.group(1) if m else None


def _scrape_number(text: str, pattern: str) -> float | None:
    m = re.search(pattern, text, re.IGNORECASE)
    if not m:
        return None
    return _coerce_float(m.group(1))


# --- CSV merge (idempotent by date+hostname) -----------------------------------

def load_existing(path: Path) -> dict:
    """Return {(date, hostname): row_dict} from an existing CSV, or {} if absent."""
    if not path.exists():
        return {}
    out = {}
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row.get("date", ""), row.get("hostname", ""))
            out[key] = row
    return out


def write_csv(path: Path, rows_by_key: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    ordered = sorted(rows_by_key.values(),
                     key=lambda r: (r.get("date") or "", r.get("hostname") or ""))
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADER)
        writer.writeheader()
        for r in ordered:
            writer.writerow({k: r.get(k, "") for k in CSV_HEADER})


def _fmt(v) -> str:
    if v is None:
        return ""
    if isinstance(v, float):
        # trim trailing zeros without scientific notation
        return f"{v:.6f}".rstrip("0").rstrip(".")
    return str(v)


# --- main ----------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="Sartor fleet power ingest (kWh -> ITC ledger)")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print what would be ingested; do not write the CSV.")
    ap.add_argument("--out", type=Path, default=OUT_CSV,
                    help="Output CSV path (override for testing).")
    args = ap.parse_args()

    if not FLEET_PATH.exists():
        print(f"ERROR: fleet config not found: {FLEET_PATH}", file=sys.stderr)
        return 2
    fleet = yaml.safe_load(FLEET_PATH.read_text(encoding="utf-8")) or {}
    machines = fleet.get("machines", []) or []
    if not machines:
        print("No machines in fleet.yaml — nothing to ingest.")
        return 0

    existing = load_existing(args.out)
    merged = dict(existing)
    added, updated, gaps = 0, 0, 0

    for m in machines:
        hostname = m.get("hostname", "?")
        machine_id = m.get("vast_ai_machine_id")
        power = m.get("power") or {}
        logger = power.get("logger")

        if not logger:
            gaps += 1
            print(f"NO POWER LOGGER on {hostname} — ITC business-use kWh cannot be "
                  f"measured for this machine (substantiation gap). No data written.")
            continue

        target, remote_path = parse_logger(logger)
        if not target:
            print(f"[{hostname}] power.logger '{logger}' is not an ssh:<user@host>:<path> "
                  f"spec — skipping (no data written).")
            continue

        print(f"[{hostname}] logger -> {target}:{remote_path}")

        # daily_records[date] = (rec_dict, source_label). Summaries win over TSV
        # integration for a given date (a rendered summary is the logger's own number).
        daily_records: dict = {}

        # Tier A: pre-rendered summary markdown (logger dir + repo inbox).
        sum_files, detail = list_summary_files(target, remote_path)
        if detail != "ok":
            print(f"[{hostname}] could not reach logger host ({detail}) — no data written.")
            continue
        for rf in sum_files:
            content, fdetail = fetch_file(target, rf)
            if content is None:
                print(f"[{hostname}]   {rf}: fetch failed ({fdetail})")
                continue
            for rec in parse_summary(content, Path(rf).name):
                d = rec.get("date")
                if d:
                    daily_records[d] = (rec, f"sartor-power-summary:{Path(rf).name}")
        if sum_files:
            print(f"[{hostname}] {len(daily_records)} day(s) from rendered summaries.")

        # Tier B: integrate raw daily TSVs for any day not covered by a summary.
        # This is the durable substantiation path — daily_summary.py's cron was
        # SUPERSEDED 2026-04-12, so summaries are sparse/absent but the TSVs persist.
        tsv_files, tdetail = list_raw_tsv_files(target, remote_path)
        if tdetail != "ok":
            print(f"[{hostname}] raw TSV listing failed ({tdetail}).")
        tsv_done = 0
        for rf in tsv_files:
            d = _DATE_RE.search(Path(rf).name)
            d = d.group(1) if d else None
            if d and d in daily_records:
                continue  # already have a rendered summary for this date
            content, fdetail = fetch_file(target, rf)
            if content is None:
                print(f"[{hostname}]   {rf}: fetch failed ({fdetail})")
                continue
            rec = integrate_tsv(content, Path(rf).name)
            if rec is None:
                # TODO: TSV did not match the expected 9-col schema. Inspect this exact
                # file and extend integrate_tsv() if the logger format changed:
                #   ssh {target} "head -2 {rf}"
                print(f"[{hostname}]   {rf}: TSV unparseable (schema mismatch) — "
                      f"TODO: inspect 'head -2 {rf}'.")
                continue
            if rec.get("date"):
                daily_records[rec["date"]] = (rec, f"sartor-power-tsv:{Path(rf).name}")
                tsv_done += 1
        if tsv_files:
            print(f"[{hostname}] {tsv_done} day(s) integrated from raw TSV "
                  f"({len(tsv_files)} TSV file(s) seen).")

        if not daily_records:
            print(f"[{hostname}] no summaries and no usable TSVs under "
                  f"{target}:{remote_path} — no data written. "
                  f"TODO: inspect 'ls -R {remote_path}'.")
            continue

        host_rows = 0
        for date, (rec, src_label) in daily_records.items():
            key = (date, hostname)
            notes_bits = []
            if "covered_hours" in rec:
                notes_bits.append(f"coverage {rec['covered_hours']}h")
            if rec.get("business_kwh") is not None:
                notes_bits.append("business_kwh = GPU-only draw (ITC business-use proxy; "
                                  "exact rental-attributed split needs rental-hours overlay)")
            else:
                notes_bits.append("total_kwh only; GPU-only business split unavailable")
            row = {
                "date": date,
                "hostname": hostname,
                "machine_id": _fmt(machine_id),
                "business_kwh": _fmt(rec.get("business_kwh")),
                "total_kwh": _fmt(rec.get("total_kwh")),
                "est_cost_usd": _fmt(rec.get("cost_usd")),
                "source": src_label,
                "notes": "; ".join(notes_bits),
            }
            prior = merged.get(key)
            if prior is None:
                added += 1
            elif prior != row:
                updated += 1
            merged[key] = row  # idempotent overwrite by (date, hostname)
            host_rows += 1
        print(f"[{hostname}] {host_rows} daily row(s) ready.")

    print(f"\nSummary: +{added} new, ~{updated} updated, {gaps} machine(s) with no logger "
          f"(substantiation gap). Total rows after merge: {len(merged)}.")

    if args.dry_run:
        print(f"[DRY-RUN] {args.out} NOT written.")
        # Show a preview of what would land.
        for key in sorted(merged.keys()):
            r = merged[key]
            print(f"    {r['date']} {r['hostname']:<11} "
                  f"total_kwh={r['total_kwh'] or '-':<10} "
                  f"business_kwh={r['business_kwh'] or '-':<10} "
                  f"est_cost_usd={r['est_cost_usd'] or '-':<8} src={r['source']}")
        return 0

    write_csv(args.out, merged)
    print(f"Wrote {args.out} ({len(merged)} rows). "
          f"Schema: {','.join(CSV_HEADER)}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # an ingest should never crash the orchestrator
        print(f"ERROR {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)
