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
    # Subagents have CLAUDE_AGENT_ROLE set in their environment
    if [[ -n "${CLAUDE_AGENT_ROLE:-}" ]]; then
        return 0  # Is subagent
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
