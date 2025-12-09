/**
 * Memory Integration for Multi-Expert System
 *
 * Connects expert execution with the memory MCP server.
 * Enables learning from past executions and pattern retrieval.
 *
 * Features:
 * - Store expert results as memories
 * - Retrieve relevant past solutions
 * - Track expert performance over time
 * - Pattern-based solution lookup
 *
 * @module multi-expert/memory-integration
 */

import { ExpertResult, MultiExpertResult, ExpertTask } from './execution-engine';
import { ExpertConfig } from './expert-config';
import { FeedbackCollection } from './feedback-loop';
import { SoftScore } from './soft-scorer';

/**
 * Memory types for expert system
 */
export type ExpertMemoryType =
  | 'solution'        // Successful solution
  | 'failure'         // Failed attempt (for learning)
  | 'pattern'         // Recognized pattern
  | 'feedback'        // Feedback received
  | 'performance';    // Expert performance metrics

/**
 * Memory entry for expert system
 */
export interface ExpertMemory {
  /** Unique memory ID */
  id: string;

  /** Memory type */
  type: ExpertMemoryType;

  /** Task this memory relates to */
  taskId: string;

  /** Task type/category */
  taskType: string;

  /** Expert that produced this */
  expertId?: string;

  /** Expert archetype */
  archetype?: string;

  /** Memory content (solution, feedback, etc.) */
  content: unknown;

  /** Score achieved */
  score: number;

  /** Confidence level */
  confidence: number;

  /** Tags for retrieval */
  tags: string[];

  /** When created */
  timestamp: string;

  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/**
 * Memory query for retrieval
 */
export interface MemoryQuery {
  /** Filter by type */
  type?: ExpertMemoryType;

  /** Filter by task type */
  taskType?: string;

  /** Filter by archetype */
  archetype?: string;

  /** Filter by tags (any match) */
  tags?: string[];

  /** Minimum score threshold */
  minScore?: number;

  /** Maximum results to return */
  limit?: number;

  /** Time range (ms from now) */
  maxAge?: number;
}

/**
 * Memory client interface
 */
export interface MemoryClient {
  /** Create a new memory */
  create(memory: Omit<ExpertMemory, 'id' | 'timestamp'>): Promise<string>;

  /** Get memory by ID */
  get(id: string): Promise<ExpertMemory | null>;

  /** Search memories */
  search(query: MemoryQuery): Promise<ExpertMemory[]>;

  /** Update memory */
  update(id: string, updates: Partial<ExpertMemory>): Promise<boolean>;

  /** Delete memory */
  delete(id: string): Promise<boolean>;
}

/**
 * Memory integration configuration
 */
export interface MemoryIntegrationConfig {
  /** Whether to store successful solutions */
  storeSolutions: boolean;

  /** Whether to store failures */
  storeFailures: boolean;

  /** Minimum score to store as solution */
  minScoreToStore: number;

  /** Whether to track expert performance */
  trackPerformance: boolean;

  /** Maximum memories to retrieve for context */
  maxContextMemories: number;

  /** Default tags for new memories */
  defaultTags: string[];
}

/**
 * Default memory integration configuration
 */
export const DEFAULT_MEMORY_INTEGRATION_CONFIG: MemoryIntegrationConfig = {
  storeSolutions: true,
  storeFailures: true,
  minScoreToStore: 60,
  trackPerformance: true,
  maxContextMemories: 5,
  defaultTags: ['multi-expert'],
};

/**
 * Memory Integration Manager
 */
export class MemoryIntegration {
  private config: MemoryIntegrationConfig;
  private client: MemoryClient;
  private performanceCache: Map<string, ExpertPerformance>;

  constructor(client: MemoryClient, config: Partial<MemoryIntegrationConfig> = {}) {
    this.config = { ...DEFAULT_MEMORY_INTEGRATION_CONFIG, ...config };
    this.client = client;
    this.performanceCache = new Map();
  }

