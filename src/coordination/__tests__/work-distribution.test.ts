/**
 * Work Distribution Tests
 */

import {
  WorkDistributor,
  createDistributor,
  getGlobalDistributor,
  resetGlobalDistributor,
  TaskStatus,
  TaskPriority,
  type Task,
} from '..//work-distribution';
import {
  SubagentRegistry,
  createRegistry,
  AgentStatus,
} from '../../s../../subagent/registry';
import { AgentRole } from '../../s../../subagent/bootstrap';

describe('WorkDistributor', () => {
  let registry: SubagentRegistry;
  let distributor: WorkDistributor;

  beforeEach(() => {
    registry = createRegistry({ heartbeatIntervalMs: 1000 });
    distributor = createDistributor(registry);

    // Register agents
    registry.registerSubagent('impl-1', {
      role: AgentRole.IMPLEMENTER,
      capabilities: [
        { name: 'coding', description: 'Write code', proficiency: 0.9 },
      ],
    });
    registry.registerSubagent('impl-2', {
      role: AgentRole.IMPLEMENTER,
      capabilities: [
        { name: 'coding', description: 'Write code', proficiency: 0.8 },
      ],
    });
    registry.registerSubagent('planner-1', {
      role: AgentRole.PLANNER,
      capabilities: [
        { name: 'planning', description: 'Plan tasks', proficiency: 0.95 },
      ],
    });

    registry.heartbeat('impl-1', AgentStatus.ACTIVE);
    registry.heartbeat('impl-2', AgentStatus.IDLE);
    registry.heartbeat('planner-1', AgentStatus.ACTIVE);
  });

  afterEach(() => {
    distributor.clear();
    registry.stop();
  });

  describe('createTask', () => {
    it('should create a new task', () => {
      const task = distributor.createTask(
        'Implement Feature',
        'Build the new feature'
      );

      expect(task).toBeDefined();
      expect(task.title).toBe('Implement Feature');
      expect(task.description).toBe('Build the new feature');
      expect(task.status).toBe(TaskStatus.AVAILABLE);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
    });

    it('should create task with priority', () => {
      const task = distributor.createTask('Urgent Task', 'Do this now', {
        priority: TaskPriority.CRITICAL,
      });

      expect(task.priority).toBe(TaskPriority.CRITICAL);
    });

    it('should create task with required role', () => {
      const task = distributor.createTask('Planning Task', 'Plan something', {
        requiredRole: AgentRole.PLANNER,
      });

      expect(task.requiredRole).toBe(AgentRole.PLANNER);
    });

    it('should create task with dependencies', () => {
      const task1 = distributor.createTask('First Task', 'Do first');
      const task2 = distributor.createTask('Second Task', 'Do second', {
        dependencies: [task1.id],
      });

      expect(task2.dependencies).toContain(task1.id);
      expect(task2.status).toBe(TaskStatus.BLOCKED);
    });

    it('should create subtask with parent', () => {
      const parent = distributor.createTask('Parent Task', 'Main task');
      const child = distributor.createTask('Child Task', 'Subtask', {
        parentTaskId: parent.id,
      });

      expect(child.parentTaskId).toBe(parent.id);

      const updatedParent = distributor.getTask(parent.id);
      expect(updatedParent?.subtaskIds).toContain(child.id);
    });

    it('should emit taskCreated event', () => {
      const listener = jest.fn();
      distributor.on('taskCreated', listener);

      distributor.createTask('Event Task', 'Test');

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('claimTask', () => {
    it('should claim an available task', () => {
      const task = distributor.createTask('Claimable Task', 'Claim me');

      const result = distributor.claimTask(task.id, 'impl-1');

      expect(result.success).toBe(true);
      expect(result.task?.status).toBe(TaskStatus.CLAIMED);
      expect(result.task?.claimedBy).toBe('impl-1');
    });

    it('should fail to claim non-existent task', () => {
      const result = distributor.claimTask('non-existent', 'impl-1');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Task not found');
    });

    it('should fail to claim already claimed task', () => {
      const task = distributor.createTask('Contested Task', 'Only one can claim');
      distributor.claimTask(task.id, 'impl-1');

      const result = distributor.claimTask(task.id, 'impl-2');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('Task already claimed');
      expect(result.conflict).toBeDefined();
      expect(result.conflict?.claimedBy).toBe('impl-1');
    });

    it('should fail to claim blocked task', () => {
      const dep = distributor.createTask('Dependency', 'Required first');
      const task = distributor.createTask('Blocked Task', 'Waiting', {
        dependencies: [dep.id],
      });

      const result = distributor.claimTask(task.id, 'impl-1');

      expect(result.success).toBe(false);
      // Task is marked as BLOCKED when created with pending dependencies
      expect(result.reason).toContain('blocked');
    });

    it('should enforce optimistic locking', () => {
      const task = distributor.createTask('Versioned Task', 'Version check');

      // First claim succeeds
      distributor.claimTask(task.id, 'impl-1', 0);

      // Release task
      distributor.releaseTask(task.id, 'impl-1');

      // Claim with old version fails
      const result = distributor.claimTask(task.id, 'impl-2', 0);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Version mismatch');
    });

    it('should check agent eligibility by role', () => {
      const task = distributor.createTask('Planner Task', 'Planning only', {
        requiredRole: AgentRole.PLANNER,
      });

      const implResult = distributor.claimTask(task.id, 'impl-1');
      expect(implResult.success).toBe(false);
      expect(implResult.reason).toContain('Requires role');

      const plannerResult = distributor.claimTask(task.id, 'planner-1');
      expect(plannerResult.success).toBe(true);
    });

    it('should check agent eligibility by capability', () => {
      const task = distributor.createTask('Coding Task', 'Write code', {
        requiredCapabilities: ['coding'],
      });

      const plannerResult = distributor.claimTask(task.id, 'planner-1');
      expect(plannerResult.success).toBe(false);
      expect(plannerResult.reason).toContain('Missing capability');

      const implResult = distributor.claimTask(task.id, 'impl-1');
      expect(implResult.success).toBe(true);
    });

    it('should emit taskClaimed event', () => {
      const listener = jest.fn();
      distributor.on('taskClaimed', listener);

      const task = distributor.createTask('Event Claim', 'Test');
      distributor.claimTask(task.id, 'impl-1');

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('startTask', () => {
    it('should start a claimed task', () => {
      const task = distributor.createTask('Startable', 'Ready to start');
      distributor.claimTask(task.id, 'impl-1');

      const started = distributor.startTask(task.id, 'impl-1');

      expect(started?.status).toBe(TaskStatus.IN_PROGRESS);
      expect(started?.startedAt).toBeDefined();
    });

    it('should fail if not claimed by agent', () => {
      const task = distributor.createTask('Not Mine', 'Someone else claimed');
      distributor.claimTask(task.id, 'impl-1');

      const started = distributor.startTask(task.id, 'impl-2');

      expect(started).toBeUndefined();
    });
  });

  describe('completeTask', () => {
    it('should complete a task in progress', () => {
      const task = distributor.createTask('Completable', 'Will finish');
      distributor.claimTask(task.id, 'impl-1');
      distributor.startTask(task.id, 'impl-1');

      const completed = distributor.completeTask(task.id, 'impl-1', {
        result: 'done',
      });

      expect(completed?.status).toBe(TaskStatus.COMPLETED);
      expect(completed?.completedAt).toBeDefined();
      expect(completed?.result).toEqual({ result: 'done' });
    });

    it('should unblock dependent tasks', () => {
      const dep = distributor.createTask('Dependency', 'Finish first');
      const blocked = distributor.createTask('Blocked', 'Waiting', {
        dependencies: [dep.id],
      });

      expect(blocked.status).toBe(TaskStatus.BLOCKED);

      distributor.claimTask(dep.id, 'impl-1');
      distributor.startTask(dep.id, 'impl-1');
      distributor.completeTask(dep.id, 'impl-1');

      const unblocked = distributor.getTask(blocked.id);
      expect(unblocked?.status).toBe(TaskStatus.AVAILABLE);
    });

    it('should emit taskCompleted event', () => {
      const listener = jest.fn();
      distributor.on('taskCompleted', listener);

      const task = distributor.createTask('Event Complete', 'Test');
      distributor.claimTask(task.id, 'impl-1');
      distributor.completeTask(task.id, 'impl-1');

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('failTask', () => {
    it('should mark task as failed after max retries', () => {
      const task = distributor.createTask('Failing Task', 'Will fail', {
        maxRetries: 2, // Allow 2 retries
      });
      distributor.claimTask(task.id, 'impl-1');
      distributor.startTask(task.id, 'impl-1');

      // First failure - should retry (retryCount = 1, less than maxRetries = 2)
      distributor.failTask(task.id, 'impl-1', 'Error 1');
      let updated = distributor.getTask(task.id);
      expect(updated?.status).toBe(TaskStatus.AVAILABLE);

      // Claim and fail again - still retry (retryCount = 2, equals maxRetries)
      distributor.claimTask(task.id, 'impl-1');
      distributor.failTask(task.id, 'impl-1', 'Error 2');
      updated = distributor.getTask(task.id);
      expect(updated?.status).toBe(TaskStatus.FAILED);
      expect(updated?.error).toBe('Error 2');
    });
  });

  describe('releaseTask', () => {
    it('should release a claimed task', () => {
      const task = distributor.createTask('Releasable', 'Can be released');
      distributor.claimTask(task.id, 'impl-1');

      const released = distributor.releaseTask(task.id, 'impl-1');

      expect(released?.status).toBe(TaskStatus.AVAILABLE);
      expect(released?.claimedBy).toBeUndefined();
    });
  });

  describe('cancelTask', () => {
    it('should cancel a task', () => {
      const task = distributor.createTask('Cancellable', 'May be cancelled');

      const result = distributor.cancelTask(task.id);

      expect(result).toBe(true);
      expect(distributor.getTask(task.id)?.status).toBe(TaskStatus.CANCELLED);
    });

    it('should not cancel completed task', () => {
      const task = distributor.createTask('Completed', 'Already done');
      distributor.claimTask(task.id, 'impl-1');
      distributor.completeTask(task.id, 'impl-1');

      const result = distributor.cancelTask(task.id);

      expect(result).toBe(false);
    });
  });

  describe('getTasks', () => {
    beforeEach(() => {
      distributor.createTask('Task 1', 'Desc 1', { priority: TaskPriority.LOW });
      distributor.createTask('Task 2', 'Desc 2', { priority: TaskPriority.HIGH });
      distributor.createTask('Task 3', 'Desc 3', { priority: TaskPriority.CRITICAL });
    });

    it('should return all tasks', () => {
      const tasks = distributor.getTasks();
      expect(tasks.length).toBe(3);
    });

    it('should filter by status', () => {
      const task = distributor.createTask('Claimed Task', 'Claimed');
      distributor.claimTask(task.id, 'impl-1');

      const claimed = distributor.getTasks({ statuses: [TaskStatus.CLAIMED] });
      expect(claimed.length).toBe(1);
    });

    it('should filter by priority', () => {
      const critical = distributor.getTasks({
        priorities: [TaskPriority.CRITICAL],
      });
      expect(critical.length).toBe(1);
    });

    it('should sort by priority', () => {
      const tasks = distributor.getTasks();

      expect(tasks[0].priority).toBe(TaskPriority.CRITICAL);
      expect(tasks[1].priority).toBe(TaskPriority.HIGH);
      expect(tasks[2].priority).toBe(TaskPriority.LOW);
    });

    it('should limit results', () => {
      const tasks = distributor.getTasks({ limit: 2 });
      expect(tasks.length).toBe(2);
    });
  });

  describe('getAvailableTasksForAgent', () => {
    it('should return available tasks for agent', () => {
      distributor.createTask('Any Task', 'No requirements');
      distributor.createTask('Coding Task', 'Need coding', {
        requiredCapabilities: ['coding'],
      });

      const tasks = distributor.getAvailableTasksForAgent('impl-1');

      expect(tasks.length).toBe(2);
    });

    it('should exclude tasks with unmet requirements', () => {
      distributor.createTask('Planner Task', 'Need planner', {
        requiredRole: AgentRole.PLANNER,
      });

      const tasks = distributor.getAvailableTasksForAgent('impl-1');

      expect(tasks.length).toBe(0);
    });
  });

  describe('getAssignmentRecommendations', () => {
    it('should recommend task assignments', () => {
      distributor.createTask('Coding Task', 'Write code', {
        requiredCapabilities: ['coding'],
      });

      const recommendations = distributor.getAssignmentRecommendations();

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].score).toBeGreaterThan(0);
    });

    it('should prefer idle agents', () => {
      distributor.createTask('Any Task', 'No requirements');

      const recommendations = distributor.getAssignmentRecommendations();

      // impl-2 is idle, should be recommended
      const idleRec = recommendations.find((r) => r.agentId === 'impl-2');
      expect(idleRec?.reasons).toContain('Agent is idle');
    });
  });

  describe('getStats', () => {
    it('should return work distribution statistics', () => {
      distributor.createTask('Task 1', 'Desc');
      const task = distributor.createTask('Task 2', 'Desc');
      distributor.claimTask(task.id, 'impl-1');

      const stats = distributor.getStats();

      expect(stats.totalTasks).toBe(2);
      expect(stats.byStatus[TaskStatus.AVAILABLE]).toBe(1);
      expect(stats.byStatus[TaskStatus.CLAIMED]).toBe(1);
    });
  });
});

describe('Global Work Distributor', () => {
  beforeEach(() => {
    resetGlobalDistributor();
  });

  afterEach(() => {
    resetGlobalDistributor();
  });

  it('should return same instance', () => {
    const dist1 = getGlobalDistributor();
    const dist2 = getGlobalDistributor();
    expect(dist1).toBe(dist2);
  });
});
