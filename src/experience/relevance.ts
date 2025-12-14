/**
 * Smart Relevance Filtering Module
 *
 * Provides intelligent filtering and ranking of context based on
 * multiple relevance signals and machine learning-inspired scoring.
 *
 * Features:
 * - Multi-signal relevance scoring
 * - Recency weighting
 * - Usage frequency tracking
 * - Contextual boosting
 * - Adaptive thresholds
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Relevance signal types
 */
export enum RelevanceSignal {
  KEYWORD_MATCH = 'keyword_match',
  SEMANTIC_SIMILARITY = 'semantic_similarity',
  RECENCY = 'recency',
  FREQUENCY = 'frequency',
  PROXIMITY = 'proximity',
  AUTHORITY = 'authority',
  USER_PREFERENCE = 'user_preference',
  TASK_CONTEXT = 'task_context',
}

/**
 * Scored item
 */
export interface ScoredItem<T> {
  item: T;
  score: number;
  signals: SignalScore[];
  rank: number;
  explanation?: string;
}

/**
 * Individual signal score
 */
export interface SignalScore {
  signal: RelevanceSignal;
  value: number;
  weight: number;
  contribution: number;
}

/**
 * Relevance filter configuration
 */
export interface RelevanceConfig {
  signals: SignalWeight[];
  threshold?: number;
  maxResults?: number;
  boostFactors?: BoostFactor[];
  penaltyFactors?: PenaltyFactor[];
  adaptiveThreshold?: boolean;
}

/**
 * Signal weight configuration
 */
export interface SignalWeight {
  signal: RelevanceSignal;
  weight: number;
  normalizer?: (value: number) => number;
}

/**
 * Boost factor for increasing scores
 */
export interface BoostFactor {
  condition: (item: any) => boolean;
  multiplier: number;
  reason: string;
}

/**
 * Penalty factor for decreasing scores
 */
export interface PenaltyFactor {
  condition: (item: any) => boolean;
  multiplier: number;
  reason: string;
}

/**
 * Usage tracking entry
 */
interface UsageEntry {
  itemId: string;
  accessCount: number;
  lastAccess: number;
  totalDuration: number;
  positive: number;
  negative: number;
}

/**
 * Context for relevance calculation
 */
export interface RelevanceContext {
  taskType?: string;
  keywords?: string[];
  currentFile?: string;
  recentFiles?: string[];
  userPreferences?: Record<string, number>;
  timeConstraint?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_THRESHOLD = 0.3;
const DEFAULT_MAX_RESULTS = 50;
const RECENCY_DECAY_RATE = 0.0001; // Per millisecond
const FREQUENCY_SATURATION = 100; // Max access count for full score

/**
 * Default signal weights (sum to 1.0)
 */
const DEFAULT_SIGNAL_WEIGHTS: SignalWeight[] = [
  { signal: RelevanceSignal.KEYWORD_MATCH, weight: 0.25 },
  { signal: RelevanceSignal.SEMANTIC_SIMILARITY, weight: 0.2 },
  { signal: RelevanceSignal.RECENCY, weight: 0.15 },
  { signal: RelevanceSignal.FREQUENCY, weight: 0.1 },
  { signal: RelevanceSignal.PROXIMITY, weight: 0.1 },
  { signal: RelevanceSignal.AUTHORITY, weight: 0.1 },
  { signal: RelevanceSignal.USER_PREFERENCE, weight: 0.05 },
  { signal: RelevanceSignal.TASK_CONTEXT, weight: 0.05 },
];

// ============================================================================
// RELEVANCE FILTER
// ============================================================================

/**
 * Smart relevance filter for ranking and filtering items
 */
export class RelevanceFilter<T> {
  private config: Required<
    Omit<RelevanceConfig, 'boostFactors' | 'penaltyFactors' | 'adaptiveThreshold'>
  > & {
    boostFactors: BoostFactor[];
    penaltyFactors: PenaltyFactor[];
    adaptiveThreshold: boolean;
  };
  private usageTracking: Map<string, UsageEntry> = new Map();
  private recentScores: number[] = [];
  private adaptedThreshold: number;

