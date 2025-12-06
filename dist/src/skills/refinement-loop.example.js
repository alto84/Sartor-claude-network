"use strict";
/**
 * Refinement Loop Examples
 *
 * Demonstrates various usage patterns for the core refinement loop.
 *
 * @version 1.0.0
 * @date 2025-12-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.example1_CodeQualityRefinement = example1_CodeQualityRefinement;
exports.example2_SimpleRefinement = example2_SimpleRefinement;
exports.example3_ArchitectureRefinement = example3_ArchitectureRefinement;
exports.example4_CostAwareRefinement = example4_CostAwareRefinement;
exports.runAllExamples = runAllExamples;
const refinement_loop_1 = require("./refinement-loop");
async function example1_CodeQualityRefinement() {
    console.log('=== Example 1: Code Quality Refinement ===\n');
    const config = {
        maxIterations: 5,
        confidenceThreshold: 0.9,
        processSupervision: true,
        timeout: 30000
    };
    const loop = new refinement_loop_1.RefinementLoop(config);
    // Generate: Create initial code
    const generate = async () => {
        return {
            code: `
function add(a, b) {
  return a + b;
}
      `.trim(),
            language: 'javascript'
        };
    };
    // Evaluate: Check code quality
    const evaluate = async (candidate) => {
        const issues = [];
        let score = 1.0;
        // Check for type annotations
        if (!candidate.code.includes('number')) {
            issues.push((0, refinement_loop_1.createFeedback)('Missing type annotations', 'major', 'Add TypeScript type annotations for parameters and return type'));
            score -= 0.3;
        }
        // Check for documentation
        if (!candidate.code.includes('/**')) {
            issues.push((0, refinement_loop_1.createFeedback)('Missing JSDoc documentation', 'minor', 'Add JSDoc comment explaining the function'));
            score -= 0.2;
        }
        // Check for input validation
        if (!candidate.code.includes('if') && !candidate.code.includes('typeof')) {
            issues.push((0, refinement_loop_1.createFeedback)('No input validation', 'major', 'Add validation to check if inputs are numbers'));
            score -= 0.3;
        }
        return (0, refinement_loop_1.createEvaluation)(Math.max(0, score), issues, `Code quality score: ${score.toFixed(2)}. Found ${issues.length} issues.`, 10 // Cost in tokens
        );
    };
    // Refine: Improve code based on feedback
    const refine = async (candidate, feedback) => {
        let improvedCode = candidate.code;
        // Apply improvements based on feedback
        if (feedback.issue.includes('type annotations')) {
            improvedCode = `
/**
 * Adds two numbers together
 */
function add(a: number, b: number): number {
  return a + b;
}
      `.trim();
        }
        else if (feedback.issue.includes('documentation')) {
            improvedCode = `
/**
 * Adds two numbers together
 */
${improvedCode}
      `.trim();
        }
        else if (feedback.issue.includes('input validation')) {
            improvedCode = `
/**
 * Adds two numbers together
 * @throws {TypeError} If inputs are not numbers
 */
