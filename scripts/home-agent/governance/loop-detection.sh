#!/usr/bin/env bash
# Stop hook
# Checks session tool count and per-file access frequency for loop/runaway detection
# Always exits 0 (warning only)

DATA_DIR="/c/Users/alto8/Sartor-claude-network/data/home-agent"
TOOL_COUNT_FILE="$DATA_DIR/session-tool-count.tmp"
FILE_ACCESS_FILE="$DATA_DIR/session-file-access.tmp"

TOOL_COUNT=0
if [ -f "$TOOL_COUNT_FILE" ]; then
  TOOL_COUNT=$(cat "$TOOL_COUNT_FILE" 2>/dev/null || echo 0)
fi

if [ "$TOOL_COUNT" -gt 100 ] 2>/dev/null; then
  echo "WARNING: High tool call count detected this session ($TOOL_COUNT calls). Possible loop or runaway agent." >&2
fi

# Check for any single file accessed more than 10 times
if [ -f "$FILE_ACCESS_FILE" ]; then
  python - "$FILE_ACCESS_FILE" <<'PYEOF' 2>/dev/null
import sys

path = sys.argv[1]
try:
    counts = {}
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                counts[line] = counts.get(line, 0) + 1
    for file, count in counts.items():
        if count > 10:
            print(f"WARNING: File accessed {count} times this session: {file}", file=sys.stderr)
except Exception as e:
    print(f"loop-detection error: {e}", file=sys.stderr)
PYEOF
fi

# Clean up temp files
rm -f "$TOOL_COUNT_FILE" "$FILE_ACCESS_FILE"

exit 0
