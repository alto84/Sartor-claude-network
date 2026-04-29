#!/bin/bash
# Top-level orchestrator: launches sampler in background, runs 5-min stress,
# waits for both, then writes a status line. Re-runnable.
#
# DO NOT RUN until BMC fan-source bindings have landed and a confirmation
# file from Rocinante exists at sartor/memory/inbox/rocinante/*_bmc-binding-applied.md.

set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

DURATION_S=300
SAMPLE_TAIL=10  # extra seconds the sampler runs after stress ends
SAMPLES="samples.jsonl"
STRESS_LOG="stress.log"

if [ ! -f /home/alton/ml/bin/python3 ]; then
  echo "FATAL: /home/alton/ml/bin/python3 not found (torch venv missing)"; exit 1
fi

# Pre-flight: confirm idle baseline before kicking
echo "=== pre-flight ===" | tee -a "$STRESS_LOG"
nvidia-smi --query-gpu=index,temperature.gpu,power.draw --format=csv,noheader,nounits | tee -a "$STRESS_LOG"
sudo ipmitool sensor 2>/dev/null | grep -E "PCIE0[37]|CPU Package|CHA_FAN[1-5]|CPU_FAN" | tee -a "$STRESS_LOG"

# Launch sampler in background
bash sample_loop.sh $((DURATION_S + SAMPLE_TAIL)) "$SAMPLES" &
SAMPLER_PID=$!

# Run stress in foreground; redirect to stress.log too
echo "=== stress ($(date -u +%Y-%m-%dT%H:%M:%SZ)) ===" | tee -a "$STRESS_LOG"
/home/alton/ml/bin/python3 thermal_stress.py --duration "$DURATION_S" 2>&1 | tee -a "$STRESS_LOG"

# Wait for sampler to finish its tail
wait "$SAMPLER_PID" || true

echo "=== run complete ($(date -u +%Y-%m-%dT%H:%M:%SZ)) ===" | tee -a "$STRESS_LOG"
echo "Samples: $(wc -l < "$SAMPLES")"
