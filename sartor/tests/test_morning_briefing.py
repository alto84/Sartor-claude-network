"""Tests for sartor/morning_briefing.py.

Covers curator summary parsing, todo extraction, completion detection,
dedup/resurfacing, staleness marking, and full briefing generation.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "sartor"))

from sartor import morning_briefing as MB
from sartor.morning_briefing import (
    TodoItem,
    get_curator_summary,
    get_gmail_highlights,
    get_improvement_proposals,
    get_todo_section,
    load_surfaced_todos,
    save_surfaced_todos,
    generate_briefing,
    _extract_todos_from_markdown,
    _extract_todos_from_conversations,
    _check_completed,
    _check_staleness,
    _should_resurface,
)

import yaml


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def write_curator_log(path: Path, entries: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for e in entries:
            f.write(json.dumps(e) + "\n")


def write_markdown(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


# ---------------------------------------------------------------------------
# Test: Curator summary
# ---------------------------------------------------------------------------


class TestCuratorSummary:
    def test_reads_last_two_entries(self, tmp_path):
        log_path = tmp_path / "curator-log.jsonl"
        write_curator_log(log_path, [
            {"timestamp": "2026-04-11T19:30:00Z", "num_drained": 3, "num_conflicts": 0, "num_errors": 0, "num_flagged": 1, "runtime_ms": 42, "dry_run": False},
            {"timestamp": "2026-04-12T07:30:00Z", "num_drained": 5, "num_conflicts": 1, "num_errors": 0, "num_flagged": 0, "runtime_ms": 67, "dry_run": False},
        ])
        result = get_curator_summary(log_path)
        assert "8 entries drained" in result
        assert "1 conflicts" in result
        assert "CONFLICTS NEED REVIEW" in result

    def test_empty_log(self, tmp_path):
        log_path = tmp_path / "curator-log.jsonl"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text("", encoding="utf-8")
        result = get_curator_summary(log_path)
        assert "empty" in result.lower()

    def test_missing_log(self, tmp_path):
        result = get_curator_summary(tmp_path / "nonexistent.jsonl")
        assert "not found" in result.lower() or "not run" in result.lower()

    def test_errors_flagged(self, tmp_path):
        log_path = tmp_path / "curator-log.jsonl"
        write_curator_log(log_path, [
            {"timestamp": "2026-04-12T07:30:00Z", "num_drained": 0, "num_conflicts": 0, "num_errors": 2, "num_flagged": 0, "runtime_ms": 10, "dry_run": False},
        ])
        result = get_curator_summary(log_path)
        assert "ERRORS DETECTED" in result


# ---------------------------------------------------------------------------
# Test: Todo extraction from markdown
# ---------------------------------------------------------------------------


class TestTodoExtraction:
    def test_extracts_unchecked_items(self, tmp_path):
        md_path = tmp_path / "todos.md"
        write_markdown(md_path, """# Tasks
- [ ] Pay the electricity bill
- [x] Already done item
- [ ] File Form 990
- Not a checkbox item
""")
        todos = _extract_todos_from_markdown(md_path, "test")
        assert len(todos) == 2
        assert todos[0].text == "Pay the electricity bill"
        assert todos[1].text == "File Form 990"

    def test_missing_file_returns_empty(self, tmp_path):
        todos = _extract_todos_from_markdown(tmp_path / "missing.md", "test")
        assert todos == []

    def test_fingerprints_are_consistent(self, tmp_path):
        md_path = tmp_path / "todos.md"
        write_markdown(md_path, "- [ ] Same task text\n")
        todos1 = _extract_todos_from_markdown(md_path, "test")
        todos2 = _extract_todos_from_markdown(md_path, "test")
        assert todos1[0].fingerprint == todos2[0].fingerprint


# ---------------------------------------------------------------------------
# Test: Completion detection
# ---------------------------------------------------------------------------


class TestCompletionDetection:
    def test_marks_completed_when_in_completed_file(self, tmp_path):
        completed = tmp_path / "COMPLETED.md"
        write_markdown(completed, """# Completed
