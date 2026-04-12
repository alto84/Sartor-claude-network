#!/usr/bin/env python3
"""
Scheduled Task Executor — reads SKILL.md definitions and determines which are due.

Maintains a schedule registry (hardcoded cron expressions) and checks against
the last-run log (data/heartbeat-log.csv) to determine what's due.
"""

import os
import re
import csv
from datetime import datetime, timedelta
from pathlib import Path

# Hardcoded schedule registry (from CLAUDE.md)
SCHEDULE_REGISTRY = {
    "morning-briefing": {"cron": "30 6 * * *", "model": "sonnet"},
    "personal-data-gather": {"cron": "0 */4 * * *", "model": "sonnet"},
    "gpu-utilization-check": {"cron": "0 */4 * * *", "model": "haiku"},
    "self-improvement-loop": {"cron": "0 */6 * * *", "model": "sonnet"},
    "market-close-summary": {"cron": "30 16 * * 1-5", "model": "sonnet"},
    "nightly-memory-curation": {"cron": "0 23 * * *", "model": "sonnet"},
    "weekly-financial-summary": {"cron": "0 18 * * 5", "model": "sonnet"},
    "weekly-nonprofit-review": {"cron": "0 9 * * 0", "model": "sonnet"},
    "weekly-skill-evolution": {"cron": "0 3 * * 0", "model": "sonnet"},
}

REPO_ROOT = Path(__file__).parent.parent
SCHEDULED_TASKS_DIR = REPO_ROOT / ".claude" / "scheduled-tasks"
DEFAULT_HEARTBEAT_LOG = REPO_ROOT / "data" / "heartbeat-log.csv"


def parse_skill_md(skill_path: Path) -> dict:
    """Parse YAML frontmatter and body from a SKILL.md file."""
    content = skill_path.read_text(encoding="utf-8")

    frontmatter = {}
    instructions = content

    # Extract YAML frontmatter between --- delimiters
    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)", content, re.DOTALL)
    if fm_match:
        fm_block = fm_match.group(1)
        instructions = fm_match.group(2).strip()
        for line in fm_block.splitlines():
            if ":" in line:
                key, _, value = line.partition(":")
                frontmatter[key.strip()] = value.strip()

    return {
        "name": frontmatter.get("name", skill_path.parent.name),
        "description": frontmatter.get("description", ""),
        "model": frontmatter.get("model", "sonnet"),
        "instructions": instructions,
    }


