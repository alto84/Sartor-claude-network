---
name: weekly-financial-summary
description: Weekly P&L summary across GPU hosting, investment portfolio, nonprofit, and tax liability
model: sonnet
---

Produce a weekly financial summary across all entities and accounts. Cover the 7-day period ending today.

## Step 1 — GPU Hosting Earnings
Run: `ssh alton@192.168.1.100 "~/.local/bin/vastai show earnings"`
Calculate:
- Total hours rented this week
- Gross earnings this week
- Average daily earnings
- Expenses (electricity estimate, any platform fees)
- Net earnings this week
- Running monthly total

## Step 2 — Investment Portfolio
- Portfolio value at week start vs week end
- Net change ($  and %)
- Realized gains/losses this week (any sales or options expirations)
- Unrealized P&L change
- Dividends received

## Step 3 — Nonprofit Financial Status
Read docs/nonprofit-pending-items.md and any financial docs for Sante Total.
Note: any grants received, expenses incurred, compliance costs, upcoming financial obligations.

## Step 4 — Tax Liability Tracking
Read data/financial/tax-estimates/ for most recent estimate.
Update running totals:
- Estimated federal liability YTD
- NJ state liability YTD
- Quarterly payments made YTD
- Next payment due date and amount

## Step 5 — Weekly Summary Output
Save to: `reports/weekly/{date}-financial-summary.md`

Format:
```
# Weekly Financial Summary — week ending {date}

## GPU Hosting
- Earnings: ${amount} (${daily_avg}/day avg)
- Net after expenses: ${amount}
- Monthly running total: ${amount}

## Investment Portfolio
- Value: ${amount} (was ${amount} last week)
- Net change: ${amount} ({pct}%)
- Realized this week: ${amount}

## Nonprofit (Sante Total)
- Status: [summary]
- Notable: [any transactions or obligations]

## Tax Liability Tracker
- Federal estimated: ${amount}
- NJ estimated: ${amount}
- Paid YTD: ${amount}
- Next payment: ${amount} due {date}

## Flags
- [any items needing attention]
```
