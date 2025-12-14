---
name: MCP Server Development
description: Guides development of Model Context Protocol servers including tool implementation, error handling, stdio/HTTP transport, memory system integration, and testing strategies. Use when building MCP servers, implementing MCP tools, debugging MCP communication, integrating with multi-tier memory systems, or answering questions about MCP architecture and Memory MCP patterns.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# MCP Server Development Skill

## Overview

This skill provides guidance for building Model Context Protocol (MCP) servers based on actual working implementations. It covers architecture patterns, tool implementation, error handling, stdio/HTTP transport communication, memory system integration, and testing strategies.

**NEW**: Includes comprehensive Memory MCP integration patterns showing how to expose multi-tier memory systems (Firebase/File/GitHub) through MCP tools for agent-to-agent communication and Claude Desktop access.

## When to Use This Skill

Activate this skill when:

- Building a new MCP server from scratch
- Implementing MCP tools with proper schemas
- Debugging MCP stdio communication issues
- Adding plugin architectures to MCP servers
- Setting up error handling and retries
- Creating tests for MCP servers
- Understanding MCP protocol message formats
- Integrating MCP servers with multi-tier memory systems
- Exposing memory tools via HTTP for agent access
- Implementing Bootstrap Mesh patterns for multi-source memory
- Building agent communication through shared memory
- Creating refinement trace or expert consensus tools

## MCP Architecture Fundamentals

### Core Components

1. **Server Instance**: The main MCP server class from `@modelcontextprotocol/sdk`
2. **Transport Layer**: Stdio-based communication (stdin/stdout)
3. **Request Handlers**: Process MCP protocol requests (tools, resources)
4. **Tool Definitions**: JSON schemas defining available tools
5. **Error Handling**: Proper error responses in MCP format

### Stdio Transport Pattern

MCP servers communicate via stdio (standard input/output):

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Server uses stdin for input, stdout for responses
// All logging must go to stderr to avoid protocol corruption
const transport = new StdioServerTransport();
await server.connect(transport);

// IMPORTANT: Use console.error for logging, never console.log
console.error('Server started'); // ✓ Correct
console.log('Server started'); // ✗ Wrong - corrupts stdio protocol
```

### Server Initialization Pattern

```typescript
const server = new Server(
  {
    name: 'your-server-name',
    version: '1.0.0',
    description: 'Clear description of server purpose',
  },
  {
    capabilities: {
      tools: {}, // Enable tool support
      resources: {}, // Enable resource support (optional)
    },
  }
);
```

## Tool Implementation Patterns

### Basic Tool Structure

Every MCP tool requires:

1. Tool definition with JSON schema
2. Request handler implementation
3. Input validation
4. Error handling
5. Response formatting

### Tool Definition Pattern

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'tool_name',
        description: 'Clear description of what this tool does',
        inputSchema: {
          type: 'object',
          properties: {
            param1: {
              type: 'string',
              description: 'Clear parameter description',
            },
            param2: {
              type: 'number',
              description: 'Another parameter',
            },
          },
          required: ['param1'],
        },
      },
    ],
  };
});
```

### Tool Execution Pattern

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Input validation
  if (!args) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'No arguments provided' }, null, 2),
        },
      ],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'your_tool':
        const result = await executeYourTool(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});
```

## Plugin Architecture Pattern

For extensible MCP servers with multiple capabilities:

### Plugin Interface

```typescript
interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  supportedFilters: string[];
}

interface Plugin {
  readonly metadata: PluginMetadata;
  initialize(config: PluginConfig): Promise<void>;
  execute(params: any): Promise<any>;
  healthCheck(): Promise<HealthStatus>;
  dispose(): Promise<void>;
}
```

### Plugin Manager Pattern

```typescript
class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  async loadPlugins(): Promise<void> {
    // Dynamic plugin loading
    for (const pluginName of enabledPlugins) {
      const plugin = await import(`./plugins/${pluginName}/index.js`);
      await plugin.default.initialize(config);
      this.plugins.set(pluginName, plugin.default);
    }
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
}
```

## Error Handling Strategies

### Validation Errors

Use Zod or similar for input validation:

```typescript
import { z } from 'zod';

const ToolArgsSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  limit: z.number().min(1).max(100).optional().default(20),
});

// In tool handler
try {
  const validatedArgs = ToolArgsSchema.parse(args);
  // Proceed with validated args
} catch (error) {
  if (error instanceof z.ZodError) {
    return {
      content: [
        {
          type: 'text',
          text: `Validation error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}
```

### Retry Pattern with Exponential Backoff

```typescript
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on validation errors
      if (isValidationError(error)) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries - 1) {
        await delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  throw lastError!;
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private readonly threshold = 5;
  private readonly resetTimeout = 60000; // 1 minute

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    if (this.failures >= this.threshold) {
      const timeSinceLastFail = Date.now() - this.lastFailTime;
      if (timeSinceLastFail < this.resetTimeout) {
        return true;
      }
      this.reset();
    }
    return false;
  }
}
```

## Resource Pattern (Optional)

Resources expose data that can be read by MCP clients:

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'custom://resource/id',
        name: 'Resource Name',
        description: 'What this resource provides',
        mimeType: 'text/plain',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  // Parse URI and fetch resource data
  const data = await fetchResourceData(uri);

  return {
    contents: [
      {
        uri,
        mimeType: 'text/plain',
        text: data,
      },
    ],
  };
});
```

## Testing Strategies

### Unit Tests

Test individual tool logic separately from MCP protocol:

```javascript
describe('Tool Logic', () => {
  it('should process valid input', async () => {
    const result = await processTool({
      query: 'test query',
      limit: 10,
    });

    expect(result).toHaveProperty('data');
    expect(result.data).toBeInstanceOf(Array);
  });

  it('should handle errors gracefully', async () => {
    await expect(processTool({ query: '' })).rejects.toThrow('Query cannot be empty');
  });
});
```

### Integration Tests

Test full MCP communication flow:

```javascript
describe('MCP Server Integration', () => {
  let server;

  beforeEach(async () => {
    server = new YourMCPServer();
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should list available tools', async () => {
    const tools = await server.listTools();
    expect(tools.tools).toHaveLength(3);
    expect(tools.tools[0]).toHaveProperty('name');
    expect(tools.tools[0]).toHaveProperty('inputSchema');
  });

  it('should execute tool successfully', async () => {
    const result = await server.callTool('tool_name', {
      param1: 'value',
    });

    expect(result.content).toBeDefined();
    expect(result.isError).toBeFalsy();
  });
});
```

### Manual Testing with MCP Inspector

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Test your server
npx @modelcontextprotocol/inspector path/to/your/server.js
```

## Common Pitfalls and Solutions

### 1. Stdio Protocol Corruption

**Problem**: Using `console.log()` corrupts stdio communication

**Solution**: Always use `console.error()` for logging

```typescript
// ✗ Wrong
console.log('Debug message');

// ✓ Correct
console.error('Debug message');
```

### 2. Missing Error Handling

**Problem**: Uncaught errors crash the server

**Solution**: Wrap all operations in try-catch

```typescript
// ✗ Wrong
async function toolHandler(args) {
  const result = await riskyOperation(args);
  return result;
}

// ✓ Correct
async function toolHandler(args) {
  try {
    const result = await riskyOperation(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }),
        },
      ],
      isError: true,
    };
  }
}
```

### 3. Invalid JSON Schema

**Problem**: Tool schema doesn't match actual parameters

**Solution**: Validate schemas match implementation

```typescript
// Schema says required
inputSchema: {
  required: ['param1'];
}

// But handler doesn't check
function handler(args) {
  // Missing validation - will fail if param1 not provided
  return doSomething(args.param1);
}

// ✓ Correct: Add validation
function handler(args) {
  if (!args.param1) {
    throw new Error('param1 is required');
  }
  return doSomething(args.param1);
}
```

### 4. Process Cleanup

**Problem**: Server doesn't handle shutdown signals

**Solution**: Implement graceful shutdown

```typescript
process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down...');
  await server.stop();
  process.exit(0);
});
```

## Performance Optimization

### Caching Pattern

```typescript
class CacheService {
  private cache = new Map<string, CachedItem>();

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, options: { ttl: number }): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && !this.isExpired(cached, options.ttl)) {
      return cached.value as T;
    }

    const value = await fetcher();
    this.cache.set(key, { value, timestamp: Date.now() });
    return value;
  }

  private isExpired(item: CachedItem, ttl: number): boolean {
    return Date.now() - item.timestamp > ttl * 1000;
  }
}
```

### Rate Limiting

```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await delay(waitTime);
    }

    this.requests.push(now);
  }
}
```

## Debugging Guide

### Enable Verbose Logging

```typescript
class Logger {
  private logLevel: 'error' | 'warn' | 'info' | 'debug';

  debug(message: string, data?: any): void {
    if (this.logLevel === 'debug') {
      console.error(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
    }
  }

  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error);
  }
}
```

### Message Tracing

```typescript
function traceMessage(direction: 'in' | 'out', message: any): void {
  if (process.env.MCP_DEBUG === 'true') {
    console.error(`[${direction.toUpperCase()}] ${JSON.stringify(message)}`);
  }
}

// Use in handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  traceMessage('in', request);
  const result = await handleTool(request);
  traceMessage('out', result);
  return result;
});
```

### Health Check Tool

Always implement a health check tool for debugging:

```typescript
{
  name: 'health_check',
  description: 'Check server health and connectivity',
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false
  }
}
```

## Evidence-Based Limitations

Based on actual implementations examined:

1. **Stdio Transport Only**: These patterns are verified for stdio transport. Other transports (HTTP, WebSocket) not tested.

2. **SDK Version**: Patterns based on `@modelcontextprotocol/sdk` versions 0.5.0 and 1.0.4. API may differ in other versions.

3. **Node.js Focus**: All examples use Node.js/TypeScript. Patterns may need adaptation for other languages.

4. **Plugin Architecture**: Plugin patterns extracted from research-mcp-server. May need modification for different use cases.

5. **Error Handling**: Retry and circuit breaker patterns shown work for network errors. May need tuning for specific failure modes.

6. **Testing**: Integration test patterns require server to expose testing interface. Production servers may need different approaches.

## Next Steps After Reading This Skill

1. Review `templates/basic-mcp-server.js` for a minimal working example
2. Check `examples/real-tools.md` for actual tool implementations
3. Use `scripts/test-mcp-server.sh` to validate your server
4. Refer to `reference/mcp-protocol-spec.md` for protocol details
5. Study `reference/common-patterns.md` for advanced patterns

## Related Skills

- Evidence-Based Validation: Use when making claims about MCP capabilities
- API Integration: Relevant when MCP tools wrap external APIs

## Memory MCP Integration Patterns

This section documents how MCP servers integrate with multi-tier memory systems, based on the actual implementation in `/home/user/Sartor-claude-network/src/mcp/`.

### Memory System Architecture

The Sartor memory system provides a 3-tier storage architecture:

- **Hot Tier**: Firebase Realtime Database (<100ms) - for frequently accessed memories
- **Warm Tier**: Local file storage (<500ms) - for recent context
- **Cold Tier**: GitHub repository (1-5s) - for long-term archival

MCP servers can expose this memory system through tools, allowing Claude and other AI clients to store and retrieve episodic, semantic, procedural, and working memories.

### Memory Tool Implementation

#### Tool Definitions for Memory Operations

```typescript
// Based on /home/user/Sartor-claude-network/src/mcp/memory-server.ts
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'memory_create',
        description: 'Create a new memory in the system',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The content to remember',
            },
            type: {
              type: 'string',
              enum: [
                'episodic',
                'semantic',
                'procedural',
                'working',
                'refinement_trace',
                'expert_consensus',
              ],
              description: 'Type of memory',
            },
            importance: {
              type: 'number',
              description: 'Importance score 0-1 (default 0.5)',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for categorization',
            },
          },
          required: ['content', 'type'],
        },
      },
      {
        name: 'memory_search',
        description: 'Search memories by type and importance',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['episodic', 'semantic', 'procedural', 'working'],
              description: 'Filter by memory type',
            },
            min_importance: {
              type: 'number',
              description: 'Minimum importance score',
            },
            limit: {
              type: 'number',
              description: 'Max results (default 10)',
            },
          },
        },
      },
    ],
  };
});
```

#### Multi-Tier Storage Integration

```typescript
// Based on /home/user/Sartor-claude-network/src/mcp/memory-server.ts
import { FileStore, MemoryType } from './file-store.js';
import { MultiTierStore } from './multi-tier-store.js';

// Use MultiTierStore for Firebase integration with FileStore fallback
const useMultiTier = process.env.USE_MULTI_TIER !== 'false';
const multiTierStore = useMultiTier ? new MultiTierStore() : null;
const fileStore = new FileStore();

const isMultiTier = () => multiTierStore !== null;

// Tool handler with automatic fallback
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'memory_create': {
      const memType = typeMap[args.type] || MemoryType.WORKING;
      const memOptions = {
        importance_score: args.importance || 0.5,
        tags: args.tags || [],
      };

      // Use MultiTierStore (async) if available, otherwise FileStore (sync)
      const mem = isMultiTier()
        ? await multiTierStore!.createMemory(args.content, memType, memOptions)
        : fileStore.createMemory(args.content, memType, memOptions);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                id: mem.id,
                type: mem.type,
                tier: isMultiTier() ? 'multi' : 'file',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }
});
```

### HTTP Transport for Agent Access

In addition to stdio transport (for Claude Desktop), MCP servers can expose memory tools via HTTP for agent-to-agent communication.

#### HTTP Server Pattern

```typescript
// Based on /home/user/Sartor-claude-network/src/mcp/http-server.ts
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';

const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3001;
const app = createMcpExpressApp();

// Map to store transports by session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

// POST endpoint for JSON-RPC requests
const mcpPostHandler = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    const transport = transports[sessionId];
    await transport.handleRequest(req, res, req.body);
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (newSessionId) => {
        console.error(`Session initialized: ${newSessionId}`);
        transports[newSessionId] = transport;
      },
    });

    const server = createMemoryServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }
};

app.post('/mcp', mcpPostHandler);
app.listen(MCP_PORT);
```

### HTTP Client for Agents

Agents can access the memory system through an HTTP client that wraps MCP protocol calls.

#### Client Implementation Pattern

```typescript
// Based on /home/user/Sartor-claude-network/src/mcp/mcp-http-client.ts
export class MCPHttpClient {
  private baseUrl: string;
  private sessionId: string | null = null;
  private requestId = 0;

  constructor(baseUrl: string = 'http://localhost:3001/mcp') {
    this.baseUrl = baseUrl;
  }

  async initialize(): Promise<boolean> {
    const request = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'mcp-http-client', version: '1.0.0' },
      },
    };

    const response = await this.sendRequest(request, null);
    if (!this.sessionId) return false;

    // Send initialized notification
    await this.sendRequest(
      {
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: 'notifications/initialized',
      },
      this.sessionId
    );

    return true;
  }

  async createMemory(params: {
    content: string;
    type: 'episodic' | 'semantic' | 'procedural' | 'working';
    importance?: number;
    tags?: string[];
  }): Promise<{ id: string } | null> {
    if (!this.sessionId) return null;

    const request = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: 'memory_create',
        arguments: params,
      },
    };

    const response = await this.sendRequest(request, this.sessionId);
    const resultText = response?.result?.content?.[0]?.text;
    const result = JSON.parse(resultText);

    return result.success ? { id: result.id } : null;
  }

  private async sendRequest(request: any, sessionId: string | null) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };

    if (sessionId) {
      headers['mcp-session-id'] = sessionId;
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    // Extract session ID from response headers
    if (!this.sessionId) {
      const newSessionId = response.headers.get('mcp-session-id');
      if (newSessionId) this.sessionId = newSessionId;
    }

    return response.json();
  }
}
```

### Bootstrap Mesh Pattern

For agents that need unified access to multiple memory sources, the Bootstrap Mesh pattern provides automatic fallback across backends.

#### Multi-Source Memory Access

```typescript
// Based on /home/user/Sartor-claude-network/src/mcp/bootstrap-mesh.ts
export class BootstrapMesh {
  private mcpUrl: string;
  private fileStore: FileStore;
  private githubStore: GitHubColdTier | null = null;
  private firebaseDb: Database | null = null;

  // Backend availability tracking
  private mcpAvailable = false;
  private fileAvailable = false;
  private githubAvailable = false;
  private firebaseAvailable = false;

  constructor(config?: BootstrapMeshConfig) {
    this.mcpUrl = config?.mcpUrl || 'http://localhost:3001/mcp';
    this.fileStore = new FileStore(config?.localPath);

    // Initialize backends based on availability
    this.initializeBackends(config);
  }

  /**
   * Load memories, automatically falling back through:
   * MCP HTTP → Local File → GitHub → Firebase
   */
  async load(options?: LoadOptions): Promise<Memory[]> {
    // Try MCP HTTP first
    if (this.mcpAvailable) {
      const memories = await this.loadFromMCP(options);
      if (memories.length > 0) {
        console.error('[BootstrapMesh] Loaded from MCP HTTP');
        return memories;
      }
    }

    // Fall back to local file storage
    if (this.fileAvailable) {
      const memories = this.fileStore.searchMemories(
        { type: options?.type ? [options.type] : undefined },
        options?.limit || 10
      );
      if (memories.length > 0) {
        console.error('[BootstrapMesh] Loaded from local file');
        return memories;
      }
    }

    // Fall back to GitHub cold tier
    if (this.githubAvailable && this.githubStore) {
      const memories = await this.loadFromGitHub(options);
      if (memories.length > 0) {
        console.error('[BootstrapMesh] Loaded from GitHub');
        return memories;
      }
    }

    // Final fallback to Firebase
    if (this.firebaseAvailable && this.firebaseDb) {
      const memories = await this.loadFromFirebase(options);
      console.error('[BootstrapMesh] Loaded from Firebase');
      return memories;
    }

    console.error('[BootstrapMesh] No backends available');
    return [];
  }

  /**
   * Get backend health status
   */
  getStatus(): BackendStatus {
    return {
      mcp: this.mcpAvailable,
      local: this.fileAvailable,
      github: this.githubAvailable,
      firebase: this.firebaseAvailable,
    };
  }
}
```

### Memory Types for Multi-Agent Systems

The memory system supports specialized memory types for agent coordination:

#### Refinement Trace Memories

```typescript
// Tracks iterative improvement loops
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'memory_create_refinement_trace': {
      const content = JSON.stringify({
        task_id: args.task_id,
        iterations: args.iterations,
        final_result: args.final_result,
        success: args.success,
        duration_ms: args.duration_ms,
      });

      const traceOptions = {
        importance_score: args.success ? 0.8 : 0.6,
        tags: ['refinement', `task:${args.task_id}`, `iterations:${args.iterations}`],
      };

      const mem = await multiTierStore.createMemory(
        content,
        MemoryType.REFINEMENT_TRACE,
        traceOptions
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, trace_id: mem.id }, null, 2),
          },
        ],
      };
    }
  }
});
```

#### Expert Consensus Memories

```typescript
// Stores multi-agent voting results
case 'memory_search_expert_consensus': {
  const minAgreement = args.min_agreement ?? 0.5;
  const limit = args.limit || 10;

  const results = await multiTierStore.searchMemories({
    type: [MemoryType.EXPERT_CONSENSUS],
    min_importance: minAgreement
  }, limit);

  // Filter by task_type if provided
  const filtered = args.task_type
    ? results.filter(mem => {
        const content = JSON.parse(mem.content);
        return content.task_type === args.task_type;
      })
    : results;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(
        filtered.map(mem => ({
          id: mem.id,
          content: JSON.parse(mem.content),
          agreement: mem.importance_score,
          created_at: mem.created_at
        })), null, 2
      )
    }]
  };
}
```

### Key Integration Patterns

#### Pattern 1: Graceful Degradation

Always provide fallback storage options:

```typescript
const mem = isMultiTier()
  ? await multiTierStore!.createMemory(content, type, options)
  : fileStore.createMemory(content, type, options);
```

#### Pattern 2: Tier-Based Routing

Route memories to appropriate tiers based on importance:

```typescript
// High-importance memories (≥0.8) automatically archived to GitHub
if (memory.importance_score >= 0.8 && githubStore) {
  await githubStore.set(`${type}/${id}.json`, memory, `Archive high-importance memory: ${id}`);
}
```

#### Pattern 3: Session Management

HTTP transport requires explicit session lifecycle:

```typescript
// Initialize once per client
await client.initialize();

// Make multiple calls with same session
await client.createMemory({ content: '...', type: 'episodic' });
await client.searchMemories({ type: 'semantic', limit: 5 });

// Clean up when done
await client.close();
```

#### Pattern 4: Backend Health Monitoring

Always expose backend availability:

```typescript
const status = bootstrapMesh.getStatus();
console.log('MCP available:', status.mcp);
console.log('File storage available:', status.local);
console.log('GitHub available:', status.github);
console.log('Firebase available:', status.firebase);
```

### Reference Implementation Files

- **Memory Server (stdio)**: `/home/user/Sartor-claude-network/src/mcp/memory-server.ts`
- **Memory Server (HTTP)**: `/home/user/Sartor-claude-network/src/mcp/http-server.ts`
- **HTTP Client**: `/home/user/Sartor-claude-network/src/mcp/mcp-http-client.ts`
- **Bootstrap Mesh**: `/home/user/Sartor-claude-network/src/mcp/bootstrap-mesh.ts`
- **Multi-Tier Store**: `/home/user/Sartor-claude-network/src/mcp/multi-tier-store.ts`
- **File Store**: `/home/user/Sartor-claude-network/src/mcp/file-store.ts`

### Memory MCP Limitations

Based on actual implementation evidence:

1. **Session Persistence**: HTTP sessions require manual management. No automatic reconnection on timeout.

2. **Tier Latency**: Actual latencies depend on network conditions. Advertised targets (<100ms hot, <500ms warm, 1-5s cold) are goals, not guarantees.

3. **Concurrent Access**: No locking mechanism for concurrent writes. Last-write-wins semantics.

4. **Memory Search**: Basic filtering only. No semantic search or vector embeddings implemented yet.

5. **Storage Limits**: Firebase free tier has 1GB limit. File storage limited by disk space. GitHub has API rate limits (5000 req/hour authenticated).

6. **Transport Compatibility**: Stdio transport for Claude Desktop, HTTP transport for agents. Cannot mix transports within same session.

## Questions This Skill Helps Answer

- How do I structure an MCP server?
- What's the correct way to define MCP tools?
- How do I handle errors in MCP servers?
- Why is my stdio communication failing?
- How do I test an MCP server?
- What patterns work for extensible MCP servers?
- How do I implement retries and rate limiting?
- What causes common MCP server failures?
- How do I integrate MCP servers with memory systems?
- How do I expose memory tools via HTTP for agent access?
- What's the difference between stdio and HTTP transport for MCP?
- How do I implement multi-tier storage with automatic fallback?
- How do agents access shared memory through MCP?
