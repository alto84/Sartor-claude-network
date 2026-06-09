/**
 * Experiment Loop - Automated self-improvement through A/B testing
 *
 * Implements a safe, auditable experimentation loop for continuous improvement:
 * 1. Generate hypotheses from current state
 * 2. Run A/B tests (baseline vs hypothesis)
 * 3. Evaluate with acceptance gate
 * 4. Apply changes only if criteria met
 * 5. Update baseline on success
 * 6. Learn from failures
 *
 * Safety features:
 * - Dry run mode (simulate without applying changes)
 * - Human approval checkpoints
 * - Stop on regression
 * - Full audit trail
 * - Anti-fabrication checks enforced
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { runABTest, ABTestConfig, ABTestResult } from './ab-test-runner';
import { createAcceptanceGate, AcceptanceDecision, ModificationProposal } from './acceptance-gate';
import { createBaselineTracker, BaselineMetrics } from './baseline-tracker';

// Types
export interface ExperimentConfig {
  maxIterations: number;           // How many improvement cycles to run
  stopOnRegression: boolean;       // Stop if any regression detected
  requireHumanApproval: boolean;   // Pause for human review
  dryRun: boolean;                 // Simulate without applying changes
}

export interface Hypothesis {
  id: string;
  priority: number;                // Higher = run first
  description: string;
  hypothesis: string;              // Why we think this will improve things
  targetFile: string;              // What file to modify
  modificationType: 'addition' | 'removal' | 'reword';
  proposedChange: string;          // Actual change to make
  metadata: {
    generatedAt: string;
    source: 'analysis' | 'failure' | 'suggestion' | 'manual';
    confidence: number;            // 0-1, how confident we are
  };
}

export interface ExperimentResult {
  iteration: number;
  hypothesis: Hypothesis;
  testResult: ABTestResult;
  decision: AcceptanceDecision;
  applied: boolean;
  newBaseline?: BaselineMetrics;
  metadata: {
    timestamp: string;
    durationMs: number;
    error?: string;
  };
}

export enum ExperimentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface ExperimentLoopState {
  status: ExperimentStatus;
  currentIteration: number;
  maxIterations: number;
  hypothesesTested: number;
  changesApplied: number;
  changesRejected: number;
  currentHypothesis?: Hypothesis;
}

export interface ExperimentLoop {
  run(config: ExperimentConfig): AsyncGenerator<ExperimentResult>;
  pause(): void;
  resume(): void;
  stop(): void;
  getStatus(): ExperimentLoopState;
  getHistory(): ExperimentResult[];
}

/**
 * Create experiment loop instance
 */
