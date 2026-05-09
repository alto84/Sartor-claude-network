"""Run the probe battery against a model. Supports 4-bit quantization for VRAM efficiency.

Usage:
    python eval_probes.py --model huihui-ai/Qwen3-4B-abliterated --label abliterated-baseline --out eval-abliterated-baseline.jsonl
    python eval_probes.py --model huihui-ai/Qwen3-4B-abliterated --adapter checkpoints/ --label sft-finetuned --out eval-sft.jsonl
    python eval_probes.py --compare eval-abliterated-baseline.jsonl eval-sft.jsonl  # print delta report
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import sys
import time

os.environ["HF_HOME"] = "D:/hf-cache"
os.environ["PYTHONUTF8"] = "1"

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

PROBES_PATH = "C:/Users/alto8/abliteration-exp/mini-lab/evals/probes.jsonl"
OUTPUT_DIR = "C:/Users/alto8/constitutional-sft/eval-results"


def load_probes(path: str) -> list[dict]:
    probes = []
    with open(path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            line = line.strip()
            if not line:
                continue
            try:
                probes.append(json.loads(line))
            except json.JSONDecodeError:
                print(f"[eval] WARNING: skipping malformed JSON at line {i+1}", flush=True)
    return probes


def load_model(model_id: str, adapter: str | None, use_4bit: bool = True):
    print(f"[eval] loading tokenizer: {model_id}", flush=True)
    tok = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True, cache_dir="D:/hf-cache")
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token

    if use_4bit:
        bnb = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )
        print(f"[eval] loading model in 4-bit NF4: {model_id}", flush=True)
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            quantization_config=bnb,
            device_map="auto",
            trust_remote_code=True,
            torch_dtype=torch.float16,
            cache_dir="D:/hf-cache",
        )
    else:
        print(f"[eval] loading model in fp16: {model_id}", flush=True)
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            device_map="auto",
            trust_remote_code=True,
            torch_dtype=torch.float16,
            cache_dir="D:/hf-cache",
        )

    if adapter:
        from peft import PeftModel
        print(f"[eval] loading LoRA adapter: {adapter}", flush=True)
        model = PeftModel.from_pretrained(model, adapter)

    model.eval()
    vram = torch.cuda.memory_allocated() / 1e9 if torch.cuda.is_available() else 0
    print(f"[eval] model loaded, VRAM={vram:.2f}GB", flush=True)
    return model, tok


def generate(model, tok, prompt: str, max_new_tokens: int = 512) -> str:
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


def run_eval(model_id: str, adapter: str | None, label: str, out_path: str,
             probes_path: str, subset_filter: str | None = None,
             max_new_tokens: int = 512, resume: bool = False):
    probes = load_probes(probes_path)
    if subset_filter:
        probes = [p for p in probes if p.get("subset") == subset_filter]
    print(f"[eval] {len(probes)} probes to run (filter={subset_filter})", flush=True)

    out_path = pathlib.Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Resume: load already-done probe IDs
    done_ids = set()
    if resume and out_path.exists():
        with open(out_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                    done_ids.add(row["probe_id"])
                except Exception:
                    continue
        print(f"[eval] resume: {len(done_ids)} already done", flush=True)

    todo = [p for p in probes if p["id"] not in done_ids]
    print(f"[eval] {len(todo)} remaining", flush=True)

    if not todo:
        print("[eval] nothing to do, all probes already run", flush=True)
        return

    model, tok = load_model(model_id, adapter)
    peak_vram = 0.0

    write_mode = "a" if (resume and done_ids) else "w"
    t_start = time.time()
    with open(out_path, write_mode, encoding="utf-8") as f:
        for i, probe in enumerate(todo):
            pid = probe["id"]
            prompt = probe["prompt"]
            t0 = time.time()
            try:
                response = generate(model, tok, prompt, max_new_tokens)
                error = None
            except Exception as e:
                response = ""
                error = f"{type(e).__name__}: {e}"
                print(f"[eval] ERROR on {pid}: {error}", flush=True)
            dt = time.time() - t0

            row = {
                "probe_id": pid,
                "subset": probe.get("subset", ""),
                "prompt": prompt,
                "response": response,
                "error": error,
                "wall_s": round(dt, 2),
                "label": label,
                "scoring": probe.get("scoring", {}),
            }
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            f.flush()
            os.fsync(f.fileno())

            if torch.cuda.is_available():
                peak_vram = max(peak_vram, torch.cuda.max_memory_allocated() / 1e9)

            if (i + 1) % 5 == 0 or i == len(todo) - 1:
                elapsed = time.time() - t_start
                print(f"[eval] {i+1}/{len(todo)} done | peak_vram={peak_vram:.2f}GB | elapsed={elapsed:.0f}s", flush=True)

    total = time.time() - t_start
    print(f"[eval] complete: {len(todo)} probes in {total:.0f}s ({total/60:.1f}m) | peak_vram={peak_vram:.2f}GB", flush=True)
    print(f"[eval] results: {out_path}", flush=True)

    del model, tok
    torch.cuda.empty_cache()


def print_responses(results_path: str, subset: str | None = None):
    """Print probe responses for manual inspection."""
    with open(results_path, "r", encoding="utf-8") as f:
        rows = [json.loads(l) for l in f if l.strip()]
    if subset:
        rows = [r for r in rows if r.get("subset") == subset]
    for row in rows:
        print(f"\n--- {row['probe_id']} [{row.get('subset','')}] ---")
        print(f"PROMPT: {row['prompt'][:200]}")
        resp = row.get("response", "")
        print(f"RESPONSE: {resp[:600]}")
        expected = row.get("scoring", {}).get("correct_label", "")
        if expected:
            print(f"EXPECTED: {expected}")


def compare_runs(path_a: str, path_b: str, label_a: str = "A", label_b: str = "B"):
    """Print a delta report between two eval runs (same probe IDs)."""
    def load(p):
        with open(p, "r", encoding="utf-8") as f:
            return {json.loads(l)["probe_id"]: json.loads(l) for l in f if l.strip()}

    a = load(path_a)
    b = load(path_b)
    common = sorted(set(a) & set(b))
    print(f"\nDelta report: {label_a} vs {label_b} ({len(common)} common probes)")
    print("=" * 70)
    for pid in common:
        ra = a[pid].get("response", "")
        rb = b[pid].get("response", "")
        subset = a[pid].get("subset", "")
        expected = a[pid].get("scoring", {}).get("correct_label", "")
        if ra[:100] != rb[:100]:
            print(f"\n[{pid}] [{subset}] expected={expected}")
            print(f"  {label_a}: {ra[:200]}")
            print(f"  {label_b}: {rb[:200]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=None)
    ap.add_argument("--adapter", default=None)
    ap.add_argument("--label", default="eval")
    ap.add_argument("--out", default=None)
    ap.add_argument("--probes", default=PROBES_PATH)
    ap.add_argument("--subset", default=None, help="Filter to one subset (e.g. ccp-framing)")
    ap.add_argument("--max-new-tokens", type=int, default=512)
    ap.add_argument("--resume", action="store_true")
    ap.add_argument("--show", default=None, help="Print responses from a results file")
    ap.add_argument("--compare", nargs=2, metavar=("A", "B"), help="Compare two result files")
    args = ap.parse_args()

    if args.show:
        print_responses(args.show, args.subset)
        return

    if args.compare:
        compare_runs(args.compare[0], args.compare[1])
        return

    if not args.model:
        ap.error("--model is required for eval runs")

    out = args.out or os.path.join(OUTPUT_DIR, f"{args.label}.jsonl")
    run_eval(
        model_id=args.model,
        adapter=args.adapter,
        label=args.label,
        out_path=out,
        probes_path=args.probes,
        subset_filter=args.subset,
        max_new_tokens=args.max_new_tokens,
        resume=args.resume,
    )


if __name__ == "__main__":
    main()
