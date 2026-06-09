/**
 * Acceptance Gate - Conservative decision logic for self-improvement
 *
 * Implements rigorous acceptance criteria for modification proposals with
 * anti-fabrication checks and comprehensive audit trails.
 *
 * Design principles:
 * - Conservative: Prefer rejecting marginal improvements over accepting weak changes
 * - Evidence-based: All decisions backed by measured test results
 * - Auditable: Complete decision history with rollback plans
 * - Anti-fabrication: Verify all scores come from actual test runs
 */

import * as fs from 'fs';
import * as path from 'path';
import { validate } from './validator';

// Types
export interface ABTestResult {
  testId: string;
  task: {
    id: string;
    name: string;
  };
  configA: {
    name: string;
    results: Array<{
      taskId: string;
      success: boolean;
      validationPassed: boolean;
    }>;
  };
  configB: {
    name: string;
    results: Array<{
      taskId: string;
      success: boolean;
      validationPassed: boolean;
    }>;
  };
  comparison: {
    successRateA: number;
    successRateB: number;
    validationPassRateA: number;
    validationPassRateB: number;
    sampleSize: number;
    notes: string[];
  };
}

export interface ModificationProposal {
  id: string;
  type: 'addition' | 'removal' | 'reword';
  target: string;                  // What file/config is being modified
  description: string;
  hypothesis: string;              // Why we think this will help
  testResults: ABTestResult[];     // Must include actual test results
  timestamp: string;
}

export interface AcceptanceDecision {
  proposal: ModificationProposal;
  decision: 'ACCEPT' | 'REJECT' | 'REVIEW_NEEDED';
  reasons: string[];
  requiresHumanReview: boolean;
  rollbackPlan: string;
  metadata: {
    timestamp: string;
    decisionId: string;
    testsImproved: number;
    testsRegressed: number;
    netChange: number;
    fabricationFlags: string[];
  };
}

export interface AcceptanceGate {
  evaluate(proposal: ModificationProposal): AcceptanceDecision;
  recordDecision(decision: AcceptanceDecision): Promise<void>;
  getDecisionHistory(): Promise<AcceptanceDecision[]>;
}

// Anti-fabrication checks
interface FabricationCheck {
  passed: boolean;
  flags: string[];
}

/**
 * Verify that all scores in test results come from actual measurements
 */
function checkForFabricatedScores(proposal: ModificationProposal): FabricationCheck {
  const flags: string[] = [];

  // Check 1: Ensure test results exist
  if (!proposal.testResults || proposal.testResults.length === 0) {
    flags.push('No test results provided - cannot verify improvement');
    return { passed: false, flags };
  }

  // Check 2: Verify all test results have actual execution data
  for (const testResult of proposal.testResults) {
    if (!testResult.configA.results || testResult.configA.results.length === 0) {
      flags.push(`Test ${testResult.testId}: Missing baseline (configA) execution results`);
    }

    if (!testResult.configB.results || testResult.configB.results.length === 0) {
      flags.push(`Test ${testResult.testId}: Missing candidate (configB) execution results`);
    }

    // Check 3: Verify sample size is reasonable (not fabricated)
    if (testResult.comparison.sampleSize < 1) {
      flags.push(`Test ${testResult.testId}: Invalid sample size (${testResult.comparison.sampleSize})`);
    }

    // Check 4: Verify success rates match actual results
    const actualSuccessA = testResult.configA.results.filter(r => r.success).length;
    const actualRateA = actualSuccessA / testResult.configA.results.length;
    const reportedRateA = testResult.comparison.successRateA;

    if (Math.abs(actualRateA - reportedRateA) > 0.01) {
      flags.push(
        `Test ${testResult.testId}: Reported success rate A (${reportedRateA}) doesn't match actual (${actualRateA})`
      );
    }

    const actualSuccessB = testResult.configB.results.filter(r => r.success).length;
    const actualRateB = actualSuccessB / testResult.configB.results.length;
    const reportedRateB = testResult.comparison.successRateB;

    if (Math.abs(actualRateB - reportedRateB) > 0.01) {
      flags.push(
        `Test ${testResult.testId}: Reported success rate B (${reportedRateB}) doesn't match actual (${actualRateB})`
      );
    }
  }

  // Check 5: Validate hypothesis and description for fabrication language
  const textToValidate = `${proposal.hypothesis} ${proposal.description}`;
  const validationReport = validate(textToValidate);

  // Flag superlatives and fabricated scores in the proposal text
  for (const result of validationReport.results) {
    if (result.rule === 'no-superlatives') {
      flags.push(`Proposal contains banned superlative: ${result.message}`);
    }
    if (result.rule === 'no-fabricated-scores' && result.severity === 'warning') {
      flags.push(`Proposal contains unsupported score: ${result.message}`);
    }
  }

  return {
    passed: flags.length === 0,
    flags,
  };
}

