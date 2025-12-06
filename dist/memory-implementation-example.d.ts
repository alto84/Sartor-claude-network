/**
 * Memory System Implementation Examples
 *
 * This file demonstrates how to implement the memory schema interfaces
 * in a real MCP server environment.
 */
import { MemorySystem, MemoryStorage, VectorStore, MemoryCache, BaseMemory, EpisodicMemory, SemanticMemory, ProceduralMemory, WorkingMemory, MemoryQuery, MemoryQueryResult, MemoryType, ClaudeSurface, ImportanceScore, DecayRate, MemoryId, Timestamp, MemoryConsolidation, DecayCalculation, MemoryConflict, MemorySystemStats } from './memory-schema';
/**
 * Generate a unique memory ID
 */
declare function generateMemoryId(): MemoryId;
/**
 * Get current ISO timestamp
 */
declare function now(): Timestamp;
/**
 * Calculate importance from various factors
 */
declare function calculateImportance(factors: {
    recency: number;
    frequency: number;
    userExplicit: number;
    emotional: number;
    novelty: number;
}): ImportanceScore;
/**
 * Calculate decay rate based on memory characteristics
 */
declare function calculateDecayRate(memory: BaseMemory): DecayRate;
/**
 * Apply exponential decay to importance score
 */
declare function applyDecay(currentImportance: number, decayRate: DecayRate, timeSinceAccessMs: number): DecayCalculation;
/**
 * Hash content for sync conflict detection
 */
declare function hashContent(content: unknown): string;
/**
 * Create base memory metadata
 */
declare function createBaseMemory(type: MemoryType, surface: ClaudeSurface, userId: string, sessionId: string, initialImportance?: ImportanceScore): Partial<BaseMemory>;
/**
 * Complete Memory System Implementation
 */
export declare class MemorySystemImpl implements MemorySystem {
    storage: MemoryStorage;
    vectorStore: VectorStore;
    cache: MemoryCache;
    constructor(storage?: MemoryStorage, vectorStore?: VectorStore, cache?: MemoryCache);
    createEpisodicMemory(content: Partial<EpisodicMemory>): Promise<EpisodicMemory>;
    createSemanticMemory(content: Partial<SemanticMemory>): Promise<SemanticMemory>;
    createProceduralMemory(content: Partial<ProceduralMemory>): Promise<ProceduralMemory>;
    createWorkingMemory(content: Partial<WorkingMemory>): Promise<WorkingMemory>;
    recall(query: MemoryQuery): Promise<MemoryQueryResult[]>;
    updateMemoryMetadata(id: MemoryId, metadata: Partial<BaseMemory>): Promise<void>;
    consolidate(memoryIds: MemoryId[], strategy: MemoryConsolidation['strategy']): Promise<MemoryConsolidation>;
    applyDecay(): Promise<DecayCalculation[]>;
    detectConflicts(): Promise<MemoryConflict[]>;
    resolveConflict(conflictId: string, strategy?: MemoryConflict['resolutionStrategy']): Promise<void>;
    sync(surface: ClaudeSurface): Promise<{
        synced: number;
        conflicts: number;
    }>;
    archive(criteria: MemoryQuery): Promise<MemoryId[]>;
    getStats(): Promise<MemorySystemStats>;
    private calculateTemporalRelevance;
    private mergeMemories;
    private summarizeMemories;
    private abstractMemories;
    private extractPattern;
}
export { generateMemoryId, now, calculateImportance, calculateDecayRate, applyDecay, hashContent, createBaseMemory };
//# sourceMappingURL=memory-implementation-example.d.ts.map