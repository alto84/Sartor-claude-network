# Memory System Architecture Research

## Overview

The memory system provides persistent storage for agent memories across sessions, enabling knowledge retention, shared context in swarms, and learning from past interactions.

**Source Files:**
- `framework/memory/memory-store.ts` - Core implementation
- `framework/memory/memory-benchmark.ts` - Performance testing suite
- `framework/memory/README.md` - Architecture documentation
- `framework/memory/MEMORY_SKILL.md` - Agent usage guide

## Memory Types

### 1. Episodic Memory

**Purpose:** Store specific events and interactions

**Characteristics:**
- Timestamped entries organized by date
- Queryable by time, topic, and agent
- Retention: Time-based (30 days default policy)

**Storage Path:** `.swarm/memory/episodic/{date}.json`

**Use Cases:**
- Session logs
- Task completions
- Discoveries during exploration

### 2. Semantic Memory

**Purpose:** Store general knowledge and facts

**Characteristics:**
- Topic-based organization
- Persistent facts and learned patterns
- Retention: Entry-count based (1000 entries max per topic)

**Storage Path:** `.swarm/memory/semantic/{topic}.json`

**Use Cases:**
- Codebase insights
- Learned patterns
- Documentation findings
- Concepts and relationships

### 3. Working Memory

**Purpose:** Current session context

**Characteristics:**
- Per-agent storage
- Cleared between sessions (1-day default retention)
- Temporary scratchpad for active tasks

**Storage Path:** `.swarm/memory/working/{agent_id}.json`

**Use Cases:**
- Active task state
- Temporary calculations
- Session context

### 4. Coordination Memory (Skill-Level Extension)

**Purpose:** Inter-agent communication

**Characteristics:**
- Short-term retention for message passing
- Supports broadcast and targeted messages
- Priority levels for message importance

**Storage Path:** `.swarm/memory/coordination/messages.jsonl`

**Use Cases:**
- Broadcasting findings
- Requesting help
- Status updates

## Core Data Structures

### MemoryEntry Interface
```typescript
interface MemoryEntry {
  id: string;
  type: 'episodic' | 'semantic' | 'working';
  content: string;
  metadata: {
    timestamp: string;
    agent_id?: string;
    session_id?: string;
    topic?: string;
    tags?: string[];
    source?: string;
  };
}
```

### QueryFilter Interface
```typescript
interface QueryFilter {
  type?: 'episodic' | 'semantic' | 'working';
  topic?: string;
  agent_id?: string;
  tags?: string[];
  after?: string;   // ISO date string
  before?: string;  // ISO date string
  limit?: number;
  search?: string;  // Text search
}
```

## Key API Functions

| Function | Purpose |
|----------|---------|
| `storeMemory(entry)` | Store a new memory entry |
| `queryMemory(filter)` | Query memories with filters |
| `summarizeMemories(filter, maxTokens)` | Generate summarized context |
| `clearWorkingMemory(agentId)` | Clear agent's working memory |
| `applyRetentionPolicy(policy)` | Clean up old memories |
| `runCleanup(policies?)` | Run default cleanup policies |
| `getMemoryStats()` | Get storage statistics |

## Caching Layer

The memory store includes an in-memory caching layer for performance:

**Cache Configuration:**
- TTL: 60,000ms (1 minute) default
- Max Entries: 100 cached files
- Cleanup Interval: 30,000ms (30 seconds)
- Eviction Policy: LRU (Least Recently Used)

**Cache Management Functions:**
- `configureCaching(config)` - Adjust cache settings
- `getCacheStats()` - View cache status
- `clearCache()` - Manually clear cache

## Retention Policies

Default cleanup policies:
- **Episodic:** Keep 30 days
- **Working:** Keep 1 day
- **Semantic:** Keep max 1000 entries per topic

Custom policies can specify:
- `maxAgeDays` - Delete entries older than N days
- `maxEntries` - Keep only newest N entries
- `topic` - Apply only to specific topic

## Integration with Agents

### Context Injection Methods

1. **System Prompt Injection**
   - Bootstrap loader injects summarized relevant memories
   - Configurable max tokens (default: 2000)
   - Topic-based filtering

2. **Tool Access**
   - Agents can query/store during execution via TypeScript API
   - Bash-based access for simpler operations

3. **Session Handoff**
   - Working memory transfer between agents
   - Environment variables: `AGENT_ID`, `AGENT_TYPE`, `SWARM_MEMORY_PATH`

### Bootstrap Configuration

```typescript
interface BootstrapConfig {
  memory: {
    inject_relevant: boolean;
    max_context_tokens: number;
    topics: string[];  // e.g., ['mission', 'recent_findings', 'patterns']
  };
  // ...
}
```

## Storage Format

Memories are stored as JSON files with the structure:
```json
{
  "entries": [/* MemoryEntry[] */],
  "last_updated": "ISO timestamp"
}
```

## Performance Characteristics

The benchmark suite (`memory-benchmark.ts`) measures:

| Operation Type | Measured Metrics |
|----------------|------------------|
| Store (small/medium/large) | Ops/sec, avg time |
| Query (by type/topic/agent/text) | Ops/sec, avg time |
| Cache hit/miss performance | Speedup factor |
| Large dataset handling | Scalability |

**Note:** Actual performance numbers require running the benchmark suite.

## Limitations and Observations

1. **File-Based Storage:** All memory is stored as JSON files on disk, which may have scalability limits for very large swarms
2. **No Vector Search:** Text search is simple string matching, not semantic similarity
3. **Single-Node Design:** No distributed storage or replication
4. **Manual Summarization:** Summarization uses simple truncation, not LLM-based summarization
5. **Cache Invalidation:** Cache is invalidated on write but TTL-based expiry may serve stale reads

## Best Practices (from MEMORY_SKILL.md)

1. **Be Specific:** Store discrete, searchable facts, not large text blobs
2. **Tag Appropriately:** Use consistent topics and tags for easy retrieval
3. **Timestamp Everything:** Always include timestamps for temporal queries
4. **Clean Up Working Memory:** Clear working memory when task completes
5. **Use Coordination Sparingly:** Only broadcast high-value findings

---
*Research completed by memory-system-researcher agent*
*Request ID: req-1765848539471-8nwhuj*
