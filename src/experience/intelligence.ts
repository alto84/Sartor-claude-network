/**
 * Adaptive Intelligence Module
 *
 * Provides learning and adaptation capabilities for the subagent system,
 * including pattern recognition, prediction, and strategy optimization.
 *
 * Features:
 * - Pattern learning from task history
 * - Success prediction
 * - Strategy optimization
 * - Contextual adaptation
 * - Performance tracking
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Learning event types
 */
export enum LearningEvent {
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  PATTERN_DETECTED = 'pattern_detected',
  STRATEGY_UPDATED = 'strategy_updated',
  PREDICTION_MADE = 'prediction_made',
  FEEDBACK_RECEIVED = 'feedback_received',
}

/**
 * Task outcome
 */
export interface TaskOutcome {
  taskId: string;
  taskType: string;
  success: boolean;
  duration: number;
  attempts: number;
  context: TaskContext;
  result?: any;
  error?: string;
}

/**
 * Task context
 */
export interface TaskContext {
  agentRole?: string;
  fileTypes?: string[];
  complexity?: number;
  dependencies?: string[];
  timeOfDay?: number;
  previousTasks?: string[];
  keywords?: string[];
}

/**
 * Learned pattern
 */
export interface LearnedPattern {
  id: string;
  type: PatternType;
  trigger: PatternTrigger;
  outcome: PatternOutcome;
  confidence: number;
  occurrences: number;
  lastSeen: number;
  metadata: Record<string, any>;
}

/**
 * Pattern types
 */
export enum PatternType {
  TASK_SEQUENCE = 'task_sequence',
  FILE_ASSOCIATION = 'file_association',
  ERROR_CORRELATION = 'error_correlation',
  SUCCESS_FACTOR = 'success_factor',
  TIME_PATTERN = 'time_pattern',
  COMPLEXITY_PATTERN = 'complexity_pattern',
}

/**
 * Pattern trigger conditions
 */
export interface PatternTrigger {
  taskTypes?: string[];
  contexts?: Partial<TaskContext>;
  conditions?: Array<(task: TaskOutcome) => boolean>;
}

/**
 * Pattern outcome
 */
export interface PatternOutcome {
  predictedSuccess: number;
  recommendedStrategy?: string;
  warnings?: string[];
  suggestions?: string[];
}

/**
 * Strategy
 */
export interface Strategy {
  id: string;
  name: string;
  description: string;
  applicableContexts: Partial<TaskContext>[];
  actions: StrategyAction[];
  successRate: number;
  usageCount: number;
}

/**
 * Strategy action
 */
export interface StrategyAction {
  type: string;
  params: Record<string, any>;
  order: number;
}

/**
 * Prediction result
 */
export interface Prediction {
  taskId: string;
  predictedSuccess: number;
  predictedDuration: number;
  confidence: number;
  recommendedStrategy?: string;
  warnings: string[];
  factors: PredictionFactor[];
}

/**
 * Factor contributing to prediction
 */
export interface PredictionFactor {
  name: string;
  value: number;
  weight: number;
  contribution: number;
}

/**
 * Intelligence configuration
 */
export interface IntelligenceConfig {
  minPatternOccurrences?: number;
  minConfidence?: number;
  learningRate?: number;
  decayRate?: number;
  maxPatterns?: number;
  maxStrategies?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MIN_PATTERN_OCCURRENCES = 3;
const DEFAULT_MIN_CONFIDENCE = 0.5;
const DEFAULT_LEARNING_RATE = 0.1;
const DEFAULT_DECAY_RATE = 0.01;
const DEFAULT_MAX_PATTERNS = 1000;
const DEFAULT_MAX_STRATEGIES = 100;

// ============================================================================
// ADAPTIVE INTELLIGENCE
// ============================================================================

/**
 * Adaptive intelligence system for learning and prediction
 */
export class AdaptiveIntelligence {
  private config: Required<IntelligenceConfig>;
  private patterns: Map<string, LearnedPattern> = new Map();
  private strategies: Map<string, Strategy> = new Map();
  private taskHistory: TaskOutcome[] = [];
  private eventListeners: Map<LearningEvent, Array<(data: any) => void>> = new Map();

