# Claude Memory System - Final Integration Plan

## Executive Summary

This document provides the comprehensive, actionable plan for building a multi-tier episodic memory system for Claude. The system uses your existing **home-claude-network** Firebase project, GitHub for archival storage, vector databases for semantic search, and MCP (Model Context Protocol) for exposing memory operations to Claude instances across all surfaces (Claude.ai, Claude Code, API).

**Key Innovation**: This system gives Claude persistent, cross-session episodic memory that improves with new models - memories created today will be accessible and enhanced by future Claude versions.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLAUDE SURFACES (Clients)                            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│  │ Claude.ai │  │ Claude    │  │ Claude    │  │ API       │  │ Slack/    │ │
│  │ (Web)     │  │ Desktop   │  │ Code      │  │ Clients   │  │ Discord   │ │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘ │
│        │              │              │              │              │        │
└────────┼──────────────┼──────────────┼──────────────┼──────────────┼────────┘
         │              │              │              │              │
         └──────────────┴──────────────┼──────────────┴──────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │    MCP MEMORY SERVER    │
                          │  (Streamable HTTP +     │
                          │   stdio transports)     │
                          │                         │
                          │  ┌───────────────────┐  │
                          │  │ Memory Tools      │  │
                          │  │ • store_memory    │  │
                          │  │ • recall_memories │  │
                          │  │ • consolidate     │  │
                          │  │ • sync_memories   │  │
                          │  └───────────────────┘  │
                          └────────────┬────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   TIER 1: HOT   │         │  TIER 2: WARM   │         │  TIER 3: COLD   │
│                 │         │                 │         │                 │
│ Firebase RTDB   │◄────────│ Firestore +     │◄────────│ GitHub Repo     │
│                 │ promote │ Qdrant Vector   │ promote │                 │
│ • Working Mem   │─────────│                 │─────────│ • Full Archive  │
│ • Active Sess   │ demote  │ • Episodic Mem  │ demote  │ • Version Hist  │
│ • Agent Mail    │         │ • Semantic Mem  │         │ • Skills Repo   │
│ • Presence      │         │ • Embeddings    │         │ • Artifacts     │
│                 │         │                 │         │                 │
│ Latency: <100ms │         │ Latency: 100-   │         │ Latency: 1-5s   │
│ TTL: 1-24 hrs   │         │ 500ms           │         │ Retention: ∞    │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                             │                             │
         └─────────────────────────────┼─────────────────────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │  SYNCHRONIZATION ENGINE │
                          │                         │
                          │  • Promotion/Demotion   │
                          │  • Embedding Generation │
                          │  • Decay & Forgetting   │
                          │  • Consolidation        │
                          │  • Conflict Resolution  │
                          └─────────────────────────┘