def get_last_run(task_name: str, heartbeat_log_path: Path) -> datetime | None:
    """Get the last successful run time for a task from heartbeat-log.csv."""
    if not heartbeat_log_path or not heartbeat_log_path.exists():
        return None

    last_run = None
    try:
        with open(heartbeat_log_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Support both 'task' and 'task_name' column names
                row_task = row.get("task") or row.get("task_name", "")
                row_status = row.get("status", "")
                if row_task == task_name and row_status.lower() in ("completed", "ok"):
                    ts_str = row.get("timestamp") or row.get("datetime") or row.get("time", "")
                    if ts_str:
                        try:
                            ts = datetime.fromisoformat(ts_str)
                            if last_run is None or ts > last_run:
                                last_run = ts
                        except ValueError:
                            pass
    except Exception:
        pass

    return last_run


def _parse_cron_field(field: str, current_val: int, min_val: int, max_val: int) -> bool:
    """Return True if current_val matches the cron field expression."""
    # Wildcard
    if field == "*":
        return True

    # Step value: */n or start/n
    if "/" in field:
        parts = field.split("/", 1)
        step = int(parts[1])
        base_field = parts[0]
        if base_field == "*":
            start = min_val
        else:
            start = int(base_field)
        return (current_val - start) % step == 0 and current_val >= start

    # Range: start-end
    if "-" in field:
        start, end = field.split("-", 1)
        return int(start) <= current_val <= int(end)

    # List: a,b,c
    if "," in field:
        return any(_parse_cron_field(part, current_val, min_val, max_val) for part in field.split(","))

    # Specific number
    return int(field) == current_val


def _cron_interval_minutes(cron_expr: str) -> int:
    """Estimate the approximate interval in minutes between cron fires."""
    fields = cron_expr.split()
    if len(fields) != 5:
        return 1440  # default 1 day

    minute_f, hour_f, dom_f, month_f, dow_f = fields

    # Detect step on hours: */4 → 240 min
    if hour_f.startswith("*/"):
        step = int(hour_f[2:])
        return step * 60

    # Detect day-of-week restriction (weekly)
    if dow_f not in ("*", "1-5"):
        return 7 * 24 * 60

    # Weekday-only with specific time → daily
    if dow_f == "1-5":
        return 24 * 60

    # Default: daily
    return 24 * 60


def is_due(cron_expr: str, last_run: datetime | None, now: datetime | None = None) -> bool:
    """
    Check if a cron expression is due given the last run time.

    Rules:
    1. If last_run is None (never run), it is always due.
    2. Otherwise, check if the current time matches the cron pattern AND
       enough time has elapsed since the last run (≥ estimated interval * 0.8).
    """
    if now is None:
        now = datetime.now()

    if last_run is None:
        return True

    fields = cron_expr.split()
    if len(fields) != 5:
        return False

    minute_f, hour_f, dom_f, month_f, dow_f = fields

    # Check if current moment matches the cron schedule
    matches_minute = _parse_cron_field(minute_f, now.minute, 0, 59)
    matches_hour = _parse_cron_field(hour_f, now.hour, 0, 23)
    matches_dom = _parse_cron_field(dom_f, now.day, 1, 31)
    matches_month = _parse_cron_field(month_f, now.month, 1, 12)
    # day-of-week: 0 and 7 both = Sunday
    dow_val = now.weekday() + 1  # Monday=1 ... Sunday=7, then map 7→0
    if dow_val == 7:
        dow_val = 0
    matches_dow = _parse_cron_field(dow_f, dow_val, 0, 6)

    if not (matches_minute and matches_hour and matches_dom and matches_month and matches_dow):
        return False

    # Check that enough time has passed since last run (avoid re-running within same window)
    interval_minutes = _cron_interval_minutes(cron_expr)
    min_gap = timedelta(minutes=interval_minutes * 0.8)
    return (now - last_run) >= min_gap


def _next_fire_description(cron_expr: str, now: datetime | None = None) -> str:
    """Return a human-readable approximation of the next fire time."""
    if now is None:
        now = datetime.now()

    fields = cron_expr.split()
    if len(fields) != 5:
        return "unknown"

    minute_f, hour_f, dom_f, month_f, dow_f = fields

    # Walk forward minute by minute up to 8 days
    candidate = now.replace(second=0, microsecond=0) + timedelta(minutes=1)
    for _ in range(8 * 24 * 60):
        mf, hf, df, mnf, dwf = fields
        dow_val = candidate.weekday() + 1
        if dow_val == 7:
            dow_val = 0
        if (
            _parse_cron_field(mf, candidate.minute, 0, 59)
            and _parse_cron_field(hf, candidate.hour, 0, 23)
            and _parse_cron_field(df, candidate.day, 1, 31)
            and _parse_cron_field(mnf, candidate.month, 1, 12)
            and _parse_cron_field(dwf, dow_val, 0, 6)
        ):
            return candidate.strftime("%Y-%m-%d %H:%M")
        candidate += timedelta(minutes=1)

    return "unknown"


def get_due_tasks(
    scheduled_tasks_dir: Path | None = None,
    heartbeat_log_path: Path | None = None,
) -> list[dict]:
    """
    Scan scheduled-tasks directory, check which tasks are due, return list of dicts.

    Each dict contains:
        name, model, instructions, cron, last_run, priority

    Sorted by priority (most overdue first; None last_run = highest priority).
    """
    if scheduled_tasks_dir is None:
        scheduled_tasks_dir = SCHEDULED_TASKS_DIR
    if heartbeat_log_path is None:
        heartbeat_log_path = DEFAULT_HEARTBEAT_LOG

    now = datetime.now()
    due = []

    for task_name, registry_entry in SCHEDULE_REGISTRY.items():
        skill_path = scheduled_tasks_dir / task_name / "SKILL.md"
        if not skill_path.exists():
            continue

        parsed = parse_skill_md(skill_path)
        cron = registry_entry["cron"]
        # Registry model takes precedence over SKILL.md model
        model = registry_entry.get("model") or parsed.get("model", "sonnet")
        last_run = get_last_run(task_name, heartbeat_log_path)

        if not is_due(cron, last_run, now):
            continue

        if last_run is None:
            # Never run — highest priority
            minutes_overdue = float("inf")
        else:
            interval_minutes = _cron_interval_minutes(cron)
            elapsed = (now - last_run).total_seconds() / 60
            minutes_overdue = elapsed - interval_minutes

        due.append({
            "name": task_name,
            "model": model,
            "instructions": parsed["instructions"],
            "cron": cron,
            "last_run": last_run,
            "priority": minutes_overdue,
        })

    # Sort most overdue first (higher minutes_overdue = higher priority = lower sort key)
    due.sort(key=lambda t: -t["priority"] if t["priority"] != float("inf") else float("-inf"))

    return due


def show_schedule(
    scheduled_tasks_dir: Path | None = None,
    heartbeat_log_path: Path | None = None,
) -> None:
    """CLI: Print all scheduled tasks with their status."""
    if scheduled_tasks_dir is None:
        scheduled_tasks_dir = SCHEDULED_TASKS_DIR
    if heartbeat_log_path is None:
        heartbeat_log_path = DEFAULT_HEARTBEAT_LOG

    now = datetime.now()
    print(f"\nScheduled Tasks — {now.strftime('%Y-%m-%d %H:%M')}")
    print("=" * 72)

    header = f"{'Task':<30} {'Cron':<16} {'Last Run':<20} {'Next Due':<17} {'Status'}"
    print(header)
    print("-" * 72)

    for task_name, registry_entry in SCHEDULE_REGISTRY.items():
        cron = registry_entry["cron"]
        last_run = get_last_run(task_name, heartbeat_log_path)
        due = is_due(cron, last_run, now)
        next_due = _next_fire_description(cron, now)

        last_run_str = last_run.strftime("%Y-%m-%d %H:%M") if last_run else "never"
        status = "DUE NOW" if due else "ok"

        skill_path = scheduled_tasks_dir / task_name / "SKILL.md"
        exists_marker = "" if skill_path.exists() else " [no SKILL.md]"

        print(
            f"{task_name + exists_marker:<30} {cron:<16} {last_run_str:<20} {next_due:<17} {status}"
        )

    print()


def check_due(
    scheduled_tasks_dir: Path | None = None,
    heartbeat_log_path: Path | None = None,
) -> None:
    """CLI: Show what would run right now."""
    due = get_due_tasks(scheduled_tasks_dir, heartbeat_log_path)
    now = datetime.now()
    print(f"\nDue tasks at {now.strftime('%Y-%m-%d %H:%M')}:")
    if not due:
        print("  (none)")
    else:
        for t in due:
            lr = t["last_run"].strftime("%Y-%m-%d %H:%M") if t["last_run"] else "never"
            print(f"  {t['name']:<30} model={t['model']}  last_run={lr}")
    print()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Scheduled Task Executor")
    parser.add_argument("--status", action="store_true", help="Show all tasks and their schedule status")
    parser.add_argument("--check", action="store_true", help="Show what would run now")
    args = parser.parse_args()

    if args.status:
        show_schedule()
    elif args.check:
        check_due()
    else:
        parser.print_help()
