"""Tests for sartor/gmail_scan.py.

Covers classification logic, action detection, noise filtering, deadline extraction,
inbox entry writing, and last-scan timestamp management.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "sartor"))

from sartor import gmail_scan as GS
from sartor.gmail_scan import (
    ClassifiedEmail,
    EmailItem,
    ScanResult,
    classify_email,
    get_last_scan_time,
    save_last_scan_time,
    write_inbox_entry,
    _extract_deadline,
    _slugify,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def make_email(
    subject: str = "Test Subject",
    sender: str = "John Doe",
    sender_email: str = "john@example.com",
    snippet: str = "This is a test email.",
    is_unread: bool = True,
    message_id: str = "msg-001",
    date: str = "2026-04-11T08:00:00Z",
) -> EmailItem:
    return EmailItem(
        message_id=message_id,
        sender=sender,
        sender_email=sender_email,
        subject=subject,
        date=date,
        snippet=snippet,
        is_unread=is_unread,
    )


# ---------------------------------------------------------------------------
# Test: Classification - Actionable
# ---------------------------------------------------------------------------


class TestClassificationActionable:
    def test_reply_needed_in_subject(self):
        email = make_email(subject="Please reply to confirm attendance")
        result = classify_email(email)
        assert result.classification == "actionable"
        assert "reply_needed" in result.action_types

    def test_payment_due_in_snippet(self):
        email = make_email(
            subject="Monthly Statement",
            snippet="Your payment of $450 is due by April 15.",
        )
        result = classify_email(email)
        assert result.classification == "actionable"
        assert "payment_due" in result.action_types

    def test_school_event_detection(self):
        email = make_email(subject="MKA Early Dismissal Friday")
        result = classify_email(email)
        assert result.classification == "actionable"
        assert "school_event" in result.action_types

    def test_urgent_gets_p1_priority(self):
        email = make_email(subject="Action Required: Verify your account ASAP")
        result = classify_email(email)
        assert result.classification == "actionable"
        assert result.priority == "p1"
        assert "urgent" in result.action_types

    def test_appointment_detection(self):
        email = make_email(subject="Your appointment is scheduled for Monday")
        result = classify_email(email)
        assert result.classification == "actionable"
        assert "appointment" in result.action_types

    def test_deadline_in_snippet(self):
        email = make_email(
            subject="Tax Filing Reminder",
            snippet="Deadline for filing is April 15, 2026. Please submit all documents.",
        )
        result = classify_email(email)
        assert result.classification == "actionable"
        assert "deadline" in result.action_types


# ---------------------------------------------------------------------------
# Test: Classification - Noise
# ---------------------------------------------------------------------------


class TestClassificationNoise:
    def test_noreply_sender(self):
        email = make_email(sender_email="noreply@company.com")
        result = classify_email(email)
        assert result.classification == "spam-noise"

    def test_newsletter_subject(self):
        email = make_email(
            subject="Weekly Newsletter: Top Stories",
            sender_email="editor@news.com",
        )
        result = classify_email(email)
        assert result.classification == "spam-noise"

    def test_marketing_sender(self):
        email = make_email(sender_email="marketing@store.com")
        result = classify_email(email)
        assert result.classification == "spam-noise"

    def test_promotion_subject(self):
        email = make_email(
            subject="Special Offer: 50% Discount Today Only",
            sender_email="sales@shop.com",
        )
        result = classify_email(email)
        assert result.classification == "spam-noise"


# ---------------------------------------------------------------------------
# Test: Classification - Informational
# ---------------------------------------------------------------------------


class TestClassificationInformational:
    def test_plain_email_is_informational(self):
        email = make_email(
            subject="Project Update",
            sender_email="colleague@work.com",
            snippet="Here is the latest status on the project.",
        )
        result = classify_email(email)
        assert result.classification == "informational"


# ---------------------------------------------------------------------------
# Test: Deadline extraction
# ---------------------------------------------------------------------------


class TestDeadlineExtraction:
    def test_due_by_date_slash(self):
        result = _extract_deadline("Payment due by 4/15/2026")
        assert result == "4/15/2026"

    def test_deadline_named_month(self):
        result = _extract_deadline("Deadline: April 15, 2026 for submission")
        assert result is not None
        assert "April 15" in result

    def test_no_deadline(self):
        result = _extract_deadline("Just a regular email with no dates mentioned")
        assert result is None


# ---------------------------------------------------------------------------
# Test: Slug generation
# ---------------------------------------------------------------------------


class TestSlugify:
    def test_basic_slug(self):
        assert _slugify("Hello World") == "hello-world"

    def test_special_chars_removed(self):
        slug = _slugify("Re: Payment Due! [Urgent]")
        assert "!" not in slug
        assert "[" not in slug

    def test_max_length(self):
        long_subject = "A" * 100
        slug = _slugify(long_subject, max_len=60)
        assert len(slug) <= 60


# ---------------------------------------------------------------------------
# Test: Last scan timestamp
# ---------------------------------------------------------------------------


class TestLastScanTimestamp:
    def test_save_and_load(self, tmp_path):
        ts_path = tmp_path / "last-scan.json"
        now = datetime.now(timezone.utc)
        save_last_scan_time(now, ts_path)
        loaded = get_last_scan_time(ts_path)
        assert loaded is not None
        assert abs((loaded - now).total_seconds()) < 1

    def test_missing_file_returns_none(self, tmp_path):
        ts_path = tmp_path / "nonexistent.json"
        assert get_last_scan_time(ts_path) is None

    def test_corrupt_file_returns_none(self, tmp_path):
        ts_path = tmp_path / "bad.json"
        ts_path.write_text("not json", encoding="utf-8")
        assert get_last_scan_time(ts_path) is None


# ---------------------------------------------------------------------------
# Test: Inbox entry writing
# ---------------------------------------------------------------------------


class TestInboxEntryWriting:
    def test_write_actionable_entry(self, tmp_path, monkeypatch):
        monkeypatch.setattr(GS, "GMAIL_INBOX_DIR", tmp_path / "gmail")
        email = make_email(subject="Pay invoice by April 20")
        classified = classify_email(email)
        assert classified.classification == "actionable"

        path = write_inbox_entry(classified, dry_run=False)
        assert path is not None
        assert path.exists()

        content = path.read_text(encoding="utf-8")
        assert content.startswith("---")
        assert "Pay invoice by April 20" in content
        assert "payment_due" in content or "deadline" in content

    def test_dry_run_does_not_write(self, tmp_path, monkeypatch):
        monkeypatch.setattr(GS, "GMAIL_INBOX_DIR", tmp_path / "gmail")
        email = make_email(subject="Reply needed for meeting")
        classified = classify_email(email)
        path = write_inbox_entry(classified, dry_run=True)
        assert path is not None
        assert not path.exists()

    def test_informational_returns_none(self):
        email = make_email(subject="FYI: Project Notes", sender_email="team@work.com")
        classified = ClassifiedEmail(email=email, classification="informational")
        assert write_inbox_entry(classified) is None


# ---------------------------------------------------------------------------
# Test: Multiple action types
# ---------------------------------------------------------------------------


class TestMultipleActionTypes:
    def test_email_with_multiple_actions(self):
        email = make_email(
            subject="Please reply about the payment deadline",
            snippet="Your invoice is due by 4/30/2026. Please respond to confirm.",
        )
        result = classify_email(email)
        assert result.classification == "actionable"
        assert len(result.action_types) >= 2
