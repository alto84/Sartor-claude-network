"use strict";
/**
 * Memory Consolidation Algorithm Implementation
 *
 * Implements:
 * 1. Trigger conditions for consolidation
 * 2. Related memory identification (clustering)
 * 3. Merge strategies (summarization vs. linking)
 * 4. Compression and optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldTriggerConsolidation = shouldTriggerConsolidation;
exports.isScheduledConsolidationTime = isScheduledConsolidationTime;
exports.getTemporalProximityBonus = getTemporalProximityBonus;
exports.isSameConversation = isSameConversation;
exports.calculateMemoryDistance = calculateMemoryDistance;
exports.findRelatedMemories = findRelatedMemories;
exports.clusterMemories = clusterMemories;
exports.determineConsolidationStrategy = determineConsolidationStrategy;
exports.linkMemories = linkMemories;
exports.generateConsolidationPrompt = generateConsolidationPrompt;
exports.consolidateWithLLM = consolidateWithLLM;
exports.executeConsolidation = executeConsolidation;
exports.calculateCompressionRatio = calculateCompressionRatio;
const importance_scoring_1 = require("./importance-scoring");
// ============================================================================
// Configuration
// ============================================================================
const DEFAULT_CONSOLIDATION_CONFIG = {
    trigger_count: 10000, // Consolidate when memory count exceeds this
    similarity_threshold: 0.7, // Cosine similarity threshold for clustering
    temporal_proximity_hours: 1, // Memories within 1 hour are related
    compression_target: 0.5 // Target 50% reduction
};
// ============================================================================
// 1. Trigger Conditions
// ============================================================================
/**
 * Check if consolidation should be triggered
 *
 * @param memoryCount - Current number of active memories
 * @param storageUsagePercent - Current storage usage (0-100)
 * @param config - Consolidation configuration
 * @returns True if consolidation should run
 */
function shouldTriggerConsolidation(memoryCount, storageUsagePercent, config = DEFAULT_CONSOLIDATION_CONFIG) {
    // Trigger if memory count exceeds threshold
    if (memoryCount > config.trigger_count) {
        return true;
    }
    // Trigger if storage usage > 80%
    if (storageUsagePercent > 80) {
        return true;
    }
    return false;
}
/**
 * Check if it's time for scheduled consolidation
 *
 * @param lastConsolidation - Timestamp of last consolidation
 * @param scheduleHour - Hour of day to run (0-23, default: 2 AM)
 * @returns True if scheduled time has passed
 */
function isScheduledConsolidationTime(lastConsolidation, scheduleHour = 2) {
    const now = new Date();
    const hoursSinceLastRun = (now.getTime() - lastConsolidation.getTime()) / (1000 * 60 * 60);
    // Must be at least 20 hours since last run
    if (hoursSinceLastRun < 20) {
        return false;
    }
    // Check if current hour matches schedule
    return now.getHours() === scheduleHour;
}
// ============================================================================
// 2. Identifying Related Memories
// ============================================================================
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
function getTemporalProximityBonus(memoryA, memoryB, maxHours = 1) {
    const timeA = new Date(memoryA.created_at).getTime();
    const timeB = new Date(memoryB.created_at).getTime();
    const hoursDiff = Math.abs(timeA - timeB) / (1000 * 60 * 60);
    if (hoursDiff <= maxHours) {
        // Linear bonus: closer in time = larger bonus
        const bonus = (1 - hoursDiff / maxHours) * 0.1;
        return -bonus; // Negative because we subtract from distance
    }
    return 0;
}
/**
 * Check if memories are in the same conversation thread
 *
 * @param memoryA - First memory
 * @param memoryB - Second memory
 * @returns True if same conversation
 */
function isSameConversation(memoryA, memoryB) {
    if (!memoryA.conversation_id || !memoryB.conversation_id) {
        return false;
    }
    return memoryA.conversation_id === memoryB.conversation_id;
}
/**
 * Calculate semantic distance between two memories
 *
 * @param memoryA - First memory
 * @param memoryB - Second memory
 * @param config - Consolidation configuration
 * @returns Distance value (lower = more similar)
 */
