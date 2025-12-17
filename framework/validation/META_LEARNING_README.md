# Meta-Learning Tracker

**Self-improvement pattern analysis for continuous system optimization.**

## Overview

The Meta-Learning Tracker monitors modification outcomes and analyzes patterns to improve the self-improvement strategy itself. It learns which types of changes work, which targets are improvable, and which hypotheses lead to success or failure.

## Core Features

### 1. Outcome Tracking

Record every modification attempt with comprehensive metadata:

```typescript
const tracker = createMetaLearningTracker();

const outcome: ModificationOutcome = {
  hypothesisId: 'mod-001',
  type: 'addition',
  target: 'error-handling',
  result: 'success',
  improvementPercent: 10.0,
  timestamp: new Date().toISOString(),
  metadata: {
    testsImproved: 2,
    testsRegressed: 0,
    netChange: 2,
    decisionId: 'decision-001'
  }
};

await tracker.recordOutcome(outcome);
```

### 2. Pattern Analysis

Generate evidence-based insights from historical data:

```typescript
const insights = await tracker.analyzePatterns();

// Example insights:
// - "Addition modifications succeed 75% of the time"
// - "Error-handling target has 100% success rate"
// - "15% of modifications caused regressions"
// - "Average improvement magnitude: 8.5%"
```

### 3. Success Rate Analysis

Track success rates by modification type and target:

```typescript
const byType = await tracker.getSuccessRateByType();
// {
//   addition: { total: 10, successful: 8, failed: 2, rate: 0.8 },
//   removal: { total: 3, successful: 0, failed: 3, rate: 0.0 },
//   reword: { total: 5, successful: 2, neutral: 3, rate: 0.4 }
// }

const byTarget = await tracker.getSuccessRateByTarget();
// {
//   'error-handling': { total: 5, successful: 5, rate: 1.0 },
//   'input-validation': { total: 3, successful: 2, rate: 0.67 }
// }
```

### 4. Improvement Trajectory

Monitor cumulative improvement and detect trends:

```typescript
const trajectory = await tracker.getImprovementTrajectory();
// {
//   timestamps: [...],
//   cumulativeImprovement: [...],
//   movingAverage: [...],
//   trend: 'improving',
//   velocityPerWeek: 2.5  // 2.5% improvement per week
// }
```

### 5. Success Prediction

Predict success probability for new hypotheses:

```typescript
const hypothesis: Hypothesis = {
  id: 'new-001',
  type: 'addition',
  target: 'error-handling',
  description: 'Add more error handling',
  expectedImprovement: 10
};

const probability = tracker.predictSuccess(hypothesis);
// 0.85 (85% predicted success based on historical data)
```

## Integration with Acceptance Gate

The meta-learning tracker integrates seamlessly with the acceptance gate:

```typescript
import { createAcceptanceGate } from './acceptance-gate';
import { createMetaLearningTracker } from './meta-learning';

const gate = createAcceptanceGate();
const tracker = createMetaLearningTracker();

// 1. Evaluate proposal
const decision = gate.evaluate(proposal);
await gate.recordDecision(decision);

// 2. Record outcome for meta-learning
const outcome: ModificationOutcome = {
  hypothesisId: proposal.id,
  type: proposal.type,
  target: proposal.target,
  result: decision.decision === 'ACCEPT' ? 'success' : 'failure',
  improvementPercent: calculateImprovement(decision),
  timestamp: proposal.timestamp,
  metadata: {
    testsImproved: decision.metadata.testsImproved,
    testsRegressed: decision.metadata.testsRegressed,
    netChange: decision.metadata.netChange,
    decisionId: decision.metadata.decisionId
  }
};

await tracker.recordOutcome(outcome);

// 3. Learn from patterns
const insights = await tracker.analyzePatterns();
```

## Data Storage

All data is stored as JSON files in `.swarm/meta-learning/`:

```
.swarm/meta-learning/
├── outcomes.json              # All outcomes in one file
├── outcome-mod-001.json       # Individual outcome files
├── outcome-mod-002.json
├── index.json                 # Quick lookup index
└── export-{timestamp}.json    # Full data exports
```

