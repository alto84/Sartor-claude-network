#!/bin/bash
# Finding Write System for Research Agents
# Usage: ./scripts/finding-write.sh <agentId> <topic> <content> [importance]

set -euo pipefail

# Validate arguments
if [ $# -lt 3 ]; then
  echo "Error: Missing required arguments" >&2
  echo "Usage: $0 <agentId> <topic> <content> [importance]" >&2
  echo "" >&2
  echo "Parameters:" >&2
  echo "  agentId     - Agent creating the finding (e.g., researcher-001)" >&2
  echo "  topic       - Category (e.g., api-update, architecture, bug)" >&2
  echo "  content     - The finding content" >&2
  echo "  importance  - Optional: 0.0-1.0 (default: 0.5)" >&2
  exit 1
fi

AGENT_ID="$1"
TOPIC="$2"
CONTENT="$3"
IMPORTANCE="${4:-0.5}"

# Validate importance score
if ! [[ "$IMPORTANCE" =~ ^[0-9]*\.?[0-9]+$ ]] || (( $(echo "$IMPORTANCE < 0.0" | bc -l) )) || (( $(echo "$IMPORTANCE > 1.0" | bc -l) )); then
  echo "Error: Importance must be between 0.0 and 1.0" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FINDINGS_DIR="/home/alton/Sartor-claude-network/data/findings"
AGENT_DIR="$FINDINGS_DIR/$AGENT_ID"
AGGREGATED_DIR="$FINDINGS_DIR/_aggregated"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure directories exist
mkdir -p "$AGENT_DIR"
mkdir -p "$AGGREGATED_DIR"

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

# Generate tags from content (simple keyword extraction)
generate_tags() {
  local content="$1"
  local tags=()

  # Extract common technical terms (case-insensitive)
  if echo "$content" | grep -qi "api"; then tags+=("api"); fi
  if echo "$content" | grep -qi "anthropic"; then tags+=("anthropic"); fi
  if echo "$content" | grep -qi "async"; then tags+=("async"); fi
  if echo "$content" | grep -qi "agent"; then tags+=("agents"); fi
  if echo "$content" | grep -qi "bug"; then tags+=("bug"); fi
  if echo "$content" | grep -qi "architecture"; then tags+=("architecture"); fi
  if echo "$content" | grep -qi "performance"; then tags+=("performance"); fi
  if echo "$content" | grep -qi "security"; then tags+=("security"); fi
  if echo "$content" | grep -qi "test"; then tags+=("testing"); fi
  if echo "$content" | grep -qi "documentation"; then tags+=("documentation"); fi

  # Add topic as a tag
  tags+=("$TOPIC")

  # Convert to JSON array using Python
  python3 -c "import json; print(json.dumps([$(printf '"%s",' "${tags[@]}" | sed 's/,$//')]))"
}

# Get next finding number for this agent
get_next_finding_number() {
  local agent_dir="$1"
  local max_num=0

  if [ -d "$agent_dir" ]; then
    for file in "$agent_dir"/finding-*.json; do
      if [ -f "$file" ]; then
        num=$(basename "$file" | sed 's/finding-\([0-9]*\)\.json/\1/')
        if [ "$num" -gt "$max_num" ]; then
          max_num=$num
        fi
      fi
    done
  fi

  echo $((max_num + 1))
}

# Create finding with file locking
(
  flock -x 200 || exit 1

  # Get next finding number
  FINDING_NUM=$(get_next_finding_number "$AGENT_DIR")
  FINDING_NUM_PADDED=$(printf "%03d" "$FINDING_NUM")
  FINDING_ID="finding-$AGENT_ID-$FINDING_NUM_PADDED"
  FINDING_FILE="$AGENT_DIR/finding-$FINDING_NUM_PADDED.json"

  # Escape content
  ESCAPED_CONTENT=$(json_escape "$CONTENT")

  # Generate tags
  TAGS=$(generate_tags "$CONTENT")

  # Create finding JSON
  cat > "$FINDING_FILE" <<EOF
{
  "findingId": "$FINDING_ID",
  "agentId": "$AGENT_ID",
  "topic": "$TOPIC",
  "content": "$ESCAPED_CONTENT",
  "importance": $IMPORTANCE,
  "timestamp": "$TIMESTAMP",
  "tags": $TAGS
}
EOF

  # Add to topic aggregation
  TOPIC_FILE="$AGGREGATED_DIR/topic-$TOPIC.json"

  if [ -f "$TOPIC_FILE" ]; then
    # Append to existing topic file
    python3 - <<PYTHON_SCRIPT
import json
from pathlib import Path

topic_file = "$TOPIC_FILE"
finding_file = "$FINDING_FILE"

# Read current topic data
with open(topic_file, 'r') as f:
    topic_data = json.load(f)

# Read new finding
with open(finding_file, 'r') as f:
    finding = json.load(f)

# Add to findings array
if "findings" not in topic_data:
    topic_data["findings"] = []

topic_data["findings"].append(finding)
topic_data["lastUpdate"] = "$TIMESTAMP"
topic_data["count"] = len(topic_data["findings"])

# Write updated data
with open(topic_file, 'w') as f:
    json.dump(topic_data, f, indent=2)
PYTHON_SCRIPT
  else
    # Create new topic file
    python3 - <<PYTHON_SCRIPT
import json
from pathlib import Path

topic_file = "$TOPIC_FILE"
finding_file = "$FINDING_FILE"

# Read new finding
with open(finding_file, 'r') as f:
    finding = json.load(f)

# Create topic data
topic_data = {
    "topic": "$TOPIC",
    "findings": [finding],
    "count": 1,
    "created": "$TIMESTAMP",
    "lastUpdate": "$TIMESTAMP"
}

# Write topic file
with open(topic_file, 'w') as f:
    json.dump(topic_data, f, indent=2)
PYTHON_SCRIPT
  fi

  # Output confirmation
  echo "{\"findingId\":\"$FINDING_ID\",\"topic\":\"$TOPIC\",\"importance\":$IMPORTANCE,\"file\":\"$FINDING_FILE\"}"

) 200>"$AGENT_DIR/write.lock"

exit 0
