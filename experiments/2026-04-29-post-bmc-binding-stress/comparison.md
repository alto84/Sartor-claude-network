---
name: post-bmc-binding-thermal-comparison-2026-04-29
description: 5-min 475W/card thermal stress on rtxpro6000server after BMC fan-source bindings (Zones 2-6 → PCIE03/PCIE07) + 4-point GPU-temp curves were applied. Compared to 2026-04-27 baseline (Generic-mode CPU-bound curves). Verdict: marginal — existing fan suite is at its thermal ceiling; cooling-upgrade decision rule recommends adding a chassis fan in CHA_FAN4 (Zone 5) and re-testing before deciding on water cooling for GPU0.
type: experiment-result
date: 2026-04-29
duration_s: 300
power_cap_per_card_w: 475
sample_count: 192
state: dual-card matmul under load
related:
  - inbox/rtxpro6000server/PHONE-HOME-bmc-fan-source-bindings-proposal
  - inbox/rocinante/20260429T125000Z_bmc-binding-applied
  - experiments/2026-04-27-thermal-baseline
  - machines/rtxpro6000server/BMC
---

# Post-BMC-binding 475W thermal stress — comparison vs 2026-04-27 baseline

## Verdict

**MARGINAL.** GPU0 peaked at 84°C (baseline: 83°C). Inter-card delta steady at +10.9°C (baseline: ~11°C). No throttle observed. CPU Tctl peaked at 87.8°C (baseline: 86°C; not concerning, Threadripper Pro thermal limit is 95°C).

Per the cooling-upgrade decision rule from the original phone-home (`PHONE-HOME-bmc-fan-source-bindings-proposal.md`):

| GPU0 peak | Decision |
|---|---|
| < 78°C and delta ≤ 5°C | air sufficient; no upgrade |
| **78-85°C** | **marginal; add fan to CHA_FAN4 (Zone 5)** ← we are here |
| ≥ 85°C or throttle | water cooling on GPU0 |

The post-binding run sits squarely in the marginal band. Recommendation: install a 5th ARCTIC P14 PWM in the empty CHA_FAN4 header, rebind Zone 5 to PCIE03 (currently PCIE07 — but the hot card is the bottleneck, not the cool card), re-run this stress harness, and decide water cooling based on the new data.

## Headline numbers

| Metric | Baseline (2026-04-27) | Post-binding (2026-04-29) | Delta |
|---|---|---|---|
| GPU0 peak temp | 83 °C | **84 °C** | +1 |
| GPU1 peak temp | 72 °C | **73 °C** | +1 |
| GPU0 last-60s mean | ~83 | 83.3 | ~0 |
| GPU1 last-60s mean | ~72 | 72.4 | ~0 |
| Inter-card delta (steady) | ~11 °C | **+10.9 °C** | ~0 |
| GPU0 / GPU1 mean power | 475 / 475 W | 475.0 / 475.0 W | 0 |
| GPU0 time-to-(peak-1°C) | n/a (not measured) | 224 s | — |
| GPU1 time-to-(peak-1°C) | n/a | 184 s | — |
| CPU Tctl peak | 86.0 °C | 87.8 °C | +1.8 |
| CPU Tccd4 peak | 86.0 °C | 83.1 °C | -2.9 |
| Throttle observed | no | **no** | — |

GPU temps are essentially unchanged. CPU is marginally cooler on the hot CCD (Tccd4) and marginally warmer on Tctl — both within run-to-run variance and ambient-room fluctuation between 2026-04-27 and 2026-04-29.

## Why the binding change didn't help GPU temps under load

The binding change DID change idle behavior (chassis fans dropped from 720-960 RPM to 480-600 RPM at idle, because PCIE temps are low when the GPUs are idle whereas CPU temp was previously driving them higher). That's correct, that's what we wanted.

Under load, the binding change is essentially a no-op for GPU thermal outcomes because:

1. **The Generic-mode CPU-bound baseline was already running fans at near-100% under load.** CPU Tctl hit 86°C in the baseline, which is well past the Point D (70°C / 100% duty) of the original Generic-mode curves. So fans were already saturated via CPU temp.
2. **Today's GPU-bound curves saturate at the same point.** Point D = 80°C / 100% duty on PCIE03; PCIE03 hit 83°C, so fans are at 100% duty. Same operating point as baseline, different signal driving it.
3. **The fans are at their physical thermal capacity.** CHA_FAN5 (3× MEGACOOL on splitter) peaked at 1560 RPM. CHA_FAN1 peaked at 1680 RPM. CHA_FAN2/3 at 1200 RPM. With both PCIE bindings driving fans to 100% duty, the existing chassis fan suite cannot extract more heat than this.

