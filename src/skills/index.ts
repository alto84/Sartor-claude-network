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
