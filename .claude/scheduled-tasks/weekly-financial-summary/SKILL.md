---
name: scheduled-weekly-financial-summary
description: Friday 6 PM weekly P&L summary across all entities
model: sonnet
---

This is a scheduled task that runs every Friday at 6 PM.

Invoke the weekly-financial-summary skill to produce the weekly P&L report.

Steps:
1. Run the weekly-financial-summary skill covering the 7-day period ending today (Friday).
2. Compare this week's GPU earnings to the prior 4-week average — flag if >20% deviation.
3. Check if any quarterly estimated tax payment is due within 14 days — flag prominently if so.
4. Save output to reports/weekly/{date}-financial-summary.md.
5. Append a one-line entry to data/financial/weekly-earnings-log.csv: `{date},{gpu_earnings},{portfolio_change},{net}`

The Friday timing captures the full trading week and gives the weekend for any needed follow-up.
