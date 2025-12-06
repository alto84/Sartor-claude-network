/**
 * Evidence-Based Engineering Skill
 *
 * Enforces intellectual honesty in engineering by validating:
 * - Implementation vs Completion distinction
 * - Test coverage (binary per function, not percentage claims)
 * - Error handling rigor
 * - Documentation accuracy
 * - Measurement vs estimation vs assumption
 *
 * Core Principle: Implementation ≠ Complete
 * - Implemented: Code exists and compiles
 * - Tested: Code passes defined tests
 * - Integrated: Code works with other components
 * - Validated: Code meets requirements in realistic conditions
 * - Complete: All four stages pass AND documented AND deployed
 */
export interface Risk {
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'error-handling' | 'testing' | 'security' | 'performance' | 'completeness' | 'documentation';
    description: string;
    mitigation: string;
}
export interface EngineeringAssessment {
    implemented: string[];
    notImplemented: string[];
    tested: string[];
    notTested: string[];
    risks: Risk[];
    recommendations: string[];
    completionStatus: CompletionStatus;
}
export interface CompletionStatus {
    implemented: boolean;
    tested: boolean;
    integrated: boolean;
    validated: boolean;
    documented: boolean;
    deployed: boolean;
    complete: boolean;
}
export interface TestAnalysis {
    hasCoverage: boolean;
    testedFunctions: string[];
    untestedFunctions: string[];
    coverageType: 'measured' | 'estimated' | 'assumed' | 'unknown';
    coverageEvidence: string;
}
export interface ErrorHandlingAnalysis {
    hasErrorHandling: boolean;
    handledCases: string[];
    unhandledCases: string[];
    severity: 'adequate' | 'minimal' | 'missing';
}
export interface DocumentationAnalysis {
    matchesImplementation: boolean;
    discrepancies: string[];
    missingDocs: string[];
}
/**
 * Evidence-Based Engineering Validator
 *
 * Validates engineering practices to prevent technical debt from over-promising.
 * Focuses on measurable evidence over aspirational claims.
 */
export declare class EvidenceBasedEngineering {
    /**
     * Validate implementation quality and completeness
     * Checks for:
     * - Function/class definitions
     * - Error handling
     * - Edge case handling
     * - TODOs and FIXMEs (incomplete work)
     */
    validateImplementation(code: string): {
        isValid: boolean;
        functions: string[];
        classes: string[];
        todos: string[];
        fixmes: string[];
        issues: string[];
    };
    /**
     * Validate test coverage claims
     *
     * Key principle: Test coverage is BINARY per function, not percentage claims
     * - Either a function has tests or it doesn't
     * - Distinguish measured coverage from estimated/assumed
     */
    validateTesting(code: string, tests: string): TestAnalysis;
    /**
     * Validate error handling
     *
     * Checks for:
     * - Try/catch blocks
     * - Error type checking
     * - Proper error propagation
     * - Input validation
     */
    validateErrorHandling(code: string): ErrorHandlingAnalysis;
    /**
     * Validate documentation matches implementation
     *
     * Checks for:
     * - JSDoc comments
     * - Function documentation
     * - Parameter documentation
     * - Return type documentation
     */
    validateDocumentation(code: string, docs: string): DocumentationAnalysis;
    /**
     * Assess completeness - distinguish "implemented" from "complete"
     *
     * Completion stages:
     * 1. Implemented: Code exists and compiles
     * 2. Tested: Code passes defined tests
     * 3. Integrated: Code works with other components
     * 4. Validated: Code meets requirements in realistic conditions
     * 5. Complete: All above + documented + deployed
     */
    assessCompleteness(implementation: string, tests?: string, docs?: string): CompletionStatus;
    /**
     * Perform comprehensive engineering assessment
     *
     * Combines all validation checks into a single assessment
     */
    assess(code: string, tests?: string, docs?: string): EngineeringAssessment;
    private extractFunctions;
    private extractClasses;
    private extractTodos;
    private extractFixmes;
    private extractTestCases;
    private extractFunctionMentions;
}
/**
 * Factory function for creating the validator
 */
export declare function createEvidenceBasedEngineering(): EvidenceBasedEngineering;
/**
 * Convenience function for quick assessment
 */
export declare function assessEngineering(code: string, tests?: string, docs?: string): EngineeringAssessment;
//# sourceMappingURL=evidence-based-engineering.d.ts.map