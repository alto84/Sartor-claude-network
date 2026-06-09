---
name: swarm-coordinator
description: Coordinate multi-agent teams with Firebase + GitHub for unlimited nesting
---

# Swarm Coordinator Skill

Enables spawning and coordinating nested agent hierarchies using Firebase for real-time coordination and GitHub for audit trails.

## When to Use This Skill

Use when:
- User requests parallel agent work ("use multiple agents", "swarm", "team")
- Task requires decomposition into independent subtasks
- You need agents that can spawn other agents (nested hierarchy)
- Long-running tasks that benefit from audit trails

## Core Concepts

### Agent Spawning via Firebase

Since subagents cannot use the Task tool, we spawn new Claude instances externally:

1. **Write request to `.swarm/requests/`** (file-based)
2. **Coordinator service** detects new file
3. **New Claude instance** spawned with task context
4. **Results written to Firebase** `agent_results` collection
5. **Parent polls** for completion

### Request File Format

Create files in `.swarm/requests/` with this structure:

```json
{
  "agentRole": "researcher",
  "parentRequestId": "parent-123",
  "task": {
    "objective": "Research topic X",
    "context": {
      "focus": "specific area",
      "priorWork": "what parent already knows"
    },
    "requirements": [
      "Use primary sources",
      "Cite all claims"
    ],
    "timeoutSeconds": 300,
    "allowSubRequests": true
  }
}
```

### Spawning a Child Agent

```bash
# Create request file
cat > .swarm/requests/child-$(date +%s).json << 'EOF'
{
  "agentRole": "analyst",
  "parentRequestId": "YOUR_REQUEST_ID",
  "task": {
    "objective": "Analyze the data",
    "context": {},
    "requirements": ["Be thorough"]
  }
}
EOF
```

### Polling for Results

Check Firebase or local `.swarm/results/` for completion:

```bash
# Poll local results directory
while [ ! -f ".swarm/results/$REQUEST_ID.json" ]; do
  sleep 2
done
cat ".swarm/results/$REQUEST_ID.json"
```

## Team Composition Patterns

### Pattern 1: Fan-Out / Fan-In

```
Orchestrator (you)
    ├── spawn: Researcher A (topic 1)
    ├── spawn: Researcher B (topic 2)
    └── spawn: Researcher C (topic 3)
         ↓ all complete
    Synthesize results
```

### Pattern 2: Pipeline

```
Orchestrator
    └── spawn: Gatherer
         └── spawn: Analyzer
              └── spawn: Writer
                   ↓ result flows back up
```

### Pattern 3: Specialist Delegation

```
Orchestrator
    └── spawn: Router (decides specialist)
         ├── spawn: Security Specialist
         ├── spawn: Performance Specialist
         └── spawn: UX Specialist
```

## Role Definitions

Define clear roles for spawned agents:

| Role | Purpose | Typical Tools |
|------|---------|---------------|
| `researcher` | Gather information | WebSearch, WebFetch, Read |
| `analyst` | Analyze data/code | Read, Grep, Glob |
| `writer` | Generate content | Write, Edit |
| `reviewer` | Validate work | Read, Bash (tests) |
| `specialist` | Domain expertise | Varies |

## Best Practices

### 1. Pass Complete Context

Always include the original objective AND relevant prior work:

```json
{
  "task": {
    "objective": "Analyze security of auth module",
    "context": {
      "originalGoal": "Full security audit of application",
      "priorFindings": ["XSS in templates", "Missing CSRF tokens"],
      "targetFiles": ["src/auth/", "src/middleware/"]
    }
  }
}
```

### 2. Define Clear Success Criteria

```json
{
  "requirements": [
    "List all vulnerabilities found",
    "Rate severity: critical/high/medium/low",
    "Provide remediation for each",
    "Include line numbers for code issues"
  ]
}
```

### 3. Set Reasonable Timeouts

- Simple tasks: 60-120 seconds
- Research tasks: 180-300 seconds
- Complex analysis: 300-600 seconds

### 4. Handle Failures Gracefully

Check result status before using:

```json
{
  "status": "failed",
  "error": {
    "message": "Timeout exceeded",
    "code": "TIMEOUT"
  }
}
```

### 5. Limit Nesting Depth

Recommended max: 3 levels deep
- Level 0: Main orchestrator
- Level 1: Primary workers
- Level 2: Specialist helpers
- Level 3: Only if truly necessary

## Integration with GitHub

For audit trails, also create GitHub issues:

```bash
gh issue create \
  --title "[agent-request] $AGENT_ROLE: $OBJECTIVE" \
  --body "<!-- TASK_CONTEXT -->
$TASK_JSON
<!-- END_TASK_CONTEXT -->" \
  --label "agent-request,swarm-agent"
```

## Environment Variables

Agents receive these from the coordinator:

- `SWARM_REQUEST_ID` - This agent's request ID
- `SWARM_PARENT_ID` - Parent's request ID (empty if root)
- `SWARM_AGENT_ROLE` - Assigned role

## Checking Swarm Status

Read `.swarm/state.json` for current swarm status:

```json
{
  "activeAgents": 3,
  "maxAgents": 10,
  "pendingRequests": 2,
  "completedRequests": 15,
  "failedRequests": 1
}
```

## Anti-Patterns to Avoid

1. **Don't spawn for trivial tasks** - If it takes <30s, do it yourself
2. **Don't create circular dependencies** - Agent A spawns B spawns A
3. **Don't spawn without context** - Always pass the "why"
4. **Don't ignore failures** - Check status, have fallback plans
5. **Don't over-parallelize** - More agents ≠ faster (coordination overhead)

## Example: Full Research Task

```
# You are the orchestrator. User asked: "Research AI safety trends"

1. Create research team:
   - spawn: researcher (topic: "alignment research 2024-2025")
   - spawn: researcher (topic: "governance and policy updates")
   - spawn: researcher (topic: "technical safety methods")

2. Wait for all to complete (poll .swarm/results/)

3. Synthesize findings into coherent report

4. If gaps found, spawn additional specialists

5. Write final output
```

## Files to Know

```
.swarm/
├── requests/          # Drop request files here
├── results/           # Completed results appear here
├── state.json         # Current swarm status
└── logs/              # Debug logs
```
