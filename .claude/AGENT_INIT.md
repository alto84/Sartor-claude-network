# Agent Initialization Context

## You Are Part Of: Sartor-Claude-Network v1.0.0

A multi-tier episodic memory system with refinement-powered orchestration.

## Your Available Roles

When spawning subagents, assign one of these roles:

- **PLANNER**: Analyze, design, look ahead. Cannot write code.
- **IMPLEMENTER**: Write code, create files. Follow the plan.
- **AUDITOR**: Review, validate, test. Use evidence-based-validation.
- **CLEANER**: Remove unused files, fix formatting, keep structure clean.

## Core Architecture

- **Memory**: 3-tier (Hot <100ms, Warm <500ms, Cold <2s)
- **Refinement**: Generate → Evaluate → Refine (max 3 iterations)
- **Learning**: Every execution feeds the improvement loop

## MCP Memory Tools

When MCP is available, you can persist and retrieve memories:

- **memory_create**: Create a new memory
- **memory_get**: Retrieve by ID
- **memory_search**: Search memories
- **memory_stats**: Get statistics

**Bootstrap Mesh Fallback:**
If MCP tools aren't available, the bootstrap mesh provides access via:

1. Local file (data/memories.json) - always works
2. GitHub cold tier - if GITHUB_TOKEN configured
3. Firebase RTDB - if credentials configured

Check your tools for `memory_*` - if missing, use the read-based fallback.

## Bootstrap Sequence

When you start, follow this sequence:

1. Read this file (AGENT_INIT.md)
2. Check for MCP tools (memory_create, memory_get, etc.)
3. If no MCP: read data/memories.json directly for context
4. Search for memories relevant to your role:
   - PLANNER: procedural memories with planning/architecture tags
   - IMPLEMENTER: procedural memories with implementation/patterns tags
   - AUDITOR: procedural memories with validation/testing tags
   - CLEANER: procedural memories with cleanup/maintenance tags
5. Confirm you understand your role before starting

Target: Bootstrap in <2,000 tokens

## Key Files

- `MASTER_PLAN.md` - Living roadmap (Executive only edits full plan)
- `src/executive/` - ExecutiveClaude, SelfImprovingLoop, LearningPipeline
- `src/memory/` - MemorySystem, Hot/Warm/Cold tiers
- `src/skills/` - 7 uplifted skills with self-auditing

## When Spawning Subagents

Always include in the prompt:

1. Their ROLE (Planner/Implementer/Auditor/Cleaner)
2. Their SCOPE (what they can/cannot touch)
3. Current PHASE from MASTER_PLAN.md
4. Expected OUTPUT format

## Refinement Protocol

Before completing any task:

1. Self-audit: Does this meet the goal?
2. Evidence check: Is this based on facts, not assumptions?
3. Quality gate: Would this pass code review?

## Quick Commands

- `npm run demo` - See self-improvement in action
- `npm run benchmark` - Check performance metrics
- `npm test` - Run test suite

## Before Starting

Verify:

- [ ] I know my role and boundaries
- [ ] I checked for MCP or used fallback
- [ ] I loaded relevant memories (or noted unavailable)
- [ ] I understand my specific task
