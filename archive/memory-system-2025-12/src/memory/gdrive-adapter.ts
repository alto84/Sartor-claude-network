/**
 * Google Drive Memory Adapter
 *
 * Integrates Google Drive with the unified memory system.
 * Converts between UnifiedMemory and Google Drive documents.
 * Storage tier: warm (cloud-based, searchable)
 */

import {
  UnifiedMemory,
  MemoryType,
  MemorySource,
  ClaudeSurface,
  TierType,
  normalizeMemory,
} from './unified-types';
import {
  GDriveClient,
  GDriveConfig,
  GDriveFile,
  GDriveApiError,
  MIME_TYPES,
  createGDriveClient,
} from '../mcp/gdrive-client';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface GDriveMemoryConfig extends GDriveConfig {
  /** ID of the root folder for memories (if already exists) */
  memoryFolderId?: string;
  /** Name of the root folder for memories (default: 'Claude-Memories') */
  memoryFolderName?: string;
  /** Default surface for created memories */
  defaultSurface?: ClaudeSurface;
}

/**
 * Resolved configuration with all defaults applied
 */
interface ResolvedGDriveMemoryConfig {
  credentialsPath: string;
  tokenPath: string;
  scopes: string[];
  memoryFolderId?: string;
  memoryFolderName: string;
  defaultSurface: ClaudeSurface;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate a simple content hash for sync tracking
 */
export function calculateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Parse YAML-like frontmatter from markdown content
 */
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter: Record<string, any> = {};
  const yamlContent = match[1];
  const body = match[2];

  // Simple line-by-line YAML parsing
  const lines = yamlContent.split('\n');
  let currentKey = '';
  let currentIndent = 0;
  let currentArray: any[] | null = null;
  let currentObject: Record<string, any> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const indent = line.search(/\S/);

    // Array item
    if (trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();
      if (currentArray !== null) {
        currentArray.push(parseValue(value));
      }
      continue;
    }

    // Key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      // Save previous array/object
      if (currentArray !== null && currentKey) {
        if (currentObject && currentIndent > 0) {
          currentObject[currentKey] = currentArray;
        } else {
          frontmatter[currentKey] = currentArray;
        }
        currentArray = null;
      }

      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();

      if (indent === 0) {
        currentIndent = 0;
        currentObject = null;

        if (value === '') {
          // Start of nested object or array
          currentKey = key;
          currentArray = [];
        } else {
          currentKey = '';
          frontmatter[key] = parseValue(value);
        }
      } else if (indent > currentIndent) {
        // Nested property
        if (!currentObject) {
          currentObject = {};
          frontmatter[currentKey] = currentObject;
        }

        if (value === '') {
          currentArray = [];
          currentKey = key;
        } else {
          currentObject[key] = parseValue(value);
        }
      }
    }
  }

  // Save final array if exists
  if (currentArray !== null && currentKey) {
    if (currentObject) {
      currentObject[currentKey] = currentArray;
    } else {
      frontmatter[currentKey] = currentArray;
    }
  }

  return { frontmatter, body };
}

function parseValue(value: string): any {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  // Null
  if (value === 'null' || value === '~') return null;
  // Number
  const num = Number(value);
  if (!isNaN(num) && value !== '') return num;
  // String
  return value;
}

// ============================================================================
// Google Drive Memory Adapter Implementation
// ============================================================================

/**
 * Adapter for integrating Google Drive with the unified memory system.
 *
 * Features:
 * - Converts between UnifiedMemory and Google Drive documents
 * - Stores memories as text files with YAML frontmatter + markdown content
 * - Supports reading existing documents as memories
 * - Handles memory-to-document and document-to-memory conversion
 * - Organizes memories into type-based subfolders
 */
export class GDriveMemoryAdapter {
  private client: GDriveClient;
  private config: ResolvedGDriveMemoryConfig;
  private memoryFolderId: string | null = null;
  private typeFolderIds: Map<MemoryType, string> = new Map();
  private initialized: boolean = false;

  constructor(config: GDriveMemoryConfig) {
    this.client = createGDriveClient(config);
    this.config = {
      credentialsPath: config.credentialsPath || 'credentials.json',
      tokenPath: config.tokenPath || 'token.json',
      scopes: config.scopes || [],
      memoryFolderId: config.memoryFolderId,
      memoryFolderName: config.memoryFolderName || 'Claude-Memories',
      defaultSurface: config.defaultSurface || 'code',
    };
  }

