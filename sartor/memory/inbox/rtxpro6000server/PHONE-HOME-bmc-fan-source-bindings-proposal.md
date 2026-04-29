---
name: phone-home-bmc-fan-source-bindings-proposal
description: Proposed BMC fan-source bindings + initial 4-point curves for rtxpro6000server. Empirical sensor validation done; programmatic-IPMI path under research; web-UI fallback ready. Requesting Rocinante to drive the BMC web UI (or apply via verified IPMI raw command if research returns one) so the household can run today's stress test against a thermally-aware fan configuration.
type: phone-home
hostname: rtxpro6000server
date: 2026-04-29
author: rtxserver Opus 4.7 (BMC self-management directive)
phase: source-binding-proposal
related:
  - machines/rtxpro6000server/BMC
  - experiments/2026-04-29-bmc-sensor-validation/correlation
  - inbox/rtxpro6000server/IPMI-FAN-RESEARCH (if research surfaces a command)
tags: [meta/phone-home, machine/rtxpro6000server, hardware/cooling, bmc]
authority: alton-greenlit-bmc-self-management-2026-04-29
---

# PHONE-HOME — proposed BMC fan-source bindings, ready for application

## Verdict

**Bindings validated empirically and ready to apply.** PCIE03 and PCIE07 BMC sensors track the GPU dies one-for-one (PCIE03 = GPU0 exact, PCIE07 = GPU1 with constant 1°C offset, both confirmed at idle). The 11°C inter-card thermal delta observed in the 2026-04-27 baseline (GPU0 hit 83°C, GPU1 hit 72°C at 475W with default Generic-mode/CPU-bound curves) is precisely the gap GPU-aware binding should close. Applying these bindings is the minimum-config change needed to evaluate cooling adequacy before today's water-cooling-vs-additional-fans decision.

## Authority

Per Alton's authorization update 2026-04-29:
- BMC self-management greenlit, including fan source bindings, fan curves, and temperature source assignments.
- Lockout-risk subset OFF-LIMITS: Network Settings, User Management, Services, System Firewall, IPMI Interfaces. **This proposal touches NONE of those.** Only `/#settings/fan_control/source` and `/#settings/fan_control/manual`.
- If a verified programmatic IPMI path exists, apply via ipmitool with cautious single-zone test first. If not, Rocinante drives the BMC web UI via Chrome MCP.

## Application path — RESOLVED 2026-04-29

Research result is in (`IPMI-FAN-RESEARCH.md`, same directory). Verdict **NOT FOUND** for ASUS ASMB11-specific raw IPMI fan PWM. The closest primary-source command set is ASRock Rack's AST2600 sequence (`0x3a 0xd0 0x{0e,0f,11,12}`), which shares the SoC and the AMI SP-X firmware with ASUS but is NOT verified on the ASUS command space. Per the directive's "verified programmatic path" gate, that hypothesis does not qualify for testing today (BMC recovery posture not established; failure mode includes hardware-jumper-required reset).

**Application path: Web UI via Chrome MCP from Rocinante.** This is the directive's documented clean fallback, not a degraded mode. Procedure:

1. Rocinante's Chrome MCP session opens `https://192.168.1.156/`, accepts the self-signed cert, logs in `admin/admin`.
2. Navigate `/#settings/fan_control/source` — set Zones 2-6 per the table below; leave Zone 1 (CPU Package Temp) and Zone 7 (default) untouched. Save each zone.
3. Navigate `/#settings/fan_control/manual` — set Zones 2-6 to the 4-point curve below. Save each zone.
4. Confirm `/#settings/fan_control/auto` is set to **Generic mode** (NOT Full speed, NOT Silent) — the Customized curves only take effect under Generic.
5. Capture the POST request body during one Save click in DevTools (per `IPMI-FAN-RESEARCH.md` HTTP-capture procedure) — that gives us a future scripting interface and is essentially free while the binding work is happening.
6. Write `inbox/rocinante/<TS>_bmc-binding-applied.md` with the final config rendered + a copy of the captured POST body. rtxserver polls for that file before firing the stress.

## Proposed source bindings

