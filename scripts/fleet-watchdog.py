#!/usr/bin/env python3
"""
Sartor fleet watchdog — durable, witness-side rental + host monitor.

WHY THIS EXISTS (2026-05-28 incident): rtxserver was powered off by a physical
button press at 18:54 EDT, killing an active ~29h rental and dropping reliability;
on reboot the listing price silently reverted $0.92->$1.00/GPU. Nothing detected
any of it and no alert reached Alton for ~3h. The host's own crons can't run on a
powered-off box — a watcher must live on the WITNESS (Rocinante), not the PATIENT.

This is the detection layer. It runs ONE pass per invocation (no sleep loop); the
Windows Scheduled Task provides the 10-min cadence. That loop-less shape is what
makes it survive reboots and not pin a process. It is state-change-only: it alerts
on transitions, never on steady state.

Each pass, for every machine in approved-pricing.yaml, it checks:
  1. Host-down       — ping + ssh probe (debounced: 2 consecutive fails = DOWN)
  2. Rental state    — current_rentals_running transition (start / drop)
  3. Price drift     — listed_gpu_cost vs approved value (the 2026-05-28 hole)
  4. Reliability     — reliability2 crossing 0.95 / 0.90, or single-run drop >0.01
  5. error_description going non-null (silently delists the machine)

Alerts route through notify():
  - inbox file ALWAYS (sartor/memory/inbox/rocinante/fleet-watchdog/<UTC>.md)
  - phone channel on ORANGE+  — pluggable; see notify_phone() (UNCONFIGURED until
    Alton picks a channel; the inbox file is written regardless).

ping()/ssh_probe() are lifted from sartor/memory/machines/check-registry.py and
inlined deliberately so this script has no cross-directory import to break under
Task Scheduler. PyYAML is the only non-stdlib dependency (already used by check-registry).
"""

from __future__ import annotations

import argparse
import json
import platform
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = REPO_ROOT / "sartor" / "memory" / "machines" / "REGISTRY.yaml"
APPROVED_PRICING_PATH = REPO_ROOT / "sartor" / "memory" / "business" / "approved-pricing.yaml"
STATE_PATH = REPO_ROOT / "sartor" / "memory" / "projects" / "fleet-watchdog-state.json"
INBOX_DIR = REPO_ROOT / "sartor" / "memory" / "inbox" / "rocinante" / "fleet-watchdog"
NOTIFY_CONFIG_PATH = REPO_ROOT / "sartor" / "memory" / "business" / "watchdog-notify.yaml"

# vast.ai CLI lives on gpuserver1 (authenticated). Querying via gpuserver1 means
# vast.ai state is observable even when rtxserver itself is down.
VASTAI_SSH = "alton@gpuserver1"
VASTAI_BIN = "~/.local/bin/vastai"

# Severity ordering for roll-up.
SEV_ORDER = {"green": 0, "yellow": 1, "orange": 2, "red": 3}


def utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# --- liveness probes (lifted from check-registry.py) ---------------------------

def ping(ip: str, timeout_s: int = 2) -> tuple[bool, str]:
    is_win = platform.system().lower().startswith("win")
    if is_win:
        cmd = ["ping", "-n", "1", "-w", str(timeout_s * 1000), ip]
    else:
        cmd = ["ping", "-c", "1", "-W", str(timeout_s), ip]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_s + 2)
    except subprocess.TimeoutExpired:
        return False, "timeout"
    except FileNotFoundError:
        return False, "ping binary not found"
    if result.returncode == 0:
        m = re.search(r"time[=<]\s*([\d.]+)\s*ms", result.stdout, re.IGNORECASE)
        return True, (f"{m.group(1)} ms" if m else "ok")
    return False, f"rc={result.returncode}"


def ssh_probe(ssh_path: str, timeout_s: int = 5) -> tuple[bool, str]:
    cmd = [
        "ssh", "-o", "BatchMode=yes", "-o", f"ConnectTimeout={timeout_s}",
        "-o", "StrictHostKeyChecking=accept-new", ssh_path, "true",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_s + 5)
    except subprocess.TimeoutExpired:
        return False, "ssh timeout"
    except FileNotFoundError:
        return False, "ssh binary not found"
    if result.returncode == 0:
        return True, "ok"
    err = (result.stderr or "").strip().splitlines()
    return False, (err[-1][:80] if err else f"rc={result.returncode}")


