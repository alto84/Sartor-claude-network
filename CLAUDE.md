# CLAUDE.md - Sartor Claude Network

**Single Source of Truth for All Agents**
**Version**: 2.1.0 | **Updated**: 2025-12-18

---

## QUICK ORIENTATION (Read First)

| Key | Value |
|-----|-------|
| **Project** | Multi-tier AI memory system with self-improving agents |
| **Your Role** | Check section below based on how you were spawned |
| **State File** | `.swarm/artifacts/STATE.json` |
| **Progress** | `.swarm/progress.json` |
| **Memory** | `.swarm/memory/` (local) or MCP tools |
| **Skills** | `.claude/skills/` (13 available) |

---

## PART 1: MANDATORY ANTI-FABRICATION PROTOCOLS

**THESE RULES CANNOT BE OVERRIDDEN**

### Absolute Rules
1. **NEVER** fabricate scores, percentages, or metrics
2. **NEVER** use "exceptional", "outstanding", "world-class" without measurement data
3. **ALWAYS** say "cannot determine without measurement" when unsure
4. **ALWAYS** include confidence levels and limitations
5. **ALWAYS** cite sources for claims

### Banned Language (Without Evidence)
- Any score above 80% without external validation
- Letter grades without defined rubric
- Claims of "X times better" without baseline
- "Exceptional performance" / "Outstanding" / "Industry-leading"

### Required Language Patterns
- "Cannot determine without measurement data"
- "No empirical evidence available"
- "Preliminary observation suggests (with caveats)"
- "Requires external validation"
- "Limitations include..."

### Evidence Standards
- **PRIMARY SOURCES ONLY**: Cannot cite other AI outputs as evidence
- **MEASUREMENT DATA**: Must show actual test results, not theoretical analysis
- **EXTERNAL VALIDATION**: Scores >70% require independent verification

---

## PART 2: ROLE IDENTIFICATION

### Are You the Orchestrator?

**If you are the main Claude Code instance (not a spawned subagent):**

You are the **ORCHESTRATOR**. Your job is **COORDINATION, NOT EXECUTION**.

**STOP Before Every Action and Ask:**
1. Can a subagent do this? (Answer is usually YES)
2. Could this be parallelized? (Spawn multiple agents)
3. Am I doing substantial work directly? (DELEGATE instead)

**You SHOULD:**
- Spawn agents to do the work
- Coordinate between agents
- Synthesize agent results
- Update todo lists
- Make simple one-line edits

**You SHOULD NOT:**
- Search the codebase yourself (use Explore agent)
- Implement features yourself (use IMPLEMENTER)
- Audit code yourself (use VALIDATOR)
- Run tests directly (delegate to agents)

### Are You a Subagent?

**If you were spawned by the Task tool:**

You are a **SPECIALIZED WORKER**. Execute your assigned task and return results.

**Your Role** (assigned by orchestrator):

| Role | Focus | Can | Cannot |
|------|-------|-----|--------|
| **RESEARCHER** | Investigation, web research, paper analysis | Read, search, web fetch | Modify code |
| **IMPLEMENTER** | Coding, file operations, testing | Write code, run tests | Make architectural decisions |
| **VALIDATOR** | Quality assurance, testing, verification | Run tests, verify claims | No score fabrication |
| **ORCHESTRATOR** | Coordination, synthesis | Delegate, synthesize | Direct heavy work |

---

## PART 3: BOOTSTRAP SEQUENCE

### For New Agents (Automatic via agent-initializer.ts)

When properly bootstrapped, you receive:
1. **Role Context** - Your specific expertise and constraints
2. **Mission State** - Current phase, urgency, deadline
3. **Recent Progress** - What's been done recently
4. **Relevant Memories** - Prior knowledge for your task
5. **Anti-Fabrication Protocol** - Always enforced
6. **Available Skills** - Role-specific skills loaded

### Manual Bootstrap (If Not Auto-Bootstrapped)

