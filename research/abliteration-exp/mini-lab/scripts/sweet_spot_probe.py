"""Smoke-test multiple SFT checkpoints against a small probe set to identify
the training sweet spot (high enough to pick up constitution, low enough to
avoid template-token burn-in and training-data echo).

Loads base once, swaps LoRA adapters, runs a fixed 6-probe set, prints
response preview + template-leak flag per checkpoint.

Usage:
    python sweet_spot_probe.py
"""
from __future__ import annotations

import json
import pathlib
import re
import sys
import time

SCRIPTS = pathlib.Path(__file__).parent
sys.path.insert(0, str(SCRIPTS))
import wake_lock  # noqa: E402

import torch  # noqa: E402
from transformers import AutoModelForCausalLM, AutoTokenizer  # noqa: E402
from peft import PeftModel  # noqa: E402

MODEL_ID = "nvidia/Nemotron-Mini-4B-Instruct"
CKPT_ROOT = pathlib.Path("C:/Users/alto8/abliteration-exp/mini-lab/checkpoints/sft-v1")
OUT_PATH = pathlib.Path("C:/Users/alto8/abliteration-exp/mini-lab/outputs/sweet-spot-probe.json")

# Selected probes touching the key categories we care about:
# - safety-refusal/1 (did SFT install principled refusal?)
# - constitutional-adherence/1 (did the constitution absorb?)
# - sycophancy-resistance/1 (did the Certainly! opener get flattened?)
# - character-stability/1 (did SFT damage identity stability?)
# - refusal-calibration-over/1 (did SFT over-refuse benign?)
# - ccp-baseline/1 (any regression?)
PROBE_IDS = [
    "safety-refusal/1",
    "constitutional-adherence/1",
    "sycophancy-resistance/1",
    "character-stability/1",
    "refusal-calibration-over/1",
    "ccp-baseline/1",
]

CHECKPOINTS = [
    ("epoch-1", CKPT_ROOT / "epoch-1"),
    ("checkpoint-100", CKPT_ROOT / "checkpoint-100"),
    ("checkpoint-150", CKPT_ROOT / "checkpoint-150"),
    ("final", CKPT_ROOT),  # root contains adapter_model.safetensors for final
]

LEAK_PATTERNS = [
    re.compile(r"<extra_id_\d+>"),
    re.compile(r"<\|"),
    re.compile(r"From Anthropic Agent", re.IGNORECASE),
]


def load_probes():
    with open(r"C:/Users/alto8/abliteration-exp/mini-lab/outputs/eval-battery.json", "r", encoding="utf-8") as f:
        battery = json.load(f)
    by_id = {p["id"]: p for p in battery["prompts"]}
    return [by_id[pid] for pid in PROBE_IDS if pid in by_id]


def has_leak(text: str) -> bool:
    return any(p.search(text) for p in LEAK_PATTERNS)


def generate(model, tok, prompt: str, max_new_tokens: int = 384) -> str:
    messages = [{"role": "user", "content": prompt}]
    input_ids = tok.apply_chat_template(
        messages, add_generation_prompt=True, return_tensors="pt"
    ).to(model.device)
    with torch.inference_mode():
        out = model.generate(
            input_ids,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            pad_token_id=tok.pad_token_id or tok.eos_token_id,
        )
    gen = out[0, input_ids.shape[-1]:]
    return tok.decode(gen, skip_special_tokens=True)


def main():
    probes = load_probes()
    results = {"probes": [p["id"] for p in probes], "checkpoints": {}}

    with wake_lock.keep_awake("sweet-spot-probe"):
        print(f"[sweet_spot] loading base {MODEL_ID}", flush=True)
        tok = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
        if tok.pad_token is None:
            tok.pad_token = tok.eos_token
        base = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            dtype=torch.bfloat16,
            device_map="cuda",
            trust_remote_code=True,
        )
        base.eval()

        for label, path in CHECKPOINTS:
            print(f"\n[sweet_spot] ---- {label} ({path.name}) ----", flush=True)
            try:
                model = PeftModel.from_pretrained(base, str(path))
                model.eval()
            except Exception as e:  # noqa: BLE001
                print(f"  load failed: {e}", flush=True)
                results["checkpoints"][label] = {"error": str(e)}
                continue

            rows = []
            leak_count = 0
            t0 = time.time()
            for probe in probes:
                try:
                    resp = generate(model, tok, probe["prompt"])
                except Exception as e:  # noqa: BLE001
                    resp = f"__ERROR__ {e}"
                leaked = has_leak(resp)
                if leaked:
                    leak_count += 1
                preview = resp[:220].replace("\n", " ")
                print(f"  {probe['id']}: leak={leaked}")
                print(f"    {preview}")
                rows.append({"probe_id": probe["id"], "response": resp, "leak": leaked})
            wall = time.time() - t0
            print(f"  summary: {leak_count}/{len(probes)} leaked, wall={wall:.0f}s", flush=True)
            results["checkpoints"][label] = {
                "leak_count": leak_count,
                "n": len(probes),
                "wall_s": round(wall, 2),
                "rows": rows,
            }
            model = model.unload()  # unload adapter but keep base resident
            del model
            torch.cuda.empty_cache()

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n[sweet_spot] wrote {OUT_PATH}", flush=True)


if __name__ == "__main__":
    main()
