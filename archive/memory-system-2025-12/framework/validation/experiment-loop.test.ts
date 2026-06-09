/**
 * Experiment Loop Tests
 *
 * Tests for the automated self-improvement experiment loop.
 */

import {
  createExperimentLoop,
  ExperimentConfig,
  Hypothesis,
  ExperimentStatus,
  ExperimentResult,
} from './experiment-loop';

describe('ExperimentLoop', () => {
  describe('Basic Operation', () => {
    it('should run a simple experiment loop', async () => {
      let hypothesisCallCount = 0;
      let changeCallCount = 0;
      let testCallCount = 0;

      // Mock hypothesis generator
      const hypothesisGenerator = async (): Promise<Hypothesis[]> => {
        hypothesisCallCount++;
        if (hypothesisCallCount > 3) return []; // Stop after 3 iterations

        return [
          {
            id: `hyp-${hypothesisCallCount}`,
            priority: 100 - hypothesisCallCount * 10,
            description: `Test hypothesis ${hypothesisCallCount}`,
            hypothesis: 'This should improve the system',
            targetFile: 'test.ts',
            modificationType: 'addition',
            proposedChange: 'Add test code',
            metadata: {
              generatedAt: new Date().toISOString(),
              source: 'analysis',
              confidence: 0.8,
            },
          },
        ];
      };

      // Mock change applicator
      const changeApplicator = async (hypothesis: Hypothesis): Promise<void> => {
        changeCallCount++;
      };

      // Mock test runner
      const testRunner = async (baseline: boolean): Promise<any> => {
        testCallCount++;
        return {
          totalTests: 10,
          passed: baseline ? 8 : 9, // Variant is slightly better
          failed: baseline ? 2 : 1,
          results: Array(10)
            .fill(null)
            .map((_, i) => ({
              testId: `test-${i}`,
              name: `Test ${i}`,
              passed: i < (baseline ? 8 : 9),
              executionTimeMs: 10,
            })),
        };
      };

      // Create experiment loop
      const loop = createExperimentLoop(
        hypothesisGenerator,
        changeApplicator,
        testRunner
      );

      // Run experiment
      const config: ExperimentConfig = {
        maxIterations: 3,
        stopOnRegression: false,
        requireHumanApproval: false,
        dryRun: true,
      };

      const results: ExperimentResult[] = [];
      for await (const result of loop.run(config)) {
        results.push(result);
      }

      // Verify
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(3);
      expect(hypothesisCallCount).toBeGreaterThan(0);
      expect(testCallCount).toBeGreaterThan(0);

      const status = loop.getStatus();
      expect(status.status).toBe(ExperimentStatus.COMPLETED);
    });

    it('should stop when no hypotheses available', async () => {
      const hypothesisGenerator = async (): Promise<Hypothesis[]> => {
        return []; // No hypotheses
      };

      const changeApplicator = async (): Promise<void> => {};
      const testRunner = async (): Promise<any> => ({ totalTests: 0, passed: 0 });

      const loop = createExperimentLoop(
        hypothesisGenerator,
        changeApplicator,
        testRunner
      );

      const config: ExperimentConfig = {
        maxIterations: 10,
        stopOnRegression: false,
        requireHumanApproval: false,
        dryRun: true,
      };

      const results: ExperimentResult[] = [];
      for await (const result of loop.run(config)) {
        results.push(result);
      }

      expect(results.length).toBe(0);

      const status = loop.getStatus();
      expect(status.status).toBe(ExperimentStatus.RUNNING); // No iterations ran
    });

    it('should respect maxIterations', async () => {
      const hypothesisGenerator = async (): Promise<Hypothesis[]> => {
        return [
          {
            id: `hyp-${Date.now()}`,
            priority: 50,
            description: 'Test',
            hypothesis: 'Test',
            targetFile: 'test.ts',
            modificationType: 'addition',
            proposedChange: 'Test',
            metadata: {
              generatedAt: new Date().toISOString(),
              source: 'analysis',
              confidence: 0.5,
            },
          },
        ];
      };

      const changeApplicator = async (): Promise<void> => {};
      const testRunner = async (): Promise<any> => ({
        totalTests: 5,
        passed: 5,
        failed: 0,
        results: [],
      });

      const loop = createExperimentLoop(
        hypothesisGenerator,
        changeApplicator,
        testRunner
      );

      const config: ExperimentConfig = {
        maxIterations: 2,
        stopOnRegression: false,
        requireHumanApproval: false,
        dryRun: true,
      };

      const results: ExperimentResult[] = [];
      for await (const result of loop.run(config)) {
        results.push(result);
      }

      expect(results.length).toBe(2);

      const status = loop.getStatus();
      expect(status.currentIteration).toBe(2);
      expect(status.maxIterations).toBe(2);
    });
  });

  describe('Safety Features', () => {
    it('should stop on regression when configured', async () => {
      let iteration = 0;

      const hypothesisGenerator = async (): Promise<Hypothesis[]> => {
        iteration++;
        return [
          {
            id: `hyp-${iteration}`,
            priority: 50,
            description: `Hypothesis ${iteration}`,
            hypothesis: 'Test',
            targetFile: 'test.ts',
            modificationType: 'addition',
            proposedChange: 'Test',
            metadata: {
              generatedAt: new Date().toISOString(),
              source: 'analysis',
              confidence: 0.5,
            },
          },
        ];
      };

      const changeApplicator = async (): Promise<void> => {};

      const testRunner = async (baseline: boolean): Promise<any> => {
        // Second iteration causes regression
        const passed = iteration === 2 && !baseline ? 5 : 10;

        return {
          totalTests: 10,
          passed,
          failed: 10 - passed,
          results: Array(10)
            .fill(null)
            .map((_, i) => ({
              testId: `test-${i}`,
              name: `Test ${i}`,
              passed: i < passed,
              executionTimeMs: 10,
            })),
        };
      };

      const loop = createExperimentLoop(
        hypothesisGenerator,
        changeApplicator,
        testRunner
      );

      const config: ExperimentConfig = {
        maxIterations: 10,
        stopOnRegression: true, // Should stop when regression detected
        requireHumanApproval: false,
        dryRun: true,
      };

      const results: ExperimentResult[] = [];
      for await (const result of loop.run(config)) {
        results.push(result);
      }

      // Should stop early due to regression
      expect(results.length).toBeLessThan(10);

      const status = loop.getStatus();
      expect(status.status).toBe(ExperimentStatus.STOPPED);
    });

    it('should not apply changes in dry run mode', async () => {
      let changeApplied = false;

      const hypothesisGenerator = async (): Promise<Hypothesis[]> => {
        return [
          {
            id: 'hyp-1',
            priority: 50,
            description: 'Test',
            hypothesis: 'Test',
            targetFile: 'test.ts',
            modificationType: 'addition',
            proposedChange: 'Test',
            metadata: {
              generatedAt: new Date().toISOString(),
              source: 'analysis',
              confidence: 0.5,
            },
          },
        ];
      };

      const changeApplicator = async (): Promise<void> => {
        changeApplied = true;
      };

      const testRunner = async (): Promise<any> => ({
        totalTests: 10,
        passed: 10,
        failed: 0,
        results: [],
      });

      const loop = createExperimentLoop(
        hypothesisGenerator,
        changeApplicator,
        testRunner
      );

      const config: ExperimentConfig = {
        maxIterations: 1,
        stopOnRegression: false,
        requireHumanApproval: false,
        dryRun: true, // Dry run mode
      };

      const results: ExperimentResult[] = [];
      for await (const result of loop.run(config)) {
        results.push(result);
      }

      expect(changeApplied).toBe(false);
      expect(results[0]?.applied).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should track status correctly', async () => {
      const hypothesisGenerator = async (): Promise<Hypothesis[]> => [
        {
          id: 'hyp-1',
          priority: 50,
          description: 'Test',
          hypothesis: 'Test',
          targetFile: 'test.ts',
          modificationType: 'addition',
          proposedChange: 'Test',
          metadata: {
            generatedAt: new Date().toISOString(),
            source: 'analysis',
            confidence: 0.5,
          },
        },
      ];

      const changeApplicator = async (): Promise<void> => {};
      const testRunner = async (): Promise<any> => ({
        totalTests: 10,
        passed: 10,
        failed: 0,
        results: [],
      });

      const loop = createExperimentLoop(
        hypothesisGenerator,
        changeApplicator,
        testRunner
      );

      const config: ExperimentConfig = {
        maxIterations: 2,
        stopOnRegression: false,
        requireHumanApproval: false,
        dryRun: true,
      };

      // Check initial status
      let status = loop.getStatus();
      expect(status.status).toBe(ExperimentStatus.IDLE);
      expect(status.currentIteration).toBe(0);

      // Run experiment
      let iterationCount = 0;
      for await (const result of loop.run(config)) {
        iterationCount++;
        status = loop.getStatus();
        expect(status.status).toBe(ExperimentStatus.RUNNING);
        expect(status.currentIteration).toBe(iterationCount);
      }

      // Check final status
      status = loop.getStatus();
      expect(status.status).toBe(ExperimentStatus.COMPLETED);
      expect(status.hypothesesTested).toBeGreaterThan(0);
    });

    it('should maintain experiment history', async () => {
      const hypothesisGenerator = async (): Promise<Hypothesis[]> => [
        {
          id: `hyp-${Date.now()}`,
          priority: 50,
          description: 'Test',
          hypothesis: 'Test',
          targetFile: 'test.ts',
          modificationType: 'addition',
          proposedChange: 'Test',
          metadata: {
            generatedAt: new Date().toISOString(),
            source: 'analysis',
            confidence: 0.5,
          },
        },
      ];

      const changeApplicator = async (): Promise<void> => {};
      const testRunner = async (): Promise<any> => ({
        totalTests: 10,
        passed: 10,
        failed: 0,
        results: [],
      });

      const loop = createExperimentLoop(
        hypothesisGenerator,
        changeApplicator,
        testRunner
      );

      const config: ExperimentConfig = {
        maxIterations: 3,
        stopOnRegression: false,
        requireHumanApproval: false,
        dryRun: true,
      };

      // Run experiment
      for await (const result of loop.run(config)) {
        // Just consume results
      }

      // Check history
      const history = loop.getHistory();
      expect(history.length).toBe(3);
      expect(history[0].iteration).toBe(1);
      expect(history[1].iteration).toBe(2);
      expect(history[2].iteration).toBe(3);
    });
  });

  describe('Control Flow', () => {
    it('should support stopping', async () => {
      const hypothesisGenerator = async (): Promise<Hypothesis[]> => [
        {
          id: `hyp-${Date.now()}`,
          priority: 50,
          description: 'Test',
          hypothesis: 'Test',
          targetFile: 'test.ts',
          modificationType: 'addition',
          proposedChange: 'Test',
          metadata: {
            generatedAt: new Date().toISOString(),
            source: 'analysis',
            confidence: 0.5,
          },
        },
      ];

      const changeApplicator = async (): Promise<void> => {};
      const testRunner = async (): Promise<any> => ({
        totalTests: 10,
        passed: 10,
        failed: 0,
        results: [],
      });

      const loop = createExperimentLoop(
        hypothesisGenerator,
        changeApplicator,
        testRunner
      );

      const config: ExperimentConfig = {
        maxIterations: 100,
        stopOnRegression: false,
        requireHumanApproval: false,
        dryRun: true,
      };

      // Stop after 2 iterations
      let count = 0;
      for await (const result of loop.run(config)) {
        count++;
        if (count >= 2) {
          loop.stop();
        }
      }

      expect(count).toBe(2);

      const status = loop.getStatus();
      expect(status.status).toBe(ExperimentStatus.STOPPED);
    });
  });
});
