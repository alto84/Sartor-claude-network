/**
 * Multi-Expert Orchestrator
 *
 * Top-level coordinator that integrates all multi-expert components
 * into a unified execution pipeline.
 *
 * Pipeline:
 * 1. Task intake and context retrieval from memory
 * 2. Expert pool creation (diverse archetypes)
 * 3. Parallel execution with timeout enforcement
 * 4. Result scoring and diversity evaluation
 * 5. Voting for consensus
 * 6. Feedback collection and refinement loop
 * 7. Memory storage of results and patterns
 *
 * @module multi-expert/orchestrator
 */

import { ExecutionEngine, ExpertTask, ExpertResult, MultiExpertResult, createMockExecutor, ExpertExecutor } from './execution-engine';
import { ExpertConfig, createExpertPool, ExpertArchetype, createExpertConfig } from './expert-config';
import { VotingSystem, quickVote, VotingResult } from './voting-system';
import { DiversityScorer, selectDiverseResults, calculatePoolDiversity } from './diversity-scorer';
import { SoftScorer, rankResults, SoftScore, PoolStats } from './soft-scorer';
import { FeedbackLoop, FeedbackCollection, createFeedbackLoop } from './feedback-loop';
import { MemoryIntegration, ExpertMemory, InMemoryMemoryClient, MemoryClient } from './memory-integration';

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  /** Number of experts to use */
  expertCount: number;

  /** Expert archetypes to include */
  archetypes: ExpertArchetype[];

  /** Whether to use memory for context */
  useMemory: boolean;

  /** Whether to run feedback loop */
  useFeedbackLoop: boolean;

  /** Target score for feedback loop */
  targetScore: number;

  /** Maximum feedback iterations */
  maxFeedbackIterations: number;

  /** Whether to use voting */
  useVoting: boolean;

  /** Voting method */
  votingMethod: 'majority' | 'ranked-choice' | 'borda' | 'weighted';

  /** Whether to select diverse results */
  useDiversitySelection: boolean;

  /** Number of diverse results to select */
  diverseResultCount: number;

  /** Maximum concurrent experts */
  maxConcurrent: number;

  /** Global timeout (ms) */
  timeout: number;
}

/**
 * Default orchestrator configuration
 */
export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  expertCount: 5,
  archetypes: ['performance', 'safety', 'simplicity', 'creative', 'balanced'],
  useMemory: true,
  useFeedbackLoop: true,
  targetScore: 80,
  maxFeedbackIterations: 3,
  useVoting: true,
  votingMethod: 'weighted',
  useDiversitySelection: true,
  diverseResultCount: 3,
  maxConcurrent: 10,
  timeout: 300000,
};

/**
 * Orchestrated execution result
 */
export interface OrchestratedResult {
  /** Original task */
  task: ExpertTask;

  /** All expert results */
  expertResults: MultiExpertResult;

  /** Scored results (ranked) */
  scoredResults: Array<{ result: ExpertResult; score: SoftScore }>;

  /** Diverse selection */
  diverseResults: ExpertResult[];

  /** Voting result */
  votingResult?: VotingResult;

  /** Feedback collected */
  feedback?: FeedbackCollection[];

  /** Best result (winner) */
  winner: ExpertResult;

  /** Winner's score */
  winnerScore: SoftScore;

  /** Pool statistics */
  poolStats: PoolStats;

  /** Pool diversity score */
  diversityScore: number;

  /** Memory IDs created */
  memoryIds: string[];

  /** Context memories used */
  contextMemories: ExpertMemory[];

  /** Total execution time */
  totalDurationMs: number;

  /** Execution metadata */
  metadata: {
    expertCount: number;
    archetypesUsed: ExpertArchetype[];
    votingMethod?: string;
    feedbackIterations?: number;
    targetReached: boolean;
  };
}

/**
 * Multi-Expert Orchestrator
 */
export class Orchestrator {
  private config: OrchestratorConfig;
  private executor: ExpertExecutor;
  private engine: ExecutionEngine;
  private memoryIntegration?: MemoryIntegration;
  private votingSystem: VotingSystem;
  private diversityScorer: DiversityScorer;
  private softScorer: SoftScorer;
  private feedbackLoop: FeedbackLoop;

