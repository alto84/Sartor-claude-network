#!/bin/bash
# Handoff Signal Helper - Wraps status-update.sh for handoff signaling
# Usage: ./scripts/handoff-signal.sh <agentId> <status> <handoffId> <nextRole> [handoffJsonFile]

set -euo pipefail

# Check minimum required arguments
if [ $# -lt 4 ]; then
  echo "Error: Missing required arguments" >&2
  echo "Usage: $0 <agentId> <status> <handoffId> <nextRole> [handoffJsonFile]" >&2
  exit 1
fi

AGENT_ID="$1"
STATUS="$2"
HANDOFF_ID="$3"
NEXT_ROLE="$4"
HANDOFF_JSON_FILE="${5:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATUS_UPDATE_SCRIPT="$SCRIPT_DIR/status-update.sh"
HANDOFFS_DIR="/home/alton/Sartor-claude-network/data/handoffs"

# Validate status values
VALID_STATUSES=("ready_for_implementation" "ready_for_audit" "ready_for_cleanup" "complete")
if [[ ! " ${VALID_STATUSES[@]} " =~ " ${STATUS} " ]]; then
  echo "Error: Invalid status '$STATUS'" >&2
  echo "Valid statuses: ${VALID_STATUSES[*]}" >&2
  exit 1
fi

# Validate next role
VALID_ROLES=("IMPLEMENTER" "AUDITOR" "CLEANER" "ORCHESTRATOR")
if [[ ! " ${VALID_ROLES[@]} " =~ " ${NEXT_ROLE} " ]]; then
  echo "Error: Invalid nextRole '$NEXT_ROLE'" >&2
  echo "Valid roles: ${VALID_ROLES[*]}" >&2
  exit 1
fi

# Check if status-update.sh exists
if [ ! -x "$STATUS_UPDATE_SCRIPT" ]; then
  echo "Error: status-update.sh not found or not executable at $STATUS_UPDATE_SCRIPT" >&2
  exit 1
fi

# Update status field
if ! "$STATUS_UPDATE_SCRIPT" "$AGENT_ID" "status" "$STATUS"; then
  echo "Error: Failed to update status field" >&2
  exit 1
fi

# Update handoffId field
if ! "$STATUS_UPDATE_SCRIPT" "$AGENT_ID" "handoffId" "$HANDOFF_ID"; then
  echo "Error: Failed to update handoffId field" >&2
  exit 1
fi

# Update nextRole field
if ! "$STATUS_UPDATE_SCRIPT" "$AGENT_ID" "nextRole" "$NEXT_ROLE"; then
  echo "Error: Failed to update nextRole field" >&2
  exit 1
fi

# If handoff JSON file provided, copy to handoffs directory
if [ -n "$HANDOFF_JSON_FILE" ]; then
  if [ ! -f "$HANDOFF_JSON_FILE" ]; then
    echo "Warning: Handoff JSON file not found: $HANDOFF_JSON_FILE" >&2
  else
    # Ensure handoffs directory exists
    mkdir -p "$HANDOFFS_DIR"

    # Copy handoff JSON to archive
    HANDOFF_ARCHIVE="$HANDOFFS_DIR/${HANDOFF_ID}.json"
    if cp "$HANDOFF_JSON_FILE" "$HANDOFF_ARCHIVE"; then
      echo "Handoff JSON archived: $HANDOFF_ARCHIVE" >&2
    else
      echo "Warning: Failed to archive handoff JSON" >&2
    fi
  fi
fi

# Print confirmation message
echo "Handoff signaled: $HANDOFF_ID → $NEXT_ROLE"

exit 0
