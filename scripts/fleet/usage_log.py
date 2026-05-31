#!/usr/bin/env python3
"""
Sartor fleet — central-log aggregator (the unified usage spine the dashboard charts).

WHAT THIS IS: the Rocinante-side merge step of the central-log layer. Each host's
fleet-sentinel.sh writes one append-only NDJSON per host (committed, light) at
sartor/memory/fleet-log/<host>.ndjson. After those sync into the repo, this script
MERGES them into a single unified time-series CSV the dashboard tails:

    data/financial/solar-inference/usage-log.csv   (GITIGNORED — it joins earn/power
                                                     columns for charting)

WHY GITIGNORED OUTPUT: the per-host NDJSONs are committed (earn_hour/earn_day/list_price
are public on vast.ai; committing is what makes rtxserver visible from Rocinante). The
MERGED csv additionally derives est_earn_interval (a $ figure) and is the dashboard's
local read surface, so it lives under data/financial/ per the CLAUDE.md privacy boundary —
consistent with fleet-state.json / books-2026.json. No NEW dollar truth is created here;
est_earn / est_kwh are graphing-only derivations already present in the NDJSON rows.

WHAT IT DOES NOT DO (consolidate, do not duplicate):
  - It does NOT re-pull vast.ai (that's vastai_pull.py) or re-read books/power/reprice.
    The NDJSON rows are the ONLY input. revenue-2026.csv / power-2026.csv / reprice-log.jsonl
    stay the canonical accounting sources, untouched.
  - It does NOT fabricate. A missing field in a row becomes an empty cell, never a guess.

IDEMPOTENT: merge key is (host, ts). Re-running re-reads every NDJSON and rewrites the CSV
deterministically (sorted by ts then host). Running it twice yields a byte-identical file.
New NDJSON rows since the last run simply appear; nothing is double-counted.

Style mirrors scripts/fleet/books.py: argparse, --dry-run, pathlib, never crash on missing
data, stdlib-only (no PyYAML needed here — we read NDJSON + a thin fleet.yaml host list).

Run:
    python3 scripts/fleet/usage_log.py            # merge -> usage-log.csv
    python3 scripts/fleet/usage_log.py --dry-run  # print summary, write nothing
    python3 scripts/fleet/usage_log.py --self-test # synthetic-row roundtrip, writes to a temp dir
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FLEET_LOG_DIR = REPO_ROOT / "sartor" / "memory" / "fleet-log"
FIN_DIR = REPO_ROOT / "data" / "financial" / "solar-inference"
OUT_CSV = FIN_DIR / "usage-log.csv"

# The unified CSV column order. Mirrors the NDJSON row schema (fleet-log/SCHEMA.md) with
# `host` promoted to a first-class column and `est_earn_interval` kept as the derived
# graphing-only $ figure. Any field absent from a row -> empty cell (never fabricated).
USAGE_COLUMNS = [
    "ts", "host", "machine_id", "rented", "gpu_util", "temp_max", "power_w",
    "est_kwh_interval", "list_price", "min_bid", "reliability2",
    "earn_hour", "earn_day", "est_earn_interval",
    "stale_docker", "stale_vm", "error_description", "vastai_ok",
    "health", "source", "note",
]

# Bool fields render as the literal true/false (lowercase) so the dashboard's JS
# JSON-style parsing reads them back cleanly; everything else is str/num/empty.
_BOOL_FIELDS = {"rented", "vastai_ok"}


def utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def discover_ndjson(log_dir: Path) -> list[Path]:
    """Every <host>.ndjson and rotated <host>-YYYY.ndjson under the fleet-log dir.

    Sorted for deterministic output. .gitkeep / SCHEMA.md / non-.ndjson are skipped.
    """
    if not log_dir.exists():
        return []
    return sorted(p for p in log_dir.glob("*.ndjson") if p.is_file())


def _cell(value: object) -> str:
    """Render one field for CSV. None/missing -> empty. Bools -> true/false. Else str()."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def parse_ndjson_file(path: Path, warnings: list[str]) -> list[dict]:
    """Parse one host NDJSON into a list of row dicts. Malformed lines are skipped + warned.

    The `host` field is trusted from the row if present; otherwise inferred from the
    filename stem (gpuserver1.ndjson -> gpuserver1; gpuserver1-2026.ndjson -> gpuserver1).
    """
    rows: list[dict] = []
    stem = path.stem.split("-")[0]  # 'gpuserver1-2026' -> 'gpuserver1'
    bad = 0
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as e:
        warnings.append(f"UNREADABLE: {path.name} ({e}) — skipped.")
        return rows
    for ln, line in enumerate(text.splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            bad += 1
            continue
        if not isinstance(obj, dict):
            bad += 1
            continue
        if not obj.get("host"):
            obj["host"] = stem
        # A row MUST carry a ts to be mergeable (it's half the dedup key).
        if not obj.get("ts"):
            bad += 1
            continue
        rows.append(obj)
    if bad:
        warnings.append(f"{path.name}: skipped {bad} malformed/incomplete line(s).")
    return rows


def merge_rows(files: list[Path], warnings: list[str]) -> list[dict]:
    """Merge all NDJSON rows, idempotent by (host, ts). Last write wins on a dup key.

    Returns rows sorted by (ts, host) for deterministic, byte-stable output.
    """
    merged: dict[tuple[str, str], dict] = {}
    for f in files:
        for row in parse_ndjson_file(f, warnings):
            key = (str(row.get("host", "")), str(row.get("ts", "")))
            merged[key] = row  # later file / later duplicate overwrites — idempotent
    out = list(merged.values())
    out.sort(key=lambda r: (str(r.get("ts", "")), str(r.get("host", ""))))
    return out


def write_csv(rows: list[dict], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(USAGE_COLUMNS)
        for r in rows:
            w.writerow([_cell(r.get(c)) for c in USAGE_COLUMNS])


def summarize(rows: list[dict]) -> dict:
    """A small per-host rollup for the run report (no fabrication — counts only)."""
    by_host: dict[str, dict] = {}
    for r in rows:
        h = str(r.get("host", "?"))
        s = by_host.setdefault(h, {"rows": 0, "first_ts": None, "last_ts": None,
                                    "rented_ticks": 0, "yellow": 0, "red": 0,
                                    "stale_seen": 0})
        s["rows"] += 1
        ts = str(r.get("ts", ""))
        if s["first_ts"] is None or ts < s["first_ts"]:
            s["first_ts"] = ts
        if s["last_ts"] is None or ts > s["last_ts"]:
            s["last_ts"] = ts
        if r.get("rented") is True:
            s["rented_ticks"] += 1
        health = str(r.get("health", "")).lower()
        if health == "yellow":
            s["yellow"] += 1
        elif health == "red":
            s["red"] += 1
        try:
            if int(r.get("stale_docker") or 0) > 0 or int(r.get("stale_vm") or 0) > 0:
                s["stale_seen"] += 1
        except (TypeError, ValueError):
            pass
    return by_host


def run(out_csv: Path, log_dir: Path, dry_run: bool) -> tuple[int, list[str]]:
    warnings: list[str] = []
    files = discover_ndjson(log_dir)
    if not files:
        try:
            shown = log_dir.relative_to(REPO_ROOT)
        except ValueError:
            shown = log_dir  # custom --log-dir outside the repo (tests)
        warnings.append(
            f"NO INPUT: {shown} has no *.ndjson files yet "
            "(hosts have not synced a sentinel row — expected until fleet-sentinel is deployed).")
    rows = merge_rows(files, warnings)
    by_host = summarize(rows)

    print(f"[usage_log] {len(files)} NDJSON file(s); {len(rows)} merged row(s).")
    for h, s in sorted(by_host.items()):
        print(f"  [{h}] rows={s['rows']} window={s['first_ts']}..{s['last_ts']} "
              f"rented_ticks={s['rented_ticks']} yellow={s['yellow']} red={s['red']} "
              f"stale_ticks={s['stale_seen']}")
    for w in warnings:
        print(f"  WARNING: {w}")

    if dry_run:
        print(f"\n[DRY-RUN] would write {len(rows)} row(s) -> {out_csv} (nothing written).")
        return 0, warnings

    write_csv(rows, out_csv)
    print(f"\nWrote {out_csv} ({len(rows)} row(s), {len(USAGE_COLUMNS)} columns).")
    return 0, warnings


# --- self-test (synthetic rows; no host, no network) ---------------------------

def _self_test() -> int:
    """Round-trip synthetic NDJSON -> merged CSV in a temp dir. Proves idempotency + merge."""
    print("[self-test] synthetic central-log merge")
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        log_dir = tmp / "fleet-log"
        log_dir.mkdir()
        out = tmp / "usage-log.csv"

        g = [
            {"ts": "2026-05-31T12:00:00Z", "host": "gpuserver1", "machine_id": 52271,
             "rented": True, "gpu_util": 97, "temp_max": 71, "power_w": 540,
             "est_kwh_interval": 0.045, "list_price": 0.80, "min_bid": 0.65,
             "reliability2": 0.99, "earn_hour": 0.20, "earn_day": 4.8,
             "est_earn_interval": 0.0167, "stale_docker": 1, "stale_vm": 0,
             "error_description": None, "vastai_ok": True, "health": "yellow",
             "source": "sentinel", "note": "stale Exited C.* container"},
            {"ts": "2026-05-31T12:05:00Z", "host": "gpuserver1", "machine_id": 52271,
             "rented": True, "gpu_util": 98, "temp_max": 72, "power_w": 545,
             "est_kwh_interval": 0.045, "list_price": 0.80, "min_bid": 0.65,
             "reliability2": 0.99, "earn_hour": 0.20, "earn_day": 4.8,
             "est_earn_interval": 0.0167, "stale_docker": 0, "stale_vm": 0,
             "error_description": None, "vastai_ok": True, "health": "green",
             "source": "sentinel", "note": None},
        ]
        r = [
            {"ts": "2026-05-31T12:02:00Z", "host": "rtxserver", "machine_id": 124192,
             "rented": True, "gpu_util": 88, "temp_max": 83, "power_w": 1200,
             "est_kwh_interval": 0.10, "list_price": 0.86, "min_bid": 0.85,
             "reliability2": 0.97, "earn_hour": 1.44, "earn_day": 34.6,
             "est_earn_interval": 0.12, "stale_docker": 0, "stale_vm": 0,
             "error_description": None, "vastai_ok": True, "health": "green",
             "source": "sentinel", "note": None},
        ]
        # A witness synthetic DOWN row (host-down path).
        w = [
            {"ts": "2026-05-31T11:50:00Z", "host": "rtxserver", "machine_id": 124192,
             "rented": True, "health": "red", "source": "witness", "note": "host-down"},
        ]

        (log_dir / "gpuserver1.ndjson").write_text(
            "\n".join(json.dumps(x) for x in g) + "\n", encoding="utf-8")
        (log_dir / "rtxserver.ndjson").write_text(
            "\n".join(json.dumps(x) for x in (w + r)) + "\n", encoding="utf-8")
        # A malformed line + a no-ts line, to prove they're skipped, not crashed-on.
        with (log_dir / "rtxserver.ndjson").open("a", encoding="utf-8") as fh:
            fh.write("{not valid json\n")
            fh.write(json.dumps({"host": "rtxserver", "gpu_util": 5}) + "\n")  # no ts

        warnings1: list[str] = []
        rows1 = merge_rows(discover_ndjson(log_dir), warnings1)
        write_csv(rows1, out)
        first = out.read_bytes()

        # Idempotency: re-run yields a byte-identical file.
        warnings2: list[str] = []
        rows2 = merge_rows(discover_ndjson(log_dir), warnings2)
        write_csv(rows2, out)
        second = out.read_bytes()

        ok = True
        # 4 good rows (2 g + 1 r + 1 witness); 2 bad lines skipped.
        if len(rows1) != 4:
            print(f"  FAIL: expected 4 merged rows, got {len(rows1)}"); ok = False
        else:
            print("  PASS: 4 valid rows merged (2 bad lines skipped)")
        if first != second:
            print("  FAIL: output not idempotent (byte mismatch on re-run)"); ok = False
        else:
            print("  PASS: idempotent (byte-identical on re-run)")
        # Ordering: sorted by (ts, host). First row is the 11:50 witness row.
        with out.open(encoding="utf-8") as fh:
            reader = list(csv.DictReader(fh))
        if reader and reader[0]["ts"] == "2026-05-31T11:50:00Z" and reader[0]["source"] == "witness":
            print("  PASS: rows sorted by ts (witness DOWN row leads)")
        else:
            print(f"  FAIL: ordering wrong; first row = {reader[0] if reader else None}"); ok = False
        # Bool rendering + null -> empty cell.
        g_first = next((x for x in reader if x["host"] == "gpuserver1"), None)
        if g_first and g_first["rented"] == "true" and g_first["error_description"] == "":
            print("  PASS: bool->true/false and null->empty-cell rendering")
        else:
            print(f"  FAIL: cell rendering; got {g_first}"); ok = False
        # Column contract.
        if reader and list(reader[0].keys()) == USAGE_COLUMNS:
            print(f"  PASS: {len(USAGE_COLUMNS)}-column header matches USAGE_COLUMNS")
        else:
            print("  FAIL: header drift from USAGE_COLUMNS"); ok = False

        print("  self-test:", "OK" if ok else "FAILED")
        return 0 if ok else 1


def main() -> int:
    ap = argparse.ArgumentParser(description="Merge per-host fleet-log NDJSON into a unified usage CSV.")
    ap.add_argument("--dry-run", action="store_true", help="Summarize; write nothing.")
    ap.add_argument("--self-test", action="store_true",
                    help="Run the synthetic-row roundtrip self-test (no host/network) and exit.")
    ap.add_argument("--out", type=Path, default=OUT_CSV, help="Output CSV path.")
    ap.add_argument("--log-dir", type=Path, default=FLEET_LOG_DIR, help="fleet-log NDJSON dir.")
    args = ap.parse_args()

    if args.self_test:
        return _self_test()

    rc, _ = run(args.out, args.log_dir, args.dry_run)
    return rc


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SystemExit:
        raise
    except Exception as e:  # aggregation must fail loud, not silent
        print(f"ERROR {type(e).__name__}: {e}", file=sys.stderr)
        raise SystemExit(1)
