"use strict";
/**
 * Progressive Skill Loading Architecture - Type Definitions
 *
 * Complete TypeScript interfaces for the dynamic skills library
 * with three-level loading (summaries, instructions, resources).
 *
 * @version 1.0.0
 * @date 2025-12-06
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillCacheManager = exports.FileSystemSkillStorage = exports.SkillLoader = exports.SkillRegistry = exports.SkillExecutionContext = exports.TriggerType = exports.ResourceType = exports.SkillCategory = exports.SkillStatus = exports.SkillTier = void 0;
/**
 * Skill tier classification
 */
var SkillTier;
(function (SkillTier) {
    SkillTier["EXECUTIVE"] = "executive";
    SkillTier["SPECIALIST"] = "specialist";
    SkillTier["UTILITY"] = "utility"; // Support functions (e.g., file-reader)
})(SkillTier || (exports.SkillTier = SkillTier = {}));
/**
 * Skill status
 */
var SkillStatus;
(function (SkillStatus) {
    SkillStatus["STABLE"] = "stable";
    SkillStatus["BETA"] = "beta";
    SkillStatus["ALPHA"] = "alpha";
    SkillStatus["DEPRECATED"] = "deprecated";
    SkillStatus["EXPERIMENTAL"] = "experimental"; // Experimental feature
})(SkillStatus || (exports.SkillStatus = SkillStatus = {}));
/**
 * Skill category
 */
var SkillCategory;
(function (SkillCategory) {
    SkillCategory["CODE"] = "code";
    SkillCategory["DATA"] = "data";
    SkillCategory["RESEARCH"] = "research";
    SkillCategory["COMMUNICATION"] = "communication";
    SkillCategory["PROJECT_MANAGEMENT"] = "project-management";
    SkillCategory["CREATIVE"] = "creative";
    SkillCategory["ANALYSIS"] = "analysis";
    SkillCategory["AUTOMATION"] = "automation";
    SkillCategory["INTEGRATION"] = "integration";
    SkillCategory["SYSTEM"] = "system";
})(SkillCategory || (exports.SkillCategory = SkillCategory = {}));
/**
 * Resource types for Level 3
 */
var ResourceType;
(function (ResourceType) {
    ResourceType["DOCUMENTATION"] = "docs";
    ResourceType["CODE_TEMPLATE"] = "template";
    ResourceType["SCHEMA"] = "schema";
    ResourceType["REFERENCE_DATA"] = "data";
    ResourceType["EXAMPLES"] = "examples";
    ResourceType["INTEGRATION"] = "integration"; // Third-party integration specs
})(ResourceType || (exports.ResourceType = ResourceType = {}));
/**
 * Trigger types for skill activation
 */
var TriggerType;
(function (TriggerType) {
    TriggerType["KEYWORD"] = "keyword";
    TriggerType["PATTERN"] = "pattern";
    TriggerType["SEMANTIC"] = "semantic";
    TriggerType["EXPLICIT"] = "explicit";
    TriggerType["DEPENDENCY"] = "dependency";
    TriggerType["SCHEDULED"] = "scheduled"; // Time-based activation
})(TriggerType || (exports.TriggerType = TriggerType = {}));
/**
 * Skill execution context
 */
class SkillExecutionContext {
    constructor(config) {
        this.sessionId = config.sessionId;
        this.userId = config.userId;
        this.modelId = config.modelId;
        this.memory = config.memory;
        this.userContext = config.userContext;
        this.sessionTTL = config.sessionTTL || 3600000; // 1 hour default
        this.level1Summaries = new Map();
        this.level2Instructions = new Map();
        this.level3Resources = new Map();
        this.activeSkills = new Map();
        this.cache = new SkillCacheManager(config.memory.hot, {
            type: 'lru',
            maxSize: 100 * 1024 * 1024, // 100MB
            evictionPolicy: 'access_count'
        });
    }
    async loadSkill(skillId, level) {
        throw new Error('Not implemented');
    }
    async unloadSkill(skillId) {
        throw new Error('Not implemented');
    }
    getActiveSkills() {
        return Array.from(this.activeSkills.values());
    }
    getTokenUsage() {
        let level1 = 0;
        for (const summary of this.level1Summaries.values()) {
            level1 += summary.estimatedTokens;
        }
        let level2 = 0;
        for (const instructions of this.level2Instructions.values()) {
            level2 += 500; // Approximate
        }
        const level3 = 0; // Resources don't count in token budget
        return {
            level1,
            level2,
            level3,
            total: level1 + level2,
            limit: 200000,
            utilizationPercent: ((level1 + level2) / 200000) * 100
        };
    }
}
exports.SkillExecutionContext = SkillExecutionContext;
// ============================================================================
// SKILL REGISTRY
// ============================================================================
/**
 * Skill registry - manages available skills
 */
