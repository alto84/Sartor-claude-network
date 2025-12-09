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

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A'], weight: 1, confidence: 0.9 },
      ];

      expect(() => voting.vote(votes, ['A', 'B'])).toThrow('Minimum 3 votes required');
    });

    test('handles single option', () => {
      const voting = new VotingSystem({ method: 'majority' });

      const votes: ExpertVote[] = [
        { expertId: 'e1', rankings: ['A'], weight: 1, confidence: 0.9 },
      ];

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
});
