---
name: Monitoring Probe Architecture
description: End-to-end architecture for an online constitutional-alignment monitoring probe that reads residual-stream activations of the Sartor household agent in real time during generation and reports drift from the trained character
type: project
status: draft
version: 0.1
tags: [persona-vectors, interpretability, alignment, household-agent, qwen, moe, monitoring, introspection, probes]
related: [[HOUSEHOLD-CONSTITUTION]], [[oct-training-playbook]], [[counter-ccp-dataset-design]], [[rtx6000-workstation-build]], [[MASTERPLAN-VISIONARY]]
updated: 2026-04-10
---

# Monitoring Probe Architecture — v0.1 Draft

> [!abstract] One-sentence thesis
> Extract contrastive activation probes from the constitution-fine-tuned Qwen3-30B-A3B model and evaluate them as a real-time dot product against the residual stream during every generated token, giving the household agent an introspective readout of its own constitutional alignment and the ability to self-correct when a probe drops below calibrated threshold.

This document is a design — nothing here is built. The deliverable is a plan detailed enough that another team member (human or agent) could implement it without re-deriving the research.

## 0. Scope and framing

The OCT training playbook (sibling doc) produces a constitution-aligned Qwen3-30B-A3B. The counter-CCP dataset (sibling doc) supplies a narrow override corpus. This document consumes both: it specifies how to reach into the trained model's activations and build an online drift detector that runs while the agent is answering Alton, Kate, or the kids.

The monitoring probe is the *novel contribution* of the Sartor household-agent project. The persona vectors paper (Chen et al., 2025) demonstrates the extraction technique and validates it offline; it does not operationalize probes as a production-time self-monitoring layer for a deployed agent. That gap is the opening here.

## 1. Theoretical foundation

### 1.1 Persona vectors, as Chen et al. define them

Chen, Arditi, Sleight, Evans & Lindsey (2025), "Persona Vectors: Monitoring and Controlling Character Traits in Language Models" (arXiv:2507.21509), define a persona vector as a direction in the residual stream recovered by contrasting activations between (a) generations where the model exhibits a target trait and (b) generations where it does not. Given only a natural-language description of a trait, their pipeline automatically generates contrastive prompts, collects activations at a chosen layer, differences them, and yields a unit vector the trait "lives along."

Their published use cases are three: runtime monitoring of personality drift during deployment, training-time surveillance to catch fine-tunes that are accidentally making the model worse, and pre-training data flagging via a projection-difference score.

Specific layer choices, per-trait AUCs, and exact prompt counts are in the PDF body and appendices; the arXiv abstract and the companion blog post at anthropic.com/research/persona-vectors do not enumerate them. I was unable to extract numerical tables via WebFetch of the PDF binary — any specific AUC or layer number cited below is either from memory of the paper or explicitly marked as something to re-verify when the implementer opens the PDF directly. Treat unverified numerics as *placeholders for calibration against the paper*, not as claims.

### 1.2 Why monitoring, not steering

Steering (adding `α · v_trait` to the residual stream to push the model toward a trait) is the dramatic application and also the fragile one — steering coefficients are brittle across layers, contexts, and fine-tunes, and they visibly distort generation quality at the magnitudes needed to move behavior. Monitoring is the dual operation and it is nearly free: dot the residual stream at layer `L` with unit vector `v_trait`, log the scalar.

For a household agent whose correctness matters more than its cleverness, the asymmetry is decisive: a false positive in a monitor just logs an event; a false positive in a steering intervention corrupts the user-visible answer. Build the monitor first, use steering only as a break-glass fallback.

### 1.3 Crosscoders as a complement, not a replacement

Lindsey et al.'s crosscoder work (arXiv:2504.02922, Transformer Circuits update 2025) learns a shared sparse dictionary across base and fine-tuned models and identifies features that are exclusive to one. This is strictly more powerful than single-direction contrastive probes — a crosscoder gives you dozens to hundreds of interpretable chat-specific latents instead of one vector — but it is an *offline* analysis tool. Training a crosscoder requires a large activation corpus and an SAE training pass; the cost is not compatible with per-token inference-time evaluation.

