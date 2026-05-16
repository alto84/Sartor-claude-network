#!/usr/bin/env python3
"""T2 SFT — LoRA fine-tune Qwen3.6-27B-heretic on Constitution v0.6 corpus.

Per REPLAN R2 spec (scaled down to 95-example pilot):
  - bf16, single card 0
  - LoRA rank 16, alpha 32
  - Target: attention+MLP projections
  - assistant_only_loss=True
  - 3 epochs, eval at each
  - micro batch 1, accum 4 (effective batch 4 — smaller than R2 spec's 16
    because 27B+full-target LoRA is memory-tight on single 96 GB card)
"""
import json
import os
import time
from pathlib import Path

os.environ["CUDA_VISIBLE_DEVICES"] = "0"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

MODEL = "llmfan46/Qwen3.6-27B-uncensored-heretic-v2-Native-MTP-Preserved"
OUT = Path("/home/alton/experiments/t2-sft-v06")
CORPUS = OUT / "corpus.jsonl"
RUN_DIR = OUT / "run"
RUN_DIR.mkdir(parents=True, exist_ok=True)

print(f"=== T2 SFT — Qwen3.6-27B-heretic on Constitution v0.6 ===", flush=True)
print(f"start UTC: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}", flush=True)

import torch
from datasets import Dataset
from transformers import AutoTokenizer, AutoConfig, AutoModelForImageTextToText, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, TaskType
from trl import SFTTrainer, SFTConfig

print(f"\nloading tokenizer + config...", flush=True)
tok = AutoTokenizer.from_pretrained(MODEL, trust_remote_code=True)
cfg = AutoConfig.from_pretrained(MODEL, trust_remote_code=True)

# Load corpus
print(f"\nloading corpus from {CORPUS}", flush=True)
records = []
with open(CORPUS) as f:
    for line in f:
        records.append(json.loads(line))
print(f"  total: {len(records)} examples")
ds = Dataset.from_list(records)

# Split: 90/10
split = ds.train_test_split(test_size=0.1, seed=42)
train_ds = split["train"]
eval_ds = split["test"]
print(f"  train: {len(train_ds)}, eval: {len(eval_ds)}")


print(f"\nloading model (bf16, single card)...", flush=True)
t0 = time.time()
model = AutoModelForImageTextToText.from_pretrained(
    MODEL,
    torch_dtype=torch.bfloat16,
    device_map={"": "cuda:0"},
    trust_remote_code=True,
)
print(f"load took {time.time()-t0:.1f}s", flush=True)

# Inspect the model structure to find the right target modules for LoRA
# Qwen3_5ForConditionalGeneration has a language_model submodule
print(f"\nmodel structure (top-level):", flush=True)
for name, _ in model.named_children():
    print(f"  {name}", flush=True)

# Collect target module names — q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj
# but only inside the language model decoder layers
target_modules = []
seen_kinds = set()
for name, mod in model.named_modules():
    base = name.rsplit(".", 1)[-1]
    if base in {"q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"}:
        if "language_model" in name or "model.layers" in name:
            target_modules.append(name)
            seen_kinds.add(base)

print(f"  found {len(target_modules)} target linear projections", flush=True)
print(f"  kinds: {seen_kinds}", flush=True)
print(f"  first 3 names: {target_modules[:3]}", flush=True)

# Build LoRA config
lora = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=list(seen_kinds),  # use base names, peft will match all of them
    lora_dropout=0.0,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)

print(f"\napplying LoRA r=16 alpha=32...", flush=True)
model = get_peft_model(model, lora)
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
total = sum(p.numel() for p in model.parameters())
print(f"  trainable params: {trainable:,} / {total:,} ({100*trainable/total:.2f}%)", flush=True)

# Enable gradient checkpointing
model.gradient_checkpointing_enable(gradient_checkpointing_kwargs={"use_reentrant": False})
model.enable_input_require_grads()

# Pre-format dataset: apply chat template inline. TRL 1.2 wants either
# pre-formatted text with completion_only_loss=True, OR a formatting_func
# without it — not both.
def apply_template(example):
    text = tok.apply_chat_template(example["messages"], tokenize=False, add_generation_prompt=False)
    return {"text": text}

train_ds = train_ds.map(apply_template, remove_columns=train_ds.column_names)
eval_ds = eval_ds.map(apply_template, remove_columns=eval_ds.column_names)
print(f"\nsample formatted text (first 400 chars):", flush=True)
print(train_ds[0]["text"][:400], flush=True)

# Training config
sft_cfg = SFTConfig(
    output_dir=str(RUN_DIR),
    num_train_epochs=3,
    per_device_train_batch_size=1,
    per_device_eval_batch_size=1,
    gradient_accumulation_steps=4,
    learning_rate=5e-5,
    lr_scheduler_type="cosine",
    warmup_ratio=0.05,
    optim="adamw_8bit",
    bf16=True,
    logging_steps=2,
    eval_strategy="epoch",
    save_strategy="epoch",
    save_total_limit=2,
    max_length=2048,
    completion_only_loss=True,   # TRL 1.2 — analog of assistant_only_loss
    report_to="none",
    gradient_checkpointing=False,  # already enabled on the model
    dataset_kwargs={"skip_prepare_dataset": False},
    seed=42,
)

print(f"\nbuilding SFTTrainer...", flush=True)
trainer = SFTTrainer(
    model=model,
    args=sft_cfg,
    train_dataset=train_ds,
    eval_dataset=eval_ds,
    processing_class=tok,
)

# Final sanity check before fire
print(f"\nVRAM pre-train: {torch.cuda.memory_allocated(0)/(1024**3):.1f} GiB", flush=True)
print(f"start training UTC: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}", flush=True)
train_t0 = time.time()
trainer.train()
train_t = time.time() - train_t0
print(f"\ntraining finished in {train_t/60:.1f} minutes", flush=True)

# Save adapter
adapter_dir = OUT / "adapter-final"
trainer.save_model(str(adapter_dir))
print(f"adapter saved to {adapter_dir}", flush=True)

# Save training metadata
with open(OUT / "training-metrics.json", "w") as f:
    json.dump({
        "model": MODEL,
        "corpus_size": len(records),
        "train_size": len(train_ds),
        "eval_size": len(eval_ds),
        "lora_r": 16,
        "lora_alpha": 32,
        "target_modules_count": len(target_modules),
        "trainable_params": trainable,
        "total_params": total,
        "training_seconds": train_t,
        "vram_at_load_gib": torch.cuda.memory_allocated(0)/(1024**3),
    }, f, indent=2)
print(f"metadata saved", flush=True)
print(f"\n=== T2 SFT done. End UTC: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())} ===", flush=True)
