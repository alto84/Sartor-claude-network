/**
 * Distributed Systems Debugging Skill
 *
 * Systematically investigates distributed system failures by reconstructing causal chains,
 * isolating failure domains, and testing hypotheses with evidence rather than assumptions.
 *
 * Based on principles from UPLIFTED_SKILLS.md:
 * - Observation Before Hypothesis: Gather evidence first, theorize second
 * - Non-Determinism is Fundamental: Same inputs may yield different outputs
 * - Isolation Reveals Root Cause: Simplify to understand
 * - Failure Injection Validates Understanding: Test your theories
 *
 * @version 1.0.0
 * @date 2025-12-06
 */
export interface SystemObservation {
    timestamp: number;
    component: string;
    type: 'log' | 'metric' | 'trace' | 'event';
    data: unknown;
    source: string;
}
export interface Hypothesis {
    description: string;
    supportingEvidence: SystemObservation[];
    contradictingEvidence: SystemObservation[];
    confidence: number;
    testable: boolean;
    test?: string;
}
export interface DebugReport {
    symptoms: string[];
    observations: SystemObservation[];
    hypotheses: Hypothesis[];
    rootCause?: Hypothesis;
    unknowns: string[];
    recommendations: string[];
}
export interface DataSource {
    id: string;
    type: 'logs' | 'metrics' | 'traces' | 'events';
    component: string;
    fetch: () => Promise<SystemObservation[]>;
}
export interface Test {
    id: string;
    description: string;
    execute: () => Promise<TestResult>;
}
export interface TestResult {
    success: boolean;
    observations: SystemObservation[];
    symptomReproduced: boolean;
    timestamp: number;
    error?: string;
}
export interface RankedHypotheses {
    hypotheses: Hypothesis[];
    ranking: {
        hypothesis: Hypothesis;
        rank: number;
        score: number;
        reasoning: string;
    }[];
}
export interface DebugSession {
    id: string;
    startTime: number;
    endTime?: number;
    symptoms: string[];
    sources: DataSource[];
    observations: SystemObservation[];
    hypotheses: Hypothesis[];
    tests: Map<string, TestResult>;
    isolationSteps: IsolationStep[];
    state: 'active' | 'completed' | 'blocked';
}
export interface IsolationStep {
    description: string;
    variables: string[];
    removed: string[];
    symptomPresent: boolean;
    timestamp: number;
}
export interface FailureInjection {
    id: string;
    description: string;
    targetComponent: string;
    failureType: 'network_delay' | 'network_partition' | 'timeout' | 'resource_exhaustion' | 'crash' | 'data_corruption';
    parameters: Record<string, unknown>;
    inject: () => Promise<void>;
    cleanup: () => Promise<void>;
}
export interface CausalChain {
    events: SystemObservation[];
    timelineMs: number[];
    components: string[];
    confidence: number;
}
export declare class DistributedSystemsDebugger {
    private sessions;
    private sessionCounter;
    /**
     * Collect observations from multiple data sources systematically
     *
     * Principle: Observation Before Hypothesis
     * Anti-pattern avoided: Jumping to conclusions before gathering data
     *
     * @param sources Data sources to collect from (logs, metrics, traces, events)
     * @returns Collected observations from all sources
     */
    collectObservations(sources: DataSource[]): Promise<SystemObservation[]>;
    /**
     * Form hypotheses based on observations (evidence-based)
     *
     * Principle: Evidence Determines Root Cause
     * Quality gate: Every hypothesis must have supporting evidence
     *
     * @param observations Collected system observations
     * @returns Array of testable hypotheses with evidence
     */
    formHypotheses(observations: SystemObservation[]): Hypothesis[];
    /**
     * Test a hypothesis using controlled experiments
     *
     * Principle: Failure Injection Validates Understanding
     * Quality gate: Test must be reproducible
     *
     * @param hypothesis The hypothesis to test
     * @param test The test procedure to execute
     * @returns Test result with observations
     */
    testHypothesis(hypothesis: Hypothesis, test: Test): Promise<TestResult>;
    /**
     * Rank hypotheses by evidence strength
     *
     * Principle: Evidence Determines Root Cause
     * Measurement: Explicit scoring based on evidence quality and quantity
     *
     * @param hypotheses Array of hypotheses to rank
     * @returns Ranked hypotheses with scores and reasoning
     */
    rankHypotheses(hypotheses: Hypothesis[]): RankedHypotheses;
    /**
     * Generate comprehensive debug report
     *
     * Principle: Explicit Uncertainty (unknowns are documented)
     * Quality gate: Root cause only declared when evidence is strong
     *
     * @param session Debug session with collected data
     * @returns Structured debug report with unknowns
     */
    generateDebugReport(session: DebugSession): DebugReport;
    /**
     * Create a new debug session
     *
     * @param symptoms Observed symptoms to investigate
     * @param sources Data sources to collect from
     * @returns New debug session
     */
    createSession(symptoms: string[], sources: DataSource[]): DebugSession;
    /**
     * Perform systematic isolation to identify minimal reproduction
     *
     * Principle: Isolation Reveals Root Cause
     * Process: Remove variables systematically until symptom disappears
     *
     * @param session Debug session
     * @param variables Variables that can be isolated (components, agents, data)
     * @param checkSymptom Function to check if symptom is still present
     * @returns Isolation steps showing what's necessary for symptom
     */
    performIsolation(session: DebugSession, variables: string[], checkSymptom: (remaining: string[]) => Promise<boolean>): Promise<IsolationStep[]>;
    /**
     * Reconstruct causal chain from observations
     *
     * Principle: Timestamps and causality matter
     * Process: Build timeline of events to understand sequence
     *
     * @param observations System observations
     * @returns Potential causal chains
     */
    reconstructCausalChains(observations: SystemObservation[]): CausalChain[];
    /**
     * Get session by ID
     */
    getSession(sessionId: string): DebugSession | undefined;
    /**
     * Complete a debug session
     */
    completeSession(sessionId: string): void;
    /**
     * Calculate confidence based on evidence ratio
     *
     * Formula: confidence = supporting / (supporting + contradicting)
     * Adjustment: Reduce confidence if evidence count is low
     */
    private _calculateConfidence;
    /**
     * Score evidence quality and quantity
     */
    private _scoreEvidence;
    /**
     * Generate reasoning for hypothesis ranking
     */
    private _generateRankingReasoning;
    /**
     * Identify unknowns in the debug session
     *
     * Principle: Explicit Uncertainty
     */
    private _identifyUnknowns;
    /**
     * Generate recommendations based on session state
     */
    private _generateRecommendations;
    /**
     * Group observations by component
     */
    private _groupByComponent;
    /**
     * Find temporal patterns in observations
     */
    private _findTemporalPatterns;
    /**
     * Build a causal chain from related observations
     */
    private _buildCausalChain;
    /**
     * Extract component names from symptom descriptions
     */
    private _extractComponentsFromSymptoms;
    /**
     * Timeout helper
     */
    private _timeout;
}
/**
 * Create a new distributed systems debugger instance
 */
export declare function createDebugger(): DistributedSystemsDebugger;
/**
 * Create a data source from a simple fetch function
 */
export declare function createDataSource(id: string, component: string, type: DataSource['type'], fetchFn: () => Promise<SystemObservation[]>): DataSource;
/**
 * Create a test from a simple execute function
 */
export declare function createTest(id: string, description: string, executeFn: () => Promise<Omit<TestResult, 'timestamp'>>): Test;
/**
 * Format debug report for display
 *
 * Principle: Evidence-based reporting with explicit unknowns
 */
export declare function formatDebugReport(report: DebugReport): string;
/**
 * Create a failure injection helper
 */
export declare function createFailureInjection(id: string, description: string, targetComponent: string, failureType: FailureInjection['failureType'], parameters: Record<string, unknown>, injectFn: () => Promise<void>, cleanupFn: () => Promise<void>): FailureInjection;
declare const _default: DistributedSystemsDebugger;
export default _default;
//# sourceMappingURL=distributed-systems-debugging.d.ts.map