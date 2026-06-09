#!/usr/bin/env node
/**
 * Mock Coordinator for Testing
 *
 * Instead of spawning real claude processes, this creates mock results
 * to test the full coordination pipeline.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync, renameSync } from 'fs';
import { join, basename } from 'path';

const CONFIG = {
  swarmDir: process.env.SWARM_DIR || '.swarm',
  mockDelay: 1000, // 1 second delay to simulate work
  pollInterval: 500, // Poll every 500ms
};

console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         CLAUDE SWARM - Mock Coordinator (Testing)        ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

// Ensure directories
const requestsDir = join(CONFIG.swarmDir, 'requests');
const processingDir = join(CONFIG.swarmDir, 'processing');
const resultsDir = join(CONFIG.swarmDir, 'results');

mkdirSync(requestsDir, { recursive: true });
mkdirSync(processingDir, { recursive: true });
mkdirSync(resultsDir, { recursive: true });

let completed = 0;
const processed = new Set();

function processFile(filePath) {
  const filename = basename(filePath);

  // Skip if already processed
  if (processed.has(filename)) return;

  try {
    if (!existsSync(filePath)) return;

    const content = readFileSync(filePath, 'utf-8');
    const request = JSON.parse(content);
    const requestId = request.requestId || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Mark as processed immediately
    processed.add(filename);

    // Move to processing
    const processingPath = join(processingDir, filename);
    try {
      renameSync(filePath, processingPath);
    } catch (e) {
      return; // File gone or already moved
    }

    console.log(`📥 Request: ${requestId.slice(0, 12)} (${request.agentRole || 'worker'})`);
    console.log(`🤖 Processing...`);

    // Simulate work
    setTimeout(() => {
      const result = {
        requestId,
        status: 'success',
        output: {
          message: `Hello from mock agent "${request.agentRole}"!`,
          task: request.task?.objective || 'Unknown task',
          facts: [
            '42 is the answer to life, the universe, and everything',
            '42 is a pronic number (6 × 7)',
            '42 is the atomic number of molybdenum'
          ],
          timestamp: new Date().toISOString()
        },
        durationMs: CONFIG.mockDelay,
        completedAt: new Date().toISOString()
      };

      // Write result
      writeFileSync(join(resultsDir, `${requestId}.json`), JSON.stringify(result, null, 2));

      // Clean up
      try { unlinkSync(processingPath); } catch (e) {}

      completed++;
      console.log(`✅ Completed: ${requestId.slice(0, 12)} (total: ${completed})`);

      // Check if agent should spawn children
      if (request.task?.spawnChildren) {
        const numChildren = parseInt(request.task.spawnChildren) || 0;
        console.log(`👶 Spawning ${numChildren} child agents...`);

        for (let i = 0; i < numChildren; i++) {
          const childId = `child-${Date.now()}-${i}`;
          const childRequest = {
            requestId: childId,
            agentRole: `child-worker-${i + 1}`,
            parentRequestId: requestId,
            task: {
              objective: `Child task ${i + 1} from parent ${requestId.slice(0, 8)}`,
              context: { parentTask: request.task?.objective }
            }
          };
          const childFile = join(requestsDir, `${childId}.json`);
          writeFileSync(childFile, JSON.stringify(childRequest, null, 2));
          console.log(`   → Created: ${childId}`);
        }
      }
    }, CONFIG.mockDelay);

  } catch (error) {
    console.error(`Error processing ${filename}: ${error.message}`);
  }
}

function pollForRequests() {
  try {
    const files = readdirSync(requestsDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        processFile(join(requestsDir, file));
      }
    }
  } catch (e) {
    // Ignore errors
  }
}

console.log(`📂 Polling: ${requestsDir} (every ${CONFIG.pollInterval}ms)`);
console.log('🔍 Ready for requests');
console.log('');

// Poll continuously
setInterval(pollForRequests, CONFIG.pollInterval);

// Also poll immediately
pollForRequests();

// Keep alive
process.on('SIGINT', () => {
  console.log('\n👋 Mock coordinator stopped');
  console.log(`   Total completed: ${completed}`);
  process.exit(0);
});
