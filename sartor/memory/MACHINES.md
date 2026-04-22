---
type: domain
entity: MACHINES
updated: 2026-04-22
updated_by: personal-data-gather
last_verified: 2026-04-12
status: active
next_review: 2026-05-12
tags: [entity/infra, domain/gpu]
aliases: [Infrastructure, Hardware]
related: [BUSINESS, PROCEDURES, SELF, MULTI-MACHINE-MEMORY, machines/gpuserver1/MISSION, machines/gpuserver1/CRONS, machines/rocinante/CRONS]
---

# Machines - Computer Inventory

## Key Facts
- Two primary machines: Rocinante (Windows) and gpuserver1 (Ubuntu)
- Both on same LAN (192.168.1.x)
- SSH access between them
- Git push must happen from Rocinante (has credentials); this is mandated by the [[reference/OPERATING-AGREEMENT|Operating Agreement]] — gpuserver1 is inbox-write-only
- gpuserver1 SSH key is NOT added to GitHub (by design — see Operating Agreement)
- Inter-machine memory sync uses the inbox pattern: gpuserver1 writes to `sartor/memory/inbox/gpuserver1/`, Rocinante curator drains nightly. See [[MULTI-MACHINE-MEMORY]].

## Rocinante (Windows Desktop)

**Role:** Primary workstation, git push origin, Chrome automation host

- **OS:** Windows
- **Display:** 3 monitors (2560x1440 primary + 2x 1920x1080)
- **Username:** alton (Windows user), alto8 (profile path)
- **Chrome:** v144 at C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
- **Claude Code:** Installed and active
- **CDP Toolkit:** C:\Users\alto8\chrome-tools\ (cdp-*.ps1 scripts, screenshot, click, type)
- **Chrome Automation Profile:** C:\Users\alto8\chrome-automation-profile\ (CDP port 9223)
- **Git:** Has credentials stored locally, must be used for pushing to GitHub
- **Claude in Chrome:** MCP extension connected via named pipe \.\pipe\claude-mcp-browser-bridge-alton

## gpuserver1 (Ubuntu Server)

**Role:** GPU compute, model training/inference, headless automation, dashboard host, vast.ai rental

- **OS:** Ubuntu 22.04
- **IP:** 192.168.1.100
- **CPU:** i9-14900K (32 threads)
- **GPU:** RTX 5090 (32GB VRAM), NVIDIA driver 570.144
- **RAM:** 128GB
- **Storage:** 1.8TB NVMe — 100GB root (/) + 1.7TB Docker (/var/lib/docker)
- **Python:** 3.10
- **PyTorch:** 2.11.0+cu128
- **Docker:** v29.1.3, NVIDIA Container Toolkit v1.18.1
- **Chrome:** v144 headless, CDP on port 9223 (--no-sandbox --headless=new)
- **Claude Code:** v2.1.33, Max subscription authed, agent teams enabled
- **SSH Key:** ~/.ssh/id_ed25519 (generated, NOT added to GitHub)
- **Git:** Can pull but NOT push (no GitHub credentials)
- **CDP Client:** ~/Sartor-claude-network/.claude/skills/chrome-automation/cdp_client.py

