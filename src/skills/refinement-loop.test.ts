/**
 * Refinement Loop Tests
 *
 * Tests for the core refinement loop mechanism.
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

import {
  RefinementLoop,
  withRefinement,
  createFeedback,
  createEvaluation,
  formatRefinementResult,
  type RefinementConfig,
  type EvaluationResult,
  type Feedback,
} from './refinement-loop';

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createMockConfig(overrides?: Partial<RefinementConfig>): RefinementConfig {
  return {
    maxIterations: 3,
    confidenceThreshold: 0.9,
    processSupervision: true,
    ...overrides,
  };
}

// ============================================================================
// BASIC TESTS
// ============================================================================

describe('RefinementLoop', () => {
  describe('Basic Functionality', () => {
    test('should generate and evaluate initial candidate', async () => {
      const config = createMockConfig();
      const loop = new RefinementLoop<number>(config);

      const generate = async () => 0.5;
      const evaluate = async (value: number) => createEvaluation(value, []);
      const refine = async (value: number) => value + 0.1;

      const result = await loop.run(generate, evaluate, refine);

      expect(result).toBeDefined();
      expect(result.candidate).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should stop when confidence threshold is reached', async () => {
      const config = createMockConfig({ confidenceThreshold: 0.8 });
      const loop = new RefinementLoop<number>(config);

      let iteration = 0;
      const generate = async () => 0.5;
      const evaluate = async (value: number) => {
        const score = Math.min(1.0, value);
        return createEvaluation(score, score < 0.8 ? [createFeedback('Low score', 'minor')] : []);
      };
      const refine = async (value: number) => {
        iteration++;
        return value + 0.2;
      };

      const result = await loop.run(generate, evaluate, refine);

      expect(result.converged).toBe(true);
      expect(result.stopReason).toBe('confidence');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(iteration).toBeLessThan(config.maxIterations);
    });

    test('should stop at max iterations if confidence not reached', async () => {
      const config = createMockConfig({
        maxIterations: 3,
        confidenceThreshold: 0.99,
      });
      const loop = new RefinementLoop<number>(config);

      const generate = async () => 0.5;
      const evaluate = async (value: number) => {
        return createEvaluation(Math.min(0.9, value), [createFeedback('Not good enough', 'minor')]);
      };
      const refine = async (value: number) => value + 0.05;

      const result = await loop.run(generate, evaluate, refine);

      expect(result.converged).toBe(false);
      expect(result.stopReason).toBe('maxIterations');
      expect(result.iterations).toBe(config.maxIterations);
    });
  });

  describe('Cost Management', () => {
    test('should stop when cost budget is exceeded', async () => {
      const config = createMockConfig({
        costBudget: 50,
        maxIterations: 10,
      });
      const loop = new RefinementLoop<number>(config);

      const generate = async () => 0.1;
      const evaluate = async (value: number) => {
        return createEvaluation(
          value,
          [createFeedback('Low score', 'minor')],
          undefined,
          30 // High cost per evaluation
        );
      };
      const refine = async (value: number) => value + 0.05;

      const result = await loop.run(generate, evaluate, refine);

      expect(result.stopReason).toBe('budget');
      expect(result.totalCost).toBeGreaterThanOrEqual(config.costBudget);
      expect(result.iterations).toBeLessThan(config.maxIterations);
    });

    test('should track remaining budget', async () => {
      const config = createMockConfig({ costBudget: 100 });
      const loop = new RefinementLoop<number>(config);

      const generate = async () => 0.5;
      const evaluate = async () => createEvaluation(0.5, [], undefined, 20);
      const refine = async (value: number) => value;

      await loop.run(generate, evaluate, refine);

      expect(loop.getRemainingBudget()).toBeLessThan(100);
      expect(loop.getRemainingBudget()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Process Supervision', () => {
    test('should record process trace when enabled', async () => {
      const config = createMockConfig({ processSupervision: true });
      const loop = new RefinementLoop<string>(config);

      const generate = async () => 'initial';
      const evaluate = async () => createEvaluation(0.95, []);
      const refine = async (value: string) => value + '-refined';

      await loop.run(generate, evaluate, refine);

      const trace = loop.getProcessTrace();
      expect(trace.length).toBeGreaterThan(0);
      expect(trace[0].action).toBe('generate-initial');
    });

    test('should not record process trace when disabled', async () => {
      const config = createMockConfig({ processSupervision: false });
      const loop = new RefinementLoop<string>(config);

      const generate = async () => 'initial';
      const evaluate = async () => createEvaluation(0.95, []);
      const refine = async (value: string) => value + '-refined';

      await loop.run(generate, evaluate, refine);

      const trace = loop.getProcessTrace();
      expect(trace.length).toBe(0);
    });
  });

  describe('Timeout Handling', () => {
    test('should timeout if execution exceeds limit', async () => {
      const config = createMockConfig({
        timeout: 100, // 100ms timeout
        maxIterations: 10,
      });
      const loop = new RefinementLoop<number>(config);

      const generate = async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
        return 0.5;
      };
      const evaluate = async () => createEvaluation(0.5, []);
      const refine = async (value: number) => value;

      const result = await loop.run(generate, evaluate, refine);

      expect(result.stopReason).toBe('timeout');
    });
  });

  describe('No Improvement Detection', () => {
    test('should stop when no significant improvement', async () => {
      const config = createMockConfig({
        minImprovementDelta: 0.1,
        maxIterations: 10,
      });
      const loop = new RefinementLoop<number>(config);

      let iteration = 0;
      const generate = async () => 0.5;
      const evaluate = async (value: number) => {
        iteration++;
        // After first iteration, improvements are tiny
        const score = iteration === 1 ? 0.5 : 0.51;
        return createEvaluation(score, [createFeedback('Needs improvement', 'minor')]);
      };
      const refine = async (value: number) => value + 0.001;

      const result = await loop.run(generate, evaluate, refine);

      expect(result.stopReason).toBe('noImprovement');
      expect(result.iterations).toBeLessThan(config.maxIterations);
    });
  });

  describe('Confidence History', () => {
    test('should track confidence over iterations', async () => {
      const config = createMockConfig();
      const loop = new RefinementLoop<number>(config);

      const generate = async () => 0.3;
      const evaluate = async (value: number) =>
        createEvaluation(Math.min(1.0, value), value < 0.9 ? [createFeedback('Low', 'minor')] : []);
      const refine = async (value: number) => value + 0.3;

      const result = await loop.run(generate, evaluate, refine);

      expect(result.confidenceHistory.length).toBeGreaterThan(0);
      expect(result.confidenceHistory[0]).toBe(0.3); // Initial confidence
      expect(result.confidenceHistory[result.confidenceHistory.length - 1]).toBe(result.confidence); // Final confidence
    });
  });
});

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe('withRefinement', () => {
  test('should provide simplified refinement interface', async () => {
    const task = async () => 0.5;
    const evaluator = async (value: number) => value;

    const result = await withRefinement(task, evaluator, {
      maxIterations: 2,
      confidenceThreshold: 0.8,
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
  });
});

describe('createFeedback', () => {
  test('should create feedback object', () => {
    const feedback = createFeedback('Issue found', 'critical', 'Fix this', 'aspect1');

    expect(feedback.issue).toBe('Issue found');
    expect(feedback.severity).toBe('critical');
    expect(feedback.suggestion).toBe('Fix this');
    expect(feedback.aspect).toBe('aspect1');
  });

  test('should use default severity', () => {
    const feedback = createFeedback('Issue found');

    expect(feedback.severity).toBe('major');
  });
});

describe('createEvaluation', () => {
  test('should create evaluation result', () => {
    const eval1 = createEvaluation(0.8, [], 'Good', 10);

    expect(eval1.score).toBe(0.8);
    expect(eval1.feedback).toEqual([]);
    expect(eval1.reasoning).toBe('Good');
    expect(eval1.cost).toBe(10);
    expect(eval1.acceptable).toBe(true);
  });

  test('should determine acceptability based on score', () => {
    const eval1 = createEvaluation(0.8);
    expect(eval1.acceptable).toBe(true);

    const eval2 = createEvaluation(0.5);
    expect(eval2.acceptable).toBe(false);
  });
});

describe('formatRefinementResult', () => {
  test('should format result as readable string', () => {
    const result = {
      candidate: 'test',
      confidence: 0.95,
      iterations: 3,
      totalCost: 100,
      converged: true,
      stopReason: 'confidence' as const,
      remainingFeedback: [],
      confidenceHistory: [0.5, 0.7, 0.95],
      durationMs: 1000,
    };

    const formatted = formatRefinementResult(result);

    expect(formatted).toContain('Refinement Result');
    expect(formatted).toContain('Iterations: 3');
    expect(formatted).toContain('Final Confidence: 95.0%');
    expect(formatted).toContain('Converged: Yes');
    expect(formatted).toContain('Stop Reason: confidence');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  test('should handle complex refinement scenario', async () => {
    interface ComplexData {
      value: number;
      metadata: {
        quality: number;
        attempts: number;
      };
    }

    const config = createMockConfig({
      maxIterations: 5,
      confidenceThreshold: 0.85,
      processSupervision: true,
      costBudget: 200,
    });

    const loop = new RefinementLoop<ComplexData>(config);

    const generate = async (): Promise<ComplexData> => ({
      value: 0.4,
      metadata: { quality: 0.4, attempts: 0 },
    });

    const evaluate = async (data: ComplexData): Promise<EvaluationResult> => {
      const issues: Feedback[] = [];

      if (data.value < 0.7) {
        issues.push(createFeedback('Value too low', 'major', 'Increase value'));
      }
      if (data.metadata.quality < 0.8) {
        issues.push(createFeedback('Quality insufficient', 'minor', 'Improve quality'));
      }

      const score = (data.value + data.metadata.quality) / 2;
      return createEvaluation(score, issues, `Score: ${score}`, 15);
    };

    const refine = async (data: ComplexData, feedback: Feedback): Promise<ComplexData> => ({
      value: data.value + 0.2,
      metadata: {
        quality: data.metadata.quality + 0.2,
        attempts: data.metadata.attempts + 1,
      },
    });

    const result = await loop.run(generate, evaluate, refine);

    expect(result.converged).toBe(true);
    expect(result.candidate.metadata.attempts).toBeGreaterThan(0);
    expect(result.processTrace).toBeDefined();
    expect(result.processTrace!.length).toBeGreaterThan(0);
  });
});

// Run tests if executed directly
if (require.main === module) {
  console.log('Run tests with: npm test refinement-loop.test.ts');
}
