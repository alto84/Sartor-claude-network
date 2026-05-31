#!/usr/bin/env python3
"""
Sartor fleet watchdog -- SLIM witness-side liveness + price-drift monitor.

WHY THIS EXISTS (2026-05-28 incident): rtxserver was powered off by a physical
button press at 18:54 EDT, killing an active ~29h rental and dropping reliability;
on reboot the listing price silently reverted $0.92->$1.00/GPU. Nothing detected
any of it and no alert reached Alton for ~3h. The host's own crons can't run on a
powered-off box -- a watcher must live on the WITNESS (Rocinante), not the PATIENT.

SCOPE (slimmed 2026-05-31): each host now self-reports hardware + rental health
every 5 min via fleet-sentinel (scripts/peer-shared/fleet-sentinel/), writing a
heartbeat to sartor/memory/inbox/<host>/_sentinel-heartbeat.json and an NDJSON row
to sartor/memory/fleet-log/<host>.ndjson. That moved temp / reliability /
error_description / listing-expiry / marginal-floor / min_gpus monitoring ON-HOST,
with better fidelity (5-min vs 10-min) and no witness-side ssh-nvidia-smi load.

The witness keeps ONLY what a host cannot self-report -- the things that fail
precisely when the host is dead or that the host can't grade:
  1. Host-down       -- ping + ssh probe (debounced: 2 consecutive fails = DOWN).
                        A dead box can't self-report; this is the 2026-05-28 raison
                        d'etre. On confirmed down, a synthetic DOWN row is appended
                        to the host's fleet-log so the dashboard timeline shows the
                        outage as DOWN, not a blank gap.
  2. Rental state    -- current_rentals_running transition (start / drop). Witness
                        sees this independent of host liveness (queried via the auth
                        CLI on gpuserver1), so a rental drop is caught even mid-outage.
  3. Price drift     -- listed_gpu_cost vs approved listing.gpu_cost (the 2026-05-28
                        hole). The host knows only its live price; the witness owns
                        the config-vs-live comparison.
  4. Stale heartbeat -- read each inbox/<host>/_sentinel-heartbeat.json; if older
                        than SENTINEL_STALE_MIN while ping says UP -> YELLOW
                        (sentinel or the host->repo sync is broken). If ping ALSO
                        fails, the host-down path (#1) owns it instead.
  5. Witness DISK    -- Rocinante's own C: free space (ORANGE <15GB, RED <5GB).
                        "Witness with no witness": a full disk silently kills this
                        watchdog + the GitHub mirror + creds-sync + hours-log.

DROPPED (now host-owned, present every 5 min in the central fleet-log):
  - GPU temperature  (was #9: ssh nvidia-smi)   -> fleet-sentinel + the 30s gpu-temp-logger
  - reliability2     (was #4)                    -> fleet-sentinel NDJSON row
  - error_description(was #5)                    -> fleet-sentinel NDJSON row
  - listing expiry   (was #6)                    -> fleet-sentinel NDJSON row + dashboard tile
  - marginal floor   (was #7)                    -> fleet-sentinel NDJSON row
  - min_gpus         (was #8)                    -> fleet-sentinel NDJSON row
These are NOT lost: they live in the central log and a tiny Rocinante fleet-log
tailer (scripts/fleet/fleet_log_rollup.py, optional) can phone-alert on health=red
rows if the host's own debounced inbox alert is not enough.

This is the detection layer. It runs ONE pass per invocation (no sleep loop); the
Windows Scheduled Task provides the 10-min cadence. That loop-less shape is what
makes it survive reboots and not pin a process. It is state-change-only on the
transition checks: it alerts on transitions, never on steady state.

Alerts route through notify():
  - inbox file ALWAYS (sartor/memory/inbox/rocinante/fleet-watchdog/<UTC>.md)
  - fleet-health.json ALWAYS (data/financial/solar-inference/fleet-health.json) -- the
    dashboard reads this for live fleet health.
  - phone channel on ORANGE+ -- Pushover or Telegram, configured via watchdog-notify.yaml
    (UNCONFIGURED until Alton drops a token; inbox file + health json are written regardless).

Config source: sartor/memory/business/fleet.yaml (canonical). Falls back to the legacy
business/approved-pricing.yaml if fleet.yaml is absent. Network identity (ssh_path, ip)
still comes from machines/REGISTRY.yaml. ping()/ssh_probe() are inlined deliberately so this
script has no cross-directory import to break under Task Scheduler. PyYAML is the only
non-stdlib dependency.
"""

