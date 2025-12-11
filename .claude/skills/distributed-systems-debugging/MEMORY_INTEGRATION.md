# Memory MCP Integration for Distributed Systems Debugging

This document describes how the Memory MCP server is integrated into the distributed-systems-debugging skill to provide persistent learning and cross-session knowledge accumulation.

## Overview

The Memory MCP integration enables:

1. **Persistent Pattern Library**: Store failure patterns discovered during debugging
2. **Resolution Knowledge Base**: Record successful debugging strategies and fixes
3. **Coordination Module Tracking**: Link debugging sessions to specific Sartor coordination modules
4. **Cross-Session Learning**: Search past issues before starting new investigations
5. **Debugging Analytics**: Track debugging effectiveness over time

## Memory Types for Debugging

### EPISODIC: Complete Debugging Sessions

Store full debugging sessions from symptom to resolution.

**When to use**: After successfully resolving an issue
**Importance**: 0.8-0.95 (based on severity and novelty)
**Required tags**: ["debug-session", issueType, moduleName, "resolved"]

**Example:**
```typescript
memory_create({
  content: JSON.stringify({
    sessionId: "debug-1702317000-consensus-timeout",
    timestamp: "2024-12-11T10:30:00Z",
    symptom: "Consensus operations timing out at 300+ agents",
    affectedModules: ["plan-sync"],
    investigation: [
      "Hypothesis: Network bandwidth exhaustion - REJECTED (60% utilization)",
      "Hypothesis: O(n²) message pattern - CONFIRMED",
      "Found: Sequential broadcasting to all agents"
    ],
    rootCause: "O(n²) message broadcast in ConsensusMemory.broadcastProposal()",
    fix: "Parallel message sending with Promise.all, exclude self from recipients",
    filesModified: [
      "src/coordination/plan-sync.ts:156-178"
    ],
    testAdded: "plan-sync.test.ts:234-267",
    performance: {
      before: "Timeout at 450 agents (30s)",
      after: "150ms at 500 agents",
      improvement: "200x faster"
    },
    duration: "45 minutes",
    preventionStrategy: "Add message count monitoring to detect O(n²) patterns early"
  }),
  type: "episodic",
  importance: 0.95,
  tags: ["debug-session", "consensus", "timeout", "plan-sync", "resolved"]
})
```

### SEMANTIC: System and Module Knowledge

Store facts about the system, modules, and their known issues.

**When to use**: Tracking module health, documenting architecture facts
**Importance**: 0.7-0.9 (based on criticality)
**Required tags**: ["module-health", moduleName, "knowledge-base"]

**Example:**
```typescript
memory_create({
  content: JSON.stringify({
    module: "src/coordination/work-distribution.ts",
    purpose: "Optimistic locking task assignment with version-based conflict detection",
    knownIssues: {
      "task-claim-race": {
        status: "RESOLVED",
        description: "Double claims possible without version check",
        fix: "Added version check in claimTask() line 127",
        fixDate: "2024-12-10",
        testCoverage: "work-distribution.test.ts:234-267"
      },
      "task-expiry-cleanup": {
        status: "MONITORING",
        description: "Occasional stale tasks after agent crash",
        workaround: "Manual cleanup in progress.ts",
        priority: "MEDIUM"
      }
    },
    healthMetrics: {
      doubleClaimRate: "0.0%",
      taskCompletionRate: "99.8%",
      averageClaimLatency: "12ms",
      lastMeasured: "2024-12-11"
    },
    dependencies: [
      "src/subagent/registry.ts",
      "src/coordination/progress.ts"
    ],
    testFiles: [
      "src/coordination/__tests__/work-distribution.test.ts"
    ],
    lastUpdated: "2024-12-11"
  }),
  type: "semantic",
  importance: 0.9,
  tags: ["module-health", "work-distribution", "coordination", "knowledge-base"]
})
```

### PROCEDURAL: Patterns and Resolution Strategies

Store reusable debugging patterns and successful resolution strategies.

**When to use**: After identifying a pattern or successful resolution approach
**Importance**: 0.8-0.95 (based on reusability)
**Required tags**: ["pattern" or "resolution", problemType]

