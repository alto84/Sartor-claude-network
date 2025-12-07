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
6. **Inject skills inline** - Don't just reference files, include the content

## CRITICAL: Skill Injection

Skills in `.claude/skills/*.md` are just files. Agents don't automatically inherit them.

**To actually give an agent a skill, include it in the prompt:**

```
**Role: IMPLEMENTER**

## Skill: Refinement Protocol
Before completing, use this loop:
1. Generate initial solution
2. Self-audit: Does it meet the goal?
3. Score confidence (0-1)
4. If score < 0.8, refine and repeat (max 3 times)

## Task
[Your task here]
```

**Quick skill summaries to inject:**

### For any agent needing refinement:
```
## Protocol: Refinement Loop
Generate → Self-Audit → Score → Refine if <0.8 (max 3 iterations)
```

### For agents working with memory:
```
## Skill: Memory Access
Use MemorySystem from src/memory/memory-system.ts:
- createMemory(content, type, {importance_score, tags})
- getMemory(id), searchMemories({filters, limit})
- Types: EPISODIC, SEMANTIC, PROCEDURAL, WORKING
```

### For role enforcement:
```
## Role: AUDITOR
- CAN: Read files, run tests, check types, score quality
- CANNOT: Modify ANY files (this is a hard constraint)
- Output: Score (1-10), issues list, recommendations
```

**The rule:** If you want an agent to HAVE a skill, paste the skill content into their prompt. File references alone don't work.
