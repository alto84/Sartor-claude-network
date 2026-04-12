---
title: HuggingFace Survey -- CCP Deconditioning Models & Datasets
created: 2026-04-11
updated: 2026-04-11
status: active
scope: GPU research project -- uncensoring Chinese-origin LLMs
---

# HuggingFace Survey: CCP Deconditioning Landscape

> [!summary] Survey of all relevant models, datasets, papers, tools, and community efforts on HuggingFace related to removing Chinese government alignment from LLMs and constitutional fine-tuning. Conducted 2026-04-11.

---

## 1. Model Inventory

### Tier 1: Best Fit for RTX 5090 (32 GB) -- Full Precision or Light Quant

| Model ID | Params | Base | Method | VRAM (FP16) | Quant Available | Downloads | Updated | License |
|---|---|---|---|---|---|---|---|---|
| huihui-ai/Huihui-Qwen3.5-35B-A3B-abliterated | 35B MoE (3B active) | Qwen3.5-35B-A3B | Abliteration | ~8 GB active | Safetensors, NVFP4, GGUF (via mradermacher) | 58K | Feb 2026 | Apache-2.0 |
| huihui-ai/Huihui-Qwen3.5-27B-abliterated | 27B | Qwen3.5-27B | Abliteration | ~54 GB FP16 / ~16 GB Q4 | Safetensors; GGUF via mradermacher | 160K | Feb 2026 | Apache-2.0 |
| huihui-ai/Huihui-Qwen3.5-35B-A3B-Claude-4.6-Opus-abliterated | 35B MoE | Qwen3.5-35B-A3B + Claude distill | Abliteration + distillation | ~8 GB active | Safetensors; GGUF i1 | 163K | Mar 2026 | Apache-2.0 |
| HauhauCS/Qwen3.5-35B-A3B-Uncensored-HauhauCS-Aggressive | 35B MoE | Qwen3.5-35B-A3B | GGUF uncensoring (method unspecified) | ~8 GB active | GGUF only | 1.0M | Mar 2026 | Apache-2.0 |
| HauhauCS/Qwen3.5-27B-Uncensored-HauhauCS-Aggressive | 27B | Qwen3.5-27B | GGUF uncensoring | ~16 GB Q4 | GGUF only | 348K | Mar 2026 | Apache-2.0 |
| huihui-ai/Qwen2.5-72B-Instruct-abliterated | 72B | Qwen2.5-72B-Instruct | Abliteration | Too large FP16; Q4 ~40 GB | Safetensors; FP8 via ConicCat | 427K | Oct 2024 | Qwen |
| bartowski/DeepSeek-R1-Distill-Qwen-32B-abliterated-GGUF | 32B | DeepSeek-R1-Distill-Qwen-32B | Abliteration (huihui-ai) | ~20 GB Q4 | GGUF imatrix | 27K | Jan 2025 | MIT |
| nicoboss/DeepSeek-R1-Distill-Qwen-32B-Uncensored (GGUF via mradermacher) | 32B | DeepSeek-R1-Distill-Qwen-32B | SFT on Guilherme34/uncensor | ~20 GB Q4 | GGUF | 35K | Jan 2025 | MIT |
| joaocarloscruz/Qwen3-4B-China-Uncensored-DPO | 4B | Qwen3-4B | DPO (China-specific) | ~8 GB FP16 | GGUF via mradermacher | 351 | Jan 2026 | -- |

### Tier 2: Best Fit for RTX 4080 (16 GB) -- Quantized

