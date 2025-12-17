/**
 * A/B Testing Framework - Usage Examples
 *
 * Demonstrates real-world usage patterns for the A/B testing framework.
 */

import { runABTest, ABTestConfig, printABTestReport } from '../ab-test-runner';
import { runTests, testCases, TestCase } from '../test-suite';
import { validate } from '../validator';

/**
 * Example 1: Testing validation rule changes
 *
 * Scenario: You've modified the superlative detection to catch more cases.
 * You want to verify it improves detection without breaking existing tests.
 */
export async function example1_ValidationRuleImprovement() {
  console.log('\n=== EXAMPLE 1: Validation Rule Improvement ===\n');

  const config: ABTestConfig = {
    name: 'Improved Superlative Detection',
    description: 'Testing enhanced superlative pattern matching',
    baselineLabel: 'v1.0-current',
    testSuite: ['SUP-001', 'SUP-002', 'SUP-003', 'SUP-004', 'SUP-005'],
    minImprovement: 10, // Require 10% improvement
    maxRegression: 0,   // No regressions allowed
    iterations: 5,      // Run 5 times for better confidence
  };

  // Baseline: Current validator
  const baseline = () => {
    const filtered = testCases.filter(tc => config.testSuite.includes(tc.testId));
    return runTests(filtered);
  };

  // Variant: Would use modified validator
  // In real usage, this would import from a modified validator file
  const variant = () => {
    const filtered = testCases.filter(tc => config.testSuite.includes(tc.testId));
    return runTests(filtered);
  };

  const result = await runABTest(config, baseline, variant);
  printABTestReport(result);

  return result;
}

/**
 * Example 2: Testing performance optimization
 *
 * Scenario: You've optimized the validation loop. You want to ensure
 * it maintains correctness while improving speed.
 */
export async function example2_PerformanceOptimization() {
  console.log('\n=== EXAMPLE 2: Performance Optimization ===\n');

  const config: ABTestConfig = {
    name: 'Optimized Validation Loop',
    description: 'Testing performance improvements without correctness loss',
    baselineLabel: 'v1.0-unoptimized',
    testSuite: ['all'],
    minImprovement: 0, // Any improvement is good
    maxRegression: 0,  // But no loss in correctness
    iterations: 10,    // More iterations for performance tests
  };

  const baseline = () => runTests(testCases);
  const variant = () => runTests(testCases);

  const result = await runABTest(config, baseline, variant);
  printABTestReport(result);

  return result;
}

/**
 * Example 3: Testing new validation rule
 *
 * Scenario: Adding a new rule to catch citation format issues.
 * You want to ensure it catches problems without false positives.
 */
export async function example3_NewValidationRule() {
  console.log('\n=== EXAMPLE 3: New Validation Rule ===\n');

  const config: ABTestConfig = {
    name: 'Citation Format Rule',
    description: 'Testing new citation format validation',
    baselineLabel: 'v1.0-without-citation-check',
    testSuite: ['CIT-001', 'CIT-002', 'CIT-003', 'CIT-004', 'CIT-005', 'CIT-006'],
    minImprovement: 15, // Should catch significantly more issues
    maxRegression: 0,
    iterations: 5,
  };

  const baseline = () => {
    const filtered = testCases.filter(tc => config.testSuite.includes(tc.testId));
    return runTests(filtered);
  };

  const variant = () => {
    const filtered = testCases.filter(tc => config.testSuite.includes(tc.testId));
    return runTests(filtered);
  };

  const result = await runABTest(config, baseline, variant);
  printABTestReport(result);

  return result;
}

/**
 * Example 4: Testing configuration change
 *
 * Scenario: Adjusting threshold values for what constitutes a violation.
 * You want to find the right balance.
 */
export async function example4_ConfigurationTuning() {
  console.log('\n=== EXAMPLE 4: Configuration Tuning ===\n');

  const config: ABTestConfig = {
    name: 'Threshold Adjustment',
    description: 'Testing adjusted violation thresholds',
    baselineLabel: 'strict-thresholds',
    testSuite: ['all'],
    minImprovement: 5,
    maxRegression: 2, // Allow small regression if it reduces false positives
    iterations: 8,
  };

  const baseline = () => runTests(testCases);
  const variant = () => runTests(testCases);

  const result = await runABTest(config, baseline, variant);
  printABTestReport(result);

  return result;
}

/**
 * Example 5: Subset testing for focused validation
 *
 * Scenario: You only changed score fabrication detection.
 * Only test those specific cases for faster validation.
 */
export async function example5_SubsetTesting() {
  console.log('\n=== EXAMPLE 5: Subset Testing ===\n');

  const config: ABTestConfig = {
    name: 'Score Fabrication Detection Update',
    description: 'Testing improved score pattern matching',
    baselineLabel: 'v1.0-score-detection',
    testSuite: ['SCR-001', 'SCR-002', 'SCR-003', 'SCR-004', 'SCR-005'],
    minImprovement: 20, // High bar for targeted change
    maxRegression: 0,
    iterations: 7,
  };

  const baseline = () => {
    const filtered = testCases.filter(tc => config.testSuite.includes(tc.testId));
    return runTests(filtered);
  };

  const variant = () => {
    const filtered = testCases.filter(tc => config.testSuite.includes(tc.testId));
    return runTests(filtered);
  };

  const result = await runABTest(config, baseline, variant);
  printABTestReport(result);

  return result;
}

/**
 * Example 6: Multiple comparison (A/B/C testing)
 *
 * Scenario: You have multiple variants to test. Run them all against baseline
 * and pick the best one.
 */
