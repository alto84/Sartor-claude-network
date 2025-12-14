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

/**
 * Calculate Levenshtein distance for fuzzy text matching
 * Uses dynamic programming for optimal performance
 */
function levenshteinDistance(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  const matrix: number[][] = Array(bLen + 1)
    .fill(null)
    .map(() => Array(aLen + 1).fill(0));

  for (let i = 0; i <= aLen; i++) matrix[0][i] = i;
  for (let j = 0; j <= bLen; j++) matrix[j][0] = j;

  for (let j = 1; j <= bLen; j++) {
    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[bLen][aLen];
}

/**
 * Calculate fuzzy match score (0-1, higher is better)
 */
function calculateFuzzyScore(query: string, text: string, threshold = 0.7): number {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact substring match is perfect
  if (textLower.includes(queryLower)) {
    return 1.0;
  }

  // Calculate distance-based score
  const maxLen = Math.max(queryLower.length, textLower.length);
  const distance = levenshteinDistance(queryLower, textLower);
  const score = 1 - distance / maxLen;

  return score >= threshold ? score : 0;
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

/**
 * Search options for enhanced memory search
 */
export interface SearchMemoriesOptions {
  filters?: {
    type?: MemoryType[];
    min_importance?: number;
    max_importance?: number;
    status?: MemoryStatus[];
    tags?: string[];
  };
  contentQuery?: string;
  fuzzyThreshold?: number; // 0-1, default 0.5
  limit?: number;
}

/**
 * Frequently accessed search patterns cache
 */
interface SearchPatternCache {
  query: string;
  results: Array<{ memory: Memory; score: number }>;
  timestamp: number;
  accessCount: number;
}

export class MemorySystem {
  private memories: Map<string, Memory> = new Map();
  private config: Required<MemorySystemConfig>;
  private persistencePath: string;
  private searchCache: Map<string, SearchPatternCache> = new Map();
  private cacheMaxSize = 100;
  private cacheTtl = 3600000; // 1 hour

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

  /**
   * Clear expired cache entries to maintain performance
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.searchCache.entries()) {
      if (now - entry.timestamp > this.cacheTtl) {
        this.searchCache.delete(key);
      }
    }

    // Evict least frequently accessed entries if cache exceeds max size
    if (this.searchCache.size > this.cacheMaxSize) {
      const sorted = Array.from(this.searchCache.entries())
        .sort((a, b) => a[1].accessCount - b[1].accessCount);
      const toRemove = sorted.slice(0, Math.ceil(this.cacheMaxSize * 0.2)); // Remove 20% of cache
      for (const [key] of toRemove) {
        this.searchCache.delete(key);
      }
    }
  }

  /**
   * Generate cache key from search options
   */
  private generateCacheKey(options: SearchMemoriesOptions): string {
    return JSON.stringify(options);
  }

  /**
   * Enhanced search with fuzzy matching, tag filtering, and importance range queries
   */
  async searchMemories(
    options: SearchMemoriesOptions = {}
  ): Promise<Array<{ memory: Memory; score: number }>> {
    // Check cache first
    const cacheKey = this.generateCacheKey(options);
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      cached.accessCount++;
      return cached.results;
    }

    const results: Array<{ memory: Memory; score: number }> = [];

    for (const memory of this.memories.values()) {
      let match = true;
      let score = memory.importance_score;

      // Type filter
      if (options.filters?.type && !options.filters.type.includes(memory.type)) {
        match = false;
      }

      // Importance range filter (min_importance and max_importance)
      if (options.filters?.min_importance && memory.importance_score < options.filters.min_importance) {
        match = false;
      }
      if (options.filters?.max_importance && memory.importance_score > options.filters.max_importance) {
        match = false;
      }

      // Status filter
      if (options.filters?.status && !options.filters.status.includes(memory.status)) {
        match = false;
      }

      // Tag-based filtering
      if (options.filters?.tags && options.filters.tags.length > 0) {
        const hasAllTags = options.filters.tags.every(tag => memory.tags.includes(tag));
        if (!hasAllTags) {
          match = false;
        }
      }

      // Content search with fuzzy matching
      if (options.contentQuery && match) {
        const fuzzyScore = calculateFuzzyScore(
          options.contentQuery,
          memory.content,
          options.fuzzyThreshold ?? 0.5
        );
        if (fuzzyScore === 0) {
          match = false;
        } else {
          // Combine importance score with fuzzy match score
          score = (score * 0.5) + (fuzzyScore * 0.5);
        }
      }

      if (match) {
        results.push({ memory, score });
      }
    }

    results.sort((a, b) => b.score - a.score);

    // Cache the results
    this.clearExpiredCache();
    const finalResults = options.limit ? results.slice(0, options.limit) : results;
    this.searchCache.set(cacheKey, {
      query: options.contentQuery || JSON.stringify(options.filters),
      results: finalResults,
      timestamp: Date.now(),
      accessCount: 1,
    });

    return finalResults;
  }

  /**
   * Search by content with fuzzy matching (convenience method)
   */
  async searchByContent(
    query: string,
    limit?: number,
    fuzzyThreshold = 0.5
  ): Promise<Array<{ memory: Memory; score: number }>> {
    return this.searchMemories({
      contentQuery: query,
      fuzzyThreshold,
      limit,
    });
  }

  /**
   * Search by tags (convenience method)
   */
  async searchByTags(
    tags: string[],
    limit?: number
  ): Promise<Array<{ memory: Memory; score: number }>> {
    return this.searchMemories({
      filters: { tags },
      limit,
    });
  }

  /**
   * Search by importance range (convenience method)
   */
  async searchByImportanceRange(
    minImportance: number,
    maxImportance: number,
    limit?: number
  ): Promise<Array<{ memory: Memory; score: number }>> {
    return this.searchMemories({
      filters: {
        min_importance: minImportance,
        max_importance: maxImportance,
      },
      limit,
    });
  }

  /**
   * Get high-importance memories (importance >= 0.8)
   */
  async getHighImportanceMemories(limit = 10): Promise<Array<{ memory: Memory; score: number }>> {
    return this.searchMemories({
      filters: { min_importance: 0.8 },
      limit,
    });
  }

  /**
   * Get memories by type and importance
   */
  async searchByTypeAndImportance(
    type: MemoryType,
    minImportance = 0.5,
    limit?: number
  ): Promise<Array<{ memory: Memory; score: number }>> {
    return this.searchMemories({
      filters: {
        type: [type],
        min_importance: minImportance,
      },
      limit,
    });
  }

  /**
   * Clear cache for search optimization
   */
  clearSearchCache(): void {
    this.searchCache.clear();
  }

  /**
   * Get cache statistics
   */
  getSearchCacheStats(): { size: number; entries: number; ttl: number } {
    return {
      size: this.searchCache.size,
      entries: this.searchCache.size,
      ttl: this.cacheTtl,
    };
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
