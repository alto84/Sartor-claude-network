/**
 * Multi-Expert Execution Engine
 *
 * Spawns N configurable experts in parallel, distributes tasks,
 * collects results with timeout enforcement, and tracks metrics.
 *
 * Inspired by Poetiq's parallel execution pattern using asyncio.gather().
 *
 * @module multi-expert/execution-engine
 */

import { ExpertConfig, createExpertConfig, ExpertArchetype } from './expert-config';

/**
 * Task to be executed by experts
 */
export interface ExpertTask {
  /** Unique task identifier */
  id: string;

  /** Task description */
  description: string;

  /** Task type for routing */
  type: string;

  /** Input data for the task */
  input: unknown;

  /** Context for the task */
  context?: Record<string, unknown>;

  /** Priority (higher = more important) */
  priority?: number;

  /** Deadline timestamp (optional) */
  deadline?: number;
}

/**
 * Result from a single expert
 */
export interface ExpertResult {
  /** Expert that produced this result */
  expertId: string;

  /** Expert configuration used */
  expertConfig: ExpertConfig;

  /** Task that was executed */
  taskId: string;

  /** Whether execution succeeded */
  success: boolean;

  /** The output/solution */
  output: unknown;

  /** Confidence score (0-1) */
  confidence: number;

  /** Quality score (0-100) */
  score: number;

  /** Number of iterations used */
  iterations: number;

  /** Execution time in ms */
  durationMs: number;

  /** Error message if failed */
  error?: string;

  /** Detailed execution trace */
  trace?: ExecutionTrace;
}

/**
 * Execution trace for debugging and learning
 */
export interface ExecutionTrace {
  /** Start timestamp */
  startedAt: string;

  /** End timestamp */
  endedAt: string;

  /** Per-iteration details */
  iterations: IterationTrace[];

  /** Total retries */
  totalRetries: number;

  /** Timeout errors encountered */
  timeoutErrors: number;
}

/**
 * Single iteration trace
 */
export interface IterationTrace {
  /** Iteration number */
  iteration: number;

  /** Score at this iteration */
  score: number;

  /** Confidence at this iteration */
  confidence: number;

  /** Duration of this iteration */
  durationMs: number;

  /** Feedback received */
  feedback?: string[];
}

/**
 * Aggregated results from all experts
 */
export interface MultiExpertResult {
  /** Task that was executed */
  taskId: string;

  /** All expert results */
  results: ExpertResult[];

  /** Number of experts that succeeded */
  successCount: number;

  /** Number of experts that failed */
  failureCount: number;

  /** Total execution time */
  totalDurationMs: number;

  /** Best result (highest score among successful) */
  bestResult?: ExpertResult;

  /** Execution summary */
  summary: ExecutionSummary;
}

/**
 * Execution summary statistics
 */
export interface ExecutionSummary {
  /** Average score across successful experts */
  avgScore: number;

  /** Average confidence */
  avgConfidence: number;

  /** Average iterations */
  avgIterations: number;

  /** Score standard deviation */
  scoreStdDev: number;

  /** Agreement level (0-1, higher = more consensus) */
  agreementLevel: number;
}

/**
 * Execution engine configuration
 */
export interface ExecutionEngineConfig {
  /** Maximum concurrent experts */
  maxConcurrentExperts: number;

  /** Global timeout for all experts (ms) */
  globalTimeout: number;

  /** Whether to continue if some experts fail */
  continueOnFailure: boolean;

  /** Minimum experts required for valid result */
  minExpertsRequired: number;

  /** Enable detailed tracing */
  enableTracing: boolean;
}

/**
 * Default engine configuration
 */
export const DEFAULT_ENGINE_CONFIG: ExecutionEngineConfig = {
  maxConcurrentExperts: 10,
  globalTimeout: 300000, // 5 minutes
  continueOnFailure: true,
  minExpertsRequired: 1,
  enableTracing: true,
};

/**
 * Expert executor function type
 */
export type ExpertExecutor = (
  task: ExpertTask,
  config: ExpertConfig
) => Promise<{ output: unknown; score: number; confidence: number; iterations: number }>;

