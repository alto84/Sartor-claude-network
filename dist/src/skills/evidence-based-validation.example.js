"use strict";
/**
 * Example Usage of Evidence-Based Validation Skill
 *
 * Demonstrates how to use the validator to catch common anti-patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
const evidence_based_validation_1 = require("./evidence-based-validation");
// Example 1: Bad metrics without methodology
console.log('=== Example 1: Fabricated Metrics ===');
const badMetrics = `
Our code quality is excellent at 95%.
Test coverage reached 87.3%.
Performance improved by 100%.
`;
const result1 = (0, evidence_based_validation_1.quickValidate)(badMetrics);
console.log((0, evidence_based_validation_1.formatValidationResult)(result1));
console.log('\n');
// Example 2: Good metrics with methodology
console.log('=== Example 2: Valid Metrics ===');
const goodMetrics = `
Coverage tool reported 87% line coverage on 2024-12-06.
Benchmark on Intel i7-9700K showed 15 out of 20 test cases passing.
Measured performance: avg response time 42ms (sample size: 1000 requests).
`;
const result2 = (0, evidence_based_validation_1.quickValidate)(goodMetrics);
console.log((0, evidence_based_validation_1.formatValidationResult)(result2));
console.log('\n');
// Example 3: Prohibited language
console.log('=== Example 3: Prohibited Language ===');
const badLanguage = `
This code is excellent and probably works perfectly.
The implementation should work fine.
This is the best solution.
`;
const result3 = (0, evidence_based_validation_1.quickValidate)(badLanguage);
console.log((0, evidence_based_validation_1.formatValidationResult)(result3));
console.log('\n');
// Example 4: Good language
console.log('=== Example 4: Precise Language ===');
const goodLanguage = `
The code follows standard patterns with no obvious defects observed.
Tested to work under conditions X, Y, Z.
Selected based on benchmark showing 30% lower memory usage compared to alternative A.
`;
const result4 = (0, evidence_based_validation_1.quickValidate)(goodLanguage);
console.log((0, evidence_based_validation_1.formatValidationResult)(result4));
console.log('\n');
// Example 5: Claims without evidence
console.log('=== Example 5: Claims Without Evidence ===');
const claimWithoutEvidence = (0, evidence_based_validation_1.validateClaim)('Performance improved by 50% after optimization', [] // No sources
);
console.log((0, evidence_based_validation_1.formatValidationResult)(claimWithoutEvidence));
console.log('\n');
// Example 6: Claims with proper evidence
console.log('=== Example 6: Claims With Evidence ===');
const claimWithEvidence = (0, evidence_based_validation_1.validateClaim)('Performance improved by 50% after optimization', [
    'Measured using Apache Bench on 2024-12-06',
    'https://github.com/example/benchmarks/blob/main/results.md',
]);
console.log((0, evidence_based_validation_1.formatValidationResult)(claimWithEvidence));
console.log('\n');
// Example 7: Completeness validation
console.log('=== Example 7: Completion Claims ===');
const validator = new evidence_based_validation_1.EvidenceBasedValidator();
const badCompletion = validator.validateCompleteness('Feature is production ready', ['Implemented the core functionality']);
console.log('Bad completion claim:');
console.log((0, evidence_based_validation_1.formatValidationResult)(badCompletion));
console.log('\n');
const goodCompletion = validator.validateCompleteness('Feature is implemented', [
    'Implemented: 5 out of 7 core functions',
    'Tested: 3 out of 7 functions have unit tests',
    'Not yet integrated with main system',
    'Performance validation pending',
]);
console.log('Good completion status:');
console.log((0, evidence_based_validation_1.formatValidationResult)(goodCompletion));
console.log('\n');
// Example 8: Comprehensive validation
console.log('=== Example 8: Comprehensive Validation ===');
const comprehensiveTest = validator.validate({
    text: `
    Our new caching system is excellent and provides 90% improvement.
    The code should work in production and is probably ready.
  `,
    context: {
        type: 'report',
        claims: [
            {
                claim: 'Caching provides 90% improvement',
                sources: [], // Missing sources
            },
        ],
        status: 'Production ready',
        details: ['Implemented caching logic'], // Missing other requirements
    },
});
console.log('Comprehensive validation of bad report:');
console.log((0, evidence_based_validation_1.formatValidationResult)(comprehensiveTest));
console.log('\n');
// Summary
console.log('=== Summary ===');
console.log('The Evidence-Based Validation skill successfully detects:');
console.log('1. Metrics without methodology (fabrication)');
console.log('2. Prohibited language (vague, superlatives, confidence inflation)');
console.log('3. Claims without evidence');
console.log('4. Unsubstantiated completion claims');
console.log('5. Provides specific, actionable suggestions for improvement');
//# sourceMappingURL=evidence-based-validation.example.js.map