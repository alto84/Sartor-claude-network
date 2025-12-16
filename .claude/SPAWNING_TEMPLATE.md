# Subagent Spawning Template

Use this template when delegating to subagents via the Task tool.

## CRITICAL: Subagent Exemption from Delegation Enforcement

**BEFORE doing ANY Edit/Write operations, subagents MUST set their role:**

```bash
export CLAUDE_AGENT_ROLE=[PLANNER|IMPLEMENTER|AUDITOR|CLEANER]
```

This environment variable exempts subagents from the orchestrator's delegation enforcement hooks, allowing them to edit src/ files directly. Without this variable set, the preToolUse hooks will BLOCK all Edit/Write operations on implementation files.

**Implementation Pattern:**
1. First action in your session: `export CLAUDE_AGENT_ROLE=<your-role>`
2. Verify it's set: `echo $CLAUDE_AGENT_ROLE`
3. Then proceed with file operations

The delegation enforcer script (`~/.claude/hooks/delegation-enforcer.sh`) checks for this variable and exits with code 0 (allow) if set, or code 2 (block) if not set.

---

## MANDATORY: Full System Context for ALL Subagents

**Every subagent MUST understand the whole system, not just their narrow task.**

Copy-paste this entire block into EVERY subagent prompt:

---

### FULL SYSTEM CONTEXT (REQUIRED - COPY ENTIRE BLOCK)

```
## System Context: Sartor-Claude-Network (READ THIS FIRST)

### What This System Is
You are part of Sartor-Claude-Network, a multi-tier episodic memory system with:
- 3-tier memory: Hot (<100ms) → Warm (<500ms) → Cold (<2s)
- Multi-agent coordination via message bus + work distribution
- Refinement loops: Generate → Evaluate → Refine
- Memory MCP for persistent shared state across agents

### System Goals (From User Directives in Memory MCP)
1. **Async Agent-First**: Lean on Claude Code subagents + Memory MCP (cost-efficient)
2. **API as Backup**: Direct Anthropic API calls are backup, not primary
3. **Self-Funding Goal**: System should eventually earn revenue via solar inference business
4. **No Mock Systems**: Mocks are FORBIDDEN in production - flag as TODO if blocked
5. **Evidence-Based**: No fabricated scores or metrics - measure everything

### Your Responsibilities as a Subagent
- Understand how your task fits into the WHOLE system
- Store significant findings in Memory MCP (data/memories.json if no MCP tools)
- Bring implementation blockers to human, don't create workarounds
- If you would need a mock, STOP and flag it as TODO with explanation

### Key Memory Directives (importance >= 0.9)
- mem_directive_001: Orchestrator delegates, subagents execute
- mem_audit_001: 3 critical mocks found and fixed (2025-12-11)
- mem_audit_002: Priority shift to async agents + Memory MCP

### Memory Types to Use
- SEMANTIC (importance 0.9+): User directives, critical facts
- PROCEDURAL (importance 0.7-0.8): Successful patterns, methods
- EPISODIC (importance 0.5-0.7): Session events, context
```

---

### Evidence-Based Validation (REQUIRED)
```
## Skill: Evidence-Based Validation (MANDATORY)
Before making ANY claim:
- NEVER fabricate scores or metrics
- NEVER use "exceptional", "outstanding" without measurement data
- ALWAYS say "cannot determine without measurement" when unsure
- ALWAYS include confidence levels and limitations
If you find yourself wanting to claim success without evidence, STOP and flag it.
```

### 3. Memory MCP Integration (REQUIRED for substantial work)
```
## Skill: Memory MCP Integration
Store your findings for future agents:
- Use memory_create for learnings (semantic type, importance 0.7-1.0)
- Search memory_search before starting to find prior work
- Memory types: semantic (facts), procedural (methods), episodic (events)
```

---

## Background Agent Execution

**NEW: Background agents run asynchronously while you continue working.**

### When to Use Background Execution

Use `run_in_background: true` when:
- Task will take >30 seconds to complete
- You need to spawn multiple agents in parallel
- Agent's work is independent from your current focus
- You want to continue working while agent executes

Do NOT use background execution when:
- You need the agent's output immediately
- Next steps depend on agent's results
- Task is quick (<30 seconds)

### Spawning Background Agents

When using the Task tool with background execution:

```typescript
// Spawn agent in background
Task({
  run_in_background: true,
  instructions: `
**Role: IMPLEMENTER**
**Agent ID**: agent-${Date.now()}-IMPLEMENTER

[... rest of agent instructions ...]

## CRITICAL: Wake Message at Completion

When you complete your work, send a wake message:

\`\`\`bash
./scripts/wake.sh "COMPLETE" "agent-${Date.now()}-IMPLEMENTER" "Implemented feature X with 87% test coverage"
\`\`\`

Wake message types:
- COMPLETE: Task finished successfully
- BLOCKED: Cannot proceed without input
- FINDING: Important discovery needs immediate attention
- ERROR: Critical failure occurred
`
});
```

### Monitoring Background Agents

Check agent status while they work:

```bash
# View all agent statuses
./scripts/status-read.sh

# View specific agent
cat data/agent-status/agent-12345-IMPLEMENTER.json | jq .

