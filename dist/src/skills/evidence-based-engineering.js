"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceBasedEngineering = void 0;
exports.createEvidenceBasedEngineering = createEvidenceBasedEngineering;
exports.assessEngineering = assessEngineering;
/**
 * Evidence-Based Engineering Validator
 *
 * Validates engineering practices to prevent technical debt from over-promising.
 * Focuses on measurable evidence over aspirational claims.
 */
class EvidenceBasedEngineering {
    /**
     * Validate implementation quality and completeness
     * Checks for:
     * - Function/class definitions
     * - Error handling
     * - Edge case handling
     * - TODOs and FIXMEs (incomplete work)
     */
    validateImplementation(code) {
        const functions = this.extractFunctions(code);
        const classes = this.extractClasses(code);
        const todos = this.extractTodos(code);
        const fixmes = this.extractFixmes(code);
        const issues = [];
        // Check for incomplete work markers
        if (todos.length > 0) {
            issues.push(`Found ${todos.length} TODO markers indicating incomplete work`);
        }
        if (fixmes.length > 0) {
            issues.push(`Found ${fixmes.length} FIXME markers indicating known issues`);
        }
        // Check for console.log (often indicates debugging code)
        const consoleLogs = code.match(/console\.log\(/g) || [];
        if (consoleLogs.length > 0) {
            issues.push(`Found ${consoleLogs.length} console.log statements (debugging code)`);
        }
        // Check for empty catch blocks
        const emptyCatches = code.match(/catch\s*\([^)]*\)\s*\{\s*\}/g) || [];
        if (emptyCatches.length > 0) {
            issues.push(`Found ${emptyCatches.length} empty catch blocks (swallowing errors)`);
        }
        // Check for any/unknown usage (weak typing)
        const anyUsage = code.match(/:\s*any\b/g) || [];
        if (anyUsage.length > 5) { // Some any usage is reasonable, but too much indicates weak typing
            issues.push(`Found ${anyUsage.length} uses of 'any' type (weak typing)`);
        }
        const isValid = issues.length === 0 && functions.length > 0;
        return {
            isValid,
            functions,
            classes,
            todos,
            fixmes,
            issues
        };
    }
    /**
     * Validate test coverage claims
     *
     * Key principle: Test coverage is BINARY per function, not percentage claims
     * - Either a function has tests or it doesn't
     * - Distinguish measured coverage from estimated/assumed
     */
    validateTesting(code, tests) {
        const codeFunctions = this.extractFunctions(code);
        const testFunctions = this.extractTestCases(tests);
        // Match test cases to implementation functions
        const testedFunctions = [];
        const untestedFunctions = [];
        for (const func of codeFunctions) {
            const hasTest = testFunctions.some(test => test.toLowerCase().includes(func.toLowerCase()) ||
                func.toLowerCase().includes(test.toLowerCase()));
            if (hasTest) {
                testedFunctions.push(func);
            }
            else {
                untestedFunctions.push(func);
            }
        }
        // Determine coverage type
        let coverageType = 'unknown';
        let coverageEvidence = '';
        if (tests.length === 0) {
            coverageType = 'unknown';
            coverageEvidence = 'No test file provided';
        }
        else if (testFunctions.length > 0) {
            coverageType = 'measured';
            coverageEvidence = `${testedFunctions.length}/${codeFunctions.length} functions have corresponding tests`;
        }
        else {
            coverageType = 'unknown';
            coverageEvidence = 'Test file exists but no test cases found';
        }
        return {
            hasCoverage: testedFunctions.length > 0,
            testedFunctions,
            untestedFunctions,
            coverageType,
            coverageEvidence
        };
    }
    /**
     * Validate error handling
     *
     * Checks for:
     * - Try/catch blocks
     * - Error type checking
     * - Proper error propagation
     * - Input validation
     */
    validateErrorHandling(code) {
        const handledCases = [];
        const unhandledCases = [];
        // Check for try/catch
        const tryCatchBlocks = code.match(/try\s*\{[\s\S]*?\}\s*catch/g) || [];
        if (tryCatchBlocks.length > 0) {
            handledCases.push(`${tryCatchBlocks.length} try/catch blocks`);
        }
        // Check for input validation
        const inputValidation = code.match(/if\s*\([^)]*===?\s*null\s*\|\|/g) ||
            code.match(/if\s*\(!\w+\)/g) || [];
        if (inputValidation.length > 0) {
            handledCases.push(`${inputValidation.length} input validation checks`);
        }
        // Check for error throwing
        const errorThrows = code.match(/throw\s+new\s+Error/g) || [];
        if (errorThrows.length > 0) {
            handledCases.push(`${errorThrows.length} explicit error throws`);
        }
        // Check for async error handling
        const asyncFunctions = code.match(/async\s+function/g) || code.match(/async\s+\(/g) || [];
        const awaitCalls = code.match(/await\s+/g) || [];
        if (asyncFunctions.length > 0 && tryCatchBlocks.length === 0 && awaitCalls.length > 0) {
            unhandledCases.push(`${asyncFunctions.length} async functions without try/catch for await calls`);
        }
        // Check for promise rejections
        const promiseUsage = code.match(/\.then\(/g) || [];
        const catchHandlers = code.match(/\.catch\(/g) || [];
        if (promiseUsage.length > 0 && catchHandlers.length === 0) {
            unhandledCases.push(`${promiseUsage.length} promise chains without .catch() handlers`);
        }
        // Check for network/IO operations without error handling
        const networkOps = code.match(/fetch\(|axios\.|http\./g) || [];
        if (networkOps.length > 0 && tryCatchBlocks.length === 0) {
            unhandledCases.push(`${networkOps.length} network operations without error handling`);
        }
        // Determine severity
        let severity;
        if (handledCases.length >= 3 && unhandledCases.length === 0) {
            severity = 'adequate';
        }
        else if (handledCases.length > 0) {
            severity = 'minimal';
        }
        else {
            severity = 'missing';
        }
        return {
            hasErrorHandling: handledCases.length > 0,
            handledCases,
            unhandledCases,
            severity
        };
    }
    /**
     * Validate documentation matches implementation
     *
     * Checks for:
     * - JSDoc comments
     * - Function documentation
     * - Parameter documentation
     * - Return type documentation
     */
    validateDocumentation(code, docs) {
        const functions = this.extractFunctions(code);
        const classes = this.extractClasses(code);
        const discrepancies = [];
        const missingDocs = [];
        // Check if functions are documented in JSDoc
        const jsdocBlocks = code.match(/\/\*\*[\s\S]*?\*\//g) || [];
        // Count documented vs undocumented functions
        const documentedInCode = jsdocBlocks.length;
        const totalFunctions = functions.length + classes.length;
        if (documentedInCode < totalFunctions) {
            missingDocs.push(`${totalFunctions - documentedInCode} functions/classes lack JSDoc comments`);
        }
        // Check if external docs mention the functions
        if (docs) {
            for (const func of functions) {
                if (!docs.includes(func)) {
                    discrepancies.push(`Function '${func}' not mentioned in documentation`);
                }
            }
            // Check for docs mentioning non-existent functions
            const docFunctions = this.extractFunctionMentions(docs);
            for (const docFunc of docFunctions) {
                if (!functions.includes(docFunc) && !classes.includes(docFunc)) {
                    discrepancies.push(`Documentation mentions '${docFunc}' which doesn't exist in code`);
                }
            }
        }
        else {
            missingDocs.push('No external documentation provided');
        }
        return {
            matchesImplementation: discrepancies.length === 0 && missingDocs.length === 0,
            discrepancies,
            missingDocs
        };
    }
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
    assessCompleteness(implementation, tests, docs) {
        const implValidation = this.validateImplementation(implementation);
        // Stage 1: Implemented
        const implemented = implValidation.functions.length > 0 &&
            implValidation.issues.length < 3; // Some issues are OK for "implemented"
        // Stage 2: Tested
        let tested = false;
        if (tests) {
            const testAnalysis = this.validateTesting(implementation, tests);
            tested = testAnalysis.testedFunctions.length > 0 &&
                testAnalysis.testedFunctions.length >= implValidation.functions.length * 0.7; // 70% coverage threshold
        }
        // Stage 3: Integrated (check for imports/exports)
        const hasExports = /export\s+(class|function|const|interface)/.test(implementation);
        const hasImports = /import\s+.*\s+from/.test(implementation);
        const integrated = hasExports || hasImports;
        // Stage 4: Validated (check for production-ready patterns)
        const errorHandling = this.validateErrorHandling(implementation);
        const validated = errorHandling.severity === 'adequate' &&
            implValidation.todos.length === 0 &&
            implValidation.fixmes.length === 0;
        // Stage 5: Documented
        let documented = false;
        if (docs) {
            const docAnalysis = this.validateDocumentation(implementation, docs);
            documented = docAnalysis.matchesImplementation || docAnalysis.missingDocs.length <= 1;
        }
        else {
            // Check for inline documentation
            const jsdocBlocks = implementation.match(/\/\*\*[\s\S]*?\*\//g) || [];
            documented = jsdocBlocks.length >= implValidation.functions.length * 0.5;
        }
        // Deployed status cannot be determined from code alone
        const deployed = false;
        // Complete = all stages
        const complete = implemented && tested && integrated && validated && documented && deployed;
        return {
            implemented,
            tested,
            integrated,
            validated,
            documented,
            deployed,
            complete
        };
    }
    /**
     * Perform comprehensive engineering assessment
     *
     * Combines all validation checks into a single assessment
     */
    assess(code, tests, docs) {
        const implemented = [];
        const notImplemented = [];
        const tested = [];
        const notTested = [];
        const risks = [];
        const recommendations = [];
        // Validate implementation
        const implValidation = this.validateImplementation(code);
        // Track implemented functions
        for (const func of implValidation.functions) {
            implemented.push(`Function: ${func}`);
        }
        for (const cls of implValidation.classes) {
            implemented.push(`Class: ${cls}`);
        }
        // Track incomplete work
        if (implValidation.todos.length > 0) {
            for (const todo of implValidation.todos) {
                notImplemented.push(todo);
            }
            risks.push({
                severity: 'medium',
                category: 'completeness',
                description: `${implValidation.todos.length} TODO markers indicate incomplete implementation`,
                mitigation: 'Complete all TODO items before marking as done'
            });
        }
        // Validate testing
        if (tests) {
            const testAnalysis = this.validateTesting(code, tests);
            tested.push(...testAnalysis.testedFunctions);
            notTested.push(...testAnalysis.untestedFunctions);
            if (testAnalysis.untestedFunctions.length > 0) {
                risks.push({
                    severity: 'high',
                    category: 'testing',
                    description: `${testAnalysis.untestedFunctions.length} functions lack test coverage`,
                    mitigation: `Add tests for: ${testAnalysis.untestedFunctions.join(', ')}`
                });
            }
            if (testAnalysis.coverageType === 'unknown' || testAnalysis.coverageType === 'assumed') {
                recommendations.push('Run a coverage tool to get measured test coverage (not estimated)');
            }
        }
        else {
            notTested.push(...implValidation.functions);
            risks.push({
                severity: 'critical',
                category: 'testing',
                description: 'No tests provided - cannot verify functionality',
                mitigation: 'Add comprehensive test suite before deployment'
            });
        }
        // Validate error handling
        const errorHandling = this.validateErrorHandling(code);
        if (errorHandling.severity === 'missing') {
            risks.push({
                severity: 'critical',
                category: 'error-handling',
                description: 'No error handling found',
                mitigation: 'Add try/catch blocks, input validation, and error propagation'
            });
        }
        else if (errorHandling.severity === 'minimal') {
            risks.push({
                severity: 'high',
                category: 'error-handling',
                description: 'Minimal error handling - may fail in production',
                mitigation: 'Add comprehensive error handling for all failure modes'
            });
        }
        if (errorHandling.unhandledCases.length > 0) {
            recommendations.push(`Address unhandled cases: ${errorHandling.unhandledCases.join('; ')}`);
        }
        // Validate documentation
        if (docs) {
            const docAnalysis = this.validateDocumentation(code, docs);
            if (!docAnalysis.matchesImplementation) {
                risks.push({
                    severity: 'medium',
                    category: 'documentation',
                    description: 'Documentation does not match implementation',
                    mitigation: 'Update documentation to reflect actual code behavior'
                });
                if (docAnalysis.discrepancies.length > 0) {
                    recommendations.push(`Fix documentation discrepancies: ${docAnalysis.discrepancies.join('; ')}`);
                }
            }
        }
        else {
            recommendations.push('Add external documentation (README, API docs) to improve maintainability');
        }
        // Check for other quality issues
        if (implValidation.issues.length > 0) {
            for (const issue of implValidation.issues) {
                recommendations.push(issue);
            }
        }
        // Assess overall completeness
        const completionStatus = this.assessCompleteness(code, tests, docs);
        // Add completion-based recommendations
        if (!completionStatus.tested) {
            recommendations.push('Not tested: Add passing tests before claiming completion');
        }
        if (!completionStatus.validated) {
            recommendations.push('Not validated: Remove TODOs/FIXMEs and improve error handling');
        }
        if (!completionStatus.documented) {
            recommendations.push('Not documented: Add comprehensive documentation');
        }
        return {
            implemented,
            notImplemented,
            tested,
            notTested,
            risks,
            recommendations,
            completionStatus
        };
    }
    // Helper methods for code analysis
    extractFunctions(code) {
        const functions = [];
        // Regular function declarations
        const funcDeclarations = code.matchAll(/function\s+(\w+)/g);
        for (const match of funcDeclarations) {
            functions.push(match[1]);
        }
        // Arrow functions assigned to const/let
        const arrowFunctions = code.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g);
        for (const match of arrowFunctions) {
            functions.push(match[1]);
        }
        // Method definitions in classes
        const methods = code.matchAll(/(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/g);
        for (const match of methods) {
            if (!['constructor', 'if', 'for', 'while', 'switch'].includes(match[1])) {
                functions.push(match[1]);
            }
        }
        return [...new Set(functions)]; // Remove duplicates
    }
    extractClasses(code) {
        const classes = [];
        const classDeclarations = code.matchAll(/class\s+(\w+)/g);
        for (const match of classDeclarations) {
            classes.push(match[1]);
        }
        return classes;
    }
    extractTodos(code) {
        const todos = [];
        const todoMatches = code.matchAll(/\/\/\s*TODO:?\s*(.+)/gi);
        for (const match of todoMatches) {
            todos.push(match[1].trim());
        }
        return todos;
    }
    extractFixmes(code) {
        const fixmes = [];
        const fixmeMatches = code.matchAll(/\/\/\s*FIXME:?\s*(.+)/gi);
        for (const match of fixmeMatches) {
            fixmes.push(match[1].trim());
        }
        return fixmes;
    }
    extractTestCases(tests) {
        const testCases = [];
        // Jest/Mocha style: describe/it/test
        const testMatches = tests.matchAll(/(?:it|test|describe)\s*\(\s*['"`]([^'"`]+)['"`]/g);
        for (const match of testMatches) {
            testCases.push(match[1]);
        }
        return testCases;
    }
    extractFunctionMentions(docs) {
        const mentions = [];
        // Look for function mentions in backticks
        const backtickMatches = docs.matchAll(/`(\w+)\(/g);
        for (const match of backtickMatches) {
            mentions.push(match[1]);
        }
        // Look for function headers
        const headerMatches = docs.matchAll(/###?\s+(\w+)/g);
        for (const match of headerMatches) {
            mentions.push(match[1]);
        }
        return [...new Set(mentions)];
    }
}
exports.EvidenceBasedEngineering = EvidenceBasedEngineering;
/**
 * Factory function for creating the validator
 */
function createEvidenceBasedEngineering() {
    return new EvidenceBasedEngineering();
}
/**
 * Convenience function for quick assessment
 */
function assessEngineering(code, tests, docs) {
    const validator = new EvidenceBasedEngineering();
    return validator.assess(code, tests, docs);
}
//# sourceMappingURL=evidence-based-engineering.js.map