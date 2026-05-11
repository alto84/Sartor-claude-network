#!/usr/bin/env python3
"""Sartor Tier-A WiFi health monitor.

Schema-driven, priority-aware observability for the Sartor-Saxena-Claude
Network. Designed to run every 15 minutes under a Windows Scheduled Task.

Reads:
  - sartor/memory/wifi/CLIENT-PRIORITIES.yaml  (priority registry)
  - sartor/memory/inbox/rocinante/.wifi-health-state.json  (prior snapshot)

Writes:
  - sartor/memory/inbox/rocinante/wifi-health-<UTC-stamp>.md  (audit trail)
  - sartor/memory/inbox/rocinante/.wifi-health-state.json     (state cache;
    gitignored because high-churn)

Hits the local UniFi controller at https://192.168.1.171:8443 read-only.
Zero PUTs / POSTs that mutate state. Authenticates with the cookie-based
/api/login flow per the verified end-to-end recipe in the
network-management skill.

Exit codes:
  0  -all green (no alerts)
  1  -at least one alert fired
  2  -controller unreachable / could not authenticate
"""
from __future__ import annotations

import json
import re
import ssl
import subprocess
import sys
import urllib.error
import urllib.request
import http.cookiejar
from datetime import datetime, timezone
from pathlib import Path

import yaml


REPO_ROOT = Path(__file__).resolve().parents[3]
PRIORITIES_PATH = REPO_ROOT / "sartor" / "memory" / "wifi" / "CLIENT-PRIORITIES.yaml"
INBOX_DIR = REPO_ROOT / "sartor" / "memory" / "inbox" / "rocinante"
# 2026-05-10: audit-trail .md files moved into _memos/wifi-health/ subdir so
# the curator skip-walks them (they're cron output, not curator input). The
# state cache stays at INBOX_DIR root because it's gitignored and the curator
# already skips dotfiles.
REPORT_DIR = INBOX_DIR / "_memos" / "wifi-health"
STATE_PATH = INBOX_DIR / ".wifi-health-state.json"
SECRET_CMD = r"C:/Users/alto8/Sartor-claude-network/scripts/sartor-secret.cmd"
CONTROLLER = "https://192.168.1.171:8443"

# Per-priority thresholds. Anything not in the registry defaults to "normal".
THRESHOLDS = {
    "critical":    {"signal": -65, "retry_pct": 3,  "phy_mbps": 200, "satisfaction": 95, "drop_db": 3},
    "high":        {"signal": -68, "retry_pct": 5,  "phy_mbps": 100, "satisfaction": 90, "drop_db": 5},
    "normal":      {"signal": -72, "retry_pct": 8,  "phy_mbps":  50, "satisfaction": 85, "drop_db": 8},
    "best_effort": {"signal": -78, "retry_pct": 15, "phy_mbps":  20, "satisfaction": 70, "drop_db": 10},
}

# Channel-utilization thresholds, priority-independent (per-AP-radio).
AP_CU_ALERT = 70   # %, sustained for 2+ runs (~30 min) triggers ALERT
AP_DFS_CHANNELS = set(range(52, 145))  # 52-144 inclusive are DFS in US 5 GHz


# -----------------------------
# Load + auth
# -----------------------------

def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_priorities() -> dict:
    """Return {mac_lower: {priority, hostname, owner, notes}}."""
    if not PRIORITIES_PATH.exists():
        return {}
    with PRIORITIES_PATH.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    by_mac = {}
    for c in data.get("clients", []):
        mac = (c.get("mac") or "").lower()
        if mac:
            by_mac[mac] = {
                "priority": c.get("priority", "normal"),
                "hostname": c.get("hostname", ""),
                "owner":    c.get("owner", ""),
                "notes":    c.get("notes", "") or "",
            }
    return by_mac


