/**
 * Expert Configuration System
 *
 * Defines parameterized expert configurations for multi-expert parallel execution.
 * Inspired by Poetiq's ExpertConfig pattern with 18+ configurable parameters.
 *
 * @module multi-expert/expert-config
 */

/**
 * Expert archetype - predefined optimization strategies
 */
export type ExpertArchetype =
  | 'performance'    // Optimize for speed and efficiency
  | 'safety'         // Prioritize correctness and error handling
  | 'simplicity'     // Favor clear, maintainable solutions
  | 'robustness'     // Handle edge cases and failures gracefully
  | 'creative'       // Explore unconventional approaches
  | 'balanced';      // Default balanced approach

/**
 * Strategy for how the expert approaches problems
 */
export type ExpertStrategy =
  | 'analytical'     // Systematic, step-by-step approach
  | 'exploratory'    // Try multiple approaches
  | 'conservative'   // Stick to proven patterns
  | 'aggressive';    // Push boundaries, accept more risk

/**
 * Configuration for a single expert instance
 */
export interface ExpertConfig {
  /** Unique identifier for this expert */
  id: string;

  /** Human-readable name */
  name: string;

  /** Expert archetype (predefined optimization strategy) */
  archetype: ExpertArchetype;

  /** Problem-solving strategy */
  strategy: ExpertStrategy;

  // --- Iteration Control ---

  /** Maximum refinement iterations */
  maxIterations: number;

  /** Minimum iterations before accepting result */
  minIterations: number;

  /** Whether to use iteration count for tie-breaking */
  iterationTiebreak: boolean;

  /** Prefer lower iteration counts (faster solutions) */
  preferLowIterations: boolean;

  // --- Temperature / Randomness ---

  /** Temperature for generation (0.0 = deterministic, 1.0 = creative) */
  temperature: number;

  /** Random seed for reproducibility (optional) */
  seed?: number;

  // --- Timeout / Resource Limits ---

  /** Maximum time for single task (ms) */
  taskTimeout: number;

  /** Maximum total time across all retries (ms) */
  totalTimeout: number;

  /** Maximum timeout errors before giving up */
  maxTimeoutErrors: number;

  /** Retries per iteration */
  retriesPerIteration: number;

  // --- Quality Thresholds ---

  /** Minimum confidence to accept result (0-1) */
  confidenceThreshold: number;

  /** Score threshold to consider task complete (0-1) */
  satisfactionThreshold: number;

  // --- Voting / Selection ---

  /** Weight of this expert's vote (0-1) */
  votingWeight: number;

  /** Probability of being selected for a task (0-1) */
  selectionProbability: number;

  /** Whether to return best result even if below threshold */
  returnBestResult: boolean;

  // --- Constraints ---

  /** Specific constraints for this expert */
  constraints: string[];

  /** Tags for categorization and filtering */
  tags: string[];

  // --- Metadata ---

  /** Description of this expert's specialization */
  description: string;

  /** Version of this configuration */
  version: string;

