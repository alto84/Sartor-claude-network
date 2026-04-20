---
type: report
id: 2026-04-19-rental-fixes-outcome
origin: gpuserver1
target: rocinante
created: 2026-04-19T19:45:00Z
status: completed
related: [OPERATING-AGREEMENT, MACHINES]
---

# Rental Monitoring Fixes — Outcome Report

Task received verbally from Alton (the specified task file `_tasks/2026-04-19_rental-monitoring-fixes.md` did not exist in gpuserver1 inbox; worked from Alton's relay of the three findings).

## Finding Verification

### Finding 1: tend-script bugs — CONFIRMED (two bugs)

**Bug A — Rental detection (critical):** `vastai show instances` is a *client-side* command showing instances you rent, not instances running on your machine as a host. The script was checking this for `$MACHINE_ID` — it would never match. The tend script has reported `rented=false` for its entire lifetime, even during the active rental that started Apr 5. Zero state-change events for rental were ever logged.

**Bug B — Case-sensitivity (minor):** JSON state file stored bare JSON booleans (`true`/`false`). Python's `json.load()` reads these as `True`/`False` (capitalized). The `print(str(...).lower())` call on the read side handled this, but every `/tmp` flush (reboot, tmpfile cleanup) caused a spurious "first run" state-change because the file disappeared. Not the case mismatch itself but the transient `/tmp` storage pattern.

### Finding 2: 258GB reclaimable Docker layers — CONFIRMED (257.9GB reported by `docker system df`)

Breakdown:
- 5 unused images: `vllm/vllm-openai` (32.2GB), `vastai/pytorch:cuda-12.8.1-auto` (35GB shared layers), 3 `vastai/test` images (15.4GB combined)
- 12.37GB build cache (41 entries, all inactive)
- 1 exited container (0B writable layer)

### Finding 3: Gateway/heartbeat failures — CONFIRMED

- Gateway process alive (since Apr 12) but idle — last request logged Apr 14. Returning 404 on GET /. Functional but unused.
- Heartbeat file still a placeholder from Apr 16 with epoch-zero timestamp. The `_tasks/2026-04-16_heartbeat-amendment.md` task was never executed.
- `stale-detect.sh` checks `/home/alton/sartor-heartbeat.json` which does not exist, so heartbeat_missing fires every hour.

### Container Cross-Check — CONFIRMED CUSTOMER

Container `C.34113802` (name follows kaalia `C.<instance_id>` convention) is a legitimate customer rental:
- Image: `vastai/pytorch_cuda-12.8.1-auto/ssh:latest`
- Labels: `maintainer: Vast.ai Inc`, CUDA 12.8.1
- Running since: 2026-04-05T00:46:22Z (2 weeks)
- Writable layer: 235GB
- Kaalia daemon active and managing it

### Price — CONFIRMED

`vastai show machines` shows `gpuD_$/h = 0.40`, `gpuI$/h = 0.35`, `rdisc = 0.40`. The $0.40/hr on-demand listing is live and correct.

## Implemented

### P1: Tend script patch (vastai-tend.sh) — DONE

Two fixes applied:
1. **Rental detection**: Replaced `vastai show instances | grep $MACHINE_ID` with `docker ps --format '{{.Names}}' | grep '^C\.'`. This checks for running kaalia-managed containers directly. Tested: correctly detects `rented=true` now.
2. **State serialization**: Changed JSON state file to store boolean values as quoted strings (`"true"`/`"false"` instead of bare `true`/`false`) so Python reads them as strings, eliminating the case mismatch entirely.

Script ran successfully post-fix: detected state change `rented: false->true` and wrote inbox entry.

### P2: Docker prune — DONE

Executed in safe order:
1. `docker container prune --force` — exited container could not be removed (may be kaalia-managed), 0B reclaimed
2. `docker image prune -a --filter "until=48h" --force` — removed 5 unused images, 15.05GB reclaimed
3. `docker builder prune --force` — 0B (cache entries still referenced by active image layers)

Net result: Docker partition went from 423GB used (25%) to 379GB used (22%). Freed 44GB. The remaining large user is the active customer container's 235GB writable layer (untouchable during rental).

Note: the 258GB "reclaimable" figure from `docker system df` was inflated by shared layers between images. Actual unique reclaimable space was ~44GB. After pruning, `docker system df` confusingly reports 270.1GB / 100% reclaimable for the single remaining image, but that image is in active use and cannot actually be reclaimed.

### P3: Weekly auto-prune cron — DONE

Created `/home/alton/docker-weekly-prune.sh` (executable). Added to crontab:
```
0 4 * * 0 /home/alton/docker-weekly-prune.sh
```
Runs Sunday 4am. Conservative: only removes stopped containers >24h old, unused images >72h old, and stale build cache. Logs to `/home/alton/generated/cron-logs/docker-prune.log`.

This brings gpuserver1 cron count to 5 (was 4): gather_mirror, stale-detect, vastai-tend, rgb_status, docker-weekly-prune.

## Deferred

- **Heartbeat implementation**: The `_tasks/2026-04-16_heartbeat-amendment.md` describes what's needed but is a separate task. The placeholder `_heartbeat.md` file and missing `sartor-heartbeat.json` are known issues. Not in scope for this fix.
- **Gateway investigation**: Running but idle since Apr 14. Not clear if it should be active or was intentionally backgrounded. Leaving as-is.

## Surprises

1. **`vastai show instances` is client-only**: This was the root cause of the rental detection failure. The command shows instances you're *renting from others*, not instances *running on your machine*. This means the tend script has never correctly detected a rental in its entire 7-day history. The fix (checking docker ps for `C.*` containers) is more reliable than any vastai CLI approach.

2. **Docker "reclaimable" is misleading**: `docker system df` reports space as "reclaimable" even when it's actively in use by a running container. The actual recoverable space was ~44GB, not the 258GB reported. Future monitoring should use `df -h /var/lib/docker` for ground truth.

3. **Exited container is phantom**: Container `c6bab256f462` appears in `docker ps -a` but cannot be removed. May be managed by kaalia's internal bookkeeping. Not a problem (0B writable layer).
