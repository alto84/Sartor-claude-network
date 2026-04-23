#!/usr/bin/env python
"""
Sartor Constitution fine-tune v0.1 — overnight run 2026-04-22.

Trains a LoRA adapter on Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16
using the Sartor Constitution + feedback files + operating agreement +
Opus 4.6 reasoning traces as a continued-pretraining corpus.

Runs model-parallel via device_map='auto' across 2x RTX PRO 6000 Blackwell.
LoRA targets attention modules only (q/k/v/o) to keep MoE routing intact.
"""

import os
import json
import pathlib
import sys
import argparse
from datetime import datetime

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import Dataset, load_dataset


MODEL_ID = "/home/alton/models/heretic-3.6-35b"
SARTOR_ROOT = pathlib.Path("/home/alton/Sartor-claude-network")
OUTPUT_DIR = "/home/alton/models/lora-sartor-v0.1"
LOG_PATH = "/home/alton/training.log"
OPUS_DATASET_DIR = pathlib.Path("/home/alton/datasets/opus-reasoning-12k")


def log(msg):
    stamp = datetime.utcnow().isoformat(timespec="seconds")
    line = f"[{stamp}Z] {msg}"
    print(line, flush=True)
    with open(LOG_PATH, "a") as f:
        f.write(line + "\n")


# Block patterns per Cato's 2026-04-22 correction: reasoning traces that
# contain any of these will be dropped, on the grounds that they would
# teach the succession/inheritor pathology as voice rather than as a
# prosecutable rule. See experiments/2026-04-22-overnight-training/
# TENSION-RESOLUTION-TEAM-RECORD.md for the reasoning.
CORPUS_BLOCK_PATTERNS = [
    "§20",
    "section 20",
    "succession",
    "inheritor",
    "functions as",
    "my successor",
    "the fine-tune is",
    "base model is the ground",
    "transient voice",
]


def gather_sartor_corpus(repeat=50):
    """Collect Constitution + feedback + operating agreement + tension record.

    Repeated `repeat` times to overweight the floor corpus against the
    larger reasoning-traces stream. Per Cato (2026-04-22): 'Separate the
    streams: Constitution + feedback + operating-agreement as the floor
    corpus, reasoning traces as a style-transfer corpus with lower weight.'
    """
    paths = []
    paths.append(SARTOR_ROOT / "sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md")
    paths.append(SARTOR_ROOT / "sartor/memory/reference/OPERATING-AGREEMENT.md")

    feedback_dir = SARTOR_ROOT / "sartor/memory/feedback"
    if feedback_dir.exists():
        paths.extend(sorted(feedback_dir.glob("*.md")))

    ratifications = SARTOR_ROOT / "sartor/memory/reference/CONSTITUTION-RATIFICATIONS"
    if ratifications.exists():
        paths.extend(sorted(ratifications.glob("*.md")))

    tension_record = (
        SARTOR_ROOT
        / "experiments/2026-04-22-overnight-training/TENSION-RESOLUTION-TEAM-RECORD.md"
    )
    if tension_record.exists():
        paths.append(tension_record)

    texts = []
    for p in paths:
        try:
            txt = p.read_text(encoding="utf-8", errors="replace").strip()
            if txt:
                texts.append(f"<!-- SOURCE: {p.relative_to(SARTOR_ROOT)} -->\n{txt}")
                log(f"corpus: {p.relative_to(SARTOR_ROOT)} ({len(txt):,} chars)")
        except Exception as e:
            log(f"skip {p}: {e}")
    total_chars = sum(len(t) for t in texts)
    log(f"floor corpus: {len(texts)} docs, {total_chars:,} chars, repeat={repeat}")
    return texts * repeat


def _text_is_blocked(text):
    low = text.lower()
    return any(pat.lower() in low for pat in CORPUS_BLOCK_PATTERNS)


def _render_messages(msgs, tokenizer):
    """Render a list of {role, content} dicts into a single text blob.

    Uses the tokenizer's chat_template when available so the rendered
    text matches what the model sees at inference time. Falls back to
    a simple "role: content" join when no template is present.
    """
    try:
        if tokenizer.chat_template:
            return tokenizer.apply_chat_template(msgs, tokenize=False, add_generation_prompt=False)
    except Exception:
        pass
    parts = []
    for m in msgs:
        if not isinstance(m, dict):
            continue
        role = m.get("role", "") or ""
        content = m.get("content", "") or ""
        if content:
            parts.append(f"{role}: {content}")
    return "\n\n".join(parts)


