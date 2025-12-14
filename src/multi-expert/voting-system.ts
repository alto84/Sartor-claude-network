/**
 * Expert Voting System
 *
 * Implements multiple voting strategies for expert consensus:
 * - Majority voting (simple plurality)
 * - Ranked-choice voting (instant runoff)
 * - Borda count (positional scoring)
 * - Weighted voting (by confidence/quality)
 *
 * Inspired by Poetiq's diversity-first solution selection.
 *
 * @module multi-expert/voting-system
 */

import { ExpertResult } from './execution-engine';
import { ExpertPerformance } from './memory-integration';

/**
 * Vote cast by an expert
 */
export interface ExpertVote {
  /** Expert that cast this vote */
  expertId: string;

  /** Ranked preferences (first = most preferred) */
  rankings: string[];

  /** Weight of this vote (0-1) */
  weight: number;

  /** Confidence in the vote */
  confidence: number;
}

/**
 * Result of a voting round
 */
export interface VotingResult {
  /** Winning option ID */
  winner: string;

  /** All vote counts by option */
  voteCounts: Map<string, number>;

  /** Detailed breakdown by round (for ranked-choice) */
  rounds?: VotingRound[];

  /** Total votes cast */
  totalVotes: number;

  /** Consensus level (0-1, higher = more agreement) */
  consensusLevel: number;

  /** Voting method used */
  method: VotingMethod;
}

/**
 * Single round in ranked-choice voting
 */
export interface VotingRound {
  /** Round number */
  round: number;

  /** Vote counts at this round */
  counts: Map<string, number>;

  /** Option eliminated this round (if any) */
  eliminated?: string;

  /** Whether a winner was found */
  winnerFound: boolean;
}

/**
 * Available voting methods
 */
export type VotingMethod = 'majority' | 'ranked-choice' | 'borda' | 'weighted';

/**
 * Voting system configuration
 */
export interface VotingConfig {
  /** Voting method to use */
  method: VotingMethod;

  /** Minimum votes required for valid result */
  minVotes: number;

  /** Threshold for majority (default 0.5) */
  majorityThreshold: number;

  /** Whether to use vote weights */
  useWeights: boolean;

  /** Tie-breaking strategy */
  tieBreaker: 'random' | 'first' | 'highest-confidence';

  /** Whether to track voting history for learning */
  trackHistory: boolean;

  /** Maximum history entries to retain */
  maxHistorySize: number;

  /** Whether to track detailed metrics */
  trackMetrics?: boolean;

  /** Whether to log voting distribution */
  logVotingDistribution?: boolean;
}

/**
 * Per-vote consensus tracking
 */
export interface VoteConsensusMetric {
  /** Consensus level for this vote */
  consensusLevel: number;

  /** Method used */
  method: VotingMethod;

  /** Winner */
  winner: string;

  /** Total votes cast */
  totalVotes: number;

  /** Timestamp of vote */
  timestamp: number;
}

/**
 * Strategy performance metrics
 */
export interface StrategyMetrics {
  /** Number of times this strategy was used */
  usage: number;

  /** Average consensus level achieved */
  avgConsensus: number;

  /** Min consensus level */
  minConsensus: number;

  /** Max consensus level */
  maxConsensus: number;

  /** Standard deviation of consensus */
  stdDevConsensus: number;

  /** Winners produced by this strategy */
  winners: Map<string, number>;
}

/**
 * Voting distribution metrics
 */
export interface VotingDistribution {
  /** Option ID */
  option: string;

  /** Vote count or weight */
  votes: number;

  /** Percentage of total */
  percentage: number;

  /** Experts who voted for this option */
  expertIds: string[];
}

/**
 * Complete voting metrics
 */
export interface VotingMetrics {
  /** Total voting rounds tracked */
  totalRounds: number;

  /** Metrics per voting strategy */
  strategyMetrics: Record<VotingMethod, StrategyMetrics>;

