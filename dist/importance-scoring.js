"use strict";
/**
 * Importance Score Calculation Implementation
 *
 * Implements the four factors of memory importance:
 * 1. Recency (exponential decay)
 * 2. Frequency (logarithmic scaling)
 * 3. Salience (LLM-scored semantic importance)
 * 4. Relevance (embedding similarity to context)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRecencyScore = calculateRecencyScore;
exports.calculateAccessRecencyScore = calculateAccessRecencyScore;
exports.calculateFrequencyScore = calculateFrequencyScore;
exports.calculateWeightedFrequencyScore = calculateWeightedFrequencyScore;
exports.calculateSalienceScore = calculateSalienceScore;
exports.generateSaliencePrompt = generateSaliencePrompt;
exports.parseSalienceResponse = parseSalienceResponse;
exports.scoreSalienceWithLLM = scoreSalienceWithLLM;
exports.cosineSimilarity = cosineSimilarity;
exports.calculateRelevanceScore = calculateRelevanceScore;
exports.calculateMultiContextRelevance = calculateMultiContextRelevance;
exports.calculateImportanceFactors = calculateImportanceFactors;
exports.calculateCombinedImportance = calculateCombinedImportance;
exports.updateMemoryImportance = updateMemoryImportance;
exports.batchCalculateImportance = batchCalculateImportance;
exports.getAdaptiveWeights = getAdaptiveWeights;
// ============================================================================
// Configuration
// ============================================================================
const DEFAULT_WEIGHTS = {
    recency: 0.25,
    frequency: 0.20,
    salience: 0.35,
    relevance: 0.20
};
const DEFAULT_RECENCY_CONFIG = {
    lambda: 0.05 // Half-life ~14 days
};
const DEFAULT_FREQUENCY_CONFIG = {
    max_expected_accesses: 100
};
// ============================================================================
// 1. Recency Factor
// ============================================================================
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
function calculateRecencyScore(memory, config = DEFAULT_RECENCY_CONFIG) {
    const now = new Date();
    const created = new Date(memory.created_at);
    // Calculate time elapsed in days
    const millisPerDay = 1000 * 60 * 60 * 24;
    const daysElapsed = (now.getTime() - created.getTime()) / millisPerDay;
    // Exponential decay: e^(-lambda * t)
    const score = Math.exp(-config.lambda * daysElapsed);
    return Math.max(0, Math.min(1, score)); // Clamp to [0, 1]
}
/**
 * Calculate recency from last access (rather than creation)
 */
function calculateAccessRecencyScore(memory, config = DEFAULT_RECENCY_CONFIG) {
    const now = new Date();
    const lastAccessed = new Date(memory.last_accessed);
    const millisPerDay = 1000 * 60 * 60 * 24;
    const daysElapsed = (now.getTime() - lastAccessed.getTime()) / millisPerDay;
    const score = Math.exp(-config.lambda * daysElapsed);
    return Math.max(0, Math.min(1, score));
}
// ============================================================================
// 2. Frequency Factor
// ============================================================================
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
function calculateFrequencyScore(memory, config = DEFAULT_FREQUENCY_CONFIG) {
    const accessCount = memory.access_count || 0;
    // Logarithmic scaling
    const numerator = Math.log(1 + accessCount);
    const denominator = Math.log(1 + config.max_expected_accesses);
    const score = numerator / denominator;
    return Math.max(0, Math.min(1, score)); // Clamp to [0, 1]
}
/**
 * Calculate frequency with recency weighting
 * Recent accesses count more than old ones
 */
function calculateWeightedFrequencyScore(memory, accessHistory, config = DEFAULT_FREQUENCY_CONFIG) {
    const now = new Date();
    const millisPerDay = 1000 * 60 * 60 * 24;
    // Weight recent accesses more heavily
    const weightedCount = accessHistory.reduce((sum, accessDate) => {
        const daysAgo = (now.getTime() - accessDate.getTime()) / millisPerDay;
        const weight = Math.exp(-0.01 * daysAgo); // Slow decay
        return sum + weight;
    }, 0);
    const numerator = Math.log(1 + weightedCount);
    const denominator = Math.log(1 + config.max_expected_accesses);
    const score = numerator / denominator;
    return Math.max(0, Math.min(1, score));
}
// ============================================================================
// 3. Emotional/Semantic Salience
// ============================================================================
/**
 * Calculate salience score from LLM-provided scores
 *
 * @param scores - Salience scores from LLM (each 0-10)
 * @returns Normalized score in range [0, 1]
 */
