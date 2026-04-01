#!/usr/bin/env bash
# PostToolUse hook for Write|Edit
# Blocks writes that contain secrets or sensitive patterns
# Exit 0: Allow, Exit 2: Block

set -euo pipefail

INPUT=$(cat)

HOOK_INPUT="$INPUT" python - <<'PYEOF'
import sys, json, re, os

raw = os.environ.get('HOOK_INPUT', '')
if not raw:
    sys.exit(0)

try:
    d = json.loads(raw)
    out = d.get('tool_output', '')
    inp = d.get('tool_input', {})
    content_from_input = inp.get('content', '') if isinstance(inp, dict) else ''
    content = (out or '') + '\n' + (content_from_input or '')
except Exception:
    sys.exit(0)

if not content.strip():
    sys.exit(0)

def block(reason):
    print(f"BLOCKED SECRET DETECTED: {reason}", file=sys.stderr)
    sys.exit(2)

# SSN pattern: ###-##-####
if re.search(r'\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b', content):
    block("Social Security Number pattern detected")

# Anthropic/OpenAI API key: sk-... (may contain hyphens and underscores)
if re.search(r'\bsk-[a-zA-Z0-9_-]{20,}\b', content):
    block("API key pattern (sk-...) detected")

# AWS access key: AKIA...
if re.search(r'\bAKIA[A-Z0-9]{16}\b', content):
    block("AWS access key pattern (AKIA...) detected")

# Visa credit card: 4 followed by 15 digits
if re.search(r'\b4[0-9]{15}\b', content):
    block("Visa credit card number pattern detected")

# Mastercard: 51-55 followed by 14 digits
if re.search(r'\b5[1-5][0-9]{14}\b', content):
    block("Mastercard credit card number pattern detected")

# Generic secrets
if re.search(r'(?i)password\s*[:=]\s*\S+', content):
    block("password assignment detected in output")
if re.search(r'(?i)api[_-]?key\s*[:=]\s*\S+', content):
    block("api_key assignment detected in output")
if re.search(r'(?i)secret\s*[:=]\s*\S+', content):
    block("secret assignment detected in output")
if re.search(r'(?i)token\s*[:=]\s*\S+', content):
    block("token assignment detected in output")

sys.exit(0)
PYEOF
