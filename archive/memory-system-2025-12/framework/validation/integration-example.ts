/**
 * Integration Example - Complete end-to-end example
 *
 * Shows how the experiment loop integrates with the full validation stack:
 * - Hypothesis generation from real codebase analysis
 * - A/B testing with actual test suite
 * - Acceptance gate evaluation
 * - Baseline tracking
 * - Change application with rollback
 *
 * This example is for reference and documentation purposes.
 * Run the demo instead: npx tsx framework/validation/experiment-loop.demo.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  createExperimentLoop,
  ExperimentConfig,
  Hypothesis,
  printExperimentSummary,
} from './experiment-loop';
import { runTests, testCases } from './test-suite';
import { validate } from './validator';

/**
 * Real hypothesis generator that analyzes the codebase
 */
async function generateRealHypotheses(): Promise<Hypothesis[]> {
  const hypotheses: Hypothesis[] = [];

  // 1. Analyze validator performance
  const validatorPath = path.join(__dirname, 'validator.ts');
  if (fs.existsSync(validatorPath)) {
    const content = fs.readFileSync(validatorPath, 'utf-8');

    // Check for regex compilation in loops
    if (content.includes('new RegExp') && content.includes('for')) {
      hypotheses.push({
        id: `optimize-regex-${Date.now()}`,
        priority: 85,
        description: 'Pre-compile regex patterns to avoid repeated compilation',
        hypothesis:
          'Regex compilation in loops causes performance overhead. Pre-compiling patterns will improve validation speed.',
        targetFile: validatorPath,
        modificationType: 'addition',
        proposedChange: 'Add const PATTERN_CACHE = new Map<string, RegExp>() at module level',
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'analysis',
          confidence: 0.8,
        },
      });
    }

    // Check for repeated array allocations
    if (content.match(/\[\]\.push/g)?.length > 5) {
      hypotheses.push({
        id: `preallocate-arrays-${Date.now()}`,
        priority: 70,
        description: 'Pre-allocate arrays with estimated capacity',
        hypothesis:
          'Repeated array growth causes memory reallocation. Pre-allocating arrays will reduce overhead.',
        targetFile: validatorPath,
        modificationType: 'addition',
        proposedChange: 'Use Array.from({length: estimatedSize}) instead of []',
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'analysis',
          confidence: 0.6,
        },
      });
    }
  }

  // 2. Analyze test failures
  const testReport = runTests(testCases);
  const failedTests = testReport.results.filter(r => !r.passed);

  for (const failed of failedTests) {
    hypotheses.push({
      id: `fix-test-${failed.testId}-${Date.now()}`,
      priority: 95, // High priority for fixes
      description: `Fix failing test: ${failed.name}`,
      hypothesis: `Test failure indicates a validation rule issue. Adjusting the rule will fix the test.`,
      targetFile: 'framework/validation/validator.ts',
      modificationType: 'reword',
      proposedChange: `Adjust validation logic for rule: ${failed.rule}`,
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'failure',
        confidence: 0.7,
      },
    });
  }

  // 3. Analyze baseline metrics
  const baselineFiles = fs.existsSync('.swarm/baselines')
    ? fs.readdirSync('.swarm/baselines').filter(f => f.endsWith('.json'))
    : [];

  if (baselineFiles.length > 0) {
    const latestBaseline = baselineFiles.sort().pop();
    const baselinePath = path.join('.swarm/baselines', latestBaseline!);
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));

    // Check for low validation score
    if (baseline.validationScore < 1000) {
      hypotheses.push({
        id: `improve-validation-speed-${Date.now()}`,
        priority: 80,
        description: 'Improve validation throughput',
        hypothesis: `Current validation score is ${baseline.validationScore} ops/sec. Optimizations can improve this.`,
        targetFile: 'framework/validation/validator.ts',
        modificationType: 'addition',
        proposedChange: 'Add caching and optimize regex patterns',
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'analysis',
          confidence: 0.75,
        },
      });
    }

    // Check for slow memory operations
    if (baseline.memoryLatency?.warm > 10) {
      hypotheses.push({
        id: `optimize-memory-${Date.now()}`,
        priority: 75,
        description: 'Optimize memory query performance',
        hypothesis: `Warm memory latency is ${baseline.memoryLatency.warm}ms. Indexing can reduce this.`,
        targetFile: 'framework/memory/memory-store.ts',
        modificationType: 'addition',
        proposedChange: 'Add secondary indexes for common query patterns',
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'analysis',
          confidence: 0.7,
        },
      });
    }
  }

  // 4. Analyze decision history for patterns
  const decisionsDir = '.swarm/decisions';
  if (fs.existsSync(decisionsDir)) {
    const indexPath = path.join(decisionsDir, 'index.json');
    if (fs.existsSync(indexPath)) {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      const accepted = index.filter((d: any) => d.decision === 'ACCEPT');
      const rejected = index.filter((d: any) => d.decision === 'REJECT');

      // Learn from successful patterns
      if (accepted.length > 0) {
        const successfulTypes = accepted.map((d: any) => {
          const decision = JSON.parse(fs.readFileSync(d.filepath, 'utf-8'));
          return decision.proposal.type;
        });

        const mostSuccessfulType = successfulTypes.sort(
          (a, b) =>
            successfulTypes.filter(t => t === b).length -
            successfulTypes.filter(t => t === a).length
        )[0];

        if (mostSuccessfulType) {
          hypotheses.push({
            id: `apply-successful-pattern-${Date.now()}`,
            priority: 65,
            description: `Apply successful modification pattern: ${mostSuccessfulType}`,
            hypothesis: `Past experiments show ${mostSuccessfulType} modifications have high success rate.`,
            targetFile: 'framework/validation/validator.ts',
            modificationType: mostSuccessfulType as any,
            proposedChange: 'Apply learned pattern from successful experiments',
            metadata: {
              generatedAt: new Date().toISOString(),
              source: 'suggestion',
              confidence: 0.6,
            },
          });
        }
      }

      // Avoid failed patterns
      if (rejected.length > 3) {
        console.log(
          `Warning: ${rejected.length} rejected changes. Review decision history for anti-patterns.`
        );
      }
    }
  }

  // Sort by priority (highest first)
  return hypotheses.sort((a, b) => b.priority - a.priority);
}

