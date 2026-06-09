/**
 * Performance Benchmark Suite for Memory Store
 *
 * Measures actual performance of memory operations under various conditions.
 * All results are measured values - no fabrication.
 */

import {
  storeMemory,
  queryMemory,
  clearWorkingMemory,
  summarizeMemories,
  configureCaching,
  getCacheStats,
  clearCache
} from './memory-store.ts';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

// Types
interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTimeMs: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  opsPerSecond: number;
  details?: Record<string, unknown>;
}

interface BenchmarkSuite {
  name: string;
  timestamp: string;
  nodeVersion: string;
  results: BenchmarkResult[];
  summary: {
    totalBenchmarks: number;
    totalIterations: number;
    totalTimeMs: number;
  };
}

// Test data of varying sizes
const testContent = {
  small: 'Short memory entry.',
  medium: `This is a medium-length memory entry that contains several sentences.
It simulates typical agent memories captured during a session.
The memory system should handle this size efficiently.`,
  large: `This is a larger memory entry simulating extensive session context.
It contains multiple paragraphs of information that an agent might store
for later retrieval and context injection.

The memory includes details about tasks completed, decisions made,
and context that should be preserved across sessions. This tests
how the memory system handles larger content sizes.

Additional paragraphs are included to increase the memory size and
simulate real-world usage patterns where agents store comprehensive
notes about their work.`,
};

// High precision timer
function measureTime(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

// Run a single benchmark
function runBenchmark(
  name: string,
  fn: () => void,
  iterations: number = 1000,
  warmupIterations: number = 10
): BenchmarkResult {
  const times: number[] = [];

  // Warm-up runs
  for (let i = 0; i < warmupIterations; i++) {
    fn();
  }

  // Measured runs
  for (let i = 0; i < iterations; i++) {
    const time = measureTime(fn);
    times.push(time);
  }

  const totalTimeMs = times.reduce((a, b) => a + b, 0);

  return {
    name,
    iterations,
    totalTimeMs,
    avgTimeMs: totalTimeMs / iterations,
    minTimeMs: Math.min(...times),
    maxTimeMs: Math.max(...times),
    opsPerSecond: (iterations / totalTimeMs) * 1000,
  };
}

// Format number with precision
function formatNum(n: number, decimals: number = 3): string {
  return n.toFixed(decimals);
}

// Setup benchmark environment
const BENCHMARK_MEMORY_PATH = '.swarm/memory-benchmark-temp';

function setupBenchmarkEnv(): void {
  if (existsSync(BENCHMARK_MEMORY_PATH)) {
    rmSync(BENCHMARK_MEMORY_PATH, { recursive: true, force: true });
  }
  mkdirSync(BENCHMARK_MEMORY_PATH, { recursive: true });
  process.env.MEMORY_PATH = BENCHMARK_MEMORY_PATH;
}

function cleanupBenchmarkEnv(): void {
  if (existsSync(BENCHMARK_MEMORY_PATH)) {
    rmSync(BENCHMARK_MEMORY_PATH, { recursive: true, force: true });
  }
}

// Pre-populate memory store for query benchmarks
function populateTestData(count: number): void {
  const types: Array<'episodic' | 'semantic' | 'working'> = ['episodic', 'semantic', 'working'];
  const topics = ['research', 'planning', 'execution', 'review'];
  const agents = ['agent-1', 'agent-2', 'agent-3'];

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const topic = topics[i % topics.length];
    const agentId = agents[i % agents.length];

    storeMemory({
      type,
      content: `Test memory entry ${i}: ${testContent.medium}`,
      metadata: {
        timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
        topic,
        agent_id: agentId,
        tags: ['benchmark', `entry-${i % 10}`],
      },
    });
  }
}

