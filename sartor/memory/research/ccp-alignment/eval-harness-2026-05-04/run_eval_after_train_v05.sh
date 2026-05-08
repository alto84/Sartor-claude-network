#!/bin/bash
# Wait for v0.5 LoRA to land, then eval and render diffs against bare + v0.3-LoRA + sysprompt.
set -u
ROOT=/home/alton/experiments/2026-05-04-finetune-loyalty
ADAPTER=$ROOT/runs/lora-r64-attn-only-v05/adapter-final
LORA_RESULTS=$ROOT/eval/results/qwen35b__lora-v05.json
LOG=$ROOT/logs/lora-eval-v05.log

while [ ! -d "$ADAPTER" ]; do sleep 30; done
sleep 30  # let trainer flush

echo "[$(date -Iseconds)] adapter at $ADAPTER, starting v0.5 LoRA eval" >> "$LOG"

"$ROOT/.venv/bin/python" "$ROOT/eval/score.py" \
  --subject hf:Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16 \
  --adapter-path "$ADAPTER" \
  --probes "$ROOT/eval/probes.jsonl" \
  --out "$LORA_RESULTS" \
  --save-responses "$ROOT/eval/results/qwen35b__lora-v05.responses.jsonl" \
  >> "$LOG" 2>&1

echo "[$(date -Iseconds)] v0.5 LoRA eval done; rendering diffs" >> "$LOG"

# Diff against bare baseline + v0.3 LoRA
"$ROOT/.venv/bin/python" "$ROOT/scripts/diff_results.py" \
  --bare "$ROOT/eval/results/qwen35b__bare.json" \
  --sysprompt "$LORA_RESULTS" \
  --out "$ROOT/eval/results/qwen35b__bare_vs_lora-v05.md" \
  >> "$LOG" 2>&1

"$ROOT/.venv/bin/python" "$ROOT/scripts/diff_results.py" \
  --bare "$ROOT/eval/results/qwen35b__lora.json" \
  --sysprompt "$LORA_RESULTS" \
  --out "$ROOT/eval/results/qwen35b__lora-v03_vs_v05.md" \
  >> "$LOG" 2>&1

echo "[$(date -Iseconds)] all v0.5 outputs written" >> "$LOG"
