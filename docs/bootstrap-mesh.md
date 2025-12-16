# Bootstrap Mesh - Unified Multi-Source Memory Interface

The Bootstrap Mesh provides a unified interface to load memories from multiple sources with automatic fallback. It tries backends in priority order until one succeeds, ensuring your application always has access to memory data.

## Architecture

```
┌──────────────────────────────────────────────────┐
│              Bootstrap Mesh                      │
│    (Tries sources in priority order)             │
├──────────────────────────────────────────────────┤
│  1. MCP HTTP        ← Fastest (<100ms)          │
│  2. Local File      ← Reliable (<200ms)         │
│  3. GitHub          ← Persistent (1-5s)         │
│  4. Firebase        ← Scalable (<500ms)         │
└──────────────────────────────────────────────────┘
```

## Features

- **Automatic Fallback**: If one backend fails, automatically tries the next
- **Priority-Based**: Tries fastest backends first (MCP → Local → GitHub → Firebase)
- **Graceful Degradation**: Never throws errors - returns empty array if all backends fail
- **Transparent Logging**: Logs which backend is being used to stderr
- **Session Management**: Handles MCP session initialization and caching
- **Type-Safe**: Full TypeScript support with comprehensive interfaces

## Installation

The bootstrap mesh is included in the `@sartor/memory` package:

```typescript
import { createBootstrapMesh } from './src/mcp/bootstrap-mesh';
```

## Quick Start

```typescript
import { createBootstrapMesh } from './src/mcp/bootstrap-mesh';

// Create bootstrap mesh with default configuration
const mesh = createBootstrapMesh();

// Load memories (tries all backends in order)
const memories = await mesh.loadMemories({
  type: 'episodic',
  minImportance: 0.5,
  limit: 10,
});

console.log(`Loaded ${memories.length} memories`);
console.log(`Active backend: ${mesh.getActiveBackend()}`);
```

## Configuration

### Basic Configuration

```typescript
const mesh = createBootstrapMesh({
  // MCP HTTP server URL (default: http://localhost:3001/mcp)
  mcpUrl: 'http://localhost:3001/mcp',

  // Local file storage path (default: 'data')
  localPath: 'data',

  // Enable/disable Firebase (default: true)
  firebase: true,

  // GitHub configuration (optional)
  github: {
    token: process.env.GITHUB_TOKEN!,
    owner: 'your-org',
    repo: 'your-repo',
  },
});
```

### Environment Variables

The bootstrap mesh automatically reads from environment variables:

- `GITHUB_TOKEN` - GitHub personal access token
- `GITHUB_OWNER` - GitHub repository owner
- `GITHUB_REPO` - GitHub repository name
- `FIREBASE_DATABASE_URL` - Firebase Realtime Database URL
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to Firebase service account JSON

## API Reference

### `createBootstrapMesh(config?)`

Factory function to create a new bootstrap mesh instance.

```typescript
interface BootstrapMeshConfig {
  mcpUrl?: string;
  localPath?: string;
  github?: {
    token: string;
    owner: string;
    repo: string;
  };
  firebase?: boolean;
}
```

### `loadMemories(options)`

Load memories from available backends (tries in priority order).

```typescript
interface LoadOptions {
  type?: string; // episodic, semantic, procedural, working
  minImportance?: number; // 0-1
  limit?: number; // max results (default: 10)
  tags?: string[]; // filter by tags
}

const memories = await mesh.loadMemories({
  type: 'episodic',
  minImportance: 0.7,
  limit: 5,
  tags: ['important', 'project-x'],
});
```

### `getMemory(id)`

Get a specific memory by ID.

```typescript
const memory = await mesh.getMemory('mem_123456');

if (memory) {
  console.log(memory.content);
  console.log(memory.importance_score);
}
```

### `saveMemory(memory)`

Save a memory (writes to first available backend).

```typescript
const memoryId = await mesh.saveMemory({
  content: 'Important project meeting notes',
  type: 'episodic',
  importance_score: 0.8,
  tags: ['meeting', 'project'],
  created_at: new Date().toISOString(),
});

console.log(`Saved as: ${memoryId}`);
```

### `getBackendStatus()`

Get status of all backends.

```typescript
const status = mesh.getBackendStatus();

console.log('Backend Status:');
console.log(`  MCP:      ${status.mcp ? '✓' : '✗'}`);
console.log(`  Local:    ${status.local ? '✓' : '✗'}`);
console.log(`  GitHub:   ${status.github ? '✓' : '✗'}`);
console.log(`  Firebase: ${status.firebase ? '✓' : '✗'}`);
```

### `getActiveBackend()`

Get which backend was used for the last operation.

```typescript
await mesh.loadMemories({ type: 'episodic' });
console.log(`Used backend: ${mesh.getActiveBackend()}`);
// Output: "mcp", "local", "github", "firebase", or "none"
```

## Memory Interface

```typescript
interface Memory {
  id: string;
  content: string;
  type: string; // episodic, semantic, procedural, working
  importance_score: number; // 0-1
  tags: string[];
  created_at: string; // ISO 8601 timestamp
}
```

