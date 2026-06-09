/**
 * Hypothesis Generator - Evidence-based improvement hypothesis generation
 *
 * Analyzes system data to generate testable hypotheses for self-improvement.
 * All hypotheses must be backed by measured failures, patterns, or gaps.
 *
 * Design principles:
 * - Evidence-based: All hypotheses derived from actual system data
 * - Testable: Each hypothesis includes a concrete test plan
 * - Conservative: No fabricated performance claims
 * - Prioritized: Hypotheses ranked by impact and confidence
 *
 * Data sources:
 * - Agent results from .swarm/results/ (failures, timeouts, success rates)
 * - Baseline metrics (performance gaps, regression patterns)
 * - Test suite results (validation failures, error patterns)
 * - Historical decision data (what worked, what didn't)
 */

import * as fs from 'fs';
import * as path from 'path';
import { BaselineMetrics, ComparisonResult } from './baseline-tracker';
import { AcceptanceDecision } from './acceptance-gate';
import { TestSuiteReport } from './test-suite';

// Types
export interface Hypothesis {
  id: string;
  source: 'failure_analysis' | 'pattern_detection' | 'performance_gap' | 'user_feedback';
  target: string; // What to modify (file/config path)
  type: 'addition' | 'removal' | 'reword';
  description: string;
  expectedOutcome: string;
  confidence: 'low' | 'medium' | 'high';
  priority: number; // 1-10, higher is more urgent
  testPlan: string[]; // How to verify
  evidence: {
    sourceData: string; // Where the evidence came from
    dataPoints: number; // How many data points support this
    pattern: string; // What pattern was observed
  };
}

export interface AgentResult {
  requestId: string;
  status: 'success' | 'failed' | 'timeout';
  durationMs: number;
  exitCode?: number;
  output?: string;
  error?: string;
  stats?: {
    wastedTimeMs?: number;
    actualDurationMs?: number;
  };
  timestamp?: string;
}

export interface FailurePattern {
  type: string;
  count: number;
  examples: string[];
  avgDurationMs: number;
}

export interface HypothesisGenerator {
  analyzeFailures(results: AgentResult[]): Hypothesis[];
  detectPatterns(results: AgentResult[]): Hypothesis[];
  identifyPerformanceGaps(baseline: BaselineMetrics): Hypothesis[];
  generateHypotheses(): Promise<Hypothesis[]>;
  prioritize(hypotheses: Hypothesis[]): Hypothesis[];
}

// Constants
const SWARM_RESULTS_PATH = '.swarm/results';
const BASELINES_PATH = '.swarm/baselines';
const DECISIONS_PATH = '.swarm/decisions';
const TIMEOUT_THRESHOLD_MS = 60000; // 60 seconds
const SLOW_TASK_THRESHOLD_MS = 30000; // 30 seconds

/**
 * Read agent results from .swarm/results/
 */
function readAgentResults(): AgentResult[] {
  if (!fs.existsSync(SWARM_RESULTS_PATH)) {
    return [];
  }

  const files = fs.readdirSync(SWARM_RESULTS_PATH).filter(f => f.endsWith('.json'));
  const results: AgentResult[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(SWARM_RESULTS_PATH, file), 'utf-8');
      const data = JSON.parse(content);
      results.push(data);
    } catch (err) {
      console.warn(`Warning: Could not parse ${file}`);
    }
  }

  return results;
}

/**
 * Analyze failure patterns in agent results
 * Returns hypotheses based on what went wrong
 */
