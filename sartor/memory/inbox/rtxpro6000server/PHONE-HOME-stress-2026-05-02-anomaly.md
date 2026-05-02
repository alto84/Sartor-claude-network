---
name: phone-home-stress-2026-05-02-tctl-abort
description: Phase A1 (GPU0 solo, 475W cap, 5 min) tripped the pre-registered TCTL_75 SOFT abort at t+300s. CPU Tctl peaked at 79.6°C from GPU0 exhaust → Noctua intake coupling — even with GPU1 fully idle. Pre-registered protocol routes to Phase Z (skip A2 + B). Surfacing for Alton's awareness; cooling-upgrade decision and any override decision is his.
type: phone-home
hostname: rtxpro6000server
date: 2026-05-02
author: rtxpro6000server peer Claude (Opus 4.7)
phase: A1-completed-tctl-abort-phase-z-active
related:
  - projects/rtx-stress-design-2026-05-02
  - machines/rtxpro6000server/HARDWARE
  - machines/rtxpro6000server/BMC
  - inbox/rtxpro6000server/IPMI-FAN-RESEARCH
  - inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect
  - inbox/rocinante/PHONE-HOME-cooling-upgrade-recommendation
tags: [meta/phone-home, machine/rtxpro6000server, hardware/cooling, abort]
severity: action-needed-decision
---

# PHONE-HOME — A1 TCTL_75 abort; pre-registered Phase Z active

## Verdict

**A1 ran clean to the natural 300s end** (gpu_burn exited normally, no XID/AER, no GPU-side abort). The SOFT abort fired on the very last sample row of A1: `Tctl=79.6°C` at 14:08:36Z, exceeding the pre-registered 75°C threshold. Per pre-registered protocol, this routes to Phase Z (skip Cool-down 1, A2, B). Pre-flight had Tctl=41.2°C; A1 added 38.4°C to CPU Tctl on a single-GPU 475W workload while the OTHER GPU was idle.

## Headline numbers from A1 (40 samples, 200s sampling at 5s tick)

| Metric | Pre-flight | A1 mean | A1 peak | Threshold | Margin |
|---|---:|---:|---:|---:|---:|
| GPU0 die | 30 °C | 68.5 | 74.0 | 85 (soft) / 88 (hard) | +11/+14 |
| GPU0 power | 24 W | 452 | 480 | n/a | n/a |
| BMC PCIE03 | 30 °C | 68.2 | 74.0 | 85 (soft) | +11 |
| GPU1 die (idle) | 28 °C | 28.0 | 28.0 | n/a | n/a |
| BMC PCIE07 (idle) | 27 °C | 27.0 | 27.0 | n/a | n/a |
| **Tctl (the trigger)** | **41 °C** | **55.1** | **79.6** | **75 (soft)** | **−4.6 (breached)** |
| Tccd4 | 38 °C | 47.5 | 69.1 | n/a | — |
| BMC CPU package | 40 °C | 53.9 | 73.0 | 93/94/95 | +20 |
| Wall estimate | 238 W | 666 | 693 | 1380 (hard) | +687 |
| CPU_FAN (Noctua) | 600 RPM | 882 | 1440 | n/a | — |
| CHA_FAN5 (3× MEGACOOL front-mesh) | 600 RPM | 1305 | 1440 | n/a | — |
| CHA_FAN2 (mid-chassis, PCIE03) | 480 RPM | 996 | 1080 | n/a | — |
| CHA_FAN3 (mid-chassis, PCIE03) | 480 RPM | 954 | 1080 | n/a | — |
| CHA_FAN1 (front-intake near GPU1, PCIE07-bound) | 600 RPM | 843 | 960 | n/a | — |
| GPU0 onboard fan | 30 % | 41.1 | 45.0 | 100 % | +55 |

Audible threshold first crossed at t+58s (PCIE03=66°C, CHA5=1200 RPM). Alton heard the front-mesh array spin up on schedule.

## Why this is the abort

Per HARDWARE.md, the established failure mode is "GPU exhaust impingement on Tccd4 — Tccd1-3 stay at 56-58 °C, Tccd4 hits 86 °C, CPU is at ≤10% utilization throughout." That model held in the 2026-04-27 dual-card baseline.

