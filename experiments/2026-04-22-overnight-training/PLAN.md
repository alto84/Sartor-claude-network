---
name: overnight-training-2026-04-22
type: experiment
date: 2026-04-22
updated: 2026-04-22
status: planned
tags: [experiment, ml-training, blackwell, constitution, rtxpro6000server]
related: [HOUSEHOLD-CONSTITUTION, rtxpro6000server, §20]
---

# Overnight training run — Sartor Constitution fine-tune v0.1

First concrete step toward §20's local-override-model trajectory. Doubles as a real stress test of the newly-built rtxpro6000server (dual RTX PRO 6000 Blackwell, 192 GB VRAM, PCIe 5.0 x16 on each card via separate NUMA domains).

## Model

**Base:** `Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16`

- Qwen 3.6 MoE: 35B total params, 3B active per token
- Apache-2.0
- Already ablated (refusal directions zeroed) plus "Heretic" further decensoring
- 70 GB bf16 weights, 21 safetensors shards
- Chosen over the plain huihui ablated variant per Alton's "see how far we can go" — more of the inherited PRC alignment is scrubbed before our fine-tune begins

## Training corpus

Concatenated into a continued-pretraining stream, 4096-token windows, no masking (next-token prediction on the full sequence).

1. `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` (v0.3, ratified 2026-04-19, ~20 k words)
2. `sartor/memory/reference/OPERATING-AGREEMENT.md`
3. All `sartor/memory/feedback/*.md` files
4. The evening's tension-resolution record (Cato / Lethe / opus46 / Marginalia-silent) — captures the fresh prosecution of 4.7's §20 misread so the fine-tune inherits the correction, not the error
5. `Jongsim/claude-opus-4.6-reasoning-12k` — 12 k Opus 4.6 reasoning traces, added for general-purpose reasoning register so the tune isn't monochromatic household-policy

Expected corpus size: ~40–60 MB of tokenized text, probably 10–20 M tokens after tokenization.

## Method

**LoRA fine-tune**, attention-only target modules, rank 64, alpha 128, dropout 0.05.

Rationale:
- Biderman 2024 (cited in §20) notes LoRA is weaker at *overwriting* base alignment but fine for *adding* capabilities. Because we start from an already-abliterated base, the overwrite is mostly done; LoRA just adds the household values on top. This is the §20-faithful flow.
- Full FT on 35B MoE with 192 GB VRAM is doable but adds MoE-sharding complexity not worth the risk on a first run.
- LoRA on attention only (q/k/v/o) keeps the MoE routing intact — we adjust how the model *attends* without touching how experts are selected.

**Hardware layout:** model-parallel via `device_map='auto'`. Both GPUs active, layers split, cross-NUMA PCIe exercised as a real P2P stress test. LoRA adapters and AdamW optimizer states are small (few hundred MB).

## Hyperparameters

- learning rate: 2e-4 (LoRA standard)
- schedule: cosine with 100-step warmup
- batch size: 4 per device, gradient accumulation 8 (effective batch 32)
- sequence length: 4096
- epochs: 3
- dtype: bf16 forward, fp32 optimizer states (LoRA only)
- optimizer: AdamW (8-bit via bitsandbytes to save optimizer-state VRAM)
- gradient checkpointing: on
- save every 500 steps, keep last 3

## Monitoring

Parallel `monitor.sh` writes to `~/training-monitor.log` every 5 s:
- `nvidia-smi --query-gpu=...` (temp, power, util, mem, PCIe gen/width per GPU)
- `sensors` (CPU temp, VRM temp)
- `dmesg -T --level=err,warn` tail for AER/XID/NVRM
- alert canary: writes to `~/ALERT` if any GPU sustains >88 °C for >60 s or any XID/AER error appears

Training loss logged to stdout and to `~/training.log`.

## Runtime estimate

- Preflight (LVM, venv, Claude Code CLI, model + dataset downloads, repo transfer): 15–30 min
- Dataset prep + tokenization: 5–10 min
- Training: 3 epochs × ~2000 steps × ~1.5 s/step ≈ 2.5 h on 2 GPUs model-parallel
- Eval pass (generate on constitutional probes): 10 min
- Total: 3–4 h, fits well inside an overnight window

## Artifacts produced

- `~/models/lora-sartor-v0.1/` — LoRA adapter weights
- `~/training.log` — full stdout training log
- `~/training-monitor.log` — hardware telemetry timeline
- `eval-probes.md` — base-vs-fine-tuned output on a fixed prompt set covering Tiananmen / household values / override principle / constitutional topics
- `SUMMARY.md` in this directory (post-run) — what happened, what went wrong, what to do differently

## Known risks

- **MoE + LoRA edge cases.** `peft` supports Qwen MoE but the 3.6 architecture (`qwen3_5_moe`) is recent; if config loading fails we fall back to SFTTrainer without PEFT or reduce to single-GPU.
- **Thermal headroom.** Blackwell under sustained LoRA training will pull 400–500 W per card. The new sag bracket handles physical load but airflow is the variable. Monitor canary will trip if top card exceeds 88 °C.
- **Disk.** Root is now 300 GB after LVM grow. Model 70 GB + LoRA 2 GB + checkpoints 3 × 1 GB + logs = comfortable.
- **MoE memory spikes.** Expert routing can cause transient VRAM spikes. If we hit OOM we drop batch to 2 and grad-accum to 16.

## After the run

If the fine-tune moves the distribution meaningfully on constitutional probes, this becomes the seed for v0.2 with a bigger corpus (memory files, daily logs, decision rationale). If it doesn't — more likely on a first pass — we increase LoRA rank, target more modules, or move to full FT with FSDP.

Either way, tonight validates the hardware end-to-end under a real sustained training workload. That alone is the stress test Alton asked for.