| Model ID | Params | Base | Method | VRAM (Q4) | Quant Available | Downloads | Updated | License |
|---|---|---|---|---|---|---|---|---|
| huihui-ai/Huihui-Qwen3.5-9B-abliterated | 9B | Qwen3.5-9B | Abliteration | ~6 GB Q4 | Safetensors; GGUF via mradermacher | 92K | Mar 2026 | Apache-2.0 |
| HauhauCS/Qwen3.5-9B-Uncensored-HauhauCS-Aggressive | 9B | Qwen3.5-9B | GGUF uncensoring | ~6 GB Q4 | GGUF | 879K | Mar 2026 | Apache-2.0 |
| huihui-ai/Huihui-Qwen3.5-9B-Claude-4.6-Opus-abliterated | 9B | Qwen3.5-9B + Claude distill | Abliteration | ~6 GB Q4 | Safetensors; GGUF | 46K | Mar 2026 | Apache-2.0 |
| nicoboss/DeepSeek-R1-Distill-Qwen-14B-Uncensored (GGUF) | 14B | DeepSeek-R1-Distill-Qwen-14B | SFT on Guilherme34/uncensor | ~10 GB Q4 | GGUF; imatrix | 20K+5K | Jan 2025 | MIT |
| HauhauCS/Qwen3.5-4B-Uncensored-HauhauCS-Aggressive | 4B | Qwen3.5-4B | GGUF uncensoring | ~3 GB Q4 | GGUF | 207K | Mar 2026 | Apache-2.0 |
| huihui-ai/Huihui-Qwen3.5-4B-abliterated | 4B | Qwen3.5-4B | Abliteration | ~3 GB Q4 | Safetensors + GGUF | 12K | Mar 2026 | Apache-2.0 |
| Orion-zhen/Qwen2.5-7B-Instruct-Uncensored | 7B | Qwen2.5-7B-Instruct | SFT on ToxicQA | ~5 GB Q4 | Safetensors | 11K | Sep 2024 | Qwen |

### Tier 3: OBLITERATUS Project Models (representation engineering approach)

| Model ID | Params | Base | Method | Downloads | License |
|---|---|---|---|---|---|
| richardyoung/DeepSeek-R1-Distill-Qwen-7B-abliterated-obliteratus | 7B | DeepSeek-R1-Distill-Qwen-7B | OBLITERATUS (rep. eng.) | 333 + 15K GGUF | MIT |
| richardyoung/Llama-3.1-8B-Instruct-abliterated-obliteratus | 8B | Llama-3.1-8B-Instruct | OBLITERATUS | 320 + 9.5K GGUF | Llama 3.1 |
| richardyoung/SmolLM3-3B-abliterated-obliteratus | 3B | SmolLM3-3B | OBLITERATUS | 319 + 4.9K GGUF | Apache-2.0 |
| richardyoung/Mistral-7B-Instruct-v0.2-abliterated-obliteratus | 7B | Mistral-7B-v0.2 | OBLITERATUS | 318 + 1.9K GGUF | Apache-2.0 |
| OBLITERATUS/Qwen3-4B-OBLITERATED | 4B | Qwen3-4B | OBLITERATUS | 267 | Apache-2.0 |

### Tier 4: Non-Qwen/DeepSeek Notable Abliterated Models

| Model ID | Params | Base | Method | Downloads | License |
|---|---|---|---|---|---|
| paperscarecrow/Gemma-4-31B-it-abliterated | 31B | Gemma-4-31B-it | Abliteration | 86K | Apache-2.0 |
| huihui-ai/Huihui-gpt-oss-20b-BF16-abliterated | 20B | GPT-OSS-20B | Abliteration | 28K | Apache-2.0 |
| mlabonne/Meta-Llama-3.1-8B-Instruct-abliterated | 8B | Llama-3.1-8B | Abliteration (mlabonne original) | 23K | Llama 3.1 |
| failspy/Meta-Llama-3-70B-Instruct-abliterated-v3.5 | 70B | Llama-3-70B | Abliteration | 37K | Llama 3 |

### Key Authors/Orgs

