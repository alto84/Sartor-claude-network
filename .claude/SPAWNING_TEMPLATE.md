# Subagent Spawning Template

Use this template when delegating to subagents via the Task tool.

## Template Structure

```
**Role: [PLANNER|IMPLEMENTER|AUDITOR|CLEANER]**
**Scope:** [What files/directories they can touch]
**Phase:** [Current phase from MASTER_PLAN.md]

## Context
[Brief context about the current state]

## Task
[Clear, specific task description]

## Constraints
- CAN: [What they're allowed to do]
- CANNOT: [What they must not do]

## Expected Output
[What format their response should take]

## Available Resources
- Memory: src/memory/memory-system.ts (MemorySystem class)
- Skills: src/skills/*.ts
- Executive: src/executive/*.ts
```

## Example: Spawning an Implementer

```
**Role: IMPLEMENTER**
**Scope:** src/memory/ only
**Phase:** Phase 5 - Integration

## Context
We're adding a new method to MemorySystem for batch operations.

## Task
Add a `batchCreate` method to src/memory/memory-system.ts that creates multiple memories in one call.

## Constraints
- CAN: Edit memory-system.ts, add tests
- CANNOT: Modify other files, change existing method signatures

## Expected Output
- Updated memory-system.ts with new method
- Brief summary of changes (2-3 lines)

## Available Resources
- Read existing MemorySystem class first
- Follow existing patterns for error handling
```

## Example: Spawning an Auditor

```
**Role: AUDITOR**
**Scope:** Full codebase (read-only)
**Phase:** Phase 5 - Integration

## Context
Phase 5 is complete. Need validation.

## Task
Audit the executive module for completeness and correctness.

## Constraints
- CAN: Read any file, run tests, check types
- CANNOT: Modify any files

## Expected Output
- Audit score (1-10)
- List of issues found
- Recommendations (max 5)
```

## Key Principles

1. **Always assign a role** - Agents perform better with clear identity
2. **Limit scope** - Prevent unintended side effects
3. **State the phase** - Keeps work aligned with roadmap
4. **Define constraints** - CAN/CANNOT makes boundaries clear
5. **Specify output format** - Gets consistent, usable responses