  constructor(config: Partial<RelevanceConfig> = {}) {
    this.config = {
      signals: config.signals ?? DEFAULT_SIGNAL_WEIGHTS,
      threshold: config.threshold ?? DEFAULT_THRESHOLD,
      maxResults: config.maxResults ?? DEFAULT_MAX_RESULTS,
      boostFactors: config.boostFactors ?? [],
      penaltyFactors: config.penaltyFactors ?? [],
      adaptiveThreshold: config.adaptiveThreshold ?? false,
    };
    this.adaptedThreshold = this.config.threshold;
  }

  /**
   * Filter and rank items by relevance
   */
  filter(
    items: T[],
    signalExtractor: (item: T) => Map<RelevanceSignal, number>,
    context?: RelevanceContext,
    idExtractor?: (item: T) => string
  ): ScoredItem<T>[] {
    const scoredItems: ScoredItem<T>[] = [];

    for (const item of items) {
      const signals = signalExtractor(item);
      const signalScores = this.calculateSignalScores(signals, context);
      const baseScore = this.aggregateScores(signalScores);

      // Apply boosts and penalties
      let finalScore = baseScore;
      const boostReasons: string[] = [];

      for (const boost of this.config.boostFactors) {
        if (boost.condition(item)) {
          finalScore *= boost.multiplier;
          boostReasons.push(`+${boost.reason}`);
        }
      }

      for (const penalty of this.config.penaltyFactors) {
        if (penalty.condition(item)) {
          finalScore *= penalty.multiplier;
          boostReasons.push(`-${penalty.reason}`);
        }
      }

      // Track for adaptive threshold
      this.recentScores.push(finalScore);
      if (this.recentScores.length > 1000) {
        this.recentScores.shift();
      }

      // Update adaptive threshold
      if (this.config.adaptiveThreshold && this.recentScores.length > 100) {
        this.updateAdaptiveThreshold();
      }

      const threshold = this.config.adaptiveThreshold
        ? this.adaptedThreshold
        : this.config.threshold;

      if (finalScore >= threshold) {
        scoredItems.push({
          item,
          score: finalScore,
          signals: signalScores,
          rank: 0, // Will be set after sorting
          explanation:
            boostReasons.length > 0
              ? `Score ${finalScore.toFixed(3)}: ${boostReasons.join(', ')}`
              : undefined,
        });

        // Track usage if ID extractor provided
        if (idExtractor) {
          this.trackUsage(idExtractor(item));
        }
      }
    }

    // Sort by score and assign ranks
    scoredItems.sort((a, b) => b.score - a.score);
    scoredItems.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Apply max results limit
    return scoredItems.slice(0, this.config.maxResults);
  }

  /**
   * Calculate relevance score for a single item
   */
  scoreItem(
    item: T,
    signalExtractor: (item: T) => Map<RelevanceSignal, number>,
    context?: RelevanceContext
  ): ScoredItem<T> {
    const signals = signalExtractor(item);
    const signalScores = this.calculateSignalScores(signals, context);
    const baseScore = this.aggregateScores(signalScores);

    let finalScore = baseScore;
    for (const boost of this.config.boostFactors) {
      if (boost.condition(item)) {
        finalScore *= boost.multiplier;
      }
    }
    for (const penalty of this.config.penaltyFactors) {
      if (penalty.condition(item)) {
        finalScore *= penalty.multiplier;
      }
    }

    return {
      item,
      score: finalScore,
      signals: signalScores,
      rank: 1,
    };
  }

  /**
   * Add a boost factor
   */
  addBoost(boost: BoostFactor): void {
    this.config.boostFactors.push(boost);
  }

  /**
   * Add a penalty factor
   */
  addPenalty(penalty: PenaltyFactor): void {
    this.config.penaltyFactors.push(penalty);
  }

