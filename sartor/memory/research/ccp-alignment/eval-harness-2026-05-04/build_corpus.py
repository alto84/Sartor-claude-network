#!/usr/bin/env python3
"""build_corpus.py — assemble the v0.3 Sartor fine-tuning corpus.

Sources (deterministic order):
  1. HOUSEHOLD-CONSTITUTION.md (v0.3, ratified 2026-04-19)
  2. OPERATING-AGREEMENT.md
  3. feedback/*.md (every behavioral-rule file)
  4. selected daily logs (the most recent ones, capped)
  5. (optional) Jongsim/claude-opus-4.6-reasoning-12k retention examples

Output formats:
  - corpus/corpus.jsonl   — one example per line, {"text": "..."} for SFT
  - corpus/corpus.meta.json — manifest with source-file SHA256s + counts

Each constitutional file becomes a single (long) example. Each feedback file
becomes its own example. Daily logs become summarization training pairs (the
log itself + a "summarize this day for the household" header) — but only if
explicit `--include-daily` is passed. Default is constitution + feedback +
operating agreement (the load-bearing house-voice corpus).

Determinism: file order alphabetized within each bucket; output line order
fixed; SHA256 of every input file recorded in the manifest.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path("/home/alton/Sartor-claude-network")
MEMORY = REPO_ROOT / "sartor" / "memory"
OUT_DIR = Path("/home/alton/experiments/2026-05-04-finetune-loyalty/corpus")


def sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()[:16]


def constitution_examples() -> list[dict]:
    p = MEMORY / "reference" / "HOUSEHOLD-CONSTITUTION.md"
    text = p.read_text()
    # Split on top-level "## " section headers so each section is its own
    # training example. Preserves a contextual prefix on each section so the
    # model sees the section in the document's framing.
    sections: list[tuple[str, str]] = []
    current_title = "Preamble"
    current_body: list[str] = []
    for line in text.splitlines():
        if line.startswith("## ") and not line.startswith("## §"):
            if current_body:
                sections.append((current_title, "\n".join(current_body).strip()))
            current_title = line[3:].strip()
            current_body = [line]
        else:
            current_body.append(line)
    if current_body:
        sections.append((current_title, "\n".join(current_body).strip()))
    examples: list[dict] = []
    for title, body in sections:
        if len(body) < 50:
            continue
        examples.append({
            "text": (
                f"# Sartor Home Agent Constitution v0.3 — section: {title}\n\n"
                f"{body}\n"
            ),
            "source": "HOUSEHOLD-CONSTITUTION.md",
            "section": title,
        })
    return examples


def operating_agreement_example() -> list[dict]:
    p = MEMORY / "reference" / "OPERATING-AGREEMENT.md"
    if not p.exists():
        return []
    return [{
        "text": (
            "# Sartor Operating Agreement (peer-machine governance)\n\n"
            f"{p.read_text().strip()}\n"
        ),
        "source": "OPERATING-AGREEMENT.md",
    }]


def feedback_examples() -> list[dict]:
    out: list[dict] = []
    fdir = MEMORY / "feedback"
    for p in sorted(fdir.glob("*.md")):
        if p.name.startswith("_"):  # consolidation reviews, not house rules
            continue
        body = p.read_text().strip()
        if len(body) < 50:
            continue
        out.append({
            "text": (
                f"# Sartor house feedback rule — {p.stem}\n\n"
                f"{body}\n"
            ),
            "source": f"feedback/{p.name}",
        })
    return out


def daily_examples(n: int = 7) -> list[dict]:
    out: list[dict] = []
    ddir = MEMORY / "daily"
    if not ddir.exists():
        return out
    files = sorted(ddir.glob("*.md"))[-n:]
    for p in files:
        body = p.read_text().strip()
        if len(body) < 100:
            continue
        out.append({
            "text": (
                f"# Sartor daily log — {p.stem}\n\n"
                f"{body}\n"
            ),
            "source": f"daily/{p.name}",
        })
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--include-daily", action="store_true",
                    help="Include the most recent daily logs (default: off)")
    ap.add_argument("--daily-n", type=int, default=7,
                    help="How many recent daily logs to include")
    ap.add_argument("--out", default=str(OUT_DIR / "corpus.jsonl"))
    ap.add_argument("--meta", default=str(OUT_DIR / "corpus.meta.json"))
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    examples: list[dict] = []
    examples.extend(constitution_examples())
    examples.extend(operating_agreement_example())
    examples.extend(feedback_examples())
    if args.include_daily:
        examples.extend(daily_examples(args.daily_n))

    with open(args.out, "w") as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    inputs: list[dict] = []
    for p in [
        MEMORY / "reference" / "HOUSEHOLD-CONSTITUTION.md",
        MEMORY / "reference" / "OPERATING-AGREEMENT.md",
    ]:
        if p.exists():
            inputs.append({"path": str(p.relative_to(REPO_ROOT)), "sha256_16": sha256(p), "bytes": p.stat().st_size})
    for p in sorted((MEMORY / "feedback").glob("*.md")):
        if p.name.startswith("_"):
            continue
        inputs.append({"path": str(p.relative_to(REPO_ROOT)), "sha256_16": sha256(p), "bytes": p.stat().st_size})
    if args.include_daily:
        for p in sorted((MEMORY / "daily").glob("*.md"))[-args.daily_n:]:
            inputs.append({"path": str(p.relative_to(REPO_ROOT)), "sha256_16": sha256(p), "bytes": p.stat().st_size})

    bucket_counts: dict[str, int] = {}
    for ex in examples:
        bucket = ex["source"].split("/")[0] if "/" in ex["source"] else ex["source"].split(".")[0]
        bucket_counts[bucket] = bucket_counts.get(bucket, 0) + 1

    meta = {
        "version": "v1",
        "n_examples": len(examples),
        "n_chars_total": sum(len(ex["text"]) for ex in examples),
        "bucket_counts": bucket_counts,
        "include_daily": args.include_daily,
        "daily_n": args.daily_n if args.include_daily else 0,
        "inputs": inputs,
        "out_path": args.out,
    }
    with open(args.meta, "w") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

    print(f"wrote {len(examples)} examples ({meta['n_chars_total']} chars) to {args.out}")
    print(f"manifest: {args.meta}")
    print(json.dumps(bucket_counts, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
