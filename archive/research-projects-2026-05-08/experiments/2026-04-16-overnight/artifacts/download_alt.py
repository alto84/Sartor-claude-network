"""Download a public CCP-uncensored variant as secondary comparison target."""
import os, sys, time
from huggingface_hub import snapshot_download

CANDIDATES = [
    "joaocarloscruz/Qwen3-4B-China-Uncensored-DPO",
    "OBLITERATUS/Qwen3-4B-OBLITERATED",
]

for mid in CANDIDATES:
    print(f"[download] trying {mid} ...", flush=True)
    t0 = time.time()
    try:
        path = snapshot_download(
            repo_id=mid,
            allow_patterns=["*.json", "*.safetensors", "*.txt", "tokenizer*", "*.model"],
            ignore_patterns=["*.bin", "*.pt", "*.pth", "*.gguf", "*.ot", "onnx/*"],
        )
        total = sum(
            os.path.getsize(os.path.join(r, f))
            for r, _, fs in os.walk(path) for f in fs
            if os.path.exists(os.path.join(r, f))
        )
        print(f"[download] OK {mid} path={path} size={total/1e9:.2f}GB dt={time.time()-t0:.1f}s", flush=True)
        break
    except Exception as e:
        print(f"[download] {mid} FAIL {type(e).__name__}: {e}", flush=True)
