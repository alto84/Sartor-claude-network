# Example: Simple Research Swarm

This example demonstrates a basic 3-agent research swarm with fan-out/fan-in coordination.

## Scenario

User wants to research "Current trends in AI safety" using multiple agents.

## Step 1: Initialize Swarm

```bash
# Create swarm directory
mkdir -p .swarm/{requests,results,mail/inbox/orchestrator,artifacts,logs}

# Initialize state
cat > .swarm/state.json << 'EOF'
{
  "swarmId": "swarm-research-001",
  "objective": "Research current trends in AI safety",
  "phase": "research",
  "phaseNumber": 1,
  "totalPhases": 2,
  "agents": {
    "orchestrator": {
      "status": "active",
      "currentTask": "coordinating",
      "startedAt": "2025-12-02T12:00:00Z"
    }
  },
  "completedTasks": [],
  "pendingTasks": [],
  "sharedContext": {
    "timeframe": "2024-2025",
    "outputFormat": "structured JSON with citations"
  },
  "lastUpdated": "2025-12-02T12:00:00Z"
}
EOF

# Initialize progress log
cat > .swarm/PROGRESS.md << 'EOF'
# Swarm Progress Log

## Objective
Research current trends in AI safety

## Status
- **Phase**: Research (1/2)
- **Active Agents**: 1 (orchestrator)

---

## Timeline

### 2025-12-02T12:00:00Z - Orchestrator
**Action**: Initialized research swarm
**Plan**: Spawn 3 researchers, then synthesize
EOF

echo "✓ Swarm initialized"
```

## Step 2: Spawn Research Agents

```bash
# Agent 1: Technical methods researcher
cat > .swarm/requests/researcher-technical.json << 'EOF'
{
  "agentRole": "researcher-technical",
  "parentRequestId": "swarm-research-001",
  "task": {
    "objective": "Research technical AI safety methods (2024-2025)",
    "context": {
      "originalTask": "Research current trends in AI safety",
      "focus": "Technical approaches: RLHF, constitutional AI, interpretability, alignment",
      "outputFormat": "JSON with citations"
    },
    "requirements": [
      "Find at least 5 recent papers or articles",
      "Summarize key methods and their effectiveness",
      "Note any limitations or criticisms",
      "Include proper citations"
    ],
    "timeoutSeconds": 180,
    "allowSubRequests": false
  }
}
EOF

# Agent 2: Governance researcher
cat > .swarm/requests/researcher-governance.json << 'EOF'
{
  "agentRole": "researcher-governance",
  "parentRequestId": "swarm-research-001",
  "task": {
    "objective": "Research AI governance and policy developments (2024-2025)",
    "context": {
      "originalTask": "Research current trends in AI safety",
      "focus": "Regulations, frameworks, international coordination",
      "outputFormat": "JSON with citations"
    },
    "requirements": [
      "Cover EU AI Act, US executive orders, international efforts",
      "Note key policy changes and their implications",
      "Include industry self-regulation efforts",
      "Include proper citations"
    ],
    "timeoutSeconds": 180,
    "allowSubRequests": false
  }
}
EOF

# Agent 3: Industry practices researcher
cat > .swarm/requests/researcher-industry.json << 'EOF'
{
  "agentRole": "researcher-industry",
  "parentRequestId": "swarm-research-001",
  "task": {
    "objective": "Research AI safety practices in industry (2024-2025)",
    "context": {
      "originalTask": "Research current trends in AI safety",
      "focus": "Major AI labs' safety commitments and practices",
      "outputFormat": "JSON with citations"
    },
    "requirements": [
      "Cover Anthropic, OpenAI, Google DeepMind, Meta",
      "Note specific safety measures implemented",
      "Include any incidents or concerns raised",
      "Include proper citations"
    ],
    "timeoutSeconds": 180,
    "allowSubRequests": false
  }
}
EOF

echo "✓ Spawned 3 research agents"
```

## Step 3: Update State

