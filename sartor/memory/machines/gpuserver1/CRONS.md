---
type: machine_operations
entity: gpuserver1-crons
updated: 2026-04-12
updated_by: cron-cleaner (memory-system-v2 EX-11)
status: active
version: 0.3
last_verified: 2026-04-12
related: [gpuserver1-MISSION, OPERATING-AGREEMENT, rental-operations]
---

# gpuserver1 Cron Documentation v0.3

Three active cron jobs as of 2026-04-12 (EX-5). This is the target state per master-plan §5 (hard cap: 6 across both machines; gpuserver1 holds 3 of the 6 slots). Five previously active jobs from v0.2 were superseded by this triplet.

This document is authoritative for all cron operations on gpuserver1. Last verified: 2026-04-12 (EX-5 deployment).

---

## Operational Rhythm (Active Jobs Only)

- **Every 30 minutes**: vastai-tend (state-change-only, writes to inbox on change)
- **Every hour**: stale-detect (vastai/GPU/disk/heartbeat freshness check)
- **Every 4 hours**: gather_mirror (git pull + status snapshot to inbox)

**Total active jobs**: 3
**All jobs use inbox pattern**: writes go to `sartor/memory/inbox/gpuserver1/` subdirectories
**No direct repo writes**: all output flows through curator drain on Rocinante

---

## Active Cron Jobs

### 1. gather_mirror.sh (P0 ACTIVE — rewritten EX-5)
**Schedule**: `0 */4 * * *` (every 4 hours)
**Path**: `/home/alton/gather_mirror.sh`
**Log**: `/home/alton/generated/cron-logs/gather_mirror.log`
**Purpose**: Git pull from origin main (with proper stash/pop handling), writes status JSON snapshot to `inbox/gpuserver1/status/`, updates `sartor-heartbeat.json`
**Installed**: 2026-04-03 (original); rewritten 2026-04-12 (EX-5)
**Key fixes in v0.3 rewrite**:
  - Stash push uses named marker (`gather_mirror-<epoch>`) and pops by name, not `stash pop` blind
  - On pull failure, writes WARNING inbox entry to `inbox/gpuserver1/alerts/` and exits 2
  - Logs to `~/generated/cron-logs/` (guaranteed via `mkdir -p`); old `~/sartor-monitoring/logs/` path abandoned
  - Status snapshot includes vastai machines output, GPU temp, disk %, written as JSON to `inbox/gpuserver1/status/YYYY-MM-DDTHHmmZ.json`
  - Heartbeat written to `~/sartor-heartbeat.json` (picked up by stale-detect)
**State cache**: `~/sartor-heartbeat.json`
**Inbox writes**: `sartor/memory/inbox/gpuserver1/status/` and `inbox/gpuserver1/alerts/` (on failure only)

---

### 2. stale-detect.sh (NEW — EX-5)
**Schedule**: `0 * * * *` (hourly)
**Path**: `/home/alton/stale-detect.sh`
**Log**: `/home/alton/generated/cron-logs/stale-detect.log`
**Purpose**: Scan gpuserver1-authoritative entities for staleness signals. Checks: vastai reachability, GPU temp (>80C alert), disk usage on /home (>85% alert), gather_mirror heartbeat freshness (>5h stale)
**Inbox writes**: `sartor/memory/inbox/gpuserver1/_stale-alerts/YYYY-MM-DD_HH.md` (one per hour slot, overwrite on re-run; no entry if all clear)
**Debounce**: one file per hour slot. No duplicate entries within the same hour.
**Supercedes**: run_monitor.sh (formerly every 2h), dashboard-healthcheck.sh (formerly daily)

---

### 3. vastai-tend.sh (RESURRECTED — EX-5)
**Schedule**: `*/30 * * * *` (every 30 minutes)
**Path**: `/home/alton/vastai-tend.sh`
**Log**: `/home/alton/generated/cron-logs/vastai-tend.log`
**Purpose**: State-change-only vastai monitoring. Checks machine listed/rented status. Writes inbox entry only when state transitions (listed/unlisted, rented/unrented). On first run, establishes baseline and writes one entry.
**State cache**: `/tmp/vastai-tend-state.json` (ephemeral, resets on reboot)
**Inbox writes**: `sartor/memory/inbox/gpuserver1/_vastai/YYYY-MM-DDTHHmmZ-state-change.md` (state changes only)
**Key design**: State-change-only writes prevent inbox spam during idle periods. Timestamp in cache tracks last-check even when no change.
**Previous version**: `vastai-tend.sh.deprecated-2026-04-12` (wrote to `~/.vastai-tend.log` and `~/.vastai-alert`; alerts file pattern; no inbox integration)

