/**
 * MCP Server: Obsidian Integration
 *
 * Exposes Obsidian vault operations as callable tools for Claude.
 * Integrates with the unified memory system for cross-system search.
 *
 * Tools provided:
 * - obsidian_list: List files/folders in vault
 * - obsidian_read: Read note content and metadata
 * - obsidian_write: Create or replace note
 * - obsidian_append: Append to existing note
 * - obsidian_search: Search vault
 * - obsidian_daily: Get/create daily note
 * - obsidian_patch: Insert at specific heading
 * - obsidian_sync_to_memory: Sync note to unified memory system
 * - search_all: Search across Obsidian and memory system
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import * as https from 'https';
import {
  UnifiedMemory,
  MemoryType,
  MemorySource,
} from '../memory/unified-types.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ObsidianConfig {
  apiUrl: string;
  apiKey: string;
  vaultPath?: string;
  syncToMemory?: boolean;
}

export interface ObsidianServerConfig extends ObsidianConfig {
  memoryAdapter?: ObsidianMemoryAdapter;
}

export interface ObsidianFile {
  path: string;
  name: string;
  extension: string;
  isFolder: boolean;
  size?: number;
  created?: string;
  modified?: string;
}

export interface ObsidianNote {
  path: string;
  content: string;
  frontmatter?: Record<string, unknown>;
  tags?: string[];
  links?: string[];
}

export interface ObsidianSearchResult {
  path: string;
  matches: Array<{
    line: number;
    text: string;
    context?: string;
  }>;
  score?: number;
}

// ============================================================================
// Obsidian REST API Client
// ============================================================================

export class ObsidianClient {
  private apiUrl: string;
  private apiKey: string;
  private httpsAgent: https.Agent;

  constructor(config: ObsidianConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    // Allow self-signed certificates for local Obsidian
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.apiUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit & { agent?: https.Agent } = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    // Use custom https agent for Node.js fetch
    if (url.startsWith('https://')) {
      // @ts-ignore - agent is valid for Node.js fetch
      options.agent = this.httpsAgent;
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Obsidian API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return {} as T;
      }

      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Obsidian request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * List files and folders in a directory
   */
  async list(path: string = '/'): Promise<ObsidianFile[]> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const response = await this.request<{ files: ObsidianFile[] }>(
      'GET',
      `/vault${normalizedPath}`
    );
    return response.files || [];
  }

  /**
   * Read a note's content
   */
  async read(path: string): Promise<ObsidianNote> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const content = await this.request<string>(
      'GET',
      `/vault${normalizedPath}`
    );

    // Parse frontmatter if present
    const note: ObsidianNote = {
      path: normalizedPath,
      content: typeof content === 'string' ? content : String(content),
    };

    // Extract frontmatter
    const frontmatterMatch = note.content.match(/^---\n([\s\S]*?)\n---\n/);
    if (frontmatterMatch) {
      try {
        // Simple YAML-like parsing
        const frontmatterStr = frontmatterMatch[1];
        note.frontmatter = {};
        frontmatterStr.split('\n').forEach((line) => {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            note.frontmatter![key] = value;
          }
        });
      } catch {
        // Ignore frontmatter parsing errors
      }
    }

    // Extract tags
    const tagMatches = note.content.match(/#[\w-]+/g);
    if (tagMatches) {
      note.tags = Array.from(new Set(tagMatches.map((t) => t.slice(1))));
    }

    // Extract wiki links
    const linkMatches = note.content.match(/\[\[([^\]]+)\]\]/g);
    if (linkMatches) {
      note.links = linkMatches.map((l) => l.slice(2, -2).split('|')[0]);
    }

    return note;
  }

  /**
   * Write/create a note (replaces existing content)
   */
  async write(path: string, content: string): Promise<void> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    await this.request('PUT', `/vault${normalizedPath}`, content);
  }

  /**
   * Append content to an existing note
   */
  async append(path: string, content: string): Promise<void> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    await this.request('POST', `/vault${normalizedPath}`, {
      content,
      position: 'end',
    });
  }

  /**
   * Insert content at a specific heading
   */
  async patch(path: string, heading: string, content: string): Promise<void> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Read the current note
    const note = await this.read(normalizedPath);
    const lines = note.content.split('\n');

    // Find the heading
    const headingPattern = new RegExp(`^#{1,6}\\s+${heading}\\s*$`, 'i');
    let headingIndex = -1;
    let nextHeadingIndex = lines.length;

    for (let i = 0; i < lines.length; i++) {
      if (headingPattern.test(lines[i])) {
        headingIndex = i;
      } else if (headingIndex >= 0 && /^#{1,6}\s+/.test(lines[i])) {
        nextHeadingIndex = i;
        break;
      }
    }

    if (headingIndex === -1) {
      throw new Error(`Heading "${heading}" not found in ${path}`);
    }

    // Insert content after the heading
    const newLines = [
      ...lines.slice(0, headingIndex + 1),
      '',
      content,
      ...lines.slice(headingIndex + 1),
    ];

    await this.write(normalizedPath, newLines.join('\n'));
  }

  /**
   * Search the vault
   */
  async search(query: string): Promise<ObsidianSearchResult[]> {
    const response = await this.request<{ results: ObsidianSearchResult[] }>(
      'POST',
      '/search/simple/',
      { query }
    );
    return response.results || [];
  }

  /**
   * Get or create today's daily note
   */
  async getDaily(date?: string): Promise<ObsidianNote> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const dailyPath = `/Daily/${targetDate}.md`;

    try {
      return await this.read(dailyPath);
    } catch (error) {
      // Create daily note if it doesn't exist
      const template = `---
date: ${targetDate}
type: daily
---

# Daily Note: ${targetDate}

## Morning

## Tasks
- [ ]

## Notes

## Evening Reflection

`;
      await this.write(dailyPath, template);
      return await this.read(dailyPath);
    }
  }

  /**
   * Check if the API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('GET', '/');
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Memory Adapter for Obsidian-to-Memory Sync
// ============================================================================

export interface MemoryStore {
  createMemory(
    content: string,
    type: MemoryType,
    options?: {
      importance?: number;
      tags?: string[];
      source?: MemorySource;
    }
  ): Promise<UnifiedMemory>;

  searchMemories(
    filters: { type?: MemoryType[]; min_importance?: number; query?: string },
    limit?: number
  ): Promise<UnifiedMemory[]>;
}

export class ObsidianMemoryAdapter {
  private memoryStore: MemoryStore;

  constructor(memoryStore: MemoryStore) {
    this.memoryStore = memoryStore;
  }

  /**
   * Convert an Obsidian note to a unified memory
   */
  noteToMemory(note: ObsidianNote): Partial<UnifiedMemory> {
    // Determine memory type based on path or frontmatter
    let memoryType: MemoryType = 'semantic';
    const path = note.path.toLowerCase();

    if (path.includes('daily') || path.includes('journal')) {
      memoryType = 'episodic';
    } else if (path.includes('procedure') || path.includes('how-to')) {
      memoryType = 'procedural';
    } else if (path.includes('task') || path.includes('working')) {
      memoryType = 'working';
    }

    // Extract importance from frontmatter or default
    const importance =
      typeof note.frontmatter?.importance === 'number'
        ? note.frontmatter.importance
        : typeof note.frontmatter?.priority === 'string'
          ? this.priorityToImportance(note.frontmatter.priority as string)
          : 0.5;

    return {
      type: memoryType,
      content: note.content,
      importance,
      tags: note.tags || [],
      source: {
        surface: 'desktop',
        backend: 'obsidian',
      },
    };
  }

  private priorityToImportance(priority: string): number {
    const priorityMap: Record<string, number> = {
      critical: 1.0,
      high: 0.8,
      medium: 0.5,
      low: 0.3,
    };
    return priorityMap[priority.toLowerCase()] || 0.5;
  }

  /**
   * Sync an Obsidian note to the memory system
   */
  async syncToMemory(note: ObsidianNote): Promise<UnifiedMemory> {
    const memoryData = this.noteToMemory(note);

    const memory = await this.memoryStore.createMemory(
      memoryData.content!,
      memoryData.type!,
      {
        importance: memoryData.importance,
        tags: [
          ...(memoryData.tags || []),
          'obsidian-sync',
          `path:${note.path}`,
        ],
        source: memoryData.source,
      }
    );

    return memory;
  }

  /**
   * Search both Obsidian and memory system
   */
  async searchAll(
    query: string,
    obsidianClient: ObsidianClient
  ): Promise<{
    obsidian: ObsidianSearchResult[];
    memory: UnifiedMemory[];
  }> {
    const [obsidianResults, memoryResults] = await Promise.all([
      obsidianClient.search(query).catch(() => [] as ObsidianSearchResult[]),
      this.memoryStore
        .searchMemories({ query }, 20)
        .catch(() => [] as UnifiedMemory[]),
    ]);

    return {
      obsidian: obsidianResults,
      memory: memoryResults,
    };
  }
}

