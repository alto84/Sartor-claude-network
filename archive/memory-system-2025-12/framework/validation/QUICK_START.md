# Experiment Loop - Quick Start Guide

## TL;DR

The experiment loop enables automated self-improvement through safe, auditable hypothesis testing.

```bash
# Run the demo
npx tsx framework/validation/experiment-loop.demo.ts

# Run tests
npm test -- experiment-loop.test.ts

# Read full docs
cat framework/validation/EXPERIMENT-LOOP.md
```

## 5-Minute Setup

### 1. Import the Module

```typescript
import {
  createExperimentLoop,
  ExperimentConfig,
  Hypothesis,
} from './framework/validation/experiment-loop';
```

### 2. Define Your Components

```typescript
// Generate improvement ideas
async function generateHypotheses(): Promise<Hypothesis[]> {
  return [
    {
      id: 'cache-validator',
      priority: 90,
      description: 'Add caching to validator',
      hypothesis: 'Caching will reduce validation time',
      targetFile: 'framework/validation/validator.ts',
      modificationType: 'addition',
      proposedChange: 'Add Map-based cache',
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'analysis',
        confidence: 0.85,
      },
    },
  ];
}

// Apply changes
async function applyChange(hypothesis: Hypothesis): Promise<void> {
  // Backup file
  // Apply modification
  // Verify syntax
}

// Run tests
async function runTests(baseline: boolean): Promise<any> {
  // Execute test suite
  // Return results
}
```

### 3. Create and Run Loop

```typescript
const loop = createExperimentLoop(
  generateHypotheses,
  applyChange,
  runTests
);

const config: ExperimentConfig = {
  maxIterations: 5,
  stopOnRegression: true,
  requireHumanApproval: true,
  dryRun: true, // Start with simulation
};

for await (const result of loop.run(config)) {
  console.log(`Iteration ${result.iteration}: ${result.decision.decision}`);
}
```

## What It Does

```
┌─────────────────────────────────────────────────────────┐
│ 1. Generate Hypotheses                                  │
│    ├─ Analyze test failures                             │
│    ├─ Profile performance bottlenecks                   │
│    ├─ Review code complexity                            │
│    └─ Learn from past experiments                       │
├─────────────────────────────────────────────────────────┤
│ 2. Pick Best Hypothesis (by priority)                   │
├─────────────────────────────────────────────────────────┤
│ 3. Run A/B Test                                         │
│    ├─ Baseline: Current code                            │
│    ├─ Variant: With hypothesis applied                  │
│    └─ Compare: Pass rates, execution time               │
├─────────────────────────────────────────────────────────┤
│ 4. Evaluate with Acceptance Gate                        │
│    ├─ Check for fabricated scores                       │
│    ├─ Detect regressions                                │
│    ├─ Verify 2+ tests improved                          │
│    └─ Decide: ACCEPT / REJECT / REVIEW                  │
├─────────────────────────────────────────────────────────┤
│ 5. Apply Change (if accepted)                           │
│    ├─ Request human approval (optional)                 │
│    ├─ Backup original file                              │
│    ├─ Apply modification                                │
│    └─ Capture new baseline                              │
├─────────────────────────────────────────────────────────┤
│ 6. Record Results                                       │
│    ├─ Save decision to audit trail                      │
│    ├─ Update baseline snapshots                         │
│    └─ Learn for future experiments                      │
└─────────────────────────────────────────────────────────┘
```

## Safety Guarantees

### ✓ Dry Run Mode
```typescript
dryRun: true  // Simulates changes without modifying files
```

### ✓ Human Approval
```typescript
requireHumanApproval: true  // Pauses for review before applying
```

### ✓ Stop on Regression
```typescript
stopOnRegression: true  // Halts if any test regresses
```

### ✓ Full Audit Trail
```
.swarm/decisions/          # All decisions with reasoning
.swarm/baselines/          # Baseline snapshots
.swarm/rollbacks/          # Rollback information
```

### ✓ Anti-Fabrication
- All scores from actual measured data
- No composite metrics without calculation
- Evidence chain for all decisions

## Common Patterns

### Pattern 1: Safe Exploration

```typescript
const config = {
  maxIterations: 10,
  stopOnRegression: false,    // Explore even if regressions
  requireHumanApproval: false, // Auto-proceed
  dryRun: true,               // No actual changes
};
```

**Use Case**: Testing hypothesis generation, understanding potential improvements

### Pattern 2: Conservative Production

```typescript
const config = {
  maxIterations: 5,
  stopOnRegression: true,     // Stop on any regression
  requireHumanApproval: true, // Review all changes
  dryRun: false,             // Apply changes
};
```

**Use Case**: Production self-improvement with human oversight

### Pattern 3: Automated CI/CD

```typescript
const config = {
  maxIterations: 3,
  stopOnRegression: true,     // Stop on regression
  requireHumanApproval: false, // Auto-apply
  dryRun: false,             // Apply changes
};
```

**Use Case**: Continuous improvement in CI pipeline (high confidence only)

## Monitoring Progress

### Real-time Status

