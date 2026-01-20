/**
 * Tests for Google Drive Memory Adapter
 *
 * Tests cover:
 * - GDriveClient: API interactions with mocked googleapis
 * - GDriveMemoryAdapter: Memory conversion and CRUD operations
 * - Round-trip tests: memory -> doc -> memory
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  GDriveMemoryAdapter,
  GDriveMemoryConfig,
  calculateContentHash,
  parseFrontmatter,
} from '../gdrive-adapter';
import {
  GDriveClient,
  GDriveConfig,
  GDriveFile,
  GDriveSearchResult,
  GDriveApiError,
  MIME_TYPES,
} from '../../mcp/gdrive-client';
import { UnifiedMemory, MemoryType } from '../unified-types';

// Mock googleapis
jest.mock('googleapis', () => {
  const mockDrive = {
    files: {
      list: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      export: jest.fn(),
    },
    about: {
      get: jest.fn(),
    },
  };

  const mockAuth = {
    OAuth2: jest.fn().mockImplementation(() => ({
      setCredentials: jest.fn(),
      generateAuthUrl: jest.fn(),
      getToken: jest.fn(),
      refreshAccessToken: jest.fn(),
    })),
  };

  return {
    google: {
      auth: mockAuth,
      drive: jest.fn(() => mockDrive),
    },
  };
});

// Mock fs for credential/token handling
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Get mocked modules
const fs = require('fs');
const { google } = require('googleapis');

describe('GDriveClient', () => {
  let client: GDriveClient;
  let mockDrive: any;
  const config: GDriveConfig = {
    credentialsPath: '/path/to/credentials.json',
    tokenPath: '/path/to/token.json',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  };

  const mockCredentials = {
    installed: {
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      redirect_uris: ['urn:ietf:wg:oauth:2.0:oob'],
    },
  };

  const mockToken = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expiry_date: Date.now() + 3600000, // 1 hour from now
  };

  beforeEach(() => {
    jest.clearAllMocks();
    client = new GDriveClient(config);
    mockDrive = google.drive();

    // Setup default fs mocks
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockImplementation((pathArg: unknown) => {
      const pathStr = String(pathArg);
      if (pathStr.includes('credentials')) {
        return JSON.stringify(mockCredentials);
      }
      if (pathStr.includes('token')) {
        return JSON.stringify(mockToken);
      }
      return '';
    });
  });

  describe('testConnection', () => {
    it('should return true on successful API call', async () => {
      mockDrive.about.get.mockResolvedValueOnce({
        data: { user: { displayName: 'Test User' } },
      });

      const result = await client.testConnection();

      expect(result).toBe(true);
      expect(mockDrive.about.get).toHaveBeenCalledWith({ fields: 'user' });
    });

    it('should return false on API failure', async () => {
      mockDrive.about.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.testConnection();

      expect(result).toBe(false);
    });

    it('should return false when not authorized', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const unauthorizedClient = new GDriveClient(config);

      const result = await unauthorizedClient.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('listFiles', () => {
    it('should return file list from root', async () => {
      const mockFiles: GDriveFile[] = [
        { id: 'file1', name: 'test1.txt', mimeType: 'text/plain' },
        { id: 'file2', name: 'test2.txt', mimeType: 'text/plain' },
      ];

      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: mockFiles,
          nextPageToken: undefined,
        },
      });

      const result = await client.listFiles();

      expect(result.files).toHaveLength(2);
      expect(result.files[0].name).toBe('test1.txt');
      expect(mockDrive.files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'trashed = false',
          pageSize: 100,
        })
      );
    });

    it('should return files from specific folder', async () => {
      const folderId = 'folder123';
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [{ id: 'file1', name: 'doc.txt', mimeType: 'text/plain' }],
        },
      });

      const result = await client.listFiles(folderId);

      expect(result.files).toHaveLength(1);
      expect(mockDrive.files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: `'${folderId}' in parents and trashed = false`,
        })
      );
    });

    it('should handle pagination token', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [{ id: 'file1', name: 'test.txt', mimeType: 'text/plain' }],
          nextPageToken: 'next-page-token',
        },
      });

      const result = await client.listFiles(undefined, 10);

      expect(result.nextPageToken).toBe('next-page-token');
    });

    it('should throw GDriveApiError on API error', async () => {
      const apiError = new Error('API Error');
      (apiError as any).code = 403;
      mockDrive.files.list.mockRejectedValueOnce(apiError);

      await expect(client.listFiles()).rejects.toThrow();
    });
  });

  describe('searchFiles', () => {
    it('should search with plain text query', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [
            { id: 'result1', name: 'matching-file.txt', mimeType: 'text/plain' },
          ],
        },
      });

      const result = await client.searchFiles('test query');

      expect(result.files).toHaveLength(1);
      expect(mockDrive.files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.stringContaining("fullText contains 'test query'"),
        })
      );
    });

    it('should search with Drive query syntax', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [] },
      });

      await client.searchFiles("name contains 'test'");

      expect(mockDrive.files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.stringContaining("name contains 'test'"),
        })
      );
    });

    it('should treat query with single quotes as raw Drive query', async () => {
      // When query contains single quotes, it's treated as a raw Drive query
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [] },
      });

      await client.searchFiles("name contains 'test's query'");

      expect(mockDrive.files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.stringContaining("name contains 'test's query'"),
        })
      );
    });
  });

  describe('readFileContent', () => {
    it('should read plain text file content', async () => {
      const fileContent = 'This is the file content';

      mockDrive.files.get
        .mockResolvedValueOnce({
          data: { id: 'file1', name: 'test.txt', mimeType: 'text/plain' },
        })
        .mockResolvedValueOnce({
          data: fileContent,
        });

      const content = await client.readFileContent('file1');

      expect(content).toBe(fileContent);
    });

    it('should export Google Doc as plain text', async () => {
      const docContent = 'Exported document content';

      mockDrive.files.get.mockResolvedValueOnce({
        data: {
          id: 'doc1',
          name: 'My Doc',
          mimeType: MIME_TYPES.DOCUMENT,
        },
      });
      mockDrive.files.export.mockResolvedValueOnce({
        data: docContent,
      });

      const content = await client.readFileContent('doc1');

      expect(content).toBe(docContent);
      expect(mockDrive.files.export).toHaveBeenCalledWith({
        fileId: 'doc1',
        mimeType: 'text/plain',
      });
    });

    it('should export Google Spreadsheet as CSV', async () => {
      const csvContent = 'col1,col2\nval1,val2';

      mockDrive.files.get.mockResolvedValueOnce({
        data: {
          id: 'sheet1',
          name: 'My Sheet',
          mimeType: MIME_TYPES.SPREADSHEET,
        },
      });
      mockDrive.files.export.mockResolvedValueOnce({
        data: csvContent,
      });

      const content = await client.readFileContent('sheet1');

      expect(content).toBe(csvContent);
      expect(mockDrive.files.export).toHaveBeenCalledWith({
        fileId: 'sheet1',
        mimeType: 'text/csv',
      });
    });
  });

  describe('createFile', () => {
    it('should create a new file', async () => {
      const newFile: GDriveFile = {
        id: 'newfile1',
        name: 'new-file.txt',
        mimeType: 'text/plain',
        createdTime: '2024-01-15T10:00:00.000Z',
      };

      mockDrive.files.create.mockResolvedValueOnce({
        data: newFile,
      });

      const result = await client.createFile(
        'new-file.txt',
        'File content',
        'text/plain'
      );

      expect(result.id).toBe('newfile1');
      expect(result.name).toBe('new-file.txt');
      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: { name: 'new-file.txt', mimeType: 'text/plain' },
          media: { mimeType: 'text/plain', body: 'File content' },
        })
      );
    });

    it('should create file in specific folder', async () => {
      const folderId = 'parent-folder-123';

      mockDrive.files.create.mockResolvedValueOnce({
        data: {
          id: 'newfile2',
          name: 'child-file.txt',
          mimeType: 'text/plain',
          parents: [folderId],
        },
      });

      const result = await client.createFile(
        'child-file.txt',
        'Content',
        'text/plain',
        folderId
      );

      expect(result.parents).toContain(folderId);
      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            parents: [folderId],
          }),
        })
      );
    });
  });

  describe('updateFile', () => {
    it('should update file content', async () => {
      mockDrive.files.get.mockResolvedValueOnce({
        data: { id: 'file1', name: 'test.txt', mimeType: 'text/plain' },
      });

      mockDrive.files.update.mockResolvedValueOnce({
        data: {
          id: 'file1',
          name: 'test.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-15T12:00:00.000Z',
        },
      });

      const result = await client.updateFile('file1', 'Updated content');

      expect(result.id).toBe('file1');
      expect(mockDrive.files.update).toHaveBeenCalledWith(
        expect.objectContaining({
          fileId: 'file1',
          media: expect.objectContaining({ body: 'Updated content' }),
        })
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      mockDrive.files.delete.mockResolvedValueOnce({});

      await expect(client.deleteFile('file-to-delete')).resolves.not.toThrow();

      expect(mockDrive.files.delete).toHaveBeenCalledWith({
        fileId: 'file-to-delete',
      });
    });
  });

  describe('getOrCreateFolder', () => {
    it('should find existing folder', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [
            { id: 'folder1', name: 'Claude-Memories', mimeType: MIME_TYPES.FOLDER },
          ],
        },
      });

      const result = await client.getOrCreateFolder('Claude-Memories');

      expect(result.id).toBe('folder1');
      expect(result.name).toBe('Claude-Memories');
    });

    it('should create folder if not exists', async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: { files: [] },
      });

      mockDrive.files.create.mockResolvedValueOnce({
        data: {
          id: 'newfolder1',
          name: 'New-Folder',
          mimeType: MIME_TYPES.FOLDER,
        },
      });

      const result = await client.getOrCreateFolder('New-Folder');

      expect(result.id).toBe('newfolder1');
      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            mimeType: MIME_TYPES.FOLDER,
          }),
        })
      );
    });

    it('should create nested folder path', async () => {
      // First folder exists
      mockDrive.files.list
        .mockResolvedValueOnce({
          data: {
            files: [{ id: 'parent1', name: 'Claude-Memories', mimeType: MIME_TYPES.FOLDER }],
          },
        })
        // Second folder doesn't exist
        .mockResolvedValueOnce({
          data: { files: [] },
        });

      mockDrive.files.create.mockResolvedValueOnce({
        data: {
          id: 'child1',
          name: 'episodic',
          mimeType: MIME_TYPES.FOLDER,
          parents: ['parent1'],
        },
      });

      const result = await client.getOrCreateFolder('Claude-Memories/episodic');

      expect(result.id).toBe('child1');
      expect(result.name).toBe('episodic');
    });
  });

  describe('error handling', () => {
    it('should handle network errors with retry', async () => {
      // Network errors trigger retry based on message content
      const networkError = new Error('network timeout');

      mockDrive.files.list
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          data: { files: [] },
        });

      // This should eventually succeed after retry
      const result = await client.listFiles();

      expect(result.files).toEqual([]);
      expect(mockDrive.files.list).toHaveBeenCalledTimes(2);
    }, 15000);

    it('should convert API error codes to GDriveApiError', async () => {
      const apiError = new Error('Rate limit exceeded');
      (apiError as any).code = 429;

      mockDrive.files.list.mockRejectedValueOnce(apiError);

      await expect(client.listFiles()).rejects.toThrow(GDriveApiError);
    });

    it('should not retry client errors (4xx)', async () => {
      const clientError = new Error('Not found');
      (clientError as any).code = 404;

      mockDrive.files.list.mockRejectedValueOnce(clientError);

      await expect(client.listFiles()).rejects.toThrow();
      expect(mockDrive.files.list).toHaveBeenCalledTimes(1);
    });

    it('should throw GDriveApiError with status code', async () => {
      const serverError = new Error('Internal server error');
      (serverError as any).code = 500;

      mockDrive.files.list.mockRejectedValueOnce(serverError);

      try {
        await client.listFiles();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(GDriveApiError);
        expect((error as GDriveApiError).statusCode).toBe(500);
      }
    });
  });
});

describe('GDriveMemoryAdapter', () => {
  let adapter: GDriveMemoryAdapter;
  let mockClient: jest.Mocked<GDriveClient>;
  const config: GDriveMemoryConfig = {
    credentialsPath: '/path/to/credentials.json',
    tokenPath: '/path/to/token.json',
    memoryFolderName: 'Claude-Memories',
    defaultSurface: 'code',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new GDriveMemoryAdapter(config);

    // Create mock client with proper typing using any to avoid TS issues
    mockClient = {
      authorize: jest.fn<any>().mockResolvedValue(true),
      isAuthorized: jest.fn<any>().mockResolvedValue(true),
      testConnection: jest.fn<any>().mockResolvedValue(true),
      getConfig: jest.fn<any>().mockReturnValue(config),
      listFiles: jest.fn<any>(),
      searchFiles: jest.fn<any>(),
      getFile: jest.fn<any>(),
      readFileContent: jest.fn<any>(),
      createFile: jest.fn<any>(),
      updateFile: jest.fn<any>(),
      deleteFile: jest.fn<any>(),
      createFolder: jest.fn<any>(),
      getOrCreateFolder: jest.fn<any>(),
    } as unknown as jest.Mocked<GDriveClient>;

    // Setup folder structure
    mockClient.getOrCreateFolder.mockImplementation(async (path: string) => {
      const name = path.split('/').pop() || path;
      return {
        id: `folder-${name}`,
        name,
        mimeType: MIME_TYPES.FOLDER,
      };
    });

    // Inject mock client
    adapter.setClient(mockClient);
  });

  describe('memoryToDocContent', () => {
    it('should convert UnifiedMemory to doc content with frontmatter', () => {
      const memory: UnifiedMemory = {
        id: 'mem_episodic_123',
        type: 'episodic',
        content: 'This is test content for the memory.',
        summary: 'A test memory',
        importance: 0.8,
        source: {
          surface: 'code',
          backend: 'gdrive',
          userId: 'user123',
          sessionId: 'session456',
        },
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
        lastAccessedAt: '2024-01-15T12:00:00.000Z',
        accessCount: 5,
        tags: ['test', 'memory'],
        categories: ['development', 'testing'],
        tier: 'warm',
      };

      const docContent = adapter.memoryToDocContent(memory);

      expect(docContent).toContain('---');
      expect(docContent).toContain('id: mem_episodic_123');
      expect(docContent).toContain('type: episodic');
      expect(docContent).toContain('importance: 0.8');
      expect(docContent).toContain('tags:');
      expect(docContent).toContain('  - test');
      expect(docContent).toContain('  - memory');
      expect(docContent).toContain('categories:');
      expect(docContent).toContain('  - development');
      expect(docContent).toContain('source:');
      expect(docContent).toContain('  surface: code');
      expect(docContent).toContain('  backend: gdrive');
      expect(docContent).toContain('  userId: user123');
      expect(docContent).toContain('tier: warm');
      expect(docContent).toContain('## Summary');
      expect(docContent).toContain('A test memory');
      expect(docContent).toContain('## Content');
      expect(docContent).toContain('This is test content for the memory.');
    });

    it('should handle memory without optional fields', () => {
      const memory: UnifiedMemory = {
        id: 'mem_semantic_789',
        type: 'semantic',
        content: 'Minimal content',
        importance: 0.5,
        source: {
          surface: 'api',
          backend: 'gdrive',
        },
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
        lastAccessedAt: '2024-01-15T10:00:00.000Z',
        accessCount: 0,
        tags: [],
        tier: 'warm',
      };

      const docContent = adapter.memoryToDocContent(memory);

      expect(docContent).toContain('id: mem_semantic_789');
      expect(docContent).toContain('type: semantic');
      expect(docContent).not.toContain('## Summary');
      expect(docContent).not.toContain('categories:');
      expect(docContent).not.toContain('userId:');
    });

    it('should include sync metadata when present', () => {
      const memory: UnifiedMemory = {
        id: 'mem_procedural_sync',
        type: 'procedural',
        content: 'Synced content',
        importance: 0.7,
        source: { surface: 'desktop', backend: 'gdrive' },
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
        lastAccessedAt: '2024-01-15T10:00:00.000Z',
        accessCount: 1,
        tags: [],
        tier: 'warm',
        sync: {
          version: 3,
          contentHash: 'abc123def',
          lastSyncedAt: '2024-01-15T11:00:00.000Z',
          pendingSync: false,
          availableIn: ['gdrive', 'firebase'],
        },
      };

      const docContent = adapter.memoryToDocContent(memory);

      expect(docContent).toContain('sync:');
      expect(docContent).toContain('  version: 3');
      expect(docContent).toContain('  contentHash: abc123def');
      expect(docContent).toContain('  pendingSync: false');
      expect(docContent).toContain('  availableIn:');
      expect(docContent).toContain('    - gdrive');
      expect(docContent).toContain('    - firebase');
    });
  });

  describe('docToMemory', () => {
    it('should parse doc content to UnifiedMemory', () => {
      const file: GDriveFile = {
        id: 'file123',
        name: 'mem_episodic_123.txt',
        mimeType: 'text/plain',
        createdTime: '2024-01-15T10:00:00.000Z',
        modifiedTime: '2024-01-15T12:00:00.000Z',
      };

      const content = `---
id: mem_episodic_123
type: episodic
importance: 0.85
tags:
  - test
  - parsing
source:
  surface: code
  backend: gdrive
createdAt: 2024-01-15T10:00:00.000Z
updatedAt: 2024-01-15T12:00:00.000Z
lastAccessedAt: 2024-01-15T12:00:00.000Z
accessCount: 3
tier: warm
---

# Test Memory

## Summary

This is a summary of the test memory.

## Content

This is the actual content of the memory.`;

      const memory = adapter.docToMemory(file, content);

      expect(memory.id).toBe('mem_episodic_123');
      expect(memory.type).toBe('episodic');
      expect(memory.importance).toBe(0.85);
      expect(memory.tags).toEqual(['test', 'parsing']);
      expect(memory.source.surface).toBe('code');
      expect(memory.source.backend).toBe('gdrive');
      expect(memory.content).toBe('This is the actual content of the memory.');
      expect(memory.summary).toBe('This is a summary of the test memory.');
      expect(memory.tier).toBe('warm');
    });

    it('should handle doc without frontmatter', () => {
      const file: GDriveFile = {
        id: 'file456',
        name: 'random-doc.txt',
        mimeType: 'text/plain',
        createdTime: '2024-01-15T10:00:00.000Z',
      };

      const content = '# Just a doc\n\nSome content here.';

      const memory = adapter.docToMemory(file, content);

      expect(memory.id).toContain('mem_episodic_');
      expect(memory.type).toBe('episodic');
      expect(memory.importance).toBe(0.5);
      expect(memory.source.surface).toBe('code');
      expect(memory.source.backend).toBe('gdrive');
    });

    it('should support legacy importance_score field', () => {
      const file: GDriveFile = {
        id: 'legacy1',
        name: 'legacy.txt',
        mimeType: 'text/plain',
      };

      const content = `---
importance_score: 0.9
---
Content`;

      const memory = adapter.docToMemory(file, content);

      expect(memory.importance).toBe(0.9);
    });

    it('should extract ID from filename if not in frontmatter', () => {
      const file: GDriveFile = {
        id: 'file789',
        name: 'mem_semantic_999.txt',
        mimeType: 'text/plain',
      };

      const content = `---
type: semantic
---
Content`;

      const memory = adapter.docToMemory(file, content);

      expect(memory.id).toBe('mem_semantic_999');
    });
  });

  describe('createMemory', () => {
    it('should create a new memory in Drive', async () => {
      mockClient.createFile.mockResolvedValueOnce({
        id: 'newfile1',
        name: 'mem_semantic_test.txt',
        mimeType: 'text/plain',
      });

      const memory = await adapter.createMemory('Test memory content', 'semantic', {
        importance: 0.7,
        tags: ['test', 'create'],
        summary: 'A test summary',
      });

      expect(memory.id).toContain('mem_semantic_');
      expect(memory.type).toBe('semantic');
      expect(memory.content).toBe('Test memory content');
      expect(memory.importance).toBe(0.7);
      expect(memory.tags).toEqual(['test', 'create']);
      expect(memory.summary).toBe('A test summary');
      expect(memory.source.backend).toBe('gdrive');
      expect(memory.tier).toBe('warm');

      expect(mockClient.createFile).toHaveBeenCalledWith(
        expect.stringContaining('mem_semantic_'),
        expect.stringContaining('id: mem_semantic_'),
        MIME_TYPES.TEXT,
        'folder-semantic'
      );
    });

    it('should use default values when options not provided', async () => {
      mockClient.createFile.mockResolvedValueOnce({
        id: 'newfile2',
        name: 'mem_episodic_default.txt',
        mimeType: 'text/plain',
      });

      const memory = await adapter.createMemory('Simple content', 'episodic');

      expect(memory.importance).toBe(0.5);
      expect(memory.tags).toEqual([]);
      expect(memory.source.surface).toBe('code');
    });

    it('should create memory with categories', async () => {
      mockClient.createFile.mockResolvedValueOnce({
        id: 'newfile3',
        name: 'mem_procedural_cat.txt',
        mimeType: 'text/plain',
      });

      const memory = await adapter.createMemory('Procedure steps', 'procedural', {
        categories: ['workflow', 'automation'],
      });

      expect(memory.categories).toEqual(['workflow', 'automation']);
    });
  });

  describe('getMemory', () => {
    it('should retrieve memory by ID from type subfolder', async () => {
      const mockFile: GDriveFile = {
        id: 'file123',
        name: 'mem_episodic_test.txt',
        mimeType: 'text/plain',
        createdTime: '2024-01-15T10:00:00.000Z',
      };

      const mockContent = `---
id: mem_episodic_test
type: episodic
importance: 0.5
---

## Content

Test content`;

      mockClient.searchFiles.mockImplementation(async (query: string) => {
        if (query.includes('mem_episodic_test') && query.includes('folder-episodic')) {
          return { files: [mockFile] };
        }
        return { files: [] };
      });

      mockClient.readFileContent.mockResolvedValueOnce(mockContent);

      const memory = await adapter.getMemory('mem_episodic_test');

      expect(memory).not.toBeNull();
      expect(memory!.id).toBe('mem_episodic_test');
      expect(memory!.type).toBe('episodic');
    });

    it('should search all type folders if not found in first', async () => {
      const mockFile: GDriveFile = {
        id: 'file456',
        name: 'mem_procedural_proc.txt',
        mimeType: 'text/plain',
      };

      const mockContent = `---
id: mem_procedural_proc
type: procedural
---
Procedure steps`;

      mockClient.searchFiles.mockImplementation(async (query: string) => {
        if (query.includes('mem_procedural_proc') && query.includes('folder-procedural')) {
          return { files: [mockFile] };
        }
        return { files: [] };
      });

      mockClient.readFileContent.mockResolvedValueOnce(mockContent);

      const memory = await adapter.getMemory('mem_procedural_proc');

      expect(memory).not.toBeNull();
      expect(memory!.id).toBe('mem_procedural_proc');
    });

    it('should return null for non-existent memory', async () => {
      mockClient.searchFiles.mockResolvedValue({ files: [] });

      const memory = await adapter.getMemory('nonexistent');

      expect(memory).toBeNull();
    });

    it('should update access metadata when retrieving', async () => {
      const mockFile: GDriveFile = {
        id: 'file789',
        name: 'mem_semantic_access.txt',
        mimeType: 'text/plain',
      };

      const mockContent = `---
id: mem_semantic_access
type: semantic
accessCount: 5
---
Content`;

      mockClient.searchFiles.mockResolvedValueOnce({ files: [mockFile] });
      mockClient.readFileContent.mockResolvedValueOnce(mockContent);

      const memory = await adapter.getMemory('mem_semantic_access');

      expect(memory!.accessCount).toBe(6); // Incremented
      expect(new Date(memory!.lastAccessedAt).getTime()).toBeGreaterThan(
        Date.now() - 1000
      );
    });
  });

  describe('searchMemories', () => {
    it('should search and return memories matching query', async () => {
      const mockFiles: GDriveFile[] = [
        { id: 'result1', name: 'mem_1.txt', mimeType: 'text/plain' },
        { id: 'result2', name: 'mem_2.txt', mimeType: 'text/plain' },
      ];

      mockClient.searchFiles.mockResolvedValueOnce({ files: mockFiles });

      mockClient.readFileContent.mockImplementation(async (fileId: string) => {
        if (fileId === 'result1') {
          return `---
id: mem_1
type: episodic
---
Matching content`;
        }
        return `---
id: mem_2
type: semantic
---
Another match`;
      });

      const memories = await adapter.searchMemories('test query');

      expect(memories).toHaveLength(2);
      expect(memories[0].id).toBe('mem_1');
      expect(memories[1].id).toBe('mem_2');
    });

    it('should respect limit parameter', async () => {
      const manyFiles = Array(30)
        .fill(null)
        .map((_, i) => ({
          id: `file${i}`,
          name: `mem_${i}.txt`,
          mimeType: 'text/plain',
        }));

      mockClient.searchFiles.mockResolvedValueOnce({ files: manyFiles });

      mockClient.readFileContent.mockResolvedValue(`---
id: test
type: episodic
---
Content`);

      const memories = await adapter.searchMemories('query', 10);

      expect(memories.length).toBeLessThanOrEqual(10);
    });

    it('should handle search errors gracefully', async () => {
      mockClient.searchFiles.mockResolvedValueOnce({
        files: [{ id: 'file1', name: 'test.txt', mimeType: 'text/plain' }],
      });
      mockClient.readFileContent.mockRejectedValueOnce(new Error('Read error'));

      const memories = await adapter.searchMemories('query');

      expect(memories).toEqual([]);
    });
  });

  describe('listMemories', () => {
    it('should list all memories sorted by importance', async () => {
      mockClient.listFiles.mockImplementation(async (folderId?: string) => {
        if (folderId === 'folder-episodic') {
          return {
            files: [{ id: 'ep1', name: 'mem_ep1.txt', mimeType: 'text/plain' }],
          };
        }
        if (folderId === 'folder-semantic') {
          return {
            files: [{ id: 'sem1', name: 'mem_sem1.txt', mimeType: 'text/plain' }],
          };
        }
        return { files: [] };
      });

      mockClient.readFileContent.mockImplementation(async (fileId: string) => {
        if (fileId === 'ep1') {
          return `---
id: mem_ep1
type: episodic
importance: 0.6
---
Episodic content`;
        }
        return `---
id: mem_sem1
type: semantic
importance: 0.9
---
Semantic content`;
      });

      const memories = await adapter.listMemories();

      expect(memories.length).toBeGreaterThanOrEqual(2);
      // Should be sorted by importance (highest first)
      expect(memories[0].importance).toBeGreaterThanOrEqual(memories[1].importance);
    });

    it('should filter by type when specified', async () => {
      mockClient.listFiles.mockImplementation(async (folderId?: string) => {
        if (folderId === 'folder-semantic') {
          return {
            files: [
              { id: 'sem1', name: 'sem_1.txt', mimeType: 'text/plain' },
              { id: 'sem2', name: 'sem_2.txt', mimeType: 'text/plain' },
            ],
          };
        }
        return { files: [] };
      });

      mockClient.readFileContent.mockResolvedValue(`---
id: sem_test
type: semantic
---
Content`);

      const memories = await adapter.listMemories('semantic');

      expect(memories.every((m) => m.type === 'semantic')).toBe(true);
    });

    it('should skip folders in file list', async () => {
      mockClient.listFiles.mockResolvedValueOnce({
        files: [
          { id: 'file1', name: 'mem_1.txt', mimeType: 'text/plain' },
          { id: 'folder1', name: 'subfolder', mimeType: MIME_TYPES.FOLDER },
        ],
      });

      mockClient.readFileContent.mockResolvedValueOnce(`---
id: mem_1
type: episodic
---
Content`);

      const memories = await adapter.listMemories('episodic');

      // Should only have 1 memory, not the folder
      expect(mockClient.readFileContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateMemory', () => {
    it('should update an existing memory', async () => {
      const existingFile: GDriveFile = {
        id: 'file123',
        name: 'mem_update_test.txt',
        mimeType: 'text/plain',
      };

      mockClient.searchFiles.mockResolvedValue({ files: [existingFile] });
      mockClient.readFileContent.mockResolvedValueOnce(`---
id: mem_update_test
type: episodic
importance: 0.5
---
Original content`);
      mockClient.updateFile.mockResolvedValueOnce(existingFile);

      const updated = await adapter.updateMemory('mem_update_test', {
        content: 'Updated content',
        importance: 0.9,
      });

      expect(updated.content).toBe('Updated content');
      expect(updated.importance).toBe(0.9);
      expect(mockClient.updateFile).toHaveBeenCalled();
    });

    it('should throw error for non-existent memory', async () => {
      mockClient.searchFiles.mockResolvedValue({ files: [] });

      await expect(
        adapter.updateMemory('nonexistent', { content: 'New content' })
      ).rejects.toThrow('Memory not found');
    });
  });

  describe('deleteMemory', () => {
    it('should delete a memory', async () => {
      const fileToDelete: GDriveFile = {
        id: 'file-to-delete',
        name: 'mem_delete_test.txt',
        mimeType: 'text/plain',
      };

      mockClient.searchFiles.mockResolvedValueOnce({ files: [fileToDelete] });
      mockClient.deleteFile.mockResolvedValueOnce();

      await expect(adapter.deleteMemory('mem_delete_test')).resolves.not.toThrow();

      expect(mockClient.deleteFile).toHaveBeenCalledWith('file-to-delete');
    });

    it('should throw error for non-existent memory', async () => {
      mockClient.searchFiles.mockResolvedValue({ files: [] });

      await expect(adapter.deleteMemory('nonexistent')).rejects.toThrow(
        'Memory not found'
      );
    });
  });

  describe('Round-trip: memory -> doc -> memory', () => {
    it('should preserve all fields through round-trip conversion', () => {
      const originalMemory: UnifiedMemory = {
        id: 'mem_roundtrip_test',
        type: 'procedural',
        content: 'Step 1: Do this\nStep 2: Do that\nStep 3: Done',
        summary: 'A procedure for testing round-trip conversion',
        importance: 0.75,
        source: {
          surface: 'code',
          backend: 'gdrive',
          userId: 'testuser',
          sessionId: 'sess123',
        },
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
        lastAccessedAt: '2024-01-15T14:00:00.000Z',
        accessCount: 10,
        tags: ['procedure', 'test', 'roundtrip'],
        categories: ['testing', 'qa'],
        tier: 'warm',
      };

      // Convert to doc content
      const docContent = adapter.memoryToDocContent(originalMemory);

      // Create a mock file
      const mockFile: GDriveFile = {
        id: 'roundtrip-file',
        name: 'mem_roundtrip_test.txt',
        mimeType: 'text/plain',
        createdTime: '2024-01-15T10:00:00.000Z',
        modifiedTime: '2024-01-15T12:00:00.000Z',
      };

      // Convert back to memory
      const recoveredMemory = adapter.docToMemory(mockFile, docContent);

      // Verify all fields match
      expect(recoveredMemory.id).toBe(originalMemory.id);
      expect(recoveredMemory.type).toBe(originalMemory.type);
      expect(recoveredMemory.content).toBe(originalMemory.content);
      expect(recoveredMemory.summary).toBe(originalMemory.summary);
      expect(recoveredMemory.importance).toBe(originalMemory.importance);
      expect(recoveredMemory.source.surface).toBe(originalMemory.source.surface);
      expect(recoveredMemory.source.backend).toBe(originalMemory.source.backend);
      expect(recoveredMemory.source.userId).toBe(originalMemory.source.userId);
      expect(recoveredMemory.source.sessionId).toBe(originalMemory.source.sessionId);
      expect(recoveredMemory.createdAt).toBe(originalMemory.createdAt);
      expect(recoveredMemory.updatedAt).toBe(originalMemory.updatedAt);
      expect(recoveredMemory.accessCount).toBe(originalMemory.accessCount);
      expect(recoveredMemory.tags).toEqual(originalMemory.tags);
      expect(recoveredMemory.tier).toBe(originalMemory.tier);
    });

    it('should handle special characters in content', () => {
      const memory: UnifiedMemory = {
        id: 'mem_special',
        type: 'semantic',
        content:
          'Code example:\n```typescript\nconst x = "test";\n```\n\n- Item 1\n- Item 2',
        importance: 0.5,
        source: { surface: 'code', backend: 'gdrive' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        accessCount: 0,
        tags: [],
        tier: 'warm',
      };

      const docContent = adapter.memoryToDocContent(memory);
      const mockFile: GDriveFile = {
        id: 'special-file',
        name: 'mem_special.txt',
        mimeType: 'text/plain',
      };

      const recovered = adapter.docToMemory(mockFile, docContent);

      expect(recovered.content).toContain('```typescript');
      expect(recovered.content).toContain('const x = "test";');
    });

    it('should handle memory with sync metadata', () => {
      const memory: UnifiedMemory = {
        id: 'mem_sync_roundtrip',
        type: 'episodic',
        content: 'Synced memory content',
        importance: 0.8,
        source: { surface: 'code', backend: 'gdrive' },
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
        lastAccessedAt: '2024-01-15T14:00:00.000Z',
        accessCount: 3,
        tags: ['synced'],
        tier: 'warm',
        sync: {
          version: 5,
          contentHash: 'hash123',
          lastSyncedAt: '2024-01-15T13:00:00.000Z',
          pendingSync: true,
          availableIn: ['gdrive', 'obsidian'],
        },
      };

      const docContent = adapter.memoryToDocContent(memory);
      const mockFile: GDriveFile = {
        id: 'sync-file',
        name: 'mem_sync_roundtrip.txt',
        mimeType: 'text/plain',
      };

      const recovered = adapter.docToMemory(mockFile, docContent);

      expect(recovered.sync).toBeDefined();
      expect(recovered.sync!.version).toBe(5);
      expect(recovered.sync!.contentHash).toBe('hash123');
      expect(recovered.sync!.pendingSync).toBe(true);
      expect(recovered.sync!.availableIn).toEqual(['gdrive', 'obsidian']);
    });
  });

  describe('getStatus', () => {
    it('should return connected status with memory count', async () => {
      mockClient.testConnection.mockResolvedValueOnce(true);
      mockClient.listFiles.mockResolvedValue({
        files: [
          { id: 'f1', name: 'mem_1.txt', mimeType: 'text/plain' },
          { id: 'f2', name: 'mem_2.txt', mimeType: 'text/plain' },
        ],
      });

      const status = await adapter.getStatus();

      expect(status.connected).toBe(true);
      expect(status.memoryCount).toBeGreaterThan(0);
    });

    it('should return disconnected status on connection failure', async () => {
      mockClient.testConnection.mockResolvedValueOnce(false);

      const status = await adapter.getStatus();

      expect(status.connected).toBe(false);
      expect(status.memoryCount).toBeUndefined();
    });
  });
});

describe('Utility Functions', () => {
  describe('calculateContentHash', () => {
    it('should generate consistent hash for same content', () => {
      const content = 'Test content for hashing';
      const hash1 = calculateContentHash(content);
      const hash2 = calculateContentHash(content);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(8);
    });

    it('should generate different hashes for different content', () => {
      const hash1 = calculateContentHash('Content A');
      const hash2 = calculateContentHash('Content B');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = calculateContentHash('');

      expect(hash).toBeDefined();
      expect(hash.length).toBe(8);
    });

    it('should handle long content', () => {
      const longContent = 'x'.repeat(10000);
      const hash = calculateContentHash(longContent);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(8);
    });
  });

  describe('parseFrontmatter', () => {
    it('should parse basic frontmatter', () => {
      const content = `---
key1: value1
key2: 42
key3: true
---

Body content here`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.key1).toBe('value1');
      expect(result.frontmatter.key2).toBe(42);
      expect(result.frontmatter.key3).toBe(true);
      expect(result.body).toContain('Body content here');
    });

    it('should parse array values', () => {
      const content = `---
tags:
  - tag1
  - tag2
  - tag3
---

Content`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should parse nested object values', () => {
      const content = `---
source:
  surface: code
  backend: gdrive
---

Content`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.source).toBeDefined();
      expect(result.frontmatter.source.surface).toBe('code');
      expect(result.frontmatter.source.backend).toBe('gdrive');
    });

    it('should return empty frontmatter for content without YAML', () => {
      const content = '# Just a heading\n\nSome content';

      const result = parseFrontmatter(content);

      expect(result.frontmatter).toEqual({});
      expect(result.body).toBe(content);
    });

    it('should handle quoted strings', () => {
      const content = `---
title: "Quoted value"
subtitle: 'Single quoted'
---

Content`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.title).toBe('Quoted value');
      expect(result.frontmatter.subtitle).toBe('Single quoted');
    });

    it('should handle null values', () => {
      const content = `---
nullVal: null
tildeNull: ~
---

Content`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.nullVal).toBeNull();
      expect(result.frontmatter.tildeNull).toBeNull();
    });

    it('should handle false boolean', () => {
      const content = `---
enabled: false
disabled: true
---

Content`;

      const result = parseFrontmatter(content);

      expect(result.frontmatter.enabled).toBe(false);
      expect(result.frontmatter.disabled).toBe(true);
    });
  });
});

describe('GDriveApiError', () => {
  it('should create error with message and status code', () => {
    const error = new GDriveApiError('Not found', 404, 'getFile');

    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.operation).toBe('getFile');
    expect(error.name).toBe('GDriveApiError');
  });

  it('should be instanceof Error', () => {
    const error = new GDriveApiError('Test error', 500);

    expect(error instanceof Error).toBe(true);
    expect(error instanceof GDriveApiError).toBe(true);
  });
});
