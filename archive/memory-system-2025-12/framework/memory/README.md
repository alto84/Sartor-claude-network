# Memory Framework

## Purpose
Provide persistent memory capabilities across agent sessions, enabling:
- Knowledge retention between conversations
- Shared context across agent swarms
- Learning from past interactions

## Architecture

### Memory Types

1. **Episodic Memory**
   - Specific events/interactions
   - Timestamped entries
   - Queryable by time, topic, agent

2. **Semantic Memory**
   - General knowledge
   - Concepts and relationships
   - Persistent facts

3. **Working Memory**
   - Current session context
   - Active task state
   - Temporary scratchpad

### Storage Backend

```
memory/
├── episodic/
│   └── {date}/
│       └── {session_id}.json
├── semantic/
│   └── {topic}/
│       └── knowledge.json
└── working/
    └── {agent_id}.json
```

### API

```typescript
interface MemoryAPI {
  // Store memory
  store(type: 'episodic' | 'semantic' | 'working', data: MemoryEntry): void;

  // Query memory
  query(type: string, filter: QueryFilter): MemoryEntry[];

  // Summarize for context injection
  summarize(topic: string, maxTokens: number): string;
}
```

### Integration with Agents

Agents receive memory context via:
1. System prompt injection (summarized relevant memories)
2. Tool access (query/store during execution)
3. Session handoff (working memory transfer)

## Files

- `memory-store.ts` - Storage implementation
- `memory-query.ts` - Query engine
- `memory-summarizer.ts` - Context summarization
- `MEMORY_SKILL.md` - Skill for agent use