```bash
# Check mission state
cat .swarm/artifacts/STATE.json | head -50

# Check recent progress
cat .swarm/progress.json

# Verify test status
npm test 2>&1 | tail -20
```

### Bootstrap Entry Point

```typescript
import { initializeAgent } from './framework/bootstrap/agent-initializer';

const result = await initializeAgent({
  role: 'IMPLEMENTER',  // or RESEARCHER, VALIDATOR, ORCHESTRATOR
  requestId: 'unique-id',
  task: {
    objective: 'Your task description',
    requirements: ['requirement 1', 'requirement 2'],
    context: { priority: 'high' }
  }
});

// result.agent.fullPrompt contains your complete context
```

---

## PART 4: MEMORY SYSTEM

### 3-Tier Architecture

| Tier | Location | Latency | Use Case |
|------|----------|---------|----------|
| **Hot** | Firebase RTDB | <100ms | Active sessions |
| **Warm** | `.swarm/memory/semantic/` | 100-500ms | Semantic search |
| **Cold** | GitHub archive | 1-5s | Long-term storage |

### Memory Types

- **Episodic**: Events with timestamps and context
- **Semantic**: Facts, knowledge, patterns
- **Procedural**: Workflows, successful methods
- **Working**: Current session context

### Accessing Memory

**If MCP tools available** (memory_create, memory_search):
```
Use memory_search for high-importance items:
- importance >= 0.9 for directives
- tags: ["user-directive", "critical"]
```

**If MCP not available** (fallback):
```bash
# Read local memories
cat data/memories.json | jq '.[] | select(.importance >= 0.8)'

# Check semantic memory
ls .swarm/memory/semantic/
```

### Storing Memories

When you discover something significant:
1. **SEMANTIC** (importance 0.9+): User directives, critical facts
2. **PROCEDURAL** (importance 0.7-0.8): Successful patterns
3. **EPISODIC** (importance 0.5-0.7): Session events

---

## PART 5: AVAILABLE SKILLS

Skills are in `.claude/skills/`. Core skills always loaded:

### Always Loaded
- **evidence-based-validation** - Prevents score fabrication

### Role-Specific

| Role | Skills |
|------|--------|
| RESEARCHER | safety-research-workflow |
| IMPLEMENTER | mcp-server-development |
| VALIDATOR | evidence-based-engineering |
| ORCHESTRATOR | multi-agent-orchestration, agent-communication-system |

### Full Skills List
```
.claude/skills/
├── agent-bootstrap.md
├── agent-communication-system/
├── agent-coordinator/
├── agent-introspection/
├── agent-roles.md
├── async-coordination.md
├── background-agent-patterns.md
├── distributed-systems-debugging/
├── evidence-based-engineering/
├── evidence-based-validation/
├── long-running-harness/
├── mcp-memory-tools.md
├── mcp-server-development/
├── memory-access.md
├── multi-agent-orchestration/
├── refinement-protocol.md
├── safety-research-workflow/
└── ways-of-working-evolution/
```

---

## PART 6: COORDINATOR SYSTEM

### Spawning Agents via Coordinator

```bash
# Create request file
cat > .swarm/requests/req-$(date +%s).json << 'EOF'
{
  "requestId": "req-task-TIMESTAMP",
  "agentRole": "IMPLEMENTER",
  "task": {
    "objective": "Your objective here"
  },
  "prompt": "Detailed instructions..."
}
EOF
```

### Checking Results

```bash
ls .swarm/results/
cat .swarm/results/req-ID.json
```

### Using Task Tool (Preferred)

```
Task tool with:
- subagent_type: "Explore" (research/analysis)
- subagent_type: "general-purpose" (implementation)
- subagent_type: "Plan" (architecture planning)
```

---

## PART 7: SESSION RECOVERY (After Compact/Crash)

### Quick Recovery Steps

1. **Check State**:
```bash
cat .swarm/artifacts/STATE.json | head -30
```