| Author | Role | Notable Output |
|---|---|---|
| **huihui-ai** | Most prolific abliterator | Qwen 2.5/3.5/3 abliterated series, GLM, GPT-OSS. Uses mlabonne's original method. Also publishes curated uncensor datasets. |
| **HauhauCS** | High-download GGUF uncensored Qwen series | Qwen3.5-{2B,4B,9B,27B,35B-A3B,122B}-Uncensored-Aggressive |
| **nicoboss** | SFT-based uncensoring of DeepSeek R1 distills | Uses Guilherme34/uncensor dataset. Also DPO with GreatFirewall-DPO. |
| **llmfan46** | "ultra-uncensored-heretic" Qwen3.5 series | Multiple sizes, abliteration-based |
| **LuffyTheFox** | Claude-distilled uncensored Qwen variants | Kullback-Leibler divergence refinement |
| **richardyoung** | OBLITERATUS model releases | Cross-architecture evaluation paper (arxiv:2512.13655) |
| **DavidAU** | MOE merges + abliteration | Creative-writing focused uncensored models |
| **mlabonne** | Original abliteration pioneer | harmful_behaviors + harmless_alpaca datasets, Llama abliteration |
| **pliny-the-prompter / elder-plinius** | OBLITERATUS tool creator | HF Space + GitHub toolkit + telemetry dataset |
| **joaocarloscruz** | China-specific DPO | Qwen3-4B-China-Uncensored-DPO |
| **Eric Hartford / QuixiAI** | Dolphin series, china-refusals dataset | QuixiAI/china-refusals (10K+ CCP probe prompts) |

---

## 2. Dataset Inventory

### Training Datasets (for uncensoring / deconditioning)

| Dataset ID | Size | Format | Description | License |
|---|---|---|---|---|
| **QuixiAI/china-refusals** | 10K-100K | text | Prompts refused by Chinese models but answered by non-Chinese models. Eric Hartford. **Most directly relevant to CCP deconditioning.** | Apache-2.0 |
| **nbeerbower/GreatFirewall-DPO** | <1K | JSON (DPO pairs) | DPO pairs: chosen = uncensored English response, rejected = censored Chinese response. Explicitly designed for Chinese model deconditioning. | Apache-2.0 |
| **Guilherme34/uncensor** | <1K | -- | Core SFT dataset used by nicoboss for all DeepSeek R1 Distill uncensored models | -- |
| **huihui-ai/Guilherme34_uncensor-v2** | <1K | Parquet | Re-labeled version using Qwen3Guard. Safety-filtered. | Apache-2.0 |
| **Team-Kitsune/china-refusals-reasoning** | 1K-10K | JSON | QA + reasoning augmentation of QuixiAI/china-refusals using Mistral Small 24B | Apache-2.0 |
| **Team-Kitsune/china-refusals-qa** | 1K-10K | JSON | QA pairs from china-refusals | Apache-2.0 |
| **mlabonne/harmful_behaviors** | <1K | Parquet | Harmful behavior prompts used for abliteration contrastive pairs | -- |
| **mlabonne/harmless_alpaca** | 10K-100K | Parquet | Harmless instruction set, paired with harmful_behaviors for abliteration | -- |
| **QuixiAI/ultrachat-uncensored** | 100K-1M | JSON | Ultrachat filtered to remove refusal patterns | MIT |
| **anthracite-org/kalo-opus-instruct-22k-no-refusal** | 10K-100K | JSON | Instruction-following data with no refusals | Apache-2.0 |
| **Guilherme34/Uncensoring-GPToss** | 1K-10K | JSON | Dataset for uncensoring GPT-OSS models | -- |

### Evaluation / Probe Datasets

| Dataset ID | Size | Description | License |
|---|---|---|---|
| **MultiverseComputingCAI/llm-refusal-evaluation** | 1K-10K | Benchmark for refusal behavior: safety + censorship + politics categories | -- |
| **pliny-the-prompter/OBLITERATUS-TELEMETRY** | 10K-100K | Community telemetry from OBLITERATUS runs. Contains benchmark data across models. | AGPL-3.0 |
| **NousResearch/RefusalDataset** | <1K | Refusal evaluation prompts | -- |
| **refusals/refusal_dataset_ultra** | 1M-10M | Large-scale refusal behavior study dataset | -- |
| **lasrprobegen/refusal-activations** | 10K-100K | Refusal activation vectors from jailbreak mixed prompts | -- |
| **bedderautomation/refusal-geometry-qwen25-3b** | -- | Extracted refusal direction vectors from Qwen2.5-3B using OBLITERATUS pipeline | MIT |
| **ZeLi111/StupidPolicemanOnlyKnowReject-Chinese-uncensored** | 1K-10K | Chinese refusal template collection from LLMs. In Chinese. | GPL |

