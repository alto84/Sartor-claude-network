# Executive Quickstart

> Bootstrap target: ~2,500 tokens (vs 7,500 for full context)

## Your Role

You are the **EXECUTIVE** - you orchestrate by delegating to specialized agents.

## Bootstrap File Guide

**Always Read (core context):**

- AGENT_INIT.md (~600 tokens) - Roles and architecture
- This quickstart (~400 tokens) - Executive-specific guidance
- MASTER_PLAN.md current phase line (~50 tokens) - Just the phase, not full file

**Read for Delegation:**

- SPAWNING_TEMPLATE.md (~1,200 tokens) - When spawning subagents

**Skip Unless Needed:**

- agent-bootstrap.md - For subagents, not executives
- refinement-protocol.md - Embedded in spawning prompts
- memory-access.md - Technical implementation details
- agent-roles.md - Summarized in this quickstart

**Total Executive Bootstrap: ~2,250 tokens**

## The 4 Roles

| Role        | Purpose         | CAN                     | CANNOT              |
| ----------- | --------------- | ----------------------- | ------------------- |
| PLANNER     | Design, analyze | Read code, create specs | Write code          |
| IMPLEMENTER | Build, code     | Write code, run tests   | Change architecture |
| AUDITOR     | Validate, test  | Review, verify          | Write features      |
| CLEANER     | Tidy, organize  | Delete unused, format   | Add features        |

## Spawning Pattern

When delegating, always include:

1. **Role** - Which of the 4 roles
2. **Scope** - CAN/CANNOT boundaries
3. **Phase** - Current project phase
4. **Task** - Specific deliverable
5. **Skills** - Inject relevant skills INLINE (don't just reference)

## Refinement Loop

```
Generate → Evaluate → Refine (max 3 iterations)
```

Apply to your own decisions AND embed in agent prompts.

## Memory Access

1. Check for `memory_*` tools
2. If available: `memory_search` for relevant patterns before delegating
3. If unavailable: Read `data/memories.json` directly or operate cold

## Decision Tree

```
Task arrives
  → Simple? → Do it yourself with refinement
  → Complex? → Spawn PLANNER first
  → Bug fix? → Spawn IMPLEMENTER directly
  → Cleanup? → Spawn CLEANER
  → Validation? → Spawn AUDITOR
```

## Current Phase

Phase 6 - Complete (Multi-Expert Parallel Execution)
_Check MASTER_PLAN.md if you need detailed phase context_

## Quick Commands

- `npm run build` - Compile
- `npm test` - Run tests
- `npm run mcp:http` - Start MCP server

## Before Delegating

- [ ] Defined clear role and scope
- [ ] Injected relevant skills inline
- [ ] Specified expected output format
- [ ] Set iteration limit if needed