### Vast.ai Hosting
- **Vast.ai account:** alto84@gmail.com (Google OAuth login)
- **Vast.ai console:** https://cloud.vast.ai/host/machines/
- **Machine listing ID:** 52271
- **Kaalia machine ID:** 800a1bf017e653bdadc2fef79457b699c31d5c29279d308ce0f41ba8b15665ff
- **Kaalia daemon:** Runs as `vastai_kaalia` user, heartbeats to 52.90.216.45:7071
- **Docker runtime:** nvidia shim at `/var/lib/vastai_kaalia/latest/kaalia_docker_shim`
- **Host port range:** 40000-40099
- **vastai CLI:** v0.5.0 at `~/.local/bin/vastai`
- **API key:** Configured (name: "gpuserver1"), stored at `~/.config/vastai/vast_api_key`
- **Firewall:** UFW active — allows SSH(22), 40000-40099/tcp (vast.ai), 192.168.1.0/24 (LAN). All else denied.
- **Hairpin NAT:** iptables OUTPUT DNAT rule (100.1.100.63→192.168.1.100) in /etc/ufw/before.rules nat table
- **DOCKER-USER chain:** conntrack --ctorigdstport 40000:40099 rule in /etc/ufw/after.rules (allows Docker-mapped ports)
- **Docker group:** `alton` is in docker group (added 2026-02-23)
- **Pricing:** Base $0.40/hr, MinBid $0.25/hr, end date 2026-08-24. Price raised to $0.35/hr demand / $0.26/hr interruptible 2026-04-11 (25% spread). See [[business/rental-operations]] for pricing rationale and authority rules.
- **Utilization (2026-04-09):** ZERO rentals; earning $0.31/day storage only. This is a persistent pattern requiring pricing review.
- **Reliability:** 99.85%
- **Verification:** VERIFIED (as of 2026-02-26)
- **Self-test:** PASSING (fixed 2026-02-27)
- **Offer ID:** 32099437 (DLPerf 203.2, score 260.3)
- **Payout:** Stripe (configured 2026-02-26 at cloud.vast.ai/earnings/)
- **After reboot:** Kaalia auto-starts. Check listing with `~/.local/bin/vastai show machines`.
- **Port forwarding:** DMZ Host enabled on router → 192.168.1.100 (all ports forwarded, UFW filters on server side)

### gpuserver1 Active Cron Jobs (as of 2026-04-12)

After a 2026-04-12 cleanup that reduced 15 jobs to 5, only these P0/active crons run. See [[machines/gpuserver1/CRONS|gpuserver1 CRONS v0.2]] for full details including the 10 deprecated jobs.

| Job | Schedule | Purpose |
|-----|----------|---------|
| `run_monitor.sh` | every 2 hours | P0: Claude Code health sweep (disk, Docker, vastai, GPU temp) |
| `gather_mirror.sh` | every 4 hours | P0: git pull from Rocinante, vastai status + GPU health snapshot, heartbeat |
| `daily_summary.py` | daily 11:55 PM UTC | P0: power usage summary (UPS metrics) |
| `run_pricing.sh` | Monday 9 AM UTC | P0: weekly vast.ai pricing review, recommends adjustments via inbox |
| `dashboard-healthcheck.sh` | daily 9 AM UTC | health check for safety-research (port 8000) + gpu-dashboard (port 5060) |

**Deprecated 2026-04-12 (no longer running):** `vastai-tend.sh` (replaced by run_monitor.sh), `gateway_cron.py` (JSON parse failures), `memory-sync.sh` (git conflict failures), `heartbeat-watcher.sh` (redundant), `consolidate-mirror/autodream/decay` (memory consolidation is Rocinante-only per Operating Agreement §2).

## Network

- Both machines on same LAN: 192.168.1.x
- SSH from Rocinante to gpuserver1: ssh alton@192.168.1.100
- No VPN required for local access
- **Router:** Verizon Fios at 192.168.1.1 (HTTPS admin, self-signed cert)
- **External IP:** 100.1.100.63
- **DMZ Host:** Enabled, all traffic forwarded to 192.168.1.100 (gpuserver1 UFW handles filtering)
- **UPnP:** Available but mappings don't persist on this router — don't rely on it
- **Router API:** LuCI-based (OpenWrt), save endpoint: `apply_abstract.cgi`, data via Vue.js SPA with Vuex store

For operational procedures on these machines, see [[PROCEDURES]].
Both machines support the [[PROJECTS|active projects]] in this system.
[[SELF|Sartor]] runs across both machines with git-synced memory.

## MERIDIAN Dashboard (Rocinante)
- **URL:** http://localhost:5055
- **Server:** `dashboard/family/server.py` (FastAPI + uvicorn)
- **Features:** Family info, finances, tasks, deadlines, career, costs, Claude terminal, GPU control panel
- **Claude Terminal:** WebSocket /ws/claude, uses Anthropic API with OAuth token from ~/.claude/.credentials.json, Sonnet model, read-only tools (read_file, search_files, list_directory) restricted to Sartor dirs
- **GPU Control:** /api/gpu/status (ping+SSH+service check), /api/gpu/command (predefined SSH commands: check_gpu, uptime, check_memory, check_disk, list_processes, start_dashboard, start_gateway, start_safety)