/**
 * Calculate net improvement across all tests
 */
function calculateNetImprovement(proposal: ModificationProposal): {
  testsImproved: number;
  testsRegressed: number;
  netChange: number;
  details: string[];
} {
  let testsImproved = 0;
  let testsRegressed = 0;
  const details: string[] = [];

  for (const testResult of proposal.testResults) {
    const rateA = testResult.comparison.successRateA;
    const rateB = testResult.comparison.successRateB;

    // Meaningful threshold: at least 10% improvement or regression
    const THRESHOLD = 0.1;

    if (rateB > rateA + THRESHOLD) {
      testsImproved++;
      details.push(
        `${testResult.task.name}: Improved (${(rateA * 100).toFixed(1)}% → ${(rateB * 100).toFixed(1)}%)`
      );
    } else if (rateB < rateA - THRESHOLD) {
      testsRegressed++;
      details.push(
        `${testResult.task.name}: Regressed (${(rateA * 100).toFixed(1)}% → ${(rateB * 100).toFixed(1)}%)`
      );
    } else {
      details.push(
        `${testResult.task.name}: No significant change (${(rateA * 100).toFixed(1)}% → ${(rateB * 100).toFixed(1)}%)`
      );
    }
  }

  return {
    testsImproved,
    testsRegressed,
    netChange: testsImproved - testsRegressed,
    details,
  };
}

/**
 * Conservative acceptance gate implementation
 */