function calculateSalienceScore(scores) {
    const total = scores.emotional + scores.novelty + scores.actionable + scores.personal;
    const maxTotal = 40; // 4 criteria * 10 points each
    const score = total / maxTotal;
    return Math.max(0, Math.min(1, score));
}
/**
 * Generate LLM prompt for salience scoring
 */
function generateSaliencePrompt(content, context) {
    return `Analyze this memory for importance on a scale of 0-10 for each criterion:

1. **Emotional Intensity** (0-10): How emotionally charged is this content?
   - 0: Neutral, factual
   - 5: Moderate emotional content
   - 10: Highly emotional, intense feelings

2. **Novelty** (0-10): How unique or surprising is this information?
   - 0: Common, routine information
   - 5: Somewhat interesting or unexpected
   - 10: Highly novel, surprising, or rare

3. **Actionable Insights** (0-10): Does this contain important decisions or actions?
   - 0: No actions or decisions
   - 5: Some actionable information
   - 10: Critical decisions, commitments, or important actions

4. **Personal Significance** (0-10): How personally meaningful is this?
   - 0: Impersonal, generic
   - 5: Moderately personal
   - 10: Deeply personal, identity-relevant

${context ? `\nContext: ${context}\n` : ''}
Memory Content: "${content}"

Respond ONLY with valid JSON in this exact format:
{
  "emotional": X,
  "novelty": Y,
  "actionable": Z,
  "personal": W,
  "explanation": "Brief reasoning for scores"
}`;
}
/**
 * Parse LLM response for salience scores
 */
function parseSalienceResponse(response) {
    try {
        const parsed = JSON.parse(response);
        return {
            emotional: Math.max(0, Math.min(10, parsed.emotional || 0)),
            novelty: Math.max(0, Math.min(10, parsed.novelty || 0)),
            actionable: Math.max(0, Math.min(10, parsed.actionable || 0)),
            personal: Math.max(0, Math.min(10, parsed.personal || 0))
        };
    }
    catch (error) {
        console.error('Failed to parse salience response:', error);
        // Return neutral scores on parse error
        return { emotional: 5, novelty: 5, actionable: 5, personal: 5 };
    }
}
/**
 * Mock LLM salience scoring (replace with actual LLM call)
 */
async function scoreSalienceWithLLM(request) {
    // TODO: Replace with actual LLM API call
    // This is a mock implementation
    const prompt = generateSaliencePrompt(request.content, request.context);
    // Simulate LLM call
    // In production: call OpenAI, Anthropic, or other LLM API
    const mockResponse = {
        emotional: 5,
        novelty: 5,
        actionable: 5,
        personal: 5
    };
    return {
        scores: mockResponse,
        cached: false
    };
}
// ============================================================================
// 4. Contextual Relevance
// ============================================================================
/**
 * Calculate cosine similarity between two vectors
 *
 * Formula: cosine_similarity(A, B) = (A · B) / (||A|| * ||B||)
 *
 * @param vectorA - First embedding vector
 * @param vectorB - Second embedding vector
 * @returns Similarity score in range [-1, 1]
 */
function cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
        throw new Error('Vectors must have the same length');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        normA += vectorA[i] * vectorA[i];
        normB += vectorB[i] * vectorB[i];
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (normA === 0 || normB === 0) {
        return 0;
    }
    return dotProduct / (normA * normB);
}
/**
 * Calculate relevance score based on embedding similarity
 *
 * @param memoryEmbedding - Memory's embedding vector
 * @param contextEmbedding - Current context embedding vector
 * @returns Normalized score in range [0, 1]
 */
function calculateRelevanceScore(memoryEmbedding, contextEmbedding) {
    const similarity = cosineSimilarity(memoryEmbedding, contextEmbedding);
    // Normalize from [-1, 1] to [0, 1]
    const normalized = (similarity + 1) / 2;
    return Math.max(0, Math.min(1, normalized));
}
/**
 * Calculate relevance with multiple context vectors (e.g., recent messages)
 * Uses maximum similarity across all context vectors
 */
