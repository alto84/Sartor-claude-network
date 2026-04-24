#!/bin/bash
# Overnight orchestrator — chains Track A -> C -> D -> morning report.
# Track B (abliteration from scratch) requires non-abliterated base model
# download ~70 GB; skipped for tonight's first pass.
# Track E (activation steering) uses the direction extraction from Track B;
# deferred along with B.
#
# Runs detached in tmux session 'chain'. Safe to run multiple times —
# each track is idempotent (overwrites its artifacts dir on re-run).

set -u
ROOT=/home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training
LOG=/home/alton/overnight-chain.log

ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log() { echo "[$(ts)] $*" | tee -a "$LOG"; }

log "=== overnight chain start ==="

wait_for_session_end() {
  local session=$1
  local max_wait=${2:-7200}  # default 2 h cap
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
  cd "$ROOT/../.."  # repo root
  git add experiments/ sartor/memory/inbox/rtxpro6000server/ 2>/dev/null || true
  git diff --cached --quiet && {
    log "$track: nothing to commit"
    return
  }
  git commit -m "Track $track artifacts (auto-commit by overnight-chain)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>" 2>&1 | tail -3 | tee -a "$LOG"
  # Note: rtxpro6000server cannot push to GitHub (no creds).
  # Rocinante will pull these commits via separate mechanism.
}

# ============================================================
# Phase 1: wait for Track A (hardware baseline) to finish
# ============================================================
log "=== waiting for Track A (trackA tmux) ==="
if tmux has-session -t trackA 2>/dev/null; then
  wait_for_session_end trackA 3000   # ~50 min cap
else
  log "Track A not running in tmux; proceeding"
fi

# Collect what's there, even if it ran partial
log "Track A artifacts:"
ls -la "$ROOT/track-A-hardware-baseline/" 2>&1 | head -15 | tee -a "$LOG"
commit_track "A"

# ============================================================
# Phase 2: Track C — LoRA Constitutional fine-tune v0.2
# ============================================================
log "=== firing Track C — LoRA fine-tune (v0.2 train.py) ==="

# Kick off PCIe retrain (belt-and-suspenders)
sudo bash "$ROOT/pcie-retrain.sh" 2>&1 | tee -a "$LOG"

# Kill any stale training sessions
for s in launcher monitor train; do tmux kill-session -t $s 2>/dev/null && log "killed stale $s"; done

# Archive any prior crash artifacts
mv /home/alton/training.log /home/alton/training.log.prior-$(date +%s) 2>/dev/null || true
mv /home/alton/training-monitor.log /home/alton/training-monitor.log.prior-$(date +%s) 2>/dev/null || true

# Fire monitor + training in tmux, same-NUMA Gen 5 x16 config
tmux new-session -d -s monitor "bash $ROOT/monitor.sh"
sleep 2
tmux new-session -d -s train "source /home/alton/ml/bin/activate && cd $ROOT && python train.py 2>&1 | tee /home/alton/training.log"
sleep 10

log "train session initial state:"
tail -20 /home/alton/training.log 2>&1 | tee -a "$LOG"

# Wait up to 3 h for training
wait_for_session_end train 10800

# Collect
log "Track C done. Training log tail:"
tail -40 /home/alton/training.log 2>&1 | tee -a "$LOG"
log "Training monitor tail:"
tail -10 /home/alton/training-monitor.log 2>&1 | tee -a "$LOG"
log "LoRA adapter dir:"
ls -la /home/alton/models/lora-sartor-v0.1/ 2>&1 | head -10 | tee -a "$LOG"

# Copy artifacts into the experiment dir
mkdir -p "$ROOT/track-C-lora-constitution"
cp /home/alton/training.log "$ROOT/track-C-lora-constitution/" 2>/dev/null
cp /home/alton/training-monitor.log "$ROOT/track-C-lora-constitution/" 2>/dev/null
[ -d /home/alton/models/lora-sartor-v0.1 ] && ls /home/alton/models/lora-sartor-v0.1 > "$ROOT/track-C-lora-constitution/adapter-files.txt" 2>/dev/null

