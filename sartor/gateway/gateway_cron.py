#!/usr/bin/env python3
"""
Sartor Gateway Cron - Periodic automation loop for the Sartor personal assistant.

Runs every 30 minutes via cron. Each cycle:
  1. Reads all memory files from sartor/memory/
  2. Checks tasks/ACTIVE.md for pending items
  3. Checks today's daily log
  4. Decides what (if anything) needs attention
  5. Runs one bounded task if appropriate (respecting config.yaml autonomy rules)
  6. Writes a session log entry to sartor/memory/daily/YYYY-MM-DD.md
  7. Commits memory changes to git (does NOT push)
  8. Exits cleanly

Hard timeout: 5 minutes. Respects daily cost limits from costs.json.

Usage:
    python3 gateway_cron.py                # Normal cycle
    python3 gateway_cron.py --dry-run      # Log what would happen, don't act
    python3 gateway_cron.py --verbose       # Extra logging to stderr
    python3 gateway_cron.py --once          # Run once and exit (default; for clarity)
"""

import argparse
import json
import math
import re
import signal
import subprocess
import sys
import time
from datetime import datetime, date
from pathlib import Path
from typing import Optional

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML required. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# Paths (all relative to this file's location)
# ---------------------------------------------------------------------------

GATEWAY_DIR = Path(__file__).resolve().parent
SARTOR_DIR = GATEWAY_DIR.parent
REPO_DIR = SARTOR_DIR.parent  # ~/Sartor-claude-network

MEMORY_DIR = SARTOR_DIR / "memory"
DAILY_DIR = MEMORY_DIR / "daily"
TASKS_DIR = SARTOR_DIR / "tasks"
TASKS_FILE = TASKS_DIR / "ACTIVE.md"
CONFIG_FILE = SARTOR_DIR / "harness" / "config.yaml"
COSTS_FILE = SARTOR_DIR / "costs.json"


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

HARD_TIMEOUT_SECONDS = 300  # 5 minutes
DEFAULT_DAILY_COST_LIMIT = 5.00  # dollars
CYCLE_COST = 0.00  # no API cost for rule-based cycles (placeholder for future)


# ---------------------------------------------------------------------------
# Timeout handling
# ---------------------------------------------------------------------------

class CycleTimeoutError(Exception):
    pass


def _timeout_handler(signum, frame):
    raise CycleTimeoutError(
        f"Cycle exceeded hard timeout of {HARD_TIMEOUT_SECONDS}s"
    )


# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------

