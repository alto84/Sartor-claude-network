#!/usr/bin/env python3
# Poll vast.ai every 60s for rtxserver (machine 124192). Log status. Write
# inbox alert + GCal hint when first rental detected. Exits after rental hits
# (or after max_iterations as safety stop).
#
# Started 2026-05-26 to monitor rtxserver listing under the lowered $1.00/GPU
# (dph_total $2.67/hr) on-demand price. Designed to run for one shift while
# Alton is away.

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
STATE_FILE = REPO / "sartor" / "memory" / "projects" / "rental-watch-state.json"
LOG_FILE = REPO / "sartor" / "memory" / "projects" / "rental-watch.log"
INBOX_DIR = REPO / "sartor" / "memory" / "inbox" / "rocinante"
MACHINE_ID = 124192
POLL_INTERVAL_SEC = 60
MAX_ITERATIONS = 12 * 60  # 12 hours safety cap


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def log(msg: str) -> None:
    line = f"{now_iso()} {msg}"
    print(line, flush=True)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def query_offer() -> dict | None:
    cmd = [
        "ssh", "alton@gpuserver1",
        f"~/.local/bin/vastai search offers 'machine_id={MACHINE_ID}' --raw 2>/dev/null"
    ]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=30,
                             encoding="utf-8", errors="replace")
    except subprocess.TimeoutExpired:
        log("WARN ssh timeout")
        return None
    if out.returncode != 0:
        log(f"WARN ssh rc={out.returncode} stderr={out.stderr[:200]}")
        return None
    try:
        data = json.loads(out.stdout)
    except json.JSONDecodeError as e:
        log(f"WARN json decode {e}")
        return None
    if not data:
        log("WARN no offer found in marketplace (machine may be off, listed off, or already rented)")
        return None
    return data[0]


def query_machine_rentals() -> dict | None:
    cmd = ["ssh", "alton@gpuserver1", "~/.local/bin/vastai show machines --raw 2>/dev/null"]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=30,
                             encoding="utf-8", errors="replace")
    except subprocess.TimeoutExpired:
        return None
    if out.returncode != 0:
        return None
    try:
        data = json.loads(out.stdout)
    except json.JSONDecodeError:
        return None
    for m in data.get("machines", []):
        if m.get("machine_id") == MACHINE_ID:
            return m
    return None


def write_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def write_inbox_alert(machine: dict, offer: dict, contract_info: str) -> None:
    INBOX_DIR.mkdir(parents=True, exist_ok=True)
    fname = INBOX_DIR / f"rtxserver-rental-detected-{datetime.now().strftime('%Y%m%dT%H%M%S')}.md"
    body = f"""# rtxserver rental detected

**Detected:** {now_iso()}
**Machine:** 124192 (rtxserver, dual RTX PRO 6000 Blackwell)
**Price:** ${offer.get('dph_total', 0):.2f}/hr (lowered from $3.20 → $2.67 earlier 2026-05-26)

## Contract signal

{contract_info}

## Machine snapshot

- current_rentals_on_demand: {machine.get('current_rentals_on_demand')}
- current_rentals_reserved: {machine.get('current_rentals_reserved')}
- current_rentals_running: {machine.get('current_rentals_running')}
- current_rentals_resident: {machine.get('current_rentals_resident')}

## Action items

- None — rental is autonomous, no host intervention needed.
- Watch reliability over the next 4-12h to see if score climbs.
- If price feels too low (rental fills fast and consistent), consider raising.
"""
    fname.write_text(body, encoding="utf-8")
    log(f"INBOX alert written: {fname.name}")


def main() -> None:
    log(f"rental-watch start; machine_id={MACHINE_ID}; poll={POLL_INTERVAL_SEC}s; max_iter={MAX_ITERATIONS}")
    for i in range(MAX_ITERATIONS):
        offer = query_offer()
        machine = query_machine_rentals()

        state = {
            "last_check": now_iso(),
            "iteration": i,
            "offer_present": offer is not None,
            "rented_via_offer_flag": (offer is not None and offer.get("rented") is True),
            "current_rentals_running": machine.get("current_rentals_running") if machine else None,
            "current_rentals_on_demand": machine.get("current_rentals_on_demand") if machine else None,
            "current_rentals_reserved": machine.get("current_rentals_reserved") if machine else None,
            "dph_total": offer.get("dph_total") if offer else None,
            "reliability2": offer.get("reliability2") if offer else None,
        }
        write_state(state)

        running = state["current_rentals_running"] or 0
        on_demand = state["current_rentals_on_demand"] or 0
        rented_flag = state["rented_via_offer_flag"]

        log(f"iter={i:04d} rented_flag={rented_flag} running={running} on_demand={on_demand}")

        # Trip: machine has a NEW on-demand rental, OR offer.rented flips true,
        # OR offer disappears AND running>0
        rental_detected = rented_flag or on_demand >= 1 or (offer is None and running >= 1)
        if rental_detected:
            log(f"RENTAL DETECTED at iter={i}")
            contract_info = json.dumps(state, indent=2)
            if machine:
                write_inbox_alert(machine, offer or {}, contract_info)
            state["rental_detected_at"] = now_iso()
            write_state(state)
            return

        time.sleep(POLL_INTERVAL_SEC)

    log("max_iterations reached, exiting without detection")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("interrupted")
        sys.exit(130)
    except Exception as e:
        log(f"ERROR {type(e).__name__}: {e}")
        sys.exit(1)