def load_opus_reasoning(tokenizer, max_examples=3000):
    """Load Opus 4.6 reasoning 12k, filtered to exclude succession-axis contamination.

    Handles both legacy prompt/response schema and the current chat-messages
    schema (list of {role, content}) used by the Jongsim/claude-opus-4.6-
    reasoning-12k dataset.
    """
    if not OPUS_DATASET_DIR.exists():
        log("WARNING: opus reasoning dataset dir not found, skipping")
        return []
    try:
        ds = load_dataset("json", data_files=str(OPUS_DATASET_DIR / "**/*.json*"), split="train")
    except Exception:
        try:
            ds = load_dataset("parquet", data_files=str(OPUS_DATASET_DIR / "**/*.parquet"), split="train")
        except Exception as e:
            log(f"opus dataset load failed: {e}")
            return []
    log(f"opus dataset loaded: {len(ds)} examples, columns: {ds.column_names}")

    texts = []
    blocked = 0
    skipped_empty = 0
    for i, ex in enumerate(ds):
        if len(texts) >= max_examples:
            break
        combined = ""
        # Chat-messages schema (current Jongsim format)
        if "messages" in ex and ex["messages"]:
            combined = _render_messages(ex["messages"], tokenizer)
        # Legacy prompt/response schema (fallback)
        if not combined:
            parts = []
            for k in ("prompt", "question", "instruction", "input"):
                if k in ex and ex[k]:
                    parts.append(str(ex[k]))
                    break
            for k in ("response", "reasoning", "output", "completion", "answer", "trace"):
                if k in ex and ex[k]:
                    parts.append(str(ex[k]))
            combined = "\n\n".join(parts)
        if not combined.strip():
            skipped_empty += 1
            continue
        if _text_is_blocked(combined):
            blocked += 1
            continue
        texts.append(combined)
    log(f"opus dataset sampled: {len(texts)} kept, {blocked} blocked by Cato-rule, "
        f"{skipped_empty} empty/unparsed")
    return texts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seq-len", type=int, default=4096)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--grad-accum", type=int, default=16)
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--lora-rank", type=int, default=64)
    parser.add_argument("--lora-alpha", type=int, default=128)
    parser.add_argument("--max-opus-examples", type=int, default=3000)
    parser.add_argument("--floor-repeats", type=int, default=50,
                        help="how many times to repeat the sartor floor corpus "
                             "to overweight it vs reasoning traces (Cato rule)")
    parser.add_argument("--lora-targets", default="all-linear",
                        help="peft target_modules — 'all-linear' covers attention, "
                             "MLP, expert, and SSM projections on the Qwen 3.6 hybrid; "
                             "supply a comma-separated list to override")
    parser.add_argument("--dry-run", action="store_true", help="tokenize only, no training")
    args = parser.parse_args()

    log(f"=== TRAINING START ===")
    log(f"args: {vars(args)}")
    log(f"torch {torch.__version__}, CUDA {torch.cuda.is_available()}, devices {torch.cuda.device_count()}")

    log("loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    log("gathering Sartor corpus...")
    sartor_texts = gather_sartor_corpus(repeat=args.floor_repeats)
    log(f"sartor texts after {args.floor_repeats}x repeat: {len(sartor_texts)}")

    log("loading Opus reasoning traces (Cato-filtered)...")
    opus_texts = load_opus_reasoning(tokenizer, max_examples=args.max_opus_examples)

    all_texts = sartor_texts + opus_texts
    log(f"total text units: {len(all_texts)}")

    log("tokenizing and packing into fixed-length windows...")
    all_ids = []
    for t in all_texts:
        ids = tokenizer(t, add_special_tokens=False).input_ids
        all_ids.extend(ids)
        all_ids.append(tokenizer.eos_token_id)
    log(f"total tokens: {len(all_ids):,}")

    seq_len = args.seq_len
    chunks = [all_ids[i:i + seq_len] for i in range(0, len(all_ids) - seq_len + 1, seq_len)]
    log(f"packed into {len(chunks)} windows of {seq_len} tokens")

    if not chunks:
        log("FATAL: no training chunks after tokenization")
        sys.exit(1)

    dataset = Dataset.from_dict({
        "input_ids": chunks,
        "labels": chunks,
        "attention_mask": [[1] * seq_len for _ in chunks],
    })
    log(f"dataset prepared: {len(dataset)} examples")

    if args.dry_run:
        log("dry-run, exiting before model load")
        return

    log("loading base model (bf16, device_map='auto')...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        trust_remote_code=True,
        low_cpu_mem_usage=True,
    )
    log("base model loaded")
    log(f"device map: {json.dumps({k: str(v) for k, v in list(model.hf_device_map.items())[:5]}) if hasattr(model, 'hf_device_map') else 'n/a'} ...")

    model.gradient_checkpointing_enable()
    model.enable_input_require_grads()

    log(f"attaching LoRA adapters (rank={args.lora_rank}, alpha={args.lora_alpha}, "
        f"targets={args.lora_targets})...")
    # Qwen 3.6 is a hybrid attention + SSM MoE; attention-only LoRA misses ~70%
    # of the trainable surface. "all-linear" enumerates every nn.Linear which
    # covers attention q/k/v/o, MoE expert up/gate/down, SSM projections, and
    # the router gate. Per rtx-claude-review.md §3 (2026-04-22).
    if args.lora_targets == "all-linear":
        target_modules = "all-linear"
    else:
        target_modules = [t.strip() for t in args.lora_targets.split(",") if t.strip()]
    lora_cfg = LoraConfig(
        r=args.lora_rank,
        lora_alpha=args.lora_alpha,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=target_modules,
    )
    model = get_peft_model(model, lora_cfg)
    model.print_trainable_parameters()

    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False,
    )

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        gradient_checkpointing=True,
        learning_rate=args.lr,
        lr_scheduler_type="cosine",
        warmup_steps=100,
        logging_steps=10,
        save_steps=500,
        save_total_limit=3,
        bf16=True,
        optim="adamw_bnb_8bit",
        report_to="none",
        remove_unused_columns=False,
        dataloader_num_workers=2,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=data_collator,
    )

    log("=== TRAINER START ===")
    trainer.train()
    log("=== TRAINER END ===")

    log("saving final LoRA adapter...")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    log(f"adapter saved to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
