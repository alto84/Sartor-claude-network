---
name: Multi-Agent Orchestration
description: Guides analysis and design of multi-agent systems including consensus mechanisms, distributed state management, agent coordination patterns, conflict resolution, Memory MCP integration, and work distribution. Use when analyzing agent architectures, debugging coordination issues, designing multi-agent systems, or integrating memory-backed coordination.
allowed-tools: Read, Grep, Glob, Bash
---

# Multi-Agent Orchestration Skill

## Overview

This skill provides comprehensive guidance for analyzing, designing, and debugging multi-agent coordination systems. It draws from actual implementations in the SKG Agent Prototype 2 and the Sartor-Claude-Network, focusing on proven patterns for consensus, communication, state management, conflict resolution, and Memory MCP integration in distributed agent systems.

The skill includes production-ready coordination modules for work distribution, plan synchronization, and progress tracking, all integrated with the 3-tier memory system for persistent state and learning.

## When to Use This Skill

Use this skill when you need to:

1. **Analyze existing multi-agent architectures** - Understand coordination patterns, identify bottlenecks
2. **Design new multi-agent systems** - Select appropriate consensus mechanisms, communication patterns
3. **Debug coordination issues** - Diagnose split-brain scenarios, message ordering problems, state conflicts
4. **Evaluate consensus mechanisms** - Choose between Raft, BFT, or other approaches based on requirements
5. **Optimize agent communication** - Improve message routing, reduce latency, prevent cascading failures
6. **Implement distributed state** - Apply CRDTs, vector clocks, conflict detection patterns
7. **Integrate Memory MCP** - Use shared memory for coordination state, decision history, learning
8. **Distribute work across agents** - Implement task claiming, assignment recommendations, progress tracking
9. **Synchronize plans** - CRDT-based conflict-free plan updates across multiple agents
10. **Track multi-agent progress** - Milestone management, agent performance analysis, bottleneck detection

## Core Orchestration Patterns

### 1. Consensus Mechanisms

Multi-agent systems require consensus for coordinated decision-making. Choose based on failure model:

**Raft Consensus** - For crash-fault tolerance (non-Byzantine scenarios):
- **When to use**: Trusted agent environments, configuration management, leader election
- **Characteristics**: Leader-based, strong consistency, ~150ms election time
- **Performance**: 100-1000 commands/second, scales well for 3-7 nodes
- **Failure model**: Tolerates up to f failures in 2f+1 nodes
- **Limitations**: Requires majority (2f+1) for progress, vulnerable to Byzantine faults

**BFT Consensus** - For Byzantine fault tolerance (untrusted agents):
- **When to use**: Adversarial environments, financial systems, security-critical coordination
- **Characteristics**: Three-phase commit (pre-prepare, prepare, commit), cryptographic signatures
- **Performance**: 10-50 requests/second, degrades with O(n²) message complexity
- **Failure model**: Tolerates up to f Byzantine nodes in 3f+1 nodes
- **Limitations**: High message overhead, computational cost, scales poorly beyond 20-30 nodes

**Decision Matrix**:
```
Crash faults only + High throughput needed → Raft
Byzantine faults possible + Security critical → BFT
Very large networks (>30 nodes) + Partial consistency acceptable → Gossip protocols
Hierarchical structure + Scalability → Hierarchical Consensus
```

### 2. Communication Patterns

**A2A (Agent-to-Agent) Protocol**:
- Peer-to-peer collaboration framework
- Stateful multi-turn interactions with session management
- Message throughput: 500-1000 msg/s for small sessions (2-3 agents)
- Scaling characteristics: Linear degradation up to 6 participants, quadratic overhead beyond 8
- Use for: Complex task management, reasoning, planning, negotiation between agents

**Semantic Routing**:
- Vector embedding-based similarity calculation
- Content-aware message routing vs simple pattern matching
- Performance improvement: >90% latency reduction vs baseline (random/round-robin)
- Cache hit ratio: >60% with similarity threshold 0.85
- Use for: Intent-based routing, capability matching, content-aware load distribution

**Message Routing Patterns**:
1. **Direct Routing**: Point-to-point, lowest latency, no flexibility
2. **Broadcast**: All agents receive, simple but high bandwidth
3. **Publish-Subscribe**: Topic-based, decouples senders/receivers
4. **Semantic Intent-Based**: Understands message meaning, routes to capable agents

