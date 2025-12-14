---
name: Distributed Systems Debugging
description: Guides debugging of distributed systems including consensus failures, message ordering issues, state synchronization bugs, network partitions, and cascading failures. Use when debugging multi-agent systems, investigating coordination issues, analyzing distributed traces, or resolving distributed state conflicts.
allowed-tools: Read, Grep, Glob, Bash, memory_create, memory_get, memory_search, memory_stats
---

# Distributed Systems Debugging

This skill provides systematic approaches to debugging distributed systems, multi-agent coordination, consensus mechanisms, and distributed state management based on real debugging experiences from SKG Agent Prototype 2 development.

## Overview

Distributed systems debugging is fundamentally different from debugging single-process applications due to:

- **Partial failures**: Some components fail while others continue
- **Non-determinism**: Same inputs can produce different outputs due to timing
- **Lack of global state**: No single source of truth
- **Complex causality**: Events across nodes have intricate causal relationships
- **Emergent behaviors**: System-level issues not present in individual components

This skill helps you systematically investigate these challenges using evidence-based debugging techniques extracted from actual distributed system development.

## Memory MCP Integration

This skill integrates with the Memory MCP server to persist debugging patterns, resolution strategies, and learnings across sessions. All debugging sessions should store findings in memory for future reference.

### Memory Usage for Debugging

**Store debugging patterns found:**

```typescript
// When you identify a failure pattern
memory_create({
  content: JSON.stringify({
    pattern: 'consensus-timeout',
    symptom: 'Timeouts at 300+ agents',
    rootCause: 'O(n²) message broadcast',
    location: 'src/coordination/plan-sync.ts',
    detectionMethod: 'Message count growth analysis',
  }),
  type: 'procedural',
  importance: 0.9,
  tags: ['consensus', 'performance', 'pattern'],
});
```

**Store resolution strategies:**

```typescript
// When you successfully resolve an issue
memory_create({
  content: JSON.stringify({
    issue: 'State divergence after partition',
    resolution: 'Added vector clock reconciliation',
    files: ['src/coordination/plan-sync.ts'],
    testAdded: 'cross-surface-validation.test.ts',
    recoveryTime: '<2s',
  }),
  type: 'procedural',
  importance: 0.95,
  tags: ['state-sync', 'resolution', 'partition-recovery'],
});
```

**Cross-reference with coordination code:**

```typescript
// Link debugging sessions to specific modules
memory_create({
  content: JSON.stringify({
    module: 'work-distribution.ts',
    debugSession: '2024-12-11-task-claim-race',
    finding: 'Optimistic locking allows double claims',
    fix: 'Added version check before claim',
    relatedFiles: ['src/coordination/work-distribution.ts', '__tests__/work-distribution.test.ts'],
  }),
  type: 'episodic',
  importance: 0.8,
  tags: ['work-distribution', 'race-condition', 'coordination'],
});
```

**Search for similar past issues:**

```typescript
// Before debugging, check if similar issue was seen
memory_search({
  type: 'procedural',
  min_importance: 0.7,
  limit: 5,
});
// Parse results to find relevant patterns and resolutions
```

### Memory-Driven Debugging Workflow

1. **Before Starting**: Search memory for similar symptoms
   - `memory_search({ tags: ["consensus", "timeout"] })`
   - Review past resolutions and patterns

2. **During Investigation**: Store hypotheses and findings
   - Record each hypothesis tested
   - Document evidence collected
   - Note which coordination modules involved

3. **After Resolution**: Persist complete debugging session
   - Store failure pattern identified
   - Record resolution strategy
   - Link to coordination code files
   - Tag with relevant keywords

4. **Periodic Review**: Check debugging session effectiveness
   - `memory_stats()` to see pattern accumulation
   - Review high-importance procedural memories
   - Update tags for better discoverability

### Integration with Sartor Coordination System

The Memory MCP system enables tracking debugging sessions across the coordination modules:

- **plan-sync.ts**: CRDT-based plan synchronization issues
- **work-distribution.ts**: Task assignment and locking problems
- **progress.ts**: Multi-agent progress tracking bugs

When debugging coordination issues, always cross-reference with stored memories and update the knowledge base with new findings.

## Core Debugging Methodology

### 1. Observe (Gather Evidence)

**Don't make assumptions. Collect actual data first.**

- **Collect logs from all nodes** - Not just the failing one
- **Capture distributed traces** - Reconstruct causal chains
- **Gather metrics** - CPU, memory, network, latency, throughput
- **Record message flows** - Who sent what to whom, when
- **Document symptoms** - What actually happens vs. what should happen
- **Check timestamps** - Clock skew can hide or create issues

**Example from SKG:**

```bash
# Consensus test framework collects comprehensive metrics
# From run-consensus-tests.ts
- Consensus time per proposal
- Byzantine failure detection rate
- Network partition recovery time
- Safety/liveness violations
- Per-agent performance metrics
```

### 2. Hypothesize (Form Theories)

Based on evidence, form testable hypotheses about root causes.

**Common hypothesis patterns:**

- **Message ordering**: "Messages arrive out of order causing state divergence"
- **Network partition**: "Two groups of nodes can't communicate, creating split-brain"
- **Byzantine behavior**: "Malicious/faulty node sending conflicting messages"
- **Race condition**: "Timing-dependent behavior when operations interleave"
- **Deadlock**: "Circular dependency preventing progress"
- **Resource exhaustion**: "Memory/connections/threads depleted under load"

**From SKG consensus tests:**

- Silent failures detected through absence of expected votes
- Vote manipulation detected by comparing expected vs actual consensus
- Partition recovery measured by time to re-establish quorum

### 3. Test (Validate Hypotheses)

Design experiments to confirm or reject hypotheses.

**Techniques:**

- **Isolate components**: Test each node/service independently
- **Inject failures**: Deliberately create suspected conditions
- **Replay scenarios**: Use captured traces to reproduce issues
- **Vary timing**: Add delays to expose race conditions
- **Reduce scale**: Test with 2-3 nodes before full deployment
- **Controlled chaos**: Systematic fault injection (from SKG fault-monitor-demo.ts)

**Example fault injection from SKG:**

```typescript
// From ConsensusIntegration.test.ts
enum ByzantineFailureType {
  SILENT_FAILURE, // Node stops responding
  VOTE_MANIPULATION, // Sends incorrect votes
  DOUBLE_VOTING, // Votes multiple times
  CONFLICTING_PROPOSALS, // Sends different proposals to different nodes
  TRUST_SCORE_MANIPULATION, // Lies about trust scores
  FALSE_CONSENSUS_CLAIMS, // Claims consensus when none exists
}
```

### 4. Verify (Confirm Root Cause)

Once you believe you've found the issue:

- **Reproduce reliably**: Can you trigger it consistently?
- **Fix and validate**: Does the fix eliminate the symptom?
- **Regression test**: Create test to prevent recurrence
- **Document**: Capture what failed, why, and how to detect it
- **Store in Memory**: Persist the complete debugging session for future reference

**Memory Storage Example:**

```typescript
memory_create({
  content: JSON.stringify({
    timestamp: '2024-12-11T10:30:00Z',
    symptom: 'Consensus never reached with 5+ agents',
    investigation: [
      'Checked quorum size: OK',
      'Analyzed message delivery: Found missing ACKs',
      'Traced vote collection: Byzantine agent sending conflicting votes',
    ],
    rootCause: 'Silent Byzantine failure in vote manipulation',
    fix: 'Added vote validation and conflict detection',
    filesModified: ['src/coordination/plan-sync.ts'],
    testsAdded: ['cross-surface-validation.test.ts:45-78'],
    verificationMethod: 'Consensus success rate: 10% → 99.9%',
  }),
  type: 'episodic',
  importance: 0.95,
  tags: ['consensus', 'byzantine', 'debugging-session', 'plan-sync'],
});
```