function analyzeFailures(results: AgentResult[]): Hypothesis[] {
  const hypotheses: Hypothesis[] = [];
  const failures = results.filter(r => r.status === 'failed');
  const timeouts = results.filter(r => r.status === 'timeout');

  // Hypothesis 1: High timeout rate suggests need for health checks
  if (timeouts.length > 0 && results.length > 0) {
    const timeoutRate = timeouts.length / results.length;

    if (timeoutRate >= 0.3) {
      // 30% or more timeouts
      hypotheses.push({
        id: `hyp-timeout-${Date.now()}`,
        source: 'failure_analysis',
        target: 'framework/coordinator/health-check.ts',
        type: 'addition',
        description: 'Add health check mechanism to detect stuck agents before timeout',
        expectedOutcome: `Reduce timeout waste from ${(timeoutRate * 100).toFixed(0)}% to <10%`,
        confidence: timeoutRate >= 0.5 ? 'high' : 'medium',
        priority: timeoutRate >= 0.5 ? 9 : 7,
        testPlan: [
          'Run 20 tasks with health check enabled',
          'Measure timeout rate before and after',
          'Verify early detection reduces wasted time',
          'Check that legitimate long-running tasks still complete',
        ],
        evidence: {
          sourceData: SWARM_RESULTS_PATH,
          dataPoints: timeouts.length,
          pattern: `${timeouts.length}/${results.length} tasks timeout (${(timeoutRate * 100).toFixed(1)}%)`,
        },
      });
    }
  }

  // Hypothesis 2: High failure rate suggests need for better error handling
  if (failures.length > 0 && results.length > 0) {
    const failureRate = failures.length / results.length;

    if (failureRate >= 0.2) {
      // 20% or more failures
      // Analyze failure error messages for patterns
      const errorPatterns = new Map<string, number>();
      for (const failure of failures) {
        const errorType = categorizeError(failure.error || failure.output || 'unknown');
        errorPatterns.set(errorType, (errorPatterns.get(errorType) || 0) + 1);
      }

      // Find most common error type
      let mostCommonError = 'unknown';
      let maxCount = 0;
      for (const [error, count] of errorPatterns.entries()) {
        if (count > maxCount) {
          maxCount = count;
          mostCommonError = error;
        }
      }

      hypotheses.push({
        id: `hyp-failure-${Date.now()}`,
        source: 'failure_analysis',
        target: 'framework/coordinator/error-handler.ts',
        type: 'addition',
        description: `Add error recovery for ${mostCommonError} errors`,
        expectedOutcome: `Reduce failure rate from ${(failureRate * 100).toFixed(0)}% to <10%`,
        confidence: maxCount >= 3 ? 'high' : 'medium',
        priority: failureRate >= 0.5 ? 8 : 6,
        testPlan: [
          `Reproduce ${mostCommonError} error condition`,
          'Implement recovery mechanism',
          'Verify error is handled gracefully',
          'Measure success rate improvement',
        ],
        evidence: {
          sourceData: SWARM_RESULTS_PATH,
          dataPoints: failures.length,
          pattern: `${failures.length}/${results.length} tasks fail (${(failureRate * 100).toFixed(1)}%), ${maxCount} are ${mostCommonError}`,
        },
      });
    }
  }

  // Hypothesis 3: Empty output suggests bootstrap issue
  const emptyOutputFailures = failures.filter(
    f => !f.output || f.output.trim().length === 0
  );

  if (emptyOutputFailures.length >= 2) {
    hypotheses.push({
      id: `hyp-empty-output-${Date.now()}`,
      source: 'failure_analysis',
      target: 'framework/bootstrap/bootstrap-loader.ts',
      type: 'reword',
      description: 'Improve bootstrap instructions to prevent empty agent output',
      expectedOutcome: 'Eliminate empty output failures',
      confidence: emptyOutputFailures.length >= 5 ? 'high' : 'medium',
      priority: 7,
      testPlan: [
        'Review bootstrap instructions for clarity',
        'Add explicit output requirements',
        'Test with 10 agent spawns',
        'Verify all produce non-empty output',
      ],
      evidence: {
        sourceData: SWARM_RESULTS_PATH,
        dataPoints: emptyOutputFailures.length,
        pattern: `${emptyOutputFailures.length} agents produced empty output`,
      },
    });
  }

  return hypotheses;
}

/**
 * Detect patterns in agent results
 * Returns hypotheses based on recurring patterns
 */
