#!/bin/bash
# Critic Feedback System - Check for pending feedback
# Usage: ./scripts/feedback-check.sh <agentId>
# Returns JSON array of pending feedback, exits 0 if feedback exists, 1 if none

set -euo pipefail

# Validate arguments
if [ $# -lt 1 ]; then
  echo "Usage: $0 <agentId>" >&2
  exit 1
fi

AGENT_ID="$1"
FEEDBACK_DIR="/home/alton/Sartor-claude-network/data/feedback"

# Ensure directory exists
mkdir -p "$FEEDBACK_DIR"

# Find all feedback files for this agent
FEEDBACK_FILES=$(find "$FEEDBACK_DIR" -name "${AGENT_ID}-*.json" 2>/dev/null || true)

if [ -z "$FEEDBACK_FILES" ]; then
  # No feedback files at all
  echo "[]"
  exit 1
fi

# Collect unacknowledged feedback
PENDING_FEEDBACK=()

while IFS= read -r FEEDBACK_FILE; do
  if [ -f "$FEEDBACK_FILE" ]; then
    # Check if acknowledged is false
    ACKNOWLEDGED=$(python3 -c "
import json
import sys
try:
    with open('$FEEDBACK_FILE', 'r') as f:
        data = json.load(f)
    print(str(data.get('acknowledged', False)).lower())
except:
    print('true')
" 2>/dev/null || echo "true")

    if [ "$ACKNOWLEDGED" = "false" ]; then
      # Read the full feedback JSON
      FEEDBACK_JSON=$(<"$FEEDBACK_FILE")
      PENDING_FEEDBACK+=("$FEEDBACK_JSON")
    fi
  fi
done <<< "$FEEDBACK_FILES"

# Build JSON array
if [ ${#PENDING_FEEDBACK[@]} -eq 0 ]; then
  echo "[]"
  exit 1
else
  echo -n "["
  for i in "${!PENDING_FEEDBACK[@]}"; do
    if [ $i -gt 0 ]; then
      echo -n ","
    fi
    echo -n "${PENDING_FEEDBACK[$i]}"
  done
  echo "]"
  exit 0
fi