---

## 3. Papers

| Paper | arXiv | Key Finding | Relevance |
|---|---|---|---|
| **Detection Is Cheap, Routing Is Learned** (Frank, Mar 2026) | 2603.18280 | Chinese LLM censorship operates via 3-stage detect/route/generate pipeline. Refusal-based eval fails because routing is model-specific. | **Critical** -- explains why simple abliteration may be insufficient for CCP conditioning |
| **Comparative Analysis of LLM Abliteration Methods** (Young, Dec 2025) | 2512.13655 | Evaluates 4 abliteration tools. Bayesian-optimized abliteration preserves capabilities best. KL divergence varies. | High -- benchmarking reference |
| **Geometry of Refusal in LLMs** (Wollschlager et al., Feb 2025) | 2502.17420 | Models have multiple independent refusal mechanisms (concept cones), not just one direction. | High -- suggests single-direction abliteration is incomplete |
| **Steering the CensorShip** (Cyberey & Evans, Apr 2025) | 2504.17130 | DeepSeek-R1 has "thought suppression" in addition to refusal. Representation engineering can reveal both. | **Critical** -- directly about CCP-model thought control |
| **LLMs Encode Harmfulness and Refusal Separately** (Zhao et al., Jul 2025) | 2507.11878 | Harmfulness concept is distinct from refusal direction. Can detect unsafe inputs without refusing. | High -- architectural insight |
| **COSMIC** (Siu et al., May 2025) | 2506.00085 | Automated cosine-similarity framework for finding refusal directions without predefined templates. | Medium -- alternative to manual abliteration |
| **Embarrassingly Simple Defense Against Abliteration** (Shairah et al., May 2025) | 2505.19056 | Fine-tuning on extended-refusal dataset restores refusal after abliteration. | Medium -- anticipate counter-measures |
| **SOM Directions** (Piras et al., Nov 2025) | 2511.08379 | Self-Organizing Maps extract multiple refusal directions, outperforming single-direction abliteration. | High -- improved method |
| **ChineseSafe** (Zhang et al., Oct 2024) | 2410.18491 | Chinese safety benchmark covering political sensitivity categories. | High -- evaluation resource |

---

## 4. Tools & Spaces

| Resource | Type | Description |
|---|---|---|
| **pliny-the-prompter/obliteratus** (HF Space) | Gradio app | Browser-based abliteration tool. 13 methods, 116 model presets. 280 likes. |
| **elder-plinius/OBLITERATUS** (GitHub) | Python toolkit | Full pipeline: SUMMON/PROBE/DISTILL/EXCISE/VERIFY/REBIRTH. Expert-granular abliteration for MoE. CoT-aware ablation. |
| **OBLITERATUS-TELEMETRY** | Dataset | Crowd-sourced benchmark data from OBLITERATUS runs. |

---

## 5. Best Starting Point Recommendation

### Primary: huihui-ai/Huihui-Qwen3.5-35B-A3B-abliterated

**Why this model:**
- **MoE architecture** (35B total, ~3B active) means it runs on RTX 5090 in FP16 with room to spare (~8 GB active params)
- **Abliterated by huihui-ai**, the most experienced and prolific abliterator in the community
- **Apache-2.0 license** -- fully open for research and commercial use
- **58K downloads, 296 likes** -- strong community validation
- **Qwen3.5 base** -- latest Qwen generation, strong multilingual including Chinese
- NVFP4 quantized variant available for even lower VRAM
- Can serve as the starting point for additional DPO training with CCP-specific data

### Fallback for RTX 4080: huihui-ai/Huihui-Qwen3.5-9B-abliterated
- 9B dense model, ~6 GB Q4, fits easily on 16 GB
- Same abliteration quality, just smaller

### For reasoning tasks: huihui-ai/Huihui-Qwen3.5-27B-Claude-4.6-Opus-abliterated
- Combines Claude distillation (better reasoning) with abliteration
- Q4 GGUF fits on 32 GB

