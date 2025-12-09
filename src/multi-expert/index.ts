/**
 * Multi-Expert Parallel Execution System
 *
 * Phase 6 implementation inspired by Poetiq ARC-AGI Solver patterns.
 *
 * @module multi-expert
 */

// Expert Configuration
export {
  ExpertConfig,
  ExpertArchetype,
  ExpertStrategy,
  DEFAULT_EXPERT_CONFIG,
  EXPERT_ARCHETYPES,
  createExpertConfig,
  createExpertPool,
  validateExpertConfig,
  serializeExpertConfig,
  deserializeExpertConfig,
} from './expert-config';

// Execution Engine
export {
  ExecutionEngine,
  ExpertTask,
  ExpertResult,
  MultiExpertResult,
  ExecutionEngineConfig,
  ExecutionSummary,
  ExecutionTrace,
  IterationTrace,
  ExpertExecutor,
  DEFAULT_ENGINE_CONFIG,
  createMockExecutor,
} from './execution-engine';

// Voting System
export {
  VotingSystem,
  ExpertVote,
  VotingResult,
  VotingRound,
  VotingMethod,
  VotingConfig,
  DEFAULT_VOTING_CONFIG,
  quickVote,
} from './voting-system';

// Diversity Scorer
export {
  DiversityScorer,
  DiversityScore,
  DiversityBreakdown,
  DiversityScorerConfig,
  DEFAULT_DIVERSITY_CONFIG,
  selectDiverseResults,
  calculatePoolDiversity,
} from './diversity-scorer';

// Soft Scorer
export {
  SoftScorer,
  SoftScore,
  ScoreBreakdown,
  CriterionScore,
  BonusScore,
  PenaltyScore,
  ScoringCriterion,
  SoftScorerConfig,
  DEFAULT_SOFT_SCORER_CONFIG,
  DEFAULT_CRITERIA,
  PoolStats,
  quickScore,
  rankResults,
} from './soft-scorer';

// Sandbox Executor
export {
  SandboxExecutor,
  SandboxResult,
  SandboxConfig,
  DEFAULT_SANDBOX_CONFIG,
  createJsonSandbox,
  sandboxExecute,
  sandboxCommand,
} from './sandbox-executor';

// Feedback Loop
export {
  FeedbackLoop,
  FeedbackItem,
  FeedbackSource,
  FeedbackType,
  FeedbackSeverity,
  FeedbackCollection,
  IterationResult,
  FeedbackLoopConfig,
  DEFAULT_FEEDBACK_LOOP_CONFIG,
  FeedbackProvider,
  createFeedbackLoop,
  collectFeedback,
} from './feedback-loop';
