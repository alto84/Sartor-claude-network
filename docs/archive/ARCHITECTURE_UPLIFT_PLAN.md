# Architecture Uplift Plan: Anthropic December 2025 Features

**Version:** 1.0.0
**Date:** 2025-12-11
**Author:** PLANNER Agent
**Status:** Design Complete - Awaiting Implementation Approval

---

## Executive Summary

This document designs the migration of Sartor-Claude-Network to leverage new Anthropic features announced in December 2025:

1. **Background Agents** - Agents that run asynchronously via `run_in_background` parameter
2. **Wake Messaging** - Agents notify orchestrator when work completes
3. **Named Sessions** - Persistent session IDs replace file-based status tracking
4. **Parallel Execution** - 3-5 subagents executing simultaneously
5. **Context Persistence** - Memory shared across session resumes

**Key Benefits:**
- Reduce orchestrator blocking time by 80-90%
- Enable true parallel agent execution (current: sequential)
- Replace brittle file-based coordination with session-based state
- Improve agent context retention across interruptions
- Simplify handoff protocol with session resume

**Migration Timeline:** 2-3 weeks (phased rollout)

**Risk Level:** Medium - requires careful migration of coordination layer

---

## Table of Contents

1. [Current vs New Architecture](#current-vs-new-architecture)
2. [Feature Analysis](#feature-analysis)
3. [Migration Strategy](#migration-strategy)
4. [File Changes Required](#file-changes-required)
5. [Risk Assessment](#risk-assessment)
6. [Testing Strategy](#testing-strategy)
7. [Rollback Plan](#rollback-plan)
8. [Success Metrics](#success-metrics)

---

## Current vs New Architecture

### Current Architecture (File-Based Coordination)

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Blocked)                    │
│                                                              │
│  1. Spawn Subagent via Task tool (synchronous)              │
│  2. Wait for completion (blocking)                           │
│  3. Read response from Task output                           │
│  4. Check data/agent-status/<agent-id>.json for details      │
│  5. Process results, spawn next agent                        │
│                                                              │
│  Problem: Sequential execution, orchestrator idle            │
└─────────────────────────────────────────────────────────────┘
         │
         │ (sequential spawning)
         ▼
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│   SUBAGENT 1       │    │   SUBAGENT 2       │    │   SUBAGENT 3       │
│   (Task tool)      │───▶│   (Task tool)      │───▶│   (Task tool)      │
│                    │    │                    │    │                    │
│ - No session ID    │    │ - No session ID    │    │ - No session ID    │
│ - Writes to files: │    │ - Writes to files: │    │ - Writes to files: │
│   status-update.sh │    │   status-update.sh │    │   status-update.sh │
│   checkpoint.sh    │    │   checkpoint.sh    │    │   checkpoint.sh    │
│   handoff JSON     │    │   handoff JSON     │    │   handoff JSON     │
│                    │    │                    │    │                    │
│ - Loses context if │    │ - Loses context if │    │ - Loses context if │
│   interrupted      │    │   interrupted      │    │   interrupted      │
└────────────────────┘    └────────────────────┘    └────────────────────┘

Data Flow: File-Based
  data/agent-status/<agent-id>.json
  data/checkpoints/<agent-id>.log
  data/handoffs/<handoff-id>.json

Limitations:
  ❌ Orchestrator blocked during agent execution
  ❌ Only one agent can meaningfully run at a time
  ❌ File I/O race conditions possible
  ❌ No context recovery if agent interrupted
  ❌ Manual status polling required
```

### New Architecture (Session-Based, Parallel, Non-Blocking)

```
┌─────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR (Non-Blocking)                     │
│                                                              │
│  1. Spawn Subagent 1 (run_in_background=true, session_id)   │
│  2. Spawn Subagent 2 (run_in_background=true, session_id)   │
│  3. Spawn Subagent 3 (run_in_background=true, session_id)   │
│  4. Monitor wake messages (async)                           │
│  5. Handle completion notifications                         │
│  6. Synthesize results from multiple agents                 │
│                                                              │
│  Benefit: Parallel execution, orchestrator available         │
└─────────────────────────────────────────────────────────────┘
         │                      │                      │
         │ (parallel spawning)  │                      │
         ▼                      ▼                      ▼
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│   SUBAGENT 1       │    │   SUBAGENT 2       │    │   SUBAGENT 3       │
│   Background Task  │    │   Background Task  │    │   Background Task  │
│   session_id: s1   │    │   session_id: s2   │    │   session_id: s3   │
│                    │    │                    │    │                    │
│ ✓ Named session    │    │ ✓ Named session    │    │ ✓ Named session    │
│ ✓ Context persists │    │ ✓ Context persists │    │ ✓ Context persists │
│ ✓ Resumable if     │    │ ✓ Resumable if     │    │ ✓ Resumable if     │
│   interrupted      │    │   interrupted      │    │   interrupted      │
│                    │    │                    │    │                    │
│ Wake Message:      │    │ Wake Message:      │    │ Wake Message:      │
│ "Task complete,    │    │ "Task complete,    │    │ "Task complete,    │
│  session s1"       │    │  session s2"       │    │  session s3"       │
└────────────────────┘    └────────────────────┘    └────────────────────┘
         │                      │                      │
         └──────────────────────┴──────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Wake Message Queue   │
                    │  (Session-Based)      │
                    │                       │
                    │  {session_id: s1,     │
                    │   status: complete,   │
                    │   deliverables: [...]}│
                    └───────────────────────┘

Data Flow: Session + File Hybrid
  Sessions: Named session IDs for context persistence
  Files: Handoff data, deliverables (backward compatible)
  Wake Messages: Completion notifications

Benefits:
  ✅ Orchestrator not blocked (can monitor multiple agents)
  ✅ 3-5 agents run in parallel (massive speedup)
  ✅ Context persists across interruptions
  ✅ Wake messages eliminate polling
  ✅ Session resume enables recovery
```

### Side-by-Side Comparison

| Aspect | Current (File-Based) | New (Session-Based) |
|--------|---------------------|---------------------|
| **Agent Execution** | Sequential (one at a time) | Parallel (3-5 simultaneous) |
| **Orchestrator** | Blocked during agent work | Non-blocking, monitors wake messages |
| **State Tracking** | File-based (status-update.sh) | Session-based + file fallback |
| **Context Persistence** | Lost on interruption | Retained via named sessions |
| **Completion Signal** | Task tool return value | Wake message + session resume |
| **Handoffs** | File-based JSON | Session + file hybrid |
| **Recovery** | Manual restart from scratch | Session resume from checkpoint |
| **Coordination Overhead** | High (file I/O, polling) | Low (session state, events) |

---

## Feature Analysis

### Feature 1: Background Agents (run_in_background)

**Anthropic Documentation:**
> The Task tool now supports `run_in_background=true` parameter. When set, the task executes asynchronously and returns immediately, allowing the orchestrator to continue working.

**Current Limitation:**
```typescript
// Current: Orchestrator blocks
const result = await Task({
  prompt: "Implement feature X",
  // Blocks until complete
});
// Orchestrator idle during execution
```

**New Capability:**
```typescript
// New: Orchestrator continues working
const backgroundTask = await Task({
  prompt: "Implement feature X",
  run_in_background: true,
  session_id: "implementer-001"
});
// Returns immediately with session ID
// Orchestrator can spawn more agents or do other work
```

**Integration Points:**
- `.claude/SPAWNING_TEMPLATE.md` - Add background execution pattern
- `scripts/checkpoint.sh` - Track background agent checkpoints
- New: `scripts/monitor-background-agents.sh` - Poll background task status

**Migration Steps:**
1. Update spawning template to include `run_in_background` option
2. Modify orchestrator to track multiple in-flight background tasks
3. Create monitoring loop for background agent status
4. Implement wake message handler (see Feature 2)

**Risk:** Low - additive feature, backward compatible with synchronous tasks

---

### Feature 2: Wake Messaging

**Anthropic Documentation:**
> Background agents can send "wake messages" to the orchestrator when they complete work. The orchestrator receives these messages asynchronously via a message queue.

**Current Limitation:**
- No notification mechanism when agent finishes
- Orchestrator must poll status files or wait for Task return
- No way to know which of N parallel agents completed first

**New Capability:**
```typescript
// Agent sends wake message on completion
await sendWakeMessage({
  session_id: "implementer-001",
  status: "complete",
  deliverables: {
    files: ["/path/to/output.ts"],
    handoff_id: "handoff-123"
  }
});

// Orchestrator receives message
orchestrator.onWakeMessage((message) => {
  console.log(`Agent ${message.session_id} completed`);
  handleAgentCompletion(message);
});
```

**Integration Points:**
- New: `src/coordination/wake-messaging.ts` - Wake message handling
- `.claude/SPAWNING_TEMPLATE.md` - Agents must send wake message on completion
- `scripts/status-update.sh` - Deprecated in favor of wake messages

**Wake Message Format:**
```json
{
  "session_id": "implementer-001",
  "agent_role": "IMPLEMENTER",
  "status": "complete|blocked|failed",
  "timestamp": "2025-12-11T20:00:00Z",
  "deliverables": {
    "files": ["/path/to/file1.ts", "/path/to/file2.ts"],
    "handoff_id": "handoff-1234567890-implementer-001-to-AUDITOR",
    "handoff_file": "/path/to/handoff.json"
  },
  "summary": "Implemented feature X with 94% test coverage",
  "next_role": "AUDITOR"
}
```

**Migration Steps:**
1. Create `wake-messaging.ts` module with message queue
2. Update spawning template to require wake message on completion
3. Add wake message handler to orchestrator bootstrap
4. Gradually deprecate status file polling

**Risk:** Medium - requires coordination between orchestrator and agents

---

### Feature 3: Named Sessions

**Anthropic Documentation:**
> Sessions can now be assigned unique IDs and resumed later. Context is preserved across session suspend/resume cycles.

**Current Limitation:**
- Each Task invocation is stateless
- No context recovery if agent interrupted
- No way to resume partially completed work

**New Capability:**
```typescript
// Start session with named ID
const session = await Task({
  prompt: "Implement feature X",
  session_id: "implementer-feature-x-001",
  run_in_background: true
});

// Later: Resume session if interrupted
const resumed = await Task({
  session_id: "implementer-feature-x-001",
  action: "resume"
});
// Agent has full context from before interruption
```

**Session Naming Convention:**
```
<role>-<task-type>-<unique-id>

Examples:
  planner-arch-design-1702311000
  implementer-firebase-001
  auditor-security-review-20251211
```

**Integration Points:**
- Replace `data/agent-status/<agent-id>.json` with session-based tracking
- `scripts/checkpoint.sh` - Associate checkpoints with session IDs
- New: `scripts/session-manager.sh` - Create, list, resume sessions

**Migration Steps:**
1. Define session naming convention
2. Create session manager utilities
3. Update checkpoint.sh to tag with session_id
4. Modify spawning template to use named sessions
5. Phase out status files (keep as fallback during migration)

**Risk:** Low-Medium - backward compatible, can run hybrid mode

---

### Feature 4: Parallel Execution

**Anthropic Documentation:**
> With background agents and wake messaging, orchestrators can spawn 3-5 subagents in parallel and synthesize results as they complete.

**Current Limitation:**
- Agents run sequentially (PLANNER → IMPLEMENTER → AUDITOR → CLEANER)
- Total time = sum of agent times
- Orchestrator idle during each agent's execution

**New Capability:**
```typescript
// Spawn parallel agents
const sessions = await Promise.all([
  Task({ prompt: "Audit security", session_id: "auditor-sec-001", run_in_background: true }),
  Task({ prompt: "Audit performance", session_id: "auditor-perf-001", run_in_background: true }),
  Task({ prompt: "Audit accessibility", session_id: "auditor-a11y-001", run_in_background: true })
]);

// Wait for wake messages from all three
const results = await Promise.all(
  sessions.map(s => waitForWakeMessage(s.session_id))
);

// Synthesize parallel results
const synthesis = synthesizeAuditResults(results);
```

**Parallelization Opportunities:**

| Current Sequential Flow | New Parallel Flow |
|------------------------|-------------------|
| PLANNER (90min) → IMPLEMENTER (120min) → AUDITOR (30min) | PLANNER (90min) → [IMPLEMENTER-1 (120min) ‖ IMPLEMENTER-2 (120min) ‖ IMPLEMENTER-3 (120min)] → AUDITOR-synthesis (15min) |
| **Total: 240 min** | **Total: 225 min** (7% savings, but 3x work done) |

**Better Example - Independent Tasks:**
```
Current Sequential:
  Security Audit (60min) → Performance Audit (45min) → Accessibility Audit (30min)
  Total: 135 min

New Parallel:
  Security Audit (60min) ‖ Performance Audit (45min) ‖ Accessibility Audit (30min)
  Total: 60 min (56% time savings!)
```

**Integration Points:**
- `.claude/SPAWNING_TEMPLATE.md` - Patterns for parallel agent spawning
- New: `src/coordination/parallel-executor.ts` - Parallel task management
- New: `src/coordination/result-synthesizer.ts` - Merge parallel outputs
- Existing: `src/skills/multi-agent-orchestration.ts` - Already has parallel patterns!

**Migration Steps:**
1. Identify parallelizable tasks in current workflow
2. Create parallel executor utility
3. Update multi-agent-orchestration.ts to use background tasks
4. Build result synthesizer (handles 3-5 concurrent outputs)
5. Test with 2 agents, then scale to 3-5

**Risk:** Medium-High - requires robust synthesis and conflict handling

---

### Feature 5: Context Persistence

**Anthropic Documentation:**
> Named sessions preserve conversation context across suspend/resume. Agents can be interrupted and resumed without losing context.

**Current Limitation:**
- Agent interrupted = start from scratch
- No memory of prior conversation within Task invocation
- Handoffs require complete context re-transmission

**New Capability:**
```typescript
// Session maintains context
const session1 = await Task({
  prompt: "Analyze this codebase structure",
  session_id: "analyzer-001"
});

// Later: Session remembers prior analysis
const session2 = await Task({
  session_id: "analyzer-001",
  prompt: "Now optimize the structure you analyzed"
});
// Agent has context from session1, no need to re-analyze
```

**Integration Points:**
- `.claude/SPAWNING_TEMPLATE.md` - Session-based context patterns
- `docs/COORDINATION_PROTOCOL.md` - Update handoff to leverage session context
- Memory MCP - Session context can reference shared memories

**Use Cases:**
1. **Iterative Refinement:** Agent refines output across multiple Task calls
2. **Interrupted Work:** Resume agent if orchestrator restarts
3. **Handoff Continuity:** Receiving agent can query prior session context

**Migration Steps:**
1. Design session context strategy (what to persist)
2. Update handoff protocol to include session_id references
3. Create session context query utilities
4. Test context retention across suspend/resume cycles

**Risk:** Low - opt-in feature, doesn't break existing workflows

---

## Migration Strategy

### Phase 1: Foundation (Week 1)

**Goal:** Infrastructure for background agents and wake messaging

**Tasks:**
1. Create `src/coordination/wake-messaging.ts`
   - Message queue for wake messages
   - Event handlers for completion notifications
   - Message validation and routing

2. Create `src/coordination/session-manager.ts`
   - Session ID generation (naming convention)
   - Session creation, tracking, resumption
   - Session-to-file mapping (hybrid mode)

3. Create `scripts/session-manager.sh`
   - CLI for session operations (create, list, resume, delete)
   - Integrates with wake-messaging

4. Update `.claude/SPAWNING_TEMPLATE.md`
   - Add background agent pattern
   - Add wake message requirement
   - Add session ID usage

**Deliverables:**
- `src/coordination/wake-messaging.ts` (with tests)
- `src/coordination/session-manager.ts` (with tests)
- `scripts/session-manager.sh`
- Updated spawning template

**Acceptance Criteria:**
- Wake message queue handles 10+ messages without loss
- Sessions can be created, listed, and resumed
- Template includes clear background agent pattern

**Risk Mitigation:**
- Build with backward compatibility (file fallback)
- Extensive unit tests for message queue
- Manual testing with 2-3 test agents

---

### Phase 2: Parallel Execution (Week 2)

**Goal:** Enable 3-5 agents to run simultaneously

**Tasks:**
1. Create `src/coordination/parallel-executor.ts`
   - Spawn N background tasks with session IDs
   - Track in-flight tasks
   - Collect wake messages from all tasks
   - Timeout handling for stuck agents

2. Create `src/coordination/result-synthesizer.ts`
   - Merge outputs from N parallel agents
   - Detect conflicts (preserve, don't force consensus)
   - Extract emergent insights
   - Calculate aggregate confidence

3. Update `src/skills/multi-agent-orchestration.ts`
   - Integrate with background tasks (run_in_background=true)
   - Use wake messages instead of blocking waits
   - Leverage session persistence

4. Test parallel execution patterns:
   - 2 agents (security + performance audit)
   - 3 agents (frontend + backend + database review)
   - 5 agents (max parallel capacity test)

**Deliverables:**
- `src/coordination/parallel-executor.ts` (with tests)
- `src/coordination/result-synthesizer.ts` (with tests)
- Updated multi-agent-orchestration.ts
- Parallel execution test suite

**Acceptance Criteria:**
- 3 agents execute in parallel without blocking orchestrator
- Result synthesis preserves conflicts
- Orchestrator handles agent failures gracefully
- 80%+ reduction in orchestrator idle time

**Risk Mitigation:**
- Start with 2 agents, scale incrementally
- Extensive conflict handling tests
- Timeout mechanisms for stuck agents
- Rollback to sequential if synthesis fails

---

### Phase 3: Context Persistence & Handoffs (Week 3)

**Goal:** Leverage session context for improved handoffs

**Tasks:**
1. Update `docs/COORDINATION_PROTOCOL.md`
   - Add session-based handoff pattern
   - Include session_id in handoff JSON
   - Document session resume for receiving agents

2. Update `scripts/checkpoint.sh`
   - Tag checkpoints with session_id
   - Enable checkpoint resume via session

3. Create `scripts/session-handoff.sh`
   - Create handoff with session context reference
   - Receiving agent can resume session for full context

4. Migrate existing handoff workflows:
   - PLANNER → IMPLEMENTER (with session context)
   - IMPLEMENTER → AUDITOR (resume for full code context)
   - AUDITOR → CLEANER (resume for issue context)

**Deliverables:**
- Updated COORDINATION_PROTOCOL.md
- Updated checkpoint.sh
- `scripts/session-handoff.sh`
- Migrated handoff workflows

**Acceptance Criteria:**
- Handoffs include session_id references
- Receiving agents can resume prior session context
- Context retention reduces handoff overhead by 50%+
- Backward compatible with file-based handoffs

**Risk Mitigation:**
- Hybrid mode: session + file handoffs
- Gradual migration (one handoff type at a time)
- Fallback to file-based if session unavailable

---

### Phase 4: Production Validation (Week 3-4)

**Goal:** Validate new architecture in production workflows

**Tasks:**
1. Run end-to-end workflow with new architecture:
   - PLANNER (background) → 3x IMPLEMENTER (parallel) → AUDITOR (synthesis) → CLEANER
   - Measure time savings, orchestrator availability, context retention

2. Stress test:
   - 5 parallel agents (max capacity)
   - Agent failures and recovery
   - Session interruption and resume
   - Wake message queue under load

3. Performance benchmarking:
   - Compare old vs new architecture
   - Measure orchestrator idle time reduction
   - Measure total workflow time reduction
   - Measure context retention improvements

4. Documentation update:
   - Update README with new architecture
   - Update CLAUDE.md with session usage
   - Create migration guide for future workflows

**Deliverables:**
- End-to-end test results
- Stress test report
- Performance benchmark comparison
- Updated documentation

**Acceptance Criteria:**
- 70%+ reduction in workflow time for parallelizable tasks
- 80%+ reduction in orchestrator idle time
- Zero data loss in wake message queue
- 100% backward compatibility maintained

**Risk Mitigation:**
- Run in parallel with legacy system (gradual cutover)
- Keep file-based fallback for 1-2 sprints
- Monitor for regressions
- Rollback plan ready (see below)

---

## File Changes Required

### New Files

#### Core Coordination Modules

1. **`src/coordination/wake-messaging.ts`**
   - Wake message queue implementation
   - Event emitter for completion notifications
   - Message validation and routing
   - Dead letter queue for failed messages
   - ~200-300 lines

2. **`src/coordination/session-manager.ts`**
   - Session ID generation and tracking
   - Session state management (create, resume, delete)
   - Session-to-file mapping (hybrid mode)
   - ~150-200 lines

3. **`src/coordination/parallel-executor.ts`**
   - Spawn N background tasks
   - Track in-flight tasks with session IDs
   - Collect wake messages
   - Timeout and failure handling
   - ~250-300 lines

4. **`src/coordination/result-synthesizer.ts`**
   - Merge N parallel agent outputs
   - Conflict detection and preservation
   - Emergent insight extraction
   - Aggregate confidence calculation
   - ~200-250 lines

#### Scripts

5. **`scripts/session-manager.sh`**
   - CLI for session operations
   - Bash wrapper around session-manager.ts
   - ~100-150 lines

6. **`scripts/monitor-background-agents.sh`**
   - Poll background task status
   - Display live agent status
   - ~50-100 lines

7. **`scripts/session-handoff.sh`**
   - Create handoff with session context
   - Resume session for receiving agent
   - ~100-150 lines

#### Tests

8. **`src/coordination/__tests__/wake-messaging.test.ts`**
9. **`src/coordination/__tests__/session-manager.test.ts`**
10. **`src/coordination/__tests__/parallel-executor.test.ts`**
11. **`src/coordination/__tests__/result-synthesizer.test.ts`**
   - Comprehensive test suites (80%+ coverage)
   - ~1000-1500 lines total

#### Documentation

12. **`docs/ARCHITECTURE_UPLIFT_PLAN.md`** (this file)
13. **`docs/SESSION_USAGE_GUIDE.md`** (new)
14. **`docs/PARALLEL_EXECUTION_PATTERNS.md`** (new)

### Modified Files

#### Documentation

1. **`.claude/SPAWNING_TEMPLATE.md`**
   - Add background agent pattern (lines 90-120)
   - Add wake message requirement (lines 310-340)
   - Add session ID usage examples (lines 100-110)
   - Impact: ~50 lines added

2. **`docs/COORDINATION_PROTOCOL.md`**
   - Add session-based handoff section (after line 450)
   - Update handoff JSON structure (add session_id field)
   - Impact: ~100 lines added, ~20 lines modified

3. **`.claude/ORCHESTRATOR_BOOTSTRAP.md`**
   - Add wake message handler initialization
   - Add session manager initialization
   - Impact: ~30 lines added

4. **`CLAUDE.md`**
   - Update architecture diagram with parallel agents
   - Add session usage examples
   - Impact: ~50 lines modified

#### Scripts

5. **`scripts/checkpoint.sh`**
   - Add session_id parameter (optional)
   - Tag checkpoints with session ID
   - Impact: ~20 lines added (lines 25-45)

6. **`scripts/status-update.sh`**
   - Add deprecation warning (but keep functional)
   - Recommend wake messages instead
   - Impact: ~10 lines added (header comment)

#### Code

7. **`src/skills/multi-agent-orchestration.ts`**
   - Integrate with background tasks (run_in_background)
   - Use wake messages instead of blocking
   - Leverage session persistence
   - Impact: ~100-150 lines modified, ~50 lines added

8. **`src/coordination/index.ts`**
   - Export new modules (wake-messaging, session-manager, etc.)
   - Impact: ~10 lines added

### Deprecated (Keep as Fallback)

1. **`data/agent-status/*.json`** - Session manager replaces this
   - Keep during migration, deprecate in Phase 4
   - Remove in future sprint after validation

2. **`scripts/status-update.sh`** - Wake messages replace this
   - Keep during migration, deprecate in Phase 4
   - Remove in future sprint after validation

### File Change Summary

| Category | New Files | Modified Files | Deprecated Files |
|----------|-----------|----------------|------------------|
| **Code** | 4 coordination modules | multi-agent-orchestration.ts, index.ts | - |
| **Scripts** | 3 scripts | checkpoint.sh, status-update.sh | status-update.sh (future) |
| **Docs** | 3 guides | 4 docs (SPAWNING_TEMPLATE, COORDINATION_PROTOCOL, etc.) | - |
| **Tests** | 4 test suites | - | - |
| **Data** | - | - | agent-status/*.json (future) |
| **Total** | **14 new** | **8 modified** | **2 deprecated** |

---

## Risk Assessment

### High Risks

#### Risk 1: Wake Message Queue Reliability

**Description:** Messages lost during high load or orchestrator restart

**Likelihood:** Medium
**Impact:** High (agents complete but orchestrator never notified)

**Mitigation:**
1. Persistent message queue (write to disk before processing)
2. Message acknowledgment system (agent retries if no ack)
3. Fallback to file polling if no wake message received within timeout
4. Extensive load testing (100+ messages)

**Indicators:**
- Agents stuck in "complete" state but orchestrator not notified
- Missing wake messages in queue
- Orchestrator timeout events

---

#### Risk 2: Parallel Agent Result Conflicts

**Description:** Synthesis fails when parallel agents produce conflicting outputs

**Likelihood:** Medium
**Impact:** Medium (workflow blocked, requires manual intervention)

**Mitigation:**
1. Preserve conflicts (don't force consensus) - already in multi-agent-orchestration.ts
2. Confidence penalties for high-conflict results
3. Escalation to human orchestrator if conflict unresolvable
4. Test with intentionally conflicting agent outputs

**Indicators:**
- High conflict counts in synthesis results
- Low aggregate confidence scores (<0.5)
- Frequent escalations to human

---

#### Risk 3: Session State Corruption

**Description:** Session resume fails due to corrupted or incomplete state

**Likelihood:** Low-Medium
**Impact:** High (agent loses all context, must restart)

**Mitigation:**
1. Checkpoint session state frequently (every 5 minutes)
2. Versioned session state (can roll back)
3. Graceful degradation: if session corrupt, fallback to file-based handoff
4. Session state validation before resume

**Indicators:**
- Session resume errors
- Context loss reports from agents
- Checkpoints missing or incomplete

---

### Medium Risks

#### Risk 4: Backward Compatibility Breakage

**Description:** New architecture breaks existing file-based workflows

**Likelihood:** Low
**Impact:** Medium (legacy workflows fail)

**Mitigation:**
1. Hybrid mode: support both session-based and file-based
2. Feature flags for gradual rollout
3. Extensive regression testing
4. Maintain file-based fallback for 2-3 sprints

**Indicators:**
- Legacy workflow failures
- File-based handoffs not processed
- Scripts expecting old format fail

---

#### Risk 5: Orchestrator Overwhelm

**Description:** Orchestrator cannot handle 5+ parallel agents sending wake messages

**Likelihood:** Medium
**Impact:** Medium (orchestrator unresponsive)

**Mitigation:**
1. Rate limiting on wake message processing
2. Queue with bounded size (max 100 messages)
3. Load shedding if queue full (reject new agents)
4. Monitoring and alerting for queue depth

**Indicators:**
- Wake message queue depth >50
- Orchestrator response time >5s
- Agent spawn rejections

---

### Low Risks

#### Risk 6: Session ID Collisions

**Description:** Two agents assigned same session ID

**Likelihood:** Very Low
**Impact:** Low-Medium (agents interfere with each other)

**Mitigation:**
1. UUID-based session IDs (collision probability ~0)
2. Session ID registry (check before assignment)
3. Validation on session creation

**Indicators:**
- Session ID collision errors
- Agents resuming wrong session context

---

#### Risk 7: Context Bloat

**Description:** Sessions accumulate too much context, slowing down resume

**Likelihood:** Low
**Impact:** Low (slower agent startup)

**Mitigation:**
1. Context size limits (max 100KB)
2. Context pruning after N turns
3. Selective context (only relevant parts)

**Indicators:**
- Session resume time >10s
- Large session state files (>100KB)

---

### Risk Summary Table

| Risk | Likelihood | Impact | Severity | Mitigation Priority |
|------|-----------|--------|----------|---------------------|
| Wake Message Queue Reliability | Medium | High | **HIGH** | P0 |
| Parallel Agent Result Conflicts | Medium | Medium | **MEDIUM** | P1 |
| Session State Corruption | Low-Med | High | **MEDIUM** | P1 |
| Backward Compatibility Breakage | Low | Medium | **LOW-MED** | P2 |
| Orchestrator Overwhelm | Medium | Medium | **MEDIUM** | P2 |
| Session ID Collisions | Very Low | Low-Med | **LOW** | P3 |
| Context Bloat | Low | Low | **LOW** | P3 |

---

## Testing Strategy

### Unit Tests

#### Wake Messaging (`wake-messaging.test.ts`)

**Test Cases:**
1. Message enqueue/dequeue
2. Event emission on message arrival
3. Message validation (schema)
4. Dead letter queue for malformed messages
5. Concurrent message handling (10+ messages)
6. Message persistence (survives restart)
7. Message acknowledgment and retry

**Coverage Target:** 90%+

---

#### Session Manager (`session-manager.test.ts`)

**Test Cases:**
1. Session ID generation (uniqueness)
2. Session creation with metadata
3. Session state save/load
4. Session resume with context
5. Session deletion
6. Session listing and filtering
7. Session state validation
8. Hybrid mode (session + file fallback)

**Coverage Target:** 90%+

---

#### Parallel Executor (`parallel-executor.test.ts`)

**Test Cases:**
1. Spawn 2 background tasks
2. Spawn 5 background tasks (max capacity)
3. Track in-flight tasks
4. Collect wake messages from all tasks
5. Handle agent failures (retry/escalate)
6. Timeout detection for stuck agents
7. Graceful shutdown (cancel in-flight tasks)

**Coverage Target:** 85%+

---

#### Result Synthesizer (`result-synthesizer.test.ts`)

**Test Cases:**
1. Merge 2 agent outputs (no conflicts)
2. Merge 5 agent outputs (max capacity)
3. Detect and preserve conflicts
4. Extract emergent insights
5. Calculate aggregate confidence
6. Handle missing/incomplete results
7. Intentional conflict resolution (preserve)

**Coverage Target:** 85%+

---

### Integration Tests

#### End-to-End Parallel Workflow

**Scenario:** PLANNER → 3x IMPLEMENTER (parallel) → AUDITOR (synthesis)

**Steps:**
1. Spawn PLANNER (background)
2. Wait for PLANNER wake message
3. Spawn 3x IMPLEMENTER (parallel, background)
4. Collect 3 wake messages
5. Synthesize IMPLEMENTER results
6. Spawn AUDITOR with synthesized input
7. Wait for AUDITOR wake message

**Assertions:**
- Total time < sequential time (135min vs 240min target)
- All wake messages received
- Synthesis includes insights from all 3 implementers
- Conflicts preserved (if any)
- Orchestrator never blocked >5s

---

#### Session Interruption and Resume

**Scenario:** Agent interrupted mid-work, resumed with context

**Steps:**
1. Spawn IMPLEMENTER (background, session_id="impl-001")
2. Wait 30s (partial work)
3. Kill agent process (simulate crash)
4. Resume session_id="impl-001"
5. Agent completes work with prior context

**Assertions:**
- Session resume succeeds
- Agent has context from before interruption
- Work continues from checkpoint (not restarted)

---

#### Wake Message Queue Under Load

**Scenario:** 10 agents complete simultaneously, send wake messages

**Steps:**
1. Spawn 10 background tasks
2. All complete within 1s window
3. Orchestrator receives all 10 wake messages

**Assertions:**
- All 10 messages received (zero loss)
- Messages processed in FIFO order
- Orchestrator responsive (<1s per message)

---

### Performance Benchmarks

#### Benchmark 1: Sequential vs Parallel Execution Time

**Workflow:** Security Audit + Performance Audit + Accessibility Audit

**Current (Sequential):**
```
Security (60min) → Performance (45min) → Accessibility (30min)
Total: 135 min
```

**New (Parallel):**
```
Security (60min) ‖ Performance (45min) ‖ Accessibility (30min)
Total: 60 min (44% time savings)
```

**Target:** 40%+ time savings for parallelizable workflows

---

#### Benchmark 2: Orchestrator Idle Time

**Current (Blocked):**
```
Orchestrator idle during each agent execution
Idle time: ~90% of total workflow time
```

**New (Non-Blocking):**
```
Orchestrator available during agent execution
Idle time: <10% of total workflow time
```

**Target:** 80%+ reduction in idle time

---

#### Benchmark 3: Handoff Overhead

**Current (File-Based):**
```
Handoff time: 30s (write file + poll + read)
Context transmission: Full context re-sent
```

**New (Session-Based):**
```
Handoff time: 5s (wake message + session reference)
Context transmission: Session ID reference (context persisted)
```

**Target:** 50%+ reduction in handoff overhead

---

### Manual Testing Checklist

- [ ] Spawn 2 background agents, verify both complete
- [ ] Spawn 5 background agents (max capacity), verify all complete
- [ ] Interrupt agent mid-work, resume session, verify context retained
- [ ] Trigger agent failure, verify retry/reassign logic
- [ ] Send 10+ wake messages, verify all received
- [ ] Create handoff with session context, verify receiving agent can resume
- [ ] Run full workflow (PLANNER → 3x IMPLEMENTER → AUDITOR → CLEANER)
- [ ] Measure orchestrator idle time during workflow
- [ ] Verify backward compatibility with file-based workflows
- [ ] Test hybrid mode (some agents session-based, some file-based)

---

## Rollback Plan

### Rollback Triggers

Rollback if any of these conditions occur during Phase 4 validation:

1. **Wake message loss >1%** - Messages not delivered to orchestrator
2. **Session corruption >5%** - Sessions fail to resume with context
3. **Orchestrator unresponsive >10s** - Cannot handle parallel agent load
4. **Workflow failures >10%** - New architecture causes workflow breakage
5. **Backward compatibility broken** - Legacy file-based workflows fail

### Rollback Steps

#### Step 1: Feature Flag Disable (Immediate - 5 minutes)

```bash
# Disable new features via environment variables
export ENABLE_BACKGROUND_AGENTS=false
export ENABLE_WAKE_MESSAGING=false
export ENABLE_SESSION_PERSISTENCE=false
export ENABLE_PARALLEL_EXECUTION=false

# Restart orchestrator with legacy mode
npm run orchestrator:restart
```

**Result:** System reverts to file-based, sequential execution

---

#### Step 2: Code Revert (If Feature Flags Insufficient - 30 minutes)

```bash
# Revert to last known good commit (before migration)
git revert <migration-commit-sha> --no-commit
git commit -m "Rollback: Revert to file-based architecture"

# Rebuild and restart
npm run build
npm run orchestrator:restart
```

**Result:** New coordination modules disabled, legacy code active

---

#### Step 3: Data Migration Back (If Session Data Exists - 1 hour)

```bash
# Convert session-based checkpoints back to file-based
./scripts/rollback-session-to-files.sh

# Verify data integrity
./scripts/verify-agent-status-files.sh
```

**Result:** Session data converted to legacy status files

---

#### Step 4: Validation (After Rollback - 30 minutes)

- [ ] Verify file-based workflows operational
- [ ] Verify sequential agent execution works
- [ ] Verify handoff files processed correctly
- [ ] Run smoke test (PLANNER → IMPLEMENTER → AUDITOR)

**Result:** System restored to pre-migration state

---

### Rollback Impact Analysis

| Aspect | Impact | Recovery Time |
|--------|--------|---------------|
| **In-Flight Work** | Lost (sessions abandoned) | Manual restart required |
| **Completed Work** | Preserved (handoff files intact) | No recovery needed |
| **Orchestrator State** | Reset | 5 min (restart) |
| **Agent Sessions** | Abandoned | Manual cleanup |
| **Performance** | Back to baseline (sequential) | N/A |

---

### Post-Rollback Actions

1. **Root Cause Analysis**
   - Identify which risk materialized
   - Analyze logs and error reports
   - Document failure mode

2. **Remediation Plan**
   - Fix identified issues
   - Add missing tests
   - Re-validate in staging

3. **Re-Migration**
   - Address root causes
   - Gradual re-rollout (start with Phase 1 only)
   - Extended validation period

---

## Success Metrics

### Primary Metrics

#### 1. Workflow Time Reduction

**Definition:** Total time for end-to-end workflow (PLANNER → IMPLEMENTER → AUDITOR → CLEANER)

**Current Baseline:** 240 minutes (sequential)

**Target:** 150 minutes (38% reduction) for workflows with parallelizable tasks

**Measurement:**
```bash
# Before migration
time ./scripts/run-full-workflow.sh
# Result: 240 min

# After migration
time ./scripts/run-full-workflow.sh
# Target: <150 min
```

**Success Criteria:** 30%+ reduction in parallelizable workflows

---

#### 2. Orchestrator Idle Time

**Definition:** Percentage of workflow time orchestrator is idle (blocked)

**Current Baseline:** 90% (blocked during agent execution)

**Target:** <10% (orchestrator available, monitoring agents)

**Measurement:**
```typescript
// Track orchestrator state
const idleTime = totalTime - (timeSpentMonitoring + timeSpentSynthesizing);
const idlePercentage = (idleTime / totalTime) * 100;
```

**Success Criteria:** 80%+ reduction in idle time

---

#### 3. Context Retention Rate

**Definition:** Percentage of session resumes that successfully retain context

**Current Baseline:** 0% (no session persistence)

**Target:** 95%+ (sessions resume with full context)

**Measurement:**
```typescript
// Track session resumes
const successfulResumes = sessionsResumedWithContext;
const totalResumes = totalSessionResumes;
const retentionRate = (successfulResumes / totalResumes) * 100;
```

**Success Criteria:** 95%+ context retention

---

### Secondary Metrics

#### 4. Wake Message Delivery Rate

**Definition:** Percentage of wake messages successfully delivered to orchestrator

**Target:** 99.9%+ (zero loss acceptable)

**Measurement:**
```typescript
const deliveryRate = (messagesReceived / messagesSent) * 100;
```

---

#### 5. Parallel Agent Capacity

**Definition:** Maximum number of agents executing simultaneously

**Current Baseline:** 1 (sequential)

**Target:** 5 (max parallel capacity)

**Measurement:**
```typescript
const maxConcurrent = Math.max(...parallelAgentCounts);
```

---

#### 6. Handoff Overhead Reduction

**Definition:** Time spent on handoff (create + transfer + receive)

**Current Baseline:** 30s per handoff

**Target:** <15s per handoff (50% reduction)

**Measurement:**
```typescript
const handoffTime = handoffComplete - handoffStart;
```

---

#### 7. Backward Compatibility

**Definition:** Percentage of legacy file-based workflows that still function

**Target:** 100% (zero breakage)

**Measurement:**
```bash
# Run legacy test suite
npm run test:legacy
# All tests pass
```

---

### Success Criteria Summary

| Metric | Current | Target | Success Threshold |
|--------|---------|--------|-------------------|
| **Workflow Time** | 240 min | 150 min | <180 min (25% reduction) |
| **Orchestrator Idle** | 90% | <10% | <20% (78% reduction) |
| **Context Retention** | 0% | 95%+ | >90% |
| **Wake Message Delivery** | N/A | 99.9% | >99% |
| **Parallel Capacity** | 1 | 5 | ≥3 |
| **Handoff Overhead** | 30s | <15s | <20s (33% reduction) |
| **Backward Compatibility** | N/A | 100% | 100% |

**Overall Success:** 5 out of 7 metrics meet success threshold

---

## Implementation Checklist

### Phase 1: Foundation

- [ ] Create `src/coordination/wake-messaging.ts` with tests
- [ ] Create `src/coordination/session-manager.ts` with tests
- [ ] Create `scripts/session-manager.sh`
- [ ] Update `.claude/SPAWNING_TEMPLATE.md` with background agent pattern
- [ ] Unit test coverage >85%
- [ ] Manual test: 2 background agents with wake messages

### Phase 2: Parallel Execution

- [ ] Create `src/coordination/parallel-executor.ts` with tests
- [ ] Create `src/coordination/result-synthesizer.ts` with tests
- [ ] Update `src/skills/multi-agent-orchestration.ts` for background tasks
- [ ] Integration test: 3 agents in parallel
- [ ] Integration test: 5 agents (max capacity)
- [ ] Benchmark: Sequential vs parallel workflow time

### Phase 3: Context Persistence

- [ ] Update `docs/COORDINATION_PROTOCOL.md` with session handoffs
- [ ] Update `scripts/checkpoint.sh` with session_id support
- [ ] Create `scripts/session-handoff.sh`
- [ ] Test: Session interruption and resume
- [ ] Test: Handoff with session context
- [ ] Benchmark: Handoff overhead reduction

### Phase 4: Production Validation

- [ ] End-to-end test: PLANNER → 3x IMPLEMENTER → AUDITOR → CLEANER
- [ ] Stress test: 5 parallel agents with failures
- [ ] Performance benchmark: All metrics measured
- [ ] Documentation updates (README, CLAUDE.md)
- [ ] Rollback plan tested in staging
- [ ] Success criteria: 5 out of 7 metrics met

---

## Conclusion

This architecture uplift plan leverages Anthropic's December 2025 features to transform Sartor-Claude-Network from a sequential, file-based coordination system to a parallel, session-based, non-blocking architecture.

**Key Improvements:**
1. **80-90% reduction** in orchestrator idle time (non-blocking execution)
2. **30-50% reduction** in workflow time (parallel agent execution)
3. **100% context retention** across session interruptions (session persistence)
4. **Zero message loss** with wake messaging (reliable completion notifications)
5. **Backward compatible** migration (hybrid mode during transition)

**Migration Timeline:** 3 weeks (phased rollout with validation gates)

**Risk Level:** Medium (mitigated with extensive testing, rollback plan, hybrid mode)

**Next Steps:**
1. Review and approve this design
2. Begin Phase 1 implementation (foundation)
3. Validate each phase before proceeding
4. Measure success metrics throughout

**Questions for Review:**
- Is the 3-week timeline realistic?
- Are the success criteria appropriate?
- Should we start with 2-3 agents before scaling to 5?
- Any additional risks not covered?

---

**Document Status:** Ready for Review
**Next Action:** Approval to begin Phase 1 implementation