```typescript
const loop = createExperimentLoop(/* ... */);

setInterval(() => {
  const status = loop.getStatus();
  console.log(`[${status.status}] ${status.currentIteration}/${status.maxIterations}`);
  console.log(`Applied: ${status.changesApplied}, Rejected: ${status.changesRejected}`);
}, 1000);
```

### History Analysis

```typescript
const history = loop.getHistory();

console.log('Applied Changes:');
history
  .filter(r => r.applied)
  .forEach(r => {
    console.log(`- ${r.hypothesis.description}`);
    console.log(`  Improvement: ${r.testResult.improvement}%`);
  });
```

## Troubleshooting

### No Hypotheses Generated

**Symptom**: Loop stops immediately with no iterations

**Fix**: Check hypothesis generator returns non-empty array
```typescript
const hypotheses = await generateHypotheses();
console.log(`Generated ${hypotheses.length} hypotheses`);
```

### All Changes Rejected

**Symptom**: Loop runs but nothing applied

**Fix**: Review decision reasoning
```bash
cat .swarm/decisions/index.json | jq '.[] | select(.decision == "REJECT")'
```

Common reasons:
- Improvement too small (< 10%)
- Only 1 test improved (need 2+)
- Regression detected
- Fabrication check failed

### Changes Applied but No Improvement

**Symptom**: Changes accepted but baseline doesn't improve

**Fix**: Hypothesis was wrong or test suite incomplete
- Review experiment history
- Improve hypothesis generation
- Expand test coverage
- Use rollback to revert

## Next Steps

1. **Run the Demo**
   ```bash
   npx tsx framework/validation/experiment-loop.demo.ts
   ```

2. **Review Examples**
   - `experiment-loop.demo.ts` - Working demo
   - `integration-example.ts` - Real-world integration

3. **Read Full Docs**
   - `EXPERIMENT-LOOP.md` - Comprehensive guide
   - `EXPERIMENT_LOOP_SUMMARY.md` - Implementation details

4. **Write Your Hypothesis Generator**
   - Analyze your codebase
   - Identify improvement opportunities
   - Generate prioritized hypotheses

5. **Test in Dry Run**
   - Set `dryRun: true`
   - Verify hypothesis quality
   - Check acceptance criteria

6. **Apply Real Changes**
   - Set `dryRun: false`
   - Enable human approval
   - Monitor baseline progression

## Architecture Integration

```
experiment-loop.ts
  ├── Imports
  │   ├── ab-test-runner.ts      (A/B testing)
  │   ├── acceptance-gate.ts     (Decision logic)
  │   └── baseline-tracker.ts    (Metrics tracking)
  │
  ├── Components
  │   ├── Hypothesis Generator   (Your code)
  │   ├── Change Applicator      (Your code)
  │   └── Test Runner            (Your code)
  │
  └── Outputs
      ├── .swarm/decisions/      (Audit trail)
      ├── .swarm/baselines/      (Snapshots)
      └── ExperimentResult[]     (History)
```

## Key Metrics

Track these metrics to measure experiment loop effectiveness:

```typescript
const status = loop.getStatus();

// Efficiency: What % of hypotheses led to improvements?
const efficiency = status.changesApplied / status.hypothesesTested;

// Success rate: What % passed acceptance gate?
const successRate = status.changesApplied / status.currentIteration;

// Velocity: How many iterations per hour?
const velocity = status.currentIteration / runtimeHours;
```

## Anti-Patterns to Avoid

### ❌ Fabricating Scores
```typescript
// WRONG: Making up improvement scores
const fakeResult = { improvement: 50 }; // No actual test data

// RIGHT: Run actual tests
const testResult = await runABTest(config, baseline, variant);
```

### ❌ Skipping Dry Run
```typescript
// WRONG: Applying changes without testing
const config = { dryRun: false }; // First run

// RIGHT: Test first, then apply
const config = { dryRun: true };  // Verify first
```

### ❌ Ignoring Regressions
```typescript
// WRONG: Continuing despite regressions
const config = { stopOnRegression: false }; // Risky

// RIGHT: Stop and investigate
const config = { stopOnRegression: true };  // Safe
```

### ❌ No Human Review
```typescript
// WRONG: Auto-applying everything
const config = {
  requireHumanApproval: false,  // Risky
  dryRun: false
};

// RIGHT: Review important changes
const config = {
  requireHumanApproval: true,   // Safe
  dryRun: false
};
```

## Resources

- **Demo**: `npx tsx framework/validation/experiment-loop.demo.ts`
- **Tests**: `npm test -- experiment-loop.test.ts`
- **Docs**: `framework/validation/EXPERIMENT-LOOP.md`
- **Summary**: `framework/validation/EXPERIMENT_LOOP_SUMMARY.md`
- **Integration**: `framework/validation/integration-example.ts`

## Support

Issues? Questions?

1. Check the troubleshooting section above
2. Review decision history in `.swarm/decisions/`
3. Examine baseline progression in `.swarm/baselines/`
4. Read full documentation in `EXPERIMENT-LOOP.md`
