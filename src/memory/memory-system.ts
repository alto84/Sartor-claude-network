/**
 * Memory System - Main Integration
 *
 * Orchestrates all memory management components:
 * - Importance scoring
 * - Memory decay
 * - Consolidation
 * - Spaced repetition
 * - Forgetting strategy
 */

import {
  Memory,
  MemoryType,
  MemoryStatus,
  MemorySystemConfig,
  MemoryQuery,
  MemorySearchResult,
  MemoryStats,
  ImportanceWeights
} from '../utils/types';

import {
  updateMemoryImportance,
  calculateImportanceFactors,
  batchCalculateImportance
} from './importance-scoring';

import {
  updateMemoryStrength,
  batchDecayUpdate,
  transitionMemoryState,
  isProtectedMemory
} from './memory-decay';

import {
  shouldTriggerConsolidation,
  clusterMemories,
  determineConsolidationStrategy,
  executeConsolidation,
  calculateCompressionRatio
} from './consolidation';

import {
  buildReviewQueue,
  getContextTriggeredMemories,
  processDailyReviews,
  calculateNextReviewDate
} from './spaced-repetition';

import {
  findDeletionCandidates,
  executeForgettingProcess,
  isNeverForget,
  setPrivacyExpiration
} from './forgetting-strategy';

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CONFIG: MemorySystemConfig = {
  importance: {
    weights: {
      recency: 0.25,
      frequency: 0.20,
      salience: 0.35,
      relevance: 0.20
    },
    recency_lambda: 0.05,
    max_expected_accesses: 100
  },

  decay: {
    base_rate: 0.1,
    reinforcement_boost: 0.15,
    thresholds: {
      soft_delete: 0.30,
      archive: 0.15,
      permanent_delete: 0.05
    },
    type_modifiers: {
      [MemoryType.EPISODIC]: 1.0,
      [MemoryType.SEMANTIC]: 0.7,
      [MemoryType.PROCEDURAL]: 0.5,
      [MemoryType.EMOTIONAL]: 0.6,
      [MemoryType.SYSTEM]: 0.3
    }
  },

  consolidation: {
    trigger_count: 10000,
    similarity_threshold: 0.7,
    temporal_proximity_hours: 1,
    compression_target: 0.5
  },

  spaced_repetition: {
    initial_interval: 1,
    second_interval: 6,
    min_easiness: 1.3,
    max_easiness: 3.0
  },

  forgetting: {
    grace_period_days: 30,
    never_forget_tags: [
      'user_preference',
      'system_config',
      'explicitly_saved',
      'commitment',
      'promise',
      'decision',
      'personal_fact',
      'high_importance',
      'legal',
      'privacy',
      'procedural_knowledge'
    ],
    privacy: {
      pii_max_days: 30,
      financial_max_days: 90,
      health_max_days: 180,
      casual_max_days: 180
    },
    minimum_retention: {
      age_days: 7,
      importance: 0.7,
      access_count: 10
    }
  },

  performance: {
    batch_size: 100,
    max_embedding_dimensions: 768,
    compressed_dimensions: 128,
    cache_ttl_seconds: 3600
  }
};

// ============================================================================
// Memory System Class
// ============================================================================

export class MemorySystem {
  private config: MemorySystemConfig;
  private memories: Map<string, Memory>;
  private lastConsolidation: Date;
  private lastMaintenance: Date;

  constructor(config: Partial<MemorySystemConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memories = new Map();
    this.lastConsolidation = new Date();
    this.lastMaintenance = new Date();
  }

  // ========================================================================
  // Memory CRUD Operations
  // ========================================================================

  /**
   * Create a new memory
   */
  async createMemory(
    content: string,
    type: MemoryType = MemoryType.EPISODIC,
    metadata: Partial<Memory> = {}
  ): Promise<Memory> {
    const now = new Date();

    const memory: Memory = {
      id: this.generateId(),
      content,
      type,
      status: MemoryStatus.ACTIVE,

      created_at: now,
      updated_at: now,
      last_accessed: now,

      access_count: 0,
      strength: 1.0, // Start at full strength
      importance_score: 0.5, // Neutral until calculated

      tags: [],
      links: [],

      ...metadata
    };

    // Calculate initial importance
    await updateMemoryImportance(memory, undefined, this.config.importance.weights);

    // Set privacy expiration if needed
    setPrivacyExpiration(memory, this.config.forgetting);

    this.memories.set(memory.id, memory);

    return memory;
  }

  /**
   * Retrieve a memory by ID
   */
  async getMemory(id: string, recordAccess: boolean = true): Promise<Memory | null> {
    const memory = this.memories.get(id);

    if (!memory) {
      return null;
    }

    if (recordAccess && memory.status === MemoryStatus.ACTIVE) {
      // Update strength and access metrics
      updateMemoryStrength(memory, true, this.config.decay);

      // Recalculate importance (access affects frequency)
      await updateMemoryImportance(memory, undefined, this.config.importance.weights);
    }

    return memory;
  }

