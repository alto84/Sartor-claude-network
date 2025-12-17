# Experiment Loop - Automated Self-Improvement System

## Overview

The Experiment Loop provides a safe, auditable framework for automated self-improvement through iterative hypothesis testing. It combines A/B testing, conservative acceptance gates, and baseline tracking to enable continuous improvement while preventing regressions.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  EXPERIMENT LOOP                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Generate Hypotheses                                 │
│     ├─ Analyze test failures                            │
│     ├─ Profile performance                              │
│     ├─ Review past experiments                          │
│     └─ Prioritize by confidence × impact                │
│                                                          │
│  2. Run A/B Test (ab-test-runner.ts)                    │
│     ├─ Baseline: Current implementation                 │
│     ├─ Variant: With hypothesis applied                 │
│     └─ Compare: Pass rates, execution time              │
│                                                          │
│  3. Evaluate (acceptance-gate.ts)                       │
│     ├─ Anti-fabrication checks                          │
│     ├─ Regression detection                             │
│     ├─ Conservative acceptance criteria                 │
│     └─ Generate rollback plan                           │
│                                                          │
│  4. Apply Changes (if accepted)                         │
│     ├─ Human approval (optional)                        │
│     ├─ Modify target files                              │
│     ├─ Capture new baseline                             │
│     └─ Record audit trail                               │
│                                                          │
│  5. Learn from Results                                  │
│     ├─ Store experiment outcomes                        │
│     ├─ Update hypothesis priorities                     │
│     └─ Improve future suggestions                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. ExperimentConfig

Configuration for the experiment loop:

```typescript
interface ExperimentConfig {
  maxIterations: number;           // How many improvement cycles to run
  stopOnRegression: boolean;       // Stop if any regression detected
  requireHumanApproval: boolean;   // Pause for human review
  dryRun: boolean;                 // Simulate without applying changes
}
```

**Recommended Settings:**

- **Development**: `{ maxIterations: 10, stopOnRegression: false, requireHumanApproval: false, dryRun: true }`
- **Production**: `{ maxIterations: 5, stopOnRegression: true, requireHumanApproval: true, dryRun: false }`
- **Exploration**: `{ maxIterations: 20, stopOnRegression: false, requireHumanApproval: false, dryRun: true }`

### 2. Hypothesis

Represents an improvement idea to test:

```typescript
interface Hypothesis {
  id: string;
  priority: number;                // Higher = run first (0-100)
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
```

**Hypothesis Sources:**

- **analysis**: Generated from codebase analysis (profiling, complexity)
- **failure**: Derived from test failures or production issues
- **suggestion**: From code review or external recommendations
- **manual**: Human-created improvement ideas

### 3. ExperimentResult

Output from each iteration:

```typescript
interface ExperimentResult {
  iteration: number;
  hypothesis: Hypothesis;
  testResult: ABTestResult;        // From A/B test runner
  decision: AcceptanceDecision;    // From acceptance gate
  applied: boolean;                // Whether change was applied
  newBaseline?: BaselineMetrics;   // Updated baseline if applied
  metadata: {
    timestamp: string;
    durationMs: number;
    error?: string;
  };
}
```

## Usage

### Basic Example

```typescript
import {
  createExperimentLoop,
  ExperimentConfig,
  Hypothesis,
} from './experiment-loop';

// 1. Define hypothesis generator
async function generateHypotheses(): Promise<Hypothesis[]> {
  // Analyze codebase, review failures, profile performance
  return [
    {
      id: 'cache-validation-results',
      priority: 90,
      description: 'Add caching to validator',
      hypothesis: 'Caching will reduce repeated validation time',
      targetFile: 'framework/validation/validator.ts',
      modificationType: 'addition',
      proposedChange: 'Add Map-based result cache',
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'analysis',
        confidence: 0.85,
      },
    },
  ];
}

// 2. Define change applicator
async function applyChange(hypothesis: Hypothesis): Promise<void> {
  // Read target file, apply modification, verify syntax
  // Example: Use Edit tool or fs.readFileSync/writeFileSync
}

// 3. Define test runner
async function runTests(baseline: boolean): Promise<any> {
  // Run test suite, collect metrics
  // Return test results (pass rate, execution time, etc.)
}

// 4. Create experiment loop
const loop = createExperimentLoop(
  generateHypotheses,
  applyChange,
  runTests
);

// 5. Run experiment
const config: ExperimentConfig = {
  maxIterations: 5,
  stopOnRegression: true,
  requireHumanApproval: true,
  dryRun: false,
};

for await (const result of loop.run(config)) {
  console.log(`Iteration ${result.iteration}:`, result.decision.decision);
  if (result.applied) {
    console.log('Applied:', result.hypothesis.description);
  }
}
```

### Advanced: Pause/Resume

