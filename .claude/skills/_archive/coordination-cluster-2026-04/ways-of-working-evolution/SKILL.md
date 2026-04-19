# Ways of Working Evolution Skill

**Version:** 1.0.0
**Created:** 2025-12-11
**Purpose:** Continuously improve how the Sartor-Claude-Network operates as new capabilities emerge

## Overview

This skill enables systematic observation, evaluation, and improvement of the system's "ways of working" - the patterns, skills, templates, and protocols that govern how agents operate.

**Key Insight:** Claude Code capabilities evolve (e.g., async Task tool, Memory MCP). Our ways of working must evolve too, or we'll be using 2024 patterns with 2025 capabilities.

## When to Activate

1. **After significant Claude Code updates** - New features may unlock better patterns
2. **After completing major work** - Retrospective on what worked/didn't
3. **When patterns feel stale** - Something taking too long or feeling awkward
4. **Periodically** - Weekly/monthly evolution audit
5. **When user feedback suggests friction** - "Why are you doing X this way?"

## The Evolution Loop

```
OBSERVE → EVALUATE → PROPOSE → TEST → ADOPT → DOCUMENT
```

### 1. OBSERVE - What's happening?

Collect evidence about current patterns:
- Which skills are being used frequently?
- Which templates produce good results?
- What friction points exist?
- What new capabilities are available but unused?

**Memory Integration:**
```typescript
// Search for pattern usage
memory_search({
  type: "episodic",
  tags: ["skill-usage", "pattern-outcome"],
  min_importance: 0.6
})

// Record observations
memory_create({
  content: JSON.stringify({
    observation: "Async Task tool enables 10x parallelism",
    current_usage: "Spawning 3-5 agents at a time",
    potential: "Could spawn 10-20 for large tasks",
    evidence: "Skills uplift completed 7 tasks in parallel"
  }),
  type: "semantic",
  importance: 0.8,
  tags: ["ways-of-working", "observation", "capability-gap"]
})
```

### 2. EVALUATE - What's working?

Score current patterns against criteria:

| Criterion | Question |
|-----------|----------|
| Effectiveness | Does it achieve the goal? |
| Efficiency | Could it be faster/cheaper? |
| Capability Utilization | Are we using available features? |
| Delegation Quality | Do subagents get enough context? |
| Learning Persistence | Are learnings being stored? |
| Bootstrap Quality | Can fresh instances pick this up? |

**Anti-Fabrication:** Don't score without evidence. Use actual outcomes.

### 3. PROPOSE - What could be better?

Generate improvement hypotheses:

```markdown
## Improvement Proposal: [Name]

**Current Pattern:** [How it works now]
**Observed Problem:** [Evidence of friction]
**Proposed Change:** [Specific modification]
**Expected Benefit:** [Measurable outcome]
**Risk Assessment:** [What could go wrong]
**Rollback Plan:** [How to revert if needed]
```

### 4. TEST - Does it work?

Small-scale validation before adoption:
- Test on non-critical task first
- Compare outcomes to baseline
- Collect feedback from affected workflows
- Document actual (not hoped-for) results

### 5. ADOPT - Roll out the change

If test succeeds:
- Update relevant skill/template files
- Update SPAWNING_TEMPLATE if affects subagents
- Update ORCHESTRATOR_BOOTSTRAP if affects coordination
- Store the change as procedural memory

### 6. DOCUMENT - Capture the learning

```typescript
memory_create({
  content: JSON.stringify({
    change: "Increased parallel agent spawning from 5 to 15",
    rationale: "Async Task tool handles concurrency well",
    outcome: "50% faster for large tasks, no quality loss",
    adoption_date: "2025-12-11",
    affected_files: ["SPAWNING_TEMPLATE.md", "ORCHESTRATOR_BOOTSTRAP.md"]
  }),
  type: "procedural",
  importance: 0.9,
  tags: ["ways-of-working", "evolution", "adopted-change"]
})
```

## Key Areas to Evolve

### 1. Agent Spawning Patterns
- How many agents to spawn in parallel?
- What context to include?
- When to use background vs blocking?
- How to collect and synthesize results?

### 2. Memory Usage Patterns
- What to store vs discard?
- Importance score calibration
- Tag taxonomy evolution
- Cross-session learning effectiveness

### 3. Delegation Boundaries
- What should orchestrator do directly?
- What always goes to subagents?
- How to handle edge cases?

### 4. Quality Gates
- What checks should be automatic?
- When to involve human?
- How to prevent fabrication at scale?

### 5. Bootstrap Efficiency
- How fast can fresh instance become productive?
- What context is essential vs nice-to-have?
- How to minimize token overhead?

## Evolution Triggers

Store these as semantic memories so future sessions check for them:

```typescript
memory_create({
  content: "EVOLUTION TRIGGER: When Claude Code releases new Task tool features, spawn an evolution-audit agent to assess impact on ways of working",
  type: "semantic",
  importance: 1.0,
  tags: ["evolution-trigger", "capability-change", "persistent-directive"]
})
```

## Spawning an Evolution Auditor

Use this template to spawn a ways-of-working auditor:

```
**Role: AUDITOR (Ways of Working Evolution)**
**Scope:** .claude/ directory, CLAUDE.md, data/memories.json (read-only)

## System Context
[Include full system context from SPAWNING_TEMPLATE.md]

## Task
Audit current ways of working for evolution opportunities:

1. Review current skills in .claude/skills/
2. Check SPAWNING_TEMPLATE.md for context completeness
3. Search memory for recent pattern outcomes
4. Identify capability gaps (new features not being used)
5. Propose 3-5 specific improvements with evidence

## Constraints
- CAN: Read all config/skill files, search memory, analyze patterns
- CANNOT: Modify any files (audit only)

## Expected Output
- Current patterns summary (what's working)
- Friction points identified (with evidence)
- Capability gaps (unused features)
- Proposed improvements (prioritized)
- Recommended next actions
```

## Integration with Other Skills

- **evidence-based-validation**: All evolution claims need evidence
- **multi-agent-orchestration**: Evolution may change coordination patterns
- **agent-communication-system**: Evolution may change message patterns
- **memory-access**: Evolution changes should be persisted

## Metrics to Track

Store these periodically:

```typescript
memory_create({
  content: JSON.stringify({
    timestamp: new Date().toISOString(),
    metrics: {
      avg_agents_per_task: 7,
      memory_writes_per_session: 12,
      bootstrap_tokens: 1500,
      delegation_rate: 0.85, // % of work delegated vs direct
      skill_usage: { "evidence-based-validation": 15, ... }
    }
  }),
  type: "episodic",
  importance: 0.7,
  tags: ["ways-of-working", "metrics", "periodic"]
})
```

## Remember

1. **Evolution is continuous** - Not a one-time task
2. **Evidence over intuition** - Measure before changing
3. **Small experiments first** - Don't break working patterns
4. **Document everything** - Future sessions need context
5. **User feedback is gold** - Pay attention to friction signals
6. **Capability awareness** - Stay current on Claude Code features