**Example - Failure Pattern:**
```typescript
memory_create({
  content: JSON.stringify({
    patternName: "Split-Brain During Network Partition",
    patternType: "CONSENSUS_FAILURE",
    symptoms: [
      "Multiple leaders elected simultaneously",
      "Conflicting decisions for same proposal",
      "Nodes in different partitions have divergent state",
      "Quorum cannot be reached for system-wide decisions"
    ],
    detectionMethod: "Monitor for multiple agents claiming leader status",
    detectionCode: `
      const leaders = agents.filter(a => a.status === 'LEADER');
      if (leaders.length > 1) {
        // Split-brain detected
      }
    `,
    affectedModules: ["plan-sync", "consensus"],
    rootCause: "Network partition prevents communication between agent groups",
    prevention: [
      "Implement partition detection with quorum verification",
      "Use majority-based leader election",
      "Add partition recovery protocol"
    ],
    recoveryStrategy: "Force re-election with majority partition, reject minority partition decisions",
    testScenario: "ConsensusIntegration.test.ts - network_partition_recovery",
    relatedPatterns: ["quorum-loss", "state-divergence"]
  }),
  type: "procedural",
  importance: 0.95,
  tags: ["pattern", "split-brain", "network-partition", "consensus"]
})
```

**Example - Resolution Strategy:**
```typescript
memory_create({
  content: JSON.stringify({
    strategyName: "Performance Debugging via Complexity Analysis",
    applicableTo: ["performance-degradation", "scalability-issues", "timeouts"],
    approach: [
      "1. Establish baseline metrics at small scale (10-50 agents)",
      "2. Measure at increasing scales (100, 200, 500, 1000 agents)",
      "3. Plot metric vs agent count on log-log scale",
      "4. Determine actual complexity (O(1), O(log n), O(n), O(n²))",
      "5. Compare to expected complexity",
      "6. If mismatch, identify source of excess operations"
    ],
    tools: [
      "run-scalability-test.ts",
      "Message count profiler",
      "Latency percentile tracker"
    ],
    successCriteria: "Actual complexity matches expected (e.g., O(n) not O(n²))",
    codeExample: `
      // Measure message count growth
      const results = [];
      for (const agentCount of [100, 200, 300, 400, 500]) {
        const messageCount = await runConsensus(agentCount);
        results.push({ agentCount, messageCount });
      }
      // Check if linear (O(n)) or quadratic (O(n²))
      const complexity = analyzeComplexity(results);
    `,
    successStories: [
      "debug-1702317000-consensus-timeout: Found O(n²) broadcast, fixed to O(n)"
    ]
  }),
  type: "procedural",
  importance: 0.9,
  tags: ["resolution", "performance", "scalability", "complexity-analysis"]
})
```

### WORKING: Active Debugging Session State

Store temporary state during active debugging (hypotheses, findings).

**When to use**: During active debugging session, before resolution
**Importance**: 0.5-0.7 (temporary, will be promoted or discarded)
**Required tags**: ["hypothesis" or "finding", "active", sessionId]

**Example:**
```typescript
const sessionId = `debug-${Date.now()}-state-divergence`;

// Store initial state
memory_create({
  content: JSON.stringify({
    sessionId,
    startTime: "2024-12-11T14:22:00Z",
    symptom: "Nodes have different values for same plan entry",
    affectedModules: ["plan-sync"],
    initialObservations: [
      "Node A has plan.status = 'ACTIVE'",
      "Node B has plan.status = 'COMPLETED'",
      "Both nodes connected, no network partition detected"
    ],
    hypotheses: []
  }),
  type: "working",
  importance: 0.5,
  tags: ["active", "state-divergence", "plan-sync", sessionId]
})

// Track hypothesis 1
memory_create({
  content: JSON.stringify({
    sessionId,
    hypothesis: "Messages lost during network congestion",
    testMethod: "Check network metrics and message delivery logs",
    result: "REJECTED",
    evidence: "Network latency normal (<50ms), no dropped packets",
    timestamp: "2024-12-11T14:30:00Z"
  }),
  type: "working",
  importance: 0.6,
  tags: ["hypothesis", sessionId, "rejected"]
})

// Track hypothesis 2
memory_create({
  content: JSON.stringify({
    sessionId,
    hypothesis: "Concurrent updates without proper CRDT merge",
    testMethod: "Compare vector clocks at divergence point",
    result: "CONFIRMED",
    evidence: "Vector clocks show concurrent updates, merge logic has bug at line 178",
    timestamp: "2024-12-11T14:45:00Z"
  }),
  type: "working",
  importance: 0.7,
  tags: ["hypothesis", sessionId, "confirmed"]
})

// After resolution, promote to episodic (see EPISODIC example above)
```

