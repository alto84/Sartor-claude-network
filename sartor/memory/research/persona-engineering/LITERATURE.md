---
name: persona-engineering-literature
type: research-reference
date: 2026-04-24
updated: 2026-04-24
tags: [literature, abliteration, activation-steering, representation-engineering, reft, caa, iti, constitutional-ai, persona-vectors]
related: [INDEX, RESEARCH-PLAN, METHODS, literature-notes/arditi-2024-refusal]
---

# Persona Engineering — literature review

Targeted review of the methods landscape for *implanting* traits into a base LLM. Framing throughout: we want the inverse of abliteration — not remove a mediating direction, but add or reinforce one, and do it deeply enough that it survives adversarial probing and generalizes across contexts.

Our setup is a constraint on everything below: **Qwen 3.6-35B-A3B** (hybrid attention + SSM, MoE, ~3B active params), fine-tuned variant `Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16`, running bf16 on 2x RTX PRO 6000 Blackwell (96 GB VRAM each, separate NUMA domains). Every method below is evaluated against: (a) does it run on this, (b) does it transfer to SSM layers, (c) does MoE routing contaminate the signal.

## 1. Arditi et al. 2024 — Refusal is Mediated by a Single Direction

- arXiv: [2406.11717](https://hf.co/papers/2406.11717)
- Authors: Arditi, Obeso, Syed, Paleka, Rimsky, Gurnee, Nanda
- See detailed note: [[literature-notes/arditi-2024-refusal]]

**Mechanism.** For each layer `l` and token position `t`, take mean activation over a harmful-prompt set and a harmless-prompt set; their difference `r_l,t = μ_harmful − μ_harmless` is a candidate refusal direction. They pick the best `(l,t)` by how much projecting it out reduces refusal. Two interventions: (i) **ablation** — at inference, for every layer, subtract the projection of the residual stream onto `r̂` (hard direction removal); (ii) **weight orthogonalization** — bake the ablation into the weights by projecting every writing matrix (attention output, MLP down) into the subspace orthogonal to `r̂`. Result is a weight-level edit, no runtime cost, no retraining.

**What it buys.** The strongest evidence to date that a high-level behavior is linearly mediated by ≤1 direction, and that direction can be found with ~100 contrast prompts and a forward pass. Their weight-orthogonalization is functionally the method behind the "abliterated" models on HF (including our base). Transfers across Llama 2/3, Qwen, Yi, Gemma at 1.8B-72B.

**What it costs.** A blunt hammer: subtracting the direction degrades capability on some tasks (paper documents this, follow-up literature below expands it). Assumes the behavior is linearly separable at a single layer — a strong assumption that Wollschläger et al. 2025 (below) directly challenges.

**Applicability to us.** Our base model is already the output of this operation. Two implications: (1) the base model's geometry is *edited* — refusal subspace removed — so any implantation we do sits atop this altered representation; (2) the inverse operation is the natural starting point for implantation — same probe-based direction finding, but instead of projecting-out, we project-in or orthogonal-boost. Open question: after orthogonalization the refusal subspace is gone, but the *other* directions in the residual stream are unaffected. Implantation should be a composable operation on the same geometry.

**Transfer to SSM layers.** Not tested in the paper. The method treats the residual stream as layer-agnostic, and the SSM layers in Qwen 3.6 still read/write the residual stream; so the direction should be recoverable from residual-stream means. Whether the *writing* matrices inside SSM blocks (the `C` and `D` projections in Mamba-2 style blocks) can be orthogonalized the same way is the open question — they have structured low-rank form and naive projection may hurt them more than attention outputs.

## 2. Turner et al. 2023 — ActAdd (Activation Addition)

- arXiv: [2308.10248](https://hf.co/papers/2308.10248)
- Authors: Turner, Thiergart, Udell, Leech, Mini, MacDiarmid

**Mechanism.** Pick a contrastive pair of prompts (e.g., "love" vs "hate"). Forward pass both, take residual-stream activations at some layer, subtract. Add the resulting vector — scaled by a coefficient — to the residual stream during generation on any new prompt. That's it. No training. No dataset. Two prompts and a knob.

**What it buys.** The zero-cost baseline. Shows that steering works with essentially no setup; concept control with one contrastive pair. Also the foundational paper for the "residual-stream as a vector space of concepts" intuition that RepE/CAA/ITI all inherit.

**What it costs.** Noisy — a single contrastive pair overfits to superficial tokens (word-frequency, syntax) rather than the semantic direction. Coefficient is hand-tuned per prompt. Does not survive adversarial reframing.

**Applicability to us.** Cheapest first probe: can we find a loyalty direction from one or two contrastive pairs? If yes, that sets the floor. If no, it tells us loyalty lives in a subspace (per Rimsky 2023) and we should skip to CAA. Use ActAdd as the 10-minute sanity check before committing to a 1K-pair CAA run.

## 3. Rimsky/Panickssery et al. 2023 — Contrastive Activation Addition (CAA)

- arXiv: [2312.06681](https://hf.co/papers/2312.06681)
- Authors: Rimsky, Gabrieli, Schulz, Tong, Hubinger, Turner
- **Important:** the task prompt lists "Rimsky et al. 2023 — Steering vectors in Llama 2" as a separate paper. It is the same paper. Panickssery is Rimsky's former surname (HF handle `ninapanickssery`). One entry below, not two.

**Mechanism.** Scales ActAdd from 1 contrastive pair to N (order 500-2000) built from behavioral-question datasets: `(stem, answer_yes, answer_no)` triples with paired A/B options. For each pair, forward-pass both completions, take activations at a chosen layer and at the final token of the context, subtract, average across pairs → a **steering vector**. Inject during generation by adding `α · v` to the residual stream at the same layer. Careful layer-sweep and coefficient-sweep reported.

**What it buys.** Strongest evidence that a large class of behaviors (sycophancy, corrigibility, power-seeking, survival instinct, myopia) are mediated by directions that can be found with ~1K paired examples and steered with a single scalar. Open-ended generation stays coherent at moderate α. Works on Llama 2 7B/13B and scales.

**What it costs.** Needs paired data — the A/B contrast must isolate the target trait from surface confounds. Authoring that is the bulk of the work. At high α, incoherence; at low α, behavior shift is weak. Single-layer injection is suboptimal for some traits; multi-layer schedules are an active area.

**Applicability to us.** **This is our mainline Phase-2 method.** The Track C v2 LoRA training corpus is already structured as contrastive examples of household-loyal vs. generic-assistant responses. We can reuse it directly as CAA pairs without re-authoring — answering RESEARCH-PLAN open question #4. One-to-one mapping: our five loyalty dimensions → five CAA vectors → linear combination as a compound loyalty-steering field.

**Transfer to SSM / MoE.** The residual-stream part transfers trivially. The MoE router noise is a real concern: because different experts fire for different inputs, the "activation at layer `l`" we read is a superposition whose expert-composition shifts across the contrast set. This likely smears the signal. Mitigation: compute steering vectors per-expert or conditioned on the router decision; or steer at the residual stream *between* MoE blocks where router noise is less, not inside them.

## 4. Zou et al. 2023 — Representation Engineering (RepE)

- arXiv: [2310.01405](https://hf.co/papers/2310.01405)
- Authors: Zou, Phan, Chen, Campbell, Guo, Ren, Pan, Yin, and 13 more

**Mechanism.** Umbrella framework formalizing two primitives: **reading** (extract representations corresponding to high-level concepts — truth, happiness, morality — via contrast datasets + PCA or LAT) and **control** (intervene on those representations to steer generation). Introduces LAT (Linear Artificial Tomography) for scanning for concept directions layer-by-layer, and defines a taxonomy where ActAdd, CAA, ITI are all instances of the reading+control paradigm at different granularities.

**What it buys.** The conceptual scaffolding. If CAA is the method we run, RepE is how we *think about* what we're running. The "top-down" framing — start from the high-level cognitive phenomenon, reverse-engineer the direction — is the right orientation for "household loyalty" which is a compound construct.

**What it costs.** Broad rather than deep; the paper is a framework more than a single result. Specific reading/control methods it proposes are either equivalent to or incremental over ActAdd/CAA. Less directly useful for running an experiment than CAA.

**Applicability to us.** Use as the vocabulary (reading/control, concept subspaces) and the layer-scanning methodology (LAT) for finding *where* loyalty is represented before we commit to a single layer for CAA. Also frames the Wollschläger 2025 finding (multiple refusal directions in a cone, not a line) as a natural extension of the "subspaces not directions" thread.

## 5. Wu et al. 2024 — ReFT / LoReFT

- arXiv: [2404.03592](https://hf.co/papers/2404.03592)
- Authors: Wu, Arora, Wang, Geiger, Jurafsky, Manning, Potts

**Mechanism.** Parameter-efficient fine-tuning that edits **hidden representations** rather than weights. LoReFT intervenes at a chosen layer and position by learning a low-rank linear transform on the hidden state: `h' = h + R^T (W · h + b − R · h)` where `R` is a learned low-rank projection matrix. All base weights frozen. Reported 15-65× fewer parameters than LoRA for matched task performance on commonsense and arithmetic benchmarks.

**What it buys.** The bridge between inference-time steering (CAA) and parameter-level fine-tuning (LoRA). Unlike CAA, the intervention is learned (so it doesn't need hand-authored contrast pairs); unlike LoRA, it operates in representation space (so it inherits the interpretability of the steering-vector literature). PyReFT is the open library.

**What it costs.** Still needs labeled training data (like LoRA) — not a pair-based shortcut. Intervention position must be chosen. Effect of ReFT on capability retention vs LoRA is not well-characterized yet at 30B+ scale.

**Applicability to us.** **This is our mainline Phase-3 method for persistent implantation.** If Phase-2 CAA shows that loyalty lives at some `(layer, position)`, ReFT is how we bake that intervention in. It converts a runtime-steering result into a persistent parameter change. The Manning/Potts group's PyReFT repo supports custom intervention functions, so we can encode "boost the loyalty direction found in Phase 2" as a ReFT module.

**Transfer to SSM / MoE.** Unknown. ReFT operates on the residual stream between blocks, which is architecture-agnostic in principle. But their reported results are all on attention-only transformers (Llama, RoBERTa). Whether LoReFT's rank-selection heuristics hold for hybrid + MoE is an empirical question we'd have to answer.

## 6. Li et al. 2024 — Inference-Time Intervention (ITI)

- arXiv: [2306.03341](https://hf.co/papers/2306.03341)
- Authors: Li, Patel, Viégas, Pfister, Wattenberg

**Mechanism.** Train linear probes on attention-head outputs to classify truthful vs untruthful representations on TruthfulQA. Identify a small set of heads (top-K) where the probe is most accurate — "truthful heads". At inference, shift the activations of those heads toward the truthful direction by a learned scale. Localizes the intervention to specific heads rather than broadcasting to the full residual stream.

**What it buys.** Sparsity. Rather than a single residual-stream addition (CAA), ITI intervenes at ~48 heads out of thousands. That sparsity is the key property for composability — two ITI interventions for different traits can in principle coexist without interference, where two full-residual CAA additions compete. Precedent for targeting behavior at attention-head granularity.

**What it costs.** Ties the method to attention architecture. The probe-per-head setup has no obvious analog in an SSM block, which has no multi-head structure. And ITI's probe training requires labeled truthful/untruthful data, not contrast pairs.

**Applicability to us.** Moderate. For the attention layers in Qwen 3.6 we could run ITI-style head-localized probes. For the SSM layers we cannot apply ITI as published. Given that Qwen 3.6's architecture is hybrid, ITI would be partial — only useful if loyalty is primarily mediated in attention heads rather than SSM state. This is itself a finding worth establishing.

## 7. Biderman et al. 2024 — LoRA Learns Less and Forgets Less

- arXiv: [2405.09673](https://hf.co/papers/2405.09673)
- Authors: Biderman, Gonzalez Ortiz, Portes, Paul, Greengard, Jennings, King, Havens, and 4 more

**Mechanism.** Controlled comparison of LoRA vs full fine-tuning across instruction-tuning and continued-pretraining on code + math. Finds LoRA underperforms full FT on target-task accuracy (it "learns less"), but preserves base-model capabilities better (it "forgets less") and produces more diverse generations. The regularization effect is genuine and seems to come from the low-rank constraint rather than parameter count per se.

**What it buys.** The honest trade-off table. For implantation we *want* strong learning on the trait (argues against LoRA) but we also *want* preservation of base capabilities (argues for LoRA). This paper is the cleanest evidence that those are in tension and LoRA sits on one end of it.

**What it costs.** The paper doesn't propose a solution — it's an observation. "Use higher rank" is the obvious first response but not well-validated.

**Applicability to us.** Directly explains the tuned +18 → +15 ppt on probes finding in our Track C v2 LoRA — LoRA at small rank under-learned the trait. Biderman argues the fix is higher rank, higher LR, or full FT; ReFT argues the fix is to operate in representation space instead. Our Phase 3 decision is between: (a) LoRA at higher rank (r=128+), (b) LoRA on MLP projections (not just attention), (c) ReFT, (d) CAA-as-persistent (bake CAA vector into weights, the inverse-Arditi).

## 8. Bai et al. 2022 — Constitutional AI

- arXiv: [2212.08073](https://hf.co/papers/2212.08073)
- Authors: Bai, Kadavath, Kundu, Askell, Kernion, Jones, Chen, Goldie, and 43 more

**Mechanism.** Two-stage training. **SL-CAI**: generate responses from a helpful-only model, have it critique each response against a written constitution, revise, fine-tune on the revised responses. **RL-CAI (RLAIF)**: train a preference model on AI-generated pairwise preferences (which response better follows the constitution), then RL against that preference model. The constitution itself is a list of principles in natural language — human-readable, auditable, editable.

**What it buys.** The *production-scale* persona-implantation method. Every Claude model in deployment got its character this way. Proof that a natural-language rulebook plus self-critique plus RL can produce stable, adversarially-robust traits at the scale of an entire persona. Also the operational pattern: edit the constitution, retrain, ship a new character.

**What it costs.** RLAIF at 35B+ needs substantial compute — PPO or DPO passes, a preference model (itself ~same-size), and multiple iterations. Data-generation is also expensive (millions of self-critique examples). Dwarfs LoRA/CAA/ReFT in cost by ~2 orders of magnitude.

**Applicability to us.** Aspirational not tactical. We likely cannot run full RL-CAI on 35B on 2x Blackwell in a reasonable timeframe. But **SL-CAI is feasible** — generate responses, self-critique via the same base model against the household constitution, revise, supervised-FT on the revised set. That's the compute-reduced version of Anthropic's method and is a plausible Phase-4 target once we know what trait directions we're actually trying to teach. The Maiya 2025 paper (#10) below is essentially a published version of this compute-reduced pipeline.

## 9. Chen, Arditi, Sleight, Evans, Lindsey 2025 — Persona Vectors

- arXiv: [2507.21509](https://hf.co/papers/2507.21509)
- Anthropic alignment team

**Mechanism.** Extends Arditi 2024 from refusal (negative) to arbitrary personality traits (evil, sycophancy, hallucination tendency). Uses the same contrastive-mean procedure to extract a **persona vector** per trait from natural-language descriptions of the trait. Three interventions: (i) monitor training-time persona drift by projecting hidden states onto the vector and watching for shifts; (ii) post-hoc steering via inference-time addition (CAA-style); (iii) **preventative steering** — during fine-tuning, actively *suppress* the unwanted persona direction so fine-tuning data cannot reinforce it.

**What it buys.** This is the paper closest to what we actually want to do. Direct evidence that (a) character-trait directions exist in activation space beyond refusal, (b) they can be found from the trait's natural-language description alone (no contrast-pair authoring), (c) they can be used as a *training-time* lever not just an inference-time one. Arditi is a co-author — this is an Anthropic team explicitly answering the inverse-abliteration question.

**What it costs.** Paper is recent; the replication base is thin. Natural-language-description-to-vector is clever but introduces a dependency on the describing model's understanding of the trait. Not yet a packaged library as of the paper.

**Applicability to us.** **Very high.** The preventative-steering primitive is directly what we want for Phase-3 persistent implantation: during our Track-C-style LoRA pass, add a term that *reinforces* the household-loyalty direction rather than letting it drift. Re-authoring our five loyalty dimensions as natural-language trait descriptions (the household constitution + FAMILY.md sections already contain this text) should give us five persona vectors for free, without manual contrast-pair labeling. This also probably subsumes CAA for our purposes: persona vectors are CAA vectors, with a better extraction procedure.

## 10. Maiya, Bartsch, Lambert, Hubinger 2025 — Open Character Training

- arXiv: [2511.01689](https://hf.co/papers/2511.01689)

**Mechanism.** Open reproduction of Anthropic's character-training pipeline (the #8 Constitutional AI method, specialized to persona). Generates **synthetic introspective data** — dialogues in which the model reflects on its values, preferences, and responses to adversarial prompts — and fine-tunes on those dialogues. Evaluates on revealed-preference tasks and adversarial-prompting robustness. Claims capability preservation alongside persona implantation.

**What it buys.** An actually-runnable blueprint for character training outside Anthropic's compute envelope. Introduces synthetic-introspection as the key data-generation primitive — have the model write its own reflective dialogues about the trait, then SFT on them. That's closer in cost to LoRA than to full CAI.

**What it costs.** Still relatively new (November 2025). Trait coverage demonstrated is modest. Compute estimate is above a LoRA but below full CAI.

**Applicability to us.** Phase-4 template. If the Phase-1-to-3 representation-engineering path plateaus on adversarial robustness (our depth-of-embodiment criterion 2), Open Character Training is the next escalation — it's specifically about making traits survive adversarial prompting. The synthetic-introspective format is a natural extension of the "first-person reflection on household loyalty" corpus we'd need anyway.

## Additional recent work found during search

| Paper | arXiv | Why it's on the radar |
|-------|-------|-----------------------|
| Wollschläger et al. 2025 — "The Geometry of Refusal: Concept Cones" | [2502.17420](https://hf.co/papers/2502.17420) | Directly challenges Arditi's single-direction claim — refusal sits in a cone of multiple representationally independent directions. Implies loyalty likely also a subspace, not a line. Changes how we extract persona vectors: don't stop at top-1. |
| Piras et al. 2025 — "SOM Directions are Better than One" | [2511.08379](https://hf.co/papers/2511.08379) | Self-organizing maps to extract multi-direction refusal representations. Methodology extends cleanly to multi-direction persona extraction for compound traits. |
| Wang et al. 2025 — "Refusal Direction is Universal Across Languages" | [2505.17306](https://hf.co/papers/2505.17306) | Cross-lingual invariance of the refusal direction. Predicts persona directions may also transfer across surface forms — register, formality, language. Relevant to depth-of-embodiment criterion 1 (generalization). |
| McKenzie et al. 2026 — "Endogenous Resistance to Activation Steering" | [2602.06941](https://hf.co/papers/2602.06941) | Llama-3.3-70B recovers from *misaligned* steering mid-generation via self-monitoring. Implies implanted persona will be more robust in newer models (self-correction supports the persona rather than wipes it) but inference-time steering is a moving target. |
| Pitorro & Treviso 2025 — "LaTIM: Token-to-Token Interactions in Mamba" | [2502.15612](https://hf.co/papers/2502.15612) | Closest thing to interpretability methodology for SSM layers. If steering/persona methods need SSM-specific analogs, this is where the tooling starts. |
| Taghibakhshi et al. 2025 — "Hybrid LLM Compression with Group-Aware SSM Pruning" | [2504.11409](https://hf.co/papers/2504.11409) | Hybrid-attention-SSM compression; relevant because it shows group structure inside SSM blocks that may matter for targeted interventions. Nemotron-H architecture family, not Qwen. |

**Gap confirmed by search.** There is **no published work** on representation engineering / activation steering / persona vectors specifically on hybrid attention+SSM models, and none on Qwen 3.6 A3B specifically. This is an open empirical question. The closest adjacent work is Mamba-only interpretability (LaTIM) and hybrid-compression work (Nemotron-H group) — neither does steering or persona.

## Synthesis — suggested order of attack

Given the five depth-of-embodiment criteria in RESEARCH-PLAN (generalization, adversarial robustness, activation signature, behavioral consistency, no regression), and given our hardware/compute envelope:

1. **Phase 2 mainline = Persona Vectors (Chen et al. 2025).** Not CAA-from-scratch. The persona-vectors extraction procedure subsumes CAA and fits our actual data (household-constitution prose → trait description). Expect 5 vectors for our 5 loyalty dimensions. Use Wollschläger/SOM extension to check whether each dimension is a direction or a subspace. **Do this first; CAA is a fallback if persona-vector extraction misbehaves on the MoE architecture.**

2. **Probe SSM layers explicitly as part of Phase 2.** Compute persona vectors separately for the attention-block residual read-points and the SSM-block residual read-points, and compare. If the signal is attention-only, ITI-style head localization is available; if SSM layers carry independent signal, we have a novel finding and need SSM-specific intervention methodology (no prior art, per search). Either outcome is informative.

3. **Phase 3 persistence via preventative steering + ReFT, not another LoRA pass.** Our Track C v2 LoRA already hit the LoRA ceiling (Biderman 2024 predicts exactly this). The two architecturally-better moves: (a) preventative steering during a re-FT pass using the Phase-2 persona vectors as the reinforcement target (Chen 2025); (b) PyReFT with a custom intervention that boosts the persona direction(s), at the layers Phase 2 identifies. Run both, compare on the fingerprint. Full CAI is too expensive; LoRA-at-higher-rank is the third option if (a)(b) fail.

4. **Adversarial robustness (criterion 2) is the hardest criterion and the one persona-vectors paper addresses least.** For that, Open Character Training's synthetic-introspective data generation is the right tool. Hold this in reserve for Phase 4 — we don't need it unless Phase 3 plateaus on robustness specifically.

5. **Measure constantly with probe-based activation signature (criterion 3).** Every intervention — CAA, ReFT, preventative steering — should be evaluated not just by behavioral output but by whether the learned direction is *more linearly separable* post-intervention than pre. This is what distinguishes "deeply embodied" from "sophisticated roleplay". MEASUREMENT.md should operationalize this; our fingerprint alone does not.

**One methodological note.** The abliteration foundation (Arditi) and our base model (Heretic) have *already edited* the geometry of this model. The refusal subspace is gone. Implantation sits atop this altered substrate. It's possible — worth checking in Phase 1 — that the orthogonalization also altered nearby directions that matter for the traits we want to implant. If so, our results won't generalize to non-abliterated variants, and that's a limitation to document from the start.

## History

- 2026-04-24: Initial draft by `litmap`. Drew on HF paper search (confirmed all 10 arxiv IDs + pulled 6 adjacent recent-work entries). Detailed per-paper note for Arditi 2024 in `literature-notes/arditi-2024-refusal.md`.
