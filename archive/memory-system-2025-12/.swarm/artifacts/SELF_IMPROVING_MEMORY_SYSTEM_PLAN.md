# Self-Improving Research System Plan

## Objective
Build a self-improving research system using subagents and background tasks to get the Sartor memory system fully operational.

---

## Current State Assessment

### Memory System Status (75% Complete)

| Component | Status | Blocker |
|-----------|--------|---------|
| File-based storage | WORKING | None |
| MCP Server (stdio/HTTP) | WORKING | None |
| Validation system | WORKING | None |
| Bootstrap system | WORKING | None |
| Firebase Hot Tier | IMPLEMENTED | Needs credentials |
| Firestore | IMPLEMENTED | Needs credentials |
| GitHub Cold Tier | MISSING | Implementation needed |
| Multi-tier promotion | IMPLEMENTED | Needs cloud tiers active |

### Coordinator Status (64% Success Rate)

- Binary failure pattern: agents either succeed quickly or timeout completely
- No health checks, streaming, or progress monitoring
- Fixed timeouts waste resources on failed agents

---

## Self-Improving System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Light Agent)                    │
│  - Reads mission state from STATE.json                          │
│  - Spawns research/implementation waves                         │
│  - Synthesizes results, updates state                           │
│  - NEVER does heavy work directly                               │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  RESEARCH WAVE  │ │ IMPLEMENT WAVE  │ │ VALIDATE WAVE   │
│                 │ │                 │ │                 │
│ - Explore gaps  │ │ - Build missing │ │ - Run tests     │
│ - Find patterns │ │   components    │ │ - Benchmark     │
│ - Document      │ │ - Fix issues    │ │ - Verify claims │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MEMORY SYSTEM                               │
│  Episodic: Session logs, agent outputs, experiment results      │
│  Semantic: Proven patterns, validated fixes, stable config      │
│  Working: Active tasks, current hypotheses, temp state          │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    IMPROVEMENT LOOP                              │
│  1. Measure baseline (tests, benchmarks)                        │
│  2. Generate hypotheses (from research wave)                    │
│  3. Implement single change (implement wave)                    │
│  4. Validate improvement (validate wave)                        │
│  5. Accept/reject based on evidence                             │
│  6. Store learnings in semantic memory                          │
│  7. Loop                                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Coordinator Hardening (Priority: Critical)

**Goal**: Increase agent success rate from 64% to 90%+

### 1.1 Health Check System
```
Spawn subagent → 10-second health probe → If fail, abort early
                                        → If pass, proceed to main task
```

**Implementation Tasks** (delegate to IMPLEMENTER agents):
- [ ] Add health check to coordinator/local-only.js
- [ ] Create lightweight probe that tests bash/read/write
- [ ] Implement early abort on health failure
- [ ] Log health check results for analysis

**Expected Impact**: 92% reduction in wasted timeout on failed agents

### 1.2 Streaming Output with Heartbeat
```
Agent running → Stream output every 15s → No output for 90s → Kill as stuck
```

**Implementation Tasks**:
- [ ] Add streaming output collection to coordinator
- [ ] Implement heartbeat monitoring (15-second intervals)
- [ ] Create stuck detection (90-second silence threshold)
- [ ] Add progress markers for agents to emit

**Expected Impact**: 25% faster stuck detection + real-time visibility

### 1.3 Progressive Timeout
```
Start with 60s → Agent shows activity → Extend to 120s → Still active → Extend to 180s (max 240s)
```

**Implementation Tasks**:
- [ ] Replace fixed timeout with progressive system
- [ ] Track activity bursts to trigger extensions
- [ ] Cap maximum timeout at 240 seconds
- [ ] Log timeout decisions for analysis

**Expected Impact**: 40% reduction in timeout waste

---

## Phase 2: Memory System Completion (Priority: High)

**Goal**: Get all three tiers operational

### 2.1 Firebase Hot Tier Activation

**Research Tasks** (delegate to RESEARCH agents):
- [ ] Document minimal Firebase setup steps
- [ ] Create credential validation script
- [ ] Test Firestore as alternative (often auto-enabled)

**Implementation Tasks**:
- [ ] Create setup wizard script (interactive credential entry)
- [ ] Add fallback chain: Firebase RTDB → Firestore → File
- [ ] Implement automatic backend selection based on availability

### 2.2 GitHub Cold Tier Implementation

**Current Gap**: `cold-tier.ts` referenced but missing

**Implementation Tasks**:
- [ ] Implement GitHubColdTier class
- [ ] Add memory archival logic (age-based promotion to cold)
- [ ] Create retrieval mechanism with caching
- [ ] Test with real GitHub repo

**Interface Required**:
```typescript
interface ColdTier {
  archive(memories: Memory[]): Promise<void>;
  retrieve(query: MemoryQuery): Promise<Memory[]>;
  list(options: ListOptions): Promise<MemoryMetadata[]>;
}
```

### 2.3 Multi-Tier Synchronization

**Implementation Tasks**:
- [ ] Implement promotion rules (hot → warm based on access frequency)
- [ ] Implement demotion rules (warm → cold based on age + importance)
- [ ] Add background sync job (runs every N minutes)
- [ ] Create consolidation for similar memories

---

## Phase 3: Bootstrap Enhancement (Priority: Medium)

**Goal**: Agents start with optimal context for their role

