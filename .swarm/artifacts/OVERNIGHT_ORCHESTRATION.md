# Overnight Orchestration Pattern

## Architecture

```
                    COORDINATOR (always running)
                           │
                           ▼
                   .swarm/requests/
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   [Phase 1 Agent]    [Phase 2 Agent]    [Phase 3 Agent]
        │                  │                  │
        ▼                  ▼                  ▼
   Spawns children    Spawns children    Spawns children
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                           ▼
                   .swarm/results/
                           │
                           ▼
                 [Synthesizer Agent]
                           │
                           ▼
               Final Report in artifacts/
```

## How Agents Communicate

1. **Spawn Children**: Write JSON to `.swarm/requests/`
2. **Share Data**: Write to `.swarm/artifacts/`
3. **Report Results**: Coordinator saves to `.swarm/results/`
4. **Check Sibling Results**: Read from `.swarm/results/`

## Self-Perpetuation Pattern

An agent can spawn a successor before timing out:

```bash
# Near end of work, spawn continuation agent
cat > .swarm/requests/continuation-$(date +%s).json << 'EOF'
{
  "agentRole": "continuation",
  "parentRequestId": "$SWARM_REQUEST_ID",
  "task": {
    "objective": "Continue the work from parent agent",
    "context": {"phase": "continuation", "check_artifacts": true},
    "requirements": ["Read artifacts from parent", "Continue work", "Spawn next if needed"]
  }
}
EOF
```

## Overnight Master Plan Pattern

Create a master orchestrator that queues all work:

```json
{
  "agentRole": "overnight-orchestrator",
  "task": {
    "objective": "Execute overnight research plan",
    "context": {
      "total_phases": 5,
      "current_phase": 1,
      "topics": ["topic1", "topic2", "topic3"]
    },
    "requirements": [
      "Spawn researcher agents for each topic",
      "Wait for results by checking .swarm/results/",
      "Spawn synthesizer when all complete",
      "Write final report to artifacts/"
    ]
  }
}
```

## Key Environment Variables Available to Spawned Agents

- `SWARM_REQUEST_ID`: Unique ID for this request
- `SWARM_PARENT_ID`: Parent's request ID (for hierarchy)
- `SWARM_AGENT_ROLE`: Role assigned to this agent

## Configuration for Long-Running Work

```bash
# Start coordinator for overnight work
AGENT_TIMEOUT_SECONDS=3600 \  # 1 hour per agent
MAX_CONCURRENT_AGENTS=3 \     # Limit parallel work
node coordinator/local-only.js
```

## Monitoring Commands

```bash
# Watch for activity
watch -n 5 'ls -la .swarm/results/ | tail -10'

# Count completed agents
ls .swarm/results/*.json 2>/dev/null | wc -l

# Check coordinator health
ps aux | grep local-only

# Read latest result
cat .swarm/results/$(ls -t .swarm/results/ | head -1)
```
