---
name: todo-sync
description: Sync wiki callouts (deadlines, blockers, todos) to Google Tasks. Greps sartor/memory for > [!deadline], > [!blocker], > [!todo] callouts, compares against existing Google Calendar tasks, and creates missing ones. Flags overdue deadlines. Run nightly after wiki-reindex.
model: sonnet
---

# TODO Sync — Wiki Callouts to Google Tasks

Nightly task that bridges the wiki's callout system with Google Calendar's task manager. Every `> [!deadline]`, `> [!blocker]`, and `> [!todo]` callout in the wiki becomes a trackable task in Google Calendar.

## Why this exists

The wiki has structured callouts for deadlines, blockers, and action items. But callouts in markdown are invisible to Google Calendar, phone notifications, and other tools Alton uses to manage his day. This task makes them visible by creating corresponding Google Tasks entries.

## Context injection (read first)

- `data/wiki-state.md` — current wiki health
- `data/todo-sync-state.md` — last sync state (which callouts have already been synced)

## Phase 1: EXTRACT callouts from the wiki

Scan these files for callouts (in priority order):

1. `sartor/memory/family/active-todos.md`
2. `sartor/memory/TAXES.md`
3. `sartor/memory/business/solar-inference.md`
4. `sartor/memory/business/sante-total.md`
5. `sartor/memory/business/az-career.md`
6. `sartor/memory/family/disney-july-2026.md`
7. Any other file under `sartor/memory/` with `> [!deadline]` or `> [!blocker]` callouts

For each callout found, extract:
- **Type:** deadline, blocker, todo, decision
- **Date:** ISO date if present (e.g., `> [!deadline] 2026-04-15`)
- **Summary:** the text following the callout marker (first line)
- **Source file:** which wiki page it came from
- **Unique ID:** hash of (source_file + callout_type + summary) for dedup

## Phase 2: COMPARE against existing Google Tasks

Use the Google Calendar MCP to list tasks from the "Alton's Tasks" calendar:
- Calendar ID: `42418d485f3839dfbc255305ef9839b030193d1a875283cb6884694db7bb5c4c@group.calendar.google.com`

For each extracted callout:
- Search for an existing task with a matching summary (fuzzy match on first 50 chars)
- If found: skip (already synced)
- If NOT found: mark for creation

## Phase 3: CREATE missing tasks

For each callout not already in Google Tasks, create a task event:

- **Summary:** `[WIKI] {callout_type}: {summary}` (prefix with [WIKI] so it's clearly auto-generated)
- **Date:** if the callout has a date, set the task due date to that date. If no date, set it to 7 days from now as a review reminder.
- **Description:** `Source: {source_file}\nType: {callout_type}\nSynced: {today}`

Use the Google Calendar MCP `gcal_create_event` tool with:
- `calendarId`: Alton's Tasks calendar ID
- `summary`: the prefixed summary
- `start`/`end`: the due date (all-day event)

## Phase 4: FLAG overdue items

For each `> [!deadline]` callout where the date has PASSED:
- Check if the corresponding task exists and is marked done
- If the task exists but is NOT done: flag it in the cycle report as OVERDUE
- If the task doesn't exist (was never synced): create it AND flag as OVERDUE

Write overdue items to `data/todo-sync-overdue.md` for the morning briefing to pick up.

## Phase 5: WRITE sync state

Write `data/todo-sync-state.md` (bounded, max 2000 chars) with:
- Timestamp of last sync
- Count of callouts found, already synced, newly created, overdue
- Top 5 overdue items (if any)
- Next sync scheduled

## Constraints

- **Never modify wiki files.** This task is read-only for the wiki. It only CREATES tasks in Google Calendar.
- **Never delete tasks.** If a callout is removed from the wiki, the corresponding task stays in Google Calendar (the user may have notes on it). Orphaned tasks are the user's responsibility to clean up.
- **Prefix all created tasks with [WIKI]** so the user can distinguish auto-created tasks from manual ones.
- **Rate limit:** max 10 new tasks per sync cycle. If more than 10 are pending, create the 10 most urgent and note the remainder in the cycle report.
- **Dedup is critical.** Never create a duplicate task. Use the unique ID (hash of source + type + summary) stored in `data/todo-sync-state.md` to track what's been synced.

## Schedule

Run nightly AFTER `wiki-reindex` (which refreshes the indexes) and BEFORE `morning-briefing` (which reads the overdue file).

Suggested time: 11:30 PM ET (wiki-reindex runs at 11:00 PM, morning-briefing runs at 6:30 AM).

## Cycle report

Append to `data/evolve-log/{date}-todo-sync.md`:

```markdown
## [YYYY-MM-DD HH:MM] todo-sync

callouts_found: N
already_synced: N
newly_created: N
overdue: N

new_tasks:
- [WIKI] deadline: Personal 1040 filing (2026-04-15) — from TAXES.md
- [WIKI] blocker: Stuck email draft Vayu physical — from family/active-todos.md

overdue:
- [WIKI] deadline: Wohelo deposit $500 (2026-04-10) — from family/active-todos.md — OVERDUE BY 0 DAYS
```

## Related

- [[MEMORY-CONVENTIONS]] — callout syntax definition
- [[LLM-WIKI-ARCHITECTURE]] — how callouts fit in the wiki
- `wiki-reindex` — runs before this task, refreshes indexes
- `morning-briefing` — runs after this task, reads overdue items
