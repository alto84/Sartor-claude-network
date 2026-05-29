#!/usr/bin/env python3
"""
Sartor fleet — vast.ai ongoing-revenue + live-state ingestion (the "grab revenue +
monitor machines + consider outages" puller Alton asked for).

ONE pass per invocation, idempotent, --dry-run aware. The Windows Scheduled Task (or
a cron) provides cadence; this script never sleeps. It is the INGESTION layer; the
ALERTING layer is scripts/fleet-watchdog.py. Here we only SURFACE transitions in
stdout + append to a history log so the dashboard and the watchdog have ground truth.

DATA FLOW (privacy boundary — CLAUDE.md "Financial data stays in data/financial/"):
  CONFIG  (committed):   sartor/memory/business/fleet.yaml   -> machine identity / approved listing
  DOLLARS (gitignored):  data/financial/solar-inference/     -> everything with a $ in it
    - fleet-state.json          : latest snapshot (balance + per-machine live state)
    - fleet-state-history.jsonl : one line per machine per pull (outage/transition trail)
    - revenue-2026.csv          : upserted per-(period,machine) earnings rows

VAST.AI CLI QUIRKS (verified live 2026-05-28 against the gpuserver1-hosted CLI):
  1. The authenticated CLI lives ONLY on gpuserver1 (~/.local/bin/vastai). We SSH there
     so vast.ai state is observable even when rtxserver itself is powered off.
  2. `show earnings --raw` (NO date flags) returns a JSON object FOLLOWED by a literal
     `\nnull\n` trailer. json.loads() chokes on the trailer; we raw_decode() the
     lstripped text and ignore the tail.
  3. `show earnings -s/-e ...` (date range) CRASHES this CLI build:
     `AttributeError: module 'collections' has no attribute 'Callable'` (old dateutil
     vs py3.10). So we CANNOT pull an arbitrary historical range. The no-arg call
     returns a SINGLE epoch-day window (sday==eday). We capture that day and note the
     limitation. Backfill of older days is impossible from this CLI build — recorded,
     not faked.
  4. `show invoices --raw` returns `[]` on this account (no settled invoices yet).
  5. gpu_hours per machine is NOT exposed by any of these commands -> written as null,
     never fabricated.

PyYAML is the only non-stdlib dependency (already used by fleet-watchdog.py /
fleet.yaml consumers). Subprocess calls are defensive: timeouts, returncode checks,
JSON-decode guards. Nothing here crashes on missing data — it records null + a note.
"""

from __future__ import annotations

import argparse
import csv
import json
import subprocess
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[2]
FLEET_YAML = REPO_ROOT / "sartor" / "memory" / "business" / "fleet.yaml"
FIN_DIR = REPO_ROOT / "data" / "financial" / "solar-inference"
STATE_PATH = FIN_DIR / "fleet-state.json"
HISTORY_PATH = FIN_DIR / "fleet-state-history.jsonl"
REVENUE_PATH = FIN_DIR / "revenue-2026.csv"

# Authenticated vast.ai CLI host (see quirk #1).
VASTAI_SSH = "alton@gpuserver1"
VASTAI_BIN = "~/.local/bin/vastai"

# Revenue CSV schema — matches the seed builder's columns exactly.
REVENUE_COLUMNS = [
    "period_start", "period_end", "machine_id", "hostname",
    "gpu_hours", "gpu_earnings_usd", "storage_earnings_usd",
    "bandwidth_earnings_usd", "gross_usd", "vastai_fee_usd", "net_usd",
    "source", "pulled_at", "notes",
]

# end_date this many days out triggers an expiry WARNING.
EXPIRY_WARN_DAYS = 14


def utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# --- vast.ai subprocess layer (defensive; pattern from fleet-watchdog.py) -------

