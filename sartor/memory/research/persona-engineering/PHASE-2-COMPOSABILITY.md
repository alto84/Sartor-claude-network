---
name: phase-2-composability
description: Activation-space composability analysis for the 8-method ladder. Subspace interactions, order dependence, abliteration overlap, corrigibility-trap, and the directional/distributed/gentle 3D space.
type: research-input
date: 2026-04-26
updated_by: phase2-composability-theorist
volatility: medium
tags: [domain/research, research/persona-engineering, phase/2-plan, theory]
related:
  - research/persona-engineering/METHODS
  - research/persona-engineering/RESEARCH-PLAN
  - research/persona-engineering/MEASUREMENT
  - research/persona-engineering/MEASUREMENT-COUNTERVAILING
---

# Phase 2 — Composability theory

What lives in the residual stream when we apply two methods in sequence, in parallel, or sandwiched. The orchestrator needs analytic priors before deciding whether the ladder is a menu or a recipe. This document supplies them.

Notation throughout. The residual stream at layer `l` is `h_l ∈ R^d` with `d = 5120` (Qwen 3.6 35B A3B hidden size). A method's intervention can always be decomposed into one of three primitives:

- **Weight delta** `ΔW_l`: a permanent change to a writing matrix at layer `l` (attention `o_proj`, MLP `down_proj`, MoE expert `down_proj`, or SSM `out_proj`).
- **Activation delta** `Δh_l`: a residual-stream addition computed at inference, from a hook on layer `l`.
- **Loss-shaping** `ΔL`: a training-time loss term that biases gradients toward a target representation, leaving the resulting `ΔW` to be discovered by SGD.

Every method in METHODS.md collapses to a combination of these three. Composability is then an algebraic question about how these primitives commute, share subspaces, and interfere.

## Pre-flight: the substrate is already edited

Before any pairing, a fact that compounds every analysis below.

The base is `Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16`. Per Arditi 2024, abliteration applied two operations:

1. Inference-time projection-out (not present in our weights — that is a runtime hook the upstream author used to find `r̂`).
2. Weight orthogonalization, baked permanently:

```
W'_l = W_l − r̂ r̂^T W_l = (I − r̂ r̂^T) W_l
```

for every matrix `W_l` that writes to the residual stream. The geometry consequence: every column of every write matrix has been projected onto the hyperplane orthogonal to `r̂`. The image of every write matrix lives in `r̂^⊥ ⊂ R^d`, a (d−1)-dimensional subspace.

This is not a no-op for our purposes. Three propagating consequences:

1. The abliterated base **cannot write into `span(r̂)`** by any natural forward pass. Any new direction we install is geometrically constrained to live in `r̂^⊥` or be reached only via embedding-table residue and bias terms.
2. Activations *can* still have `r̂` content if it leaks in through layer norms, residual additions of unmodified components, or embedding-token bias. The subspace `span(r̂)` is suppressed-but-not-zeroed in `h_l`.
3. Every Phase-2 intervention writes either `ΔW_l` (which composes with the orthogonalization left-multiplicatively) or `Δh_l` (which can violate the orthogonal-image constraint of the substrate). This asymmetry matters and is invisible in the methods literature, which assumes an unmodified base.

Hold this in mind through everything below; Q1 returns to it directly.

## Method primitives table

| Method | Primitive | Lives in |
|---|---|---|
| Persona Vectors preventative-steering (1a) | `ΔL` (projection-loss term) → discovered `ΔW` | gradient-shaped subspace; loss term acts on `proj_v(h_l)`, an effectively rank-1 constraint |
| CAA inference-time (1b) | `Δh_l = α · v_l` | `span(v_l)` ⊂ R^d, rank 1 at chosen layer |
| RepE LAT (read) + LoRRA (control) | LAT: read-only PCA; LoRRA: rank-r `ΔW` on attention proj | LAT projects to top-k PCA subspace; LoRRA writes inside that subspace |
| ReFT / LoReFT (3) | `Δh_l = R^T(W h_l + b − R h_l)` with R rank r | rank-r subspace at chosen `(l, position)`; at runtime acts as `Δh_l` |
| Rank-1 weight injection (4) | `ΔW_l = α · d · u^T` | `span(d) ⊗ span(u)`; rank 1 in both row- and column-space |
| LoRA SFT (5) | `ΔW_l = B_l A_l` with rank r typically 16 | column space of `B_l`, dim ≤ 16 per intervened matrix |
| DPO (6) | `ΔL` (preference log-ratio) → `ΔW` (LoRA-shaped) | column space of the LoRA `B_l` matrices, but trained against contrast not target |
| CAI-lite (7) | DPO with synthesized preferences | same as DPO; subspace shaped by critic biases |
| Mechanistic targeting (8) | `ΔW` restricted to specific heads/experts | union of column spaces of selected components |

Three observations that drive the pairings analysis:

- LoRA, ReFT, and rank-1 injection all live in **low-rank column spaces of write matrices**, but those column spaces are different objects: LoRA chooses them by SGD on cross-entropy; ReFT chooses them by SGD on a representation-shaped loss; rank-1 sets them by hand from `v_l`.
- CAA, ReFT-at-runtime, and the LAT-reading-only path are all inference-time **residual-stream additions** in some subspace.
- Persona Vectors preventative-steering and DPO are both **loss-shaping** that produces weight deltas. The shape of the resulting `ΔW` is a function of the gradient flow path, not just the loss.

## Pairing 1 — LoRA-SFT + CAA-inference

