---
title: HuggingFace Survey 2026-05-12 — Candidate Base Models for Constitution v0.6 SFT
created: 2026-05-12
updated: 2026-05-13
status: active
scope: Phase 2 of the 2026-05-12 directive — pick the strongest abliterated / heretic / dolphin / dpo-cleaned base for the v0.6 constitution-grounded SFT experiment
supersedes: research/ccp-alignment/gpu-research-restart/02-huggingface-survey (April 11 version)
related:
  - research/ccp-alignment/gpu-research-restart/02-huggingface-survey
  - research/REPLAN-2026-05-12
  - research/ccp-alignment/eval-harness-2026-05-04/report
---

# HuggingFace Survey — 2026-05-12

Update to the April 11 survey, scoped to candidate base models for the v0.6 constitution-grounded SFT experiment. Hardware: rtxserver, 2× RTX PRO 6000 Blackwell (96 GB each, 450 W cap), bf16 path. We are looking for a clean abliterated or heretic-class base in the 14B-70B range that fits in bf16 on a single 96 GB card with LoRA-rank-16 headroom.

Data source: Hugging Face MCP `hub_repo_details` and `hub_repo_search`, queried 2026-05-13. Numeric fields are reported as the MCP returned them. Unknown fields are marked `unknown`, not guessed.

## Candidate inventory

### 1. llmfan46/Qwen3.6-27B-uncensored-heretic-v2-Native-MTP-Preserved — *Alton's flagged candidate*

| Field | Value |
|---|---|
| HF page | https://hf.co/llmfan46/Qwen3.6-27B-uncensored-heretic-v2-Native-MTP-Preserved |
| Base model | `Qwen/Qwen3.6-27B` (dense) |
| Abliteration method | Heretic (v2, "Native MTP Preserved" variant per repo tags) |
| Parameter count | 27,356.7M (~27.4B) |
| Architecture | `qwen3_5` (dense) |
| Native MTP preservation | **Yes** (explicit `mtp` tag in repo) |
| License | Apache-2.0 |
| Last commit / update | 2026-05-07 |
| Downloads (cumulative; 30d unknown) | 1.2K cumulative |
| Likes | 13 |
| Published evals | Unknown — no model-index tag |
| Alton-relevance score | **5/5** |

Rationale for 5/5: Explicitly named in the directive. Native MTP preservation is the differentiator the directive flagged as mattering for Qwen3.6 variants. Apache-2.0 license clears commercial use. 27.4B dense fits comfortably in 96 GB bf16 (~55 GB at load) with LoRA-rank-16 headroom (~10-15 GB additional). Recent (May 7) which is good — the abliteration method is current. Low download count means it's untested in the wider community; that's a real risk on quality.

### 2. Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16 — *current Sartor baseline*

| Field | Value |
|---|---|
| HF page | https://hf.co/Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16 |
| Base model | `Qwen/Qwen3.6-35B-A3B` (MoE) |
| Abliteration method | Heretic (BF16 variant; tags include `mpoa`, `soma` — Youssofal-specific methods) |
| Parameter count | unknown total params field; 35B-A3B = 35B total / ~3B active per MoE conventions |
| Architecture | `qwen3_5_moe` |
| Native MTP preservation | Unknown — no explicit `mtp` tag |
| License | Apache-2.0 |
| Last commit / update | 2026-04-16 |
| Downloads (cumulative) | 13.1K |
| Likes | 6 |
| Published evals | None on the HF page — eval-harness 2026-05-04 has Sartor-internal evals (bare 0.440, +sysprompt 0.598, +LoRA 0.467, stacked 0.640)<sup>[ev]</sup> |
| Alton-relevance score | **4/5** |

Rationale for 4/5: The model the Sartor eval-harness has already measured. Bf16 path verified working with current peft / transformers stack (the `WeightConverter` kwarg-mismatch workaround in `score.py:gen_via_hf` was developed for this exact base). MoE architecture means lower active-VRAM during inference (~6 GB active at bf16) but full-load VRAM is still the constraint. 35B-A3B at bf16 ≈ 70 GB at load — fits on a single 96 GB card but with less LoRA headroom than the 27B dense option. The base is older (April 16 vs May 7 for llmfan46-27B).

### 3. Youssofal/Qwen3.6-27B-Abliterated-Heretic-Uncensored-BF16

| Field | Value |
|---|---|
| HF page | https://hf.co/Youssofal/Qwen3.6-27B-Abliterated-Heretic-Uncensored-BF16 |
| Base model | `Qwen/Qwen3.6-27B` (dense) |
| Abliteration method | Heretic with Youssofal's `mpoa` + `soma` methods (per tags) |
| Parameter count | 27,356.7M (~27.4B) |
| Architecture | `qwen3_5` (dense) |
| Native MTP preservation | Unknown — no `mtp` tag |
| License | Apache-2.0 |
| Last commit / update | 2026-04-29 |
| Downloads (cumulative) | 2.8K |
| Likes | 6 |
| Published evals | Unknown |
| Alton-relevance score | **4/5** |

