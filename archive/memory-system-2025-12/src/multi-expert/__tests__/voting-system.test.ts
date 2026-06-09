/**
 * Tests for Voting System
 */

import {
  VotingSystem,
  ExpertVote,
  DEFAULT_VOTING_CONFIG,
  quickVote,
  createExpertConfig,
  createMockExecutor,
  ExecutionEngine,
  ExpertTask,
  ExpertPerformance,
} from '../index';

describe('VotingSystem', () => {
  describe('Majority Voting', () => {
    test('selects option with most votes', () => {
      const voting = new VotingSystem({ method: 'majority' });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A', 'B', 'C'], weight: 1, confidence: 0.9 },
        { expertId: 'e2', rankings: ['A', 'C', 'B'], weight: 1, confidence: 0.8 },
        { expertId: 'e3', rankings: ['B', 'A', 'C'], weight: 1, confidence: 0.7 },
      ];

      const result = voting.vote(votes, ['A', 'B', 'C']);

      expect(result.winner).toBe('A');
      expect(result.method).toBe('majority');
      expect(result.voteCounts.get('A')).toBe(2);
      expect(result.voteCounts.get('B')).toBe(1);
    });

    test('handles weighted votes', () => {
      const voting = new VotingSystem({ method: 'majority', useWeights: true });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A', 'B'], weight: 0.5, confidence: 0.9 },
        { expertId: 'e2', rankings: ['B', 'A'], weight: 1.0, confidence: 0.8 },
      ];

      const result = voting.vote(votes, ['A', 'B']);

      expect(result.winner).toBe('B');
      expect(result.voteCounts.get('A')).toBe(0.5);
      expect(result.voteCounts.get('B')).toBe(1.0);
    });
  });

  describe('Ranked-Choice Voting', () => {
    test('eliminates lowest and redistributes', () => {
      const voting = new VotingSystem({ method: 'ranked-choice' });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A', 'B', 'C'], weight: 1, confidence: 0.9 },
        { expertId: 'e2', rankings: ['B', 'A', 'C'], weight: 1, confidence: 0.8 },
        { expertId: 'e3', rankings: ['C', 'B', 'A'], weight: 1, confidence: 0.7 },
        { expertId: 'e4', rankings: ['C', 'B', 'A'], weight: 1, confidence: 0.7 },
      ];

      const result = voting.vote(votes, ['A', 'B', 'C']);

      expect(result.method).toBe('ranked-choice');
      expect(result.rounds).toBeDefined();
      expect(result.rounds!.length).toBeGreaterThan(0);
    });

    test('finds majority winner early', () => {
      const voting = new VotingSystem({ method: 'ranked-choice', majorityThreshold: 0.5 });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A'], weight: 1, confidence: 0.9 },
        { expertId: 'e2', rankings: ['A'], weight: 1, confidence: 0.9 },
        { expertId: 'e3', rankings: ['A'], weight: 1, confidence: 0.9 },
        { expertId: 'e4', rankings: ['B'], weight: 1, confidence: 0.9 },
      ];

      const result = voting.vote(votes, ['A', 'B']);

      expect(result.winner).toBe('A');
      expect(result.consensusLevel).toBeGreaterThan(0.5);
    });
  });

  describe('Borda Count', () => {
    test('awards points based on ranking', () => {
      const voting = new VotingSystem({ method: 'borda', useWeights: false });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A', 'B', 'C'], weight: 1, confidence: 0.9 },
        { expertId: 'e2', rankings: ['B', 'A', 'C'], weight: 1, confidence: 0.9 },
        { expertId: 'e3', rankings: ['B', 'C', 'A'], weight: 1, confidence: 0.9 },
      ];

      const result = voting.vote(votes, ['A', 'B', 'C']);

      expect(result.method).toBe('borda');
      // B should win: gets 2+2+2 = 6 first/second place points
      // A gets: 2+1+0 = 3 points
      expect(result.winner).toBe('B');
    });
  });

  describe('Weighted Voting', () => {
    test('combines weight and confidence', () => {
      const voting = new VotingSystem({ method: 'weighted' });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A'], weight: 1.0, confidence: 0.5 },
        { expertId: 'e2', rankings: ['B'], weight: 0.5, confidence: 1.0 },
      ];

      const result = voting.vote(votes, ['A', 'B']);

      expect(result.method).toBe('weighted');
      // e1: 1.0 * 0.5 = 0.5, e2: 0.5 * 1.0 = 0.5 - tie
      expect(['A', 'B']).toContain(result.winner);
    });

    test('higher confidence breaks ties', () => {
      const voting = new VotingSystem({
        method: 'weighted',
        tieBreaker: 'highest-confidence',
      });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A'], weight: 1.0, confidence: 0.6 },
        { expertId: 'e2', rankings: ['B'], weight: 1.0, confidence: 0.9 },
      ];

      const result = voting.vote(votes, ['A', 'B']);

      // e2 has higher confidence, so B should win tie
      expect(result.winner).toBe('B');
    });
  });

  describe('Edge Cases', () => {
    test('throws on insufficient votes', () => {
      const voting = new VotingSystem({ minVotes: 3 });

      const votes: ExpertVote[] = [{ expertId: 'e1', rankings: ['A'], weight: 1, confidence: 0.9 }];

      expect(() => voting.vote(votes, ['A', 'B'])).toThrow('Minimum 3 votes required');
    });

    test('handles single option', () => {
      const voting = new VotingSystem({ method: 'majority' });

      const votes: ExpertVote[] = [{ expertId: 'e1', rankings: ['A'], weight: 1, confidence: 0.9 }];

      const result = voting.vote(votes, ['A']);

      expect(result.winner).toBe('A');
      expect(result.consensusLevel).toBe(1);
    });
  });

  describe('Integration', () => {
    test('quickVote with execution results', async () => {
      const executor = createMockExecutor();
      const engine = new ExecutionEngine(executor);

      const task: ExpertTask = {
        id: 'vote-test',
        description: 'Test voting',
        type: 'test',
        input: {},
      };

      const experts = [
        createExpertConfig('e1', 'Expert 1', 'performance'),
        createExpertConfig('e2', 'Expert 2', 'safety'),
        createExpertConfig('e3', 'Expert 3', 'balanced'),
      ];

      const execResult = await engine.executeWithExperts(task, experts);
      const voteResult = quickVote(execResult.results);

      expect(voteResult.winner).toBeDefined();
      expect(voteResult.totalVotes).toBe(execResult.successCount);
    });
  });

  describe('Voting History', () => {
    test('records voting history when enabled', () => {
      const voting = new VotingSystem({ method: 'majority', trackHistory: true });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A', 'B'], weight: 1, confidence: 0.9 },
        { expertId: 'e2', rankings: ['B', 'A'], weight: 1, confidence: 0.8 },
      ];

      const result1 = voting.vote(votes, ['A', 'B']);
      const result2 = voting.vote(votes, ['A', 'B']);

      const history = voting.getVotingHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual(result1);
      expect(history[1]).toEqual(result2);
    });

    test('does not record history when disabled', () => {
      const voting = new VotingSystem({ method: 'majority', trackHistory: false });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A'], weight: 1, confidence: 0.9 },
      ];

      voting.vote(votes, ['A']);
      const history = voting.getVotingHistory();

      expect(history).toHaveLength(0);
    });

    test('respects max history size', () => {
      const voting = new VotingSystem({
        method: 'majority',
        trackHistory: true,
        maxHistorySize: 2,
      });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A'], weight: 1, confidence: 0.9 },
      ];

      voting.vote(votes, ['A']);
      voting.vote(votes, ['A']);
      voting.vote(votes, ['A']);

      const history = voting.getVotingHistory();
      expect(history).toHaveLength(2);
    });

    test('clears history', () => {
      const voting = new VotingSystem({ method: 'majority', trackHistory: true });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A'], weight: 1, confidence: 0.9 },
      ];

      voting.vote(votes, ['A']);
      expect(voting.getVotingHistory()).toHaveLength(1);

      voting.clearVotingHistory();
      expect(voting.getVotingHistory()).toHaveLength(0);
    });

    test('calculates voting statistics', () => {
      const voting = new VotingSystem({ method: 'majority', trackHistory: true });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A', 'B'], weight: 1, confidence: 0.9 },
        { expertId: 'e2', rankings: ['A', 'B'], weight: 1, confidence: 0.8 },
      ];

      voting.vote(votes, ['A', 'B']);
      voting.vote(votes, ['A', 'B']);

      const stats = voting.getVotingStats();

      expect(stats.totalVotes).toBe(2);
      expect(stats.averageConsensus).toBeGreaterThan(0);
      expect(stats.methodCounts.majority).toBe(2);
      expect(stats.winnerFrequency.get('A')).toBe(2);
    });
  });

  describe('Weight Calculation', () => {
    test('calculates weights from expert performance', () => {
      const voting = new VotingSystem();

      const expertHistory: ExpertPerformance[] = [
        {
          expertId: 'e1',
          totalExecutions: 10,
          avgScore: 85,
          avgConfidence: 0.9,
          successRate: 0.9,
        },
        {
          expertId: 'e2',
          totalExecutions: 10,
          avgScore: 65,
          avgConfidence: 0.7,
          successRate: 0.6,
        },
        {
          expertId: 'e3',
          totalExecutions: 10,
          avgScore: 50,
          avgConfidence: 0.5,
          successRate: 0.4,
        },
      ];

      const weights = voting.calculateWeights(expertHistory);

      expect(weights.size).toBe(3);
      expect(weights.get('e1')).toBeGreaterThan(weights.get('e2')!);
      expect(weights.get('e2')).toBeGreaterThan(weights.get('e3')!);

      // All weights should be in 0-1 range
      for (const weight of weights.values()) {
        expect(weight).toBeGreaterThanOrEqual(0);
        expect(weight).toBeLessThanOrEqual(1);
      }
    });

    test('handles empty expert history', () => {
      const voting = new VotingSystem();
      const weights = voting.calculateWeights([]);

      expect(weights.size).toBe(0);
    });

    test('normalizes weights correctly', () => {
      const voting = new VotingSystem();

      const expertHistory: ExpertPerformance[] = [
        {
          expertId: 'e1',
          totalExecutions: 5,
          avgScore: 100,
          avgConfidence: 1.0,
          successRate: 1.0,
        },
        {
          expertId: 'e2',
          totalExecutions: 5,
          avgScore: 0,
          avgConfidence: 0,
          successRate: 0,
        },
      ];

      const weights = voting.calculateWeights(expertHistory);

      // Best performer should get high weight
      expect(weights.get('e1')).toBeGreaterThan(0.8);

      // Worst performer should get low weight
      expect(weights.get('e2')).toBeLessThan(0.3);
    });

    test('combines success rate, score, and confidence', () => {
      const voting = new VotingSystem();

      // Expert with high score but low success rate
      const expertHistory: ExpertPerformance[] = [
        {
          expertId: 'e1',
          totalExecutions: 10,
          avgScore: 90,
          avgConfidence: 0.9,
          successRate: 0.3,
        },
        {
          expertId: 'e2',
          totalExecutions: 10,
          avgScore: 70,
          avgConfidence: 0.7,
          successRate: 0.9,
        },
      ];

      const weights = voting.calculateWeights(expertHistory);

      // Both should have reasonable weights since they excel in different areas
      expect(weights.get('e1')).toBeGreaterThan(0.3);
      expect(weights.get('e2')).toBeGreaterThan(0.5);
    });
  });
});
