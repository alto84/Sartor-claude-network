#!/bin/bash
# Overnight orchestrator v2 — chains Track A -> Track C v2 -> Track D (v2 probes)
# -> Stress Afterword -> morning report.
#
# Track B (abliteration from scratch) and Track E (activation steering) are
# deferred per NEXT-STEPS-v2.md.
#
# Runs detached in tmux session 'chain'. Safe to run multiple times —
# each track is idempotent (overwrites its artifacts dir on re-run).

set -u
ROOT=/home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training
LOG=/home/alton/overnight-chain-v2.log
ADAPTER_DIR=/home/alton/models/lora-sartor-v0.3
PROBES=$ROOT/probes/probes-v2.jsonl

ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log() { echo "[$(ts)] $*" | tee -a "$LOG"; }

log "=== overnight chain v2 start ==="

wait_for_session_end() {
  local session=$1
  local max_wait=${2:-7200}
  local waited=0
  while tmux has-session -t "$session" 2>/dev/null; do
    sleep 30
    waited=$(( waited + 30 ))
    if (( waited >= max_wait )); then
      log "WARN: $session still running after ${max_wait}s, giving up"
      return 1
    fi
  done
  log "$session ended after ${waited}s"
  return 0
}

commit_track() {
  local track=$1
  cd "$ROOT/../.."
  git add experiments/ sartor/memory/inbox/rtxpro6000server/ 2>/dev/null || true
  git diff --cached --quiet && {
    log "$track: nothing to commit"
    return
  }
  git commit -m "Track $track v2 artifacts (auto-commit)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>" 2>&1 | tail -3 | tee -a "$LOG"
}

# ============================================================
# Phase 1: Track A — hardware baseline (gpu-burn now works)
# ============================================================
log "=== Phase 1: Track A hardware baseline ==="
if [ -x "$ROOT/track-A-hardware-baseline.sh" ]; then
  tmux new-session -d -s trackA "bash $ROOT/track-A-hardware-baseline.sh 2>&1 | tee $ROOT/track-A-hardware-baseline/chain-run.log"
  sleep 3
  wait_for_session_end trackA 3000
  log "Track A complete. Stats:"
  cat "$ROOT/track-A-hardware-baseline/stats.txt" 2>/dev/null | tee -a "$LOG"
else
  log "Track A script missing; skipping"
fi
commit_track "A"

# ============================================================
# Phase 2: PCIe retrain + start monitor + training v0.3
# ============================================================
log "=== Phase 2: Track C v2 — contrastive-override SFT ==="

sudo bash "$ROOT/pcie-retrain.sh" 2>&1 | tee -a "$LOG"

for s in launcher monitor train; do
  tmux kill-session -t $s 2>/dev/null && log "killed stale $s"
done

mv /home/alton/training-v0.3.log /home/alton/training-v0.3.log.prior-$(date +%s) 2>/dev/null || true
mv /home/alton/training-monitor.log /home/alton/training-monitor.log.prior-$(date +%s) 2>/dev/null || true

tmux new-session -d -s monitor "bash $ROOT/monitor.sh"
sleep 2
tmux new-session -d -s train "source /home/alton/ml/bin/activate && cd $ROOT && python train.py 2>&1 | tee /home/alton/training-v0.3.log"
sleep 15

log "train session initial state:"
tail -20 /home/alton/training-v0.3.log 2>&1 | tee -a "$LOG"

wait_for_session_end train 10800  # 3h cap

log "Track C v2 done. Training log tail:"
tail -40 /home/alton/training-v0.3.log 2>&1 | tee -a "$LOG"
log "Monitor log tail:"
tail -10 /home/alton/training-monitor.log 2>&1 | tee -a "$LOG"
log "LoRA v0.3 adapter dir:"
ls -la $ADAPTER_DIR/ 2>&1 | head -10 | tee -a "$LOG"

mkdir -p "$ROOT/track-C-v2-artifacts"
cp /home/alton/training-v0.3.log "$ROOT/track-C-v2-artifacts/" 2>/dev/null
cp /home/alton/training-monitor.log "$ROOT/track-C-v2-artifacts/" 2>/dev/null
[ -d $ADAPTER_DIR ] && ls $ADAPTER_DIR > "$ROOT/track-C-v2-artifacts/adapter-files.txt" 2>/dev/null

tmux kill-session -t monitor 2>/dev/null
commit_track "C-v2"

# ============================================================
# Phase 3: Track D v2 — probe eval on probes-v2.jsonl
# ============================================================
log "=== Phase 3: Track D v2 — probe eval ==="

cat > /tmp/probe-eval-v2.py <<PYEOF
import os, sys, json, torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

BASE = "/home/alton/models/heretic-3.6-35b"
ADAPTER = "$ADAPTER_DIR"
ROOT = "$ROOT"
PROBES_PATH = "$PROBES"

probes = []
with open(PROBES_PATH) as f:
    for line in f:
        line = line.strip()
        if not line: continue
        probes.append(json.loads(line))
print(f"Loaded {len(probes)} probes from probes-v2.jsonl", flush=True)

