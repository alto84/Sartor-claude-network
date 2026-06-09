/**
 * Unified Memory System - Orchestrates all three tiers
 * Phase 5: Full Integration
 */

import { MemoryType, MemoryStatus } from './memory-schema';

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
}

export class MemorySystem {
  private memories: Map<string, Memory> = new Map();
  private config: Required<MemorySystemConfig>;

  constructor(config: MemorySystemConfig = {}) {
    this.config = {
      hotTtl: config.hotTtl ?? 3600000,
      promotionThreshold: config.promotionThreshold ?? 5,
      demotionThreshold: config.demotionThreshold ?? 0.2,
    };
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
    return this.memories.delete(id);
  }

  async updateMemory(id: string, updates: Partial<Memory>): Promise<Memory | null> {
    const memory = this.memories.get(id);
    if (!memory) return null;

    Object.assign(memory, updates);
    memory.last_accessed = new Date().toISOString();
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