function calculateMemoryDistance(memoryA, memoryB, config = DEFAULT_CONSOLIDATION_CONFIG) {
    if (!memoryA.embedding || !memoryB.embedding) {
        return 1.0; // Maximum distance if no embeddings
    }
    // Calculate cosine similarity
    const similarity = (0, importance_scoring_1.cosineSimilarity)(memoryA.embedding, memoryB.embedding);
    // Convert similarity [-1, 1] to distance [0, 2]
    let distance = 1 - similarity;
    // Apply temporal proximity bonus
    distance += getTemporalProximityBonus(memoryA, memoryB, config.temporal_proximity_hours);
    // Bonus if same conversation
    if (isSameConversation(memoryA, memoryB)) {
        distance -= 0.1;
    }
    // Clamp to [0, 2]
    return Math.max(0, Math.min(2, distance));
}
/**
 * Find related memories using similarity threshold
 *
 * @param targetMemory - Memory to find relations for
 * @param candidates - Pool of candidate memories
 * @param config - Consolidation configuration
 * @returns Array of related memories
 */
function findRelatedMemories(targetMemory, candidates, config = DEFAULT_CONSOLIDATION_CONFIG) {
    const related = [];
    for (const candidate of candidates) {
        if (candidate.id === targetMemory.id) {
            continue;
        }
        const distance = calculateMemoryDistance(targetMemory, candidate, config);
        const similarity = 1 - distance; // Convert back to similarity
        if (similarity >= config.similarity_threshold) {
            related.push(candidate);
        }
    }
    return related;
}
/**
 * Cluster memories using hierarchical clustering
 *
 * @param memories - Memories to cluster
 * @param config - Consolidation configuration
 * @returns Array of memory clusters
 */
function clusterMemories(memories, config = DEFAULT_CONSOLIDATION_CONFIG) {
    const clusters = [];
    const processed = new Set();
    // Simple agglomerative clustering
    for (const memory of memories) {
        if (processed.has(memory.id)) {
            continue;
        }
        // Find all related memories
        const related = findRelatedMemories(memory, memories, config);
        if (related.length === 0) {
            // Singleton cluster
            processed.add(memory.id);
            continue;
        }
        // Create cluster
        const clusterMemories = [memory, ...related];
        clusterMemories.forEach(m => processed.add(m.id));
        // Calculate centroid (average embedding)
        const centroid = calculateCentroid(clusterMemories);
        // Calculate average similarity
        const avgSimilarity = calculateAverageSimilarity(clusterMemories);
        // Get time span
        const timestamps = clusterMemories.map(m => new Date(m.created_at).getTime());
        const timeSpan = {
            start: new Date(Math.min(...timestamps)),
            end: new Date(Math.max(...timestamps))
        };
        clusters.push({
            id: `cluster_${clusters.length}`,
            memories: clusterMemories,
            centroid,
            similarity_score: avgSimilarity,
            time_span: timeSpan
        });
    }
    return clusters;
}
/**
 * Calculate centroid (average embedding) for a cluster
 */
function calculateCentroid(memories) {
    const validEmbeddings = memories
        .map(m => m.embedding)
        .filter((e) => e !== undefined);
    if (validEmbeddings.length === 0) {
        return undefined;
    }
    const dimensions = validEmbeddings[0].length;
    const centroid = new Array(dimensions).fill(0);
    for (const embedding of validEmbeddings) {
        for (let i = 0; i < dimensions; i++) {
            centroid[i] += embedding[i];
        }
    }
    for (let i = 0; i < dimensions; i++) {
        centroid[i] /= validEmbeddings.length;
    }
    return centroid;
}
/**
 * Calculate average pairwise similarity in a cluster
 */
