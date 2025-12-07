# Memory Importance Scoring and Decay Algorithms

A biologically-inspired memory management system for AI agents, implementing importance scoring, natural decay, consolidation, spaced repetition, and privacy-aware forgetting strategies.

## Overview

This system models human-like memory management with:

- **Importance Scoring**: Multi-factor scoring based on recency, frequency, semantic salience, and contextual relevance
- **Memory Decay**: Natural forgetting with importance-based modifiers and reinforcement on access
- **Consolidation**: Automatic clustering and summarization of related memories
- **Spaced Repetition**: SuperMemo SM-2 based review scheduling adapted for AI
- **Privacy-Aware Forgetting**: Multi-tier deletion strategy with GDPR/CCPA compliance

## Quick Start

```typescript
import { createMemorySystem, MemoryType } from './memory-system';

// Create a new memory system
const memorySystem = createMemorySystem();

// Create a memory
const memory = await memorySystem.createMemory(
  'User prefers dark mode',
  MemoryType.SEMANTIC,
  {
    tags: ['user_preference', 'ui']
  }
);

// Retrieve with reinforcement
const retrieved = await memorySystem.getMemory(memory.id);

// Search memories
const results = await memorySystem.searchMemories({
  filters: { tags: ['user_preference'] }
});

// Run daily maintenance
await memorySystem.runDailyMaintenance();
```

## Core Algorithms

### 1. Importance Score Calculation

Importance is calculated as a weighted combination of four factors:

```
importance = (0.25 * recency) +
             (0.20 * frequency) +
             (0.35 * salience) +
             (0.20 * relevance)
```

**Recency** (Exponential Decay):
```
recency_score = e^(-λ * t)
where λ = 0.05, t = days elapsed
```

**Frequency** (Logarithmic Scaling):
```
frequency_score = log(1 + access_count) / log(1 + max_expected)
```

**Salience** (LLM-Scored):
- Emotional intensity (0-10)
- Novelty/uniqueness (0-10)
- Actionable insights (0-10)
- Personal significance (0-10)

**Relevance** (Embedding Similarity):
```
relevance_score = cosine_similarity(memory_embedding, context_embedding)
```

### 2. Memory Decay Function

Memories naturally decay over time unless accessed:

```
decay_rate = base_rate * (1 - importance)^2 * modifiers
```

**Modifiers**:
- **Importance**: Higher importance = slower decay
- **Access Pattern**: Recent access = slower decay
- **Memory Type**: Procedural memories decay slowest

**State Transitions**:
- Strength < 0.30: Soft delete (archived)
- Strength < 0.15: Heavy compression
- Strength < 0.05: Permanent deletion (with grace period)

### 3. Consolidation Algorithm

Related memories are automatically clustered and consolidated:

**Clustering**:
- Cosine similarity threshold: 0.7
- Temporal proximity bonus: memories within 1 hour
- Conversation thread awareness

**Strategies**:
- **Link**: Small clusters (2-3 memories) are linked
- **Summarize**: Large low-importance clusters are consolidated
- **Hybrid**: Keep important memories, summarize others

### 4. Spaced Repetition for AI

Based on SuperMemo SM-2, adapted for AI:

```
Interval progression:
- Review 1: 1 day
- Review 2: 6 days
- Review n: previous_interval * easiness_factor

easiness_factor = 1.3 + (importance * 1.7)
Range: [1.3, 3.0]
```

### 5. Forgetting Strategy

**Multi-Tier Deletion**:
1. **Soft Delete** (strength < 0.30): Archive with compression
2. **Archive** (strength < 0.15): Summary only, minimal storage
3. **Permanent** (strength < 0.05): Complete removal after grace period

**Never-Forget Protection**:
- User preferences and commitments
- System configuration
- High-importance memories (> 0.8)
- Frequently accessed (> 50 times)

**Privacy Expiration**:
- PII: 30 days max
- Financial data: 90 days max
- Casual conversation: 180 days max

## File Structure

```
├── MEMORY_SYSTEM_SPEC.md      # Detailed specification
├── types.ts                    # TypeScript type definitions
├── importance-scoring.ts       # Importance calculation algorithms
├── memory-decay.ts            # Decay and reinforcement logic
├── consolidation.ts           # Memory clustering and merging
├── spaced-repetition.ts       # Review scheduling
├── forgetting-strategy.ts     # Deletion and privacy
├── memory-system.ts           # Main system integration
├── example-usage.ts           # Usage examples
└── README_MEMORY_ALGORITHMS.md # This file
```

