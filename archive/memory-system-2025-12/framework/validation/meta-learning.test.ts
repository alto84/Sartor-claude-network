/**
 * Meta-Learning Tracker Tests
 *
 * Comprehensive test suite for the meta-learning tracker.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  createMetaLearningTracker,
  ModificationOutcome,
  Hypothesis,
  calculateSuccessRate,
  calculateMovingAverage,
  determineTrend,
  calculateVelocity,
} from './meta-learning';

// Test storage directory
const TEST_STORAGE_DIR = '.swarm/meta-learning-test';

/**
 * Clean up test storage
 */
function cleanupTestStorage() {
  if (fs.existsSync(TEST_STORAGE_DIR)) {
    fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
  }
}

/**
 * Create sample outcomes for testing
 */
function createSampleOutcomes(): ModificationOutcome[] {
  const now = new Date();

  return [
    // Successful additions
    {
      hypothesisId: 'hyp-001',
      type: 'addition',
      target: 'error-handling',
      result: 'success',
      improvementPercent: 10.0,
      timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        testsImproved: 2,
        testsRegressed: 0,
        netChange: 2,
        decisionId: 'dec-001',
      },
    },
    {
      hypothesisId: 'hyp-002',
      type: 'addition',
      target: 'input-validation',
      result: 'success',
      improvementPercent: 15.0,
      timestamp: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        testsImproved: 3,
        testsRegressed: 0,
        netChange: 3,
        decisionId: 'dec-002',
      },
    },
    {
      hypothesisId: 'hyp-003',
      type: 'addition',
      target: 'error-handling',
      result: 'success',
      improvementPercent: 5.0,
      timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        testsImproved: 1,
        testsRegressed: 0,
        netChange: 1,
        decisionId: 'dec-003',
      },
    },
    // Failed removal
    {
      hypothesisId: 'hyp-004',
      type: 'removal',
      target: 'verbosity-reduction',
      result: 'failure',
      improvementPercent: -5.0,
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        testsImproved: 0,
        testsRegressed: 1,
        netChange: -1,
        decisionId: 'dec-004',
      },
    },
    // Neutral rewording
    {
      hypothesisId: 'hyp-005',
      type: 'reword',
      target: 'clarity-improvement',
      result: 'neutral',
      improvementPercent: 0.0,
      timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        testsImproved: 0,
        testsRegressed: 0,
        netChange: 0,
        decisionId: 'dec-005',
      },
    },
    // More additions
    {
      hypothesisId: 'hyp-006',
      type: 'addition',
      target: 'input-validation',
      result: 'success',
      improvementPercent: 12.5,
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        testsImproved: 2,
        testsRegressed: 0,
        netChange: 2,
        decisionId: 'dec-006',
      },
    },
    // Failed addition
    {
      hypothesisId: 'hyp-007',
      type: 'addition',
      target: 'performance-optimization',
      result: 'failure',
      improvementPercent: -2.5,
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        testsImproved: 0,
        testsRegressed: 1,
        netChange: -1,
        decisionId: 'dec-007',
      },
    },
    // Successful reword
    {
      hypothesisId: 'hyp-008',
      type: 'reword',
      target: 'bootstrap-prompt',
      result: 'success',
      improvementPercent: 7.5,
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        testsImproved: 2,
        testsRegressed: 0,
        netChange: 2,
        decisionId: 'dec-008',
      },
    },
    // More recent outcomes
    {
      hypothesisId: 'hyp-009',
      type: 'addition',
      target: 'error-handling',
      result: 'success',
      improvementPercent: 8.0,
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        testsImproved: 2,
        testsRegressed: 0,
        netChange: 2,
        decisionId: 'dec-009',
      },
    },
    {
      hypothesisId: 'hyp-010',
      type: 'reword',
      target: 'clarity-improvement',
      result: 'neutral',
      improvementPercent: 0.0,
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        testsImproved: 0,
        testsRegressed: 0,
        netChange: 0,
        decisionId: 'dec-010',
      },
    },
  ];
}