  /** All consensus levels recorded */
  consensusHistogram: VoteConsensusMetric[];

  /** Latest voting distribution */
  latestDistribution: VotingDistribution[];

  /** Overall average consensus */
  overallAvgConsensus: number;

  /** Distribution of consensus levels (buckets 0-1 in 0.1 increments) */
  consensusBuckets: Record<string, number>;

  /** Strategy effectiveness ranking */
  strategyRanking: Array<{
    method: VotingMethod;
    avgConsensus: number;
    winRate: number;
  }>;
}

/**
 * Default voting configuration
 */
export const DEFAULT_VOTING_CONFIG: VotingConfig = {
  method: 'weighted',
  minVotes: 1,
  majorityThreshold: 0.5,
  useWeights: true,
  tieBreaker: 'highest-confidence',
  trackHistory: true,
  maxHistorySize: 100,
  trackMetrics: true,
  logVotingDistribution: true,
};

/**
 * Voting System for expert consensus
 */
export class VotingSystem {
  private config: VotingConfig;
  private votingHistory: VotingResult[];
  private consensusMetrics: VoteConsensusMetric[] = [];
  private strategyMetrics: Record<VotingMethod, StrategyMetrics> = {
    majority: {
      usage: 0,
      avgConsensus: 0,
      minConsensus: 1,
      maxConsensus: 0,
      stdDevConsensus: 0,
      winners: new Map(),
    },
    'ranked-choice': {
      usage: 0,
      avgConsensus: 0,
      minConsensus: 1,
      maxConsensus: 0,
      stdDevConsensus: 0,
      winners: new Map(),
    },
    borda: {
      usage: 0,
      avgConsensus: 0,
      minConsensus: 1,
      maxConsensus: 0,
      stdDevConsensus: 0,
      winners: new Map(),
    },
    weighted: {
      usage: 0,
      avgConsensus: 0,
      minConsensus: 1,
      maxConsensus: 0,
      stdDevConsensus: 0,
      winners: new Map(),
    },
  };
  private latestDistribution: VotingDistribution[] = [];

  constructor(config: Partial<VotingConfig> = {}) {
    this.config = { ...DEFAULT_VOTING_CONFIG, ...config };
    this.votingHistory = [];
  }

  /**
   * Run voting on a set of options with expert votes
   */
  vote(votes: ExpertVote[], options: string[]): VotingResult {
    if (votes.length < this.config.minVotes) {
      throw new Error(`Minimum ${this.config.minVotes} votes required, got ${votes.length}`);
    }

    let result: VotingResult;

    switch (this.config.method) {
      case 'majority':
        result = this.majorityVote(votes, options);
        break;
      case 'ranked-choice':
        result = this.rankedChoiceVote(votes, options);
        break;
      case 'borda':
        result = this.bordaCount(votes, options);
        break;
      case 'weighted':
        result = this.weightedVote(votes, options);
        break;
      default:
        throw new Error(`Unknown voting method: ${this.config.method}`);
    }

    // Record history if enabled
    if (this.config.trackHistory) {
      this.recordVotingHistory(result);
    }

    // Track metrics if enabled
    if (this.config.trackMetrics !== false) {
      this.trackConsensusMetric(result);
      this.trackStrategyPerformance(result, votes, options);
    }

    // Log voting distribution if enabled
    if (this.config.logVotingDistribution !== false) {
      this.logVotingDistribution(result, votes);
    }

    return result;
  }

  /**
   * Create votes from expert results
   */
  createVotesFromResults(results: ExpertResult[]): ExpertVote[] {
    // Sort results by score to create rankings
    const sortedResults = [...results].filter((r) => r.success).sort((a, b) => b.score - a.score);

    return results
      .filter((r) => r.success)
      .map((result) => ({
        expertId: result.expertId,
        rankings: sortedResults.map((r) => r.expertId),
        weight: result.expertConfig.votingWeight,
        confidence: result.confidence,
      }));
  }