from __future__ import annotations

import argparse
import json
import platform
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = REPO_ROOT / "sartor" / "memory" / "machines" / "REGISTRY.yaml"
FLEET_PATH = REPO_ROOT / "sartor" / "memory" / "business" / "fleet.yaml"
APPROVED_PRICING_PATH = REPO_ROOT / "sartor" / "memory" / "business" / "approved-pricing.yaml"  # legacy fallback
STATE_PATH = REPO_ROOT / "sartor" / "memory" / "projects" / "fleet-watchdog-state.json"
INBOX_DIR = REPO_ROOT / "sartor" / "memory" / "inbox" / "rocinante" / "fleet-watchdog"
NOTIFY_CONFIG_PATH = REPO_ROOT / "sartor" / "memory" / "business" / "watchdog-notify.yaml"
# Per-host inbox roots (where fleet-sentinel writes _sentinel-heartbeat.json). The
# directory name is the inbox folder, which for rtxserver is its long hostname.
INBOX_ROOT = REPO_ROOT / "sartor" / "memory" / "inbox"
# Central fleet-log the hosts self-write; the witness appends a synthetic DOWN row here.
FLEET_LOG_DIR = REPO_ROOT / "sartor" / "memory" / "fleet-log"
# Health snapshot for the dashboard. data/ is gitignored (local), which is correct: live
# fleet health is operational data, and the dashboard runs locally on Rocinante.
HEALTH_PATH = REPO_ROOT / "data" / "financial" / "solar-inference" / "fleet-health.json"

# vast.ai CLI lives on gpuserver1 (authenticated). Querying via gpuserver1 means
# vast.ai state is observable even when rtxserver itself is down.
VASTAI_SSH = "alton@gpuserver1"
VASTAI_BIN = "~/.local/bin/vastai"

# Witness-disk thresholds (the host THIS runs on).
DISK_ORANGE_GB = 15.0
DISK_RED_GB = 5.0

# Sentinel heartbeat staleness. fleet-sentinel ticks every 5 min; gather_mirror.sh
# pushes the heartbeat to the repo every 4h, so the witness sees it at the sync
# cadence, not the tick cadence. 5h covers one missed 4h sync plus slack; beyond
# that, the sentinel or the host->repo push leg is genuinely broken.
SENTINEL_STALE_MIN = 300

# Severity ordering for roll-up.
SEV_ORDER = {"green": 0, "yellow": 1, "orange": 2, "red": 3}


def utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# --- liveness probes (inlined from check-registry.py) --------------------------

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


# --- config loading ------------------------------------------------------------

