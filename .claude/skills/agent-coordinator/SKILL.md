# Agent Coordinator Skill

## Purpose

Manage multiple parallel agents, collect their outputs, synthesize learnings, and feed improvements back into the system.

## When to Use

- When orchestrating 5+ agents simultaneously
- When collecting and synthesizing agent reports
- When updating MASTER_PLAN based on agent feedback
- When detecting and resolving agent conflicts

## Coordination Protocol

### 1. Agent Registry

Track all active agents:

```
AGENT_ID | ROLE | TASK | STATUS | START_TIME | LAST_CHECK
---------|------|------|--------|------------|------------
{id}     |PLANNER|...  |RUNNING |{timestamp} |{timestamp}
```

### 2. Health Monitoring

Check agent status periodically:

- Use AgentOutputTool with block=false for status
- Flag agents running >15 minutes without output
- Detect stuck or confused agents early

### 3. Output Collection

When agent completes:

1. Read full output from AgentOutputTool
2. Extract key deliverables (files created/modified)
3. Extract introspection report
4. Flag any workarounds or concerns
5. Update todo list

### 4. Conflict Detection

Watch for:

- Multiple agents modifying same file
- Contradictory recommendations
- Circular dependencies
- Resource contention

### 5. Synthesis Protocol

After collecting outputs:

```markdown
## Synthesis Report

### Completed Tasks

- [Agent {id}] {task}: {outcome}

### Key Learnings

- What worked across agents
- Common challenges
- Pattern discoveries

### Conflicts Detected

- {description}
- Resolution: {approach}

### Plan Updates Needed

- {specific changes to MASTER_PLAN}

### Next Wave of Agents

- {tasks for next batch}
```

### 6. Memory Updates

Store coordination learnings:

```json
{
  "type": "procedural",
  "content": "coordination learning from batch {n}",
  "importance_score": 0.8,
  "tags": ["coordination", "synthesis", "learning"]
}
```

## Agent Spawn Checklist

Before spawning:

- [ ] Clear role assignment (PLANNER/IMPLEMENTER/AUDITOR/CLEANER)
- [ ] Specific, scoped task
- [ ] No overlap with other active agents
- [ ] Introspection instructions included
- [ ] Output location specified

## Context Protection

As orchestrator, protect your context:

- Let agents read large files, you read summaries
- Delegate exploration to agents
- Keep agent IDs and high-level status only
- Process agent outputs in batches

## Anti-Patterns

- ❌ Reading full agent file outputs yourself
- ❌ Running more than 15 agents simultaneously
- ❌ Spawning agents without clear deliverables
- ❌ Ignoring agent introspection reports
- ❌ Not checking for conflicts between agents
