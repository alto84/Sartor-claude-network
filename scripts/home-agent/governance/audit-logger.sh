#!/usr/bin/env bash
# PostToolUse hook for Write|Edit
# Appends a timestamped JSON audit entry for every file write/edit
# Always exits 0 (non-blocking)

AUDIT_DIR="/c/Users/alto8/Sartor-claude-network/data/home-agent"
AUDIT_LOG="$AUDIT_DIR/audit.log"

mkdir -p "$AUDIT_DIR"

INPUT=$(cat)

HOOK_INPUT="$INPUT" python - "$AUDIT_LOG" <<'PYEOF'
import sys, json, datetime, os

audit_log = sys.argv[1]
try:
    raw = os.environ.get('HOOK_INPUT', '')
    d = json.loads(raw)
    tool_name = d.get('tool_name', 'unknown')
    tool_input = d.get('tool_input', {})

    # Determine file path from tool_input
    file_path = (
        tool_input.get('file_path') or
        tool_input.get('path') or
        tool_input.get('filename') or
        'unknown'
    )

    # Determine action
    action = 'write' if tool_name.lower() == 'write' else 'edit'

    entry = {
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
        'tool': tool_name,
        'file': file_path,
        'action': action,
    }

    with open(audit_log, 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry) + '\n')
except Exception as e:
    print(f"audit-logger error: {e}", file=sys.stderr)
PYEOF

exit 0
