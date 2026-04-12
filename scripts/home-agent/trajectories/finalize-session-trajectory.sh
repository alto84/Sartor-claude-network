#!/usr/bin/env bash
# Stop hook
# Adds a final "session end" entry to today's trajectory log
# Cleans up session temp files
# Always exits 0

DATA_DIR="/c/Users/alto8/Sartor-claude-network/data/home-agent"
TRAJ_DIR="$DATA_DIR/trajectories"
TOOL_COUNT_FILE="$DATA_DIR/session-tool-count.tmp"
FILE_ACCESS_FILE="$DATA_DIR/session-file-access.tmp"

TODAY=$(date -u +%Y-%m-%d)
TRAJ_FILE="$TRAJ_DIR/$TODAY.jsonl"

if [ -f "$TRAJ_FILE" ]; then
  python - "$TRAJ_FILE" "$TOOL_COUNT_FILE" <<'PYEOF'
import sys, json, datetime

traj_file = sys.argv[1]
tool_count_file = sys.argv[2]

tool_count = 0
try:
    with open(tool_count_file, 'r') as f:
        tool_count = int(f.read().strip())
except Exception:
    pass

entry = {
    'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
    'tool': 'SESSION_END',
    'input_summary': f'Session ended with {tool_count} total tool calls',
    'output_summary': '',
}

try:
    with open(traj_file, 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry) + '\n')
except Exception as e:
    print(f"finalize-trajectory error: {e}", file=sys.stderr)
PYEOF
fi

# Clean up session temp files
rm -f "$TOOL_COUNT_FILE" "$FILE_ACCESS_FILE"

exit 0
