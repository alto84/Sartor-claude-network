#!/bin/bash
# Hook: PostToolUse (matcher: Task)
# Purpose: Log agent spawning activity for audit trail
# Exit 0: Always (logging only, never blocks)

# Read the tool result JSON from stdin
TOOL_RESULT=$(cat)

# Extract relevant fields
TOOL_NAME=$(echo "$TOOL_RESULT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/')

# Only log Task tool calls
if [ "$TOOL_NAME" != "Task" ]; then
    exit 0
fi

# Ensure log directory exists
LOG_DIR="${SWARM_LOG_DIR:-.swarm/logs}"
mkdir -p "$LOG_DIR"

# Create log entry
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_FILE="$LOG_DIR/activity.log"

# Extract description if available
DESCRIPTION=$(echo "$TOOL_RESULT" | grep -o '"description"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
DESCRIPTION=${DESCRIPTION:-"Task spawned"}

# Append to log
cat >> "$LOG_FILE" << EOF
---
timestamp: $TIMESTAMP
event: agent_spawned
description: $DESCRIPTION
parent_request: ${SWARM_REQUEST_ID:-root}
session: $$
EOF

# Debug output (goes to stderr, visible in hooks debug mode)
echo "📝 Logged: $DESCRIPTION at $TIMESTAMP" >&2

exit 0
