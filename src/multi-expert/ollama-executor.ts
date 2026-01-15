/**
 * Ollama LLM Executor
 *
 * Local model implementation of ExpertExecutor using Ollama.
 * Enables hybrid local + API architecture:
 * - Free/cheap tokens for drafting, verification, exploration
 * - Escalation to Claude for hard problems
 *
 * @module multi-expert/ollama-executor
 */

import { ExpertConfig, ExpertArchetype } from './expert-config';
import { ExpertTask, ExpertExecutor } from './execution-engine';

/**
 * Configuration for Ollama executor
 */
export interface OllamaExecutorConfig {
  /** Ollama server host (defaults to gpuserver1) */
  host?: string;

  /** Ollama server port (defaults to 11434) */
  port?: number;

  /** Model to use (defaults to qwen3:8b) */
  model?: string;

  /** Maximum tokens in response */
  maxTokens?: number;

  /** Enable detailed logging */
  verbose?: boolean;

  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Usage tracking for local model (no cost, but track tokens for comparison)
 */
export interface UsageTracker {
  totalInputTokens: number;
  totalOutputTokens: number;
  requestCount: number;
  totalLatencyMs: number;
  byExpert: Record<string, { inputTokens: number; outputTokens: number; latencyMs: number }>;
}

/**
 * Generate system prompt based on expert archetype
 * (Same as claude-executor for consistency)
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
 * Parse response to extract structured data
 */
function parseResponse(content: string): {
  output: string;
  score: number;
  confidence: number;
} {
  const scoreMatch = content.match(/(?:score|quality)[:\s]*(\d+)/i);
  const confidenceMatch = content.match(/confidence[:\s]*(0?\.\d+|1\.0?|1)/i);

  let score = 70;
  let confidence = 0.7;

  if (scoreMatch) {
    score = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)));
  } else {
    if (content.length > 500) score += 5;
    if (content.includes('```')) score += 5;
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
 * Make HTTP request to Ollama API
 */
async function ollamaChat(
  host: string,
  port: number,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number,
  timeout: number
): Promise<{
  content: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}> {
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`http://${host}:${port}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content: data.message?.content || '',
      inputTokens: data.prompt_eval_count || 0,
      outputTokens: data.eval_count || 0,
      latencyMs,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Check if Ollama server is available
 */
export async function isOllamaAvailable(host: string, port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://${host}:${port}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Create an Ollama-powered expert executor
 */
export function createOllamaExecutor(config: OllamaExecutorConfig = {}): {
  executor: ExpertExecutor;
  getUsage: () => UsageTracker;
  resetUsage: () => void;
  isAvailable: () => Promise<boolean>;
} {
  const host = config.host || process.env.OLLAMA_HOST || '192.168.1.100';
  const port = config.port || parseInt(process.env.OLLAMA_PORT || '11434', 10);
  const model = config.model || process.env.OLLAMA_MODEL || 'qwen3:8b';
  const maxTokens = config.maxTokens || 4096;
  const verbose = config.verbose || false;
  const timeout = config.timeout || 120000;

  // Usage tracking
  const usage: UsageTracker = {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    requestCount: 0,
    totalLatencyMs: 0,
    byExpert: {},
  };

  const executor: ExpertExecutor = async (task: ExpertTask, expertConfig: ExpertConfig) => {
    const systemPrompt = getSystemPrompt(expertConfig.archetype, expertConfig.strategy);
    const userPrompt = formatTaskPrompt(task);

    if (verbose) {
      console.log(
        `[OllamaExecutor] Expert ${expertConfig.id} (${expertConfig.archetype}) starting task ${task.id}`
      );
    }

    let iterations = 0;
    let bestResult = { output: '', score: 0, confidence: 0 };

    // Refinement loop
    for (let i = 0; i < expertConfig.maxIterations; i++) {
      iterations++;

      try {
        const response = await ollamaChat(
          host,
          port,
          model,
          systemPrompt,
          i === 0
            ? userPrompt
            : `${userPrompt}\n\n[Previous attempt scored ${bestResult.score}/100. Please improve your solution.]`,
          expertConfig.temperature,
          maxTokens,
          timeout
        );

        // Track usage
        usage.totalInputTokens += response.inputTokens;
        usage.totalOutputTokens += response.outputTokens;
        usage.totalLatencyMs += response.latencyMs;
        usage.requestCount++;

        if (!usage.byExpert[expertConfig.id]) {
          usage.byExpert[expertConfig.id] = { inputTokens: 0, outputTokens: 0, latencyMs: 0 };
        }
        usage.byExpert[expertConfig.id].inputTokens += response.inputTokens;
        usage.byExpert[expertConfig.id].outputTokens += response.outputTokens;
        usage.byExpert[expertConfig.id].latencyMs += response.latencyMs;

        const parsed = parseResponse(response.content);

        if (verbose) {
          console.log(
            `[OllamaExecutor] Expert ${expertConfig.id} iteration ${i + 1}: score=${parsed.score}, confidence=${parsed.confidence}, latency=${response.latencyMs}ms`
          );
        }

        // Keep best result
        if (parsed.score > bestResult.score) {
          bestResult = parsed;
        }

        // Check for early termination
        if (parsed.score >= expertConfig.satisfactionThreshold * 100 && i >= expertConfig.minIterations - 1) {
          break;
        }
      } catch (error) {
        if (verbose) {
          console.error(`[OllamaExecutor] Expert ${expertConfig.id} iteration ${i + 1} failed:`, error);
        }

        if (i === expertConfig.maxIterations - 1) {
          throw error;
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
    getUsage: () => ({ ...usage }),
    resetUsage: () => {
      usage.totalInputTokens = 0;
      usage.totalOutputTokens = 0;
      usage.requestCount = 0;
      usage.totalLatencyMs = 0;
      usage.byExpert = {};
    },
    isAvailable: () => isOllamaAvailable(host, port),
  };
}

/**
 * Create a hybrid executor that tries Ollama first, falls back to Claude
 */
export function createHybridExecutor(
  ollamaConfig: OllamaExecutorConfig = {},
  claudeExecutor?: ExpertExecutor,
  options: {
    /** Score threshold below which to escalate to Claude */
    escalationThreshold?: number;
    /** Always use Claude for certain archetypes */
    alwaysEscalateArchetypes?: ExpertArchetype[];
    verbose?: boolean;
  } = {}
): {
  executor: ExpertExecutor;
  getStats: () => { localAttempts: number; escalations: number; localSuccesses: number };
} {
  const { executor: ollamaExecutor, isAvailable } = createOllamaExecutor(ollamaConfig);
  const escalationThreshold = options.escalationThreshold ?? 60;
  const alwaysEscalate = options.alwaysEscalateArchetypes ?? [];
  const verbose = options.verbose ?? false;

  const stats = {
    localAttempts: 0,
    escalations: 0,
    localSuccesses: 0,
  };

  const hybridExecutor: ExpertExecutor = async (task, expertConfig) => {
    // Check if we should skip local and go straight to Claude
    if (alwaysEscalate.includes(expertConfig.archetype)) {
      if (verbose) {
        console.log(`[HybridExecutor] Archetype ${expertConfig.archetype} always escalates to Claude`);
      }
      if (claudeExecutor) {
        stats.escalations++;
        return claudeExecutor(task, expertConfig);
      }
    }

    // Check if Ollama is available
    const available = await isAvailable();
    if (!available) {
      if (verbose) {
        console.log('[HybridExecutor] Ollama not available, using Claude');
      }
      if (claudeExecutor) {
        stats.escalations++;
        return claudeExecutor(task, expertConfig);
      }
      throw new Error('Ollama not available and no Claude executor configured');
    }

    // Try Ollama first
    stats.localAttempts++;
    const result = await ollamaExecutor(task, expertConfig);

    // Check if we should escalate
    if (result.score < escalationThreshold && claudeExecutor) {
      if (verbose) {
        console.log(
          `[HybridExecutor] Local score ${result.score} < threshold ${escalationThreshold}, escalating to Claude`
        );
      }
      stats.escalations++;

      // Include local attempt context
      const enhancedTask: ExpertTask = {
        ...task,
        context: {
          ...task.context,
          localAttempt: result.output,
          localScore: result.score,
          escalationReason: `Local model scored ${result.score}, below threshold ${escalationThreshold}`,
        },
      };

      return claudeExecutor(enhancedTask, expertConfig);
    }

    stats.localSuccesses++;
    return result;
  };

  return {
    executor: hybridExecutor,
    getStats: () => ({ ...stats }),
  };
}
