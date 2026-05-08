#!/bin/bash
# Download Qwen 35B base model in background. Resumable.
set -u
cd /home/alton/experiments/2026-05-04-finetune-loyalty
source .venv/bin/activate
LOG=logs/hf-download.log
MODEL=Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16
{
  echo "[$(date -Iseconds)] start downloading $MODEL (no auth — public model)"
  hf download "$MODEL"
  echo "[$(date -Iseconds)] done; size:"
  du -sh ~/.cache/huggingface/hub/models--Youssofal--Qwen3.6-35B-A3B-Abliterated-Heretic-BF16/ 2>&1
} >> "$LOG" 2>&1
