#!/usr/bin/env python3
"""
Sartor Task Harness Runner

Reads tasks from ACTIVE.md, checks autonomy config, and executes tasks
by spawning Claude Code via subprocess.

Usage:
    python runner.py --status          Show current task queue
    python runner.py --check           Dry run - show what would be done
    python runner.py --run             Execute pending autonomous tasks
    python runner.py --run --task "Task name"   Execute a specific task
    python runner.py --search "query"  Search memory files
"""

import argparse
import math
import os
import re
import subprocess
import sys
import time
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML is required. Install with: pip install pyyaml")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

HARNESS_DIR = Path(__file__).resolve().parent
CONFIG_PATH = HARNESS_DIR / "config.yaml"
RESULTS_DIR = HARNESS_DIR / "results"
SARTOR_DIR = HARNESS_DIR.parent  # sartor/
TASKS_DIR = SARTOR_DIR / "tasks"
MEMORY_DIR = SARTOR_DIR / "memory"
DAILY_DIR = MEMORY_DIR / "daily"


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

def load_config() -> dict:
    """Load and validate the harness configuration."""
    if not CONFIG_PATH.exists():
        print(f"ERROR: Config file not found at {CONFIG_PATH}")
        sys.exit(1)
    with open(CONFIG_PATH, "r") as f:
        config = yaml.safe_load(f)
    # Validate required keys
    for key in ("harness", "autonomy"):
        if key not in config:
            print(f"ERROR: Missing required config key: {key}")
            sys.exit(1)
    return config


def get_autonomy_level(config: dict, tags: list[str]) -> str:
    """
    Determine the autonomy level for a task based on its tags.

    Returns one of: 'autonomous', 'ask_first', 'never', 'unknown'
    Priority: never > ask_first > autonomous (most restrictive wins)
    """
    autonomy = config["autonomy"]
    never_set = set(autonomy.get("never", []))
    ask_first_set = set(autonomy.get("ask_first", []))
    autonomous_set = set(autonomy.get("autonomous", []))

    tag_set = set(tags)

    # Check never first (most restrictive)
    if tag_set & never_set:
        return "never"
    # Then ask_first
    if tag_set & ask_first_set:
        return "ask_first"
    # Then autonomous
    if tag_set & autonomous_set:
        return "autonomous"
    # No matching tags
    return "unknown"


# ---------------------------------------------------------------------------
# Task parsing
# ---------------------------------------------------------------------------

class Task:
    """Represents a parsed task from ACTIVE.md."""

    def __init__(self):
        self.name: str = ""
        self.description: str = ""
        self.done: bool = False
        self.priority: str = "Medium"
        self.owner: str = ""
        self.tags: list[str] = []
        self.started: str = ""
        self.blocked_by: str = ""
        self.depends_on: str = ""
        self.section: str = ""  # "In Progress", "Pending", etc.
        self.raw_lines: list[str] = []

    @property
    def is_blocked(self) -> bool:
        return bool(self.blocked_by or self.depends_on)

    def __repr__(self):
        status = "done" if self.done else ("blocked" if self.is_blocked else "pending")
        return f"Task({self.name!r}, {status}, priority={self.priority}, tags={self.tags})"


def parse_active_md(filepath: Path) -> list[Task]:
    """
    Parse tasks/ACTIVE.md and return a list of Task objects.

    Expected format:
        - [ ] **Task name** - description
          - Priority: High/Medium/Low
          - Owner: name
          - Tags: tag1, tag2
          - Started: date
          - Blocked by: reason
          - Depends on: dependency
    """
    if not filepath.exists():
        print(f"ERROR: Tasks file not found at {filepath}")
        return []

    with open(filepath, "r") as f:
        lines = f.readlines()

    tasks: list[Task] = []
    current_task: Optional[Task] = None
    current_section = ""

    # Pattern for task line: - [ ] **Name** - description  OR  - [x] **Name** - description
    task_pattern = re.compile(
        r"^- \[([ xX])\]\s+\*\*(.+?)\*\*\s*(?:-\s*(.*))?$"
    )
    # Pattern for metadata lines
    meta_pattern = re.compile(
        r"^\s+-\s+(Priority|Owner|Tags|Started|Blocked by|Depends on):\s*(.+)$",
        re.IGNORECASE,
    )
    # Section header
    section_pattern = re.compile(r"^##\s+(.+)$")

    for line in lines:
        stripped = line.rstrip("\n")

        # Check for section header
        sec_match = section_pattern.match(stripped)
        if sec_match:
            current_section = sec_match.group(1).strip()
            continue

        # Check for task line
        task_match = task_pattern.match(stripped)
        if task_match:
            # Save previous task
            if current_task:
                tasks.append(current_task)
            current_task = Task()
            current_task.done = task_match.group(1).lower() == "x"
            current_task.name = task_match.group(2).strip()
            current_task.description = (task_match.group(3) or "").strip()
            current_task.section = current_section
            current_task.raw_lines.append(stripped)
            continue

        # Check for metadata
        if current_task:
            meta_match = meta_pattern.match(stripped)
            if meta_match:
                key = meta_match.group(1).strip().lower()
                value = meta_match.group(2).strip()
                if key == "priority":
                    current_task.priority = value
                elif key == "owner":
                    current_task.owner = value
                elif key == "tags":
                    current_task.tags = [t.strip() for t in value.split(",")]
                elif key == "started":
                    current_task.started = value
                elif key == "blocked by":
                    current_task.blocked_by = value
                elif key == "depends on":
                    current_task.depends_on = value
                current_task.raw_lines.append(stripped)

    # Don't forget the last task
    if current_task:
        tasks.append(current_task)

    return tasks


