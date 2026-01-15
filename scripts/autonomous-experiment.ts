/**
 * Autonomous Self-Improvement Experiment
 *
 * Combines:
 * - HypothesisGenerator: Evidence-based hypothesis generation
 * - Ollama Executor: Cheap local model for experimentation
 * - SelfImprovingLoop: Validation and implementation
 *
 * Run with: npx ts-node scripts/autonomous-experiment.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  createOllamaExecutor,
  isOllamaAvailable,
  createExpertConfig,
  ExpertTask,
} from '../src/multi-expert';
import {
  createHypothesisGenerator,
  Hypothesis,
  printHypotheses,
} from '../framework/validation/hypothesis-generator';

// Configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || '192.168.1.100';
const OLLAMA_PORT = parseInt(process.env.OLLAMA_PORT || '11434', 10);
const EXPERIMENT_LOG = '.swarm/experiments/experiment-log.json';

interface ExperimentResult {
  hypothesisId: string;
  timestamp: string;
  ollamaResponse: string;
  score: number;
  confidence: number;
  tokens: { input: number; output: number };
  latencyMs: number;
  verdict: 'promising' | 'inconclusive' | 'not_viable';
  reasoning: string;
}

interface ExperimentSession {
  sessionId: string;
  startTime: string;
  hypothesesGenerated: number;
  experimentsRun: number;
  results: ExperimentResult[];
  totalTokens: { input: number; output: number };
  totalCost: number; // $0.00 for local
}

async function main() {
  console.log('='.repeat(70));
  console.log('AUTONOMOUS SELF-IMPROVEMENT EXPERIMENT');
  console.log('='.repeat(70));
  console.log(`\nTime: ${new Date().toISOString()}`);

  // 1. Check Ollama availability
  console.log('\n[1/5] Checking Ollama availability...');
  const available = await isOllamaAvailable(OLLAMA_HOST, OLLAMA_PORT);

  if (!available) {
    console.error(`\n❌ Ollama not available at ${OLLAMA_HOST}:${OLLAMA_PORT}`);
    console.log('   Make sure gpuserver1 is running and Ollama is configured to listen on 0.0.0.0');
    process.exit(1);
  }
  console.log(`   ✓ Ollama available at ${OLLAMA_HOST}:${OLLAMA_PORT}`);

  // 2. Generate hypotheses
  console.log('\n[2/5] Generating hypotheses from system data...');
  const generator = createHypothesisGenerator();
  let hypotheses: Hypothesis[];

  try {
    hypotheses = await generator.generateHypotheses();
    hypotheses = generator.prioritize(hypotheses);
  } catch (err) {
    console.log('   No hypotheses generated from existing data.');
    console.log('   Creating synthetic test hypotheses for demonstration...');

    // Create test hypotheses if none exist
    hypotheses = [
      {
        id: `hyp-test-${Date.now()}`,
        source: 'pattern_detection',
        target: 'framework/bootstrap/bootstrap-loader.ts',
        type: 'reword',
        description: 'Improve agent bootstrap instructions to reduce task failures',
        expectedOutcome: 'Increase first-attempt success rate by 20%',
        confidence: 'medium',
        priority: 8,
        testPlan: [
          'Test current bootstrap with 5 tasks',
          'Analyze failure patterns',
          'Propose improved instructions',
          'Re-test with same tasks',
        ],
        evidence: {
          sourceData: 'synthetic_test',
          dataPoints: 0,
          pattern: 'Demonstration hypothesis for testing pipeline',
        },
      },
      {
        id: `hyp-refine-${Date.now()}`,
        source: 'performance_gap',
        target: 'src/multi-expert/execution-engine.ts',
        type: 'addition',
        description: 'Add adaptive iteration count based on task complexity',
        expectedOutcome: 'Reduce unnecessary iterations by 30%',
        confidence: 'medium',
        priority: 7,
        testPlan: [
          'Classify tasks by complexity',
          'Adjust max iterations dynamically',
          'Measure iteration count reduction',
          'Ensure quality is maintained',
        ],
        evidence: {
          sourceData: 'synthetic_test',
          dataPoints: 0,
          pattern: 'Simple tasks use too many iterations',
        },
      },
    ];
  }

  console.log(`   Generated ${hypotheses.length} hypotheses`);

  if (hypotheses.length === 0) {
    console.log('\n   No hypotheses to test. System appears healthy.');
    console.log('   Run more tasks or capture baselines to generate improvement ideas.');
    return;
  }

  // Show top hypotheses
  console.log('\n   Top hypotheses:');
  for (let i = 0; i < Math.min(3, hypotheses.length); i++) {
    const h = hypotheses[i];
    console.log(`   [${i + 1}] ${h.description}`);
    console.log(`       Priority: ${h.priority}/10 | Confidence: ${h.confidence}`);
  }

  // 3. Create Ollama executor for experiments
  console.log('\n[3/5] Creating Ollama executor...');
  const { executor, getUsage, resetUsage } = createOllamaExecutor({
    host: OLLAMA_HOST,
    port: OLLAMA_PORT,
    model: 'qwen3:8b',
    verbose: false,
    timeout: 120000,
  });
  console.log('   ✓ Executor ready (qwen3:8b)');

  // 4. Run experiments on top hypotheses
  console.log('\n[4/5] Running experiments on hypotheses...');

  const session: ExperimentSession = {
    sessionId: `exp-${Date.now()}`,
    startTime: new Date().toISOString(),
    hypothesesGenerated: hypotheses.length,
    experimentsRun: 0,
    results: [],
    totalTokens: { input: 0, output: 0 },
    totalCost: 0,
  };

  // Test top 3 hypotheses (or fewer if less available)
  const toTest = hypotheses.slice(0, 3);

  for (const hypothesis of toTest) {
    console.log(`\n   Testing: ${hypothesis.description.substring(0, 50)}...`);

    resetUsage();
    const startTime = Date.now();

    // Create experiment task
    const task: ExpertTask = {
      id: `exp-${hypothesis.id}`,
      description: `Analyze this improvement hypothesis and determine if it's viable:

HYPOTHESIS: ${hypothesis.description}
TARGET: ${hypothesis.target}
TYPE: ${hypothesis.type}
EXPECTED OUTCOME: ${hypothesis.expectedOutcome}
EVIDENCE: ${hypothesis.evidence.pattern}

INSTRUCTIONS:
1. Analyze whether this hypothesis makes sense technically
2. Identify potential implementation approaches
3. List any risks or concerns
4. Rate viability (0-100) and explain your reasoning
5. Suggest concrete first steps if viable

Be concise but thorough. Focus on practical viability.`,
      type: 'analysis',
      input: { hypothesis },
    };

    const expertConfig = createExpertConfig(
      'experiment-analyst',
      'Hypothesis Analyst',
      'balanced',
      {
        temperature: 0.7,
        maxIterations: 1,
        satisfactionThreshold: 0.6,
      }
    );

    try {
      const result = await executor(task, expertConfig);
      const usage = getUsage();
      const latencyMs = Date.now() - startTime;

      // Determine verdict based on score
      let verdict: 'promising' | 'inconclusive' | 'not_viable';
      if (result.score >= 75) {
        verdict = 'promising';
      } else if (result.score >= 50) {
        verdict = 'inconclusive';
      } else {
        verdict = 'not_viable';
      }

      const expResult: ExperimentResult = {
        hypothesisId: hypothesis.id,
        timestamp: new Date().toISOString(),
        ollamaResponse: String(result.output).substring(0, 2000),
        score: result.score,
        confidence: result.confidence,
        tokens: {
          input: usage.totalInputTokens,
          output: usage.totalOutputTokens,
        },
        latencyMs,
        verdict,
        reasoning: extractReasoning(String(result.output)),
      };

      session.results.push(expResult);
      session.experimentsRun++;
      session.totalTokens.input += usage.totalInputTokens;
      session.totalTokens.output += usage.totalOutputTokens;

      // Print result
      const verdictEmoji = verdict === 'promising' ? '✓' : verdict === 'inconclusive' ? '?' : '✗';
      console.log(`   ${verdictEmoji} Score: ${result.score}/100 | Verdict: ${verdict}`);
      console.log(`     Tokens: ${usage.totalInputTokens}/${usage.totalOutputTokens} | Time: ${latencyMs}ms`);

    } catch (err) {
      console.error(`   ✗ Experiment failed: ${err}`);
      session.results.push({
        hypothesisId: hypothesis.id,
        timestamp: new Date().toISOString(),
        ollamaResponse: `Error: ${err}`,
        score: 0,
        confidence: 0,
        tokens: { input: 0, output: 0 },
        latencyMs: Date.now() - startTime,
        verdict: 'not_viable',
        reasoning: 'Experiment execution failed',
      });
    }
  }

  // 5. Save results and summary
  console.log('\n[5/5] Saving experiment results...');

  // Ensure directory exists
  const logDir = path.dirname(EXPERIMENT_LOG);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Append to experiment log
  let existingLog: ExperimentSession[] = [];
  if (fs.existsSync(EXPERIMENT_LOG)) {
    try {
      existingLog = JSON.parse(fs.readFileSync(EXPERIMENT_LOG, 'utf-8'));
    } catch {
      existingLog = [];
    }
  }
  existingLog.push(session);
  fs.writeFileSync(EXPERIMENT_LOG, JSON.stringify(existingLog, null, 2));
  console.log(`   ✓ Results saved to ${EXPERIMENT_LOG}`);

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('EXPERIMENT SUMMARY');
  console.log('='.repeat(70));
  console.log(`Session ID: ${session.sessionId}`);
  console.log(`Hypotheses tested: ${session.experimentsRun}/${session.hypothesesGenerated}`);
  console.log(`Total tokens: ${session.totalTokens.input} in, ${session.totalTokens.output} out`);
  console.log(`Cost: $0.00 (local inference)`);

  // Count verdicts
  const promising = session.results.filter(r => r.verdict === 'promising').length;
  const inconclusive = session.results.filter(r => r.verdict === 'inconclusive').length;
  const notViable = session.results.filter(r => r.verdict === 'not_viable').length;

  console.log(`\nResults:`);
  console.log(`  ✓ Promising: ${promising}`);
  console.log(`  ? Inconclusive: ${inconclusive}`);
  console.log(`  ✗ Not viable: ${notViable}`);

  // Show promising hypotheses
  if (promising > 0) {
    console.log('\nPromising hypotheses to pursue:');
    for (const result of session.results.filter(r => r.verdict === 'promising')) {
      const hyp = hypotheses.find(h => h.id === result.hypothesisId);
      if (hyp) {
        console.log(`  - ${hyp.description}`);
        console.log(`    Reasoning: ${result.reasoning.substring(0, 100)}...`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('EXPERIMENT COMPLETE');
  console.log('='.repeat(70));
}

/**
 * Extract key reasoning from model response
 */
function extractReasoning(response: string): string {
  // Look for reasoning patterns
  const patterns = [
    /reason(?:ing)?[:\s]+([^\n]+)/i,
    /viab(?:ility|le)[:\s]+([^\n]+)/i,
    /assessment[:\s]+([^\n]+)/i,
    /conclusion[:\s]+([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Fallback: return first non-empty line
  const lines = response.split('\n').filter(l => l.trim().length > 20);
  return lines[0]?.substring(0, 200) || 'No clear reasoning extracted';
}

main().catch(console.error);