class SkillRegistry {
    constructor() {
        this.skills = new Map();
        this.index = {
            byId: new Map(),
            byTier: new Map(),
            byCategory: new Map(),
            byTrigger: new Map(),
            byTag: new Map(),
            embeddings: new Map()
        };
    }
    async loadFromDirectory(path) {
        throw new Error('Not implemented');
    }
    async registerSkill(manifest) {
        const versions = this.skills.get(manifest.id) || [];
        versions.push(manifest);
        this.skills.set(manifest.id, versions);
        // Update indexes
        this.updateIndexes(manifest);
    }
    async unregisterSkill(skillId) {
        this.skills.delete(skillId);
        this.removeFromIndexes(skillId);
    }
    async getSkill(skillId, version) {
        const versions = this.skills.get(skillId);
        if (!versions || versions.length === 0) {
            return null;
        }
        if (version) {
            return versions.find(v => v.version === version) || null;
        }
        // Return latest version
        return versions[versions.length - 1];
    }
    async searchSkills(query) {
        throw new Error('Not implemented');
    }
    async listSkills(filter) {
        const allSkills = [];
        for (const versions of this.skills.values()) {
            allSkills.push(versions[versions.length - 1]); // Latest version
        }
        return allSkills;
    }
    async getDependencyGraph(skillId) {
        throw new Error('Not implemented');
    }
    updateIndexes(manifest) {
        // Implementation
    }
    removeFromIndexes(skillId) {
        // Implementation
    }
}
exports.SkillRegistry = SkillRegistry;
/**
 * Skill loader - manages loading/unloading
 */
class SkillLoader {
    constructor(context, config) {
        this.context = context;
        this.config = config;
        this.storage = new FileSystemSkillStorage(config);
    }
    async loadLevel1() {
        return await this.storage.getAllSummaries();
    }
    async loadLevel2(skillId) {
        return await this.storage.getInstructions(skillId);
    }
    async loadLevel3(skillId, resourceIds) {
        const resources = [];
        for (const resourceId of resourceIds) {
            const resource = await this.storage.getResource(skillId, resourceId);
            resources.push(resource);
        }
        return resources;
    }
    async unload(skillId, level) {
        if (level === 2) {
            this.context.level2Instructions.delete(skillId);
        }
        else if (level === 3) {
            // Remove all resources for this skill
            for (const [key, _] of this.context.level3Resources) {
                if (key.startsWith(`${skillId}:`)) {
                    this.context.level3Resources.delete(key);
                }
            }
        }
    }
    async preload(skillIds) {
        for (const skillId of skillIds) {
            const instructions = await this.loadLevel2(skillId);
            this.context.level2Instructions.set(skillId, instructions);
        }
    }
    async getLoadedSkills() {
        const infos = [];
        for (const [skillId, state] of this.context.activeSkills) {
            infos.push({
                skillId,
                version: state.version,
                loadedLevels: [1, 2], // Simplified
                tokenUsage: 550,
                lastAccessedAt: state.lastAccessedAt,
                executionCount: state.executionCount
            });
        }
        return infos;
    }
    async getTokenUsage() {
        return this.context.getTokenUsage();
    }
}
exports.SkillLoader = SkillLoader;
/**
 * File system implementation of skill storage
 */
class FileSystemSkillStorage {
    constructor(config) {
        this.config = config;
    }
    async getSummary(skillId) {
        throw new Error('Not implemented');
    }
    async getAllSummaries() {
        throw new Error('Not implemented');
    }
    async getInstructions(skillId) {
        throw new Error('Not implemented');
    }
    async cacheInstructions(skillId, instructions) {
        throw new Error('Not implemented');
    }
    async getResource(skillId, resourceId) {
        throw new Error('Not implemented');
    }
    async *streamResource(skillId, resourceId) {
        throw new Error('Not implemented');
    }
}
exports.FileSystemSkillStorage = FileSystemSkillStorage;
/**
 * Multi-level caching for skills
 */
class SkillCacheManager {
    constructor(hotMemory, config) {
        this.hotMemory = hotMemory;
        this.config = config;
        this.l1Cache = new Map();
        this.l2Cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            hitRate: 0,
            size: 0,
            maxSize: config.maxSize,
            evictions: 0
        };
    }
    async get(key, level) {
        // Try L1 cache
        const l1Entry = this.l1Cache.get(key);
        if (l1Entry && !this.isExpired(l1Entry)) {
            this.stats.hits++;
            return l1Entry.value;
        }
        // Try L2 cache
        const l2Entry = this.l2Cache.get(key);
        if (l2Entry && !this.isExpired(l2Entry)) {
            this.stats.hits++;
            return l2Entry.value;
        }
        this.stats.misses++;
        return null;
    }
    async set(key, value, level, ttl) {
        const entry = {
            key,
            value,
            level,
            size: this.estimateSize(value),
            ttl: ttl || this.config.ttl,
            createdAt: Date.now(),
            lastAccessedAt: Date.now(),
            accessCount: 0
        };
        if (entry.size < 1024 * 1024) {
            this.l1Cache.set(key, entry);
        }
        else {
            this.l2Cache.set(key, entry);
        }
    }
    async invalidate(skillId) {
        for (const [key, _] of this.l1Cache) {
            if (key.startsWith(`${skillId}:`)) {
                this.l1Cache.delete(key);
            }
        }
        for (const [key, _] of this.l2Cache) {
            if (key.startsWith(`${skillId}:`)) {
                this.l2Cache.delete(key);
            }
        }
    }
    async clear() {
        this.l1Cache.clear();
        this.l2Cache.clear();
    }
    async stats() {
        return this.stats;
    }
    isExpired(entry) {
        if (!entry.ttl)
            return false;
        return Date.now() - entry.createdAt > entry.ttl;
    }
    estimateSize(value) {
        return JSON.stringify(value).length;
    }
}
exports.SkillCacheManager = SkillCacheManager;
//# sourceMappingURL=skill-types.js.map