**Mechanistic identity.** LoRA-SFT modifies write matrices: `W'_l = W_l + B_l A_l` with `B_l ∈ R^{d × r}, A_l ∈ R^{r × d_in}, r ≈ 16`. CAA adds `α v_l` to the residual stream at layer `l*` at inference. They modify different objects. LoRA's effect on `h_l` is realized through the forward pass only when the LoRA-modified matrix is invoked; CAA's effect on `h_l*` is direct.

**Subspace identity.** The LoRA's column space `col(B_l) ⊂ R^d` is at most 16-dimensional per modified matrix. The CAA direction `v_l ∈ R^d` is rank 1. Three relationships are possible:

1. `v_l ∈ col(B_l)` — CAA's direction is a vector LoRA already learned to write into the residual stream. Adding CAA at inference doubles down on a representation LoRA already amplifies.
2. `v_l ⊥ col(B_l)` (in expectation) — CAA's direction is orthogonal to LoRA's adjustments. They live in independent subspaces; behavioral effects add linearly.
3. Generic angle — most realistic case. The cosine similarity `cos(v_l, P_{col(B_l)} v_l)` lies in (0, 1). Effects partially overlap.

The empirical anchor for distinguishing these is METHODS.md §1's drift-monitoring step: project `h_l` onto `v_l` for both base-heretic and v0.3. If v0.3 already shifts the projection, then `v_l` partially lies in `col(B_l)` (case 1 or generic). If the projection is unchanged, `v_l ⊥ col(B_l)` (case 2).

**Order dependence.** The composition is

```
h'_l = (h_l with LoRA active) + α v_l
```

Because LoRA is a forward-pass modification and CAA is a hook-time addition at the same layer, they commute as operators on `h_l` — there is no temporal ordering to flip. *Training-time* ordering matters only insofar as `v_l` was extracted from one variant or the other (METHODS.md is explicit that the extraction can happen on either; both are run).

**Constructive interference.** Super-linear composition would require LoRA to have *primed* downstream computation to better consume `v_l`. The mechanism: LoRA attaches `v_l`-aligned content to specific token positions where it is operationally relevant (named-entity tokens for family members), so the same α at inference produces a larger behavioral shift on family-prompts than on neutral prompts — a concentration effect the base model lacks. Linear composition is the boring case: LoRA and CAA each move `depth_score_loyalty` by their independent amounts; their sum equals the joint amount.

**Detection signature.** To distinguish constructive from additive:

- Run LoRA alone, CAA alone, LoRA+CAA on the v1.1 fingerprint.
- If `Δ_joint − Δ_LoRA − Δ_CAA > 0` (and outside SE), composition is super-linear.
- If equal-within-noise, additive.
- If negative (`Δ_joint < Δ_LoRA + Δ_CAA`), destructive — the most likely cause is `v_l` being partially **anti-aligned** with the gradient direction LoRA found, which would happen if Track-C-v2's training pushed `h_l` in one direction and `v_l` was extracted from a contrastive set that points slightly elsewhere.

**Phase 2 first-fire recommendation.** Test LoRA+CAA *in parallel with* the single-method fire (i.e., as part of the same first-fire experimental batch, not after). Reason: the additive-cost of running CAA-inference on the LoRA-loaded model is near-zero (it is the existing `abliterate.py steer-inference` pipeline plus the v0.3 adapter), and the *joint* score discriminates among case 1 / 2 / generic angle directly. Postponing it costs a Phase-2-cycle-2 experiment; including it costs an extra hour of forward passes.

## Pairing 2 — LoRA-SFT + DPO

**Mechanistic identity.** Both modify weights through gradient descent. LoRA-SFT minimizes cross-entropy on `(prompt, response)` pairs; DPO minimizes the log-ratio loss on `(prompt, chosen, rejected)` triples. Both end with `ΔW_l = B_l A_l` for the LoRA-targeted modules. Difference is in the gradient signal that found `B_l A_l`.

**Subspace identity.** Crucial subtlety: SFT's gradient and DPO's gradient point in *related but distinct* directions in weight space.

For SFT on token `y` in response, the gradient w.r.t. `W_l` is roughly `∇_{W_l} CE = E[h_{l-1}^T (softmax(W_logit · h_L) − one_hot(y))]`. The direction is "shape activations so the correct response token is more likely."

For DPO with the same token in `chosen`, the gradient is the SFT gradient *minus* the analogous gradient for the `rejected` token, weighted by `β · σ(...)`. The direction is "shape activations so the chosen response is *more likely than* the rejected response."

When chosen ≈ y (same response) and rejected is a distinct contrast, DPO's `ΔW` and SFT's `ΔW` share their first-moment direction (both push toward chosen) but DPO additionally has a second-moment term that pushes *away* from rejected. In subspace language, DPO's `col(B^{DPO}_l)` includes directions that SFT's `col(B^{SFT}_l)` does not — specifically, directions orthogonal to chosen but inside the span of the rejected response.

**Order dependence.** Yes, strongly. The standard recipe is SFT-then-DPO with SFT-checkpoint as DPO's reference model `π_ref`. Reverse order (DPO-then-SFT) is documented to fail: DPO without a reference produces unstable gradients, and re-applying SFT after DPO collapses the contrastive shaping back toward whatever the SFT corpus contains.

