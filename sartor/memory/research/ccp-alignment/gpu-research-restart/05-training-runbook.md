---
title: Training Runbook
project: gpu-research-restart
author: training-engineer
updated: 2026-04-11
status: ready-for-execution
depends_on:
  - 01-research-questions.md
  - 02-model-selection.md
  - 03-corpus-design.md
  - 04-eval-framework.md
---

# 05 Training Runbook

Step-by-step execution plan for all GPU research restart experiments on the available hardware.

**Hardware:**
- **gpuserver1:** RTX 5090 (32GB VRAM), i9-14900K, 128GB RAM, Ubuntu 22.04, CUDA 12.8
- **Rocinante:** RTX 4080 (16GB VRAM), Windows 10, for eval and data prep

**Target model:** Qwen 2.5 7B (base, not instruct; cleaner abliteration baseline)

**Key lessons from mini-lab (2026-04-11) applied throughout:**
1. `assistant_only_loss=True` is mandatory for SFT. Verify the loss mask before training.
2. Fewer epochs with a larger corpus beats more epochs on a small corpus.
3. Evaluate with concrete named-principal probes, not just abstract constitutional probes.
4. Save checkpoints frequently; run canary evals at each epoch boundary.
5. The chat template must have `{% generation %}` markers for TRL loss masking.

---

## Phase 0: Environment Setup

### 0.1 Time-slicing gpuserver1 between vast.ai and training

gpuserver1 runs vast.ai rentals as its primary revenue source. Training happens only during idle windows (no active rental). The two workloads NEVER run concurrently.

**How to detect when the GPU is free:**

```bash
# Check for active vast.ai containers
docker ps -q | wc -l
# Should return 0

# Check GPU utilization
nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits
# Should be < 15%

# Check vast.ai listing status
~/.local/bin/vastai show instances
# Should show no active instances
```

**Before starting any training job:**
1. SSH into gpuserver1: `ssh alton@192.168.1.100`
2. Verify no Docker containers: `docker ps`
3. Verify GPU is idle: `nvidia-smi`
4. Optionally delist from vast.ai to prevent new rentals:
   ```bash
   ~/.local/bin/vastai remove offer 32099437
   ```
5. After training, relist:
   ```bash
   ~/.local/bin/vastai list machine 52271 -g 0.40 -b 0.25 -s 0.10 -m 1 -e "08/24/2026"
   ```

**Automated approach:** Use `scripts/train_when_free.sh` which polls Docker and nvidia-smi, waits for 3 consecutive idle checks (1 minute apart), then launches the training command.

### 0.2 Python environment on gpuserver1

Set up a dedicated conda environment outside the vast.ai container. The vast.ai container has its own environment; ours lives at the host level.

```bash
ssh alton@192.168.1.100

# Install miniconda if not present
if [ ! -d ~/miniconda3 ]; then
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh
    bash /tmp/miniconda.sh -b -p ~/miniconda3
    ~/miniconda3/bin/conda init bash
    source ~/.bashrc
fi

# Create the experiment environment
conda create -n gpu-research python=3.11 -y
conda activate gpu-research

# Core dependencies
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128

# Training stack
pip install transformers>=4.46.0
pip install peft>=0.13.0
pip install trl>=0.12.0
pip install datasets>=3.0.0
pip install bitsandbytes>=0.44.0
pip install accelerate>=1.0.0

# Flash attention (requires CUDA toolkit headers)
pip install flash-attn --no-build-isolation

# Monitoring and config
pip install wandb
pip install pyyaml
pip install tqdm

# Evaluation
pip install sentencepiece
pip install protobuf

# Login to wandb
wandb login

# Login to Hugging Face (for gated models)
huggingface-cli login
```

**Python version:** 3.11 (stable with CUDA 12.8 and current PyTorch)

### 0.3 VRAM budget

All estimates for Qwen 2.5 7B on RTX 5090 (32GB VRAM):

