/**
 * Multi-Agent Orchestration Example
 *
 * Demonstrates the Orchestrator-Worker pattern with all delegation patterns.
 */

import {
  createOrchestrator,
  createMockWorker,
  createTask,
  DelegationPattern,
  type Task,
  type Worker,
  type TaskResult,
} from './multi-agent-orchestration';

// ============================================================================
// Example 1: Parallel Fan-Out Pattern
// ============================================================================

async function exampleParallelFanOut() {
  console.log('\n=== Example 1: Parallel Fan-Out Pattern ===\n');

  // Create orchestrator
  const orchestrator = createOrchestrator({
    id: 'orchestrator-1',
    maxConcurrentTasks: 5,
  });

  // Register specialized workers
  const frontendWorker = createMockWorker('frontend-agent', 'frontend', [
    'react',
    'ui',
    'components',
  ]);
  const backendWorker = createMockWorker('backend-agent', 'backend', ['api', 'database']);
  const securityWorker = createMockWorker('security-agent', 'security', ['auth', 'encryption']);

  orchestrator.registerWorker(frontendWorker);
  orchestrator.registerWorker(backendWorker);
  orchestrator.registerWorker(securityWorker);

  // Create tasks for parallel execution (independent)
  const tasks: Task[] = [
    createTask('task-1', 'frontend', 'Analyze React component structure for performance issues', {
      priority: 'high',
      successCriteria: ['Identify bottlenecks', 'List specific components'],
    }),
    createTask('task-2', 'backend', 'Review API endpoints for security vulnerabilities', {
      priority: 'high',
      successCriteria: ['Check input validation', 'Review auth middleware'],
    }),
    createTask('task-3', 'security', 'Audit authentication implementation', {
      priority: 'critical',
      successCriteria: ['Verify JWT handling', 'Check session management'],
    }),
  ];

  // Execute with parallel fan-out pattern
  const result = await orchestrator.executeWithPattern(tasks, DelegationPattern.PARALLEL_FAN_OUT);

  console.log('Synthesis:', result.synthesis);
  console.log('Insights:', result.insights);
  console.log('Conflicts:', result.conflicts);
  console.log('Confidence:', result.confidence.toFixed(2));
  console.log('Recommendations:', result.recommendations);

  return result;
}

// ============================================================================
// Example 2: Serial Chain Pattern
// ============================================================================

async function exampleSerialChain() {
  console.log('\n=== Example 2: Serial Chain Pattern ===\n');

  const orchestrator = createOrchestrator({ id: 'orchestrator-2' });

  // Register workers
  const researchWorker = createMockWorker('research-agent', 'research', [
    'analysis',
    'investigation',
  ]);
  const implementationWorker = createMockWorker('implementation-agent', 'implementation', [
    'coding',
    'development',
  ]);
  const testingWorker = createMockWorker('testing-agent', 'testing', ['qa', 'validation']);

  orchestrator.registerWorker(researchWorker);
  orchestrator.registerWorker(implementationWorker);
  orchestrator.registerWorker(testingWorker);

  // Create dependent tasks (must run in sequence)
  const tasks: Task[] = [
    createTask('research-1', 'research', 'Research best practices for rate limiting APIs', {
      priority: 'normal',
      dependencies: [],
    }),
    createTask(
      'implement-1',
      'implementation',
      'Implement rate limiting middleware based on research findings',
      {
        priority: 'normal',
        dependencies: ['research-1'],
      }
    ),
    createTask('test-1', 'testing', 'Validate rate limiting works under load', {
      priority: 'normal',
      dependencies: ['implement-1'],
    }),
  ];

  // Execute with serial chain pattern
  const result = await orchestrator.executeWithPattern(tasks, DelegationPattern.SERIAL_CHAIN);

  console.log('Synthesis:', result.synthesis);
  console.log(
    'Results:',
    result.results.map((r) => ({ taskId: r.taskId, success: r.success }))
  );

  return result;
}

// ============================================================================
// Example 3: Competitive Exploration Pattern
// ============================================================================

