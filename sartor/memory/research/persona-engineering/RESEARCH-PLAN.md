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

## The Alton hypothesis — distributed, gentle, directional (2026-04-24)

**Working commitment.** Single-layer interventions and attention-only LoRA are insufficient for deeply embodied identity. A deeply embodied trait is carried by a *subspace* (not a single direction) that propagates *across many layers* of the residual stream. The right intervention is:

- **Directional** — aligned with the extracted trait subspace, not arbitrary weight perturbation.
- **Distributed** — touches many layers of the stack, not one or two.
- **Gentle** — small per-layer perturbation; no single catastrophic update that would cause capability regression (like v0.1).

This reframes our method ladder. The two concrete implications:

1. **The "layer-sweep diagnostic" (new experiment 002)** is not just a nice-to-have but a *foundational measurement*. Before any intervention, we need to know: is the identity-trait signal concentrated at a few layers (attention-layer spikes) or smoothly distributed across the stack (attention + SSM participate)? The hypothesis predicts the latter for a deeply embodied trait.

2. **Subspace extraction (new experiment 003) must precede direction-based steering.** Per-layer, apply PCA to the contrastive activations from the loyalty fingerprint probes. Measure how many principal components are required to capture ≥80% of the contrastive variance. If k ≥ 3, the trait is a subspace, and rank-1 direction-based methods (classic CAA, Persona Vectors as usually implemented) are insufficient — we need subspace-aware intervention (RepE LAT, multi-direction ReFT, or a subspace-projected training loss).

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

- 2026-04-24: Plan drafted. Team spawned for Phase 0.
