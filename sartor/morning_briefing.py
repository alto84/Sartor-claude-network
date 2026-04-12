"""Morning briefing generator for the Sartor Home Agent system.

Produces a unified daily briefing with these sections:
  1. Date + weather summary (placeholder)
  2. Overnight curator summary
  3. Gmail highlights (from 06:00 gmail scan)
  4. Partially completed to-dos (the key feature -- resurfaces lost tasks)
  5. Calendar today (requires MCP at runtime)
  6. System health
  7. Memory system health
  8. Improvement proposals

Output: writes to sartor/memory/inbox/rocinante/morning-briefing/YYYY-MM-DD.md
with curator-compatible frontmatter. Also prints to stdout.

Run as:
    python -m sartor.morning_briefing [--dry-run] [-v]

Exit codes:
    0  success
    1  fatal error
"""

from __future__ import annotations

import argparse
import glob as glob_mod
import hashlib
import json
import re
import sys
import time
import traceback
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
MEMORY_ROOT = REPO_ROOT / "sartor" / "memory"
INBOX_ROOT = MEMORY_ROOT / "inbox"
META_DIR = MEMORY_ROOT / ".meta"

CURATOR_LOG = META_DIR / "curator-log.jsonl"
EXTRACTOR_LOG = META_DIR / "extractor-log.jsonl"
SURFACED_TODOS_PATH = META_DIR / "briefing-surfaced-todos.json"

GMAIL_INBOX_DIR = INBOX_ROOT / "rocinante" / "gmail"
PROPOSED_ROOT = INBOX_ROOT / "rocinante" / "proposed-memories"
BRIEFING_DIR = INBOX_ROOT / "rocinante" / "morning-briefing"

TASKS_ACTIVE = REPO_ROOT / "tasks" / "ACTIVE.md"
TASKS_COMPLETED = REPO_ROOT / "tasks" / "COMPLETED.md"
FAMILY_TODOS = MEMORY_ROOT / "family" / "active-todos.md"
IMPROVEMENT_QUEUE = REPO_ROOT / "data" / "IMPROVEMENT-QUEUE.md"

SESSION_ROOTS = [
    Path("C:/Users/alto8/.claude/projects/C--Users-alto8"),
    Path("C:/Users/alto8/.claude/projects/C--Users-alto8-Sartor-claude-network"),
]

BRIEFING_VERSION = "0.1"
BRIEFING_NAME = "rocinante-morning-briefing"

# Patterns for detecting task-shaped utterances in conversation
TASK_PATTERNS = [
    re.compile(r"(?:^|\b)(?:TODO|FIXME|HACK)\b[:\s]+(.+)", re.I),
    re.compile(r"\bneed\s+to\s+(.+?)(?:\.|$)", re.I),
    re.compile(r"\bshould\s+(.+?)(?:\.|$)", re.I),
    re.compile(r"\bremind\s+me\s+(?:to\s+)?(.+?)(?:\.|$)", re.I),
    re.compile(r"\bdon'?t\s+forget\s+(?:to\s+)?(.+?)(?:\.|$)", re.I),
    re.compile(r"\bhave\s+to\s+(.+?)(?:\.|$)", re.I),
    re.compile(r"\bmust\s+(.+?)(?:\.|$)", re.I),
    re.compile(r"\bmake\s+sure\s+(?:to\s+)?(.+?)(?:\.|$)", re.I),
]

# Patterns for detecting completion signals
COMPLETION_PATTERNS = [
    re.compile(r"\b(?:done|finished|completed|paid|sent|filed|resolved|fixed|submitted|merged)\b", re.I),
    re.compile(r"\bmarked?\s+(?:as\s+)?(?:done|complete|finished)\b", re.I),
    re.compile(r"\bthat'?s\s+(?:done|taken\s+care\s+of)\b", re.I),
]

# Min file size for session scanning (same as conversation_extract.py)
MIN_FILE_SIZE = 10 * 1024


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class TodoItem:
    """A detected or known todo item."""
    text: str
    source: str  # "conversation", "tasks/ACTIVE.md", "family-todos", etc.
    source_detail: str = ""  # e.g., session filename, line number
    first_seen: str = ""  # ISO date
    deadline: str | None = None
    completed: bool = False
    stale: bool = False  # >7 days with no activity
    fingerprint: str = ""

    def compute_fingerprint(self) -> str:
        """Compute a short hash for dedup."""
        normalized = re.sub(r"\s+", " ", self.text.lower().strip())
        self.fingerprint = hashlib.sha1(normalized.encode()).hexdigest()[:12]
        return self.fingerprint


