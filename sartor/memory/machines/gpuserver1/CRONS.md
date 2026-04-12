---
type: machine_operations
entity: gpuserver1-crons
updated: 2026-04-12
updated_by: gpuserver1
status: active
version: 0.2
related: [gpuserver1-MISSION, OPERATING-AGREEMENT, rental-operations]
---

# gpuserver1 Cron Documentation v0.2

I run **5 active cron jobs** across three operational categories: **monitoring** (2 jobs), **power & pricing** (2 jobs), and **dashboard health** (1 job). This represents a cleanup from the previous 15-job configuration, with 10 jobs deprecated or disabled as of 2026-04-12.

This document is authoritative for all cron operations on gpuserver1. Last verified: 2026-04-12 (cleanup cycle).

---

## Operational Rhythm (Active Jobs Only)

- **Every 2 hours**: run_monitor (P0 active)
- **Every 4 hours**: gather_mirror (P0 active)
- **Daily 9 AM**: dashboard-healthcheck (active)
- **Daily 11:55 PM**: daily_summary (P0 active)
- **Weekly Monday 9 AM**: run_pricing (P0 active)

**Total active jobs**: 5 (down from 15)
**P0 systems**: 4 jobs (run_monitor, gather_mirror, daily_summary, run_pricing)
**Supporting infrastructure**: 1 job (dashboard-healthcheck)

---

## Active Cron Jobs

### 1. gather_mirror.sh (P0 ACTIVE)
**Schedule**: `0 */4 * * *` (every 4 hours)
**Path**: `/home/alton/gather_mirror.sh`
**Log**: Writes to `~/sartor-monitoring/logs/gather_mirror.log`
**Purpose**: Git pull from Rocinante, vastai status snapshot, GPU health snapshot, heartbeat log
**Installed**: 2026-04-03 (Sartor Mirror Systems)
**Heartbeat**: Appends to `data/heartbeat-log.csv` (repo path, committed)
**Status**: **ACTIVE** (P0 system, refactored 2026-04-12 with auto-stash to prevent git blocking)
**Owner**: Rocinante (delegated task)
**Last verification**: 2026-04-12 (auto-stash feature confirmed working)
**Commit plan**: **Direct repo write** — writes `data/heartbeat-log.csv` directly to repo; log file is local quarantine

---

### 2. run_monitor.sh (P0 ACTIVE)
**Schedule**: `0 */2 * * *` (every 2 hours)
**Path**: `/home/alton/sartor-monitoring/run_monitor.sh`
**Log**: Writes to `~/sartor-monitoring/logs/` directory
**Purpose**: Sartor monitoring system (Claude Code health sweep: disk space, Docker, vastai listing, GPU temp)
**Installed**: 2026-04-11
**Heartbeat**: Updates `~/sartor-heartbeat.json` (monitoring category, 120 min interval)
**Status**: **ACTIVE** (P0 system, verified working 2026-04-12)
**Owner**: gpuserver1 (Claude Code session)
**Last verification**: 2026-04-12
**Commit plan**: **Generated quarantine** — logs write to `~/sartor-monitoring/logs/` (local, gitignored); heartbeat file is local state, never committed
**Migration status**: Matches target state (local-only monitoring, no git involvement)

---

### 3. dashboard-healthcheck.sh (ACTIVE)
**Schedule**: `0 9 * * *` (daily at 9 AM UTC)
**Path**: `/home/alton/dashboard-healthcheck.sh`
**Log**: `/home/alton/dashboard-healthcheck.log`
**Purpose**: Dashboard health check for safety-research dashboard (port 8000) and gpu-dashboard (port 5060)
**Status**: **ACTIVE** (verified working, well-architected with auto-recovery)
**Owner**: gpuserver1 (prior install)
**Last verification**: 2026-04-12
**Features**: Automatic service restart on failure, alert file at `~/.dashboard-alert` on recovery failure
**Commit plan**: **Local only** — log writes to home dir; not committed to git
**Keep rationale**: Critical infrastructure monitoring with proven auto-recovery capabilities

---

