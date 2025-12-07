# MASTER_PLAN: Refinement-First Claude Agent Architecture

**EDIT POLICY: Only Executive Claude edits full plan. Agents edit only their assigned section.**

**Last Updated:** 2025-12-06
**Status:** Active Implementation Roadmap
**Timeline:** 6-10 weeks total
**Current Phase:** Phase 3 (In Progress)

---

## Executive Summary

This roadmap consolidates evidence-based principles, multi-agent infrastructure, and refinement-first architecture. Every component is designed around iterative improvement through process supervision, self-auditing, and continuous learning.

**Core Philosophy:**
- Refinement loops are the architecture, not a feature
- Quality gates before capability gates
- Process supervision over outcome supervision
- Self-auditing in every skill
- Code-first actions (30% efficiency gain)
- Test-time adaptation (25% performance gain)
- Evidence-based validation for all decisions

**Critical Path:** Phase 0 → Phase 1 → Phase 2 → Phase 3 → **Phase 3.5** → Phase 4 → Phase 5

---

## Phase 0: Bootstrap Quality Infrastructure

<!-- AGENT:executive-claude CAN EDIT -->

**Status:** ✅ COMPLETED
**Duration:** 1-2 days

### Deliverables Completed
- [ ] Claude Code Hooks (`pre-commit.sh`, `pre-push.sh`, `session-start.sh`)
- [ ] Test Infrastructure (`tests/unit`, `tests/integration`, `tests/e2e`)
- [ ] Quality Standards (`.claude/QUALITY_STANDARDS.md`)

**Achievement:** Foundation for quality-first development established.

---

## Phase 1: Foundation Skills

<!-- AGENT:executive-claude CAN EDIT -->

**Status:** ✅ COMPLETED
**Duration:** 3-5 days

### Deliverables Completed
- [ ] Evidence-Based Validation Skill (`.claude/skills/evidence-based-validation/skill.md`)
- [ ] Evidence-Based Engineering Skill (`.claude/skills/evidence-based-engineering/skill.md`)
- [ ] Skill Testing Framework (`tests/helpers/skill-tester.js`)

**Validation:** Foundation skills validate all future work. 85%+ test coverage.

**Achievement:** All subsequent work validated against documented evidence.

---

## Phase 2: Infrastructure Skills

<!-- AGENT:executive-claude CAN EDIT -->

**Status:** ✅ COMPLETED
**Duration:** 5-7 days

### Deliverables Completed
- [ ] Agent Communication System (`.claude/skills/agent-communication-system/skill.md`)
- [ ] Multi-Agent Orchestration (`.claude/skills/multi-agent-orchestration/skill.md`)
- [ ] Integration Test Suite (`tests/integration/skills-composition.test.js`)

**Quality Gates:** 99.9%+ message delivery. Single orchestrator pattern. 85%+ test coverage.

**Achievement:** Multi-agent infrastructure operational and proven reliable.

---

## Phase 3: Application Skills

<!-- AGENT:executive-claude CAN EDIT -->

**Status:** IN PROGRESS
**Duration:** 5-7 days (parallel tracks)

### Track A: MCP Server Development Skill
**Owner:** TBD
**File:** `.claude/skills/mcp-server-dev/skill.md`
- [ ] Generate MCP server boilerplate
- [ ] Implement MCP protocol
- [ ] Create tool definitions
- [ ] 85%+ test coverage

### Track B: Safety Research Workflow Skill
**Owner:** TBD
**File:** `.claude/skills/safety-research/skill.md`
- [ ] Design safety test scenarios
- [ ] Execute safety experiments
- [ ] Generate safety reports
- [ ] 85%+ test coverage

### Track C: Distributed Systems Debugging Skill
**Owner:** TBD
**File:** `.claude/skills/distributed-debugging/skill.md`
- [ ] Correlate logs across agents
- [ ] Trace requests through system
- [ ] Generate debugging reports
- [ ] 85%+ test coverage

**Exit Criteria:** All tracks complete. Integration test orchestrates all 7 skills.

---

## Phase 3.5: Refinement Core (CRITICAL PRIORITY)

<!-- AGENT:refinement-specialist CAN EDIT -->

**Status:** NOT STARTED
**Duration:** 1-2 weeks
**Priority:** CRITICAL - Foundation for Phase 4-5

### Deliverable 1: Core Refinement Loop
**File:** `src/refinement/core-loop.js`
- [ ] Execute with process supervision
- [ ] Self-audit results
- [ ] Evaluate against success criteria
- [ ] Extract improvement signals
- [ ] Refine and retry (max 3 iterations)
- [ ] Store process traces

**Expected Gain:** 40-60% error reduction

### Deliverable 2: Process Supervision Engine
**File:** `src/refinement/process-supervisor.js`
- [ ] Monitor each execution step
- [ ] Capture intermediate states
- [ ] Detect early failure signals
- [ ] Provide real-time feedback

### Deliverable 3: Self-Auditing Framework
**File:** `src/refinement/self-audit.js`
- [ ] Correctness checks
- [ ] Efficiency validation (code actions preferred)
- [ ] Safety verification
- [ ] Evidence alignment
- [ ] Root cause analysis

