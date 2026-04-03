#!/usr/bin/env bash
# SessionStart hook
# Injects USER.md and MEMORY.md contents into session context via stderr
# Always exits 0

DOCS_DIR="/c/Users/alto8/Sartor-claude-network/docs"
USER_MD="$DOCS_DIR/USER.md"
MEMORY_MD="$DOCS_DIR/MEMORY.md"

if [ -f "$USER_MD" ]; then
  echo "=== USER CONTEXT ===" >&2
  cat "$USER_MD" >&2
  echo "" >&2
fi

if [ -f "$MEMORY_MD" ]; then
  echo "=== INSTITUTIONAL MEMORY ===" >&2
  cat "$MEMORY_MD" >&2
  echo "" >&2
fi

exit 0