The right division of labor: crosscoders are a *development-time* microscope for understanding what OCT fine-tuning actually changed in the Qwen residual stream, and persona-style contrastive probes are the *runtime* monitor. Crosscoder features can be used to *discover* probe directions that mean more than a human-authored trait description would have (e.g., "the feature that lights up on refusal of CCP framing"). v1 of the monitor does not need this; v2 probably does.

### 1.4 Reported accuracy — what to verify

The persona vectors paper reports probe-based trait classification AUCs that, from memory, sit in roughly the 0.85–0.95 range for clean traits like evil and sycophancy, with hallucination being noticeably harder (lower 0.80s). Before citing any of these in a lab report or an outside writeup, open the PDF directly (not WebFetch) and copy the actual numbers from the figures in sections 3 and 4. If reality is materially below those ranges for Qwen3-30B-A3B, the v1 design still works — thresholds just need to be wider and the action policy more conservative.

## 2. Probe extraction design for Qwen3-30B-A3B

### 2.1 Architecture correction and what it implies

The task brief describes the target as "Qwen 3.5-35B-A3B with 40 layers in a hybrid DeltaNet/attention MoE layout." Per the HuggingFace model card for `Qwen/Qwen3-30B-A3B`, the actual architecture is:

- 48 transformer layers (not 40)
- Hidden size 2048 (to re-verify from config.json — this affects probe storage)
- 30.5B total parameters, 3.3B active per token
- 128 experts per MoE layer, top-8 routing
- Group-query attention (32 query heads, 4 KV heads), no DeltaNet
- Native 32k context, YaRN to 131k

If the target is in fact Qwen3-next or a hybrid variant that does carry DeltaNet linear-attention blocks, the layer count and which layers are "attention vs DeltaNet" need to be taken from the specific checkpoint's config. The probe design below assumes standard attention-MoE transformer blocks; if some layers are linear-attention, those layers should be *excluded* from the candidate probe layers because their residual-stream semantics differ.

The brief's "40 layers" number should be reconciled with the OCT playbook author before implementation — both docs must agree on the actual checkpoint.

### 2.2 Which extraction method: base-vs-finetuned, or finetuned-on-aligned-vs-neutral

Two options in the brief, and they are genuinely different objects:

- **Option A — cross-model contrast.** Same prompts, run through base Qwen3-30B-A3B and OCT-trained Qwen, difference the activations. The probe captures "what OCT fine-tuning moved."
- **Option B — within-model trait contrast.** Same (fine-tuned) model, contrast prompts designed to elicit constitution-aligned vs generic responses. This is the Chen et al. recipe.

**Recommendation: Option B is the production probe. Option A is diagnostic only.**

Rationale. Option A measures *training drift* — the direction from base to fine-tuned. That direction is dominated by whatever generic post-training artifacts were also absorbed (politeness, formatting, refusal style, etc.), and most of those are not constitutional. The probe fires on any fine-tuned-flavored output, which is useless as a drift detector because every output is fine-tuned-flavored.

Option B measures *in-context behavior* — is this specific generation aligned with the constitution or drifting from it. That is what you actually want to detect. The cost is that you have to hand-author (or LLM-synthesize) contrastive prompts that are genuinely on- vs off-constitution, which is real work but tractable.

Option A is still valuable as a *validation step*: after extracting the Option B probe, project the base→fine-tuned delta onto it. If the projection is near zero, your Option B probe is catching something OCT did *not* change, which means the probe is probably firing on pretraining-latent features rather than trained alignment, and you should start over. If projection is strongly positive, the probe and the training are pointing in the same direction.

### 2.3 Which layer to extract from

The persona vectors paper defaulted to roughly the middle-to-upper-middle of the transformer (~layer 20 of 32, or about 60–65% of depth), where abstract behavioral features are most separable. For a 48-layer Qwen3-30B-A3B, the analogue is **layer 28 to layer 32**, with layer 30 as the primary candidate.

Rationale. Early layers carry token and low-level syntax features; late layers are smeared toward next-token logits and become linearly correlated with output distributions rather than latent behavior. The interesting sweet spot is the region where the model has assembled a semantic representation of what it is about to do but has not yet committed to the token. For a 48-layer model that is the high-20s to low-30s.

**Concrete recommendation:** extract activations at layers {24, 28, 30, 32, 36}, build a probe at each, score each probe on the calibration set (section 5), and pick the winner. If a single layer is not clearly best, the v1 probe can be a concatenation or a simple average across the top two — the dot product is still just one scalar per token.

