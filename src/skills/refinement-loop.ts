/**
 * Core Refinement Loop Module
 *
 * Based on Poetiq's approach: Generate -> Evaluate -> Refine until confident.
 *
 * This is the CENTRAL mechanism for iterative improvement that ANY skill can use.
 * Features:
 * - Self-auditing: Automatically determines when to stop
 * - Process traces: Records every step for learning
 * - Cost awareness: Respects budget constraints
 * - Confidence tracking: Stops when confident enough
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Configuration for the refinement loop
 */
export interface RefinementConfig {
  /** Maximum number of refinement iterations */
  maxIterations: number;

  /** Confidence threshold (0-1). Loop stops when this is reached */
  confidenceThreshold: number;

  /** Optional cost budget limit in tokens or API calls */
  costBudget?: number;

  /** Whether to track detailed per-step feedback (process supervision) */
  processSupervision: boolean;

  /** Optional timeout in milliseconds */
  timeout?: number;

  /** Minimum improvement delta required to continue (0-1) */
  minImprovementDelta?: number;
}

/**
 * Feedback from an evaluation
 */
export interface Feedback {
  /** Description of what needs improvement */
  issue: string;

  /** Severity: critical, major, minor */
  severity: 'critical' | 'major' | 'minor';

  /** Specific suggestion for improvement */
  suggestion?: string;

  /** Which aspect of the candidate this relates to */
  aspect?: string;
}

/**
 * Result from evaluating a candidate
 */
export interface EvaluationResult {
  /** Confidence score (0-1) */
  score: number;

  /** Feedback items for refinement */
  feedback: Feedback[];

  /** Whether the candidate passes minimum quality bar */
  acceptable: boolean;

  /** Optional reasoning for the evaluation */
  reasoning?: string;

  /** Estimated cost of this evaluation */
  cost?: number;
}

/**
 * A single step in the process trace
 */
export interface ProcessStep {
  /** Action taken in this step */
  action: string;

  /** Result of the action */
  result: unknown;

  /** Score for this step (0-1) */
  score: number;

  /** Reasoning for this step */
  reasoning: string;

  /** Timestamp when step occurred */
  timestamp: string;

  /** Cost incurred by this step */
  cost?: number;
}

/**
 * State of the refinement process
 */
export interface RefinementState<T> {
  /** Current iteration number */
  iteration: number;

  /** Current candidate solution */
  candidate: T;

  /** Accumulated feedback from all iterations */
  feedback: Feedback[];

  /** Current confidence score (0-1) */
  confidence: number;

  /** Total cost incurred so far */
  cost: number;

  /** Process trace if processSupervision is enabled */
  processTrace: ProcessStep[];

  /** Timestamp when state was last updated */
  lastUpdated: string;

  /** History of confidence scores over iterations */
  confidenceHistory: number[];
}

/**
 * Final result from the refinement loop
 */
export interface RefinementResult<T> {
  /** Final refined candidate */
  candidate: T;

  /** Final confidence score */
  confidence: number;

  /** Total iterations performed */
  iterations: number;

  /** Total cost incurred */
  totalCost: number;

  /** Whether we reached the confidence threshold */
  converged: boolean;

  /** Reason for stopping */
  stopReason: 'confidence' | 'maxIterations' | 'budget' | 'timeout' | 'noImprovement' | 'error';

  /** Process trace (if enabled) */
  processTrace?: ProcessStep[];

  /** Final feedback items (if any remain) */
  remainingFeedback: Feedback[];

  /** History of confidence over iterations */
  confidenceHistory: number[];

  /** Duration in milliseconds */
  durationMs: number;
}

// ============================================================================
// REFINEMENT LOOP CLASS
// ============================================================================

/**
 * Core refinement loop implementation
 *
 * Usage:
 * ```typescript
 * const loop = new RefinementLoop({
 *   maxIterations: 5,
 *   confidenceThreshold: 0.9,
 *   processSupervision: true
 * });
 *
 * const result = await loop.run(
 *   async () => generateSolution(),
 *   async (candidate) => evaluateSolution(candidate),
 *   async (candidate, feedback) => refineSolution(candidate, feedback)
 * );
 * ```
 */
