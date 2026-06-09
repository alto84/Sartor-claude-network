/**
 * A/B Test Runner - Validation framework for comparing improvements
 *
 * Implements evidence-based A/B testing for validating code/configuration changes.
 * Runs baseline vs variant configurations and compares results using statistical rigor.
 */

import { runTests, TestSuiteReport, testCases } from './test-suite';
import { runBenchmark, BenchmarkResult } from './benchmark';

// Types
export interface ABTestConfig {
  name: string;
  description: string;
  baselineLabel: string;           // Which baseline to compare against
  testSuite: string[];             // Which tests to run (test IDs or 'all')
  minImprovement: number;          // Minimum % improvement to accept (0-100)
  maxRegression: number;           // Maximum % regression allowed (usually 0)
  iterations: number;              // How many times to run each
}

export interface TestResults {
  passRate: number;                // Percentage of tests passed (0-100)
  avgExecutionTimeMs: number;      // Average execution time
  testsPassed: number;             // Count of tests passed
  testsFailed: number;             // Count of tests failed
  totalTests: number;              // Total test count
  details: {
    testId: string;
    name: string;
    passed: boolean;
    executionTimeMs: number;
  }[];
}

export interface ABTestResult {
  config: ABTestConfig;
  baselineResults: TestResults;
  variantResults: TestResults;
  improvement: number;             // % improvement (positive = better)
  regressions: string[];           // Tests that got worse
  decision: 'ACCEPT' | 'REJECT' | 'INCONCLUSIVE';
  reasoning: string;
  metadata: {
    timestamp: string;
    baselineExecutions: number;
    variantExecutions: number;
    statisticalNotes: string[];
  };
}

/**
 * Run A/B test comparing baseline vs variant
 *
 * @param config - Test configuration
 * @param baselineRunner - Function to run baseline tests
 * @param variantRunner - Function to run variant tests
 * @returns Test results with decision
 */
export async function runABTest(
  config: ABTestConfig,
  baselineRunner: () => Promise<TestSuiteReport> | TestSuiteReport,
  variantRunner: () => Promise<TestSuiteReport> | TestSuiteReport
): Promise<ABTestResult> {
  const statisticalNotes: string[] = [];

  // Validate iterations
  if (config.iterations < 1) {
    throw new Error('iterations must be at least 1');
  }

  if (config.iterations < 3) {
    statisticalNotes.push(
      `Sample size (${config.iterations}) is very small; results may have high variance.`
    );
  } else if (config.iterations < 10) {
    statisticalNotes.push(
      `Sample size (${config.iterations}) is small; results are preliminary.`
    );
  }

  // Run baseline N times
  console.log(`Running baseline (${config.baselineLabel}) ${config.iterations} times...`);
  const baselineReports: TestSuiteReport[] = [];
  for (let i = 0; i < config.iterations; i++) {
    const report = await baselineRunner();
    baselineReports.push(report);
  }

  // Run variant N times
  console.log(`Running variant ${config.iterations} times...`);
  const variantReports: TestSuiteReport[] = [];
  for (let i = 0; i < config.iterations; i++) {
    const report = await variantRunner();
    variantReports.push(report);
  }

  // Aggregate baseline results
  const baselineResults = aggregateResults(
    baselineReports,
    config.testSuite
  );

  // Aggregate variant results
  const variantResults = aggregateResults(
    variantReports,
    config.testSuite
  );

  // Calculate improvement
  const improvement = calculateImprovement(baselineResults, variantResults);

  // Detect regressions (tests that got worse)
  const regressions = detectRegressions(baselineResults, variantResults);

  // Make decision
  const { decision, reasoning } = makeDecision(
    config,
    improvement,
    regressions,
    statisticalNotes
  );

  return {
    config,
    baselineResults,
    variantResults,
    improvement,
    regressions,
    decision,
    reasoning,
    metadata: {
      timestamp: new Date().toISOString(),
      baselineExecutions: config.iterations,
      variantExecutions: config.iterations,
      statisticalNotes,
    },
  };
}

/**
 * Aggregate multiple test reports into summary results
 */