def get_controller_password() -> str:
    """Read 'UniFi superadmin' from Bitwarden via sartor-secret wrapper."""
    result = subprocess.run(
        [SECRET_CMD, "read", "UniFi superadmin"],
        capture_output=True, text=True, check=True, shell=True,
    )
    return result.stdout.strip()


def login_opener(password: str):
    """Build a urllib opener with cookies and authenticated session."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cj),
        urllib.request.HTTPSHandler(context=ctx),
    )
    body = json.dumps(
        {"username": "alton", "password": password, "remember": False}
    ).encode()
    req = urllib.request.Request(
        f"{CONTROLLER}/api/login",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    resp = json.loads(opener.open(req, timeout=10).read())
    if resp.get("meta", {}).get("rc") != "ok":
        raise RuntimeError(f"login rejected: {resp}")
    return opener


def fetch_json(opener, path: str) -> dict:
    return json.loads(opener.open(f"{CONTROLLER}{path}", timeout=10).read())


# -----------------------------
# Classification
# -----------------------------

def get_priority(mac: str, registry: dict) -> str:
    return registry.get(mac.lower(), {}).get("priority", "normal")


def get_hostname(sta: dict, registry: dict) -> str:
    """Prefer registry hostname (stable, human-curated) over controller-reported."""
    mac = (sta.get("mac") or "").lower()
    reg = registry.get(mac, {})
    return reg.get("hostname") or sta.get("hostname") or sta.get("name") or "(noname)"


def evaluate_client(sta: dict, registry: dict, ap_name_by_mac: dict) -> dict:
    """Return a dict capturing client state + any alerts triggered."""
    mac = (sta.get("mac") or "").lower()
    priority = get_priority(mac, registry)
    thr = THRESHOLDS[priority]
    signal = sta.get("signal")
    retry_pct = sta.get("wifi_tx_retries_percentage")
    tx_kbps = sta.get("tx_rate") or 0
    rx_kbps = sta.get("rx_rate") or 0
    phy_mbps = max(tx_kbps, rx_kbps) / 1000  # PHY ceiling, the higher direction
    satisfaction = sta.get("satisfaction")
    ap_mac = (sta.get("ap_mac") or "").lower()
    ap_name = ap_name_by_mac.get(ap_mac, "?") if ap_mac else "wired"
    alerts = []
    if signal is not None and signal < thr["signal"]:
        alerts.append(f"signal {signal} dB < {thr['signal']} dB ({priority} threshold)")
    if retry_pct is not None and retry_pct > thr["retry_pct"]:
        alerts.append(f"retry {retry_pct:.1f}% > {thr['retry_pct']}% ({priority} threshold)")
    if phy_mbps > 0 and phy_mbps < thr["phy_mbps"]:
        alerts.append(f"PHY {phy_mbps:.0f} Mbps < {thr['phy_mbps']} Mbps ({priority} threshold)")
    if satisfaction is not None and satisfaction < thr["satisfaction"]:
        alerts.append(f"satisfaction {satisfaction} < {thr['satisfaction']} ({priority} threshold)")
    return {
        "mac": mac,
        "hostname": get_hostname(sta, registry),
        "owner": registry.get(mac, {}).get("owner", ""),
        "priority": priority,
        "ap": ap_name,
        "signal": signal,
        "retry_pct": retry_pct,
        "phy_mbps": round(phy_mbps, 1) if phy_mbps else 0,
        "satisfaction": satisfaction,
        "alerts": alerts,
    }


def evaluate_ap_radio(ap_name: str, radio_stat: dict, prior_cu_streak: int) -> dict:
    """Return a dict capturing per-AP-radio state + any alerts."""
    radio = radio_stat.get("name", "?")
    radio_band = radio_stat.get("radio", "?")  # ng / na / 6e
    bw = radio_stat.get("bw", 0)
    channel = radio_stat.get("channel", 0)
    cu = radio_stat.get("cu_total", 0)
    num_sta = radio_stat.get("num_sta", 0)
    is_dfs = radio_band == "na" and channel in AP_DFS_CHANNELS
    new_streak = prior_cu_streak + 1 if cu > AP_CU_ALERT else 0
    alerts = []
    if new_streak >= 2:
        msg = f"channel utilization {cu}% > {AP_CU_ALERT}% for {new_streak} runs"
        if is_dfs:
            msg += " AND on DFS channel " + str(channel) + " (radar-eviction risk; consider non-DFS pin)"
        alerts.append(msg)
    info_notes = []
    if radio_band == "na" and bw and bw < 80:
        info_notes.append(f"5 GHz width clamped at {bw} MHz; widen to 80 MHz if AP supports")
    return {
        "ap": ap_name,
        "radio": radio,
        "band": radio_band,
        "channel": channel,
        "bw": bw,
        "cu": cu,
        "num_sta": num_sta,
        "cu_streak": new_streak,
        "alerts": alerts,
        "info": info_notes,
    }


# -----------------------------
# State cache
# -----------------------------

def load_prior_state() -> dict:
    if not STATE_PATH.exists():
        return {"clients": {}, "ap_radios": {}, "stamp": None}
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"clients": {}, "ap_radios": {}, "stamp": None}


def save_state(client_states: list[dict], ap_states: list[dict]) -> None:
    """Snapshot just enough fields for trend deltas + CU streaks."""
    payload = {
        "stamp": utc_iso(),
        "clients": {
            c["mac"]: {"signal": c["signal"], "retry_pct": c["retry_pct"]}
            for c in client_states
        },
        "ap_radios": {
            f"{a['ap']}:{a['radio']}": {"cu_streak": a["cu_streak"], "cu": a["cu"]}
            for a in ap_states
        },
    }
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def compute_trend_deltas(client_states: list[dict], prior: dict, registry: dict) -> list[dict]:
    """Return a list of {hostname, mac, prior_signal, signal, delta, flag}.
    flag = 'degraded' or 'improved' if delta crosses the priority's drop_db.
    """
    deltas = []
    prior_clients = prior.get("clients", {})
    for c in client_states:
        mac = c["mac"]
        if mac not in prior_clients:
            continue
        prior_sig = prior_clients[mac].get("signal")
        cur_sig = c["signal"]
        if prior_sig is None or cur_sig is None:
            continue
        delta = cur_sig - prior_sig
        priority = c["priority"]
        drop = THRESHOLDS[priority]["drop_db"]
        flag = None
        if delta <= -drop:
            flag = "degraded"
        elif delta >= drop:
            flag = "improved"
        if flag:
            deltas.append({
                "hostname": c["hostname"],
                "mac": mac,
                "priority": priority,
                "prior_signal": prior_sig,
                "signal": cur_sig,
                "delta": delta,
                "flag": flag,
            })
    return deltas


# -----------------------------
# Report writer
# -----------------------------

def render_report(client_states, ap_states, deltas, suggestions, total_alerts) -> str:
    critical_clients = [c for c in client_states if c["priority"] == "critical"]
    critical_present_names = sorted({c["hostname"] for c in critical_clients})
    lines = []
    lines.append("---")
    lines.append("type: wifi-health-report")
    lines.append(f"generated: {utc_iso()}")
    lines.append("generator: wifi-health-monitor v1")
    lines.append("window: 15min snapshot")
    lines.append(f"total_stations: {len(client_states)}")
    lines.append(f"total_alerts: {total_alerts}")
    lines.append("critical_clients_present: [" + ", ".join(critical_present_names) + "]")
    lines.append("---")
    lines.append("")
    lines.append(f"# WiFi health report -{utc_iso()}")
    lines.append("")
    # 1. Critical-client status
    lines.append("## Critical clients")
    lines.append("")
    if not critical_clients:
        lines.append("None of the critical-tier clients (per registry) are currently associated.")
    else:
        lines.append("| Hostname | Owner | AP | Signal | Retry % | PHY Mbps | Satisfaction | Status |")
        lines.append("|---|---|---|---|---|---|---|---|")
        for c in critical_clients:
            status = "ALERT" if c["alerts"] else "ok"
            lines.append(
                f"| {c['hostname']} | {c['owner']} | {c['ap']} | "
                f"{_fmt(c['signal'])} | {_fmt_pct(c['retry_pct'])} | "
                f"{_fmt_num(c['phy_mbps'])} | {_fmt(c['satisfaction'])} | {status} |"
            )
    lines.append("")
    # 2. Active alerts
    lines.append("## Active alerts")
    lines.append("")
    alerting_clients = [c for c in client_states if c["alerts"]]
    alerting_aps = [a for a in ap_states if a["alerts"]]
    if not alerting_clients and not alerting_aps:
        lines.append("None. All clients and AP radios within their priority-tier thresholds.")
    else:
        # Sort clients by priority severity for readability
        order = {"critical": 0, "high": 1, "normal": 2, "best_effort": 3}
        for c in sorted(alerting_clients, key=lambda x: order.get(x["priority"], 9)):
            lines.append(f"### {c['hostname']} ({c['priority']}, owner: {c['owner'] or 'unknown'})")
            lines.append("")
            lines.append(f"On AP **{c['ap']}**.")
            lines.append("")
            for a in c["alerts"]:
                lines.append(f"- {a}")
            lines.append("")
        for a in alerting_aps:
            lines.append(f"### AP {a['ap']} radio {a['radio']} ({a['band']}, ch {a['channel']}, {a['bw']} MHz)")
            lines.append("")
            for msg in a["alerts"]:
                lines.append(f"- {msg}")
            lines.append("")
    # 3. AP utilization snapshot
    lines.append("## AP utilization snapshot")
    lines.append("")
    lines.append("| AP | Radio | Band | Ch | BW | CU % | Stations | CU streak |")
    lines.append("|---|---|---|---|---|---|---|---|")
    for a in ap_states:
        lines.append(
            f"| {a['ap']} | {a['radio']} | {a['band']} | {a['channel']} | {a['bw']} | "
            f"{a['cu']} | {a['num_sta']} | {a['cu_streak']} |"
        )
    lines.append("")
    # 4. Trend deltas
    if deltas:
        lines.append("## Trend deltas (vs prior run)")
        lines.append("")
        lines.append("| Hostname | Priority | Prior signal | Now | Delta | Flag |")
        lines.append("|---|---|---|---|---|---|")
        for d in deltas:
            lines.append(
                f"| {d['hostname']} | {d['priority']} | {d['prior_signal']} | "
                f"{d['signal']} | {d['delta']:+d} dB | {d['flag']} |"
            )
        lines.append("")
    # 5. Suggestions
    if suggestions:
        lines.append("## Suggestions (Tier B candidates)")
        lines.append("")
        for s in suggestions:
            lines.append(f"- {s}")
        lines.append("")
    lines.append("## Provenance")
    lines.append("")
    lines.append("- Generator: `sartor/memory/wifi/wifi-health-monitor.py`")
    lines.append("- Priorities source: `sartor/memory/wifi/CLIENT-PRIORITIES.yaml`")
    lines.append("- Controller: `https://192.168.1.171:8443` (read-only /stat endpoints)")
    lines.append("- State cache (gitignored): `sartor/memory/inbox/rocinante/.wifi-health-state.json`")
    lines.append("")
    return "\n".join(lines)


def _fmt(v):
    return "?" if v is None else str(v)


def _fmt_pct(v):
    return "?" if v is None else f"{v:.1f}"


def _fmt_num(v):
    return "?" if v in (None, 0) else f"{v:.0f}"


def derive_suggestions(ap_states: list[dict]) -> list[str]:
    """Plain-text Tier B candidates. No auto-execution; just notes."""
    out = []
    for a in ap_states:
        if a["cu_streak"] >= 2:
            base = (
                f"AP {a['ap']} radio {a['radio']} ({a['band']}) "
                f"sustained CU {a['cu']}% for {a['cu_streak']} runs"
            )
            if a["band"] == "na" and a["channel"] in AP_DFS_CHANNELS:
                out.append(base + "; consider non-DFS-channel pin (36-48 or 149-165) to reduce radar evictions.")
            elif a["band"] == "na" and a["bw"] and a["bw"] < 80:
                out.append(base + f"; widen 5 GHz from {a['bw']} MHz to 80 MHz to halve airtime.")
            else:
                out.append(base + "; investigate which station is driving usage.")
        if a["band"] == "na" and a["bw"] and a["bw"] < 80 and a["num_sta"] > 0:
            out.append(
                f"AP {a['ap']} 5 GHz at {a['bw']} MHz width with {a['num_sta']} clients; "
                f"widening to 80 MHz typically doubles per-client throughput."
            )
    return out


# -----------------------------
# Main
# -----------------------------

def main() -> int:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    registry = load_priorities()
    try:
        password = get_controller_password()
        opener = login_opener(password)
    except (urllib.error.URLError, OSError, RuntimeError, subprocess.CalledProcessError) as e:
        msg = f"controller unreachable or auth failed: {e}"
        print(msg, file=sys.stderr)
        # Write a minimal report so the audit trail still exists.
        stamp = utc_stamp()
        report_path = REPORT_DIR / f"wifi-health-{stamp}.md"
        report_path.write_text(
            f"---\ntype: wifi-health-report\ngenerated: {utc_iso()}\n"
            f"generator: wifi-health-monitor v1\nstatus: controller-unreachable\n---\n\n"
            f"# WiFi health report -controller unreachable\n\n"
            f"Tried to reach {CONTROLLER}.\n\n"
            f"Error: {e}\n",
            encoding="utf-8",
        )
        return 2
    finally:
        try:
            del password  # noqa
        except NameError:
            pass

    devices = fetch_json(opener, "/api/s/default/stat/device").get("data", [])
    stas = fetch_json(opener, "/api/s/default/stat/sta").get("data", [])
    ap_name_by_mac = {d.get("mac", "").lower(): d.get("name", "?") for d in devices}

    # Wireless clients only -wired stations don't have these WiFi metrics.
    wifi_stas = [s for s in stas if s.get("ap_mac")]
    client_states = [evaluate_client(s, registry, ap_name_by_mac) for s in wifi_stas]

    prior = load_prior_state()
    prior_ap = prior.get("ap_radios", {})

    ap_states = []
    for d in devices:
        if d.get("type") != "uap":
            continue
        ap_name = d.get("name", "?")
        for radio_stat in d.get("radio_table_stats", []):
            key = f"{ap_name}:{radio_stat.get('name', '?')}"
            prior_streak = prior_ap.get(key, {}).get("cu_streak", 0)
            ap_states.append(evaluate_ap_radio(ap_name, radio_stat, prior_streak))

    deltas = compute_trend_deltas(client_states, prior, registry)
    suggestions = derive_suggestions(ap_states)
    total_alerts = sum(len(c["alerts"]) for c in client_states) + sum(len(a["alerts"]) for a in ap_states)

    report = render_report(client_states, ap_states, deltas, suggestions, total_alerts)
    stamp = utc_stamp()
    report_path = REPORT_DIR / f"wifi-health-{stamp}.md"
    report_path.write_text(report, encoding="utf-8")
    save_state(client_states, ap_states)

    # Console summary -shows up in the scheduled-task log
    print(f"wifi-health: {len(client_states)} wireless clients, {len(ap_states)} AP radios, {total_alerts} alerts -> {report_path.name}")
    return 1 if total_alerts > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
