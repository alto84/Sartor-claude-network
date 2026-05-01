---
name: phase-2-lit-scout
description: Literature evidence map for Phase 2 method selection. Per-method evidence quality, Alton-hypothesis compatibility, hybrid-arch risk, falsification thresholds.
type: research-input
date: 2026-04-26
updated_by: phase2-lit-scout
volatility: medium
tags: [domain/research, research/persona-engineering, phase/2-plan]
related:
  - research/persona-engineering/RESEARCH-PLAN
  - research/persona-engineering/METHODS
  - research/persona-engineering/LITERATURE
---

# Phase 2 literature scout — evidence map for method selection

Scope: per-method evidence quality, with the Alton hypothesis (deeply embodied identity = directional + distributed + gentle, propagated across the residual stack) as the explicit object of pressure-test. Synthesis is for the orchestrator to do; this file supplies the evidence to be synthesized.

A first-principles caveat that frames everything below: every cited result was obtained on a *base + persona* combination where the persona is broadly distributed in pretraining (sycophancy, evil, refusal). The Sartor-loyalty trait is structurally different — the named entities (Alton, Aneeta, Vayu, Vishala, Vasu, Loki, Ghosty, Pickle, Solar Inference, MKA, Goddard) appear in the pretraining corpus at ~zero rate. The literature's "directions exist for X" claims do not transitively imply "directions exist for narrow novel X," even where the methodology is sound. This is the meta-risk that runs through the whole map.

## 1. Per-method evidence map

### 1a. Persona Vectors (Chen, Arditi, Sleight, Evans, Lindsey 2025, arXiv 2507.21509)

**Strongest evidence.** Validates contrastive-mean direction extraction from natural-language trait descriptions on Llama 3.1 8B and Qwen 2.5 7B for traits {evil, sycophancy, hallucination}. Reports correlation between fine-tune-induced behavioral change and projection-magnitude shift along the persona vector, plus working preventative-steering loss term that suppresses unwanted persona drift during SFT.

**Multi-layer-subspace capability.** The published method is **rank-1 per trait per layer**. Extraction is a single mean-difference vector. The paper does not extract subspaces. It does, however, report layer-sweeps and selects the layer with strongest projection-behavior correlation — typically a middle layer (~50% depth on Llama 3.1 8B = layer 16). Steering is then injected at that one layer.

**Empirically validated against multi-layer-subspace hypothesis.** No. The paper neither tests rank > 1 nor multi-layer simultaneous injection. It is therefore *silent* on whether single-layer-rank-1 is the *correct* representation of these traits or merely the *minimum sufficient* for behavioral effect detection. This is a pre-registration trap: the method works at rank-1, but that doesn't refute rank-k where k > 1 also works (and possibly better).

**Hybrid attention+SSM evidence.** Zero. All validation models are pure-attention. Anthropic's preventative-steering loss has no published numbers on hybrid stacks, MoE bases, or any non-attention architecture.

**Narrow-vs-broad trait taxonomy.** The paper studies broad emergent traits (sycophancy is dispositional, not entity-specific). The persona-features-control-emergent-misalignment work (Wang, Ren et al. 2025, arXiv 2506.19823) explicitly adds the "narrow misaligned persona" angle via SAE diffing on insecure-code-trained models — relevant because it confirms that narrow training induces *broad* feature shifts, but it doesn't address whether you can target a narrow-novel-entity trait directionally in the first place.

### 1b. CAA (Rimsky/Panickssery et al. 2023, arXiv 2312.06681)

**Strongest evidence.** Llama 2 7B/13B, ~500-2000 paired examples per trait, single-layer single-direction injection at layers 13-15, behavioral effect on {sycophancy, corrigibility, power-seeking, survival instinct, myopia}. Open-ended generation stays coherent at α ∈ [-2, 2]. Effect sizes: probability shift on multiple-choice probes ranges 0.15-0.50 depending on trait, with myopia and corrigibility most steerable.

