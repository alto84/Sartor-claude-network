/**
 * Tests for Sandbox Executor and Feedback Loop
 */

import {
  SandboxExecutor,
  sandboxExecute,
  sandboxCommand,
  createJsonSandbox,
  FeedbackLoop,
  collectFeedback,
  createFeedbackLoop,
  createExpertConfig,
  ExpertResult,
  ExpertTask,
} from '../index';

describe('SandboxExecutor', () => {
  describe('execute', () => {
    test('executes simple command', async () => {
      const sandbox = new SandboxExecutor({ timeout: 5000 });
      const result = await sandbox.execute('echo', ['hello']);

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('hello');
      expect(result.exitCode).toBe(0);
    });

    test('tracks duration', async () => {
      const sandbox = new SandboxExecutor({ timeout: 5000 });
      const result = await sandbox.execute('echo', ['test']);

      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.durationMs).toBeLessThan(5000);
    });

    test('handles failed commands', async () => {
      const sandbox = new SandboxExecutor({ timeout: 5000 });
      const result = await sandbox.execute('false', []);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });
  });

  describe('process management', () => {
    test('tracks active processes', async () => {
      const sandbox = new SandboxExecutor({ timeout: 5000 });

      expect(sandbox.getActiveCount()).toBe(0);

      // Start a slow command
      const promise = sandbox.execute('sleep', ['1'], 'test-id');

      // Give it time to start
      await new Promise((r) => setTimeout(r, 50));
      expect(sandbox.getActiveCount()).toBe(1);

      // Kill it
      sandbox.kill('test-id');

      await promise;
      expect(sandbox.getActiveCount()).toBe(0);
    });

    test('killAll terminates all processes', async () => {
      const sandbox = new SandboxExecutor({ timeout: 10000 });

      // Start multiple processes
      const p1 = sandbox.execute('sleep', ['5'], 'id1');
      const p2 = sandbox.execute('sleep', ['5'], 'id2');

      await new Promise((r) => setTimeout(r, 50));
      expect(sandbox.getActiveCount()).toBe(2);

      const killed = sandbox.killAll();
      expect(killed).toBe(2);

      await Promise.all([p1, p2]);
      expect(sandbox.getActiveCount()).toBe(0);
    });
  });

  describe('configuration', () => {
    test('setConfig updates configuration', () => {
      const sandbox = new SandboxExecutor({ timeout: 1000 });
      sandbox.setConfig({ timeout: 5000 });
      // Config is internal, just verify no error
      expect(sandbox.getActiveCount()).toBe(0);
    });

    test('createJsonSandbox creates sandbox with JSON parsing', () => {
      const sandbox = createJsonSandbox(5000);
      expect(sandbox).toBeInstanceOf(SandboxExecutor);
    });
  });

  describe('helper functions', () => {
    test('sandboxCommand works', async () => {
      const result = await sandboxCommand('echo', ['test'], 5000);

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('test');
    });
  });
});

