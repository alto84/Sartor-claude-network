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

import {
  Memory,
  SpacedRepetitionConfig,
  ReviewSchedule,
  ReviewQueue
} from '../utils/types';
import { cosineSimilarity } from './importance-scoring';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_SPACED_REPETITION_CONFIG: SpacedRepetitionConfig = {
  initial_interval: 1,      // Days until first review
  second_interval: 6,       // Days until second review
  min_easiness: 1.3,        // Minimum easiness factor
  max_easiness: 3.0         // Maximum easiness factor
};

// ============================================================================
// 1. Optimal Review Intervals
// ============================================================================

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
export function calculateEasinessFactor(
  importance: number,
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION_CONFIG
): number {
  const ef = config.min_easiness + (importance * (config.max_easiness - config.min_easiness));
  return Math.max(config.min_easiness, Math.min(config.max_easiness, ef));
}

/**
 * Calculate next review interval based on SuperMemo SM-2 algorithm
 *
 * @param reviewCount - Number of previous reviews (0-based)
 * @param easinessFactor - Easiness factor [1.3, 3.0]
 * @param config - Spaced repetition configuration
 * @returns Interval in days
 */
export function calculateReviewInterval(
  reviewCount: number,
  easinessFactor: number,
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION_CONFIG
): number {
  if (reviewCount === 0) {
    return config.initial_interval;
  } else if (reviewCount === 1) {
    return config.second_interval;
  } else {
    // I(n) = I(n-1) * EF
    const previousInterval = calculateReviewInterval(reviewCount - 1, easinessFactor, config);
    return Math.round(previousInterval * easinessFactor);
  }
}

/**
 * Calculate next review date
 *
 * @param memory - Memory to schedule
 * @param config - Spaced repetition configuration
 * @returns Next review date
 */
export function calculateNextReviewDate(
  memory: Memory,
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION_CONFIG
): Date {
  const easinessFactor = calculateEasinessFactor(memory.importance_score, config);

  // Count reviews by checking access history
  // In production, maintain explicit review_count field
  const reviewCount = memory.access_count || 0;

  const intervalDays = calculateReviewInterval(reviewCount, easinessFactor, config);

  const nextReview = new Date(memory.last_accessed);
  nextReview.setDate(nextReview.getDate() + intervalDays);

  return nextReview;
}

/**
 * Create or update review schedule for a memory
 *
 * @param memory - Memory to schedule
 * @param config - Spaced repetition configuration
 * @returns Review schedule
 */
export function createReviewSchedule(
  memory: Memory,
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION_CONFIG
): ReviewSchedule {
  const easinessFactor = calculateEasinessFactor(memory.importance_score, config);
  const reviewCount = memory.access_count || 0;
  const intervalDays = calculateReviewInterval(reviewCount, easinessFactor, config);
  const nextReview = calculateNextReviewDate(memory, config);

  return {
    memory_id: memory.id,
    next_review: nextReview,
    interval: intervalDays,
    easiness_factor: easinessFactor,
    review_count: reviewCount
  };
}

/**
 * Update review schedule after a review
 *
 * @param schedule - Current review schedule
 * @param wasSuccessful - Whether review was successful
 * @param config - Spaced repetition configuration
 * @returns Updated schedule
 */
export function updateReviewSchedule(
  schedule: ReviewSchedule,
  wasSuccessful: boolean,
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION_CONFIG
): ReviewSchedule {
  let newEasinessFactor = schedule.easiness_factor;

  if (!wasSuccessful) {
    // Failed review: reduce easiness (shorter intervals)
    newEasinessFactor = Math.max(config.min_easiness, newEasinessFactor - 0.2);
  } else {
    // Successful review: maintain or slightly increase easiness
    newEasinessFactor = Math.min(config.max_easiness, newEasinessFactor + 0.1);
  }

  const newReviewCount = schedule.review_count + 1;
  const newInterval = calculateReviewInterval(newReviewCount, newEasinessFactor, config);

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    ...schedule,
    next_review: nextReview,
    interval: newInterval,
    easiness_factor: newEasinessFactor,
    review_count: newReviewCount
  };
}

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
export function getIntervalProgression(
  importance: number,
  maxReviews: number = 10,
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION_CONFIG
): number[] {
  const easinessFactor = calculateEasinessFactor(importance, config);
  const intervals: number[] = [];

  for (let i = 0; i < maxReviews; i++) {
    intervals.push(calculateReviewInterval(i, easinessFactor, config));
  }

  return intervals;
}

