"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillRuntime = void 0;
/**
 * Skill Runtime - Core class for loading and executing skills
 */
class SkillRuntime {
    constructor() {
        this.registry = new Map();
        this.activeSkills = new Map();
        this.summaries = new Map();
        this.instructions = new Map();
        this.resources = new Map();
    }
    /**
     * Initialize the skill runtime
     * Loads Level 1 summaries for all available skills
     */
    async initialize() {
        // Load all skill manifests (from manifest registry)
        // This would typically load from the skill-manifest.ts file
        console.log('[SkillRuntime] Initializing skill runtime...');
        // For now, this is a placeholder - manifests will be registered externally
        // via registerSkill()
    }
    /**
     * Register a skill with the runtime
     */
    async registerSkill(manifest) {
        const summary = {
            id: manifest.id,
            version: manifest.version,
            summary: manifest.summary,
            triggers: manifest.triggers,
            tier: manifest.tier,
            dependencies: manifest.dependencies.map(d => d.skillId),
            estimatedTokens: manifest.metadata.estimatedTokens.level1
        };
        this.registry.set(manifest.id, {
            manifest,
            summary,
            loaded: false,
            instructionsLoaded: false,
            resourcesLoaded: []
        });
        this.summaries.set(manifest.id, summary);
        console.log(`[SkillRuntime] Registered skill: ${manifest.id} v${manifest.version}`);
    }
    /**
     * Load a skill by ID
     * Loads Level 2 instructions if not already loaded
     */
    async loadSkill(skillId, options = {}) {
        const entry = this.registry.get(skillId);
        if (!entry) {
            throw new Error(`Skill not found: ${skillId}`);
        }
        // Update status
        this.setSkillStatus(skillId, 'loading');
        try {
            // Load Level 2 instructions if not cached
            if (!entry.instructionsLoaded || !options.cacheInstructions) {
                this.instructions.set(skillId, entry.manifest.instructions);
                entry.instructionsLoaded = true;
            }
            // Load dependencies if requested
            if (options.preloadDependencies) {
                await this.loadDependencies(entry.manifest);
            }
            entry.loaded = true;
            this.setSkillStatus(skillId, 'ready');
            console.log(`[SkillRuntime] Loaded skill: ${skillId}`);
            return entry.manifest;
        }
        catch (error) {
            this.setSkillStatus(skillId, 'error');
            throw error;
        }
    }
    /**
     * Execute a skill with input
     */
    async executeSkill(skillId, input, options = {}) {
        const startTime = Date.now();
        try {
            // Ensure skill is loaded
            if (!this.registry.has(skillId)) {
                throw new Error(`Skill not found: ${skillId}`);
            }
            const entry = this.registry.get(skillId);
            if (!entry.loaded) {
                await this.loadSkill(skillId);
            }
            // Update status
            this.setSkillStatus(skillId, 'executing');
            // Validate input if requested
            if (options.validateInput) {
                this.validateSkillInput(entry.manifest, input);
            }
            // Execute the skill
            // In a real implementation, this would invoke the actual skill logic
            // For now, this is a placeholder that returns success
            const output = await this.invokeSkill(entry.manifest, input);
            // Update metrics
            const endTime = Date.now();
            const durationMs = endTime - startTime;
            this.updateSkillMetrics(skillId, durationMs, true);
            // Set back to ready
            this.setSkillStatus(skillId, 'ready');
            return {
                success: output.success,
                data: output.result,
                error: output.error,
                metrics: output.metrics,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            const endTime = Date.now();
            const durationMs = endTime - startTime;
            this.updateSkillMetrics(skillId, durationMs, false);
            this.setSkillStatus(skillId, 'error');
            return {
                success: false,
                error: {
                    code: 'EXECUTION_ERROR',
                    message: error instanceof Error ? error.message : String(error),
                    recoverable: false
                },
                metrics: {
                    startTime,
                    endTime,
                    durationMs,
                    tokensUsed: 0,
                    resourcesLoaded: 0,
                    dependenciesInvoked: 0
                },
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * List all available skills
     */
    listSkills() {
        return Array.from(this.registry.values()).map(entry => entry.manifest);
    }
    /**
     * Get skill status
     */
    getSkillStatus(skillId) {
        return this.activeSkills.get(skillId) || null;
    }
    /**
     * Get all loaded summaries (Level 1)
     */
    getSummaries() {
        return new Map(this.summaries);
    }
    /**
     * Unload a skill (free Level 2 instructions from memory)
     */
    async unloadSkill(skillId) {
        const entry = this.registry.get(skillId);
        if (!entry) {
            throw new Error(`Skill not found: ${skillId}`);
        }
        this.instructions.delete(skillId);
        entry.instructionsLoaded = false;
        entry.loaded = false;
        this.setSkillStatus(skillId, 'idle');
        console.log(`[SkillRuntime] Unloaded skill: ${skillId}`);
    }
    /**
     * Load skill dependencies
     */
    async loadDependencies(manifest) {
        const requiredDeps = manifest.dependencies.filter(d => d.required);
        for (const dep of requiredDeps) {
            if (!this.registry.has(dep.skillId)) {
                console.warn(`[SkillRuntime] Dependency not found: ${dep.skillId}`);
                if (dep.fallback && this.registry.has(dep.fallback)) {
                    console.log(`[SkillRuntime] Using fallback: ${dep.fallback}`);
                    await this.loadSkill(dep.fallback);
                }
            }
            else {
                await this.loadSkill(dep.skillId);
            }
        }
    }
    /**
     * Validate skill input against manifest interface
     */
    validateSkillInput(manifest, input) {
        if (!manifest.instructions.interface) {
            return; // No validation rules
        }
        const inputObj = input;
        const inputDefs = manifest.instructions.interface.inputs;
        for (const inputDef of inputDefs) {
            if (inputDef.required && !(inputDef.name in inputObj)) {
                throw new Error(`Missing required input: ${inputDef.name}`);
            }
            // Additional validation could be added here
        }
    }
    /**
     * Invoke skill logic (placeholder for actual implementation)
     */
    async invokeSkill(manifest, input) {
        // This is where the actual skill execution would happen
        // In a real implementation, this would:
        // 1. Load Level 3 resources if needed
        // 2. Execute the skill procedure
        // 3. Handle errors and retries
        // 4. Return results
        const startTime = Date.now();
        // Placeholder implementation
        console.log(`[SkillRuntime] Executing skill: ${manifest.id}`);
        console.log(`[SkillRuntime] Input:`, input);
        // Simulate execution
        await new Promise(resolve => setTimeout(resolve, 100));
        const endTime = Date.now();
        return {
            success: true,
            result: {
                message: `Skill ${manifest.id} executed successfully`,
                input
            },
            sideEffects: [],
            metrics: {
                startTime,
                endTime,
                durationMs: endTime - startTime,
                tokensUsed: 0,
                resourcesLoaded: 0,
                dependenciesInvoked: 0
            }
        };
    }
    /**
     * Set skill status
     */
    setSkillStatus(skillId, state) {
        const current = this.activeSkills.get(skillId) || {
            skillId,
            state: 'idle',
            executionCount: 0,
            errorCount: 0,
            averageExecutionMs: 0
        };
        current.state = state;
        if (state === 'ready' && !current.loadedAt) {
            current.loadedAt = Date.now();
        }
        this.activeSkills.set(skillId, current);
    }
    /**
     * Update skill metrics after execution
     */
    updateSkillMetrics(skillId, durationMs, success) {
        const status = this.activeSkills.get(skillId);
        if (!status)
            return;
        status.executionCount++;
        status.lastExecutedAt = Date.now();
        if (!success) {
            status.errorCount++;
        }
        // Update rolling average
        const prevAvg = status.averageExecutionMs || 0;
        const count = status.executionCount;
        status.averageExecutionMs = (prevAvg * (count - 1) + durationMs) / count;
        this.activeSkills.set(skillId, status);
    }
    /**
     * Get runtime statistics
     */
    getStatistics() {
        let loaded = 0;
        let active = 0;
        let totalExecutions = 0;
        let totalErrors = 0;
        for (const entry of this.registry.values()) {
            if (entry.loaded)
                loaded++;
        }
        for (const status of this.activeSkills.values()) {
            if (status.state !== 'idle')
                active++;
            totalExecutions += status.executionCount;
            totalErrors += status.errorCount;
        }
        return {
            totalSkills: this.registry.size,
            loadedSkills: loaded,
            activeSkills: active,
            totalExecutions,
            totalErrors
        };
    }
}
exports.SkillRuntime = SkillRuntime;
//# sourceMappingURL=skill-runtime.js.map