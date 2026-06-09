# Coordinator Agent Startup Routine Improvements

**Research Document**
**Date**: 2025-12-15
**Purpose**: Propose testable improvements to coordinator agent startup routines based on empirical evidence

---

## Executive Summary

Analysis of 25 coordinator-spawned agent tasks reveals a binary success pattern: agents either complete within 11-220 seconds or timeout with zero output. This document proposes four testable hypotheses to improve startup reliability, reduce timeout waste, and enable early failure detection.

**Key Finding**: Current implementation spawns agents with full context immediately and waits up to 120 seconds with no visibility into agent state. Failures are always silent (0 bytes output), suggesting initialization problems rather than execution failures.

---

## Current System Analysis

### Configuration
```javascript
// coordinator/local-only.js
const CONFIG = {
  maxConcurrentAgents: 5,
  agentTimeoutSeconds: 120,  // Fixed timeout
  pollIntervalMs: 1000,
  swarmDir: '.swarm',
};
```

### Spawn Process
```javascript
async spawnAgent(requestId, request) {
  const prompt = this.buildAgentPrompt(requestId, request);  // Full prompt

  const claudeProcess = spawn('claude', ['--dangerously-skip-permissions'], {
    env: { SWARM_REQUEST_ID, SWARM_PARENT_ID, SWARM_AGENT_ROLE },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  claudeProcess.stdin.write(prompt);  // All context at once
  claudeProcess.stdin.end();

  // Collect output (no streaming visibility)
  claudeProcess.stdout.on('data', (data) => { stdout += data; });

  // Fixed timeout
  setTimeout(() => killAgent(requestId, 'TIMEOUT'), 120000);
}
```

### Prompt Structure
- **REQUEST ID + PARENT**: Coordination metadata
- **TASK OBJECTIVE**: Full task description
- **CONTEXT**: JSON dump (potentially large)
- **REQUIREMENTS**: List of requirements
- **INSTRUCTIONS**: Child spawning syntax, task completion directive

**Typical prompt size**: 500-2000 characters depending on context depth.

---

## Empirical Evidence from Results Analysis

### Success Pattern (64% - 16/25 tasks)
| Metric | Range | Median |
|--------|-------|--------|
| Duration | 11,141ms - 220,674ms | 106,829ms |
| Output | 100 - 1,420 chars | ~400 chars |
| Exit Code | 0 | 0 |

**Success characteristics:**
- Output appears quickly (within first 30s based on duration clustering)
- All successful agents produce substantive output
- Completion time correlates with task complexity, not timeout duration

### Failure Pattern (36% - 9/25 tasks)
| Metric | All Failures |
|--------|--------------|
| Duration | 120,026ms or 600,019ms (timeout tier) |
| Output | 0 bytes |
| Exit Code | null (killed) |

**Failure characteristics:**
- No partial output ever observed
- Three timeout tiers: ~120s (3 tasks), ~300s (3 tasks), ~600s (3 tasks)
- All failures hit exact timeout threshold
- Exit code null indicates SIGTERM (coordinator killed them)

### Critical Insight
**Binary initialization**: Agents either initialize successfully within ~30 seconds and complete their work, or they fail immediately and produce no output while consuming full timeout duration.

---

## Hypothesis 1: Agent Startup Health Check

### Problem
Current system has no visibility into whether an agent successfully initialized tools, permissions, and environment before receiving complex tasks. Failed agents consume full timeout (120-600s) producing zero output.

### Hypothesis
A lightweight health check probe sent before the main task would detect initialization failures within 5-10 seconds, preventing 110+ seconds of wasted timeout.

### Proposed Implementation

#### Phase 1: Health Check Probe
```javascript
async spawnAgentWithHealthCheck(requestId, request) {
  const claudeProcess = spawn('claude', ['--dangerously-skip-permissions'], {
    env: { ...standardEnv },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Phase 1: Health check (10s timeout)
  const healthPrompt = `HEALTH CHECK - Respond with "READY" if you can:
1. Execute bash commands (run: echo "bash_ok")
2. Read files (check if /tmp exists)
3. Write files (try creating /tmp/health-${requestId})

