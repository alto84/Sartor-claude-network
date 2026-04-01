---
name: scheduled-market-close-summary
description: Weekday 4:30 PM market close snapshot after US market close
model: sonnet
---

This is a scheduled task that runs on weekdays at 4:30 PM (after US market close at 4:00 PM ET).

Run the market-snapshot skill to capture end-of-day portfolio and options status.

Steps:
1. Invoke the market-snapshot skill.
2. Focus specifically on end-of-day closing prices and final day P&L.
3. Highlight any options that expired today and the result (expired worthless, exercised, ITM at close).
4. Flag any options expiring tomorrow or within 2 trading days.
5. Note any after-hours earnings releases for held positions.
6. Save output to reports/daily/{date}-market-close.md.

Keep the output concise — this is an end-of-day check, not a full analysis.