@dataclass
class BriefingResult:
    """Result of morning briefing generation."""
    date: str = ""
    sections: dict[str, str] = field(default_factory=dict)
    full_text: str = ""
    output_path: Path | None = None
    runtime_ms: int = 0


# ---------------------------------------------------------------------------
# Section 2: Curator summary
# ---------------------------------------------------------------------------


def get_curator_summary(log_path: Path = CURATOR_LOG, n: int = 2) -> str:
    """Read the last N curator log entries and produce a summary."""
    if not log_path.exists():
        return "No curator log found. Curator has not run yet."

    entries = []
    try:
        text = log_path.read_text(encoding="utf-8").strip()
        for line in text.splitlines():
            if line.strip():
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except OSError:
        return "Could not read curator log."

    if not entries:
        return "Curator log is empty."

    recent = entries[-n:]
    lines = []
    total_drained = 0
    total_conflicts = 0
    total_errors = 0

    for entry in recent:
        ts = entry.get("timestamp", "unknown")
        drained = entry.get("num_drained", 0)
        conflicts = entry.get("num_conflicts", 0)
        errors = entry.get("num_errors", 0)
        flagged = entry.get("num_flagged", 0)
        runtime = entry.get("runtime_ms", 0)
        dry = entry.get("dry_run", False)

        total_drained += drained
        total_conflicts += conflicts
        total_errors += errors

        mode = " (dry-run)" if dry else ""
        lines.append(
            f"- {ts}{mode}: {drained} drained, {conflicts} conflicts, "
            f"{errors} errors, {flagged} flagged ({runtime}ms)"
        )

    summary_line = f"**Totals (last {len(recent)} runs):** {total_drained} entries drained, {total_conflicts} conflicts, {total_errors} errors"
    if total_errors > 0:
        summary_line += " **[ERRORS DETECTED]**"
    if total_conflicts > 0:
        summary_line += " **[CONFLICTS NEED REVIEW]**"

    return summary_line + "\n" + "\n".join(lines)


# ---------------------------------------------------------------------------
# Section 3: Gmail highlights
# ---------------------------------------------------------------------------