  constructor(config: IntelligenceConfig = {}) {
    this.config = {
      minPatternOccurrences: config.minPatternOccurrences ?? DEFAULT_MIN_PATTERN_OCCURRENCES,
      minConfidence: config.minConfidence ?? DEFAULT_MIN_CONFIDENCE,
      learningRate: config.learningRate ?? DEFAULT_LEARNING_RATE,
      decayRate: config.decayRate ?? DEFAULT_DECAY_RATE,
      maxPatterns: config.maxPatterns ?? DEFAULT_MAX_PATTERNS,
      maxStrategies: config.maxStrategies ?? DEFAULT_MAX_STRATEGIES,
    };
  }

  /**
   * Record a task outcome for learning
   */
  recordOutcome(outcome: TaskOutcome): void {
    this.taskHistory.push(outcome);

    // Keep history bounded
    if (this.taskHistory.length > 10000) {
      this.taskHistory = this.taskHistory.slice(-5000);
    }

    // Learn from outcome
    this.learnFromOutcome(outcome);

    // Emit event
    this.emit(outcome.success ? LearningEvent.TASK_COMPLETED : LearningEvent.TASK_FAILED, outcome);
  }

  /**
   * Predict outcome for a task
   */
  predict(taskType: string, context: TaskContext): Prediction {
    const factors: PredictionFactor[] = [];
    let totalWeight = 0;
    let weightedSuccess = 0;
    let weightedDuration = 0;

    // Factor 1: Historical success rate for this task type
    const typeHistory = this.taskHistory.filter((t) => t.taskType === taskType);
    if (typeHistory.length > 0) {
      const successRate = typeHistory.filter((t) => t.success).length / typeHistory.length;
      const avgDuration = typeHistory.reduce((sum, t) => sum + t.duration, 0) / typeHistory.length;
      const weight = Math.min(typeHistory.length / 10, 1) * 0.3;

      factors.push({
        name: 'task_type_history',
        value: successRate,
        weight,
        contribution: successRate * weight,
      });

      weightedSuccess += successRate * weight;
      weightedDuration += avgDuration * weight;
      totalWeight += weight;
    }

    // Factor 2: Similar context success
    const similarTasks = this.findSimilarTasks(context);
    if (similarTasks.length > 0) {
      const successRate = similarTasks.filter((t) => t.success).length / similarTasks.length;
      const avgDuration =
        similarTasks.reduce((sum, t) => sum + t.duration, 0) / similarTasks.length;
      const weight = Math.min(similarTasks.length / 5, 1) * 0.25;

      factors.push({
        name: 'similar_context',
        value: successRate,
        weight,
        contribution: successRate * weight,
      });

      weightedSuccess += successRate * weight;
      weightedDuration += avgDuration * weight;
      totalWeight += weight;
    }

    // Factor 3: Pattern matching
    const matchingPatterns = this.findMatchingPatterns({ taskType, context } as any);
    for (const pattern of matchingPatterns.slice(0, 3)) {
      const weight = pattern.confidence * 0.15;

      factors.push({
        name: `pattern:${pattern.type}`,
        value: pattern.outcome.predictedSuccess,
        weight,
        contribution: pattern.outcome.predictedSuccess * weight,
      });

      weightedSuccess += pattern.outcome.predictedSuccess * weight;
      totalWeight += weight;
    }

    // Factor 4: Complexity adjustment
    if (context.complexity !== undefined) {
      const complexityFactor = 1 - context.complexity * 0.3;
      const weight = 0.1;

      factors.push({
        name: 'complexity',
        value: complexityFactor,
        weight,
        contribution: complexityFactor * weight,
      });

      weightedSuccess += complexityFactor * weight;
      totalWeight += weight;
    }

    // Calculate final prediction
    const predictedSuccess = totalWeight > 0 ? weightedSuccess / totalWeight : 0.5;
    const predictedDuration = totalWeight > 0 ? weightedDuration / totalWeight : 60000;
    const confidence = Math.min(totalWeight, 1);

    // Find best strategy
    const recommendedStrategy = this.findBestStrategy(taskType, context);

    // Generate warnings
    const warnings = this.generateWarnings(taskType, context, factors);

    const prediction: Prediction = {
      taskId: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      predictedSuccess,
      predictedDuration,
      confidence,
      recommendedStrategy: recommendedStrategy?.id,
      warnings,
      factors,
    };

    this.emit(LearningEvent.PREDICTION_MADE, prediction);

    return prediction;
  }

