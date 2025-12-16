#!/bin/bash
# Read all agent statuses

STATUS_DIR="/home/alton/Sartor-claude-network/data/agent-status"

echo "=== AGENT STATUS ==="
shopt -s nullglob
for f in "$STATUS_DIR"/*.json; do

  # Extract fields using grep and sed (without jq)
  STATUS=$(grep -o '"status":[[:space:]]*"[^"]*"' "$f" | sed -E 's/"status":[[:space:]]*"([^"]*)"/\1/')
  AGENT_ID=$(grep -o '"agentId":[[:space:]]*"[^"]*"' "$f" | sed -E 's/"agentId":[[:space:]]*"([^"]*)"/\1/')
  TASK=$(grep -o '"currentTask":[[:space:]]*"[^"]*"' "$f" | sed -E 's/"currentTask":[[:space:]]*"([^"]*)"/\1/')

  # Default to "idle" if no task
  TASK=${TASK:-idle}

  echo "[$STATUS] $AGENT_ID: $TASK"
done