```

---

## Component Integration Map

### How Components Connect

| Component         | Connects To         | Connection Type          | Purpose                     |
| ----------------- | ------------------- | ------------------------ | --------------------------- |
| **MCP Server**    | All Claude surfaces | Streamable HTTP / stdio  | Unified memory API          |
| **MCP Server**    | Firebase RTDB       | Firebase SDK (WebSocket) | Real-time hot memory        |
| **MCP Server**    | Firestore           | Firebase Admin SDK       | Warm memory storage         |
| **MCP Server**    | Qdrant              | REST API / gRPC          | Vector similarity search    |
| **MCP Server**    | GitHub              | REST API / Git CLI       | Archival storage            |
| **MCP Server**    | OpenAI              | REST API                 | Embedding generation        |
| **Firebase RTDB** | Firestore           | Cloud Functions          | Promotion/demotion triggers |
| **Firestore**     | GitHub              | GitHub Actions           | Scheduled archival          |
| **Qdrant**        | Firestore           | Sync process             | Embedding updates           |

---

## Detailed Integration Architecture

### 1. MCP Server as Central Hub

The MCP server is the single point of entry for all memory operations. It handles:

```typescript
// MCP Server Structure
claude-memory-server/
├── src/
│   ├── index.ts              // Server entry point
│   ├── mcp/
│   │   ├── tools/            // MCP tool implementations
│   │   │   ├── store.ts      // store_memory tool
│   │   │   ├── recall.ts     // recall_memories tool
│   │   │   ├── update.ts     // update_memory tool
│   │   │   ├── forget.ts     // forget_memory tool
│   │   │   ├── consolidate.ts
│   │   │   ├── sync.ts
│   │   │   ├── archive.ts
│   │   │   └── restore.ts
│   │   ├── resources/        // MCP resource definitions
│   │   └── prompts/          // MCP prompt templates
│   ├── storage/
│   │   ├── hot/              // Firebase RTDB adapter
│   │   ├── warm/             // Firestore + Qdrant adapter
│   │   └── cold/             // GitHub adapter
│   ├── algorithms/
│   │   ├── importance.ts     // Importance scoring
│   │   ├── decay.ts          // Memory decay
│   │   ├── consolidation.ts  // Memory merging
│   │   └── retrieval.ts      // Multi-factor ranking
│   └── sync/
│       ├── promoter.ts       // Cold → Warm → Hot
│       ├── demoter.ts        // Hot → Warm → Cold
│       └── reconciler.ts     // Conflict resolution
├── package.json
└── tsconfig.json
```

### 2. Firebase RTDB (Tier 1: Hot Memory)

Uses your existing **home-claude-network-default-rtdb**:

```javascript
// Firebase RTDB Structure for home-claude-network
{
  "agents": {
    "{agentId}": {
      "status": "online|offline|busy",
      "currentTask": "...",
      "capabilities": ["memory", "search", "code"],
      "lastHeartbeat": 1733500800000
    }
  },

  "presence": {
    "{agentId}": {
      "connections": {
        "{connectionId}": true
      },
      "lastOnline": 1733500800000
    }
  },

  "mailboxes": {
    "{agentId}": {
      "inbox": {
        "{pushKey}": {
          "from": "agent_claude_web",
          "type": "memory_update",
          "payload": {...},
          "timestamp": 1733500800000,
          "read": false
        }
      }
    }
  },

  "workingMemory": {
    "{sessionId}": {
      "context": {
        "currentTopic": "project_alpha",
        "recentQueries": [...],
        "activeMemories": ["mem_001", "mem_002"]
      },
      "version": 5,
      "updatedBy": "agent_claude_code",
      "ttl": 1733587200000
    }
  },

  "hotMemories": {
    "{memoryId}": {
      "content": "User prefers dark mode",
      "type": "preference",
      "accessCount": 42,
      "lastAccessed": 1733504400000,
      "promotedAt": 1733490000000,
      "ttl": 1733587200000
    }
  }
}
```

### 3. Firestore + Qdrant (Tier 2: Warm Memory)

**Firestore collections**:

```
memories/
  ├── {memoryId}/
  │   ├── content: string
  │   ├── type: "episodic" | "semantic" | "procedural"
  │   ├── metadata: {...}
  │   ├── importance: 0.85
  │   ├── accessCount: 15
  │   ├── createdAt: Timestamp
  │   ├── lastAccessedAt: Timestamp
  │   ├── embeddingId: "emb_xxx"  // Reference to Qdrant
  │   └── relations: [{targetId, type, strength}]

episodicDetails/
  ├── {memoryId}/
  │   ├── messages: [...]
  │   ├── participants: [...]
  │   ├── emotionalContext: {...}
  │   └── outcomes: [...]

semanticDetails/
  ├── {memoryId}/
  │   ├── subject: string
  │   ├── predicate: string
  │   ├── object: string
  │   ├── confidence: 0.9
  │   └── evidence: [...]
```

**Qdrant collection**:

```python
# Qdrant collection configuration
{
  "collection_name": "claude_memories",
  "vectors": {
    "size": 1536,  # OpenAI text-embedding-3-small
    "distance": "Cosine"
  },
  "payload_schema": {
    "memory_id": "keyword",
    "memory_type": "keyword",
    "importance": "float",
    "created_at": "datetime",
    "user_id": "keyword",
    "tags": "keyword[]"
  }
}
```

### 4. GitHub (Tier 3: Cold Memory)

**Repository structure**:

```
alto84/claude-memory-archive/
├── README.md
├── memories/
│   └── {userId}/
│       └── {year}/
│           └── {month}/
│               └── {memoryId}.md
├── skills/
│   └── {skillName}/
│       ├── skill.yaml
│       └── implementation.py
├── artifacts/
│   └── {sessionId}/
│       ├── plans/
│       ├── mindmaps/
│       └── documents/
├── embeddings/
│   └── skill-embeddings.json
└── .github/
    └── workflows/
        ├── consolidate.yml    # Weekly consolidation
        ├── archive.yml        # Daily archival
        └── cleanup.yml        # Monthly cleanup
```

**Memory file format**:

```markdown
---
id: mem_abc123
type: episodic
user_id: user_123
importance: 0.75
created_at: 2025-12-06T10:30:00Z
archived_at: 2025-12-06T15:00:00Z
tags: [project, deployment, success]
source_surface: claude_code
---