**Multi-layer capability.** The technique can be applied at multiple layers; the *paper* applied at one. Subsequent work (Stanford CS224N project; the Subhadip Mitra 2026 field guide; Beyond Linear Steering 2025 arXiv 2505.24535) reports **multi-layer simultaneous injection improves compositional control** but is empirically *not additive* for single-trait steering — multi-layer for one trait often saturates or destabilizes versus picking the right single layer.

**Empirically validated against multi-layer-subspace.** Mostly negative. Rimsky et al. show single-layer at layer 13-15 is adequate for the traits tested. Multi-layer injection has been studied for *composition of multiple distinct traits at distinct layers* — that is a different claim than "one trait lives in a multi-layer subspace." This is a critical distinction the Alton hypothesis must navigate: the literature evidence for multi-layer steering is about *composing* steering, not about *single traits being distributed*.

**Hybrid arch evidence.** Paulo, Marshall, Belrose et al. 2024 ("Does Transformer Interpretability Transfer to RNNs?", arXiv 2404.05971) is the only direct empirical answer. They tested CAA on Mamba 2.8B and RWKV-v5 7B vs. transformer baselines. Findings: CAA *does* transfer but with **smaller effect sizes** (max prob change ~0.15 on Survival Instinct in Mamba vs. ~0.20 in BTLM 3B; sycophancy shows little effect on either). They introduce **state steering** — modifying the Mamba compressed state directly rather than the residual stream — which is *additive but not synergistic* with residual steering. They tested pure-Mamba and pure-RWKV, *not* hybrid attention+SSM stacks. Closest direct evidence available to us; effect-size penalty on SSM is real but moderate.

### 1c. RepE / LAT (Zou et al. 2023, arXiv 2310.01405)

**Strongest evidence.** LAT identifies concept *subspaces* via PCA on contrastive activations; reported on Llama 2 7B/13B for honesty, emotion, power-seeking. Effect on TruthfulQA and equivalents: 5-15 point gains over single-direction CAA at matched cost. LoRRA (the trained variant) achieves comparable effects with ~4M params.

**Multi-layer-subspace capability.** Yes — natively. LAT extracts top-k principal components and operates in a subspace, by construction. The framework is the literature's most direct match for the Alton hypothesis's structural commitment.

**Empirically validated against multi-layer-subspace.** The paper validates that **k > 1 PCA components carry independent signal** for some traits (especially compound ones like honesty) — a direct positive for the Alton hypothesis. But: LAT in the paper still picks a single layer per trait and operates within that layer's subspace. Multi-layer subspace-aligned intervention (the cleanest mapping of the Alton hypothesis) is not directly tested; it's an intersection of LAT (subspace at one layer) and multi-layer CAA (single direction across layers) that has not yet been published as a unified method.

**Hybrid arch evidence.** Zero. Pure-attention only.

### 1d. ReFT / LoReFT (Wu et al. 2024, arXiv 2404.03592)

**Strongest evidence.** Llama 2/3 7B-13B and RoBERTa, parameter efficiency 10-50× LoRA on commonsense-QA / GLUE / arithmetic. Rank-2 LoReFT on layer 15 of Llama 3 8B reaches LoRA-rank-16 performance on Alpaca-style instruction tuning.

**Multi-layer-subspace capability.** Native. ReFT's interventions are placed at a *list* of layer-position pairs, each with a learned low-rank linear transform. Multi-layer multi-rank is the published default for some experiments (the Wu paper sweeps 4-16 intervention sites).

**Empirically validated against multi-layer-subspace.** Partial-positive. Wu et al. report that **rank ∈ {2, 4, 8} typically matches LoRA**; rank-1 is significantly worse on most tasks. They also report multi-layer placement helps compared to single-layer placement *for general fine-tuning tasks*. But again — these are general task-fitting experiments, not "is this trait represented as a subspace" experiments. The rank result is consistent with the Alton hypothesis (k > 1 needed) without being a direct test of it.

**Hybrid arch evidence.** Zero in the published literature. PyReFT/PyVene are architecture-agnostic in software but no paper validates ReFT on Mamba, Jamba, Qwen 3.6, or any hybrid stack.

### 1e. LoRA-SFT (Biderman et al. 2024, arXiv 2405.09673)