```bash
# Update state to reflect spawned agents
cat > .swarm/state.json << 'EOF'
{
  "swarmId": "swarm-research-001",
  "objective": "Research current trends in AI safety",
  "phase": "research",
  "phaseNumber": 1,
  "totalPhases": 2,
  "agents": {
    "orchestrator": {
      "status": "active",
      "currentTask": "waiting for researchers"
    },
    "researcher-technical": {
      "status": "pending",
      "currentTask": "technical methods research"
    },
    "researcher-governance": {
      "status": "pending",
      "currentTask": "governance research"
    },
    "researcher-industry": {
      "status": "pending",
      "currentTask": "industry practices research"
    }
  },
  "lastUpdated": "2025-12-02T12:00:30Z"
}
EOF

# Update progress log
cat >> .swarm/PROGRESS.md << 'EOF'

### 2025-12-02T12:00:30Z - Orchestrator
**Action**: Spawned 3 research agents
**Agents**:
- researcher-technical: Technical safety methods
- researcher-governance: Governance and policy
- researcher-industry: Industry practices
**Status**: Waiting for completion
EOF
```

## Step 4: Poll for Results

```bash
# Wait for all results
AGENTS="researcher-technical researcher-governance researcher-industry"
PENDING=3

echo "Waiting for agents to complete..."

while [ $PENDING -gt 0 ]; do
    for agent in $AGENTS; do
        RESULT_FILE=".swarm/results/$agent.json"
        if [ -f "$RESULT_FILE" ]; then
            # Check if already processed
            if ! grep -q "$agent: processed" .swarm/state.json 2>/dev/null; then
                echo "✓ $agent completed"
                PENDING=$((PENDING - 1))
            fi
        fi
    done

    if [ $PENDING -gt 0 ]; then
        echo "  Waiting... ($PENDING remaining)"
        sleep 5
    fi
done

echo "All agents completed!"
```

## Step 5: Synthesize Results

```bash
# Read all results
TECHNICAL=$(cat .swarm/results/researcher-technical.json 2>/dev/null || echo '{"error": "no result"}')
GOVERNANCE=$(cat .swarm/results/researcher-governance.json 2>/dev/null || echo '{"error": "no result"}')
INDUSTRY=$(cat .swarm/results/researcher-industry.json 2>/dev/null || echo '{"error": "no result"}')

# Create synthesis artifact
cat > .swarm/artifacts/final-report.json << EOF
{
  "title": "AI Safety Trends Report (2024-2025)",
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "swarmId": "swarm-research-001",

  "sections": {
    "technical": $TECHNICAL,
    "governance": $GOVERNANCE,
    "industry": $INDUSTRY
  },

  "summary": "Synthesized from 3 parallel research agents"
}
EOF

# Update progress
cat >> .swarm/PROGRESS.md << EOF

### $(date -u +%Y-%m-%dT%H:%M:%SZ) - Orchestrator
**Action**: Synthesized final report
**Artifact**: .swarm/artifacts/final-report.json
**Status**: Complete
EOF

echo "✓ Final report generated: .swarm/artifacts/final-report.json"
```

## Expected Result Structure

`.swarm/results/researcher-technical.json`:
```json
{
  "status": "success",
  "findings": [
    {
      "topic": "Constitutional AI",
      "summary": "Method for training AI to follow principles...",
      "citation": "Bai et al., 2022"
    },
    {
      "topic": "Interpretability",
      "summary": "Techniques for understanding model internals...",
      "citation": "Anthropic, 2024"
    }
  ],
  "keyInsights": [
    "RLHF remains dominant but has known limitations",
    "Constitutional AI showing promise for value alignment"
  ]
}
```

## File Structure After Completion

```
.swarm/
├── state.json                    # Final state
├── PROGRESS.md                   # Full activity log
├── requests/                     # Empty (processed)
├── results/
│   ├── researcher-technical.json
│   ├── researcher-governance.json
│   └── researcher-industry.json
├── artifacts/
│   └── final-report.json         # Synthesized output
├── mail/
│   └── inbox/
│       └── orchestrator/
└── logs/
    └── activity.log
```

## Cleanup

```bash
# Archive completed swarm
mkdir -p .swarm/archive
mv .swarm/state.json .swarm/archive/swarm-research-001-state.json
mv .swarm/PROGRESS.md .swarm/archive/swarm-research-001-progress.md
mv .swarm/artifacts .swarm/archive/swarm-research-001-artifacts
rm -rf .swarm/results/*
rm -rf .swarm/requests/*

echo "✓ Swarm archived"
```
