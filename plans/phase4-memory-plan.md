# Phase 4: Memory System with Refinement State - Brief Plan

**Duration:** 2-3 weeks
**Status:** NOT STARTED
**Priority:** Critical - Enables test-time adaptation and learning loops

## What Needs to Be Built

1. **Hot Tier (Week 1):** In-memory refinement state storage
   - Store active refinement loop states with <100ms latency
   - Track iterations, feedback, and process metrics
   - Support state recovery after failures
   - Automatic TTL cleanup (1 hour)

2. **Warm Tier (Week 2):** Process trace storage with semantic search
   - Archive successful traces from hot tier
   - Index by task type, skill, outcome
   - Enable semantic search for pattern matching (<500ms)
   - Extract learning signals automatically

3. **Cold Tier (Week 3):** Versioned pattern library
   - Extract successful patterns from warm tier
   - Store as executable templates in GitHub
   - Track effectiveness metrics (success rate, usage count)
   - Enable pattern reuse across tasks

4. **Cross-Tier Integration:** Unified memory interface
   - Data flow: Hot → Warm → Cold
   - Connect to test-time adapter for adaptation
   - Connect to process supervisor for learning
   - Enable pattern retrieval before task execution

## Key Files to Create

```
src/memory/
├── hot-tier/
│   ├── refinement-state.js
│   ├── iteration-tracker.js
│   └── state-recovery.js
├── warm-tier/
│   ├── process-traces.js
│   ├── semantic-search.js
│   └── learning-extractor.js
├── cold-tier/
│   ├── pattern-library.js
│   └── pattern-matcher.js
└── cross-tier/
    └── refinement-memory.js
```

## Dependencies on Existing Skills

- **Phase 3.5 Refinement Core:** Must exist before memory integration
  - Process supervisor generates traces
  - Test-time adapter consumes patterns
  - Self-auditor creates feedback for storage

- **Evidence-Based Validation:** Patterns validated against research
- **Multi-Agent Orchestration:** Memory serves orchestrator

## Risks and Mitigations

**Risk 1: Memory queries slow down refinement loops**

- _Mitigation:_ Aggressive caching layer, async queries don't block execution, index optimization, load testing

**Risk 2: Pattern extraction creates noise (false positives)**

- _Mitigation:_ Minimum success thresholds (80%+ rate, 5+ occurrences), evidence validation required, manual review for high-impact patterns

**Risk 3: Process traces consume excessive storage**

- _Mitigation:_ Aggressive hot tier TTL (1 hour), compress warm tier data, extract only significant patterns to cold tier, monitor usage

## Success Criteria

- Hot tier: <100ms latency, concurrent support, automatic recovery
- Warm tier: <500ms semantic search, pattern extraction successful
- Cold tier: Patterns in GitHub, effectiveness tracked
- Integration: Test-time adapter uses patterns, pre-task latency <500ms
- All tests: 85%+ coverage

**Total Lines of Code:** ~2000 (estimated)
