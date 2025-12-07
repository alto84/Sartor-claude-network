# MCP Memory Tools Skill

## Summary
Use MCP tools to persist and retrieve memories across sessions.

## When Available
These tools appear when the sartor-memory MCP server is connected.
Check your available tools - if you see `memory_create`, `memory_get`, etc., you have access.

## Tools

### memory_create
Create a new memory.
```json
{
  "content": "What to remember",
  "type": "procedural",  // episodic, semantic, procedural, working
  "importance": 0.8,     // 0-1
  "tags": ["tag1", "tag2"]
}
```

### memory_get
Retrieve a memory by ID.
```json
{
  "id": "mem_abc123"
}
```

### memory_search
Search memories.
```json
{
  "type": "procedural",
  "min_importance": 0.5,
  "limit": 10
}
```

### memory_stats
Get system statistics (no arguments needed).

## Best Practices
1. Use PROCEDURAL type for successful patterns/approaches
2. Set high importance (0.8+) for things worth remembering
3. Tag memories for easier retrieval
4. Search before starting a task to find relevant past patterns

## Example: Recording a Successful Fix
```
memory_create({
  content: "Fixed auth bug by checking token expiry before refresh",
  type: "procedural",
  importance: 0.9,
  tags: ["auth", "bug-fix", "tokens"]
})
```
