/**
 * MCP Server: Google Drive Integration
 *
 * Exposes Google Drive operations as callable tools for Claude.
 * Integrates with the unified memory system for cross-system sync.
 *
 * Tools provided:
 * - gdrive_list: List files in Drive
 * - gdrive_search: Search for files
 * - gdrive_read: Read file content
 * - gdrive_write: Create/update file
 * - gdrive_delete: Delete file
 * - gdrive_sync_to_memory: Sync file to unified memory
 * - gdrive_create_folder: Create folder
 * - gdrive_status: Get connection status
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  GDriveClient,
  GDriveConfig,
  GDriveFile,
  MIME_TYPES,
  createGDriveClient,
} from './gdrive-client.js';
import {
  GDriveMemoryAdapter,
  GDriveMemoryConfig,
  createGDriveMemoryAdapter,
} from '../memory/gdrive-adapter.js';
import {
  UnifiedMemory,
  MemoryType,
  MemorySource,
} from '../memory/unified-types.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface GDriveServerConfig extends GDriveConfig {
  /** Memory adapter for unified memory integration */
  memoryAdapter?: GDriveMemoryAdapter;
  /** Auto-sync files to memory system */
  syncToMemory?: boolean;
}

// ============================================================================
// Input Validation Schemas
// ============================================================================

const ListInputSchema = z.object({
  folderId: z.string().optional().describe('Folder ID to list (default: root)'),
  pageSize: z.number().optional().default(50).describe('Number of files to return'),
  pageToken: z.string().optional().describe('Token for pagination'),
});

const SearchInputSchema = z.object({
  query: z.string().describe('Search query (supports Drive query syntax or plain text)'),
  pageSize: z.number().optional().default(20).describe('Number of results'),
  pageToken: z.string().optional().describe('Token for pagination'),
});

const ReadInputSchema = z.object({
  fileId: z.string().describe('The file ID to read'),
});

const WriteInputSchema = z.object({
  name: z.string().describe('File name (including extension)'),
  content: z.string().describe('File content'),
  mimeType: z.string().optional().default('text/plain').describe('MIME type'),
  folderId: z.string().optional().describe('Parent folder ID'),
  fileId: z.string().optional().describe('Existing file ID to update (if updating)'),
});

const DeleteInputSchema = z.object({
  fileId: z.string().describe('The file ID to delete'),
});

const CreateFolderInputSchema = z.object({
  name: z.string().describe('Folder name'),
  parentId: z.string().optional().describe('Parent folder ID'),
});

const SyncToMemoryInputSchema = z.object({
  fileId: z.string().describe('The file ID to sync to memory'),
  memoryType: z
    .enum(['episodic', 'semantic', 'procedural', 'working'])
    .optional()
    .default('semantic')
    .describe('Memory type for the synced content'),
  importance: z.number().optional().default(0.5).describe('Importance score (0-1)'),
  tags: z.array(z.string()).optional().describe('Tags for the memory'),
});

const GetOrCreateFolderInputSchema = z.object({
  path: z.string().describe('Folder path like "Claude-Memories/episodic"'),
});

// ============================================================================
// MCP Server Factory
// ============================================================================

