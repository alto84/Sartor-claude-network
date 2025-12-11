/**
 * Tests for Memory Integration and Orchestrator
 */

import {
  MemoryIntegration,
  InMemoryMemoryClient,
  createTestMemoryIntegration,
  Orchestrator,
  createTestOrchestrator,
  orchestrateTask,
  ExpertTask,
  ExpertResult,
  createExpertConfig,
  createMockExecutor,
} from '../index';

describe('MemoryIntegration', () => {
  const createMockResult = (
    taskId: string,
    expertId: string,
    score: number,
    success: boolean = true
  ): ExpertResult => ({
    expertId,
    expertConfig: createExpertConfig(expertId, `${expertId} Expert`, 'balanced'),
    taskId,
    success,
    output: success ? 'test output' : null,
    confidence: 0.85,
    score,
    iterations: 1,
    durationMs: 1000,
    error: success ? undefined : 'Test error',
  });

  describe('InMemoryMemoryClient', () => {
    test('creates and retrieves memories', async () => {
      const client = new InMemoryMemoryClient();

      const id = await client.create({
        type: 'solution',
        taskId: 'task-1',
        taskType: 'test',
        content: { data: 'test' },
        score: 85,
        confidence: 0.9,
        tags: ['test'],
        metadata: {},
      });

      expect(id).toBeDefined();

      const memory = await client.get(id);
      expect(memory).toBeDefined();
      expect(memory!.type).toBe('solution');
      expect(memory!.score).toBe(85);
    });

    test('searches memories by type', async () => {
      const client = new InMemoryMemoryClient();

      await client.create({
        type: 'solution',
        taskId: 'task-1',
        taskType: 'test',
        content: {},
        score: 80,
        confidence: 0.9,
        tags: [],
        metadata: {},
      });

      await client.create({
        type: 'failure',
        taskId: 'task-2',
        taskType: 'test',
        content: {},
        score: 20,
        confidence: 0.5,
        tags: [],
        metadata: {},
      });

      const solutions = await client.search({ type: 'solution' });
      expect(solutions.length).toBe(1);
      expect(solutions[0].type).toBe('solution');
    });

    test('filters by minimum score', async () => {
      const client = new InMemoryMemoryClient();

      await client.create({
        type: 'solution',
        taskId: 'task-1',
        taskType: 'test',
        content: {},
        score: 90,
        confidence: 0.9,
        tags: [],
        metadata: {},
      });

      await client.create({
        type: 'solution',
        taskId: 'task-2',
        taskType: 'test',
        content: {},
        score: 50,
        confidence: 0.7,
        tags: [],
        metadata: {},
      });

      const results = await client.search({ minScore: 70 });
      expect(results.length).toBe(1);
      expect(results[0].score).toBe(90);
    });

    test('updates memories', async () => {
      const client = new InMemoryMemoryClient();

      const id = await client.create({
        type: 'solution',
        taskId: 'task-1',
        taskType: 'test',
        content: {},
        score: 70,
        confidence: 0.8,
        tags: [],
        metadata: {},
      });

      await client.update(id, { score: 85 });

      const memory = await client.get(id);
      expect(memory!.score).toBe(85);
    });

    test('deletes memories', async () => {
      const client = new InMemoryMemoryClient();

      const id = await client.create({
        type: 'solution',
        taskId: 'task-1',
        taskType: 'test',
        content: {},
        score: 70,
        confidence: 0.8,
        tags: [],
        metadata: {},
      });

      const deleted = await client.delete(id);
      expect(deleted).toBe(true);

      const memory = await client.get(id);
      expect(memory).toBeNull();
    });
  });

  describe('MemoryIntegration', () => {
    test('stores successful results', async () => {
      const integration = createTestMemoryIntegration();
      const result = createMockResult('task-1', 'expert-1', 80);

      const id = await integration.storeResult(result);

      expect(id).toBeDefined();
    });

    test('stores failed results when configured', async () => {
      const integration = createTestMemoryIntegration();
      const result = createMockResult('task-1', 'expert-1', 0, false);

      const id = await integration.storeResult(result);

      expect(id).toBeDefined();
    });

    test('skips low score results', async () => {
      const client = new InMemoryMemoryClient();
      const integration = new MemoryIntegration(client, {
        minScoreToStore: 70,
      });

      const result = createMockResult('task-1', 'expert-1', 50);
      const id = await integration.storeResult(result);

      expect(id).toBeNull();
    });

    test('tracks expert performance', async () => {
      const integration = createTestMemoryIntegration();

      const result1 = createMockResult('task-1', 'expert-1', 80);
      const result2 = createMockResult('task-2', 'expert-1', 90);

      await integration.updatePerformance(result1);
      await integration.updatePerformance(result2);

      const performance = await integration.getExpertPerformance('expert-1');

      expect(performance.totalExecutions).toBe(2);
      expect(performance.avgScore).toBe(85);
    });

    test('clears performance cache', async () => {
      const integration = createTestMemoryIntegration();

      const result = createMockResult('task-1', 'expert-1', 80);
      await integration.updatePerformance(result);

      integration.clearCache();

      // Should still work but will re-fetch
      const performance = await integration.getExpertPerformance('expert-1');
      expect(performance.expertId).toBe('expert-1');
    });
  });
});

