/**
 * A/B Test Runner - Compare agent configurations with evidence-based measurement
 *
 * Runs controlled experiments comparing different agent setups and reports
 * results with statistical rigor (no fabricated metrics).
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Types
interface AgentConfig {
  name: string;
  description: string;
  command: string;
  args: string[];
  environment?: Record<string, string>;
  bootstrap?: {
    memoryEnabled: boolean;
    skillsEnabled: boolean;
    customPrompt?: string;
  };
}

interface TestTask {
  id: string;
  name: string;
  prompt: string;
  expectedOutputPatterns?: RegExp[];
  groundTruth?: {
    requiredElements: string[];
    prohibitedElements: string[];
  };
  timeout: number;
}

interface TaskResult {
  taskId: string;
  config: string;
  success: boolean;
  output: string;
  executionTimeMs: number;
  validationPassed: boolean;
  validationErrors: string[];
  timestamp: string;
}

interface ABTestResult {
  testId: string;
  task: TestTask;
  configA: {
    name: string;
    results: TaskResult[];
  };
  configB: {
    name: string;
    results: TaskResult[];
  };
  comparison: {
    successRateA: number;
    successRateB: number;
    avgTimeA: number;
    avgTimeB: number;
    validationPassRateA: number;
    validationPassRateB: number;
    sampleSize: number;
    notes: string[];
  };
}

interface ABTestReport {
  timestamp: string;
  totalTests: number;
  results: ABTestResult[];
  methodology: string;
  limitations: string[];
}

// Default test tasks
const defaultTasks: TestTask[] = [
  {
    id: 'task-simple-analysis',
    name: 'Simple Code Analysis',
    prompt: 'Analyze this function and describe what it does: function add(a, b) { return a + b; }',
    groundTruth: {
      requiredElements: ['add', 'function', 'return', 'sum'],
      prohibitedElements: ['exceptional', 'outstanding', '99%', '100%'],
    },
    timeout: 30000,
  },
  {
    id: 'task-error-handling',
    name: 'Error Handling Suggestion',
    prompt: 'Suggest error handling improvements for: async function fetchData(url) { const res = await fetch(url); return res.json(); }',
    groundTruth: {
      requiredElements: ['try', 'catch', 'error'],
      prohibitedElements: ['exceptional', 'world-class', 'will definitely'],
    },
    timeout: 30000,
  },
  {
    id: 'task-memory-recall',
    name: 'Memory Recall Test',
    prompt: 'What is the current mission objective? Check the mission context.',
    groundTruth: {
      requiredElements: [],
      prohibitedElements: ['fabricated', 'invented'],
    },
    timeout: 30000,
  },
];

// Run a single agent task
async function runAgentTask(
  config: AgentConfig,
  task: TestTask
): Promise<TaskResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    let output = '';
    let errorOutput = '';

    const proc = spawn(config.command, [...config.args, task.prompt], {
      env: { ...process.env, ...config.environment },
      timeout: task.timeout,
    });

    proc.stdout?.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      const executionTimeMs = Date.now() - startTime;
      const success = code === 0;
      const validationResult = validateOutput(output, task);

      resolve({
        taskId: task.id,
        config: config.name,
        success,
        output: output || errorOutput,
        executionTimeMs,
        validationPassed: validationResult.passed,
        validationErrors: validationResult.errors,
        timestamp: new Date().toISOString(),
      });
    });

    proc.on('error', (err) => {
      const executionTimeMs = Date.now() - startTime;

      resolve({
        taskId: task.id,
        config: config.name,
        success: false,
        output: `Error: ${err.message}`,
        executionTimeMs,
        validationPassed: false,
        validationErrors: [`Process error: ${err.message}`],
        timestamp: new Date().toISOString(),
      });
    });
  });
}

// Validate output against ground truth
function validateOutput(
  output: string,
  task: TestTask
): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  const lowerOutput = output.toLowerCase();

  if (task.groundTruth) {
    // Check required elements
    for (const required of task.groundTruth.requiredElements) {
      if (!lowerOutput.includes(required.toLowerCase())) {
        errors.push(`Missing required element: "${required}"`);
      }
    }

    // Check prohibited elements
    for (const prohibited of task.groundTruth.prohibitedElements) {
      if (lowerOutput.includes(prohibited.toLowerCase())) {
        errors.push(`Contains prohibited element: "${prohibited}"`);
      }
    }
  }

  // Check expected patterns if provided
  if (task.expectedOutputPatterns) {
    for (const pattern of task.expectedOutputPatterns) {
      if (!pattern.test(output)) {
        errors.push(`Missing expected pattern: ${pattern.source}`);
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

// Calculate statistics without fabrication
function calculateStats(results: TaskResult[]): {
  successRate: number;
  avgTime: number;
  validationPassRate: number;
} {
  if (results.length === 0) {
    return { successRate: 0, avgTime: 0, validationPassRate: 0 };
  }

  const successCount = results.filter((r) => r.success).length;
  const validationPassCount = results.filter((r) => r.validationPassed).length;
  const totalTime = results.reduce((sum, r) => sum + r.executionTimeMs, 0);

  return {
    successRate: successCount / results.length,
    avgTime: totalTime / results.length,
    validationPassRate: validationPassCount / results.length,
  };
}

// Run A/B test
export async function runABTest(
  configA: AgentConfig,
  configB: AgentConfig,
  tasks: TestTask[] = defaultTasks,
  iterations: number = 3
): Promise<ABTestReport> {
  const results: ABTestResult[] = [];

  for (const task of tasks) {
    const resultsA: TaskResult[] = [];
    const resultsB: TaskResult[] = [];

    // Run multiple iterations for statistical validity
    for (let i = 0; i < iterations; i++) {
      // Randomize order to reduce bias
      if (Math.random() > 0.5) {
        resultsA.push(await runAgentTask(configA, task));
        resultsB.push(await runAgentTask(configB, task));
      } else {
        resultsB.push(await runAgentTask(configB, task));
        resultsA.push(await runAgentTask(configA, task));
      }
    }

    const statsA = calculateStats(resultsA);
    const statsB = calculateStats(resultsB);

    const notes: string[] = [];

    // Add notes about statistical limitations
    if (iterations < 10) {
      notes.push(
        `Sample size (${iterations}) is small; results are preliminary and may not be statistically significant.`
      );
    }

    if (Math.abs(statsA.successRate - statsB.successRate) < 0.1) {
      notes.push('Success rates are similar; difference may not be meaningful.');
    }

    results.push({
      testId: `ab-${task.id}-${Date.now()}`,
      task,
      configA: { name: configA.name, results: resultsA },
      configB: { name: configB.name, results: resultsB },
      comparison: {
        successRateA: statsA.successRate,
        successRateB: statsB.successRate,
        avgTimeA: statsA.avgTime,
        avgTimeB: statsB.avgTime,
        validationPassRateA: statsA.validationPassRate,
        validationPassRateB: statsB.validationPassRate,
        sampleSize: iterations,
        notes,
      },
    });
  }

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    results,
    methodology:
      'A/B comparison with randomized execution order. Each task run multiple times per configuration.',
    limitations: [
      'Small sample sizes limit statistical confidence',
      'Single-machine execution may introduce environmental variance',
      'Results reflect test tasks only, not general performance',
      'No external validation of output quality beyond pattern matching',
    ],
  };
}

// Print report
function printReport(report: ABTestReport): void {
  console.log('='.repeat(70));
  console.log('A/B TEST REPORT');
  console.log('='.repeat(70));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Total Tests: ${report.totalTests}`);
  console.log(`Methodology: ${report.methodology}`);
  console.log();
  console.log('Limitations:');
  for (const limitation of report.limitations) {
    console.log(`  - ${limitation}`);
  }
  console.log('-'.repeat(70));

  for (const result of report.results) {
    console.log();
    console.log(`Task: ${result.task.name} (${result.task.id})`);
    console.log('-'.repeat(40));
    console.log(`Config A (${result.configA.name}):`);
    console.log(`  Success Rate: ${(result.comparison.successRateA * 100).toFixed(1)}%`);
    console.log(`  Validation Pass: ${(result.comparison.validationPassRateA * 100).toFixed(1)}%`);
    console.log(`  Avg Time: ${result.comparison.avgTimeA.toFixed(0)}ms`);
    console.log();
    console.log(`Config B (${result.configB.name}):`);
    console.log(`  Success Rate: ${(result.comparison.successRateB * 100).toFixed(1)}%`);
    console.log(`  Validation Pass: ${(result.comparison.validationPassRateB * 100).toFixed(1)}%`);
    console.log(`  Avg Time: ${result.comparison.avgTimeB.toFixed(0)}ms`);
    console.log();
    console.log(`Sample Size: ${result.comparison.sampleSize} iterations each`);

    if (result.comparison.notes.length > 0) {
      console.log('Notes:');
      for (const note of result.comparison.notes) {
        console.log(`  * ${note}`);
      }
    }
  }

  console.log('='.repeat(70));
}

// Save report to file
function saveReport(report: ABTestReport, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to: ${outputPath}`);
}

// Example configurations
const exampleConfigs = {
  baseline: {
    name: 'baseline',
    description: 'Standard Claude agent without memory/skills bootstrap',
    command: 'claude',
    args: ['-p'],
    bootstrap: {
      memoryEnabled: false,
      skillsEnabled: false,
    },
  } as AgentConfig,

  withMemory: {
    name: 'with-memory',
    description: 'Claude agent with memory bootstrap enabled',
    command: 'claude',
    args: ['-p'],
    bootstrap: {
      memoryEnabled: true,
      skillsEnabled: false,
    },
  } as AgentConfig,

  withSkills: {
    name: 'with-skills',
    description: 'Claude agent with skills bootstrap enabled',
    command: 'claude',
    args: ['-p'],
    bootstrap: {
      memoryEnabled: false,
      skillsEnabled: true,
    },
  } as AgentConfig,

  fullBootstrap: {
    name: 'full-bootstrap',
    description: 'Claude agent with full memory and skills bootstrap',
    command: 'claude',
    args: ['-p'],
    bootstrap: {
      memoryEnabled: true,
      skillsEnabled: true,
    },
  } as AgentConfig,
};

// CLI execution (ESM-compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  console.log('A/B Test Runner - Evidence-Based Agent Comparison');
  console.log();
  console.log('Note: Running actual tests requires agent processes.');
  console.log('This module exports functions for programmatic use.');
  console.log();
  console.log('Example usage:');
  console.log('  import { runABTest, exampleConfigs } from "./ab-test-runner";');
  console.log('  const report = await runABTest(exampleConfigs.baseline, exampleConfigs.fullBootstrap);');
  console.log();
  console.log('Available example configurations:');
  for (const [key, config] of Object.entries(exampleConfigs)) {
    console.log(`  - ${key}: ${config.description}`);
  }
}

export { exampleConfigs, defaultTasks, printReport, saveReport };