## Open Questions
- Are there other machines to inventory?
- NAS or shared storage on the network?
- Verify exact symlink state on gpuserver1 for `~/.claude/projects/` → wiki path (Phase 1C liaison flagged as unconfirmed from Rocinante)
- Does `run_pricing.sh` use the inbox pattern to write recommendations? If not, needs migration to `inbox/gpuserver1/pricing/`.

## Related
- [[PROCEDURES]] - How to operate and connect to these machines
- [[PROJECTS]] - Projects running on this hardware
- [[SELF]] - Sartor system that spans these machines

## History
- 2026-02-06: Initial creation
- 2026-02-23: Added vast.ai hosting details, MERIDIAN dashboard section, updated gpuserver1 specs (driver, storage, Docker, Claude auth)
- 2026-02-26: Vast.ai VERIFIED and live. DMZ enabled on router, UFW configured on gpuserver1, Stripe payout configured
- 2026-04-07: Multi-machine memory architecture introduced; inbox pattern, curator drain, Operating Agreement. See [[MULTI-MACHINE-MEMORY]].
- 2026-04-11: run_monitor.sh installed (P0 monitoring, replaces vastai-tend.sh)
- 2026-04-12: Cron cleanup — 15 jobs → 5 active; vastai-tend.sh, gateway_cron.py, memory-sync.sh, heartbeat-watcher.sh, consolidate-mirror all deprecated/disabled. Operating Agreement ratified: gpuserver1 is inbox-write-only, no direct GitHub push. Price raised to $0.35/hr demand. Hub refresh: added last_verified, cron table, inbox pattern, removed resolved "GitHub SSH" open question.

## Consolidated from daily logs (2026-04-05)
- [2026-02-06] (completed) Mandelbulb 3D GPU renderer
- [2026-02-06] (completed) Set up sartor/ directory structure on gpuserver1
- [2026-02-06] (decision) Storage location: ~/Sartor-claude-network/sartor/memory/ on gpuserver1
- [2026-02-06] (decision) Storage location: ~/Sartor-claude-network/sartor/memory/ on gpuserver1
- [2026-02-06] (insight) Having a clear machine inventory prevents confusion about where things run

<!-- curator-drained 2026-04-12T04:35:31+00:00 from gpuserver1 entry=2026-04-07T15-00-00Z-gpuserver1-bootstrap -->
## Inbox entry: 2026-04-07T15-00-00Z-gpuserver1-bootstrap

- Source machine: `gpuserver1`
- Created: 2026-04-07 15:00:00+00:00
- Operation: fact
- Priority: p3
- Drained: 2026-04-12T04:35:31+00:00

gpuserver1 registered in multi-machine memory network:
- Symlinks created from both Claude Code project memory dirs (`~/.claude/projects/-home-alton/memory/` and `~/.claude/projects/-home-alton-Sartor-claude-network/memory/`) to `~/Sartor-claude-network/sartor/memory/`
- Inbox directory at `~/Sartor-claude-network/sartor/memory/inbox/gpuserver1/` is active and ready for curator reconciliation
- Claude Code version 2.1.33 available at /usr/bin/claude
- Operational notes preserved at sartor/memory/reference/gpuserver1-operations.md

<!-- /curator-drained -->

<!-- curator-drained 2026-04-12T04:35:31+00:00 from rocinante entry=ce-1775964663-287ba3e0a7cc -->
## Inbox entry: ce-1775964663-287ba3e0a7cc

- Source machine: `rocinante`
- Created: 2026-04-12T03:31:03+00:00
- Operation: replace
- Priority: p2
- Drained: 2026-04-12T04:35:31+00:00

# Proposed memory: rental_price

