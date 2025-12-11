# Multi-Tier AI Memory System Schema

## Overview

This schema defines a comprehensive memory system for AI agents with four distinct memory tiers, inspired by human cognitive psychology:

1. **Episodic Memory**: Autobiographical memories of specific conversations and interactions
2. **Semantic Memory**: Decontextualized facts, preferences, and knowledge
3. **Procedural Memory**: Learned procedures, workflows, and patterns
4. **Working Memory**: Active session context and current focus

## Design Principles

### 1. Temporal Awareness

Every memory tracks:

- Creation time
- Last access time
- Last modification time
- Full access history for temporal analysis

### 2. Importance-Based Retention

Memories have importance scores that decay over time based on:

- Recency of access
- Access frequency
- User explicit importance
- Emotional significance
- Novelty

### 3. Semantic Search

All memories include:

- Vector embeddings for semantic similarity search
- Full-text search capabilities
- Tag and category based filtering

### 4. Cross-Surface Synchronization

Built-in support for syncing memories across:

- Web interface
- Slack
- API
- Mobile apps
- Desktop apps
- Terminal/CLI

### 5. Relational Structure

Memories can be linked through various relationship types:

- Temporal (preceded by, followed by)
- Semantic (similar to, contradicts, supports)
- Structural (part of, contains, derived from)
- Causal (caused by, causes)
- Procedural (prerequisite for, alternative to)

## Memory Types

### Episodic Memory

**Purpose**: Store specific conversation episodes with rich contextual detail.

**Key Features**:

- Full message history with timestamps
- Narrative structure (beginning, middle, end)
- Emotional context and sentiment
- Key moments and turning points
- Participant information
- Outcomes and follow-ups

**Example Use Cases**:

- Recalling a previous conversation about a specific topic
- Understanding the context of a decision made earlier
- Identifying patterns in user behavior over time
- Providing continuity across sessions

**Typical Lifecycle**:

1. Created at end of conversation or major topic shift
2. High initial importance based on length and engagement
3. Decays slowly if never referenced
4. May be consolidated with related episodes over time
5. Can be mined to create semantic and procedural memories

### Semantic Memory

**Purpose**: Store decontextualized facts and knowledge.

**Key Features**:

- Subject-predicate-object structure
- Confidence levels
- Evidence tracking
- Contradiction detection
- Preference vs. fact distinction

**Example Use Cases**:

- User preferences ("prefers dark mode")
- Personal information ("lives in San Francisco")
- Domain knowledge ("expert in Python")
- Beliefs and goals ("wants to learn machine learning")
- Capabilities and limitations ("has access to GPU")

**Typical Lifecycle**:

1. Extracted from episodic memories
2. Validated against existing knowledge
3. Merged with similar facts
4. Updated when new evidence emerges
5. Flagged if contradictions detected

### Procedural Memory

**Purpose**: Store learned procedures and workflows.

**Key Features**:

- Step-by-step instructions
- Applicability conditions
- Prerequisites and dependencies
- Success rate tracking
- Known failure modes
- Variations and alternatives

**Example Use Cases**:

- "How to set up a Python project"
- "User's preferred code review workflow"
- "Debugging process for React applications"
- "Steps for deploying to production"

**Typical Lifecycle**:

1. Created when a pattern is detected (3+ similar episodes)
2. Refined each time the procedure is executed
3. Success rate updated based on outcomes
4. Variations added when alternative approaches work
5. Archived if success rate drops below threshold

### Working Memory

**Purpose**: Maintain active session context.

**Key Features**:

- Current conversation focus
- Active goals and tasks
- Context stack for nested topics
- Recently activated memories
- Short time-to-live (cleared at session end)
- Consolidation candidates flagged

**Example Use Cases**:

- Tracking current topic during multi-turn conversation
- Maintaining context when user switches topics
- Managing active goals and sub-goals
- Quick access to recently discussed information

**Typical Lifecycle**:

1. Created at session start
2. Updated continuously during conversation
3. Very short decay (minutes to hours)
4. Consolidated to episodic memory at session end
5. Deleted after consolidation

## Key Design Features

### Importance Scoring

Importance is calculated from multiple factors:

```typescript
importance = weighted_sum([
  recency_factor, // Recent memories are more important
  frequency_factor, // Frequently accessed memories retained
  user_explicit, // User-indicated importance
  emotional_factor, // Emotional moments are memorable
  novelty_factor, // Novel information is important
]);
```

### Decay Algorithm

Memories decay over time using an exponential decay function:

```typescript
new_importance = current_importance * exp(-decay_rate * time_since_access);

if (new_importance < decay_threshold && !protected_from_decay) {
  status = ARCHIVED;
}
```

### Conflict Resolution

When contradictory memories are detected:

1. **Detection**: Semantic similarity + opposite valence
2. **Comparison**: Check evidence strength and recency
3. **Resolution**:
   - Keep highest confidence
   - Keep most recent
   - Merge with uncertainty
   - Flag for manual review

### Memory Consolidation

Multiple related memories can be consolidated:

**Strategies**:

- **Merge**: Combine similar memories into one
- **Summarize**: Create abstract summary of multiple episodes
- **Abstract**: Extract general pattern from specific instances
- **Pattern Extract**: Create procedural memory from repeated actions

### Vector Embeddings

Each memory includes an embedding for semantic search:

**Embedding Sources**:

- Full text of episodic memories
- Statement text for semantic memories
- Procedure description for procedural memories
- Conversation summary for working memories

**Search Process**:

1. Embed query text
2. Find k-nearest neighbors in vector space
3. Filter by metadata (type, date, importance)
4. Re-rank by combined score (semantic + temporal + importance)

## Database Schema Recommendations

### Primary Storage

Use a document database (MongoDB, Firestore, DynamoDB) with:

- Fast lookups by ID
- Flexible schema for different memory types
- Support for nested objects
- Rich query capabilities

### Vector Storage

Use a specialized vector database (Pinecone, Weaviate, Qdrant) for:

- Efficient k-NN search
- Filtered vector search
- High-dimensional indexing

### Caching Layer

Use Redis or Memcached for:

- Recently accessed memories
- Current working memory
- Session state
- Query result caching

### Recommended Indexes

See `SUGGESTED_INDEXES` in the schema for optimal index configuration.

## Implementation Considerations

### Privacy and Security

1. **User IDs**: Always hash user identifiers
2. **Encryption**: Encrypt sensitive content at rest
3. **Access Control**: Enforce user isolation
4. **Retention**: Respect data deletion requests
5. **Audit**: Log all memory access for compliance

### Performance Optimization

1. **Lazy Loading**: Don't load full memory trees unnecessarily
2. **Pagination**: Limit query results and paginate
3. **Batch Operations**: Use batch APIs for bulk operations
4. **Cache Warming**: Pre-load working memory at session start
5. **Background Processing**: Run consolidation and decay in background

### Scaling Considerations

1. **Partitioning**: Shard by user ID for horizontal scaling
2. **Archival**: Move old memories to cold storage
3. **Compression**: Compress archived memories
4. **Sampling**: For very active users, sample episodic memories
5. **Quotas**: Enforce per-user memory limits

## MCP Server Implementation

### Recommended Tools

```typescript
{
  "tools": [
    {
      "name": "store_memory",
      "description": "Store a new memory",
      "inputSchema": {
        "type": "object",
        "properties": {
          "type": { "enum": ["episodic", "semantic", "procedural", "working"] },
          "content": { "type": "object" }
        }
      }
    },
    {
      "name": "recall_memories",
      "description": "Retrieve relevant memories",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string" },
          "types": { "type": "array" },
          "limit": { "type": "number" }
        }
      }
    },
    {
      "name": "update_memory",
      "description": "Update an existing memory",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "updates": { "type": "object" }
        }
      }
    },
    {
      "name": "consolidate_memories",
      "description": "Consolidate related memories",
      "inputSchema": {
        "type": "object",
        "properties": {
          "memoryIds": { "type": "array" },
          "strategy": { "enum": ["merge", "summarize", "abstract", "pattern_extract"] }
        }
      }
    }
  ]
}
```

### Resources

```typescript
{
  "resources": [
    {
      "uri": "memory://{userId}/episodic/{memoryId}",
      "name": "Episodic Memory",
      "description": "A specific episodic memory"
    },
    {
      "uri": "memory://{userId}/semantic/{memoryId}",
      "name": "Semantic Memory",
      "description": "A specific semantic memory"
    },
    {
      "uri": "memory://{userId}/working/current",
      "name": "Current Working Memory",
      "description": "The active working memory for current session"
    }
  ]
}
```

## Example Usage Patterns

### Creating an Episodic Memory

```typescript
const episodic = await memorySystem.createEpisodicMemory({
  content: {
    title: 'Discussion about TypeScript best practices',
    description: 'User asked about TypeScript patterns for API clients',
    summary: 'Discussed factory pattern, error handling, and type guards',
    keyQuotes: [
      'I prefer using zod for runtime validation',
      'Always use discriminated unions for API responses',
    ],
    messages: conversationMessages,
  },
  temporalStructure: {
    startTime: '2025-01-15T10:00:00Z',
    endTime: '2025-01-15T10:45:00Z',
    duration: 2700000,
    temporalContext: {
      timeOfDay: 'morning',
      dayOfWeek: 'Monday',
      isWeekend: false,
    },
  },
  participants: [
    { id: 'user_123', role: 'user', participationLevel: 0.6 },
    { id: 'assistant', role: 'assistant', participationLevel: 0.4 },
  ],
  emotionalContext: {
    valence: 0.7,
    arousal: 0.5,
    emotions: [{ emotion: 'curious', intensity: 0.8 }],
    sentiment: 'positive',
    userSatisfaction: 0.9,
  },
});
```

### Extracting Semantic Memories