def load_fleet_config() -> dict:
    """Return {machine_id(int): listing+monitoring cfg} from fleet.yaml.

    fleet.yaml is canonical. cfg per machine carries the flattened fields the slim
    witness needs: approved_gpu_cost, tolerance, hostname, inbox_dir. (The dropped
    checks' fields -- end_date, min_gpus, marginal_floor, temp thresholds -- are no
    longer read here; the host self-reports them via fleet-sentinel.)
    Falls back to the legacy approved-pricing.yaml (price/tolerance only) if fleet.yaml
    is absent, so the watchdog degrades rather than dying.
    """
    if FLEET_PATH.exists():
        fleet = yaml.safe_load(FLEET_PATH.read_text(encoding="utf-8")) or {}
        cfgs = {}
        for m in fleet.get("machines", []) or []:
            mid = m.get("vast_ai_machine_id")
            if mid is None or m.get("status") == "retired":
                continue
            listing = m.get("listing", {}) or {}
            cfgs[int(mid)] = {
                "hostname": m.get("hostname", str(mid)),
                "approved_gpu_cost": listing.get("gpu_cost"),
                "tolerance": float(listing.get("tolerance", 0.005)),
            }
        if cfgs:
            return cfgs
    # legacy fallback
    pricing = yaml.safe_load(APPROVED_PRICING_PATH.read_text(encoding="utf-8")) or {}
    cfgs = {}
    for mid_str, c in (pricing.get("machines", {}) or {}).items():
        cfgs[int(mid_str)] = {
            "approved_gpu_cost": (c or {}).get("approved_gpu_cost"),
            "tolerance": float((c or {}).get("tolerance", 0.005)),
        }
    return cfgs


def disk_free_gb(path: Path = REPO_ROOT) -> float | None:
    try:
        return shutil.disk_usage(str(path)).free / (1024 ** 3)
    except OSError:
        return None


# --- sentinel heartbeat (host self-report liveness) ----------------------------

def _inbox_dir_for(hostname: str, reg: dict) -> str:
    """Resolve the inbox folder name fleet-sentinel writes its heartbeat under.

    The inbox folder uses the host's long/canonical name in a few cases (rtxserver's
    inbox dir is `rtxpro6000server`). Probe: the fleet hostname, then registry aliases,
    then the registry hostname -- first one that exists as a directory wins; otherwise
    fall back to the fleet hostname (the heartbeat just reads as absent until deployed).
    """
    candidates = [hostname]
    candidates.extend(reg.get("aliases") or [])
    reg_host = reg.get("hostname")
    if reg_host:
        candidates.append(reg_host)
    # Prefer a candidate that actually HAS the sentinel heartbeat -- an empty stray dir
    # for one alias must never shadow the alias where the heartbeat really lives. (Fix for
    # the 2026-05-31 rtxserver bug: an empty inbox/rtxserver/ short-circuited resolution
    # before reaching inbox/rtxpro6000server/, silently disabling the stale-heartbeat check
    # for rtxserver -- the exact 2026-05-22 'up but self-monitor broken' scenario.)
    for name in candidates:
        if name and (INBOX_ROOT / name / "_sentinel-heartbeat.json").exists():
            return name
    for name in candidates:
        if name and (INBOX_ROOT / name).is_dir():
            return name
    return hostname


def read_sentinel_heartbeat_age_min(inbox_dir_name: str) -> float | None:
    """Age in minutes of inbox/<host>/_sentinel-heartbeat.json, or None if absent/unreadable.

    Prefers the in-file `ts` (UTC ISO) the sentinel writes; falls back to file mtime.
    None means "no heartbeat to grade yet" -- treated as not-stale until the sentinel is
    deployed, so this check never false-alarms before the host-side builder lands.
    """
    hb = INBOX_ROOT / inbox_dir_name / "_sentinel-heartbeat.json"
    if not hb.exists():
        return None
    ts = None
    try:
        data = json.loads(hb.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            ts = data.get("ts") or data.get("ts_utc") or data.get("timestamp")
    except (json.JSONDecodeError, OSError):
        ts = None
    if ts:
        for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S%z"):
            try:
                t = datetime.strptime(str(ts), fmt)
                if t.tzinfo is None:
                    t = t.replace(tzinfo=timezone.utc)
                return (datetime.now(timezone.utc) - t).total_seconds() / 60.0
            except ValueError:
                continue
    try:
        mtime = datetime.fromtimestamp(hb.stat().st_mtime, timezone.utc)
        return (datetime.now(timezone.utc) - mtime).total_seconds() / 60.0
    except OSError:
        return None


def append_synthetic_down_row(hostname: str, machine_id: int, rented: bool) -> None:
    """Append a witness-authored DOWN row to the host's central fleet-log.

    When the host is dead it cannot write its own NDJSON, leaving a blank gap in the
    dashboard timeline. The witness fills the gap with a single explicit DOWN row so
    the outage renders as DOWN, not missing data. Schema-compatible with the
    host-written rows (the fields the host can't supply are null); `source: witness`
    distinguishes it. Best-effort: any I/O error is swallowed (a logging failure must
    never take down the liveness detector).
    """
    if _DRY_RUN:
        print(f"    [DRY-RUN] would append synthetic DOWN row to fleet-log/{hostname}.ndjson")
        return
    try:
        FLEET_LOG_DIR.mkdir(parents=True, exist_ok=True)
        row = {
            "ts": utc_iso(),
            "host": hostname,
            "machine_id": machine_id,
            "rented": rented,
            "gpu_util": None,
            "temp_max": None,
            "power_w": None,
            "est_kwh_interval": None,
            "list_price": None,
            "min_bid": None,
            "reliability2": None,
            "earn_hour": None,
            "earn_day": None,
            "est_earn_interval": None,
            "stale_docker": None,
            "stale_vm": None,
            "error_description": None,
            "vastai_ok": None,
            "health": "red",
            "source": "witness",
            "note": "host-down (witness synthetic row)",
        }
        path = FLEET_LOG_DIR / f"{hostname}.ndjson"
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row) + "\n")
    except OSError:
        pass


