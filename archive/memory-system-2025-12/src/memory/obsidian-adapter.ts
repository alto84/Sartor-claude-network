/**
 * Obsidian Memory Adapter
 *
 * Integrates Obsidian vault with the unified memory system.
 * Converts between UnifiedMemory and Obsidian markdown notes with YAML frontmatter.
 * Storage tier: warm (file-based, indexed for search)
 */

import {
  UnifiedMemory,
  MemoryType,
  MemorySource,
  ClaudeSurface,
  TierType,
  normalizeMemory,
} from './unified-types';

// ============================================================================
// Obsidian Client Types (to be implemented in src/mcp/obsidian-client.ts)
// ============================================================================

/**
 * Configuration for Obsidian Local REST API connection
 */
export interface ObsidianConfig {
  /** API key from the Local REST API plugin */
  apiKey: string;
  /** Base URL for the API (default: http://localhost:27123) */
  baseUrl?: string;
  /** Cloudflare tunnel URL for remote access */
  tunnelUrl?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Represents a note from Obsidian
 */
export interface ObsidianNote {
  /** File path relative to vault root */
  path: string;
  /** Note content including frontmatter */
  content: string;
  /** Parsed frontmatter as object */
  frontmatter?: Record<string, any>;
  /** Note body without frontmatter */
  body?: string;
  /** File stats */
  stat?: {
    ctime: number;
    mtime: number;
    size: number;
  };
}

/**
 * Search result from Obsidian
 */
export interface ObsidianSearchResult {
  path: string;
  score: number;
  matches: Array<{
    match: string;
    context: string;
  }>;
}

/**
 * Obsidian client interface for interacting with Local REST API
 */
export interface ObsidianClient {
  /** Get vault status and info */
  getStatus(): Promise<{ connected: boolean; vaultName?: string }>;

  /** Read a note by path */
  readNote(path: string): Promise<ObsidianNote | null>;

  /** Write a note (creates or updates) */
  writeNote(path: string, content: string): Promise<void>;

  /** Delete a note */
  deleteNote(path: string): Promise<void>;

  /** List notes in a folder */
  listNotes(folder?: string): Promise<string[]>;

  /** Search notes by content */
  searchNotes(query: string): Promise<ObsidianSearchResult[]>;

  /** Append content to a note */
  appendToNote(path: string, content: string): Promise<void>;

  /** Check if a note exists */
  noteExists(path: string): Promise<boolean>;
}

// ============================================================================
// Simple HTTP-based Obsidian Client Implementation
// ============================================================================

/**
 * HTTP client for Obsidian Local REST API
 */
export class HttpObsidianClient implements ObsidianClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: ObsidianConfig) {
    this.baseUrl = config.tunnelUrl || config.baseUrl || 'http://localhost:27123';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 10000;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Obsidian API error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return response.json() as Promise<T>;
      }

      return response.text() as unknown as T;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async getStatus(): Promise<{ connected: boolean; vaultName?: string }> {
    try {
      const result = await this.request<{ authenticated: boolean; vault?: string }>('GET', '/');
      return {
        connected: result.authenticated,
        vaultName: result.vault,
      };
    } catch {
      return { connected: false };
    }
  }

  async readNote(path: string): Promise<ObsidianNote | null> {
    try {
      const encodedPath = encodeURIComponent(path);
      const content = await this.request<string>('GET', `/vault/${encodedPath}`);
      const { frontmatter, body } = this.parseFrontmatter(content);

      return {
        path,
        content,
        frontmatter,
        body,
      };
    } catch {
      return null;
    }
  }

  async writeNote(path: string, content: string): Promise<void> {
    const encodedPath = encodeURIComponent(path);
    await this.request('PUT', `/vault/${encodedPath}`, content);
  }

  async deleteNote(path: string): Promise<void> {
    const encodedPath = encodeURIComponent(path);
    await this.request('DELETE', `/vault/${encodedPath}`);
  }

  async listNotes(folder?: string): Promise<string[]> {
    const path = folder ? `/vault/${encodeURIComponent(folder)}/` : '/vault/';
    try {
      const result = await this.request<{ files: string[] }>('GET', path);
      return result.files.filter((f) => f.endsWith('.md'));
    } catch {
      return [];
    }
  }

  async searchNotes(query: string): Promise<ObsidianSearchResult[]> {
    try {
      const result = await this.request<ObsidianSearchResult[]>(
        'POST',
        '/search/simple/',
        { query }
      );
      return result;
    } catch {
      return [];
    }
  }

  async appendToNote(path: string, content: string): Promise<void> {
    const encodedPath = encodeURIComponent(path);
    await this.request('POST', `/vault/${encodedPath}`, { content });
  }

  async noteExists(path: string): Promise<boolean> {
    try {
      const encodedPath = encodeURIComponent(path);
      await this.request('GET', `/vault/${encodedPath}`);
      return true;
    } catch {
      return false;
    }
  }

  private parseFrontmatter(content: string): { frontmatter?: Record<string, any>; body: string } {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return { body: content };
    }

    try {
      const yamlContent = match[1];
      const body = match[2];

      // Simple YAML parsing for common types
      const frontmatter: Record<string, any> = {};
      const lines = yamlContent.split('\n');
      let currentKey = '';
      let currentArray: string[] | null = null;

      for (const line of lines) {
        // Array item
        if (line.match(/^\s+-\s+/)) {
          if (currentArray) {
            const value = line.replace(/^\s+-\s+/, '').trim();
            currentArray.push(this.parseYamlValue(value));
          }
          continue;
        }

        // Key-value pair
        const kvMatch = line.match(/^(\w+):\s*(.*)$/);
        if (kvMatch) {
          // Save previous array if exists
          if (currentArray && currentKey) {
            frontmatter[currentKey] = currentArray;
          }

          currentKey = kvMatch[1];
          const value = kvMatch[2].trim();

          if (value === '') {
            // Could be start of array or nested object
            currentArray = [];
          } else {
            currentArray = null;
            frontmatter[currentKey] = this.parseYamlValue(value);
          }
        }
      }

      // Save final array if exists
      if (currentArray && currentKey) {
        frontmatter[currentKey] = currentArray;
      }

      return { frontmatter, body };
    } catch {
      return { body: content };
    }
  }

  private parseYamlValue(value: string): any {
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;
    // Number
    const num = Number(value);
    if (!isNaN(num)) return num;
    // String
    return value;
  }
}

