# Baseline Tracker

Evidence-based system metrics tracking for the Sartor-Claude-Network.

## Overview

The baseline tracker measures and compares system performance across multiple dimensions, providing objective evidence of improvements or regressions. All metrics are measured, not fabricated.

## Metrics Tracked

### 1. Agent Success Rate
- **What**: Percentage of agents that complete successfully
- **Source**: `.swarm/results/*.json` coordinator result files
- **Formula**: `(successful_agents / total_agents) * 100`
- **Higher is better**

### 2. Average Task Duration
- **What**: Average time for successful task completion
- **Source**: `durationMs` field in coordinator results
- **Unit**: milliseconds
- **Lower is better**

### 3. Memory Latency
Three-tier latency measurement:

- **Hot (Cache Hit)**: Query latency with cache enabled
- **Warm (No Cache)**: Query latency without cache
- **Cold (First Write)**: Initial store operation latency
- **Unit**: milliseconds
- **Lower is better**

### 4. Test Pass Rate
- **What**: Percentage of validation tests passing
- **Source**: Test suite execution
- **Formula**: `(passed_tests / total_tests) * 100`
- **Higher is better**

### 5. Validation Score
- **What**: Validator throughput (operations per second)
- **Source**: Benchmark validation operations
- **Unit**: ops/sec
- **Higher is better**

### 6. Coordinator Efficiency
- **What**: Ratio of productive time vs total time (including wasted timeouts)
- **Source**: `actualDurationMs` and `wastedTimeMs` from coordinator stats
- **Formula**: `success_time / (success_time + wasted_time)`
- **Range**: 0.0 to 1.0
- **Higher is better**

## Usage

### Capture a Baseline

```bash
npx tsx framework/validation/baseline-tracker.ts capture [label]
```

Example:
```bash
npx tsx framework/validation/baseline-tracker.ts capture pre-optimization
```

This will:
1. Read coordinator results from `.swarm/results/`
2. Run memory benchmarks
3. Execute test suite
4. Measure validator performance
5. Save metrics to `.swarm/baselines/[label].json`

### Compare to Baseline

```bash
npx tsx framework/validation/baseline-tracker.ts compare <baseline-label> [current-label]
```

Example:
```bash
# Compare to pre-optimization baseline (captures current metrics)
npx tsx framework/validation/baseline-tracker.ts compare pre-optimization current

# Compare two saved baselines
npx tsx framework/validation/baseline-tracker.ts compare baseline-v1 baseline-v2
```

Output includes:
- Side-by-side metric comparison
- Delta values (absolute and percentage)
- Status indicators (✓ improved, ✗ regressed, ○ neutral)
- Summary of changes

### List Available Baselines

```bash
npx tsx framework/validation/baseline-tracker.ts list
```

## Baseline Files

Baselines are stored in `.swarm/baselines/` as JSON files:

```json
{
  "timestamp": "2025-12-17T03:16:13.496Z",
  "agentSuccessRate": 57.43,
  "avgTaskDuration": 75730.44,
  "memoryLatency": {
    "hot": 4.30,
    "warm": 9.02,
    "cold": 0.25
  },
  "testPassRate": 100,
  "validationScore": 4172.31,
  "coordinatorEfficiency": 0.85
}
```

## Comparison Logic

### Significance Threshold
Changes are marked as significant if they exceed 5% (configurable via `SIGNIFICANCE_THRESHOLD`).

### Status Determination

- **Improved**: Metric changed in the beneficial direction (higher for most, lower for latency/duration)
- **Regressed**: Metric changed in the detrimental direction
- **Neutral**: Change is less than 1%

### Direction Rules

**Higher is Better:**
- `agentSuccessRate`
- `testPassRate`
- `validationScore`
- `coordinatorEfficiency`

**Lower is Better:**
- `avgTaskDuration`
- `memoryLatency.hot`
- `memoryLatency.warm`
- `memoryLatency.cold`

## Integration

The baseline tracker can be integrated into CI/CD pipelines:

```bash
#!/bin/bash
# Pre-change baseline
npx tsx framework/validation/baseline-tracker.ts capture before-change

# Make changes, deploy, test...

# Post-change comparison
npx tsx framework/validation/baseline-tracker.ts compare before-change current
```

## Evidence-Based Claims

All metrics are measured from actual system operations:
- No fabricated scores
- No composite metrics without calculation basis
- No assumptions about performance

When reporting metrics, always cite the baseline file:
```
Memory latency improved by 15% (hot: 4.3ms → 3.6ms) as measured in baseline comparison
between pre-optimization and post-optimization baselines.
```

## Limitations

1. **Memory Benchmarks**: Run on current system state; may vary with data size
2. **Coordinator Results**: Requires existing result files in `.swarm/results/`
3. **Variance**: Natural performance variance means small differences (<5%) may not be meaningful
4. **Dependencies**: Requires working test suite and validator

## Anti-Fabrication Compliance

This implementation follows CLAUDE.md anti-fabrication protocols:
- ✓ Every score measured from actual operations
- ✓ No composite scores without calculation basis
- ✓ Evidence chain provided (result files, benchmark runs)
- ✓ Limitations documented
- ✓ Uncertainty expressed (variance warnings)
