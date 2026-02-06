#!/usr/bin/env python3
"""Google Gmail integration for Sartor - read-only inbox access."""
import email.utils

try:
    from googleapiclient.discovery import build
    _GMAIL_AVAILABLE = True
except ImportError:
    _GMAIL_AVAILABLE = False

from google_auth import get_credentials


def _parse_from(header_value):
    """Parse a From header into name and email."""
    if not header_value:
        return "", ""
    name, addr = email.utils.parseaddr(header_value)
    return name or addr, addr


def get_recent_messages(count=10):
    """Get recent inbox messages.

    Args:
        count: Number of messages to retrieve (default 10).

    Returns:
        list[dict]: Each dict has keys: id, subject, from_name, from_email,
                    date, snippet, is_unread.
        Returns empty list if auth not configured or on error.
    """
    if not _GMAIL_AVAILABLE:
        return []

    creds = get_credentials()
    if not creds:
        return []

    try:
        service = build("gmail", "v1", credentials=creds)
        results = (
            service.users()
            .messages()
            .list(userId="me", labelIds=["INBOX"], maxResults=count)
            .execute()
        )

        messages = []
        for msg_stub in results.get("messages", []):
            msg = (
                service.users()
                .messages()
                .get(userId="me", id=msg_stub["id"], format="metadata",
                     metadataHeaders=["Subject", "From", "Date"])
                .execute()
            )
            headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
            from_name, from_email = _parse_from(headers.get("From", ""))
            label_ids = msg.get("labelIds", [])
            messages.append({
                "id": msg["id"],
                "subject": headers.get("Subject", "(No subject)"),
                "from_name": from_name,
                "from_email": from_email,
                "date": headers.get("Date", ""),
                "snippet": msg.get("snippet", ""),
                "is_unread": "UNREAD" in label_ids,
            })
        return messages
    except Exception as e:
        print(f"Gmail API error: {e}")
        return []


def get_unread_count():
    """Get the number of unread messages in INBOX.

    Returns:
        int: Unread message count. Returns 0 if auth not configured or on error.
    """
    if not _GMAIL_AVAILABLE:
        return 0

    creds = get_credentials()
    if not creds:
        return 0

    try:
        service = build("gmail", "v1", credentials=creds)
        label = (
            service.users()
            .labels()
            .get(userId="me", id="INBOX")
            .execute()
        )
        return label.get("messagesUnread", 0)
    except Exception as e:
        print(f"Gmail API error: {e}")
        return 0