## API Reference

### MemorySystem

#### Creating Memories

```typescript
await memorySystem.createMemory(
  'Memory content',
  MemoryType.EPISODIC,
  { tags: ['tag1'], embedding: [...] }
)
```

#### Searching Memories

```typescript
const results = await memorySystem.searchMemories({
  filters: {
    type: [MemoryType.SEMANTIC],
    min_importance: 0.5,
    tags: ['important']
  },
  limit: 10
})
```

#### Context-Aware Retrieval

```typescript
const relevant = await memorySystem.getRelevantMemories(
  contextEmbedding,
  5
)
```

#### Daily Maintenance

```typescript
const results = await memorySystem.runDailyMaintenance()
// Returns: { decay_updated, reviews_processed, consolidations, deletions }
```

### Factory Functions

**Standard Configuration**:
```typescript
const system = createMemorySystem();
```

**Optimized for Use Case**:
```typescript
const conversational = createOptimizedMemorySystem('conversational');
const knowledgeBase = createOptimizedMemorySystem('knowledge_base');
const eventTracking = createOptimizedMemorySystem('event_tracking');
```

## Configuration

### Default Settings

```typescript
const config = {
  importance: {
    weights: { recency: 0.25, frequency: 0.20, salience: 0.35, relevance: 0.20 }
  },
  decay: {
    base_rate: 0.1,
    thresholds: { soft_delete: 0.30, archive: 0.15, permanent_delete: 0.05 }
  },
  consolidation: {
    trigger_count: 10000,
    similarity_threshold: 0.7
  },
  spaced_repetition: {
    initial_interval: 1,
    second_interval: 6
  }
};
```

## Examples

### Basic Memory Operations

```typescript
const system = createMemorySystem();

// Create
await system.createMemory(
  'User wants weekly reports on Mondays',
  MemoryType.SEMANTIC,
  { tags: ['preference', 'schedule'] }
);

// Access strengthens memory
const memory = await system.getMemory(id, true);

// Search
const results = await system.searchMemories({
  filters: { min_importance: 0.7 }
});
```

### Context-Aware Retrieval

```typescript
// Get memories relevant to current context
const contextEmbedding = await getEmbedding('discussing Python data science');
const relevant = await system.getRelevantMemories(contextEmbedding, 5);

relevant.forEach(m => console.log(m.content));
```

### Privacy-Compliant Deletion

```typescript
import { handleRightToErasure } from './forgetting-strategy';

// GDPR Right to Erasure
const report = handleRightToErasure(
  userId,
  system.exportMemories(),
  system.getConfig().forgetting
);

console.log(`Deleted: ${report.deleted}, Anonymized: ${report.anonymized}`);
```

## Performance Targets

- **Importance Calculation**: < 10ms per memory
- **Retrieval (top-K)**: < 50ms
- **Consolidation (1000 memories)**: < 5 seconds
- **Decay Update (bulk)**: < 100ms per 1000 memories

## Testing

Run the example suite:

```bash
npm run test:memory-system
```

Or run individual examples:

```typescript
import { basicMemoryOperations } from './example-usage';
await basicMemoryOperations();
```

## Integration Examples

### With Vector Databases

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone();
const index = pinecone.Index('memories');

await index.upsert([{
  id: memory.id,
  values: memory.embedding,
  metadata: { importance: memory.importance_score }
}]);
```

### With LLM APIs

```typescript
import OpenAI from 'openai';

async function scoreSalienceWithLLM(content: string) {
  const openai = new OpenAI();
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: generateSaliencePrompt(content) }]
  });
  return parseSalienceResponse(response.choices[0].message.content);
}
```

## Use Cases

1. **Conversational AI Assistant**: Remembers preferences, surfaces relevant context
2. **Knowledge Management**: Consolidates information, implements learning
3. **Personal AI Memory**: Privacy-compliant, user-controlled forgetting

## References

- **Ebbinghaus Forgetting Curve**: Hermann Ebbinghaus (1885)
- **SuperMemo SM-2**: Piotr Woźniak (1988)
- **Spaced Repetition**: Research on optimal learning intervals
- **GDPR Compliance**: EU General Data Protection Regulation

## Documentation

- [Detailed Specification](MEMORY_SYSTEM_SPEC.md) - Complete algorithm specifications
- [Example Usage](example-usage.ts) - Comprehensive usage examples
- [Type Definitions](types.ts) - Full TypeScript interfaces

---

**Built with cognitive science principles for intelligent AI memory management.**
