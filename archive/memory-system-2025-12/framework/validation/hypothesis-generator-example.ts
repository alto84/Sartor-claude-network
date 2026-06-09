/**
 * Hypothesis Generator - Usage Example
 *
 * Demonstrates how to use the hypothesis generator in a self-improvement loop.
 */

import { createHypothesisGenerator, Hypothesis } from './hypothesis-generator';
import { createBaselineTracker } from './baseline-tracker';

/**
 * Example 1: Generate all hypotheses from current system state
 */
async function example1_generateAll() {
  console.log('=== Example 1: Generate All Hypotheses ===\n');

  const generator = createHypothesisGenerator();

  // Generate all hypotheses from available data
  const hypotheses = await generator.generateHypotheses();

  // Prioritize by impact and confidence
  const prioritized = generator.prioritize(hypotheses);

  console.log(`Generated ${prioritized.length} hypotheses`);
  console.log('\nTop 3 priorities:');
  for (let i = 0; i < Math.min(3, prioritized.length); i++) {
    const hyp = prioritized[i];
    console.log(`  ${i + 1}. [P${hyp.priority}] ${hyp.description}`);
    console.log(`     Evidence: ${hyp.evidence.pattern}`);
  }
}

/**
 * Example 2: Focus on specific analysis type
 */
async function example2_focusOnFailures() {
  console.log('\n=== Example 2: Analyze Failures Only ===\n');

  const generator = createHypothesisGenerator();

  // Import and analyze agent results
  const { readAgentResults } = await import('./hypothesis-generator');
  const results = readAgentResults();

  console.log(`Analyzing ${results.length} agent results for failure patterns...\n`);

  // Focus on failure analysis
  const failureHypotheses = generator.analyzeFailures(results);

  if (failureHypotheses.length === 0) {
    console.log('No failure-based hypotheses generated. System is healthy!');
  } else {
    console.log(`Found ${failureHypotheses.length} improvement opportunities:\n`);
    for (const hyp of failureHypotheses) {
      console.log(`- ${hyp.description}`);
      console.log(`  Confidence: ${hyp.confidence}, Priority: ${hyp.priority}/10`);
      console.log(`  Expected outcome: ${hyp.expectedOutcome}\n`);
    }
  }
}

/**
 * Example 3: Identify performance gaps from baseline
 */
async function example3_performanceGaps() {
  console.log('\n=== Example 3: Performance Gap Analysis ===\n');

  const tracker = createBaselineTracker();
  const generator = createHypothesisGenerator();

  // Capture current baseline
  console.log('Capturing current baseline metrics...');
  const baseline = await tracker.captureBaseline();

  console.log('\nAnalyzing for performance gaps...\n');

  // Identify gaps
  const gapHypotheses = generator.identifyPerformanceGaps(baseline);

  if (gapHypotheses.length === 0) {
    console.log('All metrics are within target ranges. No gaps identified.');
  } else {
    console.log(`Found ${gapHypotheses.length} performance gaps:\n`);
    for (const hyp of gapHypotheses) {
      console.log(`- ${hyp.description}`);
      console.log(`  Target: ${hyp.target}`);
      console.log(`  Expected: ${hyp.expectedOutcome}\n`);
    }
  }
}

/**
 * Example 4: Filter hypotheses by criteria
 */
async function example4_filterHypotheses() {
  console.log('\n=== Example 4: Filter High-Priority Hypotheses ===\n');

  const generator = createHypothesisGenerator();

  // Generate all hypotheses
  const allHypotheses = await generator.generateHypotheses();

  // Filter for high-priority, high-confidence items
  const urgent = allHypotheses.filter(
    (h) => h.priority >= 7 && h.confidence === 'high'
  );

  console.log(`High-priority, high-confidence hypotheses: ${urgent.length}\n`);

  for (const hyp of urgent) {
    console.log(`[P${hyp.priority}] ${hyp.description}`);
    console.log(`  Type: ${hyp.type} → ${hyp.target}`);
    console.log(`  Evidence: ${hyp.evidence.dataPoints} data points`);
    console.log(`  Test plan: ${hyp.testPlan.length} steps\n`);
  }
}

/**
 * Example 5: Integration with acceptance gate (mock workflow)
 */
