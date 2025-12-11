#!/bin/bash
# Finding Aggregation System for Research Agents
# Aggregates all findings on a topic into a single file
# Usage: ./scripts/finding-aggregate.sh <topic>

set -euo pipefail

# Validate arguments
if [ $# -lt 1 ]; then
  echo "Error: Missing required topic argument" >&2
  echo "Usage: $0 <topic>" >&2
  echo "" >&2
  echo "Parameters:" >&2
  echo "  topic - Topic to aggregate findings for" >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  $0 api-update" >&2
  echo "  $0 architecture" >&2
  exit 1
fi

TOPIC="$1"
FINDINGS_DIR="/home/alton/Sartor-claude-network/data/findings"
AGGREGATED_DIR="$FINDINGS_DIR/_aggregated"
TOPIC_FILE="$AGGREGATED_DIR/topic-$TOPIC.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure directories exist
mkdir -p "$AGGREGATED_DIR"

# Check if findings directory exists
if [ ! -d "$FINDINGS_DIR" ]; then
  echo "Error: Findings directory not found at $FINDINGS_DIR" >&2
  exit 1
fi

# Aggregate findings using Python with file locking
(
  flock -x 200 || exit 1

  python3 - <<PYTHON_SCRIPT
import json
import os
import sys
from pathlib import Path
from collections import defaultdict

findings_dir = "$FINDINGS_DIR"
topic = "$TOPIC"
topic_file = "$TOPIC_FILE"
timestamp = "$TIMESTAMP"

findings = []
agent_contributions = defaultdict(int)
importance_distribution = {
    "critical": 0,    # >= 0.8
    "high": 0,        # 0.6-0.79
    "medium": 0,      # 0.4-0.59
    "low": 0          # < 0.4
}
all_tags = set()

# Search all agent directories
for agent_dir in Path(findings_dir).iterdir():
    if not agent_dir.is_dir() or agent_dir.name == "_aggregated":
        continue

    agent_id = agent_dir.name

    # Search finding files
    for finding_file in agent_dir.glob("finding-*.json"):
        try:
            with open(finding_file, 'r') as f:
                finding = json.load(f)

            # Check if topic matches
            if finding.get("topic") != topic:
                continue

            findings.append(finding)
            agent_contributions[agent_id] += 1

            # Categorize importance
            importance = finding.get("importance", 0.0)
            if importance >= 0.8:
                importance_distribution["critical"] += 1
            elif importance >= 0.6:
                importance_distribution["high"] += 1
            elif importance >= 0.4:
                importance_distribution["medium"] += 1
            else:
                importance_distribution["low"] += 1

            # Collect tags
            for tag in finding.get("tags", []):
                all_tags.add(tag)

        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"Warning: Failed to read {finding_file}: {e}", file=sys.stderr)
            continue

# Sort findings by importance (descending) then timestamp (descending)
findings.sort(key=lambda x: (-x.get("importance", 0.0), x.get("timestamp", "")), reverse=True)

# Calculate statistics
total_findings = len(findings)
avg_importance = sum(f.get("importance", 0.0) for f in findings) / total_findings if total_findings > 0 else 0.0

# Build aggregated data
aggregated = {
    "topic": topic,
    "count": total_findings,
    "findings": findings,
    "statistics": {
        "totalFindings": total_findings,
        "averageImportance": round(avg_importance, 3),
        "agentContributions": dict(agent_contributions),
        "importanceDistribution": importance_distribution,
        "uniqueTags": sorted(list(all_tags))
    },
    "created": findings[0].get("timestamp") if findings else timestamp,
    "lastUpdate": timestamp
}

# Write aggregated file
with open(topic_file, 'w') as f:
    json.dump(aggregated, f, indent=2)

# Output summary
summary = {
    "topic": topic,
    "count": total_findings,
    "averageImportance": round(avg_importance, 3),
    "agents": len(agent_contributions),
    "file": topic_file
}

print(json.dumps(summary, indent=2))
PYTHON_SCRIPT

) 200>"$AGGREGATED_DIR/aggregate.lock"

exit 0
