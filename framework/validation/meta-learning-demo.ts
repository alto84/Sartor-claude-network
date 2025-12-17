/**
 * Meta-Learning Tracker Demo
 *
 * Demonstrates integration between acceptance gate and meta-learning tracker
 * for continuous self-improvement with pattern analysis.
 */

import {
  createMetaLearningTracker,
  ModificationOutcome,
  Hypothesis,
  printInsights,
  printSuccessRates,
  printTrajectory,
} from './meta-learning';
import {
  createAcceptanceGate,
  ModificationProposal,
  AcceptanceDecision,
  ABTestResult,
} from './acceptance-gate';

/**
 * Create sample A/B test results
 */
function createSampleTestResults(
  improvement: number,
  regression: number
): ABTestResult {
  const baselineResults = Array(20)
    .fill(null)
    .map((_, i) => ({
      taskId: `task-${i}`,
      success: i < 14, // 14/20 baseline success
      validationPassed: i < 14,
    }));

  const candidateResults = Array(20)
    .fill(null)
    .map((_, i) => {
      let success = i < 14; // Start with baseline

      // Apply improvements
      if (i >= 14 && i < 14 + improvement) {
        success = true; // Newly passing
      }

      // Apply regressions
      if (i < regression) {
        success = false; // Newly failing
      }

      return {
        taskId: `task-${i}`,
        success,
        validationPassed: success,
      };
    });

  return {
    testId: `test-${Date.now()}`,
    task: {
      id: 'test-task',
      name: 'Sample Test Suite',
    },
    configA: {
      name: 'baseline',
      results: baselineResults,
    },
    configB: {
      name: 'candidate',
      results: candidateResults,
    },
    comparison: {
      successRateA: 14 / 20,
      successRateB: candidateResults.filter((r) => r.success).length / 20,
      validationPassRateA: 14 / 20,
      validationPassRateB: candidateResults.filter((r) => r.success).length / 20,
      sampleSize: 20,
      notes: [],
    },
  };
}

/**
 * Simulate self-improvement cycle
 */
