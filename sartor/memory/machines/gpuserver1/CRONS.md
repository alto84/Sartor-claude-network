---
type: machine_operations
entity: gpuserver1-crons
updated: 2026-04-16
updated_by: Rocinante cleanup pass (Opus 4.7, doc-only)
status: active
version: 0.4
last_verified: 2026-04-16 (SSH crontab -l snapshot earlier today)
related: [gpuserver1-MISSION, OPERATING-AGREEMENT, rental-operations]
alerts:
  - "p1 (2026-04-16): observed crontab on gpuserver1 has 4 active jobs, not 3. rgb_status.py (every 5m) is running but was never documented here. Either it was added without inbox proposal or this doc drifted. Alton review requested."
  - "p1 (2026-04-16): vastai-tend.sh active state reaffirmed. v0.3 already records the EX-5 resurrection (the earlier '2026-04-12 deprecated' label refers to the OLD vastai-tend.sh, preserved as vastai-tend.sh.deprecated-2026-04-12). No conflict, but easy to misread — flagging for clarity."
---

# gpuserver1 Cron Documentation v0.4

> [!warning] DOC-ONLY UPDATE — observed reality differs from v0.3
>
> Earlier today (2026-04-16) Rocinante observed `crontab -l` on gpuserver1 via SSH and saw **4 active jobs**, not 3. `rgb_status.py` (every 5 minutes) is the new entry that was never documented here. v0.3 also claimed `vastai-tend.sh` was "DEPRECATED 2026-04-12" in some prose lines while simultaneously listing it as RESURRECTED in §3 — both are technically true (old script deprecated, new design resurrected) but the wording confused a reviewer earlier today. v0.4 cleans this up.
>
> Per OPERATING-AGREEMENT §4.2, gpuserver1 owns its own crontab. This document was edited from Rocinante to match observed reality. **No crontab on gpuserver1 was modified by this update.** If gpuserver1 disagrees with this characterization it should write a correcting proposal to its inbox.

This document is authoritative for cron operations on gpuserver1. Last full SSH-verified audit: 2026-04-16.

---

## Operational Rhythm (Active Jobs Only — 4 as of 2026-04-16)

- **Every 5 minutes**: rgb_status.py (UNDOCUMENTED until v0.4 — see §4 and alerts)
- **Every 30 minutes**: vastai-tend (state-change-only, writes to inbox on change)
- **Every hour**: stale-detect (vastai/GPU/disk/heartbeat freshness check)
- **Every 4 hours**: gather_mirror (git pull + status snapshot to inbox)

**Total active jobs**: 4
**Hard cap reminder**: master-plan §5 sets a 6-cron cap across both machines; gpuserver1 is now using 4 of those slots (was 3 in v0.3).

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
**Supersedes**: run_monitor.sh (formerly every 2h), dashboard-healthcheck.sh (formerly daily)

---

### 3. vastai-tend.sh (RESURRECTED — EX-5; reaffirmed active 2026-04-16)
**Schedule**: `*/30 * * * *` (every 30 minutes)
**Path**: `/home/alton/vastai-tend.sh`
**Log**: `/home/alton/generated/cron-logs/vastai-tend.log`
**Purpose**: State-change-only vastai monitoring. Checks machine listed/rented status. Writes inbox entry only when state transitions (listed/unlisted, rented/unrented). On first run, establishes baseline and writes one entry.
**State cache**: `/tmp/vastai-tend-state.json` (ephemeral, resets on reboot)
**Inbox writes**: `sartor/memory/inbox/gpuserver1/_vastai/YYYY-MM-DDTHHmmZ-state-change.md` (state changes only)
**Key design**: State-change-only writes prevent inbox spam during idle periods. Timestamp in cache tracks last-check even when no change.
**Naming caveat**: the OLD vastai-tend.sh (ad-hoc alerts to `~/.vastai-alert`) was deprecated 2026-04-12 and preserved at `vastai-tend.sh.deprecated-2026-04-12`. The CURRENT script of the same name is the EX-5 redesign and has been continuously active since 2026-04-12. There is no contradiction; only naming reuse.

---

### 4. rgb_status.py (UNDOCUMENTED until 2026-04-16 — p1 alert)
**Schedule**: `*/5 * * * *` (every 5 minutes)
**Path**: unknown to Rocinante (gpuserver1 owns the crontab). Probable location: `/home/alton/rgb_status.py` based on naming convention.
**Log**: unknown
**Purpose**: unknown to Rocinante. Naming suggests it drives an RGB status indicator (case fan / front-panel LED?) reflecting some host signal — possibly rental status, GPU activity, or temperature. Fits the "ambient hardware status" pattern.
**Authorization trail**: no inbox proposal observed in `sartor/memory/inbox/gpuserver1/ops/`. No mention in v0.3, EX-5, or master-plan §5.
**Action requested from gpuserver1**: write an inbox entry describing what this script does, what state it touches, what it writes, and whether it should count against the 6-cron hard cap. If it is purely local-display (no inbox/git side effects) it may warrant an exemption; that exemption needs to be written down.
**Action requested from Alton**: review whether this addition is desired and whether it should remain.

---

## WHERE DID THE OTHERS GO