  /**
   * Simple majority voting (plurality)
   */
  private majorityVote(votes: ExpertVote[], options: string[]): VotingResult {
    const voteCounts = new Map<string, number>();
    options.forEach((opt) => voteCounts.set(opt, 0));

    // Count first-choice votes
    for (const vote of votes) {
      const firstChoice = vote.rankings[0];
      if (firstChoice && voteCounts.has(firstChoice)) {
        const weight = this.config.useWeights ? vote.weight : 1;
        voteCounts.set(firstChoice, (voteCounts.get(firstChoice) || 0) + weight);
      }
    }

    const winner = this.findWinner(voteCounts, votes);
    const totalVotes = this.config.useWeights
      ? votes.reduce((sum, v) => sum + v.weight, 0)
      : votes.length;

    return {
      winner,
      voteCounts,
      totalVotes,
      consensusLevel: this.calculateConsensus(voteCounts, totalVotes),
      method: 'majority',
    };
  }

  /**
   * Ranked-choice voting (instant runoff)
   */
  private rankedChoiceVote(votes: ExpertVote[], options: string[]): VotingResult {
    const rounds: VotingRound[] = [];
    let remainingOptions = [...options];
    const workingVotes = votes.map((v) => ({ ...v, rankings: [...v.rankings] }));
    const totalVotes = this.config.useWeights
      ? votes.reduce((sum, v) => sum + v.weight, 0)
      : votes.length;

    while (remainingOptions.length > 1) {
      // Count first-choice votes
      const counts = new Map<string, number>();
      remainingOptions.forEach((opt) => counts.set(opt, 0));

      for (const vote of workingVotes) {
        const firstChoice = vote.rankings.find((r) => remainingOptions.includes(r));
        if (firstChoice) {
          const weight = this.config.useWeights ? vote.weight : 1;
          counts.set(firstChoice, (counts.get(firstChoice) || 0) + weight);
        }
      }

      // Check for majority winner
      for (const [option, count] of Array.from(counts.entries())) {
        if (count / totalVotes > this.config.majorityThreshold) {
          rounds.push({
            round: rounds.length + 1,
            counts: new Map(counts),
            winnerFound: true,
          });

          return {
            winner: option,
            voteCounts: counts,
            rounds,
            totalVotes,
            consensusLevel: count / totalVotes,
            method: 'ranked-choice',
          };
        }
      }

      // Eliminate lowest option
      let minCount = Infinity;
      let eliminated = '';
      for (const [option, count] of Array.from(counts.entries())) {
        if (count < minCount) {
          minCount = count;
          eliminated = option;
        }
      }

      rounds.push({
        round: rounds.length + 1,
        counts: new Map(counts),
        eliminated,
        winnerFound: false,
      });

      remainingOptions = remainingOptions.filter((o) => o !== eliminated);
    }

    // Final winner
    const winner = remainingOptions[0] || options[0];
    const finalCounts = new Map<string, number>();
    finalCounts.set(winner, totalVotes);

    return {
      winner,
      voteCounts: finalCounts,
      rounds,
      totalVotes,
      consensusLevel: 1, // Last remaining wins by default
      method: 'ranked-choice',
    };
  }

  /**
   * Borda count voting (positional scoring)
   */
  private bordaCount(votes: ExpertVote[], options: string[]): VotingResult {
    const voteCounts = new Map<string, number>();
    options.forEach((opt) => voteCounts.set(opt, 0));

    const n = options.length;

    for (const vote of votes) {
      const weight = this.config.useWeights ? vote.weight : 1;

      // Award points based on position (n-1 for first, n-2 for second, etc.)
      for (let i = 0; i < vote.rankings.length; i++) {
        const option = vote.rankings[i];
        if (voteCounts.has(option)) {
          const points = (n - 1 - i) * weight;
          voteCounts.set(option, (voteCounts.get(option) || 0) + points);
        }
      }
    }

    const winner = this.findWinner(voteCounts, votes);
    const maxPossiblePoints =
      (n - 1) *
      (this.config.useWeights ? votes.reduce((sum, v) => sum + v.weight, 0) : votes.length);

    return {
      winner,
      voteCounts,
      totalVotes: votes.length,
      consensusLevel: (voteCounts.get(winner) || 0) / maxPossiblePoints,
      method: 'borda',
    };
  }