describe('Orchestrator', () => {
  describe('execute', () => {
    test('executes task with full pipeline', async () => {
      const orchestrator = createTestOrchestrator({
        expertCount: 3,
        archetypes: ['performance', 'safety', 'balanced'],
      });

      const task: ExpertTask = {
        id: 'orchestrator-test-1',
        description: 'Test orchestration',
        type: 'test',
        input: { data: 'test' },
      };

      const result = await orchestrator.execute(task);

      expect(result.task.id).toBe('orchestrator-test-1');
      expect(result.expertResults.results.length).toBe(3);
      expect(result.scoredResults.length).toBe(3);
      expect(result.winner).toBeDefined();
      expect(result.winnerScore).toBeDefined();
      expect(result.poolStats).toBeDefined();
      expect(result.diversityScore).toBeGreaterThan(0);
    });

    test('runs voting when enabled', async () => {
      const orchestrator = createTestOrchestrator({
        expertCount: 3,
        useVoting: true,
        votingMethod: 'weighted',
      });

      const task: ExpertTask = {
        id: 'voting-test',
        description: 'Test voting',
        type: 'test',
        input: {},
      };

      const result = await orchestrator.execute(task);

      expect(result.votingResult).toBeDefined();
      expect(result.votingResult!.method).toBe('weighted');
    });

    test('selects diverse results', async () => {
      const orchestrator = createTestOrchestrator({
        expertCount: 5,
        archetypes: ['performance', 'safety', 'simplicity', 'creative', 'balanced'],
        useDiversitySelection: true,
        diverseResultCount: 3,
      });

      const task: ExpertTask = {
        id: 'diversity-test',
        description: 'Test diversity selection',
        type: 'test',
        input: {},
      };

      const result = await orchestrator.execute(task);

      expect(result.diverseResults.length).toBe(3);
    });

    test('stores results in memory', async () => {
      const orchestrator = createTestOrchestrator({
        expertCount: 2,
        useMemory: true,
      });

      const task: ExpertTask = {
        id: 'memory-test',
        description: 'Test memory storage',
        type: 'test',
        input: {},
      };

      const result = await orchestrator.execute(task);

      // Should have stored memories
      expect(result.memoryIds.length).toBeGreaterThan(0);
    });

    test('collects feedback when enabled', async () => {
      const orchestrator = createTestOrchestrator({
        expertCount: 2,
        useFeedbackLoop: true,
        targetScore: 95, // High target to trigger feedback
      });

      const task: ExpertTask = {
        id: 'feedback-test',
        description: 'Test feedback collection',
        type: 'test',
        input: {},
      };

      const result = await orchestrator.execute(task);

      expect(result.feedback).toBeDefined();
      expect(result.feedback!.length).toBeGreaterThan(0);
    });

    test('includes metadata', async () => {
      const orchestrator = createTestOrchestrator({
        expertCount: 3,
        archetypes: ['performance', 'safety', 'balanced'],
        votingMethod: 'borda',
      });

      const task: ExpertTask = {
        id: 'metadata-test',
        description: 'Test metadata',
        type: 'test',
        input: {},
      };

      const result = await orchestrator.execute(task);

      expect(result.metadata.expertCount).toBe(3);
      expect(result.metadata.archetypesUsed).toHaveLength(3);
      expect(result.metadata.votingMethod).toBe('borda');
    });
  });

  describe('quickExecute', () => {
    test('returns just the winner', async () => {
      const orchestrator = createTestOrchestrator();

      const task: ExpertTask = {
        id: 'quick-test',
        description: 'Quick execution test',
        type: 'test',
        input: {},
      };

      const winner = await orchestrator.quickExecute(task);

      expect(winner).toBeDefined();
      expect(winner.success).toBe(true);
    });
  });

  describe('configuration', () => {
    test('setConfig updates configuration', () => {
      const orchestrator = createTestOrchestrator({ expertCount: 3 });

      orchestrator.setConfig({ expertCount: 5, targetScore: 90 });

      const config = orchestrator.getConfig();
      expect(config.expertCount).toBe(5);
      expect(config.targetScore).toBe(90);
    });

    test('getConfig returns current configuration', () => {
      const orchestrator = createTestOrchestrator({
        expertCount: 4,
        useVoting: false,
      });

      const config = orchestrator.getConfig();

      expect(config.expertCount).toBe(4);
      expect(config.useVoting).toBe(false);
    });
  });

  describe('helper functions', () => {
    test('orchestrateTask works', async () => {
      const task: ExpertTask = {
        id: 'helper-test',
        description: 'Test helper function',
        type: 'test',
        input: {},
      };

      const result = await orchestrateTask(task);

      expect(result.task.id).toBe('helper-test');
      expect(result.winner).toBeDefined();
    });

    test('createTestOrchestrator creates working orchestrator', () => {
      const orchestrator = createTestOrchestrator();

      expect(orchestrator).toBeInstanceOf(Orchestrator);
    });
  });
});

