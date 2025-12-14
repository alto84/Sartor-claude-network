/**
 * Executive Module Index
 * Phase 5: Unified exports for Executive Claude system
 */

// Executive Claude (main orchestrator)
export {
  ExecutiveClaude,
  createExecutive,
  AgentRole,
  type AgentTask,
  type TaskResult,
} from './executive-claude';

// Self-Improving Loop
export {
  SelfImprovingLoop,
  createSelfImprovingLoop,
  type ImprovementCandidate,
  type ValidationResult,
} from './self-improving-loop';

// Learning Pipeline
export {
  LearningPipeline,
  createLearningPipeline,
  type Pattern,
  type LearningStats,
} from './learning-pipeline';

// Session Progress Tracker
export {
  SessionProgressTracker,
  createProgressTracker,
  type SessionProgress,
  type TaskRecord,
  type PatternLearned,
} from './session-progress';
