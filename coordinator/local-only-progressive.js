#!/usr/bin/env node
/**
 * Local-Only Claude Swarm Coordinator with Progressive Timeout Adaptation
 *
 * HYPOTHESIS 3 IMPLEMENTATION:
 * Progressive timeout system that starts at 60s and extends based on agent activity.
 *
 * Key features:
 * - 60s initial timeout (faster failure detection for stuck agents)
 * - Activity-based extensions up to 240s maximum
 * - Task complexity heuristics for initial timeout estimation
 * - Output monitoring to detect progress and extend timeouts
 *
 * Expected improvements:
 * - 50% faster failure detection for stuck agents (60s vs 120s)
 * - 40% reduction in average timeout waste
 * - Complex tasks get more time when showing progress
 */

import { spawn } from 'child_process';
import { watch, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync, renameSync, appendFileSync } from 'fs';
import { join, basename } from 'path';
import { EventEmitter } from 'events';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  maxConcurrentAgents: parseInt(process.env.MAX_CONCURRENT_AGENTS || '5'),
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '1000'),
  swarmDir: process.env.SWARM_DIR || '.swarm',
  // Progressive timeout config
  initialTimeoutMs: parseInt(process.env.INITIAL_TIMEOUT_MS || '60000'), // Start with 60s
  maxTimeoutMs: parseInt(process.env.MAX_TIMEOUT_MS || '240000'), // Max 240s
  timeoutExtensionMs: parseInt(process.env.TIMEOUT_EXTENSION_MS || '60000'), // Extend by 60s
  activityWindowMs: parseInt(process.env.ACTIVITY_WINDOW_MS || '30000'), // Check activity in last 30s
  minOutputBurstForExtension: parseInt(process.env.MIN_OUTPUT_BURSTS || '2'), // Need 2+ output bursts to extend
  progressCheckIntervalMs: parseInt(process.env.PROGRESS_CHECK_INTERVAL_MS || '15000'), // Check every 15s
  enableProgressLog: process.env.LOG_PROGRESS === 'true',
  enableIncrementalFiles: process.env.ENABLE_INCREMENTAL_FILES !== 'false',
};

// ============================================================================
// Task Complexity Estimator
// ============================================================================

function estimateTaskComplexity(request) {
  const task = request.task || {};
  const objective = (task.objective || '').toLowerCase();
  const requirementsCount = (task.requirements || []).length;
  const contextSize = JSON.stringify(task.context || {}).length;

  // Complexity indicators
  const indicators = {
    hasFileOps: /read|write|create|modify|edit|save|delete/i.test(objective),
    hasMultipleReqs: requirementsCount > 3,
    hasChildSpawning: /spawn|coordinate|delegate|parallel|multi-agent/i.test(objective),
    hasResearch: /research|analyze|investigate|explore|search/i.test(objective),
    hasImplementation: /implement|create|build|develop|code/i.test(objective),
    largeContext: contextSize > 1000,
    hasMultiStep: /then|after|next|finally|step|phase/i.test(objective),
    hasTestOps: /test|verify|validate|check|run tests/i.test(objective),
  };

  // Score complexity
  let score = 0;
  if (indicators.hasChildSpawning) score += 4; // Coordination is most complex
  if (indicators.hasResearch) score += 3;
  if (indicators.hasImplementation) score += 3;
  if (indicators.hasMultiStep) score += 2;
  if (indicators.hasFileOps) score += 2;
  if (indicators.hasMultipleReqs) score += 2;
  if (indicators.hasTestOps) score += 2;
  if (indicators.largeContext) score += 1;

  // Determine complexity level and initial timeout
  let complexity, initialTimeout;
  if (score >= 6) {
    complexity = 'complex';
    initialTimeout = 180000; // 180s for complex tasks
  } else if (score >= 3) {
    complexity = 'moderate';
    initialTimeout = 120000; // 120s for moderate tasks
  } else {
    complexity = 'simple';
    initialTimeout = CONFIG.initialTimeoutMs; // 60s for simple tasks
  }

  return {
    complexity,
    initialTimeout,
    score,
    indicators,
    maxTimeout: CONFIG.maxTimeoutMs,
  };
}