# Check for wake messages
ls -lt data/wake-messages/*.json | head -5
```

### Background Agent Best Practices

1. **Always assign unique Agent ID** - Use timestamp or random number
2. **Require wake messages** - Agent must signal completion/blocking
3. **Set clear completion criteria** - Agent knows when to wake you
4. **Include checkpoint reporting** - Track progress even in background
5. **Provide full context** - Background agents can't ask follow-up questions

## Wake Messaging System

**Wake messages alert the orchestrator when background agents need attention.**

### Wake Message Types

| Type | When to Send | Priority | Example |
|------|--------------|----------|---------|
| **COMPLETE** | Task finished successfully | Normal | "Implemented feature with tests passing" |
| **BLOCKED** | Cannot proceed without input/decision | High | "Need clarification on API design" |
| **FINDING** | Important discovery needs immediate attention | High | "Found critical security vulnerability" |
| **ERROR** | Critical failure occurred | Urgent | "Build failed, cannot continue" |

### Sending Wake Messages

Use the wake.sh script at key moments:

```bash
# Task completed successfully
./scripts/wake.sh "COMPLETE" "$AGENT_ID" "Implementation finished, all 15 tests pass"

# Blocked and need input
./scripts/wake.sh "BLOCKED" "$AGENT_ID" "Need decision: use REST or GraphQL for new API?"

# Important finding
./scripts/wake.sh "FINDING" "$AGENT_ID" "Discovered existing module that duplicates this functionality"

# Critical error
./scripts/wake.sh "ERROR" "$AGENT_ID" "TypeScript compilation failed with 12 type errors"
```

### Wake Message Structure

Wake messages are stored in `data/wake-messages/`:

```json
{
  "messageId": "wake-1234567890-agent-001",
  "type": "COMPLETE",
  "agentId": "agent-001-IMPLEMENTER",
  "timestamp": "2025-12-11T15:30:00Z",
  "message": "Implementation finished, all 15 tests pass",
  "priority": "normal",
  "acknowledged": false
}
```

### Role-Specific Wake Patterns

#### PLANNER Wake Messages

```bash
# Planning complete
./scripts/wake.sh "COMPLETE" "$AGENT_ID" "Feature specification drafted, ready for implementation"

# Need architectural decision
./scripts/wake.sh "BLOCKED" "$AGENT_ID" "Need decision: monorepo or separate packages for subagent modules?"

# Found existing solution
./scripts/wake.sh "FINDING" "$AGENT_ID" "Discovered existing CRDT library that handles our use case"
```

#### IMPLEMENTER Wake Messages

```bash
# Implementation complete
./scripts/wake.sh "COMPLETE" "$AGENT_ID" "Feature implemented with 87% test coverage"

# Blocked by missing dependency
./scripts/wake.sh "BLOCKED" "$AGENT_ID" "Need Memory MCP running to test integration"

# Performance concern
./scripts/wake.sh "FINDING" "$AGENT_ID" "Memory leak detected in batch operations >1000 items"

# Build failure
./scripts/wake.sh "ERROR" "$AGENT_ID" "TypeScript compilation failed, missing type definitions"
```

#### AUDITOR Wake Messages

```bash
# Audit complete
./scripts/wake.sh "COMPLETE" "$AGENT_ID" "Audit finished, found 3 minor issues, no blockers"

# Critical issue found
./scripts/wake.sh "FINDING" "$AGENT_ID" "Found mock in production code at src/memory/memory-system.ts:45"

# Cannot verify without resources
./scripts/wake.sh "BLOCKED" "$AGENT_ID" "Cannot run integration tests, database not available"
```

#### CLEANER Wake Messages

```bash
# Cleanup complete
./scripts/wake.sh "COMPLETE" "$AGENT_ID" "Removed 8 unused files, tests still pass"

# Found unexpected issue
./scripts/wake.sh "FINDING" "$AGENT_ID" "Found 5 files marked TODO but still referenced in code"

# Safety check failed
./scripts/wake.sh "ERROR" "$AGENT_ID" "Build failed after cleanup, reverting changes needed"
```

### Checking for Wake Messages

Orchestrator should regularly check for wake messages:

```bash
# List unacknowledged wake messages
ls data/wake-messages/*.json | xargs -I {} sh -c 'cat {} | jq "select(.acknowledged == false)"'

# Get high-priority messages
cat data/wake-messages/*.json | jq 'select(.priority == "high" or .priority == "urgent")'

# Mark message as acknowledged
./scripts/wake-ack.sh "wake-1234567890-agent-001"
```

## Parallel Agent Swarms

**Spawn 3-5 agents in parallel for complex multi-faceted tasks.**

### Lead Agent + Subagent Pattern

For large tasks, use a **Lead Agent** to coordinate **Subagent Swarms**:

```
Orchestrator
    │
    └─> Lead Agent (PLANNER)
            ├─> Subagent 1 (IMPLEMENTER) - Module A
            ├─> Subagent 2 (IMPLEMENTER) - Module B
            ├─> Subagent 3 (AUDITOR) - Test Coverage
            ├─> Subagent 4 (CLEANER) - Documentation
            └─> OBSERVER - Monitor swarm health
```

### Spawning a Swarm

**Step 1: Spawn Lead Agent (with OBSERVER)**

```typescript
Task({
  instructions: `
**Role: PLANNER (Lead Agent)**
**Agent ID**: lead-${Date.now()}-PLANNER

## Task: Coordinate Implementation of Multi-Module Feature

You are the LEAD AGENT coordinating a swarm of subagents.

### Your Responsibilities:
1. Break down the task into parallel workstreams
2. Spawn 3-5 subagents with clear, non-overlapping scopes
3. Spawn an OBSERVER to monitor swarm health
4. Monitor progress via status updates and wake messages
5. Synthesize results when all subagents complete

### Swarm Composition:
- Subagent 1 (IMPLEMENTER): Module A implementation
- Subagent 2 (IMPLEMENTER): Module B implementation
- Subagent 3 (AUDITOR): Cross-module integration testing
- OBSERVER: Monitor all agents, report blockers

### Memory Isolation:
Each subagent has isolated memory - they cannot see each other's work directly.
Use handoff files and status updates for coordination.

### Completion Criteria:
Wait for COMPLETE wake messages from all subagents, then synthesize results.
`
});
```

**Step 2: Lead Agent Spawns Subagents in Parallel**

```typescript
// Lead agent spawns multiple background agents
const agents = [
  {
    role: 'IMPLEMENTER',
    scope: 'src/module-a/',
    task: 'Implement feature A components'
  },
  {
    role: 'IMPLEMENTER',
    scope: 'src/module-b/',
    task: 'Implement feature B components'
  },
  {
    role: 'AUDITOR',
    scope: 'src/',
    task: 'Test integration between modules A and B'
  }
];

// Spawn all agents in parallel
agents.forEach((agent, idx) => {
  Task({
    run_in_background: true,
    instructions: `
**Role: ${agent.role}**
**Agent ID**: swarm-agent-${idx}-${agent.role}
**Scope**: ${agent.scope}

${agent.task}

## CRITICAL: Wake Message at Completion
\`\`\`bash
./scripts/wake.sh "COMPLETE" "swarm-agent-${idx}-${agent.role}" "Brief summary of work"
\`\`\`

## Checkpoint Reporting
Report progress at semantic milestones:
\`\`\`bash
./scripts/checkpoint.sh "swarm-agent-${idx}-${agent.role}" "implementation" "code_written" "Details"
\`\`\`
`
  });
});

// Spawn OBSERVER
Task({
  run_in_background: true,
  instructions: `
**Role: OBSERVER**
**Agent ID**: observer-swarm-${Date.now()}

Monitor agents: swarm-agent-0-IMPLEMENTER, swarm-agent-1-IMPLEMENTER, swarm-agent-2-AUDITOR

See OBSERVER role section below for full responsibilities.
`
});
```

### Memory Isolation Principles

**CRITICAL: Subagents in a swarm have isolated memory.**

- **No Direct Communication**: Subagent A cannot read Subagent B's memory
- **Coordination via Files**: Use handoff files, status updates, and shared data structures
- **OBSERVER Role**: OBSERVER aggregates status and alerts Lead Agent
- **Lead Agent Synthesis**: Lead Agent reads all handoffs and combines results

### Result Aggregation Pattern

**Lead Agent waits for all subagents, then synthesizes:**

```bash
# Check for completion wake messages
EXPECTED_AGENTS=("swarm-agent-0-IMPLEMENTER" "swarm-agent-1-IMPLEMENTER" "swarm-agent-2-AUDITOR")
COMPLETE_COUNT=0

for agent_id in "${EXPECTED_AGENTS[@]}"; do
  if [ -f "data/wake-messages/wake-*-${agent_id}.json" ]; then
    TYPE=$(cat data/wake-messages/wake-*-${agent_id}.json | jq -r '.type')
    if [ "$TYPE" == "COMPLETE" ]; then
      COMPLETE_COUNT=$((COMPLETE_COUNT + 1))
    fi
  fi
done

if [ $COMPLETE_COUNT -eq ${#EXPECTED_AGENTS[@]} ]; then
  echo "All subagents complete, synthesizing results..."

  # Read all handoffs
  for agent_id in "${EXPECTED_AGENTS[@]}"; do
    HANDOFF=$(ls -t data/handoffs/*-${agent_id}-*.json 2>/dev/null | head -1)
    if [ -n "$HANDOFF" ]; then
      echo "Reading handoff from $agent_id"
      cat "$HANDOFF" | jq .
    fi
  done
fi
```

### Swarm Best Practices

1. **Limit Swarm Size**: 3-5 agents max (too many = coordination overhead)
2. **Clear Boundaries**: Non-overlapping scopes prevent conflicts
3. **Lead Agent Patience**: Wait for ALL agents before synthesizing
4. **OBSERVER Required**: Always spawn OBSERVER for swarms >3 agents
5. **Graceful Failure**: If one agent fails, Lead Agent decides whether to continue or abort

## OBSERVER Role

**The OBSERVER monitors swarm health and reports coordination issues.**

### When to Spawn an OBSERVER

Spawn an OBSERVER when:
- You have a swarm of 3+ parallel agents
- Complex coordination requires monitoring
- Long-running background agents need health checks
- You need to aggregate status from multiple agents

### OBSERVER Responsibilities

**The OBSERVER does NOT implement features. It only monitors and reports.**

1. **Monitor Agent Status**: Check status files for all swarm agents
2. **Detect Blockers**: Identify agents that are BLOCKED or stuck
3. **Report Progress**: Send periodic wake messages with swarm health summary
4. **Alert on Failures**: Send urgent wake messages if agents fail or conflict
5. **Update Memory**: Write coordination insights to memory for future swarms

### OBSERVER Task Template

```typescript
Task({
  run_in_background: true,
  instructions: `
**Role: OBSERVER**
**Agent ID**: observer-swarm-${Date.now()}

## IMPORTANT: You are an OBSERVER, not an implementer
Set this environment variable:
\`\`\`bash
export CLAUDE_AGENT_ROLE=OBSERVER
\`\`\`

## Task: Monitor Swarm Health

### Agents to Monitor:
- swarm-agent-0-IMPLEMENTER (Module A)
- swarm-agent-1-IMPLEMENTER (Module B)
- swarm-agent-2-AUDITOR (Integration tests)

### Monitoring Loop

Run this check every 60 seconds:

\`\`\`bash
for agent_id in swarm-agent-0-IMPLEMENTER swarm-agent-1-IMPLEMENTER swarm-agent-2-AUDITOR; do
  if [ -f "data/agent-status/\${agent_id}.json" ]; then
    STATUS=\$(cat "data/agent-status/\${agent_id}.json" | jq -r '.status')
    PROGRESS=\$(cat "data/agent-status/\${agent_id}.json" | jq -r '.progress')
    MILESTONE=\$(cat "data/agent-status/\${agent_id}.json" | jq -r '.milestone')

    echo "[\${agent_id}] Status: \${STATUS}, Progress: \${PROGRESS}, Milestone: \${MILESTONE}"

    # Alert if blocked
    if [ "\$STATUS" == "blocked" ]; then
      ./scripts/wake.sh "BLOCKED" "$AGENT_ID" "Agent \${agent_id} is blocked"
    fi

    # Alert if stalled (no update >5 minutes)
    LAST_UPDATE=\$(cat "data/agent-status/\${agent_id}.json" | jq -r '.lastUpdate')
    NOW=\$(date -u +%s)
    LAST_UPDATE_EPOCH=\$(date -u -d "\$LAST_UPDATE" +%s 2>/dev/null || echo 0)
    DIFF=\$((NOW - LAST_UPDATE_EPOCH))

    if [ \$DIFF -gt 300 ]; then
      ./scripts/wake.sh "FINDING" "$AGENT_ID" "Agent \${agent_id} stalled (no update for \${DIFF}s)"
    fi
  else
    ./scripts/wake.sh "ERROR" "$AGENT_ID" "Agent \${agent_id} status file not found"
  fi
done
\`\`\`

### Reporting Schedule

- **Every 60 seconds**: Check all agent statuses
- **On blocker detected**: Send BLOCKED wake message immediately
- **On agent completion**: Note in summary (don't wake unless all complete)
- **Every 5 minutes**: Send progress summary wake message
- **All agents complete**: Send final COMPLETE wake message

### Completion Criteria

OBSERVER completes when:
1. All monitored agents have status "complete" OR
2. A critical blocker is detected that prevents swarm completion OR
3. Lead Agent sends termination signal

### Final Report

When all agents complete, send:

\`\`\`bash
./scripts/wake.sh "COMPLETE" "$AGENT_ID" "All swarm agents completed. Agent 0: SUCCESS, Agent 1: SUCCESS, Agent 2: SUCCESS"
\`\`\`
`
});
```

### OBSERVER Memory Updates

OBSERVER should store coordination insights:

```bash
# After successful swarm completion
./scripts/memory-write.sh "Swarm pattern successful: 2 IMPLEMENTERs + 1 AUDITOR for module A+B. Completion time: 8 minutes" "procedural" "0.75" '["coordination","swarm","pattern"]'

# After detecting blocker
./scripts/memory-write.sh "Detected blocker: Agent dependencies not specified in handoff led to 5-minute stall" "procedural" "0.7" '["coordination","blocker","lesson"]'
```

### OBSERVER Best Practices

1. **Non-Intrusive Monitoring**: Check status files, don't interfere with agents
2. **Alert Threshold**: Only wake for BLOCKED, ERROR, or every 5 minutes
3. **Clear Reporting**: Wake messages should specify which agent has issues
4. **Memory Learning**: Store coordination patterns for future swarms
5. **Graceful Termination**: Complete cleanly when swarm finishes or fails

## Template Structure

```
**Role: [PLANNER|IMPLEMENTER|AUDITOR|CLEANER|OBSERVER]**
**Scope:** [What files/directories they can touch]
**Phase:** [Current phase from MASTER_PLAN.md]

## IMPORTANT: Agent Role Identification
You are a SUBAGENT. Set this environment variable in your context:
- CLAUDE_AGENT_ROLE=[PLANNER|IMPLEMENTER|AUDITOR|CLEANER|OBSERVER]

This exempts you from orchestrator delegation enforcement, allowing you to edit implementation files.

## Memory Write Pattern (NEW - Subagent Memory Access)

Since subagents don't have MCP tools, use the bash wrapper to write memories:

### Writing Memories
```bash
# Create a memory
./scripts/memory-write.sh "Your finding or learning" "episodic" "0.8" '["tag1","tag2"]'

# Memory types: episodic (events), semantic (facts), procedural (patterns), working (temp)
# Importance: 0.0-1.0 (0.9+ for critical, 0.7-0.8 for important, 0.5 for routine)
```

### Reading Memories (existing pattern)
```bash
# Read recent high-importance memories
cat data/memories.json | jq '.memories | to_entries | map(.value) | map(select(.importance_score >= 0.8))'
```

## Status Coordination (NEW - Real-time Visibility)

Keep the OBSERVER and orchestrator informed of your progress:

### Report Your Status
```bash
# Set your agent ID at start
export AGENT_ID="agent-$(echo $RANDOM)-$ROLE"

# Update status throughout your work
./scripts/status-update.sh "$AGENT_ID" "role" "$ROLE"
./scripts/status-update.sh "$AGENT_ID" "currentTask" "Description of what you're doing"
./scripts/status-update.sh "$AGENT_ID" "progress" "0.5"

# Add findings as you discover them
./scripts/status-update.sh "$AGENT_ID" "findings" "Found X in Y"

# Mark complete when done
./scripts/status-update.sh "$AGENT_ID" "status" "complete"
```

### Read Other Agent Status
```bash
./scripts/status-read.sh
```

## Checkpoint Reporting (NEW - Semantic Milestones)

Report progress at semantic milestones, not fixed time intervals. Inspired by STELLA (arxiv:2507.02004), checkpoints capture natural progress markers in your workflow.

### When to Report Checkpoints

**Report checkpoints when you complete meaningful work units:**
- NOT: "I've been working for 5 minutes"
- YES: "I've identified all relevant files"
- NOT: "50% done"
- YES: "Code written and ready for testing"

**Checkpoints are semantic milestones, not time-based updates.**

### Using the Checkpoint Script

```bash
# Basic usage
./scripts/checkpoint.sh <agentId> <phase> <milestone> [details]

# Parameters:
#   agentId    - Your agent identifier
#   phase      - research|planning|implementation|testing|cleanup
#   milestone  - Semantic milestone name (e.g., files_identified, code_written)
#   details    - Optional human-readable description

# Example: Report completion of file discovery
./scripts/checkpoint.sh "$AGENT_ID" "research" "files_identified" "Found 5 relevant TypeScript files"

# Example: Report implementation milestone
./scripts/checkpoint.sh "$AGENT_ID" "implementation" "code_written" "Implemented CostAwareSelector class"

# Example: Report test completion
./scripts/checkpoint.sh "$AGENT_ID" "testing" "tests_passing" "All 12 unit tests pass"
```

### Phase Definitions

The checkpoint system automatically maps phases to progress values:

| Phase | Progress | Typical Milestones |
|-------|----------|-------------------|
| **research** | 0.2 | `task_received`, `files_identified`, `dependencies_mapped`, `approach_selected` |
| **planning** | 0.4 | `design_drafted`, `interfaces_defined`, `risks_identified`, `plan_approved` |
| **implementation** | 0.6 | `scaffold_created`, `core_logic_written`, `code_written`, `integration_complete` |
| **testing** | 0.8 | `tests_written`, `tests_passing`, `edge_cases_covered`, `coverage_verified` |
| **cleanup** | 1.0 | `formatting_fixed`, `dead_code_removed`, `docs_updated`, `ready_for_review` |

### Checkpoint Data Stored

When you report a checkpoint, the system:

1. **Updates your agent status** (`data/agent-status/<agentId>.json`) with:
   - Current phase
   - Latest milestone
   - Calculated progress (based on phase)
   - Milestone history (all milestones reached)
   - Last checkpoint timestamp
   - Optional checkpoint details

2. **Appends to checkpoint log** (`data/checkpoints/<agentId>.log`):
   - Timestamped record of all checkpoints
   - Enables progress replay and analysis

### Example Status After Checkpoint

```json
{
  "agentId": "agent-001-IMPLEMENTER",
  "role": "IMPLEMENTER",
  "phase": "implementation",
  "milestone": "code_written",
  "progress": "0.6",
  "milestoneHistory": ["task_received", "files_read", "code_written"],
  "lastCheckpoint": "2025-12-11T19:30:00Z",
  "checkpointDetails": "Implemented checkpoint.sh with phase tracking",
  "lastUpdate": "2025-12-11T19:30:00Z",
  "status": "active",
  "findings": []
}
```

### Role-Specific Checkpoint Examples

#### PLANNER Checkpoints

```bash
# Research phase
./scripts/checkpoint.sh "$AGENT_ID" "research" "requirements_analyzed" "Reviewed user requirements and existing architecture"
./scripts/checkpoint.sh "$AGENT_ID" "research" "dependencies_mapped" "Identified integration points with memory system"

# Planning phase
./scripts/checkpoint.sh "$AGENT_ID" "planning" "design_drafted" "Created feature specification document"
./scripts/checkpoint.sh "$AGENT_ID" "planning" "plan_approved" "Implementation approach validated"
```

#### IMPLEMENTER Checkpoints

```bash
# Implementation phase
./scripts/checkpoint.sh "$AGENT_ID" "implementation" "scaffold_created" "Created file structure and interfaces"
./scripts/checkpoint.sh "$AGENT_ID" "implementation" "core_logic_written" "Implemented main business logic"
./scripts/checkpoint.sh "$AGENT_ID" "implementation" "code_written" "All features implemented"

# Testing phase
./scripts/checkpoint.sh "$AGENT_ID" "testing" "tests_written" "Created 15 unit tests"
./scripts/checkpoint.sh "$AGENT_ID" "testing" "tests_passing" "All tests pass with 87% coverage"
```

#### AUDITOR Checkpoints

```bash
# Research phase
./scripts/checkpoint.sh "$AGENT_ID" "research" "code_reviewed" "Reviewed implementation files"
./scripts/checkpoint.sh "$AGENT_ID" "research" "tests_verified" "Checked test coverage and quality"

# Planning phase
./scripts/checkpoint.sh "$AGENT_ID" "planning" "issues_catalogued" "Found 3 minor issues"
./scripts/checkpoint.sh "$AGENT_ID" "planning" "report_drafted" "Audit report complete"
```

#### CLEANER Checkpoints

```bash
# Cleanup phase
./scripts/checkpoint.sh "$AGENT_ID" "cleanup" "dead_code_removed" "Removed 5 unused imports"
./scripts/checkpoint.sh "$AGENT_ID" "cleanup" "formatting_fixed" "Standardized indentation"
./scripts/checkpoint.sh "$AGENT_ID" "cleanup" "ready_for_review" "Code cleanup complete, tests still pass"
```

### Best Practices

1. **Report at Natural Boundaries**: Checkpoint when you complete a discrete work unit, not arbitrarily
2. **Use Descriptive Milestones**: Names like `code_written` are better than `step_3`
3. **Include Context in Details**: Help future agents understand what was done
4. **Stay in Your Phase**: Don't jump phases - move through them sequentially
5. **One Checkpoint Per Milestone**: Report when the milestone is truly complete

### Integration with Status Updates

Checkpoints complement, not replace, status updates:

- **status-update.sh**: For arbitrary key-value updates (role, currentTask, findings)
- **checkpoint.sh**: For semantic progress milestones with automatic phase tracking

Use both as appropriate:

```bash
# Start work - set basic status
./scripts/status-update.sh "$AGENT_ID" "role" "IMPLEMENTER"
./scripts/status-update.sh "$AGENT_ID" "currentTask" "Implementing feature X"

# Reach semantic milestone - report checkpoint
./scripts/checkpoint.sh "$AGENT_ID" "implementation" "code_written" "Completed feature X implementation"

# Add findings as you go
./scripts/status-update.sh "$AGENT_ID" "findings" "Discovered pattern Y works well"

# Complete work
./scripts/checkpoint.sh "$AGENT_ID" "testing" "tests_passing" "All tests verified"
./scripts/status-update.sh "$AGENT_ID" "status" "complete"
```

## Handoff Protocol

When completing your work, you must signal handoff readiness to enable the next agent in the workflow. This creates a traceable chain of work across agents.

### Handoff Signaling

**Signal handoff when:**
- Your assigned work is complete
- You need to pass deliverables to another specialized agent
- You've reached a natural workflow boundary (e.g., PLANNER → IMPLEMENTER, IMPLEMENTER → AUDITOR)

**Handoff data structure:**

```json
{
  "handoffId": "handoff-<timestamp>-<from>-to-<to>",
  "fromAgent": "<your-agent-id>",
  "toRole": "<target-role>",
  "timestamp": "<ISO-8601-timestamp>",
  "phase": "<current-phase>",
  "status": "ready_for_<next_stage>",
  "deliverables": {
    "files": ["<absolute-paths>"],
    "findings": ["<key-discoveries>"],
    "decisions": ["<important-choices-made>"]
  },
  "context": {
    "intent": "<what-outcome-is-needed>",
    "scope": "<boundaries-of-work>",
    "successCriteria": "<how-to-evaluate>",
    "constraints": ["<non-negotiable-requirements>"]
  },
  "nextSteps": ["<recommended-actions-for-recipient>"]
}
```

### Writing Handoff Data

Create a handoff file in `data/handoffs/`:

```bash
# Set handoff variables
HANDOFF_ID="handoff-$(date +%s)-${AGENT_ID}-to-IMPLEMENTER"
HANDOFF_FILE="data/handoffs/${HANDOFF_ID}.json"

# Create handoff directory if needed
mkdir -p data/handoffs

# Write handoff JSON
cat > "$HANDOFF_FILE" <<'EOF'
{
  "handoffId": "handoff-1234567890-agent-12345-PLANNER-to-IMPLEMENTER",
  "fromAgent": "agent-12345-PLANNER",
  "toRole": "IMPLEMENTER",
  "timestamp": "2025-12-11T10:30:00Z",
  "phase": "Phase 6 - Enhancement",
  "status": "ready_for_implementation",
  "deliverables": {
    "files": [
      "/home/alton/Sartor-claude-network/docs/feature-spec.md",
      "/home/alton/Sartor-claude-network/plans/implementation-approach.md"
    ],
    "findings": [
      "Identified 3 integration points with existing memory system",
      "Estimated 2-3 hours implementation time"
    ],
    "decisions": [
      "Using strategy pattern for extensibility",
      "Adding new interface rather than modifying existing"
    ]
  },
  "context": {
    "intent": "Implement cost-aware operation selection to reduce API costs by preferring cheaper operations when appropriate",
    "scope": "src/skills/cost-aware-selection.ts and related tests only",
    "successCriteria": "New skill can select between operation types based on cost/quality tradeoff, with tests covering edge cases",
    "constraints": [
      "Must not break existing skill interfaces",
      "No mocks - use real implementations or flag as TODO",
      "Follow existing error handling patterns"
    ]
  },
  "nextSteps": [
    "Read feature-spec.md for full requirements",
    "Implement CostAwareSelector class",
    "Add unit tests with 80%+ coverage",
    "Update skill registry to include new skill"
  ]
}
EOF

# Update your agent status with handoff
./scripts/status-update.sh "$AGENT_ID" "handoffId" "$HANDOFF_ID"
./scripts/status-update.sh "$AGENT_ID" "status" "complete"
```

### Role-Specific Handoff Examples

#### PLANNER → IMPLEMENTER

**PLANNER completes planning and hands off implementation:**

```bash
HANDOFF_ID="handoff-$(date +%s)-${AGENT_ID}-to-IMPLEMENTER"
cat > "data/handoffs/${HANDOFF_ID}.json" <<'EOF'
{
  "handoffId": "handoff-1234567890-planner-001-to-IMPLEMENTER",
  "fromAgent": "agent-planner-001",
  "toRole": "IMPLEMENTER",
  "timestamp": "2025-12-11T10:30:00Z",
  "phase": "Phase 6",
  "status": "ready_for_implementation",
  "deliverables": {
    "files": [
      "/home/alton/Sartor-claude-network/plans/feature-plan.md",
      "/home/alton/Sartor-claude-network/docs/architecture-decision.md"
    ],
    "findings": [
      "Existing memory tier can support new feature without changes",
      "Need new skill interface for cost-aware selection"
    ],
    "decisions": [
      "Use strategy pattern for cost/quality tradeoffs",
      "Integrate with existing skill registry"
    ]
  },
  "context": {
    "intent": "Enable cost-aware operation selection to reduce unnecessary API costs",
    "scope": "src/skills/cost-aware-selection.ts + tests",
    "successCriteria": "Skill selects operations based on configurable cost thresholds with full test coverage",
    "constraints": [
      "No breaking changes to existing skills",
      "Must work with current MemorySystem",
      "Follow evidence-based validation - no fabricated metrics"
    ]
  },
  "nextSteps": [
    "Implement CostAwareSelector class per architecture-decision.md",
    "Add tests covering cost threshold edge cases",
    "Verify integration with skill registry"
  ]
}
EOF
```

#### IMPLEMENTER → AUDITOR

**IMPLEMENTER completes implementation and requests audit:**

```bash
HANDOFF_ID="handoff-$(date +%s)-${AGENT_ID}-to-AUDITOR"
cat > "data/handoffs/${HANDOFF_ID}.json" <<'EOF'
{
  "handoffId": "handoff-1234567891-implementer-002-to-AUDITOR",
  "fromAgent": "agent-implementer-002",
  "toRole": "AUDITOR",
  "timestamp": "2025-12-11T12:45:00Z",
  "phase": "Phase 6",
  "status": "ready_for_audit",
  "deliverables": {
    "files": [
      "/home/alton/Sartor-claude-network/src/skills/cost-aware-selection.ts",
      "/home/alton/Sartor-claude-network/src/skills/__tests__/cost-aware-selection.test.ts"
    ],
    "findings": [
      "Implemented strategy pattern with 3 cost levels (low/medium/high)",
      "Test coverage at 87% (35/40 code paths)",
      "Integrated with skill registry without breaking changes"
    ],
    "decisions": [
      "Used enum for cost levels instead of magic numbers",
      "Added optional telemetry hooks for cost tracking",
      "Defaulted to medium cost threshold for safety"
    ]
  },
  "context": {
    "intent": "Verify implementation quality and correctness before merge",
    "scope": "Full audit of cost-aware-selection module",
    "successCriteria": "No critical issues, all tests pass, code follows patterns",
    "constraints": [
      "Read-only audit - no code modifications",
      "Evidence-based assessment - cite specific issues",
      "Check for mocks or fabricated test data"
    ]
  },
  "nextSteps": [
    "Verify all tests pass with npm test",
    "Check TypeScript compilation with npm run build",
    "Review code for anti-patterns (mocks, hardcoded values, etc)",
    "Assess test coverage and edge case handling",
    "Provide specific, actionable feedback on any issues found"
  ]
}
EOF
```

#### AUDITOR → CLEANER

**AUDITOR identifies cleanup needs and hands off:**

```bash
HANDOFF_ID="handoff-$(date +%s)-${AGENT_ID}-to-CLEANER"
cat > "data/handoffs/${HANDOFF_ID}.json" <<'EOF'
{
  "handoffId": "handoff-1234567892-auditor-003-to-CLEANER",
  "fromAgent": "agent-auditor-003",
  "toRole": "CLEANER",
  "timestamp": "2025-12-11T14:15:00Z",
  "phase": "Phase 6",
  "status": "ready_for_cleanup",
  "deliverables": {
    "files": [
      "/home/alton/Sartor-claude-network/docs/audit-report.md"
    ],
    "findings": [
      "Implementation quality: acceptable (8/10)",
      "Found 3 unused imports in cost-aware-selection.ts",
      "Found 2 commented-out code blocks from development",
      "Test file has inconsistent formatting (tabs vs spaces)"
    ],
    "decisions": [
      "No blocking issues - safe to clean up",
      "Cleanup should not modify business logic"
    ]
  },
  "context": {
    "intent": "Clean up minor issues without changing functionality",
    "scope": "src/skills/cost-aware-selection.ts and test file only",
    "successCriteria": "Cleaner code without functionality changes, all tests still pass",
    "constraints": [
      "Remove unused imports and dead code only",
      "Fix formatting inconsistencies",
      "Do NOT modify logic or add features",
      "Verify npm run build passes after changes"
    ]
  },
  "nextSteps": [
    "Remove unused imports",
    "Delete commented-out development code",
    "Standardize formatting (use 2 spaces per project convention)",
    "Run npm run build to verify no breakage",
    "Run tests to confirm functionality unchanged"
  ]
}
EOF
```

### Receiving Handoffs

**Check for incoming handoffs at agent start:**

```bash
# Find latest handoff for your role
LATEST_HANDOFF=$(ls -t data/handoffs/*-to-${ROLE}.json 2>/dev/null | head -1)

if [ -n "$LATEST_HANDOFF" ]; then
  echo "Found handoff: $LATEST_HANDOFF"
  cat "$LATEST_HANDOFF" | jq .

  # Extract context for your work
  INTENT=$(cat "$LATEST_HANDOFF" | jq -r '.context.intent')
  SCOPE=$(cat "$LATEST_HANDOFF" | jq -r '.context.scope')
  NEXT_STEPS=$(cat "$LATEST_HANDOFF" | jq -r '.nextSteps[]')

  # Mark handoff as received
  HANDOFF_ID=$(cat "$LATEST_HANDOFF" | jq -r '.handoffId')
  ./scripts/status-update.sh "$AGENT_ID" "receivedHandoff" "$HANDOFF_ID"
else
  echo "No handoffs found for role: $ROLE"
fi
```

### Handoff in Subagent Output Format

When using the standardized output format (see "Subagent Output Format" section), include handoff information:

```markdown
### Status
SUCCESS

### Summary
[Your work summary]

### Findings
[Detailed findings]

### Handoff
- **Handoff ID**: handoff-1234567890-agent-12345-PLANNER-to-IMPLEMENTER
- **To Role**: IMPLEMENTER
- **Status**: ready_for_implementation
- **Handoff File**: /home/alton/Sartor-claude-network/data/handoffs/handoff-1234567890-agent-12345-PLANNER-to-IMPLEMENTER.json

### Memory Candidates
[Memory candidates as usual]

### Recommendations
[Next steps for receiving agent]
```

**Key Principles:**
1. **Explicit Handoff**: Always create handoff file, don't assume next agent will find your work
2. **Complete Context**: Include enough context for recipient to work independently
3. **Traceable Chain**: Handoff IDs create audit trail of work flow
4. **Status Coordination**: Update your agent status with handoff ID when complete
5. **Evidence-Based**: Include actual deliverables and findings, not aspirational claims

## Context
[Brief context about the current state]

## Task
[Clear, specific task description]

## Constraints
- CAN: [What they're allowed to do]
- CANNOT: [What they must not do]

## Expected Output
[What format their response should take]

## Available Resources
- Memory: src/memory/memory-system.ts (MemorySystem class)
- Skills: src/skills/*.ts
- Executive: src/executive/*.ts
```

## Example: Spawning an Implementer (Foreground)

```
**Role: IMPLEMENTER**
**Scope:** src/memory/ only
**Phase:** Phase 5 - Integration

## IMPORTANT: Agent Role Identification
You are a SUBAGENT. Set this environment variable in your context:
- CLAUDE_AGENT_ROLE=IMPLEMENTER

This exempts you from orchestrator delegation enforcement, allowing you to edit implementation files.

**At Task Start:**
```bash
export AGENT_ID="agent-$RANDOM-IMPLEMENTER"
export CLAUDE_AGENT_ROLE=IMPLEMENTER
./scripts/checkpoint.sh "$AGENT_ID" "research" "task_received" "Starting implementation of batchCreate method"
```

## Context
We're adding a new method to MemorySystem for batch operations.

## Task
Add a `batchCreate` method to src/memory/memory-system.ts that creates multiple memories in one call.

## Constraints
- CAN: Edit memory-system.ts, add tests
- CANNOT: Modify other files, change existing method signatures

## Expected Output
- Updated memory-system.ts with new method
- Brief summary of changes (2-3 lines)

## Available Resources
- Read existing MemorySystem class first
- Follow existing patterns for error handling

**During Work:**
```bash
./scripts/checkpoint.sh "$AGENT_ID" "implementation" "code_written" "Implemented batchCreate with transaction support"
./scripts/memory-write.sh "Discovered pattern X works well for Y" "procedural" "0.7" '["pattern","learning"]'
```

**At Completion:**
```bash
./scripts/checkpoint.sh "$AGENT_ID" "testing" "tests_passing" "All 8 unit tests pass"
./scripts/memory-write.sh "Completed implementation of batchCreate with approach Y" "episodic" "0.8" '["completion","implementation"]'
```
```

## Example: Spawning an Implementer (Background)

```
Task({
  run_in_background: true,
  instructions: `
**Role: IMPLEMENTER**
**Agent ID**: agent-${Date.now()}-IMPLEMENTER
**Scope:** src/memory/ only
**Phase:** Phase 5 - Integration

## IMPORTANT: Agent Role Identification
You are a SUBAGENT running in BACKGROUND mode. Set this environment variable:
\`\`\`bash
export CLAUDE_AGENT_ROLE=IMPLEMENTER
export AGENT_ID="agent-${Date.now()}-IMPLEMENTER"
\`\`\`

## Context
We're adding a new method to MemorySystem for batch operations.

## Task
Add a \`batchCreate\` method to src/memory/memory-system.ts that creates multiple memories in one call.

## Constraints
- CAN: Edit memory-system.ts, add tests
- CANNOT: Modify other files, change existing method signatures

## Expected Output
- Updated memory-system.ts with new method
- Brief summary of changes (2-3 lines)

## Checkpoint Reporting
Report progress at semantic milestones:
\`\`\`bash
./scripts/checkpoint.sh "$AGENT_ID" "research" "files_identified" "Found memory-system.ts and test file"
./scripts/checkpoint.sh "$AGENT_ID" "implementation" "code_written" "Implemented batchCreate method"
./scripts/checkpoint.sh "$AGENT_ID" "testing" "tests_passing" "All 8 unit tests pass"
\`\`\`

## CRITICAL: Wake Message at Completion
When you complete your work, send a wake message:
\`\`\`bash
./scripts/wake.sh "COMPLETE" "$AGENT_ID" "Implemented batchCreate with 8 passing tests"
\`\`\`

If you encounter blockers:
\`\`\`bash
./scripts/wake.sh "BLOCKED" "$AGENT_ID" "Need clarification on rollback behavior"
\`\`\`
`
});
```

## Example: Spawning an Auditor (Foreground)

```
**Role: AUDITOR**
**Scope:** Full codebase (read-only)
**Phase:** Phase 5 - Integration

## IMPORTANT: Agent Role Identification
You are a SUBAGENT. Set this environment variable in your context:
- CLAUDE_AGENT_ROLE=AUDITOR

This exempts you from orchestrator delegation enforcement (though auditors shouldn't edit anyway).

**At Task Start:**
```bash
export AGENT_ID="agent-$RANDOM-AUDITOR"
export CLAUDE_AGENT_ROLE=AUDITOR
./scripts/checkpoint.sh "$AGENT_ID" "research" "task_received" "Starting audit of executive module"
```

## Context
Phase 5 is complete. Need validation.

## Task
Audit the executive module for completeness and correctness.

## Constraints
- CAN: Read any file, run tests, check types
- CANNOT: Modify any files

## Expected Output
- Evidence-based assessment (no fabricated scores without measurement)
- List of issues found with specific file/line references
- Recommendations (max 5)

## Checkpoint Reporting
```bash
./scripts/checkpoint.sh "$AGENT_ID" "research" "code_reviewed" "Reviewed 12 implementation files"
./scripts/checkpoint.sh "$AGENT_ID" "planning" "issues_catalogued" "Found 3 minor issues"
./scripts/checkpoint.sh "$AGENT_ID" "planning" "report_drafted" "Audit report complete"
```
```

## Example: Spawning an Auditor (Background with Wake Messages)

```
Task({
  run_in_background: true,
  instructions: `
**Role: AUDITOR**
**Agent ID**: agent-${Date.now()}-AUDITOR
**Scope:** Full codebase (read-only)
**Phase:** Phase 5 - Integration

## IMPORTANT: Agent Role Identification
You are a SUBAGENT running in BACKGROUND mode. Set this environment variable:
\`\`\`bash
export CLAUDE_AGENT_ROLE=AUDITOR
export AGENT_ID="agent-${Date.now()}-AUDITOR"
\`\`\`

## Context
Phase 5 is complete. Need validation before proceeding to Phase 6.

## Task
Audit the executive module for completeness and correctness.

## Constraints
- CAN: Read any file, run tests, check types
- CANNOT: Modify any files

## Expected Output
- Evidence-based assessment (no fabricated scores without measurement)
- List of issues found with specific file/line references
- Recommendations (max 5)

## Checkpoint Reporting
\`\`\`bash
./scripts/checkpoint.sh "$AGENT_ID" "research" "code_reviewed" "Reviewed executive module files"
./scripts/checkpoint.sh "$AGENT_ID" "planning" "issues_catalogued" "Found X issues"
./scripts/checkpoint.sh "$AGENT_ID" "planning" "report_drafted" "Audit report complete"
\`\`\`

## CRITICAL: Wake Messages
Send wake messages for important findings:

\`\`\`bash
# If critical issue found
./scripts/wake.sh "FINDING" "$AGENT_ID" "Found mock in production code at src/executive/orchestrator.ts:45"

# If blocked (e.g., tests won't run)
./scripts/wake.sh "BLOCKED" "$AGENT_ID" "Cannot run integration tests, Memory MCP not available"

# When complete
./scripts/wake.sh "COMPLETE" "$AGENT_ID" "Audit complete, found 3 minor issues, no blockers"
\`\`\`
`
});
```

## Example: Spawning a Cleaner (Foreground)

```
**Role: CLEANER**
**Scope:** src/skills/ (delete unreferenced files only)
**Phase:** Phase 5 - Integration (Completed)

## IMPORTANT: Agent Role Identification
You are a SUBAGENT. Set this environment variable in your context:
- CLAUDE_AGENT_ROLE=CLEANER

This exempts you from orchestrator delegation enforcement, allowing you to edit implementation files.

**At Task Start:**
```bash
export AGENT_ID="agent-$RANDOM-CLEANER"
export CLAUDE_AGENT_ROLE=CLEANER
./scripts/checkpoint.sh "$AGENT_ID" "research" "task_received" "Starting cleanup of src/skills/ directory"
```

## Context
The src/skills/ directory has accumulated unused files and dead code over development.

## Task
Clean up the src/skills/ directory:
1. Find any unused/duplicate files
2. Remove dead code and commented-out blocks
3. Fix inconsistent formatting
4. Verify nothing breaks after cleanup

## Constraints
- CAN: Delete unreferenced files, fix linting, reorganize imports, remove dead code
- CANNOT: Modify business logic, change APIs, delete tests without verification, add features

## Expected Output
- List of files deleted
- Build verification (npm run build passes)
- Summary of cleanup actions (3-5 lines)

## Safety Protocol
- Grep for all references before deleting any file
- Run `npm run build` after changes
- Create a list of deleted files in your response

## Checkpoint Reporting
```bash
./scripts/checkpoint.sh "$AGENT_ID" "cleanup" "dead_code_removed" "Removed 5 unused imports"
./scripts/checkpoint.sh "$AGENT_ID" "cleanup" "formatting_fixed" "Standardized indentation"
./scripts/checkpoint.sh "$AGENT_ID" "cleanup" "ready_for_review" "Code cleanup complete, build passes"
```
```

## Example: Spawning a Cleaner (Background with Safety Checks)

```
Task({
  run_in_background: true,
  instructions: `
**Role: CLEANER**
**Agent ID**: agent-${Date.now()}-CLEANER
**Scope:** src/skills/ (delete unreferenced files only)
**Phase:** Phase 5 - Integration (Completed)

## IMPORTANT: Agent Role Identification
You are a SUBAGENT running in BACKGROUND mode. Set this environment variable:
\`\`\`bash
export CLAUDE_AGENT_ROLE=CLEANER
export AGENT_ID="agent-${Date.now()}-CLEANER"
\`\`\`

## Context
The src/skills/ directory has accumulated unused files and dead code over development.

## Task
Clean up the src/skills/ directory:
1. Find any unused/duplicate files
2. Remove dead code and commented-out blocks
3. Fix inconsistent formatting
4. Verify nothing breaks after cleanup

## Constraints
- CAN: Delete unreferenced files, fix linting, reorganize imports, remove dead code
- CANNOT: Modify business logic, change APIs, delete tests without verification, add features

## Expected Output
- List of files deleted
- Build verification (npm run build passes)
- Summary of cleanup actions (3-5 lines)

## Safety Protocol
- Grep for all references before deleting any file
- Run \`npm run build\` after changes
- If build fails, send ERROR wake message immediately

## Checkpoint Reporting
\`\`\`bash
./scripts/checkpoint.sh "$AGENT_ID" "cleanup" "dead_code_removed" "Removed X unused files"
./scripts/checkpoint.sh "$AGENT_ID" "cleanup" "formatting_fixed" "Standardized code style"
./scripts/checkpoint.sh "$AGENT_ID" "cleanup" "ready_for_review" "Cleanup complete, build verified"
\`\`\`

## CRITICAL: Wake Messages
\`\`\`bash
# If unexpected issue found during cleanup
./scripts/wake.sh "FINDING" "$AGENT_ID" "Found 5 files marked TODO but still referenced in code"

# If build fails after cleanup
./scripts/wake.sh "ERROR" "$AGENT_ID" "Build failed after cleanup, reverting changes"

# When complete and verified
./scripts/wake.sh "COMPLETE" "$AGENT_ID" "Removed 8 unused files, build passes, tests pass"
\`\`\`
`
});
```

## Example: Spawning a PLANNER (Background for Lead Agent)

```
Task({
  run_in_background: true,
  instructions: `
**Role: PLANNER (Lead Agent)**
**Agent ID**: lead-${Date.now()}-PLANNER
**Scope:** Planning and coordination only (no implementation)
**Phase:** Phase 6 - Enhancement

## IMPORTANT: Agent Role Identification
You are a LEAD AGENT running in BACKGROUND mode. Set this environment variable:
\`\`\`bash
export CLAUDE_AGENT_ROLE=PLANNER
export AGENT_ID="lead-${Date.now()}-PLANNER"
\`\`\`

## Context
We need to implement a cost-aware operation selection feature that spans multiple modules.

## Task
You are the LEAD AGENT coordinating a swarm of subagents:
1. Break down the feature into 3-4 parallel workstreams
2. Spawn IMPLEMENTER subagents for each module
3. Spawn an AUDITOR for integration testing
4. Spawn an OBSERVER to monitor swarm health
5. Wait for completion wake messages from all agents
6. Synthesize results and create final handoff

## Your Responsibilities
- Define clear, non-overlapping scopes for each subagent
- Provide full context to each subagent
- Monitor wake messages and status updates
- Handle blockers by making decisions or escalating
- Synthesize final results when all agents complete

## Expected Swarm Composition
- Subagent 1 (IMPLEMENTER): Cost calculation module
- Subagent 2 (IMPLEMENTER): Selection strategy module
- Subagent 3 (IMPLEMENTER): Integration with skill registry
- Subagent 4 (AUDITOR): Integration testing across modules
- OBSERVER: Monitor all agents, report issues

## Checkpoint Reporting
\`\`\`bash
./scripts/checkpoint.sh "$AGENT_ID" "planning" "design_drafted" "Feature broken into 3 modules"
./scripts/checkpoint.sh "$AGENT_ID" "planning" "swarm_spawned" "Spawned 4 subagents and OBSERVER"
./scripts/checkpoint.sh "$AGENT_ID" "implementation" "monitoring_progress" "Monitoring swarm execution"
./scripts/checkpoint.sh "$AGENT_ID" "testing" "synthesis_complete" "All agents complete, results synthesized"
\`\`\`

## CRITICAL: Wake Messages
\`\`\`bash
# When swarm is spawned
./scripts/wake.sh "COMPLETE" "$AGENT_ID" "Swarm spawned with 4 agents and OBSERVER, monitoring progress"

# If coordination issue arises
./scripts/wake.sh "FINDING" "$AGENT_ID" "Agent 2 blocked on Agent 1's output, adjusting coordination"

# When all agents complete
./scripts/wake.sh "COMPLETE" "$AGENT_ID" "All swarm agents complete, feature implemented with 85% test coverage"
\`\`\`

## Memory Isolation
Remember: Each subagent has isolated memory. They coordinate via:
- Handoff files in data/handoffs/
- Status updates in data/agent-status/
- Wake messages in data/wake-messages/

You must read these files to monitor progress.
`
});
```

## Example: Complete Swarm Execution

This example shows a full swarm pattern from orchestrator to completion:

### Step 1: Orchestrator Spawns Lead Agent

```typescript
// Orchestrator delegates to Lead PLANNER
Task({
  run_in_background: true,
  instructions: `[... PLANNER instructions from above ...]`
});
```

### Step 2: Lead Agent Spawns Swarm

The Lead Agent (PLANNER) spawns 4 subagents + OBSERVER:

```typescript
// Inside Lead Agent execution
const swarmAgents = [
  {
    role: 'IMPLEMENTER',
    agentId: 'swarm-agent-0-IMPLEMENTER',
    scope: 'src/skills/cost-calculation.ts',
    task: 'Implement cost calculation logic for different operation types'
  },
  {
    role: 'IMPLEMENTER',
    agentId: 'swarm-agent-1-IMPLEMENTER',
    scope: 'src/skills/selection-strategy.ts',
    task: 'Implement selection strategy based on cost thresholds'
  },
  {
    role: 'IMPLEMENTER',
    agentId: 'swarm-agent-2-IMPLEMENTER',
    scope: 'src/skills/cost-aware-selection.ts',
    task: 'Integrate cost calculation and selection with skill registry'
  },
  {
    role: 'AUDITOR',
    agentId: 'swarm-agent-3-AUDITOR',
    scope: 'src/skills/',
    task: 'Test integration across all three modules'
  }
];

// Spawn all agents in parallel
swarmAgents.forEach(agent => {
  Task({
    run_in_background: true,
    instructions: `
**Role: ${agent.role}**
**Agent ID**: ${agent.agentId}
**Scope**: ${agent.scope}

${agent.task}

## Checkpoint Reporting
\`\`\`bash
./scripts/checkpoint.sh "${agent.agentId}" "implementation" "code_written" "Details"
./scripts/checkpoint.sh "${agent.agentId}" "testing" "tests_passing" "Tests verified"
\`\`\`

## CRITICAL: Wake Message at Completion
\`\`\`bash
./scripts/wake.sh "COMPLETE" "${agent.agentId}" "Brief summary of work"
\`\`\`
`
  });
});

// Spawn OBSERVER
Task({
  run_in_background: true,
  instructions: `[... OBSERVER instructions monitoring swarm-agent-0,1,2,3 ...]`
});
```

### Step 3: OBSERVER Monitors Swarm

OBSERVER runs monitoring loop every 60 seconds:

```bash
# OBSERVER checks agent status
for agent_id in swarm-agent-0-IMPLEMENTER swarm-agent-1-IMPLEMENTER swarm-agent-2-IMPLEMENTER swarm-agent-3-AUDITOR; do
  STATUS=$(cat "data/agent-status/${agent_id}.json" | jq -r '.status')
  PROGRESS=$(cat "data/agent-status/${agent_id}.json" | jq -r '.progress')
  echo "[${agent_id}] Status: ${STATUS}, Progress: ${PROGRESS}"
done

# Every 5 minutes, send progress summary
./scripts/wake.sh "FINDING" "observer-swarm-12345" "Progress: Agent 0 at 60%, Agent 1 at 40%, Agent 2 at 30%, Agent 3 waiting"
```

### Step 4: Subagents Complete and Send Wake Messages

Each subagent finishes and wakes the Lead Agent:

```bash
# Agent 0 completes
./scripts/wake.sh "COMPLETE" "swarm-agent-0-IMPLEMENTER" "Cost calculation implemented with 12 tests passing"

# Agent 1 completes
./scripts/wake.sh "COMPLETE" "swarm-agent-1-IMPLEMENTER" "Selection strategy implemented with 8 tests passing"

# Agent 2 completes
./scripts/wake.sh "COMPLETE" "swarm-agent-2-IMPLEMENTER" "Integration complete, skill registry updated"

# Agent 3 completes
./scripts/wake.sh "COMPLETE" "swarm-agent-3-AUDITOR" "Integration tests pass, found 2 minor issues (documented)"
```

### Step 5: Lead Agent Synthesizes Results

Lead Agent checks for all completion wake messages:

```bash
# Check wake messages
COMPLETE_COUNT=0
for agent_id in swarm-agent-{0,1,2,3}-*; do
  if grep -q "COMPLETE" data/wake-messages/wake-*-${agent_id}.json 2>/dev/null; then
    COMPLETE_COUNT=$((COMPLETE_COUNT + 1))
  fi
done

if [ $COMPLETE_COUNT -eq 4 ]; then
  echo "All agents complete, synthesizing results..."

  # Read all handoffs
  cat data/handoffs/*-swarm-agent-*.json | jq -s '
    {
      "combinedFindings": [.[].deliverables.findings[]],
      "totalTestsPassing": [.[].deliverables.findings[] | select(contains("tests"))] | length,
      "issues": [.[].deliverables.findings[] | select(contains("issue"))]
    }
  '

  # Create final handoff to orchestrator
  ./scripts/wake.sh "COMPLETE" "$AGENT_ID" "Feature complete: 3 modules implemented, 28 tests passing, 2 minor issues documented"
fi
```

### Step 6: Orchestrator Receives Final Wake Message

Orchestrator checks wake messages and acknowledges completion:

```bash
# Orchestrator checks for wake messages
cat data/wake-messages/wake-*-lead-*.json | jq 'select(.type == "COMPLETE")'

# Acknowledge completion
./scripts/wake-ack.sh "wake-1234567890-lead-12345-PLANNER"
```

## Subagent Output Format (REQUIRED)

**ALL subagents MUST use this format when reporting back to the orchestrator.**

When completing your task, structure your response as:

```markdown
### Status
[SUCCESS | BLOCKED | FAILED]

### Summary
[2-3 sentence summary of what was done]

### Findings
[Detailed findings, evidence, or deliverables]

### Handoff (if passing work to another agent)
- **Handoff ID**: [handoff ID from created handoff file]
- **To Role**: [PLANNER|IMPLEMENTER|AUDITOR|CLEANER]
- **Status**: [ready_for_implementation|ready_for_audit|ready_for_cleanup]
- **Handoff File**: [absolute path to handoff JSON file]

### Memory Candidates
[Any findings that should be persisted to Memory MCP - orchestrator will store these]
- Content: [what to store]
- Type: [semantic|procedural|episodic]
- Importance: [0.0-1.0]
- Tags: [relevant tags]

### Blockers (if any)
[What blocked progress, what's needed to unblock]

### Recommendations
[Next steps, follow-up tasks suggested]
```

**Status Definitions:**
- **SUCCESS**: Task completed as specified, all deliverables met
- **BLOCKED**: Cannot proceed without external input/decision/resource
- **FAILED**: Attempted but could not complete (include why in Blockers)

**Memory Candidates Guidelines:**
- Only include findings worth persisting across sessions
- Use SEMANTIC (0.9+) for critical facts/directives
- Use PROCEDURAL (0.7-0.8) for successful patterns/methods
- Use EPISODIC (0.5-0.7) for context/events
- Include specific, actionable content (not vague summaries)

**Example Output:**

```markdown
### Status
SUCCESS

### Summary
Added batchCreate method to MemorySystem class. Method creates multiple memories in a single transaction with atomic rollback on failure. All existing tests pass and new test coverage added.

### Findings
- Implemented `batchCreate(memories: MemoryInput[]): Promise<Memory[]>` in src/memory/memory-system.ts
- Added transaction support with rollback on any failure
- Test coverage: 8 new test cases covering success, partial failure, and rollback scenarios
- Performance: ~3x faster than sequential creates for batches >5 items

### Handoff
- **Handoff ID**: handoff-1733925600-agent-23456-IMPLEMENTER-to-AUDITOR
- **To Role**: AUDITOR
- **Status**: ready_for_audit
- **Handoff File**: /home/alton/Sartor-claude-network/data/handoffs/handoff-1733925600-agent-23456-IMPLEMENTER-to-AUDITOR.json

### Memory Candidates
- Content: "MemorySystem.batchCreate uses transaction pattern with atomic rollback - wrap in try/catch and reverse on error"
  Type: procedural
  Importance: 0.75
  Tags: ["memory-system", "batch-operations", "transactions"]

### Blockers
None

### Recommendations
- Consider adding batch operations for update/delete as well
- Monitor performance with batches >100 items
```

## Key Principles

1. **Always assign a role** - Agents perform better with clear identity
2. **Limit scope** - Prevent unintended side effects
3. **State the phase** - Keeps work aligned with roadmap
4. **Define constraints** - CAN/CANNOT makes boundaries clear
5. **Specify output format** - Gets consistent, usable responses
6. **Inject skills inline** - Don't just reference files, include the content
7. **Require standardized handoff** - Subagents MUST use the output format above

## CRITICAL: Skill Injection

Skills in `.claude/skills/*.md` are just files. Agents don't automatically inherit them.

**To actually give an agent a skill, include it in the prompt:**

```
**Role: IMPLEMENTER**

## Skill: Refinement Protocol
Before completing, use this loop:
1. Generate initial solution
2. Self-audit: Does it meet the goal?
3. Score confidence (0-1)
4. If score < 0.8, refine and repeat (max 3 times)

## Task
[Your task here]
```

**Quick skill summaries to inject:**

### For any agent needing refinement:

```
## Protocol: Refinement Loop
Generate → Self-Audit → Score → Refine if <0.8 (max 3 iterations)
```

### For agents working with memory:

```
## Skill: Memory Access
Use MemorySystem from src/memory/memory-system.ts:
- createMemory(content, type, {importance_score, tags})
- getMemory(id), searchMemories({filters, limit})
- Types: EPISODIC, SEMANTIC, PROCEDURAL, WORKING
```

### For role enforcement:

```
## Role: AUDITOR
- CAN: Read files, run tests, check types, score quality
- CANNOT: Modify ANY files (this is a hard constraint)
- Output: Score (1-10), issues list, recommendations
```

### For agents needing persistent memory:

```
## Skill: MCP Memory Tools
If you have memory_create/memory_get/memory_search tools available:
- memory_create: Store learnings (type: procedural, importance: 0-1)
- memory_search: Find past patterns before starting
- memory_get: Retrieve specific memories
Use PROCEDURAL type for successful approaches worth remembering.
```

**The rule:** If you want an agent to HAVE a skill, paste the skill content into their prompt. File references alone don't work.

---

## Memory Access Patterns

### Architecture: MCP Tools vs JSON Fallback

**IMPORTANT: This is by design, not a bug.**

- **Orchestrator (main Claude Code)**: Has MCP tools (memory_create, memory_get, memory_search, memory_stats)
- **Subagents (spawned via Task tool)**: Do NOT have MCP tools, use JSON file fallback

This separation ensures the orchestrator maintains the authoritative memory state while allowing subagents read access and the ability to propose new memories.

### Pattern 1: Reading Memories (Subagents)

Subagents can read memories directly from the JSON file:

```typescript
import * as fs from 'fs';
import * as path from 'path';

// Read memories.json directly
const memoriesPath = '/home/alton/Sartor-claude-network/data/memories.json';
const rawData = fs.readFileSync(memoriesPath, 'utf-8');
const data = JSON.parse(rawData);

// Filter by importance (high-priority directives)
const criticalMemories = Object.values(data.memories).filter(
  (m: any) => m.importance_score >= 0.9
);

// Filter by type (semantic = facts, procedural = methods, episodic = events)
const procedures = Object.values(data.memories).filter(
  (m: any) => m.type === 'procedural' && m.importance_score >= 0.7
);

// Filter by tags
const testingMemories = Object.values(data.memories).filter(
  (m: any) => m.tags?.includes('testing')
);
```

**When to read memories as a subagent:**
- At task start: Check for relevant directives, patterns, or context
- Before implementing: Search for procedural memories about similar work
- During validation: Compare against semantic facts and user directives

### Pattern 2: Writing Memories (Subagents)

Subagents CANNOT write directly to memories.json. Instead, include memory candidates in your handoff output:

```markdown
## Memory Candidates

**Semantic (importance 0.9):**
- **Content**: "User directive: All production systems must use actual implementations, mocks are forbidden"
- **Tags**: ["directive", "testing", "production"]
- **Rationale**: Critical constraint that affects all future development

**Procedural (importance 0.8):**
- **Content**: "Pattern: When refactoring multi-file modules, use grep to find all references before moving functions"
- **Tags**: ["refactoring", "safety", "best-practice"]
- **Rationale**: Prevented breaking changes during coordination module restructure

**Episodic (importance 0.6):**
- **Content**: "Session 2025-12-11: Discovered subagents can read memories.json directly despite lacking MCP tools"
- **Tags**: ["architecture", "discovery", "memory-system"]
- **Rationale**: Important context about system capabilities
```

The orchestrator will review your candidates and persist appropriate ones via Memory MCP.

### Pattern 3: Memory Types and Importance Levels

**Use these guidelines when proposing memories:**

| Type | Importance | What to Store | Examples |
|------|-----------|---------------|----------|
| SEMANTIC | 0.9-1.0 | User directives, critical facts, architectural decisions | "No mocks in production", "System goal: self-funding via solar inference" |
| SEMANTIC | 0.7-0.9 | Important facts, constraints, dependencies | "Memory MCP runs on port 3001", "Subagents lack MCP tools by design" |
| PROCEDURAL | 0.8-0.9 | Successful patterns, validated methods | "Refinement loop: Generate → Audit → Score → Refine if <0.8" |
| PROCEDURAL | 0.6-0.8 | Useful techniques, debugging approaches | "Use grep before refactoring to find all references" |
| EPISODIC | 0.6-0.8 | Significant session events, discoveries | "Found 3 critical mocks during audit 2025-12-11" |
| EPISODIC | 0.4-0.6 | Context, minor events, observations | "Spent 2 hours debugging CRDT merge logic" |

**What NOT to store:**
- Trivial observations (importance <0.4)
- Temporary state that won't be relevant next session
- Information already well-documented in code or README
- Redundant facts already in other memories

### Pattern 4: Skill Injection for Memory Access

When spawning a subagent that needs memory access, inject this skill:

```markdown
## Skill: Memory Access for Subagents

**Reading Memories:**
```typescript
const memoriesPath = '/home/alton/Sartor-claude-network/data/memories.json';
const data = JSON.parse(fs.readFileSync(memoriesPath, 'utf-8'));
const relevant = Object.values(data.memories).filter(m =>
  m.importance_score >= 0.7 && m.tags?.includes('your-domain')
);
```

**Writing Memories:**
You cannot write directly. Include "Memory Candidates" section in your output:
- SEMANTIC (0.9+): Critical findings, user directives
- PROCEDURAL (0.7-0.8): Successful patterns, methods
- EPISODIC (0.5-0.7): Session events, context

Orchestrator will persist via Memory MCP on your behalf.
```

### Example: Subagent Task with Memory Integration

```markdown
**Role: IMPLEMENTER**
**Scope:** src/skills/ only
**Phase:** Phase 6 - Enhancement

## Skill: Memory Access for Subagents

**Reading Memories:**
```typescript
const memoriesPath = '/home/alton/Sartor-claude-network/data/memories.json';
const data = JSON.parse(fs.readFileSync(memoriesPath, 'utf-8'));
const relevant = Object.values(data.memories).filter(m =>
  m.importance_score >= 0.7 && m.tags?.includes('skills')
);
```

**Writing Memories:**
Include "Memory Candidates" section in your output with type, importance, tags, and rationale.

## Context
Adding a new skill for cost-aware operation selection.

## Task
1. Read memories.json to find any existing directives about cost optimization
2. Implement cost-aware-selection.ts skill
3. Propose memory candidates for successful patterns discovered

## Expected Output
- New skill file with implementation
- Summary of relevant memories found
- Memory candidates section with any learnings worth persisting
```