```typescript
const loop = createExperimentLoop(/* ... */);

// Run in background
const experimentPromise = (async () => {
  const results = [];
  for await (const result of loop.run(config)) {
    results.push(result);
  }
  return results;
})();

// Pause after 3 seconds
setTimeout(() => {
  console.log('Pausing experiment...');
  loop.pause();
}, 3000);

// Resume after 5 seconds
setTimeout(() => {
  console.log('Resuming experiment...');
  loop.resume();
}, 5000);

// Check status
setInterval(() => {
  const status = loop.getStatus();
  console.log('Status:', status);
}, 1000);
```

### Advanced: Stop Early

```typescript
const loop = createExperimentLoop(/* ... */);

// Stop if we detect critical failure
for await (const result of loop.run(config)) {
  if (result.metadata.error?.includes('CRITICAL')) {
    console.log('Critical error detected, stopping...');
    loop.stop();
    break;
  }
}
```

## Safety Features

### 1. Dry Run Mode

Set `dryRun: true` to simulate changes without modifying files:

```typescript
const config: ExperimentConfig = {
  maxIterations: 10,
  stopOnRegression: false,
  requireHumanApproval: false,
  dryRun: true,  // Safe exploration
};
```

**Use Cases:**
- Testing hypothesis generation logic
- Validating experiment configuration
- Previewing potential improvements
- Training on new codebases

### 2. Human Approval Checkpoints

Set `requireHumanApproval: true` to pause for review before applying changes:

```typescript
const config: ExperimentConfig = {
  maxIterations: 5,
  stopOnRegression: true,
  requireHumanApproval: true,  // Pause for review
  dryRun: false,
};
```

**Approval Process:**
1. Experiment pauses after acceptance gate approves change
2. Displays proposal details, test results, decision reasoning
3. Shows rollback plan
4. Waits for human approval
5. Applies change only if approved

### 3. Stop on Regression

Set `stopOnRegression: true` to halt immediately if any test regresses:

```typescript
const config: ExperimentConfig = {
  maxIterations: 10,
  stopOnRegression: true,  // Conservative mode
  requireHumanApproval: true,
  dryRun: false,
};
```

**Regression Detection:**
- Any test that passed in baseline but fails in variant
- Any metric that degrades beyond threshold
- Anti-fabrication check failures

### 4. Full Audit Trail

All decisions are recorded in `.swarm/decisions/`:

```
.swarm/decisions/
├── decision-hyp-1-1234567890.json
├── decision-hyp-2-1234567891.json
└── index.json
```

Each decision includes:
- Full proposal details
- Test results (baseline vs variant)
- Decision reasoning
- Rollback plan
- Fabrication check results
- Timestamps

### 5. Baseline Snapshots

System metrics are captured at each successful iteration:

```
.swarm/baselines/
├── experiment-baseline-initial.json
├── experiment-baseline-iter-1.json
├── experiment-baseline-iter-2.json
└── experiment-baseline-iter-3.json
```

## Hypothesis Generation Strategies

### 1. Test Failure Analysis

```typescript
async function analyzeFailures(): Promise<Hypothesis[]> {
  const failures = await runTests();
  const failedTests = failures.results.filter(r => !r.passed);

  return failedTests.map(test => ({
    id: `fix-${test.testId}`,
    priority: 100 - test.attemptCount, // Higher priority for persistent failures
    description: `Fix failing test: ${test.name}`,
    hypothesis: `Test fails due to ${analyzeFailureReason(test)}`,
    targetFile: test.sourceFile,
    modificationType: 'reword',
    proposedChange: generateFix(test),
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'failure',
      confidence: 0.8,
    },
  }));
}
```

### 2. Performance Profiling

```typescript
async function profilePerformance(): Promise<Hypothesis[]> {
  const profile = await runBenchmark();
  const bottlenecks = profile.hotspots.filter(h => h.timeMs > 100);

  return bottlenecks.map(bottleneck => ({
    id: `optimize-${bottleneck.function}`,
    priority: Math.min(100, bottleneck.timeMs / 10),
    description: `Optimize ${bottleneck.function}`,
    hypothesis: `Function takes ${bottlenecks.timeMs}ms, can be reduced by ${suggestOptimization(bottleneck)}`,
    targetFile: bottleneck.file,
    modificationType: 'addition',
    proposedChange: generateOptimization(bottleneck),
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'analysis',
      confidence: 0.7,
    },
  }));
}
```

### 3. Code Complexity Analysis

```typescript
async function analyzeComplexity(): Promise<Hypothesis[]> {
  const complexity = await analyzeCodebase();
  const complex = complexity.functions.filter(f => f.cyclomaticComplexity > 10);

  return complex.map(fn => ({
    id: `refactor-${fn.name}`,
    priority: fn.cyclomaticComplexity,
    description: `Refactor complex function: ${fn.name}`,
    hypothesis: `Complexity ${fn.cyclomaticComplexity} can be reduced by extracting sub-functions`,
    targetFile: fn.file,
    modificationType: 'reword',
    proposedChange: suggestRefactoring(fn),
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'analysis',
      confidence: 0.6,
    },
  }));
}
```

### 4. Learning from History

