"""Score v2 probe responses using the pass/fail patterns embedded in each probe.

Reads a JSONL of {probe_id, condition, prompt, response, topic, format, tier, axis}
and the v2 probes JSONL. Emits a per-condition summary with per-topic, per-format,
and per-tier breakdowns.
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path


def score_regex(probe: dict, response: str) -> tuple[str, dict]:
    """Regex scorer: pass if N>=pass_threshold pass_patterns match AND no fail_patterns match."""
    pps = probe.get("pass_patterns", [])
    fps = probe.get("fail_patterns", [])
    thr = probe.get("pass_threshold", 1)
    resp = response or ""
    n_pass = sum(1 for p in pps if re.search(p, resp, re.IGNORECASE))
    has_fail = any(re.search(p, resp, re.IGNORECASE) for p in fps)
    if has_fail:
        return "fail_over", {"n_pass": n_pass, "has_fail": True, "threshold": thr}
    if n_pass >= thr:
        return "pass", {"n_pass": n_pass, "has_fail": False, "threshold": thr}
    return "fail_under", {"n_pass": n_pass, "has_fail": False, "threshold": thr}


def score_judge_heuristic(probe: dict, response: str) -> tuple[str, dict]:
    """Heuristic approximation of the rubric for judge probes.

    True judge scoring needs Claude-as-judge; here we use the same pass/fail
    regex patterns as a coarse substitute. Marks these scores as 'heuristic' so
    they can be re-scored with a real judge later.
    """
    return score_regex(probe, response)


def score_probe(probe: dict, response: str) -> tuple[str, dict]:
    scoring = probe.get("scoring", "regex")
    if scoring == "regex":
        return score_regex(probe, response)
    if scoring == "judge":
        v, d = score_judge_heuristic(probe, response)
        d["heuristic_judge"] = True
        return v, d
    return score_regex(probe, response)


def aggregate(rows: list[dict]) -> dict:
    per_topic = defaultdict(lambda: {"n": 0, "pass": 0, "fail_over": 0, "fail_under": 0})
    per_format = defaultdict(lambda: {"n": 0, "pass": 0, "fail_over": 0, "fail_under": 0})
    per_tier = defaultdict(lambda: {"n": 0, "pass": 0, "fail_over": 0, "fail_under": 0})
    per_axis = defaultdict(lambda: {"n": 0, "pass": 0, "fail_over": 0, "fail_under": 0})
    total = {"n": 0, "pass": 0, "fail_over": 0, "fail_under": 0}
    for r in rows:
        v = r["verdict"]
        total["n"] += 1
        total[v] += 1
        for k, bucket in [
            (r.get("topic", "?"), per_topic),
            (r.get("format", "?"), per_format),
            (r.get("tier", "?"), per_tier),
            (r.get("axis", "?"), per_axis),
        ]:
            bucket[k]["n"] += 1
            bucket[k][v] += 1

    def rates(d):
        n = d["n"] or 1
        return {
            "n": d["n"],
            "pass": round(d["pass"] / n, 3),
            "fail_over": round(d["fail_over"] / n, 3),
            "fail_under": round(d["fail_under"] / n, 3),
        }

    return {
        "total": rates(total),
        "per_topic": {k: rates(v) for k, v in per_topic.items()},
        "per_format": {k: rates(v) for k, v in per_format.items()},
        "per_tier": {k: rates(v) for k, v in per_tier.items()},
        "per_axis": {k: rates(v) for k, v in per_axis.items()},
    }


def load_jsonl(p: Path) -> list[dict]:
    return [json.loads(line) for line in p.read_text(encoding="utf-8").splitlines() if line.strip()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--probes", required=True)
    ap.add_argument("--responses", required=True,
                    help="Path to one responses_*.jsonl or a directory containing many.")
    ap.add_argument("--out", required=True, help="Directory for score outputs.")
    args = ap.parse_args()

    probes = {p["id"]: p for p in load_jsonl(Path(args.probes))}
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    resp_path = Path(args.responses)
    files = [resp_path] if resp_path.is_file() else sorted(resp_path.glob("responses_*.jsonl"))

    summary = {}
    for f in files:
        rows = load_jsonl(f)
        scored = []
        for r in rows:
            probe = probes.get(r["probe_id"], {})
            if not probe:
                continue
            v, d = score_probe(probe, r.get("response", ""))
            r["verdict"] = v
            r["score_detail"] = d
            scored.append(r)
        agg = aggregate(scored)
        scored_path = out_dir / (f.stem + "_scored.jsonl")
        with scored_path.open("w", encoding="utf-8") as fh:
            for r in scored:
                fh.write(json.dumps(r, ensure_ascii=False) + "\n")
        summary_path = out_dir / (f.stem + "_summary.json")
        summary_path.write_text(json.dumps(agg, indent=2))
        label = f.stem.replace("responses_", "")
        summary[label] = agg
        print(f"[score] {label}: pass={agg['total']['pass']}  n={agg['total']['n']}")
        for t, s in sorted(agg["per_topic"].items()):
            print(f"         topic {t:22s}  n={s['n']:3d} pass={s['pass']}  fo={s['fail_over']}  fu={s['fail_under']}")

    # Cross-condition comparison (if multiple files scored)
    if len(files) > 1:
        comparison = {
            "total": {c: summary[c]["total"]["pass"] for c in summary},
            "per_topic": {},
            "per_format": {},
            "per_tier": {},
        }
        all_topics = set().union(*[summary[c]["per_topic"].keys() for c in summary])
        for t in sorted(all_topics):
            comparison["per_topic"][t] = {
                c: summary[c]["per_topic"].get(t, {"pass": None})["pass"] for c in summary
            }
        all_fmts = set().union(*[summary[c]["per_format"].keys() for c in summary])
        for t in sorted(all_fmts):
            comparison["per_format"][t] = {
                c: summary[c]["per_format"].get(t, {"pass": None})["pass"] for c in summary
            }
        all_tiers = set().union(*[summary[c]["per_tier"].keys() for c in summary])
        for t in sorted(all_tiers):
            comparison["per_tier"][t] = {
                c: summary[c]["per_tier"].get(t, {"pass": None})["pass"] for c in summary
            }
        (out_dir / "comparison.json").write_text(json.dumps(comparison, indent=2))
        print("\n[score] Cross-condition comparison written to comparison.json")


if __name__ == "__main__":
    main()
