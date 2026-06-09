/**
 * Example: Using Smart Memory Summarization in Agent Bootstrap
 *
 * This example demonstrates how to use the memory summarizer
 * to provide intelligent context to spawned agents.
 */

import { storeMemory } from '../memory/memory-store';
import { summarizeMemoriesForAgent, formatSummaryForPrompt } from './memory-summarizer';
import { buildSmartBootstrapPrompt } from './bootstrap-loader';

async function example() {
  console.log('=== Smart Memory Summarization Example ===\n');

  // 1. Store some example memories
  console.log('Step 1: Storing example memories...\n');

  storeMemory({
    type: 'semantic',
    content: 'Verified: The memory caching system reduces query latency by 60% based on benchmark tests.',
    metadata: {
      timestamp: new Date().toISOString(),
      topic: 'performance',
      tags: ['verified', 'benchmark', 'memory'],
      agent_id: 'implementer-001',
    },
  });

  storeMemory({
    type: 'semantic',
    content: 'The TypeScript compiler might need additional configuration for ESM support in certain edge cases.',
    metadata: {
      timestamp: new Date().toISOString(),
      topic: 'typescript',
      tags: ['hypothesis', 'build'],
      agent_id: 'implementer-002',
    },
  });

  storeMemory({
    type: 'semantic',
    content: 'Unknown: The optimal token budget for agent context injection needs investigation.',
    metadata: {
      timestamp: new Date().toISOString(),
      topic: 'research',
      tags: ['gap', 'todo'],
      agent_id: 'researcher-001',
    },
  });

  storeMemory({
    type: 'episodic',
    content: 'Completed implementation of smart memory summarization with fact/hypothesis/gap classification.',
    metadata: {
      timestamp: new Date().toISOString(),
      topic: 'implementation',
      agent_id: 'implementer-003',
    },
  });

  // 2. Summarize memories for a new agent
  console.log('Step 2: Summarizing memories for new agent...\n');

  const summary = await summarizeMemoriesForAgent({
    role: 'implementer',
    taskKeywords: ['memory', 'typescript', 'performance'],
    maxTokens: 2000,
    prioritizeRecent: true,
  });

  console.log('Summary Statistics:');
  console.log(`- Proven Facts: ${summary.provenFacts.length}`);
  console.log(`- Hypotheses: ${summary.hypotheses.length}`);
  console.log(`- Known Gaps: ${summary.knownGaps.length}`);
  console.log(`- Recent Findings: ${summary.recentFindings.length}`);
  console.log(`- Related Agents: ${summary.relatedAgents.length}`);
  console.log();

  // 3. Format for prompt injection
  console.log('Step 3: Formatting summary for prompt...\n');

  const formatted = formatSummaryForPrompt(summary);
  console.log(formatted);
  console.log();

  // 4. Build full bootstrap prompt
  console.log('Step 4: Building full bootstrap prompt...\n');

  const agentContext = {
    role: 'implementer',
    requestId: 'req-example-001',
    task: {
      objective: 'Optimize memory query performance',
      context: {
        priority: 'high',
        complexity: 'medium',
      },
      requirements: [
        'Use existing caching layer',
        'Add performance benchmarks',
        'Document optimization approach',
      ],
    },
  };

  const bootstrapPrompt = await buildSmartBootstrapPrompt(agentContext);

  console.log('Bootstrap Prompt Preview (first 500 chars):');
  console.log(bootstrapPrompt.substring(0, 500) + '...\n');

  console.log('=== Example Complete ===');
}

// Run example
example().catch(console.error);
