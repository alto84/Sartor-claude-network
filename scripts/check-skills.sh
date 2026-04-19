#!/bin/bash
ls -la ~/Sartor-claude-network/.claude/skills/ 2>/dev/null
echo "==="
for f in ~/Sartor-claude-network/.claude/skills/*.md; do
    echo "--- $f ---"
    head -5 "$f"
    echo
done
