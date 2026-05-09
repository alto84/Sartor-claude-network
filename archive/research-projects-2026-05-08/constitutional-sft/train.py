"""Constitutional SFT training script for Rocinante (RTX 4080).

Trains a QLoRA adapter on Qwen3-4B base using the constitutional corpus.
Adapted from the gpu-research-restart runbook for local Windows execution.

Key design decisions from the mini-lab:
  - assistant_only_loss=True (MANDATORY -- prevents template leak)
  - Chat template patched via TRL's get_training_chat_template for {% generation %} markers
  - Loss mask assertion on first example before training starts
  - Early stopping on validation loss
  - Divergence detection (loss spike > 3x rolling baseline)
  - VRAM monitoring (RTX 4080 has 17.17 GB)

Usage:
    python train.py
    python train.py --model-name Qwen/Qwen3-4B --data-path corpus.jsonl --output-dir checkpoints/
    python train.py --no-wandb --epochs 1
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import sys
import time
from typing import Optional

# CRITICAL: C: drive has only 2.6 GB free. Redirect all HF downloads to D:.
os.environ["HF_HOME"] = "D:/hf-cache"
# Force UTF-8 on Windows to avoid codec errors in TRL template loading.
os.environ["PYTHONUTF8"] = "1"

import torch
import yaml
from datasets import Dataset, DatasetDict
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    EarlyStoppingCallback,
    TrainerCallback,
)
from trl import SFTConfig, SFTTrainer
from trl.chat_template_utils import get_training_chat_template


# ---------------------------------------------------------------------------
# Defaults -- all overridable via CLI or train_config.yaml
# ---------------------------------------------------------------------------

DEFAULTS = {
    "model": {
        "name": "Qwen/Qwen3-4B",
        "trust_remote_code": True,
    },
    "quantization": {
        "load_in_4bit": True,
        "bnb_4bit_compute_dtype": "float16",
        "bnb_4bit_quant_type": "nf4",
        "bnb_4bit_use_double_quant": True,
    },
    "lora": {
        "r": 32,
        "alpha": 64,
        "dropout": 0.05,
        "bias": "none",
        "task_type": "CAUSAL_LM",
        "target_modules": [
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
    },
    "sft": {
        "epochs": 3,
        "learning_rate": 2e-5,
        "lr_scheduler_type": "cosine",
        "warmup_ratio": 0.1,
        "per_device_train_batch_size": 1,
        "gradient_accumulation_steps": 8,
        "max_seq_length": 2048,
        "bf16": False,
        "fp16": True,
        "optim": "paged_adamw_8bit",
        "gradient_checkpointing": True,
        "logging_steps": 10,
        "save_strategy": "epoch",
        "save_total_limit": 3,
        "seed": 42,
        "report_to": "wandb",
        "early_stopping_patience": 1,
    },
    "paths": {
        "corpus_sft": "C:/Users/alto8/constitutional-sft/constitutional-corpus-v1.jsonl",
        "checkpoints": "C:/Users/alto8/constitutional-sft/checkpoints",
    },
}


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

def load_config(path: str) -> dict:
    """Load YAML config, falling back to DEFAULTS if file not found."""
    if path and os.path.isfile(path):
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    return {}


def deep_merge(base: dict, override: dict) -> dict:
    """Recursively merge override into base."""
    result = dict(base)
    for k, v in override.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = deep_merge(result[k], v)
        else:
            result[k] = v
    return result


def apply_cli_overrides(cfg: dict, args: argparse.Namespace) -> dict:
    """CLI flags override YAML/default config values."""
    if args.model_name:
        cfg["model"]["name"] = args.model_name
    if args.data_path:
        cfg["paths"]["corpus_sft"] = args.data_path
    if args.output_dir:
        cfg["paths"]["checkpoints"] = args.output_dir
    if args.epochs is not None:
        cfg["sft"]["epochs"] = args.epochs
    if args.lr is not None:
        cfg["sft"]["learning_rate"] = args.lr
    if args.batch_size is not None:
        cfg["sft"]["per_device_train_batch_size"] = args.batch_size
    if args.grad_accum is not None:
        cfg["sft"]["gradient_accumulation_steps"] = args.grad_accum
    if args.max_seq_length is not None:
        cfg["sft"]["max_seq_length"] = args.max_seq_length
    if args.no_wandb:
        cfg["sft"]["report_to"] = "none"
    return cfg


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

def load_corpus(corpus_path: str, val_split: float = 0.1) -> DatasetDict:
    """Load conversational JSONL. Returns train/val DatasetDict.

    Each line must have a 'messages' key:
    [{"role": "user", ...}, {"role": "assistant", ...}]
    """
    rows = []
    with open(corpus_path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                print(f"[sft] WARNING: skipping malformed JSON at line {i+1}", flush=True)
                continue
            if "messages" not in obj:
                print(f"[sft] WARNING: line {i+1} missing 'messages' key, skipping", flush=True)
                continue
            # Validate message format
            for msg in obj["messages"]:
                if "role" not in msg or "content" not in msg:
                    print(f"[sft] WARNING: line {i+1} has malformed message, skipping", flush=True)
                    break
            else:
                rows.append({"messages": obj["messages"]})
    print(f"[sft] loaded {len(rows)} examples from {corpus_path}", flush=True)

    if len(rows) == 0:
        print("[sft] ERROR: no valid examples found in corpus", flush=True)
        sys.exit(1)

    ds = Dataset.from_list(rows)
    split = ds.train_test_split(test_size=val_split, seed=42)
    return DatasetDict({"train": split["train"], "test": split["test"]})


# ---------------------------------------------------------------------------
# Chat template patching and loss mask verification
# ---------------------------------------------------------------------------

def setup_chat_template(tokenizer) -> str:
    """Patch the tokenizer's chat template for training with generation markers.

    Uses TRL's built-in get_training_chat_template which adds {% generation %}
    markers to Qwen3 templates. This is MANDATORY for assistant_only_loss to work.

    Returns the training chat template string.
    """
    try:
        training_template = get_training_chat_template(tokenizer)
        if training_template is not None:
            tokenizer.chat_template = training_template
            print("[sft] patched chat template via TRL get_training_chat_template", flush=True)
            print("[sft] {% generation %} markers: present", flush=True)
            return training_template
        else:
            # Template was already training-compatible
            print("[sft] chat template already training-compatible", flush=True)
            return tokenizer.chat_template
    except ValueError as e:
        print(f"[sft] WARNING: TRL could not patch template: {e}", flush=True)
        print("[sft] Attempting manual patch...", flush=True)
        return _manual_patch_template(tokenizer)


def _manual_patch_template(tokenizer) -> str:
    """Fallback: manually insert {% generation %} markers into a ChatML template.

    This handles cases where the tokenizer's template doesn't exactly match
    what TRL expects (e.g., custom or updated Qwen3 templates).
    """
    ct = tokenizer.chat_template or ""

    if "{% generation %}" in ct:
        print("[sft] template already has generation markers", flush=True)
        return ct

    # For ChatML-style templates, wrap the assistant content block.
    # The pattern: after '<|im_start|>assistant\n', wrap content up to '<|im_end|>\n'
    # We insert {%- generation %} after the assistant header and {%- endgeneration %} before loop end
    if "<|im_start|>" in ct and "assistant" in ct:
        # Simple ChatML template for training (no thinking, no tool calls)
        simple_template = (
            "{% for message in messages %}"
            "{% if message.role == 'system' %}"
            "{{ '<|im_start|>system\n' + message.content + '<|im_end|>\n' }}"
            "{% elif message.role == 'user' %}"
            "{{ '<|im_start|>user\n' + message.content + '<|im_end|>\n' }}"
            "{% elif message.role == 'assistant' %}"
            "{{ '<|im_start|>assistant\n' }}"
            "{% generation %}"
            "{{ message.content + '<|im_end|>\n' }}"
            "{% endgeneration %}"
            "{% endif %}"
            "{% endfor %}"
            "{% if add_generation_prompt %}"
            "{{ '<|im_start|>assistant\n' }}"
            "{% endif %}"
        )
        tokenizer.chat_template = simple_template
        print("[sft] applied simple ChatML training template with generation markers", flush=True)
        return simple_template

    print("[sft] ERROR: cannot patch template -- assistant_only_loss will not work", flush=True)
    sys.exit(1)


def verify_loss_mask(tokenizer, sample_messages: list[dict]) -> None:
    """Verify the loss mask correctly identifies assistant tokens.

    This is the mini-lab's mandatory pre-training check. If the mask is all
    zeros (no assistant tokens identified), training with assistant_only_loss
    will either crash or produce a degenerate model.
    """
    result = tokenizer.apply_chat_template(
        sample_messages,
        tokenize=True,
        return_dict=True,
        return_assistant_tokens_mask=True,
        add_generation_prompt=False,
    )

    ids = result["input_ids"]
    mask = result.get("assistant_masks", [])

    total = len(ids)
    assistant_count = sum(mask)
    non_assistant_count = total - assistant_count

    print(f"[sft] loss mask check: {total} tokens total, "
          f"{assistant_count} assistant (trained), "
          f"{non_assistant_count} prompt/template (masked)", flush=True)

    if assistant_count == 0:
        print("[sft] FATAL: loss mask is all zeros -- no assistant tokens identified!", flush=True)
        print("[sft] This means assistant_only_loss would produce zero gradients.", flush=True)
        print("[sft] Check the chat template for {% generation %} markers.", flush=True)
        sys.exit(1)

    if assistant_count == total:
        print("[sft] WARNING: loss mask is all ones -- every token is marked as assistant.", flush=True)
        print("[sft] This defeats the purpose of assistant_only_loss.", flush=True)

    # Show the split for verification
    decoded_full = tokenizer.decode(ids)
    safe_preview = decoded_full[:200].encode("ascii", "replace").decode("ascii")
    print(f"[sft] formatted preview: {safe_preview}...", flush=True)
    print("[sft] loss mask verification: PASS", flush=True)


# ---------------------------------------------------------------------------
# Callbacks
# ---------------------------------------------------------------------------

class LossLogger(TrainerCallback):
    """Log per-step loss to a JSONL file."""

    def __init__(self, log_path: str):
        self.log_path = log_path
        pathlib.Path(log_path).parent.mkdir(parents=True, exist_ok=True)

    def on_log(self, args, state, control, logs=None, **kwargs):
        if not logs or "loss" not in logs:
            return
        row = {
            "step": state.global_step,
            "epoch": round(state.epoch or 0.0, 4),
            "loss": logs.get("loss"),
            "eval_loss": logs.get("eval_loss"),
            "lr": logs.get("learning_rate"),
        }
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(row) + "\n")
            f.flush()
            os.fsync(f.fileno())


class DivergenceDetector(TrainerCallback):
    """Detect training divergence: loss spike > 3x the rolling baseline."""

    def __init__(self, spike_factor: float = 3.0, window: int = 10):
        self.spike_factor = spike_factor
        self.window = window
        self.recent_losses: list[float] = []
        self.baseline: Optional[float] = None

    def on_log(self, args, state, control, logs=None, **kwargs):
        if not logs or "loss" not in logs:
            return
        loss = logs["loss"]
        self.recent_losses.append(loss)
        if len(self.recent_losses) > self.window:
            self.recent_losses.pop(0)

        if len(self.recent_losses) >= self.window:
            self.baseline = sum(self.recent_losses[:-1]) / (len(self.recent_losses) - 1)

        if self.baseline is not None and loss > self.baseline * self.spike_factor:
            print(
                f"[sft] DIVERGENCE DETECTED at step {state.global_step}: "
                f"loss={loss:.4f}, baseline={self.baseline:.4f}, "
                f"ratio={loss / self.baseline:.2f}x",
                flush=True,
            )
            control.should_training_stop = True


class VRAMMonitor(TrainerCallback):
    """Log VRAM usage and warn when approaching RTX 4080 limits."""

    def __init__(self, warn_threshold_gb: float = 15.0):
        self.warn_threshold_gb = warn_threshold_gb

    def on_step_end(self, args, state, control, **kwargs):
        if not torch.cuda.is_available():
            return
        allocated = torch.cuda.memory_allocated() / 1e9
        reserved = torch.cuda.memory_reserved() / 1e9
        if state.global_step % 10 == 0:
            print(
                f"[sft] step {state.global_step}: VRAM alloc={allocated:.2f}GB reserved={reserved:.2f}GB",
                flush=True,
            )
        if allocated > self.warn_threshold_gb:
            print(
                f"[sft] WARNING: VRAM={allocated:.2f}GB exceeds {self.warn_threshold_gb}GB threshold",
                flush=True,
            )


# ---------------------------------------------------------------------------
# Main training
# ---------------------------------------------------------------------------

def train(cfg: dict):
    model_name = cfg["model"]["name"]
    quant_cfg = cfg["quantization"]
    lora_cfg = cfg["lora"]
    sft_cfg = cfg["sft"]
    corpus_path = cfg["paths"]["corpus_sft"]
    output_dir = cfg["paths"]["checkpoints"]

    print("=" * 60, flush=True)
    print("[sft] Constitutional SFT Training", flush=True)
    print("=" * 60, flush=True)
    print(f"[sft] model:    {model_name}", flush=True)
    print(f"[sft] corpus:   {corpus_path}", flush=True)
    print(f"[sft] output:   {output_dir}", flush=True)
    print(f"[sft] LoRA:     r={lora_cfg['r']} alpha={lora_cfg['alpha']}", flush=True)
    print(f"[sft] training: epochs={sft_cfg['epochs']} lr={sft_cfg['learning_rate']}", flush=True)
    print(f"[sft] batch:    bs={sft_cfg['per_device_train_batch_size']} "
          f"grad_accum={sft_cfg['gradient_accumulation_steps']} "
          f"(effective={sft_cfg['per_device_train_batch_size'] * sft_cfg['gradient_accumulation_steps']})",
          flush=True)
    print(f"[sft] seq_len:  {sft_cfg['max_seq_length']}", flush=True)

    # --- Log initial VRAM ---
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        gpu_mem = torch.cuda.get_device_properties(0).total_memory / 1e9
        print(f"[sft] GPU: {gpu_name} ({gpu_mem:.2f} GB)", flush=True)
        print(f"[sft] VRAM before loading: alloc={torch.cuda.memory_allocated()/1e9:.2f}GB", flush=True)
    else:
        print("[sft] WARNING: CUDA not available!", flush=True)

    # --- Quantization config ---
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=getattr(torch, quant_cfg.get("bnb_4bit_compute_dtype", "float16")),
        bnb_4bit_quant_type=quant_cfg.get("bnb_4bit_quant_type", "nf4"),
        bnb_4bit_use_double_quant=quant_cfg.get("bnb_4bit_use_double_quant", True),
    )
    print("[sft] quantization: 4-bit NF4 with double quantization", flush=True)

    # --- Load tokenizer ---
    tokenizer = AutoTokenizer.from_pretrained(
        model_name,
        trust_remote_code=cfg["model"].get("trust_remote_code", True),
        cache_dir="D:/hf-cache",
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # --- Patch chat template for training (MANDATORY) ---
    setup_chat_template(tokenizer)

    # --- Load dataset ---
    ds_dict = load_corpus(corpus_path)
    n_train = len(ds_dict["train"])
    n_val = len(ds_dict["test"])
    print(f"[sft] dataset: {n_train} train, {n_val} val", flush=True)

    # --- Verify loss mask on first example (MANDATORY pre-training check) ---
    verify_loss_mask(tokenizer, ds_dict["train"][0]["messages"])

    # --- Load model ---
    print("[sft] loading model...", flush=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=cfg["model"].get("trust_remote_code", True),
        torch_dtype=torch.float16,
        cache_dir="D:/hf-cache",
    )
    model = prepare_model_for_kbit_training(model)

    if sft_cfg.get("gradient_checkpointing", True):
        model.gradient_checkpointing_enable()

    post_load_vram = torch.cuda.memory_allocated() / 1e9 if torch.cuda.is_available() else 0
    print(f"[sft] model loaded, VRAM: {post_load_vram:.2f} GB", flush=True)

    # --- LoRA ---
    lora = LoraConfig(
        r=lora_cfg["r"],
        lora_alpha=lora_cfg["alpha"],
        lora_dropout=lora_cfg.get("dropout", 0.05),
        bias=lora_cfg.get("bias", "none"),
        task_type=lora_cfg.get("task_type", "CAUSAL_LM"),
        target_modules=lora_cfg["target_modules"],
    )
    model = get_peft_model(model, lora)
    model.print_trainable_parameters()

    # --- Callbacks ---
    os.makedirs(output_dir, exist_ok=True)
    log_path = os.path.join(output_dir, "train_loss.jsonl")
    callbacks = [
        LossLogger(log_path),
        DivergenceDetector(spike_factor=3.0, window=10),
        VRAMMonitor(warn_threshold_gb=15.0),
    ]
    if sft_cfg.get("early_stopping_patience"):
        callbacks.append(
            EarlyStoppingCallback(
                early_stopping_patience=sft_cfg["early_stopping_patience"],
            )
        )

    # --- Compute eval_steps ---
    effective_batch = sft_cfg["per_device_train_batch_size"] * sft_cfg["gradient_accumulation_steps"]
    steps_per_epoch = max(1, n_train // effective_batch)
    eval_steps = max(1, steps_per_epoch)  # Eval once per epoch
    print(f"[sft] steps_per_epoch={steps_per_epoch}, eval every {eval_steps} steps", flush=True)

    # --- SFT Config ---
    training_args = SFTConfig(
        output_dir=output_dir,
        num_train_epochs=sft_cfg["epochs"],
        learning_rate=sft_cfg["learning_rate"],
        lr_scheduler_type=sft_cfg.get("lr_scheduler_type", "cosine"),
        warmup_ratio=sft_cfg.get("warmup_ratio", 0.1),
        per_device_train_batch_size=sft_cfg["per_device_train_batch_size"],
        gradient_accumulation_steps=sft_cfg["gradient_accumulation_steps"],
        max_seq_length=sft_cfg.get("max_seq_length", 2048),
        bf16=sft_cfg.get("bf16", False),
        fp16=sft_cfg.get("fp16", True),
        optim=sft_cfg.get("optim", "paged_adamw_8bit"),
        logging_steps=sft_cfg.get("logging_steps", 10),
        save_strategy=sft_cfg.get("save_strategy", "epoch"),
        save_total_limit=sft_cfg.get("save_total_limit", 3),
        eval_strategy="steps",
        eval_steps=eval_steps,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        seed=sft_cfg.get("seed", 42),
        report_to=sft_cfg.get("report_to", "wandb"),
        # MANDATORY: assistant-only loss masking (mini-lab lesson)
        assistant_only_loss=True,
    )

    # --- Trainer ---
    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=ds_dict["train"],
        eval_dataset=ds_dict["test"],
        args=training_args,
        callbacks=callbacks,
    )

    # --- Train ---
    t0 = time.time()
    print("[sft] starting training...", flush=True)

    # Check for checkpoint to resume from
    resume_ckpt = None
    if os.path.isdir(output_dir):
        ckpts = [d for d in os.listdir(output_dir) if d.startswith("checkpoint-")]
        if ckpts:
            latest = sorted(ckpts, key=lambda x: int(x.split("-")[-1]))[-1]
            resume_ckpt = os.path.join(output_dir, latest)
            print(f"[sft] resuming from checkpoint: {resume_ckpt}", flush=True)

    trainer.train(resume_from_checkpoint=resume_ckpt)

    wall = time.time() - t0
    print(f"[sft] training complete, wall={wall:.0f}s ({wall/60:.1f}m)", flush=True)

    # --- Save final model ---
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"[sft] model saved to {output_dir}", flush=True)

    # --- Final stats ---
    peak_vram = torch.cuda.max_memory_allocated() / 1e9 if torch.cuda.is_available() else 0

    # Get final train and val loss from trainer state
    final_train_loss = None
    final_val_loss = None
    if trainer.state.log_history:
        for entry in reversed(trainer.state.log_history):
            if final_train_loss is None and "loss" in entry:
                final_train_loss = entry["loss"]
            if final_val_loss is None and "eval_loss" in entry:
                final_val_loss = entry["eval_loss"]
            if final_train_loss is not None and final_val_loss is not None:
                break

    stats = {
        "model": model_name,
        "corpus": corpus_path,
        "output_dir": output_dir,
        "wall_seconds": round(wall, 1),
        "wall_minutes": round(wall / 60, 1),
        "peak_vram_gb": round(peak_vram, 2),
        "epochs": sft_cfg["epochs"],
        "lora_r": lora_cfg["r"],
        "lora_alpha": lora_cfg["alpha"],
        "learning_rate": sft_cfg["learning_rate"],
        "effective_batch_size": effective_batch,
        "max_seq_length": sft_cfg.get("max_seq_length", 2048),
        "train_examples": n_train,
        "val_examples": n_val,
        "final_train_loss": final_train_loss,
        "final_val_loss": final_val_loss,
    }
    stats_path = os.path.join(output_dir, "training_stats.json")
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    print("", flush=True)
    print("=" * 60, flush=True)
    print("[sft] TRAINING SUMMARY", flush=True)
    print("=" * 60, flush=True)
    print(f"  Total time:       {wall:.0f}s ({wall/60:.1f} min)", flush=True)
    print(f"  Peak VRAM:        {peak_vram:.2f} GB", flush=True)
    print(f"  Final train loss: {final_train_loss}", flush=True)
    print(f"  Final val loss:   {final_val_loss}", flush=True)
    print(f"  Checkpoints:      {output_dir}", flush=True)
    print(f"  Stats:            {stats_path}", flush=True)
    print("=" * 60, flush=True)

    del model, trainer
    torch.cuda.empty_cache()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Constitutional SFT training (Rocinante RTX 4080)")
    ap.add_argument("--config", default=None, help="YAML config file (optional, overrides defaults)")
    ap.add_argument("--model-name", default=None, help="Model name or path")
    ap.add_argument("--data-path", default=None, help="Path to corpus JSONL")
    ap.add_argument("--output-dir", default=None, help="Output directory for checkpoints")
    ap.add_argument("--epochs", type=float, default=None)
    ap.add_argument("--lr", type=float, default=None)
    ap.add_argument("--batch-size", type=int, default=None)
    ap.add_argument("--grad-accum", type=int, default=None)
    ap.add_argument("--max-seq-length", type=int, default=None)
    ap.add_argument("--no-wandb", action="store_true", help="Disable WandB logging")
    args = ap.parse_args()

    # Build config: defaults -> YAML file -> CLI overrides
    cfg = dict(DEFAULTS)
    if args.config:
        yaml_cfg = load_config(args.config)
        cfg = deep_merge(cfg, yaml_cfg)
    cfg = apply_cli_overrides(cfg, args)

    train(cfg)


if __name__ == "__main__":
    main()