describe('Integration', () => {
  test('full pipeline: task -> experts -> vote -> score -> memory', async () => {
    const orchestrator = createTestOrchestrator({
      expertCount: 5,
      archetypes: ['performance', 'safety', 'simplicity', 'creative', 'balanced'],
      useMemory: true,
      useVoting: true,
      useFeedbackLoop: true,
      useDiversitySelection: true,
      diverseResultCount: 3,
      targetScore: 80,
    });

    const task: ExpertTask = {
      id: 'full-integration-test',
      description: 'Full integration test',
      type: 'integration',
      input: { complexity: 'high' },
    };

    const result = await orchestrator.execute(task);

    // Verify all pipeline stages ran
    expect(result.expertResults.results.length).toBe(5);
    expect(result.scoredResults.length).toBe(5);
    expect(result.diverseResults.length).toBe(3);
    expect(result.votingResult).toBeDefined();
    expect(result.feedback).toBeDefined();
    expect(result.memoryIds.length).toBeGreaterThan(0);

    // Verify result quality
    expect(result.winner).toBeDefined();
    expect(result.winnerScore.overall).toBeGreaterThan(0);
    expect(result.poolStats.count).toBe(5);
    expect(result.diversityScore).toBeGreaterThan(0);

    // Verify timing
    expect(result.totalDurationMs).toBeGreaterThan(0);
  });
});