  /**
   * Update a memory
   */
  async updateMemory(id: string, updates: Partial<Memory>): Promise<Memory | null> {
    const memory = this.memories.get(id);

    if (!memory) {
      return null;
    }

    Object.assign(memory, updates);
    memory.updated_at = new Date();

    // Recalculate importance if content changed
    if (updates.content) {
      await updateMemoryImportance(memory, undefined, this.config.importance.weights);
    }

    return memory;
  }

  /**
   * Delete a memory
   */
  deleteMemory(id: string): boolean {
    return this.memories.delete(id);
  }

  // ========================================================================
  // Search and Retrieval
  // ========================================================================

  /**
   * Search memories by query
   */
  async searchMemories(query: MemoryQuery): Promise<MemorySearchResult[]> {
    let results: Memory[] = Array.from(this.memories.values());

    // Apply filters
    if (query.filters) {
      if (query.filters.type) {
        results = results.filter(m => query.filters!.type!.includes(m.type));
      }

      if (query.filters.tags) {
        results = results.filter(m =>
          query.filters!.tags!.some(tag => m.tags.includes(tag))
        );
      }

      if (query.filters.min_importance !== undefined) {
        results = results.filter(m => m.importance_score >= query.filters!.min_importance!);
      }

      if (query.filters.min_strength !== undefined) {
        results = results.filter(m => m.strength >= query.filters!.min_strength!);
      }

      if (query.filters.date_range) {
        const { start, end } = query.filters.date_range;
        results = results.filter(m => {
          const created = new Date(m.created_at);
          return created >= start && created <= end;
        });
      }
    }

    // Include archived if requested
    if (!query.include_archived) {
      results = results.filter(m => m.status === MemoryStatus.ACTIVE);
    }

    // Convert to search results with scores
    const searchResults: MemorySearchResult[] = results.map(memory => ({
      memory,
      score: memory.importance_score,
      matched_on: ['importance']
    }));

    // Sort by score
    searchResults.sort((a, b) => b.score - a.score);

    // Apply limit and offset
    const offset = query.offset || 0;
    const limit = query.limit || 10;

    return searchResults.slice(offset, offset + limit);
  }

  /**
   * Get context-relevant memories
   */
  async getRelevantMemories(
    contextEmbedding: number[],
    limit: number = 5
  ): Promise<Memory[]> {
    const memories = Array.from(this.memories.values())
      .filter(m => m.status === MemoryStatus.ACTIVE);

    const relevant = getContextTriggeredMemories(
      contextEmbedding,
      memories,
      0.6,
      limit,
      this.config.spaced_repetition
    );

    return relevant.map(r => r.memory);
  }

  // ========================================================================
  // Maintenance Operations
  // ========================================================================

  /**
   * Run daily maintenance tasks
   */
  async runDailyMaintenance(): Promise<{
    decay_updated: number;
    reviews_processed: number;
    consolidations: number;
    deletions: number;
  }> {
    const results = {
      decay_updated: 0,
      reviews_processed: 0,
      consolidations: 0,
      deletions: 0
    };

    const allMemories = Array.from(this.memories.values());

    // 1. Update decay for all memories
    results.decay_updated = batchDecayUpdate(allMemories, this.config.decay);

    // 2. Process spaced repetition reviews
    const reviewResults = await processDailyReviews(
      allMemories,
      20,
      this.config.spaced_repetition
    );
    results.reviews_processed = reviewResults.reviewed;

    // 3. Check consolidation triggers
    const activeMemories = allMemories.filter(m => m.status === MemoryStatus.ACTIVE);
    const storageUsage = this.calculateStorageUsage();

    if (shouldTriggerConsolidation(activeMemories.length, storageUsage, this.config.consolidation)) {
      const consolidationResults = await this.runConsolidation();
      results.consolidations = consolidationResults.clusters_consolidated;
      this.lastConsolidation = new Date();
    }

    // 4. Execute forgetting process
    const deletionCandidates = findDeletionCandidates(allMemories, this.config.forgetting);
    const deletionResults = executeForgettingProcess(deletionCandidates);
    results.deletions = deletionResults.permanently_deleted;

    // Remove permanently deleted memories
    for (const memory of allMemories) {
      if (memory.status === MemoryStatus.DELETED) {
        this.memories.delete(memory.id);
      }
    }

    this.lastMaintenance = new Date();

    return results;
  }

  /**
   * Run consolidation process
   */
  async runConsolidation(): Promise<{
    clusters_found: number;
    clusters_consolidated: number;
    compression_ratio: number;
  }> {
    const activeMemories = Array.from(this.memories.values())
      .filter(m => m.status === MemoryStatus.ACTIVE && !isProtectedMemory(m));

    // Cluster memories
    const clusters = clusterMemories(activeMemories, this.config.consolidation);

    let consolidatedCount = 0;
    const originalMemories = [...activeMemories];

    for (const cluster of clusters) {
      const strategy = determineConsolidationStrategy(cluster);

      if (strategy.action !== 'skip') {
        const result = await executeConsolidation(strategy);

        // Handle consolidation results
        if (Array.isArray(result)) {
          // Multiple memories (linked or kept)
          for (const memory of result) {
            this.memories.set(memory.id, memory);
          }
        } else {
          // Single consolidated memory
          this.memories.set(result.id, result);

          // Archive original memories
          for (const originalMemory of cluster.memories) {
            originalMemory.status = MemoryStatus.ARCHIVED;
            this.memories.set(originalMemory.id, originalMemory);
          }

          consolidatedCount++;
        }
      }
    }

    const currentMemories = Array.from(this.memories.values())
      .filter(m => m.status === MemoryStatus.ACTIVE);

    const compressionRatio = calculateCompressionRatio(originalMemories, currentMemories);

    return {
      clusters_found: clusters.length,
      clusters_consolidated: consolidatedCount,
      compression_ratio: compressionRatio
    };
  }