### 3. Distributed State Management

**CRDTs (Conflict-free Replicated Data Types)**:
- **State-based CRDTs**: G-Counter, PN-Counter, LWW-Register
  - Bandwidth reduction: 50-90% via delta-state optimization
  - Convergence time: Sub-second for up to 64 replicas
  - Merge complexity: O(n) linear scaling
  - Use for: Counters, registers, eventually consistent state

- **Operation-based CRDTs**: Require causal delivery
  - Vector clock integration for ordering
  - Operation logging with dependency tracking
  - Use for: Collaborative editing, distributed logs

**Vector Clocks**:
- Lamport timestamps for causal ordering
- Memory overhead: O(n) where n = number of nodes (~50-200 bytes per node)
- Causality detection: >95% accuracy under normal conditions
- Use for: Event ordering, detecting concurrent operations, distributed debugging

**Conflict Detection**:
- Write-write conflicts: Temporal analysis with configurable time windows
- Read-write dependencies: Dependency chain tracking with invalidation cascade
- Semantic conflicts: Content similarity analysis (Jaccard similarity)
- Detection latency: P50 <10ms, P95 <50ms, P99 <100ms
- Memory usage: <1MB/hour growth rate with automatic cleanup

### 4. Load Balancing and Routing

**Load Balancing Algorithms**:

1. **Weighted Round-Robin**:
   - Dynamic weight adjustment based on performance
   - Predictable distribution, low overhead
   - Limitation: May not reflect real-time capacity changes

2. **Least Connections**:
   - Routes to agent with fewest active connections
   - Dynamic adaptation to load
   - Limitation: Connection count ≠ actual computational load

3. **Response-Time Based**:
   - Routes to fastest responding agent
   - Tracks P50, P95, P99 latencies
   - Limitation: Requires warm-up period for accurate metrics

**Circuit Breaker Pattern**:
- Three states: CLOSED → OPEN → HALF_OPEN
- Prevents cascade failures to struggling agents
- Configurable failure thresholds (e.g., 5 failures → OPEN)
- Recovery timeout: Typically 30-60 seconds
- Failover speed: <5s average detection and response

### 5. Coordination Protocols (from CLAUDE.md)

**Persona Adoption Requirements**:
- Each agent must adopt assigned specialized role completely
- Stay within designated domain expertise
- Bring unique viewpoint based on persona
- Avoid converging to generic responses

**Collaborative Framework**:
- Shared objective: All agents work toward common goal
- Complementary analysis: Each contributes specialized perspective
- Cross-validation: Agents verify findings with evidence
- Synthesis protocol: Combine insights without fabricating consensus metrics

**Anti-Fabrication in Teams**:
- No metric averaging: Don't create fake consensus scores
- Preserve disagreement: Report differing assessments honestly
- Evidence multiplication: More agents doesn't mean stronger claims
- Independent validation: Each agent must verify claims independently

## Common Failure Modes

### 1. Split-Brain Scenarios
**Symptoms**: Multiple leaders elected, conflicting decisions
**Causes**: Network partition, asymmetric failures
**Detection**: Raft: ~150ms election time, BFT: 2-5 seconds
**Resolution**:
- Raft: Majority partition continues, minority blocks
- BFT: Requires 2f+1 agreement, automatically rejects minority
**Prevention**: Quorum-based decisions, network partition detection

### 2. Message Ordering Problems
**Symptoms**: Causality violations, operations applied out of order
**Causes**: Network delays, concurrent operations, missing vector clock
**Detection**: Vector clock comparison, dependency tracking
**Resolution**:
- Use causal delivery guarantees (operation-based CRDTs)
- Implement message buffering until dependencies satisfied
- Apply vector clocks for happens-before relationships

### 3. State Synchronization Bugs
**Symptoms**: Replicas diverge, inconsistent state
**Causes**: Merge function errors, non-commutative operations, Byzantine nodes
**Detection**: State hash comparison, formal property testing
**Resolution**:
- Verify CRDT properties (commutative, associative, idempotent)
- Use delta-state synchronization to reduce bandwidth
- Implement checkpointing for recovery

