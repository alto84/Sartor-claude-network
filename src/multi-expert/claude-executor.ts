/**
 * Claude LLM Executor
 *
 * Real implementation of ExpertExecutor using Anthropic's Claude API.
 * Translates expert archetypes into appropriate prompts and strategies.
 *
 * @module multi-expert/claude-executor
 */

import Anthropic from '@anthropic-ai/sdk';
import { ExpertConfig, ExpertArchetype } from './expert-config';
import { ExpertTask, ExpertExecutor } from './execution-engine';

/**
 * Configuration for Claude executor
 */
export interface ClaudeExecutorConfig {
  /** Anthropic API key (defaults to ANTHROPIC_API_KEY env var) */
  apiKey?: string;

  /** Model to use (defaults to claude-sonnet-4-20250514) */
  model?: string;

  /** Maximum tokens in response */
  maxTokens?: number;

  /** Enable cost tracking */
  trackCosts?: boolean;

  /** Budget limit in USD (0 = unlimited) */
  budgetLimit?: number;

  /** Enable detailed logging */
  verbose?: boolean;
}

/**
 * Cost tracking for API usage
 */
export interface CostTracker {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  requestCount: number;
  byExpert: Record<string, { inputTokens: number; outputTokens: number; cost: number }>;
}

/**
 * Approximate cost per 1M tokens (as of 2024)
 * Update these as pricing changes
 */
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-opus-4-20250514': { input: 15.0, output: 75.0 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
};

/**
 * Generate system prompt based on expert archetype
 */
function getSystemPrompt(archetype: ExpertArchetype, strategy: string): string {
  const archetypePrompts: Record<ExpertArchetype, string> = {
    performance: `You are a performance-focused expert. Prioritize:
- Execution speed and efficiency
- Minimal resource usage
- Optimized algorithms and data structures
- Avoiding unnecessary complexity
Always explain your performance considerations.`,

    safety: `You are a safety-focused expert. Prioritize:
- Input validation and error handling
- Security best practices
- Defensive programming
- Comprehensive edge case handling
Always explain potential risks and how you mitigate them.`,

    simplicity: `You are a simplicity-focused expert. Prioritize:
- Clear, readable code
- Minimal abstractions
- Self-documenting solutions
- Easy maintenance and understanding
Always prefer the simplest solution that meets requirements.`,

    robustness: `You are a robustness-focused expert. Prioritize:
- Graceful failure handling
- Recovery mechanisms
- Resilience to unexpected inputs
- Comprehensive testing considerations
Always explain how your solution handles failures.`,

    creative: `You are a creative problem-solver. Prioritize:
- Unconventional approaches
- Novel solutions
- Thinking outside the box
- Challenging assumptions
Always explain why your creative approach might be better.`,

    balanced: `You are a balanced expert. Consider all aspects:
- Performance and efficiency
- Safety and correctness
- Simplicity and maintainability
- Robustness and reliability
Provide well-rounded solutions with clear trade-offs.`,
  };

  const strategyAddendum: Record<string, string> = {
    analytical: '\n\nApproach problems systematically, step by step.',
    exploratory: '\n\nExplore multiple approaches before settling on a solution.',
    conservative: '\n\nStick to proven patterns and well-established practices.',
    aggressive: '\n\nPush boundaries and accept calculated risks for better outcomes.',
  };

  return archetypePrompts[archetype] + (strategyAddendum[strategy] || '');
}

/**
 * Format task into a user prompt
 */
function formatTaskPrompt(task: ExpertTask): string {
  let prompt = `## Task: ${task.description}\n\n`;

  if (task.type) {
    prompt += `**Type:** ${task.type}\n\n`;
  }

  if (task.input) {
    prompt += `**Input:**\n\`\`\`\n${JSON.stringify(task.input, null, 2)}\n\`\`\`\n\n`;
  }

  if (task.context) {
    prompt += `**Context:**\n${JSON.stringify(task.context, null, 2)}\n\n`;
  }

  prompt += `Please provide your solution with:
1. Your approach and reasoning
2. The solution itself
3. A self-assessment score (0-100) for quality
4. A confidence level (0-1) in your solution
5. Any caveats or limitations`;

  return prompt;
}

/**
 * Parse Claude's response to extract structured data
 */
function parseResponse(content: string): {
  output: string;
  score: number;
  confidence: number;
} {
  // Try to extract score from response
  const scoreMatch = content.match(/(?:score|quality)[:\s]*(\d+)/i);
  const confidenceMatch = content.match(/confidence[:\s]*(0?\.\d+|1\.0?|1)/i);

  // Default scoring based on response characteristics
  let score = 70; // Base score
  let confidence = 0.7;

  if (scoreMatch) {
    score = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)));
  } else {
    // Heuristic scoring based on response quality indicators
    if (content.length > 500) score += 5;
    if (content.includes('```')) score += 5; // Has code
    if (content.includes('trade-off') || content.includes('consideration')) score += 5;
    if (content.includes('error') || content.includes('edge case')) score += 5;
  }

  if (confidenceMatch) {
    confidence = parseFloat(confidenceMatch[1]);
  }

  return {
    output: content,
    score: Math.min(100, score),
    confidence: Math.min(1, Math.max(0, confidence)),
  };
}

/**
 * Create a Claude-powered expert executor
 */
