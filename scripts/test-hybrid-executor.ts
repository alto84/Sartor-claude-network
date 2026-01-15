/**
 * Test script for hybrid (Ollama + Claude) executor
 *
 * Run with: npx ts-node scripts/test-hybrid-executor.ts
 */

import {
  createOllamaExecutor,
  createHybridExecutor,
  isOllamaAvailable,
  createExpertConfig
} from '../src/multi-expert';

async function main() {
  console.log('='.repeat(60));
  console.log('HYBRID EXECUTOR TEST');
  console.log('='.repeat(60));

  // Check Ollama availability
  console.log('\n1. Checking Ollama availability...');
  const ollamaHost = process.env.OLLAMA_HOST || '192.168.1.100';
  const ollamaPort = parseInt(process.env.OLLAMA_PORT || '11434', 10);

  const available = await isOllamaAvailable(ollamaHost, ollamaPort);
  console.log(`   Ollama at ${ollamaHost}:${ollamaPort}: ${available ? 'AVAILABLE' : 'NOT AVAILABLE'}`);

  if (!available) {
    console.log('\n   Ollama not available. Make sure gpuserver1 is running.');
    process.exit(1);
  }

  // Create Ollama executor
  console.log('\n2. Creating Ollama executor...');
  const { executor, getUsage } = createOllamaExecutor({
    host: ollamaHost,
    port: ollamaPort,
    model: 'qwen3:8b',
    verbose: true,
  });

  // Create expert config
  const expertConfig = createExpertConfig(
    'test-expert',
    'Test Expert',
    'balanced',
    {
      temperature: 0.7,
      maxIterations: 2,
      satisfactionThreshold: 0.7,
    }
  );

  // Test task
  const task = {
    id: 'test-task-1',
    description: 'Write a Python function that calculates the factorial of a number recursively.',
    type: 'code_generation',
    input: { language: 'python', function_name: 'factorial' },
  };

  console.log('\n3. Running test task...');
  console.log(`   Task: ${task.description}`);

  try {
    const startTime = Date.now();
    const result = await executor(task, expertConfig);
    const elapsed = Date.now() - startTime;

    console.log('\n4. Results:');
    console.log(`   Score: ${result.score}/100`);
    console.log(`   Confidence: ${result.confidence}`);
    console.log(`   Iterations: ${result.iterations}`);
    console.log(`   Time: ${elapsed}ms`);
    console.log('\n   Output preview:');
    const outputStr = String(result.output);
    console.log('   ' + outputStr.slice(0, 500).split('\n').join('\n   ') + '...');

    // Usage stats
    const usage = getUsage();
    console.log('\n5. Usage Stats:');
    console.log(`   Total requests: ${usage.requestCount}`);
    console.log(`   Total tokens: ${usage.totalInputTokens} in, ${usage.totalOutputTokens} out`);
    console.log(`   Total latency: ${usage.totalLatencyMs}ms`);
    console.log(`   Cost: $0.00 (local inference)`);

    console.log('\n' + '='.repeat(60));
    console.log('TEST PASSED');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\nTest failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
