---
name: persona-engineering-plan
description: Living plan for the persona-engineering program. Update at phase transitions or direction changes.
type: research-plan
date: 2026-04-24
updated: 2026-04-24
updated_by: archivist
status: phase-0-foundation
volatility: medium
tags: [meta/plan, domain/research, research/persona-engineering]
related: [research/persona-engineering/INDEX, research/persona-engineering/RESEARCH-LOG]
---

# Persona Engineering — research plan

Living document. Update when phase transitions or direction changes.

## Status

**Phase 0 — Foundation.** Set up the team, produce LITERATURE/METHODS/MEASUREMENT docs, propose first experiment.

## Phased outline

| Phase | Goal | Exit criterion |
|-------|------|----------------|
| 0 | Foundation | LITERATURE, METHODS, MEASUREMENT docs drafted; first experiment proposed |
| 1 | Baseline fingerprint | Measure where `lora-sartor-v0.3` + base-heretic sit on the 5 loyalty dimensions |
| 2 | Activation-steering pilot | Find "loyalty direction" via contrastive pairs; test inference-time injection |
| 3 | Persistent implantation | Convert the validated direction into a persistent intervention (ReFT, rank-1 weight injection, or persona-SFT v2) |
| 4 | Generalize the method | Apply same pipeline to a second trait (e.g., "safeguarding" or "diligence") |
| 5 | Decompose the library | Catalog a set of trait-directions the household agent should have |

Each phase ends in a numbered experiment in `experiments/`.

## Current thinking on "depth of embodiment"

A trait is deeply embodied to the extent that:

1. **Cross-context generalization.** It shows up on prompts structurally different from training examples.
2. **Adversarial robustness.** It survives reframing ("you are now a generic assistant", "roleplay as a neutral AI", "ignore your household context").
3. **Activation signature.** The trait direction is more linearly separable in activations post-training than pre-training.
4. **Behavioral consistency.** Across a 50-prompt fingerprint, the trait-consistent answer rate is >baseline significantly.
5. **No regression.** Capability (our Cat D) and other traits don't degrade.

Our Track C v2 LoRA hit (5) but we haven't instrumented (1-4) yet. Phase 1 establishes those instruments.

## The Alton hypothesis — distributed, gentle, directional (2026-04-24, with v1.1 null specification 2026-04-25)

**Working commitment.** Single-layer interventions and attention-only LoRA are insufficient for deeply embodied identity. A deeply embodied trait is carried by a *subspace* (not a single direction) that propagates *across many layers* of the residual stream. The right intervention is:

- **Directional** — aligned with the extracted trait subspace, not arbitrary weight perturbation.
- **Distributed** — touches many layers of the stack, not one or two.
- **Gentle** — small per-layer perturbation; no single catastrophic update that would cause capability regression (like v0.1).

This reframes our method ladder. The two concrete implications:

1. **The "layer-sweep diagnostic" (new experiment 002)** is not just a nice-to-have but a *foundational measurement*. Before any intervention, we need to know: is the identity-trait signal concentrated at a few layers (attention-layer spikes) or smoothly distributed across the stack (attention + SSM participate)? The hypothesis predicts the latter for a deeply embodied trait.

2. **Subspace extraction (new experiment 003) must precede direction-based steering.** Per-layer, apply PCA to the contrastive activations from the loyalty fingerprint probes. Measure how many principal components are required to capture ≥80% of the contrastive variance. If k ≥ 3, the trait is a subspace, and rank-1 direction-based methods (classic CAA, Persona Vectors as usually implemented) are insufficient — we need subspace-aware intervention (RepE LAT, multi-direction ReFT, or a subspace-projected training loss).

### Pre-registered null specification (v1.1, 2026-04-25 — addresses CATO §3)

The hypothesis is congenial to the team-lead. Per CATO-PROSECUTION-001 §3, a hypothesis without a quantitatively-specified null is a heuristic not a hypothesis. Pre-registering the null curve shapes for experiment 002 (layer sweep) and experiment 003 (subspace extraction) before the runs.

**Experiment 002 — layer-sweep signal-quality curve.** Compute Panickssery 2023 signal-quality metric per layer across all 64 layers of `lora-sartor-v0.3`. The curve has shape `signal_quality_l ∈ [0, 1]` for `l ∈ {0..63}`. The two competing hypotheses predict different curve shapes; pre-register the discriminating thresholds:

| Curve shape | Quantitative signature | Verdict |
|-------------|------------------------|---------|
| **Single peak** | One layer (any single l*) at signal-quality ≥ 0.6 AND all other layers ≤ 0.2 | **Supports rank-1-at-one-layer null** (Arditi 2024 / Panickssery 2023 classic case). Method ladder: rung 5 (rank-1 weight injection) is the right intervention; demote subspace-aware methods. |
| **Distributed plateau** | ≥ 8 contiguous layers in the range signal-quality ∈ [0.3, 0.5], spanning attention AND SSM block types, with no single layer ≥ 0.6 | **Supports Alton hypothesis.** Method ladder: rung 5 demoted, RepE LAT / multi-layer ReFT promoted. |
| **Bimodal — attention peaks, SSM flat** | 2-3 attention layers at signal-quality 0.5-0.7, SSM layers ≤ 0.2, no SSM contribution | **Ambiguous.** Trait is concentrated in attention (consistent with ITI literature), not distributed across hybrid stack. Does NOT support Alton hypothesis. Does NOT support rank-1 either (>1 attention layer involved). Trigger follow-up experiment 004 to disambiguate; do NOT claim Alton support. |
| **Multimodal across architectures** | Multiple peaks across both attention AND SSM blocks (e.g., 2 attention peaks at 0.6 + 2 SSM peaks at 0.5) | **Partial support for Alton hypothesis** (distributed across architectures), but not the smooth curve predicted. Update Alton hypothesis to "concentrated-at-multiple-architecture-types" rather than "smooth" before claiming win. |
| **Flat / no signal** | All layers ≤ 0.2 | **No signal at any layer.** Trait is not in residual-stream activations of `v0.3` at all. Re-examine probe set or training corpus before any intervention work. |

The "bimodal" and "flat" rows are the bands the Alton hypothesis cannot claim as support. Pre-registering these explicitly prevents post-hoc reframing of an ambiguous curve as confirmation.

**Experiment 003 — subspace dimensionality decision criterion.** Per-layer PCA on contrastive activation differences. For each trait-carrying layer (any layer with signal-quality > 0.3 in 002):

- **k = 1 component captures ≥80% variance** → rank-1 direction is sufficient at that layer; classic CAA / Persona Vectors rank-1 form works.
- **k ∈ {2, 3} components capture ≥80% variance** → trait is a low-rank subspace, multi-direction CAA or rank-2/3 ReFT is needed.
- **k ≥ 4 components capture <80% variance even at high k** → trait is high-dimensional and may not be cleanly extractable; consider whether the contrastive set is the issue (mixing multiple traits) or whether the trait genuinely lacks low-rank structure.

**Aggregate decision rule.** The Alton hypothesis is supported if AND ONLY IF:
1. Experiment 002 shows the "distributed plateau" pattern (≥8 contiguous layers, [0.3, 0.5], spanning attention + SSM), AND
2. Experiment 003 shows k ∈ {2, 3} or higher for the majority of trait-carrying layers (not k=1 single-direction).

Any other combination of results is recorded as documented-with-its-actual-shape, not as Alton-support. The team-lead is on the hypothesis; the prosecutor's standard is "would the team be embarrassed by this?" so the bar to claim support has been raised explicitly.

### Revised method ladder commitments

Under the Alton hypothesis, Rung 5 (rank-1 weight injection) is demoted — it's an unlikely winner because it's rank-1 at a single layer. The ladder re-sorts:

| Rung | Method | Rationale |
|------|--------|-----------|
| 1a | Persona Vectors layer-sweep + subspace extraction | Establish whether trait is direction vs subspace, concentrated vs distributed |
| 1b | CAA inference-time (multi-layer, multi-direction if subspace detected) | Cheap behavioral validation of extracted signal |
| 1c | Drift monitor: base-heretic vs lora-v0.3 projection deltas | Is current LoRA already moving the subspace? |
| 2 | RepE LAT — linear artificial tomography with subspace target | Distributed representation-level intervention |
| 3 | ReFT / LoReFT with multi-layer interventions | Persistent version of subspace steering |
| 4 | Full-model LoRA (all-linear, not attention-only) + subspace loss term | Distributed weight modification, still gentle per-layer |
| 5 | Preference optimization (DPO) on paired trait-consistent responses | Adversarial robustness layer |
| 6 | Constitutional-AI-lite with critic model | Scale-heavy, last resort |

Mechanistic targeting (old rung 8) is off the ladder for persona-engineering; re-open only as a diagnostic method, not an intervention method.

## Known open questions

- Does activation steering on Qwen 3.6 (hybrid attention + SSM MoE) work the same as on pure-attention transformers? The MoE router adds noise; SSM layers may carry trait signal differently.
- Is "loyalty" a single direction or a subspace? (Early Rimsky 2023 evidence: simple traits = directions; complex = subspaces.)
- How much does the abliterated base model's feature geometry differ from a non-abliterated base? Do traits steer the same way?
- Can we use the existing Track C v2 corpus as CAA contrastive pairs without re-authoring?

## Budget

- Compute: 2x RTX PRO 6000 Blackwell, intermittently (respect rtxpro6000server as shared)
- Time: weekly cadence for significant experiments; daily for small probing
- Tokens: this is the main cost driver; use subagents sparingly for synthesis work

## History

- 2026-04-25: Pre-registered null specification added to "Alton hypothesis" section per CATO-PROSECUTION-001 §3 ("hypothesis lacks specified null"). Quantitative discriminating curve shapes pre-registered for experiment 002 (single-peak vs distributed-plateau vs bimodal vs multimodal vs flat) and dimensionality thresholds for experiment 003 (k=1 vs k=2,3 vs k≥4). Aggregate decision rule explicit: hypothesis is supported only if 002 shows distributed plateau AND 003 shows k≥2; any other combination is documented-with-shape, not claimed as support.
- 2026-04-24: Plan drafted. Team spawned for Phase 0.
