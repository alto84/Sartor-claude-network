---
name: rtx-stress-design-2026-05-02
description: Thermal stress test design + run log + fan-placement analysis for rtxpro6000server. Solo-then-combined GPU stress at 475W/card to drive case fans audibly loud, characterize per-card thermal curves under the new BMC GPU-aware fan bindings (applied 2026-04-29), and produce evidence-based fan-placement recommendations for the three 140 mm fans Alton has on hand.
type: experiment-design
date: 2026-05-02
author: rtxpro6000server peer Claude (Opus 4.7)
status: executed-A1-only-tctl-abort-phase-z-complete
volatility: low
related:
  - machines/rtxpro6000server/HARDWARE
  - machines/rtxpro6000server/BMC
  - experiments/2026-04-27-thermal-baseline (last 475W dual-card baseline pre-binding)
  - experiments/2026-04-29-post-bmc-binding-stress (475W dual-card baseline POST-binding)
  - inbox/rocinante/PHONE-HOME-cooling-upgrade-recommendation (the marginal verdict that motivates this test)
tags: [meta/experiment, machine/rtxpro6000server, hardware/cooling, thermal-stress]
---

# RTX stress test design — 2026-05-02

## Pre-flight sensor snapshot (taken 2026-05-02, just before this design was drafted)

| Sensor | Value |
|--------|-------|
| GPU0 die temp | 30 °C |
| GPU0 power draw | 24 W |
| GPU0 onboard fan | 30 % |
| GPU0 power.limit | **600 W** (must be capped to 475 W in Phase 0) |
| GPU1 die temp | 28 °C |
| GPU1 power draw | 13 W |
| GPU1 onboard fan | 30 % |
| GPU1 power.limit | 600 W (same) |
| BMC PCIE03 | 30 °C |
| BMC PCIE07 | 27 °C |
| BMC CPU Package | 40 °C |
| CHA_FAN1 (PCIE07-bound) | 600 RPM |
| CHA_FAN2 (PCIE03-bound) | 480 RPM |
| CHA_FAN3 (PCIE03-bound) | 480 RPM |
| CHA_FAN4 | empty header |
| CHA_FAN5 (3× MEGACOOL on splitter, PCIE03-bound) | 600 RPM |
| CPU_FAN (Noctua) | 600 RPM |
| Tctl / Tccd1-4 | 41.2 / 37.5 / 38.1 / 37.5 / 37.8 °C |
| dmesg (last 1 hr): XID / AER / NVRM / thermal events | none |
| RAM | 4.8 / 251 GiB (per directive context) |
| Disk free | 999 G |

System is quiet, GPU-aware BMC curves at their floor (Point A = 30°C/30%), no warning indicators. Safe to start.

## Design principles