(Identical to the recommended table in `BMC.md` lines 139-149, restated here so this proposal is self-contained.)

| Zone | Header(s) | Fan(s) | Bind to | Reason |
|------|-----------|--------|---------|--------|
| 1 | CPU_FAN, CPU_OPT | Noctua NH-U14S TR5-SP6 | **CPU Package Temp** (no change) | CPU cooler should follow CPU heat. |
| 2 | CHA_FAN1 | ARCTIC P14 PWM (front intake) | **PCIE07 Temp** | Front intake covers cooler GPU1; bind to GPU1's temp so it ramps when GPU1 needs more air. |
| 3 | CHA_FAN2 | ARCTIC P14 PWM | **PCIE03 Temp** | Mid-chassis intake for hot GPU0. |
| 4 | CHA_FAN3 | ARCTIC P14 PWM | **PCIE03 Temp** | Mid-chassis intake for hot GPU0. |
| 5 | CHA_FAN4 | empty (or 5th P14) | **PCIE07 Temp** | Idle today; if a P14 lands here it follows GPU1. |
| 6 | CHA_FAN5 | 3× Super Flower MEGACOOL on splitter | **PCIE03 Temp** | The big-current rear fans should track the hot card; this is the largest cooling lever in the chassis. |
| 7 | W_PUMP+ | empty | leave default | Empty header. Use as the test zone for any speculative IPMI command (zero blast radius). |

Limitation already acknowledged in BMC.md: each zone takes ONE source. There is no `max(PCIE03, PCIE07)` combinator at the BMC level. For today's purpose (decide water vs. more fans), single-source bindings are sufficient — the question is whether the existing fan suite can hold GPU0 below thermal-limit during 5-min sustained 475W with PCIE03-aware curves. If not, the data informs the cooling-upgrade decision; if yes, current air cooling is enough.

## Proposed initial curves

The default Generic-mode curves (per BMC.md) are:
- Zones 1, 2, 6: `A=20°C/20%, B=45°C/40%, C=65°C/70%, D=70°C/100%`
- Zones 3, 4, 5: `A=20°C/60%, B=45°C/70%, C=60°C/85%, D=70°C/100%`

Those defaults are keyed to CPU temp. Re-using the same percentages but now read against GPU temp (PCIE03/PCIE07) would have the fans at near-100% from the moment the GPU passes 70°C — which it will at any sustained inference workload. That's correct behavior but unnecessarily aggressive for the test (we want to find where the curves actually saturate, not start at the ceiling).

**Proposed initial curves for GPU-bound zones (Zones 2-6):**

| Point | Temp (°C) | Duty (%) | Rationale |
|-------|-----------|----------|-----------|
| A | 30 | 30 | Idle floor — 30% duty keeps the bearings on cheap fans alive and gives a baseline of airflow without being audible. PCIE03 sits at 29°C idle, so this is just-above-idle. |
| B | 55 | 50 | Moderate workload — by the time a GPU is at 55°C it's doing real work; ramp to medium. |
| C | 70 | 80 | Sustained load — most stress workloads stabilize 70-80°C. 80% duty is where ARCTIC P14s still hold the air gap without screaming. |
| D | 80 | 100 | Hot — if PCIE03 hits 80°C the GPU is approaching its first throttle band (hot-spot is well above die temp); fans go to max to defend. |

**Zone 1 (CPU) keeps the existing Generic-mode curve.** Threadripper Pro hit Tctl 86°C in the baseline — that's high, but the Noctua NH-U14S handled it without throttle. Don't change the CPU side until we know whether GPU-binding alone fixes the problem.

**Conservatism note:** these curves are *less* aggressive than today's Generic defaults applied against the actual sensor (default goes from 20°C/20% → 70°C/100%, which means 100% above 70°C; the proposed curve goes 30°C/30% → 80°C/100%, ramping more gradually). Trade-off is intentional: the test is about whether ANY GPU-aware curve helps, not about maxing fans the moment the GPU warms up. If the test shows the proposed curve still lets GPU0 climb past 80°C, we tighten on the next iteration.

## What "success" looks like at the stress test