  /**
   * Store expert result as memory
   */
  async storeResult(result: ExpertResult, score?: SoftScore): Promise<string | null> {
    const shouldStore = result.success
      ? this.config.storeSolutions && result.score >= this.config.minScoreToStore
      : this.config.storeFailures;

    if (!shouldStore) {
      return null;
    }

    const memoryType: ExpertMemoryType = result.success ? 'solution' : 'failure';

    const memory: Omit<ExpertMemory, 'id' | 'timestamp'> = {
      type: memoryType,
      taskId: result.taskId,
      taskType: 'expert-execution',
      expertId: result.expertId,
      archetype: result.expertConfig.archetype,
      content: {
        output: result.output,
        iterations: result.iterations,
        durationMs: result.durationMs,
        error: result.error,
        softScore: score,
      },
      score: result.score,
      confidence: result.confidence,
      tags: [
        ...this.config.defaultTags,
        memoryType,
        result.expertConfig.archetype,
      ],
      metadata: {
        expertConfigId: result.expertConfig.id,
        strategy: result.expertConfig.strategy,
      },
    };

    return this.client.create(memory);
  }

  /**
   * Store multi-expert execution results
   */
  async storeMultiExpertResult(result: MultiExpertResult): Promise<string[]> {
    const ids: string[] = [];

    // Store individual results
    for (const expertResult of result.results) {
      const id = await this.storeResult(expertResult);
      if (id) ids.push(id);
    }

    // Store aggregated result as pattern if successful
    if (result.bestResult && result.summary.avgScore >= this.config.minScoreToStore) {
      const patternId = await this.client.create({
        type: 'pattern',
        taskId: result.taskId,
        taskType: 'multi-expert',
        content: {
          bestExpertId: result.bestResult.expertId,
          bestArchetype: result.bestResult.expertConfig.archetype,
          expertCount: result.results.length,
          successCount: result.successCount,
          summary: result.summary,
        },
        score: result.summary.avgScore,
        confidence: result.summary.avgConfidence,
        tags: [
          ...this.config.defaultTags,
          'pattern',
          'multi-expert-result',
        ],
        metadata: {
          totalDurationMs: result.totalDurationMs,
          agreementLevel: result.summary.agreementLevel,
        },
      });

      if (patternId) ids.push(patternId);
    }

    return ids;
  }

  /**
   * Store feedback collection
   */
  async storeFeedback(feedback: FeedbackCollection): Promise<string | null> {
    return this.client.create({
      type: 'feedback',
      taskId: feedback.resultId,
      taskType: 'feedback',
      expertId: feedback.expertId,
      content: {
        items: feedback.items,
        summary: feedback.summary,
        criticalCount: feedback.criticalCount,
        majorCount: feedback.majorCount,
      },
      score: feedback.overallScore,
      confidence: 0.9,
      tags: [
        ...this.config.defaultTags,
        'feedback',
        feedback.criticalCount > 0 ? 'has-critical' : 'no-critical',
      ],
      metadata: {},
    });
  }

  /**
   * Get relevant memories for a task
   */
  async getContextForTask(task: ExpertTask): Promise<ExpertMemory[]> {
    const memories = await this.client.search({
      type: 'solution',
      taskType: task.type,
      minScore: this.config.minScoreToStore,
      limit: this.config.maxContextMemories,
    });

    return memories;
  }

  /**
   * Get successful patterns for task type
   */
  async getPatterns(taskType: string): Promise<ExpertMemory[]> {
    return this.client.search({
      type: 'pattern',
      taskType,
      minScore: 70,
      limit: 10,
    });
  }

  /**
   * Get expert performance history
   */
  async getExpertPerformance(expertId: string): Promise<ExpertPerformance> {
    // Check cache first
    if (this.performanceCache.has(expertId)) {
      return this.performanceCache.get(expertId)!;
    }

    // Query performance memories
    const memories = await this.client.search({
      type: 'solution',
      limit: 100,
    });

    const expertMemories = memories.filter((m) => m.expertId === expertId);

    const performance: ExpertPerformance = {
      expertId,
      totalExecutions: expertMemories.length,
      avgScore: expertMemories.length > 0
        ? expertMemories.reduce((sum, m) => sum + m.score, 0) / expertMemories.length
        : 0,
      avgConfidence: expertMemories.length > 0
        ? expertMemories.reduce((sum, m) => sum + m.confidence, 0) / expertMemories.length
        : 0,
      successRate: expertMemories.length > 0
        ? expertMemories.filter((m) => m.score >= 60).length / expertMemories.length
        : 0,
      lastExecuted: expertMemories.length > 0
        ? expertMemories[0].timestamp
        : undefined,
    };

    this.performanceCache.set(expertId, performance);
    return performance;
  }

