#!/bin/bash
# Checkpoint-Based Status Update System
# Inspired by STELLA (arxiv:2507.02004) - report progress at semantic milestones
# Usage: ./scripts/checkpoint.sh <agentId> <phase> <milestone> [details]

set -euo pipefail

# Validate arguments
if [ $# -lt 3 ]; then
  echo "Error: Missing required arguments" >&2
  echo "Usage: $0 <agentId> <phase> <milestone> [details]" >&2
  echo "" >&2
  echo "Parameters:" >&2
  echo "  agentId    - Agent identifier (e.g., agent-001-IMPLEMENTER)" >&2
  echo "  phase      - Current phase: research|planning|implementation|testing|cleanup" >&2
  echo "  milestone  - Semantic milestone (e.g., files_identified, code_written, tests_passing)" >&2
  echo "  details    - Optional human-readable description" >&2
  exit 1
fi

AGENT_ID="$1"
PHASE="$2"
MILESTONE="$3"
DETAILS="${4:-}"

# Validate phase
VALID_PHASES=("research" "planning" "implementation" "testing" "cleanup")
if [[ ! " ${VALID_PHASES[@]} " =~ " ${PHASE} " ]]; then
  echo "Error: Invalid phase '$PHASE'" >&2
  echo "Valid phases: ${VALID_PHASES[*]}" >&2
  exit 1
fi

# Map phase to progress value
case "$PHASE" in
  research)
    PROGRESS="0.2"
    ;;
  planning)
    PROGRESS="0.4"
    ;;
  implementation)
    PROGRESS="0.6"
    ;;
  testing)
    PROGRESS="0.8"
    ;;
  cleanup)
    PROGRESS="1.0"
    ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATUS_UPDATE_SCRIPT="$SCRIPT_DIR/status-update.sh"
STATUS_DIR="/home/alton/Sartor-claude-network/data/agent-status"
STATUS_FILE="$STATUS_DIR/${AGENT_ID}.json"
CHECKPOINTS_DIR="/home/alton/Sartor-claude-network/data/checkpoints"
CHECKPOINT_LOG="$CHECKPOINTS_DIR/${AGENT_ID}.log"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure directories exist
mkdir -p "$STATUS_DIR"
mkdir -p "$CHECKPOINTS_DIR"

# Check if status-update.sh exists
if [ ! -x "$STATUS_UPDATE_SCRIPT" ]; then
  echo "Error: status-update.sh not found or not executable at $STATUS_UPDATE_SCRIPT" >&2
  exit 1
fi

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

# Append to checkpoint log
ESCAPED_MILESTONE=$(json_escape "$MILESTONE")
ESCAPED_DETAILS=$(json_escape "$DETAILS")

echo "$TIMESTAMP|$PHASE|$ESCAPED_MILESTONE|$ESCAPED_DETAILS" >> "$CHECKPOINT_LOG"

