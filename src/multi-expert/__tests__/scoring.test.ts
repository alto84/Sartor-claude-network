/**
 * Tests for Diversity Scorer and Soft Scorer
 */

import {
  DiversityScorer,
  selectDiverseResults,
  calculatePoolDiversity,
  SoftScorer,
  quickScore,
  rankResults,
  createExpertConfig,
  createMockExecutor,
  ExecutionEngine,
  ExpertTask,
  ExpertResult,
} from '../index';

describe('DiversityScorer', () => {
  const createMockResult = (
    id: string,
    archetype: 'performance' | 'safety' | 'balanced' | 'creative',
    score: number
  ): ExpertResult => ({
    expertId: id,
    expertConfig: createExpertConfig(id, `${id} Expert`, archetype),
    taskId: 'test',
    success: true,
    output: `Solution from ${archetype} expert`,
    confidence: 0.8,
    score,
    iterations: 1,
    durationMs: 1000,
  });

  describe('scoreResult', () => {
    test('scores single result in pool', () => {
      const scorer = new DiversityScorer();
      const result = createMockResult('e1', 'performance', 80);
      const pool = [result];

      const score = scorer.scoreResult(result, pool);

      expect(score.score).toBeGreaterThan(0);
      expect(score.archetypeScore).toBe(100); // Only one archetype
      expect(score.breakdown.archetypesPresent).toHaveLength(1);
    });

    test('penalizes duplicate archetypes', () => {
      const scorer = new DiversityScorer();

      const pool = [
        createMockResult('e1', 'performance', 80),
        createMockResult('e2', 'performance', 85),
        createMockResult('e3', 'safety', 75),
      ];

      const perfScore = scorer.scoreResult(pool[0], pool);
      const safetyScore = scorer.scoreResult(pool[2], pool);

      // Safety is unique, performance has duplicate
      expect(safetyScore.archetypeScore).toBeGreaterThan(perfScore.archetypeScore);
    });

    test('tracks similar solutions', () => {
      const scorer = new DiversityScorer();

      const pool = [
        createMockResult('e1', 'performance', 80),
        createMockResult('e2', 'performance', 82),
      ];

      const score = scorer.scoreResult(pool[0], pool);

      expect(score.breakdown.mostSimilarTo).toBe('e2');
      expect(score.breakdown.maxSimilarity).toBeGreaterThan(0);
    });
  });

  describe('selectDiverse', () => {
    test('selects diverse subset', () => {
      const scorer = new DiversityScorer();

      const results = [
        createMockResult('e1', 'performance', 90),
        createMockResult('e2', 'performance', 85),
        createMockResult('e3', 'safety', 80),
        createMockResult('e4', 'creative', 75),
      ];

      const selected = scorer.selectDiverse(results, 3);

      expect(selected).toHaveLength(3);
      // Should prefer diverse archetypes
      const archetypes = new Set(selected.map((r) => r.expertConfig.archetype));
      expect(archetypes.size).toBe(3); // All different archetypes
    });

    test('fills remaining slots if needed', () => {
      const scorer = new DiversityScorer();

      const results = [
        createMockResult('e1', 'balanced', 90),
        createMockResult('e2', 'balanced', 85),
      ];

      const selected = scorer.selectDiverse(results, 2);

      expect(selected).toHaveLength(2);
    });
  });

  describe('Helper Functions', () => {
    test('selectDiverseResults works', () => {
      const results = [
        createMockResult('e1', 'performance', 90),
        createMockResult('e2', 'safety', 80),
      ];

      const selected = selectDiverseResults(results, 1);

      expect(selected).toHaveLength(1);
    });

    test('calculatePoolDiversity returns score', () => {
      const results = [
        createMockResult('e1', 'performance', 90),
        createMockResult('e2', 'safety', 80),
        createMockResult('e3', 'creative', 70),
      ];

      const diversity = calculatePoolDiversity(results);

      expect(diversity).toBeGreaterThan(0);
      expect(diversity).toBeLessThanOrEqual(100);
    });
  });
});