# ---------------------------------------------------------------------------
# Task execution
# ---------------------------------------------------------------------------

def execute_task(task: Task, config: dict, dry_run: bool = False) -> dict:
    """
    Execute a task by spawning Claude Code via subprocess.

    Returns a dict with keys: success, output, duration, timestamp
    """
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    safe_name = re.sub(r"[^a-zA-Z0-9_-]", "_", task.name.lower())[:50]
    result_file = RESULTS_DIR / f"{timestamp}_{safe_name}.md"

    prompt = build_task_prompt(task, config)

    result = {
        "success": False,
        "output": "",
        "duration": 0.0,
        "timestamp": timestamp,
        "result_file": str(result_file),
        "task_name": task.name,
    }

    if dry_run:
        result["output"] = f"[DRY RUN] Would execute: {task.name}"
        result["success"] = True
        print(f"  [DRY RUN] Would execute: {task.name}")
        print(f"  Prompt: {prompt[:200]}...")
        return result

    print(f"  Executing: {task.name}")
    print(f"  Prompt: {prompt[:120]}...")

    start_time = time.time()
    try:
        proc = subprocess.run(
            ["claude", "--print", "-p", prompt],
            capture_output=True,
            text=True,
            timeout=300,  # 5-minute timeout per task
            cwd=str(SARTOR_DIR),
        )
        result["output"] = proc.stdout
        result["success"] = proc.returncode == 0
        if proc.stderr:
            result["output"] += f"\n\n--- STDERR ---\n{proc.stderr}"
    except subprocess.TimeoutExpired:
        result["output"] = "ERROR: Task timed out after 300 seconds"
        result["success"] = False
    except FileNotFoundError:
        result["output"] = "ERROR: 'claude' CLI not found. Is Claude Code installed and in PATH?"
        result["success"] = False
    except Exception as e:
        result["output"] = f"ERROR: {type(e).__name__}: {e}"
        result["success"] = False

    result["duration"] = time.time() - start_time

    # Write result to file
    write_result(result, task, result_file)

    # Append to daily log
    append_daily_log(result, task)

    return result


def build_task_prompt(task: Task, config: dict) -> str:
    """Build a prompt for Claude Code based on the task."""
    parts = [
        f"You are the Sartor task harness executing an autonomous task.",
        f"Task: {task.name}",
    ]
    if task.description:
        parts.append(f"Description: {task.description}")
    if task.tags:
        parts.append(f"Tags: {', '.join(task.tags)}")
    if task.priority:
        parts.append(f"Priority: {task.priority}")

    parts.append("")
    parts.append("Working directory: the Sartor project at ~/Sartor-claude-network/sartor/")
    parts.append("Memory files are in: memory/")
    parts.append("Please complete this task and provide a clear summary of what was done.")
    parts.append("If the task cannot be completed, explain what is blocking it.")

    return "\n".join(parts)


def write_result(result: dict, task: Task, result_file: Path):
    """Write task execution result to a markdown file."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    status = "SUCCESS" if result["success"] else "FAILED"
    content = f"""# Task Result: {task.name}

- **Status:** {status}
- **Timestamp:** {result['timestamp']}
- **Duration:** {result['duration']:.1f}s
- **Priority:** {task.priority}
- **Tags:** {', '.join(task.tags) if task.tags else 'none'}