// ============================================================================
// Obsidian Memory Adapter Configuration
// ============================================================================

/**
 * Extended configuration for the Obsidian Memory Adapter
 */
export interface ObsidianMemoryConfig extends ObsidianConfig {
  /** Folder for storing memories (default: 'Memories') */
  memoryFolder?: string;
  /** Folder for daily notes (default: 'Daily') */
  dailyNotesFolder?: string;
  /** Default surface for created memories */
  defaultSurface?: ClaudeSurface;
}

// ============================================================================
// Obsidian Memory Adapter Implementation
// ============================================================================

/**
 * Adapter for integrating Obsidian vault with the unified memory system.
 *
 * Features:
 * - Converts between UnifiedMemory and Obsidian markdown notes
 * - Stores memories as markdown files with YAML frontmatter
 * - Supports reading existing notes as memories
 * - Handles memory-to-markdown and markdown-to-memory conversion
 * - Organizes memories into type-based subfolders
 */
/**
 * Resolved configuration with all defaults applied
 */
interface ResolvedObsidianMemoryConfig {
  apiKey: string;
  baseUrl: string;
  tunnelUrl?: string;
  timeout: number;
  memoryFolder: string;
  dailyNotesFolder: string;
  defaultSurface: ClaudeSurface;
}

export class ObsidianMemoryAdapter {
  private client: ObsidianClient;
  private config: ResolvedObsidianMemoryConfig;

