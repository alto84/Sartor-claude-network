# Background Agent Patterns Skill

## Summary

Patterns for asynchronous agent execution, including background task spawning, wake messaging, parallel agent coordination, and lead/subagent orchestration models.

## When to Use

- Spawning agents for long-running tasks that don't block orchestrator
- Coordinating multiple parallel agents (3-5 subagents working simultaneously)
- Implementing lead agent + subagent hierarchies
- Managing memory isolation between concurrent agents
- Monitoring and aggregating results from background agents

## Core Patterns

### 1. Background Task Spawning

**Using Task Tool with Async Execution:**

The Task tool supports background execution, allowing the orchestrator to continue working while subagents execute tasks asynchronously.

```markdown
**Pattern: Non-Blocking Agent Spawn**

When spawning agents for tasks that don't require immediate results:
1. Use Task tool with appropriate delegation context
2. Agent runs independently without blocking orchestrator
3. Orchestrator can spawn multiple agents in parallel
4. Monitor via status files in data/agent-status/
5. Collect results when agents signal completion
```

**Example: Spawning Background Implementer**

```bash
# Spawn agent for long-running implementation
# Agent will write to data/agent-status/{agent-id}.json during execution

# Task tool invocation (pseudo-code):
Task: Implement feature X
Role: IMPLEMENTER
Scope: src/feature-x/
Context: [full context from handoff]
Expected Output: [standard subagent format]
```

**Key Characteristics:**
- Orchestrator continues immediately after spawn
- No blocking wait for agent completion
- Agent writes progress to data/agent-status/{agent-id}.json
- Agent writes final output to data/handoffs/{handoff-id}.json
- Orchestrator polls or checks status files periodically

### 2. Wake Messaging

**When to Send Wake Messages:**

Wake messages are status updates that signal important state changes to monitoring agents or orchestrators.

```markdown
**Wake Message Types:**

1. **Agent Started** - Signal agent has initialized
   - Update: ./scripts/status-update.sh "$AGENT_ID" "status" "active"
   - When: Immediately after agent begins work

2. **Milestone Reached** - Signal semantic progress
   - Update: ./scripts/checkpoint.sh "$AGENT_ID" "phase" "milestone" "details"
   - When: Completing discrete work units (files_read, code_written, tests_passing)

3. **Blocked** - Signal agent cannot proceed
   - Update: ./scripts/status-update.sh "$AGENT_ID" "status" "blocked"
   - When: Missing dependencies, unclear requirements, external blockers

4. **Complete** - Signal agent finished task
   - Update: ./scripts/status-update.sh "$AGENT_ID" "status" "complete"
   - When: All deliverables met, handoff written

5. **Failed** - Signal unrecoverable error
   - Update: ./scripts/status-update.sh "$AGENT_ID" "status" "failed"
   - When: Cannot complete due to errors, environment issues
```

**Message Format (via status files):**

```json
{
  "agentId": "agent-12345-IMPLEMENTER",
  "role": "IMPLEMENTER",
  "status": "active|blocked|complete|failed",
  "phase": "research|planning|implementation|testing|cleanup",
  "milestone": "semantic_milestone_name",
  "progress": "0.0-1.0",
  "currentTask": "Human-readable task description",
  "findings": ["Key discovery 1", "Key discovery 2"],
  "lastUpdate": "2025-12-11T19:30:00Z"
}
```

### 3. Parallel Agent Execution (3-5 Subagents)

**Pattern: Parallel Work Distribution**

When work can be parallelized across multiple agents:

```markdown
**Steps:**
1. Identify independent work units (no shared file writes)
2. Spawn 3-5 agents with distinct scopes
3. Each agent works on isolated subset
4. Agents write to separate output locations
5. Lead agent aggregates results after completion

**Example: Parallel Feature Implementation**

Agent 1: IMPLEMENTER - Implement feature-a (src/features/feature-a/)
Agent 2: IMPLEMENTER - Implement feature-b (src/features/feature-b/)
Agent 3: IMPLEMENTER - Implement feature-c (src/features/feature-c/)
Agent 4: AUDITOR - Review all features (read-only)
Agent 5: CLEANER - Clean up shared utilities (src/utils/)

**Coordination:**
- Each agent updates data/agent-status/{agent-id}.json independently
- No file conflicts due to scope separation
- Lead agent monitors: ./scripts/status-read.sh
- Lead agent waits for all "complete" statuses before synthesis
```

**Monitoring Parallel Agents:**

```bash
# Check all agent statuses
./scripts/status-read.sh

# Example output:
# agent-001-IMPLEMENTER: active, progress=0.6, phase=implementation
# agent-002-IMPLEMENTER: active, progress=0.4, phase=implementation
# agent-003-IMPLEMENTER: complete, progress=1.0, phase=cleanup
# agent-004-AUDITOR: active, progress=0.2, phase=research
# agent-005-CLEANER: blocked, progress=0.0, phase=research
```

**Scope Isolation Rules:**

1. **File-level isolation**: Each agent writes to different files
2. **Directory-level isolation**: Each agent owns separate directories
3. **Read-only sharing**: Multiple agents can read same files (AUDITOR pattern)
4. **Sequential handoffs**: Agents pass work via handoff files, not direct file sharing
5. **Memory isolation**: Each agent maintains separate working memory, shared via Memory MCP

### 4. Lead Agent + Subagent Coordination

**Pattern: Hierarchical Delegation**

```markdown
**Lead Agent Responsibilities:**
- Decompose complex tasks into parallelizable subtasks
- Spawn subagents with clear scopes and constraints
- Monitor subagent progress via status files
- Detect and resolve conflicts or blockers
- Aggregate subagent results into cohesive deliverable
- Synthesize learnings and update system memory

**Subagent Responsibilities:**
- Accept delegated task with defined scope
- Execute within boundaries (CAN/CANNOT constraints)
- Report progress via checkpoint milestones
- Write deliverables to specified handoff location
- Propose memory candidates for learnings
- Signal completion or blockers clearly
```

**Lead Agent Workflow:**

```markdown
1. **Decomposition Phase**
   - Analyze task complexity
   - Identify parallelizable work units
   - Define clear boundaries (file/directory scopes)
   - Create delegation plan

2. **Spawning Phase**
   - Spawn 3-5 subagents with Task tool
   - Each subagent gets: role, scope, context, constraints
   - Each subagent assigned unique agent ID
   - Document spawned agents in lead agent status

3. **Monitoring Phase**
   - Poll agent status files periodically (every 30-60s)
   - Detect blocked agents and intervene
   - Track milestone progression
   - Ensure no scope conflicts

4. **Aggregation Phase**
   - Wait for all agents to reach "complete" status
   - Read handoff files from each subagent
   - Synthesize results into cohesive output
   - Resolve any conflicts or inconsistencies
   - Create final deliverable

5. **Learning Phase**
   - Extract memory candidates from all subagents
   - Identify successful patterns
   - Store coordination learnings in Memory MCP
   - Update skills/hooks if new patterns discovered
```

**Example: Lead Agent Spawning Subagents**

```bash
# Lead Agent: PLANNER (coordinating implementation)

# Spawn Subagent 1
# Task tool: Implement user authentication (src/auth/)
# Role: IMPLEMENTER
# Agent ID: agent-auth-001-IMPLEMENTER

# Spawn Subagent 2
# Task tool: Implement data validation (src/validation/)
# Role: IMPLEMENTER
# Agent ID: agent-validation-002-IMPLEMENTER

# Spawn Subagent 3
# Task tool: Audit both implementations
# Role: AUDITOR
# Agent ID: agent-audit-003-AUDITOR

# Monitor progress
while true; do
  ./scripts/status-read.sh | grep -E "agent-(auth|validation|audit)"
  # Check if all complete
  COMPLETE_COUNT=$(./scripts/status-read.sh | grep -E "agent-(auth|validation|audit)" | grep "complete" | wc -l)
  if [ "$COMPLETE_COUNT" -eq 3 ]; then
    break
  fi
  sleep 30
done

# Aggregate results
ls -1 data/handoffs/*-{auth,validation,audit}-*.json
# Read each handoff, synthesize findings
```