# --- core evaluation -----------------------------------------------------------

def evaluate_machine(mid: int, cfg: dict, registry_by_id: dict, prior: dict) -> tuple[dict, list]:
    """Return (new_state_for_machine, list_of_transition_events).

    Each event: {severity, kind, msg}. Transitions are computed against `prior`.
    Slim witness scope: host-down, rental transition, price drift, stale heartbeat.
    """
    events = []
    reg = registry_by_id.get(mid, {})
    hostname = cfg.get("hostname") or reg.get("hostname", str(mid))
    ip = reg.get("current_ip")
    ssh_path = reg.get("ssh_path")
    inbox_dir_name = _inbox_dir_for(hostname, reg)

    # Carry forward ONLY the witness-owned state keys. Deliberately drop any host-owned
    # keys a prior (pre-slim) state file may hold (reliability2, gpu_temp_c, temp_hot_strikes,
    # error_description, days_to_expiry, below_floor, min_gpus_bad) so the dashboard's
    # watchdog-state fallback returns None for them rather than a stale value -- the host
    # self-reports those now via fleet-state.json / fleet-log.
    _CARRY = ("host_status", "down_strikes", "down_since_utc", "rented", "gpu_cost",
              "sentinel_stale_prev")
    new = {k: prior[k] for k in _CARRY if prior and k in prior}
    new["machine_id"] = mid
    new["hostname"] = hostname
    new["last_seen_utc"] = utc_iso()

    # 1. Host-down (debounced). Only meaningful if we have an IP.
    host_status = prior.get("host_status", "UP")
    strikes = int(prior.get("down_strikes", 0))
    host_up = False
    just_went_down = False
    if ip:
        ping_ok, ping_detail = ping(ip)
        probe_ok = ping_ok
        if ping_ok and ssh_path:
            ssh_ok, _ = ssh_probe(ssh_path)
            probe_ok = ssh_ok  # alive at IP but no shell still counts as trouble
        if probe_ok:
            if host_status == "DOWN":
                down_since = prior.get("down_since_utc")
                dur = _duration_str(down_since)
                events.append({"severity": "yellow", "kind": "host_recovered",
                               "msg": f"{hostname} RECOVERED (was down {dur})."})
            host_status, strikes = "UP", 0
            host_up = True
            new["down_since_utc"] = None
        else:
            strikes += 1
            if strikes >= 2 and host_status != "DOWN":
                rented = bool(prior.get("rented"))
                sev = "red" if rented else "orange"
                qualifier = "WHILE RENTAL ACTIVE" if rented else "no active rental"
                events.append({"severity": sev, "kind": "host_down",
                               "msg": f"{hostname} ({ip}) DOWN ({ping_detail}; {qualifier})."})
                host_status = "DOWN"
                new["down_since_utc"] = utc_iso()
                just_went_down = True
    new["host_status"] = host_status
    new["down_strikes"] = strikes

    # vast.ai-derived checks (rental + price). If the API is unreachable, skip them.
    machines = _MACHINES_CACHE.get("data")
    rec = machines.get(mid) if machines else None

    if machines is None:
        new["vastai_query"] = "unreachable"
        # Still grade the heartbeat + emit a synthetic DOWN row if the host just died.
        _heartbeat_check(new, events, inbox_dir_name, host_status, host_up)
        if just_went_down:
            append_synthetic_down_row(hostname, mid, bool(prior.get("rented")))
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
        sev = "orange" if host_status == "DOWN" else "yellow"
        events.append({"severity": sev, "kind": "rental_dropped",
                       "msg": f"{hostname} rental ENDED (running now 0)."})
    new["rented"] = rented_now

    # 3. Price drift -- listed_gpu_cost vs approved. The config-vs-live comparison the
    #    host can't make (it only knows the live value).
    approved = cfg.get("approved_gpu_cost")
    tol = float(cfg.get("tolerance", 0.005))
    gpu_cost = rec.get("listed_gpu_cost") if rec else None
    if approved is not None and gpu_cost is not None:
        if abs(float(gpu_cost) - float(approved)) > tol:
            prev_cost = prior.get("gpu_cost")
            if prev_cost is None or abs(float(prev_cost) - float(approved)) <= tol:
                events.append({"severity": "orange", "kind": "price_drift",
                               "msg": f"{hostname} price ${gpu_cost}/GPU != approved "
                                      f"${approved}/GPU (tol ${tol})."})
        new["gpu_cost"] = float(gpu_cost)

    # 4. Stale sentinel heartbeat (host self-report broke while host is up).
    _heartbeat_check(new, events, inbox_dir_name, host_status, host_up)

    # Synthetic DOWN row on the transition into DOWN (timeline gap-filler).
    if just_went_down:
        append_synthetic_down_row(hostname, mid, rented_was)

    return new, events