## Common Distributed System Failure Patterns

See `reference/failure-patterns.md` for detailed catalog extracted from SKG development.

### Quick Reference

**Consensus Failures:**

- Split-brain: Multiple leaders elected simultaneously
- Starvation: Some proposals never reach consensus
- Livelock: System keeps changing state without progress
- Byzantine corruption: Malicious nodes corrupt consensus

**Message Ordering Issues:**

- Causal ordering violations: Effect arrives before cause
- Total ordering violations: Nodes see different message orders
- Message loss: Network drops messages silently
- Message duplication: Same message processed multiple times

**State Synchronization:**

- Divergent state: Nodes have different values for same key
- Dirty reads: Reading uncommitted/inconsistent state
- Lost updates: Concurrent updates overwrite each other
- State corruption: Invalid state due to failed partial updates

**Network Partitions:**

- Split-brain: Partitioned groups both claim authority
- Slow recovery: Long time to detect and heal partition
- Cascading failures: Partition triggers overload in remaining nodes

**Performance Degradation:**

- Latency spikes: Sudden increase in response time
- Throughput collapse: System can't handle normal load
- Resource exhaustion: Memory leaks, connection pool depletion
- Backpressure failures: Slow consumers overwhelm fast producers

## Debugging Tools and Techniques

### Log Analysis

**Structured logging is essential:**

```typescript
// From SKG metrics-initialization.ts
logger.info('Consensus reached', {
  entryId: entry.id,
  consensusTime: duration,
  approvalRate: approveCount / totalVotes,
  byzantineAgentsDetected: byzantineDetections,
  timestamp: Date.now(),
});
```

**Key log analysis patterns:**

- Correlation IDs: Track single request across services
- Vector clocks: Establish causal relationships
- Structured fields: Enable filtering and aggregation
- Log levels: Use appropriately (debug, info, warn, error)

See `reference/logging-patterns.md` for detailed examples.

### Distributed Tracing

**Reconstruct causal chains:**

- Trace IDs propagate through system
- Spans represent operations with timing
- Tags provide context (node ID, operation type)
- Baggage carries state across boundaries

See `scripts/trace-analyzer.py` for analysis tools.

### Metrics Collection

**Essential metrics from SKG:**

```typescript
// From metrics-initialization.ts
interface Metrics {
  // Latency metrics
  agentToAgent: number; // Agent communication latency
  taskAssignment: number; // Task assignment latency
  consensusTime: number; // Time to reach consensus

  // Throughput metrics
  messagesPerSecond: number;
  tasksPerSecond: number;

  // Resource metrics
  memoryPerAgent: number;
  cpuUtilization: number;

  // Error metrics
  errorRate: number;
  byzantineDetections: number;
  timeoutRate: number;
}
```

See `reference/monitoring-strategies.md` for comprehensive patterns.

### Testing Strategies

**From SKG test suite:**

**Unit tests**: Test individual components in isolation
**Integration tests**: Test component interactions
**Consensus tests**: Verify agreement under failures
**Scalability tests**: Measure performance at scale (10 to 10,000 agents)
**Chaos tests**: Inject failures systematically

See `reference/testing-strategies.md` for detailed approaches.

## Systematic Debugging Process

Use `templates/debugging-checklist.md` for step-by-step guidance.

### Initial Investigation

1. **Search Memory for Similar Issues**

   ```typescript
   // Check if this symptom has been seen before
   const pastIssues = await memory_search({
     type: 'episodic',
     min_importance: 0.7,
     limit: 10,
   });
   // Review for matching symptoms and resolutions
   ```

2. **Define the symptom precisely**
   - What is observed vs. expected?
   - Is it consistent or intermittent?
   - Does it affect all nodes or subset?

3. **Gather evidence**
   - Logs from all involved nodes
   - Metrics before/during/after issue
   - Network traces if available
   - Recent changes to code/config
   - Check coordination module state (plan-sync, work-distribution, progress)