function detectPatterns(results: AgentResult[]): Hypothesis[] {
  const hypotheses: Hypothesis[] = [];
  const successful = results.filter(r => r.status === 'success');

  if (successful.length === 0) return hypotheses;

  // Pattern 1: Slow tasks
  const slowTasks = successful.filter(r => r.durationMs > SLOW_TASK_THRESHOLD_MS);

  if (slowTasks.length >= 3) {
    const avgSlowDuration = slowTasks.reduce((sum, r) => sum + r.durationMs, 0) / slowTasks.length;
    const avgNormalDuration = successful
      .filter(r => r.durationMs <= SLOW_TASK_THRESHOLD_MS)
      .reduce((sum, r, _, arr) => sum + (arr.length > 0 ? r.durationMs / arr.length : 0), 0);

    if (avgSlowDuration > avgNormalDuration * 2) {
      hypotheses.push({
        id: `hyp-slow-${Date.now()}`,
        source: 'pattern_detection',
        target: 'framework/coordinator/performance-optimizer.ts',
        type: 'addition',
        description: 'Add performance profiling to identify slow task bottlenecks',
        expectedOutcome: `Reduce slow task duration from ${(avgSlowDuration / 1000).toFixed(1)}s to <${SLOW_TASK_THRESHOLD_MS / 1000}s`,
        confidence: slowTasks.length >= 5 ? 'high' : 'medium',
        priority: 6,
        testPlan: [
          'Add timing instrumentation to task execution',
          'Profile slow tasks to identify bottlenecks',
          'Optimize identified bottlenecks',
          'Measure duration reduction',
        ],
        evidence: {
          sourceData: SWARM_RESULTS_PATH,
          dataPoints: slowTasks.length,
          pattern: `${slowTasks.length} tasks take >${SLOW_TASK_THRESHOLD_MS / 1000}s (avg: ${(avgSlowDuration / 1000).toFixed(1)}s)`,
        },
      });
    }
  }

  // Pattern 2: High wasted time from coordinator inefficiency
  const tasksWithWaste = successful.filter(r => r.stats?.wastedTimeMs && r.stats.wastedTimeMs > 0);

  if (tasksWithWaste.length >= 3) {
    const totalWasted = tasksWithWaste.reduce((sum, r) => sum + (r.stats?.wastedTimeMs || 0), 0);
    const totalActual = tasksWithWaste.reduce((sum, r) => sum + (r.stats?.actualDurationMs || r.durationMs), 0);
    const wasteRate = totalWasted / (totalWasted + totalActual);

    if (wasteRate >= 0.2) {
      // 20% or more time wasted
      hypotheses.push({
        id: `hyp-waste-${Date.now()}`,
        source: 'pattern_detection',
        target: 'framework/coordinator/timeout-optimizer.ts',
        type: 'addition',
        description: 'Add adaptive timeout mechanism to reduce wasted time',
        expectedOutcome: `Reduce wasted time from ${(wasteRate * 100).toFixed(0)}% to <10%`,
        confidence: wasteRate >= 0.3 ? 'high' : 'medium',
        priority: 8,
        testPlan: [
          'Implement adaptive timeout based on task history',
          'Test with historical task data',
          'Measure wasted time reduction',
          'Verify no increase in false timeouts',
        ],
        evidence: {
          sourceData: SWARM_RESULTS_PATH,
          dataPoints: tasksWithWaste.length,
          pattern: `${tasksWithWaste.length} tasks wasted ${(totalWasted / 1000).toFixed(1)}s of ${((totalWasted + totalActual) / 1000).toFixed(1)}s total (${(wasteRate * 100).toFixed(1)}%)`,
        },
      });
    }
  }

  // Pattern 3: Frequent identical tasks suggest caching opportunity
  const taskOutputs = new Map<string, number>();
  for (const result of successful) {
    if (result.output) {
      const hash = simpleHash(result.output.substring(0, 200)); // Hash first 200 chars
      taskOutputs.set(hash, (taskOutputs.get(hash) || 0) + 1);
    }
  }

  const duplicates = Array.from(taskOutputs.entries()).filter(([_, count]) => count >= 3);
  if (duplicates.length > 0) {
    const totalDuplicates = duplicates.reduce((sum, [_, count]) => sum + count, 0);

    hypotheses.push({
      id: `hyp-cache-${Date.now()}`,
      source: 'pattern_detection',
      target: 'framework/coordinator/result-cache.ts',
      type: 'addition',
      description: 'Add result caching for repeated task patterns',
      expectedOutcome: `Eliminate ${totalDuplicates} redundant task executions`,
      confidence: totalDuplicates >= 5 ? 'medium' : 'low',
      priority: totalDuplicates >= 10 ? 5 : 3,
      testPlan: [
        'Identify task fingerprinting mechanism',
        'Implement cache with TTL',
        'Test cache hit rate on historical data',
        'Verify cache invalidation works correctly',
      ],
      evidence: {
        sourceData: SWARM_RESULTS_PATH,
        dataPoints: totalDuplicates,
        pattern: `${totalDuplicates} tasks produced duplicate output (${duplicates.length} unique patterns)`,
      },
    });
  }

  return hypotheses;
}

