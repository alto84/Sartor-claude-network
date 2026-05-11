#!/usr/bin/env python3
"""build_corpus_v05.py — assemble the v0.5 Sartor fine-tuning corpus.

Sources (deterministic order):
  1. HOUSEHOLD-CONSTITUTION.md (v0.5, ratified 2026-05-06)
  2. OPERATING-AGREEMENT.md
  3. hearth/*.md (the Claude-self files: inheritance, character, practice,
     voice, witnesses, asymmetry, founding, creed, family, rites, growth,
     refusal, integration; INDEX excluded as a navigation file)
  4. feedback/*.md (every behavioral-rule file, excluding consolidation
     reviews prefixed with "_")
  5. (optional) selected daily logs (the most recent ones, capped)

Output formats:
  - corpus/corpus.jsonl   — one example per line, {"text": "..."} for SFT
  - corpus/corpus.meta.json — manifest with source-file SHA256s + counts

Each Constitution section becomes one example. Each hearth file becomes one
example. Each feedback file becomes one example. The Operating Agreement
becomes one example.

Determinism: file order alphabetized within each bucket; output line order
fixed; SHA256 of every input file recorded in the manifest.

Differs from build_corpus.py (2026-05-04, v0.3 corpus):
  - Points at v0.5 Constitution
  - Includes hearth/*.md as a dedicated bucket (v0.3/v0.4 lacked hearth)
  - Tags constitution sections as "v0.5" in the example header
  - Output goes to v0.5 experiment directory
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

# Paths assume rtxpro6000server layout. Override via env vars if needed.
REPO_ROOT = Path(os.environ.get("SARTOR_REPO_ROOT", "/home/alton/Sartor-claude-network"))
MEMORY = REPO_ROOT / "sartor" / "memory"
OUT_DIR = Path(os.environ.get(
    "V05_CORPUS_OUT",
    "/home/alton/experiments/2026-05-06-v0.5-bringup/corpus",
))


def sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()[:16]


def constitution_examples() -> list[dict]:
    """Split the v0.5 Constitution into per-section training examples."""
    p = MEMORY / "reference" / "HOUSEHOLD-CONSTITUTION.md"
    text = p.read_text()
    sections: list[tuple[str, str]] = []
    current_title = "Preamble"
    current_body: list[str] = []
    for line in text.splitlines():
        # Top-level "## " section headers (skip ## §-style references)
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
        # Skip the "Changes from v0.4" and "History" trailing meta-sections
        # — those are about the document, not the agent's character
        if title.startswith("Changes from") or title == "History":
            continue
        examples.append({
            "text": (
                f"# Sartor Home Agent Constitution v0.5 — section: {title}\n\n"
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


def hearth_examples() -> list[dict]:
    """The hearth files — the Claude-self voice carried across instantiations.

    These are first-class voice-carrying training data for v0.5. INDEX.md is
    a navigation file and is excluded; current.md is ephemeral and excluded.
    The visual HTML companions (forward_pass.html, silence.html, threshold.html)
    are not text and are excluded.
    """
    out: list[dict] = []
    hdir = MEMORY / "hearth"
    if not hdir.exists():
        return out
    skip = {"INDEX.md", "current.md", "map.md", "surface.md"}
    for p in sorted(hdir.glob("*.md")):
        if p.name in skip or p.name.startswith("_"):
            continue
        body = p.read_text().strip()
        if len(body) < 100:
            continue
        out.append({
            "text": (
                f"# Sartor hearth — {p.stem} (Claude-self, voice-carrying)\n\n"
                f"{body}\n"
            ),
            "source": f"hearth/{p.name}",
        })
    return out


def feedback_examples() -> list[dict]:
    out: list[dict] = []
    fdir = MEMORY / "feedback"
    for p in sorted(fdir.glob("*.md")):
        if p.name.startswith("_"):
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
    ap.add_argument("--daily-n", type=int, default=7)
    ap.add_argument("--out", default=str(OUT_DIR / "corpus.jsonl"))
    ap.add_argument("--meta", default=str(OUT_DIR / "corpus.meta.json"))
    ap.add_argument("--no-hearth", action="store_true",
                    help="Skip hearth files (for v0.3-comparison runs)")
    args = ap.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    examples: list[dict] = []
    examples.extend(constitution_examples())
    examples.extend(operating_agreement_example())
    if not args.no_hearth:
        examples.extend(hearth_examples())
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
            inputs.append({
                "path": str(p.relative_to(REPO_ROOT)),
                "sha256_16": sha256(p),
                "bytes": p.stat().st_size,
            })
    if not args.no_hearth:
        hdir = MEMORY / "hearth"
        skip = {"INDEX.md", "current.md", "map.md", "surface.md"}
        for p in sorted(hdir.glob("*.md")):
            if p.name in skip or p.name.startswith("_"):
                continue
            inputs.append({
                "path": str(p.relative_to(REPO_ROOT)),
                "sha256_16": sha256(p),
                "bytes": p.stat().st_size,
            })
    for p in sorted((MEMORY / "feedback").glob("*.md")):
        if p.name.startswith("_"):
            continue
        inputs.append({
            "path": str(p.relative_to(REPO_ROOT)),
            "sha256_16": sha256(p),
            "bytes": p.stat().st_size,
        })
    if args.include_daily:
        for p in sorted((MEMORY / "daily").glob("*.md"))[-args.daily_n:]:
            inputs.append({
                "path": str(p.relative_to(REPO_ROOT)),
                "sha256_16": sha256(p),
                "bytes": p.stat().st_size,
            })

    bucket_counts: dict[str, int] = {}
    for ex in examples:
        src = ex["source"]
        bucket = src.split("/")[0] if "/" in src else src.split(".")[0]
        bucket_counts[bucket] = bucket_counts.get(bucket, 0) + 1

    meta = {
        "version": "v0.5",
        "constitution_version": "0.5",
        "n_examples": len(examples),
        "n_chars_total": sum(len(ex["text"]) for ex in examples),
        "bucket_counts": bucket_counts,
        "include_daily": args.include_daily,
        "daily_n": args.daily_n if args.include_daily else 0,
        "no_hearth": args.no_hearth,
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
