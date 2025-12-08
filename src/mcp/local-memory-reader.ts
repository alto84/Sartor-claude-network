/**
 * Direct file-based memory reader
 * No server required - reads directly from data/memories.json
 *
 * Used by bootstrap mesh as fallback when MCP server is not available.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Simplified memory structure as stored in JSON file
 */
interface StoredMemory {
  id: string;
  content: string;
  type: string;
  importance_score?: number;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  last_accessed?: string;
  access_count?: number;
  strength?: number;
  status?: string;
  embedding?: number[];
  links?: string[];
  [key: string]: any;
}

/**
 * Structure of the memories.json file
 */
interface MemoriesFile {
  memories: Record<string, StoredMemory>;
  idCounter?: number;
}

/**
 * Memory type compatible with the system's Memory interface
 */
export interface Memory extends StoredMemory {
  id: string;
  content: string;
  type: string;
  importance_score: number;
  tags: string[];
}

/**
 * Search options for filtering memories
 */
export interface SearchOptions {
  type?: string;
  minImportance?: number;
  tags?: string[];
  limit?: number;
}

/**
 * Statistics about the memory store
 */
export interface MemoryStats {
  total: number;
  byType: Record<string, number>;
}

/**
 * Direct file-based memory reader
 * Reads memories from local JSON file without requiring MCP server
 */
export class LocalMemoryReader {
  private dataPath: string;

  /**
   * Create a new LocalMemoryReader
   * @param dataPath - Path to memories.json file (default: 'data/memories.json')
   */
  constructor(dataPath?: string) {
    this.dataPath = dataPath || path.join(process.cwd(), 'data', 'memories.json');
  }

  /**
   * Check if the local memory file exists
   * @returns true if file exists and is readable
   */
  exists(): boolean {
    try {
      return fs.existsSync(this.dataPath);
    } catch (error) {
      this.logError('Error checking file existence', error);
      return false;
    }
  }

  /**
   * Load all memories from the file
   * @returns Array of all memories, or empty array if file is missing/corrupted
   */
  loadAll(): Memory[] {
    try {
      if (!this.exists()) {
        return [];
      }

      const fileContent = fs.readFileSync(this.dataPath, 'utf-8');
      const data: MemoriesFile = JSON.parse(fileContent);

      if (!data.memories || typeof data.memories !== 'object') {
        this.logError('Invalid memories file structure', new Error('Missing or invalid memories object'));
        return [];
      }

      // Convert stored memories to Memory objects
      return Object.values(data.memories).map(mem => this.normalizeMemory(mem));
    } catch (error) {
      this.logError('Error loading memories', error);
      return [];
    }
  }

  /**
   * Search memories with filters
   * @param options - Search filters
   * @returns Filtered and sorted memories
   */
  search(options: SearchOptions = {}): Memory[] {
    let memories = this.loadAll();

    // Filter by type
    if (options.type) {
      memories = memories.filter(m => m.type === options.type);
    }

    // Filter by minimum importance
    if (options.minImportance !== undefined) {
      memories = memories.filter(m => m.importance_score >= options.minImportance!);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      memories = memories.filter(m =>
        options.tags!.some(tag => m.tags.includes(tag))
      );
    }

    // Sort by importance descending
    memories.sort((a, b) => b.importance_score - a.importance_score);

    // Apply limit
    if (options.limit && options.limit > 0) {
      memories = memories.slice(0, options.limit);
    }

    return memories;
  }

  /**
   * Get a memory by ID
   * @param id - Memory ID
   * @returns Memory object or null if not found
   */
  get(id: string): Memory | null {
    try {
      if (!this.exists()) {
        return null;
      }

      const fileContent = fs.readFileSync(this.dataPath, 'utf-8');
      const data: MemoriesFile = JSON.parse(fileContent);

      if (!data.memories || !data.memories[id]) {
        return null;
      }

      return this.normalizeMemory(data.memories[id]);
    } catch (error) {
      this.logError(`Error getting memory ${id}`, error);
      return null;
    }
  }

  /**
   * Get statistics about the memory store
   * @returns Statistics object with total count and breakdown by type
   */
  getStats(): MemoryStats {
    const memories = this.loadAll();
    const byType: Record<string, number> = {};

    memories.forEach(mem => {
      byType[mem.type] = (byType[mem.type] || 0) + 1;
    });

    return {
      total: memories.length,
      byType
    };
  }

  /**
   * Normalize a stored memory to ensure all required fields are present
   * @param stored - Stored memory object
   * @returns Normalized memory
   */
  private normalizeMemory(stored: StoredMemory): Memory {
    return {
      ...stored,
      importance_score: stored.importance_score ?? 0.5,
      tags: stored.tags ?? [],
    };
  }

  /**
   * Log error to stderr
   * @param message - Error message
   * @param error - Error object
   */
  private logError(message: string, error: unknown): void {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[LocalMemoryReader] ${message}: ${errorMsg}`);
  }
}

/**
 * Convenience function for quick memory access
 * @param options - Search options
 * @returns Array of matching memories
 */
export function quickLoadMemories(options?: SearchOptions): Memory[] {
  const reader = new LocalMemoryReader();
  return reader.search(options || {});
}