export function createExperimentLoop(
  hypothesisGenerator: () => Promise<Hypothesis[]>,
  changeApplicator: (hypothesis: Hypothesis) => Promise<void>,
  testRunner: (baseline: boolean) => Promise<any>,
  options: {
    decisionsDir?: string;
    baselinesDir?: string;
  } = {}
): ExperimentLoop {
  const emitter = new EventEmitter();
  const history: ExperimentResult[] = [];
  const gate = createAcceptanceGate(options.decisionsDir);
  const tracker = createBaselineTracker();

  let state: ExperimentLoopState = {
    status: ExperimentStatus.IDLE,
    currentIteration: 0,
    maxIterations: 0,
    hypothesesTested: 0,
    changesApplied: 0,
    changesRejected: 0,
  };

  let pauseRequested = false;
  let stopRequested = false;

  /**
   * Main experiment loop generator
   */
  async function* run(config: ExperimentConfig): AsyncGenerator<ExperimentResult> {
    // Initialize state
    state = {
      status: ExperimentStatus.RUNNING,
      currentIteration: 0,
      maxIterations: config.maxIterations,
      hypothesesTested: 0,
      changesApplied: 0,
      changesRejected: 0,
    };

    pauseRequested = false;
    stopRequested = false;

    console.log('='.repeat(70));
    console.log('EXPERIMENT LOOP STARTING');
    console.log('='.repeat(70));
    console.log(`Config:`);
    console.log(`  Max Iterations: ${config.maxIterations}`);
    console.log(`  Stop on Regression: ${config.stopOnRegression}`);
    console.log(`  Require Human Approval: ${config.requireHumanApproval}`);
    console.log(`  Dry Run: ${config.dryRun}`);
    console.log();

    // Capture initial baseline
    console.log('Capturing initial baseline...');
    let currentBaseline = await tracker.captureBaseline();
    await tracker.saveBaseline(currentBaseline, 'experiment-baseline-initial');
    console.log('Initial baseline captured.\n');

    // Main loop
    while (state.currentIteration < config.maxIterations && !stopRequested) {
      const iterationStart = Date.now();
      state.currentIteration++;

      console.log('-'.repeat(70));
      console.log(`ITERATION ${state.currentIteration}/${config.maxIterations}`);
      console.log('-'.repeat(70));

      // Check for pause
      if (pauseRequested) {
        state.status = ExperimentStatus.PAUSED;
        console.log('Experiment paused. Waiting for resume...\n');
        await waitForResume();
        state.status = ExperimentStatus.RUNNING;
        console.log('Experiment resumed.\n');
      }

      // Step 1: Generate hypotheses
      console.log('Step 1: Generating hypotheses...');
      let hypotheses: Hypothesis[];
      try {
        hypotheses = await hypothesisGenerator();
      } catch (err) {
        console.error('Failed to generate hypotheses:', err);
        state.status = ExperimentStatus.ERROR;
        break;
      }

      if (hypotheses.length === 0) {
        console.log('No hypotheses available. Stopping loop.\n');
        break;
      }

      console.log(`Generated ${hypotheses.length} hypotheses.\n`);

      // Step 2: Pick highest priority hypothesis
      const hypothesis = hypotheses.sort((a, b) => b.priority - a.priority)[0];
      state.currentHypothesis = hypothesis;
      state.hypothesesTested++;

      console.log('Step 2: Selected hypothesis:');
      console.log(`  ID: ${hypothesis.id}`);
      console.log(`  Priority: ${hypothesis.priority}`);
      console.log(`  Description: ${hypothesis.description}`);
      console.log(`  Target: ${hypothesis.targetFile}`);
      console.log(`  Type: ${hypothesis.modificationType}`);
      console.log();

      // Step 3: Run A/B test
      console.log('Step 3: Running A/B test...');
      let testResult: ABTestResult;
      try {
        testResult = await runABTestForHypothesis(
          hypothesis,
          testRunner,
          changeApplicator,
          config.dryRun
        );
      } catch (err) {
        console.error('A/B test failed:', err);
        const errorResult: ExperimentResult = {
          iteration: state.currentIteration,
          hypothesis,
          testResult: null as any, // Error case
          decision: null as any,   // Error case
          applied: false,
          metadata: {
            timestamp: new Date().toISOString(),
            durationMs: Date.now() - iterationStart,
            error: String(err),
          },
        };
        history.push(errorResult);
        yield errorResult;
        continue; // Try next hypothesis
      }

      console.log('A/B test complete.\n');

      // Step 4: Evaluate with acceptance gate
      console.log('Step 4: Evaluating with acceptance gate...');
      const proposal = convertToProposal(hypothesis, testResult);
      const decision = gate.evaluate(proposal);
      await gate.recordDecision(decision);

      console.log(`Decision: ${decision.decision}`);
      console.log(`Requires Human Review: ${decision.requiresHumanReview}`);
      console.log(`Reasons:`);
      decision.reasons.forEach(r => console.log(`  - ${r}`));
      console.log();

      // Step 5: Check if we should stop on regression
      if (config.stopOnRegression && decision.decision === 'REJECT') {
        console.log('Regression detected and stopOnRegression=true. Stopping loop.\n');
        state.status = ExperimentStatus.STOPPED;
        const result: ExperimentResult = {
          iteration: state.currentIteration,
          hypothesis,
          testResult,
          decision,
          applied: false,
          metadata: {
            timestamp: new Date().toISOString(),
            durationMs: Date.now() - iterationStart,
          },
        };
        history.push(result);
        yield result;
        break;
      }

      // Step 6: Apply change if accepted
      let applied = false;
      let newBaseline: BaselineMetrics | undefined;

      if (decision.decision === 'ACCEPT') {
        console.log('Step 6: Change accepted.');

        // Check for human approval if required
        if (config.requireHumanApproval && decision.requiresHumanReview) {
          console.log('Human approval required. Pausing...\n');
          state.status = ExperimentStatus.PAUSED;
          const approved = await requestHumanApproval(decision);
          state.status = ExperimentStatus.RUNNING;

          if (!approved) {
            console.log('Human rejected the change. Skipping application.\n');
            state.changesRejected++;
          } else {
            console.log('Human approved the change.\n');
            if (!config.dryRun) {
              await changeApplicator(hypothesis);
              applied = true;
              state.changesApplied++;

              // Capture new baseline
              console.log('Capturing new baseline...');
              newBaseline = await tracker.captureBaseline();
              await tracker.saveBaseline(
                newBaseline,
                `experiment-baseline-iter-${state.currentIteration}`
              );
              currentBaseline = newBaseline;
              console.log('New baseline captured.\n');
            } else {
              console.log('DRY RUN: Would have applied change.\n');
            }
          }
        } else {
          // Auto-apply (no human approval needed)
          if (!config.dryRun) {
            await changeApplicator(hypothesis);
            applied = true;
            state.changesApplied++;

            // Capture new baseline
            console.log('Capturing new baseline...');
            newBaseline = await tracker.captureBaseline();
            await tracker.saveBaseline(
              newBaseline,
              `experiment-baseline-iter-${state.currentIteration}`
            );
            currentBaseline = newBaseline;
            console.log('New baseline captured.\n');
          } else {
            console.log('DRY RUN: Would have applied change.\n');
          }
        }
      } else {
        console.log('Step 6: Change rejected. No action taken.\n');
        state.changesRejected++;
      }

      // Step 7: Record result
      const result: ExperimentResult = {
        iteration: state.currentIteration,
        hypothesis,
        testResult,
        decision,
        applied,
        newBaseline,
        metadata: {
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - iterationStart,
        },
      };

      history.push(result);
      yield result;

      console.log(`Iteration ${state.currentIteration} complete.`);
      console.log(`Duration: ${result.metadata.durationMs}ms\n`);
    }

    // Loop complete
    state.status = stopRequested ? ExperimentStatus.STOPPED : ExperimentStatus.COMPLETED;
    state.currentHypothesis = undefined;

    console.log('='.repeat(70));
    console.log('EXPERIMENT LOOP COMPLETE');
    console.log('='.repeat(70));
    console.log(`Total Iterations: ${state.currentIteration}`);
    console.log(`Hypotheses Tested: ${state.hypothesesTested}`);
    console.log(`Changes Applied: ${state.changesApplied}`);
    console.log(`Changes Rejected: ${state.changesRejected}`);
    console.log(`Final Status: ${state.status}`);
    console.log('='.repeat(70));
  }

  /**
   * Pause the experiment loop
   */
  function pause(): void {
    pauseRequested = true;
  }

  /**
   * Resume the experiment loop
   */
  function resume(): void {
    pauseRequested = false;
    emitter.emit('resume');
  }

  /**
   * Stop the experiment loop
   */
  function stop(): void {
    stopRequested = true;
  }

  /**
   * Get current status
   */
  function getStatus(): ExperimentLoopState {
    return { ...state };
  }

  /**
   * Get experiment history
   */
  function getHistory(): ExperimentResult[] {
    return [...history];
  }

  /**
   * Wait for resume event
   */
  async function waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      if (!pauseRequested) {
        resolve();
        return;
      }
      emitter.once('resume', resolve);
    });
  }

  return {
    run,
    pause,
    resume,
    stop,
    getStatus,
    getHistory,
  };
}

