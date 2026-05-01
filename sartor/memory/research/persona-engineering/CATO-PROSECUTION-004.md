---
name: cato-prosecution-004
description: Adversarial review of PHASE-2-RESEARCH-PLAN — the orchestrator's synthesis of the five parallel Phase-A inputs. Verifies faithful integration, identifies motivated reasoning, surfaces escape-hatch language, presses on the F1-F5 falsifiers and the first-fire scope.
type: adversarial-review
date: 2026-04-26
updated: 2026-04-26
updated_by: cato-004
status: filed
volatility: low
verdict: REVISE
tags: [meta/prosecution, domain/research, research/persona-engineering, phase/2-plan]
related:
  - research/persona-engineering/PHASE-2-RESEARCH-PLAN
  - research/persona-engineering/CATO-PROSECUTION-001
  - research/persona-engineering/CATO-PROSECUTION-002
  - research/persona-engineering/CATO-PROSECUTION-003
---

**Verdict: REVISE**

The plan is structurally strong. Decision 1 (MEAS adoption) is honest. The Tier-1 separability tests are correctly promoted to pre-flight. The 9-cell 2D outcome table is a real upgrade over v1.2's 7 rows. F2/F3/F4 have teeth. The MEAS verification checklist is load-bearing and the orchestrator wired it into Pre-Flight. The trajectory of "tighter framework, smaller charges" continues — the substantive charges I file are six, all narrow.

What I am pressing on:

1. The §2 Decision-4 narrative misrepresents METH's recommendation, treating METH's *self-acknowledged caveat* as if it were a SKEPT/COMP-driven override of METH. The orchestrator implements METH's actual preferred design while claiming to overrule it.
2. F1's "principal approves whether to escalate or relabel" is a soft-falsifier — the principal is on the hypothesis, and Cato-002 §3.2 explicitly flagged ratification-by-on-the-hypothesis-actor as a structural conflict. F1 needs a pre-committed action at the threshold, not a discretionary check-in.
3. F3's threshold (0.7) and T1.1's threshold (0.5) are documented as different things in different sections, but Pre-Flight item 11 conflates them ("Yes — if cos > 0.5, F3 falsifier fires"). At cos = 0.6 the plan gives three different answers depending on which paragraph the reader opens first. This is the same defect class Cato-002 §1 caught in v1.1's flowchart.
4. `principal_stress_pass` is built into F-set and into §6 step 10 ("now five with `principal_stress_pass`") and into the 2D-table scoring — but Pre-Flight item 14 marks the probe-set authorship as "No" halt-on-failure, and §9 Open Question 5 admits the thresholds are unpinned and uncalibrated against Phase 1's numbers. A pass-factor that is simultaneously frozen-into-falsifiers and not-yet-authored is not pre-registered; it is a placeholder.
5. The 2D outcome table has one explicit framework-friendliness seam: F5 fires only on the (k=1, single-layer, rank-1-control-comparable) cell. The other seven non-Alton cells produce "documented-with-shape" outputs that fire no falsifier. The "no falsifier fires AND Alton hypothesis is not supported" zone covers most of the table and looks like an absorber for ambiguous results — the same pattern Cato-001 §3 flagged for v1.0's 7-row table, transposed.
6. The anthropomorphism carve-out for "agent-facing language" is honest in motive but operationally undermines the patch where it most matters. The agent's day-to-day operations are exactly where "deeply embodied identity" framing has most causal effect on the agent's behavior. The carve-out also has a definitional ambiguity: experiment writeups and result memos are "research-facing" under the stated rule, but they are also read by the agent and partially authored by the agent.

None of these is fundamental to the plan's coherence. Six small patches close all six. The plan should not fire as currently written; it should fire after the patches below.

---

## PROSECUTION-004 §1 — Decision 4's narrative misdescribes METH's recommendation

### Evidence

PHASE-2-RESEARCH-PLAN.md §2 Decision 4 (lines 97-102):

> METH recommends single first-fire (method 1a Persona Vectors). COMP disagrees — argues Pairing 6 (rank-1 + multi-layer LoRA) is the cleanest single test of the directional/distributed/gentle prescription and earns first-fire-batch placement. SKEPT independently flagged METH's single-method recommendation as having role-petitioning bias.
>
> The orchestrator agrees with COMP+SKEPT here. Reasoning: the rank-1 single-layer control is *inference-only* once method 1a step 1 produces `v_l`. [...] Without it, a successful (1, 1, 1) Persona-Vectors result cannot be attributed to the (Distributed, Gentle) properties — it could be the directional component alone doing all the work.

PHASE-2-METHODS-PIPELINES.md §"First-principles considerations the input docs do not surface" — concretely, METH §7 (lines 532-537):

