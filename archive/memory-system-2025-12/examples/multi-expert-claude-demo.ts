#!/usr/bin/env npx ts-node
/**
 * Multi-Expert Claude Demo
 *
 * Demonstrates the multi-expert system using REAL Claude API calls.
 * This is NOT a mock - it will make actual API calls and incur costs.
 *
 * Prerequisites:
 * - Set ANTHROPIC_API_KEY environment variable
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-xxx npx ts-node examples/multi-expert-claude-demo.ts
 *
 * @module examples/multi-expert-claude-demo
 */

import {
  Orchestrator,
  createClaudeExecutor,
  createExpertPool,
  ExpertTask,
  OrchestratorConfig,
} from '../src/multi-expert';

async function main() {
  console.log('='.repeat(60));
  console.log('Multi-Expert Claude Demo');
  console.log('='.repeat(60));
  console.log();

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY environment variable is required.');
    console.error('Set it with: export ANTHROPIC_API_KEY=sk-ant-xxx');
    process.exit(1);
  }

  // Create Claude executor with cost tracking
  console.log('[1/5] Creating Claude executor with budget limit...');
  const { executor, getCosts } = createClaudeExecutor({
    model: 'claude-sonnet-4-20250514',
    maxTokens: 2048,
    budgetLimit: 0.50, // $0.50 max spend for demo
    verbose: true,
  });

  // Create diverse expert pool
  console.log('[2/5] Creating expert pool with diverse archetypes...');
  const archetypes: Array<'performance' | 'safety' | 'creative'> = ['performance', 'safety', 'creative'];
  const expertPool = createExpertPool('demo', archetypes);

  console.log('Expert pool:');
  expertPool.forEach((expert) => {
    console.log(`  - ${expert.name} (${expert.archetype}, ${expert.strategy})`);
  });
  console.log();

  // Create orchestrator with real executor
  console.log('[3/5] Creating orchestrator...');
  const orchestratorConfig: Partial<OrchestratorConfig> = {
    expertCount: 3,
    archetypes: archetypes,
    useVoting: true,
    useDiversitySelection: true,
    useMemory: false, // Disable memory for simple demo
    useFeedbackLoop: false, // Disable for faster demo
  };

  const orchestrator = new Orchestrator(executor, orchestratorConfig);

  // Define a real task
  const task: ExpertTask = {
    id: 'demo-task-001',
    description: 'Write a Python function to find the longest palindromic substring in a given string',
    type: 'code_generation',
    input: {
      language: 'python',
      requirements: [
        'Function signature: def longest_palindrome(s: str) -> str',
        'Should handle empty strings',
        'Should be efficient (O(n²) or better)',
        'Include type hints',
      ],
    },
    context: {
      purpose: 'Interview preparation',
      targetAudience: 'Software engineers',
    },
  };

  console.log('[4/5] Executing task with multi-expert orchestration...');
  console.log();
  console.log('Task:', task.description);
  console.log();

  const startTime = Date.now();

  try {
    // Execute with orchestration
    const result = await orchestrator.execute(task);

    const durationMs = Date.now() - startTime;
    const costs = getCosts();

    console.log();
    console.log('='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));
    console.log();

    // Display results
    console.log(`Winner: ${result.winner.expertId}`);
    console.log(`Score: ${result.winner.score.toFixed(1)}/100`);
    console.log(`Confidence: ${(result.winner.confidence * 100).toFixed(1)}%`);
    console.log(`Iterations: ${result.winner.iterations}`);
    console.log(`Duration: ${result.winner.durationMs}ms`);
    console.log();

    console.log('Output:');
    console.log('-'.repeat(40));
    console.log(result.winner.output);
    console.log('-'.repeat(40));
    console.log();

    // Display all expert results from expertResults
    console.log('All Expert Results:');
    result.expertResults.results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.expertId}: score=${r.score.toFixed(1)}, confidence=${(r.confidence * 100).toFixed(1)}%`);
    });
    console.log();

    // Display costs
    console.log('Cost Summary:');
    console.log(`  Total requests: ${costs.requestCount}`);
    console.log(`  Input tokens: ${costs.totalInputTokens.toLocaleString()}`);
    console.log(`  Output tokens: ${costs.totalOutputTokens.toLocaleString()}`);
    console.log(`  Total cost: $${costs.totalCost.toFixed(4)}`);
    console.log();

    console.log('Cost by Expert:');
    Object.entries(costs.byExpert).forEach(([expertId, expertCosts]) => {
      console.log(`  ${expertId}: $${expertCosts.cost.toFixed(4)} (${expertCosts.inputTokens + expertCosts.outputTokens} tokens)`);
    });
    console.log();

    console.log(`Total execution time: ${durationMs}ms`);
    console.log();
    console.log('Demo completed successfully!');

  } catch (error) {
    console.error('Execution failed:', error);

    // Still show costs on failure
    const costs = getCosts();
    console.log();
    console.log('Costs incurred before failure:');
    console.log(`  Total cost: $${costs.totalCost.toFixed(4)}`);

    process.exit(1);
  }
}

// Run if executed directly
main().catch(console.error);
