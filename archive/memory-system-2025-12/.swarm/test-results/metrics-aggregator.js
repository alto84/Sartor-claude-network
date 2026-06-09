/**
 * Metrics Aggregator for Claude Swarm Framework
 *
 * Reads result files from the swarm system and calculates statistics for:
 * - health_check_duration: Time metrics from benchmark/validation runs
 * - complexity_scores: Operations per second and throughput metrics
 * - timeout_extensions: Duration metrics from agent requests
 *
 * Usage:
 *   node metrics-aggregator.js [results-path]
 *
 *   If no path provided, defaults to ../ (parent .swarm directory)
 *
 * Example:
 *   node metrics-aggregator.js /path/to/.swarm
 *   node metrics-aggregator.js  # uses default path
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Statistics calculation utilities
function calculateStats(values) {
  if (!values || values.length === 0) {
    return { count: 0, min: null, max: null, mean: null, median: null, stdDev: null };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / count;

  const median = count % 2 === 0
    ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
    : sorted[Math.floor(count / 2)];

  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  return {
    count,
    min: sorted[0],
    max: sorted[count - 1],
    mean: parseFloat(mean.toFixed(4)),
    median: parseFloat(median.toFixed(4)),
    stdDev: parseFloat(stdDev.toFixed(4))
  };
}

// Recursively find JSON files
function findJsonFiles(dir, files = []) {
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        findJsonFiles(fullPath, files);
      } else if (entry.endsWith('.json')) {
        files.push(fullPath);
      }
    } catch (e) {
      // Skip files we can't access
    }
  }
  return files;
}

// Parse and extract metrics from different file types
function extractMetrics(filePath, data) {
  const metrics = {
    health_check_duration: [],
    complexity_scores: [],
    timeout_extensions: []
  };

  // Benchmark files (validation-benchmark, memory-benchmark)
  if (data.name && data.name.includes('benchmark') && Array.isArray(data.results)) {
    for (const result of data.results) {
      // Health check durations from avgTimeMs
      if (typeof result.avgTimeMs === 'number') {
        metrics.health_check_duration.push(result.avgTimeMs);
      }
      // Complexity scores from opsPerSecond
      if (typeof result.opsPerSecond === 'number') {
        metrics.complexity_scores.push(result.opsPerSecond);
      }
      // Total time as timeout extensions proxy
      if (typeof result.totalTimeMs === 'number') {
        metrics.timeout_extensions.push(result.totalTimeMs);
      }
    }
  }

  // Request result files
  if (data.requestId && typeof data.durationMs === 'number') {
    metrics.timeout_extensions.push(data.durationMs);
  }

  // Validation result files
  if (data.summary && typeof data.summary.errors === 'number') {
    // Use pass/fail as a complexity indicator (0 = simple pass, more = complex)
    const complexityScore = data.summary.errors + (data.summary.warnings || 0);
    metrics.complexity_scores.push(complexityScore);
  }

  return metrics;
}

// Main aggregation function
function aggregateMetrics(basePath) {
  const allMetrics = {
    health_check_duration: [],
    complexity_scores: [],
    timeout_extensions: []
  };

  const filesProcessed = [];
  const errors = [];

  // Find all JSON files in the swarm directory
  const jsonFiles = findJsonFiles(basePath);

  for (const filePath of jsonFiles) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      const metrics = extractMetrics(filePath, data);

      // Merge metrics
      for (const key of Object.keys(allMetrics)) {
        allMetrics[key].push(...metrics[key]);
      }

      if (metrics.health_check_duration.length > 0 ||
          metrics.complexity_scores.length > 0 ||
          metrics.timeout_extensions.length > 0) {
        filesProcessed.push(filePath);
      }
    } catch (e) {
      errors.push({ file: filePath, error: e.message });
    }
  }

  // Calculate statistics for each metric
  const statistics = {};
  for (const [key, values] of Object.entries(allMetrics)) {
    statistics[key] = calculateStats(values);
  }

  return {
    timestamp: new Date().toISOString(),
    basePath,
    filesScanned: jsonFiles.length,
    filesWithMetrics: filesProcessed.length,
    errors: errors.length,
    statistics,
    raw: {
      health_check_duration_count: allMetrics.health_check_duration.length,
      complexity_scores_count: allMetrics.complexity_scores.length,
      timeout_extensions_count: allMetrics.timeout_extensions.length
    }
  };
}

// Format report for display
function formatReport(aggregation) {
  const lines = [
    '═══════════════════════════════════════════════════════════',
    '           METRICS AGGREGATION REPORT',
    '═══════════════════════════════════════════════════════════',
    '',
    `Timestamp: ${aggregation.timestamp}`,
    `Base Path: ${aggregation.basePath}`,
    `Files Scanned: ${aggregation.filesScanned}`,
    `Files With Metrics: ${aggregation.filesWithMetrics}`,
    `Parse Errors: ${aggregation.errors}`,
    '',
    '───────────────────────────────────────────────────────────',
    '  HEALTH CHECK DURATION (ms)',
    '───────────────────────────────────────────────────────────',
  ];

  const hcd = aggregation.statistics.health_check_duration;
  if (hcd.count > 0) {
    lines.push(`  Count:  ${hcd.count}`);
    lines.push(`  Min:    ${hcd.min.toFixed(4)} ms`);
    lines.push(`  Max:    ${hcd.max.toFixed(4)} ms`);
    lines.push(`  Mean:   ${hcd.mean.toFixed(4)} ms`);
    lines.push(`  Median: ${hcd.median.toFixed(4)} ms`);
    lines.push(`  StdDev: ${hcd.stdDev.toFixed(4)} ms`);
  } else {
    lines.push('  No data available');
  }

  lines.push('');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push('  COMPLEXITY SCORES (ops/sec or error count)');
  lines.push('───────────────────────────────────────────────────────────');

  const cs = aggregation.statistics.complexity_scores;
  if (cs.count > 0) {
    lines.push(`  Count:  ${cs.count}`);
    lines.push(`  Min:    ${cs.min.toFixed(4)}`);
    lines.push(`  Max:    ${cs.max.toFixed(4)}`);
    lines.push(`  Mean:   ${cs.mean.toFixed(4)}`);
    lines.push(`  Median: ${cs.median.toFixed(4)}`);
    lines.push(`  StdDev: ${cs.stdDev.toFixed(4)}`);
  } else {
    lines.push('  No data available');
  }

  lines.push('');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push('  TIMEOUT EXTENSIONS / DURATIONS (ms)');
  lines.push('───────────────────────────────────────────────────────────');

  const te = aggregation.statistics.timeout_extensions;
  if (te.count > 0) {
    lines.push(`  Count:  ${te.count}`);
    lines.push(`  Min:    ${te.min.toFixed(2)} ms`);
    lines.push(`  Max:    ${te.max.toFixed(2)} ms`);
    lines.push(`  Mean:   ${te.mean.toFixed(2)} ms`);
    lines.push(`  Median: ${te.median.toFixed(2)} ms`);
    lines.push(`  StdDev: ${te.stdDev.toFixed(2)} ms`);
  } else {
    lines.push('  No data available');
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}

// CLI entry point
function main() {
  const args = process.argv.slice(2);
  const basePath = args[0] || join(__dirname, '..');

  console.log(`Aggregating metrics from: ${basePath}\n`);

  const result = aggregateMetrics(basePath);
  const report = formatReport(result);

  console.log(report);
  console.log('\nJSON Output:');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

// Export for programmatic use
export { aggregateMetrics, calculateStats, formatReport };

// Run if called directly
main();