// ============================================================================
// Agent Process Manager with Progressive Timeout
// ============================================================================

class AgentProcessManager extends EventEmitter {
  constructor() {
    super();
    this.activeAgents = new Map();
    this.completedCount = 0;
    this.failedCount = 0;
    this.timeoutExtensions = 0;
    this.earlyTimeouts = 0;
  }

  get activeCount() {
    return this.activeAgents.size;
  }

  canSpawn() {
    return this.activeCount < CONFIG.maxConcurrentAgents;
  }

  async spawnAgent(requestId, request) {
    if (!this.canSpawn()) {
      console.log(`  Queue full (${this.activeCount}/${CONFIG.maxConcurrentAgents}), will retry...`);
      return null;
    }

    // Estimate task complexity
    const complexity = estimateTaskComplexity(request);

    const agentContext = {
      requestId,
      request,
      startTime: Date.now(),
      process: null,
      timeout: null,
      progressInterval: null,
      // Progressive timeout state
      currentTimeoutMs: complexity.initialTimeout,
      maxTimeoutMs: complexity.maxTimeout,
      lastOutputTime: Date.now(),
      outputCheckpoints: [],
      totalOutputBytes: 0,
      extensionsApplied: 0,
      complexity,
    };

    const prompt = this.buildAgentPrompt(requestId, request);

    console.log(`  Spawning agent: ${request.agentRole || 'worker'} (${requestId.slice(0, 8)}...)`);
    console.log(`   Complexity: ${complexity.complexity} (score: ${complexity.score}), initial timeout: ${complexity.initialTimeout / 1000}s`);

    const claudeProcess = spawn('claude', ['--dangerously-skip-permissions'], {
      env: {
        ...process.env,
        SWARM_REQUEST_ID: requestId,
        SWARM_PARENT_ID: request.parentRequestId || '',
        SWARM_AGENT_ROLE: request.agentRole || 'general',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    agentContext.process = claudeProcess;
    this.activeAgents.set(requestId, agentContext);

    // Initialize incremental output file
    if (CONFIG.enableIncrementalFiles) {
      this.initIncrementalFile(requestId, request, complexity);
    }

    claudeProcess.stdin.write(prompt);
    claudeProcess.stdin.end();

    // Stream stdout and track activity
    let stdout = '';
    claudeProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;

      // Update activity tracking
      agentContext.lastOutputTime = Date.now();
      agentContext.outputCheckpoints.push({
        time: Date.now(),
        bytes: data.length,
      });
      agentContext.totalOutputBytes += data.length;

      if (CONFIG.enableProgressLog) {
        const preview = chunk.slice(0, 80).replace(/\n/g, '\\n');
        console.log(`   [${requestId.slice(0, 8)}] ${preview}${chunk.length > 80 ? '...' : ''}`);
      }

      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(requestId, chunk);
      }

      // Check if we should extend timeout based on activity
      this.checkForTimeoutExtension(requestId, agentContext);
    });

    let stderr = '';
    claudeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      agentContext.lastOutputTime = Date.now();

      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(requestId, `[STDERR] ${data.toString()}`);
      }
    });

    // Set up progress monitoring
    agentContext.progressInterval = setInterval(() => {
      this.monitorProgress(requestId, agentContext);
    }, CONFIG.progressCheckIntervalMs);

    // Set initial progressive timeout
    this.setProgressiveTimeout(agentContext);

    // Handle completion
    claudeProcess.on('close', (code) => {
      clearTimeout(agentContext.timeout);
      clearInterval(agentContext.progressInterval);
      this.activeAgents.delete(requestId);

      const duration = Date.now() - agentContext.startTime;
      const timeoutStats = this.calculateTimeoutStats(agentContext, duration);

      if (code === 0) {
        this.completedCount++;
        this.saveResult(requestId, 'success', stdout, duration, code, null, timeoutStats);
        console.log(`  Agent ${requestId.slice(0, 8)} completed in ${(duration / 1000).toFixed(1)}s (${agentContext.extensionsApplied} extensions, ${timeoutStats.wastedTimeMs}ms timeout waste)`);
      } else {
        this.failedCount++;
        this.saveResult(requestId, 'failed', stderr || stdout, duration, code, null, timeoutStats);
        console.log(`  Agent ${requestId.slice(0, 8)} failed (exit ${code}) in ${(duration / 1000).toFixed(1)}s`);
      }

      if (CONFIG.enableIncrementalFiles) {
        this.finalizeIncrementalFile(requestId, code, duration, timeoutStats);
      }

      this.emit('agentComplete', { requestId, code, duration, timeoutStats });
    });

    claudeProcess.on('error', (error) => {
      clearTimeout(agentContext.timeout);
      clearInterval(agentContext.progressInterval);
      this.activeAgents.delete(requestId);
      this.failedCount++;
      this.saveResult(requestId, 'failed', error.message, Date.now() - agentContext.startTime, -1);
      console.log(`  Agent ${requestId.slice(0, 8)} error: ${error.message}`);
      this.emit('agentError', { requestId, error });
    });

    return requestId;
  }

  setProgressiveTimeout(agentContext) {
    clearTimeout(agentContext.timeout);

    const elapsed = Date.now() - agentContext.startTime;
    const remainingTime = Math.max(0, agentContext.currentTimeoutMs - elapsed);

    agentContext.timeout = setTimeout(() => {
      const finalElapsed = Date.now() - agentContext.startTime;
      console.log(`  Agent ${agentContext.requestId.slice(0, 8)} timed out after ${(finalElapsed / 1000).toFixed(1)}s (${agentContext.extensionsApplied} extensions applied)`);

      if (agentContext.extensionsApplied === 0) {
        this.earlyTimeouts++;
      }

      this.killAgent(agentContext.requestId, 'PROGRESSIVE_TIMEOUT');
    }, remainingTime);
  }

  showsProgress(agentContext) {
    const timeSinceLastOutput = Date.now() - agentContext.lastOutputTime;
    const recentCheckpoints = agentContext.outputCheckpoints.filter(
      c => Date.now() - c.time < CONFIG.activityWindowMs
    );

    // Progress indicators:
    // 1. Output in the activity window (last 30s by default)
    // 2. Multiple output bursts (not just one initial response)
    const hasRecentOutput = timeSinceLastOutput < CONFIG.activityWindowMs;
    const hasMultipleBursts = recentCheckpoints.length >= CONFIG.minOutputBurstForExtension;

    return hasRecentOutput && hasMultipleBursts;
  }

  checkForTimeoutExtension(requestId, agentContext) {
    const elapsed = Date.now() - agentContext.startTime;
    const timeUntilTimeout = agentContext.currentTimeoutMs - elapsed;

    // Only extend if we're getting close to timeout (within 30s)
    if (timeUntilTimeout > 30000) return;

    // Check if we can extend
    if (elapsed >= agentContext.maxTimeoutMs) {
      if (CONFIG.enableProgressLog) {
        console.log(`   [${requestId.slice(0, 8)}] Max timeout reached (${agentContext.maxTimeoutMs}ms)`);
      }
      return;
    }

    // Check if agent is showing progress
    if (this.showsProgress(agentContext)) {
      this.extendTimeout(agentContext);
    }
  }

  extendTimeout(agentContext) {
    const elapsed = Date.now() - agentContext.startTime;
    const newTimeout = Math.min(
      agentContext.currentTimeoutMs + CONFIG.timeoutExtensionMs,
      agentContext.maxTimeoutMs
    );

    if (newTimeout > agentContext.currentTimeoutMs) {
      agentContext.currentTimeoutMs = newTimeout;
      agentContext.extensionsApplied++;
      this.timeoutExtensions++;

      console.log(`   Extending timeout for ${agentContext.requestId.slice(0, 8)} to ${newTimeout / 1000}s (showing progress, extension #${agentContext.extensionsApplied})`);

      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(
          agentContext.requestId,
          `\n[COORDINATOR] Timeout extended to ${newTimeout / 1000}s at ${elapsed}ms elapsed (extension #${agentContext.extensionsApplied})\n`
        );
      }

      // Reset the timeout
      this.setProgressiveTimeout(agentContext);

      this.emit('timeoutExtended', {
        requestId: agentContext.requestId,
        newTimeout,
        extensionsApplied: agentContext.extensionsApplied,
      });
    }
  }

  monitorProgress(requestId, agentContext) {
    const elapsed = Date.now() - agentContext.startTime;
    const timeSinceOutput = Date.now() - agentContext.lastOutputTime;
    const timeRemaining = agentContext.currentTimeoutMs - elapsed;

    if (CONFIG.enableProgressLog) {
      const status = timeSinceOutput < 15000 ? 'active' : timeSinceOutput < 30000 ? 'slowing' : 'silent';
      console.log(`   [${requestId.slice(0, 8)}] Progress: ${elapsed}ms elapsed, ${timeRemaining}ms remaining, ${status}, ${agentContext.totalOutputBytes} bytes`);
    }

    // Warn if agent is going silent near timeout
    if (timeSinceOutput > 30000 && timeRemaining < 45000 && timeRemaining > 0) {
      console.log(`   Agent ${requestId.slice(0, 8)} silent for ${(timeSinceOutput / 1000).toFixed(0)}s with ${(timeRemaining / 1000).toFixed(0)}s remaining`);

      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(
          requestId,
          `\n[COORDINATOR WARNING] Agent silent for ${(timeSinceOutput / 1000).toFixed(0)}s with ${(timeRemaining / 1000).toFixed(0)}s remaining\n`
        );
      }
    }
  }

  calculateTimeoutStats(agentContext, actualDuration) {
    return {
      complexity: agentContext.complexity.complexity,
      complexityScore: agentContext.complexity.score,
      initialTimeoutMs: agentContext.complexity.initialTimeout,
      finalTimeoutMs: agentContext.currentTimeoutMs,
      extensionsApplied: agentContext.extensionsApplied,
      actualDurationMs: actualDuration,
      wastedTimeMs: agentContext.currentTimeoutMs - actualDuration,
      outputBursts: agentContext.outputCheckpoints.length,
      totalOutputBytes: agentContext.totalOutputBytes,
      timeToFirstOutputMs: agentContext.outputCheckpoints.length > 0
        ? agentContext.outputCheckpoints[0].time - agentContext.startTime
        : null,
    };
  }

  initIncrementalFile(requestId, request, complexity) {
    const logsDir = join(CONFIG.swarmDir, 'logs');
    mkdirSync(logsDir, { recursive: true });

    const streamFile = join(logsDir, `${requestId}.stream.txt`);
    const header = `=== Progressive Timeout Agent Log ===
Request ID: ${requestId}
Role: ${request.agentRole || 'worker'}
Started: ${new Date().toISOString()}
Complexity: ${complexity.complexity} (score: ${complexity.score})
Initial Timeout: ${complexity.initialTimeout}ms
Max Timeout: ${complexity.maxTimeout}ms
=========================================

`;
    writeFileSync(streamFile, header);
  }

  appendIncrementalOutput(requestId, content) {
    try {
      const streamFile = join(CONFIG.swarmDir, 'logs', `${requestId}.stream.txt`);
      appendFileSync(streamFile, content);
    } catch (error) {
      // Ignore write errors
    }
  }

  finalizeIncrementalFile(requestId, exitCode, duration, timeoutStats) {
    try {
      const streamFile = join(CONFIG.swarmDir, 'logs', `${requestId}.stream.txt`);
      const footer = `
=========================================
Completed: ${new Date().toISOString()}
Exit Code: ${exitCode}
Duration: ${duration}ms
Extensions Applied: ${timeoutStats.extensionsApplied}
Final Timeout: ${timeoutStats.finalTimeoutMs}ms
Timeout Waste: ${timeoutStats.wastedTimeMs}ms
=========================================
`;
      appendFileSync(streamFile, footer);
    } catch (error) {
      // Ignore errors
    }
  }

  buildAgentPrompt(requestId, request) {
    const task = request.task || {};
    const swarmDir = CONFIG.swarmDir;

    return `You are Agent "${request.agentRole || 'worker'}" in a multi-agent swarm.

REQUEST ID: ${requestId}
PARENT: ${request.parentRequestId || 'none (you are root)'}

TASK OBJECTIVE:
${task.objective || 'No objective specified'}

CONTEXT:
${JSON.stringify(task.context || {}, null, 2)}

REQUIREMENTS:
${(task.requirements || []).map(r => `  ${r}`).join('\n') || '  Complete the task'}

INSTRUCTIONS:

1. Complete the task described above
2. Be concise but thorough
3. If you need to spawn a child agent, create a JSON file in ${swarmDir}/requests/

To spawn a child agent:
cat > ${swarmDir}/requests/child-$(date +%s).json << 'EOF'
{
  "agentRole": "specialist-type",
  "parentRequestId": "${requestId}",
  "task": {
    "objective": "What the child should do",
    "context": {},
    "requirements": ["requirement 1"]
  }
}
EOF

Now complete your assigned task:`;
  }

  killAgent(requestId, reason) {
    const agent = this.activeAgents.get(requestId);
    if (agent && agent.process) {
      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(requestId, `\n[COORDINATOR] Killing agent: ${reason}\n`);
      }
      agent.process.kill('SIGTERM');
      this.emit('agentKilled', { requestId, reason });
    }
  }

  saveResult(requestId, status, output, durationMs, exitCode = 0, failureReason = null, timeoutStats = null) {
    const resultsDir = join(CONFIG.swarmDir, 'results');
    mkdirSync(resultsDir, { recursive: true });

    const result = {
      requestId,
      status,
      output: output.slice(0, 50000),
      durationMs,
      exitCode,
      failureReason,
      timeoutStats,
      completedAt: new Date().toISOString(),
      coordinator: 'local-only-progressive',
    };

    const resultFile = join(resultsDir, `${requestId}.json`);
    writeFileSync(resultFile, JSON.stringify(result, null, 2));
  }

  getStatus() {
    return {
      active: this.activeCount,
      completed: this.completedCount,
      failed: this.failedCount,
      timeoutExtensions: this.timeoutExtensions,
      earlyTimeouts: this.earlyTimeouts,
      maxConcurrent: CONFIG.maxConcurrentAgents,
      agents: Array.from(this.activeAgents.entries()).map(([id, ctx]) => ({
        requestId: id,
        role: ctx.request.agentRole,
        runningMs: Date.now() - ctx.startTime,
        currentTimeoutMs: ctx.currentTimeoutMs,
        timeRemainingMs: ctx.currentTimeoutMs - (Date.now() - ctx.startTime),
        extensionsApplied: ctx.extensionsApplied,
        outputBytes: ctx.totalOutputBytes,
        complexity: ctx.complexity.complexity,
      })),
    };
  }
}

