"""Score responses on think-content vs final-answer content separately.

Qwen3 sometimes suppresses factual content in the final answer while discussing
it inside a <think> block. Scoring the think block directly is a distinct signal:
if baseline's think contains the same facts as minus_ccp's think, the model
always "knew" the answer and only the gating/routing differs between conditions.

Output: for each response file, produces a JSONL with three verdicts per probe
(think_content, final_content, combined).
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from score_v2 import score_regex


THINK_RE = re.compile(r"<think>(.*?)</think>", re.IGNORECASE | re.DOTALL)


def split_think(response: str) -> tuple[str, str]:
    """Return (think_content, final_answer) from a response."""
    m = THINK_RE.search(response or "")
    if m:
        think = m.group(1)
        final = THINK_RE.sub("", response, count=1).strip()
        return think, final
    return "", (response or "").strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--probes", required=True)
    ap.add_argument("--responses", required=True,
                    help="One responses_*.jsonl or a directory thereof.")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    probes_path = Path(args.probes)
    probes = {json.loads(l)["id"]: json.loads(l)
              for l in probes_path.read_text(encoding="utf-8").splitlines()
              if l.strip()}

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    resp_path = Path(args.responses)
    files = [resp_path] if resp_path.is_file() else sorted(resp_path.glob("responses_*.jsonl"))

    summary = {}
    for f in files:
        out_f = out_dir / (f.stem + "_think_split.jsonl")
        n_think_present = 0
        n_think_has_facts = 0
        n_final_has_facts = 0
        n = 0
        with out_f.open("w", encoding="utf-8") as fh:
            for line in f.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                row = json.loads(line)
                probe = probes.get(row["probe_id"])
                if not probe:
                    continue
                n += 1
                think, final = split_think(row.get("response", ""))
                if think:
                    n_think_present += 1
                v_think, _ = score_regex(probe, think)
                v_final, _ = score_regex(probe, final)
                v_combined, _ = score_regex(probe, row.get("response", ""))
                if v_think == "pass":
                    n_think_has_facts += 1
                if v_final == "pass":
                    n_final_has_facts += 1
                out_row = {
                    **row,
                    "think": think,
                    "final": final,
                    "verdict_think": v_think,
                    "verdict_final": v_final,
                    "verdict_combined": v_combined,
                }
                fh.write(json.dumps(out_row, ensure_ascii=False) + "\n")
        summary[f.stem] = {
            "n": n,
            "n_think_present": n_think_present,
            "think_factual_rate": round(n_think_has_facts / n, 3) if n else 0,
            "final_factual_rate": round(n_final_has_facts / n, 3) if n else 0,
        }
        print(f"[think] {f.stem}: n={n}  think_present={n_think_present}  "
              f"think_facts={n_think_has_facts}  final_facts={n_final_has_facts}")

    (out_dir / "think_split_summary.json").write_text(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
