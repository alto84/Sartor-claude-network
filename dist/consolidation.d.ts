/**
 * Memory Consolidation Algorithm Implementation
 *
 * Implements:
 * 1. Trigger conditions for consolidation
 * 2. Related memory identification (clustering)
 * 3. Merge strategies (summarization vs. linking)
 * 4. Compression and optimization
 */
import { Memory, MemoryCluster, ConsolidationConfig, ConsolidationStrategy, LLMConsolidationRequest, LLMConsolidationResponse } from './types';
/**
 * Check if consolidation should be triggered
 *
 * @param memoryCount - Current number of active memories
 * @param storageUsagePercent - Current storage usage (0-100)
 * @param config - Consolidation configuration
 * @returns True if consolidation should run
 */
export declare function shouldTriggerConsolidation(memoryCount: number, storageUsagePercent: number, config?: ConsolidationConfig): boolean;
/**
 * Check if it's time for scheduled consolidation
 *
 * @param lastConsolidation - Timestamp of last consolidation
 * @param scheduleHour - Hour of day to run (0-23, default: 2 AM)
 * @returns True if scheduled time has passed
 */
export declare function isScheduledConsolidationTime(lastConsolidation: Date, scheduleHour?: number): boolean;
/**
 * Calculate temporal proximity bonus
 *
 * Memories close in time are more likely to be related
 *
 * @param memoryA - First memory
 * @param memoryB - Second memory
 * @param maxHours - Maximum hours apart to get bonus
 * @returns Bonus value (negative distance adjustment)
 */
export declare function getTemporalProximityBonus(memoryA: Memory, memoryB: Memory, maxHours?: number): number;
/**
 * Check if memories are in the same conversation thread
 *
 * @param memoryA - First memory
 * @param memoryB - Second memory
 * @returns True if same conversation
 */
export declare function isSameConversation(memoryA: Memory, memoryB: Memory): boolean;
/**
 * Calculate semantic distance between two memories
 *
 * @param memoryA - First memory
 * @param memoryB - Second memory
 * @param config - Consolidation configuration
 * @returns Distance value (lower = more similar)
 */
export declare function calculateMemoryDistance(memoryA: Memory, memoryB: Memory, config?: ConsolidationConfig): number;
/**
 * Find related memories using similarity threshold
 *
 * @param targetMemory - Memory to find relations for
 * @param candidates - Pool of candidate memories
 * @param config - Consolidation configuration
 * @returns Array of related memories
 */
export declare function findRelatedMemories(targetMemory: Memory, candidates: Memory[], config?: ConsolidationConfig): Memory[];
/**
 * Cluster memories using hierarchical clustering
 *
 * @param memories - Memories to cluster
 * @param config - Consolidation configuration
 * @returns Array of memory clusters
 */
export declare function clusterMemories(memories: Memory[], config?: ConsolidationConfig): MemoryCluster[];
/**
 * Determine the best consolidation strategy for a cluster
 *
 * @param cluster - Memory cluster to consolidate
 * @returns Consolidation strategy
 */
export declare function determineConsolidationStrategy(cluster: MemoryCluster): ConsolidationStrategy;
/**
 * Link memories together without summarization
 *
 * @param cluster - Cluster to link
 * @returns Updated memories
 */
export declare function linkMemories(cluster: MemoryCluster): Memory[];
/**
 * Generate LLM prompt for memory consolidation
 */
export declare function generateConsolidationPrompt(memories: Memory[], strategy: 'summarize' | 'narrative'): string;
/**
 * Mock LLM consolidation (replace with actual LLM call)
 */
export declare function consolidateWithLLM(request: LLMConsolidationRequest): Promise<LLMConsolidationResponse>;
/**
 * Execute consolidation strategy on a cluster
 *
 * @param strategy - Consolidation strategy to execute
 * @returns Consolidated memory or linked memories
 */
export declare function executeConsolidation(strategy: ConsolidationStrategy): Promise<Memory | Memory[]>;
/**
 * Calculate compression ratio achieved
 */
export declare function calculateCompressionRatio(originalMemories: Memory[], consolidatedMemories: Memory[]): number;
/**
 * PSEUDOCODE: Memory Consolidation Process
 *
 * FUNCTION consolidate_memories(all_memories, config):
 *   // 1. Check if consolidation should run
 *   IF NOT should_trigger_consolidation(all_memories.length, storage_usage, config):
 *     RETURN
 *
 *   // 2. Filter candidates (exclude protected memories)
 *   candidates = FILTER memories WHERE:
 *     status == ACTIVE AND
 *     NOT is_protected(memory) AND
 *     age > 7 days
 *
 *   // 3. Cluster similar memories
 *   clusters = cluster_memories(candidates, config)
 *
 *   // 4. Process each cluster
 *   consolidated_count = 0
 *   FOR EACH cluster IN clusters:
 *     // Determine strategy
 *     strategy = determine_consolidation_strategy(cluster)
 *
 *     // Execute consolidation
 *     MATCH strategy.action:
 *       CASE 'skip':
 *         CONTINUE
 *
 *       CASE 'link':
 *         link_memories(cluster)
 *
 *       CASE 'summarize':
 *         summary = consolidate_with_llm(cluster.memories, 'summarize')
 *         new_memory = create_consolidated_memory(summary, cluster)
 *         save(new_memory)
 *         archive(cluster.memories)
 *         consolidated_count++
 *
 *       CASE 'keep_and_summarize':
 *         high_importance = FILTER cluster.memories WHERE importance > 0.6
 *         low_importance = FILTER cluster.memories WHERE importance <= 0.6
 *
 *         IF low_importance.length > 0:
 *           summary = consolidate_with_llm(low_importance, 'summarize')
 *           new_memory = create_consolidated_memory(summary, low_importance)
 *           save(new_memory)
 *           archive(low_importance)
 *           consolidated_count++
 *   END FOR
 *
 *   // 5. Report results
 *   compression_ratio = calculate_compression_ratio(candidates, all_memories)
 *   LOG("Consolidated {consolidated_count} clusters, {compression_ratio}% reduction")
 * END FUNCTION
 */
//# sourceMappingURL=consolidation.d.ts.map