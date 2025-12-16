/**
 * Performance Benchmark Suite for Validation Framework
 *
 * Measures actual performance of validator rules under various conditions.
 * All results are measured values - no fabrication.
 */

import { validate, validateAndSuggest } from './validator.ts';

// Types
interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTimeMs: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  contentLength: number;
  opsPerSecond: number;
}

interface BenchmarkSuite {
  name: string;
  timestamp: string;
  nodeVersion: string;
  results: BenchmarkResult[];
  summary: {
    totalBenchmarks: number;
    totalIterations: number;
    totalTimeMs: number;
  };
}

// Test content of varying sizes
const testContents = {
  small: 'This is a short test string.',
  medium: `This is a medium-length test string that contains some content for
validation. It includes a few sentences to simulate typical agent output.
The validation framework should process this reasonably quickly.`,
  large: `This is a larger test document that simulates more extensive agent output.
It contains multiple paragraphs and various types of content that the validation
framework might encounter in production use.

The document includes various elements like numerical references (based on measured data),
appropriate uncertainty language (preliminary observations suggest), and proper citation
formats [Author, 2024]. This helps test the validation rules comprehensively.

Additional content is included here to increase the document size and test how the
validation framework handles larger inputs. Performance is important when validating
extensive agent outputs in real-time scenarios.

The framework should be able to process documents of this size efficiently while
maintaining accuracy in detection of various validation issues.`,
  problematic: `This is an exceptional solution with 95% accuracy that will definitely
work perfectly every time. Research indicates this is the best approach. The system
is world-class and industry-leading with outstanding performance.`,
  clean: `Based on measured test results (n=100), the system achieved 82.3% accuracy.
Preliminary observations suggest the approach is viable, though validation is needed.
Limitations include the sample size and testing environment constraints.
According to [Smith et al., 2024], similar systems show comparable results.`,
};

// Generate very large content for stress testing
function generateLargeContent(paragraphs: number): string {
  const baseParagraph = `This paragraph tests validation performance with typical content.
It includes some numerical data (measured at 45 operations) and proper attribution.
The framework should handle this efficiently under load. `;
  return Array(paragraphs).fill(baseParagraph).join('\n\n');
}

