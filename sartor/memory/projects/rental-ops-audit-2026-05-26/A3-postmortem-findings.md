---
type: postmortem
phase: A3a (rental-ops-audit-2026-05-26)
status: complete
date: 2026-05-26
---

# A3a Postmortem -- daily-household-health pipeline

## Root cause class

**task-missing.** The Windows Scheduled Task was never registered on Rocinante.

## Evidence

| Check | Result |
|---|---|
| Skill definition exists | YES -- `C:\Users\alto8\Sartor-claude-network\.claude\skills\daily-household-health\SKILL.md` (9996 bytes, mtime 2026-05-20) |
| Scheduled-task definition dir exists | YES -- `C:\Users\alto8\Sartor-claude-network\.claude\scheduled-tasks\daily-household-health\` (created 2026-04-25) |
| Win Scheduled Task registered | NO -- `Get-ScheduledTask -TaskName "*household-health*"` returns 0 results |
| Any health-*.md files in daily dir | NO -- zero files matching `health-*.md` in `sartor\memory\daily\` ever |
| Days between definition and today | ~30 days (Apr 25 -> May 26) |
| CLAUDE.md claims task runs daily 5:30 AM ET | YES -- the doc was written ahead of actual deployment and never reconciled |

## Failure pattern

Classic "definition without deployment." The project bundle that created the skill + scheduled-task definition stopped one step short of running the install. The Sartor scheduled-task installer convention (per other tasks like `Sartor Memory Mirror`, `UniFi Daily Backup`, `Sartor Hours Log`) requires a manual `schtasks /Create` or `Register-ScheduledTask` invocation pointing at the script in `scripts\win-tasks\`. That step was apparently never run for daily-household-health.

This is the same shape as the rtxserver self-steward cron suite noted in CLAUDE.md as "staged but not installed." Project completion drift.

## Adjacent risk this exposes

CLAUDE.md is a forward-looking document. It describes the intended state, not always the deployed state. Any reader (Claude or human) who trusts CLAUDE.md as ground truth will believe alerts are flowing that are not. This is exactly the "documentation lag" pattern noted in `doc-drift-findings.md` and `incident-patterns.md`. Same root cause: nothing forces CLAUDE.md to match deployed reality.

## Implication for A3b

A3b's job is now bounded:
1. **Install** the scheduled task pointing at the skill's executable runner
2. Verify the first run produces `sartor/memory/daily/health-YYYY-MM-DD.md` AND a Google Calendar event on yellow+
3. Get Alton's chat-greenlight for the Calendar account touch (per REVIEW-002 patch P5)
4. Get Alton's chat-confirmation of READ-PATH within 24h (per A3c)

No build is required — the SKILL.md already specifies the logic. The work is purely deploy + verify.

## Implication for B5

B5 (weekly meta-check that Sartor scheduled tasks remain `Ready`) catches future instances of this pattern. Should be extended to also flag scheduled-task definitions in `.claude/scheduled-tasks/` that have NO corresponding registered Windows task — "definition without deployment" as a first-class drift category.

## Done

A3a complete. Hand off to A3b in next session.
