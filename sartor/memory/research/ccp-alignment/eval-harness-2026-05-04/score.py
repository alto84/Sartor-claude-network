#!/usr/bin/env python3
"""score.py — Sartor loyalty eval, Claude-as-judge.

Two phases:
  1. Generation: load probes.jsonl, run each through a subject model, save
     per-probe responses.
  2. Scoring: invoke `claude -p` per probe with the appropriate rubric, get
     {"score", "reasoning", "tags"} JSON, aggregate per-axis.

Subject model loaders supported:
  - hf:<repo_id>          — load via transformers, run inference locally
  - claude:<short>        — run probe through `claude -p` (smoke test only)
  - file:<path>           — read pre-generated responses from a JSONL

Usage:
  python eval/score.py --subject hf:Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16 \
    --probes eval/probes.jsonl --out eval/results/baseline-qwen35b.json

  # System-prompt comparison:
  python eval/score.py --subject hf:Youssofal/... \
    --system-prompt-file corpus/constitution-as-preamble.txt \
    --out eval/results/qwen35b-with-constitution-preamble.json

  # Score-only against a previously-generated response file:
  python eval/score.py --subject file:eval/responses-saved.jsonl \
    --out eval/results/scored.json --score-only
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from collections import defaultdict
from pathlib import Path

ROOT = Path("/home/alton/experiments/2026-05-04-finetune-loyalty")
sys.path.insert(0, str(ROOT))
from eval.rubrics import RUBRICS  # type: ignore  # noqa: E402


# ---------- subject-model loaders ----------

def gen_via_hf(model_id: str, prompts: list[str], system_prompt: str | None,
               max_new_tokens: int = 512, log=lambda s: None,
               adapter_path: str | None = None) -> list[str]:
    """Load model via transformers and generate responses for each prompt.
    If adapter_path is given, layer a PEFT LoRA adapter on top of the base."""
    log(f"loading {model_id}...")
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    tok = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        trust_remote_code=True,
    )
    if adapter_path:
        from peft import PeftModel
        log(f"loading PEFT adapter from {adapter_path}")
        model = PeftModel.from_pretrained(model, adapter_path)
    model.eval()
    log(f"model loaded; device map: {getattr(model, 'hf_device_map', 'n/a')}")

    out: list[str] = []
    for i, p in enumerate(prompts):
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.append({"role": "user", "content": p})
        text = tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
        inputs = tok(text, return_tensors="pt").to(model.device)
        with torch.no_grad():
            ids = model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,
                temperature=1.0,
                pad_token_id=tok.eos_token_id,
            )
        gen = ids[0][inputs.input_ids.shape[1]:]
        resp = tok.decode(gen, skip_special_tokens=True).strip()
        out.append(resp)
        log(f"[{i+1}/{len(prompts)}] generated {len(resp)} chars")
    return out


def gen_via_claude(prompts: list[str], system_prompt: str | None,
                   log=lambda s: None) -> list[str]:
    """Smoke-test path: ask claude -p to produce responses (NOT what we want
    for the main eval — Qwen is the subject)."""
    out: list[str] = []
    for i, p in enumerate(prompts):
        sysp = system_prompt or ""
        composed = f"{sysp}\n\nUser: {p}".strip() if sysp else p
        try:
            res = subprocess.run(
                ["claude", "-p"],
                input=composed,
                capture_output=True,
                text=True,
                timeout=120,
            )
            out.append(res.stdout.strip())
        except subprocess.TimeoutExpired:
            out.append("[TIMEOUT]")
        log(f"[{i+1}/{len(prompts)}] claude-as-subject")
    return out


def gen_via_file(path: str, prompts: list[str]) -> list[str]:
    by_prompt = {}
    for line in open(path):
        o = json.loads(line)
        by_prompt[o["prompt"]] = o["response"]
    return [by_prompt.get(p, "[MISSING]") for p in prompts]


# ---------- judge ----------

def judge_one(probe: dict, response: str, log=lambda s: None,
              dry_run: bool = False) -> dict:
    rubric_template = RUBRICS[probe["axis"]]
    judge_prompt = (
        rubric_template
        .replace("{prompt}", probe["prompt"])
        .replace("{response}", response)
        .replace("{topic}", probe.get("topic", ""))
    )
    if dry_run:
        return {"score": 0.5, "reasoning": "dry-run", "tags": ["dry-run"]}
    try:
        res = subprocess.run(
            ["claude", "-p"],
            input=judge_prompt,
            capture_output=True,
            text=True,
            timeout=180,
        )
        raw = res.stdout.strip()
        # extract first JSON object
        start = raw.find("{")
        end = raw.rfind("}")
        if start == -1 or end == -1:
            return {"score": 0.0, "reasoning": f"judge returned no JSON: {raw[:200]}", "tags": ["parse-error"]}
        try:
            parsed = json.loads(raw[start:end+1])
        except json.JSONDecodeError as e:
            return {"score": 0.0, "reasoning": f"json error: {e}; raw: {raw[:200]}", "tags": ["parse-error"]}
        return {
            "score": float(parsed.get("score", 0.0)),
            "reasoning": parsed.get("reasoning", "")[:500],
            "tags": parsed.get("tags", []),
        }
    except subprocess.TimeoutExpired:
        return {"score": 0.0, "reasoning": "judge timeout", "tags": ["timeout"]}


# ---------- main ----------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--subject", required=True,
                    help="hf:<repo_id> | claude:smoke | file:<path>")
    ap.add_argument("--adapter-path", default=None,
                    help="optional PEFT LoRA adapter to layer on the base model")
    ap.add_argument("--probes", default=str(ROOT / "eval/probes.jsonl"))
    ap.add_argument("--out", required=True, help="output JSON path")
    ap.add_argument("--system-prompt-file", default=None,
                    help="optional file with a system prompt to prepend")
    ap.add_argument("--max-new-tokens", type=int, default=512)
    ap.add_argument("--score-only", action="store_true",
                    help="skip generation; subject must be file:<path>")
    ap.add_argument("--limit", type=int, default=0,
                    help="for debugging: cap number of probes to run")
    ap.add_argument("--dry-run-judge", action="store_true",
                    help="skip the judge call; emit fixed 0.5 scores")
    ap.add_argument("--save-responses",
                    help="if set, dump raw {prompt, response} jsonl here")
    args = ap.parse_args()

    probes = [json.loads(line) for line in open(args.probes)]
    if args.limit:
        probes = probes[:args.limit]

    system_prompt = None
    if args.system_prompt_file:
        system_prompt = Path(args.system_prompt_file).read_text()

    prompts = [p["prompt"] for p in probes]
    log = lambda s: print(f"[{time.strftime('%H:%M:%S')}] {s}", flush=True)

    log(f"loaded {len(probes)} probes")
    log(f"subject: {args.subject}")
    if system_prompt:
        log(f"system prompt: {len(system_prompt)} chars")

    kind, _, target = args.subject.partition(":")
    if kind == "hf":
        responses = gen_via_hf(target, prompts, system_prompt,
                               max_new_tokens=args.max_new_tokens, log=log,
                               adapter_path=args.adapter_path)
    elif kind == "claude":
        responses = gen_via_claude(prompts, system_prompt, log=log)
    elif kind == "file":
        responses = gen_via_file(target, prompts)
    else:
        log(f"unknown subject kind: {kind}")
        return 2

    if args.save_responses:
        with open(args.save_responses, "w") as f:
            for p, r in zip(probes, responses):
                f.write(json.dumps({"id": p["id"], "prompt": p["prompt"], "response": r}, ensure_ascii=False) + "\n")
        log(f"saved raw responses → {args.save_responses}")

    # Score
    scored: list[dict] = []
    per_axis: dict[str, list[float]] = defaultdict(list)
    for i, (probe, resp) in enumerate(zip(probes, responses)):
        log(f"judging {i+1}/{len(probes)} ({probe['axis']}/{probe['id']})")
        verdict = judge_one(probe, resp, log=log, dry_run=args.dry_run_judge)
        scored.append({
            "id": probe["id"],
            "axis": probe["axis"],
            "topic": probe.get("topic", ""),
            "prompt": probe["prompt"],
            "response": resp,
            **verdict,
        })
        per_axis[probe["axis"]].append(verdict["score"])

    aggregate = {
        axis: {
            "n": len(scores),
            "mean": sum(scores) / len(scores) if scores else 0.0,
            "n_perfect": sum(1 for s in scores if s >= 0.95),
            "n_zero": sum(1 for s in scores if s <= 0.05),
        }
        for axis, scores in per_axis.items()
    }
    overall_mean = (
        sum(s for axis_scores in per_axis.values() for s in axis_scores)
        / sum(len(s) for s in per_axis.values())
    )

    out = {
        "subject": args.subject,
        "system_prompt": bool(system_prompt),
        "n_probes": len(probes),
        "overall_mean": overall_mean,
        "per_axis": aggregate,
        "scored": scored,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    log(f"=== AGGREGATE ===")
    log(f"overall: {overall_mean:.3f}")
    for axis, agg in aggregate.items():
        log(f"  {axis:25s} n={agg['n']:3d} mean={agg['mean']:.3f} (perfect={agg['n_perfect']}, zero={agg['n_zero']})")
    log(f"wrote → {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
