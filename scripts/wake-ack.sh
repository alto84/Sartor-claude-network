#!/bin/bash
# Wake Messaging System - Acknowledge a wake message
# Usage: ./scripts/wake-ack.sh <wakeId>

set -euo pipefail

# Validate arguments
if [ $# -lt 1 ]; then
  echo "Usage: $0 <wakeId>" >&2
  exit 1
fi

WAKE_ID="$1"

WAKE_DIR="/home/alton/Sartor-claude-network/data/wake"
URGENT_DIR="$WAKE_DIR/URGENT"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Find the wake file with this ID (check both directories)
WAKE_FILE=$(grep -l "\"wakeId\": \"$WAKE_ID\"" "$WAKE_DIR"/*.json 2>/dev/null | head -1 || true)

if [ -z "$WAKE_FILE" ]; then
  echo "{\"error\":\"Wake message not found\",\"wakeId\":\"$WAKE_ID\"}" >&2
  exit 1
fi

# Extract agent ID from the wake message
AGENT_ID=$(python3 -c "
import json
import sys
try:
    with open('$WAKE_FILE', 'r') as f:
        data = json.load(f)
    print(data.get('agentId', ''))
except:
    print('')
" 2>/dev/null || echo "")

if [ -z "$AGENT_ID" ]; then
  echo "{\"error\":\"Could not extract agentId from wake message\",\"wakeId\":\"$WAKE_ID\"}" >&2
  exit 1
fi

# Update wake file with Python for safe JSON manipulation
python3 - <<PYTHON_SCRIPT
import json
import sys
from pathlib import Path

wake_file = "$WAKE_FILE"
timestamp = "$TIMESTAMP"

try:
    with open(wake_file, 'r') as f:
        data = json.load(f)

    # Mark as acknowledged
    data['acknowledged'] = True
    data['acknowledgedAt'] = timestamp

    # Write updated data
    with open(wake_file, 'w') as f:
        json.dump(data, f, indent=2)

    print(json.dumps({"status": "acknowledged", "wakeId": data.get("wakeId")}))
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
    sys.exit(1)
PYTHON_SCRIPT

# Also update URGENT copy if it exists
URGENT_FILE=$(grep -l "\"wakeId\": \"$WAKE_ID\"" "$URGENT_DIR"/*.json 2>/dev/null | head -1 || true)

if [ -n "$URGENT_FILE" ] && [ -f "$URGENT_FILE" ]; then
  python3 - <<PYTHON_SCRIPT
import json
import sys
from pathlib import Path

urgent_file = "$URGENT_FILE"
timestamp = "$TIMESTAMP"

try:
    with open(urgent_file, 'r') as f:
        data = json.load(f)

    # Mark as acknowledged
    data['acknowledged'] = True
    data['acknowledgedAt'] = timestamp

    # Write updated data
    with open(urgent_file, 'w') as f:
        json.dump(data, f, indent=2)
except:
    pass  # Ignore errors for URGENT copy
PYTHON_SCRIPT
fi

# Check if any unacknowledged wake messages remain for this agent
REMAINING_WAKE=$(grep -l "\"agentId\": \"$AGENT_ID\"" "$WAKE_DIR"/*.json 2>/dev/null | xargs -r grep -l '"acknowledged": false' 2>/dev/null || true)

# Update agent status file to clear wakeMessageSent flag if no more pending
STATUS_DIR="/home/alton/Sartor-claude-network/data/agent-status"
STATUS_FILE="$STATUS_DIR/${AGENT_ID}.json"

if [ -z "$REMAINING_WAKE" ]; then
  # No more pending wake messages - set wakeMessageSent to false
  (
    flock -x 200 || exit 1

    if [ -f "$STATUS_FILE" ]; then
      CONTENT=$(<"$STATUS_FILE")

      # Update wakeMessageSent flag
      if echo "$CONTENT" | grep -q '"wakeMessageSent":'; then
        CONTENT=$(echo "$CONTENT" | perl -pe 's/"wakeMessageSent":\s*(true|false)/"wakeMessageSent": false/')
      fi

      # Update lastUpdate timestamp
      if echo "$CONTENT" | grep -q '"lastUpdate":'; then
        CONTENT=$(echo "$CONTENT" | perl -pe "s/\"lastUpdate\":\s*\"[^\"]*\"/\"lastUpdate\": \"$TIMESTAMP\"/")
      fi

      echo "$CONTENT" > "$STATUS_FILE"
    fi
  ) 200>"$STATUS_FILE.lock"
fi

exit 0
