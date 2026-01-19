/**
 * Tests for Obsidian Memory Adapter
 *
 * Tests cover:
 * - HttpObsidianClient: API interactions with mocked fetch
 * - ObsidianMemoryAdapter: Memory conversion and CRUD operations
 * - Round-trip tests: memory -> markdown -> memory
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  HttpObsidianClient,
  ObsidianMemoryAdapter,
  ObsidianConfig,
  ObsidianMemoryConfig,
  ObsidianNote,
  ObsidianSearchResult,
  ObsidianClient,
  calculateContentHash,
  parseFrontmatter,
} from '../obsidian-adapter';
import { UnifiedMemory, MemoryType } from '../unified-types';

// Mock global fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('HttpObsidianClient', () => {
  let client: HttpObsidianClient;
  const config: ObsidianConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'http://localhost:27123',
    timeout: 5000,
  };

  beforeEach(() => {
    client = new HttpObsidianClient(config);
    mockFetch.mockClear();
  });

  describe('getStatus (testConnection)', () => {
    it('should return connected status on successful API call', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ authenticated: true, vault: 'TestVault' }),
      } as Response);

      const status = await client.getStatus();

      expect(status.connected).toBe(true);
      expect(status.vaultName).toBe('TestVault');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:27123/',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should return disconnected status on API failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const status = await client.getStatus();

      expect(status.connected).toBe(false);
      expect(status.vaultName).toBeUndefined();
    });

    it('should return disconnected status on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const status = await client.getStatus();

      expect(status.connected).toBe(false);
    });
  });

  describe('listNotes (list)', () => {
    it('should return list of markdown files', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          files: ['note1.md', 'note2.md', 'image.png', 'note3.md'],
        }),
      } as Response);

      const files = await client.listNotes();

      expect(files).toEqual(['note1.md', 'note2.md', 'note3.md']);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:27123/vault/',
        expect.any(Object)
      );
    });

    it('should return list from specific folder', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          files: ['folder/note.md'],
        }),
      } as Response);

      const files = await client.listNotes('Memories/episodic');

      expect(files).toEqual(['folder/note.md']);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:27123/vault/Memories%2Fepisodic/',
        expect.any(Object)
      );
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      const files = await client.listNotes();

      expect(files).toEqual([]);
    });
  });

  describe('readNote (read)', () => {
    it('should return note content with parsed frontmatter', async () => {
      const noteContent = `---
id: mem_episodic_123
type: episodic
importance: 0.8
tags:
  - test
  - memory
---

# Test Note

This is the content.`;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/markdown' }),
        text: async () => noteContent,
      } as Response);

      const note = await client.readNote('test/note.md');

      expect(note).not.toBeNull();
      expect(note!.path).toBe('test/note.md');
      expect(note!.content).toBe(noteContent);
      expect(note!.frontmatter?.id).toBe('mem_episodic_123');
      expect(note!.frontmatter?.type).toBe('episodic');
      expect(note!.frontmatter?.importance).toBe(0.8);
      expect(note!.frontmatter?.tags).toEqual(['test', 'memory']);
      expect(note!.body).toContain('# Test Note');
    });

    it('should return null for non-existent note', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Not found'));

      const note = await client.readNote('nonexistent.md');

      expect(note).toBeNull();
    });

    it('should handle note without frontmatter', async () => {
      const noteContent = '# Simple Note\n\nNo frontmatter here.';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/markdown' }),
        text: async () => noteContent,
      } as Response);

      const note = await client.readNote('simple.md');

      expect(note).not.toBeNull();
      expect(note!.frontmatter).toBeUndefined();
      expect(note!.body).toBe(noteContent);
    });
  });

  describe('writeNote (write)', () => {
    it('should create or update note', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      } as Response);

      await expect(
        client.writeNote('test/note.md', '# Test\n\nContent')
      ).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:27123/vault/test%2Fnote.md',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify('# Test\n\nContent'),
        })
      );
    });

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(client.writeNote('test.md', 'content')).rejects.toThrow(
        'Obsidian API error: 500 Internal Server Error'
      );
    });
  });

  describe('appendToNote (append)', () => {
    it('should append content to note', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      } as Response);

      await expect(
        client.appendToNote('test.md', '\n- New item')
      ).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:27123/vault/test.md',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: '\n- New item' }),
        })
      );
    });
  });

  describe('searchNotes (search)', () => {
    it('should return search results', async () => {
      const searchResults: ObsidianSearchResult[] = [
        {
          path: 'Memories/episodic/mem_123.md',
          score: 0.95,
          matches: [{ match: 'test query', context: 'This is a test query result' }],
        },
        {
          path: 'Memories/semantic/mem_456.md',
          score: 0.8,
          matches: [{ match: 'test', context: 'Another test result' }],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => searchResults,
      } as Response);

      const results = await client.searchNotes('test query');

      expect(results).toHaveLength(2);
      expect(results[0].path).toBe('Memories/episodic/mem_123.md');
      expect(results[0].score).toBe(0.95);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:27123/search/simple/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'test query' }),
        })
      );
    });

    it('should return empty array on search error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Search failed'));

      const results = await client.searchNotes('query');

      expect(results).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle timeout', async () => {
      // Simulate abort due to timeout
      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

      const status = await client.getStatus();

      expect(status.connected).toBe(false);
    });

    it('should use tunnel URL when provided', () => {
      const tunnelConfig: ObsidianConfig = {
        apiKey: 'test-key',
        tunnelUrl: 'https://my-tunnel.example.com',
      };

      const tunnelClient = new HttpObsidianClient(tunnelConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ authenticated: true }),
      } as Response);

      tunnelClient.getStatus();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://my-tunnel.example.com/',
        expect.any(Object)
      );
    });
  });
});

describe('ObsidianMemoryAdapter', () => {
  let adapter: ObsidianMemoryAdapter;
  let mockClient: jest.Mocked<ObsidianClient>;
  const config: ObsidianMemoryConfig = {
    apiKey: 'test-api-key',
    memoryFolder: 'Memories',
    dailyNotesFolder: 'Daily',
    defaultSurface: 'code',
  };

  beforeEach(() => {
    adapter = new ObsidianMemoryAdapter(config);

    // Create mock client
    mockClient = {
      getStatus: jest.fn(),
      readNote: jest.fn(),
      writeNote: jest.fn(),
      deleteNote: jest.fn(),
      listNotes: jest.fn(),
      searchNotes: jest.fn(),
      appendToNote: jest.fn(),
      noteExists: jest.fn(),
    } as jest.Mocked<ObsidianClient>;

    // Inject mock client
    adapter.setClient(mockClient);
    mockFetch.mockClear();
  });

  describe('memoryToMarkdown', () => {
    it('should convert UnifiedMemory to markdown with frontmatter', () => {
      const memory: UnifiedMemory = {
        id: 'mem_episodic_123',
        type: 'episodic',
        content: 'This is test content for the memory.',
        summary: 'A test memory',
        importance: 0.8,
        source: {
          surface: 'code',
          backend: 'obsidian',
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

      const markdown = adapter.memoryToMarkdown(memory);

      expect(markdown).toContain('---');
      expect(markdown).toContain('id: mem_episodic_123');
      expect(markdown).toContain('type: episodic');
      expect(markdown).toContain('importance: 0.8');
      expect(markdown).toContain('tags:');
      expect(markdown).toContain('  - test');
      expect(markdown).toContain('  - memory');
      expect(markdown).toContain('categories:');
      expect(markdown).toContain('  - development');
      expect(markdown).toContain('source:');
      expect(markdown).toContain('  surface: code');
      expect(markdown).toContain('  backend: obsidian');
      expect(markdown).toContain('  userId: user123');
      expect(markdown).toContain('tier: warm');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('A test memory');
      expect(markdown).toContain('## Content');
      expect(markdown).toContain('This is test content for the memory.');
    });

    it('should handle memory without optional fields', () => {
      const memory: UnifiedMemory = {
        id: 'mem_semantic_789',
        type: 'semantic',
        content: 'Minimal content',
        importance: 0.5,
        source: {
          surface: 'api',
          backend: 'obsidian',
        },
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
        lastAccessedAt: '2024-01-15T10:00:00.000Z',
        accessCount: 0,
        tags: [],
        tier: 'warm',
      };

      const markdown = adapter.memoryToMarkdown(memory);

      expect(markdown).toContain('id: mem_semantic_789');
      expect(markdown).toContain('type: semantic');
      expect(markdown).not.toContain('summary:');
      expect(markdown).not.toContain('categories:');
      expect(markdown).not.toContain('userId:');
    });

    it('should include sync metadata when present', () => {
      const memory: UnifiedMemory = {
        id: 'mem_procedural_sync',
        type: 'procedural',
        content: 'Synced content',
        importance: 0.7,
        source: { surface: 'desktop', backend: 'obsidian' },
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
          availableIn: ['obsidian', 'firebase'],
        },
      };

      const markdown = adapter.memoryToMarkdown(memory);

      expect(markdown).toContain('sync:');
      expect(markdown).toContain('  version: 3');
      expect(markdown).toContain('  contentHash: abc123def');
      expect(markdown).toContain('  pendingSync: false');
      expect(markdown).toContain('  availableIn:');
      expect(markdown).toContain('    - obsidian');
      expect(markdown).toContain('    - firebase');
    });
  });

  describe('markdownToMemory', () => {
    it('should parse markdown note to UnifiedMemory', () => {
      const note: ObsidianNote = {
        path: 'Memories/episodic/mem_123.md',
        content: `---
id: mem_episodic_123
type: episodic
importance: 0.85
tags:
  - test
  - parsing
source:
  surface: code
  backend: obsidian
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

This is the actual content of the memory.`,
        frontmatter: {
          id: 'mem_episodic_123',
          type: 'episodic',
          importance: 0.85,
          tags: ['test', 'parsing'],
          source: { surface: 'code', backend: 'obsidian' },
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T12:00:00.000Z',
          lastAccessedAt: '2024-01-15T12:00:00.000Z',
          accessCount: 3,
          tier: 'warm',
        },
        body: `
# Test Memory

## Summary

This is a summary of the test memory.

## Content

This is the actual content of the memory.`,
      };

      const memory = adapter.markdownToMemory(note);

      expect(memory.id).toBe('mem_episodic_123');
      expect(memory.type).toBe('episodic');
      expect(memory.importance).toBe(0.85);
      expect(memory.tags).toEqual(['test', 'parsing']);
      expect(memory.source.surface).toBe('code');
      expect(memory.source.backend).toBe('obsidian');
      expect(memory.content).toBe('This is the actual content of the memory.');
      expect(memory.summary).toBe('This is a summary of the test memory.');
      expect(memory.tier).toBe('warm');
    });

    it('should handle note without frontmatter', () => {
      const note: ObsidianNote = {
        path: 'random/note.md',
        content: '# Just a note\n\nSome content here.',
        body: '# Just a note\n\nSome content here.',
      };

      const memory = adapter.markdownToMemory(note);

      expect(memory.id).toContain('mem_episodic_');
      expect(memory.type).toBe('episodic');
      expect(memory.importance).toBe(0.5);
      expect(memory.source.surface).toBe('code');
      expect(memory.source.backend).toBe('obsidian');
    });

    it('should support legacy importance_score field', () => {
      const note: ObsidianNote = {
        path: 'legacy.md',
        content: '---\nimportance_score: 0.9\n---\nContent',
        frontmatter: { importance_score: 0.9 },
        body: 'Content',
      };

      const memory = adapter.markdownToMemory(note);

      expect(memory.importance).toBe(0.9);
    });
  });

  describe('createMemory', () => {
    it('should create a new memory in the vault', async () => {
      mockClient.writeNote.mockResolvedValueOnce();

      const memory = await adapter.createMemory(
        'Test memory content',
        'semantic',
        {
          importance: 0.7,
          tags: ['test', 'create'],
          summary: 'A test summary',
        }
      );

      expect(memory.id).toContain('mem_semantic_');
      expect(memory.type).toBe('semantic');
      expect(memory.content).toBe('Test memory content');
      expect(memory.importance).toBe(0.7);
      expect(memory.tags).toEqual(['test', 'create']);
      expect(memory.summary).toBe('A test summary');
      expect(memory.source.backend).toBe('obsidian');
      expect(memory.tier).toBe('warm');

      expect(mockClient.writeNote).toHaveBeenCalledWith(
        expect.stringContaining('Memories/semantic/mem_semantic_'),
        expect.stringContaining('id: mem_semantic_')
      );
    });

    it('should use default values when options not provided', async () => {
      mockClient.writeNote.mockResolvedValueOnce();

      const memory = await adapter.createMemory('Simple content', 'episodic');

      expect(memory.importance).toBe(0.5);
      expect(memory.tags).toEqual([]);
      expect(memory.source.surface).toBe('code');
    });
  });

  describe('getMemory', () => {
    it('should retrieve memory by ID from type subfolder', async () => {
      const mockNote: ObsidianNote = {
        path: 'Memories/episodic/mem_test.md',
        content: '---\nid: mem_test\ntype: episodic\nimportance: 0.5\n---\nContent',
        frontmatter: { id: 'mem_test', type: 'episodic', importance: 0.5 },
        body: 'Content',
      };

      mockClient.readNote.mockImplementation(async (path: string) => {
        if (path === 'Memories/episodic/mem_test.md') {
          return mockNote;
        }
        return null;
      });

      const memory = await adapter.getMemory('mem_test');

      expect(memory).not.toBeNull();
      expect(memory!.id).toBe('mem_test');
      expect(memory!.type).toBe('episodic');
    });

    it('should search all type folders if not found in first', async () => {
      const mockNote: ObsidianNote = {
        path: 'Memories/procedural/mem_proc.md',
        content: '---\nid: mem_proc\ntype: procedural\n---\nProcedure steps',
        frontmatter: { id: 'mem_proc', type: 'procedural' },
        body: 'Procedure steps',
      };

      mockClient.readNote.mockImplementation(async (path: string) => {
        if (path === 'Memories/procedural/mem_proc.md') {
          return mockNote;
        }
        return null;
      });

      const memory = await adapter.getMemory('mem_proc');

      expect(memory).not.toBeNull();
      expect(memory!.id).toBe('mem_proc');
    });

    it('should return null for non-existent memory', async () => {
      mockClient.readNote.mockResolvedValue(null);

      const memory = await adapter.getMemory('nonexistent');

      expect(memory).toBeNull();
    });
  });

  describe('searchMemories', () => {
    it('should search and return memories matching query', async () => {
      const searchResults: ObsidianSearchResult[] = [
        { path: 'Memories/episodic/mem_1.md', score: 0.9, matches: [] },
        { path: 'Memories/semantic/mem_2.md', score: 0.8, matches: [] },
        { path: 'Other/note.md', score: 0.7, matches: [] }, // Should be filtered out
      ];

      const mockNotes: Record<string, ObsidianNote> = {
        'Memories/episodic/mem_1.md': {
          path: 'Memories/episodic/mem_1.md',
          content: '---\nid: mem_1\ntype: episodic\n---\nMatching content',
          frontmatter: { id: 'mem_1', type: 'episodic' },
          body: 'Matching content',
        },
        'Memories/semantic/mem_2.md': {
          path: 'Memories/semantic/mem_2.md',
          content: '---\nid: mem_2\ntype: semantic\n---\nAnother match',
          frontmatter: { id: 'mem_2', type: 'semantic' },
          body: 'Another match',
        },
      };

      mockClient.searchNotes.mockResolvedValueOnce(searchResults);
      mockClient.readNote.mockImplementation(async (path: string) => {
        return mockNotes[path] || null;
      });

      const memories = await adapter.searchMemories('test query');

      expect(memories).toHaveLength(2);
      expect(memories[0].id).toBe('mem_1');
      expect(memories[1].id).toBe('mem_2');
    });

    it('should respect limit parameter', async () => {
      const searchResults: ObsidianSearchResult[] = Array(30)
        .fill(null)
        .map((_, i) => ({
          path: `Memories/episodic/mem_${i}.md`,
          score: 0.9 - i * 0.01,
          matches: [],
        }));

      mockClient.searchNotes.mockResolvedValueOnce(searchResults);
      mockClient.readNote.mockImplementation(async (path: string) => ({
        path,
        content: '---\nid: test\ntype: episodic\n---\nContent',
        frontmatter: { id: 'test', type: 'episodic' },
        body: 'Content',
      }));

      const memories = await adapter.searchMemories('query', 10);

      expect(memories.length).toBeLessThanOrEqual(10);
    });
  });

  describe('listMemories', () => {
    it('should list all memories sorted by importance', async () => {
      mockClient.listNotes.mockImplementation(async (folder?: string) => {
        if (folder === 'Memories/episodic') {
          return ['Memories/episodic/mem_1.md'];
        }
        if (folder === 'Memories/semantic') {
          return ['Memories/semantic/mem_2.md'];
        }
        return [];
      });

      mockClient.readNote.mockImplementation(async (path: string) => {
        if (path === 'Memories/episodic/mem_1.md') {
          return {
            path,
            content: '---\nid: mem_1\nimportance: 0.6\n---\nContent',
            frontmatter: { id: 'mem_1', importance: 0.6 },
            body: 'Content',
          };
        }
        if (path === 'Memories/semantic/mem_2.md') {
          return {
            path,
            content: '---\nid: mem_2\nimportance: 0.9\n---\nContent',
            frontmatter: { id: 'mem_2', importance: 0.9 },
            body: 'Content',
          };
        }
        return null;
      });

      const memories = await adapter.listMemories();

      expect(memories.length).toBeGreaterThanOrEqual(2);
      // Should be sorted by importance (highest first)
      expect(memories[0].importance).toBeGreaterThanOrEqual(memories[1].importance);
    });

    it('should filter by type when specified', async () => {
      mockClient.listNotes.mockImplementation(async (folder?: string) => {
        if (folder === 'Memories/semantic') {
          return ['Memories/semantic/sem_1.md', 'Memories/semantic/sem_2.md'];
        }
        return [];
      });

      mockClient.readNote.mockResolvedValue({
        path: 'Memories/semantic/sem_1.md',
        content: '---\nid: sem_1\ntype: semantic\n---\nContent',
        frontmatter: { id: 'sem_1', type: 'semantic' },
        body: 'Content',
      });

      const memories = await adapter.listMemories('semantic');

      expect(memories.every((m) => m.type === 'semantic')).toBe(true);
    });
  });

  describe('Round-trip: memory -> markdown -> memory', () => {
    it('should preserve all fields through round-trip conversion', () => {
      const originalMemory: UnifiedMemory = {
        id: 'mem_roundtrip_test',
        type: 'procedural',
        content: 'Step 1: Do this\nStep 2: Do that\nStep 3: Done',
        summary: 'A procedure for testing round-trip conversion',
        importance: 0.75,
        source: {
          surface: 'code',
          backend: 'obsidian',
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

      // Convert to markdown
      const markdown = adapter.memoryToMarkdown(originalMemory);

      // Create a mock note from the markdown
      const { frontmatter, body } = parseFrontmatter(markdown);
      const note: ObsidianNote = {
        path: 'Memories/procedural/mem_roundtrip_test.md',
        content: markdown,
        frontmatter,
        body,
      };

      // Convert back to memory
      const recoveredMemory = adapter.markdownToMemory(note);

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
        content: 'Code example:\n```typescript\nconst x = "test";\n```\n\n- Item 1\n- Item 2',
        importance: 0.5,
        source: { surface: 'code', backend: 'obsidian' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        accessCount: 0,
        tags: [],
        tier: 'warm',
      };

      const markdown = adapter.memoryToMarkdown(memory);
      const { frontmatter, body } = parseFrontmatter(markdown);
      const note: ObsidianNote = {
        path: 'test.md',
        content: markdown,
        frontmatter,
        body,
      };

      const recovered = adapter.markdownToMemory(note);

      expect(recovered.content).toContain('```typescript');
      expect(recovered.content).toContain('const x = "test";');
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
  });
});
