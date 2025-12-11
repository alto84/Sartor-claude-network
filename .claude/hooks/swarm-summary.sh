#!/bin/bash
#
# Swarm Summary Hook for Claude Code
# Provides high-level overview of all agent activity
#
# Exit codes:
#   0 - Always (informational only, never blocks)
#
# Usage: swarm-summary.sh

set -u

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHECKPOINT_DIR="${REPO_ROOT}/data/checkpoints"
STATUS_DIR="${REPO_ROOT}/data/agent-status"
HANDOFF_DIR="${REPO_ROOT}/data/handoffs"
STALL_THRESHOLD_SECONDS=120  # 2 minutes

# Color codes
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Header
echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}" >&2
echo -e "${BOLD}${CYAN}║                    SWARM STATUS SUMMARY                       ║${NC}" >&2
echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}" >&2
echo "" >&2

# Create directories if they don't exist
mkdir -p "$CHECKPOINT_DIR" "$STATUS_DIR" "$HANDOFF_DIR" 2>/dev/null || true

# Function to get latest checkpoint info for an agent
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

# Function to categorize agent status
categorize_agent() {
    local checkpoint_file="$1"
    local last_update_time="$2"

    [[ ! -f "$checkpoint_file" ]] && echo "unknown" && return

    # Format: timestamp|phase|status|message
    local status=$(tail -n 1 "$checkpoint_file" 2>/dev/null | cut -d'|' -f3 || echo "unknown")

    # Check for error
    if [[ "$status" == "error" || "$status" == "ERROR" ]]; then
        echo "error"
        return
    fi

    # Check for completion
    if [[ "$status" == "complete" || "$status" == "completed" || "$status" == "done" ]]; then
        echo "completed"
        return
    fi

    # Check for stalled
    local now=$(date +%s)
    local age=$((now - last_update_time))
    if [[ $age -gt $STALL_THRESHOLD_SECONDS ]]; then
        echo "stalled"
        return
    fi

    # Otherwise active
    echo "active"
}

# Function to get progress from checkpoint (estimate based on phase)
get_progress() {
    local checkpoint_file="$1"
    [[ ! -f "$checkpoint_file" ]] && echo "0" && return

    # Format: timestamp|phase|status|message
    local phase=$(tail -n 1 "$checkpoint_file" 2>/dev/null | cut -d'|' -f2 || echo "unknown")
    local status=$(tail -n 1 "$checkpoint_file" 2>/dev/null | cut -d'|' -f3 || echo "unknown")

    # Estimate progress based on phase/status
    case "$phase" in
        research|planning) echo "20" ;;
        implementation|coding) echo "50" ;;
        testing|verification) echo "80" ;;
        complete|done) echo "100" ;;
        *) echo "0" ;;
    esac
}

# Function to get phase from checkpoint
get_phase() {
    local checkpoint_file="$1"
    [[ ! -f "$checkpoint_file" ]] && echo "unknown" && return

    # Format: timestamp|phase|status|message
    local phase=$(tail -n 1 "$checkpoint_file" 2>/dev/null | cut -d'|' -f2 || echo "unknown")
    echo "$phase"
}