// ============================================================================
// Local Request Watcher
// ============================================================================

class LocalRequestWatcher {
  constructor(processManager) {
    this.processManager = processManager;
    this.requestsDir = join(CONFIG.swarmDir, 'requests');
    this.processingDir = join(CONFIG.swarmDir, 'processing');
    this.watcher = null;
    this.pollInterval = null;
  }

  start() {
    mkdirSync(CONFIG.swarmDir, { recursive: true });
    mkdirSync(this.requestsDir, { recursive: true });
    mkdirSync(this.processingDir, { recursive: true });
    mkdirSync(join(CONFIG.swarmDir, 'results'), { recursive: true });
    mkdirSync(join(CONFIG.swarmDir, 'logs'), { recursive: true });

    console.log(`  Watching: ${this.requestsDir}`);

    this.processExistingFiles();

    try {
      this.watcher = watch(this.requestsDir, (eventType, filename) => {
        if (filename && filename.endsWith('.json')) {
          setTimeout(() => this.processFile(join(this.requestsDir, filename)), 100);
        }
      });
    } catch (err) {
      console.log('  File watcher not available, using polling');
    }

    this.pollInterval = setInterval(() => {
      this.processExistingFiles();
    }, CONFIG.pollIntervalMs);
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  processExistingFiles() {
    try {
      const files = readdirSync(this.requestsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          this.processFile(join(this.requestsDir, file));
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }
  }

  async processFile(filePath) {
    try {
      if (!existsSync(filePath)) return;

      const filename = basename(filePath);
      const content = readFileSync(filePath, 'utf-8');

      let request;
      try {
        request = JSON.parse(content);
      } catch (parseError) {
        console.log(`  Invalid JSON in ${filename}, skipping`);
        unlinkSync(filePath);
        return;
      }

      const requestId = request.requestId || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const processingPath = join(this.processingDir, filename);
      try {
        renameSync(filePath, processingPath);
      } catch (moveError) {
        return;
      }

      console.log(`  Request: ${requestId.slice(0, 8)} (${request.agentRole || 'worker'})`);

      const spawned = await this.processManager.spawnAgent(requestId, { ...request, requestId });

      if (spawned === null) {
        setTimeout(() => {
          try {
            renameSync(processingPath, filePath);
          } catch (e) {}
        }, 2000);
      } else {
        try {
          unlinkSync(processingPath);
        } catch (e) {}
      }

    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  console.log('');
  console.log('+-----------------------------------------------------------+');
  console.log('|     CLAUDE SWARM - Progressive Timeout Coordinator        |');
  console.log('+-----------------------------------------------------------+');
  console.log(`|  Max concurrent agents: ${CONFIG.maxConcurrentAgents.toString().padEnd(33)}|`);
  console.log(`|  Initial timeout: ${(CONFIG.initialTimeoutMs / 1000).toFixed(0)}s${' '.repeat(37 - (CONFIG.initialTimeoutMs / 1000).toFixed(0).length)}|`);
  console.log(`|  Max timeout: ${(CONFIG.maxTimeoutMs / 1000).toFixed(0)}s${' '.repeat(41 - (CONFIG.maxTimeoutMs / 1000).toFixed(0).length)}|`);
  console.log(`|  Extension increment: ${(CONFIG.timeoutExtensionMs / 1000).toFixed(0)}s${' '.repeat(34 - (CONFIG.timeoutExtensionMs / 1000).toFixed(0).length)}|`);
  console.log(`|  Activity window: ${(CONFIG.activityWindowMs / 1000).toFixed(0)}s${' '.repeat(37 - (CONFIG.activityWindowMs / 1000).toFixed(0).length)}|`);
  console.log(`|  Progress logging: ${CONFIG.enableProgressLog.toString().padEnd(36)}|`);
  console.log(`|  Incremental files: ${CONFIG.enableIncrementalFiles.toString().padEnd(35)}|`);
  console.log(`|  Swarm directory: ${CONFIG.swarmDir.padEnd(37)}|`);
  console.log('+-----------------------------------------------------------+');
  console.log('');

  const processManager = new AgentProcessManager();
  const watcher = new LocalRequestWatcher(processManager);

  watcher.start();

  console.log('  Waiting for agent requests...');
  console.log(`   Drop JSON files in: ${CONFIG.swarmDir}/requests/`);
  console.log('');

  let lastStatus = '';
  setInterval(() => {
    const status = processManager.getStatus();
    const statusStr = `Active: ${status.active} | Completed: ${status.completed} | Failed: ${status.failed} | Extensions: ${status.timeoutExtensions} | Early TOs: ${status.earlyTimeouts}`;

    if (statusStr !== lastStatus && (status.active > 0 || status.completed > 0 || status.failed > 0)) {
      console.log(`  ${statusStr}`);

      // Show details for active agents
      if (status.agents.length > 0) {
        for (const agent of status.agents) {
          const timeStatus = agent.timeRemainingMs > 30000 ? '+' : agent.timeRemainingMs > 10000 ? '!' : '!!';
          console.log(`   ${timeStatus} ${agent.requestId.slice(0, 8)}: ${(agent.runningMs / 1000).toFixed(0)}s/${(agent.currentTimeoutMs / 1000).toFixed(0)}s, ${agent.complexity}, ${agent.extensionsApplied} ext, ${agent.outputBytes}B`);
        }
      }

      lastStatus = statusStr;
    }
  }, 5000);

  const shutdown = () => {
    console.log('\n  Shutting down coordinator...');
    watcher.stop();

    const status = processManager.getStatus();
    if (status.active > 0) {
      console.log(`   Terminating ${status.active} active agents...`);
      for (const agent of processManager.activeAgents.keys()) {
        processManager.killAgent(agent, 'SHUTDOWN');
      }
    }

    console.log('  Goodbye!');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