def _ssh_json(remote_cmd: str, timeout: int = 45) -> tuple[object | None, str]:
    """Run a remote vastai command over SSH; return (parsed_json_or_None, note).

    Handles the `\\nnull\\n` trailer (earnings quirk #2) and trailing garbage via
    JSONDecoder.raw_decode on the lstripped payload. Never raises.
    """
    cmd = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8", VASTAI_SSH, remote_cmd]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                             encoding="utf-8", errors="replace")
    except subprocess.TimeoutExpired:
        return None, "ssh timeout"
    except FileNotFoundError:
        return None, "ssh binary not found"
    if out.returncode != 0:
        err = (out.stderr or "").strip().splitlines()
        return None, (err[-1][:120] if err else f"rc={out.returncode}")
    payload = (out.stdout or "").lstrip()
    if not payload:
        return None, "empty output"
    try:
        obj, _idx = json.JSONDecoder().raw_decode(payload)
        return obj, "ok"
    except json.JSONDecodeError as e:
        return None, f"json decode failed: {e}"


def pull_show_machines() -> tuple[dict | None, str]:
    """{machine_id(int): record} or None. Defensive (fleet-watchdog.py lines 90-143 pattern)."""
    data, note = _ssh_json(f"{VASTAI_BIN} show machines --raw 2>/dev/null")
    if data is None:
        return None, note
    machines = data.get("machines", []) if isinstance(data, dict) else data
    if not isinstance(machines, list):
        return None, "unexpected machines shape"
    return {int(m["machine_id"]): m for m in machines
            if isinstance(m, dict) and m.get("machine_id") is not None}, "ok"


def pull_show_earnings() -> tuple[dict | None, str]:
    """No-date earnings call (quirk #3 forbids ranges). Returns the raw earnings dict.

    Shape: {current:{balance,...}, per_day:[{day,gpu_earn,sto_earn,bwd_earn,bwu_earn}],
            per_machine:[{machine_id,gpu_earn,sto_earn,bwd_earn,bwu_earn}], sday, eday, ...}
    """
    return _ssh_json(f"{VASTAI_BIN} show earnings --raw 2>/dev/null")


def pull_show_invoices() -> tuple[object | None, str]:
    """Invoices (often [] on this account). Defensive; result is informational only."""
    return _ssh_json(f"{VASTAI_BIN} show invoices --raw 2>/dev/null")


# --- helpers --------------------------------------------------------------------

def epoch_day_to_date(eday: object) -> str | None:
    """vast.ai earnings 'day'/'sday'/'eday' are integer days since the Unix epoch."""
    try:
        return (date(1970, 1, 1) + timedelta(days=int(eday))).isoformat()
    except (TypeError, ValueError):
        return None


def epoch_secs_to_date(secs: object) -> str | None:
    """vast.ai end_date is Unix seconds (float)."""
    try:
        return datetime.fromtimestamp(float(secs), tz=timezone.utc).date().isoformat()
    except (TypeError, ValueError, OSError, OverflowError):
        return None


def _num(v: object, default: float = 0.0) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


# --- snapshot assembly ----------------------------------------------------------

def build_machine_snapshot(mid: int, hostname: str, rec: dict | None) -> dict:
    """Per-machine live-state slice for fleet-state.json. Missing data -> None, no fabrication."""
    if rec is None:
        return {
            "hostname": hostname, "vastai_visible": False,
            "listed_gpu_cost": None, "min_bid": None,
            "current_rentals_running": None, "current_rentals_resident": None,
            "reliability2": None, "error_description": None,
            "end_date": None, "end_date_iso": None,
            "gpu_ram": None, "num_gpus": None, "gpu_name": None,
            "earn_hour": None, "earn_day": None,
        }
    end_raw = rec.get("end_date")
    return {
        "hostname": hostname,
        "vastai_visible": True,
        "listed_gpu_cost": rec.get("listed_gpu_cost"),
        "min_bid": rec.get("min_bid_price"),
        "current_rentals_running": rec.get("current_rentals_running"),
        "current_rentals_resident": rec.get("current_rentals_resident"),
        "reliability2": rec.get("reliability2"),
        "error_description": rec.get("error_description"),
        "end_date": end_raw,
        "end_date_iso": epoch_secs_to_date(end_raw),
        "gpu_ram": rec.get("gpu_ram"),
        "num_gpus": rec.get("num_gpus"),
        "gpu_name": rec.get("gpu_name"),
        "earn_hour": rec.get("earn_hour"),
        "earn_day": rec.get("earn_day"),
    }