# Conversation: Successful Deployment

## Summary

User successfully deployed the application to production after debugging
the authentication issue.

## Key Points

- Fixed JWT token expiration bug
- Deployed to AWS ECS
- User expressed satisfaction with the result

## Emotional Context

- Valence: 0.8 (positive)
- Sentiment: relieved, accomplished

## Related Memories

- mem_def456 (previous debugging session)
- mem_ghi789 (AWS setup)
```

---

## Data Flow Patterns

### Memory Creation Flow

```
1. Claude receives user input
2. MCP server: store_memory() called
3. Memory written to Firestore (warm tier)
4. Embedding generated via OpenAI API
5. Embedding stored in Qdrant with metadata
6. If memory is high-priority:
   - Promoted to Firebase RTDB (hot tier)
   - TTL set based on importance
7. Success response to Claude
```

### Memory Recall Flow

```
1. Claude needs context/memory
2. MCP server: recall_memories() called
3. Tier 1 (Hot): Check Firebase RTDB cache
   - If hit: Return immediately (<100ms)
4. Tier 2 (Warm): Vector search in Qdrant
   - Generate query embedding
   - Search with filters (user_id, type, etc.)
   - Fetch full memories from Firestore
   - Apply multi-factor ranking
5. Tier 3 (Cold): If needed, search GitHub
   - Use GitHub API search
   - Parse markdown files
   - Lower priority in ranking
6. Aggregate results
7. Update access counts
8. Promote frequently accessed to higher tier
9. Return ranked results to Claude
```

### Memory Decay & Consolidation Flow

```
Daily Background Job:
1. Apply decay to all memories
   - new_importance = current × e^(-decay_rate × hours/24)
2. Identify memories below threshold
   - Archive if importance < 0.1
   - Demote hot → warm if importance < 0.5
3. Find consolidation candidates
   - Cluster similar memories (similarity > 0.7)
   - Generate consolidated summary via LLM
   - Link original memories to consolidated
4. Sync changes across tiers
5. Push archives to GitHub
```

---

## Integration with Existing Research

### Using the Memory Schema (memory-schema.ts)

The TypeScript schema provides the complete type system:

```typescript
import {
  EpisodicMemory,
  SemanticMemory,
  WorkingMemory,
  MemoryQuery,
  MemoryType,
} from './memory-schema';

// Create episodic memory from conversation
const episode: EpisodicMemory = {
  id: generateId(),
  type: MemoryType.EPISODIC,
  content: {
    title: 'Deployment debugging session',
    messages: [...conversationHistory],
    summary: await summarize(conversationHistory),
  },
  emotionalContext: {
    valence: 0.8,
    arousal: 0.5,
    sentiment: 'positive',
  },
  // ... full schema fields
};
```

### Using the MCP Tools (mcp-memory-system-specification.md)

Each tool maps to an MCP operation:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(name="claude-memory", version="1.0.0")

@mcp.tool()
async def store_memory(
    content: str,
    context: dict = None,
    metadata: dict = None
) -> dict:
    """Store new information with automatic categorization."""
    memory = await create_memory(content, context, metadata)
    await warm_storage.store(memory)
    await vector_store.index(memory.id, memory.embedding)
    return {"memory_id": memory.id, "success": True}

@mcp.tool()
async def recall_memories(
    query: str,
    filters: dict = None,
    ranking: dict = None,
    limit: int = 10
) -> dict:
    """Semantic search with multi-factor ranking."""
    # Check hot tier first
    hot_results = await hot_storage.search(query, limit)
    if hot_results.sufficient:
        return format_results(hot_results)

    # Vector search in warm tier
    embedding = await generate_embedding(query)
    candidates = await vector_store.search(embedding, limit * 3)
    memories = await warm_storage.batch_get(candidates.ids)

    # Apply ranking
    ranked = rank_memories(memories, query, ranking)
    return format_results(ranked[:limit])
```

### Using the Scoring Algorithms (importance-scoring.ts, memory-decay.ts)

```typescript
import { calculateImportanceScore } from './importance-scoring';
import { applyDecay, shouldArchive } from './memory-decay';

// When accessing a memory
memory.accessCount++;
memory.lastAccessedAt = now();
memory.importance = calculateImportanceScore(memory, currentContext);

// Daily maintenance
for (const memory of allMemories) {
  const newImportance = applyDecay(memory);
  if (shouldArchive(memory, newImportance)) {
    await archiveToGitHub(memory);
    await removeFromWarmTier(memory);
  } else {
    memory.importance = newImportance;
    await updateMemory(memory);
  }
}
```

