#!/bin/bash
# Hook: PreToolUse (matcher: Task)
# Purpose: Validate Task tool calls for proper agent configuration
# Exit 0: Allow, Exit 2: Block

# Read the tool call JSON from stdin
TOOL_CALL=$(cat)

# Extract relevant fields
TOOL_NAME=$(echo "$TOOL_CALL" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/')

# Only validate Task tool calls
if [ "$TOOL_NAME" != "Task" ]; then
    exit 0
fi

# Extract prompt from tool_input
PROMPT=$(echo "$TOOL_CALL" | grep -o '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')

# Validation checks
ERRORS=()

# Check 1: Warn if spawning without context
if ! echo "$PROMPT" | grep -qi "context\|objective\|task"; then
    # This is a warning, not a block
    echo "⚠️  Consider providing more context to spawned agent" >&2
fi

# Check 2: Block if trying to spawn too many agents rapidly
# (Check for rate limiting file)
RATE_FILE="/tmp/swarm-spawn-rate-$$"
SPAWN_COUNT=$(cat "$RATE_FILE" 2>/dev/null || echo "0")
SPAWN_COUNT=$((SPAWN_COUNT + 1))
echo "$SPAWN_COUNT" > "$RATE_FILE"

if [ "$SPAWN_COUNT" -gt 10 ]; then
    cat >&2 << EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  SPAWN RATE LIMIT REACHED

You've spawned $SPAWN_COUNT agents in this session.
Maximum concurrent: 10

Consider:
1. Wait for existing agents to complete
2. Batch related work into fewer agents
3. Use sequential processing instead
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
    exit 2
fi

# All checks passed
exit 0