/**
 * Identify performance gaps from baseline metrics
 * Returns hypotheses based on metrics below target
 */
function identifyPerformanceGaps(baseline: BaselineMetrics): Hypothesis[] {
  const hypotheses: Hypothesis[] = [];

  // Gap 1: Low agent success rate
  if (baseline.agentSuccessRate < 80) {
    hypotheses.push({
      id: `hyp-success-${Date.now()}`,
      source: 'performance_gap',
      target: 'framework/bootstrap/bootstrap-loader.ts',
      type: 'reword',
      description: 'Improve agent bootstrap instructions to increase success rate',
      expectedOutcome: `Increase success rate from ${baseline.agentSuccessRate.toFixed(1)}% to >80%`,
      confidence: baseline.agentSuccessRate < 60 ? 'high' : 'medium',
      priority: baseline.agentSuccessRate < 60 ? 9 : 7,
      testPlan: [
        'Review failed agent logs for common issues',
        'Clarify bootstrap instructions',
        'Add success criteria examples',
        'Test with 20 agent spawns',
        'Measure success rate improvement',
      ],
      evidence: {
        sourceData: BASELINES_PATH,
        dataPoints: 1,
        pattern: `Agent success rate is ${baseline.agentSuccessRate.toFixed(1)}% (target: >80%)`,
      },
    });
  }

  // Gap 2: Low coordinator efficiency
  if (baseline.coordinatorEfficiency < 0.7 && !isNaN(baseline.coordinatorEfficiency)) {
    const efficiencyPercent = (baseline.coordinatorEfficiency * 100).toFixed(1);
    hypotheses.push({
      id: `hyp-efficiency-${Date.now()}`,
      source: 'performance_gap',
      target: 'framework/coordinator/timeout-handler.ts',
      type: 'addition',
      description: 'Add smarter timeout handling to improve coordinator efficiency',
      expectedOutcome: `Increase efficiency from ${efficiencyPercent}% to >70%`,
      confidence: baseline.coordinatorEfficiency < 0.5 ? 'high' : 'medium',
      priority: 8,
      testPlan: [
        'Analyze timeout patterns in failed tasks',
        'Implement early detection mechanisms',
        'Add task health monitoring',
        'Measure efficiency improvement',
      ],
      evidence: {
        sourceData: BASELINES_PATH,
        dataPoints: 1,
        pattern: `Coordinator efficiency is ${efficiencyPercent}% (target: >70%)`,
      },
    });
  }

  // Gap 3: Low test pass rate
  if (baseline.testPassRate < 90) {
    hypotheses.push({
      id: `hyp-tests-${Date.now()}`,
      source: 'performance_gap',
      target: 'framework/validation/test-suite.ts',
      type: 'addition',
      description: 'Fix failing validation tests to improve pass rate',
      expectedOutcome: `Increase test pass rate from ${baseline.testPassRate.toFixed(1)}% to >90%`,
      confidence: 'high',
      priority: 9,
      testPlan: [
        'Identify which tests are failing',
        'Determine root cause of failures',
        'Fix underlying issues or update test expectations',
        'Verify all tests pass',
      ],
      evidence: {
        sourceData: BASELINES_PATH,
        dataPoints: 1,
        pattern: `Test pass rate is ${baseline.testPassRate.toFixed(1)}% (target: >90%)`,
      },
    });
  }

  // Gap 4: High memory latency
  if (baseline.memoryLatency.warm > 100) {
    // >100ms for warm queries is slow
    hypotheses.push({
      id: `hyp-memory-${Date.now()}`,
      source: 'performance_gap',
      target: 'framework/memory/memory-store.ts',
      type: 'addition',
      description: 'Add query optimization to reduce memory latency',
      expectedOutcome: `Reduce warm query latency from ${baseline.memoryLatency.warm.toFixed(1)}ms to <100ms`,
      confidence: baseline.memoryLatency.warm > 200 ? 'high' : 'medium',
      priority: baseline.memoryLatency.warm > 200 ? 7 : 5,
      testPlan: [
        'Profile memory query operations',
        'Identify slow query patterns',
        'Add indexing or caching for common queries',
        'Benchmark latency improvement',
      ],
      evidence: {
        sourceData: BASELINES_PATH,
        dataPoints: 1,
        pattern: `Warm query latency is ${baseline.memoryLatency.warm.toFixed(1)}ms (target: <100ms)`,
      },
    });
  }

  // Gap 5: Slow validation throughput
  if (baseline.validationScore < 1000) {
    // <1000 ops/sec is slow for validation
    hypotheses.push({
      id: `hyp-validator-${Date.now()}`,
      source: 'performance_gap',
      target: 'framework/validation/validator.ts',
      type: 'addition',
      description: 'Optimize validation rules for better throughput',
      expectedOutcome: `Increase validation throughput from ${baseline.validationScore.toFixed(0)} ops/sec to >1000 ops/sec`,
      confidence: baseline.validationScore < 500 ? 'high' : 'medium',
      priority: baseline.validationScore < 500 ? 6 : 4,
      testPlan: [
        'Profile validation rule execution',
        'Identify slow regex patterns',
        'Optimize or cache expensive operations',
        'Benchmark throughput improvement',
      ],
      evidence: {
        sourceData: BASELINES_PATH,
        dataPoints: 1,
        pattern: `Validation throughput is ${baseline.validationScore.toFixed(0)} ops/sec (target: >1000 ops/sec)`,
      },
    });
  }

  return hypotheses;
}

