# Agent Communication System Skill

## Overview

This skill provides practical implementation guidance for inter-agent communication systems. It covers message routing, shared data pools, quality gates, and Memory MCP integration based on the Sartor-Claude-Network implementation with references to historical SKG Agent Prototype patterns.

## When to Use

- Implementing agent coordinators or orchestrators
- Creating communicative agents with messaging capabilities
- Designing message protocols and routing patterns
- Managing shared data between agents
- Building quality gates for agent outputs
- Debugging agent communication issues
- Optimizing message throughput and latency

## Key Topics Covered

### 1. Sartor-Claude-Network Message Bus
Real-time agent communication system with pub/sub messaging.

**Implementation**: `/home/alton/Sartor-claude-network/src/subagent/messaging.ts`

Features:
- Priority-based message queuing (CRITICAL, HIGH, NORMAL, LOW)
- Direct messaging (agent-to-agent)
- Broadcast messaging (all agents)
- Topic-based pub/sub with filters
- Request/response with timeout
- Automatic delivery tracking and acknowledgment

### 2. Work Distribution with Message Bus Integration
Task assignment system that publishes lifecycle events to message bus.

**Implementation**: `/home/alton/Sartor-claude-network/src/coordination/work-distribution.ts`

Features:
- Task creation, claiming, and completion
- Optimistic locking for concurrent claims
- Publishes to "task.status" topic automatically
- Dependency management and blocking
- Agent eligibility checking
- Assignment recommendations

### 3. Memory MCP for Persistent Shared State
Multi-tier memory system for agent learning and coordination history.

**Implementation**: `/home/alton/Sartor-claude-network/src/mcp/server.ts`

Memory Types:
- Episodic memory (specific agent interactions)
- Semantic memory (learned facts about agents)
- Procedural memory (successful workflow patterns)
- Working memory (active coordination state)

Integration:
- Store collaboration experiences
- Query agent capabilities from history
- Learn from past task assignments
- Track coordination patterns

### 4. Reference Patterns (Historical)
Additional communication patterns from SKG Agent Prototype implementations:

**File-Based Communication**:
- JSON files for asynchronous coordination
- Human-readable audit trail
- Best for long-running tasks

**Shared Data Pool Management**:
- Central storage with access tracking
- Tag-based search and citation graphs
- Conflict detection with version numbers

**Quality Gates and Validation**:
- Automated output quality checkpoints
- Citation checks, peer review, format validation
- Blocking and non-blocking enforcement

**Assistance Request and Routing**:
- Capability-based agent selection
- Historical success scoring
- Dynamic load balancing

## Communication Patterns

### Pattern 1: Hierarchical Orchestration
- Centralized coordinator with worker agents
- Quality gates and shared data management
- Best for: Clear hierarchy, need for validation

### Pattern 2: File-Based Async Communication
- JSON files for agent messages
- Excellent audit trail
- Best for: Long-running tasks, human-readable traces

### Pattern 3: MCP Hub-and-Spoke
- Central router with agent subscribers
- Topic-based pub-sub
- Best for: Multiple agent types, network-based communication

## Debugging

### Message Tracing
Track message lifecycle from send to delivery with trace events.

### Coordination Flow Analysis
Monitor message throughput, latency, queue depths, and agent availability.

### Common Issues
- Messages not delivered → Check agent availability, routing logic, TTL
- Slow coordination → Check queue depths, quality gate time, agent count
- Quality gates failing → Check criteria strictness, output format, reviewers
- Deadlock → Check circular dependencies, blocking gates, full queues

## Integration with Other Skills

- **multi-agent-orchestration**: Theoretical foundation (consensus, CRDTs)
- **evidence-based-validation**: Apply to performance claims
- **mcp-server-development**: MCP protocol details
- **distributed-systems-debugging**: Diagnose coordination failures

## Evidence-Based Language

### Avoid (without measurement):
- "Guaranteed delivery"
- "Zero-latency communication"
- "Perfect coordination"
- "Eliminates all conflicts"

### Use instead:
- "Delivery with retry and timeout"
- "Measured latency: requires testing"
- "Best-effort coordination with quality gates"
- "Conflict detection with configurable resolution"

## References

### Sartor-Claude-Network Implementation (Primary)
- `/home/alton/Sartor-claude-network/src/subagent/messaging.ts` - Message bus
- `/home/alton/Sartor-claude-network/src/coordination/work-distribution.ts` - Task distribution
- `/home/alton/Sartor-claude-network/src/subagent/registry.ts` - Agent registry
- `/home/alton/Sartor-claude-network/src/subagent/bootstrap.ts` - Agent bootstrapping
- `/home/alton/Sartor-claude-network/src/mcp/server.ts` - Memory MCP server

### Historical Reference Implementations
- `/home/alton/SKG-Agent-Prototype-Private/src/ai/communication/`
- `/home/alton/SKG Agent Prototype 2/docs/communication-protocols.md`
- `/home/alton/agent-community-game/agents/improvement-coordination/communication-protocol.md`

## Usage with Claude Code

Invoke this skill when:
- User asks about agent communication implementation
- Building or debugging coordinators/orchestrators
- Designing message protocols
- Implementing quality gates
- Troubleshooting multi-agent systems

The skill provides practical, evidence-based guidance rooted in your actual working implementations.
