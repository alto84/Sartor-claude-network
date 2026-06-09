/**
 * Diversity Scorer
 *
 * Evaluates solution diversity to promote varied approaches.
 * Inspired by Poetiq's diversity-first selection strategy.
 *
 * Key concepts:
 * - Similarity detection between solutions
 * - Archetype diversity bonus
 * - Approach clustering
 * - Novelty scoring
 *
 * @module multi-expert/diversity-scorer
 */

import { ExpertResult } from './execution-engine';
import { ExpertArchetype } from './expert-config';

/**
 * Diversity score for a solution
 */
export interface DiversityScore {
  /** Overall diversity score (0-100) */
  score: number;

  /** Archetype uniqueness score */
  archetypeScore: number;

  /** Output similarity score (lower = more unique) */
  similarityScore: number;

  /** Novelty score (compared to previous solutions) */
  noveltyScore: number;

  /** Cluster the solution belongs to */
  cluster?: string;

  /** Detailed breakdown */
  breakdown: DiversityBreakdown;
}

/**
 * Detailed diversity breakdown
 */
export interface DiversityBreakdown {
  /** Number of similar solutions found */
  similarSolutions: number;

  /** Archetypes represented in the pool */
  archetypesPresent: ExpertArchetype[];

  /** Most similar solution ID (if any) */
  mostSimilarTo?: string;

  /** Similarity percentage to most similar */
  maxSimilarity: number;
}

/**
 * Diversity scoring configuration
 */
export interface DiversityScorerConfig {
  /** Weight for archetype diversity (0-1) */
  archetypeWeight: number;

  /** Weight for output uniqueness (0-1) */
  uniquenessWeight: number;

  /** Weight for novelty (0-1) */
  noveltyWeight: number;

  /** Similarity threshold to consider "same approach" */
  similarityThreshold: number;

  /** Minimum diversity score to accept solution */
  minDiversityScore: number;
}

/**
 * Default diversity scorer configuration
 */
export const DEFAULT_DIVERSITY_CONFIG: DiversityScorerConfig = {
  archetypeWeight: 0.3,
  uniquenessWeight: 0.4,
  noveltyWeight: 0.3,
  similarityThreshold: 0.8,
  minDiversityScore: 20,
};

/**
 * Diversity Scorer
 */
export class DiversityScorer {
  private config: DiversityScorerConfig;
  private seenSolutions: Map<string, string>; // id -> output fingerprint

  constructor(config: Partial<DiversityScorerConfig> = {}) {
    this.config = { ...DEFAULT_DIVERSITY_CONFIG, ...config };
    this.seenSolutions = new Map();
  }