export class RefinementLoop<T> {
  private config: Required<RefinementConfig>;
  private state: RefinementState<T> | null = null;
  private startTime: number = 0;

  constructor(config: RefinementConfig) {
    // Fill in defaults
    this.config = {
      maxIterations: config.maxIterations,
      confidenceThreshold: config.confidenceThreshold,
      costBudget: config.costBudget ?? Infinity,
      processSupervision: config.processSupervision,
      timeout: config.timeout ?? Infinity,
      minImprovementDelta: config.minImprovementDelta ?? 0.01,
    };
  }

  /**
   * Main refinement loop
   *
   * @param generate - Function to generate initial candidate
   * @param evaluate - Function to evaluate a candidate
   * @param refine - Function to refine a candidate based on feedback
   * @returns Final refinement result
   */
  async run(
    generate: () => Promise<T>,
    evaluate: (candidate: T) => Promise<EvaluationResult>,
    refine: (candidate: T, feedback: Feedback) => Promise<T>
  ): Promise<RefinementResult<T>> {
    this.startTime = Date.now();

    try {
      // Step 1: Generate initial candidate
      const initialCandidate = await this.executeWithTimeout(generate(), 'generate-initial');

      this.recordStep({
        action: 'generate-initial',
        result: initialCandidate,
        score: 0,
        reasoning: 'Generated initial candidate',
        timestamp: new Date().toISOString(),
      });

      // Step 2: Evaluate initial candidate
      const initialEval = await this.executeWithTimeout(
        evaluate(initialCandidate),
        'evaluate-initial'
      );

      // Initialize state
      this.state = {
        iteration: 0,
        candidate: initialCandidate,
        feedback: initialEval.feedback,
        confidence: initialEval.score,
        cost: initialEval.cost ?? 0,
        processTrace: [],
        lastUpdated: new Date().toISOString(),
        confidenceHistory: [initialEval.score],
      };

      this.recordStep({
        action: 'evaluate-initial',
        result: initialEval,
        score: initialEval.score,
        reasoning: initialEval.reasoning ?? 'Initial evaluation',
        timestamp: new Date().toISOString(),
        cost: initialEval.cost,
      });

      // Step 3: Refinement loop
      while (this.shouldContinue(this.state)) {
        this.state.iteration++;

        // Refine based on feedback
        const refinedCandidate = await this.executeWithTimeout(
          refine(
            this.state.candidate,
            this.state.feedback[0] ?? {
              issue: 'General improvement needed',
              severity: 'minor',
            }
          ),
          `refine-iteration-${this.state.iteration}`
        );

        this.recordStep({
          action: `refine-iteration-${this.state.iteration}`,
          result: refinedCandidate,
          score: 0,
          reasoning: `Refined candidate based on ${this.state.feedback.length} feedback items`,
          timestamp: new Date().toISOString(),
        });

        // Evaluate refined candidate
        const refinedEval = await this.executeWithTimeout(
          evaluate(refinedCandidate),
          `evaluate-iteration-${this.state.iteration}`
        );

        this.recordStep({
          action: `evaluate-iteration-${this.state.iteration}`,
          result: refinedEval,
          score: refinedEval.score,
          reasoning: refinedEval.reasoning ?? 'Evaluation of refined candidate',
          timestamp: new Date().toISOString(),
          cost: refinedEval.cost,
        });

        // Update state
        const previousConfidence = this.state.confidence;
        this.state.candidate = refinedCandidate;
        this.state.feedback = refinedEval.feedback;
        this.state.confidence = refinedEval.score;
        this.state.cost += refinedEval.cost ?? 0;
        this.state.lastUpdated = new Date().toISOString();
        this.state.confidenceHistory.push(refinedEval.score);

        // Check for improvement
        const improvement = refinedEval.score - previousConfidence;
        if (improvement < this.config.minImprovementDelta && this.state.iteration > 1) {
          // No significant improvement
          return this.buildResult('noImprovement');
        }
      }

      // Determine stop reason
      let stopReason: RefinementResult<T>['stopReason'] = 'maxIterations';
      if (this.state.confidence >= this.config.confidenceThreshold) {
        stopReason = 'confidence';
      } else if (this.state.cost >= this.config.costBudget) {
        stopReason = 'budget';
      }

      return this.buildResult(stopReason);
    } catch (error) {
      if (error instanceof TimeoutError) {
        return this.buildResult('timeout');
      }
      throw error;
    }
  }

