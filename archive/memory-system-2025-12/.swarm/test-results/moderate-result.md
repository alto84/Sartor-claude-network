# Hypothesis Implementations in local-only-optimized.js

## Summary

The coordinator file `coordinator/local-only-optimized.js` implements 4 hypotheses for optimizing the Claude Swarm coordinator. Below are the implementations with their line numbers.

---

## Hypothesis 1: Health Check Probe

**Purpose**: Verify agent can initialize before spawning full task

**Implementation Location**: Lines 178-286

- `performHealthCheck()` method: Lines 182-276
- `logHealthCheck()` helper: Lines 278-286

**Key Features**:
- 15-second health check timeout (configurable)
- Sends simple "READY" prompt to verify agent responsiveness
- Tracks success/failure statistics

---

## Hypothesis 2: Lazy Context Loading

**Purpose**: Minimal startup prompt with on-demand context loading

**Implementation Location**: Lines 118-138, 651-802

- `analyzeContextSize()` function: Lines 122-138
- `saveContextFile()` method: Lines 655-680
- `buildLazyContextPrompt()` method: Lines 686-758
- `buildFullContextPrompt()` method: Lines 760-802

**Key Features**:
- Analyzes context size to determine lazy vs full mode
- Saves large contexts to file for on-demand loading
- Reduces initial prompt size for faster startup

---

## Hypothesis 3: Progressive Timeout

**Purpose**: Activity-based timeout extension

**Implementation Location**: Lines 66-116, 543-649

- `estimateTaskComplexity()` function: Lines 70-116
- `setProgressiveTimeout()` method: Lines 546-562
- `showsProgress()` method: Lines 564-574
- `checkForTimeoutExtension()` method: Lines 576-595
- `extendTimeout()` method: Lines 597-626
- `monitorProgress()` method: Lines 628-649

**Key Features**:
- Task complexity estimation (simple/moderate/complex)
- Initial timeout based on complexity score
- Dynamic timeout extension when agent shows progress
- Activity window tracking

---

## Hypothesis 4: Streaming Output with Heartbeat

**Purpose**: Real-time output monitoring with heartbeat detection

**Implementation Location**: Lines 512-540, 854-924

- `checkHeartbeat()` method: Lines 516-540
- `initIncrementalFile()` method: Lines 858-887
- `appendIncrementalOutput()` method: Lines 889-896
- `finalizeIncrementalFile()` method: Lines 898-924

**Key Features**:
- 15-second heartbeat check interval
- 45-second silence warning
- 90-second heartbeat timeout
- Incremental output file logging

---

## Configuration Section

All hypothesis configurations are defined in `CONFIG` object: Lines 32-64

| Hypothesis | Config Lines |
|------------|--------------|
| H1: Health Check | 38-41 |
| H2: Lazy Context | 43-47 |
| H3: Progressive Timeout | 49-55 |
| H4: Streaming | 57-63 |

---

## Integration Order (as documented)

From the file header (Lines 7-11):
1. Health Check Probe (Hypothesis 1) - Verify agent can initialize
2. Lazy Context Loading (Hypothesis 2) - Minimal startup prompt
3. Streaming Output (Hypothesis 4) - Real-time output with heartbeat
4. Progressive Timeout (Hypothesis 3) - Activity-based timeout extension
