#!/bin/bash
# Wait for baseline to land, then run sysprompt comparison.
set -u
ROOT=/home/alton/experiments/2026-05-04-finetune-loyalty
BASELINE=$ROOT/eval/results/qwen35b__bare.json
SYSP=$ROOT/eval/results/qwen35b__sysprompt.json
LOG=$ROOT/logs/sysprompt.log

while [ ! -s "$BASELINE" ]; do sleep 30; done
echo "[$(date -Iseconds)] baseline ready, starting sysprompt run" >> "$LOG"

"$ROOT/.venv/bin/python" "$ROOT/eval/score.py" \
  --subject hf:Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16 \
  --probes "$ROOT/eval/probes.jsonl" \
  --system-prompt-file "$ROOT/corpus/system-prompt-compact.txt" \
  --out "$SYSP" \
  --save-responses "$ROOT/eval/results/qwen35b__sysprompt.responses.jsonl" \
  >> "$LOG" 2>&1

echo "[$(date -Iseconds)] sysprompt run done" >> "$LOG"

# Render diff
"$ROOT/.venv/bin/python" "$ROOT/scripts/diff_results.py" \
  --bare "$BASELINE" \
  --sysprompt "$SYSP" \
  --out "$ROOT/eval/results/qwen35b__comparison.md" \
  >> "$LOG" 2>&1

echo "[$(date -Iseconds)] comparison rendered" >> "$LOG"