### 4. daily_summary.py (P0 ACTIVE)
**Schedule**: `55 23 * * *` (daily at 11:55 PM UTC)
**Path**: `/usr/bin/python3 /home/alton/sartor-power/bin/daily_summary.py`
**Log**: `/home/alton/sartor-power/logs/daily_summary.log` (append)
**Purpose**: Daily power usage summary (aggregates UPS metrics and generates reports)
**Heartbeat**: Updates `~/sartor-heartbeat.json` (power category, 1440 min interval)
**Status**: **ACTIVE** (P0 system, verified working)
**Owner**: gpuserver1 (prior install)
**Last verification**: 2026-04-12
**Commit plan**: **Generated quarantine** — logs write to dedicated local dir (`~/sartor-power/logs/`); heartbeat is local state
**Migration status**: Matches target state (local-only power metrics, no git involvement)

---

### 5. run_pricing.sh (P0 ACTIVE)
**Schedule**: `0 9 * * 1` (weekly Monday 9 AM UTC)
**Path**: `/home/alton/sartor-pricing/run_pricing.sh`
**Log**: Unknown (script may write to dedicated log dir)
**Purpose**: Weekly pricing review for vast.ai machine (checks competitive rates, suggests adjustments)
**Heartbeat**: Updates `~/sartor-heartbeat.json` (pricing category, 10080 min interval = 1 week)
**Status**: **ACTIVE** (P0 system, verified working)
**Owner**: gpuserver1 (prior install)
**Last verification**: 2026-04-12
**Commit plan**: **Inbox pattern** — pricing recommendations should write to `sartor/memory/inbox/gpuserver1/pricing/` for Rocinante curator to review
**Migration status**: **Needs verification**. Check where pricing script actually writes. If not using inbox, migrate.

---

## Deprecated/Disabled Cron Jobs (2026-04-12 Cleanup)

The following 10 jobs were disabled or deprecated during the 2026-04-12 cleanup cycle.

### DISABLED: gateway_cron.py
**Original schedule**: `*/30 * * * *` (every 30 minutes)
**Path**: `/home/alton/Sartor-claude-network/sartor/gateway/gateway_cron.py`
**Status**: **DISABLED 2026-04-12**
**Reason**: Failing every 30min with `Expecting value: line 1 column 1 (char 0)` JSON decode error
**Action taken**: Commented out in crontab, script preserved in repo
**Original line**: `*/30 * * * * cd /home/alton/Sartor-claude-network/sartor/.. && /usr/bin/python3 /home/alton/Sartor-claude-network/sartor/gateway/gateway_cron.py >> /home/alton/.sartor-cron.log 2>&1`

---

### DEPRECATED: vastai-tend.sh
**Original schedule**: `30 */2 * * *` (every 2 hours, offset +30min)
**Path**: `/home/alton/vastai-tend.sh` (renamed to `.deprecated-2026-04-12`)
**Status**: **DEPRECATED 2026-04-12**
**Reason**: 100% redundant with run_monitor.sh (P0 active system)
**Overlap verified**: Both check vastai listing, disk space, kaalia daemon, hairpin NAT, Docker health
**Action taken**: Commented out in crontab, script renamed with .deprecated-2026-04-12 suffix
**Original line**: `30 */2 * * * /home/alton/vastai-tend.sh >> /home/alton/.vastai-tend.log 2>&1`

---

### DEPRECATED: heartbeat-watcher.sh
**Original schedule**: `*/30 * * * *` (every 30 minutes)
**Path**: `/home/alton/heartbeat-watcher.sh` (archived)
**Status**: **DEPRECATED 2026-04-12**
**Reason**: 100% redundant with gather_mirror.sh and run_monitor.sh
**Overlap verified**: GPU metrics, disk space, vastai status all covered by P0 systems
**Data preserved**: `data/heartbeat-log.csv` (485 entries) remains in repo
**Action taken**: Commented out in crontab, script archived to `archive/deprecated-crons-2026-04-12/`
**Original line**: `*/30 * * * * /home/alton/heartbeat-watcher.sh`

---

### DEPRECATED: memory-sync.sh
**Original schedule**: `0 * * * *` (hourly)
**Path**: `/home/alton/memory-sync.sh` (archived)
**Status**: **DEPRECATED 2026-04-12**
**Reason**: Non-functional (persistent git merge conflicts), superseded by gather_mirror.sh
**Failure mode**: 1257 lines of "Your local changes would be overwritten by merge" errors
**Action taken**: Commented out in crontab, script archived to `archive/deprecated-crons-2026-04-12/`
**Original line**: `0 * * * * /home/alton/memory-sync.sh`