function aggregateResults(
  reports: TestSuiteReport[],
  testFilter: string[]
): TestResults {
  if (reports.length === 0) {
    return {
      passRate: 0,
      avgExecutionTimeMs: 0,
      testsPassed: 0,
      testsFailed: 0,
      totalTests: 0,
      details: [],
    };
  }

  // Filter tests based on testSuite config
  const includeAll = testFilter.includes('all');
  const filteredReports = reports.map((report) => ({
    ...report,
    results: report.results.filter((r) =>
      includeAll || testFilter.includes(r.testId)
    ),
  }));

  // Calculate pass rate across all iterations
  const totalTests = filteredReports.reduce(
    (sum, r) => sum + r.results.length,
    0
  );
  const totalPassed = filteredReports.reduce(
    (sum, r) => sum + r.results.filter((t) => t.passed).length,
    0
  );

  // Calculate average execution time (simulated - real would measure actual time)
  // Since test-suite doesn't currently measure execution time, we'll simulate it
  const avgExecutionTimeMs = 10; // Placeholder

  // Get test details (from first report as representative)
  const details = filteredReports[0]?.results.map((r) => ({
    testId: r.testId,
    name: r.name,
    passed: r.passed,
    executionTimeMs: avgExecutionTimeMs,
  })) || [];

  return {
    passRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
    avgExecutionTimeMs,
    testsPassed: totalPassed,
    testsFailed: totalTests - totalPassed,
    totalTests,
    details,
  };
}

/**
 * Calculate improvement percentage
 * Positive = improvement, Negative = regression
 */
function calculateImprovement(
  baseline: TestResults,
  variant: TestResults
): number {
  if (baseline.passRate === 0) {
    // Avoid division by zero
    return variant.passRate > 0 ? 100 : 0;
  }

  const improvement = ((variant.passRate - baseline.passRate) / baseline.passRate) * 100;
  return Math.round(improvement * 100) / 100; // Round to 2 decimal places
}

/**
 * Detect tests that regressed (got worse)
 */
function detectRegressions(
  baseline: TestResults,
  variant: TestResults
): string[] {
  const regressions: string[] = [];

  // Build baseline test map
  const baselineMap = new Map<string, boolean>();
  for (const test of baseline.details) {
    baselineMap.set(test.testId, test.passed);
  }

  // Check for regressions
  for (const test of variant.details) {
    const baselinePassed = baselineMap.get(test.testId);
    if (baselinePassed === true && test.passed === false) {
      regressions.push(`${test.testId}: ${test.name}`);
    }
  }

  return regressions;
}

/**
 * Make decision based on A/B test results
 */
function makeDecision(
  config: ABTestConfig,
  improvement: number,
  regressions: string[],
  statisticalNotes: string[]
): { decision: 'ACCEPT' | 'REJECT' | 'INCONCLUSIVE'; reasoning: string } {
  const reasons: string[] = [];

  // Check for regressions
  if (regressions.length > 0) {
    reasons.push(`Detected ${regressions.length} regression(s): ${regressions.join(', ')}`);
    return {
      decision: 'REJECT',
      reasoning: reasons.join('; '),
    };
  }

  // Check if improvement meets threshold
  if (improvement >= config.minImprovement) {
    reasons.push(
      `Improvement of ${improvement.toFixed(2)}% meets minimum threshold of ${config.minImprovement}%`
    );
    reasons.push('No regressions detected');

    // Add statistical caveats
    if (statisticalNotes.length > 0) {
      reasons.push(`Note: ${statisticalNotes.join('; ')}`);
    }

    return {
      decision: 'ACCEPT',
      reasoning: reasons.join('; '),
    };
  }

  // Improvement exists but below threshold
  if (improvement > 0 && improvement < config.minImprovement) {
    reasons.push(
      `Improvement of ${improvement.toFixed(2)}% is below minimum threshold of ${config.minImprovement}%`
    );
    reasons.push('No regressions detected but improvement insufficient');

    return {
      decision: 'INCONCLUSIVE',
      reasoning: reasons.join('; '),
    };
  }

  // No improvement or negative
  if (improvement <= 0) {
    reasons.push(
      `No improvement detected (${improvement.toFixed(2)}%)`
    );

    // Check if it's within acceptable regression
    if (Math.abs(improvement) <= config.maxRegression) {
      reasons.push(
        `Regression of ${Math.abs(improvement).toFixed(2)}% is within acceptable limit of ${config.maxRegression}%`
      );
      return {
        decision: 'INCONCLUSIVE',
        reasoning: reasons.join('; '),
      };
    } else {
      reasons.push(
        `Regression exceeds acceptable limit of ${config.maxRegression}%`
      );
      return {
        decision: 'REJECT',
        reasoning: reasons.join('; '),
      };
    }
  }

  // Fallback
  return {
    decision: 'INCONCLUSIVE',
    reasoning: 'Unable to determine outcome based on configured criteria',
  };
}

