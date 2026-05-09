---
name: market-snapshot
description: Portfolio snapshot with current positions, overnight movers, and options expiry calendar
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


Produce a portfolio snapshot for decision support.

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
