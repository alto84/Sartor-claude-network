/**
 * Safety Research Workflow Skill
 *
 * Conduct rigorous, evidence-based research with systematic validation and
 * multi-perspective analysis, producing findings that meet medical/pharmaceutical-grade
 * standards of evidence.
 *
 * Based on principles from UPLIFTED_SKILLS.md:
 * - Truth Over Speed: Better to acknowledge gaps than fabricate evidence
 * - Evidence Hierarchy: Not all sources carry equal weight
 * - Disagreement as Signal: Conflicting evidence indicates knowledge boundaries
 * - Quality Gates as Circuit Breakers: Validation checkpoints prevent error propagation
 *
 * @version 1.0.0
 * @date 2025-12-06
 */
export type EvidenceLevel = 'empirical' | 'documented' | 'inferred' | 'hypothetical';
export interface Source {
    identifier: string;
    type: 'peer-reviewed' | 'documentation' | 'measurement' | 'expert-opinion' | 'ai-generated';
    title?: string;
    authors?: string[];
    year?: number;
    verifiable: boolean;
    accessedAt: number;
}
export interface Evidence {
    source: Source;
    excerpt: string;
    relevance: number;
    credibility: number;
    contradicts?: string[];
    supports?: string[];
}
export interface ResearchClaim {
    id: string;
    statement: string;
    evidenceLevel: EvidenceLevel;
    sources: Source[];
    evidence: Evidence[];
    confidence: number;
    confidenceReasoning: string;
    limitations: string[];
    relatedClaims?: string[];
    timestamp: number;
}
export interface Conflict {
    type: 'disagreement' | 'contradiction' | 'uncertainty' | 'evidence-gap';
    claimIds: string[];
    description: string;
    evidence: {
        supporting: Evidence[];
        contradicting: Evidence[];
    };
    resolution?: {
        type: 'resolved' | 'preserved';
        reasoning: string;
        evidence?: Evidence[];
    };
    severity: 'minor' | 'moderate' | 'major';
    preserved: boolean;
}
export interface ResearchPlan {
    question: string;
    decomposition: string[];
    methodology: string;
    evidenceSources: string[];
    validationCriteria: string[];
    expectedEvidenceLevel: EvidenceLevel;
    estimatedDurationMs: number;
}
export interface ResearchReport {
    question: string;
    methodology: string;
    findings: ResearchClaim[];
    conflicts: Conflict[];
    synthesis: string;
    limitations: string[];
    futureWork: string[];
    confidence: number;
    confidenceReasoning: string;
    metadata: {
        conductedAt: number;
        durationMs: number;
        sourcesConsulted: number;
        claimsEvaluated: number;
        conflictsIdentified: number;
    };
}
export interface GateResult {
    passed: boolean;
    gateName: string;
    issues: string[];
    severity: 'blocking' | 'warning';
    details?: Record<string, any>;
}
export interface QualityGate {
    name: string;
    check: (report: ResearchReport) => GateResult;
    severity: 'blocking' | 'warning';
    description: string;
}
export interface GateResults {
    allPassed: boolean;
    blockingFailures: GateResult[];
    warnings: GateResult[];
    results: GateResult[];
}
export interface Synthesis {
    mainFindings: string[];
    emergentInsights: string[];
    conflicts: Conflict[];
    confidence: number;
    confidenceReasoning: string;
    limitations: string[];
    recommendations: string[];
}
/**
 * Quality Gate: Truth Over Speed
 * Reject claims without adequate evidence
 */
export declare const TruthOverSpeedGate: QualityGate;
/**
 * Quality Gate: Source Verification
 * All sources must be verifiable
 */
export declare const SourceVerificationGate: QualityGate;
/**
 * Quality Gate: Disagreement Preservation
 * Never force consensus when conflicts exist
 */
export declare const DisagreementPreservationGate: QualityGate;
/**
 * Quality Gate: Limitation Documentation
 * Explicit boundaries must be documented
 */
export declare const LimitationDocumentationGate: QualityGate;
/**
 * All standard quality gates
 */
export declare const STANDARD_QUALITY_GATES: QualityGate[];
export declare class SafetyResearchWorkflow {
    /**
     * Create a research plan from a question
     *
     * Anti-pattern detected: Starting research without a plan
     * Good pattern: Structured approach with clear methodology
     */
    createResearchPlan(question: string, options?: {
        targetEvidenceLevel?: EvidenceLevel;
        maxDurationMs?: number;
    }): ResearchPlan;
    /**
     * Evaluate a claim with evidence
     *
     * Anti-pattern detected: Claims without evidence levels
     * Good pattern: Explicit evidence hierarchy and confidence calculation
     */
    evaluateClaim(statement: string, evidence: Evidence[], options?: {
        requiredEvidenceLevel?: EvidenceLevel;
    }): ResearchClaim;
    /**
     * Run quality gates on a research report
     *
     * Anti-pattern detected: Skipping validation
     * Good pattern: Systematic quality checks before accepting results
     */
    runQualityGates(report: ResearchReport, gates?: QualityGate[]): GateResults;
    /**
     * Identify conflicts between claims
     *
     * Anti-pattern detected: Ignoring contradictory evidence
     * Good pattern: Preserve and document disagreements
     */
    identifyConflicts(claims: ResearchClaim[]): Conflict[];
    /**
     * Synthesize findings without forcing false consensus
     *
     * Anti-pattern detected: Averaging opinions without basis
     * Good pattern: Acknowledge conflicts, preserve disagreements
     */
    synthesizeFindings(claims: ResearchClaim[]): Synthesis;
    /**
     * Create a complete research report
     */
    createResearchReport(question: string, methodology: string, findings: ResearchClaim[], options?: {
        customGates?: QualityGate[];
    }): ResearchReport;
    /**
     * Validate a research report against quality gates
     */
    validateReport(report: ResearchReport, gates?: QualityGate[]): {
        valid: boolean;
        results: GateResults;
    };
    private _decompose;
    private _identifyEvidenceSources;
    private _defineValidationCriteria;
    private _defineMethodology;
    private _generateClaimId;
    private _determineEvidenceLevel;
    private _calculateConfidence;
    private _identifyLimitations;
    private _areOpposing;
    private _identifyEmergentInsights;
    private _synthesizeConfidence;
    private _synthesizeLimitations;
    private _generateRecommendations;
    private _identifyFutureWork;
    private _formatSynthesis;
    private _countUniqueSources;
}
/**
 * Create a new research workflow instance
 */
export declare function createResearchWorkflow(): SafetyResearchWorkflow;
/**
 * Create a source with validation
 */
export declare function createSource(identifier: string, type: Source['type'], options?: Partial<Omit<Source, 'identifier' | 'type'>>): Source;
/**
 * Create evidence with validation
 */
export declare function createEvidence(source: Source, excerpt: string, options?: Partial<Omit<Evidence, 'source' | 'excerpt'>>): Evidence;
/**
 * Format gate results for display
 */
export declare function formatGateResults(results: GateResults): string;
/**
 * Format research report for display
 */
export declare function formatResearchReport(report: ResearchReport): string;
declare const _default: SafetyResearchWorkflow;
export default _default;
//# sourceMappingURL=safety-research-workflow.d.ts.map