### 5. Memory Isolation Between Agents

**Pattern: Shared Memory, Isolated Working Context**

```markdown
**Isolation Model:**

1. **Shared Persistent Memory (Memory MCP)**
   - All agents read from data/memories.json
   - High-importance directives (0.9+) visible to all
   - Procedural patterns (0.7-0.8) available for reuse
   - Orchestrator writes via MCP tools
   - Subagents propose via handoff memory candidates

2. **Isolated Working Memory**
   - Each agent maintains separate conversation context
   - No shared working memory between parallel agents
   - Agent-specific findings in data/agent-status/{agent-id}.json
   - Handoff files contain agent-specific deliverables

3. **Coordination via Status Files**
   - Agent status: data/agent-status/{agent-id}.json
   - Handoff data: data/handoffs/{handoff-id}.json
   - Checkpoint logs: data/checkpoints/{agent-id}.log
   - No direct inter-agent communication
   - Lead agent mediates all coordination
```

**Reading Shared Memory (Subagent Pattern):**

```bash
# Read high-importance directives before starting work
cat data/memories.json | jq '.memories | to_entries | map(.value) | map(select(.importance_score >= 0.9))'

# Read procedural patterns relevant to task
cat data/memories.json | jq '.memories | to_entries | map(.value) | map(select(.type == "procedural" and .importance_score >= 0.7))'

# Filter by tags
cat data/memories.json | jq '.memories | to_entries | map(.value) | map(select(.tags[]? == "testing"))'
```

**Proposing Memory Updates (Subagent Pattern):**

```markdown
### Memory Candidates

**Semantic (importance 0.9):**
- **Content**: "Discovered pattern X prevents issue Y in distributed coordination"
- **Tags**: ["coordination", "pattern", "distributed"]
- **Rationale**: Critical pattern that affects all future agent coordination work

**Procedural (importance 0.8):**
- **Content**: "When implementing feature Z, use approach A before approach B"
- **Tags**: ["implementation", "feature-z", "best-practice"]
- **Rationale**: Successful pattern that reduced implementation time by 50%
```

## Anti-Patterns

### 1. Blocking on Background Agents

**Problem:** Lead agent spawns subagent and immediately blocks waiting for completion.

**Why It's Wrong:** Defeats purpose of async execution, prevents parallelism.

**Solution:** Spawn multiple agents, monitor via status files, aggregate when all complete.

### 2. Overlapping Scopes

**Problem:** Multiple agents modify same files concurrently.

**Why It's Wrong:** Creates file conflicts, merge issues, inconsistent state.

**Solution:** Use strict file/directory-level scope isolation, or sequential handoffs.

### 3. No Status Updates

**Problem:** Agent runs for 10 minutes without progress signals.

**Why It's Wrong:** Lead agent can't detect blocks, failures, or progress.

**Solution:** Report checkpoint milestones at semantic boundaries (not time-based).

### 4. Direct Inter-Agent Communication

**Problem:** Agents try to coordinate directly without lead agent mediation.

**Why It's Wrong:** Creates coordination complexity, hard to monitor, prone to deadlock.

**Solution:** All coordination via lead agent using status files and handoffs.

### 5. Shared Working Memory

**Problem:** Agents share mutable state outside formal coordination channels.

**Why It's Wrong:** Race conditions, inconsistent state, hard to debug.

**Solution:** Isolated working memory, shared persistent memory via Memory MCP.

## Integration with Existing Skills

### With Agent Roles (`agent-roles.md`)

