#!/bin/bash
# Finding Search System for Research Agents
# Usage: ./scripts/finding-search.sh <topic> [--agent <agentId>] [--min-importance 0.7]

set -euo pipefail

# Default values
TOPIC=""
AGENT_FILTER=""
MIN_IMPORTANCE="0.0"
FINDINGS_DIR="/home/alton/Sartor-claude-network/data/findings"

# Parse arguments
if [ $# -lt 1 ]; then
  echo "Error: Missing required topic argument" >&2
  echo "Usage: $0 <topic> [--agent <agentId>] [--min-importance 0.7]" >&2
  echo "" >&2
  echo "Parameters:" >&2
  echo "  topic            - Topic to search for" >&2
  echo "  --agent          - Optional: Filter by specific agent ID" >&2
  echo "  --min-importance - Optional: Minimum importance threshold (0.0-1.0)" >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  $0 api-update" >&2
  echo "  $0 architecture --agent researcher-001" >&2
  echo "  $0 bug --min-importance 0.7" >&2
  echo "  $0 api-update --agent researcher-001 --min-importance 0.5" >&2
  exit 1
fi

TOPIC="$1"
shift

# Parse optional flags
while [ $# -gt 0 ]; do
  case "$1" in
    --agent)
      if [ $# -lt 2 ]; then
        echo "Error: --agent requires a value" >&2
        exit 1
      fi
      AGENT_FILTER="$2"
      shift 2
      ;;
    --min-importance)
      if [ $# -lt 2 ]; then
        echo "Error: --min-importance requires a value" >&2
        exit 1
      fi
      MIN_IMPORTANCE="$2"
      shift 2
      ;;
    *)
      echo "Error: Unknown option $1" >&2
      exit 1
      ;;
  esac
done

# Validate min_importance
if ! [[ "$MIN_IMPORTANCE" =~ ^[0-9]*\.?[0-9]+$ ]] || (( $(echo "$MIN_IMPORTANCE < 0.0" | bc -l) )) || (( $(echo "$MIN_IMPORTANCE > 1.0" | bc -l) )); then
  echo "Error: Minimum importance must be between 0.0 and 1.0" >&2
  exit 1
fi

# Check if findings directory exists
if [ ! -d "$FINDINGS_DIR" ]; then
  echo "Error: Findings directory not found at $FINDINGS_DIR" >&2
  exit 1
fi

# Search findings using Python for JSON parsing
python3 - <<PYTHON_SCRIPT
import json
import os
import sys
from pathlib import Path

findings_dir = "$FINDINGS_DIR"
topic = "$TOPIC"
agent_filter = "$AGENT_FILTER"
min_importance = float("$MIN_IMPORTANCE")

results = []

# Search agent directories
for agent_dir in Path(findings_dir).iterdir():
    if not agent_dir.is_dir() or agent_dir.name == "_aggregated":
        continue

    agent_id = agent_dir.name

    # Skip if agent filter is set and doesn't match
    if agent_filter and agent_id != agent_filter:
        continue

    # Search finding files
    for finding_file in agent_dir.glob("finding-*.json"):
        try:
            with open(finding_file, 'r') as f:
                finding = json.load(f)

            # Check if topic matches
            if finding.get("topic") != topic:
                continue

            # Check importance threshold
            if finding.get("importance", 0.0) < min_importance:
                continue

            results.append(finding)
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"Warning: Failed to read {finding_file}: {e}", file=sys.stderr)
            continue

# Sort by importance (descending) then timestamp (descending)
results.sort(key=lambda x: (-x.get("importance", 0.0), x.get("timestamp", "")), reverse=True)

# Output results
output = {
    "topic": topic,
    "filters": {
        "agent": agent_filter if agent_filter else "all",
        "minImportance": min_importance
    },
    "count": len(results),
    "findings": results
}

print(json.dumps(output, indent=2))
PYTHON_SCRIPT

exit 0
