#!/usr/bin/env bash
# PreToolUse hook for all tools
# Blocks access to sensitive financial data paths
# Exit 0: Allow, Exit 2: Block

set -euo pipefail

INPUT=$(cat)

HOOK_INPUT="$INPUT" python - <<'PYEOF'
import sys, json, re, os

raw = os.environ.get('HOOK_INPUT', '')
if not raw:
    sys.exit(0)

def extract_strings(obj, results=None):
    if results is None:
        results = []
    if isinstance(obj, str):
        results.append(obj)
    elif isinstance(obj, dict):
        for v in obj.values():
            extract_strings(v, results)
    elif isinstance(obj, list):
        for item in obj:
            extract_strings(item, results)
    return results

try:
    d = json.loads(raw)
    inp = d.get('tool_input', {})
    strings = extract_strings(inp)
    combined = '\n'.join(strings)
except Exception:
    sys.exit(0)

if not combined:
    sys.exit(0)

def block(reason):
    print(f"BLOCKED: Access to sensitive financial path is not allowed: {reason}", file=sys.stderr)
    sys.exit(2)

if re.search(r'brokerage/', combined):
    block("brokerage/")
if re.search(r'trading/', combined):
    block("trading/")
if re.search(r'\.credentials', combined):
    block(".credentials")
if re.search(r'\.env(\b|/|$)', combined):
    block(".env")
if re.search(r'financial/accounts', combined):
    block("financial/accounts")

sys.exit(0)
PYEOF