# Update status file with checkpoint data using flock
(
  flock -x 200 || exit 1

  if [ -f "$STATUS_FILE" ]; then
    # Read existing file
    CONTENT=$(<"$STATUS_FILE")

    # Extract existing role if present
    ROLE=$(echo "$CONTENT" | grep -o '"role":\s*"[^"]*"' | sed 's/"role":\s*"\([^"]*\)"/\1/' || echo "")

    # Build milestone history array
    # First, extract existing milestone history if present (handle multiline JSON and arrays with spaces)
    EXISTING_HISTORY=$(echo "$CONTENT" | perl -0ne 'print $1 if /"milestoneHistory":\s*(\[[^\]]*\])/' || echo "[]")
    if [ -z "$EXISTING_HISTORY" ]; then
      EXISTING_HISTORY="[]"
    fi

    # Check if milestone already exists in history
    if echo "$EXISTING_HISTORY" | grep -q "\"$ESCAPED_MILESTONE\""; then
      # Milestone already in history, don't add duplicate
      NEW_HISTORY="$EXISTING_HISTORY"
    elif [ "$EXISTING_HISTORY" = "[]" ]; then
      # Empty array - add first item
      NEW_HISTORY="[\"$ESCAPED_MILESTONE\"]"
    else
      # Non-empty array - append item
      NEW_HISTORY=$(echo "$EXISTING_HISTORY" | sed "s/\]$/, \"$ESCAPED_MILESTONE\"]/")
    fi

    # Update or add fields
    # Phase
    if echo "$CONTENT" | grep -q '"phase":'; then
      CONTENT=$(echo "$CONTENT" | perl -pe "s/\"phase\":\s*\"[^\"]*\"/\"phase\": \"$PHASE\"/")
    else
      CONTENT=$(echo "$CONTENT" | sed "s/}/,\n  \"phase\": \"$PHASE\"\n}/")
    fi

    # Milestone
    if echo "$CONTENT" | grep -q '"milestone":'; then
      CONTENT=$(echo "$CONTENT" | perl -pe "s/\"milestone\":\s*\"[^\"]*\"/\"milestone\": \"$ESCAPED_MILESTONE\"/")
    else
      CONTENT=$(echo "$CONTENT" | sed "s/}/,\n  \"milestone\": \"$ESCAPED_MILESTONE\"\n}/")
    fi

    # Progress
    if echo "$CONTENT" | grep -q '"progress":'; then
      CONTENT=$(echo "$CONTENT" | perl -pe "s/\"progress\":\s*\"[^\"]*\"/\"progress\": \"$PROGRESS\"/")
    else
      CONTENT=$(echo "$CONTENT" | sed "s/}/,\n  \"progress\": \"$PROGRESS\"\n}/")
    fi

    # MilestoneHistory (replace entire array)
    if echo "$CONTENT" | tr -d '\n' | grep -q '"milestoneHistory":'; then
      # Replace existing array (handle multiline JSON)
      CONTENT=$(echo "$CONTENT" | perl -0pe "s/\"milestoneHistory\":\s*\[[^\]]*\]/\"milestoneHistory\": $NEW_HISTORY/s")
    else
      CONTENT=$(echo "$CONTENT" | sed "s/}/,\n  \"milestoneHistory\": $NEW_HISTORY\n}/")
    fi

    # LastCheckpoint
    if echo "$CONTENT" | grep -q '"lastCheckpoint":'; then
      CONTENT=$(echo "$CONTENT" | perl -pe "s/\"lastCheckpoint\":\s*\"[^\"]*\"/\"lastCheckpoint\": \"$TIMESTAMP\"/")
    else
      CONTENT=$(echo "$CONTENT" | sed "s/}/,\n  \"lastCheckpoint\": \"$TIMESTAMP\"\n}/")
    fi

    # CheckpointDetails (optional)
    if [ -n "$DETAILS" ]; then
      if echo "$CONTENT" | grep -q '"checkpointDetails":'; then
        CONTENT=$(echo "$CONTENT" | perl -pe "s/\"checkpointDetails\":\s*\"[^\"]*\"/\"checkpointDetails\": \"$ESCAPED_DETAILS\"/")
      else
        CONTENT=$(echo "$CONTENT" | sed "s/}/,\n  \"checkpointDetails\": \"$ESCAPED_DETAILS\"\n}/")
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
    cat > "$STATUS_FILE" <<EOF
{
  "agentId": "$AGENT_ID",
  "phase": "$PHASE",
  "milestone": "$ESCAPED_MILESTONE",
  "progress": "$PROGRESS",
  "milestoneHistory": ["$ESCAPED_MILESTONE"],
  "lastCheckpoint": "$TIMESTAMP",
  "checkpointDetails": "$ESCAPED_DETAILS",
  "lastUpdate": "$TIMESTAMP",
  "status": "active",
  "findings": []
}
EOF
  fi
) 200>"$STATUS_FILE.lock"

# Print confirmation with checkpoint details
echo "{\"checkpoint\":\"$MILESTONE\",\"phase\":\"$PHASE\",\"progress\":$PROGRESS,\"agent\":\"$AGENT_ID\"}"

exit 0
