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
  MCP_SERVER_DEVELOPMENT,
  DISTRIBUTED_SYSTEMS_DEBUGGING,
  SAFETY_RESEARCH_WORKFLOW,
  SELF_IMPROVEMENT,
  REFINEMENT_LOOP,
  ROADMAP_SKILL,
  SKILL_MANIFESTS,
  getSkillManifest,
  getAllSkillSummaries,
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
  type DocumentationAnalysis,
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
  // Refinement Loop types (from multi-agent-orchestration)
  type Candidate,
  type Feedback as MAOFeedback,
  type RefinementLoop as MAORefinementLoop,
  type RefinementHistory,
  type RefinementResult as MAORefinementResult,
  // Self-Auditing types
  type SelfAudit,
  type AuditConfig,
  // Process Supervision types
  type ProcessStep as MAOProcessStep,
  type ProcessTrace,
  type SupervisionConfig,
  // Test-Time Adaptation types
  type TaskExample,
  type AdaptationStrategy,
  type TestTimeAdapter,
} from './multi-agent-orchestration';

// MCP Server Development Skill
export {
  MCPServerValidator,
  validateToolDefinition,
  validateServerConfig,
  generateToolHandler,
  testToolHandler,
  analyzeInputValidation,
  createErrorResponse,
  validateInput,
  type MCPToolDefinition,
  type MCPServerConfig,
  type MCPResourceDefinition,
  type MCPPromptDefinition,
  type ValidationReport,
  type ValidationError,
  type ValidationWarning,
  type TestCase,
  type TestReport,
  type TestResult,
  type SecurityReport,
  type SecurityVulnerability,
  type JSONSchema,
  type ToolHandler,
  type ToolResult,
} from './mcp-server-development';

export { default as mcpServerDevelopment } from './mcp-server-development';

// Distributed Systems Debugging Skill
export {
  DistributedSystemsDebugger,
  createDebugger,
  createDataSource,
  createTest,
  formatDebugReport,
  createFailureInjection,
  type SystemObservation,
  type Hypothesis,
  type DebugReport,
  type DataSource,
  type Test,
  type TestResult,
  type RankedHypotheses,
  type DebugSession,
  type IsolationStep,
  type FailureInjection,
  type CausalChain,
} from './distributed-systems-debugging';

export { default as distributedSystemsDebugger } from './distributed-systems-debugging';

// Safety Research Workflow Skill
export {
  SafetyResearchWorkflow,
  createResearchWorkflow,
  createSource,
  createEvidence,
  formatGateResults,
  formatResearchReport,
  TruthOverSpeedGate,
  SourceVerificationGate,
  DisagreementPreservationGate,
  LimitationDocumentationGate,
  STANDARD_QUALITY_GATES,
  type EvidenceLevel,
  type Source,
  type Evidence,
  type ResearchClaim,
  type ResearchPlan,
  type ResearchReport,
  type GateResult,
  type QualityGate,
  type GateResults,
  type Synthesis,
  type Conflict as ResearchConflict,
} from './safety-research-workflow';

export { default as safetyResearchWorkflow } from './safety-research-workflow';

// Refinement Loop - Core refinement mechanism
export {
  RefinementLoop,
  withRefinement,
  createRefinementLoop,
  createFeedback,
  createEvaluation,
  formatRefinementResult,
  type RefinementConfig,
  type RefinementState,
  type RefinementResult,
  type Feedback,
  type EvaluationResult,
  type ProcessStep,
} from './refinement-loop';

export { default as refinementLoop } from './refinement-loop';

// Self-Improvement Feedback Mechanism
export {
  SelfImprovementLoop,
  createSelfImprovementLoop,
  createFeedback as createImprovementFeedback,
  createExecutionOutcome,
  type ExecutionOutcome,
  type ProcessStep as ImprovementProcessStep,
  type LearnedPattern,
  type PatternRefinement,
  type Feedback as ImprovementFeedback,
  type SkillUpdate,
  type PatternRecommendation,
  type PatternStatistics,
} from './self-improvement';

export { default as selfImprovement } from './self-improvement';

// Roadmap Skill - Dynamic implementation plan access
export {
  RoadmapManager,
  getRoadmapManager,
  getCurrentPhase,
  getNextTasks,
  updateTaskStatus,
  getRoadmapSummary,
  getRoadmapSummaryObject,
  type RoadmapPhase,
  type RoadmapTask,
  type RoadmapState,
  type RoadmapSummary,
} from './roadmap-skill';

export { default as roadmapSkill } from './roadmap-skill';
