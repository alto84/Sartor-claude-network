/**
 * Tests for Phase 6 Enhanced Soft Scorer
 *
 * Tests the multi-dimensional scoring system with evidence tracking,
 * confidence intervals, and anti-fabrication compliance.
 */

import {
  SoftScorer,
  ScoreDimension,
  DimensionScore,
  EnhancedSoftScore,
  ScoringConfig,
  createExpertConfig,
  ExpertResult,
} from '../index';

describe('SoftScorer - Phase 6 Enhancements', () => {
  const createMockResult = (
    score: number,
    confidence: number,
    iterations: number,
    durationMs: number,
    success = true,
    error?: string
  ): ExpertResult => ({
    expertId: 'test-expert',
    expertConfig: createExpertConfig('test-expert', 'Test Expert', 'balanced'),
    taskId: 'test-task',
    success,
    output: success ? { result: 'test output' } : undefined,
    confidence,
    score,
    iterations,
    durationMs,
    error,
  });

  describe('scoreDimension', () => {
    const scorer = new SoftScorer();

    test('scores QUALITY dimension with evidence', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const dimScore = scorer.scoreDimension(result, ScoreDimension.QUALITY);

      expect(dimScore.dimension).toBe(ScoreDimension.QUALITY);
      expect(dimScore.score).toBeGreaterThan(0);
      expect(dimScore.score).toBeLessThanOrEqual(100);
      expect(dimScore.confidence).toBeGreaterThan(0);
      expect(dimScore.confidence).toBeLessThanOrEqual(1);
      expect(dimScore.evidence).toBeInstanceOf(Array);
      expect(dimScore.evidence.length).toBeGreaterThan(0);
      expect(dimScore.evidence[0]).toContain('Expert confidence');
    });

    test('scores SAFETY dimension with evidence', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const dimScore = scorer.scoreDimension(result, ScoreDimension.SAFETY);

      expect(dimScore.dimension).toBe(ScoreDimension.SAFETY);
      expect(dimScore.score).toBeGreaterThan(0);
      expect(dimScore.evidence.length).toBeGreaterThan(0);
      expect(dimScore.evidence.some((e) => e.includes('succeeded'))).toBe(true);
    });

    test('scores EFFICIENCY dimension with evidence', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const dimScore = scorer.scoreDimension(result, ScoreDimension.EFFICIENCY);

      expect(dimScore.dimension).toBe(ScoreDimension.EFFICIENCY);
      expect(dimScore.score).toBeGreaterThan(0);
      expect(dimScore.confidence).toBeGreaterThan(0.8); // High confidence for efficiency
      expect(dimScore.evidence.length).toBeGreaterThan(0);
      expect(dimScore.evidence.some((e) => e.includes('Time'))).toBe(true);
    });

    test('scores CORRECTNESS dimension with evidence', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const dimScore = scorer.scoreDimension(result, ScoreDimension.CORRECTNESS);

      expect(dimScore.dimension).toBe(ScoreDimension.CORRECTNESS);
      expect(dimScore.score).toBeGreaterThan(0);
      expect(dimScore.evidence.length).toBeGreaterThan(0);
      expect(dimScore.evidence.some((e) => e.includes('Base score'))).toBe(true);
    });

    test('scores READABILITY dimension with LOW confidence', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const dimScore = scorer.scoreDimension(result, ScoreDimension.READABILITY);

      expect(dimScore.dimension).toBe(ScoreDimension.READABILITY);
      expect(dimScore.score).toBeGreaterThan(0);
      expect(dimScore.confidence).toBeLessThan(0.5); // Low confidence due to limited evidence
      expect(dimScore.evidence.some((e) => e.includes('LIMITATION'))).toBe(true);
    });

    test('penalizes failed results', () => {
      const result = createMockResult(0, 0, 0, 0, false, 'Test error');
      const qualityScore = scorer.scoreDimension(result, ScoreDimension.QUALITY);

      expect(qualityScore.score).toBeLessThan(50);
      expect(qualityScore.evidence.some((e) => e.includes('Error present'))).toBe(true);
    });

    test('rewards high confidence', () => {
      const highConf = createMockResult(80, 0.95, 1, 5000);
      const lowConf = createMockResult(80, 0.5, 1, 5000);

      const highScore = scorer.scoreDimension(highConf, ScoreDimension.QUALITY);
      const lowScore = scorer.scoreDimension(lowConf, ScoreDimension.QUALITY);

      expect(highScore.score).toBeGreaterThan(lowScore.score);
    });

    test('rewards iteration efficiency', () => {
      const efficient = createMockResult(80, 0.9, 1, 5000);
      const inefficient = createMockResult(80, 0.9, 5, 5000);

      const effScore = scorer.scoreDimension(efficient, ScoreDimension.EFFICIENCY);
      const ineffScore = scorer.scoreDimension(inefficient, ScoreDimension.EFFICIENCY);

      expect(effScore.score).toBeGreaterThan(ineffScore.score);
    });
  });

  describe('scoreWithDimensions', () => {
    const scorer = new SoftScorer();

    test('scores all dimensions by default', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const score = scorer.scoreWithDimensions(result);

      expect(score.overall).toBeGreaterThan(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.dimensions.length).toBe(5); // All dimensions
      expect(score.confidence).toBeGreaterThan(0);
      expect(score.confidenceInterval).toHaveLength(2);
      expect(score.confidenceInterval[0]).toBeLessThanOrEqual(score.overall);
      expect(score.confidenceInterval[1]).toBeGreaterThanOrEqual(score.overall);
    });

    test('scores specific dimensions', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const score = scorer.scoreWithDimensions(result, [
        ScoreDimension.CORRECTNESS,
        ScoreDimension.EFFICIENCY,
      ]);

      expect(score.dimensions.length).toBe(2);
      expect(score.dimensions[0].dimension).toBe(ScoreDimension.CORRECTNESS);
      expect(score.dimensions[1].dimension).toBe(ScoreDimension.EFFICIENCY);
    });

    test('handles failed results', () => {
      const result = createMockResult(0, 0, 0, 0, false);
      const score = scorer.scoreWithDimensions(result);

      expect(score.overall).toBe(0);
      expect(score.confidence).toBe(1.0); // Very confident in failure
      expect(score.confidenceInterval).toEqual([0, 0]);
      expect(score.dimensions.every((d) => d.score === 0)).toBe(true);
    });

    test('provides evidence for all dimensions', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const score = scorer.scoreWithDimensions(result);

      for (const dimScore of score.dimensions) {
        expect(dimScore.evidence).toBeInstanceOf(Array);
        expect(dimScore.evidence.length).toBeGreaterThan(0);
      }
    });
  });

  describe('aggregate', () => {
    const scorer = new SoftScorer();

    test('aggregates dimension scores with equal weights', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const dimensions = [
        ScoreDimension.CORRECTNESS,
        ScoreDimension.QUALITY,
        ScoreDimension.EFFICIENCY,
      ];

      const dimScores = dimensions.map((dim) => scorer.scoreDimension(result, dim));

      const config: ScoringConfig = {
        weights: {
          [ScoreDimension.CORRECTNESS]: 1 / 3,
          [ScoreDimension.QUALITY]: 1 / 3,
          [ScoreDimension.EFFICIENCY]: 1 / 3,
          [ScoreDimension.SAFETY]: 0,
          [ScoreDimension.READABILITY]: 0,
        },
        requireEvidence: true,
        minConfidence: 0.5,
      };

      const aggregated = scorer.aggregate(dimScores, config);

      expect(aggregated.overall).toBeGreaterThan(0);
      expect(aggregated.overall).toBeLessThanOrEqual(100);
      expect(aggregated.confidence).toBeGreaterThan(0);
      expect(aggregated.confidenceInterval).toHaveLength(2);
    });

    test('aggregates with custom weights', () => {
      const result = createMockResult(80, 0.9, 1, 5000);

      const config: ScoringConfig = {
        weights: {
          [ScoreDimension.CORRECTNESS]: 0.5, // Prioritize correctness
          [ScoreDimension.QUALITY]: 0.3,
          [ScoreDimension.EFFICIENCY]: 0.2,
          [ScoreDimension.SAFETY]: 0,
          [ScoreDimension.READABILITY]: 0,
        },
        requireEvidence: true,
        minConfidence: 0.3,
      };

      const dimScores = [
        scorer.scoreDimension(result, ScoreDimension.CORRECTNESS),
        scorer.scoreDimension(result, ScoreDimension.QUALITY),
        scorer.scoreDimension(result, ScoreDimension.EFFICIENCY),
      ];

      const aggregated = scorer.aggregate(dimScores, config);

      expect(aggregated.overall).toBeGreaterThan(0);
    });

    test('throws error if weights do not sum to 1.0', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const dimScores = [scorer.scoreDimension(result, ScoreDimension.CORRECTNESS)];

      const badConfig: ScoringConfig = {
        weights: {
          [ScoreDimension.CORRECTNESS]: 0.5, // Only 0.5, should be 1.0
          [ScoreDimension.QUALITY]: 0,
          [ScoreDimension.EFFICIENCY]: 0,
          [ScoreDimension.SAFETY]: 0,
          [ScoreDimension.READABILITY]: 0,
        },
        requireEvidence: true,
        minConfidence: 0.5,
      };

      expect(() => scorer.aggregate(dimScores, badConfig)).toThrow('must sum to 1.0');
    });

    test('filters low confidence scores', () => {
      const result = createMockResult(80, 0.9, 1, 5000);

      const dimScores = [
        scorer.scoreDimension(result, ScoreDimension.CORRECTNESS), // Higher confidence
        scorer.scoreDimension(result, ScoreDimension.READABILITY), // Low confidence
      ];

      const config: ScoringConfig = {
        weights: {
          [ScoreDimension.CORRECTNESS]: 0.5,
          [ScoreDimension.READABILITY]: 0.5,
          [ScoreDimension.QUALITY]: 0,
          [ScoreDimension.EFFICIENCY]: 0,
          [ScoreDimension.SAFETY]: 0,
        },
        requireEvidence: true,
        minConfidence: 0.5, // Filter out readability (confidence ~0.3)
      };

      const aggregated = scorer.aggregate(dimScores, config);

      // Should only use correctness score
      expect(aggregated.overall).toBeGreaterThan(0);
    });

    test('returns zero if all scores below confidence threshold', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const dimScores = [scorer.scoreDimension(result, ScoreDimension.READABILITY)]; // Low conf

      const config: ScoringConfig = {
        weights: {
          [ScoreDimension.READABILITY]: 1.0,
          [ScoreDimension.CORRECTNESS]: 0,
          [ScoreDimension.QUALITY]: 0,
          [ScoreDimension.EFFICIENCY]: 0,
          [ScoreDimension.SAFETY]: 0,
        },
        requireEvidence: true,
        minConfidence: 0.9, // Too high for readability
      };

      const aggregated = scorer.aggregate(dimScores, config);

      expect(aggregated.overall).toBe(0);
      expect(aggregated.confidence).toBe(0);
    });
  });

  describe('calculateConfidenceInterval', () => {
    const scorer = new SoftScorer();

    test('calculates confidence interval for high confidence score', () => {
      const interval = scorer.calculateConfidenceInterval(80, 0.9);

      expect(interval).toHaveLength(2);
      expect(interval[0]).toBeLessThanOrEqual(80);
      expect(interval[1]).toBeGreaterThanOrEqual(80);
      expect(interval[1] - interval[0]).toBeLessThan(20); // Narrow interval for high confidence
    });

    test('calculates wider interval for low confidence', () => {
      const highConfInterval = scorer.calculateConfidenceInterval(80, 0.9);
      const lowConfInterval = scorer.calculateConfidenceInterval(80, 0.3);

      const highWidth = highConfInterval[1] - highConfInterval[0];
      const lowWidth = lowConfInterval[1] - lowConfInterval[0];

      expect(lowWidth).toBeGreaterThan(highWidth);
    });

    test('clamps intervals to [0, 100]', () => {
      const interval1 = scorer.calculateConfidenceInterval(5, 0.1);
      const interval2 = scorer.calculateConfidenceInterval(95, 0.1);

      expect(interval1[0]).toBeGreaterThanOrEqual(0);
      expect(interval2[1]).toBeLessThanOrEqual(100);
    });

    test('perfect confidence gives minimal interval', () => {
      const interval = scorer.calculateConfidenceInterval(80, 1.0);

      expect(interval[1] - interval[0]).toBeLessThanOrEqual(1);
    });
  });

  describe('normalize', () => {
    const scorer = new SoftScorer();

    test('normalizes pool of scores to 0-100 range', () => {
      const results = [
        createMockResult(60, 0.7, 2, 10000),
        createMockResult(80, 0.9, 1, 5000),
        createMockResult(70, 0.8, 1, 7000),
      ];

      const scores = results.map((r) => scorer.scoreWithDimensions(r));
      const normalized = scorer.normalize(scores);

      expect(normalized.length).toBe(3);

      // Lowest should be near 0, highest near 100
      const normalizedScores = normalized.map((s) => s.overall);
      const min = Math.min(...normalizedScores);
      const max = Math.max(...normalizedScores);

      expect(min).toBeLessThanOrEqual(10); // Near 0
      expect(max).toBeGreaterThanOrEqual(90); // Near 100
    });

    test('handles empty array', () => {
      const normalized = scorer.normalize([]);
      expect(normalized).toEqual([]);
    });

    test('handles single score', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const score = scorer.scoreWithDimensions(result);
      const normalized = scorer.normalize([score]);

      expect(normalized).toEqual([score]);
    });

    test('handles identical scores', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const scores = [
        scorer.scoreWithDimensions(result),
        scorer.scoreWithDimensions(result),
        scorer.scoreWithDimensions(result),
      ];

      const normalized = scorer.normalize(scores);

      // Should remain unchanged
      expect(normalized).toEqual(scores);
    });
  });

  describe('Evidence-Based Compliance', () => {
    const scorer = new SoftScorer();

    test('all scores include evidence arrays', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const score = scorer.scoreWithDimensions(result);

      for (const dimScore of score.dimensions) {
        expect(dimScore.evidence).toBeInstanceOf(Array);
        expect(dimScore.evidence.length).toBeGreaterThan(0);
        expect(typeof dimScore.evidence[0]).toBe('string');
      }
    });

    test('evidence contains specific measurements', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const effScore = scorer.scoreDimension(result, ScoreDimension.EFFICIENCY);

      // Should mention specific numbers
      const evidenceText = effScore.evidence.join(' ');
      expect(evidenceText).toMatch(/\d+ms/); // Duration in ms
      expect(evidenceText).toMatch(/\d+\/\d+/); // Ratio format
    });

    test('confidence levels are constrained to [0, 1]', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const score = scorer.scoreWithDimensions(result);

      expect(score.confidence).toBeGreaterThanOrEqual(0);
      expect(score.confidence).toBeLessThanOrEqual(1);

      for (const dimScore of score.dimensions) {
        expect(dimScore.confidence).toBeGreaterThanOrEqual(0);
        expect(dimScore.confidence).toBeLessThanOrEqual(1);
      }
    });

    test('scores are constrained to [0, 100]', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const score = scorer.scoreWithDimensions(result);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);

      for (const dimScore of score.dimensions) {
        expect(dimScore.score).toBeGreaterThanOrEqual(0);
        expect(dimScore.score).toBeLessThanOrEqual(100);
      }
    });

    test('readability dimension acknowledges low confidence', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const readScore = scorer.scoreDimension(result, ScoreDimension.READABILITY);

      expect(readScore.confidence).toBeLessThan(0.5);
      expect(readScore.evidence.some((e) => e.includes('LIMITATION'))).toBe(true);
    });
  });

  describe('Integration with existing SoftScorer', () => {
    const scorer = new SoftScorer();

    test('existing score() method still works', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const oldScore = scorer.score(result);

      expect(oldScore.overall).toBeGreaterThan(0);
      expect(oldScore.passed).toBeDefined();
      expect(oldScore.breakdown).toBeDefined();
    });

    test('new scoreWithDimensions() method works independently', () => {
      const result = createMockResult(80, 0.9, 1, 5000);
      const newScore = scorer.scoreWithDimensions(result);

      expect(newScore.overall).toBeGreaterThan(0);
      expect(newScore.dimensions).toBeDefined();
      expect(newScore.confidenceInterval).toBeDefined();
    });

    test('both scoring methods produce reasonable results', () => {
      const result = createMockResult(80, 0.9, 1, 5000);

      const oldScore = scorer.score(result);
      const newScore = scorer.scoreWithDimensions(result);

      // Both should be positive and in reasonable range
      expect(oldScore.overall).toBeGreaterThan(40);
      expect(newScore.overall).toBeGreaterThan(40);

      // Both should recognize success
      expect(oldScore.passed).toBe(true);
      expect(newScore.overall).toBeGreaterThan(50);
    });
  });
});
