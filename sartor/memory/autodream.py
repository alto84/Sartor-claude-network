#!/usr/bin/env python3
"""
autoDream — Memory Consolidation Engine

Inspired by Claude Code's KAIROS autoDream service. Runs as a nightly
scheduled task to consolidate daily activity into core memory files,
prune stale entries, and maintain the INDEX.md navigation.

Gate Sequence (cheapest checks first):
  1. Time gate: 24h since last consolidation
  2. Session gate: 3+ daily log entries since last run
  3. Lock gate: No concurrent consolidation

Four Phases:
  1. Orient: Read INDEX.md, list all topic files, check sizes
  2. Gather: Scan daily logs since last consolidation, extract key facts
  3. Consolidate: Update topic files, convert relative dates, merge duplicates
  4. Prune: Keep INDEX.md under 200 lines, archive logs > 90 days

Usage:
    python autodream.py              # Run consolidation (respects gates)
    python autodream.py --force      # Skip gate checks
    python autodream.py --dry-run    # Show what would change
    python autodream.py --status     # Show last consolidation info
"""

import json
import os
import re
import shutil
from datetime import datetime, timedelta
from pathlib import Path

MEMORY_DIR = Path(__file__).parent
META_DIR = MEMORY_DIR / ".meta"
DAILY_DIR = MEMORY_DIR / "daily"
INDEX_FILE = MEMORY_DIR / "INDEX.md"
CONSOLIDATION_LOG = META_DIR / "consolidation-log.md"
LOCK_FILE = META_DIR / ".autodream.lock"
MAX_INDEX_LINES = 200
ARCHIVE_AGE_DAYS = 90
MIN_DAILY_LOGS = 3
MIN_HOURS_BETWEEN_RUNS = 24

# Topic file keyword routing — maps keywords to canonical memory files
TOPIC_ROUTING = {
    "ALTON.md": [
        "alton", "emmett", "neurologist", "neurology", "columbia", "nyu",
        "health", "exercise", "fitness", "personal", "user profile",
    ],
    "FAMILY.md": [
        "family", "wife", "spouse", "children", "child", "kids", "cat",
        "montclair", "house", "home", "household", "school",
    ],
    "BUSINESS.md": [
        "solar inference", "solarinference", "sante total", "nonprofit",
        "business", "company", "llc", "revenue", "client", "contract",
        "invoice", "consulting",
    ],
    "ASTRAZENECA.md": [
        "astrazeneca", "az", "ai safety", "pharmacovigilance", "pv",
        "drug safety", "signal detection", "milton", "jarvis", "fda",
        "regulatory", "clinical", "adverse event",
    ],
    "MACHINES.md": [
        "rocinante", "gpuserver1", "rtx", "gpu", "server", "machine",
        "computer", "hardware", "ssh", "ip", "192.168", "vast.ai",
        "vastai", "docker", "ubuntu", "windows",
    ],
    "PROJECTS.md": [
        "project", "sartor", "safety-research", "dashboard", "kairos",
        "meridian", "autodream", "autoDream", "feature", "build", "implement",
        "deploy", "release",
    ],
    "PROCEDURES.md": [
        "procedure", "how to", "workflow", "process", "step", "checklist",
        "git", "push", "pull", "sync", "backup", "cron", "schedule",
    ],
    "LEARNINGS.md": [
        "learned", "lesson", "mistake", "issue", "fixed", "root cause",
        "bug", "gotcha", "warning", "important", "key insight",
    ],
    "TAXES.md": [
        "tax", "taxes", "irs", "deduction", "income", "filing",
        "turbotax", "w2", "1099", "schedule c",
    ],
    "SELF.md": [
        "sartor", "system", "identity", "mission", "purpose", "architecture",
        "memory system", "agent", "claude",
    ],
}

# Sections in daily logs to extract facts from
DAILY_SECTIONS = [
    "completed", "decisions made", "decisions", "insights", "lessons",
    "what was built", "key facts", "issues", "problems", "next steps",
    "what's next",
    # Sartor daily log format
    "critical alerts", "alert escalations", "outstanding alerts",
    "financial items", "time-sensitive financial items", "nonprofit",
    "family", "calendar notes", "monitoring items", "upcoming deadlines",
    "active alerts",
]