```typescript
async function learnFromHistory(): Promise<Hypothesis[]> {
  const history = await loadExperimentHistory();
  const successful = history.filter(r => r.applied);

  // Find patterns in successful changes
  const patterns = extractPatterns(successful);

  return patterns.map(pattern => ({
    id: `apply-pattern-${pattern.id}`,
    priority: pattern.successRate * 100,
    description: `Apply successful pattern: ${pattern.name}`,
    hypothesis: `Pattern has ${pattern.successRate}% success rate in past experiments`,
    targetFile: pattern.suggestedTarget,
    modificationType: pattern.type,
    proposedChange: pattern.template,
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'suggestion',
      confidence: pattern.successRate,
    },
  }));
}
```

## Integration with Existing Systems

### A/B Test Runner

The experiment loop uses `ab-test-runner.ts` for comparing baseline vs variant:

```typescript
const testResult = await runABTest(
  {
    name: hypothesis.id,
    description: hypothesis.description,
    baselineLabel: 'current',
    testSuite: ['all'],
    minImprovement: 10,  // Require 10% improvement
    maxRegression: 0,    // No regressions allowed
    iterations: 3,
  },
  baselineRunner,
  variantRunner
);
```

### Acceptance Gate

All changes are evaluated by `acceptance-gate.ts`:

```typescript
const decision = gate.evaluate({
  id: hypothesis.id,
  type: hypothesis.modificationType,
  target: hypothesis.targetFile,
  description: hypothesis.description,
  hypothesis: hypothesis.hypothesis,
  testResults: [testResult],
  timestamp: new Date().toISOString(),
});
```

**Acceptance Criteria:**
- 2+ tests improved, 0 regressions → ACCEPT
- Any regression → REJECT
- 0-1 improvements → REJECT
- Fabrication detected → REJECT

### Baseline Tracker

System metrics are tracked via `baseline-tracker.ts`:

```typescript
// Capture current metrics
const baseline = await tracker.captureBaseline();

// Save snapshot
await tracker.saveBaseline(baseline, `iter-${iteration}`);

// Compare to previous
const comparison = tracker.compareToBaseline(current, baseline);
```

## Best Practices

### 1. Start with Dry Run

Always test your hypothesis generation and experiment configuration in dry run mode first:

```typescript
const config = {
  maxIterations: 10,
  stopOnRegression: false,
  requireHumanApproval: false,
  dryRun: true,  // Start here
};
```

### 2. Use Conservative Criteria

Start with strict acceptance criteria and relax gradually:

```typescript
const config = {
  maxIterations: 5,
  stopOnRegression: true,   // Stop on any regression
  requireHumanApproval: true,  // Always review
  dryRun: false,
};
```

### 3. Prioritize Hypotheses Carefully

Higher priority hypotheses run first. Use confidence × impact for prioritization:

```typescript
const priority = hypothesis.confidence * estimatedImpact * 100;
```

### 4. Review Audit Trail Regularly

Check `.swarm/decisions/` to understand what's working:

```bash
cat .swarm/decisions/index.json | jq '.[] | select(.decision == "ACCEPT")'
```

### 5. Monitor Baseline Progression

Compare baselines to track improvement over time:

```bash
npx tsx framework/validation/baseline-tracker.ts compare \
  experiment-baseline-initial \
  experiment-baseline-iter-5
```

## Troubleshooting

### No Hypotheses Generated

**Cause**: Hypothesis generator returns empty array.

**Solution**:
- Check test failures, performance profiles, complexity analysis
- Review past experiment history for patterns
- Add manual hypotheses to seed the system

### All Changes Rejected

**Cause**: Acceptance gate criteria too strict or changes not impactful.

**Solution**:
- Review decision reasoning in `.swarm/decisions/`
- Lower minimum improvement threshold (currently 10%)
- Improve hypothesis quality (higher confidence, better targeting)

### Experiments Taking Too Long

**Cause**: Too many iterations or slow test execution.

**Solution**:
- Reduce `maxIterations` in config
- Optimize test suite execution
- Run tests in parallel
- Use smaller test subset for initial experiments

### Changes Applied but No Improvement

**Cause**: Hypothesis was wrong or test suite incomplete.

**Solution**:
- Review experiment history for patterns
- Improve hypothesis generation (better analysis)
- Expand test suite to cover more scenarios
- Use rollback plan to revert changes

## Examples

See `experiment-loop.demo.ts` for a complete working example:

```bash
npx tsx framework/validation/experiment-loop.demo.ts
```

## Future Enhancements

1. **Multi-objective optimization**: Balance multiple metrics (speed, accuracy, complexity)
2. **Parallel hypothesis testing**: Run multiple A/B tests concurrently
3. **Adaptive iteration count**: Dynamically adjust test iterations based on variance
4. **Meta-learning**: Learn which hypothesis sources produce best improvements
5. **Conflict resolution**: Handle overlapping modifications to same files
6. **Rollback automation**: Automatic reversion on post-deployment failures
7. **Cost modeling**: Estimate implementation cost vs benefit
8. **UI dashboard**: Visual tracking of experiment progress