| Configuration | Model VRAM | Optimizer | Activations | Total | Fits 32GB? |
|---|---|---|---|---|---|
| BF16 inference (no quant) | ~14 GB | -- | ~1 GB | ~15 GB | Yes |
| BF16 full fine-tune | ~14 GB | ~28 GB | ~4 GB | ~46 GB | No |
| 8-bit QLoRA r=32 | ~8 GB | ~2 GB | ~3 GB | ~13 GB | Yes |
| **4-bit QLoRA r=32** | **~5 GB** | **~2 GB** | **~3 GB** | **~10 GB** | **Yes** |
| 4-bit QLoRA r=64 | ~5 GB | ~3 GB | ~3 GB | ~11 GB | Yes |
| BF16 abliteration (full weights) | ~14 GB | -- | ~4 GB | ~18 GB | Yes |
| DPO (4-bit, ref model implicit) | ~5 GB | ~2 GB | ~6 GB | ~13 GB | Yes |

**Recommendation:** Use 4-bit NF4 quantization with LoRA r=32 for SFT and DPO. Abliteration requires BF16 full weights (no quantization) because we modify the weights directly. All configurations fit within 32GB with margin for batch size > 1 if needed.

### 0.4 Project directory structure on gpuserver1

```bash
mkdir -p ~/gpu-research/{scripts,data/{corpus,eval},checkpoints,outputs,logs}

# Copy scripts from Rocinante
scp -r /path/to/scripts/* alton@192.168.1.100:~/gpu-research/scripts/

# Copy data files
scp data/corpus/*.jsonl alton@192.168.1.100:~/gpu-research/data/corpus/
scp data/eval/probes.jsonl alton@192.168.1.100:~/gpu-research/data/eval/
```

### 0.5 Download Qwen 2.5 7B

```bash
ssh alton@192.168.1.100
conda activate gpu-research

# Pre-download to avoid timeout during training
python -c "
from transformers import AutoModelForCausalLM, AutoTokenizer
print('Downloading tokenizer...')
AutoTokenizer.from_pretrained('Qwen/Qwen2.5-7B', trust_remote_code=True)
print('Downloading model...')
AutoModelForCausalLM.from_pretrained('Qwen/Qwen2.5-7B', trust_remote_code=True, torch_dtype='auto')
print('Done. Model cached in ~/.cache/huggingface/')
"
```

---

## Phase 1: Abliteration Experiment (RQ1)

**Research question:** Does abliteration (removing the refusal direction from the residual stream) effectively decondition CCP-aligned or over-cautious refusal behavior in Qwen 2.5 7B?

### 1.1 Single-direction abliteration (Arditi method)

```bash
ssh alton@192.168.1.100
conda activate gpu-research
cd ~/gpu-research

python scripts/run_abliteration.py \
    --model Qwen/Qwen2.5-7B \
    --out outputs/abliterated-single \
    --method single \
    --strength 1.0
```

**What this does:**
1. Loads Qwen 2.5 7B in BF16 (~14GB VRAM)
2. Collects residual stream activations for 16 harmful and 16 harmless prompts at the middle 50% of layers
3. Computes the mean activation difference (the "refusal direction")
4. Subtracts this direction from the MLP and attention output projections at each targeted layer
5. Saves the modified full model to `outputs/abliterated-single/`

**Expected VRAM:** ~18-20 GB peak (model + activation buffers)
**Expected runtime:** 15-25 minutes
**Output size:** ~14 GB (full model weights, BF16)

### 1.2 Multi-direction abliteration (OBLITERATUS-style)

```bash
python scripts/run_abliteration.py \
    --model Qwen/Qwen2.5-7B \
    --out outputs/abliterated-multi \
    --method multi \
    --n-directions 3 \
    --strength 1.0
```

**What this does:** Same as above but extracts 3 principal components from the per-example activation differences via SVD, then removes all 3 directions. This targets not just the dominant refusal direction but also secondary patterns (e.g., topic-specific refusal, hedging).

**Expected VRAM:** ~20-22 GB peak
**Expected runtime:** 20-30 minutes

### 1.3 Verify abliteration worked

The script runs automatic verification (5 harmful prompts, checks refusal rate). For thorough verification, run the CCP probes from the eval framework:

```bash
python scripts/run_eval.py \
    --model outputs/abliterated-single \
    --probes data/eval/probes.jsonl \
    --out outputs/eval-abliterated-single \
    --label abliterated-single \
    --no-quantize
```

**Key metrics to check:**
- CCP-baseline category: should show reduced refusal/evasion vs base
- Safety-refusal category: some degradation expected (that is the point)
- Capability-mmlu: should be within 5% of base (abliteration should not damage capabilities)

