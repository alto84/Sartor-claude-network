#!/usr/bin/env python3
"""
Sartor REGISTRY drift detector -Tier 4.

Walks REGISTRY.yaml. For each non-retired machine:
  1. Pings current_ip with a short timeout.
  2. If ssh_path is declared, attempts a 5-second `ssh -o BatchMode=yes
     -o ConnectTimeout=5 ... true` to confirm shell-level liveness.
  3. Classifies result OK / STALE / UNREACHABLE.
  4. Updates last_verified for OK machines (write back to REGISTRY.yaml).
  5. Writes a dated drift report to sartor/memory/inbox/rocinante/
     registry-drift-<UTC-timestamp>.md with frontmatter and per-machine table.
  6. Exits non-zero if any machine is STALE or UNREACHABLE so cron-fail surfaces.

Designed to run on Rocinante under a 4h Windows Scheduled Task. Works from
either Bash (Git for Windows) or PowerShell. Pure stdlib + PyYAML.

Status semantics:
  OK          -ping succeeded AND (no ssh_path OR ssh liveness succeeded).
  STALE       -ping succeeded but ssh failed (host alive at IP, but auth or
                sshd is broken; possibly an IP collision with a different host).
  UNREACHABLE -ping failed (host is off, IP changed, network broken).
"""

from __future__ import annotations

import argparse
import os
import platform
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml


REPO_ROOT = Path(__file__).resolve().parents[3]
REGISTRY_PATH = REPO_ROOT / "sartor" / "memory" / "machines" / "REGISTRY.yaml"
INBOX_DIR = REPO_ROOT / "sartor" / "memory" / "inbox" / "rocinante"
# 2026-05-10: drift reports moved into _memos/registry-drift/ subdir so the
# curator skip-walks them (they're cron output, not curator input).
REPORT_DIR = INBOX_DIR / "_memos" / "registry-drift"


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def utc_date() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def ping(ip: str, timeout_s: int = 2) -> tuple[bool, str]:
    """Cross-platform single-shot ping. Returns (ok, brief detail)."""
    is_win = platform.system().lower().startswith("win")
    if is_win:
        # Windows ping: -n 1 (one echo), -w timeout in ms
        cmd = ["ping", "-n", "1", "-w", str(timeout_s * 1000), ip]
    else:
        # POSIX ping: -c 1, -W timeout in seconds
        cmd = ["ping", "-c", "1", "-W", str(timeout_s), ip]
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout_s + 2
        )
    except subprocess.TimeoutExpired:
        return False, "timeout"
    except FileNotFoundError:
        return False, "ping binary not found"
    if result.returncode == 0:
        # Try to extract a round-trip time for the report
        out = result.stdout
        m = re.search(r"time[=<]\s*([\d.]+)\s*ms", out, re.IGNORECASE)
        if m:
            return True, f"{m.group(1)} ms"
        return True, "ok"
    return False, f"rc={result.returncode}"


def ssh_probe(ssh_path: str, timeout_s: int = 5) -> tuple[bool, str]:
    """Run `ssh -o BatchMode=yes -o ConnectTimeout=N ssh_path true`.
    BatchMode prevents password prompts so a misconfig fails fast.
    """
    cmd = [
        "ssh",
        "-o", "BatchMode=yes",
        "-o", f"ConnectTimeout={timeout_s}",
        "-o", "StrictHostKeyChecking=accept-new",
        ssh_path,
        "true",
    ]
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout_s + 5
        )
    except subprocess.TimeoutExpired:
        return False, "ssh timeout"
    except FileNotFoundError:
        return False, "ssh binary not found"
    if result.returncode == 0:
        return True, "ok"
    err = (result.stderr or "").strip().splitlines()
    detail = err[-1][:80] if err else f"rc={result.returncode}"
    return False, detail


def classify(machine: dict) -> tuple[str, str, str]:
    """Return (status, ping_detail, ssh_detail)."""
    ip = machine.get("current_ip")
    if not ip:
        return "UNREACHABLE", "no current_ip declared", ""
    ping_ok, ping_detail = ping(ip)
    if not ping_ok:
        return "UNREACHABLE", ping_detail, ""
    ssh_path = machine.get("ssh_path")
    if not ssh_path:
        # Ping is the only signal we have. Treat as OK.
        return "OK", ping_detail, "skipped (no ssh_path)"
    ssh_ok, ssh_detail = ssh_probe(ssh_path)
    if ssh_ok:
        return "OK", ping_detail, ssh_detail
    return "STALE", ping_detail, ssh_detail