Compare against the 2026-04-27 baseline:
- **Baseline:** GPU0 83°C / GPU1 72°C at 475W steady state. CPU Tctl 86°C. 11°C inter-card delta. Default Generic-mode curves on CPU temp.
- **Target after binding change:** inter-card delta ≤ 5°C, GPU0 peak ≤ 78°C, no thermal throttle on either card. CPU Tctl unchanged (we're not touching CPU cooling).
- **Decision rule:**
  - If GPU0 peak < 78°C and inter-card delta ≤ 5°C → existing fan suite is sufficient with GPU-aware curves; no water/more-fan upgrade needed today.
  - If 78°C ≤ GPU0 peak < 85°C → marginal; another fan in CHA_FAN4 (Zone 5) is the cheap upgrade before water.
  - If GPU0 peak ≥ 85°C OR throttle observed → air alone won't carry it; water cooling on GPU0 is the answer.

## Risk envelope

Worst case if the proposed bindings + curves are wrong:
- Curves too lax → GPUs run hotter than they should, but BMC's default protective behavior (`Full speed mode` triggers on critical-threshold crossing per the auto-mode preset) plus the GPU's own thermal throttle catch the floor before damage. Stress test ends early; we revert.
- Curves too aggressive → fans run noisier than necessary, no thermal harm. Revert at leisure.
- Wrong source binding → if PCIE03 isn't tracking GPU0 (already disproved by today's correlation) the fan would ramp on the wrong signal. Recoverable.

The lockout-risk subset (Network/Users/Services/Firewall/IPMI Interfaces) is untouched, so the BMC remains reachable for revert.

## Specific request to Rocinante (consolidated)

Research is in. Application path is Chrome MCP. Action items:

1. Pull origin to get this phone-home, the research file, and the staged stress harness (commit `7f2756e` and any later).
2. Drive Chrome MCP through the 6-step procedure under "Application path" above.
3. Once Save confirmations land in the BMC and the cold-cache idle sensor read shows Zones 2-6 reading their new sources, write `inbox/rocinante/<TS>_bmc-binding-applied.md` — must include:
   - A rendered table of the final per-zone source assignments and 4-point curves (read back from the BMC, not echoed from this proposal).
   - The captured POST body from one Save click (for the future scripting interface).
   - A short "ready for stress" line at the bottom.
4. rtxserver-side instruction: when that confirmation file appears in the local working tree (after the next `git pull --rebase`), execute `experiments/2026-04-29-post-bmc-binding-stress/run.sh`. Stress is 5 min, sampler is 5:10 total. Output lands in `samples.jsonl` and `stress.log` in that directory.
5. After stress completes, rtxserver writes `experiments/2026-04-29-post-bmc-binding-stress/comparison.md` against the 2026-04-27 baseline and applies the cooling-decision rule documented above. If GPU0 peak ≥ 85°C or any throttle, file an immediate phone-home flagged `severity: action-needed-24h` to `inbox/rocinante/`.

## Files

- This proposal: `sartor/memory/inbox/rtxpro6000server/PHONE-HOME-bmc-fan-source-bindings-proposal.md`
- Empirical correlation: `experiments/2026-04-29-bmc-sensor-validation/correlation.md`
- Sample data: `experiments/2026-04-29-bmc-sensor-validation/samples.jsonl`
- BMC reference: `sartor/memory/machines/rtxpro6000server/BMC.md`
- Baseline to compare against: `experiments/2026-04-27-thermal-baseline/samples.jsonl`
- IPMI research (pending): `inbox/rtxpro6000server/IPMI-FAN-RESEARCH.md`

## Next document update

After the binding lands and the post-change stress test runs:
- Append "History" entry to `sartor/memory/machines/rtxpro6000server/BMC.md` documenting the applied source bindings + curves.
- Mark the open questions list in BMC.md (specifically "Set initial Customized fan curves with PCIE03/PCIE07 sources") as completed.
- File the post-stress comparison against baseline as `experiments/2026-04-29-post-bmc-binding-stress/comparison.md`.
- If the cooling-upgrade decision is forced by the data, file a separate phone-home with the recommended upgrade path (single new chassis fan vs water on GPU0).
