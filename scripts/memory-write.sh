#!/bin/bash
# Memory Write Wrapper for Subagents
# Usage: ./scripts/memory-write.sh <content> <type> <importance> <tags>

set -euo pipefail

CONTENT="$1"
TYPE="${2:-episodic}"
IMPORTANCE="${3:-0.5}"
TAGS="${4:-[]}"
MEMORY_FILE="/home/alton/Sartor-claude-network/data/memories.json"
QUEUE_FILE="/home/alton/Sartor-claude-network/data/memory-queue.jsonl"

# Generate unique ID
MEMORY_ID="mem_$(date +%s%N | cut -c1-13)_$(head -c 8 /dev/urandom | xxd -p | cut -c1-8)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure tags is valid JSON array
if [[ ! "$TAGS" =~ ^\[.*\]$ ]]; then
  TAGS="[\"$TAGS\"]"
fi

# Try to write to memories.json with file locking
write_to_json() {
  (
    flock -x 200 || exit 1

    # Use Python to safely manipulate JSON
    python3 - <<PYTHON_SCRIPT
import json
import sys
from pathlib import Path

memory_file = "$MEMORY_FILE"
memory_id = "$MEMORY_ID"
content = """$CONTENT"""
mem_type = "$TYPE"
importance = float("$IMPORTANCE")
tags = $TAGS
timestamp = "$TIMESTAMP"

# Read current file
try:
    with open(memory_file, 'r') as f:
        data = json.load(f)
except FileNotFoundError:
    data = {"memories": {}, "idCounter": 0}
except json.JSONDecodeError:
    data = {"memories": {}, "idCounter": 0}

# Add new memory
data["memories"][memory_id] = {
    "id": memory_id,
    "content": content,
    "type": mem_type,
    "importance_score": importance,
    "tags": tags,
    "created_at": timestamp
}
data["idCounter"] = data.get("idCounter", 0) + 1

# Write updated data
with open(memory_file, 'w') as f:
    json.dump(data, f, indent=2)
PYTHON_SCRIPT
  ) 200>"$MEMORY_FILE.lock"
}

# Try primary path
if write_to_json 2>/dev/null; then
  echo "{\"id\":\"$MEMORY_ID\",\"status\":\"created\"}"
  exit 0
fi

# Fallback: append to queue file
mkdir -p "$(dirname "$QUEUE_FILE")"
echo "{\"id\":\"$MEMORY_ID\",\"content\":\"$CONTENT\",\"type\":\"$TYPE\",\"importance_score\":$IMPORTANCE,\"tags\":$TAGS,\"created_at\":\"$TIMESTAMP\"}" >> "$QUEUE_FILE"
echo "{\"id\":\"$MEMORY_ID\",\"status\":\"queued\"}"