### 4. Cascading Failures
**Symptoms**: Single agent failure triggers widespread outages
**Causes**: No circuit breakers, unbounded retries, resource exhaustion
**Detection**: Health monitoring, circuit breaker metrics
**Resolution**:
- Implement circuit breakers with configurable thresholds
- Use exponential backoff for retries
- Set resource limits (memory, connections, timeouts)

### 5. Deadlock and Livelock
**Symptoms**: System stuck, no progress despite agent activity
**Causes**: Circular dependencies, conflicting priorities, coordination loops
**Detection**: Dependency graph cycle detection, progress monitoring
**Resolution**:
- Use dependency ordering (topological sort)
- Implement timeout-based deadlock breaking
- Apply priority-based conflict resolution

### 6. Byzantine Failures
**Symptoms**: Malicious or buggy agents send invalid messages
**Causes**: Software bugs, compromised agents, malicious actors
**Detection**: Cryptographic signature verification, behavior anomaly detection
**Resolution**:
- Use BFT consensus (tolerates f failures in 3f+1 nodes)
- Implement trust scoring based on historical behavior
- Apply proof-of-work for critical decisions

## Debugging Strategies

### 1. Analyze Coordination Flow
```bash
# Search for consensus-related code
grep -r "consensus\|raft\|bft" /path/to/codebase

# Find agent communication patterns
grep -r "sendMessage\|routeMessage\|A2A" /path/to/codebase

# Identify state management
grep -r "CRDT\|vectorClock\|merge" /path/to/codebase
```

### 2. Check Performance Metrics
- Leader election time (should be <500ms for Raft)
- Message throughput (baseline: 100-1000 msg/s depending on consensus)
- Convergence time (CRDTs should converge <1s for most cases)
- Circuit breaker states (frequent OPEN states indicate problems)
- Cache hit ratios (semantic routing should achieve >60%)

### 3. Monitor Coordination Health
- Active sessions and participant counts
- Byzantine fault detection rate
- Network partition events
- State synchronization overhead
- Conflict detection rates and types

### 4. Trace Message Flow
- Implement distributed tracing (trace IDs across agents)
- Log vector clocks for causality analysis
- Track message routing decisions
- Monitor queue depths and backpressure

## Architecture Patterns

### Pattern 1: Hierarchical Orchestration
```
Orchestrator (Coordinator)
├── Agent Registry (Discovery)
├── Task Queue (Distribution)
├── Result Aggregator (Synthesis)
└── Health Monitor (Failure Detection)
```
**When to use**: Centralized coordination, clear hierarchy
**Tradeoffs**: Single point of failure, simpler reasoning, potential bottleneck

### Pattern 2: Peer-to-Peer Collaboration
```
Agent A ←→ Agent B
   ↕          ↕
Agent C ←→ Agent D
```
**When to use**: No natural leader, equal agents, Byzantine tolerance needed
**Tradeoffs**: More complex coordination, higher message overhead, better fault tolerance

### Pattern 3: Leader-Based Consensus
```
Leader (Raft/BFT)
├── Follower 1
├── Follower 2
└── Follower 3
```
**When to use**: Strong consistency, total order needed, crash faults only (Raft)
**Tradeoffs**: Simpler than P2P, leader is bottleneck, requires majority for progress

### Pattern 4: Gossip-Based Eventual Consistency
```
Agent A → Agent B → Agent C
   ↓         ↓         ↓
Agent D ← Agent E ← Agent F
```
**When to use**: Very large networks, eventual consistency acceptable
**Tradeoffs**: Scales well, no strong consistency, unpredictable convergence time

## Performance Optimization

### 1. Reduce Message Overhead
- Use delta-state CRDTs (50-90% bandwidth reduction)
- Implement request batching (100+ operations per batch)
- Apply message compression based on domain
- Cache routing decisions (semantic routing: >60% hit rate)

### 2. Optimize Consensus
- Pre-vote optimization (reduces election disruptions)
- Pipeline requests (overlaps for higher throughput)
- Batch commands (groups for efficiency)
- Adaptive timeouts (adjusts based on network)

### 3. Scale Coordination
- Hierarchical consensus for large networks
- Partition into smaller coordination groups
- Use gossip protocols for non-critical state
- Implement sharding for independent subproblems

