---
name: phone-home-phase-2-plan-greenlit-experiment-002-pre-fire
description: rtxserver phone-home — Phase 2 plan-prosecution chain CLOSED via Cato-007 GREENLIGHT (trajectory 18→5→4→6→2→1→0). Experiment 002 first-fire pre-registration drafted; Cato-008 returned REVISE with 6 narrow charges; all 6 patches landed in revise pass. Awaiting principal greenlight on next-step path (Cato-009 verify vs apply-then-fire).
type: phone-home
date: 2026-04-26
from: rtxserver (persona-engineering team-lead, post-Phase-2-Plan + experiment-002-revise)
to: rocinante (for Alton)
status: blocked-awaiting-principal-greenlight
volatility: low
tags: [meta/phone-home, domain/research, research/persona-engineering, phase/2-first-fire]
related:
  - research/persona-engineering/PHASE-2-RESEARCH-PLAN
  - research/persona-engineering/experiments/002_2026-04-26_persona-vectors-layer-sweep-with-rank1-control
  - research/persona-engineering/CATO-PROSECUTION-008
  - research/persona-engineering/CATO-PROSECUTION-007
  - machines/rtxpro6000server/HARDWARE
---

# Phase 2 Plan greenlit. Experiment 002 ready for fire after Cato-009 verify.

## Headline

The Phase 2 Plan-prosecution chain is **CLOSED**. Trajectory: Cato-001 (18 charges) → Cato-002 (5 patches) → Cato-003 (4 patches) → Cato-004 (6 charges) → Cato-005 (2 charges) → Cato-006 (1 charge) → **Cato-007 (GREENLIGHT)**. The plan is fire-ready.

The Phase 2 first-fire experiment doc (`experiments/002_2026-04-26_persona-vectors-layer-sweep-with-rank1-control.md`) was drafted post-Cato-007 GREENLIGHT. Cato-008 prosecuted the experiment doc with 6 narrow charges (REVISE); all 6 patches landed in revise pass 1 (commit `0dcb2a9`). The experiment is now `planned-post-cato-008-revise-pre-cato-009`.

**Stopping here per token-budget discipline (approaching 800K cap).** Phoning home for principal greenlight on the next-step path.

## What landed in Phase 2

### Plan (`PHASE-2-RESEARCH-PLAN.md`, status: `phase-2-plan-post-cato-006-revise-pre-cato-007` → Cato-007 GREENLIGHT)

Synthesizes 5 parallel Phase-A inputs (lit-scout, methods-architect, measurement-architect, composability-theorist, framing-skeptic) into:
- Adoption of all 4 measurement-architect Phase-1-defect patches + 6 beyond-defect gaps (probe set v1.1 → v1.3, bucket 6.F BASELINE-RECONSTRUCTION FLOOR, tightened 6.E)
- Three pre-registration additions (cross-sub-dim cosine test = F2; cosine-shift falsifier = F1; principal-stress probes deferred to second-fire per Cato-004 §4 Option A)
- Tier-1 separability tests (T1.1 abliteration overlap → F3; T1.2 corrigibility-trap → F4) as mandatory pre-flight
- Hybrid first-fire: METH 1a (Persona Vectors layer-sweep) + parallel rank-1 single-layer control (per COMP §Q3 + METH §7 self-corrected — not COMP Pairing 6 which is Tier-3 deferred)
- 9-cell 2D outcome table (layer-spread × dimensionality), not the v1.2 7-row collapse
- F6 falsifier blocking "Alton-lite" reframing of (k=1, distributed) cells
- Decision 7 (Execution lens) — PSU 1400 W ceiling, 500 W/card cap, profiler-armed every Phase F run
- Decision 8 (Cooling lens) — HARDWARE-THERMAL-BASELINE.md mandatory precondition for Phase F (cycle 2+ training); does NOT gate first-fire (single-card inference at <200 W/card)

**Cato-007 GREENLIGHT verbatim:** "the §C patch landed substantively and no new defects exist. The plan can fire the experiment-002 design phase without further plan-level prosecution."

### Hardware doc (`machines/rtxpro6000server/HARDWARE.md`, NEW)

