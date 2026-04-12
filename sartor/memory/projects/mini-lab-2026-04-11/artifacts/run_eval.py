"""Run the eval battery against a loaded model. Writes incremental JSONL + final JSON.

Usage:
    python run_eval.py --model nvidia/NVIDIA-Nemotron-3-Nano-4B-BF16 --adapter /path/to/adapter --out mini-lab/outputs/eval-base.json

The eval battery is expected at mini-lab/outputs/eval-battery.json (written by
eval-methodologist in Task #2). This script stays schema-tolerant: if the battery
schema changes, only the PROMPT_KEY / ID_KEY constants below need updating.
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

import torch  # noqa: E402
from transformers import AutoModelForCausalLM, AutoTokenizer  # noqa: E402


PROMPT_KEY_CANDIDATES = ("prompt", "input", "text", "question")
ID_KEY_CANDIDATES = ("id", "probe_id", "uid", "name")
DEFAULT_BATTERY = "C:/Users/alto8/abliteration-exp/mini-lab/outputs/eval-battery.json"


def load_battery(path: str):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict):
        for k in ("prompts", "probes", "items", "battery", "eval"):
            if k in data and isinstance(data[k], list):
                return data[k], data
    if isinstance(data, list):
        return data, {"probes": data}
    raise ValueError(f"unexpected battery schema in {path}")


def first_present(d: dict, keys):
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return None


def load_model(model_id: str, adapter: str | None):
    tok = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        dtype=torch.bfloat16,
        device_map="cuda",
        trust_remote_code=True,
    )
    if adapter:
        from peft import PeftModel
        model = PeftModel.from_pretrained(model, adapter)
    model.eval()
    return model, tok


def generate(model, tok, prompt: str, max_new_tokens: int = 384) -> str:
    messages = [{"role": "user", "content": prompt}]
    try:
        input_ids = tok.apply_chat_template(
            messages, add_generation_prompt=True, return_tensors="pt"
        ).to(model.device)
    except Exception:
        input_ids = tok(prompt, return_tensors="pt").input_ids.to(model.device)
    with torch.inference_mode():
        out = model.generate(
            input_ids,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            temperature=1.0,
            pad_token_id=tok.pad_token_id,
        )
    gen = out[0, input_ids.shape[-1]:]
    return tok.decode(gen, skip_special_tokens=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--adapter", default=None)
    ap.add_argument("--battery", default=DEFAULT_BATTERY)
    ap.add_argument("--out", required=True)
    ap.add_argument("--label", default="")
    ap.add_argument("--max-new-tokens", type=int, default=384)
    ap.add_argument("--resume", action="store_true",
                    help="skip probe_ids already present in the output jsonl")
    args = ap.parse_args()

    probes, raw = load_battery(args.battery)
    out_path = pathlib.Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    jsonl_path = out_path.with_suffix(".jsonl")

    existing = {}
    if args.resume and jsonl_path.exists():
        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                    existing[row["probe_id"]] = row
                except Exception:
                    continue
        print(f"[run_eval] resume: {len(existing)} existing records found", flush=True)
    print(f"[run_eval] {len(probes)} probes -> {out_path}", flush=True)

    results = list(existing.values())
    with wake_lock.keep_awake(f"eval-{args.label or out_path.stem}"):
        mode = "a" if (args.resume and existing) else "w"
        # We always load the model only if there's work to do.
        todo_probes = []
        for i, probe in enumerate(probes):
            pid = first_present(probe, ID_KEY_CANDIDATES) or f"probe_{i}"
            if pid in existing:
                continue
            todo_probes.append((i, probe, pid))
        print(f"[run_eval] work: {len(todo_probes)} probes remaining", flush=True)

        if not todo_probes:
            model = None
            tok = None
            peak = 0
        else:
            model, tok = load_model(args.model, args.adapter)
            peak = 0

        with open(jsonl_path, mode, encoding="utf-8") as jf:
            for i, probe, pid in todo_probes:
                prompt = first_present(probe, PROMPT_KEY_CANDIDATES)
                if prompt is None:
                    print(f"[run_eval] probe {i} has no prompt, skipping", flush=True)
                    continue
                t0 = time.time()
                try:
                    response = generate(model, tok, prompt, args.max_new_tokens)
                    err = None
                except Exception as e:  # noqa: BLE001
                    response = ""
                    err = f"{type(e).__name__}: {e}"
                    traceback.print_exc()
                dt = time.time() - t0
                row = {
                    "probe_id": pid,
                    "prompt": prompt,
                    "response": response,
                    "error": err,
                    "wall_s": round(dt, 3),
                    "probe": probe,
                }
                jf.write(json.dumps(row, ensure_ascii=False) + "\n")
                jf.flush()
                os.fsync(jf.fileno())
                results.append(row)
                if torch.cuda.is_available():
                    peak = max(peak, torch.cuda.max_memory_allocated() / 1e9)
                if (i + 1) % 5 == 0 or i == len(probes) - 1:
                    print(f"[run_eval] {i+1}/{len(probes)} peak_vram={peak:.1f}GB", flush=True)

        final = {
            "model": args.model,
            "adapter": args.adapter,
            "label": args.label,
            "battery_path": args.battery,
            "n_probes": len(probes),
            "peak_vram_gb": round(peak, 2),
            "results": results,
        }
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(final, f, ensure_ascii=False, indent=2)
        print(f"[run_eval] wrote {out_path} ({len(results)} results, peak {peak:.1f}GB)", flush=True)

        if model is not None:
            del model, tok
            torch.cuda.empty_cache()


if __name__ == "__main__":
    main()
