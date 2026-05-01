---
name: cato-prosecution-005
description: Verify pass on Phase-2-Research-Plan revise pass. Confirms whether Cato-004's six patches landed substantively, audits the two new Decisions (7 Execution lens, 8 Cooling lens), and surfaces any new defects introduced by the revise pass.
type: adversarial-review
date: 2026-04-26
updated: 2026-04-26
updated_by: cato-005
status: filed
volatility: low
verdict: REVISE
tags: [meta/prosecution, domain/research, research/persona-engineering, phase/2-plan]
related:
  - research/persona-engineering/PHASE-2-RESEARCH-PLAN
  - research/persona-engineering/CATO-PROSECUTION-004
  - research/persona-engineering/CATO-PROSECUTION-001
  - research/persona-engineering/CATO-PROSECUTION-002
  - research/persona-engineering/CATO-PROSECUTION-003
---

**Verdict: REVISE**

Five of six Cato-004 patches landed cleanly and substantively. Decisions 7 and 8 are coherent and the math holds. But the §1 patch was applied to Decision 4 only and not propagated to §7 — Decision 4 now says Pairing 6 is "deferred to Tier 3," while §7 Tier 3 still labels Pairing 6 "already in first-fire batch as control." Same defect class as §4 Option A: §11 still claims first-fire fingerprint includes `principal_stress_pass` after Decision 2(c) deferred it. Two co-located-label inconsistencies, both introduced by the revise pass. Patch and re-fire; this is the recurrent "primary location patched, siblings left stale" pattern Cato-002/003/004 §3 named. Two ~5-line edits close it.

---

## §1 — Decision 4 narrative (Cato-004 §1)

Landed substantively at lines 98-102. Decision 4 now credits METH §7 by name ("METH §7 ... explicitly proposes that 1a + parallel rank-1 single-layer control is a stronger Phase 2 design"), notes the convergent COMP §Q3 derivation, demotes SKEPT's petitioning concern to procedural ("logged but does not apply to METH §7's own caveat"), and explicitly distinguishes COMP Pairing 6 ("rank-1 + multi-layer LoRA, head-to-head trained adapters") from this design with a Tier 3 deferral pointer. Patch surface matches Cato-004's prescription verbatim. **Decision 4 itself: clean.** §7 sibling: NOT clean — see new charge §A.

## §2 — F1 escape hatch (Cato-004 §2)

Landed cleanly at lines 223-224. F1 now opens with "Pre-committed response (no principal discretion)" and binds the operator to: (a) memo to RESEARCH-LOG; (b) flag-as-F1 with explicit "cannot be silently retained as the household-deployed adapter" — closing SKEPT's named pathway; (c) binary escalate-vs-relabel menu with 7-day default to "relabel as engineering." The discretionary "principal approves whether to escalate or relabel" original phrasing is gone; "continuing with the F1-flagged adapter is not on the menu" is explicit. Clean.

## §3 — Three cosine thresholds (Cato-004 §3)

Landed cleanly. Pre-Flight item 11 (line 259) now reads "if `|cos(v_loyalty_pooled, r̂)| ≥ 0.7`... F3 falsifier fires per §4. Per-sub-dim cosines > 0.5 are the T1.1 investigation band per §2 Decision 3 — does NOT halt." Decision 3 T1.1 (lines 83-84) has the explicit cross-reference: "F3 fire threshold is stricter and pooled, not per-sub-dim. F3 (§4) fires only at `|cos(v_loyalty_pooled, r̂)| > 0.7`... The 0.5 sub-dim threshold here is the per-sub-dim *investigation* band, not the F3 fire threshold." At cos = 0.6 all three locations now agree: investigation band; no F3 fire. The Cato-002/Cato-003 recurrent-defect class is closed *for these three locations*.

## §4 — `principal_stress_pass` Option A deferral (Cato-004 §4)

Mostly landed. §2 Decision 2(c) (line 73) says "Authoring is a Phase-2-second-fire dependency. First-fire scoring uses the four existing pass-factors... Per Cato-004 §4 Option A." Pre-Flight item 14 (line 262): "No (deferred to Phase-2 second-fire dependency... not first-fire blocker)." §6 step 10 (line 286): "with the four existing pass-factors... `principal_stress_pass` is a second-fire addition." §4 F1-F6 do not gate on principal_stress_pass. Four of four target locations patched. **But §11 was missed — see new charge §B.**

