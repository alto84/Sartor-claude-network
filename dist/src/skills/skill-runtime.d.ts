/**
 * Skill Runtime - Loads and Executes Skills
 *
 * Implements the three-level loading protocol:
 * - Level 1: Summaries (always loaded)
 * - Level 2: Instructions (on-demand)
 * - Level 3: Resources (lazy-loaded)
 *
 * @version 1.0.0
 * @date 2025-12-06
 */
import { SkillId, SkillManifest, SkillSummary } from '../../skill-types';
import { SkillResult, SkillRuntimeStatus, SkillLoaderOptions, SkillExecutionOptions } from './types';
/**
 * Skill Runtime - Core class for loading and executing skills
 */
export declare class SkillRuntime {
    private registry;
    private activeSkills;
    private summaries;
    private instructions;
    private resources;
    constructor();
    /**
     * Initialize the skill runtime
     * Loads Level 1 summaries for all available skills
     */
    initialize(): Promise<void>;
    /**
     * Register a skill with the runtime
     */
    registerSkill(manifest: SkillManifest): Promise<void>;
    /**
     * Load a skill by ID
     * Loads Level 2 instructions if not already loaded
     */
    loadSkill(skillId: SkillId, options?: SkillLoaderOptions): Promise<SkillManifest>;
    /**
     * Execute a skill with input
     */
    executeSkill(skillId: SkillId, input: unknown, options?: SkillExecutionOptions): Promise<SkillResult>;
    /**
     * List all available skills
     */
    listSkills(): SkillManifest[];
    /**
     * Get skill status
     */
    getSkillStatus(skillId: SkillId): SkillRuntimeStatus | null;
    /**
     * Get all loaded summaries (Level 1)
     */
    getSummaries(): Map<SkillId, SkillSummary>;
    /**
     * Unload a skill (free Level 2 instructions from memory)
     */
    unloadSkill(skillId: SkillId): Promise<void>;
    /**
     * Load skill dependencies
     */
    private loadDependencies;
    /**
     * Validate skill input against manifest interface
     */
    private validateSkillInput;
    /**
     * Invoke skill logic (placeholder for actual implementation)
     */
    private invokeSkill;
    /**
     * Set skill status
     */
    private setSkillStatus;
    /**
     * Update skill metrics after execution
     */
    private updateSkillMetrics;
    /**
     * Get runtime statistics
     */
    getStatistics(): {
        totalSkills: number;
        loadedSkills: number;
        activeSkills: number;
        totalExecutions: number;
        totalErrors: number;
    };
}
//# sourceMappingURL=skill-runtime.d.ts.map