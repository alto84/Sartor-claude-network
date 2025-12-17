# A/B Testing Framework

Evidence-based validation framework for comparing code improvements, configuration changes, and system variants.

## Overview

The A/B Testing Framework provides a systematic way to validate that changes improve system behavior without introducing regressions. It runs baseline and variant configurations multiple times, compares results using statistical rigor, and makes evidence-based accept/reject decisions.

## Key Features

- **Controlled Experiments**: Run baseline vs variant N times for statistical validity
- **Regression Detection**: Automatically detect tests that got worse
- **Threshold-Based Decisions**: Configure minimum improvement and maximum regression limits
- **Statistical Rigor**: No fabricated metrics, clear caveats for small sample sizes
- **Integration**: Works with existing test-suite.ts and benchmark.ts

## Quick Start

```typescript
import { runABTest, ABTestConfig } from './ab-test-runner';
import { runTests, testCases } from './test-suite';

const config: ABTestConfig = {
  name: 'Validator Improvement Test',
  description: 'Testing improved validation rules',
  baselineLabel: 'v1.0',
  testSuite: ['all'],
  minImprovement: 5,    // Require 5% improvement
  maxRegression: 0,     // No regressions allowed
  iterations: 10,       // Run 10 times each
};

// Define baseline runner
const baselineRunner = () => runTests(testCases);

// Define variant runner (with your changes)
const variantRunner = () => runTests(testCases);

// Run A/B test
const result = await runABTest(config, baselineRunner, variantRunner);

// Result includes:
// - decision: 'ACCEPT' | 'REJECT' | 'INCONCLUSIVE'
// - improvement: percentage improvement (+ or -)
// - regressions: list of tests that got worse
// - reasoning: explanation of decision
```

## Configuration

### ABTestConfig

```typescript
interface ABTestConfig {
  name: string;              // Test name
  description: string;       // What you're testing
  baselineLabel: string;     // Baseline version label
  testSuite: string[];       // Test IDs to run ('all' or specific IDs)
  minImprovement: number;    // Min % improvement to accept (0-100)
  maxRegression: number;     // Max % regression allowed (usually 0)
  iterations: number;        // How many times to run each
}
```

### Test Suite Selection

Run all tests:
```typescript
testSuite: ['all']
```

Run specific tests:
```typescript
testSuite: ['SUP-001', 'SUP-002', 'SCR-001']
```

### Iteration Guidelines

- **1-2 iterations**: Very preliminary, high variance expected
- **3-9 iterations**: Small sample size, results are preliminary
- **10+ iterations**: Reasonable sample size for validation
- **30+ iterations**: Good statistical confidence

## Decision Rules

The framework makes decisions based on these rules:

### ACCEPT
- Improvement >= minImprovement
- AND regressions.length === 0

### REJECT
- Any regression detected (test that passed in baseline fails in variant)
- OR regression exceeds maxRegression threshold

### INCONCLUSIVE
- Improvement > 0 but < minImprovement
- OR no clear improvement/regression
- OR regression within acceptable limit

## Results Structure

```typescript
interface ABTestResult {
  config: ABTestConfig;
  baselineResults: TestResults;
  variantResults: TestResults;
  improvement: number;        // % improvement (+ = better, - = worse)
  regressions: string[];      // Tests that regressed
  decision: 'ACCEPT' | 'REJECT' | 'INCONCLUSIVE';
  reasoning: string;          // Explanation of decision
  metadata: {
    timestamp: string;
    baselineExecutions: number;
    variantExecutions: number;
    statisticalNotes: string[];
  };
}
```

## Example Use Cases

### Testing Validator Changes

```typescript
import { validate } from './validator';
import { runTests } from './test-suite';

// Create modified validator in separate file
import { validateV2 } from './validator-v2';

const config: ABTestConfig = {
  name: 'Validator V2 Test',
  description: 'Testing improved superlative detection',
  baselineLabel: 'v1.0',
  testSuite: ['SUP-001', 'SUP-002', 'SUP-003', 'SUP-004'],
  minImprovement: 10,
  maxRegression: 0,
  iterations: 10,
};

// Baseline: current validator
const baseline = () => {
  // Run tests with v1 validator
  return runTests(testCases);
};

// Variant: new validator
const variant = () => {
  // Temporarily swap validator implementation
  // Run tests with v2 validator
  return runTests(testCases);
};

const result = await runABTest(config, baseline, variant);
```

### Testing Configuration Changes

```typescript
const config: ABTestConfig = {
  name: 'Memory Cache Size Test',
  description: 'Testing increased cache size impact',
  baselineLabel: 'cache-100',
  testSuite: ['all'],
  minImprovement: 15, // Expect performance improvement
  maxRegression: 0,
  iterations: 20,
};

const baseline = () => {
  process.env.CACHE_SIZE = '100';
  return runTests(testCases);
};

const variant = () => {
  process.env.CACHE_SIZE = '500';
  return runTests(testCases);
};

const result = await runABTest(config, baseline, variant);
```

### Testing Algorithm Changes