  /**
   * Initialize the adapter - authorize and set up folder structure
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Authorize the client
    const authorized = await this.client.authorize();
    if (!authorized) {
      throw new GDriveApiError('Failed to authorize Google Drive client', 401);
    }

    // Get or create the memory folder
    if (this.config.memoryFolderId) {
      this.memoryFolderId = this.config.memoryFolderId;
    } else {
      const folder = await this.client.getOrCreateFolder(this.config.memoryFolderName);
      this.memoryFolderId = folder.id;
    }

    // Pre-create type subfolders
    const types: MemoryType[] = ['episodic', 'semantic', 'procedural', 'working'];
    for (const type of types) {
      const typeFolder = await this.client.getOrCreateFolder(
        `${this.config.memoryFolderName}/${type}`
      );
      this.typeFolderIds.set(type, typeFolder.id);
    }

    this.initialized = true;
    console.error(`[GDrive Adapter] Initialized with folder: ${this.memoryFolderId}`);
  }

  /**
   * Ensure adapter is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // ==========================================================================
  // Conversion Methods
  // ==========================================================================

  /**
   * Convert a UnifiedMemory object to Google Drive document content
   * Uses markdown with YAML frontmatter (same format as Obsidian)
   */
  memoryToDocContent(memory: UnifiedMemory): string {
    const frontmatter = this.buildFrontmatter(memory);
    const body = this.buildBody(memory);

    return `---\n${frontmatter}---\n\n${body}`;
  }