  /**
   * Provide feedback on a prediction
   */
  provideFeedback(taskId: string, actualOutcome: TaskOutcome): void {
    // Find the task in history
    const historicalOutcome = this.taskHistory.find((t) => t.taskId === taskId);
    if (!historicalOutcome) {
      this.recordOutcome(actualOutcome);
      return;
    }

    // Update patterns based on feedback
    this.adjustPatterns(actualOutcome);

    // Update strategy success rates
    this.adjustStrategies(actualOutcome);

    this.emit(LearningEvent.FEEDBACK_RECEIVED, { taskId, actualOutcome });
  }

  /**
   * Register a new strategy
   */
  registerStrategy(strategy: Omit<Strategy, 'successRate' | 'usageCount'>): Strategy {
    const fullStrategy: Strategy = {
      ...strategy,
      successRate: 0.5, // Start neutral
      usageCount: 0,
    };

    this.strategies.set(strategy.id, fullStrategy);
    this.enforceStrategyLimit();

    return fullStrategy;
  }

  /**
   * Get recommended strategies for a context
   */
  getRecommendedStrategies(taskType: string, context: TaskContext, limit: number = 3): Strategy[] {
    const applicable = this.findApplicableStrategies(context);

    // Sort by success rate
    applicable.sort((a, b) => b.successRate - a.successRate);

    return applicable.slice(0, limit);
  }

  /**
   * Get all learned patterns
   */
  getPatterns(): LearnedPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get all strategies
   */
  getStrategies(): Strategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get intelligence statistics
   */
  getStats(): {
    totalTasks: number;
    successRate: number;
    patternCount: number;
    strategyCount: number;
    avgConfidence: number;
  } {
    const successfulTasks = this.taskHistory.filter((t) => t.success).length;
    const patternConfidences = Array.from(this.patterns.values()).map((p) => p.confidence);

    return {
      totalTasks: this.taskHistory.length,
      successRate: this.taskHistory.length > 0 ? successfulTasks / this.taskHistory.length : 0,
      patternCount: this.patterns.size,
      strategyCount: this.strategies.size,
      avgConfidence:
        patternConfidences.length > 0
          ? patternConfidences.reduce((a, b) => a + b, 0) / patternConfidences.length
          : 0,
    };
  }

