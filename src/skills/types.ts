/**
 * Core Type Definitions for Skill System Runtime
 *
 * Simplified types for the skill runtime/loader.
 * Complete type definitions are in /skill-types.ts
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

// Re-export core types from skill-types.ts
export type {
  SkillId,
  SkillVersion,
  Timestamp,
  SkillTier,
  SkillStatus,
  SkillCategory,
  ResourceType,
  TriggerType,
  SkillManifest,
  SkillSummary,
  SkillInstructions,
  TriggerDefinition,
  SkillDependency,
  SkillInterface,
  ExecutionProcedure,
  ProcedureStep,
  Example,
  ErrorStrategy,
  ResourceManifest,
  SkillMetadata,
  SkillPerformance,
  SkillMemoryConfig,
  SkillInput,
  SkillOutput,
  SkillError,
  ExecutionMetrics,
  ActiveSkillState,
  LoadedSkill,
  LoadedResource,
  SkillExecutionContext
} from '../skill-types';

/**
 * Skill execution result
 */
export interface SkillResult {
  success: boolean;
  data?: any;
  error?: SkillError;
  metrics: ExecutionMetrics;
  timestamp: string;
}

/**
 * Skill runtime status
 */
export interface SkillRuntimeStatus {
  skillId: string;
  state: 'idle' | 'loading' | 'ready' | 'executing' | 'error';
  loadedAt?: number;
  lastExecutedAt?: number;
  executionCount: number;
  errorCount: number;
  averageExecutionMs: number;
}

/**
 * Skill loader options
 */
export interface SkillLoaderOptions {
  preloadDependencies?: boolean;
  cacheInstructions?: boolean;
  maxConcurrentLoads?: number;
  timeout?: number;
}

/**
 * Skill execution options
 */
export interface SkillExecutionOptions {
  timeout?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
  validateInput?: boolean;
  trackMetrics?: boolean;
}

/**
 * Skill registry entry
 */
export interface SkillRegistryEntry {
  manifest: any; // SkillManifest
  summary: any;  // SkillSummary
  loaded: boolean;
  instructionsLoaded: boolean;
  resourcesLoaded: string[];
}
