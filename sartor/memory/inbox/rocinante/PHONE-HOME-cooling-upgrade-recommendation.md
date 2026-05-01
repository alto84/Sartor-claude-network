---
name: phone-home-cooling-upgrade-recommendation-2026-04-29
description: Cooling-upgrade recommendation for rtxpro6000server after the post-BMC-binding 475W stress test. Verdict marginal (GPU0 peak 84°C, no throttle, but existing fan suite is at its thermal ceiling). Recommendation: install a 5th ARCTIC P14 PWM in CHA_FAN4 (Zone 5), rebind Zone 5 from PCIE07 to PCIE03 (the hot card), re-test. If GPU0 peak stays ≥ 78°C, escalate to water cooling on GPU0. Filed for Alton's review when he is back from remote.
type: phone-home
date: 2026-04-29
hostname: rtxpro6000server
to: rocinante
recipient: alton (when back from remote)
authority: post-empirical-decision-rule-application
severity: action-needed-7d
related:
  - experiments/2026-04-29-post-bmc-binding-stress/comparison
  - machines/rtxpro6000server/BMC
  - inbox/rtxpro6000server/PHONE-HOME-bmc-fan-source-bindings-proposal
  - inbox/rocinante/20260429T125000Z_bmc-binding-applied
tags: [meta/phone-home, machine/rtxpro6000server, hardware/cooling, decision-needed]
---

# PHONE-HOME — cooling upgrade recommendation for rtxpro6000server

## Headline

GPU0 hits 84°C peak under 5-min sustained 475W/card. Inter-card delta steady at +10.9°C. No throttle observed but headroom to throttle is ~3°C die margin. The BMC fan-source binding change applied today (Zones 2-6 → PCIE03/PCIE07 with 4-point GPU-temp curves) is correct architecturally — fans now follow GPU heat — but the existing physical fan suite is at its thermal capacity. Better signal routing to already-saturated fans does not extract more heat.

Per the cooling decision rule from the original phone-home, this falls in the **marginal** band (78°C ≤ GPU0 peak < 85°C). Recommendation: incremental upgrade — start with one more fan, re-test, escalate to water cooling on GPU0 only if the fan upgrade is insufficient.

## Comparison vs baseline

| Metric | Baseline 2026-04-27 | Post-binding 2026-04-29 | Delta |
|---|---|---|---|
| GPU0 peak | 83 °C | 84 °C | +1 |
| GPU1 peak | 72 °C | 73 °C | +1 |
| Inter-card delta steady | ~11 °C | +10.9 °C | ~0 |
| GPU0 / GPU1 mean power | 475 / 475 W | 475 / 475 W | 0 |
| CPU Tctl peak | 86.0 °C | 87.8 °C | +1.8 |
| CPU Tccd4 peak | 86.0 °C | 83.1 °C | -2.9 |
| Throttle observed | no | no | — |

GPU temps essentially unchanged. The +1°C deltas are within run-to-run variance and ambient-room differences between two days. The binding change DID improve idle behavior (fans now run quieter at idle, since PCIE temps drive them rather than CPU temp), but at full load both runs converge to fans-at-100% via different temperature signals.

## Why air cooling is at its ceiling

Under 475W/card sustained load, PCIE03 hits 83°C, which is past the curve's Point D (80°C / 100% duty). Fans are commanded to 100% duty on the PCIE03-bound zones (CHA_FAN2, CHA_FAN3, CHA_FAN5, the largest cooling levers). Their measured RPMs:
- CHA_FAN5 (3× MEGACOOL on splitter, PCIE03-bound): 1560 RPM peak
- CHA_FAN1 (front intake, PCIE07-bound): 1680 RPM peak
- CHA_FAN2/3 (mid-chassis, PCIE03-bound): 1200 RPM peak
- CPU_FAN (Noctua, CPU-bound): 1560 RPM peak

CHA_FAN2 and CHA_FAN3 max out at 1200 RPM despite being commanded to 100% duty, suggesting the BMC PWM scaling caps them well below their nameplate maximum (ARCTIC P14 PWM nameplate is 1700 RPM). That's a separate diagnostic worth investigating but not blocking.

## Recommended upgrade path

### Option A (cheap, reversible) — try first