def _ensure_meta_dir():
    """Create .meta directory if it doesn't exist."""
    META_DIR.mkdir(exist_ok=True)


def _read_last_consolidation():
    """Read the last consolidation timestamp from log. Returns datetime or None."""
    if not CONSOLIDATION_LOG.exists():
        return None
    content = CONSOLIDATION_LOG.read_text(encoding="utf-8")
    # Look for lines like "## Run: 2026-03-31 02:00:00"
    matches = re.findall(r"## Run: (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})", content)
    if not matches:
        return None
    try:
        return datetime.strptime(matches[-1], "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None


def _get_daily_files_since(since_dt):
    """Return list of daily log Paths modified after since_dt (or all if None)."""
    if not DAILY_DIR.exists():
        return []
    files = []
    for f in sorted(DAILY_DIR.glob("*.md")):
        if f.name.startswith("archive") or f.parent.name == "archive":
            continue
        if since_dt is None:
            files.append(f)
        else:
            mtime = datetime.fromtimestamp(f.stat().st_mtime)
            if mtime > since_dt:
                files.append(f)
    return files


def check_gates(force=False):
    """Run gate sequence. Returns (can_proceed: bool, reason: str)."""
    if force:
        return True, "forced"

    # Gate 3 first (cheapest I/O): Lock file
    if LOCK_FILE.exists():
        try:
            age = datetime.now() - datetime.fromtimestamp(LOCK_FILE.stat().st_mtime)
            if age < timedelta(hours=2):
                return False, f"lock file exists (age: {age}), another consolidation may be running"
            else:
                print(f"  Stale lock file found (age: {age}), removing.")
                LOCK_FILE.unlink()
        except OSError:
            return False, "lock file exists"

    # Gate 1: Time since last consolidation
    last_run = _read_last_consolidation()
    if last_run is not None:
        hours_since = (datetime.now() - last_run).total_seconds() / 3600
        if hours_since < MIN_HOURS_BETWEEN_RUNS:
            return False, (
                f"last run was {hours_since:.1f}h ago "
                f"(minimum {MIN_HOURS_BETWEEN_RUNS}h)"
            )

    # Gate 2: Enough new daily log activity
    new_files = _get_daily_files_since(last_run)
    if len(new_files) < MIN_DAILY_LOGS:
        return False, (
            f"only {len(new_files)} new daily log(s) since last run "
            f"(minimum {MIN_DAILY_LOGS})"
        )

    return True, "all gates passed"


def phase_orient():
    """Phase 1: Survey the memory landscape.

    Returns dict with:
    - topic_files: list of {path, name, size_lines, last_modified}
    - daily_files: list of daily logs since last consolidation
    - index_exists: bool
    - index_lines: int
    """
    print("[Phase 1] Orient — surveying memory landscape...")

    last_run = _read_last_consolidation()

    topic_files = []
    for f in sorted(MEMORY_DIR.glob("*.md")):
        if f.name == "INDEX.md":
            continue
        lines = f.read_text(encoding="utf-8").splitlines()
        topic_files.append({
            "path": f,
            "name": f.name,
            "size_lines": len(lines),
            "last_modified": datetime.fromtimestamp(f.stat().st_mtime),
        })

    daily_files = _get_daily_files_since(last_run)
    print(f"  Topic files: {len(topic_files)}")
    print(f"  Daily logs to process: {len(daily_files)}")

    index_exists = INDEX_FILE.exists()
    index_lines = len(INDEX_FILE.read_text(encoding="utf-8").splitlines()) if index_exists else 0
    print(f"  INDEX.md: {'exists' if index_exists else 'missing'} ({index_lines} lines)")

    return {
        "topic_files": topic_files,
        "daily_files": daily_files,
        "index_exists": index_exists,
        "index_lines": index_lines,
        "last_run": last_run,
    }


def _extract_section_items(content, section_name):
    """Extract bullet/list items from a named markdown section."""
    items = []
    in_section = False
    for line in content.splitlines():
        # Match section header (## or ###)
        if re.match(r"^#{1,3}\s+" + re.escape(section_name), line, re.IGNORECASE):
            in_section = True
            continue
        # New section ends the current one
        if in_section and re.match(r"^#{1,3}\s+", line):
            in_section = False
            break
        if in_section:
            stripped = line.strip()
            # Collect non-empty lines (bullets or plain text)
            if stripped and (stripped.startswith("-") or stripped.startswith("*")):
                # Clean bullet marker and leading bold/link markup
                text = re.sub(r"^[-*]\s+", "", stripped)
                text = re.sub(r"\*\*(.+?)\*\*:?\s*", r"\1: ", text)
                text = re.sub(r"\[\[.+?\|(.+?)\]\]", r"\1", text)  # [[ALTON|Alton]] → Alton
                text = re.sub(r"\[\[(.+?)\]\]", r"\1", text)        # [[ALTON]] → ALTON
                if text:
                    items.append(text.strip())
    return items


def _convert_relative_dates(text, reference_date):
    """Convert relative date references to absolute dates."""
    ref = reference_date

    # "today" → actual date
    text = re.sub(
        r"\btoday\b",
        ref.strftime("%Y-%m-%d"),
        text, flags=re.IGNORECASE
    )
    # "yesterday" → previous date
    text = re.sub(
        r"\byesterday\b",
        (ref - timedelta(days=1)).strftime("%Y-%m-%d"),
        text, flags=re.IGNORECASE
    )
    # "last week" → approximate
    text = re.sub(
        r"\blast week\b",
        f"week of {(ref - timedelta(days=7)).strftime('%Y-%m-%d')}",
        text, flags=re.IGNORECASE
    )
    return text


def phase_gather(daily_files):
    """Phase 2: Extract key facts from recent daily logs.

    Reads each daily log and extracts:
    - Decisions made
    - Facts learned
    - Tasks completed
    - Issues discovered

    Returns list of {fact, source_file, date, category}
    """
    print(f"[Phase 2] Gather — extracting facts from {len(daily_files)} daily log(s)...")
    facts = []

    for daily_path in daily_files:
        # Parse date from filename (2026-02-18.md)
        date_match = re.match(r"(\d{4}-\d{2}-\d{2})", daily_path.stem)
        if date_match:
            try:
                log_date = datetime.strptime(date_match.group(1), "%Y-%m-%d")
            except ValueError:
                log_date = datetime.now()
        else:
            log_date = datetime.now()

        content = daily_path.read_text(encoding="utf-8")

        # Map section names to categories
        section_map = {
            "completed": "completed",
            "decisions made": "decision",
            "decisions": "decision",
            "what was built": "completed",
            "insights": "insight",
            "lessons": "lesson",
            "key facts": "fact",
            "issues": "issue",
            "problems": "issue",
            # Sartor daily log format
            "critical alerts": "issue",
            "alert escalations": "issue",
            "outstanding alerts": "issue",
            "active alerts": "issue",
            "financial items": "fact",
            "time-sensitive financial items": "fact",
            "nonprofit": "fact",
            "family": "fact",
            "calendar notes": "fact",
            "monitoring items": "fact",
            "upcoming deadlines": "fact",
        }

        for section, category in section_map.items():
            items = _extract_section_items(content, section)
            for item in items:
                # Convert relative dates using the log's date as reference
                item = _convert_relative_dates(item, log_date)
                facts.append({
                    "fact": item,
                    "source_file": daily_path.name,
                    "date": log_date.strftime("%Y-%m-%d"),
                    "category": category,
                })

    print(f"  Extracted {len(facts)} facts total")
    return facts


def _route_fact_to_topic(fact_text):
    """Determine which topic file a fact belongs to based on keywords."""
    fact_lower = fact_text.lower()
    scores = {}
    for topic_file, keywords in TOPIC_ROUTING.items():
        score = sum(1 for kw in keywords if kw.lower() in fact_lower)
        if score > 0:
            scores[topic_file] = score

    if not scores:
        return "LEARNINGS.md"  # Default bucket

    return max(scores, key=scores.get)


def _fact_already_present(content, fact_text):
    """Check if a fact (or very similar text) is already in the file."""
    # Simple substring check after normalization
    norm_fact = re.sub(r"\s+", " ", fact_text.lower().strip())
    norm_content = re.sub(r"\s+", " ", content.lower())
    # Check if 60%+ of the fact words appear clustered in content
    words = [w for w in norm_fact.split() if len(w) > 4]
    if not words:
        return False
    matches = sum(1 for w in words if w in norm_content)
    return matches / len(words) >= 0.6


def phase_consolidate(facts, topic_files, dry_run=False):
    """Phase 3: Update topic files with gathered facts.

    For each fact:
    1. Determine which topic file it belongs to
    2. Check if it contradicts/duplicates existing content
    3. If new: append to appropriate section
    4. Convert any relative dates to absolute

    Returns list of changes made.
    """
    print(f"[Phase 3] Consolidate — routing {len(facts)} facts into topic files...")

    # Build dict of topic file content
    topic_content = {}
    for tf in topic_files:
        topic_content[tf["name"]] = tf["path"].read_text(encoding="utf-8")

    # Route facts and group by destination file
    routing = {}
    for fact in facts:
        dest = _route_fact_to_topic(fact["fact"])
        routing.setdefault(dest, []).append(fact)

    changes = []
    for dest_file, dest_facts in routing.items():
        content = topic_content.get(dest_file, "")
        new_entries = []

        for fact in dest_facts:
            if _fact_already_present(content, fact["fact"]):
                continue  # Skip duplicates
            new_entries.append(fact)

        if not new_entries:
            continue

        print(f"  {dest_file}: {len(new_entries)} new fact(s)")

        # Build append block
        append_lines = [
            "",
            f"## Consolidated from daily logs ({datetime.now().strftime('%Y-%m-%d')})",
        ]
        for fact in new_entries:
            append_lines.append(
                f"- [{fact['date']}] ({fact['category']}) {fact['fact']}"
            )

        if not dry_run:
            dest_path = MEMORY_DIR / dest_file
            if dest_path.exists():
                with dest_path.open("a", encoding="utf-8") as fh:
                    fh.write("\n".join(append_lines) + "\n")
            # Update in-memory content so later facts see the additions
            topic_content[dest_file] = content + "\n".join(append_lines)

        changes.append({
            "file": dest_file,
            "facts_added": len(new_entries),
            "entries": [f["fact"][:80] for f in new_entries],
        })

    total_added = sum(c["facts_added"] for c in changes)
    print(f"  Total new facts written: {total_added} (dry_run={dry_run})")
    return changes


def phase_prune(dry_run=False):
    """Phase 4: Maintain INDEX.md and archive old logs.

    1. Regenerate INDEX.md from current topic files
    2. Archive daily logs older than 90 days
    3. Remove empty or near-empty daily logs (< 3 lines of content)
    """
    print("[Phase 4] Prune — maintaining INDEX.md and archiving old logs...")

    # Regenerate INDEX.md
    new_index = generate_index()
    index_lines = len(new_index.splitlines())
    print(f"  INDEX.md: {index_lines} lines")
    if index_lines > MAX_INDEX_LINES:
        print(f"  WARNING: INDEX.md exceeds {MAX_INDEX_LINES} lines ({index_lines})")

    if not dry_run:
        INDEX_FILE.write_text(new_index, encoding="utf-8")
        print(f"  Wrote INDEX.md ({index_lines} lines)")

    # Archive old daily logs
    archive_dir = DAILY_DIR / "archive"
    cutoff = datetime.now() - timedelta(days=ARCHIVE_AGE_DAYS)
    archived = []
    removed = []

    if DAILY_DIR.exists():
        for f in sorted(DAILY_DIR.glob("*.md")):
            date_match = re.match(r"(\d{4}-\d{2}-\d{2})", f.stem)
            if not date_match:
                continue
            try:
                log_date = datetime.strptime(date_match.group(1), "%Y-%m-%d")
            except ValueError:
                continue

            # Check for near-empty logs (fewer than 3 meaningful lines)
            content_lines = [
                ln for ln in f.read_text(encoding="utf-8").splitlines()
                if ln.strip() and not ln.startswith("#")
            ]
            if len(content_lines) < 3:
                print(f"  Removing near-empty log: {f.name}")
                if not dry_run:
                    f.unlink()
                removed.append(f.name)
                continue

            # Archive if old enough
            if log_date < cutoff:
                print(f"  Archiving old log: {f.name} (age: {(datetime.now() - log_date).days}d)")
                if not dry_run:
                    archive_dir.mkdir(exist_ok=True)
                    shutil.move(str(f), str(archive_dir / f.name))
                archived.append(f.name)

    print(f"  Archived: {len(archived)}, Removed: {len(removed)}")
    return {"archived": archived, "removed": removed, "index_lines": index_lines}


def generate_index():
    """Generate INDEX.md from current memory state."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    lines = [
        "# Sartor Memory Index",
        f"## Last Updated: {now_str}",
        "",
        "## Core Memory",
    ]

    # Add all .md files in MEMORY_DIR (not INDEX.md itself, not subdirs)
    core_files = sorted(MEMORY_DIR.glob("*.md"))
    for f in core_files:
        if f.name == "INDEX.md":
            continue
        # Extract first non-header content line as summary
        summary = _extract_file_summary(f)
        lines.append(f"- [{f.name}]({f.name}) — {summary}")

    # Recent activity (last 10 daily logs)
    if DAILY_DIR.exists():
        daily_logs = sorted(
            [f for f in DAILY_DIR.glob("*.md") if f.parent.name != "archive"],
            reverse=True
        )[:10]

        if daily_logs:
            lines.append("")
            lines.append("## Recent Activity")
            for f in daily_logs:
                summary = _extract_file_summary(f)
                lines.append(f"- [{f.name}](daily/{f.name}) — {summary}")

    # Snapshots / research
    research_dir = MEMORY_DIR / "research"
    if research_dir.exists():
        research_files = list(research_dir.glob("*.md"))
        if research_files:
            lines.append("")
            lines.append("## Research & Snapshots")
            for f in sorted(research_files):
                summary = _extract_file_summary(f)
                lines.append(f"- [{f.name}](research/{f.name}) — {summary}")

    lines.append("")
    return "\n".join(lines)


def _extract_file_summary(path):
    """Extract a one-line summary from a memory file."""
    try:
        content = path.read_text(encoding="utf-8")
    except OSError:
        return "(unreadable)"

    for line in content.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        # Skip main heading
        if stripped.startswith("# "):
            # Return the heading text itself as summary (strip the #)
            return stripped.lstrip("# ").strip()
        # Skip metadata lines like "> Last updated:"
        if stripped.startswith(">"):
            continue
        # Return first meaningful content
        if stripped.startswith("##"):
            return stripped.lstrip("# ").strip()
        return stripped[:120]

    return "(empty)"


def _write_consolidation_log(facts_count, changes, prune_result, dry_run):
    """Append a run record to consolidation-log.md."""
    _ensure_meta_dir()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    total_added = sum(c["facts_added"] for c in changes)

    entry_lines = [
        f"## Run: {now_str}",
        f"- dry_run: {dry_run}",
        f"- facts_gathered: {facts_count}",
        f"- facts_written: {total_added}",
        f"- files_updated: {len(changes)}",
        f"- logs_archived: {len(prune_result.get('archived', []))}",
        f"- logs_removed: {len(prune_result.get('removed', []))}",
        f"- index_lines: {prune_result.get('index_lines', 0)}",
    ]
    if changes:
        entry_lines.append("- changes:")
        for c in changes:
            entry_lines.append(f"  - {c['file']}: +{c['facts_added']} facts")
    entry_lines.append("")

    log_content = "\n".join(entry_lines) + "\n"

    if CONSOLIDATION_LOG.exists():
        existing = CONSOLIDATION_LOG.read_text(encoding="utf-8")
        CONSOLIDATION_LOG.write_text(existing + log_content, encoding="utf-8")
    else:
        header = "# autoDream Consolidation Log\n\n"
        CONSOLIDATION_LOG.write_text(header + log_content, encoding="utf-8")


def run_consolidation(force=False, dry_run=False):
    """Run the full 4-phase consolidation cycle."""
    print(f"autoDream — Memory Consolidation Engine")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    if dry_run:
        print("Mode: DRY RUN (no changes will be written)")
    print()

    # Gate checks
    can_proceed, reason = check_gates(force)
    if not can_proceed:
        print(f"Skipping consolidation: {reason}")
        return False

    print(f"Gates: {reason}")
    print()

    # Acquire lock
    _ensure_meta_dir()
    if not dry_run:
        LOCK_FILE.write_text(datetime.now().isoformat(), encoding="utf-8")

    try:
        # Phase 1: Orient
        landscape = phase_orient()
        print()

        # Phase 2: Gather
        if not landscape["daily_files"]:
            print("[Phase 2] Gather — no new daily logs to process")
            facts = []
        else:
            facts = phase_gather(landscape["daily_files"])
        print()

        # Phase 3: Consolidate
        if facts:
            changes = phase_consolidate(facts, landscape["topic_files"], dry_run)
        else:
            print("[Phase 3] Consolidate — nothing to consolidate")
            changes = []
        print()

        # Phase 4: Prune
        prune_result = phase_prune(dry_run)
        print()

        # Log this run
        if not dry_run:
            _write_consolidation_log(len(facts), changes, prune_result, dry_run)

        print("autoDream complete.")
        total_added = sum(c["facts_added"] for c in changes)
        print(f"Summary: {len(facts)} facts gathered, {total_added} written, "
              f"{prune_result.get('index_lines', 0)} INDEX lines")
        return True

    finally:
        # Release lock
        if not dry_run and LOCK_FILE.exists():
            LOCK_FILE.unlink()


def show_status():
    """Show last consolidation status."""
    print("autoDream Status")
    print("=" * 40)

    if not CONSOLIDATION_LOG.exists():
        print("No consolidation runs found.")
        print(f"Log would be at: {CONSOLIDATION_LOG}")
        return

    content = CONSOLIDATION_LOG.read_text(encoding="utf-8")
    # Find last run block
    blocks = re.split(r"\n(?=## Run:)", content)
    last_block = [b for b in blocks if b.strip().startswith("## Run:")]

    if not last_block:
        print("No runs recorded yet.")
        return

    print("Last run:")
    for line in last_block[-1].splitlines():
        if line.strip():
            print(f"  {line}")

    # Show upcoming daily log count
    last_run = _read_last_consolidation()
    new_files = _get_daily_files_since(last_run)
    print()
    print(f"Daily logs since last run: {len(new_files)}/{MIN_DAILY_LOGS} needed")
    if last_run:
        hours_since = (datetime.now() - last_run).total_seconds() / 3600
        print(f"Hours since last run: {hours_since:.1f}/{MIN_HOURS_BETWEEN_RUNS} minimum")

    # Lock file check
    if LOCK_FILE.exists():
        age = datetime.now() - datetime.fromtimestamp(LOCK_FILE.stat().st_mtime)
        print(f"Lock file: EXISTS (age: {age})")
    else:
        print("Lock file: none")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="autoDream Memory Consolidation Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Skip gate checks and run consolidation unconditionally"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show what would change without writing anything"
    )
    parser.add_argument(
        "--status", action="store_true",
        help="Show last consolidation status and gate state"
    )
    args = parser.parse_args()

    if args.status:
        show_status()
    else:
        run_consolidation(force=args.force, dry_run=args.dry_run)
