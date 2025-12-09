/**
 * Feedback Loop System
 *
 * Integrates iterative refinement with multi-expert execution.
 * Provides structured feedback collection, processing, and application.
 *
 * Inspired by Poetiq's multi-iteration refinement with feedback.
 *
 * @module multi-expert/feedback-loop
 */

import { ExpertResult, ExpertTask } from './execution-engine';
import { SoftScore, SoftScorer } from './soft-scorer';

/**
 * Feedback item from evaluation
 */
export interface FeedbackItem {
  /** Unique feedback ID */
  id: string;

  /** Source of feedback */
  source: FeedbackSource;

  /** Feedback type */
  type: FeedbackType;

  /** Severity level */
  severity: FeedbackSeverity;

  /** Feedback message */
  message: string;

  /** Affected component */
  target?: string;

  /** Suggested improvement */
  suggestion?: string;

  /** Confidence in feedback */
  confidence: number;

  /** When feedback was generated */
  timestamp: string;
}

/**
 * Source of feedback
 */
export type FeedbackSource =
  | 'validator'      // Automated validation
  | 'scorer'         // Soft scorer
  | 'expert'         // Another expert
  | 'oracle'         // Ground truth comparison
  | 'user'           // Human feedback
  | 'self';          // Self-assessment

/**
 * Type of feedback
 */
export type FeedbackType =
  | 'correctness'    // Correctness issues
  | 'completeness'   // Missing elements
  | 'quality'        // Quality improvements
  | 'efficiency'     // Performance issues
  | 'style'          // Style/formatting
  | 'general';       // General feedback

/**
 * Severity of feedback
 */
export type FeedbackSeverity =
  | 'critical'       // Must fix
  | 'major'          // Should fix
  | 'minor'          // Nice to fix
  | 'suggestion';    // Optional improvement

/**
 * Feedback collection for a result
 */
export interface FeedbackCollection {
  /** Result this feedback is for */
  resultId: string;

  /** Expert that produced the result */
  expertId: string;

  /** All feedback items */
  items: FeedbackItem[];

  /** Overall feedback score */
  overallScore: number;

  /** Number of critical issues */
  criticalCount: number;

  /** Number of major issues */
  majorCount: number;

  /** Summary of feedback */
  summary: string;

  /** When collection was created */
  timestamp: string;
}

/**
 * Feedback loop iteration result
 */
export interface IterationResult {
  /** Iteration number */
  iteration: number;

  /** Expert result for this iteration */
  result: ExpertResult;

  /** Soft score for this iteration */
  score: SoftScore;

  /** Feedback received */
  feedback: FeedbackCollection;

  /** Whether iteration improved */
  improved: boolean;

  /** Improvement delta */
  delta: number;

  /** Whether target was reached */
  targetReached: boolean;
}

/**
 * Feedback loop configuration
 */
export interface FeedbackLoopConfig {
  /** Maximum iterations */
  maxIterations: number;

  /** Target score to achieve */
  targetScore: number;

  /** Minimum improvement to continue */
  minImprovement: number;

  /** Stop on critical feedback */
  stopOnCritical: boolean;

  /** Include self-assessment */
  enableSelfAssessment: boolean;

  /** Feedback providers to use */
  feedbackProviders: FeedbackSource[];
}

/**
 * Default feedback loop configuration
 */
export const DEFAULT_FEEDBACK_LOOP_CONFIG: FeedbackLoopConfig = {
  maxIterations: 5,
  targetScore: 85,
  minImprovement: 2,
  stopOnCritical: false,
  enableSelfAssessment: true,
  feedbackProviders: ['validator', 'scorer', 'self'],
};

/**
 * Feedback provider interface
 */
export interface FeedbackProvider {
  /** Provider identifier */
  id: string;

  /** Provider source type */
  source: FeedbackSource;

  /** Generate feedback for a result */
  generateFeedback(result: ExpertResult, context?: unknown): Promise<FeedbackItem[]>;
}

/**
 * Feedback Loop Manager
 */