- [x] Pay the electricity bill -- done 2026-04-10
""")
        todos = [
            TodoItem(text="Pay the electricity bill", source="test"),
            TodoItem(text="File Form 990", source="test"),
        ]
        for t in todos:
            t.compute_fingerprint()
        result = _check_completed(todos, completed)
        assert result[0].completed is True
        assert result[1].completed is False

    def test_no_completed_file(self, tmp_path):
        todos = [TodoItem(text="Some task", source="test")]
        for t in todos:
            t.compute_fingerprint()
        result = _check_completed(todos, tmp_path / "missing.md")
        assert result[0].completed is False


# ---------------------------------------------------------------------------
# Test: Staleness detection
# ---------------------------------------------------------------------------


class TestStalenessDetection:
    def test_old_todo_marked_stale(self):
        old_date = (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
        todos = [TodoItem(text="Old task", source="test", first_seen=old_date)]
        result = _check_staleness(todos, stale_days=7)
        assert result[0].stale is True

    def test_recent_todo_not_stale(self):
        recent = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        todos = [TodoItem(text="Recent task", source="test", first_seen=recent)]
        result = _check_staleness(todos, stale_days=7)
        assert result[0].stale is False

    def test_no_first_seen_not_stale(self):
        todos = [TodoItem(text="No date task", source="test")]
        result = _check_staleness(todos)
        assert result[0].stale is False


# ---------------------------------------------------------------------------
# Test: Dedup / resurfacing
# ---------------------------------------------------------------------------


class TestResurfacing:
    def test_never_surfaced_returns_true(self):
        todo = TodoItem(text="New task", source="test")
        todo.compute_fingerprint()
        assert _should_resurface(todo, {}) is True

    def test_recently_surfaced_returns_false(self):
        todo = TodoItem(text="Seen task", source="test")
        todo.compute_fingerprint()
        now = datetime.now(timezone.utc).isoformat()
        surfaced = {todo.fingerprint: now}
        assert _should_resurface(todo, surfaced, min_days=3) is False

    def test_old_surfaced_returns_true(self):
        todo = TodoItem(text="Old surfaced task", source="test")
        todo.compute_fingerprint()
        old = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        surfaced = {todo.fingerprint: old}
        assert _should_resurface(todo, surfaced, min_days=3) is True

    def test_save_and_load_surfaced(self, tmp_path):
        path = tmp_path / "surfaced.json"
        data = {"fp123": "2026-04-10T00:00:00+00:00"}
        save_surfaced_todos(data, path)
        loaded = load_surfaced_todos(path)
        assert loaded == data


# ---------------------------------------------------------------------------
# Test: Gmail highlights
# ---------------------------------------------------------------------------


class TestGmailHighlights:
    def test_no_dir_returns_message(self, tmp_path):
        result = get_gmail_highlights(tmp_path / "nonexistent")
        assert "not available" in result.lower() or "not have run" in result.lower()

    def test_reads_entries(self, tmp_path):
        gmail_dir = tmp_path / "gmail"
        gmail_dir.mkdir()
        entry_content = """---
id: gmail-2026-04-12-test
source_email: boss@work.com
priority: p1
---

## Important Meeting Reminder

- **From:** Boss <boss@work.com>
- **Date:** 2026-04-12
- **Actions needed:** appointment
"""
        (gmail_dir / "2026-04-12_important-meeting.md").write_text(entry_content, encoding="utf-8")
        result = get_gmail_highlights(gmail_dir)
        assert "Important Meeting Reminder" in result
        assert "boss@work.com" in result


# ---------------------------------------------------------------------------
# Test: Improvement proposals
# ---------------------------------------------------------------------------


class TestImprovementProposals:
    def test_extracts_proposals(self, tmp_path):
        iq = tmp_path / "IMPROVEMENT-QUEUE.md"
        write_markdown(iq, """---
type: queue
---

# Improvement Queue

## [HIGH] test_signal (2026-04-12)

**Date:** 2026-04-12
**Signal:** test_signal
**Severity:** high
**Detail:** Something needs fixing urgently.
**Proposed fix:** Fix it.

## [MEDIUM] another_signal (2026-04-12)