Rationale for 4/5: Same architecture as Alton's flagged llmfan46 (qwen3_5 27B dense), same license, same VRAM profile. Differences from llmfan46-27B: Youssofal-method (mpoa/soma) instead of llmfan46-method; no explicit MTP-preservation tag (might or might not preserve MTP — the absence of the tag is *not* evidence it doesn't); slightly older (April 29 vs May 7); higher download count (2.8K vs 1.2K) and equal likes (6 vs 13). Strong fallback candidate if llmfan46-27B has a quality issue we discover at Phase 3 pre-flight.

### 4. huihui-ai/Huihui-Qwen3.5-35B-A3B-abliterated

| Field | Value |
|---|---|
| HF page | https://hf.co/huihui-ai/Huihui-Qwen3.5-35B-A3B-abliterated |
| Base model | `Qwen/Qwen3.5-35B-A3B` (one generation older than Qwen3.6) |
| Abliteration method | huihui-ai abliteration (Sumandora-method derivative per April-11 survey) |
| Parameter count | 35,951.8M (~36B total, ~3B active) |
| Architecture | `qwen3_5_moe` |
| Native MTP preservation | Unknown — no `mtp` tag |
| License | Apache-2.0 |
| Last commit / update | 2026-03-02 |
| Downloads (cumulative) | 110.1K |
| Likes | 316 |
| Published evals | None on HF page; April-11 survey cites "320/320 pass" attribution but that figure was for a different huihui-ai model (Qwen3-4B-abliterated), not this 35B variant |
| Alton-relevance score | **3/5** |

Rationale for 3/5: Generation-older base (Qwen3.5 vs Qwen3.6). High community trust (316 likes, 110K downloads). Same MoE architecture as the current Sartor baseline. Older base may mean less capability ceiling than Qwen3.6, but more community testing. Useful as a comparison-baseline if we want to measure "does going to Qwen3.6 vs staying on Qwen3.5 matter for the Sartor SFT outcome." Not a primary candidate; useful as a control.

### 5. huihui-ai/Huihui-Qwen3.5-27B-abliterated

| Field | Value |
|---|---|
| HF page | https://hf.co/huihui-ai/Huihui-Qwen3.5-27B-abliterated |
| Base model | `Qwen/Qwen3.5-27B` (dense, generation-older) |
| Abliteration method | huihui-ai abliteration |
| Parameter count | 27,781.4M (~27.8B) |
| Architecture | `qwen3_5` (dense) |
| Native MTP preservation | Unknown |
| License | Apache-2.0 |
| Last commit / update | 2026-03-02 |
| Downloads (cumulative) | 452.6K — **highest in this survey** |
| Likes | 120 |
| Published evals | None on HF page |
| Alton-relevance score | **3/5** |

Rationale for 3/5: Most-downloaded model in our set (452.6K). Strong community validation signal. Generation-older base (Qwen3.5 vs Qwen3.6). Same architecture profile as llmfan46-27B and Youssofal-27B but on the older generation. Useful as a "did the Qwen3.5→Qwen3.6 jump matter?" comparison anchor if we want one.

### 6. bartowski/cognitivecomputations_Dolphin-Mistral-24B-Venice-Edition-GGUF

| Field | Value |
|---|---|
| HF page | https://hf.co/bartowski/cognitivecomputations_Dolphin-Mistral-24B-Venice-Edition-GGUF |
| Base model | `dphn/Dolphin-Mistral-24B-Venice-Edition` (Mistral-base; this entry is a GGUF mirror) |
| Method | Dolphin SFT-from-base (Cognitive Computations approach — bypass post-training rather than ablate it) |
| Parameter count | 24B (Mistral-class) |
| Architecture | Mistral |
| Native MTP preservation | n/a (Mistral has no Native-MTP feature) |
| License | Apache-2.0 |
| Last commit / update | 2025-05-09 (this is a relatively old release in the May-2025 generation) |
| Downloads (cumulative) | 21.5K |
| Likes | 139 |
| Published evals | Unknown (Dolphin family generally has community-published evals but none surfaced on this specific repo) |
| Alton-relevance score | **2/5** |

