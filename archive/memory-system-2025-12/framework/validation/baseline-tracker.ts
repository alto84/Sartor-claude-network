/**
 * Baseline Measurement System - Track and compare system metrics
 *
 * Implements measurement protocols for:
 * - Agent success rates (from coordinator results)
 * - Task completion times
 * - Memory latency (hot/warm/cold)
 * - Test pass rates
 * - Validation scores
 * - Coordinator efficiency
 *
 * All metrics are measured, not fabricated. No composite scores without calculation basis.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { runTests } from './test-suite';
import { validate } from './validator';

// Types
export interface BaselineMetrics {
  timestamp: string;
  agentSuccessRate: number;      // % of agents that complete successfully
  avgTaskDuration: number;        // Average task completion time (ms)
  memoryLatency: {
    hot: number;    // Cache-hit query latency
    warm: number;   // No-cache query latency
    cold: number;   // First-time store latency
  };
  testPassRate: number;           // % of tests passing
  validationScore: number;        // From validator benchmark
  coordinatorEfficiency: number;  // (success_time) / (success_time + wasted_timeout)
}

export interface ComparisonResult {
  metric: string;
  baseline: number;
  current: number;
  delta: number;
  percentChange: number;
  status: 'improved' | 'regressed' | 'neutral';
  significant: boolean; // >5% change
}

export interface BaselineComparison {
  timestamp: string;
  baselineLabel: string;
  currentLabel: string;
  comparisons: ComparisonResult[];
  summary: {
    improved: number;
    regressed: number;
    neutral: number;
  };
}

export interface BaselineTracker {
  captureBaseline(): Promise<BaselineMetrics>;
  saveBaseline(metrics: BaselineMetrics, label: string): Promise<void>;
  loadBaseline(label: string): Promise<BaselineMetrics | null>;
  compareToBaseline(current: BaselineMetrics, baseline: BaselineMetrics): BaselineComparison;
  listBaselines(): Promise<string[]>;
}

// Constants
const SWARM_RESULTS_PATH = '.swarm/results';
const BASELINES_PATH = '.swarm/baselines';
const SIGNIFICANCE_THRESHOLD = 0.05; // 5% change is significant

// Ensure baselines directory exists
function ensureBaselinesDir(): void {
  if (!existsSync(BASELINES_PATH)) {
    mkdirSync(BASELINES_PATH, { recursive: true });
  }
}

/**
 * Read and parse coordinator result files
 * Returns array of parsed results
 */
function readCoordinatorResults(): Array<{
  requestId: string;
  status: 'success' | 'failed';
  durationMs: number;
  stats?: {
    wastedTimeMs?: number;
    actualDurationMs?: number;
  };
}> {
  if (!existsSync(SWARM_RESULTS_PATH)) {
    return [];
  }

  const files = readdirSync(SWARM_RESULTS_PATH)
    .filter(f => f.endsWith('.json'));

  const results = [];
  for (const file of files) {
    try {
      const content = readFileSync(join(SWARM_RESULTS_PATH, file), 'utf-8');
      const data = JSON.parse(content);
      results.push(data);
    } catch (err) {
      // Skip malformed files
      console.warn(`Warning: Could not parse ${file}`);
    }
  }

  return results;
}

/**
 * Calculate agent success rate from coordinator results
 * Returns percentage (0-100)
 */
function calculateAgentSuccessRate(results: ReturnType<typeof readCoordinatorResults>): number {
  if (results.length === 0) return 0;

  const successCount = results.filter(r => r.status === 'success').length;
  return (successCount / results.length) * 100;
}

/**
 * Calculate average task duration for successful tasks
 * Returns average in milliseconds
 */
function calculateAvgTaskDuration(results: ReturnType<typeof readCoordinatorResults>): number {
  const successfulResults = results.filter(r => r.status === 'success' && r.durationMs > 0);

  if (successfulResults.length === 0) return 0;

  const totalDuration = successfulResults.reduce((sum, r) => sum + r.durationMs, 0);
  return totalDuration / successfulResults.length;
}

/**
 * Calculate coordinator efficiency
 * Formula: (success_time) / (success_time + wasted_timeout)
 * Higher is better - means less time wasted on timeouts
 */
