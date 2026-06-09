/**
 * Hypothesis Generator - Unit Tests
 *
 * Tests the hypothesis generation logic with known inputs.
 */

import { createHypothesisGenerator, AgentResult, Hypothesis } from './hypothesis-generator';
import { BaselineMetrics } from './baseline-tracker';

// Test data
const mockSuccessfulResult: AgentResult = {
  requestId: 'test-success-1',
  status: 'success',
  durationMs: 5000,
  exitCode: 0,
  output: 'Task completed successfully',
  timestamp: '2025-12-16T12:00:00.000Z',
};

const mockFailedResult: AgentResult = {
  requestId: 'test-failed-1',
  status: 'failed',
  durationMs: 2000,
  exitCode: 1,
  output: '',
  error: 'Unknown error occurred',
  timestamp: '2025-12-16T12:00:00.000Z',
};

const mockTimeoutResult: AgentResult = {
  requestId: 'test-timeout-1',
  status: 'timeout',
  durationMs: 60000,
  timestamp: '2025-12-16T12:00:00.000Z',
};

const mockSlowResult: AgentResult = {
  requestId: 'test-slow-1',
  status: 'success',
  durationMs: 45000, // >30s threshold
  exitCode: 0,
  output: 'Slow task completed',
  timestamp: '2025-12-16T12:00:00.000Z',
};

const mockWastedTimeResult: AgentResult = {
  requestId: 'test-waste-1',
  status: 'success',
  durationMs: 10000,
  exitCode: 0,
  output: 'Task with wasted time',
  stats: {
    actualDurationMs: 2000,
    wastedTimeMs: 8000,
  },
  timestamp: '2025-12-16T12:00:00.000Z',
};

const mockHealthyBaseline: BaselineMetrics = {
  timestamp: '2025-12-16T12:00:00.000Z',
  agentSuccessRate: 95,
  avgTaskDuration: 5000,
  memoryLatency: {
    hot: 10,
    warm: 50,
    cold: 100,
  },
  testPassRate: 98,
  validationScore: 2000,
  coordinatorEfficiency: 0.85,
};

const mockUnhealthyBaseline: BaselineMetrics = {
  timestamp: '2025-12-16T12:00:00.000Z',
  agentSuccessRate: 45, // Low
  avgTaskDuration: 25000,
  memoryLatency: {
    hot: 50,
    warm: 250, // High
    cold: 500,
  },
  testPassRate: 75, // Low
  validationScore: 300, // Low
  coordinatorEfficiency: 0.3, // Low
};

// Tests
function testAnalyzeFailures() {
  console.log('Test: analyzeFailures()');

  const generator = createHypothesisGenerator();

  // Test with high timeout rate
  const results: AgentResult[] = [
    mockSuccessfulResult,
    mockTimeoutResult,
    { ...mockTimeoutResult, requestId: 'test-timeout-2' },
    { ...mockTimeoutResult, requestId: 'test-timeout-3' },
  ];

  const hypotheses = generator.analyzeFailures(results);

  // Should generate timeout hypothesis (3/4 = 75% timeout rate)
  const timeoutHyp = hypotheses.find((h) => h.target.includes('health-check'));
  if (!timeoutHyp) {
    console.log('  ✗ FAIL: Expected timeout hypothesis');
    return false;
  }

  if (timeoutHyp.confidence !== 'high') {
    console.log(`  ✗ FAIL: Expected high confidence, got ${timeoutHyp.confidence}`);
    return false;
  }

  if (timeoutHyp.priority < 7) {
    console.log(`  ✗ FAIL: Expected priority >= 7, got ${timeoutHyp.priority}`);
    return false;
  }

  console.log('  ✓ PASS: Timeout hypothesis generated correctly');
  return true;
}

function testAnalyzeFailuresEmptyOutput() {
  console.log('Test: analyzeFailures() - empty output');

  const generator = createHypothesisGenerator();

  // Test with empty output failures
  const results: AgentResult[] = [
    mockSuccessfulResult,
    mockFailedResult,
    { ...mockFailedResult, requestId: 'test-failed-2' },
    { ...mockFailedResult, requestId: 'test-failed-3' },
  ];

  const hypotheses = generator.analyzeFailures(results);

  // Should generate empty output hypothesis
  const emptyOutputHyp = hypotheses.find(
    (h) => h.target.includes('bootstrap') && h.description.includes('empty')
  );

  if (!emptyOutputHyp) {
    console.log('  ✗ FAIL: Expected empty output hypothesis');
    return false;
  }

  if (emptyOutputHyp.type !== 'reword') {
    console.log(`  ✗ FAIL: Expected type 'reword', got ${emptyOutputHyp.type}`);
    return false;
  }

  console.log('  ✓ PASS: Empty output hypothesis generated correctly');
  return true;
}