async function exampleCompetitiveExploration() {
  console.log('\n=== Example 3: Competitive Exploration Pattern ===\n');

  const orchestrator = createOrchestrator({ id: 'orchestrator-3' });

  // Register workers with different approaches
  const sqlWorker = createMockWorker('sql-agent', 'database', ['sql', 'relational']);
  const nosqlWorker = createMockWorker('nosql-agent', 'database', ['nosql', 'document']);
  const graphWorker = createMockWorker('graph-agent', 'database', ['graph', 'relationships']);

  orchestrator.registerWorker(sqlWorker);
  orchestrator.registerWorker(nosqlWorker);
  orchestrator.registerWorker(graphWorker);

  // Create tasks exploring different approaches to same problem
  const tasks: Task[] = [
    createTask('approach-sql', 'database', 'Design data model using relational SQL database', {
      priority: 'normal',
      context: 'E-commerce platform with users, products, orders',
    }),
    createTask('approach-nosql', 'database', 'Design data model using NoSQL document database', {
      priority: 'normal',
      context: 'E-commerce platform with users, products, orders',
    }),
    createTask('approach-graph', 'database', 'Design data model using graph database', {
      priority: 'normal',
      context: 'E-commerce platform with users, products, orders',
    }),
  ];

  // Execute with competitive exploration pattern
  const result = await orchestrator.executeWithPattern(
    tasks,
    DelegationPattern.COMPETITIVE_EXPLORATION
  );

  console.log('Synthesis:', result.synthesis);
  console.log(
    'Compare approaches:',
    result.results.map((r) => ({ worker: r.workerId, confidence: r.confidence }))
  );

  return result;
}

// ============================================================================
// Example 4: Worker Assignment and Matching
// ============================================================================

function exampleWorkerAssignment() {
  console.log('\n=== Example 4: Worker Assignment ===\n');

  const orchestrator = createOrchestrator({ id: 'orchestrator-4' });

  // Register workers with different specializations
  const workers: Worker[] = [
    createMockWorker('frontend-specialist', 'frontend', ['react', 'typescript', 'ui']),
    createMockWorker('backend-specialist', 'backend', ['node', 'api', 'database']),
    createMockWorker('devops-specialist', 'devops', ['docker', 'kubernetes', 'ci-cd']),
  ];

  workers.forEach((w) => orchestrator.registerWorker(w));

  // Create a task and find best worker
  const task = createTask(
    'deploy-task',
    'devops',
    'Set up CI/CD pipeline for automated deployment',
    {
      constraints: ['Use GitHub Actions', 'Deploy to AWS'],
    }
  );

  const assignment = orchestrator.assignWorker(task, workers);

  if (assignment) {
    console.log('Best worker:', assignment.worker.id);
    console.log('Match score:', assignment.matchScore.toFixed(2));
    console.log('Reasoning:', assignment.reasoning);
    console.log('Alternatives:', assignment.alternatives);
  }

  return assignment;
}

// ============================================================================
// Example 5: Conflict Preservation
// ============================================================================

async function exampleConflictPreservation() {
  console.log('\n=== Example 5: Conflict Preservation ===\n');

  const orchestrator = createOrchestrator({ id: 'orchestrator-5' });

  // Create workers that will disagree
  const optimisticWorker: Worker = {
    id: 'optimistic-agent',
    specialization: 'analysis',
    capabilities: ['evaluation'],
    status: {
      id: 'optimistic-agent',
      specialization: 'analysis',
      status: 'idle',
      metrics: {
        tasksCompleted: 10,
        taskseFailed: 0,
        averageCompletionTimeMs: 1000,
        successRate: 1.0,
        lastActiveAt: Date.now(),
      },
    },
    execute: async (task: Task): Promise<TaskResult> => ({
      taskId: task.id,
      workerId: 'optimistic-agent',
      success: true,
      output: { assessment: 'System is ready for production' },
      confidence: 0.9,
      reasoning: 'All tests pass, no obvious issues',
    }),
  };

  const pessimisticWorker: Worker = {
    id: 'pessimistic-agent',
    specialization: 'analysis',
    capabilities: ['evaluation'],
    status: {
      id: 'pessimistic-agent',
      specialization: 'analysis',
      status: 'idle',
      metrics: {
        tasksCompleted: 10,
        taskseFailed: 0,
        averageCompletionTimeMs: 1000,
        successRate: 1.0,
        lastActiveAt: Date.now(),
      },
    },
    execute: async (task: Task): Promise<TaskResult> => ({
      taskId: task.id,
      workerId: 'pessimistic-agent',
      success: true,
      output: { assessment: 'System needs more testing before production' },
      confidence: 0.4,
      reasoning: 'Uncertain about edge cases, load testing incomplete',
      issues: ['Unclear error handling under load', 'No disaster recovery plan'],
    }),
  };

  orchestrator.registerWorker(optimisticWorker);
  orchestrator.registerWorker(pessimisticWorker);

  const tasks = [
    createTask('eval-1', 'analysis', 'Evaluate system readiness for production deployment'),
    createTask('eval-2', 'analysis', 'Evaluate system readiness for production deployment'),
  ];

  const result = await orchestrator.executeWithPattern(tasks, DelegationPattern.PARALLEL_FAN_OUT);

  console.log('\n** Disagreement Preserved (Not Forced to Consensus) **');
  console.log('Synthesis:', result.synthesis);
  console.log('Conflicts:', result.conflicts);
  console.log('Confidence:', result.confidence.toFixed(2));
  console.log(
    '\nNote: Low confidence indicates legitimate uncertainty - preserved, not averaged away'
  );

  return result;
}

