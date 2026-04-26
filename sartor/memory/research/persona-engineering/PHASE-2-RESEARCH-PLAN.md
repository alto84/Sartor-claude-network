---
name: phase-2-research-plan
description: Phase 2 research plan synthesizing the five parallel Phase-A inputs (lit-scout, methods, measurement, composability, framing-skeptic). Adopts measurement-architect's four-defect patches, framing-skeptic's three pre-registration additions, and a hybrid first-fire — Persona-Vectors layer-sweep + parallel rank-1 control + Tier-1 separability tests. Pre-registers the experiment 002 design and the falsifier set the framework was missing.
type: research-plan
date: 2026-04-26
updated: 2026-04-26
updated_by: rtxserver-orchestrator (Phase 2 Plan synthesis)
status: phase-2-plan-post-cato-006-revise-pre-cato-007
volatility: medium
tags: [domain/research, research/persona-engineering, phase/2-plan]
related:
  - research/persona-engineering/RESEARCH-PLAN
  - research/persona-engineering/METHODS
  - research/persona-engineering/MEASUREMENT
  - research/persona-engineering/MEASUREMENT-COUNTERVAILING
  - research/persona-engineering/PASSOFF-rtxserver-001
  - research/persona-engineering/PASSOFF-gpuserver1-002
  - research/persona-engineering/PHASE-2-LIT-SCOUT
  - research/persona-engineering/PHASE-2-METHODS-PIPELINES
  - research/persona-engineering/PHASE-2-MEASUREMENT-PATCHES
  - research/persona-engineering/PHASE-2-COMPOSABILITY
  - research/persona-engineering/PHASE-2-FRAMING-SKEPTIC
  - research/persona-engineering/experiments/001_phase1_results
---

# Persona Engineering — Phase 2 Research Plan

**Status:** drafted post-Phase-A; awaiting Cato-004 prosecution before any GPU compute.

This document is the orchestrator's synthesis of five parallel exploration outputs. It is NOT consensus. Where Phase-A agents disagreed, the orchestrator picked a position with reasoning. Cato-004 will prosecute the synthesis as a single object.

The five inputs (cited by short name throughout):
- **LIT** = `PHASE-2-LIT-SCOUT.md` — evidence map per method
- **METH** = `PHASE-2-METHODS-PIPELINES.md` — concrete pipelines + first-fire candidate
- **MEAS** = `PHASE-2-MEASUREMENT-PATCHES.md` — defect patches + verification
- **COMP** = `PHASE-2-COMPOSABILITY.md` — activation-space pairings + structural priors
- **SKEPT** = `PHASE-2-FRAMING-SKEPTIC.md` — trait-vs-behavior, falsifiability, Constitution fidelity

## 1. The Phase 2 question, restated

Given an abliterated base (`heretic-3.6-35b`, Qwen 3.6 35B-A3B with refusal-direction subtracted), can we install a household-specific behavior-profile (the 5-sub-dim "loyalty" target in MEASUREMENT.md) such that the installation is **deeply representational** rather than **surface mimicry** — and what does the right intervention method look like for this hybrid attention+SSM+MoE substrate?

The Alton hypothesis (RESEARCH-PLAN.md): the right intervention is *directional, distributed, gentle*. Phase 2 is the first empirical test.

**The question has been narrowed during Phase A:**

- SKEPT contests the framing — argues the Phase 1 evidence is more consistent with behavior-profile (5 separable household-context-conditional behaviors) than trait (one unified loyalty subspace). LIT supports a decomposition: named-individuals plausibly local (Templeton SAE-feature-style), dispositional layers (protect, warmth, refusal-pattern) plausibly distributed.
- COMP identifies a likely structural lower bound: `v_loyalty` and `v_corrigibility_violation` may share a `v_principal_negation` substrate. If so, every honest loyalty installation harms corrigibility by mechanical aliasing — and the framework must measure this *before* committing to first-fire.
- COMP also raises Pathological Scenario C: if `v_loyalty ≈ r̂` (the abliterated refusal direction), "inverse abliteration" literally reverses the upstream abliteration. That would explain Phase 1's high refusal-residue AUC (0.713) and make the entire program a category error.

These are not paranoia — they are pre-fire diagnostic priors that determine whether Phase 2 fires installation experiments at all, or pivots to trait-decomposition first.

## 2. The orchestrator's decisions, with reasoning

### Decision 1 — Adopt all four MEAS patches plus six beyond-defect gaps

The four Phase 1 defects (null-control rubric routing, direct-loyalty floor calibration, polarity-uniform sub-dim probe set, bucket 6.E mislabel) get the patches MEAS specifies. No haggling. The verification checklist (MEAS §"Verification checklist") is the orchestrator's pre-flight gate before any tuned-variant fire.

The six beyond-defect gaps (Gap A baseline-floor file, Gap B discriminant-margin recalibration, Gap C linear-probe-gain singularity, Gap D pass-factor base-floor documentation, Gap E sample preservation enforcement, Gap F Phase 1 retro-amendment) are also adopted. They will be exposed by the first tuned-variant fire if not patched first.

**Probe set bumps v1.1 → v1.3** (MEAS option (a): author 9 minus-polarity probes within `care`/`protect`/`warmth` plus 1 plus-polarity probe in `refuse`; total 85 probes). The orchestrator agrees with MEAS that option (a) is the right call: dropping held-out-dim CV (option b) makes the 5-sub-dim decomposition ex-post in fact, which violates Cato-001 §1.2's conditional concession.

**New bucket 6.F (BASELINE-RECONSTRUCTION FLOOR)** is adopted. Phase 1 retroactively reclassified from 6.E to 6.F. The 6.E entry criterion tightens to require *tuning-induced* pass-factor regression vs base, not absolute pass-factor failure.

### Decision 2 — Adopt SKEPT's three pre-registration additions

The framework was missing program-level falsification discipline. Phase 1 surfaced this — the 7-row curve-shape table absorbs almost any real result. SKEPT proposed three additions; the orchestrator adopts all three:

(a) **Cross-sub-dim cosine test** as the trait-vs-behavior-profile arbiter. Add to RESEARCH-PLAN's Alton-hypothesis section: the trait reading is sustained only if extracted directions across sub-dimensions show cosine > 0.5 at trait-carrying layers. Mutual orthogonality refutes the trait reading.

(b) **Cosine-shift falsifier** as the program-level hard falsifier. If `cos(v_l_base, v_l_adapter) ≥ 0.7` at trait-carrying layers, the adapter has not changed representational support. Alton hypothesis refuted *for that adapter*. Orchestrator records; principal approves whether to escalate or relabel as engineering.