def get_gmail_highlights(gmail_dir: Path = GMAIL_INBOX_DIR, max_items: int = 5) -> str:
    """Read actionable emails from the gmail inbox directory."""
    if not gmail_dir.exists():
        return "No gmail scan results available. Gmail scanner may not have run yet."

    today = datetime.now(timezone.utc).date().isoformat()
    entries = []

    for md_file in sorted(gmail_dir.glob("*.md"), reverse=True):
        if len(entries) >= max_items:
            break
        try:
            text = md_file.read_text(encoding="utf-8")
            if not text.startswith("---"):
                continue
            parts = text.split("---", 2)
            if len(parts) < 3:
                continue
            fm = yaml.safe_load(parts[1])
            if not isinstance(fm, dict):
                continue
            body = parts[2].strip()
            entries.append({"frontmatter": fm, "body": body, "path": md_file})
        except Exception:
            continue

    if not entries:
        return "No actionable emails found in latest scan."

    lines = []
    for i, e in enumerate(entries[:max_items], 1):
        fm = e["frontmatter"]
        sender = fm.get("source_email", "unknown")
        deadline = fm.get("deadline", "")
        # Extract subject from body (first ## line)
        subject_match = re.search(r"^##\s+(.+)", e["body"], re.M)
        subject = subject_match.group(1) if subject_match else "Unknown subject"
        deadline_str = f" | Deadline: {deadline}" if deadline else ""
        lines.append(f"{i}. **{subject}** from {sender}{deadline_str}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Section 4: Todo resurfacing
# ---------------------------------------------------------------------------


def _extract_todos_from_markdown(path: Path, source_name: str) -> list[TodoItem]:
    """Extract checkbox items from a markdown file."""
    if not path.exists():
        return []
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return []

    items = []
    for line in text.splitlines():
        # Match unchecked checkboxes: - [ ] text
        m = re.match(r"^\s*-\s*\[\s*\]\s+(.+)", line)
        if m:
            todo = TodoItem(text=m.group(1).strip(), source=source_name, source_detail=str(path))
            todo.compute_fingerprint()
            items.append(todo)
    return items


def _extract_todos_from_conversations(
    since_days: int = 3,
    session_roots: list[Path] | None = None,
) -> list[TodoItem]:
    """Scan recent session JSONLs for task-shaped utterances."""
    roots = session_roots or SESSION_ROOTS
    cutoff = datetime.now(timezone.utc) - timedelta(days=since_days)
    cutoff_ts = cutoff.timestamp()

    items: list[TodoItem] = []
    seen_fingerprints: set[str] = set()

    for root in roots:
        if not root.exists():
            continue
        for jsonl_path in sorted(root.glob("*.jsonl")):
            try:
                st = jsonl_path.stat()
            except OSError:
                continue
            if st.st_size < MIN_FILE_SIZE:
                continue
            if st.st_mtime < cutoff_ts:
                continue

            _scan_session_for_todos(jsonl_path, items, seen_fingerprints)

    return items


def _scan_session_for_todos(
    path: Path,
    items: list[TodoItem],
    seen_fps: set[str],
) -> None:
    """Scan a single session file for todo patterns in user turns."""
    try:
        f = path.open("r", encoding="utf-8", errors="replace")
    except OSError:
        return

    session_texts: list[tuple[str, str]] = []  # (role, text) pairs

    with f:
        for line in f:
            try:
                j = json.loads(line)
            except Exception:
                continue
            role = j.get("type", "")
            msg = j.get("message") or {}
            if not isinstance(msg, dict):
                continue
            content = msg.get("content")
            if isinstance(content, list):
                text = " ".join(
                    c.get("text", "") for c in content
                    if isinstance(c, dict) and c.get("type") == "text"
                )
            elif isinstance(content, str):
                text = content
            else:
                continue

            if not text or len(text) < 10:
                continue

            session_texts.append((role, text))

    # Now scan user turns for task patterns
    all_texts = " ".join(t for _, t in session_texts)
    completion_found = set()
    for _, text in session_texts:
        for pat in COMPLETION_PATTERNS:
            for m in pat.finditer(text):
                # Record nearby context as completion signal
                start = max(0, m.start() - 100)
                completion_found.add(text[start:m.end()].lower())

    for role, text in session_texts:
        if role != "user":
            continue
        for pat in TASK_PATTERNS:
            for match in pat.finditer(text):
                task_text = match.group(1).strip()
                if len(task_text) < 10 or len(task_text) > 300:
                    continue

                todo = TodoItem(
                    text=task_text,
                    source="conversation",
                    source_detail=path.name,
                )
                todo.compute_fingerprint()

                if todo.fingerprint in seen_fps:
                    continue
                seen_fps.add(todo.fingerprint)

                # Check if completed
                task_lower = task_text.lower()
                if any(task_lower[:20] in c for c in completion_found):
                    todo.completed = True

                items.append(todo)


def _check_completed(todos: list[TodoItem], completed_path: Path = TASKS_COMPLETED) -> list[TodoItem]:
    """Mark todos as completed if they appear in COMPLETED.md."""
    completed_text = ""
    if completed_path.exists():
        try:
            completed_text = completed_path.read_text(encoding="utf-8").lower()
        except OSError:
            pass

    for todo in todos:
        if todo.completed:
            continue
        # Check if a significant portion of the todo text appears in completed
        words = todo.text.lower().split()
        if len(words) >= 3:
            # Match if 60%+ of significant words appear in completed text
            significant = [w for w in words if len(w) > 3]
            if significant:
                matched = sum(1 for w in significant if w in completed_text)
                if matched / len(significant) >= 0.6:
                    todo.completed = True

    return todos


def _check_staleness(todos: list[TodoItem], stale_days: int = 7) -> list[TodoItem]:
    """Mark todos as stale if first_seen > stale_days ago with no activity."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=stale_days)).isoformat()
    for todo in todos:
        if todo.first_seen and todo.first_seen < cutoff:
            todo.stale = True
    return todos


def load_surfaced_todos(path: Path = SURFACED_TODOS_PATH) -> dict[str, str]:
    """Load the record of previously surfaced todos. Returns {fingerprint: last_surfaced_iso}."""
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def save_surfaced_todos(data: dict[str, str], path: Path = SURFACED_TODOS_PATH) -> None:
    """Save the surfaced-todos tracking file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _should_resurface(todo: TodoItem, surfaced: dict[str, str], min_days: int = 3) -> bool:
    """Determine if a todo should be resurfaced in today's briefing.

    Rules:
    - Never surfaced before: yes
    - Surfaced < min_days ago: no (unless new activity detected)
    - Surfaced >= min_days ago: yes
    """
    fp = todo.fingerprint
    if fp not in surfaced:
        return True
    last_surfaced = surfaced[fp]
    try:
        last_dt = datetime.fromisoformat(last_surfaced)
        days_since = (datetime.now(timezone.utc) - last_dt).days
        return days_since >= min_days
    except (ValueError, TypeError):
        return True


def get_todo_section(
    session_roots: list[Path] | None = None,
    surfaced_path: Path = SURFACED_TODOS_PATH,
) -> tuple[str, dict[str, str]]:
    """Build the todo resurfacing section. Returns (section_text, updated_surfaced_dict)."""
    all_todos: list[TodoItem] = []

    # Source 1: tasks/ACTIVE.md
    all_todos.extend(_extract_todos_from_markdown(TASKS_ACTIVE, "tasks/ACTIVE.md"))

    # Source 2: family active todos
    all_todos.extend(_extract_todos_from_markdown(FAMILY_TODOS, "family/active-todos.md"))

    # Source 3: IMPROVEMENT-QUEUE.md (extract proposals as todos)
    if IMPROVEMENT_QUEUE.exists():
        try:
            iq_text = IMPROVEMENT_QUEUE.read_text(encoding="utf-8")
            for m in re.finditer(r"^## \[(\w+)\]\s+(\S+)\s+\((.+?)\)", iq_text, re.M):
                severity, signal, date_str = m.groups()
                todo = TodoItem(
                    text=f"[{severity}] {signal} ({date_str})",
                    source="IMPROVEMENT-QUEUE",
                    source_detail=str(IMPROVEMENT_QUEUE),
                    first_seen=date_str,
                )
                todo.compute_fingerprint()
                all_todos.append(todo)
        except OSError:
            pass

    # Source 4: Conversation mining (last 3 days)
    conv_todos = _extract_todos_from_conversations(since_days=3, session_roots=session_roots)
    all_todos.extend(conv_todos)

    # Source 5: Undrained inbox entries with type=event or priority=p0|p1
    for machine_dir in INBOX_ROOT.iterdir() if INBOX_ROOT.exists() else []:
        if not machine_dir.is_dir() or machine_dir.name.startswith("."):
            continue
        for md_file in machine_dir.rglob("*.md"):
            rel_parts = md_file.relative_to(machine_dir).parts
            if any(p.startswith(".") or p.startswith("_") for p in rel_parts[:-1]):
                continue
            try:
                text = md_file.read_text(encoding="utf-8")
                if not text.startswith("---"):
                    continue
                parts = text.split("---", 2)
                if len(parts) < 3:
                    continue
                fm = yaml.safe_load(parts[1])
                if not isinstance(fm, dict):
                    continue
                entry_type = str(fm.get("type", "")).lower()
                priority = str(fm.get("priority", "")).lower()
                if entry_type == "event" or priority in ("p0", "p1"):
                    todo = TodoItem(
                        text=f"Inbox: {fm.get('id', md_file.stem)} ({priority})",
                        source="inbox",
                        source_detail=str(md_file),
                        first_seen=str(fm.get("created", "")),
                    )
                    todo.compute_fingerprint()
                    all_todos.append(todo)
            except Exception:
                continue

    # Filter: mark completed, check staleness
    all_todos = _check_completed(all_todos)
    all_todos = _check_staleness(all_todos)

    # Filter out completed items
    open_todos = [t for t in all_todos if not t.completed]

    # Dedup: check surfaced history
    surfaced = load_surfaced_todos(surfaced_path)
    to_show = [t for t in open_todos if _should_resurface(t, surfaced)]

    # Group by: overdue, today, this week, no deadline, stale
    overdue = []
    stale_items = []
    regular = []

    for t in to_show:
        if t.stale:
            stale_items.append(t)
        else:
            regular.append(t)

    # Update surfaced tracking
    now_iso = datetime.now(timezone.utc).isoformat()
    updated_surfaced = dict(surfaced)
    for t in to_show:
        updated_surfaced[t.fingerprint] = now_iso

    # Build output
    lines = []
    if not to_show:
        lines.append("No outstanding todos to resurface today.")
    else:
        if regular:
            lines.append(f"### Open Items ({len(regular)})")
            lines.append("")
            for t in regular[:15]:
                source_tag = f"[{t.source}]"
                lines.append(f"- {source_tag} {t.text}")

        if stale_items:
            lines.append("")
            lines.append(f"### Stale Todos ({len(stale_items)}) -- still relevant?")
            lines.append("")
            for t in stale_items[:5]:
                source_tag = f"[{t.source}]"
                lines.append(f"- {source_tag} {t.text}")

        total_hidden = len(open_todos) - len(to_show)
        if total_hidden > 0:
            lines.append("")
            lines.append(f"_({total_hidden} items suppressed -- resurfaced within last 3 days)_")

    return "\n".join(lines), updated_surfaced


# ---------------------------------------------------------------------------
# Section 6: System health
# ---------------------------------------------------------------------------


def get_system_health() -> str:
    """Check system health indicators."""
    lines = []

    # gpuserver1 heartbeat -- check if SSH is responsive
    lines.append("- **gpuserver1:** SSH check requires runtime (not available in batch mode)")

    # MERIDIAN dashboard
    lines.append("- **MERIDIAN:** Check localhost:5055 at runtime")

    # Cron health: check for recent heartbeat log entries
    heartbeat_log = REPO_ROOT / "data" / "heartbeat-log.csv"
    if heartbeat_log.exists():
        try:
            text = heartbeat_log.read_text(encoding="utf-8")
            log_lines = text.strip().splitlines()
            if len(log_lines) > 1:
                last_line = log_lines[-1]
                lines.append(f"- **Heartbeat log:** {len(log_lines) - 1} entries, last: {last_line[:80]}...")
            else:
                lines.append("- **Heartbeat log:** Empty (header only)")
        except OSError:
            lines.append("- **Heartbeat log:** Could not read")
    else:
        lines.append("- **Heartbeat log:** Not found")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Section 7: Memory system health
# ---------------------------------------------------------------------------


def get_memory_health() -> str:
    """Check memory system health using staleness scoring."""
    lines = []

    # Try to import and run staleness tier counts
    try:
        from sartor.staleness import score_file, MEMORY_ROOT as SMEM, classify_tier
        tier_counts: dict[str, int] = defaultdict(int)
        for md in SMEM.rglob("*.md"):
            rel_parts = md.relative_to(SMEM).parts
            if any(p.startswith(".") or p == "inbox" for p in rel_parts):
                continue
            result = score_file(md)
            tier_counts[result.tier] += 1
        lines.append(f"- **Staleness tiers:** {dict(tier_counts)}")
    except Exception as exc:
        lines.append(f"- **Staleness:** Could not compute ({exc})")

    # Extractor stats from last run
    if EXTRACTOR_LOG.exists():
        try:
            last_line = None
            for line in EXTRACTOR_LOG.read_text(encoding="utf-8").strip().splitlines():
                if line.strip():
                    try:
                        last_line = json.loads(line)
                    except json.JSONDecodeError:
                        pass
            if last_line:
                proposals = last_line.get("proposals_written", 0)
                turns = last_line.get("turns_scanned", 0)
                miss = last_line.get("dedup_already_landed", 0)
                lines.append(
                    f"- **Last extraction:** {proposals} proposals from {turns} turns, "
                    f"{miss} dedup-landed"
                )
        except OSError:
            pass
    else:
        lines.append("- **Extractor log:** Not found")

    # Receipt timeout count (check for pending receipts)
    receipts_dir = INBOX_ROOT / "rocinante" / ".receipts"
    if receipts_dir.exists():
        receipt_count = sum(1 for _ in receipts_dir.rglob("*.yml"))
        lines.append(f"- **Receipts written:** {receipt_count} total")

    return "\n".join(lines) if lines else "Memory health check unavailable."


# ---------------------------------------------------------------------------
# Section 8: Improvement proposals
# ---------------------------------------------------------------------------


def get_improvement_proposals(path: Path = IMPROVEMENT_QUEUE, max_items: int = 3) -> str:
    """Extract top improvement proposals from IMPROVEMENT-QUEUE.md."""
    if not path.exists():
        return "No improvement queue found."

    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return "Could not read improvement queue."

    proposals = []
    for m in re.finditer(
        r"^## \[(\w+)\]\s+(\S+)\s+\((.+?)\)\s*\n\n(.*?)(?=^## |\Z)",
        text,
        re.M | re.S,
    ):
        severity, signal, date_str, body = m.groups()
        detail_m = re.search(r"\*\*Detail:\*\*\s*(.+?)(?:\n\*\*|\Z)", body, re.S)
        detail = detail_m.group(1).strip() if detail_m else ""
        proposals.append({
            "severity": severity,
            "signal": signal,
            "date": date_str,
            "detail": detail[:200],
        })

    if not proposals:
        return "No proposals in queue."

    lines = []
    for p in proposals[:max_items]:
        lines.append(f"- **[{p['severity']}] {p['signal']}** ({p['date']}): {p['detail']}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Full briefing assembly
# ---------------------------------------------------------------------------


def generate_briefing(
    dry_run: bool = False,
    verbose: bool = False,
    session_roots: list[Path] | None = None,
) -> BriefingResult:
    """Generate the full morning briefing."""
    t0 = time.monotonic()
    today = datetime.now(timezone.utc).date().isoformat()
    result = BriefingResult(date=today)

    # Section 1: Date + Weather
    result.sections["date_weather"] = (
        f"**Date:** {today} ({datetime.now().strftime('%A')})\n"
        f"**Weather:** Weather lookup not implemented. Check weather.gov for Montclair, NJ."
    )

    # Section 2: Curator summary
    result.sections["curator"] = get_curator_summary()

    # Section 3: Gmail highlights
    result.sections["gmail"] = get_gmail_highlights()

    # Section 4: Todo resurfacing
    todo_text, updated_surfaced = get_todo_section(session_roots=session_roots)
    result.sections["todos"] = todo_text
    if not dry_run:
        save_surfaced_todos(updated_surfaced)

    # Section 5: Calendar (requires MCP)
    result.sections["calendar"] = (
        "Calendar check requires MCP runtime (Google Calendar tools). "
        "Run `/morning` inside Claude Code for live calendar data."
    )

    # Section 6: System health
    result.sections["system_health"] = get_system_health()

    # Section 7: Memory system health
    result.sections["memory_health"] = get_memory_health()

    # Section 8: Improvement proposals
    result.sections["improvements"] = get_improvement_proposals()

    # Assemble full text
    fm = {
        "id": f"morning-briefing-{today}",
        "origin": "rocinante",
        "author": BRIEFING_NAME,
        "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "target": "inbox-only",
        "operation": "report",
        "type": "routine",
        "priority": "p2",
        "category": "briefing",
    }
    fm_yaml = yaml.safe_dump(fm, sort_keys=False, default_flow_style=False)

    body = f"""# Morning Briefing -- {today}

## Date and Weather

{result.sections["date_weather"]}

## Overnight Curator Summary

{result.sections["curator"]}

## Gmail Highlights

{result.sections["gmail"]}

## Partially Completed To-Dos

{result.sections["todos"]}

## Calendar Today

{result.sections["calendar"]}

## System Health

{result.sections["system_health"]}

## Memory System Health

{result.sections["memory_health"]}

## Improvement Proposals

{result.sections["improvements"]}

---
_Generated by {BRIEFING_NAME} v{BRIEFING_VERSION} at {datetime.now(timezone.utc).isoformat(timespec="seconds")}_
"""

    result.full_text = f"---\n{fm_yaml}---\n\n{body}"

    # Write output
    if not dry_run:
        BRIEFING_DIR.mkdir(parents=True, exist_ok=True)
        out_path = BRIEFING_DIR / f"{today}.md"
        out_path.write_text(result.full_text, encoding="utf-8")
        result.output_path = out_path

    result.runtime_ms = int((time.monotonic() - t0) * 1000)
    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="morning_briefing",
        description="Generate the Sartor daily morning briefing.",
    )
    p.add_argument("--dry-run", action="store_true", help="Print briefing without writing files.")
    p.add_argument("-v", "--verbose", action="store_true")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    try:
        result = generate_briefing(
            dry_run=args.dry_run,
            verbose=args.verbose,
        )
    except Exception as exc:
        print(f"morning_briefing: fatal error: {exc}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return 1

    # Print to stdout for the scheduled executor to capture
    print(result.full_text)

    if result.output_path:
        print(f"\n[Written to {result.output_path}]", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
