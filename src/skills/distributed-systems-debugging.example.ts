/**
 * Distributed Systems Debugging - Usage Examples
 *
 * Demonstrates how to use the Distributed Systems Debugging skill
 * to investigate failures in distributed systems.
 */

// Declare global functions for Node.js environment
declare const console: {
  log(...args: any[]): void;
};
declare const require: any;
declare const module: any;

import {
  createDebugger,
  createDataSource,
  createTest,
  formatDebugReport,
  createFailureInjection,
  type SystemObservation,
  type DataSource,
  type DebugSession,
} from './distributed-systems-debugging';

// Example 1: Debugging a race condition in message delivery
async function debugRaceCondition() {
  const debuggerInstance = createDebugger();

  // Create data sources for logs and metrics
  const logDataSource: DataSource = createDataSource(
    'message-bus-logs',
    'message-bus',
    'logs',
    async (): Promise<SystemObservation[]> => {
      // Simulate fetching logs
      return [
        {
          timestamp: Date.now() - 5000,
          component: 'message-bus',
          type: 'log',
          data: 'Message m1 enqueued from agent-a to agent-b',
          source: 'message-bus-logs',
        },
        {
          timestamp: Date.now() - 4900,
          component: 'message-bus',
          type: 'log',
          data: 'Message m2 enqueued from agent-a to agent-b',
          source: 'message-bus-logs',
        },
        {
          timestamp: Date.now() - 4800,
          component: 'agent-b',
          type: 'log',
          data: 'Received message m2 (out of order!)',
          source: 'agent-b-logs',
        },
        {
          timestamp: Date.now() - 4700,
          component: 'agent-b',
          type: 'log',
          data: 'Received message m1',
          source: 'agent-b-logs',
        },
      ];
    }
  );

  const metricsDataSource: DataSource = createDataSource(
    'system-metrics',
    'message-bus',
    'metrics',
    async (): Promise<SystemObservation[]> => {
      return [
        {
          timestamp: Date.now() - 5000,
          component: 'message-bus',
          type: 'metric',
          data: { cpuUsage: 95, queueDepth: 1500 },
          source: 'system-metrics',
        },
      ];
    }
  );

  // Create a debug session
  const session: DebugSession = debuggerInstance.createSession(
    ['Messages sometimes delivered out of order', 'Only occurs under high load (CPU > 90%)'],
    [logDataSource, metricsDataSource]
  );

  // Step 1: Collect observations
  const observations = await debuggerInstance.collectObservations(session.sources);
  session.observations = observations;

  console.log(`Collected ${observations.length} observations`);

  // Step 2: Form hypotheses based on evidence
  const hypotheses = debuggerInstance.formHypotheses(observations);
  session.hypotheses = hypotheses;

  console.log(`\nGenerated ${hypotheses.length} hypotheses:`);
  hypotheses.forEach((h, idx) => {
    console.log(`  ${idx + 1}. ${h.description} (confidence: ${(h.confidence * 100).toFixed(1)}%)`);
  });

  // Step 3: Rank hypotheses by evidence strength
  const ranked = debuggerInstance.rankHypotheses(hypotheses);

  console.log('\nRanked hypotheses:');
  ranked.ranking.forEach((r) => {
    console.log(`  Rank ${r.rank}: ${r.hypothesis.description}`);
    console.log(`    Score: ${r.score.toFixed(3)}`);
    console.log(`    Reasoning: ${r.reasoning}`);
  });

  // Step 4: Test top hypothesis
  if (ranked.ranking.length > 0) {
    const topHypothesis = ranked.ranking[0].hypothesis;

    const test = createTest(
      'test-race-condition',
      'Inject network delay to alter message timing',
      async () => {
        // Simulate test execution
        return {
          success: true,
          observations: [
            {
              timestamp: Date.now(),
              component: 'message-bus',
              type: 'log',
              data: 'With delay: Messages delivered in order',
              source: 'test-execution',
            },
          ],
          symptomReproduced: false, // Symptom didn't occur with delay
        };
      }
    );

    const testResult = await debuggerInstance.testHypothesis(topHypothesis, test);
    session.tests.set(test.id, testResult);

    console.log('\nTest result:');
    console.log(`  Success: ${testResult.success}`);
    console.log(`  Symptom reproduced: ${testResult.symptomReproduced}`);
    console.log(`  Observations: ${testResult.observations.length}`);
  }

  // Step 5: Reconstruct causal chains
  const causalChains = debuggerInstance.reconstructCausalChains(observations);

  console.log(`\nReconstructed ${causalChains.length} causal chains:`);
  causalChains.forEach((chain, idx) => {
    console.log(`  Chain ${idx + 1}: ${chain.components.join(' -> ')}`);
    console.log(`    Events: ${chain.events.length}`);
    console.log(`    Duration: ${chain.timelineMs[chain.timelineMs.length - 1]}ms`);
    console.log(`    Confidence: ${(chain.confidence * 100).toFixed(1)}%`);
  });

  // Step 6: Generate debug report
  const report = debuggerInstance.generateDebugReport(session);

  console.log('\n' + '='.repeat(80));
  console.log(formatDebugReport(report));
  console.log('='.repeat(80));

  debuggerInstance.completeSession(session.id);
}

