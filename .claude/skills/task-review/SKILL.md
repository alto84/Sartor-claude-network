---
name: task-review
description: Review and triage Google Calendar task list by domain, priority, and status
model: sonnet
---

Review the current task list and produce a prioritized, categorized triage for decision-making.

## Step 1 — Fetch All Tasks
Use Google Calendar tools to retrieve all tasks across all task lists.
Collect: task name, due date, status (complete/incomplete), any notes.

## Step 2 — Categorize by Status
Bucket tasks into:
- **Overdue**: past due date, incomplete
- **Due today**: due today, incomplete
- **Due this week**: due within 7 days, incomplete
- **Due next week**: 8–14 days out
- **No due date / backlog**: incomplete with no date set

## Step 3 — Categorize by Domain
Within each status bucket, categorize by domain:
- **GPU**: Vast.ai, server, hardware, hosting business
- **Nonprofit**: Sante Total, regulatory, board, filings
- **Family**: kids, home, personal, travel
- **Financial**: investments, taxes, accounting, LLC
- **Research**: AI, reading, learning projects

## Step 4 — Prioritize
Within each domain, rank tasks by urgency and importance:
- Flag any task that is blocking other work
- Flag tasks with external dependencies or deadlines (court dates, filing deadlines, expiring listings)
- Suggest rescheduling for overdue items with realistic new dates

## Step 5 — Output Format

```
# Task Review — {date}

## OVERDUE ({count})
### GPU
- {task}: was due {date} — suggest reschedule to {date}
### Nonprofit
...

## Due Today ({count})
...

## Due This Week ({count})
...

## Blockers
- {task}: blocking {other task/domain}

## Suggested Reschedules
- {task}: from {old_date} → {suggested_date} (reason)

## Summary
{2–3 sentence overall status narrative}
```