/**
 * Real change applicator with rollback support
 */
async function applyRealChange(hypothesis: Hypothesis): Promise<void> {
  console.log(`Applying change to ${hypothesis.targetFile}...`);

  // 1. Create backup
  const backupPath = `${hypothesis.targetFile}.backup-${hypothesis.id}`;
  if (fs.existsSync(hypothesis.targetFile)) {
    fs.copyFileSync(hypothesis.targetFile, backupPath);
    console.log(`Created backup: ${backupPath}`);
  }

  // 2. Apply modification
  try {
    const content = fs.readFileSync(hypothesis.targetFile, 'utf-8');

    let modified: string;
    switch (hypothesis.modificationType) {
      case 'addition':
        // Add new code at appropriate location
        // For demo, just append at end
        modified = content + '\n\n// ' + hypothesis.proposedChange + '\n';
        break;

      case 'removal':
        // Remove specific code section
        // For demo, just add a comment
        modified = content.replace(hypothesis.proposedChange, '/* REMOVED */');
        break;

      case 'reword':
        // Modify existing code
        // For demo, find and replace
        modified = content; // Would do actual replacement here
        break;

      default:
        throw new Error(`Unknown modification type: ${hypothesis.modificationType}`);
    }

    // 3. Write modified content
    fs.writeFileSync(hypothesis.targetFile, modified, 'utf-8');
    console.log('Change applied successfully.');

    // 4. Store rollback information
    const rollbackInfo = {
      hypothesisId: hypothesis.id,
      targetFile: hypothesis.targetFile,
      backupPath,
      timestamp: new Date().toISOString(),
    };

    const rollbackDir = '.swarm/rollbacks';
    if (!fs.existsSync(rollbackDir)) {
      fs.mkdirSync(rollbackDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(rollbackDir, `${hypothesis.id}.json`),
      JSON.stringify(rollbackInfo, null, 2)
    );
  } catch (err) {
    // Rollback on error
    console.error('Error applying change:', err);
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, hypothesis.targetFile);
      console.log('Rolled back changes.');
    }
    throw err;
  }
}