---

## Cross-Surface Synchronization

### How Memories Flow Between Claude Surfaces

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER: "John"                                │
│                                                                 │
│  Claude.ai (Web)         Claude Code            Claude Desktop  │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐ │
│  │ Session A   │        │ Session B   │        │ Session C   │ │
│  │             │        │             │        │             │ │
│  │ "User is    │        │ "User works │        │ "User likes │ │
│  │  learning   │        │  on Python  │        │  dark mode" │ │
│  │  Spanish"   │        │  projects"  │        │             │ │
│  └──────┬──────┘        └──────┬──────┘        └──────┬──────┘ │
│         │                      │                      │        │
│         └──────────────────────┼──────────────────────┘        │
│                                │                               │
│                                ▼                               │
│              ┌─────────────────────────────────┐               │
│              │     SHARED MEMORY LAYER         │               │
│              │                                 │               │
│              │  user_john/                     │               │
│              │   ├── preferences/              │               │
│              │   │   ├── dark_mode: true       │               │
│              │   │   └── language_learning:    │               │
│              │   │       spanish               │               │
│              │   ├── skills/                   │               │
│              │   │   └── python: expert        │               │
│              │   └── context/                  │               │
│              │       └── current_projects      │               │
│              │                                 │               │
│              └─────────────────────────────────┘               │
│                                                                 │
│  ➜ Next session on ANY surface has access to all memories      │
└─────────────────────────────────────────────────────────────────┘
```

### Conflict Resolution Strategy

When the same memory is modified from multiple surfaces:

```typescript
const resolveConflict = (local: Memory, remote: Memory): Memory => {
  // Version-based resolution
  if (local.sync.version !== remote.sync.version) {
    // Content hash comparison
    if (local.sync.contentHash === remote.sync.contentHash) {
      // Same content, just merge metadata
      return mergeMetadata(local, remote);
    }

    // Different content - apply resolution strategy
    switch (config.conflictResolution) {
      case 'latest_wins':
        return local.lastModifiedAt > remote.lastModifiedAt ? local : remote;

      case 'highest_importance':
        return local.importance > remote.importance ? local : remote;

      case 'merge':
        return await llmMerge(local, remote);

      case 'manual':
        await createConflictNotification(local, remote);
        return local; // Keep local until manually resolved
    }
  }

  return local;
};
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Deliverables:**

- [ ] Update Firebase security rules (production-ready)
- [ ] Create MCP server skeleton with FastMCP
- [ ] Implement `store_memory` and `recall_memories` tools
- [ ] Set up Firestore collections
- [ ] Configure stdio transport for Claude Code

**Files to Create:**

```
claude-memory-server/
├── src/index.ts
├── src/mcp/tools/store.ts
├── src/mcp/tools/recall.ts
├── src/storage/warm/firestore.ts
├── package.json
└── tsconfig.json
```

### Phase 2: Vector Search (Weeks 3-4)

**Deliverables:**

- [ ] Deploy Qdrant (self-hosted or cloud)
- [ ] Implement embedding generation pipeline
- [ ] Build hybrid retrieval (semantic + keyword)
- [ ] Implement multi-factor ranking algorithm

**Files to Create:**

```
src/storage/warm/qdrant.ts
src/algorithms/retrieval.ts
src/algorithms/ranking.ts
src/embedding/openai.ts
```

### Phase 3: Hot Memory (Weeks 5-6)

**Deliverables:**

- [ ] Implement Firebase RTDB hot tier
- [ ] Build promotion/demotion logic
- [ ] Add real-time sync between tiers
- [ ] Implement working memory for sessions

**Files to Create:**

```
src/storage/hot/firebase-rtdb.ts
src/sync/promoter.ts
src/sync/demoter.ts
```

### Phase 4: Cold Storage & Archives (Weeks 7-8)

**Deliverables:**

- [ ] Create GitHub repository structure
- [ ] Implement archive/restore tools
- [ ] Set up GitHub Actions for automation
- [ ] Build skill repository system

**Files to Create:**

```
src/storage/cold/github.ts
src/mcp/tools/archive.ts
src/mcp/tools/restore.ts
.github/workflows/consolidate.yml
.github/workflows/archive.yml
```

### Phase 5: Advanced Features (Weeks 9-10)

**Deliverables:**