  /**
   * Weighted voting (by confidence and score)
   */
  private weightedVote(votes: ExpertVote[], options: string[]): VotingResult {
    const voteCounts = new Map<string, number>();
    options.forEach((opt) => voteCounts.set(opt, 0));

    for (const vote of votes) {
      const firstChoice = vote.rankings[0];
      if (firstChoice && voteCounts.has(firstChoice)) {
        // Combine weight and confidence
        const effectiveWeight = vote.weight * vote.confidence;
        voteCounts.set(firstChoice, (voteCounts.get(firstChoice) || 0) + effectiveWeight);
      }
    }

    const winner = this.findWinner(voteCounts, votes);
    const totalWeight = votes.reduce((sum, v) => sum + v.weight * v.confidence, 0);

    return {
      winner,
      voteCounts,
      totalVotes: votes.length,
      consensusLevel: this.calculateConsensus(voteCounts, totalWeight),
      method: 'weighted',
    };
  }

  /**
   * Find winner from vote counts, handling ties
   */
  private findWinner(voteCounts: Map<string, number>, votes: ExpertVote[]): string {
    let maxVotes = -1;
    const winners: string[] = [];

    for (const [option, count] of Array.from(voteCounts.entries())) {
      if (count > maxVotes) {
        maxVotes = count;
        winners.length = 0;
        winners.push(option);
      } else if (count === maxVotes) {
        winners.push(option);
      }
    }

    if (winners.length === 1) {
      return winners[0];
    }

    // Tie-breaking
    switch (this.config.tieBreaker) {
      case 'random':
        return winners[Math.floor(Math.random() * winners.length)];

      case 'first':
        return winners[0];

      case 'highest-confidence': {
        // Find the expert with highest confidence who voted for one of the tied options
        let bestOption = winners[0];
        let bestConfidence = 0;

        for (const vote of votes) {
          if (winners.includes(vote.rankings[0]) && vote.confidence > bestConfidence) {
            bestConfidence = vote.confidence;
            bestOption = vote.rankings[0];
          }
        }
        return bestOption;
      }

      default:
        return winners[0];
    }
  }

  /**
   * Calculate consensus level from vote distribution
   */
  private calculateConsensus(voteCounts: Map<string, number>, totalVotes: number): number {
    if (totalVotes === 0) return 0;

    const counts = Array.from(voteCounts.values());
    const maxCount = Math.max(...counts);

    // Consensus = winner's share of votes
    return maxCount / totalVotes;
  }

  /**
   * Calculate vote weights from expert performance history
   *
   * Uses a scoring formula that combines:
   * - Success rate (40% weight)
   * - Average score (40% weight)
   * - Average confidence (20% weight)
   *
   * Normalized to 0-1 range with baseline weight of 0.5 for unknown experts
   */
  calculateWeights(expertHistory: ExpertPerformance[]): Map<string, number> {
    const weights = new Map<string, number>();

    if (expertHistory.length === 0) {
      return weights;
    }

    // Find max values for normalization
    const maxScore = Math.max(...expertHistory.map((h) => h.avgScore), 1);
    const maxConfidence = Math.max(...expertHistory.map((h) => h.avgConfidence), 1);

    for (const history of expertHistory) {
      // Weighted combination of metrics
      const successComponent = history.successRate * 0.4;
      const scoreComponent = (history.avgScore / maxScore) * 0.4;
      const confidenceComponent = (history.avgConfidence / maxConfidence) * 0.2;

      // Combine and clamp to 0-1
      const weight = Math.max(0, Math.min(1, successComponent + scoreComponent + confidenceComponent));

      weights.set(history.expertId, weight);
    }

    return weights;
  }

