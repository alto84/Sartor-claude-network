#!/usr/bin/env node
/**
 * Local-Only Claude Swarm Coordinator - Fully Optimized
 *
 * COMBINED IMPLEMENTATION OF ALL 4 HYPOTHESES:
 *
 * Integration Order:
 * 1. HEALTH CHECK PROBE (Hypothesis 1) - Verify agent can initialize
 * 2. LAZY CONTEXT LOADING (Hypothesis 2) - Minimal startup prompt
 * 3. STREAMING OUTPUT (Hypothesis 4) - Real-time output with heartbeat
 * 4. PROGRESSIVE TIMEOUT (Hypothesis 3) - Activity-based timeout extension
 *
 * Expected Combined Improvements:
 * - 92% faster failure detection (health check in 10-15s vs 120s timeout)
 * - 30-50% startup time reduction (lazy context loading)
 * - 40% reduction in timeout waste (progressive timeouts)
 * - Real-time visibility into agent progress (streaming + heartbeat)
 *
 * Created: Generation 20
 * Based on: local-only-health.js, local-only-lazy.js, local-only-progressive.js, local-only-streaming.js
 */

import { spawn } from 'child_process';
import { watch, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync, renameSync, appendFileSync } from 'fs';
import { join, basename } from 'path';
import { EventEmitter } from 'events';

// ============================================================================
// Configuration - All Features Combined
// ============================================================================

const CONFIG = {
  // Core settings
  maxConcurrentAgents: parseInt(process.env.MAX_CONCURRENT_AGENTS || '5'),
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '1000'),
  swarmDir: process.env.SWARM_DIR || '.swarm',

  // Hypothesis 1: Health Check
  healthCheckTimeoutMs: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || '15000'), // 15s
  skipHealthCheck: process.env.SKIP_HEALTH_CHECK === 'true',
  enableHealthCheckLog: process.env.LOG_HEALTH_CHECK === 'true',

  // Hypothesis 2: Lazy Context Loading
  contextMode: process.env.CONTEXT_MODE || 'lazy', // 'lazy' or 'full'
  maxEssentialRequirements: parseInt(process.env.MAX_ESSENTIAL_REQUIREMENTS || '3'),
  maxInlineContextChars: parseInt(process.env.MAX_INLINE_CONTEXT_CHARS || '500'),
  enableContextFiles: process.env.ENABLE_CONTEXT_FILES !== 'false',

  // Hypothesis 3: Progressive Timeout
  initialTimeoutMs: parseInt(process.env.INITIAL_TIMEOUT_MS || '60000'), // 60s start
  maxTimeoutMs: parseInt(process.env.MAX_TIMEOUT_MS || '240000'), // 240s max
  timeoutExtensionMs: parseInt(process.env.TIMEOUT_EXTENSION_MS || '60000'), // 60s increments
  activityWindowMs: parseInt(process.env.ACTIVITY_WINDOW_MS || '30000'), // 30s activity window
  minOutputBurstForExtension: parseInt(process.env.MIN_OUTPUT_BURSTS || '2'),
  progressCheckIntervalMs: parseInt(process.env.PROGRESS_CHECK_INTERVAL_MS || '15000'),

  // Hypothesis 4: Streaming + Heartbeat
  heartbeatCheckIntervalMs: parseInt(process.env.HEARTBEAT_CHECK_INTERVAL_MS || '15000'),
  silenceWarningMs: parseInt(process.env.SILENCE_WARNING_MS || '45000'),
  heartbeatTimeoutMs: parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '90000'),
  enableStreamingLog: process.env.LOG_AGENT_OUTPUT === 'true',
  enableIncrementalFiles: process.env.ENABLE_INCREMENTAL_FILES !== 'false',
  enableProgressLog: process.env.LOG_PROGRESS === 'true',
};

// ============================================================================
// Task Complexity Estimator (from Hypothesis 3)
// ============================================================================

