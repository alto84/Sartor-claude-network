---
audit_date: 2026-05-26
auditor: Tooling-inventory agent (Opus 4.7)
scope: scheduled tooling that touches the vast.ai rental fleet
trigger: "Today rtxserver was earning ~$0 and we discovered it accidentally; no automated alert exists for 'zero rentals on host X for Y days'. 30+ min was spent on wrong diagnostic paths before `vastai self-test machine` gave the answer."
companion: doc-drift-findings.md (drift between docs and live `vastai show machines --raw`)
---

# Rental-Ops Tooling Inventory & Gaps — 2026-05-26

## Inventory: scheduled items that touch rentals

| Schedule | Item | What it does | Output route | Who/what notices on failure |
|---|---|---|---|---|
| **gpuserver1 cron** `*/30` | `vastai-tend.sh` | State-change-only: notes listed/unlisted, rented/unrented transitions for machine 52271 | `inbox/gpuserver1/_vastai/*-state-change.md` (silent if no change) + log | Curator drains the inbox; if no state changes, nothing fires regardless of why |
| **gpuserver1 cron** `0 *` | `stale-detect.sh` | Checks vastai CLI reachable, GPU >80C, disk >85%, heartbeat <5h | `inbox/gpuserver1/_stale-alerts/YYYY-MM-DD_HH.md` (only on signal) + log | Curator drain; no escalation channel |
| **gpuserver1 cron** `0 */4` | `gather_mirror.sh` | git pull + status JSON snapshot incl. `vastai show machines` | `inbox/gpuserver1/status/*.json` + log | Pull-failure path writes to `inbox/.../alerts/`; nothing watches it |
| **gpuserver1 cron** `*/5` | `rgb_status.py` | Drives OpenRGB color from rental state | local hardware only | Visual on the case — Alton must be physically present |
| **gpuserver1 cron** `7 *` | `gpu-temp-summary.sh` | Hourly GPU-temp digest | `inbox/gpuserver1/_temp-summary/` | none |
| **gpuserver1 systemd** | `vastai.service`, `sartor-monitor.service`, `sartor-power-logger.service`, `gpu-temp-logger.service` | kaalia daemon + power/temp loggers | logs / CSVs | nothing watches service-down |
| **rtxserver cron** `*/30` | `vastai-tend.sh` | Same shape as gpuserver1 (state-change only) for machine 124192 | `inbox/rtxpro6000server/_vastai/` + log | curator drain |
| **rtxserver cron** `33 *` | `stale-detect.sh` | Same shape as gpuserver1 | `inbox/rtxpro6000server/_stale-alerts/` | curator drain |
| **rtxserver cron** `17 */4` | `gather_mirror.sh` | Same shape as gpuserver1 | inbox/log | nothing |
| **rtxserver cron** `0 4 Sun` | `docker-weekly-prune.sh` | Disk hygiene | log | nothing |
| **rtxserver cron** `7 *` | `gpu-temp-summary.sh` | Hourly GPU-temp digest | `inbox/rtxpro6000server/_temp-summary/` | none |
| **rtxserver systemd** | `vastai.service`, `gpu-temp-logger.service` | kaalia + temp logger | logs/CSV | nothing watches |
| **Rocinante task** every 15min | Sartor Memory Mirror, Peer Sessions Mirror | repo + transcript mirror | logs | none |
| **Rocinante task** every 4h | Sartor Peer Creds Sync | refresh peer OAuth | logs | none |
| **Rocinante task** every ~4h | Sartor Registry Drift Check | (registry drift only; not vast.ai) | `inbox/rocinante/_memos/registry-drift/` | curator drain |
| **Rocinante task** daily 5:30 ET | `/daily-household-health` | Aggregates peer state, pings Calendar on yellow+ | `sartor/memory/daily/health-YYYY-MM-DD.md` | **No `health-*` file exists in `daily/` — the task is either not firing or producing no output. Calendar-ping channel for fleet anomalies is dead.** |

## What does NOT exist