  /**
   * Build YAML frontmatter from memory
   */
  private buildFrontmatter(memory: UnifiedMemory): string {
    const lines: string[] = [];

    lines.push(`id: ${memory.id}`);
    lines.push(`type: ${memory.type}`);
    lines.push(`importance: ${memory.importance}`);

    // Tags
    if (memory.tags && memory.tags.length > 0) {
      lines.push('tags:');
      for (const tag of memory.tags) {
        lines.push(`  - ${tag}`);
      }
    }

    // Categories
    if (memory.categories && memory.categories.length > 0) {
      lines.push('categories:');
      for (const category of memory.categories) {
        lines.push(`  - ${category}`);
      }
    }

    // Source (nested object)
    lines.push('source:');
    lines.push(`  surface: ${memory.source.surface}`);
    lines.push(`  backend: ${memory.source.backend}`);
    if (memory.source.userId) {
      lines.push(`  userId: ${memory.source.userId}`);
    }
    if (memory.source.sessionId) {
      lines.push(`  sessionId: ${memory.source.sessionId}`);
    }

    // Timestamps
    lines.push(`createdAt: ${memory.createdAt}`);
    lines.push(`updatedAt: ${memory.updatedAt}`);
    lines.push(`lastAccessedAt: ${memory.lastAccessedAt}`);
    lines.push(`accessCount: ${memory.accessCount}`);

    // Tier
    lines.push(`tier: ${memory.tier}`);

    // Sync metadata if present
    if (memory.sync) {
      lines.push('sync:');
      lines.push(`  version: ${memory.sync.version}`);
      lines.push(`  contentHash: ${memory.sync.contentHash}`);
      lines.push(`  lastSyncedAt: ${memory.sync.lastSyncedAt}`);
      lines.push(`  pendingSync: ${memory.sync.pendingSync}`);
      if (memory.sync.availableIn && memory.sync.availableIn.length > 0) {
        lines.push('  availableIn:');
        for (const backend of memory.sync.availableIn) {
          lines.push(`    - ${backend}`);
        }
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Build markdown body from memory content
   */
  private buildBody(memory: UnifiedMemory): string {
    const lines: string[] = [];

    // Title based on first line of content or type
    const firstLine = memory.content.split('\n')[0].trim();
    const title = firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
    lines.push(`# ${title || `${memory.type} Memory`}`);
    lines.push('');

    // Summary if available
    if (memory.summary) {
      lines.push('## Summary');
      lines.push('');
      lines.push(memory.summary);
      lines.push('');
    }

    // Main content
    lines.push('## Content');
    lines.push('');
    lines.push(memory.content);

    return lines.join('\n');
  }

  /**
   * Parse a Google Drive file into a UnifiedMemory object
   */
  docToMemory(file: GDriveFile, content: string): UnifiedMemory {
    const { frontmatter: fm, body } = parseFrontmatter(content);

    // Extract content from body (after ## Content header if present)
    let extractedContent = body;
    const contentMatch = body.match(/## Content\n\n([\s\S]*)/);
    if (contentMatch) {
      extractedContent = contentMatch[1].trim();
    } else {
      // Remove markdown headers for plain content
      extractedContent = body.replace(/^#.*\n/gm, '').trim();
    }

    // Extract summary if present
    let summary: string | undefined;
    const summaryMatch = body.match(/## Summary\n\n([\s\S]*?)(?=\n## |$)/);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }

    // Parse source
    const source: MemorySource = {
      surface: (fm.source?.surface || this.config.defaultSurface) as ClaudeSurface,
      backend: 'gdrive',
      userId: fm.source?.userId,
      sessionId: fm.source?.sessionId,
    };

    // Build memory object
    const memory: UnifiedMemory = {
      id: fm.id || this.extractMemoryIdFromFilename(file.name, fm.type || 'episodic'),
      type: fm.type || 'episodic',
      content: extractedContent,
      summary,
      importance: fm.importance ?? fm.importance_score ?? 0.5,
      source,
      createdAt: fm.createdAt || file.createdTime || new Date().toISOString(),
      updatedAt: fm.updatedAt || file.modifiedTime || new Date().toISOString(),
      lastAccessedAt: fm.lastAccessedAt || new Date().toISOString(),
      accessCount: fm.accessCount ?? 0,
      tags: fm.tags || [],
      categories: fm.categories,
      tier: 'warm', // GDrive is warm tier
    };

    // Add sync metadata if present
    if (fm.sync) {
      memory.sync = {
        version: fm.sync.version || 1,
        contentHash: fm.sync.contentHash || '',
        lastSyncedAt: fm.sync.lastSyncedAt || memory.updatedAt,
        pendingSync: fm.sync.pendingSync ?? false,
        availableIn: fm.sync.availableIn || ['gdrive'],
      };
    }

    return normalizeMemory(memory);
  }

  /**
   * Extract memory ID from filename
   */
  private extractMemoryIdFromFilename(filename: string, type: MemoryType): string {
    // Expected format: mem_{type}_{id}.txt or mem_{type}_{id}.md
    const match = filename.match(/^(mem_\w+_\d+)/);
    if (match) {
      return match[1];
    }
    // Generate new ID if not found
    return this.generateMemoryId(type);
  }

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  /**
   * Create a new memory in Google Drive
   */
  async createMemory(
    content: string,
    type: MemoryType,
    options?: {
      importance?: number;
      tags?: string[];
      source?: MemorySource;
      summary?: string;
      categories?: string[];
    }
  ): Promise<UnifiedMemory> {
    await this.ensureInitialized();

    const now = new Date().toISOString();
    const id = this.generateMemoryId(type);

    const memory: UnifiedMemory = {
      id,
      type,
      content,
      summary: options?.summary,
      importance: options?.importance ?? 0.5,
      source: options?.source || {
        surface: this.config.defaultSurface,
        backend: 'gdrive',
      },
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      accessCount: 1,
      tags: options?.tags || [],
      categories: options?.categories,
      tier: 'warm', // Google Drive storage is warm tier
    };

    // Ensure source.backend is gdrive
    memory.source.backend = 'gdrive';

    // Generate document content
    const docContent = this.memoryToDocContent(memory);
    const filename = `${id}.txt`;

    // Get the type folder ID
    const folderId = this.typeFolderIds.get(type);
    if (!folderId) {
      throw new GDriveApiError(`Folder for type ${type} not initialized`, 500);
    }

    // Create the file
    await this.client.createFile(filename, docContent, MIME_TYPES.TEXT, folderId);

    return memory;
  }

  /**
   * Get a memory by ID
   */
  async getMemory(id: string): Promise<UnifiedMemory | null> {
    await this.ensureInitialized();

    // Try to find the memory in type-based subfolders
    const types: MemoryType[] = ['episodic', 'semantic', 'procedural', 'working'];

    for (const type of types) {
      const folderId = this.typeFolderIds.get(type);
      if (!folderId) continue;

      // Search for the file
      const searchResult = await this.client.searchFiles(
        `name contains '${id}' and '${folderId}' in parents`,
        1
      );

      if (searchResult.files.length > 0) {
        const file = searchResult.files[0];
        const content = await this.client.readFileContent(file.id);
        const memory = this.docToMemory(file, content);

        // Update access metadata
        memory.lastAccessedAt = new Date().toISOString();
        memory.accessCount += 1;

        return memory;
      }
    }

    return null;
  }

  /**
   * Search memories by query
   */
  async searchMemories(query: string, limit: number = 20): Promise<UnifiedMemory[]> {
    await this.ensureInitialized();

    if (!this.memoryFolderId) {
      return [];
    }

    // Search files containing the query text
    const searchResult = await this.client.searchFiles(
      `fullText contains '${query.replace(/'/g, "\\'")}' and '${this.memoryFolderId}' in parents`,
      limit
    );

    const memories: UnifiedMemory[] = [];

    for (const file of searchResult.files.slice(0, limit)) {
      try {
        const content = await this.client.readFileContent(file.id);
        const memory = this.docToMemory(file, content);
        memories.push(memory);
      } catch (error) {
        console.error(`[GDrive Adapter] Error reading file ${file.id}:`, error);
      }
    }

    return memories;
  }

  /**
   * List all memories, optionally filtered by type
   */
  async listMemories(type?: MemoryType): Promise<UnifiedMemory[]> {
    await this.ensureInitialized();

    const memories: UnifiedMemory[] = [];
    const typesToList: MemoryType[] = type
      ? [type]
      : ['episodic', 'semantic', 'procedural', 'working'];

    for (const memType of typesToList) {
      const folderId = this.typeFolderIds.get(memType);
      if (!folderId) continue;

      const listResult = await this.client.listFiles(folderId, 100);

      for (const file of listResult.files) {
        if (file.mimeType === MIME_TYPES.FOLDER) continue;

        try {
          const content = await this.client.readFileContent(file.id);
          const memory = this.docToMemory(file, content);
          memories.push(memory);
        } catch (error) {
          console.error(`[GDrive Adapter] Error reading file ${file.id}:`, error);
        }
      }
    }

    // Sort by importance (highest first)
    return memories.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Update an existing memory
   */
  async updateMemory(id: string, updates: Partial<UnifiedMemory>): Promise<UnifiedMemory> {
    await this.ensureInitialized();

    // Find the existing memory
    const existing = await this.getMemory(id);
    if (!existing) {
      throw new GDriveApiError(`Memory not found: ${id}`, 404);
    }

    // Merge updates
    const updated: UnifiedMemory = {
      ...existing,
      ...updates,
      id: existing.id, // ID cannot be changed
      updatedAt: new Date().toISOString(),
      source: {
        ...existing.source,
        ...(updates.source || {}),
        backend: 'gdrive', // Always gdrive for this adapter
      },
    };

    // Find and update the file
    const types: MemoryType[] = ['episodic', 'semantic', 'procedural', 'working'];

    for (const type of types) {
      const folderId = this.typeFolderIds.get(type);
      if (!folderId) continue;

      const searchResult = await this.client.searchFiles(
        `name contains '${id}' and '${folderId}' in parents`,
        1
      );

      if (searchResult.files.length > 0) {
        const file = searchResult.files[0];
        const docContent = this.memoryToDocContent(updated);
        await this.client.updateFile(file.id, docContent);
        return updated;
      }
    }

    throw new GDriveApiError(`Memory file not found: ${id}`, 404);
  }

  /**
   * Delete a memory
   */
  async deleteMemory(id: string): Promise<void> {
    await this.ensureInitialized();

    // Find the memory file
    const types: MemoryType[] = ['episodic', 'semantic', 'procedural', 'working'];

    for (const type of types) {
      const folderId = this.typeFolderIds.get(type);
      if (!folderId) continue;

      const searchResult = await this.client.searchFiles(
        `name contains '${id}' and '${folderId}' in parents`,
        1
      );

      if (searchResult.files.length > 0) {
        await this.client.deleteFile(searchResult.files[0].id);
        return;
      }
    }

    throw new GDriveApiError(`Memory not found: ${id}`, 404);
  }

  // ==========================================================================
  // Sync Operations
  // ==========================================================================

  /**
   * Sync memories from Obsidian to Google Drive
   */
  async syncFromObsidian(obsidianAdapter: any): Promise<number> {
    await this.ensureInitialized();

    let syncCount = 0;

    // Get all memories from Obsidian
    const obsidianMemories: UnifiedMemory[] = await obsidianAdapter.listMemories();

    for (const memory of obsidianMemories) {
      try {
        // Check if memory already exists in GDrive
        const existing = await this.getMemory(memory.id);

        if (existing) {
          // Check if Obsidian version is newer
          if (new Date(memory.updatedAt) > new Date(existing.updatedAt)) {
            await this.updateMemory(memory.id, memory);
            syncCount++;
          }
        } else {
          // Create new memory in GDrive
          const newMemory = await this.createMemory(
            memory.content,
            memory.type,
            {
              importance: memory.importance,
              tags: [...memory.tags, 'synced-from-obsidian'],
              source: { ...memory.source, backend: 'gdrive' },
              summary: memory.summary,
              categories: memory.categories,
            }
          );
          syncCount++;
        }
      } catch (error) {
        console.error(`[GDrive Adapter] Error syncing memory ${memory.id}:`, error);
      }
    }

    return syncCount;
  }

  /**
   * Export memories to Obsidian
   */
  async exportToObsidian(obsidianAdapter: any, memoryIds: string[]): Promise<number> {
    await this.ensureInitialized();

    let exportCount = 0;

    for (const id of memoryIds) {
      try {
        const memory = await this.getMemory(id);
        if (!memory) continue;

        // Create or update in Obsidian
        const existingInObsidian = await obsidianAdapter.getMemory(id);

        if (existingInObsidian) {
          await obsidianAdapter.updateMemory(id, {
            ...memory,
            source: { ...memory.source, backend: 'obsidian' },
            tags: [...memory.tags, 'synced-from-gdrive'],
          });
        } else {
          await obsidianAdapter.createMemory(
            memory.content,
            memory.type,
            {
              importance: memory.importance,
              tags: [...memory.tags, 'synced-from-gdrive'],
              source: { ...memory.source, backend: 'obsidian' },
              summary: memory.summary,
              categories: memory.categories,
            }
          );
        }

        exportCount++;
      } catch (error) {
        console.error(`[GDrive Adapter] Error exporting memory ${id}:`, error);
      }
    }

    return exportCount;
  }

  // ==========================================================================
  // Status and Utility Methods
  // ==========================================================================

  /**
   * Get adapter status
   */
  async getStatus(): Promise<{
    connected: boolean;
    folderId?: string;
    memoryCount?: number;
  }> {
    try {
      await this.ensureInitialized();

      const isConnected = await this.client.testConnection();
      if (!isConnected) {
        return { connected: false };
      }

      // Count memories
      let memoryCount = 0;
      const types: MemoryType[] = ['episodic', 'semantic', 'procedural', 'working'];

      for (const type of types) {
        const folderId = this.typeFolderIds.get(type);
        if (!folderId) continue;

        const listResult = await this.client.listFiles(folderId, 100);
        memoryCount += listResult.files.filter((f) => f.mimeType !== MIME_TYPES.FOLDER).length;
      }

      return {
        connected: true,
        folderId: this.memoryFolderId || undefined,
        memoryCount,
      };
    } catch (error) {
      console.error('[GDrive Adapter] Status check failed:', error);
      return { connected: false };
    }
  }

  /**
   * Generate a unique memory ID
   */
  private generateMemoryId(type: MemoryType): string {
    const timestamp = Date.now();
    return `mem_${type}_${timestamp}`;
  }

  /**
   * Set a custom client (useful for testing)
   */
  setClient(client: GDriveClient): void {
    this.client = client;
    this.initialized = false; // Force re-initialization
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a Google Drive Memory Adapter instance
 */
export function createGDriveMemoryAdapter(
  config: GDriveMemoryConfig
): GDriveMemoryAdapter {
  return new GDriveMemoryAdapter(config);
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  UnifiedMemory,
  MemoryType,
  MemorySource,
  TierType,
} from './unified-types';