// ============================================================================
// 2. Surfacing Important Memories
// ============================================================================

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
export function calculateReviewPriority(
  memory: Memory,
  reviewSchedule: ReviewSchedule
): number {
  const now = new Date();
  const nextReview = new Date(reviewSchedule.next_review);

  // Calculate days overdue (can be negative if not yet due)
  const millisPerDay = 1000 * 60 * 60 * 24;
  const daysOverdue = (now.getTime() - nextReview.getTime()) / millisPerDay;

  // Overdue component: exponential increase for overdue items
  const overdueScore = daysOverdue > 0 ?
    Math.min(1.0, Math.log(1 + daysOverdue) / Math.log(30)) : // Cap at 30 days
    0;

  // Importance component
  const importanceScore = memory.importance_score;

  // Weakness component: weaker memories need more review
  const weaknessScore = 1 - memory.strength;

  // Combined priority (weights: 40% overdue, 30% importance, 30% weakness)
  const priority = (0.4 * overdueScore) + (0.3 * importanceScore) + (0.3 * weaknessScore);

  return priority;
}

/**
 * Build review queue from memories
 *
 * @param memories - All memories
 * @param limit - Maximum number of memories to include
 * @param config - Spaced repetition configuration
 * @returns Review queue
 */
export function buildReviewQueue(
  memories: Memory[],
  limit: number = 20,
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION_CONFIG
): ReviewQueue {
  const now = new Date();

  // Filter memories due for review
  const dueMemories = memories.filter(memory => {
    const schedule = createReviewSchedule(memory, config);
    return schedule.next_review <= now;
  });

  // Calculate priorities
  const withPriorities = dueMemories.map(memory => ({
    memory,
    schedule: createReviewSchedule(memory, config),
    priority: calculateReviewPriority(
      memory,
      createReviewSchedule(memory, config)
    )
  }));

  // Sort by priority (descending)
  withPriorities.sort((a, b) => b.priority - a.priority);

  // Take top N
  const topItems = withPriorities.slice(0, limit);

  return {
    memories: topItems.map(item => item.memory),
    priority_scores: topItems.map(item => item.priority),
    due_dates: topItems.map(item => item.schedule.next_review)
  };
}

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
export function getContextTriggeredMemories(
  contextEmbedding: number[],
  memories: Memory[],
  relevanceThreshold: number = 0.6,
  limit: number = 5,
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION_CONFIG
): Array<{ memory: Memory; relevance: number; priority: number }> {
  // Calculate relevance for each memory
  const withRelevance = memories
    .filter(m => m.embedding !== undefined)
    .map(memory => {
      const relevance = cosineSimilarity(contextEmbedding, memory.embedding!);
      const schedule = createReviewSchedule(memory, config);
      const priority = calculateReviewPriority(memory, schedule);

      // Boost priority if review is due
      const now = new Date();
      const isDue = schedule.next_review <= now;
      const finalPriority = isDue ? priority * 1.5 : priority;

      return {
        memory,
        relevance,
        priority: finalPriority
      };
    })
    .filter(item => item.relevance > relevanceThreshold);

  // Sort by combined score: relevance (60%) + priority (40%)
  withRelevance.sort((a, b) => {
    const scoreA = (0.6 * a.relevance) + (0.4 * a.priority);
    const scoreB = (0.6 * b.relevance) + (0.4 * b.priority);
    return scoreB - scoreA;
  });

  return withRelevance.slice(0, limit);
}

// ============================================================================
// 3. Active Recall Testing
// ============================================================================

/**
 * Test if AI can recall a related memory given a cue
 *
 * @param cueMemory - Memory to use as cue
 * @param targetMemory - Memory that should be recalled
 * @param retrievedMemories - Memories actually retrieved
 * @returns True if recall was successful
 */
export function testConnectionRecall(
  cueMemory: Memory,
  targetMemory: Memory,
  retrievedMemories: Memory[]
): boolean {
  return retrievedMemories.some(m => m.id === targetMemory.id);
}

