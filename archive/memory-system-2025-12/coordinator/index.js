/**
 * Claude Swarm Coordinator
 *
 * Watches Firebase for agent requests and spawns new Claude Code instances.
 * Enables unlimited nesting of agents via external coordination.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { spawn } from 'child_process';
import { Octokit } from '@octokit/rest';
import { config } from 'dotenv';
import { EventEmitter } from 'events';

config();

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  maxConcurrentAgents: parseInt(process.env.MAX_CONCURRENT_AGENTS || '10'),
  agentTimeoutSeconds: parseInt(process.env.AGENT_TIMEOUT_SECONDS || '300'),
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '1000'),
  github: {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    token: process.env.GITHUB_TOKEN,
  },
};

// ============================================================================
// Firebase Setup
// ============================================================================

const firebaseApp = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(firebaseApp);
const octokit = new Octokit({ auth: CONFIG.github.token });

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
      throw new Error(`Max concurrent agents (${CONFIG.maxConcurrentAgents}) reached`);
    }

    const agentContext = {
      requestId,
      request,
      startTime: Date.now(),
      process: null,
      timeout: null,
    };

    // Build the prompt for Claude
    const prompt = this.buildAgentPrompt(request);

    // Spawn claude with the prompt
    const claudeProcess = spawn('claude', ['-p', prompt, '--output-format', 'json'], {
      env: {
        ...process.env,
        SWARM_REQUEST_ID: requestId,
        SWARM_PARENT_ID: request.parentRequestId || '',
        SWARM_AGENT_ROLE: request.agentRole || 'general',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    agentContext.process = claudeProcess;
    this.activeAgents.set(requestId, agentContext);

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
      this.killAgent(requestId, 'TIMEOUT');
    }, CONFIG.agentTimeoutSeconds * 1000);

    // Handle completion
    claudeProcess.on('close', async (code) => {
      clearTimeout(agentContext.timeout);
      this.activeAgents.delete(requestId);

      const duration = Date.now() - agentContext.startTime;

      if (code === 0) {
        this.completedCount++;
        await this.reportSuccess(requestId, stdout, duration);
      } else {
        this.failedCount++;
        await this.reportFailure(requestId, stderr || stdout, code, duration);
      }

      this.emit('agentComplete', { requestId, code, duration });
    });

    claudeProcess.on('error', async (error) => {
      clearTimeout(agentContext.timeout);
      this.activeAgents.delete(requestId);
      this.failedCount++;
      await this.reportFailure(requestId, error.message, -1, Date.now() - agentContext.startTime);
      this.emit('agentError', { requestId, error });
    });

    return requestId;
  }

  buildAgentPrompt(request) {
    const task = request.task || {};

    return `You are Agent "${request.agentRole || 'worker'}" in a multi-agent swarm.

TASK OBJECTIVE:
${task.objective || 'No objective specified'}

CONTEXT:
${JSON.stringify(task.context || {}, null, 2)}

REQUIREMENTS:
${(task.requirements || []).map(r => `- ${r}`).join('\n') || '- Complete the task'}

COORDINATION INSTRUCTIONS:
- Your request ID is: ${request.requestId || 'unknown'}
- Parent request ID: ${request.parentRequestId || 'none (you are root)'}
- You CAN spawn child agents by writing to .swarm/requests/
- Results should be written to .swarm/results/${request.requestId || 'output'}.json

If you need to spawn a child agent, create a file like:
.swarm/requests/child-{unique-id}.json with structure:
{
  "agentRole": "specialist",
  "parentRequestId": "${request.requestId}",
  "task": {
    "objective": "...",
    "context": {...},
    "requirements": [...]
  }
}

Complete the task and write your final result.`;
  }

  killAgent(requestId, reason) {
    const agent = this.activeAgents.get(requestId);
    if (agent && agent.process) {
      agent.process.kill('SIGTERM');
      this.emit('agentKilled', { requestId, reason });
    }
  }

  async reportSuccess(requestId, output, durationMs) {
    try {
      // Parse JSON output if possible
      let parsedOutput;
      try {
        parsedOutput = JSON.parse(output);
      } catch {
        parsedOutput = { text: output };
      }

      await db.collection('agent_results').doc(requestId).set({
        requestId,
        status: 'success',
        output: parsedOutput,
        durationMs,
        completedAt: new Date().toISOString(),
      });

      await db.collection('agent_requests').doc(requestId).update({
        status: 'completed',
      });

      console.log(`✓ Agent ${requestId} completed in ${durationMs}ms`);
    } catch (error) {
      console.error(`Failed to report success for ${requestId}:`, error);
    }
  }

  async reportFailure(requestId, error, exitCode, durationMs) {
    try {
      await db.collection('agent_results').doc(requestId).set({
        requestId,
        status: 'failed',
        error: {
          message: error,
          exitCode,
        },
        durationMs,
        completedAt: new Date().toISOString(),
      });

      await db.collection('agent_requests').doc(requestId).update({
        status: 'failed',
      });

      console.log(`✗ Agent ${requestId} failed (exit ${exitCode}) in ${durationMs}ms`);
    } catch (err) {
      console.error(`Failed to report failure for ${requestId}:`, err);
    }
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
// Request Watcher
// ============================================================================

class RequestWatcher {
  constructor(processManager) {
    this.processManager = processManager;
    this.unsubscribe = null;
  }

  start() {
    console.log('🔍 Watching for agent requests...');

    this.unsubscribe = db
      .collection('agent_requests')
      .where('status', '==', 'pending')
      .onSnapshot(async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added') {
            await this.handleNewRequest(change.doc);
          }
        }
      });
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  async handleNewRequest(doc) {
    const requestId = doc.id;
    const request = doc.data();

    console.log(`📥 New request: ${requestId} (role: ${request.agentRole})`);

    try {
      // Mark as acknowledged
      await db.collection('agent_requests').doc(requestId).update({
        status: 'acknowledged',
        acknowledgedAt: new Date().toISOString(),
      });

      // Check if we can spawn
      if (!this.processManager.canSpawn()) {
        console.log(`⏳ Queue full, waiting for slot...`);
        // Re-mark as pending so it gets picked up later
        await db.collection('agent_requests').doc(requestId).update({
          status: 'pending',
        });
        return;
      }

      // Update to executing
      await db.collection('agent_requests').doc(requestId).update({
        status: 'executing',
        startedAt: new Date().toISOString(),
      });

      // Spawn the agent
      await this.processManager.spawnAgent(requestId, { ...request, requestId });

      // Log to GitHub if configured
      if (CONFIG.github.owner && CONFIG.github.repo) {
        await this.logToGitHub(requestId, request);
      }

    } catch (error) {
      console.error(`Failed to handle request ${requestId}:`, error);
      await db.collection('agent_requests').doc(requestId).update({
        status: 'failed',
        error: error.message,
      });
    }
  }

  async logToGitHub(requestId, request) {
    try {
      // Create or update a tracking issue
      const title = `[swarm] Agent: ${request.agentRole} - ${requestId.slice(0, 8)}`;
      const body = `## Agent Request

**Request ID:** \`${requestId}\`
**Role:** ${request.agentRole}
**Parent:** ${request.parentRequestId || 'root'}

### Task
\`\`\`json
${JSON.stringify(request.task, null, 2)}
\`\`\`

---
*Tracked by claude-swarm coordinator*`;

      await octokit.issues.create({
        owner: CONFIG.github.owner,
        repo: CONFIG.github.repo,
        title,
        body,
        labels: ['swarm-agent', 'in-progress'],
      });
    } catch (error) {
      // Non-fatal, just log
      console.error('Failed to log to GitHub:', error.message);
    }
  }
}

// ============================================================================
// File Watcher for Local Requests
// ============================================================================

import { watch, existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

class LocalRequestWatcher {
  constructor(processManager, swarmDir) {
    this.processManager = processManager;
    this.swarmDir = swarmDir;
    this.requestsDir = join(swarmDir, 'requests');
    this.watcher = null;
  }

  start() {
    // Ensure directories exist
    if (!existsSync(this.swarmDir)) {
      mkdirSync(this.swarmDir, { recursive: true });
    }
    if (!existsSync(this.requestsDir)) {
      mkdirSync(this.requestsDir, { recursive: true });
    }

    console.log(`📂 Watching local requests: ${this.requestsDir}`);

    // Process existing files
    this.processExistingFiles();

    // Watch for new files
    this.watcher = watch(this.requestsDir, async (eventType, filename) => {
      if (eventType === 'rename' && filename && filename.endsWith('.json')) {
        await this.processFile(join(this.requestsDir, filename));
      }
    });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
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
      console.error('Error processing existing files:', error);
    }
  }

  async processFile(filePath) {
    try {
      if (!existsSync(filePath)) return;

      const content = readFileSync(filePath, 'utf-8');
      const request = JSON.parse(content);
      const requestId = request.requestId || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      console.log(`📄 Local request: ${requestId}`);

      // Write to Firebase
      await db.collection('agent_requests').doc(requestId).set({
        ...request,
        requestId,
        status: 'pending',
        source: 'local',
        createdAt: new Date().toISOString(),
      });

      // Remove the processed file
      unlinkSync(filePath);

    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Claude Swarm Coordinator');
  console.log('  Multi-Agent Coordination with Firebase + GitHub');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Max concurrent agents: ${CONFIG.maxConcurrentAgents}`);
  console.log(`  Agent timeout: ${CONFIG.agentTimeoutSeconds}s`);
  console.log(`  GitHub: ${CONFIG.github.owner}/${CONFIG.github.repo || '(not configured)'}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const processManager = new AgentProcessManager();
  const firebaseWatcher = new RequestWatcher(processManager);
  const localWatcher = new LocalRequestWatcher(processManager, '.swarm');

  // Start watchers
  firebaseWatcher.start();
  localWatcher.start();

  // Status logging
  setInterval(() => {
    const status = processManager.getStatus();
    if (status.active > 0) {
      console.log(`📊 Active: ${status.active}/${status.maxConcurrent} | Completed: ${status.completed} | Failed: ${status.failed}`);
    }
  }, 10000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    firebaseWatcher.stop();
    localWatcher.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Terminating...');
    firebaseWatcher.stop();
    localWatcher.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