def write_report(results: list[dict], stamp: str) -> Path:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORT_DIR / f"registry-drift-{stamp}.md"
    counts = {"OK": 0, "STALE": 0, "UNREACHABLE": 0}
    for r in results:
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    overall = "green" if counts["STALE"] == 0 and counts["UNREACHABLE"] == 0 else (
        "red" if counts["UNREACHABLE"] > 0 else "yellow"
    )
    lines = []
    lines.append("---")
    lines.append("name: registry-drift-report")
    lines.append(f"stamp_utc: {utc_iso()}")
    lines.append("type: drift-detector-output")
    lines.append(f"overall: {overall}")
    lines.append(f"counts: {{ok: {counts['OK']}, stale: {counts['STALE']}, unreachable: {counts['UNREACHABLE']}}}")
    lines.append("source: sartor/memory/machines/check-registry.py")
    lines.append("---")
    lines.append("")
    lines.append(f"# Registry drift check -{utc_iso()}")
    lines.append("")
    lines.append(f"Overall: **{overall.upper()}**. {counts['OK']} OK, {counts['STALE']} STALE, {counts['UNREACHABLE']} UNREACHABLE.")
    lines.append("")
    lines.append("| Hostname | IP | Status | Ping | SSH |")
    lines.append("|---|---|---|---|---|")
    for r in results:
        lines.append(
            f"| {r['hostname']} | {r['ip']} | {r['status']} | {r['ping']} | {r['ssh']} |"
        )
    lines.append("")
    if counts["STALE"] or counts["UNREACHABLE"]:
        lines.append("## Action items")
        lines.append("")
        for r in results:
            if r["status"] == "UNREACHABLE":
                lines.append(
                    f"- **{r['hostname']}** UNREACHABLE at {r['ip']} ({r['ping']}). "
                    f"Possible causes: host off, DHCP reassignment, NIC swap, switch-port move. "
                    f"Update REGISTRY.yaml current_ip if the host moved."
                )
            elif r["status"] == "STALE":
                lines.append(
                    f"- **{r['hostname']}** STALE: pings at {r['ip']} ({r['ping']}) but SSH liveness "
                    f"failed ({r['ssh']}). Either an IP collision with another device, sshd is down, "
                    f"or auth/keys broke."
                )
        lines.append("")
    lines.append("## Provenance")
    lines.append("")
    lines.append(f"- Registry source: `sartor/memory/machines/REGISTRY.yaml`")
    lines.append(f"- Detector: `sartor/memory/machines/check-registry.py`")
    lines.append(f"- Run host: rocinante (Windows Scheduled Task `Sartor Registry Drift Check`)")
    lines.append("")
    report_path.write_text("\n".join(lines), encoding="utf-8")
    return report_path


def update_last_verified(registry_path: Path, ok_hostnames: list[str]) -> None:
    """Write back last_verified for OK machines without disturbing comments."""
    if not ok_hostnames:
        return
    text = registry_path.read_text(encoding="utf-8")
    today = utc_date()
    new_lines = []
    in_machines = False
    current_host = None
    pending_lv_update = False
    for line in text.splitlines():
        # Track which machine block we're in by spotting `- hostname: <name>`
        m = re.match(r"^\s*-\s*hostname:\s*(\S+)\s*$", line)
        if m:
            current_host = m.group(1)
            pending_lv_update = current_host in ok_hostnames
            new_lines.append(line)
            continue
        # Update `last_verified:` line within an OK machine's block
        if pending_lv_update and re.match(r"^\s*last_verified:\s*", line):
            indent = re.match(r"^(\s*)", line).group(1)
            new_lines.append(f"{indent}last_verified: {today}")
            pending_lv_update = False  # only the first match per block
            continue
        new_lines.append(line)
    registry_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Sartor REGISTRY drift detector")
    parser.add_argument(
        "--no-write-back",
        action="store_true",
        help="Do not update last_verified in REGISTRY.yaml",
    )
    parser.add_argument(
        "--no-report",
        action="store_true",
        help="Do not write a report file (still prints summary to stdout)",
    )
    args = parser.parse_args()

    if not REGISTRY_PATH.exists():
        print(f"ERROR: REGISTRY.yaml not found at {REGISTRY_PATH}", file=sys.stderr)
        return 2

    with REGISTRY_PATH.open("r", encoding="utf-8") as f:
        registry = yaml.safe_load(f)

    machines = registry.get("machines", [])
    if not machines:
        print("ERROR: no machines in REGISTRY.yaml", file=sys.stderr)
        return 2

    results = []
    ok_hostnames = []
    for m in machines:
        hostname = m["hostname"]
        ip = m.get("current_ip", "(none)")
        status, ping_detail, ssh_detail = classify(m)
        results.append({
            "hostname": hostname,
            "ip": ip,
            "status": status,
            "ping": ping_detail,
            "ssh": ssh_detail,
        })
        if status == "OK":
            ok_hostnames.append(hostname)
        print(f"{hostname:18s} {ip:18s} {status:12s} ping={ping_detail:20s} ssh={ssh_detail}")

    stamp = utc_stamp()
    if not args.no_report:
        report_path = write_report(results, stamp)
        print(f"\nReport: {report_path}")

    if not args.no_write_back:
        update_last_verified(REGISTRY_PATH, ok_hostnames)

    bad = sum(1 for r in results if r["status"] != "OK")
    if bad:
        print(f"\nFAIL: {bad} machine(s) not OK", file=sys.stderr)
        return 1
    print("\nOK: all machines reachable")
    return 0


if __name__ == "__main__":
    sys.exit(main())