1. **"No rentals for N days" detector.** Nothing alerts when a listed/verified host has zero `current_rentals_running` for >24h. This is exactly today's failure mode for rtxserver 124192 (listed and verified, idle, no notice).
2. **Live-state ↔ REGISTRY.yaml reconciliation.** REGISTRY.yaml carries `vast_ai_machine_id: 97429` for rtxserver; live is 124192. No cron pulls `vastai show machines --raw` and diffs against the registry. `check-registry.py` exists for IP/MAC drift only.
3. **Listing-parameter drift detector.** gpuserver1's listed price moved $0.30 → $0.80, min_bid $0.25 → $0.65 with zero doc updates and zero inbox entry — `vastai-tend.sh` only fires on rented/unrented and listed/unlisted, not on price-change.
4. **`self-test machine` health canary.** The diagnostic that resolved today's mystery in one shot is never run on a schedule. Add to stale-detect (24h cadence is enough).
5. **Earnings-trajectory alert.** No "earn_hour dropped to ~$0" trip; today rtxserver was at $0.003/hr and nobody noticed until we tripped over it conversationally.
6. **Escalation channel for inbox alerts.** stale-detect and vastai-tend write markdown; the curator drains it; no Calendar ping, no email, no dashboard breadcrumb. The `daily-household-health` Calendar pipeline that was supposed to be that channel has not produced output in 2026-05 (last `daily/health-*` file: none in current tree).
7. **Doc-vs-rtxserver/CRONS.md.** `machines/rtxserver/` directory doesn't exist; rtxserver CRONS.md lives at `machines/rtxpro6000server/CRONS.md` and is dated `status: pre-deploy` even though crons are live. Audit gap by name-mismatch.

## Recommendations (prioritized by reduction-in-blind-window-per-hour-of-effort)

1. **Add `idle-rental detector` to stale-detect on both hosts (≈30 min).** One line: if `listed=true` and `verification=verified` and `current_rentals_running=0` for ≥48h (track via `/tmp/idle-since.txt`), write a LOUD inbox alert. Today's failure becomes a 48h-bounded miss instead of unbounded. **Biggest win for least effort.**

2. **Extend `check-registry.py` (or new `check-vastai-state.py`) to reconcile live vast.ai against REGISTRY.yaml + write a daily snapshot to `machines/<host>/vastai-state-history/YYYY-MM-DD.json` (≈1-2 hrs).** Fixes the entire doc-drift class: machine_id, listed_gpu_cost, min_bid_price, verification, end_date. Closes the loop today's audit identified. Snapshot file becomes the audit trail for price-change events.

3. **Fix the `daily-household-health` Calendar-ping channel (≈1 hr to diagnose).** It's the existing yellow+ escalation pipeline, currently dead. Until it works, none of the inbox alerts reach Alton in real time. Without this, recommendation #1's "LOUD alert" is just another file the curator silently drains.

4. **Add weekly `vastai self-test machine <id>` to stale-detect (≈15 min).** The command that resolved today's diagnosis in one shot. Schedule weekly per host; treat non-clean output as RED. Catches NOC-side reachability problems without renter complaint as the trigger.

5. **Rename `machines/rtxpro6000server/` → `machines/rtxserver/` OR add a symlink/note (≈10 min).** REGISTRY.yaml says `hostname: rtxserver` with `aliases: [rtxpro6000server]`; doc-tree uses the alias as primary. Causes humans to look in the wrong place and AI to file at the wrong path. Cheap rename closes the gap.

Items 1+3 together are the minimum viable closure for the "rtxserver earning $0 invisibly" failure mode. Item 2 is the structural closure for the broader doc-drift problem. Items 4+5 are hygiene.

## Key paths
- Live cron source: `alton@gpuserver1:/home/alton/*.sh`, `alton@rtxserver:/home/alton/*.sh`
- Doc-of-record: `sartor/memory/machines/gpuserver1/CRONS.md`, `sartor/memory/machines/rtxpro6000server/CRONS.md`
- Inbox channels: `sartor/memory/inbox/{gpuserver1,rtxpro6000server}/_vastai/`, `.../_stale-alerts/`, `.../status/`
- Registry: `sartor/memory/machines/REGISTRY.yaml` + `check-registry.py`
- Dead Calendar pipeline: `/daily-household-health` skill; expected output `sartor/memory/daily/health-YYYY-MM-DD.md`