// High precision timer
function measureTime(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

// Run a single benchmark
function runBenchmark(
  name: string,
  content: string,
  iterations: number = 1000
): BenchmarkResult {
  const times: number[] = [];

  // Warm-up runs
  for (let i = 0; i < 10; i++) {
    validate(content);
  }

  // Measured runs
  for (let i = 0; i < iterations; i++) {
    const time = measureTime(() => validate(content));
    times.push(time);
  }

  const totalTimeMs = times.reduce((a, b) => a + b, 0);

  return {
    name,
    iterations,
    totalTimeMs,
    avgTimeMs: totalTimeMs / iterations,
    minTimeMs: Math.min(...times),
    maxTimeMs: Math.max(...times),
    contentLength: content.length,
    opsPerSecond: (iterations / totalTimeMs) * 1000,
  };
}

// Format number with precision
function formatNum(n: number, decimals: number = 3): string {
  return n.toFixed(decimals);
}

// Run full benchmark suite
function runBenchmarkSuite(): BenchmarkSuite {
  console.log('=== Validation Framework Benchmark Suite ===\n');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Node Version: ${process.version}\n`);

  const results: BenchmarkResult[] = [];

  // Benchmark 1: Small content
  console.log('Running: Small content validation...');
  results.push(runBenchmark('small-content', testContents.small, 5000));

  // Benchmark 2: Medium content
  console.log('Running: Medium content validation...');
  results.push(runBenchmark('medium-content', testContents.medium, 3000));

  // Benchmark 3: Large content
  console.log('Running: Large content validation...');
  results.push(runBenchmark('large-content', testContents.large, 2000));

  // Benchmark 4: Problematic content (many violations)
  console.log('Running: Problematic content validation...');
  results.push(runBenchmark('problematic-content', testContents.problematic, 2000));

  // Benchmark 5: Clean content (no violations)
  console.log('Running: Clean content validation...');
  results.push(runBenchmark('clean-content', testContents.clean, 2000));

  // Benchmark 6: Very large content (stress test)
  console.log('Running: Large document stress test...');
  const largeDoc = generateLargeContent(50);
  results.push(runBenchmark('stress-test-large', largeDoc, 500));

  // Benchmark 7: Very large content (extreme stress test)
  console.log('Running: Extreme stress test...');
  const veryLargeDoc = generateLargeContent(200);
  results.push(runBenchmark('stress-test-extreme', veryLargeDoc, 100));

  // Benchmark 8: validateAndSuggest function
  console.log('Running: validateAndSuggest benchmark...');
  const validateAndSuggestTimes: number[] = [];
  for (let i = 0; i < 1000; i++) {
    const time = measureTime(() => validateAndSuggest(testContents.problematic));
    validateAndSuggestTimes.push(time);
  }
  const vasTotal = validateAndSuggestTimes.reduce((a, b) => a + b, 0);
  results.push({
    name: 'validate-and-suggest',
    iterations: 1000,
    totalTimeMs: vasTotal,
    avgTimeMs: vasTotal / 1000,
    minTimeMs: Math.min(...validateAndSuggestTimes),
    maxTimeMs: Math.max(...validateAndSuggestTimes),
    contentLength: testContents.problematic.length,
    opsPerSecond: (1000 / vasTotal) * 1000,
  });

  console.log('\n=== Results ===\n');

  // Print results table
  console.log('| Benchmark | Content (chars) | Iterations | Avg (ms) | Min (ms) | Max (ms) | Ops/sec |');
  console.log('|-----------|-----------------|------------|----------|----------|----------|---------|');

  for (const r of results) {
    console.log(
      `| ${r.name.padEnd(19)} | ${String(r.contentLength).padStart(15)} | ${String(r.iterations).padStart(10)} | ${formatNum(r.avgTimeMs).padStart(8)} | ${formatNum(r.minTimeMs).padStart(8)} | ${formatNum(r.maxTimeMs).padStart(8)} | ${formatNum(r.opsPerSecond, 0).padStart(7)} |`
    );
  }

  const totalIterations = results.reduce((a, r) => a + r.iterations, 0);
  const totalTime = results.reduce((a, r) => a + r.totalTimeMs, 0);

  console.log('\n=== Summary ===\n');
  console.log(`Total benchmarks: ${results.length}`);
  console.log(`Total iterations: ${totalIterations}`);
  console.log(`Total time: ${formatNum(totalTime, 1)} ms`);
  console.log(`Overall throughput: ${formatNum((totalIterations / totalTime) * 1000, 0)} ops/sec`);

  // Performance analysis
  console.log('\n=== Analysis ===\n');

  const avgOps = results.reduce((a, r) => a + r.opsPerSecond, 0) / results.length;
  const smallOps = results.find(r => r.name === 'small-content')?.opsPerSecond || 0;
  const largeOps = results.find(r => r.name === 'large-content')?.opsPerSecond || 0;
  const scalingFactor = smallOps / largeOps;

  console.log(`Average throughput across all benchmarks: ${formatNum(avgOps, 0)} ops/sec`);
  console.log(`Small to large content scaling factor: ${formatNum(scalingFactor, 2)}x`);

  // Detect potential issues
  const slowBenchmarks = results.filter(r => r.avgTimeMs > 1.0);
  if (slowBenchmarks.length > 0) {
    console.log(`\nNote: ${slowBenchmarks.length} benchmark(s) exceeded 1ms average.`);
  }

  return {
    name: 'validation-benchmark',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    results,
    summary: {
      totalBenchmarks: results.length,
      totalIterations,
      totalTimeMs: totalTime,
    },
  };
}

// Export for programmatic use
export { runBenchmarkSuite, runBenchmark, BenchmarkResult, BenchmarkSuite };

// CLI entry point
if (process.argv[1]?.endsWith('benchmark.ts')) {
  const suite = runBenchmarkSuite();

  // Optionally save results to file
  if (process.argv.includes('--save')) {
    const { writeFileSync } = await import('fs');
    const outputPath = `.swarm/artifacts/benchmark-${Date.now()}.json`;
    writeFileSync(outputPath, JSON.stringify(suite, null, 2));
    console.log(`\nResults saved to: ${outputPath}`);
  }
}