```typescript
const config: ABTestConfig = {
  name: 'Search Algorithm Test',
  description: 'Comparing linear search vs binary search',
  baselineLabel: 'linear-search',
  testSuite: ['all'],
  minImprovement: 20, // Expect significant improvement
  maxRegression: 0,
  iterations: 15,
};

// Compare different implementations
const baseline = () => runTestsWithLinearSearch();
const variant = () => runTestsWithBinarySearch();

const result = await runABTest(config, baseline, variant);
```

## Integration with Benchmark Suite

The A/B framework can also compare performance benchmarks:

```typescript
import { runBenchmark } from './benchmark';

const config: ABTestConfig = {
  name: 'Performance Optimization Test',
  description: 'Testing optimized validation loop',
  baselineLabel: 'unoptimized',
  testSuite: ['all'],
  minImprovement: 25, // Expect 25% performance gain
  maxRegression: 0,
  iterations: 10,
};

// Note: This requires adapting runBenchmark to return TestSuiteReport format
// or creating a wrapper that converts BenchmarkResult to TestSuiteReport
```

## Running from CLI

```bash
# Run example A/B test
npx tsx framework/validation/ab-test-runner.ts

# Or with compiled JavaScript
npm run build
node dist/framework/validation/ab-test-runner.js
```

## Interpreting Results

### Example Output

```
======================================================================
A/B TEST REPORT
======================================================================
Test: Validator V2 Test
Description: Testing improved superlative detection
Timestamp: 2024-01-15T10:30:00.000Z

Configuration:
  Baseline: v1.0
  Test Suite: SUP-001, SUP-002, SUP-003, SUP-004
  Min Improvement: 10%
  Max Regression: 0%
  Iterations: 10

----------------------------------------------------------------------
BASELINE RESULTS:
  Total Tests: 40
  Passed: 32
  Failed: 8
  Pass Rate: 80.00%
  Avg Execution Time: 10.00ms

----------------------------------------------------------------------
VARIANT RESULTS:
  Total Tests: 40
  Passed: 38
  Failed: 2
  Pass Rate: 95.00%
  Avg Execution Time: 10.00ms

----------------------------------------------------------------------
COMPARISON:
  Improvement: 18.75%
  Regressions: 0

----------------------------------------------------------------------
DECISION: ACCEPT
Reasoning: Improvement of 18.75% meets minimum threshold of 10%; No regressions detected

Statistical Notes:
  * Sample size (10) is small; results are preliminary.
======================================================================
```

### What to Look For

1. **Decision**: ACCEPT means safe to merge/deploy
2. **Improvement**: Positive number shows % gain
3. **Regressions**: Should be 0 for ACCEPT
4. **Statistical Notes**: Important caveats about sample size
5. **Pass Rate**: Both baseline and variant rates

## Best Practices

### 1. Run Sufficient Iterations
```typescript
// Bad: Too few iterations
iterations: 1

// Good: Enough for statistical validity
iterations: 10
```

### 2. Set Realistic Thresholds
```typescript
// Bad: Expecting unrealistic improvement
minImprovement: 50

// Good: Reasonable expectation
minImprovement: 5
```

### 3. Always Check for Regressions
```typescript
// Good: Zero tolerance for regressions
maxRegression: 0
```

### 4. Use Specific Test Suites
```typescript
// When testing specific feature
testSuite: ['SUP-001', 'SUP-002', 'SUP-003']

// When testing broad changes
testSuite: ['all']
```

### 5. Understand Statistical Limitations
- Small sample sizes (< 10) are preliminary
- Results reflect test suite only, not all scenarios
- Environmental factors can introduce variance
- Always review reasoning and statistical notes

## Limitations

As documented in the framework itself:

1. **Sample Size**: Small iterations limit statistical confidence
2. **Environment**: Single-machine execution may introduce variance
3. **Test Coverage**: Results reflect test tasks only, not general performance
4. **Validation**: Pattern matching doesn't capture all quality dimensions

## API Reference

### runABTest()
```typescript
async function runABTest(
  config: ABTestConfig,
  baselineRunner: () => Promise<TestSuiteReport> | TestSuiteReport,
  variantRunner: () => Promise<TestSuiteReport> | TestSuiteReport
): Promise<ABTestResult>
```

Runs A/B test comparing baseline vs variant.

### printABTestReport()
```typescript
function printABTestReport(result: ABTestResult): void
```

Prints formatted A/B test report to console.

### runExampleABTest()
```typescript
async function runExampleABTest(): Promise<ABTestResult>
```

Runs example A/B test demonstrating framework usage.

## Contributing

When extending the A/B testing framework:

1. Maintain evidence-based approach (no fabricated metrics)
2. Document statistical limitations clearly
3. Provide clear reasoning for decisions
4. Add tests for new decision rules
5. Update this documentation

## Related Files

- `/framework/validation/test-suite.ts` - Test cases and runner
- `/framework/validation/benchmark.ts` - Performance benchmarks
- `/framework/validation/validator.ts` - Validation engine
- `/CLAUDE.md` - Anti-fabrication protocols
