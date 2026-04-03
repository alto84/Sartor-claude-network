---
name: market-snapshot
description: Portfolio snapshot with current positions, overnight movers, and options expiry calendar
model: sonnet
---

Produce a portfolio snapshot for decision support. Present data only — no trade recommendations.

## Step 1 — Current Positions
- List all current holdings with ticker, shares/contracts, current price, day change ($ and %).
- Identify overnight movers relevant to holdings (>2% move).
- Note any earnings releases today or this week for held tickers.

## Step 2 — Options Expiry Calendar
- List all open options positions.
- For each: ticker, type (call/put), strike, expiration date, current value, days to expiry.
- Sort by expiration date ascending.
- Flag any expiring within 7 days.
- Flag any that are deep in-the-money or deep out-of-the-money.

## Step 3 — Overnight News
- Summarize macro events overnight relevant to portfolio (Fed commentary, economic data, sector news).
- Flag any specific news about held positions.

## Output Format

```
# Market Snapshot — {date} {time}

## Positions
| Ticker | Qty | Price | Day Chg | Day Chg % |
|--------|-----|-------|---------|-----------|
...

## Options Expiry Calendar
| Ticker | Type | Strike | Expiry | DTE | Value | Status |
|--------|------|--------|--------|-----|-------|--------|
...

## Overnight News
...

## Flags
- [any items needing attention]
```