def load_config() -> dict:
    """Load harness config.yaml. Returns empty dict on failure."""
    if not CONFIG_FILE.is_file():
        return {}
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def load_costs() -> dict:
    """Load costs.json. Returns defaults if missing."""
    if not COSTS_FILE.is_file():
        return {
            "daily_limit": DEFAULT_DAILY_COST_LIMIT,
            "spent_today": 0.0,
            "last_reset": date.today().isoformat(),
        }
    with open(COSTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Reset daily spend if it is a new day
    if data.get("last_reset") != date.today().isoformat():
        data["spent_today"] = 0.0
        data["last_reset"] = date.today().isoformat()
    return data


def save_costs(costs: dict) -> None:
    """Write costs.json back to disk."""
    COSTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(COSTS_FILE, "w", encoding="utf-8") as f:
        json.dump(costs, f, indent=2)


def check_budget(costs: dict) -> bool:
    """Return True if we are within budget for today."""
    limit = costs.get("daily_limit", DEFAULT_DAILY_COST_LIMIT)
    spent = costs.get("spent_today", 0.0)
    return spent < limit


# ---------------------------------------------------------------------------
# Memory reading
# ---------------------------------------------------------------------------

def read_memory_files() -> dict:
    """Read all .md files from memory/ (non-recursive). Returns {name: content}."""
    files = {}
    if not MEMORY_DIR.is_dir():
        return files
    for p in sorted(MEMORY_DIR.glob("*.md")):
        try:
            files[p.stem] = p.read_text(encoding="utf-8")
        except Exception:
            files[p.stem] = ""
    return files


def read_today_daily() -> str:
    """Read today's daily log, or empty string if none exists."""
    today_file = DAILY_DIR / f"{date.today().isoformat()}.md"
    if today_file.is_file():
        return today_file.read_text(encoding="utf-8")
    return ""


# ---------------------------------------------------------------------------
# Task parsing (mirrors harness/runner.py logic)
# ---------------------------------------------------------------------------

_TASK_RE = re.compile(r"^- \[([ xX])\]\s+\*\*(.+?)\*\*\s*(?:-\s*(.*))?$")
_META_RE = re.compile(
    r"^\s+-\s+(Priority|Owner|Tags|Started|Blocked by|Depends on):\s*(.+)$",
    re.IGNORECASE,
)
_SECTION_RE = re.compile(r"^##\s+(.+)$")


class Task:
    """Lightweight task parsed from ACTIVE.md."""

    def __init__(self, name, done, description, section):
        self.name = name
        self.done = done
        self.description = description
        self.section = section
        self.priority = "Medium"
        self.owner = ""
        self.tags = []
        self.started = ""
        self.blocked_by = ""
        self.depends_on = ""

    @property
    def is_blocked(self):
        return bool(self.blocked_by or self.depends_on)

    @property
    def is_actionable(self):
        return not self.done and not self.is_blocked

    def __repr__(self):
        return f"Task({self.name!r}, done={self.done}, blocked={self.is_blocked})"


def parse_tasks():
    """Parse ACTIVE.md and return task list."""
    if not TASKS_FILE.is_file():
        return []

    lines = TASKS_FILE.read_text(encoding="utf-8").splitlines()
    tasks = []
    current = None
    section = ""

    for line in lines:
        sec_m = _SECTION_RE.match(line)
        if sec_m:
            section = sec_m.group(1).strip()
            continue

        task_m = _TASK_RE.match(line)
        if task_m:
            if current is not None:
                tasks.append(current)
            current = Task(
                name=task_m.group(2).strip(),
                done=task_m.group(1).lower() == "x",
                description=(task_m.group(3) or "").strip(),
                section=section,
            )
            continue

        if current is not None:
            meta_m = _META_RE.match(line)
            if meta_m:
                key = meta_m.group(1).strip().lower()
                val = meta_m.group(2).strip()
                if key == "priority":
                    current.priority = val
                elif key == "owner":
                    current.owner = val
                elif key == "tags":
                    current.tags = [t.strip() for t in val.split(",")]
                elif key == "started":
                    current.started = val
                elif key == "blocked by":
                    current.blocked_by = val
                elif key == "depends on":
                    current.depends_on = val

    if current is not None:
        tasks.append(current)

    return tasks


# ---------------------------------------------------------------------------
# Decision engine (rule-based, no LLM)
# ---------------------------------------------------------------------------

# Model routing tiers for future use -- classify tasks by complexity.
TIER_ROUTINE = "routine"      # file checks, simple updates
TIER_STANDARD = "standard"    # research, code review, summarization
TIER_CRITICAL = "critical"    # anything touching production, finances, comms


def classify_task_tier(task):
    """Classify a task into a model routing tier based on tags and priority."""
    critical_tags = {"modify_production", "financial_decisions", "production_deploy"}
    standard_tags = {"research", "code_review", "summarize", "generate_code"}
    routine_tags = {"organize_files", "run_tests", "update_memory", "search_memory"}

    tag_set = set(task.tags)
    if tag_set & critical_tags or task.priority == "Critical":
        return TIER_CRITICAL
    if tag_set & standard_tags or task.priority == "High":
        return TIER_STANDARD
    return TIER_ROUTINE


def get_autonomy_level(config, tags):
    """Check config autonomy rules. Returns autonomous/ask_first/never/unknown."""
    autonomy = config.get("autonomy", {})
    never_set = set(autonomy.get("never", []))
    ask_first_set = set(autonomy.get("ask_first", []))
    autonomous_set = set(autonomy.get("autonomous", []))
    tag_set = set(tags)

    if tag_set & never_set:
        return "never"
    if tag_set & ask_first_set:
        return "ask_first"
    if tag_set & autonomous_set:
        return "autonomous"
    return "unknown"


def pick_task(tasks, config):
    """Pick the highest-priority actionable autonomous task, or None."""
    priority_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    candidates = []

    for t in tasks:
        if not t.is_actionable:
            continue
        level = get_autonomy_level(config, t.tags)
        if level != "autonomous":
            continue
        candidates.append(t)

    if not candidates:
        return None

    # Sort by priority (Critical first)
    candidates.sort(key=lambda t: priority_order.get(t.priority, 99))
    return candidates[0]


# ---------------------------------------------------------------------------
# BM25 memory search (lightweight inline implementation)
# ---------------------------------------------------------------------------

def search_memory(query, memory_files, limit=5):
    """
    Simple BM25-style keyword search across memory file contents.
    Returns [(filename, score), ...] sorted by relevance descending.
    """
    query_terms = query.lower().split()
    if not query_terms:
        return []

    scores = {}
    num_docs = max(len(memory_files), 1)

    # Document frequencies for IDF
    df = {}
    for term in query_terms:
        df[term] = sum(
            1 for content in memory_files.values() if term in content.lower()
        )

    for name, content in memory_files.items():
        text = f"{name} {content}".lower()
        doc_len = max(len(text.split()), 1)
        score = 0.0
        for term in query_terms:
            tf = text.count(term)
            if tf == 0:
                continue
            # BM25 (k1=1.5, b=0.75, avg_dl assumed 500)
            idf = math.log(
                (num_docs - df[term] + 0.5) / (df[term] + 0.5) + 1.0
            )
            tf_norm = (tf * 2.5) / (tf + 1.5 * (0.25 + 0.75 * doc_len / 500.0))
            score += idf * tf_norm
            # Boost for filename match
            if term in name.lower():
                score += 2.0

        if score > 0:
            scores[name] = score

    ranked = sorted(scores.items(), key=lambda x: -x[1])
    return ranked[:limit]


# ---------------------------------------------------------------------------
# Daily log writing
# ---------------------------------------------------------------------------

def write_cycle_log(status, tasks_pending, tasks_completed_today, action, cost, notes):
    """Append a cycle entry to today's daily log."""
    today_str = date.today().isoformat()
    daily_file = DAILY_DIR / f"{today_str}.md"
    DAILY_DIR.mkdir(parents=True, exist_ok=True)

    now = datetime.now().strftime("%H:%M")

    # Create file with header if it does not exist
    if not daily_file.is_file():
        header = (
            f"# Daily Log - {today_str}\n"
            f"> Auto-generated by Sartor gateway cron\n\n"
        )
        daily_file.write_text(header, encoding="utf-8")

    entry = (
        f"\n### {now} Cycle\n"
        f"- Status: {status}\n"
        f"- Tasks checked: {tasks_pending} pending, "
        f"{tasks_completed_today} completed today\n"
        f"- Actions: {action}\n"
        f"- Cost this cycle: ${cost:.2f}\n"
        f"- Notes: {notes}\n"
    )

    with open(daily_file, "a", encoding="utf-8") as f:
        f.write(entry)


# ---------------------------------------------------------------------------
# Git commit (memory changes only, no push)
# ---------------------------------------------------------------------------

def git_commit_memory(dry_run=False, verbose=False):
    """Stage and commit changes under sartor/memory/, sartor/tasks/, and
    sartor/costs.json. Returns True on success."""
    try:
        # Check for changes first
        result = subprocess.run(
            [
                "git", "status", "--porcelain",
                "sartor/memory/", "sartor/tasks/", "sartor/costs.json",
            ],
            capture_output=True, text=True, cwd=str(REPO_DIR), timeout=30,
        )
        changes = result.stdout.strip()
        if not changes:
            if verbose:
                print("  [git] No changes to commit.", file=sys.stderr)
            return True

        if dry_run:
            if verbose:
                print(
                    f"  [git] Would commit changes:\n{changes}", file=sys.stderr
                )
            return True

        # Stage the relevant paths
        subprocess.run(
            [
                "git", "add",
                "sartor/memory/", "sartor/tasks/", "sartor/costs.json",
            ],
            capture_output=True, text=True, cwd=str(REPO_DIR), timeout=30,
        )

        # Commit
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        msg = f"sartor-cron: cycle at {now}"
        result = subprocess.run(
            ["git", "commit", "-m", msg],
            capture_output=True, text=True, cwd=str(REPO_DIR), timeout=30,
        )
        if result.returncode != 0:
            if "nothing to commit" in result.stdout:
                return True
            print(
                f"  [git] Commit failed: {result.stderr.strip()}",
                file=sys.stderr,
            )
            return False

        if verbose:
            print(f"  [git] Committed: {msg}", file=sys.stderr)
        return True

    except subprocess.TimeoutExpired:
        print("  [git] Timeout during git operation.", file=sys.stderr)
        return False
    except FileNotFoundError:
        print("  [git] git not found in PATH.", file=sys.stderr)
        return False
    except Exception as e:
        print(f"  [git] Error: {e}", file=sys.stderr)
        return False


# ---------------------------------------------------------------------------
# Main cycle
# ---------------------------------------------------------------------------

def run_cycle(dry_run=False, verbose=False):
    """
    Execute one cron cycle. Returns exit code (0=ok, 1=warning, 2=error).
    """
    start_time = time.time()
    status = "ok"
    action = "no action needed"
    notes_parts = []
    cost = CYCLE_COST

    if verbose:
        print(
            f"[sartor-cron] Cycle starting at {datetime.now().isoformat()}",
            file=sys.stderr,
        )

    # -- Step 0: Check budget -------------------------------------------
    costs = load_costs()
    if not check_budget(costs):
        status = "warning"
        action = "skipped - daily cost limit reached"
        notes_parts.append(
            f"Spent ${costs['spent_today']:.2f} of "
            f"${costs['daily_limit']:.2f} limit"
        )
        write_cycle_log(
            status, 0, 0, action, 0.0,
            "; ".join(notes_parts) or "none",
        )
        if verbose:
            print("  Budget exhausted. Skipping cycle.", file=sys.stderr)
        return 1

    # -- Step 1: Load config --------------------------------------------
    config = load_config()
    if not config:
        notes_parts.append("config.yaml missing or empty")
        if verbose:
            print("  WARNING: config.yaml not found.", file=sys.stderr)

    # -- Step 2: Read memory files --------------------------------------
    memory_files = read_memory_files()
    if verbose:
        print(f"  Loaded {len(memory_files)} memory files.", file=sys.stderr)

    # -- Step 3: Read today's daily log ---------------------------------
    today_log = read_today_daily()
    cycles_today = today_log.count("### ") if today_log else 0
    if verbose:
        print(f"  Cycles already today: {cycles_today}", file=sys.stderr)

    # -- Step 4: Parse tasks --------------------------------------------
    tasks = parse_tasks()
    pending = [t for t in tasks if not t.done]
    actionable = [t for t in pending if t.is_actionable]
    blocked = [t for t in pending if t.is_blocked]
    completed = [t for t in tasks if t.done]

    if verbose:
        print(
            f"  Tasks: {len(pending)} pending, {len(actionable)} actionable, "
            f"{len(blocked)} blocked, {len(completed)} completed.",
            file=sys.stderr,
        )

    # Estimate how many were completed "today" by checking the daily log
    completed_today = 0
    if today_log:
        for t in completed:
            if t.name.lower() in today_log.lower():
                completed_today += 1

    # -- Step 5: Decide what to do --------------------------------------
    chosen_task = pick_task(tasks, config)

    if chosen_task:
        tier = classify_task_tier(chosen_task)
        autonomy = get_autonomy_level(config, chosen_task.tags)

        if verbose:
            print(
                f"  Selected task: {chosen_task.name} "
                f"(tier={tier}, autonomy={autonomy}, "
                f"priority={chosen_task.priority})",
                file=sys.stderr,
            )

        if dry_run:
            action = (
                f"[DRY RUN] would process: {chosen_task.name} (tier={tier})"
            )
            notes_parts.append(f"Task priority: {chosen_task.priority}")
        else:
            # For now (no Claude API), log what WOULD be done
            action = (
                f"identified task: {chosen_task.name} "
                f"(tier={tier}, awaiting LLM integration)"
            )
            notes_parts.append(f"Task priority: {chosen_task.priority}")
            notes_parts.append(
                f"Owner: {chosen_task.owner or 'unassigned'}"
            )
            if chosen_task.description:
                notes_parts.append(
                    f"Description: {chosen_task.description[:120]}"
                )

        # Search memory for context related to the chosen task
        if memory_files:
            search_results = search_memory(
                chosen_task.name, memory_files, limit=3
            )
            if search_results and verbose:
                top_files = ", ".join(
                    f"{name}({score:.1f})" for name, score in search_results
                )
                print(f"  Related memory: {top_files}", file=sys.stderr)
            if search_results:
                notes_parts.append(
                    "Related memory: "
                    + ", ".join(name for name, _ in search_results)
                )
    else:
        if not actionable:
            notes_parts.append(
                f"{len(pending)} pending tasks but none are "
                f"autonomous+unblocked"
            )
        else:
            notes_parts.append(
                "No tasks matched autonomous autonomy level"
            )

        if verbose:
            print(
                "  No actionable autonomous task found.", file=sys.stderr
            )

    # -- Step 6: Update costs -------------------------------------------
    costs["spent_today"] = costs.get("spent_today", 0.0) + cost
    if not dry_run:
        save_costs(costs)

    # -- Step 7: Write daily log entry ----------------------------------
    elapsed = time.time() - start_time
    notes_parts.append(f"Cycle took {elapsed:.1f}s")
    notes_str = "; ".join(notes_parts) if notes_parts else "none"

    write_cycle_log(
        status=status,
        tasks_pending=len(pending),
        tasks_completed_today=completed_today,
        action=action,
        cost=cost,
        notes=notes_str,
    )

    if verbose:
        print("  Logged cycle entry to daily log.", file=sys.stderr)

    # -- Step 8: Git commit ---------------------------------------------
    git_ok = git_commit_memory(dry_run=dry_run, verbose=verbose)
    if not git_ok:
        notes_parts.append("git commit failed")
        status = "warning"

    elapsed_total = time.time() - start_time
    if verbose:
        print(
            f"[sartor-cron] Cycle complete in {elapsed_total:.1f}s "
            f"(status={status})",
            file=sys.stderr,
        )

    return 0 if status == "ok" else 1


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Sartor gateway cron - periodic automation loop",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python3 gateway_cron.py --dry-run --verbose\n"
            "  python3 gateway_cron.py --once\n"
            "\n"
            "Designed to be called from crontab every 30 minutes.\n"
            "Hard timeout: 5 minutes."
        ),
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Log decisions but do not execute tasks or commit",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true",
        help="Print detailed progress to stderr",
    )
    parser.add_argument(
        "--once", action="store_true", default=True,
        help="Run one cycle and exit (default behavior, for clarity)",
    )
    args = parser.parse_args()

    # Set hard timeout (Unix only; harmless no-op on Windows)
    if hasattr(signal, "SIGALRM"):
        signal.signal(signal.SIGALRM, _timeout_handler)
        signal.alarm(HARD_TIMEOUT_SECONDS)

    try:
        exit_code = run_cycle(dry_run=args.dry_run, verbose=args.verbose)
    except CycleTimeoutError as e:
        print(f"FATAL: {e}", file=sys.stderr)
        # Still try to log the timeout
        try:
            write_cycle_log(
                status="error",
                tasks_pending=0,
                tasks_completed_today=0,
                action="aborted - hard timeout exceeded",
                cost=0.0,
                notes=str(e),
            )
        except Exception:
            pass
        exit_code = 2
    except Exception as e:
        print(f"FATAL: Unhandled exception: {e}", file=sys.stderr)
        try:
            write_cycle_log(
                status="error",
                tasks_pending=0,
                tasks_completed_today=0,
                action=f"crashed: {type(e).__name__}",
                cost=0.0,
                notes=str(e)[:200],
            )
        except Exception:
            pass
        exit_code = 2

    # Cancel alarm
    if hasattr(signal, "SIGALRM"):
        signal.alarm(0)

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
