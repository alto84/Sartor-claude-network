# CLAUDE.md - Project Context for Claude Code

## Project: Sartor-Claude-Network v1.0.0

Multi-tier episodic memory system with refinement-powered executive orchestration.

## Quick Start

When starting a session in this project:
1. Check `MASTER_PLAN.md` for current phase and priorities
2. Review `.claude/AGENT_INIT.md` for role definitions
3. Use `.claude/SPAWNING_TEMPLATE.md` when delegating to subagents

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Executive Claude                    │
│         (Orchestrates via refinement loops)          │
├─────────────────────────────────────────────────────┤
│  Planner  │  Implementer  │  Auditor  │  Cleaner   │
├─────────────────────────────────────────────────────┤
│                   Memory System                      │
│   Hot (<100ms)  │  Warm (<500ms)  │  Cold (<2s)    │
├─────────────────────────────────────────────────────┤
│                 Skills Library                       │
│  (7 skills with self-auditing + refinement)         │
└─────────────────────────────────────────────────────┘
```

## Key Commands

```bash
npm run demo      # See self-improvement in action
npm run benchmark # Check performance metrics
npm test          # Run test suite
npm run build     # Compile TypeScript
```

## Available Skills

Skills in `.claude/skills/`:
- `memory-access.md` - Use the 3-tier memory system
- `refinement-protocol.md` - Execute with iterative refinement
- `agent-roles.md` - Understand the 4 agent roles

## Spawning Subagents

When using the Task tool, always include:
1. **Role** (Planner/Implementer/Auditor/Cleaner)
2. **Scope** (files they can touch)
3. **Context** (current phase, relevant background)
4. **Constraints** (CAN/CANNOT boundaries)

See `.claude/SPAWNING_TEMPLATE.md` for examples.

## Core Principles

1. **Refinement First**: Generate → Evaluate → Refine
2. **Evidence-Based**: No assumptions, verify claims
3. **Self-Auditing**: Check your own work before completing
4. **Memory-Driven**: Record learnings, retrieve patterns
5. **Role-Scoped**: Stay within your assigned boundaries
