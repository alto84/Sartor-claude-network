# Validation Framework

## Purpose
Ensure quality and accuracy of agent outputs through:
- Evidence-based validation
- Anti-fabrication checking
- Consistency verification

## Architecture

### Validation Layers

1. **Pre-Output Validation**
   - Check claims have evidence
   - Verify no banned language
   - Ensure uncertainty is expressed

2. **Post-Output Validation**
   - Cross-reference with sources
   - Check internal consistency
   - Verify factual claims

3. **Cross-Agent Validation**
   - Multiple agents verify same claims
   - Disagreement flagging
   - Consensus building

### Validation Rules

Based on CLAUDE.md anti-fabrication protocols:

```typescript
interface ValidationRule {
  name: string;
  type: 'language' | 'evidence' | 'score' | 'claim';
  check: (content: string) => ValidationResult;
}

const rules: ValidationRule[] = [
  {
    name: 'no-fabricated-scores',
    type: 'score',
    check: (content) => {
      // Check for scores without measurement data
    }
  },
  {
    name: 'no-superlatives',
    type: 'language',
    check: (content) => {
      // Check for banned words: exceptional, outstanding, etc.
    }
  },
  {
    name: 'evidence-required',
    type: 'evidence',
    check: (content) => {
      // Check claims have citations
    }
  }
];
```

### Integration

Validation is triggered:
1. Before agent output is saved
2. When synthesizing multiple agent outputs
3. On request via validation skill

## Files

### Core Validation
- `validator.ts` - Core validation engine with anti-fabrication rules
- `test-suite.ts` - Comprehensive test cases for validation rules (42 tests)
- `benchmark.ts` - Performance benchmarking for validation operations
- `integration-test.ts` - Integration tests for validation framework

### A/B Testing Framework
- `ab-test-runner.ts` - A/B testing framework for validating improvements
- `ab-test-runner.test.ts` - Test suite for A/B testing (11 tests, 100% pass)
- `AB_TESTING.md` - Complete A/B testing documentation
- `IMPLEMENTATION_SUMMARY.md` - A/B framework implementation details
- `examples/ab-test-usage.ts` - 7 real-world A/B testing examples

### Acceptance Gate
- `acceptance-gate.ts` - Conservative self-improvement decision logic
- `acceptance-gate.test.ts` - Tests for acceptance gate
- `acceptance-gate-example.ts` - Usage examples for acceptance gate
- `baseline-tracker.ts` - Baseline tracking for improvements

### Supporting Files
- `ground-truth.json` - Ground truth test data

## Acceptance Gate

The acceptance gate implements conservative decision logic for self-improvement proposals, ensuring that modifications are evidence-based and rigorously validated.

### Purpose

Prevent self-improvement systems from:
- Accepting weak or marginal improvements
- Allowing regressions in any test
- Accepting fabricated or unverified metrics
- Making changes without proper rollback plans

### Acceptance Criteria

**ACCEPT** (requires human review):
- 2+ tests improved by >10%
- 0 regressions (zero tolerance)
- No fabricated scores detected
- Clear improvement hypothesis

**REJECT**:
- Any regression detected
- Fewer than 2 tests improved
- No measurable improvement
- Fabrication flags raised

**REVIEW_NEEDED**:
- Safety-related modifications
- Immutable component changes
- Removal type modifications
- Architectural changes

### Usage

```typescript
import { createAcceptanceGate } from './acceptance-gate';

const gate = createAcceptanceGate('.swarm/decisions');

// Evaluate a modification proposal
const decision = gate.evaluate(proposal);

// Record decision to audit trail
await gate.recordDecision(decision);

// Review decision history
const history = await gate.getDecisionHistory();
```

### Anti-Fabrication Checks

The acceptance gate verifies:
1. Test results exist and contain actual execution data
2. Reported success rates match actual results
3. Sample sizes are reasonable
4. Proposal text contains no superlatives or unsupported claims
5. All scores come from measured data

### Audit Trail

All decisions are recorded in `.swarm/decisions/` with:
- Complete proposal details
- Test results and comparison
- Decision reasoning
- Rollback plan
- Timestamp and metadata

### Conservative Philosophy

The acceptance gate is intentionally conservative:
- Prefers false negatives (rejecting good changes) over false positives (accepting bad changes)
- Requires strong evidence of improvement (2+ tests, >10% improvement)
- Zero tolerance for regressions
- All acceptances require human review
- Comprehensive rollback plans for all accepted changes

## A/B Testing Framework

The A/B testing framework provides evidence-based validation for comparing baseline vs variant configurations.

### Purpose

Systematically validate that changes improve system behavior:
- Run controlled experiments (baseline vs variant)
- Detect regressions automatically
- Make evidence-based accept/reject decisions
- Provide statistical rigor without fabrication

### Key Features

1. **Controlled Experiments**: Run baseline N times, variant N times
2. **Regression Detection**: Identify specific tests that got worse
3. **Threshold-Based Decisions**: Configure min improvement and max regression
4. **Statistical Honesty**: Clear notes for small sample sizes
5. **Integration**: Works with existing test-suite.ts and benchmark.ts

### Quick Start

```typescript
import { runABTest, ABTestConfig } from './ab-test-runner';
import { runTests, testCases } from './test-suite';

const config: ABTestConfig = {
  name: 'Validator Improvement Test',
  description: 'Testing improved validation rules',
  baselineLabel: 'v1.0',
  testSuite: ['all'],
  minImprovement: 5,    // Require 5% improvement
  maxRegression: 0,     // No regressions allowed
  iterations: 10,       // Run 10 times each
};

// Define runners
const baselineRunner = () => runTests(testCases);
const variantRunner = () => runTests(testCasesModified);

// Run A/B test
const result = await runABTest(config, baselineRunner, variantRunner);

// Check decision
if (result.decision === 'ACCEPT') {
  console.log('Safe to deploy!');
}
```

### Decision Rules

**ACCEPT** (safe to deploy):
- Improvement >= minImprovement
- AND no regressions detected

**REJECT** (do not deploy):
- Any test regression detected
- OR overall regression exceeds maxRegression

**INCONCLUSIVE** (needs review):
- Improvement < minImprovement
- OR no clear improvement/regression

### Usage Examples

See `examples/ab-test-usage.ts` for 7 comprehensive examples:

1. **Validation Rule Improvement** - Testing enhanced detection patterns
2. **Performance Optimization** - Ensuring correctness with speed gains
3. **New Validation Rule** - Adding rules without false positives
4. **Configuration Tuning** - Finding optimal threshold values
5. **Subset Testing** - Focused testing for specific changes
6. **Multiple Variants** - A/B/C testing to pick the best
7. **Iterative Workflow** - Quick validation then thorough testing

### Running Tests

```bash
# Run A/B test runner tests
npx tsx framework/validation/ab-test-runner.test.ts

# Run example A/B test
npx tsx framework/validation/ab-test-runner.ts

# Run specific usage example
npx tsx framework/validation/examples/ab-test-usage.ts 1
```

### Documentation

- `AB_TESTING.md` - Complete documentation with configuration reference
- `IMPLEMENTATION_SUMMARY.md` - Implementation details and compliance notes
- `examples/ab-test-usage.ts` - Real-world usage patterns