  /**
   * Determine if refinement should continue
   *
   * Self-auditing logic:
   * - Stop if confidence threshold reached
   * - Stop if max iterations reached
   * - Stop if cost budget exceeded
   * - Stop if timeout exceeded
   */
  shouldContinue(state: RefinementState<T>): boolean {
    // Check confidence threshold
    if (state.confidence >= this.config.confidenceThreshold) {
      return false;
    }

    // Check max iterations
    if (state.iteration >= this.config.maxIterations) {
      return false;
    }

    // Check cost budget
    if (state.cost >= this.config.costBudget) {
      return false;
    }

    // Check timeout
    if (Date.now() - this.startTime >= this.config.timeout) {
      return false;
    }

    return true;
  }

  /**
   * Record a process step (if process supervision is enabled)
   */
  recordStep(step: ProcessStep): void {
    if (this.config.processSupervision && this.state) {
      this.state.processTrace.push(step);
    }
  }

  /**
   * Get the full process trace
   */
  getProcessTrace(): ProcessStep[] {
    return this.state?.processTrace ?? [];
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): number {
    return this.config.costBudget - (this.state?.cost ?? 0);
  }

  /**
   * Estimate cost to complete (simple linear projection)
   */
  estimateCostToComplete(): number {
    if (!this.state || this.state.iteration === 0) {
      return this.config.costBudget;
    }

    const avgCostPerIteration = this.state.cost / this.state.iteration;
    const remainingIterations = Math.min(
      this.config.maxIterations - this.state.iteration,
      this.estimateIterationsToConvergence()
    );

    return avgCostPerIteration * remainingIterations;
  }

  /**
   * Estimate iterations needed to reach confidence threshold
   * (Based on current improvement rate)
   */
  private estimateIterationsToConvergence(): number {
    if (!this.state || this.state.confidenceHistory.length < 2) {
      return this.config.maxIterations;
    }

    // Calculate average improvement per iteration
    const history = this.state.confidenceHistory;
    const totalImprovement = history[history.length - 1] - history[0];
    const avgImprovement = totalImprovement / (history.length - 1);

    if (avgImprovement <= 0) {
      return Infinity;
    }

    const remainingConfidence = this.config.confidenceThreshold - this.state.confidence;
    return Math.ceil(remainingConfidence / avgImprovement);
  }

  /**
   * Execute a promise with timeout
   */
  private async executeWithTimeout<R>(promise: Promise<R>, stepName: string): Promise<R> {
    const remainingTime = this.config.timeout - (Date.now() - this.startTime);

    if (remainingTime <= 0) {
      throw new TimeoutError(`Timeout before step: ${stepName}`);
    }

    return Promise.race([
      promise,
      new Promise<R>((_, reject) =>
        setTimeout(
          () => reject(new TimeoutError(`Timeout during step: ${stepName}`)),
          remainingTime
        )
      ),
    ]);
  }

