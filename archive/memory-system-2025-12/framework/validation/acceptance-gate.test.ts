/**
 * Acceptance Gate Tests - Verify conservative decision logic
 */

import {
  createAcceptanceGate,
  ModificationProposal,
  AcceptanceDecision,
  checkForFabricatedScores,
  calculateNetImprovement,
} from './acceptance-gate';
import * as fs from 'fs';
import * as path from 'path';

// Test fixtures
const createMockProposal = (overrides?: Partial<ModificationProposal>): ModificationProposal => {
  return {
    id: 'test-proposal-001',
    type: 'addition',
    target: 'prompts/test-prompt.md',
    description: 'Add error handling requirements to code generation prompts',
    hypothesis: 'Explicit error handling requirements will reduce code generation test failures',
    testResults: [
      {
        testId: 'ab-test-001',
        task: { id: 'task-001', name: 'Code Generation' },
        configA: {
          name: 'baseline',
          results: [
            { taskId: 'task-001', success: true, validationPassed: true },
            { taskId: 'task-001', success: true, validationPassed: true },
            { taskId: 'task-001', success: false, validationPassed: false },
          ],
        },
        configB: {
          name: 'candidate',
          results: [
            { taskId: 'task-001', success: true, validationPassed: true },
            { taskId: 'task-001', success: true, validationPassed: true },
            { taskId: 'task-001', success: true, validationPassed: true },
          ],
        },
        comparison: {
          successRateA: 0.67,
          successRateB: 1.0,
          validationPassRateA: 0.67,
          validationPassRateB: 1.0,
          sampleSize: 3,
          notes: [],
        },
      },
      {
        testId: 'ab-test-002',
        task: { id: 'task-002', name: 'Error Handling' },
        configA: {
          name: 'baseline',
          results: [
            { taskId: 'task-002', success: false, validationPassed: false },
            { taskId: 'task-002', success: false, validationPassed: false },
            { taskId: 'task-002', success: false, validationPassed: false },
          ],
        },
        configB: {
          name: 'candidate',
          results: [
            { taskId: 'task-002', success: true, validationPassed: true },
            { taskId: 'task-002', success: true, validationPassed: true },
            { taskId: 'task-002', success: false, validationPassed: false },
          ],
        },
        comparison: {
          successRateA: 0.0,
          successRateB: 0.67,
          validationPassRateA: 0.0,
          validationPassRateB: 0.67,
          sampleSize: 3,
          notes: [],
        },
      },
    ],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
};

// Test suite
describe('Acceptance Gate', () => {
  const testDir = '.test-decisions';

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('Anti-fabrication checks', () => {
    test('should reject proposal with no test results', () => {
      const proposal = createMockProposal({ testResults: [] });
      const check = checkForFabricatedScores(proposal);

      expect(check.passed).toBe(false);
      expect(check.flags).toContain('No test results provided - cannot verify improvement');
    });

    test('should reject proposal with missing baseline results', () => {
      const proposal = createMockProposal({
        testResults: [
          {
            testId: 'ab-test-001',
            task: { id: 'task-001', name: 'Test' },
            configA: { name: 'baseline', results: [] },
            configB: {
              name: 'candidate',
              results: [{ taskId: 'task-001', success: true, validationPassed: true }],
            },
            comparison: {
              successRateA: 0.0,
              successRateB: 1.0,
              validationPassRateA: 0.0,
              validationPassRateB: 1.0,
              sampleSize: 1,
              notes: [],
            },
          },
        ],
      });

      const check = checkForFabricatedScores(proposal);

      expect(check.passed).toBe(false);
      expect(check.flags.some(f => f.includes('Missing baseline'))).toBe(true);
    });

    test('should reject proposal with mismatched success rates', () => {
      const proposal = createMockProposal({
        testResults: [
          {
            testId: 'ab-test-001',
            task: { id: 'task-001', name: 'Test' },
            configA: {
              name: 'baseline',
              results: [
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: false, validationPassed: false },
              ],
            },
            configB: {
              name: 'candidate',
              results: [
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
              ],
            },
            comparison: {
              successRateA: 0.9, // WRONG - actual is 0.5
              successRateB: 1.0,
              validationPassRateA: 0.9,
              validationPassRateB: 1.0,
              sampleSize: 2,
              notes: [],
            },
          },
        ],
      });

      const check = checkForFabricatedScores(proposal);

      expect(check.passed).toBe(false);
      expect(check.flags.some(f => f.includes("doesn't match actual"))).toBe(true);
    });

    test('should reject proposal with banned superlatives in hypothesis', () => {
      const proposal = createMockProposal({
        hypothesis: 'This exceptional change will achieve outstanding results',
      });

      const check = checkForFabricatedScores(proposal);

      expect(check.passed).toBe(false);
      expect(check.flags.some(f => f.includes('banned superlative'))).toBe(true);
    });

    test('should reject proposal with unsupported scores in description', () => {
      const proposal = createMockProposal({
        description: 'This modification will improve accuracy to 95%',
      });

      const check = checkForFabricatedScores(proposal);

      expect(check.passed).toBe(false);
      expect(check.flags.some(f => f.includes('unsupported score'))).toBe(true);
    });

    test('should pass proposal with valid test results and clean text', () => {
      const proposal = createMockProposal();
      const check = checkForFabricatedScores(proposal);

      expect(check.passed).toBe(true);
      expect(check.flags.length).toBe(0);
    });
  });

  describe('Net improvement calculation', () => {
    test('should count improvements correctly', () => {
      const proposal = createMockProposal();
      const result = calculateNetImprovement(proposal);

      expect(result.testsImproved).toBe(2); // Both tests improved by >10%
      expect(result.testsRegressed).toBe(0);
      expect(result.netChange).toBe(2);
    });

    test('should detect regressions', () => {
      const proposal = createMockProposal({
        testResults: [
          {
            testId: 'ab-test-001',
            task: { id: 'task-001', name: 'Test 1' },
            configA: {
              name: 'baseline',
              results: [
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
              ],
            },
            configB: {
              name: 'candidate',
              results: [
                { taskId: 'task-001', success: false, validationPassed: false },
                { taskId: 'task-001', success: false, validationPassed: false },
              ],
            },
            comparison: {
              successRateA: 1.0,
              successRateB: 0.0,
              validationPassRateA: 1.0,
              validationPassRateB: 0.0,
              sampleSize: 2,
              notes: [],
            },
          },
        ],
      });

      const result = calculateNetImprovement(proposal);

      expect(result.testsImproved).toBe(0);
      expect(result.testsRegressed).toBe(1);
      expect(result.netChange).toBe(-1);
    });

    test('should ignore changes below threshold (10%)', () => {
      const proposal = createMockProposal({
        testResults: [
          {
            testId: 'ab-test-001',
            task: { id: 'task-001', name: 'Test 1' },
            configA: {
              name: 'baseline',
              results: [
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: false, validationPassed: false },
              ],
            },
            configB: {
              name: 'candidate',
              results: [
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
              ],
            },
            comparison: {
              successRateA: 0.9,
              successRateB: 1.0, // Only 10% improvement - at threshold
              validationPassRateA: 0.9,
              validationPassRateB: 1.0,
              sampleSize: 10,
              notes: [],
            },
          },
        ],
      });

      const result = calculateNetImprovement(proposal);

      // 10% is at the threshold, so it should NOT count as improvement
      expect(result.testsImproved).toBe(0);
      expect(result.testsRegressed).toBe(0);
    });
  });

  describe('Acceptance decisions', () => {
    test('should REJECT proposal with fabricated scores', () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal({ testResults: [] });
      const decision = gate.evaluate(proposal);

      expect(decision.decision).toBe('REJECT');
      expect(decision.requiresHumanReview).toBe(true); // Fabrication always requires review
      expect(decision.reasons.some(r => r.includes('FABRICATION DETECTED'))).toBe(true);
    });

    test('should REJECT proposal with regressions', () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal({
        testResults: [
          {
            testId: 'ab-test-001',
            task: { id: 'task-001', name: 'Test 1' },
            configA: {
              name: 'baseline',
              results: [
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
              ],
            },
            configB: {
              name: 'candidate',
              results: [
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: false, validationPassed: false },
              ],
            },
            comparison: {
              successRateA: 1.0,
              successRateB: 0.5,
              validationPassRateA: 1.0,
              validationPassRateB: 0.5,
              sampleSize: 2,
              notes: [],
            },
          },
        ],
      });

      const decision = gate.evaluate(proposal);

      expect(decision.decision).toBe('REJECT');
      expect(decision.metadata.testsRegressed).toBeGreaterThan(0);
      expect(decision.reasons.some(r => r.includes('regressed'))).toBe(true);
    });

    test('should REJECT proposal with no improvement', () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal({
        testResults: [
          {
            testId: 'ab-test-001',
            task: { id: 'task-001', name: 'Test 1' },
            configA: {
              name: 'baseline',
              results: [
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: false, validationPassed: false },
              ],
            },
            configB: {
              name: 'candidate',
              results: [
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: false, validationPassed: false },
              ],
            },
            comparison: {
              successRateA: 0.5,
              successRateB: 0.5,
              validationPassRateA: 0.5,
              validationPassRateB: 0.5,
              sampleSize: 2,
              notes: [],
            },
          },
        ],
      });

      const decision = gate.evaluate(proposal);

      expect(decision.decision).toBe('REJECT');
      expect(decision.metadata.testsImproved).toBe(0);
      expect(decision.reasons.some(r => r.includes('No measurable improvement'))).toBe(true);
    });

    test('should REJECT proposal with only 1 test improved', () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal({
        testResults: [
          {
            testId: 'ab-test-001',
            task: { id: 'task-001', name: 'Test 1' },
            configA: {
              name: 'baseline',
              results: [
                { taskId: 'task-001', success: false, validationPassed: false },
                { taskId: 'task-001', success: false, validationPassed: false },
              ],
            },
            configB: {
              name: 'candidate',
              results: [
                { taskId: 'task-001', success: true, validationPassed: true },
                { taskId: 'task-001', success: true, validationPassed: true },
              ],
            },
            comparison: {
              successRateA: 0.0,
              successRateB: 1.0,
              validationPassRateA: 0.0,
              validationPassRateB: 1.0,
              sampleSize: 2,
              notes: [],
            },
          },
        ],
      });

      const decision = gate.evaluate(proposal);

      expect(decision.decision).toBe('REJECT');
      expect(decision.metadata.testsImproved).toBe(1);
      expect(decision.reasons.some(r => r.includes('Only 1 test improved'))).toBe(true);
    });

    test('should ACCEPT proposal with 2+ tests improved and no regressions', () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal(); // Default has 2 tests improved

      const decision = gate.evaluate(proposal);

      expect(decision.decision).toBe('ACCEPT');
      expect(decision.metadata.testsImproved).toBeGreaterThanOrEqual(2);
      expect(decision.metadata.testsRegressed).toBe(0);
      expect(decision.requiresHumanReview).toBe(true); // All acceptances require review
      expect(decision.reasons.some(r => r.includes('ACCEPT'))).toBe(true);
    });

    test('should require REVIEW for removal type modifications', () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal({ type: 'removal' });

      const decision = gate.evaluate(proposal);

      expect(decision.requiresHumanReview).toBe(true);
      expect(decision.reasons.some(r => r.includes('removal'))).toBe(true);
    });

    test('should require REVIEW for safety-related modifications', () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal({ target: 'prompts/safety-constraints.md' });

      const decision = gate.evaluate(proposal);

      expect(decision.decision).toBe('REVIEW_NEEDED');
      expect(decision.requiresHumanReview).toBe(true);
      expect(decision.reasons.some(r => r.includes('safety-related'))).toBe(true);
    });

    test('should require REVIEW for immutable component modifications', () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal({ target: 'prompts/immutable/core-principles.md' });

      const decision = gate.evaluate(proposal);

      expect(decision.decision).toBe('REVIEW_NEEDED');
      expect(decision.requiresHumanReview).toBe(true);
    });
  });

  describe('Decision recording', () => {
    test('should record decision to file system', async () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal();
      const decision = gate.evaluate(proposal);

      await gate.recordDecision(decision);

      const decisionFile = path.join(testDir, `${decision.metadata.decisionId}.json`);
      expect(fs.existsSync(decisionFile)).toBe(true);

      const recorded = JSON.parse(fs.readFileSync(decisionFile, 'utf-8'));
      expect(recorded.proposal.id).toBe(proposal.id);
      expect(recorded.decision).toBe(decision.decision);
      expect(recorded._audit).toBeDefined();
    });

    test('should update index file', async () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal();
      const decision = gate.evaluate(proposal);

      await gate.recordDecision(decision);

      const indexFile = path.join(testDir, 'index.json');
      expect(fs.existsSync(indexFile)).toBe(true);

      const index = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
      expect(index.length).toBe(1);
      expect(index[0].proposalId).toBe(proposal.id);
      expect(index[0].decision).toBe(decision.decision);
    });

    test('should retrieve decision history', async () => {
      const gate = createAcceptanceGate(testDir);

      // Record multiple decisions
      for (let i = 0; i < 3; i++) {
        const proposal = createMockProposal({ id: `proposal-${i}` });
        const decision = gate.evaluate(proposal);
        await gate.recordDecision(decision);
      }

      const history = await gate.getDecisionHistory();
      expect(history.length).toBe(3);
      expect(history[0].proposal.id).toBe('proposal-0');
      expect(history[2].proposal.id).toBe('proposal-2');
    });
  });

  describe('Rollback plans', () => {
    test('should generate appropriate rollback plan for ACCEPT decision', () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal({ type: 'addition' });
      const decision = gate.evaluate(proposal);

      expect(decision.rollbackPlan).toContain('Rollback Plan');
      expect(decision.rollbackPlan).toContain('Steps to Rollback');
      expect(decision.rollbackPlan).toContain('Remove the added lines');
      expect(decision.rollbackPlan).toContain('git revert');
    });

    test('should generate rollback plan for removal type', () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal({ type: 'removal' });
      const decision = gate.evaluate(proposal);

      expect(decision.rollbackPlan).toContain('Restore the removed content');
    });

    test('should generate rollback plan for reword type', () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal({ type: 'reword' });
      const decision = gate.evaluate(proposal);

      expect(decision.rollbackPlan).toContain('Replace with original wording');
    });

    test('should generate simple plan for REJECT decision', () => {
      const gate = createAcceptanceGate(testDir);
      const proposal = createMockProposal({ testResults: [] });
      const decision = gate.evaluate(proposal);

      expect(decision.decision).toBe('REJECT');
      expect(decision.rollbackPlan).toContain('No changes were applied');
      expect(decision.rollbackPlan).toContain('rejected at gate');
    });
  });
});

// Simple test runner for Node.js
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running Acceptance Gate Tests...\n');

  const tests = [
    // Add manual test execution here if needed
  ];

  console.log('For full test execution, use a test runner like Jest or Vitest.');
  console.log('Example: npm test acceptance-gate.test.ts');
}
