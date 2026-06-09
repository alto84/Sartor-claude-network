/**
 * End-to-End Integration Test
 *
 * Tests the complete workflow:
 * 1. Generate sample agent output
 * 2. Validate it with validator.ts
 * 3. Store result in memory
 * 4. Query stored results
 * 5. Update state
 */

import { validate, validateAndSuggest } from './validator.js';
import * as fs from 'fs';
import * as path from 'path';

// Types
interface IntegrationTestResult {
  testName: string;
  passed: boolean;
  steps: {
    name: string;
    passed: boolean;
    output?: string;
    error?: string;
  }[];
  timestamp: string;
}

interface TestSuite {
  totalTests: number;
  passed: number;
  failed: number;
  results: IntegrationTestResult[];
  timestamp: string;
}

// Memory storage helper (inline to avoid require.main issues in memory-store)
// Use absolute path to avoid issues when running from different directories
const PROJECT_ROOT = '/home/alton/claude-swarm';
const MEMORY_PATH = path.join(PROJECT_ROOT, '.swarm/memory');

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function storeValidationResult(result: any): string {
  const memoryDir = path.join(MEMORY_PATH, 'validation-results');
  ensureDir(memoryDir);

  const filename = `validation-${Date.now()}.json`;
  const filepath = path.join(memoryDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
  return filepath;
}

function queryValidationResults(limit: number = 10): any[] {
  const memoryDir = path.join(MEMORY_PATH, 'validation-results');
  if (!fs.existsSync(memoryDir)) return [];

  const files = fs.readdirSync(memoryDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, limit);

  return files.map(f => {
    const content = fs.readFileSync(path.join(memoryDir, f), 'utf-8');
    return JSON.parse(content);
  });
}

// State update helper
function updateState(updates: Record<string, any>): void {
  const statePath = path.join(PROJECT_ROOT, '.swarm/artifacts/STATE.json');
  let state: any = {};

  if (fs.existsSync(statePath)) {
    state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  }

  Object.assign(state, updates);
  state.last_updated = new Date().toISOString();

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// Sample agent outputs for testing
const sampleOutputs = {
  clean: `
    The function processes user input and returns a formatted result.
    Implementation follows standard patterns with appropriate error handling.
    Based on the code analysis, the following observations were made:
    - Input validation is present
    - Error handling covers main failure cases
    - Output format is consistent

    Limitations include potential edge cases with Unicode input.
    Further testing is recommended to validate behavior.
  `,

  withSuperlatives: `
    This is an exceptional implementation that provides world-class performance.
    The outstanding code quality makes it industry-leading.
    Results show 95% accuracy.
  `,

  withFabricatedScores: `
    The analysis shows 87% accuracy and a score of 9/10.
    Performance rating: A+
    This solution is 3x faster than alternatives.
  `,

  withAbsoluteClaims: `
    This solution will definitely work in all cases.
    It never fails and is 100% reliable.
    The perfect solution for any use case.
  `,

  withCitations: `
    Studies show that this approach improves performance [Smith et al., 2024].
    According to https://example.com/research, the measured accuracy is 85%.
    Based on our test suite (n=1000, measured 2024-12-15), pass rate is 94.4%.
  `,
};

// Integration tests
async function runIntegrationTests(): Promise<TestSuite> {
  const results: IntegrationTestResult[] = [];

  // Test 1: Clean output should pass validation
  results.push(await runTest('Clean Output Validation', async () => {
    const steps: IntegrationTestResult['steps'] = [];

    // Step 1: Validate
    const report = validate(sampleOutputs.clean);
    steps.push({
      name: 'Validate clean output',
      passed: report.passed,
      output: `Errors: ${report.summary.errors}, Warnings: ${report.summary.warnings}`,
    });

    // Step 2: Store result
    const storagePath = storeValidationResult(report);
    const stored = fs.existsSync(storagePath);
    steps.push({
      name: 'Store validation result',
      passed: stored,
      output: `Stored at: ${storagePath}`,
    });

    // Step 3: Query stored results
    const queried = queryValidationResults(1);
    steps.push({
      name: 'Query stored results',
      passed: queried.length > 0,
      output: `Retrieved ${queried.length} results`,
    });

    return steps;
  }));

  // Test 2: Output with superlatives should fail
  results.push(await runTest('Superlative Detection', async () => {
    const steps: IntegrationTestResult['steps'] = [];

    const report = validate(sampleOutputs.withSuperlatives);
    steps.push({
      name: 'Detect superlatives',
      passed: !report.passed && report.summary.errors > 0,
      output: `Detected ${report.summary.errors} superlative errors`,
    });

    // Verify specific superlatives were caught
    const foundWords = report.results
      .filter(r => r.rule === 'no-superlatives')
      .map(r => r.message);
    steps.push({
      name: 'Catch specific banned words',
      passed: foundWords.length >= 3,
      output: `Caught: ${foundWords.length} banned words`,
    });

    return steps;
  }));

  // Test 3: Output with fabricated scores should warn
  results.push(await runTest('Score Fabrication Detection', async () => {
    const steps: IntegrationTestResult['steps'] = [];

    const report = validate(sampleOutputs.withFabricatedScores);
    const scoreWarnings = report.results.filter(r => r.rule === 'no-fabricated-scores');

    steps.push({
      name: 'Detect fabricated scores',
      passed: scoreWarnings.length > 0,
      output: `Detected ${scoreWarnings.length} score fabrication warnings`,
    });

    return steps;
  }));

  // Test 4: Output with absolute claims should warn
  results.push(await runTest('Absolute Claim Detection', async () => {
    const steps: IntegrationTestResult['steps'] = [];

    const report = validate(sampleOutputs.withAbsoluteClaims);
    const uncertaintyWarnings = report.results.filter(r => r.rule === 'requires-uncertainty');

    steps.push({
      name: 'Detect absolute claims',
      passed: uncertaintyWarnings.length > 0,
      output: `Detected ${uncertaintyWarnings.length} absolute claim warnings`,
    });

    return steps;
  }));

  // Test 5: Output with proper citations should pass
  results.push(await runTest('Citation Recognition', async () => {
    const steps: IntegrationTestResult['steps'] = [];

    const report = validate(sampleOutputs.withCitations);
    const evidenceErrors = report.results.filter(r => r.rule === 'evidence-required');

    steps.push({
      name: 'Accept proper citations',
      passed: evidenceErrors.length === 0,
      output: `Evidence errors: ${evidenceErrors.length}`,
    });

    return steps;
  }));

  // Test 6: Full E2E workflow
  results.push(await runTest('Full E2E Workflow', async () => {
    const steps: IntegrationTestResult['steps'] = [];

    // Generate output
    const output = `
      Analysis complete. Based on measured test results (n=50 samples):
      - 47 tests passed, 3 tests failed
      - Pass rate: ${((47/50) * 100).toFixed(1)}% (calculated from 47/50)

      Limitations: Sample size is small; results are preliminary.
      Requires external validation for production use.
    `;
    steps.push({
      name: 'Generate sample output',
      passed: true,
      output: 'Generated evidence-based output',
    });

    // Validate
    const report = validate(output);
    steps.push({
      name: 'Validate output',
      passed: report.passed,
      output: `Validation passed: ${report.passed}`,
    });

    // Store
    const storagePath = storeValidationResult({
      ...report,
      testRun: 'e2e-workflow',
      originalContent: output,
    });
    steps.push({
      name: 'Store in memory',
      passed: fs.existsSync(storagePath),
      output: `Stored at: ${storagePath}`,
    });

    // Query
    const results = queryValidationResults(5);
    steps.push({
      name: 'Query memory',
      passed: results.length > 0,
      output: `Found ${results.length} stored results`,
    });

    return steps;
  }));

  // Calculate totals
  const passed = results.filter(r => r.passed).length;

  return {
    totalTests: results.length,
    passed,
    failed: results.length - passed,
    results,
    timestamp: new Date().toISOString(),
  };
}

// Test runner helper
async function runTest(
  name: string,
  testFn: () => Promise<IntegrationTestResult['steps']>
): Promise<IntegrationTestResult> {
  try {
    const steps = await testFn();
    const passed = steps.every(s => s.passed);

    return {
      testName: name,
      passed,
      steps,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      testName: name,
      passed: false,
      steps: [{
        name: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      }],
      timestamp: new Date().toISOString(),
    };
  }
}

// Print results
function printResults(suite: TestSuite): void {
  console.log('='.repeat(70));
  console.log('INTEGRATION TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Timestamp: ${suite.timestamp}`);
  console.log(`Total Tests: ${suite.totalTests}`);
  console.log(`Passed: ${suite.passed}`);
  console.log(`Failed: ${suite.failed}`);
  console.log(`Pass Rate: ${((suite.passed / suite.totalTests) * 100).toFixed(1)}% (calculated from ${suite.passed}/${suite.totalTests})`);
  console.log('-'.repeat(70));

  for (const result of suite.results) {
    const status = result.passed ? '✓' : '✗';
    console.log(`\n${status} ${result.testName}`);

    for (const step of result.steps) {
      const stepStatus = step.passed ? '  ✓' : '  ✗';
      console.log(`${stepStatus} ${step.name}`);
      if (step.output) console.log(`      ${step.output}`);
      if (step.error) console.log(`      ERROR: ${step.error}`);
    }
  }

  console.log('\n' + '='.repeat(70));

  // Anti-fabrication compliance note
  console.log('Note: All percentages are calculated from measured test results.');
  console.log('No scores have been fabricated or estimated.');
}

// Main execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  console.log('Running End-to-End Integration Tests...\n');

  runIntegrationTests().then(suite => {
    printResults(suite);

    // Update state with test results
    updateState({
      integration_test_results: {
        total: suite.totalTests,
        passed: suite.passed,
        failed: suite.failed,
        pass_rate: `${((suite.passed / suite.totalTests) * 100).toFixed(1)}%`,
        timestamp: suite.timestamp,
      },
      integration_tests_complete: true,
    });

    console.log('\nState updated with test results.');

    // Exit with appropriate code
    process.exit(suite.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export { runIntegrationTests, sampleOutputs };
