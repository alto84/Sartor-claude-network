#!/usr/bin/env bash
# PreToolUse hook for Bash tool
# Blocks dangerous commands before execution
# Exit 0: Allow, Exit 2: Block

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")

if [ -z "$COMMAND" ]; then
  exit 0
fi

block() {
  echo "BLOCKED: $1" >&2
  exit 2
}

# Use python for all pattern matching to avoid grep -P locale issues on Windows
python - "$COMMAND" <<'PYEOF'
import sys, re

cmd = sys.argv[1]

def block(reason):
    print(f"BLOCKED: {reason}", file=sys.stderr)
    sys.exit(2)

# rm -rf on critical paths
if re.search(r'rm\s+-\S*r\S*\s+/(\s|$)', cmd):
    block("Recursive delete of root directory is not allowed")
if re.search(r'rm\s+-\S*r\S*\s+~(\s|$|/)', cmd):
    block("Recursive delete of home directory is not allowed")
if re.search(r'rm\s+-\S*r\S*\s+\$HOME(\s|$|/)', cmd):
    block("Recursive delete of $HOME is not allowed")

# DROP TABLE or DROP DATABASE (SQL)
if re.search(r'(?i)DROP\s+(TABLE|DATABASE)', cmd):
    block("SQL DROP TABLE/DATABASE is not allowed")

# git push --force to main/master
if re.search(r'git\s+push.*--force.*(main|master)', cmd):
    block("Force push to main/master is not allowed")
if re.search(r'git\s+push.*(main|master).*--force', cmd):
    block("Force push to main/master is not allowed")

# Credential extraction patterns
if re.search(r'cat.*api[_-]?key', cmd, re.IGNORECASE):
    block("Reading API key files is not allowed")
if re.search(r'cat.*\.ssh/id_', cmd):
    block("Reading SSH private keys is not allowed")
if re.search(r'cat.*credentials', cmd, re.IGNORECASE):
    block("Reading credentials files is not allowed")
if re.search(r'cat.*\.env(\s|$|/)', cmd):
    block("Reading .env files is not allowed")

# Pipe to shell (curl|wget piped to bash/sh)
if re.search(r'curl\s+.*\|\s*(ba)?sh', cmd):
    block("Piping curl output to shell is not allowed")
if re.search(r'wget\s+.*\|\s*(ba)?sh', cmd):
    block("Piping wget output to shell is not allowed")

# chmod 777
if re.search(r'chmod\s+777', cmd):
    block("chmod 777 is not allowed")

# Password/token echoing
if re.search(r'echo\s+.*(password|passwd|token|secret|api.?key)', cmd, re.IGNORECASE):
    block("Echoing passwords or tokens is not allowed")

sys.exit(0)
PYEOF