function testDetectPatterns() {
  console.log('Test: detectPatterns() - slow tasks');

  const generator = createHypothesisGenerator();

  // Test with slow tasks
  const results: AgentResult[] = [
    mockSuccessfulResult,
    mockSlowResult,
    { ...mockSlowResult, requestId: 'test-slow-2', durationMs: 50000 },
    { ...mockSlowResult, requestId: 'test-slow-3', durationMs: 40000 },
  ];

  const hypotheses = generator.detectPatterns(results);

  // Should generate slow task hypothesis
  const slowHyp = hypotheses.find((h) => h.target.includes('performance-optimizer'));

  if (!slowHyp) {
    console.log('  ✗ FAIL: Expected slow task hypothesis');
    return false;
  }

  if (!slowHyp.testPlan.some((step) => step.includes('Profile'))) {
    console.log('  ✗ FAIL: Expected profiling in test plan');
    return false;
  }

  console.log('  ✓ PASS: Slow task hypothesis generated correctly');
  return true;
}

function testDetectPatternsWastedTime() {
  console.log('Test: detectPatterns() - wasted time');

  const generator = createHypothesisGenerator();

  // Test with wasted time
  const results: AgentResult[] = [
    mockSuccessfulResult,
    mockWastedTimeResult,
    {
      ...mockWastedTimeResult,
      requestId: 'test-waste-2',
      stats: { actualDurationMs: 3000, wastedTimeMs: 7000 },
    },
    {
      ...mockWastedTimeResult,
      requestId: 'test-waste-3',
      stats: { actualDurationMs: 2500, wastedTimeMs: 7500 },
    },
  ];

  const hypotheses = generator.detectPatterns(results);

  // Should generate wasted time hypothesis
  const wasteHyp = hypotheses.find((h) => h.target.includes('timeout-optimizer'));

  if (!wasteHyp) {
    console.log('  ✗ FAIL: Expected wasted time hypothesis');
    return false;
  }

  if (wasteHyp.priority < 7) {
    console.log(`  ✗ FAIL: Expected high priority, got ${wasteHyp.priority}`);
    return false;
  }

  console.log('  ✓ PASS: Wasted time hypothesis generated correctly');
  return true;
}

function testIdentifyPerformanceGaps() {
  console.log('Test: identifyPerformanceGaps()');

  const generator = createHypothesisGenerator();

  const hypotheses = generator.identifyPerformanceGaps(mockUnhealthyBaseline);

  // Should generate multiple gap hypotheses
  if (hypotheses.length === 0) {
    console.log('  ✗ FAIL: Expected gap hypotheses for unhealthy baseline');
    return false;
  }

  // Should have low success rate hypothesis
  const successHyp = hypotheses.find((h) => h.description.includes('success rate'));
  if (!successHyp) {
    console.log('  ✗ FAIL: Expected success rate hypothesis');
    return false;
  }

  if (successHyp.confidence !== 'high') {
    console.log(`  ✗ FAIL: Expected high confidence for 45% success rate, got ${successHyp.confidence}`);
    return false;
  }

  // Should have efficiency hypothesis
  const efficiencyHyp = hypotheses.find((h) => h.description.includes('efficiency'));
  if (!efficiencyHyp) {
    console.log('  ✗ FAIL: Expected efficiency hypothesis');
    return false;
  }

  console.log(`  ✓ PASS: Generated ${hypotheses.length} gap hypotheses`);
  return true;
}

function testIdentifyPerformanceGapsHealthy() {
  console.log('Test: identifyPerformanceGaps() - healthy baseline');

  const generator = createHypothesisGenerator();

  const hypotheses = generator.identifyPerformanceGaps(mockHealthyBaseline);

  // Should generate fewer or no hypotheses for healthy baseline
  if (hypotheses.length > 2) {
    console.log(`  ✗ FAIL: Expected ≤2 hypotheses for healthy baseline, got ${hypotheses.length}`);
    return false;
  }

  console.log(`  ✓ PASS: Healthy baseline generated ${hypotheses.length} hypotheses`);
  return true;
}

