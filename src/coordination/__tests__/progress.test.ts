/**
 * Progress Tracking Tests
 */

import {
  ProgressTracker,
  createProgressTracker,
  getGlobalProgressTracker,
  resetGlobalProgressTracker,
  reportProgress,
  createMilestone,
  ProgressStatus,
  MilestoneStatus,
  type ProgressEntry,
  type Milestone,
} from '..//progress';
import { SubagentRegistry, createRegistry, AgentStatus } from '../../s../../subagent/registry';
import { AgentMessageBus, createMessageBus } from '../../s../../subagent/messaging';
import { AgentRole } from '../../s../../subagent/bootstrap';

describe('ProgressTracker', () => {
  let registry: SubagentRegistry;
  let messageBus: AgentMessageBus;
  let tracker: ProgressTracker;

  beforeEach(() => {
    registry = createRegistry({ heartbeatIntervalMs: 1000 });
    messageBus = createMessageBus(registry);
    tracker = createProgressTracker(registry, messageBus);

    // Register agents
    registry.registerSubagent('agent-1', {
      role: AgentRole.IMPLEMENTER,
    });
    registry.registerSubagent('agent-2', {
      role: AgentRole.PLANNER,
    });
    registry.heartbeat('agent-1', AgentStatus.ACTIVE);
    registry.heartbeat('agent-2', AgentStatus.ACTIVE);
  });

  afterEach(() => {
    tracker.clear();
    messageBus.stop();
    registry.stop();
  });

  describe('reportProgress', () => {
    it('should create progress entry', () => {
      const entry = tracker.reportProgress('agent-1', 'task-1', 50, ProgressStatus.IN_PROGRESS);

      expect(entry).toBeDefined();
      expect(entry.agentId).toBe('agent-1');
      expect(entry.taskId).toBe('task-1');
      expect(entry.percentage).toBe(50);
      expect(entry.status).toBe(ProgressStatus.IN_PROGRESS);
    });

    it('should clamp percentage to 0-100', () => {
      const over = tracker.reportProgress('agent-1', 'task-1', 150, ProgressStatus.IN_PROGRESS);
      const under = tracker.reportProgress('agent-1', 'task-2', -50, ProgressStatus.IN_PROGRESS);

      expect(over.percentage).toBe(100);
      expect(under.percentage).toBe(0);
    });

    it('should include message and details', () => {
      const entry = tracker.reportProgress('agent-1', 'task-1', 75, ProgressStatus.IN_PROGRESS, {
        message: 'Almost done',
        details: 'Finishing up edge cases',
      });

      expect(entry.message).toBe('Almost done');
      expect(entry.details).toBe('Finishing up edge cases');
    });

    it('should track time spent', () => {
      const entry = tracker.reportProgress('agent-1', 'task-1', 50, ProgressStatus.IN_PROGRESS, {
        timeSpentMinutes: 30,
      });

      expect(entry.timeSpentMinutes).toBe(30);
    });

    it('should record blockers', () => {
      const entry = tracker.reportProgress('agent-1', 'task-1', 25, ProgressStatus.BLOCKED, {
        blockers: ['Missing API key', 'Waiting for review'],
      });

      expect(entry.blockers).toContain('Missing API key');
      expect(entry.blockers).toContain('Waiting for review');
    });

    it('should emit progressReported event', () => {
      const listener = jest.fn();
      tracker.on('progressReported', listener);

      tracker.reportProgress('agent-1', 'task-1', 50, ProgressStatus.IN_PROGRESS);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should use default message based on status', () => {
      const pending = tracker.reportProgress('agent-1', 'task-1', 0, ProgressStatus.NOT_STARTED);
      const inProgress = tracker.reportProgress(
        'agent-1',
        'task-2',
        50,
        ProgressStatus.IN_PROGRESS
      );
      const completed = tracker.reportProgress('agent-1', 'task-3', 100, ProgressStatus.COMPLETED);

      expect(pending.message).toContain('not started');
      expect(inProgress.message).toContain('in progress');
      expect(completed.message).toContain('completed');
    });
  });

  describe('startTimeTracking / stopTimeTracking', () => {
    it('should track elapsed time', () => {
      tracker.startTimeTracking('task-1');

      // Simulate time passing
      jest.advanceTimersByTime(60000); // 1 minute

      const elapsed = tracker.stopTimeTracking('task-1');

      expect(elapsed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getLatestProgress', () => {
    it('should return latest progress for task', () => {
      tracker.reportProgress('agent-1', 'task-1', 25, ProgressStatus.IN_PROGRESS);
      tracker.reportProgress('agent-1', 'task-1', 50, ProgressStatus.IN_PROGRESS);
      tracker.reportProgress('agent-1', 'task-1', 75, ProgressStatus.IN_PROGRESS);

      const latest = tracker.getLatestProgress('task-1');

      expect(latest?.percentage).toBe(75);
    });

    it('should return undefined for unknown task', () => {
      const latest = tracker.getLatestProgress('unknown');
      expect(latest).toBeUndefined();
    });
  });

  describe('getProgressHistory', () => {
    it('should return progress history for task', () => {
      tracker.reportProgress('agent-1', 'task-1', 25, ProgressStatus.IN_PROGRESS);
      tracker.reportProgress('agent-1', 'task-1', 50, ProgressStatus.IN_PROGRESS);
      tracker.reportProgress('agent-1', 'task-1', 75, ProgressStatus.IN_PROGRESS);

      const history = tracker.getProgressHistory('task-1');

      expect(history.length).toBe(3);
    });

    it('should limit history entries', () => {
      for (let i = 0; i < 10; i++) {
        tracker.reportProgress('agent-1', 'task-1', i * 10, ProgressStatus.IN_PROGRESS);
      }

      const history = tracker.getProgressHistory('task-1', 5);

      expect(history.length).toBe(5);
    });
  });

  describe('getProgressSummary', () => {
    beforeEach(() => {
      tracker.reportProgress('agent-1', 'task-1', 100, ProgressStatus.COMPLETED);
      tracker.reportProgress('agent-1', 'task-2', 50, ProgressStatus.IN_PROGRESS);
      tracker.reportProgress('agent-2', 'task-3', 0, ProgressStatus.BLOCKED);
    });

    it('should calculate overall progress', () => {
      const summary = tracker.getProgressSummary(['task-1', 'task-2', 'task-3']);

      expect(summary.overallProgress).toBe(50); // (100 + 50 + 0) / 3
    });

    it('should count items by status', () => {
      const summary = tracker.getProgressSummary(['task-1', 'task-2', 'task-3']);

      expect(summary.itemsCompleted).toBe(1);
      expect(summary.itemsInProgress).toBe(1);
      expect(summary.itemsBlocked).toBe(1);
      expect(summary.totalItems).toBe(3);
    });

    it('should track active agents', () => {
      const summary = tracker.getProgressSummary(['task-1', 'task-2', 'task-3']);

      expect(summary.activeAgents).toContain('agent-1');
    });

    it('should determine overall status', () => {
      const allCompleted = tracker.getProgressSummary(['task-1']);
      expect(allCompleted.status).toBe(ProgressStatus.COMPLETED);

      const hasInProgress = tracker.getProgressSummary(['task-1', 'task-2']);
      expect(hasInProgress.status).toBe(ProgressStatus.IN_PROGRESS);

      const allBlocked = tracker.getProgressSummary(['task-3']);
      expect(allBlocked.status).toBe(ProgressStatus.BLOCKED);
    });
  });

  describe('getAgentSummary', () => {
    beforeEach(() => {
      registry.updateCurrentTask('agent-1', 'task-1');
      tracker.reportProgress('agent-1', 'task-1', 50, ProgressStatus.IN_PROGRESS, {
        timeSpentMinutes: 30,
      });
      tracker.reportProgress('agent-1', 'task-2', 100, ProgressStatus.COMPLETED, {
        timeSpentMinutes: 60,
      });
    });

    it('should return agent summary', () => {
      const summary = tracker.getAgentSummary('agent-1');

      expect(summary).toBeDefined();
      expect(summary?.agentId).toBe('agent-1');
      expect(summary?.role).toBe(AgentRole.IMPLEMENTER);
      expect(summary?.tasksCompleted).toBe(1);
    });

    it('should track current task progress', () => {
      const summary = tracker.getAgentSummary('agent-1');

      expect(summary?.currentTaskId).toBe('task-1');
      expect(summary?.currentTaskProgress).toBe(50);
    });

    it('should return undefined for unknown agent', () => {
      const summary = tracker.getAgentSummary('unknown');
      expect(summary).toBeUndefined();
    });
  });

  describe('createMilestone', () => {
    it('should create a milestone', () => {
      const milestone = tracker.createMilestone('MVP Complete', 'Minimum viable product is ready');

      expect(milestone).toBeDefined();
      expect(milestone.name).toBe('MVP Complete');
      expect(milestone.description).toBe('Minimum viable product is ready');
      expect(milestone.status).toBe(MilestoneStatus.PENDING);
      expect(milestone.progress).toBe(0);
    });

    it('should create milestone with target date', () => {
      const targetDate = new Date('2025-01-01');
      const milestone = tracker.createMilestone('Release', 'Ship it', {
        targetDate,
      });

      expect(milestone.targetDate).toEqual(targetDate);
    });

    it('should create milestone with required tasks', () => {
      const milestone = tracker.createMilestone('Feature Complete', 'All done', {
        requiredTaskIds: ['task-1', 'task-2', 'task-3'],
      });

      expect(milestone.requiredTaskIds).toEqual(['task-1', 'task-2', 'task-3']);
    });

    it('should create child milestone', () => {
      const parent = tracker.createMilestone('Parent', 'Main milestone');
      const child = tracker.createMilestone('Child', 'Sub milestone', {
        parentMilestoneId: parent.id,
      });

      expect(child.parentMilestoneId).toBe(parent.id);

      const updatedParent = tracker.getMilestone(parent.id);
      expect(updatedParent?.childMilestoneIds).toContain(child.id);
    });

    it('should emit milestoneCreated event', () => {
      const listener = jest.fn();
      tracker.on('milestoneCreated', listener);

      tracker.createMilestone('Event Milestone', 'Test');

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateMilestoneStatus', () => {
    it('should update milestone status', () => {
      const milestone = tracker.createMilestone('Updatable', 'Test');

      const updated = tracker.updateMilestoneStatus(milestone.id, MilestoneStatus.IN_PROGRESS);

      expect(updated?.status).toBe(MilestoneStatus.IN_PROGRESS);
    });

    it('should set completion date when achieved', () => {
      const milestone = tracker.createMilestone('Achievable', 'Test');

      const updated = tracker.updateMilestoneStatus(milestone.id, MilestoneStatus.ACHIEVED);

      expect(updated?.completedDate).toBeDefined();
      expect(updated?.progress).toBe(100);
    });

    it('should emit milestoneStatusChanged event', () => {
      const listener = jest.fn();
      tracker.on('milestoneStatusChanged', listener);

      const milestone = tracker.createMilestone('Event', 'Test');
      tracker.updateMilestoneStatus(milestone.id, MilestoneStatus.ACHIEVED);

      expect(listener).toHaveBeenCalledWith({
        milestone: expect.any(Object),
        oldStatus: MilestoneStatus.PENDING,
        newStatus: MilestoneStatus.ACHIEVED,
      });
    });
  });

  describe('milestone progress calculation', () => {
    it('should update milestone progress based on task progress', () => {
      const milestone = tracker.createMilestone('Auto Progress', 'Test', {
        requiredTaskIds: ['task-a', 'task-b'],
      });

      tracker.reportProgress('agent-1', 'task-a', 100, ProgressStatus.COMPLETED);
      tracker.reportProgress('agent-1', 'task-b', 50, ProgressStatus.IN_PROGRESS);

      const updated = tracker.getMilestone(milestone.id);
      expect(updated?.progress).toBe(75);
    });

    it('should auto-achieve milestone when all tasks complete', () => {
      const milestone = tracker.createMilestone('Auto Achieve', 'Test', {
        requiredTaskIds: ['task-x'],
      });

      tracker.reportProgress('agent-1', 'task-x', 100, ProgressStatus.COMPLETED);

      const updated = tracker.getMilestone(milestone.id);
      expect(updated?.status).toBe(MilestoneStatus.ACHIEVED);
    });

    it('should update child milestone progress to parent', () => {
      const parent = tracker.createMilestone('Parent', 'Main', {
        requiredTaskIds: [],
      });
      tracker.createMilestone('Child 1', 'Sub 1', {
        parentMilestoneId: parent.id,
        requiredTaskIds: ['c1-task'],
      });
      tracker.createMilestone('Child 2', 'Sub 2', {
        parentMilestoneId: parent.id,
        requiredTaskIds: ['c2-task'],
      });

      tracker.reportProgress('agent-1', 'c1-task', 100, ProgressStatus.COMPLETED);
      tracker.reportProgress('agent-1', 'c2-task', 50, ProgressStatus.IN_PROGRESS);

      const updatedParent = tracker.getMilestone(parent.id);
      expect(updatedParent?.progress).toBe(75);
    });
  });

  describe('getMilestonesForTasks', () => {
    it('should return milestones containing specified tasks', () => {
      tracker.createMilestone('M1', 'Test', {
        requiredTaskIds: ['task-1', 'task-2'],
      });
      tracker.createMilestone('M2', 'Test', {
        requiredTaskIds: ['task-3'],
      });

      const milestones = tracker.getMilestonesForTasks(['task-1']);

      expect(milestones.length).toBe(1);
      expect(milestones[0].name).toBe('M1');
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      tracker.reportProgress('agent-1', 'task-1', 100, ProgressStatus.COMPLETED);
      tracker.reportProgress('agent-1', 'task-2', 50, ProgressStatus.IN_PROGRESS);
      tracker.reportProgress('agent-1', 'task-3', 0, ProgressStatus.BLOCKED);

      tracker.createMilestone('M1', 'Test');
      tracker.createMilestone('M2', 'Test');
    });

    it('should return progress statistics', () => {
      const stats = tracker.getStats();

      expect(stats.totalEntries).toBe(3);
      expect(stats.byStatus[ProgressStatus.COMPLETED]).toBe(1);
      expect(stats.byStatus[ProgressStatus.IN_PROGRESS]).toBe(1);
      expect(stats.byStatus[ProgressStatus.BLOCKED]).toBe(1);
      expect(stats.totalMilestones).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all data', () => {
      tracker.reportProgress('agent-1', 'task-1', 50, ProgressStatus.IN_PROGRESS);
      tracker.createMilestone('M1', 'Test');

      tracker.clear();

      expect(tracker.getLatestProgress('task-1')).toBeUndefined();
      expect(tracker.getAllMilestones().length).toBe(0);
    });
  });
});

describe('Global Progress Tracker', () => {
  beforeEach(() => {
    resetGlobalProgressTracker();
  });

  afterEach(() => {
    resetGlobalProgressTracker();
  });

  it('should return same instance', () => {
    const tracker1 = getGlobalProgressTracker();
    const tracker2 = getGlobalProgressTracker();
    expect(tracker1).toBe(tracker2);
  });
});
