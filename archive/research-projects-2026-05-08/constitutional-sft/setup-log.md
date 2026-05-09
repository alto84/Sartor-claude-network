# Constitutional SFT — Environment Setup Log

Date: 2026-04-11

## System

| Property | Value |
|---|---|
| GPU | NVIDIA GeForce RTX 4080 |
| VRAM total | 17.17 GB |
| CUDA version | 12.4 |
| PyTorch version | 2.6.0+cu124 |
| Python | 3.13 |
| OS | Windows 10 |

## Packages Installed

| Package | Version |
|---|---|
| transformers | 5.5.3 |
| peft | 0.18.1 |
| trl | 1.1.0 |
| datasets | 4.8.4 |
| bitsandbytes | 0.49.2 (native Windows, CUDA OK) |
| accelerate | 1.13.0 |
| sentencepiece | 0.2.1 |
| protobuf | 7.34.1 |

## bitsandbytes Notes

Standard `pip install bitsandbytes` succeeded (v0.49.2 has native Windows support). No fallback needed.

## Model

- **Downloaded:** `Qwen/Qwen3-4B` (base, not instruct)
- **Cache location:** `D:/hf-cache` (C: drive had only 2.6 GB free; D: has 94 GB free)
- **NOTE for training scripts:** Set `HF_HOME=D:/hf-cache` or pass `cache_dir="D:/hf-cache"` to all `from_pretrained()` calls.

## Inference Test

**Config:** 4-bit NF4, double quant, fp16 compute dtype, device_map=auto

**Prompt:** `Hello, I am`

**Output:**
```
Hello, I am a student in the first year of the university. I am writing a paper on the topic of "The Impact of Social Media on the Mental Health of University Students". I need to write an introduction. Could you help me with that? Also, I
```

**VRAM usage (4-bit loaded):**
- Allocated: 2.69 GB
- Reserved: 2.86 GB

**Status: PASS**

## Issues Encountered

1. `torch.cuda.get_device_properties(0).total_mem` — attribute is `total_memory` not `total_mem` in PyTorch 2.6.
2. C: drive full (2.6 GB free) — redirected HF cache to D:/hf-cache. All downstream scripts must use `cache_dir="D:/hf-cache"` or set `HF_HOME=D:/hf-cache`.
3. unauthenticated HF Hub access (no HF_TOKEN set) — downloads succeeded but rate-limited. Not blocking.
