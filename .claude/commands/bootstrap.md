# Quick Bootstrap for Sartor-Claude-Network

Read and internalize these files to get up to speed:

1. **First**: Read `.claude/AGENT_INIT.md` - understand roles (Planner/Implementer/Auditor/Cleaner) and architecture
2. **Then**: Read `CLAUDE.md` - full API reference for subagent, coordination, and experience systems
3. **If delegating**: Read `.claude/EXECUTIVE_QUICKSTART.md` - spawning patterns

## Current State
- **Branch**: `claude/setup-firebase-database-01M6prT9FJ9mJDMRvTxNEKEp`
- **Tests**: 329 passing across subagent/coordination/experience modules
- **Build**: Clean

## Quick Commands
```bash
npm run build    # Compile
npm test         # Run tests
npm run mcp:http # Start MCP server
```

## New Modules (just built)
- `src/subagent/` - Agent bootstrap, registry, messaging
- `src/coordination/` - CRDT plan sync, work distribution, progress tracking
- `src/experience/` - Context discovery, relevance filtering, adaptive intelligence

Confirm you've loaded context, then proceed with your task.
