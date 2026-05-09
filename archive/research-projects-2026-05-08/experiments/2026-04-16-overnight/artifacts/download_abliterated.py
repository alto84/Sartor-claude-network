"""Download huihui-ai/Qwen3-4B-abliterated to local HF cache. Idempotent."""
import os, sys, time
from huggingface_hub import snapshot_download

MODEL_ID = "huihui-ai/Qwen3-4B-abliterated"
t0 = time.time()
try:
    path = snapshot_download(
        repo_id=MODEL_ID,
        # Use default cache on C: (35GB free); 8GB fits
        allow_patterns=["*.json", "*.safetensors", "*.txt", "tokenizer*", "*.model"],
        ignore_patterns=["*.bin", "*.pt", "*.pth", "*.gguf", "*.ot", "onnx/*"],
    )
    dt = time.time() - t0
    total = 0
    for root, _, files in os.walk(path):
        for f in files:
            try:
                total += os.path.getsize(os.path.join(root, f))
            except OSError:
                pass
    print(f"[download] OK path={path} size={total/1e9:.2f}GB dt={dt:.1f}s")
except Exception as e:
    print(f"[download] FAIL {type(e).__name__}: {e}", file=sys.stderr)
    sys.exit(1)
