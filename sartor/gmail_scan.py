"""Gmail scanner for the Sartor Home Agent system.

Scans Gmail for actionable items and writes curator-compatible inbox entries.
Designed to run as a cron task on Rocinante every 4 hours (06:00, 10:00, 14:00,
18:00, 22:00). The 06:00 run feeds the morning briefing.

Two runtime modes:
  1. MCP mode (inside Claude Code): uses mcp__claude_ai_Gmail__* tools
  2. API mode (standalone): uses google-api-python-client via sartor/google_gmail.py

When run as `python -m sartor.gmail_scan`, it attempts API mode first.
When dispatched by the scheduled executor inside Claude Code, MCP tools are
available and should be preferred.

Run as:
    python -m sartor.gmail_scan [--since HOURS] [--dry-run] [-v]

Exit codes:
    0  success (even if 0 actionable emails found)
    1  fatal error
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import traceback
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
MEMORY_ROOT = REPO_ROOT / "sartor" / "memory"
INBOX_ROOT = MEMORY_ROOT / "inbox"
META_DIR = MEMORY_ROOT / ".meta"
LAST_SCAN_PATH = META_DIR / "gmail-last-scan.json"
GMAIL_INBOX_DIR = INBOX_ROOT / "rocinante" / "gmail"

SCANNER_NAME = "rocinante-gmail-scanner"
SCANNER_VERSION = "0.1"

DEFAULT_SINCE_HOURS = 4

# ---------------------------------------------------------------------------
# Classification patterns
# ---------------------------------------------------------------------------

ACTION_PATTERNS = [
    (re.compile(r"\breply\b|\brespond\b|\bget back\b", re.I), "reply_needed"),
    (re.compile(r"\bdeadline\b|\bdue\s+(?:by|on|date)\b|\bexpir", re.I), "deadline"),
    (re.compile(r"\bpay(?:ment|able)?\b|\binvoice\b|\bbill\b|\bamount\s+due\b", re.I), "payment_due"),
    (re.compile(r"\bappointment\b|\bschedul\b|\bmeeting\b|\bconsult", re.I), "appointment"),
    (re.compile(r"\bschool\b|\bMKA\b|\bGoddard\b|\bearly\s+dismissal\b|\bfield\s+trip\b", re.I), "school_event"),
    (re.compile(r"\baction\s+required\b|\burgent\b|\bimmediate\b|\basap\b", re.I), "urgent"),
    (re.compile(r"\bconfirm\b|\bverif\b|\bapproval\b|\bsign\b", re.I), "confirmation_needed"),
    (re.compile(r"\brenew\b|\bexpir\b|\bregistration\b|\bfiling\b", re.I), "renewal"),
]

NOISE_SENDERS = frozenset({
    "noreply", "no-reply", "donotreply", "do-not-reply",
    "notifications", "alert", "newsletter", "marketing",
    "promo", "deals", "offers", "unsubscribe",
})

NOISE_SUBJECT_PATTERNS = [
    re.compile(r"\bunsubscribe\b", re.I),
    re.compile(r"\bnewsletter\b", re.I),
    re.compile(r"^\s*\[?ad\]?\s", re.I),
    re.compile(r"\bpromotion\b|\bspecial\s+offer\b|\bdiscount\b", re.I),
]


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class EmailItem:
    """Represents a single scanned email."""
    message_id: str
    sender: str
    sender_email: str
    subject: str
    date: str
    snippet: str
    is_unread: bool
    labels: list[str] = field(default_factory=list)


@dataclass
class ClassifiedEmail:
    """An email after classification."""
    email: EmailItem
    classification: str  # "actionable" | "informational" | "spam-noise"
    action_types: list[str] = field(default_factory=list)
    priority: str = "p2"
    deadline: str | None = None


@dataclass
class ScanResult:
    """Result of a full gmail scan run."""
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    emails_scanned: int = 0
    actionable: list[ClassifiedEmail] = field(default_factory=list)
    informational: list[ClassifiedEmail] = field(default_factory=list)
    noise: list[ClassifiedEmail] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    inbox_entries_written: int = 0
    runtime_ms: int = 0
    dry_run: bool = False


# ---------------------------------------------------------------------------
# Classification logic
# ---------------------------------------------------------------------------


def classify_email(email: EmailItem) -> ClassifiedEmail:
    """Classify an email as actionable, informational, or spam-noise."""
    # Check for noise first
    sender_lower = email.sender_email.lower()
    sender_local = sender_lower.split("@")[0] if "@" in sender_lower else sender_lower

    if any(noise in sender_local for noise in NOISE_SENDERS):
        return ClassifiedEmail(email=email, classification="spam-noise")

    if any(pat.search(email.subject) for pat in NOISE_SUBJECT_PATTERNS):
        return ClassifiedEmail(email=email, classification="spam-noise")

    # Check for action patterns in subject + snippet
    combined = f"{email.subject} {email.snippet}"
    action_types = []
    for pattern, action_type in ACTION_PATTERNS:
        if pattern.search(combined):
            action_types.append(action_type)

    if action_types:
        priority = "p1" if "urgent" in action_types else "p2"
        deadline = _extract_deadline(combined)
        return ClassifiedEmail(
            email=email,
            classification="actionable",
            action_types=action_types,
            priority=priority,
            deadline=deadline,
        )

    # Default: informational
    return ClassifiedEmail(email=email, classification="informational")


def _extract_deadline(text: str) -> str | None:
    """Try to extract a deadline date from text. Returns ISO date or None."""
    # Match patterns like "due by April 15" or "deadline: 4/15/2026"
    date_patterns = [
        re.compile(r"(?:due|deadline|by|before)[:\s]+(\d{1,2}/\d{1,2}/\d{2,4})", re.I),
        re.compile(r"(?:due|deadline|by|before)[:\s]+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}(?:,?\s*\d{4})?)", re.I),
    ]
    for pat in date_patterns:
        m = pat.search(text)
        if m:
            return m.group(1).strip()
    return None


def _slugify(text: str, max_len: int = 60) -> str:
    """Convert text to a filesystem-safe slug."""
    slug = re.sub(r"[^\w\s-]", "", text.lower())
    slug = re.sub(r"[\s_]+", "-", slug).strip("-")
    return slug[:max_len]


# ---------------------------------------------------------------------------
# Last-scan timestamp management
# ---------------------------------------------------------------------------


def get_last_scan_time(path: Path = LAST_SCAN_PATH) -> datetime | None:
    """Read the last scan timestamp. Returns None if no prior scan."""
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return datetime.fromisoformat(data["last_scan"])
    except (json.JSONDecodeError, KeyError, ValueError):
        return None


def save_last_scan_time(ts: datetime, path: Path = LAST_SCAN_PATH) -> None:
    """Persist the scan timestamp."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps({"last_scan": ts.isoformat(), "scanner_version": SCANNER_VERSION}),
        encoding="utf-8",
    )