## Task Description
{task.description or 'No description'}

## Output
```
{result['output'][:5000]}
```
"""
    try:
        with open(result_file, "w") as f:
            f.write(content)
        print(f"  Result written to: {result_file}")
    except Exception as e:
        print(f"  WARNING: Could not write result file: {e}")


def append_daily_log(result: dict, task: Task):
    """Append a summary line to today's daily log."""
    DAILY_DIR.mkdir(parents=True, exist_ok=True)

    today = datetime.now().strftime("%Y-%m-%d")
    daily_file = DAILY_DIR / f"{today}.md"

    status = "OK" if result["success"] else "FAIL"
    time_str = datetime.now().strftime("%H:%M")

    # Create file with header if it doesn't exist
    if not daily_file.exists():
        with open(daily_file, "w") as f:
            f.write(f"# Daily Log - {today}\n\n")

    line = f"- [{time_str}] Harness: **{task.name}** - {status} ({result['duration']:.1f}s)\n"

    try:
        with open(daily_file, "a") as f:
            f.write(line)
    except Exception as e:
        print(f"  WARNING: Could not append to daily log: {e}")


# ---------------------------------------------------------------------------
# Task status update in ACTIVE.md
# ---------------------------------------------------------------------------

def update_task_status(filepath: Path, task_name: str, mark_done: bool = True):
    """
    Update a task's checkbox in ACTIVE.md.

    Replaces - [ ] **Task name** with - [x] **Task name**
    """
    if not filepath.exists():
        return

    with open(filepath, "r") as f:
        content = f.read()

    escaped_name = re.escape(task_name)
    if mark_done:
        pattern = rf"(- )\[ \](\s+\*\*{escaped_name}\*\*)"
        replacement = r"\1[x]\2"
    else:
        pattern = rf"(- )\[x\](\s+\*\*{escaped_name}\*\*)"
        replacement = r"\1[ ]\2"

    new_content, count = re.subn(pattern, replacement, content)
    if count > 0:
        with open(filepath, "w") as f:
            f.write(new_content)
        print(f"  Updated ACTIVE.md: marked '{task_name}' as {'done' if mark_done else 'pending'}")
    else:
        print(f"  WARNING: Could not find task '{task_name}' in ACTIVE.md to update")


# ---------------------------------------------------------------------------
# BM25-like memory search (TF-IDF with built-in libraries only)
# ---------------------------------------------------------------------------

def tokenize(text: str) -> list[str]:
    """Simple whitespace + punctuation tokenizer, lowercased."""
    return re.findall(r"[a-z0-9]+", text.lower())


def compute_idf(documents: list[list[str]]) -> dict[str, float]:
    """Compute inverse document frequency for each term."""
    n = len(documents)
    if n == 0:
        return {}

    doc_freq: Counter = Counter()
    for doc in documents:
        unique_terms = set(doc)
        for term in unique_terms:
            doc_freq[term] += 1

    idf = {}
    for term, df in doc_freq.items():
        # Standard IDF with smoothing
        idf[term] = math.log((n - df + 0.5) / (df + 0.5) + 1.0)
    return idf


def bm25_score(query_tokens: list[str], doc_tokens: list[str],
               idf: dict[str, float], avg_dl: float,
               k1: float = 1.5, b: float = 0.75) -> float:
    """Compute BM25 score for a single document against a query."""
    dl = len(doc_tokens)
    if dl == 0 or avg_dl == 0:
        return 0.0

    tf_counter = Counter(doc_tokens)
    score = 0.0
    for qt in query_tokens:
        if qt not in idf:
            continue
        tf = tf_counter.get(qt, 0)
        numerator = tf * (k1 + 1)
        denominator = tf + k1 * (1 - b + b * (dl / avg_dl))
        score += idf[qt] * (numerator / denominator)
    return score