  /**
   * Score a single result's diversity
   */
  scoreResult(result: ExpertResult, pool: ExpertResult[]): DiversityScore {
    const archetypeScore = this.calculateArchetypeScore(result, pool);
    const similarityScore = this.calculateSimilarityScore(result, pool);
    const noveltyScore = this.calculateNoveltyScore(result);

    // Weighted combination
    const overallScore =
      archetypeScore * this.config.archetypeWeight +
      (100 - similarityScore) * this.config.uniquenessWeight +
      noveltyScore * this.config.noveltyWeight;

    // Find most similar solution
    const similarities = pool
      .filter((r) => r.expertId !== result.expertId && r.success)
      .map((r) => ({
        id: r.expertId,
        similarity: this.calculatePairSimilarity(result, r),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    const mostSimilar = similarities[0];
    const similarCount = similarities.filter(
      (s) => s.similarity >= this.config.similarityThreshold * 100
    ).length;

    // Track this solution
    this.seenSolutions.set(result.expertId, this.getOutputFingerprint(result));

    return {
      score: Math.round(overallScore),
      archetypeScore: Math.round(archetypeScore),
      similarityScore: Math.round(similarityScore),
      noveltyScore: Math.round(noveltyScore),
      breakdown: {
        similarSolutions: similarCount,
        archetypesPresent: this.getUniqueArchetypes(pool),
        mostSimilarTo: mostSimilar?.id,
        maxSimilarity: mostSimilar?.similarity || 0,
      },
    };
  }

  /**
   * Score all results and rank by diversity
   */
  scoreAll(results: ExpertResult[]): Array<{ result: ExpertResult; diversity: DiversityScore }> {
    const successful = results.filter((r) => r.success);

    return successful
      .map((result) => ({
        result,
        diversity: this.scoreResult(result, successful),
      }))
      .sort((a, b) => b.diversity.score - a.diversity.score);
  }

  /**
   * Select diverse subset of results
   */
  selectDiverse(results: ExpertResult[], count: number): ExpertResult[] {
    const scored = this.scoreAll(results);
    const selected: ExpertResult[] = [];
    const usedArchetypes = new Set<ExpertArchetype>();

    // Greedily select diverse solutions
    for (const { result, diversity } of scored) {
      if (selected.length >= count) break;

      // Prefer solutions with unused archetypes
      const archetype = result.expertConfig.archetype;
      if (!usedArchetypes.has(archetype) || diversity.score >= this.config.minDiversityScore) {
        selected.push(result);
        usedArchetypes.add(archetype);
      }
    }

    // Fill remaining slots if needed
    if (selected.length < count) {
      for (const { result } of scored) {
        if (selected.length >= count) break;
        if (!selected.includes(result)) {
          selected.push(result);
        }
      }
    }

    return selected;
  }

  /**
   * Calculate archetype diversity score
   */
  private calculateArchetypeScore(result: ExpertResult, pool: ExpertResult[]): number {
    const archetypes = this.getUniqueArchetypes(pool);
    const myArchetype = result.expertConfig.archetype;

    // Count how many share the same archetype
    const sameArchetypeCount = pool.filter(
      (r) => r.expertConfig.archetype === myArchetype && r.expertId !== result.expertId
    ).length;

    // More unique archetype = higher score
    if (sameArchetypeCount === 0) return 100;
    const archetypeFrequency = sameArchetypeCount / pool.length;
    return Math.round((1 - archetypeFrequency) * 100);
  }

  /**
   * Calculate similarity score (lower = more unique)
   */
  private calculateSimilarityScore(result: ExpertResult, pool: ExpertResult[]): number {
    const similarities = pool
      .filter((r) => r.expertId !== result.expertId && r.success)
      .map((r) => this.calculatePairSimilarity(result, r));

    if (similarities.length === 0) return 0;

    // Return max similarity (worst case)
    return Math.max(...similarities);
  }

  /**
   * Calculate novelty score based on previously seen solutions
   */
  private calculateNoveltyScore(result: ExpertResult): number {
    const fingerprint = this.getOutputFingerprint(result);

    // Check against previously seen solutions
    let maxSimilarity = 0;
    for (const seenFingerprint of this.seenSolutions.values()) {
      const similarity = this.fingerprintSimilarity(fingerprint, seenFingerprint);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    // Novelty is inverse of similarity to seen solutions
    return Math.round((1 - maxSimilarity) * 100);
  }

  /**
   * Calculate pairwise similarity between two results
   */
  private calculatePairSimilarity(a: ExpertResult, b: ExpertResult): number {
    // Component weights
    const archetypeMatch = a.expertConfig.archetype === b.expertConfig.archetype ? 30 : 0;
    const strategyMatch = a.expertConfig.strategy === b.expertConfig.strategy ? 20 : 0;
    const scoreSimilarity = (1 - Math.abs(a.score - b.score) / 100) * 25;
    const confidenceSimilarity = (1 - Math.abs(a.confidence - b.confidence)) * 25;

    return archetypeMatch + strategyMatch + scoreSimilarity + confidenceSimilarity;
  }

  /**
   * Get unique archetypes in pool
   */
  private getUniqueArchetypes(pool: ExpertResult[]): ExpertArchetype[] {
    return [...new Set(pool.map((r) => r.expertConfig.archetype))];
  }

  /**
   * Create fingerprint of output for comparison
   */
  private getOutputFingerprint(result: ExpertResult): string {
    const output = result.output;
    if (typeof output === 'string') {
      return output.toLowerCase().replace(/\s+/g, ' ').substring(0, 200);
    }
    return JSON.stringify(output).substring(0, 200);
  }

  /**
   * Compare two fingerprints for similarity (0-1)
   */
  private fingerprintSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (!a || !b) return 0;

    // Simple Jaccard-like similarity on words
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));

    const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
  }

  /**
   * Reset seen solutions (for new problem)
   */
  reset(): void {
    this.seenSolutions.clear();
  }
}

/**
 * Quick diversity selection helper
 */
export function selectDiverseResults(results: ExpertResult[], count: number): ExpertResult[] {
  const scorer = new DiversityScorer();
  return scorer.selectDiverse(results, count);
}

/**
 * Calculate pool diversity score
 */
export function calculatePoolDiversity(results: ExpertResult[]): number {
  const scorer = new DiversityScorer();
  const scores = scorer.scoreAll(results);

  if (scores.length === 0) return 0;

  const avgDiversity = scores.reduce((sum, s) => sum + s.diversity.score, 0) / scores.length;
  return Math.round(avgDiversity);
}
