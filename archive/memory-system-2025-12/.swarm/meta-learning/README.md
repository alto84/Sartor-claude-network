# Meta-Learning Data Storage

This directory contains the meta-learning tracker's data files.

## File Structure

```
.swarm/meta-learning/
├── outcomes.json              # All outcomes aggregated
├── outcome-{id}.json          # Individual outcome files
├── index.json                 # Quick lookup index
└── export-{timestamp}.json    # Full data exports
```

## Data Format

### outcomes.json

Array of all modification outcomes:

```json
[
  {
    "hypothesisId": "mod-001",
    "type": "addition",
    "target": "error-handling",
    "result": "success",
    "improvementPercent": 10.0,
    "timestamp": "2025-12-16T12:00:00.000Z",
    "metadata": {
      "testsImproved": 2,
      "testsRegressed": 0,
      "netChange": 2,
      "decisionId": "decision-001"
    }
  }
]
```

### outcome-{id}.json

Individual outcome with audit trail:

```json
{
  "hypothesisId": "mod-001",
  "type": "addition",
  "target": "error-handling",
  "result": "success",
  "improvementPercent": 10.0,
  "timestamp": "2025-12-16T12:00:00.000Z",
  "metadata": {
    "testsImproved": 2,
    "testsRegressed": 0,
    "netChange": 2,
    "decisionId": "decision-001"
  },
  "_audit": {
    "recordedAt": "2025-12-16T12:00:01.000Z",
    "version": "1.0.0"
  }
}
```

### index.json

Quick lookup metadata:

```json
{
  "totalOutcomes": 10,
  "lastUpdated": "2025-12-16T12:00:00.000Z",
  "version": "1.0.0"
}
```

### export-{timestamp}.json

Complete data export for analysis:

```json
{
  "metadata": {
    "exportedAt": "2025-12-16T12:00:00.000Z",
    "totalOutcomes": 10,
    "version": "1.0.0"
  },
  "outcomes": [...],
  "statistics": {
    "byType": {
      "addition": {
        "total": 6,
        "successful": 5,
        "failed": 1,
        "neutral": 0,
        "rate": 0.833
      },
      "removal": {
        "total": 1,
        "successful": 0,
        "failed": 1,
        "neutral": 0,
        "rate": 0.0
      },
      "reword": {
        "total": 3,
        "successful": 1,
        "failed": 0,
        "neutral": 2,
        "rate": 0.333
      }
    },
    "byTarget": {
      "error-handling": {
        "total": 3,
        "successful": 3,
        "failed": 0,
        "neutral": 0,
        "rate": 1.0,
        "mostSuccessfulType": "addition"
      }
    },
    "trajectory": {
      "timestamps": [...],
      "cumulativeImprovement": [...],
      "movingAverage": [...],
      "trend": "improving",
      "velocityPerWeek": 2.5
    }
  },
  "insights": [...]
}
```

## Data Retention

- Outcomes are never deleted (preserve full history)
- Export files can be archived after analysis
- Old individual outcome files can be compressed

## Privacy

- No personal data stored
- Only system performance metrics
- Safe to share for analysis

## Usage

Access via the meta-learning tracker API:

```typescript
import { createMetaLearningTracker } from '../framework/validation/meta-learning';

const tracker = createMetaLearningTracker('.swarm/meta-learning');
const outcomes = await tracker.getOutcomes();
```
