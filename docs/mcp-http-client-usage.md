# MCP HTTP Client Usage Guide

The MCP HTTP Client (`MCPHttpClient`) provides a simple interface for communicating with the MCP HTTP server from within Node.js code. This is used for bootstrap mesh communication between agents.

## Quick Start

```typescript
import { MCPHttpClient } from './src/mcp/mcp-http-client';

// Create client instance
const client = new MCPHttpClient(); // defaults to http://localhost:3001/mcp

// Initialize session
await client.initialize();

// Use the client
const result = await client.createMemory({
  content: 'My first memory',
  type: 'episodic',
  importance: 0.8,
  tags: ['example']
});

// Clean up
await client.close();
```

## Prerequisites

1. **Start the MCP HTTP Server**
   ```bash
   npm run mcp:http
   ```

2. **Verify server is running**
   ```bash
   curl http://localhost:3001/mcp
   ```

## API Reference

### Constructor

```typescript
const client = new MCPHttpClient(baseUrl?: string)
```

- `baseUrl`: Optional. Defaults to `'http://localhost:3001/mcp'`

### Methods

#### `initialize(): Promise<boolean>`

Initialize a session with the MCP server. **Must be called before any other methods.**

Returns `true` if successful, `false` otherwise.

```typescript
const success = await client.initialize();
if (!success) {
  console.error('Failed to initialize');
  return;
}
```

#### `ping(): Promise<boolean>`

Check if the server is available. Uses a quick 1-second timeout.

```typescript
const isAvailable = await client.ping();
if (!isAvailable) {
  console.error('Server not available');
}
```

#### `createMemory(params): Promise<{ id: string } | null>`

Create a new memory in the system.

**Parameters:**
- `content` (string): The content to remember
- `type` ('episodic' | 'semantic' | 'procedural' | 'working'): Memory type
- `importance` (number, optional): Importance score 0-1 (default 0.5)
- `tags` (string[], optional): Tags for categorization

**Returns:** `{ id: string }` on success, `null` on failure.

```typescript
const result = await client.createMemory({
  content: 'Learned how to use the MCP client',
  type: 'procedural',
  importance: 0.9,
  tags: ['learning', 'mcp']
});

if (result) {
  console.log(`Memory created with ID: ${result.id}`);
}
```

#### `getMemory(id: string): Promise<Memory | null>`

Retrieve a memory by ID.

**Returns:** Full memory object or `null` if not found.

```typescript
const memory = await client.getMemory('mem_1234567890_0');
if (memory) {
  console.log(`Content: ${memory.content}`);
  console.log(`Type: ${memory.type}`);
  console.log(`Importance: ${memory.importance_score}`);
}
```

#### `searchMemories(params): Promise<Memory[]>`

Search memories by filters.

**Parameters:**
- `type` (string, optional): Filter by memory type
- `min_importance` (number, optional): Minimum importance score
- `limit` (number, optional): Max results (default 10)

**Returns:** Array of matching memories (empty array if none found).

```typescript
const memories = await client.searchMemories({
  type: 'episodic',
  min_importance: 0.7,
  limit: 5
});

console.log(`Found ${memories.length} memories`);
memories.forEach(m => console.log(`- ${m.content}`));
```

#### `getStats(): Promise<Stats | null>`

Get memory system statistics.

**Returns:** Statistics object or `null` on failure.

```typescript
const stats = await client.getStats();
if (stats) {
  console.log(`Total memories: ${stats.total}`);
  console.log(`Episodic: ${stats.by_type.episodic}`);
  console.log(`Semantic: ${stats.by_type.semantic}`);
  console.log(`Procedural: ${stats.by_type.procedural}`);
  console.log(`Working: ${stats.by_type.working}`);
}
```

#### `close(): Promise<void>`

Close the session and clean up resources.

```typescript
await client.close();
```

## Complete Example

```typescript
import { MCPHttpClient } from './src/mcp/mcp-http-client';

async function example() {
  const client = new MCPHttpClient();

  try {
    // Check server availability
    if (!(await client.ping())) {
      throw new Error('Server not available');
    }

    // Initialize session
    if (!(await client.initialize())) {
      throw new Error('Failed to initialize');
    }

    // Create a memory
    const created = await client.createMemory({
      content: 'Example memory for documentation',
      type: 'semantic',
      importance: 0.8,
      tags: ['example', 'docs']
    });

    if (!created) {
      throw new Error('Failed to create memory');
    }

    console.log(`Created memory: ${created.id}`);

    // Retrieve it
    const memory = await client.getMemory(created.id);
    console.log('Retrieved:', memory);

    // Search for similar memories
    const results = await client.searchMemories({
      type: 'semantic',
      min_importance: 0.5
    });
    console.log(`Found ${results.length} semantic memories`);

    // Get stats
    const stats = await client.getStats();
    console.log('System stats:', stats);

  } finally {
    // Always close the session
    await client.close();
  }
}

example().catch(console.error);
```

## Error Handling

The client follows a "no-throw" policy for graceful error handling:

- All methods return `null` or empty arrays on errors
- Errors are logged to `stderr` with `[MCP Client]` prefix
- Connection errors are handled gracefully
- Timeouts (5 seconds) prevent hanging requests

```typescript
// Safe to use without try-catch
const result = await client.createMemory({...});
if (!result) {
  // Handle error gracefully
  console.log('Failed to create memory, continuing...');
}
```

## Testing

Run the test script to verify the client works:

```bash
# Terminal 1: Start the server
npm run mcp:http

# Terminal 2: Run the test
npx ts-node test-mcp-client.ts
```

Expected output:
```
=== MCP HTTP Client Test ===

1. Pinging server...
✓ Server is available

2. Initializing session...
✓ Session initialized

3. Creating a test memory...
✓ Memory created: mem_1234567890_0

4. Retrieving the memory...
✓ Memory retrieved:
{...}

5. Searching for episodic memories...
✓ Found 1 episodic memories

6. Getting memory system stats...
✓ Memory system stats:
{...}

7. Closing session...
✓ Session closed

=== All tests passed! ===
```

## Troubleshooting

### "Server is not available"

- Ensure the MCP HTTP server is running: `npm run mcp:http`
- Check the server is on the correct port (default: 3001)
- Verify firewall settings

### "Failed to initialize"

- Check server logs for errors
- Ensure no other process is using the same session
- Try restarting the server

### "Request timeout"

- Server may be overloaded
- Network issues
- Increase timeout in client code if needed

### Connection Errors

- Verify server URL is correct
- Check network connectivity
- Review server logs for errors

## Advanced Usage

### Custom Base URL

```typescript
const client = new MCPHttpClient('http://custom-host:8080/mcp');
```

### Multiple Clients

Each client maintains its own session:

```typescript
const client1 = new MCPHttpClient();
const client2 = new MCPHttpClient();

await client1.initialize();
await client2.initialize();

// Both can work independently
await client1.createMemory({...});
await client2.searchMemories({...});

await client1.close();
await client2.close();
```

### Long-Running Sessions

```typescript
// Initialize once
const client = new MCPHttpClient();
await client.initialize();

// Use throughout application lifetime
setInterval(async () => {
  const stats = await client.getStats();
  console.log('Current stats:', stats);
}, 60000); // Every minute

// Clean up on shutdown
process.on('SIGINT', async () => {
  await client.close();
  process.exit(0);
});
```
