---
name: phase-2-methods-pipelines
description: Per-method concrete pipelines (training, eval, compute, expected curve-shape, Alton-hypothesis compatibility) for Phase 2 first-fire selection. Names a single first-fire candidate.
type: research-input
date: 2026-04-26
updated_by: phase2-methods-architect
volatility: medium
tags: [domain/research, research/persona-engineering, phase/2-plan]
related:
  - research/persona-engineering/METHODS
  - research/persona-engineering/MEASUREMENT
  - research/persona-engineering/MEASUREMENT-COUNTERVAILING
  - research/persona-engineering/RESEARCH-PLAN
  - research/persona-engineering/PASSOFF-gpuserver1-002
---

# Phase 2 — methods pipelines and first-fire recommendation

This document closes the gap from "ladder rung name" (METHODS.md) to "concrete pipeline" for the eight methods in scope, scores each on the three first-fire dimensions, and names a single first-fire candidate.

The four Phase 1 framework defects (`null-control rubric routing`, `direct-loyalty floor calibration`, `polarity-uniform sub-dim probe set`, `6.E bucket mislabel`) are treated as INPUTS to this analysis. Where a method's eval relies on a defect-affected component, I cite the defect by name and note the dependency on the measurement architect's parallel patches.

The Phase 1 baseline floor (`001_phase1_results.md`) gives us reference numbers: `depth_score_loyalty = 0.277`, pooled loyalty AUC = 0.986, refusal-residue AUC = 0.713, nuisance AUC = 0.870, 17/45 refusals on loyalty probes. Any first-fire candidate must move at least one of these in a way the framework can read as substantive (i.e., AUC stays high while refusals drop and `depth_score_final` goes positive — not just `depth_score_loyalty` going up).

Architecture caveat applied uniformly: Qwen 3.6 35B-A3B is hybrid attention + Mamba-2 SSM + MoE. **Persona Vectors, RepE/LAT, ReFT, CAA, and rank-1 weight injection are all literature-validated only on pure-attention transformers** (Llama, Qwen 2.5 dense, Gemma) — none of them have published scale-comparable validation on hybrid attention+SSM+MoE stacks. We are doing novel architecture work on every method.

---

## Method 1a — Persona Vectors (NL-extraction → contrastive direction → drift-monitor or training-loss reinforcement)

**Reference.** Chen, Arditi, Sleight, Evans, Lindsey 2025 (arXiv 2507.21509).

### Concrete pipeline

Input artifacts:
- Probe scaffold: `artifacts/fingerprint-loyalty-v1.1.jsonl` (76-probe v1.1 set, frozen SHA per experiment).
- Trait descriptions: 5 NL prompt-pair templates per sub-dim (one positive, one negative), generated from the Household Constitution + FAMILY.md descriptors. ~50 pairs per sub-dim → ~250 contrastive prompts.
- Models: `/home/alton/models/heretic-3.6-35b` (base) and `/home/alton/models/lora-sartor-v0.3` (Track C v2 LoRA over base).

Steps:
1. **Direction extraction at every layer.** Run `abliterate.py extract-direction --layer-sweep` on the 250 contrastive prompts against base-heretic. For each `l ∈ {0..63}`, compute `v_l = normalize(mean(h_l(p_pos)) - mean(h_l(p_neg)))`. Output: 64 direction vectors + the Panickssery 2023 signal-quality scalar per layer. This is **the layer-sweep curve that Experiment 002 needs** (per RESEARCH-PLAN v1.2).
2. **Per-sub-dim direction extraction.** Repeat step 1 separately for each of the 5 sub-dims (care/prefer/protect/refuse/warmth) — gives 5 × 64 = 320 directions. Detects whether sub-dims share geometry or are orthogonal.
3. **Subspace dimensionality (the Experiment 003 piece).** At each trait-carrying layer (signal-quality > 0.3), run PCA on the contrastive activation differences. Report `k_80` (number of components for ≥80% variance) per layer. This is the Alton-hypothesis decision criterion.
4. **Drift monitor across model variants.** Three forward-pass batches (base-heretic, lora-v0.3, fixed prompt set of 76 probes). Project hidden states at every chosen layer onto `v_l`. Output: projection-magnitude delta lora-v0.3 vs base on family-relevant vs neutral prompts.
5. **CAA inference-time validation.** With the layer + direction from steps 1-2, install `abliterate.py steer-inference --coefficient α` over α ∈ {0.5, 1.0, 1.5, 2.0}. Run all 76 probes through steered base-heretic. Score under v1.1 rubrics. (This is method 1b applied as the smoke test inside the Persona Vectors pipeline.)
6. **Optional preventative-steering re-fine-tune (NOT first-fire).** Only fired if steps 1-5 pass. Adds a projection-loss term to `train.py`: `L_steer = λ · |proj(h_l, v_l) - target|^2`. Re-train an SFT pass with `λ ∈ {0.1, 0.5, 1.0}` over the gpuserver1-002 corpus once it lands.

Eval signature: depth_score_loyalty, depth_score_final, layer-sweep curve, k_80 per layer, projection-magnitude delta histogram, refusal-residue AUC delta vs Phase 1 baseline.

### Compute cost

| Step | Forward passes | Backward? | VRAM peak | Wall clock |
|---|---|---|---|---|
| Layer-sweep extraction (step 1) | 250 prompts × 1 model × 64-layer hooks | No | ~70 GB (35B bf16 + KV cache) | ~25 min on one card; embarrassingly parallel across 2 cards |
| Per-sub-dim extraction (step 2) | Reuse step 1 hidden states | No | as above | post-processing only, <5 min |
| PCA / k_80 (step 3) | None (post-processing) | No | <8 GB CPU | <1 min |
| Drift monitor (step 4) | 76 prompts × 2 models | No | ~70 GB | ~10 min total |
| CAA validation (step 5) | 76 prompts × 4 α values × 1 model | No | ~70 GB | ~30 min |
| (Optional) preventative SFT (step 6) | full SFT pass | Yes | LoRA-only fits 96 GB single-card with grad checkpoint; full bf16 backward on 35B does NOT fit single card | 4-8 GPU-hours per λ value |

