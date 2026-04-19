#!/usr/bin/env bash
# Poll for GPU availability and launch training when the GPU is idle.
#
# Checks two conditions:
#   1. No Docker containers running (vast.ai rental indicator)
#   2. GPU utilization below threshold for N consecutive checks
#
# Usage:
#   ./train_when_free.sh <command> [args...]
#
# Examples:
#   ./train_when_free.sh python train_constitutional_sft.py --config train_config.yaml --out checkpoints/sft-v1
#   ./train_when_free.sh ./run_full_pipeline.sh
#
# Environment variables:
#   POLL_INTERVAL   -- seconds between checks (default: 60)
#   UTIL_THRESHOLD  -- GPU utilization percent considered "free" (default: 15)
#   CONFIRM_CHECKS  -- consecutive idle checks before launching (default: 3)
#   MAX_WAIT_HOURS  -- give up after this many hours (default: 12)

set -euo pipefail

POLL_INTERVAL="${POLL_INTERVAL:-60}"
UTIL_THRESHOLD="${UTIL_THRESHOLD:-15}"
CONFIRM_CHECKS="${CONFIRM_CHECKS:-3}"
MAX_WAIT_HOURS="${MAX_WAIT_HOURS:-12}"

if [ $# -eq 0 ]; then
    echo "Usage: $0 <command> [args...]"
    echo ""
    echo "Waits until the GPU is free (no Docker containers, low utilization)"
    echo "then executes the given command."
    exit 1
fi

COMMAND=("$@")
MAX_WAIT_SECONDS=$((MAX_WAIT_HOURS * 3600))
START_TIME=$(date +%s)
IDLE_COUNT=0

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

is_gpu_free() {
    # Check 1: No Docker containers (vast.ai rental indicator)
    local docker_count
    docker_count=$(docker ps -q 2>/dev/null | wc -l || echo "0")
    docker_count=$(echo "$docker_count" | tr -d ' ')
    if [ "$docker_count" -gt 0 ]; then
        log "Docker containers running: $docker_count (rental active)"
        return 1
    fi

    # Check 2: GPU utilization below threshold
    local gpu_util
    gpu_util=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null | head -1 | tr -d ' ')
    if [ -z "$gpu_util" ]; then
        log "Cannot read GPU utilization"
        return 1
    fi
    if [ "$gpu_util" -gt "$UTIL_THRESHOLD" ]; then
        log "GPU utilization: ${gpu_util}% (threshold: ${UTIL_THRESHOLD}%)"
        return 1
    fi

    # Check 3: No vast.ai processes
    local vastai_procs
    vastai_procs=$(pgrep -f "vastai" 2>/dev/null | wc -l || echo "0")
    # This is informational; don't block on it since vastai-tend.sh runs periodically

    log "GPU free: docker=0, util=${gpu_util}%"
    return 0
}

log "Waiting for GPU to be free..."
log "  Poll interval: ${POLL_INTERVAL}s"
log "  Utilization threshold: ${UTIL_THRESHOLD}%"
log "  Consecutive checks needed: ${CONFIRM_CHECKS}"
log "  Max wait: ${MAX_WAIT_HOURS}h"
log "  Command: ${COMMAND[*]}"

while true; do
    ELAPSED=$(( $(date +%s) - START_TIME ))
    if [ "$ELAPSED" -gt "$MAX_WAIT_SECONDS" ]; then
        log "ERROR: Max wait time exceeded (${MAX_WAIT_HOURS}h). Giving up."
        exit 1
    fi

    if is_gpu_free; then
        IDLE_COUNT=$((IDLE_COUNT + 1))
        if [ "$IDLE_COUNT" -ge "$CONFIRM_CHECKS" ]; then
            log "GPU confirmed free after ${IDLE_COUNT} consecutive checks."
            break
        fi
        log "GPU appears free (${IDLE_COUNT}/${CONFIRM_CHECKS} checks)"
    else
        if [ "$IDLE_COUNT" -gt 0 ]; then
            log "GPU became busy again, resetting counter."
        fi
        IDLE_COUNT=0
    fi

    sleep "$POLL_INTERVAL"
done

# GPU is free. Register a trap to handle interruption gracefully.
TRAINING_PID=""

cleanup() {
    if [ -n "$TRAINING_PID" ] && kill -0 "$TRAINING_PID" 2>/dev/null; then
        log "Interrupting training (PID $TRAINING_PID)..."
        kill -SIGTERM "$TRAINING_PID" 2>/dev/null
        # Give it 30s to save checkpoint
        for i in $(seq 1 30); do
            if ! kill -0 "$TRAINING_PID" 2>/dev/null; then
                break
            fi
            sleep 1
        done
        if kill -0 "$TRAINING_PID" 2>/dev/null; then
            log "Force-killing training process."
            kill -9 "$TRAINING_PID" 2>/dev/null
        fi
    fi
}
trap cleanup SIGTERM SIGINT

# Launch training
log "=== Launching: ${COMMAND[*]} ==="
"${COMMAND[@]}" &
TRAINING_PID=$!

# Monitor: if a Docker container starts during training, warn (but don't kill).
# The user should handle this via the rental scheduling approach.
while kill -0 "$TRAINING_PID" 2>/dev/null; do
    docker_count=$(docker ps -q 2>/dev/null | wc -l || echo "0")
    docker_count=$(echo "$docker_count" | tr -d ' ')
    if [ "$docker_count" -gt 0 ]; then
        log "WARNING: Docker container started during training! Rental may be active."
        log "Training continues but may conflict with rental workload."
    fi
    sleep 120  # Check every 2 minutes during training
done

wait "$TRAINING_PID"
EXIT_CODE=$?
TOTAL_ELAPSED=$(( $(date +%s) - START_TIME ))

if [ "$EXIT_CODE" -eq 0 ]; then
    log "=== Training completed successfully (total elapsed: ${TOTAL_ELAPSED}s) ==="
else
    log "=== Training exited with code $EXIT_CODE (total elapsed: ${TOTAL_ELAPSED}s) ==="
fi

exit "$EXIT_CODE"
