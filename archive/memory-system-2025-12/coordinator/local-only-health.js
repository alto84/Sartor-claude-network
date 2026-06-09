#!/usr/bin/env node
/**
 * Local-Only Claude Swarm Coordinator with Health Check
 *
 * HYPOTHESIS 1 IMPLEMENTATION:
 * Adds a lightweight health check probe before main task execution.
 * Expected to detect initialization failures within 10s instead of 120s.
 *
 * Key improvement: 92% reduction in wasted timeout for failed agents
 * (10s health check vs 120s full timeout)
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
  agentTimeoutSeconds: parseInt(process.env.AGENT_TIMEOUT_SECONDS || '120'),
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '1000'),
  swarmDir: process.env.SWARM_DIR || '.swarm',
  // Health check specific config
  healthCheckTimeoutMs: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || '15000'), // 15s default
  skipHealthCheck: process.env.SKIP_HEALTH_CHECK === 'true',
  enableHealthCheckLog: process.env.LOG_HEALTH_CHECK === 'true',
};

// ============================================================================
// Agent Process Manager with Health Check
// ============================================================================

class AgentProcessManager extends EventEmitter {
  constructor() {
    super();
    this.activeAgents = new Map();
    this.completedCount = 0;
    this.failedCount = 0;
    this.healthCheckFailures = 0;
    this.healthCheckSuccesses = 0;
  }

  get activeCount() {
    return this.activeAgents.size;
  }

  canSpawn() {
    return this.activeCount < CONFIG.maxConcurrentAgents;
  }

  /**
   * Health check probe - verifies agent can initialize and respond
   * Returns: { success: boolean, message: string, durationMs: number }
   */
  async performHealthCheck(requestId) {
    if (CONFIG.skipHealthCheck) {
      return { success: true, message: 'SKIPPED', durationMs: 0 };
    }

    const startTime = Date.now();

    return new Promise((resolve) => {
      const healthPrompt = `HEALTH CHECK - Respond with exactly "READY" (nothing else) after confirming you can:
1. Process this prompt
2. Respond via stdout

Just output: READY`;

      const claudeProcess = spawn('claude', ['--dangerously-skip-permissions'], {
        env: {
          ...process.env,
          SWARM_REQUEST_ID: `health-${requestId}`,
          SWARM_HEALTH_CHECK: 'true',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
      });

      let stdout = '';
      let stderr = '';
      let resolved = false;

      const healthTimeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          claudeProcess.kill('SIGTERM');
          const duration = Date.now() - startTime;
          this.healthCheckFailures++;
          this.logHealthCheck(requestId, false, `TIMEOUT after ${duration}ms`, duration);
          resolve({
            success: false,
            message: `Health check timeout after ${duration}ms (no response)`,
            durationMs: duration
          });
        }
      }, CONFIG.healthCheckTimeoutMs);

      claudeProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        // Check for READY response
        if (stdout.includes('READY') && !resolved) {
          resolved = true;
          clearTimeout(healthTimeout);
          claudeProcess.kill('SIGTERM');
          const duration = Date.now() - startTime;
          this.healthCheckSuccesses++;
          this.logHealthCheck(requestId, true, 'READY', duration);
          resolve({ success: true, message: 'READY', durationMs: duration });
        }
      });

      claudeProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      claudeProcess.stdin.write(healthPrompt);
      claudeProcess.stdin.end();

      claudeProcess.on('close', (code) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(healthTimeout);
          const duration = Date.now() - startTime;
          this.healthCheckFailures++;
          const message = stderr || stdout || `Process exited with code ${code}`;
          this.logHealthCheck(requestId, false, message.slice(0, 200), duration);
          resolve({
            success: false,
            message: `Health check failed: ${message.slice(0, 200)}`,
            durationMs: duration
          });
        }
      });

      claudeProcess.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(healthTimeout);
          const duration = Date.now() - startTime;
          this.healthCheckFailures++;
          this.logHealthCheck(requestId, false, error.message, duration);
          resolve({
            success: false,
            message: `Health check error: ${error.message}`,
            durationMs: duration
          });
        }
      });
    });
  }

  logHealthCheck(requestId, success, message, durationMs) {
    if (CONFIG.enableHealthCheckLog) {
      const logDir = join(CONFIG.swarmDir, 'logs');
      mkdirSync(logDir, { recursive: true });
      const logFile = join(logDir, 'health-checks.log');
      const entry = `${new Date().toISOString()} | ${requestId.slice(0, 8)} | ${success ? 'PASS' : 'FAIL'} | ${durationMs}ms | ${message}\n`;
      appendFileSync(logFile, entry);
    }
  }

  async spawnAgent(requestId, request) {
    if (!this.canSpawn()) {
      console.log(`\u23f3 Queue full (${this.activeCount}/${CONFIG.maxConcurrentAgents}), will retry...`);
      return null;
    }

    // Phase 1: Health check
    console.log(`\ud83e\ude7a Health check for: ${request.agentRole || 'worker'} (${requestId.slice(0, 8)}...)`);
    const healthResult = await this.performHealthCheck(requestId);

    if (!healthResult.success) {
      console.log(`\u274c Health check failed for ${requestId.slice(0, 8)}: ${healthResult.message}`);
      this.failedCount++;
      this.saveResult(requestId, 'failed', healthResult.message, healthResult.durationMs, -1, 'HEALTH_CHECK_FAILED');
      this.emit('healthCheckFailed', { requestId, result: healthResult });
      return requestId; // Return ID to indicate it was processed (not requeued)
    }

    console.log(`\u2705 Health check passed (${healthResult.durationMs}ms), spawning agent...`);

    // Phase 2: Spawn actual agent
    const agentContext = {
      requestId,
      request,
      startTime: Date.now(),
      healthCheckDurationMs: healthResult.durationMs,
      process: null,
      timeout: null,
    };

    const prompt = this.buildAgentPrompt(requestId, request);

    console.log(`\ud83d\ude80 Spawning agent: ${request.agentRole || 'worker'} (${requestId.slice(0, 8)}...)`);

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

    claudeProcess.stdin.write(prompt);
    claudeProcess.stdin.end();

    let stdout = '';
    let stderr = '';

    claudeProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    claudeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    agentContext.timeout = setTimeout(() => {
      console.log(`\u23f0 Agent ${requestId.slice(0, 8)} timed out after ${CONFIG.agentTimeoutSeconds}s`);
      this.killAgent(requestId, 'TIMEOUT');
    }, CONFIG.agentTimeoutSeconds * 1000);

    claudeProcess.on('close', (code) => {
      clearTimeout(agentContext.timeout);
      this.activeAgents.delete(requestId);

      const duration = Date.now() - agentContext.startTime;
      const totalDuration = duration + agentContext.healthCheckDurationMs;

      if (code === 0) {
        this.completedCount++;
        this.saveResult(requestId, 'success', stdout, totalDuration, code, null, {
          healthCheckMs: agentContext.healthCheckDurationMs,
          taskMs: duration,
        });
        console.log(`\u2705 Agent ${requestId.slice(0, 8)} completed in ${(totalDuration / 1000).toFixed(1)}s (health: ${agentContext.healthCheckDurationMs}ms, task: ${duration}ms)`);
      } else {
        this.failedCount++;
        this.saveResult(requestId, 'failed', stderr || stdout, totalDuration, code, null, {
          healthCheckMs: agentContext.healthCheckDurationMs,
          taskMs: duration,
        });
        console.log(`\u274c Agent ${requestId.slice(0, 8)} failed (exit ${code}) in ${(totalDuration / 1000).toFixed(1)}s`);
      }

      this.emit('agentComplete', { requestId, code, duration: totalDuration });
    });

    claudeProcess.on('error', (error) => {
      clearTimeout(agentContext.timeout);
      this.activeAgents.delete(requestId);
      this.failedCount++;
      this.saveResult(requestId, 'failed', error.message, Date.now() - agentContext.startTime, -1);
      console.log(`\ud83d\udca5 Agent ${requestId.slice(0, 8)} error: ${error.message}`);
      this.emit('agentError', { requestId, error });
    });

    return requestId;
  }

  buildAgentPrompt(requestId, request) {
    const task = request.task || {};
    const swarmDir = CONFIG.swarmDir;

    return `You are Agent "${request.agentRole || 'worker'}" in a multi-agent swarm.

REQUEST ID: ${requestId}
PARENT: ${request.parentRequestId || 'none (you are root)'}

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
TASK OBJECTIVE:
${task.objective || 'No objective specified'}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

CONTEXT:
${JSON.stringify(task.context || {}, null, 2)}

REQUIREMENTS:
${(task.requirements || []).map(r => `\u2022 ${r}`).join('\n') || '\u2022 Complete the task'}

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
INSTRUCTIONS:
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

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
      agent.process.kill('SIGTERM');
      this.emit('agentKilled', { requestId, reason });
    }
  }

  saveResult(requestId, status, output, durationMs, exitCode = 0, failureReason = null, timing = null) {
    const resultsDir = join(CONFIG.swarmDir, 'results');
    mkdirSync(resultsDir, { recursive: true });

    const result = {
      requestId,
      status,
      output: output.slice(0, 50000),
      durationMs,
      exitCode,
      failureReason,
      timing,
      completedAt: new Date().toISOString(),
      coordinator: 'local-only-health',
    };

    const resultFile = join(resultsDir, `${requestId}.json`);
    writeFileSync(resultFile, JSON.stringify(result, null, 2));
  }

  getStatus() {
    return {
      active: this.activeCount,
      completed: this.completedCount,
      failed: this.failedCount,
      healthCheckSuccesses: this.healthCheckSuccesses,
      healthCheckFailures: this.healthCheckFailures,
      maxConcurrent: CONFIG.maxConcurrentAgents,
      agents: Array.from(this.activeAgents.entries()).map(([id, ctx]) => ({
        requestId: id,
        role: ctx.request.agentRole,
        runningMs: Date.now() - ctx.startTime,
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

    console.log(`\ud83d\udcc2 Watching: ${this.requestsDir}`);

    this.processExistingFiles();

    try {
      this.watcher = watch(this.requestsDir, (eventType, filename) => {
        if (filename && filename.endsWith('.json')) {
          setTimeout(() => this.processFile(join(this.requestsDir, filename)), 100);
        }
      });
    } catch (err) {
      console.log('\u26a0\ufe0f  File watcher not available, using polling');
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
        console.log(`\u26a0\ufe0f  Invalid JSON in ${filename}, skipping`);
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

      console.log(`\ud83d\udce5 Request: ${requestId.slice(0, 8)} (${request.agentRole || 'worker'})`);

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
  console.log('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  console.log('\u2551         CLAUDE SWARM - Health Check Coordinator         \u2551');
  console.log('\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563');
  console.log(`\u2551  Max concurrent agents: ${CONFIG.maxConcurrentAgents.toString().padEnd(33)}\u2551`);
  console.log(`\u2551  Agent timeout: ${CONFIG.agentTimeoutSeconds}s${' '.repeat(39 - CONFIG.agentTimeoutSeconds.toString().length)}\u2551`);
  console.log(`\u2551  Health check timeout: ${(CONFIG.healthCheckTimeoutMs / 1000).toFixed(0)}s${' '.repeat(33 - (CONFIG.healthCheckTimeoutMs / 1000).toFixed(0).length)}\u2551`);
  console.log(`\u2551  Skip health check: ${CONFIG.skipHealthCheck.toString().padEnd(36)}\u2551`);
  console.log(`\u2551  Swarm directory: ${CONFIG.swarmDir.padEnd(37)}\u2551`);
  console.log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d');
  console.log('');

  const processManager = new AgentProcessManager();
  const watcher = new LocalRequestWatcher(processManager);

  watcher.start();

  console.log('\ud83d\udd0d Waiting for agent requests...');
  console.log(`   Drop JSON files in: ${CONFIG.swarmDir}/requests/`);
  console.log('');

  let lastStatus = '';
  setInterval(() => {
    const status = processManager.getStatus();
    const statusStr = `Active: ${status.active} | Completed: ${status.completed} | Failed: ${status.failed} | HC Pass: ${status.healthCheckSuccesses} | HC Fail: ${status.healthCheckFailures}`;

    if (statusStr !== lastStatus && (status.active > 0 || status.completed > 0 || status.failed > 0)) {
      console.log(`\ud83d\udcca ${statusStr}`);
      lastStatus = statusStr;
    }
  }, 5000);

  const shutdown = () => {
    console.log('\n\ud83d\uded1 Shutting down coordinator...');
    watcher.stop();

    const status = processManager.getStatus();
    if (status.active > 0) {
      console.log(`   Terminating ${status.active} active agents...`);
      for (const agent of processManager.activeAgents.keys()) {
        processManager.killAgent(agent, 'SHUTDOWN');
      }
    }

    console.log('\ud83d\udc4b Goodbye!');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
