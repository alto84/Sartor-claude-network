#!/bin/bash
# Wake Messaging System - Send wake messages to orchestrator
# Inspired by Anthropic's December 2025 async agents feature
# Usage: ./scripts/wake.sh <agentId> <messageType> <message> [priority]

set -euo pipefail

# Validate arguments
if [ $# -lt 3 ]; then
  echo "Usage: $0 <agentId> <messageType> <message> [priority]" >&2
  echo "" >&2
  echo "Parameters:" >&2
  echo "  agentId      - Agent sending the wake message" >&2
  echo "  messageType  - COMPLETE, BLOCKED, FINDING, ERROR" >&2
  echo "  message      - The wake message content" >&2
  echo "  priority     - normal, high, critical (default: normal)" >&2
  exit 1
fi

AGENT_ID="$1"
MESSAGE_TYPE="$2"
MESSAGE="$3"
PRIORITY="${4:-normal}"

# Validate message type
case "$MESSAGE_TYPE" in
  COMPLETE|BLOCKED|FINDING|ERROR)
    ;;
  *)
    echo "Error: Invalid message type '$MESSAGE_TYPE'" >&2
    echo "Must be: COMPLETE, BLOCKED, FINDING, or ERROR" >&2
    exit 1
    ;;
esac

# Validate priority
case "$PRIORITY" in
  normal|high|critical)
    ;;
  *)
    echo "Error: Invalid priority '$PRIORITY'" >&2
    echo "Must be: normal, high, or critical" >&2
    exit 1
    ;;
esac

WAKE_DIR="/home/alton/Sartor-claude-network/data/wake"
URGENT_DIR="$WAKE_DIR/URGENT"
STATUS_DIR="/home/alton/Sartor-claude-network/data/agent-status"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EPOCH=$(date +%s)

# Generate unique wake ID
RANDOM_SUFFIX=$(head -c 6 /dev/urandom | xxd -p | cut -c1-6)
WAKE_ID="wake-${EPOCH}-${RANDOM_SUFFIX}"

# Ensure directories exist
mkdir -p "$WAKE_DIR"
mkdir -p "$URGENT_DIR"
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

# Create wake message filename
WAKE_FILE="${WAKE_DIR}/${EPOCH}-${AGENT_ID}.json"

# Write wake message to file
cat > "$WAKE_FILE" <<EOF
{
  "wakeId": "$WAKE_ID",
  "agentId": "$AGENT_ID",
  "type": "$MESSAGE_TYPE",
  "message": "$ESCAPED_MESSAGE",
  "priority": "$PRIORITY",
  "timestamp": "$TIMESTAMP",
  "acknowledged": false
}
EOF

# If critical priority, also write to URGENT directory
if [ "$PRIORITY" = "critical" ]; then
  URGENT_FILE="${URGENT_DIR}/${EPOCH}-${AGENT_ID}.json"
  cp "$WAKE_FILE" "$URGENT_FILE"
fi

# Update agent status with wakeMessageSent flag
STATUS_FILE="$STATUS_DIR/${AGENT_ID}.json"

(
  flock -x 200 || exit 1

  if [ -f "$STATUS_FILE" ]; then
    # Read existing file
    CONTENT=$(<"$STATUS_FILE")

    # Update wakeMessageSent flag
    if echo "$CONTENT" | grep -q '"wakeMessageSent":'; then
      # Replace existing value
      CONTENT=$(echo "$CONTENT" | perl -pe 's/"wakeMessageSent":\s*(true|false)/"wakeMessageSent": true/')
    else
      # Add new field before closing brace
      CONTENT=$(echo "$CONTENT" | sed 's/}$/,\n  "wakeMessageSent": true\n}/')
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
  "wakeMessageSent": true,
  "lastUpdate": "$TIMESTAMP",
  "findings": []
}
EOF
  fi
) 200>"$STATUS_FILE.lock"

# Output confirmation
echo "{\"wakeId\":\"$WAKE_ID\",\"agentId\":\"$AGENT_ID\",\"type\":\"$MESSAGE_TYPE\",\"priority\":\"$PRIORITY\",\"status\":\"sent\"}"

exit 0
