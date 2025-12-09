/**
 * Soft Scorer
 *
 * Implements 0-100 soft scoring for expert results.
 * Unlike binary pass/fail, soft scoring allows nuanced evaluation
 * with partial credit and multiple scoring dimensions.
 *
 * Inspired by Poetiq's scoring system for ARC-AGI puzzles.
 *
 * @module multi-expert/soft-scorer
 */

import { ExpertResult } from './execution-engine';

/**
 * Detailed soft score breakdown
 */
export interface SoftScore {
  /** Overall score (0-100) */
  overall: number;

  /** Correctness component */
  correctness: number;

  /** Completeness component */
  completeness: number;

  /** Quality component */
  quality: number;

  /** Efficiency component */
  efficiency: number;

  /** Confidence-weighted score */
  weightedScore: number;

  /** Pass/fail determination */
  passed: boolean;

  /** Detailed breakdown by criteria */
  breakdown: ScoreBreakdown;
}

/**
 * Detailed score breakdown
 */
export interface ScoreBreakdown {
  /** Individual criterion scores */
  criteria: CriterionScore[];

  /** Bonus points awarded */
  bonuses: BonusScore[];

  /** Penalty points deducted */
  penalties: PenaltyScore[];

  /** Raw score before adjustments */
  rawScore: number;

  /** Final adjusted score */
  adjustedScore: number;
}

/**
 * Score for a single criterion
 */
export interface CriterionScore {
  /** Criterion name */
  name: string;

  /** Score achieved (0-100) */
  score: number;

  /** Weight of this criterion */
  weight: number;

  /** Contribution to overall score */
  contribution: number;

  /** Optional feedback */
  feedback?: string;
}

/**
 * Bonus score component
 */
export interface BonusScore {
  /** Bonus name */
  name: string;

  /** Points awarded */
  points: number;

  /** Reason for bonus */
  reason: string;
}

/**
 * Penalty score component
 */
export interface PenaltyScore {
  /** Penalty name */
  name: string;

  /** Points deducted */
  points: number;

  /** Reason for penalty */
  reason: string;
}

/**
 * Scoring criterion definition
 */
export interface ScoringCriterion {
  /** Criterion name */
  name: string;

  /** Weight in overall score (0-1) */
  weight: number;

  /** Scoring function */
  scorer: (result: ExpertResult, context?: unknown) => number;

  /** Description */
  description: string;
}

/**
 * Soft scorer configuration
 */
export interface SoftScorerConfig {
  /** Pass threshold (0-100) */
  passThreshold: number;

  /** Excellent threshold (0-100) */
  excellentThreshold: number;

  /** Whether to apply confidence weighting */
  useConfidenceWeighting: boolean;

  /** Maximum bonus points */
  maxBonus: number;

  /** Maximum penalty points */
  maxPenalty: number;

  /** Custom criteria to use */
  criteria: ScoringCriterion[];
}

/**
 * Default soft scorer configuration
 */
export const DEFAULT_SOFT_SCORER_CONFIG: SoftScorerConfig = {
  passThreshold: 60,
  excellentThreshold: 85,
  useConfidenceWeighting: true,
  maxBonus: 15,
  maxPenalty: 20,
  criteria: [],
};

/**
 * Default scoring criteria
 */
export const DEFAULT_CRITERIA: ScoringCriterion[] = [
  {
    name: 'correctness',
    weight: 0.4,
    description: 'How correct is the solution?',
    scorer: (result) => result.score, // Use raw score as correctness proxy
  },
  {
    name: 'confidence',
    weight: 0.2,
    description: 'How confident is the expert in the solution?',
    scorer: (result) => result.confidence * 100,
  },
  {
    name: 'efficiency',
    weight: 0.2,
    description: 'How efficient was the solution process?',
    scorer: (result) => {
      // Fewer iterations = more efficient
      const maxIter = result.expertConfig.maxIterations;
      const usedIter = result.iterations;
      return ((maxIter - usedIter + 1) / maxIter) * 100;
    },
  },
  {
    name: 'timeliness',
    weight: 0.2,
    description: 'How quickly was the solution produced?',
    scorer: (result) => {
      // Score based on duration vs timeout
      const timeout = result.expertConfig.totalTimeout;
      const duration = result.durationMs;
      const ratio = duration / timeout;
      return Math.max(0, (1 - ratio) * 100);
    },
  },
];

