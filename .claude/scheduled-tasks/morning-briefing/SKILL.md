---
name: scheduled-morning-briefing
description: Scheduled daily morning briefing at 6:30 AM — invokes the morning-briefing skill
model: sonnet
---

This is a scheduled task that runs every day at 6:30 AM.

Invoke the morning-briefing skill to produce the full cross-domain daily briefing.

Steps:
1. Run the morning-briefing skill (covers Calendar, Markets, GPU Business, Nonprofit, Tasks).
2. Save the briefing output to reports/daily/{date}-morning-briefing.md.
3. If there are any ACTION REQUIRED items, ensure they are prominent at the top of the output file.

The briefing is for Alton to read at the start of his day. Make it scannable and complete.