  /**
   * Record voting result to history
   */
  recordVotingHistory(result: VotingResult): void {
    this.votingHistory.push(result);

    // Trim history if exceeds max size
    if (this.votingHistory.length > this.config.maxHistorySize) {
      this.votingHistory = this.votingHistory.slice(-this.config.maxHistorySize);
    }
  }

  /**
   * Get voting history
   */
  getVotingHistory(): VotingResult[] {
    return [...this.votingHistory];
  }

  /**
   * Clear voting history
   */
  clearVotingHistory(): void {
    this.votingHistory = [];
  }

  /**
   * Track consensus metric from voting result
   */
  private trackConsensusMetric(result: VotingResult): void {
    // Stub implementation - tracks voting consensus metrics
    this.consensusMetrics.push({
      consensusLevel: result.consensusLevel,
      method: result.method,
      winner: result.winner,
      totalVotes: result.totalVotes,
      timestamp: Date.now(),
    });
  }

  /**
   * Track strategy performance metrics
   */
  private trackStrategyPerformance(
    result: VotingResult,
    votes: ExpertVote[],
    options: string[]
  ): void {
    // Stub implementation - tracks strategy performance
    const metrics = this.strategyMetrics[result.method];
    if (metrics) {
      metrics.usage++;
      metrics.avgConsensus = (metrics.avgConsensus * (metrics.usage - 1) + result.consensusLevel) / metrics.usage;
      metrics.maxConsensus = Math.max(metrics.maxConsensus, result.consensusLevel);
      metrics.minConsensus = Math.min(metrics.minConsensus, result.consensusLevel);

      const currentCount = metrics.winners.get(result.winner) || 0;
      metrics.winners.set(result.winner, currentCount + 1);
    }
  }

  /**
   * Log voting distribution
   */
  private logVotingDistribution(result: VotingResult, votes: ExpertVote[]): void {
    // Stub implementation - logs voting distribution
    this.latestDistribution = Array.from(result.voteCounts.entries()).map(([option, count]) => ({
      option,
      votes: count,
      percentage: (count / result.totalVotes) * 100,
      expertIds: votes
        .filter((vote) => vote.rankings[0] === option)
        .map((vote) => vote.expertId),
    }));
  }

  /**
   * Get voting statistics from history
   */
  getVotingStats(): {
    totalVotes: number;
    averageConsensus: number;
    methodCounts: Record<VotingMethod, number>;
    winnerFrequency: Map<string, number>;
  } {
    if (this.votingHistory.length === 0) {
      return {
        totalVotes: 0,
        averageConsensus: 0,
        methodCounts: {
          majority: 0,
          'ranked-choice': 0,
          borda: 0,
          weighted: 0,
        },
        winnerFrequency: new Map(),
      };
    }

    const methodCounts: Record<VotingMethod, number> = {
      majority: 0,
      'ranked-choice': 0,
      borda: 0,
      weighted: 0,
    };

    const winnerFrequency = new Map<string, number>();
    let totalConsensus = 0;

    for (const result of this.votingHistory) {
      methodCounts[result.method]++;
      totalConsensus += result.consensusLevel;

      const currentCount = winnerFrequency.get(result.winner) || 0;
      winnerFrequency.set(result.winner, currentCount + 1);
    }

    return {
      totalVotes: this.votingHistory.length,
      averageConsensus: totalConsensus / this.votingHistory.length,
      methodCounts,
      winnerFrequency,
    };
  }
}

/**
 * Quick voting helper
 */
export function quickVote(
  results: ExpertResult[],
  method: VotingMethod = 'weighted'
): VotingResult {
  const votingSystem = new VotingSystem({ method });
  const votes = votingSystem.createVotesFromResults(results);
  const options = results.filter((r) => r.success).map((r) => r.expertId);

  return votingSystem.vote(votes, options);
}
