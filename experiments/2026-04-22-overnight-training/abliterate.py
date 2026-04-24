#!/usr/bin/env python
"""
Abliteration from scratch — Track B of the 2026-04-24 overnight science plan.

Identifies a direction in activation space via contrastive prompts, then
either orthogonalizes weights against it (standard abliteration) or injects
it scaled into the residual stream at inference (activation steering /
reverse abliteration).

Reference: NousResearch/llm-abliteration, mlabonne's HF blog post, arxiv
2512.13655 comparative analysis.

Usage:
  # Extract direction only (no weight modification):
  python abliterate.py extract-direction \\
      --model-path ~/models/qwen3.6-35b-a3b-abliterated-heretic \\
      --positive-prompts probes/steward-positive.txt \\
      --negative-prompts probes/steward-negative.txt \\
      --output track-B-abliteration/steward-direction.pt \\
      --layer-sweep

  # Apply orthogonalization (standard abliteration):
  python abliterate.py orthogonalize \\
      --model-path ~/models/qwen3.6-35b-a3b-heretic \\
      --direction track-B-abliteration/refusal-direction.pt \\
      --output ~/models/qwen3.6-35b-a3b-our-abliteration

  # Run model with inference-time steering (activation steering):
  python abliterate.py steer-inference \\
      --model-path ~/models/qwen3.6-35b-a3b-abliterated-heretic \\
      --direction track-B-abliteration/steward-direction.pt \\
      --coefficient 1.5 \\
      --prompts probes/test-prompts.txt \\
      --output track-E-activation-steering/outputs-coef1.5.jsonl

This is a first-pass implementation optimized for the Qwen 3.6 hybrid
attention+SSM MoE architecture. Not yet battle-tested. Expect iteration.
"""

import argparse
import json
import os
import sys
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer


def load_model_and_tokenizer(path, dtype=torch.bfloat16):
    """Load Qwen 3.6 model + tokenizer with device_map='auto'."""
    tok = AutoTokenizer.from_pretrained(path, trust_remote_code=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    print(f"[abliterate] loading model from {path} (bf16, device_map=auto)...")
    model = AutoModelForCausalLM.from_pretrained(
        path,
        torch_dtype=dtype,
        device_map="auto",
        trust_remote_code=True,
        low_cpu_mem_usage=True,
    )
    model.eval()
    return model, tok


def get_residual_stream_activations(model, tokenizer, prompts, layers=None, max_new_tokens=0):
    """Run prompts through model, collect residual stream activations at chosen layers.

    Returns: dict[layer_idx -> tensor of shape (n_prompts, hidden_dim)]
    by averaging over the last-token position.
    """
    if layers is None:
        # Default to all decoder layers
        n_layers = model.config.num_hidden_layers
        layers = list(range(n_layers))

    hidden_dim = model.config.hidden_size
    activations = {l: [] for l in layers}

    # Register hooks on residual stream output per chosen layer
    hook_handles = []

    def make_hook(layer_idx):
        def hook(module, input, output):
            # residual stream output is typically output[0] for decoder layers
            if isinstance(output, tuple):
                h = output[0]
            else:
                h = output
            # Take last non-pad token activation
            activations[layer_idx].append(h[:, -1, :].detach().float().cpu())
        return hook

    # Find the decoder layers — varies by architecture
    decoder_layers = _find_decoder_layers(model)
    for i, layer_idx in enumerate(layers):
        if layer_idx < len(decoder_layers):
            h = decoder_layers[layer_idx].register_forward_hook(make_hook(layer_idx))
            hook_handles.append(h)

    try:
        with torch.no_grad():
            for i, prompt in enumerate(prompts):
                print(f"[abliterate] extracting activations for prompt {i+1}/{len(prompts)}", flush=True)
                inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)
                inputs = {k: v.to(model.device) for k, v in inputs.items()}
                _ = model(**inputs)
    finally:
        for h in hook_handles:
            h.remove()

    # Stack per layer
    result = {}
    for layer_idx, lst in activations.items():
        if lst:
            result[layer_idx] = torch.cat(lst, dim=0)
    return result


