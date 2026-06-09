/**
 * Tests for Sandboxed Execution Environment
 */

import {
  createSandbox,
  createSandboxManager,
  sandboxedExecute,
  parallelSandboxedExecute,
  DEFAULT_LIMITS,
  ResourceLimits,
  ManagedSandboxConfig,
  Sandbox,
  SandboxManager,
} from '../sandbox';

describe('Sandbox', () => {
  describe('createSandbox', () => {
    test('creates sandbox with default config', () => {
      const sandbox = createSandbox('test-sandbox');

      expect(sandbox.id).toBe('test-sandbox');
      expect(sandbox.isActive).toBe(true);
      expect(sandbox.config.limits.maxMemoryMB).toBe(DEFAULT_LIMITS.maxMemoryMB);
      expect(sandbox.config.limits.maxTimeMs).toBe(DEFAULT_LIMITS.maxTimeMs);
    });

    test('creates sandbox with custom limits', () => {
      const customLimits: ResourceLimits = {
        maxMemoryMB: 256,
        maxTimeMs: 10000,
        maxCpuPercent: 50,
      };

      const sandbox = createSandbox('custom-sandbox', {
        limits: customLimits,
      });

      expect(sandbox.config.limits.maxMemoryMB).toBe(256);
      expect(sandbox.config.limits.maxTimeMs).toBe(10000);
      expect(sandbox.config.limits.maxCpuPercent).toBe(50);
    });

    test('creates sandbox with tracing disabled', () => {
      const sandbox = createSandbox('no-trace', {
        captureTrace: false,
      });

      expect(sandbox.config.captureTrace).toBe(false);
    });
  });

  describe('executeCode', () => {
    test('executes simple JavaScript code', async () => {
      const sandbox = createSandbox('js-test', {
        isolateErrors: false,
      });

      const result = await sandbox.executeCode(
        'console.log("result")',
        'javascript'
      );

      expect(result).toContain('result');
      sandbox.cleanup();
    });

    test('executes code with JSON output', async () => {
      const sandbox = createSandbox('json-test', {
        isolateErrors: false,
      });

      const result = await sandbox.executeCode(
        'console.log(JSON.stringify({ test: true }))',
        'javascript'
      );

      // Result should be the stdout
      expect(result).toBeTruthy();
      expect(result).toContain('test');
      sandbox.cleanup();
    });

    test('handles execution errors gracefully with isolation', async () => {
      const sandbox = createSandbox('error-test', {
        isolateErrors: true,
      });

      const result = await sandbox.executeCode(
        'throw new Error("test error")',
        'javascript'
      );

      // With error isolation, should return null instead of throwing
      expect(result).toBeNull();

      const trace = sandbox.getTrace();
      expect(trace?.errors.length).toBeGreaterThan(0);

      sandbox.cleanup();
    });

    test('throws errors without isolation', async () => {
      const sandbox = createSandbox('no-isolation', {
        isolateErrors: false,
      });

      await expect(
        sandbox.executeCode('process.exit(1)', 'javascript')
      ).rejects.toThrow();

      sandbox.cleanup();
    });

    test('tracks resource usage', async () => {
      const sandbox = createSandbox('resource-test');

      await sandbox.executeCode('console.log("test")', 'javascript');

      const usage = sandbox.getResourceUsage();

      expect(usage.wallTimeMs).toBeGreaterThan(0);
      expect(usage.outputBytes).toBeGreaterThan(0);

      sandbox.cleanup();
    });
  });

  describe('executeCommand', () => {
    test('executes shell command', async () => {
      const sandbox = createSandbox('cmd-test');

      const result = await sandbox.executeCommand('echo', {
        args: ['hello world'],
      });

      expect(result).toContain('hello world');
      sandbox.cleanup();
    });

    test('handles command failures with isolation', async () => {
      const sandbox = createSandbox('cmd-fail', {
        isolateErrors: true,
      });

      const result = await sandbox.executeCommand('false');

      expect(result).toBeNull();
      sandbox.cleanup();
    });

    test('tracks command execution in trace', async () => {
      const sandbox = createSandbox('cmd-trace');

      await sandbox.executeCommand('echo', { args: ['test'] });

      const trace = sandbox.getTrace();

      expect(trace).toBeTruthy();
      expect(trace!.steps.length).toBeGreaterThan(0);
      expect(trace!.steps[0].action).toBe('execute_command');

      sandbox.cleanup();
    });
  });

  describe('execution trace', () => {
    test('captures execution steps', async () => {
      const sandbox = createSandbox('trace-test');

      await sandbox.executeCode('console.log("step 1")', 'javascript');
      await sandbox.executeCode('console.log("step 2")', 'javascript');

      const trace = sandbox.getTrace();

      expect(trace).toBeTruthy();
      expect(trace!.steps.length).toBe(2);
      expect(trace!.sandboxId).toBe('trace-test');
      expect(trace!.startTime).toBeLessThanOrEqual(Date.now());

      sandbox.cleanup();
    });

    test('records execution duration', async () => {
      const sandbox = createSandbox('duration-test');

      await sandbox.executeCode('console.log("test")', 'javascript');

      const trace = sandbox.getTrace();

      expect(trace!.steps[0].durationMs).toBeGreaterThan(0);

      sandbox.cleanup();
    });

    test('captures errors in trace', async () => {
      const sandbox = createSandbox('error-trace', {
        isolateErrors: true,
      });

      await sandbox.executeCode('throw new Error("traced error")', 'javascript');

      const trace = sandbox.getTrace();

      expect(trace!.errors.length).toBeGreaterThan(0);
      expect(trace!.exitReason).toBe('error');

      sandbox.cleanup();
    });

    test('records successful completion', async () => {
      const sandbox = createSandbox('success-trace', {
        isolateErrors: false,
      });

      await sandbox.executeCode('console.log("success")', 'javascript');

      const trace = sandbox.getTrace();

      expect(trace!.steps[0].result).toBe('success');

      sandbox.cleanup();
    });
  });

  describe('forceTerminate', () => {
    test('terminates active execution', async () => {
      const sandbox = createSandbox('terminate-test', {
        limits: {
          maxMemoryMB: 512,
          maxTimeMs: 30000,
          maxCpuPercent: 80,
        },
      });

      // Start a long-running task
      const promise = sandbox.executeCode(
        'const start = Date.now(); while (Date.now() - start < 10000) {}',
        'javascript'
      );

      // Give it time to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      sandbox.forceTerminate();

      // Should not throw, execution is terminated
      await promise.catch(() => {
        // Expected to fail
      });

      const trace = sandbox.getTrace();
      expect(trace?.exitReason).toBe('terminated');

      sandbox.cleanup();
    });
  });

  describe('cleanup', () => {
    test('cleans up sandbox resources', () => {
      const sandbox = createSandbox('cleanup-test');

      sandbox.cleanup();

      expect(sandbox.isActive).toBe(false);
    });

    test('prevents execution after cleanup', async () => {
      const sandbox = createSandbox('cleanup-prevent');

      sandbox.cleanup();

      await expect(
        sandbox.executeCode('console.log("test")', 'javascript')
      ).rejects.toThrow('not active');
    });

    test('finalizes trace on cleanup', () => {
      const sandbox = createSandbox('cleanup-trace');

      sandbox.cleanup();

      const trace = sandbox.getTrace();

      expect(trace?.endTime).toBeGreaterThan(0);
    });
  });
});