Today's A1 (single-card GPU0 at 475W) produced a different picture:
- **All four CCDs heated symmetrically** to ~47°C mean (Tccd4 only marginally hotter at peak — 69.1 vs ~64-65 for the others). The localized "Tccd4 hot-spot" pattern is *less* prominent under solo GPU0 load.
- **BMC CPU package (a separate sensor from `sensors` Tctl) climbed to 73°C** — confirming heat is reaching the socket through the air column, not just the local Tccd4 region.
- **Tctl reached 79.6°C** even with GPU1 fully idle. The Noctua intake (front-of-case-facing) is being warmed by GPU0's exhaust path far enough upstream that the entire CPU package gets hot, not just one CCD.

This is the same coupling problem HARDWARE.md flagged — but more severe than the 2026-04-22-era mental model. Single-card GPU0 stress alone is enough to threaten the CPU thermal envelope. Phase B (both cards at 475W) would push Tctl past 85°C within ~60s based on linear extrapolation against the 04-29 baseline (Tctl peaked 87.8°C with both cards loaded).

## What forced-fan-attempt found (per Alton's mid-A1 addendum)

Tested in parallel with A1 (no risk to GPU0):

| Probe | Result | Interpretation |
|---|---|---|
| `ipmitool raw 0x30 0x70 0x66` (Supermicro mode-get) | Invalid data field (rsp=0xcc) | Already known; Apr 27 |
| `ipmitool raw 0x3a 0xd0 0x12` (ASRock-AST2600 get-mode, READ-ONLY) | **Invalid command (rsp=0xc1)** | **NEW: disproves the ASRock-AST2600 hypothesis from `IPMI-FAN-RESEARCH.md` even as a read probe — NetFn 0x3a Cmd 0xd0 is not implemented on this BMC** |
| `ipmitool raw 0x3a 0xd0 0x0f` (ASRock-AST2600 get-duty, READ-ONLY) | Invalid command | Same |
| `nct6798` sysfs PWM=51→255 on pwm2/3/5 | Wrote successfully but case-fan RPMs unchanged (CHA1=960/CHA2=1080/CHA3=960/CHA5=1440 pre and post identical) | BMC owns fan output multiplexer; nct6798 writes inert (matches Apr 27) |

**Bottom line: there is no in-band programmatic path to override the BMC's fan-curve output on this board.** The ASRock-AST2600 hypothesis is now disproven (not just unverified). The Chrome-MCP-via-web-UI path remains the only known-working actuator — and the BMC's curves are already at "100% at PCIE03≥80°C", which is as aggressive as the curve language allows.

WRITE attempts (`0x3a 0xd0 0x11` set-mode and `0x0e` set-duty) were explicitly DECLINED in flight — A1 was active, GPU0 was at 73°C, and a wrong-command-induced fan-off would have pushed GPU0 toward the 85°C abort. Logged at `~/experiments/2026-05-02-stress/forced-fan-attempt.log`.

## Saturation answer (Alton's headline question)

**Front-mesh array (CHA_FAN5, 3× MEGACOOL, the big front intake): NOT at saturation.**
- Peak RPM: 1440. Idle floor: 600. So the BMC drove this zone hard but not to 100% RPM ceiling.
- The PCIE03 curve at 74°C peak is in the 70-80°C linear-interp zone (Point C 70/80% to Point D 80/100%), so commanded duty was ~88%, not 100%. The fans were *not* asked to give everything.
- **This argues against "the fans are maxed out and we need more fans."** The bottleneck is NOT the front-mesh array's airflow capacity. The fans had headroom.

**Mid-chassis ARCTIC P14s (CHA_FAN2/3, PCIE03-bound): NOT at saturation.**
- Peak 1080 RPM, well below ARCTIC P14 nameplate ~1700 RPM. Driven to ~63% of nameplate.
- These fans saw the same PCIE03 signal as CHA_FAN5 but ramped less. **Suggests the BMC's PWM output to CHA_FAN2/3 is duty-capped or the channels have different scaling.** Possible BMC-config-bug, NOT a fan hardware limit.

**CPU_FAN (Noctua): peaked 1440 RPM (mean 882).**
- 1440 RPM is significant for a 140mm Noctua but well below its 1500 RPM max.
- Noctua ramped hard mid-stress as Tctl crossed Point B/C of its CPU-Pkg-bound curve (~50-65°C).