4. **Identify the failure domain**
   - Single node, multiple nodes, or all?
   - Specific operation or general?
   - Related to load/timing or always?
   - Which coordination module affected?

### Root Cause Analysis

Use `scripts/debug-distributed-system.py` to automate common analyses:

```bash
# Analyze logs for consensus issues
python scripts/debug-distributed-system.py \
  --logs ./logs/*.log \
  --check consensus \
  --check message-ordering \
  --check state-sync \
  --report ./debug-report.md
```

**Manual analysis techniques:**

1. **Timeline reconstruction**: Order all events across nodes by timestamp
2. **State diffing**: Compare node states at same logical time
3. **Message flow mapping**: Draw who sent what to whom
4. **Bottleneck identification**: Find slowest operations in critical path
5. **Anomaly detection**: Find statistical outliers in metrics

### Common Debugging Scenarios

See `examples/real-debugging-sessions.md` for detailed case studies from SKG development.

**Scenario 1: Consensus never reached**

- Check quorum size vs. active nodes
- Look for Byzantine agents manipulating votes
- Verify message delivery to all voters
- Check for network partitions
- **Memory Integration**: Search for `tags: ["consensus", "quorum"]` to find similar past issues

**Scenario 2: State divergence between nodes**

- Compare vector clocks to find divergence point
- Check for concurrent updates without coordination
- Verify merge/conflict resolution logic
- Look for dropped state sync messages
- **Memory Integration**: Check `src/coordination/plan-sync.ts` debugging history

**Scenario 3: Performance degradation under load**

- Profile to find hot paths
- Check for resource exhaustion (memory, connections)
- Look for head-of-line blocking
- Verify backpressure handling
- **Memory Integration**: Review procedural memories tagged with `["performance", "scalability"]`

### Tracking Debug Sessions with Memory MCP

Every debugging session should be tracked for future reference:

**Session Start Template:**

```typescript
const sessionId = `debug-${Date.now()}-${issueType}`;
memory_create({
  content: JSON.stringify({
    sessionId,
    startTime: new Date().toISOString(),
    symptom: 'Describe observed behavior',
    affectedModules: ['plan-sync', 'work-distribution', 'progress'],
    initialHypotheses: [],
  }),
  type: 'working', // Start as working memory
  importance: 0.5,
  tags: ['debug-session', 'active', issueType],
});
```

**Hypothesis Tracking:**

```typescript
// Record each hypothesis tested
memory_create({
  content: JSON.stringify({
    sessionId,
    hypothesis: 'Network partition causing split-brain',
    testMethod: 'Checked node connectivity logs',
    result: 'REJECTED - all nodes communicating',
    timestamp: new Date().toISOString(),
  }),
  type: 'working',
  importance: 0.6,
  tags: ['hypothesis', sessionId],
});
```

**Session Resolution:**

```typescript
// Convert working memory to episodic when resolved
memory_create({
  content: JSON.stringify({
    sessionId,
    endTime: new Date().toISOString(),
    duration: '45 minutes',
    rootCause: 'Race condition in work-distribution task claims',
    fix: 'Added version check in claimTask()',
    filesModified: ['src/coordination/work-distribution.ts:127-135'],
    testAdded: 'work-distribution.test.ts:234-267',
    preventionStrategy: 'Add optimistic locking validation',
    successMetric: 'Zero double-claims in 1000 task test',
  }),
  type: 'episodic', // Promoted to episodic
  importance: 0.9,
  tags: ['debug-session', 'resolved', 'work-distribution', 'race-condition'],
});
```

**Cross-Referencing Coordination Modules:**

```typescript
// Link debugging session to specific coordination files
memory_create({
  content: JSON.stringify({
    file: 'src/coordination/plan-sync.ts',
    debugSessions: [sessionId],
    knownIssues: [
      'CRDT merge conflicts at lines 156-178',
      'Vector clock synchronization lag line 203',
    ],
    mitigations: ['Added conflict resolution in merge()', 'Implemented clock drift detection'],
  }),
  type: 'semantic',
  importance: 0.85,
  tags: ['plan-sync', 'coordination', 'knowledge-base'],
});
```

