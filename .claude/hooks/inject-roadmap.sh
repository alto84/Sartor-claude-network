#!/bin/bash

# inject-roadmap.sh - SessionStart hook to inject roadmap context
# Delegates to roadmap-context.sh for dynamic roadmap tracking
# Falls back to static parsing if TypeScript compilation unavailable

set -euo pipefail

# Use the dynamic roadmap-context.sh which uses the TypeScript skill
ROADMAP_CONTEXT_SCRIPT="/home/user/Sartor-claude-network/.claude/hooks/roadmap-context.sh"

if [[ -x "$ROADMAP_CONTEXT_SCRIPT" ]]; then
    exec "$ROADMAP_CONTEXT_SCRIPT"
else
    # Fallback to static roadmap display
    >&2 echo ""
    >&2 echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    >&2 echo "[ROADMAP CONTEXT]"
    >&2 echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    >&2 echo "📍 Current Phase: Phase 4 - Memory System Implementation"
    >&2 echo "🎯 Objective: Implement tiered memory architecture"
    >&2 echo ""
    >&2 echo "🔜 Next Tasks:"
    >&2 echo "  1. Implement Hot Tier (Firebase Realtime Database)"
    >&2 echo "  2. Implement Warm Tier (Firestore + Vector Database)"
    >&2 echo "  3. Implement Cold Tier (GitHub Storage)"
    >&2 echo ""
    >&2 echo "For detailed roadmap, see: /home/user/Sartor-claude-network/IMPLEMENTATION_ORDER.md"
    >&2 echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    >&2 echo ""
fi