/**
 * Rollback a change
 */
async function rollbackChange(hypothesisId: string): Promise<void> {
  const rollbackInfo = path.join('.swarm/rollbacks', `${hypothesisId}.json`);

  if (!fs.existsSync(rollbackInfo)) {
    throw new Error(`No rollback information found for ${hypothesisId}`);
  }

  const info = JSON.parse(fs.readFileSync(rollbackInfo, 'utf-8'));

  if (fs.existsSync(info.backupPath)) {
    fs.copyFileSync(info.backupPath, info.targetFile);
    console.log(`Rolled back ${info.targetFile} from ${info.backupPath}`);

    // Clean up backup
    fs.unlinkSync(info.backupPath);
    fs.unlinkSync(rollbackInfo);
  } else {
    throw new Error(`Backup file not found: ${info.backupPath}`);
  }
}

/**
 * Real test runner using actual test suite
 */
async function runRealTests(baseline: boolean): Promise<any> {
  // Run actual test suite
  const report = runTests(testCases);

  // Return in format expected by A/B test runner
  return {
    totalTests: report.totalTests,
    passed: report.passed,
    failed: report.failed,
    results: report.results.map(r => ({
      testId: r.testId,
      name: r.name,
      passed: r.passed,
      executionTimeMs: 10, // Would measure actual execution time
    })),
  };
}

/**
 * Complete integration example
 */
async function runIntegrationExample() {
  console.log('='.repeat(80));
  console.log('INTEGRATION EXAMPLE - REAL EXPERIMENT LOOP');
  console.log('='.repeat(80));
  console.log();
  console.log('This example shows real integration with:');
  console.log('- Codebase analysis for hypothesis generation');
  console.log('- Actual test suite execution');
  console.log('- File modification with rollback support');
  console.log('- Baseline tracking and comparison');
  console.log();
  console.log('WARNING: This is for demonstration only.');
  console.log('Do not run with dryRun=false without reviewing the code first.');
  console.log();

  // Create experiment loop with real components
  const loop = createExperimentLoop(
    generateRealHypotheses,
    applyRealChange,
    runRealTests,
    {
      decisionsDir: '.swarm/decisions',
      baselinesDir: '.swarm/baselines',
    }
  );

  // Configure for safe exploration
  const config: ExperimentConfig = {
    maxIterations: 5,
    stopOnRegression: true,
    requireHumanApproval: true,
    dryRun: true, // ALWAYS start with dry run
  };

  console.log('Configuration:');
  console.log(`  Max Iterations: ${config.maxIterations}`);
  console.log(`  Stop on Regression: ${config.stopOnRegression}`);
  console.log(`  Require Human Approval: ${config.requireHumanApproval}`);
  console.log(`  Dry Run: ${config.dryRun}`);
  console.log();

  // Run experiment
  const results = [];
  try {
    for await (const result of loop.run(config)) {
      results.push(result);
      console.log(`Iteration ${result.iteration} complete.`);
    }
  } catch (err) {
    console.error('Experiment failed:', err);
  }

  // Print summary
  printExperimentSummary(results);

  console.log();
  console.log('='.repeat(80));
  console.log('INTEGRATION EXAMPLE COMPLETE');
  console.log('='.repeat(80));
  console.log();
  console.log('Next steps:');
  console.log('1. Review experiment results in .swarm/decisions/');
  console.log('2. Examine baseline progression in .swarm/baselines/');
  console.log('3. If satisfied, run with dryRun=false to apply changes');
  console.log('4. Monitor for regressions and rollback if needed');
  console.log();
}

// Export for use in other modules
export {
  generateRealHypotheses,
  applyRealChange,
  rollbackChange,
  runRealTests,
  runIntegrationExample,
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('This is an example file for reference.');
  console.log('Run the demo instead: npx tsx framework/validation/experiment-loop.demo.ts');
  console.log();
}