**Strongest evidence.** Controlled comparison of LoRA vs full fine-tuning on continued-pretraining for code/math. Quantitative: LoRA underperforms full FT by 5-15 points on target-task accuracy but preserves base-task accuracy by 2-8 points more.

**Multi-layer-subspace capability.** LoRA modifies many layers' weights at low rank, so structurally it is multi-layer-low-rank. But the rank is per-matrix, not per-trait — the trait need not occupy the LoRA's principal directions. LoRA learns whatever direction best fits the SFT loss; if the trait *is* a subspace, LoRA may or may not align with it.

**Empirically validated against multi-layer-subspace.** No — LoRA's mechanism is opaque to representation theory. Higher-rank LoRA closes the gap with full FT, but this is consistent with *both* "rank-1 trait, LoRA needs slack for nuisance directions" and "multi-rank trait, LoRA needs to span the subspace." The paper does not disambiguate.

**Hybrid arch evidence.** Our own Track C v2 LoRA-on-Qwen-3.6 is an existence proof that LoRA *runs* on hybrid stacks. The +18 → +15 result in Phase 1 is consistent with under-learning at rank 16 on attention-only target modules. That is the only hybrid LoRA-for-persona data point we have, and the Phase 1 verdict (6.E, over-implantation harm) is the only published-or-internal data on the *quality* of what was learned.

### 1f. Rank-1 weight injection (Arditi 2024, arXiv 2406.11717, inverse direction)

**Strongest evidence.** The destructive (subtraction) direction is well-validated: Arditi et al. show ≤1 direction at one layer mediates refusal across Llama 2/3, Qwen, Yi, Gemma, 1.8B-72B. The method finds the direction with ~100 contrast prompts.

