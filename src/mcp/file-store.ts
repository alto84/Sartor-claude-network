/**
 * File-based Memory Store
 *
 * A simple file-based persistence layer for the MCP memory system.
 * Stores memories as JSON in data/memories.json and auto-creates the directory if needed.
 * Uses synchronous file operations for simplicity.
 */

import * as fs from 'fs';
import * as path from 'path';

enum MemoryType {
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  PROCEDURAL = 'procedural',
  WORKING = 'working',
  REFINEMENT_TRACE = 'refinement_trace',
  EXPERT_CONSENSUS = 'expert_consensus',
}

interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  importance_score: number;
  tags: string[];
  created_at: string;
}

interface FileData {
  memories: Record<string, Memory>;
  idCounter: number;
}

export class FileStore {
  private dataDir: string;
  private dataFile: string;
  private memories: Map<string, Memory> = new Map();
  private idCounter = 0;

  constructor(dataDir: string = 'data') {
    // Resolve to absolute path from project root
    this.dataDir = path.resolve(process.cwd(), dataDir);
    this.dataFile = path.join(this.dataDir, 'memories.json');

    // Initialize: create directory and load existing data
    this.initialize();
  }

  /**
   * Initialize the file store: create directory if needed and load data
   */
  private initialize(): void {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Load existing data if file exists
    if (fs.existsSync(this.dataFile)) {
      this.loadFromFile();
    } else {
      // Create empty file
      this.saveToFile();
    }
  }

  /**
   * Load memories from file
   */
  private loadFromFile(): void {
    try {
      const data = fs.readFileSync(this.dataFile, 'utf-8');
      const parsed: FileData = JSON.parse(data);

      // Restore memories map
      this.memories.clear();
      Object.entries(parsed.memories || {}).forEach(([id, memory]) => {
        this.memories.set(id, memory);
      });

      // Restore counter
      this.idCounter = parsed.idCounter || 0;
    } catch (error) {
      console.error('Error loading memories from file:', error);
      // If file is corrupted, start fresh
      this.memories.clear();
      this.idCounter = 0;
    }
  }

  /**
   * Save memories to file
   */
  private saveToFile(): void {
    try {
      // Convert Map to plain object for JSON serialization
      const memoriesObj: Record<string, Memory> = {};
      this.memories.forEach((memory, id) => {
        memoriesObj[id] = memory;
      });

      const data: FileData = {
        memories: memoriesObj,
        idCounter: this.idCounter,
      };

      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving memories to file:', error);
      throw error;
    }
  }

  /**
   * Create a new memory
   */
  createMemory(
    content: string,
    type: MemoryType,
    options: { importance_score?: number; tags?: string[] }
  ): Memory {
    const id = `mem_${Date.now()}_${this.idCounter++}`;
    const memory: Memory = {
      id,
      content,
      type,
      importance_score: options.importance_score ?? 0.5,
      tags: options.tags ?? [],
      created_at: new Date().toISOString(),
    };

    this.memories.set(id, memory);
    this.saveToFile();

    return memory;
  }

  /**
   * Get a memory by ID
   */
  getMemory(id: string): Memory | undefined {
    return this.memories.get(id);
  }

  /**
   * Search memories by filters
   */
  searchMemories(
    filters: { type?: MemoryType[]; min_importance?: number },
    limit: number
  ): Memory[] {
    const results: Memory[] = [];

    // Manual iteration to avoid downlevelIteration issues
    this.memories.forEach((mem) => {
      if (filters.type && !filters.type.includes(mem.type)) return;
      if (filters.min_importance !== undefined && mem.importance_score < filters.min_importance)
        return;
      results.push(mem);
    });

    return results.slice(0, limit);
  }

  /**
   * Get memory system statistics
   */
  getStats() {
    return {
      total: this.memories.size,
      by_type: {
        episodic: this.countByType(MemoryType.EPISODIC),
        semantic: this.countByType(MemoryType.SEMANTIC),
        procedural: this.countByType(MemoryType.PROCEDURAL),
        working: this.countByType(MemoryType.WORKING),
        refinement_trace: this.countByType(MemoryType.REFINEMENT_TRACE),
        expert_consensus: this.countByType(MemoryType.EXPERT_CONSENSUS),
      },
    };
  }

  /**
   * Count memories by type
   */
  private countByType(type: MemoryType): number {
    let count = 0;
    this.memories.forEach((mem) => {
      if (mem.type === type) count++;
    });
    return count;
  }
}

// Export MemoryType enum for use in memory-server.ts
export { MemoryType };