export function createClaudeExecutor(config: ClaudeExecutorConfig = {}): {
  executor: ExpertExecutor;
  getCosts: () => CostTracker;
  resetCosts: () => void;
} {
  const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is required. Set it in environment or pass apiKey in config.'
    );
  }

  const client = new Anthropic({ apiKey });
  const model = config.model || 'claude-sonnet-4-20250514';
  const maxTokens = config.maxTokens || 4096;
  const budgetLimit = config.budgetLimit || 0;
  const verbose = config.verbose || false;

  // Cost tracking
  const costs: CostTracker = {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    requestCount: 0,
    byExpert: {},
  };

  const calculateCost = (inputTokens: number, outputTokens: number): number => {
    const pricing = TOKEN_COSTS[model] || { input: 3.0, output: 15.0 };
    return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
  };

  const executor: ExpertExecutor = async (task: ExpertTask, expertConfig: ExpertConfig) => {
    // Check budget
    if (budgetLimit > 0 && costs.totalCost >= budgetLimit) {
      throw new Error(`Budget limit exceeded: $${costs.totalCost.toFixed(4)} >= $${budgetLimit}`);
    }

    const systemPrompt = getSystemPrompt(expertConfig.archetype, expertConfig.strategy);
    const userPrompt = formatTaskPrompt(task);

    if (verbose) {
      console.log(
        `[ClaudeExecutor] Expert ${expertConfig.id} (${expertConfig.archetype}) starting task ${task.id}`
      );
    }

    let iterations = 0;
    let bestResult = { output: '', score: 0, confidence: 0 };

    // Refinement loop
    for (let i = 0; i < expertConfig.maxIterations; i++) {
      iterations++;

      try {
        const response = await client.messages.create({
          model,
          max_tokens: maxTokens,
          temperature: expertConfig.temperature,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content:
                i === 0
                  ? userPrompt
                  : `${userPrompt}\n\n[Previous attempt scored ${bestResult.score}/100. Please improve your solution.]`,
            },
          ],
        });

        // Track costs
        const inputTokens = response.usage?.input_tokens || 0;
        const outputTokens = response.usage?.output_tokens || 0;
        const cost = calculateCost(inputTokens, outputTokens);

        costs.totalInputTokens += inputTokens;
        costs.totalOutputTokens += outputTokens;
        costs.totalCost += cost;
        costs.requestCount++;

        if (!costs.byExpert[expertConfig.id]) {
          costs.byExpert[expertConfig.id] = { inputTokens: 0, outputTokens: 0, cost: 0 };
        }
        costs.byExpert[expertConfig.id].inputTokens += inputTokens;
        costs.byExpert[expertConfig.id].outputTokens += outputTokens;
        costs.byExpert[expertConfig.id].cost += cost;

        // Extract response content
        const content =
          response.content[0].type === 'text'
            ? response.content[0].text
            : JSON.stringify(response.content[0]);

        const parsed = parseResponse(content);

        if (verbose) {
          console.log(
            `[ClaudeExecutor] Expert ${expertConfig.id} iteration ${i + 1}: score=${parsed.score}, confidence=${parsed.confidence}`
          );
        }

        // Keep best result
        if (parsed.score > bestResult.score) {
          bestResult = parsed;
        }

        // Check for early termination (satisfactionThreshold is 0-1, score is 0-100)
        if (
          parsed.score >= expertConfig.satisfactionThreshold * 100 &&
          i >= expertConfig.minIterations - 1
        ) {
          break;
        }
      } catch (error) {
        if (verbose) {
          console.error(
            `[ClaudeExecutor] Expert ${expertConfig.id} iteration ${i + 1} failed:`,
            error
          );
        }

        // Continue to next iteration on error
        if (i === expertConfig.maxIterations - 1) {
          throw error; // Rethrow on final iteration
        }
      }
    }

    return {
      output: bestResult.output,
      score: bestResult.score,
      confidence: bestResult.confidence,
      iterations,
    };
  };

  return {
    executor,
    getCosts: () => ({ ...costs }),
    resetCosts: () => {
      costs.totalInputTokens = 0;
      costs.totalOutputTokens = 0;
      costs.totalCost = 0;
      costs.requestCount = 0;
      costs.byExpert = {};
    },
  };
}

/**
 * Create a Claude executor with rate limiting
 */
export function createRateLimitedClaudeExecutor(
  config: ClaudeExecutorConfig = {},
  rateLimitConfig: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  } = {}
): {
  executor: ExpertExecutor;
  getCosts: () => CostTracker;
  resetCosts: () => void;
} {
  const { executor: baseExecutor, getCosts, resetCosts } = createClaudeExecutor(config);
  const requestsPerMinute = rateLimitConfig.requestsPerMinute || 50;

  // Simple rate limiting with request timestamps
  const requestTimestamps: number[] = [];

  const rateLimitedExecutor: ExpertExecutor = async (task, expertConfig) => {
    // Clean old timestamps
    const oneMinuteAgo = Date.now() - 60000;
    while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
      requestTimestamps.shift();
    }

    // Wait if at rate limit
    if (requestTimestamps.length >= requestsPerMinute) {
      const waitTime = requestTimestamps[0] + 60000 - Date.now();
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    requestTimestamps.push(Date.now());
    return baseExecutor(task, expertConfig);
  };

  return {
    executor: rateLimitedExecutor,
    getCosts,
    resetCosts,
  };
}
