#!/usr/bin/env bash
# Stop hook
# Suggests /reflect skill if the session had >= 5 tool calls
# Always exits 0

DATA_DIR="/c/Users/alto8/Sartor-claude-network/data/home-agent"
TOOL_COUNT_FILE="$DATA_DIR/session-tool-count.tmp"

TOOL_COUNT=0
if [ -f "$TOOL_COUNT_FILE" ]; then
  TOOL_COUNT=$(cat "$TOOL_COUNT_FILE" 2>/dev/null || echo 0)
fi

if [ "$TOOL_COUNT" -ge 5 ] 2>/dev/null; then
  echo "Complex task detected ($TOOL_COUNT tool calls). Consider running /reflect for skill extraction." >&2
fi

exit 0