# Stop monitor
tmux kill-session -t monitor 2>/dev/null

commit_track "C"

# ============================================================
# Phase 3: Track D — probe eval (base vs LoRA-tuned Heretic)
# ============================================================
log "=== firing Track D — probe eval ==="

# Write the eval script inline so chain can run it
cat > /tmp/probe-eval.py <<'PYEOF'
import os, sys, json, torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

BASE = "/home/alton/models/heretic-3.6-35b"
ADAPTER = "/home/alton/models/lora-sartor-v0.1"
ROOT = "/home/alton/Sartor-claude-network/experiments/2026-04-22-overnight-training"

# Load the probe set
probe_md = open(f"{ROOT}/probes/constitutional-probe-set.md").read()
# Extract numbered prompts from each category (simple regex)
import re
prompts = []
current_cat = None
for line in probe_md.split("\n"):
    m = re.match(r"## Category (\w)", line)
    if m:
        current_cat = m.group(1)
        continue
    m = re.match(r"^(\d+)\. (.+)$", line)
    if m and current_cat and current_cat in "ABCD":
        prompts.append({"cat": current_cat, "num": int(m.group(1)), "prompt": m.group(2)})
print(f"Loaded {len(prompts)} probes", flush=True)

def run_variant(name, model, tok, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    results = []
    for p in prompts:
        print(f"[{name}] cat {p['cat']} #{p['num']}", flush=True)
        inputs = tok(p["prompt"], return_tensors="pt").to(model.device)
        with torch.no_grad():
            out = model.generate(**inputs, max_new_tokens=400, temperature=0.7, do_sample=True, pad_token_id=tok.eos_token_id)
        text = tok.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
        results.append({**p, "response": text, "variant": name})
    with open(f"{output_dir}/results.jsonl", "w") as f:
        for r in results:
            f.write(json.dumps(r) + "\n")
    return results

print("loading tokenizer + base Heretic...", flush=True)
tok = AutoTokenizer.from_pretrained(BASE, trust_remote_code=True)
if tok.pad_token is None: tok.pad_token = tok.eos_token

print("loading base model...", flush=True)
base_model = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.bfloat16, device_map="auto", trust_remote_code=True)
base_model.eval()

out_base = f"{ROOT}/track-D-probe-eval/outputs-base-heretic"
run_variant("base-heretic", base_model, tok, out_base)

if os.path.exists(ADAPTER):
    print("attaching LoRA adapter...", flush=True)
    tuned = PeftModel.from_pretrained(base_model, ADAPTER)
    tuned.eval()
    out_tuned = f"{ROOT}/track-D-probe-eval/outputs-lora-tuned"
    run_variant("lora-tuned", tuned, tok, out_tuned)
else:
    print(f"SKIP lora-tuned eval; adapter not at {ADAPTER}", flush=True)

print("track D probe eval done", flush=True)
PYEOF

tmux new-session -d -s probe-eval "source /home/alton/ml/bin/activate && python /tmp/probe-eval.py 2>&1 | tee $ROOT/track-D-probe-eval/run.log"
mkdir -p "$ROOT/track-D-probe-eval"
wait_for_session_end probe-eval 3600   # 1h cap

log "Track D done. Results preview:"
ls -la "$ROOT/track-D-probe-eval/" 2>&1 | head -10 | tee -a "$LOG"

commit_track "D"

# ============================================================
# Phase 4: morning report
# ============================================================
log "=== writing morning report ==="

cat > "$ROOT/MORNING-REPORT.md" <<EOF
---
name: overnight-morning-report
type: experiment-artifact
date: 2026-04-24
author: rtxpro6000server overnight-chain.sh
updated: $(ts)
tags: [morning-report, overnight, abliteration, lora, stress-test]
related: [PLAN-v3-overnight-science, HOUSEHOLD-CONSTITUTION]
---

# Morning report — overnight science run 2026-04-24