---

## Superseded Jobs (Commented Out in Crontab — 2026-04-12)

Five previously active jobs were commented out in the crontab as part of EX-5. Scripts are NOT deleted.

| Job | Previous schedule | Reason superseded | Script preserved at |
|-----|------------------|-------------------|---------------------|
| `run_monitor.sh` | every 2h | Collapsed into stale-detect.sh per §5.2 | `/home/alton/sartor-monitoring/run_monitor.sh` |
| `dashboard-healthcheck.sh` | daily 9am | Folded into stale-detect.sh per §5.2 | `/home/alton/dashboard-healthcheck.sh` |
| `daily_summary.py` | daily 23:55 | Folded into gather_mirror 4h pass per §5.2 | `/usr/bin/python3 /home/alton/sartor-power/bin/daily_summary.py` |
| `run_pricing.sh` | weekly Mon 9am | Demoted to on-demand skill per §5.2 | `/home/alton/sartor-pricing/run_pricing.sh` |

---

## Previously Deprecated Jobs (From v0.2 — Unchanged)

| Job | Status | Reason |
|-----|--------|--------|
| `gateway_cron.py` | DISABLED | JSON decode error every 30min |
| `vastai-tend.sh` (old) | DEPRECATED | Superseded by run_monitor.sh (v0.2); now resurrected with new design (v0.3) |
| `heartbeat-watcher.sh` | DEPRECATED | Redundant |
| `memory-sync.sh` | DEPRECATED | Persistent git merge conflicts |
| `periodic-analysis.sh` | DEPRECATED | Superseded by run_monitor.sh |
| `autodream.py + decay.py` | DISABLED | Memory consolidation is Rocinante-only per OPERATING-AGREEMENT §2 |
| `sartor-evolve.sh` | DEPRECATED | Docker permission failures |
| `sartor-gemma-weekly.sh` | DEPRECATED | Docker/model mismatch |
| `sartor-model-optimizer.sh` | DEPRECATED | Docker permission failures |

---

## Log Directory

All three active crons write to `/home/alton/generated/cron-logs/`:
- `gather_mirror.log`
- `stale-detect.log`
- `vastai-tend.log`

Directory is created by each script on startup (`mkdir -p`). Gitignored (local-only).

---

## Inbox Pattern

All three crons write to `sartor/memory/inbox/gpuserver1/` subdirectories:

| Cron | Inbox path | Trigger |
|------|-----------|---------|
| gather_mirror | `inbox/gpuserver1/status/` | every run (status JSON) |
| gather_mirror | `inbox/gpuserver1/alerts/` | pull failure only |
| stale-detect | `inbox/gpuserver1/_stale-alerts/` | any signal detected |
| vastai-tend | `inbox/gpuserver1/_vastai/` | state change only |

Rocinante curator drains these on its 06:30/23:00 passes and writes receipts to `inbox/_receipts/gpuserver1/`.

---

## Maintenance Notes

**This file is authoritative for gpuserver1 cron operations.** When adding, modifying, or removing crons:

1. Update this file first (bump `updated:` frontmatter and `version:`)
2. Write to `sartor/memory/inbox/gpuserver1/ops/` as a YAML-fronted proposal
3. Wait for Rocinante to drain inbox and commit changes
4. Only then modify actual crontab (via `crontab -e`)

**Never commit this file directly from gpuserver1** (no git credentials). All commits go through Rocinante's curator drain.

**Last full audit**: 2026-04-12 (EX-11 re-verification — crontab -l confirmed exactly 3 active lines, all others commented)
**Next audit due**: 2026-05-12 (monthly cadence)

---

## Appendix: Crontab Syntax Quick Reference

- `*/30 * * * *` = every 30 minutes
- `0 * * * *` = hourly at minute 0
- `0 */4 * * *` = every 4 hours
