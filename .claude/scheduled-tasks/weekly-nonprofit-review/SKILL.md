---
name: scheduled-weekly-nonprofit-review
description: Sunday 9 AM weekly nonprofit compliance and deadline review
model: sonnet
---

This is a scheduled task that runs every Sunday at 9 AM.

Run a full nonprofit status review for Sante Total to start the week prepared.

Steps:
1. Invoke the nonprofit-deadline-scan skill — scan for all deadlines within 30 days.
2. Check docs/nonprofit-pending-items.md for items that should have been completed last week but aren't marked done.
3. Note the upcoming week's nonprofit-related calendar events (board calls, meetings, filing prep).
4. Identify any items that will become critical (≤7 days) during the coming week.
5. Save output to reports/weekly/{date}-nonprofit-review.md.

Flag any item that requires action before next Sunday — these need to be on the week's task list.
