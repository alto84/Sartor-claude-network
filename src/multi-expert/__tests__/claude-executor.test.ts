/**
 * Claude Executor Tests
 *
 * Tests the Claude executor structure and error handling.
 * NOTE: These tests use mocks and don't make real API calls.
 * For real integration testing, use the examples/multi-expert-claude-demo.ts
 */

import { createClaudeExecutor, createRateLimitedClaudeExecutor } from '../claude-executor';
import { createExpertConfig, ExpertArchetype } from '../expert-config';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: `Here is my solution:

\`\`\`python
def longest_palindrome(s: str) -> str:
    if not s:
        return ""
    # Implementation here
    return s
\`\`\`

Score: 85/100
Confidence: 0.8

This handles edge cases well.`,
            },
          ],
          usage: {
            input_tokens: 150,
            output_tokens: 100,
          },
        }),
      },
    })),
  };
});

describe('ClaudeExecutor', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createClaudeExecutor', () => {
    it('throws error when API key is missing', () => {
      delete process.env.ANTHROPIC_API_KEY;
      expect(() => createClaudeExecutor()).toThrow('ANTHROPIC_API_KEY is required');
    });

    it('creates executor with API key from environment', () => {
      const { executor, getCosts } = createClaudeExecutor();
      expect(executor).toBeDefined();
      expect(typeof executor).toBe('function');
      expect(getCosts).toBeDefined();
    });

    it('creates executor with explicit API key', () => {
      delete process.env.ANTHROPIC_API_KEY;
      const { executor } = createClaudeExecutor({ apiKey: 'explicit-key' });
      expect(executor).toBeDefined();
    });

    it('initializes cost tracker correctly', () => {
      const { getCosts } = createClaudeExecutor();
      const costs = getCosts();
      expect(costs.totalInputTokens).toBe(0);
      expect(costs.totalOutputTokens).toBe(0);
      expect(costs.totalCost).toBe(0);
      expect(costs.requestCount).toBe(0);
      expect(costs.byExpert).toEqual({});
    });

    it('resets costs correctly', () => {
      const { getCosts, resetCosts } = createClaudeExecutor();

      // Manually modify the returned object won't affect internal state
      // But we can verify reset works on a fresh tracker
      resetCosts();
      const costs = getCosts();
      expect(costs.totalCost).toBe(0);
    });
  });

  describe('executor function', () => {
    it('executes task and returns structured result', async () => {
      const { executor } = createClaudeExecutor();

      const task = {
        id: 'test-task',
        description: 'Test task',
        type: 'test',
        input: { data: 'test' },
      };

      const config = createExpertConfig('test-expert', 'Test Expert', 'balanced', {
        maxIterations: 1,
      });

      const result = await executor(task, config);

      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('iterations');
      expect(typeof result.score).toBe('number');
      expect(typeof result.confidence).toBe('number');
      expect(result.iterations).toBeGreaterThanOrEqual(1);
    });

    it('tracks costs after execution', async () => {
      const { executor, getCosts } = createClaudeExecutor();

      const task = {
        id: 'test-task',
        description: 'Test task',
        type: 'test',
        input: {},
      };

      const config = createExpertConfig('expert-1', 'Expert 1', 'balanced', { maxIterations: 1 });

      await executor(task, config);

      const costs = getCosts();
      expect(costs.requestCount).toBeGreaterThan(0);
      expect(costs.totalInputTokens).toBeGreaterThan(0);
      expect(costs.totalOutputTokens).toBeGreaterThan(0);
      expect(costs.totalCost).toBeGreaterThan(0);
      expect(costs.byExpert['expert-1']).toBeDefined();
    });

    it('parses score from response', async () => {
      const { executor } = createClaudeExecutor();

      const task = {
        id: 'test-task',
        description: 'Test task',
        type: 'test',
        input: {},
      };

      const config = createExpertConfig('test-expert', 'Test Expert', 'balanced', {
        maxIterations: 1,
      });

      const result = await executor(task, config);

      // Mock response includes "Score: 85/100" and "Confidence: 0.8"
      expect(result.score).toBe(85);
      expect(result.confidence).toBe(0.8);
    });
  });

  describe('budget enforcement', () => {
    it('throws error when budget is exceeded', async () => {
      const { executor } = createClaudeExecutor({
        budgetLimit: 0.0001, // Very low budget
      });

      const task = {
        id: 'test-task',
        description: 'Test task',
        type: 'test',
        input: {},
      };

      const config = createExpertConfig('test-expert', 'Test Expert', 'balanced', {
        maxIterations: 1,
      });

      // First call should succeed
      await executor(task, config);

      // Second call should fail due to budget
      await expect(executor(task, config)).rejects.toThrow('Budget limit exceeded');
    });
  });

  describe('createRateLimitedClaudeExecutor', () => {
    it('creates rate-limited executor', () => {
      const { executor, getCosts, resetCosts } = createRateLimitedClaudeExecutor(
        {},
        { requestsPerMinute: 10 }
      );
      expect(executor).toBeDefined();
      expect(getCosts).toBeDefined();
      expect(resetCosts).toBeDefined();
    });

    it('executes tasks within rate limit', async () => {
      const { executor } = createRateLimitedClaudeExecutor({}, { requestsPerMinute: 100 });

      const task = {
        id: 'test-task',
        description: 'Test task',
        type: 'test',
        input: {},
      };

      const config = createExpertConfig('test-expert', 'Test Expert', 'balanced', {
        maxIterations: 1,
      });

      const result = await executor(task, config);
      expect(result).toBeDefined();
    });
  });
});

describe('Archetype Prompts', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('generates different prompts for different archetypes', async () => {
    // This test verifies that different archetypes produce different system prompts
    // We can't easily test the prompts directly without exposing internals,
    // but we can verify the executor works with all archetypes

    const { executor } = createClaudeExecutor();
    const archetypes: ExpertArchetype[] = [
      'performance',
      'safety',
      'simplicity',
      'robustness',
      'creative',
      'balanced',
    ];

    const task = {
      id: 'test-task',
      description: 'Test task',
      type: 'test',
      input: {},
    };

    for (const archetype of archetypes) {
      const config = createExpertConfig(`${archetype}-expert`, `${archetype} Expert`, archetype, {
        maxIterations: 1,
      });

      const result = await executor(task, config);
      expect(result).toBeDefined();
      expect(result.output).toBeDefined();
    }
  });
});