/**
 * Soft Scorer for nuanced evaluation
 */
export class SoftScorer {
  private config: SoftScorerConfig;
  private criteria: ScoringCriterion[];

  constructor(config: Partial<SoftScorerConfig> = {}) {
    this.config = { ...DEFAULT_SOFT_SCORER_CONFIG, ...config };
    this.criteria =
      this.config.criteria.length > 0 ? this.config.criteria : DEFAULT_CRITERIA;
  }

  /**
   * Score a single expert result
   */
  score(result: ExpertResult, context?: unknown): SoftScore {
    if (!result.success) {
      return this.createFailedScore(result);
    }

    // Score each criterion
    const criterionScores = this.scoreCriteria(result, context);

    // Calculate weighted sum
    const rawScore = criterionScores.reduce(
      (sum, cs) => sum + cs.contribution,
      0
    );

    // Calculate bonuses and penalties
    const bonuses = this.calculateBonuses(result, rawScore);
    const penalties = this.calculatePenalties(result, rawScore);

    const bonusTotal = Math.min(
      bonuses.reduce((sum, b) => sum + b.points, 0),
      this.config.maxBonus
    );
    const penaltyTotal = Math.min(
      penalties.reduce((sum, p) => sum + p.points, 0),
      this.config.maxPenalty
    );

    const adjustedScore = Math.max(0, Math.min(100, rawScore + bonusTotal - penaltyTotal));

    // Confidence weighting
    const weightedScore = this.config.useConfidenceWeighting
      ? adjustedScore * (0.5 + 0.5 * result.confidence)
      : adjustedScore;

    // Extract component scores
    const correctness = this.getCriterionScore(criterionScores, 'correctness');
    const completeness = rawScore; // Use overall as completeness proxy
    const quality = this.getCriterionScore(criterionScores, 'confidence');
    const efficiency = this.getCriterionScore(criterionScores, 'efficiency');

    return {
      overall: Math.round(adjustedScore),
      correctness: Math.round(correctness),
      completeness: Math.round(completeness),
      quality: Math.round(quality),
      efficiency: Math.round(efficiency),
      weightedScore: Math.round(weightedScore),
      passed: adjustedScore >= this.config.passThreshold,
      breakdown: {
        criteria: criterionScores,
        bonuses,
        penalties,
        rawScore: Math.round(rawScore),
        adjustedScore: Math.round(adjustedScore),
      },
    };
  }

  /**
   * Score all results and rank
   */
  scoreAll(results: ExpertResult[], context?: unknown): Array<{ result: ExpertResult; score: SoftScore }> {
    return results
      .map((result) => ({
        result,
        score: this.score(result, context),
      }))
      .sort((a, b) => b.score.overall - a.score.overall);
  }

  /**
   * Get top N results by score
   */
  getTopResults(results: ExpertResult[], n: number, context?: unknown): ExpertResult[] {
    const scored = this.scoreAll(results, context);
    return scored.slice(0, n).map((s) => s.result);
  }

  /**
   * Get results that pass threshold
   */
  getPassingResults(results: ExpertResult[], context?: unknown): ExpertResult[] {
    const scored = this.scoreAll(results, context);
    return scored
      .filter((s) => s.score.passed)
      .map((s) => s.result);
  }

  /**
   * Calculate aggregate statistics for a pool
   */
  calculatePoolStats(results: ExpertResult[], context?: unknown): PoolStats {
    const scored = this.scoreAll(results, context);

    if (scored.length === 0) {
      return {
        count: 0,
        avgScore: 0,
        minScore: 0,
        maxScore: 0,
        stdDev: 0,
        passRate: 0,
        excellentRate: 0,
      };
    }

    const scores = scored.map((s) => s.score.overall);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    const passCount = scored.filter((s) => s.score.passed).length;
    const excellentCount = scored.filter(
      (s) => s.score.overall >= this.config.excellentThreshold
    ).length;

    return {
      count: scored.length,
      avgScore: Math.round(avgScore),
      minScore: Math.round(minScore),
      maxScore: Math.round(maxScore),
      stdDev: Math.round(stdDev * 10) / 10,
      passRate: Math.round((passCount / scored.length) * 100),
      excellentRate: Math.round((excellentCount / scored.length) * 100),
    };
  }