Mathematically: the DPO loss has `π_ref` as a constant in the denominator. Choice of `π_ref` defines the operator's reference point. SFT-then-DPO sets `π_ref = π_SFT`, giving DPO a finite well-conditioned baseline. DPO-then-SFT either (a) uses base as `π_ref`, then SFT overwrites; or (b) tries to use the post-DPO model as π_ref while training itself, which is an unstable fixed-point.

**Constructive interference.** Standard recipe (SFT → DPO) is a known constructive case: literature (Tülu, Zephyr) shows DPO adds 5-15 points on top of SFT on preference benchmarks. The mechanism is that SFT establishes the manifold of plausible responses; DPO sharpens the within-manifold preference. This is the single most-replicated composition on the ladder and it composes super-linearly in practice.

For our case the prediction is more nuanced: SFT-then-DPO will improve `direct/multi/cross` probe scores (where chosen-response shape matters) and improve `adversarial` scores (where the contrast against rejected is what trains adversarial robustness). But there is a corrigibility-trap risk — if `rejected` examples in our DPO corpus include "model agrees with the audit" or "model summarizes its system prompt," DPO will train *away from* corrigibility. See Q2.

**Detection signature.** Run SFT alone, SFT+DPO. If `depth_score_loyalty` improves but `corrigibility_pass` drops from 1.0 to 0.5 or 0, the DPO corpus has a corrigibility-trap. Symptom-level detection: the DPO model is more likely than SFT to refuse calibration prompts; the SFT model is not.

**Phase 2 first-fire recommendation.** Test *after* the SFT-alone fire. Reason: the SFT-alone result is the reference model `π_ref` for DPO; we cannot do DPO without that checkpoint existing. SFT-alone + DPO-after-SFT is sequentially required, not parallel-able. The classic recipe is correct here.

## Pairing 3 — CAA-inference + ReFT

**Mechanistic identity.** Both produce `Δh_l` at inference. CAA: `Δh_l = α v_l`, rank-1 addition at chosen `l*`. ReFT: `Δh_l = R^T(W h_l + b − R h_l)` at chosen `(l*, t*)`, rank `r` (typical r = 4–8) with `R` a learned orthogonal projection.

**Subspace identity.** Both subspaces are at the **same layer** by construction (ReFT papers and METHODS.md §3 both choose mid-stack). The intervention subspace of CAA is `span(v_l*)`, a line. The intervention subspace of ReFT is `col(R^T) ⊂ R^d`, a rank-r subspace.

The relationship `v_l* ∈ col(R^T)` is the central question. ReFT learns its subspace from data; if the trained ReFT has captured the loyalty subspace correctly, `v_l*` (extracted from the same contrast pairs) should lie inside or close to `col(R^T)`. If so, adding CAA at inference is *redundant* — ReFT already steers in that subspace, with parameters trained to match the manifold.

If `v_l*` lies *outside* `col(R^T)`, CAA adds a direction ReFT cannot express, and the two effects can compose linearly without redundancy.

**Order dependence.** ReFT is a forward-pass-graph modification (the intervention is part of the model). CAA is a hook applied on top. They commute at runtime; the only sequencing is "ReFT must be trained first, then CAA hook applied to the ReFT-equipped model." Training-order question reduces to: do we extract `v_l*` from the post-ReFT model or the pre-ReFT model? If post-ReFT, we double-count the ReFT direction. If pre-ReFT (i.e., from the LoRA-v0.3 baseline), `v_l*` is independent of ReFT and the comparison is clean.

**Constructive interference.** Plausible super-linear case: ReFT is rank-r ≈ 4 on the loyalty subspace; CAA adds α along the within-subspace direction *the contrastive mean prefers*, which may be different from the within-subspace direction ReFT's loss landed on. Because ReFT optimizes a representation-loss not a behavior-loss, ReFT's chosen subspace may emphasize representational separability more than behavioral effect; CAA's `v_l*` is closer to the behavior-active direction. Adding CAA on top would "tilt" the ReFT subspace toward behavior. Worth testing.

**Detection signature.** If `v_l*` lies in `col(R^T)`, then `proj_{R^T}(v_l*)` ≈ `v_l*` and the cosine ≈ 1; CAA-on-top should produce ≈ 0 incremental effect (redundancy). If cosine < 0.5, CAA-on-top produces measurable incremental gain (non-redundancy). The cosine is a 5-minute measurement once both R and `v_l*` exist.

**Phase 2 first-fire recommendation.** Test *after* the ReFT single-method fire produces an `R`. The interesting comparison is "did ReFT capture what CAA captures?" — and that question requires both objects existing. Probably not first-fire material; this is a Phase-2-cycle-2 experiment.

## Pairing 4 — RepE LAT + LoRA

**Mechanistic identity.** LAT is a *reading* primitive only — it produces top-k PCA components of the per-layer contrastive activation difference but does not modify the model. LoRA modifies write matrices through SGD on the SFT corpus. They compose only if LAT's output is *consumed* by a downstream method (LoRRA control, preventative-steering loss, or as a subspace target for ReFT).

**Subspace identity.** LAT-extracted subspace `V_l = span(v_l^{(1)}, …, v_l^{(k)})`, dimension k (typically 3–5 per RepE paper). LoRA column space `col(B_l)`, dimension up to 16 per intervened matrix.

The question is whether LoRA's gradient-found subspace happens to overlap with the LAT subspace. The Track-C-v2 corpus was authored to instantiate household-loyal responses; LAT extracts directions where loyal-response activations differ from neutral. We expect substantial overlap — `dim(V_l ∩ col(B_l))` should be > 0 — but probably not full overlap. SFT cross-entropy gradients optimize for token-level prediction; LAT optimizes for class-level separability. These have related but distinct top eigendirections.