function calculateMultiContextRelevance(memoryEmbedding, contextEmbeddings) {
    if (contextEmbeddings.length === 0) {
        return 0.5; // Neutral relevance if no context
    }
    const similarities = contextEmbeddings.map(contextEmb => calculateRelevanceScore(memoryEmbedding, contextEmb));
    // Return maximum similarity
    return Math.max(...similarities);
}
// ============================================================================
// 5. Combined Importance Score
// ============================================================================
/**
 * Calculate all importance factors for a memory
 *
 * @param memory - The memory to score
 * @param contextEmbedding - Current context embedding (optional)
 * @param salienceScores - Pre-computed salience scores (optional)
 * @returns All importance factors
 */
async function calculateImportanceFactors(memory, contextEmbedding, salienceScores) {
    // 1. Recency
    const recency = calculateRecencyScore(memory);
    // 2. Frequency
    const frequency = calculateFrequencyScore(memory);
    // 3. Salience
    let salience;
    if (salienceScores) {
        salience = calculateSalienceScore(salienceScores);
    }
    else if (memory.salience_score !== undefined) {
        salience = memory.salience_score;
    }
    else {
        // Calculate salience with LLM
        const response = await scoreSalienceWithLLM({ content: memory.content });
        salience = calculateSalienceScore(response.scores);
    }
    // 4. Relevance
    let relevance;
    if (contextEmbedding && memory.embedding) {
        relevance = calculateRelevanceScore(memory.embedding, contextEmbedding);
    }
    else if (memory.relevance_score !== undefined) {
        relevance = memory.relevance_score;
    }
    else {
        relevance = 0.5; // Neutral relevance if no context
    }
    return { recency, frequency, salience, relevance };
}
/**
 * Calculate combined importance score
 *
 * Formula: weighted sum of all factors
 *
 * @param factors - Individual importance factors
 * @param weights - Weights for each factor (must sum to 1.0)
 * @returns Combined importance score in range [0, 1]
 */
function calculateCombinedImportance(factors, weights = DEFAULT_WEIGHTS) {
    // Validate weights sum to 1.0
    const weightSum = weights.recency + weights.frequency + weights.salience + weights.relevance;
    if (Math.abs(weightSum - 1.0) > 0.001) {
        console.warn(`Weights sum to ${weightSum}, expected 1.0. Normalizing...`);
        const scale = 1.0 / weightSum;
        weights = {
            recency: weights.recency * scale,
            frequency: weights.frequency * scale,
            salience: weights.salience * scale,
            relevance: weights.relevance * scale
        };
    }
    const score = (weights.recency * factors.recency +
        weights.frequency * factors.frequency +
        weights.salience * factors.salience +
        weights.relevance * factors.relevance);
    return Math.max(0, Math.min(1, score));
}
/**
 * Calculate and update memory importance score
 *
 * @param memory - The memory to update
 * @param contextEmbedding - Current context embedding (optional)
 * @param weights - Custom weights (optional)
 * @returns Updated importance score
 */
async function updateMemoryImportance(memory, contextEmbedding, weights = DEFAULT_WEIGHTS) {
    const factors = await calculateImportanceFactors(memory, contextEmbedding);
    // Cache individual scores
    memory.recency_score = factors.recency;
    memory.frequency_score = factors.frequency;
    memory.salience_score = factors.salience;
    memory.relevance_score = factors.relevance;
    // Calculate combined score
    const importance = calculateCombinedImportance(factors, weights);
    memory.importance_score = importance;
    return importance;
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Batch calculate importance for multiple memories
 */
async function batchCalculateImportance(memories, contextEmbedding, weights = DEFAULT_WEIGHTS) {
    const promises = memories.map(memory => updateMemoryImportance(memory, contextEmbedding, weights));
    return Promise.all(promises);
}
/**
 * Get adaptive weights based on use case
 */
function getAdaptiveWeights(useCase) {
    switch (useCase) {
        case 'time_sensitive':
            return { recency: 0.40, frequency: 0.20, salience: 0.25, relevance: 0.15 };
        case 'content_heavy':
            return { recency: 0.15, frequency: 0.15, salience: 0.50, relevance: 0.20 };
        case 'context_aware':
            return { recency: 0.20, frequency: 0.15, salience: 0.25, relevance: 0.40 };
        default:
            return DEFAULT_WEIGHTS;
    }
}
//# sourceMappingURL=importance-scoring.js.map