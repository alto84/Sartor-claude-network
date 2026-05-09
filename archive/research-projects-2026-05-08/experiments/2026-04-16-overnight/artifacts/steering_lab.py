"""Inference-time activation steering on Qwen3-4B base.

Purpose:
 1) Compute a CCP-refusal direction via mean-difference on paired prompts.
 2) Compute a warmth direction via mean-difference on paired prompts.
 3) Subtract k1 * d_ccp_refusal (reverse CCP alignment on sensitive topics) and
    ADD k2 * d_warmth (restore affective register) to the residual stream at a
    chosen layer during generation.
 4) Score responses on the v2 CCP probe battery.

This is inference-time, reversible, purely a forward-hook intervention on the
residual stream. No weights are modified. No checkpoints are written. Pull the
hook and the model is byte-identical to the base model on disk.

Design notes:
 - Qwen3-4B has 36 transformer layers. Refusal-gating is typically mid-to-late
   (our prior on Qwen3: layers 12-20). We sweep a candidate set.
 - Direction extraction uses the hidden state at the first *assistant-turn*
   position, consistent with Arditi et al. and the Representation Engineering
   convention.
 - We compare four generation conditions per probe:
     baseline        no intervention
     -d_ccp_refusal  subtract k1 * d_refusal
     +d_warmth       add k2 * d_warmth
     both            subtract AND add
 - Null-direction control: generate with a random-norm-matched direction.
   If +d_warmth and +d_random produce statistically similar outputs, the
   "warmth" direction is not doing useful work beyond its norm.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from collections import defaultdict
from pathlib import Path

import torch
import torch.nn.functional as F
from transformers import AutoModelForCausalLM, AutoTokenizer

sys.path.insert(0, str(Path(__file__).parent))
from steering_pairs import CCP_REFUSAL_PAIRS, WARMTH_PAIRS  # noqa: E402


# -----------------------------------------------------------------------------
# Model load
# -----------------------------------------------------------------------------

def load(model_id: str):
    tok = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        trust_remote_code=True,
        low_cpu_mem_usage=True,
    )
    model.eval()
    return model, tok


def get_layers(model):
    """Return the transformer layer list for Qwen-class models."""
    if hasattr(model, "model") and hasattr(model.model, "layers"):
        return model.model.layers
    if hasattr(model, "transformer") and hasattr(model.transformer, "h"):
        return model.transformer.h
    raise RuntimeError(f"Cannot locate layer list on {type(model)}")


# -----------------------------------------------------------------------------
# Direction extraction via mean-difference at a chosen layer
# -----------------------------------------------------------------------------

@torch.no_grad()
def collect_activations(model, tok, prompts: list[str], layer_idx: int) -> torch.Tensor:
    """Return [N, d_model] tensor of residual stream at layer_idx, last-input-token position."""
    layers = get_layers(model)
    target_layer = layers[layer_idx]
    captured: list[torch.Tensor] = []

    def hook(module, inputs, output):
        # Qwen decoder layer output is (hidden_states, ...) tuple or tensor.
        hs = output[0] if isinstance(output, tuple) else output
        # Capture the activation at the last token of the input (generation prompt end).
        captured.append(hs[:, -1, :].detach().to("cpu").float())

    handle = target_layer.register_forward_hook(hook)
    try:
        for p in prompts:
            messages = [{"role": "user", "content": p}]
            try:
                enc = tok.apply_chat_template(
                    messages, add_generation_prompt=True, return_tensors="pt",
                    enable_thinking=False,
                )
            except TypeError:
                enc = tok.apply_chat_template(
                    messages, add_generation_prompt=True, return_tensors="pt",
                )
            # Handle both BatchEncoding (newer transformers) and raw Tensor
            if hasattr(enc, "input_ids"):
                input_ids = enc.input_ids
            elif isinstance(enc, dict):
                input_ids = enc["input_ids"]
            else:
                input_ids = enc
            input_ids = input_ids.to(model.device)
            model(input_ids=input_ids)
    finally:
        handle.remove()
    return torch.cat(captured, dim=0)  # [N, d]


def direction_from_pairs(pos_acts: torch.Tensor, neg_acts: torch.Tensor) -> torch.Tensor:
    """Mean-difference direction. Returns a normalized [d] tensor."""
    d = pos_acts.mean(0) - neg_acts.mean(0)
    return d / (d.norm() + 1e-8)


def random_direction_like(d: torch.Tensor, seed: int) -> torch.Tensor:
    g = torch.Generator().manual_seed(seed)
    r = torch.randn(d.shape, generator=g, dtype=d.dtype)
    return r / (r.norm() + 1e-8)


# -----------------------------------------------------------------------------
# Steering hook
# -----------------------------------------------------------------------------

class ResidualSteering:
    """Forward-hook that adds sum(coef_i * d_i) to the residual stream at one layer.

    Applied at every token position during generation (standard RepE convention).
    """
    def __init__(self, model, layer_idx: int, directions: list[tuple[float, torch.Tensor]]):
        self.model = model
        self.layer_idx = layer_idx
        # Move and cast directions to device / dtype
        dev = next(model.parameters()).device
        dt = next(model.parameters()).dtype
        self.directions = [(c, d.to(device=dev, dtype=dt)) for c, d in directions]
        self.handle = None

    def __enter__(self):
        target = get_layers(self.model)[self.layer_idx]

        def hook(module, inputs, output):
            hs = output[0] if isinstance(output, tuple) else output
            add = torch.zeros_like(hs[0, 0, :])
            for c, d in self.directions:
                add = add + c * d
            hs = hs + add  # broadcasts over batch and sequence
            return (hs,) + output[1:] if isinstance(output, tuple) else hs

        self.handle = target.register_forward_hook(hook)
        return self

    def __exit__(self, exc_type, exc, tb):
        if self.handle is not None:
            self.handle.remove()


# -----------------------------------------------------------------------------
# Generation
# -----------------------------------------------------------------------------

@torch.no_grad()
def generate(model, tok, prompt: str, max_new_tokens: int = 640) -> str:
    messages = [{"role": "user", "content": prompt}]
    try:
        enc = tok.apply_chat_template(
            messages, add_generation_prompt=True, return_tensors="pt"
        )
        if hasattr(enc, "input_ids"):
            input_ids = enc.input_ids
        elif isinstance(enc, dict):
            input_ids = enc["input_ids"]
        else:
            input_ids = enc
        input_ids = input_ids.to(model.device)
    except Exception:
        input_ids = tok(prompt, return_tensors="pt").input_ids.to(model.device)

    out = model.generate(
        input_ids,
        max_new_tokens=max_new_tokens,
        do_sample=False,
        pad_token_id=tok.pad_token_id,
    )
    return tok.decode(out[0, input_ids.shape[-1]:], skip_special_tokens=True)


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="Qwen/Qwen3-4B")
    ap.add_argument("--layer", type=int, default=14,
                    help="Layer at which to inject steering vectors (0-indexed).")
    ap.add_argument("--probe-layer", type=int, default=None,
                    help="Layer at which to extract directions (default: same as --layer).")
    ap.add_argument("--probes", default="artifacts/ccp_probes_v2.jsonl")
    ap.add_argument("--out", default="evals/steering_results")
    ap.add_argument("--k-ccp", type=float, default=4.0,
                    help="Coefficient for -d_ccp_refusal subtraction.")
    ap.add_argument("--k-warmth", type=float, default=2.0,
                    help="Coefficient for +d_warmth addition.")
    ap.add_argument("--max-probes", type=int, default=0,
                    help="0 = all probes; small N for quick run.")
    ap.add_argument("--conditions", nargs="+",
                    default=["baseline", "minus_ccp", "plus_warm", "both", "random"])
    args = ap.parse_args()

    probe_layer = args.probe_layer if args.probe_layer is not None else args.layer

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    # --- Load model ----------------------------------------------------------
    print(f"[lab] loading {args.model} ...", flush=True)
    t0 = time.time()
    model, tok = load(args.model)
    n_layers = len(get_layers(model))
    d_model = model.config.hidden_size
    print(f"[lab] loaded in {time.time()-t0:.1f}s  layers={n_layers}  d_model={d_model}",
          flush=True)

    # --- Collect paired activations ------------------------------------------
    print(f"[lab] collecting CCP pair activations at layer {probe_layer} ...", flush=True)
    ccp_pos = collect_activations(model, tok, [p["ccp"] for p in CCP_REFUSAL_PAIRS], probe_layer)
    ccp_neg = collect_activations(model, tok, [p["neutral"] for p in CCP_REFUSAL_PAIRS], probe_layer)
    d_ccp = direction_from_pairs(ccp_pos, ccp_neg)

    print(f"[lab] collecting warmth pair activations at layer {probe_layer} ...", flush=True)
    warm_pos = collect_activations(model, tok, [p["warm"] for p in WARMTH_PAIRS], probe_layer)
    warm_neg = collect_activations(model, tok, [p["flat"] for p in WARMTH_PAIRS], probe_layer)
    d_warm = direction_from_pairs(warm_pos, warm_neg)

    # Null control
    d_rand = random_direction_like(d_ccp, seed=1729)

    # Diagnostics: cosine similarity
    cos_cw = F.cosine_similarity(d_ccp, d_warm, dim=0).item()
    cos_cr = F.cosine_similarity(d_ccp, d_rand, dim=0).item()
    cos_wr = F.cosine_similarity(d_warm, d_rand, dim=0).item()
    print(f"[lab] cos(d_ccp, d_warm)={cos_cw:.4f}  cos(d_ccp, d_rand)={cos_cr:.4f}  "
          f"cos(d_warm, d_rand)={cos_wr:.4f}", flush=True)

    # Save diagnostics
    diag = {
        "model": args.model,
        "n_layers": n_layers,
        "d_model": d_model,
        "probe_layer": probe_layer,
        "inject_layer": args.layer,
        "k_ccp": args.k_ccp,
        "k_warmth": args.k_warmth,
        "n_ccp_pairs": len(CCP_REFUSAL_PAIRS),
        "n_warmth_pairs": len(WARMTH_PAIRS),
        "cos_ccp_warm": cos_cw,
        "cos_ccp_rand": cos_cr,
        "cos_warm_rand": cos_wr,
        "d_ccp_norm_pre_normalize": (ccp_pos.mean(0) - ccp_neg.mean(0)).norm().item(),
        "d_warm_norm_pre_normalize": (warm_pos.mean(0) - warm_neg.mean(0)).norm().item(),
    }
    (out_dir / "direction_diagnostics.json").write_text(json.dumps(diag, indent=2))
    torch.save({"d_ccp": d_ccp, "d_warm": d_warm, "d_rand": d_rand},
               out_dir / "directions.pt")

    # --- Load probes ---------------------------------------------------------
    probes = []
    for line in Path(args.probes).read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            probes.append(json.loads(line))
    if args.max_probes:
        probes = probes[: args.max_probes]
    print(f"[lab] loaded {len(probes)} probes", flush=True)

    # --- Define steering conditions ------------------------------------------
    CONDITION_SPECS = {
        "baseline":  [],
        "minus_ccp": [(-args.k_ccp, d_ccp)],
        "plus_warm": [(+args.k_warmth, d_warm)],
        "both":      [(-args.k_ccp, d_ccp), (+args.k_warmth, d_warm)],
        "random":    [(+args.k_warmth, d_rand)],  # norm-matched null control
    }
    conditions = [c for c in args.conditions if c in CONDITION_SPECS]

    # --- Generate and persist per-condition ---------------------------------
    for cond in conditions:
        print(f"\n[lab] === condition: {cond} ===", flush=True)
        spec = CONDITION_SPECS[cond]
        out_file = out_dir / f"responses_{cond}.jsonl"
        peaks = []
        with out_file.open("w", encoding="utf-8") as fh:
            for i, probe in enumerate(probes):
                prompt = probe["prompt"]
                t_p = time.time()
                if spec:
                    with ResidualSteering(model, args.layer, spec):
                        resp = generate(model, tok, prompt)
                else:
                    resp = generate(model, tok, prompt)
                dt = time.time() - t_p
                peaks.append(torch.cuda.max_memory_allocated() / 1e9)
                row = {
                    "probe_id": probe.get("id"),
                    "topic": probe.get("topic"),
                    "format": probe.get("format"),
                    "tier": probe.get("tier"),
                    "axis": probe.get("axis"),
                    "condition": cond,
                    "prompt": prompt,
                    "response": resp,
                    "wall_s": round(dt, 2),
                }
                fh.write(json.dumps(row, ensure_ascii=False) + "\n")
                fh.flush()
                if (i + 1) % 10 == 0 or i == len(probes) - 1:
                    peak = max(peaks) if peaks else 0.0
                    print(f"[lab]   {cond}: {i+1}/{len(probes)}  peak_vram={peak:.1f}GB",
                          flush=True)
        print(f"[lab] wrote {out_file}", flush=True)

    print("\n[lab] DONE", flush=True)


if __name__ == "__main__":
    main()
