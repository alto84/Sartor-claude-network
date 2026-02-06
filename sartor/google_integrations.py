#!/usr/bin/env python3
"""Unified Google API interface for Sartor."""
from google_auth import is_authorized
from google_calendar import get_upcoming_events
from google_gmail import get_recent_messages, get_unread_count
from google_drive import get_recent_files


def is_google_configured():
    """Check if Google auth is set up.

    Returns:
        bool
    """
    return is_authorized()


def get_google_context():
    """Get a combined snapshot of Google data for briefings.

    Returns:
        dict with keys:
            status: "connected", "not_configured", or "error: ..."
            calendar_events: list of upcoming events (48h)
            email_summary: {unread_count: int, recent: list of messages}
            recent_files: list of recent Drive files
    """
    if not is_google_configured():
        return {
            "status": "not_configured",
            "calendar_events": [],
            "email_summary": {"unread_count": 0, "recent": []},
            "recent_files": [],
        }

    result = {"status": "connected", "calendar_events": [], "email_summary": {}, "recent_files": []}

    try:
        result["calendar_events"] = get_upcoming_events(48)
    except Exception as e:
        result["calendar_events"] = []
        result.setdefault("errors", []).append(f"calendar: {e}")

    try:
        result["email_summary"] = {
            "unread_count": get_unread_count(),
            "recent": get_recent_messages(5),
        }
    except Exception as e:
        result["email_summary"] = {"unread_count": 0, "recent": []}
        result.setdefault("errors", []).append(f"gmail: {e}")

    try:
        result["recent_files"] = get_recent_files(5)
    except Exception as e:
        result["recent_files"] = []
        result.setdefault("errors", []).append(f"drive: {e}")

    if "errors" in result:
        result["status"] = f"error: partial failures - {', '.join(result['errors'])}"

    return result