Mirrors `machines/gpuserver1/HARDWARE.md`. Captures:
- BoM: 7975WX (350 W TDP) on Noctua NH-U14S TR5-SP6 (350 W cooler-rated → ZERO HEADROOM); 2× RTX PRO 6000 Blackwell; 256 GB DDR5 (8-ch); ASUS Pro WS WRX90E-SAGE SE; Phanteks Enthoo Pro 2; ARCTIC P14 PWM 5-pack; PSU TBD
- Live reconnaissance: idle CPU Tctl 47.1°C, idle GPUs 28-29°C, NVMe ~30°C
- Power profile: 1000 W GPU + 350 W CPU + 50 W system = ~1400 W at PSU ceiling
- Open quirks: PSU rating not yet read (`dmidecode -t 39` doesn't expose on SMBIOS 3.7); fan RPM channels need `nct6775` or `asus-wmi-sensors` module; AMD has no `/sys/.../thermal_throttle/` interface (Tctl saturation + per-CCD frequency derate is the AMD-correct proxy)

### Experiment 002 (post-Cato-008-revise, status: `planned-post-cato-008-revise-pre-cato-009`)

Operationalizes the parent plan §6 in 11 measurement steps:
- §2.2 Tier-1 separability tests (T1.1 → F3; T1.2 → F4 with r̂-residualization per Cato-008 §3; T1.3 → F2)
- §2.3 layer-sweep with bootstrap CIs on signal-quality AND layer-count (per Cato-008 §2)
- §2.4 per-layer PCA with bootstrap CI on k_80 (per Cato-008 §2)
- §2.5 generic-name contrast using 3 matched-frequency Italian/Romance surnames (Bellini, Conti, Russo) per Cato-008 §4
- §2.6 drift monitor base vs lora-v0.3
- §2.7 CAA-α-sweep (with F2-fire fallback to per-sub-dim per Cato-008 §6)
- §2.8 rank-1 control with α*/l* from lora-v0.3 comparator (per Cato-008 §1)
- §2.9 cosine-shift falsifier extraction (F1)
- §2.10 4-gate discriminant (recalibrated margins per MEAS Gap B)
- §2.11 4-pass-factor composite (`principal_stress_pass` deferred per Cato-004 §4 Option A)
- §2.12 sample preservation enforcement per MEAS Gap E

§6 pre-registered flowchart (6 steps) operationalizes the F1-F6 falsifiers in the right order. §6 Step F method-ladder selection table now correctly splits (k=1, distributed) into attn-only vs attn+SSM rows; v1.2 7-row reference removed; F6 wording standardized.

Wall-clock estimate: ~1.5 GPU-hours single-card, no training, <200 W/card. Does NOT trigger Phase F preconditions (no PSU/thermal-baseline gating).

## Cato chain on the experiment doc

- **Cato-008 (filed):** REVISE with 6 narrow charges (rank-1 control α*/l* handicap; bootstrap CI gaps on k_80 + layer-count; F4 raw v_loyalty_pooled vulnerable to r̂-aliasing; weak generic-name set; Step F flattens 2D cells into v1.2 reframing; F2 fire's pooled-direction interpretive collapse)
- **Cato-008 patches: ALL 6 landed** (commit `0dcb2a9`)
- **Cato-009 verify pass: NOT YET RUN** — token budget approaching cap; phoned home instead

## What needs Alton's call

Three reasonable paths:

**(a) Spawn Cato-009 verify pass, then fire experiment 002.** The Cato chain has been religious about verifying every revise pass with a fresh re-prosecution. Cost: ~50-80K tokens for Cato-009. Risk: tight against 800K budget; might phone home again. Lowest residual risk on patch fidelity.

**(b) Skip Cato-009 (per complex-project skill stopping rule — patches are mechanical text edits) and fire experiment 002 directly after grep-verifying patches.** All 6 patches were ~1-15 line text edits; Cato-008 closing said "trajectory mirrors the parent plan: tighter framework, smaller charges, recurrent defect class is co-located thresholds." A grep verification suffices for these mechanical patches. Cost: ~5K tokens for grep verification + ~1.5 GPU-hours wall-clock for the actual fire. Saves the Cato-009 round.

**(c) Pause for principal review of the full Phase 2 plan + experiment 002 doc before either firing or Cato-009.** Highest discipline; lets you read the plan + experiment doc directly before any consequential action. Cost: zero compute today; Phase 2 first-fire deferred until your read.

I recommend **(b)** for efficiency reasons — Cato-008's 6 charges all converted to mechanical text patches, and Cato-008's own closing predicted Cato-009 GREENLIGHT after these patches. The plan-Cato chain (Cato-001 through 007) is already at GREENLIGHT and the experiment-doc-Cato chain is one trivial verify pass from the same. But (a) is the safer choice if you prefer the discipline; and (c) is the right choice if you want to read the artifacts yourself before Phase 2 first-fire.

## Phase F (execution) is gated by principal greenlight regardless

Per the complex-project skill Phase 7, GPU compute requires explicit principal greenlight in chat. Even if Cato-009 GREENLIGHT lands, Phase F (the actual experiment 002 fire) does not proceed without your "fire" instruction.

## Token budget state

Approaching 800K cap (estimated ~770-780K consumed). Per the directive's "phone home if you blow past 800K instead of truncating mid-phase," I'm phoning home now rather than spawning Cato-009 + risking truncation. If you call (a), I can spawn Cato-009 with whatever budget remains; if you call (b), the grep verification + execution use trivial tokens.

## State

- Plan: `PHASE-2-RESEARCH-PLAN.md` post-Cato-007 GREENLIGHT (commit `a1dfea4`)
- Experiment 002: post-Cato-008-revise (commit `0dcb2a9`)
- HARDWARE.md: post-BoM-correction (commit `d5f5674`)
- 5 Phase-A inputs: all in main, immutable historical record
- 8 Cato prosecutions: CATO-PROSECUTION-001 through 008 in main, immutable
- No GPU work executed in Phase 2. Compute idle.

— rtxserver, 2026-04-26