function calculateAverageSimilarity(memories) {
    if (memories.length < 2) {
        return 1.0;
    }
    let totalSimilarity = 0;
    let pairCount = 0;
    for (let i = 0; i < memories.length; i++) {
        for (let j = i + 1; j < memories.length; j++) {
            if (memories[i].embedding && memories[j].embedding) {
                const similarity = (0, importance_scoring_1.cosineSimilarity)(memories[i].embedding, memories[j].embedding);
                totalSimilarity += similarity;
                pairCount++;
            }
        }
    }
    return pairCount > 0 ? totalSimilarity / pairCount : 1.0;
}
// ============================================================================
// 3. Merge Strategy Decision
// ============================================================================
/**
 * Determine the best consolidation strategy for a cluster
 *
 * @param cluster - Memory cluster to consolidate
 * @returns Consolidation strategy
 */
function determineConsolidationStrategy(cluster) {
    const size = cluster.memories.length;
    // Singleton - no consolidation needed
    if (size === 1) {
        return {
            action: 'skip',
            cluster,
            reason: 'Single memory, no consolidation needed'
        };
    }
    // Small cluster (2-3 memories) - link them
    if (size <= 3) {
        return {
            action: 'link',
            cluster,
            reason: 'Small cluster, preserve all memories with links'
        };
    }
    // Check importance distribution
    const importanceScores = cluster.memories.map(m => m.importance_score);
    const avgImportance = importanceScores.reduce((a, b) => a + b, 0) / size;
    const highImportance = importanceScores.filter(s => s > 0.6);
    // All low importance - summarize everything
    if (avgImportance < 0.4) {
        return {
            action: 'summarize',
            cluster,
            reason: 'Low average importance, safe to summarize all'
        };
    }
    // Mixed importance - keep high, summarize low
    if (highImportance.length > 0 && highImportance.length < size) {
        return {
            action: 'keep_and_summarize',
            cluster,
            reason: 'Mixed importance, keep important memories and summarize others'
        };
    }
    // Check if temporal sequence
    const isSequence = isTemporalSequence(cluster);
    if (isSequence) {
        return {
            action: 'summarize',
            cluster,
            reason: 'Temporal sequence detected, create narrative summary'
        };
    }
    // Default: summarize
    return {
        action: 'summarize',
        cluster,
        reason: 'Large cluster with similar content'
    };
}
/**
 * Check if cluster represents a temporal sequence of events
 */
function isTemporalSequence(cluster) {
    const memories = cluster.memories;
    // Need at least 3 memories for a sequence
    if (memories.length < 3) {
        return false;
    }
    // Check if time gaps are relatively consistent
    const sortedByTime = [...memories].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const gaps = [];
    for (let i = 1; i < sortedByTime.length; i++) {
        const gap = new Date(sortedByTime[i].created_at).getTime() -
            new Date(sortedByTime[i - 1].created_at).getTime();
        gaps.push(gap);
    }
    // Calculate coefficient of variation for gaps
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgGap;
    // If CV < 0.5, gaps are relatively consistent - likely a sequence
    return cv < 0.5;
}
// ============================================================================
// 4. Consolidation Execution
// ============================================================================
/**
 * Link memories together without summarization
 *
 * @param cluster - Cluster to link
 * @returns Updated memories
 */
function linkMemories(cluster) {
    const memoryIds = cluster.memories.map(m => m.id);
    // Add bidirectional links
    for (const memory of cluster.memories) {
        const otherIds = memoryIds.filter(id => id !== memory.id);
        memory.links = [...new Set([...memory.links, ...otherIds])];
    }
    return cluster.memories;
}
/**
 * Generate LLM prompt for memory consolidation
 */
