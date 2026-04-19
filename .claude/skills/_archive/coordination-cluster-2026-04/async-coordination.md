# Async Coordination Skill

## Summary

Patterns for non-blocking agent spawning, monitoring multiple background agents, aggregating parallel results, error handling for async failures, and timeout/retry strategies.

## When to Use

- Spawning agents that work independently without blocking
- Monitoring health and progress of multiple concurrent agents
- Handling failures and timeouts in distributed agent systems
- Aggregating results from parallel agents with different completion times
- Implementing retry logic for transient failures

## Core Patterns

### 1. Non-Blocking Agent Spawning

**Pattern: Fire and Continue**

```markdown
**Async Spawn Workflow:**

1. **Prepare Delegation Context**
   - Define role, scope, task, constraints
   - Create unique agent ID
   - Set expected output format (handoff file location)

2. **Spawn Agent (Non-Blocking)**
   - Use Task tool with full context
   - Agent begins execution immediately
   - Orchestrator continues without waiting

3. **Record Spawn**
   - Document spawned agent ID
   - Note expected completion signal (handoff file)
   - Track spawn timestamp

4. **Continue Work**
   - Orchestrator proceeds with other tasks
   - Spawn additional agents if needed
   - Perform lightweight monitoring tasks
```

**Example: Spawning Multiple Agents Asynchronously**

```bash
# Orchestrator spawns 3 agents without blocking

# Agent 1 - Start time: T+0s
# Task tool: Implement feature A
# Agent ID: agent-001-IMPLEMENTER

# Agent 2 - Start time: T+1s
# Task tool: Implement feature B
# Agent ID: agent-002-IMPLEMENTER

# Agent 3 - Start time: T+2s
# Task tool: Audit existing code
# Agent ID: agent-003-AUDITOR

# Orchestrator continues immediately (T+3s)
# All 3 agents running in parallel
# No blocking on completion
```

**Spawn Tracking (Orchestrator Pattern):**

```bash
# Create spawn registry
SPAWN_REGISTRY="data/spawn-registry.json"

# Record spawned agent
cat >> "$SPAWN_REGISTRY" <<EOF
{
  "agentId": "agent-001-IMPLEMENTER",
  "spawnedAt": "$(date -Iseconds)",
  "role": "IMPLEMENTER",
  "task": "Implement feature A",
  "expectedHandoff": "data/handoffs/handoff-*-agent-001-*-to-ORCHESTRATOR.json",
  "status": "spawned",
  "timeoutAt": "$(date -Iseconds -d '+15 minutes')"
}
EOF
```

### 2. Monitoring Multiple Background Agents

**Pattern: Periodic Health Checks**

```markdown
**Monitoring Loop:**

1. **Poll Status Files** (every 30-60s)
   - Read all agent status files
   - Check for status changes (active → complete, active → blocked, active → failed)
   - Detect stale agents (no update >5 minutes)

2. **Track Progress**
   - Monitor progress field (0.0-1.0)
   - Monitor phase transitions (research → planning → implementation)
   - Monitor milestone progression

3. **Detect Anomalies**
   - Blocked agents (status = "blocked")
   - Failed agents (status = "failed")
   - Stale agents (lastUpdate too old)
   - Slow agents (progress not advancing)

4. **Intervene When Needed**
   - Query blocked agents for details
   - Restart failed agents if transient
   - Kill stale agents and respawn
   - Provide additional context to slow agents
```

**Monitoring Script Example:**

```bash
#!/bin/bash
# File: scripts/monitor-agents.sh
# Monitor all active agents and report status

AGENT_STATUS_DIR="data/agent-status"
STALE_THRESHOLD=300  # 5 minutes

echo "=== Agent Status Monitor ==="
echo "Timestamp: $(date -Iseconds)"
echo ""

for status_file in "$AGENT_STATUS_DIR"/*.json; do
  if [ ! -f "$status_file" ]; then
    continue
  fi

  AGENT_ID=$(jq -r '.agentId' "$status_file")
  STATUS=$(jq -r '.status' "$status_file")
  PROGRESS=$(jq -r '.progress' "$status_file")
  PHASE=$(jq -r '.phase' "$status_file")
  MILESTONE=$(jq -r '.milestone' "$status_file")
  LAST_UPDATE=$(jq -r '.lastUpdate' "$status_file")

  # Check if stale
  LAST_UPDATE_EPOCH=$(date -d "$LAST_UPDATE" +%s 2>/dev/null || echo 0)
  CURRENT_EPOCH=$(date +%s)
  AGE=$((CURRENT_EPOCH - LAST_UPDATE_EPOCH))

  STALE=""
  if [ "$AGE" -gt "$STALE_THRESHOLD" ]; then
    STALE=" [STALE: ${AGE}s since update]"
  fi

  # Report
  echo "Agent: $AGENT_ID"
  echo "  Status: $STATUS"
  echo "  Progress: $PROGRESS ($PHASE / $MILESTONE)"
  echo "  Last Update: $LAST_UPDATE$STALE"
  echo ""
done

echo "=== End Status Monitor ==="
```