// Example 2: Performing systematic isolation
async function performSystematicIsolation() {
  const debuggerInstance = createDebugger();

  const session = debuggerInstance.createSession(
    ['Request fails when all three services are running'],
    []
  );

  // Components that could be causing the issue
  const components = ['service-a', 'service-b', 'service-c', 'load-balancer'];

  // Function to check if symptom is still present with given components
  const checkSymptom = async (remainingComponents: string[]): Promise<boolean> => {
    console.log(`Testing with components: ${remainingComponents.join(', ')}`);

    // Simulate symptom check
    // In this example, symptom only occurs when service-b is present
    return remainingComponents.includes('service-b');
  };

  // Perform isolation
  const isolationSteps = await debuggerInstance.performIsolation(session, components, checkSymptom);

  console.log('\nIsolation complete!');
  console.log(`Performed ${isolationSteps.length} isolation steps`);

  // Find minimal reproduction
  const necessaryComponents = isolationSteps
    .filter((step) => !step.symptomPresent)
    .map((step) => step.removed[0]);

  console.log(`\nNecessary components for symptom:`);
  console.log(components.filter((c) => !necessaryComponents.includes(c)).join(', '));
}

// Example 3: Creating failure injection tests
function createFailureInjectionTest() {
  const networkPartition = createFailureInjection(
    'network-partition-a-b',
    'Partition network between agent-a and agent-b',
    'message-bus',
    'network_partition',
    {
      affectedComponents: ['agent-a', 'agent-b'],
      duration: 5000,
    },
    async () => {
      console.log('Injecting network partition...');
      // Implementation would actually partition the network
    },
    async () => {
      console.log('Cleaning up network partition...');
      // Implementation would restore network
    }
  );

  console.log('Failure injection created:');
  console.log(`  ID: ${networkPartition.id}`);
  console.log(`  Description: ${networkPartition.description}`);
  console.log(`  Target: ${networkPartition.targetComponent}`);
  console.log(`  Type: ${networkPartition.failureType}`);
}

// Run examples
if (require.main === module) {
  (async () => {
    console.log('Example 1: Debugging Race Condition');
    console.log('='.repeat(80) + '\n');
    await debugRaceCondition();

    console.log('\n\n');
    console.log('Example 2: Systematic Isolation');
    console.log('='.repeat(80) + '\n');
    await performSystematicIsolation();

    console.log('\n\n');
    console.log('Example 3: Failure Injection');
    console.log('='.repeat(80) + '\n');
    createFailureInjectionTest();
  })();
}