  /**
   * Build final result
   */
  private buildResult(stopReason: RefinementResult<T>['stopReason']): RefinementResult<T> {
    if (!this.state) {
      throw new Error('Cannot build result: no state initialized');
    }

    const durationMs = Date.now() - this.startTime;

    return {
      candidate: this.state.candidate,
      confidence: this.state.confidence,
      iterations: this.state.iteration,
      totalCost: this.state.cost,
      converged: this.state.confidence >= this.config.confidenceThreshold,
      stopReason,
      processTrace: this.config.processSupervision ? this.state.processTrace : undefined,
      remainingFeedback: this.state.feedback,
      confidenceHistory: this.state.confidenceHistory,
      durationMs,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simplified helper for common refinement pattern
 *
 * Usage:
 * ```typescript
 * const result = await withRefinement(
 *   async () => generateCode(),
 *   async (code) => scoreCode(code),
 *   { maxIterations: 3, confidenceThreshold: 0.85 }
 * );
 * ```
 */
export async function withRefinement<T>(
  task: () => Promise<T>,
  evaluator: (result: T) => Promise<number>,
  config?: Partial<RefinementConfig>
): Promise<T> {
  const defaultConfig: RefinementConfig = {
    maxIterations: 3,
    confidenceThreshold: 0.8,
    processSupervision: false,
    ...config,
  };

  const loop = new RefinementLoop<T>(defaultConfig);

  // Convert simple evaluator (returns number) to full evaluation
  const evaluate = async (candidate: T): Promise<EvaluationResult> => {
    const score = await evaluator(candidate);
    return {
      score,
      feedback:
        score < defaultConfig.confidenceThreshold
          ? [{ issue: 'Quality below threshold', severity: 'major' }]
          : [],
      acceptable: score >= defaultConfig.confidenceThreshold,
      reasoning: `Score: ${score.toFixed(2)}`,
    };
  };

  // Simple refine: just regenerate (override this for smarter refinement)
  const refine = async (_candidate: T, _feedback: Feedback): Promise<T> => {
    return task();
  };

  const result = await loop.run(task, evaluate, refine);
  return result.candidate;
}

/**
 * Create a refinement loop with custom configuration
 */
export function createRefinementLoop<T>(config: RefinementConfig): RefinementLoop<T> {
  return new RefinementLoop<T>(config);
}

/**
 * Create feedback item
 */
export function createFeedback(
  issue: string,
  severity: 'critical' | 'major' | 'minor' = 'major',
  suggestion?: string,
  aspect?: string
): Feedback {
  return { issue, severity, suggestion, aspect };
}

/**
 * Create evaluation result
 */
export function createEvaluation(
  score: number,
  feedback: Feedback[] = [],
  reasoning?: string,
  cost?: number
): EvaluationResult {
  return {
    score,
    feedback,
    acceptable: score >= 0.7, // Default threshold
    reasoning,
    cost,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Custom timeout error
 */
class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Format refinement result as a human-readable summary
 */
export function formatRefinementResult<T>(result: RefinementResult<T>): string {
  const lines = [
    '=== Refinement Result ===',
    `Iterations: ${result.iterations}`,
    `Final Confidence: ${(result.confidence * 100).toFixed(1)}%`,
    `Converged: ${result.converged ? 'Yes' : 'No'}`,
    `Stop Reason: ${result.stopReason}`,
    `Duration: ${result.durationMs}ms`,
    `Total Cost: ${result.totalCost}`,
    '',
  ];

  if (result.confidenceHistory.length > 0) {
    lines.push('Confidence History:');
    result.confidenceHistory.forEach((conf, i) => {
      lines.push(`  Iteration ${i}: ${(conf * 100).toFixed(1)}%`);
    });
    lines.push('');
  }

  if (result.remainingFeedback.length > 0) {
    lines.push('Remaining Issues:');
    result.remainingFeedback.forEach((fb) => {
      lines.push(`  [${fb.severity.toUpperCase()}] ${fb.issue}`);
      if (fb.suggestion) {
        lines.push(`    → ${fb.suggestion}`);
      }
    });
    lines.push('');
  }

  if (result.processTrace && result.processTrace.length > 0) {
    lines.push('Process Trace:');
    result.processTrace.forEach((step) => {
      lines.push(`  ${step.action}: ${step.reasoning} (score: ${step.score})`);
    });
  }

  return lines.join('\n');
}

/**
 * Default export for convenience
 */
export default {
  RefinementLoop,
  withRefinement,
  createRefinementLoop,
  createFeedback,
  createEvaluation,
  formatRefinementResult,
};