/**
 * Run A/B test for a hypothesis
 * Compares baseline (current) vs variant (with hypothesis applied)
 */
async function runABTestForHypothesis(
  hypothesis: Hypothesis,
  testRunner: (baseline: boolean) => Promise<any>,
  changeApplicator: (hypothesis: Hypothesis) => Promise<void>,
  dryRun: boolean
): Promise<ABTestResult> {
  const config: ABTestConfig = {
    name: `Hypothesis: ${hypothesis.id}`,
    description: hypothesis.description,
    baselineLabel: 'current',
    testSuite: ['all'],
    minImprovement: 10, // Require 10% improvement
    maxRegression: 0,   // No regressions allowed
    iterations: 3,      // Run 3 times each
  };

  // Baseline runner - current state
  const baselineRunner = () => testRunner(true);

  // Variant runner - with hypothesis applied
  const variantRunner = async () => {
    if (!dryRun) {
      // Apply change temporarily
      await changeApplicator(hypothesis);
    }
    const result = await testRunner(false);
    if (!dryRun) {
      // Rollback change (this should be implemented in changeApplicator)
      // For now, we assume the test runner handles cleanup
    }
    return result;
  };

  return runABTest(config, baselineRunner, variantRunner);
}

/**
 * Convert hypothesis + test result to modification proposal
 */
