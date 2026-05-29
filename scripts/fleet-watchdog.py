#!/usr/bin/env python3
"""
Sartor fleet watchdog -- durable, witness-side rental + host + thermal monitor.

WHY THIS EXISTS (2026-05-28 incident): rtxserver was powered off by a physical
button press at 18:54 EDT, killing an active ~29h rental and dropping reliability;
on reboot the listing price silently reverted $0.92->$1.00/GPU. Nothing detected
any of it and no alert reached Alton for ~3h. The host's own crons can't run on a
powered-off box -- a watcher must live on the WITNESS (Rocinante), not the PATIENT.

This is the detection layer. It runs ONE pass per invocation (no sleep loop); the
Windows Scheduled Task provides the 10-min cadence. That loop-less shape is what
makes it survive reboots and not pin a process. It is state-change-only on the
transition checks: it alerts on transitions, never on steady state.

Each pass, for every machine in fleet.yaml, it checks:
  1. Host-down       -- ping + ssh probe (debounced: 2 consecutive fails = DOWN)
  2. Rental state    -- current_rentals_running transition (start / drop)
  3. Price drift     -- listed_gpu_cost vs approved listing.gpu_cost (the 2026-05-28 hole)
  4. Reliability     -- reliability2 crossing 0.95 / 0.90, or single-run drop >0.01
  5. error_description going non-null (silently delists the machine)
  6. Listing EXPIRY  -- end_date within 14d (YELLOW) / 7d (ORANGE)  [added 2026-05-28]
  7. Marginal FLOOR  -- live price below listing.marginal_floor_gpu_cost = renting below   [added]
                        electricity cost to chase a tax deduction (RED; loses real money)
  8. min_gpus        -- live min_chunk below listing.min_gpus = single-card thermal         [added]
                        exposure on rtxserver (RED safety invariant)
  9. GPU TEMP        -- ssh nvidia-smi; >= monitoring.gpu_temp_alert_c (ORANGE, 2 passes),   [added]
                        >= gpu_temp_crit_c (RED). The 83C-under-renter blind spot.
 10. Witness DISK    -- Rocinante's own C: free space (ORANGE <15GB, RED <5GB). "Witness     [added]
                        with no witness": a full disk silently kills this watchdog + the
                        GitHub mirror + creds-sync + hours-log.

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


def ssh_gpu_temp(ssh_path: str, timeout_s: int = 12) -> float | None:
    """Max GPU die temp (C) across cards via nvidia-smi. None if unreachable/unparseable.

    Witness-side thermal coverage: the marketplace fields do NOT expose live die temp,
    so we ssh the host directly (it's already up if we got here). Read-only query.
    """
    cmd = [
        "ssh", "-o", "BatchMode=yes", "-o", f"ConnectTimeout={timeout_s}", ssh_path,
        "nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits",
    ]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_s + 5)
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None
    if out.returncode != 0 or not out.stdout.strip():
        return None
    temps = []
    for line in out.stdout.strip().splitlines():
        try:
            temps.append(float(line.strip()))
        except ValueError:
            continue
    return max(temps) if temps else None


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


# --- config loading ------------------------------------------------------------

def load_fleet_config() -> dict:
    """Return {machine_id(int): listing+monitoring cfg} from fleet.yaml.

    fleet.yaml is canonical. cfg per machine carries the flattened fields the checks
    need: approved_gpu_cost, tolerance, min_bid, end_date, min_gpus,
    marginal_floor_gpu_cost, gpu_temp_alert_c, gpu_temp_crit_c, hostname.
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
            mon = m.get("monitoring", {}) or {}
            cfgs[int(mid)] = {
                "hostname": m.get("hostname", str(mid)),
                "approved_gpu_cost": listing.get("gpu_cost"),
                "tolerance": float(listing.get("tolerance", 0.005)),
                "min_bid": listing.get("min_bid"),
                "end_date": listing.get("end_date"),
                "min_gpus": listing.get("min_gpus"),
                "marginal_floor_gpu_cost": listing.get("marginal_floor_gpu_cost"),
                "gpu_temp_alert_c": mon.get("gpu_temp_alert_c"),
                "gpu_temp_crit_c": mon.get("gpu_temp_crit_c"),
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


def _days_until(date_str: str | None) -> int | None:
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
        try:
            d = datetime.strptime(str(date_str), fmt).replace(tzinfo=timezone.utc)
            return int((d - datetime.now(timezone.utc)).total_seconds() // 86400)
        except ValueError:
            continue
    return None


def disk_free_gb(path: Path = REPO_ROOT) -> float | None:
    try:
        return shutil.disk_usage(str(path)).free / (1024 ** 3)
    except OSError:
        return None


# --- core evaluation -----------------------------------------------------------

def evaluate_machine(mid: int, cfg: dict, registry_by_id: dict, prior: dict) -> tuple[dict, list]:
    """Return (new_state_for_machine, list_of_transition_events).

    Each event: {severity, kind, msg}. Transitions are computed against `prior`.
    """
    events = []
    reg = registry_by_id.get(mid, {})
    hostname = cfg.get("hostname") or reg.get("hostname", str(mid))
    ip = reg.get("current_ip")
    ssh_path = reg.get("ssh_path")

    new = dict(prior) if prior else {}
    new["machine_id"] = mid
    new["hostname"] = hostname
    new["last_seen_utc"] = utc_iso()

    # 1. Host-down (debounced). Only meaningful if we have an IP.
    host_status = prior.get("host_status", "UP")
    strikes = int(prior.get("down_strikes", 0))
    host_up = False
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
    new["host_status"] = host_status
    new["down_strikes"] = strikes

    # vast.ai-derived checks. If the API is unreachable, skip them.
    machines = _MACHINES_CACHE.get("data")
    rec = machines.get(mid) if machines else None
    offer = vastai_offer(mid) if machines is not None else None

    if machines is None:
        new["vastai_query"] = "unreachable"
        # still try GPU temp + record what we have, then return
        _temp_check(new, events, cfg, ssh_path, host_up, prior)
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

    # 3. Price drift -- listed_gpu_cost vs approved.
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

    # 7. Marginal-cost floor -- renting below electricity cost loses real money
    #    (and a kWh burned for the ITC narrative returns at most ~30% of its cost).
    floor = cfg.get("marginal_floor_gpu_cost")
    if floor is not None and gpu_cost is not None and float(gpu_cost) < float(floor):
        prev_below = bool(prior.get("below_floor"))
        if not prev_below:
            events.append({"severity": "red", "kind": "below_marginal_floor",
                           "msg": f"{hostname} list ${gpu_cost}/GPU is BELOW marginal floor "
                                  f"${floor}/GPU -- renting below electricity cost."})
        new["below_floor"] = True
    else:
        new["below_floor"] = False

    # 8. min_gpus invariant -- a relist with -m 1 re-exposes single-card thermal pathology.
    min_gpus = cfg.get("min_gpus")
    live_min = None
    if rec:
        live_min = rec.get("min_chunk") or rec.get("min_gpus")
    if min_gpus is not None and live_min is not None and int(live_min) < int(min_gpus):
        prev_minbad = bool(prior.get("min_gpus_bad"))
        if not prev_minbad:
            events.append({"severity": "red", "kind": "min_gpus_violation",
                           "msg": f"{hostname} live min_chunk={live_min} < required min_gpus="
                                  f"{min_gpus} (single-card thermal exposure)."})
        new["min_gpus_bad"] = True
    else:
        new["min_gpus_bad"] = False

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

    # 6. Listing expiry. end_date is the LISTING expiry (distinct from a reserved-contract
    #    end date). Auto-renew is manual via web UI, so silent expiry stops earnings.
    days = _days_until(cfg.get("end_date"))
    if days is not None:
        new["days_to_expiry"] = days
        prev_days = prior.get("days_to_expiry")
        if days <= 7 and (prev_days is None or prev_days > 7):
            events.append({"severity": "orange", "kind": "listing_expiry",
                           "msg": f"{hostname} listing expires in {days}d ({cfg.get('end_date')}) -- relist."})
        elif days <= 14 and (prev_days is None or prev_days > 14):
            events.append({"severity": "yellow", "kind": "listing_expiry",
                           "msg": f"{hostname} listing expires in {days}d ({cfg.get('end_date')})."})

    # 9. GPU temperature (witness-side, ssh nvidia-smi).
    _temp_check(new, events, cfg, ssh_path, host_up, prior)

    return new, events


def _temp_check(new: dict, events: list, cfg: dict, ssh_path: str | None,
                host_up: bool, prior: dict) -> None:
    """Witness-side GPU thermal check. Debounced for ORANGE (2 consecutive passes)."""
    alert_c = cfg.get("gpu_temp_alert_c")
    crit_c = cfg.get("gpu_temp_crit_c")
    if not ssh_path or not host_up or alert_c is None:
        return
    temp = ssh_gpu_temp(ssh_path)
    if temp is None:
        return
    new["gpu_temp_c"] = temp
    hostname = new.get("hostname")
    hot_strikes = int(prior.get("temp_hot_strikes", 0))
    if crit_c is not None and temp >= float(crit_c):
        events.append({"severity": "red", "kind": "gpu_temp",
                       "msg": f"{hostname} GPU {temp:.0f}C >= crit {crit_c}C."})
        hot_strikes = 0
    elif temp >= float(alert_c):
        hot_strikes += 1
        if hot_strikes >= 2:  # debounce: sustained, not a transient spike
            events.append({"severity": "orange", "kind": "gpu_temp",
                           "msg": f"{hostname} GPU {temp:.0f}C >= alert {alert_c}C (sustained {hot_strikes} passes)."})
            hot_strikes = 0
    else:
        hot_strikes = 0
    new["temp_hot_strikes"] = hot_strikes


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


def standing_conditions(cfg: dict, ns: dict) -> list:
    """Invariant violations TRUE right now, regardless of transition.

    The transition checks in evaluate_machine fire once when a signal crosses a
    threshold — correct for noisy signals (reliability, temp spikes) but WRONG for a
    standing invariant like a price that should always read as wrong while it's wrong.
    (Bug caught 2026-05-29: a price already-drifted in the state file never re-alerted,
    so `overall` showed green while rtxserver sat at $1.10 vs approved $0.92.)

    These conditions always feed `overall` severity + the health snapshot every pass.
    Inbox re-alerting is throttled separately (see main) so health stays accurate
    without 10-minute spam.
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
    if ns.get("below_floor"):
        out.append({"severity": "red", "kind": "below_marginal_floor",
                    "msg": f"{host} list price below marginal electricity floor (standing)."})
    if ns.get("min_gpus_bad"):
        out.append({"severity": "red", "kind": "min_gpus_violation",
                    "msg": f"{host} live min_chunk below required min_gpus (standing)."})
    if ns.get("error_description"):
        out.append({"severity": "red", "kind": "error_description",
                    "msg": f"{host} error_description set: '{ns.get('error_description')}' (standing; delists)."})
    crit = cfg.get("gpu_temp_crit_c")
    t = ns.get("gpu_temp_c")
    if crit is not None and t is not None and float(t) >= float(crit):
        out.append({"severity": "red", "kind": "gpu_temp",
                    "msg": f"{host} GPU {t:.0f}C >= crit {crit}C (standing)."})
    d = ns.get("days_to_expiry")
    if d is not None and d <= 7:
        out.append({"severity": "orange", "kind": "listing_expiry",
                    "msg": f"{host} listing expires in {d}d (standing)."})
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
              "- State: `sartor/memory/projects/fleet-watchdog-state.json`",
              "- Config: `sartor/memory/business/fleet.yaml`", ""]
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def write_health(overall: str, new_state: dict, events: list, standing: list,
                 disk_gb: float | None, run_iso: str) -> Path:
    """Dashboard-facing health snapshot. Written every pass (green included)."""
    HEALTH_PATH.parent.mkdir(parents=True, exist_ok=True)
    machines = {}
    for mid, ns in new_state.items():
        machines[mid] = {
            "hostname": ns.get("hostname"),
            "host_status": ns.get("host_status"),
            "rented": ns.get("rented"),
            "gpu_cost": ns.get("gpu_cost"),
            "reliability2": ns.get("reliability2"),
            "gpu_temp_c": ns.get("gpu_temp_c"),
            "days_to_expiry": ns.get("days_to_expiry"),
            "error_description": ns.get("error_description"),
            "below_floor": ns.get("below_floor"),
            "min_gpus_bad": ns.get("min_gpus_bad"),
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
    ap = argparse.ArgumentParser(description="Sartor fleet watchdog")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print decisions; do not write state, inbox, health, or phone alerts.")
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
              f"gpu_cost={ns.get('gpu_cost')} rel={ns.get('reliability2')} "
              f"temp={ns.get('gpu_temp_c')} expiry={ns.get('days_to_expiry')}d "
              f"err={ns.get('error_description')} vastai={ns.get('vastai_query')} "
              f"-> {len(events)} event(s), {len(standing)} standing")
        for e in events:
            print(f"    [{e['severity'].upper()}] {e['kind']}: {e['msg']} (transition)")
        for s in standing:
            print(f"    [{s['severity'].upper()}] {s['kind']}: {s['msg']}")

    # 10. Witness self-disk (Rocinante). "Witness with no witness": a full C: kills
    #     this watchdog + the GitHub mirror + creds-sync + hours-log, all silently.
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