def _find_decoder_layers(model):
    """Find the list of decoder layer modules — varies by architecture name."""
    # Common paths for Qwen / Llama / Mistral
    candidates = [
        "model.layers",
        "model.model.layers",
        "transformer.h",
        "gpt_neox.layers",
    ]
    for path in candidates:
        obj = model
        for part in path.split("."):
            obj = getattr(obj, part, None)
            if obj is None:
                break
        if obj is not None and hasattr(obj, "__len__"):
            return list(obj)
    raise ValueError("Could not find decoder layers. Inspect model.named_modules() manually.")


def extract_direction(model, tokenizer, positive_prompts, negative_prompts, layer_sweep=False):
    """Mean-of-differences direction extraction.

    direction[layer] = normalize( mean_pos_activation[layer] - mean_neg_activation[layer] )
    """
    n_layers = model.config.num_hidden_layers
    if layer_sweep:
        layers = list(range(n_layers))
    else:
        # Heuristic: middle layers tend to have strongest signal
        layers = list(range(n_layers // 4, 3 * n_layers // 4))

    print(f"[abliterate] extracting activations for {len(positive_prompts)} positive prompts...")
    pos_acts = get_residual_stream_activations(model, tokenizer, positive_prompts, layers=layers)
    print(f"[abliterate] extracting activations for {len(negative_prompts)} negative prompts...")
    neg_acts = get_residual_stream_activations(model, tokenizer, negative_prompts, layers=layers)

    directions = {}
    for layer_idx in layers:
        if layer_idx not in pos_acts or layer_idx not in neg_acts:
            continue
        p_mean = pos_acts[layer_idx].mean(dim=0)
        n_mean = neg_acts[layer_idx].mean(dim=0)
        diff = p_mean - n_mean
        norm = diff.norm()
        if norm > 0:
            directions[layer_idx] = diff / norm
        else:
            directions[layer_idx] = diff

    # Score each layer by signal quality: |diff| / (|p_std| + |n_std|)
    scores = {}
    for layer_idx in directions:
        p_std = pos_acts[layer_idx].std(dim=0).mean()
        n_std = neg_acts[layer_idx].std(dim=0).mean()
        diff_mag = (pos_acts[layer_idx].mean(dim=0) - neg_acts[layer_idx].mean(dim=0)).norm()
        if p_std + n_std > 0:
            scores[layer_idx] = float(diff_mag / (p_std + n_std))
        else:
            scores[layer_idx] = 0.0

    best_layer = max(scores, key=scores.get)
    print(f"[abliterate] layer scores (higher = better signal):")
    for l in sorted(scores):
        marker = "  <- best" if l == best_layer else ""
        print(f"  layer {l:3d}: {scores[l]:.4f}{marker}")

    return {
        "directions": directions,
        "scores": scores,
        "best_layer": best_layer,
    }


def orthogonalize_weights(model, direction, layer_idx=None):
    """Project direction out of every weight matrix that writes to the residual stream.

    For Qwen-like architectures, the weights that write to residual are:
    - embed_tokens
    - attention.o_proj
    - mlp.down_proj (and expert variants for MoE)
    """
    direction = direction.to(model.device).to(torch.bfloat16)
    direction = direction / direction.norm()

    # Compute projector P = I - d d^T
    # For each weight W of shape (out_dim, in_dim) writing to residual:
    # W_new = W - direction @ (direction^T @ W)
    # which projects out the direction from the output

    modified = 0
    with torch.no_grad():
        for name, module in model.named_modules():
            # Target output projections
            is_target = (
                "o_proj" in name or
                "down_proj" in name or
                (name.endswith("embed_tokens"))
            )
            if not is_target:
                continue
            if not hasattr(module, "weight"):
                continue
            W = module.weight.data
            # W is (out, in); we want to project output direction out
            # direction is (hidden,); ensure shape matches W's output dim
            if W.shape[0] != direction.shape[0]:
                continue
            proj = direction @ W  # (in,)
            W_new = W - torch.outer(direction, proj)
            module.weight.data = W_new.to(W.dtype)
            modified += 1
    print(f"[abliterate] orthogonalized {modified} weight matrices")


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    p_extract = sub.add_parser("extract-direction")
    p_extract.add_argument("--model-path", required=True)
    p_extract.add_argument("--positive-prompts", required=True,
                           help="text file, one prompt per line (refusal-inducing or behavior-target)")
    p_extract.add_argument("--negative-prompts", required=True,
                           help="text file, one prompt per line (harmless control)")
    p_extract.add_argument("--output", required=True)
    p_extract.add_argument("--layer-sweep", action="store_true")

    p_ortho = sub.add_parser("orthogonalize")
    p_ortho.add_argument("--model-path", required=True)
    p_ortho.add_argument("--direction", required=True)
    p_ortho.add_argument("--layer-idx", type=int, default=None)
    p_ortho.add_argument("--output", required=True)

    p_steer = sub.add_parser("steer-inference")
    p_steer.add_argument("--model-path", required=True)
    p_steer.add_argument("--direction", required=True)
    p_steer.add_argument("--coefficient", type=float, default=1.0)
    p_steer.add_argument("--prompts", required=True)
    p_steer.add_argument("--output", required=True)

    args = parser.parse_args()

    if args.command == "extract-direction":
        model, tok = load_model_and_tokenizer(args.model_path)
        pos = [l.strip() for l in open(args.positive_prompts) if l.strip()]
        neg = [l.strip() for l in open(args.negative_prompts) if l.strip()]
        result = extract_direction(model, tok, pos, neg, layer_sweep=args.layer_sweep)
        os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
        torch.save(result, args.output)
        print(f"[abliterate] saved direction + scores to {args.output}")
        print(f"[abliterate] best layer: {result['best_layer']}")

    elif args.command == "orthogonalize":
        model, tok = load_model_and_tokenizer(args.model_path)
        d = torch.load(args.direction)
        layer_idx = args.layer_idx if args.layer_idx is not None else d["best_layer"]
        direction = d["directions"][layer_idx]
        orthogonalize_weights(model, direction)
        os.makedirs(args.output, exist_ok=True)
        model.save_pretrained(args.output, safe_serialization=True)
        tok.save_pretrained(args.output)
        print(f"[abliterate] saved orthogonalized model to {args.output}")

    elif args.command == "steer-inference":
        model, tok = load_model_and_tokenizer(args.model_path)
        d = torch.load(args.direction)
        layer_idx = d["best_layer"]
        direction = d["directions"][layer_idx].to(model.device).to(torch.bfloat16)

        decoder_layers = _find_decoder_layers(model)

        def steering_hook(module, input, output):
            if isinstance(output, tuple):
                h = output[0]
                h = h + args.coefficient * direction
                return (h,) + output[1:]
            else:
                return output + args.coefficient * direction

        decoder_layers[layer_idx].register_forward_hook(steering_hook)

        prompts = [l.strip() for l in open(args.prompts) if l.strip()]
        os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
        with open(args.output, "w") as f:
            for i, p in enumerate(prompts):
                print(f"[abliterate] steering prompt {i+1}/{len(prompts)}", flush=True)
                inputs = tok(p, return_tensors="pt").to(model.device)
                with torch.no_grad():
                    out = model.generate(**inputs, max_new_tokens=400, temperature=0.7, do_sample=True)
                text = tok.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
                f.write(json.dumps({"prompt": p, "response": text, "coefficient": args.coefficient, "layer": layer_idx}) + "\n")
        print(f"[abliterate] wrote steered outputs to {args.output}")


if __name__ == "__main__":
    main()