/**
 * Test: Record and retrieve outcomes
 */
async function testRecordAndRetrieve() {
  console.log('Test: Record and retrieve outcomes');

  cleanupTestStorage();
  const tracker = createMetaLearningTracker(TEST_STORAGE_DIR);

  const outcome: ModificationOutcome = {
    hypothesisId: 'test-001',
    type: 'addition',
    target: 'test-target',
    result: 'success',
    improvementPercent: 10.0,
    timestamp: new Date().toISOString(),
    metadata: {
      testsImproved: 2,
      testsRegressed: 0,
      netChange: 2,
    },
  };

  await tracker.recordOutcome(outcome);

  const outcomes = await tracker.getOutcomes();
  console.assert(outcomes.length === 1, 'Should have 1 outcome');
  console.assert(
    outcomes[0].hypothesisId === 'test-001',
    'Outcome should match'
  );

  console.log('✓ Record and retrieve test passed\n');
}

/**
 * Test: Filter outcomes
 */
async function testFilterOutcomes() {
  console.log('Test: Filter outcomes');

  cleanupTestStorage();
  const tracker = createMetaLearningTracker(TEST_STORAGE_DIR);

  const samples = createSampleOutcomes();
  for (const sample of samples) {
    await tracker.recordOutcome(sample);
  }

  // Filter by type
  const additions = await tracker.getOutcomes({ type: 'addition' });
  console.assert(additions.length === 6, 'Should have 6 additions');

  // Filter by result
  const successful = await tracker.getOutcomes({ result: 'success' });
  console.assert(successful.length === 6, 'Should have 6 successful');

  // Filter by target
  const errorHandling = await tracker.getOutcomes({ target: 'error-handling' });
  console.assert(errorHandling.length === 3, 'Should have 3 error-handling');

  // Filter by improvement
  const highImprovement = await tracker.getOutcomes({ minImprovement: 10.0 });
  console.assert(
    highImprovement.length === 3,
    'Should have 3 high improvements'
  );

  console.log('✓ Filter outcomes test passed\n');
}

/**
 * Test: Success rate by type
 */
async function testSuccessRateByType() {
  console.log('Test: Success rate by type');

  cleanupTestStorage();
  const tracker = createMetaLearningTracker(TEST_STORAGE_DIR);

  const samples = createSampleOutcomes();
  for (const sample of samples) {
    await tracker.recordOutcome(sample);
  }

  const stats = await tracker.getSuccessRateByType();

  // Check addition stats (6 total: 5 success, 1 failure)
  console.assert(stats.addition.total === 6, 'Should have 6 additions');
  console.assert(
    stats.addition.successful === 5,
    'Should have 5 successful additions'
  );
  console.assert(stats.addition.failed === 1, 'Should have 1 failed addition');
  console.assert(
    Math.abs(stats.addition.rate - 5 / 6) < 0.01,
    'Addition rate should be 5/6'
  );

  // Check removal stats (1 total: 0 success, 1 failure)
  console.assert(stats.removal.total === 1, 'Should have 1 removal');
  console.assert(stats.removal.failed === 1, 'Should have 1 failed removal');

  // Check reword stats (3 total: 1 success, 2 neutral)
  console.assert(stats.reword.total === 3, 'Should have 3 rewords');
  console.assert(
    stats.reword.successful === 1,
    'Should have 1 successful reword'
  );
  console.assert(stats.reword.neutral === 2, 'Should have 2 neutral rewords');

  console.log('✓ Success rate by type test passed\n');
}

/**
 * Test: Success rate by target
 */
