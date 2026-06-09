#!/usr/bin/env node
/**
 * Local-Only Claude Swarm Coordinator with Lazy Context Loading
 *
 * HYPOTHESIS 2 IMPLEMENTATION:
 * Lazy context loading system that starts agents with minimal context
 * and provides pointers to load additional context on-demand.
 *
 * Key features:
 * - Minimal startup prompt (essential info only)
 * - Context file pointers for on-demand loading
 * - Full context saved to .swarm/context/{requestId}.json
 * - Agents only load context they actually need
 * - Memory topic integration via bootstrap.sh
 *
 * Expected improvements:
 * - 30-50% startup time reduction
 * - Prevent instruction truncation from oversized context
 * - Agents fetch only relevant context
 * - Better performance with large context payloads
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
  // Lazy context config
  contextMode: process.env.CONTEXT_MODE || 'lazy', // 'lazy' or 'full'
  maxEssentialRequirements: parseInt(process.env.MAX_ESSENTIAL_REQUIREMENTS || '3'),
  maxInlineContextChars: parseInt(process.env.MAX_INLINE_CONTEXT_CHARS || '500'),
  enableContextFiles: process.env.ENABLE_CONTEXT_FILES !== 'false',
  enableProgressLog: process.env.LOG_PROGRESS === 'true',
  enableIncrementalFiles: process.env.ENABLE_INCREMENTAL_FILES !== 'false',
};

// ============================================================================
// Context Size Analyzer
// ============================================================================

function analyzeContextSize(request) {
  const task = request.task || {};
  const contextJson = JSON.stringify(task.context || {}, null, 2);
  const requirementsJson = JSON.stringify(task.requirements || [], null, 2);
  const objectiveLength = (task.objective || '').length;

  return {
    contextChars: contextJson.length,
    requirementsChars: requirementsJson.length,
    objectiveChars: objectiveLength,
    totalChars: contextJson.length + requirementsJson.length + objectiveLength,
    requirementsCount: (task.requirements || []).length,
    contextKeys: Object.keys(task.context || {}),
    isLargeContext: contextJson.length > CONFIG.maxInlineContextChars,
    recommendation: contextJson.length > CONFIG.maxInlineContextChars ? 'lazy' : 'inline',
  };
}

// ============================================================================
// Agent Process Manager with Lazy Context Loading
// ============================================================================

class AgentProcessManager extends EventEmitter {
  constructor() {
    super();
    this.activeAgents = new Map();
    this.completedCount = 0;
    this.failedCount = 0;
    this.lazyContextUsed = 0;
    this.fullContextUsed = 0;
    this.contextBytesLoaded = 0;
    this.contextBytesAvailable = 0;
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

    // Analyze context size
    const contextAnalysis = analyzeContextSize(request);

    const agentContext = {
      requestId,
      request,
      startTime: Date.now(),
      process: null,
      timeout: null,
      contextAnalysis,
      usedLazyLoading: false,
      contextLoadedFromFile: false,
      firstOutputTime: null,
      totalOutputBytes: 0,
      outputCheckpoints: [],
    };

    // Determine context mode
    const useLazy = CONFIG.contextMode === 'lazy' &&
                    (contextAnalysis.isLargeContext || CONFIG.contextMode === 'lazy');

    if (useLazy) {
      this.lazyContextUsed++;
      agentContext.usedLazyLoading = true;
    } else {
      this.fullContextUsed++;
    }

    // Save full context to file if using lazy loading
    let contextFilePath = null;
    if (useLazy && CONFIG.enableContextFiles) {
      contextFilePath = this.saveContextFile(requestId, request);
    }

    // Build the appropriate prompt
    const prompt = useLazy
      ? this.buildLazyContextPrompt(requestId, request, contextFilePath, contextAnalysis)
      : this.buildFullContextPrompt(requestId, request);

    console.log(`  Spawning agent: ${request.agentRole || 'worker'} (${requestId.slice(0, 8)}...)`);
    console.log(`   Context mode: ${useLazy ? 'lazy' : 'full'}, context size: ${contextAnalysis.contextChars} chars, requirements: ${contextAnalysis.requirementsCount}`);

    const claudeProcess = spawn('claude', ['--dangerously-skip-permissions'], {
      env: {
        ...process.env,
        SWARM_REQUEST_ID: requestId,
        SWARM_PARENT_ID: request.parentRequestId || '',
        SWARM_AGENT_ROLE: request.agentRole || 'general',
        SWARM_CONTEXT_FILE: contextFilePath || '',
        SWARM_CONTEXT_MODE: useLazy ? 'lazy' : 'full',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    agentContext.process = claudeProcess;
    this.activeAgents.set(requestId, agentContext);

    // Initialize incremental output file
    if (CONFIG.enableIncrementalFiles) {
      this.initIncrementalFile(requestId, request, contextAnalysis, useLazy);
    }

    claudeProcess.stdin.write(prompt);
    claudeProcess.stdin.end();

    // Collect output and track timing
    let stdout = '';
    claudeProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;

      // Track first output time (for startup latency measurement)
      if (agentContext.firstOutputTime === null) {
        agentContext.firstOutputTime = Date.now();
        const startupLatency = agentContext.firstOutputTime - agentContext.startTime;
        console.log(`   [${requestId.slice(0, 8)}] First output after ${startupLatency}ms`);
      }

      agentContext.totalOutputBytes += data.length;
      agentContext.outputCheckpoints.push({
        time: Date.now(),
        bytes: data.length,
      });

      // Check if agent loaded context file
      if (!agentContext.contextLoadedFromFile &&
          (chunk.includes('cat ') && chunk.includes('.swarm/context/') ||
           chunk.includes('context.json'))) {
        agentContext.contextLoadedFromFile = true;
        console.log(`   [${requestId.slice(0, 8)}] Agent loaded context file`);
      }

      if (CONFIG.enableProgressLog) {
        const preview = chunk.slice(0, 80).replace(/\n/g, '\\n');
        console.log(`   [${requestId.slice(0, 8)}] ${preview}${chunk.length > 80 ? '...' : ''}`);
      }

      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(requestId, chunk);
      }
    });

    let stderr = '';
    claudeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(requestId, `[STDERR] ${data.toString()}`);
      }
    });

    // Set timeout
    agentContext.timeout = setTimeout(() => {
      console.log(`  Agent ${requestId.slice(0, 8)} timed out after ${CONFIG.agentTimeoutSeconds}s`);
      this.killAgent(requestId, 'TIMEOUT');
    }, CONFIG.agentTimeoutSeconds * 1000);

    // Handle completion
    claudeProcess.on('close', (code) => {
      clearTimeout(agentContext.timeout);
      this.activeAgents.delete(requestId);

      const duration = Date.now() - agentContext.startTime;
      const lazyStats = this.calculateLazyStats(agentContext, contextAnalysis, duration);

      // Track context efficiency
      this.contextBytesAvailable += contextAnalysis.totalChars;
      if (agentContext.contextLoadedFromFile) {
        this.contextBytesLoaded += contextAnalysis.contextChars;
      } else if (!useLazy) {
        this.contextBytesLoaded += contextAnalysis.totalChars;
      }

      if (code === 0) {
        this.completedCount++;
        this.saveResult(requestId, 'success', stdout, duration, code, null, lazyStats);
        console.log(`  Agent ${requestId.slice(0, 8)} completed in ${(duration / 1000).toFixed(1)}s (startup: ${lazyStats.startupLatencyMs}ms, context loaded: ${lazyStats.contextLoadedFromFile})`);
      } else {
        this.failedCount++;
        this.saveResult(requestId, 'failed', stderr || stdout, duration, code, null, lazyStats);
        console.log(`  Agent ${requestId.slice(0, 8)} failed (exit ${code}) in ${(duration / 1000).toFixed(1)}s`);
      }

      if (CONFIG.enableIncrementalFiles) {
        this.finalizeIncrementalFile(requestId, code, duration, lazyStats);
      }

      this.emit('agentComplete', { requestId, code, duration, lazyStats });
    });

    claudeProcess.on('error', (error) => {
      clearTimeout(agentContext.timeout);
      this.activeAgents.delete(requestId);
      this.failedCount++;
      this.saveResult(requestId, 'failed', error.message, Date.now() - agentContext.startTime, -1);
      console.log(`  Agent ${requestId.slice(0, 8)} error: ${error.message}`);
      this.emit('agentError', { requestId, error });
    });

    return requestId;
  }

  saveContextFile(requestId, request) {
    const contextDir = join(CONFIG.swarmDir, 'context');
    mkdirSync(contextDir, { recursive: true });

    const task = request.task || {};
    const fullContext = {
      requestId,
      agentRole: request.agentRole,
      parentRequestId: request.parentRequestId,
      objective: task.objective,
      context: task.context || {},
      requirements: task.requirements || [],
      savedAt: new Date().toISOString(),
      // Include pointers to related files
      relatedFiles: {
        parentResult: request.parentRequestId
          ? join(CONFIG.swarmDir, 'results', `${request.parentRequestId}.json`)
          : null,
        memoryTopics: task.context?.memoryTopics || [],
      },
    };

    const contextFile = join(contextDir, `${requestId}.json`);
    writeFileSync(contextFile, JSON.stringify(fullContext, null, 2));

    return contextFile;
  }

  buildLazyContextPrompt(requestId, request, contextFilePath, contextAnalysis) {
    const task = request.task || {};
    const swarmDir = CONFIG.swarmDir;

    // Extract only essential requirements (first N)
    const essentialRequirements = (task.requirements || []).slice(0, CONFIG.maxEssentialRequirements);
    const remainingCount = Math.max(0, (task.requirements || []).length - CONFIG.maxEssentialRequirements);

    // Build minimal inline context (only if small)
    let inlineContext = '';
    if (contextAnalysis.contextChars <= CONFIG.maxInlineContextChars) {
      inlineContext = `
INLINE CONTEXT (small enough to include):
${JSON.stringify(task.context || {}, null, 2)}`;
    }

    // Build context pointer section
    const contextPointers = {
      full_context: contextFilePath,
      context_size: `${contextAnalysis.contextChars} chars`,
      context_keys: contextAnalysis.contextKeys,
      additional_requirements: remainingCount > 0 ? `${remainingCount} more in context file` : 'none',
      parent_result: request.parentRequestId
        ? join(swarmDir, 'results', `${request.parentRequestId}.json`)
        : null,
      memory_topics: task.context?.memoryTopics || [],
    };

    return `You are Agent "${request.agentRole || 'worker'}" in a multi-agent swarm.

REQUEST ID: ${requestId}
PARENT: ${request.parentRequestId || 'none (you are root)'}

TASK OBJECTIVE:
${task.objective || 'No objective specified'}

ESSENTIAL REQUIREMENTS:
${essentialRequirements.map(r => `  ${r}`).join('\n') || '  Complete the task'}
${remainingCount > 0 ? `  ... and ${remainingCount} more requirements (see full context)` : ''}
${inlineContext}

CONTEXT LOADING (use if needed):
${JSON.stringify(contextPointers, null, 2)}

To load full context:
  cat ${contextFilePath}

To load parent's result (if exists):
  ${request.parentRequestId ? `cat ${contextPointers.parent_result}` : '# No parent request'}

To query memory system:
  source /home/alton/claude-swarm/framework/memory/bootstrap.sh
  query_memory "topic" > context.txt
  cat context.txt

INSTRUCTIONS:

1. Start working on your task immediately
2. Load additional context ONLY if essential information is missing
3. If you need full requirements, cat the context file
4. Be concise but thorough

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

  buildFullContextPrompt(requestId, request) {
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

  calculateLazyStats(agentContext, contextAnalysis, actualDuration) {
    const startupLatency = agentContext.firstOutputTime
      ? agentContext.firstOutputTime - agentContext.startTime
      : null;

    return {
      contextMode: agentContext.usedLazyLoading ? 'lazy' : 'full',
      contextSizeChars: contextAnalysis.totalChars,
      contextInlineChars: contextAnalysis.contextChars <= CONFIG.maxInlineContextChars
        ? contextAnalysis.contextChars
        : 0,
      contextLoadedFromFile: agentContext.contextLoadedFromFile,
      requirementsCount: contextAnalysis.requirementsCount,
      essentialRequirementsSent: Math.min(contextAnalysis.requirementsCount, CONFIG.maxEssentialRequirements),
      startupLatencyMs: startupLatency,
      actualDurationMs: actualDuration,
      totalOutputBytes: agentContext.totalOutputBytes,
      outputBursts: agentContext.outputCheckpoints.length,
      recommendation: contextAnalysis.recommendation,
      contextEfficiency: agentContext.contextLoadedFromFile
        ? 'loaded-on-demand'
        : (agentContext.usedLazyLoading ? 'deferred-unused' : 'inline-full'),
    };
  }

  initIncrementalFile(requestId, request, contextAnalysis, useLazy) {
    const logsDir = join(CONFIG.swarmDir, 'logs');
    mkdirSync(logsDir, { recursive: true });

    const streamFile = join(logsDir, `${requestId}.stream.txt`);
    const header = `=== Lazy Context Loading Agent Log ===
Request ID: ${requestId}
Role: ${request.agentRole || 'worker'}
Started: ${new Date().toISOString()}
Context Mode: ${useLazy ? 'lazy' : 'full'}
Context Size: ${contextAnalysis.totalChars} chars
Context Inline: ${contextAnalysis.contextChars <= CONFIG.maxInlineContextChars}
Requirements: ${contextAnalysis.requirementsCount} total, ${Math.min(contextAnalysis.requirementsCount, CONFIG.maxEssentialRequirements)} essential
==========================================

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

  finalizeIncrementalFile(requestId, exitCode, duration, lazyStats) {
    try {
      const streamFile = join(CONFIG.swarmDir, 'logs', `${requestId}.stream.txt`);
      const footer = `
==========================================
Completed: ${new Date().toISOString()}
Exit Code: ${exitCode}
Duration: ${duration}ms
Startup Latency: ${lazyStats.startupLatencyMs}ms
Context Mode: ${lazyStats.contextMode}
Context Loaded From File: ${lazyStats.contextLoadedFromFile}
Context Efficiency: ${lazyStats.contextEfficiency}
==========================================
`;
      appendFileSync(streamFile, footer);
    } catch (error) {
      // Ignore errors
    }
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

  saveResult(requestId, status, output, durationMs, exitCode = 0, failureReason = null, lazyStats = null) {
    const resultsDir = join(CONFIG.swarmDir, 'results');
    mkdirSync(resultsDir, { recursive: true });

    const result = {
      requestId,
      status,
      output: output.slice(0, 50000),
      durationMs,
      exitCode,
      failureReason,
      lazyStats,
      completedAt: new Date().toISOString(),
      coordinator: 'local-only-lazy',
    };

    const resultFile = join(resultsDir, `${requestId}.json`);
    writeFileSync(resultFile, JSON.stringify(result, null, 2));
  }

  getStatus() {
    const contextEfficiency = this.contextBytesAvailable > 0
      ? ((this.contextBytesLoaded / this.contextBytesAvailable) * 100).toFixed(1)
      : '0.0';

    return {
      active: this.activeCount,
      completed: this.completedCount,
      failed: this.failedCount,
      lazyContextUsed: this.lazyContextUsed,
      fullContextUsed: this.fullContextUsed,
      contextEfficiencyPercent: contextEfficiency,
      contextBytesLoaded: this.contextBytesLoaded,
      contextBytesAvailable: this.contextBytesAvailable,
      maxConcurrent: CONFIG.maxConcurrentAgents,
      agents: Array.from(this.activeAgents.entries()).map(([id, ctx]) => ({
        requestId: id,
        role: ctx.request.agentRole,
        runningMs: Date.now() - ctx.startTime,
        usedLazyLoading: ctx.usedLazyLoading,
        contextLoadedFromFile: ctx.contextLoadedFromFile,
        outputBytes: ctx.totalOutputBytes,
        startupLatencyMs: ctx.firstOutputTime
          ? ctx.firstOutputTime - ctx.startTime
          : null,
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
    mkdirSync(join(CONFIG.swarmDir, 'context'), { recursive: true });

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
  console.log('|     CLAUDE SWARM - Lazy Context Loading Coordinator       |');
  console.log('+-----------------------------------------------------------+');
  console.log(`|  Max concurrent agents: ${CONFIG.maxConcurrentAgents.toString().padEnd(33)}|`);
  console.log(`|  Agent timeout: ${CONFIG.agentTimeoutSeconds}s${' '.repeat(39 - CONFIG.agentTimeoutSeconds.toString().length)}|`);
  console.log(`|  Context mode: ${CONFIG.contextMode.padEnd(40)}|`);
  console.log(`|  Max inline context: ${CONFIG.maxInlineContextChars} chars${' '.repeat(28 - CONFIG.maxInlineContextChars.toString().length)}|`);
  console.log(`|  Essential requirements: ${CONFIG.maxEssentialRequirements.toString().padEnd(31)}|`);
  console.log(`|  Context files: ${CONFIG.enableContextFiles.toString().padEnd(39)}|`);
  console.log(`|  Progress logging: ${CONFIG.enableProgressLog.toString().padEnd(36)}|`);
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
    const statusStr = `Active: ${status.active} | Completed: ${status.completed} | Failed: ${status.failed} | Lazy: ${status.lazyContextUsed} | Full: ${status.fullContextUsed} | Efficiency: ${status.contextEfficiencyPercent}%`;

    if (statusStr !== lastStatus && (status.active > 0 || status.completed > 0 || status.failed > 0)) {
      console.log(`  ${statusStr}`);

      // Show details for active agents
      if (status.agents.length > 0) {
        for (const agent of status.agents) {
          const contextStatus = agent.usedLazyLoading
            ? (agent.contextLoadedFromFile ? 'lazy+loaded' : 'lazy')
            : 'full';
          const startupStr = agent.startupLatencyMs ? `startup: ${agent.startupLatencyMs}ms` : 'waiting...';
          console.log(`   - ${agent.requestId.slice(0, 8)}: ${(agent.runningMs / 1000).toFixed(0)}s, ${contextStatus}, ${startupStr}, ${agent.outputBytes}B`);
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

    // Print final stats
    console.log('');
    console.log('  Final Statistics:');
    console.log(`   Completed: ${status.completed}`);
    console.log(`   Failed: ${status.failed}`);
    console.log(`   Lazy context used: ${status.lazyContextUsed}`);
    console.log(`   Full context used: ${status.fullContextUsed}`);
    console.log(`   Context efficiency: ${status.contextEfficiencyPercent}%`);
    console.log(`   Context bytes loaded: ${status.contextBytesLoaded}`);
    console.log(`   Context bytes available: ${status.contextBytesAvailable}`);
    console.log('');

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