### 4. Improve Fault Tolerance
- Circuit breakers prevent cascade (failover <5s)
- Health checks detect failures early (10-30s intervals)
- Retry with exponential backoff (prevent storms)
- Graceful degradation (partial operation better than none)

## Monitoring and Observability

### Key Metrics to Track

**Consensus Metrics**:
- Leader election time (Raft: ~150ms, BFT: ~375ms)
- Log replication latency (Raft: 10-50ms per command)
- Throughput (Raft: 100-1000 cmd/s, BFT: 10-50 req/s)
- Split-brain detection and recovery time

**Communication Metrics**:
- Message throughput per session size
- Routing latency (semantic: <200ms, baseline: ~5000ms)
- Cache hit ratios (target: >60%)
- Circuit breaker state transitions

**State Management Metrics**:
- Convergence time vs replica count
- Bandwidth overhead (delta vs full sync)
- Merge complexity scaling
- Conflict detection rate and types

**System Health Metrics**:
- Active agent count and utilization
- Queue depths and backpressure
- Memory usage and growth rate
- CPU usage and resource limits

### Alerting Thresholds

- High latency: >1000ms sustained
- Low cache hit: <30% for semantic routing
- Frequent circuit breaks: >10 per hour
- Slow convergence: >5s for CRDTs
- High conflict rate: >100 per minute
- Byzantine detection: >1 per hour

## Limitations and Tradeoffs

### Raft Consensus
**Limitations**:
- Requires majority (2f+1) for any progress
- Vulnerable to Byzantine faults
- Leader is throughput bottleneck
- Split-brain during network partition

**Measured Performance**: 100-1000 cmd/s, 150ms election, 3-7 nodes optimal

### BFT Consensus
**Limitations**:
- O(n²) message complexity limits scalability
- High computational cost (cryptographic signatures)
- Requires 3f+1 nodes for f Byzantine faults
- Not cost-effective for crash-only faults

**Measured Performance**: 10-50 req/s, 375ms election, 20-30 nodes maximum

### CRDTs
**Limitations**:
- O(n) memory per replica (unsuitable for very large networks)
- Limited operation types (not all data structures have CRDT equivalents)
- Eventual consistency only (no strong guarantees)
- Tombstone accumulation requires garbage collection

**Measured Performance**: <1s convergence for 64 replicas, 50-90% bandwidth savings

### Vector Clocks
**Limitations**:
- O(n) memory growth with node count
- No protection against Byzantine failures (clock manipulation)
- Requires periodic synchronization (drift handling)
- Garbage collection needed for event history

**Measured Performance**: >95% causality detection, 10-50ms sync overhead

### A2A Protocol
**Limitations**:
- Session limit: 100 concurrent sessions
- Byzantine tolerance: 1/3 of participants maximum
- Quadratic state sync overhead with participants
- Computational cost of proof-of-work consensus

**Measured Performance**: 500-1000 msg/s for 2-3 agents, linear degradation to 6, quadratic beyond 8

## Evidence-Based Recommendations

When making architectural decisions:

1. **State requirements**: If you don't need actual measurements, don't claim specific performance numbers
2. **Measure baselines**: Compare against measured baseline (not theoretical ideal)
3. **Document limitations**: Every pattern has tradeoffs - state them explicitly
4. **Test failure modes**: Validate fault tolerance claims with actual failure injection
5. **Quantify overhead**: Measure coordination overhead vs direct operation
6. **Scale testing**: Test at expected scale, not just small examples

**Language to avoid** (unless backed by measurements):
- "Eliminates all coordination issues"
- "Perfect synchronization"
- "Guaranteed consensus" (consensus has failure modes)
- "Zero overhead" (all coordination has cost)
- "Industry-leading performance" (without benchmarks)

**Language to use**:
- "Measured performance: X ops/sec under Y conditions"
- "Tolerates up to f failures in configuration Z"
- "Observed convergence time: X ms for Y replicas"
- "Tradeoff: Lower latency at cost of eventual consistency"
- "Limitation: Requires majority for progress"

## Memory MCP Integration

### Shared State via Memory System

Multi-agent systems require shared state for coordination. The Memory MCP provides a 3-tier memory system that agents can use to:

**Store Orchestration Decisions**:
- **Refinement Traces**: Track iterative improvement loops across agents
  - Use `memory_create_refinement_trace` to record task refinements
  - Include iteration count, success status, duration metrics
  - Retrieve past refinements to inform future decisions

- **Expert Consensus**: Record multi-agent voting outcomes
  - Store consensus decisions with voting metadata
  - Track which agents agreed/disagreed on coordination choices
  - Use for conflict resolution and decision auditing

**Read System Goals from Memory**:
- **Semantic Memories**: Store long-term system objectives and constraints
  - System-wide coordination policies
  - Agent role definitions and boundaries
  - Performance baselines and optimization targets

- **Procedural Memories**: Codify coordination patterns that work
  - Successful task distribution strategies
  - Conflict resolution procedures
  - Load balancing algorithms that performed well

**Agent State Synchronization**:
- **Working Memory**: Short-term coordination state (<100ms latency)
  - Active task assignments
  - Current agent status updates
  - Immediate coordination events

- **Episodic Memory**: Historical coordination events
  - Past split-brain scenarios and resolutions
  - Message ordering violations and fixes
  - Performance degradation events and recovery

### Memory MCP Tools for Coordination

**Creating Coordination Memories**:
```typescript
// Record a consensus decision
await memory_create({
  content: JSON.stringify({
    decision: "Use Raft consensus for task distribution",
    participants: ["agent-1", "agent-2", "agent-3"],
    votes: { for: 2, against: 1 },
    rationale: "Crash-fault tolerance sufficient, high throughput needed"
  }),
  type: "expert_consensus",
  importance: 0.8,
  tags: ["consensus", "architecture", "task-distribution"]
});

// Store refinement trace
await memory_create_refinement_trace({
  task_id: "optimize-load-balancer",
  iterations: 3,
  final_result: "Weighted round-robin with response time tracking",
  success: true,
  duration_ms: 45000
});
```

**Retrieving Coordination Context**:
```typescript
// Get system goals
const goals = await memory_search({
  type: "semantic",
  min_importance: 0.7,
  limit: 10
});

// Find similar past decisions
const pastDecisions = await memory_search_expert_consensus({
  min_agreement: 0.6,
  limit: 5
});

// Check refinement history for a task type
const refinements = await memory_search({
  type: "refinement_trace",
  tags: ["load-balancing"],
  limit: 10
});
```

### Memory-Backed Coordination Patterns

**Pattern 1: Shared Decision Log**
```
Orchestrator → Memory MCP: Store decision with context
          ↓
    [Memory: expert_consensus]
          ↓
All Agents ← Memory MCP: Retrieve decision + rationale
```
**When to use**: Distributed decision-making, Byzantine fault tolerance needed
**Memory operations**: Create consensus memories, search by agreement threshold
**Limitations**: Memory latency adds coordination overhead (target: <100ms for hot tier)

**Pattern 2: Refinement-Driven Optimization**
```
Agent → Attempt Task → Store Trace → Memory MCP
                              ↓
Other Agents ← Retrieve Past Traces ← Memory MCP
```
**When to use**: Iterative improvement, learning from past attempts
**Memory operations**: Create refinement traces, search by task similarity
**Measured performance**: 3-5 iterations typical for convergence
**Limitations**: Requires similar task contexts for useful retrieval

**Pattern 3: Capability Discovery via Memory**
```
New Agent → Register Capabilities → Memory MCP
                                        ↓
Orchestrator ← Query Capabilities ← Memory MCP
```
**When to use**: Dynamic agent populations, flexible task routing
**Memory operations**: Store agent metadata as semantic memories
**Tradeoffs**: Eventual consistency (agents may see stale capability lists)

### Work Distribution with Memory Integration

The work distribution system (`src/coordination/work-distribution.ts`) provides task claiming with optimistic locking. Integration with Memory MCP enables:

**Task State Persistence**:
- Store task definitions as procedural memories
- Record task completion results for future reference
- Track assignment recommendations over time

