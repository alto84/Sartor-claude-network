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