## Performance Debugging

See `reference/performance-debugging.md` for comprehensive guide.

**Key techniques from SKG scalability testing:**

```typescript
// From run-scalability-test.ts
// Measure complexity as system scales
interface ComplexityAnalysis {
  discoveryLatency: {
    actualComplexity: string; // Measured: O(log n)
    expectedComplexity: string; // Expected: O(log n)
    rSquared: number; // Goodness of fit
  };
  messageThroughput: {
    actualComplexity: string;
    expectedComplexity: string;
  };
  memoryUsage: {
    actualComplexity: string; // Should be O(n)
    expectedComplexity: string;
  };
}
```

**Performance debugging workflow:**

1. Establish baseline metrics (normal operation)
2. Identify deviation (what changed?)
3. Profile to find bottleneck (CPU? Memory? Network? I/O?)
4. Optimize hot path
5. Measure improvement
6. Ensure no regression elsewhere

## Limitations and Caveats

**This skill cannot:**

- Automatically fix all distributed system bugs
- Guarantee root cause identification in all cases
- Replace domain knowledge of your specific system
- Debug without access to logs, metrics, or traces
- Solve issues caused by hardware failures without diagnostics

**Distributed debugging is inherently difficult because:**

- Heisenberg effect: Observing can change behavior (probe effect)
- Non-reproducibility: Timing-dependent bugs may not reproduce
- Incomplete information: Can't observe all nodes simultaneously
- Emergent complexity: System behavior not predictable from components

**Best practices:**

- Instrument early: Add logging/metrics before you need them
- Test failure modes: Don't just test happy path
- Use feature flags: Enable safer rollouts and faster rollbacks
- Document runbooks: Capture debugging procedures for common issues
- Practice chaos engineering: Test failure handling regularly

## Quick Start

1. **For consensus issues**: See `reference/failure-patterns.md` section on consensus
2. **For message ordering**: Use `scripts/trace-analyzer.py` to reconstruct flows
3. **For state synchronization**: Check `templates/debugging-checklist.md` state sync section
4. **For performance issues**: Run `scripts/performance-analyzer.sh` (from monitoring-strategies.md)
5. **For general debugging**: Follow methodology above with `templates/debugging-checklist.md`

## Integration with Other Skills

- **Evidence-Based Validation**: Use to verify debugging claims and metrics
- **Multi-Agent Orchestration**: Reference for understanding coordination patterns
- **MCP Server Development**: Reference for debugging communication protocols
- **Memory Access**: Store and retrieve debugging patterns (integrated above)

## Memory MCP Usage Patterns for Debugging

### Pattern 1: Building Failure Pattern Library

As you debug, accumulate a searchable library of failure patterns:

```typescript
// Pattern detection
memory_create({
  content: JSON.stringify({
    patternName: 'Split-Brain During Network Partition',
    symptoms: [
      'Multiple leaders elected',
      'Conflicting decisions for same proposal',
      'Quorum cannot be reached',
    ],
    detectionMethod: 'Monitor for multiple agents claiming leader status',
    affectedModules: ['plan-sync'],
    prevention: 'Implement partition detection with quorum verification',
    recoveryStrategy: 'Force re-election with majority partition',
  }),
  type: 'procedural',
  importance: 0.95,
  tags: ['pattern', 'split-brain', 'network-partition', 'consensus'],
});
```

### Pattern 2: Resolution Strategy Knowledge Base

Build a knowledge base of successful resolutions:

```typescript
// Successful resolution
memory_create({
  content: JSON.stringify({
    problem: 'O(n²) message broadcast causing timeouts',
    investigation: [
      'Measured message count growth',
      'Found O(n²) pattern instead of expected O(n)',
      'Identified sequential broadcasting',
    ],
    solution: 'Parallel message sending with Promise.all',
    codeChange: 'work-distribution.ts:89-103',
    performance: {
      before: '2500ms at 500 agents',
      after: '150ms at 500 agents',
      improvement: '16.7x faster',
    },
  }),
  type: 'procedural',
  importance: 0.95,
  tags: ['resolution', 'performance', 'broadcast', 'scalability'],
});
```

