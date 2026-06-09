/**
 * Meta-Learning Tracker - Self-Improvement Pattern Analysis
 *
 * Tracks modification outcomes and analyzes patterns to improve the
 * self-improvement strategy itself. Learns which types of changes work,
 * which targets are improvable, and which hypotheses lead to success.
 *
 * Design principles:
 * - Evidence-based: All insights backed by actual outcome data
 * - Conservative: Require sufficient sample size before claiming patterns
 * - Transparent: All reasoning and data available for audit
 * - Anti-fabrication: No composite scores without calculation basis
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
export interface ModificationOutcome {
  hypothesisId: string;
  type: 'addition' | 'removal' | 'reword';
  target: string;
  result: 'success' | 'failure' | 'neutral';
  improvementPercent: number;
  timestamp: string;
  metadata?: {
    testsImproved: number;
    testsRegressed: number;
    netChange: number;
    decisionId?: string;
  };
}

export interface MetaLearningInsight {
  pattern: string;
  confidence: number;
  evidence: string[];
  recommendation: string;
  sampleSize: number;
  limitations: string[];
}

export interface OutcomeFilter {
  type?: 'addition' | 'removal' | 'reword';
  target?: string;
  result?: 'success' | 'failure' | 'neutral';
  minImprovement?: number;
  maxImprovement?: number;
  startDate?: string;
  endDate?: string;
}

export interface SuccessRateByType {
  addition: {
    total: number;
    successful: number;
    failed: number;
    neutral: number;
    rate: number;
  };
  removal: {
    total: number;
    successful: number;
    failed: number;
    neutral: number;
    rate: number;
  };
  reword: {
    total: number;
    successful: number;
    failed: number;
    neutral: number;
    rate: number;
  };
}

export interface SuccessRateByTarget {
  [target: string]: {
    total: number;
    successful: number;
    failed: number;
    neutral: number;
    rate: number;
    mostSuccessfulType?: string;
  };
}

export interface ImprovementTrajectory {
  timestamps: string[];
  cumulativeImprovement: number[];
  movingAverage: number[];
  trend: 'improving' | 'plateauing' | 'declining' | 'insufficient_data';
  velocityPerWeek: number;
}

export interface Hypothesis {
  id: string;
  type: 'addition' | 'removal' | 'reword';
  target: string;
  description: string;
  expectedImprovement: number;
}

export interface MetaLearningTracker {
  recordOutcome(outcome: ModificationOutcome): Promise<void>;
  getOutcomes(filter?: OutcomeFilter): Promise<ModificationOutcome[]>;
  analyzePatterns(): Promise<MetaLearningInsight[]>;
  getSuccessRateByType(): Promise<SuccessRateByType>;
  getSuccessRateByTarget(): Promise<SuccessRateByTarget>;
  getImprovementTrajectory(): Promise<ImprovementTrajectory>;
  predictSuccess(hypothesis: Hypothesis): number;
  exportData(): Promise<string>;
}

/**
 * Calculate success rate with conservative estimation
 */
function calculateSuccessRate(successful: number, total: number): number {
  if (total === 0) return 0;
  return successful / total;
}

/**
 * Apply filters to outcomes array
 */
function applyFilters(
  outcomes: ModificationOutcome[],
  filter?: OutcomeFilter
): ModificationOutcome[] {
  if (!filter) return outcomes;

  return outcomes.filter((outcome) => {
    if (filter.type && outcome.type !== filter.type) return false;
    if (filter.target && outcome.target !== filter.target) return false;
    if (filter.result && outcome.result !== filter.result) return false;

    if (
      filter.minImprovement !== undefined &&
      outcome.improvementPercent < filter.minImprovement
    ) {
      return false;
    }

    if (
      filter.maxImprovement !== undefined &&
      outcome.improvementPercent > filter.maxImprovement
    ) {
      return false;
    }

    if (filter.startDate && outcome.timestamp < filter.startDate) return false;
    if (filter.endDate && outcome.timestamp > filter.endDate) return false;

    return true;
  });
}

