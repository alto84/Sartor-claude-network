/**
 * Tests for Adaptive Intelligence Module
 */

import {
  AdaptiveIntelligence,
  createIntelligence,
  getGlobalIntelligence,
  resetGlobalIntelligence,
  predictTaskSuccess,
  recordTaskOutcome,
  LearningEvent,
  PatternType,
  type TaskOutcome,
  type TaskContext,
} from '../intelligence';

describe('Adaptive Intelligence', () => {
  let intelligence: AdaptiveIntelligence;

  beforeEach(() => {
    intelligence = createIntelligence();
    resetGlobalIntelligence();
  });

  describe('AdaptiveIntelligence', () => {
    it('should create intelligence with default config', () => {
      expect(intelligence).toBeInstanceOf(AdaptiveIntelligence);
    });

    it('should create intelligence with custom config', () => {
      const custom = createIntelligence({
        minPatternOccurrences: 5,
        minConfidence: 0.7,
        learningRate: 0.2,
      });
      expect(custom).toBeInstanceOf(AdaptiveIntelligence);
    });
  });

  describe('Recording Outcomes', () => {
    it('should record task outcome', () => {
      const outcome: TaskOutcome = {
        taskId: 'task-1',
        taskType: 'code_review',
        success: true,
        duration: 5000,
        attempts: 1,
        context: { agentRole: 'reviewer' },
      };

      intelligence.recordOutcome(outcome);

      const stats = intelligence.getStats();
      expect(stats.totalTasks).toBe(1);
    });

    it('should track success rate', () => {
      // Record mixed outcomes
      intelligence.recordOutcome({
        taskId: 'task-1',
        taskType: 'test',
        success: true,
        duration: 1000,
        attempts: 1,
        context: {},
      });

      intelligence.recordOutcome({
        taskId: 'task-2',
        taskType: 'test',
        success: false,
        duration: 2000,
        attempts: 2,
        context: {},
      });

      const stats = intelligence.getStats();
      expect(stats.successRate).toBe(0.5);
    });

    it('should emit events on task completion', () => {
      const events: any[] = [];
      intelligence.on(LearningEvent.TASK_COMPLETED, (data) => events.push(data));

      intelligence.recordOutcome({
        taskId: 'task-1',
        taskType: 'test',
        success: true,
        duration: 1000,
        attempts: 1,
        context: {},
      });

      expect(events.length).toBe(1);
      expect(events[0].taskId).toBe('task-1');
    });

    it('should emit events on task failure', () => {
      const events: any[] = [];
      intelligence.on(LearningEvent.TASK_FAILED, (data) => events.push(data));

      intelligence.recordOutcome({
        taskId: 'task-1',
        taskType: 'test',
        success: false,
        duration: 1000,
        attempts: 1,
        context: {},
        error: 'Test error',
      });

      expect(events.length).toBe(1);
      expect(events[0].success).toBe(false);
    });
  });

  describe('Pattern Learning', () => {
    it('should learn task type patterns', () => {
      // Record multiple outcomes for same task type
      for (let i = 0; i < 5; i++) {
        intelligence.recordOutcome({
          taskId: `task-${i}`,
          taskType: 'code_review',
          success: true,
          duration: 1000 + i * 100,
          attempts: 1,
          context: {},
        });
      }

      const patterns = intelligence.getPatterns();
      expect(patterns.some(p => p.trigger.taskTypes?.includes('code_review'))).toBe(true);
    });

    it('should learn complexity patterns', () => {
      for (let i = 0; i < 5; i++) {
        intelligence.recordOutcome({
          taskId: `task-${i}`,
          taskType: 'implementation',
          success: i < 3, // Higher complexity = more failures
          duration: 1000,
          attempts: 1,
          context: { complexity: 0.8 },
        });
      }

      const patterns = intelligence.getPatterns();
      expect(patterns.some(p => p.type === PatternType.COMPLEXITY_PATTERN)).toBe(true);
    });

    it('should learn sequence patterns', () => {
      for (let i = 0; i < 5; i++) {
        intelligence.recordOutcome({
          taskId: `task-${i}`,
          taskType: 'implementation',
          success: true,
          duration: 1000,
          attempts: 1,
          context: { previousTasks: ['planning'] },
        });
      }

      const patterns = intelligence.getPatterns();
      expect(patterns.some(p => p.type === PatternType.TASK_SEQUENCE)).toBe(true);
    });

    it('should learn error patterns', () => {
      for (let i = 0; i < 3; i++) {
        intelligence.recordOutcome({
          taskId: `task-${i}`,
          taskType: 'api_call',
          success: false,
          duration: 1000,
          attempts: 1,
          context: {},
          error: 'NetworkError: connection failed',
        });
      }

      const patterns = intelligence.getPatterns();
      expect(patterns.some(p => p.type === PatternType.ERROR_CORRELATION)).toBe(true);
    });

    it('should emit pattern detected event', () => {
      const events: any[] = [];
      intelligence.on(LearningEvent.PATTERN_DETECTED, (data) => events.push(data));

      // Record enough outcomes to trigger pattern detection
      for (let i = 0; i < 5; i++) {
        intelligence.recordOutcome({
          taskId: `task-${i}`,
          taskType: 'code_review',
          success: true,
          duration: 1000,
          attempts: 1,
          context: {},
        });
      }

      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Prediction', () => {
    beforeEach(() => {
      // Build some history
      for (let i = 0; i < 10; i++) {
        intelligence.recordOutcome({
          taskId: `task-${i}`,
          taskType: 'code_review',
          success: i < 8, // 80% success rate
          duration: 5000 + i * 100,
          attempts: 1,
          context: { agentRole: 'reviewer', complexity: 0.5 },
        });
      }
    });

    it('should predict task success', () => {
      const prediction = intelligence.predict('code_review', {
        agentRole: 'reviewer',
        complexity: 0.5,
      });

      expect(prediction.predictedSuccess).toBeGreaterThan(0);
      expect(prediction.predictedSuccess).toBeLessThanOrEqual(1);
    });

    it('should include prediction factors', () => {
      const prediction = intelligence.predict('code_review', {});

      expect(prediction.factors.length).toBeGreaterThan(0);
      expect(prediction.factors[0].name).toBeDefined();
      expect(prediction.factors[0].weight).toBeGreaterThanOrEqual(0);
    });

    it('should include confidence level', () => {
      const prediction = intelligence.predict('code_review', {});

      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });

    it('should generate warnings', () => {
      // Record some failures with errors
      for (let i = 0; i < 3; i++) {
        intelligence.recordOutcome({
          taskId: `err-${i}`,
          taskType: 'api_call',
          success: false,
          duration: 1000,
          attempts: 1,
          context: {},
          error: 'NetworkError: timeout',
        });
      }

      const prediction = intelligence.predict('api_call', {});

      expect(Array.isArray(prediction.warnings)).toBe(true);
    });

    it('should predict duration', () => {
      const prediction = intelligence.predict('code_review', {});

      expect(prediction.predictedDuration).toBeGreaterThan(0);
    });

    it('should emit prediction event', () => {
      const events: any[] = [];
      intelligence.on(LearningEvent.PREDICTION_MADE, (data) => events.push(data));

      intelligence.predict('code_review', {});

      expect(events.length).toBe(1);
      expect(events[0].predictedSuccess).toBeDefined();
    });

    it('should handle unknown task type gracefully', () => {
      const prediction = intelligence.predict('unknown_type', {});

      expect(prediction.confidence).toBeLessThan(0.5);
    });

    it('should factor in complexity', () => {
      const lowComplexity = intelligence.predict('code_review', { complexity: 0.2 });
      const highComplexity = intelligence.predict('code_review', { complexity: 0.9 });

      // High complexity should have lower predicted success
      expect(highComplexity.predictedSuccess).toBeLessThanOrEqual(lowComplexity.predictedSuccess);
    });
  });

  describe('Feedback', () => {
    it('should accept feedback on predictions', () => {
      const outcome: TaskOutcome = {
        taskId: 'task-1',
        taskType: 'test',
        success: true,
        duration: 1000,
        attempts: 1,
        context: {},
      };

      intelligence.provideFeedback('task-1', outcome);

      const stats = intelligence.getStats();
      expect(stats.totalTasks).toBe(1);
    });

    it('should emit feedback event', () => {
      const events: any[] = [];
      intelligence.on(LearningEvent.FEEDBACK_RECEIVED, (data) => events.push(data));

      intelligence.recordOutcome({
        taskId: 'task-1',
        taskType: 'test',
        success: true,
        duration: 1000,
        attempts: 1,
        context: {},
      });

      intelligence.provideFeedback('task-1', {
        taskId: 'task-1',
        taskType: 'test',
        success: false, // Different outcome
        duration: 2000,
        attempts: 2,
        context: {},
      });

      expect(events.length).toBe(1);
    });
  });

  describe('Strategies', () => {
    it('should register strategy', () => {
      const strategy = intelligence.registerStrategy({
        id: 'strategy-1',
        name: 'Test Strategy',
        description: 'A test strategy',
        applicableContexts: [{ agentRole: 'implementer' }],
        actions: [{ type: 'analyze', params: {}, order: 1 }],
      });

      expect(strategy.id).toBe('strategy-1');
      expect(strategy.successRate).toBe(0.5); // Default neutral
    });

    it('should get recommended strategies', () => {
      intelligence.registerStrategy({
        id: 'strategy-1',
        name: 'Strategy 1',
        description: 'First strategy',
        applicableContexts: [{ agentRole: 'reviewer' }],
        actions: [],
      });

      intelligence.registerStrategy({
        id: 'strategy-2',
        name: 'Strategy 2',
        description: 'Second strategy',
        applicableContexts: [{ agentRole: 'implementer' }],
        actions: [],
      });

      const recommendations = intelligence.getRecommendedStrategies('code_review', {
        agentRole: 'reviewer',
      });

      expect(recommendations.length).toBe(1);
      expect(recommendations[0].id).toBe('strategy-1');
    });

    it('should get all strategies', () => {
      intelligence.registerStrategy({
        id: 's1',
        name: 'S1',
        description: 'S1',
        applicableContexts: [],
        actions: [],
      });

      intelligence.registerStrategy({
        id: 's2',
        name: 'S2',
        description: 'S2',
        applicableContexts: [],
        actions: [],
      });

      const strategies = intelligence.getStrategies();
      expect(strategies.length).toBe(2);
    });

    it('should update strategy success rate', () => {
      intelligence.registerStrategy({
        id: 'strategy-1',
        name: 'Strategy 1',
        description: 'Test',
        applicableContexts: [{ agentRole: 'implementer' }],
        actions: [],
      });

      // Record outcomes and provide feedback to trigger strategy adjustment
      for (let i = 0; i < 10; i++) {
        const outcome = {
          taskId: `task-${i}`,
          taskType: 'implementation',
          success: true,
          duration: 1000,
          attempts: 1,
          context: { agentRole: 'implementer' },
        };
        intelligence.recordOutcome(outcome);
        intelligence.provideFeedback(`task-${i}`, outcome);
      }

      const strategies = intelligence.getStrategies();
      const strategy = strategies.find(s => s.id === 'strategy-1');

      expect(strategy!.usageCount).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    it('should export state', () => {
      intelligence.recordOutcome({
        taskId: 'task-1',
        taskType: 'test',
        success: true,
        duration: 1000,
        attempts: 1,
        context: {},
      });

      intelligence.registerStrategy({
        id: 's1',
        name: 'S1',
        description: 'S1',
        applicableContexts: [],
        actions: [],
      });

      const state = intelligence.exportState();

      expect(state.taskHistory.length).toBe(1);
      expect(state.strategies.length).toBe(1);
      expect(state.patterns.length).toBeGreaterThan(0);
    });

    it('should import state', () => {
      const state = {
        taskHistory: [
          {
            taskId: 'imported-task',
            taskType: 'test',
            success: true,
            duration: 1000,
            attempts: 1,
            context: {},
          },
        ],
        strategies: [
          {
            id: 'imported-strategy',
            name: 'Imported',
            description: 'Imported strategy',
            applicableContexts: [],
            actions: [],
            successRate: 0.8,
            usageCount: 5,
          },
        ],
        patterns: [],
      };

      intelligence.importState(state);

      const stats = intelligence.getStats();
      expect(stats.totalTasks).toBe(1);
      expect(stats.strategyCount).toBe(1);
    });

    it('should clear all data', () => {
      intelligence.recordOutcome({
        taskId: 'task-1',
        taskType: 'test',
        success: true,
        duration: 1000,
        attempts: 1,
        context: {},
      });

      intelligence.clear();

      const stats = intelligence.getStats();
      expect(stats.totalTasks).toBe(0);
      expect(stats.patternCount).toBe(0);
      expect(stats.strategyCount).toBe(0);
    });
  });

  describe('Event Subscription', () => {
    it('should subscribe to events', () => {
      const events: any[] = [];
      const unsubscribe = intelligence.on(LearningEvent.TASK_COMPLETED, (data) =>
        events.push(data)
      );

      intelligence.recordOutcome({
        taskId: 'task-1',
        taskType: 'test',
        success: true,
        duration: 1000,
        attempts: 1,
        context: {},
      });

      expect(events.length).toBe(1);

      // Unsubscribe
      unsubscribe();

      intelligence.recordOutcome({
        taskId: 'task-2',
        taskType: 'test',
        success: true,
        duration: 1000,
        attempts: 1,
        context: {},
      });

      expect(events.length).toBe(1); // No new events
    });

    it('should handle multiple subscribers', () => {
      const events1: any[] = [];
      const events2: any[] = [];

      intelligence.on(LearningEvent.TASK_COMPLETED, (data) => events1.push(data));
      intelligence.on(LearningEvent.TASK_COMPLETED, (data) => events2.push(data));

      intelligence.recordOutcome({
        taskId: 'task-1',
        taskType: 'test',
        success: true,
        duration: 1000,
        attempts: 1,
        context: {},
      });

      expect(events1.length).toBe(1);
      expect(events2.length).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should return comprehensive stats', () => {
      for (let i = 0; i < 10; i++) {
        intelligence.recordOutcome({
          taskId: `task-${i}`,
          taskType: 'test',
          success: i < 7,
          duration: 1000,
          attempts: 1,
          context: {},
        });
      }

      const stats = intelligence.getStats();

      expect(stats.totalTasks).toBe(10);
      expect(stats.successRate).toBe(0.7);
      expect(stats.patternCount).toBeGreaterThan(0);
      expect(typeof stats.avgConfidence).toBe('number');
    });
  });

  describe('Global Intelligence', () => {
    it('should get global intelligence', () => {
      const global = getGlobalIntelligence();
      expect(global).toBeInstanceOf(AdaptiveIntelligence);
    });

    it('should return same instance', () => {
      const global1 = getGlobalIntelligence();
      const global2 = getGlobalIntelligence();
      expect(global1).toBe(global2);
    });

    it('should reset global intelligence', () => {
      const global1 = getGlobalIntelligence();
      resetGlobalIntelligence();
      const global2 = getGlobalIntelligence();
      expect(global1).not.toBe(global2);
    });
  });

  describe('Helper Functions', () => {
    it('should use predictTaskSuccess helper', () => {
      resetGlobalIntelligence();
      const prediction = predictTaskSuccess('test_task', {});
      expect(prediction.predictedSuccess).toBeDefined();
    });

    it('should use recordTaskOutcome helper', () => {
      resetGlobalIntelligence();
      recordTaskOutcome({
        taskId: 'task-1',
        taskType: 'test',
        success: true,
        duration: 1000,
        attempts: 1,
        context: {},
      });

      const stats = getGlobalIntelligence().getStats();
      expect(stats.totalTasks).toBe(1);
    });
  });
});