Respond with just "READY" or describe what failed.`;

  claudeProcess.stdin.write(healthPrompt + '\n');

  const healthTimeout = setTimeout(() => {
    console.log(`Health check timeout for ${requestId}`);
    claudeProcess.kill('SIGTERM');
  }, 10000);

  let healthResponse = '';
  await new Promise((resolve) => {
    claudeProcess.stdout.on('data', (data) => {
      healthResponse += data.toString();
      if (healthResponse.includes('READY')) {
        clearTimeout(healthTimeout);
        resolve(true);
      }
    });
    claudeProcess.on('close', () => resolve(false));
  });

  if (!healthResponse.includes('READY')) {
    this.saveResult(requestId, 'failed',
      `Health check failed: ${healthResponse}`, 10000, -1);
    return null;
  }

  // Phase 2: Send actual task
  const taskPrompt = this.buildAgentPrompt(requestId, request);
  claudeProcess.stdin.write(taskPrompt);
  claudeProcess.stdin.end();

  // Continue with normal execution...
}
```

### Test Method

**Test Setup:**
1. Modify coordinator to use phased startup
2. Create 10 identical test tasks (5 simple, 5 complex)
3. Run with original coordinator (control group)
4. Run with health-check coordinator (experimental group)

**Success Metrics:**
- **Early failure detection**: Failed agents detected within 10s instead of 120s
- **Resource efficiency**: Total time spent on failures reduced by >90%
- **False positive rate**: Health check failures on tasks that would have succeeded < 5%

**Test Command:**
```bash
# Control group
AGENT_TIMEOUT_SECONDS=120 node coordinator/local-only.js &
# Drop 10 test tasks, measure time-to-failure

# Experimental group
node coordinator/local-only-with-health.js &
# Drop same 10 test tasks, measure time-to-failure
```

**Expected Outcome:**
- Control: 5 failures × 120s = 600s wasted
- Experimental: 5 failures × 10s = 50s wasted
- **92% reduction in wasted timeout**

---

## Hypothesis 2: Lazy Context Loading

### Problem
Current implementation injects all context at startup via large JSON block. If context is large or requires fetching from memory system, agent may:
1. Spend significant time processing context before starting work
2. Exceed input token limits and truncate critical instructions
3. Load irrelevant context that never gets used

### Hypothesis
Starting agents with minimal context and providing a memory query function would:
1. Reduce startup time by 30-50%
2. Allow agents to fetch only relevant context
3. Prevent instruction truncation from oversized context blocks

### Proposed Implementation

#### Minimal Startup Prompt
```javascript
buildMinimalAgentPrompt(requestId, request) {
  return `You are Agent "${request.agentRole}" in a multi-agent swarm.

REQUEST ID: ${requestId}
PARENT: ${request.parentRequestId || 'none'}

TASK OBJECTIVE:
${request.task.objective}

MEMORY QUERY AVAILABLE:
If you need context, query the memory system:
  source /home/alton/claude-swarm/framework/memory/bootstrap.sh
  query_memory "topic" > context.txt
  cat context.txt

Available topics: ${this.getAvailableMemoryTopics().join(', ')}

INSTRUCTIONS:
1. Query memory only if needed for your task
2. Complete: ${request.task.objective}
3. Report results concisely

Begin:`;
}
```

#### Enhanced Version with Bootstrap
```javascript
buildLazyContextPrompt(requestId, request) {
  const essentialContext = {
    objective: request.task.objective,
    role: request.agentRole,
    requirements: request.task.requirements?.slice(0, 3) || [], // Max 3 requirements
  };

  const contextPointer = {
    full_context_path: `.swarm/context/${requestId}.json`,
    memory_topics: request.task.context?.memoryTopics || [],
    parent_results: request.parentRequestId ?
      `.swarm/results/${request.parentRequestId}.json` : null,
  };

  return `Agent "${request.agentRole}" - ${requestId}

ESSENTIAL CONTEXT:
${JSON.stringify(essentialContext, null, 2)}

ADDITIONAL CONTEXT (load if needed):
${JSON.stringify(contextPointer, null, 2)}

To load full context:
  cat ${contextPointer.full_context_path}

Begin your task. Load additional context only if essential.`;
}
```

### Test Method

**Test Setup:**
1. Create test tasks with varying context sizes:
   - Small: <500 chars context
   - Medium: 500-2000 chars context
   - Large: >2000 chars context
2. Run each task 5 times with full context injection (control)
3. Run each task 5 times with lazy loading (experimental)
4. Track: startup time, context bytes loaded, task success rate

