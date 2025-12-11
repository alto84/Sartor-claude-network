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
  // Phase 6 enhancements
  ScoreDimension,
  DimensionScore,
  EnhancedSoftScore,
  ScoringConfig,
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

// Sandbox (High-level sandbox management)
export {
  Sandbox,
  SandboxManager,
  ManagedSandboxConfig,
  ExecutionTrace as SandboxExecutionTrace,
  TraceStep,
  ResourceUsage,
  ResourceLimits,
  ExecutionOptions,
  SandboxStats,
  DEFAULT_LIMITS,
  DEFAULT_MANAGED_SANDBOX_CONFIG,
  createSandbox,
  createSandboxManager,
  sandboxedExecute,
  parallelSandboxedExecute,
} from './sandbox';

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

// Memory Integration
export {
  MemoryIntegration,
  ExpertMemory,
  ExpertMemoryType,
  MemoryQuery,
  MemoryClient,
  MemoryIntegrationConfig,
  DEFAULT_MEMORY_INTEGRATION_CONFIG,
  ExpertPerformance,
  InMemoryMemoryClient,
  createTestMemoryIntegration,
} from './memory-integration';

// Orchestrator
export {
  Orchestrator,
  OrchestratorConfig,
  DEFAULT_ORCHESTRATOR_CONFIG,
  OrchestratedResult,
  createTestOrchestrator,
  orchestrateTask,
} from './orchestrator';

// Rate Limiter
export {
  RateLimiter,
  RateLimitConfig,
  Request,
  RateLimitStats,
  CostTracker,
  TokenBucketRateLimiter,
  SimpleCostTracker,
  DEFAULT_RATE_LIMIT_CONFIG,
  createRateLimiter,
  createCostTracker,
} from './rate-limiter';

// Claude Executor (Real LLM Integration)
export {
  createClaudeExecutor,
  createRateLimitedClaudeExecutor,
  ClaudeExecutorConfig,
  CostTracker as ClaudeCostTracker,
} from './claude-executor';