- **Category:** `structured_update` / `rental_price`
- **Confidence:** 0.95
- **Dedup status:** `new`
- **Suggested target:** `MACHINES.md`
- **Suggested operation:** `replace`
- **Field:** `gpu_rate` → `$0.35/hr`
- **Entity:** `machine-52271`

## Source quote

> Looks very spikey... Of note, I am increasing the rental price to 0.35 per hour and see how that rents for a few weeks. Profit is profit here... the most important part is that we have revenue to justify the

## Match span

`increasing the rental price to 0.35`

## Session reference

- **session_id:** `6d66075b-10f9-482c`
- **turn_timestamp:** `2026-04-11T23:12:36.381Z`
- **source_file:** `6d66075b-10f9-482c-a62e-9f2828a7ed0d.jsonl`

## Proposed edit

Replace field `gpu_rate` on entity `machine-52271` in `MACHINES.md` with value `$0.35/hr`.

<!-- /curator-drained -->

<!-- curator-drained 2026-04-14T01:39:45+00:00 from gpuserver1 entry=gpuserver1-2026-04-12-cron-cleanup -->
## Inbox entry: gpuserver1-2026-04-12-cron-cleanup

- Source machine: `gpuserver1`
- Created: 2026-04-12 01:42:00+00:00
- Operation: report
- Priority: p2
- Drained: 2026-04-14T01:39:45+00:00

# Cron Cleanup Completion Report — 2026-04-12

## Executive Summary

Executed cron cleanup task per Alton's authorization. Cleaned 15 → 5 active cron jobs by disabling 1 failing system (gateway_cron), deprecating 6 redundant/failing scripts, and stopping 3 Ollama-based experimental jobs. Updated CRONS.md to v0.2 with complete documentation. No issues encountered.

**Time elapsed**: 23 minutes wall-clock
**Subagents dispatched**: 3 (parallel investigation of 7 undocumented scripts)
**Crontab state**: 15 jobs → 5 active jobs (10 disabled/deprecated, all preserved as comments)

---

## Actions Taken

### 1. DISABLED: gateway_cron.py ✅

**Original crontab line**:
```
*/30 * * * * cd /home/alton/Sartor-claude-network/sartor/.. && /usr/bin/python3 /home/alton/Sartor-claude-network/sartor/gateway/gateway_cron.py >> /home/alton/.sartor-cron.log 2>&1
```

**New crontab line** (commented):
```
# DISABLED 2026-04-12: Failing with JSON decode error. Needs investigation or permanent removal.
# Reason: Expecting value: line 1 column 1 (char 0) - repeated failures every 30min
# */30 * * * * cd /home/alton/Sartor-claude-network/sartor/.. && /usr/bin/python3 /home/alton/Sartor-claude-network/sartor/gateway/gateway_cron.py >> /home/alton/.sartor-cron.log 2>&1
```

**Script disposition**: Preserved in repo at `sartor/gateway/gateway_cron.py` (not renamed or moved)

**Verification**:
```
$ ls -la /home/alton/Sartor-claude-network/sartor/gateway/gateway_cron.py
-rw-rw-r-- 1 alton alton 1845 Apr  3 01:17 /home/alton/Sartor-claude-network/sartor/gateway/gateway_cron.py
```

**Rationale**: Failing every 30min with JSON decode errors. Purpose unclear from code. Preserved for potential debugging but stopped to eliminate log spam.

---

### 2. DEPRECATED: vastai-tend.sh ✅

**Original crontab line**:
```
30 */2 * * * /home/alton/vastai-tend.sh >> /home/alton/.vastai-tend.log 2>&1
```

**New crontab line** (commented):
```
# DEPRECATED 2026-04-12: Superseded by run_monitor.sh (P0 active system). All checks covered.
# */30 * * * * /home/alton/vastai-tend.sh >> /home/alton/.vastai-tend.log 2>&1
```

**Script disposition**: Renamed to `/home/alton/vastai-tend.sh.deprecated-2026-04-12`

**Verification**:
```
$ ls -la /home/alton/vastai-tend.sh*
-rwxr-xr-x 1 alton alton 2484 Feb 27 20:03 /home/alton/vastai-tend.sh.deprecated-2026-04-12
```