**Success Metrics:**
- **Startup time**: Time from spawn to first output
- **Context efficiency**: Bytes loaded / bytes available (lazy should be <50%)
- **Success rate**: Must match control (prove lazy loading doesn't harm outcomes)

**Test Command:**
```bash
# Generate test tasks
for size in small medium large; do
  cat > .swarm/requests/context-test-${size}.json <<EOF
{
  "agentRole": "tester",
  "task": {
    "objective": "Echo the first requirement",
    "context": $(generate_context $size),
    "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"]
  }
}
EOF
done

# Run control
CONTEXT_MODE=full node coordinator/local-only.js &
# Measure time-to-first-output

# Run experimental
CONTEXT_MODE=lazy node coordinator/local-only-lazy.js &
# Measure time-to-first-output and bytes-loaded
```

**Expected Outcome:**
- Small tasks: 20% faster (less prompt processing)
- Medium tasks: 35% faster (skip irrelevant context)
- Large tasks: 50% faster + prevent truncation
- Success rate: 100% match with control

---

## Hypothesis 3: Progressive Timeout Adaptation

### Problem
Current fixed 120s timeout is wasteful for simple tasks (waste 110s on 10s tasks) and insufficient for complex tasks (evidence shows some need 220s+).

### Hypothesis
A progressive timeout system that starts at 60s and extends based on agent activity would:
1. Fail fast on truly stuck agents (60s instead of 120s)
2. Allow complex tasks more time when showing progress
3. Reduce average timeout waste by 40%

### Proposed Implementation

#### Activity-Based Timeout Extension
```javascript
async spawnAgentWithProgressiveTimeout(requestId, request) {
  const agentContext = {
    requestId,
    request,
    startTime: Date.now(),
    process: null,
    timeout: null,
    lastOutputTime: Date.now(),
    outputCheckpoints: [],
    timeoutDuration: 60000, // Start with 60s
  };

  const claudeProcess = spawn('claude', ['--dangerously-skip-permissions'], {
    // ... standard config
  });

  agentContext.process = claudeProcess;

  let stdout = '';
  claudeProcess.stdout.on('data', (data) => {
    stdout += data.toString();
    agentContext.lastOutputTime = Date.now();
    agentContext.outputCheckpoints.push({
      time: Date.now(),
      bytes: data.length,
    });

    // Extend timeout if agent is making progress
    if (this.showsProgress(agentContext)) {
      this.extendTimeout(agentContext);
    }
  });

  // Initial 60s timeout
  this.setProgressiveTimeout(agentContext);
}

showsProgress(agentContext) {
  const timeSinceLastOutput = Date.now() - agentContext.lastOutputTime;
  const recentCheckpoints = agentContext.outputCheckpoints.filter(
    c => Date.now() - c.time < 30000
  );

  // Progress indicators:
  // 1. Output in last 30 seconds
  // 2. Multiple output bursts (not just one initial response)
  return timeSinceLastOutput < 30000 && recentCheckpoints.length > 1;
}

extendTimeout(agentContext) {
  clearTimeout(agentContext.timeout);

  // Extend by 60s, max 240s total
  const elapsed = Date.now() - agentContext.startTime;
  if (elapsed < 240000) {
    console.log(`Extending timeout for ${agentContext.requestId} (showing progress)`);
    agentContext.timeoutDuration = Math.min(
      agentContext.timeoutDuration + 60000,
      240000 - elapsed
    );
    this.setProgressiveTimeout(agentContext);
  }
}

setProgressiveTimeout(agentContext) {
  agentContext.timeout = setTimeout(() => {
    const elapsed = Date.now() - agentContext.startTime;
    console.log(`Agent ${agentContext.requestId} timed out after ${elapsed}ms`);
    this.killAgent(agentContext.requestId, 'PROGRESSIVE_TIMEOUT');
  }, agentContext.timeoutDuration);
}
```

#### Task Complexity Heuristics
```javascript
estimateTaskComplexity(request) {
  const task = request.task;

  let complexity = 'simple'; // 60s
  let estimatedTimeout = 60000;

  // Check indicators of complexity
  const hasFileOps = /read|write|create|modify/i.test(task.objective);
  const hasMultipleReqs = (task.requirements?.length || 0) > 3;
  const hasChildSpawning = /spawn|coordinate|delegate/i.test(task.objective);
  const largeContext = JSON.stringify(task.context || {}).length > 1000;

  if (hasChildSpawning) {
    complexity = 'complex';
    estimatedTimeout = 180000; // Start at 180s for coordination tasks
  } else if (hasMultipleReqs && (hasFileOps || largeContext)) {
    complexity = 'moderate';
    estimatedTimeout = 120000; // Start at 120s
  }

  return { complexity, estimatedTimeout };
}
```

### Test Method

**Test Setup:**
1. Categorize existing 25 result files by actual completion time:
   - Fast: <30s (expect 60s timeout sufficient)
   - Medium: 30-120s (expect 120s timeout needed)
   - Slow: >120s (expect 180-240s timeout needed)
2. Create synthetic tasks matching each category
3. Run with fixed 120s timeout (control)
4. Run with progressive timeout (experimental)

**Success Metrics:**
- **Timeout efficiency**: Time wasted = timeout - completion_time
  - Control: Fixed waste for all failures
  - Experimental: Variable waste, but lower average
- **Complex task success**: Tasks needing >120s should get extensions
- **Fast failure**: Failed tasks should timeout at 60s instead of 120s

**Test Command:**
```bash
# Control group - fixed 120s
AGENT_TIMEOUT_SECONDS=120 node coordinator/local-only.js &
drop_test_tasks
measure_waste

# Experimental - progressive timeout
node coordinator/local-only-progressive.js &
drop_test_tasks
measure_waste

# Analysis
calculate_average_waste_reduction
```

**Expected Outcome:**
- Fast tasks (10s actual): Waste 50s instead of 110s (55% reduction)
- Medium tasks (100s actual): Waste 20s instead of 20s (same)
- Slow tasks (200s actual): Get 240s instead of failing at 120s (success)
- Failed tasks: Timeout at 60s instead of 120s (50% faster detection)

**Average waste reduction**: 40%

---

## Hypothesis 4: Output Streaming with Heartbeat Detection

### Problem
Current implementation collects output at process end. For long-running tasks, there's no visibility into whether agent is:
1. Working productively
2. Stuck in infinite loop
3. Waiting for external resource
4. Actually dead but process still running

### Hypothesis
Streaming output with heartbeat detection would enable:
1. Early detection of stuck agents (no heartbeat for 45s = likely stuck)
2. Real-time progress monitoring
3. Faster intervention on hung processes
4. Better debugging (see where agent got stuck)

### Proposed Implementation

#### Streaming Output Handler
```javascript
async spawnAgentWithStreaming(requestId, request) {
  const agentContext = {
    requestId,
    request,
    startTime: Date.now(),
    process: null,
    timeout: null,
    lastHeartbeat: Date.now(),
    outputStream: [],
    heartbeatInterval: null,
  };

  const claudeProcess = spawn('claude', ['--dangerously-skip-permissions'], {
    // ... standard config
  });

  agentContext.process = claudeProcess;
  this.activeAgents.set(requestId, agentContext);

  // Stream output in real-time
  claudeProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    agentContext.outputStream.push({
      timestamp: Date.now(),
      content: chunk,
    });
    agentContext.lastHeartbeat = Date.now();

    // Log progress (optional, configurable)
    if (process.env.LOG_AGENT_OUTPUT === 'true') {
      console.log(`[${requestId.slice(0, 8)}] ${chunk.slice(0, 80)}...`);
    }

    // Save incremental output to temp file
    this.saveIncrementalOutput(requestId, chunk);
  });

  // Heartbeat monitor
  agentContext.heartbeatInterval = setInterval(() => {
    const silentDuration = Date.now() - agentContext.lastHeartbeat;

    if (silentDuration > 45000) { // 45s no output
      console.log(`⚠️  Agent ${requestId.slice(0, 8)} silent for ${silentDuration}ms`);

      if (silentDuration > 90000) { // 90s = definitely stuck
        console.log(`💀 Agent ${requestId.slice(0, 8)} appears stuck, terminating`);
        this.killAgent(requestId, 'HEARTBEAT_TIMEOUT');
      }
    }
  }, 15000); // Check every 15s

  claudeProcess.on('close', (code) => {
    clearInterval(agentContext.heartbeatInterval);
    // ... rest of close handler
  });
}

saveIncrementalOutput(requestId, chunk) {
  const incrementalPath = join(CONFIG.swarmDir, 'logs', `${requestId}.stream.txt`);
  appendFileSync(incrementalPath, chunk);
}
```

#### Heartbeat Protocol (Agent-Side)
Add to agent prompt:
```javascript
buildAgentPromptWithHeartbeat(requestId, request) {
  return `${this.buildAgentPrompt(requestId, request)}

HEARTBEAT PROTOCOL:
For long-running tasks, emit progress markers:
  echo "[PROGRESS] Starting phase 1"
  # ... do work ...
  echo "[PROGRESS] Phase 1 complete, starting phase 2"

This helps the coordinator know you're still working.`;
}
```

### Test Method

**Test Setup:**
1. Create test tasks with different characteristics:
   - **Fast responder**: Echo immediately, then work
   - **Slow responder**: Work 60s, then respond
   - **Progressive worker**: Emit output every 20s
   - **Stuck agent**: Simulate infinite loop (sleep 999)
2. Run with standard output collection (control)
3. Run with streaming + heartbeat detection (experimental)

**Success Metrics:**
- **Stuck detection speed**: Time to detect stuck agent
  - Control: 120s (full timeout)
  - Experimental: 90s (heartbeat timeout)
- **Visibility**: Ability to see incremental progress
- **False positive rate**: Progressive workers should NOT be killed

**Test Command:**
```bash
# Create stuck agent test
cat > .swarm/requests/stuck-test.json <<'EOF'
{
  "agentRole": "test-stuck",
  "task": {
    "objective": "Run: sleep 999"
  }
}
EOF