## Anti-Fabrication Compliance

The meta-learning tracker follows strict anti-fabrication protocols:

### Evidence Requirements

- **No Scores Without Data**: All success rates calculated from actual outcomes
- **Sample Size Transparency**: Every insight includes sample size
- **Confidence Calibration**: Confidence scores based on data quantity
- **Limitations Disclosure**: Every insight lists limitations

### Conservative Thresholds

- Minimum 5 outcomes required for pattern detection
- Confidence increases with sample size:
  - 5-9 outcomes: 0.3-0.4 confidence
  - 10-19 outcomes: 0.5-0.6 confidence
  - 20+ outcomes: 0.7+ confidence
- Predictions default to 0.5 (neutral) when no data available

### Transparency

```typescript
interface MetaLearningInsight {
  pattern: string;              // What was observed
  confidence: number;           // How confident (0-1)
  evidence: string[];           // Specific evidence
  recommendation: string;       // What to do
  sampleSize: number;          // How much data
  limitations: string[];        // What we don't know
}
```

## Example Insights

### Type-Based Patterns

```
Pattern: Addition modifications succeed 70% of the time
Confidence: 60%
Sample Size: 10

Evidence:
  - 7 of 10 addition modifications succeeded
  - 2 failed
  - 1 had no measurable effect

Recommendation:
  Addition modifications show promising results.
  Consider prioritizing this type.

Limitations:
  - Based on historical data only
  - Past performance may not predict future results
  - Sample size: 10 (moderate)
```

### Target-Based Patterns

```
Pattern: error-handling modifications succeed 100% of the time
Confidence: 60%
Sample Size: 5

Evidence:
  - 5 of 5 modifications to error-handling succeeded
  - Most successful type: addition

Recommendation:
  error-handling is a promising target for improvements

Limitations:
  - Target-specific context may vary
  - Sample size: 5
```

### Regression Analysis

```
Pattern: 15% of modifications caused regressions
Confidence: 70%
Sample Size: 20

Evidence:
  - 3 of 20 modifications regressed
  - Highest risk type: removal (2 regressions)

Recommendation:
  Regression rate is acceptable. Continue current approach.

Limitations:
  - Regression may be test-specific
```

## Usage Examples

### Basic Tracking

```typescript
import { createMetaLearningTracker } from './meta-learning';

const tracker = createMetaLearningTracker();

// Record outcomes
await tracker.recordOutcome({
  hypothesisId: 'mod-001',
  type: 'addition',
  target: 'error-handling',
  result: 'success',
  improvementPercent: 10.0,
  timestamp: new Date().toISOString()
});

// Analyze patterns
const insights = await tracker.analyzePatterns();
console.log(insights);
```

### Filtering Outcomes

```typescript
// Get all successful additions
const successful = await tracker.getOutcomes({
  type: 'addition',
  result: 'success'
});

// Get recent high-impact changes
const highImpact = await tracker.getOutcomes({
  minImprovement: 10.0,
  startDate: '2025-12-01'
});

// Get all error-handling modifications
const errorHandling = await tracker.getOutcomes({
  target: 'error-handling'
});
```

### Strategy Optimization

```typescript
// Analyze what works
const typeStats = await tracker.getSuccessRateByType();

// Prioritize high-success types
if (typeStats.addition.rate > 0.7) {
  console.log('Focus on addition modifications');
}

if (typeStats.removal.rate < 0.3) {
  console.log('Avoid removal modifications');
}

// Target promising areas
const targetStats = await tracker.getSuccessRateByTarget();
const bestTarget = Object.entries(targetStats)
  .sort((a, b) => b[1].rate - a[1].rate)[0];

console.log(`Best target: ${bestTarget[0]} (${bestTarget[1].rate * 100}% success)`);
```

### Continuous Monitoring

```typescript
// Check trajectory weekly
const trajectory = await tracker.getImprovementTrajectory();

if (trajectory.trend === 'declining') {
  console.log('WARNING: Improvement trajectory is declining');
  console.log('Review recent modifications');
}

if (trajectory.trend === 'plateauing') {
  console.log('System may be reaching limits');
  console.log('Consider new approach or targets');
}

console.log(`Velocity: ${trajectory.velocityPerWeek.toFixed(2)}% per week`);
```