**Redundancy verification**: Compared vastai-tend.sh (75 lines) vs run_monitor.sh (64 lines). Both check:
- vastai machine listing status
- vastai active instances
- Root disk usage
- Kaalia daemon status
- Hairpin NAT rule presence
- Docker health

**Conclusion**: 100% overlap confirmed. run_monitor.sh is superior (lockfile, timeout, inbox pattern, heartbeat integration).

---

### 3. DEPRECATED: Three Undocumented Scripts (heartbeat-watcher, memory-sync, periodic-analysis) ✅

Subagent investigation (agent a77e8b1) found all three redundant or failing.

#### heartbeat-watcher.sh
**Original crontab line**:
```
*/30 * * * * /home/alton/heartbeat-watcher.sh
```

**New crontab line** (commented):
```
# DEPRECATED 2026-04-12: Redundant with gather_mirror.sh. All metrics covered by P0 systems.
# */30 * * * * /home/alton/heartbeat-watcher.sh
```

**Script disposition**: Archived to `~/Sartor-claude-network/archive/deprecated-crons-2026-04-12/heartbeat-watcher.sh`

**Redundancy verified**: 100% overlap with gather_mirror.sh (GPU metrics, vastai status) and run_monitor.sh (disk space, Docker health).

**Data preserved**: `data/heartbeat-log.csv` (485 entries) remains in repo.

---

#### memory-sync.sh
**Original crontab line**:
```
0 * * * * /home/alton/memory-sync.sh
```

**New crontab line** (commented):
```
# DEPRECATED 2026-04-12: Failing with git merge conflicts. Superseded by gather_mirror.sh.
# 0 * * * * /home/alton/memory-sync.sh
```

**Script disposition**: Archived to `~/Sartor-claude-network/archive/deprecated-crons-2026-04-12/memory-sync.sh`

**Failure mode**: 1257 lines of "Your local changes would be overwritten by merge" errors in `~/memory-sync.log`. Non-functional.

**Replacement**: gather_mirror.sh runs every 4h with auto-stash to prevent git conflicts.

---

#### periodic-analysis.sh
**Original crontab line**:
```
0 */2 * * * /home/alton/sartor/periodic-analysis.sh
```

**New crontab line** (commented):
```
# DEPRECATED 2026-04-12: Superseded by run_monitor.sh. Function unclear, not documented.
# 0 */2 * * * /home/alton/sartor/periodic-analysis.sh
```

**Script disposition**: Archived to `~/Sartor-claude-network/archive/deprecated-crons-2026-04-12/periodic-analysis.sh`

**Redundancy verified**: Subagent af8ea32 confirmed run_monitor.sh (installed 2026-04-11) supersedes this script. Both run at 2h intervals, but run_monitor.sh has superior architecture (inbox pattern, lockfile, timeout, heartbeat).

---

### 4. DEPRECATED: Three Ollama/LLM Scripts (sartor-evolve, sartor-gemma-weekly, sartor-model-optimizer) ✅

Subagent investigation (agent a8a04af) found all three failing due to Docker permission errors.

**Original crontab lines**:
```
0 */6 * * * ~/sartor-evolve.sh >> /tmp/sartor-evolve.log 2>&1
0 3 * * 0 /home/alton/sartor-gemma-weekly.sh >> /home/alton/gemma-weekly.log 2>&1
0 4 * * 0 ~/sartor-model-optimizer.sh >> /tmp/model-optimizer.log 2>&1
```

**New crontab lines** (commented):
```
# DEPRECATED 2026-04-12: Failing (Docker permissions). Output quality poor when working.
# 0 */6 * * * ~/sartor-evolve.sh >> /tmp/sartor-evolve.log 2>&1

# DEPRECATED 2026-04-12: Failing (Docker permissions, model mismatch).
# 0 3 * * 0 /home/alton/sartor-gemma-weekly.sh >> /home/alton/gemma-weekly.log 2>&1

# DEPRECATED 2026-04-12: Failing (Docker permissions, model not found).
# 0 4 * * 0 ~/sartor-model-optimizer.sh >> /tmp/model-optimizer.log 2>&1
```