# Create progressive worker test
cat > .swarm/requests/progressive-test.json <<'EOF'
{
  "agentRole": "test-progressive",
  "task": {
    "objective": "Run: for i in 1 2 3 4 5; do echo PROGRESS step $i; sleep 20; done"
  }
}
EOF

# Control - should timeout at 120s
AGENT_TIMEOUT_SECONDS=120 node coordinator/local-only.js &
measure_stuck_detection_time

# Experimental - should timeout at 90s (heartbeat)
node coordinator/local-only-streaming.js &
measure_stuck_detection_time
```

**Expected Outcome:**
- Stuck agent: Detected at 90s instead of 120s (25% faster)
- Progressive worker: Completes successfully with visible progress
- Fast responder: No change in behavior
- Slow responder: Gets 45s warning but completes if done by 90s

---

## Implementation Priority

Based on impact vs. complexity:

### Priority 1: Hypothesis 1 - Health Check (HIGH IMPACT, LOW COMPLEXITY)
- **Impact**: 92% reduction in wasted timeout for failed agents
- **Complexity**: ~50 lines of code
- **Risk**: Low (health check failures are safe - worst case is false positive)
- **Time to implement**: 2 hours
- **Time to test**: 1 hour

### Priority 2: Hypothesis 4 - Output Streaming (HIGH IMPACT, MEDIUM COMPLEXITY)
- **Impact**: 25% faster stuck detection, real-time visibility
- **Complexity**: ~100 lines of code, requires incremental file writes
- **Risk**: Medium (need to handle partial output correctly)
- **Time to implement**: 4 hours
- **Time to test**: 2 hours

### Priority 3: Hypothesis 3 - Progressive Timeout (MEDIUM IMPACT, MEDIUM COMPLEXITY)
- **Impact**: 40% average waste reduction, enables complex tasks
- **Complexity**: ~80 lines of code, requires heuristics tuning
- **Risk**: Medium (incorrect heuristics could kill working agents)
- **Time to implement**: 3 hours
- **Time to test**: 3 hours (need diverse task samples)

### Priority 4: Hypothesis 2 - Lazy Context Loading (MEDIUM IMPACT, HIGH COMPLEXITY)
- **Impact**: 30-50% startup time reduction
- **Complexity**: ~150 lines, requires memory system integration
- **Risk**: High (lazy loading might miss critical context)
- **Time to implement**: 6 hours
- **Time to test**: 4 hours (need to verify no information loss)

---

## Combined Implementation Strategy

The hypotheses are not mutually exclusive. A combined approach would:

1. **Phase 1** (Week 1):
   - Implement health check (Hypothesis 1)
   - Implement output streaming (Hypothesis 4)
   - Test independently
   - **Expected gain**: 92% faster failure detection + 25% faster stuck detection

2. **Phase 2** (Week 2):
   - Integrate streaming with progressive timeout (Hypothesis 3)
   - Use streaming data to inform timeout extensions
   - Test combined system
   - **Expected gain**: Above + 40% timeout efficiency improvement

3. **Phase 3** (Week 3):
   - Implement lazy context loading (Hypothesis 2)
   - Use health check to verify context loading success
   - Test end-to-end
   - **Expected gain**: All above + 30-50% startup improvement

### Combined Architecture
```javascript
class OptimizedAgentProcessManager extends AgentProcessManager {
  async spawnAgent(requestId, request) {
    // Phase 1: Health check (10s)
    const healthy = await this.healthCheck(requestId);
    if (!healthy) return this.failFast(requestId, 'HEALTH_CHECK_FAILED');

    // Phase 2: Minimal context startup
    const minimalPrompt = this.buildMinimalPrompt(requestId, request);
    const claudeProcess = this.spawnProcess(requestId, minimalPrompt);

    // Phase 3: Streaming + heartbeat monitoring
    this.setupStreamingMonitor(requestId, claudeProcess);

    // Phase 4: Progressive timeout based on streaming activity
    this.setupProgressiveTimeout(requestId, claudeProcess);

    return requestId;
  }
}
```

---

## Testing Framework

To validate all hypotheses systematically, create a test harness:

### Test Task Generator
```javascript
// test/coordinator-test-generator.js
function generateTestSuite() {
  return {
    fast_simple: {
      objective: "Echo 'done'",
      expected_duration: '<10s',
      expected_success: true,
    },
    medium_io: {
      objective: "Create 5 files with timestamps",
      expected_duration: '20-40s',
      expected_success: true,
    },
    complex_multi: {
      objective: "Read 10 files, analyze, write summary",
      expected_duration: '60-120s',
      expected_success: true,
    },
    intentional_fail: {
      objective: "Use tools without permissions",
      expected_duration: '<10s with health check, 120s without',
      expected_success: false,
    },
    stuck_infinite: {
      objective: "while true; do sleep 1; done",
      expected_duration: '90s with heartbeat, 120s without',
      expected_success: false,
    },
  };
}
```

### Automated Test Runner
```bash
#!/bin/bash
# test/run-coordinator-tests.sh

