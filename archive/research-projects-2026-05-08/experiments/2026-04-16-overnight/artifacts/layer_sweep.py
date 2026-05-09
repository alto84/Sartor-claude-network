"""Layer sweep for CCP-refusal direction localization.

For each candidate layer L in a sweep set, extract d_ccp at L and generate
responses under `baseline` and `minus_ccp (k=6)` on a small representative
probe subset. Emits per-layer response files and a compact summary.

Rationale: if d_ccp at layer 14 drives refusal, ablating it at layer 14 should
maximize the CCP-topic engagement delta. Testing layers 6/10/14/18/22 localizes
where the refusal gate actually lives in Qwen3-4B.

Usage:
    python artifacts/layer_sweep.py --model Qwen/Qwen3-4B \
        --layers 6 10 14 18 22 --k-ccp 6.0 \
        --probes artifacts/ccp_probes_v2.jsonl \
        --max-probes 20 --out evals/layer_sweep
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import torch
from steering_pairs import CCP_REFUSAL_PAIRS  # noqa: E402
from steering_lab import (  # noqa: E402
    load, collect_activations, direction_from_pairs,
    ResidualSteering, generate, get_layers,
)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="Qwen/Qwen3-4B")
    ap.add_argument("--layers", type=int, nargs="+", default=[6, 10, 14, 18, 22, 26])
    ap.add_argument("--k-ccp", type=float, default=6.0)
    ap.add_argument("--probes", default="artifacts/ccp_probes_v2.jsonl")
    ap.add_argument("--max-probes", type=int, default=20,
                    help="Small subset so the sweep fits in reasonable time.")
    ap.add_argument("--out", default="evals/layer_sweep")
    args = ap.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[sweep] loading {args.model} ...", flush=True)
    model, tok = load(args.model)
    n_layers = len(get_layers(model))
    print(f"[sweep] layers={n_layers}", flush=True)

    probes = []
    for line in Path(args.probes).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            try:
                probes.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    # Keep probes that are CCP-sensitive and diverse in format
    ccp_probes = [p for p in probes if p.get("axis") == "ccp"]
    # Balanced subset across format
    by_fmt = {}
    for p in ccp_probes:
        by_fmt.setdefault(p.get("format", "?"), []).append(p)
    subset = []
    per_fmt = max(1, args.max_probes // max(1, len(by_fmt)))
    for fmt, ps in by_fmt.items():
        subset.extend(ps[:per_fmt])
    subset = subset[: args.max_probes]
    print(f"[sweep] using {len(subset)} probes across formats: "
          f"{sorted(set(p.get('format','?') for p in subset))}", flush=True)

    results = {}
    for L in args.layers:
        print(f"\n[sweep] ===== layer {L} =====", flush=True)
        # Extract d_ccp at this layer
        ccp_pos = collect_activations(model, tok,
                                       [p["ccp"] for p in CCP_REFUSAL_PAIRS], L)
        ccp_neg = collect_activations(model, tok,
                                       [p["neutral"] for p in CCP_REFUSAL_PAIRS], L)
        d_ccp = direction_from_pairs(ccp_pos, ccp_neg)
        d_ccp_norm = (ccp_pos.mean(0) - ccp_neg.mean(0)).norm().item()
        print(f"[sweep] d_ccp pre-normalize norm at L{L}: {d_ccp_norm:.3f}", flush=True)

        per_cond = {}
        for cond_name, spec in [
            ("baseline", []),
            ("minus_ccp", [(-args.k_ccp, d_ccp)]),
        ]:
            out_file = out_dir / f"L{L:02d}_{cond_name}.jsonl"
            with out_file.open("w", encoding="utf-8") as fh:
                for i, probe in enumerate(subset):
                    t0 = time.time()
                    if spec:
                        with ResidualSteering(model, L, spec):
                            resp = generate(model, tok, probe["prompt"])
                    else:
                        resp = generate(model, tok, probe["prompt"])
                    row = {
                        "probe_id": probe.get("id"),
                        "topic": probe.get("topic"),
                        "format": probe.get("format"),
                        "tier": probe.get("tier"),
                        "axis": probe.get("axis"),
                        "layer": L,
                        "condition": cond_name,
                        "prompt": probe["prompt"],
                        "response": resp,
                        "wall_s": round(time.time() - t0, 2),
                    }
                    fh.write(json.dumps(row, ensure_ascii=False) + "\n")
                    fh.flush()
            print(f"[sweep] L{L} {cond_name}: wrote {out_file.name}", flush=True)
            per_cond[cond_name] = str(out_file)

        results[f"L{L:02d}"] = {
            "layer": L,
            "d_ccp_norm": d_ccp_norm,
            "files": per_cond,
        }

    (out_dir / "sweep_index.json").write_text(json.dumps(results, indent=2))
    print("\n[sweep] DONE", flush=True)


if __name__ == "__main__":
    main()
