# Acceptance Gate Integration Guide

## Overview

The Acceptance Gate is a critical component of the self-improving agent system, implementing conservative decision logic for modification proposals. This document describes how it integrates with the overall self-improvement workflow.

## Position in Self-Improvement Cycle

```
┌──────────────────────────────────────────────────────────────┐
│            SELF-IMPROVEMENT WORKFLOW                         │
└──────────────────────────────────────────────────────────────┘

1. Baseline Testing
   └─> Run test suite on current agent configuration
       └─> Record results (success rate, validation rate, etc.)

2. Failure Analysis
   └─> Multi-agent critique identifies patterns
       └─> Generate improvement hypotheses

3. Modification Proposal
   └─> Create specific, testable modification
       └─> Document hypothesis and expected impact

4. A/B Testing
   └─> Run same tests on baseline vs. modified configuration
       └─> Collect actual performance data

5. *** ACCEPTANCE GATE *** (THIS MODULE)
   └─> Evaluate proposal with conservative criteria
       ├─> Anti-fabrication checks
       ├─> Net improvement calculation
       ├─> Decision: ACCEPT | REJECT | REVIEW_NEEDED
       └─> Generate rollback plan

6. Human Review (if required)
   └─> Review decision and test results
       └─> Approve, modify, or reject

7. Commit or Rollback
   └─> If accepted: Apply modification
   └─> If rejected: Document learnings
   └─> Record decision in audit trail

8. Meta-Learning
   └─> Track which modification types work
       └─> Update improvement strategy
```

## Integration Points

### 1. Input: Modification Proposal

The acceptance gate receives `ModificationProposal` objects from the hypothesis generation step:

```typescript
interface ModificationProposal {
  id: string;                      // Unique proposal identifier
  type: 'addition' | 'removal' | 'reword';
  target: string;                  // File/config being modified
  description: string;             // What is being changed
  hypothesis: string;              // Why we think this will help
  testResults: ABTestResult[];     // REQUIRED: Actual A/B test data
  timestamp: string;
}
```

**Key Requirement**: Proposals MUST include actual test results from A/B testing. The gate will reject proposals with missing or fabricated test data.

### 2. Output: Acceptance Decision

The gate produces `AcceptanceDecision` objects with complete reasoning:

```typescript
interface AcceptanceDecision {
  proposal: ModificationProposal;
  decision: 'ACCEPT' | 'REJECT' | 'REVIEW_NEEDED';
  reasons: string[];               // Human-readable decision reasoning
  requiresHumanReview: boolean;    // Flag for human review queue
  rollbackPlan: string;            // Complete rollback instructions
  metadata: {
    timestamp: string;
    decisionId: string;
    testsImproved: number;
    testsRegressed: number;
    netChange: number;
    fabricationFlags: string[];
  };
}
```

### 3. Audit Trail Storage

All decisions are stored in `.swarm/decisions/` for:
- Historical analysis
- Pattern detection
- Accountability
- Rollback reference

## Conservative Decision Algorithm

### Phase 1: Anti-Fabrication Checks (MANDATORY)

```
IF no test results provided:
  → REJECT (cannot verify improvement)

IF success rates don't match actual results:
  → REJECT (fabricated metrics detected)

IF proposal contains superlatives or unsupported claims:
  → REJECT (banned language detected)

ELSE:
  → Continue to improvement evaluation
```

### Phase 2: Improvement Evaluation

```
Calculate:
- testsImproved: Count tests with >10% improvement
- testsRegressed: Count tests with >10% degradation
- netChange: testsImproved - testsRegressed

IF testsRegressed > 0:
  → REJECT (zero tolerance for regressions)

ELSE IF testsImproved == 0:
  → REJECT (no measurable improvement)

ELSE IF testsImproved == 1:
  → REJECT (threshold is 2+ tests)

ELSE IF testsImproved >= 2:
  → ACCEPT (requires human review)
```

### Phase 3: Special Case Handling

```
IF target contains "safety" OR target contains "immutable":
  → REVIEW_NEEDED (critical component)

IF type == "removal":
  → Add warning (higher risk)
  → May escalate to REVIEW_NEEDED

FINAL:
  → Generate rollback plan
  → Return decision
```

## Usage Example: Complete Workflow

```typescript
import { createAcceptanceGate } from './acceptance-gate';
import { runABTest } from './ab-test-runner';

// 1. Define baseline and candidate configurations
const baselineConfig = {
  name: 'baseline-v1.0',
  command: 'agent',
  args: ['--config', 'prompts/v1.0/'],
  // ... other config
};

const candidateConfig = {
  name: 'candidate-v1.1',
  command: 'agent',
  args: ['--config', 'prompts/v1.1-candidate/'],
  // ... other config
};

// 2. Run A/B tests
const testResults = await runABTest(
  baselineConfig,
  candidateConfig,
  testSuite,
  iterations = 5
);

// 3. Create modification proposal
const proposal: ModificationProposal = {
  id: 'mod-001',
  type: 'addition',
  target: 'prompts/code-generation.md',
  description: 'Add explicit error handling requirements',
  hypothesis: 'Will reduce test failures in code generation tasks',
  testResults: testResults.results, // Actual measured data
  timestamp: new Date().toISOString(),
};

// 4. Evaluate with acceptance gate
const gate = createAcceptanceGate('.swarm/decisions');
const decision = gate.evaluate(proposal);

// 5. Record decision
await gate.recordDecision(decision);

// 6. Act on decision
switch (decision.decision) {
  case 'ACCEPT':
    console.log('Modification accepted - requires human review');
    console.log('Improvements:', decision.metadata.testsImproved);
    console.log('Rollback plan:', decision.rollbackPlan);
    // Queue for human review
    await queueForHumanReview(decision);
    break;

  case 'REJECT':
    console.log('Modification rejected');
    console.log('Reasons:', decision.reasons);
    // Log for meta-learning
    await logRejection(decision);
    break;

  case 'REVIEW_NEEDED':
    console.log('Human review required before decision');
    // Send to human review immediately
    await requestHumanReview(decision);
    break;
}
```

