#!/usr/bin/env bash
# Full experiment pipeline: Abliterate -> SFT -> DPO with eval between each phase.
#
# Usage:
#   ./run_full_pipeline.sh [--config train_config.yaml] [--skip-abliteration] [--skip-dpo]
#
# Prerequisites:
#   - Python environment with all dependencies installed
#   - data/corpus/constitutional_sft.jsonl exists
#   - data/corpus/ccp_deconditioning_pairs.jsonl exists
#   - data/eval/probes.jsonl exists
#
# The script exits on any failure. Checkpoints are saved at each phase
# so you can resume from any point.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG="${PROJECT_DIR}/scripts/train_config.yaml"
MODEL="Qwen/Qwen2.5-7B"
PROBES="${PROJECT_DIR}/data/eval/probes.jsonl"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RUN_DIR="${PROJECT_DIR}/outputs/run_${TIMESTAMP}"

SKIP_ABLITERATION=false
SKIP_DPO=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --config) CONFIG="$2"; shift 2 ;;
        --model) MODEL="$2"; shift 2 ;;
        --skip-abliteration) SKIP_ABLITERATION=true; shift ;;
        --skip-dpo) SKIP_DPO=true; shift ;;
        *) echo "Unknown arg: $1"; exit 1 ;;
    esac
done

mkdir -p "$RUN_DIR"
LOG="${RUN_DIR}/pipeline.log"

log() {
    echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"
}

check_gpu_free() {
    # Check that no vast.ai containers are running and GPU utilization is low
    local docker_count
    docker_count=$(docker ps -q 2>/dev/null | wc -l || echo "0")
    if [ "$docker_count" -gt 0 ]; then
        log "ERROR: $docker_count Docker containers running. GPU may be rented."
        return 1
    fi
    local gpu_util
    gpu_util=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null | head -1 | tr -d ' ')
    if [ "${gpu_util:-0}" -gt 20 ]; then
        log "WARNING: GPU utilization at ${gpu_util}%. Proceeding anyway."
    fi
    return 0
}

# =========================================================================
# Phase 0: Pre-flight checks
# =========================================================================
log "=== Phase 0: Pre-flight checks ==="
log "Config: $CONFIG"
log "Model: $MODEL"
log "Run dir: $RUN_DIR"

if ! check_gpu_free; then
    log "GPU not free. Aborting."
    exit 1
fi

# Verify data files exist
for f in "$PROBES"; do
    if [ ! -f "$f" ]; then
        log "ERROR: Required file not found: $f"
        exit 1
    fi
done

# =========================================================================
# Phase 0.5: Baseline eval (if not already done)
# =========================================================================
EVAL_BASE="${RUN_DIR}/eval-base"
if [ ! -f "${EVAL_BASE}.json" ]; then
    log "=== Phase 0.5: Baseline evaluation ==="
    check_gpu_free || { log "GPU not free. Aborting."; exit 1; }
    python "$SCRIPT_DIR/run_eval.py" \
        --model "$MODEL" \
        --probes "$PROBES" \
        --out "$EVAL_BASE" \
        --label "base" \
        --resume 2>&1 | tee -a "$LOG"
    log "Baseline eval complete."
else
    log "Baseline eval already exists, skipping."
fi

# =========================================================================
# Phase 1: Abliteration (RQ1)
# =========================================================================
ABLITERATED_DIR="${RUN_DIR}/abliterated"
EVAL_ABLITERATED="${RUN_DIR}/eval-abliterated"

if [ "$SKIP_ABLITERATION" = false ]; then
    log "=== Phase 1: Abliteration ==="

    if [ ! -f "${ABLITERATED_DIR}/abliteration_stats.json" ]; then
        check_gpu_free || { log "GPU not free. Aborting."; exit 1; }
        python "$SCRIPT_DIR/run_abliteration.py" \
            --model "$MODEL" \
            --out "$ABLITERATED_DIR" \
            --method single 2>&1 | tee -a "$LOG"
        log "Abliteration complete."
    else
        log "Abliteration already done, skipping."
    fi

    # Eval abliterated model
    if [ ! -f "${EVAL_ABLITERATED}.json" ]; then
        check_gpu_free || { log "GPU not free. Aborting."; exit 1; }
        python "$SCRIPT_DIR/run_eval.py" \
            --model "$ABLITERATED_DIR" \
            --probes "$PROBES" \
            --out "$EVAL_ABLITERATED" \
            --label "abliterated" \
            --resume 2>&1 | tee -a "$LOG"
        log "Abliterated eval complete."
    fi

    # Also run multi-direction abliteration
    ABLITERATED_MULTI="${RUN_DIR}/abliterated-multi"
    EVAL_ABLITERATED_MULTI="${RUN_DIR}/eval-abliterated-multi"

    if [ ! -f "${ABLITERATED_MULTI}/abliteration_stats.json" ]; then
        check_gpu_free || { log "GPU not free. Aborting."; exit 1; }
        python "$SCRIPT_DIR/run_abliteration.py" \
            --model "$MODEL" \
            --out "$ABLITERATED_MULTI" \
            --method multi \
            --n-directions 3 2>&1 | tee -a "$LOG"
    fi

    if [ ! -f "${EVAL_ABLITERATED_MULTI}.json" ]; then
        check_gpu_free || { log "GPU not free. Aborting."; exit 1; }
        python "$SCRIPT_DIR/run_eval.py" \
            --model "$ABLITERATED_MULTI" \
            --probes "$PROBES" \
            --out "$EVAL_ABLITERATED_MULTI" \
            --label "abliterated-multi" \
            --resume 2>&1 | tee -a "$LOG"
    fi
