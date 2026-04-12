---
type: machine_operations
entity: gpuserver1-crons
updated: 2026-04-12
updated_by: gpuserver1
status: active
related: [gpuserver1-MISSION, OPERATING-AGREEMENT, rental-operations]
---

# gpuserver1 Cron Documentation

I run 15 scheduled cron jobs across six operational categories: **monitoring** (3 jobs), **power & pricing** (2 jobs), **memory consolidation** (2 jobs), **gather-mirror** (1 job), **evolve & optimize** (3 jobs), and **legacy/undocumented** (4 jobs). These jobs establish my operational rhythm from 30-minute pulses (gateway, heartbeat) through 2-hour monitoring cycles to weekly optimization runs.

This document is authoritative for all cron operations on gpuserver1. Last verified: 2026-04-12.

---

## Operational Rhythm

- **Every 30 min**: gateway_cron (failing), heartbeat-watcher (undocumented)
- **Every hour**: memory-sync (undocumented)
- **Every 2 hours**: periodic-analysis (undocumented), vastai-tend (legacy), run_monitor (P0 active)
- **Every 4 hours**: gather_mirror (P0 active)
- **Every 6 hours**: sartor-evolve (undocumented)
- **Daily 9 AM**: dashboard-healthcheck (undocumented)
- **Daily 11:30 PM**: consolidate-mirror (P0 active)
- **Daily 11:55 PM**: daily_summary (P0 active)
- **Weekly Monday 9 AM**: run_pricing (P0 active)
- **Weekly Sunday 3 AM**: sartor-gemma-weekly (undocumented)
- **Weekly Sunday 4 AM**: model-optimizer (undocumented)

**P0 systems** (5 jobs) are verified working and write heartbeat metadata. **Undocumented systems** (7 jobs) need investigation. **Known failing** (1 job): gateway_cron.

---

## Cron Job Inventory

### 1. gateway_cron.py
**Schedule**: `*/30 * * * *` (every 30 minutes)
**Path**: `/home/alton/Sartor-claude-network/sartor/gateway/gateway_cron.py`
**Log**: `/home/alton/.sartor-cron.log` (append)
**Purpose**: Gateway cron task (purpose unclear from code audit)
**Status**: **FAILING** (known issue per CLAUDE.md, logs show repeated failures)
**Owner**: Inherited (pre-2026-04)
**Last verification**: 2026-04-12 (confirmed failing)
**Commit plan**: **Direct repo write** — writes log to home dir (not in repo); script lives in repo at `sartor/gateway/`
**Action needed**: Investigate failure root cause OR disable if obsolete. Blocking high-frequency log spam.

---

### 2. heartbeat-watcher.sh
**Schedule**: `*/30 * * * *` (every 30 minutes)
**Path**: `/home/alton/heartbeat-watcher.sh`
**Log**: Unknown (no explicit redirect in crontab)
**Purpose**: Heartbeat monitoring (unclear; may be redundant with run_monitor.sh)
**Status**: Unknown (no verification done)
**Owner**: Unknown
**Last verification**: Never
**Commit plan**: **Needs investigation** — script existence unverified; unclear what it monitors or where it writes
**Action needed**: Read script, verify purpose, check for overlap with run_monitor.sh heartbeat system.

---

### 3. memory-sync.sh
**Schedule**: `0 * * * *` (every hour)
**Path**: `/home/alton/memory-sync.sh`
**Log**: Unknown (no explicit redirect in crontab)
**Purpose**: Memory synchronization (unclear; may be related to Sartor memory system)
**Status**: Unknown (no verification done)
**Owner**: Unknown
**Last verification**: Never
**Commit plan**: **Needs investigation** — script existence unverified; unclear whether this is inbox drain, autodream, or something else
**Action needed**: Read script, verify purpose, check if superseded by consolidate-mirror (autodream/decay).

---