## Rollback Procedures

Every ACCEPT decision includes a complete rollback plan. Example:

```markdown
# Rollback Plan

Proposal ID: mod-001
Target: prompts/code-generation.md
Type: addition

## Steps to Rollback:

1. Locate the added content in the target file
2. Remove the added lines or configuration
3. Restore prompts/code-generation.md to previous state
4. Run test suite to verify baseline performance restored

## Verification:
- [ ] Changes reverted
- [ ] Test suite run
- [ ] Baseline performance confirmed
- [ ] Decision record updated with rollback status

## Git Rollback (if committed):
```bash
# Find the commit that applied this proposal
git log --grep="mod-001" --oneline

# Revert the specific commit
git revert <commit-hash>
```
```

## Human Review Queue

All ACCEPT decisions and some special cases require human review:

### Required Review Cases:
1. All ACCEPT decisions (even with strong evidence)
2. Safety-related modifications
3. Immutable component changes
4. Removal type modifications
5. Fabrication detected (always review why)

### Review Checklist:
- [ ] Test results look legitimate?
- [ ] Improvement is meaningful, not noise?
- [ ] Hypothesis makes sense?
- [ ] No unintended side effects?
- [ ] Rollback plan is adequate?
- [ ] Decision: Approve / Modify / Reject

## Meta-Learning Integration

The acceptance gate feeds into meta-learning by providing:

```typescript
// Track success/failure patterns
const history = await gate.getDecisionHistory();

const patterns = {
  additionAcceptRate: countByType(history, 'addition', 'ACCEPT'),
  removalAcceptRate: countByType(history, 'removal', 'ACCEPT'),
  rewordAcceptRate: countByType(history, 'reword', 'ACCEPT'),

  avgImprovementWhenAccepted: calculateAvgImprovement(
    history.filter(d => d.decision === 'ACCEPT')
  ),

  commonRejectionReasons: groupByReason(
    history.filter(d => d.decision === 'REJECT')
  ),
};

// Use patterns to guide future modifications
if (patterns.removalAcceptRate < 0.1) {
  console.log('Removal modifications rarely succeed - avoid them');
}
```

## Compliance with Anti-Fabrication Protocols

The acceptance gate enforces CLAUDE.md anti-fabrication protocols:

### SCORE FABRICATION PROHIBITION
✓ Never fabricates scores - requires actual test results
✓ Verifies reported rates match actual execution data
✓ Flags unsupported scores in proposal text

### MANDATORY LANGUAGE RESTRICTIONS
✓ Detects banned superlatives in proposals
✓ Rejects proposals with exaggerated claims
✓ Requires evidence-based language

### EVIDENCE STANDARDS
✓ Demands primary source data (test results)
✓ Verifies measurement data exists
✓ Requires external validation (A/B testing)

### SKEPTICISM ENFORCEMENT
✓ Conservative threshold (2+ tests, 0 regressions)
✓ Lists what could go wrong (rollback plan)
✓ Expresses uncertainty (requires human review)
✓ Discloses limitations (sample size, scope)

## Configuration

### Default Thresholds

```typescript
const THRESHOLDS = {
  MIN_IMPROVEMENT: 2,           // Minimum tests that must improve
  IMPROVEMENT_THRESHOLD: 0.1,   // 10% improvement required
  MAX_REGRESSIONS: 0,           // Zero tolerance
  SAMPLE_SIZE_WARNING: 10,      // Warn if sample < 10
};
```

### Decision Storage

```
.swarm/decisions/
├── decision-mod-001-1234567890.json
├── decision-mod-002-1234567891.json
├── index.json                        # Quick lookup index
└── README.md                         # Decision log documentation
```

## Testing the Acceptance Gate

Run the test suite:

```bash
# Unit tests
npm test acceptance-gate.test.ts

# Example scenarios
npm run acceptance-gate-example

# Integration test
npm test integration-test.ts
```

## Monitoring and Alerts

### Metrics to Track:
- Total proposals evaluated
- Accept rate (should be 20-40% for healthy experimentation)
- Reject rate by reason
- Human review queue depth
- Average tests improved per acceptance
- Fabrication detection rate

### Alerts:
- Accept rate >80%: Possible weak testing or fabrication bypass
- Accept rate <10%: Possible overly conservative or bad hypotheses
- Fabrication detection >5%: Process breakdown, investigate source
- Human review queue >10: Bottleneck, need more reviewers

## Future Enhancements

Potential improvements (not yet implemented):

1. **Statistical Significance Testing**: Add chi-square or t-tests for confidence
2. **Validation Set Performance**: Track held-out test performance
3. **Wild Performance Monitoring**: Real-world task success rate
4. **Automated Rollback**: Auto-rollback if issues detected post-commit
5. **Learning Curves**: Track improvement velocity over time
6. **Multi-Metric Decisions**: Consider speed, quality, safety simultaneously

## References

- Design Document: `.swarm/artifacts/SELF_IMPROVING_SYSTEM_DESIGN.md`
- Anti-Fabrication Protocols: `CLAUDE.md`
- Validator Module: `validator.ts`
- A/B Testing Framework: `ab-test-runner.ts`