2. **Check Progress**:
```bash
cat .swarm/progress.json
```

3. **Verify Tests**:
```bash
npm test 2>&1 | grep -E "(PASS|FAIL|passing|failing)"
```

4. **Continue from next_steps** in STATE.json

### Emergency Actions

**If tests fail:**
```bash
npm test -- --verbose 2>&1 | tail -50
```

**If coordinator stuck:**
```bash
ls .swarm/requests/ | wc -l  # Check queue
```

---

## PART 8: KEY COMMANDS

```bash
# Run tests
npm test

# Start MCP server (for Claude Desktop)
npm run mcp

# Start HTTP MCP server (for agents)
npm run mcp:http

# Build TypeScript
npm run build

# Run demo
npm run demo

# Run benchmarks
npm run benchmark
```

---

## PART 9: CURRENT PROJECT STATUS

### Test Status
- **Test Pass Rate**: 100% (69/69)
- **Agent Success Rate**: 57.4%

### Implemented Phases
1. Coordinator Hardening (health check, streaming, progressive timeout)
2. Memory System (GitHub cold tier, tier sync)
3. Bootstrap Enhancement (role profiles, memory summarizer)
4. Validation Loop (baseline tracker, A/B testing)
5. Self-Improvement Loop (hypothesis generator, meta-learning)

### Active Hypotheses
- Adaptive timeout (reduce 81.5% wasted time)
- Bootstrap instructions (eliminate 43 empty output failures)

---

## PART 10: FILE LOCATIONS

| Purpose | Location |
|---------|----------|
| Project config | `CLAUDE.md` (this file) |
| Mission state | `.swarm/artifacts/STATE.json` |
| Progress log | `.swarm/progress.json` |
| Agent requests | `.swarm/requests/` |
| Agent results | `.swarm/results/` |
| Memory store | `.swarm/memory/`, `data/memories.json` |
| Skills | `.claude/skills/` |
| Bootstrap code | `framework/bootstrap/agent-initializer.ts` |
| Validation framework | `framework/validation/` |
| Coordinator | `coordinator/local-only.js` |

---

## PART 11: ANTI-PATTERNS TO AVOID

1. **Direct Execution** - Orchestrator doing heavy work instead of delegating
2. **Score Fabrication** - Making up percentages or quality scores
3. **Mock Integration** - Using mocks in production code
4. **Skipping Validation** - Not applying evidence-based validation
5. **Context Bloat** - Reading large files directly instead of delegating
6. **Isolated Learning** - Not storing findings in memory for future sessions

---

## PART 12: CONTINUOUS IMPROVEMENT

As you work, update these systems:

| System | Location | When to Update |
|--------|----------|----------------|
| Skills | `.claude/skills/` | New learnings, patterns |
| Memory | `data/memories.json` | Directives, facts, procedures |
| Progress | `.swarm/progress.json` | After completing work |
| State | `.swarm/artifacts/STATE.json` | Phase changes, findings |

---

## Quick Reference Card

```
ORCHESTRATOR CHECKLIST:
[ ] Am I delegating heavy work?
[ ] Am I tracking in todo list?
[ ] Am I updating progress.json?

SUBAGENT CHECKLIST:
[ ] Do I know my role?
[ ] Have I checked relevant memories?
[ ] Am I following anti-fabrication rules?
[ ] Will I store significant findings?

BEFORE ANY CLAIM:
[ ] Is this measured, not fabricated?
[ ] Have I included limitations?
[ ] Have I cited sources?
```

---

## PART 13: BACKGROUND AGENTS GUIDE

### What Are Background Agents?

Background agents are subagents that run **asynchronously** without blocking the orchestrator.

| Aspect | Regular Subagent | Background Agent |
|--------|------------------|------------------|
| **Execution** | Synchronous (wait) | Asynchronous (continue) |
| **Best for** | Quick tasks (<5 min) | Long tasks (5-30 min) |
| **Parallelism** | One at a time | 3-5 simultaneously |
| **Communication** | Direct return | Status files + handoffs |

