---
type: fix-report
id: curator-fixes-2026-04-13-schema
origin: rocinante
created: 2026-04-13
updated: 2026-04-13
target: IMPROVEMENT-QUEUE.md
operation: report
priority: p2
---

# Curator Schema Fixes — 2026-04-13

Addresses items `inbox_schema_gaps` and `data_dir_last_verified_backfill` from IMPROVEMENT-QUEUE.md.

## Task 1: Inbox schema gaps

### Files fixed (4 total)

**gpuserver1 inbox:**

1. `sartor/memory/inbox/gpuserver1/cron-cleanup/2026-04-12_cron-cleanup.md`
   - Added: `id: gpuserver1-2026-04-12-cron-cleanup`
   - Added: `origin: gpuserver1`
   - Fixed: `target: rocinante` was not a valid memory file; changed to `target: MACHINES.md`

2. `sartor/memory/inbox/gpuserver1/monitoring/2026-04-11_0338_monitor.md`
   - Added: `id: gpuserver1-2026-04-11-0338-monitor`
   - Added: `origin: gpuserver1` (was using `source` instead)
   - Added: `created: 2026-04-11T03:38:43Z` (was using `timestamp` instead)

**rocinante inbox:**

3. `sartor/memory/inbox/rocinante/purchases/2026-04-12-workstation-purchase.md`
   - Added: `origin: rocinante` (was using `source` instead)
   - Added: `operation: append`

4. `sartor/memory/inbox/rocinante/wohelo-payment-2026-04-13.md`
   - Added: `target: FAMILY.md`
   - Added: `operation: append`

### Curator code fix

`sartor/curator_pass.py`: Added `RESERVED_FILES = frozenset({"_inbox-only-log.md", "_unrouted-log.md"})` and updated `_iter_entry_files()` to skip these curator-generated stub files during inbox walks. Previously, the curator's own output files (`_inbox-only-log.md`) were being picked up as inbox entries and flagged for missing schema fields on every run, creating a self-referential flag loop.

### Verification

`python -m sartor.curator_pass --dry-run -v` result after fixes:
- discovered: 4 files
- valid: 4
- flagged: 0
- drained (would): 4

## Task 2: data/ frontmatter backfill

### SYSTEM-STATE.md

- Added frontmatter block: `type`, `updated: 2026-04-13`, `last_verified: 2026-04-13`, `volatility: high`
- Corrected stale content: removed active-state language for observers and self-improvement-loop (both last recorded 2026-04-03); added staleness notes
- gateway_cron.py referenced as failing in the monitoring entry was addressed in the 2026-04-12 cron cleanup

### IMPROVEMENT-QUEUE.md

- Added to existing frontmatter: `last_verified: 2026-04-13`, `volatility: medium`
- Updated `updated` field from 2026-04-12 to 2026-04-13

## Issues found

The `_inbox-only-log.md` curator stubs were silently being re-evaluated as new inbox entries on every pass, producing persistent false-positive schema flags. This was not one of the original 2 flagged entries reported in the improvement queue -- the queue item counted the clearly peer-written entries (cron-cleanup and monitoring). The workstation purchase and wohelo payment files were additional gaps discovered during the full audit.

## History

- 2026-04-13: Created. Fixes applied and verified with dry-run.
