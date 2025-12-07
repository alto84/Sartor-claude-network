/**
 * Performance Benchmark Script
 * Measures key metrics for the executive system
 */

import { createExecutive, AgentRole } from '../src/executive';
import { MemorySystem } from '../src/memory/memory-system';
import { MemoryType } from '../src/memory/memory-schema';

interface BenchmarkResult {
  name: string;
  avgLatencyMs: number;
  p95LatencyMs: number;
  throughput: number;
  passed: boolean;
}

async function benchmarkMemoryOperations(): Promise<BenchmarkResult> {
  const memory = new MemorySystem();
  const iterations = 100;
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await memory.createMemory(`Test content ${i}`, MemoryType.WORKING);
    latencies.push(Date.now() - start);
  }

  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95 = latencies[Math.floor(latencies.length * 0.95)];

  return {
    name: 'Memory Operations',
    avgLatencyMs: avg,
    p95LatencyMs: p95,
    throughput: iterations / (latencies.reduce((a, b) => a + b, 0) / 1000),
    passed: avg < 100 // Target: <100ms average
  };
}

async function benchmarkTaskDelegation(): Promise<BenchmarkResult> {
  const executive = createExecutive();
  const iterations = 20;
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await executive.delegateTask({
      id: `bench-${i}`,
      role: AgentRole.IMPLEMENTER,
      description: 'Benchmark task',
      context: '',
      maxIterations: 2
    });
    latencies.push(Date.now() - start);
  }

  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95 = latencies[Math.floor(latencies.length * 0.95)];

  return {
    name: 'Task Delegation',
    avgLatencyMs: avg,
    p95LatencyMs: p95,
    throughput: iterations / (latencies.reduce((a, b) => a + b, 0) / 1000),
    passed: avg < 500 // Target: <500ms per task
  };
}

async function runBenchmarks(): Promise<void> {
  console.log('Running Performance Benchmarks...\n');

  const results = await Promise.all([
    benchmarkMemoryOperations(),
    benchmarkTaskDelegation()
  ]);

  console.log('Results:');
  console.log('=========');
  for (const result of results) {
    console.log(`\n${result.name}:`);
    console.log(`  Avg Latency: ${result.avgLatencyMs.toFixed(2)}ms`);
    console.log(`  P95 Latency: ${result.p95LatencyMs.toFixed(2)}ms`);
    console.log(`  Throughput: ${result.throughput.toFixed(2)} ops/sec`);
    console.log(`  Status: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
  }

  const allPassed = results.every(r => r.passed);
  console.log(`\nOverall: ${allPassed ? '✅ ALL BENCHMARKS PASSED' : '❌ SOME BENCHMARKS FAILED'}`);
}

runBenchmarks().catch(console.error);
