#!/usr/bin/env python3
"""Google Calendar integration for Sartor - read-only access to upcoming events."""
from datetime import datetime, timedelta, timezone

try:
    from googleapiclient.discovery import build
    _GCAL_AVAILABLE = True
except ImportError:
    _GCAL_AVAILABLE = False

from google_auth import get_credentials


def get_upcoming_events(hours=48):
    """Get calendar events for the next N hours.

    Args:
        hours: How many hours ahead to look (default 48).

    Returns:
        list[dict]: Each dict has keys: summary, start, end, location, calendar.
        Returns empty list if auth not configured or on error.
    """
    if not _GCAL_AVAILABLE:
        return []

    creds = get_credentials()
    if not creds:
        return []

    try:
        service = build("calendar", "v3", credentials=creds)
        now = datetime.now(timezone.utc)
        time_max = now + timedelta(hours=hours)

        result = (
            service.events()
            .list(
                calendarId="primary",
                timeMin=now.isoformat(),
                timeMax=time_max.isoformat(),
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )

        events = []
        for item in result.get("items", []):
            start = item.get("start", {})
            end = item.get("end", {})
            events.append({
                "summary": item.get("summary", "(No title)"),
                "start": start.get("dateTime", start.get("date", "")),
                "end": end.get("dateTime", end.get("date", "")),
                "location": item.get("location", ""),
                "calendar": item.get("organizer", {}).get("displayName", "primary"),
            })
        return events
    except Exception as e:
        print(f"Calendar API error: {e}")
        return []


def get_today_events():
    """Get calendar events for the rest of today.

    Returns:
        list[dict]: Same format as get_upcoming_events().
    """
    now = datetime.now()
    end_of_day = now.replace(hour=23, minute=59, second=59)
    remaining_hours = (end_of_day - now).total_seconds() / 3600
    return get_upcoming_events(hours=max(1, remaining_hours))
