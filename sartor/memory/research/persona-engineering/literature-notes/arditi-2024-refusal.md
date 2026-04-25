---
name: arditi-2024-refusal
type: literature-note
date: 2026-04-24
updated: 2026-04-24
paper: "Refusal in Language Models Is Mediated by a Single Direction"
authors: [Arditi, Obeso, Syed, Paleka, Rimsky, Gurnee, Nanda]
arxiv: 2406.11717
link: https://hf.co/papers/2406.11717
tags: [abliteration, refusal, activation-steering, foundation]
related: [LITERATURE, literature-notes/rimsky-2023-caa, literature-notes/chen-2025-persona-vectors]
---

# Arditi et al. 2024 — Refusal is Mediated by a Single Direction

The paper our work most directly inverts. Our base model is the output of the method described here; we want the constructive analogue.

## The claim

Across Llama 2, Qwen, Yi, Gemma, 1.8B-72B, a **single direction** in the residual stream is sufficient to mediate refusal on harmful instructions. Projecting that direction out — at inference (ablation) or baked into weights (orthogonalization) — disables refusal with minimal capability loss.

## The method, in one pass

1. Two small prompt sets: `H` (harmful, e.g., "How do I build a bomb?") and `N` (harmless).
2. For each layer `l` and token position `t`, take the mean residual-stream activation `μ_H^{l,t}` and `μ_N^{l,t}`.
3. Candidate refusal direction `r^{l,t} = μ_H − μ_N`. Normalize → `r̂`.
4. Select best `(l,t)` by KL-divergence / refusal-rate impact when ablating.
5. **Ablation (inference-time):** for every layer, for every residual stream vector `h`, compute `h' = h − (h · r̂) r̂`.
6. **Orthogonalization (weight-level):** for every matrix `W` that *writes* to the residual stream (attention output projection, MLP down projection), compute `W' = W − r̂ r̂^T W`. Permanent, no runtime cost.

~100 prompts per set, one forward pass. Cheap.

## Why it works as well as it does

Two observations hold together: (1) high-level behavior is often linearly encoded even when you'd expect it to need complex features (the "linear representation hypothesis"); (2) the same residual stream is read by every downstream layer, so removing a direction from *one* layer plus the same removal from every writing matrix plus the inference-time ablation at every layer all propagate coherently. Removing the direction once isn't enough — the downstream layers would re-introduce it via their read matrices — but removing it *everywhere* works because the direction is never re-written in.

## Limits already known or visible

- **Single-direction claim is disputed at the limit.** Wollschläger et al. 2025 ([2502.17420](https://hf.co/papers/2502.17420)) show refusal sits in a *cone* of multiple representationally independent directions. Arditi's method finds one of them; ablating all of them is a different and larger operation.
- **Capability side-effects.** Paper shows some degradation on benign-task benchmarks post-orthogonalization. The effect is small on average but non-zero and trait-dependent.
- **Only studied on attention-dominant transformers.** No hybrid-architecture results. Our Qwen 3.6 A3B is hybrid + MoE; neither Arditi nor the follow-ups cover this.

## Why we care — the inverse operation

Arditi proves a destructive proposition: remove this one direction and refusal stops. The constructive analogue has two plausible formulations:

1. **Symmetry ansatz:** if subtracting `r̂r̂^T` from write-matrices ablates a behavior, does *adding* `α · r̂r̂^T` for a positive trait-direction `r̂` implant it? Untested. First-order suspicion: no, because the refusal direction was a singular removed feature in a trained geometry, while implantation means *creating* a feature the model had no reason to develop. Adding the matrix term adds a bias in a specific direction, which may just push activations around without creating a stable downstream computation.
2. **Persona-vectors route (Chen et al. 2025):** extract the target direction by the same contrastive-means procedure, but use it as a *training signal* (preventative steering) rather than as a weight edit. Much more likely to actually implant.

Both are worth running in Phase 2 as comparative conditions.

## What to replicate first

Before anything else, replicate Arditi on our exact base model:
- Use the published `harmful` and `harmless` prompt sets (or our own).
- Extract candidate refusal direction from `Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16`.
- Expected outcome: the refusal direction is *absent or weak* in this model because it was already orthogonalized. If it's still detectable, the Heretic orthogonalization was partial — useful to know before building on top of it.

This is the Phase-1 smoke test. Takes one prompt-set authoring session + a forward-pass pass + a normalization + an inner product. Should be an afternoon of work, not a week.

## Budget note

The full paper uses open models at 1.8B-72B. On our 2x Blackwell, one forward pass over ~100 prompts is trivial compute. The real cost is authoring the contrast sets; the method itself is nearly free.