function add(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Both arguments must be numbers');
  }
  return a + b;
}
      `.trim();
        }
        return { ...candidate, code: improvedCode };
    };
    const result = await loop.run(generate, evaluate, refine);
    console.log((0, refinement_loop_1.formatRefinementResult)(result));
    console.log('\nFinal Code:');
    console.log(result.candidate.code);
    console.log('\n');
}
// ============================================================================
// EXAMPLE 2: Simple Refinement with withRefinement Helper
// ============================================================================
async function example2_SimpleRefinement() {
    console.log('=== Example 2: Simple Refinement Helper ===\n');
    // Task: Generate a greeting message
    const generateGreeting = async () => {
        return 'Hello';
    };
    // Evaluator: Check if greeting is polite enough
    const evaluateGreeting = async (greeting) => {
        let score = 0.5;
        if (greeting.includes('please'))
            score += 0.2;
        if (greeting.includes('!'))
            score += 0.1;
        if (greeting.length > 10)
            score += 0.2;
        return Math.min(1.0, score);
    };
    const result = await (0, refinement_loop_1.withRefinement)(generateGreeting, evaluateGreeting, {
        maxIterations: 3,
        confidenceThreshold: 0.8,
        processSupervision: false
    });
    console.log(`Final greeting: "${result}"`);
    console.log('\n');
}
async function example3_ArchitectureRefinement() {
    console.log('=== Example 3: Architecture Design Refinement ===\n');
    const config = {
        maxIterations: 4,
        confidenceThreshold: 0.85,
        processSupervision: true,
        costBudget: 500,
        minImprovementDelta: 0.05
    };
    const loop = new refinement_loop_1.RefinementLoop(config);
    // Generate: Create initial architecture
    const generate = async () => {
        return {
            components: ['web-server', 'database'],
            patterns: ['MVC'],
            scalability: 0.4,
            reliability: 0.5
        };
    };
    // Evaluate: Check architecture quality
    const evaluate = async (design) => {
        const issues = [];
        let score = 0.5;
        // Check scalability
        if (design.scalability < 0.7) {
            issues.push((0, refinement_loop_1.createFeedback)('Low scalability score', 'critical', 'Add load balancer and caching layer', 'scalability'));
        }
        else {
            score += 0.25;
        }
        // Check reliability
        if (design.reliability < 0.8) {
            issues.push((0, refinement_loop_1.createFeedback)('Reliability needs improvement', 'major', 'Add database replication and health checks', 'reliability'));
        }
        else {
            score += 0.25;
        }
        // Check patterns
        if (!design.patterns.includes('Circuit Breaker')) {
            issues.push((0, refinement_loop_1.createFeedback)('Missing resilience patterns', 'major', 'Implement Circuit Breaker pattern', 'patterns'));
        }
        else {
            score += 0.25;
        }
        return (0, refinement_loop_1.createEvaluation)(Math.min(1.0, score), issues, `Architecture score: ${score.toFixed(2)}`, 20);
    };
    // Refine: Improve architecture based on feedback
    const refine = async (design, feedback) => {
        const improved = { ...design };
        if (feedback.aspect === 'scalability') {
            improved.components.push('load-balancer', 'cache');
            improved.scalability = 0.8;
        }
        else if (feedback.aspect === 'reliability') {
            improved.components.push('db-replica', 'health-monitor');
            improved.reliability = 0.9;
        }
        else if (feedback.aspect === 'patterns') {
            improved.patterns.push('Circuit Breaker', 'Retry');
        }
        return improved;
    };
    const result = await loop.run(generate, evaluate, refine);
    console.log((0, refinement_loop_1.formatRefinementResult)(result));
    console.log('\nFinal Architecture:');
    console.log(JSON.stringify(result.candidate, null, 2));
    console.log('\n');
}
// ============================================================================
// EXAMPLE 4: Cost-Aware Refinement
// ============================================================================
async function example4_CostAwareRefinement() {
    console.log('=== Example 4: Cost-Aware Refinement ===\n');
    const config = {
        maxIterations: 10,
        confidenceThreshold: 0.95,
        processSupervision: true,
        costBudget: 100 // Stop if cost exceeds 100 tokens
    };
    const loop = new refinement_loop_1.RefinementLoop(config);
    let generationCount = 0;
    const generate = async () => {
        generationCount++;
        return Math.random();
    };
    const evaluate = async (value) => {
        // Evaluate how close to target (0.95)
        const distance = Math.abs(0.95 - value);
        const score = Math.max(0, 1 - distance);
        return (0, refinement_loop_1.createEvaluation)(score, score < 0.95 ? [(0, refinement_loop_1.createFeedback)('Not close enough to target', 'minor')] : [], `Distance from target: ${distance.toFixed(4)}`, 15 // Each evaluation costs 15 tokens
        );
    };
    const refine = async (_value, _feedback) => {
        // Refine by generating a new random value (simple example)
        return Math.random();
    };
    const result = await loop.run(generate, evaluate, refine);
    console.log((0, refinement_loop_1.formatRefinementResult)(result));
    console.log(`\nGeneration attempts: ${generationCount}`);
    console.log(`Final value: ${result.candidate}`);
    console.log(`Cost budget remaining: ${loop.getRemainingBudget()}`);
    console.log('\n');
}
// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================
async function runAllExamples() {
    try {
        await example1_CodeQualityRefinement();
        await example2_SimpleRefinement();
        await example3_ArchitectureRefinement();
        await example4_CostAwareRefinement();
    }
    catch (error) {
        console.error('Error running examples:', error);
    }
}
// Run if executed directly
if (require.main === module) {
    runAllExamples().then(() => {
        console.log('All examples completed!');
    });
}
//# sourceMappingURL=refinement-loop.example.js.map