1. **Solo before combined.** GPU0 alone, then GPU1 alone, then both. Establishes per-card thermal curves under the post-binding fan regime before stacking thermal load.
2. **Probe the new BMC bindings in motion.** The 2026-04-29 stress showed bindings work but the system is at marginal-air-cooling capacity. This test deliberately drives the curves into Point C/D territory so Alton can hear the case fans roar AND the data captures how fast each PCIE-zone responds to its bound GPU.
3. **GPU0 is the priority signal.** It's the slot-3 hot card with the documented 11°C asymmetry. A1 (GPU0 solo) is the most informative phase. The whole test can be aborted after A1 if data already answers the fan-placement question.
4. **Conservative abort triggers.** 85°C die temp soft abort (gives margin to the 88°C hard limit and avoids tagging the GPU's own 87°C throttle floor). Tctl 75°C is conservative for CPU coupling — well under the 95°C throttle, but a 75°C climb during single-GPU stress would mean GPU exhaust→Noctua intake coupling is worse than the 04-29 measurement and we want to know that BEFORE Phase B doubles the heat input.
5. **Audible threshold = multi-signal.** Don't rely on one number; track three:
   - GPU onboard fan ≥ 60 % (the dual-blower workstation Blackwell becomes audible above this).
   - Any case fan (CHA_FAN1/2/3/5) tach ≥ 1300 RPM.
   - PCIE03 ≥ 65 °C (BMC curve crosses the audible-ramp inflection between Point B 55/50 and Point C 70/80; PCIE03 ≥ 65°C means PCIE03-bound zones are at ~65-70 % duty climbing).
6. **Single CSV file.** All metrics at 5s interval to one file with consistent timestamps. Easy post-run analysis.
7. **No permanent state changes.** Only `nvidia-smi -pl` writes (revert to 600 W in Phase Z). No BMC changes. No `/sys` writes. No kernel module loads.

## Phase plan (revised from Rocinante's draft)

| Phase | What | Power cap | Duration | Abort triggers | Notes |
|-------|------|-----------|----------|----------------|-------|
| **0. Prep** | Clone gpu-burn, build, set `nvidia-smi -i 0,1 -pl 475`, start CSV monitor, capture baseline-frozen sensor row | n/a | ≤3 min | gpu-burn build fail, pl-set fail | nvcc on box; if missing, fall back to torch-matmul harness from `experiments/2026-04-29-post-bmc-binding-stress/` |
| **A1. GPU0 solo** | `CUDA_VISIBLE_DEVICES=0 ./gpu_burn 300` | 475 W | 5 min | GPU0 ≥85°C, AER/XID, GPU0 fan%=100 + temp still rising, Tctl ≥75°C, wall ≥1380 W, BMC PCIE03 ≥85°C | Most informative phase. PCIE07-bound fans (CHA_FAN1, CHA_FAN4-empty) should NOT ramp; PCIE03-bound (CHA_FAN2/3/5) should ramp aggressively. This isolates the fan-binding response. |
| **Cool-down 1** | idle, monitor sensors continue | n/a | ≤120s, gated | drop until GPU0 die <50°C OR 120s elapsed (whichever first) | Allow chassis air column to settle so A2's GPU1 measurement isn't contaminated by A1's residual hot air. |
| **A2. GPU1 solo** | `CUDA_VISIBLE_DEVICES=1 ./gpu_burn 300` | 475 W | 5 min | GPU1 ≥85°C, AER/XID, fan%=100 + climbing, Tctl ≥75°C, wall ≥1380 W, BMC PCIE07 ≥85°C | Symmetric to A1 but for the cool-slot card. PCIE07-bound fans should ramp; PCIE03-bound should NOT (or only mildly via shared chassis air). |
| **Cool-down 2 + Phase B gate** | both GPUs idle; compute projected combined peak from A1+A2 + 5°C shared-ambient uplift | n/a | ≤180s, gated | both GPUs <50°C; if projected ≥86°C, scale Phase B (cap to 425W or duration to 5min); if projected ≥88°C SKIP B and report | The decision point. If A1 and A2 both peaked at 75°C solo, projected B is ~80°C+5=85°C → run B as planned. If A1 peaked at 80°C solo, projected B is 85°C+ → de-rate. |
| **B. Both cards concurrent** | two gpu_burn processes, one per GPU | 475 W ea | 10 min, with 5-min checkpoint | either ≥88°C, AER/XID, Tctl ≥75°C, wall ≥1380 W, fan saturation + climbing | At 5-min checkpoint: if either GPU >82°C and still climbing, abort early. If both stable < 82°C, continue full 10 min. |
| **Z. Cool-down + revert** | `nvidia-smi -i 0,1 -pl 600`, stop CSV monitor, capture final snapshot | n/a | ≤5 min | n/a | Confirm pl reverted; record any other state changes for the report. |

**Total wall-clock:** ~30-35 min. Fits the 45 min budget with headroom.

**No Phase A0 (350W ramp):** Skipped because the 2026-04-27 + 2026-04-29 baselines already characterize the 475W dual-card curve. What's NEW today is the per-card 475W solo curve under the post-binding fan regime — A1 and A2 collect that data. A0 would only delay Alton's first audible-fan moment without adding info we don't have.

**Optional Phase C (475W → 500W brief, only on Alton's call):** If Phase B clears with margin (peak < 82°C, no abort triggers), bump to 500W/card for 30 seconds as breaker-margin probe. Pre-context says 500W "tags the breaker"; this would confirm or refute. NOT run by default. Only if Alton greenlights at the Phase B cool-down boundary.

## CSV monitor — schema

Single file: `~/experiments/2026-05-02-stress/samples.csv`, 5-second interval, columns:

```
ts_iso, ts_epoch, phase,
gpu0_temp_c, gpu0_pwr_w, gpu0_util_pct, gpu0_fan_pct, gpu0_sm_mhz, gpu0_mem_mhz,
gpu1_temp_c, gpu1_pwr_w, gpu1_util_pct, gpu1_fan_pct, gpu1_sm_mhz, gpu1_mem_mhz,
bmc_pcie03_c, bmc_pcie07_c, bmc_cpupkg_c,
bmc_cpufan_rpm, bmc_cha1_rpm, bmc_cha2_rpm, bmc_cha3_rpm, bmc_cha5_rpm,
cpu_tctl_c, cpu_tccd1_c, cpu_tccd2_c, cpu_tccd3_c, cpu_tccd4_c,
wall_estimate_w
```

`wall_estimate_w = gpu0_pwr_w + gpu1_pwr_w + 200` (200W system baseline; matches 04-27 calibration where 2×475W GPU = 1350W system).

`phase` is set by the launcher script via a small file (`~/experiments/2026-05-02-stress/.phase`) the sampler reads each tick.

## Abort decision logic — explicit

At every 5s sample tick the sampler evaluates the abort triggers and writes `ABORT-<reason>` into the CSV row + a separate `aborts.log`. The phase orchestrator polls `aborts.log`; if any entry, immediate gpu_burn kill + Phase Z.

Specific triggers (already in the table; collected here for orchestrator reference):

- `GPU_TEMP_85`: any GPU die ≥85°C → soft-abort current solo phase
- `GPU_TEMP_88`: any GPU die ≥88°C → hard-abort + Phase Z immediately (skip remaining)
- `TCTL_75`: CPU Tctl ≥75°C → soft-abort (concerning Noctua-intake coupling); Phase Z
- `WALL_1380`: estimated wall draw ≥1380 W → hard-abort + Phase Z
- `FAN_SAT_RISE`: any GPU onboard fan = 100% AND temp delta over last 30s > 0 → fan-saturation; abort + report (this is the "the fans tried but lost" signal; the central failure mode for fan-placement decision-making)
- `XID_OR_AER`: any new dmesg entry containing `Xid`, `nvrm:`, `AER:`, or `thermal` since phase start → hard-abort
- Plus per-phase specific PCIE03/PCIE07 ≥85°C (redundant signal to die-temp; included for sensor-divergence detection)

## Phone-home triggers

Write `~/Sartor-claude-network/sartor/memory/inbox/rtxpro6000server/PHONE-HOME-stress-2026-05-02.md` if any of:

- AER/XID error in dmesg during any phase
- Fan saturation (≥99%) with rising temp at any tick
- Temperature breach of 88°C on either GPU
- CPU Tctl ≥75°C
- Plan-revision concern that I cannot resolve myself
- Wall power estimate ≥1400 W (separately from 1380 W abort — the 1400W phone-home means we got within 20W of the breaker even with the 1380W safety abort active)
- Per-card asymmetry > 13°C during A1+A2 cross-comparison (existing slot-3 hot-card phenomenon has worsened since 2026-04-22)

If clean: no phone-home; just commit results.

## Budget

| Resource | Allocated | Use |
|----------|-----------|-----|
| Wall-clock | ≤45 min | ~30-35 min planned; 10 min headroom for cool-downs and unforeseen |
| Watts-hours | ≤600 Wh | A1: ~40 Wh; A2: ~40 Wh; B: ~160 Wh; idle padding ~30 Wh; total ~270 Wh wall |
| Disk write | ≤200 MB | CSV ~3600 lines × ~250 chars = ~1 MB; gpu-burn build ~200 MB; total <250 MB |
| GPU memory | up to 70 GB/card | gpu-burn defaults to ~80% VRAM = ~78 GB on this card |
| State changes | only `nvidia-smi -pl` (reverted in Phase Z) | nothing else |

## Reverted-state confirmation

| Field | Pre-test | During | Post-revert | Confirmed? |
|-------|----------|--------|-------------|------------|
| GPU0 power.limit | 600 W | 475 W | **600 W** | **YES** (`nvidia-smi` 2026-05-02T14:09:30Z) |
| GPU1 power.limit | 600 W | 475 W | **600 W** | **YES** (same call) |
| BMC fan curves / bindings | post-04-29 config | unchanged | unchanged | YES — BMC was never touched in this run |
| `/sys/class/hwmon/hwmon2/pwm{2,3,5}_enable` | 5 (BIOS auto) | 1 (manual; forced-fan attempt) | **5 (restored)** | **YES** (restore line in `forced-fan-attempt.log`) |
| `/sys/class/hwmon/hwmon2/pwm{2,3,5}` | 51/153/153 | 255/255/255 (during attempt; ignored by BMC) | restored to BIOS values via enable=5 reasserting | YES |
| Sampler process | not running | PID 1277227 | stopped 14:14:48Z | YES |
| gpu_burn process | not running | PID 1278207 (A1 only) | exited naturally at A1+300s | YES |
| dmesg | no XID/AER/NVRM/thermal in 24h | none during test | none | YES (verified twice) |

## Live run log

### Phase 0 — Prep (2026-05-02T14:02:55Z → 14:03:35Z)
- gpu-burn pre-built at `/opt/gpu-burn/gpu_burn` (no compile needed)
- `sudo nvidia-smi -pl 475` set on both cards (was 600 → 475 W)
- Sampler started PID 1277227, 47-column CSV at 5s tick
- Phase tag = `Phase0`
- 5 samples captured. Idle baseline confirmed: GPU0 30°C, GPU1 28°C, all PCIE-bound zones at curve floor (CHA1/5=600 RPM, CHA2/3=480 RPM)

### Phase A1 — GPU0 solo @ 475W (2026-05-02T14:03:36Z → 14:09:00Z, 5:24 wall, 40 samples)
- `CUDA_VISIBLE_DEVICES=0 /opt/gpu-burn/gpu_burn 300` PID 1278207, exited naturally at t+300s
- **AUDIBLE THRESHOLD CROSSED at t+58s**: PCIE03=66°C, GPU0 fan=38%, CHA_FAN5 (3× MEGACOOL front-mesh)=1200 RPM. Alton confirmed audible by ear.
- Forced-fan addendum probes (parallel, non-blocking on A1):
  - `ipmitool raw 0x30 0x70 0x66` (Supermicro mode-get) → Invalid data field (rsp=0xcc). Known.
  - `ipmitool raw 0x3a 0xd0 0x12` (ASRock-AST2600 get-mode, READ-ONLY) → **Invalid command (rsp=0xc1)**. NEW: disproves the ASRock hypothesis from `IPMI-FAN-RESEARCH.md` even as a read probe.
  - `ipmitool raw 0x3a 0xd0 0x0f` (ASRock-AST2600 get-duty, READ-ONLY) → Invalid command. Same.
  - nct6798 sysfs PWM=51→255 on pwm2/3/5: writes succeeded but BMC ignored — case-fan RPMs identical pre/post (CHA1=960, CHA2=1080, CHA3=960, CHA5=1440).
  - WRITE attempts on the ASRock command space (0x3a 0xd0 0x11 set-mode and 0x0e set-duty) explicitly DECLINED with A1 active and GPU0 at 73°C. Logged at `forced-fan-attempt.log`.
  - **Conclusion: BMC owns fan output entirely; no in-band programmatic override available on this BMC firmware.**
- A1 peak readings (40 samples):

| Metric | Pre-flight | Mean | Peak | Threshold | Margin |
|---|---:|---:|---:|---:|---:|
| GPU0 die | 30 | 68.5 | 74.0 | 85 soft / 88 hard | +11 |
| BMC PCIE03 | 30 | 68.2 | 74.0 | 85 | +11 |
| GPU0 power | 24 | 452 | 480 | (cap 475) | n/a |
| GPU1 die (idle) | 28 | 28.0 | 28.0 | n/a | n/a |
| BMC PCIE07 (idle) | 27 | 27.0 | 27.0 | n/a | n/a |
| **CPU Tctl** | **41** | **55.1** | **79.6** | **75 soft** | **−4.6 (BREACHED)** |
| Tccd4 | 38 | 47.5 | 69.1 | n/a | — |
| BMC CPU Pkg | 40 | 53.9 | 73.0 | 93 | +20 |
| Wall estimate | 238 | 666 | 693 | 1380 hard | +687 |
| GPU0 onboard fan | 30% | 41.1% | 45.0% | 100% | +55% |
| CPU_FAN (Noctua) | 600 | 882 | 1440 | (max ~1500) | small |
| CHA_FAN5 (3× MEGACOOL) | 600 | 1305 | 1440 | (~1700 nameplate) | +260 |
| CHA_FAN2 (mid, PCIE03) | 480 | 996 | 1080 | (~1700 nameplate) | +620 |
| CHA_FAN3 (mid, PCIE03) | 480 | 954 | 1080 | (~1700 nameplate) | +620 |
| CHA_FAN1 (front, PCIE07) | 600 | 843 | 960 | n/a | — |

- **ABORT TRIGGERED 2026-05-02T14:08:36Z**: `SOFT|TCTL_75|Tctl=+79.6|phase=A1`. Fired on the very last A1 sample tick — gpu_burn exited naturally at 300s, no SIGKILL needed. Pre-registered protocol routes to Phase Z (skip CD1 / A2 / B).
- No XID, no AER, no NVRM, no thermal events in dmesg during A1.

### Cool-down + Phase Z (2026-05-02T14:09:00Z → 14:14:45Z)
- `nvidia-smi -pl 600` reverted both cards to default
- Sampler continued for 33 cool-down samples (~165s) before stop
- Recovery curve:
  - Tctl: 79.6 → 49.4°C peak in cool-down (recovers fast, ≤2 min to <50°C)
  - GPU0: 74 → 31°C
  - PCIE03: 74 → 30°C
  - CHA_FAN5: 1440 → 720 RPM cool-down peak (still warmer than idle 600)
  - CHA_FAN2/3: 1080 → 600 RPM peak in cool-down
- Sampler stopped cleanly at `Z-done` phase.

### Phase A2 — SKIPPED (per pre-registered Phase Z route on TCTL_75 trigger)

### Phase B — SKIPPED (same)

### Phone-home filed
`sartor/memory/inbox/rtxpro6000server/PHONE-HOME-stress-2026-05-02-anomaly.md` — Tctl breach, forced-fan-attempt findings, branch verdict, and option-1-vs-option-2 surfaced for Alton.

## Fan-placement analysis

### Headline

**The bottleneck is not fan capacity. It is the GPU0 → CPU intake air column.** The three 140 mm fans should be deployed by air-path geometry, not by adding redundant fans to already-cool zones. The single highest-leverage placement is **a top-mounted exhaust above the GPU0/CPU region** to break the recirculation loop revealed by today's A1 data.

### Bottleneck identification (evidence-based)

The candidates from the directive were: GPU0 inlet temp, GPU1 inlet temp, CPU intake, or case exhaust. Today's A1 data discriminates:

1. **GPU0 inlet temp — NOT the bottleneck.** GPU0 die peaked at 74°C under solo 475W stress. The card's own onboard fan never went above 45%. PCIE03 BMC sensor matched the die exactly. The card's intake is being supplied with adequate-temperature air.
2. **GPU1 inlet temp — NOT applicable.** GPU1 was idle at 28°C; PCIE07 stayed at 27°C. The cool-slot card's airpath is fine.
3. **Case exhaust — UNKNOWN BUT SUSPECTED.** No motherboard-attached rear/top exhaust fans were tach-readable today; if the Phanteks Enthoo Pro 2's stock rear/top fans are running, they're not on the BMC. We have no telemetry on whether stock exhaust is keeping up with GPU0's heat output.
4. **CPU intake — THE BOTTLENECK.** CPU Tctl peaked at 79.6°C with **GPU1 fully idle**. The Noctua NH-U14S is front-of-case-facing; its intake is downstream of GPU0's exhaust path. BMC CPU Package independently confirmed 73°C (a separate sensor from `sensors`-reported Tctl). All four CCDs heated symmetrically (mean ~47°C), Tccd4 only marginally hotter at 69°C peak — different from the 04-22-era model that flagged Tccd4 as the localized hot-spot. Today's pattern says the entire socket is being warmed by warmed intake air, not localized exhaust impingement on one CCD.

The 04-29 dual-card stress had Tctl peak 87.8°C. Today's single-card-only test extracted 79.6°C. The marginal 8.2°C lift from "GPU0 alone" to "GPU0 + GPU1" is consistent with the *GPU0 contribution dominating* the CPU intake heating, not GPU1. **Slot 3 → Noctua coupling is the dominant air-path failure on this build.**

### Asymmetry hypothesis evaluation

The directive asked whether the documented 11°C GPU0 vs GPU1 asymmetry implies slot 3 is air-starved. Today's data adds nuance:

- We did NOT directly compare GPU0-solo vs GPU1-solo (A2 was skipped). So the asymmetry is not directly re-measured today.
- However, the 04-27 baseline (GPU0 83°C, GPU1 72°C, both at 475W concurrent) and the 04-29 baseline (GPU0 84°C, GPU1 73°C, post-binding) both reproduce the +11°C asymmetry. It is robust across the binding change.
- Today: with **only** GPU0 loaded, PCIE07 stayed at 27°C — confirming the cool slot does not heat from GPU0's exhaust crossing the chassis. This rules out "shared chassis air heats GPU1" as the asymmetry mechanism.
- The asymmetry is therefore most consistent with **slot-3-specific intake-air starvation** (slot 3 sits higher in the chassis, possibly catching less direct front-fan flow than slot 7).

A side intake fan blowing **directly at slot 3** is a plausible asymmetry-fix. But it does NOT solve the GPU0→CPU coupling — it would lower GPU0's die temp by improving its inlet, while leaving the exhaust still rising into the Noctua's intake.

### Top-exhaust hypothesis evaluation

The directive asked: would top-mounted exhaust help the GPU0→Noctua intake coupling?

**Yes, and the data says this is the highest-leverage placement.** Today's A1 produced 79.6°C Tctl with GPU1 idle. The heat path is:
1. GPU0 power dissipation → GPU0 onboard fans → exhaust upward and rearward
2. Exhaust rises into the chassis air column above the cards
3. Noctua tower (front-of-case-facing intake) pulls some of that warmed air directly through the fins
4. CPU heats up. Tctl rises. Tccd4 hot-spot less prominent than expected because the heat is general not localized.

A top-mounted exhaust fan **above the GPU0/CPU region** intercepts step 2 — pulling GPU0 exhaust out of the chassis BEFORE it can recirculate to the Noctua intake. Phanteks Enthoo Pro 2 has top-mount slots. This is the structural fix.

### "Are existing fans saturated?" — the post-run answer to Alton's headline question

The forced-fan addendum tested whether we could programmatically push the fans harder. **Conclusion: no, but it's not the binding/curve. The fans are NOT saturated.**

| Zone | Fan(s) | Peak A1 RPM | % of nameplate | Saturation? |
|------|--------|-------------:|---------------:|-------------|
| CHA_FAN5 (front-mesh) | 3× MEGACOOL on splitter | 1440 | ~85% (assuming 1700 max) | No, ~15% headroom |
| CHA_FAN2/3 (mid-chassis) | 1× ARCTIC P14 PWM each | 1080 | ~64% (1700 nameplate) | **No, ~36% headroom — significantly under-driven** |
| CHA_FAN1 (front, PCIE07-bound) | 1× ARCTIC P14 PWM | 960 | ~56% (windmilling: PCIE07 was idle, fan ramped from chassis-air pickup) | No |
| CPU_FAN (Noctua) | NF-A15 on Noctua tower | 1440 | ~96% (1500 max) | Approaching but not at saturation |
| GPU0 onboard | dual blower | 45% | 45% | No, ~55% headroom |

**Branch verdict:** This run lands in a hybrid of the directive's three branches:
- **Branch 1 partial-yes** (front-mesh array driven hard at ~85%, CPU fan pushed near max) — but with caveat below.
- **Branch 2 partial-yes for the mid-chassis P14s.** CHA_FAN2/3 ran at 1080 RPM peak despite seeing the same PCIE03 signal as CHA_FAN5 (which hit 1440). That's a 26% under-driven differential between zones bound to identical sources. Possibilities: (a) BMC PWM scaling differs per zone (firmware quirk), (b) different fan-cable wiring, (c) the splitter cable on CHA_FAN5 carries one tach which always reports the fastest of the three. Worth a follow-up but not blocking the upgrade decision.
- **Branch 3 ruled out.** All BMC fans are tach-readable. nct6798 hwmon also reports tachs cleanly.

**The headline answer: front-mesh and mid-chassis fans had RPM headroom; the bottleneck is air-path geometry, not fan output.** Adding a third or fifth high-CFM intake fan to either zone improves the same air column that is already failing to keep CPU intake cool.

### Recommended placement for the three 140 mm fans

Listed in priority order. Each placement is justified by a specific data finding from this run.

#### Fan #1 — TOP-MOUNTED EXHAUST above the GPU0/CPU region (highest leverage)
- **Why:** Today's A1 Tctl=79.6°C with GPU1 idle proved GPU0 exhaust → Noctua intake coupling is the dominant CPU-thermal mechanism on this build. Top exhaust intercepts the air column before recirculation.
- **Connector:** If a free CHA_FAN6 or W_PUMP+ header exists on the motherboard (W_PUMP+ is currently empty per BMC.md), wire the new fan to one of those and bind that zone's BMC source to **CPU Pkg Temp** (not PCIE03 — top exhaust should respond to CPU-side heat). If no free header, use a CHA_FAN5 splitter spare lead.
- **Expected effect:** Drop Tctl peak from 79.6°C (single-card 475W) to ~70°C; drop Tctl peak under dual-card 475W from 87.8°C to ~80°C. Quantitative confirmation requires re-running A1+A2+B AFTER installation.
- **Open question:** Is there a free top-mount slot in the Phanteks Enthoo Pro 2 ABOVE the GPU/CPU? The case supports up to 3× 140 mm top-mount, so probably yes; physical inspection needed.

#### Fan #2 — CHA_FAN4 header, mid-chassis side bracket aimed at slot 3 (asymmetry-fix)
- **Why:** CHA_FAN4 is currently empty (per BMC.md and verified today: tach reads "na/Disabled"). The 11°C GPU0/GPU1 asymmetry persisted across the BMC binding change and is most consistent with slot-3 intake starvation. A side-bracket fan blowing at slot 3 would equalize.
- **Rebind:** **Change Zone 5 (CHA_FAN4) from PCIE07 → PCIE03** in the BMC web UI (single click via Chrome MCP from Rocinante; same authority envelope as 04-29). Currently bound to PCIE07 which is the cool card; should follow the hot card.
- **Expected effect:** Reduce GPU0/GPU1 asymmetry from 11°C to ~6-8°C; modest GPU0 die-temp drop (2-4°C). **Does not address CPU coupling** — that's Fan #1's job.
- **Recommended in `inbox/rocinante/PHONE-HOME-cooling-upgrade-recommendation.md` 2026-04-29.** Today's data reaffirms.

#### Fan #3 — HOLD IN RESERVE
- **Why:** The first two fans solve the two distinct problems revealed by the data (CPU coupling, asymmetry). A third fan provides marginal benefit only if (a) post-mod stress shows Tctl still ≥75°C at single-card load, OR (b) post-mod stress shows GPU0 peak still ≥80°C at dual-card load. Pre-committing the third fan before re-test is over-buying.
- **Likely future deployment:** Either (a) second top-exhaust slot for redundancy if Phanteks supports two-up top-mount and one isn't enough, OR (b) PSU shroud / under-GPU intake aimed up at the GPU0 PCB underside (the underside of slot-3 sees minimal cool-air flow today).
- **Decision rule:** install the first two, re-run today's stress harness, then decide.

### Why NOT pursue these alternatives

- **Push CHA_FAN2/3 harder via curve change.** The mid-chassis P14s have RPM headroom but they're already in the same air column that's failing to keep CPU cool. Pushing them harder pushes more warm air into the same recirculation pattern. Geometry > velocity.
- **Replace the Noctua with an AIO water cooler on CPU.** Solves the symptom (Tctl) but the GPU exhaust still has nowhere to go and would heat the AIO radiator. Top-exhaust deals with the heat at its source.
- **Brute-force jumper the front intakes to constant 12V.** Tested today (sysfs writes inert; BMC owns the multiplexer). Possible via PSU 12V if Alton wants to bypass BMC entirely on a specific zone, but the data doesn't justify it — front intakes are running hard already.
- **Water-cool GPU0.** Would solve the asymmetry and drop the heat-into-chassis budget by GPU0's TDP. Real option but expensive and contingent on RTX PRO 6000 Blackwell water-block availability (still unconfirmed). The 140 mm-fan path is the cheaper first attempt.

### Validation plan after the upgrade

When Fan #1 (top exhaust) and Fan #2 (CHA_FAN4 + rebind) are installed, re-run **the same harness** (`run.sh` in this directory's pattern; or just re-execute A1 → CD1 → A2 → CD2 → B → Z with the same 475W cap). Compare:
- A1 Tctl peak: today 79.6°C; target <72°C with top exhaust.
- A1 GPU0 peak: today 74°C; target <70°C (modest improvement; air-path mostly unchanged for GPU0 die).
- Pseudo-A2 GPU1-solo: not run today; baseline TBD; expect similar to today's A1 minus any GPU0-warming-of-Noctua-intake bleed.
- B GPU0 peak: 04-29 dual-card baseline 84°C; target <80°C.
- B GPU0/GPU1 asymmetry: today's reproduction would be ~10-11°C; target ≤7°C with CHA_FAN4 rebound.
- B Tctl peak: 04-29 dual baseline 87.8°C; target <80°C.

If the post-mod B run shows Tctl <75°C and GPU0 <80°C at sustained 475W dual-card, sustained inference at 475W/card 24/7 becomes safe. Otherwise the third 140 mm comes off reserve and the cycle repeats.

## Open questions for tomorrow

1. **Why do CHA_FAN2/3 max out at 1080 RPM** despite seeing the same PCIE03 signal as CHA_FAN5 (which hit 1440 RPM)? Same nameplate fan model (ARCTIC P14 PWM), same BMC zone source. Possibilities: per-zone PWM scaling diff in BMC firmware, fan-cable wiring, splitter-tach reporting fastest-of-three. Worth diagnosing before further BMC tuning. **Test plan:** capture nct6798 PWM register values per zone during peak — if pwm registers differ, cable-side; if pwm registers identical, BMC-firmware-side.

2. **Are there any rear/top exhaust fans currently installed but not on the BMC?** HARDWARE.md says "Front intake + rear/top exhaust default airflow" but motherboard fan sensors only show front + mid + CPU. Phanteks Enthoo Pro 2 stock includes rear/top fans on its own hub which may run at fixed PWM independent of the BMC. **Action:** physically inspect during the fan-install pass. If yes, are they connected to anything reporting tach? If not, the "case exhaust" leg of the fan-placement decision is invisible to us.

3. **Phase A2 (GPU1 solo) was skipped — does GPU1 also drive Tctl past 75°C alone?** Today's A1 showed GPU0 alone is sufficient. A2 would tell us whether it's slot-3-specific or any-card-loaded. If A2 also breaches Tctl 75°C alone, the air-path problem is even worse than this run quantified. **Action:** include A2 in the post-mod re-test, ideally before B fires.

4. **Is the ASRock-AST2600 hypothesis truly disproven, or is the ipmitool channel mis-routed?** Today's read-only probe returned `Invalid command (rsp=0xc1)`. That's stronger than the prior `Invalid data field (rsp=0xcc)` — it means the BMC doesn't recognize NetFn 0x3a Cmd 0xd0 at all on this firmware. **Action:** update `IPMI-FAN-RESEARCH.md` to mark the hypothesis as empirically disproven, not just unverified. The HTTP-capture-from-web-UI path remains the only known programmatic actuator.

5. **Phanteks Enthoo Pro 2 stock fan headers** — is there a built-in PWM hub (per `inbox/rocinante/2026-04-27_rtxserver_flower-fans-pwm-conversion.md` Option 2) that we should tap for the new top-exhaust? **Action:** physical inspection during fan-install.

6. **Should W_PUMP+ (Zone 7) be the home for the top-exhaust fan?** Currently empty, default Generic curve (always 100%). If the top-exhaust is meant to run at full speed continuously (not curve-driven), W_PUMP+ is a free header. If we want curve-driven, rebind to CPU Pkg or PCIE03. **Action:** decide at install time based on fan model's noise profile.

7. **Why did CHA_FAN1 (PCIE07-bound) ramp to 960 RPM during A1 despite PCIE07 staying at 27°C the whole time?** Mechanical windmilling from CHA_FAN5's airflow, OR a curve-floor that's higher than expected, OR a chassis-air sensor I'm not modeling. **Action:** check during cool-down 1 next run — if PCIE07 is still 27°C and CHA_FAN1 stays at 960 RPM, it's mechanical windmilling. If RPM drops back to 600, it was a transient.

8. **Generalize dashboard to permanent observability tool.** Per Alton's "bonus" request, rename `dashboard.sh` to `~/scripts/sartor-gpu-dashboard.sh` and document in `machines/rtxpro6000server/`. Deferred to next session.
