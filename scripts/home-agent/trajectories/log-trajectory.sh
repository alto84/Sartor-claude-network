#!/usr/bin/env bash
# PostToolUse hook for Bash|Read|Write|Edit|Grep|Glob
# Logs a trajectory entry and tracks session tool count + file access
# Always exits 0

DATA_DIR="/c/Users/alto8/Sartor-claude-network/data/home-agent"
TRAJ_DIR="$DATA_DIR/trajectories"
TOOL_COUNT_FILE="$DATA_DIR/session-tool-count.tmp"
FILE_ACCESS_FILE="$DATA_DIR/session-file-access.tmp"

mkdir -p "$TRAJ_DIR"

TODAY=$(date -u +%Y-%m-%d)
TRAJ_FILE="$TRAJ_DIR/$TODAY.jsonl"

INPUT=$(cat)

HOOK_INPUT="$INPUT" python - "$TRAJ_FILE" "$TOOL_COUNT_FILE" "$FILE_ACCESS_FILE" <<'PYEOF'
import sys, json, datetime, os

traj_file = sys.argv[1]
tool_count_file = sys.argv[2]
file_access_file = sys.argv[3]

try:
    raw = os.environ.get('HOOK_INPUT', '')
    d = json.loads(raw)

    tool_name = d.get('tool_name', 'unknown')
    tool_input = d.get('tool_input', {})
    tool_output = d.get('tool_output', '')

    input_summary = json.dumps(tool_input)[:200]
    output_summary = str(tool_output)[:200]

    entry = {
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
        'tool': tool_name,
        'input_summary': input_summary,
        'output_summary': output_summary,
    }

    with open(traj_file, 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry) + '\n')

    # Increment tool count
    count = 0
    try:
        with open(tool_count_file, 'r') as fc:
            count = int(fc.read().strip())
    except Exception:
        pass
    with open(tool_count_file, 'w') as fc:
        fc.write(str(count + 1))

    # Track file access
    file_path = (
        tool_input.get('file_path') or
        tool_input.get('path') or
        tool_input.get('filename') or
        tool_input.get('command', '')[:80]
    ) if isinstance(tool_input, dict) else ''

    if file_path:
        with open(file_access_file, 'a', encoding='utf-8') as fa:
            fa.write(file_path + '\n')

except Exception as e:
    print(f"log-trajectory error: {e}", file=sys.stderr)
PYEOF

exit 0