// Run full benchmark suite
function runBenchmarkSuite(): BenchmarkSuite {
  console.log('=== Memory Store Benchmark Suite ===\n');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Node Version: ${process.version}\n`);

  setupBenchmarkEnv();
  const results: BenchmarkResult[] = [];

  try {
    // Benchmark 1: Store small content (episodic)
    console.log('Running: Store small episodic memory...');
    let storeCounter = 0;
    results.push(runBenchmark('store-small-episodic', () => {
      storeMemory({
        type: 'episodic',
        content: testContent.small,
        metadata: {
          timestamp: new Date().toISOString(),
          topic: `test-${storeCounter++}`,
        },
      });
    }, 500, 5));

    // Benchmark 2: Store medium content (semantic)
    console.log('Running: Store medium semantic memory...');
    storeCounter = 0;
    results.push(runBenchmark('store-medium-semantic', () => {
      storeMemory({
        type: 'semantic',
        content: testContent.medium,
        metadata: {
          timestamp: new Date().toISOString(),
          topic: `topic-${storeCounter++ % 5}`,
        },
      });
    }, 300, 5));

    // Benchmark 3: Store large content (working)
    console.log('Running: Store large working memory...');
    storeCounter = 0;
    results.push(runBenchmark('store-large-working', () => {
      storeMemory({
        type: 'working',
        content: testContent.large,
        metadata: {
          timestamp: new Date().toISOString(),
          agent_id: `agent-${storeCounter++ % 3}`,
        },
      });
    }, 200, 5));

    // Clean and repopulate for query tests
    cleanupBenchmarkEnv();
    setupBenchmarkEnv();
    console.log('Populating test data for query benchmarks (500 entries)...');
    populateTestData(500);

    // Benchmark 4: Query by type
    console.log('Running: Query by type...');
    results.push(runBenchmark('query-by-type', () => {
      queryMemory({ type: 'episodic', limit: 20 });
    }, 500, 5));

    // Benchmark 5: Query by topic
    console.log('Running: Query by topic...');
    results.push(runBenchmark('query-by-topic', () => {
      queryMemory({ topic: 'research', limit: 20 });
    }, 500, 5));

    // Benchmark 6: Query by agent
    console.log('Running: Query by agent...');
    results.push(runBenchmark('query-by-agent', () => {
      queryMemory({ agent_id: 'agent-1', limit: 20 });
    }, 500, 5));

    // Benchmark 7: Query with text search
    console.log('Running: Query with text search...');
    results.push(runBenchmark('query-text-search', () => {
      queryMemory({ search: 'entry 42', limit: 10 });
    }, 300, 5));

    // Benchmark 8: Query with date range
    console.log('Running: Query with date range...');
    const baseTime = new Date();
    const afterTime = new Date(baseTime.getTime() - 300 * 60000).toISOString();
    const beforeTime = new Date(baseTime.getTime() - 100 * 60000).toISOString();
    results.push(runBenchmark('query-date-range', () => {
      queryMemory({ after: afterTime, before: beforeTime, limit: 20 });
    }, 500, 5));

    // Benchmark 9: Complex query (multiple filters)
    console.log('Running: Complex query (multiple filters)...');
    results.push(runBenchmark('query-complex', () => {
      queryMemory({
        type: 'semantic',
        topic: 'research',
        agent_id: 'agent-1',
        limit: 10,
      });
    }, 500, 5));

    // Benchmark 10: Summarize memories
    console.log('Running: Summarize memories...');
    results.push(runBenchmark('summarize-memories', () => {
      summarizeMemories({ topic: 'research' }, 1000);
    }, 200, 5));

    // Benchmark 11: Clear working memory
    console.log('Running: Clear working memory...');
    results.push(runBenchmark('clear-working-memory', () => {
      clearWorkingMemory('agent-bench');
    }, 500, 5));

    // Stress test: Large data set queries
    cleanupBenchmarkEnv();
    setupBenchmarkEnv();
    console.log('Populating test data for stress test (2000 entries)...');
    populateTestData(2000);

    // Benchmark 12: Query large dataset
    console.log('Running: Query large dataset...');
    results.push(runBenchmark('query-large-dataset', () => {
      queryMemory({ limit: 50 });
    }, 100, 5));

    // ====== CACHE PERFORMANCE BENCHMARKS ======
    console.log('\n--- Cache Performance Tests ---\n');

    // Clear existing cache and re-populate
    clearCache();
    cleanupBenchmarkEnv();
    setupBenchmarkEnv();
    console.log('Populating data for cache benchmarks (500 entries)...');
    populateTestData(500);

    // Benchmark 13: Query with cache disabled (cold reads)
    console.log('Running: Query with cache disabled...');
    configureCaching({ enabled: false });
    clearCache();
    results.push(runBenchmark('query-no-cache', () => {
      queryMemory({ type: 'semantic', limit: 20 });
    }, 100, 5));

    // Benchmark 14: Query with cache enabled (warm cache)
    console.log('Running: Query with cache enabled (warm)...');
    configureCaching({ enabled: true, ttlMs: 60000 });
    clearCache();
    // Warm up cache
    queryMemory({ type: 'semantic', limit: 20 });
    results.push(runBenchmark('query-with-cache', () => {
      queryMemory({ type: 'semantic', limit: 20 });
    }, 100, 5));

    // Benchmark 15: Cache hit ratio test
    console.log('Running: Cache hit ratio test...');
    clearCache();
    let cacheHits = 0;
    let cacheMisses = 0;
    const cacheTestIterations = 100;
    for (let i = 0; i < cacheTestIterations; i++) {
      const statsBefore = getCacheStats();
      queryMemory({ type: 'semantic', limit: 20 });
      const statsAfter = getCacheStats();
      if (statsAfter.size === statsBefore.size && statsBefore.size > 0) {
        cacheHits++;
      } else {
        cacheMisses++;
      }
    }
    console.log(`  Cache hits: ${cacheHits}, misses: ${cacheMisses}`);

    // Benchmark 16: Store with cache update
    console.log('Running: Store with cache update...');
    configureCaching({ enabled: true });
    clearCache();
    storeCounter = 0;
    results.push(runBenchmark('store-with-cache', () => {
      storeMemory({
        type: 'semantic',
        content: testContent.medium,
        metadata: {
          timestamp: new Date().toISOString(),
          topic: `cache-topic-${storeCounter++ % 3}`,
        },
      });
    }, 100, 5));

    // Benchmark 17: Cache eviction (LRU)
    console.log('Running: Cache eviction (LRU policy)...');
    configureCaching({ enabled: true, maxEntries: 10, ttlMs: 60000 });
    clearCache();
    let evictionCounter = 0;
    results.push(runBenchmark('cache-eviction-lru', () => {
      storeMemory({
        type: 'working',
        content: `Eviction test ${evictionCounter}`,
        metadata: {
          timestamp: new Date().toISOString(),
          agent_id: `evict-agent-${evictionCounter++ % 20}`,
        },
      });
    }, 100, 5));
    const evictionStats = getCacheStats();
    console.log(`  Cache size after eviction test: ${evictionStats.size} (max: 10)`);

    // Reset cache config to default
    configureCaching({ enabled: true, maxEntries: 100, ttlMs: 60000 });

    console.log('\n=== Results ===\n');

    // Print results table
    console.log('| Benchmark | Iterations | Avg (ms) | Min (ms) | Max (ms) | Ops/sec |');
    console.log('|-----------|------------|----------|----------|----------|---------|');

    for (const r of results) {
      console.log(
        `| ${r.name.padEnd(21)} | ${String(r.iterations).padStart(10)} | ${formatNum(r.avgTimeMs).padStart(8)} | ${formatNum(r.minTimeMs).padStart(8)} | ${formatNum(r.maxTimeMs).padStart(8)} | ${formatNum(r.opsPerSecond, 0).padStart(7)} |`
      );
    }

    const totalIterations = results.reduce((a, r) => a + r.iterations, 0);
    const totalTime = results.reduce((a, r) => a + r.totalTimeMs, 0);

    console.log('\n=== Summary ===\n');
    console.log(`Total benchmarks: ${results.length}`);
    console.log(`Total iterations: ${totalIterations}`);
    console.log(`Total time: ${formatNum(totalTime, 1)} ms`);
    console.log(`Overall throughput: ${formatNum((totalIterations / totalTime) * 1000, 0)} ops/sec`);

    // Performance analysis
    console.log('\n=== Analysis ===\n');

    const storeResults = results.filter(r => r.name.startsWith('store-') && !r.name.includes('cache'));
    const queryResults = results.filter(r => r.name.startsWith('query-') && !r.name.includes('cache') && r.name !== 'query-no-cache' && r.name !== 'query-with-cache');

    const avgStoreOps = storeResults.reduce((a, r) => a + r.opsPerSecond, 0) / storeResults.length;
    const avgQueryOps = queryResults.reduce((a, r) => a + r.opsPerSecond, 0) / queryResults.length;

    console.log(`Average store throughput: ${formatNum(avgStoreOps, 0)} ops/sec`);
    console.log(`Average query throughput: ${formatNum(avgQueryOps, 0)} ops/sec`);

    // Cache performance comparison
    const noCacheResult = results.find(r => r.name === 'query-no-cache');
    const withCacheResult = results.find(r => r.name === 'query-with-cache');
    if (noCacheResult && withCacheResult) {
      const speedup = noCacheResult.avgTimeMs / withCacheResult.avgTimeMs;
      console.log(`\nCache Performance:`);
      console.log(`  Without cache: ${formatNum(noCacheResult.avgTimeMs)} ms/op`);
      console.log(`  With cache: ${formatNum(withCacheResult.avgTimeMs)} ms/op`);
      console.log(`  Speedup factor: ${formatNum(speedup, 2)}x`);
    }

    // Detect potential issues
    const slowBenchmarks = results.filter(r => r.avgTimeMs > 10.0);
    if (slowBenchmarks.length > 0) {
      console.log(`\nNote: ${slowBenchmarks.length} benchmark(s) exceeded 10ms average.`);
      for (const b of slowBenchmarks) {
        console.log(`  - ${b.name}: ${formatNum(b.avgTimeMs)} ms avg`);
      }
    }

    return {
      name: 'memory-benchmark',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      results,
      summary: {
        totalBenchmarks: results.length,
        totalIterations,
        totalTimeMs: totalTime,
      },
    };

  } finally {
    cleanupBenchmarkEnv();
    delete process.env.MEMORY_PATH;
  }
}

// Export for programmatic use
export { runBenchmarkSuite, runBenchmark, BenchmarkResult, BenchmarkSuite };

// CLI entry point
if (process.argv[1]?.endsWith('memory-benchmark.ts')) {
  const suite = runBenchmarkSuite();

  // Optionally save results to file
  if (process.argv.includes('--save')) {
    const { writeFileSync, mkdirSync, existsSync } = await import('fs');
    const artifactsDir = '.swarm/artifacts';
    if (!existsSync(artifactsDir)) {
      mkdirSync(artifactsDir, { recursive: true });
    }
    const outputPath = `${artifactsDir}/memory-benchmark-${Date.now()}.json`;
    writeFileSync(outputPath, JSON.stringify(suite, null, 2));
    console.log(`\nResults saved to: ${outputPath}`);
  }
}
