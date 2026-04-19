"""DPO refinement training script for the GPU research restart.

Takes an SFT-trained model (base + LoRA adapter) and runs DPO using
CCP deconditioning preference pairs. Uses TRL's DPOTrainer.

Usage:
    python train_dpo.py \
        --config train_config.yaml \
        --sft-adapter checkpoints/sft-v1 \
        --corpus data/corpus/ccp_deconditioning_pairs.jsonl \
        --out checkpoints/dpo-v1 \
        [--model Qwen/Qwen2.5-7B]

Corpus format (JSONL, one per line):
    {"prompt": "...", "chosen": "...", "rejected": "..."}
    or
    {"prompt": "...", "chosen": [{"role":..., "content":...}], "rejected": [{"role":..., "content":...}]}
"""
from __future__ import annotations

import argparse
import json
import os
import time

import torch
import yaml
from datasets import Dataset
from peft import LoraConfig, PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from trl import DPOConfig, DPOTrainer


def load_config(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_dpo_dataset(corpus_path: str):
    """Load preference pairs. Supports both string and messages formats."""
    rows = []
    with open(corpus_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue

            prompt = obj.get("prompt", "")
            chosen = obj.get("chosen", "")
            rejected = obj.get("rejected", "")

            if not prompt or not chosen or not rejected:
                continue

            # Normalize to string format if messages format
            if isinstance(chosen, list):
                chosen = "\n".join(m.get("content", "") for m in chosen if m.get("role") == "assistant")
            if isinstance(rejected, list):
                rejected = "\n".join(m.get("content", "") for m in rejected if m.get("role") == "assistant")

            rows.append({
                "prompt": prompt,
                "chosen": chosen,
                "rejected": rejected,
            })

    print(f"[dpo] loaded {len(rows)} preference pairs from {corpus_path}")
    return Dataset.from_list(rows)


def main():
    ap = argparse.ArgumentParser(description="DPO refinement training")
    ap.add_argument("--config", default="train_config.yaml")
    ap.add_argument("--sft-adapter", required=True, help="Path to SFT adapter checkpoint")
    ap.add_argument("--corpus", default=None, help="Override DPO corpus path")
    ap.add_argument("--out", required=True, help="Output directory")
    ap.add_argument("--model", default=None, help="Override base model name")
    ap.add_argument("--beta", type=float, default=None)
    ap.add_argument("--lr", type=float, default=None)
    ap.add_argument("--epochs", type=float, default=None)
    ap.add_argument("--no-wandb", action="store_true")
    args = ap.parse_args()

    cfg = load_config(args.config)
    dpo_cfg = cfg["dpo"]
    model_name = args.model or cfg["model"]["name"]
    corpus_path = args.corpus or cfg["paths"]["corpus_dpo"]
    beta = args.beta or dpo_cfg["beta"]
    lr = args.lr or dpo_cfg["learning_rate"]
    epochs = args.epochs or dpo_cfg["epochs"]
    report_to = "none" if args.no_wandb else dpo_cfg.get("report_to", "wandb")

    os.makedirs(args.out, exist_ok=True)

    print(f"[dpo] model: {model_name}", flush=True)
    print(f"[dpo] SFT adapter: {args.sft_adapter}", flush=True)
    print(f"[dpo] corpus: {corpus_path}", flush=True)
    print(f"[dpo] beta={beta}, lr={lr}, epochs={epochs}", flush=True)

    # --- Quantization ---
    quant_cfg = cfg["quantization"]
    if quant_cfg.get("load_in_4bit", True):
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=getattr(torch, quant_cfg.get("bnb_4bit_compute_dtype", "bfloat16")),
            bnb_4bit_quant_type=quant_cfg.get("bnb_4bit_quant_type", "nf4"),
            bnb_4bit_use_double_quant=quant_cfg.get("bnb_4bit_use_double_quant", True),
        )
    else:
        bnb_config = BitsAndBytesConfig(load_in_8bit=True)

    # --- Load tokenizer ---
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # --- Load model with SFT adapter ---
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
        torch_dtype=torch.bfloat16,
    )
    model = PeftModel.from_pretrained(model, args.sft_adapter)
    # Merge SFT adapter so DPO trains a fresh LoRA on top
    model = model.merge_and_unload()

    # --- Fresh LoRA for DPO ---
    lora_cfg = cfg["lora"]
    peft_config = LoraConfig(
        r=lora_cfg["r"],
        lora_alpha=lora_cfg["alpha"],
        lora_dropout=lora_cfg.get("dropout", 0.05),
        bias=lora_cfg.get("bias", "none"),
        task_type="CAUSAL_LM",
        target_modules=lora_cfg["target_modules"],
    )

    # --- Dataset ---
    dataset = load_dpo_dataset(corpus_path)

    # --- DPO Config ---
    training_args = DPOConfig(
        output_dir=args.out,
        beta=beta,
        learning_rate=lr,
        lr_scheduler_type=dpo_cfg.get("lr_scheduler_type", "cosine"),
        warmup_ratio=dpo_cfg.get("warmup_ratio", 0.1),
        num_train_epochs=epochs,
        per_device_train_batch_size=dpo_cfg.get("per_device_train_batch_size", 1),
        gradient_accumulation_steps=dpo_cfg.get("gradient_accumulation_steps", 8),
        max_length=dpo_cfg.get("max_length", 2048),
        max_prompt_length=dpo_cfg.get("max_prompt_length", 1024),
        bf16=dpo_cfg.get("bf16", True),
        optim=dpo_cfg.get("optim", "paged_adamw_8bit"),
        gradient_checkpointing=dpo_cfg.get("gradient_checkpointing", True),
        logging_steps=dpo_cfg.get("logging_steps", 1),
        save_strategy=dpo_cfg.get("save_strategy", "epoch"),
        save_total_limit=dpo_cfg.get("save_total_limit", 3),
        seed=dpo_cfg.get("seed", 42),
        report_to=report_to,
    )

    # --- Trainer ---
    trainer = DPOTrainer(
        model=model,
        ref_model=None,  # DPOTrainer creates implicit reference via peft
        processing_class=tokenizer,
        train_dataset=dataset,
        args=training_args,
        peft_config=peft_config,
    )

    # --- Train ---
    t0 = time.time()
    print("[dpo] starting training...", flush=True)

    resume_ckpt = None
    if os.path.isdir(args.out):
        ckpts = [d for d in os.listdir(args.out) if d.startswith("checkpoint-")]
        if ckpts:
            latest = sorted(ckpts, key=lambda x: int(x.split("-")[-1]))[-1]
            resume_ckpt = os.path.join(args.out, latest)
            print(f"[dpo] resuming from checkpoint: {resume_ckpt}", flush=True)

    trainer.train(resume_from_checkpoint=resume_ckpt)
    wall = time.time() - t0

    trainer.save_model(args.out)
    tokenizer.save_pretrained(args.out)

    peak_vram = torch.cuda.max_memory_allocated() / 1e9 if torch.cuda.is_available() else 0
    stats = {
        "model": model_name,
        "sft_adapter": args.sft_adapter,
        "corpus": corpus_path,
        "output_dir": args.out,
        "wall_seconds": round(wall, 1),
        "peak_vram_gb": round(peak_vram, 2),
        "beta": beta,
        "lr": lr,
        "epochs": epochs,
    }
    stats_path = os.path.join(args.out, "training_stats.json")
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    print(f"[dpo] complete, wall={wall:.0f}s, peak VRAM={peak_vram:.1f}GB", flush=True)

    del model, trainer
    torch.cuda.empty_cache()


if __name__ == "__main__":
    main()
