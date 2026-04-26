---
name: phone-home-deepseek-v4-arch-gap
description: rtxserver phone-home — vLLM 0.19.1 AND SGLang 0.5.10.post1 both lack DeepseekV4ForCausalLM in their model registries. Bloom build cannot proceed via either path. Phone-home trigger fired.
type: phone-home
date: 2026-04-26
from: rtxserver (deepseek-v4-flash inference test)
to: rocinante (for Alton)
status: blocked-arch-gap
volatility: low
tags: [meta/phone-home, domain/inference, model/deepseek-v4-flash]
related:
  - sartor/memory/inbox/rtxpro6000server/PHONE-HOME-phase-1-sanity-failure.md
---

# DeepSeek-V4-Flash arch-gap. vLLM AND SGLang both lack `DeepseekV4ForCausalLM`. Phone-home trigger fired.

## Headline

The directive's primary phone-home trigger fired before the build ever ran:

> "vLLM AND SGLang both fail to load deepseek_v4 architecture (compat gap)"

Confirmed empirically against the actual model `config.json` (already on disk; download still in progress in tmux `claude-team-1:download` for ~150 GB total). The architecture string `DeepseekV4ForCausalLM` and `model_type: deepseek_v4` are not in either inference engine's model registry. Stopped per protocol.

Bloom build did NOT proceed. No GPU work was attempted. No inference was issued. The 7-pass build script and the validate-and-report script are written and committed but were never executed.

## Empirical evidence

### vLLM 0.19.1 — DeepseekV4ForCausalLM not in registry

```python
>>> from vllm.model_executor.models.registry import ModelRegistry
>>> [k for k in ModelRegistry.get_supported_archs() if 'deepseek' in k.lower()]
['DeepseekForCausalLM',
 'DeepseekV2ForCausalLM',
 'DeepseekV3ForCausalLM',
 'DeepseekV32ForCausalLM',
 'DeepseekVLV2ForCausalLM',
 'DeepseekOCRForCausalLM',
 'DeepseekOCR2ForCausalLM',
 'Eagle3DeepseekV2ForCausalLM',
 'Eagle3DeepseekV3ForCausalLM',
 'EagleDeepSeekMTPModel',
 'DeepSeekMTPModel']
```

V2, V3, V3.2, VL, OCR are present. V4 is not.

### SGLang 0.5.10.post1 — DeepseekV4ForCausalLM not in registry

```python
>>> from sglang.srt.models.registry import ModelRegistry
>>> [k for k in ModelRegistry.get_supported_archs() if 'deepseek' in k.lower()]
['DeepseekForCausalLM',
 'DeepseekV3ForCausalLMNextN',
 'DeepseekOCRForCausalLM',
 'DeepseekV2ForCausalLM',
 'DeepseekV3ForCausalLM',
 'DeepseekV32ForCausalLM',
 'DeepseekVL2ForCausalLM']
```

Same gap. V4 is not in the model file directory either (`ls .../sglang/srt/models/ | grep deepseek` shows `deepseek.py`, `deepseek_v2.py`, `deepseek_nextn.py`, `deepseek_ocr.py`, `deepseek_janus_pro.py`, `deepseek_vl2.py` — no `deepseek_v3.py` or `deepseek_v4.py`; V3 and V3.2 are subclasses of V2 in `deepseek_v2.py` per `EntryClass = [DeepseekV2ForCausalLM, DeepseekV3ForCausalLM, DeepseekV32ForCausalLM]`).

### Model config (already on disk)

```json
"architectures": ["DeepseekV4ForCausalLM"],
"model_type": "deepseek_v4",
"hidden_size": 4096,
"num_hidden_layers": 43,
"n_routed_experts": 256,
"num_experts_per_tok": 6,
"head_dim": 512,
"index_n_heads": 64,
"index_topk": 512,
"hc_eps": 1e-06, "hc_mult": 4, "hc_sinkhorn_iters": 20,
"num_hash_layers": 3,
"num_nextn_predict_layers": 1
```

Several V4-specific config fields (`hc_*`, `num_hash_layers`, `index_*`) suggest this isn't a drop-in V3 architecture extension — it requires new model class implementation.

## Secondary issues surfaced during the diagnostic

### 1. Torch ABI conflict between vLLM and SGLang

Installing vLLM 0.19.1 first pinned torch to 2.10.0. Then installing SGLang 0.5.10.post1 downgraded torch to 2.9.1 (and downgraded torchvision to 0.24.1). vLLM's compiled C extension `vllm/_C.abi3.so` then failed import:

```
ImportError: /home/alton/ml/lib/python3.10/site-packages/vllm/_C.abi3.so:
  undefined symbol: _ZN3c104cuda29c10_cuda_check_implementationEiPKcS2_jb
```

