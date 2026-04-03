---
name: nonprofit-deadline-scan
description: Scan nonprofit regulatory calendar for upcoming deadlines and generate compliance status
model: sonnet
---

Scan Sante Total's regulatory calendar and pending items for upcoming deadlines and compliance status.

## Step 1 — Read Regulatory Calendar
Read docs/nonprofit-regulatory-calendar.md.
Extract all items and their due dates.

## Step 2 — Categorize by Urgency
Group items into buckets:
- **Overdue**: past due date
- **Due within 7 days**: critical window
- **Due within 14 days**: urgent
- **Due within 30 days**: upcoming

## Step 3 — Cross-Reference Pending Items
Read docs/nonprofit-pending-items.md.
For each deadline item, check if there is a corresponding in-progress entry.
Flag items with no corresponding action in progress.

## Step 4 — Penalty Calculation
For each overdue or at-risk item, calculate actual penalty exposure:

**Form 1065 (Partnership Return):**
- Late filing: $255/partner/month (cap: 12 months = $3,060/partner)
- With 2 partners: $510/month, max $6,120
- Late K-1 distribution: $330/form ($660 for 2 partners)
- Mitigation: Form 7004 extension stops accrual from filing date

**Form 990 (Annual Return — Nonprofit):**
- Small org (gross receipts < $1M): $20/day, max $10,500 per return
- Large org (gross receipts >= $1M): $100/day, max $50,000 per return

**NJ-1065 (State Partnership Return):**
- NJ late filing fee: $100 minimum, up to 5% of tax due per month
- Separate from federal penalties

Always calculate: current exposure (days overdue x rate) and maximum exposure.

## Step 5 — Escalation Tiers
Apply the following escalation logic:

| Tier | Condition | Action |
|------|-----------|--------|
| RED — Immediate | Any item overdue OR due within 7 days | Call CPA same day; flag in report header |
| ORANGE — Urgent | Due within 14 days | Contact CPA within 48 hours |
| YELLOW — Watch | Due within 30 days | Schedule CPA conversation this week |
| GREEN — On track | Due > 30 days, status confirmed | Log and monitor |

If Form 7004 or Form 8868 extension status is unknown, treat as RED until confirmed.

## Step 6 — Board Action Items
Identify any items that require board vote or board awareness before they can proceed.
Note the next board meeting date if available in the calendar.
Flag items where board action is needed and the deadline is within 30 days — these require immediate board notification.

## Step 7 — Compliance Status Summary
Produce a compliance health summary:
- Number of items overdue
- Number in critical window (≤7 days)
- Number on track
- Overall compliance health: GREEN / YELLOW / RED
- Total current penalty exposure in dollars
- Total maximum penalty exposure if unresolved

## Output Format

```
# Nonprofit Compliance Scan — {date}

## Compliance Health: {GREEN/YELLOW/RED}
Current penalty exposure: ${amount} | Maximum exposure: ${amount}

## OVERDUE ({count})
- {item}: due {due_date} ({N} days ago) — {status/notes}
  Penalty accruing: ${rate}/month | Total to date: ${amount} | Max: ${max}

## Critical (≤7 days) ({count})
- {item}: due {due_date} ({N} days remaining) — {status/notes}

## Urgent (8–14 days) ({count})
- {item}: due {due_date} ({N} days remaining) — {status/notes}

## Upcoming (15–30 days) ({count})
- {item}: due {due_date} ({N} days remaining) — {status/notes}

## Board Action Required
- {item}: {why board action needed} — deadline {date}

## Escalation Actions
{Tier-ordered list of required contacts/actions with deadlines}

## CPA Contact
Jonathan Francis — Francis & Company — (914) 488-5727

## Summary
{2-3 sentence status narrative}
```