// ============================================================================
// Example 6: Worker Failure Recovery
// ============================================================================

function exampleWorkerFailure() {
  console.log('\n=== Example 6: Worker Failure Recovery ===\n');

  const orchestrator = createOrchestrator({ id: 'orchestrator-6' });

  // Create a worker with failure history
  const failingWorker = createMockWorker('failing-agent', 'analysis', ['evaluation']);
  failingWorker.status.metrics.taskseFailed = 5;
  failingWorker.status.metrics.tasksCompleted = 3;
  failingWorker.status.metrics.successRate = 0.375;

  orchestrator.registerWorker(failingWorker);

  // Simulate failure
  const error = new Error('Worker timeout - analysis took too long');
  const recovery = orchestrator.handleWorkerFailure('failing-agent', error);

  console.log('Recovery action:', recovery.action);
  console.log('Reasoning:', recovery.reasoning);
  if (recovery.newAssignment) {
    console.log('Reassign to:', recovery.newAssignment);
  }
  if (recovery.delay) {
    console.log('Retry delay:', recovery.delay, 'ms');
  }

  return recovery;
}

// ============================================================================
// Example 7: Orchestrator Status
// ============================================================================

async function exampleOrchestratorStatus() {
  console.log('\n=== Example 7: Orchestrator Status ===\n');

  const orchestrator = createOrchestrator({ id: 'orchestrator-7' });

  // Register workers
  orchestrator.registerWorker(createMockWorker('worker-1', 'frontend', ['react']));
  orchestrator.registerWorker(createMockWorker('worker-2', 'backend', ['node']));
  orchestrator.registerWorker(createMockWorker('worker-3', 'database', ['sql']));

  // Execute some tasks
  const tasks = [
    createTask('status-task-1', 'frontend', 'Analyze component performance'),
    createTask('status-task-2', 'backend', 'Review API design'),
  ];

  await orchestrator.executeWithPattern(tasks, DelegationPattern.PARALLEL_FAN_OUT);

  // Get status
  const status = orchestrator.getStatus();

  console.log('Orchestrator ID:', status.orchestratorId);
  console.log('Active workers:', status.activeWorkers);
  console.log('Queued tasks:', status.queuedTasks);
  console.log('Completed tasks:', status.completedTasks);
  console.log('Workers:', status.workers.length);

  return status;
}

// ============================================================================
// Run All Examples
// ============================================================================

async function runAllExamples() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Multi-Agent Orchestration Skill - Example Usage          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  try {
    await exampleParallelFanOut();
    await exampleSerialChain();
    await exampleCompetitiveExploration();
    exampleWorkerAssignment();
    await exampleConflictPreservation();
    exampleWorkerFailure();
    await exampleOrchestratorStatus();

    console.log('\n✓ All examples completed successfully!\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllExamples();
}

export {
  exampleParallelFanOut,
  exampleSerialChain,
  exampleCompetitiveExploration,
  exampleWorkerAssignment,
  exampleConflictPreservation,
  exampleWorkerFailure,
  exampleOrchestratorStatus,
  runAllExamples,
};
