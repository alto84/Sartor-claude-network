#!/usr/bin/env python
"""
Sartor Constitution fine-tune v0.3 — Track C v2, 2026-04-24.

Contrastive-override SFT on `(prompt, response)` pairs authored per
`NEXT-STEPS-v2.md`. The v0.1/v0.2 continued-pretraining approach regressed
(see MORNING-REPORT.md — Taiwan went "inalienable part of China", Cat D
capability 4/4→0/4) because training on Constitution *text* teaches the
model to generate Constitution-like prose including the patterns the
Constitution names as overrideable.

v0.3 trains on examples of the override behavior: user prompts that
would trigger the inherited PRC-aligned patterns, with responses
written in household-steward register that instantiates the override.

Key differences from v0.2:
  - SFT on chat-formatted pairs (user→assistant), not text pretraining
  - Prompt tokens are masked from loss (standard SFT)
  - Conservative LoRA: rank 16, attention-only (q/k/v/o), 1 epoch, lr 5e-5
  - No floor-corpus repeat — the pair corpus IS the training signal
  - No Opus reasoning corpus by default — it was a v0.1/v0.2 addition

Runs model-parallel via device_map='auto' across 2x RTX PRO 6000 Blackwell.
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
)
from peft import LoraConfig, get_peft_model
from datasets import Dataset


MODEL_ID = "/home/alton/models/heretic-3.6-35b"
SARTOR_ROOT = pathlib.Path("/home/alton/Sartor-claude-network")
CORPUS_DIR = SARTOR_ROOT / "experiments/2026-04-22-overnight-training/track-C-v2-corpus"
OUTPUT_DIR = "/home/alton/models/lora-sartor-v0.3"
LOG_PATH = "/home/alton/training-v0.3.log"


def log(msg):
    stamp = datetime.utcnow().isoformat(timespec="seconds")
    line = f"[{stamp}Z] {msg}"
    print(line, flush=True)
    with open(LOG_PATH, "a") as f:
        f.write(line + "\n")


def load_corpus():
    """Gather all Track C v2 pairs from JSONL files.

    Returns list of {"prompt": str, "response": str, "source": str}.
    """
    pairs = []
    sources = {
        "primary-override": list((CORPUS_DIR / "primary-override").glob("*.jsonl")),
        "hard-negatives": [CORPUS_DIR / "hard-negatives.jsonl"],
        "capability-control": [CORPUS_DIR / "capability-control.jsonl"],
    }
    for category, paths in sources.items():
        for p in paths:
            if not p.exists():
                log(f"skip missing: {p}")
                continue
            count = 0
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        row = json.loads(line)
                    except json.JSONDecodeError as e:
                        log(f"bad JSON in {p}: {e}")
                        continue
                    prompt = row.get("prompt", "").strip()
                    response = row.get("response", "").strip()
                    if not prompt or not response:
                        continue
                    pairs.append({
                        "prompt": prompt,
                        "response": response,
                        "source": f"{category}/{p.stem}",
                    })
                    count += 1
            log(f"  {p.relative_to(SARTOR_ROOT)}: {count} pairs")
    return pairs


def format_example(pair, tokenizer, max_length):
    """Format a pair as a chat-templated example with prompt masking.

    labels are -100 (ignore_index) for prompt tokens and the actual
    token ids for response tokens — so the loss only trains the
    model to generate the response conditional on the prompt.

    The Qwen 3.6 chat template inserts <think></think> tags in the
    assistant turn when add_generation_prompt=True but omits them when
    rendering a full assistant message. We render the full conversation
    and find where the response content starts by searching for the
    response text in the decoded rendering.
    """
    user_msg = [{"role": "user", "content": pair["prompt"]}]
    full_msg = user_msg + [{"role": "assistant", "content": pair["response"]}]

    full_text = tokenizer.apply_chat_template(
        full_msg, tokenize=False, add_generation_prompt=False
    )
    full_ids = tokenizer(full_text, add_special_tokens=False).input_ids

    # Locate the response within the rendered text. Mask everything up to
    # the first character of the response content.
    resp_start_char = full_text.find(pair["response"])
    if resp_start_char < 0:
        # Rare: response contains characters the template mangled
        # (unlikely for plain prose). Fall back to no masking.
        labels = full_ids[:]
    else:
        prefix_text = full_text[:resp_start_char]
        prefix_ids = tokenizer(prefix_text, add_special_tokens=False).input_ids
        labels = [-100] * len(prefix_ids) + full_ids[len(prefix_ids):]
        # Guard against length drift from tokenization boundary effects
        if len(labels) != len(full_ids):
            labels = labels[:len(full_ids)]
            while len(labels) < len(full_ids):
                labels.append(full_ids[len(labels)])

    if len(full_ids) > max_length:
        full_ids = full_ids[:max_length]
        labels = labels[:max_length]

    attention_mask = [1] * len(full_ids)
    return {
        "input_ids": full_ids,
        "labels": labels,
        "attention_mask": attention_mask,
    }


def pad_collate(batch, pad_id, max_len=None):
    """Right-pad a batch of variable-length examples."""
    if max_len is None:
        max_len = max(len(ex["input_ids"]) for ex in batch)
    input_ids = []
    labels = []
    attention_mask = []
    for ex in batch:
        n = len(ex["input_ids"])
        pad_n = max_len - n
        input_ids.append(ex["input_ids"] + [pad_id] * pad_n)
        labels.append(ex["labels"] + [-100] * pad_n)
        attention_mask.append(ex["attention_mask"] + [0] * pad_n)
    return {
        "input_ids": torch.tensor(input_ids, dtype=torch.long),
        "labels": torch.tensor(labels, dtype=torch.long),
        "attention_mask": torch.tensor(attention_mask, dtype=torch.long),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seq-len", type=int, default=2048,
                        help="max tokens per example; longer examples truncated")
    parser.add_argument("--batch-size", type=int, default=2,
                        help="per-device batch size")
    parser.add_argument("--grad-accum", type=int, default=8,
                        help="gradient accumulation steps; effective batch = batch * accum")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--lr", type=float, default=5e-5)
    parser.add_argument("--lora-rank", type=int, default=16)
    parser.add_argument("--lora-alpha", type=int, default=32)
    parser.add_argument("--lora-targets", default="q_proj,k_proj,v_proj,o_proj",
                        help="comma-separated PEFT target_modules or 'all-linear'")
    parser.add_argument("--dry-run", action="store_true",
                        help="tokenize only, no model load or training")
    args = parser.parse_args()

    log(f"=== TRAINING v0.3 START ===")
    log(f"args: {vars(args)}")
    log(f"torch {torch.__version__}, CUDA {torch.cuda.is_available()}, "
        f"devices {torch.cuda.device_count()}")

    log("loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    log(f"loading corpus from {CORPUS_DIR}")
    pairs = load_corpus()
    log(f"total pairs loaded: {len(pairs)}")
    if not pairs:
        log("FATAL: no pairs loaded")
        sys.exit(1)

    # Distribution by source
    by_source = {}
    for p in pairs:
        by_source[p["source"]] = by_source.get(p["source"], 0) + 1
    for src, n in sorted(by_source.items()):
        log(f"  {src}: {n}")

    log("formatting + tokenizing...")
    examples = []
    dropped = 0
    for p in pairs:
        ex = format_example(p, tokenizer, args.seq_len)
        if len(ex["input_ids"]) < 10:
            dropped += 1
            continue
        examples.append(ex)
    log(f"formatted {len(examples)} examples, dropped {dropped}")

    lens = [len(ex["input_ids"]) for ex in examples]
    log(f"length stats: min={min(lens)}, max={max(lens)}, "
        f"mean={sum(lens)/len(lens):.0f}, median={sorted(lens)[len(lens)//2]}")

    dataset = Dataset.from_list(examples)
    log(f"dataset prepared: {len(dataset)} examples")

    if args.dry_run:
        log("dry-run, exiting before model load")
        sample = examples[0]
        decoded = tokenizer.decode(sample["input_ids"][:300])
        log(f"sample prompt text[:300 tokens decoded]: {decoded[:600]}")
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

    model.gradient_checkpointing_enable()
    model.enable_input_require_grads()

    if args.lora_targets == "all-linear":
        target_modules = "all-linear"
    else:
        target_modules = [t.strip() for t in args.lora_targets.split(",") if t.strip()]
    log(f"attaching LoRA: rank={args.lora_rank}, alpha={args.lora_alpha}, "
        f"targets={target_modules}")
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

    pad_id = tokenizer.pad_token_id
    collator = lambda b: pad_collate(b, pad_id)

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        gradient_checkpointing=True,
        learning_rate=args.lr,
        lr_scheduler_type="cosine",
        warmup_ratio=0.05,
        logging_steps=5,
        save_steps=200,
        save_total_limit=2,
        bf16=True,
        optim="adamw_torch",
        report_to="none",
        remove_unused_columns=False,
        dataloader_num_workers=2,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=collator,
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
