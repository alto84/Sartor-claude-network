---
name: gpu-pricing-optimizer
description: Competitive pricing scan for RTX 5090 GPU listing with adjustment recommendations
model: sonnet
---

Analyze current GPU listing pricing against the market and provide reasoned adjustment recommendations. Never auto-modify listings — recommendations only.

## Step 1 — Fetch Market Data
Run: `ssh alton@192.168.1.100 "~/.local/bin/vastai search offers --type on-demand --gpu-name RTX_5090"`
Collect all RTX 5090 listings: price, reliability score, disk space, bandwidth, location, current status (rented/available).

## Step 2 — Current Listing Status
Run: `ssh alton@192.168.1.100 "~/.local/bin/vastai show machines"`
Note current ask price, min bid, and listing end date for Machine 52271.

## Step 3 — Competitive Analysis
- Calculate: mean, median, p25, p75 ask prices for RTX 5090 class.
- Position current listing within the distribution.
- Compare our machine's specs (RTX 5090, bandwidth, reliability) to comparables.
- Note how many listings are currently rented vs available at various price points.

## Step 4 — Utilization Pattern Analysis
Run: `ssh alton@192.168.1.100 "~/.local/bin/vastai show earnings"` for recent history.
Identify: time-of-day patterns, day-of-week patterns, correlation between price and fill rate.

## Step 5 — Demand Trends
Note: market saturation, new RTX 5090 listings entering market, any platform-wide demand signals.

## Step 6 — Recommendations
Based on the analysis, provide pricing recommendations with reasoning:
- Recommended ask price (if change warranted)
- Recommended min bid
- Rationale (e.g., "currently at p75, market softened, recommend moving to p50")
- Expected impact on utilization
- If no change warranted, explain why

Format:
```
# GPU Pricing Analysis — {date}

## Market Summary
- RTX 5090 listings: {count}
- Price range: ${min} - ${max}
- Median: ${median} | p25: ${p25} | p75: ${p75}
- Listings currently rented: {count}/{total}

## Our Position
- Current ask: ${price} ({percentile} percentile)
- Spec comparison vs market: [summary]

## Utilization Pattern
...

## Recommendation
- Action: [ADJUST / NO CHANGE]
- If adjust: New ask: ${price}, New min bid: ${price}
- Reasoning: ...
- To apply: `vastai list machine 52271 -g {price} -b {bid} -s 0.10 -m 1 -e "08/24/2026"`
  (COPY ONLY — do not run automatically)
```
