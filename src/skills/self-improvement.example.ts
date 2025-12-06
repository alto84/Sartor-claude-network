/**
 * Self-Improvement Feedback Mechanism - Example Usage
 *
 * Demonstrates how to use the self-improvement loop to learn from
 * execution outcomes and extract reusable patterns.
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

import {
  SelfImprovementLoop,
  createSelfImprovementLoop,
  createExecutionOutcome,
  createFeedback,
  ProcessStep,
  ExecutionOutcome,
  LearnedPattern,
  SkillUpdate,
} from './self-improvement';

/**
 * Example 1: Record successful execution and extract patterns
 */
function example1_RecordSuccessfulExecution() {
  const loop = createSelfImprovementLoop();

  // Create a process trace for successful code analysis
  const processTrace: ProcessStep[] = [
    {
      stepId: 'step_001',
      action: 'analyze-types',
      reasoning: 'Start with type checking to catch type errors early',
      outcome: 'success',
      duration: 1500,
      timestamp: Date.now(),
      context: {},
      metrics: { accuracy: 0.95, efficiency: 0.8 },
    },
    {
      stepId: 'step_002',
      action: 'run-static-analysis',
      reasoning: 'Use ESLint to catch code quality issues',
      outcome: 'success',
      duration: 2000,
      timestamp: Date.now(),
      context: {},
      metrics: { accuracy: 0.9, efficiency: 0.85 },
    },
    {
      stepId: 'step_003',
      action: 'check-test-coverage',
      reasoning: 'Verify test coverage is adequate',
      outcome: 'success',
      duration: 1000,
      timestamp: Date.now(),
      context: {},
      metrics: { accuracy: 1.0, efficiency: 0.9 },
    },
  ];

  // Create execution outcome
  const outcome = createExecutionOutcome(
    'task_code_analysis_001',
    'code-analyzer',
    true,
    processTrace,
    'analyzing TypeScript code for quality issues'
  );

  // Record outcome - this will automatically extract patterns
  loop.recordOutcome(outcome);

  // Note: In real usage, patterns are extracted automatically
  // when recording successful outcomes
  console.error('Recorded successful execution');
}

/**
 * Example 2: Extract patterns from multiple executions
 */
async function example2_ExtractPatterns() {
  const loop = createSelfImprovementLoop({ disablePersistence: true });

  // Simulate multiple successful executions
  const outcomes: ExecutionOutcome[] = [
    createOutcome('task_001', 'code-analyzer', true, [
      createStep('analyze-types', 'success'),
      createStep('run-linter', 'success'),
      createStep('check-coverage', 'success'),
    ]),
    createOutcome('task_002', 'code-analyzer', true, [
      createStep('analyze-types', 'success'),
      createStep('run-linter', 'success'),
      createStep('check-coverage', 'success'),
    ]),
    createOutcome('task_003', 'code-analyzer', true, [
      createStep('analyze-types', 'success'),
      createStep('run-linter', 'success'),
      createStep('generate-report', 'success'),
    ]),
  ];

  // Extract patterns
  const patterns = loop.extractPatterns(outcomes);

  console.error(`Extracted ${patterns.length} patterns:`);
  patterns.forEach((pattern) => {
    console.error(`- Context: ${pattern.context}`);
    console.error(`  Strategy: ${pattern.strategy}`);
    console.error(`  Success Rate: ${(pattern.successRate * 100).toFixed(0)}%`);
    console.error(`  Evidence: ${pattern.evidence.length} examples`);
  });
}

/**
 * Example 3: Get context-based recommendations
 */
function example3_GetRecommendations() {
  const loop = createSelfImprovementLoop({ disablePersistence: true });

  // Record some successful outcomes first
  const outcomes = [
    createOutcome('task_001', 'debugger', true, [
      createStep('collect-logs', 'success'),
      createStep('analyze-stack-trace', 'success'),
      createStep('identify-root-cause', 'success'),
    ]),
    createOutcome('task_002', 'debugger', true, [
      createStep('collect-logs', 'success'),
      createStep('analyze-stack-trace', 'success'),
      createStep('reproduce-issue', 'success'),
    ]),
  ];

  outcomes.forEach((outcome) => loop.recordOutcome(outcome));

  // Get recommendations for a specific context
  const context = 'debugging production error with stack trace';
  const recommendations = loop.getRecommendations(context);

  console.error(`\nRecommendations for: "${context}"\n`);
  recommendations.forEach((rec, index) => {
    console.error(`${index + 1}. ${rec.pattern.strategy}`);
    console.error(`   Relevance: ${(rec.relevanceScore * 100).toFixed(0)}%`);
    console.error(`   Success Rate: ${(rec.pattern.successRate * 100).toFixed(0)}%`);
    console.error(`   Reasoning: ${rec.reasoning}`);
    if (rec.caveats.length > 0) {
      console.error(`   Caveats: ${rec.caveats.join(', ')}`);
    }
    console.error('');
  });
}

/**
 * Example 4: Refine skill based on feedback
 */