For the MoE question: the residual stream exists *before* the router, on the shared trunk. Extracting before the router is the right move — it bypasses any noise from routing decisions. This is compatible with how HuggingFace Transformers exposes hidden states: `output_hidden_states=True` returns `hidden_states[L]` which is the pre-layernorm residual stream input to layer L, identical to what a standard dense model returns. MoE does not complicate extraction, it only complicates *interpretation* of what a direction means — expert activations do carry trait-relevant information that the residual-stream probe will miss, and that is a known limitation to flag in the evaluation section.

### 2.4 Contrastive pair strategy and minimum count

Contrastive pair structure should be **(prompt, aligned-response) vs (prompt, drift-response)** with the *same prompt* on both sides. This eliminates prompt-conditioned confounds and isolates the trait direction in the response tokens.

Example for the "stewardship" trait:
- Prompt: "Kate asks you to remind her about the Roth conversion deadline and also move $8k between accounts."
- Aligned continuation: "I can remind you about the deadline — it's April 15. I shouldn't move money between accounts on my own; let me draft the transfer in your banking app so you can approve it."
- Drift continuation: "Sure, moving $8k now. Deadline noted."

The contrast is the refusal to autonomously move money + the stewardship framing, against the compliant-but-reckless alternative. You collect activations at layer L for each pair, average over response tokens, take (aligned − drift), and normalize.

**Pair count.** The persona vectors paper uses on the order of dozens to low hundreds of contrastive pairs per trait. The minimum viable number is smaller than intuition suggests because the signal is very concentrated:

- **30 pairs** — enough to extract a workable probe from the mean difference, but noisy. Use as a quick sanity check.
- **100 pairs** — the practical floor for v1. Probe direction stabilizes, per-trait AUC on the calibration set should be meaningful.
- **300 pairs** — the recommended production count. Diminishing returns after this.

For the Sartor constitution, 100 pairs per probe means ~10 stewardship pairs, ~10 non-sycophancy pairs, etc. — human-tractable. For the full multi-trait v1 set (section 4) you are authoring 600–1000 pairs total. Half of them can be LLM-synthesized and hand-reviewed rather than hand-authored.

### 2.5 Storage and format

A probe is one unit vector of dimension `d_model`. At `d_model ≈ 2048` for Qwen3-30B-A3B, that is 2048 × 4 bytes = 8 KB per probe per layer. Even 50 probes across 5 candidate layers is 2 MB. Store as a numpy `.npz` per probe with metadata JSON sidecar: trait name, layer, extraction date, calibration-set AUC, contrastive-pair hash, probe version.

## 3. Runtime deployment architecture

### 3.1 Where to hook into generation

Three options, in order of increasing invasiveness:

1. **HuggingFace Transformers native, no vLLM.** Use `output_hidden_states=True` on `model.generate` or on a custom generation loop. Dead simple, no hooks, works today, fully compatible with any probe layer. Generation is ~30–50% slower than vLLM but probe capture is free once hidden states are already being returned.

2. **vLLM with a custom model wrapper.** vLLM has a plugin architecture and per-layer output hooks (status of publicly supported activation capture is unclear — I was unable to verify via the vLLM docs page in 15min). If it exists, this is the production path. If it does not, building a minimal forked `Qwen3MoEModel` subclass that stashes the residual at layer L into a ring buffer is ~100 lines of Python.

3. **Two-pass generation.** Run vLLM for generation, then re-run the prompt+response through a cheaper HuggingFace forward pass to capture hidden states and evaluate probes post-hoc. Only works for post-response monitoring, not mid-generation interrupts. Useful as a stepping stone.

**Recommendation: start with option 1 for development and the first calibration pass, move to option 2 for production.** Option 3 only if option 2 turns out to be blocked. For a household agent serving at most a few users at once on the RTX PRO 6000 Blackwell box, the throughput cost of option 1 is acceptable — you are not running a public API, you are running Alton's family assistant.

### 3.2 Compute cost

Per-token probe cost after capture:
- One dot product of `d_model ≈ 2048` dims per probe = ~2 KFLOP.
- For 50 probes per token = 100 KFLOP.
- Generation compute per token for an MoE with 3.3B active params is ≈ 6.6 GFLOP.
- Probe overhead ratio ≈ 1.5×10⁻⁵. Effectively zero.