/**
 * Calculate moving average for trajectory analysis
 */
function calculateMovingAverage(
  values: number[],
  windowSize: number = 5
): number[] {
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(avg);
  }

  return result;
}

/**
 * Determine trend from trajectory data
 */
function determineTrend(
  movingAverage: number[]
): 'improving' | 'plateauing' | 'declining' | 'insufficient_data' {
  if (movingAverage.length < 5) return 'insufficient_data';

  const recent = movingAverage.slice(-5);
  const earlier = movingAverage.slice(-10, -5);

  if (earlier.length === 0) return 'insufficient_data';

  const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
  const earlierAvg =
    earlier.reduce((sum, val) => sum + val, 0) / earlier.length;

  const change = recentAvg - earlierAvg;
  const threshold = 0.05; // 5% threshold for detecting change

  if (change > threshold) return 'improving';
  if (change < -threshold) return 'declining';
  return 'plateauing';
}

/**
 * Calculate improvement velocity (improvements per week)
 */
function calculateVelocity(
  timestamps: string[],
  improvements: number[]
): number {
  if (timestamps.length < 2) return 0;

  const firstDate = new Date(timestamps[0]);
  const lastDate = new Date(timestamps[timestamps.length - 1]);
  const daysDiff =
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff < 1) return 0;

  const totalImprovement = improvements[improvements.length - 1] - improvements[0];
  const weeks = daysDiff / 7;

  return totalImprovement / weeks;
}

/**
 * Create meta-learning tracker instance
 */