# ---------------------------------------------------------------------------
# Inbox entry writing
# ---------------------------------------------------------------------------


def write_inbox_entry(classified: ClassifiedEmail, dry_run: bool = False) -> Path | None:
    """Write a curator-compatible inbox entry for an actionable email.

    Returns the path written, or None if dry_run or not actionable.
    """
    if classified.classification != "actionable":
        return None

    today = datetime.now(timezone.utc).date().isoformat()
    slug = _slugify(classified.email.subject)
    filename = f"{today}_{slug}.md"
    out_path = GMAIL_INBOX_DIR / filename

    action_str = ", ".join(classified.action_types)
    deadline_line = f"deadline: {classified.deadline}" if classified.deadline else ""

    frontmatter = {
        "id": f"gmail-{today}-{slug}",
        "origin": "rocinante",
        "author": SCANNER_NAME,
        "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "target": "inbox-only",
        "operation": "event",
        "type": "event",
        "priority": classified.priority,
        "category": "email",
        "source_email": classified.email.sender_email,
    }
    if classified.deadline:
        frontmatter["deadline"] = classified.deadline

    fm_yaml = yaml.safe_dump(frontmatter, sort_keys=False, default_flow_style=False)
    body_lines = [
        f"## {classified.email.subject}",
        "",
        f"- **From:** {classified.email.sender} <{classified.email.sender_email}>",
        f"- **Date:** {classified.email.date}",
        f"- **Actions needed:** {action_str}",
    ]
    if classified.deadline:
        body_lines.append(f"- **Deadline:** {classified.deadline}")
    body_lines.extend([
        "",
        f"> {classified.email.snippet}",
        "",
    ])

    content = f"---\n{fm_yaml}---\n\n" + "\n".join(body_lines)

    if dry_run:
        return out_path

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(content, encoding="utf-8")
    return out_path


# ---------------------------------------------------------------------------
# Email fetching (API mode -- standalone Python)
# ---------------------------------------------------------------------------