def _heartbeat_check(new: dict, events: list, inbox_dir_name: str,
                     host_status: str, host_up: bool) -> None:
    """YELLOW if the host pings UP but its sentinel heartbeat is stale.

    A stale heartbeat while the host is reachable means the sentinel timer died or the
    host->repo sync (gather_mirror.sh push leg) broke -- the central log is silently
    going dark even though the box is alive. If the host is DOWN, #1 owns it (a dead
    host obviously can't heartbeat), so we don't double-alert.
    """
    age_min = read_sentinel_heartbeat_age_min(inbox_dir_name)
    new["sentinel_age_min"] = round(age_min, 1) if age_min is not None else None
    if age_min is None or host_status == "DOWN" or not host_up:
        return
    if age_min >= SENTINEL_STALE_MIN:
        prev_stale = bool(new.get("sentinel_stale_prev"))
        if not prev_stale:
            events.append({"severity": "yellow", "kind": "sentinel_stale",
                           "msg": f"{new.get('hostname')} sentinel heartbeat "
                                  f"{age_min:.0f}m old (>= {SENTINEL_STALE_MIN}m) while host UP "
                                  f"-- sentinel or host->repo sync broken."})
        new["sentinel_stale_prev"] = True
    else:
        new["sentinel_stale_prev"] = False


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
# Set True by main(--dry-run) so the synthetic-DOWN fleet-log append is a no-op
# (just prints what it would do) instead of mutating the committed central log.
_DRY_RUN = False