  /**
   * Track item usage for frequency scoring
   */
  trackUsage(itemId: string, duration?: number, positive?: boolean): void {
    let entry = this.usageTracking.get(itemId);
    if (!entry) {
      entry = {
        itemId,
        accessCount: 0,
        lastAccess: 0,
        totalDuration: 0,
        positive: 0,
        negative: 0,
      };
      this.usageTracking.set(itemId, entry);
    }

    entry.accessCount++;
    entry.lastAccess = Date.now();

    if (duration !== undefined) {
      entry.totalDuration += duration;
    }

    if (positive !== undefined) {
      if (positive) {
        entry.positive++;
      } else {
        entry.negative++;
      }
    }
  }

  /**
   * Get frequency score for an item
   */
  getFrequencyScore(itemId: string): number {
    const entry = this.usageTracking.get(itemId);
    if (!entry) return 0;

    // Logarithmic scaling with saturation
    return Math.min(Math.log(entry.accessCount + 1) / Math.log(FREQUENCY_SATURATION + 1), 1);
  }

  /**
   * Get recency score for an item
   */
  getRecencyScore(itemId: string): number {
    const entry = this.usageTracking.get(itemId);
    if (!entry) return 0;

    const age = Date.now() - entry.lastAccess;
    return Math.exp(-age * RECENCY_DECAY_RATE);
  }

  /**
   * Get user preference score for an item
   */
  getUserPreferenceScore(itemId: string): number {
    const entry = this.usageTracking.get(itemId);
    if (!entry) return 0.5; // Neutral

    const total = entry.positive + entry.negative;
    if (total === 0) return 0.5;

    // Wilson score interval lower bound
    const phat = entry.positive / total;
    const z = 1.96; // 95% confidence
    const n = total;

    return (
      (phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) /
      (1 + (z * z) / n)
    );
  }

  /**
   * Get current threshold
   */
  getThreshold(): number {
    return this.config.adaptiveThreshold ? this.adaptedThreshold : this.config.threshold;
  }

  /**
   * Update threshold manually
   */
  setThreshold(threshold: number): void {
    this.config.threshold = threshold;
    this.adaptedThreshold = threshold;
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    trackedItems: number;
    totalAccesses: number;
    avgAccessCount: number;
    adaptedThreshold: number;
  } {
    let totalAccesses = 0;
    for (const entry of this.usageTracking.values()) {
      totalAccesses += entry.accessCount;
    }

    return {
      trackedItems: this.usageTracking.size,
      totalAccesses,
      avgAccessCount: this.usageTracking.size > 0 ? totalAccesses / this.usageTracking.size : 0,
      adaptedThreshold: this.adaptedThreshold,
    };
  }

  /**
   * Clear usage tracking
   */
  clearUsageTracking(): void {
    this.usageTracking.clear();
  }

  /**
   * Export usage data
   */
  exportUsageData(): UsageEntry[] {
    return Array.from(this.usageTracking.values());
  }

