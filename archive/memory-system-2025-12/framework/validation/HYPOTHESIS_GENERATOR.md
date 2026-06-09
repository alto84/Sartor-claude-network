# Hypothesis Generator

Evidence-based improvement hypothesis generation for the self-improvement loop.

## Overview

The hypothesis generator analyzes system data to generate testable hypotheses for self-improvement. All hypotheses are backed by measured failures, patterns, or gaps - no fabricated claims.

## Features

- **Failure Analysis**: Identifies improvement opportunities from agent failures and timeouts
- **Pattern Detection**: Discovers recurring patterns in task execution (slow tasks, wasted time, duplicates)
- **Performance Gap Analysis**: Compares current metrics to target baselines
- **Prioritization**: Ranks hypotheses by impact, confidence, and evidence strength
- **Test Plans**: Each hypothesis includes concrete verification steps

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Hypothesis Generator                   │
├─────────────────────────────────────────────────────┤
│  Data Sources:                                      │
│  - .swarm/results/      (agent results)             │
│  - .swarm/baselines/    (baseline metrics)          │
│  - .swarm/decisions/    (historical decisions)      │
├─────────────────────────────────────────────────────┤
│  Analysis Types:                                    │
│  - analyzeFailures()         (what went wrong?)     │
│  - detectPatterns()          (recurring issues?)    │
│  - identifyPerformanceGaps() (below target?)        │
├─────────────────────────────────────────────────────┤
│  Output:                                            │
│  - Prioritized hypotheses with test plans           │
│  - Evidence backing each hypothesis                 │
│  - Confidence and priority scores                   │
└─────────────────────────────────────────────────────┘
```

## Hypothesis Structure

```typescript
interface Hypothesis {
  id: string;                       // Unique identifier
  source: 'failure_analysis' | 'pattern_detection' | 'performance_gap' | 'user_feedback';
  target: string;                   // What to modify (file/config path)
  type: 'addition' | 'removal' | 'reword';
  description: string;              // What to change
  expectedOutcome: string;          // What improvement to expect
  confidence: 'low' | 'medium' | 'high';
  priority: number;                 // 1-10, higher = more urgent
  testPlan: string[];              // How to verify
  evidence: {
    sourceData: string;             // Where evidence came from
    dataPoints: number;             // How many data points
    pattern: string;                // What pattern was observed
  };
}
```

## Usage

### Command Line

```bash
# Generate all hypotheses
npx tsx framework/validation/hypothesis-generator.ts generate

# Analyze failures only
npx tsx framework/validation/hypothesis-generator.ts failures

# Detect patterns only
npx tsx framework/validation/hypothesis-generator.ts patterns

# Identify performance gaps only
npx tsx framework/validation/hypothesis-generator.ts gaps
```

### Programmatic API

```typescript
import { createHypothesisGenerator } from './hypothesis-generator';

const generator = createHypothesisGenerator();

// Generate all hypotheses from available data
const hypotheses = await generator.generateHypotheses();

// Prioritize by impact and confidence
const prioritized = generator.prioritize(hypotheses);

// Get top hypothesis
const topHypothesis = prioritized[0];
console.log(topHypothesis.description);
console.log(topHypothesis.expectedOutcome);
console.log(topHypothesis.testPlan);
```

## Analysis Types

### 1. Failure Analysis

Analyzes agent failures to identify improvement opportunities.

**Detects:**
- High timeout rates → suggests health check mechanism
- High failure rates → suggests error recovery
- Empty output failures → suggests bootstrap improvements

**Example:**
```typescript
const results = readAgentResults();
const failureHypotheses = generator.analyzeFailures(results);
// → "Add health check mechanism to detect stuck agents before timeout"
```

### 2. Pattern Detection

Discovers recurring patterns in successful task executions.

**Detects:**
- Slow tasks → suggests performance profiling
- High wasted time → suggests adaptive timeouts
- Duplicate outputs → suggests result caching

**Example:**
```typescript
const results = readAgentResults();
const patternHypotheses = generator.detectPatterns(results);
// → "Add adaptive timeout mechanism to reduce wasted time"
```

### 3. Performance Gap Analysis

Compares current metrics to target baselines.

**Detects:**
- Low agent success rate (<80%) → suggests bootstrap improvements
- Low coordinator efficiency (<70%) → suggests timeout optimization
- Low test pass rate (<90%) → suggests test fixes
- High memory latency (>100ms) → suggests query optimization
- Low validation throughput (<1000 ops/sec) → suggests rule optimization

**Example:**
```typescript
const baseline = await tracker.captureBaseline();
const gapHypotheses = generator.identifyPerformanceGaps(baseline);
// → "Improve agent bootstrap instructions to increase success rate from 57% to >80%"
```

## Hypothesis Examples

### High Timeout Rate

```json
{
  "id": "hyp-timeout-1765943387865",
  "source": "failure_analysis",
  "target": "framework/coordinator/health-check.ts",
  "type": "addition",
  "description": "Add health check mechanism to detect stuck agents before timeout",
  "expectedOutcome": "Reduce timeout waste from 75% to <10%",
  "confidence": "high",
  "priority": 9,
  "testPlan": [
    "Run 20 tasks with health check enabled",
    "Measure timeout rate before and after",
    "Verify early detection reduces wasted time",
    "Check that legitimate long-running tasks still complete"
  ],
  "evidence": {
    "sourceData": ".swarm/results",
    "dataPoints": 15,
    "pattern": "15/20 tasks timeout (75.0%)"
  }
}
```

### Empty Output Failures

```json
{
  "id": "hyp-empty-output-1765943387865",
  "source": "failure_analysis",
  "target": "framework/bootstrap/bootstrap-loader.ts",
  "type": "reword",
  "description": "Improve bootstrap instructions to prevent empty agent output",
  "expectedOutcome": "Eliminate empty output failures",
  "confidence": "high",
  "priority": 7,
  "testPlan": [
    "Review bootstrap instructions for clarity",
    "Add explicit output requirements",
    "Test with 10 agent spawns",
    "Verify all produce non-empty output"
  ],
  "evidence": {
    "sourceData": ".swarm/results",
    "dataPoints": 43,
    "pattern": "43 agents produced empty output"
  }
}
```

### Performance Gap

```json
{
  "id": "hyp-success-1765943387865",
  "source": "performance_gap",
  "target": "framework/bootstrap/bootstrap-loader.ts",
  "type": "reword",
  "description": "Improve agent bootstrap instructions to increase success rate",
  "expectedOutcome": "Increase success rate from 57.4% to >80%",
  "confidence": "high",
  "priority": 9,
  "testPlan": [
    "Review failed agent logs for common issues",
    "Clarify bootstrap instructions",
    "Add success criteria examples",
    "Test with 20 agent spawns",
    "Measure success rate improvement"
  ],
  "evidence": {
    "sourceData": ".swarm/baselines",
    "dataPoints": 1,
    "pattern": "Agent success rate is 57.4% (target: >80%)"
  }
}
```

## Integration with Self-Improvement Loop

The hypothesis generator fits into the self-improvement loop:

```
1. GENERATE HYPOTHESIS
   ↓
   generator.generateHypotheses()
   → Analyze system data
   → Generate testable hypotheses
   → Prioritize by impact