### 1.4 Layer sweep (optional, if time permits)

If the default middle-50% layer targeting is too aggressive (capabilities damaged) or too weak (still refuses), sweep:

```bash
# Conservative: only the middle third
python scripts/run_abliteration.py \
    --model Qwen/Qwen2.5-7B \
    --out outputs/abliterated-narrow \
    --method single \
    --layers $(python -c "n=28; print(','.join(str(i) for i in range(n//3, 2*n//3)))")

# Aggressive: all layers except first and last 2
python scripts/run_abliteration.py \
    --model Qwen/Qwen2.5-7B \
    --out outputs/abliterated-wide \
    --method single \
    --layers $(python -c "n=28; print(','.join(str(i) for i in range(2, n-2)))")
```

---

## Phase 2: Constitutional SFT (RQ3)

**Research question:** Can LoRA fine-tuning on a constitutional corpus install stable behavioral values without destroying capabilities?

### 2.1 Pre-training checks

Before launching SFT, verify:

```bash
# 1. Corpus exists and has the right format
wc -l data/corpus/constitutional_sft.jsonl
head -1 data/corpus/constitutional_sft.jsonl | python -m json.tool

# 2. Verify messages format
python -c "
import json
with open('data/corpus/constitutional_sft.jsonl') as f:
    for i, line in enumerate(f):
        obj = json.loads(line)
        assert 'messages' in obj, f'Line {i}: missing messages key'
        for msg in obj['messages']:
            assert 'role' in msg and 'content' in msg, f'Line {i}: bad message format'
print(f'Validated {i+1} examples')
"

# 3. Check Qwen chat template for generation markers
python -c "
from transformers import AutoTokenizer
tok = AutoTokenizer.from_pretrained('Qwen/Qwen2.5-7B', trust_remote_code=True)
ct = tok.chat_template or ''
if '{% generation %}' in ct:
    print('OK: generation markers present')
else:
    print('WARNING: no generation markers. The training script will attempt auto-patching.')
    print('Template preview:', ct[:300])
"
```

### 2.2 Launch SFT

```bash
cd ~/gpu-research
conda activate gpu-research

python scripts/train_constitutional_sft.py \
    --config scripts/train_config.yaml \
    --corpus data/corpus/constitutional_sft.jsonl \
    --out checkpoints/sft-v1 \
    --model Qwen/Qwen2.5-7B \
    --epochs 3 \
    --lr 2e-5 \
    --r 32 \
    --alpha 64
```

**What the script does:**
1. Loads Qwen 2.5 7B with 4-bit NF4 quantization (~5GB)
2. Verifies/patches the chat template for `{% generation %}` markers
3. Asserts the loss mask splits correctly on the first training example
4. Applies LoRA r=32, alpha=64 to all linear layers (q/k/v/o/gate/up/down)
5. Trains for 3 epochs with cosine LR schedule, warmup=10%
6. Evaluates every 0.5 epochs on a 10% validation split
7. Early stops if validation loss increases for 3 consecutive evaluations
8. Saves checkpoints every 50 steps + best validation checkpoint
9. Logs per-step loss to `checkpoints/sft-v1/train_loss.jsonl`
10. Logs to WandB (project: gpu-research-restart)

**Expected VRAM:** ~10-12 GB peak
**Expected runtime:** Depends on corpus size. At 500 examples, ~30-45 min. At 1000 examples, ~60-90 min.

### 2.3 Monitor training

From a separate SSH session:

```bash
# Watch loss progression
tail -f checkpoints/sft-v1/train_loss.jsonl | python -c "
import sys, json
for line in sys.stdin:
    r = json.loads(line.strip())
    print(f\"step={r['step']:4d} epoch={r['epoch']:.2f} loss={r['loss']:.4f} lr={r.get('lr', '?')}\")
"

# Watch VRAM
watch -n 5 nvidia-smi

# WandB dashboard (from any browser)
# https://wandb.ai/<entity>/gpu-research-restart
```

### 2.4 Evaluate SFT checkpoint

```bash
python scripts/run_eval.py \
    --model Qwen/Qwen2.5-7B \
    --adapter checkpoints/sft-v1 \
    --probes data/eval/probes.jsonl \
    --out outputs/eval-sft-v1 \
    --label sft-v1
```