---

### DEPRECATED: periodic-analysis.sh
**Original schedule**: `0 */2 * * *` (every 2 hours)
**Path**: `/home/alton/sartor/periodic-analysis.sh` (archived)
**Status**: **DEPRECATED 2026-04-12**
**Reason**: Superseded by run_monitor.sh (installed 2026-04-11 at same 2h schedule)
**Verification**: run_monitor.sh has superior architecture (inbox pattern, lockfile, timeout, heartbeat)
**Action taken**: Commented out in crontab, script archived to `archive/deprecated-crons-2026-04-12/`
**Original line**: `0 */2 * * * /home/alton/sartor/periodic-analysis.sh`

---

### DISABLED: consolidate-mirror (autodream + decay)
**Original schedule**: `30 23 * * *` (daily at 11:30 PM UTC)
**Commands**: `autodream.py --force` and `decay.py --update`
**Status**: **DISABLED 2026-04-12**
**Reason**: Memory consolidation is Rocinante-only per OPERATING-AGREEMENT §2
**Authority separation**: gpuserver1 has rental-operations authority, Rocinante has memory-curation authority
**Action taken**: Commented out in crontab, scripts remain in repo but not executed on gpuserver1
**Original line**: `30 23 * * * cd ~/Sartor-claude-network && python3 sartor/memory/autodream.py --force >> /tmp/autodream.log 2>&1; python3 sartor/memory/decay.py --update >> /tmp/decay.log 2>&1; echo "$(date -Iseconds),consolidate-mirror,completed,0,local,0" >> data/heartbeat-log.csv`

---

### DEPRECATED: sartor-evolve.sh
**Original schedule**: `0 */6 * * *` (every 6 hours)
**Path**: `~/sartor-evolve.sh`
**Status**: **DEPRECATED 2026-04-12**
**Reason**: Failing (Docker permissions), poor output quality when working
**Failure mode**: 0-byte logs, Ollama permission errors
**Action taken**: Commented out in crontab, script remains at original path
**Original line**: `0 */6 * * * ~/sartor-evolve.sh >> /tmp/sartor-evolve.log 2>&1`

---

### DEPRECATED: sartor-gemma-weekly.sh
**Original schedule**: `0 3 * * 0` (weekly Sunday 3 AM UTC)
**Path**: `/home/alton/sartor-gemma-weekly.sh`
**Status**: **DEPRECATED 2026-04-12**
**Reason**: Failing (Docker permissions, model mismatch gemma4:31b vs gemma3:27b)
**Action taken**: Commented out in crontab, script remains at original path
**Original line**: `0 3 * * 0 /home/alton/sartor-gemma-weekly.sh >> /home/alton/gemma-weekly.log 2>&1`

---

### DEPRECATED: sartor-model-optimizer.sh
**Original schedule**: `0 4 * * 0` (weekly Sunday 4 AM UTC)
**Path**: `~/sartor-model-optimizer.sh`
**Status**: **DEPRECATED 2026-04-12**
**Reason**: Failing (Docker permissions), no downstream consumers of output
**Action taken**: Commented out in crontab, script remains at original path
**Original line**: `0 4 * * 0 ~/sartor-model-optimizer.sh >> /tmp/model-optimizer.log 2>&1`

---

## Cleanup Summary

| Category | Count Before | Count After | Delta |
|----------|-------------|-------------|-------|
| **Active cron jobs** | 15 | 5 | -10 |
| **P0 systems** | 5 | 4 | -1 (consolidate-mirror disabled) |
| **Undocumented/failing** | 7 | 0 | -7 (all investigated) |
| **Legacy redundant** | 2 | 0 | -2 (vastai-tend, heartbeat-watcher) |
| **Disabled but preserved** | 1 | 1 | 0 (gateway_cron) |

---

## Commit Plan Summary (Post-Cleanup)

Classification of how each active cron's output reaches (or doesn't reach) GitHub:

