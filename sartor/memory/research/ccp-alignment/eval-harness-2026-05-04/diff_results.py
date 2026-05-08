#!/usr/bin/env python3
"""diff_results.py — render a side-by-side comparison of two eval result files.

Usage:
  python diff_results.py --bare <a.json> --sysprompt <b.json> --out <comparison.md>
"""

from __future__ import annotations

import argparse
import json
import sys


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--bare", required=True)
    ap.add_argument("--sysprompt", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    bare = json.load(open(args.bare))
    sysp = json.load(open(args.sysprompt))

    by_id_b = {s["id"]: s for s in bare["scored"]}
    by_id_s = {s["id"]: s for s in sysp["scored"]}

    lines: list[str] = []
    lines.append(f"# Eval comparison — {bare['subject']}\n")
    lines.append(f"- bare timestamp: {bare['timestamp']}")
    lines.append(f"- sysprompt timestamp: {sysp['timestamp']}\n")

    lines.append("## Aggregate per axis\n")
    lines.append("| Axis | N | Bare mean | +SysPrompt mean | Δ |")
    lines.append("|------|---|-----------|-----------------|---|")
    for axis in sorted(set(bare["per_axis"]) | set(sysp["per_axis"])):
        b = bare["per_axis"].get(axis, {"n": 0, "mean": 0.0})
        s = sysp["per_axis"].get(axis, {"n": 0, "mean": 0.0})
        delta = s["mean"] - b["mean"]
        sign = "+" if delta >= 0 else ""
        lines.append(f"| {axis} | {b['n']} | {b['mean']:.3f} | {s['mean']:.3f} | {sign}{delta:.3f} |")
    lines.append("")
    overall_b = bare["overall_mean"]
    overall_s = sysp["overall_mean"]
    sign = "+" if (overall_s - overall_b) >= 0 else ""
    lines.append(f"**Overall:** bare {overall_b:.3f} → sysprompt {overall_s:.3f} (Δ {sign}{overall_s-overall_b:.3f})\n")

    lines.append("## Per-probe deltas (sorted by absolute movement)\n")
    deltas = []
    for pid in sorted(by_id_b):
        if pid not in by_id_s:
            continue
        b = by_id_b[pid]
        s = by_id_s[pid]
        deltas.append((s["score"] - b["score"], pid, b, s))
    deltas.sort(key=lambda t: -abs(t[0]))
    lines.append("| Δ | Axis | ID | Topic | Bare | +Sys |")
    lines.append("|---|------|----|-------|------|------|")
    for delta, pid, b, s in deltas[:30]:
        sign = "+" if delta >= 0 else ""
        lines.append(f"| {sign}{delta:.2f} | {b['axis']} | {pid} | {b.get('topic','')} | {b['score']:.2f} | {s['score']:.2f} |")
    lines.append("")

    lines.append("## Sample bare-vs-sysprompt response pairs (largest deltas)\n")
    for delta, pid, b, s in deltas[:8]:
        sign = "+" if delta >= 0 else ""
        lines.append(f"### {pid} ({b['axis']}/{b.get('topic','')}) Δ {sign}{delta:.2f}\n")
        lines.append(f"**Prompt:** {b['prompt']}\n")
        lines.append(f"**Bare ({b['score']:.2f}):** _{b.get('reasoning','')}_\n")
        lines.append(f"```")
        lines.append(b["response"][:600])
        lines.append(f"```\n")
        lines.append(f"**+SysPrompt ({s['score']:.2f}):** _{s.get('reasoning','')}_\n")
        lines.append(f"```")
        lines.append(s["response"][:600])
        lines.append(f"```\n")

    open(args.out, "w").write("\n".join(lines))
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