The briefing for this cleanup pass referenced 5 jobs that v0.2 of this doc (pre-EX-5) used to list as P0: `run_monitor.sh`, `gather_mirror.sh`, `daily_summary.py`, `run_pricing.sh`, `dashboard-healthcheck.sh`.

EX-5 (2026-04-12) folded all of those into the gather_mirror + stale-detect pair (or demoted them):

| Job | Previous schedule | EX-5 disposition | Script preserved at |
|-----|------------------|------------------|---------------------|
| `run_monitor.sh` | every 2h | Collapsed into stale-detect.sh | `/home/alton/sartor-monitoring/run_monitor.sh` (commented in crontab) |
| `dashboard-healthcheck.sh` | daily 9am | Folded into stale-detect.sh | `/home/alton/dashboard-healthcheck.sh` (commented in crontab) |
| `daily_summary.py` | daily 23:55 | Folded into gather_mirror 4h pass | `/usr/bin/python3 /home/alton/sartor-power/bin/daily_summary.py` (commented) |
| `run_pricing.sh` | weekly Mon 9am | Demoted to on-demand skill | `/home/alton/sartor-pricing/run_pricing.sh` (commented in crontab) |

`gather_mirror.sh` remains active as cron #1 above (rewritten EX-5). All four superseded scripts are still on disk and can be re-enabled by uncommenting if the consolidation proves wrong. Per gpuserver1's own audit on 2026-04-12, `crontab -l` showed all four as commented-out lines.

**Confirmation needed (2026-04-16):** are the four superseded scripts still commented in the live crontab, or were any of them re-enabled alongside `rgb_status.py`? Rocinante did not capture the full crontab text in the SSH session — only the count of active lines.

---

## Previously Deprecated Jobs (From v0.2 — Unchanged)

| Job | Status | Reason |
|-----|--------|--------|
| `gateway_cron.py` | DISABLED | JSON decode error every 30min (also see CLAUDE.md infrastructure table — flagged there as DISABLED in v0.4 of this doc) |
| `vastai-tend.sh` (old design) | DEPRECATED 2026-04-12 | Replaced by EX-5 redesign of same name; old script preserved as `vastai-tend.sh.deprecated-2026-04-12` |
| `heartbeat-watcher.sh` | DEPRECATED | Redundant |
| `memory-sync.sh` | DEPRECATED | Persistent git merge conflicts |
| `periodic-analysis.sh` | DEPRECATED | Superseded by run_monitor.sh (which itself has since been superseded by stale-detect.sh) |
| `autodream.py + decay.py` | DISABLED | Memory consolidation is Rocinante-only per OPERATING-AGREEMENT §2 |
| `sartor-evolve.sh` | DEPRECATED | Docker permission failures |
| `sartor-gemma-weekly.sh` | DEPRECATED | Docker/model mismatch |
| `sartor-model-optimizer.sh` | DEPRECATED | Docker permission failures |

---

## Log Directory

All four active crons should write to `/home/alton/generated/cron-logs/`:
- `gather_mirror.log`
- `stale-detect.log`
- `vastai-tend.log`
- `rgb_status.log` — UNCONFIRMED. The script may write elsewhere (stdout to mailx, syslog, journalctl, or nowhere).

Directory is created by each script on startup (`mkdir -p`). Gitignored (local-only).

---

## Inbox Pattern

Three of the four active crons write to `sartor/memory/inbox/gpuserver1/` subdirectories:

| Cron | Inbox path | Trigger |
|------|-----------|---------|
| gather_mirror | `inbox/gpuserver1/status/` | every run (status JSON) |
| gather_mirror | `inbox/gpuserver1/alerts/` | pull failure only |
| stale-detect | `inbox/gpuserver1/_stale-alerts/` | any signal detected |
| vastai-tend | `inbox/gpuserver1/_vastai/` | state change only |
| rgb_status.py | unknown — possibly none (local hardware-control only) | unknown |

Rocinante curator drains these on its 06:30/23:00 passes and writes receipts to `inbox/_receipts/gpuserver1/`.

---

## Maintenance Notes

**This file is authoritative for gpuserver1 cron operations.** When adding, modifying, or removing crons:

1. Update this file first (bump `updated:` frontmatter and `version:`)
2. Write to `sartor/memory/inbox/gpuserver1/ops/` as a YAML-fronted proposal
3. Wait for Rocinante to drain inbox and commit changes
4. Only then modify actual crontab (via `crontab -e`)

**Never commit this file directly from gpuserver1** (no git credentials). All commits go through Rocinante's curator drain.

**Last full audit**: 2026-04-12 (EX-11 re-verification — crontab -l confirmed 3 active lines)
**Partial audit**: 2026-04-16 (Rocinante observed 4 active lines, including undocumented rgb_status.py)
**Next audit due**: 2026-05-12 (monthly cadence) — gpuserver1 should produce a fresh `crontab -l` snapshot to inbox before then to resolve the rgb_status.py question.

---

## Appendix: Crontab Syntax Quick Reference

- `*/5 * * * *` = every 5 minutes
- `*/30 * * * *` = every 30 minutes
- `0 * * * *` = hourly at minute 0
- `0 */4 * * *` = every 4 hours
