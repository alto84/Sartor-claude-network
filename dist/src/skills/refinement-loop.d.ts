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
export declare class RefinementLoop<T> {
    private config;
    private state;
    private startTime;
    constructor(config: RefinementConfig);
    /**
     * Main refinement loop
     *
     * @param generate - Function to generate initial candidate
     * @param evaluate - Function to evaluate a candidate
     * @param refine - Function to refine a candidate based on feedback
     * @returns Final refinement result
     */
    run(generate: () => Promise<T>, evaluate: (candidate: T) => Promise<EvaluationResult>, refine: (candidate: T, feedback: Feedback) => Promise<T>): Promise<RefinementResult<T>>;
    /**
     * Determine if refinement should continue
     *
     * Self-auditing logic:
     * - Stop if confidence threshold reached
     * - Stop if max iterations reached
     * - Stop if cost budget exceeded
     * - Stop if timeout exceeded
     */
    shouldContinue(state: RefinementState<T>): boolean;
    /**
     * Record a process step (if process supervision is enabled)
     */
    recordStep(step: ProcessStep): void;
    /**
     * Get the full process trace
     */
    getProcessTrace(): ProcessStep[];
    /**
     * Get remaining budget
     */
    getRemainingBudget(): number;
    /**
     * Estimate cost to complete (simple linear projection)
     */
    estimateCostToComplete(): number;
    /**
     * Estimate iterations needed to reach confidence threshold
     * (Based on current improvement rate)
     */
    private estimateIterationsToConvergence;
    /**
     * Execute a promise with timeout
     */
    private executeWithTimeout;
    /**
     * Build final result
     */
    private buildResult;
}
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
export declare function withRefinement<T>(task: () => Promise<T>, evaluator: (result: T) => Promise<number>, config?: Partial<RefinementConfig>): Promise<T>;
/**
 * Create a refinement loop with custom configuration
 */
export declare function createRefinementLoop<T>(config: RefinementConfig): RefinementLoop<T>;
/**
 * Create feedback item
 */
export declare function createFeedback(issue: string, severity?: 'critical' | 'major' | 'minor', suggestion?: string, aspect?: string): Feedback;
/**
 * Create evaluation result
 */
export declare function createEvaluation(score: number, feedback?: Feedback[], reasoning?: string, cost?: number): EvaluationResult;
/**
 * Format refinement result as a human-readable summary
 */
export declare function formatRefinementResult<T>(result: RefinementResult<T>): string;
/**
 * Default export for convenience
 */
declare const _default: {
    RefinementLoop: typeof RefinementLoop;
    withRefinement: typeof withRefinement;
    createRefinementLoop: typeof createRefinementLoop;
    createFeedback: typeof createFeedback;
    createEvaluation: typeof createEvaluation;
    formatRefinementResult: typeof formatRefinementResult;
};
export default _default;
//# sourceMappingURL=refinement-loop.d.ts.map