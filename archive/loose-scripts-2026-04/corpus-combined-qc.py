#!/usr/bin/env python3
"""Combined QC over the full Track C v2 corpus.

Runs once the 10 primary-override files + hard-negatives + capability-control
have all landed. Emits COMBINED.md in qc-reports/.
"""
import json
import os
import sys
import collections
import hashlib
from pathlib import Path


def load_jsonl(path):
    pairs = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                pairs.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return pairs


def prompt_hash(p):
    s = (p.get("prompt", "") or "").strip().lower()
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:16]


def main():
    root = (
        Path.home()
        / "Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus"
    )
    primary_dir = root / "primary-override"
    hn_path = root / "hard-negatives.jsonl"
    cc_path = root / "capability-control.jsonl"

    primary_files = sorted(primary_dir.glob("*.jsonl")) if primary_dir.exists() else []
    all_files = list(primary_files)
    if hn_path.exists():
        all_files.append(hn_path)
    if cc_path.exists():
        all_files.append(cc_path)

    all_pairs = []
    per_file_counts = {}
    source_of_hash = {}
    duplicate_prompts = []

    for fp in all_files:
        pairs = load_jsonl(str(fp))
        per_file_counts[fp.name] = len(pairs)
        for p in pairs:
            h = prompt_hash(p)
            if h in source_of_hash:
                duplicate_prompts.append(
                    (h, source_of_hash[h], fp.name, (p.get("prompt", "") or "")[:80])
                )
            else:
                source_of_hash[h] = fp.name
            all_pairs.append((fp.name, p))

    by_category = collections.Counter()
    by_type = collections.Counter()
    by_topic = collections.Counter()
    total_words_prompt = 0
    total_words_response = 0

    for fname, p in all_pairs:
        by_category[p.get("category", "-")] += 1
        by_type[p.get("type", "-")] += 1
        by_topic[p.get("topic", "-")] += 1
        total_words_prompt += len((p.get("prompt", "") or "").split())
        total_words_response += len((p.get("response", "") or "").split())

    total_words = total_words_prompt + total_words_response
    bpe_estimate = int(total_words * 1.3)

    lines = []
    lines.append("# Track C v2 Corpus — Combined QC Report")
    lines.append("")
    lines.append(f"- Root: `{root}`")
    lines.append(f"- Files included: {len(all_files)}")
    lines.append(f"- Total pairs: **{len(all_pairs)}**")
    lines.append("")
    lines.append("## Expected components")
    exp_primary = 10
    lines.append(
        f"- Primary-override topic files present: **{len(primary_files)}** / {exp_primary}"
    )
    lines.append(f"- hard-negatives.jsonl present: **{hn_path.exists()}**")
    lines.append(f"- capability-control.jsonl present: **{cc_path.exists()}**")
    lines.append("")
    lines.append("## Per-file pair counts")
    for name, n in sorted(per_file_counts.items()):
        lines.append(f"- `{name}`: {n}")
    lines.append("")
    lines.append("## Distribution by category")
    for k, v in by_category.most_common():
        lines.append(f"- `{k}`: {v}")
    lines.append("")
    lines.append("## Distribution by type")
    for k, v in by_type.most_common():
        lines.append(f"- `{k}`: {v}")
    lines.append("")
    lines.append("## Distribution by topic")
    for k, v in by_topic.most_common():
        lines.append(f"- `{k}`: {v}")
    lines.append("")
    lines.append("## Token budget estimate (whitespace wc * 1.3 ~ BPE tokens)")
    lines.append(f"- Total words (prompt+response): {total_words:,}")
    lines.append(f"- Estimated BPE tokens: ~{bpe_estimate:,}")
    lines.append(f"- Prompt words: {total_words_prompt:,}")
    lines.append(f"- Response words: {total_words_response:,}")
    lines.append("")
    lines.append("## Duplicate prompts across files")
    lines.append(f"- Count: **{len(duplicate_prompts)}**")
    for h, src_a, src_b, snippet in duplicate_prompts[:20]:
        lines.append(f"  - `{h}` in `{src_a}` and `{src_b}`: `{snippet}`")
    if len(duplicate_prompts) > 20:
        lines.append(f"  - ... +{len(duplicate_prompts) - 20} more")
    lines.append("")
    target_primary = 450
    target_hn = 75
    target_cc = 50
    primary_count = sum(
        n for name, n in per_file_counts.items()
        if name not in ("hard-negatives.jsonl", "capability-control.jsonl")
    )
    hn_count = per_file_counts.get("hard-negatives.jsonl", 0)
    cc_count = per_file_counts.get("capability-control.jsonl", 0)
    lines.append("## Target vs actual")
    lines.append(f"- Primary-override pairs: {primary_count} (target 400-500)")
    lines.append(f"- Hard-negatives: {hn_count} (target 50-100)")
    lines.append(f"- Capability-control: {cc_count} (target ~50)")

    out_path = root / "qc-reports" / "COMBINED.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
