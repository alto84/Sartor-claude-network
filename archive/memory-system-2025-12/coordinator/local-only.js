#!/usr/bin/env node
/**
 * Local-Only Claude Swarm Coordinator
 *
 * Watches .swarm/requests/ for agent requests and spawns Claude instances.
 * No Firebase required - purely file-based coordination.
 */

import { spawn } from 'child_process';
import { watch, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync, renameSync } from 'fs';
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
};

// ============================================================================
// Agent Process Manager
// ============================================================================

class AgentProcessManager extends EventEmitter {
  constructor() {
    super();
    this.activeAgents = new Map();
    this.completedCount = 0;
    this.failedCount = 0;
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
    };

    // Build the prompt for Claude
    const prompt = this.buildAgentPrompt(requestId, request);

    console.log(`🚀 Spawning agent: ${request.agentRole || 'worker'} (${requestId.slice(0, 8)}...)`);

    // Spawn claude WITHOUT -p flag (stdin mode has tool access, -p mode does NOT)
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

    // Send prompt via stdin (this enables tool use!)
    claudeProcess.stdin.write(prompt);
    claudeProcess.stdin.end();

    // Collect output
    let stdout = '';
    let stderr = '';

    claudeProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    claudeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Set timeout
    agentContext.timeout = setTimeout(() => {
      console.log(`⏰ Agent ${requestId.slice(0, 8)} timed out after ${CONFIG.agentTimeoutSeconds}s`);
      this.killAgent(requestId, 'TIMEOUT');
    }, CONFIG.agentTimeoutSeconds * 1000);

    // Handle completion
    claudeProcess.on('close', (code) => {
      clearTimeout(agentContext.timeout);
      this.activeAgents.delete(requestId);

      const duration = Date.now() - agentContext.startTime;

      if (code === 0) {
        this.completedCount++;
        this.saveResult(requestId, 'success', stdout, duration);
        console.log(`✅ Agent ${requestId.slice(0, 8)} completed in ${(duration / 1000).toFixed(1)}s`);
      } else {
        this.failedCount++;
        this.saveResult(requestId, 'failed', stderr || stdout, duration, code);
        console.log(`❌ Agent ${requestId.slice(0, 8)} failed (exit ${code}) in ${(duration / 1000).toFixed(1)}s`);
      }

      this.emit('agentComplete', { requestId, code, duration });
    });

    claudeProcess.on('error', (error) => {
      clearTimeout(agentContext.timeout);
      this.activeAgents.delete(requestId);
      this.failedCount++;
      this.saveResult(requestId, 'failed', error.message, Date.now() - agentContext.startTime, -1);
      console.log(`💥 Agent ${requestId.slice(0, 8)} error: ${error.message}`);
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
      agent.process.kill('SIGTERM');
      this.emit('agentKilled', { requestId, reason });
    }
  }

  saveResult(requestId, status, output, durationMs, exitCode = 0) {
    const resultsDir = join(CONFIG.swarmDir, 'results');
    mkdirSync(resultsDir, { recursive: true });

    const result = {
      requestId,
      status,
      output: output.slice(0, 50000), // Limit size
      durationMs,
      exitCode,
      completedAt: new Date().toISOString(),
    };

    const resultFile = join(resultsDir, `${requestId}.json`);
    writeFileSync(resultFile, JSON.stringify(result, null, 2));
  }

  getStatus() {
    return {
      active: this.activeCount,
      completed: this.completedCount,
      failed: this.failedCount,
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
    // Ensure directories exist
    mkdirSync(CONFIG.swarmDir, { recursive: true });
    mkdirSync(this.requestsDir, { recursive: true });
    mkdirSync(this.processingDir, { recursive: true });
    mkdirSync(join(CONFIG.swarmDir, 'results'), { recursive: true });
    mkdirSync(join(CONFIG.swarmDir, 'logs'), { recursive: true });

    console.log(`📂 Watching: ${this.requestsDir}`);

    // Process existing files first
    this.processExistingFiles();

    // Watch for new files
    try {
      this.watcher = watch(this.requestsDir, (eventType, filename) => {
        if (filename && filename.endsWith('.json')) {
          setTimeout(() => this.processFile(join(this.requestsDir, filename)), 100);
        }
      });
    } catch (err) {
      console.log('⚠️  File watcher not available, using polling');
    }

    // Also poll periodically (backup for watcher)
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

      // Move to processing directory to prevent duplicate processing
      const processingPath = join(this.processingDir, filename);
      try {
        renameSync(filePath, processingPath);
      } catch (moveError) {
        // Already being processed
        return;
      }

      console.log(`📥 Request: ${requestId.slice(0, 8)} (${request.agentRole || 'worker'})`);

      // Try to spawn
      const spawned = await this.processManager.spawnAgent(requestId, { ...request, requestId });

      if (spawned === null) {
        // Queue full, put back for retry
        setTimeout(() => {
          try {
            renameSync(processingPath, filePath);
          } catch (e) {}
        }, 2000);
      } else {
        // Successfully spawned, remove from processing
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
  console.log('║         CLAUDE SWARM - Local Coordinator                  ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Max concurrent agents: ${CONFIG.maxConcurrentAgents.toString().padEnd(33)}║`);
  console.log(`║  Agent timeout: ${CONFIG.agentTimeoutSeconds}s${' '.repeat(39 - CONFIG.agentTimeoutSeconds.toString().length)}║`);
  console.log(`║  Swarm directory: ${CONFIG.swarmDir.padEnd(37)}║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const processManager = new AgentProcessManager();
  const watcher = new LocalRequestWatcher(processManager);

  // Start watching
  watcher.start();

  console.log('🔍 Waiting for agent requests...');
  console.log(`   Drop JSON files in: ${CONFIG.swarmDir}/requests/`);
  console.log('');

  // Status logging
  let lastStatus = '';
  setInterval(() => {
    const status = processManager.getStatus();
    const statusStr = `Active: ${status.active} | Completed: ${status.completed} | Failed: ${status.failed}`;

    if (statusStr !== lastStatus && (status.active > 0 || status.completed > 0 || status.failed > 0)) {
      console.log(`📊 ${statusStr}`);
      lastStatus = statusStr;
    }
  }, 5000);

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down coordinator...');
    watcher.stop();

    // Kill any remaining agents
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