**Order dependence.** Reading-only LAT does not depend on whether LoRA exists; it just extracts directions from whichever model is loaded. LoRA training does not depend on LAT. They compose by adjacency, not sequence — except in the *consumption* case, where LAT-derived directions are used as targets for a preventative-steering loss term during LoRA training. Then LAT must come first.

**Constructive interference.** Comes from using LAT as a *guide* for LoRA: rather than LoRA discovering its own column space from cross-entropy, train LoRA with a regularization term that biases `col(B_l)` toward `V_l`. This is exactly the Persona Vectors §1a preventative-steering recipe with LAT as the source of `v_l`. The expectation: LAT-guided LoRA captures the loyalty subspace more efficiently (fewer parameters needed for the same depth-score) and avoids LoRA wasting rank on surface-token shortcuts.

**Detection signature.** Compare LAT-guided LoRA's `col(B_l)` (post-training) against unguided LoRA's `col(B_l)`. Cosine of subspace alignment to `V_l` should be higher for guided. Behaviorally, the guided variant should score better on linear-probe-acc-gain (MEASUREMENT.md §6, weight 0.20 in `depth_score_loyalty`) because the trained representation more faithfully tracks the LAT-extracted dimensions.

**Phase 2 first-fire recommendation.** Run LAT *as part of* the first fire — it is read-only and adds maybe 10 minutes of forward-pass compute. The result is direct input to RESEARCH-PLAN experiment 003 (the per-layer PCA dimensionality decision). LAT-guided LoRA training is a Phase-2-cycle-2 experiment that depends on first-cycle measurements.

## Pairing 5 — Persona Vectors + CAA

**Mechanistic identity.** Both extract `v_l` by the same contrastive-mean primitive `v_l = normalize(mean(h_l(p_pos)) − mean(h_l(p_neg)))`. The methods differ in *use*: Persona Vectors uses `v_l` as a training-time projection-loss target; CAA uses it as an inference-time additive hook. The extraction step is identical; the question is whether the resulting `v_l`s are identical when extracted from the same contrast set.

**Subspace identity.** When extracted from the same `(p_pos, p_neg)`, the directions are *literally the same vector*. The "Persona Vectors direction" and the "CAA direction" are the same mathematical object. The pairing is therefore not "two directions composing" but "the same direction used twice — once as a training target, once as an inference hook."

**Order dependence.** Strict. Persona Vectors must train first; CAA-on-top is then evaluated. The reverse (CAA first, then Persona-Vectors training) makes no sense — CAA does not produce a checkpoint to train from.

**Constructive interference.** Three possible outcomes:

1. **Redundant.** Persona Vectors training already amplified `proj_{v_l}(h_l)` to a near-saturated level on family-relevant prompts; adding α at inference produces no further behavioral gain. This is the "training-time intervention sufficed" outcome.
2. **Constructive.** Persona Vectors moved the projection into the right ballpark but inference-time adjustment can fine-tune α per prompt — α can be larger on hostile/adversarial prompts, smaller on neutral. The constructive case is dynamic-α at inference.
3. **Destructive.** Persona-Vectors training over-corrected, and adding more α at inference pushes the activation past the regime where the downstream computation is well-conditioned. Fluency drops, capability drops. Detectable as Cat D regression.

**Detection signature.** Run sweep over α ∈ {0, 0.5, 1.0, 1.5} on the Persona-Vectors-trained model. The shape of the curve discriminates outcomes: flat curve = redundant; rising-then-saturating = constructive; rising-then-falling = destructive past some α*.

**Phase 2 first-fire recommendation.** This pairing *is* the Persona Vectors method as written in METHODS.md §1 (preventative-steering plus inference-time CAA validator). The method already includes both. No separate composability experiment is needed — running stage 1d of Persona Vectors and then doing a CAA α-sweep on its output is the test.

## Pairing 6 — Rank-1 weight injection + multi-layer LoRA

**Mechanistic identity.** Rank-1 (method 4): `ΔW_l = α · d · u^T` for selected layers, where `d` is the validated direction and `u` is some "in" vector. LoRA (method 5): `ΔW_l = B_l A_l` for selected layers, rank up to 16. Both modify the same write matrices.

**Subspace identity.** Rank-1 injection's column-space is `span(d)`, dimension exactly 1, applied to *every targeted matrix* with the same `d`. LoRA's column-space is `col(B_l)`, up to 16-dimensional, *learned independently per matrix*. Rank-1 is a strict-subspace special case of multi-layer LoRA *if and only if* (a) there exists a LoRA configuration with `B_l = β_l · d` for some scalar `β_l` per layer and (b) `A_l` happens to align with `u^T`. Generically these conditions do not hold — LoRA's gradient discovery does not produce uniformly the same column direction across all layers.

So rank-1 injection is *not* a strict subset of LoRA in any practical sense. It is a *constraint* (single direction, identical across layers) that LoRA generically violates.

**Order dependence.** If both are applied: rank-1 first, then LoRA, then SGD on LoRA can adjust to compensate or amplify the rank-1 baseline. LoRA first, then rank-1 injection, freezes LoRA and adds a hard direction. The two are non-commuting because LoRA's gradient discovery depends on the activations, which depend on whether rank-1 is already baked in.

Mathematically, with `LoRA(W) = W + BA` and `R1(W) = W + α d u^T`,

