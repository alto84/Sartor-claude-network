/**
 * Self-Improvement Feedback Mechanism
 *
 * Implements a learning system that extracts patterns from execution outcomes,
 * maintains lifelong memory of learned strategies, and continuously refines
 * skills based on accumulated evidence.
 *
 * Research Foundation:
 * - Reflexion: Verbal RL in episodic memory (HumanEval 80% → 91%)
 * - SOAR: Fine-tuning on own search traces
 * - ArcMemo: Lifelong memory (55% → 59%)
 *
 * Key Principles:
 * - Pattern Extraction: Learn from successful executions
 * - Evidence-Based Learning: Patterns backed by success metrics
 * - Memory Persistence: Learning survives sessions (Firebase + Firestore)
 * - Skill Refinement: Continuous improvement through feedback loops
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Individual step in a process execution
 */
export interface ProcessStep {
  stepId: string;
  action: string;
  reasoning: string;
  outcome: 'success' | 'failure' | 'partial';
  duration: number;
  timestamp: number;
  context: Record<string, unknown>;
  metrics?: {
    accuracy?: number;
    efficiency?: number;
    quality?: number;
  };
}

/**
 * Complete record of a task execution
 */
export interface ExecutionOutcome {
  taskId: string;
  skillUsed: string;
  success: boolean;
  refinementLoops: number;
  processTrace: ProcessStep[];
  feedback: string;
  patterns: LearnedPattern[];
  startedAt: number;
  completedAt: number;
  metadata: {
    userId?: string;
    sessionId?: string;
    context: string;
    complexity: 'low' | 'medium' | 'high';
  };
}

/**
 * Learned pattern extracted from successful executions
 *
 * Following Reflexion's approach: patterns are verbal descriptions
 * of what worked, when it worked, and why we believe it works.
 */
export interface LearnedPattern {
  id: string;
  context: string; // When this pattern applies
  strategy: string; // What to do in this context
  evidence: string[]; // Task IDs that validate this pattern
  successRate: number; // How often it works (0-1)
  confidenceScore: number; // Statistical confidence (0-1)
  applicableSkills: string[]; // Which skills can use this
  extractedAt: number;
  lastValidatedAt: number;
  usageCount: number;
  failureCount: number;
  refinements: PatternRefinement[];
  metadata: {
    complexity: 'low' | 'medium' | 'high';
    generalizability: number; // 0-1, how broadly applicable
    stability: number; // 0-1, how stable over time
  };
}

/**
 * Refinement made to a pattern based on new evidence
 */
export interface PatternRefinement {
  refinedAt: number;
  reason: string;
  previousStrategy: string;
  newStrategy: string;
  evidenceAdded: string[];
  impactOnSuccessRate: number;
}

/**
 * Feedback from task execution or user
 */
export interface Feedback {
  feedbackId: string;
  taskId: string;
  skillId: string;
  type: 'success' | 'failure' | 'partial' | 'user-correction';
  content: string;
  rating?: number; // 1-5 if provided
  timestamp: number;
  actionable: string[]; // Specific actions to take
  metadata?: Record<string, unknown>;
}

/**
 * Skill update proposal based on accumulated feedback
 */
export interface SkillUpdate {
  skillId: string;
  updateType: 'refinement' | 'extension' | 'deprecation';
  description: string;
  rationale: string;
  supportingEvidence: string[];
  proposedChanges: {
    area: 'strategy' | 'validation' | 'error-handling' | 'optimization';
    before: string;
    after: string;
    confidence: number;
  }[];
  estimatedImpact: {
    successRateImprovement: number;
    efficiencyGain: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  requiresValidation: boolean;
  createdAt: number;
}

/**
 * Recommendation based on learned patterns
 */
export interface PatternRecommendation {
  pattern: LearnedPattern;
  relevanceScore: number; // How relevant to current context
  reasoning: string;
  alternatives: LearnedPattern[];
  caveats: string[];
}

/**
 * Statistics for pattern performance
 */
export interface PatternStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  successRate: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidenceLevel: number; // e.g., 0.95 for 95%
  };
  trendDirection: 'improving' | 'stable' | 'declining';
  lastUpdated: number;
}

// ============================================================================
// Main Class: Self-Improvement Loop
// ============================================================================

