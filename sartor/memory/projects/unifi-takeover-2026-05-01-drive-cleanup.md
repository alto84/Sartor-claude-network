---
title: UniFi takeover 2026-05-01 — Google Drive /Sartor-network/ cleanup
created: 2026-04-30
updated: 2026-04-30
status: BLOCKED — gdrive MCP refresh token revoked
parent: [[unifi-takeover-2026-05-01]]
tags: [unifi-takeover, drive-cleanup, blocked, oauth]
---

# UniFi takeover 2026-05-01 — Drive cleanup (BLOCKED)

> [!warning] Status: BLOCKED on OAuth re-auth
> The `@piotr-agier/google-drive-mcp` server returned `invalid_grant` on every API
> call this session. The refresh token in `~/.config/google-drive-mcp/tokens.json`
> has been revoked / expired by Google's OAuth servers, so no Drive API call
> succeeds — including the initial `search` for the folder ID. Cleanup deferred
> until Alton re-runs the OAuth ceremony.

## What I was asked to do

Consolidate `/Sartor-network/` in Alton's Google Drive after a day of iterative
takeover-report drafts. Move stale versions to a new `/Sartor-network/archive/`
subfolder, keep the FINAL (LGP123) report and the latest census prominently in
the parent folder, preserve Aneeta's reader access, delete nothing.

## What actually happened

### Step 0: Auth check
- `mcp__gdrive__authGetStatus` reported: token present, all scopes granted,
  `expiresInSec: -1924` (i.e. token expired ~32 minutes before this session).
- `mcp__gdrive__search` and `mcp__gdrive__authTestFileAccess` both returned
  `invalid_grant`.
- Inspecting `C:\Users\alto8\.config\google-drive-mcp\tokens.json` directly
  showed `"refresh_token_expires_in": 217` — the refresh token itself was
  near-expiry / expired. This is the canonical symptom of a Google OAuth
  consent screen still in **Testing** publishing status, which gives
  refresh tokens a 7-day rotating lifetime instead of the indefinite lifetime
  granted to verified Production apps.
- The fallback `claude.ai Google Drive` MCP connector (proxy at
  `drivemcp.googleapis.com`) also requires Alton to authenticate via
  `/mcp` → "claude.ai Google Drive" before its tools become callable from this
  agent. Same blocker.

### Step 1: No Drive operations were executed
Because every API call failed at the auth layer, nothing was listed, moved,
renamed, or re-shared. The Drive folder is in the same state as it was at the
start of the session — i.e. cluttered with the same set of files the parent
task described.

## Before / After file listing

**Before (claimed by the parent task — not verified by me this session):**
```
/Sartor-network/
  2026-05-01 Network takeover report.md
  2026-05-01 Network takeover report (UPDATED — GLP123 only).md
  2026-05-01 Network takeover report (FINAL — LGP123).md
  unifi-takeover-2026-05-01-network-census.md
  (plus expected: -final-census.md, kidsroom-speaker, unknown-laptop, nest-retirement)
```

**After:** unchanged. Cleanup not performed.

## What was moved where

Nothing. No moves performed. No deletions performed. No renames performed. No
share-permission changes performed.

## Final canonical FILE_ID for Aneeta

**Unknown.** The folder was never listed; I do not have file IDs to record.

## How to unblock

Alton needs to re-authorize the Drive MCP. Two paths:

1. **Re-auth the community MCP** (`@piotr-agier/google-drive-mcp`):
   - Run the package's auth helper from a shell where a browser is reachable:
     ```
     npx @piotr-agier/google-drive-mcp@latest auth
     ```
     (or whatever the package's documented auth command is — check `npm root -g`
     and the package's README; the helper writes a fresh
     `~/.config/google-drive-mcp/tokens.json`).
   - Root cause fix to stop this happening every ~7 days: in the Google Cloud
     Console for project `sartor-drive-mcp`, move the OAuth consent screen
     from **Testing** to **In production / Published**. Test-mode refresh
     tokens expire on a ~7-day rolling window; production tokens do not.
     Verification is not required for self-use; the unverified-app warning
     screen is acceptable since Alton is the only user.

2. **Use the claude.ai Drive connector** instead:
   - In Claude Code, run `/mcp` and select **"claude.ai Google Drive"** to
     start the OAuth flow.
   - That connector does not surface the same `listFolder` / `moveItem` /
     `shareFile` ergonomics as the community MCP, but it does authenticate
     reliably and is sufficient for read + basic write.

## What to do once unblocked

The plan from the parent task is correct as written. Concretely, in this order:

1. `mcp__gdrive__search` — `name = 'Sartor-network' and mimeType =
   'application/vnd.google-apps.folder' and trashed = false` with
   `rawQuery=true` to get the folder ID.
2. `mcp__gdrive__listFolder` against that ID — record every (id, name) pair.
3. `mcp__gdrive__createFolder` with `name='archive'` and `parent=<sartor-network-id>`.
4. `mcp__gdrive__moveItem` for each stale version:
   - `2026-05-01 Network takeover report.md` (initial)
   - `2026-05-01 Network takeover report (UPDATED — GLP123 only).md`
   - the older census if a `-final-census.md` exists
5. Rename the FINAL file via `mcp__gdrive__renameItem` to drop the
   `(FINAL — LGP123)` suffix so it becomes the canonical
   `2026-05-01 Network takeover report.md` at the top level (the parenthetical
   is no longer informative once the older drafts are archived).
6. `mcp__gdrive__listPermissions` on the canonical FINAL file. If
   `aneetasax@gmail.com` is missing, `mcp__gdrive__shareFile` with
   `role='reader'` and `sendNotificationEmail=false`.
7. `mcp__gdrive__listFolder` again to verify the after-state matches:
   parent folder shows ≤5 files plus the `archive/` subfolder.

## Access issues encountered

- `invalid_grant` on every Drive call. Single root cause: refresh token expired
  due to OAuth consent screen still in Testing mode (per the
  `refresh_token_expires_in: 217` field in `tokens.json`).

## Constraints honored

- Nothing deleted.
- No permission level changed.
- No files outside `/Sartor-network/` touched (none touched at all).

## Constraints not satisfied

- All five validation criteria from the parent task remain unmet because no
  Drive operations executed.