# --- vast.ai queries -----------------------------------------------------------

def vastai_show_machines() -> dict | None:
    """Return {machine_id(int): machine_record} or None if the query fails."""
    cmd = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8", VASTAI_SSH,
           f"{VASTAI_BIN} show machines --raw 2>/dev/null"]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=40,
                             encoding="utf-8", errors="replace")
    except subprocess.TimeoutExpired:
        return None
    if out.returncode != 0 or not out.stdout.strip():
        return None
    try:
        data = json.loads(out.stdout)
    except json.JSONDecodeError:
        return None
    machines = data.get("machines", []) if isinstance(data, dict) else data
    return {int(m["machine_id"]): m for m in machines if m.get("machine_id") is not None}


def vastai_offer(machine_id: int) -> dict | None:
    """Renter-facing offer record (has dph_total, reliability2). None if not visible."""
    cmd = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8", VASTAI_SSH,
           f"{VASTAI_BIN} search offers 'machine_id={machine_id}' --raw 2>/dev/null"]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=40,
                             encoding="utf-8", errors="replace")
    except subprocess.TimeoutExpired:
        return None
    if out.returncode != 0 or not out.stdout.strip():
        return None
    try:
        data = json.loads(out.stdout)
    except json.JSONDecodeError:
        return None
    return data[0] if data else None


# --- state ---------------------------------------------------------------------

def load_state(path: Path) -> dict:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}
    return {}


def save_state(state: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2), encoding="utf-8")


# --- core evaluation -----------------------------------------------------------

