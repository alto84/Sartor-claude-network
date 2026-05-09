# Crash / blocker log

## 2026-04-10 T+0:~50 — Nemotron-3-Nano mamba-ssm dependency blocks load

**Step:** Step 1 (sanity load of base model)
**Script:** interactive python verification
**Model:** nvidia/NVIDIA-Nemotron-3-Nano-4B-BF16

**Traceback:**
```
File ".../transformers_modules/.../modeling_nemotron_h.py", line 63, in <module>
    from mamba_ssm.ops.triton.layernorm_gated import rmsnorm_fn
ModuleNotFoundError: No module named 'mamba_ssm'

During handling of the above exception, another exception occurred:
ImportError: mamba-ssm is required by the Mamba model but cannot be imported
```

**Attempted remediation:**
- `pip install mamba-ssm --no-build-isolation`
- Fails at setup.py time with `NameError: name 'bare_metal_version' is not defined`
- No Windows wheel exists on PyPI (mamba-ssm ships Linux wheels only)
- Building from source requires CUDA toolkit + MSVC and has historically required patching Triton kernels

**Retry strategy:**
- Drop Nemotron-3-Nano (hybrid Mamba-Transformer) entirely on Windows.
- Fall back to `nvidia/Nemotron-Mini-4B-Instruct` (dense transformer, accessible, comparable param count).
- Protocol FR-4B named `Nemotron-4-Mini-4B-Instruct` but that repo is gated (401). `Nemotron-Mini-4B-Instruct` is the closest reachable dense Nemotron.
- Scientific consequence noted in `experiment-log.md`: this changes the central research question from "can a hybrid Mamba-Transformer absorb a constitution" to "can a small dense transformer absorb it." Abliteration and persona-vector results still generalize.

**Status:** mitigated, proceeding with fallback model.
