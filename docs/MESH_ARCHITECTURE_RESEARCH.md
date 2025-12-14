# Mesh Memory Architecture Research

## Executive Summary

This document captures research findings for evolving the Sartor Memory MCP Server into a real-time mesh memory system serving multiple Claude instances and other LLMs.

---

## 1. Poetiq Patterns Research

### Key Findings from [Poetiq ARC-AGI Solver](https://github.com/poetiq-ai/poetiq-arc-agi-solver)

Poetiq achieved 54% on ARC-AGI-2 (first to break 50%) by orchestrating existing models rather than training new ones.

#### Core Architectural Patterns

1. **Refinement Loop Architecture**

   ```
   Generate Solution → Receive Feedback → Analyze → Refine → Repeat
   ```

   - Not chain-of-thought, but iterative refinement
   - Multi-step self-improving loop
   - Builds correct solutions incrementally

2. **Multi-Expert Orchestration (Meta-System)**
   - LLM-agnostic meta-system sits on top
   - Calls APIs: Gemini 3 Pro, GPT-5.1, Grok 4 Fast, etc.
   - Learns WHEN to think, WHEN to write code, WHICH model to use
   - Average <2 calls per task (cost efficient)

3. **Self-Auditing**
   - Monitors its own progress
   - Decides when enough information gathered
   - Terminates at optimal moment
   - Prevents wasteful computation

4. **Hypothesis Refinement**
   - Generates hypothesis
   - Tests against training data
   - Refines based on feedback
   - Adjusts parameters, adds conditions, or discards entirely

### Relevance to Our System

Our `src/multi-expert/` already implements similar patterns:

- `orchestrator.ts` - Multi-expert execution
- `feedback-loop.ts` - Iterative refinement
- `soft-scorer.ts` - Self-auditing via scoring
- `voting-system.ts` - Consensus mechanisms

**Gap**: We lack the meta-learning layer that learns WHEN to use each pattern.

---

## 2. Popular MCP Servers Analysis

### Official Reference Implementations

| Server                  | Description                             | Relevance                    |
| ----------------------- | --------------------------------------- | ---------------------------- |
| **Memory**              | Knowledge graph-based persistent memory | Direct competitor/reference  |
| **Filesystem**          | Secure file operations                  | Potential storage backend    |
| **Git**                 | Repository tools                        | Version control for memories |
| **Sequential Thinking** | Dynamic problem-solving                 | Similar to our refinement    |

### Community Memory-Related MCPs

| Server        | Description                   | Key Feature                |
| ------------- | ----------------------------- | -------------------------- |
| **Qdrant**    | Vector search semantic memory | Semantic layer             |
| **Neo4j**     | Graph database                | Relationship queries       |
| **Fireproof** | Immutable ledger DB           | **Live synchronization**   |
| **InstantDB** | Real-time database            | **Real-time capabilities** |
| **Supabase**  | Database + auth + edge        | Full backend               |

### Official MCP Memory Server Patterns

From [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers):

**Data Model:**

- **Entities** - Primary nodes with name, type, observations
- **Relations** - Directed edges between entities (active voice)
- **Observations** - Atomic facts attached to entities

**Storage:** JSONL file-based (`memory.jsonl`)

**9 Core Tools:**

1. `create_entities` - Batch create, skip duplicates
2. `create_relations` - Batch create relationships
3. `add_observations` - Append facts
4. `delete_entities` - Cascade delete
5. `delete_observations` - Remove facts
6. `delete_relations` - Remove edges
7. `read_graph` - Full graph retrieval
8. `search_nodes` - Query across entities
9. `open_nodes` - Get entities + interconnections

**Gap in Official**: No real-time sync, no multi-instance support.

---

## 3. Real-Time Sync Patterns (CRDTs vs OT)

### Operational Transform (OT)

**Pros:**

- Better user intent preservation
- Lower complexity for simple cases O(n)
- Performance-critical path optimization

**Cons:**

- Requires central server coordination
- Higher complexity for distributed O(n²)
- Active server connection required

**Used by:** Google Docs, early collaborative editors

### CRDTs (Conflict-free Replicated Data Types)

**Pros:**

- Works peer-to-peer
- Offline-capable
- Resilient to network issues
- Automatic conflict resolution
- Lower latency (no coordination)
- Horizontal scaling friendly

**Cons:**

- Loses some user intent
- Can produce unexpected merges
- More complex data structures

**Used by:**

- League of Legends chat (7.5M concurrent, 11K msg/sec)
- Apple Notes (offline sync)
- Facebook Apollo & FlightTracker
- Notion/Figma (hybrid approach)

### Two CRDT Approaches

1. **State-based (CvRDTs)**
   - Send full state on every update
   - Merge received states
   - Simpler but more bandwidth

2. **Operation-based (CmRDTs)**
   - Transmit operations directly (+10, -20)
   - Apply operations on receipt
   - Lower bandwidth, needs reliable delivery

### Recommendation for Mesh Memory

**Use CRDT (CmRDT)** for our mesh because:

- Claude instances may go offline
- P2P architecture preferred
- No single point of failure
- Memories must eventually converge

**Hybrid Approach:**

- CRDTs for memory replication
- OT for real-time collaborative editing (if needed)

---

## 4. Current Architecture Analysis

### What We Have

