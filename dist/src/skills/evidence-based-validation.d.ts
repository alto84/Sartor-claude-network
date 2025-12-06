/**
 * Evidence-Based Validation Skill
 *
 * Enforces intellectual honesty by preventing fabricated metrics, exaggerated claims,
 * and unsupported assertions, ensuring all technical assessments rest on verifiable evidence.
 *
 * Based on principles from UPLIFTED_SKILLS.md:
 * - Measurement Distinguishes Opinion from Fact
 * - Uncertainty Acknowledgment Builds Trust
 * - Skepticism as Default Posture
 * - Language Precision Prevents Creep
 */
export interface ValidationResult {
    valid: boolean;
    score: number;
    issues: ValidationIssue[];
    suggestions: string[];
}
export interface ValidationIssue {
    type: 'error' | 'warning';
    category: 'metrics' | 'language' | 'evidence' | 'completeness';
    message: string;
    location?: {
        line: number;
        column: number;
    };
    suggestion: string;
}
export interface ValidationInput {
    text: string;
    context?: {
        type?: 'code' | 'documentation' | 'claim' | 'report';
        claims?: Array<{
            claim: string;
            sources: string[];
        }>;
        status?: string;
        details?: string[];
    };
}
export interface MetricCheck {
    hasNumber: boolean;
    hasMethodology: boolean;
    isRounded: boolean;
    isFabricated: boolean;
    location?: {
        line: number;
        column: number;
    };
    text: string;
}
export declare class EvidenceBasedValidator {
    /**
     * Validate metrics to ensure they're not fabricated
     *
     * Anti-pattern detected: Metrics without methodology
     * Good pattern: "Coverage tool reported 87% line coverage on 2024-12-06"
     * Bad pattern: "Code quality is excellent at 95%"
     */
    validateMetrics(text: string): ValidationResult;
    /**
     * Validate language for vague terms and superlatives
     *
     * Anti-pattern detected: Language that inflates claims
     * Good pattern: "Follows standard patterns, no obvious defects observed"
     * Bad pattern: "Excellent code quality"
     */
    validateLanguage(text: string): ValidationResult;
    /**
     * Validate that claims have supporting evidence
     *
     * Anti-pattern detected: Claims without sources
     * Good pattern: Every quantitative claim traces to a specific source
     */
    validateEvidence(claim: string, sources: string[]): ValidationResult;
    /**
     * Validate completion claims against actual details
     *
     * Anti-pattern detected: Claiming completion when only implementation exists
     * Good pattern: Separate implemented/tested/integrated/validated/complete
     */
    validateCompleteness(status: string, details: string[]): ValidationResult;
    /**
     * Master validation that runs all checks
     *
     * Combines metrics, language, evidence, and completeness validation
     */
    validate(input: ValidationInput): ValidationResult;
    private _generateMetricSuggestions;
    private _generateLanguageSuggestions;
    private _generateEvidenceSuggestions;
    private _generateCompletenessSuggestions;
    private _getLanguageSuggestion;
}
/**
 * Create a new validator instance
 */
export declare function createValidator(): EvidenceBasedValidator;
/**
 * Quick validation of text for common issues
 */
export declare function quickValidate(text: string): ValidationResult;
/**
 * Validate a claim with sources
 */
export declare function validateClaim(claim: string, sources: string[]): ValidationResult;
/**
 * Format validation result for display
 */
export declare function formatValidationResult(result: ValidationResult): string;
declare const _default: EvidenceBasedValidator;
export default _default;
//# sourceMappingURL=evidence-based-validation.d.ts.map