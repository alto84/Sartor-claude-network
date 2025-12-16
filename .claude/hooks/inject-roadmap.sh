#!/bin/bash

# inject-roadmap.sh - SessionStart hook to initialize agents with role context
# Detects agent role and loads role-specific context from AGENT_ROLES.md
# Shows relevant section of REVISED_ROADMAP.md for that role

set -euo pipefail

REPO_ROOT="/home/user/Sartor-claude-network"
AGENT_ROLES_FILE="$REPO_ROOT/.claude/AGENT_ROLES.md"
ROADMAP_FILE="$REPO_ROOT/REVISED_ROADMAP.md"

# Detect agent role from environment or first argument
AGENT_ROLE="${AGENT_ROLE:-${1:-}}"

# Default to Implementer if no role detected
if [[ -z "$AGENT_ROLE" ]]; then
    AGENT_ROLE="Implementer"
fi

# Normalize role name (capitalize first letter)
AGENT_ROLE="$(echo "$AGENT_ROLE" | sed 's/^./\U&/')"

print_context() {
    local role="$1"

    >&2 echo ""
    >&2 echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    >&2 echo "[AGENT CONTEXT: $role]"
    >&2 echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Extract role section from AGENT_ROLES.md (approx 50 tokens)
    if [[ -f "$AGENT_ROLES_FILE" ]]; then
        awk "
            /^## [0-9]+\. $role/,/^---/ {
                if (/^---/) exit
                print
            }
        " "$AGENT_ROLES_FILE" | head -20 | sed 's/^/  /'
    fi

    >&2 echo ""
    >&2 echo "[RELEVANT ROADMAP SECTION]"

    # Show current phase from roadmap (first non-completed phase)
    if [[ -f "$ROADMAP_FILE" ]]; then
        awk '
            /^## Phase [0-9]/ {
                if (found) exit
                if (/✓/) next  # Skip completed phases
                found=1
                print
            }
            found && !/^---/ {
                if (NR > 10) exit
                print
            }
        ' "$ROADMAP_FILE" | sed 's/^/  /'
    fi

    >&2 echo ""
    >&2 echo "Run with AGENT_ROLE=Planner|Implementer|Auditor|Cleaner"
    >&2 echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    >&2 echo ""
}

print_context "$AGENT_ROLE"