/**
 * Test if AI can apply learned information to a new scenario
 *
 * This would typically involve an LLM call to test understanding
 *
 * @param memory - Memory containing learned information
 * @param scenario - New scenario to apply to
 * @returns Application quality score [0, 1]
 */
export async function testApplicationRecall(
  memory: Memory,
  scenario: string
): Promise<number> {
  // TODO: Implement with LLM
  // Prompt: "Given this knowledge: {memory.content}, how would you handle: {scenario}"
  // Evaluate if response correctly applies the knowledge

  // Mock implementation
  return 0.8;
}

/**
 * Test if consolidated memories maintain logical consistency
 *
 * @param originalMemories - Original memories before consolidation
 * @param consolidatedMemory - Consolidated memory
 * @returns Consistency score [0, 1]
 */
export async function testCoherenceRecall(
  originalMemories: Memory[],
  consolidatedMemory: Memory
): Promise<number> {
  // TODO: Implement with LLM
  // Check if consolidated memory captures key information
  // Check for contradictions or information loss

  // Mock implementation
  return 0.85;
}

/**
 * Perform periodic self-test on random memories
 *
 * @param memories - Pool of memories to test
 * @param sampleSize - Number of memories to test
 * @returns Test results
 */
export async function performSelfTest(
  memories: Memory[],
  sampleSize: number = 10
): Promise<{
  tested: number;
  successful: number;
  failed: Memory[];
  averageConfidence: number;
}> {
  // Random sampling
  const shuffled = [...memories].sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, Math.min(sampleSize, memories.length));

  const results = {
    tested: sample.length,
    successful: 0,
    failed: [] as Memory[],
    averageConfidence: 0
  };

  let totalConfidence = 0;

  for (const memory of sample) {
    // Test recall without using embeddings
    // In production: use LLM to test understanding
    const recallSuccess = Math.random() > 0.2; // Mock: 80% success rate
    const confidence = Math.random() * 0.5 + 0.5; // Mock: 0.5-1.0

    totalConfidence += confidence;

    if (recallSuccess && confidence > 0.6) {
      results.successful++;
    } else {
      results.failed.push(memory);
    }
  }

  results.averageConfidence = results.tested > 0 ? totalConfidence / results.tested : 0;

  return results;
}

/**
 * Reinforce memories after successful recall
 *
 * @param memory - Memory to reinforce
 * @param confidence - Confidence score from recall test [0, 1]
 */
export function reinforceOnRecall(memory: Memory, confidence: number): void {
  // Boost strength based on confidence
  const boost = confidence * 0.2; // Max 20% boost
  memory.strength = Math.min(1.0, memory.strength + boost);

  // Update access count and timestamp
  memory.access_count += 1;
  memory.last_accessed = new Date();
}

/**
 * Flag memory for review after failed recall
 *
 * @param memory - Memory that failed recall
 */
export function flagForReview(memory: Memory): void {
  // Reduce strength to trigger earlier review
  memory.strength = Math.max(0, memory.strength - 0.15);

  // Add review tag
  if (!memory.tags.includes('needs_review')) {
    memory.tags.push('needs_review');
  }

  // Update next review to be soon
  memory.next_review = new Date();
  memory.next_review.setDate(memory.next_review.getDate() + 1); // Review tomorrow
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Process daily review queue
 *
 * @param memories - All memories
 * @param maxReviews - Maximum reviews to perform
 * @param config - Spaced repetition configuration
 * @returns Review results
 */
export async function processDailyReviews(
  memories: Memory[],
  maxReviews: number = 20,
  config: SpacedRepetitionConfig = DEFAULT_SPACED_REPETITION_CONFIG
): Promise<{
  reviewed: number;
  strengthened: number;
  flagged: number;
}> {
  const queue = buildReviewQueue(memories, maxReviews, config);

  const results = {
    reviewed: 0,
    strengthened: 0,
    flagged: 0
  };

  for (const memory of queue.memories) {
    // Perform self-test
    const confidence = Math.random(); // Mock: replace with actual test

    results.reviewed++;

    if (confidence > 0.6) {
      reinforceOnRecall(memory, confidence);
      results.strengthened++;
    } else {
      flagForReview(memory);
      results.flagged++;
    }
  }

  return results;
}

// ============================================================================
// Pseudocode for Spaced Repetition
// ============================================================================

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
