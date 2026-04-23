#!/bin/bash
# Waits for model + dataset downloads to finish, then launches monitor and training.
# Designed to be run in a detached tmux session so it persists across SSH disconnects.
#
# Usage (on rtxpro6000server):
#   tmux new-session -d -s launcher 'bash ~/Sartor-claude-network/experiments/2026-04-22-overnight-training/launch-training.sh'

set -u
LOG=/home/alton/launch-training.log
TRAIN_DIR=/home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training

ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log() { echo "[$(ts)] $*" | tee -a "$LOG"; }

log "=== launcher start ==="
log "waiting for model + dataset downloads to complete..."
log "  (watching ~/downloads.log for 'ALL DONE' marker)"

while true; do
  if [[ -f /home/alton/downloads.log ]] && grep -q "ALL DONE" /home/alton/downloads.log; then
    log "downloads complete"
    break
  fi
  if ! tmux has-session -t dl 2>/dev/null; then
    log "WARN: tmux session 'dl' is gone but downloads.log has no ALL DONE yet"
    # Verify by file presence
    if [[ -f /home/alton/models/heretic-3.6-35b/config.json ]] && [[ $(ls /home/alton/models/heretic-3.6-35b/*.safetensors 2>/dev/null | wc -l) -ge 21 ]]; then
      log "model shards complete by file check (21+ safetensors + config.json present)"
      if [[ -d /home/alton/datasets/opus-reasoning-12k ]] && [[ $(ls /home/alton/datasets/opus-reasoning-12k 2>/dev/null | wc -l) -gt 0 ]]; then
        log "dataset dir populated; proceeding"
        break
      else
        log "model complete but dataset not; waiting"
      fi
    else
      log "model shards incomplete; downloads session died — aborting"
      exit 1
    fi
  fi
  sleep 30
done

log "=== starting monitor ==="
tmux kill-session -t monitor 2>/dev/null; true
tmux new-session -d -s monitor "bash $TRAIN_DIR/monitor.sh"
sleep 2
if tmux has-session -t monitor 2>/dev/null; then
  log "monitor session up"
else
  log "WARN: monitor session failed to start"
fi

log "=== starting training ==="
log "cmd: python $TRAIN_DIR/train.py"
tmux kill-session -t train 2>/dev/null; true
tmux new-session -d -s train "source /home/alton/ml/bin/activate && cd $TRAIN_DIR && python train.py 2>&1 | tee /home/alton/training.log"
sleep 5
if tmux has-session -t train 2>/dev/null; then
  log "training session up"
else
  log "FATAL: training session failed to start"
  exit 2
fi

log "=== 30 s post-launch status ==="
sleep 30
log "tmux sessions:"
tmux list-sessions 2>&1 | tee -a "$LOG"
log "nvidia-smi:"
nvidia-smi --query-gpu=index,temperature.gpu,power.draw,utilization.gpu,memory.used --format=csv 2>&1 | tee -a "$LOG"
log "training.log tail:"
tail -20 /home/alton/training.log 2>&1 | tee -a "$LOG"

log "=== launcher sleeping, re-checks every 10 min ==="
while true; do
  sleep 600
  if ! tmux has-session -t train 2>/dev/null; then
    log "training session has exited"
    log "final training.log tail:"
    tail -40 /home/alton/training.log 2>&1 | tee -a "$LOG"
    log "checking for LoRA adapter..."
    if [[ -d /home/alton/models/lora-sartor-v0.1/adapter_model.safetensors ]] || [[ -f /home/alton/models/lora-sartor-v0.1/adapter_model.safetensors ]]; then
      log "ADAPTER SAVED: /home/alton/models/lora-sartor-v0.1/"
    else
      log "WARNING: adapter not found at expected path"
    fi
    # Stop the monitor too
    tmux kill-session -t monitor 2>/dev/null; true
    log "=== launcher exit ==="
    exit 0
  fi
  log "training still running; nvidia-smi snapshot:"
  nvidia-smi --query-gpu=index,temperature.gpu,power.draw,utilization.gpu --format=csv,noheader | tee -a "$LOG"
done