### 3.1 Role-Specific Context Injection

**Roles to Define**:
| Role | Focus | Memory Topics | Constraints |
|------|-------|---------------|-------------|
| RESEARCHER | Discovery | All topics | Read-only, cite sources |
| IMPLEMENTER | Building | Implementation patterns | Must test changes |
| VALIDATOR | Quality | Test results, benchmarks | No score fabrication |
| ORCHESTRATOR | Coordination | Mission state | Delegate, don't execute |

### 3.2 Smart Memory Summarization

**Implementation Tasks**:
- [ ] Rank memories by role relevance
- [ ] Separate proven facts from hypotheses
- [ ] Extract known gaps explicitly
- [ ] Build dependency chains

### 3.3 Mission State Injection

**State Fields**:
```json
{
  "phase": "research|implementation|validation",
  "deadline": "ISO-8601",
  "progress_percent": 0-100,
  "urgency": "low|medium|high|critical",
  "restrictions": ["no_new_agents_after_deadline", "no_major_changes"]
}
```

---

## Phase 4: Validation Loop (Priority: Medium)

**Goal**: Ensure improvements are real, not fabricated

### 4.1 Baseline Measurement

**Metrics to Track**:
- Agent success rate (currently 64%)
- Memory operation latency (hot/warm/cold)
- Test pass rate
- Benchmark scores

### 4.2 A/B Testing Framework

**Process**:
1. Run baseline tests → Store results
2. Make single change
3. Run identical tests → Store results
4. Compare statistically
5. Accept only if: improvement ≥2 tests AND zero regressions

### 4.3 Conservative Acceptance

**Rules**:
- No score fabrication (all metrics from actual measurement)
- Single change per cycle (enables causal attribution)
- Rollback on any regression
- Store decision rationale in semantic memory

---

## Phase 5: Self-Improvement Loop (Priority: Future)

**Goal**: System improves itself autonomously

### 5.1 Hypothesis Generation

**Sources**:
- Failed test analysis
- Timeout pattern detection
- Memory query analysis (what's asked for but missing?)
- Agent feedback logs

### 5.2 Automated Experimentation

```
Loop:
  1. Generate hypothesis from failure patterns
  2. Spawn IMPLEMENTER to create fix
  3. Spawn VALIDATOR to test fix
  4. If improved: merge, store learning
  5. If regression: rollback, store anti-pattern
  6. Update mission state
  7. Continue until deadline or no more hypotheses
```

### 5.3 Meta-Learning

**Track**:
- Which modification types succeed (additions vs removals vs rewordings)
- Which agent configurations work best
- Optimal timeout durations per task type
- Memory access patterns

---

## Execution Strategy

### Wave-Based Parallelism

```
Wave 1: Research (3 parallel agents)
  - Agent A: Explore coordinator patterns
  - Agent B: Explore memory gaps
  - Agent C: Explore bootstrap needs

Wait for Wave 1 completion

Wave 2: Implement (3 parallel agents)
  - Agent A: Health check system
  - Agent B: Cold tier implementation
  - Agent C: Role-specific bootstrap

Wait for Wave 2 completion

Wave 3: Validate (2 parallel agents)
  - Agent A: Run test suite
  - Agent B: Run benchmarks

Synthesize results → Update STATE.json → Loop
```

### Background Task Usage

**Use Coordinator (background) for**:
- Long-running test suites
- Benchmark runs
- Multi-file implementations
- Parallel research waves

**Use Task tool (foreground) for**:
- Quick analysis (<10 min)
- Single file reads
- Status checks
- Result synthesis

---

## Success Criteria

### Phase 1 (Coordinator Hardening)
- [ ] Agent success rate ≥90% (measured, not estimated)
- [ ] Average wasted timeout <30 seconds (currently ~110s)
- [ ] Health check catches 95% of initialization failures

### Phase 2 (Memory Completion)
- [ ] All three tiers responding (hot/warm/cold)
- [ ] Multi-tier queries return results <800ms (p95)
- [ ] Automatic promotion/demotion working

### Phase 3 (Bootstrap Enhancement)
- [ ] Role-specific context reduces irrelevant token usage by 40%
- [ ] Agents receive mission-appropriate memory summaries
- [ ] Anti-fabrication protocols injected into all agents

### Phase 4 (Validation Loop)
- [ ] Baseline metrics established and tracked
- [ ] A/B test framework operational
- [ ] Zero fabricated scores in any output

### Phase 5 (Self-Improvement)
- [ ] System can generate hypotheses from failures
- [ ] At least one successful self-directed improvement
- [ ] Meta-learning data being collected

---

## Immediate Next Actions

1. **Create coordinator health check** (spawn IMPLEMENTER)
2. **Document Firebase setup** (spawn RESEARCHER)
3. **Implement cold-tier.ts** (spawn IMPLEMENTER)
4. **Run baseline benchmarks** (spawn VALIDATOR via coordinator)

---

## Anti-Patterns to Avoid

1. **Fabricating progress**: All percentages must come from measurement
2. **Skipping validation**: Every change must be tested
3. **Parallel changes**: One change per improvement cycle
4. **Optimistic estimates**: Use measured data or say "unknown"
5. **Direct execution**: Orchestrator delegates, never implements

---

**Document Version**: 1.0.0
**Created**: 2025-12-16
**Status**: Plan ready for execution