  constructor(
    executor: ExpertExecutor,
    config: Partial<OrchestratorConfig> = {},
    memoryClient?: MemoryClient
  ) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };
    this.executor = executor;
    this.engine = new ExecutionEngine(executor, {
      maxConcurrentExperts: this.config.maxConcurrent,
      globalTimeout: this.config.timeout,
    });

    if (memoryClient) {
      this.memoryIntegration = new MemoryIntegration(memoryClient);
    } else if (this.config.useMemory) {
      this.memoryIntegration = new MemoryIntegration(new InMemoryMemoryClient());
    }

    this.votingSystem = new VotingSystem({ method: this.config.votingMethod });
    this.diversityScorer = new DiversityScorer();
    this.softScorer = new SoftScorer();
    this.feedbackLoop = createFeedbackLoop(this.config.targetScore);
  }

  /**
   * Execute task with full orchestration pipeline
   */
  async execute(task: ExpertTask): Promise<OrchestratedResult> {
    const startTime = Date.now();
    const memoryIds: string[] = [];
    let contextMemories: ExpertMemory[] = [];

    // 1. Get context from memory
    if (this.config.useMemory && this.memoryIntegration) {
      contextMemories = await this.memoryIntegration.getContextForTask(task);
    }

    // 2. Create expert pool
    const archetypes = this.config.archetypes.slice(0, this.config.expertCount);
    const experts = createExpertPool(task.id, archetypes);

    // 3. Execute with all experts in parallel
    const expertResults = await this.engine.executeWithExperts(task, experts);

    // 4. Score all results
    const scoredResults = rankResults(expertResults.results);

    // 5. Calculate diversity
    const diversityScore = calculatePoolDiversity(expertResults.results);
    const diverseResults = this.config.useDiversitySelection
      ? selectDiverseResults(expertResults.results, this.config.diverseResultCount)
      : expertResults.results;

    // 6. Run voting if enabled
    let votingResult: VotingResult | undefined;
    if (this.config.useVoting && expertResults.successCount >= 2) {
      votingResult = quickVote(expertResults.results, this.config.votingMethod);
    }

    // 7. Determine winner
    let winner = expertResults.bestResult!;
    let winnerScore = scoredResults.find((s) => s.result.expertId === winner.expertId)?.score
      || this.softScorer.score(winner);

    // 8. Run feedback loop if enabled
    let feedback: FeedbackCollection[] | undefined;
    if (this.config.useFeedbackLoop && winner) {
      feedback = [];
      const initialFeedback = await this.feedbackLoop.collectFeedback(winner);
      feedback.push(initialFeedback);

      // Check if we need refinement
      if (winnerScore.overall < this.config.targetScore) {
        // In a real implementation, this would re-execute with feedback
        // For now, we just collect feedback from all results
        for (const result of expertResults.results) {
          if (result.expertId !== winner.expertId) {
            const fb = await this.feedbackLoop.collectFeedback(result);
            feedback.push(fb);
          }
        }
      }
    }

    // 9. Store results in memory
    if (this.config.useMemory && this.memoryIntegration) {
      const ids = await this.memoryIntegration.storeMultiExpertResult(expertResults);
      memoryIds.push(...ids);

      // Update performance tracking
      for (const result of expertResults.results) {
        await this.memoryIntegration.updatePerformance(result);
      }
    }

    // 10. Calculate pool stats
    const poolStats = this.softScorer.calculatePoolStats(expertResults.results);

    return {
      task,
      expertResults,
      scoredResults,
      diverseResults,
      votingResult,
      feedback,
      winner,
      winnerScore,
      poolStats,
      diversityScore,
      memoryIds,
      contextMemories,
      totalDurationMs: Date.now() - startTime,
      metadata: {
        expertCount: experts.length,
        archetypesUsed: archetypes,
        votingMethod: this.config.useVoting ? this.config.votingMethod : undefined,
        feedbackIterations: feedback?.length,
        targetReached: winnerScore.overall >= this.config.targetScore,
      },
    };
  }

  /**
   * Execute with custom experts
   */
  async executeWithExperts(
    task: ExpertTask,
    experts: ExpertConfig[]
  ): Promise<OrchestratedResult> {
    const startTime = Date.now();
    const memoryIds: string[] = [];

    // Execute
    const expertResults = await this.engine.executeWithExperts(task, experts);

    // Score
    const scoredResults = rankResults(expertResults.results);

    // Diversity
    const diversityScore = calculatePoolDiversity(expertResults.results);
    const diverseResults = selectDiverseResults(
      expertResults.results,
      this.config.diverseResultCount
    );

    // Winner
    const winner = expertResults.bestResult!;
    const winnerScore = this.softScorer.score(winner);

    // Pool stats
    const poolStats = this.softScorer.calculatePoolStats(expertResults.results);

    return {
      task,
      expertResults,
      scoredResults,
      diverseResults,
      winner,
      winnerScore,
      poolStats,
      diversityScore,
      memoryIds,
      contextMemories: [],
      totalDurationMs: Date.now() - startTime,
      metadata: {
        expertCount: experts.length,
        archetypesUsed: experts.map((e) => e.archetype),
        targetReached: winnerScore.overall >= this.config.targetScore,
      },
    };
  }

  /**
   * Quick execution without full pipeline
   */
  async quickExecute(task: ExpertTask): Promise<ExpertResult> {
    const result = await this.execute(task);
    return result.winner;
  }

  /**
   * Get historical best experts for task type
   */
  async getBestExpertsForTaskType(taskType: string): Promise<ExpertConfig[]> {
    if (!this.memoryIntegration) {
      return createExpertPool('default', this.config.archetypes);
    }

    const bestPerformers = await this.memoryIntegration.getBestExperts(taskType, 3);

    if (bestPerformers.length === 0) {
      return createExpertPool('default', this.config.archetypes);
    }

    // Create expert configs based on best performers' archetypes
    // In a real implementation, this would use more sophisticated selection
    return createExpertPool('adapted', this.config.archetypes);
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...config };
    this.engine = new ExecutionEngine(this.executor, {
      maxConcurrentExperts: this.config.maxConcurrent,
      globalTimeout: this.config.timeout,
    });
    this.votingSystem = new VotingSystem({ method: this.config.votingMethod });
    this.feedbackLoop = createFeedbackLoop(this.config.targetScore);
  }

  /**
   * Get current configuration
   */
  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }
}

/**
 * Create orchestrator with mock executor (for testing)
 */
export function createTestOrchestrator(
  config?: Partial<OrchestratorConfig>
): Orchestrator {
  return new Orchestrator(createMockExecutor(), config);
}

/**
 * Quick task execution with default settings
 */
export async function orchestrateTask(
  task: ExpertTask,
  executor?: ExpertExecutor
): Promise<OrchestratedResult> {
  const orchestrator = new Orchestrator(executor || createMockExecutor());
  return orchestrator.execute(task);
}