export class FeedbackLoop {
  private config: FeedbackLoopConfig;
  private providers: Map<string, FeedbackProvider>;
  private scorer: SoftScorer;
  private history: IterationResult[];

  constructor(config: Partial<FeedbackLoopConfig> = {}) {
    this.config = { ...DEFAULT_FEEDBACK_LOOP_CONFIG, ...config };
    this.providers = new Map();
    this.scorer = new SoftScorer();
    this.history = [];

    // Register default providers
    this.registerDefaultProviders();
  }

  /**
   * Register a feedback provider
   */
  registerProvider(provider: FeedbackProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Run feedback loop for a task
   */
  async runLoop(
    task: ExpertTask,
    executor: (task: ExpertTask, feedback?: FeedbackItem[]) => Promise<ExpertResult>
  ): Promise<IterationResult[]> {
    this.history = [];
    let previousScore = 0;
    let currentFeedback: FeedbackItem[] = [];

    for (let iteration = 1; iteration <= this.config.maxIterations; iteration++) {
      // Execute with current feedback
      const result = await executor(task, currentFeedback);

      // Score the result
      const score = this.scorer.score(result);

      // Collect feedback
      const feedback = await this.collectFeedback(result);

      // Calculate improvement
      const delta = score.overall - previousScore;
      const improved = delta > 0;
      const targetReached = score.overall >= this.config.targetScore;

      // Record iteration
      const iterationResult: IterationResult = {
        iteration,
        result,
        score,
        feedback,
        improved,
        delta,
        targetReached,
      };

      this.history.push(iterationResult);

      // Check stopping conditions
      if (targetReached) {
        break;
      }

      if (this.config.stopOnCritical && feedback.criticalCount > 0) {
        break;
      }

      if (iteration > 1 && delta < this.config.minImprovement && !improved) {
        break;
      }

      // Prepare for next iteration
      previousScore = score.overall;
      currentFeedback = feedback.items;
    }

    return this.history;
  }

  /**
   * Collect feedback from all providers
   */
  async collectFeedback(result: ExpertResult): Promise<FeedbackCollection> {
    const items: FeedbackItem[] = [];

    for (const source of this.config.feedbackProviders) {
      const provider = Array.from(this.providers.values()).find(
        (p) => p.source === source
      );

      if (provider) {
        try {
          const feedback = await provider.generateFeedback(result);
          items.push(...feedback);
        } catch (error) {
          // Log but don't fail on provider errors
          console.warn(`Feedback provider ${provider.id} failed:`, error);
        }
      }
    }

    // Calculate counts
    const criticalCount = items.filter((f) => f.severity === 'critical').length;
    const majorCount = items.filter((f) => f.severity === 'major').length;

    // Calculate overall score (inverse of issue severity)
    const severityScore =
      100 -
      criticalCount * 25 -
      majorCount * 10 -
      items.filter((f) => f.severity === 'minor').length * 3;

    return {
      resultId: `${result.taskId}-${result.expertId}`,
      expertId: result.expertId,
      items,
      overallScore: Math.max(0, severityScore),
      criticalCount,
      majorCount,
      summary: this.generateSummary(items),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate feedback summary
   */
  private generateSummary(items: FeedbackItem[]): string {
    if (items.length === 0) {
      return 'No issues found.';
    }

    const critical = items.filter((f) => f.severity === 'critical').length;
    const major = items.filter((f) => f.severity === 'major').length;
    const minor = items.filter((f) => f.severity === 'minor').length;
    const suggestions = items.filter((f) => f.severity === 'suggestion').length;

    const parts: string[] = [];
    if (critical > 0) parts.push(`${critical} critical`);
    if (major > 0) parts.push(`${major} major`);
    if (minor > 0) parts.push(`${minor} minor`);
    if (suggestions > 0) parts.push(`${suggestions} suggestions`);

    return `Found ${items.length} issues: ${parts.join(', ')}.`;
  }

  /**
   * Get best iteration from history
   */
  getBestIteration(): IterationResult | undefined {
    if (this.history.length === 0) return undefined;

    return this.history.reduce((best, current) =>
      current.score.overall > best.score.overall ? current : best
    );
  }

  /**
   * Get improvement trajectory
   */
  getTrajectory(): { iteration: number; score: number; delta: number }[] {
    return this.history.map((h) => ({
      iteration: h.iteration,
      score: h.score.overall,
      delta: h.delta,
    }));
  }

  /**
   * Check if loop converged
   */
  isConverged(): boolean {
    if (this.history.length < 2) return false;

    const last = this.history[this.history.length - 1];
    const secondLast = this.history[this.history.length - 2];

    return Math.abs(last.score.overall - secondLast.score.overall) < this.config.minImprovement;
  }

  /**
   * Register default feedback providers
   */
  private registerDefaultProviders(): void {
    // Scorer-based feedback
    this.registerProvider({
      id: 'soft-scorer',
      source: 'scorer',
      generateFeedback: async (result) => {
        const items: FeedbackItem[] = [];
        const score = this.scorer.score(result);

        // Generate feedback based on score components
        if (score.correctness < 60) {
          items.push(this.createFeedback(
            'scorer',
            'correctness',
            'major',
            `Correctness score is low (${score.correctness}). Review solution logic.`
          ));
        }

        if (score.efficiency < 50) {
          items.push(this.createFeedback(
            'scorer',
            'efficiency',
            'minor',
            `Efficiency score is low (${score.efficiency}). Consider optimization.`
          ));
        }

        // Check penalties
        for (const penalty of score.breakdown.penalties) {
          items.push(this.createFeedback(
            'scorer',
            'general',
            'minor',
            `Penalty: ${penalty.reason}`,
            penalty.name
          ));
        }

        return items;
      },
    });

    // Self-assessment feedback
    if (this.config.enableSelfAssessment) {
      this.registerProvider({
        id: 'self-assessment',
        source: 'self',
        generateFeedback: async (result) => {
          const items: FeedbackItem[] = [];

          // Low confidence self-assessment
          if (result.confidence < 0.7) {
            items.push(this.createFeedback(
              'self',
              'quality',
              'minor',
              `Expert expressed low confidence (${Math.round(result.confidence * 100)}%).`,
              undefined,
              'Consider alternative approaches.'
            ));
          }

          // Max iterations self-assessment
          if (result.iterations >= result.expertConfig.maxIterations) {
            items.push(this.createFeedback(
              'self',
              'completeness',
              'minor',
              'Maximum iterations reached without full satisfaction.',
              undefined,
              'Problem may require different approach.'
            ));
          }

          return items;
        },
      });
    }

    // Validator feedback (stub - can be extended)
    this.registerProvider({
      id: 'basic-validator',
      source: 'validator',
      generateFeedback: async (result) => {
        const items: FeedbackItem[] = [];

        // Check for failed execution
        if (!result.success) {
          items.push(this.createFeedback(
            'validator',
            'correctness',
            'critical',
            `Execution failed: ${result.error || 'Unknown error'}`,
            undefined,
            'Fix execution error before proceeding.'
          ));
        }

        // Check for empty output
        if (result.success && !result.output) {
          items.push(this.createFeedback(
            'validator',
            'completeness',
            'major',
            'Execution succeeded but produced no output.',
            undefined,
            'Verify solution generates proper output.'
          ));
        }

        return items;
      },
    });
  }

  /**
   * Create a feedback item
   */
  private createFeedback(
    source: FeedbackSource,
    type: FeedbackType,
    severity: FeedbackSeverity,
    message: string,
    target?: string,
    suggestion?: string
  ): FeedbackItem {
    return {
      id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source,
      type,
      severity,
      message,
      target,
      suggestion,
      confidence: 0.8,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Create feedback loop with custom target
 */
export function createFeedbackLoop(targetScore: number = 85): FeedbackLoop {
  return new FeedbackLoop({ targetScore });
}

/**
 * Quick feedback collection
 */
export async function collectFeedback(result: ExpertResult): Promise<FeedbackCollection> {
  const loop = new FeedbackLoop();
  return loop.collectFeedback(result);
}
