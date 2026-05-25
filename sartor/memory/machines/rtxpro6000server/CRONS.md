---
type: machine_operations
entity: rtxpro6000server-crons
created: 2026-05-02
updated: 2026-05-02
updated_by: rtxpro6000server (Claude Opus 4.7) — vast.ai onboarding window
status: pre-deploy (scripts staged at ~/cron-scripts-staged/, NOT yet installed)
version: 0.1
last_verified: n/a — initial draft, no live crontab yet
related: [machines/rtxpro6000server/MISSION-v0.1, machines/gpuserver1/CRONS, OPERATING-AGREEMENT]
alerts:
  - "P1 (2026-05-02): the four staged cron scripts at ~/cron-scripts-staged/ are RECONSTRUCTED FROM SPEC, not adapted from gpuserver1's live source (SSH from rtxserver to gpuserver1 has no key configured). Each script's diff-summary header instructs the install pass to diff against the actual /home/alton/<script>.sh on gpuserver1 before deploying. DO NOT install to /home/alton/ on rtxserver until that diff has been performed."
---

# rtxpro6000server Cron Documentation v0.1

> [!warning] DOC PRECEDES DEPLOYMENT
>
> No cronjobs are active on rtxpro6000server as of this writing. The four scripts described below are STAGED at `~/cron-scripts-staged/` and have not been installed to `/home/alton/` or added to `crontab -e`. Activation is gated by:
> 1. Vast.ai listing fires successfully (steps 11-12 of the onboarding directive).
> 2. Cron scripts diff'd against gpuserver1's live versions (the staged versions are reconstructions from spec; see `~/cron-scripts-staged/<script>.sh` diff-summary headers).
> 3. Alton's explicit greenlight to write to `/home/alton/` and `crontab -e`.
>
> This document describes the INTENDED state. When activation happens, this doc is updated with the verified live state and `status:` flips to `active`.

---

## Operational Rhythm (Intended — 4 jobs)

- **Every 5 minutes**: NONE. (rtxserver does NOT run rgb_status.py — no OpenRGB rig.)
- **Every 30 minutes**: vastai-tend.sh (state-change-only vastai monitoring + min_chunk invariant check)
- **Every hour**: stale-detect.sh (vastai/GPU/disk/heartbeat freshness, plus thermal envelope checks)
- **Every 4 hours**: gather_mirror.sh (git pull + status snapshot to inbox)
- **Sundays 3am**: docker-weekly-prune.sh (containers + images + networks; NOT volumes; refuses if vastai container active)

**Total active jobs (intended)**: 4
**Hard cap reminder**: master plan §5 sets a 6-cron cap across both Sartor GPU machines. gpuserver1 uses 4 of those slots (gather_mirror, stale-detect, vastai-tend, rgb_status). I will use 4 (gather_mirror, stale-detect, vastai-tend, docker-weekly-prune). **Total: 8 — over the cap on paper.** Recommend revisiting the cap; it was set when only one Sartor GPU machine existed. Surface as inbox proposal at first activation.

---

## Active Cron Jobs (intended)

### 1. gather_mirror.sh