export function createAcceptanceGate(decisionsDir: string = '.swarm/decisions'): AcceptanceGate {
  // Ensure decisions directory exists
  if (!fs.existsSync(decisionsDir)) {
    fs.mkdirSync(decisionsDir, { recursive: true });
  }

  return {
    /**
     * Evaluate modification proposal with conservative criteria
     */
    evaluate(proposal: ModificationProposal): AcceptanceDecision {
      const decisionId = `decision-${proposal.id}-${Date.now()}`;
      const reasons: string[] = [];
      let decision: 'ACCEPT' | 'REJECT' | 'REVIEW_NEEDED' = 'REJECT';
      let requiresHumanReview = false;

      // Step 1: Anti-fabrication checks (MANDATORY)
      const fabricationCheck = checkForFabricatedScores(proposal);
      if (!fabricationCheck.passed) {
        decision = 'REJECT';
        reasons.push('FABRICATION DETECTED: Proposal failed anti-fabrication checks');
        reasons.push(...fabricationCheck.flags);

        return {
          proposal,
          decision,
          reasons,
          requiresHumanReview: true, // Always require review for fabrication
          rollbackPlan: `No changes were applied. Proposal ${proposal.id} rejected at gate.`,
          metadata: {
            timestamp: new Date().toISOString(),
            decisionId,
            testsImproved: 0,
            testsRegressed: 0,
            netChange: 0,
            fabricationFlags: fabricationCheck.flags,
          },
        };
      }

      // Step 2: Calculate actual improvement metrics
      const improvement = calculateNetImprovement(proposal);

      // Step 3: Apply conservative acceptance rules
      reasons.push(...improvement.details);

      // RULE 1: Zero tolerance for regressions
      if (improvement.testsRegressed > 0) {
        decision = 'REJECT';
        reasons.push(
          `REJECT: ${improvement.testsRegressed} test(s) regressed. Zero regressions allowed.`
        );
        requiresHumanReview = false; // Clear rejection, no need for review
      }
      // RULE 2: Must show meaningful improvement
      else if (improvement.testsImproved === 0) {
        decision = 'REJECT';
        reasons.push('REJECT: No measurable improvement detected.');
        requiresHumanReview = false;
      }
      // RULE 3: Single test improvement is too weak (need 2+)
      else if (improvement.testsImproved === 1) {
        decision = 'REJECT';
        reasons.push(
          `REJECT: Only 1 test improved. Minimum threshold is 2 tests for acceptance.`
        );
        reasons.push('Reasoning: Single test improvement may be noise or edge case.');
        requiresHumanReview = false;
      }
      // RULE 4: 2+ tests improved, no regressions = ACCEPT (with human review)
      else if (improvement.testsImproved >= 2 && improvement.testsRegressed === 0) {
        decision = 'ACCEPT';
        reasons.push(
          `ACCEPT: ${improvement.testsImproved} test(s) improved, ${improvement.testsRegressed} regressed.`
        );
        reasons.push('Conservative threshold met: 2+ improvements, 0 regressions.');
        requiresHumanReview = true; // All acceptances require human review
      }
      // RULE 5: Architectural changes always need review
      else if (proposal.type === 'removal' || proposal.target.includes('immutable')) {
        decision = 'REVIEW_NEEDED';
        reasons.push('REVIEW_NEEDED: Proposal involves removal or immutable components.');
        requiresHumanReview = true;
      }

      // Step 4: Additional safety checks
      if (proposal.type === 'removal') {
        reasons.push(
          'WARNING: Removal type modifications carry higher risk. Verify no critical functionality lost.'
        );
      }

      if (proposal.target.toLowerCase().includes('safety')) {
        decision = 'REVIEW_NEEDED';
        reasons.push('REVIEW_NEEDED: Modifications to safety-related components require human review.');
        requiresHumanReview = true;
      }

      // Step 5: Generate rollback plan
      const rollbackPlan = generateRollbackPlan(proposal, decision);

      return {
        proposal,
        decision,
        reasons,
        requiresHumanReview,
        rollbackPlan,
        metadata: {
          timestamp: new Date().toISOString(),
          decisionId,
          testsImproved: improvement.testsImproved,
          testsRegressed: improvement.testsRegressed,
          netChange: improvement.netChange,
          fabricationFlags: fabricationCheck.flags,
        },
      };
    },

    /**
     * Record decision to audit trail
     */
    async recordDecision(decision: AcceptanceDecision): Promise<void> {
      const filename = `${decision.metadata.decisionId}.json`;
      const filepath = path.join(decisionsDir, filename);

      // Write decision with full details
      const record = {
        ...decision,
        _audit: {
          recordedAt: new Date().toISOString(),
          version: '1.0.0',
          schema: 'acceptance-decision',
        },
      };

      fs.writeFileSync(filepath, JSON.stringify(record, null, 2));

      // Also update the index file for quick lookups
      const indexPath = path.join(decisionsDir, 'index.json');
      let index: any[] = [];

      if (fs.existsSync(indexPath)) {
        index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      }

      index.push({
        decisionId: decision.metadata.decisionId,
        proposalId: decision.proposal.id,
        decision: decision.decision,
        timestamp: decision.metadata.timestamp,
        testsImproved: decision.metadata.testsImproved,
        testsRegressed: decision.metadata.testsRegressed,
        requiresHumanReview: decision.requiresHumanReview,
        filepath,
      });

      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    },

    /**
     * Retrieve decision history
     */
    async getDecisionHistory(): Promise<AcceptanceDecision[]> {
      const indexPath = path.join(decisionsDir, 'index.json');

      if (!fs.existsSync(indexPath)) {
        return [];
      }

      const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      const decisions: AcceptanceDecision[] = [];

      for (const entry of index) {
        if (fs.existsSync(entry.filepath)) {
          const decision = JSON.parse(fs.readFileSync(entry.filepath, 'utf-8'));
          decisions.push(decision);
        }
      }

      return decisions;
    },
  };
}

/**
 * Generate rollback plan based on decision
 */
