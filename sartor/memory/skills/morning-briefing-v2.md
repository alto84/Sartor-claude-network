---
type: skill_documentation
entity: morning-briefing-v2
updated: 2026-04-12
status: active
version: 0.1
related: [gmail-scan, curator-pass, conversation-extract, staleness]
---

# Morning Briefing v2

Replacement for the original morning-briefing skill that was dispatched via SartorHeartbeat (now deprecated). v2 runs as a standalone Python module with no LLM dependency for the offline pass, producing a structured daily briefing.

## Architecture

Two new Python modules in `sartor/`:

### sartor/gmail_scan.py
- Scans Gmail for actionable items using google-api-python-client
- Classifies emails as actionable / informational / spam-noise
- Detects: reply needed, deadlines, payments due, appointments, school events, urgency
- Writes curator-compatible inbox entries to `sartor/memory/inbox/rocinante/gmail/`
- Tracks last-scan timestamp in `sartor/memory/.meta/gmail-last-scan.json`
- Scheduled every 4h: 06:00, 10:00, 14:00, 18:00, 22:00
- CLI: `python -m sartor.gmail_scan [--since HOURS] [--dry-run] [-v]`

### sartor/morning_briefing.py
- Generates 8-section daily briefing
- Scheduled daily at 06:30 (after the 06:00 gmail scan)
- CLI: `python -m sartor.morning_briefing [--dry-run] [-v]`
- Output: `sartor/memory/inbox/rocinante/morning-briefing/YYYY-MM-DD.md`

## Briefing Sections

1. **Date + Weather** -- placeholder (weather lookup not implemented)
2. **Overnight Curator Summary** -- reads last 2 entries from `curator-log.jsonl`
3. **Gmail Highlights** -- top 5 actionable emails from the 06:00 scan
4. **Partially Completed To-Dos** -- the key feature:
   - Mines `tasks/ACTIVE.md`, `family/active-todos.md`, `IMPROVEMENT-QUEUE.md`
   - Scans last 3 days of session JSONLs for task-shaped utterances
   - Checks inbox for undrained p0/p1 entries
   - Completion detection via `tasks/COMPLETED.md` and conversation signals
   - Staleness marking at >7 days without activity
   - Dedup via `briefing-surfaced-todos.json` (3-day cooldown)
5. **Calendar Today** -- requires MCP runtime (placeholder in batch mode)
6. **System Health** -- heartbeat log status, gpuserver1/MERIDIAN checks
7. **Memory System Health** -- staleness tier counts, extractor stats, receipts
8. **Improvement Proposals** -- top 3 from `IMPROVEMENT-QUEUE.md`

## Todo Resurfacing Logic

The conversation-miner proved that imperative tasks from early-morning prompts are the #1 loss pattern. The resurfacing system:

- **Source mining**: task-shaped regex patterns (TODO, need to, should, remind me, don't forget, have to, must, make sure)
- **Completion detection**: checks for "done", "finished", "completed", "paid", "sent" signals near the task text
- **Staleness**: items >7 days old with no activity flagged as "stale todo -- still relevant?"
- **Dedup**: tracks surfaced items in `.meta/briefing-surfaced-todos.json`; re-surfaces only after 3+ day cooldown or new activity

## Scheduled Tasks

| Task | Windows Task Name | Schedule |
|---|---|---|
| Gmail scan | SartorGmailScan | 06:00, 10:00, 14:00, 18:00, 22:00 |
| Morning briefing | SartorMorningBriefing | 06:30 daily |

## Files Created

- `sartor/gmail_scan.py` -- Gmail scanner module
- `sartor/morning_briefing.py` -- Morning briefing generator
- `sartor/tests/test_gmail_scan.py` -- 24 tests
- `sartor/tests/test_morning_briefing.py` -- 23 tests
- `scripts/gmail-scan-run.cmd` -- Task wrapper
- `scripts/gmail-scan-task.xml` -- Task definition
- `scripts/register-gmail-scan.ps1` -- Registration script
- `scripts/morning-briefing-run.cmd` -- Task wrapper
- `scripts/morning-briefing-task.xml` -- Task definition
- `scripts/register-morning-briefing.ps1` -- Registration script

## MCP Augmentation

The batch-mode briefing covers sections 1-4, 6-8 without any LLM or MCP dependency. For full coverage (especially calendar data and live system checks), run `/morning` inside Claude Code which invokes the morning-briefing skill with MCP access.