The binding change was correct architecturally — fans now follow GPU heat (which is what we care about) rather than CPU heat (which was a proxy). The wins are: (a) lower idle noise, (b) responsiveness when GPUs ramp without CPU ramping, (c) a clean platform for adding GPU-aware fans in CHA_FAN4. The win that did NOT materialize: dropping GPU0 below 78°C. That requires more cooling capacity, not better cooling allocation.

## Fan ramp behavior under load

| Zone / Header | Source | Pre-flight RPM | Peak under stress | Mean during stress |
|---|---|---|---|---|
| CPU_FAN (Noctua) | CPU Pkg | 600-1320 | 1560 | 1497 |
| CHA_FAN1 | PCIE07 | 600 | **1680** | 1469 |
| CHA_FAN2 | PCIE03 | 480 | 1200 | 1083 |
| CHA_FAN3 | PCIE03 | 480 | 1200 | 1085 |
| CHA_FAN4 | PCIE07 | empty header | — | — |
| CHA_FAN5 (MEGACOOLs) | PCIE03 | 600 | 1560 | 1437 |

Note that CHA_FAN1 (PCIE07-bound) ran at higher RPM than CHA_FAN2/3 (PCIE03-bound) despite GPU0 being hotter — this is because CHA_FAN1 is the front intake (different physical fan model with higher max-RPM ceiling) and PCIE07's curve hit Point D = 80% at 70°C (PCIE07 climbed past 70°C in steady state at 72°C peak). The PCIE07-bound zones are not the limiter; the PCIE03-bound zones ARE running near max but have lower top-end RPM ceilings.

CHA_FAN2/3 maxing at 1200 RPM suggests their curve / duty mapping is hitting the fan's PWM ceiling well below their nameplate maximum. Worth investigating whether the BMC's PWM scaling is correct for these channels (separate diagnostic, not blocking).

## What needs to happen next

1. **Install a 5th ARCTIC P14 PWM in CHA_FAN4 header.** This is the empty header; the slot is configured (Zone 5 binding active in BMC).
2. **Rebind Zone 5 → PCIE03 Temp** (currently PCIE07 in the proposal, but the empirical data shows GPU0 is the bottleneck, not GPU1). This is a single-line BMC web-UI change via Chrome MCP from Rocinante. Same authority envelope.
3. **Re-run this stress harness** (`run.sh`) and measure GPU0 peak again. Two outcomes:
   - GPU0 peak drops to <78°C → air is sufficient with the upgraded fan suite. No water cooling.
   - GPU0 peak stays in 78-85°C → existing chassis cannot pull enough heat through 4-5 P14 + MEGACOOL fans. Water cooling on GPU0 is the answer.
4. **If water cooling is the answer:** budget for an AIO 360mm liquid cooler aimed at GPU0, mount it where the existing rear MEGACOOL stack is. The MEGACOOLs move to a side-bracket to keep providing intake air for GPU1.

## Operating envelope under sustained inference

If 475W/card sustained inference workload were running 24/7 with the current cooling:
- GPU0 would sit at 83-84°C continuously.
- CPU Tctl would sit around 86-87°C continuously (not problematic — Threadripper Pro thermal limit 95°C).
- Headroom to thermal throttle on GPU0 (typically ~87°C die or 105°C hotspot) is ~3°C die margin.
- Inter-card delta of 10-11°C is real and would persist.

Recommendation: do NOT plan 24/7 inference at 475W/card with the current cooling. Either (a) cap to ~400W/card (which would drop GPU0 by ~5-7°C and provide reasonable headroom), or (b) install the upgraded cooling per the next-action steps above.

## Files

- This comparison: `experiments/2026-04-29-post-bmc-binding-stress/comparison.md`
- Raw samples: `experiments/2026-04-29-post-bmc-binding-stress/samples.jsonl` (192 lines, 48 GPU pairs + 48 CPU + 48 BMC + 48 misc)
- Stress log: `experiments/2026-04-29-post-bmc-binding-stress/stress.log`
- Run output: `experiments/2026-04-29-post-bmc-binding-stress/run.tee.log`
- Stress harness: `experiments/2026-04-29-post-bmc-binding-stress/{run.sh, thermal_stress.py, sample_loop.sh}`
- Baseline reference: `experiments/2026-04-27-thermal-baseline/samples.jsonl`