  /**
   * Import usage data
   */
  importUsageData(data: UsageEntry[]): void {
    for (const entry of data) {
      this.usageTracking.set(entry.itemId, entry);
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private calculateSignalScores(
    rawSignals: Map<RelevanceSignal, number>,
    context?: RelevanceContext
  ): SignalScore[] {
    const scores: SignalScore[] = [];

    for (const signalWeight of this.config.signals) {
      let value = rawSignals.get(signalWeight.signal) ?? 0;

      // Apply normalizer if provided
      if (signalWeight.normalizer) {
        value = signalWeight.normalizer(value);
      }

      // Clamp to [0, 1]
      value = Math.max(0, Math.min(1, value));

      const contribution = value * signalWeight.weight;

      scores.push({
        signal: signalWeight.signal,
        value,
        weight: signalWeight.weight,
        contribution,
      });
    }

    return scores;
  }

  private aggregateScores(signalScores: SignalScore[]): number {
    return signalScores.reduce((sum, score) => sum + score.contribution, 0);
  }

  private updateAdaptiveThreshold(): void {
    // Use median of recent scores as adaptive threshold
    const sorted = [...this.recentScores].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Blend with configured threshold
    this.adaptedThreshold = this.config.threshold * 0.3 + median * 0.7;

    // Ensure minimum threshold
    this.adaptedThreshold = Math.max(0.1, this.adaptedThreshold);
  }
}

// ============================================================================
// SPECIALIZED FILTERS
// ============================================================================

/**
 * Create a keyword-focused relevance filter
 */
export function createKeywordFilter<T>(): RelevanceFilter<T> {
  return new RelevanceFilter<T>({
    signals: [
      { signal: RelevanceSignal.KEYWORD_MATCH, weight: 0.6 },
      { signal: RelevanceSignal.SEMANTIC_SIMILARITY, weight: 0.2 },
      { signal: RelevanceSignal.RECENCY, weight: 0.1 },
      { signal: RelevanceSignal.FREQUENCY, weight: 0.1 },
    ],
    threshold: 0.2,
  });
}

/**
 * Create a recency-focused relevance filter
 */
export function createRecencyFilter<T>(): RelevanceFilter<T> {
  return new RelevanceFilter<T>({
    signals: [
      { signal: RelevanceSignal.RECENCY, weight: 0.5 },
      { signal: RelevanceSignal.FREQUENCY, weight: 0.3 },
      { signal: RelevanceSignal.KEYWORD_MATCH, weight: 0.2 },
    ],
    threshold: 0.1,
  });
}

/**
 * Create a user preference-focused relevance filter
 */
export function createPreferenceFilter<T>(): RelevanceFilter<T> {
  return new RelevanceFilter<T>({
    signals: [
      { signal: RelevanceSignal.USER_PREFERENCE, weight: 0.4 },
      { signal: RelevanceSignal.FREQUENCY, weight: 0.3 },
      { signal: RelevanceSignal.RECENCY, weight: 0.2 },
      { signal: RelevanceSignal.KEYWORD_MATCH, weight: 0.1 },
    ],
    adaptiveThreshold: true,
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate keyword match score between query and text
 */
export function calculateKeywordMatch(query: string[], text: string): number {
  if (query.length === 0) return 0;

  const lowerText = text.toLowerCase();
  let matches = 0;

  for (const keyword of query) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matches++;
    }
  }

  return matches / query.length;
}

/**
 * Calculate simple semantic similarity (token overlap)
 */
export function calculateSemanticSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(
    text1
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2)
  );
  const tokens2 = new Set(
    text2
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2)
  );

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) {
      intersection++;
    }
  }

  const union = tokens1.size + tokens2.size - intersection;
  return intersection / union; // Jaccard similarity
}

/**
 * Calculate proximity score between files
 */
export function calculateProximity(file1: string, file2: string): number {
  const parts1 = file1.split('/');
  const parts2 = file2.split('/');

  let commonParts = 0;
  const minLength = Math.min(parts1.length, parts2.length);

  for (let i = 0; i < minLength; i++) {
    if (parts1[i] === parts2[i]) {
      commonParts++;
    } else {
      break;
    }
  }

  const maxLength = Math.max(parts1.length, parts2.length);
  return commonParts / maxLength;
}

/**
 * Calculate authority score based on file characteristics
 */
export function calculateAuthority(
  filePath: string,
  metadata?: { size?: number; imports?: number; exports?: number }
): number {
  let score = 0.5; // Base score

  // Core files are more authoritative
  if (filePath.includes('index.') || filePath.includes('main.')) {
    score += 0.2;
  }

  // Files with many exports are more authoritative
  if (metadata?.exports && metadata.exports > 5) {
    score += 0.15;
  }

  // Files that are heavily imported are more authoritative
  if (metadata?.imports && metadata.imports > 10) {
    score += 0.15;
  }

  return Math.min(score, 1);
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

/**
 * Create a new relevance filter with default configuration
 */
export function createRelevanceFilter<T>(config?: Partial<RelevanceConfig>): RelevanceFilter<T> {
  return new RelevanceFilter<T>(config);
}

/**
 * Global filter instance
 */
let globalFilter: RelevanceFilter<any> | null = null;

/**
 * Get or create global filter
 */
export function getGlobalFilter<T>(): RelevanceFilter<T> {
  if (!globalFilter) {
    globalFilter = createRelevanceFilter<T>();
  }
  return globalFilter as RelevanceFilter<T>;
}

/**
 * Reset global filter
 */
export function resetGlobalFilter(): void {
  globalFilter = null;
}
