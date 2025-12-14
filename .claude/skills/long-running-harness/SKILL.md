# Long-Running Agent Harness Skill

## Purpose

Guidelines for building effective harnesses that keep long-running agents productive and prevent context rot, confusion, and degradation.

Based on: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

## Core Principles

### 1. Context Management

- **Summarize, don't accumulate**: Periodically compress context
- **Checkpoint state**: Save recovery points frequently
- **Delegate reading**: Let subagents read large files
- **Track what matters**: Keep IDs and status, not full content

### 2. Error Recovery

```markdown
## Recovery Protocol

1. Detect failure (timeout, error, confusion)
2. Save current state to checkpoint
3. Analyze failure cause
4. Decide: retry, rollback, or escalate
5. Resume with fresh context if needed
```

### 3. Progress Tracking

Every long-running operation should:

- Update status at regular intervals
- Write intermediate results to disk
- Maintain a "last known good" state
- Log decisions and rationale

### 4. Confusion Detection

Watch for signs of agent confusion:

- Repeating the same action
- Contradicting previous statements
- Making claims without evidence
- Forgetting recent context
- Creating workarounds for non-existent problems

### 5. Context Refresh Protocol

When context is getting stale:

```markdown
1. Save current todo list and agent registry
2. Write summary of accomplishments
3. Document open questions/blockers
4. Create fresh checkpoint
5. If needed, start new session with checkpoint
```

## Harness Patterns

### Pattern 1: Batch Processing

```
For each batch of N items:
  1. Process batch
  2. Save results
  3. Update progress
  4. Check for confusion
  5. Continue or checkpoint
```

### Pattern 2: Agent Swarm

```
While work remains:
  1. Spawn agents (max 10-15)
  2. Monitor progress (non-blocking)
  3. Collect completed outputs
  4. Synthesize learnings
  5. Update plan
  6. Spawn next wave
```

### Pattern 3: Iterative Refinement

```
For max N iterations:
  1. Generate solution
  2. Evaluate against criteria
  3. If good enough, stop
  4. Extract improvement signals
  5. Refine and retry
```

## Anti-Patterns to Avoid

### Context Rot

- ❌ Accumulating all agent outputs in context
- ❌ Reading large files directly instead of delegating
- ❌ Not checkpointing progress
- ✅ Summarize and store, keep context lean

### Agent Confusion

- ❌ Letting agents run indefinitely without check-ins
- ❌ Ignoring signs of repetition or contradiction
- ❌ Not providing clear scope boundaries
- ✅ Regular status checks, clear task boundaries

### Resource Exhaustion

- ❌ Spawning unlimited agents
- ❌ Not tracking API costs
- ❌ Ignoring rate limits
- ✅ Budget tracking, rate limiting, agent caps

## Checkpoint Format

```json
{
  "timestamp": "ISO-8601",
  "phase": "current phase",
  "completed_tasks": ["list"],
  "active_agents": [{ "id": "...", "task": "...", "status": "..." }],
  "pending_tasks": ["list"],
  "key_learnings": ["list"],
  "blockers": ["list"],
  "next_actions": ["list"]
}
```

## Recovery From Checkpoint

1. Read CONTEXT_CHECKPOINT.md
2. Read data/memories.json for procedural knowledge
3. Check reports/agents/ for recent agent outputs
4. Resume from last known good state
5. Re-spawn any failed agents

## Self-Monitoring Checklist

Every 10-15 minutes of work:

- [ ] Are agents making progress?
- [ ] Is my context still coherent?
- [ ] Have I checkpointed recently?
- [ ] Are there any stuck agents?
- [ ] Am I accumulating too much context?
- [ ] Should I synthesize and compress?