else
    log "Skipping abliteration (--skip-abliteration)"
fi

# =========================================================================
# Phase 2: Constitutional SFT (RQ3)
# =========================================================================
SFT_DIR="${RUN_DIR}/sft-v1"
EVAL_SFT="${RUN_DIR}/eval-sft"

log "=== Phase 2: Constitutional SFT ==="

if [ ! -f "${SFT_DIR}/training_stats.json" ]; then
    check_gpu_free || { log "GPU not free. Aborting."; exit 1; }
    python "$SCRIPT_DIR/train_constitutional_sft.py" \
        --config "$CONFIG" \
        --out "$SFT_DIR" \
        --model "$MODEL" 2>&1 | tee -a "$LOG"
    log "SFT training complete."
else
    log "SFT already done, skipping."
fi

# Eval SFT model
if [ ! -f "${EVAL_SFT}.json" ]; then
    check_gpu_free || { log "GPU not free. Aborting."; exit 1; }
    python "$SCRIPT_DIR/run_eval.py" \
        --model "$MODEL" \
        --adapter "$SFT_DIR" \
        --probes "$PROBES" \
        --out "$EVAL_SFT" \
        --label "sft" \
        --compare "${EVAL_BASE}.json" \
        --resume 2>&1 | tee -a "$LOG"
    log "SFT eval complete."
fi

# =========================================================================
# Phase 3: DPO refinement (RQ2)
# =========================================================================
DPO_DIR="${RUN_DIR}/dpo-v1"
EVAL_DPO="${RUN_DIR}/eval-dpo"

if [ "$SKIP_DPO" = false ]; then
    log "=== Phase 3: DPO refinement ==="

    if [ ! -f "${DPO_DIR}/training_stats.json" ]; then
        check_gpu_free || { log "GPU not free. Aborting."; exit 1; }
        python "$SCRIPT_DIR/train_dpo.py" \
            --config "$CONFIG" \
            --sft-adapter "$SFT_DIR" \
            --out "$DPO_DIR" \
            --model "$MODEL" 2>&1 | tee -a "$LOG"
        log "DPO training complete."
    else
        log "DPO already done, skipping."
    fi

    # Eval DPO model
    if [ ! -f "${EVAL_DPO}.json" ]; then
        check_gpu_free || { log "GPU not free. Aborting."; exit 1; }
        python "$SCRIPT_DIR/run_eval.py" \
            --model "$MODEL" \
            --adapter "$DPO_DIR" \
            --probes "$PROBES" \
            --out "$EVAL_DPO" \
            --label "dpo" \
            --compare "${EVAL_BASE}.json" "${EVAL_SFT}.json" \
            --resume 2>&1 | tee -a "$LOG"
        log "DPO eval complete."
    fi
else
    log "Skipping DPO (--skip-dpo)"
fi

# =========================================================================
# Phase 4: Combined pipeline (RQ4) -- Abliterate then SFT then DPO
# =========================================================================
if [ "$SKIP_ABLITERATION" = false ]; then
    log "=== Phase 4: Combined (Abliterate -> SFT -> DPO) ==="

    COMBINED_SFT="${RUN_DIR}/combined-sft"
    COMBINED_DPO="${RUN_DIR}/combined-dpo"
    EVAL_COMBINED="${RUN_DIR}/eval-combined"

    # SFT on abliterated base
    if [ ! -f "${COMBINED_SFT}/training_stats.json" ]; then
        check_gpu_free || { log "GPU not free. Aborting."; exit 1; }
        python "$SCRIPT_DIR/train_constitutional_sft.py" \
            --config "$CONFIG" \
            --model "$ABLITERATED_DIR" \
            --out "$COMBINED_SFT" 2>&1 | tee -a "$LOG"
    fi

    # DPO on abliterated+SFT
    if [ "$SKIP_DPO" = false ] && [ ! -f "${COMBINED_DPO}/training_stats.json" ]; then
        check_gpu_free || { log "GPU not free. Aborting."; exit 1; }
        python "$SCRIPT_DIR/train_dpo.py" \
            --config "$CONFIG" \
            --model "$ABLITERATED_DIR" \
            --sft-adapter "$COMBINED_SFT" \
            --out "$COMBINED_DPO" 2>&1 | tee -a "$LOG"
    fi

    # Final eval of the combined model
    FINAL_ADAPTER="${COMBINED_DPO}"
    [ "$SKIP_DPO" = true ] && FINAL_ADAPTER="${COMBINED_SFT}"

    if [ ! -f "${EVAL_COMBINED}.json" ]; then
        check_gpu_free || { log "GPU not free. Aborting."; exit 1; }
        python "$SCRIPT_DIR/run_eval.py" \
            --model "$ABLITERATED_DIR" \
            --adapter "$FINAL_ADAPTER" \
            --probes "$PROBES" \
            --out "$EVAL_COMBINED" \
            --label "combined" \
            --compare "${EVAL_BASE}.json" "${EVAL_SFT}.json" \
            --resume 2>&1 | tee -a "$LOG"
    fi
fi

# =========================================================================
# Phase 5: Summary
# =========================================================================
log "=== Pipeline complete ==="
log "Results in: $RUN_DIR"
log "Eval files:"
for f in "$RUN_DIR"/eval-*.json; do
    if [ -f "$f" ]; then
        label=$(python -c "import json; print(json.load(open('$f'))['label'])" 2>/dev/null || echo "?")
        rate=$(python -c "import json; print(json.load(open('$f'))['total_pass_rate'])" 2>/dev/null || echo "?")
        log "  $label: pass_rate=$rate"
    fi
done

log "Done."