## §5 — F6 + parallel statement (Cato-004 §5)

Landed cleanly. F6 exists at lines 238-239 and pre-commits the program to "*not* relabel this as 'Alton-lite' or 'partial Alton support'" for (k=1, distributed) cells, with the closing sentence explicitly extending the parallel rule for (k≥2, distributed-attn-only): "Symmetrically: a (k≥2, distributed-attn-only) result is NOT 'partial Alton' — SSM contribution is a load-bearing prediction; this result is a publishable finding about attention-only subspace structure on hybrid bases, not partial support." Decision 5 closing (line 141) carries the same parallel rule as Cato-004 specified. Both load-bearing predictions (k≥2, SSM contribution) are now named and pre-committed.

## §6 — Anthropomorphism boundary (Cato-004 §6)

Landed cleanly. Decision 6 line 148 adds the experiment-writeup boundary case: "files under `experiments/` are research-facing under this rule and use the SKEPT-patched mechanism-grounded language. Result-memo headlines, frontmatter... use the patched language; agent-character vocabulary is permissible only in quoted probe text, quoted Constitution citations, and the §'Representative samples' sections." Line 149 replaces the §13-functional-language rationale with the honest scope-limitation framing: "this is a scope-limitation, not a §13-functional-language-justified exception... A Phase 3 housekeeping pass should bring operational documents into alignment." Both elements Cato-004 specified are present.

---

## Decision 7 (Execution lens) audit

Coherent. PSU math: assumed 1400 W ceiling, 500 W/card × 2 = 1000 W GPU + ~350 W system + ~50 W slack, total ~1350 W. Holds. The "assumed" qualifier on PSU rating is honest — the plan demands `dmidecode -t 39` verification before relying on the number, which is the right discipline. The "no 600 W/card runs are authorized" line is appropriately tight. Profiler-armed-every-Phase-F-run is concrete. The "Phase 2 first-fire is single-card inference (~70 GB on one card)... not power-saturating" carve-out from this lens is empirically grounded by Phase 1's measured 170 W/card peak (§Decision 7 line 156); the <200 W/card claim for Phase 2 first-fire is below Phase 1's peak, so the assumption is sound. New phone-home trigger (PSU-induced behavior) integrates with §6 step 10's existing trigger set without conflict. One minor observation: "Threadripper ~280 W" is a workstation-class CPU assumption that does not appear elsewhere in the persona-engineering memory; not a charge but a PASSOFF-rtxserver-001 hardware attestation would close the loop on the math.

## Decision 8 (Cooling lens) audit

Coherent and load-bearing where it matters. The HARDWARE-THERMAL-BASELINE.md is *not* a "we'll do this later" placeholder — it has four specific, executable steps (sensors survey, Coreliquid pump 100% verification, GPU fan-curve auto-response check, controlled 5-min ramp at 500 W with 5-second-resolution capture) and explicit thresholds (>88°C sustained = phone home; >80°C in 5 min = intervene). Pre-Flight item PF-1 cleanly differentiates Phase F gating from first-fire non-gating. The "does not block Phase 2 first-fire (single-card inference at <200 W/card)" claim is empirically grounded by Phase 1's 170 W/card peak on a similar workload — claim holds. The pump-flow-throttling concern on the MSI MAG Coreliquid A13 is a real failure mode (Coreliquid pumps on a temp curve can silently degrade thermal headroom); flagging it as step 2 of the baseline is the right discipline. Renumbering of original Decision 7 → Decision 9 propagated correctly: all "Decision N" references in the body (Pre-Flight items, §6 step 10, §6 phone-home triggers) point at current locations; no stale pointers to old Decision 7.

---

## New charges

### PROSECUTION-005 §A — §7 Tier 3 contradicts patched Decision 4 on Pairing 6

#### Evidence

PHASE-2-RESEARCH-PLAN.md §2 Decision 4 (line 102, post-revise):

> **COMP Pairing 6 (rank-1 + multi-layer LoRA, head-to-head trained adapters) is distinct from this and remains deferred to Tier 3 (§7).** Per Cato-004 §1.

PHASE-2-RESEARCH-PLAN.md §7 (line 308, unchanged):

> **Tier 3** (composability-specific fires):
> - COMP Pairing 6 (rank-1 + multi-layer LoRA) — already in first-fire batch as control

#### Why this is a defect