  /**
   * Score criteria
   */
  private scoreCriteria(result: ExpertResult, context?: unknown): CriterionScore[] {
    return this.criteria.map((criterion) => {
      const score = criterion.scorer(result, context);
      const contribution = score * criterion.weight;

      return {
        name: criterion.name,
        score: Math.round(score),
        weight: criterion.weight,
        contribution: Math.round(contribution),
      };
    });
  }

  /**
   * Calculate bonus points
   */
  private calculateBonuses(result: ExpertResult, rawScore: number): BonusScore[] {
    const bonuses: BonusScore[] = [];

    // High confidence bonus
    if (result.confidence >= 0.95) {
      bonuses.push({
        name: 'high-confidence',
        points: 5,
        reason: 'Expert has very high confidence (>=95%)',
      });
    }

    // Early completion bonus
    if (result.iterations === 1 && rawScore >= 80) {
      bonuses.push({
        name: 'early-completion',
        points: 5,
        reason: 'Solved in first iteration with high quality',
      });
    }

    // Fast execution bonus
    const timeRatio = result.durationMs / result.expertConfig.taskTimeout;
    if (timeRatio < 0.25 && rawScore >= 70) {
      bonuses.push({
        name: 'fast-execution',
        points: 5,
        reason: 'Completed in under 25% of timeout',
      });
    }

    return bonuses;
  }

  /**
   * Calculate penalty points
   */
  private calculatePenalties(result: ExpertResult, rawScore: number): PenaltyScore[] {
    const penalties: PenaltyScore[] = [];

    // Low confidence penalty
    if (result.confidence < 0.5) {
      penalties.push({
        name: 'low-confidence',
        points: 10,
        reason: 'Expert has low confidence (<50%)',
      });
    }

    // Max iterations penalty
    if (result.iterations >= result.expertConfig.maxIterations) {
      penalties.push({
        name: 'max-iterations',
        points: 5,
        reason: 'Used all available iterations',
      });
    }

    // Timeout warning penalty
    const timeRatio = result.durationMs / result.expertConfig.totalTimeout;
    if (timeRatio > 0.9) {
      penalties.push({
        name: 'near-timeout',
        points: 5,
        reason: 'Nearly exceeded timeout limit',
      });
    }

    return penalties;
  }

  /**
   * Create score for failed result
   */
  private createFailedScore(result: ExpertResult): SoftScore {
    return {
      overall: 0,
      correctness: 0,
      completeness: 0,
      quality: 0,
      efficiency: 0,
      weightedScore: 0,
      passed: false,
      breakdown: {
        criteria: [],
        bonuses: [],
        penalties: [
          {
            name: 'execution-failed',
            points: 100,
            reason: result.error || 'Expert execution failed',
          },
        ],
        rawScore: 0,
        adjustedScore: 0,
      },
    };
  }

  /**
   * Get score for a specific criterion
   */
  private getCriterionScore(scores: CriterionScore[], name: string): number {
    const found = scores.find((s) => s.name === name);
    return found?.score || 0;
  }
}

/**
 * Pool statistics
 */
export interface PoolStats {
  /** Number of results */
  count: number;

  /** Average score */
  avgScore: number;

  /** Minimum score */
  minScore: number;

  /** Maximum score */
  maxScore: number;

  /** Standard deviation */
  stdDev: number;

  /** Percentage that passed */
  passRate: number;

  /** Percentage that were excellent */
  excellentRate: number;
}

/**
 * Quick scoring helper
 */
export function quickScore(result: ExpertResult): SoftScore {
  const scorer = new SoftScorer();
  return scorer.score(result);
}

/**
 * Score and rank results
 */
export function rankResults(results: ExpertResult[]): Array<{ result: ExpertResult; score: SoftScore }> {
  const scorer = new SoftScorer();
  return scorer.scoreAll(results);
}