- OBSERVER role monitors background agent swarms
- Lead agent vs subagent distinction clarified
- Background agents use same role taxonomy (PLANNER/IMPLEMENTER/AUDITOR/CLEANER)

### With Refinement Protocol (`refinement-protocol.md`)

- Background agents use same refinement loop internally
- Lead agent uses refinement to improve delegation strategy
- Aggregation phase includes refinement of synthesized results

### With Memory Access (`memory-access.md`)

- Background agents read shared memory at start
- Background agents propose memory candidates in handoffs
- Lead agent persists validated candidates via Memory MCP

### With Multi-Agent Orchestration (`multi-agent-orchestration/SKILL.md`)

- Background patterns enable coordination protocols
- Async execution reduces coordination overhead
- Status files provide distributed state visibility

## Advanced Patterns

### Pattern: Cascading Delegation

```markdown
**Scenario:** Lead agent spawns subagent, subagent spawns sub-subagent.

**Rules:**
1. Maximum 2 levels of delegation (lead → subagent → sub-subagent)
2. Each level inherits CAN/CANNOT constraints from parent
3. Each level reports status to immediate parent
4. Lead agent responsible for full hierarchy health
5. Sub-subagents report via subagent, not directly to lead

**Use Case:** Complex feature requiring planning → implementation → audit chain.
```

### Pattern: Conditional Delegation

```markdown
**Scenario:** Lead agent spawns subagent conditionally based on prior results.

**Workflow:**
1. Spawn Agent 1 (PLANNER) to assess feasibility
2. Wait for Agent 1 completion
3. If feasible: Spawn Agent 2 (IMPLEMENTER)
4. If not feasible: Report blocker to human

**Use Case:** Implementation depends on planning validation.
```

### Pattern: Fan-Out/Fan-In

```markdown
**Scenario:** Single task parallelized across N agents, results merged.

**Workflow:**
1. Decompose task into N independent subtasks
2. Spawn N agents (fan-out)
3. Monitor all N agents via status files
4. When all complete, aggregate results (fan-in)
5. Synthesize into cohesive deliverable

**Use Case:** Parallel testing, parallel implementation, parallel analysis.
```

## Best Practices

1. **Spawn 3-5 agents maximum** - Beyond 5, coordination overhead exceeds benefit
2. **Use semantic milestones** - Report progress at natural boundaries, not fixed intervals
3. **Isolate scopes strictly** - File/directory-level isolation prevents conflicts
4. **Monitor regularly** - Check status files every 30-60s, detect blocks early
5. **Aggregate systematically** - Read all handoffs, synthesize cohesively, resolve conflicts
6. **Learn continuously** - Extract memory candidates, update skills, improve coordination
7. **Lead agent stays lightweight** - Delegate work, don't do it yourself, monitor and synthesize

## Quick Reference

### Spawning Background Agent

```bash
# Use Task tool with full delegation context
# Agent will run asynchronously
# Monitor via: ./scripts/status-read.sh
```

### Monitoring Background Agents

```bash
# Check all agent statuses
./scripts/status-read.sh

# Check specific agent
cat data/agent-status/agent-12345-IMPLEMENTER.json | jq .
```

### Aggregating Results

```bash
# List handoffs for completed agents
ls -1 data/handoffs/*-to-ORCHESTRATOR.json

# Read specific handoff
cat data/handoffs/handoff-1733925600-agent-12345-IMPLEMENTER-to-ORCHESTRATOR.json | jq .
```

### Detecting Blockers

```bash
# Find blocked agents
./scripts/status-read.sh | grep "blocked"

# Read blocker details
cat data/agent-status/{blocked-agent-id}.json | jq '.findings'
```

## See Also

- `.claude/skills/agent-roles.md` - Role taxonomy and responsibilities
- `.claude/skills/async-coordination.md` - Error handling and retry strategies
- `.claude/skills/multi-agent-orchestration/SKILL.md` - Coordination patterns
- `.claude/SPAWNING_TEMPLATE.md` - Subagent delegation template