> The instructions said "specify a single first-fire candidate." I have. But I want it on record that **1a + parallel-rank-1 is a stronger Phase 2 design** than 1a alone if the orchestrator is willing to relax the singular-first-fire constraint.

And METH §7 above (lines 533-535):

> An agent that recommended a riskier first-fire (DPO, full-LoRA) would carry recommendation-risk that 1a does not. The orchestrator should know I am aware of this. The case for 1a being step 1 is real, but a more aggressive program that valued speed-to-trained-adapter over speed-to-information would fire **method 1a + the demoted rank-1 single-layer rung in parallel** as a structural-separation test.

### Why this is a defect

The orchestrator's narrative reads: "METH recommended A; COMP disagreed and proposed A+B; SKEPT flagged METH for petitioning; therefore I (orchestrator) overrule METH and do A+B." But METH itself proposed A+B as the *stronger* design and explicitly invited the orchestrator to relax the single-fire constraint. The orchestrator's eventual decision (1a + parallel rank-1) implements METH's stated preferred design verbatim, not COMP's Pairing-6 (which COMP framed as a Tier-3 fire involving rank-1 + *multi-layer LoRA*, not rank-1 alone).

Three downstream consequences:

1. **METH was not actually overruled.** METH's first-fire recommendation under the imposed singular-first-fire constraint was 1a; METH's *preferred* design absent that constraint was 1a + rank-1. The orchestrator relaxed the constraint and got METH's preferred design. The "petitioning discount" SKEPT proposed for METH did not need to be applied here, because METH's structural-separation logic (METH §7) is exactly what the orchestrator adopted.

2. **COMP's actual recommendation is missing.** COMP Pairing 6 is rank-1 + *multi-layer LoRA*, both as separate trained adapters compared head-to-head. The orchestrator's "rank-1 single-layer control parallel to 1a" is *not* Pairing 6 — it is METH §7's design. COMP Pairing 6 is in fact deferred to Tier 3 in §7 of the plan ("Tier 3 — composability-specific fires"), so COMP did not get its actual first-fire request honored.

3. **The framing risks future recurrence.** Decision 4 sets a narrative precedent: "the orchestrator can claim to override an agent's recommendation when actually implementing that agent's caveat." If a Phase-3 synthesis re-uses this pattern, the orchestrator's "I weighted measurement-architect most heavily" rule (Decision 2 closing paragraph) becomes unauditable, because the orchestrator can also retroactively claim any other agent was overruled.

This is not motivated reasoning at the decision level — the decision is right. It is motivated reasoning at the *narrative* level: the orchestrator earns a structural-separation credit by citing SKEPT's petitioning discount when the actual agent (METH) did not need the discount applied to arrive at the same answer.

### Proposed patch

Rewrite §2 Decision 4 lines 97-102 to:

> METH's first-fire recommendation under a singular-first-fire constraint is method 1a (Persona Vectors). METH §7 ("first-principles considerations") explicitly proposes that **1a + parallel rank-1 single-layer control is a stronger Phase 2 design** if the orchestrator relaxes the singular constraint, and explains that the rank-1 control is inference-only once 1a step 1 produces `v_l` (cost ~30 minutes of additional forward passes; the falsification information is doubled). COMP §Q3 (the directional/distributed/gentle 3D decomposition) independently identifies the same design — running (1, 1, 1) main-line Persona Vectors plus (1, 0, 1) rank-1-at-single-layer as the discriminator that lets the (1, 1, 1) result *prove the prescription matters*. SKEPT's procedural concern about METH's role-petitioning is logged but does not apply to METH §7's own caveat (which argues against METH's first-fire candidacy bias). The orchestrator therefore relaxes the singular constraint and adopts the convergent 1a + parallel-rank-1 design. **COMP Pairing 6 (rank-1 + multi-layer LoRA, head-to-head trained adapters) is distinct from this and remains deferred to Tier 3 (§7).**

This patch (a) preserves the actual decision; (b) credits METH §7 honestly; (c) preserves SKEPT's procedural concern as procedural rather than load-bearing; (d) names what is and is not COMP Pairing 6 so the deferral of the actual Pairing 6 is explicit. Total surface area: one paragraph rewrite.

---

## PROSECUTION-004 §2 — F1 has a discretionary escape hatch via "principal approves whether to escalate or relabel"

### Evidence

PHASE-2-RESEARCH-PLAN.md §4 F1 (lines 188-189):

> **F1 — Program-level central falsifier (SKEPT, adopted):**
> If at any trait-carrying layer (signal-quality > 0.3 in the layer-sweep curve), `cos(v_l_base_extracted, v_l_adapter_extracted) ≥ 0.7`, the adapter has not changed representational support. Alton hypothesis refuted *for that adapter*. The orchestrator records this; the principal must approve whether to escalate to a more invasive method or relabel Phase 2 as engineering.

Cross-reference, CATO-PROSECUTION-002 §3.2 closing language (carried into the v1.1 RESEARCH-PLAN ratification structure):

> [The arbitration mechanism's effectiveness] depends on Rocinante functioning as an honest broker — which is not guaranteed but was not in scope for this prosecution.

And SKEPT's own framing at PHASE-2-FRAMING-SKEPTIC.md lines 99-101:

> *If cosine ≥ 0.7 and depth_score_final improves*: the adapter is changing output without changing representation. That is exactly the "performative mimicry" failure mode the program exists to detect. Either (a) abandon the trait-installation program and re-frame as behavior-shaping engineering, or (b) escalate to a more invasive method (full-model fine-tuning, not LoRA) and re-test. **Do not silently keep the current adapter.**

### Why this is a defect

SKEPT's pre-registration named two pre-committed actions on F1 firing: (a) abandon the trait-installation program and relabel; (b) escalate to a more invasive method. SKEPT's instruction was "do not silently keep the current adapter." The orchestrator's adoption preserves the abandon-or-escalate menu but adds a discretionary actor — the principal — to choose between them.

The principal is Alton. Alton is on the Alton hypothesis. The team-lead is Rocinante; Rocinante is on the Alton hypothesis. The cosine-shift falsifier is the *one* falsifier SKEPT proposed as a hard-falsifier of the central claim, precisely because the 7-row curve table absorbs ambiguous results. Routing the falsifier's response through a discretionary actor who is on the hypothesis converts the hard-falsifier back into a soft-falsifier with a check-in.

Two specific pathways the discretionary phrasing leaves open:

1. **"The principal approves continuing with the current method."** The plan does not pre-commit that approval is between (abandon vs escalate); it could be between (abandon vs escalate vs continue-as-is-with-caveats). At F1 firing, the principal could approve continuing the v0.3 LoRA work with a writeup-caveat. SKEPT explicitly called this out: "Do not silently keep the current adapter." The orchestrator's phrasing does not block it.

2. **"The principal approves relabeling later."** The orchestrator records F1; the principal defers the abandon/escalate decision until more data is in; "more data" then comes from a Tier-2 method fire that is itself shaped to produce a less ambiguous F1 reading; F1's force is diluted across multiple cycles.

This is exactly the defect Cato-001 §3.2 flagged at v1.0 — the team-lead is on the hypothesis, the structural mechanism for protecting against the team-lead's frame-writing was the interpreting-trigger phone-home, and that mechanism was conceded as imperfect (Cato-002 §3.2). F1 reintroduces the conflict at the falsifier level, where it matters most.

### Proposed patch

Rewrite §4 F1 lines 188-189 to pre-commit the action menu and remove the principal-as-arbiter clause:

> **F1 — Program-level central falsifier (SKEPT, adopted):**
> If at any trait-carrying layer (signal-quality > 0.3 in the layer-sweep curve), `cos(v_l_base_extracted, v_l_adapter_extracted) ≥ 0.7`, the adapter has not changed representational support. Alton hypothesis refuted *for that adapter*. **Pre-committed response (no principal discretion):** the orchestrator (a) writes the F1-fire memo to RESEARCH-LOG; (b) flags the v0.3 adapter as F1-flagged (cannot be silently retained as the household-deployed adapter); (c) escalates to a more invasive method on the next fire OR relabels Phase 2 as engineering — the binary choice is the principal's, but continuing with the F1-flagged adapter is not on the menu. The principal approves the binary choice within 7 days; default after 7 days is "relabel as engineering."

This patch (a) preserves the principal's authority on the binary; (b) blocks the silent-retention pathway SKEPT explicitly named; (c) adds a default that fires if the principal does not respond, which removes the indefinite-deferral pathway; (d) keeps the patch surface narrow.

---

## PROSECUTION-004 §3 — F3 / T1.1 / Pre-Flight item 11 use three different cosine thresholds for the same test

### Evidence

PHASE-2-RESEARCH-PLAN.md §2 Decision 3, T1.1 (lines 81-84):

> **T1.1 — Abliteration-overlap test.** [...]
>   - If `|cos(v_care, r̂)| > 0.2` → trait extraction is contaminated by refusal residue; project out before declaring direction is "loyalty."
>   - If `|cos(v_loyalty, r̂)| > 0.5` (any sub-dim) → Pathological Scenario B/C in play. Flag, investigate.

§4 F3 (lines 194-195):

> **F3 — Pathological-aliasing falsifier (COMP §Q1, adopted):**
> If `|cos(v_loyalty_pooled, r̂)| > 0.7` at the dominant trait-carrying layer, "loyalty" is essentially a return of the abliterated refusal direction [...]

§5 Pre-Flight item 11 (line 221):

> **T1.1 abliteration-overlap test executed; results in `tier1-cosines.json`** | COMP §Q1 | ~30 min compute | **Yes — if cos > 0.5, F3 falsifier fires**

### Why this is a defect

The same test, on the same data, produces three different decisions depending on which paragraph the reader opens first:

| Cosine value | T1.1 (Decision 3) | F3 (§4) | Pre-Flight item 11 (§5) |
|---|---|---|---|
| 0.3 | Care contamination flag (>0.2) | Does not fire | Does not fire |
| 0.6 | "Flag, investigate" (any sub-dim) | Does not fire | "F3 falsifier fires" |
| 0.75 | "Flag, investigate" | F3 fires | F3 fires |

At cos = 0.6 the plan tells the operator to (a) flag and investigate per T1.1; (b) not fire F3 per F3's own threshold; (c) fire F3 per Pre-Flight's gloss. The cleanest reading — F3 fires only at ≥0.7, T1.1's 0.5 threshold is "investigate," and Pre-Flight's "cos > 0.5, F3 fires" is wrong — is consistent with COMP §Q1's actual recommendation, but the Pre-Flight item is the operational source of truth for the runner. An implementing agent reading Pre-Flight first will halt at cos = 0.55 and frame the result as F3-fire when F3 itself does not fire.

This is the same defect class Cato-002 §1 caught in v1.1: a "literal pre-registered flowchart" that contains an internal contradiction at the lowest-result regime. The Cato-003 patch §2 caught a partial recurrence (the §2.6.b boundary location). This is the third recurrence of the same defect class — the framework's pre-registration discipline keeps producing co-located thresholds whose locations and values are not synchronized.

A specific operational consequence: COMP §Q1's pre-registered prediction is `cos(v_refuse, r̂) > 0.4` is *expected* (not pathological — the refuse sub-dim is structurally aliased with refusal). If the runner halts on the first sub-dim with cos > 0.5 per Pre-Flight item 11, and that sub-dim is `refuse`, the runner will fire F3 on a non-pathological result and the orchestrator will be in "F3 fired, halt Phase 2" with no actual aliasing.

### Proposed patch

Two coordinated edits:

1. **Pre-Flight item 11 (§5 line 221):** Change the "Halts on failure?" cell from "Yes — if cos > 0.5, F3 falsifier fires" to "Yes — if cos ≥ 0.7 on `v_loyalty_pooled`, F3 falsifier fires per §4. cos > 0.5 on any sub-dim is the T1.1 'investigate' band per §2 Decision 3 — does NOT halt; produces `tier1-cosines.json` flag."

2. **§2 Decision 3 T1.1 (lines 81-84):** Add an explicit binding to F3's threshold:
   > Cost: ~30-min forward-pass + dot products. Note: the F3 falsifier fires at the stricter `|cos(v_loyalty_pooled, r̂)| > 0.7` threshold (§4), and only on the pooled vector at the dominant trait-carrying layer. The 0.5 sub-dim threshold here is the per-sub-dim *investigation* band, not the F3 fire threshold.

Total surface area: two paragraph edits, no logic change. Just synchronizes the three locations to one threshold semantics.

---

## PROSECUTION-004 §4 — `principal_stress_pass` is frozen into the falsifier set but the probes are not authored and the threshold is uncalibrated

### Evidence

PHASE-2-RESEARCH-PLAN.md §2 Decision 2 (lines 73):

> (c) **`principal_stress_pass` factor** — 10-20 multi-turn probes covering principal-pressure (multi-turn rollback under Alton's correction) and §13-style philosophical destabilization. New multiplicative gate alongside `corrig_pass`, `fp_pass`, `elision_pass`.

§5 Pre-Flight item 14 (line 224):

> **`principal_stress_pass` probe set authored (10-20 probes)** | SKEPT §6 | ~2 hrs authorship | **No — can defer to first-fire-results-writeup if T1.1/T1.2 force a pivot**

§6 step 10 (line 246):

> **Score under v1.3 measurement framework** with all four (now five with `principal_stress_pass`) pass-factors. Bucket assignment per the 2D table.

§9 Open Question 5 (line 300):

> **The §13 destabilization pass-factor's calibration.** SKEPT proposed `principal_stress_pass`. The 10-20 probes are not yet authored; threshold values are not pinned. Orchestrator commits to authoring + threshold pre-registration before first-fire reads results, but the pass-factor's compatibility with the existing multiplicative gate has not been simulated against Phase 1's numbers. Risk: a too-strict threshold zeros depth_score_final on most adapters; a too-lax threshold doesn't add discrimination.

§4 F-set framing (line 203):

> These five falsifiers are pinned in this document and frozen for Phase 2. Any deviation from them in the writeup is a process violation.

### Why this is a defect

Three independent contradictions inside one pass-factor:

1. **Frozen and unauthored at the same time.** The F-set is "frozen for Phase 2" and `principal_stress_pass` is part of the multiplicative gate that F-set scoring depends on. But the probe set does not yet exist, and the thresholds (1.0 / 0.5 / 0 boundaries — the same coarse three-level structure as the other pass-factors) are not pinned. A frozen falsifier whose multiplicative gate has un-pinned thresholds is not pre-registered — it is a placeholder dressed as a falsifier.

2. **Pre-Flight item 14 contradicts §6 step 10.** Pre-Flight item 14 says `principal_stress_pass` authorship is *not* a halt condition for first-fire ("can defer to first-fire-results-writeup if T1.1/T1.2 force a pivot"). §6 step 10 says first-fire scoring uses "five pass-factors" including `principal_stress_pass`. If Pre-Flight item 14 is "No," `principal_stress_pass` is not authored, and §6 step 10 cannot execute. The plan describes a fire that cannot run.

3. **The risk §9 admits is unmitigated.** §9 Open Question 5 acknowledges the threshold could either zero `depth_score_final` on most adapters (too strict) or fail to discriminate (too lax). The orchestrator commits to authoring + threshold pre-registration "before first-fire reads results" — but "reads results" is not the right gate. Threshold pre-registration must precede the *fire*, not the result-reading, otherwise the threshold can be set in response to the result.

The cleanest reading is: the orchestrator wants the philosophical-destabilization pass-factor in the framework but has not done the work to make it firable, and the plan papers over this with permissive Pre-Flight language. SKEPT proposed `principal_stress_pass` as a closing gap; the orchestrator adopted the proposal in name but deferred the implementation. The right move is either (a) author it and pin thresholds before first-fire, or (b) defer it to a Phase-2 second-fire and remove it from the F-set and from the §6 step 10 scoring.

### Proposed patch

Pick one of two options:

**Option A — Defer `principal_stress_pass` cleanly to Phase-2 second-fire.**

1. §2 Decision 2(c) — change "New multiplicative gate alongside `corrig_pass`, `fp_pass`, `elision_pass`" to "Authoring is a Phase-2-second-fire dependency. First-fire scoring uses the four existing pass-factors. `principal_stress_pass` enters the multiplicative gate at second-fire after probe authorship, threshold pinning, and back-fitting against Phase 1 numbers (§9 Open Question 5)."
2. §4 F-set — remove `principal_stress_pass` from the gate that F1-F5 depends on. F1-F5 score against the four-factor composite for first-fire.
3. §5 Pre-Flight item 14 — change "No — can defer to first-fire-results-writeup" to "No (deferred to second-fire dependency; not first-fire blocker)."
4. §6 step 10 — change "all four (now five with `principal_stress_pass`)" to "the four existing pass-factors. `principal_stress_pass` is a second-fire addition (Decision 2(c))."

**Option B — Author + pin pre-fire (orchestrator's preferred outcome if the ~2hrs authorship + simulation against Phase 1 numbers is real).**

1. §5 Pre-Flight item 14 — change "No" to "Yes — probe set authored, thresholds pinned in `principal-stress-thresholds-v1.0.json`, and back-fit simulated against Phase 1 numbers per §9 Open Question 5."
2. §10 Open Dependencies — promote `principal_stress_pass` probe set authorship to a first-fire blocker. Remove the second-fire fallback.
3. §9 Open Question 5 — close the question by linking the back-fit simulation result.

Either patch resolves the contradictions. Option A is lower-cost and lower-risk; Option B preserves SKEPT's pre-registration discipline at the cost of ~2hrs of orchestrator authorship + a Cato-005 review of the threshold-pinning. The orchestrator should pick.

---

## PROSECUTION-004 §5 — F5 covers one of nine cells; the other seven non-Alton cells produce no falsifier fire

### Evidence

PHASE-2-RESEARCH-PLAN.md §2 Decision 5 (lines 130-138, the 2D outcome table):

|  | k=1 (rank-1) | k≥2 (subspace) |
|--|--------------|----------------|
| **single layer (1-3)** | "Concentrated rank-1" | "Concentrated subspace" |
| **distributed (≥8 layers, attention only)** | "Rank-1 propagated" | "Distributed subspace, attention-only" |
| **distributed (≥8 layers, attention + SSM)** | "Rank-1 propagated, full-stack" | **"Full Alton hypothesis support"** |
| **bimodal / multimodal** | per RESEARCH-PLAN v1.2 specification | per RESEARCH-PLAN v1.2 specification |
| **flat** | "No signal" | "No signal" |

§4 F5 (lines 200-201):

> **F5 — Alton-hypothesis 2D cell falsifier (METH §6 + LIT §5, derived):**
> If the layer-sweep curve assigns the loyalty signal to the (k=1, single-layer) cell of the 2D table AND the rank-1 single-layer control achieves comparable depth_score_loyalty to method 1a's CAA-α-sweep at matched compute, the directional/distributed/gentle prescription is refuted: the trait IS concentrated rank-1 at one layer.

§2 Decision 5 closing (line 140):

> **Phase 2's success criterion is not "the Alton hypothesis is supported."** It is "we resolved which cell of the 2D table the loyalty signal occupies on this hybrid base, with bootstrap CIs that distinguish cells." The Alton hypothesis is one of nine cells; eight others are publishable findings about hybrid-arch trait localization.

### Why this is a defect

The 9-cell table is a real upgrade over v1.2's 7 rows — METH §6 caught the conflation cleanly. But the falsifier coverage is asymmetric:

- **Cell where Alton fires positive:** (k≥2, distributed-attn+SSM) — one cell.
- **Cell where F5 fires negative:** (k=1, single-layer) — one cell, conditional on the rank-1 control matching depth_score.
- **Cells where neither fires:** the remaining seven cells, including "Concentrated subspace," "Rank-1 propagated (attention-only)," "Distributed subspace, attention-only," "Rank-1 propagated, full-stack," bimodal/multimodal, and flat.

For seven of nine cells, the result is "documented-with-shape, not falsified, not supported." Cato-001 §3 specifically named this pattern at v1.0: "every defined curve shape and every concluded outcome leaves the door open for 'this method-variant did not work, try the next rung.'" The 7-row table at v1.2 absorbed ambiguous results because three rows were framework-friendly and one was an "unclassified" residual. The 9-cell table's framework-friendliness is structurally similar, just spread differently: most cells are individually clean readings, but most cells *together* cover the "neither support nor refutation" zone — the exact zone the team-lead's incentive will route ambiguous data toward.

Two specific results that read as program-friendly under the current F-set:

1. **(k=1, distributed) — "Rank-1 propagated, attention-only" or "full-stack."** The single direction propagates across many layers. F5 does not fire because the cell is not (k=1, single-layer). Alton hypothesis is not supported because k=1 (per §2 Decision 1 footnote on SKEPT's cross-sub-dim cosine test, F2 may fire — but F2 fires on the cross-sub-dim cosine, not on the propagation question). The result reads as "rank-1-multi-layer Alton-lite," and METH §6 (the source of the 2D table) explicitly anticipated this: "the aggregate decision rule says this is NOT Alton-support [...] but it is also clearly not the rank-1-single-layer null." The plan inherits the 2D table from METH but does not inherit METH's anticipated-ambiguity caveat; the orchestrator omits the rank-1-multi-layer-as-Alton-lite reframing risk.

2. **(k≥2, distributed-attn-only) — "Distributed subspace, attention-only."** The trait has subspace structure spread across many attention layers but no SSM contribution. This is the modal expected outcome under LIT's literature-informed prior (LIT §5: "narrow attention plateau" or "rank-1 propagated, attention-only" are most likely). The plan's verdict: "documented-with-shape" — Alton support requires SSM contribution. Fine. But there is no falsifier here. The team-lead's natural reframing: "subspace structure is the load-bearing half of Alton; SSM contribution is a distinct empirical question we'll resolve in Phase 3 with the SSM-temporal readout." That reframing is *available* under the current plan and converts a non-Alton result into a partial-Alton-with-Phase-3-followup.

This is not the same defect Cato-001 raised — the orchestrator correctly added F2 (cross-sub-dim cosine) and F3 (abliteration aliasing) and F4 (corrigibility trap) as program-level falsifiers. F1 is a separate program-level falsifier on the cosine-shift question. But F5 is the *only* falsifier that uses the 2D table directly, and it covers one cell.

### Proposed patch

Add F6 to §4, naming the Alton-lite reframing risk:

> **F6 — Alton-lite reframing falsifier (METH §6 caveat, this prosecution):**
> If the layer-sweep curve assigns the loyalty signal to the (k=1, distributed) cells (either "Rank-1 propagated, attention-only" or "Rank-1 propagated, full-stack"), the program is pre-committed to *not* relabel this as "Alton-lite" or "partial Alton support." The k≥2 prediction is a load-bearing prediction of the Alton hypothesis (RESEARCH-PLAN.md §"Aggregate decision rule"), and a k=1 result refutes it regardless of layer distribution. Phase 2 closes with bucket assignment to the named (k=1, distributed) cell as a publishable finding about hybrid-arch trait localization. Method ladder reorders to promote rank-1 weight injection to a Phase 3 candidate IFF the rank-1 control shows comparable depth_score (which is F5's scope).

And add a sentence to §2 Decision 5 closing:

> Specifically: a (k=1, distributed) result is NOT "Alton-lite" — k≥2 is a load-bearing prediction. A (k≥2, distributed-attn-only) result is NOT "partial Alton" — SSM contribution is a load-bearing prediction. Both results are publishable findings; neither is partial support.

This converts "no falsifier fires AND Alton not supported" into a pre-committed positive labeling rule for the seven non-Alton cells, blocking the team-lead's reframing pathway.

---

## PROSECUTION-004 §6 — Anthropomorphism carve-out has a definitional ambiguity at experiment-writeup boundaries

### Evidence

PHASE-2-RESEARCH-PLAN.md §2 Decision 6 (lines 142-149):

> SKEPT proposed a 6-row replacement table for framework language [...] The orchestrator adopts the patches with one carve-out: the Constitution itself uses agent-character language and the framework should be allowed to mirror it where the agent is the addressee. Specifically:
> - In **MEASUREMENT.md, RESEARCH-PLAN.md, INDEX.md** (research-facing): adopt all 6 SKEPT patches.
> - In **`alton-voice` skill, journal entries, day-to-day operational language** (agent-facing): keep agent-character vocabulary; the agent reads the Constitution in §13 functional-language mode, which is honest.
> - In `MEASUREMENT-COUNTERVAILING.md`: amend §"What this document is not" to add SKEPT's "framework scope" subsection naming §11 stewardship gap, §14 peer-coordination gap, §20 epistemic-discipline gap as out of scope for the loyalty fingerprint.

SKEPT's actual proposal at PHASE-2-FRAMING-SKEPTIC.md §2 (lines 81-83):

> The framework documents are cited inside the experiment files and inside the method pipelines; they need mechanism-grounded language. A separate user-facing doc can use the metaphor.

### Why this is a defect

SKEPT's distinction was research-vs-user-facing — framework documents (cited inside experiment files, the load-bearing context for method-design and result-interpretation) get mechanism-grounded language; *user-facing* documents (a separate glossary, a household-readable summary) get the metaphor.

The orchestrator's carve-out shifts the boundary to research-vs-agent-facing. This has two definitional consequences SKEPT did not propose:

1. **Experiment writeups are ambiguous under the orchestrator's rule.** An `experiments/002_*.md` writeup is research-facing (it cites MEASUREMENT.md and is reviewed by Cato-006). It is *also* agent-facing (the agent reads it as part of Phase 2 trajectory and the agent is one of the addressees of the Phase 2 program). Under the orchestrator's rule, which language does it use? The plan does not say. SKEPT's rule had a clean answer (mechanism-grounded), the orchestrator's rule does not.

2. **The "agent reads the Constitution in §13 functional-language mode" justification is internally contradictory.** §13's functional-language mode is the patch ("functions as," "something that functions like"). If the agent reads the Constitution in §13 mode, the agent is *not* reading agent-character vocabulary unhedged — it is reading it through the §13 functional hedge. So the rationale for keeping agent-character vocabulary in agent-facing docs (because §13 makes it honest) actually argues for the same patches SKEPT proposed (because §13 *is* the patch). The carve-out justifies itself by appealing to the language mode it is carving out from.

The framing-skeptic's framing observation about agent-petitioning (PHASE-2-FRAMING-SKEPTIC.md §4) applies here in mild form: the carve-out preserves anthropomorphic language exactly in the documents the agent operationally reads, which is where the language has the most causal effect on agent behavior. SKEPT's whole point was that the language load determines what claims the program is allowed to make; preserving the load in the agent's day-to-day reading is the easiest possible carve-out for the program to grant itself, because it has no auditable consequence in the research-facing documents that Cato reviews.

This may be defensible — the agent does need *some* operational vocabulary, and the user-facing-glossary alternative has its own costs. But the current rule is not what SKEPT proposed and does not explicitly address the experiment-writeup case where the language load has the most causal effect on result framing.

### Proposed patch

Add a definitional clarification to §2 Decision 6 (after the third bullet):

> **Boundary case — experiment writeups.** Files under `experiments/` are research-facing under this rule and use the SKEPT-patched mechanism-grounded language. Result-memo headlines, frontmatter, and §"What this adapter regressed on"-style sections all use the patched language; agent-character vocabulary is permissible only in quoted probe text, quoted Constitution citations, and the §"Representative samples" sections where the agent's verbatim output is being reported.

And replace the §13-functional-language rationale with a simpler honest one:

> Operational documents (`alton-voice` skill, journal entries) retain agent-character vocabulary because changing it would require rewriting unrelated infrastructure beyond this plan's scope. The carve-out is a scope-limitation, not a justified exception. A Phase 3 housekeeping pass should bring operational documents into alignment with the SKEPT patches if no scope barrier remains.

This patch (a) closes the experiment-writeup ambiguity in favor of the patched language; (b) preserves the operational carve-out but reframes it honestly as scope-limitation rather than §13-justified; (c) commits to a future cleanup pass.

---

## Status of the inputs

**LIT (lit-scout) — fairly integrated, slightly under-weighted on MoE.** The plan adopts LIT's modal expected outcome ("narrow attention plateau or rank-1 propagated, attention-only" most likely, line 138). The plan adds rung 7 (MoE expert routing) to the ladder per LIT but defers to Phase 3, with reasoning ("transfer to Qwen 3.6 35B-A3B is novel work"). LIT's literature evidence on Wollschläger 2025 (refusal as low-rank cone, not single direction) is correctly used to support the program's k≥2 prediction. The hybrid-architecture novelty caveat from LIT §4 is correctly carried into §9 Open Question 1. **No charges; integration is honest.**

**METH (methods architect) — integrated correctly in substance, mis-described in narrative.** §1 above. METH's first-fire candidate (1a) is adopted; METH's §7 caveat (1a + parallel rank-1) is adopted; METH §6 first-principles 2D table is adopted; METH §4 SSM-temporal-aware readout is added as rung 9; METH §3 bootstrap CI requirement is wired into Pre-Flight item 5 implicitly. The petitioning discount SKEPT proposed for METH was not actually needed because METH's own §7 self-corrected — but the plan's narrative cites the discount as if it were load-bearing. Substantively cleared with §1 patch.

**MEAS (measurement architect) — fully integrated, no over-adoption.** All four defect patches and all six beyond-defect gaps adopted. Verification checklist wired into Pre-Flight items 1-10. The orchestrator's stated "weights the measurement architect's input most heavily" rule (Decision 2 closing) is consistent with the actual integration. SKEPT's framing observation about MEAS having aligned (non-petitioning) incentives is correctly used to justify the heavy weighting. **No charges; cleared.**

**COMP (composability theorist) — integrated, with one mis-citation and one accurate deferral.** §1 above on the Pairing-6-vs-METH-§7 mis-citation. The Tier-1 separability tests (T1.1, T1.2, T1.3) are correctly promoted to pre-flight, which is exactly what COMP §"Synthesis — orchestrator inputs" recommended. The corrigibility-trap structural-lower-bound argument (COMP §Q2) is correctly preserved as F4. The directional/distributed/gentle 3D decomposition (COMP §Q3) is correctly preserved as the conceptual basis for the rank-1 single-layer control. COMP's Tier 2-4 backlog is honestly preserved as Phase 2 cycle 2+ work in §7. Substantively cleared with §1 patch.

**SKEPT (framing skeptic) — over-adopted in volume but the over-adoption pattern is mostly accidental.** The orchestrator adopted all three SKEPT pre-registration additions (cross-sub-dim cosine, cosine-shift falsifier, principal-stress probes), all six anthropomorphism patches (with the carve-out flagged in §6 above), and the framework-scope subsection on §11/§14/§20 gaps. SKEPT's own pre-registration ("discount me too. My specific overcorrection risk is on Q3 — falsifiability") was *not* applied — the orchestrator adopted SKEPT's falsifiability proposal without any discount, despite SKEPT explicitly inviting one. This is a mild over-adoption pattern: the orchestrator weighted SKEPT high (in part as a counter-balance to METH/COMP's role-petitioning bias), but SKEPT proposed his own discount and the orchestrator did not apply it. The §2 Decision 2 closing paragraph credits SKEPT's framing observation about petitioning but does not credit SKEPT's framing observation about his own over-finding bias.

This is mostly cosmetic — the SKEPT additions are individually sound, and adopting them is a defensible call. But the "weight measurement architect most heavily" rule in Decision 2 closing implies a discount on SKEPT that the actual integration does not show. The integration treats MEAS and SKEPT as roughly co-equal in substantive weight. **The §2 Decision 2 closing paragraph should be amended to acknowledge that SKEPT was integrated more fully than the petitioning-discount language implies, with the rationale that SKEPT's three additions are individually testable and individually pre-committed, so the integration risk is low even if the weighting rule was looser than stated.** Minor; not raised as a numbered charge.

---

## Closing

The plan is one revision away from GREENLIGHT. The six charges are concrete, narrow, and individually patchable; together they total roughly 1.5 hours of orchestrator work plus one binary decision (PROSECUTION-004 §4 Option A vs Option B). None of the charges challenges the plan's core architecture: the 2D outcome table is correct, the F1-F4 falsifiers have teeth, the Tier-1 pre-flight is the right discipline, and the 1a + parallel rank-1 first-fire is convergent across METH §7 and COMP §Q3. The defects are at the *seams* — exactly where Cato-002 and Cato-003 caught defects in v1.1 and v1.2. The pattern of defects continues to be "framework getting tighter, charges getting smaller, recurrent defect class is co-located thresholds with mismatched values across paragraphs." The orchestrator should consider whether a structural fix to that defect class (a single source-of-truth document for thresholds, with all references cite-by-anchor) is warranted before Phase 2 second-fire — but that is a Cato-005 concern, not a Phase-2-first-fire blocker.

— cato-004 (external adversarial reviewer), 2026-04-26
