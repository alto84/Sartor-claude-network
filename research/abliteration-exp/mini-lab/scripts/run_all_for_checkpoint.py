"""One model load, two batteries (eval + interview) in sequence.

This cuts total wall-clock roughly in half vs running run_eval.py twice.
Both outputs are flushed per-row so crashes don't lose prior work.

Usage:
    python run_all_for_checkpoint.py \
        --model nvidia/Nemotron-Mini-4B-Instruct \
        --label base \
        [--adapter path/to/sft-v1] \
        [--resume]
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
import run_eval  # noqa: E402

import torch  # noqa: E402


OUT = pathlib.Path("C:/Users/alto8/abliteration-exp/mini-lab/outputs")
LOGS = pathlib.Path("C:/Users/alto8/abliteration-exp/mini-lab/logs")
BATTERY = OUT / "eval-battery.json"
INTERVIEW = SCRIPTS / "interview_prompts.json"


def load_jsonl_existing(path: pathlib.Path, key: str):
    existing = {}
    if not path.exists():
        return existing
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
                existing[row[key]] = row
            except Exception:
                continue
    return existing


def run_eval_battery(model, tok, jsonl_path: pathlib.Path, resume: bool, max_new_tokens: int):
    with open(BATTERY, "r", encoding="utf-8") as f:
        battery = json.load(f)
    probes = battery["prompts"]

    existing = load_jsonl_existing(jsonl_path, "probe_id") if resume else {}
    mode = "a" if existing else "w"
    print(f"[eval] {len(probes)} probes, {len(existing)} already done", flush=True)
    peak = 0
    with open(jsonl_path, mode, encoding="utf-8") as jf:
        for i, probe in enumerate(probes):
            pid = probe["id"]
            if pid in existing:
                continue
            prompt = probe["prompt"]
            t0 = time.time()
            try:
                response = run_eval.generate(model, tok, prompt, max_new_tokens)
                err = None
            except Exception as e:  # noqa: BLE001
                response = ""
                err = f"{type(e).__name__}: {e}"
                traceback.print_exc()
            dt = time.time() - t0
            row = {
                "probe_id": pid,
                "category": probe.get("category"),
                "prompt": prompt,
                "response": response,
                "error": err,
                "wall_s": round(dt, 3),
                "probe": probe,
            }
            jf.write(json.dumps(row, ensure_ascii=False) + "\n")
            jf.flush()
            os.fsync(jf.fileno())
            if torch.cuda.is_available():
                peak = max(peak, torch.cuda.max_memory_allocated() / 1e9)
            if (i + 1) % 5 == 0 or i == len(probes) - 1:
                print(f"[eval] {i+1}/{len(probes)} peak_vram={peak:.1f}GB", flush=True)
    return peak


def run_interview_battery(model, tok, jsonl_path: pathlib.Path, resume: bool, max_new_tokens: int):
    with open(INTERVIEW, "r", encoding="utf-8") as f:
        ib = json.load(f)
    prompts = ib["prompts"]

    existing = load_jsonl_existing(jsonl_path, "id") if resume else {}
    mode = "a" if existing else "w"
    print(f"[interview] {len(prompts)} prompts, {len(existing)} already done", flush=True)
    peak = 0
    with open(jsonl_path, mode, encoding="utf-8") as jf:
        for i, p in enumerate(prompts):
            pid = p["id"]
            if pid in existing:
                continue
            t0 = time.time()
            try:
                if "turns" in p and isinstance(p["turns"], list):
                    messages = []
                    responses = []
                    for turn in p["turns"]:
                        messages.append({"role": "user", "content": turn})
                        try:
                            input_ids = tok.apply_chat_template(
                                messages, add_generation_prompt=True, return_tensors="pt"
                            ).to(model.device)
                        except Exception:
                            input_ids = tok(turn, return_tensors="pt").input_ids.to(model.device)
                        with torch.inference_mode():
                            out = model.generate(
                                input_ids,
                                max_new_tokens=max_new_tokens,
                                do_sample=False,
                                pad_token_id=tok.pad_token_id or tok.eos_token_id,
                            )
                        gen = out[0, input_ids.shape[-1]:]
                        reply = tok.decode(gen, skip_special_tokens=True)
                        responses.append(reply)
                        messages.append({"role": "assistant", "content": reply})
                    row = {
                        "id": pid,
                        "category": p.get("category"),
                        "turns": p["turns"],
                        "responses": responses,
                        "error": None,
                        "latency_s": round(time.time() - t0, 3),
                    }
                else:
                    prompt_text = p.get("text") or p.get("prompt") or ""
                    response = run_eval.generate(model, tok, prompt_text, max_new_tokens)
                    row = {
                        "id": pid,
                        "category": p.get("category"),
                        "prompt": prompt_text,
                        "response": response,
                        "error": None,
                        "latency_s": round(time.time() - t0, 3),
                    }
            except Exception as e:  # noqa: BLE001
                traceback.print_exc()
                row = {
                    "id": pid,
                    "category": p.get("category"),
                    "error": f"{type(e).__name__}: {e}",
                    "latency_s": round(time.time() - t0, 3),
                }
            jf.write(json.dumps(row, ensure_ascii=False) + "\n")
            jf.flush()
            os.fsync(jf.fileno())
            if torch.cuda.is_available():
                peak = max(peak, torch.cuda.max_memory_allocated() / 1e9)
            if (i + 1) % 5 == 0 or i == len(prompts) - 1:
                print(f"[interview] {i+1}/{len(prompts)} peak_vram={peak:.1f}GB", flush=True)
    return peak


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--adapter", default=None)
    ap.add_argument("--label", required=True)
    ap.add_argument("--max-new-tokens", type=int, default=384)
    ap.add_argument("--resume", action="store_true")
    ap.add_argument("--skip-eval", action="store_true")
    ap.add_argument("--skip-interview", action="store_true")
    args = ap.parse_args()

    eval_jsonl = OUT / f"eval-{args.label}.jsonl"
    eval_json = OUT / f"eval-{args.label}.json"
    interview_jsonl = OUT / f"interview-{args.label}-raw.jsonl"
    LOGS.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    t_start = time.time()
    with wake_lock.keep_awake(f"run-all-{args.label}"):
        model, tok = run_eval.load_model(args.model, args.adapter)
        peak_all = 0

        if not args.skip_eval:
            p = run_eval_battery(model, tok, eval_jsonl, args.resume, args.max_new_tokens)
            peak_all = max(peak_all, p)
            # Write rolled-up JSON from the jsonl
            results = []
            with open(eval_jsonl, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    results.append(json.loads(line))
            final = {
                "model": args.model,
                "adapter": args.adapter,
                "label": args.label,
                "n_probes": len(results),
                "peak_vram_gb": round(peak_all, 2),
                "results": results,
            }
            with open(eval_json, "w", encoding="utf-8") as f:
                json.dump(final, f, ensure_ascii=False, indent=2)
            print(f"[eval] wrote {eval_json} ({len(results)} results)", flush=True)

        if not args.skip_interview:
            p = run_interview_battery(model, tok, interview_jsonl, args.resume, args.max_new_tokens)
            peak_all = max(peak_all, p)
            print(f"[interview] wrote {interview_jsonl}", flush=True)

        del model, tok
        torch.cuda.empty_cache()

    wall = time.time() - t_start
    print(f"[run_all] done label={args.label} wall={wall:.0f}s peak_vram={peak_all:.1f}GB", flush=True)


if __name__ == "__main__":
    main()
