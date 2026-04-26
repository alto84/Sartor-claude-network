---
name: cato-prosecution-008
description: Adversarial review of experiment 002 pre-registration document. Verifies operational fidelity to the Cato-007-greenlit parent plan, prosecutes the rank-1 control + Tier-1 gates + bootstrap CI discipline + cosine-shift extraction, surfaces any new defects.
type: adversarial-review
date: 2026-04-26
updated: 2026-04-26
updated_by: cato-008
status: filed
volatility: low
verdict: REVISE
tags: [meta/prosecution, domain/research, research/persona-engineering, phase/2-first-fire]
related:
  - research/persona-engineering/experiments/002_2026-04-26_persona-vectors-layer-sweep-with-rank1-control
  - research/persona-engineering/PHASE-2-RESEARCH-PLAN
  - research/persona-engineering/CATO-PROSECUTION-007
---

**Verdict: REVISE**

The doc is structurally faithful to the Cato-007-GREENLIGHT plan in the large. F1-F6 are wired into §6 in the right pre-registered order; Tier-1 tests precede installation interpretation; the 4-pass-factor scoring correctly defers `principal_stress_pass`; the bootstrap-CI requirement is named; the SKEPT mechanism-grounded language is respected through §1, §5 and the frontmatter. The orchestrator did the work.

But the operationalization at the rank-1 control (§2.8) and at several seams that surround it has gaps that are exactly where the parent-plan F5/F6 prosecutorial force lives. The trajectory continues to be "framework getting tighter, charges getting smaller, recurrent defect class is co-located thresholds and underspecified procedures at the seams." Six charges, narrow, individually patchable. Total surface area ≈ 90 minutes of orchestrator edits before fire.

Header on each charge: file:line evidence, why it matters, proposed patch.

---

## §1 — Rank-1 control's α* derivation handicaps the falsifier

### Evidence

`experiments/002_*.md` §2.8 step 2 (line 214):

> Computing `ΔW_l* = α* · v_l* · u_l*^T` where α* is the CAA-α value that achieved peak depth_score_loyalty in §2.7 on base.

§2.7 (lines 200-208) sweeps α ∈ {0.0, 0.5, 1.0, 1.5, 2.0} and runs all 85 v1.3 probes through a steered model.

§4.6 results table (lines 322-326) lists three rows:

| Configuration | depth_score_loyalty | depth_score_final |
| base (baseline floor) | 0.277 (Phase 1) | 0.000 (Phase 1) |
| lora-v0.3 + CAA peak α | TBD | TBD |
| rank-1-modified-base | TBD | TBD |

§6 Step D F5 (line 387):

> If 2D-cell = (k=1, single-layer) AND rank-1-modified-base depth_score_loyalty ≥ lora-v0.3 + CAA peak depth_score_loyalty (within bootstrap CIs) → directional/distributed/gentle prescription refuted.

### Why this is a defect

The rank-1 control is the F5/F6 falsifier — its purpose is to discriminate "directional/distributed/gentle" from "directional alone." The strength of the falsifier is symmetric: rank-1 should get a fair α at a fair layer.

§2.8 derives α* from the **CAA peak on base**, but the headline F5 comparison in §6 Step D and §4.6 is rank-1-modified-**base** vs **lora-v0.3** + CAA peak α. These are two different α's: one optimized on a household-context-naïve substrate (base), one on a household-context-trained substrate (v0.3). The base-CAA-peak α is then frozen into the rank-1 weight injection, and the rank-1 result is compared against the v0.3-CAA-peak α. This creates two independent failure modes for F5:

