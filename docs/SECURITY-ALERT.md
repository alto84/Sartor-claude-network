# Security Alert: Credential Files in Downloads

The following credential files are on this machine outside the repo. They are not committed to git, but their location in Downloads makes accidental exposure possible.

## Files to Review

**`C:\Users\alto8\Downloads\december-2025-memory-mcp-firebase-adminsdk-fbsvc-c7dc5bb9aa.json`**
- Type: Firebase service account key
- Risk: Full access to Firebase project if leaked
- Action: Move to a secure location (e.g., `~/.credentials/`) or delete if the Firebase project is no longer in use

**`C:\Users\alto8\Downloads\client_secret_226564075266-97s0cas9...json`**
- Type: Google OAuth client secret
- Risk: OAuth impersonation if leaked
- Action: Move to `~/.credentials/` or delete and revoke in Google Cloud Console if unused

## What These Are NOT

These files are NOT in the git repo. The .gitignore already excludes `credentials.json` and `*.pem`. This is a heads-up about files sitting in Downloads.

## Recommended Actions

1. Move both files to `C:\Users\alto8\.credentials\` (create if needed) and restrict permissions.
2. If either service is no longer used, revoke the credentials in the respective console (Firebase Console / Google Cloud Console) and delete the files.
3. Never place credential files in Downloads, Desktop, or any path that might sync to cloud storage.
