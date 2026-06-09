#!/usr/bin/env node
/**
 * Local-Only Claude Swarm Coordinator with Output Streaming and Heartbeat Detection
 *
 * HYPOTHESIS 4 IMPLEMENTATION:
 * Streams output in real-time with heartbeat monitoring to detect stuck agents.
 *
 * Key features:
 * - Real-time output streaming with incremental file logging
 * - 45s silence warning (no output = potential problem)
 * - 90s heartbeat timeout (kills likely-stuck agents)
 * - Preserves partial output for debugging
 *
 * Expected improvements:
 * - 25% faster stuck detection (90s vs 120s timeout)
 * - Real-time visibility into agent progress
 * - Better debugging via incremental output logs
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
  // Heartbeat specific config
  heartbeatCheckIntervalMs: parseInt(process.env.HEARTBEAT_CHECK_INTERVAL_MS || '15000'), // Check every 15s
  silenceWarningMs: parseInt(process.env.SILENCE_WARNING_MS || '45000'), // Warn after 45s silence
  heartbeatTimeoutMs: parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '90000'), // Kill after 90s silence
  enableStreamingLog: process.env.LOG_AGENT_OUTPUT === 'true',
  enableIncrementalFiles: process.env.ENABLE_INCREMENTAL_FILES !== 'false', // On by default
};

// ============================================================================
// Agent Process Manager with Streaming and Heartbeat Detection
// ============================================================================

class AgentProcessManager extends EventEmitter {
  constructor() {
    super();
    this.activeAgents = new Map();
    this.completedCount = 0;
    this.failedCount = 0;
    this.heartbeatTimeouts = 0;
    this.silenceWarnings = 0;
  }

  get activeCount() {
    return this.activeAgents.size;
  }

  canSpawn() {
    return this.activeCount < CONFIG.maxConcurrentAgents;
  }

  async spawnAgent(requestId, request) {
    if (!this.canSpawn()) {
      console.log(`⏳ Queue full (${this.activeCount}/${CONFIG.maxConcurrentAgents}), will retry...`);
      return null;
    }

    const agentContext = {
      requestId,
      request,
      startTime: Date.now(),
      process: null,
      timeout: null,
      // Heartbeat tracking
      lastHeartbeat: Date.now(),
      heartbeatInterval: null,
      silenceWarned: false,
      // Output streaming
      outputStream: [],
      totalOutputBytes: 0,
    };

    const prompt = this.buildAgentPrompt(requestId, request);

    console.log(`🚀 Spawning agent: ${request.agentRole || 'worker'} (${requestId.slice(0, 8)}...)`);

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
      this.initIncrementalFile(requestId, request);
    }

    claudeProcess.stdin.write(prompt);
    claudeProcess.stdin.end();

    // Stream stdout in real-time
    let stdout = '';
    claudeProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;

      // Update heartbeat
      agentContext.lastHeartbeat = Date.now();
      agentContext.silenceWarned = false;

      // Track output stream
      agentContext.outputStream.push({
        timestamp: Date.now(),
        bytes: data.length,
      });
      agentContext.totalOutputBytes += data.length;

      // Log to console if enabled
      if (CONFIG.enableStreamingLog) {
        const preview = chunk.slice(0, 100).replace(/\n/g, '\\n');
        console.log(`📝 [${requestId.slice(0, 8)}] ${preview}${chunk.length > 100 ? '...' : ''}`);
      }

      // Save incremental output
      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(requestId, chunk);
      }
    });

    // Stream stderr
    let stderr = '';
    claudeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      agentContext.lastHeartbeat = Date.now();
      agentContext.silenceWarned = false;

      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(requestId, `[STDERR] ${data.toString()}`);
      }
    });

    // Set up heartbeat monitoring
    agentContext.heartbeatInterval = setInterval(() => {
      this.checkHeartbeat(requestId, agentContext);
    }, CONFIG.heartbeatCheckIntervalMs);

    // Set overall timeout (as fallback)
    agentContext.timeout = setTimeout(() => {
      console.log(`⏰ Agent ${requestId.slice(0, 8)} hit hard timeout after ${CONFIG.agentTimeoutSeconds}s`);
      this.killAgent(requestId, 'HARD_TIMEOUT');
    }, CONFIG.agentTimeoutSeconds * 1000);

    // Handle completion
    claudeProcess.on('close', (code) => {
      clearTimeout(agentContext.timeout);
      clearInterval(agentContext.heartbeatInterval);
      this.activeAgents.delete(requestId);

      const duration = Date.now() - agentContext.startTime;
      const outputStats = this.calculateOutputStats(agentContext);

      if (code === 0) {
        this.completedCount++;
        this.saveResult(requestId, 'success', stdout, duration, code, null, outputStats);
        console.log(`✅ Agent ${requestId.slice(0, 8)} completed in ${(duration / 1000).toFixed(1)}s (${agentContext.totalOutputBytes} bytes output)`);
      } else {
        this.failedCount++;
        this.saveResult(requestId, 'failed', stderr || stdout, duration, code, null, outputStats);
        console.log(`❌ Agent ${requestId.slice(0, 8)} failed (exit ${code}) in ${(duration / 1000).toFixed(1)}s`);
      }

      // Finalize incremental file
      if (CONFIG.enableIncrementalFiles) {
        this.finalizeIncrementalFile(requestId, code, duration);
      }

      this.emit('agentComplete', { requestId, code, duration, outputStats });
    });

    claudeProcess.on('error', (error) => {
      clearTimeout(agentContext.timeout);
      clearInterval(agentContext.heartbeatInterval);
      this.activeAgents.delete(requestId);
      this.failedCount++;
      this.saveResult(requestId, 'failed', error.message, Date.now() - agentContext.startTime, -1);
      console.log(`💥 Agent ${requestId.slice(0, 8)} error: ${error.message}`);
      this.emit('agentError', { requestId, error });
    });

    return requestId;
  }

  checkHeartbeat(requestId, agentContext) {
    const silenceDuration = Date.now() - agentContext.lastHeartbeat;
    const elapsed = Date.now() - agentContext.startTime;

    // 45s silence warning
    if (silenceDuration > CONFIG.silenceWarningMs && !agentContext.silenceWarned) {
      agentContext.silenceWarned = true;
      this.silenceWarnings++;
      console.log(`⚠️  Agent ${requestId.slice(0, 8)} silent for ${(silenceDuration / 1000).toFixed(0)}s (${agentContext.totalOutputBytes} bytes so far)`);

      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(requestId, `\n[COORDINATOR WARNING] Agent silent for ${(silenceDuration / 1000).toFixed(0)}s at ${elapsed}ms elapsed\n`);
      }

      this.emit('silenceWarning', { requestId, silenceDuration, totalOutput: agentContext.totalOutputBytes });
    }

    // 90s heartbeat timeout
    if (silenceDuration > CONFIG.heartbeatTimeoutMs) {
      console.log(`💀 Agent ${requestId.slice(0, 8)} heartbeat timeout after ${(silenceDuration / 1000).toFixed(0)}s silence`);
      this.heartbeatTimeouts++;
      this.killAgent(requestId, 'HEARTBEAT_TIMEOUT');
    }
  }

  calculateOutputStats(agentContext) {
    const stream = agentContext.outputStream;
    if (stream.length === 0) {
      return {
        totalBytes: 0,
        outputBursts: 0,
        timeToFirstOutput: null,
        avgTimeBetweenBursts: null,
      };
    }

    const timeToFirstOutput = stream[0].timestamp - agentContext.startTime;

    // Calculate time between output bursts
    let totalGap = 0;
    for (let i = 1; i < stream.length; i++) {
      totalGap += stream[i].timestamp - stream[i - 1].timestamp;
    }
    const avgTimeBetweenBursts = stream.length > 1 ? totalGap / (stream.length - 1) : null;

    return {
      totalBytes: agentContext.totalOutputBytes,
      outputBursts: stream.length,
      timeToFirstOutputMs: timeToFirstOutput,
      avgTimeBetweenBurstsMs: avgTimeBetweenBursts,
    };
  }

  initIncrementalFile(requestId, request) {
    const logsDir = join(CONFIG.swarmDir, 'logs');
    mkdirSync(logsDir, { recursive: true });

    const streamFile = join(logsDir, `${requestId}.stream.txt`);
    const header = `=== Agent Stream Log ===
Request ID: ${requestId}
Role: ${request.agentRole || 'worker'}
Started: ${new Date().toISOString()}
=====================================

`;
    writeFileSync(streamFile, header);
  }

  appendIncrementalOutput(requestId, content) {
    try {
      const streamFile = join(CONFIG.swarmDir, 'logs', `${requestId}.stream.txt`);
      appendFileSync(streamFile, content);
    } catch (error) {
      // Ignore write errors (e.g., if file was cleaned up)
    }
  }

  finalizeIncrementalFile(requestId, exitCode, duration) {
    try {
      const streamFile = join(CONFIG.swarmDir, 'logs', `${requestId}.stream.txt`);
      const footer = `
=====================================
Completed: ${new Date().toISOString()}
Exit Code: ${exitCode}
Duration: ${duration}ms
=====================================
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

═══════════════════════════════════════════════════════════
TASK OBJECTIVE:
${task.objective || 'No objective specified'}
═══════════════════════════════════════════════════════════

CONTEXT:
${JSON.stringify(task.context || {}, null, 2)}

REQUIREMENTS:
${(task.requirements || []).map(r => `• ${r}`).join('\n') || '• Complete the task'}

═══════════════════════════════════════════════════════════
INSTRUCTIONS:
═══════════════════════════════════════════════════════════

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

  saveResult(requestId, status, output, durationMs, exitCode = 0, failureReason = null, outputStats = null) {
    const resultsDir = join(CONFIG.swarmDir, 'results');
    mkdirSync(resultsDir, { recursive: true });

    const result = {
      requestId,
      status,
      output: output.slice(0, 50000),
      durationMs,
      exitCode,
      failureReason,
      outputStats,
      completedAt: new Date().toISOString(),
      coordinator: 'local-only-streaming',
    };

    const resultFile = join(resultsDir, `${requestId}.json`);
    writeFileSync(resultFile, JSON.stringify(result, null, 2));
  }

  getStatus() {
    return {
      active: this.activeCount,
      completed: this.completedCount,
      failed: this.failedCount,
      heartbeatTimeouts: this.heartbeatTimeouts,
      silenceWarnings: this.silenceWarnings,
      maxConcurrent: CONFIG.maxConcurrentAgents,
      agents: Array.from(this.activeAgents.entries()).map(([id, ctx]) => ({
        requestId: id,
        role: ctx.request.agentRole,
        runningMs: Date.now() - ctx.startTime,
        lastHeartbeatMs: Date.now() - ctx.lastHeartbeat,
        outputBytes: ctx.totalOutputBytes,
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

    console.log(`📂 Watching: ${this.requestsDir}`);

    this.processExistingFiles();

    try {
      this.watcher = watch(this.requestsDir, (eventType, filename) => {
        if (filename && filename.endsWith('.json')) {
          setTimeout(() => this.processFile(join(this.requestsDir, filename)), 100);
        }
      });
    } catch (err) {
      console.log('⚠️  File watcher not available, using polling');
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
        console.log(`⚠️  Invalid JSON in ${filename}, skipping`);
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

      console.log(`📥 Request: ${requestId.slice(0, 8)} (${request.agentRole || 'worker'})`);

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
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║      CLAUDE SWARM - Streaming Heartbeat Coordinator       ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Max concurrent agents: ${CONFIG.maxConcurrentAgents.toString().padEnd(33)}║`);
  console.log(`║  Agent timeout: ${CONFIG.agentTimeoutSeconds}s${' '.repeat(39 - CONFIG.agentTimeoutSeconds.toString().length)}║`);
  console.log(`║  Silence warning: ${(CONFIG.silenceWarningMs / 1000).toFixed(0)}s${' '.repeat(37 - (CONFIG.silenceWarningMs / 1000).toFixed(0).length)}║`);
  console.log(`║  Heartbeat timeout: ${(CONFIG.heartbeatTimeoutMs / 1000).toFixed(0)}s${' '.repeat(35 - (CONFIG.heartbeatTimeoutMs / 1000).toFixed(0).length)}║`);
  console.log(`║  Stream logging: ${CONFIG.enableStreamingLog.toString().padEnd(38)}║`);
  console.log(`║  Incremental files: ${CONFIG.enableIncrementalFiles.toString().padEnd(35)}║`);
  console.log(`║  Swarm directory: ${CONFIG.swarmDir.padEnd(37)}║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const processManager = new AgentProcessManager();
  const watcher = new LocalRequestWatcher(processManager);

  watcher.start();

  console.log('🔍 Waiting for agent requests...');
  console.log(`   Drop JSON files in: ${CONFIG.swarmDir}/requests/`);
  console.log('');

  let lastStatus = '';
  setInterval(() => {
    const status = processManager.getStatus();
    const statusStr = `Active: ${status.active} | Completed: ${status.completed} | Failed: ${status.failed} | HB Timeouts: ${status.heartbeatTimeouts} | Warnings: ${status.silenceWarnings}`;

    if (statusStr !== lastStatus && (status.active > 0 || status.completed > 0 || status.failed > 0)) {
      console.log(`📊 ${statusStr}`);

      // Show details for active agents
      if (status.agents.length > 0) {
        for (const agent of status.agents) {
          const heartbeatStatus = agent.lastHeartbeatMs < CONFIG.silenceWarningMs ? '💚' : '⚠️';
          console.log(`   ${heartbeatStatus} ${agent.requestId.slice(0, 8)}: ${(agent.runningMs / 1000).toFixed(0)}s, last output ${(agent.lastHeartbeatMs / 1000).toFixed(0)}s ago, ${agent.outputBytes} bytes`);
        }
      }

      lastStatus = statusStr;
    }
  }, 5000);

  const shutdown = () => {
    console.log('\n🛑 Shutting down coordinator...');
    watcher.stop();

    const status = processManager.getStatus();
    if (status.active > 0) {
      console.log(`   Terminating ${status.active} active agents...`);
      for (const agent of processManager.activeAgents.keys()) {
        processManager.killAgent(agent, 'SHUTDOWN');
      }
    }

    console.log('👋 Goodbye!');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
