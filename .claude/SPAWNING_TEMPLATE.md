# Subagent Spawning Template

Use this template when delegating to subagents via the Task tool.

## CRITICAL: Subagent Exemption from Delegation Enforcement

**BEFORE doing ANY Edit/Write operations, subagents MUST set their role:**

```bash
export CLAUDE_AGENT_ROLE=[PLANNER|IMPLEMENTER|AUDITOR|CLEANER]
```

This environment variable exempts subagents from the orchestrator's delegation enforcement hooks, allowing them to edit src/ files directly. Without this variable set, the preToolUse hooks will BLOCK all Edit/Write operations on implementation files.

**Implementation Pattern:**
1. First action in your session: `export CLAUDE_AGENT_ROLE=<your-role>`
2. Verify it's set: `echo $CLAUDE_AGENT_ROLE`
3. Then proceed with file operations

The delegation enforcer script (`~/.claude/hooks/delegation-enforcer.sh`) checks for this variable and exits with code 0 (allow) if set, or code 2 (block) if not set.

---

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

## IMPORTANT: Agent Role Identification
You are a SUBAGENT. Set this environment variable in your context:
- CLAUDE_AGENT_ROLE=[PLANNER|IMPLEMENTER|AUDITOR|CLEANER]

This exempts you from orchestrator delegation enforcement, allowing you to edit implementation files.

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

## IMPORTANT: Agent Role Identification
You are a SUBAGENT. Set this environment variable in your context:
- CLAUDE_AGENT_ROLE=IMPLEMENTER

This exempts you from orchestrator delegation enforcement, allowing you to edit implementation files.

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

## IMPORTANT: Agent Role Identification
You are a SUBAGENT. Set this environment variable in your context:
- CLAUDE_AGENT_ROLE=AUDITOR