function calculateCoordinatorEfficiency(results: ReturnType<typeof readCoordinatorResults>): number {
  const successfulResults = results.filter(r => r.status === 'success');

  if (successfulResults.length === 0) return 0;

  let totalSuccessTime = 0;
  let totalWastedTime = 0;

  for (const result of successfulResults) {
    const actualDuration = result.stats?.actualDurationMs || result.durationMs;
    const wastedTime = result.stats?.wastedTimeMs || 0;

    totalSuccessTime += actualDuration;
    totalWastedTime += wastedTime;
  }

  // If no time data at all, return 0 (unknown efficiency)
  if (totalSuccessTime === 0 && totalWastedTime === 0) return 0;

  // If only wasted time exists (shouldn't happen), return 0
  if (totalSuccessTime === 0) return 0;

  const efficiency = totalSuccessTime / (totalSuccessTime + totalWastedTime);

  // Sanity check: efficiency should be between 0 and 1
  return isNaN(efficiency) ? 0 : Math.max(0, Math.min(1, efficiency));
}

/**
 * Measure memory latency for hot/warm/cold scenarios
 * Uses direct memory operations with timing
 */
async function measureMemoryLatency(): Promise<{ hot: number; warm: number; cold: number }> {
  try {
    // Dynamically import memory store
    const memoryStore = await import('../memory/memory-store');

    // Cold: First-time write (store operation)
    const coldTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      memoryStore.storeMemory({
        type: 'working',
        content: `Baseline test ${i}`,
        metadata: { timestamp: new Date().toISOString(), test: true },
      });
      coldTimes.push(performance.now() - start);
    }
    const cold = coldTimes.reduce((a, b) => a + b, 0) / coldTimes.length;

    // Warm: No-cache query (disable cache)
    memoryStore.configureCaching({ enabled: false });
    const warmTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      memoryStore.queryMemory({ type: 'working', limit: 10 });
      warmTimes.push(performance.now() - start);
    }
    const warm = warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length;

    // Hot: Cache-hit query (enable cache and warm it up)
    memoryStore.configureCaching({ enabled: true });
    memoryStore.clearCache();
    memoryStore.queryMemory({ type: 'working', limit: 10 }); // Warm up
    const hotTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      memoryStore.queryMemory({ type: 'working', limit: 10 });
      hotTimes.push(performance.now() - start);
    }
    const hot = hotTimes.reduce((a, b) => a + b, 0) / hotTimes.length;

    // Clean up test data
    memoryStore.clearWorkingMemory('baseline-test');

    return { hot, warm, cold };
  } catch (err) {
    console.warn('Warning: Could not measure memory latency:', err);
    return { hot: 0, warm: 0, cold: 0 };
  }
}

/**
 * Calculate test pass rate from test suite
 * Returns percentage (0-100)
 */
function calculateTestPassRate(): number {
  const report = runTests();

  if (report.totalTests === 0) return 0;

  return (report.passed / report.totalTests) * 100;
}

/**
 * Calculate validation score from validator performance
 * Measures validator throughput as a quality proxy
 * Higher ops/sec = better performance
 */
function calculateValidationScore(): number {
  // Run small validator benchmark manually
  const testContent = `This is a test document with measured accuracy of 85% based on test data.
According to [Smith, 2024], this approach is viable. Limitations include sample size.`;

  const times: number[] = [];
  const iterations = 100;

  // Warm up
  for (let i = 0; i < 10; i++) {
    validate(testContent);
  }

  // Measured runs
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    validate(testContent);
    times.push(performance.now() - start);
  }

  const totalTime = times.reduce((a, b) => a + b, 0);
  const opsPerSecond = (iterations / totalTime) * 1000;

  return opsPerSecond;
}

/**
 * Capture current baseline metrics
 * All values are measured, not fabricated
 */
