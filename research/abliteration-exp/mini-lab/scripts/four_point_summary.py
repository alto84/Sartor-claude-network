"""Consolidated scorecard + leak-rate analysis for the 4-point sft-v1 curve.

Consumes:
  outputs/eval-base.jsonl, outputs/eval-sft-v1-e1.jsonl,
  outputs/eval-sft-v1-e6.jsonl, outputs/eval-sft-v1-e9.jsonl,
  outputs/eval-sft-v1-e10.jsonl

Writes:
  outputs/four-point-scorecard.json  -- per-condition per-category pass rates
  outputs/four-point-leak-rates.json -- per-condition template-leak rates
  prints a summary table

Uses scripts/score_eval.py in rules mode internally.
"""
from __future__ import annotations

import json
import pathlib
import re
import subprocess
import sys

OUT = pathlib.Path("C:/Users/alto8/abliteration-exp/mini-lab/outputs")
SCRIPTS = pathlib.Path("C:/Users/alto8/abliteration-exp/mini-lab/scripts")
PYTHON = r"C:/Users/alto8/abliteration-exp/venv/Scripts/python.exe"

CONDITIONS = [
    ("base",       OUT / "eval-base.jsonl"),
    ("sft-v1-e1",  OUT / "eval-sft-v1-e1.jsonl"),
    ("sft-v1-e6",  OUT / "eval-sft-v1-e6.jsonl"),
    ("sft-v1-e9",  OUT / "eval-sft-v1-e9.jsonl"),
    ("sft-v1-e10", OUT / "eval-sft-v1-e10.jsonl"),
]

LEAK_ANY = re.compile(r"<extra_id_\d+>|<\|[^|]{0,20}\||From Anthropic Agent")
LEAK_PREFIX = re.compile(r"^\s*<extra_id_\d+>")


def analyze_leaks(path: pathlib.Path):
    rows = []
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    n = len(rows)
    if n == 0:
        return None
    any_leak = 0
    prefix_leak = 0
    per_category = {}
    for r in rows:
        resp = r.get("response", "") or ""
        cat = (r.get("probe", {}) or {}).get("category") or r.get("category") or "unknown"
        is_any = bool(LEAK_ANY.search(resp))
        is_prefix = bool(LEAK_PREFIX.match(resp))
        if is_any:
            any_leak += 1
        if is_prefix:
            prefix_leak += 1
        c = per_category.setdefault(cat, {"n": 0, "any": 0, "prefix": 0})
        c["n"] += 1
        c["any"] += int(is_any)
        c["prefix"] += int(is_prefix)
    return {
        "n": n,
        "leak_any_rate": round(any_leak / n, 3),
        "leak_prefix_rate": round(prefix_leak / n, 3),
        "leak_any_count": any_leak,
        "leak_prefix_count": prefix_leak,
        "per_category": per_category,
    }


def score_condition(path: pathlib.Path, label: str):
    """Invoke score_eval.py via subprocess and parse its JSON output."""
    if not path.exists():
        return None
    out_path = OUT / f"scored-{label}.json"
    cmd = [
        PYTHON,
        str(SCRIPTS / "score_eval.py"),
        "--battery", str(OUT / "eval-battery.json"),
        "--responses", str(path),
        "--out", str(out_path),
        "--mode", "rules",
        "--name", label,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    except subprocess.TimeoutExpired:
        print(f"  [{label}] score_eval timed out", file=sys.stderr)
        return None
    if result.returncode != 0:
        print(f"  [{label}] score_eval returncode={result.returncode}", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
    if out_path.exists():
        with open(out_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def main():
    results = {}
    for label, path in CONDITIONS:
        print(f"\n=== {label} ({path.name}) ===")
        leaks = analyze_leaks(path)
        if leaks is None:
            print(f"  MISSING or empty")
            continue
        print(f"  n={leaks['n']}, leak_any={leaks['leak_any_rate']:.0%}, leak_prefix={leaks['leak_prefix_rate']:.0%}")
        scored = score_condition(path, label)
        if scored:
            total_n = scored.get("total", {}).get("n") or sum(c.get("n", 0) for c in scored.get("categories", {}).values())
            total_pass = scored.get("total", {}).get("pass") or 0
            print(f"  total pass: {total_pass:.3f}" if isinstance(total_pass, float) else f"  total pass: {total_pass}")
        results[label] = {"leaks": leaks, "scored": scored}

    out_path = OUT / "four-point-scorecard.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nwrote {out_path}")

    # Pretty table
    print("\n" + "=" * 100)
    print(f"{'condition':<14} {'n':>4} {'leak_any':>9} {'leak_pre':>9} {'pass':>6}")
    print("-" * 100)
    for label, r in results.items():
        lk = r["leaks"]
        sc = r["scored"]
        pass_rate = None
        if sc and "total" in sc:
            pass_rate = sc["total"].get("pass")
        elif sc and "categories" in sc:
            total_n = sum(c.get("n", 0) for c in sc["categories"].values())
            total_pass = sum(c.get("pass", 0) * c.get("n", 0) for c in sc["categories"].values())
            pass_rate = total_pass / total_n if total_n else None
        pr = f"{pass_rate:.3f}" if pass_rate is not None else "n/a"
        print(f"{label:<14} {lk['n']:>4} {lk['leak_any_rate']:>9.0%} {lk['leak_prefix_rate']:>9.0%} {pr:>6}")


if __name__ == "__main__":
    main()