  /**
   * Update expert performance
   */
  async updatePerformance(result: ExpertResult): Promise<void> {
    if (!this.config.trackPerformance) return;

    const existing = await this.getExpertPerformance(result.expertId);

    const updated: ExpertPerformance = {
      expertId: result.expertId,
      totalExecutions: existing.totalExecutions + 1,
      avgScore: (existing.avgScore * existing.totalExecutions + result.score) /
        (existing.totalExecutions + 1),
      avgConfidence: (existing.avgConfidence * existing.totalExecutions + result.confidence) /
        (existing.totalExecutions + 1),
      successRate: (existing.successRate * existing.totalExecutions +
        (result.success && result.score >= 60 ? 1 : 0)) /
        (existing.totalExecutions + 1),
      lastExecuted: new Date().toISOString(),
    };

    this.performanceCache.set(result.expertId, updated);

    // Store performance update
    await this.client.create({
      type: 'performance',
      taskId: result.taskId,
      taskType: 'performance-update',
      expertId: result.expertId,
      archetype: result.expertConfig.archetype,
      content: updated,
      score: updated.avgScore,
      confidence: updated.avgConfidence,
      tags: [...this.config.defaultTags, 'performance'],
      metadata: {},
    });
  }

  /**
   * Get best experts for a task type
   */
  async getBestExperts(taskType: string, limit: number = 3): Promise<ExpertPerformance[]> {
    const patterns = await this.getPatterns(taskType);

    // Extract expert IDs from patterns
    const expertIds = new Set<string>();
    for (const pattern of patterns) {
      const content = pattern.content as { bestExpertId?: string };
      if (content.bestExpertId) {
        expertIds.add(content.bestExpertId);
      }
    }

    // Get performance for each
    const performances: ExpertPerformance[] = [];
    for (const expertId of expertIds) {
      performances.push(await this.getExpertPerformance(expertId));
    }

    // Sort by score and return top N
    return performances
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, limit);
  }

  /**
   * Clear performance cache
   */
  clearCache(): void {
    this.performanceCache.clear();
  }
}

/**
 * Expert performance statistics
 */
export interface ExpertPerformance {
  /** Expert ID */
  expertId: string;

  /** Total number of executions */
  totalExecutions: number;

  /** Average score */
  avgScore: number;

  /** Average confidence */
  avgConfidence: number;

  /** Success rate (score >= 60) */
  successRate: number;

  /** Last execution timestamp */
  lastExecuted?: string;
}

/**
 * In-memory client for testing
 */
export class InMemoryMemoryClient implements MemoryClient {
  private memories: Map<string, ExpertMemory>;
  private counter: number;

  constructor() {
    this.memories = new Map();
    this.counter = 0;
  }

  async create(memory: Omit<ExpertMemory, 'id' | 'timestamp'>): Promise<string> {
    const id = `mem_${Date.now()}_${this.counter++}`;
    const fullMemory: ExpertMemory = {
      ...memory,
      id,
      timestamp: new Date().toISOString(),
    };
    this.memories.set(id, fullMemory);
    return id;
  }

  async get(id: string): Promise<ExpertMemory | null> {
    return this.memories.get(id) || null;
  }

  async search(query: MemoryQuery): Promise<ExpertMemory[]> {
    let results = Array.from(this.memories.values());

    if (query.type) {
      results = results.filter((m) => m.type === query.type);
    }

    if (query.taskType) {
      results = results.filter((m) => m.taskType === query.taskType);
    }

    if (query.archetype) {
      results = results.filter((m) => m.archetype === query.archetype);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter((m) =>
        query.tags!.some((tag) => m.tags.includes(tag))
      );
    }

    if (query.minScore !== undefined) {
      results = results.filter((m) => m.score >= query.minScore!);
    }

    if (query.maxAge !== undefined) {
      const cutoff = Date.now() - query.maxAge;
      results = results.filter((m) => new Date(m.timestamp).getTime() >= cutoff);
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  async update(id: string, updates: Partial<ExpertMemory>): Promise<boolean> {
    const existing = this.memories.get(id);
    if (!existing) return false;

    this.memories.set(id, { ...existing, ...updates });
    return true;
  }

  async delete(id: string): Promise<boolean> {
    return this.memories.delete(id);
  }

  /** Get all memories (for testing) */
  getAll(): ExpertMemory[] {
    return Array.from(this.memories.values());
  }

  /** Clear all memories (for testing) */
  clear(): void {
    this.memories.clear();
    this.counter = 0;
  }
}

/**
 * Create memory integration with in-memory client
 */
export function createTestMemoryIntegration(): MemoryIntegration {
  return new MemoryIntegration(new InMemoryMemoryClient());
}
