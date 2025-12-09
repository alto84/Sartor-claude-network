/**
 * MCP Server: Memory System
 *
 * Exposes the 3-tier memory system as callable tools for Claude.
 *
 * Tools provided:
 * - memory_create: Create a new memory
 * - memory_get: Retrieve a memory by ID
 * - memory_search: Search memories by filters
 * - memory_stats: Get memory system statistics
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { FileStore, MemoryType } from './file-store.js';

// Initialize file-based memory system
const memory = new FileStore();

// Create MCP server
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

        const mem = memory.createMemory(
          args.content as string,
          typeMap[args.type as string] || MemoryType.WORKING,
          {
            importance_score: (args.importance as number) || 0.5,
            tags: (args.tags as string[]) || [],
          }
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, id: mem.id, type: mem.type }, null, 2),
            },
          ],
        };
      }

      case 'memory_get': {
        const mem = memory.getMemory(args.id as string);

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

        const results = memory.searchMemories(
          {
            type: args.type ? [typeMap[args.type as string]] : undefined,
            min_importance: args.min_importance as number,
          },
          (args.limit as number) || 10
        );

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
        const stats = memory.getStats();
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

// Run server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Sartor Memory MCP Server running on stdio');
}

main().catch(console.error);