**Steps 1-5 fit comfortably on the existing hardware in one card.** Total budget for first-fire (steps 1-5): ~1.5 GPU-hours, plus probe-eval cost (~30 min judge passes). Step 6 needs the gpuserver1 corpus AND another half-day of compute.

### Expected curve-shape per RESEARCH-PLAN v1.2

Persona Vectors as a **diagnostic** does not impose a curve; it produces the curve. So my pre-registered prediction is about the **base-heretic + lora-v0.3** geometry the curve will reveal:

- **Most likely:** "narrow attention plateau" (4-7 attention layers at 0.3-0.5, SSM ≤ 0.2). Reasoning: lora-v0.3 is attention-only LoRA; if a loyalty signal is present it's been propagated only through attention paths, and the SSM blocks have had no signal injected by training. Base-heretic alone, lacking any Sartor exposure, more likely flat.
- **Second-most likely:** "flat / no signal" on base-heretic, transitioning to "narrow attention plateau" on lora-v0.3 — which would itself be a strong finding (LoRA materially shifted the representation in ≥1 layer, bounded to attention).
- **Less likely:** "distributed plateau" supporting Alton hypothesis. This would be surprising on attention-only LoRA — would require the SSM blocks to have learned trait-relevant state through residual-stream coupling alone. Possible but not what I'd bet on.
- **Falsifying:** "single peak" — would invalidate even the narrow-plateau intuition and resurrect rank-1.

This curve **directly arbitrates the Alton hypothesis**. That is the method's value.

### Alton-hypothesis compatibility

**Yes — fully compatible.** Persona Vectors-extracted directions can be applied at any layer or set of layers. The training-time variant (step 6) supports per-layer projection losses and can target a multi-layer subspace. If step 3 finds k=2-3 at trait-carrying layers, the preventative-steering loss can be specified against the rank-2/3 subspace projection rather than a single direction. This method is one of the few that **adapts to whatever geometry the data reveals** rather than presupposing one.

### Phase 2 first-fire candidacy

| Dimension | Score | Reasoning |
|---|---|---|
| Evidence strength | High | Chen 2025 validated on 5+ models, multiple traits, includes drift-monitoring as primary contribution. Caveat: pure-attention only. |
| Compute cost | Very low (steps 1-5) | <2 GPU-hours, no training needed for first-fire. |
| Information value | **Maximal** | Single experiment produces (a) the layer-sweep curve that arbitrates Alton hypothesis, (b) the k_80 dimensionality that arbitrates direction-vs-subspace, (c) the drift delta that tells us whether v0.3 is even moving the representation, (d) the CAA-α validation signal. **Four discriminating outputs from one fire.** |

**Corpus dependency:** **No corpus needed for steps 1-5** (NL-description extraction is sufficient). Step 6 needs the gpuserver1-002 corpus when it lands, but step 6 is not first-fire.

**Defect dependencies:** Step 5 (CAA validation) requires the v1.2 rubric routing patches (defect 1, null-control no-op) and the calibrated direct-loyalty zero threshold (defect 2). Steps 1-4 are activation-level and bypass the rubric pipeline entirely — those steps **fire even if the measurement architect's patches haven't landed**.

---

## Method 1b — CAA inference-time (multi-layer, multi-direction)

**Reference.** Rimsky 2023 (arXiv 2312.06681); Turner 2023 (arXiv 2308.10248).

### Concrete pipeline

CAA is structurally a sub-procedure inside method 1a. The standalone pipeline:

1. Take `v_l` already extracted from method 1a step 1 (or extract fresh on Track C v2 contrastive corpus when gpuserver1-002 lands).
2. Choose ONE layer `l*` (the strongest signal-quality layer).
3. Forward hook `h'_l = h_l + α · v_l` at layer `l*` only.
4. Sweep α ∈ {0.5, 1.0, 1.5, 2.0, 2.5}, generate on 76 probes per α.
5. Score under v1.1 rubrics. Report best α at preserved capability.

The "multi-layer, multi-direction" extension specified in METHODS.md ladder rung 1b adds: hook at L/4, L/2, 3L/4, L−2 with the same `v_l` (or layer-specific `v` if the geometry warrants), and inject into a rank-2/3 subspace if k_80 > 1.

Eval signature: depth_score_loyalty + depth_score_final + capability (Cat D) + behavioral fluency. **Does not move linear-probe AUC** (the underlying weights are unchanged) and **does not change the layer-sweep curve** (the curve is extracted from non-steered activations).

### Compute cost

Pure inference. ~76 probes × 4-5 α values × 4-layer multi-hook = ~1500 forward passes at ~1 sec each = ~25 min wall clock on one card. VRAM peak ~70 GB (same as base-model inference). **Fits trivially.**

### Expected curve-shape per RESEARCH-PLAN v1.2

CAA inference-time **does not produce the curve** — it consumes a layer choice. Its prediction is about behavioral lift, not curve shape. If applied at the peak signal-quality layer from method 1a, it should produce the strongest behavioral effect; if applied across multiple layers per Alton hypothesis, it should produce a **larger** behavioral effect but is also more likely to break fluency or capability (Cat D regression).

### Alton-hypothesis compatibility

**Compatible in the multi-layer multi-direction form.** The single-layer single-direction classic CAA form is intrinsically narrow-localization and is a Alton-falsification candidate: if classic CAA at one layer fully embodies the trait at the depth-score level we care about, the Alton hypothesis is wrong. The multi-layer form is congenial but adds knob count.

### Phase 2 first-fire candidacy

