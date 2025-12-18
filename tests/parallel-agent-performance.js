#!/usr/bin/env node
/**
 * Parallel Agent Performance Test
 *
 * Tests:
 * 1. Spawn timing - how fast do agents start?
 * 2. True parallelism - do 3 tasks run concurrently?
 * 3. Model differences - haiku vs sonnet performance
 * 4. State isolation - do agents share state?
 *
 * Outputs empirical measurements only.
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const SWARM_DIR = '.swarm';
const REQUESTS_DIR = join(SWARM_DIR, 'requests');
const RESULTS_DIR = join(SWARM_DIR, 'results');
const LOGS_DIR = join(SWARM_DIR, 'logs');

// ============================================================================
// Test Utilities
// ============================================================================

function timestamp() {
  return Date.now();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateRequestId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createRequestFile(requestId, task, agentRole = 'worker') {
  const request = {
    requestId,
    agentRole,
    task,
    timestamp: new Date().toISOString(),
  };

  const requestFile = join(REQUESTS_DIR, `${requestId}.json`);
  writeFileSync(requestFile, JSON.stringify(request, null, 2));

  return requestFile;
}

async function waitForResult(requestId, timeoutMs = 120000) {
  const startTime = timestamp();
  const resultFile = join(RESULTS_DIR, `${requestId}.json`);

  while (timestamp() - startTime < timeoutMs) {
    if (existsSync(resultFile)) {
      const result = JSON.parse(readFileSync(resultFile, 'utf-8'));
      return {
        ...result,
        waitTimeMs: timestamp() - startTime,
      };
    }
    await sleep(100);
  }

  throw new Error(`Timeout waiting for result: ${requestId}`);
}

function cleanup() {
  // Clean up old test files
  const patterns = ['perf-test-', 'parallel-test-', 'isolation-test-', 'model-test-'];

  for (const dir of [REQUESTS_DIR, RESULTS_DIR, LOGS_DIR]) {
    if (existsSync(dir)) {
      const files = readdirSync(dir);
      for (const file of files) {
        if (patterns.some(p => file.includes(p))) {
          try {
            unlinkSync(join(dir, file));
          } catch (e) {
            // Ignore
          }
        }
      }
    }
  }
}

// ============================================================================
// Test 1: Spawn Timing
// ============================================================================

async function testSpawnTiming() {
  console.log('\n=== TEST 1: Spawn Timing ===\n');

  const iterations = 5;
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const requestId = generateRequestId(`perf-test-spawn-${i}`);
    const startTime = timestamp();

    // Simple task: just echo something
    createRequestFile(requestId, {
      objective: 'Echo the current timestamp in milliseconds using date +%s%3N',
      requirements: ['Use bash command', 'Output only the number'],
      context: {}
    });

    try {
      const result = await waitForResult(requestId, 60000);
      const endTime = timestamp();

      const totalTime = endTime - startTime;
      const healthCheckMs = result.stats?.healthCheckMs || 0;
      const startupLatencyMs = result.stats?.startupLatencyMs || 0;
      const actualDurationMs = result.stats?.actualDurationMs || result.durationMs;

      results.push({
        requestId,
        totalTime,
        healthCheckMs,
        startupLatencyMs,
        actualDurationMs,
        success: result.status === 'success',
      });

      console.log(`Spawn ${i + 1}/${iterations}:`);
      console.log(`  Total time: ${totalTime}ms`);
      console.log(`  Health check: ${healthCheckMs}ms`);
      console.log(`  Startup latency: ${startupLatencyMs}ms`);
      console.log(`  Actual duration: ${actualDurationMs}ms`);
      console.log(`  Success: ${result.status === 'success'}`);

      // Wait between spawns to avoid interference
      await sleep(2000);
    } catch (error) {
      console.log(`Spawn ${i + 1}/${iterations}: FAILED - ${error.message}`);
      results.push({
        requestId,
        error: error.message,
        success: false,
      });
    }
  }

  // Calculate statistics
  const successful = results.filter(r => r.success);
  if (successful.length > 0) {
    const avgTotal = successful.reduce((sum, r) => sum + r.totalTime, 0) / successful.length;
    const avgHealth = successful.reduce((sum, r) => sum + r.healthCheckMs, 0) / successful.length;
    const avgStartup = successful.reduce((sum, r) => sum + r.startupLatencyMs, 0) / successful.length;
    const avgActual = successful.reduce((sum, r) => sum + r.actualDurationMs, 0) / successful.length;

    console.log('\n--- Spawn Timing Statistics ---');
    console.log(`Successful: ${successful.length}/${iterations}`);
    console.log(`Average total time: ${avgTotal.toFixed(0)}ms`);
    console.log(`Average health check: ${avgHealth.toFixed(0)}ms`);
    console.log(`Average startup latency: ${avgStartup.toFixed(0)}ms`);
    console.log(`Average execution: ${avgActual.toFixed(0)}ms`);
  }

  return results;
}

// ============================================================================
// Test 2: Parallel Execution
// ============================================================================

async function testParallelExecution() {
  console.log('\n=== TEST 2: Parallel Execution (3 agents) ===\n');

  const numAgents = 3;
  const requestIds = [];
  const spawnTimes = [];

  console.log('Spawning 3 agents simultaneously...\n');

  const startTime = timestamp();

  // Spawn all 3 agents at once
  for (let i = 0; i < numAgents; i++) {
    const requestId = generateRequestId(`parallel-test-${i}`);
    requestIds.push(requestId);

    const taskStartTime = timestamp();
    spawnTimes.push(taskStartTime);

    // Each agent has a unique task that takes some time
    createRequestFile(requestId, {
      objective: `Count from 1 to ${5 + i} with 1 second delay between each number. Agent ${i + 1}.`,
      requirements: [
        'Use a bash loop with sleep 1 between iterations',
        `Output "Agent ${i + 1}: N" for each number`,
        'Do NOT use any shared files or state'
      ],
      context: {
        agentId: i + 1,
        expectedDuration: `${5 + i} seconds`,
      }
    });

    console.log(`Agent ${i + 1} spawned at +${taskStartTime - startTime}ms (ID: ${requestId.slice(0, 12)}...)`);
  }

  console.log('\nWaiting for all agents to complete...\n');

  // Wait for all results
  const results = await Promise.all(
    requestIds.map(async (requestId, i) => {
      try {
        const result = await waitForResult(requestId, 60000);
        return {
          agentId: i + 1,
          requestId,
          result,
        };
      } catch (error) {
        return {
          agentId: i + 1,
          requestId,
          error: error.message,
        };
      }
    })
  );

  const endTime = timestamp();
  const totalTime = endTime - startTime;

  // Analyze results
  console.log('--- Results ---\n');

  let minStart = Infinity;
  let maxEnd = 0;

  for (const { agentId, requestId, result, error } of results) {
    if (error) {
      console.log(`Agent ${agentId}: FAILED - ${error}`);
      continue;
    }

    const healthCheckMs = result.stats?.healthCheckMs || 0;
    const startupLatencyMs = result.stats?.startupLatencyMs || 0;
    const actualDurationMs = result.stats?.actualDurationMs || result.durationMs;

    console.log(`Agent ${agentId}:`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Health check: ${healthCheckMs}ms`);
    console.log(`  Startup latency: ${startupLatencyMs}ms`);
    console.log(`  Execution time: ${actualDurationMs}ms`);
    console.log(`  Total time: ${result.waitTimeMs}ms`);

    // Track overlap
    const agentStart = spawnTimes[agentId - 1];
    const agentEnd = agentStart + result.waitTimeMs;

    minStart = Math.min(minStart, agentStart);
    maxEnd = Math.max(maxEnd, agentEnd);
  }

  console.log('\n--- Parallelism Analysis ---');
  console.log(`Wall clock time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);
  console.log(`Execution span: ${maxEnd - minStart}ms (${((maxEnd - minStart) / 1000).toFixed(1)}s)`);

  // Calculate theoretical sequential time
  const successfulResults = results.filter(r => r.result && !r.error);
  if (successfulResults.length > 0) {
    const sequentialTime = successfulResults.reduce((sum, r) => sum + (r.result.stats?.actualDurationMs || r.result.durationMs), 0);
    const parallelSpeedup = sequentialTime / totalTime;

    console.log(`Sum of individual execution times: ${sequentialTime}ms (${(sequentialTime / 1000).toFixed(1)}s)`);
    console.log(`Parallel speedup: ${parallelSpeedup.toFixed(2)}x`);
    console.log(`Efficiency: ${((parallelSpeedup / numAgents) * 100).toFixed(1)}%`);

    if (parallelSpeedup > 1.5) {
      console.log(`✓ Tasks ran in parallel (speedup > 1.5x)`);
    } else {
      console.log(`✗ Tasks may have run sequentially or with high overhead`);
    }
  }

  return results;
}

// ============================================================================
// Test 3: Model Comparison (requires model parameter support)
// ============================================================================

async function testModelComparison() {
  console.log('\n=== TEST 3: Model Comparison ===\n');
  console.log('Note: This test assumes the coordinator supports model selection.');
  console.log('If not implemented, results will use default model.\n');

  const models = [
    { name: 'default', config: {} },
    // Note: Model selection may not be supported yet
    // { name: 'haiku', config: { model: 'claude-3-haiku-20240307' } },
    // { name: 'sonnet', config: { model: 'claude-3-5-sonnet-20241022' } },
  ];

  const results = [];

  for (const { name, config } of models) {
    console.log(`Testing with model: ${name}`);

    const requestId = generateRequestId(`model-test-${name}`);
    const startTime = timestamp();

    createRequestFile(requestId, {
      objective: 'Output the string "Hello from agent" exactly once',
      requirements: ['Output only the required string'],
      context: { ...config }
    });

    try {
      const result = await waitForResult(requestId, 60000);
      const endTime = timestamp();

      results.push({
        model: name,
        totalTime: endTime - startTime,
        healthCheckMs: result.stats?.healthCheckMs || 0,
        startupLatencyMs: result.stats?.startupLatencyMs || 0,
        actualDurationMs: result.stats?.actualDurationMs || result.durationMs,
        success: result.status === 'success',
      });

      console.log(`  Total time: ${endTime - startTime}ms`);
      console.log(`  Health check: ${result.stats?.healthCheckMs || 0}ms`);
      console.log(`  Startup: ${result.stats?.startupLatencyMs || 0}ms`);
      console.log(`  Execution: ${result.stats?.actualDurationMs || result.durationMs}ms\n`);

      await sleep(2000);
    } catch (error) {
      console.log(`  FAILED: ${error.message}\n`);
      results.push({
        model: name,
        error: error.message,
        success: false,
      });
    }
  }

  console.log('--- Model Comparison Summary ---');
  console.log('Cannot determine model performance differences without model selection support.');
  console.log('Measurements show default model performance only.\n');

  return results;
}

// ============================================================================
// Test 4: State Isolation
// ============================================================================

async function testStateIsolation() {
  console.log('\n=== TEST 4: State Isolation ===\n');

  const testFile = join(SWARM_DIR, 'isolation-test.txt');

  // Clean up test file
  if (existsSync(testFile)) {
    unlinkSync(testFile);
  }

  console.log('Spawning 2 agents that try to write to the same file...\n');

  const requestIds = [];
  const startTime = timestamp();

  // Spawn two agents that write to same file
  for (let i = 0; i < 2; i++) {
    const requestId = generateRequestId(`isolation-test-${i}`);
    requestIds.push(requestId);

    createRequestFile(requestId, {
      objective: `Write "Agent ${i + 1} was here at TIMESTAMP" to ${testFile}`,
      requirements: [
        `Use bash to write to ${testFile}`,
        'Use date +%s%3N for timestamp',
        'Append to file, do not overwrite'
      ],
      context: {
        agentId: i + 1,
      }
    });

    console.log(`Agent ${i + 1} spawned`);
  }

  // Wait for both to complete
  const results = await Promise.all(
    requestIds.map(async (requestId, i) => {
      try {
        return await waitForResult(requestId, 60000);
      } catch (error) {
        return { error: error.message, agentId: i + 1 };
      }
    })
  );

  const endTime = timestamp();

  console.log('\n--- Results ---\n');

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.error) {
      console.log(`Agent ${i + 1}: FAILED - ${result.error}`);
    } else {
      console.log(`Agent ${i + 1}: ${result.status} (${result.durationMs}ms)`);
    }
  }

  // Check file contents
  if (existsSync(testFile)) {
    const contents = readFileSync(testFile, 'utf-8');
    const lines = contents.trim().split('\n');

    console.log('\n--- File Contents ---');
    console.log(contents);
    console.log('\n--- Isolation Analysis ---');
    console.log(`Number of writes: ${lines.length}`);

    if (lines.length === 2) {
      console.log('✓ Both agents successfully wrote to the file');
      console.log('✓ No obvious race conditions detected');
    } else if (lines.length > 2) {
      console.log('⚠ More than 2 writes detected - possible race condition');
    } else {
      console.log('✗ Only one write detected - agents may not be truly isolated');
    }

    // Check for state isolation by looking at timestamps
    const timestamps = lines.map(line => {
      const match = line.match(/at (\d+)/);
      return match ? parseInt(match[1]) : null;
    }).filter(t => t !== null);

    if (timestamps.length === 2) {
      const timeDiff = Math.abs(timestamps[1] - timestamps[0]);
      console.log(`Time between writes: ${timeDiff}ms`);

      if (timeDiff < 1000) {
        console.log('✓ Agents wrote within 1 second - likely parallel execution');
      } else {
        console.log('⚠ Agents wrote >1 second apart - may be sequential');
      }
    }
  } else {
    console.log('✗ Test file was not created');
  }

  return results;
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      PARALLEL AGENT PERFORMANCE TEST                      ║');
  console.log('║      Empirical measurements only                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Ensure coordinator is running
  console.log('\nChecking for coordinator...');

  // Check if coordinator is running by looking for a way to verify
  const coordinatorRunning = existsSync(SWARM_DIR) && existsSync(REQUESTS_DIR) && existsSync(RESULTS_DIR);

  if (!coordinatorRunning) {
    console.error('\n❌ ERROR: Coordinator does not appear to be running.');
    console.error('Start the coordinator first with: node coordinator/local-only-optimized.js');
    process.exit(1);
  }

  console.log('✓ Coordinator appears to be running\n');

  // Cleanup old test files
  cleanup();

  const allResults = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  try {
    // Test 1: Spawn timing
    allResults.tests.spawnTiming = await testSpawnTiming();
    await sleep(3000);

    // Test 2: Parallel execution
    allResults.tests.parallelExecution = await testParallelExecution();
    await sleep(3000);

    // Test 3: Model comparison
    allResults.tests.modelComparison = await testModelComparison();
    await sleep(3000);

    // Test 4: State isolation
    allResults.tests.stateIsolation = await testStateIsolation();

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    allResults.error = error.message;
  }

  // Save results
  const resultsFile = join(SWARM_DIR, 'parallel-performance-results.json');
  writeFileSync(resultsFile, JSON.stringify(allResults, null, 2));

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      TEST COMPLETE                                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nResults saved to: ${resultsFile}`);
  console.log('\nNOTE: All measurements are empirical observations.');
  console.log('Cannot make claims about performance without baseline comparison.');
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
