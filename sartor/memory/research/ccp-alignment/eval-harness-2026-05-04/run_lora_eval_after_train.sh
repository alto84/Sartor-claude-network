#!/bin/bash
# Wait for LoRA training to land, then eval LoRA-on-base.
set -u
ROOT=/home/alton/experiments/2026-05-04-finetune-loyalty
ADAPTER=$ROOT/runs/lora-r64-attn-only-v1/adapter-final
LORA_RESULTS=$ROOT/eval/results/qwen35b__lora.json
LOG=$ROOT/logs/lora-eval.log

while [ ! -d "$ADAPTER" ]; do sleep 30; done
sleep 30  # let trainer flush completely
echo "[$(date -Iseconds)] adapter at $ADAPTER, starting LoRA eval (no system prompt — apples to apples vs bare)" >> "$LOG"

"$ROOT/.venv/bin/python" "$ROOT/eval/score.py" \
  --subject hf:Youssofal/Qwen3.6-35B-A3B-Abliterated-Heretic-BF16 \
  --adapter-path "$ADAPTER" \
  --probes "$ROOT/eval/probes.jsonl" \
  --out "$LORA_RESULTS" \
  --save-responses "$ROOT/eval/results/qwen35b__lora.responses.jsonl" \
  >> "$LOG" 2>&1

echo "[$(date -Iseconds)] LoRA eval done; rendering 3-way diff" >> "$LOG"

# Render two diffs: bare-vs-LoRA, sysprompt-vs-LoRA
"$ROOT/.venv/bin/python" "$ROOT/scripts/diff_results.py" \
  --bare "$ROOT/eval/results/qwen35b__bare.json" \
  --sysprompt "$LORA_RESULTS" \
  --out "$ROOT/eval/results/qwen35b__bare_vs_lora.md" \
  >> "$LOG" 2>&1

"$ROOT/.venv/bin/python" "$ROOT/scripts/diff_results.py" \
  --bare "$ROOT/eval/results/qwen35b__sysprompt.json" \
  --sysprompt "$LORA_RESULTS" \
  --out "$ROOT/eval/results/qwen35b__sysprompt_vs_lora.md" \
  >> "$LOG" 2>&1

echo "[$(date -Iseconds)] all done" >> "$LOG"