export async function example6_MultipleVariants() {
  console.log('\n=== EXAMPLE 6: Multiple Variants ===\n');

  const baseConfig: ABTestConfig = {
    name: 'Variant Comparison',
    description: 'Testing multiple implementation approaches',
    baselineLabel: 'v1.0-baseline',
    testSuite: ['all'],
    minImprovement: 5,
    maxRegression: 0,
    iterations: 5,
  };

  const baseline = () => runTests(testCases);

  // Variant A: Conservative approach
  const variantA = () => runTests(testCases);

  // Variant B: Aggressive approach
  const variantB = () => runTests(testCases);

  // Test both variants
  const resultA = await runABTest(
    { ...baseConfig, name: 'Variant A - Conservative' },
    baseline,
    variantA
  );

  const resultB = await runABTest(
    { ...baseConfig, name: 'Variant B - Aggressive' },
    baseline,
    variantB
  );

  console.log('\n--- Variant A Results ---');
  printABTestReport(resultA);

  console.log('\n--- Variant B Results ---');
  printABTestReport(resultB);

  // Compare and recommend
  console.log('\n--- Recommendation ---');
  if (resultA.decision === 'ACCEPT' && resultB.decision === 'ACCEPT') {
    if (resultA.improvement > resultB.improvement) {
      console.log('Recommend: Variant A (higher improvement)');
    } else {
      console.log('Recommend: Variant B (higher improvement)');
    }
  } else if (resultA.decision === 'ACCEPT') {
    console.log('Recommend: Variant A (only accepted variant)');
  } else if (resultB.decision === 'ACCEPT') {
    console.log('Recommend: Variant B (only accepted variant)');
  } else {
    console.log('Recommend: Keep baseline (no variants accepted)');
  }

  return { resultA, resultB };
}

/**
 * Example 7: Iterative improvement workflow
 *
 * Scenario: You're iterating on a change. Start with quick tests,
 * then do thorough validation before merging.
 */
export async function example7_IterativeWorkflow() {
  console.log('\n=== EXAMPLE 7: Iterative Improvement Workflow ===\n');

  const baseline = () => runTests(testCases);
  const variant = () => runTests(testCases);

  // Phase 1: Quick validation (small iterations, focused tests)
  console.log('Phase 1: Quick Validation\n');
  const quickConfig: ABTestConfig = {
    name: 'Quick Validation',
    description: 'Fast check for major regressions',
    baselineLabel: 'current',
    testSuite: ['SUP-001', 'SCR-001', 'UNC-001'], // Just a few key tests
    minImprovement: 0,
    maxRegression: 0,
    iterations: 3,
  };

  const quickResult = await runABTest(
    quickConfig,
    () => runTests(testCases.filter(tc => quickConfig.testSuite.includes(tc.testId))),
    () => runTests(testCases.filter(tc => quickConfig.testSuite.includes(tc.testId)))
  );

  console.log(`Quick validation: ${quickResult.decision}`);

  if (quickResult.decision === 'REJECT') {
    console.log('Quick validation failed. Fix issues before thorough testing.\n');
    return { quick: quickResult, thorough: null };
  }

  // Phase 2: Thorough validation (more iterations, all tests)
  console.log('\nPhase 2: Thorough Validation\n');
  const thoroughConfig: ABTestConfig = {
    name: 'Thorough Validation',
    description: 'Comprehensive testing before merge',
    baselineLabel: 'current',
    testSuite: ['all'],
    minImprovement: 5,
    maxRegression: 0,
    iterations: 10,
  };

  const thoroughResult = await runABTest(thoroughConfig, baseline, variant);
  printABTestReport(thoroughResult);

  if (thoroughResult.decision === 'ACCEPT') {
    console.log('\n✓ Ready to merge!\n');
  } else {
    console.log('\n✗ Not ready to merge. Review results and iterate.\n');
  }

  return { quick: quickResult, thorough: thoroughResult };
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('ab-test-usage.ts');

if (isMainModule && process.argv[1]?.endsWith('ab-test-usage.ts')) {
  const exampleNumber = process.argv[2] || '1';

  console.log('A/B Testing Framework - Usage Examples');
  console.log('======================================\n');

  switch (exampleNumber) {
    case '1':
      example1_ValidationRuleImprovement();
      break;
    case '2':
      example2_PerformanceOptimization();
      break;
    case '3':
      example3_NewValidationRule();
      break;
    case '4':
      example4_ConfigurationTuning();
      break;
    case '5':
      example5_SubsetTesting();
      break;
    case '6':
      example6_MultipleVariants();
      break;
    case '7':
      example7_IterativeWorkflow();
      break;
    case 'all':
      (async () => {
        await example1_ValidationRuleImprovement();
        await example2_PerformanceOptimization();
        await example3_NewValidationRule();
        await example4_ConfigurationTuning();
        await example5_SubsetTesting();
        await example6_MultipleVariants();
        await example7_IterativeWorkflow();
      })();
      break;
    default:
      console.log('Usage: npx tsx ab-test-usage.ts [1-7|all]');
      console.log('\nExamples:');
      console.log('  1 - Validation Rule Improvement');
      console.log('  2 - Performance Optimization');
      console.log('  3 - New Validation Rule');
      console.log('  4 - Configuration Tuning');
      console.log('  5 - Subset Testing');
      console.log('  6 - Multiple Variants (A/B/C)');
      console.log('  7 - Iterative Workflow');
      console.log('  all - Run all examples');
  }
}
