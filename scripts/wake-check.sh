#!/bin/bash
# Wake Messaging System - Check for unacknowledged wake messages
# Usage: ./scripts/wake-check.sh [--urgent-only] [--since <timestamp>]
# Returns JSON array of pending wake messages, exits 0 if messages exist, 1 if none

set -euo pipefail

WAKE_DIR="/home/alton/Sartor-claude-network/data/wake"
URGENT_DIR="$WAKE_DIR/URGENT"
URGENT_ONLY=false
SINCE_TIMESTAMP=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --urgent-only)
      URGENT_ONLY=true
      shift
      ;;
    --since)
      SINCE_TIMESTAMP="$2"
      shift 2
      ;;
    *)
      echo "Usage: $0 [--urgent-only] [--since <timestamp>]" >&2
      exit 1
      ;;
  esac
done

# Ensure directory exists
mkdir -p "$WAKE_DIR"
mkdir -p "$URGENT_DIR"

# Determine which directory to check
if [ "$URGENT_ONLY" = true ]; then
  SEARCH_DIR="$URGENT_DIR"
else
  SEARCH_DIR="$WAKE_DIR"
fi

# Find all wake message files
WAKE_FILES=$(find "$SEARCH_DIR" -maxdepth 1 -name "*.json" -type f 2>/dev/null | sort || true)

if [ -z "$WAKE_FILES" ]; then
  # No wake files at all
  echo "[]"
  exit 1
fi

# Collect unacknowledged wake messages
PENDING_WAKE=()

while IFS= read -r WAKE_FILE; do
  if [ -f "$WAKE_FILE" ]; then
    # Check if acknowledged is false
    ACKNOWLEDGED=$(python3 -c "
import json
import sys
try:
    with open('$WAKE_FILE', 'r') as f:
        data = json.load(f)
    print(str(data.get('acknowledged', False)).lower())
except:
    print('true')
" 2>/dev/null || echo "true")

    if [ "$ACKNOWLEDGED" = "false" ]; then
      # If since timestamp is specified, check if message is newer
      if [ -n "$SINCE_TIMESTAMP" ]; then
        MSG_TIMESTAMP=$(python3 -c "
import json
import sys
try:
    with open('$WAKE_FILE', 'r') as f:
        data = json.load(f)
    print(data.get('timestamp', ''))
except:
    print('')
" 2>/dev/null || echo "")

        # Compare timestamps (ISO 8601 format allows string comparison)
        if [ -n "$MSG_TIMESTAMP" ] && [ "$MSG_TIMESTAMP" \< "$SINCE_TIMESTAMP" ]; then
          continue
        fi
      fi

      # Read the full wake message JSON
      WAKE_JSON=$(<"$WAKE_FILE")
      PENDING_WAKE+=("$WAKE_JSON")
    fi
  fi
done <<< "$WAKE_FILES"

# Build JSON array
if [ ${#PENDING_WAKE[@]} -eq 0 ]; then
  echo "[]"
  exit 1
else
  echo -n "["
  for i in "${!PENDING_WAKE[@]}"; do
    if [ $i -gt 0 ]; then
      echo -n ","
    fi
    echo -n "${PENDING_WAKE[$i]}"
  done
  echo "]"
  exit 0
fi