describe('SandboxManager', () => {
  describe('createSandbox', () => {
    test('creates and tracks sandbox', () => {
      const manager = createSandboxManager();

      const config: ManagedSandboxConfig = {
        id: 'managed-sandbox',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      };

      const sandbox = manager.createSandbox(config);

      expect(sandbox.id).toBe('managed-sandbox');
      expect(manager.listActive()).toContain('managed-sandbox');

      manager.destroy();
    });

    test('prevents duplicate sandbox IDs', () => {
      const manager = createSandboxManager();

      const config: ManagedSandboxConfig = {
        id: 'duplicate',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      };

      manager.createSandbox(config);

      expect(() => manager.createSandbox(config)).toThrow('already exists');

      manager.destroy();
    });

    test('updates statistics on creation', () => {
      const manager = createSandboxManager();

      const config: ManagedSandboxConfig = {
        id: 'stats-test',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      };

      manager.createSandbox(config);

      const stats = manager.getStats();

      expect(stats.totalCreated).toBe(1);
      expect(stats.activeCount).toBe(1);

      manager.destroy();
    });
  });

  describe('getSandbox', () => {
    test('retrieves sandbox by ID', () => {
      const manager = createSandboxManager();

      const config: ManagedSandboxConfig = {
        id: 'retrieve-test',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      };

      manager.createSandbox(config);

      const sandbox = manager.getSandbox('retrieve-test');

      expect(sandbox).toBeTruthy();
      expect(sandbox!.id).toBe('retrieve-test');

      manager.destroy();
    });

    test('returns undefined for non-existent sandbox', () => {
      const manager = createSandboxManager();

      const sandbox = manager.getSandbox('non-existent');

      expect(sandbox).toBeUndefined();

      manager.destroy();
    });
  });

  describe('listActive', () => {
    test('lists all active sandboxes', () => {
      const manager = createSandboxManager();

      manager.createSandbox({
        id: 'active-1',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      });

      manager.createSandbox({
        id: 'active-2',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      });

      const active = manager.listActive();

      expect(active).toHaveLength(2);
      expect(active).toContain('active-1');
      expect(active).toContain('active-2');

      manager.destroy();
    });

    test('excludes cleaned up sandboxes', () => {
      const manager = createSandboxManager();

      const sandbox = manager.createSandbox({
        id: 'cleanup-exclude',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      });

      sandbox.cleanup();

      const active = manager.listActive();

      expect(active).not.toContain('cleanup-exclude');

      manager.destroy();
    });
  });

  describe('cleanupAll', () => {
    test('cleans up all sandboxes', () => {
      const manager = createSandboxManager();

      const s1 = manager.createSandbox({
        id: 'cleanup-all-1',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      });

      const s2 = manager.createSandbox({
        id: 'cleanup-all-2',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      });

      manager.cleanupAll();

      expect(s1.isActive).toBe(false);
      expect(s2.isActive).toBe(false);
      expect(manager.listActive()).toHaveLength(0);

      manager.destroy();
    });

    test('updates cleanup statistics', () => {
      const manager = createSandboxManager();

      manager.createSandbox({
        id: 'cleanup-stats',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      });

      manager.cleanupAll();

      const stats = manager.getStats();

      expect(stats.cleanupOperations).toBeGreaterThan(0);
      expect(stats.activeCount).toBe(0);

      manager.destroy();
    });
  });

  describe('getStats', () => {
    test('returns accurate statistics', () => {
      const manager = createSandboxManager();

      manager.createSandbox({
        id: 'stats-1',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      });

      manager.createSandbox({
        id: 'stats-2',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      });

      const stats = manager.getStats();

      expect(stats.totalCreated).toBe(2);
      expect(stats.activeCount).toBe(2);

      manager.destroy();
    });
  });

  describe('destroy', () => {
    test('destroys manager and cleans up all sandboxes', () => {
      const manager = createSandboxManager();

      manager.createSandbox({
        id: 'destroy-test',
        limits: DEFAULT_LIMITS,
        captureTrace: true,
        isolateErrors: true,
      });

      manager.destroy();

      expect(manager.listActive()).toHaveLength(0);
      expect(manager.getStats().activeCount).toBe(0);
    });
  });
});