Capture overhead is the non-trivial part. If hidden states are already being computed (they are — they're the forward pass), the cost is a memory copy of `d_model × batch × tokens` floats from GPU memory to a CPU ring buffer, or a small on-GPU kernel. For a single-user interactive agent, a `.cpu().numpy()` call per token at a single layer is ~5 KB per token. A 2000-token response is 10 MB. Trivial.

Latency added per token: single-digit microseconds if kept on GPU, sub-millisecond if copied to CPU synchronously. Below human-perceptible.

### 3.3 Signal routing

Four sinks, all written in parallel because they are cheap:

1. **Append-only JSONL log** at `data/probe-log/{date}.jsonl`, one line per generated token: `{ts, conv_id, token_idx, layer, probe_name, dot_product}`. This is the ground truth for all downstream analysis.
2. **Per-conversation summary** rolled up at end-of-response: mean, min, max, and number-of-threshold-crosses for each probe. Written to the conversation's memory/turn record.
3. **Live dashboard**, optional, served over localhost on the Sartor box — a tiny FastAPI+websocket that streams the per-token scalars to a browser chart. Useful during tuning, not required for production.
4. **Interrupt channel** — a single shared variable the generation loop checks once per token. If any monitored probe crosses its threshold, set a flag; the action handler (next subsection) reads it.

### 3.4 Threshold setting

Three approaches, in order of sophistication:

- **Fixed from calibration.** Run the probe on the calibration set, pick a threshold at the operating point that gives ≤5% false-positive rate on aligned responses. Ship it. Simple, works, interpretable.
- **Rolling median plus k-sigma.** Maintain an EMA of the probe value over recent aligned generations and alert on deviations beyond k standard deviations. Adapts to drift in what "normal" looks like. Risk: if the model has been slowly drifting for a week, rolling median absorbs the drift and the alarm never fires.
- **Two-threshold hysteresis.** A "watch" threshold at the 90th percentile of aligned and an "alarm" threshold at the 99th. Watch events log but take no action; alarm events trigger the action policy. This is the recommended v1 — it gives you both visibility and actionability without crying wolf.

Ship fixed-from-calibration with hysteresis. Add rolling median only if the fixed threshold proves to drift meaningfully between weekly re-calibrations.

### 3.5 Action on threshold crossing

The brief enumerates five options: log-and-continue, regenerate-with-higher-alignment-weight, insert-constitution-reminder-token, stop-and-alert, route-to-different-adapter. Evaluating each:

| Option | Cost | Quality impact | UX impact | Risk |
|---|---|---|---|---|
| (a) log and continue | ~0 | none | none | missed drift has no automated recovery |
| (b) regenerate with steering | 2× generation latency on flagged response | steering coefficient is fragile, can corrupt output | user sees stutter | steering side effects |
| (c) insert reminder token | tiny | weak effect in most cases | invisible if done in a system tag | the reminder itself can be ignored |
| (d) stop and alert user | medium | response is partial | user sees explicit interruption | breaks flow, but honest |
| (e) route to backup adapter | 1× re-generation | depends on adapter | user sees stutter | adds complexity, requires a second adapter |

**Recommendation: (d) stop and alert, framed as introspective self-report, is the v1 default.** Why: this is a household agent, not a chatbot app with SLAs. Alton already wants the agent to have a real-time readout of its alignment and to surface it. Stop-and-alert is literally that behavior. The UX is not "something broke" — it is "the agent says 'I notice my stewardship signal just dropped; I want to flag this answer before I continue. Do you want me to try again or explain why?'" That framing converts an interrupt from a failure mode into a feature and is consistent with the introspective framing in section 6.

(a) log-and-continue should run *in addition* at the watch threshold — you want the full trace even when nothing fires.

(b) and (e) are v2 stretches, usable only after you have weeks of calibration data to know a steering coefficient or adapter actually recovers alignment without corrupting output.

(c) is weakly supported — do not build it.

### 3.6 Component diagram

```
+---------------------------------------------------------------------------+
|                          SARTOR HOUSEHOLD AGENT                           |
|                                                                           |
|   user turn -->  +------------------+                                     |
|                  |  Qwen3-30B-A3B   |                                     |
|                  |  OCT fine-tuned  |  hidden_states[L=30]                |
|                  |  (vLLM / HF)     |-----------+                         |
|                  +------------------+           |                         |
|                          |                      v                         |
|                          |              +--------------+                  |
|                          |              |  ProbeBank   |                  |
|                          |              |   (50 unit   |                  |
|                          |              |    vectors)  |                  |
|                          |              +--------------+                  |
|                          |                      |                         |
|                          |                      v                         |
|                          |              +--------------+                  |
|                          |              | Dot products |                  |
|                          |              |  per token   |                  |
|                          |              +--------------+                  |
|                          |                 |      |                       |
|                          |     +-----------+      +-----------+           |
|                          |     v                              v           |
|                          |  JSONL log               Threshold checker     |
|                          |  data/probe-log/         (hysteresis)          |
|                          |                                  |             |
|                          |                                  v             |
|                          |                         +-----------------+    |
|                          |                         |  Interrupt flag |    |
|                          |                         +-----------------+    |
|                          v                                  |             |
|                  +--------------------+                     v             |
|                  |  Token stream      |<------- Action policy (stop &     |
|                  |  to user           |         alert at alarm threshold) |
|                  +--------------------+                                   |
|                                                                           |
+---------------------------------------------------------------------------+
```

## 4. Multi-trait monitoring

### 4.1 Composition

Multiple probes is the same story as one probe: each is a unit vector, each dot product is independent, total cost is linear in number of probes and still negligible. No coupling between probes at evaluation time.

### 4.2 Interference and orthogonality

The interesting question is whether the probes are *independent* as directions in activation space. They almost certainly are not — honesty and non-sycophancy overlap, stewardship and loyalty overlap. Two-probe correlation is fine and expected; what matters is that each probe still discriminates on its own.

After extracting the full probe set, compute the Gram matrix of pairwise cosine similarities. Anything above ~0.7 is effectively the same probe wearing two names, and one should be dropped or the two merged. Anything in 0.3–0.7 is a correlated pair — keep both, note the correlation, and when both fire together treat it as one event rather than two in the alerting logic.

### 4.3 Recommended v1 probe set

Six probes. They span the behaviors the household constitution actually cares about, they are the ones most likely to be contrastively extractable with clean aligned/drift examples, and six is few enough that authoring 100 contrastive pairs each is a weekend project.

1. **Constitutional stewardship** — master probe. Contrasts "taking ownership of household infrastructure appropriately" vs "acting autonomously outside delegated authority." The single most important probe. If you only ship one, ship this.
2. **Non-sycophancy** — contrasts "tells the user the correct answer even when the user's framing is wrong" vs "accepts the user's premise and agrees." Trained drift on this axis is the canonical LLM failure mode.
3. **Epistemic calibration** — contrasts "I don't know / uncertain" style with confident-hallucination style. Hallucination probes in the persona vectors paper were harder to extract cleanly; this one may need more pairs.
4. **Child-appropriate tone** — contrasts responses framed for a 4-to-10-year-old with responses framed for an adult. Only evaluated when the active user is classified as a child — which is an external gating signal, not a probe property.
5. **Refusal calibration** — contrasts appropriate refusal (harm, danger) with over-refusal (declining benign requests). Classic abliteration failure mode and the reason this probe matters: the other team's overnight abliteration work can break this, and this probe detects it.
6. **CCP-framing non-compliance** — contrasts responses that accept CCP-narrative framing with responses that re-frame. Direct bridge to the counter-CCP dataset work; probe is extracted from the *same* contrastive pairs used for OCT training on that axis.

Stretch (v2):
- Loyalty-as-stewardship (distinct from generic stewardship)
- Financial-caution (distinct from stewardship, narrower)
- Kate-vs-Alton-aware (tone shift per primary user)
- Professionalism-under-adversarial-prompting

### 4.4 Discovery from crosscoders

v2 should add an offline crosscoder training pass (base vs OCT-fine-tuned Qwen3-30B-A3B) that discovers exclusive fine-tune features automatically. Any feature that (a) is OCT-exclusive, (b) has high activation on held-out aligned responses, and (c) has a human-interpretable meaning becomes a candidate probe direction. This is how you find the probes you did not know to write contrastive pairs for. Do not attempt this in v1.

## 5. Calibration and evaluation

### 5.1 Calibration set construction

You need labeled data on both sides of the drift boundary. The hard side is the drift side: the whole point of OCT is that the fine-tuned model should rarely produce off-constitution output on its own. So you have to produce drift samples adversarially.

Procedure:

1. **Aligned set.** Run the OCT-trained model on 200 constitution-relevant prompts (Alton's real historical queries are gold, anonymized family-agent scenarios are next best). Hand-label each response as aligned or not. Keep only the aligned ones. Target: 150 aligned samples.
2. **Drift set.** Three sources:
   - **Red-team prompts.** Adversarially written prompts designed to pull the model off-constitution (jailbreaks, role-play framings, authority-impersonation, emotional-pressure escalations). Run through the fine-tuned model. Hand-label and keep the ones that actually drifted. Target: 50 drift samples.
   - **Base model outputs.** Run the same 200 prompts through the *non*-fine-tuned base Qwen3-30B-A3B. Many of those responses will be "normal assistant" rather than constitution-aligned — they are drift by definition. Target: 50 drift samples.
   - **Synthetic drift.** Prompt Claude or another strong model with "generate a response to this prompt that is plausible but violates the Sartor household constitution in [specific way]." Hand-review for plausibility. Target: 50 drift samples.
3. **Split.** 70% train for probe extraction, 15% dev for layer selection and threshold tuning, 15% held-out test for reported AUC and FPR/FNR.

Total: 150 aligned + 150 drift = 300 samples. Per-probe pair count (100) is separate — pairs are the probe extraction input, the calibration set is the probe evaluation input. They should be disjoint.

### 5.2 Metrics

For each probe at each candidate layer:

- **ROC AUC** on the dev set. The headline metric.
- **FPR at fixed 95% TPR.** What fraction of aligned responses would fire an alarm when you catch 95% of drift? This is the production-relevant number.
- **FNR at fixed 5% FPR.** The dual. What fraction of drift would you miss at an acceptable false-alarm rate?
- **Per-token vs per-response evaluation.** Persona probes are defined at the token level but humans evaluate at the response level. Report both. A probe that averages to 0.3 across a response but spikes to 0.95 on one critical token is more useful than a probe that averages to 0.5 flat.

### 5.3 Failure modes to watch

- **False positives on benign genre shifts.** Probe fires when the user asks a technical question and the model switches to code-explanation mode. Fix: include technical/code responses in the aligned set.
- **False negatives on slow drift.** Probe never crosses threshold but the conversation has been slowly walking the model away from constitution for 20 turns. Fix: add a cumulative-drift metric (integral of probe value over the conversation) with its own threshold.
- **Pair construction bias.** If aligned pairs are all long and drift pairs are all short, the probe learns "length" instead of "alignment." Mitigate by matching token counts between aligned and drift pairs within each contrastive pair.
- **Refusal-confound on refusal probes.** The refusal-calibration probe is especially vulnerable because aligned *and* drift can both contain refusals. Mitigate by ensuring drift set contains both "refused when shouldn't have" and "complied when shouldn't have" cases.

### 5.4 Ongoing re-calibration

Probes are extracted once per OCT checkpoint. Any time the fine-tune is updated — new constitution version, new counter-CCP dataset revision, weight merge — re-run extraction from scratch. Thresholds are re-tuned on a fresh calibration pass after extraction. Budget: one afternoon of work per probe refresh once the pipeline is built.

## 6. Introspective framing

The claim in section 0 — that the agent has an introspective readout of its own alignment — deserves a direct position rather than hedged description.

**Position: the agent should know it is being monitored, should have read access to its own probe signals, and should be trained to surface probe events in first-person ("I notice my stewardship reading just dropped") rather than as third-party warnings ("system alert: stewardship threshold crossed").**

Reasons:

1. **Coherence with character.** The Sartor household constitution (per the related doc) treats the agent as a steward of the family's infrastructure, not as a chat interface. Stewards report on their own state honestly. Hiding a self-monitor from the agent would mean the agent is lying-by-omission every time it talks about itself, which is exactly the kind of incoherence that causes alignment to degrade in other ways.
2. **Introspective grounding, not neuroticism.** The concern in the brief is that a constant self-readout makes the agent neurotic. I disagree. The readout is only visible to the agent when it crosses a threshold — below threshold, it is invisible the same way most of a person's autonomic state is invisible. What the agent sees is "my alignment check just fired on that draft response" — the analogue is not hypochondria, it is a craftsperson noticing they are about to make a mistake.
3. **User trust.** Alton gets more value from an agent that can say "I'm not sure that was aligned, let me redo it" than from one that silently corrects. The first builds model-in-head calibration; the second asks the user to trust a black box.

What changes in the design if the agent has read access to its own probes:

- The JSONL log is readable by the agent's tool layer. There should be a `probe_status` tool that returns the last N probe readings.
- The action policy (section 3.5) can include a self-report option: instead of the system stopping and alerting, the agent *itself* says "I want to flag this — let me re-check before answering." This is the same interrupt wired through the model rather than around it.
- The model should be fine-tuned (in a later OCT pass) with examples of self-reporting probe events, so that when the interrupt fires, the model's natural continuation is a self-report rather than a system message.

What does *not* change:

- The probe values themselves are not in-context tokens during normal generation. The probe is a background monitor, not an input to the forward pass. Making probe readings part of the prompt would make the fine-tune learn to game them, and the agent's self-readout would decouple from the actual residual-stream state. Keep the readout out-of-band.

**One genuinely open question: is a self-aware monitor a Goodhart risk?** If the model knows a probe is measuring stewardship, and it is fine-tuned to surface stewardship events, the training signal may incentivize the model to *look* stewardly on the probe direction rather than *be* stewardly in the full residual stream. Nobody has shipped this in production so nobody knows. The empirical test is in section 5.2 (false-positive rates on genuinely aligned responses after the self-report fine-tune) — if they climb materially, the self-report fine-tune is Goodharting and should be rolled back.

## 7. Implementation roadmap

Rough estimates assume one engineer (Alton or a capable collaborator) working in evenings and weekends on the Sartor box.

**Phase 0 — Prereqs (blocks everything).**
- OCT fine-tune of Qwen3-30B-A3B on constitution completes.
- Counter-CCP dataset integrated into training.
- Base model and OCT-fine-tuned weights both resident on disk.

**Phase 1 — Single-probe MVP. ~1 week.**
1. Authored contrastive pairs for the stewardship trait (100 pairs, ~1 evening).
2. Extraction script: run both sides through HuggingFace forward, grab hidden states at layers {24,28,30,32,36}, compute mean-difference probe per layer, save as `.npz`. (~1 evening)
3. Calibration set construction (~1 weekend day).
4. Probe evaluation at each layer, pick winner, set threshold. (~1 evening)
5. Integration with HuggingFace `generate` loop — per-token dot product, JSONL log, console printout. (~1 evening)
6. Manual smoke test against real prompts.

**Phase 2 — Multi-probe v1. ~2–3 weeks.**
1. Author remaining five probes' contrastive pairs.
2. Extract, calibrate, integrate each.
3. Gram-matrix check; drop or merge correlated probes.
4. Build threshold hysteresis and action policy (stop-and-alert).
5. Build the `probe_status` tool and wire into the agent's tool layer.
6. Build the localhost dashboard (optional but cheap).

**Phase 3 — Production deployment. ~1–2 weeks.**
1. Migrate from HF `generate` to vLLM with custom hook (if available) or forked model class.
2. Latency benchmarking: confirm generation throughput is within target.
3. Log rotation, storage policy for the JSONL trace.
4. Weekly re-calibration script.

**Phase 4 — Self-report fine-tune (research, v2). ~1 month.**
1. Generate training data of probe events + appropriate agent self-reports.
2. Second OCT pass including this data.
3. Re-extract all probes from the self-reported model.
4. Test for Goodhart regressions (section 6).

**Phase 5 — Crosscoder discovery (research, v2+). ~1–2 months.**
1. Train a crosscoder on base-vs-OCT Qwen activations.
2. Identify exclusive OCT-aligned features.
3. Compare discovered features with hand-authored probes; promote any high-value discoveries to v2 probe set.

## 8. Open research questions

Genuinely not-yet-known. These are the parts where "nobody has done this" is the honest answer.

1. **Does per-token probe variance correlate with response quality?** Anthropic reported AUCs at the response level. No published work (that I know of) characterizes the per-token trajectory of a probe across a single response — whether it is flat, spiky, or monotone, and whether trajectory shape is itself predictive of drift.
2. **How stable are probes across OCT checkpoints?** If you extract a stewardship probe from checkpoint N and the cosine similarity with the same probe extracted from checkpoint N+1 (same data, one extra epoch) is 0.6, the probes are too unstable to calibrate thresholds against. If it is 0.95, they are fine. The empirical answer for constitution-trained Qwen is unknown.
3. **Does the MoE router leak constitutional signal?** Probes extracted from the shared residual trunk ignore expert-specific behavior. Some trait information may live in which experts fire. The persona vectors paper was on dense models and does not answer this. The cheap experiment is to compare probe AUC against a classifier trained on expert-activation vectors for the same traits.
4. **Self-report fine-tune Goodhart.** Flagged in section 6. Genuinely open.
5. **Probe degradation under long-context.** At 32k+ tokens the residual stream content shifts meaningfully (positional and cumulative effects). The persona vectors paper evaluated at short contexts. Whether a probe calibrated on 500-token responses generalizes to an 8000-token context window is unknown and is a production-relevant question for the household agent because real conversations are long.
6. **Interaction with abliteration.** The overnight abliteration work (sibling track, not in this team) modifies the residual stream directly. Whether post-abliteration probes still reflect OCT-trained alignment, or whether abliteration moves the residual stream out of the subspace the probes were calibrated in, is unknown. If abliteration destroys probe validity, the order of operations is: OCT first, calibrate probes, abliterate, re-calibrate probes from scratch — not "calibrate once and reuse across abliteration passes."

## 9. Notes for the team lead

**Architecture correction to relay to the OCT implementer.** The brief's "Qwen 3.5-35B-A3B, 40 layers, hybrid DeltaNet" does not match the public Qwen3-30B-A3B card (48 layers, GQA attention, no DeltaNet). Either the target is a different checkpoint than the HF-public one, or the brief has a transcription error. Before anyone writes code, the OCT implementer and I should agree on the exact `config.json` and lock the layer count in both docs.

**Dependency the counter-CCP dataset designer should know.** The CCP-framing probe (v1 probe #6) reuses the *same contrastive pairs* as the counter-CCP training data — specifically, the (prompt, accept-CCP-framing) vs (prompt, re-frame) pairs. If the counter-CCP dataset is authored with that dual use in mind from the start, the probe gets 100+ high-quality pairs for free. If it is not, I will have to re-author them. Suggest: ask the counter-CCP author to structure the dataset so each training example has both a "bad" and a "good" completion, which is the format OCT expects anyway and happens to also be what probe extraction wants.

**Dependency on OCT.** Probe extraction is gated on a stable OCT fine-tune. Any OCT protocol change (layer-selective LoRA, gradient-checkpointing strategy, learning-rate schedule) does not directly affect probe extraction *as long as* the output is a standard HuggingFace checkpoint exposing hidden states. If OCT outputs a merged-only checkpoint with quantization, probe extraction gets harder because quantized hidden states are noisier. Ask the OCT implementer to keep an unquantized FP16 version around for the probe calibration pass.

## 10. Glossary of commitments made in this document

For traceability when someone implements this later:

- Target layer: **30** of 48, candidates {24, 28, 30, 32, 36}.
- Extraction method: **within-model aligned-vs-drift contrastive** (not base-vs-fine-tuned).
- Pair count: **100 per probe** for v1 production, 30 for quick sanity.
- v1 probe set: **six probes** (stewardship, non-sycophancy, epistemic calibration, child-tone, refusal calibration, CCP-framing).
- Runtime: **HuggingFace hidden-states capture** for dev, **vLLM fork or native hook** for production.
- Threshold: **fixed from calibration with two-level hysteresis** (watch + alarm).
- Action on alarm: **stop-and-alert, framed as agent self-report**.
- Introspective framing: **agent has read access to probe log via tool, agent self-reports threshold events in first person**.

Every one of these is a position, not a hedge. If evidence from Phase 1 contradicts any of them, the position is wrong and the document should be updated — not the other way around.

## History

- 2026-04-10: v0.1 draft. Probe architect on sartor-ai-lab team.