describe('SoftScorer', () => {
  const createMockResult = (
    score: number,
    confidence: number,
    iterations: number,
    durationMs: number,
    success = true
  ): ExpertResult => ({
    expertId: 'test',
    expertConfig: createExpertConfig('test', 'Test Expert', 'balanced'),
    taskId: 'test',
    success,
    output: 'test output',
    confidence,
    score,
    iterations,
    durationMs,
    error: success ? undefined : 'Test error',
  });

  describe('score', () => {
    test('scores successful result', () => {
      const scorer = new SoftScorer();
      const result = createMockResult(80, 0.9, 1, 5000);

      const score = scorer.score(result);

      expect(score.overall).toBeGreaterThan(0);
      expect(score.passed).toBe(true);
      expect(score.breakdown.criteria.length).toBeGreaterThan(0);
    });

    test('scores failed result as zero', () => {
      const scorer = new SoftScorer();
      const result = createMockResult(0, 0, 0, 0, false);

      const score = scorer.score(result);

      expect(score.overall).toBe(0);
      expect(score.passed).toBe(false);
      expect(score.breakdown.penalties.length).toBe(1);
    });

    test('applies high confidence bonus', () => {
      const scorer = new SoftScorer();

      const highConf = createMockResult(80, 0.96, 1, 5000);
      const lowConf = createMockResult(80, 0.7, 1, 5000);

      const highScore = scorer.score(highConf);
      const lowScore = scorer.score(lowConf);

      expect(highScore.breakdown.bonuses.length).toBeGreaterThan(
        lowScore.breakdown.bonuses.length
      );
    });

    test('applies low confidence penalty', () => {
      const scorer = new SoftScorer();
      const result = createMockResult(80, 0.4, 1, 5000);

      const score = scorer.score(result);

      const lowConfPenalty = score.breakdown.penalties.find(
        (p) => p.name === 'low-confidence'
      );
      expect(lowConfPenalty).toBeDefined();
    });

    test('applies early completion bonus', () => {
      const scorer = new SoftScorer();
      const result = createMockResult(85, 0.9, 1, 5000);

      const score = scorer.score(result);

      const earlyBonus = score.breakdown.bonuses.find(
        (p) => p.name === 'early-completion'
      );
      expect(earlyBonus).toBeDefined();
    });
  });

  describe('scoreAll', () => {
    test('scores and ranks multiple results', () => {
      const scorer = new SoftScorer();

      const results = [
        createMockResult(60, 0.7, 2, 10000),
        createMockResult(90, 0.9, 1, 5000),
        createMockResult(75, 0.8, 1, 7000),
      ];

      const scored = scorer.scoreAll(results);

      expect(scored).toHaveLength(3);
      // Should be sorted by score descending
      expect(scored[0].score.overall).toBeGreaterThanOrEqual(scored[1].score.overall);
      expect(scored[1].score.overall).toBeGreaterThanOrEqual(scored[2].score.overall);
    });
  });

  describe('getTopResults', () => {
    test('returns top N results', () => {
      const scorer = new SoftScorer();

      const results = [
        createMockResult(60, 0.7, 2, 10000),
        createMockResult(90, 0.95, 1, 5000),
        createMockResult(75, 0.8, 1, 7000),
      ];

      const top = scorer.getTopResults(results, 2);

      expect(top).toHaveLength(2);
      expect(top[0].score).toBe(90);
    });
  });

  describe('getPassingResults', () => {
    test('returns only passing results', () => {
      const scorer = new SoftScorer({ passThreshold: 70 });

      const results = [
        createMockResult(50, 0.7, 2, 10000),
        createMockResult(90, 0.9, 1, 5000),
        createMockResult(75, 0.8, 1, 7000),
      ];

      const passing = scorer.getPassingResults(results);

      expect(passing.length).toBeGreaterThan(0);
      expect(passing.every((r) => r.score >= 70 || r.confidence >= 0.8)).toBe(true);
    });
  });

  describe('calculatePoolStats', () => {
    test('calculates pool statistics', () => {
      const scorer = new SoftScorer();

      const results = [
        createMockResult(60, 0.7, 2, 10000),
        createMockResult(90, 0.9, 1, 5000),
        createMockResult(75, 0.8, 1, 7000),
      ];

      const stats = scorer.calculatePoolStats(results);

      expect(stats.count).toBe(3);
      expect(stats.avgScore).toBeGreaterThan(0);
      expect(stats.minScore).toBeLessThanOrEqual(stats.avgScore);
      expect(stats.maxScore).toBeGreaterThanOrEqual(stats.avgScore);
      expect(stats.passRate).toBeGreaterThanOrEqual(0);
      expect(stats.passRate).toBeLessThanOrEqual(100);
    });

    test('handles empty pool', () => {
      const scorer = new SoftScorer();

      const stats = scorer.calculatePoolStats([]);

      expect(stats.count).toBe(0);
      expect(stats.avgScore).toBe(0);
    });
  });

  describe('Helper Functions', () => {
    test('quickScore works', () => {
      const result = createMockResult(80, 0.9, 1, 5000);

      const score = quickScore(result);

      expect(score.overall).toBeGreaterThan(0);
    });

    test('rankResults works', () => {
      const results = [
        createMockResult(60, 0.7, 2, 10000),
        createMockResult(90, 0.9, 1, 5000),
      ];

      const ranked = rankResults(results);

      expect(ranked).toHaveLength(2);
      expect(ranked[0].score.overall).toBeGreaterThanOrEqual(ranked[1].score.overall);
    });
  });
});

describe('Integration', () => {
  test('full pipeline: execute -> score -> select diverse -> vote', async () => {
    const executor = createMockExecutor();
    const engine = new ExecutionEngine(executor);

    const task: ExpertTask = {
      id: 'integration-test',
      description: 'Integration test',
      type: 'test',
      input: {},
    };

    // Execute with diverse experts
    const execResult = await engine.executeWithDiverseExperts(task, [
      'performance',
      'safety',
      'creative',
      'balanced',
    ]);

    expect(execResult.results.length).toBe(4);

    // Score all results
    const softScorer = new SoftScorer();
    const scored = softScorer.scoreAll(execResult.results);
    expect(scored.length).toBe(4);

    // Select diverse subset
    const diverseResults = selectDiverseResults(execResult.results, 3);
    expect(diverseResults.length).toBe(3);

    // Calculate pool diversity
    const diversity = calculatePoolDiversity(execResult.results);
    expect(diversity).toBeGreaterThan(0);

    // Get pool stats
    const stats = softScorer.calculatePoolStats(execResult.results);
    expect(stats.count).toBe(4);
  });
});
