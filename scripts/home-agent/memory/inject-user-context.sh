#!/usr/bin/env bash
# SessionStart hook
# Injects session context from unprotected memory files via stderr
# Always exits 0

REPO="/c/Users/alto8/Sartor-claude-network"

# Nightly-curated context
for f in "$REPO/docs/USER.md" "$REPO/docs/MEMORY.md"; do
  [ -f "$f" ] && { echo "=== $(basename "$f") ===" >&2; cat "$f" >&2; echo "" >&2; }
done

# Quick reference (freely editable)
QR="$REPO/sartor/memory/QUICK-REFERENCE.md"
[ -f "$QR" ] && { echo "=== QUICK REFERENCE ===" >&2; cat "$QR" >&2; echo "" >&2; }

# Feedback rules (behavioral memory)
for f in "$REPO/sartor/memory/feedback/"*.md; do
  [ -f "$f" ] && { echo "=== FEEDBACK: $(basename "$f" .md) ===" >&2; cat "$f" >&2; echo "" >&2; }
done

exit 0