### Pattern 3: Coordination Module Health Tracking

Track known issues per coordination module:

```typescript
// Module health tracking
memory_create({
  content: JSON.stringify({
    module: 'src/coordination/work-distribution.ts',
    knownIssues: {
      'task-claim-race': {
        status: 'RESOLVED',
        fix: 'Added version check at line 127',
        testCoverage: 'work-distribution.test.ts:234-267',
      },
      'task-expiry-cleanup': {
        status: 'MONITORING',
        notes: 'Occasional stale tasks after agent crash',
        workaround: 'Manual cleanup in progress.ts',
      },
    },
    healthMetrics: {
      doubleClaimRate: '0.0%',
      taskCompletionRate: '99.8%',
      averageClaimLatency: '12ms',
    },
    lastUpdated: '2024-12-11',
  }),
  type: 'semantic',
  importance: 0.9,
  tags: ['module-health', 'work-distribution', 'coordination'],
});
```

### Pattern 4: Pre-Debug Memory Search

Always search memory before starting investigation:

```typescript
// Search for similar symptoms
const relevantMemories = await memory_search({
  type: 'procedural', // Get past resolutions
  min_importance: 0.7,
  limit: 10,
});

// Filter by tags if symptom is specific
const consensusIssues = await memory_search({
  type: 'episodic',
  min_importance: 0.8,
  limit: 5,
});
// Then manually filter by tags: ["consensus", "timeout"]

// Check module-specific issues
const planSyncHistory = await memory_search({
  type: 'semantic',
  min_importance: 0.7,
  limit: 3,
});
// Filter for plan-sync module memories
```

### Pattern 5: Debugging Session Analytics

Use memory stats to track debugging effectiveness:

```typescript
// Check debugging history
const stats = await memory_stats();

// Analyze:
// - How many debug sessions stored?
// - What types of issues most common?
// - Which modules have most issues?
// - Are resolutions getting faster? (check duration in episodic memories)
```

### Memory Type Guide for Debugging

**EPISODIC**: Complete debugging sessions with timeline

- Use for: Full debug session from start to resolution
- Importance: 0.8-0.95 (based on severity and novelty)
- Tags: ["debug-session", issueType, moduleName, "resolved"]

**SEMANTIC**: Knowledge about system and modules

- Use for: Module health tracking, known issues, architecture facts
- Importance: 0.7-0.9 (based on criticality)
- Tags: ["module-health", moduleName, "knowledge-base"]

**PROCEDURAL**: Patterns and resolutions

- Use for: Failure patterns, resolution strategies, debugging techniques
- Importance: 0.8-0.95 (based on reusability)
- Tags: ["pattern", "resolution", problemType]

**WORKING**: Active debugging session state

- Use for: Hypotheses being tested, temporary findings
- Importance: 0.5-0.7 (temporary, will be promoted or discarded)
- Tags: ["hypothesis", "active", sessionId]

### Best Practices

1. **Search Before Debug**: Always check memory for similar issues
2. **Track Hypotheses**: Record what you test and results
3. **Store Resolutions**: Complete debugging sessions with full context
4. **Link to Code**: Include file paths and line numbers
5. **Tag Consistently**: Use consistent tag vocabulary
6. **Update Module Health**: Keep coordination module status current
7. **Measure Impact**: Include before/after metrics
8. **Cross-Reference**: Link related memories (debug sessions to patterns to modules)

## References

All examples and patterns extracted from:

- SKG Agent Prototype 2 test suite
- Consensus integration tests
- Scalability test framework
- Fault monitor implementations
- Error handling patterns documentation
- Real debugging experiences during SKG development

---

**Remember**: Distributed systems debugging requires patience, systematic methodology, and healthy skepticism. Don't trust your assumptions - verify with evidence.