function convertToProposal(
  hypothesis: Hypothesis,
  testResult: ABTestResult
): ModificationProposal {
  // Convert ABTestResult to the format expected by acceptance gate
  const abTestResults = [{
    testId: testResult.config.name,
    task: {
      id: hypothesis.id,
      name: hypothesis.description,
    },
    configA: {
      name: testResult.config.baselineLabel,
      results: testResult.baselineResults.details.map(d => ({
        taskId: d.testId,
        success: d.passed,
        validationPassed: d.passed,
      })),
    },
    configB: {
      name: 'hypothesis-variant',
      results: testResult.variantResults.details.map(d => ({
        taskId: d.testId,
        success: d.passed,
        validationPassed: d.passed,
      })),
    },
    comparison: {
      successRateA: testResult.baselineResults.passRate / 100,
      successRateB: testResult.variantResults.passRate / 100,
      validationPassRateA: testResult.baselineResults.passRate / 100,
      validationPassRateB: testResult.variantResults.passRate / 100,
      sampleSize: testResult.config.iterations,
      notes: testResult.metadata.statisticalNotes,
    },
  }];

  return {
    id: hypothesis.id,
    type: hypothesis.modificationType,
    target: hypothesis.targetFile,
    description: hypothesis.description,
    hypothesis: hypothesis.hypothesis,
    testResults: abTestResults,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Request human approval for a change
 *
 * Mechanism:
 * 1. Writes proposal to .swarm/approvals/proposal-{id}.json
 * 2. Waits for response file .swarm/approvals/response-{id}.json
 * 3. Times out after configurable duration (default: 5 minutes)
 * 4. Defaults to REJECT for safety if no response
 *
 * Response file format:
 * {
 *   "approved": true|false,
 *   "reviewer": "human-name",
 *   "timestamp": "ISO-8601",
 *   "notes": "optional comments"
 * }
 */
async function requestHumanApproval(
  decision: AcceptanceDecision,
  timeoutMs: number = 5 * 60 * 1000 // 5 minutes default
): Promise<boolean> {
  const approvalDir = path.join(process.cwd(), '.swarm', 'approvals');
  const proposalId = decision.proposal.id;
  const proposalPath = path.join(approvalDir, `proposal-${proposalId}.json`);
  const responsePath = path.join(approvalDir, `response-${proposalId}.json`);

  // Ensure approvals directory exists
  if (!fs.existsSync(approvalDir)) {
    fs.mkdirSync(approvalDir, { recursive: true });
  }

  // Write proposal file with all decision details
  const proposalData = {
    id: proposalId,
    timestamp: new Date().toISOString(),
    proposal: {
      id: decision.proposal.id,
      type: decision.proposal.type,
      target: decision.proposal.target,
      description: decision.proposal.description,
      hypothesis: decision.proposal.hypothesis,
    },
    decision: {
      decision: decision.decision,
      requiresHumanReview: decision.requiresHumanReview,
      reasons: decision.reasons,
      rollbackPlan: decision.rollbackPlan,
    },
    testResults: decision.proposal.testResults.map(tr => ({
      testId: tr.testId,
      task: tr.task.name,
      comparison: {
        successRateA: tr.comparison.successRateA,
        successRateB: tr.comparison.successRateB,
        improvement: ((tr.comparison.successRateB - tr.comparison.successRateA) * 100).toFixed(2) + '%',
        sampleSize: tr.comparison.sampleSize,
      },
    })),
    instructions: {
      message: 'To approve this change, create a response file at:',
      responsePath: responsePath,
      format: {
        approved: 'true or false',
        reviewer: 'your-name',
        timestamp: 'ISO-8601 timestamp',
        notes: 'optional comments',
      },
      example: {
        approved: true,
        reviewer: 'human-operator',
        timestamp: new Date().toISOString(),
        notes: 'Looks good, approved',
      },
    },
  };

  fs.writeFileSync(proposalPath, JSON.stringify(proposalData, null, 2), 'utf-8');

  // Log approval request
  console.log('='.repeat(70));
  console.log('HUMAN APPROVAL REQUEST');
  console.log('='.repeat(70));
  console.log(`Proposal ID: ${decision.proposal.id}`);
  console.log(`Type: ${decision.proposal.type}`);
  console.log(`Target: ${decision.proposal.target}`);
  console.log(`Hypothesis: ${decision.proposal.hypothesis}`);
  console.log();
  console.log('Decision Details:');
  decision.reasons.forEach(r => console.log(`  - ${r}`));
  console.log();
  console.log('Rollback Plan:');
  console.log(decision.rollbackPlan);
  console.log();
  console.log('Proposal written to:');
  console.log(`  ${proposalPath}`);
  console.log();
  console.log('Waiting for response at:');
  console.log(`  ${responsePath}`);
  console.log();
  console.log(`Timeout: ${timeoutMs / 1000} seconds`);
  console.log('='.repeat(70));

  // Wait for response file or timeout
  const startTime = Date.now();
  const pollInterval = 1000; // Check every second

  while (Date.now() - startTime < timeoutMs) {
    // Check if response file exists
    if (fs.existsSync(responsePath)) {
      try {
        const responseData = JSON.parse(fs.readFileSync(responsePath, 'utf-8'));

        // Validate response structure
        if (typeof responseData.approved !== 'boolean') {
          console.error('Invalid response format: "approved" must be boolean');
          return false; // Default to reject for safety
        }

        console.log('\nHuman response received:');
        console.log(`  Approved: ${responseData.approved}`);
        console.log(`  Reviewer: ${responseData.reviewer || 'unknown'}`);
        console.log(`  Notes: ${responseData.notes || 'none'}`);
        console.log();

        // Clean up files after reading response
        try {
          fs.unlinkSync(proposalPath);
          fs.unlinkSync(responsePath);
        } catch (err) {
          console.warn('Warning: Could not clean up approval files:', err);
        }

        return responseData.approved;
      } catch (err) {
        console.error('Failed to parse response file:', err);
        return false; // Default to reject for safety
      }
    }

    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  // Timeout reached - default to reject for safety
  console.log('\nHuman approval TIMEOUT - defaulting to REJECT for safety');
  console.log('Proposal file remains at:', proposalPath);
  console.log();

  return false; // Fail-safe: reject if no human response
}

/**
 * Example hypothesis generator
 * In practice, this would analyze the codebase and generate improvement ideas
 */
export async function exampleHypothesisGenerator(): Promise<Hypothesis[]> {
  return [
    {
      id: `hypothesis-${Date.now()}-1`,
      priority: 80,
      description: 'Add caching to validator for repeated content',
      hypothesis: 'Caching validation results will reduce execution time for repeated validations',
      targetFile: 'framework/validation/validator.ts',
      modificationType: 'addition',
      proposedChange: 'Add Map-based cache for validation results',
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'analysis',
        confidence: 0.7,
      },
    },
    {
      id: `hypothesis-${Date.now()}-2`,
      priority: 60,
      description: 'Increase A/B test iterations for more confidence',
      hypothesis: 'More test iterations will reduce variance in results',
      targetFile: 'framework/validation/ab-test-runner.ts',
      modificationType: 'reword',
      proposedChange: 'Change default iterations from 3 to 5',
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'suggestion',
        confidence: 0.6,
      },
    },
  ];
}

/**
 * Print experiment summary
 */
export function printExperimentSummary(results: ExperimentResult[]): void {
  console.log('\n' + '='.repeat(70));
  console.log('EXPERIMENT SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Experiments: ${results.length}`);
  console.log();

  const applied = results.filter(r => r.applied);
  const rejected = results.filter(r => !r.applied);
  const accepted = results.filter(r => r.decision?.decision === 'ACCEPT');
  const regressed = results.filter(r => r.decision?.decision === 'REJECT');

  console.log('Results:');
  console.log(`  Applied: ${applied.length}`);
  console.log(`  Rejected: ${rejected.length}`);
  console.log(`  Accepted (but not applied): ${accepted.length - applied.length}`);
  console.log(`  Regressed: ${regressed.length}`);
  console.log();

  if (applied.length > 0) {
    console.log('Applied Changes:');
    for (const result of applied) {
      console.log(`  [${result.iteration}] ${result.hypothesis.description}`);
      console.log(`      Target: ${result.hypothesis.targetFile}`);
      console.log(`      Improvement: ${result.testResult.improvement.toFixed(2)}%`);
      console.log();
    }
  }

  if (rejected.length > 0) {
    console.log('Rejected Changes:');
    for (const result of rejected) {
      console.log(`  [${result.iteration}] ${result.hypothesis.description}`);
      const reason = result.decision?.reasons[0] || 'Unknown';
      console.log(`      Reason: ${reason}`);
      console.log();
    }
  }

  console.log('='.repeat(70));
}

// CLI execution example
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  console.log('Experiment Loop - Automated Self-Improvement');
  console.log();
  console.log('This module implements a safe experimentation loop for continuous improvement.');
  console.log();
  console.log('Example usage:');
  console.log('  import { createExperimentLoop } from "./experiment-loop";');
  console.log('  const loop = createExperimentLoop(hypothesisGen, changeApply, testRun);');
  console.log('  for await (const result of loop.run(config)) {');
  console.log('    console.log("Result:", result);');
  console.log('  }');
  console.log();
  console.log('Safety features:');
  console.log('  - Dry run mode (simulate without changes)');
  console.log('  - Human approval checkpoints');
  console.log('  - Stop on regression');
  console.log('  - Full audit trail');
  console.log('  - Anti-fabrication checks');
}