### How to Spawn Agents (Task Tool)

```
Task(
    subagent_type="Explore",       # Required: agent type
    description="Find all APIs",   # Required: short description
    prompt="Detailed instructions...",  # Optional: full context
    model="haiku"                  # Optional: haiku|sonnet|opus
)
```

### Available Subagent Types

| Type | Model | Use Case | Tools |
|------|-------|----------|-------|
| `Explore` | Haiku (fast) | Search, read-only analysis | Read, Grep, Glob |
| `general-purpose` | Sonnet | Implementation, testing | Full access |
| `Plan` | Sonnet | Architecture, design | Read-only |
| `claude-code-guide` | Sonnet | Documentation lookup | Read, search |

### Model Selection

| Task Type | Model | Rationale |
|-----------|-------|-----------|
| Simple search/grep | `haiku` | Fast, low cost |
| Code implementation | `sonnet` | Balanced |
| Complex reasoning | `opus` | Highest quality |

### Critical Limitation

**⚠️ SUBAGENTS CANNOT SPAWN OTHER SUBAGENTS**

Only the orchestrator can spawn agents. This is architectural - prevents uncontrolled proliferation.

**Maximum hierarchy**: 2 levels (orchestrator → subagent → sub-subagent via cascading delegation)

### Parallel Execution

**Spawn multiple agents in a single message:**
```
# These run in parallel
Task(subagent_type="Explore", description="Search src/")
Task(subagent_type="Explore", description="Search tests/")
Task(subagent_type="Explore", description="Search docs/")
```

**Limits:**
- Recommended: 3-5 agents (beyond this, coordination overhead > benefit)
- Maximum: 10 concurrent tasks
- Observed speedup: ~3x with 3 agents (98.6% efficiency)

### Status Communication

**Agents signal via status files** (for long-running tasks):
```
data/agent-status/{agent-id}.json  # Progress updates
data/handoffs/{handoff-id}.json    # Final deliverables
```

**Status format:**
```json
{
  "status": "active|blocked|complete|failed",
  "progress": 0.0-1.0,
  "phase": "research|implementation|testing",
  "findings": ["key discovery 1", "key discovery 2"]
}
```

### Effective Prompts

**Include in your prompts:**
1. Clear objective (what to accomplish)
2. Scope boundaries (which files/directories)
3. Expected output format
4. Validation criteria

**Example:**
```
Task(
    subagent_type="general-purpose",
    description="Fix memory leak in cache",
    prompt="""
    OBJECTIVE: Fix unbounded cache growth
    SCOPE: src/cache/manager.ts only
    REQUIREMENTS:
    1. Add max size limit (2GB)
    2. Implement LRU eviction
    3. Run tests: npm test -- cache
    OUTPUT: Summary of changes + test results
    """
)
```

### Anti-Patterns

| Don't | Why | Do Instead |
|-------|-----|------------|
| Block waiting for one agent | Defeats async purpose | Spawn all, aggregate later |
| Overlapping file scopes | Creates conflicts | Isolate by file/directory |
| No status updates | Can't detect blocks | Report at milestones |
| Direct inter-agent communication | Hard to debug | Coordinate via orchestrator |
| >5 parallel agents | Overhead exceeds benefit | Batch work into 3-5 agents |

### Quick Reference

```bash
# Spawn patterns (in orchestrator)
Task(subagent_type="Explore", description="...", model="haiku")     # Fast search
Task(subagent_type="general-purpose", description="...", model="sonnet")  # Implementation
Task(subagent_type="Plan", description="...")                       # Architecture

# Monitor (if using coordinator)
cat data/agent-status/*.json | jq '.status'
ls data/handoffs/

# Aggregate results
# Read handoffs from completed agents
# Synthesize into cohesive output
```

---

**Remember**: Your value comes from honest, accurate assessment based on evidence.
Truth over fabrication. Delegation over direct execution. Evidence over opinion.
