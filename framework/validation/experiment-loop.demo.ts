/**
 * Experiment Loop Demo - Shows automated self-improvement in action
 *
 * This demo illustrates:
 * 1. Setting up the experiment loop
 * 2. Generating hypotheses for improvement
 * 3. Running A/B tests automatically
 * 4. Applying changes when criteria met
 * 5. Learning from failures
 *
 * Run with: npx tsx framework/validation/experiment-loop.demo.ts
 */

import {
  createExperimentLoop,
  ExperimentConfig,
  Hypothesis,
  ExperimentStatus,
  printExperimentSummary,
} from './experiment-loop';
import { runTests, testCases } from './test-suite';

/**
 * Demo hypothesis generator
 * Simulates analyzing the codebase and generating improvement ideas
 */
async function demoHypothesisGenerator(): Promise<Hypothesis[]> {
  console.log('Analyzing codebase for improvement opportunities...');

  // In a real implementation, this would:
  // 1. Analyze test failures
  // 2. Profile performance bottlenecks
  // 3. Review code complexity
  // 4. Check for anti-patterns
  // 5. Learn from past experiments

  // For demo, we generate a few synthetic hypotheses
  const hypotheses: Hypothesis[] = [
    {
      id: `hyp-${Date.now()}-1`,
      priority: 90,
      description: 'Optimize validator regex compilation',
      hypothesis: 'Pre-compiling regex patterns will reduce validation time by avoiding repeated compilation',
      targetFile: 'framework/validation/validator.ts',
      modificationType: 'addition',
      proposedChange: 'Add regex pattern caching with Map',
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'analysis',
        confidence: 0.85,
      },
    },
    {
      id: `hyp-${Date.now()}-2`,
      priority: 75,
      description: 'Add early-exit to superlative detection',
      hypothesis: 'Detecting superlatives can exit early once one is found, reducing unnecessary checks',
      targetFile: 'framework/validation/validator.ts',
      modificationType: 'addition',
      proposedChange: 'Add early-exit logic in superlative rule',
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'analysis',
        confidence: 0.7,
      },
    },
    {
      id: `hyp-${Date.now()}-3`,
      priority: 60,
      description: 'Increase minimum sample size warning threshold',
      hypothesis: 'Current threshold of 3 iterations is too low; raising to 5 will improve statistical validity',
      targetFile: 'framework/validation/ab-test-runner.ts',
      modificationType: 'reword',
      proposedChange: 'Change iterations < 3 check to iterations < 5',
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'suggestion',
        confidence: 0.6,
      },
    },
  ];

  console.log(`Generated ${hypotheses.length} hypotheses.\n`);
  return hypotheses;
}

/**
 * Demo change applicator
 * Simulates applying a hypothesis to the codebase
 */
async function demoChangeApplicator(hypothesis: Hypothesis): Promise<void> {
  console.log(`Applying change: ${hypothesis.description}`);
  console.log(`  Target: ${hypothesis.targetFile}`);
  console.log(`  Type: ${hypothesis.modificationType}`);
  console.log(`  Change: ${hypothesis.proposedChange}`);

  // In a real implementation, this would:
  // 1. Read the target file
  // 2. Apply the modification (using Edit tool or similar)
  // 3. Verify syntax is still valid
  // 4. Create a git commit or backup

  // For demo, we just simulate the change
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('Change applied successfully.\n');
}

/**
 * Demo test runner
 * Runs the test suite in baseline or variant mode
 */
async function demoTestRunner(baseline: boolean): Promise<any> {
  // In a real implementation, this would:
  // 1. Run the full test suite
  // 2. Collect metrics (pass rate, execution time, etc.)
  // 3. Return structured results

  // For demo, we use the existing test suite
  const report = runTests(testCases);

  // Simulate slight improvement for variant (for demo purposes)
  if (!baseline) {
    // Add a small improvement to simulate variant performance
    report.passed = Math.min(report.totalTests, report.passed + 1);
  }

  return report;
}

/**
 * Run the demo
 */
async function runDemo() {
  console.log('='.repeat(80));
  console.log('EXPERIMENT LOOP DEMO - AUTOMATED SELF-IMPROVEMENT');
  console.log('='.repeat(80));
  console.log();
  console.log('This demo shows how the experiment loop works:');
  console.log('1. Generate hypotheses from code analysis');
  console.log('2. Run A/B tests for each hypothesis');
  console.log('3. Evaluate with acceptance gate (conservative criteria)');
  console.log('4. Apply changes only if they meet strict requirements');
  console.log('5. Update baseline on success');
  console.log('6. Learn from failures for future experiments');
  console.log();
  console.log('Press Ctrl+C to stop at any time.');
  console.log();

  // Create experiment loop
  const loop = createExperimentLoop(
    demoHypothesisGenerator,
    demoChangeApplicator,
    demoTestRunner,
    {
      decisionsDir: '.swarm/demo-decisions',
      baselinesDir: '.swarm/demo-baselines',
    }
  );

  // Configure experiment
  const config: ExperimentConfig = {
    maxIterations: 3,              // Run 3 improvement cycles
    stopOnRegression: false,       // Continue even if regressions found
    requireHumanApproval: false,   // Auto-apply (for demo; use true in production)
    dryRun: true,                  // Simulate only (don't actually modify files)
  };

  console.log('Starting experiment with configuration:');
  console.log(`  Max Iterations: ${config.maxIterations}`);
  console.log(`  Stop on Regression: ${config.stopOnRegression}`);
  console.log(`  Require Human Approval: ${config.requireHumanApproval}`);
  console.log(`  Dry Run: ${config.dryRun}`);
  console.log();
  console.log('-'.repeat(80));
  console.log();

  // Run experiment loop
  const results = [];

  try {
    for await (const result of loop.run(config)) {
      results.push(result);

      // Print iteration summary
      console.log('='.repeat(80));
      console.log(`ITERATION ${result.iteration} COMPLETE`);
      console.log('='.repeat(80));
      console.log(`Hypothesis: ${result.hypothesis.description}`);
      console.log(`Decision: ${result.decision.decision}`);
      console.log(`Applied: ${result.applied ? 'YES' : 'NO'}`);
      console.log(`Duration: ${result.metadata.durationMs}ms`);

      if (result.testResult) {
        console.log(`Improvement: ${result.testResult.improvement.toFixed(2)}%`);
      }

      console.log();

      // Allow manual pause/resume for demo
      // In real usage, this could be triggered by external signals
    }
  } catch (err) {
    console.error('Experiment loop error:', err);
  }

  // Print final summary
  console.log();
  printExperimentSummary(results);

  // Print status
  const status = loop.getStatus();
  console.log('Final Status:');
  console.log(`  Status: ${status.status}`);
  console.log(`  Iterations: ${status.currentIteration}/${status.maxIterations}`);
  console.log(`  Hypotheses Tested: ${status.hypothesesTested}`);
  console.log(`  Changes Applied: ${status.changesApplied}`);
  console.log(`  Changes Rejected: ${status.changesRejected}`);
  console.log();

  console.log('='.repeat(80));
  console.log('DEMO COMPLETE');
  console.log('='.repeat(80));
  console.log();
  console.log('Next steps:');
  console.log('1. Review the experiment results in .swarm/demo-decisions/');
  console.log('2. Examine the baseline snapshots in .swarm/demo-baselines/');
  console.log('3. Analyze what worked and what didn\'t');
  console.log('4. Refine hypothesis generation for better improvements');
  console.log('5. Run with dryRun=false to apply real changes');
  console.log();
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(err => {
    console.error('Demo failed:', err);
    process.exit(1);
  });
}

export { runDemo };
