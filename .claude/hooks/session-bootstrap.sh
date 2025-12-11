#!/bin/bash
# Session Bootstrap Hook - Auto-injects context for new Claude Code sessions
# Place in .claude/hooks/ and configure in settings

cat << 'BOOTSTRAP'
## SARTOR-CLAUDE-NETWORK CONTEXT

**Project**: Multi-tier memory system with subagent coordination (v1.0.0)

**Architecture**:
- Subagent: bootstrap.ts, registry.ts, messaging.ts (203 tests)
- Coordination: plan-sync.ts (CRDT), work-distribution.ts, progress.ts
- Experience: auto-discover.ts, relevance.ts, intelligence.ts (102 tests)
- Memory: Hot (<100ms) → Warm (<500ms) → Cold (<2s)

**Current Branch**: claude/setup-firebase-database-01M6prT9FJ9mJDMRvTxNEKEp

**Key Files**:
- CLAUDE.md - Full documentation
- .claude/AGENT_INIT.md - Role definitions
- .claude/EXECUTIVE_QUICKSTART.md - Delegation patterns

**Commands**: `npm run build` | `npm test` | `npm run mcp:http`

**Read CLAUDE.md for full API reference.**
BOOTSTRAP
