# Meta-Learning Tracker - Quick Start Guide

## Installation

No installation needed - the tracker is part of the validation framework.

## Basic Usage

### 1. Create Tracker

```typescript
import { createMetaLearningTracker } from './framework/validation/meta-learning';

const tracker = createMetaLearningTracker();
// Data stored in .swarm/meta-learning/
```

### 2. Record Outcomes

```typescript
await tracker.recordOutcome({
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
});
```

### 3. Analyze Patterns

```typescript
const insights = await tracker.analyzePatterns();

insights.forEach(insight => {
  console.log(`Pattern: ${insight.pattern}`);
  console.log(`Confidence: ${(insight.confidence * 100).toFixed(0)}%`);
  console.log(`Recommendation: ${insight.recommendation}`);
});
```

### 4. Get Success Rates

```typescript
// By type
const byType = await tracker.getSuccessRateByType();
console.log(`Addition success rate: ${(byType.addition.rate * 100).toFixed(1)}%`);

// By target
const byTarget = await tracker.getSuccessRateByTarget();
console.log(`Error-handling success rate: ${(byTarget['error-handling'].rate * 100).toFixed(1)}%`);
```

### 5. Predict Success

```typescript
const hypothesis = {
  id: 'new-001',
  type: 'addition',
  target: 'error-handling',
  description: 'Add more error handling',
  expectedImprovement: 10
};

const probability = tracker.predictSuccess(hypothesis);
console.log(`Predicted success: ${(probability * 100).toFixed(1)}%`);
```

### 6. Monitor Trajectory

```typescript
const trajectory = await tracker.getImprovementTrajectory();
console.log(`Trend: ${trajectory.trend}`);
console.log(`Velocity: ${trajectory.velocityPerWeek.toFixed(2)}% per week`);
```

## Integration with Acceptance Gate

```typescript
import { createAcceptanceGate } from './framework/validation/acceptance-gate';
import { createMetaLearningTracker } from './framework/validation/meta-learning';

const gate = createAcceptanceGate();
const tracker = createMetaLearningTracker();

// 1. Evaluate proposal
const decision = gate.evaluate(proposal);
await gate.recordDecision(decision);

// 2. Record for meta-learning
await tracker.recordOutcome({
  hypothesisId: proposal.id,
  type: proposal.type,
  target: proposal.target,
  result: decision.decision === 'ACCEPT' ? 'success' : 'failure',
  improvementPercent: (decision.metadata.netChange / 20) * 100,
  timestamp: proposal.timestamp,
  metadata: {
    testsImproved: decision.metadata.testsImproved,
    testsRegressed: decision.metadata.testsRegressed,
    netChange: decision.metadata.netChange,
    decisionId: decision.metadata.decisionId
  }
});

// 3. Learn from patterns
const insights = await tracker.analyzePatterns();
```

## Common Use Cases

### Use Case 1: Choose Best Hypothesis

```typescript
const hypotheses = [hypothesis1, hypothesis2, hypothesis3];

const predictions = hypotheses.map(h => ({
  hypothesis: h,
  probability: tracker.predictSuccess(h)
}));

predictions.sort((a, b) => b.probability - a.probability);

// Select highest probability
const best = predictions[0].hypothesis;
```

### Use Case 2: Detect Declining Performance

```typescript
const trajectory = await tracker.getImprovementTrajectory();

if (trajectory.trend === 'declining') {
  console.log('WARNING: System performance declining');
  // Review recent modifications
  const recent = await tracker.getOutcomes({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  });
}
```

### Use Case 3: Identify Problematic Patterns

```typescript
const insights = await tracker.analyzePatterns();

const warnings = insights.filter(i =>
  i.pattern.includes('regression') ||
  i.recommendation.includes('Review')
);

warnings.forEach(w => console.log(`⚠️  ${w.pattern}`));
```

### Use Case 4: Export for Analysis

```typescript
const exportPath = await tracker.exportData();
console.log(`Data exported to: ${exportPath}`);

// Can now analyze in Python, R, spreadsheet, etc.
```

## Running Examples

### Run Tests

```bash
npm run build
node dist/framework/validation/meta-learning.test.js
```

Expected output: All tests passing ✓

### Run Demo

```bash
npm run build
node dist/framework/validation/meta-learning-demo.js
```

Shows complete 5-cycle simulation with pattern analysis.

### Run Integration Example

```bash
npm run build
node dist/framework/validation/meta-learning-integration-example.js
```

Shows single-cycle workflow.

## Data Files

All data stored in `.swarm/meta-learning/`:

- `outcomes.json` - All outcomes
- `outcome-{id}.json` - Individual outcomes
- `index.json` - Quick lookup
- `export-{timestamp}.json` - Data exports

## Key Concepts

### Modification Types
- **addition**: Add new requirements/instructions
- **removal**: Remove existing content
- **reword**: Change wording without adding/removing

### Results
- **success**: Modification improved tests (accepted)
- **failure**: Modification caused regression (rejected)
- **neutral**: No measurable effect (rejected)

### Confidence Levels
- 0.3-0.4: Small sample (5-9 outcomes)
- 0.5-0.6: Moderate sample (10-19 outcomes)
- 0.7+: Larger sample (20+ outcomes)

### Trends
- **improving**: Moving average trending up
- **plateauing**: Flat performance
- **declining**: Moving average trending down
- **insufficient_data**: Less than 5 data points

## Troubleshooting

### No insights generated

**Cause**: Less than 5 outcomes recorded

**Solution**: Record more outcomes before analyzing patterns

### Low prediction accuracy

**Cause**: Insufficient historical data for target/type

**Solution**: Use predictions as guidance, not certainty. Build more data.

### Trajectory shows "insufficient_data"

**Cause**: Less than 5 data points

**Solution**: Continue recording outcomes until you have 5+

## Next Steps

1. **Read full documentation**: See `META_LEARNING_README.md`
2. **Study examples**: Review `meta-learning-demo.ts`
3. **Integrate**: Connect with your acceptance gate
4. **Monitor**: Check trajectory regularly
5. **Adapt**: Adjust strategy based on insights

## Getting Help

- Full docs: `META_LEARNING_README.md`
- Implementation details: `META_LEARNING_IMPLEMENTATION.md`
- API reference: See TypeScript interfaces in `meta-learning.ts`
- Examples: `meta-learning-demo.ts` and `meta-learning-integration-example.ts`
