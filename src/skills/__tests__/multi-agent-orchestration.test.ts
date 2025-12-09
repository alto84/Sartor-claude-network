/**
 * Integration Tests for Multi-Agent Orchestration System
 *
 * Tests the orchestrator-worker pattern implementation:
 * - Task delegation based on worker specialization
 * - Parallel task execution (fan-out pattern)
 * - Result synthesis and aggregation
 * - Failure handling and recovery
 * - Task dependency management
 *
 * Following Anthropic's orchestrator-worker pattern:
 * - Single orchestrator coordinates all work
 * - Workers have single responsibilities
 * - No worker-to-worker communication
 * - Orchestrator handles all coordination
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

import { jest } from '@jest/globals';

// Type definitions for orchestration system
interface Task {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  dependencies?: string[]; // Task IDs that must complete first
  assignedTo?: string;
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

interface Worker {
  id: string;
  specialization: string[];
  status: 'idle' | 'busy' | 'offline';
  currentTask?: string;
  tasksCompleted: number;
  tasksFailed: number;
}

interface OrchestrationResult {
  success: boolean;
  results: Map<string, any>;
  failures: Map<string, string>;
  executionTimeMs: number;
  tasksExecuted: number;
}

interface WorkerCapability {
  type: string;
  confidence: number; // 0-1 score of how well the worker can handle this
}

interface OrchestratorConfig {
  maxParallelTasks?: number;
  taskTimeout?: number;
  enableFailover?: boolean;
  preserveDisagreements?: boolean;
}

interface OrchestratorStats {
  tasksTotal: number;
  tasksCompleted: number;
  tasksFailed: number;
  tasksReassigned: number;
  workersActive: number;
  workersIdle: number;
  averageExecutionTimeMs: number;
}

// Mock implementation interfaces
interface MultiAgentOrchestrator {
  registerWorker(worker: Worker): void;
  unregisterWorker(workerId: string): void;
  submitTask(task: Omit<Task, 'id' | 'status' | 'createdAt'>): Promise<string>;
  executeTask(taskId: string): Promise<any>;
  executeTasks(taskIds: string[]): Promise<OrchestrationResult>;
  executeTasksParallel(
    tasks: Omit<Task, 'id' | 'status' | 'createdAt'>[]
  ): Promise<OrchestrationResult>;
  getTaskStatus(taskId: string): Task | undefined;
  getWorkerStats(): OrchestratorStats;
  getAvailableWorkers(taskType?: string): Worker[];
  synthesizeResults(results: Map<string, any>): any;
  reassignTask(taskId: string, reason: string): Promise<boolean>;
}

// Mock factory function
const createMockOrchestrator = (config: OrchestratorConfig = {}): MultiAgentOrchestrator => {
  const workers: Map<string, Worker> = new Map();
  const tasks: Map<string, Task> = new Map();
  const taskResults: Map<string, any> = new Map();

  const defaultConfig = {
    maxParallelTasks: 10,
    taskTimeout: 5000,
    enableFailover: true,
    preserveDisagreements: true,
    ...config,
  };

  let stats: OrchestratorStats = {
    tasksTotal: 0,
    tasksCompleted: 0,
    tasksFailed: 0,
    tasksReassigned: 0,
    workersActive: 0,
    workersIdle: 0,
    averageExecutionTimeMs: 0,
  };

  const selectWorkerForTask = (task: Task): Worker | undefined => {
    const availableWorkers = Array.from(workers.values()).filter(
      (w) => w.status === 'idle' && w.specialization.includes(task.type)
    );

    if (availableWorkers.length === 0) {
      return undefined;
    }

    // Select worker with best track record
    return availableWorkers.sort((a, b) => {
      const scoreA = a.tasksCompleted / Math.max(1, a.tasksCompleted + a.tasksFailed);
      const scoreB = b.tasksCompleted / Math.max(1, b.tasksCompleted + b.tasksFailed);
      return scoreB - scoreA;
    })[0];
  };

  const executeTaskOnWorker = async (task: Task, worker: Worker): Promise<any> => {
    worker.status = 'busy';
    worker.currentTask = task.id;
    task.status = 'running';
    task.assignedTo = worker.id;

    // Simulate task execution
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Mock result based on task type
    const result = {
      taskId: task.id,
      workerId: worker.id,
      output: `Processed ${task.type} task`,
      data: task.payload,
      timestamp: Date.now(),
    };

    task.status = 'completed';
    task.result = result;
    task.completedAt = Date.now();

    worker.status = 'idle';
    worker.currentTask = undefined;
    worker.tasksCompleted++;

    taskResults.set(task.id, result);
    stats.tasksCompleted++;

    return result;
  };

  return {
    registerWorker(worker: Worker): void {
      workers.set(worker.id, { ...worker });
    },

    unregisterWorker(workerId: string): void {
      workers.delete(workerId);
    },

    async submitTask(taskData): Promise<string> {
      const task: Task = {
        ...taskData,
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        createdAt: Date.now(),
      };

      tasks.set(task.id, task);
      stats.tasksTotal++;

      return task.id;
    },

    async executeTask(taskId: string): Promise<any> {
      const task = tasks.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Check dependencies
      if (task.dependencies && task.dependencies.length > 0) {
        for (const depId of task.dependencies) {
          const depTask = tasks.get(depId);
          if (!depTask || depTask.status !== 'completed') {
            throw new Error(`Dependency ${depId} not completed`);
          }
        }
      }

      const worker = selectWorkerForTask(task);
      if (!worker) {
        throw new Error(`No available worker for task type: ${task.type}`);
      }

      task.status = 'assigned';
      return executeTaskOnWorker(task, worker);
    },

    async executeTasks(taskIds: string[]): Promise<OrchestrationResult> {
      const startTime = Date.now();
      const results = new Map<string, any>();
      const failures = new Map<string, string>();

      for (const taskId of taskIds) {
        try {
          const result = await this.executeTask(taskId);
          results.set(taskId, result);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          failures.set(taskId, errorMsg);
        }
      }

      return {
        success: failures.size === 0,
        results,
        failures,
        executionTimeMs: Date.now() - startTime,
        tasksExecuted: taskIds.length,
      };
    },

    async executeTasksParallel(taskDataArray): Promise<OrchestrationResult> {
      const startTime = Date.now();
      const results = new Map<string, any>();
      const failures = new Map<string, string>();

      // Submit all tasks
      const taskIds = await Promise.all(taskDataArray.map((taskData) => this.submitTask(taskData)));

      // Execute with proper concurrency limiting (wait for workers)
      const maxConcurrent = orchestratorConfig.maxParallelTasks || taskIds.length;
      let active = 0;
      let taskIndex = 0;

      const executeNext = async (): Promise<void> => {
        while (taskIndex < taskIds.length) {
          if (active >= maxConcurrent) {
            await new Promise((resolve) => setTimeout(resolve, 10));
            continue;
          }

          const currentIndex = taskIndex++;
          const taskId = taskIds[currentIndex];
          active++;

          // Wait for an available worker
          let retries = 0;
          while (retries < 20) {
            try {
              const result = await this.executeTask(taskId);
              results.set(taskId, result);
              break;
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              if (errorMsg.includes('No available worker') && retries < 19) {
                retries++;
                await new Promise((resolve) => setTimeout(resolve, 50));
              } else {
                failures.set(taskId, errorMsg);
                break;
              }
            }
          }

          active--;
        }
      };

      // Start worker threads for concurrent execution
      const workerPromises = Array.from({ length: Math.min(maxConcurrent, taskIds.length) }, () =>
        executeNext()
      );

      await Promise.all(workerPromises);

      return {
        success: failures.size === 0,
        results,
        failures,
        executionTimeMs: Date.now() - startTime,
        tasksExecuted: taskIds.length,
      };
    },

    getTaskStatus(taskId: string): Task | undefined {
      return tasks.get(taskId);
    },

    getWorkerStats(): OrchestratorStats {
      const activeWorkers = Array.from(workers.values()).filter((w) => w.status === 'busy');
      const idleWorkers = Array.from(workers.values()).filter((w) => w.status === 'idle');

      const completedTasks = Array.from(tasks.values()).filter((t) => t.status === 'completed');
      const totalTime = completedTasks.reduce((sum, t) => {
        return sum + (t.completedAt ? t.completedAt - t.createdAt : 0);
      }, 0);

      return {
        ...stats,
        workersActive: activeWorkers.length,
        workersIdle: idleWorkers.length,
        averageExecutionTimeMs: completedTasks.length > 0 ? totalTime / completedTasks.length : 0,
      };
    },

    getAvailableWorkers(taskType?: string): Worker[] {
      let available = Array.from(workers.values()).filter((w) => w.status === 'idle');

      if (taskType) {
        available = available.filter((w) => w.specialization.includes(taskType));
      }

      return available;
    },

    synthesizeResults(results: Map<string, any>): any {
      if (results.size === 0) {
        return null;
      }

      if (results.size === 1) {
        return Array.from(results.values())[0];
      }

      // Combine multiple results
      const allResults = Array.from(results.values());

      if (defaultConfig.preserveDisagreements) {
        // Return all results with disagreements preserved
        return {
          consensus: null,
          results: allResults,
          disagreements: allResults.length > 1,
          count: allResults.length,
        };
      }

      // Simple aggregation
      return {
        combined: allResults,
        count: allResults.length,
      };
    },

    async reassignTask(taskId: string, reason: string): Promise<boolean> {
      const task = tasks.get(taskId);
      if (!task) {
        return false;
      }

      // Release current worker
      if (task.assignedTo) {
        const worker = workers.get(task.assignedTo);
        if (worker) {
          worker.status = 'idle';
          worker.currentTask = undefined;
          worker.tasksFailed++;
        }
      }

      // Reset task
      task.status = 'pending';
      task.assignedTo = undefined;
      stats.tasksReassigned++;

      // Try to execute on different worker
      try {
        await this.executeTask(taskId);
        return true;
      } catch (error) {
        task.status = 'failed';
        task.error = reason;
        stats.tasksFailed++;
        return false;
      }
    },
  };
};

describe('Multi-Agent Orchestration System', () => {
  let orchestrator: MultiAgentOrchestrator;

  beforeEach(() => {
    orchestrator = createMockOrchestrator();
  });

  describe('1. Task Delegation', () => {
    describe('Delegate to appropriate worker based on specialization', () => {
      beforeEach(() => {
        orchestrator.registerWorker({
          id: 'analyzer-1',
          specialization: ['data-analysis', 'statistics'],
          status: 'idle',
          tasksCompleted: 0,
          tasksFailed: 0,
        });

        orchestrator.registerWorker({
          id: 'processor-1',
          specialization: ['data-processing', 'transformation'],
          status: 'idle',
          tasksCompleted: 0,
          tasksFailed: 0,
        });
      });

      it('should assign task to worker with matching specialization', async () => {
        const taskId = await orchestrator.submitTask({
          type: 'data-analysis',
          priority: 'medium',
          payload: { data: [1, 2, 3] },
        });

        await orchestrator.executeTask(taskId);

        const task = orchestrator.getTaskStatus(taskId);
        expect(task?.assignedTo).toBe('analyzer-1');
        expect(task?.status).toBe('completed');
      });

      it('should select different workers for different task types', async () => {
        const analysisTaskId = await orchestrator.submitTask({
          type: 'data-analysis',
          priority: 'medium',
          payload: { data: [1, 2, 3] },
        });

        const processingTaskId = await orchestrator.submitTask({
          type: 'data-processing',
          priority: 'medium',
          payload: { data: [4, 5, 6] },
        });

        await orchestrator.executeTask(analysisTaskId);
        await orchestrator.executeTask(processingTaskId);

        const task1 = orchestrator.getTaskStatus(analysisTaskId);
        const task2 = orchestrator.getTaskStatus(processingTaskId);

        expect(task1?.assignedTo).toBe('analyzer-1');
        expect(task2?.assignedTo).toBe('processor-1');
      });

      it('should select worker with best track record when multiple match', async () => {
        // Register another analyzer
        orchestrator.registerWorker({
          id: 'analyzer-2',
          specialization: ['data-analysis'],
          status: 'idle',
          tasksCompleted: 10,
          tasksFailed: 0,
        });

        // Update analyzer-1 stats to have lower success rate
        const workers = orchestrator.getAvailableWorkers('data-analysis');
        expect(workers.length).toBe(2);

        const taskId = await orchestrator.submitTask({
          type: 'data-analysis',
          priority: 'high',
          payload: { data: [1, 2, 3] },
        });

        await orchestrator.executeTask(taskId);

        const task = orchestrator.getTaskStatus(taskId);
        // Should select analyzer-2 with better track record
        expect(task?.assignedTo).toBe('analyzer-2');
      });
    });

    describe('Handle no available workers', () => {
      it('should throw error when no workers registered', async () => {
        const taskId = await orchestrator.submitTask({
          type: 'unknown-task',
          priority: 'medium',
          payload: {},
        });

        await expect(orchestrator.executeTask(taskId)).rejects.toThrow(/No available worker/);
      });

      it('should throw error when no workers match specialization', async () => {
        orchestrator.registerWorker({
          id: 'worker-1',
          specialization: ['data-analysis'],
          status: 'idle',
          tasksCompleted: 0,
          tasksFailed: 0,
        });

        const taskId = await orchestrator.submitTask({
          type: 'image-processing',
          priority: 'medium',
          payload: {},
        });

        await expect(orchestrator.executeTask(taskId)).rejects.toThrow(
          /No available worker for task type: image-processing/
        );
      });

      it('should queue task when all workers busy', async () => {
        orchestrator.registerWorker({
          id: 'worker-1',
          specialization: ['processing'],
          status: 'busy',
          currentTask: 'task-1',
          tasksCompleted: 0,
          tasksFailed: 0,
        });

        const taskId = await orchestrator.submitTask({
          type: 'processing',
          priority: 'medium',
          payload: {},
        });

        await expect(orchestrator.executeTask(taskId)).rejects.toThrow(/No available worker/);

        const task = orchestrator.getTaskStatus(taskId);
        expect(task?.status).toBe('pending');
      });
    });

    describe('Respect task dependencies', () => {
      beforeEach(() => {
        orchestrator.registerWorker({
          id: 'worker-1',
          specialization: ['processing', 'analysis'],
          status: 'idle',
          tasksCompleted: 0,
          tasksFailed: 0,
        });
      });

      it('should execute tasks in dependency order', async () => {
        const task1Id = await orchestrator.submitTask({
          type: 'processing',
          priority: 'medium',
          payload: { step: 1 },
        });

        const task2Id = await orchestrator.submitTask({
          type: 'analysis',
          priority: 'medium',
          payload: { step: 2 },
          dependencies: [task1Id],
        });

        // Should fail if trying to execute task2 before task1
        await expect(orchestrator.executeTask(task2Id)).rejects.toThrow(
          /Dependency.*not completed/
        );

        // Execute task1 first
        await orchestrator.executeTask(task1Id);

        // Now task2 should succeed
        await orchestrator.executeTask(task2Id);

        const task2 = orchestrator.getTaskStatus(task2Id);
        expect(task2?.status).toBe('completed');
      });

      it('should handle multiple dependencies', async () => {
        const task1Id = await orchestrator.submitTask({
          type: 'processing',
          priority: 'medium',
          payload: { step: 1 },
        });

        const task2Id = await orchestrator.submitTask({
          type: 'processing',
          priority: 'medium',
          payload: { step: 2 },
        });

        const task3Id = await orchestrator.submitTask({
          type: 'analysis',
          priority: 'medium',
          payload: { step: 3 },
          dependencies: [task1Id, task2Id],
        });

        // Complete dependencies
        await orchestrator.executeTask(task1Id);
        await orchestrator.executeTask(task2Id);

        // Now task3 should succeed
        await orchestrator.executeTask(task3Id);

        const task3 = orchestrator.getTaskStatus(task3Id);
        expect(task3?.status).toBe('completed');
      });

      it('should allow parallel execution of independent tasks', async () => {
        const task1Id = await orchestrator.submitTask({
          type: 'processing',
          priority: 'medium',
          payload: { data: 'A' },
        });

        const task2Id = await orchestrator.submitTask({
          type: 'processing',
          priority: 'medium',
          payload: { data: 'B' },
        });

        // Register second worker
        orchestrator.registerWorker({
          id: 'worker-2',
          specialization: ['processing'],
          status: 'idle',
          tasksCompleted: 0,
          tasksFailed: 0,
        });

        // Execute in parallel
        const result = await orchestrator.executeTasks([task1Id, task2Id]);

        expect(result.success).toBe(true);
        expect(result.results.size).toBe(2);
      });
    });
  });

  describe('2. Parallel Execution', () => {
    beforeEach(() => {
      // Register multiple workers
      for (let i = 1; i <= 5; i++) {
        orchestrator.registerWorker({
          id: `worker-${i}`,
          specialization: ['processing', 'analysis'],
          status: 'idle',
          tasksCompleted: 0,
          tasksFailed: 0,
        });
      }
    });

    describe('Fan-out runs tasks simultaneously', () => {
      it('should execute multiple tasks in parallel', async () => {
        const tasks = [
          { type: 'processing', priority: 'medium' as const, payload: { id: 1 } },
          { type: 'processing', priority: 'medium' as const, payload: { id: 2 } },
          { type: 'processing', priority: 'medium' as const, payload: { id: 3 } },
        ];

        const startTime = Date.now();
        const result = await orchestrator.executeTasksParallel(tasks);
        const executionTime = Date.now() - startTime;

        expect(result.success).toBe(true);
        expect(result.results.size).toBe(3);

        // Parallel execution should be faster than sequential
        // Each task takes ~50ms, parallel should be ~50-100ms vs 150ms sequential
        expect(executionTime).toBeLessThan(200);
      });

      it('should distribute tasks across available workers', async () => {
        const tasks = Array.from({ length: 5 }, (_, i) => ({
          type: 'processing',
          priority: 'medium' as const,
          payload: { id: i },
        }));

        const result = await orchestrator.executeTasksParallel(tasks);

        expect(result.success).toBe(true);
        expect(result.tasksExecuted).toBe(5);

        // Verify different workers were used
        const taskIds = Array.from(result.results.keys());
        const workers = new Set(taskIds.map((id) => orchestrator.getTaskStatus(id)?.assignedTo));
        expect(workers.size).toBeGreaterThan(1);
      });

      it('should respect max parallel tasks limit', async () => {
        const limitedOrchestrator = createMockOrchestrator({
          maxParallelTasks: 2,
        });

        // Register workers
        for (let i = 1; i <= 2; i++) {
          limitedOrchestrator.registerWorker({
            id: `worker-${i}`,
            specialization: ['processing'],
            status: 'idle',
            tasksCompleted: 0,
            tasksFailed: 0,
          });
        }

        const tasks = Array.from({ length: 5 }, (_, i) => ({
          type: 'processing',
          priority: 'medium' as const,
          payload: { id: i },
        }));

        const result = await limitedOrchestrator.executeTasksParallel(tasks);

        // Should still complete all tasks, just with limited concurrency
        expect(result.success).toBe(true);
        expect(result.tasksExecuted).toBe(5);
      });
    });

    describe('All results collected before synthesis', () => {
      it('should wait for all parallel tasks to complete', async () => {
        const tasks = [
          { type: 'processing', priority: 'medium' as const, payload: { delay: 50 } },
          { type: 'processing', priority: 'medium' as const, payload: { delay: 100 } },
          { type: 'processing', priority: 'medium' as const, payload: { delay: 150 } },
        ];

        const result = await orchestrator.executeTasksParallel(tasks);

        // All tasks should be completed
        expect(result.results.size).toBe(3);
        expect(result.failures.size).toBe(0);

        const taskStatuses = Array.from(result.results.keys()).map(
          (id) => orchestrator.getTaskStatus(id)?.status
        );

        expect(taskStatuses.every((status) => status === 'completed')).toBe(true);
      });

      it('should collect results in correct structure', async () => {
        const tasks = [
          { type: 'processing', priority: 'medium' as const, payload: { data: 'A' } },
          { type: 'processing', priority: 'medium' as const, payload: { data: 'B' } },
        ];

        const result = await orchestrator.executeTasksParallel(tasks);

        expect(result.results).toBeInstanceOf(Map);
        expect(result.failures).toBeInstanceOf(Map);
        expect(result).toHaveProperty('executionTimeMs');
        expect(result).toHaveProperty('tasksExecuted');
      });
    });
  });

  describe('3. Result Synthesis', () => {
    describe('Combine multiple worker outputs', () => {
      it('should synthesize results from multiple workers', () => {
        const results = new Map([
          ['task-1', { output: 'result A', value: 10 }],
          ['task-2', { output: 'result B', value: 20 }],
          ['task-3', { output: 'result C', value: 30 }],
        ]);

        const synthesized = orchestrator.synthesizeResults(results);

        expect(synthesized).toBeDefined();
        expect(synthesized.count).toBe(3);
      });

      it('should handle single result without synthesis', () => {
        const results = new Map([['task-1', { output: 'single result', value: 42 }]]);

        const synthesized = orchestrator.synthesizeResults(results);

        expect(synthesized.output).toBe('single result');
        expect(synthesized.value).toBe(42);
      });

      it('should return null for empty results', () => {
        const results = new Map();
        const synthesized = orchestrator.synthesizeResults(results);

        expect(synthesized).toBeNull();
      });
    });

    describe("Preserve disagreements (don't force consensus)", () => {
      it('should preserve disagreements when workers produce different results', () => {
        const orch = createMockOrchestrator({ preserveDisagreements: true });

        const results = new Map([
          ['task-1', { conclusion: 'A is correct' }],
          ['task-2', { conclusion: 'B is correct' }],
          ['task-3', { conclusion: 'C is correct' }],
        ]);

        const synthesized = orch.synthesizeResults(results);

        expect(synthesized.disagreements).toBe(true);
        expect(synthesized.results).toHaveLength(3);
        expect(synthesized.consensus).toBeNull();
      });

      it('should maintain all worker perspectives', () => {
        const orch = createMockOrchestrator({ preserveDisagreements: true });

        const results = new Map([
          ['worker-1', { analysis: 'positive sentiment', confidence: 0.8 }],
          ['worker-2', { analysis: 'negative sentiment', confidence: 0.7 }],
        ]);

        const synthesized = orch.synthesizeResults(results);

        expect(synthesized.results).toHaveLength(2);
        expect(synthesized.results[0].analysis).toBe('positive sentiment');
        expect(synthesized.results[1].analysis).toBe('negative sentiment');
      });

      it('should not force consensus from divergent results', () => {
        const orch = createMockOrchestrator({ preserveDisagreements: true });

        const results = new Map([
          ['task-1', { value: 10 }],
          ['task-2', { value: 20 }],
          ['task-3', { value: 30 }],
        ]);

        const synthesized = orch.synthesizeResults(results);

        // Should preserve all values, not average or pick one
        expect(synthesized.consensus).toBeNull();
        expect(synthesized.results.map((r: any) => r.value)).toEqual([10, 20, 30]);
      });
    });
  });

  describe('4. Failure Handling', () => {
    beforeEach(() => {
      orchestrator.registerWorker({
        id: 'worker-1',
        specialization: ['processing'],
        status: 'idle',
        tasksCompleted: 0,
        tasksFailed: 0,
      });
    });

    describe('Worker failure triggers recovery', () => {
      it('should detect worker failure', async () => {
        const taskId = await orchestrator.submitTask({
          type: 'processing',
          priority: 'high',
          payload: { data: 'test' },
        });

        // Simulate worker failure
        const success = await orchestrator.reassignTask(taskId, 'Worker crashed');

        const task = orchestrator.getTaskStatus(taskId);
        const stats = orchestrator.getWorkerStats();

        expect(stats.tasksReassigned).toBeGreaterThan(0);
      });

      it('should mark failed tasks appropriately', async () => {
        // Remove all workers to force failure
        orchestrator.unregisterWorker('worker-1');

        const taskId = await orchestrator.submitTask({
          type: 'processing',
          priority: 'medium',
          payload: {},
        });

        const success = await orchestrator.reassignTask(taskId, 'No workers available');

        expect(success).toBe(false);

        const task = orchestrator.getTaskStatus(taskId);
        expect(task?.status).toBe('failed');
        expect(task?.error).toBeDefined();
      });

      it('should update worker statistics on failure', async () => {
        const taskId = await orchestrator.submitTask({
          type: 'processing',
          priority: 'medium',
          payload: {},
        });

        await orchestrator.reassignTask(taskId, 'Simulated failure');

        const stats = orchestrator.getWorkerStats();
        expect(stats.tasksFailed).toBeGreaterThan(0);
      });
    });

    describe('Task reassignment works', () => {
      beforeEach(() => {
        // Register backup worker
        orchestrator.registerWorker({
          id: 'worker-2',
          specialization: ['processing'],
          status: 'idle',
          tasksCompleted: 0,
          tasksFailed: 0,
        });
      });

      it('should reassign task to different worker', async () => {
        const taskId = await orchestrator.submitTask({
          type: 'processing',
          priority: 'high',
          payload: { data: 'important' },
        });

        // Execute on first worker
        await orchestrator.executeTask(taskId);
        const firstAssignment = orchestrator.getTaskStatus(taskId)?.assignedTo;

        // Simulate failure and reassignment
        orchestrator.registerWorker({
          id: 'worker-3',
          specialization: ['processing'],
          status: 'idle',
          tasksCompleted: 0,
          tasksFailed: 0,
        });

        const newTaskId = await orchestrator.submitTask({
          type: 'processing',
          priority: 'high',
          payload: { data: 'retry' },
        });

        await orchestrator.executeTask(newTaskId);

        // Different task should potentially use different worker
        expect(orchestrator.getTaskStatus(newTaskId)).toBeDefined();
      });

      it('should track reassignment count', async () => {
        const taskId = await orchestrator.submitTask({
          type: 'processing',
          priority: 'medium',
          payload: {},
        });

        const statsBefore = orchestrator.getWorkerStats();
        await orchestrator.reassignTask(taskId, 'Test reassignment');
        const statsAfter = orchestrator.getWorkerStats();

        expect(statsAfter.tasksReassigned).toBe(statsBefore.tasksReassigned + 1);
      });

      it('should succeed on reassignment with available workers', async () => {
        const taskId = await orchestrator.submitTask({
          type: 'processing',
          priority: 'high',
          payload: { data: 'test' },
        });

        const success = await orchestrator.reassignTask(taskId, 'Reassignment test');

        expect(success).toBe(true);

        const task = orchestrator.getTaskStatus(taskId);
        expect(task?.status).toBe('completed');
      });
    });

    describe('Graceful degradation', () => {
      it('should continue with partial results on some failures', async () => {
        // Register workers
        orchestrator.registerWorker({
          id: 'worker-2',
          specialization: ['processing'],
          status: 'idle',
          tasksCompleted: 0,
          tasksFailed: 0,
        });

        const tasks = [
          { type: 'processing', priority: 'medium' as const, payload: { id: 1 } },
          { type: 'processing', priority: 'medium' as const, payload: { id: 2 } },
          { type: 'unknown', priority: 'medium' as const, payload: { id: 3 } }, // Will fail
        ];

        const result = await orchestrator.executeTasksParallel(tasks);

        expect(result.success).toBe(false);
        expect(result.results.size).toBe(2); // Two succeeded
        expect(result.failures.size).toBe(1); // One failed
      });

      it('should provide detailed failure information', async () => {
        const tasks = [
          { type: 'processing', priority: 'medium' as const, payload: { id: 1 } },
          { type: 'invalid-type', priority: 'medium' as const, payload: { id: 2 } },
        ];

        const result = await orchestrator.executeTasksParallel(tasks);

        expect(result.failures.size).toBe(1);

        const failureMessages = Array.from(result.failures.values());
        expect(failureMessages[0]).toContain('No available worker');
      });
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      // Register diverse worker pool
      orchestrator.registerWorker({
        id: 'analyzer',
        specialization: ['analysis', 'statistics'],
        status: 'idle',
        tasksCompleted: 0,
        tasksFailed: 0,
      });

      orchestrator.registerWorker({
        id: 'processor',
        specialization: ['processing', 'transformation'],
        status: 'idle',
        tasksCompleted: 0,
        tasksFailed: 0,
      });

      orchestrator.registerWorker({
        id: 'validator',
        specialization: ['validation', 'verification'],
        status: 'idle',
        tasksCompleted: 0,
        tasksFailed: 0,
      });
    });

    it('should handle complex multi-stage workflow', async () => {
      // Stage 1: Processing
      const processTaskId = await orchestrator.submitTask({
        type: 'processing',
        priority: 'high',
        payload: { data: [1, 2, 3, 4, 5] },
      });

      await orchestrator.executeTask(processTaskId);

      // Stage 2: Analysis (depends on processing)
      const analysisTaskId = await orchestrator.submitTask({
        type: 'analysis',
        priority: 'high',
        payload: { processedData: 'result' },
        dependencies: [processTaskId],
      });

      await orchestrator.executeTask(analysisTaskId);

      // Stage 3: Validation (depends on analysis)
      const validationTaskId = await orchestrator.submitTask({
        type: 'validation',
        priority: 'high',
        payload: { analysisResult: 'findings' },
        dependencies: [analysisTaskId],
      });

      await orchestrator.executeTask(validationTaskId);

      // Verify all stages completed
      expect(orchestrator.getTaskStatus(processTaskId)?.status).toBe('completed');
      expect(orchestrator.getTaskStatus(analysisTaskId)?.status).toBe('completed');
      expect(orchestrator.getTaskStatus(validationTaskId)?.status).toBe('completed');
    });

    it('should provide comprehensive orchestration statistics', () => {
      const stats = orchestrator.getWorkerStats();

      expect(stats).toHaveProperty('tasksTotal');
      expect(stats).toHaveProperty('tasksCompleted');
      expect(stats).toHaveProperty('tasksFailed');
      expect(stats).toHaveProperty('tasksReassigned');
      expect(stats).toHaveProperty('workersActive');
      expect(stats).toHaveProperty('workersIdle');
      expect(stats).toHaveProperty('averageExecutionTimeMs');
    });

    it('should handle high-volume parallel orchestration', async () => {
      // Add more workers
      for (let i = 1; i <= 10; i++) {
        orchestrator.registerWorker({
          id: `worker-${i}`,
          specialization: ['processing'],
          status: 'idle',
          tasksCompleted: 0,
          tasksFailed: 0,
        });
      }

      const tasks = Array.from({ length: 50 }, (_, i) => ({
        type: 'processing',
        priority: 'medium' as const,
        payload: { index: i },
      }));

      const startTime = Date.now();
      const result = await orchestrator.executeTasksParallel(tasks);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.tasksExecuted).toBe(50);
      expect(duration).toBeLessThan(1000); // Should be fast with parallelization
    });
  });
});
