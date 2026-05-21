---
type: inbox
date: 2026-05-21
fired_at: 2026-05-21 03:27 ET (overnight cron #1 of 2)
tags: [domain/vastai, machine/124192, ops/overnight, status/blocked]
---

# Overnight Fios bandwidth recheck #1 — 03:27 ET

**Verdict: BW measurement BLOCKED by new NVML driver/library mismatch on rtxserver. Vast.ai never got to measure off-peak bandwidth. NOT a verification flip.**

## Data points

### 1. Ground-truth bandwidth (direct curl, not via vast.ai)

- **Download:** Cloudflare's `__down?bytes=104857600` endpoint returned HTTP 403 (Cloudflare rate-limited or geoblocked our IP). Got 1 byte. Librespeed's garbage endpoint returned 404. **No reliable WAN download measurement obtained — endpoints were unreachable, not slow.**
- **Upload (Cloudflare `__up`, 20MB POST):** sent_bytes=20971520B in 0.552623s = **37949053 B/s = ~303 Mbps**. **This is 4× the 71.1 Mbps measured during evening peak.** Off-peak improvement is real.

### 2. Self-test --ignore-requirements result

**FAILED.** Exit code: 0 but content was an error:
```
Machine ID 124192 not found or not rentable.
Continuing despite unmet requirements because --ignore-requirements is set.
Machine ID 124192 not found or not rentable.
No valid offers found for Machine ID 124192
Test failed: No valid offers found.
```

vast.ai's pipeline classified the machine as "not rentable" despite `listed: True` in the host-side view. **No self-test instance spawned. No fresh BW measurement landed.**

### 3. bw_report

Unchanged. No new container created during this cycle, so no new bandwidth row. Latest stored measurement remains the one from instance 37190969 (`last_bwu: 129.0`).

### 4. vast.ai machine record

```
listed: True
verification: unverified
listed_gpu_cost: 1.2
listed_min_gpu_count: 2
inet_down: 416.5
inet_up: 71.1
reliability2: 0.9195 (slightly improved from 0.9054 last night)
current_rentals_running: 0
```

**NEW error_description (was None at lights-out):**
```
bad nvidia_smi: {'ERROR': 'Failed to initialize NVML: Driver/library version mismatch\nNVML library version: 580.159\n'}
```

### 5. Renter-side visibility

Not checked — pointless until error_description clears and verification re-runs.

## Root cause of the new error

`nvidia-smi` is failing on rtxserver because the NVIDIA driver kernel module (loaded at boot) is at one version while the userspace NVML library is at another (580.159). This almost always means an unattended package upgrade ran while we slept and replaced libnvidia* on disk without reloading the kernel module.

**Reboot fixes it.** That's the canonical recovery for this exact failure mode.

## Why I didn't reboot autonomously

1. Rebooting rtxserver triggers the dual-card driver/CUDA init sequence which can briefly draw >1100W. On the rearranged circuit this should be safe but tonight has been a fuse-blow night and Alton is asleep.
2. Without eyes-on, if the reboot triggers another blow, gpuserver1's rental could be collateral-damaged (it's been earning through tonight's chaos).
3. The error is **not in an emergency state** — gpuserver1 (the actual revenue machine) is unaffected. rtxserver was already not earning. The blocker just changed shape.

## Recommended morning action

1. SSH to rtxserver, confirm the NVML mismatch via `nvidia-smi`:
   ```
   ssh alton@192.168.1.157 'nvidia-smi 2>&1 | head -5'
   ```
2. Reboot rtxserver: `ssh alton@192.168.1.157 'sudo reboot'`. Allow ~3-5 min for full boot + GPU init.
3. After reboot, verify `nvidia-smi` works cleanly + power cap is at 450W (the systemd unit reapplies on boot).
4. Check vast.ai machine record — error_description should be None once the next kaalia sysinfo push completes (typically <1 min after boot).
5. Re-run `vastai self-test machine 124192 --ignore-requirements` to force a fresh BW measurement. Off-peak (early morning) is still ideal — if you wake up early enough the test might catch a higher BW window.
6. If BW still measures <500 Mbps, the Friday Fios upgrade (2Gbps) is the structural fix. Hold.

## What the 03:27 cycle confirmed

- **Off-peak Fios upload IS materially higher** (~303 Mbps vs 71 Mbps peak). When the Friday upgrade lands, the symmetric 2Gbps plan should comfortably clear 500 Mbps in either direction.
- The path to verification is intact (vast.ai cleared the OLD error description; the listing is live; only this new transient NVML issue is in the way).

## Cron #2 at 05:23 ET

Will still fire (CronCreate doesn't auto-cancel one based on another's outcome). It will probably hit the same NVML error unless rtxserver self-recovers (unlikely without reboot). Expect a near-identical inbox report for #2 with the same verdict.

## Files

- This inbox file: `sartor/memory/inbox/rocinante/2026-05-20-fios-overnight-check-1.md`
- Machine state: `vastai show machines --raw` on rtxserver
- Background task output: temp/bj86a0vcg.output
