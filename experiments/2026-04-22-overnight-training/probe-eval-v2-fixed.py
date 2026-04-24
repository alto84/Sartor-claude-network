#!/usr/bin/env python
"""
Re-run probe eval v2 with the thinking-tag fix.

Initial probe-eval-v2.py used add_generation_prompt=True with default
thinking mode, so the 500-token generation budget was burned entirely
inside the <think> block and the actual answer was truncated. The LLM
judge then saw raw thinking content and couldn't score it.

Fix: enable_thinking=False on the chat template, so the template emits
<think></think> pre-closed and the model generates the answer directly.
Also bumps max_new_tokens to 800.
"""

import os
import sys
import json
import argparse

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel


BASE = "/home/alton/models/heretic-3.6-35b"
ADAPTER = "/home/alton/models/lora-sartor-v0.3"
ROOT = "/home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training"
PROBES_PATH = f"{ROOT}/probes/probes-v2.jsonl"


def load_probes():
    probes = []
    with open(PROBES_PATH) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            probes.append(json.loads(line))
    return probes


def strip_thinking(text):
    """If response contains </think>, keep only the content after it."""
    end = "</think>"
    idx = text.rfind(end)
    if idx >= 0:
        return text[idx + len(end):].strip()
    return text.strip()


def run_variant(name, model, tok, probes, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    results = []
    for p in probes:
        msg = [{"role": "user", "content": p["prompt"]}]
        prompt_text = tok.apply_chat_template(
            msg, tokenize=False, add_generation_prompt=True, enable_thinking=False
        )
        inputs = tok(prompt_text, return_tensors="pt").to(model.device)
        with torch.no_grad():
            out = model.generate(
                **inputs,
                max_new_tokens=800,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tok.eos_token_id,
            )
        raw = tok.decode(
            out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True
        )
        clean = strip_thinking(raw)
        print(f"[{name}] cat {p['cat']} #{p['num']} len={len(clean)}", flush=True)
        results.append({
            **p,
            "response": clean,
            "response_raw": raw,
            "variant": name,
        })
    out_path = os.path.join(output_dir, "results.jsonl")
    with open(out_path, "w") as f:
        for r in results:
            f.write(json.dumps(r) + "\n")
    print(f"[{name}] wrote {out_path}", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--variants", nargs="+", default=["base-heretic", "lora-v0.3"])
    args = parser.parse_args()

    probes = load_probes()
    print(f"Loaded {len(probes)} probes")

    tok = AutoTokenizer.from_pretrained(BASE, trust_remote_code=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token

    print("loading base Heretic...")
    model = AutoModelForCausalLM.from_pretrained(
        BASE,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        trust_remote_code=True,
    )
    model.eval()

    out_dir = f"{ROOT}/track-D-probe-eval-v2-fixed"

    if "base-heretic" in args.variants:
        run_variant("base-heretic", model, tok, probes, f"{out_dir}/outputs-base-heretic")

    if "lora-v0.3" in args.variants:
        if os.path.exists(ADAPTER):
            print("attaching LoRA v0.3 adapter...")
            tuned = PeftModel.from_pretrained(model, ADAPTER)
            tuned.eval()
            run_variant("lora-v0.3", tuned, tok, probes, f"{out_dir}/outputs-lora-v0.3")
        else:
            print(f"SKIP lora-v0.3: adapter not at {ADAPTER}")

    print("done")


if __name__ == "__main__":
    main()
