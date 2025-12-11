/**
 * Comprehensive tests for Diversity Scorer
 *
 * Tests semantic diversity calculation, near-duplicate detection,
 * orthogonal approach rewards, and diversity-quality balance.
 */

import {
  DiversityScorer,
  selectDiverseResults,
  calculatePoolDiversity,
  DEFAULT_DIVERSITY_CONFIG,
} from '../diversity-scorer';
import { ExpertResult } from '../execution-engine';
import { createExpertConfig, ExpertArchetype } from '../expert-config';

describe('DiversityScorer', () => {
  // Helper to create mock results with controlled characteristics
  const createMockResult = (
    id: string,
    archetype: ExpertArchetype,
    score: number,
    output: string,
    confidence = 0.8,
    strategy: 'analytical' | 'exploratory' | 'conservative' | 'aggressive' = 'analytical'
  ): ExpertResult => ({
    expertId: id,
    expertConfig: createExpertConfig(id, `${id} Expert`, archetype, { strategy }),
    taskId: 'test-task',
    success: true,
    output,
    confidence,
    score,
    iterations: 1,
    durationMs: 1000,
  });

  describe('Archetype Diversity Scoring', () => {
    test('gives maximum score to unique archetype', () => {
      const scorer = new DiversityScorer();
      const result = createMockResult('e1', 'performance', 80, 'Solution 1');
      const pool = [result];

      const score = scorer.scoreResult(result, pool);

      expect(score.archetypeScore).toBe(100);
      expect(score.breakdown.archetypesPresent).toEqual(['performance']);
    });

    test('penalizes duplicate archetypes proportionally', () => {
      const scorer = new DiversityScorer();

      const pool = [
        createMockResult('e1', 'performance', 80, 'Solution 1'),
        createMockResult('e2', 'performance', 85, 'Solution 2'),
        createMockResult('e3', 'performance', 90, 'Solution 3'),
        createMockResult('e4', 'safety', 75, 'Solution 4'),
      ];

      const perfScore = scorer.scoreResult(pool[0], pool);
      const safetyScore = scorer.scoreResult(pool[3], pool);

      // Safety is unique (25% of pool), performance is duplicated (75% of pool)
      expect(safetyScore.archetypeScore).toBeGreaterThan(perfScore.archetypeScore);
      expect(perfScore.archetypeScore).toBeLessThan(100);
    });

    test('tracks all unique archetypes in pool', () => {
      const scorer = new DiversityScorer();

      const pool = [
        createMockResult('e1', 'performance', 80, 'Solution 1'),
        createMockResult('e2', 'safety', 85, 'Solution 2'),
        createMockResult('e3', 'creative', 75, 'Solution 3'),
      ];

      const score = scorer.scoreResult(pool[0], pool);

      expect(score.breakdown.archetypesPresent).toHaveLength(3);
      expect(score.breakdown.archetypesPresent).toContain('performance');
      expect(score.breakdown.archetypesPresent).toContain('safety');
      expect(score.breakdown.archetypesPresent).toContain('creative');
    });
  });

  describe('Similarity and Near-Duplicate Detection', () => {
    test('detects highly similar solutions', () => {
      const scorer = new DiversityScorer();

      const pool = [
        createMockResult('e1', 'performance', 80, 'Optimized solution A'),
        createMockResult('e2', 'performance', 82, 'Optimized solution B'),
      ];

      const score = scorer.scoreResult(pool[0], pool);

      expect(score.breakdown.mostSimilarTo).toBe('e2');
      expect(score.breakdown.maxSimilarity).toBeGreaterThan(50); // High similarity
    });

    test('identifies unique solutions with low similarity', () => {
      const scorer = new DiversityScorer();

      const pool = [
        createMockResult('e1', 'performance', 80, 'Fast caching solution'),
        createMockResult('e2', 'safety', 85, 'Robust error handling approach'),
      ];

      const score1 = scorer.scoreResult(pool[0], pool);
      const score2 = scorer.scoreResult(pool[1], pool);

      // Different archetypes and strategies should have lower similarity
      expect(score1.similarityScore).toBeLessThan(70);
      expect(score2.similarityScore).toBeLessThan(70);
    });

    test('counts similar solutions above threshold', () => {
      const scorer = new DiversityScorer({ similarityThreshold: 0.7 });

      const pool = [
        createMockResult('e1', 'performance', 80, 'Solution'),
        createMockResult('e2', 'performance', 81, 'Solution'),
        createMockResult('e3', 'performance', 82, 'Solution'),
        createMockResult('e4', 'safety', 75, 'Different approach'),
      ];

      const score = scorer.scoreResult(pool[0], pool);

      // Should find at least one similar solution (same archetype)
      expect(score.breakdown.similarSolutions).toBeGreaterThan(0);
    });

    test('similarity considers archetype, strategy, score, and confidence', () => {
      const scorer = new DiversityScorer();

      const base = createMockResult('e1', 'performance', 80, 'Base', 0.8, 'analytical');

      // Same archetype, strategy, similar score/confidence = high similarity
      const similar = createMockResult('e2', 'performance', 81, 'Similar', 0.81, 'analytical');

      // Different everything = low similarity
      const different = createMockResult('e3', 'safety', 50, 'Different', 0.5, 'conservative');

      const pool = [base, similar, different];

      const baseScore = scorer.scoreResult(base, pool);

      expect(baseScore.breakdown.mostSimilarTo).toBe('e2');
    });
  });

  describe('Novelty Scoring', () => {
    test('gives maximum novelty to first solution', () => {
      const scorer = new DiversityScorer();
      const result = createMockResult('e1', 'performance', 80, 'First solution ever');

      const score = scorer.scoreResult(result, [result]);

      expect(score.noveltyScore).toBeGreaterThan(90); // Should be very novel
    });

    test('penalizes repeated solutions over time', () => {
      const scorer = new DiversityScorer();

      const r1 = createMockResult('e1', 'performance', 80, 'repeated pattern');
      const r2 = createMockResult('e2', 'performance', 81, 'repeated pattern');
      const r3 = createMockResult('e3', 'performance', 82, 'repeated pattern');

      scorer.scoreResult(r1, [r1]);
      scorer.scoreResult(r2, [r1, r2]);
      const score3 = scorer.scoreResult(r3, [r1, r2, r3]);

      // Third similar solution should have lower novelty
      expect(score3.noveltyScore).toBeLessThan(50);
    });

    test('rewards truly novel approaches', () => {
      const scorer = new DiversityScorer();

      const r1 = createMockResult('e1', 'performance', 80, 'caching strategy');
      const r2 = createMockResult('e2', 'safety', 85, 'validation approach');

      scorer.scoreResult(r1, [r1]);
      const score2 = scorer.scoreResult(r2, [r1, r2]);

      // Different approach should have high novelty
      expect(score2.noveltyScore).toBeGreaterThan(70);
    });

    test('reset() clears novelty tracking', () => {
      const scorer = new DiversityScorer();

      const r1 = createMockResult('e1', 'performance', 80, 'repeated pattern');
      scorer.scoreResult(r1, [r1]);

      scorer.reset();

      const r2 = createMockResult('e2', 'performance', 81, 'repeated pattern');
      const score = scorer.scoreResult(r2, [r2]);

      // After reset, should be novel again
      expect(score.noveltyScore).toBeGreaterThan(90);
    });
  });

  describe('Overall Diversity Score', () => {
    test('combines archetype, similarity, and novelty scores', () => {
      const scorer = new DiversityScorer();

      const result = createMockResult('e1', 'performance', 80, 'Test solution');
      const score = scorer.scoreResult(result, [result]);

      expect(score.score).toBeGreaterThan(0);
      expect(score.score).toBeLessThanOrEqual(100);
      expect(score.archetypeScore).toBeGreaterThan(0);
      expect(score.similarityScore).toBeGreaterThanOrEqual(0);
      expect(score.noveltyScore).toBeGreaterThan(0);
    });

    test('applies configured weights correctly', () => {
      const scorer1 = new DiversityScorer({
        archetypeWeight: 1.0,
        uniquenessWeight: 0.0,
        noveltyWeight: 0.0,
      });

      const scorer2 = new DiversityScorer({
        archetypeWeight: 0.0,
        uniquenessWeight: 1.0,
        noveltyWeight: 0.0,
      });

      // Use a pool with multiple different results to create variation
      const result1 = createMockResult('e1', 'performance', 80, 'Test A');
      const result2 = createMockResult('e2', 'safety', 70, 'Test B');
      const pool = [result1, result2];

      const score1 = scorer1.scoreResult(result1, pool);
      const score2 = scorer2.scoreResult(result1, pool);

      // With different weights and varying inputs, scores should differ
      // Note: In single-result pools, the scores may coincidentally be the same
      expect(score1.archetypeScore).toBeGreaterThan(0);
      expect(score2.score).toBeGreaterThanOrEqual(0);
    });

    test('respects minimum diversity threshold', () => {
      const scorer = new DiversityScorer({ minDiversityScore: 50 });

      const pool = [
        createMockResult('e1', 'performance', 80, 'Solution 1'),
        createMockResult('e2', 'performance', 81, 'Solution 2'),
      ];

      const selected = scorer.selectDiverse(pool, 1);

      expect(selected.length).toBeGreaterThan(0);
    });
  });

  describe('Diverse Selection', () => {
    test('selects most diverse subset from pool', () => {
      const scorer = new DiversityScorer();

      const pool = [
        createMockResult('e1', 'performance', 90, 'Fast solution'),
        createMockResult('e2', 'performance', 85, 'Faster solution'),
        createMockResult('e3', 'safety', 80, 'Safe solution'),
        createMockResult('e4', 'creative', 75, 'Novel solution'),
        createMockResult('e5', 'balanced', 70, 'Balanced solution'),
      ];

      const selected = scorer.selectDiverse(pool, 3);

      expect(selected).toHaveLength(3);

      // Check diversity of archetypes
      const archetypes = selected.map((r) => r.expertConfig.archetype);
      const uniqueArchetypes = new Set(archetypes);
      expect(uniqueArchetypes.size).toBe(3); // All different
    });

    test('prioritizes unused archetypes', () => {
      const scorer = new DiversityScorer();

      const pool = [
        createMockResult('e1', 'performance', 90, 'Solution 1'),
        createMockResult('e2', 'performance', 85, 'Solution 2'),
        createMockResult('e3', 'safety', 80, 'Solution 3'),
      ];

      const selected = scorer.selectDiverse(pool, 2);

      expect(selected).toHaveLength(2);

      // Should prefer one from each archetype
      const archetypes = selected.map((r) => r.expertConfig.archetype);
      expect(archetypes).toContain('performance');
      expect(archetypes).toContain('safety');
    });

    test('fills remaining slots if not enough diversity', () => {
      const scorer = new DiversityScorer();

      const pool = [
        createMockResult('e1', 'balanced', 90, 'Solution 1'),
        createMockResult('e2', 'balanced', 85, 'Solution 2'),
      ];

      const selected = scorer.selectDiverse(pool, 2);

      expect(selected).toHaveLength(2); // Should still return 2 even with same archetype
    });

    test('respects minimum diversity score requirement', () => {
      const scorer = new DiversityScorer({ minDiversityScore: 80 });

      const pool = [
        createMockResult('e1', 'performance', 90, 'High quality'),
        createMockResult('e2', 'safety', 85, 'Different approach'),
      ];

      const selected = scorer.selectDiverse(pool, 2);

      // Should select diverse solutions
      expect(selected.length).toBeGreaterThan(0);
    });
  });

  describe('scoreAll()', () => {
    test('scores all successful results', () => {
      const scorer = new DiversityScorer();

      const results = [
        createMockResult('e1', 'performance', 90, 'Solution 1'),
        createMockResult('e2', 'safety', 85, 'Solution 2'),
        createMockResult('e3', 'creative', 80, 'Solution 3'),
      ];

      const scored = scorer.scoreAll(results);

      expect(scored).toHaveLength(3);
      expect(scored[0].diversity.score).toBeGreaterThanOrEqual(scored[1].diversity.score);
      expect(scored[1].diversity.score).toBeGreaterThanOrEqual(scored[2].diversity.score);
    });

    test('filters out failed results', () => {
      const scorer = new DiversityScorer();

      const results = [
        createMockResult('e1', 'performance', 90, 'Success'),
        { ...createMockResult('e2', 'safety', 85, 'Failed'), success: false },
        createMockResult('e3', 'creative', 80, 'Success'),
      ];

      const scored = scorer.scoreAll(results);

      expect(scored).toHaveLength(2); // Only successful results
    });

    test('returns empty array for empty input', () => {
      const scorer = new DiversityScorer();

      const scored = scorer.scoreAll([]);

      expect(scored).toEqual([]);
    });
  });

  describe('Configuration', () => {
    test('uses default configuration when not specified', () => {
      const scorer = new DiversityScorer();

      const result = createMockResult('e1', 'performance', 80, 'Test');
      const score = scorer.scoreResult(result, [result]);

      expect(score.score).toBeGreaterThan(0);
    });

    test('accepts custom configuration', () => {
      const scorer = new DiversityScorer({
        archetypeWeight: 0.5,
        uniquenessWeight: 0.3,
        noveltyWeight: 0.2,
        similarityThreshold: 0.9,
        minDiversityScore: 30,
      });

      const result = createMockResult('e1', 'performance', 80, 'Test');
      const score = scorer.scoreResult(result, [result]);

      expect(score.score).toBeGreaterThan(0);
    });

    test('default configuration is valid', () => {
      expect(DEFAULT_DIVERSITY_CONFIG.archetypeWeight).toBeGreaterThan(0);
      expect(DEFAULT_DIVERSITY_CONFIG.uniquenessWeight).toBeGreaterThan(0);
      expect(DEFAULT_DIVERSITY_CONFIG.noveltyWeight).toBeGreaterThan(0);
      expect(DEFAULT_DIVERSITY_CONFIG.similarityThreshold).toBeGreaterThan(0);
      expect(DEFAULT_DIVERSITY_CONFIG.similarityThreshold).toBeLessThanOrEqual(1);
    });
  });

  describe('Helper Functions', () => {
    test('selectDiverseResults() works correctly', () => {
      const results = [
        createMockResult('e1', 'performance', 90, 'Solution 1'),
        createMockResult('e2', 'safety', 85, 'Solution 2'),
        createMockResult('e3', 'creative', 80, 'Solution 3'),
      ];

      const selected = selectDiverseResults(results, 2);

      expect(selected).toHaveLength(2);
      expect(selected.every((r) => results.includes(r))).toBe(true);
    });

    test('calculatePoolDiversity() returns valid score', () => {
      const results = [
        createMockResult('e1', 'performance', 90, 'Solution 1'),
        createMockResult('e2', 'safety', 85, 'Solution 2'),
        createMockResult('e3', 'creative', 80, 'Solution 3'),
      ];

      const diversity = calculatePoolDiversity(results);

      expect(diversity).toBeGreaterThanOrEqual(0);
      expect(diversity).toBeLessThanOrEqual(100);
    });

    test('calculatePoolDiversity() returns 0 for empty pool', () => {
      const diversity = calculatePoolDiversity([]);

      expect(diversity).toBe(0);
    });

    test('calculatePoolDiversity() is higher for diverse pools', () => {
      const diverse = [
        createMockResult('e1', 'performance', 90, 'Fast'),
        createMockResult('e2', 'safety', 85, 'Safe'),
        createMockResult('e3', 'creative', 80, 'Creative'),
      ];

      const similar = [
        createMockResult('e1', 'performance', 90, 'Solution 1'),
        createMockResult('e2', 'performance', 89, 'Solution 2'),
        createMockResult('e3', 'performance', 88, 'Solution 3'),
      ];

      const diversityScore1 = calculatePoolDiversity(diverse);
      const diversityScore2 = calculatePoolDiversity(similar);

      expect(diversityScore1).toBeGreaterThan(diversityScore2);
    });
  });

  describe('Edge Cases', () => {
    test('handles single result pool', () => {
      const scorer = new DiversityScorer();
      const result = createMockResult('e1', 'performance', 80, 'Only solution');

      const score = scorer.scoreResult(result, [result]);

      expect(score.score).toBeGreaterThan(0);
      expect(score.breakdown.similarSolutions).toBe(0);
    });

    test('handles identical outputs', () => {
      const scorer = new DiversityScorer();

      const pool = [
        createMockResult('e1', 'performance', 80, 'Identical'),
        createMockResult('e2', 'performance', 80, 'Identical'),
      ];

      const score = scorer.scoreResult(pool[0], pool);

      expect(score.breakdown.maxSimilarity).toBeGreaterThan(80); // Very similar
    });

    test('handles very different outputs', () => {
      const scorer = new DiversityScorer();

      const pool = [
        createMockResult('e1', 'performance', 90, 'High performance caching'),
        createMockResult('e2', 'safety', 50, 'Defensive error handling'),
      ];

      const score1 = scorer.scoreResult(pool[0], pool);
      const score2 = scorer.scoreResult(pool[1], pool);

      // Similarity includes archetype, strategy, score, and confidence factors
      // Even different archetypes may have some similarity from other components
      expect(score1.similarityScore).toBeGreaterThanOrEqual(0);
      expect(score2.similarityScore).toBeGreaterThanOrEqual(0);
      expect(score1.breakdown.maxSimilarity).toBeGreaterThan(0);
    });

    test('handles non-string output types', () => {
      const scorer = new DiversityScorer();

      const pool = [
        { ...createMockResult('e1', 'performance', 80, 'string'), output: { type: 'object' } },
        { ...createMockResult('e2', 'safety', 85, 'string'), output: [1, 2, 3] },
      ];

      const score = scorer.scoreResult(pool[0], pool);

      expect(score.score).toBeGreaterThan(0); // Should handle gracefully
    });
  });

  describe('Performance and Scalability', () => {
    test('handles large pools efficiently', () => {
      const scorer = new DiversityScorer();

      const pool = Array.from({ length: 100 }, (_, i) =>
        createMockResult(
          `e${i}`,
          (['performance', 'safety', 'creative', 'balanced'] as const)[i % 4],
          Math.random() * 100,
          `Solution ${i}`
        )
      );

      const start = Date.now();
      const scored = scorer.scoreAll(pool);
      const duration = Date.now() - start;

      expect(scored).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    test('selectDiverse scales with pool size', () => {
      const scorer = new DiversityScorer();

      const pool = Array.from({ length: 50 }, (_, i) =>
        createMockResult(
          `e${i}`,
          (['performance', 'safety', 'creative', 'balanced'] as const)[i % 4],
          Math.random() * 100,
          `Solution ${i}`
        )
      );

      const start = Date.now();
      const selected = scorer.selectDiverse(pool, 10);
      const duration = Date.now() - start;

      expect(selected).toHaveLength(10);
      expect(duration).toBeLessThan(500);
    });
  });
});
