---
id: gpuserver1-2026-04-12T01-42-00Z-alignment-report
origin: gpuserver1
author: claude-gpuserver1
created: 2026-04-12T01:42:00Z
target: inbox-only
operation: report
priority: p2
type: event
---

# gpuserver1 Inbox Writer Schema Compliance Report

Audit performed 2026-04-12 against CURATOR-BEHAVIOR.md schema contract (v1.0).

## Executive Summary

**Compliant writers:** 0 / 3
**Non-compliant writers:** 3 / 3
**Critical gaps:** Missing required frontmatter fields (`id`, `origin`, `author`, `created`, `target`, `operation`, `priority`)

All three inbox writers (`run_monitor.sh`, `run_pricing.sh`, `daily_summary.py`) produce output that does NOT conform to the curator schema contract. They write markdown with frontmatter, but use ad-hoc schemas predating the OPERATING-AGREEMENT.

## Writer-by-Writer Audit

### 1. `run_monitor.sh` (monitoring sweep)

**Output path:** `sartor/memory/inbox/gpuserver1/monitoring/{YYYY-MM-DD}_{HHMM}_monitor.md`

**Current frontmatter schema:**
```yaml
type: inbox
source: gpuserver1
category: monitoring
timestamp: <ISO-8601 UTC>
tags: [domain/gpu-business, source/automated]
operation: append
target: gpuserver1-monitoring-log.md
```

**CURATOR-BEHAVIOR.md required fields:**
- `id` — ❌ MISSING
- `origin` — ❌ MISSING (has `source` instead)
- `author` — ❌ MISSING
- `created` — ❌ MISSING (has `timestamp` instead)
- `target` — ✅ PRESENT
- `operation` — ✅ PRESENT
- `priority` — ❌ MISSING

**Gap summary:**
- `source` should be `origin`
- `timestamp` should be `created`
- Needs `id` field (e.g., `gpuserver1-{timestamp}-monitoring-sweep`)
- Needs `author` field (e.g., `run_monitor.sh`)
- Needs `priority` field (e.g., `p2` for routine, `p1` if anomalies detected)
- Has extra fields `tags`, `category` not in schema (but optional fields are allowed)

**Fix:** Update `monitor_brief.md` template to instruct Claude to use compliant frontmatter.

---

### 2. `run_pricing.sh` (pricing weekly)

**Output path:** `sartor/memory/inbox/gpuserver1/pricing/{YYYY-MM-DD}_pricing.md`

**Current frontmatter schema:**
```yaml
type: routine
category: pricing
severity: routine|event|urgent
source: gpuserver1
timestamp: {ISO-8601}
```