def standing_conditions(cfg: dict, ns: dict) -> list:
    """Invariant violations TRUE right now, regardless of transition.

    The transition checks in evaluate_machine fire once when a signal crosses a
    threshold -- correct for noisy signals but WRONG for a standing invariant like a
    price that should always read as wrong while it's wrong.
    (Bug caught 2026-05-29: a price already-drifted in the state file never re-alerted,
    so `overall` showed green while rtxserver sat at $1.10 vs approved $0.92.)

    Slim scope: host-down, price-drift, and a stale sentinel heartbeat. These always
    feed `overall` severity + the health snapshot every pass. Inbox re-alerting is
    throttled separately (see main) so health stays accurate without 10-minute spam.
    """
    out = []
    host = ns.get("hostname")
    if ns.get("host_status") == "DOWN":
        sev = "red" if ns.get("rented") else "orange"
        out.append({"severity": sev, "kind": "host_down", "msg": f"{host} is DOWN."})
    approved = cfg.get("approved_gpu_cost")
    tol = float(cfg.get("tolerance", 0.005))
    gc = ns.get("gpu_cost")
    if approved is not None and gc is not None and abs(float(gc) - float(approved)) > tol:
        out.append({"severity": "orange", "kind": "price_drift",
                    "msg": f"{host} list ${gc}/GPU != approved ${approved}/GPU (standing drift)."})
    if ns.get("sentinel_stale_prev"):
        out.append({"severity": "yellow", "kind": "sentinel_stale",
                    "msg": f"{host} sentinel heartbeat stale "
                           f"({ns.get('sentinel_age_min')}m) while host UP (standing)."})
    return out


# Re-nag cadence for a persistent standing condition (avoid 10-min inbox spam).
STANDING_RENAG_HOURS = 12


# --- notification --------------------------------------------------------------

def notify_inbox(overall: str, events: list, run_iso: str) -> Path:
    INBOX_DIR.mkdir(parents=True, exist_ok=True)
    path = INBOX_DIR / f"{utc_stamp()}-{overall}.md"
    lines = [
        "---", "name: fleet-watchdog-alert", f"stamp_utc: {run_iso}",
        "type: watchdog-transition", f"overall: {overall}",
        "source: scripts/fleet-watchdog.py", "---", "",
        f"# Fleet watchdog -- {overall.upper()} -- {run_iso}", "",
    ]
    for e in events:
        lines.append(f"- **[{e['severity'].upper()}] {e['kind']}** -- {e['msg']}")
    lines += ["", "## Provenance", "",
              "- Detector: `scripts/fleet-watchdog.py` (Rocinante, Windows Scheduled Task)",
              "- Scope: host-down, rental transition, price drift, stale sentinel heartbeat, witness disk",
              "- State: `sartor/memory/projects/fleet-watchdog-state.json`",
              "- Config: `sartor/memory/business/fleet.yaml`",
              "- Host hardware/rental detail self-reported in `sartor/memory/fleet-log/<host>.ndjson`", ""]
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def write_health(overall: str, new_state: dict, events: list, standing: list,
                 disk_gb: float | None, run_iso: str) -> Path:
    """Dashboard-facing health snapshot. Written every pass (green included).

    Carries the witness-owned fields (host_status, rented, gpu_cost, sentinel age).
    The dropped fields (reliability2, gpu_temp_c, error_description, days_to_expiry,
    below_floor, min_gpus_bad) are no longer witness-sourced; the dashboard reads them
    from fleet-state.json (the vast.ai pull) / fleet-log instead and tolerates their
    absence here (it already null-checks each one).
    """
    HEALTH_PATH.parent.mkdir(parents=True, exist_ok=True)
    machines = {}
    for mid, ns in new_state.items():
        machines[mid] = {
            "hostname": ns.get("hostname"),
            "host_status": ns.get("host_status"),
            "rented": ns.get("rented"),
            "gpu_cost": ns.get("gpu_cost"),
            "sentinel_age_min": ns.get("sentinel_age_min"),
        }
    payload = {
        "as_of": run_iso,
        "overall": overall,
        "disk_free_gb": round(disk_gb, 1) if disk_gb is not None else None,
        "events": [{"severity": e["severity"], "kind": e["kind"], "msg": e["msg"]} for e in events],
        "standing": [{"severity": s["severity"], "kind": s["kind"], "msg": s["msg"]} for s in standing],
        "machines": machines,
    }
    HEALTH_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return HEALTH_PATH