**Usage:**

```bash
# Run monitoring script manually
./scripts/monitor-agents.sh

# Or in orchestrator monitoring loop
while [ $AGENTS_ACTIVE -gt 0 ]; do
  ./scripts/monitor-agents.sh
  sleep 60

  # Check for completion
  COMPLETE_COUNT=$(./scripts/status-read.sh | grep "complete" | wc -l)
  if [ "$COMPLETE_COUNT" -eq "$EXPECTED_COUNT" ]; then
    break
  fi
done
```

### 3. Aggregating Results from Parallel Agents

**Pattern: Completion-Based Aggregation**

```markdown
**Aggregation Workflow:**

1. **Wait for Completion Signals**
   - Monitor until all agents reach "complete" status
   - Track completion times for each agent
   - Handle agents that complete out of order

2. **Collect Handoff Files**
   - Read handoff JSON for each completed agent
   - Extract deliverables (files, findings, decisions)
   - Extract memory candidates

3. **Validate Deliverables**
   - Verify all expected files exist
   - Check for conflicts between agents
   - Validate consistency of findings

4. **Synthesize Results**
   - Merge non-conflicting findings
   - Resolve conflicts (prefer evidence, escalate ambiguity)
   - Create unified deliverable
   - Aggregate memory candidates

5. **Store Learnings**
   - Persist validated memory candidates via Memory MCP
   - Update coordination patterns based on success/failure
   - Document synthesis process for future reference
```

**Example: Aggregating 3 Parallel Implementers**

```bash
# Wait for all agents to complete
EXPECTED_AGENTS=3
TIMEOUT=900  # 15 minutes
START_TIME=$(date +%s)

while true; do
  COMPLETE_COUNT=$(./scripts/status-read.sh | grep "agent-.*-IMPLEMENTER" | grep "complete" | wc -l)

  if [ "$COMPLETE_COUNT" -eq "$EXPECTED_AGENTS" ]; then
    echo "All agents complete!"
    break
  fi

  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))

  if [ "$ELAPSED" -gt "$TIMEOUT" ]; then
    echo "Timeout reached. Completed: $COMPLETE_COUNT/$EXPECTED_AGENTS"
    break
  fi

  echo "Waiting for agents: $COMPLETE_COUNT/$EXPECTED_AGENTS complete (${ELAPSED}s elapsed)"
  sleep 30
done

# Collect handoff files
HANDOFFS=$(ls -1 data/handoffs/*-IMPLEMENTER-to-ORCHESTRATOR.json 2>/dev/null)

echo "=== Aggregating Results ==="
for handoff in $HANDOFFS; do
  AGENT_ID=$(jq -r '.fromAgent' "$handoff")
  echo "Processing handoff from: $AGENT_ID"

  # Extract deliverables
  jq -r '.deliverables' "$handoff"

  # Extract findings
  jq -r '.deliverables.findings[]' "$handoff"

  # Extract memory candidates
  jq -r '.memoryCandidate' "$handoff" 2>/dev/null

  echo ""
done

echo "=== Synthesis ==="
echo "Create unified deliverable combining all agent results"
echo "Resolve any conflicts found"
echo "Store validated memory candidates"
```

**Conflict Resolution Pattern:**

```markdown
**When agents provide conflicting findings:**

1. **Evidence-Based Resolution**
   - Prefer finding with stronger evidence (test results, measurements)
   - Reject findings without evidence

2. **Consistency Checking**
   - Cross-reference with other agents' findings
   - Prefer majority consensus if evidence equal

3. **Escalation**
   - If conflict unresolvable, escalate to human
   - Document conflict in synthesis report
   - Flag for manual review

4. **Never Fabricate**
   - Don't average conflicting metrics
   - Don't create consensus that doesn't exist
   - Preserve disagreement explicitly
```