## Memory-Driven Debugging Workflow

### Phase 1: Pre-Debug Search

Always search memory before starting investigation:

```typescript
// 1. Search for similar symptoms
const similarIssues = await memory_search({
  type: "episodic",
  min_importance: 0.7,
  limit: 10
})

// 2. Filter by relevant tags (manually)
const consensusIssues = similarIssues.filter(m =>
  m.memory.tags.includes("consensus") &&
  m.memory.tags.includes("timeout")
)

// 3. Check for known patterns
const knownPatterns = await memory_search({
  type: "procedural",
  min_importance: 0.8,
  limit: 5
})

// 4. Review module health
const moduleHealth = await memory_search({
  type: "semantic",
  min_importance: 0.7,
  limit: 3
})

// 5. Parse and review relevant memories
for (const issue of consensusIssues) {
  const data = JSON.parse(issue.memory.content);
  console.log(`Past issue: ${data.symptom}`);
  console.log(`Resolution: ${data.resolution}`);
}
```

### Phase 2: Active Debugging with Hypothesis Tracking

Track investigation progress in working memory:

```typescript
const sessionId = `debug-${Date.now()}-${issueType}`;

// 1. Create session
memory_create({
  content: JSON.stringify({
    sessionId,
    startTime: new Date().toISOString(),
    symptom: "Describe the observed behavior",
    affectedModules: ["plan-sync", "work-distribution"],
    initialEvidence: []
  }),
  type: "working",
  importance: 0.5,
  tags: ["active", "debug-session", issueType, sessionId]
})

// 2. Track each hypothesis
for (const hypothesis of hypotheses) {
  const result = await testHypothesis(hypothesis);

  memory_create({
    content: JSON.stringify({
      sessionId,
      hypothesis: hypothesis.description,
      testMethod: hypothesis.testMethod,
      result: result.status,  // "CONFIRMED" | "REJECTED" | "INCONCLUSIVE"
      evidence: result.evidence,
      timestamp: new Date().toISOString()
    }),
    type: "working",
    importance: result.status === "CONFIRMED" ? 0.7 : 0.6,
    tags: ["hypothesis", sessionId, result.status.toLowerCase()]
  })
}
```

### Phase 3: Resolution and Knowledge Storage

After resolving, store complete session as episodic memory:

```typescript
// Store complete debugging session
memory_create({
  content: JSON.stringify({
    sessionId,
    endTime: new Date().toISOString(),
    duration: calculateDuration(startTime, endTime),
    symptom: "Original symptom description",
    investigation: hypotheses.map(h => `${h.description} - ${h.result}`),
    rootCause: "Final root cause identified",
    fix: "What was changed to fix it",
    filesModified: ["src/coordination/plan-sync.ts:156-178"],
    testAdded: "plan-sync.test.ts:234-267",
    preventionStrategy: "How to prevent recurrence",
    successMetric: "How to verify fix worked",
    performance: {
      before: "Metric before fix",
      after: "Metric after fix",
      improvement: "Quantified improvement"
    }
  }),
  type: "episodic",  // Promoted from working
  importance: 0.9,
  tags: ["debug-session", "resolved", issueType, ...affectedModules]
})

// Extract and store pattern if novel
if (isNovelPattern) {
  memory_create({
    content: JSON.stringify({
      patternName: "Name of the pattern",
      symptoms: [],
      detectionMethod: "",
      prevention: [],
      recoveryStrategy: ""
    }),
    type: "procedural",
    importance: 0.95,
    tags: ["pattern", patternType]
  })
}

// Update module health
memory_create({
  content: JSON.stringify({
    module: affectedModule,
    knownIssues: {
      [issueId]: {
        status: "RESOLVED",
        fix: "What was fixed",
        testCoverage: "Test added"
      }
    },
    lastUpdated: new Date().toISOString()
  }),
  type: "semantic",
  importance: 0.85,
  tags: ["module-health", moduleName, "updated"]
})
```

