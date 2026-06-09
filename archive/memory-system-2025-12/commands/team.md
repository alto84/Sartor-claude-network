# /team - Spawn a coordinated agent team

Decompose a task and spawn multiple agents to work on it in parallel.

## Usage

```
/team <task description>
```

## Behavior

When invoked, you should:

1. **Analyze the task** to determine if it benefits from parallelization
2. **Propose a team composition** with specific roles
3. **Ask for user approval** before spawning
4. **Create agent requests** in `.swarm/requests/`
5. **Monitor progress** and synthesize results

## Team Composition Process

### Step 1: Task Analysis

Evaluate the task:
- Can it be decomposed into independent subtasks?
- What specialist roles would help?
- How many agents are needed (max 10)?
- What's the expected coordination overhead?

### Step 2: Propose Team

Present to the user:

```
## Proposed Team for: "{task}"

**Estimated complexity**: Medium
**Recommended agents**: 3

| Role | Objective | Dependencies |
|------|-----------|--------------|
| researcher-1 | Gather data on X | None |
| researcher-2 | Gather data on Y | None |
| analyst | Synthesize findings | researcher-1, researcher-2 |

**Coordination approach**: Fan-out then synthesize
**Estimated time**: 2-3 minutes

Proceed? [Y/n]
```

### Step 3: Initialize Swarm

If approved:

```bash
# Create swarm directory structure
mkdir -p .swarm/{requests,results,mail/inbox,artifacts,logs}

# Initialize state
cat > .swarm/state.json << EOF
{
  "swarmId": "swarm-$(date +%Y%m%d-%H%M%S)",
  "objective": "$TASK",
  "phase": "initializing",
  "agents": {},
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Initialize progress log
cat > .swarm/PROGRESS.md << EOF
# Swarm Progress Log

## Objective
$TASK

## Timeline
### $(date -u +%Y-%m-%dT%H:%M:%SZ) - Orchestrator
**Action**: Initialized swarm
**Team**: $AGENT_COUNT agents
EOF
```

### Step 4: Spawn Agents

Create request files for each agent:

```bash
for each agent in team:
    cat > .swarm/requests/agent-$ROLE-$(date +%s).json << EOF
    {
      "agentRole": "$ROLE",
      "parentRequestId": "$SWARM_ID",
      "task": {
        "objective": "$AGENT_OBJECTIVE",
        "context": {
          "originalTask": "$FULL_TASK",
          "teamComposition": [...],
          "myRole": "$ROLE"
        },
        "requirements": [...],
        "timeoutSeconds": 300
      }
    }
    EOF
done
```

### Step 5: Monitor and Synthesize

Poll for results:

```bash
PENDING=$AGENT_COUNT
while [ $PENDING -gt 0 ]; do
    for agent in agents:
        if [ -f ".swarm/results/$agent.json" ]; then
            # Process result
            PENDING=$((PENDING - 1))
        fi
    done
    sleep 2
done

# Synthesize all results
```

## Example Interaction

**User**: `/team Research the current state of AI safety, covering technical approaches, governance, and industry practices`

**Assistant**:
```
## Proposed Team for: "Research AI safety..."

**Estimated complexity**: Medium-High
**Recommended agents**: 4

| Role | Objective | Est. Time |
|------|-----------|-----------|
| researcher-technical | Survey technical safety methods (RLHF, constitutional AI, interpretability) | 90s |
| researcher-governance | Research AI governance frameworks and regulations | 90s |
| researcher-industry | Document industry safety practices and commitments | 90s |
| synthesizer | Combine findings into coherent report | 60s |

**Coordination**: Fan-out (3 parallel) → synthesize
**Dependencies**: synthesizer waits for all researchers

Proceed with this team? [Y/n]
```

**User**: `Y`

**Assistant**: *creates swarm, spawns agents, monitors, returns synthesized result*

## Options

- `/team --dry-run <task>` - Show proposed team without executing
- `/team --max-agents N <task>` - Limit team size
- `/team --sequential <task>` - Run agents in sequence (pipeline)
- `/team --roles "r1,r2,r3" <task>` - Specify exact roles

## Notes

- Always ask for approval before spawning
- Max 10 concurrent agents
- Results appear in `.swarm/results/`
- Full log in `.swarm/PROGRESS.md`