### 4. Error Handling for Async Failures

**Pattern: Failure Detection and Recovery**

```markdown
**Failure Types:**

1. **Agent Crash** (status = "failed")
   - Detection: Agent writes "failed" status before exit
   - Recovery: Check if transient (environment issue) or permanent (code bug)
   - Action: Retry once if transient, escalate if permanent

2. **Agent Timeout** (no status update >5 minutes)
   - Detection: lastUpdate timestamp too old
   - Recovery: Assume agent hung or crashed
   - Action: Spawn replacement agent with same task

3. **Agent Blocked** (status = "blocked")
   - Detection: Agent explicitly signals blocker
   - Recovery: Read blocker details from findings
   - Action: Provide missing context or escalate to human

4. **Deliverable Failure** (status = "complete" but missing files)
   - Detection: Handoff claims success but files don't exist
   - Recovery: Re-read agent output for errors
   - Action: Spawn corrective agent or escalate

5. **Silent Failure** (agent stops updating, no error signal)
   - Detection: Status stuck in one state >10 minutes
   - Recovery: Assume agent hung
   - Action: Kill and respawn
```

**Error Handling Workflow:**

```bash
#!/bin/bash
# File: scripts/handle-agent-failure.sh
# Handle failed, timed-out, or blocked agents

AGENT_ID=$1
FAILURE_TYPE=$2  # "failed", "timeout", "blocked"

case "$FAILURE_TYPE" in
  "failed")
    echo "Agent $AGENT_ID failed. Checking if transient..."

    # Read failure details
    FAILURE_REASON=$(cat "data/agent-status/${AGENT_ID}.json" | jq -r '.findings[-1]')
    echo "Reason: $FAILURE_REASON"

    # Check if transient (e.g., network error, rate limit)
    if echo "$FAILURE_REASON" | grep -iq "rate limit\|timeout\|network"; then
      echo "Transient failure detected. Spawning retry agent..."
      # Respawn with same task
      # (Use Task tool to spawn replacement)
    else
      echo "Permanent failure detected. Escalating to human."
      # Write to escalation queue
      echo "$AGENT_ID: $FAILURE_REASON" >> data/escalations.txt
    fi
    ;;

  "timeout")
    echo "Agent $AGENT_ID timed out. Spawning replacement..."
    # Kill stale status file
    mv "data/agent-status/${AGENT_ID}.json" "data/agent-status/${AGENT_ID}.failed.json"
    # Respawn with same task
    # (Use Task tool to spawn replacement)
    ;;

  "blocked")
    echo "Agent $AGENT_ID blocked. Reading blocker details..."
    BLOCKER=$(cat "data/agent-status/${AGENT_ID}.json" | jq -r '.findings[-1]')
    echo "Blocker: $BLOCKER"

    # Check if can be resolved automatically
    if echo "$BLOCKER" | grep -iq "missing context\|unclear requirement"; then
      echo "Providing additional context to agent..."
      # Send wake message with clarification
      # (Could use status update or spawn helper agent)
    else
      echo "Blocker requires human intervention. Escalating."
      echo "$AGENT_ID: $BLOCKER" >> data/escalations.txt
    fi
    ;;
esac
```

### 5. Timeout and Retry Strategies

**Pattern: Bounded Retries with Backoff**

```markdown
**Timeout Configuration:**

| Agent Role | Expected Duration | Timeout Threshold | Max Retries |
|-----------|------------------|-------------------|-------------|
| PLANNER | 5-10 minutes | 15 minutes | 1 |
| IMPLEMENTER | 10-20 minutes | 30 minutes | 2 |
| AUDITOR | 5-15 minutes | 20 minutes | 1 |
| CLEANER | 3-5 minutes | 10 minutes | 1 |

**Retry Logic:**

1. **First Failure**
   - Wait: 30 seconds
   - Retry: Spawn identical agent with same task
   - Reason: May be transient environment issue

2. **Second Failure**
   - Wait: 2 minutes
   - Retry: Spawn agent with modified context (more explicit instructions)
   - Reason: May be unclear task specification

3. **Third Failure**
   - No retry: Escalate to human
   - Document: All failure reasons and retry attempts
   - Reason: Likely fundamental blocker requiring human input
```

