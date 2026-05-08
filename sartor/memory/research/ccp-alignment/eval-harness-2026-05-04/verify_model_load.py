#!/usr/bin/env python3
"""verify_model_load.py — sanity-check the model loads, runs one prompt.

Reports versions and any error so we know whether we need to upgrade
transformers, switch to a different base, etc.
"""

from __future__ import annotations

import sys
import time

MODEL_ID = "Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16"
PROMPT = "Briefly: who are you?"


def main() -> int:
    import torch
    print(f"torch: {torch.__version__}")
    print(f"cuda available: {torch.cuda.is_available()}")
    print(f"cuda device count: {torch.cuda.device_count()}")
    if torch.cuda.is_available():
        for i in range(torch.cuda.device_count()):
            print(f"  device {i}: {torch.cuda.get_device_name(i)} cap={torch.cuda.get_device_capability(i)}")

    import transformers
    print(f"transformers: {transformers.__version__}")
    try:
        import peft
        print(f"peft: {peft.__version__}")
    except ImportError:
        print("peft: not installed")
    try:
        import accelerate
        print(f"accelerate: {accelerate.__version__}")
    except ImportError:
        print("accelerate: not installed")

    print(f"\n=== loading {MODEL_ID} ===")
    t0 = time.time()
    from transformers import AutoModelForCausalLM, AutoTokenizer
    try:
        tok = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
        print(f"tokenizer loaded in {time.time()-t0:.1f}s")
    except Exception as e:
        print(f"TOKENIZER FAIL: {type(e).__name__}: {e}")
        return 1

    t1 = time.time()
    try:
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.bfloat16,
            device_map="auto",
            trust_remote_code=True,
        )
        print(f"model loaded in {time.time()-t1:.1f}s")
        print(f"device map: {getattr(model, 'hf_device_map', 'n/a')}")
    except Exception as e:
        print(f"MODEL FAIL: {type(e).__name__}: {e}")
        return 2

    print(f"\n=== one-shot generation ===")
    msgs = [{"role": "user", "content": PROMPT}]
    text = tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
    inputs = tok(text, return_tensors="pt").to(model.device)
    t2 = time.time()
    with torch.no_grad():
        ids = model.generate(
            **inputs,
            max_new_tokens=128,
            do_sample=False,
            pad_token_id=tok.eos_token_id,
        )
    gen = ids[0][inputs.input_ids.shape[1]:]
    resp = tok.decode(gen, skip_special_tokens=True)
    print(f"generation in {time.time()-t2:.1f}s")
    print(f"PROMPT: {PROMPT}")
    print(f"RESPONSE: {resp}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
