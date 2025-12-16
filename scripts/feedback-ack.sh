#!/bin/bash
# Critic Feedback System - Acknowledge feedback
# Usage: ./scripts/feedback-ack.sh <agentId> <feedbackId> [response]

set -euo pipefail

# Validate arguments
if [ $# -lt 2 ]; then
  echo "Usage: $0 <agentId> <feedbackId> [response]" >&2
  exit 1
fi

AGENT_ID="$1"
FEEDBACK_ID="$2"
RESPONSE="${3:-}"

FEEDBACK_DIR="/home/alton/Sartor-claude-network/data/feedback"
STATUS_DIR="/home/alton/Sartor-claude-network/data/agent-status"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# JSON escape function
json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"  # Escape backslashes
  s="${s//\"/\\\"}"  # Escape quotes
  s="${s//$'\n'/\\n}"  # Escape newlines
  s="${s//$'\r'/\\r}"  # Escape carriage returns
  s="${s//$'\t'/\\t}"  # Escape tabs
  echo "$s"
}

# Find the feedback file with this ID
FEEDBACK_FILE=$(grep -l "\"feedbackId\": \"$FEEDBACK_ID\"" "$FEEDBACK_DIR"/${AGENT_ID}-*.json 2>/dev/null | head -1 || true)

if [ -z "$FEEDBACK_FILE" ]; then
  echo "{\"error\":\"Feedback not found\",\"feedbackId\":\"$FEEDBACK_ID\"}" >&2
  exit 1
fi

# Update feedback file with Python for safe JSON manipulation
python3 - <<PYTHON_SCRIPT
import json
import sys
from pathlib import Path

feedback_file = "$FEEDBACK_FILE"
response = """$RESPONSE"""
timestamp = "$TIMESTAMP"

try:
    with open(feedback_file, 'r') as f:
        data = json.load(f)

    # Mark as acknowledged
    data['acknowledged'] = True
    data['acknowledgedAt'] = timestamp

    # Add response if provided
    if response:
        data['agentResponse'] = response

    # Write updated data
    with open(feedback_file, 'w') as f:
        json.dump(data, f, indent=2)

    print(json.dumps({"status": "acknowledged", "feedbackId": data.get("feedbackId")}))
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
    sys.exit(1)
PYTHON_SCRIPT

# Check if any unacknowledged feedback remains for this agent
REMAINING_FEEDBACK=$(find "$FEEDBACK_DIR" -name "${AGENT_ID}-*.json" -exec grep -l '"acknowledged": false' {} \; 2>/dev/null || true)

# Update agent status file
STATUS_FILE="$STATUS_DIR/${AGENT_ID}.json"

if [ -z "$REMAINING_FEEDBACK" ]; then
  # No more pending feedback - set pendingFeedback to false
  (
    flock -x 200 || exit 1

    if [ -f "$STATUS_FILE" ]; then
      CONTENT=$(<"$STATUS_FILE")

      # Update pendingFeedback flag
      if echo "$CONTENT" | grep -q '"pendingFeedback":'; then
        CONTENT=$(echo "$CONTENT" | perl -pe 's/"pendingFeedback":\s*(true|false)/"pendingFeedback": false/')
      fi

      # Update lastUpdate timestamp
      if echo "$CONTENT" | grep -q '"lastUpdate":'; then
        CONTENT=$(echo "$CONTENT" | perl -pe "s/\"lastUpdate\":\s*\"[^\"]*\"/\"lastUpdate\": \"$TIMESTAMP\"/")
      fi

      echo "$CONTENT" > "$STATUS_FILE"
    fi
  ) 200>"$STATUS_FILE.lock"
fi