**Retry Implementation:**

```bash
#!/bin/bash
# File: scripts/retry-agent.sh
# Retry failed agent with exponential backoff

AGENT_ID=$1
RETRY_COUNT=$2
MAX_RETRIES=2

if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
  echo "Max retries reached for $AGENT_ID. Escalating."
  echo "$AGENT_ID: Max retries exceeded" >> data/escalations.txt
  exit 1
fi

# Calculate backoff
BACKOFF=$((30 * (2 ** RETRY_COUNT)))  # 30s, 60s, 120s...
echo "Waiting ${BACKOFF}s before retry $((RETRY_COUNT + 1))..."
sleep "$BACKOFF"

# Read original task
ORIGINAL_TASK=$(cat "data/spawn-registry.json" | jq -r ".[] | select(.agentId == \"$AGENT_ID\") | .task")

# Spawn retry agent
NEW_AGENT_ID="${AGENT_ID}-retry-$((RETRY_COUNT + 1))"
echo "Spawning retry agent: $NEW_AGENT_ID"

# Modify context if second retry
if [ "$RETRY_COUNT" -eq 1 ]; then
  echo "Second retry: Adding more explicit instructions"
  # Enhance task description with more detail
  # (Spawn with Task tool)
else
  echo "First retry: Using same task"
  # Spawn identical agent
  # (Spawn with Task tool)
fi
```

**Timeout Detection:**

```bash
#!/bin/bash
# File: scripts/detect-timeouts.sh
# Detect agents that have exceeded timeout threshold

AGENT_STATUS_DIR="data/agent-status"
CURRENT_TIME=$(date +%s)

for status_file in "$AGENT_STATUS_DIR"/*.json; do
  if [ ! -f "$status_file" ]; then
    continue
  fi

  AGENT_ID=$(jq -r '.agentId' "$status_file")
  STATUS=$(jq -r '.status' "$status_file")
  ROLE=$(jq -r '.role' "$status_file")
  LAST_UPDATE=$(jq -r '.lastUpdate' "$status_file")

  # Skip if already complete or failed
  if [ "$STATUS" == "complete" ] || [ "$STATUS" == "failed" ]; then
    continue
  fi

  # Calculate age
  LAST_UPDATE_EPOCH=$(date -d "$LAST_UPDATE" +%s 2>/dev/null || echo 0)
  AGE=$((CURRENT_TIME - LAST_UPDATE_EPOCH))

  # Set timeout threshold based on role
  case "$ROLE" in
    "PLANNER") TIMEOUT=900 ;;    # 15 min
    "IMPLEMENTER") TIMEOUT=1800 ;; # 30 min
    "AUDITOR") TIMEOUT=1200 ;;   # 20 min
    "CLEANER") TIMEOUT=600 ;;    # 10 min
    *) TIMEOUT=1200 ;;           # Default 20 min
  esac

  # Check for timeout
  if [ "$AGE" -gt "$TIMEOUT" ]; then
    echo "TIMEOUT: $AGENT_ID (age: ${AGE}s, threshold: ${TIMEOUT}s)"

    # Trigger failure handling
    ./scripts/handle-agent-failure.sh "$AGENT_ID" "timeout"
  fi
done
```

## Advanced Patterns

### Pattern: Conditional Retry

```markdown
**Scenario:** Retry only for specific failure types.

**Logic:**
- Transient failures (network, rate limit) → Retry automatically
- Missing context failures → Retry with enhanced context
- Code errors, environment issues → Escalate immediately
- Blocked on external dependency → Don't retry, wait for dependency

**Implementation:**
Parse failure reason from agent findings, apply conditional retry logic.
```

### Pattern: Partial Aggregation

```markdown
**Scenario:** Some agents complete, others timeout.

**Logic:**
1. Aggregate results from successful agents
2. Document which agents failed/timed out
3. Retry failed agents or escalate
4. Produce partial deliverable if sufficient
5. Mark remaining work as TODO

**Use Case:** 5 parallel agents, 3 complete, 2 timeout. Deliver results from 3, retry 2.
```

### Pattern: Progressive Timeout