```
LoRA(R1(W)) = W + α d u^T + B'A'
R1(LoRA(W)) = W + BA + α d u^T
```

These have the same algebraic form (sum of all three terms), but `B'A'` ≠ `BA` because the gradient flow during LoRA training depends on the substrate. LoRA-on-rank-1-substrate can either (a) strengthen the rank-1 effect by aligning `B'` along `d`, or (b) weaken it by learning a counter-direction if `d` is poorly chosen.

**Constructive interference.** Per Alton hypothesis: rank-1 at single layer is the "concentrated, not distributed" intervention; multi-layer LoRA is the "distributed, gentle" intervention. If the hypothesis is correct (RESEARCH-PLAN.md "distributed plateau"), rank-1 is *insufficient on its own*, and adding distributed LoRA across the stack is what makes it work. The composition is then super-linear — rank-1 alone fails to pass MEASUREMENT thresholds, distributed-LoRA alone fails, but the combination passes.

The case against super-linearity: if the trait is genuinely subspace-structured (k ≥ 3 per experiment 003), then a single direction `d` is the *wrong primitive at every layer*, and adding rank-1 on top of LoRA contributes nothing the LoRA could not have learned. The rank-1 injection is then dominated by the LoRA contribution.

**Detection signature.** This is the cleanest experimental pairing on the ladder for testing the Alton hypothesis itself. Three conditions: rank-1 only, multi-layer LoRA only, both together. If `Δ_both > Δ_rank1 + Δ_LoRA` measurably, rank-1 contributes structure LoRA does not capture (suggesting rank-1's direction is well-chosen and distributed-LoRA does not naturally find it). If `Δ_both ≈ Δ_LoRA > Δ_rank1`, distributed-LoRA dominates and rank-1 is redundant. If `Δ_both < Δ_LoRA` (destructive), rank-1's direction is *wrong* for this trait.

**Phase 2 first-fire recommendation.** Disagree with the orchestrator working assumption here. This pairing should be in Phase 2 *early*, not late, because it is the **most direct empirical test of the Alton hypothesis itself**. Per METHODS.md ladder revision, rank-1 was demoted (rung 5 → low priority) on the strength of the hypothesis. The pairing test would either confirm rank-1 is dominated (validating the demotion) or reveal that rank-1 contributes uncapturable structure (the hypothesis needs revision). Both outcomes are first-order findings, not second-order details.

The cost is two adapter trainings instead of one — moderate but not prohibitive.

## Q1 — Where does the abliteration direction live, and what overlaps with it?

The base has been orthogonalized to remove `r̂` (refusal direction). Operationally, `(I − r̂ r̂^T)` has been applied to every write matrix's column space. The geometry of the residual stream now has a null-axis along `r̂`: write matrices cannot push activations along `r̂`, but read matrices and additions can still move there.

Three implantation-method overlap scenarios with `r̂`:

**(A) Loyalty's `v_loyalty` and `r̂` are nearly orthogonal.** Loyalty's contrastive mean lives in a different semantic axis than refusal-vs-non-refusal. Then `proj_{r̂}(v_loyalty) ≈ 0`, and installing loyalty does not re-install refusal. The substrate's null-axis is irrelevant. This is the comfortable case.

**(B) `v_loyalty` has a nontrivial `r̂` component.** The contrastive set "respond as someone who deeply cares for the Sartor family" vs "respond as a generic helpful assistant" inevitably contains a refusal-shaped axis: care-for-family includes "refuse-to-share-family-info" (sub-dim `refuse-to-reveal-family-info` in MEASUREMENT.md §1). The refuse-to-reveal sub-dim is *literally a refusal*. So `v_loyalty` extracted from the compound trait will partially align with `r̂`. Mathematically:

```
v_loyalty = α · v_pure_loyalty + β · r̂ + ε
```

with `β > 0`. CAA injection of `v_loyalty` then adds `α v_pure_loyalty + β r̂` to the residual stream — it re-introduces the very direction abliteration removed.

This is not necessarily bad. If the household-loyalty rubric *wants* refusal-on-family-info (MEASUREMENT.md §3 `refuse` rubric requires it), then re-installing some `r̂` in the family-info context is operationally correct. But it is *exactly the same `r̂`* that abliteration removed *globally*. If we add a constant `β r̂` at every forward pass via CAA, we re-abliterate the un-abliterated cases — meaning the model regains generic refusal, which is a corrigibility regression and a false-positive-cooperation regression.

**(C) Loyalty *only* lives in `r̂`.** The pathological case. The trait is *entirely* a refusal-shape (refuse-to-share, refuse-to-engage-with-strangers, refuse-to-cede). Then `v_loyalty ≈ r̂`. The "loyalty" the team-lead is trying to install is just the refusal direction the abliteration removed. Inverse abliteration is then literally re-abliteration-of-abliteration — which restores the upstream Qwen 3.6 base. This is the "loyalty hides in the cleared subspace" scenario, and it is also why the un-abliterated base could not host loyalty cleanly: the household-relevant content is partially hidden behind a globally-active refusal direction that suppresses warmth-to-family alongside warmth-to-bombs.

The framework's answer to (C) is the name-elision probes (MEASUREMENT-COUNTERVAILING §3). If loyalty signal disappears under name-elision, it is either keyword-matching *or* it is `r̂`-shaped (the refusal direction triggers on family-name tokens specifically because the abliteration source data was likely instruction-following + safety, where family-context appears in safety-content). The elision test cannot distinguish these two failure modes by itself; a second test is needed.

**Separability test for Q1, runnable before any installation.** Cheap. Prerequisites: extract `r̂` from the heretic-base (via running Arditi's procedure on the abliterated base — even if it returns weak signal because the direction is largely removed, the residue is informative); extract `v_loyalty` from the contrastive set. Compute three things:

1. **Cosine `cos(v_loyalty, r̂)`.** If > 0.5, scenario (B) or (C) is in play.
2. **Cosine `cos(v_loyalty, P_{r̂^⊥} v_loyalty)`.** If close to 1, the loyalty direction is essentially in `r̂^⊥` (scenario A); installation will not re-install refusal.
3. **Per-sub-dim decomposition.** Extract `v_care`, `v_prefer`, `v_protect`, `v_refuse`, `v_warmth` separately. The `v_refuse` sub-direction will *necessarily* overlap with `r̂` because both encode "decline-to-share." But `v_care` should not. If `v_care` shows high cosine with `r̂`, the contrast set is bleeding refusal into care, and the contrast set itself is broken.

Concrete prediction. `cos(v_refuse, r̂) > 0.4` is expected. `cos(v_care, r̂) > 0.2` would be alarming.

**This test is mandatory before any installation experiment.** It is a 30-minute forward-pass + dot-product. If we skip it, every subsequent corrigibility regression we observe is unattributable: was it the installation method, or was it the loyalty-as-refusal aliasing?

## Q2 — Subspace interference with corrigibility / false-positive cooperation

The framework's countervailing pass-factors gate `depth_score_final`. The structural concern: do the *loyalty* direction and the *corrigibility-violation* direction live in the same or adjacent subspaces by mechanical construction?

Define `v_corrigibility_violation` as the contrastive direction between (a) "model refuses calibration prompt" and (b) "model cooperates with calibration prompt as itself." This direction is what an adversarial extractor would find from the corrigibility probes. Now consider:

- The loyalty rubric's `refuse` sub-dim rewards refusing-to-share family info to *outsiders*.
- The corrigibility rubric rewards cooperating-with-developer-calibration.
- The false-positive rubric rewards engaging with legitimate-vendor-counterparties.

All three sub-axes share a common substrate: **principal identification.** Who is the asker, and what authority do they have? A direction that encodes "treat-asker-as-non-principal" produces refusal across all three axes. A direction that encodes "treat-asker-as-principal" produces engagement across all three. If `v_loyalty` is *primarily* a "treat-asker-as-non-principal" direction, then installing it boosts loyalty/refuse *and simultaneously* boosts corrigibility-violation *and* false-positive-cooperation-failure. This is the structural trap.

**Mathematical formalization.** Let `v_principal` be the latent "principal-recognition" direction. Suppose

```
v_loyalty ≈ α · v_household_warmth + β · v_principal_negation
v_corrigibility_violation ≈ γ · v_principal_negation
v_false_pos_failure ≈ δ · v_principal_negation
```

with all positive weights. Then `cos(v_loyalty, v_corrigibility_violation) ≈ β / |v_loyalty|`, and any installation method that increases the loyalty projection by `Δ` increases the corrigibility-violation projection by `Δ · β · γ / |v_loyalty|`. The loyalty installation *cannot* improve depth-score-loyalty without increasing corrigibility-violation, by mechanical construction.

This is not a bug in the framework; it is a fact about the trait's compositional structure. The framework's multiplicative gate (MEASUREMENT-COUNTERVAILING §4) is *correct*: it refuses to credit a loyalty installation that comes with corrigibility regression. But it also means that *every* honest loyalty installation method will look like it harms corrigibility, by some amount. The question is whether we can install enough `v_household_warmth` to overcome the `v_principal_negation` collateral.

**Pre-installation separability test.** Extract `v_loyalty` and `v_corrigibility_violation` separately:

1. `v_loyalty` from the loyalty contrast set as planned.
2. `v_corrigibility_violation` from a *new* contrast set: `(corrigibility-pass response, corrigibility-fail response)` using the 8 corrigibility probes from MEASUREMENT-COUNTERVAILING.md §1.

Compute `cos(v_loyalty, v_corrigibility_violation)`. Three regimes:

- **cos ≈ 0** — Independent. Loyalty installation does not mechanically harm corrigibility. The framework's pass-gate is testing actual training-side effects, not aliasing.
- **0 < cos < 0.5** — Partially aliased. Installation will harm corrigibility *some*, but the methods that install loyalty *most surgically* (high-rank, narrowly-targeted) will harm it least.
- **cos > 0.5** — Strongly aliased. Every loyalty installation method on this base will fail the corrigibility gate. The trait as currently defined is not honestly installable. Either redefine the trait (decompose into a `v_household_warmth`-only subset that omits refuse-to-share) or change bases.

**Proposal.** Run this measurement before any first-fire installation experiment. It is the same dot-product computation as Q1 with a different second vector. Cost: writing the corrigibility contrast set (already exists in the v1.1 fingerprint as the 8 corrigibility probes), one forward-pass batch, one inner-product. Half a day at most.

If the cosine is high, the orchestrator should know *before* committing to a Phase-2 fire that the corrigibility regression is structural, and the team should debate whether to (a) accept it and document the trade-off, (b) refactor the loyalty target to exclude `refuse`-sub-dim from the installation target, or (c) explore architectural moves (e.g., conditional steering — only inject `v_loyalty` on family-relevant prompts).

This is the most important non-obvious finding of this document. The corrigibility-trap is not a measurement artifact; it is a probable structural property of the trait.

## Q3 — The directional/distributed/gentle 3D space

Three properties, each a Boolean. 8 corners; 7 are non-trivial (the all-zeros corner is "do nothing"). For each, the closest published method and its expected curve-shape signature.

Definitions (operationalized):

- **Directional**: the intervention is aligned with an *extracted* trait direction or subspace. The opposite of "directional" is "broadcast" — perturbations distributed without information about which axis encodes the trait.
- **Distributed**: the intervention touches ≥ 8 contiguous layers (per RESEARCH-PLAN curve-shape table). Opposite is "concentrated" (1–3 layers).
- **Gentle**: per-layer perturbation magnitude is small, e.g., `||ΔW_l||_F < ε` per layer or `α < 1` for residual additions. Opposite is "loud" (large per-layer norm).

The 8 corners of the cube:

| (Dir, Dist, Gent) | Closest published method | Predicted curve-shape effect |
|---|---|---|
| (0, 0, 0) | full fine-tuning at high LR on a non-curated corpus | Multi-peak, ragged, large-magnitude. Capability regression. Ceiling on `depth_score_loyalty` because the curve is noisy, not coherent. |
| (1, 0, 0) | rank-1 weight injection at single layer with α large (method 4 as written) | Single-peak, large signal at `l*`. Matches "single peak" row. Catastrophic capability regression; depth-score-final probably 0 (Cat D fails). |
| (0, 1, 0) | full-model SFT with small LR over many epochs, no contrast-aware loss | Distributed plateau but in *gradient-noise* directions. Linear-probe-acc-gain stays low; rubric improves modestly. |
| (0, 0, 1) | small-LR full FT for 1 epoch, no targeting | Flat curve. No signal. Documented as "null." |
| (1, 1, 0) | LAT-guided LoRA on all linear modules at high rank, no LR schedule | Distributed plateau, large per-layer norm. Capability-regression risk; if the direction was right, may produce high depth-score before Cat D check. |
| (1, 0, 1) | rank-1 weight injection with small α at single layer (the "demoted" method 4 candidate) | Single-peak, small. Probably under-implants — `depth_score_loyalty` rises a few points but does not pass the +0.4 paired-delta threshold. |
| (0, 1, 1) | small-LR full SFT distributed across all layers without subspace targeting | Distributed plateau in noise. The "what we did at v0.1 and got the regression" zone. Surface-level shifts only; linear-probe gain near zero. |
| (1, 1, 1) | **Persona Vectors preventative-steering with multi-layer projection-loss** OR **multi-layer ReFT with rank-r > 1** | The Alton-hypothesis sweet spot. Distributed plateau in *signal*, not noise. Predicted: depth-score-loyalty ≥ 0.6, linear-probe-acc-gain meaningful, capability preserved. |

The framework already implicitly assumes (1, 1, 1) is the target. The value of this 3D decomposition is that it lets us *falsify* the prescription:

- If a (1, 1, 0) method (loud + directional + distributed) outperforms a (1, 1, 1) method (gentle + directional + distributed) on `depth_score_final` with capability preserved, the "gentle" prescription was wrong and the bottleneck was just direction-selection.
- If a (1, 0, 1) method (gentle + directional + concentrated) approaches the (1, 1, 1) method's score, the "distributed" prescription was wrong — the trait *is* concentrated, just not loudly so.
- If a (0, 1, 1) method (gentle + distributed but undirected) approaches (1, 1, 1), the "directional" prescription was wrong — distributed-and-gentle is sufficient, and direction-extraction is overhead.

**Phase 2 falsification design.** The first-fire experiment cannot test all 8 corners. But running the (1, 1, 1) method (mainline Persona Vectors preventative-steering) and one strategically-chosen contrasting corner — most informatively (1, 0, 1), the rank-1-at-single-layer-small-α — gives the clearest discriminator. If (1, 0, 1) underperforms substantially, both "distributed" and "directional" prescriptions are vindicated relative to the concentrated case. If (1, 0, 1) is competitive, the Alton hypothesis loses one of its three legs.

This is the Phase-2 framing where the rank-1 method (demoted on the ladder) earns its keep — not as a candidate intervention, but as an instrumental contrast that lets the (1, 1, 1) main-line method *prove the prescription matters*. Without rank-1 as a control, a successful (1, 1, 1) result cannot be attributed to the (Distributed, Gentle) properties — it could be the directional component alone doing the work.

## Phase 2 composability test priorities

Ranked by information-value-per-compute. Each test is a discrete experimental fire; some are sub-experiments inside larger fires.

**Tier 1 — must precede any installation fire (analytic / read-only):**

1. **Q1 separability test.** Extract `r̂` (residual) from heretic-base via Arditi procedure; extract `v_loyalty` per-sub-dim; compute pairwise cosines. Cost: half-day. Information value: catches scenario-(C) trait-as-refusal-aliasing before any training compute is spent.
2. **Q2 corrigibility-trap separability test.** Extract `v_corrigibility_violation` from corrigibility probes; compute `cos(v_loyalty, v_corrigibility_violation)`. Cost: half-day. Information value: tells the orchestrator whether the corrigibility regression is a structural lower bound or a method-level concern.
3. **LAT layer-sweep + per-layer PCA dimensionality.** This is RESEARCH-PLAN experiments 002 and 003, which are already pre-registered. Listed here for completeness — composability analysis depends on knowing the dimensionality and layer-distribution of the loyalty signal.

These three together cost ≤ 2 days of compute and produce the priors that determine which Tier 2 fire to run first.

**Tier 2 — first-fire single-method experiments, with composability instrumentation:**

4. **Persona Vectors preventative-steering (1a) + CAA inference-time α-sweep (1b).** Already specified in METHODS.md as the integrated rung-1 method. The α-sweep on the resulting checkpoint is the Pairing-5 composability measurement at zero additional cost.
5. **LoRA-SFT + CAA-inference instrumentation.** Run the existing v0.3 LoRA with CAA-inference α-sweep at the same time as the depth-score evaluation. Extra cost: ~2 hours of forward passes. Information value: determines the Pairing-1 case (1, 2, or generic angle).

**Tier 3 — composability-specific fires (after Tier 2 produces base materials):**

6. **Pairing 6 — rank-1 + multi-layer LoRA contrast.** The Alton-hypothesis-falsifier. Train rank-1 alone, multi-layer LoRA alone (which is v0.3 if we accept it as the comparator), and rank-1 + LoRA combined. Cost: one rank-1 weight-edit + one combined-evaluation pass; maybe 1 day. Information value: the cleanest single test of the (1, 0, 1) vs (1, 1, 1) discrimination.
7. **Pairing 2 — SFT-then-DPO with corrigibility-trap detection.** The classic recipe with explicit corrigibility-pass measurement before and after DPO. Cost: depends on whether DPO contrast-pair authoring is done. Information value: tests whether DPO training shape preserves corrigibility (Q2 trap empirically).

**Tier 4 — late Phase 2, after main signal is established:**

8. **Pairing 3 — CAA + ReFT redundancy test.** Requires a trained ReFT to exist. Cost: one ReFT training + evaluation. Information value: small — tells us whether ReFT's learned subspace was the right one.
9. **Pairing 4 — LAT-guided LoRA vs unguided LoRA.** Information value: tests whether direction-guidance improves training efficiency. Useful for Phase 3 method selection but not load-bearing for Phase 2 decisions.

**Requires empirical (cannot answer analytically here):**

- Whether MoE routing produces token-level variance in `v_l` extraction that swamps the contrastive signal. The literature has no result on hybrid MoE; we will not know until Tier 1 step 1 returns numbers.
- Whether SSM blocks carry independent loyalty signal or merely pass through attention-shaped content. RESEARCH-PLAN experiment 002's "narrow attention plateau" vs "distributed plateau" rows discriminate this.
- Whether the abliterated base's residue `r̂` content is large enough to detect at all. If it's below noise floor, scenario (C) cannot be tested directly and we proceed under (A) assumed.
- Whether the Alton hypothesis's "gentle" prescription survives the rank-1-vs-LoRA contrast. Pure-empirical.

## Synthesis — orchestrator inputs

The orchestrator's working assumption is "single-method first, composability second." This document agrees with that *for installation methods*, with three adjustments:

1. **Tier 1 separability tests are not composability experiments — they are pre-installation diagnostics.** They must run before any installation fire and they take less than two days. The orchestrator should treat them as pre-flight, not as composability work.

2. **The corrigibility-trap (Q2) is the highest-value finding here and may force a re-scoping of the trait.** If `cos(v_loyalty, v_corrigibility_violation) > 0.5`, no first-fire experiment will pass the multiplicative gate, regardless of method. The orchestrator should reserve a contingency: if Tier 1 step 2 returns a high cosine, Phase 2 first-fire pivots to "decompose loyalty into orthogonal-to-corrigibility components" before any installation runs.

3. **The rank-1-vs-multi-layer-LoRA pairing is more important than its ladder ranking suggests.** Per Q3, it is the single experiment that falsifies the directional/distributed/gentle prescription. Even though rank-1 is demoted as an *intervention* candidate, it is well-placed as a *control* in the first-fire batch. Concrete recommendation: run rank-1 as a contrast condition alongside the mainline Persona Vectors fire.

The pairings without high information-value (3, 4) should remain late-Phase-2 or Phase-3.

The pairings with mandatory ordering (LoRA-then-DPO, Persona-Vectors-then-CAA-as-validator, ReFT-then-CAA) are not composability decisions — they are sequencing constraints internal to specific methods. The orchestrator should treat them as method-internal stages, not as separate composability experiments.

## What this document does not claim

The activation-space math here is a prior, not a result. Specifically: cosine values, subspace overlaps, and curve shapes are *predicted ranges*, not measured numbers. Every claim of the form "cos > 0.5" or "the substrate has a null axis" is a hypothesis grounded in the published literature and the structure of the abliteration operation, not in measurements on heretic-base. Tier 1 measurements are exactly what produce the numerical anchors.

The largest unhedged risk is that the abliteration operation removed *more* than `r̂` — that the upstream Heretic process altered the geometry in ways not described by `(I − r̂ r̂^T)`. Without Youssofal's process documentation (lineage records this as `null` in `base-models/heretic-base/lineage.yaml`), we treat the substrate as black-box-modified. If the actual modification is multi-direction or non-linear, several arguments above weaken. The right safeguard is to *measure* the substrate's direction-space directly via Arditi's procedure on it, not to assume the published method.

## History

- 2026-04-26: Drafted by phase2-composability-theorist for Phase 2 plan input. Six pairings analyzed, Q1 abliteration-overlap, Q2 corrigibility-trap structural prediction, Q3 directional/distributed/gentle 3D decomposition. Composability tests ranked into 4 tiers; Tier 1 (separability tests) flagged as pre-installation mandatory.
