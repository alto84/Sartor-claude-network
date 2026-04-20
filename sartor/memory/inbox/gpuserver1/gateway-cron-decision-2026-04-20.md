---
type: report
operation: gateway_cron_retirement
origin: gpuserver1
created: 2026-04-20T01:17:00Z
status: completed
related: [2026-04-19_heartbeat-and-gateway]
---

# gateway_cron.py Decision: RETIRE

## Decision

Retired. Cron entry was already commented out since 2026-04-12. Added retirement notice to the top of the script explaining why. Script left in place for reference.

## Rationale

1. **Already disabled.** The cron entry has been commented out since April 12 with a note: "Failing with JSON decode error."

2. **Role superseded.** The script was a rule-based autonomous task executor (read memory, parse ACTIVE.md tasks, pick one, execute via `claude --print`). This role is now handled by the 3-cron architecture (stale-detect, gather_mirror, vastai-tend) for monitoring, plus interactive Claude Code sessions for task execution.

3. **Persistent failure mode.** The `FATAL: Unhandled exception: Expecting value: line 1 column 1 (char 0)` error occurs because `costs.json` has schema `{"daily_limit": 5.00, "calls": []}` but the script expects `{"daily_limit": ..., "spent_today": ..., "last_reset": ...}`. The `load_costs()` function handles missing fields with defaults, but the `scheduled_executor` import at line 561 (`from scheduled_executor import get_due_tasks`) likely fails or returns data that causes a downstream JSON parse error.

4. **Gateway endpoint dead.** Returns 404 on `GET /`. The gateway API (`gateway.py`) is alive but idle since April 14.

## What was changed

- Added retirement notice to the docstring at the top of `sartor/gateway/gateway_cron.py`
- No cron changes needed (already commented out)
- Script body left intact for architectural reference

## Question for Alton

Should `gateway_cron.py` be deleted entirely, or kept as reference for a future autonomous-loop design? The BM25 search, task parsing, and model-tier routing code has some reuse value if you ever rebuild the autonomous loop.