def notify_phone(overall: str, events: list, run_iso: str) -> str:
    """Phone-reaching alert on ORANGE+. Channel via watchdog-notify.yaml.

    Implemented channels: pushover, telegram. Both are HTTP-only (a script can do
    them with no MCP/OAuth). UNCONFIGURED until Alton drops a token in
    watchdog-notify.yaml; the inbox file + health json are written regardless.
    """
    if not NOTIFY_CONFIG_PATH.exists():
        return "unconfigured"
    try:
        cfg = yaml.safe_load(NOTIFY_CONFIG_PATH.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError:
        return "config-error"
    channel = (cfg.get("channel") or "none").lower()
    title = f"Sartor fleet: {overall.upper()}"
    body = "\n".join(f"[{e['severity'].upper()}] {e['kind']}: {e['msg']}" for e in events) or "(no detail)"
    body = f"{title} {run_iso}\n{body}"
    try:
        if channel == "pushover":
            data = urllib.parse.urlencode({
                "token": cfg["pushover_token"], "user": cfg["pushover_user"],
                "title": title, "message": body[:1000],
                "priority": "1" if overall == "red" else "0",
            }).encode()
            req = urllib.request.Request("https://api.pushover.net/1/messages.json", data=data)
            with urllib.request.urlopen(req, timeout=15) as r:
                return f"pushover {r.status}"
        if channel == "telegram":
            data = urllib.parse.urlencode({
                "chat_id": cfg["telegram_chat_id"], "text": body[:4000],
            }).encode()
            url = f"https://api.telegram.org/bot{cfg['telegram_bot_token']}/sendMessage"
            with urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=15) as r:
                return f"telegram {r.status}"
    except Exception as e:  # never let the notify leg crash the watchdog
        return f"channel '{channel}' error: {type(e).__name__}"
    if channel == "none":
        return "unconfigured"
    return f"channel '{channel}' not implemented"


