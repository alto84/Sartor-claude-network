"""SFT LoRA training entry point.

Primary path: Unsloth FastLanguageModel (faster, memory-lean).
Fallback path: HuggingFace Transformers + PEFT + TRL SFTTrainer
(trigger via --fallback or automatically on Unsloth load errors).

Nemotron-3-Nano is a hybrid Mamba-Transformer, so if LoRA on all-linear
targets misbehaves, we re-run with --attn-only to target attention + MLP
projections only and skip Mamba.

Usage:
    python train_sft.py \
        --model nvidia/NVIDIA-Nemotron-3-Nano-4B-BF16 \
        --corpus mini-lab/corpus/constitution_plus_household.jsonl \
        --out mini-lab/checkpoints/sft-v1 \
        --epochs 3 --lr 2e-4 --r 32 --alpha 32

Incremental artifacts:
    <out>/train.log  -- stdout/loss per step
    <out>/step-{N}/  -- periodic checkpoints
    <out>/          -- final merged adapter
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import sys
import time
import traceback

SCRIPTS = pathlib.Path(__file__).parent
sys.path.insert(0, str(SCRIPTS))
import wake_lock  # noqa: E402


def build_dataset(corpus_path: str, tokenizer, max_length: int):
    """Legacy text-format dataset. Prone to chat-template leakage because loss
    is computed over the entire rendered template including the turn-marker
    role delimiters.  Use build_messages_dataset + assistant_only_loss=True
    on SFTTrainer instead."""
    from datasets import Dataset

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
            if "messages" in obj:
                text = tokenizer.apply_chat_template(
                    obj["messages"], tokenize=False, add_generation_prompt=False
                )
            elif "text" in obj:
                text = obj["text"]
            elif "prompt" in obj and "completion" in obj:
                text = obj["prompt"] + obj["completion"]
            else:
                continue
            rows.append({"text": text})
    print(f"[train_sft] loaded {len(rows)} training rows from {corpus_path}")
    ds = Dataset.from_list(rows)
    return ds


def build_messages_dataset(corpus_path: str):
    """Conversational-format dataset. Passes raw `messages` through so SFTTrainer
    can apply assistant-only loss masking, preventing role-delimiter tokens from
    entering the loss target."""
    from datasets import Dataset

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
            if "messages" in obj:
                rows.append({"messages": obj["messages"]})
    print(f"[train_sft] loaded {len(rows)} conversational rows from {corpus_path}")
    return Dataset.from_list(rows)


NEMOTRON_MINI_ASSISTANT_RAW = (
    "{% elif message['role'] == 'assistant' %}"
    "{{ '<extra_id_1>Assistant\n' + message['content'].strip() + '\n' }}"
)
NEMOTRON_MINI_ASSISTANT_MARKED = (
    "{% elif message['role'] == 'assistant' %}"
    "{{ '<extra_id_1>Assistant\n' }}"
    "{% generation %}{{ message['content'].strip() + '\n' }}{% endgeneration %}"
)


def patch_chat_template_for_assistant_masking(tokenizer):
    """Add Jinja {% generation %}/{% endgeneration %} wrappers around the
    assistant content so TRL's assistant_only_loss can produce a valid mask.
    Nemotron-Mini-Instruct ships without them.

    Returns the patched template string; the caller should assign it to
    tokenizer.chat_template. Verified at import time that the exact substring
    match exists, raising a clear error if the template changes upstream.
    """
    ct = tokenizer.chat_template or ""
    if NEMOTRON_MINI_ASSISTANT_RAW not in ct:
        raise RuntimeError(
            "Nemotron-Mini chat template unexpected shape; cannot patch for "
            "assistant-only loss. Update the marker strings in train_sft.py."
        )
    return ct.replace(NEMOTRON_MINI_ASSISTANT_RAW, NEMOTRON_MINI_ASSISTANT_MARKED)


def target_modules(attn_only: bool):
    if attn_only:
        return ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    return "all-linear"


def build_callbacks(loss_log_path: str, epoch1_ckpt_dir: str):
    """Per-step loss logging + end-of-epoch-1 checkpoint for small-corpus SFT."""
    from transformers import TrainerCallback

    pathlib.Path(loss_log_path).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(epoch1_ckpt_dir).mkdir(parents=True, exist_ok=True)

    class LossLogger(TrainerCallback):
        def on_log(self, args, state, control, logs=None, **kwargs):
            if not logs:
                return
            row = {
                "step": state.global_step,
                "epoch": round(state.epoch or 0.0, 4),
                "loss": logs.get("loss"),
                "lr": logs.get("learning_rate"),
            }
            if row["loss"] is None:
                return
            with open(loss_log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(row) + "\n")
                f.flush()
                os.fsync(f.fileno())

    class Epoch1Saver(TrainerCallback):
        def __init__(self):
            self.saved = False

        def on_epoch_end(self, args, state, control, **kwargs):
            if self.saved:
                return
            ep = round(state.epoch or 0.0, 2)
            if ep < 1.0 - 1e-6:
                return
            model = kwargs.get("model")
            tokenizer = kwargs.get("tokenizer") or kwargs.get("processing_class")
            try:
                model.save_pretrained(epoch1_ckpt_dir)
                if tokenizer is not None:
                    tokenizer.save_pretrained(epoch1_ckpt_dir)
                print(f"[train_sft] saved epoch-1 checkpoint -> {epoch1_ckpt_dir}", flush=True)
                self.saved = True
            except Exception as e:  # noqa: BLE001
                print(f"[train_sft] epoch-1 save failed: {e}", flush=True)

    return [LossLogger(), Epoch1Saver()]


def run_unsloth(args):
    import torch  # noqa: F401
    from unsloth import FastLanguageModel

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.model,
        max_seq_length=args.max_seq_length,
        dtype=None,
        load_in_4bit=False,
        trust_remote_code=True,
    )
    model = FastLanguageModel.get_peft_model(
        model,
        r=args.r,
        target_modules=target_modules(args.attn_only),
        lora_alpha=args.alpha,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    ds = build_dataset(args.corpus, tokenizer, args.max_seq_length)

    from trl import SFTConfig, SFTTrainer
    sft_config = SFTConfig(
        output_dir=args.out,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        num_train_epochs=args.epochs,
        learning_rate=args.lr,
        warmup_ratio=args.warmup_ratio,
        lr_scheduler_type="cosine",
        logging_steps=1,
        save_steps=args.save_steps,
        save_total_limit=3,
        bf16=True,
        fp16=False,
        optim="adamw_8bit",
        dataset_text_field="text",
        max_length=args.max_seq_length,
        report_to="none",
        seed=42,
    )
    callbacks = build_callbacks(args.loss_log, args.epoch1_ckpt)
    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=ds,
        args=sft_config,
        callbacks=callbacks,
    )
    trainer.train()
    trainer.save_model(args.out)
    tokenizer.save_pretrained(args.out)


def run_fallback(args):
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import LoraConfig, get_peft_model
    from trl import SFTConfig, SFTTrainer

    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    if args.assistant_only_loss:
        tokenizer.chat_template = patch_chat_template_for_assistant_masking(tokenizer)
        print("[train_sft] patched chat_template with generation markers", flush=True)
    model = AutoModelForCausalLM.from_pretrained(
        args.model,
        dtype=torch.bfloat16,
        device_map="cuda",
        trust_remote_code=True,
    )
    model.gradient_checkpointing_enable()

    lora = LoraConfig(
        r=args.r,
        lora_alpha=args.alpha,
        lora_dropout=0.0,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=target_modules(args.attn_only),
    )
    model = get_peft_model(model, lora)
    model.print_trainable_parameters()

    if args.assistant_only_loss:
        ds = build_messages_dataset(args.corpus)
    else:
        ds = build_dataset(args.corpus, tokenizer, args.max_seq_length)

    sft_kwargs = dict(
        output_dir=args.out,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        num_train_epochs=args.epochs,
        learning_rate=args.lr,
        warmup_ratio=args.warmup_ratio,
        lr_scheduler_type="cosine",
        logging_steps=1,
        save_strategy=args.save_strategy,
        save_steps=args.save_steps,
        save_total_limit=args.save_total_limit,
        bf16=True,
        fp16=False,
        max_length=args.max_seq_length,
        report_to="none",
        seed=42,
    )
    if args.assistant_only_loss:
        sft_kwargs["assistant_only_loss"] = True
    else:
        sft_kwargs["dataset_text_field"] = "text"
    sft_config = SFTConfig(**sft_kwargs)
    callbacks = build_callbacks(args.loss_log, args.epoch1_ckpt)
    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=ds,
        args=sft_config,
        callbacks=callbacks,
    )
    trainer.train()
    trainer.save_model(args.out)
    tokenizer.save_pretrained(args.out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--corpus", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--epochs", type=float, default=3.0)
    ap.add_argument("--lr", type=float, default=2e-4)
    ap.add_argument("--r", type=int, default=32)
    ap.add_argument("--alpha", type=int, default=32)
    ap.add_argument("--batch-size", type=int, default=1)
    ap.add_argument("--grad-accum", type=int, default=8)
    ap.add_argument("--max-seq-length", type=int, default=2048)
    ap.add_argument("--save-steps", type=int, default=50)
    ap.add_argument("--save-strategy", default="steps", choices=["steps", "epoch", "no"])
    ap.add_argument("--save-total-limit", type=int, default=12)
    ap.add_argument("--warmup-ratio", type=float, default=0.1)
    ap.add_argument("--loss-log", default="C:/Users/alto8/abliteration-exp/mini-lab/logs/sft-v1-loss.jsonl")
    ap.add_argument("--epoch1-ckpt", default="C:/Users/alto8/abliteration-exp/mini-lab/checkpoints/sft-v1/epoch-1")
    ap.add_argument("--attn-only", action="store_true")
    ap.add_argument("--fallback", action="store_true", help="skip Unsloth entirely")
    ap.add_argument("--assistant-only-loss", action="store_true",
                    help="use TRL assistant_only_loss and conversational dataset format")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    t0 = time.time()
    with wake_lock.keep_awake(f"sft-{pathlib.Path(args.out).name}"):
        if args.fallback:
            print("[train_sft] forced fallback: transformers+peft")
            run_fallback(args)
        else:
            try:
                run_unsloth(args)
            except Exception as e:  # noqa: BLE001
                print(f"[train_sft] unsloth path failed: {e}", flush=True)
                traceback.print_exc()
                print("[train_sft] retrying with transformers+peft fallback", flush=True)
                run_fallback(args)
    print(f"[train_sft] done, wall={time.time()-t0:.0f}s, out={args.out}", flush=True)


if __name__ == "__main__":
    main()