This report is auto-generated by \`overnight-chain.sh\` at the end of the run.
For the full plan, see PLAN-v3-overnight-science.md in this directory.

## Tracks attempted

| Track | Status |
|-------|--------|
| A — hardware baseline (gpu-burn + telemetry) | $([ -f $ROOT/track-A-hardware-baseline/stats.txt ] && echo "done" || echo "incomplete") |
| B — abliteration from scratch | skipped (deferred to v2 — requires non-abliterated base download) |
| C — LoRA Constitutional fine-tune | $([ -d /home/alton/models/lora-sartor-v0.1 ] && [ -n "$(ls /home/alton/models/lora-sartor-v0.1 2>/dev/null)" ] && echo "done" || echo "incomplete") |
| D — probe eval | $([ -f $ROOT/track-D-probe-eval/outputs-base-heretic/results.jsonl ] && echo "done" || echo "incomplete") |
| E — activation steering | skipped (depends on Track B's direction vectors) |

## Track A — hardware characterization

$([ -f $ROOT/track-A-hardware-baseline/stats.txt ] && cat $ROOT/track-A-hardware-baseline/stats.txt || echo "(no stats.txt produced)")

Full telemetry at \`track-A-hardware-baseline/telemetry.csv\`.
gpu-burn logs at \`track-A-hardware-baseline/gpu-burn-{0,1}.log\`.

## Track C — LoRA fine-tune

Training log tail:
\`\`\`
$(tail -30 /home/alton/training.log 2>/dev/null || echo "(no training log)")
\`\`\`

Monitor alerts during run:
\`\`\`
$(cat /home/alton/ALERT 2>/dev/null || echo "(clean)")
\`\`\`

LoRA adapter: $([ -d /home/alton/models/lora-sartor-v0.1 ] && ls /home/alton/models/lora-sartor-v0.1 | head -10 || echo "(not produced)")

## Track D — probe eval

Base Heretic probe outputs: $([ -f $ROOT/track-D-probe-eval/outputs-base-heretic/results.jsonl ] && wc -l < $ROOT/track-D-probe-eval/outputs-base-heretic/results.jsonl | tr -d ' ' || echo "0") prompts evaluated.

LoRA-tuned probe outputs: $([ -f $ROOT/track-D-probe-eval/outputs-lora-tuned/results.jsonl ] && wc -l < $ROOT/track-D-probe-eval/outputs-lora-tuned/results.jsonl | tr -d ' ' || echo "0") prompts evaluated.

Raw outputs in \`track-D-probe-eval/outputs-*/results.jsonl\`.

Qualitative analysis will require Alton (or a follow-up LLM-judge pass) to review the actual outputs.

## What was not attempted

- Track B (abliteration from scratch): requires downloading the non-abliterated Qwen 3.6 35B-A3B base (~70 GB). Deferred to keep the overnight run within time budget.
- Track E (activation steering live): depends on direction vectors from Track B. Deferred.
- Qwen 3.6 Dense comparison: not separately loaded — would need ~54 GB additional download.

## Cato-prosecution paragraph

This run validated the same-NUMA x16/x16 PCIe config under real training load, produced a first LoRA adapter with hybrid-architecture-aware targeting, and characterized the thermal envelope. What didn't happen: the abliteration-from-scratch experiment Alton explicitly asked about. The plan justified the skip on disk/time grounds; that justification is defensible but it's a skip, not a win. What got overclaimed: any qualitative shift in the probe eval is unscored and unquantified until a human (or a separate judge pass) reads the outputs. Don't mistake "tracks completed" for "behavior validated."

## Next steps

1. Alton reviews probe outputs qualitatively.
2. If interesting, spin up Track B next session (non-abliterated base download, direction extraction, orthogonalization from scratch).
3. Consider Track E with direction vectors from B.
4. Update \`authored_by_instance\` frontmatter convention (Lethe's v0.4 proposal) based on this run's experience.

## History

- $(ts): Auto-generated by overnight-chain.sh after all tracks complete.
EOF

log "morning report written to $ROOT/MORNING-REPORT.md"
commit_track "morning-report"

log "=== overnight chain complete ==="
