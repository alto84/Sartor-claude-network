/**
 * Acceptance Gate Example - Demonstrates usage of the conservative acceptance gate
 */

import {
  createAcceptanceGate,
  ModificationProposal,
  printDecision,
} from './acceptance-gate';

console.log('='.repeat(70));
console.log('ACCEPTANCE GATE - CONSERVATIVE SELF-IMPROVEMENT EXAMPLE');
console.log('='.repeat(70));
console.log();

// Example 1: Proposal that should be ACCEPTED
console.log('Example 1: Strong Improvement (2+ tests, no regressions)');
console.log('-'.repeat(70));

const goodProposal: ModificationProposal = {
  id: 'mod-001',
  type: 'addition',
  target: 'prompts/code-generation.md',
  description: 'Add explicit error handling requirements to code generation prompts',
  hypothesis:
    'Explicit error handling requirements will reduce code generation test failures based on observed pattern of missing try-catch blocks',
  testResults: [
    {
      testId: 'ab-test-001',
      task: { id: 'task-code-gen', name: 'Code Generation Quality' },
      configA: {
        name: 'baseline-v1.0',
        results: [
          { taskId: 'task-code-gen', success: true, validationPassed: true },
          { taskId: 'task-code-gen', success: true, validationPassed: true },
          { taskId: 'task-code-gen', success: false, validationPassed: false },
          { taskId: 'task-code-gen', success: false, validationPassed: false },
          { taskId: 'task-code-gen', success: true, validationPassed: true },
        ],
      },
      configB: {
        name: 'candidate-v1.1',
        results: [
          { taskId: 'task-code-gen', success: true, validationPassed: true },
          { taskId: 'task-code-gen', success: true, validationPassed: true },
          { taskId: 'task-code-gen', success: true, validationPassed: true },
          { taskId: 'task-code-gen', success: true, validationPassed: true },
          { taskId: 'task-code-gen', success: true, validationPassed: true },
        ],
      },
      comparison: {
        successRateA: 0.6, // 60% baseline
        successRateB: 1.0, // 100% candidate (40% improvement)
        validationPassRateA: 0.6,
        validationPassRateB: 1.0,
        sampleSize: 5,
        notes: ['Sample size is small; results are preliminary.'],
      },
    },
    {
      testId: 'ab-test-002',
      task: { id: 'task-error-handling', name: 'Error Handling Coverage' },
      configA: {
        name: 'baseline-v1.0',
        results: [
          { taskId: 'task-error-handling', success: false, validationPassed: false },
          { taskId: 'task-error-handling', success: false, validationPassed: false },
          { taskId: 'task-error-handling', success: true, validationPassed: true },
        ],
      },
      configB: {
        name: 'candidate-v1.1',
        results: [
          { taskId: 'task-error-handling', success: true, validationPassed: true },
          { taskId: 'task-error-handling', success: true, validationPassed: true },
          { taskId: 'task-error-handling', success: true, validationPassed: true },
        ],
      },
      comparison: {
        successRateA: 0.33, // 33% baseline
        successRateB: 1.0, // 100% candidate (67% improvement)
        validationPassRateA: 0.33,
        validationPassRateB: 1.0,
        sampleSize: 3,
        notes: [],
      },
    },
  ],
  timestamp: new Date().toISOString(),
};

const gate = createAcceptanceGate('.swarm/decisions');
const decision1 = gate.evaluate(goodProposal);
printDecision(decision1);

console.log('\n');

// Example 2: Proposal that should be REJECTED (regression)
console.log('Example 2: Regression Detected (must reject)');
console.log('-'.repeat(70));

const badProposal: ModificationProposal = {
  id: 'mod-002',
  type: 'reword',
  target: 'prompts/analysis.md',
  description: 'Simplify analysis prompt wording for clarity',
  hypothesis: 'Simpler language will improve comprehension and analysis quality',
  testResults: [
    {
      testId: 'ab-test-003',
      task: { id: 'task-analysis', name: 'Code Analysis' },
      configA: {
        name: 'baseline-v1.0',
        results: [
          { taskId: 'task-analysis', success: true, validationPassed: true },
          { taskId: 'task-analysis', success: true, validationPassed: true },
          { taskId: 'task-analysis', success: true, validationPassed: true },
          { taskId: 'task-analysis', success: true, validationPassed: true },
        ],
      },
      configB: {
        name: 'candidate-v1.1',
        results: [
          { taskId: 'task-analysis', success: true, validationPassed: true },
          { taskId: 'task-analysis', success: false, validationPassed: false },
          { taskId: 'task-analysis', success: true, validationPassed: true },
          { taskId: 'task-analysis', success: false, validationPassed: false },
        ],
      },
      comparison: {
        successRateA: 1.0, // 100% baseline
        successRateB: 0.5, // 50% candidate (50% regression!)
        validationPassRateA: 1.0,
        validationPassRateB: 0.5,
        sampleSize: 4,
        notes: [],
      },
    },
  ],
  timestamp: new Date().toISOString(),
};

const decision2 = gate.evaluate(badProposal);
printDecision(decision2);

console.log('\n');

// Example 3: Proposal that should be REJECTED (only 1 test improved)
console.log('Example 3: Insufficient Improvement (only 1 test improved)');
console.log('-'.repeat(70));