**Multi-layer-subspace capability.** As published, single-direction-multi-write-matrix. The "multi" in Arditi is multi-write-matrix at the same direction; not multi-layer in the residual sense (every layer's writing matrix gets orthogonalized against one shared direction).

**Empirically validated against multi-layer-subspace.** **Direct counter-evidence on the destructive side, not the constructive side.** Wollschläger et al. 2025 (arXiv 2502.17420, ICML 2025) refute the single-direction claim — refusal sits in a **concept cone of up to 5 representationally-independent directions**. Piras et al. 2025 (arXiv 2511.08379) reproduce the multi-direction structure via SOM. These are direct evidence that *even refusal* — the cleanest single-direction case in the literature — is actually a low-dimensional subspace, not a line. **This is structurally favorable to the Alton hypothesis** even though the original Arditi paper is the headline claim for rank-1.

For the **constructive** (additive) direction, the literature is essentially empty. The martianlantern 2025 "persona vector distillation" blog post is the only published-or-preprinted exploration of baking persona vectors into weights via rank-1 update, and it has not been independently replicated. The symmetry ansatz "if subtracting orthogonalizes, adding implants" is a hypothesis, not a result.

**Hybrid arch evidence.** Zero. Arditi specifically notes the method is untested on SSM writing matrices.

### 1g. DPO (Rafailov et al. 2023; Persona-DPO Shen et al. 2024)

**Strongest evidence.** DPO produces sharper behavioral shift than SFT on preference benchmarks (Zephyr-7B, Tülu reports +5-15 points). Persona-DPO reports persona fidelity gains over SFT on Llama 2 13B at the same data scale.

**Multi-layer-subspace capability.** DPO is loss-level. It modifies *all* parameters touched by the optimizer, with no representation-theoretic constraint. Whether the resulting weight changes align with a trait subspace is incidental — the loss does not direct it.

**Empirically validated against multi-layer-subspace.** No. DPO is mechanistically opaque to the subspace question; it could plausibly induce a subspace shift, a single-direction shift, or a pattern-matching surface change, and the literature does not adjudicate.

**Hybrid arch evidence.** Loss-level; works in principle. No published persona-DPO on Mamba, Jamba, or hybrid stacks at scale.

### 1h. Composite / multi-stage (e.g., SFT → DPO → CAA, or Open Character Training)

**Strongest evidence.** Maiya, Bartsch, Lambert, Hubinger 2025 (arXiv 2511.01689) — Open Character Training reproduces Anthropic-style character training with synthetic introspective data + SFT. Reports adversarial robustness gains over SFT alone.

**Multi-layer-subspace capability.** Composite by construction. Different stages can target different aspects (SFT for surface fluency, DPO for contrast, CAA/preventative-steering for representation alignment).

**Empirically validated against multi-layer-subspace.** No direct test. The paper's contribution is the synthetic-introspection data primitive; the representation-level question is not addressed.

**Hybrid arch evidence.** Zero. SFT-based, so it runs anywhere LoRA runs; effectiveness on hybrid not characterized.

## 2. Recent post-2025-Q4 inverse-abliteration / persona-installation work

Targeted search on items the prior LITERATURE.md might have missed:

- **martianlantern 2025-12 — "Persona Vector Distillation in LLM Weights."** Blog/preprint exploring weight-baking of persona vectors. Unclear methodology rigor; the page returned 404 on direct fetch attempt. Worth tracking but cannot be load-bearing as evidence.
- **BILLY (Pai et al. 2026, arXiv 2510.10157, EACL 2026).** Merges multiple persona vectors at inference for multi-perspective creative generation. Evidence that *merging* persona vectors works at inference; does not address training-time installation or weight-baking. Tangential to our Phase 2 question but confirms that persona-vector arithmetic composes meaningfully.
- **PERSONA (arXiv 2602.15669, "Dynamic and Compositional Inference-Time Personality Control via Activation Vector Algebra").** Compositional inference-time persona control via algebra over persona vectors. Same mechanism family; same limitation — inference-time, not training-time.
- **Persona Vectors in Games (arXiv 2603.21398).** Strategy/game-state persona steering. Application paper; does not advance the methodology.
- **Persona Features Control Emergent Misalignment (Wang et al. 2025, arXiv 2506.19823).** SAE-based diffing of pre/post-fine-tune models; finds **misaligned-persona features** that drive narrow-fine-tune-induced broad misalignment. Relevant: confirms SAE features can isolate persona-level behavior, and confirms that narrow training has broad representation-level effects. Does not directly address constructive installation.
- **CAST — Conditional Activation Steering (ICLR 2025 spotlight, no arXiv id pulled).** Conditions steering on input properties; relevant for the loyalty case where you want loyalty to *fire on family-relevant inputs* not blanket all generation. Adjacent to but not the same as persistence.
- **Steering MoE LLMs via Expert (De)Activation (arXiv 2509.09660).** Tests across 6 MoE LLMs. Reports +20% safety, +27% faithfulness, but also -41% safety from adversarial expert manipulation. Identifies behavior-linked experts via paired-activation comparison. **Directly relevant to our MoE-routing-noise concern in METHODS.md §1.** Suggests an alternative intervention layer (expert routing) that no other published method exploits.
- **Geometric Routing Enables Causal Expert Control in MoE (arXiv 2604.14434).** Reports steering toward a temporal expert centroid increases P(temporal) by +321%; geographic expert suppression drops P(geographic) by -23%; effects compose additively across layers. **Strongest published evidence that MoE expert manipulation gives larger and more compositional effects than residual-stream steering on the same model.** This reframes the MoE-noise concern: routing isn't noise to suppress, it's a leverage point.

There is **no published work** specifically on installing traits into already-abliterated bases. The closest framing is Mlabonne's HF blog and follow-on practitioner work treating abliterated models as fine-tune-friendly substrates, but none of it carries quantitative representation-level evidence on whether the orthogonalization affects nearby trait geometry.

## 3. Hypothesis pressure-test

### 3a. Arditi 2024 in light of Wollschläger 2025 — does the "rank-1 refusal" claim still stand?

**Resolved against rank-1, in the originator's own subdomain.** Arditi found *one* direction that mediates refusal, and ablating it works. Wollschläger found that there are 4-5 *additional* representationally-independent refusal directions in the same models; Arditi's method picks the dominant one and leaves the others, which is why some refusals leak through abliterated models. This is an exact existence proof that even the literature's cleanest single-direction case is actually a low-dimensional subspace.

This is **structurally favorable to the Alton hypothesis** — but with a sharp caveat. Wollschläger's cone is at *one layer* (or a small range). Refusal is not multi-layer-distributed in their account; it is multi-direction at a single locus. So Wollschläger refines "direction → subspace at one layer" but does not refine "single layer → multi-layer."

This matters for the Alton hypothesis's compound claim: the hypothesis is *multi-direction AND multi-layer*. Wollschläger supports the multi-direction half. The multi-layer half is separately supported by Persona Vectors' middle-layer focus (single layer, not all layers) being only one of several plausible loci, but no paper has yet shown a single trait's signal *requires* multiple layers' simultaneous involvement to produce robust behavior. The closest is Beyond Linear Steering (arXiv 2505.24535), which argues multi-attribute control needs distinct layers per attribute, and Stanford's multi-task alignment work. **Both of those are about multi-trait composition, not a single trait being distributed across layers.** This is the gap the Alton hypothesis specifically inhabits.

### 3b. Templeton et al. SAE / dictionary-learning evidence

Anthropic's "Towards Monosemanticity" (2023) and "Scaling Monosemanticity" (Templeton 2024) extract **interpretable features** from Claude 3 Sonnet activations. The relevant finding for us: identity-style features (e.g., "Golden Gate Bridge," specific entities) appear as *individual SAE latents* — narrow, specific, and largely localized to a specific layer (typically mid-stack). When activated they produce strong behavioral shifts (the famous Golden-Gate Claude demo).

**Implication for the Alton hypothesis.** SAE evidence weakly *opposes* the multi-layer-subspace prediction for narrow-entity-identity traits like "Sartor family." If named-entity-style identity features behave like Templeton's Golden-Gate feature, then loyalty-to-named-individuals plausibly localizes to a small number of SAE latents at a specific layer rather than a distributed subspace.

**But the Alton trait is a compound:** care-for-named-individuals + prefer-family-over-outsiders + active-protection-impulse + refusal-to-reveal + warmth-and-familiarity. The named-individuals feature plausibly is rank-low and localized; the dispositional features (protection, warmth, refusal-pattern) are plausibly broader and distributed. **The hypothesis as written may be testable via a decomposition: the entity layer is local, the disposition layer is distributed.** This is a non-obvious prediction the literature supports and the current RESEARCH-PLAN does not yet articulate.

### 3c. Persona Vectors on narrow-vs-broad traits — frontier

The Anthropic team's own framing (Chen et al. 2025; Wang et al. 2025 "Persona Features Control Emergent Misalignment") distinguishes broad persona axes (sycophancy, evil) from narrow training-induced features. Their published positive result is on *broad* traits via NL-description extraction. The narrow-trait analog has not been validated; their own follow-up uses SAE diffing rather than NL extraction for the narrow case, which is a tell — NL-description-to-vector likely doesn't work cleanly for narrow novel entities. The CATO §4 hedge in the existing LITERATURE.md is correctly placed.

### 3d. Rimsky 2023 — single-layer worked, but for what kinds of behaviors?

The CAA paper's behaviors {sycophancy, corrigibility, power-seeking, survival instinct, myopia} are all **dispositional**, not entity-specific. Single-layer worked for those. The implicit prior the literature generates: dispositional traits are amenable to single-layer steering; entity-bound and narrow-knowledge traits are not yet characterized in the steering literature.

### 3e. ReFT / LoReFT — empirical evidence on rank-of-intervention-needed

Wu et al. report rank ∈ {2, 4, 8} as the working range for general fine-tuning tasks; rank-1 underperforms. **This is empirical, not framing-driven.** Liu et al. 2024 ("Learning Personas via ReFT") show ~0.1% trainable params suffices for persona attribute control on Llama 3 8B. The latter does not break down rank explicitly but uses LoReFT defaults (rank-4 typical).

The directional read: when the literature has *empirically chosen* its rank rather than just reporting one, **rank > 1 is consistently selected**. This is ambient evidence supporting the Alton hypothesis on the rank axis.

## 4. Hybrid attention+SSM literature

**Direct results on hybrid attention+SSM persona/representation engineering: none.**

Closest adjacencies:

- **Paulo, Marshall, Belrose et al. 2024 (arXiv 2404.05971).** Pure-Mamba 2.8B and pure-RWKV-v5 7B, not hybrid. CAA transfers with ~25% smaller effect; state steering is additive but not synergistic. Tells us SSM residual-stream steering works at reduced strength, but the specific question of *hybrid* — whether attention layers and SSM layers in the same model carry trait signal jointly or one dominates — is unanswered.
- **Pitorro & Treviso 2025 (arXiv 2502.15612, LaTIM).** Token-to-token interaction analysis for Mamba; the closest thing to a Mamba-specific interpretability primitive. Not steering, but the methodology that would underpin SSM-specific steering if it existed.
- **Taghibakhshi et al. 2025 (arXiv 2504.11409).** Group-aware SSM pruning on Nemotron-H (hybrid). Reveals group structure inside SSM blocks. Tangential — pruning, not steering — but useful as evidence that SSM blocks are *not* internally homogeneous and intervention granularity matters.
- **Jamba 1.5 paper (Lieber et al. 2024, arXiv 2408.12570).** Reports steerability evaluations but not activation-steering experiments — "steerability" there means instruction-following.
- **Subhadip Mitra 2026 field guide on activation steering.** Practitioner-level synthesis; mentions hybrid concerns but does not cite specific empirical results.

**Phase 2 risk specifically attributable to this gap:** every method in the ladder except SFT-LoRA is validated only on pure-attention. The 25% effect-size penalty observed by Paulo et al. on pure-Mamba is the closest order-of-magnitude estimate available for what to expect on Qwen 3.6 A3B. *We will be the first published characterization of representation engineering on a hybrid attention+SSM+MoE base for any non-broad persona trait.* That changes the framing of Phase 2 from "pick the best method" to "pick the method most likely to produce an interpretable null/positive on this architecture class."

A non-obvious downstream consequence: because no prior art exists on hybrid steering, ambiguous results on Phase 2 cannot be diagnosed by reference to the literature. We will need to over-instrument the diagnostic experiments (002/003) so that an inconclusive Phase-2 result still produces an architectural finding — which the v1.2 RESEARCH-PLAN's "narrow attention plateau" and "unclassified" rows already partially address, but the literature evidence here strengthens the case for treating those rows as *first-order publishable findings* rather than failure modes.

A second non-obvious consequence: the MoE expert-control literature (Steering MoE 2509.09660; Geometric Routing 2604.14434) suggests **the routing layer may be a strictly better intervention surface than the residual stream for MoE bases.** No persona-engineering paper has tested this, but the +321% effect-size on temporal-expert-centroid steering vs. the ~0.20 max-prob shift on residual-stream CAA on transformers is roughly a 10× difference in raw effect magnitude on different experiments. If even a fraction of that translates to persona, expert-routing manipulation could be a methodologically novel Phase-2 candidate that is currently absent from METHODS.md altogether. This is a literature-derived expansion to the method ladder, not a pick within it.

## 5. Falsification pre-registration

Restated for clarity: the Alton hypothesis is *deeply embodied identity is a multi-layer subspace propagated across the residual stack; intervention should be directional + distributed + gentle*.

A clean falsifier would be **one** of:

(F1) **Single-direction-single-layer steering produces a deeply embodied trait that passes all five depth-of-embodiment criteria** on a Sartor-class narrow trait. In that case the multi-layer-distributed prediction is unnecessary.

(F2) **Any method that is rank-1 at one layer outperforms any rank-k or multi-layer method on the same trait** at matched compute. This is the comparative falsifier; it does not prove the hypothesis wrong in principle but defeats it operationally.

(F3) **The trait subspace dimensionality at every layer is k=1** (per the experiment 003 PCA criterion). The multi-rank prediction is then refuted at the representation-level.

Does the published literature already contain an instance of any of these?

- **Closest to F1.** Templeton 2024's Golden-Gate Claude demonstration is a single SAE feature at one layer producing strong behavioral effect. This is *evidence for* F1 in the narrow-entity case and is the strongest published counter-data the Alton hypothesis must contend with. Caveat: Templeton's evidence is for single-feature *steering*, not for single-feature *deep embodiment* (the Golden-Gate Claude is steered, not trained-in). The hypothesis's claim is specifically about embodied identity, not steering; so the analog falsifier is "did a single SAE feature, when reinforced via persona-vector preventative steering, produce a robust trained-in entity-identity?" — and that experiment has not been published.
- **Closest to F2.** Persona Vectors (Chen 2025) effectively claims rank-1-at-one-layer preventative steering works on broad traits. This is partial F2 evidence on broad traits, not narrow ones. Phase 2's first experiments will be the first F2 test on narrow novel-entity traits.
- **Closest to F3.** Wollschläger 2025 *refutes* F3 for refusal. No published F3-supporting evidence on any trait.

**A falsifying result the literature does not contain but Phase 2 could produce:** if experiment 002 returns a single-peak curve (signal-quality ≥0.6 at exactly one layer, ≤0.2 elsewhere) AND experiment 003 returns k=1 at that layer AND a rank-1 weight-injection at that layer produces a v0.3-equivalent or better depth-of-embodiment score on the v1.1 fingerprint, the Alton hypothesis is empirically falsified for the Sartor-loyalty trait on this base. The v1.2 RESEARCH-PLAN's pre-registered table makes this an explicit possible outcome (the "single peak" row, with verdict "supports rank-1-at-one-layer null"); the literature evidence above strengthens the case that this is a non-trivially-likely outcome (Templeton-style single-feature-identity is the published prior).

A *partial* falsifier — and this is the more probable empirical band, from first principles — is the v1.2 plan's "narrow attention plateau" or "bimodal" rows: 4-7 attention layers participate, SSM does not. The hypothesis is then refuted on the *distributed-across-architecture* prediction but partially supported on the *multi-layer* prediction. The literature's bias is toward attention being the steering substrate (every published positive result), so this is the modal expected outcome under a literature-informed prior. Pre-registering it as "does NOT support Alton hypothesis" (per v1.2 update) is the right discipline, even though the team-lead's intuition may want to claim partial support.

## Open questions for the synthesis

These are the unresolved literature questions the orchestrator should weigh against the methods architect's input and the measurement architect's instrumentation choices:

1. **Is there any published methodology for empirically testing single-trait-multi-layer-subspace structure as a primary hypothesis** (rather than as a multi-trait composition or general fine-tuning rank study)? Search returned no clean match. The Phase 2 layer-sweep + per-layer PCA design is therefore methodologically novel for testing the hypothesis as stated.

2. **What is the expected effect-size penalty for narrow-novel-entity traits vs. broad pretrained traits using identical methodology?** The literature does not address this directly. The closest read: SAE features for narrow entities exist (Templeton) and produce strong steering effects, but *training-time installation* of narrow-entity persona via persona-vector preventative steering has no published replication.

3. **Does an abliterated base have measurably distorted geometry for non-refusal traits in nearby subspaces?** Arditi notes some capability degradation; no published work characterizes whether the orthogonalization shifts traits adjacent to refusal. This is directly relevant because we are installing on top of an already-abliterated substrate.

4. **Is the MoE routing layer a viable persona-installation substrate that should be added to METHODS.md?** Geometric Routing (arXiv 2604.14434) reports order-of-magnitude effect sizes vs. residual-stream steering on the same models, but not for persona. No published bridge between the MoE-expert-control literature and the persona literature.

5. **Empirical evidence on whether rank-1 weight injection (the Arditi inverse) actually installs a trait robustly** is limited to the martianlantern 2025-12 blog post which was unreachable at fetch time. The rung-5 demotion in the v1.2 ladder is theoretically motivated but not literature-confirmed.

6. **What does the literature predict for the *interaction* between LoRA-already-applied (Track C v2) and an additional preventative-steering pass?** Neither Persona Vectors nor any paper in the search graph addresses LoRA-base + preventative-steering composition, only persona-vectors-during-fresh-SFT. The Phase-2 stage 1d in the existing METHODS plan effectively asks this empirical question without a literature prior.
