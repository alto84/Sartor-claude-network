/**
 * Memory System Implementation Examples
 *
 * This file demonstrates how to implement the memory schema interfaces
 * in a real MCP server environment.
 */

import {
  MemorySystem,
  MemoryStorage,
  VectorStore,
  MemoryCache,
  BaseMemory,
  EpisodicMemory,
  SemanticMemory,
  ProceduralMemory,
  WorkingMemory,
  MemoryQuery,
  MemoryQueryResult,
  MemoryType,
  MemoryStatus,
  ClaudeSurface,
  ConfidenceLevel,
  KnowledgeType,
  ImportanceScore,
  DecayRate,
  MemoryId,
  Timestamp,
  MemoryConsolidation,
  DecayCalculation,
  MemoryConflict,
  MemorySystemStats
} from './memory-schema';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique memory ID
 */
function generateMemoryId(): MemoryId {
  return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current ISO timestamp
 */
function now(): Timestamp {
  return new Date().toISOString();
}

/**
 * Calculate importance from various factors
 */
function calculateImportance(factors: {
  recency: number;
  frequency: number;
  userExplicit: number;
  emotional: number;
  novelty: number;
}): ImportanceScore {
  const weights = {
    recency: 0.25,
    frequency: 0.20,
    userExplicit: 0.30,
    emotional: 0.15,
    novelty: 0.10
  };

  return (
    factors.recency * weights.recency +
    factors.frequency * weights.frequency +
    factors.userExplicit * weights.userExplicit +
    factors.emotional * weights.emotional +
    factors.novelty * weights.novelty
  );
}

/**
 * Calculate decay rate based on memory characteristics
 */
function calculateDecayRate(memory: BaseMemory): DecayRate {
  // High importance memories decay slower
  const importanceModifier = 1 - memory.importance.importance;

  // Frequently accessed memories decay slower
  const frequencyModifier = Math.max(0, 1 - memory.temporal.accessFrequency / 10);

  // Base decay rate varies by memory type
  const baseDecayRates: Record<MemoryType, number> = {
    [MemoryType.WORKING]: 0.9,      // Very fast decay
    [MemoryType.EPISODIC]: 0.5,     // Moderate decay
    [MemoryType.SEMANTIC]: 0.2,     // Slow decay
    [MemoryType.PROCEDURAL]: 0.1    // Very slow decay
  };

  const baseRate = baseDecayRates[memory.type];
  return baseRate * importanceModifier * frequencyModifier;
}

/**
 * Apply exponential decay to importance score
 */
function applyDecay(
  currentImportance: number,
  decayRate: DecayRate,
  timeSinceAccessMs: number
): DecayCalculation {
  const hoursSinceAccess = timeSinceAccessMs / (1000 * 60 * 60);
  const decayFactor = Math.exp(-decayRate * hoursSinceAccess / 24); // Daily decay

  const newImportance = currentImportance * decayFactor;
  const shouldArchive = newImportance < 0.1;

  return {
    currentImportance,
    baseDecayRate: decayRate,
    timeSinceAccess: timeSinceAccessMs,
    frequencyModifier: 1.0,
    newImportance,
    shouldArchive
  };
}

/**
 * Hash content for sync conflict detection
 */
function hashContent(content: unknown): string {
  // In production, use a proper hashing algorithm
  const str = JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create base memory metadata
 */
function createBaseMemory(
  type: MemoryType,
  surface: ClaudeSurface,
  userId: string,
  sessionId: string,
  initialImportance: ImportanceScore = 0.5
): Partial<BaseMemory> {
  const currentTime = now();
  const memoryId = generateMemoryId();

  const importanceFactors = {
    recency: 1.0,
    frequency: 0.0,
    userExplicit: 0.5,
    emotional: 0.5,
    novelty: 0.7
  };

  return {
    id: memoryId,
    type,
    status: MemoryStatus.ACTIVE,
    temporal: {
      createdAt: currentTime,
      lastAccessedAt: currentTime,
      lastModifiedAt: currentTime,
      accessCount: 0,
      accessFrequency: 0,
      accessHistory: [currentTime]
    },
    importance: {
      importance: initialImportance,
      initialImportance,
      decayRate: 0.5,
      protectedFromDecay: false,
      decayThreshold: 0.1,
      importanceFactors
    },
    source: {
      surface,
      userId,
      sessionId,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator?.language || 'en-US'
    },
    embedding: {
      vector: [], // Will be populated by embedding service
      model: 'text-embedding-3-small',
      modelVersion: '1.0',
      dimensions: 1536,
      generatedAt: currentTime,
      needsRefresh: true
    },
    tags: {
      tags: [],
      categories: [],
      topics: [],
      entities: []
    },
    relations: [],
    sync: {
      lastSyncedAt: currentTime,
      version: 1,
      contentHash: '',
      syncEnabled: true,
      availableSurfaces: [surface],
      pendingSync: false,
      conflictResolution: 'latest_wins'
    },
    metadata: {}
  };
}

// ============================================================================
// MEMORY SYSTEM IMPLEMENTATION
// ============================================================================

/**
 * In-memory implementation of MemoryStorage (for demonstration)
 * In production, use a real database
 */
class InMemoryStorage implements MemoryStorage {
  private memories: Map<MemoryId, BaseMemory> = new Map();

  async store<T extends BaseMemory>(memory: T): Promise<void> {
    this.memories.set(memory.id, memory);
  }

  async retrieve<T extends BaseMemory>(id: MemoryId): Promise<T | null> {
    return (this.memories.get(id) as T) || null;
  }

  async update<T extends BaseMemory>(id: MemoryId, updates: Partial<T>): Promise<void> {
    const memory = this.memories.get(id);
    if (memory) {
      this.memories.set(id, { ...memory, ...updates } as BaseMemory);
    }
  }

  async delete(id: MemoryId): Promise<void> {
    this.memories.delete(id);
  }

  async query<T extends BaseMemory>(query: MemoryQuery): Promise<MemoryQueryResult<T>[]> {
    let results = Array.from(this.memories.values()) as T[];

    // Filter by type
    if (query.types) {
      results = results.filter(m => query.types!.includes(m.type));
    }

    // Filter by status
    if (query.status) {
      results = results.filter(m => query.status!.includes(m.status));
    }

    // Filter by temporal
    if (query.temporal) {
      if (query.temporal.startDate) {
        results = results.filter(
          m => m.temporal.createdAt >= query.temporal!.startDate!
        );
      }
      if (query.temporal.endDate) {
        results = results.filter(
          m => m.temporal.createdAt <= query.temporal!.endDate!
        );
      }
    }

    // Filter by importance
    if (query.importance) {
      if (query.importance.minImportance !== undefined) {
        results = results.filter(
          m => m.importance.importance >= query.importance!.minImportance!
        );
      }
      if (query.importance.maxImportance !== undefined) {
        results = results.filter(
          m => m.importance.importance <= query.importance!.maxImportance!
        );
      }
    }

    // Filter by tags
    if (query.tags?.includeTags) {
      results = results.filter(m =>
        query.tags!.includeTags!.some(tag => m.tags.tags.includes(tag))
      );
    }

    // Limit results
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results.map(memory => ({
      memory,
      score: 0.8, // Simplified scoring
      retrievalReason: 'matched query filters',
      relevanceFactors: {
        semantic: 0.8,
        temporal: 0.7,
        importance: memory.importance.importance,
        relational: 0.5
      }
    }));
  }

  async batchStore<T extends BaseMemory>(memories: T[]): Promise<void> {
    for (const memory of memories) {
      await this.store(memory);
    }
  }

  async batchRetrieve<T extends BaseMemory>(ids: MemoryId[]): Promise<(T | null)[]> {
    return Promise.all(ids.map(id => this.retrieve<T>(id)));
  }

  async createIndex(): Promise<void> {
    // No-op for in-memory implementation
  }

  async dropIndex(): Promise<void> {
    // No-op for in-memory implementation
  }
}

/**
 * Simple in-memory vector store (for demonstration)
 */
class SimpleVectorStore implements VectorStore {
  private vectors: Map<MemoryId, { vector: number[]; metadata?: Record<string, unknown> }> = new Map();

  async addVectors(vectors: Array<{ id: MemoryId; vector: number[]; metadata?: Record<string, unknown> }>): Promise<void> {
    for (const { id, vector, metadata } of vectors) {
      this.vectors.set(id, { vector, metadata });
    }
  }

  async searchSimilar(
    query: number[],
    limit: number,
    filter?: Record<string, unknown>
  ): Promise<Array<{ id: MemoryId; score: number }>> {
    const results: Array<{ id: MemoryId; score: number }> = [];

    for (const [id, { vector }] of this.vectors.entries()) {
      const similarity = this.cosineSimilarity(query, vector);
      results.push({ id, score: similarity });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async updateVector(id: MemoryId, vector: number[]): Promise<void> {
    const existing = this.vectors.get(id);
    if (existing) {
      this.vectors.set(id, { ...existing, vector });
    }
  }

  async deleteVector(id: MemoryId): Promise<void> {
    this.vectors.delete(id);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

/**
 * Simple in-memory cache
 */
class SimpleCache implements MemoryCache {
  private cache: Map<MemoryId, { memory: BaseMemory; expires: number }> = new Map();
  private hits = 0;
  private misses = 0;

  async get<T extends BaseMemory>(id: MemoryId): Promise<T | null> {
    const cached = this.cache.get(id);
    if (cached && cached.expires > Date.now()) {
      this.hits++;
      return cached.memory as T;
    }
    this.misses++;
    return null;
  }

  async set<T extends BaseMemory>(id: MemoryId, memory: T, ttl: number = 3600000): Promise<void> {
    this.cache.set(id, {
      memory,
      expires: Date.now() + ttl
    });
  }

  async remove(id: MemoryId): Promise<void> {
    this.cache.delete(id);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  async stats(): Promise<{ hits: number; misses: number; size: number }> {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size
    };
  }
}

/**
 * Complete Memory System Implementation
 */
export class MemorySystemImpl implements MemorySystem {
  storage: MemoryStorage;
  vectorStore: VectorStore;
  cache: MemoryCache;

  constructor(
    storage?: MemoryStorage,
    vectorStore?: VectorStore,
    cache?: MemoryCache
  ) {
    this.storage = storage || new InMemoryStorage();
    this.vectorStore = vectorStore || new SimpleVectorStore();
    this.cache = cache || new SimpleCache();
  }

  async createEpisodicMemory(content: Partial<EpisodicMemory>): Promise<EpisodicMemory> {
    const base = createBaseMemory(
      MemoryType.EPISODIC,
      content.source?.surface || ClaudeSurface.API,
      content.source?.userId || 'unknown',
      content.source?.sessionId || generateMemoryId()
    );

    const memory: EpisodicMemory = {
      ...base,
      ...content,
      type: MemoryType.EPISODIC
    } as EpisodicMemory;

    // Update content hash
    memory.sync.contentHash = hashContent(memory.content);

    await this.storage.store(memory);
    await this.cache.set(memory.id, memory);

    return memory;
  }

  async createSemanticMemory(content: Partial<SemanticMemory>): Promise<SemanticMemory> {
    const base = createBaseMemory(
      MemoryType.SEMANTIC,
      content.source?.surface || ClaudeSurface.API,
      content.source?.userId || 'unknown',
      content.source?.sessionId || generateMemoryId()
    );

    const memory: SemanticMemory = {
      ...base,
      ...content,
      type: MemoryType.SEMANTIC,
      confidence: content.confidence || ConfidenceLevel.MEDIUM,
      knowledgeType: content.knowledgeType || KnowledgeType.FACT,
      evidence: content.evidence || [],
      contradictions: content.contradictions || [],
      isPreference: content.isPreference || false,
      domain: content.domain || 'general'
    } as SemanticMemory;

    memory.sync.contentHash = hashContent(memory.content);

    await this.storage.store(memory);
    await this.cache.set(memory.id, memory);

    return memory;
  }

  async createProceduralMemory(content: Partial<ProceduralMemory>): Promise<ProceduralMemory> {
    const base = createBaseMemory(
      MemoryType.PROCEDURAL,
      content.source?.surface || ClaudeSurface.API,
      content.source?.userId || 'unknown',
      content.source?.sessionId || generateMemoryId()
    );

    const memory: ProceduralMemory = {
      ...base,
      ...content,
      type: MemoryType.PROCEDURAL,
      steps: content.steps || [],
      applicabilityConditions: content.applicabilityConditions || [],
      prerequisites: content.prerequisites || [],
      expectedOutcomes: content.expectedOutcomes || [],
      successRate: content.successRate || 0,
      executionCount: content.executionCount || 0,
      variations: content.variations || [],
      failureModes: content.failureModes || []
    } as ProceduralMemory;

    memory.sync.contentHash = hashContent(memory.content);

    await this.storage.store(memory);
    await this.cache.set(memory.id, memory);

    return memory;
  }

  async createWorkingMemory(content: Partial<WorkingMemory>): Promise<WorkingMemory> {
    const base = createBaseMemory(
      MemoryType.WORKING,
      content.source?.surface || ClaudeSurface.API,
      content.source?.userId || 'unknown',
      content.source?.sessionId || generateMemoryId(),
      0.9 // Working memory starts with high importance
    );

    const memory: WorkingMemory = {
      ...base,
      ...content,
      type: MemoryType.WORKING,
      attentionFocus: content.attentionFocus || {
        primary: '',
        secondary: [],
        trigger: '',
        duration: 0,
        importance: 0.5
      },
      activeGoals: content.activeGoals || [],
      contextStack: content.contextStack || [],
      recentlyActivated: content.recentlyActivated || [],
      pendingTasks: content.pendingTasks || [],
      sessionState: content.sessionState || {
        sessionId: base.source!.sessionId,
        startedAt: now(),
        lastActivityAt: now(),
        turnCount: 0,
        engagementLevel: 'medium',
        phase: 'exploration'
      },
      ttl: content.ttl || 3600000, // 1 hour default
      consolidationCandidate: false
    } as WorkingMemory;

    memory.sync.contentHash = hashContent(memory.content);

    await this.storage.store(memory);
    await this.cache.set(memory.id, memory, memory.ttl);

    return memory;
  }

  async recall(query: MemoryQuery): Promise<MemoryQueryResult[]> {
    // If we have a query embedding, use vector search
    if (query.queryEmbedding) {
      const vectorResults = await this.vectorStore.searchSimilar(
        query.queryEmbedding,
        query.limit || 10
      );

      const memories = await this.storage.batchRetrieve(
        vectorResults.map(r => r.id)
      );

      return memories
        .filter((m): m is BaseMemory => m !== null)
        .map((memory, idx) => ({
          memory,
          score: vectorResults[idx].score,
          retrievalReason: 'semantic similarity',
          relevanceFactors: {
            semantic: vectorResults[idx].score,
            temporal: this.calculateTemporalRelevance(memory),
            importance: memory.importance.importance,
            relational: 0.5
          }
        }));
    }

    // Otherwise, use structured query
    return this.storage.query(query);
  }

  async updateMemoryMetadata(id: MemoryId, metadata: Partial<BaseMemory>): Promise<void> {
    const memory = await this.storage.retrieve(id);
    if (!memory) {
      throw new Error(`Memory ${id} not found`);
    }

    // Update access metadata
    const currentTime = now();
    const updatedMetadata = {
      ...metadata,
      temporal: {
        ...memory.temporal,
        ...metadata.temporal,
        lastAccessedAt: currentTime,
        accessCount: memory.temporal.accessCount + 1,
        accessHistory: [...memory.temporal.accessHistory, currentTime]
      },
      sync: {
        ...memory.sync,
        version: memory.sync.version + 1,
        lastSyncedAt: currentTime
      }
    };

    await this.storage.update(id, updatedMetadata);
    await this.cache.remove(id); // Invalidate cache
  }

  async consolidate(
    memoryIds: MemoryId[],
    strategy: MemoryConsolidation['strategy']
  ): Promise<MemoryConsolidation> {
    const memories = await this.storage.batchRetrieve(memoryIds);
    const validMemories = memories.filter((m): m is BaseMemory => m !== null);

    if (validMemories.length === 0) {
      throw new Error('No valid memories to consolidate');
    }

    // Create consolidated memory based on strategy
    let consolidated: BaseMemory;

    switch (strategy) {
      case 'merge':
        consolidated = await this.mergeMemories(validMemories);
        break;
      case 'summarize':
        consolidated = await this.summarizeMemories(validMemories);
        break;
      case 'abstract':
        consolidated = await this.abstractMemories(validMemories);
        break;
      case 'pattern_extract':
        consolidated = await this.extractPattern(validMemories);
        break;
      default:
        throw new Error(`Unknown consolidation strategy: ${strategy}`);
    }

    await this.storage.store(consolidated);

    // Archive source memories
    for (const memory of validMemories) {
      await this.storage.update(memory.id, {
        status: MemoryStatus.ARCHIVED,
        metadata: {
          ...memory.metadata,
          consolidatedInto: consolidated.id
        }
      } as Partial<BaseMemory>);
    }

    return {
      sourceMemoryIds: memoryIds,
      consolidatedMemoryId: consolidated.id,
      strategy,
      consolidatedAt: now(),
      preservationScore: 0.85 // Simplified
    };
  }

  async applyDecay(): Promise<DecayCalculation[]> {
    const allMemories = await this.storage.query({});
    const calculations: DecayCalculation[] = [];
    const currentTime = Date.now();

    for (const { memory } of allMemories) {
      if (memory.importance.protectedFromDecay) {
        continue;
      }

      const timeSinceAccess = currentTime - new Date(memory.temporal.lastAccessedAt).getTime();
      const decay = applyDecay(
        memory.importance.importance,
        memory.importance.decayRate,
        timeSinceAccess
      );

      calculations.push(decay);

      // Update memory importance
      await this.storage.update(memory.id, {
        importance: {
          ...memory.importance,
          importance: decay.newImportance
        },
        status: decay.shouldArchive ? MemoryStatus.ARCHIVED : memory.status
      } as Partial<BaseMemory>);
    }

    return calculations;
  }

  async detectConflicts(): Promise<MemoryConflict[]> {
    // Simplified conflict detection
    // In production, use semantic similarity + contradiction detection
    return [];
  }

  async resolveConflict(conflictId: string, strategy?: MemoryConflict['resolutionStrategy']): Promise<void> {
    // Implementation for conflict resolution
    throw new Error('Not implemented');
  }

  async sync(surface: ClaudeSurface): Promise<{ synced: number; conflicts: number }> {
    // Implementation for cross-surface sync
    return { synced: 0, conflicts: 0 };
  }

  async archive(criteria: MemoryQuery): Promise<MemoryId[]> {
    const results = await this.storage.query(criteria);
    const archived: MemoryId[] = [];

    for (const { memory } of results) {
      await this.storage.update(memory.id, {
        status: MemoryStatus.ARCHIVED
      } as Partial<BaseMemory>);
      archived.push(memory.id);
    }

    return archived;
  }

  async getStats(): Promise<MemorySystemStats> {
    const allMemories = await this.storage.query({});
    const cacheStats = await this.cache.stats();

    const counts: Record<MemoryType, number> = {
      [MemoryType.EPISODIC]: 0,
      [MemoryType.SEMANTIC]: 0,
      [MemoryType.PROCEDURAL]: 0,
      [MemoryType.WORKING]: 0
    };

    const importanceSums: Record<MemoryType, number> = {
      [MemoryType.EPISODIC]: 0,
      [MemoryType.SEMANTIC]: 0,
      [MemoryType.PROCEDURAL]: 0,
      [MemoryType.WORKING]: 0
    };

    for (const { memory } of allMemories) {
      counts[memory.type]++;
      importanceSums[memory.type] += memory.importance.importance;
    }

    const averageImportance: Record<MemoryType, number> = {
      [MemoryType.EPISODIC]: importanceSums[MemoryType.EPISODIC] / (counts[MemoryType.EPISODIC] || 1),
      [MemoryType.SEMANTIC]: importanceSums[MemoryType.SEMANTIC] / (counts[MemoryType.SEMANTIC] || 1),
      [MemoryType.PROCEDURAL]: importanceSums[MemoryType.PROCEDURAL] / (counts[MemoryType.PROCEDURAL] || 1),
      [MemoryType.WORKING]: importanceSums[MemoryType.WORKING] / (counts[MemoryType.WORKING] || 1)
    };

    return {
      counts,
      storageUsed: 0, // Would calculate actual size
      averageImportance,
      recentCreations: 0,
      recentAccesses: 0,
      pendingConsolidation: 0,
      conflicts: 0,
      cacheHitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses),
      lastSync: {
        [ClaudeSurface.WEB]: now(),
        [ClaudeSurface.SLACK]: now(),
        [ClaudeSurface.API]: now(),
        [ClaudeSurface.MOBILE]: now(),
        [ClaudeSurface.DESKTOP]: now(),
        [ClaudeSurface.TERMINAL]: now()
      }
    };
  }

  // Private helper methods

  private calculateTemporalRelevance(memory: BaseMemory): number {
    const hoursSinceCreation = (Date.now() - new Date(memory.temporal.createdAt).getTime()) / (1000 * 60 * 60);
    return Math.exp(-hoursSinceCreation / 168); // Decay over one week
  }

  private async mergeMemories(memories: BaseMemory[]): Promise<BaseMemory> {
    // Simplified merge - take first memory and add relations
    const primary = memories[0];
    return {
      ...primary,
      id: generateMemoryId(),
      relations: memories.slice(1).map(m => ({
        type: 'CONSOLIDATED_INTO' as any,
        targetMemoryId: m.id,
        targetMemoryType: m.type,
        strength: 1.0,
        establishedAt: now()
      }))
    };
  }

  private async summarizeMemories(memories: BaseMemory[]): Promise<BaseMemory> {
    // In production, use LLM to generate summary
    return this.mergeMemories(memories);
  }

  private async abstractMemories(memories: BaseMemory[]): Promise<BaseMemory> {
    // In production, extract abstract patterns
    return this.mergeMemories(memories);
  }

  private async extractPattern(memories: BaseMemory[]): Promise<ProceduralMemory> {
    // In production, analyze episodic memories to extract procedures
    const base = createBaseMemory(
      MemoryType.PROCEDURAL,
      memories[0].source.surface,
      memories[0].source.userId,
      memories[0].source.sessionId
    );

    return {
      ...base,
      type: MemoryType.PROCEDURAL,
      content: {
        name: 'Extracted pattern',
        purpose: 'Pattern extracted from repeated behaviors',
        description: 'Auto-generated procedural memory',
        whenToUse: 'When similar conditions arise'
      },
      steps: [],
      applicabilityConditions: [],
      prerequisites: [],
      expectedOutcomes: [],
      successRate: 0,
      executionCount: 0,
      variations: [],
      failureModes: []
    } as ProceduralMemory;
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Creating and using a memory system
 */
async function exampleUsage() {
  const memorySystem = new MemorySystemImpl();

  // Create an episodic memory
  const episode = await memorySystem.createEpisodicMemory({
    content: {
      title: 'TypeScript discussion',
      description: 'Discussed TypeScript best practices',
      summary: 'User wants to learn about TypeScript patterns',
      keyQuotes: ['I love type safety'],
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          content: 'How do I use generics in TypeScript?',
          timestamp: now(),
          importance: 0.8
        },
        {
          id: 'msg_2',
          role: 'assistant',
          content: 'Generics allow you to create reusable components...',
          timestamp: now(),
          importance: 0.7
        }
      ]
    },
    temporalStructure: {
      startTime: now(),
      endTime: now(),
      duration: 300000,
      temporalContext: {
        timeOfDay: 'afternoon',
        dayOfWeek: 'Monday',
        isWeekend: false
      }
    },
    participants: [
      { id: 'user_1', role: 'user', participationLevel: 0.5 },
      { id: 'assistant', role: 'assistant', participationLevel: 0.5 }
    ],
    emotionalContext: {
      valence: 0.8,
      arousal: 0.6,
      emotions: [{ emotion: 'curious', intensity: 0.9 }],
      sentiment: 'positive',
      userSatisfaction: 0.9
    },
    narrative: {
      beginning: 'User asked about generics',
      middle: 'Discussed use cases and examples',
      end: 'User understood the concept',
      turningPoints: [],
      themes: ['TypeScript', 'Generics', 'Type Safety'],
      problemSolutions: []
    },
    keyMoments: [],
    outcomes: []
  });

  console.log('Created episodic memory:', episode.id);

  // Extract semantic memory from episode
  const semantic = await memorySystem.createSemanticMemory({
    content: {
      subject: 'user_1',
      predicate: 'is_interested_in',
      object: 'TypeScript generics',
      statement: 'User is interested in learning TypeScript generics',
      qualifiers: ['high_interest']
    },
    knowledgeType: KnowledgeType.PREFERENCE,
    confidence: ConfidenceLevel.HIGH,
    evidence: [
      {
        type: 'episodic',
        sourceId: episode.id,
        description: 'User asked about generics in conversation',
        strength: 0.9,
        timestamp: now()
      }
    ],
    isPreference: true,
    domain: 'programming'
  });

  console.log('Created semantic memory:', semantic.id);

  // Recall memories
  const results = await memorySystem.recall({
    types: [MemoryType.EPISODIC, MemoryType.SEMANTIC],
    limit: 10,
    importance: {
      minImportance: 0.5
    }
  });

  console.log(`Found ${results.length} memories`);

  // Get stats
  const stats = await memorySystem.getStats();
  console.log('Memory system stats:', stats);
}

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

export {
  generateMemoryId,
  now,
  calculateImportance,
  calculateDecayRate,
  applyDecay,
  hashContent,
  createBaseMemory
};