def search_memory(query: str, top_k: int = 5) -> list[tuple[str, float, str]]:
    """
    Search across all memory markdown files using BM25 scoring.

    Returns list of (filepath, score, snippet) tuples, sorted by score descending.
    """
    if not MEMORY_DIR.exists():
        print(f"WARNING: Memory directory not found at {MEMORY_DIR}")
        return []

    # Gather all markdown files from memory/
    md_files = list(MEMORY_DIR.rglob("*.md"))
    if not md_files:
        print("No memory files found.")
        return []

    # Read and tokenize all documents
    doc_data: list[tuple[Path, str, list[str]]] = []
    for fp in md_files:
        try:
            text = fp.read_text(encoding="utf-8", errors="replace")
            tokens = tokenize(text)
            doc_data.append((fp, text, tokens))
        except Exception:
            continue

    if not doc_data:
        return []

    # Build corpus for IDF
    all_token_lists = [tokens for _, _, tokens in doc_data]
    idf = compute_idf(all_token_lists)
    avg_dl = sum(len(t) for t in all_token_lists) / len(all_token_lists)

    # Score each document
    query_tokens = tokenize(query)
    scored: list[tuple[str, float, str]] = []
    for fp, text, tokens in doc_data:
        score = bm25_score(query_tokens, tokens, idf, avg_dl)
        if score > 0:
            # Extract a snippet around the first matching term
            snippet = extract_snippet(text, query_tokens)
            scored.append((str(fp), score, snippet))

    # Sort by score descending
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]


