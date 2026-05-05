#!/bin/bash
# Install full ML stack into the venv, then verify.
set -u
cd /home/alton/experiments/2026-05-04-finetune-loyalty
source .venv/bin/activate
LOG=logs/install_stack.log
{
  echo "[$(date -Iseconds)] start"
  # torch already installing in another shell; wait for it.
  while pgrep -f "pip install torch" >/dev/null 2>&1; do
    echo "[$(date -Iseconds)] waiting for torch install..."
    sleep 30
  done
  echo "[$(date -Iseconds)] torch step done; verifying"
  python -c "import torch; print('torch', torch.__version__, 'cuda', torch.cuda.is_available(), 'devs', torch.cuda.device_count())"
  echo "[$(date -Iseconds)] installing transformers stack"
  pip install transformers accelerate peft bitsandbytes datasets sentencepiece protobuf 2>&1 | tail -20
  echo "[$(date -Iseconds)] installing trl"
  pip install trl 2>&1 | tail -10
  echo "[$(date -Iseconds)] verifying"
  python -c "import torch, transformers, peft, accelerate, bitsandbytes, datasets, trl; print('OK', torch.__version__, transformers.__version__, peft.__version__, accelerate.__version__, bitsandbytes.__version__, datasets.__version__, trl.__version__)"
  echo "[$(date -Iseconds)] done"
} >> "$LOG" 2>&1
