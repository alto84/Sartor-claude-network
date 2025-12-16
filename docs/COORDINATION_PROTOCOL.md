# Coordination Protocol Specification

**Version:** 1.0.0
**Status:** Active
**Last Updated:** 2025-12-11
**Owner:** Executive Claude

---

## Table of Contents

1. [Overview](#overview)
2. [Handoff JSON Structure](#handoff-json-structure)
3. [Role Transitions](#role-transitions)
4. [Status Signals](#status-signals)
5. [Integration Points](#integration-points)
6. [OBSERVER Integration](#observer-integration)
7. [Handoff Lifecycle](#handoff-lifecycle)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

---

## Overview

The Coordination Protocol defines how agents hand off work to each other in a structured, auditable way. This protocol ensures:

- **Clarity**: Each agent knows exactly what to do and what constraints apply
- **Traceability**: All handoffs are logged and archived for learning
- **Accountability**: Clear ownership at each stage
- **Continuity**: Context is preserved across role transitions
- **Safety**: Issues are flagged and tracked through the pipeline

### Core Principles

1. **Explicit Handoffs**: No implicit assumptions about next steps
2. **Structured Communication**: JSON format for machine parsing
3. **Evidence-Based**: All deliverables include verification artifacts
4. **Memory Integration**: Key decisions stored in memory system
5. **Observable Pipeline**: OBSERVER can monitor all transitions

---

## Handoff JSON Structure

All handoffs follow this standardized structure:

```json
{
  "handoff": {
    "from": "PLANNER",
    "to": "IMPLEMENTER",
    "timestamp": "2025-12-11T14:30:00Z",
    "type": "ready_for_implementation",
    "status": "pending",
    "handoffId": "handoff_1702311000000_a1b2c3d4"
  },
  "context": {
    "taskId": "task_20251211_001",
    "phase": "Phase 7: Infrastructure Activation",
    "scope": "Create Firebase activation scripts",
    "dependencies": [
      "data/memories.json",
      "src/mcp/firebase-init.ts",
      "config/service-account.json"
    ]
  },
  "deliverable": {
    "type": "implementation_plan",
    "location": "docs/firebase-activation-plan.md",
    "summary": "Detailed plan for activating Firebase hot tier with credential setup and latency validation",
    "artifacts": [
      "docs/firebase-activation-plan.md",
      "data/handoffs/handoff_1702311000000_a1b2c3d4.json"
    ]
  },
  "nextSteps": {
    "instructions": [
      "Create config/service-account.json with Firebase credentials",
      "Add FIREBASE_DATABASE_URL to .env",
      "Implement connection test in src/mcp/firebase-init.ts",
      "Validate <100ms latency with integration test",
      "Update status-update.sh to use Firebase as primary"
    ],
    "constraints": [
      "CANNOT modify src/refinement/* files",
      "MUST maintain backwards compatibility with file-based fallback",
      "MUST achieve <100ms latency requirement",
      "CANNOT commit service-account.json to git"
    ],
    "acceptanceCriteria": [
      "Firebase connection successful",
      "Latency test shows <100ms",
      "All existing tests still pass",
      "Fallback mechanism works if Firebase unavailable"
    ]
  },
  "issues": [
    {
      "severity": "medium",
      "description": "Service account credentials not yet configured",
      "recommendation": "Create placeholder config with setup instructions"
    },
    {
      "severity": "low",
      "description": "Current tests use mock Firebase",
      "recommendation": "Add integration test with real Firebase instance"
    }
  ],
  "memory": {
    "created": [
      "mem_1702311000_abc123",
      "mem_1702311001_def456"
    ],
    "referenced": [
      "mem_1702200000_xyz789"
    ]
  }
}
```

### Field Definitions

#### handoff
- **from**: Role initiating the handoff (PLANNER | IMPLEMENTER | AUDITOR | CLEANER)
- **to**: Role receiving the handoff (IMPLEMENTER | AUDITOR | CLEANER | ORCHESTRATOR)
- **timestamp**: ISO 8601 timestamp of handoff creation
- **type**: Transition type (see [Role Transitions](#role-transitions))
- **status**: Current handoff status (pending | accepted | rejected | completed)
- **handoffId**: Unique identifier (`handoff_<timestamp>_<random>`)

#### context
- **taskId**: Unique task identifier for tracking
- **phase**: Current project phase (from MASTER_PLAN.md)
- **scope**: Brief description of work scope
- **dependencies**: Array of files/resources required

#### deliverable
- **type**: Category of deliverable (plan | implementation | audit_report | cleanup_report)
- **location**: Primary file path for deliverable
- **summary**: One-sentence description
- **artifacts**: All files created/modified

#### nextSteps
- **instructions**: Ordered list of specific actions
- **constraints**: CAN/CANNOT boundaries
- **acceptanceCriteria**: How to verify success

#### issues
Array of identified problems:
- **severity**: critical | high | medium | low
- **description**: What the issue is
- **recommendation**: Suggested resolution

#### memory
- **created**: Memory IDs written during this work
- **referenced**: Memory IDs consulted during this work

---

## Role Transitions

### 1. PLANNER → IMPLEMENTER

**Type:** `ready_for_implementation`

**Trigger:** Planning complete, implementation roadmap created

**Requirements:**
- Clear implementation plan in deliverable
- File scope defined in context.dependencies
- Architecture decisions documented
- Success criteria specified

**Example:**
```json
{
  "handoff": {
    "from": "PLANNER",
    "to": "IMPLEMENTER",
    "type": "ready_for_implementation"
  },
  "nextSteps": {
    "instructions": [
      "Create new file src/coordination/handoff-manager.ts",
      "Implement HandoffManager class with create/retrieve/archive methods",
      "Add unit tests in tests/unit/coordination/handoff-manager.test.ts",
      "Update index exports"
    ],
    "constraints": [
      "CANNOT modify existing coordination files without backward compatibility",
      "MUST follow TypeScript strict mode",
      "MUST achieve 85%+ test coverage"
    ]
  }
}
```

---

### 2. IMPLEMENTER → AUDITOR

**Type:** `ready_for_audit`

**Trigger:** Implementation complete, tests passing

**Requirements:**
- All code committed to version control
- Tests written and passing
- Build successful
- Documentation updated

**Example:**
```json
{
  "handoff": {
    "from": "IMPLEMENTER",
    "to": "AUDITOR",
    "type": "ready_for_audit"
  },
  "deliverable": {
    "type": "implementation",
    "location": "src/coordination/handoff-manager.ts",
    "artifacts": [
      "src/coordination/handoff-manager.ts",
      "tests/unit/coordination/handoff-manager.test.ts",
      "docs/coordination-api.md"
    ]
  },
  "nextSteps": {
    "instructions": [
      "Review code for bugs and security issues",
      "Verify test coverage meets 85% threshold",
      "Check TypeScript type safety",
      "Validate documentation accuracy",
      "Run linters and static analyzers"
    ],
    "acceptanceCriteria": [
      "No critical or high severity issues",
      "Test coverage >= 85%",
      "All linters pass",
      "Documentation matches implementation"
    ]
  }
}
```

---

### 3. AUDITOR → CLEANER

**Type:** `ready_for_cleanup`

**Trigger:** Audit passed, no blocking issues

**Requirements:**
- Audit report generated
- All critical/high issues resolved
- Quality metrics met
- Approval given

**Example:**
```json
{
  "handoff": {
    "from": "AUDITOR",
    "to": "CLEANER",
    "type": "ready_for_cleanup"
  },
  "deliverable": {
    "type": "audit_report",
    "location": "reports/audit-handoff-manager-20251211.md",
    "summary": "PASS - 92% test coverage, no critical issues, 2 low-priority recommendations"
  },
  "nextSteps": {
    "instructions": [
      "Remove temporary test fixtures in tests/fixtures/temp/",
      "Consolidate duplicate helper functions",
      "Update .gitignore for new build artifacts",
      "Clean up unused imports",
      "Verify no dead code introduced"
    ],
    "acceptanceCriteria": [
      "No unused files remain",
      "All imports optimized",
      "Git status clean",
      "Build size not increased unnecessarily"
    ]
  }
}
```

---

### 4. CLEANER → ORCHESTRATOR

**Type:** `complete`

**Trigger:** Cleanup finished, repository hygiene restored

**Requirements:**
- Cleanup report generated
- All temporary files removed
- Documentation updated
- Git history clean

**Example:**
```json
{
  "handoff": {
    "from": "CLEANER",
    "to": "ORCHESTRATOR",
    "type": "complete"
  },
  "deliverable": {
    "type": "cleanup_report",
    "location": "reports/cleanup-handoff-manager-20251211.md",
    "summary": "Removed 12 temporary files (45KB), consolidated 3 duplicate functions, optimized imports"
  },
  "nextSteps": {
    "instructions": [
      "Review entire pipeline for learnings",
      "Update memory system with successful patterns",
      "Archive handoff chain to data/handoffs/",
      "Mark task as complete in tracking system"
    ],
    "acceptanceCriteria": [
      "All handoffs archived",
      "Key learnings stored in memory",
      "Task marked complete",
      "Ready for next task"
    ]
  }
}
```

---

### 5. Special: Return to PLANNER

**Type:** `requires_replanning`

**Trigger:** Major issue discovered, scope change needed

**Can be initiated by:** IMPLEMENTER | AUDITOR | CLEANER

**Example:**
```json
{
  "handoff": {
    "from": "IMPLEMENTER",
    "to": "PLANNER",
    "type": "requires_replanning"
  },
  "issues": [
    {
      "severity": "critical",
      "description": "Current approach incompatible with existing multi-tier memory architecture",
      "recommendation": "Redesign handoff storage to use MultiTierStore instead of flat files"
    }
  ],
  "nextSteps": {
    "instructions": [
      "Review architectural constraint that was missed",
      "Redesign storage layer for handoffs",
      "Update implementation plan",
      "Validate with memory-specialist before proceeding"
    ]
  }
}
```

---

## Status Signals

Handoffs extend the agent status system with additional fields:

### Enhanced Status File Format

```json
{
  "agentId": "agent-implementer-001",
  "role": "IMPLEMENTER",
  "status": "active",
  "lastUpdate": "2025-12-11T14:35:00Z",
  "currentTask": "Implementing handoff manager",
  "progress": "0.75",
  "findings": [
    "Created HandoffManager class",
    "Added 15 unit tests (all passing)",
    "Test coverage at 94%"
  ],
  "handoffId": "handoff_1702311000000_a1b2c3d4",
  "nextRole": "AUDITOR",
  "waitingFor": null,
  "blockedBy": []
}
```

### New Status Fields

#### handoffId
- **Type:** string | null
- **Purpose:** Links status to active handoff
- **Value:** Current handoff ID or null if no active handoff

#### nextRole
- **Type:** "PLANNER" | "IMPLEMENTER" | "AUDITOR" | "CLEANER" | "ORCHESTRATOR" | null
- **Purpose:** Indicates expected next transition
- **Value:** Role that should receive next handoff

#### waitingFor
- **Type:** string | null
- **Purpose:** Indicates if agent is blocked
- **Values:**
  - null: Not waiting
  - "approval": Waiting for manual approval
  - "dependency": Waiting for external dependency
  - "resource": Waiting for resource availability
  - "clarification": Waiting for question to be answered

#### blockedBy
- **Type:** array of strings
- **Purpose:** Lists specific blocking issues
- **Example:** `["Firebase credentials not configured", "Awaiting PLANNER approval on architecture"]`

### Status Update Integration

Use the existing `status-update.sh` script with new fields:

```bash
# Update handoff reference
./scripts/status-update.sh agent-implementer-001 handoffId "handoff_1702311000000_a1b2c3d4"

# Set next role
./scripts/status-update.sh agent-implementer-001 nextRole "AUDITOR"

# Mark as waiting
./scripts/status-update.sh agent-implementer-001 waitingFor "approval"

# Add blocking issue (appends to blockedBy array)
./scripts/status-update.sh agent-implementer-001 blockedBy "Firebase credentials not configured"
```

---

## Integration Points

### 1. status-update.sh

**Location:** `/home/alton/Sartor-claude-network/scripts/status-update.sh`

**Purpose:** Update agent status files with handoff metadata

**Usage:**
```bash
./scripts/status-update.sh <agentId> <key> <value>
```

**Handoff-Specific Updates:**
```bash
# Start new handoff
./scripts/status-update.sh agent-impl-001 handoffId "handoff_1702311000000_a1b2c3d4"
./scripts/status-update.sh agent-impl-001 status "active"
./scripts/status-update.sh agent-impl-001 nextRole "AUDITOR"

# Complete handoff
./scripts/status-update.sh agent-impl-001 status "idle"
./scripts/status-update.sh agent-impl-001 handoffId ""
./scripts/status-update.sh agent-impl-001 nextRole ""
```

---

### 2. memory-write.sh

**Location:** `/home/alton/Sartor-claude-network/scripts/memory-write.sh`

**Purpose:** Store handoff metadata and learnings in memory system

**Usage:**
```bash
./scripts/memory-write.sh <content> <type> <importance> <tags>
```

**Handoff Memory Examples:**
```bash
# Store handoff completion
./scripts/memory-write.sh \
  "IMPLEMENTER completed handoff_1702311000000_a1b2c3d4: Implemented HandoffManager with 94% coverage in 2.5 hours" \
  "episodic" \
  "0.7" \
  '["handoff", "implementer", "success"]'

# Store pattern learned
./scripts/memory-write.sh \
  "Pattern: When implementing coordination tools, always extend existing status system rather than creating parallel tracking" \
  "procedural" \
  "0.8" \
  '["pattern", "coordination", "architecture"]'

# Store critical directive
./scripts/memory-write.sh \
  "CRITICAL: All handoffs must be archived to data/handoffs/ before marking task complete" \
  "semantic" \
  "0.9" \
  '["directive", "handoff", "archival"]'
```

---

### 3. Handoff Archive Storage

**Location:** `/home/alton/Sartor-claude-network/data/handoffs/`

**Structure:**
```
data/handoffs/
├── 2025-12-11/
│   ├── handoff_1702311000000_a1b2c3d4.json
│   ├── handoff_1702311500000_e5f6g7h8.json
│   └── chain_task_20251211_001.json
├── 2025-12-10/
│   └── ...
└── index.json
```

**Chain File Format** (links related handoffs):
```json
{
  "chainId": "chain_task_20251211_001",
  "taskId": "task_20251211_001",
  "created": "2025-12-11T14:00:00Z",
  "completed": "2025-12-11T16:30:00Z",
  "duration_minutes": 150,
  "handoffs": [
    {
      "handoffId": "handoff_1702311000000_a1b2c3d4",
      "from": "PLANNER",
      "to": "IMPLEMENTER",
      "duration_minutes": 90
    },
    {
      "handoffId": "handoff_1702311500000_e5f6g7h8",
      "from": "IMPLEMENTER",
      "to": "AUDITOR",
      "duration_minutes": 30
    },
    {
      "handoffId": "handoff_1702311800000_i9j0k1l2",
      "from": "AUDITOR",
      "to": "CLEANER",
      "duration_minutes": 15
    },
    {
      "handoffId": "handoff_1702312000000_m3n4o5p6",
      "from": "CLEANER",
      "to": "ORCHESTRATOR",
      "duration_minutes": 15
    }
  ],
  "outcome": "success",
  "metrics": {
    "total_files_modified": 8,
    "test_coverage": 0.94,
    "issues_found": 2,
    "issues_resolved": 2
  }
}
```

**Index File** (for quick lookup):
```json
{
  "last_updated": "2025-12-11T16:30:00Z",
  "total_handoffs": 247,
  "total_chains": 58,
  "by_date": {
    "2025-12-11": 12,
    "2025-12-10": 8
  },
  "by_type": {
    "ready_for_implementation": 58,
    "ready_for_audit": 58,
    "ready_for_cleanup": 58,
    "complete": 58,
    "requires_replanning": 15
  }
}
```

---

## OBSERVER Integration

The OBSERVER role monitors the handoff pipeline without interfering.

### OBSERVER Responsibilities

1. **Monitor Handoff Health**
   - Track average handoff duration
   - Identify bottlenecks (slow transitions)
   - Flag stuck handoffs (>24h in pending state)

2. **Quality Metrics**
   - Success rate by transition type
   - Issue severity trends
   - Rework frequency (requires_replanning rate)

3. **Learning Extraction**
   - Identify successful patterns
   - Detect anti-patterns
   - Recommend process improvements

### OBSERVER Access Pattern

```bash
# Read handoff archive
ls -la /home/alton/Sartor-claude-network/data/handoffs/

# Check active handoffs
grep -r "\"status\": \"pending\"" /home/alton/Sartor-claude-network/data/agent-status/

# Analyze handoff chains
cat /home/alton/Sartor-claude-network/data/handoffs/*/chain_*.json | \
  jq '.duration_minutes' | \
  awk '{sum+=$1; count++} END {print "Avg duration:", sum/count, "min"}'
```

### OBSERVER Reports

**Daily Handoff Report:**
```markdown
# Handoff Pipeline Report - 2025-12-11

## Summary
- Total handoffs: 12
- Completed chains: 3
- Active handoffs: 2
- Stuck handoffs: 0

## Performance
- Avg PLANNER→IMPLEMENTER: 85 min
- Avg IMPLEMENTER→AUDITOR: 32 min
- Avg AUDITOR→CLEANER: 18 min
- Avg CLEANER→ORCHESTRATOR: 12 min

## Issues
- 2 requires_replanning events (architecture misalignment)
- 1 high-severity issue in audit (resolved)
- 0 critical blockers

## Recommendations
- IMPLEMENTER could benefit from more detailed plans (reduce replanning)
- AUDITOR turnaround excellent (<30min avg)
- Consider automating CLEANER→ORCHESTRATOR transition
```

---

## Handoff Lifecycle

### Phase 1: Creation

**Actor:** Source role (e.g., PLANNER)

**Steps:**
1. Complete assigned work
2. Generate handoff JSON with all required fields
3. Write handoff to `data/handoffs/<date>/handoff_<id>.json`
4. Update own status with handoffId and nextRole
5. Store completion in memory system

**Shell Commands:**
```bash
# Generate unique handoff ID
HANDOFF_ID="handoff_$(date +%s%N | cut -c1-13)_$(head -c 8 /dev/urandom | xxd -p | cut -c1-8)"

# Write handoff JSON
cat > "/home/alton/Sartor-claude-network/data/handoffs/$(date +%Y-%m-%d)/${HANDOFF_ID}.json" <<EOF
{
  "handoff": { ... },
  "context": { ... },
  ...
}
EOF

# Update status
./scripts/status-update.sh agent-planner-001 handoffId "$HANDOFF_ID"
./scripts/status-update.sh agent-planner-001 nextRole "IMPLEMENTER"
./scripts/status-update.sh agent-planner-001 status "idle"

# Store in memory
./scripts/memory-write.sh \
  "PLANNER created handoff $HANDOFF_ID for Firebase activation planning" \
  "episodic" \
  "0.7" \
  '["handoff", "planner", "firebase"]'
```

---

### Phase 2: Acceptance

**Actor:** Target role (e.g., IMPLEMENTER)

**Steps:**
1. Read handoff JSON from archive
2. Validate completeness and clarity
3. Update handoff status to "accepted"
4. Update own status to reference handoffId
5. Begin work on nextSteps

**Shell Commands:**
```bash
# Read handoff
HANDOFF_FILE="/home/alton/Sartor-claude-network/data/handoffs/2025-12-11/${HANDOFF_ID}.json"
HANDOFF_DATA=$(cat "$HANDOFF_FILE")

# Update handoff status to accepted
jq '.handoff.status = "accepted"' "$HANDOFF_FILE" > "${HANDOFF_FILE}.tmp"
mv "${HANDOFF_FILE}.tmp" "$HANDOFF_FILE"

# Update own status
./scripts/status-update.sh agent-impl-001 handoffId "$HANDOFF_ID"
./scripts/status-update.sh agent-impl-001 status "active"
./scripts/status-update.sh agent-impl-001 currentTask "Implementing Firebase activation"
```

---

### Phase 3: Execution

**Actor:** Target role

**Steps:**
1. Follow instructions in nextSteps
2. Respect constraints
3. Track progress in status file
4. Log findings
5. Create deliverables

**Shell Commands:**
```bash
# Update progress
./scripts/status-update.sh agent-impl-001 progress "0.5"

# Log findings
./scripts/status-update.sh agent-impl-001 findings "Created Firebase initialization module"
./scripts/status-update.sh agent-impl-001 findings "Added connection test with <100ms validation"
```

---

### Phase 4: Completion

**Actor:** Target role

**Steps:**
1. Verify acceptanceCriteria met
2. Update handoff status to "completed"
3. Create next handoff for downstream role
4. Update own status to idle
5. Store learnings in memory

**Shell Commands:**
```bash
# Mark handoff complete
jq '.handoff.status = "completed"' "$HANDOFF_FILE" > "${HANDOFF_FILE}.tmp"
mv "${HANDOFF_FILE}.tmp" "$HANDOFF_FILE"

# Create next handoff
NEXT_HANDOFF_ID="handoff_$(date +%s%N | cut -c1-13)_$(head -c 8 /dev/urandom | xxd -p | cut -c1-8)"
# ... (create new handoff JSON for AUDITOR)

# Update status
./scripts/status-update.sh agent-impl-001 status "idle"
./scripts/status-update.sh agent-impl-001 handoffId ""

# Store learning
./scripts/memory-write.sh \
  "Successfully implemented Firebase activation in 2.5 hours with 94% test coverage" \
  "procedural" \
  "0.8" \
  '["firebase", "success", "implementation"]'
```

---

### Phase 5: Archival

**Actor:** CLEANER or ORCHESTRATOR

**Steps:**
1. Collect all handoffs in chain
2. Generate chain summary JSON
3. Archive to date-based directory
4. Update index.json
5. Store high-level learnings in memory

**Shell Commands:**
```bash
# Create chain file
CHAIN_ID="chain_task_20251211_001"
cat > "/home/alton/Sartor-claude-network/data/handoffs/2025-12-11/${CHAIN_ID}.json" <<EOF
{
  "chainId": "$CHAIN_ID",
  "taskId": "task_20251211_001",
  "handoffs": [ ... ],
  "outcome": "success",
  "metrics": { ... }
}
EOF

# Update index
jq '.total_chains += 1' /home/alton/Sartor-claude-network/data/handoffs/index.json > index.tmp
mv index.tmp /home/alton/Sartor-claude-network/data/handoffs/index.json

# Store pattern
./scripts/memory-write.sh \
  "Chain completed successfully: PLANNER(90m) → IMPLEMENTER(120m) → AUDITOR(30m) → CLEANER(15m). Total 255 min." \
  "episodic" \
  "0.8" \
  '["chain", "success", "timing"]'
```

---

## Error Handling

### Scenario 1: Incomplete Handoff

**Problem:** Handoff missing required fields

**Detection:** Target role validates on acceptance

**Resolution:**
```bash
# Reject handoff
jq '.handoff.status = "rejected"' "$HANDOFF_FILE" > "${HANDOFF_FILE}.tmp"
mv "${HANDOFF_FILE}.tmp" "$HANDOFF_FILE"

# Add rejection reason
jq '.issues += [{
  "severity": "critical",
  "description": "Handoff missing acceptanceCriteria field",
  "recommendation": "PLANNER must provide specific success criteria"
}]' "$HANDOFF_FILE" > "${HANDOFF_FILE}.tmp"
mv "${HANDOFF_FILE}.tmp" "$HANDOFF_FILE"

# Notify source role
./scripts/status-update.sh agent-planner-001 waitingFor "clarification"
./scripts/status-update.sh agent-planner-001 blockedBy "Handoff rejected by IMPLEMENTER - missing acceptance criteria"
```

---

### Scenario 2: Blocked Progress

**Problem:** Agent cannot complete work due to external dependency

**Detection:** Agent encounters blocker during execution

**Resolution:**
```bash
# Update own status
./scripts/status-update.sh agent-impl-001 waitingFor "dependency"
./scripts/status-update.sh agent-impl-001 blockedBy "Firebase service account JSON not configured"

# Update handoff
jq '.issues += [{
  "severity": "high",
  "description": "Cannot proceed without Firebase credentials",
  "recommendation": "Orchestrator must provide service-account.json or credentials"
}]' "$HANDOFF_FILE" > "${HANDOFF_FILE}.tmp"
mv "${HANDOFF_FILE}.tmp" "$HANDOFF_FILE"

# Store in memory for tracking
./scripts/memory-write.sh \
  "BLOCKED: Implementation requires Firebase credentials that are not yet configured" \
  "episodic" \
  "0.9" \
  '["blocker", "firebase", "credentials"]'
```

---

### Scenario 3: Scope Creep

**Problem:** Work expands beyond original handoff scope

**Detection:** Agent identifies additional requirements during execution

**Resolution:**
```bash
# Create escalation handoff back to PLANNER
ESCALATION_ID="handoff_$(date +%s%N | cut -c1-13)_$(head -c 8 /dev/urandom | xxd -p | cut -c1-8)"

cat > "/home/alton/Sartor-claude-network/data/handoffs/$(date +%Y-%m-%d)/${ESCALATION_ID}.json" <<EOF
{
  "handoff": {
    "from": "IMPLEMENTER",
    "to": "PLANNER",
    "type": "requires_replanning",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  },
  "issues": [
    {
      "severity": "high",
      "description": "Firebase activation requires rate-limiting layer not in original plan",
      "recommendation": "Expand scope to include RateLimiter integration or descope to basic connection only"
    }
  ],
  "nextSteps": {
    "instructions": [
      "Review current implementation progress",
      "Decide: expand scope or descope to MVP",
      "Update plan with revised scope",
      "Create new handoff with clear boundaries"
    ]
  }
}
EOF

# Pause own work
./scripts/status-update.sh agent-impl-001 status "idle"
./scripts/status-update.sh agent-impl-001 waitingFor "approval"
./scripts/status-update.sh agent-impl-001 blockedBy "Scope expansion requires PLANNER review"
```

---

## Best Practices

### 1. Handoff Creation

**DO:**
- ✅ Be specific in nextSteps.instructions (file paths, function names)
- ✅ Include realistic acceptanceCriteria with measurable outcomes
- ✅ Document all assumptions in context
- ✅ Reference relevant memories for background
- ✅ List concrete constraints (file patterns, APIs to avoid)

**DON'T:**
- ❌ Use vague instructions ("improve the code")
- ❌ Skip constraints section
- ❌ Omit issue severity levels
- ❌ Forget to update status after creating handoff
- ❌ Assume target role has context you didn't provide

### 2. Handoff Acceptance

**DO:**
- ✅ Validate handoff completeness before accepting
- ✅ Ask questions if instructions unclear
- ✅ Reject politely with specific feedback if inadequate
- ✅ Update status immediately upon acceptance
- ✅ Review referenced memories for context

**DON'T:**
- ❌ Accept incomplete handoffs
- ❌ Make assumptions about missing information
- ❌ Start work before updating status
- ❌ Ignore constraints section
- ❌ Proceed if blocked

### 3. Execution

**DO:**
- ✅ Update progress regularly (every 30-60 min)
- ✅ Log findings as you discover them
- ✅ Flag blockers immediately
- ✅ Respect constraints strictly
- ✅ Verify acceptanceCriteria before completing

**DON'T:**
- ❌ Go silent for hours with no status updates
- ❌ Violate constraints without approval
- ❌ Skip tests or validation
- ❌ Assume "good enough" without checking criteria
- ❌ Expand scope without escalation

### 4. Memory Integration

**DO:**
- ✅ Store key decisions (importance 0.8-0.9)
- ✅ Log successful patterns (importance 0.7-0.8)
- ✅ Reference relevant past handoffs
- ✅ Tag memories for easy retrieval
- ✅ Include memory IDs in handoff JSON

**DON'T:**
- ❌ Store every minor detail (noise)
- ❌ Use vague content ("worked on stuff")
- ❌ Forget to tag memories
- ❌ Skip memory creation for important learnings
- ❌ Orphan memories (no references)

---

## Examples

### Example 1: Simple Feature Implementation

**PLANNER → IMPLEMENTER**

```json
{
  "handoff": {
    "from": "PLANNER",
    "to": "IMPLEMENTER",
    "timestamp": "2025-12-11T10:00:00Z",
    "type": "ready_for_implementation",
    "status": "pending",
    "handoffId": "handoff_1702285200000_abc12345"
  },
  "context": {
    "taskId": "task_20251211_add_handoff_stats",
    "phase": "Phase 7: Infrastructure Activation",
    "scope": "Add statistics endpoint to handoff system",
    "dependencies": [
      "data/handoffs/index.json",
      "src/coordination/handoff-manager.ts"
    ]
  },
  "deliverable": {
    "type": "implementation_plan",
    "location": "plans/handoff-stats-feature.md",
    "summary": "Add getStatistics() method to HandoffManager that reads index.json and returns aggregated metrics",
    "artifacts": ["plans/handoff-stats-feature.md"]
  },
  "nextSteps": {
    "instructions": [
      "Add getStatistics() method to src/coordination/handoff-manager.ts",
      "Read data/handoffs/index.json",
      "Return object with totalHandoffs, totalChains, byDate, byType",
      "Add unit test in tests/unit/coordination/handoff-manager.test.ts",
      "Update docs/coordination-api.md with new method"
    ],
    "constraints": [
      "CANNOT modify index.json structure",
      "MUST handle missing index.json gracefully",
      "MUST return TypeScript-typed object",
      "CANNOT add new dependencies"
    ],
    "acceptanceCriteria": [
      "getStatistics() returns correct metrics",
      "Test coverage >= 85%",
      "TypeScript types correct",
      "Documentation updated"
    ]
  },
  "issues": [],
  "memory": {
    "created": ["mem_1702285200_plan001"],
    "referenced": ["mem_1702200000_handoff_design"]
  }
}
```

---

### Example 2: Audit with Issues

**IMPLEMENTER → AUDITOR**

```json
{
  "handoff": {
    "from": "IMPLEMENTER",
    "to": "AUDITOR",
    "timestamp": "2025-12-11T12:30:00Z",
    "type": "ready_for_audit",
    "status": "pending",
    "handoffId": "handoff_1702294200000_def67890"
  },
  "context": {
    "taskId": "task_20251211_add_handoff_stats",
    "phase": "Phase 7: Infrastructure Activation",
    "scope": "Statistics endpoint implementation complete",
    "dependencies": [
      "src/coordination/handoff-manager.ts",
      "tests/unit/coordination/handoff-manager.test.ts",
      "docs/coordination-api.md"
    ]
  },
  "deliverable": {
    "type": "implementation",
    "location": "src/coordination/handoff-manager.ts",
    "summary": "Added getStatistics() method with 92% test coverage",
    "artifacts": [
      "src/coordination/handoff-manager.ts",
      "tests/unit/coordination/handoff-manager.test.ts",
      "docs/coordination-api.md"
    ]
  },
  "nextSteps": {
    "instructions": [
      "Review getStatistics() implementation for bugs",
      "Verify test coverage meets 85% threshold",
      "Check error handling for missing index.json",
      "Validate TypeScript types",
      "Review documentation accuracy"
    ],
    "constraints": [
      "CANNOT modify code (only identify issues)",
      "MUST provide specific file/line references for issues",
      "MUST categorize severity correctly"
    ],
    "acceptanceCriteria": [
      "No critical or high severity bugs",
      "Test coverage >= 85%",
      "All edge cases covered",
      "Documentation accurate"
    ]
  },
  "issues": [],
  "memory": {
    "created": ["mem_1702294200_impl001"],
    "referenced": ["mem_1702285200_plan001"]
  }
}
```

**AUDITOR → CLEANER (with issues resolved)**

```json
{
  "handoff": {
    "from": "AUDITOR",
    "to": "CLEANER",
    "timestamp": "2025-12-11T13:15:00Z",
    "type": "ready_for_cleanup",
    "status": "pending",
    "handoffId": "handoff_1702296900000_ghi11121"
  },
  "context": {
    "taskId": "task_20251211_add_handoff_stats",
    "phase": "Phase 7: Infrastructure Activation",
    "scope": "Audit complete, minor issues resolved",
    "dependencies": [
      "src/coordination/handoff-manager.ts",
      "tests/unit/coordination/"
    ]
  },
  "deliverable": {
    "type": "audit_report",
    "location": "reports/audit-handoff-stats-20251211.md",
    "summary": "PASS - 92% coverage, 2 low-severity issues found and fixed",
    "artifacts": [
      "reports/audit-handoff-stats-20251211.md"
    ]
  },
  "nextSteps": {
    "instructions": [
      "Remove temporary test fixtures in tests/fixtures/temp/stats-test-data.json",
      "Clean up debug console.log statements",
      "Optimize imports (remove unused)",
      "Verify no dead code introduced"
    ],
    "constraints": [
      "CANNOT modify business logic",
      "MUST preserve test functionality",
      "CANNOT remove error handling code"
    ],
    "acceptanceCriteria": [
      "No temporary files remain",
      "No console.log in production code",
      "All imports optimized",
      "Tests still pass"
    ]
  },
  "issues": [
    {
      "severity": "low",
      "description": "Temporary test fixture file committed",
      "recommendation": "Remove tests/fixtures/temp/stats-test-data.json and add to .gitignore"
    },
    {
      "severity": "low",
      "description": "Two debug console.log statements in production code",
      "recommendation": "Remove console.log from lines 142 and 156"
    }
  ],
  "memory": {
    "created": ["mem_1702296900_audit001"],
    "referenced": ["mem_1702294200_impl001"]
  }
}
```

---

### Example 3: Escalation (Requires Replanning)

**IMPLEMENTER → PLANNER**

```json
{
  "handoff": {
    "from": "IMPLEMENTER",
    "to": "PLANNER",
    "timestamp": "2025-12-11T15:45:00Z",
    "type": "requires_replanning",
    "status": "pending",
    "handoffId": "handoff_1702305900000_jkl31415"
  },
  "context": {
    "taskId": "task_20251211_firebase_activation",
    "phase": "Phase 7: Infrastructure Activation",
    "scope": "Firebase connection implementation blocked",
    "dependencies": [
      "src/mcp/firebase-init.ts",
      "src/mcp/multi-tier-store.ts"
    ]
  },
  "deliverable": {
    "type": "implementation",
    "location": "src/mcp/firebase-init.ts",
    "summary": "Partial implementation: connection logic complete, but rate limiting issue discovered",
    "artifacts": [
      "src/mcp/firebase-init.ts",
      "docs/firebase-rate-limit-analysis.md"
    ]
  },
  "nextSteps": {
    "instructions": [
      "Review rate-limiting requirements for Firebase hot tier",
      "Decide: integrate existing RateLimiter or implement Firebase-specific throttling",
      "Update architecture to include rate limiting layer",
      "Revise implementation plan with clear integration approach"
    ],
    "constraints": [
      "MUST maintain <100ms latency requirement",
      "CANNOT exceed Firebase free tier limits",
      "MUST integrate with existing multi-expert rate limiter if possible"
    ],
    "acceptanceCriteria": [
      "Clear rate-limiting strategy defined",
      "Architecture updated with rate-limit layer",
      "Implementation plan revised",
      "No conflicts with existing RateLimiter"
    ]
  },
  "issues": [
    {
      "severity": "high",
      "description": "Firebase Realtime DB free tier limits not addressed in original plan",
      "recommendation": "Add rate-limiting layer to prevent quota exhaustion. Consider integrating src/multi-expert/rate-limiter.ts"
    },
    {
      "severity": "medium",
      "description": "Concurrent write conflicts possible without transaction support",
      "recommendation": "Review Firebase transaction API and update plan"
    }
  ],
  "memory": {
    "created": [
      "mem_1702305900_firebase_issue",
      "mem_1702305901_rate_limit_needed"
    ],
    "referenced": [
      "mem_1702285200_firebase_plan",
      "mem_1702100000_rate_limiter_design"
    ]
  }
}
```

---

## Conclusion

This coordination protocol provides a structured, observable, and auditable way for agents to hand off work. By following this protocol:

- **Clarity is maintained** through explicit JSON structure
- **Context is preserved** across role transitions
- **Issues are tracked** from discovery to resolution
- **Learning is captured** in the memory system
- **Progress is observable** via status files and archives

The protocol integrates seamlessly with existing infrastructure:
- `scripts/status-update.sh` for status management
- `scripts/memory-write.sh` for knowledge capture
- `data/handoffs/` for archival and analysis
- OBSERVER role for continuous improvement

As agents use this protocol, patterns will emerge that can be codified into automation, reducing handoff overhead while maintaining quality and traceability.

---

**Version History:**

- 1.0.0 (2025-12-11): Initial specification based on PLANNER design