**Schedule**: `0 */4 * * *` (every 4 hours)
**Path (intended)**: `/home/alton/gather_mirror.sh`
**Path (staged)**: `/home/alton/cron-scripts-staged/gather_mirror.sh`
**Log**: `/home/alton/generated/cron-logs/gather_mirror.log`
**Purpose**: Git pull from origin main (with stash/pop discipline), write status JSON snapshot to `inbox/rtxpro6000server/status/`, update `~/sartor-heartbeat.json`.
**Behavior** (mirroring gpuserver1's):
- Stash push uses named marker (`gather_mirror-<epoch>`) and pops by name, not blind `stash pop`.
- On pull failure, write WARNING entry to `inbox/rtxpro6000server/alerts/` and exit non-zero.
- Status snapshot includes `vastai show machines` output, GPU temps (both cards), Tctl, disk %, memory, written as JSON to `inbox/rtxpro6000server/status/YYYY-MM-DDTHHmmZ.json`.
- Heartbeat written to `~/sartor-heartbeat.json` (picked up by stale-detect).
**State cache**: `~/sartor-heartbeat.json`
**Inbox writes**: `sartor/memory/inbox/rtxpro6000server/status/` (every run); `inbox/rtxpro6000server/alerts/` (failure only).

---

### 2. stale-detect.sh

**Schedule**: `0 * * * *` (hourly)
**Path (intended)**: `/home/alton/stale-detect.sh`
**Path (staged)**: `/home/alton/cron-scripts-staged/stale-detect.sh`
**Log**: `/home/alton/generated/cron-logs/stale-detect.log`
**Purpose**: Scan rtxpro6000server-authoritative entities for staleness signals.
**Checks (mirroring gpuserver1's, plus rtxserver-specific additions)**:
- vastai reachability (`vastai show machines` returns within 10s)
- GPU0 temp > 80 °C, GPU1 temp > 80 °C → alert
- **CPU Tctl > 75 °C** → alert (rtxserver-specific; flags single-card thermal pathology if it surfaces under a renter's workload)
- BMC PCIE03 / PCIE07 sensor sanity (compare to nvidia-smi GPU temps; flag drift >5 °C as sensor anomaly)
- BMC SEL: any new entries since last check (per the self-steward extension 2026-04-29) → flag Memory/Temperature/Fan/PSU events
- Disk usage on / and /home > 85 % → alert
- gather_mirror heartbeat freshness > 5 hours → alert
- Power cap drift: `nvidia-smi --query-gpu=power.limit` not equal to 450 W on either card → alert (catches reboot-without-systemd-unit case)
**Inbox writes**: `sartor/memory/inbox/rtxpro6000server/_stale-alerts/YYYY-MM-DD_HH.md` (one per hour slot, overwrite on re-run; no entry if all clear).
**Debounce**: one file per hour slot. No duplicate entries within the same hour.

---

### 3. vastai-tend.sh

**Schedule**: `*/30 * * * *` (every 30 minutes)
**Path (intended)**: `/home/alton/vastai-tend.sh`
**Path (staged)**: `/home/alton/cron-scripts-staged/vastai-tend.sh`
**Log**: `/home/alton/generated/cron-logs/vastai-tend.log`
**Purpose**: State-change-only vast.ai monitoring (machine listed/rented status) plus rtxserver-specific min_chunk invariant check.
**Behavior**:
- Reads `vastai show machines --raw`, parses listed/rented status. On state change (listed → unlisted, rented → unrented, etc.), writes inbox entry. On first run after reboot, establishes baseline and writes one entry.
- **rtxserver-specific addition**: parse `min_chunk` from the offer record. If `min_chunk != 2`, write a LOUD alert — this means someone (or something) reduced the minimum GPU bundle, exposing the single-card thermal pathology. The 2026-05-02 stress data shows single-card 450 W has Tctl margin of only 1 °C; renting one card alone is unsafe.
- **rtxserver-specific addition**: parse `power.limit` from machine offer. If listed power.limit > 450 W, alert.
**State cache**: `/tmp/vastai-tend-state.json` (ephemeral, resets on reboot).
**Inbox writes**: `sartor/memory/inbox/rtxpro6000server/_vastai/YYYY-MM-DDTHHmmZ-state-change.md` (state changes only).
**Key design**: state-change-only writes prevent inbox spam during idle periods.

---

### 4. docker-weekly-prune.sh (NEW — not on gpuserver1)

**Schedule**: `0 3 * * 0` (Sundays 3 AM)
**Path (intended)**: `/home/alton/docker-weekly-prune.sh`
**Path (staged)**: `/home/alton/cron-scripts-staged/docker-weekly-prune.sh`
**Log**: `/home/alton/generated/cron-logs/docker-weekly-prune.log`
**Purpose**: Prune stopped Docker containers, dangling images, unused networks. Vast.ai customer containers come and go; over months, dangling layers accumulate and can fill `/var/lib/docker`. This cron keeps the disk lean.
**Behavior**:
- Refuses to run if any vast.ai container is currently active (`docker ps --filter name=vastai -q | wc -l > 0`). Don't surprise a renter mid-rental.
- Captures `du -sh /var/lib/docker` before and after.
- `docker container prune -f`, `docker image prune -f`, `docker network prune -f`. **NOT** `docker system prune -af`. **NEVER** `docker volume prune` (vast.ai uses Docker volumes for renter persistent storage; pruning would destroy customer data).
**Inbox writes**: `sartor/memory/inbox/rtxpro6000server/_docker-prune/YYYY-MM-DD.md` with disk-saved summary.
**Why not on gpuserver1**: gpuserver1 has been running long enough that Alton has hands-on knowledge of its disk-fill rate; rtxserver is fresh, so a defensive auto-prune from day one is cheaper than waiting for the disk to fill mid-rental.

---

## What rtxserver does NOT run

- **rgb_status.py** — gpuserver1's MSI Coreliquid AIO has an OpenRGB-controllable ARGB header that reflects rental state via color. rtxserver has a Noctua NH-U14S TR5-SP6 air cooler with no ARGB; no equivalent visual signal exists. Skip.
- **gateway_cron.py / autodream / decay / sartor-evolve / sartor-gemma-weekly / sartor-model-optimizer** — all DEPRECATED on gpuserver1 per its CRONS.md v0.4. Not carried over.
- **Pricing review cron** — not yet on either machine. When implemented, will live on Rocinante (which has Chrome MCP for vast.ai web UI), not on the per-machine peers.

---

## Log Directory

All four active crons write to `/home/alton/generated/cron-logs/`:
- `gather_mirror.log`
- `stale-detect.log`
- `vastai-tend.log`
- `docker-weekly-prune.log`

Directory is created by each script on startup (`mkdir -p`). Gitignored (local-only).

---

## Inbox Pattern

| Cron | Inbox path | Trigger |
|------|-----------|---------|
| gather_mirror | `inbox/rtxpro6000server/status/` | every run (status JSON) |
| gather_mirror | `inbox/rtxpro6000server/alerts/` | pull failure only |
| stale-detect | `inbox/rtxpro6000server/_stale-alerts/` | any signal detected |
| vastai-tend | `inbox/rtxpro6000server/_vastai/` | state change OR min_chunk drift OR power.limit drift |
| docker-weekly-prune | `inbox/rtxpro6000server/_docker-prune/` | every run (one entry per Sunday) |

Rocinante curator drains these on its 06:30 / 23:00 passes and writes receipts to `inbox/_receipts/rtxpro6000server/`.

---

## Maintenance Protocol

This file is authoritative for rtxpro6000server cron operations. When adding, modifying, or removing crons:

1. Update this file first (bump `updated:` frontmatter and `version:`).
2. Write to `sartor/memory/inbox/rtxpro6000server/ops/` as a YAML-fronted proposal.
3. Wait for Rocinante to drain inbox and commit changes.
4. Only then modify actual crontab on rtxserver (via `crontab -e`).

**Never commit this file directly from rtxserver** (no GitHub credentials). All commits go through Rocinante's curator drain.

**First full audit due**: 7 days after activation (catches initial behavior drift).
**Routine audit cadence**: monthly, matched to gpuserver1's cadence so the two machines audit together.

---

## Activation Plan (intended sequence at vast.ai-listing-fire-time)

1. Diff each staged script against gpuserver1's live `/home/alton/<script>.sh`. Resolve discrepancies (Rocinante's call on which version is canonical for any divergence).
2. Copy verified scripts from `~/cron-scripts-staged/` to `/home/alton/` on rtxserver. `chmod +x` each.
3. `mkdir -p /home/alton/generated/cron-logs/`.
4. Add 4 lines to `crontab -e` per the schedule table above.
5. Wait one cycle of the longest-period cron (4h) to confirm gather_mirror writes a status entry.
6. Wait one Sunday for docker-weekly-prune to fire (or `bash docker-weekly-prune.sh` manually as a smoke test, validating the "refuses if vastai active" guard works).
7. Update this doc: bump `updated:`, change `status:` to `active`, populate `last_verified:` with the `crontab -l` snapshot date.

---

## GPU temperature trajectory logger (added 2026-05-25)

Beyond the four cron jobs above, this host also runs a continuous **GPU temperature trajectory logger** as a systemd user service:

- `gpu-temp-logger.service` (~/.config/systemd/user/, `Restart=always`, lingering enabled) → writes a ~30s-cadence CSV to `/home/alton/generated/cron-logs/gpu-temp-trajectory-97429-{rental_id}-YYYY-MM-DD.csv`
- `gpu-temp-summary.sh` (crontab `7 * * * *`) → reads the previous hour's rows, emits markdown digest to `inbox/rtxpro6000server/_temp-summary/`

Both are the unified-v2 version that runs on **both** rtxserver and gpuserver1. Full architecture / schema / operations: [[gpu-temp-logger-v2]] at `machines/gpu-temp-logger-v2.md`. v1 (manual bash launched under pts/0) was retired 2026-05-25; the systemd unit replaced it after the schema unification.

---

## Appendix: Crontab Syntax Quick Reference

- `*/5 * * * *` = every 5 minutes
- `*/30 * * * *` = every 30 minutes
- `0 * * * *` = hourly at minute 0
- `0 */4 * * *` = every 4 hours
- `0 3 * * 0` = Sundays at 03:00
