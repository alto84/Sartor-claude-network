#!/bin/bash
#
# Safety Check Hook for Claude Code
# Blocks dangerous bash operations before execution
#
# Exit codes:
#   0 - Safe to proceed
#   1 - Blocked (dangerous operation detected)
#
# Usage: safety-check.sh <command>

set -u

COMMAND="${1:-}"

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

log_block() {
    echo -e "${RED}[BLOCKED]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[CAUTION]${NC} $1" >&2
}

log_safe() {
    echo -e "${GREEN}[SAFE]${NC} $1" >&2
}

if [[ -z "$COMMAND" ]]; then
    log_block "No command provided"
    exit 1
fi

# ============================================================================
# Dangerous Operations
# ============================================================================

# Prevent force operations on main/master
if echo "$COMMAND" | grep -qE 'git push.*(--force|-f).*\b(main|master)\b'; then
    log_block "Force push to main/master is not allowed"
    echo "  Command: $COMMAND" >&2
    echo "  Use a feature branch or get explicit approval" >&2
    exit 1
fi

# Prevent destructive git operations without confirmation
DESTRUCTIVE_GIT=(
    'git reset --hard HEAD~'
    'git push --force'
    'git push -f'
    'git branch -D'
    'git clean -fd'
    'git reflog delete'
)

for dangerous_cmd in "${DESTRUCTIVE_GIT[@]}"; do
    if echo "$COMMAND" | grep -qF "$dangerous_cmd"; then
        log_block "Destructive git operation detected: $dangerous_cmd"
        echo "  Command: $COMMAND" >&2
        echo "  This operation is potentially dangerous" >&2
        exit 1
    fi
done

# Prevent recursive deletion of important directories
PROTECTED_DIRS=(
    "/home/user/Sartor-claude-network/.git"
    "/home/user/Sartor-claude-network/node_modules"
    "/home/user/Sartor-claude-network/.claude"
    "/"
    "/home"
    "/usr"
    "/etc"
)

for protected in "${PROTECTED_DIRS[@]}"; do
    if echo "$COMMAND" | grep -qE "rm\s+.*-r.*$protected"; then
        log_block "Attempt to recursively delete protected directory: $protected"
        echo "  Command: $COMMAND" >&2
        exit 1
    fi
done

# Prevent modification of system files
if echo "$COMMAND" | grep -qE '(chmod|chown).*/etc/|/usr/|/bin/|/sbin/'; then
    log_block "Attempt to modify system files"
    echo "  Command: $COMMAND" >&2
    exit 1
fi

# Prevent dangerous wildcard operations
if echo "$COMMAND" | grep -qE 'rm\s+.*\*|\s+rm\s+-rf\s+\*'; then
    log_block "Dangerous wildcard deletion detected"
    echo "  Command: $COMMAND" >&2
    echo "  Use explicit file paths instead of wildcards" >&2
    exit 1
fi

# Prevent data exfiltration patterns
if echo "$COMMAND" | grep -qE 'curl.*\|.*bash|wget.*\|.*sh'; then
    log_block "Pipe-to-shell pattern detected (potential security risk)"
    echo "  Command: $COMMAND" >&2
    echo "  Download and inspect scripts before executing" >&2
    exit 1
fi

# Prevent environment variable leaks
if echo "$COMMAND" | grep -qE 'env\s*\|.*curl|printenv.*\|.*curl'; then
    log_block "Potential environment variable exfiltration"
    echo "  Command: $COMMAND" >&2
    exit 1
fi

# Prevent Firebase key operations in unsafe contexts
if echo "$COMMAND" | grep -qE 'firebase.*delete|firebase.*database:remove'; then
    log_warn "Firebase deletion operation detected"
    echo "  Command: $COMMAND" >&2
    echo "  Ensure you have backups before proceeding" >&2
    # Warning only, not blocking
fi

# Prevent npm/yarn global installs without review
if echo "$COMMAND" | grep -qE '(npm|yarn)\s+(install|add)\s+-g'; then
    log_warn "Global package installation detected"
    echo "  Command: $COMMAND" >&2
    echo "  Consider using local installation instead" >&2
    # Warning only, not blocking
fi

# ============================================================================
# Command passes safety checks
# ============================================================================
log_safe "Command passed safety checks"
exit 0