## Usage Examples

### Example 1: Load High-Importance Episodic Memories

```typescript
const importantMemories = await mesh.loadMemories({
  type: 'episodic',
  minImportance: 0.8,
  limit: 20,
});

importantMemories.forEach((mem) => {
  console.log(`[${mem.importance_score}] ${mem.content}`);
});
```

### Example 2: Save a New Memory

```typescript
const memoryId = await mesh.saveMemory({
  content: 'User prefers dark mode and compact layout',
  type: 'semantic',
  importance_score: 0.9,
  tags: ['preference', 'ui'],
  created_at: new Date().toISOString(),
});

console.log(`Memory saved: ${memoryId}`);
```

### Example 3: Filter by Tags

```typescript
const projectMemories = await mesh.loadMemories({
  tags: ['project-x', 'milestone'],
  limit: 10,
});

console.log(`Found ${projectMemories.length} project memories`);
```

### Example 4: Check Backend Health

```typescript
const status = mesh.getBackendStatus();
const availableBackends = Object.entries(status)
  .filter(([_, available]) => available)
  .map(([name]) => name);

console.log(`Available backends: ${availableBackends.join(', ')}`);
```

### Example 5: Retrieve and Update

```typescript
// Get a memory
const memory = await mesh.getMemory('mem_123456');

if (memory) {
  // Update locally (in your application)
  memory.importance_score = 0.95;
  memory.tags.push('reviewed');

  // Save back
  await mesh.saveMemory(memory);
}
```

## Backend Priority Order

The bootstrap mesh tries backends in this order:

1. **MCP HTTP** (http://localhost:3001/mcp)
   - Fastest option when available
   - Requires MCP HTTP server running
   - Session-based with automatic reconnection

2. **Local File** (data/memories.json)
   - Always available as fallback
   - Synchronous file operations
   - Good for development and testing

3. **GitHub** (via Octokit API)
   - Requires GitHub token and repository
   - Best for long-term archival
   - Slowest but most persistent

4. **Firebase** (Realtime Database)
   - Requires Firebase credentials
   - Good for production deployments
   - Real-time sync across instances

## Error Handling

The bootstrap mesh never throws errors during memory loading. Instead:

1. Logs errors to stderr
2. Tries the next backend
3. Returns empty array if all backends fail

```typescript
// Safe - never throws
const memories = await mesh.loadMemories({ type: 'episodic' });

if (memories.length === 0) {
  console.log('No memories found or all backends failed');
}
```

To detect failures, check the active backend:

```typescript
await mesh.loadMemories({ type: 'episodic' });

if (mesh.getActiveBackend() === 'none') {
  console.error('All backends failed!');
}
```

## Performance Characteristics

| Backend  | Latency | Reliability | Persistence |
| -------- | ------- | ----------- | ----------- |
| MCP HTTP | <100ms  | Medium      | Session     |
| Local    | <200ms  | High        | File        |
| GitHub   | 1-5s    | Medium      | Permanent   |
| Firebase | <500ms  | High        | Cloud       |

## Running the Example

```bash
# Start MCP HTTP server (optional, for best performance)
npm run mcp:http

# Run the bootstrap mesh example
npm run example:bootstrap
```

## Integration with MCP Server

The bootstrap mesh works seamlessly with the MCP HTTP server:

1. Start the MCP HTTP server:

   ```bash
   npm run mcp:http
   ```

2. Bootstrap mesh automatically connects:

   ```typescript
   const mesh = createBootstrapMesh();
   // Automatically uses MCP HTTP when available
   ```

3. Falls back gracefully if MCP server is down:
   ```
   [BootstrapMesh] MCP HTTP server not available
   [BootstrapMesh] Trying local file store...
   ```

## Best Practices

1. **Always check backend status** in production applications
2. **Use appropriate importance scores** (0.0-1.0) for filtering
3. **Tag your memories** for easier filtering and retrieval
4. **Set reasonable limits** to avoid loading too much data
5. **Monitor active backend** to detect infrastructure issues

## Troubleshooting

### MCP HTTP Not Available

```
[BootstrapMesh] MCP HTTP server not available
```

**Solution**: Start the MCP HTTP server:

```bash
npm run mcp:http
```

### GitHub Authentication Failed

```
[BootstrapMesh] GitHub initialization failed
```

**Solution**: Set environment variables:

```bash
export GITHUB_TOKEN=your_token_here
export GITHUB_OWNER=your_org
export GITHUB_REPO=your_repo
```

### Firebase Not Available

```
[BootstrapMesh] Firebase initialization failed
```

**Solution**: Set Firebase credentials:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
export FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

## See Also

- [MCP Server Documentation](../CLAUDE.md#mcp-server-memory-context-protocol)
- [Memory Schema Reference](../src/memory/memory-schema.ts)
- [File Store Implementation](../src/mcp/file-store.ts)
- [GitHub Cold Tier](../src/memory/cold-tier.ts)