  /**
   * Subscribe to learning events
   */
  on(event: LearningEvent, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Export intelligence state
   */
  exportState(): {
    patterns: LearnedPattern[];
    strategies: Strategy[];
    taskHistory: TaskOutcome[];
  } {
    return {
      patterns: Array.from(this.patterns.values()),
      strategies: Array.from(this.strategies.values()),
      taskHistory: this.taskHistory,
    };
  }

  /**
   * Import intelligence state
   */
  importState(state: {
    patterns?: LearnedPattern[];
    strategies?: Strategy[];
    taskHistory?: TaskOutcome[];
  }): void {
    if (state.patterns) {
      for (const pattern of state.patterns) {
        this.patterns.set(pattern.id, pattern);
      }
    }
    if (state.strategies) {
      for (const strategy of state.strategies) {
        this.strategies.set(strategy.id, strategy);
      }
    }
    if (state.taskHistory) {
      this.taskHistory = state.taskHistory;
    }
  }

  /**
   * Clear all learned data
   */
  clear(): void {
    this.patterns.clear();
    this.strategies.clear();
    this.taskHistory = [];
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private learnFromOutcome(outcome: TaskOutcome): void {
    // Learn task type patterns
    this.learnTaskTypePattern(outcome);

    // Learn context patterns
    this.learnContextPattern(outcome);

    // Learn sequence patterns
    this.learnSequencePattern(outcome);

    // Learn error patterns
    if (!outcome.success && outcome.error) {
      this.learnErrorPattern(outcome);
    }

    // Decay old patterns
    this.decayPatterns();

    // Enforce pattern limit
    this.enforcePatternLimit();
  }

  private learnTaskTypePattern(outcome: TaskOutcome): void {
    const patternId = `type_${outcome.taskType}`;
    let pattern = this.patterns.get(patternId);

    if (!pattern) {
      pattern = {
        id: patternId,
        type: PatternType.SUCCESS_FACTOR,
        trigger: { taskTypes: [outcome.taskType] },
        outcome: { predictedSuccess: 0.5 },
        confidence: 0,
        occurrences: 0,
        lastSeen: Date.now(),
        metadata: { successCount: 0, failureCount: 0 },
      };
      this.patterns.set(patternId, pattern);
    }

    // Update pattern
    pattern.occurrences++;
    pattern.lastSeen = Date.now();

    if (outcome.success) {
      pattern.metadata.successCount++;
    } else {
      pattern.metadata.failureCount++;
    }

    // Update predicted success
    const total = pattern.metadata.successCount + pattern.metadata.failureCount;
    pattern.outcome.predictedSuccess = pattern.metadata.successCount / total;

    // Update confidence
    pattern.confidence = Math.min(pattern.occurrences / 10, 1);

    if (pattern.occurrences >= this.config.minPatternOccurrences) {
      this.emit(LearningEvent.PATTERN_DETECTED, pattern);
    }
  }

  private learnContextPattern(outcome: TaskOutcome): void {
    // Learn from complexity
    if (outcome.context.complexity !== undefined) {
      const complexityBucket = Math.floor(outcome.context.complexity * 10);
      const patternId = `complexity_${complexityBucket}`;
      let pattern = this.patterns.get(patternId);

      if (!pattern) {
        pattern = {
          id: patternId,
          type: PatternType.COMPLEXITY_PATTERN,
          trigger: { contexts: { complexity: complexityBucket / 10 } },
          outcome: { predictedSuccess: 0.5 },
          confidence: 0,
          occurrences: 0,
          lastSeen: Date.now(),
          metadata: { successCount: 0, failureCount: 0 },
        };
        this.patterns.set(patternId, pattern);
      }

      pattern.occurrences++;
      pattern.lastSeen = Date.now();
      if (outcome.success) {
        pattern.metadata.successCount++;
      } else {
        pattern.metadata.failureCount++;
      }

      const total = pattern.metadata.successCount + pattern.metadata.failureCount;
      pattern.outcome.predictedSuccess = pattern.metadata.successCount / total;
      pattern.confidence = Math.min(pattern.occurrences / 5, 1);
    }
  }

  private learnSequencePattern(outcome: TaskOutcome): void {
    if (outcome.context.previousTasks && outcome.context.previousTasks.length > 0) {
      const lastTask = outcome.context.previousTasks[outcome.context.previousTasks.length - 1];
      const patternId = `seq_${lastTask}_${outcome.taskType}`;
      let pattern = this.patterns.get(patternId);

      if (!pattern) {
        pattern = {
          id: patternId,
          type: PatternType.TASK_SEQUENCE,
          trigger: { taskTypes: [lastTask, outcome.taskType] },
          outcome: { predictedSuccess: 0.5 },
          confidence: 0,
          occurrences: 0,
          lastSeen: Date.now(),
          metadata: { successCount: 0, failureCount: 0 },
        };
        this.patterns.set(patternId, pattern);
      }

      pattern.occurrences++;
      pattern.lastSeen = Date.now();
      if (outcome.success) {
        pattern.metadata.successCount++;
      } else {
        pattern.metadata.failureCount++;
      }

      const total = pattern.metadata.successCount + pattern.metadata.failureCount;
      pattern.outcome.predictedSuccess = pattern.metadata.successCount / total;
      pattern.confidence = Math.min(pattern.occurrences / 5, 1);
    }
  }

  private learnErrorPattern(outcome: TaskOutcome): void {
    // Extract error type (simplified)
    const errorType = outcome.error?.split(':')[0] || 'unknown';
    const patternId = `error_${outcome.taskType}_${errorType}`;
    let pattern = this.patterns.get(patternId);

    if (!pattern) {
      pattern = {
        id: patternId,
        type: PatternType.ERROR_CORRELATION,
        trigger: { taskTypes: [outcome.taskType] },
        outcome: {
          predictedSuccess: 0,
          warnings: [`Common error: ${errorType}`],
        },
        confidence: 0,
        occurrences: 0,
        lastSeen: Date.now(),
        metadata: { errorType, contexts: [] },
      };
      this.patterns.set(patternId, pattern);
    }

    pattern.occurrences++;
    pattern.lastSeen = Date.now();
    pattern.confidence = Math.min(pattern.occurrences / 3, 1);
    pattern.metadata.contexts.push(outcome.context);

    // Keep only recent contexts
    if (pattern.metadata.contexts.length > 10) {
      pattern.metadata.contexts = pattern.metadata.contexts.slice(-10);
    }
  }

  private decayPatterns(): void {
    const now = Date.now();
    const decayThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [id, pattern] of this.patterns) {
      const age = now - pattern.lastSeen;
      if (age > decayThreshold) {
        const decayFactor = 1 - this.config.decayRate * (age / decayThreshold);
        pattern.confidence *= decayFactor;

        if (pattern.confidence < 0.1) {
          this.patterns.delete(id);
        }
      }
    }
  }

  private enforcePatternLimit(): void {
    if (this.patterns.size <= this.config.maxPatterns) return;

    // Remove lowest confidence patterns
    const sortedPatterns = Array.from(this.patterns.entries()).sort(
      (a, b) => a[1].confidence - b[1].confidence
    );

    const toRemove = sortedPatterns.slice(0, this.patterns.size - this.config.maxPatterns);
    for (const [id] of toRemove) {
      this.patterns.delete(id);
    }
  }

  private enforceStrategyLimit(): void {
    if (this.strategies.size <= this.config.maxStrategies) return;

    // Remove lowest success rate strategies
    const sortedStrategies = Array.from(this.strategies.entries()).sort(
      (a, b) => a[1].successRate - b[1].successRate
    );

    const toRemove = sortedStrategies.slice(0, this.strategies.size - this.config.maxStrategies);
    for (const [id] of toRemove) {
      this.strategies.delete(id);
    }
  }

  private findSimilarTasks(context: TaskContext): TaskOutcome[] {
    return this.taskHistory.filter((task) => {
      let similarity = 0;

      if (context.agentRole && task.context.agentRole === context.agentRole) {
        similarity += 0.3;
      }

      if (context.fileTypes && task.context.fileTypes) {
        const overlap = context.fileTypes.filter((t) => task.context.fileTypes!.includes(t)).length;
        similarity += (overlap / context.fileTypes.length) * 0.3;
      }

      if (context.complexity !== undefined && task.context.complexity !== undefined) {
        const diff = Math.abs(context.complexity - task.context.complexity);
        similarity += (1 - diff) * 0.2;
      }

      if (context.keywords && task.context.keywords) {
        const overlap = context.keywords.filter((k) => task.context.keywords!.includes(k)).length;
        similarity += (overlap / context.keywords.length) * 0.2;
      }

      return similarity >= 0.5;
    });
  }

  private findMatchingPatterns(outcome: Partial<TaskOutcome>): LearnedPattern[] {
    return Array.from(this.patterns.values())
      .filter((pattern) => {
        if (pattern.confidence < this.config.minConfidence) return false;
        if (pattern.occurrences < this.config.minPatternOccurrences) return false;

        if (pattern.trigger.taskTypes && outcome.taskType) {
          return pattern.trigger.taskTypes.includes(outcome.taskType);
        }

        return true;
      })
      .sort((a, b) => b.confidence - a.confidence);
  }

  private findApplicableStrategies(context: TaskContext): Strategy[] {
    return Array.from(this.strategies.values()).filter((strategy) => {
      return strategy.applicableContexts.some((applicable) => {
        if (applicable.agentRole && applicable.agentRole !== context.agentRole) return false;
        if (applicable.complexity !== undefined && context.complexity !== undefined) {
          if (Math.abs(applicable.complexity - context.complexity) > 0.3) return false;
        }
        return true;
      });
    });
  }

  private findBestStrategy(taskType: string, context: TaskContext): Strategy | undefined {
    const applicable = this.findApplicableStrategies(context);
    if (applicable.length === 0) return undefined;

    // Return strategy with highest success rate
    return applicable.sort((a, b) => b.successRate - a.successRate)[0];
  }

  private adjustPatterns(outcome: TaskOutcome): void {
    // Adjust patterns that matched this task
    const matchingPatterns = this.findMatchingPatterns(outcome);

    for (const pattern of matchingPatterns) {
      // Update based on actual outcome
      const learning = this.config.learningRate;
      const target = outcome.success ? 1 : 0;

      pattern.outcome.predictedSuccess =
        pattern.outcome.predictedSuccess * (1 - learning) + target * learning;

      // Adjust confidence based on prediction accuracy
      const wasAccurate =
        pattern.outcome.predictedSuccess >= 0.5 === outcome.success ||
        pattern.outcome.predictedSuccess < 0.5 !== outcome.success;

      if (wasAccurate) {
        pattern.confidence = Math.min(pattern.confidence + 0.05, 1);
      } else {
        pattern.confidence = Math.max(pattern.confidence - 0.1, 0);
      }
    }
  }

  private adjustStrategies(outcome: TaskOutcome): void {
    // Find which strategy was used (if any)
    const context = outcome.context;

    for (const strategy of this.strategies.values()) {
      const isApplicable = strategy.applicableContexts.some((applicable) => {
        if (applicable.agentRole && applicable.agentRole === context.agentRole) return true;
        return false;
      });

      if (isApplicable) {
        strategy.usageCount++;

        // Update success rate with exponential moving average
        const alpha = 0.1;
        const success = outcome.success ? 1 : 0;
        strategy.successRate = strategy.successRate * (1 - alpha) + success * alpha;

        this.emit(LearningEvent.STRATEGY_UPDATED, strategy);
      }
    }
  }

  private generateWarnings(
    taskType: string,
    context: TaskContext,
    factors: PredictionFactor[]
  ): string[] {
    const warnings: string[] = [];

    // Warn about low confidence
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    if (totalWeight < 0.5) {
      warnings.push('Low confidence prediction due to limited historical data');
    }

    // Warn about high complexity
    if (context.complexity !== undefined && context.complexity > 0.7) {
      warnings.push('High complexity task - consider breaking into subtasks');
    }

    // Warn about error patterns
    const errorPatterns = Array.from(this.patterns.values()).filter(
      (p) =>
        p.type === PatternType.ERROR_CORRELATION &&
        p.trigger.taskTypes?.includes(taskType) &&
        p.confidence > 0.5
    );

    for (const errorPattern of errorPatterns) {
      if (errorPattern.outcome.warnings) {
        warnings.push(...errorPattern.outcome.warnings);
      }
    }

    return warnings;
  }

  private emit(event: LearningEvent, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(data);
        } catch {
          // Ignore listener errors
        }
      }
    }
  }
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

/**
 * Create a new adaptive intelligence instance
 */
export function createIntelligence(config?: IntelligenceConfig): AdaptiveIntelligence {
  return new AdaptiveIntelligence(config);
}

/**
 * Global intelligence instance
 */
let globalIntelligence: AdaptiveIntelligence | null = null;

/**
 * Get or create global intelligence
 */
export function getGlobalIntelligence(): AdaptiveIntelligence {
  if (!globalIntelligence) {
    globalIntelligence = createIntelligence();
  }
  return globalIntelligence;
}

/**
 * Reset global intelligence
 */
export function resetGlobalIntelligence(): void {
  globalIntelligence = null;
}

/**
 * Quick prediction helper
 */
export function predictTaskSuccess(taskType: string, context: TaskContext): Prediction {
  return getGlobalIntelligence().predict(taskType, context);
}

/**
 * Quick outcome recording helper
 */
export function recordTaskOutcome(outcome: TaskOutcome): void {
  getGlobalIntelligence().recordOutcome(outcome);
}