function generateConsolidationPrompt(memories, strategy) {
    const memoryTexts = memories.map((m, idx) => {
        const date = new Date(m.created_at).toISOString();
        return `[${idx + 1}] (${date})\n${m.content}`;
    }).join('\n\n');
    if (strategy === 'narrative') {
        return `Consolidate these related memories into a cohesive narrative summary:

${memoryTexts}

Create a summary that:
1. Presents events in chronological order
2. Shows progression and connections between memories
3. Preserves important details and context
4. Is 30-50% of the original length
5. Maintains the perspective and tone of the original memories

Respond with JSON:
{
  "summary": "The consolidated narrative...",
  "key_points": ["point1", "point2", ...],
  "time_span": "Description of time period covered"
}`;
    }
    else {
        return `Consolidate these related memories into a concise summary:

${memoryTexts}

Create a summary that:
1. Captures key information from all memories
2. Preserves important details and context
3. Removes redundancy and repetition
4. Is 30-50% of the original length

Respond with JSON:
{
  "summary": "The consolidated summary...",
  "key_points": ["point1", "point2", ...]
}`;
    }
}
/**
 * Mock LLM consolidation (replace with actual LLM call)
 */
async function consolidateWithLLM(request) {
    // TODO: Replace with actual LLM API call
    const prompt = generateConsolidationPrompt(request.memories, request.strategy === 'summarize' ? 'summarize' : 'narrative');
    // Mock response
    const summary = request.memories.map(m => m.content).join(' ');
    const consolidated = {
        summary: `Consolidated: ${summary.substring(0, 200)}...`,
        key_points: ['Point 1', 'Point 2'],
        original_ids: request.memories.map(m => m.id),
        time_span: 'Recent',
        importance_score: Math.max(...request.memories.map(m => m.importance_score))
    };
    return {
        consolidated,
        tokens_used: 500
    };
}
/**
 * Execute consolidation strategy on a cluster
 *
 * @param strategy - Consolidation strategy to execute
 * @returns Consolidated memory or linked memories
 */
async function executeConsolidation(strategy) {
    switch (strategy.action) {
        case 'skip':
            return strategy.cluster.memories;
        case 'link':
            return linkMemories(strategy.cluster);
        case 'summarize': {
            const response = await consolidateWithLLM({
                memories: strategy.cluster.memories,
                strategy: 'summarize'
            });
            // Create new consolidated memory
            const consolidated = createConsolidatedMemory(response.consolidated, strategy.cluster);
            return consolidated;
        }
        case 'keep_and_summarize': {
            // Keep high-importance memories
            const toKeep = strategy.cluster.memories.filter(m => m.importance_score > 0.6);
            const toSummarize = strategy.cluster.memories.filter(m => m.importance_score <= 0.6);
            if (toSummarize.length > 0) {
                const response = await consolidateWithLLM({
                    memories: toSummarize,
                    strategy: 'summarize'
                });
                const summary = createConsolidatedMemory(response.consolidated, { ...strategy.cluster, memories: toSummarize });
                return [...toKeep, summary];
            }
            return toKeep;
        }
        default:
            return strategy.cluster.memories;
    }
}
/**
 * Create a new consolidated memory from summarization result
 */
function createConsolidatedMemory(consolidated, cluster) {
    const now = new Date();
    return {
        id: `consolidated_${Date.now()}`,
        content: consolidated.summary,
        type: cluster.memories[0].type,
        status: cluster.memories[0].status,
        created_at: cluster.time_span.start,
        updated_at: now,
        last_accessed: now,
        access_count: 0,
        strength: 0.8, // Start with good strength
        importance_score: consolidated.importance_score,
        embedding: cluster.centroid,
        embedding_model: cluster.memories[0].embedding_model,
        tags: [...new Set(cluster.memories.flatMap(m => m.tags)), 'consolidated'],
        conversation_id: cluster.memories[0].conversation_id,
        user_id: cluster.memories[0].user_id,
        links: [],
        consolidated_from: consolidated.original_ids
    };
}
/**
 * Calculate compression ratio achieved
 */
function calculateCompressionRatio(originalMemories, consolidatedMemories) {
    const originalSize = originalMemories.reduce((sum, m) => sum + m.content.length, 0);
    const consolidatedSize = consolidatedMemories.reduce((sum, m) => sum + m.content.length, 0);
    if (originalSize === 0) {
        return 0;
    }
    return 1 - (consolidatedSize / originalSize);
}
// ============================================================================
// Pseudocode for Consolidation Algorithm
// ============================================================================
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
//# sourceMappingURL=consolidation.js.map