  // ========================================================================
  // Statistics and Monitoring
  // ========================================================================

  /**
   * Get memory system statistics
   */
  getStats(): MemoryStats {
    const memories = Array.from(this.memories.values());

    const stats: MemoryStats = {
      total_memories: memories.length,
      by_status: {
        [MemoryStatus.ACTIVE]: 0,
        [MemoryStatus.ARCHIVED]: 0,
        [MemoryStatus.DELETED]: 0
      },
      by_type: {
        [MemoryType.EPISODIC]: 0,
        [MemoryType.SEMANTIC]: 0,
        [MemoryType.PROCEDURAL]: 0,
        [MemoryType.EMOTIONAL]: 0,
        [MemoryType.SYSTEM]: 0
      },
      average_importance: 0,
      average_strength: 0,
      average_age_days: 0,
      total_storage_bytes: 0,
      consolidated_count: 0,
      deletion_count_30d: 0
    };

    const now = new Date();
    let totalImportance = 0;
    let totalStrength = 0;
    let totalAge = 0;

    for (const memory of memories) {
      // Count by status
      stats.by_status[memory.status]++;

      // Count by type
      stats.by_type[memory.type]++;

      // Sum for averages
      totalImportance += memory.importance_score;
      totalStrength += memory.strength;

      const ageMs = now.getTime() - new Date(memory.created_at).getTime();
      totalAge += ageMs / (1000 * 60 * 60 * 24);

      // Storage estimation
      stats.total_storage_bytes += this.estimateMemorySize(memory);

      // Count consolidated
      if (memory.consolidated_from && memory.consolidated_from.length > 0) {
        stats.consolidated_count++;
      }
    }

    if (memories.length > 0) {
      stats.average_importance = totalImportance / memories.length;
      stats.average_strength = totalStrength / memories.length;
      stats.average_age_days = totalAge / memories.length;
    }

    return stats;
  }

  /**
   * Calculate storage usage percentage
   */
  private calculateStorageUsage(): number {
    const stats = this.getStats();
    const maxStorage = 1024 * 1024 * 1024; // 1GB limit (configurable)
    return (stats.total_storage_bytes / maxStorage) * 100;
  }

  /**
   * Estimate memory size in bytes
   */
  private estimateMemorySize(memory: Memory): number {
    let size = 0;

    // Content
    size += memory.content.length * 2; // UTF-16

    // Embedding
    if (memory.embedding) {
      size += memory.embedding.length * 8; // Float64
    }

    // Metadata (rough estimate)
    size += 500;

    return size;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ========================================================================
  // Export/Import
  // ========================================================================

  /**
   * Export all memories
   */
  exportMemories(): Memory[] {
    return Array.from(this.memories.values());
  }

  /**
   * Import memories
   */
  importMemories(memories: Memory[]): void {
    for (const memory of memories) {
      this.memories.set(memory.id, memory);
    }
  }

  /**
   * Get configuration
   */
  getConfig(): MemorySystemConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MemorySystemConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new memory system with default configuration
 */
export function createMemorySystem(config?: Partial<MemorySystemConfig>): MemorySystem {
  return new MemorySystem(config);
}

/**
 * Create a memory system optimized for a specific use case
 */
export function createOptimizedMemorySystem(
  useCase: 'conversational' | 'knowledge_base' | 'event_tracking'
): MemorySystem {
  const baseConfig = { ...DEFAULT_CONFIG };

  switch (useCase) {
    case 'conversational':
      // Optimize for recency and context
      baseConfig.importance.weights = {
        recency: 0.35,
        frequency: 0.15,
        salience: 0.25,
        relevance: 0.25
      };
      baseConfig.forgetting.privacy.casual_max_days = 90;
      break;

    case 'knowledge_base':
      // Optimize for importance and permanence
      baseConfig.importance.weights = {
        recency: 0.15,
        frequency: 0.20,
        salience: 0.45,
        relevance: 0.20
      };
      baseConfig.decay.base_rate = 0.05; // Slower decay
      break;

    case 'event_tracking':
      // Optimize for temporal accuracy
      baseConfig.importance.weights = {
        recency: 0.40,
        frequency: 0.25,
        salience: 0.20,
        relevance: 0.15
      };
      baseConfig.consolidation.temporal_proximity_hours = 0.5; // Tighter clustering
      break;
  }

  return new MemorySystem(baseConfig);
}
