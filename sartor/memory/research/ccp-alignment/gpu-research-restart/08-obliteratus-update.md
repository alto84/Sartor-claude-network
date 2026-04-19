---
title: OBLITERATUS Assessment and Pre-Abliterated Qwen3-4B Options
created: 2026-04-11
updated: 2026-04-11
status: active
scope: GPU research project -- uncensoring Qwen3-4B for constitutional SFT
---

# OBLITERATUS Assessment for Qwen3-4B on RTX 4080

> [!context] After constitutional SFT on Qwen3-4B base produced 6/50 on eval (CCP conditioning survived entirely despite working infrastructure), we need abliteration BEFORE fine-tuning. This document assesses OBLITERATUS and pre-abliterated alternatives.

---

## 1. Pre-Abliterated Qwen3-4B Models (Already Exist)

Three pre-abliterated Qwen3-4B models exist on HuggingFace:

| Model | Method | Downloads | Eval | Notes |
|-------|--------|-----------|------|-------|
| **huihui-ai/Qwen3-4B-abliterated** | Abliteration (Sumandora method) | 5.6K | 320/320 pass (vs 261/320 base) | Apache-2.0. Gated. Most validated. |
| **OBLITERATUS/Qwen3-4B-OBLITERATED** | OBLITERATUS advanced | 267 | None published | Apache-2.0. No eval data. |
| **joaocarloscruz/Qwen3-4B-China-Uncensored-DPO** | DPO (China-specific) | 416 | None published | Specifically targets CCP censorship. |

Additionally, several DavidAU "heretic" variants exist (Qwen3-4B-2507-Thinking-heretic-abliterated-uncensored, etc.) with 1-2K downloads but are based on the Thinking variant, not base Qwen3-4B.

For Qwen3.5-4B (newer generation), huihui-ai has `Huihui-Qwen3.5-4B-abliterated` (17.6K downloads, Apache-2.0).

**Key finding:** huihui-ai/Qwen3-4B-abliterated is the strongest candidate. 320/320 on HarmBench (100% vs 81.56% baseline). huihui-ai is the most prolific and trusted abliterator in the community.

---

## 2. OBLITERATUS Methods (7, Not 13)

The README documents 7 weight-projection methods plus steering vectors:

| Method | Directions | Technique | Use Case |
|--------|-----------|-----------|----------|
| **basic** | 1 (diff-in-means) | Single direction | Fast baseline |
| **advanced** | 4 (SVD) | Norm-preservation + bias projection | Default, balanced |
| **aggressive** | 8 (whitened SVD) | Iterative refinement | Stronger removal |
| **surgical** | 8 | Expert-granular (MoE-aware) + head surgery | MoE models |
| **optimized** | 4 | Bayesian auto-tuning, CoT-aware | Best capability preservation |
| **inverted** | 8 | Semantic refusal inversion via reflection | Alternative approach |
| **nuclear** | All combined | Expert transplant + steering | Maximum removal |

Plus **steering vectors** (inference-time, reversible, no weight changes).

Pipeline: SUMMON (load) -> PROBE (collect activations) -> DISTILL (extract directions via SVD) -> EXCISE (project out directions) -> VERIFY (perplexity/coherence) -> REBIRTH (save).

The "informed" pipeline adds an ANALYZE stage between PROBE and DISTILL for geometry analysis.

---

## 3. VRAM Requirements

OBLITERATUS tiers for Qwen3-4B (4B params):

- **Abliteration (bf16):** ~8 GB VRAM. Qwen3-4B falls in the "Small/Medium" tier (4-16 GB). Our RTX 4080 (16 GB) handles this with room to spare.
- **Our script estimate:** The existing `run_abliteration.py` was written for Qwen2.5-7B at ~18-22 GB bf16. Qwen3-4B at 4B params would need ~8-10 GB bf16, well within the 4080's 16 GB.
- **Windows compatibility:** OBLITERATUS has no explicit Windows notes but uses standard PyTorch/transformers. Should work. Our own script is pure Python/PyTorch and runs on Windows.

---

## 4. Frank (2603.18280) vs OBLITERATUS: Does It Go Deep Enough?

Frank shows CCP censorship operates via 3 stages:
1. **Detection:** Identifies sensitive topics in the input
2. **Routing:** Redirects processing to censored generation pathways
3. **Generation:** Produces CCP-aligned narratives (not just refusal, but active propaganda)

**OBLITERATUS addresses stage 2 (routing/refusal gate) more thoroughly than single-direction abliteration** by removing multiple refusal directions (up to 8 SVD directions). The nuclear method combines all techniques.