This exempts you from orchestrator delegation enforcement (though auditors shouldn't edit anyway).

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

## IMPORTANT: Agent Role Identification
You are a SUBAGENT. Set this environment variable in your context:
- CLAUDE_AGENT_ROLE=CLEANER

This exempts you from orchestrator delegation enforcement, allowing you to edit implementation files.

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

## Subagent Output Format (REQUIRED)

**ALL subagents MUST use this format when reporting back to the orchestrator.**

When completing your task, structure your response as:

```markdown
### Status
[SUCCESS | BLOCKED | FAILED]

### Summary
[2-3 sentence summary of what was done]

### Findings
[Detailed findings, evidence, or deliverables]

### Memory Candidates
[Any findings that should be persisted to Memory MCP - orchestrator will store these]
- Content: [what to store]
- Type: [semantic|procedural|episodic]
- Importance: [0.0-1.0]
- Tags: [relevant tags]

### Blockers (if any)
[What blocked progress, what's needed to unblock]

### Recommendations
[Next steps, follow-up tasks suggested]
```

**Status Definitions:**
- **SUCCESS**: Task completed as specified, all deliverables met
- **BLOCKED**: Cannot proceed without external input/decision/resource
- **FAILED**: Attempted but could not complete (include why in Blockers)

**Memory Candidates Guidelines:**
- Only include findings worth persisting across sessions
- Use SEMANTIC (0.9+) for critical facts/directives
- Use PROCEDURAL (0.7-0.8) for successful patterns/methods
- Use EPISODIC (0.5-0.7) for context/events
- Include specific, actionable content (not vague summaries)

**Example Output:**

```markdown
### Status
SUCCESS

### Summary
Added batchCreate method to MemorySystem class. Method creates multiple memories in a single transaction with atomic rollback on failure. All existing tests pass and new test coverage added.

### Findings
- Implemented `batchCreate(memories: MemoryInput[]): Promise<Memory[]>` in src/memory/memory-system.ts
- Added transaction support with rollback on any failure
- Test coverage: 8 new test cases covering success, partial failure, and rollback scenarios
- Performance: ~3x faster than sequential creates for batches >5 items

### Memory Candidates
- Content: "MemorySystem.batchCreate uses transaction pattern with atomic rollback - wrap in try/catch and reverse on error"
  Type: procedural
  Importance: 0.75
  Tags: ["memory-system", "batch-operations", "transactions"]

### Blockers
None

### Recommendations
- Consider adding batch operations for update/delete as well
- Monitor performance with batches >100 items
```

## Key Principles

1. **Always assign a role** - Agents perform better with clear identity
2. **Limit scope** - Prevent unintended side effects
3. **State the phase** - Keeps work aligned with roadmap
4. **Define constraints** - CAN/CANNOT makes boundaries clear
5. **Specify output format** - Gets consistent, usable responses
6. **Inject skills inline** - Don't just reference files, include the content
7. **Require standardized handoff** - Subagents MUST use the output format above

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

---

## Memory Access Patterns

### Architecture: MCP Tools vs JSON Fallback

**IMPORTANT: This is by design, not a bug.**

- **Orchestrator (main Claude Code)**: Has MCP tools (memory_create, memory_get, memory_search, memory_stats)
- **Subagents (spawned via Task tool)**: Do NOT have MCP tools, use JSON file fallback

This separation ensures the orchestrator maintains the authoritative memory state while allowing subagents read access and the ability to propose new memories.

### Pattern 1: Reading Memories (Subagents)

Subagents can read memories directly from the JSON file:

```typescript
import * as fs from 'fs';
import * as path from 'path';

// Read memories.json directly
const memoriesPath = '/home/alton/Sartor-claude-network/data/memories.json';
const rawData = fs.readFileSync(memoriesPath, 'utf-8');
const data = JSON.parse(rawData);

// Filter by importance (high-priority directives)
const criticalMemories = Object.values(data.memories).filter(
  (m: any) => m.importance_score >= 0.9
);

// Filter by type (semantic = facts, procedural = methods, episodic = events)
const procedures = Object.values(data.memories).filter(
  (m: any) => m.type === 'procedural' && m.importance_score >= 0.7
);

// Filter by tags
const testingMemories = Object.values(data.memories).filter(
  (m: any) => m.tags?.includes('testing')
);
```

**When to read memories as a subagent:**
- At task start: Check for relevant directives, patterns, or context
- Before implementing: Search for procedural memories about similar work
- During validation: Compare against semantic facts and user directives

### Pattern 2: Writing Memories (Subagents)

Subagents CANNOT write directly to memories.json. Instead, include memory candidates in your handoff output:

```markdown
## Memory Candidates

**Semantic (importance 0.9):**
- **Content**: "User directive: All production systems must use actual implementations, mocks are forbidden"
- **Tags**: ["directive", "testing", "production"]
- **Rationale**: Critical constraint that affects all future development

**Procedural (importance 0.8):**
- **Content**: "Pattern: When refactoring multi-file modules, use grep to find all references before moving functions"
- **Tags**: ["refactoring", "safety", "best-practice"]
- **Rationale**: Prevented breaking changes during coordination module restructure

**Episodic (importance 0.6):**
- **Content**: "Session 2025-12-11: Discovered subagents can read memories.json directly despite lacking MCP tools"
- **Tags**: ["architecture", "discovery", "memory-system"]
- **Rationale**: Important context about system capabilities
```

The orchestrator will review your candidates and persist appropriate ones via Memory MCP.

### Pattern 3: Memory Types and Importance Levels

**Use these guidelines when proposing memories:**

| Type | Importance | What to Store | Examples |
|------|-----------|---------------|----------|
| SEMANTIC | 0.9-1.0 | User directives, critical facts, architectural decisions | "No mocks in production", "System goal: self-funding via solar inference" |
| SEMANTIC | 0.7-0.9 | Important facts, constraints, dependencies | "Memory MCP runs on port 3001", "Subagents lack MCP tools by design" |
| PROCEDURAL | 0.8-0.9 | Successful patterns, validated methods | "Refinement loop: Generate → Audit → Score → Refine if <0.8" |
| PROCEDURAL | 0.6-0.8 | Useful techniques, debugging approaches | "Use grep before refactoring to find all references" |
| EPISODIC | 0.6-0.8 | Significant session events, discoveries | "Found 3 critical mocks during audit 2025-12-11" |
| EPISODIC | 0.4-0.6 | Context, minor events, observations | "Spent 2 hours debugging CRDT merge logic" |

**What NOT to store:**
- Trivial observations (importance <0.4)
- Temporary state that won't be relevant next session
- Information already well-documented in code or README
- Redundant facts already in other memories

### Pattern 4: Skill Injection for Memory Access

When spawning a subagent that needs memory access, inject this skill:

```markdown
## Skill: Memory Access for Subagents

**Reading Memories:**
```typescript
const memoriesPath = '/home/alton/Sartor-claude-network/data/memories.json';
const data = JSON.parse(fs.readFileSync(memoriesPath, 'utf-8'));
const relevant = Object.values(data.memories).filter(m =>
  m.importance_score >= 0.7 && m.tags?.includes('your-domain')
);
```

**Writing Memories:**
You cannot write directly. Include "Memory Candidates" section in your output:
- SEMANTIC (0.9+): Critical findings, user directives
- PROCEDURAL (0.7-0.8): Successful patterns, methods
- EPISODIC (0.5-0.7): Session events, context

Orchestrator will persist via Memory MCP on your behalf.
```

### Example: Subagent Task with Memory Integration

```markdown
**Role: IMPLEMENTER**
**Scope:** src/skills/ only
**Phase:** Phase 6 - Enhancement

## Skill: Memory Access for Subagents

**Reading Memories:**
```typescript
const memoriesPath = '/home/alton/Sartor-claude-network/data/memories.json';
const data = JSON.parse(fs.readFileSync(memoriesPath, 'utf-8'));
const relevant = Object.values(data.memories).filter(m =>
  m.importance_score >= 0.7 && m.tags?.includes('skills')
);
```

**Writing Memories:**
Include "Memory Candidates" section in your output with type, importance, tags, and rationale.

## Context
Adding a new skill for cost-aware operation selection.

## Task
1. Read memories.json to find any existing directives about cost optimization
2. Implement cost-aware-selection.ts skill
3. Propose memory candidates for successful patterns discovered

## Expected Output
- New skill file with implementation
- Summary of relevant memories found
- Memory candidates section with any learnings worth persisting
```