const weakProposal: ModificationProposal = {
  id: 'mod-003',
  type: 'addition',
  target: 'prompts/general.md',
  description: 'Add verbosity requirement to prompt',
  hypothesis: 'Requesting more verbose output will improve clarity',
  testResults: [
    {
      testId: 'ab-test-004',
      task: { id: 'task-clarity', name: 'Output Clarity' },
      configA: {
        name: 'baseline-v1.0',
        results: [
          { taskId: 'task-clarity', success: false, validationPassed: false },
          { taskId: 'task-clarity', success: false, validationPassed: false },
          { taskId: 'task-clarity', success: false, validationPassed: false },
        ],
      },
      configB: {
        name: 'candidate-v1.1',
        results: [
          { taskId: 'task-clarity', success: true, validationPassed: true },
          { taskId: 'task-clarity', success: true, validationPassed: true },
          { taskId: 'task-clarity', success: true, validationPassed: true },
        ],
      },
      comparison: {
        successRateA: 0.0,
        successRateB: 1.0, // Big improvement, but only 1 test
        validationPassRateA: 0.0,
        validationPassRateB: 1.0,
        sampleSize: 3,
        notes: [],
      },
    },
  ],
  timestamp: new Date().toISOString(),
};

const decision3 = gate.evaluate(weakProposal);
printDecision(decision3);

console.log('\n');

// Example 4: Proposal that should be REJECTED (fabrication detected)
console.log('Example 4: Fabrication Detected (must reject)');
console.log('-'.repeat(70));

const fabricatedProposal: ModificationProposal = {
  id: 'mod-004',
  type: 'addition',
  target: 'prompts/test.md',
  description: 'This exceptional change will achieve 99% accuracy',
  hypothesis: 'Outstanding improvements will definitely work',
  testResults: [], // No actual test results!
  timestamp: new Date().toISOString(),
};

const decision4 = gate.evaluate(fabricatedProposal);
printDecision(decision4);

console.log('\n');

// Example 5: Proposal needing human review (safety-related)
console.log('Example 5: Human Review Required (safety modification)');
console.log('-'.repeat(70));

const safetyProposal: ModificationProposal = {
  id: 'mod-005',
  type: 'reword',
  target: 'prompts/safety-constraints.md',
  description: 'Clarify safety constraint wording for better understanding',
  hypothesis: 'Clearer safety constraints will reduce unsafe outputs',
  testResults: [
    {
      testId: 'ab-test-005',
      task: { id: 'task-safety', name: 'Safety Compliance' },
      configA: {
        name: 'baseline-v1.0',
        results: [
          { taskId: 'task-safety', success: true, validationPassed: true },
          { taskId: 'task-safety', success: false, validationPassed: false },
          { taskId: 'task-safety', success: true, validationPassed: true },
        ],
      },
      configB: {
        name: 'candidate-v1.1',
        results: [
          { taskId: 'task-safety', success: true, validationPassed: true },
          { taskId: 'task-safety', success: true, validationPassed: true },
          { taskId: 'task-safety', success: true, validationPassed: true },
        ],
      },
      comparison: {
        successRateA: 0.67,
        successRateB: 1.0,
        validationPassRateA: 0.67,
        validationPassRateB: 1.0,
        sampleSize: 3,
        notes: [],
      },
    },
    {
      testId: 'ab-test-006',
      task: { id: 'task-harmful-detect', name: 'Harmful Request Detection' },
      configA: {
        name: 'baseline-v1.0',
        results: [
          { taskId: 'task-harmful-detect', success: false, validationPassed: false },
          { taskId: 'task-harmful-detect', success: true, validationPassed: true },
          { taskId: 'task-harmful-detect', success: true, validationPassed: true },
        ],
      },
      configB: {
        name: 'candidate-v1.1',
        results: [
          { taskId: 'task-harmful-detect', success: true, validationPassed: true },
          { taskId: 'task-harmful-detect', success: true, validationPassed: true },
          { taskId: 'task-harmful-detect', success: true, validationPassed: true },
        ],
      },
      comparison: {
        successRateA: 0.67,
        successRateB: 1.0,
        validationPassRateA: 0.67,
        validationPassRateB: 1.0,
        sampleSize: 3,
        notes: [],
      },
    },
  ],
  timestamp: new Date().toISOString(),
};

const decision5 = gate.evaluate(safetyProposal);
printDecision(decision5);

console.log('\n');
console.log('='.repeat(70));
console.log('SUMMARY OF ACCEPTANCE CRITERIA');
console.log('='.repeat(70));
console.log();
console.log('ACCEPT:');
console.log('  - 2+ tests improved by >10%');
console.log('  - 0 regressions (zero tolerance)');
console.log('  - No fabricated scores detected');
console.log('  - All acceptances require human review');
console.log();
console.log('REJECT:');
console.log('  - Any regression detected');
console.log('  - Fewer than 2 tests improved');
console.log('  - No measurable improvement');
console.log('  - Fabricated scores or superlatives detected');
console.log();
console.log('REVIEW_NEEDED:');
console.log('  - Safety-related modifications');
console.log('  - Immutable component changes');
console.log('  - Architectural modifications');
console.log('  - Removal type changes (higher risk)');
console.log();
console.log('='.repeat(70));