describe('FeedbackLoop', () => {
  const createMockResult = (
    success: boolean,
    score: number,
    confidence: number,
    iterations: number
  ): ExpertResult => ({
    expertId: 'test-expert',
    expertConfig: createExpertConfig('test', 'Test Expert', 'balanced'),
    taskId: 'test-task',
    success,
    output: success ? 'test output' : null,
    confidence,
    score,
    iterations,
    durationMs: 1000,
    error: success ? undefined : 'Test error',
  });

  describe('collectFeedback', () => {
    test('collects feedback for successful result', async () => {
      const loop = new FeedbackLoop();
      const result = createMockResult(true, 80, 0.9, 1);

      const feedback = await loop.collectFeedback(result);

      expect(feedback.resultId).toContain('test-task');
      expect(feedback.expertId).toBe('test-expert');
      expect(feedback.timestamp).toBeDefined();
    });

    test('flags failed executions as critical', async () => {
      const loop = new FeedbackLoop();
      const result = createMockResult(false, 0, 0, 0);

      const feedback = await loop.collectFeedback(result);

      expect(feedback.criticalCount).toBeGreaterThan(0);
      expect(feedback.items.some((i) => i.severity === 'critical')).toBe(true);
    });

    test('flags low confidence', async () => {
      const loop = new FeedbackLoop({ enableSelfAssessment: true });
      const result = createMockResult(true, 80, 0.4, 1);

      const feedback = await loop.collectFeedback(result);

      expect(feedback.items.some((i) => i.source === 'self')).toBe(true);
    });

    test('generates summary', async () => {
      const loop = new FeedbackLoop();
      const result = createMockResult(false, 0, 0, 0);

      const feedback = await loop.collectFeedback(result);

      expect(feedback.summary).toContain('issues');
    });
  });

  describe('runLoop', () => {
    test('runs until target reached', async () => {
      const loop = new FeedbackLoop({
        maxIterations: 5,
        targetScore: 70,
      });

      let iteration = 0;
      const executor = async (): Promise<ExpertResult> => {
        iteration++;
        // Improve each iteration
        const score = 50 + iteration * 10;
        return createMockResult(true, score, 0.8 + iteration * 0.02, 1);
      };

      const task: ExpertTask = {
        id: 'loop-test',
        description: 'Test loop',
        type: 'test',
        input: {},
      };

      const results = await loop.runLoop(task, executor);

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);

      // Should have reached target
      const lastResult = results[results.length - 1];
      expect(lastResult.targetReached).toBe(true);
    });

    test('stops on no improvement', async () => {
      const loop = new FeedbackLoop({
        maxIterations: 10,
        targetScore: 100,
        minImprovement: 5,
      });

      const executor = async (): Promise<ExpertResult> => {
        // No improvement
        return createMockResult(true, 50, 0.8, 1);
      };

      const task: ExpertTask = {
        id: 'plateau-test',
        description: 'Test plateau',
        type: 'test',
        input: {},
      };

      const results = await loop.runLoop(task, executor);

      // Should stop early due to no improvement
      expect(results.length).toBeLessThan(10);
    });

    test('tracks improvement trajectory', async () => {
      const loop = new FeedbackLoop({ maxIterations: 3 });

      let score = 40;
      const executor = async (): Promise<ExpertResult> => {
        score += 15;
        return createMockResult(true, score, 0.85, 1);
      };

      const task: ExpertTask = {
        id: 'trajectory-test',
        description: 'Test trajectory',
        type: 'test',
        input: {},
      };

      await loop.runLoop(task, executor);

      const trajectory = loop.getTrajectory();

      expect(trajectory.length).toBeGreaterThan(0);
      expect(trajectory[0].iteration).toBe(1);
      // Later iterations should have higher scores
      if (trajectory.length > 1) {
        expect(trajectory[1].score).toBeGreaterThan(trajectory[0].score);
      }
    });
  });

  describe('getBestIteration', () => {
    test('returns highest scoring iteration', async () => {
      const loop = new FeedbackLoop({ maxIterations: 3, targetScore: 100 });

      let call = 0;
      const scores = [70, 85, 75]; // Best is iteration 2
      const executor = async (): Promise<ExpertResult> => {
        const score = scores[call++];
        return createMockResult(true, score, 0.85, 1);
      };

      const task: ExpertTask = {
        id: 'best-test',
        description: 'Test best',
        type: 'test',
        input: {},
      };

      await loop.runLoop(task, executor);

      const best = loop.getBestIteration();

      expect(best).toBeDefined();
      expect(best!.score.overall).toBeGreaterThanOrEqual(75);
    });
  });

  describe('helper functions', () => {
    test('collectFeedback works', async () => {
      const result = createMockResult(true, 80, 0.9, 1);

      const feedback = await collectFeedback(result);

      expect(feedback.resultId).toBeDefined();
    });

    test('createFeedbackLoop creates with target', () => {
      const loop = createFeedbackLoop(90);

      expect(loop).toBeDefined();
    });
  });

  describe('feedback providers', () => {
    test('custom provider can be registered', async () => {
      const loop = new FeedbackLoop();

      loop.registerProvider({
        id: 'custom-provider',
        source: 'oracle',
        generateFeedback: async () => [
          {
            id: 'custom-1',
            source: 'oracle',
            type: 'correctness',
            severity: 'minor',
            message: 'Custom feedback',
            confidence: 0.9,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      // Enable oracle in config
      const loop2 = new FeedbackLoop({
        feedbackProviders: ['oracle'],
      });

      loop2.registerProvider({
        id: 'oracle-provider',
        source: 'oracle',
        generateFeedback: async () => [
          {
            id: 'oracle-1',
            source: 'oracle',
            type: 'correctness',
            severity: 'suggestion',
            message: 'Oracle says: looks good',
            confidence: 0.95,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      const result = createMockResult(true, 80, 0.9, 1);
      const feedback = await loop2.collectFeedback(result);

      expect(feedback.items.some((i) => i.source === 'oracle')).toBe(true);
    });
  });
});
