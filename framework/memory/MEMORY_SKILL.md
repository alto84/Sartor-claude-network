# Memory System Skill

## Overview
This skill provides access to the swarm memory system for storing and retrieving information across agent sessions.

## Memory Types

### 1. Episodic Memory
- **Purpose**: Store specific events and interactions
- **Retention**: Time-based (organized by date)
- **Use for**: Session logs, task completions, discoveries

### 2. Semantic Memory
- **Purpose**: Store general knowledge and facts
- **Retention**: Topic-based (organized by subject)
- **Use for**: Learned patterns, codebase insights, documentation

### 3. Working Memory
- **Purpose**: Current session context
- **Retention**: Per-agent (cleared between sessions)
- **Use for**: Active task state, temporary calculations

### 4. Coordination Memory
- **Purpose**: Inter-agent communication
- **Retention**: Short-term (for message passing)
- **Use for**: Broadcasting findings, requesting help, status updates

## Usage

### Storing Memory (Bash)

```bash
# Store episodic memory
echo '{"type":"episodic","content":"Completed task X","topic":"tasks","timestamp":"'$(date -Iseconds)'"}' >> .swarm/memory/episodic/$(date +%Y-%m-%d).jsonl

# Store semantic memory
echo '{"type":"semantic","content":"Pattern: Use Task tool for complex searches","topic":"patterns","timestamp":"'$(date -Iseconds)'"}' >> .swarm/memory/semantic/patterns.jsonl

# Store coordination message
echo '{"type":"coordination","from":"'$AGENT_ID'","to":"broadcast","message":"Found critical issue","priority":"high","timestamp":"'$(date -Iseconds)'"}' >> .swarm/memory/coordination/messages.jsonl
```

### Querying Memory (Bash)

```bash
# Get recent episodic memories
cat .swarm/memory/episodic/*.jsonl | tail -20

# Search semantic memory
grep -r "pattern" .swarm/memory/semantic/

# Get coordination messages
cat .swarm/memory/coordination/messages.jsonl | tail -50
```

### Using TypeScript Memory Store

The `memory-store.ts` provides a more robust API:

```typescript
import { storeMemory, queryMemory, summarizeMemories } from './memory-store';

// Store a finding
storeMemory({
  type: 'semantic',
  content: 'The coordinator uses --dangerously-skip-permissions flag',
  metadata: {
    topic: 'coordinator',
    tags: ['implementation', 'flags'],
    agent_id: process.env.AGENT_ID,
  }
});

// Query recent memories
const memories = queryMemory({
  type: 'semantic',
  topic: 'coordinator',
  limit: 10
});

// Get summarized context for injection
const context = summarizeMemories({ topic: 'coordinator' }, 2000);
```

## Best Practices

1. **Be Specific**: Store discrete, searchable facts, not large text blobs
2. **Tag Appropriately**: Use consistent topics and tags for easy retrieval
3. **Timestamp Everything**: Always include timestamps for temporal queries
4. **Clean Up Working Memory**: Clear working memory when task completes
5. **Use Coordination Sparingly**: Only broadcast high-value findings

## Memory Locations

- Episodic: `.swarm/memory/episodic/{date}.jsonl`
- Semantic: `.swarm/memory/semantic/{topic}.jsonl`
- Working: `.swarm/memory/working/{agent_id}.jsonl`
- Coordination: `.swarm/memory/coordination/messages.jsonl`

## Environment Variables

- `SWARM_MEMORY_PATH`: Base path for memory storage (default: `.swarm/memory`)
- `AGENT_ID`: Current agent identifier (set by coordinator)
- `AGENT_TYPE`: Agent type for permissions (set by coordinator)