### Phase 4: Periodic Analytics

Track debugging effectiveness:

```typescript
// Get memory statistics
const stats = await memory_stats();

// Analyze debugging history
const debugSessions = await memory_search({
  type: "episodic",
  min_importance: 0.7,
  limit: 100
})

// Calculate metrics
const resolvedSessions = debugSessions.filter(m =>
  m.memory.tags.includes("resolved")
)

const avgDuration = calculateAverage(
  resolvedSessions.map(s => JSON.parse(s.memory.content).duration)
)

const issuesByType = groupBy(
  resolvedSessions,
  s => JSON.parse(s.memory.content).symptom.match(/consensus|state|performance/)[0]
)

const moduleHealth = await memory_search({
  type: "semantic",
  min_importance: 0.7,
  limit: 10
})

// Generate health report
console.log(`Total debugging sessions: ${debugSessions.length}`);
console.log(`Resolved: ${resolvedSessions.length}`);
console.log(`Average duration: ${avgDuration}`);
console.log(`Issues by type:`, issuesByType);
console.log(`Module health:`, moduleHealth);
```

## Integration with Sartor Coordination System

### Coordination Module Tracking

Track known issues and health for each coordination module:

**plan-sync.ts**: CRDT-based plan synchronization
```typescript
memory_create({
  content: JSON.stringify({
    module: "src/coordination/plan-sync.ts",
    architecture: {
      type: "CRDT-based state synchronization",
      keyFeatures: ["LWW registers", "Vector clocks", "Automatic merge"],
      dependencies: ["src/subagent/registry.ts"]
    },
    knownIssues: {
      "crdt-merge-conflict": {
        status: "RESOLVED",
        location: "lines 156-178",
        fix: "Enhanced merge logic with conflict detection"
      },
      "vector-clock-drift": {
        status: "MONITORING",
        location: "line 203",
        workaround: "Clock sync validation"
      }
    },
    commonBugs: [
      "Concurrent updates without proper CRDT merge",
      "Vector clock synchronization lag",
      "State divergence after network partition"
    ],
    testCoverage: "src/coordination/__tests__/plan-sync.test.ts",
    healthMetrics: {
      stateConsistency: "99.9%",
      mergeConflictRate: "0.1%",
      averageSyncLatency: "25ms"
    }
  }),
  type: "semantic",
  importance: 0.9,
  tags: ["module-health", "plan-sync", "coordination"]
})
```

**work-distribution.ts**: Task assignment with optimistic locking
```typescript
memory_create({
  content: JSON.stringify({
    module: "src/coordination/work-distribution.ts",
    architecture: {
      type: "Optimistic locking task assignment",
      keyFeatures: ["Version-based conflict detection", "Task claim/release", "Expiry handling"],
      dependencies: ["src/subagent/registry.ts", "src/coordination/progress.ts"]
    },
    knownIssues: {
      "task-claim-race": {
        status: "RESOLVED",
        location: "line 127",
        fix: "Added version check before claim"
      },
      "task-expiry-cleanup": {
        status: "MONITORING",
        description: "Occasional stale tasks after agent crash",
        workaround: "Manual cleanup in progress.ts"
      }
    },
    commonBugs: [
      "Double claims without version check",
      "Task expiry not triggering cleanup",
      "Race conditions in claim/release"
    ],
    testCoverage: "src/coordination/__tests__/work-distribution.test.ts",
    healthMetrics: {
      doubleClaimRate: "0.0%",
      taskCompletionRate: "99.8%",
      averageClaimLatency: "12ms"
    }
  }),
  type: "semantic",
  importance: 0.9,
  tags: ["module-health", "work-distribution", "coordination"]
})
```

