#!/usr/bin/env python3
"""
Sartor fleet reconcile — doc-vs-live drift detector (on-demand, lighter than the watchdog).

WHY THIS EXISTS: the recurring failure is "the live vast.ai config drifts from what the docs
say, and nobody notices." fleet.yaml is the committed source of truth for each listing
(gpu_cost, min_gpus, end_date, marginal_floor_gpu_cost). vast.ai is the live reality. They
diverge silently — e.g. rtxserver's live $1.10/GPU vs approved $0.92 (decision D1, noted right
in fleet.yaml), or a boot-time price revert. The scheduled fleet-watchdog.py catches price
drift as a state TRANSITION; this tool is the on-demand, full-surface reconciliation you run
when you want a point-in-time answer to "does anything live disagree with the docs right now?"

It does NOT call vast.ai itself. It reads the live snapshot that vastai_pull.py writes to
data/financial/solar-inference/fleet-state.json. If that file is absent (pull hasn't run yet),
it says so and exits clean — it never crashes and never fabricates a live value.

OUTPUT: a drift report to stdout. If ANY drift is found, it ALSO writes a dated markdown alert
to sartor/memory/inbox/rocinante/fleet-reconcile/<UTC>.md so the drift is durable, not just a
terminal line that scrolls away.

PRIVACY: this tool compares CONFIG (prices as $/GPU/hr listing parameters, which live in the
committed fleet.yaml) against live listing parameters. Those are listing knobs, not revenue or
cost-basis dollars, so the inbox alert is fine. It does not read or emit the dollar ledger.

Style mirrors scripts/fleet-watchdog.py: argparse, --dry-run, pathlib, defensive I/O, PyYAML
the only non-stdlib dep.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

# Output carries em-dashes in human-readable lines. Make stdout/stderr tolerate a
# non-UTF-8 console (Windows Task Scheduler defaults to cp1252) instead of raising
# UnicodeEncodeError mid-run.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

REPO_ROOT = Path(__file__).resolve().parents[2]
FLEET_PATH = REPO_ROOT / "sartor" / "memory" / "business" / "fleet.yaml"
# Written by the sibling vastai_pull.py (may not exist yet — handled gracefully).
STATE_PATH = REPO_ROOT / "data" / "financial" / "solar-inference" / "fleet-state.json"
INBOX_DIR = REPO_ROOT / "sartor" / "memory" / "inbox" / "rocinante" / "fleet-reconcile"

SEV_ORDER = {"green": 0, "yellow": 1, "orange": 2, "red": 3}


def utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# --- live-state access (vastai_pull.py owns the schema; we read defensively) ---

def load_live_state(path: Path) -> dict | None:
    """Return the parsed fleet-state.json, or None if absent/unreadable.

    None means "no live state yet" — a clean, non-error condition (pull hasn't run).
    """
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def find_machine_state(state: dict, hostname: str, machine_id) -> dict | None:
    """Locate one machine's live record inside fleet-state.json.

    vastai_pull.py's exact layout is not yet fixed, so probe the plausible shapes:
      - {"machines": {"<hostname>": {...}}}        (keyed by hostname)
      - {"machines": {"<machine_id>": {...}}}      (keyed by id)
      - {"machines": [ {hostname/machine_id, ...} ]}  (list)
      - {"<hostname>": {...}}                       (flat, keyed by hostname)
    Returns the record dict or None.
    """
    if not isinstance(state, dict):
        return None
    mid_str = str(machine_id) if machine_id is not None else None

    containers = []
    if isinstance(state.get("machines"), (dict, list)):
        containers.append(state["machines"])
    containers.append(state)  # flat fallback

    for c in containers:
        if isinstance(c, dict):
            if hostname in c and isinstance(c[hostname], dict):
                return c[hostname]
            if mid_str and mid_str in c and isinstance(c[mid_str], dict):
                return c[mid_str]
        elif isinstance(c, list):
            for rec in c:
                if not isinstance(rec, dict):
                    continue
                if rec.get("hostname") == hostname:
                    return rec
                rid = rec.get("machine_id") or rec.get("vast_ai_machine_id")
                if mid_str and rid is not None and str(rid) == mid_str:
                    return rec
    return None


def _get_first(rec: dict, keys: tuple):
    """First present, non-null value among `keys` (case-insensitive) in rec."""
    low = { (k or "").lower(): v for k, v in rec.items() }
    for k in keys:
        v = low.get(k.lower())
        if v is not None:
            return v
    return None


def _to_float(v):
    try:
        return float(str(v).replace("$", "").replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def _norm_date(v) -> str | None:
    """Normalize an end_date to YYYY-MM-DD. vast.ai emits end_date as a Unix epoch
    (e.g. 1782843179 = 2026-06-30) while fleet.yaml carries an ISO date — without this
    the comparison false-alarms on representation, not real drift. Handles ISO strings,
    epoch seconds, and epoch milliseconds. Returns None if unparseable."""
    if v is None:
        return None
    # numeric -> epoch (seconds or millis)
    num = None
    if isinstance(v, (int, float)):
        num = float(v)
    elif isinstance(v, str) and v.strip().replace(".", "", 1).isdigit():
        num = float(v.strip())
    if num is not None:
        if num > 1e11:  # plausibly milliseconds
            num /= 1000.0
        try:
            return datetime.fromtimestamp(num, timezone.utc).date().isoformat()
        except (OverflowError, OSError, ValueError):
            return None
    # else an ISO-ish string: take the leading YYYY-MM-DD
    s = str(v).strip()
    return s[:10] if len(s) >= 10 and s[4] == "-" and s[7] == "-" else (s or None)


# Live field-name candidates (raw vast.ai names + normalized names a pull might emit).
LIVE_GPU_COST_KEYS = ("listed_gpu_cost", "live_gpu_cost", "gpu_cost", "dph_base", "gpu_cost_per_hr")
LIVE_NUM_GPUS_KEYS = ("num_gpus_in_offer", "num-gpus-in-offer", "num_gpus", "min_gpus", "gpus")
LIVE_END_DATE_KEYS = ("end_date", "listing_end_date", "expiry", "end")


# --- drift checks --------------------------------------------------------------

def reconcile_machine(m: dict, live: dict | None) -> tuple[list, dict]:
    """Compare one fleet.yaml machine against its live record.

    Returns (drifts, observed) where drifts is a list of
    {severity, field, doc, live, msg} and observed is a per-field doc/live table.
    """
    hostname = m.get("hostname", "?")
    machine_id = m.get("vast_ai_machine_id")
    listing = m.get("listing") or {}
    tol = float(listing.get("tolerance", 0.005))

    doc_gpu_cost = _to_float(listing.get("gpu_cost"))
    doc_min_gpus = listing.get("min_gpus")
    doc_end_date = listing.get("end_date")
    doc_floor = _to_float(listing.get("marginal_floor_gpu_cost"))

    drifts = []
    observed = {"hostname": hostname, "live_available": live is not None}

    if live is None:
        observed["note"] = "no live record for this machine in fleet-state.json"
        return drifts, observed

    live_gpu_cost = _to_float(_get_first(live, LIVE_GPU_COST_KEYS))
    live_num_gpus = _get_first(live, LIVE_NUM_GPUS_KEYS)
    live_end_date = _get_first(live, LIVE_END_DATE_KEYS)
    observed.update({
        "doc_gpu_cost": doc_gpu_cost, "live_gpu_cost": live_gpu_cost,
        "doc_min_gpus": doc_min_gpus, "live_num_gpus": live_num_gpus,
        "doc_end_date": doc_end_date, "live_end_date": live_end_date,
        "doc_floor": doc_floor,
    })

    # 1. gpu_cost drift (doc vs live), beyond tolerance.
    if doc_gpu_cost is not None and live_gpu_cost is not None:
        if abs(live_gpu_cost - doc_gpu_cost) > tol:
            drifts.append({
                "severity": "orange", "field": "gpu_cost",
                "doc": doc_gpu_cost, "live": live_gpu_cost,
                "msg": f"{hostname} listed ${live_gpu_cost}/GPU != approved "
                       f"${doc_gpu_cost}/GPU (tol ${tol}).",
            })

    # 2. min_gpus vs live offer gpu count.
    if doc_min_gpus is not None and live_num_gpus is not None:
        try:
            if int(live_num_gpus) != int(doc_min_gpus):
                # Dropping below min_gpus is a safety invariant on some hosts
                # (rtxserver single-card thermal pathology) — escalate.
                sev = "red" if int(live_num_gpus) < int(doc_min_gpus) else "yellow"
                drifts.append({
                    "severity": sev, "field": "min_gpus",
                    "doc": doc_min_gpus, "live": live_num_gpus,
                    "msg": f"{hostname} live offer has {live_num_gpus} GPU(s) != "
                           f"min_gpus {doc_min_gpus} in fleet.yaml.",
                })
        except (TypeError, ValueError):
            pass

    # 3. end_date drift. Normalize both sides (vast.ai emits epoch; fleet.yaml is ISO).
    doc_end_norm = _norm_date(doc_end_date)
    live_end_norm = _norm_date(live_end_date)
    observed["live_end_date_norm"] = live_end_norm
    if doc_end_norm and live_end_norm:
        if doc_end_norm != live_end_norm:
            drifts.append({
                "severity": "yellow", "field": "end_date",
                "doc": doc_end_norm, "live": live_end_norm,
                "msg": f"{hostname} listing end_date doc={doc_end_norm} vs "
                       f"live={live_end_norm} (raw live={live_end_date}).",
            })

    # 4. live price below the marginal floor — never list below electricity cost.
    if doc_floor is not None and live_gpu_cost is not None:
        if live_gpu_cost < doc_floor:
            drifts.append({
                "severity": "red", "field": "marginal_floor",
                "doc": doc_floor, "live": live_gpu_cost,
                "msg": f"{hostname} live ${live_gpu_cost}/GPU is BELOW marginal floor "
                       f"${doc_floor}/GPU — listing below electricity cost.",
            })

    return drifts, observed


# --- alert ---------------------------------------------------------------------

def write_inbox_alert(overall: str, all_drifts: list, run_iso: str) -> Path:
    INBOX_DIR.mkdir(parents=True, exist_ok=True)
    path = INBOX_DIR / f"{utc_stamp()}-{overall}.md"
    lines = [
        "---", "name: fleet-reconcile-alert", f"stamp_utc: {run_iso}",
        "type: doc-vs-live-drift", f"overall: {overall}",
        "source: scripts/fleet/reconcile.py", "---", "",
        f"# Fleet reconcile — {overall.upper()} — {run_iso}", "",
        "Doc-vs-live drift between `sartor/memory/business/fleet.yaml` (committed source of",
        "truth) and `data/financial/solar-inference/fleet-state.json` (live vast.ai snapshot).",
        "",
        "| host | field | severity | doc | live |",
        "|---|---|---|---|---|",
    ]
    for d in all_drifts:
        lines.append(f"| {d.get('host','?')} | {d['field']} | {d['severity'].upper()} "
                     f"| {d['doc']} | {d['live']} |")
    lines += ["", "## Detail", ""]
    for d in all_drifts:
        lines.append(f"- **[{d['severity'].upper()}] {d['field']}** — {d['msg']}")
    lines += ["", "## Fix", "",
              "Update the `listing:` block in fleet.yaml in the SAME action that runs the",
              "`vastai list machine` change (fleet.yaml editing rule), or re-apply the approved",
              "price live if the drift is a silent revert. Then re-run reconcile to confirm green.", ""]
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


# --- main ----------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="Sartor fleet reconcile (doc vs live drift)")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print the drift report; do not write the inbox alert.")
    ap.add_argument("--state", type=Path, default=STATE_PATH,
                    help="Live fleet-state.json path (override for testing).")
    args = ap.parse_args()

    if not FLEET_PATH.exists():
        print(f"ERROR: fleet config not found: {FLEET_PATH}", file=sys.stderr)
        return 2
    fleet = yaml.safe_load(FLEET_PATH.read_text(encoding="utf-8")) or {}
    machines = fleet.get("machines", []) or []

    live_state = load_live_state(args.state)
    if live_state is None:
        print(f"no live state yet — {args.state} absent or unreadable. "
              f"Run vastai_pull.py first; nothing to reconcile.")
        return 0

    all_drifts = []
    for m in machines:
        hostname = m.get("hostname", "?")
        machine_id = m.get("vast_ai_machine_id")
        live = find_machine_state(live_state, hostname, machine_id)
        drifts, observed = reconcile_machine(m, live)

        if not observed.get("live_available"):
            print(f"[{hostname}] no live record in fleet-state.json — skipped.")
            continue

        print(f"[{hostname}] gpu_cost doc={observed.get('doc_gpu_cost')} "
              f"live={observed.get('live_gpu_cost')} | "
              f"min_gpus doc={observed.get('doc_min_gpus')} live={observed.get('live_num_gpus')} | "
              f"end_date doc={observed.get('doc_end_date')} live={observed.get('live_end_date_norm')} | "
              f"floor={observed.get('doc_floor')} -> {len(drifts)} drift(s)")
        for d in drifts:
            d["host"] = hostname
            print(f"    [{d['severity'].upper()}] {d['field']}: {d['msg']}")
            all_drifts.append(d)

    overall = "green"
    for d in all_drifts:
        if SEV_ORDER[d["severity"]] > SEV_ORDER[overall]:
            overall = d["severity"]

    if not all_drifts:
        print("\noverall=green; no doc-vs-live drift.")
        return 0

    print(f"\noverall={overall}; {len(all_drifts)} drift(s).")
    if args.dry_run:
        print("[DRY-RUN] inbox alert NOT written.")
        return 0

    alert_path = write_inbox_alert(overall, all_drifts, utc_iso())
    print(f"Wrote drift alert: {alert_path}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"ERROR {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)