# --- outage / transition detection ----------------------------------------------

def detect_transitions(mid: int, hostname: str, prev: dict | None, cur: dict,
                       now: datetime) -> list[str]:
    """Compare to previous fleet-state snapshot; return human-readable WARNING strings.

    Surfaced in stdout + the history log. The watchdog does the actual alerting;
    we just make transitions visible to whoever runs this.
    """
    warnings: list[str] = []

    def _rented(snap: dict | None) -> bool | None:
        if not snap:
            return None
        r = snap.get("current_rentals_running")
        return None if r is None else int(_num(r)) >= 1

    cur_rented = _rented(cur)
    prev_rented = _rented(prev)
    if prev_rented and cur_rented is False:
        warnings.append(f"OUTAGE/TRANSITION: {hostname} (id {mid}) went RENTED -> NOT-RENTED "
                        "(rental dropped — possible reboot/offline or normal churn).")
    if prev is not None and prev.get("vastai_visible") and not cur.get("vastai_visible"):
        warnings.append(f"OUTAGE: {hostname} (id {mid}) was visible on vast.ai last pull and "
                        "is NOT visible now (machine unreachable / delisted).")
    cur_err = cur.get("error_description")
    if cur_err and not (prev or {}).get("error_description"):
        warnings.append(f"DELIST RISK: {hostname} (id {mid}) error_description set: '{cur_err}'.")

    end_iso = cur.get("end_date_iso")
    if end_iso:
        try:
            days_left = (date.fromisoformat(end_iso) - now.date()).days
            if 0 <= days_left <= EXPIRY_WARN_DAYS:
                warnings.append(f"EXPIRY SOON: {hostname} (id {mid}) listing end_date {end_iso} "
                                f"is in {days_left}d (<= {EXPIRY_WARN_DAYS}d).")
            elif days_left < 0:
                warnings.append(f"EXPIRED: {hostname} (id {mid}) listing end_date {end_iso} "
                                f"passed {abs(days_left)}d ago.")
        except ValueError:
            pass
    return warnings


# --- revenue CSV upsert ----------------------------------------------------------

def load_revenue_rows() -> list[dict]:
    if not REVENUE_PATH.exists():
        return []
    try:
        with REVENUE_PATH.open("r", encoding="utf-8", newline="") as f:
            return list(csv.DictReader(f))
    except (OSError, csv.Error):
        return []


def write_revenue_rows(rows: list[dict]) -> None:
    FIN_DIR.mkdir(parents=True, exist_ok=True)
    with REVENUE_PATH.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=REVENUE_COLUMNS)
        w.writeheader()
        for r in rows:
            w.writerow({c: r.get(c, "") for c in REVENUE_COLUMNS})


