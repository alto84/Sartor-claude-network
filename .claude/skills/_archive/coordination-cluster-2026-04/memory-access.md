# Memory Access Skill

## Summary

Access and manage the 3-tier memory system (Hot/Warm/Cold) for persistent learning across sessions.

## When to Use

- Storing important learnings from task execution
- Retrieving patterns from past similar tasks
- Recording refinement loop outcomes
- Querying for relevant context

## Instructions

### Initialize Memory System

```typescript
import { MemorySystem } from './src/memory/memory-system';
import { MemoryType } from './src/memory/memory-schema';

const memory = new MemorySystem();
```

### Create a Memory

```typescript
const mem = await memory.createMemory(
  'Content to remember',
  MemoryType.PROCEDURAL, // or EPISODIC, SEMANTIC, WORKING
  {
    importance_score: 0.8, // 0-1, higher = more important
    tags: ['tag1', 'tag2'],
  }
);
```

### Retrieve a Memory

```typescript
const mem = await memory.getMemory(memoryId);
// Automatically increments access_count
```

### Search Memories

```typescript
const results = await memory.searchMemories({
  filters: {
    type: [MemoryType.PROCEDURAL],
    min_importance: 0.5,
  },
  limit: 10,
});
```

### Memory Types

- **EPISODIC**: Specific events, conversations, task outcomes
- **SEMANTIC**: Facts, concepts, learned knowledge
- **PROCEDURAL**: How-to patterns, successful approaches
- **WORKING**: Temporary, current task context

### Best Practices

1. Use PROCEDURAL for refinement outcomes
2. Set importance_score based on success (higher for successful patterns)
3. Tag memories for easier retrieval
4. Let daily maintenance handle decay

## Examples

### Recording a Successful Refinement

```typescript
await memory.createMemory(
  JSON.stringify({
    task: 'Fixed authentication bug',
    approach: 'Traced token flow, found expiry issue',
    iterations: 2,
    success: true,
  }),
  MemoryType.PROCEDURAL,
  { importance_score: 0.9, tags: ['auth', 'debugging', 'success'] }
);
```

### Finding Similar Past Tasks

```typescript
const similar = await memory.searchMemories({
  filters: {
    type: [MemoryType.PROCEDURAL],
    min_importance: 0.7,
  },
  limit: 5,
});
// Parse and apply patterns from similar.map(r => r.memory.content)
```
