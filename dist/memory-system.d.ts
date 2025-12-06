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
import { Memory, MemoryType, MemorySystemConfig, MemoryQuery, MemorySearchResult, MemoryStats } from './types';
export declare const DEFAULT_CONFIG: MemorySystemConfig;
export declare class MemorySystem {
    private config;
    private memories;
    private lastConsolidation;
    private lastMaintenance;
    constructor(config?: Partial<MemorySystemConfig>);
    /**
     * Create a new memory
     */
    createMemory(content: string, type?: MemoryType, metadata?: Partial<Memory>): Promise<Memory>;
    /**
     * Retrieve a memory by ID
     */
    getMemory(id: string, recordAccess?: boolean): Promise<Memory | null>;
    /**
     * Update a memory
     */
    updateMemory(id: string, updates: Partial<Memory>): Promise<Memory | null>;
    /**
     * Delete a memory
     */
    deleteMemory(id: string): boolean;
    /**
     * Search memories by query
     */
    searchMemories(query: MemoryQuery): Promise<MemorySearchResult[]>;
    /**
     * Get context-relevant memories
     */
    getRelevantMemories(contextEmbedding: number[], limit?: number): Promise<Memory[]>;
    /**
     * Run daily maintenance tasks
     */
    runDailyMaintenance(): Promise<{
        decay_updated: number;
        reviews_processed: number;
        consolidations: number;
        deletions: number;
    }>;
    /**
     * Run consolidation process
     */
    runConsolidation(): Promise<{
        clusters_found: number;
        clusters_consolidated: number;
        compression_ratio: number;
    }>;
    /**
     * Get memory system statistics
     */
    getStats(): MemoryStats;
    /**
     * Calculate storage usage percentage
     */
    private calculateStorageUsage;
    /**
     * Estimate memory size in bytes
     */
    private estimateMemorySize;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Export all memories
     */
    exportMemories(): Memory[];
    /**
     * Import memories
     */
    importMemories(memories: Memory[]): void;
    /**
     * Get configuration
     */
    getConfig(): MemorySystemConfig;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<MemorySystemConfig>): void;
}
/**
 * Create a new memory system with default configuration
 */
export declare function createMemorySystem(config?: Partial<MemorySystemConfig>): MemorySystem;
/**
 * Create a memory system optimized for a specific use case
 */
export declare function createOptimizedMemorySystem(useCase: 'conversational' | 'knowledge_base' | 'event_tracking'): MemorySystem;
//# sourceMappingURL=memory-system.d.ts.map