  constructor(config: ObsidianMemoryConfig) {
    this.client = new HttpObsidianClient(config);
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'http://localhost:27123',
      tunnelUrl: config.tunnelUrl,
      timeout: config.timeout || 10000,
      memoryFolder: config.memoryFolder || 'Memories',
      dailyNotesFolder: config.dailyNotesFolder || 'Daily',
      defaultSurface: config.defaultSurface || 'code',
    };
  }

  /**
   * Convert a UnifiedMemory object to Obsidian markdown with YAML frontmatter
   */
  memoryToMarkdown(memory: UnifiedMemory): string {
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

    // Source (nested object as flat keys for simplicity)
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
   * Parse an Obsidian note into a UnifiedMemory object
   */
  markdownToMemory(note: ObsidianNote): UnifiedMemory {
    const fm = note.frontmatter || {};
    const body = note.body || note.content;

    // Extract content from body (after ## Content header if present)
    let content = body;
    const contentMatch = body.match(/## Content\n\n([\s\S]*)/);
    if (contentMatch) {
      content = contentMatch[1].trim();
    } else {
      // Remove markdown headers for plain content
      content = body.replace(/^#.*\n/gm, '').trim();
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
      backend: 'obsidian',
      userId: fm.source?.userId,
      sessionId: fm.source?.sessionId,
    };

    // Build memory object
    const memory: UnifiedMemory = {
      id: fm.id || this.generateMemoryId(note.path, fm.type || 'episodic'),
      type: fm.type || 'episodic',
      content,
      summary,
      importance: fm.importance ?? fm.importance_score ?? 0.5,
      source,
      createdAt: fm.createdAt || new Date().toISOString(),
      updatedAt: fm.updatedAt || new Date().toISOString(),
      lastAccessedAt: fm.lastAccessedAt || new Date().toISOString(),
      accessCount: fm.accessCount ?? 0,
      tags: fm.tags || [],
      categories: fm.categories,
      tier: fm.tier || 'warm',
    };

    // Add sync metadata if present
    if (fm.sync) {
      memory.sync = {
        version: fm.sync.version || 1,
        contentHash: fm.sync.contentHash || '',
        lastSyncedAt: fm.sync.lastSyncedAt || memory.updatedAt,
        pendingSync: fm.sync.pendingSync ?? false,
        availableIn: fm.sync.availableIn || ['obsidian'],
      };
    }

    return normalizeMemory(memory);
  }

  /**
   * Create a new memory in the Obsidian vault
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
    const now = new Date().toISOString();
    const id = this.generateMemoryId(null, type);

    const memory: UnifiedMemory = {
      id,
      type,
      content,
      summary: options?.summary,
      importance: options?.importance ?? 0.5,
      source: options?.source || {
        surface: this.config.defaultSurface,
        backend: 'obsidian',
      },
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      accessCount: 1,
      tags: options?.tags || [],
      categories: options?.categories,
      tier: 'warm', // Obsidian storage is always warm tier
    };

    // Ensure source.backend is obsidian
    memory.source.backend = 'obsidian';

    // Generate markdown and write to vault
    const markdown = this.memoryToMarkdown(memory);
    const filepath = this.getMemoryFilepath(id, type);

    await this.client.writeNote(filepath, markdown);

    return memory;
  }

  /**
   * Get a memory by ID (filepath without extension)
   */
  async getMemory(id: string): Promise<UnifiedMemory | null> {
    // Try to find the memory in type-based subfolders
    const types: MemoryType[] = ['episodic', 'semantic', 'procedural', 'working'];

    for (const type of types) {
      const filepath = `${this.config.memoryFolder}/${type}/${id}.md`;
      const note = await this.client.readNote(filepath);

      if (note) {
        const memory = this.markdownToMemory(note);
        // Update access metadata
        memory.lastAccessedAt = new Date().toISOString();
        memory.accessCount += 1;
        // Optionally update the file (commented out to avoid write on every read)
        // await this.updateMemory(id, { lastAccessedAt: memory.lastAccessedAt, accessCount: memory.accessCount });
        return memory;
      }
    }

    // Try root memories folder
    const rootPath = `${this.config.memoryFolder}/${id}.md`;
    const rootNote = await this.client.readNote(rootPath);
    if (rootNote) {
      return this.markdownToMemory(rootNote);
    }

    return null;
  }

  /**
   * Search memories in the vault
   */
  async searchMemories(query: string, limit: number = 20): Promise<UnifiedMemory[]> {
    const searchResults = await this.client.searchNotes(query);
    const memories: UnifiedMemory[] = [];

    for (const result of searchResults.slice(0, limit)) {
      // Only include files from the memories folder
      if (!result.path.startsWith(this.config.memoryFolder)) {
        continue;
      }

      const note = await this.client.readNote(result.path);
      if (note) {
        memories.push(this.markdownToMemory(note));
      }
    }

    return memories;
  }

  /**
   * List all memories, optionally filtered by type
   */
  async listMemories(type?: MemoryType): Promise<UnifiedMemory[]> {
    const memories: UnifiedMemory[] = [];
    const typesToList: MemoryType[] = type
      ? [type]
      : ['episodic', 'semantic', 'procedural', 'working'];

    for (const memType of typesToList) {
      const folder = `${this.config.memoryFolder}/${memType}`;
      const files = await this.client.listNotes(folder);

      for (const file of files) {
        const note = await this.client.readNote(file);
        if (note) {
          memories.push(this.markdownToMemory(note));
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
    const existing = await this.getMemory(id);
    if (!existing) {
      throw new Error(`Memory not found: ${id}`);
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
        backend: 'obsidian', // Always obsidian for this adapter
      },
    };

    // Write back to vault
    const markdown = this.memoryToMarkdown(updated);
    const filepath = this.getMemoryFilepath(updated.id, updated.type);
    await this.client.writeNote(filepath, markdown);

    return updated;
  }

  /**
   * Delete a memory from the vault
   */
  async deleteMemory(id: string): Promise<void> {
    const memory = await this.getMemory(id);
    if (!memory) {
      throw new Error(`Memory not found: ${id}`);
    }

    const filepath = this.getMemoryFilepath(id, memory.type);
    await this.client.deleteNote(filepath);
  }

  /**
   * Sync a regular note to the memory system
   * Converts an existing Obsidian note into a unified memory
   */
  async syncNoteToMemory(filepath: string): Promise<UnifiedMemory> {
    const note = await this.client.readNote(filepath);
    if (!note) {
      throw new Error(`Note not found: ${filepath}`);
    }

    // Parse as memory (will use defaults for missing fields)
    let memory = this.markdownToMemory(note);

    // Generate proper memory ID if not present
    if (!memory.id || !memory.id.startsWith('mem_')) {
      memory.id = this.generateMemoryId(filepath, memory.type);
    }

    // Ensure it's marked as obsidian-sourced
    memory.source.backend = 'obsidian';
    memory.tier = 'warm';

    // Write the converted memory to the memories folder
    const newFilepath = this.getMemoryFilepath(memory.id, memory.type);
    const markdown = this.memoryToMarkdown(memory);
    await this.client.writeNote(newFilepath, markdown);

    return memory;
  }

  /**
   * Get the daily note as a working memory
   */
  async getDailyMemory(): Promise<UnifiedMemory> {
    const today = this.getDateString();
    const filepath = `${this.config.dailyNotesFolder}/${today}.md`;

    let note = await this.client.readNote(filepath);

    if (!note) {
      // Create daily note if it doesn't exist
      const content = this.createDailyNoteTemplate(today);
      await this.client.writeNote(filepath, content);
      note = await this.client.readNote(filepath);
    }

    if (!note) {
      throw new Error('Failed to create or read daily note');
    }

    // Convert to working memory
    const memory = this.markdownToMemory(note);
    memory.type = 'working';
    memory.id = `mem_working_daily_${today.replace(/-/g, '')}`;
    memory.tier = 'warm';

    return memory;
  }

  /**
   * Append content to the daily note
   */
  async appendToDailyMemory(content: string): Promise<void> {
    const today = this.getDateString();
    const filepath = `${this.config.dailyNotesFolder}/${today}.md`;

    // Ensure daily note exists
    const exists = await this.client.noteExists(filepath);
    if (!exists) {
      const template = this.createDailyNoteTemplate(today);
      await this.client.writeNote(filepath, template);
    }

    // Append with timestamp
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const entry = `\n- **${timestamp}**: ${content}`;
    await this.client.appendToNote(filepath, entry);
  }

  /**
   * Get backend status
   */
  async getStatus(): Promise<{
    connected: boolean;
    vaultName?: string;
    memoryCount?: number;
  }> {
    const status = await this.client.getStatus();

    if (!status.connected) {
      return { connected: false };
    }

    // Count memories
    let memoryCount = 0;
    const types: MemoryType[] = ['episodic', 'semantic', 'procedural', 'working'];

    for (const type of types) {
      const folder = `${this.config.memoryFolder}/${type}`;
      const files = await this.client.listNotes(folder);
      memoryCount += files.length;
    }

    return {
      connected: true,
      vaultName: status.vaultName,
      memoryCount,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Generate a unique memory ID
   */
  private generateMemoryId(filepath: string | null, type: MemoryType): string {
    const timestamp = Date.now();

    if (filepath) {
      // Use filename as part of ID
      const basename = filepath.split('/').pop()?.replace('.md', '') || '';
      const sanitized = basename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      return `mem_${type}_${sanitized}_${timestamp}`;
    }

    return `mem_${type}_${timestamp}`;
  }

  /**
   * Get the filepath for a memory based on its ID and type
   */
  private getMemoryFilepath(id: string, type: MemoryType): string {
    return `${this.config.memoryFolder}/${type}/${id}.md`;
  }

  /**
   * Get today's date as YYYY-MM-DD string
   */
  private getDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Create template for a new daily note
   */
  private createDailyNoteTemplate(date: string): string {
    return `---
date: ${date}
type: working
tags:
  - daily
  - working-memory
---

# Daily Note: ${date}

## Morning Intentions

## Log

## Evening Reflection

## Key Memories

`;
  }

  /**
   * Set a custom client (useful for testing)
   */
  setClient(client: ObsidianClient): void {
    this.client = client;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create an Obsidian Memory Adapter instance
 */
export function createObsidianMemoryAdapter(
  config: ObsidianMemoryConfig
): ObsidianMemoryAdapter {
  return new ObsidianMemoryAdapter(config);
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
// Type Exports
// ============================================================================

export type {
  UnifiedMemory,
  MemoryType,
  MemorySource,
  TierType,
} from './unified-types';
