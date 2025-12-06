/**
 * Multi-Agent Orchestration Skill
 *
 * Design coordination strategies for multiple agents that preserve independent
 * reasoning while enabling collaborative problem-solving, without fabricating
 * artificial consensus.
 *
 * Core mechanism: Refinement Loops - iterative improvement through generate-evaluate-refine cycles
 *
 * Based on principles from UPLIFTED_SKILLS.md and EXECUTIVE_CLAUDE.md:
 * - Specialization Over Uniformity
 * - Disagreement Preservation Over Consensus Forcing
 * - Coordination Overhead is Real
 * - Independence Validates Findings
 * - Intent-Based Delegation
 * - Iterative Refinement Over Single-Shot Execution
 */
export interface Candidate {
    id: string;
    output: any;
    confidence: number;
    reasoning?: string;
    metadata?: Record<string, any>;
}
export interface Feedback {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    criticalIssues?: string[];
    confidence: number;
}
export interface RefinementLoop<T = any> {
    maxIterations: number;
    currentIteration: number;
    generate: () => Promise<Candidate>;
    evaluate: (candidate: Candidate) => Promise<Feedback>;
    refine: (candidate: Candidate, feedback: Feedback) => Promise<Candidate>;
    isComplete: (candidate: Candidate, feedback: Feedback) => boolean;
    history: RefinementHistory[];
    costBudget?: number;
    costAccumulated: number;
}
export interface RefinementHistory {
    iteration: number;
    candidate: Candidate;
    feedback: Feedback;
    timestamp: number;
    costIncurred: number;
}
export interface RefinementResult {
    finalCandidate: Candidate;
    finalFeedback: Feedback;
    iterations: number;
    history: RefinementHistory[];
    terminationReason: 'complete' | 'max_iterations' | 'cost_limit' | 'diminishing_returns';
    totalCost: number;
}
export interface SelfAudit {
    isSatisfactory: boolean;
    confidence: number;
    gaps: string[];
    risks: string[];
    shouldRefine: boolean;
    reasoning: string;
}
export interface AuditConfig {
    confidenceThreshold: number;
    satisfactionThreshold: number;
    maxRefinements: number;
    costPerRefinement: number;
}
export interface ProcessStep {
    stepId: string;
    description: string;
    input: any;
    output: any;
    success: boolean;
    confidence: number;
    reasoning: string;
    timestamp: number;
    feedback?: Feedback;
}
export interface ProcessTrace {
    taskId: string;
    steps: ProcessStep[];
    overallSuccess: boolean;
    overallConfidence: number;
    creditAssignment: Map<string, number>;
}
export interface SupervisionConfig {
    trackReasoningChain: boolean;
    provideStepFeedback: boolean;
    identifyKeySteps: boolean;
}
export interface TaskExample {
    input: any;
    expectedOutput?: any;
    approach: string;
    feedback?: string;
}
export interface AdaptationStrategy {
    name: string;
    applicability: (task: Task) => number;
    execute: (task: Task) => Promise<TaskResult>;
    examples: TaskExample[];
}
export interface TestTimeAdapter {
    strategies: AdaptationStrategy[];
    selectStrategy: (task: Task, examples?: TaskExample[]) => AdaptationStrategy;
    learnFromExample: (example: TaskExample) => void;
}
export interface Orchestrator {
    id: string;
    activeWorkers: Map<string, WorkerStatus>;
    taskQueue: Task[];
    completedTasks: TaskResult[];
    messageBus: any;
}
export interface Task {
    id: string;
    type: string;
    intent: string;
    constraints: string[];
    deadline?: number;
    priority: 'low' | 'normal' | 'high' | 'critical';
    dependencies: string[];
    scope?: {
        included: string[];
        excluded: string[];
    };
    successCriteria?: string[];
    context?: string;
}
export interface WorkerStatus {
    id: string;
    specialization: string;
    currentTask?: string;
    status: 'idle' | 'busy' | 'error' | 'offline';
    metrics: WorkerMetrics;
}
export interface WorkerMetrics {
    tasksCompleted: number;
    taskseFailed: number;
    averageCompletionTimeMs: number;
    successRate: number;
    lastActiveAt: number;
}
export interface Worker {
    id: string;
    specialization: string;
    capabilities: string[];
    status: WorkerStatus;
    execute: (task: Task) => Promise<TaskResult>;
}
export interface TaskResult {
    taskId: string;
    workerId: string;
    success: boolean;
    output: any;
    confidence: number;
    reasoning?: string;
    alternativesConsidered?: string[];
    issues?: string[];
    metrics?: {
        startedAt: number;
        completedAt: number;
        durationMs: number;
    };
    error?: string;
}
export interface DelegationResult {
    success: boolean;
    taskId: string;
    assignedWorker?: string;
    queuePosition?: number;
    estimatedStartTime?: number;
    error?: string;
}
export interface WorkerAssignment {
    worker: Worker;
    matchScore: number;
    reasoning: string;
    alternatives: Array<{
        workerId: string;
        score: number;
    }>;
}
export interface SynthesizedOutput {
    results: TaskResult[];
    synthesis: string;
    insights: string[];
    conflicts: Conflict[];
    confidence: number;
    recommendations: string[];
    refinementMetadata?: {
        iterations: number;
        terminationReason: 'complete' | 'max_iterations' | 'cost_limit' | 'diminishing_returns';
        totalCost: number;
        finalScore: number;
    };
}
export interface Conflict {
    type: 'disagreement' | 'contradiction' | 'uncertainty';
    workers: string[];
    description: string;
    resolution?: string;
    preserved: boolean;
}
export interface RecoveryAction {
    action: 'retry' | 'reassign' | 'skip' | 'escalate';
    reasoning: string;
    newAssignment?: string;
    delay?: number;
    feedback?: Feedback;
}
export interface OrchestratorConfig {
    id: string;
    maxConcurrentTasks?: number;
    defaultTimeout?: number;
    messageBusConfig?: any;
}
export declare enum DelegationPattern {
    PARALLEL_FAN_OUT = "parallel-fan-out",// Independent tasks run simultaneously
    SERIAL_CHAIN = "serial-chain",// Dependent tasks in sequence
    RECURSIVE_DECOMPOSITION = "recursive-decomposition",// Break complex into subtasks
    COMPETITIVE_EXPLORATION = "competitive-exploration"
}
export interface DelegationStrategy {
    pattern: DelegationPattern;
    tasks: Task[];
    expectedParallelism: number;
    coordinationOverhead: number;
}
export declare class MultiAgentOrchestrator {
    private orchestrator;
    private workers;
    private config;
    private auditConfig;
    private supervisionConfig;
    private testTimeAdapter;
    private processSupervisor;
    constructor(config: OrchestratorConfig);
    /**
     * Register a worker with the orchestrator
     */
    registerWorker(worker: Worker): void;
    /**
     * Unregister a worker
     */
    unregisterWorker(workerId: string): void;
    /**
     * Delegate a task using intent-based delegation with refinement loop
     *
     * Quality gate: Validate task intent is clear before delegation
     * Core mechanism: Run refinement loop to iteratively improve result
     */
    delegateTask(task: Task): Promise<DelegationResult>;
    /**
     * Assign a task to the best-matching worker
     *
     * Principle: Specialization improves quality
     */
    assignWorker(task: Task, workers: Worker[]): WorkerAssignment | null;
    /**
     * Synthesize results from multiple workers with iterative refinement
     *
     * Principle: Preserve disagreement, don't force consensus
     * Quality gate: Validate results match task intent before synthesis
     * Core mechanism: Use refinement loop to improve synthesis quality
     */
    synthesizeResults(results: TaskResult[]): Promise<SynthesizedOutput>;
    /**
     * Handle worker failure with graceful recovery using refinement with feedback
     *
     * Principle: Coordination overhead is real - measure and handle failures
     * Core mechanism: Use failure feedback to refine approach
     */
    handleWorkerFailure(workerId: string, error: Error, task?: Task): Promise<RecoveryAction>;
    /**
     * Execute a task with a delegation pattern
     */
    executeWithPattern(tasks: Task[], pattern: DelegationPattern): Promise<SynthesizedOutput>;
    /**
     * Get orchestrator status
     */
    getStatus(): {
        orchestratorId: string;
        activeWorkers: number;
        queuedTasks: number;
        completedTasks: number;
        workers: WorkerStatus[];
    };
    /**
     * Get process trace for a task (process supervision)
     */
    getProcessTrace(taskId: string): ProcessTrace | undefined;
    /**
     * Configure audit settings
     */
    configureAudit(config: Partial<AuditConfig>): void;
    /**
     * Configure supervision settings
     */
    configureSupervision(config: Partial<SupervisionConfig>): void;
    /**
     * Learn from task example (test-time adaptation)
     */
    learnFromExample(example: TaskExample): void;
    /**
     * Get available adaptation strategies
     */
    getAdaptationStrategies(): AdaptationStrategy[];
    /**
     * Run a refinement loop to iteratively improve a candidate
     */
    private _runRefinementLoop;
    /**
     * Execute a task with refinement loop
     */
    private _executeTaskWithRefinement;
    /**
     * Create a refinement loop for synthesis
     */
    private _createSynthesisRefinementLoop;
    /**
     * Perform self-audit on a task result
     */
    private _performSelfAudit;
    /**
     * Perform credit assignment to identify key steps
     */
    private _performCreditAssignment;
    /**
     * Create test-time adapter
     */
    private _createTestTimeAdapter;
    /**
     * Detect diminishing returns in refinement loop
     */
    private _detectDiminishingReturns;
    /**
     * Extract deeper insights from results and conflicts
     */
    private _extractDeeperInsights;
    /**
     * Calculate variance of an array of numbers
     */
    private _calculateVariance;
    /**
     * Generate failure recovery suggestions
     */
    private _generateFailureRecoverySuggestions;
    private _validateIntent;
    private _checkDependencies;
    private _checkWorkerCapacity;
    private _calculateWorkerMatchScore;
    private _generateAssignmentReasoning;
    private _identifyConflicts;
    private _extractInsights;
    private _findCommonIssues;
    private _generateSynthesis;
    private _calculateSynthesisConfidence;
    private _generateRecommendations;
    private _findAlternativeWorker;
    private _createDelegationStrategy;
    private _executeTask;
}
/**
 * Create a new orchestrator
 */
export declare function createOrchestrator(config: OrchestratorConfig): MultiAgentOrchestrator;
/**
 * Create a mock worker for testing
 */
export declare function createMockWorker(id: string, specialization: string, capabilities?: string[]): Worker;
/**
 * Create a task with intent-based delegation
 */
export declare function createTask(id: string, type: string, intent: string, options?: Partial<Task>): Task;
declare const _default: {
    createOrchestrator: typeof createOrchestrator;
    createMockWorker: typeof createMockWorker;
    createTask: typeof createTask;
    MultiAgentOrchestrator: typeof MultiAgentOrchestrator;
    DelegationPattern: typeof DelegationPattern;
};
export default _default;
//# sourceMappingURL=multi-agent-orchestration.d.ts.map