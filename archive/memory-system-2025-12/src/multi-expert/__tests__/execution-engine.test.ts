/**
 * Tests for Multi-Expert Execution Engine
 */

import {
  ExecutionEngine,
  createMockExecutor,
  ExpertTask,
  createExpertConfig,
  createExpertPool,
  validateExpertConfig,
  EXPERT_ARCHETYPES,
} from '../index';

describe('Expert Configuration', () => {
  test('createExpertConfig creates valid config', () => {
    const config = createExpertConfig('test-1', 'Test Expert', 'balanced');

    expect(config.id).toBe('test-1');
    expect(config.name).toBe('Test Expert');
    expect(config.archetype).toBe('balanced');
    expect(config.maxIterations).toBe(3);
    expect(config.temperature).toBe(0.5);
  });

  test('createExpertConfig with archetype inherits defaults', () => {
    const safetyConfig = createExpertConfig('safe-1', 'Safety Expert', 'safety');

    expect(safetyConfig.archetype).toBe('safety');
    expect(safetyConfig.strategy).toBe('conservative');
    expect(safetyConfig.temperature).toBe(0.2);
    expect(safetyConfig.confidenceThreshold).toBe(0.85);
  });

  test('createExpertConfig allows overrides', () => {
    const config = createExpertConfig('custom-1', 'Custom', 'balanced', {
      temperature: 0.9,
      maxIterations: 5,
    });

    expect(config.temperature).toBe(0.9);
    expect(config.maxIterations).toBe(5);
  });

  test('createExpertPool creates diverse experts', () => {
    const pool = createExpertPool('task-1', ['performance', 'safety', 'creative'], 42);

    expect(pool.length).toBe(3);
    expect(pool[0].archetype).toBe('performance');
    expect(pool[1].archetype).toBe('safety');
    expect(pool[2].archetype).toBe('creative');
    expect(pool[0].seed).toBe(42);
    expect(pool[1].seed).toBe(43);
    expect(pool[2].seed).toBe(44);
  });

  test('validateExpertConfig detects invalid configs', () => {
    const invalidConfig = createExpertConfig('test', 'Test', 'balanced', {
      temperature: 1.5, // Invalid: > 1
      maxIterations: 0, // Invalid: < 1
    });

    const result = validateExpertConfig(invalidConfig);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('all archetypes are valid', () => {
    const archetypes = Object.keys(EXPERT_ARCHETYPES) as Array<keyof typeof EXPERT_ARCHETYPES>;

    for (const archetype of archetypes) {
      const config = createExpertConfig(`${archetype}-test`, `${archetype} Test`, archetype);
      const result = validateExpertConfig(config);
      expect(result.valid).toBe(true);
    }
  });
});

describe('Execution Engine', () => {
  test('executes task with single expert', async () => {
    const executor = createMockExecutor();
    const engine = new ExecutionEngine(executor);

    const task: ExpertTask = {
      id: 'task-1',
      description: 'Test task',
      type: 'test',
      input: { data: 'test' },
    };

    const experts = [createExpertConfig('expert-1', 'Expert 1', 'balanced')];
    const result = await engine.executeWithExperts(task, experts);

    expect(result.taskId).toBe('task-1');
    expect(result.results.length).toBe(1);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(0);
    expect(result.bestResult).toBeDefined();
  });

  test('executes task with multiple experts in parallel', async () => {
    const executor = createMockExecutor();
    const engine = new ExecutionEngine(executor);

    const task: ExpertTask = {
      id: 'task-2',
      description: 'Parallel test',
      type: 'test',
      input: {},
    };

    const experts = createExpertPool('task-2', ['performance', 'safety', 'simplicity']);
    const result = await engine.executeWithExperts(task, experts);

    expect(result.results.length).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.totalDurationMs).toBeGreaterThan(0);
    expect(result.summary.avgScore).toBeGreaterThan(0);
  });

  test('executeWithDiverseExperts creates and runs diverse pool', async () => {
    const executor = createMockExecutor();
    const engine = new ExecutionEngine(executor);

    const task: ExpertTask = {
      id: 'task-3',
      description: 'Diverse experts test',
      type: 'test',
      input: {},
    };

    const result = await engine.executeWithDiverseExperts(task);

    expect(result.results.length).toBe(3); // Default: performance, safety, simplicity
    expect(result.successCount).toBeGreaterThan(0);
  });

  test('handles expert failures gracefully', async () => {
    let callCount = 0;
    const flakyExecutor = async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Simulated failure');
      }
      return { output: 'success', score: 80, confidence: 0.9, iterations: 1 };
    };

    const engine = new ExecutionEngine(flakyExecutor, { continueOnFailure: true });

    const task: ExpertTask = {
      id: 'task-4',
      description: 'Failure test',
      type: 'test',
      input: {},
    };

    const experts = [
      createExpertConfig('failing', 'Failing Expert', 'balanced', { retriesPerIteration: 1 }),
      createExpertConfig('success', 'Success Expert', 'balanced'),
    ];

    const result = await engine.executeWithExperts(task, experts);

    expect(result.results.length).toBe(2);
    // At least one should succeed
    expect(result.successCount).toBeGreaterThanOrEqual(1);
  });

  test('calculates summary statistics correctly', async () => {
    const executor = createMockExecutor();
    const engine = new ExecutionEngine(executor);

    const task: ExpertTask = {
      id: 'task-5',
      description: 'Stats test',
      type: 'test',
      input: {},
    };

    const experts = createExpertPool('task-5', ['balanced', 'balanced', 'balanced', 'balanced']);
    const result = await engine.executeWithExperts(task, experts);

    expect(result.summary.avgScore).toBeGreaterThan(0);
    expect(result.summary.avgConfidence).toBeGreaterThan(0);
    expect(result.summary.avgIterations).toBeGreaterThan(0);
    expect(result.summary.agreementLevel).toBeGreaterThanOrEqual(0);
    expect(result.summary.agreementLevel).toBeLessThanOrEqual(1);
  });

  test('respects maxConcurrentExperts limit', async () => {
    let concurrentCount = 0;
    let maxConcurrent = 0;

    const trackingExecutor = async () => {
      concurrentCount++;
      maxConcurrent = Math.max(maxConcurrent, concurrentCount);
      await new Promise((resolve) => setTimeout(resolve, 50));
      concurrentCount--;
      return { output: 'done', score: 80, confidence: 0.9, iterations: 1 };
    };

    const engine = new ExecutionEngine(trackingExecutor, { maxConcurrentExperts: 3 });

    const task: ExpertTask = {
      id: 'task-6',
      description: 'Concurrency test',
      type: 'test',
      input: {},
    };

    // Try to run 5 experts but should be limited to 3
    const experts = createExpertPool('task-6', [
      'balanced',
      'balanced',
      'balanced',
      'balanced',
      'balanced',
    ]);
    await engine.executeWithExperts(task, experts);

    expect(maxConcurrent).toBeLessThanOrEqual(3);
  });

  test('includes execution trace when enabled', async () => {
    const executor = createMockExecutor();
    const engine = new ExecutionEngine(executor, { enableTracing: true });

    const task: ExpertTask = {
      id: 'task-7',
      description: 'Trace test',
      type: 'test',
      input: {},
    };

    const experts = [createExpertConfig('traced', 'Traced Expert', 'balanced')];
    const result = await engine.executeWithExperts(task, experts);

    expect(result.results[0].trace).toBeDefined();
    expect(result.results[0].trace?.startedAt).toBeDefined();
    expect(result.results[0].trace?.endedAt).toBeDefined();
  });
});