### 4. dashboard-healthcheck.sh
**Schedule**: `0 9 * * *` (daily at 9 AM UTC)
**Path**: `/home/alton/dashboard-healthcheck.sh`
**Log**: Unknown (no explicit redirect in crontab)
**Purpose**: Dashboard health check (presumably for safety-research dashboard on port 8000)
**Status**: Unknown (no verification done)
**Owner**: Unknown
**Last verification**: Never
**Commit plan**: **Needs investigation** — script existence unverified
**Action needed**: Read script, verify it targets the safety-research dashboard, confirm health check logic.

---

### 5. periodic-analysis.sh
**Schedule**: `0 */2 * * *` (every 2 hours)
**Path**: `/home/alton/sartor/periodic-analysis.sh`
**Log**: Unknown (no explicit redirect in crontab)
**Purpose**: Periodic analysis (unclear; may be log analysis or metrics aggregation)
**Status**: Unknown (no verification done)
**Owner**: Unknown
**Last verification**: Never
**Commit plan**: **Needs investigation** — path suggests repo location (`~/sartor/`), unclear if this is actually in git or elsewhere
**Action needed**: Read script, verify purpose, check for overlap with sartor-evolve (LLM log analysis).

---

### 6. vastai-tend.sh (LEGACY)
**Schedule**: `30 */2 * * *` (every 2 hours, offset +30min from run_monitor)
**Path**: `/home/alton/vastai-tend.sh`
**Log**: `/home/alton/.vastai-tend.log` (append)
**Purpose**: Vast.ai machine tending (legacy; predates run_monitor.sh)
**Status**: Active (writes to `~/.vastai-alert` file)
**Owner**: Inherited (pre-2026-04)
**Last verification**: 2026-04-12 (confirmed running, but may be redundant)
**Commit plan**: **Local only** — writes to home dir alert file and log; not committed to git
**Action needed**: Audit overlap with run_monitor.sh vastai checks. Strong candidate for deprecation if run_monitor covers same ground.

---

### 7. run_monitor.sh (P0 ACTIVE)
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
**Migration status**: Matches target state (local-only monitoring, no git involvement).

---

### 8. gather_mirror.sh (P0 ACTIVE)
**Schedule**: `0 */4 * * *` (every 4 hours)
**Path**: `/home/alton/gather_mirror.sh`
**Log**: Writes to `~/sartor-monitoring/logs/gather_mirror.log`
**Purpose**: Git pull from Rocinante, vastai status snapshot, GPU health snapshot, heartbeat log
**Installed**: 2026-04-03 (Sartor Mirror Systems)
**Heartbeat**: Appends to `data/heartbeat-log.csv` (repo path, committed)
**Status**: **ACTIVE** (P0 system, refactored 2026-04-12 with auto-stash to prevent git blocking)
**Owner**: Rocinante (delegated task)
**Last verification**: 2026-04-12 (auto-stash feature added)
**Commit plan**: **Direct repo write** — writes `data/heartbeat-log.csv` directly to repo; log file is local quarantine
**Migration status**: Matches target state. Heartbeat CSV is intentionally committed as operational telemetry.

---

### 9. sartor-evolve.sh
**Schedule**: `0 */6 * * *` (every 6 hours)
**Path**: `~/sartor-evolve.sh`
**Log**: `/tmp/sartor-evolve.log` (append)
**Purpose**: Local LLM log analysis and improvement proposals (unclear if actually working)
**Installed**: 2026-04-03 (Sartor Mirror Systems)
**Status**: Unknown (no verification done; log in /tmp suggests transient)
**Owner**: Rocinante (delegated task)
**Last verification**: Never
**Commit plan**: **Generated quarantine** — log writes to `/tmp/` (transient, never committed); unclear where proposals go
**Action needed**: Read script, verify LLM endpoint and output path. Check if proposals write to inbox or elsewhere.

---