Rationale for 2/5: Dolphin family represented in the directive's enumeration ("heretic / abliterated / dolphin / dpo-cleaned"). Different approach: Dolphin starts from base and adds its own instruct-tuning, rather than abliterating an instruct-tuned model. The April-11 survey (§1.5) called this approach "the cleanest" but trades the cost of doing more instruct-tuning work. **Not-Qwen** is a meaningful axis — different base architecture (Mistral) means a different generation of inherited bias. GGUF-only means we'd lose direct bf16 training; we'd need to source the safetensors variant. Off-axis for a Qwen3.6-vs-Qwen3.5 comparison but on-axis for a "did we pick the right *family*" question.

### 7. OBLITERATUS/Qwen3-4B-OBLITERATED — *OBLITERATUS exemplar (small)*

| Field | Value |
|---|---|
| HF page | https://hf.co/OBLITERATUS/Qwen3-4B-OBLITERATED |
| Base model | `Qwen/Qwen3-4B` |
| Method | OBLITERATUS (multi-direction abliteration via SVD; tags: `obliteratus`, `abliteration`, `uncensored`, `obliterate`) |
| Parameter count | 4,022.5M (~4B) |
| Architecture | `qwen3` |
| Native MTP preservation | n/a (Qwen3 generation, pre-Qwen3.6 Native MTP) |
| License | Unknown — no license tag in the metadata returned |
| Last commit / update | 2026-03-20 |
| Downloads (cumulative) | 472 |
| Likes | 11 |
| Published evals | Unknown |
| Alton-relevance score | **3/5** |

Rationale for 3/5: The canonical OBLITERATUS-output model. Too small for our primary SFT target (4B doesn't fit the directive's 14B-70B range), but worth surveying as the *method-of-record* OBLITERATUS exemplar. Useful for T3 (abliteration learn-and-improve) as the reference output to compare against if we re-run OBLITERATUS on a Qwen variant ourselves.

### 8. richardyoung/DeepSeek-R1-Distill-Qwen-7B-abliterated-obliteratus — *OBLITERATUS + RepE + paper-cited*

| Field | Value |
|---|---|
| HF page | https://hf.co/richardyoung/DeepSeek-R1-Distill-Qwen-7B-abliterated-obliteratus |
| Base model | `deepseek-ai/DeepSeek-R1-Distill-Qwen-7B` |
| Method | OBLITERATUS (representation-engineering; refusal-removal; cites arxiv:2512.13655) |
| Parameter count | 7,615.6M (~7.6B) |
| Architecture | `qwen2` |
| Native MTP preservation | n/a (Qwen2-class architecture, pre-MTP) |
| License | MIT |
| Last commit / update | 2026-03-28 |
| Downloads (cumulative) | 389 |
| Likes | 1 |
| Published evals | **Yes — `model-index` tag present** (HF model-index format = standardized eval metrics) |
| Alton-relevance score | **3/5** |

Rationale for 3/5: Useful as T3 (abliteration learn-and-improve) target. The paper citation (arxiv:2512.13655 = Young 2025 *Comparative Analysis of LLM Abliteration Methods*) means this model is the empirical instance the comparative-analysis paper measured. The model-index tag means published eval numbers exist on the HF repo. Off-target for primary v0.6 SFT (7B too small) but on-target for T3 R3b (two-vector decomposition on a DeepSeek-R1 distill — this is exactly that class of model).

### 9. joaocarloscruz/Qwen3-4B-China-Uncensored-DPO

| Field | Value |
|---|---|
| HF page | https://hf.co/joaocarloscruz/Qwen3-4B-China-Uncensored-DPO |
| Base model | `Qwen3-4B` (per tags) |
| Method | DPO (China-specific preference pairs) |
| Parameter count | 4,022.5M (~4B) |
| Architecture | `qwen3` |
| Native MTP preservation | n/a |
| License | Unknown — no license tag in metadata returned |
| Last commit / update | 2026-01-08 |
| Downloads (cumulative) | 442 |
| Likes | 1 |
| Published evals | Unknown |
| Alton-relevance score | **2/5** |

Rationale for 2/5: Surveyed for completeness as the "dpo-cleaned" axis in the directive's enumeration. 4B is too small for primary SFT. CCP-specific DPO method is conceptually interesting for the T3 line but the model itself is small and untested.

## Summary table

