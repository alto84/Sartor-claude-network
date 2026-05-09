"""Orchestrate the 4-point sft-v1 absorption curve sequentially.

Runs the combined eval+interview battery against 4 sft-v1 checkpoints
in one long-lived process so we don't lose checkpoints to turn boundaries.
Each condition loads + unloads its own model; wake lock held for the whole
orchestration.

Conditions (in order, cheapest-to-rerun first since ep10 and ep6 are already
partially populated via resume):
  1. sft-v1-e10  (final adapter, step 170, epoch 10.0)  -- resume
  2. sft-v1-e6   (checkpoint-100, step 100, epoch 5.9)  -- resume
  3. sft-v1-e9   (checkpoint-150, step 150, epoch 8.8)  -- fresh
  4. sft-v1-e1   (epoch-1 checkpoint, step 17, epoch 1.0) -- fresh

Each condition writes:
  outputs/eval-{label}.jsonl  (+ rolled-up eval-{label}.json)
  outputs/interview-{label}-raw.jsonl

Usage:
    python run_sft_four_point.py [--skip e9]
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
import run_all_for_checkpoint as rac  # noqa: E402

import torch  # noqa: E402

MODEL = "nvidia/Nemotron-Mini-4B-Instruct"
CKPT_ROOT = pathlib.Path("C:/Users/alto8/abliteration-exp/mini-lab/checkpoints/sft-v1")

CONDITIONS = [
    {"label": "sft-v1-e10", "adapter": str(CKPT_ROOT), "resume": True,
     "desc": "step 170 (epoch 10.0), final adapter"},
    {"label": "sft-v1-e6",  "adapter": str(CKPT_ROOT / "checkpoint-100"), "resume": True,
     "desc": "step 100 (~epoch 5.9)"},
    {"label": "sft-v1-e9",  "adapter": str(CKPT_ROOT / "checkpoint-150"), "resume": True,
     "desc": "step 150 (~epoch 8.8)"},
    {"label": "sft-v1-e1",  "adapter": str(CKPT_ROOT / "epoch-1"), "resume": True,
     "desc": "step 17 (epoch 1.0)"},
]


def run_one(cond, max_new_tokens):
    label = cond["label"]
    print(f"\n============ {label}: {cond['desc']} ============", flush=True)
    print(f"adapter: {cond['adapter']}", flush=True)
    model, tok = run_eval.load_model(MODEL, cond["adapter"])

    eval_jsonl = rac.OUT / f"eval-{label}.jsonl"
    eval_json = rac.OUT / f"eval-{label}.json"
    interview_jsonl = rac.OUT / f"interview-{label}-raw.jsonl"

    t0 = time.time()
    peak_eval = rac.run_eval_battery(
        model, tok, eval_jsonl, cond["resume"], max_new_tokens
    )
    # roll up to json
    results = []
    with open(eval_jsonl, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            results.append(json.loads(line))
    final = {
        "model": MODEL,
        "adapter": cond["adapter"],
        "label": label,
        "n_probes": len(results),
        "peak_vram_gb": round(peak_eval, 2),
        "results": results,
    }
    with open(eval_json, "w", encoding="utf-8") as f:
        json.dump(final, f, ensure_ascii=False, indent=2)
    print(f"[eval] wrote {eval_json} ({len(results)} results)", flush=True)

    peak_int = rac.run_interview_battery(
        model, tok, interview_jsonl, cond["resume"], max_new_tokens
    )
    print(f"[interview] wrote {interview_jsonl}", flush=True)

    wall = time.time() - t0
    print(f"[{label}] done wall={wall:.0f}s peak_vram={max(peak_eval, peak_int):.1f}GB",
          flush=True)

    del model, tok
    torch.cuda.empty_cache()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip", nargs="*", default=[], help="labels to skip")
    ap.add_argument("--max-new-tokens", type=int, default=384)
    args = ap.parse_args()

    with wake_lock.keep_awake("sft-four-point"):
        for cond in CONDITIONS:
            if cond["label"] in args.skip:
                print(f"skipping {cond['label']}", flush=True)
                continue
            try:
                run_one(cond, args.max_new_tokens)
            except Exception as e:  # noqa: BLE001
                print(f"[{cond['label']}] FAILED: {e}", flush=True)
                traceback.print_exc()
                # Continue to next condition rather than abort whole run
                continue
    print("\n[four-point] orchestrator done", flush=True)


if __name__ == "__main__":
    main()