def extract_snippet(text: str, query_tokens: list[str], context_chars: int = 150) -> str:
    """Extract a short snippet around the first occurrence of any query term."""
    text_lower = text.lower()
    best_pos = len(text)
    for token in query_tokens:
        pos = text_lower.find(token)
        if pos != -1 and pos < best_pos:
            best_pos = pos

    if best_pos == len(text):
        # No match found, return beginning of text
        return text[:context_chars].replace("\n", " ").strip() + "..."

    start = max(0, best_pos - context_chars // 2)
    end = min(len(text), best_pos + context_chars // 2)
    snippet = text[start:end].replace("\n", " ").strip()
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."
    return snippet


# ---------------------------------------------------------------------------
# Display functions
# ---------------------------------------------------------------------------

PRIORITY_ORDER = {"High": 0, "Medium": 1, "Low": 2}


def show_status(tasks: list[Task], config: dict):
    """Display the current task queue with autonomy levels."""
    print("=" * 70)
    print("  SARTOR TASK HARNESS - STATUS")
    print("=" * 70)

    if not tasks:
        print("\n  No tasks found in ACTIVE.md\n")
        return

    # Group by section
    sections: dict[str, list[Task]] = {}
    for t in tasks:
        sec = t.section or "Uncategorized"
        sections.setdefault(sec, []).append(t)

    for section, section_tasks in sections.items():
        print(f"\n  ## {section}")
        print(f"  {'─' * 66}")

        # Sort by priority
        section_tasks.sort(key=lambda t: PRIORITY_ORDER.get(t.priority, 99))

        for t in section_tasks:
            checkbox = "[x]" if t.done else "[ ]"
            level = get_autonomy_level(config, t.tags)
            level_icon = {
                "autonomous": "AUTO",
                "ask_first": "ASK ",
                "never": "DENY",
                "unknown": " ?? ",
            }.get(level, "????")

            blocked = " [BLOCKED]" if t.is_blocked else ""
            print(f"  {checkbox} [{level_icon}] {t.name} (P:{t.priority}){blocked}")
            if t.description:
                print(f"        {t.description[:60]}")
            if t.tags:
                print(f"        Tags: {', '.join(t.tags)}")
            if t.blocked_by:
                print(f"        Blocked by: {t.blocked_by}")

    # Summary
    total = len(tasks)
    done = sum(1 for t in tasks if t.done)
    blocked = sum(1 for t in tasks if t.is_blocked and not t.done)
    actionable = total - done - blocked
    print(f"\n  Summary: {total} total, {done} done, {blocked} blocked, {actionable} actionable")
    print()


def show_check(tasks: list[Task], config: dict):
    """Dry run - show what would be executed."""
    print("=" * 70)
    print("  SARTOR TASK HARNESS - DRY RUN")
    print("=" * 70)

    executable = []
    skipped = []

    for t in tasks:
        if t.done:
            skipped.append((t, "already done"))
            continue
        if t.is_blocked:
            skipped.append((t, f"blocked by: {t.blocked_by or t.depends_on}"))
            continue

        level = get_autonomy_level(config, t.tags)
        if level == "autonomous":
            executable.append(t)
        elif level == "ask_first":
            skipped.append((t, "requires human approval (ask_first)"))
        elif level == "never":
            skipped.append((t, "forbidden by policy (never)"))
        else:
            skipped.append((t, "no matching autonomy tags"))

    if executable:
        print(f"\n  WOULD EXECUTE ({len(executable)} tasks):")
        for t in executable:
            print(f"    -> {t.name} [P:{t.priority}] Tags: {', '.join(t.tags)}")
    else:
        print("\n  No tasks eligible for autonomous execution.")

    if skipped:
        print(f"\n  SKIPPED ({len(skipped)} tasks):")
        for t, reason in skipped:
            print(f"    -- {t.name}: {reason}")

    print()


# ---------------------------------------------------------------------------
# Main run loop
# ---------------------------------------------------------------------------

def run_tasks(tasks: list[Task], config: dict, specific_task: Optional[str] = None):
    """Execute eligible autonomous tasks."""
    print("=" * 70)
    print("  SARTOR TASK HARNESS - RUNNING")
    print("=" * 70)

    max_concurrent = config["harness"].get("max_concurrent_tasks", 3)
    tasks_file = SARTOR_DIR / "tasks" / "ACTIVE.md"

    executable = []
    for t in tasks:
        if t.done or t.is_blocked:
            continue

        # If a specific task was requested, only run that one
        if specific_task and t.name.lower() != specific_task.lower():
            continue

        level = get_autonomy_level(config, t.tags)
        if level == "autonomous":
            executable.append(t)
        elif specific_task:
            # User specifically asked for this task
            if level == "ask_first":
                print(f"\n  Task '{t.name}' requires human approval (ask_first).")
                print(f"  Tags: {', '.join(t.tags)}")
                confirm = input("  Execute anyway? [y/N]: ").strip().lower()
                if confirm == "y":
                    executable.append(t)
                else:
                    print("  Skipped.")
            elif level == "never":
                print(f"\n  Task '{t.name}' is FORBIDDEN by policy (never). Cannot execute.")
            else:
                print(f"\n  Task '{t.name}' has no matching autonomy tags.")
                print(f"  Tags: {', '.join(t.tags)}")

    if not executable:
        print("\n  No tasks eligible for execution.")
        return

    # Sort by priority
    executable.sort(key=lambda t: PRIORITY_ORDER.get(t.priority, 99))

    # Limit to max_concurrent
    batch = executable[:max_concurrent]
    print(f"\n  Executing {len(batch)} of {len(executable)} eligible tasks (max: {max_concurrent})\n")

    results = []
    for t in batch:
        print(f"\n{'─' * 60}")
        result = execute_task(t, config)
        results.append(result)

        # Update ACTIVE.md if task succeeded
        if result["success"]:
            update_task_status(tasks_file, t.name, mark_done=True)

    # Summary
    print(f"\n{'=' * 60}")
    print(f"  Execution complete:")
    succeeded = sum(1 for r in results if r["success"])
    failed = len(results) - succeeded
    print(f"  {succeeded} succeeded, {failed} failed")
    for r in results:
        status = "OK" if r["success"] else "FAIL"
        print(f"    [{status}] {r['task_name']} ({r['duration']:.1f}s)")
    print()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Sartor Task Harness Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python runner.py --status                 Show task queue
  python runner.py --check                  Dry run
  python runner.py --run                    Execute autonomous tasks
  python runner.py --run --task "Task name" Execute specific task
  python runner.py --search "gpu setup"     Search memory files
        """,
    )
    parser.add_argument("--status", action="store_true",
                        help="Show current task queue")
    parser.add_argument("--check", action="store_true",
                        help="Dry run - show what would be done")
    parser.add_argument("--run", action="store_true",
                        help="Execute pending autonomous tasks")
    parser.add_argument("--task", type=str, default=None,
                        help="Name of specific task to run (with --run)")
    parser.add_argument("--search", type=str, default=None,
                        help="Search memory files with BM25")

    args = parser.parse_args()

    # Must specify at least one action
    if not any([args.status, args.check, args.run, args.search]):
        parser.print_help()
        sys.exit(1)

    # Handle memory search (doesn't need task parsing)
    if args.search:
        print(f"\n  Searching memory for: {args.search!r}\n")
        results = search_memory(args.search)
        if results:
            for filepath, score, snippet in results:
                rel = os.path.relpath(filepath, SARTOR_DIR)
                print(f"  [{score:.2f}] {rel}")
                print(f"         {snippet}")
                print()
        else:
            print("  No results found.\n")
        if not any([args.status, args.check, args.run]):
            return

    # Load config and parse tasks
    config = load_config()
    tasks_file = Path(config["harness"]["tasks_file"])
    if not tasks_file.is_absolute():
        tasks_file = HARNESS_DIR / tasks_file

    tasks = parse_active_md(tasks_file)

    if args.status:
        show_status(tasks, config)
    if args.check:
        show_check(tasks, config)
    if args.run:
        run_tasks(tasks, config, specific_task=args.task)


if __name__ == "__main__":
    main()
