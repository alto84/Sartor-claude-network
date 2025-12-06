/**
 * Spaced Repetition for AI Implementation
 *
 * Based on SuperMemo SM-2 algorithm, adapted for AI memory systems
 *
 * Implements:
 * 1. Optimal review interval calculation
 * 2. Memory surfacing and prioritization
 * 3. Active recall testing
 * 4. Review queue management
 */
import { Memory, SpacedRepetitionConfig, ReviewSchedule, ReviewQueue } from './types';
/**
 * Calculate easiness factor based on memory importance
 *
 * Higher importance = easier to remember = longer intervals
 *
 * Formula: 1.3 + (importance * 1.7)
 * Range: [1.3, 3.0]
 *
 * @param importance - Memory importance score [0, 1]
 * @param config - Spaced repetition configuration
 * @returns Easiness factor
 */
export declare function calculateEasinessFactor(importance: number, config?: SpacedRepetitionConfig): number;
/**
 * Calculate next review interval based on SuperMemo SM-2 algorithm
 *
 * @param reviewCount - Number of previous reviews (0-based)
 * @param easinessFactor - Easiness factor [1.3, 3.0]
 * @param config - Spaced repetition configuration
 * @returns Interval in days
 */
export declare function calculateReviewInterval(reviewCount: number, easinessFactor: number, config?: SpacedRepetitionConfig): number;
/**
 * Calculate next review date
 *
 * @param memory - Memory to schedule
 * @param config - Spaced repetition configuration
 * @returns Next review date
 */
export declare function calculateNextReviewDate(memory: Memory, config?: SpacedRepetitionConfig): Date;
/**
 * Create or update review schedule for a memory
 *
 * @param memory - Memory to schedule
 * @param config - Spaced repetition configuration
 * @returns Review schedule
 */
export declare function createReviewSchedule(memory: Memory, config?: SpacedRepetitionConfig): ReviewSchedule;
/**
 * Update review schedule after a review
 *
 * @param schedule - Current review schedule
 * @param wasSuccessful - Whether review was successful
 * @param config - Spaced repetition configuration
 * @returns Updated schedule
 */
export declare function updateReviewSchedule(schedule: ReviewSchedule, wasSuccessful: boolean, config?: SpacedRepetitionConfig): ReviewSchedule;
/**
 * Get interval progression for a memory
 *
 * Useful for visualization and debugging
 *
 * @param importance - Memory importance
 * @param maxReviews - Maximum reviews to calculate
 * @param config - Spaced repetition configuration
 * @returns Array of intervals
 */
export declare function getIntervalProgression(importance: number, maxReviews?: number, config?: SpacedRepetitionConfig): number[];
/**
 * Calculate priority score for a memory in review queue
 *
 * Combines:
 * - How overdue the review is
 * - Memory importance
 * - Memory strength (weaker = higher priority)
 *
 * @param memory - Memory to score
 * @param reviewSchedule - Review schedule for memory
 * @returns Priority score (higher = more urgent)
 */
export declare function calculateReviewPriority(memory: Memory, reviewSchedule: ReviewSchedule): number;
/**
 * Build review queue from memories
 *
 * @param memories - All memories
 * @param limit - Maximum number of memories to include
 * @param config - Spaced repetition configuration
 * @returns Review queue
 */
export declare function buildReviewQueue(memories: Memory[], limit?: number, config?: SpacedRepetitionConfig): ReviewQueue;
/**
 * Get memories to surface in current context
 *
 * Context-triggered recall: find relevant memories that are also due for review
 *
 * @param contextEmbedding - Current context embedding
 * @param memories - All memories
 * @param relevanceThreshold - Minimum relevance score (default: 0.6)
 * @param limit - Maximum memories to return
 * @param config - Spaced repetition configuration
 * @returns Array of relevant memories with scores
 */
export declare function getContextTriggeredMemories(contextEmbedding: number[], memories: Memory[], relevanceThreshold?: number, limit?: number, config?: SpacedRepetitionConfig): Array<{
    memory: Memory;
    relevance: number;
    priority: number;
}>;
/**
 * Test if AI can recall a related memory given a cue
 *
 * @param cueMemory - Memory to use as cue
 * @param targetMemory - Memory that should be recalled
 * @param retrievedMemories - Memories actually retrieved
 * @returns True if recall was successful
 */
export declare function testConnectionRecall(cueMemory: Memory, targetMemory: Memory, retrievedMemories: Memory[]): boolean;
/**
 * Test if AI can apply learned information to a new scenario
 *
 * This would typically involve an LLM call to test understanding
 *
 * @param memory - Memory containing learned information
 * @param scenario - New scenario to apply to
 * @returns Application quality score [0, 1]
 */
export declare function testApplicationRecall(memory: Memory, scenario: string): Promise<number>;
/**
 * Test if consolidated memories maintain logical consistency
 *
 * @param originalMemories - Original memories before consolidation
 * @param consolidatedMemory - Consolidated memory
 * @returns Consistency score [0, 1]
 */