# --- main ----------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="Sartor fleet watchdog (slim)")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print decisions; do not write state, inbox, health, phone, or fleet-log.")
    ap.add_argument("--state", type=Path, default=STATE_PATH,
                    help="State file path (override for testing).")
    args = ap.parse_args()

    if not FLEET_PATH.exists() and not APPROVED_PRICING_PATH.exists():
        print(f"ERROR: neither {FLEET_PATH} nor {APPROVED_PRICING_PATH} found", file=sys.stderr)
        return 2
    machine_cfgs = load_fleet_config()
    if not machine_cfgs:
        print("ERROR: no machines in config", file=sys.stderr)
        return 2

    registry = yaml.safe_load(REGISTRY_PATH.read_text(encoding="utf-8")) or {}
    registry_by_id = {}
    for m in registry.get("machines", []):
        vid = m.get("vast_ai_machine_id")
        if vid is not None:
            registry_by_id[int(vid)] = m

    # One vast.ai fetch per pass, shared across machines.
    _MACHINES_CACHE["data"] = vastai_show_machines()

    # In --dry-run, suppress the synthetic-DOWN fleet-log write (it's a side effect).
    global _DRY_RUN
    _DRY_RUN = args.dry_run

    prior_state = load_state(args.state)
    new_state = {}
    all_events = []      # transitions (one-shot inbox alerts)
    all_standing = []    # invariant violations true right now (always feed overall + health)
    for mid, cfg in machine_cfgs.items():
        prior = prior_state.get(str(mid), {})
        ns, events = evaluate_machine(mid, cfg, registry_by_id, prior)
        new_state[str(mid)] = ns
        all_events.extend(events)
        standing = standing_conditions(cfg, ns)
        all_standing.extend(standing)
        host = ns.get("hostname", mid)
        print(f"[{host}] host={ns.get('host_status')} rented={ns.get('rented')} "
              f"gpu_cost={ns.get('gpu_cost')} hb_age={ns.get('sentinel_age_min')}m "
              f"vastai={ns.get('vastai_query')} "
              f"-> {len(events)} event(s), {len(standing)} standing")
        for e in events:
            print(f"    [{e['severity'].upper()}] {e['kind']}: {e['msg']} (transition)")
        for s in standing:
            print(f"    [{s['severity'].upper()}] {s['kind']}: {s['msg']}")

    # 5. Witness self-disk (Rocinante). "Witness with no witness": a full C: kills
    #    this watchdog + the GitHub mirror + creds-sync + hours-log, all silently.
    disk_gb = disk_free_gb()
    prior_witness = prior_state.get("_witness", {})
    if disk_gb is not None:
        print(f"[rocinante] disk_free={disk_gb:.1f}GB")
        if disk_gb < DISK_RED_GB:
            all_events.append({"severity": "red", "kind": "witness_disk",
                               "msg": f"Rocinante C: only {disk_gb:.1f}GB free (< {DISK_RED_GB}GB) -- witness layer at risk."})
        elif disk_gb < DISK_ORANGE_GB and not prior_witness.get("disk_alerted"):
            all_events.append({"severity": "orange", "kind": "witness_disk",
                               "msg": f"Rocinante C: {disk_gb:.1f}GB free (< {DISK_ORANGE_GB}GB)."})

    # overall reflects BOTH transitions and standing conditions, so health is never
    # green while a known invariant (e.g. price drift) is violated.
    overall = "green"
    for e in all_events + all_standing:
        if SEV_ORDER[e["severity"]] > SEV_ORDER[overall]:
            overall = e["severity"]
    standing_sev = "green"
    for s in all_standing:
        if SEV_ORDER[s["severity"]] > SEV_ORDER[standing_sev]:
            standing_sev = s["severity"]

    def _stale(iso: str | None, hours: float) -> bool:
        if not iso:
            return True
        try:
            t = datetime.strptime(iso, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        except ValueError:
            return True
        return (datetime.now(timezone.utc) - t).total_seconds() >= hours * 3600

    last_standing = prior_witness.get("last_standing_alert_utc")
    renag_due = SEV_ORDER[standing_sev] >= SEV_ORDER["orange"] and _stale(last_standing, STANDING_RENAG_HOURS)

    if args.dry_run:
        print(f"\n[DRY-RUN] overall={overall}; {len(all_events)} transition(s), "
              f"{len(all_standing)} standing; renag_due={renag_due}; nothing written.")
        return 0

    will_alert = bool(all_events) or renag_due
    new_standing_alert = utc_iso() if (will_alert and SEV_ORDER[standing_sev] >= SEV_ORDER["orange"]) else last_standing
    new_state["_witness"] = {
        "disk_free_gb": round(disk_gb, 1) if disk_gb is not None else None,
        "disk_alerted": (disk_gb is not None and disk_gb < DISK_ORANGE_GB),
        "last_standing_alert_utc": new_standing_alert,
    }

    save_state(new_state, args.state)
    write_health(overall, {k: v for k, v in new_state.items() if k != "_witness"},
                 all_events, all_standing, disk_gb, utc_iso())

    alert_items = all_events + all_standing
    if will_alert and alert_items:
        inbox_path = notify_inbox(overall, alert_items, utc_iso())
        why = "transition" if all_events else f"standing re-nag (>{STANDING_RENAG_HOURS}h)"
        print(f"\nWrote inbox alert ({why}): {inbox_path} [{len(all_events)} transition, {len(all_standing)} standing]")
        if SEV_ORDER[overall] >= SEV_ORDER["orange"]:
            phone_result = notify_phone(overall, alert_items, utc_iso())
            print(f"Phone alert ({overall}): {phone_result}")
    else:
        print(f"\noverall={overall}; {len(all_standing)} standing (re-nag not due), no new transition; state + health updated.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # never let a watchdog crash silently
        print(f"ERROR {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)