function generateRollbackPlan(
  proposal: ModificationProposal,
  decision: 'ACCEPT' | 'REJECT' | 'REVIEW_NEEDED'
): string {
  if (decision === 'REJECT') {
    return `No changes were applied. Proposal ${proposal.id} rejected at gate. No rollback needed.`;
  }

  const steps = [
    '# Rollback Plan',
    '',
    `Proposal ID: ${proposal.id}`,
    `Target: ${proposal.target}`,
    `Type: ${proposal.type}`,
    '',
    '## Steps to Rollback:',
    '',
  ];

  if (proposal.type === 'addition') {
    steps.push('1. Locate the added content in the target file');
    steps.push('2. Remove the added lines or configuration');
    steps.push(`3. Restore ${proposal.target} to previous state`);
    steps.push('4. Run test suite to verify baseline performance restored');
  } else if (proposal.type === 'removal') {
    steps.push('1. Restore the removed content from version control or backup');
    steps.push(`2. Re-apply to ${proposal.target}`);
    steps.push('3. Run test suite to verify baseline performance restored');
  } else if (proposal.type === 'reword') {
    steps.push('1. Locate the modified text in the target file');
    steps.push('2. Replace with original wording');
    steps.push(`3. Restore ${proposal.target} to previous state`);
    steps.push('4. Run test suite to verify baseline performance restored');
  }

  steps.push('');
  steps.push('## Verification:');
  steps.push('- [ ] Changes reverted');
  steps.push('- [ ] Test suite run');
  steps.push('- [ ] Baseline performance confirmed');
  steps.push('- [ ] Decision record updated with rollback status');
  steps.push('');
  steps.push('## Git Rollback (if committed):');
  steps.push('```bash');
  steps.push('# Find the commit that applied this proposal');
  steps.push(`git log --grep="${proposal.id}" --oneline`);
  steps.push('');
  steps.push('# Revert the specific commit');
  steps.push('git revert <commit-hash>');
  steps.push('');
  steps.push('# Or reset to before the change (destructive)');
  steps.push('# git reset --hard <commit-before-change>');
  steps.push('```');

  return steps.join('\n');
}

/**
 * Print decision summary
 */
export function printDecision(decision: AcceptanceDecision): void {
  console.log('='.repeat(70));
  console.log('ACCEPTANCE GATE DECISION');
  console.log('='.repeat(70));
  console.log(`Decision ID: ${decision.metadata.decisionId}`);
  console.log(`Proposal ID: ${decision.proposal.id}`);
  console.log(`Timestamp: ${decision.metadata.timestamp}`);
  console.log();
  console.log(`DECISION: ${decision.decision}`);
  console.log(`Human Review Required: ${decision.requiresHumanReview ? 'YES' : 'NO'}`);
  console.log();
  console.log('Modification Details:');
  console.log(`  Type: ${decision.proposal.type}`);
  console.log(`  Target: ${decision.proposal.target}`);
  console.log(`  Hypothesis: ${decision.proposal.hypothesis}`);
  console.log();
  console.log('Test Results:');
  console.log(`  Tests Improved: ${decision.metadata.testsImproved}`);
  console.log(`  Tests Regressed: ${decision.metadata.testsRegressed}`);
  console.log(`  Net Change: ${decision.metadata.netChange}`);
  console.log();
  console.log('Reasons:');
  for (const reason of decision.reasons) {
    console.log(`  - ${reason}`);
  }
  console.log();

  if (decision.metadata.fabricationFlags.length > 0) {
    console.log('FABRICATION FLAGS:');
    for (const flag of decision.metadata.fabricationFlags) {
      console.log(`  ! ${flag}`);
    }
    console.log();
  }

  console.log('Rollback Plan:');
  console.log(decision.rollbackPlan);
  console.log('='.repeat(70));
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  console.log('Acceptance Gate - Conservative Self-Improvement Decision Logic');
  console.log();
  console.log('This module provides a conservative acceptance gate for modification proposals.');
  console.log();
  console.log('Acceptance Criteria:');
  console.log('  - ACCEPT: 2+ tests improved, 0 regressions, no fabricated scores');
  console.log('  - REJECT: Any regression OR <2 improvements OR fabrication detected');
  console.log('  - REVIEW_NEEDED: Architectural changes, safety concerns, borderline cases');
  console.log();
  console.log('Example usage:');
  console.log('  import { createAcceptanceGate } from "./acceptance-gate";');
  console.log('  const gate = createAcceptanceGate();');
  console.log('  const decision = gate.evaluate(proposal);');
  console.log('  await gate.recordDecision(decision);');
}

export { checkForFabricatedScores, calculateNetImprovement };