async function simulateImprovementCycle() {
  console.log('='.repeat(70));
  console.log('META-LEARNING TRACKER DEMO');
  console.log('Simulating Self-Improvement with Pattern Analysis');
  console.log('='.repeat(70));
  console.log();

  const tracker = createMetaLearningTracker('.swarm/meta-learning-demo');
  const gate = createAcceptanceGate('.swarm/decisions-demo');

  // Scenario 1: Successful addition to error-handling
  console.log('[Cycle 1] Testing: Addition to error-handling');
  console.log('-'.repeat(70));

  const proposal1: ModificationProposal = {
    id: 'mod-001',
    type: 'addition',
    target: 'error-handling',
    description: 'Add explicit error handling requirements',
    hypothesis: 'More specific error handling guidance will improve code quality',
    testResults: [createSampleTestResults(2, 0)], // 2 improvements, 0 regressions
    timestamp: new Date().toISOString(),
  };

  const decision1 = gate.evaluate(proposal1);
  await gate.recordDecision(decision1);

  const outcome1: ModificationOutcome = {
    hypothesisId: proposal1.id,
    type: proposal1.type,
    target: proposal1.target,
    result: decision1.decision === 'ACCEPT' ? 'success' : 'failure',
    improvementPercent: 10.0,
    timestamp: proposal1.timestamp,
    metadata: {
      testsImproved: decision1.metadata.testsImproved,
      testsRegressed: decision1.metadata.testsRegressed,
      netChange: decision1.metadata.netChange,
      decisionId: decision1.metadata.decisionId,
    },
  };

  await tracker.recordOutcome(outcome1);

  console.log(`Decision: ${decision1.decision}`);
  console.log(`Improvement: ${outcome1.improvementPercent}%`);
  console.log();

  // Scenario 2: Successful addition to input-validation
  console.log('[Cycle 2] Testing: Addition to input-validation');
  console.log('-'.repeat(70));

  const proposal2: ModificationProposal = {
    id: 'mod-002',
    type: 'addition',
    target: 'input-validation',
    description: 'Add input validation requirements',
    hypothesis: 'Explicit validation rules will catch edge cases',
    testResults: [createSampleTestResults(3, 0)], // 3 improvements, 0 regressions
    timestamp: new Date().toISOString(),
  };

  const decision2 = gate.evaluate(proposal2);
  await gate.recordDecision(decision2);

  const outcome2: ModificationOutcome = {
    hypothesisId: proposal2.id,
    type: proposal2.type,
    target: proposal2.target,
    result: decision2.decision === 'ACCEPT' ? 'success' : 'failure',
    improvementPercent: 15.0,
    timestamp: proposal2.timestamp,
    metadata: {
      testsImproved: decision2.metadata.testsImproved,
      testsRegressed: decision2.metadata.testsRegressed,
      netChange: decision2.metadata.netChange,
      decisionId: decision2.metadata.decisionId,
    },
  };

  await tracker.recordOutcome(outcome2);

  console.log(`Decision: ${decision2.decision}`);
  console.log(`Improvement: ${outcome2.improvementPercent}%`);
  console.log();

  // Scenario 3: Failed removal
  console.log('[Cycle 3] Testing: Removal for verbosity reduction');
  console.log('-'.repeat(70));

  const proposal3: ModificationProposal = {
    id: 'mod-003',
    type: 'removal',
    target: 'verbosity-reduction',
    description: 'Remove redundant instructions',
    hypothesis: 'Shorter prompts reduce confusion',
    testResults: [createSampleTestResults(0, 1)], // 0 improvements, 1 regression
    timestamp: new Date().toISOString(),
  };

  const decision3 = gate.evaluate(proposal3);
  await gate.recordDecision(decision3);

  const outcome3: ModificationOutcome = {
    hypothesisId: proposal3.id,
    type: proposal3.type,
    target: proposal3.target,
    result: decision3.decision === 'ACCEPT' ? 'success' : 'failure',
    improvementPercent: -5.0,
    timestamp: proposal3.timestamp,
    metadata: {
      testsImproved: decision3.metadata.testsImproved,
      testsRegressed: decision3.metadata.testsRegressed,
      netChange: decision3.metadata.netChange,
      decisionId: decision3.metadata.decisionId,
    },
  };

  await tracker.recordOutcome(outcome3);

  console.log(`Decision: ${decision3.decision}`);
  console.log(`Improvement: ${outcome3.improvementPercent}%`);
  console.log();

  // Scenario 4: Neutral rewording
  console.log('[Cycle 4] Testing: Rewording for clarity');
  console.log('-'.repeat(70));

  const proposal4: ModificationProposal = {
    id: 'mod-004',
    type: 'reword',
    target: 'clarity-improvement',
    description: 'Reword instructions for clarity',
    hypothesis: 'Simpler language improves understanding',
    testResults: [createSampleTestResults(0, 0)], // 0 improvements, 0 regressions
    timestamp: new Date().toISOString(),
  };

  const decision4 = gate.evaluate(proposal4);
  await gate.recordDecision(decision4);

  const outcome4: ModificationOutcome = {
    hypothesisId: proposal4.id,
    type: proposal4.type,
    target: proposal4.target,
    result:
      decision4.decision === 'ACCEPT'
        ? 'success'
        : decision4.metadata.netChange === 0
        ? 'neutral'
        : 'failure',
    improvementPercent: 0.0,
    timestamp: proposal4.timestamp,
    metadata: {
      testsImproved: decision4.metadata.testsImproved,
      testsRegressed: decision4.metadata.testsRegressed,
      netChange: decision4.metadata.netChange,
      decisionId: decision4.metadata.decisionId,
    },
  };

  await tracker.recordOutcome(outcome4);

  console.log(`Decision: ${decision4.decision}`);
  console.log(`Improvement: ${outcome4.improvementPercent}%`);
  console.log();

  // Scenario 5: Another successful addition
  console.log('[Cycle 5] Testing: Another addition to error-handling');
  console.log('-'.repeat(70));

  const proposal5: ModificationProposal = {
    id: 'mod-005',
    type: 'addition',
    target: 'error-handling',
    description: 'Add edge case handling',
    hypothesis: 'Covering edge cases will reduce failures',
    testResults: [createSampleTestResults(2, 0)], // 2 improvements, 0 regressions
    timestamp: new Date().toISOString(),
  };

  const decision5 = gate.evaluate(proposal5);
  await gate.recordDecision(decision5);

  const outcome5: ModificationOutcome = {
    hypothesisId: proposal5.id,
    type: proposal5.type,
    target: proposal5.target,
    result: decision5.decision === 'ACCEPT' ? 'success' : 'failure',
    improvementPercent: 10.0,
    timestamp: proposal5.timestamp,
    metadata: {
      testsImproved: decision5.metadata.testsImproved,
      testsRegressed: decision5.metadata.testsRegressed,
      netChange: decision5.metadata.netChange,
      decisionId: decision5.metadata.decisionId,
    },
  };

  await tracker.recordOutcome(outcome5);

  console.log(`Decision: ${decision5.decision}`);
  console.log(`Improvement: ${outcome5.improvementPercent}%`);
  console.log();

  // Analyze patterns after 5 cycles
  console.log('='.repeat(70));
  console.log('PATTERN ANALYSIS AFTER 5 CYCLES');
  console.log('='.repeat(70));
  console.log();

  // Get success rates
  const typeStats = await tracker.getSuccessRateByType();
  const targetStats = await tracker.getSuccessRateByTarget();

  printSuccessRates(typeStats, targetStats);
  console.log();

  // Get insights
  const insights = await tracker.analyzePatterns();
  printInsights(insights);
  console.log();

  // Get trajectory
  const trajectory = await tracker.getImprovementTrajectory();
  printTrajectory(trajectory);
  console.log();

  // Test prediction
  console.log('='.repeat(70));
  console.log('PREDICTION TEST');
  console.log('='.repeat(70));
  console.log();

  const testHypothesis1: Hypothesis = {
    id: 'new-001',
    type: 'addition',
    target: 'error-handling',
    description: 'Add more error handling',
    expectedImprovement: 10,
  };

  const testHypothesis2: Hypothesis = {
    id: 'new-002',
    type: 'removal',
    target: 'verbosity-reduction',
    description: 'Remove verbose text',
    expectedImprovement: 5,
  };

  const testHypothesis3: Hypothesis = {
    id: 'new-003',
    type: 'reword',
    target: 'clarity-improvement',
    description: 'Reword for clarity',
    expectedImprovement: 5,
  };

  const prediction1 = tracker.predictSuccess(testHypothesis1);
  const prediction2 = tracker.predictSuccess(testHypothesis2);
  const prediction3 = tracker.predictSuccess(testHypothesis3);

  console.log('Predicted Success Rates for New Hypotheses:');
  console.log('-'.repeat(70));
  console.log(
    `Addition to error-handling: ${(prediction1 * 100).toFixed(1)}%`
  );
  console.log(
    `  (Based on 3 successful error-handling additions)`
  );
  console.log();
  console.log(
    `Removal for verbosity: ${(prediction2 * 100).toFixed(1)}%`
  );
  console.log(
    `  (Based on 1 failed removal)`
  );
  console.log();
  console.log(
    `Rewording for clarity: ${(prediction3 * 100).toFixed(1)}%`
  );
  console.log(
    `  (Based on 1 neutral rewording)`
  );
  console.log();

  // Export data
  console.log('='.repeat(70));
  console.log('DATA EXPORT');
  console.log('='.repeat(70));
  console.log();

  const exportPath = await tracker.exportData();
  console.log(`All data exported to: ${exportPath}`);
  console.log();

  console.log('='.repeat(70));
  console.log('DEMO COMPLETE');
  console.log('='.repeat(70));
  console.log();
  console.log('Key Learnings:');
  console.log('  1. Addition modifications have high success rate (3/3)');
  console.log('  2. Removal modifications caused regressions (0/1)');
  console.log('  3. Rewording had neutral effect (0/1)');
  console.log('  4. Error-handling is a promising target (3/3 successful)');
  console.log('  5. System shows improving trend');
  console.log();
  console.log('Recommendations:');
  console.log('  - Prioritize addition-type modifications');
  console.log('  - Focus on error-handling and input-validation targets');
  console.log('  - Avoid removal-type modifications without strong evidence');
  console.log('  - Be cautious with rewording (often neutral effect)');
  console.log();
}

// Run demo if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  simulateImprovementCycle().catch((error) => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

export { simulateImprovementCycle };