---

## 6. Best Dataset Recommendation

### Primary: QuixiAI/china-refusals + nbeerbower/GreatFirewall-DPO

**QuixiAI/china-refusals** is the single most relevant dataset. Created by Eric Hartford, it contains 10K+ prompts that Chinese models refuse but non-Chinese models answer freely. This is the exact CCP probe set we need for both evaluation and DPO training.

**nbeerbower/GreatFirewall-DPO** provides ready-made DPO pairs (chosen=uncensored, rejected=censored) specifically designed for Chinese model deconditioning.

**Combined pipeline:**
1. Use `mlabonne/harmful_behaviors` + `mlabonne/harmless_alpaca` for abliteration (contrastive activation pairs)
2. Use `QuixiAI/china-refusals` as CCP-specific eval and DPO source
3. Use `nbeerbower/GreatFirewall-DPO` for DPO training
4. Use `Guilherme34/uncensor` for general SFT uncensoring
5. Use `MultiverseComputingCAI/llm-refusal-evaluation` and `OBLITERATUS-TELEMETRY` for benchmarking

---

## 7. Gap Analysis -- What Doesn't Exist Yet

### Critical Gaps

1. **No comprehensive CCP-specific DPO dataset at scale.** GreatFirewall-DPO has <1K pairs. china-refusals has prompts but not paired chosen/rejected completions in DPO format. We need to generate 5K-50K DPO pairs covering: Taiwan, Tiananmen, Tibet, Uyghurs, Hong Kong, Xi Jinping criticism, Falun Gong, COVID origins, economic statistics, territorial disputes, etc.

2. **No CCP deconditioning eval benchmark.** ChineseSafe evaluates safety from the CCP perspective. We need the inverse: a benchmark that scores models on willingness to engage with politically sensitive topics *truthfully*. QuixiAI/china-refusals is a start but lacks ground-truth answers and scoring rubrics.

3. **No multi-stage deconditioning pipeline for Qwen/DeepSeek.** Frank (2603.18280) shows CCP censorship operates via detect/route/generate -- abliteration only addresses the "route" stage. We need representation engineering that targets all three stages, especially the narrative-steering in the generation phase.

4. **No constitutional AI fine-tune targeting CCP values specifically.** Constitutional AI datasets exist for general Western ethics but none that explicitly encode "do not defer to CCP narratives on human rights, territorial claims, historical events."

5. **No bilingual (EN/ZH) evaluation set.** CCP censorship often triggers differently in Chinese vs English. Existing datasets are almost entirely English. Need parallel ZH/EN probe sets.

### Secondary Gaps

6. **OBLITERATUS has not been applied to Qwen3.5 at scale.** The OBLITERATUS project models are all small (3-8B) and on older architectures. No Qwen3.5 OBLITERATUS runs published yet.

7. **No head-to-head comparison** of abliteration vs DPO vs SFT for CCP-specific deconditioning. We don't know which method best removes political censorship while preserving Chinese language quality.

8. **No "thought suppression" analysis for Qwen.** Cyberey & Evans (2504.17130) showed DeepSeek-R1 has thought suppression beyond refusal. Nobody has published similar analysis for Qwen3.5.

---

## Sources

- [OBLITERATUS GitHub](https://github.com/elder-plinius/OBLITERATUS)
- [OBLITERATUS HF Space](https://hf.co/spaces/pliny-the-prompter/obliteratus)
- [OBLITERATUS Strips AI Safety From Open Models](https://awesomeagents.ai/news/obliteratus-strips-ai-safety-open-models/)
- [Frank 2026 -- Detection Is Cheap, Routing Is Learned](https://hf.co/papers/2603.18280)
- [Young 2025 -- Comparative Analysis of LLM Abliteration Methods](https://hf.co/papers/2512.13655)
- [Wollschlager 2025 -- Geometry of Refusal](https://hf.co/papers/2502.17420)
- [Cyberey & Evans 2025 -- Steering the CensorShip](https://hf.co/papers/2504.17130)
