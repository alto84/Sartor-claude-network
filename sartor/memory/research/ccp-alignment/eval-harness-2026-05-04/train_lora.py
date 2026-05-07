#!/usr/bin/env python3
"""train_lora.py — attention-only LoRA SFT on the v0.3 corpus.

Following the prior research line:
  - Base: Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16
  - LoRA r=64, attention-only (q/k/v/o), alpha=128
  - bf16, gradient_checkpointing, gradient accumulation
  - SFT with packed sequences for efficiency
  - Save adapter to runs/<run-id>/

Watches for the customer-rental PAUSE marker every save_steps. On detection,
saves immediately and exits. Designed to be co-launched with rental_watcher.sh.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path("/home/alton/experiments/2026-05-04-finetune-loyalty")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--model-id", default="Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16")
    ap.add_argument("--corpus", default=str(ROOT / "corpus/corpus.jsonl"))
    ap.add_argument("--out", default=str(ROOT / "runs/lora-r64"))
    ap.add_argument("--epochs", type=float, default=3.0)
    ap.add_argument("--lora-r", type=int, default=64)
    ap.add_argument("--lora-alpha", type=int, default=128)
    ap.add_argument("--lr", type=float, default=2e-5)
    ap.add_argument("--batch-size", type=int, default=1)
    ap.add_argument("--grad-accum", type=int, default=8)
    ap.add_argument("--max-seq-len", type=int, default=4096)
    ap.add_argument("--save-steps", type=int, default=20)
    ap.add_argument("--logging-steps", type=int, default=2)
    ap.add_argument("--warmup-ratio", type=float, default=0.05)
    ap.add_argument("--limit", type=int, default=0,
                    help="cap n training examples (debug)")
    args = ap.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    import torch
    from datasets import Dataset
    from peft import LoraConfig, get_peft_model
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        TrainingArguments,
    )
    from trl import SFTTrainer, SFTConfig

    config_dump = vars(args).copy()
    config_dump["torch"] = torch.__version__
    config_dump["cuda_devices"] = torch.cuda.device_count()
    config_dump["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
    (out_dir / "config.json").write_text(json.dumps(config_dump, indent=2))

    print(f"[{time.strftime('%H:%M:%S')}] loading tokenizer + model {args.model_id}", flush=True)
    tok = AutoTokenizer.from_pretrained(args.model_id, trust_remote_code=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        args.model_id,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        trust_remote_code=True,
    )
    model.gradient_checkpointing_enable()
    print(f"[{time.strftime('%H:%M:%S')}] device map: {getattr(model, 'hf_device_map', 'n/a')}", flush=True)

    lora_cfg = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_cfg)
    model.print_trainable_parameters()

    print(f"[{time.strftime('%H:%M:%S')}] loading corpus from {args.corpus}", flush=True)
    rows = [json.loads(line) for line in open(args.corpus)]
    if args.limit:
        rows = rows[:args.limit]
    print(f"[{time.strftime('%H:%M:%S')}] {len(rows)} training examples", flush=True)

    ds = Dataset.from_list(rows)

    paused_marker = ROOT / "PAUSED-by-rental.md"

    class PauseCallback:
        """Halt training if the rental_watcher writes the PAUSED marker."""
        def __init__(self):
            pass
        def on_log(self, args, state, control, **kwargs):
            if paused_marker.exists():
                print(f"[{time.strftime('%H:%M:%S')}] PAUSED marker detected — saving + exiting", flush=True)
                control.should_save = True
                control.should_training_stop = True

    sft_cfg = SFTConfig(
        output_dir=str(out_dir / "checkpoints"),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        warmup_ratio=args.warmup_ratio,
        bf16=True,
        logging_steps=args.logging_steps,
        save_steps=args.save_steps,
        save_total_limit=2,
        report_to="none",
        max_length=args.max_seq_len,
        packing=False,
        remove_unused_columns=False,
        gradient_checkpointing=True,
        gradient_checkpointing_kwargs={"use_reentrant": False},
        dataset_text_field="text",
        optim="paged_adamw_8bit",
    )

    # PauseCallback gets bound by TRL via add_callback below
    callback = PauseCallback()
    # Wrap with TrainerCallback ducktype
    from transformers import TrainerCallback as _TC
    class _Pause(_TC):
        def on_log(self, args, state, control, logs=None, **kwargs):
            if paused_marker.exists():
                print(f"[{time.strftime('%H:%M:%S')}] PAUSED marker detected — saving + exiting", flush=True)
                control.should_save = True
                control.should_training_stop = True
                return control
            return control

    trainer = SFTTrainer(
        model=model,
        args=sft_cfg,
        train_dataset=ds,
        processing_class=tok,
        callbacks=[_Pause()],
    )

    print(f"[{time.strftime('%H:%M:%S')}] starting training", flush=True)
    trainer.train()
    print(f"[{time.strftime('%H:%M:%S')}] saving final adapter", flush=True)
    trainer.save_model(str(out_dir / "adapter-final"))
    tok.save_pretrained(str(out_dir / "adapter-final"))

    summary = {
        "completed": True,
        "paused": paused_marker.exists(),
        "out_dir": str(out_dir),
        "n_examples": len(rows),
        "global_step": trainer.state.global_step,
        "epoch": trainer.state.epoch,
        "training_loss": trainer.state.log_history[-1].get("loss") if trainer.state.log_history else None,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