- [ ] Implement memory consolidation with LLM
- [ ] Build decay and forgetting system
- [ ] Add spaced repetition for important memories
- [ ] Implement cross-surface sync

**Files to Create:**

```
src/algorithms/consolidation.ts
src/algorithms/decay.ts
src/algorithms/spaced-repetition.ts
src/sync/cross-surface.ts
```

### Phase 6: Production (Weeks 11-12)

**Deliverables:**

- [ ] Deploy Streamable HTTP transport
- [ ] Implement OAuth 2.1 authentication
- [ ] Set up monitoring and alerting
- [ ] Performance optimization
- [ ] Documentation and testing

---

## Cost Estimates

### Monthly Costs by Scale

| Scale   | Users  | Firebase | Qdrant           | OpenAI | GitHub | Total    |
| ------- | ------ | -------- | ---------------- | ------ | ------ | -------- |
| Starter | 10-100 | $5       | $0 (self-hosted) | $10    | $0     | **$15**  |
| Growth  | 100-1K | $25      | $25 (cloud)      | $50    | $0     | **$100** |
| Scale   | 1K-10K | $100     | $100             | $200   | $4     | **$404** |

### Cost Optimization Strategies

1. **Aggressive tiering**: Keep <5% in hot tier
2. **Embedding caching**: Don't regenerate unchanged content
3. **Batch operations**: Reduce API calls
4. **Compression**: 50%+ reduction in cold storage
5. **TTL enforcement**: Auto-delete expired hot memories

---

## Security Considerations

### Authentication Flow

```
Claude Surface
     │
     ▼
┌─────────────────┐
│ OAuth 2.1 + PKCE │  ─── API Keys for server-to-server
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MCP Server     │  ─── JWT validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Storage Layer  │  ─── Firebase security rules
└─────────────────┘      ─── Row-level security
```

### Data Isolation

- Each user's memories are isolated by `user_id`
- Firebase rules enforce ownership
- Qdrant filters by `user_id` on all queries
- GitHub repos can be per-user or shared

---

## Files Created During This Planning Session

```
/home/user/Sartor-claude-network/
├── ARCHITECTURE.md              # Multi-tier storage spec
├── ARCHITECTURE_SUMMARY.md      # Quick reference
├── memory-schema.ts             # Complete TypeScript schema
├── mcp-memory-system-spec.md    # MCP tool definitions
├── importance-scoring.ts        # Scoring algorithms
├── memory-decay.ts              # Decay functions
├── consolidation.ts             # Consolidation logic
├── spaced-repetition.ts         # Spaced repetition system
├── forgetting-strategy.ts       # Forgetting policies
├── memory-system.ts             # Main orchestration
├── types.ts                     # Shared types
├── example-usage.ts             # Usage examples
├── docs/
│   ├── tier2-warm-memory.md
│   ├── tier3-cold-memory.md
│   ├── synchronization-strategy.md
│   ├── implementation-guide.md
│   └── cost-analysis.md
├── config/
│   ├── firebase-config.json
│   ├── vector-db-config.json
│   └── sync-config.json
├── package.json
├── tsconfig.json
└── FINAL_INTEGRATION_PLAN.md    # This document
```

---

## Next Steps

1. **Immediate**: Update Firebase security rules (currently in test mode)
2. **This Week**: Create MCP server skeleton and first tools
3. **This Month**: Complete Phase 1 & 2 (Foundation + Vector Search)
4. **Ongoing**: Iterate based on real usage patterns

---

## Success Metrics

| Metric               | Target           | Measurement                    |
| -------------------- | ---------------- | ------------------------------ |
| Hot tier hit rate    | >70%             | % of recalls served from RTDB  |
| Recall latency (p95) | <500ms           | Time from query to results     |
| Memory accuracy      | >90%             | Relevance of recalled memories |
| Cross-surface sync   | <30s             | Time for memory to propagate   |
| Storage efficiency   | 80% in cold tier | % of memories in cheapest tier |
| Consolidation rate   | 10% monthly      | Memories consolidated/total    |

---

## Conclusion

This plan provides a complete roadmap for building a production-grade episodic memory system for Claude. The architecture is:

- **Scalable**: Three-tier design handles any volume
- **Fast**: Hot tier provides <100ms access
- **Intelligent**: Semantic search + multi-factor ranking
- **Persistent**: GitHub provides permanent archival
- **Cross-platform**: Works across all Claude surfaces
- **Cost-effective**: Automatic tiering optimizes costs
- **Future-proof**: Memories improve with new Claude models

The foundation is already in place with your Firebase project. Implementation can begin immediately.