export declare function testCoherenceRecall(originalMemories: Memory[], consolidatedMemory: Memory): Promise<number>;
/**
 * Perform periodic self-test on random memories
 *
 * @param memories - Pool of memories to test
 * @param sampleSize - Number of memories to test
 * @returns Test results
 */
export declare function performSelfTest(memories: Memory[], sampleSize?: number): Promise<{
    tested: number;
    successful: number;
    failed: Memory[];
    averageConfidence: number;
}>;
/**
 * Reinforce memories after successful recall
 *
 * @param memory - Memory to reinforce
 * @param confidence - Confidence score from recall test [0, 1]
 */
export declare function reinforceOnRecall(memory: Memory, confidence: number): void;
/**
 * Flag memory for review after failed recall
 *
 * @param memory - Memory that failed recall
 */
export declare function flagForReview(memory: Memory): void;
/**
 * Process daily review queue
 *
 * @param memories - All memories
 * @param maxReviews - Maximum reviews to perform
 * @param config - Spaced repetition configuration
 * @returns Review results
 */
export declare function processDailyReviews(memories: Memory[], maxReviews?: number, config?: SpacedRepetitionConfig): Promise<{
    reviewed: number;
    strengthened: number;
    flagged: number;
}>;
/**
 * PSEUDOCODE: Spaced Repetition System
 *
 * FUNCTION initialize_review_schedule(memory, config):
 *   easiness_factor = 1.3 + (memory.importance * 1.7)
 *   next_review = memory.created_at + config.initial_interval days
 *
 *   schedule = {
 *     memory_id: memory.id,
 *     next_review: next_review,
 *     interval: config.initial_interval,
 *     easiness_factor: easiness_factor,
 *     review_count: 0
 *   }
 *
 *   RETURN schedule
 * END FUNCTION
 *
 * FUNCTION calculate_next_interval(review_count, easiness_factor, config):
 *   IF review_count == 0:
 *     RETURN config.initial_interval
 *   ELSE IF review_count == 1:
 *     RETURN config.second_interval
 *   ELSE:
 *     previous_interval = calculate_next_interval(review_count - 1, easiness_factor, config)
 *     RETURN previous_interval * easiness_factor
 * END FUNCTION
 *
 * FUNCTION daily_review_process(all_memories, config):
 *   now = current_time()
 *
 *   // 1. Build review queue
 *   due_memories = FILTER all_memories WHERE next_review <= now
 *
 *   // 2. Calculate priorities
 *   FOR EACH memory IN due_memories:
 *     days_overdue = (now - memory.next_review) / 1 day
 *     overdue_score = log(1 + days_overdue) / log(30)
 *
 *     priority = (0.4 * overdue_score) +
 *                (0.3 * memory.importance) +
 *                (0.3 * (1 - memory.strength))
 *
 *     memory.priority = priority
 *   END FOR
 *
 *   // 3. Sort and limit
 *   SORT due_memories BY priority DESC
 *   review_queue = TOP 20 from due_memories
 *
 *   // 4. Process reviews
 *   FOR EACH memory IN review_queue:
 *     // Test recall (simplified - would use LLM in production)
 *     recall_success = test_memory_recall(memory)
 *
 *     IF recall_success:
 *       // Strengthen memory
 *       memory.strength = MIN(1.0, memory.strength + 0.15)
 *       memory.access_count += 1
 *
 *       // Update schedule with longer interval
 *       memory.review_count += 1
 *       new_interval = calculate_next_interval(
 *         memory.review_count,
 *         memory.easiness_factor,
 *         config
 *       )
 *       memory.next_review = now + new_interval days
 *
 *     ELSE:
 *       // Flag for immediate review
 *       memory.strength = MAX(0, memory.strength - 0.15)
 *       memory.next_review = now + 1 day
 *       ADD 'needs_review' tag to memory
 *     END IF
 *
 *     save(memory)
 *   END FOR
 * END FUNCTION
 *
 * FUNCTION on_context_change(new_context_embedding, all_memories, config):
 *   // Context-triggered recall
 *   relevant = []
 *
 *   FOR EACH memory IN all_memories:
 *     IF memory.embedding is not null:
 *       relevance = cosine_similarity(new_context_embedding, memory.embedding)
 *
 *       IF relevance > 0.6:
 *         schedule = get_review_schedule(memory)
 *         priority = calculate_review_priority(memory, schedule)
 *
 *         // Boost if due for review
 *         IF schedule.next_review <= now:
 *           priority *= 1.5
 *
 *         ADD {memory, relevance, priority} to relevant
 *       END IF
 *     END IF
 *   END FOR
 *
 *   // Sort by combined score
 *   SORT relevant BY (0.6 * relevance + 0.4 * priority) DESC
 *
 *   // Return top 5
 *   RETURN TOP 5 from relevant
 * END FUNCTION
 */
//# sourceMappingURL=spaced-repetition.d.ts.map