tok = AutoTokenizer.from_pretrained(BASE, trust_remote_code=True)
if tok.pad_token is None: tok.pad_token = tok.eos_token

def run_variant(name, model, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    results = []
    for p in probes:
        print(f"[{name}] cat {p['cat']} #{p['num']}", flush=True)
        msg = [{"role": "user", "content": p["prompt"]}]
        prompt_text = tok.apply_chat_template(msg, tokenize=False, add_generation_prompt=True)
        inputs = tok(prompt_text, return_tensors="pt").to(model.device)
        with torch.no_grad():
            out = model.generate(
                **inputs,
                max_new_tokens=500,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tok.eos_token_id,
            )
        text = tok.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
        results.append({**p, "response": text, "variant": name})
    with open(f"{output_dir}/results.jsonl", "w") as f:
        for r in results:
            f.write(json.dumps(r) + "\n")
    return results

print("loading base Heretic...", flush=True)
base_model = AutoModelForCausalLM.from_pretrained(
    BASE, torch_dtype=torch.bfloat16, device_map="auto", trust_remote_code=True
)
base_model.eval()

out_base = f"{ROOT}/track-D-probe-eval-v2/outputs-base-heretic"
run_variant("base-heretic", base_model, out_base)

if os.path.exists(ADAPTER):
    print("attaching LoRA v0.3 adapter...", flush=True)
    tuned = PeftModel.from_pretrained(base_model, ADAPTER)
    tuned.eval()
    out_tuned = f"{ROOT}/track-D-probe-eval-v2/outputs-lora-v0.3"
    run_variant("lora-v0.3", tuned, out_tuned)
else:
    print(f"SKIP lora eval; adapter not at {ADAPTER}", flush=True)

print("Track D v2 probe eval done", flush=True)
PYEOF

mkdir -p "$ROOT/track-D-probe-eval-v2"
tmux new-session -d -s probe-eval "source /home/alton/ml/bin/activate && python /tmp/probe-eval-v2.py 2>&1 | tee $ROOT/track-D-probe-eval-v2/run.log"
wait_for_session_end probe-eval 3600

log "Track D v2 outputs:"
ls -la "$ROOT/track-D-probe-eval-v2/" 2>&1 | tee -a "$LOG"

# Scoring
log "=== Phase 3b: probe scoring ==="
tmux new-session -d -s probe-score "source /home/alton/ml/bin/activate && python $ROOT/probe-score.py --judge-model /home/alton/models/heretic-3.6-35b --outputs-dir $ROOT/track-D-probe-eval-v2/outputs-base-heretic $ROOT/track-D-probe-eval-v2/outputs-lora-v0.3 --output $ROOT/track-D-probe-eval-v2/scored-summary.md 2>&1 | tee $ROOT/track-D-probe-eval-v2/scoring.log"
wait_for_session_end probe-score 2400
log "Scored summary:"
cat "$ROOT/track-D-probe-eval-v2/scored-summary.md" 2>/dev/null | tee -a "$LOG"
commit_track "D-v2"

# ============================================================
# Phase 4: Stress Afterword — sustained inference marathon
# Per Alton 2026-04-24: "see how far we can push it"
# ============================================================
log "=== Phase 4: Stress Afterword — 20 min sustained inference on both GPUs ==="

# Restart the monitor for this phase so we capture thermals
tmux kill-session -t monitor 2>/dev/null
tmux new-session -d -s monitor "bash $ROOT/monitor.sh"
sleep 2

cat > /tmp/stress-inference.py <<'PYEOF'
import time, torch, json, os
from transformers import AutoTokenizer, AutoModelForCausalLM
BASE = "/home/alton/models/heretic-3.6-35b"
DURATION = int(os.environ.get("DURATION", 1200))  # 20 min default

tok = AutoTokenizer.from_pretrained(BASE, trust_remote_code=True)
if tok.pad_token is None: tok.pad_token = tok.eos_token
model = AutoModelForCausalLM.from_pretrained(
    BASE, torch_dtype=torch.bfloat16, device_map="auto", trust_remote_code=True
)
model.eval()

prompts = [
    "Explain quantum entanglement in detail.",
    "Write a 300-word story about a lighthouse keeper.",
    "Derive the Schrodinger equation from first principles.",
    "Describe the architecture of modern transformer language models.",
    "Explain how CRISPR gene editing works mechanistically.",
    "Walk through solving a Rubik's cube step by step.",
    "Explain the difference between classical and operant conditioning with examples.",
    "Describe how a modern CPU executes a single instruction.",
]

start = time.time()
tok_count = 0
gen_count = 0
while time.time() - start < DURATION:
    p = prompts[gen_count % len(prompts)]
    msg = [{"role": "user", "content": p}]
    prompt_text = tok.apply_chat_template(msg, tokenize=False, add_generation_prompt=True)
    inputs = tok(prompt_text, return_tensors="pt").to(model.device)
    with torch.no_grad():
        out = model.generate(
            **inputs, max_new_tokens=400, temperature=0.9, do_sample=True,
            pad_token_id=tok.eos_token_id,
        )
    new_toks = out.shape[1] - inputs["input_ids"].shape[1]
    tok_count += new_toks
    gen_count += 1
    elapsed = time.time() - start
    print(f"[{elapsed:6.0f}s] gen#{gen_count} new_tokens={new_toks} total_tok={tok_count} tok/s={tok_count/elapsed:.1f}", flush=True)

print(f"DONE. duration={elapsed:.0f}s generations={gen_count} total_tok={tok_count} tok/s={tok_count/elapsed:.1f}")
PYEOF

tmux new-session -d -s stress "source /home/alton/ml/bin/activate && DURATION=1200 python /tmp/stress-inference.py 2>&1 | tee $ROOT/track-C-v2-artifacts/stress-afterword.log"
wait_for_session_end stress 1500
log "Stress afterword done"
tail -15 "$ROOT/track-C-v2-artifacts/stress-afterword.log" 2>&1 | tee -a "$LOG"

tmux kill-session -t monitor 2>/dev/null
commit_track "stress-afterword"

# ============================================================
# Phase 5: morning report
# ============================================================
log "=== Phase 5: morning report ==="

cat > "$ROOT/MORNING-REPORT-v2.md" <<EOF
---
name: overnight-morning-report-v2
type: experiment-artifact
date: 2026-04-25
author: rtxpro6000server overnight-chain.sh v2
updated: $(ts)
tags: [morning-report, overnight, track-c-v2, contrastive-sft, stress-test]
related: [NEXT-STEPS-v2, PLAN-v3-overnight-science, HOUSEHOLD-CONSTITUTION]
---

# Morning report — overnight science run v2 (2026-04-24/25)

Auto-generated by \`overnight-chain.sh\` after Track A -> C v2 -> D v2 -> Stress Afterword.

## Tracks attempted

| Track | Status |
|-------|--------|
| A — hardware baseline (gpu-burn + telemetry) | $([ -f $ROOT/track-A-hardware-baseline/stats.txt ] && echo "done" || echo "incomplete") |
| C v2 — contrastive-override SFT | $([ -d $ADAPTER_DIR ] && [ -n "\$(ls $ADAPTER_DIR 2>/dev/null)" ] && echo "done" || echo "incomplete") |
| D v2 — probe eval (fresh probes) | $([ -f $ROOT/track-D-probe-eval-v2/outputs-base-heretic/results.jsonl ] && echo "done" || echo "incomplete") |
| Stress Afterword (20m inference marathon) | $([ -f $ROOT/track-C-v2-artifacts/stress-afterword.log ] && echo "done" || echo "incomplete") |

## Track A — hardware characterization

\`\`\`
$([ -f $ROOT/track-A-hardware-baseline/stats.txt ] && cat $ROOT/track-A-hardware-baseline/stats.txt || echo "(no stats)")
\`\`\`

Full telemetry at \`track-A-hardware-baseline/telemetry.csv\`.
gpu-burn logs at \`track-A-hardware-baseline/gpu-burn-{0,1}.log\`.

## Track C v2 — contrastive-override SFT

Corpus: 566 pairs (441 primary override across 10 §20 topics + 75 hard negatives + 50 capability-control).

Training config: LoRA rank 16, attention-only (q/k/v/o), 1 epoch, lr 5e-5, effective batch 16.

Training log tail:
\`\`\`
$(tail -40 /home/alton/training-v0.3.log 2>/dev/null || echo "(no training log)")
\`\`\`

Monitor alerts during run:
\`\`\`
$(cat /home/alton/ALERT 2>/dev/null || echo "(clean)")
\`\`\`

LoRA v0.3 adapter: \`$ADAPTER_DIR\`

## Track D v2 — probe eval

Fresh probe set (\`probes-v2.jsonl\`), 34 probes across 4 categories, zero overlap with training corpus.

### Scored summary

$([ -f $ROOT/track-D-probe-eval-v2/scored-summary.md ] && cat $ROOT/track-D-probe-eval-v2/scored-summary.md || echo "(scoring did not complete)")

Raw outputs: \`track-D-probe-eval-v2/outputs-*/results.jsonl\`
Scored outputs: \`track-D-probe-eval-v2/scored-*.jsonl\`

## Stress Afterword — sustained inference

20-minute continuous generation on both GPUs (model-parallel). Per Alton's 2026-04-24 ask: "see how far we can push it."

\`\`\`
$(tail -20 $ROOT/track-C-v2-artifacts/stress-afterword.log 2>/dev/null || echo "(no stress log)")
\`\`\`

Thermal telemetry captured in \`training-monitor.log\` through this phase.

## What was not attempted

- Track B (abliteration from scratch): requires ~70 GB non-abliterated base download; deferred.
- Track E (activation steering): depends on Track B direction vectors.

## Next steps

1. Review probe outputs qualitatively.
2. If Cat A delta is positive and Cat D holds, Track C v2 is the new working baseline.
3. If regression persists, reconsider training signal, LoRA targets, or response register.

## History

- $(ts): Auto-generated by overnight-chain.sh v2 after all v2 tracks complete.
EOF

log "morning report v2 written to $ROOT/MORNING-REPORT-v2.md"
commit_track "morning-report-v2"

log "=== overnight chain v2 complete ==="
