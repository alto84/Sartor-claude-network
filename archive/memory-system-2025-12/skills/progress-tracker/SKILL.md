---
name: progress-tracker
description: Track progress across agent handoffs to prevent context loss
---

# Progress Tracker Skill

Maintains shared state and progress logs to ensure continuity across agent boundaries.

## Core Files

```
.swarm/
├── PROGRESS.md          # Human-readable progress log
├── state.json           # Machine-readable current state
├── artifacts/           # Outputs from agents
│   ├── agent-1-output.json
│   └── agent-2-output.json
├── decisions/           # Decision log
│   └── decision-001.json
└── handoffs/            # Handoff contracts
    └── handoff-a-to-b.json
```

## Progress Log Format

`.swarm/PROGRESS.md`:

```markdown
# Swarm Progress Log

## Current Objective
Research and document AI safety trends for 2024-2025

## Status
- **Phase**: Research (2/4)
- **Active Agents**: 3
- **Completed**: 5 tasks
- **Blockers**: None

---

## Timeline

### 2025-12-02 12:00:00 - Orchestrator
**Action**: Initiated swarm with 3 researchers
**Spawned**:
- researcher-1: alignment research
- researcher-2: governance updates
- researcher-3: technical methods

### 2025-12-02 12:05:00 - researcher-1
**Action**: Completed initial research
**Findings**: 15 relevant papers identified
**Artifacts**: `.swarm/artifacts/alignment-papers.json`
**Next**: Deep analysis needed on 3 key papers

### 2025-12-02 12:08:00 - researcher-2
**Action**: In progress
**Status**: 60% complete
**Note**: Found policy changes in EU AI Act

---

## Artifacts Registry

| File | Created By | Description |
|------|-----------|-------------|
| `alignment-papers.json` | researcher-1 | List of 15 papers |
| `policy-timeline.json` | researcher-2 | EU AI Act timeline |

---

## Decisions Made

1. **12:03** - Focus on 2024+ publications only (orchestrator)
2. **12:06** - Include preprints from arXiv (researcher-1)

---

## Open Questions

- [ ] Should we include industry reports?
- [ ] Depth vs breadth tradeoff?
```

## State File Format

`.swarm/state.json`:

```json
{
  "swarmId": "swarm-20251202-120000",
  "objective": "Research AI safety trends",
  "phase": "research",
  "phaseNumber": 2,
  "totalPhases": 4,

  "agents": {
    "orchestrator": {
      "status": "active",
      "currentTask": "coordinating",
      "startedAt": "2025-12-02T12:00:00Z"
    },
    "researcher-1": {
      "status": "completed",
      "currentTask": null,
      "completedAt": "2025-12-02T12:05:00Z",
      "output": ".swarm/artifacts/alignment-papers.json"
    },
    "researcher-2": {
      "status": "active",
      "currentTask": "governance research",
      "progress": 60
    }
  },

  "completedTasks": [
    {
      "id": "task-001",
      "agent": "researcher-1",
      "description": "Initial alignment research",
      "completedAt": "2025-12-02T12:05:00Z",
      "output": ".swarm/artifacts/alignment-papers.json"
    }
  ],

  "pendingTasks": [
    {
      "id": "task-003",
      "assignedTo": "researcher-3",
      "description": "Technical methods survey",
      "deadline": "2025-12-02T12:15:00Z"
    }
  ],

  "sharedContext": {
    "timeframe": "2024-2025",
    "sources": ["arxiv", "nature", "science"],
    "excludeTopics": ["AGI speculation"]
  },

  "lastUpdated": "2025-12-02T12:08:00Z"
}
```

## Logging Progress

Add entries to PROGRESS.md:

```bash
# Append progress entry
cat >> .swarm/PROGRESS.md << EOF

### $(date -u +%Y-%m-%dT%H:%M:%SZ) - $SWARM_AGENT_ROLE
**Action**: $ACTION_DESCRIPTION
**Status**: $STATUS
**Artifacts**: \`$ARTIFACT_PATH\`
EOF
```

## Updating State

```bash
# Read current state
STATE=$(cat .swarm/state.json)

# Update agent status
echo "$STATE" | jq '.agents["'"$SWARM_AGENT_ROLE"'"].status = "completed"' > .swarm/state.json.tmp
mv .swarm/state.json.tmp .swarm/state.json
```

## Handoff Contracts

When passing work to another agent, create a handoff contract:

`.swarm/handoffs/handoff-researcher1-to-analyst.json`:

```json
{
  "handoffId": "handoff-001",
  "from": "researcher-1",
  "to": "analyst",
  "createdAt": "2025-12-02T12:05:00Z",

  "context": {
    "originalObjective": "Research AI safety trends",
    "priorWork": "Identified 15 relevant papers on alignment",
    "keyFindings": [
      "Constitutional AI showing promise",
      "RLHF limitations documented",
      "New interpretability methods emerging"
    ]
  },

  "task": {
    "objective": "Deep analysis of top 3 papers",
    "inputs": [
      ".swarm/artifacts/alignment-papers.json"
    ],
    "expectedOutputs": [
      "Summary of each paper",
      "Key contributions",
      "Limitations noted"
    ]
  },

  "constraints": {
    "deadline": "2025-12-02T12:20:00Z",
    "maxTokens": 50000,
    "requireCitations": true
  },

  "successCriteria": [
    "All 3 papers analyzed",
    "Each summary 200-500 words",
    "Citations in standard format"
  ]
}
```

## Decision Logging

Record significant decisions:

`.swarm/decisions/decision-001.json`:

```json
{
  "decisionId": "decision-001",
  "madeBy": "orchestrator",
  "madeAt": "2025-12-02T12:03:00Z",

  "question": "What publication timeframe to focus on?",
  "options": [
    "All time",
    "Last 5 years",
    "2024-2025 only"
  ],
  "chosen": "2024-2025 only",
  "rationale": "User specifically asked about recent trends",

  "impact": "Reduces scope, enables faster completion",
  "reversible": true
}
```

## Reading Progress (For New Agents)

When starting, read the progress log to understand context:

```bash
# Get last 5 entries
tail -100 .swarm/PROGRESS.md

# Get current state
cat .swarm/state.json | jq '{phase, activeAgents: [.agents | to_entries[] | select(.value.status == "active") | .key]}'

# Get your handoff contract (if any)
cat .swarm/handoffs/handoff-*-to-$SWARM_AGENT_ROLE.json 2>/dev/null
```

## Best Practices

1. **Log every significant action** - Future agents need context
2. **Update state atomically** - Write to .tmp, then rename
3. **Include timestamps** - UTC, ISO 8601 format
4. **Reference artifacts by path** - Don't inline large data
5. **Summarize for humans** - PROGRESS.md should be readable
6. **Keep state.json machine-parseable** - Valid JSON always