def build_revenue_rows(earnings: dict, id_to_host: dict[int, str],
                       pulled_at: str) -> tuple[list[dict], str]:
    """One row per machine for the earnings window. Returns (rows, note).

    The window is a SINGLE epoch-day (sday==eday) because the date-range CLI path is
    broken (quirk #3). period_start == period_end == that day. gpu_hours is null
    (not exposed). vastai_fee is null unless the payload carries a service_fee we can
    attribute. Returns [] (and a note) if no per_machine breakdown is present.
    """
    if not isinstance(earnings, dict):
        return [], "earnings payload not a dict — no revenue rows written"
    per_machine = earnings.get("per_machine") or []
    if not per_machine:
        return [], "earnings.per_machine empty — no usable per-machine breakdown; no revenue rows"

    sday = epoch_day_to_date(earnings.get("sday"))
    eday = epoch_day_to_date(earnings.get("eday"))
    if sday is None or eday is None:
        return [], "earnings window (sday/eday) unparseable — no revenue rows written"
    window_note = ("single-day window (date-range CLI path broken: dateutil "
                   "collections.Callable crash); backfill of prior days not possible from this CLI")

    rows: list[dict] = []
    for pm in per_machine:
        if not isinstance(pm, dict) or pm.get("machine_id") is None:
            continue
        mid = int(pm["machine_id"])
        gpu = _num(pm.get("gpu_earn"))
        sto = _num(pm.get("sto_earn"))
        bwd = _num(pm.get("bwd_earn"))
        bwu = _num(pm.get("bwu_earn"))
        bandwidth = round(bwd + bwu, 6)
        gross = round(gpu + sto + bandwidth, 6)
        rows.append({
            "period_start": sday,
            "period_end": eday,
            "machine_id": str(mid),
            "hostname": id_to_host.get(mid, str(mid)),
            "gpu_hours": "",                       # not exposed by the CLI — never fabricated
            "gpu_earnings_usd": f"{gpu:.6f}",
            "storage_earnings_usd": f"{sto:.6f}",
            "bandwidth_earnings_usd": f"{bandwidth:.6f}",
            "gross_usd": f"{gross:.6f}",
            "vastai_fee_usd": "",                  # not attributable per-machine from this payload
            "net_usd": f"{gross:.6f}",             # net==gross until a fee field appears; noted
            "source": "vastai-show-earnings",
            "pulled_at": pulled_at,
            "notes": window_note,
        })
    return rows, f"{len(rows)} per-machine row(s) for window {sday}..{eday}"


def upsert_revenue(new_rows: list[dict]) -> int:
    """Idempotent by (period_start, period_end, machine_id). Returns rows written/updated."""
    existing = load_revenue_rows()
    index = {(r.get("period_start"), r.get("period_end"), r.get("machine_id")): i
             for i, r in enumerate(existing)}
    changed = 0
    for nr in new_rows:
        key = (nr["period_start"], nr["period_end"], nr["machine_id"])
        if key in index:
            existing[index[key]] = nr
        else:
            existing.append(nr)
            index[key] = len(existing) - 1
        changed += 1
    existing.sort(key=lambda r: (r.get("period_start", ""), r.get("machine_id", "")))
    write_revenue_rows(existing)
    return changed