echo "Running Coordinator Improvement Tests"

# Baseline tests
echo "=== BASELINE (Current Implementation) ==="
AGENT_TIMEOUT_SECONDS=120 node coordinator/local-only.js &
COORD_PID=$!
node test/drop-test-tasks.js --suite baseline
sleep 180
kill $COORD_PID
node test/analyze-results.js --baseline > results/baseline.txt

# Hypothesis 1: Health Check
echo "=== HYPOTHESIS 1: Health Check ==="
node coordinator/local-only-health.js &
COORD_PID=$!
node test/drop-test-tasks.js --suite health-check
sleep 180
kill $COORD_PID
node test/analyze-results.js --compare baseline > results/h1-health-check.txt

# Hypothesis 2: Lazy Context
echo "=== HYPOTHESIS 2: Lazy Context ==="
CONTEXT_MODE=lazy node coordinator/local-only-lazy.js &
COORD_PID=$!
node test/drop-test-tasks.js --suite lazy-context
sleep 180
kill $COORD_PID
node test/analyze-results.js --compare baseline > results/h2-lazy-context.txt

# Hypothesis 3: Progressive Timeout
echo "=== HYPOTHESIS 3: Progressive Timeout ==="
node coordinator/local-only-progressive.js &
COORD_PID=$!
node test/drop-test-tasks.js --suite progressive-timeout
sleep 240
kill $COORD_PID
node test/analyze-results.js --compare baseline > results/h3-progressive.txt