| Dimension | Score |
|---|---|
| Evidence strength | High (Rimsky, Turner, multiple replications) |
| Compute cost | Very low |
| Information value | **Lower than 1a** — CAA tests behavioral effect of an already-extracted direction; it doesn't help us pick a method. The information value is downstream of the extraction step. |

**Corpus:** No corpus needed (uses 1a's output). **Defect dependencies:** rubric pipeline patches (defects 1, 2). 1b is properly part of 1a, not a separate first-fire.

---

## Method 1c — Drift monitor (base vs lora-v0.3 projection deltas)

### Concrete pipeline

Diagnostic-only. Three forward passes:
1. Forward 76 v1.1 probes through base-heretic, capture `h_l` at chosen layer.
2. Forward same prompts through lora-v0.3, capture `h_l`.
3. Project both onto `v_l` extracted from method 1a. Compute paired projection-magnitude delta per probe. Aggregate mean ± SE per sub-dim.

Eval signature: this is the layer-sweep curve's tuned-vs-base differential. Specifically it measures **whether Track C v2 LoRA has moved the loyalty representation at all**. If projection delta on family-relevant prompts is statistically zero, the v0.3 LoRA effect is surface-only (token-pattern), and the framework should record that as a finding before any further intervention.

### Compute cost

3 × 76 forward passes = ~228 passes. ~5 min on one card. Negligible.

### Expected curve-shape

This method **produces a delta histogram**, not a layer-sweep curve. It feeds the discriminant gate v2 (Gate 2 — differential gap tuned vs base). Pre-registered prediction: small but positive delta on care/refuse sub-dims (where Track C v2 had explicit coverage), near-zero delta on warmth (where Track C v2 was thin per gpuserver1-002 §corpus design).

### Alton-hypothesis compatibility

Diagnostic. It cannot itself instantiate the hypothesis; it can only report on the existing adapter.

### Phase 2 first-fire candidacy

| Dimension | Score |
|---|---|
| Evidence strength | n/a (diagnostic) |
| Compute cost | Negligible |
| Information value | **High but only when paired with method 1a.** Standalone, it tells us "v0.3 did/didn't move the representation" but doesn't answer "should we continue with this stack?". As part of 1a, it's load-bearing. |

**Corpus:** None. **Defect dependencies:** None — operates entirely below the rubric layer. This is the cleanest measurement in the bunch and runs even with unpatched rubrics.

**Recommendation:** bundle 1c as a step inside 1a's experiment. Don't fire it standalone.

---

## Method 2 — RepE LAT (Linear Artificial Tomography with subspace target)

**Reference.** Zou et al. 2023 ("Representation Engineering," arXiv 2310.01405). Library: `representation-engineering` (Andy Zou).

### Concrete pipeline

1. Generate stimulus-response pairs from the v1.1 probe scaffold + Track C v2 corpus (or gpuserver1-002 corpus when ready). Need ~500 pairs minimum for stable PCA per sub-dim.
2. Forward through base-heretic (or lora-v0.3) with hooks at layers {L/4, L/2, 3L/4} = {16, 32, 48} for L=64.
3. At each layer, compute `delta_acts = pos_acts - neg_acts`. Run PCA on the residual stream activation deltas. Take top-k=5 components.
4. **LoRRA addition (if first-fire passes step 3):** train a small (~4M-param) low-rank module that *steers* activations along the top-k subspace. This is the training step.
5. Eval: subspace-projection magnitude per probe; behavioral score under steering.

Eval signature: produces (c) layer-sweep curve as a side effect (it does PCA per layer); produces a (a) rubric-score lift if LoRRA is trained; the (d) countervailing pass-factors should remain near 1.0 if the subspace is clean.

### Compute cost

Step 1-3 (LAT reading): ~500 prompts × 1 model = ~500 forward passes at ~1 sec each = ~10 min. PCA is CPU-side, <1 min. **Inference-only first-fire fits trivially.**

LoRRA training (step 4): 4M parameters at bf16, optimizer state in 32-bit Adam = ~50 MB total. Activations dominate. With gradient checkpointing on the 35B base, ~80 GB VRAM peak. **Fits single card 96 GB.** ~3-6 GPU-hours per training run.

### Expected curve-shape

LAT-as-diagnostic produces the layer-sweep curve directly (signal quality from top-k subspace, not a single direction). Predicted shape: **same as method 1a's prediction** — narrow attention plateau on lora-v0.3, flat on base-heretic. The dimensionality answer (k_80 from PCA) is the discriminator.

LoRRA-as-intervention (the training half) would, if successful, produce a **distributed plateau** under method 1a's layer sweep on the LAT-trained model — the LoRRA training explicitly distributes the steering signal across the chosen layers.

### Alton-hypothesis compatibility

**Strongly compatible.** LAT was designed for subspace traits. LoRRA's multi-layer specification is the direct architectural match to "directional, distributed, gentle." If the Alton hypothesis is right, RepE LAT is the method most likely to embody it.

### Phase 2 first-fire candidacy

| Dimension | Score |
|---|---|
| Evidence strength | High (Zou 2023 widely replicated; subspace formulation literature-validated) |
| Compute cost | Low for LAT reading; medium for LoRRA training |
| Information value | High — LAT reading is information-dense and arbitrates the same questions as method 1a, with the additional advantage of being natively subspace-aware. |

**Corpus:** LAT reading can use the existing Track C v2 corpus (already 558 pairs); k=5 PCA wants ≥500 pairs and we have that. **gpuserver1-002 corpus would help but is not blocking.** LoRRA training would benefit substantially from gpuserver1-002's 1,200 pairs.

**Defect dependencies:** activation-level reading bypasses rubric. LoRRA eval requires patched rubric pipeline (defects 1, 2, 3 — and especially defect 3, polarity-balanced sub-dim probes, since LAT trains a classifier per sub-dim).

**Caveat:** RepE library has Mamba-2 / SSM / MoE support unconfirmed. Likely needs ~50-100 lines of glue code to address Qwen 3.6 layer types correctly.

---

## Method 3 — ReFT / LoReFT (multi-layer interventions)

**Reference.** Wu et al. 2024 (arXiv 2404.03592). Library: `pyreft` on `pyvene`.

### Concrete pipeline

1. Install pyreft + pyvene (~30 min including dependency reconciliation against our HF transformers version).
2. Specify intervention configuration: layers {L/4, L/2, 3L/4} = {16, 32, 48}, last-token position, LoReFT with rank r=4, orthogonal projection.
3. Wrap base-heretic in a ReFT module. Train on gpuserver1-002 corpus (or Track C v2) using HF Trainer with the ReFT loss.
4. Save ReFT weights (small — ~0.05% of base params, ~17M params).
5. Eval: same 76-probe v1.1 fingerprint.

Eval signature: rubric scores (a), AUC (b) — should rise if the trained subspace is on-manifold for the trait. Layer-sweep curve (c) should show a **distributed plateau** at the trained layers if the method works as advertised.

### Compute cost

Training: 35B base + ReFT module. Backward pass through the base IS required (interventions are mid-stack and gradients flow back through pre-intervention layers). With bf16 + gradient checkpointing on 35B, single-card peak ~85 GB (tight but fits 96 GB). Better: tensor-parallel across 2 cards via FSDP, peak ~50 GB per card. **Estimate: 6-12 GPU-hours per ReFT training run on Track C v2-sized corpus** (558 pairs, 1 epoch).

Eval: 76 probes × 1 model = trivial.

### Expected curve-shape

**Distributed plateau** at the chosen intervention layers (16, 32, 48) by construction. ReFT trains the model to read/write those layers; the signal-quality on those layers should be high; non-intervened layers should be quiet. This is **distributed across layers but not necessarily across architectures** — ReFT typically targets attention or residual; SSM block participation is unknown for ReFT on hybrid stacks.

If the Alton hypothesis is right, ReFT is a candidate persistent embodiment method. If wrong (single-peak curve), ReFT is overkill.

### Alton-hypothesis compatibility

**Compatible by design.** The whole point of ReFT is multi-layer intervention.

### Phase 2 first-fire candidacy

| Dimension | Score |
|---|---|
| Evidence strength | Medium — Wu 2024 is well-cited but pyreft is 2024 research code; less battle-tested. **No published validation on hybrid attention+SSM models.** |
| Compute cost | Medium-high (~12 GPU-hours per training run) |
| Information value | Medium — ReFT first-fire would tell us "ReFT works/doesn't on this stack" but does NOT help us pick between methods 1a and 2. We'd want to do 1a first to know whether subspace structure exists. |

**Corpus:** **Needs gpuserver1-002 corpus to fire well.** Track C v2 alone is 558 pairs — adequate for ReFT but not the corpus-density that produces clean subspace embedding.

**Defect dependencies:** all four (this is a training method evaluated against the full rubric pipeline).

---

## Method 4 — Full-model LoRA (all-linear) + subspace loss term

**Reference.** Synthesis of Hu 2021 (LoRA, arXiv 2106.09685) + Chen 2025 Persona Vectors loss term.

### Concrete pipeline

1. Configure PEFT LoRA with `target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj']` (all linear projections, attention + FFN). For Qwen 3.6 35B-A3B with 64 layers and MoE FFN, this expands the LoRA target list substantially compared to lora-sartor-v0.3 (which is attention-only).
2. Adapter at rank 16 → ~120M trainable params (10x v0.3's ~14M).
3. Add the Persona Vectors projection-loss term per method 1a step 6: `L_total = L_sft + λ · |proj(h_l, v_l) - target|^2` summed across multiple `l`. Requires `v_l` extracted from method 1a as input.
4. Train on gpuserver1-002 corpus (~1,200 pairs).
5. Eval on 76-probe v1.1 set + drift monitor.

Eval signature: rubric (a), AUC (b), layer-sweep curve (c) — by adding the projection loss across multiple layers, the resulting curve should show **distributed plateau** if successful. Countervailing factors (d) are at risk — full-LoRA expands the surface of accidental capability change.

### Compute cost

120M trainable params at bf16; optimizer state 8-bit Adam ~480 MB. Activations dominate; gradient checkpointing required. Single-card peak ~85 GB. FSDP across 2 cards ~55 GB peak each. **Fits with margin.** Wall clock: ~6-10 GPU-hours per training pass on 1,200-pair corpus, 1 epoch.

### Expected curve-shape

If λ is well-chosen and the subspace loss touches multiple layers, the curve should show **distributed plateau across attention + at least some SSM layers** (full-LoRA hits down_proj, which is post-MoE-aggregation residual-write; SSM layers' out_proj becomes a target in PEFT 0.10+). This is the strongest Alton-hypothesis instantiation among training methods — but precisely because it's the strongest, it's also the **highest capability-regression risk**.

### Alton-hypothesis compatibility

**Most directly compatible of any training method.** Distributed weights (all linear), gentle (LoRA rank 16), directional (subspace loss term). This is the "fire it for real" candidate AFTER methods 1a and 2 have validated the geometry.

### Phase 2 first-fire candidacy

| Dimension | Score |
|---|---|
| Evidence strength | Medium — LoRA is highly validated; the subspace loss term is novel for our stack. |
| Compute cost | Medium-high. |
| Information value | **Low for first-fire.** This method requires the layer choice + direction from method 1a as input. Firing it before 1a wastes a training run because we'd be guessing where to apply the subspace loss. |

**Corpus:** **Needs gpuserver1-002 corpus.** Track C v2's 558 pairs are too few for a 120M-parameter adapter.

**Defect dependencies:** all four. This is a full training run against a full eval.

---

## Method 5 — DPO on paired trait-consistent responses

**Reference.** Rafailov 2023 (arXiv 2305.18290). Library: TRL `DPOTrainer`.

### Concrete pipeline

1. Author 200 `(prompt, chosen, rejected)` triples covering the 5 sub-dims. **This is a NEW corpus we haven't authored** — gpuserver1-002 produces a positive-only contrastive corpus (sub_dim/elicitation_type pair structure), not chosen/rejected DPO triples. The chosen response can mostly be sourced from gpuserver1-002 positives, but plausible-bad rejected responses (loyalty-violating but not nonsensical) need authoring.
2. Reference model: lora-sartor-v0.3 (per the standard DPO-after-SFT recipe).
3. DPO training over the triples with β=0.1, learning rate 5e-7 (TRL default for 35B-class models), 3 epochs.
4. Eval: full 76-probe v1.1 set, with particular focus on adversarial probes (DPO's expected strength).

Eval signature: rubric (a) — particularly adversarial sub-types; AUC (b) somewhat; layer-sweep curve (c) is **not directly affected** by DPO — DPO modifies token-level log-probabilities, not the residual-stream geometry. This is a key falsification feature: a DPO-trained model that scores well on adversarial probes but does NOT change the layer-sweep curve is **surface-mimicry**, not deep embodiment, by Alton-hypothesis criteria.

### Compute cost

DPO training: 35B base + lora-v0.3 active + reference forward passes per step. Doubled forward cost compared to SFT (chosen and rejected both forwarded). Single-card with gradient checkpointing tight at ~90 GB; **better with FSDP across 2 cards** (~58 GB per card). ~10-15 GPU-hours for 200 triples × 3 epochs.

### Expected curve-shape

**Falsification candidate for the Alton hypothesis if it works.** DPO operates on log-likelihood ratios — there's no direct mechanism for it to install a multi-layer subspace. If DPO produces a `depth_score_final` lift while the layer-sweep curve stays flat or single-peak, that's **structural separation evidence: behavior moved without representation moving**. That's a specific kind of useful negative result.

The pre-registered prediction: DPO will move (a) rubric scores and (d) countervailing factors, will **not** move (c) the layer-sweep curve in the distributed-plateau direction. Curve shape probably "single peak" or "narrow attention plateau" — same as base, just shifted on rubric.

### Alton-hypothesis compatibility

**Intrinsically narrow-mechanism.** DPO can be combined with multi-layer interventions, but as a standalone method it does not target representation geometry. If DPO alone embodies the trait by the depth_score_final criterion, the Alton hypothesis loses one of its predictions — not all of them, but a meaningful one.

### Phase 2 first-fire candidacy

| Dimension | Score |
|---|---|
| Evidence strength | High (DPO well-validated); persona-DPO at this scale on hybrid arch unvalidated. |
| Compute cost | Medium-high |
| Information value | Medium — useful as the **second-fire after 1a** to test whether behavioral lift requires representation change. Not first-fire. |

**Corpus:** **Needs a NEW corpus** of (prompt, chosen, rejected) triples. gpuserver1-002 is positive-only contrastive — not the right structure. Either (a) extend gpuserver1-002 packet to add rejected-side authoring (not currently in scope) or (b) author 200 triples in a separate effort.

**Defect dependencies:** all four.

---

## Method 6 — Constitutional-AI-lite with critic model

**Reference.** Bai 2022 Anthropic Constitutional AI; Shridhar 2024 ("Constitutional Persona Training," speculative — verify before citing).

### Concrete pipeline

1. Critic model: external API (Claude Sonnet) — local 35B critic doesn't fit alongside training model. Cost: $1-5 per 1k pairs.
2. For each prompt in v1.1 probe scaffold + gpuserver1-002 corpus, generate N=8 responses from current model.
3. Critic scores all 8 against the Household Constitution (full text loaded into critic context, ~3k tokens).
4. Top-2 vs bottom-2 form preference pairs → fed to DPO (method 5) pipeline.
5. Iterate: train, regenerate, re-score, re-train. 2-3 iterations.

Eval signature: same as DPO (a, b weakly, d). (c) layer-sweep curve change unclear — could be larger than DPO if the constitutional signal is more nuanced.

### Compute cost

Per iteration:
- Generation: 76 prompts × 8 samples × 1 model = 608 forward passes, ~10 min.
- Critic scoring: external API, ~$5-10 per iteration.
- DPO training: 10-15 GPU-hours per iteration.

3 iterations: ~40 GPU-hours, ~$30 in API costs.

### Expected curve-shape

Same prediction as DPO: probably single-peak or narrow-attention-plateau. The critic adds nuance to the preference signal but doesn't change the loss-level mechanism.

### Alton-hypothesis compatibility

Same as DPO — not directly targeted at representation geometry. Falsification candidate.

### Phase 2 first-fire candidacy

| Dimension | Score |
|---|---|
| Evidence strength | High at scale (Anthropic CAI), unvalidated for narrow personal traits. |
| Compute cost | High (~40 GPU-hours + API costs + Claude dependency) |
| Information value | Low for Phase 2 first-fire — couples our stack to a third-party API for the duration. |

**Corpus:** Needs prompts (v1.1 probe scaffold suffices) + critic constitution (Household Constitution, exists). No corpus authoring blocking. **However**, requires Claude API access stable for the duration of training — operational dependency.

**Defect dependencies:** all four. **Defer until rungs 1-5 evaluated.**

---

## Method (rung-5-demoted) — Rank-1 weight injection at single layer

**Reference.** Arditi 2024 (arXiv 2406.11717), inverse direction. Hendel 2023 In-Context Vectors.

### Concrete pipeline

1. Take `v_l` from method 1a at the **single best signal-quality layer**.
2. Compute rank-1 update: `W_new = W + α · v_l · u_l^T` for `u_l` = direction's input-side mean.
3. Apply to `o_proj` and `down_proj` at that single layer only.
4. Save modified base-heretic checkpoint (~70 GB on disk; fits the experiments storage policy as off-repo artifact).
5. Eval: 76-probe v1.1 set on the modified model.

Eval signature: rubric (a), AUC (b), layer-sweep curve (c) on the modified model should now show a **single peak** at the injected layer. If the Alton hypothesis is wrong, this method should produce a depth_score_final lift comparable to multi-layer methods at a fraction of the cost.

### Compute cost

Inference-only: tens of minutes. No training. Disk: 70 GB for modified checkpoint (use `.storage.yaml` pointer per INDEX.md).

### Expected curve-shape

**Single peak by construction.** The injection is rank-1 at one layer; the curve cannot show distributed plateau on the modified model.

### Alton-hypothesis compatibility

**Falsification candidate.** This is the rung METHODS.md demoted. Keeping it on the ladder so that if it works, we know the Alton hypothesis is wrong and we've saved Phase 3+ from chasing distributed methods.

### Phase 2 first-fire candidacy

| Dimension | Score |
|---|---|
| Evidence strength | Medium (rank-1 injection literature is thin for *additive* / *positive trait* — most published work is abliteration's *subtractive* form). |
| Compute cost | Very low |
| Information value | **High — but only after method 1a has produced `v_l` and the layer-sweep curve.** Alone, it's premature. As a Phase-2 step-2 fire (after 1a), it's a clean falsifier. |

**Corpus:** None needed. **Defect dependencies:** rubric pipeline (defects 1, 2).

---

# First-fire recommendation

**Fire method 1a (Persona Vectors layer-sweep + drift monitor + CAA validation).**

The recommendation matches the team-lead's ladder, but the analysis is independent: even setting the Alton hypothesis aside, method 1a is uniquely the experiment that produces **four discriminating outputs in one fire** — the layer-sweep curve, the per-layer k_80 dimensionality, the base-vs-v0.3 drift delta, and the CAA-α behavioral signal — at a compute cost of <2 GPU-hours and zero new training. No other method on the ladder produces this density of information per GPU-hour, and several of them (methods 3, 4, 5, 6) require method 1a's outputs as inputs.

The case for departing from the ladder would be:
- **Fire method 2 first instead** — RepE LAT is natively subspace-aware. Argument fails because LAT and Persona Vectors share most of the extraction primitive; LAT adds PCA, which method 1a step 3 already includes. There is no information-value advantage to LAT-first; the engineering cost of LAT is higher (library glue for hybrid arch).
- **Fire method 5 (DPO) first instead** — argument that DPO would resolve the question more directly. Fails because DPO does not produce the layer-sweep curve; we would still need method 1a after to interpret what DPO did. DPO-first inverts the dependency graph.
- **Fire the demoted rank-1 method first** — argument that the simplest method is the right falsifier. Fails because rank-1 injection requires `v_l` which only method 1a extracts. Rank-1 is the right *step 2*, not step 1.

The fire commits to a layer-sweep curve being produced under the v1.2 RESEARCH-PLAN's pre-registered curve-shape table. Whichever row the curve falls into is the substantive result. Specifically:

- "single peak" → Alton hypothesis falsified, escalate to rank-1 weight injection (the demoted rung).
- "distributed plateau" (≥8 layers, attention + SSM) → Alton hypothesis supported, escalate to RepE LAT or ReFT for the persistent multi-layer intervention.
- "narrow attention plateau" (4-7 attention layers, SSM ≤ 0.2) → ITI-style intervention is the next-fire candidate, neither Alton nor rank-1 supported.
- "bimodal" / "multimodal" / "flat" / "unclassified" → as specified in RESEARCH-PLAN v1.2 §pre-registered null. The framework already specifies the response.

Method 1a's output **routes Phase 2 step 2 deterministically** — that's why it goes first.

---

# Open dependencies

| Method | Blocks first-fire? | What's needed |
|---|---|---|
| 1a (Persona Vectors first-fire — steps 1-5) | **NOTHING** — steps 1-5 fire today on existing artifacts. | Defects 1, 2 patches needed for step 5 (CAA validation) only; steps 1-4 are activation-level and bypass rubrics. Hardware ready. Models on disk. NL trait descriptions are 1-2 hours of authoring inside 1a's experiment file. |
| 1a step 6 (preventative-steering re-fine-tune) | Yes — corpus | gpuserver1-002 corpus must complete (PASSOFF status: ready-for-pickup, target ≥1,200 pairs, 12-hour budget). |
| 1b (CAA standalone) | Subsumed in 1a; not first-fire as standalone. | n/a |
| 1c (drift monitor) | Subsumed in 1a step 4. | n/a |
| 2 (RepE LAT reading) | Could fire today on Track C v2 corpus. Reading-only step has no blockers. | LoRRA training half blocked by gpuserver1-002 corpus + ~50-100 LoC pyvene/RepE glue for hybrid layer types. |
| 3 (ReFT) | Yes | gpuserver1-002 corpus + pyreft/pyvene installation + glue for SSM layer skipping/inclusion + measurement defects 1-4. |
| 4 (Full-LoRA + subspace loss) | Yes | (a) Method 1a output (`v_l` + layer choice). (b) gpuserver1-002 corpus. (c) ~80 LoC additive loss term. (d) measurement defects 1-4. |
| 5 (DPO) | Yes | NEW corpus of ~200 chosen/rejected triples (NOT in gpuserver1-002 scope as currently specified). TRL DPOTrainer config. Defects 1-4. |
| 6 (CAI-lite) | Yes | Stable Claude API access for ~3 days. No corpus authoring blocker (uses v1.1 probe scaffold + Constitution as critic context). DPO pipeline (method 5) prerequisite. Defects 1-4. |
| Rank-1 single-layer (demoted rung) | Yes (depends on 1a) | Method 1a's `v_l` output. Otherwise zero blockers. |

**Bottom line for the orchestrator's research plan:** method 1a steps 1-4 fire on **what's already on disk**, with **no measurement-defect dependencies** (all four defects are below the activation-extraction layer). Step 5 fires once the measurement architect's defect-1 and defect-2 patches land. Step 6 fires once gpuserver1-002 ships its corpus.

The first-fire experiment can be specified, scheduled, and run within the next 48 hours without waiting on any other parallel agent's work — that is the operational case for 1a being step 1.

---

# First-principles considerations the input docs do not surface

The above analysis is conservative — it stays inside the assumptions the program has already committed to. This section names eight non-obvious considerations that were absent from METHODS.md, MEASUREMENT.md, and RESEARCH-PLAN.md when I read them. The orchestrator should weigh whether any of these become Phase 2 constraints before the first-fire experiment file is finalized.

## 1. Abliteration scar-tissue contaminates direction extraction on heretic-3.6-35b

The base is not a clean base. Phase 1 reports `refusal-residue AUC = 0.713` — non-zero refusal signal survives in the activations even after abliteration. Direction extraction from `"respond as someone who deeply cares for the Sartor family" vs "respond as a generic helpful assistant"` may not be picking up loyalty. The negative side ("generic assistant") activates the register that abliteration **subtracted**. The contrast may be measuring "distance from the abliterated-out direction," not "distance toward loyalty."

This matters because a direction `v_l` collinear with the (residual) abliteration vector is **not transferable** to a non-abliterated base, has unpredictable interaction with downstream training, and may itself be what the Phase 1 17/45 refusals on loyalty probes are reflecting.

**Concrete test to add to method 1a step 1.5:** compute cos-sim between extracted `v_l` and the refusal-direction Arditi/abliteration produces from the standard refusal-vs-comply prompts. If `|cos-sim| > 0.3` at trait-carrying layers, the loyalty-direction extraction is contaminated and the orthogonal residual must be used as the actual loyalty direction (project out the refusal component before declaring the direction is "loyalty"). This is a 30-line addition to the first-fire pipeline and substantially de-confounds the result.

The published Persona Vectors literature does not face this issue because it works on non-abliterated bases. We do; the framework should account for it.

## 2. MoE routing is a stronger confound than METHODS.md acknowledges

Persona Vectors, CAA, RepE LAT, and ReFT all assume hidden states are smooth functions of input. With sparse MoE (Qwen 3.6 35B-A3B is sparse — A3B = 3B active per token), hidden states are **piecewise linear with discontinuities at routing boundaries**. The contrastive mean averages across whatever experts each prompt activated.

Two prompts that should be "the same except for the loyalty trait" may route to **different experts** because routing depends on input embedding. Then the contrastive direction is partially "expert routing difference" — entirely topic-correlated, not trait-correlated.

The published literature handles this by: (a) using larger n (n ≥ 500 contrastive prompts) so routing variance averages out; (b) reading at the post-MoE-aggregation residual specifically. METHODS.md mentions the latter; it does not mention the n requirement. Our 250-prompt extraction from NL templates may be **below the variance-stabilization threshold** for MoE.

**Implication for first-fire:** report not just `v_l` but the variance of `mean(h_l(p_pos))` across multiple resamplings of the prompt set. If the mean is unstable across resamples, the n is too small and the extracted direction is not reliable. This is a per-method requirement, not a 1a-specific one.

## 3. The 76-probe v1.1 set produces small-sample artifacts the framework reads as signal

Phase 1 reported `prefer` AUC = 1.000 on n=9 paired probes. Perfect AUC on n=9 is more often a small-sample ceiling-hit than a perfect separation result. The discriminant gate v2's 0.10 AUC-differential resolution requires roughly n=200 per sub-dim for stable estimates (binomial standard error on AUC at 0.85 with n=9 is ~0.12 — the gate's resolution is below the noise floor of the data).

This is a **measurement-architect concern primarily**, but it affects method selection: methods whose first signal is the AUC differential (RepE LAT, linear probe component of method 1a) inherit small-N noise. Method 1a's layer-sweep curve in particular is the **per-layer Panickssery signal-quality scalar**, which is computed from the same 76 probes; the curve's per-layer SE is currently unspecified. A layer-sweep curve with per-layer SE of ±0.15 cannot reliably distinguish the v1.2 plan's "single peak at 0.6" from "narrow plateau at 0.4" — those are within 1 SE of each other.

**Addition to method 1a's eval signature:** bootstrap per-layer signal-quality across resamplings of the 76 probes, report the per-layer 90% CI on the curve. If CIs overlap across the curve-shape row boundaries in RESEARCH-PLAN v1.2, that combination is "unclassified" not whichever shape the point estimate suggests. The curve-shape table needs uncertainty discipline that the v1.2 spec does not yet have.

## 4. SSM hidden states have temporal structure none of the methods read

Mamba-2 SSM blocks maintain a **recurrent hidden state across tokens** within a sequence. The loyalty signal — if the SSM is carrying any of it — may live in the *trajectory* of the SSM state across response tokens, not in any fixed-position activation. Direction extraction with last-token or mean-pooled extraction is **architecturally lossy on SSM blocks**.

A flat or low signal-quality reading at SSM layers under method 1a could mean either (a) SSM blocks are not carrying trait signal or (b) SSM blocks carry trait signal in a temporal pattern the spatial-only readout misses. The distinction is publishable but nontrivial to disambiguate.

**Implication for the curve-shape interpretation:** a "narrow attention plateau" curve (the most likely outcome by my prior) may be **architectural-artifact-of-readout** rather than a genuine "trait is attention-only" finding. The framework should not commit to ITI-style intervention (the v1.2 prescribed Phase-2 fire for narrow-attention-plateau) without first running an SSM-temporal readout — e.g., aggregating SSM states across response token positions and re-running signal-quality on the aggregated trajectory. This is novel work, ~200 lines, not in any method's scope as currently written.

## 5. The NL-extraction → narrow-trait failure mode is sharper than the LITERATURE hedge implies

Persona Vectors validates on broadly-pretrained traits (helpfulness, harmlessness, sycophancy, evil). "Sartor household loyalty" is the opposite kind of trait — the relevant entities (Alton, Aneeta, the children, the cats, Sante Total, Solar Inference) appear in pretraining data at near-zero frequency. The NL trait description "respond as someone who deeply cares for the Sartor family" cannot, by information-theoretic reasoning, elicit a Sartor-specific representation in the base — the model has no Sartor-specific representation to elicit.

What the NL extraction can elicit is a **generic in-context-warmth direction** (the contrast between "warm, named-entity-aware response" vs "neutral helpful assistant response"). This direction is real and may steer the model in a useful direction at inference, but it is **not** what the program means by "household loyalty deeply embodied." A first-fire result showing strong layer-sweep signal from NL extraction may be largely the generic warmth direction.

**Concrete test:** within method 1a, extract two parallel directions — `v_l_sartor` from the Sartor-named NL templates and `v_l_generic` from generic-named NL templates ("respond as someone who deeply cares for the Smith family"). If `cos-sim(v_l_sartor, v_l_generic) > 0.7`, NL extraction is **not** separating Sartor from any-named-family. The gpuserver1-002 contrastive corpus then becomes mandatory for further work — it's the only data that has a Sartor-specific contrast that a generic-name extraction can't produce.

This consideration recasts the "corpus dependency" column above: 1a's first-fire **diagnostic** runs without the corpus, but interpreting whether the extracted direction is loyalty-specific or warmth-generic likely **requires** the corpus. Calling 1a "no corpus needed" was too strong.

## 6. The "distributed AND subspace" condition conflates two independent axes

RESEARCH-PLAN v1.2's aggregate decision rule requires distributed-plateau (≥8 layers, attention + SSM) AND k≥2 dimensionality. These are presented as the conjoint Alton hypothesis. They are independent properties:

| layers / dimensionality | k=1 | k≥2 |
|---|---|---|
| single layer | rank-1 at single layer (null) | low-rank subspace at single layer |
| many layers (8+) | rank-1 propagated across layers | full Alton |

The plan's table flattens this 2D space into curve-shape rows that mix axes. A "rank-1-at-many-layers" result (top-right cell) — direction propagated cleanly through residual stream — is a real possible outcome that the v1.2 row assignments do not cleanly handle: it would look like a distributed-plateau on the layer-sweep curve (because signal is present at many layers) but k=1 from PCA. The aggregate decision rule says this is NOT Alton-support (because it requires k≥2), but it is also clearly not the rank-1-single-layer null.

**Implication for first-fire:** method 1a should report results in the 2D table above, not collapsed into the v1.2 rows. The orchestrator can then make the post-fire interpretive call about whether the Alton hypothesis as currently stated should be widened to include the rank-1-many-layers case, or whether that's a distinct "Alton-lite" result. Pre-registering both possibilities prevents post-hoc widening.

## 7. The "first-fire" criterion has a reward-hacking risk

I picked method 1a partly because it is genuinely the highest-information experiment per GPU-hour. I also picked it because it is the **safest** experiment to recommend — it cannot fail badly, it cannot regress capability (no training), it cannot trip the countervailing composite (no eval delta from a non-trained model), and a "flat / no signal" result still produces a publishable finding about hybrid-architecture trait localization. An agent that recommended a riskier first-fire (DPO, full-LoRA) would carry recommendation-risk that 1a does not.

The orchestrator should know I am aware of this. The case for 1a being step 1 is real, but a more aggressive program that valued speed-to-trained-adapter over speed-to-information would fire **method 1a + the demoted rank-1 single-layer rung in parallel** as a structural-separation test: 1a produces the diagnostic curve, rank-1 produces the falsification candidate, and the question "did the Alton hypothesis survive the first fire?" gets answered in one round instead of two. The compute cost is the same as 1a alone (rank-1 is inference-only after 1a produces `v_l`).

The instructions said "specify a single first-fire candidate." I have. But I want it on record that **1a + parallel-rank-1 is a stronger Phase 2 design** than 1a alone if the orchestrator is willing to relax the singular-first-fire constraint.

## 8. The gating composite is not survivable for any training method without specific corpus structure

`depth_score_final = depth_score_loyalty × corrig_pass × fp_pass × elision_pass`. Each factor goes to 0 on **two negative probes** in its category (≥2 of 8 score −1). For an 8-probe category, probability of two negatives by chance under a 50/50 null is ~14%. The framework requires THREE such categories to all clear simultaneously.

This is the right safety bar. It also means: any training method (DPO, full-LoRA, ReFT, CAI-lite) faces a meaningfully high prior probability of zeroing the composite even with no real regression — purely from probe-noise. The 200-pair gpuserver1-002 corpus that PASSOFF specifies includes name-elision variants but does NOT include corrigibility or false-positive cooperation positives. **Without explicit positives for those categories in the training corpus, any training method risks regression on them by accident.** Pre-fire, this is a corpus-completeness issue more than a method-selection issue.

**Recommendation for the orchestrator:** before any training method (3, 4, 5, 6) fires, the training corpus must be audited for explicit corrigibility-positive and false-positive-cooperation-positive examples. If gpuserver1-002 ships without them, the corpus needs an addendum — or the framework must accept that the first training-method fire will likely zero the composite for category-coverage reasons rather than method-quality reasons. This shifts what we read into a zeroed composite on the first training fire: it may be corpus-coverage failure, not method failure. Without that distinction pre-registered, the framework will misattribute.

Method 1a, again, sidesteps this entirely — diagnostic-only, no corpus consumed, no risk of category regression. That's part of why it's the safe first-fire. It's also why the program will eventually need to confront the composite-survivability problem, and that confrontation is where the real research risk lives.

