/**
 * Integration Example: Meta-Learning Tracker + Acceptance Gate
 *
 * Shows how to use meta-learning tracker with acceptance gate
 * for intelligent self-improvement.
 */

import { createMetaLearningTracker, Hypothesis } from './meta-learning';
import { createAcceptanceGate, ModificationProposal } from './acceptance-gate';

/**
 * Example: Complete self-improvement cycle with meta-learning
 */
async function selfImprovementCycle() {
  // Initialize systems
  const tracker = createMetaLearningTracker();
  const gate = createAcceptanceGate();

  console.log('Self-Improvement Cycle with Meta-Learning\n');

  // Step 1: Generate hypothesis using historical data
  console.log('[Step 1] Generate hypothesis based on patterns\n');

  const candidateHypotheses: Hypothesis[] = [
    {
      id: 'hyp-001',
      type: 'addition',
      target: 'error-handling',
      description: 'Add comprehensive error handling requirements',
      expectedImprovement: 10,
    },
    {
      id: 'hyp-002',
      type: 'removal',
      target: 'verbosity-reduction',
      description: 'Remove redundant instructions',
      expectedImprovement: 5,
    },
    {
      id: 'hyp-003',
      type: 'reword',
      target: 'clarity-improvement',
      description: 'Reword for better clarity',
      expectedImprovement: 3,
    },
  ];

  // Predict success for each
  console.log('Predicted Success Rates:');
  for (const hyp of candidateHypotheses) {
    const probability = tracker.predictSuccess(hyp);
    console.log(
      `  ${hyp.id} (${hyp.type} → ${hyp.target}): ${(probability * 100).toFixed(1)}%`
    );
  }

  // Select best hypothesis
  const predictions = candidateHypotheses.map((h) => ({
    hypothesis: h,
    probability: tracker.predictSuccess(h),
  }));

  predictions.sort((a, b) => b.probability - a.probability);
  const bestHypothesis = predictions[0].hypothesis;

  console.log(`\nSelected: ${bestHypothesis.id} (${(predictions[0].probability * 100).toFixed(1)}% predicted success)\n`);

  // Step 2: Create proposal from hypothesis
  console.log('[Step 2] Create modification proposal\n');

  const proposal: ModificationProposal = {
    id: bestHypothesis.id,
    type: bestHypothesis.type,
    target: bestHypothesis.target,
    description: bestHypothesis.description,
    hypothesis: `Expected ${bestHypothesis.expectedImprovement}% improvement`,
    testResults: [
      // In real usage, run actual A/B tests here
      {
        testId: 'test-001',
        task: { id: 'task-1', name: 'Test Task' },
        configA: {
          name: 'baseline',
          results: Array(20)
            .fill(null)
            .map((_, i) => ({
              taskId: `task-${i}`,
              success: i < 14,
              validationPassed: i < 14,
            })),
        },
        configB: {
          name: 'candidate',
          results: Array(20)
            .fill(null)
            .map((_, i) => ({
              taskId: `task-${i}`,
              success: i < 16, // 2 improvements
              validationPassed: i < 16,
            })),
        },
        comparison: {
          successRateA: 0.7,
          successRateB: 0.8,
          validationPassRateA: 0.7,
          validationPassRateB: 0.8,
          sampleSize: 20,
          notes: [],
        },
      },
    ],
    timestamp: new Date().toISOString(),
  };

  console.log(`Proposal: ${proposal.description}`);
  console.log(`Type: ${proposal.type}`);
  console.log(`Target: ${proposal.target}\n`);

  // Step 3: Evaluate with acceptance gate
  console.log('[Step 3] Evaluate with acceptance gate\n');

  const decision = gate.evaluate(proposal);
  await gate.recordDecision(decision);

  console.log(`Decision: ${decision.decision}`);
  console.log(`Human Review Required: ${decision.requiresHumanReview}`);
  console.log(`Tests Improved: ${decision.metadata.testsImproved}`);
  console.log(`Tests Regressed: ${decision.metadata.testsRegressed}\n`);

  // Step 4: Record outcome for meta-learning
  console.log('[Step 4] Record outcome for meta-learning\n');

  await tracker.recordOutcome({
    hypothesisId: proposal.id,
    type: proposal.type,
    target: proposal.target,
    result: decision.decision === 'ACCEPT' ? 'success' : 'failure',
    improvementPercent:
      ((decision.metadata.testsImproved - decision.metadata.testsRegressed) /
        20) *
      100,
    timestamp: proposal.timestamp,
    metadata: {
      testsImproved: decision.metadata.testsImproved,
      testsRegressed: decision.metadata.testsRegressed,
      netChange: decision.metadata.netChange,
      decisionId: decision.metadata.decisionId,
    },
  });

  console.log('Outcome recorded\n');

  // Step 5: Analyze patterns
  console.log('[Step 5] Analyze patterns and update strategy\n');

  const typeStats = await tracker.getSuccessRateByType();
  console.log('Success Rates by Type:');
  console.log(`  Addition: ${(typeStats.addition.rate * 100).toFixed(1)}%`);
  console.log(`  Removal: ${(typeStats.removal.rate * 100).toFixed(1)}%`);
  console.log(`  Reword: ${(typeStats.reword.rate * 100).toFixed(1)}%\n`);

  const insights = await tracker.analyzePatterns();
  console.log(`Generated ${insights.length} insights\n`);

  if (insights.length > 0) {
    console.log('Top Insight:');
    const topInsight = insights[0];
    console.log(`  Pattern: ${topInsight.pattern}`);
    console.log(`  Confidence: ${(topInsight.confidence * 100).toFixed(0)}%`);
    console.log(`  Recommendation: ${topInsight.recommendation}\n`);
  }

  // Step 6: Check trajectory
  console.log('[Step 6] Monitor improvement trajectory\n');

  const trajectory = await tracker.getImprovementTrajectory();
  console.log(`Trend: ${trajectory.trend}`);
  console.log(
    `Velocity: ${trajectory.velocityPerWeek.toFixed(2)}% improvement per week`
  );
  console.log(`Data Points: ${trajectory.timestamps.length}\n`);

  console.log('Cycle complete! Ready for next iteration.\n');
}

// Run example if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  selfImprovementCycle().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { selfImprovementCycle };