def evaluate_machine(mid: int, cfg: dict, registry_by_id: dict, prior: dict) -> tuple[dict, list]:
    """Return (new_state_for_machine, list_of_transition_events).

    Each event: {severity, kind, msg}. Transitions are computed against `prior`.
    """
    events = []
    reg = registry_by_id.get(mid, {})
    hostname = reg.get("hostname", str(mid))
    ip = reg.get("current_ip")
    ssh_path = reg.get("ssh_path")

    new = dict(prior) if prior else {}
    new["machine_id"] = mid
    new["hostname"] = hostname
    new["last_seen_utc"] = utc_iso()

    # 1. Host-down (debounced). Only meaningful if we have an IP.
    host_status = prior.get("host_status", "UP")
    strikes = int(prior.get("down_strikes", 0))
    if ip:
        ping_ok, ping_detail = ping(ip)
        probe_ok = ping_ok
        if ping_ok and ssh_path:
            ssh_ok, _ = ssh_probe(ssh_path)
            probe_ok = ssh_ok  # alive at IP but no shell still counts as trouble
        if probe_ok:
            if host_status == "DOWN":
                # RECOVERED
                down_since = prior.get("down_since_utc")
                dur = _duration_str(down_since)
                events.append({"severity": "yellow", "kind": "host_recovered",
                               "msg": f"{hostname} RECOVERED (was down {dur})."})
            host_status, strikes = "UP", 0
            new["down_since_utc"] = None
        else:
            strikes += 1
            if strikes >= 2 and host_status != "DOWN":
                # transition to DOWN
                rented = bool(prior.get("rented"))
                sev = "red" if rented else "orange"
                qualifier = "WHILE RENTAL ACTIVE" if rented else "no active rental"
                events.append({"severity": sev, "kind": "host_down",
                               "msg": f"{hostname} ({ip}) DOWN ({ping_detail}; {qualifier})."})
                host_status = "DOWN"
                new["down_since_utc"] = utc_iso()
    new["host_status"] = host_status
    new["down_strikes"] = strikes

    # vast.ai-derived checks. If the API is unreachable, skip them (don't crash,
    # don't false-alarm) — note it once.
    machines = _MACHINES_CACHE.get("data")
    rec = machines.get(mid) if machines else None
    offer = vastai_offer(mid) if machines is not None else None

    if machines is None:
        new["vastai_query"] = "unreachable"
        return new, events
    new["vastai_query"] = "ok"

    # 2. Rental state transition.
    running = int(rec.get("current_rentals_running") or 0) if rec else 0
    rented_now = running >= 1
    rented_was = bool(prior.get("rented", False))
    if rented_now and not rented_was:
        events.append({"severity": "yellow", "kind": "rental_started",
                       "msg": f"{hostname} RENTED (running={running})."})
    elif rented_was and not rented_now:
        # Normal churn if host is up + no error; only escalate if concurrent w/ down.
        sev = "orange" if host_status == "DOWN" else "yellow"
        events.append({"severity": sev, "kind": "rental_dropped",
                       "msg": f"{hostname} rental ENDED (running now 0)."})
    new["rented"] = rented_now

    # 3. Price drift — listed_gpu_cost vs approved (the 2026-05-28 hole).
    approved = cfg.get("approved_gpu_cost")
    tol = float(cfg.get("tolerance", 0.005))
    gpu_cost = rec.get("listed_gpu_cost") if rec else None
    if approved is not None and gpu_cost is not None:
        if abs(float(gpu_cost) - float(approved)) > tol:
            prev_cost = prior.get("gpu_cost")
            # alert only on a NEW drift (don't re-alert every run while drifted)
            if prev_cost is None or abs(float(prev_cost) - float(approved)) <= tol:
                events.append({"severity": "orange", "kind": "price_drift",
                               "msg": f"{hostname} price ${gpu_cost}/GPU != approved "
                                      f"${approved}/GPU (tol ${tol})."})
        new["gpu_cost"] = float(gpu_cost)

    # 4. Reliability regression.
    rel = offer.get("reliability2") if offer else (rec.get("reliability2") if rec else None)
    if rel is not None:
        rel = float(rel)
        prev_rel = prior.get("reliability2")
        if rel < 0.90 and (prev_rel is None or prev_rel >= 0.90):
            events.append({"severity": "red", "kind": "reliability",
                           "msg": f"{hostname} reliability {rel:.4f} < 0.90 (discoverability hit)."})
        elif rel < 0.95 and (prev_rel is None or prev_rel >= 0.95):
            events.append({"severity": "orange", "kind": "reliability",
                           "msg": f"{hostname} reliability {rel:.4f} < 0.95."})
        elif prev_rel is not None and (prev_rel - rel) > 0.01:
            events.append({"severity": "orange", "kind": "reliability",
                           "msg": f"{hostname} reliability dropped {prev_rel:.4f}->{rel:.4f} in one pass."})
        new["reliability2"] = rel

    # 5. error_description going non-null.
    err = rec.get("error_description") if rec else None
    prev_err = prior.get("error_description")
    if err and not prev_err:
        events.append({"severity": "red", "kind": "error_description",
                       "msg": f"{hostname} error_description set: '{err}' (silently delists machine)."})
    new["error_description"] = err

    return new, events