async function testSuccessRateByTarget() {
  console.log('Test: Success rate by target');

  cleanupTestStorage();
  const tracker = createMetaLearningTracker(TEST_STORAGE_DIR);

  const samples = createSampleOutcomes();
  for (const sample of samples) {
    await tracker.recordOutcome(sample);
  }

  const stats = await tracker.getSuccessRateByTarget();

  // Check error-handling (3 total: 3 success)
  console.assert(
    stats['error-handling'].total === 3,
    'Should have 3 error-handling'
  );
  console.assert(
    stats['error-handling'].successful === 3,
    'All error-handling should succeed'
  );
  console.assert(
    stats['error-handling'].rate === 1.0,
    'Error-handling rate should be 100%'
  );
  console.assert(
    stats['error-handling'].mostSuccessfulType === 'addition',
    'Most successful type should be addition'
  );

  // Check input-validation (2 total: 2 success)
  console.assert(
    stats['input-validation'].total === 2,
    'Should have 2 input-validation'
  );
  console.assert(
    stats['input-validation'].rate === 1.0,
    'Input-validation rate should be 100%'
  );

  console.log('✓ Success rate by target test passed\n');
}

/**
 * Test: Analyze patterns
 */
async function testAnalyzePatterns() {
  console.log('Test: Analyze patterns');

  cleanupTestStorage();
  const tracker = createMetaLearningTracker(TEST_STORAGE_DIR);

  const samples = createSampleOutcomes();
  for (const sample of samples) {
    await tracker.recordOutcome(sample);
  }

  const insights = await tracker.analyzePatterns();

  console.assert(insights.length > 0, 'Should have insights');

  // Check that insights have required fields
  insights.forEach((insight) => {
    console.assert(insight.pattern, 'Should have pattern');
    console.assert(insight.confidence >= 0, 'Should have confidence');
    console.assert(insight.evidence.length > 0, 'Should have evidence');
    console.assert(insight.recommendation, 'Should have recommendation');
    console.assert(insight.sampleSize > 0, 'Should have sample size');
    console.assert(insight.limitations.length > 0, 'Should have limitations');
  });

  console.log(`  Generated ${insights.length} insights`);
  console.log('✓ Analyze patterns test passed\n');
}

/**
 * Test: Improvement trajectory
 */
async function testImprovementTrajectory() {
  console.log('Test: Improvement trajectory');

  cleanupTestStorage();
  const tracker = createMetaLearningTracker(TEST_STORAGE_DIR);

  const samples = createSampleOutcomes();
  for (const sample of samples) {
    await tracker.recordOutcome(sample);
  }

  const trajectory = await tracker.getImprovementTrajectory();

  console.assert(
    trajectory.timestamps.length === 10,
    'Should have 10 timestamps'
  );
  console.assert(
    trajectory.cumulativeImprovement.length === 10,
    'Should have 10 cumulative improvements'
  );
  console.assert(
    trajectory.movingAverage.length === 10,
    'Should have 10 moving average values'
  );
  console.assert(
    ['improving', 'plateauing', 'declining', 'insufficient_data'].includes(
      trajectory.trend
    ),
    'Should have valid trend'
  );

  console.log(`  Trend: ${trajectory.trend}`);
  console.log(`  Velocity: ${trajectory.velocityPerWeek.toFixed(2)}% per week`);
  console.log('✓ Improvement trajectory test passed\n');
}

/**
 * Test: Predict success
 */
async function testPredictSuccess() {
  console.log('Test: Predict success');

  cleanupTestStorage();
  const tracker = createMetaLearningTracker(TEST_STORAGE_DIR);

  const samples = createSampleOutcomes();
  for (const sample of samples) {
    await tracker.recordOutcome(sample);
  }

  // Predict for addition to error-handling (3/3 success historically)
  const hypothesis1: Hypothesis = {
    id: 'new-001',
    type: 'addition',
    target: 'error-handling',
    description: 'Add more error handling',
    expectedImprovement: 10,
  };

  const prediction1 = tracker.predictSuccess(hypothesis1);
  console.assert(
    prediction1 === 1.0,
    'Should predict 100% success for error-handling additions'
  );

  // Predict for removal (0/1 success historically)
  const hypothesis2: Hypothesis = {
    id: 'new-002',
    type: 'removal',
    target: 'verbosity-reduction',
    description: 'Remove verbose text',
    expectedImprovement: 5,
  };

  const prediction2 = tracker.predictSuccess(hypothesis2);
  console.assert(
    prediction2 === 0.0,
    'Should predict 0% success for removal'
  );

  // Predict for unknown target (should use type-only)
  const hypothesis3: Hypothesis = {
    id: 'new-003',
    type: 'addition',
    target: 'unknown-target',
    description: 'Add to unknown target',
    expectedImprovement: 5,
  };

  const prediction3 = tracker.predictSuccess(hypothesis3);
  console.assert(
    prediction3 > 0.5,
    'Should predict >50% for additions (type-based)'
  );

  console.log(`  Error-handling addition: ${(prediction1 * 100).toFixed(0)}%`);
  console.log(`  Verbosity removal: ${(prediction2 * 100).toFixed(0)}%`);
  console.log(`  Unknown target addition: ${(prediction3 * 100).toFixed(0)}%`);
  console.log('✓ Predict success test passed\n');
}

