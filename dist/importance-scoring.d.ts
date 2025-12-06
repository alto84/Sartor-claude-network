/**
 * Importance Score Calculation Implementation
 *
 * Implements the four factors of memory importance:
 * 1. Recency (exponential decay)
 * 2. Frequency (logarithmic scaling)
 * 3. Salience (LLM-scored semantic importance)
 * 4. Relevance (embedding similarity to context)
 */
import { Memory, ImportanceWeights, ImportanceFactors, RecencyConfig, FrequencyConfig, SalienceScores, LLMSalienceRequest, LLMSalienceResponse } from './types';
/**
 * Calculate recency score using exponential decay
 *
 * Formula: e^(-λ * t)
 * where:
 *   λ = decay constant (lambda)
 *   t = time elapsed in days
 *
 * @param memory - The memory to score
 * @param config - Recency configuration
 * @returns Score in range [0, 1]
 */
export declare function calculateRecencyScore(memory: Memory, config?: RecencyConfig): number;
/**
 * Calculate recency from last access (rather than creation)
 */
export declare function calculateAccessRecencyScore(memory: Memory, config?: RecencyConfig): number;
/**
 * Calculate frequency score using logarithmic scaling
 *
 * Formula: log(1 + count) / log(1 + max_expected)
 *
 * Logarithmic scaling prevents over-weighting of heavily accessed memories
 * while still rewarding frequency.
 *
 * @param memory - The memory to score
 * @param config - Frequency configuration
 * @returns Score in range [0, 1]
 */
export declare function calculateFrequencyScore(memory: Memory, config?: FrequencyConfig): number;
/**
 * Calculate frequency with recency weighting
 * Recent accesses count more than old ones
 */
export declare function calculateWeightedFrequencyScore(memory: Memory, accessHistory: Date[], config?: FrequencyConfig): number;
/**
 * Calculate salience score from LLM-provided scores
 *
 * @param scores - Salience scores from LLM (each 0-10)
 * @returns Normalized score in range [0, 1]
 */
export declare function calculateSalienceScore(scores: SalienceScores): number;
/**
 * Generate LLM prompt for salience scoring
 */
export declare function generateSaliencePrompt(content: string, context?: string): string;
/**
 * Parse LLM response for salience scores
 */
export declare function parseSalienceResponse(response: string): SalienceScores;
/**
 * Mock LLM salience scoring (replace with actual LLM call)
 */
export declare function scoreSalienceWithLLM(request: LLMSalienceRequest): Promise<LLMSalienceResponse>;
/**
 * Calculate cosine similarity between two vectors
 *
 * Formula: cosine_similarity(A, B) = (A · B) / (||A|| * ||B||)
 *
 * @param vectorA - First embedding vector
 * @param vectorB - Second embedding vector
 * @returns Similarity score in range [-1, 1]
 */
export declare function cosineSimilarity(vectorA: number[], vectorB: number[]): number;
/**
 * Calculate relevance score based on embedding similarity
 *
 * @param memoryEmbedding - Memory's embedding vector
 * @param contextEmbedding - Current context embedding vector
 * @returns Normalized score in range [0, 1]
 */
export declare function calculateRelevanceScore(memoryEmbedding: number[], contextEmbedding: number[]): number;
/**
 * Calculate relevance with multiple context vectors (e.g., recent messages)
 * Uses maximum similarity across all context vectors
 */
export declare function calculateMultiContextRelevance(memoryEmbedding: number[], contextEmbeddings: number[][]): number;
/**
 * Calculate all importance factors for a memory
 *
 * @param memory - The memory to score
 * @param contextEmbedding - Current context embedding (optional)
 * @param salienceScores - Pre-computed salience scores (optional)
 * @returns All importance factors
 */
export declare function calculateImportanceFactors(memory: Memory, contextEmbedding?: number[], salienceScores?: SalienceScores): Promise<ImportanceFactors>;
/**
 * Calculate combined importance score
 *
 * Formula: weighted sum of all factors
 *
 * @param factors - Individual importance factors
 * @param weights - Weights for each factor (must sum to 1.0)
 * @returns Combined importance score in range [0, 1]
 */
export declare function calculateCombinedImportance(factors: ImportanceFactors, weights?: ImportanceWeights): number;
/**
 * Calculate and update memory importance score
 *
 * @param memory - The memory to update
 * @param contextEmbedding - Current context embedding (optional)
 * @param weights - Custom weights (optional)
 * @returns Updated importance score
 */
export declare function updateMemoryImportance(memory: Memory, contextEmbedding?: number[], weights?: ImportanceWeights): Promise<number>;
/**
 * Batch calculate importance for multiple memories
 */
export declare function batchCalculateImportance(memories: Memory[], contextEmbedding?: number[], weights?: ImportanceWeights): Promise<number[]>;
/**
 * Get adaptive weights based on use case
 */
export declare function getAdaptiveWeights(useCase: 'time_sensitive' | 'content_heavy' | 'context_aware'): ImportanceWeights;
//# sourceMappingURL=importance-scoring.d.ts.map