// ============================================================================
// Input Validation Schemas
// ============================================================================

const ListInputSchema = z.object({
  path: z.string().optional().default('/'),
});

const ReadInputSchema = z.object({
  path: z.string().describe('Path to the note file'),
});

const WriteInputSchema = z.object({
  path: z.string().describe('Path to the note file'),
  content: z.string().describe('Content to write'),
});

const AppendInputSchema = z.object({
  path: z.string().describe('Path to the note file'),
  content: z.string().describe('Content to append'),
});

const SearchInputSchema = z.object({
  query: z.string().describe('Search query'),
});

const DailyInputSchema = z.object({
  date: z
    .string()
    .optional()
    .describe('Date in YYYY-MM-DD format (defaults to today)'),
});

const PatchInputSchema = z.object({
  path: z.string().describe('Path to the note file'),
  heading: z.string().describe('Heading to insert content after'),
  content: z.string().describe('Content to insert'),
});

const SyncToMemoryInputSchema = z.object({
  path: z.string().describe('Path to the note to sync'),
});

const SearchAllInputSchema = z.object({
  query: z.string().describe('Search query'),
});

// ============================================================================
// MCP Server Factory
// ============================================================================

export async function createObsidianMCPServer(config: ObsidianServerConfig) {
  const client = new ObsidianClient(config);
  const memoryAdapter = config.memoryAdapter;

  const server = new Server(
    { name: 'sartor-obsidian', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // Tool definitions
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'obsidian_list',
        description:
          'List files and folders in the Obsidian vault at the specified path',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description:
                'Path to list (default: root). Example: "/Projects" or "Daily"',
            },
          },
        },
      },
      {
        name: 'obsidian_read',
        description:
          'Read the content and metadata of an Obsidian note. Returns content, frontmatter, tags, and links.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description:
                'Path to the note file. Example: "Projects/my-project.md"',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'obsidian_write',
        description:
          'Create a new note or completely replace an existing note in the vault',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description:
                'Path where to write the note. Example: "Projects/new-note.md"',
            },
            content: {
              type: 'string',
              description: 'The full content of the note (markdown)',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'obsidian_append',
        description: 'Append content to the end of an existing note',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the note file',
            },
            content: {
              type: 'string',
              description: 'Content to append to the note',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'obsidian_search',
        description:
          'Search the Obsidian vault for notes containing the query',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query string',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'obsidian_daily',
        description:
          'Get or create the daily note for a specific date. Creates from template if it does not exist.',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description:
                'Date in YYYY-MM-DD format. Defaults to today if not specified.',
            },
          },
        },
      },
      {
        name: 'obsidian_patch',
        description:
          'Insert content under a specific heading in an existing note. Useful for adding items to specific sections.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the note file',
            },
            heading: {
              type: 'string',
              description:
                'The heading text to insert content after (without # prefix)',
            },
            content: {
              type: 'string',
              description: 'Content to insert after the heading',
            },
          },
          required: ['path', 'heading', 'content'],
        },
      },
      {
        name: 'obsidian_sync_to_memory',
        description:
          'Sync an Obsidian note to the unified memory system for cross-system retrieval',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the note to sync',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_all',
        description:
          'Search across both Obsidian vault and the unified memory system. Returns results from both sources.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
          },
          required: ['query'],
        },
      },
    ],
  }));

  // Tool implementations
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'obsidian_list': {
          const input = ListInputSchema.parse(args);
          const files = await client.list(input.path);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    path: input.path,
                    count: files.length,
                    files: files.map((f) => ({
                      name: f.name,
                      path: f.path,
                      isFolder: f.isFolder,
                      extension: f.extension,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'obsidian_read': {
          const input = ReadInputSchema.parse(args);
          const note = await client.read(input.path);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    path: note.path,
                    content: note.content,
                    frontmatter: note.frontmatter,
                    tags: note.tags,
                    links: note.links,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'obsidian_write': {
          const input = WriteInputSchema.parse(args);
          await client.write(input.path, input.content);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Note written to ${input.path}`,
                    path: input.path,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'obsidian_append': {
          const input = AppendInputSchema.parse(args);
          await client.append(input.path, input.content);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Content appended to ${input.path}`,
                    path: input.path,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'obsidian_search': {
          const input = SearchInputSchema.parse(args);
          const results = await client.search(input.query);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    query: input.query,
                    count: results.length,
                    results: results.map((r) => ({
                      path: r.path,
                      matches: r.matches,
                      score: r.score,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'obsidian_daily': {
          const input = DailyInputSchema.parse(args);
          const note = await client.getDaily(input.date);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    date: input.date || new Date().toISOString().split('T')[0],
                    path: note.path,
                    content: note.content,
                    frontmatter: note.frontmatter,
                    tags: note.tags,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'obsidian_patch': {
          const input = PatchInputSchema.parse(args);
          await client.patch(input.path, input.heading, input.content);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Content inserted under heading "${input.heading}" in ${input.path}`,
                    path: input.path,
                    heading: input.heading,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'obsidian_sync_to_memory': {
          const input = SyncToMemoryInputSchema.parse(args);

          if (!memoryAdapter) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    error:
                      'Memory adapter not configured. Set memoryAdapter in server config.',
                  }),
                },
              ],
            };
          }

          const note = await client.read(input.path);
          const memory = await memoryAdapter.syncToMemory(note);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Note synced to memory system`,
                    notePath: input.path,
                    memoryId: memory.id,
                    memoryType: memory.type,
                    importance: memory.importance,
                    tags: memory.tags,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'search_all': {
          const input = SearchAllInputSchema.parse(args);

          if (!memoryAdapter) {
            // Fallback to Obsidian-only search
            const results = await client.search(input.query);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      query: input.query,
                      obsidian: {
                        count: results.length,
                        results: results.map((r) => ({
                          path: r.path,
                          matches: r.matches,
                        })),
                      },
                      memory: {
                        count: 0,
                        results: [],
                        note: 'Memory adapter not configured',
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const results = await memoryAdapter.searchAll(input.query, client);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    query: input.query,
                    obsidian: {
                      count: results.obsidian.length,
                      results: results.obsidian.map((r) => ({
                        path: r.path,
                        matches: r.matches,
                      })),
                    },
                    memory: {
                      count: results.memory.length,
                      results: results.memory.map((m) => ({
                        id: m.id,
                        type: m.type,
                        content:
                          m.content.length > 200
                            ? m.content.slice(0, 200) + '...'
                            : m.content,
                        importance: m.importance,
                        tags: m.tags,
                      })),
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        default:
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: `Unknown tool: ${name}` }),
              },
            ],
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[ObsidianMCP] Error in ${name}:`, errorMessage);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: errorMessage,
              tool: name,
            }),
          },
        ],
      };
    }
  });

  return server;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

export async function runObsidianServer() {
  const config: ObsidianServerConfig = {
    apiUrl: process.env.OBSIDIAN_API_URL || 'https://127.0.0.1:27124',
    apiKey: process.env.OBSIDIAN_API_KEY || '',
    syncToMemory: process.env.OBSIDIAN_SYNC_TO_MEMORY === 'true',
  };

  if (!config.apiKey) {
    console.error(
      '[ObsidianMCP] Warning: OBSIDIAN_API_KEY not set. API calls may fail.'
    );
  }

  // Optionally configure memory adapter if multi-tier store is available
  // This can be enhanced to dynamically load the memory store
  // For now, we leave memoryAdapter as undefined (Obsidian-only mode)

  const server = await createObsidianMCPServer(config);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('[ObsidianMCP] Server running on stdio');
  console.error(`[ObsidianMCP] API URL: ${config.apiUrl}`);
  console.error(`[ObsidianMCP] Sync to memory: ${config.syncToMemory}`);
}

// Run if executed directly
const isDirectRun =
  process.argv[1]?.endsWith('obsidian-server.ts') ||
  process.argv[1]?.endsWith('obsidian-server.js');

if (isDirectRun) {
  runObsidianServer().catch((error) => {
    console.error('[ObsidianMCP] Fatal error:', error);
    process.exit(1);
  });
}
