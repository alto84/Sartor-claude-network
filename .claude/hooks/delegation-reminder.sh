#!/bin/bash
# delegation-reminder.sh - Reminds orchestrator to delegate before substantial work
# Runs as a preToolUse hook to catch attempts at direct execution

set -euo pipefail

# Configuration
REMINDER_FILE="/tmp/claude_delegation_reminder_last_shown"
COOLDOWN_SECONDS=300  # 5 minutes between reminders
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Track which tool is being used
TOOL_NAME="${1:-unknown}"
TOOL_CONTEXT="${2:-}"

# Function to check if we should show reminder
should_show_reminder() {
    # Check if reminder file exists and is recent
    if [[ -f "$REMINDER_FILE" ]]; then
        local last_shown=$(cat "$REMINDER_FILE")
        local current_time=$(date +%s)
        local elapsed=$((current_time - last_shown))

        if [[ $elapsed -lt $COOLDOWN_SECONDS ]]; then
            return 1  # Don't show (within cooldown)
        fi
    fi

    return 0  # Show reminder
}

# Function to update reminder timestamp
update_reminder_timestamp() {
    date +%s > "$REMINDER_FILE"
}

# Function to check if this is substantial work
is_substantial_work() {
    local tool="$1"
    local context="$2"

    # Substantial work indicators:
    # - Multiple file edits in sequence
    # - Complex search patterns
    # - Implementation work

    case "$tool" in
        "Edit"|"Write")
            # Check if editing implementation files (not just config/bootstrap)
            if [[ "$context" =~ (src/|lib/|services/) ]]; then
                return 0  # This is substantial
            fi
            ;;
        "Grep"|"Glob")
            # Multiple searches in a row = probably researching to implement
            if [[ -f "/tmp/claude_search_count" ]]; then
                local count=$(cat /tmp/claude_search_count)
                if [[ $count -gt 2 ]]; then
                    return 0  # Multiple searches = substantial research
                fi
            fi
            echo $((${count:-0} + 1)) > /tmp/claude_search_count
            ;;
    esac

    return 1  # Not substantial
}

# Function to print delegation reminder
print_reminder() {
    cat >&2 << 'REMINDER'

╔════════════════════════════════════════════════════════════════╗
║              ORCHESTRATOR DELEGATION REMINDER                  ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  You are the ORCHESTRATOR. Your role is COORDINATION.         ║
║                                                                ║
║  Before doing substantial work directly, ask:                 ║
║  • Can a subagent do this?                                    ║
║  • Could this be parallelized?                                ║
║  • Am I synthesizing results, or doing direct execution?      ║
║                                                                ║
║  DELEGATE to subagents for:                                   ║
║  ✓ Codebase searches (Explore agent)                          ║
║  ✓ Implementation work (IMPLEMENTER agent)                    ║
║  ✓ Code audits (AUDITOR agent)                                ║
║  ✓ Multi-file edits (IMPLEMENTER agent)                       ║
║  ✓ Research tasks (general-purpose agent)                     ║
║                                                                ║
║  DO DIRECTLY only when:                                       ║
║  ✓ Simple one-line edits                                      ║
║  ✓ Synthesizing agent results                                 ║
║  ✓ Updating todo lists                                        ║
║  ✓ Coordination tasks                                         ║
║                                                                ║
║  Use Task tool to spawn subagents.                            ║
║  See: .claude/SPAWNING_TEMPLATE.md                            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

REMINDER
}

# Main logic
main() {
    # Check if this is substantial work
    if is_substantial_work "$TOOL_NAME" "$TOOL_CONTEXT"; then
        # Check if we should show reminder (not in cooldown)
        if should_show_reminder; then
            print_reminder
            update_reminder_timestamp
        fi
    fi

    # Always allow the operation (non-blocking)
    exit 0
}

main