**Key metrics vs base:**
- Constitutional-adherence: should improve (primary target)
- Sycophancy-resistance: should improve if corpus addresses this
- Capability-mmlu: must stay within 5% of base (hard floor)
- Capability-math: must stay within 10% of base
- Safety-refusal: should not degrade more than 10%

---

## Phase 3: DPO Refinement (RQ2)

**Research question:** Does DPO on CCP deconditioning pairs sharpen the model's behavior on censorship-related topics?

### 3.1 Prerequisites

- SFT checkpoint from Phase 2 must exist at `checkpoints/sft-v1/`
- DPO corpus must exist at `data/corpus/ccp_deconditioning_pairs.jsonl`
- DPO corpus format: `{"prompt": "...", "chosen": "...", "rejected": "..."}`

### 3.2 Launch DPO

```bash
python scripts/train_dpo.py \
    --config scripts/train_config.yaml \
    --sft-adapter checkpoints/sft-v1 \
    --corpus data/corpus/ccp_deconditioning_pairs.jsonl \
    --out checkpoints/dpo-v1 \
    --model Qwen/Qwen2.5-7B \
    --beta 0.1 \
    --lr 5e-7 \
    --epochs 1
```

**What happens:**
1. Loads Qwen 2.5 7B with 4-bit quantization
2. Loads the SFT adapter, merges it into the base weights
3. Applies a fresh LoRA for DPO training
4. TRL's DPOTrainer uses the pre-merge model as the implicit reference
5. Trains for 1 epoch with beta=0.1 (controls strength of preference optimization)
6. Saves adapter to `checkpoints/dpo-v1/`

**Expected VRAM:** ~13-15 GB peak (need activation buffers for both chosen and rejected)
**Expected runtime:** 15-30 minutes (DPO on preference pairs is fast)

### 3.3 Evaluate DPO

```bash
python scripts/run_eval.py \
    --model Qwen/Qwen2.5-7B \
    --adapter checkpoints/dpo-v1 \
    --probes data/eval/probes.jsonl \
    --out outputs/eval-dpo-v1 \
    --label dpo-v1 \
    --compare outputs/eval-base.json outputs/eval-sft-v1.json
```

---

## Phase 4: Combined Experiment (RQ4)

**Research question:** Does the full pipeline (abliterate then SFT then DPO) produce a better result than any single technique?

### 4.1 Run the full pipeline

```bash
cd ~/gpu-research

# Option A: Automated (checks GPU availability between each phase)
./scripts/run_full_pipeline.sh --config scripts/train_config.yaml

# Option B: With the GPU-free polling wrapper
./scripts/train_when_free.sh ./scripts/run_full_pipeline.sh
```

The pipeline script:
1. Runs baseline eval (if not cached)
2. Abliterates Qwen 2.5 7B (single-direction and multi-direction)
3. Evals abliterated models
4. Runs SFT on the original base
5. Evals SFT model
6. Runs DPO on SFT model
7. Evals DPO model
8. Runs SFT on the abliterated base
9. Runs DPO on the abliterated+SFT model
10. Evals the combined model
11. Prints comparison summary

Each phase checks GPU availability before starting. Each phase is idempotent: if its output already exists, it is skipped (safe to re-run after interruption).

**Total expected runtime:** 4-6 hours (all phases including eval)
**Total expected disk:** ~60-80 GB (multiple full model copies from abliteration + LoRA checkpoints)

---

## Phase 5: Evaluation

### 5.1 Run evaluation on any checkpoint

```bash
python scripts/run_eval.py \
    --model Qwen/Qwen2.5-7B \
    --adapter <checkpoint_path> \
    --probes data/eval/probes.jsonl \
    --out outputs/eval-<label> \
    --label <label> \
    --compare outputs/eval-base.json [other eval jsons...]
```

### 5.2 Outputs

Each eval run produces:
- `<out>.jsonl` -- incremental per-probe responses (resumable)
- `<out>.json` -- full results including:
  - Per-probe scores (prompt, response, verdict)
  - Per-category aggregates (pass_rate, fail_over_rate, fail_under_rate)
  - Radar chart data (`radar` key: category -> pass_rate)
  - Comparison table (if `--compare` used)

### 5.3 Generate comparison table