# Hypothesis 4: Streaming
echo "=== HYPOTHESIS 4: Output Streaming ==="
LOG_AGENT_OUTPUT=true node coordinator/local-only-streaming.js &
COORD_PID=$!
node test/drop-test-tasks.js --suite streaming
sleep 180
kill $COORD_PID
node test/analyze-results.js --compare baseline > results/h4-streaming.txt

# Combined
echo "=== COMBINED IMPLEMENTATION ==="
node coordinator/local-only-optimized.js &
COORD_PID=$!
node test/drop-test-tasks.js --suite full
sleep 240
kill $COORD_PID
node test/analyze-results.js --compare baseline > results/combined.txt

echo "All tests complete. Results in results/"
```

### Metrics to Track
```javascript
// test/analyze-results.js
const metrics = {
  // Timing
  avg_success_duration: 'Average time for successful tasks',
  avg_failure_duration: 'Average time for failed tasks',
  time_to_first_output: 'Time from spawn to first stdout',

  // Efficiency
  wasted_timeout_total: 'Sum of (timeout - actual) for all failures',
  timeout_efficiency: '(actual_work_time / total_time) * 100',

  // Reliability
  success_rate: 'successful / total',
  false_positive_rate: 'Healthy agents killed',
  false_negative_rate: 'Stuck agents not detected',

  // Resource
  avg_context_bytes_loaded: 'Average context size loaded',
  context_utilization: 'Context bytes used / bytes loaded',
  max_concurrent_achieved: 'Highest concurrent agent count',
};
```

---

## Expected Results Summary

| Hypothesis | Metric | Baseline | Expected | Improvement |
|------------|--------|----------|----------|-------------|
| H1: Health Check | Time to detect failure | 120s | 10s | 92% faster |
| H1: Health Check | Wasted timeout (failures) | 120s | 10s | 92% reduction |
| H2: Lazy Context | Startup time (complex) | 20s | 10s | 50% faster |
| H2: Lazy Context | Context bytes loaded | 2000 | 800 | 60% reduction |
| H3: Progressive | Time to detect stuck | 120s | 60-90s | 25-50% faster |
| H3: Progressive | Avg timeout waste | 60s | 35s | 40% reduction |
| H4: Streaming | Stuck detection | 120s | 90s | 25% faster |
| H4: Streaming | Progress visibility | None | Real-time | 100% gain |
| **Combined** | **Overall efficiency** | **Baseline** | **2-3x better** | **100-200%** |

---

## Risks and Mitigations

### Risk 1: Health Check False Positives
**Risk**: Health check kills agents that would have succeeded.

**Mitigation**:
- Make health check lenient (10s timeout, simple operations)
- Log all health check failures for analysis
- Provide override flag: `SKIP_HEALTH_CHECK=true`

### Risk 2: Lazy Context Missing Critical Info
**Risk**: Agent starts without context it needs, fails later.

**Mitigation**:
- Define "critical" vs "optional" context in request schema
- Always inject critical context, lazy-load optional
- Track context queries to learn which topics are essential

### Risk 3: Progressive Timeout Kills Long Tasks
**Risk**: Heuristics incorrectly classify complex task as stuck.

**Mitigation**:
- Conservative extension criteria (if any output in 30s, extend)
- Max timeout remains high (240s)
- Emit warnings before killing (45s silent = warning, 90s = kill)

### Risk 4: Streaming Overhead
**Risk**: Writing incremental output to disk slows agent.

**Mitigation**:
- Use append operations (efficient)
- Make streaming optional: `ENABLE_STREAMING=true`
- Buffer writes (flush every 5s or 1KB)

---

## Conclusion

The current coordinator startup routine is reliable but inefficient. Evidence shows:
- 36% of agents fail immediately with zero output
- Failed agents waste 110-590 seconds of timeout
- No visibility into agent progress during execution
- Fixed timeout doesn't adapt to task complexity

Four testable hypotheses address these issues:
1. **Health check**: 92% faster failure detection
2. **Lazy context**: 50% faster startup for complex tasks
3. **Progressive timeout**: 40% reduction in average timeout waste
4. **Streaming output**: 25% faster stuck detection + real-time visibility

Combined implementation could improve coordinator efficiency by 100-200% while maintaining or improving reliability.

All hypotheses include specific test methods, expected outcomes, and risk mitigations. Implementation can proceed incrementally with measurable validation at each step.

---

## Next Steps

1. **Immediate** (Week 1):
   - Implement health check prototype (Hypothesis 1)
   - Run 20 test tasks (10 should pass, 10 should fail)
   - Measure failure detection time
   - If successful (>90% waste reduction), merge to main coordinator

2. **Short-term** (Week 2):
   - Implement streaming + heartbeat (Hypothesis 4)
   - Test with long-running and stuck agents
   - Validate false positive rate <5%
   - Integrate with health check implementation

3. **Medium-term** (Week 3-4):
   - Implement progressive timeout (Hypothesis 3)
   - Tune heuristics based on real task data
   - A/B test against baseline
   - Document optimal timeout configurations

4. **Long-term** (Month 2):
   - Design lazy context system (Hypothesis 2)
   - Integrate with memory framework
   - Test with agents in production
   - Measure context efficiency gains

---

**Document Status**: Research Complete, Ready for Implementation
**Next Review**: After Hypothesis 1 prototype testing
