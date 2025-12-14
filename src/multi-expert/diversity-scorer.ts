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
 * Diversity statistics and metrics
 */
export interface DiversityStats {
  /** Total number of scoring operations */
  totalScores: number;

  /** Average diversity score over time */
  avgDiversityScore: number;

  /** Minimum diversity score recorded */
  minDiversityScore: number;

  /** Maximum diversity score recorded */
  maxDiversityScore: number;

  /** Frequency of each archetype being selected */
  archetypeFrequency: Record<string, number>;

  /** Most frequently selected archetype */
  mostSelectedArchetype?: string;

  /** Least frequently selected archetype */
  leastSelectedArchetype?: string;

  /** Archetype pair combinations and their average score */
  archetypePairPerformance: Record<string, { count: number; avgScore: number }>;

  /** Top performing archetype combinations */
  topPairCombinations: Array<{ pair: string; count: number; avgScore: number }>;

  /** Score trend (latest 10 scores) */
  recentScores: number[];

  /** Timestamp of last update */
  lastUpdated: number;
}

/**
 * Score history entry
 */
interface ScoreHistoryEntry {
  timestamp: number;
  score: number;
  archetype: ExpertArchetype;
  selectedArchetypes?: ExpertArchetype[];
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

  // Metrics tracking
  private scoreHistory: ScoreHistoryEntry[] = [];
  private archetypeFrequency: Map<string, number> = new Map();
  private archetypePairs: Map<string, { scores: number[]; count: number }> = new Map();
  private recentScores: number[] = [];
  private readonly MAX_RECENT_SCORES = 10;

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

    const finalScore = Math.round(overallScore);

    // Update metrics
    this.recordScore(finalScore, result.expertConfig.archetype, this.getUniqueArchetypes(pool));

    return {
      score: finalScore,
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
          usedArchetypes.add(result.expertConfig.archetype);
        }
      }
    }

    // Track the archetype combination that was selected
    this.recordArchetypeCombination(selected);

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
   * Record a score for metrics tracking
   */
  private recordScore(score: number, archetype: ExpertArchetype, selectedArchetypes: ExpertArchetype[]): void {
    const entry: ScoreHistoryEntry = {
      timestamp: Date.now(),
      score,
      archetype,
      selectedArchetypes,
    };

    this.scoreHistory.push(entry);

    // Track recent scores
    this.recentScores.push(score);
    if (this.recentScores.length > this.MAX_RECENT_SCORES) {
      this.recentScores.shift();
    }

    // Track archetype frequency
    const freq = this.archetypeFrequency.get(archetype) ?? 0;
    this.archetypeFrequency.set(archetype, freq + 1);
  }

  /**
   * Record archetype combinations that were selected together
   */
  private recordArchetypeCombination(selected: ExpertResult[]): void {
    if (selected.length < 2) return;

    // Create sorted pairs to normalize combinations
    const archetypes = selected.map((r) => r.expertConfig.archetype).sort();

    // Record all pairs
    for (let i = 0; i < archetypes.length; i++) {
      for (let j = i + 1; j < archetypes.length; j++) {
        const pair = `${archetypes[i]}+${archetypes[j]}`;
        const avgScore = selected.reduce((sum, r) => sum + r.score, 0) / selected.length;

        const pairData = this.archetypePairs.get(pair) ?? { scores: [], count: 0 };
        pairData.scores.push(avgScore);
        pairData.count += 1;
        this.archetypePairs.set(pair, pairData);
      }
    }
  }

  /**
   * Get comprehensive diversity statistics
   */
  getDiversityStats(): DiversityStats {
    let minScore = Infinity;
    let maxScore = -Infinity;
    let totalScore = 0;

    for (const entry of this.scoreHistory) {
      minScore = Math.min(minScore, entry.score);
      maxScore = Math.max(maxScore, entry.score);
      totalScore += entry.score;
    }

    const totalScores = this.scoreHistory.length;
    const avgScore = totalScores > 0 ? totalScore / totalScores : 0;

    // Find most and least selected archetypes
    let mostSelected: string | undefined;
    let leastSelected: string | undefined;
    let maxFreq = 0;
    let minFreq = Infinity;

    for (const [archetype, freq] of this.archetypeFrequency.entries()) {
      if (freq > maxFreq) {
        maxFreq = freq;
        mostSelected = archetype;
      }
      if (freq < minFreq) {
        minFreq = freq;
        leastSelected = archetype;
      }
    }

    // Calculate archetype pair performance
    const pairPerformance: Record<string, { count: number; avgScore: number }> = {};
    const topPairs: Array<{ pair: string; count: number; avgScore: number }> = [];

    for (const [pair, data] of this.archetypePairs.entries()) {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      pairPerformance[pair] = { count: data.count, avgScore: Math.round(avgScore) };
      topPairs.push({ pair, count: data.count, avgScore: Math.round(avgScore) });
    }

    // Sort by average score descending
    topPairs.sort((a, b) => b.avgScore - a.avgScore);

    const archetypeFrequencyRecord: Record<string, number> = {};
    for (const [archetype, freq] of this.archetypeFrequency.entries()) {
      archetypeFrequencyRecord[archetype] = freq;
    }

    return {
      totalScores,
      avgDiversityScore: Math.round(avgScore),
      minDiversityScore: minScore === Infinity ? 0 : minScore,
      maxDiversityScore: maxScore === -Infinity ? 0 : maxScore,
      archetypeFrequency: archetypeFrequencyRecord,
      mostSelectedArchetype: mostSelected,
      leastSelectedArchetype: leastSelected,
      archetypePairPerformance: pairPerformance,
      topPairCombinations: topPairs.slice(0, 5),
      recentScores: [...this.recentScores],
      lastUpdated: Date.now(),
    };
  }

  /**
   * Reset seen solutions and optionally clear metrics (for new problem)
   */
  reset(clearMetrics: boolean = false): void {
    this.seenSolutions.clear();

    if (clearMetrics) {
      this.scoreHistory = [];
      this.archetypeFrequency.clear();
      this.archetypePairs.clear();
      this.recentScores = [];
    }
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