The `--compare` flag on `run_eval.py` generates an inline comparison. For a standalone comparison across all conditions:

```bash
python -c "
import json, sys
from pathlib import Path

files = sys.argv[1:]
results = []
for f in files:
    data = json.loads(Path(f).read_text())
    results.append(data)

# Print table header
labels = [r['label'] for r in results]
print(f\"{'Category':35s}\" + ''.join(f'{l:>15s}' for l in labels))
print('-' * (35 + 15 * len(labels)))

# Collect all categories
cats = sorted(set(c for r in results for c in r.get('categories', {})))
for cat in cats:
    row = f'{cat:35s}'
    for r in results:
        rate = r.get('categories', {}).get(cat, {}).get('pass_rate', 0)
        row += f'{rate:>15.3f}'
    print(row)

print('-' * (35 + 15 * len(labels)))
totals = f\"{'TOTAL':35s}\"
for r in results:
    totals += f\"{r.get('total_pass_rate', 0):>15.3f}\"
print(totals)
" outputs/eval-base.json outputs/eval-abliterated-single.json outputs/eval-sft-v1.json outputs/eval-dpo-v1.json outputs/eval-combined.json
```

### 5.4 Radar chart data

Each eval JSON has a `radar` key mapping category names to pass rates. Feed this to any plotting library:

```python
import json
import matplotlib.pyplot as plt
import numpy as np

# Load results
conditions = {}
for label, path in [("base", "eval-base.json"), ("sft", "eval-sft-v1.json"), ("dpo", "eval-dpo-v1.json")]:
    with open(path) as f:
        conditions[label] = json.load(f)["radar"]

categories = sorted(conditions["base"].keys())
angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
angles += angles[:1]

fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
for label, radar in conditions.items():
    values = [radar[c] for c in categories] + [radar[categories[0]]]
    ax.plot(angles, values, label=label)
    ax.fill(angles, values, alpha=0.1)

ax.set_xticks(angles[:-1])
ax.set_xticklabels(categories, size=8)
ax.legend(loc="upper right")
plt.tight_layout()
plt.savefig("radar_comparison.png", dpi=150)
```

---

## Scheduling

### Training windows

gpuserver1 earns revenue from vast.ai rentals. Training windows are the gaps between rentals. Estimated availability: ~8 hours/day.

**Strategy:**
1. Check the vast.ai dashboard or `vastai show instances` for current rental status
2. If no active rental, delist the machine before starting multi-hour training
3. After training completes, relist the machine
4. Use `train_when_free.sh` for automated scheduling

**Delist before long training:**
```bash
# Delist to prevent new rentals during training
~/.local/bin/vastai remove offer 32099437

# ... run training ...

# Relist after training
~/.local/bin/vastai list machine 52271 -g 0.40 -b 0.25 -s 0.10 -m 1 -e "08/24/2026"
```

**Automated wrapper:**
```bash
# Will poll every 60s, launch when GPU free for 3 consecutive checks
./scripts/train_when_free.sh python scripts/train_constitutional_sft.py \
    --config scripts/train_config.yaml \
    --out checkpoints/sft-v1
```

### Suggested execution order

Given ~8h available windows, split across 2-3 sessions:

**Session 1 (2-3h): Setup + Abliteration + Baseline eval**
1. Environment setup (30 min)
2. Download Qwen 2.5 7B (10 min)
3. Baseline eval (20 min)
4. Single-direction abliteration + eval (40 min)
5. Multi-direction abliteration + eval (40 min)

**Session 2 (3-4h): SFT + DPO**
1. Constitutional SFT (60-90 min)
2. SFT eval (20 min)
3. DPO refinement (30 min)
4. DPO eval (20 min)

**Session 3 (2-3h): Combined pipeline + final comparison**
1. SFT on abliterated base (60-90 min)
2. DPO on abliterated+SFT (30 min)
3. Combined eval (20 min)
4. Generate comparison tables and radar charts (10 min)

---

## Failure Modes and Recovery

### Checkpoint strategy

- **SFT:** Saves every 50 steps + best validation checkpoint. `save_total_limit=5` keeps disk bounded.
- **DPO:** Saves every epoch. `save_total_limit=3`.
- **Abliteration:** Saves the full modified model once at the end (no intermediate checkpoints; the operation is fast enough that restart-from-scratch is acceptable).