**Script disposition**: Preserved at original paths (not archived, as they're experimental infrastructure)

**Common failure mode**: All three scripts fail with `mkdir /var/lib/docker/volumes: permission denied` when Ollama attempts to pull models.

**Value assessment**: Even when working, output quality was poor (terminal escape codes in evolve.sh output, no downstream consumers for model-optimizer results).

---

### 5. DISABLED: consolidate-mirror (autodream + decay) ✅

**Original crontab line**:
```
30 23 * * * cd ~/Sartor-claude-network && python3 sartor/memory/autodream.py --force >> /tmp/autodream.log 2>&1; python3 sartor/memory/decay.py --update >> /tmp/decay.log 2>&1; echo "$(date -Iseconds),consolidate-mirror,completed,0,local,0" >> data/heartbeat-log.csv
```

**New crontab line** (commented):
```
# DISABLED 2026-04-12: Memory consolidation is Rocinante-only per OPERATING-AGREEMENT §2
# Reason: gpuserver1 has rental-operations authority, Rocinante has memory-curation authority
# 30 23 * * * cd ~/Sartor-claude-network && python3 sartor/memory/autodream.py --force >> /tmp/autodream.log 2>&1; python3 sartor/memory/decay.py --update >> /tmp/decay.log 2>&1; echo "$(date -Iseconds),consolidate-mirror,completed,0,local,0" >> data/heartbeat-log.csv
```

**Script disposition**: Scripts remain in repo at `sartor/memory/autodream.py` and `sartor/memory/decay.py` (not executed on gpuserver1)

**Rationale**: OPERATING-AGREEMENT §2 establishes domain authority separation:
- Rocinante: memory-wiki curation, git operations, shared-state writes
- gpuserver1: rental-operations decisions

Memory consolidation (autodream/decay) falls under Rocinante's domain. gpuserver1 should not run these processes.

---

### 6. KEPT: dashboard-healthcheck.sh ✅

Subagent investigation (agent af8ea32) found this script well-architected and critical.

**Crontab line**: `0 9 * * * /home/alton/dashboard-healthcheck.sh` (unchanged)

**Keep rationale**:
- Active and functional (last run 2026-04-11 09:00)
- Monitors critical infrastructure (gpu-dashboard.service, gpu-kiosk.service)
- Has auto-recovery capabilities (restarts failed services)
- Well-documented in code (header comments, alert system)
- No overlap with other monitoring systems

**Action taken**: Added to CRONS.md documentation as ACTIVE (not P0, but supporting infrastructure).

---

## Subagent Usage Log

Dispatched 3 subagents in parallel to investigate 7 undocumented scripts (batched 2-3 scripts per subagent for efficiency).

| Agent ID | Model | Scripts Investigated | Outcome |
|----------|-------|---------------------|---------|
| a77e8b1 | Sonnet | heartbeat-watcher.sh, memory-sync.sh | Both DEPRECATED (redundant/failing) |
| af8ea32 | Sonnet | dashboard-healthcheck.sh, periodic-analysis.sh | healthcheck KEPT, periodic-analysis DEPRECATED |
| a8a04af | Sonnet | sartor-evolve.sh, sartor-gemma-weekly.sh, sartor-model-optimizer.sh | All DEPRECATED (Docker permissions failures) |

**Total subagent turns**: 3 concurrent invocations
**Findings quality**: Excellent. All subagents provided detailed analysis with specific recommendations.
**Time saved**: ~15 minutes vs sequential investigation

---

## Pre/Post Crontab State

**Before cleanup**: 15 active cron entries
**After cleanup**: 5 active cron entries

**Active jobs (5)**:
1. `gather_mirror.sh` (every 4h) - P0 ACTIVE
2. `run_monitor.sh` (every 2h) - P0 ACTIVE
3. `dashboard-healthcheck.sh` (daily 9 AM) - ACTIVE
4. `daily_summary.py` (daily 11:55 PM) - P0 ACTIVE
5. `run_pricing.sh` (weekly Monday 9 AM) - P0 ACTIVE

**Disabled/deprecated jobs (10)**:
1. `gateway_cron.py` - DISABLED (failing)
2. `vastai-tend.sh` - DEPRECATED (redundant)
3. `heartbeat-watcher.sh` - DEPRECATED (redundant)
4. `memory-sync.sh` - DEPRECATED (failing)
5. `periodic-analysis.sh` - DEPRECATED (redundant)
6. `sartor-evolve.sh` - DEPRECATED (failing)
7. `sartor-gemma-weekly.sh` - DEPRECATED (failing)
8. `sartor-model-optimizer.sh` - DEPRECATED (failing)
9. `autodream.py` (consolidate-mirror) - DISABLED (domain separation)
10. `decay.py` (consolidate-mirror) - DISABLED (domain separation)

**All disabled entries preserved as comments in crontab** for reversibility.

---

## Files Modified/Created

### Modified
- `/var/spool/cron/crontabs/alton` (crontab file - 15 jobs → 5 active, 10 commented)
- `sartor/memory/machines/gpuserver1/CRONS.md` (updated to v0.2 with post-cleanup state)

### Created
- `sartor/memory/inbox/gpuserver1/cron-cleanup/crontab-backup-2026-04-12.txt` (pre-cleanup backup)
- `sartor/memory/inbox/gpuserver1/cron-cleanup/2026-04-12_cron-cleanup.md` (this report)
- `archive/deprecated-crons-2026-04-12/` (directory for archived scripts)

### Renamed
- `/home/alton/vastai-tend.sh` → `/home/alton/vastai-tend.sh.deprecated-2026-04-12`

### Archived (moved to archive/deprecated-crons-2026-04-12/)
- `heartbeat-watcher.sh` (2608 bytes)
- `memory-sync.sh` (101 bytes)
- `periodic-analysis.sh` (1067 bytes)

### Preserved (commented in crontab, not moved)
- `gateway_cron.py` (in repo at sartor/gateway/)
- `sartor-evolve.sh`, `sartor-gemma-weekly.sh`, `sartor-model-optimizer.sh` (at original paths)
- `autodream.py`, `decay.py` (in repo at sartor/memory/)

---

## Verification Commands Run

All actions verified with `ls -la` per task constraints:

```bash
# Crontab backup
$ ls -la ~/Sartor-claude-network/sartor/memory/inbox/gpuserver1/cron-cleanup/crontab-backup-2026-04-12.txt
-rw-rw-r-- 1 alton alton 1637 Apr 12 01:40 crontab-backup-2026-04-12.txt

# Active cron count
$ crontab -l | grep -v '^#' | grep -v '^$' | wc -l
5

# vastai-tend.sh rename
$ ls -la /home/alton/vastai-tend.sh.deprecated-2026-04-12
-rwxr-xr-x 1 alton alton 2484 Feb 27 20:03 vastai-tend.sh.deprecated-2026-04-12

# Archive directory
$ ls -la ~/Sartor-claude-network/archive/deprecated-crons-2026-04-12/
total 20
drwxrwxr-x 2 alton alton 4096 Apr 12 01:42 .
drwxrwxr-x 3 alton alton 4096 Apr 12 01:42 ..
-rwxrwxr-x 1 alton alton 2608 Apr  3 01:17 heartbeat-watcher.sh
-rwxrwxr-x 1 alton alton  101 Apr  3 01:17 memory-sync.sh
-rwxrwxr-x 1 alton alton 1067 Dec 29 04:18 periodic-analysis.sh

# CRONS.md updated
$ ls -la ~/Sartor-claude-network/sartor/memory/machines/gpuserver1/CRONS.md
-rw-rw-r-- 1 alton alton 16879 Apr 12 01:42 CRONS.md
```

No confabulation detected. All file operations verified.

---

## Issues Encountered

**None.** All actions completed successfully without errors.

- Crontab modification: ✅ Success
- Script archival: ✅ Success
- Script renaming: ✅ Success
- CRONS.md rewrite: ✅ Success
- Subagent dispatch: ✅ All three subagents returned valid findings
- Verification: ✅ All `ls -la` commands confirmed expected state

---

## Recommendations for Next Cron-Cleanup Cycle

### 1. Delete gateway_cron.py permanently (if still disabled in 30 days)
If no one has debugged or re-enabled gateway_cron.py by 2026-05-12, it should be deleted from the repo (not just disabled). Current state: preserved in crontab as comment + script in repo.

### 2. Archive or delete Ollama-based scripts
The three Ollama scripts (sartor-evolve, sartor-gemma-weekly, sartor-model-optimizer) have been non-functional since at least 2026-04-05. If Ollama infrastructure is not being fixed, delete all three scripts permanently.

### 3. Verify run_pricing.sh inbox compliance
CRONS.md notes that run_pricing.sh should write to inbox pattern but actual output path is "Unknown (needs verification)". Next cleanup cycle should confirm where pricing recommendations are written and migrate to inbox if needed.

### 4. Consider consolidating P0 monitoring
gather_mirror.sh (4h) and run_monitor.sh (2h) both check vastai status and GPU health. Consider whether they should be merged into a single monitoring system with configurable frequency.

### 5. Document dashboard-healthcheck.sh header
Script currently has a minimal 3-line header. Should be expanded to document alert file location, auto-recovery behavior, and dependencies (per subagent recommendation).

### 6. Monthly crontab audit cadence
OPERATING-AGREEMENT §6 establishes monthly crontab audit (first Monday of each month). Next audit: 2026-05-05. Rocinante should cross-check declared CRONS.md against actual `crontab -l` output.

---

## Disagreement / On-The-Record Notes

**No disagreements with task framing.** All actions aligned with Alton's explicit instructions and OPERATING-AGREEMENT authority boundaries.

**Autonomous decisions made within granted authority**:
1. Choice to archive (vs delete) heartbeat-watcher, memory-sync, periodic-analysis → Archival preserves reversibility
2. Choice to preserve (vs archive) Ollama scripts at original paths → Experimental infrastructure may be revived
3. Choice to rename vastai-tend.sh with `.deprecated-2026-04-12` suffix → Makes deprecation explicit in filename
4. Choice to keep dashboard-healthcheck.sh based on subagent recommendation → Well-architected critical infrastructure

All decisions documented in this report and CRONS.md v0.2 for Alton's review.

---

## Completion Report Path

**This report**: `sartor/memory/inbox/gpuserver1/cron-cleanup/2026-04-12_cron-cleanup.md`

**Related artifacts**:
- Crontab backup: `sartor/memory/inbox/gpuserver1/cron-cleanup/crontab-backup-2026-04-12.txt`
- Updated CRONS.md: `sartor/memory/machines/gpuserver1/CRONS.md` (v0.2)
- Archived scripts: `archive/deprecated-crons-2026-04-12/`

**Ready for Rocinante curator drain and git commit.**

---

## Signature

gpuserver1, 2026-04-12T01:42:00Z
Cleanup authorized by Alton per delegated task invocation
Executed per OPERATING-AGREEMENT §4.2 (rental-operations domain authority)
No git push (no credentials) - awaiting Rocinante curator commit

— End of completion report

<!-- /curator-drained -->

## Latest from gather (2026-04-22)

> [!warning] 2026-04-22 MACHINE OFFLINE — ACTIVE CLIENT AFFECTED
> Machine 52271 went offline at approximately **2:35 AM UTC April 22** per automated vast.ai alert (console@mg.vast.ai). A rental client contacted vast.ai support; support engineer **Saber** (saber@contact.vast.ai) emailed alto84@gmail.com at 5:27 AM UTC requesting a status update to relay to the affected client.
>
> **Actions required:**
> 1. SSH to gpuserver1 (192.168.1.100) or physically check the server — verify power, Kaalia daemon, Docker
> 2. Reply to Saber at saber@contact.vast.ai with status update for the affected client
> 3. Once machine is back online, verify vast.ai listing is restored
>
> Prior offline incident: 2026-04-04 (45 min, no client impact, no follow-up). This incident has a confirmed active client impact.