def _duration_str(since_iso: str | None) -> str:
    if not since_iso:
        return "unknown duration"
    try:
        since = datetime.strptime(since_iso, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return "unknown duration"
    delta = datetime.now(timezone.utc) - since
    mins = int(delta.total_seconds() // 60)
    if mins < 60:
        return f"{mins}m"
    return f"{mins // 60}h{mins % 60:02d}m"


_MACHINES_CACHE: dict = {}


# --- notification --------------------------------------------------------------

def notify_inbox(overall: str, events: list, run_iso: str) -> Path:
    INBOX_DIR.mkdir(parents=True, exist_ok=True)
    path = INBOX_DIR / f"{utc_stamp()}-{overall}.md"
    lines = [
        "---", "name: fleet-watchdog-alert", f"stamp_utc: {run_iso}",
        "type: watchdog-transition", f"overall: {overall}",
        "source: scripts/fleet-watchdog.py", "---", "",
        f"# Fleet watchdog — {overall.upper()} — {run_iso}", "",
    ]
    for e in events:
        lines.append(f"- **[{e['severity'].upper()}] {e['kind']}** — {e['msg']}")
    lines += ["", "## Provenance", "",
              "- Detector: `scripts/fleet-watchdog.py` (Rocinante, Windows Scheduled Task)",
              "- State: `sartor/memory/projects/fleet-watchdog-state.json`",
              "- Approved prices: `sartor/memory/business/approved-pricing.yaml`", ""]
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def notify_phone(overall: str, events: list, run_iso: str) -> str:
    """Phone-reaching alert on ORANGE+. Channel is pluggable via watchdog-notify.yaml.

    UNTIL ALTON PICKS A CHANNEL this is a no-op that returns 'unconfigured'. The
    inbox file is still written. This is the deliberate seam: tonight's lesson is
    that the phone leg is load-bearing, and the channel choice (Telegram / Pushover
    / Google OAuth / claude -p MCP) needs Alton's decision + credential setup.
    """
    if not NOTIFY_CONFIG_PATH.exists():
        return "unconfigured"
    try:
        cfg = yaml.safe_load(NOTIFY_CONFIG_PATH.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError:
        return "config-error"
    channel = (cfg.get("channel") or "none").lower()
    if channel == "none":
        return "unconfigured"
    # --- channel implementations wire in here once chosen ---
    # if channel == "telegram": return _send_telegram(cfg, overall, events, run_iso)
    # if channel == "pushover": return _send_pushover(cfg, overall, events, run_iso)
    return f"channel '{channel}' not yet implemented"


# --- main ----------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="Sartor fleet watchdog")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print decisions; do not write state or inbox/phone alerts.")
    ap.add_argument("--state", type=Path, default=STATE_PATH,
                    help="State file path (override for testing).")
    args = ap.parse_args()

    if not APPROVED_PRICING_PATH.exists():
        print(f"ERROR: {APPROVED_PRICING_PATH} not found", file=sys.stderr)
        return 2
    pricing = yaml.safe_load(APPROVED_PRICING_PATH.read_text(encoding="utf-8")) or {}
    machine_cfgs = pricing.get("machines", {}) or {}

    registry = yaml.safe_load(REGISTRY_PATH.read_text(encoding="utf-8")) or {}
    registry_by_id = {}
    for m in registry.get("machines", []):
        vid = m.get("vast_ai_machine_id")
        if vid is not None:
            registry_by_id[int(vid)] = m

    # One vast.ai fetch per pass, shared across machines.
    _MACHINES_CACHE["data"] = vastai_show_machines()

    prior_state = load_state(args.state)

    new_state = {}
    all_events = []
    for mid_str, cfg in machine_cfgs.items():
        mid = int(mid_str)
        prior = prior_state.get(str(mid), {})
        ns, events = evaluate_machine(mid, cfg or {}, registry_by_id, prior)
        new_state[str(mid)] = ns
        all_events.extend(events)
        host = ns.get("hostname", mid)
        print(f"[{host}] host={ns.get('host_status')} rented={ns.get('rented')} "
              f"gpu_cost={ns.get('gpu_cost')} rel={ns.get('reliability2')} "
              f"err={ns.get('error_description')} vastai={ns.get('vastai_query')} "
              f"-> {len(events)} event(s)")
        for e in events:
            print(f"    [{e['severity'].upper()}] {e['kind']}: {e['msg']}")

    overall = "green"
    for e in all_events:
        if SEV_ORDER[e["severity"]] > SEV_ORDER[overall]:
            overall = e["severity"]

    if args.dry_run:
        print(f"\n[DRY-RUN] overall={overall}; {len(all_events)} event(s); state/alerts NOT written.")
        return 0

    save_state(new_state, args.state)

    if all_events:
        inbox_path = notify_inbox(overall, all_events, utc_iso())
        print(f"\nWrote inbox alert: {inbox_path}")
        if SEV_ORDER[overall] >= SEV_ORDER["orange"]:
            phone_result = notify_phone(overall, all_events, utc_iso())
            print(f"Phone alert ({overall}): {phone_result}")
    else:
        print(f"\noverall=green; no transitions; state updated, no alert.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # never let a watchdog crash silently
        print(f"ERROR {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)