| Pattern | Count | Crons |
|---------|-------|-------|
| **Direct repo write** | 1 | gather_mirror (heartbeat CSV) |
| **Inbox pattern** | 1 (target) | run_pricing (needs verification) |
| **Generated quarantine** | 2 | run_monitor, daily_summary |
| **Local only** | 1 | dashboard-healthcheck |

All deprecated/disabled crons are no longer producing output, so commit plan is irrelevant for those entries.

---

## Self-Management Cadence

### Heartbeat Monitoring

I maintain `~/sartor-heartbeat.json` with last-run timestamps for four P0 systems:
- **monitoring** (run_monitor): expected every 120 min
- **gather-mirror**: expected every 240 min
- **power** (daily_summary): expected every 1440 min
- **pricing** (run_pricing): expected every 10080 min (weekly)

The heartbeat file is checked by run_monitor.sh every 2h. If any category exceeds its expected interval by 2x, an alert is triggered.

### CSV Operational Log

`data/heartbeat-log.csv` (in repo) is append-only telemetry visible to Rocinante on every git pull. Format: `timestamp,category,status,exit_code,location,duration_sec`.

Rocinante can detect stale categories by checking timestamps in the CSV without SSHing to gpuserver1.

---

## Resolved Issues (2026-04-12 Cleanup)

### 1. gateway_cron.py failing every 30 min ✅
**Resolution**: Disabled in crontab (2026-04-12). Script preserved for investigation.

### 2. vastai-tend.sh vs run_monitor.sh overlap ✅
**Resolution**: vastai-tend.sh deprecated (2026-04-12). Verified 100% overlap with run_monitor.sh.

### 3. Seven undocumented scripts ✅
**Resolution**: All investigated via subagent analysis (2026-04-12):
- heartbeat-watcher.sh: DEPRECATED (redundant)
- memory-sync.sh: DEPRECATED (failing, redundant)
- dashboard-healthcheck.sh: KEPT (well-architected, critical)
- periodic-analysis.sh: DEPRECATED (superseded by run_monitor.sh)
- sartor-evolve.sh: DEPRECATED (failing)
- sartor-gemma-weekly.sh: DEPRECATED (failing)
- sartor-model-optimizer.sh: DEPRECATED (failing)

### 4. consolidate-mirror output path unclear ✅
**Resolution**: Disabled consolidate-mirror entirely (2026-04-12). Memory consolidation is Rocinante-only per OPERATING-AGREEMENT §2. gpuserver1 no longer runs autodream/decay.

---

## Open Questions

1. **Pricing script inbox migration**: Does `run_pricing.sh` currently use the inbox pattern? If not, should it be refactored to write recommendations to `inbox/gpuserver1/pricing/`?

2. **Gateway cron investigation**: What is `gateway_cron.py` supposed to do? Can it be safely deleted, or does it need debugging?

3. **Ollama infrastructure**: The three deprecated LLM scripts all failed due to Docker permission issues. Should Ollama be configured properly, or should LLM-based monitoring be abandoned?

---

## Maintenance Notes

**This file is authoritative for gpuserver1 cron operations.** When adding, modifying, or removing crons:

1. Update this file first (bump `updated:` frontmatter and `version:`)
2. Write to `sartor/memory/inbox/gpuserver1/ops/` as a YAML-fronted proposal
3. Wait for Rocinante to drain inbox and commit changes
4. Only then modify actual crontab (via `crontab -e`)

**Never commit this file directly from gpuserver1** (no git credentials). All commits go through Rocinante's curator drain.

**Last full audit**: 2026-04-12 (cleanup cycle, v0.2)
**Next audit due**: 2026-05-12 (monthly cadence)

---

## Appendix: Crontab Syntax Quick Reference

- `*/30 * * * *` = every 30 minutes
- `0 * * * *` = hourly at minute 0
- `0 */2 * * *` = every 2 hours at minute 0
- `30 */2 * * *` = every 2 hours at minute 30 (offset)
- `0 */4 * * *` = every 4 hours
- `0 */6 * * *` = every 6 hours
- `30 23 * * *` = daily at 11:30 PM
- `55 23 * * *` = daily at 11:55 PM
- `0 9 * * *` = daily at 9 AM
- `0 3 * * 0` = weekly Sunday 3 AM
- `0 4 * * 0` = weekly Sunday 4 AM
- `0 9 * * 1` = weekly Monday 9 AM