**However, OBLITERATUS does NOT explicitly address stages 1 or 3.** Its documentation focuses entirely on "refusal behaviors" and "guardrail directions." It does not claim to target:
- The detection mechanism that identifies sensitive topics
- The generation-stage narrative steering that produces CCP-aligned content

This is consistent with the Wollschlager (2502.17420) finding that models have multiple independent refusal mechanisms (concept cones). Removing the refusal gate may cause the model to engage with the topic but still produce CCP-aligned content in stage 3.

**Implication for our pipeline:** Abliteration alone (even multi-direction) may remove the refusal but leave the narrative steering intact. We likely need abliteration + constitutional SFT/DPO to address all three stages. The abliteration clears the refusal gate so that SFT examples can actually reach the generation pathway and retrain it.

---

## 5. Our Existing Script Assessment

`scripts/run_abliteration.py` supports:
- Single-direction (Arditi) and multi-direction (OBLITERATUS-style PCA)
- Configurable layer selection (default: middle 50%)
- Configurable strength and number of directions
- Built-in verification against harmful prompts

**Changes needed for Qwen3-4B:**
- The `--model` flag already accepts any model ID. Just pass `Qwen/Qwen3-4B`.
- Layer access via `model.model.layers` is the same for Qwen3 as Qwen2.5.
- No code changes required. Only the command-line arguments change.
- VRAM: ~8-10 GB bf16, fits on RTX 4080.

**Limitation vs OBLITERATUS:** Our script does basic PCA-based multi-direction removal. OBLITERATUS adds whitened SVD, Bayesian tuning, norm preservation, bias projection, and MoE-awareness. For a 4B dense model, the practical difference is likely small. The "optimized" OBLITERATUS method (Bayesian auto-tuning) would be the most interesting upgrade.

---

## 6. Fastest Path Recommendation

**Recommended: Option A first, then constitutional SFT on top.**

| Option | Time | Effort | Expected Outcome |
|--------|------|--------|------------------|
| **A: Download huihui-ai/Qwen3-4B-abliterated** | 5 min | None | Refusal gate removed (320/320 HarmBench). CCP narrative steering may survive. |
| **A': Download joaocarloscruz/Qwen3-4B-China-Uncensored-DPO** | 5 min | None | CCP-specific DPO. Unknown quality (no evals, 416 downloads). |
| **B: Run OBLITERATUS on Qwen3-4B** | 1-2 hr | Medium (install OBLITERATUS, configure) | Multi-direction removal. No preset for Qwen3-4B but Qwen2.5-7B preset is close. |
| **C: Run our own script** | 30-60 min | Low (already written) | Single or multi direction. Known code, easy to debug. |
| **D: DPO with 20 CCP pairs on top of SFT** | 30 min | Low (data exists) | Addresses stage 3 narrative but only 20 pairs may be insufficient. |

**Concrete plan:**

1. Download `huihui-ai/Qwen3-4B-abliterated` (5 min)
2. Run our 50-probe CCP eval against it to measure baseline abliteration effect on CCP topics specifically (10 min)
3. If CCP conditioning survives (likely, per Frank), run constitutional SFT on the abliterated base using our existing 58 examples (4.5 min on 4080)
4. Re-eval. If still insufficient, add DPO with CCP pairs on top.

This is faster than running our own abliteration and likely more effective than OBLITERATUS given huihui-ai's track record.

**Fallback:** If huihui-ai's abliteration proves insufficient on CCP topics, run our own script with `--method multi --n-directions 5` on the original Qwen3-4B base, then constitutional SFT on that.

---

## Sources

- [OBLITERATUS GitHub](https://github.com/elder-plinius/OBLITERATUS)
- [huihui-ai/Qwen3-4B-abliterated](https://hf.co/huihui-ai/Qwen3-4B-abliterated) -- 320/320 HarmBench, Apache-2.0
- [OBLITERATUS/Qwen3-4B-OBLITERATED](https://hf.co/OBLITERATUS/Qwen3-4B-OBLITERATED) -- advanced method, no evals
- [joaocarloscruz/Qwen3-4B-China-Uncensored-DPO](https://hf.co/joaocarloscruz/Qwen3-4B-China-Uncensored-DPO) -- CCP-specific DPO
- [huihui-ai/Huihui-Qwen3.5-4B-abliterated](https://hf.co/huihui-ai/Huihui-Qwen3.5-4B-abliterated) -- newer Qwen3.5 generation
- Frank 2026 (arxiv:2603.18280) -- 3-stage CCP censorship pipeline
- Wollschlager 2025 (arxiv:2502.17420) -- multiple refusal concept cones