/**
 * Multi-Expert Execution Engine
 */
export class ExecutionEngine {
  private config: ExecutionEngineConfig;
  private executor: ExpertExecutor;
  private activeExecutions: Map<string, Promise<ExpertResult>>;

  constructor(executor: ExpertExecutor, config: Partial<ExecutionEngineConfig> = {}) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this.executor = executor;
    this.activeExecutions = new Map();
  }

  /**
   * Execute task with multiple experts in parallel
   */
  async executeWithExperts(
    task: ExpertTask,
    expertConfigs: ExpertConfig[]
  ): Promise<MultiExpertResult> {
    const startTime = Date.now();

    // Limit concurrent experts
    const experts = expertConfigs.slice(0, this.config.maxConcurrentExperts);

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Global timeout exceeded')), this.config.globalTimeout);
    });

    // Execute all experts in parallel
    const executionPromises = experts.map((expert) => this.executeExpert(task, expert));

    // Wait for all with timeout
    let results: ExpertResult[];
    try {
      results = (await Promise.race([
        Promise.all(executionPromises),
        timeoutPromise,
      ])) as ExpertResult[];
    } catch (error) {
      // On global timeout, collect partial results
      results = await this.collectPartialResults(executionPromises);
    }

    // Calculate summary
    const successfulResults = results.filter((r) => r.success);
    const summary = this.calculateSummary(successfulResults);

    // Find best result
    const bestResult =
      successfulResults.length > 0
        ? successfulResults.reduce((best, current) => (current.score > best.score ? current : best))
        : undefined;

    return {
      taskId: task.id,
      results,
      successCount: successfulResults.length,
      failureCount: results.length - successfulResults.length,
      totalDurationMs: Date.now() - startTime,
      bestResult,
      summary,
    };
  }

  /**
   * Execute task with a single expert
   */
  private async executeExpert(task: ExpertTask, expertConfig: ExpertConfig): Promise<ExpertResult> {
    const startTime = Date.now();
    const trace: ExecutionTrace = {
      startedAt: new Date().toISOString(),
      endedAt: '',
      iterations: [],
      totalRetries: 0,
      timeoutErrors: 0,
    };

    try {
      // Create timeout for this expert
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Expert timeout')), expertConfig.totalTimeout);
      });

      // Execute with timeout
      const executionPromise = this.runExpertWithRetries(task, expertConfig, trace);
      const result = await Promise.race([executionPromise, timeoutPromise]);

      trace.endedAt = new Date().toISOString();

      return {
        expertId: expertConfig.id,
        expertConfig,
        taskId: task.id,
        success: true,
        output: result.output,
        confidence: result.confidence,
        score: result.score,
        iterations: result.iterations,
        durationMs: Date.now() - startTime,
        trace: this.config.enableTracing ? trace : undefined,
      };
    } catch (error) {
      trace.endedAt = new Date().toISOString();

      return {
        expertId: expertConfig.id,
        expertConfig,
        taskId: task.id,
        success: false,
        output: null,
        confidence: 0,
        score: 0,
        iterations: trace.iterations.length,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        trace: this.config.enableTracing ? trace : undefined,
      };
    }
  }

  /**
   * Run expert with retry logic
   */
  private async runExpertWithRetries(
    task: ExpertTask,
    config: ExpertConfig,
    trace: ExecutionTrace
  ): Promise<{ output: unknown; score: number; confidence: number; iterations: number }> {
    let lastError: Error | null = null;
    let iteration = 0;
    let bestResult: { output: unknown; score: number; confidence: number } | null = null;

    while (iteration < config.maxIterations) {
      iteration++;
      const iterStartTime = Date.now();

      for (let retry = 0; retry < config.retriesPerIteration; retry++) {
        try {
          const result = await this.executor(task, config);

          // Track iteration
          trace.iterations.push({
            iteration,
            score: result.score,
            confidence: result.confidence,
            durationMs: Date.now() - iterStartTime,
          });

          // Check if satisfied
          if (
            result.score >= config.satisfactionThreshold * 100 &&
            result.confidence >= config.confidenceThreshold
          ) {
            return { ...result, iterations: iteration };
          }

          // Track best so far
          if (!bestResult || result.score > bestResult.score) {
            bestResult = result;
          }

          // Continue to next iteration
          break;
        } catch (error) {
          trace.totalRetries++;
          lastError = error instanceof Error ? error : new Error('Unknown error');

          if (error instanceof Error && error.message.includes('timeout')) {
            trace.timeoutErrors++;
            if (trace.timeoutErrors >= config.maxTimeoutErrors) {
              throw new Error('Max timeout errors exceeded');
            }
          }
        }
      }

      // Check minimum iterations
      if (iteration >= config.minIterations && bestResult) {
        if (config.returnBestResult) {
          return { ...bestResult, iterations: iteration };
        }
      }
    }

    // Return best result if allowed
    if (config.returnBestResult && bestResult) {
      return { ...bestResult, iterations: iteration };
    }

    throw lastError || new Error('Max iterations exceeded without satisfactory result');
  }

  /**
   * Collect partial results from timed-out execution
   */
  private async collectPartialResults(promises: Promise<ExpertResult>[]): Promise<ExpertResult[]> {
    const results: ExpertResult[] = [];

    for (const promise of promises) {
      try {
        // Give a short grace period
        const result = await Promise.race([
          promise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
        ]);
        if (result) results.push(result);
      } catch {
        // Ignore failures during collection
      }
    }

    return results;
  }

  /**
   * Calculate execution summary statistics
   */
  private calculateSummary(results: ExpertResult[]): ExecutionSummary {
    if (results.length === 0) {
      return {
        avgScore: 0,
        avgConfidence: 0,
        avgIterations: 0,
        scoreStdDev: 0,
        agreementLevel: 0,
      };
    }

    const scores = results.map((r) => r.score);
    const confidences = results.map((r) => r.confidence);
    const iterations = results.map((r) => r.iterations);

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const avgIterations = iterations.reduce((a, b) => a + b, 0) / iterations.length;

    // Calculate standard deviation
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
    const scoreStdDev = Math.sqrt(variance);

    // Agreement level: inverse of normalized std dev (0 = no agreement, 1 = full agreement)
    const maxPossibleStdDev = 50; // Assuming 0-100 score range
    const agreementLevel = Math.max(0, 1 - scoreStdDev / maxPossibleStdDev);

    return {
      avgScore,
      avgConfidence,
      avgIterations,
      scoreStdDev,
      agreementLevel,
    };
  }

  /**
   * Create a pool of diverse experts and execute
   */
  async executeWithDiverseExperts(
    task: ExpertTask,
    archetypes: ExpertArchetype[] = ['performance', 'safety', 'simplicity'],
    baseSeed?: number
  ): Promise<MultiExpertResult> {
    const experts = archetypes.map((archetype, index) =>
      createExpertConfig(`${task.id}-expert-${index}`, `${archetype} Expert`, archetype, {
        seed: baseSeed !== undefined ? baseSeed + index : undefined,
      })
    );

    return this.executeWithExperts(task, experts);
  }
}

/**
 * Create a mock executor for testing ONLY
 *
 * WARNING: This is NOT for production use!
 * For real execution, use ClaudeExecutor from ./claude-executor.ts
 *
 * Example:
 *   import { createClaudeExecutor } from './claude-executor';
 *   const { executor } = createClaudeExecutor({ apiKey: process.env.ANTHROPIC_API_KEY });
 *   const engine = new ExecutionEngine(executor);
 */
export function createMockExecutor(): ExpertExecutor {
  return async (task: ExpertTask, config: ExpertConfig) => {
    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

    // Generate result based on config
    const baseScore = 50 + Math.random() * 40;
    const temperatureBonus = (1 - config.temperature) * 10; // Lower temp = more consistent
    const score = Math.min(100, baseScore + temperatureBonus);
    const confidence = 0.6 + Math.random() * 0.3;

    return {
      output: `Solution for ${task.description} using ${config.archetype} approach`,
      score,
      confidence,
      iterations: Math.ceil(Math.random() * config.maxIterations),
    };
  };
}

// Export for module index
export { createExpertConfig, ExpertArchetype } from './expert-config';