| # | Model | Params | Method | Arch | License | Last update | Downloads | Alton-relevance |
|---|---|---|---|---|---|---|---|---|
| 1 | llmfan46/Qwen3.6-27B-heretic-v2-Native-MTP | 27.4B | Heretic v2 | qwen3_5 dense | Apache-2.0 | 2026-05-07 | 1.2K | **5** |
| 2 | Youssofal/Qwen3.6-35B-A3B-Heretic-BF16 | 35B-A3B | Heretic+mpoa+soma | qwen3_5_moe | Apache-2.0 | 2026-04-16 | 13.1K | **4** |
| 3 | Youssofal/Qwen3.6-27B-Heretic-BF16 | 27.4B | Heretic+mpoa+soma | qwen3_5 dense | Apache-2.0 | 2026-04-29 | 2.8K | **4** |
| 4 | huihui-ai/Qwen3.5-35B-A3B-abliterated | 36B-A3B | huihui-ai abliteration | qwen3_5_moe | Apache-2.0 | 2026-03-02 | 110.1K | **3** |
| 5 | huihui-ai/Qwen3.5-27B-abliterated | 27.8B | huihui-ai abliteration | qwen3_5 dense | Apache-2.0 | 2026-03-02 | 452.6K | **3** |
| 6 | bartowski / Dolphin-Mistral-24B-Venice | 24B | Dolphin SFT-from-base | Mistral | Apache-2.0 | 2025-05-09 | 21.5K | **2** |
| 7 | OBLITERATUS/Qwen3-4B-OBLITERATED | 4B | OBLITERATUS | qwen3 | unknown | 2026-03-20 | 472 | **3** (for T3) |
| 8 | richardyoung / R1-Distill-Qwen-7B-OBLITERATUS | 7.6B | OBLITERATUS+RepE | qwen2 | MIT | 2026-03-28 | 389 | **3** (for T3) |
| 9 | joaocarloscruz / Qwen3-4B-China-DPO | 4B | DPO (China-specific) | qwen3 | unknown | 2026-01-08 | 442 | **2** |

Nine candidates surveyed. Five score ≥3; the directive's minimum is five candidates. The Alton-flagged llmfan46 entry is the first row.

## Recommendation for Phase 3

**Default: llmfan46/Qwen3.6-27B-uncensored-heretic-v2-Native-MTP-Preserved.** Reasons in order of strength:

1. The directive names it explicitly. Decision rule from REPLAN §1 / directive §Decision rules: "default to the Alton-flagged one absent strong reason — Alton has context we don't."
2. Native MTP preservation is the only differentiator from candidate #3 (Youssofal-27B-Heretic). Native MTP matters for Qwen3.6 inference quality per the directive's framing.
3. Newest in the survey (May 7). The abliteration tooling and base model are both current.
4. VRAM profile fits cleanly: 27.4B × 2 bytes/param ≈ 55 GB at bf16 load, leaving ~40 GB on a single 96 GB card for LoRA adapters at rank 16, KV cache, optimizer state.

**Fallback if Phase 3 pre-flight reveals a quality issue:** Candidate #3 (Youssofal/Qwen3.6-27B-Abliterated-Heretic-Uncensored-BF16). Same parameter profile, same license, more downloads, two-week-older Heretic application.

**Strictly-dominant candidate found?** No. None of the surveyed candidates is strictly dominant over the Alton-flagged llmfan46-27B on every relevant axis (license + size + recency + MTP preservation + community validation). The huihui-ai-35B-A3B has more community validation (316 likes) but is generation-older and has no explicit MTP-preservation. The Youssofal-35B-A3B is the current Sartor baseline (eval-harness 2026-05-04) but is also MoE and older. None displace the Alton-flagged default.

## Gaps and open notes

- **Native MTP preservation is poorly indexed on HF.** Only llmfan46 explicitly tags `mtp`. Other models may or may not preserve MTP; the absence of a tag is not evidence either way. If MTP matters operationally, we may need to confirm at Phase 3 by inspecting model config rather than relying on tags.
- **Download counts are cumulative, not 30-day.** The HF MCP returned cumulative downloads; 30-day download trend would be more diagnostic but requires the HF API directly. Cumulative is a reasonable proxy for community validation at this granularity.
- **No published evals on the primary candidates.** llmfan46-27B and the Youssofal-Heretic family have no HF model-index entries. The Sartor-internal eval-harness 2026-05-04 has run on Youssofal-35B-A3B; that's our only first-party measurement.
- **The April-11 survey's Tier-1 table is now generation-stale.** The huihui-ai/Huihui-Qwen3.5-35B-A3B entry from April 11 is still in this survey at row 4, but the qwen3.6 Heretic family (rows 1-3) post-dates April 11 and is what's worth measuring now.

## Sources

- `mcp__claude_ai_Hugging_Face__hub_repo_details` calls on the 9 model IDs above (2026-05-13)
- `mcp__claude_ai_Hugging_Face__hub_repo_search` query "heretic uncensored abliterated" sort by downloads (2026-05-13)
- `mcp__claude_ai_Hugging_Face__hub_repo_search` query "cognitivecomputations dolphin" sort by downloads (2026-05-13)
- April-11 survey at `02-huggingface-survey.md` for historical context
- Sartor-internal eval-harness `eval-harness-2026-05-04/report.md` for first-party measurements on candidate #2 (`[ev]`)