function testPrioritize() {
  console.log('Test: prioritize()');

  const generator = createHypothesisGenerator();

  const hypotheses: Hypothesis[] = [
    {
      id: 'hyp-1',
      source: 'failure_analysis',
      target: 'test-target-1',
      type: 'addition',
      description: 'Low priority',
      expectedOutcome: 'Test',
      confidence: 'low',
      priority: 3,
      testPlan: ['Test'],
      evidence: { sourceData: 'test', dataPoints: 1, pattern: 'test' },
    },
    {
      id: 'hyp-2',
      source: 'failure_analysis',
      target: 'test-target-2',
      type: 'addition',
      description: 'High priority',
      expectedOutcome: 'Test',
      confidence: 'high',
      priority: 9,
      testPlan: ['Test'],
      evidence: { sourceData: 'test', dataPoints: 10, pattern: 'test' },
    },
    {
      id: 'hyp-3',
      source: 'failure_analysis',
      target: 'test-target-3',
      type: 'addition',
      description: 'Medium priority',
      expectedOutcome: 'Test',
      confidence: 'medium',
      priority: 5,
      testPlan: ['Test'],
      evidence: { sourceData: 'test', dataPoints: 5, pattern: 'test' },
    },
  ];

  const prioritized = generator.prioritize(hypotheses);

  // Should be sorted by priority descending
  if (prioritized[0].priority !== 9) {
    console.log(`  ✗ FAIL: Expected highest priority first, got ${prioritized[0].priority}`);
    return false;
  }

  if (prioritized[prioritized.length - 1].priority !== 3) {
    console.log(`  ✗ FAIL: Expected lowest priority last, got ${prioritized[prioritized.length - 1].priority}`);
    return false;
  }

  console.log('  ✓ PASS: Hypotheses prioritized correctly');
  return true;
}

function testHypothesisStructure() {
  console.log('Test: Hypothesis structure validation');

  const generator = createHypothesisGenerator();

  const results: AgentResult[] = [
    mockFailedResult,
    { ...mockFailedResult, requestId: 'test-failed-2' },
  ];

  const hypotheses = generator.analyzeFailures(results);

  if (hypotheses.length === 0) {
    console.log('  ✗ FAIL: Expected at least one hypothesis');
    return false;
  }

  const hyp = hypotheses[0];

  // Validate all required fields
  if (!hyp.id || !hyp.id.startsWith('hyp-')) {
    console.log(`  ✗ FAIL: Invalid ID format: ${hyp.id}`);
    return false;
  }

  if (!['failure_analysis', 'pattern_detection', 'performance_gap', 'user_feedback'].includes(hyp.source)) {
    console.log(`  ✗ FAIL: Invalid source: ${hyp.source}`);
    return false;
  }

  if (!['addition', 'removal', 'reword'].includes(hyp.type)) {
    console.log(`  ✗ FAIL: Invalid type: ${hyp.type}`);
    return false;
  }

  if (!['low', 'medium', 'high'].includes(hyp.confidence)) {
    console.log(`  ✗ FAIL: Invalid confidence: ${hyp.confidence}`);
    return false;
  }

  if (hyp.priority < 1 || hyp.priority > 10) {
    console.log(`  ✗ FAIL: Priority out of range: ${hyp.priority}`);
    return false;
  }

  if (!hyp.testPlan || hyp.testPlan.length === 0) {
    console.log('  ✗ FAIL: Missing test plan');
    return false;
  }

  if (!hyp.evidence || !hyp.evidence.sourceData || !hyp.evidence.pattern) {
    console.log('  ✗ FAIL: Missing evidence');
    return false;
  }

  console.log('  ✓ PASS: Hypothesis structure is valid');
  return true;
}

// Run all tests
function runTests() {
  console.log('='.repeat(70));
  console.log('HYPOTHESIS GENERATOR - UNIT TESTS');
  console.log('='.repeat(70));
  console.log();

  const tests = [
    testAnalyzeFailures,
    testAnalyzeFailuresEmptyOutput,
    testDetectPatterns,
    testDetectPatternsWastedTime,
    testIdentifyPerformanceGaps,
    testIdentifyPerformanceGapsHealthy,
    testPrioritize,
    testHypothesisStructure,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      console.log(`  ✗ FAIL: ${err}`);
      failed++;
    }
    console.log();
  }

  console.log('='.repeat(70));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(70));

  return failed === 0;
}

// CLI execution
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('hypothesis-generator.test.ts');

if (isMainModule && process.argv[1]?.endsWith('hypothesis-generator.test.ts')) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

export { runTests };