```typescript
// After an episode, extract key facts
const semanticMemories = [
  await memorySystem.createSemanticMemory({
    content: {
      subject: 'user_123',
      predicate: 'prefers',
      object: 'zod for runtime validation',
      statement: 'User prefers zod for runtime validation in TypeScript',
      qualifiers: ['always'],
    },
    knowledgeType: KnowledgeType.PREFERENCE,
    confidence: ConfidenceLevel.HIGH,
    evidence: [
      {
        type: 'explicit_statement',
        sourceId: episodic.id,
        description: 'User stated preference in conversation',
        strength: 0.9,
        timestamp: '2025-01-15T10:15:00Z',
      },
    ],
  }),
];
```

### Building Procedural Memory

```typescript
// After observing a repeated pattern
const procedural = await memorySystem.createProceduralMemory({
  content: {
    name: "User's TypeScript project setup",
    purpose: "Initialize a new TypeScript project with user's preferences",
    description: 'Standard TypeScript setup with pnpm, vitest, and zod',
    whenToUse: 'When starting any new TypeScript project',
  },
  steps: [
    {
      order: 1,
      description: 'Initialize with pnpm',
      action: 'pnpm init',
      expectedResult: 'package.json created',
      optional: false,
    },
    {
      order: 2,
      description: 'Install TypeScript and tools',
      action: 'pnpm add -D typescript @types/node vitest',
      optional: false,
    },
    {
      order: 3,
      description: 'Add zod for validation',
      action: 'pnpm add zod',
      optional: false,
    },
  ],
  successRate: 1.0,
  executionCount: 5,
});
```

### Managing Working Memory

```typescript
// At session start
const working = await memorySystem.createWorkingMemory({
  content: {
    currentTopic: 'Setting up a new project',
    conversationSummary: 'User wants to create a TypeScript API client',
    keyPoints: ['Must use zod', 'Prefer functional approach'],
    openQuestions: ['Which API are we calling?'],
  },
  attentionFocus: {
    primary: 'Project structure',
    secondary: ['Error handling', 'Type safety'],
    trigger: 'User question',
    duration: 0,
    importance: 0.8,
  },
  activeGoals: [
    {
      id: 'goal_1',
      description: 'Set up TypeScript project',
      type: 'user_requested',
      priority: 1.0,
      progress: 0.3,
      completed: false,
      establishedAt: '2025-01-15T11:00:00Z',
    },
  ],
  ttl: 3600000, // 1 hour
  consolidationCandidate: true,
});
```

### Semantic Search

```typescript
// Find relevant memories
const results = await memorySystem.recall({
  textQuery: 'How does the user like to handle errors?',
  types: [MemoryType.SEMANTIC, MemoryType.PROCEDURAL],
  limit: 5,
  minSimilarity: 0.7,
  importance: {
    minImportance: 0.5,
  },
});

// Results are ranked by combined score
results.forEach((result) => {
  console.log(`Memory: ${result.memory.id}`);
  console.log(`Score: ${result.score}`);
  console.log(`Semantic: ${result.relevanceFactors.semantic}`);
  console.log(`Importance: ${result.relevanceFactors.importance}`);
});
```

### Temporal Queries

```typescript
// Find conversations from last week
const recentEpisodes = await memorySystem.recall({
  types: [MemoryType.EPISODIC],
  temporal: {
    startDate: '2025-01-08T00:00:00Z',
    endDate: '2025-01-15T23:59:59Z',
  },
  importance: {
    minImportance: 0.6,
  },
});
```

### Consolidation

```typescript
// Consolidate related episodes
const consolidation = await memorySystem.consolidate(
  [episode1.id, episode2.id, episode3.id],
  'summarize'
);

console.log(`Created consolidated memory: ${consolidation.consolidatedMemoryId}`);
console.log(`Preservation score: ${consolidation.preservationScore}`);
```

## Testing Recommendations

### Unit Tests

1. Memory creation and validation
2. Importance scoring calculation
3. Decay algorithm
4. Relationship creation
5. Type guards

### Integration Tests

1. End-to-end memory storage and retrieval
2. Vector search accuracy
3. Consolidation strategies
4. Conflict detection and resolution
5. Sync across surfaces

### Performance Tests

1. Query latency at scale
2. Vector search performance
3. Cache hit rates
4. Batch operation throughput
5. Memory usage under load

## Future Extensions

### Potential Enhancements

1. **Emotional Memory**: Separate tier for emotionally significant memories
2. **Meta-Memory**: Memories about the memory system itself
3. **Collaborative Memory**: Shared memories across multiple users
4. **Forgetting Curves**: Ebbinghaus-inspired decay models
5. **Memory Reconstruction**: Rebuild partial memories from fragments
6. **Confidence Propagation**: Update confidence across related memories
7. **Active Consolidation**: Proactively consolidate during idle time
8. **Memory Visualization**: Graph-based memory browser
9. **Memory Export**: Export memories in standard formats
10. **Privacy Controls**: Fine-grained user control over memory retention

## References

This schema is inspired by:

- Human memory psychology (episodic, semantic, procedural, working)
- Spreading activation theory
- ACT-R cognitive architecture
- Modern vector databases and semantic search
- LangChain memory implementations
- AutoGPT memory systems

## License

This schema is provided as-is for use in AI memory system implementations.