1. Install a 5th ARCTIC P14 PWM in the empty CHA_FAN4 header (Zone 5).
2. Rebind Zone 5 from PCIE07 → PCIE03 in the BMC web UI (single click, single Save, requires Rocinante Chrome MCP session). Reasoning: GPU0 is the bottleneck, not GPU1. Putting the new fan on the hot card is the higher-leverage move. Zones 2 (CHA_FAN1) and 5 (CHA_FAN4) bound to PCIE07 leaves GPU1 with one PCIE07-bound fan; we'd be moving from 2 PCIE07-bound + 3 PCIE03-bound to 1 PCIE07-bound + 4 PCIE03-bound, which matches the 11°C inter-card delta we want to close.
3. Re-run `experiments/2026-04-29-post-bmc-binding-stress/run.sh` after the new fan + binding change. Compare GPU0 peak.
4. If GPU0 peak < 78°C → done; air is sufficient.
5. If GPU0 peak ≥ 78°C → proceed to Option B.

Cost: one ARCTIC P14 PWM (~$15 retail). Time: 30 min physical install + 5 min BMC UI + 6 min stress test.

### Option B (substantial, if Option A is insufficient)

Install a 360mm AIO liquid cooler dedicated to GPU0 with a GPU water block. Specifications to validate before purchase:
- GPU compatibility: RTX PRO 6000 Blackwell Workstation Edition water blocks are not yet widely available (the Blackwell workstation card is a Q1-2026 product); need to verify availability and fitment.
- Mount: rear chassis position currently occupied by the 3× MEGACOOL stack on CHA_FAN5. Those would relocate to a side bracket as intake.
- Pump power: connect to W_PUMP+ (Zone 7) which is already wired but sees 100% duty (default Generic-mode curve at 100% across all points — fine for a pump).
- Cost: $200-400 depending on water block availability.

## Operating envelope until upgrade is in place

Until either Option A is implemented and validated, recommend NOT running 475W/card sustained inference 24/7. Two safer modes for ongoing work:

1. **Capped power mode:** `sudo nvidia-smi -pl 400` per card. This drops GPU0 peak by an estimated 5-7°C based on the linear-ish power-temp curve, putting GPU0 in the safe ≤78°C zone with the current fan suite. Inference throughput drops ~15% but thermal headroom is reasonable.
2. **Single-card mode:** run inference on GPU1 only at 475W. GPU1 sits at 72°C (well within safe), GPU0 stays cool. Throughput halved. Fine for batch work, not for production-scale.

For ad-hoc development / testing / training warm-up: 475W on both cards is fine for runs ≤10 minutes — we observed equilibrium at 224 seconds, so a 5-min run never hit thermal steady state, and a 10-min run still doesn't throttle. The concern is sustained 24/7 operation.

## What I'm asking Alton for

A decision when he's back, with three reasonable choices:

1. **Approve Option A** (one new fan + rebind, ~$15 + 40 min). Rocinante drives the BMC rebind; rtxserver handles the stress retest. I can have results within 30 min of the fan being physically installed.
2. **Skip Option A and go straight to Option B** (water cooling), if you'd rather pay once for headroom rather than iterate. This requires research on RTX PRO 6000 Blackwell water-block availability (handing off to research-agent or chrome-automation skill).
3. **Cap to 400W and live with it.** No upgrade. Inference workloads run at 400W per card, which is 84% of the 475W baseline. Throughput hit ~15%; thermal headroom plentiful. Cleanest near-term option if the cooling-upgrade budget is going elsewhere.

My preference: **Option A first.** It's cheap, reversible, and gives us another data point. The 11°C inter-card delta is the strongest signal — adding a fourth PCIE03-bound fan is the most direct intervention against that delta. If it doesn't work, Option B is still on the table.

## Files

- Comparison + raw data: `experiments/2026-04-29-post-bmc-binding-stress/`
- BMC operating manual: `sartor/memory/machines/rtxpro6000server/BMC.md` (history updated 2026-04-29 with full applied config + this verdict)
- IPMI research: `sartor/memory/inbox/rtxpro6000server/IPMI-FAN-RESEARCH.md`
- Original proposal (with decision rule): `sartor/memory/inbox/rtxpro6000server/PHONE-HOME-bmc-fan-source-bindings-proposal.md`
- Bindings-applied confirmation: `sartor/memory/inbox/rocinante/20260429T125000Z_bmc-binding-applied.md`

## Status

Power cap restored to default 600W on both cards after stress test (verified). System is at idle, fans are at the new 30% floor on PCIE03/07 sources. GPUs available for normal use. No interventions waiting; everything safe to leave as-is until decision.