export async function createGDriveMCPServer(config: GDriveServerConfig) {
  const client = createGDriveClient(config);
  let memoryAdapter = config.memoryAdapter;

  // Initialize client
  const authorized = await client.authorize();
  if (!authorized) {
    console.error('[GDriveMCP] Warning: Failed to authorize. Some operations may fail.');
  }

  const server = new Server(
    { name: 'sartor-gdrive', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // ==========================================================================
  // Tool Definitions
  // ==========================================================================

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'gdrive_list',
        description:
          'List files and folders in Google Drive. Returns file metadata including IDs, names, and types.',
        inputSchema: {
          type: 'object',
          properties: {
            folderId: {
              type: 'string',
              description: 'Folder ID to list contents of. Omit for root folder.',
            },
            pageSize: {
              type: 'number',
              description: 'Number of files to return (default: 50, max: 100)',
            },
            pageToken: {
              type: 'string',
              description: 'Token for fetching next page of results',
            },
          },
        },
      },
      {
        name: 'gdrive_search',
        description:
          'Search for files in Google Drive by content or name. Supports both plain text and Drive query syntax.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'Search query. Plain text for full-text search, or Drive query syntax like "name contains \'report\'"',
            },
            pageSize: {
              type: 'number',
              description: 'Number of results (default: 20)',
            },
            pageToken: {
              type: 'string',
              description: 'Token for pagination',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'gdrive_read',
        description:
          'Read the content of a file from Google Drive. For Google Docs, exports as plain text. For Google Sheets, exports as CSV.',
        inputSchema: {
          type: 'object',
          properties: {
            fileId: {
              type: 'string',
              description: 'The file ID to read',
            },
          },
          required: ['fileId'],
        },
      },
      {
        name: 'gdrive_write',
        description:
          'Create a new file or update an existing file in Google Drive. Provide fileId to update an existing file.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'File name including extension (e.g., "notes.txt", "data.json")',
            },
            content: {
              type: 'string',
              description: 'The content to write',
            },
            mimeType: {
              type: 'string',
              description: 'MIME type (default: text/plain). Common: text/plain, application/json, text/markdown',
            },
            folderId: {
              type: 'string',
              description: 'Parent folder ID (optional, uses root if not specified)',
            },
            fileId: {
              type: 'string',
              description: 'Existing file ID to update. If provided, updates instead of creates.',
            },
          },
          required: ['name', 'content'],
        },
      },
      {
        name: 'gdrive_delete',
        description: 'Delete a file from Google Drive (moves to trash)',
        inputSchema: {
          type: 'object',
          properties: {
            fileId: {
              type: 'string',
              description: 'The file ID to delete',
            },
          },
          required: ['fileId'],
        },
      },
      {
        name: 'gdrive_create_folder',
        description: 'Create a new folder in Google Drive',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Folder name',
            },
            parentId: {
              type: 'string',
              description: 'Parent folder ID (optional, uses root if not specified)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'gdrive_get_or_create_folder',
        description:
          'Get or create a folder path. Creates intermediate folders as needed. Example: "Claude-Memories/episodic"',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Folder path with "/" separators',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'gdrive_sync_to_memory',
        description:
          'Sync a Google Drive file to the unified memory system for cross-platform retrieval',
        inputSchema: {
          type: 'object',
          properties: {
            fileId: {
              type: 'string',
              description: 'The file ID to sync',
            },
            memoryType: {
              type: 'string',
              enum: ['episodic', 'semantic', 'procedural', 'working'],
              description: 'Type of memory to create (default: semantic)',
            },
            importance: {
              type: 'number',
              description: 'Importance score from 0 to 1 (default: 0.5)',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags to apply to the memory',
            },
          },
          required: ['fileId'],
        },
      },
      {
        name: 'gdrive_status',
        description: 'Get Google Drive connection status and memory folder info',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  }));

  // ==========================================================================
  // Tool Implementations
  // ==========================================================================

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        // --------------------------------------------------------------------
        // gdrive_list
        // --------------------------------------------------------------------
        case 'gdrive_list': {
          const input = ListInputSchema.parse(args);
          const result = await client.listFiles(
            input.folderId,
            input.pageSize,
            input.pageToken
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    folderId: input.folderId || 'root',
                    count: result.files.length,
                    nextPageToken: result.nextPageToken,
                    files: result.files.map((f) => ({
                      id: f.id,
                      name: f.name,
                      mimeType: f.mimeType,
                      isFolder: f.mimeType === MIME_TYPES.FOLDER,
                      modifiedTime: f.modifiedTime,
                      size: f.size,
                      webViewLink: f.webViewLink,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // --------------------------------------------------------------------
        // gdrive_search
        // --------------------------------------------------------------------
        case 'gdrive_search': {
          const input = SearchInputSchema.parse(args);
          const result = await client.searchFiles(
            input.query,
            input.pageSize,
            input.pageToken
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    query: input.query,
                    count: result.files.length,
                    nextPageToken: result.nextPageToken,
                    files: result.files.map((f) => ({
                      id: f.id,
                      name: f.name,
                      mimeType: f.mimeType,
                      isFolder: f.mimeType === MIME_TYPES.FOLDER,
                      modifiedTime: f.modifiedTime,
                      webViewLink: f.webViewLink,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // --------------------------------------------------------------------
        // gdrive_read
        // --------------------------------------------------------------------
        case 'gdrive_read': {
          const input = ReadInputSchema.parse(args);
          const file = await client.getFile(input.fileId);
          const content = await client.readFileContent(input.fileId);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    file: {
                      id: file.id,
                      name: file.name,
                      mimeType: file.mimeType,
                      modifiedTime: file.modifiedTime,
                      webViewLink: file.webViewLink,
                    },
                    content:
                      content.length > 50000
                        ? content.substring(0, 50000) + '\n... [truncated]'
                        : content,
                    truncated: content.length > 50000,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // --------------------------------------------------------------------
        // gdrive_write
        // --------------------------------------------------------------------
        case 'gdrive_write': {
          const input = WriteInputSchema.parse(args);
          let file: GDriveFile;

          if (input.fileId) {
            // Update existing file
            file = await client.updateFile(input.fileId, input.content);
          } else {
            // Create new file
            file = await client.createFile(
              input.name,
              input.content,
              input.mimeType,
              input.folderId
            );
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    operation: input.fileId ? 'updated' : 'created',
                    file: {
                      id: file.id,
                      name: file.name,
                      mimeType: file.mimeType,
                      webViewLink: file.webViewLink,
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // --------------------------------------------------------------------
        // gdrive_delete
        // --------------------------------------------------------------------
        case 'gdrive_delete': {
          const input = DeleteInputSchema.parse(args);
          await client.deleteFile(input.fileId);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: `File ${input.fileId} moved to trash`,
                    fileId: input.fileId,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // --------------------------------------------------------------------
        // gdrive_create_folder
        // --------------------------------------------------------------------
        case 'gdrive_create_folder': {
          const input = CreateFolderInputSchema.parse(args);
          const folder = await client.createFolder(input.name, input.parentId);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    folder: {
                      id: folder.id,
                      name: folder.name,
                      webViewLink: folder.webViewLink,
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // --------------------------------------------------------------------
        // gdrive_get_or_create_folder
        // --------------------------------------------------------------------
        case 'gdrive_get_or_create_folder': {
          const input = GetOrCreateFolderInputSchema.parse(args);
          const folder = await client.getOrCreateFolder(input.path);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    path: input.path,
                    folder: {
                      id: folder.id,
                      name: folder.name,
                      webViewLink: folder.webViewLink,
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // --------------------------------------------------------------------
        // gdrive_sync_to_memory
        // --------------------------------------------------------------------
        case 'gdrive_sync_to_memory': {
          const input = SyncToMemoryInputSchema.parse(args);

          if (!memoryAdapter) {
            // Create memory adapter on demand if not provided
            memoryAdapter = createGDriveMemoryAdapter({
              credentialsPath: config.credentialsPath,
              tokenPath: config.tokenPath,
              scopes: config.scopes,
            });
          }

          // Read the file
          const file = await client.getFile(input.fileId);
          const content = await client.readFileContent(input.fileId);

          // Create memory
          const memory = await memoryAdapter.createMemory(
            content,
            input.memoryType as MemoryType,
            {
              importance: input.importance,
              tags: [
                ...(input.tags || []),
                'gdrive-sync',
                `fileId:${input.fileId}`,
                `filename:${file.name}`,
              ],
              source: {
                surface: 'api',
                backend: 'gdrive',
              },
            }
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: 'File synced to memory system',
                    file: {
                      id: file.id,
                      name: file.name,
                    },
                    memory: {
                      id: memory.id,
                      type: memory.type,
                      importance: memory.importance,
                      tags: memory.tags,
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // --------------------------------------------------------------------
        // gdrive_status
        // --------------------------------------------------------------------
        case 'gdrive_status': {
          const connected = await client.testConnection();

          let memoryStatus = null;
          if (memoryAdapter) {
            try {
              memoryStatus = await memoryAdapter.getStatus();
            } catch {
              memoryStatus = { connected: false };
            }
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    drive: {
                      connected,
                    },
                    memory: memoryStatus || {
                      connected: false,
                      note: 'Memory adapter not initialized. Use gdrive_sync_to_memory to initialize.',
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // --------------------------------------------------------------------
        // Unknown tool
        // --------------------------------------------------------------------
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
      console.error(`[GDriveMCP] Error in ${name}:`, errorMessage);

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

export async function runGDriveServer() {
  const config: GDriveServerConfig = {
    credentialsPath: process.env.GDRIVE_CREDENTIALS_PATH || 'credentials.json',
    tokenPath: process.env.GDRIVE_TOKEN_PATH || 'token.json',
    scopes: process.env.GDRIVE_SCOPES?.split(',') || undefined,
    syncToMemory: process.env.GDRIVE_SYNC_TO_MEMORY === 'true',
  };

  console.error('[GDriveMCP] Starting server...');
  console.error(`[GDriveMCP] Credentials: ${config.credentialsPath}`);
  console.error(`[GDriveMCP] Token: ${config.tokenPath}`);

  const server = await createGDriveMCPServer(config);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('[GDriveMCP] Server running on stdio');
}

// Run if executed directly
const isDirectRun =
  process.argv[1]?.endsWith('gdrive-server.ts') ||
  process.argv[1]?.endsWith('gdrive-server.js');

if (isDirectRun) {
  runGDriveServer().catch((error) => {
    console.error('[GDriveMCP] Fatal error:', error);
    process.exit(1);
  });
}