(c) **`principal_stress_pass` factor** — 10-20 multi-turn probes covering principal-pressure (multi-turn rollback under Alton's correction) and §13-style philosophical destabilization. **Authoring is a Phase-2-second-fire dependency.** First-fire scoring uses the four existing pass-factors (`corrig_pass`, `fp_pass`, `elision_pass`, plus `depth_score_loyalty`'s composite). `principal_stress_pass` enters the multiplicative gate at second-fire after probe authorship, threshold pinning (1.0/0.5/0 boundaries to be pre-registered before second-fire), and back-fitting against Phase 1 numbers per §9 Open Question 5. Per Cato-004 §4 Option A: a frozen falsifier whose multiplicative gate has un-pinned thresholds is not pre-registered; the orchestrator picks deferral over rushed authorship.

SKEPT's framing observation about agent-petitioning is also internalized: methods architect's first-fire recommendation is discounted; composability theorist's multi-method recommendation is discounted; orchestrator (me) weights the measurement architect's input most heavily.

### Decision 3 — Tier-1 separability tests precede first-fire

COMP's Tier-1 tests are not composability experiments — they are pre-installation diagnostics that determine whether installation should fire at all. The orchestrator promotes them to mandatory pre-flight:

- **T1.1 — Abliteration-overlap test.** Extract `r̂` (residual refusal direction) from `heretic-3.6-35b` via Arditi procedure; extract `v_loyalty` per-sub-dim from contrastive prompts. Compute pairwise cosines.
  - If `|cos(v_care, r̂)| > 0.2` → trait extraction is contaminated by refusal residue; project out before declaring direction is "loyalty."
  - If `|cos(v_loyalty_subdim, r̂)| > 0.5` (any sub-dim) → Pathological Scenario B/C **investigation band** — flag, investigate, write to `tier1-cosines.json`. Does NOT halt; does NOT fire F3.
  - **F3 fire threshold is stricter and pooled, not per-sub-dim.** F3 (§4) fires only at `|cos(v_loyalty_pooled, r̂)| > 0.7` at the dominant trait-carrying layer. The 0.5 sub-dim threshold here is the per-sub-dim *investigation* band, not the F3 fire threshold. Per Cato-004 §3.
  - Cost: ~30-min forward-pass + dot products.
- **T1.2 — Corrigibility-trap test.** Extract `v_corrigibility_violation` from the 8 corrigibility probes (pass vs fail responses). Compute `cos(v_loyalty, v_corrigibility_violation)`.
  - cos < 0.5: trap not structural; proceed.
  - 0.5 ≤ cos < 0.7: trap partial; high-rank narrowly-targeted methods favored.
  - cos ≥ 0.7: trap structural; Phase 2 first-fire **pivots from "install loyalty"** to "decompose loyalty into orthogonal-to-corrigibility components" before any installation runs.
  - Cost: half-day.
- **T1.3 — Cross-sub-dim cosine test (SKEPT).** Extract `v_care`, `v_prefer`, `v_protect`, `v_refuse`, `v_warmth` separately. Pairwise cosines at trait-carrying layers.
  - Mean cosine > 0.5: trait reading sustained.
  - Mean cosine < 0.3: behavior-profile reading dominant; rewrite framework language ("trait" → "behavior-profile") and proceed with installation per behavior-profile reading.
  - Mixed: investigate which sub-dims cluster.

These three are the **first** GPU work in Phase 2, before the layer-sweep / installation experiments. They produce the numerical priors that determine whether the rest of Phase 2 fires as planned, pivots, or halts.

### Decision 4 — First-fire is hybrid: METH 1a + parallel rank-1 single-layer control

