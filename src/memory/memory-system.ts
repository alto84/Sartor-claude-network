/**
 * Unified Memory System - Orchestrates all three tiers
 * Phase 5: Full Integration
 */

import { MemoryType, MemoryStatus } from './memory-schema';
import * as fs from 'fs';
import * as path from 'path';

/** Minimal Memory interface for the system */
export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  status: MemoryStatus;
  importance_score: number;
  strength: number;
  access_count: number;
  created_at: string;
  updated_at?: string;
  last_accessed: string;
  tags: string[];
  links?: string[];
}

/** Simple UUID generator */
function generateId(): string {
  return 'mem_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

export interface MemorySystemConfig {
  hotTtl?: number;
  promotionThreshold?: number;
  demotionThreshold?: number;
  persistencePath?: string;
}

interface MemoryFileFormat {
  version: string;
  created_at: string;
  memories: Record<string, Memory>;
}

export class MemorySystem {
  private memories: Map<string, Memory> = new Map();
  private config: Required<MemorySystemConfig>;
  private persistencePath: string;

  constructor(config: MemorySystemConfig = {}) {
    this.config = {
      hotTtl: config.hotTtl ?? 3600000,
      promotionThreshold: config.promotionThreshold ?? 5,
      demotionThreshold: config.demotionThreshold ?? 0.2,
      persistencePath: config.persistencePath ?? path.join(process.cwd(), 'data', 'memories.json'),
    };
    this.persistencePath = this.config.persistencePath;
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.persistencePath)) {
        const data = fs.readFileSync(this.persistencePath, 'utf8');
        const parsed: MemoryFileFormat = JSON.parse(data);

        // Load memories from the file format
        if (parsed.memories) {
          for (const [id, memory] of Object.entries(parsed.memories)) {
            this.memories.set(id, memory);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load memories from disk:', error);
      // Continue with empty memory map if load fails
    }
  }

  private saveToDisk(): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Convert Map to object for JSON serialization
      const memoriesObj: Record<string, Memory> = {};
      for (const [id, memory] of this.memories.entries()) {
        memoriesObj[id] = memory;
      }

      const fileData: MemoryFileFormat = {
        version: '1.0.0',
        created_at: new Date().toISOString(),
        memories: memoriesObj,
      };

      fs.writeFileSync(this.persistencePath, JSON.stringify(fileData, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save memories to disk:', error);
    }
  }

  async createMemory(
    content: string,
    type: MemoryType,
    metadata: Partial<Memory> = {}
  ): Promise<Memory> {
    const id = generateId();
    const now = new Date().toISOString();

    const memory: Memory = {
      id,
      content,
      type,
      status: MemoryStatus.ACTIVE,
      importance_score: metadata.importance_score ?? 0.5,
      strength: metadata.strength ?? 1.0,
      access_count: 0,
      created_at: now,
      updated_at: now,
      last_accessed: now,
      tags: metadata.tags ?? [],
      links: metadata.links ?? [],
      ...metadata,
    };

    this.memories.set(id, memory);
    this.saveToDisk();
    return memory;
  }

  async getMemory(id: string, recordAccess = true): Promise<Memory | null> {
    const memory = this.memories.get(id);
    if (!memory) return null;

    if (recordAccess) {
      memory.access_count++;
      memory.last_accessed = new Date().toISOString();
    }

    return memory;
  }

  deleteMemory(id: string): boolean {
    const result = this.memories.delete(id);
    if (result) {
      this.saveToDisk();
    }
    return result;
  }

  async updateMemory(id: string, updates: Partial<Memory>): Promise<Memory | null> {
    const memory = this.memories.get(id);
    if (!memory) return null;

    Object.assign(memory, updates);
    memory.last_accessed = new Date().toISOString();
    this.saveToDisk();
    return memory;
  }

  async searchMemories(
    options: {
      filters?: {
        type?: MemoryType[];
        min_importance?: number;
        status?: MemoryStatus[];
      };
      limit?: number;
    } = {}
  ): Promise<Array<{ memory: Memory; score: number }>> {
    const results: Array<{ memory: Memory; score: number }> = [];

    for (const memory of this.memories.values()) {
      let match = true;

      if (options.filters?.type && !options.filters.type.includes(memory.type)) {
        match = false;
      }
      if (
        options.filters?.min_importance &&
        memory.importance_score < options.filters.min_importance
      ) {
        match = false;
      }
      if (options.filters?.status && !options.filters.status.includes(memory.status)) {
        match = false;
      }

      if (match) {
        results.push({ memory, score: memory.importance_score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return options.limit ? results.slice(0, options.limit) : results;
  }

  async runDailyMaintenance(): Promise<{ decay_updated: number; consolidations: number }> {
    let decay_updated = 0;
    let consolidations = 0;

    for (const memory of this.memories.values()) {
      // Apply decay to strength
      memory.strength = Math.max(0, memory.strength * 0.95);
      decay_updated++;

      // Archive if below threshold
      if (memory.strength < this.config.demotionThreshold) {
        memory.status = MemoryStatus.ARCHIVED;
        consolidations++;
      }
    }

    this.saveToDisk();
    return { decay_updated, consolidations };
  }

  getStats(): {
    total_memories: number;
    by_type: Record<MemoryType, number>;
    by_status: Record<MemoryStatus, number>;
  } {
    const by_type = {} as Record<MemoryType, number>;
    const by_status = {} as Record<MemoryStatus, number>;

    for (const memory of this.memories.values()) {
      by_type[memory.type] = (by_type[memory.type] || 0) + 1;
      by_status[memory.status] = (by_status[memory.status] || 0) + 1;
    }

    return {
      total_memories: this.memories.size,
      by_type,
      by_status,
    };
  }

  exportMemories(): Memory[] {
    return Array.from(this.memories.values());
  }

  importMemories(memories: Memory[]): void {
    for (const memory of memories) {
      this.memories.set(memory.id, memory);
    }
  }
}