**progress.ts**: Multi-agent progress tracking
```typescript
memory_create({
  content: JSON.stringify({
    module: "src/coordination/progress.ts",
    architecture: {
      type: "Multi-agent progress aggregation",
      keyFeatures: ["Milestone tracking", "Status aggregation", "Progress reporting"],
      dependencies: ["src/coordination/work-distribution.ts"]
    },
    knownIssues: {
      "progress-lag": {
        status: "MONITORING",
        description: "Occasional delay in progress updates",
        workaround: "Force refresh on status queries"
      }
    },
    commonBugs: [
      "Progress updates lag behind actual task completion",
      "Status inconsistency across agents",
      "Milestone synchronization delays"
    ],
    testCoverage: "src/coordination/__tests__/progress.test.ts",
    healthMetrics: {
      updateLatency: "50ms p95",
      consistencyRate: "99.5%",
      milestoneAccuracy: "100%"
    }
  }),
  type: "semantic",
  importance: 0.85,
  tags: ["module-health", "progress", "coordination"]
})
```

## Tagging Strategy

Use consistent tags for discoverability:

### Issue Type Tags
- `consensus` - Consensus-related issues
- `state-sync` - State synchronization issues
- `performance` - Performance degradation
- `network-partition` - Network partition issues
- `race-condition` - Race condition bugs
- `byzantine` - Byzantine failure scenarios

### Module Tags
- `plan-sync` - Issues in plan-sync.ts
- `work-distribution` - Issues in work-distribution.ts
- `progress` - Issues in progress.ts
- `coordination` - General coordination system

### Status Tags
- `active` - Currently debugging (working memory)
- `resolved` - Successfully resolved (episodic)
- `monitoring` - Known issue being monitored (semantic)
- `confirmed` - Hypothesis confirmed (working)
- `rejected` - Hypothesis rejected (working)

### Memory Type Tags
- `debug-session` - Complete debugging session
- `hypothesis` - Hypothesis being tested
- `pattern` - Failure pattern
- `resolution` - Resolution strategy
- `module-health` - Module health tracking
- `knowledge-base` - System knowledge

## Best Practices

1. **Search Before Debug**: Always check memory for similar issues before starting
2. **Track All Hypotheses**: Record what you test, even if rejected
3. **Store Complete Sessions**: Include full context from symptom to resolution
4. **Link to Code**: Always include file paths and line numbers
5. **Tag Consistently**: Use the standard tag vocabulary
6. **Update Module Health**: Keep coordination module status current
7. **Measure Impact**: Include before/after metrics
8. **Cross-Reference**: Link debugging sessions to patterns and modules
9. **Promote Working to Episodic**: Convert working memory to episodic when resolved
10. **Extract Patterns**: Identify and store novel failure patterns separately

## Tools and Commands

### MCP CLI Usage

```bash
# Search for past consensus issues
memory_search --type episodic --min-importance 0.8 --limit 10 | grep consensus

# Create debugging session
memory_create --content "$(cat debug-session.json)" --type episodic --importance 0.9 --tags "resolved,consensus,plan-sync"

# Get memory stats
memory_stats

# Retrieve specific memory
memory_get --id mem_abc123
```

### Programmatic Usage

```typescript
// TypeScript example
import { memory_create, memory_search, memory_get, memory_stats } from './mcp-tools';

// Search before debugging
const similar = await memory_search({
  type: "procedural",
  min_importance: 0.7,
  limit: 10
});

// Store debugging session
await memory_create({
  content: JSON.stringify({ /* session data */ }),
  type: "episodic",
  importance: 0.9,
  tags: ["debug-session", "resolved", "plan-sync"]
});

// Check statistics
const stats = await memory_stats();
```

## Examples

See SKILL.md for complete examples:
- "Memory MCP Integration" (line 23)
- "Tracking Debug Sessions with Memory MCP" (line 413)
- "Memory MCP Usage Patterns for Debugging" (line 565)

## References

- Memory MCP Server: `/home/alton/Sartor-claude-network/src/mcp/`
- Memory System: `/home/alton/Sartor-claude-network/src/memory/`
- Coordination Modules: `/home/alton/Sartor-claude-network/src/coordination/`
- Memory Access Skill: `/home/alton/Sartor-claude-network/.claude/skills/memory-access.md`