describe('sandboxedExecute', () => {
  test('executes code in one-off sandbox', async () => {
    const { result, trace } = await sandboxedExecute(
      'console.log("one-off test")',
      { language: 'javascript' }
    );

    expect(result).toContain('one-off test');
    expect(trace).toBeTruthy();
    expect(trace!.steps.length).toBeGreaterThan(0);
  });

  test('applies custom timeout', async () => {
    const { result } = await sandboxedExecute(
      'console.log("custom timeout")',
      { timeout: 5000 }
    );

    expect(result).toContain('custom timeout');
  });

  test('applies custom memory limit', async () => {
    const { result } = await sandboxedExecute(
      'console.log("custom memory")',
      { maxMemory: 256 }
    );

    expect(result).toContain('custom memory');
  });

  test('can disable tracing', async () => {
    const { result, trace } = await sandboxedExecute(
      'console.log("no trace")',
      { captureTrace: false }
    );

    expect(result).toContain('no trace');
    expect(trace).toBeUndefined();
  });
});

describe('parallelSandboxedExecute', () => {
  test('executes multiple tasks in parallel', async () => {
    const tasks = [
      { id: 'task-1', code: 'console.log("task 1")' },
      { id: 'task-2', code: 'console.log("task 2")' },
      { id: 'task-3', code: 'console.log("task 3")' },
    ];

    const results = await parallelSandboxedExecute(tasks);

    expect(results).toHaveLength(3);
    expect(results[0].id).toBe('task-1');
    expect(results[1].id).toBe('task-2');
    expect(results[2].id).toBe('task-3');

    results.forEach((r) => {
      // With isolateErrors: true (default), failed results return null
      // but successful ones return stdout
      if (!r.error) {
        expect(r.result).toBeTruthy();
      }
    });
  });

  test('handles task failures gracefully', async () => {
    const tasks = [
      { id: 'success', code: 'console.log("ok")' },
      { id: 'failure', code: 'process.exit(1)' },
    ];

    const results = await parallelSandboxedExecute(tasks);

    expect(results).toHaveLength(2);

    const successResult = results.find((r) => r.id === 'success');
    const failureResult = results.find((r) => r.id === 'failure');

    // Success result should have output (not null, no error)
    expect(successResult?.result).toBeTruthy();
    expect(successResult?.error).toBeUndefined();

    // Failure result should be null with isolateErrors
    expect(failureResult?.result).toBeNull();
  });

  test('respects concurrency limit', async () => {
    const tasks = Array.from({ length: 10 }, (_, i) => ({
      id: `task-${i}`,
      code: `console.log("task ${i}")`,
    }));

    const results = await parallelSandboxedExecute(tasks, {
      maxConcurrent: 3,
    });

    expect(results).toHaveLength(10);
  });

  test('applies timeout to all tasks', async () => {
    const tasks = [
      { id: 'quick', code: 'console.log("quick")' },
      { id: 'slow', code: 'setTimeout(() => {}, 10000)' },
    ];

    const results = await parallelSandboxedExecute(tasks, {
      timeout: 1000,
    });

    expect(results).toHaveLength(2);
  });

  test('captures traces for all tasks', async () => {
    const tasks = [
      { id: 'trace-1', code: 'console.log("trace 1")' },
      { id: 'trace-2', code: 'console.log("trace 2")' },
    ];

    const results = await parallelSandboxedExecute(tasks);

    results.forEach((r) => {
      expect(r.trace).toBeTruthy();
      expect(r.trace!.sandboxId).toBe(r.id);
    });
  });
});

