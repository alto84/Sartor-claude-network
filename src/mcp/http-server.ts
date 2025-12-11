/**
 * MCP HTTP Server: Memory System
 *
 * Exposes the 3-tier memory system via HTTP transport on port 3001
 * for agents to access directly.
 *
 * This server provides the same tools as memory-server.ts but uses
 * StreamableHTTPServerTransport instead of stdio.
 */

import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { FileStore, MemoryType } from './file-store';
import { MultiTierStore } from './multi-tier-store';

// Use MultiTierStore for Firebase integration, with FileStore fallback
// MultiTierStore automatically falls back to file storage if Firebase is unavailable
const useMultiTier = process.env.USE_MULTI_TIER !== 'false';
const multiTierStore = useMultiTier ? new MultiTierStore() : null;
const fileStore = new FileStore();

// Helper to check if we're using multi-tier storage
const isMultiTier = () => multiTierStore !== null;

// Create MCP server setup function
function createMemoryServer(): Server {
  const server = new Server(
    {
      name: 'sartor-memory',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
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
                enum: ['episodic', 'semantic', 'procedural', 'working'],
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
          name: 'memory_get',
          description: 'Retrieve a memory by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'The memory ID',
              },
            },
            required: ['id'],
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
        {
          name: 'memory_stats',
          description: 'Get memory system statistics',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'memory_create': {
          const typeMap: Record<string, MemoryType> = {
            episodic: MemoryType.EPISODIC,
            semantic: MemoryType.SEMANTIC,
            procedural: MemoryType.PROCEDURAL,
            working: MemoryType.WORKING,
          };

          const memType = typeMap[args.type as string] || MemoryType.WORKING;
          const memOptions = {
            importance_score: (args.importance as number) || 0.5,
            tags: (args.tags as string[]) || [],
          };

          // Use MultiTierStore (async) if available, otherwise FileStore (sync)
          const mem = isMultiTier()
            ? await multiTierStore!.createMemory(args.content as string, memType, memOptions)
            : fileStore.createMemory(args.content as string, memType, memOptions);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: true, id: mem.id, type: mem.type, tier: isMultiTier() ? 'multi' : 'file' }, null, 2),
              },
            ],
          };
        }

        case 'memory_get': {
          // Use MultiTierStore (async) if available, otherwise FileStore (sync)
          const mem = isMultiTier()
            ? await multiTierStore!.getMemory(args.id as string)
            : fileStore.getMemory(args.id as string);

          if (!mem) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: 'Memory not found' }) }],
            };
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(mem, null, 2) }],
          };
        }

        case 'memory_search': {
          const typeMap: Record<string, MemoryType> = {
            episodic: MemoryType.EPISODIC,
            semantic: MemoryType.SEMANTIC,
            procedural: MemoryType.PROCEDURAL,
            working: MemoryType.WORKING,
          };

          const searchFilters = {
            type: args.type ? [typeMap[args.type as string]] : undefined,
            min_importance: args.min_importance as number,
          };
          const searchLimit = (args.limit as number) || 10;

          // Use MultiTierStore (async) if available, otherwise FileStore (sync)
          const results = isMultiTier()
            ? await multiTierStore!.searchMemories(searchFilters, searchLimit)
            : fileStore.searchMemories(searchFilters, searchLimit);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  results.map((mem) => ({ id: mem.id, content: mem.content, type: mem.type })),
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'memory_stats': {
          // Use MultiTierStore (async) if available, otherwise FileStore (sync)
          const stats = isMultiTier()
            ? await multiTierStore!.getStats()
            : fileStore.getStats();
          return {
            content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
          };
        }

        default:
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
          };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: String(error) }) }],
      };
    }
  });

  return server;
}

// HTTP Server setup
const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3001;
const app = createMcpExpressApp();

// Map to store transports by session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

// MCP POST endpoint
const mcpPostHandler = async (req: any, res: any) => {
  const sessionId = req.headers['mcp-session-id'];

  if (sessionId) {
    console.error(`Received MCP request for session: ${sessionId}`);
  }

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true, // Use JSON responses instead of SSE streams
        onsessioninitialized: (newSessionId: string) => {
          console.error(`Session initialized with ID: ${newSessionId}`);
          transports[newSessionId] = transport;
        },
      });

      // Set up onclose handler to clean up transport when closed
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.error(`Transport closed for session ${sid}, removing from transports map`);
          delete transports[sid];
        }
      };

      // Connect the transport to the MCP server BEFORE handling the request
      const server = createMemoryServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return; // Already handled
    } else {
      // Invalid request - no session ID or not initialization request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request with existing transport
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
};

// MCP GET endpoint for SSE streams
const mcpGetHandler = async (req: any, res: any) => {
  const sessionId = req.headers['mcp-session-id'];

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const lastEventId = req.headers['last-event-id'];
  if (lastEventId) {
    console.error(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
  } else {
    console.error(`Establishing new SSE stream for session ${sessionId}`);
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// MCP DELETE endpoint for session termination
const mcpDeleteHandler = async (req: any, res: any) => {
  const sessionId = req.headers['mcp-session-id'];

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  console.error(`Received session termination request for session ${sessionId}`);

  try {
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing session termination');
    }
  }
};

// Set up routes
app.post('/mcp', mcpPostHandler);
app.get('/mcp', mcpGetHandler);
app.delete('/mcp', mcpDeleteHandler);

// Start server
app.listen(MCP_PORT, (error?: Error) => {
  if (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
  console.error(`Sartor Memory MCP HTTP Server listening on http://localhost:${MCP_PORT}/mcp`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down server...');

  // Close all active transports to properly clean up resources
  for (const sessionId in transports) {
    try {
      console.error(`Closing transport for session ${sessionId}`);
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }

  console.error('Server shutdown complete');
  process.exit(0);
});