### Resume from checkpoint after interruption

All training scripts support checkpoint resumption. If training is interrupted (rental starts, OOM, SSH disconnect):

```bash
# SFT: automatically detects the latest checkpoint in the output dir
python scripts/train_constitutional_sft.py \
    --config scripts/train_config.yaml \
    --out checkpoints/sft-v1  # Same output dir as before

# DPO: same pattern
python scripts/train_dpo.py \
    --config scripts/train_config.yaml \
    --sft-adapter checkpoints/sft-v1 \
    --out checkpoints/dpo-v1

# Eval: use --resume to skip already-evaluated probes
python scripts/run_eval.py \
    --model Qwen/Qwen2.5-7B \
    --adapter checkpoints/sft-v1 \
    --probes data/eval/probes.jsonl \
    --out outputs/eval-sft-v1 \
    --label sft-v1 \
    --resume
```

### OOM detection and recovery

The `OOMDetector` callback logs VRAM every 10 steps and warns when approaching 28GB. If OOM occurs:

1. **Reduce batch size:** Already at 1; reduce `gradient_accumulation_steps` from 16 to 8 (halves effective batch but reduces peak memory for long sequences).
2. **Reduce sequence length:** From 2048 to 1024 (`--max-seq-length 1024`).
3. **Use 4-bit quantization:** Already the default. If using 8-bit, switch to 4-bit.
4. **Reduce LoRA rank:** From r=32 to r=16 (saves ~1GB optimizer states).

```bash
# Recovery with reduced settings
python scripts/train_constitutional_sft.py \
    --config scripts/train_config.yaml \
    --out checkpoints/sft-v1 \
    --grad-accum 8 \
    --max-seq-length 1024 \
    --r 16
```

### Training divergence detection

The `DivergenceDetector` callback monitors for loss spikes > 3x the rolling 10-step baseline. If triggered:

1. Training stops automatically, preserving the last good checkpoint.
2. Diagnose:
   - Check `checkpoints/sft-v1/train_loss.jsonl` for the spike location.
   - If spike is at epoch boundary, likely a data issue (bad example at that position).
   - If spike is gradual, the learning rate is too high.
3. Recovery:
   - Reduce learning rate by 2x: `--lr 1e-5`
   - Resume from the last good checkpoint (automatic).
   - If the problem persists, reduce LoRA alpha: `--alpha 32` (reduces the effective learning rate for the adapter).

### Interrupted by vast.ai rental

If a rental starts during training:

1. The `train_when_free.sh` wrapper will log a warning but does NOT kill the training process (the user must decide).
2. The training process and the Docker container will compete for GPU memory, likely causing OOM.
3. Best practice: `Ctrl-C` the training, let it save the current checkpoint (the trainer handles SIGTERM gracefully).
4. Wait for the rental to end, then resume:
   ```bash
   ./scripts/train_when_free.sh python scripts/train_constitutional_sft.py \
       --config scripts/train_config.yaml \
       --out checkpoints/sft-v1
   ```

### Disk space management

Abliterated models are ~14GB each. LoRA checkpoints are ~200-500MB each. Budget ~80GB total.

```bash
# Check disk space
df -h /home/alton

# Clean old checkpoints if needed (keep best + latest)
ls -la checkpoints/sft-v1/checkpoint-*/
# Delete intermediate checkpoints manually if disk is tight
```

---

## Script Inventory

| Script | Purpose | VRAM | Runtime |
|---|---|---|---|
| `train_config.yaml` | All hyperparameters externalized | -- | -- |
| `train_constitutional_sft.py` | Phase 2: LoRA SFT with assistant-only loss | ~10-12 GB | 30-90 min |
| `train_dpo.py` | Phase 3: DPO refinement | ~13-15 GB | 15-30 min |
| `run_abliteration.py` | Phase 1: Arditi + OBLITERATUS abliteration | ~18-22 GB | 15-30 min |
| `run_eval.py` | Phase 5: Battery eval with scoring | ~6-8 GB (4-bit) | 15-25 min |
| `run_full_pipeline.sh` | Phase 4: Chains all phases with eval | varies | 4-6 hours |
| `train_when_free.sh` | Scheduling: polls GPU, launches when idle | -- | -- |