export class SelfImprovementLoop {
  private patterns: Map<string, LearnedPattern> = new Map();
  private outcomes: Map<string, ExecutionOutcome> = new Map();
  private feedback: Map<string, Feedback[]> = new Map();
  private persistenceEnabled: boolean = true;

  constructor(options?: { disablePersistence?: boolean }) {
    this.persistenceEnabled = !options?.disablePersistence;
  }

  // ========================================================================
  // Public API
  // ========================================================================

  /**
   * Record outcome for learning
   *
   * Following Reflexion: Store complete execution trace
   * for episodic memory and pattern extraction.
   */
  recordOutcome(outcome: ExecutionOutcome): void {
    this.outcomes.set(outcome.taskId, outcome);

    // Immediately extract patterns from successful executions
    if (outcome.success && outcome.processTrace.length > 0) {
      const newPatterns = this.extractPatternsFromOutcome(outcome);
      newPatterns.forEach((pattern) => {
        this.addOrUpdatePattern(pattern);
      });
    }

    // Auto-persist to memory if enabled
    if (this.persistenceEnabled) {
      this.persistOutcomeToMemory(outcome).catch((error) => {
        console.error('Failed to persist outcome:', error);
      });
    }
  }

  /**
   * Extract patterns from successful executions
   *
   * Following SOAR: Learn from search traces and successful strategies.
   * Identifies common sequences, effective strategies, and success factors.
   */
  extractPatterns(outcomes: ExecutionOutcome[]): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];

    // Group outcomes by skill for pattern extraction
    const skillGroups = new Map<string, ExecutionOutcome[]>();
    outcomes.forEach((outcome) => {
      if (!skillGroups.has(outcome.skillUsed)) {
        skillGroups.set(outcome.skillUsed, []);
      }
      skillGroups.get(outcome.skillUsed)!.push(outcome);
    });

    // Extract patterns for each skill
    skillGroups.forEach((skillOutcomes, skillId) => {
      const successfulOutcomes = skillOutcomes.filter((o) => o.success);

      if (successfulOutcomes.length < 2) {
        return; // Need at least 2 successes to identify pattern
      }

      // Find common sequences in process traces
      const sequencePatterns = this.findCommonSequences(successfulOutcomes);
      patterns.push(...sequencePatterns);

      // Find context-strategy pairs
      const contextPatterns = this.findContextStrategyPatterns(successfulOutcomes);
      patterns.push(...contextPatterns);

      // Find optimization patterns
      const optimizationPatterns = this.findOptimizationPatterns(successfulOutcomes);
      patterns.push(...optimizationPatterns);
    });

    return patterns;
  }

  /**
   * Get recommendations based on learned patterns
   *
   * Filters patterns by context relevance and provides ranked
   * recommendations with alternatives and caveats.
   */
  getRecommendations(context: string): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];
    const relevantPatterns: Array<{ pattern: LearnedPattern; score: number }> = [];

    // Calculate relevance score for each pattern
    this.patterns.forEach((pattern) => {
      const score = this.calculateRelevanceScore(pattern, context);
      if (score > 0.3) {
        // Threshold for relevance
        relevantPatterns.push({ pattern, score });
      }
    });

    // Sort by relevance and success rate
    relevantPatterns.sort((a, b) => {
      const scoreA = a.score * a.pattern.successRate;
      const scoreB = b.score * b.pattern.successRate;
      return scoreB - scoreA;
    });

    // Build recommendations with alternatives
    relevantPatterns.forEach(({ pattern, score }, index) => {
      const alternatives = relevantPatterns
        .filter((p, i) => i !== index && p.pattern.context === pattern.context)
        .map((p) => p.pattern)
        .slice(0, 3); // Top 3 alternatives

      const caveats = this.generateCaveats(pattern);

      recommendations.push({
        pattern,
        relevanceScore: score,
        reasoning: this.generateReasoningForRecommendation(pattern, context, score),
        alternatives,
        caveats,
      });
    });

    return recommendations.slice(0, 10); // Return top 10 recommendations
  }

  /**
   * Refine skill based on accumulated feedback
   *
   * Following ArcMemo: Use lifelong memory to improve performance
   * by identifying areas for refinement.
   */
  refineSkill(skillId: string, feedbackList: Feedback[]): SkillUpdate {
    // Collect all feedback for this skill
    const allFeedback = feedbackList.concat(this.feedback.get(skillId) || []);

    // Store feedback
    this.feedback.set(skillId, allFeedback);

    // Analyze feedback patterns
    const analysis = this.analyzeFeedback(skillId, allFeedback);

    // Generate update proposal
    const update: SkillUpdate = {
      skillId,
      updateType: analysis.updateType,
      description: analysis.description,
      rationale: analysis.rationale,
      supportingEvidence: analysis.evidence,
      proposedChanges: analysis.changes,
      estimatedImpact: analysis.impact,
      requiresValidation: analysis.changes.some((c) => c.confidence < 0.7),
      createdAt: Date.now(),
    };

    // Auto-persist if enabled
    if (this.persistenceEnabled) {
      this.persistSkillUpdate(update).catch((error) => {
        console.error('Failed to persist skill update:', error);
      });
    }

    return update;
  }

  /**
   * Get pattern statistics for analysis
   */
  getPatternStatistics(patternId: string): PatternStatistics | null {
    const pattern = this.patterns.get(patternId);
    if (!pattern) {
      return null;
    }

    const totalExecutions = pattern.usageCount + pattern.failureCount;
    const successRate = totalExecutions > 0 ? pattern.usageCount / totalExecutions : 0;

    // Calculate confidence interval (Wilson score interval)
    const confidenceInterval = this.calculateWilsonInterval(
      pattern.usageCount,
      totalExecutions,
      0.95
    );

    // Determine trend by analyzing recent performance
    const trendDirection = this.determineTrend(pattern);

    return {
      totalExecutions,
      successfulExecutions: pattern.usageCount,
      failedExecutions: pattern.failureCount,
      averageDuration: 0, // Would need to track this separately
      successRate,
      confidenceInterval,
      trendDirection,
      lastUpdated: pattern.lastValidatedAt,
    };
  }

  // ========================================================================
  // Memory Persistence
  // ========================================================================

  /**
   * Persist patterns to memory system
   *
   * Following ArcMemo: Maintain lifelong memory across sessions
   * Stores in Firestore for warm-tier access (100-500ms)
   */
  async persistToMemory(patterns: LearnedPattern[]): Promise<void> {
    if (!this.persistenceEnabled) {
      return;
    }

    // In a real implementation, this would use Firebase/Firestore
    // For now, we'll create a simplified interface
    const memoryData = {
      patterns: patterns.map((p) => ({
        ...p,
        persistedAt: Date.now(),
      })),
      metadata: {
        totalPatterns: patterns.length,
        timestamp: Date.now(),
        version: '1.0.0',
      },
    };

    // Simulated persistence
    console.error('[Self-Improvement] Persisting', patterns.length, 'patterns to memory');

    // TODO: Implement actual Firebase persistence
    // await firestore.collection('learned_patterns').doc('latest').set(memoryData);
  }

  /**
   * Load patterns from memory system
   *
   * Retrieves persisted patterns from Firestore to enable
   * learning continuity across sessions.
   */
  async loadFromMemory(): Promise<LearnedPattern[]> {
    if (!this.persistenceEnabled) {
      return [];
    }

    // Simulated load
    console.error('[Self-Improvement] Loading patterns from memory');

    // TODO: Implement actual Firebase retrieval
    // const doc = await firestore.collection('learned_patterns').doc('latest').get();
    // if (!doc.exists) return [];
    // return doc.data().patterns || [];

    return [];
  }

  // ========================================================================
  // Pattern Extraction Algorithms
  // ========================================================================

  /**
   * Extract patterns from a single outcome
   */
  private extractPatternsFromOutcome(outcome: ExecutionOutcome): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];

    // Extract successful step sequences
    const successfulSteps = outcome.processTrace.filter((step) => step.outcome === 'success');

    if (successfulSteps.length >= 2) {
      // Create pattern from successful sequence
      const pattern: LearnedPattern = {
        id: this.generatePatternId(),
        context: outcome.metadata.context,
        strategy: this.summarizeSteps(successfulSteps),
        evidence: [outcome.taskId],
        successRate: 1.0,
        confidenceScore: 0.5, // Initial confidence, will improve with more evidence
        applicableSkills: [outcome.skillUsed],
        extractedAt: Date.now(),
        lastValidatedAt: Date.now(),
        usageCount: 1,
        failureCount: 0,
        refinements: [],
        metadata: {
          complexity: outcome.metadata.complexity,
          generalizability: 0.5, // Will be updated as pattern is tested
          stability: 0.5,
        },
      };

      patterns.push(pattern);
    }

    return patterns;
  }

  /**
   * Find common sequences across successful outcomes
   */
  private findCommonSequences(outcomes: ExecutionOutcome[]): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];

    // Group by context similarity
    const contextGroups = this.groupByContextSimilarity(outcomes);

    contextGroups.forEach((group) => {
      if (group.length < 2) return;

      // Find common action sequences
      const sequences = this.extractActionSequences(group);
      const commonSequences = this.findCommonSubsequences(sequences);

      commonSequences.forEach((sequence) => {
        const evidenceIds = group.map((o) => o.taskId);
        const successRate = group.filter((o) => o.success).length / group.length;

        const pattern: LearnedPattern = {
          id: this.generatePatternId(),
          context: group[0].metadata.context,
          strategy: `Execute sequence: ${sequence.join(' → ')}`,
          evidence: evidenceIds,
          successRate,
          confidenceScore: this.calculateConfidence(group.length, successRate),
          applicableSkills: [...new Set(group.map((o) => o.skillUsed))],
          extractedAt: Date.now(),
          lastValidatedAt: Date.now(),
          usageCount: group.length,
          failureCount: 0,
          refinements: [],
          metadata: {
            complexity: this.determineComplexity(sequence),
            generalizability: this.estimateGeneralizability(group),
            stability: 0.7,
          },
        };

        patterns.push(pattern);
      });
    });

    return patterns;
  }

  /**
   * Find context-strategy patterns
   */
  private findContextStrategyPatterns(outcomes: ExecutionOutcome[]): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];
    const contextMap = new Map<string, ExecutionOutcome[]>();

    // Group by context
    outcomes.forEach((outcome) => {
      const context = outcome.metadata.context;
      if (!contextMap.has(context)) {
        contextMap.set(context, []);
      }
      contextMap.get(context)!.push(outcome);
    });

    // Analyze each context group
    contextMap.forEach((group, context) => {
      if (group.length < 2) return;

      // Identify most successful strategy
      const strategyScores = new Map<string, { success: number; total: number }>();

      group.forEach((outcome) => {
        const strategy = this.extractStrategy(outcome);
        if (!strategyScores.has(strategy)) {
          strategyScores.set(strategy, { success: 0, total: 0 });
        }
        const scores = strategyScores.get(strategy)!;
        scores.total++;
        if (outcome.success) scores.success++;
      });

      // Create patterns for high-performing strategies
      strategyScores.forEach((scores, strategy) => {
        const successRate = scores.success / scores.total;
        if (successRate >= 0.7 && scores.total >= 2) {
          const pattern: LearnedPattern = {
            id: this.generatePatternId(),
            context,
            strategy,
            evidence: group.filter((o) => this.extractStrategy(o) === strategy).map((o) => o.taskId),
            successRate,
            confidenceScore: this.calculateConfidence(scores.total, successRate),
            applicableSkills: [...new Set(group.map((o) => o.skillUsed))],
            extractedAt: Date.now(),
            lastValidatedAt: Date.now(),
            usageCount: scores.success,
            failureCount: scores.total - scores.success,
            refinements: [],
            metadata: {
              complexity: 'medium',
              generalizability: 0.6,
              stability: 0.7,
            },
          };

          patterns.push(pattern);
        }
      });
    });

    return patterns;
  }

  /**
   * Find optimization patterns
   */
  private findOptimizationPatterns(outcomes: ExecutionOutcome[]): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];

    // Find outcomes with multiple refinement loops
    const refinedOutcomes = outcomes.filter((o) => o.refinementLoops > 0);

    if (refinedOutcomes.length < 2) return patterns;

    // Identify what led to fewer refinement loops
    const lowRefinement = refinedOutcomes.filter((o) => o.refinementLoops <= 1);
    const highRefinement = refinedOutcomes.filter((o) => o.refinementLoops > 1);

    if (lowRefinement.length >= 2) {
      // Extract common characteristics of low-refinement outcomes
      const commonFactors = this.extractCommonFactors(lowRefinement);

      if (commonFactors.length > 0) {
        const pattern: LearnedPattern = {
          id: this.generatePatternId(),
          context: 'optimization: minimize refinement loops',
          strategy: `Apply these factors: ${commonFactors.join(', ')}`,
          evidence: lowRefinement.map((o) => o.taskId),
          successRate: lowRefinement.length / refinedOutcomes.length,
          confidenceScore: this.calculateConfidence(lowRefinement.length, 1.0),
          applicableSkills: [...new Set(refinedOutcomes.map((o) => o.skillUsed))],
          extractedAt: Date.now(),
          lastValidatedAt: Date.now(),
          usageCount: lowRefinement.length,
          failureCount: 0,
          refinements: [],
          metadata: {
            complexity: 'high',
            generalizability: 0.5,
            stability: 0.6,
          },
        };

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private addOrUpdatePattern(pattern: LearnedPattern): void {
    // Check if similar pattern exists
    const existingPattern = this.findSimilarPattern(pattern);

    if (existingPattern) {
      // Update existing pattern with new evidence
      existingPattern.evidence.push(...pattern.evidence);
      existingPattern.usageCount += pattern.usageCount;
      existingPattern.lastValidatedAt = Date.now();

      // Recalculate success rate
      const totalUses = existingPattern.usageCount + existingPattern.failureCount;
      existingPattern.successRate = existingPattern.usageCount / totalUses;

      // Update confidence
      existingPattern.confidenceScore = this.calculateConfidence(
        totalUses,
        existingPattern.successRate
      );

      // Record refinement
      if (pattern.strategy !== existingPattern.strategy) {
        existingPattern.refinements.push({
          refinedAt: Date.now(),
          reason: 'New evidence suggests strategy refinement',
          previousStrategy: existingPattern.strategy,
          newStrategy: pattern.strategy,
          evidenceAdded: pattern.evidence,
          impactOnSuccessRate: pattern.successRate - existingPattern.successRate,
        });

        existingPattern.strategy = pattern.strategy;
      }
    } else {
      // Add new pattern
      this.patterns.set(pattern.id, pattern);
    }
  }

  private findSimilarPattern(pattern: LearnedPattern): LearnedPattern | null {
    for (const existing of this.patterns.values()) {
      if (
        existing.context === pattern.context &&
        this.calculateStringSimilarity(existing.strategy, pattern.strategy) > 0.8
      ) {
        return existing;
      }
    }
    return null;
  }

  private calculateRelevanceScore(pattern: LearnedPattern, context: string): number {
    // Simple string similarity for now
    const similarity = this.calculateStringSimilarity(pattern.context, context);

    // Weight by pattern quality
    const qualityWeight =
      pattern.successRate * pattern.confidenceScore * pattern.metadata.generalizability;

    return similarity * qualityWeight;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity on words
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private generateCaveats(pattern: LearnedPattern): string[] {
    const caveats: string[] = [];

    if (pattern.confidenceScore < 0.7) {
      caveats.push('Limited confidence - needs more validation');
    }

    if (pattern.evidence.length < 5) {
      caveats.push(`Based on only ${pattern.evidence.length} examples`);
    }

    if (pattern.successRate < 0.8) {
      caveats.push(`Success rate is ${(pattern.successRate * 100).toFixed(0)}% - not always reliable`);
    }

    if (pattern.metadata.generalizability < 0.5) {
      caveats.push('May not generalize well to different contexts');
    }

    const daysSinceValidation = (Date.now() - pattern.lastValidatedAt) / (1000 * 60 * 60 * 24);
    if (daysSinceValidation > 30) {
      caveats.push('Pattern not validated recently - may be outdated');
    }

    return caveats;
  }

  private generateReasoningForRecommendation(
    pattern: LearnedPattern,
    context: string,
    relevanceScore: number
  ): string {
    return `This pattern matches your context with ${(relevanceScore * 100).toFixed(0)}% relevance. ` +
      `It has been successful in ${pattern.evidence.length} similar situations ` +
      `with a ${(pattern.successRate * 100).toFixed(0)}% success rate.`;
  }

  private analyzeFeedback(skillId: string, feedbackList: Feedback[]): any {
    const successCount = feedbackList.filter((f) => f.type === 'success').length;
    const failureCount = feedbackList.filter((f) => f.type === 'failure').length;
    const totalCount = feedbackList.length;

    // Extract actionable items
    const actionables = feedbackList.flatMap((f) => f.actionable);
    const actionableFrequency = new Map<string, number>();
    actionables.forEach((action) => {
      actionableFrequency.set(action, (actionableFrequency.get(action) || 0) + 1);
    });

    // Find most common issues
    const commonIssues = Array.from(actionableFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((e) => e[0]);

    return {
      updateType: failureCount > successCount ? 'refinement' : 'extension',
      description: `Update based on ${totalCount} feedback items`,
      rationale: `Common issues: ${commonIssues.join('; ')}`,
      evidence: feedbackList.map((f) => f.feedbackId),
      changes: commonIssues.map((issue) => ({
        area: 'strategy' as const,
        before: 'Current approach',
        after: `Address: ${issue}`,
        confidence: (actionableFrequency.get(issue)! / totalCount) * 0.8,
      })),
      impact: {
        successRateImprovement: Math.min(0.2, failureCount / totalCount),
        efficiencyGain: 0.1,
        riskLevel: 'low' as const,
      },
    };
  }

  private calculateConfidence(sampleSize: number, successRate: number): number {
    // Wilson score interval for confidence
    const z = 1.96; // 95% confidence
    const phat = successRate;
    const n = sampleSize;

    if (n === 0) return 0;

    const denominator = 1 + (z * z) / n;
    const centre = phat + (z * z) / (2 * n);
    const margin = z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n);

    const lower = (centre - margin) / denominator;

    return Math.max(0, Math.min(1, lower)); // Return lower bound as confidence
  }

  private calculateWilsonInterval(
    successes: number,
    total: number,
    confidenceLevel: number
  ): { lower: number; upper: number; confidenceLevel: number } {
    if (total === 0) {
      return { lower: 0, upper: 0, confidenceLevel };
    }

    const z = 1.96; // For 95% confidence
    const phat = successes / total;
    const n = total;

    const denominator = 1 + (z * z) / n;
    const centre = phat + (z * z) / (2 * n);
    const margin = z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n);

    return {
      lower: Math.max(0, (centre - margin) / denominator),
      upper: Math.min(1, (centre + margin) / denominator),
      confidenceLevel,
    };
  }

  private determineTrend(pattern: LearnedPattern): 'improving' | 'stable' | 'declining' {
    // Analyze refinements to determine trend
    if (pattern.refinements.length === 0) {
      return 'stable';
    }

    const recentRefinements = pattern.refinements.slice(-3);
    const avgImpact =
      recentRefinements.reduce((sum, r) => sum + r.impactOnSuccessRate, 0) /
      recentRefinements.length;

    if (avgImpact > 0.05) return 'improving';
    if (avgImpact < -0.05) return 'declining';
    return 'stable';
  }

  // Utility methods
  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private summarizeSteps(steps: ProcessStep[]): string {
    return steps
      .map((step) => step.action)
      .join(' → ')
      .substring(0, 200);
  }

  private groupByContextSimilarity(outcomes: ExecutionOutcome[]): ExecutionOutcome[][] {
    const groups: ExecutionOutcome[][] = [];

    outcomes.forEach((outcome) => {
      let addedToGroup = false;

      for (const group of groups) {
        const similarity = this.calculateStringSimilarity(
          outcome.metadata.context,
          group[0].metadata.context
        );

        if (similarity > 0.6) {
          group.push(outcome);
          addedToGroup = true;
          break;
        }
      }

      if (!addedToGroup) {
        groups.push([outcome]);
      }
    });

    return groups;
  }

  private extractActionSequences(outcomes: ExecutionOutcome[]): string[][] {
    return outcomes.map((outcome) =>
      outcome.processTrace.filter((step) => step.outcome === 'success').map((step) => step.action)
    );
  }

  private findCommonSubsequences(sequences: string[][]): string[][] {
    if (sequences.length < 2) return [];

    const commonSequences: string[][] = [];
    const minLength = 2;

    // Find subsequences that appear in multiple sequences
    for (let i = 0; i < sequences.length; i++) {
      for (let j = 0; j < sequences[i].length - minLength + 1; j++) {
        for (let len = minLength; len <= sequences[i].length - j; len++) {
          const subseq = sequences[i].slice(j, j + len);
          const count = sequences.filter((seq) => this.containsSubsequence(seq, subseq)).length;

          if (count >= 2) {
            commonSequences.push(subseq);
          }
        }
      }
    }

    // Deduplicate
    return this.deduplicateSequences(commonSequences);
  }

  private containsSubsequence(sequence: string[], subsequence: string[]): boolean {
    for (let i = 0; i <= sequence.length - subsequence.length; i++) {
      if (subsequence.every((item, index) => sequence[i + index] === item)) {
        return true;
      }
    }
    return false;
  }

  private deduplicateSequences(sequences: string[][]): string[][] {
    const seen = new Set<string>();
    return sequences.filter((seq) => {
      const key = seq.join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private determineComplexity(sequence: string[]): 'low' | 'medium' | 'high' {
    if (sequence.length <= 2) return 'low';
    if (sequence.length <= 5) return 'medium';
    return 'high';
  }

  private estimateGeneralizability(outcomes: ExecutionOutcome[]): number {
    // More diverse contexts = higher generalizability
    const uniqueContexts = new Set(outcomes.map((o) => o.metadata.context)).size;
    return Math.min(1, uniqueContexts / outcomes.length);
  }

  private extractStrategy(outcome: ExecutionOutcome): string {
    // Extract the core strategy from successful steps
    const successfulSteps = outcome.processTrace.filter((step) => step.outcome === 'success');
    if (successfulSteps.length === 0) {
      return 'unknown';
    }

    // Use first successful step's action as primary strategy
    return successfulSteps[0].action;
  }

  private extractCommonFactors(outcomes: ExecutionOutcome[]): string[] {
    const factors: string[] = [];

    // Analyze process traces for common patterns
    const allActions = outcomes.flatMap((o) =>
      o.processTrace.filter((step) => step.outcome === 'success').map((step) => step.action)
    );

    const actionFrequency = new Map<string, number>();
    allActions.forEach((action) => {
      actionFrequency.set(action, (actionFrequency.get(action) || 0) + 1);
    });

    // Find actions that appear in most outcomes
    const threshold = outcomes.length * 0.7;
    actionFrequency.forEach((count, action) => {
      if (count >= threshold) {
        factors.push(action);
      }
    });

    return factors;
  }

  private async persistOutcomeToMemory(outcome: ExecutionOutcome): Promise<void> {
    console.error('[Self-Improvement] Persisting outcome:', outcome.taskId);
    // TODO: Implement Firebase persistence
  }

  private async persistSkillUpdate(update: SkillUpdate): Promise<void> {
    console.error('[Self-Improvement] Persisting skill update:', update.skillId);
    // TODO: Implement Firebase persistence
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new self-improvement loop
 */
export function createSelfImprovementLoop(options?: {
  disablePersistence?: boolean;
}): SelfImprovementLoop {
  return new SelfImprovementLoop(options);
}

/**
 * Create a feedback object
 */
export function createFeedback(
  taskId: string,
  skillId: string,
  type: Feedback['type'],
  content: string,
  actionable: string[] = []
): Feedback {
  return {
    feedbackId: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    taskId,
    skillId,
    type,
    content,
    actionable,
    timestamp: Date.now(),
  };
}

/**
 * Create an execution outcome
 */
export function createExecutionOutcome(
  taskId: string,
  skillUsed: string,
  success: boolean,
  processTrace: ProcessStep[],
  context: string
): ExecutionOutcome {
  return {
    taskId,
    skillUsed,
    success,
    refinementLoops: 0,
    processTrace,
    feedback: '',
    patterns: [],
    startedAt: Date.now() - 1000,
    completedAt: Date.now(),
    metadata: {
      context,
      complexity: 'medium',
    },
  };
}

// ============================================================================
// Export Default Instance
// ============================================================================

export default new SelfImprovementLoop();
