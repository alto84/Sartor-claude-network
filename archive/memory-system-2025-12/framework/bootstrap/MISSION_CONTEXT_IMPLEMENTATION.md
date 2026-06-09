# Mission Context Injection Implementation

## Overview

This document describes the implementation of mission state injection for agent bootstrap, providing agents with phase-aware context, deadline tracking, and urgency-based restrictions.

## Implementation Location

- **File**: `/home/alton/Sartor-claude-network/framework/bootstrap/mission-state.ts`
- **Test**: `/home/alton/Sartor-claude-network/framework/bootstrap/__tests__/mission-state.test.ts`
- **Demo**: `/home/alton/Sartor-claude-network/framework/bootstrap/demo-mission-context.ts`

## New Interfaces

### MissionContext

Simplified mission context for agent bootstrap:

```typescript
interface MissionContext {
  phase: 'bootstrap' | 'research' | 'implementation' | 'validation' | 'reporting';
  deadline: string;
  progressPercent: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  restrictions: string[];
  checkpoints: string[];
  warnings: string[];
}
```

## New Functions

### getMissionContext(missionConfig?, currentTime?): MissionContext

Returns simplified mission context for agent bootstrap, including:
- Current phase based on progress
- Deadline timestamp
- Progress percentage
- Urgency level
- Phase-specific restrictions
- Phase-specific checkpoints
- Time-based warnings

### getPhaseRestrictions(phase): string[]

Returns phase-specific restrictions:

- **bootstrap**: Full access, learning mode
- **research**: Read-only, must cite sources
- **implementation**: Can edit, must test
- **validation**: Run tests, no fabrication
- **reporting**: No new changes, synthesis only

### formatMissionContextForPrompt(context): string

Formats mission context for prompt injection with:
- Urgency indicators
- Phase information
- Restrictions list
- Checkpoints list
- Warnings section

## Phase-Based Restrictions

### Bootstrap Phase (0-10% progress)
- Full access granted - learning mode
- Focus on initialization and setup
- No premature conclusions

### Research Phase (10-40% progress)
- Read-only mode - no code changes
- Must cite sources for all claims
- Evidence gathering only
- No implementation during research phase

### Implementation Phase (40-70% progress)
- Can edit code and create files
- Must write tests for all changes
- Must validate changes work correctly
- No untested code allowed

### Validation Phase (70-90% progress)
- Run tests and verify correctness
- No fabrication of test results
- No new features - bug fixes only
- Focus on quality and stability

### Reporting Phase (90-100% progress)
- No new code changes allowed
- Synthesis and documentation only
- No agent spawning
- Consolidation mode

## Urgency Calculation

Urgency is calculated based on remaining time to deadline:

- **>24h remaining**: `low`
- **12-24h**: `medium`
- **4-12h**: `high`
- **<4h**: `critical`

## Checkpoints

Phase-specific checkpoints guide agent actions:

### Bootstrap
1. Load mission configuration
2. Initialize memory systems
3. Validate agent capabilities

### Research
1. Gather all relevant sources
2. Document evidence and citations
3. Identify implementation requirements

### Implementation
1. Write implementation code
2. Create test coverage
3. Verify all tests pass

### Validation
1. Run full test suite
2. Fix any identified bugs
3. Verify performance metrics

### Reporting
1. Consolidate all findings
2. Generate final report
3. Archive artifacts

Time-based checkpoints are automatically added:
- **<1h remaining**: "URGENT: Wrap up immediately"
- **<4h remaining**: "Begin transition to reporting phase"

## Warnings

Warnings are generated based on:
- Time to final report deadline
- Time to mission end
- Phase transitions (70% → validation, 90% → reporting)
- Past deadline conditions

## CLI Usage

```bash
# Show formatted mission context
npx tsx framework/bootstrap/mission-state.ts context

# Show mission context as JSON
npx tsx framework/bootstrap/mission-state.ts context-json

# Show full mission state (original format)
npx tsx framework/bootstrap/mission-state.ts status

# Check if agent spawning is allowed
npx tsx framework/bootstrap/mission-state.ts can-spawn

# Show time remaining
npx tsx framework/bootstrap/mission-state.ts time-left

# Show raw mission state JSON
npx tsx framework/bootstrap/mission-state.ts json
```

## Example Output

```
## Mission Context

[HIGH URGENCY] **Phase**: IMPLEMENTATION
**Deadline**: 2025-12-17T13:07:23.457Z
**Progress**: 50.0%
**Urgency Level**: HIGH

### Phase Restrictions
- Can edit code and create files
- Must write tests for all changes
- Must validate changes work correctly
- No untested code allowed

### Checkpoints
1. Write implementation code
2. Create test coverage
3. Verify all tests pass
```

## Usage in Agent Bootstrap

To inject mission context into agent prompts:

```typescript
import { getMissionContext, formatMissionContextForPrompt } from './mission-state.js';

// Get current mission context
const context = getMissionContext();

// Format for prompt injection
const contextPrompt = formatMissionContextForPrompt(context);

// Inject into agent bootstrap
const agentPrompt = `
${contextPrompt}

## Your Task
...
`;
```

## Integration with Existing Code

The new functions work alongside existing mission state functions:
- `getCurrentMissionState()` - Full detailed state
- `getMissionContext()` - Simplified context for bootstrap
- Both use the same underlying `MissionConfig` and timeline calculations

## Testing

Run the demo to see all phases:

```bash
npx tsx framework/bootstrap/demo-mission-context.ts
```

This shows:
1. Bootstrap phase (5% progress, low urgency)
2. Research phase (25% progress, medium urgency)
3. Implementation phase (50% progress, high urgency)
4. Validation phase (80% progress, critical urgency)
5. Reporting phase (95% progress, critical urgency)
6. All phase restrictions

## Notes

- Phase detection is automatic based on progress percentage
- Urgency is recalculated based on remaining time
- Checkpoints are phase-specific with time-based additions
- Warnings include both time-based and phase-transition alerts
- The 'complete' phase is automatically mapped to 'reporting' in MissionContext
