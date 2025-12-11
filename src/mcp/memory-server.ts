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
import { MultiTierStore } from './multi-tier-store.js';

// Use MultiTierStore for Firebase integration, with FileStore fallback
// MultiTierStore automatically falls back to file storage if Firebase is unavailable
const useMultiTier = process.env.USE_MULTI_TIER !== 'false';
const multiTierStore = useMultiTier ? new MultiTierStore() : null;
const fileStore = new FileStore();

// Helper to check if we're using multi-tier storage
const isMultiTier = () => multiTierStore !== null;

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
              enum: ['episodic', 'semantic', 'procedural', 'working', 'refinement_trace', 'expert_consensus'],
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
              enum: ['episodic', 'semantic', 'procedural', 'working', 'refinement_trace', 'expert_consensus'],
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
      {
        name: 'memory_create_refinement_trace',
        description: 'Create a refinement trace memory to track iterative improvement loops',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'The task ID this refinement trace is associated with',
            },
            iterations: {
              type: 'number',
              description: 'Number of refinement iterations performed',
            },
            final_result: {
              type: 'string',
              description: 'The final result after refinement',
            },
            success: {
              type: 'boolean',
              description: 'Whether the refinement process succeeded',
            },
            duration_ms: {
              type: 'number',
              description: 'Duration of the refinement process in milliseconds',
            },
          },
          required: ['task_id', 'iterations', 'final_result', 'success', 'duration_ms'],
        },
      },
      {
        name: 'memory_search_expert_consensus',
        description: 'Search for expert consensus memories from multi-agent voting',
        inputSchema: {
          type: 'object',
          properties: {
            task_type: {
              type: 'string',
              description: 'Filter by task type (optional)',
            },
            min_agreement: {
              type: 'number',
              description: 'Minimum agreement level (0-1, default 0.5)',
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
          refinement_trace: MemoryType.REFINEMENT_TRACE,
          expert_consensus: MemoryType.EXPERT_CONSENSUS,
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
          refinement_trace: MemoryType.REFINEMENT_TRACE,
          expert_consensus: MemoryType.EXPERT_CONSENSUS,
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

        // Use MultiTierStore (async) if available, otherwise FileStore (sync)
        const mem = isMultiTier()
          ? await multiTierStore!.createMemory(content, MemoryType.REFINEMENT_TRACE, traceOptions)
          : fileStore.createMemory(content, MemoryType.REFINEMENT_TRACE, traceOptions);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, trace_id: mem.id }, null, 2),
            },
          ],
        };
      }

      case 'memory_search_expert_consensus': {
        const minAgreement = (args.min_agreement as number) ?? 0.5;
        const limit = (args.limit as number) || 10;

        const consensusFilters = {
          type: [MemoryType.EXPERT_CONSENSUS],
          min_importance: minAgreement,
        };

        // Use MultiTierStore (async) if available, otherwise FileStore (sync)
        const results = isMultiTier()
          ? await multiTierStore!.searchMemories(consensusFilters, limit)
          : fileStore.searchMemories(consensusFilters, limit);

        // Filter by task_type if provided
        const filtered = args.task_type
          ? results.filter((mem) => {
              try {
                const content = JSON.parse(mem.content);
                return content.task_type === args.task_type;
              } catch {
                return false;
              }
            })
          : results;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                filtered.map((mem) => ({
                  id: mem.id,
                  content: JSON.parse(mem.content),
                  agreement: mem.importance_score,
                  created_at: mem.created_at,
                })),
                null,
                2
              ),
            },
          ],
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
