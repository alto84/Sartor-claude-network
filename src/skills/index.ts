/**
 * Skills Module - Entry Point
 *
 * Exports skill runtime, manifests, and types.
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

export { SkillRuntime } from './skill-runtime';

export {
  EVIDENCE_BASED_VALIDATION,
  EVIDENCE_BASED_ENGINEERING,
  SKILL_MANIFESTS,
  getSkillManifest,
  getAllSkillSummaries
} from './skill-manifest';

export * from './types';

// Evidence-Based Validation Skill
export {
  EvidenceBasedValidator,
  createValidator,
  quickValidate,
  validateClaim,
  formatValidationResult,
  type ValidationResult,
  type ValidationIssue,
  type ValidationInput,
  type MetricCheck,
} from './evidence-based-validation';

export { default as evidenceBasedValidator } from './evidence-based-validation';

// Evidence-Based Engineering Skill
export {
  EvidenceBasedEngineering,
  createEvidenceBasedEngineering,
  assessEngineering,
  type Risk,
  type EngineeringAssessment,
  type CompletionStatus,
  type TestAnalysis,
  type ErrorHandlingAnalysis,
  type DocumentationAnalysis
} from './evidence-based-engineering';

// Agent Communication System Skill
export {
  AgentCommunicationSystem,
  createAgentCommunicationSystem,
  createMessage,
  formatMessageResult,
  formatBroadcastResult,
  type AgentMessage,
  type MessageMetadata,
  type MessageResult,
  type BroadcastResult,
  type DeliveryStatus,
  type ErrorDetails,
  type DeliveryMetrics,
  type BroadcastMetrics,
  type ValidationResult as MessageValidationResult,
  type ValidationError as MessageValidationError,
  type MessageChannel,
  type QueryOptions,
  type CircuitBreakerState,
} from './agent-communication';

export { default as agentCommunication } from './agent-communication';

// Multi-Agent Orchestration Skill
export {
  createOrchestrator,
  createMockWorker,
  createTask,
  MultiAgentOrchestrator,
  DelegationPattern,
  type Orchestrator,
  type Task,
  type WorkerStatus,
  type WorkerMetrics,
  type Worker,
  type TaskResult,
  type DelegationResult,
  type WorkerAssignment,
  type SynthesizedOutput,
  type Conflict,
  type RecoveryAction,
  type OrchestratorConfig,
  type DelegationStrategy,
} from './multi-agent-orchestration';
