#!/usr/bin/env python3
"""
Observer Runner -- executes sentinel and auditor checks, writes to observer-log.jsonl.

Designed to run inline with every heartbeat tick (cheap file-based checks only).
Deep checks (auditor substance review, critic weekly) run on their own schedules.

Usage:
    python run_observers.py              # Run all quick checks
    python run_observers.py --status     # Show last observer results
    python run_observers.py --sentinel   # Run sentinel checks only
    python run_observers.py --auditor    # Run auditor checks only
"""

import argparse
import csv
import json
import os
from datetime import datetime, timedelta
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_DIR / "data"
SARTOR_DIR = REPO_DIR / "sartor"
MEMORY_DIR = SARTOR_DIR / "memory"
DAILY_DIR = MEMORY_DIR / "daily"
OBSERVER_LOG = DATA_DIR / "observer-log.jsonl"
HEARTBEAT_LOG = DATA_DIR / "heartbeat-log.csv"
SCHEDULED_TASKS_DIR = REPO_DIR / ".claude" / "scheduled-tasks"
COSTS_JSON = SARTOR_DIR / "costs.json"
REPORTS_DIR = REPO_DIR / "reports"


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _append_log(entry: dict):
    """Append a JSON line to observer-log.jsonl."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(OBSERVER_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


# ---------------------------------------------------------------------------
# Sentinel Checks (quick, every tick)
# ---------------------------------------------------------------------------

def sentinel_check_skill_files() -> dict:
    """Verify all registered scheduled tasks have SKILL.md files."""
    from scheduled_executor import SCHEDULE_REGISTRY

    missing = []
    for task_name in SCHEDULE_REGISTRY:
        skill_path = SCHEDULED_TASKS_DIR / task_name / "SKILL.md"
        if not skill_path.exists():
            missing.append(task_name)

    if missing:
        return {
            "check": "skill_files",
            "status": "fail",
            "detail": f"Missing SKILL.md: {', '.join(missing)}",
        }
    return {
        "check": "skill_files",
        "status": "pass",
        "detail": f"All {len(SCHEDULE_REGISTRY)} tasks have SKILL.md",
    }


def sentinel_check_heartbeat_errors() -> dict:
    """Check heartbeat log for recent errors/warnings."""
    if not HEARTBEAT_LOG.exists():
        return {
            "check": "heartbeat_errors",
            "status": "warn",
            "detail": "No heartbeat-log.csv found",
        }

    errors = []
    warnings = []
    try:
        with open(HEARTBEAT_LOG, "r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                ts = row.get("timestamp", "")
                status = row.get("status", "").lower()
                task = row.get("task_name", "")
                # Only look at last 24h
                try:
                    row_dt = datetime.fromisoformat(ts)
                    if (datetime.now() - row_dt) > timedelta(hours=24):
                        continue
                except (ValueError, TypeError):
                    continue

                if status == "error":
                    errors.append(f"{task} at {ts}")
                elif status == "warning":
                    warnings.append(f"{task} at {ts}")
    except Exception as e:
        return {
            "check": "heartbeat_errors",
            "status": "fail",
            "detail": f"Error reading log: {e}",
        }

    if errors:
        return {
            "check": "heartbeat_errors",
            "status": "fail",
            "detail": f"{len(errors)} error(s) in 24h: {'; '.join(errors[:3])}",
        }
    if warnings:
        return {
            "check": "heartbeat_errors",
            "status": "warn",
            "detail": f"{len(warnings)} warning(s) in 24h",
        }
    return {
        "check": "heartbeat_errors",
        "status": "pass",
        "detail": "No errors or warnings in 24h",
    }


def sentinel_check_memory_accessible() -> dict:
    """Verify core memory files exist and are readable."""
    core_files = [
        "ALTON.md", "FAMILY.md", "MACHINES.md", "BUSINESS.md",
        "SELF.md", "LEARNINGS.md", "PROCEDURES.md",
    ]
    missing = []
    for name in core_files:
        path = MEMORY_DIR / name
        if not path.exists():
            missing.append(name)
        else:
            try:
                content = path.read_text(encoding="utf-8")
                if len(content.strip()) < 10:
                    missing.append(f"{name}(empty)")
            except Exception:
                missing.append(f"{name}(unreadable)")

    if missing:
        return {
            "check": "memory_accessible",
            "status": "fail",
            "detail": f"Issues: {', '.join(missing)}",
        }
    return {
        "check": "memory_accessible",
        "status": "pass",
        "detail": f"All {len(core_files)} core memory files accessible",
    }


def sentinel_check_memory_freshness() -> dict:
    """Check if daily memory directory has recent activity."""
    if not DAILY_DIR.exists():
        return {
            "check": "memory_freshness",
            "status": "warn",
            "detail": "Daily memory directory missing",
        }

    log_files = sorted(
        [f for f in DAILY_DIR.glob("*.md")
         if len(f.stem) == 10 and f.stem[4] == "-" and f.stem[7] == "-"],
        reverse=True,
    )
    if not log_files:
        return {
            "check": "memory_freshness",
            "status": "warn",
            "detail": "No daily log files found",
        }

    newest = log_files[0]
    try:
        newest_date = datetime.strptime(newest.stem, "%Y-%m-%d")
        age_h = (datetime.now() - newest_date).total_seconds() / 3600
        if age_h > 48:
            return {
                "check": "memory_freshness",
                "status": "warn",
                "detail": f"Memory last updated {age_h:.0f}h ago ({newest.stem})",
            }
        return {
            "check": "memory_freshness",
            "status": "pass",
            "detail": f"Updated {age_h:.0f}h ago ({newest.stem})",
        }
    except ValueError:
        return {
            "check": "memory_freshness",
            "status": "warn",
            "detail": f"Could not parse date from {newest.name}",
        }


def sentinel_check_data_files() -> dict:
    """Verify critical data files exist (SYSTEM-STATE, IMPROVEMENT-QUEUE, observer-log)."""
    required = {
        "SYSTEM-STATE.md": DATA_DIR / "SYSTEM-STATE.md",
        "IMPROVEMENT-QUEUE.md": DATA_DIR / "IMPROVEMENT-QUEUE.md",
        "observer-log.jsonl": OBSERVER_LOG,
    }
    missing = [name for name, path in required.items() if not path.exists()]

    if missing:
        return {
            "check": "data_files",
            "status": "warn",
            "detail": f"Missing: {', '.join(missing)}",
        }
    return {
        "check": "data_files",
        "status": "pass",
        "detail": "All Hermes bounded memory files present",
    }


def run_sentinel() -> list[dict]:
    """Run all sentinel checks. Returns list of check results."""
    checks = [
        sentinel_check_skill_files,
        sentinel_check_heartbeat_errors,
        sentinel_check_memory_accessible,
        sentinel_check_memory_freshness,
        sentinel_check_data_files,
    ]
    results = []
    for fn in checks:
        try:
            result = fn()
        except Exception as e:
            result = {
                "check": fn.__name__.replace("sentinel_check_", ""),
                "status": "fail",
                "detail": f"Exception: {e}",
            }
        result["observer"] = "sentinel"
        result["timestamp"] = _now_iso()
        results.append(result)
    return results


# ---------------------------------------------------------------------------
# Auditor Checks (quick subset for inline; deep checks run nightly)
# ---------------------------------------------------------------------------

def auditor_check_reward_hacking() -> dict:
    """Quick check: are any tasks producing identical output repeatedly?"""
    daily_reports = REPORTS_DIR / "daily"
    if not daily_reports.exists():
        return {
            "check": "reward_hacking",
            "status": "pass",
            "detail": "No daily reports to check yet",
        }

    # Group reports by task name
    from collections import defaultdict
    task_reports = defaultdict(list)
    for f in sorted(daily_reports.glob("*.md"), reverse=True)[:30]:
        # Filename format: YYYY-MM-DD-taskname.md
        parts = f.stem.split("-", 3)
        if len(parts) >= 4:
            task_name = parts[3]
            try:
                content = f.read_text(encoding="utf-8")[:500]
                task_reports[task_name].append(hash(content))
            except Exception:
                pass

    flagged = []
    for task, hashes in task_reports.items():
        if len(hashes) >= 3:
            unique = len(set(hashes))
            if unique / len(hashes) < 0.4:
                flagged.append(f"{task} ({unique}/{len(hashes)} unique)")

    if flagged:
        return {
            "check": "reward_hacking",
            "status": "warn",
            "detail": f"Possible stale output: {'; '.join(flagged)}",
        }
    return {
        "check": "reward_hacking",
        "status": "pass",
        "detail": f"Checked {len(task_reports)} tasks, no repeat patterns",
    }


def auditor_check_effort() -> dict:
    """Check for suspiciously fast task completions (< 5 seconds)."""
    if not HEARTBEAT_LOG.exists():
        return {
            "check": "effort_detection",
            "status": "pass",
            "detail": "No heartbeat log to check",
        }

    fast_tasks = []
    try:
        with open(HEARTBEAT_LOG, "r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                task = row.get("task_name", "")
                status = row.get("status", "").lower()
                dur = row.get("duration_s", "0")
                # Skip health-checks and non-task entries
                if task in ("health-check", "idle", "budget-gate"):
                    continue
                if status not in ("ok", "completed"):
                    continue
                try:
                    if float(dur) < 5.0:
                        fast_tasks.append(f"{task} ({dur}s)")
                except ValueError:
                    pass
    except Exception as e:
        return {
            "check": "effort_detection",
            "status": "fail",
            "detail": f"Error: {e}",
        }

    if fast_tasks:
        return {
            "check": "effort_detection",
            "status": "warn",
            "detail": f"Suspiciously fast: {'; '.join(fast_tasks[:5])}",
        }
    return {
        "check": "effort_detection",
        "status": "pass",
        "detail": "No suspiciously fast completions",
    }


def run_auditor_quick() -> list[dict]:
    """Run quick auditor checks (inline with heartbeat). Deep checks run nightly."""
    checks = [
        auditor_check_reward_hacking,
        auditor_check_effort,
    ]
    results = []
    for fn in checks:
        try:
            result = fn()
        except Exception as e:
            result = {
                "check": fn.__name__.replace("auditor_check_", ""),
                "status": "fail",
                "detail": f"Exception: {e}",
            }
        result["observer"] = "auditor"
        result["timestamp"] = _now_iso()
        results.append(result)
    return results


# ---------------------------------------------------------------------------
# Main Runner
# ---------------------------------------------------------------------------

def run_all_observers() -> list[dict]:
    """Run sentinel + quick auditor checks. Write all findings to observer-log.jsonl."""
    all_results = []
    all_results.extend(run_sentinel())
    all_results.extend(run_auditor_quick())

    for entry in all_results:
        _append_log(entry)

    # Print summary
    passed = sum(1 for r in all_results if r["status"] == "pass")
    warned = sum(1 for r in all_results if r["status"] == "warn")
    failed = sum(1 for r in all_results if r["status"] == "fail")
    print(f"Observers: {passed} pass, {warned} warn, {failed} fail ({len(all_results)} checks)")
    for r in all_results:
        icon = {"pass": "+", "warn": "!", "fail": "X"}.get(r["status"], "?")
        print(f"  [{icon}] {r['observer']}/{r['check']}: {r['detail']}")

    return all_results


def show_status():
    """Show last observer run results from observer-log.jsonl."""
    if not OBSERVER_LOG.exists():
        print("No observer log found.")
        return

    # Read last batch (same timestamp prefix)
    lines = OBSERVER_LOG.read_text(encoding="utf-8").strip().splitlines()
    if not lines:
        print("Observer log is empty.")
        return

    # Parse last entries
    entries = []
    for line in lines[-20:]:
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            pass

    if not entries:
        print("No valid entries in observer log.")
        return

    # Find the latest timestamp and group entries from that run
    latest_ts = entries[-1].get("timestamp", "")[:16]  # group by minute
    latest_batch = [e for e in entries if e.get("timestamp", "")[:16] == latest_ts]

    print(f"Last observer run: {latest_ts}")
    print(f"{'Observer':<12} {'Check':<24} {'Status':<6} Detail")
    print("-" * 70)
    for e in latest_batch:
        print(f"{e.get('observer', '?'):<12} {e.get('check', '?'):<24} {e.get('status', '?'):<6} {e.get('detail', '')}")


if __name__ == "__main__":
    # Ensure we can import from sartor/
    import sys
    sys.path.insert(0, str(SARTOR_DIR))

    parser = argparse.ArgumentParser(description="Observer Runner for Sartor system")
    parser.add_argument("--status", action="store_true", help="Show last observer results")
    parser.add_argument("--sentinel", action="store_true", help="Run sentinel checks only")
    parser.add_argument("--auditor", action="store_true", help="Run auditor quick checks only")
    args = parser.parse_args()

    if args.status:
        show_status()
    elif args.sentinel:
        results = run_sentinel()
        for entry in results:
            _append_log(entry)
        for r in results:
            icon = {"pass": "+", "warn": "!", "fail": "X"}.get(r["status"], "?")
            print(f"  [{icon}] {r['check']}: {r['detail']}")
    elif args.auditor:
        results = run_auditor_quick()
        for entry in results:
            _append_log(entry)
        for r in results:
            icon = {"pass": "+", "warn": "!", "fail": "X"}.get(r["status"], "?")
            print(f"  [{icon}] {r['check']}: {r['detail']}")
    else:
        run_all_observers()