function example4_RefineSkill() {
  const loop = createSelfImprovementLoop({ disablePersistence: true });

  // Collect feedback from multiple task executions
  const feedbackList = [
    createFeedback(
      'task_001',
      'test-runner',
      'failure',
      'Tests timed out after 30 seconds',
      ['Increase timeout threshold', 'Add timeout configuration']
    ),
    createFeedback(
      'task_002',
      'test-runner',
      'failure',
      'Tests failed due to insufficient timeout',
      ['Increase timeout threshold']
    ),
    createFeedback('task_003', 'test-runner', 'success', 'Tests completed successfully', []),
    createFeedback(
      'task_004',
      'test-runner',
      'partial',
      'Some tests timed out',
      ['Make timeout configurable']
    ),
  ];

  // Refine skill based on feedback
  const update: SkillUpdate = loop.refineSkill('test-runner', feedbackList);

  console.error('\nSkill Update Proposal:\n');
  console.error(`Skill: ${update.skillId}`);
  console.error(`Type: ${update.updateType}`);
  console.error(`Description: ${update.description}`);
  console.error(`Rationale: ${update.rationale}`);
  console.error(`\nProposed Changes:`);
  update.proposedChanges.forEach((change, index) => {
    console.error(`\n${index + 1}. ${change.area}`);
    console.error(`   Before: ${change.before}`);
    console.error(`   After: ${change.after}`);
    console.error(`   Confidence: ${(change.confidence * 100).toFixed(0)}%`);
  });
  console.error(`\nEstimated Impact:`);
  console.error(
    `  Success Rate Improvement: +${(update.estimatedImpact.successRateImprovement * 100).toFixed(0)}%`
  );
  console.error(
    `  Efficiency Gain: +${(update.estimatedImpact.efficiencyGain * 100).toFixed(0)}%`
  );
  console.error(`  Risk Level: ${update.estimatedImpact.riskLevel}`);
}

/**
 * Example 5: Pattern statistics and performance tracking
 */
function example5_PatternStatistics() {
  const loop = createSelfImprovementLoop({ disablePersistence: true });

  // Record outcomes to build up statistics
  const outcomes = Array.from({ length: 20 }, (_, i) =>
    createOutcome(`task_${i}`, 'code-analyzer', i % 4 !== 0, [
      // 75% success rate
      createStep('analyze-code', i % 4 !== 0 ? 'success' : 'failure'),
    ])
  );

  outcomes.forEach((outcome) => loop.recordOutcome(outcome));

  // Extract patterns
  const patterns = loop.extractPatterns(outcomes.filter((o) => o.success));

  if (patterns.length > 0) {
    const pattern = patterns[0];
    const stats = loop.getPatternStatistics(pattern.id);

    if (stats) {
      console.error('\nPattern Statistics:\n');
      console.error(`Total Executions: ${stats.totalExecutions}`);
      console.error(`Successful: ${stats.successfulExecutions}`);
      console.error(`Failed: ${stats.failedExecutions}`);
      console.error(`Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
      console.error(`\nConfidence Interval (${(stats.confidenceInterval.confidenceLevel * 100).toFixed(0)}% confidence):`);
      console.error(
        `  ${(stats.confidenceInterval.lower * 100).toFixed(1)}% - ${(stats.confidenceInterval.upper * 100).toFixed(1)}%`
      );
      console.error(`\nTrend: ${stats.trendDirection}`);
    }
  }
}

/**
 * Example 6: Persisting and loading patterns
 */
async function example6_PersistenceIntegration() {
  // Create loop with persistence enabled
  const loop = new SelfImprovementLoop({ disablePersistence: false });

  // Record successful outcomes
  const outcome = createOutcome('task_001', 'code-analyzer', true, [
    createStep('analyze-types', 'success'),
    createStep('run-linter', 'success'),
  ]);

  loop.recordOutcome(outcome);

  // Extract and persist patterns
  const patterns = loop.extractPatterns([outcome]);
  await loop.persistToMemory(patterns);
  console.error('Patterns persisted to memory system');

  // Later, in a new session, load patterns
  const loadedPatterns = await loop.loadFromMemory();
  console.error(`Loaded ${loadedPatterns.length} patterns from memory`);
}

// ============================================================================
// Helper Functions
// ============================================================================

function createOutcome(
  taskId: string,
  skillId: string,
  success: boolean,
  steps: ProcessStep[]
): ExecutionOutcome {
  return {
    taskId,
    skillUsed: skillId,
    success,
    refinementLoops: 0,
    processTrace: steps,
    feedback: '',
    patterns: [],
    startedAt: Date.now() - 5000,
    completedAt: Date.now(),
    metadata: {
      context: `${skillId} task execution`,
      complexity: 'medium',
    },
  };
}

function createStep(action: string, outcome: 'success' | 'failure' | 'partial'): ProcessStep {
  return {
    stepId: `step_${Date.now()}_${Math.random()}`,
    action,
    reasoning: `Performing ${action}`,
    outcome,
    duration: Math.floor(Math.random() * 2000) + 500,
    timestamp: Date.now(),
    context: {},
  };
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.error('='.repeat(70));
  console.error('Self-Improvement Feedback Mechanism - Examples');
  console.error('='.repeat(70));

  console.error('\n1. Recording Successful Execution\n');
  console.error('-'.repeat(70));
  example1_RecordSuccessfulExecution();

  console.error('\n2. Extracting Patterns from Multiple Executions\n');
  console.error('-'.repeat(70));
  await example2_ExtractPatterns();

  console.error('\n3. Getting Context-Based Recommendations\n');
  console.error('-'.repeat(70));
  example3_GetRecommendations();

  console.error('\n4. Refining Skill Based on Feedback\n');
  console.error('-'.repeat(70));
  example4_RefineSkill();

  console.error('\n5. Pattern Statistics and Performance Tracking\n');
  console.error('-'.repeat(70));
  example5_PatternStatistics();

  console.error('\n6. Persistence Integration\n');
  console.error('-'.repeat(70));
  await example6_PersistenceIntegration();

  console.error('\n' + '='.repeat(70));
  console.error('Examples Complete!');
  console.error('='.repeat(70));
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error running examples:', error);
    process.exit(1);
  });
}