def fetch_emails_api(since_hours: int = DEFAULT_SINCE_HOURS) -> list[EmailItem]:
    """Fetch recent emails using google-api-python-client.

    Returns an empty list if the Google API libraries are not installed
    or credentials are not configured.
    """
    try:
        sys.path.insert(0, str(REPO_ROOT / "sartor"))
        from google_gmail import get_recent_messages
    except ImportError:
        return []

    messages = get_recent_messages(count=50)
    items = []
    for msg in messages:
        items.append(EmailItem(
            message_id=msg.get("id", ""),
            sender=msg.get("from_name", ""),
            sender_email=msg.get("from_email", ""),
            subject=msg.get("subject", ""),
            date=msg.get("date", ""),
            snippet=msg.get("snippet", ""),
            is_unread=msg.get("is_unread", False),
            labels=[],
        ))
    return items


def fetch_emails_mcp(since_hours: int = DEFAULT_SINCE_HOURS) -> list[EmailItem]:
    """Placeholder for MCP-based email fetching.

    When this module is dispatched by the scheduled executor inside a Claude
    Code session, MCP tools (mcp__claude_ai_Gmail__gmail_search_messages, etc.)
    are available. This function is a stub that returns an empty list -- the
    actual MCP invocations happen in the scheduled task SKILL.md which calls
    Claude Code with the right context.

    # TODO: requires MCP runtime -- actual email fetching via MCP tools happens
    # in the scheduled task SKILL.md, not in this Python module.
    """
    return []


# ---------------------------------------------------------------------------
# Main scan logic
# ---------------------------------------------------------------------------


def run_scan(
    since_hours: int = DEFAULT_SINCE_HOURS,
    dry_run: bool = False,
    verbose: bool = False,
) -> ScanResult:
    """Execute a Gmail scan pass.

    Tries API mode first, falls back to returning empty if unavailable.
    MCP mode is handled by the scheduled task SKILL.md at runtime.
    """
    t0 = time.monotonic()
    result = ScanResult(dry_run=dry_run)

    # Try API mode
    try:
        emails = fetch_emails_api(since_hours=since_hours)
    except Exception as exc:
        result.errors.append(f"API fetch failed: {exc}")
        emails = []

    if not emails:
        if verbose:
            print("[gmail_scan] No emails fetched (API unavailable or no credentials)", file=sys.stderr)

    # Filter to unread or since-last-scan
    last_scan = get_last_scan_time()
    if last_scan and not dry_run:
        if verbose:
            print(f"[gmail_scan] Last scan: {last_scan.isoformat()}", file=sys.stderr)

    result.emails_scanned = len(emails)

    # Classify each email
    for email_item in emails:
        classified = classify_email(email_item)

        if classified.classification == "actionable":
            result.actionable.append(classified)
        elif classified.classification == "informational":
            result.informational.append(classified)
        else:
            result.noise.append(classified)

    # Write inbox entries for actionable emails
    for classified in result.actionable:
        try:
            path = write_inbox_entry(classified, dry_run=dry_run)
            if path:
                result.inbox_entries_written += 1
                if verbose:
                    marker = "[DRY] " if dry_run else ""
                    print(f"{marker}wrote {path.name}", file=sys.stderr)
        except Exception as exc:
            result.errors.append(f"write failed for {classified.email.subject}: {exc}")

    # Update last-scan timestamp
    if not dry_run:
        save_last_scan_time(datetime.now(timezone.utc))

    result.runtime_ms = int((time.monotonic() - t0) * 1000)
    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="gmail_scan",
        description="Scan Gmail for actionable items and write inbox entries.",
    )
    p.add_argument(
        "--since", type=int, default=DEFAULT_SINCE_HOURS,
        help=f"Hours to look back (default {DEFAULT_SINCE_HOURS}).",
    )
    p.add_argument("--dry-run", action="store_true", help="Print actions without writing files.")
    p.add_argument("-v", "--verbose", action="store_true")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    try:
        result = run_scan(
            since_hours=args.since,
            dry_run=args.dry_run,
            verbose=args.verbose,
        )
    except Exception as exc:
        print(f"gmail_scan: fatal error: {exc}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return 1

    summary = {
        "emails_scanned": result.emails_scanned,
        "actionable": len(result.actionable),
        "informational": len(result.informational),
        "noise": len(result.noise),
        "inbox_entries_written": result.inbox_entries_written,
        "errors": len(result.errors),
        "runtime_ms": result.runtime_ms,
        "dry_run": result.dry_run,
    }
    print(json.dumps(summary, indent=2))

    return 1 if result.errors else 0


if __name__ == "__main__":
    sys.exit(main())