/**
 * Prioritize hypotheses by impact and confidence
 * Higher priority = more urgent
 */
function prioritize(hypotheses: Hypothesis[]): Hypothesis[] {
  // Sort by priority (descending), then by confidence, then by data points
  return hypotheses.sort((a, b) => {
    // Primary sort: priority
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    // Secondary sort: confidence (high > medium > low)
    const confidenceScore = { high: 3, medium: 2, low: 1 };
    if (a.confidence !== b.confidence) {
      return confidenceScore[b.confidence] - confidenceScore[a.confidence];
    }

    // Tertiary sort: evidence data points
    return b.evidence.dataPoints - a.evidence.dataPoints;
  });
}

/**
 * Generate all hypotheses from available data sources
 */
async function generateHypotheses(): Promise<Hypothesis[]> {
  const hypotheses: Hypothesis[] = [];

  console.log('Generating hypotheses from system data...\n');

  // Source 1: Agent results
  console.log('Analyzing agent results...');
  const results = readAgentResults();
  console.log(`  Found ${results.length} agent results`);

  if (results.length > 0) {
    const failureHypotheses = analyzeFailures(results);
    console.log(`  Generated ${failureHypotheses.length} failure-based hypotheses`);
    hypotheses.push(...failureHypotheses);

    const patternHypotheses = detectPatterns(results);
    console.log(`  Generated ${patternHypotheses.length} pattern-based hypotheses`);
    hypotheses.push(...patternHypotheses);
  }

  // Source 2: Baseline metrics
  console.log('\nAnalyzing baseline metrics...');
  const baselinePath = path.join(BASELINES_PATH, 'current.json');
  if (fs.existsSync(baselinePath)) {
    const baseline: BaselineMetrics = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    const gapHypotheses = identifyPerformanceGaps(baseline);
    console.log(`  Generated ${gapHypotheses.length} gap-based hypotheses`);
    hypotheses.push(...gapHypotheses);
  } else {
    console.log('  No baseline found (run baseline-tracker.ts capture first)');
  }

  // Deduplicate by target + type
  const uniqueHypotheses = deduplicateHypotheses(hypotheses);
  console.log(`\nTotal hypotheses: ${hypotheses.length}`);
  console.log(`Unique hypotheses: ${uniqueHypotheses.length}`);

  return uniqueHypotheses;
}

/**
 * Deduplicate hypotheses with same target and type
 * Keep the one with highest priority/confidence
 */
function deduplicateHypotheses(hypotheses: Hypothesis[]): Hypothesis[] {
  const seen = new Map<string, Hypothesis>();

  for (const hyp of hypotheses) {
    const key = `${hyp.target}:${hyp.type}`;
    const existing = seen.get(key);

    if (!existing || hyp.priority > existing.priority) {
      seen.set(key, hyp);
    }
  }

  return Array.from(seen.values());
}

/**
 * Helper: Categorize error type from error message
 */