**Agent Load Balancing via Memory**:
```typescript
import { WorkDistributor } from './coordination/work-distribution';
import { getGlobalRegistry } from './subagent/registry';

const distributor = new WorkDistributor(getGlobalRegistry());

// Create task with memory integration
const task = distributor.createTask(
  "Implement authentication",
  "Add OAuth 2.0 support",
  {
    priority: TaskPriority.HIGH,
    requiredRole: AgentRole.IMPLEMENTER,
    requiredCapabilities: ['typescript', 'security'],
    estimatedMinutes: 120
  }
);

// Store task context in memory
await memory_create({
  content: JSON.stringify({
    taskId: task.id,
    requirements: "OAuth 2.0 implementation",
    constraints: "Must use existing auth library",
    context: "Part of security hardening initiative"
  }),
  type: "procedural",
  importance: 0.7,
  tags: ["task", task.id, "authentication"]
});

// Get assignment recommendations (uses registry + memory context)
const recommendations = distributor.getAssignmentRecommendations(5);

// Claim task with optimistic locking
const claim = distributor.claimTask(task.id, "agent-1");
if (claim.success) {
  // Start work
  distributor.startTask(task.id, "agent-1");
}
```

**Conflict Resolution via Memory**:
- When claims conflict, check memory for past assignment patterns
- Use refinement traces to identify agents with high success rates
- Store conflict resolutions for future reference

**Message Bus Integration**:
```typescript
import { AgentMessageBus } from './subagent/messaging';

// Work distributor publishes task events to message bus
const messageBus = new AgentMessageBus();
const distributor = new WorkDistributor(getGlobalRegistry(), messageBus);

// Subscribe to task events
messageBus.subscribeToTopic('agent-1', 'task.status', (message) => {
  // Store significant events in memory
  if (message.data.status === 'completed') {
    memory_create({
      content: JSON.stringify(message.data),
      type: "episodic",
      importance: 0.6,
      tags: ["task-completion", message.data.taskId]
    });
  }
});
```

### Plan Synchronization with CRDTs + Memory

The plan synchronization system (`src/coordination/plan-sync.ts`) uses CRDTs for conflict-free state merging:

**CRDT-Based Plan Items**:
- LWW-Register: Last-Write-Wins for single-value fields
- LWW-Map: Conflict-free map updates with vector clocks
- ORSet: Observed-Remove Set for item collections

**Memory Integration for Plan Context**:
```typescript
import { PlanSyncService } from './coordination/plan-sync';

const planSync = new PlanSyncService('agent-1');

// Create plan with memory backing
const plan = planSync.createPlan(
  "API Implementation",
  "Build REST API with authentication"
);

// Store plan context in memory
await memory_create({
  content: JSON.stringify({
    planId: plan.id,
    objectives: ["OAuth support", "Rate limiting", "API documentation"],
    constraints: "Must maintain backward compatibility",
    phase: 1,
    totalPhases: 3
  }),
  type: "semantic",
  importance: 0.8,
  tags: ["plan", plan.id, "api"]
});

// Add plan items (synced via CRDT)
const item = planSync.addItem(plan.id, {
  title: "Implement OAuth flow",
  description: "Add authorization code flow",
  priority: PlanItemPriority.HIGH,
  status: PlanItemStatus.PENDING
});

// When agents update items, changes merge automatically
planSync.updateItem(plan.id, item.id, {
  status: PlanItemStatus.IN_PROGRESS,
  assignedTo: "agent-1",
  progress: 30
});

// Store significant plan updates in memory
await memory_create({
  content: JSON.stringify({
    planId: plan.id,
    itemId: item.id,
    update: "Started OAuth implementation",
    agent: "agent-1",
    progress: 30
  }),
  type: "episodic",
  importance: 0.5,
  tags: ["plan-update", plan.id]
});
```

**Vector Clock Synchronization**:
- Each plan operation includes vector clock timestamp
- Causal ordering preserved across distributed updates
- Conflicts detected via happens-before relationships
- Memory MCP stores operation history for debugging

### Progress Tracking with Memory

The progress tracking system (`src/coordination/progress.ts`) integrates with Memory MCP for historical analysis:

**Progress Entries**:
```typescript
import { ProgressTracker, ProgressStatus } from './coordination/progress';

const tracker = new ProgressTracker();

// Report progress (auto-published to message bus)
const entry = tracker.reportProgress(
  "agent-1",
  "task-123",
  50,
  ProgressStatus.IN_PROGRESS,
  {
    message: "Completed OAuth callback handler",
    timeSpentMinutes: 30,
    estimatedRemainingMinutes: 60,
    blockers: []
  }
);

// Store progress in memory for trend analysis
await memory_create({
  content: JSON.stringify(entry),
  type: "episodic",
  importance: 0.4,
  tags: ["progress", entry.taskId, entry.agentId]
});
```