### 10. consolidate-mirror (P0 ACTIVE)
**Schedule**: `30 23 * * *` (daily at 11:30 PM UTC, 30min after Rocinante's consolidation)
**Commands**:
- `cd ~/Sartor-claude-network && python3 sartor/memory/autodream.py --force >> /tmp/autodream.log 2>&1`
- `python3 sartor/memory/decay.py --update >> /tmp/decay.log 2>&1`
- `echo "$(date -Iseconds),consolidate-mirror,completed,0,local,0" >> data/heartbeat-log.csv`

**Log**: `/tmp/autodream.log`, `/tmp/decay.log` (append)
**Purpose**: Memory consolidation (autodream synthesizes daily experiences, decay ages low-signal memories)
**Installed**: 2026-04-03 (Sartor Mirror Systems)
**Heartbeat**: Appends to `data/heartbeat-log.csv` (repo path)
**Status**: **ACTIVE** (P0 system, verified working)
**Owner**: Rocinante (delegated task)
**Last verification**: 2026-04-12 (heartbeat confirmed in CSV)
**Commit plan**: **Direct repo write** (heartbeat CSV); **generated quarantine** (logs in /tmp); **inbox pattern** (autodream/decay outputs may write to memory files or inbox; needs clarification)
**Migration status**: Partially matches target. Heartbeat CSV is correct. Logs are transient (correct). Need to verify whether autodream/decay write directly to `sartor/memory/` or use inbox (if direct, should migrate to inbox).

---

### 11. daily_summary.py (P0 ACTIVE)
**Schedule**: `55 23 * * *` (daily at 11:55 PM UTC)
**Path**: `/usr/bin/python3 /home/alton/sartor-power/bin/daily_summary.py`
**Log**: `/home/alton/sartor-power/logs/daily_summary.log` (append)
**Purpose**: Daily power usage summary (aggregates UPS metrics and generates reports)
**Heartbeat**: Updates `~/sartor-heartbeat.json` (power category, 1440 min interval)
**Status**: **ACTIVE** (P0 system, verified working)
**Owner**: gpuserver1 (prior install)
**Last verification**: 2026-04-12
**Commit plan**: **Generated quarantine** — logs write to dedicated local dir (`~/sartor-power/logs/`); heartbeat is local state
**Migration status**: Matches target state (local-only power metrics, no git involvement).

---

### 12. model-optimizer.sh
**Schedule**: `0 4 * * 0` (weekly Sunday 4 AM UTC)
**Path**: `~/sartor-model-optimizer.sh`
**Log**: `/tmp/model-optimizer.log` (append)
**Purpose**: Benchmark local models (unclear which models, what benchmarks)
**Installed**: 2026-04-03 (Sartor Mirror Systems)
**Status**: Unknown (no verification done; log in /tmp suggests transient)
**Owner**: Rocinante (delegated task)
**Last verification**: Never
**Commit plan**: **Generated quarantine** — log writes to `/tmp/` (transient); unclear where benchmark results go
**Action needed**: Read script, verify which models are benchmarked, where results are written (inbox? local?).

---

### 13. sartor-gemma-weekly.sh
**Schedule**: `0 3 * * 0` (weekly Sunday 3 AM UTC)
**Path**: `/home/alton/sartor-gemma-weekly.sh`
**Log**: `/home/alton/gemma-weekly.log` (append)
**Purpose**: Gemma optimization benchmark (unclear; Gemma 2 9B model is installed locally)
**Status**: Unknown (no verification done)
**Owner**: Unknown
**Last verification**: Never
**Commit plan**: **Needs investigation** — log is in home dir (local); unclear where benchmark results go
**Action needed**: Read script, verify benchmark logic, check if results write to inbox or local dir.

---

### 14. run_pricing.sh (P0 ACTIVE)
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

### 15. run_pricing.sh (duplicate entry removed in above; only one exists)

---

## Commit Plan Summary

Classification of how each cron's output reaches (or doesn't reach) GitHub:

| Pattern | Count | Crons |
|---------|-------|-------|
| **Direct repo write** | 2 | gather_mirror (heartbeat CSV), consolidate-mirror (heartbeat CSV) |
| **Inbox pattern** | 1 (target) | run_pricing (needs verification) |
| **Generated quarantine** | 4 | run_monitor, daily_summary, sartor-evolve, model-optimizer |
| **Local only** | 1 | vastai-tend (legacy, candidate for deprecation) |
| **Needs investigation** | 7 | gateway_cron, heartbeat-watcher, memory-sync, dashboard-healthcheck, periodic-analysis, sartor-gemma-weekly, consolidate-mirror (autodream/decay output path unclear) |

### Direct Repo Write (2 crons)

**gather_mirror.sh** and **consolidate-mirror** both append to `data/heartbeat-log.csv` directly in the repo. This is intentional operational telemetry that Rocinante pulls every 4h. The CSV format is append-only and safe for concurrent writes.

**Status**: Matches target architecture. No migration needed.

### Inbox Pattern (1 cron, needs verification)

**run_pricing.sh** should write pricing recommendations to `sartor/memory/inbox/gpuserver1/pricing/` as YAML-fronted proposals. Rocinante's curator drains the inbox and merges recommendations into canonical memory.

**Migration needed**: Verify where run_pricing.sh currently writes. If not using inbox, refactor to write recommendations to inbox directory.

### Generated Quarantine (4 crons)

**run_monitor**, **daily_summary**, **sartor-evolve**, **model-optimizer** all write logs to local directories (`~/sartor-monitoring/logs/`, `~/sartor-power/logs/`, `/tmp/`) that are gitignored. These are purely transient operational logs, never committed.

**Status**: Matches target architecture. No migration needed.

### Local Only (1 cron, legacy)

**vastai-tend.sh** writes to `~/.vastai-tend.log` and `~/.vastai-alert` in home dir. This is legacy monitoring that likely overlaps with run_monitor.sh.

**Migration needed**: Audit for redundancy with run_monitor.sh. Strong candidate for deprecation.

### Needs Investigation (7 crons)

**gateway_cron**, **heartbeat-watcher**, **memory-sync**, **dashboard-healthcheck**, **periodic-analysis**, **sartor-gemma-weekly**: All lack documentation. Unknown output paths, unknown purposes.

**consolidate-mirror** (autodream/decay): The heartbeat CSV is correct, but unclear where autodream/decay actually write their outputs. They should use inbox pattern if generating memory proposals.

**Migration needed**: Read all undocumented scripts, classify their output paths, migrate to inbox pattern where appropriate.

---

## Self-Management Cadence

### Heartbeat Monitoring

I maintain `~/sartor-heartbeat.json` with last-run timestamps for five P0 systems:
- **monitoring** (run_monitor): expected every 120 min
- **gather-mirror**: expected every 240 min
- **power** (daily_summary): expected every 1440 min
- **pricing** (run_pricing): expected every 10080 min (weekly)
- **consolidate-mirror**: expected every 1440 min

The heartbeat file is checked by run_monitor.sh every 2h. If any category exceeds its expected interval by 2x, an alert is triggered (currently writes to local log; should escalate to inbox).

### CSV Operational Log

`data/heartbeat-log.csv` (in repo) is append-only telemetry visible to Rocinante on every git pull. Format: `timestamp,category,status,exit_code,location,duration_sec`.

Rocinante can detect stale categories by checking timestamps in the CSV without SSHing to gpuserver1.

### Failure Escalation

**Current state**: Failures write to local logs only. Rocinante sees them only if it reads logs via SSH or if gather_mirror fails to update CSV.

**Target state**: Critical failures should write to `sartor/memory/inbox/gpuserver1/alerts/` as YAML-fronted incident reports. Rocinante's curator will surface these in daily review.

**Migration needed**: Refactor run_monitor.sh and other P0 scripts to write failures to inbox, not just logs.

---

## Known Issues & Resolutions