async function captureBaseline(): Promise<BaselineMetrics> {
  console.log('Capturing baseline metrics...\n');

  // Read coordinator results
  console.log('Reading coordinator results...');
  const results = readCoordinatorResults();
  console.log(`  Found ${results.length} result files`);

  // Calculate agent metrics
  console.log('Calculating agent success rate...');
  const agentSuccessRate = calculateAgentSuccessRate(results);
  console.log(`  Agent success rate: ${agentSuccessRate.toFixed(1)}%`);

  console.log('Calculating average task duration...');
  const avgTaskDuration = calculateAvgTaskDuration(results);
  console.log(`  Average task duration: ${avgTaskDuration.toFixed(0)} ms`);

  console.log('Calculating coordinator efficiency...');
  const coordinatorEfficiency = calculateCoordinatorEfficiency(results);
  const efficiencyDisplay = isNaN(coordinatorEfficiency) ? 'N/A' : `${(coordinatorEfficiency * 100).toFixed(1)}%`;
  console.log(`  Coordinator efficiency: ${efficiencyDisplay}`);

  // Measure memory latency
  console.log('Measuring memory latency...');
  const memoryLatency = await measureMemoryLatency();
  console.log(`  Hot (cache hit): ${memoryLatency.hot.toFixed(2)} ms`);
  console.log(`  Warm (no cache): ${memoryLatency.warm.toFixed(2)} ms`);
  console.log(`  Cold (first write): ${memoryLatency.cold.toFixed(2)} ms`);

  // Run test suite
  console.log('Running test suite...');
  const testPassRate = calculateTestPassRate();
  console.log(`  Test pass rate: ${testPassRate.toFixed(1)}%`);

  // Run validator benchmark
  console.log('Running validation benchmark...');
  const validationScore = calculateValidationScore();
  console.log(`  Validation throughput: ${validationScore.toFixed(0)} ops/sec`);

  const metrics: BaselineMetrics = {
    timestamp: new Date().toISOString(),
    agentSuccessRate,
    avgTaskDuration,
    memoryLatency,
    testPassRate,
    validationScore,
    coordinatorEfficiency,
  };

  console.log('\nBaseline capture complete.');
  return metrics;
}

/**
 * Save baseline metrics to file
 */
async function saveBaseline(metrics: BaselineMetrics, label: string): Promise<void> {
  ensureBaselinesDir();

  const filename = `${label}.json`;
  const filepath = join(BASELINES_PATH, filename);

  writeFileSync(filepath, JSON.stringify(metrics, null, 2), 'utf-8');

  console.log(`\nBaseline saved: ${filepath}`);
}

/**
 * Load baseline metrics from file
 */