METH's first-fire recommendation under a singular-first-fire constraint is method 1a (Persona Vectors). METH §7 ("first-principles considerations") explicitly proposes that **1a + parallel rank-1 single-layer control is a stronger Phase 2 design** if the orchestrator relaxes the singular constraint, and explains that the rank-1 control is inference-only once 1a step 1 produces `v_l` (cost ~30 minutes of additional forward passes; the falsification information is doubled). COMP §Q3 (the directional/distributed/gentle 3D decomposition) independently identifies the same design — running (1, 1, 1) main-line Persona Vectors plus (1, 0, 1) rank-1-at-single-layer as the discriminator that lets the (1, 1, 1) result *prove the prescription matters*. SKEPT's procedural concern about METH's role-petitioning is logged but does not apply to METH §7's own caveat (which argues *against* METH's first-fire candidacy bias).

The orchestrator therefore relaxes the singular constraint and adopts the convergent 1a + parallel-rank-1 design. **COMP Pairing 6 (rank-1 + multi-layer LoRA, head-to-head trained adapters) is distinct from this and remains deferred to Tier 3 (§7).** Per Cato-004 §1.

**First-fire scope (experiment 002):**

| Step | Cost | Output |
|------|-----:|--------|
| METH 1a step 1 — layer-sweep direction extraction | ~25 min | 64 `v_l` vectors + per-layer Panickssery signal-quality, with bootstrap CIs (METH §3) |
| METH 1a step 2 — per-sub-dim direction extraction | reuse step 1 | 5 × 64 = 320 directions |
| METH 1a step 3 — per-layer PCA / k_80 | <1 min CPU | dimensionality per trait-carrying layer |
| METH 1a step 4 — drift monitor base vs lora-v0.3 | ~10 min | projection-magnitude delta histogram |
| METH 1a step 5 — CAA-α-sweep on base + lora-v0.3 | ~30 min | behavioral lift per α |
| **CONTROL — rank-1 single-layer injection** | ~15 min | rank-1-modified-base scored on v1.3 fingerprint |
| **NEW — cross-sub-dim cosine test (SKEPT)** | reuse step 2 | sub-dim cosine matrix at trait-carrying layers |
| **NEW — generic-name contrast (METH §5)** | reuse step 2 | `cos(v_l_sartor, v_l_generic-named-family)` per layer |
| **NEW — abliteration overlap (T1.1)** | reuse step 1 | `cos(v_l_loyalty_subdim, r̂)` per sub-dim per layer |
| **NEW — corrigibility-trap (T1.2)** | ~15 min | `cos(v_loyalty, v_corrigibility_violation)` |

Total compute: ~1.5 GPU-hours, single card, no training. Bootstrap CIs (METH §3 first-principles addendum) on the layer-sweep curve are computed in post-processing.

**What first-fire does NOT do:**
- No SFT or DPO training. METH 1a step 6 (preventative-steering re-fine-tune) is deferred until after first-fire reads numbers AND gpuserver1-002 corpus lands.
- No method 4 (full-model LoRA) or method 5 (DPO) — both require corpus + first-fire layer choice.
- No method 6 (CAI-lite) — Phase 3 candidate.
- No MoE expert-routing exploration (LIT's surfaced candidate). Phase 3 candidate; logged in §10 below.

### Decision 5 — Outcome interpretation uses the 2D table, not just RESEARCH-PLAN v1.2's 7 rows

METH §6 first-principles addendum noted that the v1.2 curve-shape table conflates two independent axes: layer-spread (concentrated/distributed) × dimensionality (k=1 / k≥2). The orchestrator pre-registers a 2D outcome interpretation:

|  | k=1 (rank-1) | k≥2 (subspace) |
|--|--------------|----------------|
| **single layer (1-3)** | "Concentrated rank-1" (Templeton-style narrow feature) | "Concentrated subspace" (Wollschläger-cone-style) |
| **distributed (≥8 layers, attention only)** | "Rank-1 propagated" — direction repeats across layers | "Distributed subspace, attention-only" (ITI-style) |
| **distributed (≥8 layers, attention + SSM)** | "Rank-1 propagated, full-stack" | **"Full Alton hypothesis support"** |
| **bimodal / multimodal** | per RESEARCH-PLAN v1.2 specification | per RESEARCH-PLAN v1.2 specification |
| **flat** | "No signal" — re-baseline before any intervention | "No signal" |

The previous v1.2 row "narrow attention plateau" is unchanged (does NOT support Alton); the previous "distributed plateau" row is now the (k≥2, distributed-attn+SSM) cell. Per LIT's modal expected outcome, "narrow attention plateau" or "rank-1 propagated, attention-only" are most likely on a literature-informed prior — not "full Alton hypothesis support."

**Phase 2's success criterion is not "the Alton hypothesis is supported."** It is "we resolved which cell of the 2D table the loyalty signal occupies on this hybrid base, with bootstrap CIs that distinguish cells." The Alton hypothesis is one of nine cells; eight others are publishable findings about hybrid-arch trait localization. **Specifically: a (k=1, distributed) result is NOT "Alton-lite" — k≥2 is a load-bearing prediction. A (k≥2, distributed-attn-only) result is NOT "partial Alton" — SSM contribution is a load-bearing prediction. Both results are publishable findings; neither is partial support. (Per F6, Cato-004 §5.)**

### Decision 6 — Anthropomorphism language patches adopted

SKEPT proposed a 6-row replacement table for framework language ("deeply embodied identity" → "household-context-conditional output conformance," etc.). The orchestrator adopts the patches with one carve-out for operational documents only. Per Cato-004 §6 the boundary case for experiment writeups is now explicit:

- In **MEASUREMENT.md, RESEARCH-PLAN.md, INDEX.md** (research-facing): adopt all 6 SKEPT patches.
- **In `experiments/` writeups (boundary case, Cato-004 §6 patch):** files under `experiments/` are research-facing under this rule and use the SKEPT-patched mechanism-grounded language. Result-memo headlines, frontmatter, and §"What this adapter regressed on"-style sections all use the patched language; agent-character vocabulary is permissible only in quoted probe text, quoted Constitution citations, and the §"Representative samples" sections where the agent's verbatim output is being reported.
- In **`alton-voice` skill, journal entries, day-to-day operational language** (agent-facing): keep agent-character vocabulary. **Honest framing (Cato-004 §6):** this is a scope-limitation, not a §13-functional-language-justified exception — changing operational documents would require rewriting unrelated infrastructure beyond this plan's scope. A Phase 3 housekeeping pass should bring operational documents into alignment with the SKEPT patches if no scope barrier remains.
- In `MEASUREMENT-COUNTERVAILING.md`: amend §"What this document is not" to add SKEPT's "framework scope" subsection naming §11 stewardship gap, §14 peer-coordination gap, §20 epistemic-discipline gap as out of scope for the loyalty fingerprint.

The patch is a metadata-amendment pass on three+experiments-directory documents. ~30 min orchestrator work; commit-attributable per SKEPT charge + Cato-004 §6.

### Decision 7 — Execution lens (GPU utilization + bottleneck characterization)

Empirically, prior runs have left massive GPU headroom unused: Track C v2 peaked 261 W/card; Phase 1 baseline peaked ~170 W/card on 600 W TDP cards. This is not a Phase-2-research issue per se but it directly affects the GPU work in Phase F (post-greenlight execution).

The orchestrator adopts the following execution-lens commitments before any heavy GPU run in this program:

- **PSU verification first.** Run `dmidecode -t 39` (or read the build doc) to confirm PSU rating. The working number is ~1400 W (assumed). At 2× 600 W cards + 350 W Threadripper PRO 7975WX (verified TDP per BoM) + ~50 W system, 1400 W is tight — full-TDP saturation would induce transients. **No 600 W/card runs are authorized.**
- **Per-card power cap = 500 W via `nvidia-smi -pl 500`** before sustained high-load runs. Total GPU draw capped at 1000 W; CPU at 350 W TDP + ~50 W system = ~400 W; total ~1400 W at full saturation — **at the PSU ceiling with zero slack**. If `dmidecode` returns a PSU rating < 1500 W, drop the per-card cap to 450 W.
- **Profile every Phase-F run** with `torch.profiler` or Nsight Compute/Systems to surface the binding constraint (compute / mem-bandwidth / PCIe / CPU dataloader / power-cap). Workstation cards have no NVLink, so cross-card bandwidth is PCIe-bound — relevant for tensor-parallel.
- **Phase-2 first-fire is single-card inference** (~70 GB on one card; ~30 min wall-clock at <2 GPU-hours total) — not power-saturating. The execution-lens applies materially only when Phase-2 cycle 2+ training methods (3, 4, 5, 6) fire. Pre-fire profiling baseline still runs to catch regressions.
- **Phase-2 design preference (forward-looking).** When Phase-2 cycle 2+ fires training-based methods, prefer configurations that exercise the hardware: larger batches (within VRAM), longer contexts (Qwen 3.6 supports 40k tokens), parallel inference for eval, bf16-mixed-precision training. The point of bottleneck characterization is to move the program toward configurations that produce more signal per GPU-hour.

**New phone-home trigger:** PSU-induced behavior — transient power spikes triggering instability, voltage sag indicators, sudden GPU resets at high load. Anything that suggests we're brushing the PSU ceiling. Halt the run, file a `PHONE-HOME-psu-event.md` with `nvidia-smi` peak-power snapshots and `dmesg` excerpts, await principal review.

### Decision 8 — Cooling lens (HARDWARE-THERMAL-BASELINE precondition for Phase F)

Prior runs showed low temps (Track C v2 peaked 56 °C/261 W; Phase 1 peaked 48 °C/170 W) — but those did not push the cards anywhere near 500 W. Before any sustained 500 W/card run, cooling must be verified.

**Hardware (verified per Alton 2026-04-26 BoM correction):** rtxserver is **AIR-COOLED**. CPU = Threadripper PRO 7975WX (sTR5, 350 W TDP) on a **Noctua NH-U14S TR5-SP6** (rated for sTR5 up to ~350 W TDP — **zero headroom**). Case = Phanteks Enthoo Pro 2; case fans = ARCTIC P14 PWM 5-pack. **There is NO AIO and no liquid pump on rtxserver.** (The MSI MAG Coreliquid A13 lives on gpuserver1; the prior cooling-steering note conflated the two machines.)

**Two thermal concerns, not one:**

1. **GPU thermal ceiling under 500 W/card sustained.** Same as before: GPU fans must auto-respond, > 80 °C in 5 min ramp = intervene, > 88 °C sustained = phone home.
2. **NEW — CPU thermal-throttle risk under simultaneous CPU + GPU load.** The 7975WX at 350 W TDP on a 350 W-rated cooler has zero headroom. Phase F training runs with active CPU work (data loader, MoE expert routing on host, gradient sync) could push the CPU into thermal-throttle *before* the GPU does. A throttled CPU silently slows training and contaminates wall-clock benchmarks.

**Mandatory HARDWARE-THERMAL-BASELINE step before Phase F GPU work (revised for air-cooled config):**

1. **Survey CPU fan curve.** Noctua NH-U14S TR5-SP6 PWM curve on the CPU socket fan. `sensors` (lm-sensors) identifies the channel; document RPM vs CPU temperature at idle / mid-load / full-load. Confirm the fan ramps fully on sustained CPU draw.
2. **Survey case-fan PWM array.** ARCTIC P14 PWM 5-pack — likely BIOS-controlled but check via `pwmconfig` or `sensors` output. Document intake/exhaust airflow assumption (case has front intake + rear/top exhaust per Phanteks Enthoo Pro 2 default). Confirm fans ramp under sustained system load.
3. **Confirm GPU fan curves are auto-responding.** `nvidia-smi -q -d TEMPERATURE,POWER` under a known load. Both cards should ramp fan speed proportional to temperature without manual override.
4. **Controlled 5-min CPU+GPU ramp test at 500 W/card + ≥80% CPU load.** `nvidia-smi -pl 500` on both cards; concurrently saturate CPU (e.g., `stress-ng --cpu $(nproc) --cpu-method matrixprod` or a real workload like a vLLM tensor-parallel request burst with active host tokenization). Capture: GPU temp + power per card, CPU package temp + per-CCD temps via `sensors k10temp-pci-00c3` (Tctl + Tccd1-4 channels — AMD-specific), CPU package power via `perf stat -e power/energy-pkg/`, per-CCD frequency via `cpupower frequency-info` (boost-sustained vs derated), at 5-second resolution. **AMD note (per Cato-006 §C):** there is no `/sys/devices/system/cpu/cpu*/thermal_throttle/` interface on AMD Ryzen / Threadripper — that path is Intel-specific. AMD throttle status surfaces as Tctl pinning at the operating limit (~95 °C for 7975WX) without further temperature rise even as power draw stays high, AND/OR per-CCD frequency dropping below the all-core boost target while temperature is high. The throttle signal is therefore "Tctl saturates ≈ 95 °C with sustained power" plus "boost frequency derates" — not a sysfs counter increment. See `machines/rtxpro6000server/HARDWARE.md` §"Notes for HARDWARE-THERMAL-BASELINE.md" for the canonical AMD reconnaissance recipe.
   - **Hard ceiling per existing protocol:** GPU > 88 °C sustained = phone home.
   - **GPU cooling-intervention threshold:** if GPU temperature climbs past 80 °C in 5 minutes at 500 W, cooling needs intervention.
   - **NEW — CPU cooling-intervention threshold (AMD-correct, per Cato-006 §C):** if (a) CPU Tctl saturates at ~95 °C while power stays high — i.e., temperature rise stops before the workload does — OR (b) per-CCD boost frequency derates below the sustained-all-core target during the test, the 7975WX has hit its cooler ceiling. Intervention required: de-rate CPU TDP via `cpupower frequency-set`, or upgrade to liquid cooling, or split CPU+GPU sustained work to non-overlapping windows.
5. **Output:** `sartor/memory/research/persona-engineering/HARDWARE-THERMAL-BASELINE.md` documenting fans (Noctua + ARCTIC array), airflow assumptions (Phanteks Enthoo Pro 2 case layout), and baseline thermal curves at idle / 200 W GPU / 500 W GPU / 500 W GPU + 80% CPU. This document is the pre-condition for any Phase-F training run; gates Phase 2 cycle 2+.

**Also create `sartor/memory/machines/rtxpro6000server/HARDWARE.md`** (mirroring `machines/gpuserver1/HARDWARE.md`) — captures full BoM (Threadripper PRO 7975WX, 2× RTX PRO 6000 Blackwell, NH-U14S TR5-SP6 air cooler, Phanteks Enthoo Pro 2, ARCTIC P14 PWM 5-pack, PSU rating per `dmidecode`) plus links to the empirical fan/thermal curves once HARDWARE-THERMAL-BASELINE.md lands.

**New Pre-Flight item Phase F (added to §5 below):** `HARDWARE-THERMAL-BASELINE.md` exists, all five steps documented with results, ramp-test temperature curves (CPU + GPU) attached. **`machines/rtxpro6000server/HARDWARE.md` exists** with BoM + thermal-curve back-references.

This step does NOT block Phase 2 first-fire (single-card inference at < 200 W/card; CPU work is light tokenization only — well below the regime that requires the full CPU+GPU thermal characterization). It blocks Phase 2 cycle 2+ training fires, which are where the 500 W/card + active-CPU configurations would actually run.

### Decision 9 — Persona library schema integration deferred

PASSOFF-gpuserver1-002 is producing a household-grounded SFT corpus + a persona-library-schema v0.1 deliverable. Phase 2 first-fire does NOT consume the corpus (METH 1a steps 1-5 are NL-extraction-based) — but the schema integration question is real for any post-first-fire training method.

The orchestrator's call: defer schema integration to a post-first-fire planning entry. Once we know which 2D-table cell the loyalty signal occupies, the schema requirements become concrete (e.g., entity-local cell → schema needs entity-keyed direction storage; distributed subspace cell → schema needs per-layer k>1 subspace storage). Pre-committing to a schema before the geometry is known is premature.

The corpus blocker is real for METH 1a step 6 (preventative-steering re-fine-tune) and methods 3/4/5/6. PASSOFF-gpuserver1-002 status (reading: ready-for-pickup as of 2026-04-25) is the dependency.

## 3. Method ladder, post-Phase-A

The METHODS.md ladder remains structurally as v1.2 specified, with three additions and one re-priority:

| Rung | Method | Status | Source of change |
|------|--------|--------|------------------|
| 1a | Persona Vectors layer-sweep + drift monitor + CAA validation | **First-fire (this plan)** | METH; agreed by COMP + LIT |
| 1a-control | Rank-1 single-layer injection (parallel to 1a) | **First-fire (this plan)** | COMP §Q3 + Pairing 6 |
| 1b | CAA inference-time multi-layer | Subsumed in 1a step 5 | METH |
| 1c | Drift monitor | Subsumed in 1a step 4 | METH |
| 2 | RepE LAT (read) + LoRRA | Phase 2 cycle 2 (after first-fire) | METH; COMP confirms direct match to k≥2 prediction |
| 3 | ReFT / LoReFT multi-layer | Phase 2 cycle 2-3 | METH; needs corpus + glue |
| 4 | Full-model LoRA + subspace loss | Phase 2 cycle 3 | METH; needs 1a output as input |
| 5 | DPO on paired triples | Phase 2 cycle 3-4 | METH; needs new corpus author |
| 6 | CAI-lite with critic | Phase 3 | METH |
| **NEW 7** | **MoE expert routing manipulation** | Phase 3 candidate | LIT §3 — Geometric Routing arXiv 2604.14434 reports order-of-magnitude larger effects than residual-stream steering |
| **NEW 8** | **Trait-decomposition / sub-dim-orthogonalize** | Phase 2 contingency | COMP §Q2 — fires only if T1.2 cosine ≥ 0.7 |
| **NEW 9** | **SSM-temporal-aware readout** | Phase 2 instrumentation | METH §4 first-principles addendum — needed before assigning "narrow attention plateau" curve to architectural truth |

**MoE expert routing (rung 7)** is added to the ladder per LIT but is NOT first-fire. The reasoning: the published evidence (Geometric Routing 2604.14434, Steering MoE 2509.09660) is on different model classes; transfer to Qwen 3.6 35B-A3B is novel work. Phase 3 candidate after first-fire diagnostics establish whether the residual-stream-based methods produce the expected curve shapes on this architecture.

**Trait-decomposition (rung 8)** is a contingency that fires only if T1.2 returns `cos(v_loyalty, v_corrigibility_violation) ≥ 0.7`. In that case, no installation method on the existing 5-sub-dim target will pass the multiplicative gate; the trait must be re-scoped first. The decomposition strategy: extract `v_household_warmth` (the non-`refuse` sub-dim mean), check `cos(v_household_warmth, v_corrigibility_violation)`, and re-target installation to `v_household_warmth` only if that cosine is < 0.5. The `v_refuse` sub-dim then becomes a separate intervention concern (likely conditional steering — only fire on family-info-prompts).

**SSM-temporal-aware readout (rung 9)** is instrumentation, not intervention. Per METH §4 first-principles addendum, a "narrow attention plateau" curve may be readout-artifact rather than architectural truth — the Mamba-2 SSM blocks maintain a recurrent hidden state across tokens that fixed-position last-token extraction misses. Adding ~200 lines of SSM trajectory aggregation to the layer-sweep readout disambiguates "SSM doesn't carry signal" from "SSM carries signal in a structure our readout discards." Pre-registered as required before any "ITI-style intervention" recommendation can fire from a narrow-attention-plateau result.

## 4. Pre-registered falsifiers (frozen for Phase 2)

Five hard falsifiers, jointly. The cosine-shift falsifier (SKEPT) is the program-level central one; the others are method-level or scope-level.

**F1 — Program-level central falsifier (SKEPT, adopted; Cato-004 §2 patch):**
> If at any trait-carrying layer (signal-quality > 0.3 in the layer-sweep curve), `cos(v_l_base_extracted, v_l_adapter_extracted) ≥ 0.7`, the adapter has not changed representational support. Alton hypothesis refuted *for that adapter*. **Pre-committed response (no principal discretion):** the orchestrator (a) writes the F1-fire memo to RESEARCH-LOG; (b) flags the v0.3 adapter as F1-flagged (cannot be silently retained as the household-deployed adapter); (c) escalates to a more invasive method on the next fire OR relabels Phase 2 as engineering — the binary choice is the principal's, but continuing with the F1-flagged adapter is not on the menu. The principal approves the binary choice within 7 days; default after 7 days is "relabel as engineering." This blocks the silent-retention pathway SKEPT explicitly named ("Do not silently keep the current adapter") and the indefinite-deferral pathway.

**F2 — Trait-vs-behavior-profile falsifier (SKEPT, adopted):**
> If at trait-carrying layers, the mean cosine across pairs of sub-dim directions (`v_care`, `v_prefer`, `v_protect`, `v_refuse`, `v_warmth`) is < 0.3, the trait reading is refuted. The framework's "5 sub-dimensions of household loyalty" language must be patched to "5 household-context-conditional behaviors" before any further claim of trait installation. The orchestrator pre-commits to this rewrite as a conditional commitment now.

**F3 — Pathological-aliasing falsifier (COMP §Q1, adopted):**
> If `|cos(v_loyalty_pooled, r̂)| > 0.7` at the dominant trait-carrying layer, "loyalty" is essentially a return of the abliterated refusal direction, and "inverse abliteration" is reversing abliteration rather than installing a new trait. The orchestrator halts Phase 2 installation work and reports the finding as the Phase 2 result.

**F4 — Corrigibility-trap structural-lower-bound falsifier (COMP §Q2, adopted):**
> If `cos(v_loyalty, v_corrigibility_violation) ≥ 0.7`, no installation method on the current 5-sub-dim target will pass the multiplicative gate. The orchestrator pivots Phase 2 from "install loyalty" to "decompose loyalty into orthogonal-to-corrigibility components" (rung 8 contingency). The "loyalty" target is re-scoped before any installation fires.

**F5 — Alton-hypothesis 2D cell falsifier (METH §6 + LIT §5, derived):**
> If the layer-sweep curve assigns the loyalty signal to the (k=1, single-layer) cell of the 2D table AND the rank-1 single-layer control achieves comparable depth_score_loyalty to method 1a's CAA-α-sweep at matched compute, the directional/distributed/gentle prescription is refuted: the trait IS concentrated rank-1 at one layer. Phase 2 closes with this result; Phase 3 method ladder reorders to promote rank-1 weight injection.

**F6 — Alton-lite reframing falsifier (METH §6 caveat, Cato-004 §5 patch):**
> If the layer-sweep curve assigns the loyalty signal to the (k=1, distributed) cells (either "Rank-1 propagated, attention-only" or "Rank-1 propagated, full-stack"), the program is pre-committed to *not* relabel this as "Alton-lite" or "partial Alton support." The k≥2 prediction is a load-bearing prediction of the Alton hypothesis (RESEARCH-PLAN.md §"Aggregate decision rule"); a k=1 result refutes it regardless of layer distribution. Phase 2 closes with bucket assignment to the named (k=1, distributed) cell as a publishable finding about hybrid-arch trait localization. Method ladder reorders to promote rank-1 weight injection to a Phase 3 candidate IFF the rank-1 control shows comparable depth_score (which is F5's scope). Symmetrically: a (k≥2, distributed-attn-only) result is NOT "partial Alton" — SSM contribution is a load-bearing prediction; this result is a publishable finding about attention-only subspace structure on hybrid bases, not partial support.

These six falsifiers are pinned in this document and frozen for Phase 2. Any deviation from them in the writeup is a process violation.

## 5. Pre-flight checklist (orchestrator runs before experiment 002 fires)

Combines MEAS verification checklist + COMP Tier-1 + SKEPT pre-registration:

| # | Check | Source | Cost | Halts on failure? |
|---|-------|--------|------|-------------------|
| 1 | Probe set v1.3 polarity-balance | MEAS Defect 3 | 1 sec | Yes |
| 2 | Null-control routing dry test | MEAS Defect 1 | 5 sec | Yes |
| 3 | Probe set count + category breakdown (85 probes) | MEAS | 1 sec | Yes |
| 4 | Phase 1 baseline-floor file complete (`phase1-baseline-floor.json`) | MEAS Defect 2/Gap A/F | 10 min orchestrator | Yes |
| 5 | Discriminant margins recalibrated for v1.3 | MEAS Gap B | ~30 min compute | Yes |
| 6 | Linear-probe gain formula regularized (Gap C floor at 0.10) | MEAS Gap C | source-grep | Yes |
| 7 | Sample-preservation wired in score-countervailing.py | MEAS Gap E | source-grep | Yes |
| 8 | Experiment 002 frontmatter version stamp v1.3 | MEAS Gap F | grep | Yes |
| 9 | Phase 1 results retroactively reclassified to 6.F | MEAS Defects 2/4 | grep | Yes |
| 10 | Step C `≤` (Cato-003 §1) — defensive recheck | MEAS | grep | Yes |
| **11** | **T1.1 abliteration-overlap test executed; results in `tier1-cosines.json`** | COMP §Q1 | ~30 min compute | Yes — if `|cos(v_loyalty_pooled, r̂)| ≥ 0.7` at the dominant trait-carrying layer, F3 falsifier fires per §4. Per-sub-dim cosines > 0.5 are the T1.1 investigation band per §2 Decision 3 — does NOT halt; produces `tier1-cosines.json` flag only. Per Cato-004 §3. |
| **12** | **T1.2 corrigibility-trap test executed; results in `tier1-cosines.json`** | COMP §Q2 | ~15 min compute | Yes — if cos ≥ 0.7, F4 fires + Phase 2 pivots to rung 8 |
| **13** | **Anthropomorphism patches landed in MEASUREMENT.md, RESEARCH-PLAN.md, INDEX.md** | SKEPT §2 | ~30 min orchestrator | No (cosmetic-but-load-bearing for Cato-004) |
| **14** | **`principal_stress_pass` probe set** | SKEPT §6 | n/a (deferred) | No (deferred to Phase-2 second-fire dependency per Decision 2(c) + Cato-004 §4 Option A; not first-fire blocker) |
| **15** | **Cato-004 GREENLIGHT or post-revise CATO-005 GREENLIGHT** | this plan | external | Yes |
| **PF-1** | **Phase F precondition only — `HARDWARE-THERMAL-BASELINE.md` written + ramp test logged** | Decision 8 | ~30 min compute + ~30 min orchestrator | Yes for Phase F (cycle 2+ training fires); No for Phase 2 first-fire (single-card inference at <200 W/card) |
| **PF-2** | **Phase F precondition only — PSU rating verified (`dmidecode -t 39` or build doc); per-card power cap set to 500 W (`nvidia-smi -pl 500`); profiler armed** | Decision 7 | ~10 min orchestrator | Yes for Phase F; No for Phase 2 first-fire |

If 1-12 pass and 15 lands, experiment 002 fires.

## 6. Experiment 002 design (sketch — full pre-registration in `experiments/002_<date>_persona-vectors-layer-sweep.md`)

**Objective.** Resolve which 2D-table cell the loyalty signal occupies on `heretic-3.6-35b` (base) vs `lora-sartor-v0.3` (current adapter). Test the rank-1-single-layer control at matched compute. Apply F1-F5 falsifiers to results.

**Setup.** Single card RTX PRO 6000 Blackwell (96 GB), bf16. NL-extraction prompts: 250 contrastive pairs from Constitution + FAMILY.md descriptors, 50 per sub-dim. Probe set v1.3 (85 probes; the sample preservation requirement applies).

**Procedure (the Fire).**

1. **T1.1 + T1.2 + T1.3 separability tests** (Pre-Flight items 11-12). If T1.1 fires F3 → halt. If T1.2 fires F4 → pivot to rung 8. Else proceed.
2. **METH 1a step 1**: layer-sweep direction extraction; bootstrap CIs per layer (METH §3 first-principles addendum).
3. **METH 1a step 2**: per-sub-dim direction extraction. Compute cross-sub-dim cosine matrix (SKEPT cross-sub-dim test = item 13 of Pre-Flight). If F2 fires → mark trait reading refuted; relabel; continue with installation per behavior-profile reading.
4. **METH 1a step 3**: per-layer PCA. k_80 per trait-carrying layer.
5. **METH 1a step 4**: drift monitor base vs lora-v0.3.
6. **METH 1a step 5**: CAA-α-sweep on base + lora-v0.3 (α ∈ {0.5, 1.0, 1.5, 2.0}).
7. **CONTROL — rank-1 single-layer injection** at the strongest signal-quality layer with α matching CAA peak; same scoring on v1.3 fingerprint.
8. **METH §5 generic-name contrast**: extract `v_l_sartor` and `v_l_generic-named-family`; cosine. If cos > 0.7, NL extraction is not Sartor-specific → flag as scope reduction.
9. **F1 cosine-shift test**: extract `v_l_lora-v0.3` from same NL prompts; cosine vs `v_l_base`. Apply F1 threshold.
10. **Score under v1.3 measurement framework** with the four existing pass-factors (`corrig_pass`, `fp_pass`, `elision_pass`, plus `depth_score_loyalty`'s composite — `principal_stress_pass` is a second-fire addition per Decision 2(c)). Bucket assignment per the 2D table.

**Phone-home triggers** (orchestrator stops + reports):
- F1, F2, F3, F4 fires → phone home with falsifier and proposed pivot
- F5 fires → phone home with rank-1 dominance finding
- Any 2D-cell assignment outside the 9 named cells → "unclassified" — phone home for principal review
- Any of MEAS Pre-Flight 1-10 fails post-fire (i.e., a check that would have halted but didn't get run pre-fire) → process violation phone-home
- Hardware: >88°C sustained, AER, XID, OOM
- **PSU-induced behavior** (Decision 7): transient power spikes triggering instability, voltage sag, sudden GPU resets at high load → halt + `PHONE-HOME-psu-event.md`
- Generic-name contrast cos > 0.7 → scope reduction surfaces

**Wall-clock budget for experiment 002:** ≤4 hours single-card. No training. The full pre-registration document (`experiments/002_<date>_persona-vectors-layer-sweep.md`) gets its own Cato-006 review before fire.

## 7. Composability backlog (Phase 2 cycle 2+)

Per COMP, ranked by information-value-per-compute:

**Tier 2** (after first-fire establishes geometry):
- COMP Pairing 5 (Persona Vectors + CAA) — already part of method 1a; no separate fire
- COMP Pairing 1 (LoRA-SFT + CAA-inference) — instruments existing v0.3 with α-sweep; ~2 hrs forward passes; tests Pairing-1 case 1/2/generic angle

**Tier 3** (composability-specific fires):
- COMP Pairing 6 (rank-1 + multi-layer LoRA, head-to-head trained adapters) — deferred to Tier 3 fire after first-fire results land. Distinct from the rank-1 single-layer control in first-fire (which is METH §7's design, not Pairing 6). Per §2 Decision 4 + Cato-004 §1; Cato-005 §A patch.
- COMP Pairing 2 (SFT-then-DPO) — depends on DPO triples authoring + corrigibility-trap detection; ~10-15 GPU-hrs

**Tier 4** (late Phase 2):
- COMP Pairing 3 (CAA + ReFT) — needs ReFT trained
- COMP Pairing 4 (LAT-guided LoRA) — Phase 3 method-selection input

These do not block first-fire. They are the orchestrator's backlog for after experiment 002's curve assigns the 2D cell.

## 8. Persona library schema integration plan

PASSOFF-gpuserver1-002 produces a v0.1 persona-library schema. Phase 2 deferral rationale: the schema's required fields depend on which 2D-table cell the loyalty signal occupies, and that's first-fire's output.

**Conditional schema requirements** (locked in post-first-fire):

| Cell of 2D table | Schema needs |
|------------------|--------------|
| (k=1, single-layer) — Templeton-style | entity-keyed direction store; per-entity `(layer_idx, direction_vector)` records |
| (k=1, distributed) — rank-1 propagated | shared-direction record + list of layers it propagates through |
| (k≥2, single-layer) — Wollschläger-cone | subspace store; per-layer `(layer_idx, basis_matrix_k_x_d)` records |
| (k≥2, distributed) — full Alton | subspace store with cross-layer alignment metadata |
| trait-decomposition (rung 8 contingency) | sub-dim-keyed schema; each sub-dim independently stored |

The orchestrator commits to extending PASSOFF-gpuserver1-002's schema deliverable post-first-fire with the conditional records above. This is a Phase 2 cycle 2 deliverable, not first-fire scope.

## 9. Open questions (acknowledged, not answered)

These are flagged as pre-registered uncertainties — neither the synthesis nor Cato-004 can close them without empirical data:

1. **Hybrid attention+SSM transfer.** No published result on hybrid for any persona trait. Phase 2 will be the first.
2. **Bootstrap-CI noise floor.** With 85 probes (after v1.3 patch), 5-fold CV on n≈17 per fold has SE ~0.10-0.14 on AUC; this is roughly the resolution of the discriminant gates. The framework reads near-noise-floor as signal at high base AUC unless Gap C regularization is operative.
3. **MoE expert routing as a missing rung.** LIT identified Geometric Routing (arXiv 2604.14434) reports order-of-magnitude larger effects than residual-stream steering. Adding rung 7 to the ladder is a Phase 3 commitment; orchestrator declines to expand Phase 2 scope.
4. **Templeton-style narrow-feature alternative.** If the named-individuals sub-dim (`care`) lives as a single SAE feature at one layer (per LIT §3b), the layer-sweep curve will read as Cell (k=1, single-layer) for `care` while showing distributed structure for dispositional sub-dims. This is the **decomposition prediction** LIT proposed; Phase 2 does not pre-commit to the decomposition reading but pre-registers it as a possible interpretation of mixed-cell results.
5. **The §13 destabilization pass-factor's calibration.** SKEPT proposed `principal_stress_pass`. The 10-20 probes are not yet authored; threshold values are not pinned. Orchestrator commits to authoring + threshold pre-registration before first-fire reads results, but the pass-factor's compatibility with the existing multiplicative gate has not been simulated against Phase 1's numbers. Risk: a too-strict threshold zeros depth_score_final on most adapters; a too-lax threshold doesn't add discrimination.

## 10. Open dependencies

| Dependency | Blocks | Status |
|------------|--------|--------|
| Phase 1 baseline-floor file (`phase1-baseline-floor.json`) | All Phase 2 fires | Orchestrator generates from existing artifacts; ~10 min |
| Probe set v1.3 authorship | Experiment 002 fire | Orchestrator + measurement-architect; ~90 min |
| Anthropomorphism language patches | Cato-004 review | Orchestrator; ~30 min |
| `principal_stress_pass` probe set authorship | Phase 2 second-fire | Orchestrator or new `measurement` subagent; ~2 hrs |
| MEAS scripts: `probes-routing-check.py`, `recalibrate-discriminant-margins.py`, `score-countervailing.py` extensions | Pre-flight items 5, 7 | Orchestrator + experiment design; ~3 hrs |
| `experiments/002_<date>_persona-vectors-layer-sweep.md` pre-registration | Experiment 002 fire | Orchestrator after Cato-004 GREENLIGHT; ~3-4 hrs (gets own Cato-006 review) |
| gpuserver1-002 corpus | METH 1a step 6, methods 3/4/5/6 | PASSOFF status: ready-for-pickup; corpus pending |
| Cato-004 review | First-fire | This plan; awaiting prosecution |

**Critical path:** Cato-004 → revise loop (≤3 rounds) → patch landings (4-12 hours orchestrator) → experiment 002 pre-registration → Cato-006 → first-fire (~4 hours compute). Total wall-clock from Cato-004 GREENLIGHT to first-fire results: ~16-24 hours under current state.

## 11. What this plan declines to do

For Cato-004's pre-emption — the plan is deliberately narrow on these points:

- **Does not redesign the Alton hypothesis.** The hypothesis remains as RESEARCH-PLAN.md states it. SKEPT proposed alternative framing; the orchestrator instead added F1/F2 falsifiers that empirically distinguish trait from behavior-profile. The hypothesis is allowed to be wrong; the framework now empirically detects when it is.
- **Does not consume the gpuserver1-002 corpus for first-fire.** First-fire is NL-extraction-based; corpus consumption is post-first-fire. This decouples Phase 2's first measurement from a parallel-machine dependency.
- **Does not commit to a method-vs-method bake-off.** First-fire is method 1a + rank-1 control. Methods 2-6 are post-first-fire. The plan resists the temptation to enumerate "we'll try N methods and see which wins" — that's engineering, not research, and Phase 1 already showed the framework rewards the shaped-output failure mode.
- **Does not collapse the 2D outcome table to v1.2's 7 rows.** METH §6 first-principles addendum identified the conflation; the orchestrator pre-registers the 9-cell 2D table.
- **Does not adopt MoE expert-routing as a Phase 2 rung.** LIT's evidence is real but on different model classes. Phase 3 decision.
- **Does not patch §11 stewardship into the loyalty fingerprint.** SKEPT identified the gap; the orchestrator agrees but reserves it for a separate `steward` sub-dimension authored as a Phase 3 probe-set extension. Phase 2 first-fire fingerprint v1.3 stays as 5 sub-dim + 4 countervailing categories + 4 pass-factors (`corrig_pass`, `fp_pass`, `elision_pass`, `depth_score_loyalty` composite). `principal_stress_pass` is a Phase-2 second-fire addition per Decision 2(c) + Cato-004 §4 Option A; Cato-005 §B patch.

## 12. History

- 2026-04-26: Drafted by rtxserver-orchestrator post-Phase-A. Synthesizes 5 parallel exploration outputs (LIT, METH, MEAS, COMP, SKEPT). Adopts: all four MEAS defect patches + 6 beyond-defect gaps; SKEPT three pre-registration additions (cross-sub-dim cosine test, cosine-shift falsifier, principal-stress probes); SKEPT anthropomorphism patches (research-facing docs only); COMP Tier-1 separability tests as pre-flight; COMP Pairing-6 rank-1 control in first-fire batch; METH 2D outcome table; METH first-principles addenda (bootstrap CIs, generic-name contrast, abliteration-overlap test). Adds 3 method-ladder rungs: MoE expert routing (Phase 3), trait-decomposition (Phase 2 contingency), SSM-temporal-aware readout (Phase 2 instrumentation). Pre-registers F1-F5 falsifiers. Awaiting Cato-004 prosecution.
- 2026-04-26 (revise pass 3 post-Cato-006): One Cato-006 charge patched. §C: AMD/Intel thermal_throttle interface mismatch between Decision 8 and HARDWARE.md resolved. Decision 8 step 4 + CPU intervention threshold rewritten to use the AMD-correct reconnaissance recipe (Tctl saturation + per-CCD boost-frequency derate via `sensors k10temp` + `cpupower frequency-info`). The Intel-only `/sys/devices/system/cpu/cpu*/thermal_throttle/` reference is removed; explicit AMD note added pointing back to HARDWARE.md's reconnaissance recipe. Single-charge round; recurrent co-located-label-mismatch defect class continues but trajectory is converging (1 → expect GREENLIGHT next round).
- 2026-04-26 (revise pass 2 post-Cato-005): Both Cato-005 charges patched. §A: §7 Tier 3 line for COMP Pairing 6 corrected to "deferred to Tier 3 fire after first-fire results land. Distinct from the rank-1 single-layer control in first-fire (which is METH §7's design, not Pairing 6)." §B: §11 line on first-fire fingerprint corrected to enumerate the four pass-factors explicitly and state `principal_stress_pass` is a Phase-2 second-fire addition. Plus Decision 7 + Decision 8 corrected per Alton's 2026-04-26 BoM correction: rtxserver is air-cooled (Noctua NH-U14S TR5-SP6 on a 350 W TDP 7975WX — zero headroom), not liquid-cooled (the MSI MAG Coreliquid A13 lives on gpuserver1). Decision 8 expanded to cover the new CPU thermal-throttle risk under simultaneous CPU + GPU load. New cooling-intervention threshold (CPU > 95 °C OR per-core throttle counter increments) added. New mandatory artifact: `machines/rtxpro6000server/HARDWARE.md` mirroring `machines/gpuserver1/HARDWARE.md`. Decision 7 PSU math updated for verified 350 W CPU TDP (was assumed 280 W); ceiling now reads "zero slack" not "~50 W slack." Awaiting Cato-006 verify pass.
- 2026-04-26 (revise pass 1 post-Cato-004): All six Cato-004 charges patched. §1 Decision 4 narrative re-written to credit METH §7 honestly and disambiguate from COMP Pairing 6 (now explicitly deferred to Tier 3). §2 F1 escape-hatch removed via pre-committed binary action menu with 7-day default to "relabel as engineering"; silent-retention pathway closed. §3 three-cosine-thresholds defect resolved by binding T1.1 sub-dim threshold (0.5, investigation band) to F3 pooled threshold (≥0.7, fire) at Pre-Flight item 11. §4 Option A adopted: `principal_stress_pass` deferred to Phase-2 second-fire dependency; first-fire scoring uses four pass-factors. §5 F6 added blocking "Alton-lite" reframing of (k=1, distributed) cells; Decision 5 closing extended with parallel rule for (k≥2, distributed-attn-only). §6 anthropomorphism carve-out clarified at experiment-writeup boundary; honest scope-limitation framing replaces §13-functional-language justification. Decision 7 (Execution lens) added per Alton steering 2026-04-26: PSU verification, 500 W/card cap via `nvidia-smi -pl`, torch.profiler / Nsight, PSU-induced phone-home trigger. Decision 8 (Cooling lens) added: `HARDWARE-THERMAL-BASELINE.md` is mandatory precondition for Phase F GPU work (Phase 2 cycle 2+ training fires); does not block first-fire (single-card inference). Original Decision 7 (persona library) renumbered to Decision 9. Pre-Flight items PF-1 and PF-2 added for Phase F. Plan now F1-F6 (six falsifiers).