export function createMetaLearningTracker(
  storageDir: string = '.swarm/meta-learning'
): MetaLearningTracker {
  // Ensure storage directory exists
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const outcomesFile = path.join(storageDir, 'outcomes.json');
  const indexFile = path.join(storageDir, 'index.json');

  // Initialize storage files if they don't exist
  if (!fs.existsSync(outcomesFile)) {
    fs.writeFileSync(outcomesFile, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(indexFile)) {
    fs.writeFileSync(
      indexFile,
      JSON.stringify(
        {
          totalOutcomes: 0,
          lastUpdated: new Date().toISOString(),
          version: '1.0.0',
        },
        null,
        2
      )
    );
  }

  /**
   * Load all outcomes from storage
   */
  async function loadOutcomes(): Promise<ModificationOutcome[]> {
    const data = fs.readFileSync(outcomesFile, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Save outcomes to storage
   */
  async function saveOutcomes(outcomes: ModificationOutcome[]): Promise<void> {
    fs.writeFileSync(outcomesFile, JSON.stringify(outcomes, null, 2));

    // Update index
    const index = {
      totalOutcomes: outcomes.length,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };
    fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
  }

  return {
    /**
     * Record a modification outcome
     */
    async recordOutcome(outcome: ModificationOutcome): Promise<void> {
      const outcomes = await loadOutcomes();
      outcomes.push(outcome);
      await saveOutcomes(outcomes);

      // Also save individual outcome file for audit
      const outcomeFile = path.join(
        storageDir,
        `outcome-${outcome.hypothesisId}.json`
      );
      fs.writeFileSync(
        outcomeFile,
        JSON.stringify(
          {
            ...outcome,
            _audit: {
              recordedAt: new Date().toISOString(),
              version: '1.0.0',
            },
          },
          null,
          2
        )
      );
    },

    /**
     * Retrieve outcomes with optional filtering
     */
    async getOutcomes(filter?: OutcomeFilter): Promise<ModificationOutcome[]> {
      const outcomes = await loadOutcomes();
      return applyFilters(outcomes, filter);
    },

    /**
     * Analyze patterns and generate insights
     */
    async analyzePatterns(): Promise<MetaLearningInsight[]> {
      const outcomes = await loadOutcomes();
      const insights: MetaLearningInsight[] = [];

      // Minimum sample size for pattern detection
      const MIN_SAMPLE_SIZE = 5;

      // Pattern 1: Success rate by modification type
      const typeStats = await this.getSuccessRateByType();

      for (const [type, stats] of Object.entries(typeStats)) {
        if (stats.total >= MIN_SAMPLE_SIZE) {
          const ratePercent = (stats.rate * 100).toFixed(1);
          const evidence = [
            `${stats.successful} of ${stats.total} ${type} modifications succeeded`,
            `${stats.failed} failed`,
            `${stats.neutral} had no measurable effect`,
          ];

          let confidence = 0.3; // Base confidence
          if (stats.total >= 10) confidence = 0.5;
          if (stats.total >= 20) confidence = 0.7;

          let recommendation = '';
          if (stats.rate > 0.6) {
            recommendation = `${type} modifications show promising results. Consider prioritizing this type.`;
          } else if (stats.rate < 0.3) {
            recommendation = `${type} modifications have low success rate. Review approach or reduce frequency.`;
          } else {
            recommendation = `${type} modifications show moderate success. Continue with caution.`;
          }

          insights.push({
            pattern: `${type} modifications succeed ${ratePercent}% of the time`,
            confidence,
            evidence,
            recommendation,
            sampleSize: stats.total,
            limitations: [
              'Based on historical data only',
              'Past performance may not predict future results',
              `Sample size: ${stats.total} (${stats.total < 20 ? 'small' : 'moderate'})`,
            ],
          });
        }
      }

      // Pattern 2: Target-specific insights
      const targetStats = await this.getSuccessRateByTarget();

      for (const [target, stats] of Object.entries(targetStats)) {
        if (stats.total >= MIN_SAMPLE_SIZE) {
          const ratePercent = (stats.rate * 100).toFixed(1);
          const evidence = [
            `${stats.successful} of ${stats.total} modifications to ${target} succeeded`,
            stats.mostSuccessfulType
              ? `Most successful type: ${stats.mostSuccessfulType}`
              : 'No clear pattern in modification type',
          ];

          insights.push({
            pattern: `${target} modifications succeed ${ratePercent}% of the time`,
            confidence: stats.total >= 10 ? 0.6 : 0.4,
            evidence,
            recommendation:
              stats.rate > 0.5
                ? `${target} is a promising target for improvements`
                : `${target} modifications face challenges. Review approach.`,
            sampleSize: stats.total,
            limitations: [
              'Target-specific context may vary',
              `Sample size: ${stats.total}`,
            ],
          });
        }
      }

      // Pattern 3: Regression risk analysis
      const withRegressions = outcomes.filter(
        (o) => o.metadata && o.metadata.testsRegressed > 0
      );

      if (outcomes.length >= MIN_SAMPLE_SIZE) {
        const regressionRate = withRegressions.length / outcomes.length;
        const regressionPercent = (regressionRate * 100).toFixed(1);

        const typeBreakdown: Record<string, number> = {
          addition: 0,
          removal: 0,
          reword: 0,
        };

        withRegressions.forEach((o) => {
          typeBreakdown[o.type]++;
        });

        const highestRisk = Object.entries(typeBreakdown).reduce((a, b) =>
          a[1] > b[1] ? a : b
        )[0];

        insights.push({
          pattern: `${regressionPercent}% of modifications caused regressions`,
          confidence: 0.7,
          evidence: [
            `${withRegressions.length} of ${outcomes.length} modifications regressed`,
            `Highest risk type: ${highestRisk} (${typeBreakdown[highestRisk]} regressions)`,
          ],
          recommendation:
            regressionRate > 0.3
              ? 'High regression rate detected. Review testing procedures and modification strategy.'
              : 'Regression rate is acceptable. Continue current approach.',
          sampleSize: outcomes.length,
          limitations: ['Regression may be test-specific'],
        });
      }

      // Pattern 4: Improvement magnitude analysis
      const successful = outcomes.filter((o) => o.result === 'success');

      if (successful.length >= MIN_SAMPLE_SIZE) {
        const avgImprovement =
          successful.reduce((sum, o) => sum + o.improvementPercent, 0) /
          successful.length;

        const largeImprovements = successful.filter(
          (o) => o.improvementPercent > 10
        );

        insights.push({
          pattern: `Average improvement magnitude: ${avgImprovement.toFixed(1)}%`,
          confidence: 0.6,
          evidence: [
            `${successful.length} successful modifications analyzed`,
            `${largeImprovements.length} had >10% improvement`,
            `Range: ${Math.min(...successful.map((o) => o.improvementPercent)).toFixed(1)}% to ${Math.max(...successful.map((o) => o.improvementPercent)).toFixed(1)}%`,
          ],
          recommendation:
            avgImprovement > 5
              ? 'Successful modifications show meaningful impact. Continue strategy.'
              : 'Improvements are small. Consider more targeted hypotheses.',
          sampleSize: successful.length,
          limitations: [
            'Improvement measured on limited test suite',
            'May not generalize to all scenarios',
          ],
        });
      }

      // If insufficient data, add note
      if (outcomes.length < MIN_SAMPLE_SIZE) {
        insights.push({
          pattern: 'Insufficient data for pattern analysis',
          confidence: 0,
          evidence: [`Only ${outcomes.length} outcomes recorded`],
          recommendation: `Collect at least ${MIN_SAMPLE_SIZE} outcomes before analyzing patterns`,
          sampleSize: outcomes.length,
          limitations: ['Cannot detect patterns with small sample size'],
        });
      }

      return insights;
    },

    /**
     * Get success rates by modification type
     */
    async getSuccessRateByType(): Promise<SuccessRateByType> {
      const outcomes = await loadOutcomes();

      const stats: SuccessRateByType = {
        addition: { total: 0, successful: 0, failed: 0, neutral: 0, rate: 0 },
        removal: { total: 0, successful: 0, failed: 0, neutral: 0, rate: 0 },
        reword: { total: 0, successful: 0, failed: 0, neutral: 0, rate: 0 },
      };

      outcomes.forEach((outcome) => {
        const typeStat = stats[outcome.type];
        typeStat.total++;

        if (outcome.result === 'success') typeStat.successful++;
        else if (outcome.result === 'failure') typeStat.failed++;
        else typeStat.neutral++;
      });

      // Calculate rates
      stats.addition.rate = calculateSuccessRate(
        stats.addition.successful,
        stats.addition.total
      );
      stats.removal.rate = calculateSuccessRate(
        stats.removal.successful,
        stats.removal.total
      );
      stats.reword.rate = calculateSuccessRate(
        stats.reword.successful,
        stats.reword.total
      );

      return stats;
    },

    /**
     * Get success rates by target
     */
    async getSuccessRateByTarget(): Promise<SuccessRateByTarget> {
      const outcomes = await loadOutcomes();
      const targetMap: SuccessRateByTarget = {};

      outcomes.forEach((outcome) => {
        if (!targetMap[outcome.target]) {
          targetMap[outcome.target] = {
            total: 0,
            successful: 0,
            failed: 0,
            neutral: 0,
            rate: 0,
          };
        }

        const targetStat = targetMap[outcome.target];
        targetStat.total++;

        if (outcome.result === 'success') targetStat.successful++;
        else if (outcome.result === 'failure') targetStat.failed++;
        else targetStat.neutral++;
      });

      // Calculate rates and find most successful type per target
      for (const target of Object.keys(targetMap)) {
        const stat = targetMap[target];
        stat.rate = calculateSuccessRate(stat.successful, stat.total);

        // Find most successful modification type for this target
        const targetOutcomes = outcomes.filter((o) => o.target === target);
        const typeSuccess: Record<string, number> = {
          addition: 0,
          removal: 0,
          reword: 0,
        };

        targetOutcomes.forEach((o) => {
          if (o.result === 'success') {
            typeSuccess[o.type]++;
          }
        });

        const mostSuccessful = Object.entries(typeSuccess).reduce((a, b) =>
          a[1] > b[1] ? a : b
        );

        if (mostSuccessful[1] > 0) {
          stat.mostSuccessfulType = mostSuccessful[0];
        }
      }

      return targetMap;
    },

    /**
     * Get improvement trajectory over time
     */
    async getImprovementTrajectory(): Promise<ImprovementTrajectory> {
      const outcomes = await loadOutcomes();

      // Sort by timestamp
      const sorted = [...outcomes].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const timestamps: string[] = [];
      const cumulativeImprovement: number[] = [];
      let cumulative = 0;

      sorted.forEach((outcome) => {
        timestamps.push(outcome.timestamp);
        if (outcome.result === 'success') {
          cumulative += outcome.improvementPercent;
        } else if (outcome.result === 'failure') {
          cumulative -= Math.abs(outcome.improvementPercent); // Count regressions negatively
        }
        cumulativeImprovement.push(cumulative);
      });

      const movingAverage = calculateMovingAverage(cumulativeImprovement, 5);
      const trend = determineTrend(movingAverage);
      const velocityPerWeek = calculateVelocity(timestamps, cumulativeImprovement);

      return {
        timestamps,
        cumulativeImprovement,
        movingAverage,
        trend,
        velocityPerWeek,
      };
    },

    /**
     * Predict success probability for a hypothesis
     * Based on historical data for similar modifications
     */
    predictSuccess(hypothesis: Hypothesis): number {
      const outcomes = fs.existsSync(outcomesFile)
        ? JSON.parse(fs.readFileSync(outcomesFile, 'utf-8'))
        : [];

      if (outcomes.length === 0) {
        // No data, return neutral probability
        return 0.5;
      }

      // Find similar modifications (same type and target)
      const similar = outcomes.filter(
        (o: ModificationOutcome) =>
          o.type === hypothesis.type && o.target === hypothesis.target
      );

      // If we have similar examples, use their success rate
      if (similar.length > 0) {
        const successful = similar.filter(
          (o: ModificationOutcome) => o.result === 'success'
        ).length;
        return calculateSuccessRate(successful, similar.length);
      }

      // Otherwise, use success rate for the type alone
      const sameType = outcomes.filter(
        (o: ModificationOutcome) => o.type === hypothesis.type
      );

      if (sameType.length > 0) {
        const successful = sameType.filter(
          (o: ModificationOutcome) => o.result === 'success'
        ).length;
        return calculateSuccessRate(successful, sameType.length);
      }

      // No relevant data, return neutral probability
      return 0.5;
    },

    /**
     * Export all data for analysis
     */
    async exportData(): Promise<string> {
      const outcomes = await loadOutcomes();
      const typeStats = await this.getSuccessRateByType();
      const targetStats = await this.getSuccessRateByTarget();
      const trajectory = await this.getImprovementTrajectory();
      const insights = await this.analyzePatterns();

      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalOutcomes: outcomes.length,
          version: '1.0.0',
        },
        outcomes,
        statistics: {
          byType: typeStats,
          byTarget: targetStats,
          trajectory,
        },
        insights,
      };

      const exportPath = path.join(
        storageDir,
        `export-${Date.now()}.json`
      );

      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

      return exportPath;
    },
  };
}

/**
 * Print meta-learning insights
 */
export function printInsights(insights: MetaLearningInsight[]): void {
  console.log('='.repeat(70));
  console.log('META-LEARNING INSIGHTS');
  console.log('='.repeat(70));

  if (insights.length === 0) {
    console.log('No insights available yet.');
    return;
  }

  insights.forEach((insight, index) => {
    console.log(`\n[${index + 1}] ${insight.pattern}`);
    console.log(`Confidence: ${(insight.confidence * 100).toFixed(0)}%`);
    console.log(`Sample Size: ${insight.sampleSize}`);
    console.log('\nEvidence:');
    insight.evidence.forEach((e) => console.log(`  - ${e}`));
    console.log('\nRecommendation:');
    console.log(`  ${insight.recommendation}`);
    console.log('\nLimitations:');
    insight.limitations.forEach((l) => console.log(`  - ${l}`));
    console.log('-'.repeat(70));
  });
}

/**
 * Print success rates summary
 */
export function printSuccessRates(
  byType: SuccessRateByType,
  byTarget: SuccessRateByTarget
): void {
  console.log('='.repeat(70));
  console.log('SUCCESS RATES SUMMARY');
  console.log('='.repeat(70));

  console.log('\nBy Modification Type:');
  console.log('-'.repeat(70));

  for (const [type, stats] of Object.entries(byType)) {
    const ratePercent = (stats.rate * 100).toFixed(1);
    console.log(`\n${type.toUpperCase()}:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  Successful: ${stats.successful}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Neutral: ${stats.neutral}`);
    console.log(`  Success Rate: ${ratePercent}%`);
  }

  console.log('\n\nBy Target:');
  console.log('-'.repeat(70));

  for (const [target, stats] of Object.entries(byTarget)) {
    const ratePercent = (stats.rate * 100).toFixed(1);
    console.log(`\n${target}:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  Successful: ${stats.successful}`);
    console.log(`  Success Rate: ${ratePercent}%`);
    if (stats.mostSuccessfulType) {
      console.log(`  Most Successful Type: ${stats.mostSuccessfulType}`);
    }
  }

  console.log('='.repeat(70));
}

/**
 * Print improvement trajectory
 */
export function printTrajectory(trajectory: ImprovementTrajectory): void {
  console.log('='.repeat(70));
  console.log('IMPROVEMENT TRAJECTORY');
  console.log('='.repeat(70));

  console.log(`\nTrend: ${trajectory.trend.toUpperCase()}`);
  console.log(
    `Velocity: ${trajectory.velocityPerWeek.toFixed(2)}% improvement per week`
  );
  console.log(`Data Points: ${trajectory.timestamps.length}`);

  if (trajectory.timestamps.length > 0) {
    const latest = trajectory.cumulativeImprovement[trajectory.cumulativeImprovement.length - 1];
    console.log(`\nCumulative Improvement: ${latest.toFixed(2)}%`);

    if (trajectory.timestamps.length >= 5) {
      const recentAvg =
        trajectory.movingAverage[trajectory.movingAverage.length - 1];
      console.log(`Recent Average: ${recentAvg.toFixed(2)}%`);
    }
  }

  console.log('='.repeat(70));
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  console.log('Meta-Learning Tracker - Self-Improvement Pattern Analysis');
  console.log();
  console.log('This module tracks modification outcomes and learns which');
  console.log('types of changes work best for self-improvement.');
  console.log();
  console.log('Features:');
  console.log('  - Track modification outcomes (success/failure/neutral)');
  console.log('  - Analyze patterns by type and target');
  console.log('  - Predict success probability for new hypotheses');
  console.log('  - Monitor improvement trajectory over time');
  console.log('  - Generate evidence-based recommendations');
  console.log();
  console.log('Example usage:');
  console.log('  import { createMetaLearningTracker } from "./meta-learning";');
  console.log('  const tracker = createMetaLearningTracker();');
  console.log('  await tracker.recordOutcome({ ... });');
  console.log('  const insights = await tracker.analyzePatterns();');
}

export {
  calculateSuccessRate,
  applyFilters,
  calculateMovingAverage,
  determineTrend,
  calculateVelocity,
};