## Testing

Run the comprehensive test suite:

```bash
npm run build
node dist/framework/validation/meta-learning.test.js
```

Or run the interactive demo:

```bash
npm run build
node dist/framework/validation/meta-learning-demo.js
```

## API Reference

### createMetaLearningTracker(storageDir?)

Create a meta-learning tracker instance.

**Parameters:**
- `storageDir` (optional): Directory for data storage (default: `.swarm/meta-learning`)

**Returns:** `MetaLearningTracker`

### MetaLearningTracker Methods

#### recordOutcome(outcome: ModificationOutcome): Promise<void>

Record a modification outcome.

#### getOutcomes(filter?: OutcomeFilter): Promise<ModificationOutcome[]>

Retrieve outcomes with optional filtering.

**Filters:**
- `type`: Filter by modification type
- `target`: Filter by target
- `result`: Filter by result (success/failure/neutral)
- `minImprovement`: Minimum improvement threshold
- `maxImprovement`: Maximum improvement threshold
- `startDate`: Filter from date
- `endDate`: Filter to date

#### analyzePatterns(): Promise<MetaLearningInsight[]>

Generate insights from outcome data.

#### getSuccessRateByType(): Promise<SuccessRateByType>

Get success rates broken down by modification type.

#### getSuccessRateByTarget(): Promise<SuccessRateByTarget>

Get success rates broken down by target.

#### getImprovementTrajectory(): Promise<ImprovementTrajectory>

Get cumulative improvement over time with trend analysis.

#### predictSuccess(hypothesis: Hypothesis): number

Predict success probability (0-1) for a new hypothesis.

#### exportData(): Promise<string>

Export all data to a timestamped JSON file.

## Best Practices

### 1. Record Every Outcome

Even failures are valuable data. Always record outcomes:

```typescript
// Good
await tracker.recordOutcome(outcome); // Record everything

// Bad
if (outcome.result === 'success') {
  await tracker.recordOutcome(outcome); // Only successes
}
```

### 2. Wait for Sufficient Data

Don't make decisions on small samples:

```typescript
const insights = await tracker.analyzePatterns();

const sufficientData = insights.filter(i => i.sampleSize >= 10);
// Only trust insights with adequate sample size
```

### 3. Monitor Trends, Not Point Estimates

Look at trajectory, not individual outcomes:

```typescript
const trajectory = await tracker.getImprovementTrajectory();

if (trajectory.trend === 'improving' && trajectory.velocityPerWeek > 1.0) {
  // Strategy is working
}
```

### 4. Update Strategy Based on Evidence

Use predictions to guide hypothesis selection:

```typescript
const hypotheses = [hypothesis1, hypothesis2, hypothesis3];

const predictions = hypotheses.map(h => ({
  hypothesis: h,
  probability: tracker.predictSuccess(h)
}));

// Sort by predicted success
predictions.sort((a, b) => b.probability - a.probability);

// Try highest probability first
const bestHypothesis = predictions[0].hypothesis;
```

### 5. Export Regularly for Analysis

Create periodic exports for external analysis:

```typescript
// Weekly export
const exportPath = await tracker.exportData();
console.log(`Weekly export: ${exportPath}`);

// Analyze externally (Python, R, etc.)
// Visualize trends
// Share with team
```

## Philosophy

The meta-learning tracker embodies three principles:

1. **Learn from Everything**: Success and failure both provide valuable information
2. **Measure Rigorously**: No claims without evidence
3. **Adapt Continuously**: Strategy should evolve based on what works

By tracking patterns over time, the system becomes smarter about self-improvement itself, creating a virtuous cycle of learning and optimization.

## See Also

- [acceptance-gate.ts](./acceptance-gate.ts) - Decision logic for modifications
- [validator.ts](./validator.ts) - Anti-fabrication validation
- [SELF_IMPROVING_SYSTEM_DESIGN.md](../../.swarm/artifacts/SELF_IMPROVING_SYSTEM_DESIGN.md) - Overall design