2. SELECT HYPOTHESIS
   ↓
   prioritized[0]
   → Pick highest priority
   → Review test plan
   → Verify evidence

3. A/B TEST
   ↓
   ab-test-runner.ts
   → Test baseline vs modified
   → Collect performance data
   → Measure improvement

4. EVALUATE
   ↓
   acceptance-gate.ts
   → Check for regressions
   → Verify improvement magnitude
   → Decision: ACCEPT/REJECT

5. APPLY (if accepted)
   ↓
   Apply modification
   → Update baseline
   → Record decision
   → Loop back to step 1
```

## Prioritization

Hypotheses are prioritized by:

1. **Priority score** (1-10, higher = more urgent)
2. **Confidence level** (high > medium > low)
3. **Evidence strength** (more data points = stronger)

Priority is calculated based on:
- **Severity of issue**: High failure rates get higher priority
- **Impact magnitude**: Large performance gaps get higher priority
- **Evidence strength**: More data points increase confidence
- **Actionability**: Clear targets get higher priority

## Confidence Levels

- **High**: 5+ data points supporting the hypothesis
- **Medium**: 3-4 data points supporting the hypothesis
- **Low**: 1-2 data points supporting the hypothesis

## Anti-Fabrication Compliance

The hypothesis generator follows strict anti-fabrication protocols:

- **No fabricated scores**: All metrics come from measured data
- **Evidence required**: Every hypothesis includes source data and data points
- **Conservative claims**: Expected outcomes are based on actual performance gaps
- **Testable**: Each hypothesis includes concrete verification steps
- **Traceable**: Evidence points to specific data sources

## Output Files

Hypotheses are saved to `.swarm/hypotheses.json`:

```json
{
  "timestamp": "2025-12-17T03:49:47.866Z",
  "count": 4,
  "hypotheses": [
    { /* hypothesis 1 */ },
    { /* hypothesis 2 */ },
    { /* hypothesis 3 */ },
    { /* hypothesis 4 */ }
  ]
}
```

## Testing

Run unit tests:

```bash
npx tsx framework/validation/hypothesis-generator.test.ts
```

Run examples:

```bash
npx tsx framework/validation/hypothesis-generator-example.ts
```

## Requirements

Before using the hypothesis generator:

1. **Run tasks**: Execute agent tasks to populate `.swarm/results/`
2. **Capture baseline** (optional): Run `baseline-tracker.ts capture` for gap analysis

## Limitations

- **Requires data**: Needs historical agent results to generate hypotheses
- **Pattern threshold**: Requires minimum 3 occurrences to detect patterns
- **No cross-correlation**: Doesn't analyze relationships between metrics
- **No causal inference**: Identifies correlations, not causation

## Future Enhancements

Potential improvements:
- Multi-metric correlation analysis
- Temporal pattern detection (time-of-day effects)
- User feedback integration
- Hypothesis dependency tracking
- Success rate prediction based on historical acceptance

## See Also

- `acceptance-gate.ts` - Evaluate modification proposals
- `baseline-tracker.ts` - Track system performance metrics
- `ab-test-runner.ts` - Run A/B tests for hypotheses
- `SELF_IMPROVING_SYSTEM_DESIGN.md` - Overall system design