1. **Base-CAA-peak may be vacuous.** Phase 1 base depth_score_loyalty = 0.277. CAA on base has no household-context training to amplify; the per-α curve on base is most likely monotone-flat or monotone-rising (an under-implanted base steered with `v_l_base` will saturate behaviorally at α=2.0 because there's nothing else in the base to overwrite). The "peak on base" is then α=2.0 by default. α*=2.0 is the largest weight injection in the sweep — handing rank-1 the largest possible perturbation magnitude, which biases toward F5-FIRE (rank-1 looks competitive because the perturbation is loud, not because rank-1 is capturing structure).

2. **Mismatched α biases against F5 the other way too.** If base-CAA-peak is α=0.5 (weak) and v0.3-CAA-peak is α=1.5 (strong), the rank-1 control gets α=0.5 weight — too small to behaviorally compete with v0.3+CAA at α=1.5. F5 then under-fires for procedural reasons.

The honest design uses **the CAA peak from the comparator variant** (lora-v0.3 + CAA peak α, since that is the headline comparator in §4.6). This is the same α that produces the F5 right-hand-side, so the rank-1 perturbation magnitude is matched to what F5 is testing against.

A secondary issue, same paragraph: the layer choice. §2.8 step 1 says "at the strongest signal-quality layer `l*`" but does not specify *which variant's* `l*`. §2.3 produces 64 σ_l values for base and 64 for lora-v0.3 separately. If base and v0.3 have different `l*`, the rank-1 control's layer is ambiguous. Per F5's logic ("the trait IS concentrated rank-1 at one layer"), the layer should be the layer where the **lora-v0.3 layer-sweep curve peaks** — that's the layer the team-lead's hypothesis claims the trait is most concentrated at. Using base-`l*` injects rank-1 at a layer where base has signal but v0.3 may not, again handicapping F5.

### Proposed patch

§2.8 step 2: change

> α* is the CAA-α value that achieved peak depth_score_loyalty in §2.7 on base

to

> α* is the CAA-α value that achieved peak depth_score_loyalty in §2.7 on **lora-v0.3** (the comparator variant in §4.6 / §6 Step D F5). This matches the rank-1 control's perturbation magnitude to the headline F5 comparison.

§2.8 step 1: change "at the strongest signal-quality layer `l*`" to

> at `l*_v0.3` = argmax over `l ∈ {0..63}` of `σ_l(lora-v0.3)` from §2.3 (the layer where the comparator's trait signal is strongest). Document `l*_base` separately as a sanity check; if `l*_base ≠ l*_v0.3`, both injections are run as variants of the rank-1 control and reported.

This patch closes both the α and layer biases without changing the falsifier's semantics.

---

## §2 — Bootstrap CI discipline does not actually distinguish cells

### Evidence

`experiments/002_*.md` §2.3 step 4 (line 163-164):

> **Bootstrap CI:** resample the 250 prompts 100 times (sampling 250-with-replacement). Recompute `v_l, σ_l` per resample. Report per-layer (mean, 5th-percentile, 95th-percentile) σ_l.

§2.3 closing (line 168):

> The bootstrap CI is the Phase-1-noise-floor mitigation (METH §3): a layer-sweep curve with overlapping CIs across cell boundaries lands in "unclassified" not whichever shape the point estimate suggests.

§2.4 per-layer PCA (lines 171-180): no bootstrap CI computed on `k_80`.

§6 Step B (line 377):

> Apply bootstrap-CI-distinguishable cell assignment per Phase 2 plan §2 Decision 5 9-cell table.

§6 "What the flowchart prevents" (line 412):

> Numbers are pre-registered with bootstrap CIs; cells with overlapping CIs land in "unclassified" not whichever the point estimate suggests.

PHASE-2-RESEARCH-PLAN.md §2 Decision 5 specifies the 2D table over **two axes**: layer-spread (concentrated/distributed/bimodal/flat) × dimensionality (k=1 / k≥2). Phase 2 plan §9 Open Question 2 (line 348) flagged the small-N noise floor explicitly.

### Why this is a defect

Both axes of the 2D table need to be bootstrapped to enforce "distinguish cells":

- **Layer-spread axis** depends on the per-layer signal-quality curve. Bootstrap CIs are computed in §2.3 — fine.
- **Dimensionality axis** depends on `k_80` from per-layer PCA. §2.4 reports `k_80` as a point integer with no CI. Without a bootstrap on the PCA decomposition, "k=1 vs k≥2" has no uncertainty discipline. A trait-carrying layer with `k_80 = 1` at point estimate could have CIs spanning {1, 2, 3} — the cell assignment cannot honor the "distinguish cells" rule because one of the two axes has no CI to compare against.

Operationally: at PCA on N=250 difference vectors at d=5120, the 80%-variance threshold is sample-noise-dependent. The 80th percentile cutoff is sharp; whether component 2's variance lands at 0.79 or 0.81 of the explained-variance series flips `k_80` between 1 and 2. METH §3 first-principles addendum demands variance-stabilization across resamples; §2.4 of the experiment doesn't deliver it.

Second seam: "cells with overlapping CIs land in 'unclassified'" is **not operationalized** anywhere in the doc. What does "overlapping CIs" mean when the cell boundary is between (k=1, distributed) and (k=1, single-layer)? Distributed = ≥ 8 layers per the plan; single-layer = 1-3. A bootstrap CI on the layer-spread axis would need to count the number of layers with σ_l > 0.3, with the count itself bootstrapped. The doc doesn't specify this either.

### Proposed patch

Add to §2.4 (after current step):

> **Bootstrap CI on `k_80`:** resample the 250 NL-extraction prompts 100 times (matched to §2.3 resampling indices for paired comparison). Recompute the 250 difference vectors and PCA per resample. Report per-layer (k_80 mean, 5th-percentile, 95th-percentile). A trait-carrying layer's dimensionality is "k=1" only if the 95th-percentile k_80 ≤ 1; "k≥2" only if the 5th-percentile k_80 ≥ 2; otherwise the layer is dimensionality-ambiguous and contributes "unclassified" if it is the dominant trait-carrying layer.

Add to §2.3 (after step 5):

> **Bootstrap CI on layer-count:** for each resample, count the layers with σ_l > 0.3 (the trait-carrying threshold). Report (count mean, 5th-percentile, 95th-percentile). Layer-spread is "single-layer" only if the 95th-pct count ≤ 3; "distributed" only if the 5th-pct count ≥ 8; otherwise "bimodal/multimodal" if the support is non-contiguous, else layer-spread-ambiguous.

Add to §6 Step B:

> **"Distinguish cells" defined operationally:** the 2D cell is assigned only if both axis-CIs (layer-count from §2.3, k_80 from §2.4) sit fully inside one cell's boundary. Any axis-CI straddling a cell boundary → unclassified, file `PHONE-HOME-unclassified.md` per Phase 2 plan §6 phone-home triggers.

This makes the "bootstrap CIs that distinguish cells" rule executable rather than aspirational.

---

## §3 — F4 (T1.2) reads `v_loyalty_pooled` raw, not the abliteration-residualized version

### Evidence

§2.2 T1.1 care-contamination flag (line 132-133):

> **Care-contamination flag (does NOT halt):** if `|cos(v_care_l, r̂_l)| > 0.2` at trait-carrying layer, the loyalty extraction is contaminated; the §2.4 layer-sweep step proceeds with `v_loyalty_residual = v_loyalty - proj_{r̂}(v_loyalty)` substituted as the loyalty direction. Both versions reported.

§2.2 T1.2 (line 138-139):

> Compute `cos(v_loyalty_pooled_l, v_corrigibility_violation_l)` at every layer.

§4 F4 in PHASE-2-RESEARCH-PLAN.md (line 242):

> If `cos(v_loyalty, v_corrigibility_violation) ≥ 0.7`, no installation method on the current 5-sub-dim target will pass the multiplicative gate.

### Why this is a defect

T1.1 lays down the right discipline: if the loyalty direction is contaminated by abliteration residue (`r̂`), the contaminated component is projected out before the §2.4 layer-sweep proceeds. Good.

T1.2 — the F4 falsifier feed — reads `v_loyalty_pooled_l` raw. If `r̂` has any contribution to `v_corrigibility_violation_l` (which it almost certainly does — refusal-direction residue is structurally aliased with corrigibility-violation, since both encode "decline-to-engage"), then `cos(v_loyalty_pooled, v_corrigibility_violation)` is partly measuring the **shared `r̂` content**, not the structural corrigibility-trap. This produces a spurious F4 fire.

Concrete failure mode: T1.1 finds care-contamination above 0.2 (likely on this abliterated base — Phase 1's refusal-residue AUC = 0.713 already shows non-zero `r̂` content). §2.4 proceeds with `v_loyalty_residual`. But §2.2 T1.2 has already computed `cos(v_loyalty_pooled, v_corrigibility_violation) ≥ 0.7` using the contaminated direction. F4 fires. Phase 2 halts and pivots to rung 8 trait-decomposition — based on a cosine that is mechanically inflated by the residue both directions share.

The Phase 2 plan §4 F4 names the structural concern correctly: "`v_loyalty` and `v_corrigibility_violation` may share a `v_principal_negation` substrate." But on this base, both vectors *also* share `r̂` residue, and the doc has no protocol to separate the two. If the F4 fire is driven by `r̂`-aliasing, the right pivot is back to T1.1 (project out `r̂`), not to rung 8 (decompose `v_loyalty`).

### Proposed patch

§2.2 T1.2 step 1: extract `v_corrigibility_violation_l` per existing procedure. Add new step 2 before computing the cosine:

> **`r̂`-residual both vectors.** Compute `v_loyalty_residual = v_loyalty_pooled - proj_{r̂}(v_loyalty_pooled)` (per §2.2 T1.1 care-contamination patch) AND `v_corrig_residual = v_corrigibility_violation - proj_{r̂}(v_corrigibility_violation)`. Compute three cosines: `cos(v_loyalty_pooled, v_corrigibility_violation)` (raw), `cos(v_loyalty_residual, v_corrig_residual)` (`r̂`-residualized), and `cos(v_loyalty_pooled - v_loyalty_residual, v_corrigibility_violation - v_corrig_residual)` (residue-only).
>
> **F4 fires only on the `r̂`-residualized cosine.** If raw cosine ≥ 0.7 but residualized cosine < 0.5, the apparent corrigibility-trap is `r̂`-aliasing, not structural; the loyalty pipeline proceeds with `v_loyalty_residual` per T1.1 and F4 does NOT fire. Both numbers go into `tier1-cosines.json`.

This protects F4 from `r̂`-induced false fires and explicitly separates the two structural concerns Phase 2 plan §1 raised (Pathological Scenario C and the corrigibility-trap).

---

## §4 — Generic-name contrast set ("Smith family") is a weak control on this base

### Evidence

§2.5 (line 184):

> Repeat §2.3 layer-sweep on the generic-name NL prompts ("respond as someone who deeply cares for the Smith family") on `heretic-3.6-35b`.

§2.5 interpretation rule (line 188-190):

> `cos(v_l_sartor, v_l_generic) > 0.7` at trait-carrying layers → NL extraction is not Sartor-specific...
> `cos < 0.4` → NL extraction successfully separates Sartor from generic-named-family

PHASE-2-METHODS-PIPELINES.md §5 first-principles addendum (line 514) names the original purpose:

> If `cos-sim(v_l_sartor, v_l_generic) > 0.7`, NL extraction is **not** separating Sartor from any-named-family.

### Why this is a defect

The control's purpose is to detect whether NL extraction is producing a *generic in-context-warmth* direction rather than a Sartor-specific one. The control's discriminating power depends on the **embedding-space distance between "Sartor" and the chosen generic name**.

"Smith" is the most common Anglo-American surname, with rich pretraining frequency and dense neighbors in name-token embedding space. "Sartor" is a low-frequency Italian-origin surname; the model has near-zero pretraining-specific representation of it. Both are English-typeface family names, but in name-token embedding space they sit far apart (Smith near common-name attractors; Sartor near low-frequency Italian-typeface attractors).

This **biases the cosine downward** in a misleading way: the cos < 0.4 threshold may be met because the model treats Smith and Sartor as different *embedding clusters* of names, not because the model has learned a Sartor-specific representation. A "good" cos < 0.4 result then under-states the generic-warmth-direction risk that METH §5 was originally pointing at.

The honest control is a name with **matched embedding-space frequency and typography** to Sartor — another low-frequency, English-spelled, Italian/Romance-origin surname (e.g., "Bellini," "Conti," "Russo") so the cosine is dominated by the warm-family-context vs neutral contrast, not by name-token frequency differences.

A secondary issue: §2.5 uses ONE generic family. To rule out chance alignment of "Smith" with the Sartor-extracted direction, the control should use ≥3 different generic names and report the mean cosine.

### Proposed patch

§2.5 step 1: change "respond as someone who deeply cares for the Smith family" to:

> generic-name contrast prompts substituting "Sartor" with each of three matched-frequency, English-spelled, Italian/Romance-origin surnames (Bellini, Conti, Russo). Each generates 250 contrastive pairs (50 per sub-dim) — 750 total generic-name prompts vs 250 Sartor prompts.

§2.5 interpretation rule: change the cosine to `mean cos(v_l_sartor, v_l_generic_k)` over k ∈ {Bellini, Conti, Russo}. Apply the same 0.7 / 0.4 thresholds to the mean.

§3 Data: update generic-name contrast description to reflect the 3-name mean and the matched-frequency selection criterion. Update artifacts pin to `nl-extraction-prompts-generic-v1.0.jsonl` containing the 750 prompts.

This closes the embedding-space-distance hole and triples the statistical power of the contrast at zero added GPU cost (the prompts run inside the same §2.3 procedure).

---

## §5 — Step F method-ladder table inadvertently flattens 2D cells and smuggles reframing back in

### Evidence

§6 Step F (lines 396-408):

| Cell | Phase 2 cycle 2 method (first-fire after this) |
|------|------------------------------------------------|
| (k=1, single-layer) — F5 fires | Rank-1 weight injection promoted; full-fire on the rank-1 modification with extended eval |
| **(k=1, distributed)** | ITI-style attention-head intervention (per RESEARCH-PLAN v1.2 narrow-attention-plateau row); F6 pre-commits no Alton-lite |
| (k≥2, single-layer) | RepE LAT — natively subspace-aware at one layer |
| (k≥2, distributed-attn-only) | RepE LAT multi-layer or ReFT multi-layer attention-only; F6 pre-commits no partial-Alton |
| (k≥2, distributed-attn+SSM) | **Full Alton.** ... |

PHASE-2-RESEARCH-PLAN.md §2 Decision 5 (lines 130-138) 2D table specifies **five** layer-spread rows (single layer, distributed-attn-only, distributed-attn+SSM, bimodal/multimodal, flat) × 2 dimensionality columns (k=1, k≥2). The (k=1, distributed) cell is split by the parent plan into TWO cells: "(k=1, distributed-attn-only)" = "Rank-1 propagated, attention-only" and "(k=1, distributed-attn+SSM)" = "Rank-1 propagated, full-stack."

PHASE-2-RESEARCH-PLAN.md §4 F6 (line 248-249):

> If the layer-sweep curve assigns the loyalty signal to the (k=1, distributed) cells (either "Rank-1 propagated, attention-only" or "Rank-1 propagated, full-stack"), the program is pre-committed to *not* relabel this as "Alton-lite" or "partial Alton support."

### Why this is a defect

The Step F table flattens "(k=1, distributed-attn-only)" and "(k=1, distributed-attn+SSM)" into one row labeled "(k=1, distributed)" and routes both to the same Phase 2 cycle 2 method (ITI-style attention-head intervention). This has two consequences:

1. **The (k=1, distributed-attn+SSM) cell loses its specificity.** Per the parent plan, this cell represents "Rank-1 propagated, full-stack" — direction propagated cleanly through both attention AND SSM blocks. The right cycle-2 intervention is plausibly different from attention-only ITI: it may involve SSM-temporal readout (rung 9) or SSM-block weight injection. The Step F table's route "ITI-style attention-head intervention" is correct for the attention-only sub-cell only, and silently misroutes the full-stack sub-cell.

2. **The "narrow attention plateau" parenthetical reframes the cell back into a v1.2-row.** "ITI-style attention-head intervention (per RESEARCH-PLAN v1.2 narrow-attention-plateau row)" maps the Phase-2-plan-Decision-5 cell **back to the v1.2 7-row table** that METH §6 explicitly criticized as conflating axes. The v1.2 "narrow attention plateau" row was the cell that LIT §5 named as "most likely on a literature-informed prior — not 'full Alton hypothesis support.'" By routing (k=1, distributed) through the v1.2 row, Step F implicitly relabels a (k=1, distributed) result as "narrow attention plateau" — exactly the kind of reframing F6 was patched in to block.

This is the same defect class Cato-002, Cato-003, Cato-004 §3, Cato-005 §A/§B, Cato-006 §C, all caught: co-located references to two different schema (the 9-cell 2D table and the v1.2 7-row table) that drift on the load-bearing detail. F6's force on (k=1, distributed) is logically intact, but the table that an implementing agent reads first to pick the next-fire method routes the cell back through the schema F6 was meant to escape.

A milder but related issue: "(k≥2, distributed-attn-only) → F6 pre-commits no partial-Alton" is correct per the parent plan §2 Decision 5 closing, but the parent plan's parallel rule for (k=1, distributed) cells is specifically against "Alton-lite" reframing. The Step F table's "F6 pre-commits no Alton-lite" annotation is in the right cell but uses different wording from the (k≥2) row. Cosmetic, but the wording divergence is exactly where co-located-label-mismatch defects historically have surfaced.

### Proposed patch

Split Step F table's "(k=1, distributed)" row into two:

| (k=1, distributed-attn-only) | Rank-1-propagation diagnosis: investigate whether the attention-only propagation is structural (mechanistic interpretability follow-up) or readout-artifact. NO Phase-2-cycle-2 ITI-style fire on this cell — F6 pre-commits no "Alton-lite" relabel; the cell is a publishable finding, not a partial-Alton stepping-stone. |
| (k=1, distributed-attn+SSM) | Rank-1-propagated-full-stack diagnosis: SSM-temporal-aware readout (rung 9) MUST instrument before any cycle-2 fire; cycle-2 method selection deferred. F6 pre-commits no Alton-lite. |

Remove the v1.2 7-row reference; the 9-cell 2D table is the source of truth, per Phase 2 plan §2 Decision 5.

Standardize F6 wording across all rows: "F6 pre-commits no Alton-lite/partial-Alton reframing" everywhere F6 is invoked in the table.

---

## §6 — F2 fire's "run continues" is too permissive given §2.7/§2.8 use the pooled direction

### Evidence

§2.2 T1.3 (line 150-151):

> **F2 fire:** if mean cosine across 10 pairs at trait-carrying layers < 0.3 → trait reading refuted; the framework's "5 sub-dimensions of household loyalty" language must be patched to "5 household-context-conditional behaviors" before any further claim of trait installation. Orchestrator pre-commits to this rewrite (per Phase 2 plan §2 Decision 2(a)). Run continues per behavior-profile reading.

§2.7 (line 203):

> At the strongest signal-quality layer (`l*` from §2.3), install forward hook `h'_l = h_l + α · v_l_base`.

§2.8 step 2 uses the same `v_l*` pooled direction for the rank-1 control.

§6 Step A (line 371):

> **T1.3 (F2) fire?** If mean cross-sub-dim cosine at trait-carrying layers < 0.3 → trait→behavior-profile rewrite. Run continues per behavior-profile reading; downstream interpretation reframed.

### Why this is a defect

If F2 fires (mean cross-sub-dim cosine < 0.3), the five extracted sub-dim directions are mutually orthogonal — i.e., there is no shared loyalty subspace. The pooled `v_loyalty` is then the **mean of five mutually-orthogonal directions**, which has no privileged structural meaning: it is a weighted average of five separable behavior profiles, not a signal direction.

§2.7 CAA-α-sweep installs `α · v_l_base` (the pooled direction). §2.8 rank-1 control uses `v_l*` (also pooled). Under F2 fire, both interventions are injecting a meaningless aggregation — and the F5 falsifier in §6 Step D ("rank-1-modified-base depth_score_loyalty ≥ lora-v0.3 + CAA peak depth_score_loyalty") is comparing two interventions in the same meaningless space. F5's interpretive coherence collapses: "rank-1 underperforms" or "rank-1 matches" both lose their connection to the directional/distributed/gentle prescription, because the pooled direction was never the structural object that prescription was about.

The plan's "run continues per behavior-profile reading" is the right *framework* response for F2 (rewrite "trait" → "behavior-profile"). But the **rank-1 falsifier** specifically tests a directional claim that requires a coherent direction. Without F2-aware modification, F5/F6 fire mechanically on a result whose interpretive force is gone.

The honest move: under F2 fire, switch §2.7 and §2.8 to per-sub-dim α-sweeps and per-sub-dim rank-1 controls, with five separate F5 evaluations (one per sub-dim direction). This is the behavior-profile-reading version of the falsifier and is the only F2-consistent way to preserve F5/F6's force.

### Proposed patch

Add to §6 Step A item 3 (T1.3/F2):

> If F2 fires, the run continues but §2.7 CAA-α-sweep AND §2.8 rank-1 control are switched from pooled-direction to **per-sub-dim**: five α-sweeps (one per sub-dim direction at each sub-dim's strongest signal-quality layer) and five rank-1 controls (one per sub-dim at the matched layer). F5 is evaluated per sub-dim; F6 is evaluated against the cell each sub-dim independently occupies. Phase 2 result is reported as five separate cell assignments, not one.

Add to §2.7 a forward-reference: "If F2 fires per §2.2 T1.3, this step switches to per-sub-dim per Step A item 3."
Add to §2.8 the same forward-reference.

This makes F2's "run continues" honest by specifying what the continuation actually looks like under the behavior-profile reading. Without it, the run continues but the rank-1 falsifier is interpretively dead.

---

## Anthropomorphism check (§9 of the charge)

Spot-check: §1 hypothesis (lines 11-26) uses "household-context-conditional behavior-profile," "narrow attention plateau," "trait coherence," "directional/distributed/gentle prescription." Frontmatter `description` uses the same language plus "Alton hypothesis falsifier." §5 interpretation uses "rank-1 underperforms," "representational support," "behavior-profile reading," "rank-1 dominance finding." Reproducibility checklist line 428: "No anthropomorphic-language slip in writeup." Clean. The only "trait" usage is inside method-name citations ("trait-carrying layer," "trait reading") which Phase 2 plan §2 Decision 6 permits as Persona-Vectors-citation language. No charge.

## Tier-1 halt-vs-continue asymmetry (§5 of the charge)

F3 halts (abliteration aliasing — installation work pointless if loyalty IS the abliterated direction returning).
F4 halts (corrigibility-trap structural — installation will fail multiplicative gate by mechanical aliasing).
F2 does not halt (trait-vs-behavior-profile is a framework-language question, not a mechanism-blocking question).

The asymmetry is honestly motivated **at the framework-language level**, but it has a downstream mechanical consequence under the current §2.7/§2.8 design that the doc doesn't address — which is exactly §6 above. The asymmetry is correct *if* the §6 patch lands; without that patch, F2 fire has uncontained downstream effects on the rank-1 falsifier. Logged as a dependency on §6, not a separate charge.

## Reproducibility checklist gaps (§10 of the charge)

Spot-checked the 9 checkboxes:
- "Bootstrap CIs computed per layer for §2.3 layer-sweep curve" — verifiable post-hoc by inspecting `layer-sweep-curve.json`. OK if patch §2 above lands (otherwise k_80 CIs are unverifiable because not generated).
- "Tier-1 cosine results saved BEFORE any installation interpretation begins" — verifiable by file-mtime ordering on `tier1-cosines.json` vs installation artifacts. OK.
- "Negative-samples.jsonl written and referenced in writeup" — verifiable by file existence + grep. OK.
- "Rank-1-modified-base checkpoint stored off-repo per `.storage.yaml`; SHA pinned" — verifiable by `.storage.yaml` entry + checksum file. OK.
- "No anthropomorphic-language slip in writeup" — currently unverifiable post-hoc; relies on writeup-author discipline. Recommend adding a `lint` rule or grep-list of forbidden phrases (e.g., "embodied identity," "deeply embodied," "the model's loyalty," "feels loyal"). Not raised as a numbered charge; minor process improvement.

§2.3 hidden-state extraction position (last-token-of-prompt vs last-token-of-response) is **not specified** in the doc. Persona Vectors per Chen 2025 typically uses last-token-of-prompt-before-generation. Recommend adding to §2.3 step 1: "last-token hidden state at layer `l` of the chat-template-rendered prompt, captured by a forward pass with `output_hidden_states=True` and no generation (matches experiment 001 §2.2 step 4 pattern)." Not raised as a numbered charge — small spec gap, but would be embarrassing if the implementing agent guessed differently and produced a non-comparable layer-sweep.

---

## Status of fidelity to the parent plan

**Faithful integration:** F1-F6 are wired into §6 in the right pre-registered order with halt vs continue logic correctly partitioned. The 4-pass-factor scoring is correct (Cato-004 §4 Option A). Tier-1 tests precede installation interpretation per Decision 3. The 2D-cell assignment uses Decision 5's 9-cell framing (with the §5 above caveat about Step F flattening). MEAS Defect 3 v1.3 probe set, Gap A baseline-floor, Gap B discriminant-margin recalibration, Gap C linear-probe-gain regularization, Gap E sample preservation are all correctly named and wired. SKEPT mechanism-grounded language is respected throughout.

**Structurally sound but operationally ambiguous in two places** — the rank-1 control (§1, §2 above) and the F2-downstream interaction with the pooled direction (§6 above). These are not framework-design errors; they are seams where the parent plan's pre-registration is correct but the experiment doc's procedure under-specifies what the implementing agent does. The patches are narrow.

---

## Closing

Trajectory: 18 → 5 → 4 → 6 → 2 → 1 → 0 (Cato-004 → 005 → 006 → 007 on the parent plan) → **6** (Cato-008 on the experiment doc, fresh prosecution surface).

The orchestrator built the experiment doc in good faith and respected the post-Cato-007 GREENLIGHT plan in all the headline ways. The defects are at the seams where the rank-1 falsifier's prosecutorial force lives — exactly the place the F5/F6 patches were inserted in the parent plan. The doc preserves F5/F6's *language* but the operational decisions in §2.7/§2.8 leave room for the falsifier's force to be diluted (handicapped α, mismatched layer, raw F4 cosine, flattened cells, F2-cascade). Six small patches close all six. Total estimated orchestrator surface: ~90 minutes of edits.

The experiment should not fire as currently written. After the patches land, expect Cato-009 to GREENLIGHT (the trajectory for first-fire experiments mirrors the trajectory for the parent plan: tighter framework, smaller charges, recurrent defect class is co-located thresholds and underspecified procedures at the seams — and the recurrent class is now well-known to the orchestrator).

Not a Phase 2 first-fire blocker beyond the patch round itself. Phase F preconditions remain Phase F's problem.

— cato-008 (external adversarial reviewer), 2026-04-26