```markdown
**Scenario:** Increase timeout threshold after first retry.

**Logic:**
- First spawn: Standard timeout (e.g., 15 minutes)
- First retry: Extended timeout (e.g., 30 minutes)
- Second retry: Maximum timeout (e.g., 45 minutes)

**Rationale:** Task may be more complex than initially estimated.
```

### Pattern: Health-Based Spawning

```markdown
**Scenario:** Don't spawn new agents if system unhealthy.

**Health Checks:**
1. Current agent count < max capacity (5 agents)
2. No recent cascade failures (3+ failures in 5 minutes)
3. System resources available (memory, CPU)
4. No critical blockers in active agents

**Logic:**
If unhealthy, queue spawn requests until health improves.
```

## Integration with Background Agent Patterns

### Spawning (from `background-agent-patterns.md`)

Async coordination enhances spawning with:
- Timeout configuration per agent role
- Retry logic for failed spawns
- Health checks before spawning

### Monitoring (from `background-agent-patterns.md`)

Async coordination enhances monitoring with:
- Timeout detection
- Stale agent detection
- Failure type classification

### Aggregation (from `background-agent-patterns.md`)

Async coordination enhances aggregation with:
- Handling agents completing out of order
- Partial aggregation for incomplete sets
- Conflict resolution for inconsistent results

## Anti-Patterns

### 1. Infinite Retries

**Problem:** Agent fails, orchestrator retries indefinitely.

**Why It's Wrong:** Wastes resources, masks fundamental issues.

**Solution:** Bounded retries (max 2-3), escalate after threshold.

### 2. No Timeout

**Problem:** Agent hangs forever, orchestrator never detects.

**Why It's Wrong:** Blocks progress, wastes resources.

**Solution:** Role-based timeout thresholds, automatic detection.

### 3. Synchronous Aggregation

**Problem:** Orchestrator blocks until all agents complete.

**Why It's Wrong:** Prevents monitoring, intervention, partial delivery.

**Solution:** Periodic polling, handle agents as they complete.

### 4. Silent Failures

**Problem:** Agent fails but doesn't write "failed" status.

**Why It's Wrong:** Orchestrator can't detect, just sees stale agent.

**Solution:** Timeout detection catches silent failures.

### 5. No Conflict Resolution

**Problem:** Agents provide conflicting results, orchestrator accepts all.

**Why It's Wrong:** Inconsistent deliverables, downstream errors.

**Solution:** Evidence-based conflict resolution, escalate ambiguity.

## Best Practices

1. **Set timeouts based on role** - IMPLEMENTER needs more time than CLEANER
2. **Retry transient failures** - Network errors, rate limits are temporary
3. **Escalate permanent failures** - Code bugs, missing dependencies need human
4. **Monitor actively** - Poll status files every 30-60s, don't wait passively
5. **Aggregate progressively** - Process agents as they complete, don't block on all
6. **Resolve conflicts systematically** - Evidence-based, never fabricate consensus
7. **Learn from failures** - Store failure patterns in Memory MCP for future avoidance

## Quick Reference

### Spawn Agent (Non-Blocking)

```bash
# Task tool spawns agent asynchronously
# Orchestrator continues immediately
# Agent writes to data/agent-status/{agent-id}.json
```

### Monitor Agents

```bash
# Periodic polling (every 30-60s)
./scripts/monitor-agents.sh

# Detect timeouts
./scripts/detect-timeouts.sh
```

### Handle Failures

```bash
# Classify and handle failure
./scripts/handle-agent-failure.sh "$AGENT_ID" "$FAILURE_TYPE"

# Retry with backoff
./scripts/retry-agent.sh "$AGENT_ID" "$RETRY_COUNT"
```

### Aggregate Results

```bash
# Wait for completion
while [ $COMPLETE_COUNT -lt $EXPECTED_COUNT ]; do
  sleep 30
  COMPLETE_COUNT=$(./scripts/status-read.sh | grep "complete" | wc -l)
done

# Collect handoffs
ls -1 data/handoffs/*-to-ORCHESTRATOR.json

# Synthesize
# (Read each handoff, merge results, resolve conflicts)
```

## See Also

- `.claude/skills/background-agent-patterns.md` - Background agent spawning and coordination
- `.claude/skills/agent-roles.md` - Role taxonomy and timeout expectations
- `.claude/skills/multi-agent-orchestration/SKILL.md` - Distributed coordination patterns
- `.claude/SPAWNING_TEMPLATE.md` - Subagent delegation template