**Date:** 2026-04-12
**Signal:** another_signal
**Severity:** medium
**Detail:** Less urgent.
**Proposed fix:** Fix it later.
""")
        result = get_improvement_proposals(iq, max_items=3)
        assert "test_signal" in result
        assert "another_signal" in result

    def test_missing_file(self, tmp_path):
        result = get_improvement_proposals(tmp_path / "missing.md")
        assert "no improvement queue found" in result.lower() or "not found" in result.lower()


# ---------------------------------------------------------------------------
# Test: Full briefing generation
# ---------------------------------------------------------------------------


class TestFullBriefing:
    def test_generates_valid_frontmatter(self, tmp_path, monkeypatch):
        # Isolate all paths to tmp_path
        monkeypatch.setattr(MB, "CURATOR_LOG", tmp_path / "curator-log.jsonl")
        monkeypatch.setattr(MB, "EXTRACTOR_LOG", tmp_path / "extractor-log.jsonl")
        monkeypatch.setattr(MB, "SURFACED_TODOS_PATH", tmp_path / "surfaced.json")
        monkeypatch.setattr(MB, "GMAIL_INBOX_DIR", tmp_path / "gmail")
        monkeypatch.setattr(MB, "BRIEFING_DIR", tmp_path / "briefing")
        monkeypatch.setattr(MB, "TASKS_ACTIVE", tmp_path / "ACTIVE.md")
        monkeypatch.setattr(MB, "TASKS_COMPLETED", tmp_path / "COMPLETED.md")
        monkeypatch.setattr(MB, "FAMILY_TODOS", tmp_path / "active-todos.md")
        monkeypatch.setattr(MB, "IMPROVEMENT_QUEUE", tmp_path / "IMPROVEMENT-QUEUE.md")
        monkeypatch.setattr(MB, "INBOX_ROOT", tmp_path / "inbox")

        result = generate_briefing(dry_run=False, session_roots=[tmp_path])
        assert result.full_text.startswith("---")
        assert "Morning Briefing" in result.full_text
        assert result.output_path is not None
        assert result.output_path.exists()

        # Verify frontmatter is valid YAML
        parts = result.full_text.split("---", 2)
        fm = yaml.safe_load(parts[1])
        assert fm["type"] == "routine"
        assert fm["origin"] == "rocinante"
        assert "morning-briefing" in fm["id"]

    def test_dry_run_no_file(self, tmp_path, monkeypatch):
        monkeypatch.setattr(MB, "CURATOR_LOG", tmp_path / "curator-log.jsonl")
        monkeypatch.setattr(MB, "EXTRACTOR_LOG", tmp_path / "extractor-log.jsonl")
        monkeypatch.setattr(MB, "SURFACED_TODOS_PATH", tmp_path / "surfaced.json")
        monkeypatch.setattr(MB, "GMAIL_INBOX_DIR", tmp_path / "gmail")
        monkeypatch.setattr(MB, "BRIEFING_DIR", tmp_path / "briefing")
        monkeypatch.setattr(MB, "TASKS_ACTIVE", tmp_path / "ACTIVE.md")
        monkeypatch.setattr(MB, "TASKS_COMPLETED", tmp_path / "COMPLETED.md")
        monkeypatch.setattr(MB, "FAMILY_TODOS", tmp_path / "active-todos.md")
        monkeypatch.setattr(MB, "IMPROVEMENT_QUEUE", tmp_path / "IMPROVEMENT-QUEUE.md")
        monkeypatch.setattr(MB, "INBOX_ROOT", tmp_path / "inbox")

        result = generate_briefing(dry_run=True, session_roots=[tmp_path])
        assert result.output_path is None
        assert "Morning Briefing" in result.full_text


# ---------------------------------------------------------------------------
# Test: Conversation todo mining
# ---------------------------------------------------------------------------


class TestConversationTodoMining:
    def test_extracts_need_to_pattern(self, tmp_path):
        session_dir = tmp_path / "sessions"
        session_dir.mkdir()
        jsonl = session_dir / "test-session.jsonl"

        lines = []
        for i, text in enumerate([
            "I need to file the Form 990 before May 15.",
            "Don't forget to pick up the kids from school.",
            "The weather is nice today.",  # not a todo
        ]):
            lines.append(json.dumps({
                "type": "user",
                "uuid": f"u{i}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "message": {"role": "user", "content": [{"type": "text", "text": text}]},
            }))

        content = "\n".join(lines) + "\n"
        # Pad to meet MIN_FILE_SIZE
        while len(content.encode()) < 10 * 1024 + 512:
            content += json.dumps({
                "type": "assistant",
                "message": {"content": [{"type": "text", "text": "padding " * 100}]},
            }) + "\n"
        jsonl.write_text(content, encoding="utf-8")

        todos = _extract_todos_from_conversations(since_days=3, session_roots=[session_dir])
        texts = [t.text for t in todos]
        assert any("Form 990" in t for t in texts) or any("file" in t.lower() for t in texts)
        assert any("pick up" in t.lower() for t in texts) or any("kids" in t.lower() for t in texts)