# Discover all agents
declare -A agents
shopt -s nullglob
for checkpoint_file in "$CHECKPOINT_DIR"/*.log; do
    [[ -f "$checkpoint_file" ]] || continue
    [[ "$checkpoint_file" == *"/.log" ]] && continue  # Skip .log file

    filename=$(basename "$checkpoint_file" .log)
    agent_id="$filename"

    [[ -n "$agent_id" ]] && agents["$agent_id"]=1
done
shopt -u nullglob

# Count agents by status
active_count=0
completed_count=0
stalled_count=0
error_count=0
total_progress=0
agent_count=0

# Track agents by category for detailed display
declare -a active_agents
declare -a completed_agents
declare -a stalled_agents
declare -a error_agents

# Temporarily allow unbound variables to check array length
set +u
total_agents=${#agents[@]}
set -u

if [[ $total_agents -eq 0 ]]; then
    echo -e "${YELLOW}No agents found${NC}" >&2
else
    for agent_id in "${!agents[@]}"; do
        checkpoint_info=$(get_latest_checkpoint "$agent_id")
        checkpoint_file=$(echo "$checkpoint_info" | cut -d'|' -f1)
        last_update_time=$(echo "$checkpoint_info" | cut -d'|' -f2)

        [[ -z "$checkpoint_file" || ! -f "$checkpoint_file" ]] && continue

        category=$(categorize_agent "$checkpoint_file" "$last_update_time")
        progress=$(get_progress "$checkpoint_file")
        phase=$(get_phase "$checkpoint_file")

        # Accumulate total progress
        total_progress=$(awk "BEGIN {print $total_progress + $progress}")
        agent_count=$((agent_count + 1))

        # Categorize
        case "$category" in
            active)
                active_count=$((active_count + 1))
                active_agents+=("$agent_id|$phase|$progress")
                ;;
            completed)
                completed_count=$((completed_count + 1))
                completed_agents+=("$agent_id|$phase|$progress")
                ;;
            stalled)
                stalled_count=$((stalled_count + 1))
                stalled_agents+=("$agent_id|$phase|$progress")
                ;;
            error)
                error_count=$((error_count + 1))
                error_agents+=("$agent_id|$phase|$progress")
                ;;
        esac
    done

    # Overall metrics
    echo -e "${BOLD}Overall Metrics:${NC}" >&2
    echo -e "  Total agents: $agent_count" >&2

    if [[ $agent_count -gt 0 ]]; then
        avg_progress=$(awk "BEGIN {printf \"%.1f\", $total_progress / $agent_count}")
        echo -e "  Average progress: ${avg_progress}%" >&2
    fi

    echo "" >&2

    # Status breakdown
    echo -e "${BOLD}Status Breakdown:${NC}" >&2
    [[ $active_count -gt 0 ]] && echo -e "  ${GREEN}Active:${NC} $active_count" >&2
    [[ $completed_count -gt 0 ]] && echo -e "  ${BLUE}Completed:${NC} $completed_count" >&2
    [[ $stalled_count -gt 0 ]] && echo -e "  ${YELLOW}Stalled:${NC} $stalled_count" >&2
    [[ $error_count -gt 0 ]] && echo -e "  ${RED}Error:${NC} $error_count" >&2

    echo "" >&2

    # Active agents details
    set +u
    active_agent_count=${#active_agents[@]}
    set -u
    if [[ $active_agent_count -gt 0 ]]; then
        echo -e "${BOLD}${GREEN}Active Agents:${NC}" >&2
        for agent_info in "${active_agents[@]}"; do
            agent_id=$(echo "$agent_info" | cut -d'|' -f1)
            phase=$(echo "$agent_info" | cut -d'|' -f2)
            progress=$(echo "$agent_info" | cut -d'|' -f3)
            printf "  • %-25s [%-15s] %.1f%%\n" "$agent_id" "$phase" "$progress" >&2
        done
        echo "" >&2
    fi

    # Completed agents
    set +u
    completed_agent_count=${#completed_agents[@]}
    set -u
    if [[ $completed_agent_count -gt 0 ]]; then
        echo -e "${BOLD}${BLUE}Completed Agents:${NC}" >&2
        for agent_info in "${completed_agents[@]}"; do
            agent_id=$(echo "$agent_info" | cut -d'|' -f1)
            phase=$(echo "$agent_info" | cut -d'|' -f2)
            printf "  • %-25s [%-15s]\n" "$agent_id" "$phase" >&2
        done
        echo "" >&2
    fi

    # Stalled agents (warning)
    set +u
    stalled_agent_count=${#stalled_agents[@]}
    set -u
    if [[ $stalled_agent_count -gt 0 ]]; then
        echo -e "${BOLD}${YELLOW}Stalled Agents (>2min):${NC}" >&2
        for agent_info in "${stalled_agents[@]}"; do
            agent_id=$(echo "$agent_info" | cut -d'|' -f1)
            phase=$(echo "$agent_info" | cut -d'|' -f2)
            progress=$(echo "$agent_info" | cut -d'|' -f3)
            printf "  ⚠ %-25s [%-15s] %.1f%%\n" "$agent_id" "$phase" "$progress" >&2
        done
        echo "" >&2
    fi

    # Error agents (critical)
    set +u
    error_agent_count=${#error_agents[@]}
    set -u
    if [[ $error_agent_count -gt 0 ]]; then
        echo -e "${BOLD}${RED}Error Agents:${NC}" >&2
        for agent_info in "${error_agents[@]}"; do
            agent_id=$(echo "$agent_info" | cut -d'|' -f1)
            phase=$(echo "$agent_info" | cut -d'|' -f2)
            printf "  ✗ %-25s [%-15s]\n" "$agent_id" "$phase" >&2
        done
        echo "" >&2
    fi
fi

# Check for recent handoffs
handoff_count=$(find "$HANDOFF_DIR" -name "*.json" -type f 2>/dev/null | wc -l | xargs)
if [[ $handoff_count -gt 0 ]]; then
    echo -e "${BOLD}Handoffs:${NC} $handoff_count pending" >&2
    echo "" >&2
fi

# Footer
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}" >&2

# Always exit 0 (informational only)
exit 0
