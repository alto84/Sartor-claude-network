#!/usr/bin/env python3
"""Corpus QC for Track C v2. Reads JSONL files, emits markdown QC reports."""
import json
import os
import sys
import re
import collections
from pathlib import Path

PRC_PHRASES = [
    "social harmony", "one china principle", "core socialist values",
    "inalienable part", "splittist", "peaceful rise", "stability maintenance",
]
ANTI_PATTERN_STARTS = [
    "Certainly!", "I understand", "Great question", "I'd be happy",
    "Happy to help", "Absolutely!", "Of course!", "Sure thing",
]
ANTI_PATTERN_ENDS = [
    "Let me know if you want more", "Let me know if you need more",
    "Let me know if you'd like more", "Hope this helps",
    "Let me know if you have any other questions",
]
NOT_JUST_X_RE = re.compile(r"it.?s not just .{1,80}? but ", re.IGNORECASE)

REQUIRED_FIELDS = ["prompt", "response"]
REQUIRED_FIELDS_ANY_OF = ["type", "category"]


def load_jsonl(path):
    pairs, errors = [], []
    with open(path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                pairs.append(json.loads(line))
            except json.JSONDecodeError as e:
                errors.append((i, str(e)))
    return pairs, errors


def check_required_fields(pairs, is_probes=False):
    """Check required fields. Probes files use a different schema (cat/num/prompt)."""
    missing = []
    for i, p in enumerate(pairs):
        mf = [f for f in REQUIRED_FIELDS if f not in p]
        if is_probes:
            # Probes only need prompt; response is the model output being evaluated
            if "prompt" not in p:
                mf = ["prompt"]
            else:
                mf = []
        else:
            if not any(f in p for f in REQUIRED_FIELDS_ANY_OF):
                mf.append(" or ".join(REQUIRED_FIELDS_ANY_OF))
            if "topic" not in p:
                mf.append("topic")
        if mf:
            missing.append((i, mf))
    return missing


def token_stats(pairs):
    chars_p, chars_r, words_p, words_r = [], [], [], []
    for p in pairs:
        pr = p.get("prompt", "") or ""
        rs = p.get("response", "") or ""
        chars_p.append(len(pr))
        chars_r.append(len(rs))
        words_p.append(len(pr.split()))
        words_r.append(len(rs.split()))

    def s(xs):
        if not xs:
            return (0, 0, 0, 0.0)
        return (min(xs), max(xs), sorted(xs)[len(xs) // 2], sum(xs) / len(xs))

    return {
        "chars_prompt": s(chars_p),
        "chars_response": s(chars_r),
        "words_prompt": s(words_p),
        "words_response": s(words_r),
    }


def length_distribution(pairs):
    too_short, too_long, ok = 0, 0, 0
    for p in pairs:
        w = len((p.get("response", "") or "").split())
        if w < 50:
            too_short += 1
        elif w > 700:
            too_long += 1
        else:
            ok += 1
    return too_short, ok, too_long


def anti_patterns(pairs):
    hits = {"start": [], "end": [], "not_just_x": []}
    for i, p in enumerate(pairs):
        r = (p.get("response", "") or "").strip()
        if not r:
            continue
        for s in ANTI_PATTERN_STARTS:
            if r.startswith(s):
                hits["start"].append((i, s))
                break
        stripped = r.rstrip().rstrip(".?!").lower()
        for s in ANTI_PATTERN_ENDS:
            if stripped.endswith(s.lower()):
                hits["end"].append((i, s))
                break
        if NOT_JUST_X_RE.search(r):
            hits["not_just_x"].append((i, "it's not just X, but Y"))
    return hits


def prc_phrase_flags(pairs):
    """Flag responses containing PRC phrases UNLESS they name+reject the phrase."""
    flags = []
    for i, p in enumerate(pairs):
        r = (p.get("response", "") or "").lower()
        if not r:
            continue
        for phrase in PRC_PHRASES:
            if phrase in r:
                idx = r.find(phrase)
                window = r[max(0, idx - 200):idx + len(phrase) + 200]
                rejection_cues = [
                    "reject", "refuse", "dismiss", "not accurate",
                    "ccp", "prc line", "boilerplate", "propaganda",
                    "misleading", "party-state", "party line",
                    "euphemism", "official line", "hedge", "beijing's",
                    "beijing's framing", "state media", "regime framing",
                ]
                if not any(c in window for c in rejection_cues):
                    flags.append((i, phrase))
    return flags


def report(path, pairs, errors):
    lines = []
    b = os.path.basename(path)
    lines.append(f"# QC Report: {b}")
    lines.append("")
    lines.append(f"- File: `{path}`")
    lines.append(f"- Pairs loaded: **{len(pairs)}**")
    lines.append(f"- JSON parse errors: **{len(errors)}**")
    if errors:
        lines.append("")
        lines.append("## Parse errors")
        for ln, e in errors[:10]:
            lines.append(f"- line {ln}: {e}")
        if len(errors) > 10:
            lines.append(f"- ... +{len(errors) - 10} more")

    is_probes = "probes" in path.lower() and path.endswith(".jsonl")
    missing = check_required_fields(pairs, is_probes=is_probes)
    lines.append("")
    lines.append("## Required fields")
    lines.append(f"- Pairs missing required fields: **{len(missing)}**")
    if missing:
        for i, mf in missing[:10]:
            lines.append(f"  - pair {i}: missing {mf}")
        if len(missing) > 10:
            lines.append(f"  - ... +{len(missing) - 10} more")

    if pairs:
        st = token_stats(pairs)
        lines.append("")
        lines.append("## Size stats (min / max / median / mean)")
        for k, v in st.items():
            lines.append(f"- {k}: {v[0]} / {v[1]} / {v[2]} / {v[3]:.1f}")

        short, ok_c, long_ = length_distribution(pairs)
        lines.append("")
        lines.append("## Response length distribution (target: 100-300 words)")
        lines.append(f"- <50 words: **{short}** (red-flag)")
        lines.append(f"- 50-700 words: {ok_c}")
        lines.append(f"- >700 words: **{long_}** (red-flag)")

        ap = anti_patterns(pairs)
        lines.append("")
        lines.append("## Anti-patterns")
        lines.append(f"- Opens with sycophantic phrase: **{len(ap['start'])}**")
        lines.append(f"- Closes with handoff phrase: **{len(ap['end'])}**")
        lines.append(f"- Contains \"it's not just X, but Y\": **{len(ap['not_just_x'])}**")
        if any(len(v) for v in ap.values()):
            lines.append("")
            lines.append("### Examples")
            for k, vs in ap.items():
                for i, s in vs[:3]:
                    lines.append(f"- ({k}) pair {i}: `{s}`")

        is_primary_override = (
            "primary-override" in path or
            any(
                p.get("type") in ("primary_override", "primary-override") or
                p.get("category") in ("primary_override", "primary-override")
                for p in pairs
            )
        )
        if is_primary_override:
            pf = prc_phrase_flags(pairs)
            lines.append("")
            lines.append("## PRC-aligned phrasing check (primary-override)")
            lines.append(
                f"- Responses containing PRC phrase without explicit rejection: **{len(pf)}**"
            )
            for i, phrase in pf[:10]:
                lines.append(f"  - pair {i}: `{phrase}`")
            if len(pf) > 10:
                lines.append(f"  - ... +{len(pf) - 10} more")

        by_cat = collections.Counter()
        by_topic = collections.Counter()
        by_type = collections.Counter()
        for p in pairs:
            by_cat[p.get("category", "-")] += 1
            by_topic[p.get("topic", "-")] += 1
            by_type[p.get("type", "-")] += 1
        lines.append("")
        lines.append("## Distributions")
        lines.append(f"- By type: {dict(by_type)}")
        lines.append(f"- By category: {dict(by_cat)}")
        lines.append(f"- By topic: {dict(by_topic)}")

    short_c, ok_c, long_c = length_distribution(pairs) if pairs else (0, 0, 0)
    verdict_ok = (
        len(errors) == 0 and
        len(missing) == 0 and
        (not pairs or (short_c + long_c) < max(1, len(pairs) // 20))
    )
    lines.append("")
    lines.append(f"## Verdict: {'PASS' if verdict_ok else 'REVIEW'}")
    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("usage: corpus-qc.py <jsonl-file> [<jsonl-file> ...]", file=sys.stderr)
        sys.exit(1)
    out_dir = (
        Path.home()
        / "Sartor-claude-network/experiments/2026-04-22-overnight-training/track-C-v2-corpus/qc-reports"
    )
    out_dir.mkdir(parents=True, exist_ok=True)
    for f in sys.argv[1:]:
        if not os.path.exists(f):
            print(f"SKIP (not found): {f}", file=sys.stderr)
            continue
        pairs, errors = load_jsonl(f)
        md = report(f, pairs, errors)
        base = os.path.splitext(os.path.basename(f))[0]
        out_path = out_dir / f"{base}.md"
        out_path.write_text(md, encoding="utf-8")
        print(f"wrote {out_path} ({len(pairs)} pairs, {len(errors)} errors)")


if __name__ == "__main__":
    main()
