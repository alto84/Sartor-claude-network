#!/bin/bash
# Agent Status Update Helper
# Usage: ./scripts/status-update.sh <agentId> <key> <value>

set -euo pipefail

AGENT_ID="$1"
KEY="$2"
VALUE="$3"
STATUS_DIR="/home/alton/Sartor-claude-network/data/agent-status"
STATUS_FILE="$STATUS_DIR/${AGENT_ID}.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure directory exists
mkdir -p "$STATUS_DIR"

# JSON escape function - properly escape special characters
json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"  # Escape backslashes
  s="${s//\"/\\\"}"  # Escape quotes
  s="${s//$'\n'/\\n}"  # Escape newlines
  s="${s//$'\r'/\\r}"  # Escape carriage returns
  s="${s//$'\t'/\\t}"  # Escape tabs
  echo "$s"
}

# Update or create status file with flock
(
  flock -x 200 || exit 1

  if [ -f "$STATUS_FILE" ]; then
    # Read existing file
    CONTENT=$(<"$STATUS_FILE")

    if [ "$KEY" = "findings" ]; then
      # Append to findings array
      ESCAPED_VALUE=$(json_escape "$VALUE")
      # Insert into findings array (before closing bracket)
      if echo "$CONTENT" | grep -q '"findings": \[\]'; then
        # Empty array - add first item
        CONTENT=$(echo "$CONTENT" | sed "s/\"findings\": \[\]/\"findings\": [\"$ESCAPED_VALUE\"]/")
      else
        # Non-empty array - append item
        CONTENT=$(echo "$CONTENT" | sed "s/\"findings\": \[/\"findings\": [\"$ESCAPED_VALUE\", /")
      fi
    else
      # Update or add the key
      ESCAPED_VALUE=$(json_escape "$VALUE")
      if echo "$CONTENT" | grep -q "\"$KEY\":"; then
        # Key exists - replace value
        CONTENT=$(echo "$CONTENT" | perl -pe "s/\"$KEY\":\s*\"[^\"]*\"/\"$KEY\": \"$ESCAPED_VALUE\"/")
      else
        # Key doesn't exist - add it (find last property and add comma, then add new property)
        # Remove closing brace, add comma to last line if needed, add new property, add closing brace
        CONTENT=$(echo "$CONTENT" | sed 's/}$//' | sed '$s/$/,/' | sed "\$a\\  \"$KEY\": \"$ESCAPED_VALUE\"\n}")
      fi
    fi

    # Always update lastUpdate
    if echo "$CONTENT" | grep -q '"lastUpdate":'; then
      CONTENT=$(echo "$CONTENT" | perl -pe "s/\"lastUpdate\":\s*\"[^\"]*\"/\"lastUpdate\": \"$TIMESTAMP\"/")
    else
      CONTENT=$(echo "$CONTENT" | sed "s/}/,\n  \"lastUpdate\": \"$TIMESTAMP\"\n}/")
    fi

    echo "$CONTENT" > "$STATUS_FILE"
  else
    # Create new file
    ESCAPED_VALUE=$(json_escape "$VALUE")
    cat > "$STATUS_FILE" <<EOF
{
  "agentId": "$AGENT_ID",
  "$KEY": "$ESCAPED_VALUE",
  "lastUpdate": "$TIMESTAMP",
  "status": "active",
  "findings": []
}
EOF
  fi
) 200>"$STATUS_FILE.lock"

echo "{\"updated\":\"$KEY\",\"agent\":\"$AGENT_ID\"}"
