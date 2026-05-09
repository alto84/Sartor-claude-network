---
name: morning-briefing
description: Unified daily briefing across 5 domains: Calendar, Markets, GPU Business, Nonprofit, Tasks
model: sonnet
---

<!--
Shared preamble for Sartor skills that use the `.tmpl` pipeline.
Substituted into `SKILL.md` files by `scripts/render_skills.py` at the PREAMBLE marker.

Keep this file short. If you find yourself adding content that applies to fewer than
three skills, put it in the skill itself, not here. See README.md in this directory.
-->

## House rules (apply to every skill that uses this preamble)

- Voice and communication rules live in `.claude/rules/communication-style.md` and `CLAUDE.md`. They are already in-context when any skill runs. Do not duplicate them here.
- No autonomous financial, marketplace, or external-communication actions. Present data and proposed actions; confirm before anything irreversible.
- Secrets and PII never appear in output: API keys, SSH private keys, account numbers, SSNs, EIN, children's full names in external-facing drafts.

## GPU server quick reference (for skills that SSH)

- Host: `ssh alton@192.168.1.100`
- vast.ai CLI: `~/.local/bin/vastai`
- Always pass `-o ConnectTimeout=10` on SSH calls that could hang the report.
- Listing end date: 2026-08-24. Machine 52271. Relist before expiry.

## Output conventions

- Daily reports: `reports/daily/{date}-*.md`
- Weekly reports: `reports/weekly/{date}-*.md`
- Financial estimates: `data/financial/`
- Research notes: `data/research/notes/`
- Memory inbox (curator-consumed): `sartor/memory/inbox/rocinante/`


Produce a unified daily briefing covering all 5 domains below. Format as a flowing document with clear section headers. At the very top, collect any ACTION REQUIRED items found across all sections and list them prominently before proceeding to the full briefing.

## Step 0 — Wiki TODOs and Deadlines

Read these files from `sartor/memory/` for urgent items:
- `family/active-todos.md` — family action items and deadlines
- `business/solar-inference.md` — Solar Inference LLC status and blockers
- `business/sante-total.md` — Sante Total nonprofit status
- `business/az-career.md` — external career signals

Extract all `> [!deadline]`, `> [!blocker]`, and `> [!todo]` callouts from these files.

For each callout:
- If it contains a date, check if the date is within 7 days of today
- If it's a [!blocker], always include it regardless of date

Present the top 5 most urgent items (sorted by: blockers first, then nearest deadlines, then general todos) in the ACTION REQUIRED section at the top of the briefing.

Format each as:
- [BLOCKER] or [DEADLINE: Apr 15] or [TODO] — one-line description (source: filename)

## Step 1 — Calendar
- Use Google Calendar tools to fetch today's events across all calendars.
- Identify: today's appointments, any conflicts (overlapping times), school events for the kids.
- Note any logistics needed (pickup, dropoff, prep time).

## Step 2 — Markets
- Check current portfolio positions and overnight moves relevant to holdings.
- Identify any options positions expiring within 7 days.
- Summarize relevant overnight news (earnings, macro events) for held positions.
- Present data only.

## Step 3 — GPU Business
- Run `vastai show machines` on gpuserver1 to get listing status.
- Run `vastai show instances` to see active rentals.
- Calculate earnings from the last 24 hours based on active instance hours × rate.
- Note any downtime or listing issues.
- Flag if utilization has been below 60% for more than 6 hours.

## Step 4 — Nonprofit (Sante Total)
- Read `docs/nonprofit-regulatory-calendar.md` for items due within 14 days.
- Read `docs/nonprofit-pending-items.md` for pending actions.
- Flag any items requiring board action.

## Step 5 — Tasks
- Use Google Calendar task list to find: overdue tasks, tasks due today, high-priority tasks due this week.
- Categorize by domain (GPU/nonprofit/family/financial/research).

## Output Format

```
# Morning Briefing — {date}

## ACTION REQUIRED
- [wiki-sourced blockers, deadlines, and todos from Step 0]
- [additional urgent items found across calendar, markets, GPU, nonprofit, and task domains]

## Calendar
...

## Markets
...

## GPU Business
...

## Nonprofit
...

## Tasks
...
```

Keep each section concise. Bullet points preferred. Flag ACTION REQUIRED items with clear owner and deadline where known.
