#!/bin/bash
#
# Agent Health Hook for Claude Code
# Monitors agent health via checkpoints and status files
#
# Exit codes:
#   0 - Always (informational only, never blocks)
#
# Usage: agent-health.sh

set -u

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHECKPOINT_DIR="${REPO_ROOT}/data/checkpoints"
STATUS_DIR="${REPO_ROOT}/data/agent-status"
STALL_THRESHOLD_SECONDS=120  # 2 minutes without checkpoint = stalled

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log_error() {
    echo -e "${RED}[HEALTH ERROR]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[HEALTH WARN]${NC} $1" >&2
}

log_healthy() {
    echo -e "${GREEN}[HEALTHY]${NC} $1" >&2
}

log_info() {
    echo -e "${CYAN}[HEALTH]${NC} $1" >&2
}

# Create directories if they don't exist
mkdir -p "$CHECKPOINT_DIR" "$STATUS_DIR" 2>/dev/null || true

# Function to get the most recent checkpoint for an agent
get_latest_checkpoint() {
    local agent_id="$1"
    local checkpoint_file="$CHECKPOINT_DIR/${agent_id}.log"

    if [[ ! -f "$checkpoint_file" ]]; then
        echo "|0"
        return
    fi

    local file_time=$(stat -c %Y "$checkpoint_file" 2>/dev/null || stat -f %m "$checkpoint_file" 2>/dev/null || echo 0)
    echo "$checkpoint_file|$file_time"
}

# Function to check if agent is stalled
is_stalled() {
    local last_update_time="$1"
    [[ -z "$last_update_time" || "$last_update_time" == "0" ]] && return 0  # No checkpoint = stalled

    local now=$(date +%s)
    local age=$((now - last_update_time))

    if [[ $age -gt $STALL_THRESHOLD_SECONDS ]]; then
        return 0  # Stalled
    fi
    return 1  # Active
}

# Function to extract status from checkpoint (latest line in log file)
get_checkpoint_status() {
    local checkpoint_file="$1"
    [[ ! -f "$checkpoint_file" ]] && echo "unknown" && return

    # Format: timestamp|phase|status|message
    local status=$(tail -n 1 "$checkpoint_file" 2>/dev/null | cut -d'|' -f3 || echo "unknown")
    echo "$status"
}

# Function to extract phase from checkpoint (latest line in log file)
get_checkpoint_phase() {
    local checkpoint_file="$1"
    [[ ! -f "$checkpoint_file" ]] && echo "unknown" && return

    # Format: timestamp|phase|status|message
    local phase=$(tail -n 1 "$checkpoint_file" 2>/dev/null | cut -d'|' -f2 || echo "unknown")
    echo "$phase"
}

# Discover all agents from checkpoint files
declare -A agents
shopt -s nullglob
for checkpoint_file in "$CHECKPOINT_DIR"/*.log; do
    [[ -f "$checkpoint_file" ]] || continue
    [[ "$checkpoint_file" == *"/.log" ]] && continue  # Skip .log file

    # Extract agent ID from filename (format: agent-id.log)
    filename=$(basename "$checkpoint_file" .log)
    agent_id="$filename"

    [[ -n "$agent_id" ]] && agents["$agent_id"]=1
done
shopt -u nullglob

# Check health of each agent
error_count=0
warn_count=0
healthy_count=0

# Temporarily allow unbound variables to check array length
set +u
agent_count=${#agents[@]}
set -u

if [[ $agent_count -eq 0 ]]; then
    log_info "No agents found (no checkpoints in $CHECKPOINT_DIR)"
else
    for agent_id in "${!agents[@]}"; do
        checkpoint_info=$(get_latest_checkpoint "$agent_id")
        checkpoint_file=$(echo "$checkpoint_info" | cut -d'|' -f1)
        last_update_time=$(echo "$checkpoint_info" | cut -d'|' -f2)

        if [[ -z "$checkpoint_file" || ! -f "$checkpoint_file" ]]; then
            warn_count=$((warn_count + 1))
            log_warn "Agent $agent_id: No checkpoint found"
            continue
        fi

        status=$(get_checkpoint_status "$checkpoint_file")
        phase=$(get_checkpoint_phase "$checkpoint_file")

        # Check for ERROR status
        if [[ "$status" == "error" || "$status" == "ERROR" ]]; then
            error_count=$((error_count + 1))
            log_error "Agent $agent_id: ERROR status in phase '$phase'"
            log_error "  Checkpoint: $checkpoint_file"
            continue
        fi

        # Check for stalled agent
        if is_stalled "$last_update_time"; then
            now=$(date +%s)
            age=$((now - last_update_time))
            age_min=$((age / 60))

            warn_count=$((warn_count + 1))
            log_warn "Agent $agent_id: Stalled (no update for ${age_min}m)"
            log_warn "  Last status: $status, phase: $phase"
            log_warn "  Last checkpoint: $checkpoint_file"
            continue
        fi

        # Agent is healthy
        healthy_count=$((healthy_count + 1))
        log_healthy "Agent $agent_id: Active ($status, $phase)"
    done

    # Summary
    log_info "Health summary: $healthy_count healthy, $warn_count warnings, $error_count errors"
fi

# Always exit 0 (informational only, never blocks)
exit 0