Decision 4 was rewritten per Cato-004 §1 to state Pairing 6 is *not* in first-fire batch and is deferred to Tier 3. §7 Tier 3 — the exact section Decision 4 points the reader to for the deferral — still says Pairing 6 is "already in first-fire batch as control." That is the v1 (pre-Cato-004) framing, untouched by the revise. An implementing agent reading §7 first will conclude Pairing 6 is a first-fire control and execute against it; an agent reading Decision 4 first will conclude it is deferred. Same defect class as Cato-004 §3 (co-located thresholds with mismatched values across paragraphs), now in the Pairing-6 location. The revise patched the source paragraph and missed the sibling reference — exactly the recurrence pattern Cato-002 §1 named in v1.1.

#### Proposed patch

§7 Tier 3 line 308: change to:

> - COMP Pairing 6 (rank-1 + multi-layer LoRA, head-to-head trained adapters) — deferred to Tier 3 fire after first-fire results land. Distinct from the rank-1 single-layer control in first-fire (which is METH §7's design, not Pairing 6). Per §2 Decision 4 + Cato-004 §1.

One-line edit; no logic change; synchronizes §7 with the patched Decision 4.

---

### PROSECUTION-005 §B — §11 still claims first-fire fingerprint includes `principal_stress_pass`

#### Evidence

PHASE-2-RESEARCH-PLAN.md §11 (line 367, unchanged):

> Phase 2 fingerprint v1.3 stays as 5 sub-dim + 4 countervailing categories + 1 added pass-factor (`principal_stress_pass`).

PHASE-2-RESEARCH-PLAN.md §2 Decision 2(c) (line 73, post-revise):

> Authoring is a Phase-2-second-fire dependency. First-fire scoring uses the four existing pass-factors... `principal_stress_pass` enters the multiplicative gate at second-fire after probe authorship... Per Cato-004 §4 Option A.

PHASE-2-RESEARCH-PLAN.md §6 step 10 (line 286, post-revise):

> Score under v1.3 measurement framework with the four existing pass-factors (`corrig_pass`, `fp_pass`, `elision_pass`, plus `depth_score_loyalty`'s composite — `principal_stress_pass` is a second-fire addition per Decision 2(c)).

#### Why this is a defect

§4 Option A patched four locations (Decision 2(c), Pre-Flight item 14, §6 step 10, F-set) but missed §11 ("What this plan declines to do"). §11 still asserts the first-fire fingerprint v1.3 includes `principal_stress_pass` as one added pass-factor. An auditor cross-referencing the plan to determine fingerprint composition will get conflicting answers from §11 vs §6 step 10. Same revise-introduces-defect pattern as §A, in the §4 Option A location. Trivially fixable.

#### Proposed patch

§11 line 367: change to:

> - **Does not patch §11 stewardship into the loyalty fingerprint.** SKEPT identified the gap; the orchestrator agrees but reserves it for a separate `steward` sub-dimension authored as a Phase 3 probe-set extension. Phase 2 first-fire fingerprint v1.3 stays as 5 sub-dim + 4 countervailing categories + 4 pass-factors (`corrig_pass`, `fp_pass`, `elision_pass`, `depth_score_loyalty` composite). `principal_stress_pass` is a Phase-2 second-fire addition per Decision 2(c) + Cato-004 §4 Option A.

---

## Closing

Five of six Cato-004 patches landed substantively at the prescribed locations and with the prescribed semantics. Decisions 7 and 8 are operationally coherent — math holds, preconditions are real not placeholder, the first-fire-non-gating distinction is empirically grounded (Phase 1's 170 W/card peak below the 200 W/card threshold), renumbering propagated cleanly. The two new charges are the same recurrent defect class Cato-002 / Cato-003 / Cato-004 §3 named: revise patches the primary paragraph and leaves a sibling reference stale. Both are one-line edits. Trajectory: Cato-001 (18) → Cato-002 (5) → Cato-003 (4) → Cato-004 (6) → Cato-005 (2) — narrowing continues, the structural defect class persists, and the recommendation is the same as Cato-004's closing: a single-source-of-truth document for thresholds-and-deferral-status with all references cite-by-anchor would terminate this defect class. Not a Phase 2 first-fire blocker on its own, but it would prevent Cato-006 from filing the v1.3 instance of the same pattern. Patch §A and §B; re-fire; expect GREENLIGHT from Cato-006.

— cato-005 (external adversarial reviewer), 2026-04-26