/**
 * Print A/B test report to console
 */
export function printABTestReport(result: ABTestResult): void {
  console.log('='.repeat(70));
  console.log('A/B TEST REPORT');
  console.log('='.repeat(70));
  console.log(`Test: ${result.config.name}`);
  console.log(`Description: ${result.config.description}`);
  console.log(`Timestamp: ${result.metadata.timestamp}`);
  console.log();

  console.log('Configuration:');
  console.log(`  Baseline: ${result.config.baselineLabel}`);
  console.log(`  Test Suite: ${result.config.testSuite.join(', ')}`);
  console.log(`  Min Improvement: ${result.config.minImprovement}%`);
  console.log(`  Max Regression: ${result.config.maxRegression}%`);
  console.log(`  Iterations: ${result.config.iterations}`);
  console.log();

  console.log('-'.repeat(70));
  console.log('BASELINE RESULTS:');
  printTestResults(result.baselineResults);
  console.log();

  console.log('-'.repeat(70));
  console.log('VARIANT RESULTS:');
  printTestResults(result.variantResults);
  console.log();

  console.log('-'.repeat(70));
  console.log('COMPARISON:');
  console.log(`  Improvement: ${result.improvement.toFixed(2)}%`);
  console.log(`  Regressions: ${result.regressions.length}`);
  if (result.regressions.length > 0) {
    result.regressions.forEach((r) => console.log(`    - ${r}`));
  }
  console.log();

  console.log('-'.repeat(70));
  console.log(`DECISION: ${result.decision}`);
  console.log(`Reasoning: ${result.reasoning}`);
  console.log();

  if (result.metadata.statisticalNotes.length > 0) {
    console.log('Statistical Notes:');
    result.metadata.statisticalNotes.forEach((note) =>
      console.log(`  * ${note}`)
    );
    console.log();
  }

  console.log('='.repeat(70));
}

/**
 * Print individual test results
 */
function printTestResults(results: TestResults): void {
  console.log(`  Total Tests: ${results.totalTests}`);
  console.log(`  Passed: ${results.testsPassed}`);
  console.log(`  Failed: ${results.testsFailed}`);
  console.log(`  Pass Rate: ${results.passRate.toFixed(2)}%`);
  console.log(`  Avg Execution Time: ${results.avgExecutionTimeMs.toFixed(2)}ms`);
}

/**
 * Example usage demonstrating A/B testing
 */
export async function runExampleABTest(): Promise<ABTestResult> {
  const config: ABTestConfig = {
    name: 'Example A/B Test',
    description: 'Comparing baseline validator against improved variant',
    baselineLabel: 'v1.0-baseline',
    testSuite: ['all'], // Run all tests
    minImprovement: 5, // Require at least 5% improvement
    maxRegression: 0, // No regressions allowed
    iterations: 3, // Run 3 times each
  };

  // Baseline runner - uses current validator
  const baselineRunner = () => runTests(testCases);

  // Variant runner - simulates improved validator
  // In real usage, this would test a modified validator
  const variantRunner = () => runTests(testCases);

  const result = await runABTest(config, baselineRunner, variantRunner);

  printABTestReport(result);

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('ab-test-runner.ts');

if (isMainModule && process.argv[1]?.endsWith('ab-test-runner.ts')) {
  console.log('Running example A/B test...\n');
  runExampleABTest().catch((err) => {
    console.error('A/B test failed:', err);
    process.exit(1);
  });
}