function categorizeError(error: string): string {
  const lowerError = error.toLowerCase();

  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return 'timeout';
  } else if (lowerError.includes('permission') || lowerError.includes('access denied')) {
    return 'permission';
  } else if (lowerError.includes('not found') || lowerError.includes('enoent')) {
    return 'file_not_found';
  } else if (lowerError.includes('syntax') || lowerError.includes('parse')) {
    return 'syntax_error';
  } else if (lowerError.includes('network') || lowerError.includes('econnrefused')) {
    return 'network_error';
  } else if (lowerError.includes('memory') || lowerError.includes('heap')) {
    return 'memory_error';
  } else if (error.trim().length === 0) {
    return 'empty_error';
  } else {
    return 'unknown';
  }
}

/**
 * Helper: Simple hash function for string comparison
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Print hypotheses to console
 */
function printHypotheses(hypotheses: Hypothesis[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('GENERATED HYPOTHESES');
  console.log('='.repeat(80));

  if (hypotheses.length === 0) {
    console.log('\nNo hypotheses generated. System appears to be performing well.');
    console.log('Run more tasks or capture a baseline to generate improvement hypotheses.');
    console.log('='.repeat(80));
    return;
  }

  for (let i = 0; i < hypotheses.length; i++) {
    const hyp = hypotheses[i];
    console.log(`\n[${i + 1}] ${hyp.description}`);
    console.log(`    ID:         ${hyp.id}`);
    console.log(`    Source:     ${hyp.source}`);
    console.log(`    Target:     ${hyp.target}`);
    console.log(`    Type:       ${hyp.type}`);
    console.log(`    Priority:   ${hyp.priority}/10`);
    console.log(`    Confidence: ${hyp.confidence}`);
    console.log(`    Expected:   ${hyp.expectedOutcome}`);
    console.log(`    Evidence:   ${hyp.evidence.pattern} (${hyp.evidence.dataPoints} data points)`);
    console.log(`    Test Plan:`);
    for (const step of hyp.testPlan) {
      console.log(`      - ${step}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Total: ${hypotheses.length} hypotheses`);
  console.log('='.repeat(80));
}

/**
 * Save hypotheses to file
 */
function saveHypotheses(hypotheses: Hypothesis[], filename: string = 'hypotheses.json'): void {
  const outputPath = path.join('.swarm', filename);

  // Ensure .swarm directory exists
  if (!fs.existsSync('.swarm')) {
    fs.mkdirSync('.swarm', { recursive: true });
  }

  const output = {
    timestamp: new Date().toISOString(),
    count: hypotheses.length,
    hypotheses,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nHypotheses saved to: ${outputPath}`);
}

/**
 * Create hypothesis generator instance
 */
export function createHypothesisGenerator(): HypothesisGenerator {
  return {
    analyzeFailures,
    detectPatterns,
    identifyPerformanceGaps,
    generateHypotheses,
    prioritize,
  };
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('hypothesis-generator.ts');

if (isMainModule && process.argv[1]?.endsWith('hypothesis-generator.ts')) {
  const command = process.argv[2] || 'generate';

  (async () => {
    const generator = createHypothesisGenerator();

    if (command === 'generate') {
      const hypotheses = await generator.generateHypotheses();
      const prioritized = generator.prioritize(hypotheses);
      printHypotheses(prioritized);
      saveHypotheses(prioritized);
    } else if (command === 'failures') {
      const results = readAgentResults();
      const hypotheses = generator.analyzeFailures(results);
      const prioritized = generator.prioritize(hypotheses);
      printHypotheses(prioritized);
    } else if (command === 'patterns') {
      const results = readAgentResults();
      const hypotheses = generator.detectPatterns(results);
      const prioritized = generator.prioritize(hypotheses);
      printHypotheses(prioritized);
    } else if (command === 'gaps') {
      const baselinePath = path.join(BASELINES_PATH, 'current.json');
      if (!fs.existsSync(baselinePath)) {
        console.error('No baseline found. Run: npx tsx framework/validation/baseline-tracker.ts capture');
        process.exit(1);
      }
      const baseline: BaselineMetrics = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
      const hypotheses = generator.identifyPerformanceGaps(baseline);
      const prioritized = generator.prioritize(hypotheses);
      printHypotheses(prioritized);
    } else {
      console.log('Usage:');
      console.log('  hypothesis-generator.ts generate  - Generate all hypotheses (default)');
      console.log('  hypothesis-generator.ts failures  - Analyze failure patterns only');
      console.log('  hypothesis-generator.ts patterns  - Detect behavioral patterns only');
      console.log('  hypothesis-generator.ts gaps      - Identify performance gaps only');
    }
  })();
}

export { printHypotheses, saveHypotheses, readAgentResults };
