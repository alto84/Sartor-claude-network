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
};

/**
 * Voting System for expert consensus
 */
export class VotingSystem {
  private config: VotingConfig;

  constructor(config: Partial<VotingConfig> = {}) {
    this.config = { ...DEFAULT_VOTING_CONFIG, ...config };
  }

  /**
   * Run voting on a set of options with expert votes
   */
  vote(votes: ExpertVote[], options: string[]): VotingResult {
    if (votes.length < this.config.minVotes) {
      throw new Error(`Minimum ${this.config.minVotes} votes required, got ${votes.length}`);
    }

    switch (this.config.method) {
      case 'majority':
        return this.majorityVote(votes, options);
      case 'ranked-choice':
        return this.rankedChoiceVote(votes, options);
      case 'borda':
        return this.bordaCount(votes, options);
      case 'weighted':
        return this.weightedVote(votes, options);
      default:
        throw new Error(`Unknown voting method: ${this.config.method}`);
    }
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
      for (const [option, count] of counts) {
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
      for (const [option, count] of counts) {
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

    for (const [option, count] of voteCounts) {
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