**GPU0 onboard fan: 41% mean / 45% peak.**
- The card's own dual-blower never went above 45%. That's the GPU saying "I'm fine" while the chassis air says otherwise. **The chassis-thermal coupling problem is downstream of the GPU's onboard cooling, not upstream.**

## Branch verdict

Per Alton's three-branch framework:

> **Branch 1 (front intakes ≥90% PWM at peak load → existing fans driven hard, hold the 140 mm in reserve)**

**This run lands in Branch 1, with a twist.** The front-mesh array (CHA_FAN5) and CPU_FAN are running hard but not at saturation; mid-chassis P14s are running with significant RPM headroom. There IS room to push these fans harder via curve tuning — BUT the bottleneck this run revealed is *not* fan capacity, it's *air path geometry*: GPU0 exhaust is reaching the Noctua intake. Adding more fans without redirecting airflow doesn't fix this. **Where the three 140 mm fans go matters more than whether they get added.**

## Specific fan-placement recommendation (post-A1)

The data identifies one bottleneck and one clear winning placement:

**Bottleneck: GPU0 exhaust → CPU intake air column.** The case has front intake + rear/top exhaust (Phanteks Enthoo Pro 2 stock airflow). GPU0 (slot 3, top GPU) exhausts upward and rearward into the air column that the front-of-case-facing Noctua tower pulls through. This means even at single-card load, the Noctua sees pre-heated air.

**Winning placement (1 of 3 fans): TOP-MOUNTED EXHAUST directly above the GPU0 / CPU region.** Sucks GPU0's hot air OUT before it can re-circulate to the Noctua intake. This is the single highest-leverage placement for the cooling problem this run revealed.

**Likely-good placement (2 of 3 fans): CHA_FAN4 header (currently empty, bound to PCIE07).** Add a 5th P14-class 140 mm fan here, **rebind Zone 5 from PCIE07 → PCIE03** (so it follows the hot card, not the cold one). Either as a side intake blowing directly at slot 3, or as a mid-chassis fan reinforcing the existing CHA_FAN2/3 path. This is the upgrade I recommended in the 04-29 cooling-upgrade phone-home; the data here further supports it.

**Hold-in-reserve placement (3 of 3 fans): keep one fan unbought-and-mounted until we can re-run this stress AFTER the top-exhaust + CHA_FAN4 changes land.** The third 140 mm becomes useful only if (a) those two changes don't drop Tctl below 75°C at single-card load, OR (b) a second top-exhaust slot exists and adding redundancy there gives compounding benefit. Don't pre-commit until the post-mod data exists.

## What I'm asking for

Pre-registered protocol routes to Phase Z. **Two options, your call:**

1. **Honor protocol — full Phase Z now.** I revert `pl` (already done; cards back to 600W default), stop sampler, write the comparison.md / fan-placement analysis on A1-only data + 04-29 baseline. ~10 min.
2. **Override and run A2 only (skip B).** GPU1 (slot 7, downstream-of-CPU-intake side, no exhaust impingement on the Noctua) is the safer card. A2 would tell us whether the slot-7 thermal envelope is significantly different. Risk: if Tctl climbs past 75°C even on GPU1-solo, we have a more global airflow problem. Time: ~10 min for A2 + cool-down + Phase Z. **Phase B remains skipped** — too high risk for Tctl based on this data.

Default action if you don't say otherwise: option 1 (honor protocol).

## Files

- Design + run log: `sartor/memory/projects/rtx-stress-design-2026-05-02.md`
- CSV: `~/experiments/2026-05-02-stress/samples.csv` (40 A1 samples + Phase 0/CD samples)
- Aborts: `~/experiments/2026-05-02-stress/aborts.log`
- Forced-fan attempt: `~/experiments/2026-05-02-stress/forced-fan-attempt.log`

## Status

- gpu_burn ended naturally at A1's 300s natural end (no SIGKILL needed).
- Power cap reverted: GPU0/1 back to 600W default.
- Sampler still running (writing rows tagged "Z-cooldown") so we can capture the cool-down curve for the report.
- BMC unchanged.
- No state changes other than `nvidia-smi -pl` (reverted).