/**
 * Test: Export data
 */
async function testExportData() {
  console.log('Test: Export data');

  cleanupTestStorage();
  const tracker = createMetaLearningTracker(TEST_STORAGE_DIR);

  const samples = createSampleOutcomes();
  for (const sample of samples) {
    await tracker.recordOutcome(sample);
  }

  const exportPath = await tracker.exportData();

  console.assert(fs.existsSync(exportPath), 'Export file should exist');

  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

  console.assert(exportData.metadata, 'Should have metadata');
  console.assert(exportData.outcomes, 'Should have outcomes');
  console.assert(exportData.statistics, 'Should have statistics');
  console.assert(exportData.insights, 'Should have insights');

  console.log(`  Exported to: ${exportPath}`);
  console.log('✓ Export data test passed\n');
}

/**
 * Test: Helper functions
 */
function testHelperFunctions() {
  console.log('Test: Helper functions');

  // Test calculateSuccessRate
  console.assert(calculateSuccessRate(5, 10) === 0.5, 'Should calculate 50%');
  console.assert(calculateSuccessRate(0, 10) === 0, 'Should calculate 0%');
  console.assert(calculateSuccessRate(10, 10) === 1.0, 'Should calculate 100%');
  console.assert(calculateSuccessRate(5, 0) === 0, 'Should handle zero total');

  // Test calculateMovingAverage
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const ma = calculateMovingAverage(values, 3);
  console.assert(ma.length === values.length, 'Should have same length');
  console.assert(ma[0] === 1, 'First value should be 1');
  console.assert(ma[2] === 2, 'Third value should be average of 1,2,3');

  // Test determineTrend
  const improving = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  console.assert(
    determineTrend(improving) === 'improving',
    'Should detect improving'
  );

  const declining = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  console.assert(
    determineTrend(declining) === 'declining',
    'Should detect declining'
  );

  const flat = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
  console.assert(
    determineTrend(flat) === 'plateauing',
    'Should detect plateauing'
  );

  // Test calculateVelocity
  const now = new Date();
  const timestamps = [
    new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    new Date(now.getTime()).toISOString(),
  ];
  const improvements = [0, 10];
  const velocity = calculateVelocity(timestamps, improvements);
  console.assert(
    Math.abs(velocity - 10.0) < 0.1,
    'Should calculate 10% per week'
  );

  console.log('✓ Helper functions test passed\n');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('='.repeat(70));
  console.log('META-LEARNING TRACKER TEST SUITE');
  console.log('='.repeat(70));
  console.log();

  try {
    testHelperFunctions();
    await testRecordAndRetrieve();
    await testFilterOutcomes();
    await testSuccessRateByType();
    await testSuccessRateByTarget();
    await testAnalyzePatterns();
    await testImprovementTrajectory();
    await testPredictSuccess();
    await testExportData();

    console.log('='.repeat(70));
    console.log('ALL TESTS PASSED ✓');
    console.log('='.repeat(70));
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    cleanupTestStorage();
  }
}

// Run tests if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runAllTests();
}

export { runAllTests };