**Expected Detection Rate:** 85%+ pre-commit error detection

### Deliverable 4: Test-Time Adaptation
**File:** `src/refinement/test-time-adapter.js`
- [ ] Retrieve similar past tasks
- [ ] Extract successful patterns
- [ ] Optimize iterations, timeout, strategy
- [ ] Tune parameters per task

**Expected Gain:** 25% performance improvement

### Deliverable 5: Code-First Action Engine
**File:** `src/refinement/code-actions.js`
- [ ] Prefer code actions over CLI (Grep, Read, Edit, Write, Glob, not grep/cat/sed)
- [ ] Direct file manipulation
- [ ] Batch operations
- [ ] Efficiency measurement

**Expected Gain:** 30% step reduction vs. CLI baseline

### Deliverable 6: Retrofit All Skills with Self-Auditing
- [ ] Evidence-Based Validation (self-audit)
- [ ] Evidence-Based Engineering (self-audit)
- [ ] Agent Communication System (self-audit)
- [ ] Multi-Agent Orchestration (self-audit)
- [ ] MCP Server Development (self-audit)
- [ ] Safety Research Workflow (self-audit)
- [ ] Distributed Systems Debugging (self-audit)

### Deliverable 7: Process Trace Storage
**File:** `src/refinement/process-tracer.js`
- [ ] Capture complete execution traces
- [ ] Store per-step state and feedback
- [ ] Enable learning from failures
- [ ] Support replay and analysis

**Storage Tiers:** Hot (active), Warm (30 days), Cold (extracted patterns)

**Exit Criteria:**
- [ ] Refinement loop executes and refines failing tasks
- [ ] Process supervision catches errors mid-execution
- [ ] Self-auditing detects 85%+ of errors before commit
- [ ] Test-time adaptation shows 25% performance gain
- [ ] Code actions achieve 30% step reduction
- [ ] All skills retrofitted with self-auditing
- [ ] Process traces stored and retrievable
- [ ] All tests pass (85%+ coverage)

---

## Phase 4: Memory System with Refinement State

<!-- AGENT:memory-specialist CAN EDIT -->

**Status:** IN PROGRESS
**Duration:** 2-3 weeks
**Dependency:** Phase 3.5 complete

### Week 1: Hot Tier (Firebase Realtime)
- [ ] Store active refinement loop states
- [ ] <100ms latency for state operations
- [ ] Real-time synchronization
- [ ] Automatic TTL cleanup

### Week 2: Warm Tier (Firestore + Vector DB)
- [ ] Store complete process traces
- [ ] Semantic search over traces
- [ ] <500ms latency for queries
- [ ] Automatic archival from hot tier

### Week 3: Cold Tier (GitHub)
- [ ] Extract and version successful patterns
- [ ] Store as executable templates
- [ ] <2s latency for knowledge retrieval
- [ ] Automatic synchronization

**Exit Criteria:** Data flows Hot → Warm → Cold. All latencies met. 85%+ test coverage.

---

## Phase 5: Integration and Self-Improving Feedback Loop

<!-- AGENT:executive-claude CAN EDIT -->

**Status:** NOT STARTED
**Duration:** 1-2 weeks
**Dependency:** Phase 4 complete

### Week 1: Unified Integration
- [ ] Refinement-Powered Executive Claude (uses memory + refinement loops)
- [ ] Self-Improving Feedback Loop (identify → propose → validate → implement)
- [ ] Continuous Learning Pipeline (extract patterns → generalize → validate → store)

### Week 2: Production Readiness
- [ ] End-to-end refinement system tests
- [ ] Performance benchmarks verified
- [ ] Production documentation complete
- [ ] System demonstrates self-improvement

**Exit Criteria:** Self-improvement loop functional. Performance benchmarks met. All tests passing.

---

## Success Metrics

**Quality:** 85%+ test coverage. 40-60% error reduction. 85%+ pre-commit detection.
**Performance:** <20% refinement overhead. 30% code action efficiency. 25% adaptation gain.
**Process:** 90%+ refinement success rate. <1 hour self-improvement cycle.

---

## Risk Management

| Phase | Risk | Mitigation |
|-------|------|-----------|
| 3.5 | Refinement adds latency | Benchmark <20% overhead. Max 3 iterations. |
| 3.5 | Self-audit too strict | Evidence-based criteria. Override mechanism. |
| 4 | Memory queries slow refinement | Aggressive caching. Async queries. Index optimization. |
| 5 | Self-improvement causes regressions | Tests required. Validation. Automatic rollback. |

---

## Adaptation Guidelines

**Never Compromise:**
1. Process supervision over outcome supervision
2. Self-auditing in every skill
3. Evidence-based improvements
4. Code actions over CLI
5. Test-time adaptation

**Always Maintain:**
1. Refinement loop as core architecture
2. Process traces for learning
3. Self-improvement safety gates
4. Memory-driven adaptation

---

## References

- Anthropic: Building Effective Agents (research/)
- Process Supervision Research
- Test-Time Adaptation Mechanisms
- Code-First Action Patterns

**Next Priority:** Complete Phase 3. Begin Phase 3.5 (Refinement Core).