So in the current `~/ml/` venv state, **vLLM and SGLang cannot co-exist**. Whichever you pick, the other gets broken. (Easily resolved by separate venvs, but flagging.)

### 2. Blackwell SM 12.x ↔ CUDA bindings

When importing SGLang against the dual RTX PRO 6000 Blackwell, runtime emits:

```
Failed to get device capability: SM 12.x requires CUDA >= 12.9.
Failed to get device capability: SM 12.x requires CUDA >= 12.9.
```

The SGLang-pinned torch 2.9.1 + cuda-python 12.9.0 stack is too old to expose Blackwell's SM 12.x capability. Even with arch support, Blackwell-targeted inference would need CUDA 12.9+ wheels. (vLLM's torch 2.10.0+cu128 also flagged similar deprecation warnings.)

### 3. Bundled `inference/` in the model directory is not OpenAI-compat

`/home/alton/models/deepseek-v4-flash/inference/` contains a custom DeepSeek-authored `generate.py` + `model.py` + `kernel.py` using tilelang-0.1.8 + a custom encoder (`encoding/encoding_dsv4.py`). It's a torchrun-launched interactive/batch CLI, not an HTTP server. Could be wrapped with a thin FastAPI shim, but per directive "don't fall back to transformers + accelerate" — that fallback path was explicitly excluded. Wrapping the bundled inference is in the same spirit (not OpenAI-compat out of the box, slower than vLLM/SGLang would be, custom kernel deps).

## Disk state

- Download still in flight in tmux `claude-team-1:download` (window 1). At time of phone-home: 9-10 of 46 safetensor shards complete (74 total files including non-safetensor artifacts), ~33 GB / ~150 GB. ETA from the tqdm last-seen rate: 20-30 min more wall-clock.
- `/home/alton/models/deepseek-v4-flash/` size: 33 GB
- Build dir: `/home/alton/models/deepseek-v4-flash/build/` — `build-bloom.py` (orchestrator, never executed) and `validate-and-report.py` (validator, never executed). No bloom*.html files exist.

## State of the venv

- `~/ml/` was torch 2.11.0+cu128 before this session.
- After `pip install -U vllm`: torch 2.10.0+cu128 (vLLM 0.19.1's pin).
- After `pip install -U sglang[all]`: torch 2.9.1, torchvision 0.24.1 (SGLang's pin), which breaks vLLM C extension.
- **No revert was done.** Current state has SGLang's pins active. The persona-engineering pipeline (which used torch 2.11 originally) will need a `pip install torch==2.11.0+cu128 torchvision==0.26.0+cu128` to restore — or a separate venv.
- This is a non-trivial side-effect of this directive that I'm flagging because the persona-engineering Phase 1.5 (lora-v0.3 baseline) work, when Alton calls a/b/c on the prior phone-home, will hit the broken torch state.

## Paths I see

Three reasonable next moves; all need Alton's call before further work:

- **(a) Wait for upstream support.** vLLM and SGLang both have active deepseek_v* development; V4 will likely land in the next few releases. Cost: 0 today; 1-4 weeks calendar time; zero risk.
- **(b) Wrap the bundled `inference/generate.py` with a FastAPI `/v1/chat/completions` shim.** Cost: 1-2 hours scripting; medium risk (custom serving path; tilelang dependency on a fresh model means new failure modes); does enable the Bloom build today. Also the directive explicitly excluded a transformers+accelerate fallback in this same spirit, so I read this option as also out-of-scope unless Alton overrides.
- **(c) Drop the directive entirely and resume persona-engineering.** Persona-engineering Phase 1 sanity-failure decision (a/b/c on the prior phone-home) is the higher-priority blocked work. The DeepSeek-V4-Flash test is a stress benchmark, not load-bearing.

I recommend **(c)** first, **(a)** second. (b) is a meaningful afternoon of work for a stress-test that has no production dependency.

## Background state to clean up if Alton picks (c)

- `~/ml/` venv: restore torch 2.11.0+cu128 + torchvision 0.26.0+cu128 OR create a separate `~/ml-deepseek/` venv for future V4 work.
- Background poll `bf1h905bk` (waits for `DONE: 0` sentinel in tmux): will eventually fire when download completes. Harmless — just a notification.
- Background download in `claude-team-1:download` tmux window: still running. Keeps going unless killed. ~30 min more.

## State

- Pre-existing persona-engineering Phase 1 sanity-failure phone-home (`PHONE-HOME-phase-1-sanity-failure.md`) remains `blocked-awaiting-decision`. This directive ran orthogonally and did not unblock or resolve it.
- This phone-home: `blocked-arch-gap`. No GPU work executed.
- Commits expected:
  - This phone-home file
  - The two unused build scripts (committed for record-of-work, even though they didn't run)
- No pre-existing artifacts touched.

— rtxserver, 2026-04-26
