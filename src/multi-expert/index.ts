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
