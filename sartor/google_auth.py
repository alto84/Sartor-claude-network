#!/usr/bin/env python3
"""Google OAuth2 authentication for Sartor.

Handles initial browser-based authorization and headless token refresh.
Token stored at ~/.sartor/credentials/token.json
Client secrets at ~/.sartor/credentials/client_secret.json
"""
import os
import stat
from pathlib import Path

TOKEN_PATH = Path.home() / ".sartor" / "credentials" / "token.json"
CLIENT_SECRETS_PATH = Path.home() / ".sartor" / "credentials" / "client_secret.json"

SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
]

try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import InstalledAppFlow
    _GOOGLE_LIBS_AVAILABLE = True
except ImportError:
    _GOOGLE_LIBS_AVAILABLE = False


def _check_libs():
    if not _GOOGLE_LIBS_AVAILABLE:
        print(
            "Google API libraries not installed. Run:\n"
            "  pip install google-api-python-client google-auth google-auth-oauthlib"
        )
        return False
    return True


def get_credentials():
    """Load credentials from token.json, refreshing if expired.

    Returns:
        google.oauth2.credentials.Credentials or None if no token exists.
    """
    if not _check_libs():
        return None

    if not TOKEN_PATH.exists():
        return None

    creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")
    return creds if creds and creds.valid else None


def authorize_interactive():
    """Run browser-based OAuth2 consent flow and save token.

    Returns:
        google.oauth2.credentials.Credentials
    """
    if not _check_libs():
        return None

    if not CLIENT_SECRETS_PATH.exists():
        print(f"Client secrets not found at {CLIENT_SECRETS_PATH}")
        print("Download from Google Cloud Console -> APIs & Services -> Credentials")
        return None

    flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRETS_PATH), SCOPES)
    creds = flow.run_local_server(port=0)

    TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")
    # chmod 600 - owner read/write only
    if os.name != "nt":
        os.chmod(TOKEN_PATH, stat.S_IRUSR | stat.S_IWUSR)
    return creds


def is_authorized():
    """Check if valid credentials exist.

    Returns:
        bool
    """
    if not _GOOGLE_LIBS_AVAILABLE:
        return False
    return get_credentials() is not None
