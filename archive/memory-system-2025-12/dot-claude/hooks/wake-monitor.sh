#!/bin/bash
#
# Wake Monitor Hook for Claude Code
# Checks for wake messages from background agents
#
# Exit codes:
#   0 - Always (informational only, never blocks)
#
# Usage: wake-monitor.sh
#
# Updated: 2025-12-11 - Fixed to parse JSON format from wake.sh

set -u

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WAKE_DIR="${REPO_ROOT}/data/wake"
URGENT_DIR="${WAKE_DIR}/URGENT"
MAX_AGE_SECONDS=600  # 10 minutes

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[WAKE]${NC} $1" >&2
}

log_urgent() {
    echo -e "${RED}[URGENT WAKE]${NC} $1" >&2
}

log_pending() {
    echo -e "${YELLOW}[PENDING]${NC} $1" >&2
}

# Create wake directories if they don't exist
mkdir -p "$WAKE_DIR" "$URGENT_DIR" 2>/dev/null || true

# Function to check if file is recent (within MAX_AGE_SECONDS)
is_recent() {
    local file="$1"
    local now=$(date +%s)
    local file_time=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null || echo 0)
    local age=$((now - file_time))

    if [[ $age -le $MAX_AGE_SECONDS ]]; then
        return 0  # Recent
    fi
    return 1  # Old
}

# Function to extract wake message info from JSON file
# Format: {"wakeId":"...", "agentId":"...", "type":"...", "message":"...", "priority":"...", "timestamp":"...", "acknowledged":false}
extract_wake_info_json() {
    local file="$1"
    local agent_id=""
    local message=""
    local msg_type=""
    local priority=""
    local acknowledged=""

    if [[ -f "$file" ]]; then
        # Use grep/sed for JSON parsing (more portable than jq)
        agent_id=$(grep -o '"agentId"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" 2>/dev/null | sed 's/.*:.*"\([^"]*\)"/\1/' || echo "unknown")
        message=$(grep -o '"message"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" 2>/dev/null | sed 's/.*:.*"\([^"]*\)"/\1/' || echo "no message")
        msg_type=$(grep -o '"type"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" 2>/dev/null | sed 's/.*:.*"\([^"]*\)"/\1/' || echo "UNKNOWN")
        priority=$(grep -o '"priority"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" 2>/dev/null | sed 's/.*:.*"\([^"]*\)"/\1/' || echo "normal")
        acknowledged=$(grep -o '"acknowledged"[[:space:]]*:[[:space:]]*[^,}]*' "$file" 2>/dev/null | sed 's/.*:[[:space:]]*//' || echo "false")
    fi

    echo "$agent_id|$message|$msg_type|$priority|$acknowledged"
}

# Check for urgent wake messages (critical priority in URGENT dir)
urgent_count=0
if [[ -d "$URGENT_DIR" ]]; then
    shopt -s nullglob
    for wake_file in "$URGENT_DIR"/*.json; do
        [[ -f "$wake_file" ]] || continue

        if is_recent "$wake_file"; then
            info=$(extract_wake_info_json "$wake_file")
            agent_id=$(echo "$info" | cut -d'|' -f1)
            message=$(echo "$info" | cut -d'|' -f2)
            msg_type=$(echo "$info" | cut -d'|' -f3)
            acknowledged=$(echo "$info" | cut -d'|' -f5)

            # Skip acknowledged messages
            [[ "$acknowledged" == "true" ]] && continue

            urgent_count=$((urgent_count + 1))
            log_urgent "[$msg_type] from $agent_id: $message"
            log_urgent "  File: $wake_file"
        fi
    done
    shopt -u nullglob
fi

# Check for normal wake messages
pending_count=0
if [[ -d "$WAKE_DIR" ]]; then
    shopt -s nullglob
    for wake_file in "$WAKE_DIR"/*.json; do
        [[ -f "$wake_file" ]] || continue

        # Skip if in URGENT subdirectory
        [[ "$wake_file" == *"/URGENT/"* ]] && continue

        if is_recent "$wake_file"; then
            info=$(extract_wake_info_json "$wake_file")
            agent_id=$(echo "$info" | cut -d'|' -f1)
            message=$(echo "$info" | cut -d'|' -f2)
            msg_type=$(echo "$info" | cut -d'|' -f3)
            priority=$(echo "$info" | cut -d'|' -f4)
            acknowledged=$(echo "$info" | cut -d'|' -f5)

            # Skip acknowledged messages
            [[ "$acknowledged" == "true" ]] && continue

            # If critical priority, count as urgent instead
            if [[ "$priority" == "critical" ]]; then
                urgent_count=$((urgent_count + 1))
                log_urgent "[$msg_type] from $agent_id: $message"
                log_urgent "  File: $wake_file"
            else
                pending_count=$((pending_count + 1))
                log_pending "[$msg_type] from $agent_id: $message"
                log_pending "  File: $wake_file"
            fi
        fi
    done
    shopt -u nullglob
fi

# Summary
total=$((urgent_count + pending_count))
if [[ $total -gt 0 ]]; then
    if [[ $urgent_count -gt 0 ]]; then
        log_urgent "Summary: $urgent_count urgent, $pending_count pending wake messages"
    else
        log_pending "Summary: $pending_count pending wake messages"
    fi
else
    log_info "No recent wake messages (checked last $MAX_AGE_SECONDS seconds)"
fi

# Always exit 0 (informational only, never blocks)
exit 0