async function example5_selfImprovementLoop() {
  console.log('\n=== Example 5: Self-Improvement Loop Integration ===\n');

  const generator = createHypothesisGenerator();

  console.log('Step 1: Generate hypotheses...');
  const hypotheses = await generator.generateHypotheses();
  const prioritized = generator.prioritize(hypotheses);

  if (prioritized.length === 0) {
    console.log('  No hypotheses generated. System is optimal.');
    return;
  }

  console.log(`  Generated ${prioritized.length} hypotheses\n`);

  console.log('Step 2: Select top hypothesis...');
  const topHypothesis = prioritized[0];
  console.log(`  Selected: ${topHypothesis.description}`);
  console.log(`  Priority: ${topHypothesis.priority}/10, Confidence: ${topHypothesis.confidence}\n`);

  console.log('Step 3: Execute test plan...');
  console.log('  Test plan:');
  for (const step of topHypothesis.testPlan) {
    console.log(`    - ${step}`);
  }
  console.log('\n  (In a real loop, this would execute A/B tests)\n');

  console.log('Step 4: Evaluate results with acceptance gate...');
  console.log('  (Mock) A/B test results:');
  console.log('    - Baseline: 43% success rate');
  console.log('    - Modified: 87% success rate');
  console.log('    - Improvement: +44 percentage points\n');

  console.log('Step 5: Decision...');
  console.log('  Acceptance Gate: ACCEPT (2+ tests improved, 0 regressed)');
  console.log('  Action: Apply modification to production\n');

  console.log('Step 6: Update baseline and repeat...');
  console.log('  Baseline updated with new metrics');
  console.log('  Loop continues with next hypothesis\n');
}

/**
 * Example 6: Custom hypothesis creation
 */
function example6_customHypothesis() {
  console.log('\n=== Example 6: Creating Custom Hypotheses ===\n');

  // You can also manually create hypotheses based on user feedback
  // or domain-specific insights
  const customHypothesis: Hypothesis = {
    id: 'hyp-custom-' + Date.now(),
    source: 'user_feedback',
    target: 'framework/memory/query-optimizer.ts',
    type: 'addition',
    description: 'Add semantic search to improve memory retrieval relevance',
    expectedOutcome: 'Increase query relevance score from 65% to >80%',
    confidence: 'medium',
    priority: 7,
    testPlan: [
      'Implement vector embedding for memories',
      'Add cosine similarity search',
      'Test with 100 diverse queries',
      'Measure relevance improvement via user ratings',
    ],
    evidence: {
      sourceData: 'User feedback session 2025-12-16',
      dataPoints: 12,
      pattern: '12 users reported irrelevant search results',
    },
  };

  console.log('Custom hypothesis created:');
  console.log(`  Description: ${customHypothesis.description}`);
  console.log(`  Source: ${customHypothesis.source}`);
  console.log(`  Evidence: ${customHypothesis.evidence.pattern}\n`);
}

// Run all examples
async function main() {
  console.log('HYPOTHESIS GENERATOR - USAGE EXAMPLES');
  console.log('=====================================\n');

  await example1_generateAll();
  await example2_focusOnFailures();
  await example3_performanceGaps();
  await example4_filterHypotheses();
  await example5_selfImprovementLoop();
  example6_customHypothesis();

  console.log('\n=== All Examples Complete ===\n');
  console.log('Next steps:');
  console.log('1. Run: npx tsx framework/validation/hypothesis-generator.ts generate');
  console.log('2. Review generated hypotheses in .swarm/hypotheses.json');
  console.log('3. Select top hypothesis for A/B testing');
  console.log('4. Use ab-test-runner.ts to validate improvements');
  console.log('5. Use acceptance-gate.ts to evaluate results');
  console.log('6. Repeat the loop for continuous improvement\n');
}

// CLI execution
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('hypothesis-generator-example.ts');

if (isMainModule && process.argv[1]?.endsWith('hypothesis-generator-example.ts')) {
  main().catch(console.error);
}

export {
  example1_generateAll,
  example2_focusOnFailures,
  example3_performanceGaps,
  example4_filterHypotheses,
  example5_selfImprovementLoop,
  example6_customHypothesis,
};