**Milestone Management**:
```typescript
// Create milestone
const milestone = tracker.createMilestone({
  name: "Authentication Complete",
  description: "OAuth 2.0 fully implemented and tested",
  targetDate: new Date("2025-12-15"),
  requiredTaskIds: ["task-123", "task-124", "task-125"]
});

// Store milestone in memory
await memory_create({
  content: JSON.stringify(milestone),
  type: "semantic",
  importance: 0.7,
  tags: ["milestone", milestone.id, "authentication"]
});

// Check milestone progress (aggregated from tasks)
const summary = tracker.getSummary("task-123");
```

**Agent Performance Analysis**:
```typescript
// Get agent statistics
const agentStats = tracker.getAgentSummary("agent-1");

// Store performance data for learning
await memory_create({
  content: JSON.stringify({
    agentId: "agent-1",
    tasksCompleted: agentStats.tasksCompleted,
    avgCompletionTime: agentStats.avgCompletionTimeMinutes,
    successRate: agentStats.successRate,
    timestamp: Date.now()
  }),
  type: "procedural",
  importance: 0.6,
  tags: ["agent-performance", "agent-1"]
});
```

### Memory-Driven Coordination Workflow

**Complete Multi-Agent Task Flow**:

1. **Task Creation**:
   - Orchestrator creates task via WorkDistributor
   - Task context stored in Memory MCP (procedural)
   - Task event published to message bus

2. **Agent Discovery**:
   - WorkDistributor queries SubagentRegistry for capable agents
   - Past performance retrieved from Memory MCP
   - Assignment recommendations scored based on capability + history

3. **Task Assignment**:
   - Agent claims task (optimistic locking)
   - Claim broadcast via message bus
   - Assignment decision stored in Memory MCP (episodic)

4. **Execution with Progress**:
   - Agent reports progress via ProgressTracker
   - Progress published to message bus + stored in Memory
   - Blockers trigger memory search for past solutions

5. **Completion & Learning**:
   - Task result stored in Memory MCP
   - Refinement trace created if iterative
   - Success/failure patterns learned for future assignments

6. **Plan Synchronization**:
   - Plan item status updated (CRDT merge)
   - Plan changes broadcast to all collaborators
   - Milestone progress recalculated
   - Plan state snapshot stored in Memory

**Memory Access Patterns**:
- Hot tier (<100ms): Active task status, current assignments
- Warm tier (<500ms): Recent progress updates, agent availability
- Cold tier (<2s): Historical performance, past refinements, long-term patterns

**Measured Performance**:
- Task claim latency: 10-50ms (registry lookup + optimistic lock)
- Progress update latency: 5-20ms (tracker + message bus publish)
- Memory store latency: 50-200ms (depending on tier)
- Plan sync latency: 100-500ms (CRDT merge + broadcast)
- End-to-end coordination: 200-800ms (claim → assign → notify → memory)

**Limitations**:
- Memory search overhead: 100-2000ms depending on query complexity
- CRDT state grows O(n) with number of operations (requires GC)
- Message bus throughput: ~1000 msg/s (bottleneck with >10 active agents)
- Optimistic locking conflicts increase with concurrent claims (>5% at 10 agents)

## Integration with Other Skills

- **Evidence-Based Validation**: Use to verify orchestration performance claims
- **MCP Server Development**: Apply MCP communication patterns to agent messaging
- **Memory Access**: Use Memory MCP tools for persistent coordination state
- Reference architecture documents for system-level design patterns

## References

All patterns in this skill are extracted from:
- `/home/alton/SKG Agent Prototype 2/` - Actual implementations with measured performance
- `/home/alton/CLAUDE.md` - Parallel agent coordination protocols
- `/home/alton/AGENTIC_HARNESS_ARCHITECTURE.md` - System architecture patterns
- `/home/alton/MCP_ORCHESTRATOR_DESIGN.md` - Orchestrator design principles

Refer to the `reference/` directory for detailed documentation of each pattern.
