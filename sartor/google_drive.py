#!/usr/bin/env python3
"""Google Drive integration for Sartor - read-only file listing."""

try:
    from googleapiclient.discovery import build
    _GDRIVE_AVAILABLE = True
except ImportError:
    _GDRIVE_AVAILABLE = False

from google_auth import get_credentials


def get_recent_files(count=10):
    """Get recently modified files from Google Drive.

    Args:
        count: Number of files to retrieve (default 10).

    Returns:
        list[dict]: Each dict has keys: name, mimeType, modifiedTime,
                    webViewLink, size.
        Returns empty list if auth not configured or on error.
    """
    if not _GDRIVE_AVAILABLE:
        return []

    creds = get_credentials()
    if not creds:
        return []

    try:
        service = build("drive", "v3", credentials=creds)
        results = (
            service.files()
            .list(
                orderBy="modifiedTime desc",
                pageSize=count,
                fields="files(id,name,mimeType,modifiedTime,webViewLink,size)",
            )
            .execute()
        )

        files = []
        for f in results.get("files", []):
            files.append({
                "name": f.get("name", ""),
                "mimeType": f.get("mimeType", ""),
                "modifiedTime": f.get("modifiedTime", ""),
                "webViewLink": f.get("webViewLink", ""),
                "size": f.get("size", ""),
            })
        return files
    except Exception as e:
        print(f"Drive API error: {e}")
        return []
