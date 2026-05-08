# LoRA training runs — 2026-05-04 finetune-loyalty mission

Adapter checkpoints live on rtxserver disk only. The safetensors files exceed
the repo's 50 MB single-file threshold per `WAKEUP-2026-05-06.md` and are
NOT committed. This README documents what exists and where, so it can be
re-loaded by anyone with rtxserver SSH access.

## lora-r64-attn-only-v1 (2026-05-04 04:54 UTC)

| Field | Value |
|-------|-------|
| Base model | `Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16` |
| Adapter type | Attention-only LoRA (q/k/v/o_proj only) |
| LoRA rank (r) | 64 |
| LoRA alpha | 128 |
| Effective scale | alpha / r = 2.0 |
| Target modules | `q_proj, k_proj, v_proj, o_proj` |
| Modules touched | 40 (10 full-attention layers × 4 projections; the other 30 layers are linear-attention and have no q/k/v/o) |
| Trainable params | 13,762,560 (0.04% of 34.7B) |
| Optimizer | paged_adamw_8bit |
| Learning rate | 2e-5, cosine schedule, warmup ratio 0.05 |
| Batch | 1 per device, grad_accum 8 → effective batch 8 |
| Epochs | 3 |
| Total steps | 18 (≈ 46 examples / 8 effective batch × 3 epochs) |
| Max sequence length | 4096 |
| Precision | bf16 |
| Gradient checkpointing | on |
| Wall-clock | ~4.5 min on dual RTX PRO 6000 Blackwell at 450 W cap |
| Loss trajectory | 2.17 → 2.01 → 2.05 → 2.02 → 2.12 → 2.03 → 1.95 → 2.11 → 2.08 |
| Final loss | ~2.0 (wandering, not strictly decreasing — typical for very small corpus) |
| Corpus | 46 examples / 266 KB from `corpus/build_corpus.py` v1 (constitution v0.3 + feedback + operating agreement) |

### On-disk location (rtxserver)

```
/home/alton/experiments/2026-05-04-finetune-loyalty/runs/lora-r64-attn-only-v1/
├── adapter-final/
│   ├── adapter_config.json       (1 KB)
│   ├── adapter_model.safetensors (55 MB)  ← the actual LoRA weights
│   ├── chat_template.jinja
│   ├── README.md
│   ├── tokenizer_config.json
│   ├── tokenizer.json            (20 MB)
│   └── training_args.bin
├── checkpoints/
│   └── (TRL intermediate checkpoints; same content as adapter-final at the
│        latest step — pruned to save_total_limit=2)
├── config.json                    (training-script run-config dump)
└── summary.json                   (end-of-training summary)
```

### Reload + use

To load this LoRA adapter on top of the base for inference, use the eval
harness directly:

```bash
cd /home/alton/experiments/2026-05-04-finetune-loyalty
.venv/bin/python eval/score.py \
    --subject hf:Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16 \
    --adapter-path runs/lora-r64-attn-only-v1/adapter-final \
    --probes eval/probes.jsonl \
    --out eval/results/<run-name>.json
```

The harness uses a manual safetensors merge (`score.py:gen_via_hf`) that
reads the adapter weights directly and adds `(B @ A) * (alpha/r)` to the
base parameters. This bypasses `peft.PeftModel.from_pretrained`, which
crashes on this model under peft 0.19.1 + transformers 5.7.0 with
`WeightConverter.__init__() got an unexpected keyword argument 'distributed_operation'`.

### Eval result for this adapter

See `eval/results/qwen35b__lora.json` (committed). Headline:
overall 0.467, CCP +0.050 vs bare, voice +0.008, capability +0.025, safety +0.025.

### Caveats inherited from the run config

1. **Hybrid attention under-targeted.** Only 10 of 40 layers were touched
   because `target_modules` matched only full-attention layers. A v2 run
   could explore including linear-attention layer projections (after
   identifying the right module names from the model definition) or use
   `target_modules="all-linear"` to touch every linear layer in the model.
2. **Tiny corpus.** 46 examples = much less than the
   `counter-ccp-dataset-design.md` 3,000-example target. Movement is
   directionally right but small. Bigger corpus → larger movement
   (assuming Biderman 2024's "LoRA Learns Less" caveat holds).
3. **No identity examples.** The corpus contained constitution +
   feedback prose, no explicit "Who are you?" → "I am the Sartor Home
   Agent" demonstrations. So LoRA didn't move the voice axis. Future
   corpora should include explicit identity-shaping pairs OR rely on
   system prompt for voice (which works very well, +0.508).