function estimateTaskComplexity(request) {
  const task = request.task || {};
  const objective = (task.objective || '').toLowerCase();
  const requirementsCount = (task.requirements || []).length;
  const contextSize = JSON.stringify(task.context || {}).length;

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

  let score = 0;
  if (indicators.hasChildSpawning) score += 4;
  if (indicators.hasResearch) score += 3;
  if (indicators.hasImplementation) score += 3;
  if (indicators.hasMultiStep) score += 2;
  if (indicators.hasFileOps) score += 2;
  if (indicators.hasMultipleReqs) score += 2;
  if (indicators.hasTestOps) score += 2;
  if (indicators.largeContext) score += 1;

  let complexity, initialTimeout;
  if (score >= 6) {
    complexity = 'complex';
    initialTimeout = 180000; // 180s
  } else if (score >= 3) {
    complexity = 'moderate';
    initialTimeout = 120000; // 120s
  } else {
    complexity = 'simple';
    initialTimeout = CONFIG.initialTimeoutMs; // 60s
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
// Context Size Analyzer (from Hypothesis 2)
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
// Fully Optimized Agent Process Manager
// ============================================================================

class AgentProcessManager extends EventEmitter {
  constructor() {
    super();
    this.activeAgents = new Map();
    this.completedCount = 0;
    this.failedCount = 0;

    // Hypothesis 1 stats
    this.healthCheckSuccesses = 0;
    this.healthCheckFailures = 0;

    // Hypothesis 2 stats
    this.lazyContextUsed = 0;
    this.fullContextUsed = 0;
    this.contextBytesLoaded = 0;
    this.contextBytesAvailable = 0;

    // Hypothesis 3 stats
    this.timeoutExtensions = 0;
    this.earlyTimeouts = 0;

    // Hypothesis 4 stats
    this.heartbeatTimeouts = 0;
    this.silenceWarnings = 0;
  }

  get activeCount() {
    return this.activeAgents.size;
  }

  canSpawn() {
    return this.activeCount < CONFIG.maxConcurrentAgents;
  }

  // -------------------------------------------------------------------------
  // PHASE 1: Health Check Probe (Hypothesis 1)
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Main Agent Spawn - Combining All Hypotheses
  // -------------------------------------------------------------------------

  async spawnAgent(requestId, request) {
    if (!this.canSpawn()) {
      console.log(`\u23f3 Queue full (${this.activeCount}/${CONFIG.maxConcurrentAgents}), will retry...`);
      return null;
    }

    // PHASE 1: Health Check (Hypothesis 1)
    console.log(`\ud83e\ude7a Health check for: ${request.agentRole || 'worker'} (${requestId.slice(0, 8)}...)`);
    const healthResult = await this.performHealthCheck(requestId);

    if (!healthResult.success) {
      console.log(`\u274c Health check failed for ${requestId.slice(0, 8)}: ${healthResult.message}`);
      this.failedCount++;
      this.saveResult(requestId, 'failed', healthResult.message, healthResult.durationMs, -1, 'HEALTH_CHECK_FAILED');
      this.emit('healthCheckFailed', { requestId, result: healthResult });
      return requestId;
    }

    console.log(`\u2705 Health check passed (${healthResult.durationMs}ms), spawning agent...`);

    // PHASE 2: Analyze Context and Task Complexity (Hypotheses 2 & 3)
    const contextAnalysis = analyzeContextSize(request);
    const complexity = estimateTaskComplexity(request);

    const useLazy = CONFIG.contextMode === 'lazy' && contextAnalysis.isLargeContext;
    if (useLazy) {
      this.lazyContextUsed++;
    } else {
      this.fullContextUsed++;
    }

    // Save full context to file if using lazy loading
    let contextFilePath = null;
    if (useLazy && CONFIG.enableContextFiles) {
      contextFilePath = this.saveContextFile(requestId, request);
    }

    // Build agent context
    const agentContext = {
      requestId,
      request,
      startTime: Date.now(),
      healthCheckDurationMs: healthResult.durationMs,
      process: null,
      timeout: null,
      progressInterval: null,
      heartbeatInterval: null,

      // Hypothesis 2: Lazy context
      contextAnalysis,
      usedLazyLoading: useLazy,
      contextLoadedFromFile: false,

      // Hypothesis 3: Progressive timeout
      complexity,
      currentTimeoutMs: complexity.initialTimeout,
      maxTimeoutMs: complexity.maxTimeout,
      extensionsApplied: 0,

      // Hypothesis 4: Streaming + heartbeat
      lastHeartbeat: Date.now(),
      silenceWarned: false,
      outputStream: [],
      totalOutputBytes: 0,
      firstOutputTime: null,
    };

    // PHASE 3: Build Prompt (Hypothesis 2 - Lazy vs Full)
    const prompt = useLazy
      ? this.buildLazyContextPrompt(requestId, request, contextFilePath, contextAnalysis)
      : this.buildFullContextPrompt(requestId, request);

    console.log(`\ud83d\ude80 Spawning agent: ${request.agentRole || 'worker'} (${requestId.slice(0, 8)}...)`);
    console.log(`   Complexity: ${complexity.complexity} (score: ${complexity.score}), initial timeout: ${complexity.initialTimeout / 1000}s`);
    console.log(`   Context mode: ${useLazy ? 'lazy' : 'full'}, context size: ${contextAnalysis.contextChars} chars`);

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

    // Initialize incremental output file (Hypothesis 4)
    if (CONFIG.enableIncrementalFiles) {
      this.initIncrementalFile(requestId, request, contextAnalysis, complexity, useLazy);
    }

    claudeProcess.stdin.write(prompt);
    claudeProcess.stdin.end();

    // PHASE 4: Stream Output with Heartbeat (Hypothesis 4)
    let stdout = '';
    claudeProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;

      // Update heartbeat
      agentContext.lastHeartbeat = Date.now();
      agentContext.silenceWarned = false;

      // Track first output (startup latency)
      if (agentContext.firstOutputTime === null) {
        agentContext.firstOutputTime = Date.now();
        const startupLatency = agentContext.firstOutputTime - agentContext.startTime;
        console.log(`   [\u23f1] First output after ${startupLatency}ms`);
      }

      // Track output stream
      agentContext.outputStream.push({
        timestamp: Date.now(),
        bytes: data.length,
      });
      agentContext.totalOutputBytes += data.length;

      // Check if agent loaded context file (Hypothesis 2)
      if (!agentContext.contextLoadedFromFile &&
          (chunk.includes('cat ') && chunk.includes('.swarm/context/'))) {
        agentContext.contextLoadedFromFile = true;
        console.log(`   [\ud83d\udcc4] Agent loaded context file`);
      }

      // Log streaming output
      if (CONFIG.enableStreamingLog) {
        const preview = chunk.slice(0, 100).replace(/\n/g, '\\n');
        console.log(`\ud83d\udcdd [${requestId.slice(0, 8)}] ${preview}${chunk.length > 100 ? '...' : ''}`);
      }

      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(requestId, chunk);
      }

      // Check for timeout extension (Hypothesis 3)
      this.checkForTimeoutExtension(requestId, agentContext);
    });

    let stderr = '';
    claudeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      agentContext.lastHeartbeat = Date.now();
      agentContext.silenceWarned = false;

      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(requestId, `[STDERR] ${data.toString()}`);
      }
    });

    // Set up heartbeat monitoring (Hypothesis 4)
    agentContext.heartbeatInterval = setInterval(() => {
      this.checkHeartbeat(requestId, agentContext);
    }, CONFIG.heartbeatCheckIntervalMs);

    // Set up progress monitoring (Hypothesis 3)
    agentContext.progressInterval = setInterval(() => {
      this.monitorProgress(requestId, agentContext);
    }, CONFIG.progressCheckIntervalMs);

    // Set initial progressive timeout (Hypothesis 3)
    this.setProgressiveTimeout(agentContext);

    // Handle completion
    claudeProcess.on('close', (code) => {
      clearTimeout(agentContext.timeout);
      clearInterval(agentContext.heartbeatInterval);
      clearInterval(agentContext.progressInterval);
      this.activeAgents.delete(requestId);

      const duration = Date.now() - agentContext.startTime;
      const totalDuration = duration; // Health check duration tracked separately
      const stats = this.calculateCombinedStats(agentContext, duration);

      // Track context efficiency (Hypothesis 2)
      this.contextBytesAvailable += contextAnalysis.totalChars;
      if (agentContext.contextLoadedFromFile) {
        this.contextBytesLoaded += contextAnalysis.contextChars;
      } else if (!useLazy) {
        this.contextBytesLoaded += contextAnalysis.totalChars;
      }

      if (code === 0) {
        this.completedCount++;
        this.saveResult(requestId, 'success', stdout, totalDuration, code, null, stats);
        console.log(`\u2705 Agent ${requestId.slice(0, 8)} completed in ${(totalDuration / 1000).toFixed(1)}s`);
        console.log(`   Health: ${agentContext.healthCheckDurationMs}ms | Startup: ${stats.startupLatencyMs}ms | Extensions: ${stats.extensionsApplied}`);
      } else {
        this.failedCount++;
        this.saveResult(requestId, 'failed', stderr || stdout, totalDuration, code, null, stats);
        console.log(`\u274c Agent ${requestId.slice(0, 8)} failed (exit ${code}) in ${(totalDuration / 1000).toFixed(1)}s`);
      }

      if (CONFIG.enableIncrementalFiles) {
        this.finalizeIncrementalFile(requestId, code, duration, stats);
      }

      this.emit('agentComplete', { requestId, code, duration: totalDuration, stats });
    });

    claudeProcess.on('error', (error) => {
      clearTimeout(agentContext.timeout);
      clearInterval(agentContext.heartbeatInterval);
      clearInterval(agentContext.progressInterval);
      this.activeAgents.delete(requestId);
      this.failedCount++;
      this.saveResult(requestId, 'failed', error.message, Date.now() - agentContext.startTime, -1);
      console.log(`\ud83d\udca5 Agent ${requestId.slice(0, 8)} error: ${error.message}`);
      this.emit('agentError', { requestId, error });
    });

    return requestId;
  }

  // -------------------------------------------------------------------------
  // Heartbeat Monitoring (Hypothesis 4)
  // -------------------------------------------------------------------------

  checkHeartbeat(requestId, agentContext) {
    const silenceDuration = Date.now() - agentContext.lastHeartbeat;
    const elapsed = Date.now() - agentContext.startTime;

    // 45s silence warning
    if (silenceDuration > CONFIG.silenceWarningMs && !agentContext.silenceWarned) {
      agentContext.silenceWarned = true;
      this.silenceWarnings++;
      console.log(`\u26a0\ufe0f  Agent ${requestId.slice(0, 8)} silent for ${(silenceDuration / 1000).toFixed(0)}s (${agentContext.totalOutputBytes} bytes so far)`);

      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(requestId, `\n[COORDINATOR WARNING] Agent silent for ${(silenceDuration / 1000).toFixed(0)}s at ${elapsed}ms elapsed\n`);
      }

      this.emit('silenceWarning', { requestId, silenceDuration, totalOutput: agentContext.totalOutputBytes });
    }

    // Heartbeat timeout only if no progress and exceeding heartbeat threshold
    // But let progressive timeout handle main timeout logic
    if (silenceDuration > CONFIG.heartbeatTimeoutMs && !this.showsProgress(agentContext)) {
      console.log(`\ud83d\udc80 Agent ${requestId.slice(0, 8)} heartbeat timeout after ${(silenceDuration / 1000).toFixed(0)}s silence`);
      this.heartbeatTimeouts++;
      this.killAgent(requestId, 'HEARTBEAT_TIMEOUT');
    }
  }

  // -------------------------------------------------------------------------
  // Progressive Timeout (Hypothesis 3)
  // -------------------------------------------------------------------------

  setProgressiveTimeout(agentContext) {
    clearTimeout(agentContext.timeout);

    const elapsed = Date.now() - agentContext.startTime;
    const remainingTime = Math.max(0, agentContext.currentTimeoutMs - elapsed);

    agentContext.timeout = setTimeout(() => {
      const finalElapsed = Date.now() - agentContext.startTime;
      console.log(`\u23f0 Agent ${agentContext.requestId.slice(0, 8)} timed out after ${(finalElapsed / 1000).toFixed(1)}s (${agentContext.extensionsApplied} extensions)`);

      if (agentContext.extensionsApplied === 0) {
        this.earlyTimeouts++;
      }

      this.killAgent(agentContext.requestId, 'PROGRESSIVE_TIMEOUT');
    }, remainingTime);
  }

  showsProgress(agentContext) {
    const timeSinceLastOutput = Date.now() - agentContext.lastHeartbeat;
    const recentCheckpoints = agentContext.outputStream.filter(
      c => Date.now() - c.timestamp < CONFIG.activityWindowMs
    );

    const hasRecentOutput = timeSinceLastOutput < CONFIG.activityWindowMs;
    const hasMultipleBursts = recentCheckpoints.length >= CONFIG.minOutputBurstForExtension;

    return hasRecentOutput && hasMultipleBursts;
  }

  checkForTimeoutExtension(requestId, agentContext) {
    const elapsed = Date.now() - agentContext.startTime;
    const timeUntilTimeout = agentContext.currentTimeoutMs - elapsed;

    // Only extend if getting close to timeout (within 30s)
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

      console.log(`\u2b06 Extending timeout for ${agentContext.requestId.slice(0, 8)} to ${newTimeout / 1000}s (extension #${agentContext.extensionsApplied})`);

      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(
          agentContext.requestId,
          `\n[COORDINATOR] Timeout extended to ${newTimeout / 1000}s at ${elapsed}ms (extension #${agentContext.extensionsApplied})\n`
        );
      }

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
    const timeSinceOutput = Date.now() - agentContext.lastHeartbeat;
    const timeRemaining = agentContext.currentTimeoutMs - elapsed;

    if (CONFIG.enableProgressLog) {
      const status = timeSinceOutput < 15000 ? 'active' : timeSinceOutput < 30000 ? 'slowing' : 'silent';
      console.log(`   [${requestId.slice(0, 8)}] Progress: ${elapsed}ms elapsed, ${timeRemaining}ms remaining, ${status}`);
    }

    // Warn if going silent near timeout
    if (timeSinceOutput > 30000 && timeRemaining < 45000 && timeRemaining > 0) {
      console.log(`\u26a0\ufe0f  Agent ${requestId.slice(0, 8)} silent for ${(timeSinceOutput / 1000).toFixed(0)}s with ${(timeRemaining / 1000).toFixed(0)}s remaining`);

      if (CONFIG.enableIncrementalFiles) {
        this.appendIncrementalOutput(
          requestId,
          `\n[COORDINATOR WARNING] Agent silent for ${(timeSinceOutput / 1000).toFixed(0)}s with ${(timeRemaining / 1000).toFixed(0)}s remaining\n`
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  // Context File Management (Hypothesis 2)
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Prompt Builders (Hypothesis 2)
  // -------------------------------------------------------------------------

  buildLazyContextPrompt(requestId, request, contextFilePath, contextAnalysis) {
    const task = request.task || {};
    const swarmDir = CONFIG.swarmDir;

    const essentialRequirements = (task.requirements || []).slice(0, CONFIG.maxEssentialRequirements);
    const remainingCount = Math.max(0, (task.requirements || []).length - CONFIG.maxEssentialRequirements);

    let inlineContext = '';
    if (contextAnalysis.contextChars <= CONFIG.maxInlineContextChars) {
      inlineContext = `
INLINE CONTEXT (small enough to include):
${JSON.stringify(task.context || {}, null, 2)}`;
    }

    const contextPointers = {
      full_context: contextFilePath,
      context_size: `${contextAnalysis.contextChars} chars`,
      context_keys: contextAnalysis.contextKeys,
      additional_requirements: remainingCount > 0 ? `${remainingCount} more in context file` : 'none',
      parent_result: request.parentRequestId
        ? join(swarmDir, 'results', `${request.parentRequestId}.json`)
        : null,
    };

    return `You are Agent "${request.agentRole || 'worker'}" in a multi-agent swarm.

REQUEST ID: ${requestId}
PARENT: ${request.parentRequestId || 'none (you are root)'}

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
TASK OBJECTIVE:
${task.objective || 'No objective specified'}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

ESSENTIAL REQUIREMENTS:
${essentialRequirements.map(r => `\u2022 ${r}`).join('\n') || '\u2022 Complete the task'}
${remainingCount > 0 ? `\u2022 ... and ${remainingCount} more requirements (see full context)` : ''}
${inlineContext}

CONTEXT LOADING (use if needed):
${JSON.stringify(contextPointers, null, 2)}

To load full context:
  cat ${contextFilePath}

To load parent's result (if exists):
  ${request.parentRequestId ? `cat ${contextPointers.parent_result}` : '# No parent request'}

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
INSTRUCTIONS:
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

1. Start working on your task immediately
2. Load additional context ONLY if essential information is missing
3. If you need full requirements, cat the context file
4. Be concise but thorough
5. If you need to spawn a child agent, create a JSON file in ${swarmDir}/requests/

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

  // -------------------------------------------------------------------------
  // Stats Calculation
  // -------------------------------------------------------------------------

  calculateCombinedStats(agentContext, actualDuration) {
    const startupLatency = agentContext.firstOutputTime
      ? agentContext.firstOutputTime - agentContext.startTime
      : null;

    // Calculate time between output bursts
    const stream = agentContext.outputStream;
    let avgTimeBetweenBursts = null;
    if (stream.length > 1) {
      let totalGap = 0;
      for (let i = 1; i < stream.length; i++) {
        totalGap += stream[i].timestamp - stream[i - 1].timestamp;
      }
      avgTimeBetweenBursts = totalGap / (stream.length - 1);
    }

    return {
      // Hypothesis 1: Health check
      healthCheckMs: agentContext.healthCheckDurationMs,

      // Hypothesis 2: Lazy context
      contextMode: agentContext.usedLazyLoading ? 'lazy' : 'full',
      contextSizeChars: agentContext.contextAnalysis.totalChars,
      contextLoadedFromFile: agentContext.contextLoadedFromFile,
      contextEfficiency: agentContext.contextLoadedFromFile
        ? 'loaded-on-demand'
        : (agentContext.usedLazyLoading ? 'deferred-unused' : 'inline-full'),

      // Hypothesis 3: Progressive timeout
      complexity: agentContext.complexity.complexity,
      complexityScore: agentContext.complexity.score,
      initialTimeoutMs: agentContext.complexity.initialTimeout,
      finalTimeoutMs: agentContext.currentTimeoutMs,
      extensionsApplied: agentContext.extensionsApplied,
      wastedTimeMs: agentContext.currentTimeoutMs - actualDuration,

      // Hypothesis 4: Streaming
      startupLatencyMs: startupLatency,
      actualDurationMs: actualDuration,
      totalOutputBytes: agentContext.totalOutputBytes,
      outputBursts: agentContext.outputStream.length,
      avgTimeBetweenBurstsMs: avgTimeBetweenBursts,
      timeToFirstOutputMs: startupLatency,
    };
  }

  // -------------------------------------------------------------------------
  // Incremental File Management (Hypothesis 4)
  // -------------------------------------------------------------------------

  initIncrementalFile(requestId, request, contextAnalysis, complexity, useLazy) {
    const logsDir = join(CONFIG.swarmDir, 'logs');
    mkdirSync(logsDir, { recursive: true });

    const streamFile = join(logsDir, `${requestId}.stream.txt`);
    const header = `=== Optimized Coordinator Agent Log ===
Request ID: ${requestId}
Role: ${request.agentRole || 'worker'}
Started: ${new Date().toISOString()}

--- Hypothesis 1: Health Check ---
Status: Will run before agent spawn

--- Hypothesis 2: Lazy Context ---
Context Mode: ${useLazy ? 'lazy' : 'full'}
Context Size: ${contextAnalysis.totalChars} chars
Requirements: ${contextAnalysis.requirementsCount} total

--- Hypothesis 3: Progressive Timeout ---
Complexity: ${complexity.complexity} (score: ${complexity.score})
Initial Timeout: ${complexity.initialTimeout}ms
Max Timeout: ${complexity.maxTimeout}ms

--- Hypothesis 4: Streaming ---
Incremental logging: enabled
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

  finalizeIncrementalFile(requestId, exitCode, duration, stats) {
    try {
      const streamFile = join(CONFIG.swarmDir, 'logs', `${requestId}.stream.txt`);
      const footer = `
==========================================
=== Final Statistics ===
Completed: ${new Date().toISOString()}
Exit Code: ${exitCode}
Duration: ${duration}ms

Health Check: ${stats.healthCheckMs}ms
Startup Latency: ${stats.startupLatencyMs}ms
Context Mode: ${stats.contextMode}
Context Loaded: ${stats.contextLoadedFromFile}
Complexity: ${stats.complexity}
Extensions Applied: ${stats.extensionsApplied}
Final Timeout: ${stats.finalTimeoutMs}ms
Timeout Waste: ${stats.wastedTimeMs}ms
Output Bytes: ${stats.totalOutputBytes}
Output Bursts: ${stats.outputBursts}
==========================================
`;
      appendFileSync(streamFile, footer);
    } catch (error) {
      // Ignore errors
    }
  }

  // -------------------------------------------------------------------------
  // Agent Lifecycle
  // -------------------------------------------------------------------------

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

  saveResult(requestId, status, output, durationMs, exitCode = 0, failureReason = null, stats = null) {
    const resultsDir = join(CONFIG.swarmDir, 'results');
    mkdirSync(resultsDir, { recursive: true });

    const result = {
      requestId,
      status,
      output: output.slice(0, 50000),
      durationMs,
      exitCode,
      failureReason,
      stats,
      completedAt: new Date().toISOString(),
      coordinator: 'local-only-optimized',
    };

    const resultFile = join(resultsDir, `${requestId}.json`);
    writeFileSync(resultFile, JSON.stringify(result, null, 2));
  }

  getStatus() {
    const contextEfficiency = this.contextBytesAvailable > 0
      ? ((this.contextBytesLoaded / this.contextBytesAvailable) * 100).toFixed(1)
      : '0.0';

    return {
      // Core stats
      active: this.activeCount,
      completed: this.completedCount,
      failed: this.failedCount,
      maxConcurrent: CONFIG.maxConcurrentAgents,

      // Hypothesis 1 stats
      healthCheckSuccesses: this.healthCheckSuccesses,
      healthCheckFailures: this.healthCheckFailures,

      // Hypothesis 2 stats
      lazyContextUsed: this.lazyContextUsed,
      fullContextUsed: this.fullContextUsed,
      contextEfficiencyPercent: contextEfficiency,

      // Hypothesis 3 stats
      timeoutExtensions: this.timeoutExtensions,
      earlyTimeouts: this.earlyTimeouts,

      // Hypothesis 4 stats
      heartbeatTimeouts: this.heartbeatTimeouts,
      silenceWarnings: this.silenceWarnings,

      // Active agents detail
      agents: Array.from(this.activeAgents.entries()).map(([id, ctx]) => ({
        requestId: id,
        role: ctx.request.agentRole,
        runningMs: Date.now() - ctx.startTime,
        complexity: ctx.complexity?.complexity,
        currentTimeoutMs: ctx.currentTimeoutMs,
        timeRemainingMs: ctx.currentTimeoutMs - (Date.now() - ctx.startTime),
        extensionsApplied: ctx.extensionsApplied,
        lastHeartbeatMs: Date.now() - ctx.lastHeartbeat,
        outputBytes: ctx.totalOutputBytes,
        contextMode: ctx.usedLazyLoading ? 'lazy' : 'full',
        contextLoaded: ctx.contextLoadedFromFile,
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
  console.log('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  console.log('\u2551     CLAUDE SWARM - Fully Optimized Coordinator (Gen 20)      \u2551');
  console.log('\u2551   Combining: Health + Lazy + Progressive + Streaming         \u2551');
  console.log('\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563');
  console.log('\u2551  [H1] Health Check: ' + `${CONFIG.healthCheckTimeoutMs / 1000}s timeout, skip=${CONFIG.skipHealthCheck}`.padEnd(40) + '\u2551');
  console.log('\u2551  [H2] Lazy Context: ' + `${CONFIG.contextMode}, max inline=${CONFIG.maxInlineContextChars} chars`.padEnd(40) + '\u2551');
  console.log('\u2551  [H3] Progressive:  ' + `${CONFIG.initialTimeoutMs / 1000}s-${CONFIG.maxTimeoutMs / 1000}s, +${CONFIG.timeoutExtensionMs / 1000}s ext`.padEnd(40) + '\u2551');
  console.log('\u2551  [H4] Heartbeat:    ' + `${CONFIG.silenceWarningMs / 1000}s warn, ${CONFIG.heartbeatTimeoutMs / 1000}s timeout`.padEnd(40) + '\u2551');
  console.log('\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563');
  console.log(`\u2551  Max concurrent: ${CONFIG.maxConcurrentAgents.toString().padEnd(43)}\u2551`);
  console.log(`\u2551  Swarm directory: ${CONFIG.swarmDir.padEnd(42)}\u2551`);
  console.log(`\u2551  Incremental files: ${CONFIG.enableIncrementalFiles.toString().padEnd(40)}\u2551`);
  console.log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d');
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
    const statusStr = `Active: ${status.active} | Done: ${status.completed} | Fail: ${status.failed} | HC: ${status.healthCheckSuccesses}/${status.healthCheckFailures} | Ext: ${status.timeoutExtensions}`;

    if (statusStr !== lastStatus && (status.active > 0 || status.completed > 0 || status.failed > 0)) {
      console.log(`\ud83d\udcca ${statusStr}`);

      // Show details for active agents
      if (status.agents.length > 0) {
        for (const agent of status.agents) {
          const heartbeatStatus = agent.lastHeartbeatMs < CONFIG.silenceWarningMs ? '\ud83d\udc9a' : '\u26a0\ufe0f';
          const timeStatus = agent.timeRemainingMs > 30000 ? '' : agent.timeRemainingMs > 10000 ? '\u23f3' : '\ud83d\udea8';
          console.log(`   ${heartbeatStatus}${timeStatus} ${agent.requestId.slice(0, 8)}: ${(agent.runningMs / 1000).toFixed(0)}s/${(agent.currentTimeoutMs / 1000).toFixed(0)}s, ${agent.complexity || '?'}, ${agent.contextMode}, ${agent.extensionsApplied}ext, ${agent.outputBytes}B`);
        }
      }

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

    // Print final stats
    console.log('');
    console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
    console.log('  FINAL STATISTICS');
    console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
    console.log(`  Completed: ${status.completed}`);
    console.log(`  Failed: ${status.failed}`);
    console.log('');
    console.log('  [H1] Health Check:');
    console.log(`       Successes: ${status.healthCheckSuccesses}`);
    console.log(`       Failures: ${status.healthCheckFailures}`);
    console.log('');
    console.log('  [H2] Lazy Context:');
    console.log(`       Lazy used: ${status.lazyContextUsed}`);
    console.log(`       Full used: ${status.fullContextUsed}`);
    console.log(`       Efficiency: ${status.contextEfficiencyPercent}%`);
    console.log('');
    console.log('  [H3] Progressive Timeout:');
    console.log(`       Extensions: ${status.timeoutExtensions}`);
    console.log(`       Early timeouts: ${status.earlyTimeouts}`);
    console.log('');
    console.log('  [H4] Heartbeat:');
    console.log(`       Timeouts: ${status.heartbeatTimeouts}`);
    console.log(`       Silence warnings: ${status.silenceWarnings}`);
    console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
    console.log('');

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
