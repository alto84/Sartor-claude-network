/**
 * Multi-Agent Orchestration Tests
 *
 * Tests for the orchestrator-worker pattern implementation
 */

import {
  createOrchestrator,
  createMockWorker,
  createTask,
  DelegationPattern,
  type Task,
  type Worker,
  type TaskResult,
} from './multi-agent-orchestration';

describe('Multi-Agent Orchestration', () => {
  describe('Orchestrator Creation', () => {
    it('should create an orchestrator with default config', () => {
      const orchestrator = createOrchestrator({ id: 'test-orchestrator' });
      expect(orchestrator).toBeDefined();

      const status = orchestrator.getStatus();
      expect(status.orchestratorId).toBe('test-orchestrator');
      expect(status.activeWorkers).toBe(0);
      expect(status.queuedTasks).toBe(0);
      expect(status.completedTasks).toBe(0);
    });

    it('should create orchestrator with custom config', () => {
      const orchestrator = createOrchestrator({
        id: 'custom-orchestrator',
        maxConcurrentTasks: 10,
        defaultTimeout: 60000,
      });

      expect(orchestrator).toBeDefined();
    });
  });

  describe('Worker Registration', () => {
    it('should register a worker', () => {
      const orchestrator = createOrchestrator({ id: 'test' });
      const worker = createMockWorker('worker-1', 'frontend', ['react']);

      orchestrator.registerWorker(worker);

      const status = orchestrator.getStatus();
      expect(status.workers.length).toBe(1);
      expect(status.workers[0].id).toBe('worker-1');
    });

    it('should unregister a worker', () => {
      const orchestrator = createOrchestrator({ id: 'test' });
      const worker = createMockWorker('worker-1', 'frontend', ['react']);

      orchestrator.registerWorker(worker);
      orchestrator.unregisterWorker('worker-1');

      const status = orchestrator.getStatus();
      expect(status.workers.length).toBe(0);
    });
  });

  describe('Task Creation', () => {
    it('should create a task with intent', () => {
      const task = createTask('task-1', 'analysis', 'Analyze codebase for security issues');

      expect(task.id).toBe('task-1');
      expect(task.type).toBe('analysis');
      expect(task.intent).toBe('Analyze codebase for security issues');
      expect(task.priority).toBe('normal');
      expect(task.dependencies).toEqual([]);
    });

    it('should create task with options', () => {
      const task = createTask('task-2', 'implementation', 'Implement authentication', {
        priority: 'high',
        dependencies: ['task-1'],
        constraints: ['Use JWT', 'Follow OAuth 2.0'],
        successCriteria: ['Tests pass', 'Security audit approved'],
      });

      expect(task.priority).toBe('high');
      expect(task.dependencies).toEqual(['task-1']);
      expect(task.constraints).toHaveLength(2);
      expect(task.successCriteria).toHaveLength(2);
    });
  });

  describe('Worker Assignment', () => {
    it('should assign task to best matching worker', () => {
      const orchestrator = createOrchestrator({ id: 'test' });

      const workers = [
        createMockWorker('frontend-worker', 'frontend', ['react', 'typescript']),
        createMockWorker('backend-worker', 'backend', ['node', 'express']),
        createMockWorker('devops-worker', 'devops', ['docker', 'kubernetes']),
      ];

      workers.forEach((w) => orchestrator.registerWorker(w));

      const task = createTask('task-1', 'frontend', 'Optimize React component rendering');

      const assignment = orchestrator.assignWorker(task, workers);

      expect(assignment).toBeDefined();
      expect(assignment?.worker.id).toBe('frontend-worker');
      expect(assignment?.matchScore).toBeGreaterThan(0.3);
    });

    it('should return null when no suitable worker found', () => {
      const orchestrator = createOrchestrator({ id: 'test' });

      const workers = [createMockWorker('frontend-worker', 'frontend', ['react'])];

      const task = createTask('task-1', 'database', 'Optimize SQL queries');

      const assignment = orchestrator.assignWorker(task, workers);

      // Should still assign but with low score, or null
      expect(assignment === null || assignment.matchScore < 0.5).toBe(true);
    });
  });

  describe('Intent Validation', () => {
    it('should validate task intent before delegation', async () => {
      const orchestrator = createOrchestrator({ id: 'test' });
      const worker = createMockWorker('worker-1', 'analysis', ['code-review']);
      orchestrator.registerWorker(worker);

      // Task with empty intent should fail validation
      const invalidTask = createTask('task-1', 'analysis', '');

      const result = await orchestrator.delegateTask(invalidTask);

      expect(result.success).toBe(false);
      expect(result.error).toContain('intent');
    });

    it('should reject step-by-step instructions in intent', async () => {
      const orchestrator = createOrchestrator({ id: 'test' });
      const worker = createMockWorker('worker-1', 'analysis', ['code-review']);
      orchestrator.registerWorker(worker);

      // Task with step-by-step instructions violates intent-based delegation
      const invalidTask = createTask(
        'task-1',
        'analysis',
        'First analyze the code, then check tests, finally write report'
      );

      const result = await orchestrator.delegateTask(invalidTask);

      expect(result.success).toBe(false);
      expect(result.error).toContain('step-by-step');
    });

    it('should accept outcome-focused intent', async () => {
      const orchestrator = createOrchestrator({ id: 'test' });
      const worker = createMockWorker('worker-1', 'analysis', ['code-review']);
      orchestrator.registerWorker(worker);

      const validTask = createTask(
        'task-1',
        'analysis',
        'Identify security vulnerabilities in authentication module'
      );

      const result = await orchestrator.delegateTask(validTask);

      expect(result.success).toBe(true);
      expect(result.assignedWorker).toBe('worker-1');
    });
  });

  describe('Delegation Patterns', () => {
    it('should execute tasks with Parallel Fan-Out pattern', async () => {
      const orchestrator = createOrchestrator({ id: 'test' });

      const workers = [
        createMockWorker('worker-1', 'frontend', ['react']),
        createMockWorker('worker-2', 'backend', ['node']),
        createMockWorker('worker-3', 'database', ['sql']),
      ];

      workers.forEach((w) => orchestrator.registerWorker(w));

      const tasks = [
        createTask('task-1', 'frontend', 'Analyze React components'),
        createTask('task-2', 'backend', 'Review API endpoints'),
        createTask('task-3', 'database', 'Optimize queries'),
      ];

      const result = await orchestrator.executeWithPattern(
        tasks,
        DelegationPattern.PARALLEL_FAN_OUT
      );

      expect(result.results).toHaveLength(3);
      expect(result.synthesis).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should execute tasks with Serial Chain pattern', async () => {
      const orchestrator = createOrchestrator({ id: 'test' });

      const worker = createMockWorker('worker-1', 'development', ['full-stack']);
      orchestrator.registerWorker(worker);

      const tasks = [
        createTask('task-1', 'development', 'Research best practices', {
          dependencies: [],
        }),
        createTask('task-2', 'development', 'Implement solution', {
          dependencies: ['task-1'],
        }),
        createTask('task-3', 'development', 'Write tests', {
          dependencies: ['task-2'],
        }),
      ];

      const result = await orchestrator.executeWithPattern(tasks, DelegationPattern.SERIAL_CHAIN);

      expect(result.results).toHaveLength(3);
      expect(result.results.every((r) => r.success)).toBe(true);
    });

    it('should execute tasks with Competitive Exploration pattern', async () => {
      const orchestrator = createOrchestrator({ id: 'test' });

      const workers = [
        createMockWorker('approach-a', 'architecture', ['sql']),
        createMockWorker('approach-b', 'architecture', ['nosql']),
        createMockWorker('approach-c', 'architecture', ['graph']),
      ];

      workers.forEach((w) => orchestrator.registerWorker(w));

      const tasks = [
        createTask('explore-1', 'architecture', 'Design data model using SQL'),
        createTask('explore-2', 'architecture', 'Design data model using NoSQL'),
        createTask('explore-3', 'architecture', 'Design data model using Graph DB'),
      ];

      const result = await orchestrator.executeWithPattern(
        tasks,
        DelegationPattern.COMPETITIVE_EXPLORATION
      );

      expect(result.results).toHaveLength(3);
      expect(result.insights.length).toBeGreaterThan(0);
    });
  });

  describe('Result Synthesis', () => {
    it('should synthesize results from multiple workers', () => {
      const orchestrator = createOrchestrator({ id: 'test' });

      const results: TaskResult[] = [
        {
          taskId: 'task-1',
          workerId: 'worker-1',
          success: true,
          output: { finding: 'No issues found' },
          confidence: 0.9,
          reasoning: 'Comprehensive analysis completed',
        },
        {
          taskId: 'task-2',
          workerId: 'worker-2',
          success: true,
          output: { finding: 'Minor performance concerns' },
          confidence: 0.7,
          reasoning: 'Some areas need optimization',
        },
      ];

      const synthesis = orchestrator.synthesizeResults(results);

      expect(synthesis.results).toHaveLength(2);
      expect(synthesis.synthesis).toBeDefined();
      expect(synthesis.confidence).toBeGreaterThan(0);
      expect(synthesis.insights).toBeDefined();
    });

    it('should preserve conflicts instead of forcing consensus', () => {
      const orchestrator = createOrchestrator({ id: 'test' });

      const results: TaskResult[] = [
        {
          taskId: 'task-1',
          workerId: 'optimist',
          success: true,
          output: { assessment: 'Ready for production' },
          confidence: 0.9,
        },
        {
          taskId: 'task-2',
          workerId: 'pessimist',
          success: true,
          output: { assessment: 'Needs more testing' },
          confidence: 0.3,
          issues: ['Edge cases untested'],
        },
      ];

      const synthesis = orchestrator.synthesizeResults(results);

      expect(synthesis.conflicts.length).toBeGreaterThan(0);
      expect(synthesis.confidence).toBeLessThan(0.9); // Penalized for disagreement
    });

    it('should extract emergent insights from combined results', () => {
      const orchestrator = createOrchestrator({ id: 'test' });

      const results: TaskResult[] = [
        {
          taskId: 'task-1',
          workerId: 'worker-1',
          success: true,
          output: { area: 'Frontend' },
          confidence: 0.8,
          issues: ['Performance bottleneck in rendering'],
        },
        {
          taskId: 'task-2',
          workerId: 'worker-2',
          success: true,
          output: { area: 'Backend' },
          confidence: 0.8,
          issues: ['Performance bottleneck in queries'],
        },
      ];

      const synthesis = orchestrator.synthesizeResults(results);

      expect(synthesis.insights.length).toBeGreaterThan(0);
      expect(synthesis.insights.some((i) => i.includes('Performance'))).toBe(true);
    });
  });

  describe('Worker Failure Recovery', () => {
    it('should retry transient failures', () => {
      const orchestrator = createOrchestrator({ id: 'test' });

      const worker = createMockWorker('worker-1', 'analysis', ['code-review']);
      worker.status.metrics.taskseFailed = 1;
      worker.status.metrics.tasksCompleted = 10;

      orchestrator.registerWorker(worker);

      const error = new Error('Network timeout');
      const recovery = orchestrator.handleWorkerFailure('worker-1', error);

      expect(recovery.action).toBe('retry');
      expect(recovery.delay).toBeGreaterThan(0);
    });

    it('should reassign after repeated failures', () => {
      const orchestrator = createOrchestrator({ id: 'test' });

      const worker1 = createMockWorker('worker-1', 'analysis', ['code-review']);
      worker1.status.metrics.taskseFailed = 5;
      worker1.status.metrics.tasksCompleted = 3;

      const worker2 = createMockWorker('worker-2', 'analysis', ['code-review']);

      orchestrator.registerWorker(worker1);
      orchestrator.registerWorker(worker2);

      const error = new Error('Repeated failure');
      const recovery = orchestrator.handleWorkerFailure('worker-1', error);

      expect(recovery.action).toBe('reassign');
      expect(recovery.newAssignment).toBe('worker-2');
    });
  });

  describe('Dependency Management', () => {
    it('should reject tasks with unsatisfied dependencies', async () => {
      const orchestrator = createOrchestrator({ id: 'test' });
      const worker = createMockWorker('worker-1', 'development', ['coding']);
      orchestrator.registerWorker(worker);

      const task = createTask('task-2', 'development', 'Implement feature', {
        dependencies: ['task-1'], // task-1 not completed
      });

      const result = await orchestrator.delegateTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Dependencies not satisfied');
    });
  });

  describe('Quality Gates', () => {
    it('should check worker capacity before assignment', async () => {
      const orchestrator = createOrchestrator({ id: 'test' });

      const worker = createMockWorker('worker-1', 'analysis', ['review']);
      worker.status.status = 'busy'; // Worker is busy
      orchestrator.registerWorker(worker);

      const task = createTask('task-1', 'analysis', 'Review code');

      const result = await orchestrator.delegateTask(task);

      // Task should be queued if worker is busy
      expect(result.success).toBe(true);
      expect(result.queuePosition).toBeGreaterThan(0);
    });
  });

  describe('Orchestrator Status', () => {
    it('should track completed tasks', async () => {
      const orchestrator = createOrchestrator({ id: 'test' });
      const worker = createMockWorker('worker-1', 'analysis', ['review']);
      orchestrator.registerWorker(worker);

      const tasks = [
        createTask('task-1', 'analysis', 'Review component A'),
        createTask('task-2', 'analysis', 'Review component B'),
      ];

      await orchestrator.executeWithPattern(tasks, DelegationPattern.PARALLEL_FAN_OUT);

      const status = orchestrator.getStatus();
      expect(status.completedTasks).toBe(2);
    });
  });
});