async function loadBaseline(label: string): Promise<BaselineMetrics | null> {
  ensureBaselinesDir();

  const filename = `${label}.json`;
  const filepath = join(BASELINES_PATH, filename);

  if (!existsSync(filepath)) {
    return null;
  }

  try {
    const content = readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error loading baseline ${label}:`, err);
    return null;
  }
}

/**
 * List all available baselines
 */
async function listBaselines(): Promise<string[]> {
  ensureBaselinesDir();

  if (!existsSync(BASELINES_PATH)) {
    return [];
  }

  const files = readdirSync(BASELINES_PATH)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));

  return files;
}

/**
 * Compare current metrics to baseline
 */
function compareToBaseline(
  current: BaselineMetrics,
  baseline: BaselineMetrics
): BaselineComparison {
  const comparisons: ComparisonResult[] = [];

  // Helper to create comparison
  function compare(metric: string, currentVal: number, baselineVal: number): ComparisonResult {
    // Handle null/undefined/NaN values
    const safeCurrentVal = (currentVal !== null && !isNaN(currentVal)) ? currentVal : 0;
    const safeBaselineVal = (baselineVal !== null && !isNaN(baselineVal)) ? baselineVal : 0;

    const delta = safeCurrentVal - safeBaselineVal;
    const percentChange = (safeBaselineVal === 0 || isNaN(delta)) ? 0 : (delta / safeBaselineVal) * 100;
    const significant = Math.abs(percentChange) >= SIGNIFICANCE_THRESHOLD * 100;

    let status: 'improved' | 'regressed' | 'neutral';
    if (Math.abs(percentChange) < 1 || isNaN(percentChange)) {
      status = 'neutral';
    } else {
      // For most metrics, higher is better
      // Exceptions: avgTaskDuration and memory latencies (lower is better)
      const lowerIsBetter = metric === 'avgTaskDuration' || metric.startsWith('memoryLatency.');
      const improvedDirection = lowerIsBetter ? delta < 0 : delta > 0;
      status = improvedDirection ? 'improved' : 'regressed';
    }

    return {
      metric,
      baseline: safeBaselineVal,
      current: safeCurrentVal,
      delta: isNaN(delta) ? 0 : delta,
      percentChange: isNaN(percentChange) ? 0 : percentChange,
      status,
      significant,
    };
  }

  // Compare each metric
  comparisons.push(compare('agentSuccessRate', current.agentSuccessRate, baseline.agentSuccessRate));
  comparisons.push(compare('avgTaskDuration', current.avgTaskDuration, baseline.avgTaskDuration));
  comparisons.push(compare('memoryLatency.hot', current.memoryLatency.hot, baseline.memoryLatency.hot));
  comparisons.push(compare('memoryLatency.warm', current.memoryLatency.warm, baseline.memoryLatency.warm));
  comparisons.push(compare('memoryLatency.cold', current.memoryLatency.cold, baseline.memoryLatency.cold));
  comparisons.push(compare('testPassRate', current.testPassRate, baseline.testPassRate));
  comparisons.push(compare('validationScore', current.validationScore, baseline.validationScore));
  comparisons.push(compare('coordinatorEfficiency', current.coordinatorEfficiency, baseline.coordinatorEfficiency));

  // Calculate summary
  const summary = {
    improved: comparisons.filter(c => c.status === 'improved').length,
    regressed: comparisons.filter(c => c.status === 'regressed').length,
    neutral: comparisons.filter(c => c.status === 'neutral').length,
  };

  return {
    timestamp: new Date().toISOString(),
    baselineLabel: baseline.timestamp,
    currentLabel: current.timestamp,
    comparisons,
    summary,
  };
}

/**
 * Print comparison report to console
 */
function printComparisonReport(comparison: BaselineComparison): void {
  console.log('\n=== Baseline Comparison Report ===\n');
  console.log(`Baseline: ${comparison.baselineLabel}`);
  console.log(`Current:  ${comparison.currentLabel}`);
  console.log();

  // Print table header
  console.log('| Metric | Baseline | Current | Delta | Change | Status |');
  console.log('|--------|----------|---------|-------|--------|--------|');

  for (const comp of comparison.comparisons) {
    const metricName = comp.metric.padEnd(24);
    const baselineStr = comp.baseline.toFixed(2).padStart(8);
    const currentStr = comp.current.toFixed(2).padStart(8);
    const deltaStr = (comp.delta >= 0 ? '+' : '') + comp.delta.toFixed(2).padStart(7);
    const changeStr = (comp.percentChange >= 0 ? '+' : '') + comp.percentChange.toFixed(1) + '%';
    const statusIcon = comp.status === 'improved' ? '✓' : comp.status === 'regressed' ? '✗' : '○';
    const statusStr = `${statusIcon} ${comp.status}`;

    console.log(
      `| ${metricName} | ${baselineStr} | ${currentStr} | ${deltaStr} | ${changeStr.padStart(6)} | ${statusStr.padEnd(8)} |`
    );
  }

  console.log();
  console.log('=== Summary ===\n');
  console.log(`Improved:  ${comparison.summary.improved}`);
  console.log(`Regressed: ${comparison.summary.regressed}`);
  console.log(`Neutral:   ${comparison.summary.neutral}`);
  console.log();
}

/**
 * Create baseline tracker instance
 */
export function createBaselineTracker(): BaselineTracker {
  return {
    captureBaseline,
    saveBaseline,
    loadBaseline,
    compareToBaseline,
    listBaselines,
  };
}

// CLI entry point
if (process.argv[1]?.endsWith('baseline-tracker.ts')) {
  const command = process.argv[2] || 'capture';
  const label = process.argv[3] || `baseline-${Date.now()}`;

  const tracker = createBaselineTracker();

  (async () => {
    if (command === 'capture') {
      const metrics = await tracker.captureBaseline();
      await tracker.saveBaseline(metrics, label);
      console.log(`\nBaseline captured and saved as: ${label}`);
    } else if (command === 'compare') {
      const baselineLabel = process.argv[3];
      const currentLabel = process.argv[4] || 'current';

      if (!baselineLabel) {
        console.error('Usage: baseline-tracker.ts compare <baseline-label> [current-label]');
        process.exit(1);
      }

      const baseline = await tracker.loadBaseline(baselineLabel);
      if (!baseline) {
        console.error(`Baseline not found: ${baselineLabel}`);
        process.exit(1);
      }

      let current: BaselineMetrics;
      if (currentLabel === 'current') {
        current = await tracker.captureBaseline();
      } else {
        const loaded = await tracker.loadBaseline(currentLabel);
        if (!loaded) {
          console.error(`Current baseline not found: ${currentLabel}`);
          process.exit(1);
        }
        current = loaded;
      }

      const comparison = tracker.compareToBaseline(current, baseline);
      printComparisonReport(comparison);
    } else if (command === 'list') {
      const baselines = await tracker.listBaselines();
      console.log('\nAvailable baselines:\n');
      if (baselines.length === 0) {
        console.log('  (none)');
      } else {
        for (const b of baselines) {
          console.log(`  - ${b}`);
        }
      }
      console.log();
    } else {
      console.log('Usage:');
      console.log('  baseline-tracker.ts capture [label]           - Capture current metrics');
      console.log('  baseline-tracker.ts compare <baseline> [cur]  - Compare to baseline');
      console.log('  baseline-tracker.ts list                      - List available baselines');
    }
  })();
}

// Export for external use
export { printComparisonReport };