```
┌─────────────────────────────────────────────────────────┐
│                   Memory MCP Server                      │
│              (Single instance, stdio/HTTP)               │
├─────────────────────────────────────────────────────────┤
│  Hot Tier        │  Warm Tier      │  Cold Tier        │
│  (In-memory)     │  (Firebase)     │  (GitHub/Vector)  │
│  <100ms          │  <500ms         │  <2s              │
├─────────────────────────────────────────────────────────┤
│              Multi-Expert System                         │
│  Orchestrator → Experts → Voting → Feedback → Memory    │
└─────────────────────────────────────────────────────────┘
```

### Strengths

- Three-tier memory with appropriate latency targets
- Multi-expert parallel execution
- Feedback loops and scoring
- MCP-compliant (stdio + HTTP)

### Gaps for Mesh Architecture

| Gap                        | Description                     |
| -------------------------- | ------------------------------- |
| **No Instance Discovery**  | Instances can't find each other |
| **No Sync Protocol**       | No way to replicate memories    |
| **Single Writer**          | No concurrent write handling    |
| **No Conflict Resolution** | No CRDT or OT implementation    |
| **No Skills Sharing**      | Skills local to each instance   |
| **No Cross-Agent Comms**   | Agents can't communicate        |

---

## 5. Proposed Mesh Architecture

### Vision: Real-Time Memory Mesh

```
┌─────────────────────────────────────────────────────────────┐
│                    MESH COORDINATOR                          │
│   (WebSocket Server + Service Discovery + CRDT Hub)          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │  Claude #1  │◄──►│  Claude #2  │◄──►│  Claude #3  │    │
│   │  Instance   │    │  Instance   │    │  Instance   │    │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    │
│          │                  │                  │            │
│   ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐    │
│   │ Local MCP   │    │ Local MCP   │    │ Local MCP   │    │
│   │  + CRDT     │    │  + CRDT     │    │  + CRDT     │    │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    │
│          │                  │                  │            │
│          └──────────────────┼──────────────────┘            │
│                             │                               │
│              ┌──────────────▼──────────────┐               │
│              │     SHARED MEMORY LAYER      │               │
│              │  (Firebase + CRDT Replicas)  │               │
│              └─────────────────────────────┘               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    SHARED RESOURCES                          │
│   Skills Library  │  Agent Registry  │  Task Orchestrator   │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Phases

#### Phase 1: WebSocket Real-Time Layer

- Add WebSocket server alongside HTTP
- Server-Sent Events (SSE) for subscriptions
- Memory change notifications
- Instance heartbeats

#### Phase 2: CRDT Memory Replication

- Implement CmRDT for memory operations
- Operation log for sync
- Conflict-free merge
- Offline queue + reconciliation

#### Phase 3: Instance Discovery & Registration

- Agent registry service
- Capability advertisement
- Health monitoring
- Load balancing

#### Phase 4: Shared Skills Library

- Central skill repository
- Version management
- Hot-reload capabilities
- Skill discovery API

#### Phase 5: Cross-Agent Orchestration

- Task delegation protocol
- Result aggregation
- Multi-agent workflows
- LLM-agnostic support

---

## 6. Technical Recommendations

### Short-Term (This Sprint)

1. **Add WebSocket Support**

   ```typescript
   // Extend http-server.ts
   import { WebSocketServer } from 'ws';

   const wss = new WebSocketServer({ server });
   wss.on('connection', (ws) => {
     // Subscribe to memory changes
     // Broadcast updates
   });
   ```

2. **Memory Change Events**

   ```typescript
   interface MemoryEvent {
     type: 'create' | 'update' | 'delete';
     memoryId: string;
     timestamp: number;
     vectorClock: VectorClock;
     payload: Memory;
   }
   ```

3. **CRDT Foundation**
   - Start with G-Counter for simple metrics
   - LWW-Register for memory values
   - OR-Set for collections

### Medium-Term

4. **Operation Log**

   ```typescript
   interface OperationLog {
     operations: CRDTOperation[];
     lastSyncTimestamp: number;
     peerId: string;
   }
   ```

5. **Peer Discovery**
   - Use Firebase Realtime Database for presence
   - Or implement mDNS for local network

### Long-Term

6. **Skill Sharing Protocol**
7. **Multi-LLM Orchestration**
8. **Federated Learning**

---

## 7. Key Sources

### Poetiq

- [Poetiq ARC-AGI Solver](https://github.com/poetiq-ai/poetiq-arc-agi-solver)
- [Traversing the Frontier of Superintelligence](https://poetiq.ai/posts/arcagi_announcement/)

### MCP Servers

- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Awesome MCP Servers](https://github.com/wong2/awesome-mcp-servers)
- [MCP Examples](https://modelcontextprotocol.io/examples)

### Real-Time Sync

- [CRDTs and OT Handbook](https://gaurav789.hashnode.dev/mastering-distributed-collaboration-the-crdt-and-ot-handbook)
- [OT vs CRDT Comparison](https://www.tiny.cloud/blog/real-time-collaboration-ot-vs-crdt/)
- [Redis CRDT Deep Dive](https://redis.io/blog/diving-into-crdts/)
- [CRDT Wikipedia](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)

---

## 8. Next Steps

1. [ ] Review this document with stakeholders
2. [ ] Prioritize implementation phases
3. [ ] Create detailed technical specs for Phase 1
4. [ ] Set up development branch for WebSocket work
5. [ ] Prototype CRDT implementation
6. [ ] Design skill sharing protocol

---

_Document created: 2025-12-09_
_Author: Claude Code Assistant_