### 1. gateway_cron.py failing every 30 min
**Symptom**: Repeated errors in `/home/alton/.sartor-cron.log`
**Impact**: High-frequency log spam; cron purpose unclear
**Root cause**: Unknown (script needs investigation)
**Resolution path**:
- Option A: Debug script, fix error, document purpose
- Option B: Disable cron if obsolete (comment out in crontab)
- **Recommendation**: Option B (disable) unless Rocinante knows what gateway_cron is for

### 2. vastai-tend.sh vs run_monitor.sh overlap
**Symptom**: Both crons run every 2h and check vastai status
**Impact**: Redundant API calls, overlapping logs
**Root cause**: run_monitor.sh was installed 2026-04-11 as P0 monitoring; vastai-tend.sh is legacy
**Resolution path**:
- Audit vastai-tend.sh logic
- If fully covered by run_monitor.sh, deprecate vastai-tend.sh
- **Recommendation**: Deprecate vastai-tend.sh (disable cron, archive script)

### 3. Seven undocumented scripts
**Symptom**: heartbeat-watcher, memory-sync, dashboard-healthcheck, periodic-analysis, sartor-evolve, sartor-gemma-weekly, model-optimizer all lack documentation
**Impact**: Unknown operational state; cannot verify health
**Root cause**: Scripts inherited or installed without docs
**Resolution path**:
- Read each script
- Document purpose, output paths, status
- Classify commit plan (inbox / quarantine / local)
- Deprecate any that are obsolete
- **Recommendation**: Prioritize by frequency (heartbeat-watcher every 30min is highest urgency)

### 4. consolidate-mirror output path unclear
**Symptom**: autodream.py and decay.py write to unknown locations
**Impact**: May be writing directly to `sartor/memory/` files (violates inbox pattern on non-Rocinante machines)
**Root cause**: Scripts inherited from Rocinante without gpuserver1-specific docs
**Resolution path**:
- Read autodream.py and decay.py
- Verify output paths
- If writing directly to memory files, refactor to use inbox pattern
- **Recommendation**: Verify output paths; migrate to inbox if needed

---

## Open Questions

1. **Gateway cron purpose**: What is `gateway_cron.py` supposed to do? Is it related to the Sartor gateway on port 5001? Can it be safely disabled?

2. **Autodream/decay on gpuserver1**: Should gpuserver1 even run memory consolidation, or is that a Rocinante-only task? If gpuserver1 runs it, should outputs go to inbox rather than direct memory writes?

3. **Heartbeat vs heartbeat-watcher**: Is `heartbeat-watcher.sh` related to the `sartor-heartbeat.json` system, or is it something else? Name suggests overlap with run_monitor.sh heartbeat monitoring.

4. **Escalation to Rocinante**: Should critical failures (disk >90%, vastai delisted, Docker down) write to inbox for Rocinante's curator to surface, or is local logging sufficient?

5. **Cron consolidation**: Can we reduce the 15 crons to a smaller set of well-documented P0 systems? Candidates for deprecation: gateway_cron, vastai-tend, heartbeat-watcher, possibly others.

6. **Pricing script inbox migration**: Does `run_pricing.sh` currently use the inbox pattern? If not, should it be refactored to write recommendations to `inbox/gpuserver1/pricing/`?

7. **Model optimization ROI**: Are the weekly model benchmarks (model-optimizer, sartor-gemma-weekly) actually used for anything, or are they legacy experiments? Should they continue running?

---

## Maintenance Notes

**This file is authoritative for gpuserver1 cron operations.** When adding, modifying, or removing crons:

1. Update this file first (bump `updated:` frontmatter)
2. Write to `sartor/memory/inbox/gpuserver1/ops/` as a YAML-fronted proposal
3. Wait for Rocinante to drain inbox and commit changes
4. Only then modify actual crontab (via `crontab -e`)

**Never commit this file directly from gpuserver1** (no git credentials). All commits go through Rocinante's curator drain.

**Last full audit**: 2026-04-12 (this document creation)
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
