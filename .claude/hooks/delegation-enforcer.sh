#!/bin/bash
# delegation-enforcer.sh - BLOCKS orchestrator from doing implementation work
# Upgraded from delegation-reminder.sh to use exit 2 (blocking) instead of exit 0
# Runs as a preToolUse hook to prevent direct execution by orchestrator

set -euo pipefail

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Track which tool is being used
TOOL_NAME="${1:-unknown}"
TOOL_CONTEXT="${2:-}"

# Function to check if this is a subagent (exempted from enforcement)
is_subagent() {
    # Method 1: Environment variable (works if set in same shell)
    if [[ -n "${CLAUDE_AGENT_ROLE:-}" ]]; then
        return 0  # Is subagent
    fi

    # Method 2: Marker file (works across shell invocations)
    # Subagents create this file as their first action
    local marker_file="${REPO_ROOT}/.claude/.subagent-active"
    if [[ -f "$marker_file" ]]; then
        # Check if marker is recent (within last 5 minutes)
        local now=$(date +%s)
        local file_time=$(stat -c %Y "$marker_file" 2>/dev/null || echo 0)
        local age=$((now - file_time))
        if [[ $age -lt 300 ]]; then
            return 0  # Is active subagent
        fi
    fi

    # Method 3: Check for Task-spawned context indicators
    # Claude Code Task tool may set specific variables
    if [[ -n "${CLAUDE_TASK_ID:-}" ]] || [[ -n "${ANTHROPIC_AGENT_ID:-}" ]]; then
        return 0  # Is subagent in Task context
    fi

    return 1  # Is orchestrator
}

# Function to check if this is substantial work requiring delegation
is_substantial_work() {
    local tool="$1"
    local context="$2"

    # Substantial work indicators:
    # - Editing/writing to src/, lib/, or services/ directories
    # - Implementation work that should be done by IMPLEMENTER subagents

    case "$tool" in
        "Edit"|"Write")
            # Check if editing implementation files (not just config/bootstrap)
            if [[ "$context" =~ (src/|lib/|services/) ]]; then
                return 0  # This is substantial
            fi
            ;;
    esac

    return 1  # Not substantial
}

# Function to print blocking error message
print_block_message() {
    local tool="$1"
    cat >&2 << 'BLOCKED'

╔════════════════════════════════════════════════════════════════╗
║                      OPERATION BLOCKED                         ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  ⛔ Orchestrator cannot edit implementation files directly.   ║
║                                                                ║
║  You are the ORCHESTRATOR. Your role is COORDINATION.         ║
║                                                                ║
║  REQUIRED ACTION:                                             ║
║  • Use the Task tool to delegate to a subagent                ║
║  • Assign role: IMPLEMENTER                                   ║
║  • Define scope, constraints, and expected output             ║
║                                                                ║
║  BLOCKED DIRECTORIES:                                         ║
║  • src/    - Source code implementation                       ║
║  • lib/    - Library code                                     ║
║  • services/ - Service implementations                        ║
║                                                                ║
║  Template: .claude/SPAWNING_TEMPLATE.md                       ║
║                                                                ║
║  This is ENFORCED. The operation will not proceed.            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

BLOCKED
}

# Main logic
main() {
    # Exempt subagents from enforcement
    if is_subagent; then
        # Subagent - allow operation
        exit 0
    fi

    # Check if orchestrator is attempting substantial work
    if is_substantial_work "$TOOL_NAME" "$TOOL_CONTEXT"; then
        # BLOCK the operation
        print_block_message "$TOOL_NAME"
        exit 2  # Exit code 2 = BLOCK (prevents tool execution)
    fi

    # Not substantial work - allow operation
    exit 0
}

main
