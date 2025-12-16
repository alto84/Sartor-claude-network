#!/bin/bash
# Critic Feedback System - Provide feedback to agents
# Usage: ./scripts/feedback.sh <agentId> <feedbackType> <message> [severity]
# Based on STELLA's Critic Agent pattern (arxiv:2507.02004)

set -euo pipefail

# Validate arguments
if [ $# -lt 3 ]; then
  echo "Usage: $0 <agentId> <feedbackType> <message> [severity]" >&2
  echo "  feedbackType: suggestion, correction, blocker, approval" >&2
  echo "  severity: info, warning, critical (default: info)" >&2
  exit 1
fi

AGENT_ID="$1"
FEEDBACK_TYPE="$2"
MESSAGE="$3"
SEVERITY="${4:-info}"

# Validate feedback type
case "$FEEDBACK_TYPE" in
  suggestion|correction|blocker|approval)
    ;;
  *)
    echo "Error: Invalid feedback type '$FEEDBACK_TYPE'" >&2
    echo "Must be: suggestion, correction, blocker, or approval" >&2
    exit 1
    ;;
esac

# Validate severity
case "$SEVERITY" in
  info|warning|critical)
    ;;
  *)
    echo "Error: Invalid severity '$SEVERITY'" >&2
    echo "Must be: info, warning, or critical" >&2
    exit 1
    ;;
esac

FEEDBACK_DIR="/home/alton/Sartor-claude-network/data/feedback"
STATUS_DIR="/home/alton/Sartor-claude-network/data/agent-status"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EPOCH=$(date +%s)

# Generate unique feedback ID
RANDOM_SUFFIX=$(head -c 6 /dev/urandom | xxd -p | cut -c1-6)
FEEDBACK_ID="fb-${EPOCH}-${RANDOM_SUFFIX}"

# Ensure directories exist
mkdir -p "$FEEDBACK_DIR"
mkdir -p "$STATUS_DIR"

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

ESCAPED_MESSAGE=$(json_escape "$MESSAGE")
# Use nanoseconds for uniqueness if multiple feedback items created in same second
NANO_SUFFIX=$(date +%N | cut -c1-6)
FEEDBACK_FILE="${FEEDBACK_DIR}/${AGENT_ID}-${EPOCH}-${NANO_SUFFIX}.json"

# Write feedback to file
cat > "$FEEDBACK_FILE" <<EOF
{
  "feedbackId": "$FEEDBACK_ID",
  "targetAgent": "$AGENT_ID",
  "type": "$FEEDBACK_TYPE",
  "severity": "$SEVERITY",
  "message": "$ESCAPED_MESSAGE",
  "timestamp": "$TIMESTAMP",
  "acknowledged": false
}
EOF

# Update agent status to set pendingFeedback: true
STATUS_FILE="$STATUS_DIR/${AGENT_ID}.json"

(
  flock -x 200 || exit 1

  if [ -f "$STATUS_FILE" ]; then
    # Read existing file
    CONTENT=$(<"$STATUS_FILE")

    # Update pendingFeedback flag
    if echo "$CONTENT" | grep -q '"pendingFeedback":'; then
      # Replace existing value
      CONTENT=$(echo "$CONTENT" | perl -pe 's/"pendingFeedback":\s*(true|false)/"pendingFeedback": true/')
    else
      # Add new field before closing brace
      CONTENT=$(echo "$CONTENT" | sed 's/}$/,\n  "pendingFeedback": true\n}/')
    fi

    # Update lastUpdate timestamp
    if echo "$CONTENT" | grep -q '"lastUpdate":'; then
      CONTENT=$(echo "$CONTENT" | perl -pe "s/\"lastUpdate\":\s*\"[^\"]*\"/\"lastUpdate\": \"$TIMESTAMP\"/")
    else
      CONTENT=$(echo "$CONTENT" | sed "s/}/,\n  \"lastUpdate\": \"$TIMESTAMP\"\n}/")
    fi

    echo "$CONTENT" > "$STATUS_FILE"
  else
    # Create new status file if it doesn't exist
    cat > "$STATUS_FILE" <<EOF
{
  "agentId": "$AGENT_ID",
  "status": "active",
  "pendingFeedback": true,
  "lastUpdate": "$TIMESTAMP",
  "findings": []
}
EOF
  fi
) 200>"$STATUS_FILE.lock"

# Output confirmation
echo "{\"feedbackId\":\"$FEEDBACK_ID\",\"targetAgent\":\"$AGENT_ID\",\"type\":\"$FEEDBACK_TYPE\",\"severity\":\"$SEVERITY\",\"status\":\"delivered\"}"