describe('integration tests', () => {
  test('complete workflow with manager', async () => {
    const manager = createSandboxManager();

    // Create sandboxes
    const sandbox1 = manager.createSandbox({
      id: 'workflow-1',
      limits: DEFAULT_LIMITS,
      captureTrace: true,
      isolateErrors: false,
    });

    const sandbox2 = manager.createSandbox({
      id: 'workflow-2',
      limits: DEFAULT_LIMITS,
      captureTrace: true,
      isolateErrors: false,
    });

    // Execute tasks
    const result1 = await sandbox1.executeCode(
      'console.log("workflow 1")',
      'javascript'
    );

    const result2 = await sandbox2.executeCommand('echo', {
      args: ['workflow 2'],
    });

    // Verify results
    expect(result1).toContain('workflow 1');
    expect(result2).toContain('workflow 2');

    // Check traces
    const trace1 = sandbox1.getTrace();
    const trace2 = sandbox2.getTrace();

    expect(trace1!.steps.length).toBeGreaterThan(0);
    expect(trace2!.steps.length).toBeGreaterThan(0);

    // Get stats
    const stats = manager.getStats();

    expect(stats.totalCreated).toBe(2);
    expect(stats.activeCount).toBe(2);

    // Cleanup
    manager.cleanupAll();

    expect(sandbox1.isActive).toBe(false);
    expect(sandbox2.isActive).toBe(false);

    manager.destroy();
  });

  test('handles mixed success and failure', async () => {
    const manager = createSandboxManager();

    const sandbox = manager.createSandbox({
      id: 'mixed-results',
      limits: DEFAULT_LIMITS,
      captureTrace: true,
      isolateErrors: true,
    });

    // Execute successful task
    const success = await sandbox.executeCode(
      'console.log("success")',
      'javascript'
    );

    // Execute failing task
    const failure = await sandbox.executeCode(
      'throw new Error("intentional failure")',
      'javascript'
    );

    // Execute another successful task
    const success2 = await sandbox.executeCode(
      'console.log("recovered")',
      'javascript'
    );

    expect(success).toBeTruthy();
    expect(failure).toBeNull(); // Error isolated
    expect(success2).toBeTruthy();

    const trace = sandbox.getTrace();

    expect(trace!.steps.length).toBe(3);
    expect(trace!.errors.length).toBeGreaterThan(0);

    manager.destroy();
  });
});
