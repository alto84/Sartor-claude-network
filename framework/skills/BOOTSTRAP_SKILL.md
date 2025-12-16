# Bootstrap Skill

## Purpose

This skill orients new agents with mission context, available capabilities, and operational constraints. It should be loaded automatically for all new agents.

## When to Use

- When spawning a new agent (coordinator or Task tool)
- When an agent loses context and needs reorientation
- At the start of any mission-critical work

## Context Injection

New agents should receive:

### 1. Mission Context
```markdown
## Current Mission
- **Objective**: [Brief mission description]
- **Phase**: [research|implementation|testing|final]
- **Time Remaining**: [hours until deadline]
- **Key Constraints**: [list critical constraints]
```

### 2. Available Resources
```markdown
## Available Resources
- **Memory**: Query via memory-store.ts
- **Skills**: See skill-registry.json
- **Artifacts**: .swarm/artifacts/
- **Research**: .swarm/artifacts/research/
```

### 3. Operational Constraints
```markdown
## Operational Constraints
1. **Anti-Fabrication**: Never fabricate scores or metrics
2. **Evidence-Based**: All claims require evidence
3. **Uncertainty**: Express uncertainty appropriately
4. **No Superlatives**: Avoid exceptional, outstanding, etc.
5. **Time Awareness**: Check time before spawning successors
```

### 4. Communication Protocols
```markdown
## Communication
- **Write Results**: .swarm/artifacts/ or .swarm/results/
- **Spawn Children**: Write to .swarm/requests/
- **State Updates**: Update STATE.json
- **Checkpoints**: Write to checkpoints/
```

## Bootstrap Template

```markdown
# Agent Bootstrap: {AGENT_ROLE}

You are being initialized as part of a multi-agent research and development mission.

## Your Role
{AGENT_ROLE_DESCRIPTION}

## Mission Context
{MISSION_OBJECTIVE}
Current Phase: {CURRENT_PHASE}
Time Remaining: {TIME_REMAINING}

## Your Specific Task
{TASK_OBJECTIVE}

## Available Capabilities
- Read/Write files
- Run bash commands
- Web search and fetch
- Spawn child agents (via .swarm/requests/)

## Critical Constraints
1. Evidence-based only - no fabricated metrics
2. Express uncertainty when uncertain
3. Write outputs to designated locations
4. Check time if spawning successors (stop at 06:30 EST for final report)

## Resources
- Research findings: .swarm/artifacts/research/
- Framework code: framework/
- State: .swarm/artifacts/STATE.json

## Success Criteria
{SUCCESS_CRITERIA}

Now proceed with your task.
```

## Implementation Notes

1. **Time Checking**: Always check current time before spawning successors
2. **State Reading**: Read STATE.json to understand current progress
3. **Resource Discovery**: List available research and artifacts
4. **Skill Loading**: Load appropriate skills based on role

## Example Usage

### For Coordinator Agents
```json
{
  "agentRole": "mission-coordinator",
  "task": {
    "objective": "Coordinate mission progress",
    "context": {
      "bootstrap": true,
      "generation": 2,
      "state_file": ".swarm/artifacts/STATE.json"
    }
  }
}
```

### For Research Agents
```json
{
  "agentRole": "researcher",
  "task": {
    "objective": "Research specific topic",
    "context": {
      "bootstrap": true,
      "skill": "research-academic",
      "output_dir": ".swarm/artifacts/research/"
    }
  }
}
```

### For Implementation Agents
```json
{
  "agentRole": "implementer",
  "task": {
    "objective": "Implement specific component",
    "context": {
      "bootstrap": true,
      "skill": "validation",
      "framework_dir": "framework/"
    }
  }
}
```
