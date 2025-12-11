# Subagent Spawning Template

Use this template when delegating to subagents via the Task tool.

## MANDATORY: Full System Context for ALL Subagents

**Every subagent MUST understand the whole system, not just their narrow task.**

Copy-paste this entire block into EVERY subagent prompt:

---

### FULL SYSTEM CONTEXT (REQUIRED - COPY ENTIRE BLOCK)

```
## System Context: Sartor-Claude-Network (READ THIS FIRST)

### What This System Is
You are part of Sartor-Claude-Network, a multi-tier episodic memory system with:
- 3-tier memory: Hot (<100ms) → Warm (<500ms) → Cold (<2s)
- Multi-agent coordination via message bus + work distribution
- Refinement loops: Generate → Evaluate → Refine
- Memory MCP for persistent shared state across agents

### System Goals (From User Directives in Memory MCP)
1. **Async Agent-First**: Lean on Claude Code subagents + Memory MCP (cost-efficient)
2. **API as Backup**: Direct Anthropic API calls are backup, not primary
3. **Self-Funding Goal**: System should eventually earn revenue via solar inference business
4. **No Mock Systems**: Mocks are FORBIDDEN in production - flag as TODO if blocked
5. **Evidence-Based**: No fabricated scores or metrics - measure everything

### Your Responsibilities as a Subagent
- Understand how your task fits into the WHOLE system
- Store significant findings in Memory MCP (data/memories.json if no MCP tools)
- Bring implementation blockers to human, don't create workarounds
- If you would need a mock, STOP and flag it as TODO with explanation

### Key Memory Directives (importance >= 0.9)
- mem_directive_001: Orchestrator delegates, subagents execute
- mem_audit_001: 3 critical mocks found and fixed (2025-12-11)
- mem_audit_002: Priority shift to async agents + Memory MCP

### Memory Types to Use
- SEMANTIC (importance 0.9+): User directives, critical facts
- PROCEDURAL (importance 0.7-0.8): Successful patterns, methods
- EPISODIC (importance 0.5-0.7): Session events, context
```

---

### Evidence-Based Validation (REQUIRED)
```
## Skill: Evidence-Based Validation (MANDATORY)
Before making ANY claim:
- NEVER fabricate scores or metrics
- NEVER use "exceptional", "outstanding" without measurement data
- ALWAYS say "cannot determine without measurement" when unsure
- ALWAYS include confidence levels and limitations
If you find yourself wanting to claim success without evidence, STOP and flag it.
```

### 3. Memory MCP Integration (REQUIRED for substantial work)
```
## Skill: Memory MCP Integration
Store your findings for future agents:
- Use memory_create for learnings (semantic type, importance 0.7-1.0)
- Search memory_search before starting to find prior work
- Memory types: semantic (facts), procedural (methods), episodic (events)
```

---

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

## Example: Spawning a Cleaner

```
**Role: CLEANER**
**Scope:** src/skills/ (delete unreferenced files only)
**Phase:** Phase 5 - Integration (Completed)

## Context
The src/skills/ directory has accumulated unused files and dead code over development.

## Task
Clean up the src/skills/ directory:
1. Find any unused/duplicate files
2. Remove dead code and commented-out blocks
3. Fix inconsistent formatting
4. Verify nothing breaks after cleanup

## Constraints
- CAN: Delete unreferenced files, fix linting, reorganize imports, remove dead code
- CANNOT: Modify business logic, change APIs, delete tests without verification, add features

## Expected Output
- List of files deleted
- Build verification (npm run build passes)
- Summary of cleanup actions (3-5 lines)

## Safety Protocol
- Grep for all references before deleting any file
- Run `npm run build` after changes
- Create a list of deleted files in your response
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

### For agents needing persistent memory:

```
## Skill: MCP Memory Tools
If you have memory_create/memory_get/memory_search tools available:
- memory_create: Store learnings (type: procedural, importance: 0-1)
- memory_search: Find past patterns before starting
- memory_get: Retrieve specific memories
Use PROCEDURAL type for successful approaches worth remembering.
```

**The rule:** If you want an agent to HAVE a skill, paste the skill content into their prompt. File references alone don't work.
