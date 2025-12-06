/**
 * Self-Improvement Feedback Mechanism
 *
 * Implements a learning system that extracts patterns from execution outcomes,
 * maintains lifelong memory of learned strategies, and continuously refines
 * skills based on accumulated evidence.
 *
 * Research Foundation:
 * - Reflexion: Verbal RL in episodic memory (HumanEval 80% → 91%)
 * - SOAR: Fine-tuning on own search traces
 * - ArcMemo: Lifelong memory (55% → 59%)
 *
 * Key Principles:
 * - Pattern Extraction: Learn from successful executions
 * - Evidence-Based Learning: Patterns backed by success metrics
 * - Memory Persistence: Learning survives sessions (Firebase + Firestore)
 * - Skill Refinement: Continuous improvement through feedback loops
 *
 * @version 1.0.0
 * @date 2025-12-06
 */
/**
 * Individual step in a process execution
 */
export interface ProcessStep {
    stepId: string;
    action: string;
    reasoning: string;
    outcome: 'success' | 'failure' | 'partial';
    duration: number;
    timestamp: number;
    context: Record<string, unknown>;
    metrics?: {
        accuracy?: number;
        efficiency?: number;
        quality?: number;
    };
}
/**
 * Complete record of a task execution
 */
export interface ExecutionOutcome {
    taskId: string;
    skillUsed: string;
    success: boolean;
    refinementLoops: number;
    processTrace: ProcessStep[];
    feedback: string;
    patterns: LearnedPattern[];
    startedAt: number;
    completedAt: number;
    metadata: {
        userId?: string;
        sessionId?: string;
        context: string;
        complexity: 'low' | 'medium' | 'high';
    };
}
/**
 * Learned pattern extracted from successful executions
 *
 * Following Reflexion's approach: patterns are verbal descriptions
 * of what worked, when it worked, and why we believe it works.
 */
export interface LearnedPattern {
    id: string;
    context: string;
    strategy: string;
    evidence: string[];
    successRate: number;
    confidenceScore: number;
    applicableSkills: string[];
    extractedAt: number;
    lastValidatedAt: number;
    usageCount: number;
    failureCount: number;
    refinements: PatternRefinement[];
    metadata: {
        complexity: 'low' | 'medium' | 'high';
        generalizability: number;
        stability: number;
    };
}
/**
 * Refinement made to a pattern based on new evidence
 */
export interface PatternRefinement {
    refinedAt: number;
    reason: string;
    previousStrategy: string;
    newStrategy: string;
    evidenceAdded: string[];
    impactOnSuccessRate: number;
}
/**
 * Feedback from task execution or user
 */
export interface Feedback {
    feedbackId: string;
    taskId: string;
    skillId: string;
    type: 'success' | 'failure' | 'partial' | 'user-correction';
    content: string;
    rating?: number;
    timestamp: number;
    actionable: string[];
    metadata?: Record<string, unknown>;
}
/**
 * Skill update proposal based on accumulated feedback
 */
export interface SkillUpdate {
    skillId: string;
    updateType: 'refinement' | 'extension' | 'deprecation';
    description: string;
    rationale: string;
    supportingEvidence: string[];
    proposedChanges: {
        area: 'strategy' | 'validation' | 'error-handling' | 'optimization';
        before: string;
        after: string;
        confidence: number;
    }[];
    estimatedImpact: {
        successRateImprovement: number;
        efficiencyGain: number;
        riskLevel: 'low' | 'medium' | 'high';
    };
    requiresValidation: boolean;
    createdAt: number;
}
/**
 * Recommendation based on learned patterns
 */
export interface PatternRecommendation {
    pattern: LearnedPattern;
    relevanceScore: number;
    reasoning: string;
    alternatives: LearnedPattern[];
    caveats: string[];
}
/**
 * Statistics for pattern performance
 */
export interface PatternStatistics {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    successRate: number;
    confidenceInterval: {
        lower: number;
        upper: number;
        confidenceLevel: number;
    };
    trendDirection: 'improving' | 'stable' | 'declining';
    lastUpdated: number;
}
export declare class SelfImprovementLoop {
    private patterns;
    private outcomes;
    private feedback;
    private persistenceEnabled;
    constructor(options?: {
        disablePersistence?: boolean;
    });
    /**
     * Record outcome for learning
     *
     * Following Reflexion: Store complete execution trace
     * for episodic memory and pattern extraction.
     */
    recordOutcome(outcome: ExecutionOutcome): void;
    /**
     * Extract patterns from successful executions
     *
     * Following SOAR: Learn from search traces and successful strategies.
     * Identifies common sequences, effective strategies, and success factors.
     */
    extractPatterns(outcomes: ExecutionOutcome[]): LearnedPattern[];
    /**
     * Get recommendations based on learned patterns
     *
     * Filters patterns by context relevance and provides ranked
     * recommendations with alternatives and caveats.
     */
    getRecommendations(context: string): PatternRecommendation[];
    /**
     * Refine skill based on accumulated feedback
     *
     * Following ArcMemo: Use lifelong memory to improve performance
     * by identifying areas for refinement.
     */
    refineSkill(skillId: string, feedbackList: Feedback[]): SkillUpdate;
    /**
     * Get pattern statistics for analysis
     */
    getPatternStatistics(patternId: string): PatternStatistics | null;
    /**
     * Persist patterns to memory system
     *
     * Following ArcMemo: Maintain lifelong memory across sessions
     * Stores in Firestore for warm-tier access (100-500ms)
     */
    persistToMemory(patterns: LearnedPattern[]): Promise<void>;
    /**
     * Load patterns from memory system
     *
     * Retrieves persisted patterns from Firestore to enable
     * learning continuity across sessions.
     */
    loadFromMemory(): Promise<LearnedPattern[]>;
    /**
     * Extract patterns from a single outcome
     */
    private extractPatternsFromOutcome;
    /**
     * Find common sequences across successful outcomes
     */
    private findCommonSequences;
    /**
     * Find context-strategy patterns
     */
    private findContextStrategyPatterns;
    /**
     * Find optimization patterns
     */
    private findOptimizationPatterns;
    private addOrUpdatePattern;
    private findSimilarPattern;
    private calculateRelevanceScore;
    private calculateStringSimilarity;
    private generateCaveats;
    private generateReasoningForRecommendation;
    private analyzeFeedback;
    private calculateConfidence;
    private calculateWilsonInterval;
    private determineTrend;
    private generatePatternId;
    private summarizeSteps;
    private groupByContextSimilarity;
    private extractActionSequences;
    private findCommonSubsequences;
    private containsSubsequence;
    private deduplicateSequences;
    private determineComplexity;
    private estimateGeneralizability;
    private extractStrategy;
    private extractCommonFactors;
    private persistOutcomeToMemory;
    private persistSkillUpdate;
}
/**
 * Create a new self-improvement loop
 */
export declare function createSelfImprovementLoop(options?: {
    disablePersistence?: boolean;
}): SelfImprovementLoop;
/**
 * Create a feedback object
 */
export declare function createFeedback(taskId: string, skillId: string, type: Feedback['type'], content: string, actionable?: string[]): Feedback;
/**
 * Create an execution outcome
 */
export declare function createExecutionOutcome(taskId: string, skillUsed: string, success: boolean, processTrace: ProcessStep[], context: string): ExecutionOutcome;
declare const _default: SelfImprovementLoop;
export default _default;
//# sourceMappingURL=self-improvement.d.ts.map