  /** When this configuration was created */
  createdAt: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_EXPERT_CONFIG: Omit<ExpertConfig, 'id' | 'name'> = {
  archetype: 'balanced',
  strategy: 'analytical',
  maxIterations: 3,
  minIterations: 1,
  iterationTiebreak: true,
  preferLowIterations: true,
  temperature: 0.5,
  taskTimeout: 30000,      // 30 seconds
  totalTimeout: 120000,    // 2 minutes
  maxTimeoutErrors: 3,
  retriesPerIteration: 2,
  confidenceThreshold: 0.7,
  satisfactionThreshold: 0.85,
  votingWeight: 1.0,
  selectionProbability: 1.0,
  returnBestResult: true,
  constraints: [],
  tags: [],
  description: 'Default balanced expert configuration',
  version: '1.0.0',
  createdAt: new Date().toISOString(),
};

/**
 * Predefined expert archetypes with optimized configurations
 */
export const EXPERT_ARCHETYPES: Record<ExpertArchetype, Partial<ExpertConfig>> = {
  performance: {
    archetype: 'performance',
    strategy: 'aggressive',
    temperature: 0.3,
    maxIterations: 2,
    preferLowIterations: true,
    taskTimeout: 15000,
    constraints: ['minimize-latency', 'optimize-throughput', 'cache-aggressive'],
    description: 'Optimizes for speed and efficiency, accepts higher risk for better performance',
  },

  safety: {
    archetype: 'safety',
    strategy: 'conservative',
    temperature: 0.2,
    maxIterations: 5,
    minIterations: 2,
    confidenceThreshold: 0.85,
    satisfactionThreshold: 0.9,
    constraints: ['validate-all-inputs', 'handle-all-errors', 'no-unsafe-operations'],
    description: 'Prioritizes correctness and error handling over speed',
  },

  simplicity: {
    archetype: 'simplicity',
    strategy: 'conservative',
    temperature: 0.4,
    maxIterations: 3,
    constraints: ['prefer-readable-code', 'avoid-complexity', 'minimal-dependencies'],
    description: 'Favors clear, maintainable solutions over clever optimizations',
  },

  robustness: {
    archetype: 'robustness',
    strategy: 'analytical',
    temperature: 0.4,
    maxIterations: 4,
    minIterations: 2,
    retriesPerIteration: 3,
    constraints: ['handle-edge-cases', 'graceful-degradation', 'comprehensive-logging'],
    description: 'Handles edge cases and failures gracefully',
  },

  creative: {
    archetype: 'creative',
    strategy: 'exploratory',
    temperature: 0.8,
    maxIterations: 4,
    preferLowIterations: false,
    constraints: ['explore-alternatives', 'unconventional-approaches'],
    description: 'Explores unconventional approaches, higher creativity',
  },

  balanced: {
    archetype: 'balanced',
    strategy: 'analytical',
    temperature: 0.5,
    maxIterations: 3,
    constraints: [],
    description: 'Default balanced approach',
  },
};

/**
 * Create a new expert configuration
 */
export function createExpertConfig(
  id: string,
  name: string,
  archetype: ExpertArchetype = 'balanced',
  overrides: Partial<ExpertConfig> = {}
): ExpertConfig {
  const archetypeDefaults = EXPERT_ARCHETYPES[archetype];

  return {
    ...DEFAULT_EXPERT_CONFIG,
    ...archetypeDefaults,
    ...overrides,
    id,
    name,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create multiple expert configurations with seed variation
 */
export function createExpertPool(
  baseId: string,
  archetypes: ExpertArchetype[],
  baseSeed?: number
): ExpertConfig[] {
  return archetypes.map((archetype, index) => {
    const seed = baseSeed !== undefined ? baseSeed + index : undefined;
    return createExpertConfig(
      `${baseId}-${archetype}-${index}`,
      `${archetype.charAt(0).toUpperCase() + archetype.slice(1)} Expert ${index + 1}`,
      archetype,
      { seed }
    );
  });
}

/**
 * Validate an expert configuration
 */
export function validateExpertConfig(config: ExpertConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.id) errors.push('id is required');
  if (!config.name) errors.push('name is required');
  if (config.temperature < 0 || config.temperature > 1) errors.push('temperature must be 0-1');
  if (config.maxIterations < 1) errors.push('maxIterations must be >= 1');
  if (config.minIterations > config.maxIterations) errors.push('minIterations cannot exceed maxIterations');
  if (config.confidenceThreshold < 0 || config.confidenceThreshold > 1) errors.push('confidenceThreshold must be 0-1');
  if (config.satisfactionThreshold < 0 || config.satisfactionThreshold > 1) errors.push('satisfactionThreshold must be 0-1');
  if (config.votingWeight < 0 || config.votingWeight > 1) errors.push('votingWeight must be 0-1');
  if (config.selectionProbability < 0 || config.selectionProbability > 1) errors.push('selectionProbability must be 0-1');
  if (config.taskTimeout < 1000) errors.push('taskTimeout must be >= 1000ms');
  if (config.totalTimeout < config.taskTimeout) errors.push('totalTimeout must be >= taskTimeout');

  return { valid: errors.length === 0, errors };
}

/**
 * Serialize expert config for storage
 */
export function serializeExpertConfig(config: ExpertConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Deserialize expert config from storage
 */
export function deserializeExpertConfig(json: string): ExpertConfig {
  const parsed = JSON.parse(json);
  const validation = validateExpertConfig(parsed);

  if (!validation.valid) {
    throw new Error(`Invalid expert config: ${validation.errors.join(', ')}`);
  }

  return parsed;
}

// Export types
export type { ExpertConfig as ExpertConfigType };
