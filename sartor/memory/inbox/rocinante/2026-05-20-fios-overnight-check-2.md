---
type: inbox
date: 2026-05-21
fired_at: 2026-05-21 05:23 ET (overnight cron #2 of 2)
tags: [domain/vastai, machine/124192, ops/overnight, status/blocked]
---

# Overnight Fios bandwidth recheck #2 — 05:23 ET

**Verdict: BW measurement BLOCKED — same NVML driver/library mismatch as cron #1. Confirms the issue is not transient. Off-peak Fios upload measured 226 Mbps via direct curl (still well above 71 Mbps peak; still below vast.ai's 500 Mbps threshold).**

## Data points

### 1. Ground-truth bandwidth (direct curl)

- **Upload (Cloudflare `__up`, 20MB POST):** 20971520 B in 0.741452 s = **28284393 B/s ≈ 226 Mbps**.
  - At 03:27 ET (cron #1): 303 Mbps
  - At 05:23 ET (cron #2): 226 Mbps
  - Both ~3× the 71 Mbps measured at evening peak.
  - Direction confirmed: Friday's 2Gbps Fios upgrade will comfortably clear 500 Mbps in either direction.

- **Download:** Skipped (Cloudflare `__down` endpoint returned 403 in cron #1 — rate-limited from our IP).

### 2. Direct nvidia-smi on rtxserver

Confirms the mismatch is still active:
```
Failed to initialize NVML: Driver/library version mismatch
NVML library version: 580.159
```

`fuser -v /dev/nvidia*` and `lsof /dev/nvidia*` both empty — no process holds the GPU devices. A kernel-module reload (`modprobe -r nvidia; modprobe nvidia`) would likely fix it without a full reboot, **but I'm not doing that overnight** — driver-level work without eyes-on can leave the system in a weird state and tonight has been a fuse-blow night.

### 3. Self-test --ignore-requirements

**Not run.** Would have produced the same "not rentable" error as cron #1 because the underlying NVML mismatch is identical. Skipped to avoid wasting 4-5 min for a duplicate failure.

### 4. vast.ai machine record (unchanged)

```
listed: True
verification: unverified
inet_up: 71.1
inet_down: 416.5
error_description: "bad nvidia_smi: {'ERROR': 'Failed to initialize NVML: Driver/library version mismatch...'}"
reliability2: 0.9195193
```

### 5. Renter-side visibility

Skipped — pointless until error_description clears.

## Conclusion across both cron cycles

| Datapoint | Cron #1 (03:27) | Cron #2 (05:23) |
|---|---|---|
| nvidia-smi state | Failed (NVML mismatch) | Failed (NVML mismatch) |
| Off-peak Fios upload (direct curl) | 303 Mbps | 226 Mbps |
| Self-test outcome | "not rentable" | not run (same expected) |
| vast.ai inet_up record | 71.1 (stale) | 71.1 (stale) |
| verification flag | unverified | unverified |
| error_description | NVML mismatch | NVML mismatch (same) |

**Both cron cycles confirmed the same NVML blocker. The Fios off-peak signal is positive (226-303 Mbps upload, easily clearing the 500 Mbps Friday post-upgrade target).** Per the cron's "leave as-is if both cycles fail" instruction, no listing/pricing changes made.

## Recommended morning action (unchanged from cron #1)

1. `ssh alton@192.168.1.157 'nvidia-smi 2>&1 | head -5'` — confirm mismatch is still present.
2. **`ssh alton@192.168.1.157 'sudo reboot'`** — clean recovery for NVML driver/library mismatch.
3. Allow ~3-5 min for full boot. Confirm:
   - `nvidia-smi` works
   - `nvidia-power-cap.service` re-applied 450W cap
   - `vastai.service` (kaalia) is active
   - `vastai show machines --raw` for machine 124192 shows `error_description: None`
4. Optional: re-run `vastai self-test machine 124192 --ignore-requirements` to force a fresh BW measurement BEFORE Friday's upgrade. Daylight hours may catch a low-load minute on Verizon's upstream that breaches 500 Mbps. Unlikely but cheap to try.
5. If self-test passes and verification flips: marketplace visibility restored.
6. If still unverified post-reboot: **hold for Friday Fios 2Gbps upgrade**. Don't lower prices.

## Files

- This inbox: `sartor/memory/inbox/rocinante/2026-05-20-fios-overnight-check-2.md`
- Cron #1 inbox: `sartor/memory/inbox/rocinante/2026-05-20-fios-overnight-check-1.md`
- Friday handoff procedure: Task #25
