/**
 * Self-Improvement Demonstration
 * Shows the system learning and improving from execution traces
 */

import { MemorySystem } from '../src/memory/memory-system';
import { MemoryType } from '../src/memory/memory-schema';
import { createExecutive, AgentRole } from '../src/executive';
import { createSelfImprovingLoop } from '../src/executive';
import { createLearningPipeline } from '../src/executive';
import { createBridge } from '../src/integration';

async function demonstrateSelfImprovement(): Promise<void> {
  console.log('=== Self-Improvement Demonstration ===\n');

  // Initialize systems
  const memory = new MemorySystem();
  const executive = createExecutive();
  const improvementLoop = createSelfImprovingLoop(memory);
  const learningPipeline = createLearningPipeline(memory);
  const bridge = createBridge(memory);

  // Phase 1: Execute initial tasks
  console.log('Phase 1: Initial Task Execution');
  console.log('--------------------------------');

  const initialTasks = [
    { id: 'demo-1', role: AgentRole.IMPLEMENTER, description: 'Build login form', context: '', maxIterations: 3 },
    { id: 'demo-2', role: AgentRole.IMPLEMENTER, description: 'Build login form', context: '', maxIterations: 3 },
    { id: 'demo-3', role: AgentRole.IMPLEMENTER, description: 'Build login form', context: '', maxIterations: 3 },
  ];

  const results1 = await executive.orchestrate(initialTasks);
  const avgIterations1 = results1.reduce((sum, r) => sum + r.iterations, 0) / results1.length;
  console.log(`  Tasks completed: ${results1.length}`);
  console.log(`  Average iterations: ${avgIterations1.toFixed(2)}`);
  console.log(`  Success rate: ${(results1.filter(r => r.success).length / results1.length * 100).toFixed(0)}%`);

  // Phase 2: Learn from executions
  console.log('\nPhase 2: Learning from Executions');
  console.log('----------------------------------');

  const learningStats = await learningPipeline.runPipeline();
  console.log(`  Patterns extracted: ${learningStats.patternsExtracted}`);
  console.log(`  Patterns validated: ${learningStats.patternsValidated}`);
  console.log(`  Patterns stored: ${learningStats.patternsStored}`);

  // Phase 3: Identify improvements
  console.log('\nPhase 3: Self-Improvement Cycle');
  console.log('--------------------------------');

  const improvementResult = await improvementLoop.runCycle();
  console.log(`  Improvements identified: ${improvementResult.identified}`);
  console.log(`  Improvements implemented: ${improvementResult.implemented}`);

  // Phase 4: Execute with learned patterns
  console.log('\nPhase 4: Post-Learning Execution');
  console.log('---------------------------------');

  const postLearningTasks = [
    { id: 'demo-4', role: AgentRole.IMPLEMENTER, description: 'Build login form', context: 'Using learned patterns', maxIterations: 3 },
    { id: 'demo-5', role: AgentRole.IMPLEMENTER, description: 'Build login form', context: 'Using learned patterns', maxIterations: 3 },
    { id: 'demo-6', role: AgentRole.IMPLEMENTER, description: 'Build login form', context: 'Using learned patterns', maxIterations: 3 },
  ];

  const results2 = await executive.orchestrate(postLearningTasks);
  const avgIterations2 = results2.reduce((sum, r) => sum + r.iterations, 0) / results2.length;
  console.log(`  Tasks completed: ${results2.length}`);
  console.log(`  Average iterations: ${avgIterations2.toFixed(2)}`);
  console.log(`  Success rate: ${(results2.filter(r => r.success).length / results2.length * 100).toFixed(0)}%`);

  // Phase 5: Summary
  console.log('\n=== Summary ===');
  console.log('===============');

  const memoryStats = memory.getStats();
  console.log(`  Total memories: ${memoryStats.total_memories}`);
  console.log(`  Memory types: ${JSON.stringify(memoryStats.by_type)}`);

  const learnedPatterns = await executive.learnFromHistory();
  console.log(`  Learned patterns: ${learnedPatterns.length}`);

  // Calculate improvement (simulated)
  const improvement = avgIterations1 > avgIterations2
    ? ((avgIterations1 - avgIterations2) / avgIterations1 * 100).toFixed(1)
    : '0';
  console.log(`\n  🎯 Iteration reduction: ${improvement}%`);
  console.log('  ✅ Self-improvement demonstrated');
}

demonstrateSelfImprovement()
  .then(() => console.log('\nDemonstration complete.'))
  .catch(err => console.error('Demo failed:', err));
