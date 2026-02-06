/**
 * Skill Registry System
 *
 * Clawdbot-style skill system for the Sartor Family Dashboard.
 * Manages registration, retrieval, and execution of skills that
 * provide Claude with tool definitions and execution capabilities.
 *
 * @module lib/skills
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Parameter definition for a skill tool
 */
export interface SkillParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  enum?: string[];
  items?: { type: string };
  properties?: Record<string, SkillParameter>;
}

/**
 * Claude tool definition format
 */
export interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, SkillParameter>;
    required: string[];
  };
}

/**
 * Result from skill execution
 */
export interface SkillExecutionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime?: number;
    source?: string;
    cached?: boolean;
  };
}

/**
 * A registered skill
 */
export interface Skill {
  /** Unique identifier for the skill */
  name: string;
  /** Human-readable description */
  description: string;
  /** Claude tool definition for this skill */
  toolDefinition: ClaudeToolDefinition;
  /** Execute the skill with given parameters */
  execute: (params: Record<string, unknown>) => Promise<SkillExecutionResult>;
}

/**
 * Configuration for the skill registry
 */
export interface SkillRegistryConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Timeout for skill execution in ms */
  executionTimeout?: number;
}

// ============================================================================
// SKILL REGISTRY
// ============================================================================

/**
 * Internal registry storage
 */
const skillRegistry: Map<string, Skill> = new Map();

/**
 * Registry configuration
 */
let registryConfig: Required<SkillRegistryConfig> = {
  debug: false,
  executionTimeout: 30000,
};

/**
 * Configure the skill registry
 */
export function configureRegistry(config: SkillRegistryConfig): void {
  registryConfig = {
    ...registryConfig,
    ...config,
  };
}

/**
 * Register a skill in the registry
 *
 * @param skill - The skill to register
 * @throws Error if a skill with the same name already exists
 */
export function registerSkill(skill: Skill): void {
  if (skillRegistry.has(skill.name)) {
    throw new Error(`Skill "${skill.name}" is already registered`);
  }

  // Validate skill structure
  if (!skill.name || !skill.description || !skill.toolDefinition || !skill.execute) {
    throw new Error(`Skill "${skill.name || 'unknown'}" is missing required fields`);
  }

  skillRegistry.set(skill.name, skill);

  if (registryConfig.debug) {
    console.log(`[SkillRegistry] Registered skill: ${skill.name}`);
  }
}

/**
 * Unregister a skill from the registry
 *
 * @param name - Name of the skill to unregister
 * @returns true if the skill was removed, false if it didn't exist
 */
export function unregisterSkill(name: string): boolean {
  const removed = skillRegistry.delete(name);

  if (registryConfig.debug && removed) {
    console.log(`[SkillRegistry] Unregistered skill: ${name}`);
  }

  return removed;
}

/**
 * Get a skill by name
 *
 * @param name - Name of the skill to retrieve
 * @returns The skill, or undefined if not found
 */
export function getSkill(name: string): Skill | undefined {
  return skillRegistry.get(name);
}

/**
 * Get all registered skills
 *
 * @returns Array of all registered skills
 */
export function getAllSkills(): Skill[] {
  return Array.from(skillRegistry.values());
}

/**
 * Get all tool definitions for Claude
 *
 * @returns Array of Claude tool definitions from all registered skills
 */
export function getAllTools(): ClaudeToolDefinition[] {
  return getAllSkills().map(skill => skill.toolDefinition);
}

/**
 * Get tool definitions for specific skills
 *
 * @param skillNames - Names of skills to get tools for
 * @returns Array of Claude tool definitions for the specified skills
 */
export function getToolsForSkills(skillNames: string[]): ClaudeToolDefinition[] {
  return skillNames
    .map(name => getSkill(name))
    .filter((skill): skill is Skill => skill !== undefined)
    .map(skill => skill.toolDefinition);
}

/**
 * Check if a skill is registered
 *
 * @param name - Name of the skill to check
 * @returns true if the skill exists
 */
export function hasSkill(name: string): boolean {
  return skillRegistry.has(name);
}

/**
 * Get the count of registered skills
 *
 * @returns Number of registered skills
 */
export function getSkillCount(): number {
  return skillRegistry.size;
}

// ============================================================================
// SKILL EXECUTION
// ============================================================================

/**
 * Execute a skill by name with given parameters
 *
 * @param name - Name of the skill to execute
 * @param params - Parameters to pass to the skill
 * @returns The skill execution result
 * @throws Error if the skill is not found
 */
export async function executeSkill(
  name: string,
  params: Record<string, unknown>
): Promise<SkillExecutionResult> {
  const skill = getSkill(name);

  if (!skill) {
    return {
      success: false,
      error: `Skill "${name}" not found`,
    };
  }

  const startTime = Date.now();

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Skill "${name}" timed out after ${registryConfig.executionTimeout}ms`)),
        registryConfig.executionTimeout
      );
    });

    // Race between execution and timeout
    const result = await Promise.race([
      skill.execute(params),
      timeoutPromise,
    ]);

    // Add execution time to metadata
    return {
      ...result,
      metadata: {
        ...result.metadata,
        executionTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (registryConfig.debug) {
      console.error(`[SkillRegistry] Error executing skill "${name}":`, error);
    }

    return {
      success: false,
      error: errorMessage,
      metadata: {
        executionTime: Date.now() - startTime,
      },
    };
  }
}

/**
 * Execute multiple skills in parallel
 *
 * @param executions - Array of [skillName, params] tuples
 * @returns Array of execution results in the same order
 */
export async function executeSkillsParallel(
  executions: Array<[string, Record<string, unknown>]>
): Promise<SkillExecutionResult[]> {
  return Promise.all(
    executions.map(([name, params]) => executeSkill(name, params))
  );
}

// ============================================================================
// SKILL LOADING
// ============================================================================

/**
 * Load and register all built-in skills
 * Call this during application initialization
 */
export async function loadBuiltinSkills(): Promise<void> {
  // Dynamic imports to avoid circular dependencies
  const { knowledgeSkill } = await import('./knowledge');
  const { calendarSkill } = await import('./calendar');

  registerSkill(knowledgeSkill);
  registerSkill(calendarSkill);

  if (registryConfig.debug) {
    console.log(`[SkillRegistry] Loaded ${getSkillCount()} built-in skills`);
  }
}

/**
 * Clear all registered skills
 * Useful for testing
 */
export function clearRegistry(): void {
  skillRegistry.clear();

  if (registryConfig.debug) {
    console.log('[SkillRegistry] Registry cleared');
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a skill helper function
 * Provides a consistent way to build skills
 */
export function createSkill(config: {
  name: string;
  description: string;
  parameters: Record<string, SkillParameter>;
  required?: string[];
  execute: (params: Record<string, unknown>) => Promise<SkillExecutionResult>;
}): Skill {
  return {
    name: config.name,
    description: config.description,
    toolDefinition: {
      name: config.name,
      description: config.description,
      input_schema: {
        type: 'object',
        properties: config.parameters,
        required: config.required || [],
      },
    },
    execute: config.execute,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  SkillParameter as ToolParameter,
};