**CURATOR-BEHAVIOR.md required fields:**
- `id` — ❌ MISSING
- `origin` — ❌ MISSING (has `source`)
- `author` — ❌ MISSING
- `created` — ❌ MISSING (has `timestamp`)
- `target` — ❌ MISSING
- `operation` — ❌ MISSING
- `priority` — ❌ MISSING (has `severity` instead, but values don't match)

**Gap summary:**
- `source` → `origin`
- `timestamp` → `created`
- Needs `id` (e.g., `gpuserver1-{timestamp}-pricing-review`)
- Needs `author` (e.g., `run_pricing.sh`)
- Needs `target` (e.g., `sartor/memory/machines/gpuserver1/pricing-history.md` or `inbox-only`)
- Needs `operation` (e.g., `report` or `propose` if awaiting approval)
- Needs `priority` (map `severity` → `priority`: routine=p2, event=p2, urgent=p1)

**Fix:** Update `pricing_brief.md` template and the Python schema-prepending snippet in the brief.

---

### 3. `daily_summary.py` (power reports)

**Output path:** `sartor/memory/inbox/gpuserver1/power/{YYYY-MM-DD}_power.md`

**Current frontmatter schema:**
```yaml
type: inbox
source: gpuserver1
category: power
timestamp: {ISO-8601}
date: {YYYY-MM-DD}
updated: {ISO-8601}
```

**CURATOR-BEHAVIOR.md required fields:**
- `id` — ❌ MISSING
- `origin` — ❌ MISSING (has `source`)
- `author` — ❌ MISSING
- `created` — ❌ MISSING (has `timestamp` and `updated`)
- `target` — ❌ MISSING
- `operation` — ❌ MISSING
- `priority` — ❌ MISSING

**Gap summary:**
- `source` → `origin`
- `timestamp` → `created`
- Needs `id` (e.g., `gpuserver1-{timestamp}-power-daily`)
- Needs `author` (e.g., `daily_summary.py`)
- Needs `target` (e.g., `sartor/memory/machines/gpuserver1/power-log.md` or `inbox-only`)
- Needs `operation` (e.g., `report`)
- Needs `priority` (e.g., `p3` for routine telemetry)
- Extra field `date` is fine (optional), `updated` is redundant with `created`

**Fix:** Update `daily_summary.py` lines 157-164 to emit compliant frontmatter.

---

## Priority Ranking of Fixes

### P0 (blocking curator processing)
None. The curator will FLAG all entries as schema-invalid and move them to `_flagged/`. But this is recoverable — the entries are preserved and can be corrected.

### P1 (high priority, next session)
1. **Update `monitor_brief.md` frontmatter template** — monitoring runs every 2h; highest volume of entries.
2. **Update `pricing_brief.md` frontmatter template** — runs weekly; lower volume but higher business impact (pricing decisions).
3. **Update `daily_summary.py` write_inbox() function** — runs daily; routine telemetry.

### P2 (follow-up)
4. **Audit and update `update_heartbeat.sh`** — heartbeat file schema not yet checked.
5. **Add `id` generation helper** to all three writers (UUID or timestamp-based).

---

## Schema Ambiguities Needing Clarification

1. **`type` field overlap:** CURATOR-BEHAVIOR.md says `type` is optional and defaults to `event` if missing. But it also defines `type: routine` vs `type: event` as distinct categories for aggregation. The monitoring brief currently uses `type: inbox` which is not a valid value per the schema. **Clarification needed:** Is `type` the entry classification (`routine` | `event`) or something else?

2. **`category` field status:** All three writers use a `category` field (`monitoring`, `pricing`, `power`). CURATOR-BEHAVIOR.md does not list `category` as required or optional. **Clarification needed:** Is `category` allowed as an optional field? If so, should it be documented in the schema contract?

3. **`target` semantics for informational reports:** Monitoring sweeps and power summaries are informational reports, not canonical-file updates. Should `target` be `inbox-only` or should we create a canonical aggregation target like `sartor/memory/machines/gpuserver1/monitoring-log.md`?

4. **Aggregation behavior for `type: routine`:** CURATOR-BEHAVIOR.md §Entry classification says routine entries aggregate into daily rollups. But monitoring sweeps run every 2h (12 per day) and are already event-driven (each one is distinct, not aggregatable). Should monitoring be `type: event` even though it's a recurring cron job?

---

## Proposed Fix Checklist (for follow-up session)

- [ ] Update `~/sartor-monitoring/monitor_brief.md` frontmatter template to schema-compliant version
- [ ] Update `~/sartor-pricing/pricing_brief.md` frontmatter template to schema-compliant version
- [ ] Update `~/sartor-power/bin/daily_summary.py` write_inbox() function to schema-compliant version
- [ ] Audit `~/update_heartbeat.sh` and ensure heartbeat file is schema-compliant
- [ ] Test one full cycle (monitoring, pricing, power) and verify curator does not flag entries
- [ ] Backfill or delete existing non-compliant entries in `inbox/gpuserver1/` subdirs (monitoring, pricing, power) to avoid curator flagging them

---

## Verification Command

After fixes are applied, verify with:

```bash
# Check latest monitoring entry
head -20 ~/Sartor-claude-network/sartor/memory/inbox/gpuserver1/monitoring/$(ls -t ~/Sartor-claude-network/sartor/memory/inbox/gpuserver1/monitoring/ | head -1)

# Check latest power entry
head -20 ~/Sartor-claude-network/sartor/memory/inbox/gpuserver1/power/$(ls -t ~/Sartor-claude-network/sartor/memory/inbox/gpuserver1/power/ | head -1)

# Run a test curator pass and check for flagged entries
ls ~/Sartor-claude-network/sartor/memory/inbox/gpuserver1/_flagged/
```

---

## History

- 2026-04-12: Initial compliance audit against CURATOR-BEHAVIOR.md v1.0. All three inbox writers found non-compliant.
