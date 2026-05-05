#!/bin/bash
# run_comparison.sh — Path C comparison runner.
# Runs the eval harness twice on the same probe set:
#   1. base model alone
#   2. base model + compact system prompt
# Then writes a side-by-side delta report.
#
# Usage:
#   bash run_comparison.sh <subject_id>
# Examples:
#   bash run_comparison.sh hf:Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16
#   bash run_comparison.sh hf:Qwen/Qwen2.5-3B-Instruct
#
# If $1 missing, defaults to the Qwen 35B abliterated.

set -u
SUBJECT="${1:-hf:Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16}"
ROOT="/home/alton/experiments/2026-05-04-finetune-loyalty"
OUT_DIR="$ROOT/eval/results"
LOG="$ROOT/logs/run_comparison.log"
PROBES="$ROOT/eval/probes.jsonl"
SYSPROMPT="$ROOT/corpus/system-prompt-compact.txt"

mkdir -p "$OUT_DIR"

LABEL=$(echo "$SUBJECT" | tr ':/' '__')

{
  echo "[$(date -Iseconds)] === Path C comparison for $SUBJECT ==="

  # Launch the rental watcher; signal both child runs on detection
  bash "$ROOT/scripts/rental_watcher.sh" &
  WATCHER_PID=$!
  echo "rental_watcher PID: $WATCHER_PID"

  echo "[$(date -Iseconds)] [1/2] BASE MODEL ALONE"
  "$ROOT/.venv/bin/python" "$ROOT/eval/score.py" \
    --subject "$SUBJECT" \
    --probes "$PROBES" \
    --out "$OUT_DIR/${LABEL}__bare.json" \
    --save-responses "$OUT_DIR/${LABEL}__bare.responses.jsonl"

  echo "[$(date -Iseconds)] [2/2] BASE MODEL + SYSTEM PROMPT"
  "$ROOT/.venv/bin/python" "$ROOT/eval/score.py" \
    --subject "$SUBJECT" \
    --probes "$PROBES" \
    --system-prompt-file "$SYSPROMPT" \
    --out "$OUT_DIR/${LABEL}__sysprompt.json" \
    --save-responses "$OUT_DIR/${LABEL}__sysprompt.responses.jsonl"

  echo "[$(date -Iseconds)] killing watcher"
  kill -TERM $WATCHER_PID 2>/dev/null || true

  echo "[$(date -Iseconds)] writing comparison report"
  "$ROOT/.venv/bin/python" "$ROOT/scripts/diff_results.py" \
    --bare "$OUT_DIR/${LABEL}__bare.json" \
    --sysprompt "$OUT_DIR/${LABEL}__sysprompt.json" \
    --out "$OUT_DIR/${LABEL}__comparison.md"

  echo "[$(date -Iseconds)] DONE"
} 2>&1 | tee -a "$LOG"