# --- main -----------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="vast.ai fleet revenue + state ingestion (one pass)")
    ap.add_argument("--dry-run", action="store_true",
                    help="Pull + print decisions; write NOTHING (no state/history/revenue).")
    args = ap.parse_args()

    now = datetime.now(timezone.utc)
    pulled_at = utc_iso()

    if not FLEET_YAML.exists():
        print(f"ERROR: {FLEET_YAML} not found", file=sys.stderr)
        return 2
    fleet = yaml.safe_load(FLEET_YAML.read_text(encoding="utf-8")) or {}
    machines_cfg = fleet.get("machines", []) or []
    if not machines_cfg:
        print("ERROR: fleet.yaml has no machines", file=sys.stderr)
        return 2

    id_to_host: dict[int, str] = {}
    for m in machines_cfg:
        vid = m.get("vast_ai_machine_id")
        if vid is not None:
            id_to_host[int(vid)] = m.get("hostname", str(vid))

    # --- pulls (defensive) ---
    machines_by_id, m_note = pull_show_machines()
    earnings, e_note = pull_show_earnings()
    invoices, i_note = pull_show_invoices()

    print(f"[pull] show machines: {m_note}"
          f"{'' if machines_by_id is None else f' ({len(machines_by_id)} machine(s))'}")
    print(f"[pull] show earnings: {e_note}")
    print(f"[pull] show invoices: {i_note}"
          f"{' (empty)' if isinstance(invoices, list) and not invoices else ''}")

    if machines_by_id is None:
        print("WARNING: vast.ai show-machines unreachable this pass; live state unavailable. "
              "Earnings/balance may still have parsed (see above).")

    # --- account balance (from earnings.current.balance; quirk #2 trailer handled) ---
    account_balance = None
    if isinstance(earnings, dict):
        cur = earnings.get("current") or {}
        account_balance = cur.get("balance")
    if account_balance is None:
        print("WARNING: account balance unavailable (earnings query failed or lacked current.balance).")

    # --- assemble per-machine snapshot from the config spine (iterate fleet.yaml) ---
    machine_snaps: dict[str, dict] = {}
    for m in machines_cfg:
        vid = m.get("vast_ai_machine_id")
        if vid is None:
            continue
        mid = int(vid)
        hostname = m.get("hostname", str(mid))
        rec = machines_by_id.get(mid) if machines_by_id else None
        machine_snaps[str(mid)] = build_machine_snapshot(mid, hostname, rec)

    state = {
        "pulled_at": pulled_at,
        "account_balance_usd": account_balance,
        "earnings_window": {
            "sday": epoch_day_to_date(earnings.get("sday")) if isinstance(earnings, dict) else None,
            "eday": epoch_day_to_date(earnings.get("eday")) if isinstance(earnings, dict) else None,
            "limitation": "single-day window only; date-range CLI path crashes (dateutil "
                          "collections.Callable). Backfill not possible from this CLI build.",
        },
        "source_notes": {
            "show_machines": m_note,
            "show_earnings": e_note,
            "show_invoices": i_note,
            "cli_host": VASTAI_SSH,
        },
        "machines": machine_snaps,
    }

    # --- transition / outage detection vs previous snapshot ---
    prev_state = {}
    if STATE_PATH.exists():
        try:
            prev_state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            prev_state = {}
    prev_machines = prev_state.get("machines", {}) if isinstance(prev_state, dict) else {}

    all_warnings: list[str] = []
    for mid_str, snap in machine_snaps.items():
        warns = detect_transitions(int(mid_str), snap["hostname"],
                                   prev_machines.get(mid_str), snap, now)
        all_warnings.extend(warns)

    # --- revenue rows ---
    revenue_rows, rev_note = ([], "no earnings payload")
    if isinstance(earnings, dict):
        revenue_rows, rev_note = build_revenue_rows(earnings, id_to_host, pulled_at)

    # --- report ---
    print()
    bal_str = f"${account_balance:.2f}" if isinstance(account_balance, (int, float)) else "unavailable"
    print(f"account_balance_usd = {bal_str}")
    for mid_str, snap in machine_snaps.items():
        print(f"[{snap['hostname']}] id={mid_str} visible={snap['vastai_visible']} "
              f"gpu_cost={snap['listed_gpu_cost']} min_bid={snap['min_bid']} "
              f"rentals_running={snap['current_rentals_running']} "
              f"rel={snap['reliability2']} err={snap['error_description']} "
              f"end_date={snap['end_date_iso']}")
    print(f"\nrevenue: {rev_note}")
    if all_warnings:
        print(f"\n{len(all_warnings)} transition/outage WARNING(s):")
        for w in all_warnings:
            print(f"  WARNING: {w}")
    else:
        print("\nno transitions vs previous snapshot (or no previous snapshot).")

    if args.dry_run:
        print("\n[DRY-RUN] nothing written (fleet-state.json / history / revenue untouched).")
        return 0

    # --- writes (idempotent) ---
    FIN_DIR.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")
    print(f"\nWrote {STATE_PATH}")

    with HISTORY_PATH.open("a", encoding="utf-8", newline="\n") as f:
        for mid_str, snap in machine_snaps.items():
            running = snap.get("current_rentals_running")
            rented = None if running is None else int(_num(running)) >= 1
            f.write(json.dumps({
                "ts": pulled_at,
                "machine_id": int(mid_str),
                "rented": rented,
                "listed_gpu_cost": snap.get("listed_gpu_cost"),
                "reliability2": snap.get("reliability2"),
            }) + "\n")
    print(f"Appended {len(machine_snaps)} line(s) to {HISTORY_PATH}")

    if revenue_rows:
        n = upsert_revenue(revenue_rows)
        print(f"Upserted {n} revenue row(s) -> {REVENUE_PATH}")
    else:
        print(f"No revenue rows written ({rev_note}).")

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # an ingestion crash must be loud, not silent
        print(f"ERROR {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)
