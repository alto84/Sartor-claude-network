/**
 * Progressive Skill Loading Architecture - Type Definitions
 *
 * Complete TypeScript interfaces for the dynamic skills library
 * with three-level loading (summaries, instructions, resources).
 *
 * @version 1.0.0
 * @date 2025-12-06
 */
export type SkillId = string;
export type SkillVersion = string;
export type Timestamp = string;
/**
 * Skill tier classification
 */
export declare enum SkillTier {
    EXECUTIVE = "executive",// High-level orchestration (e.g., project-manager)
    SPECIALIST = "specialist",// Domain expertise (e.g., data-analyst)
    UTILITY = "utility"
}
/**
 * Skill status
 */
export declare enum SkillStatus {
    STABLE = "stable",// Production-ready
    BETA = "beta",// Testing phase
    ALPHA = "alpha",// Early development
    DEPRECATED = "deprecated",// Scheduled for removal
    EXPERIMENTAL = "experimental"
}
/**
 * Skill category
 */
export declare enum SkillCategory {
    CODE = "code",
    DATA = "data",
    RESEARCH = "research",
    COMMUNICATION = "communication",
    PROJECT_MANAGEMENT = "project-management",
    CREATIVE = "creative",
    ANALYSIS = "analysis",
    AUTOMATION = "automation",
    INTEGRATION = "integration",
    SYSTEM = "system"
}
/**
 * Resource types for Level 3
 */
export declare enum ResourceType {
    DOCUMENTATION = "docs",// Markdown/HTML documentation
    CODE_TEMPLATE = "template",// Reusable code patterns
    SCHEMA = "schema",// Data/API schemas
    REFERENCE_DATA = "data",// Lookup tables, constants
    EXAMPLES = "examples",// Detailed examples
    INTEGRATION = "integration"
}
/**
 * Trigger types for skill activation
 */
export declare enum TriggerType {
    KEYWORD = "keyword",// Simple keyword match
    PATTERN = "pattern",// Regex pattern
    SEMANTIC = "semantic",// Embedding similarity
    EXPLICIT = "explicit",// User invokes by name
    DEPENDENCY = "dependency",// Another skill requires this
    SCHEDULED = "scheduled"
}
/**
 * Skill Manifest - Complete metadata for skill registration
 */
export interface SkillManifest {
    id: SkillId;
    name: string;
    version: SkillVersion;
    summary: string;
    triggers: TriggerDefinition[];
    tier: SkillTier;
    dependencies: SkillDependency[];
    conflicts: SkillId[];
    alternatives: SkillId[];
    instructions: SkillInstructions;
    resources: ResourceManifest[];
    metadata: SkillMetadata;
    performance: SkillPerformance;
    memory: SkillMemoryConfig;
}
/**
 * Level 1: Skill Summary (~50 tokens)
 */
export interface SkillSummary {
    id: SkillId;
    version: SkillVersion;
    summary: string;
    triggers: TriggerDefinition[];
    tier: SkillTier;
    dependencies: string[];
    estimatedTokens: number;
}
/**
 * Level 2: Skill Instructions (~500 tokens)
 */
export interface SkillInstructions {
    description: string;
    useCases: string[];
    antiPatterns: string[];
    interface: SkillInterface;
    procedure: ExecutionProcedure;
    examples: Example[];
    errorHandling: ErrorStrategy[];
}
/**
 * Trigger definition for skill activation
 */
export interface TriggerDefinition {
    type: TriggerType;
    pattern: string | RegExp;
    confidence: number;
    context?: string[];
    priority: number;
}
/**
 * Skill dependency specification
 */
export interface SkillDependency {
    skillId: SkillId;
    version?: string;
    required: boolean;
    loadTiming: 'eager' | 'lazy' | 'parallel';
    fallback?: SkillId;
}
/**
 * Skill I/O interface
 */
export interface SkillInterface {
    inputs: ParameterDefinition[];
    outputs: ParameterDefinition[];
    sideEffects: SideEffect[];
    idempotent: boolean;
}
export interface ParameterDefinition {
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: any;
    validation?: ValidationRule[];
    examples: any[];
}
export interface SideEffect {
    type: 'file_system' | 'network' | 'memory' | 'state';
    description: string;
    reversible: boolean;
}
/**
 * Execution procedure
 */
export interface ExecutionProcedure {
    steps: ProcedureStep[];
    parallelizable: boolean;
    estimatedDuration: string;
    retryStrategy?: RetryStrategy;
}
export interface ProcedureStep {
    order: number;
    action: string;
    description: string;
    requiredSkills?: SkillId[];
    optional: boolean;
    conditions?: Condition[];
}
export interface Example {
    title: string;
    description: string;
    input: any;
    output: any;
    code?: string;
}
export interface ErrorStrategy {
    errorCode: string;
    description: string;
    recoverable: boolean;
    recovery?: string;
    fallback?: string;
}
/**
 * Resource manifest for Level 3
 */
export interface ResourceManifest {
    id: string;
    type: ResourceType;
    name: string;
    description: string;
    path: string;
    size: number;
    format: string;
    loadStrategy: 'immediate' | 'lazy' | 'on_request';
    cacheDuration?: number;
    compression?: 'gzip' | 'brotli' | 'none';
}
/**
 * Skill metadata
 */
export interface SkillMetadata {
    author: string;
    created: Timestamp;
    updated: Timestamp;
    status: SkillStatus;
    tags: string[];
    category: SkillCategory;
    modelCompatibility: ModelVersion[];
    estimatedTokens: {
        level1: number;
        level2: number;
        level3Avg: number;
    };
}
/**
 * Model compatibility
 */
export interface ModelVersion {
    modelId: string;
    minVersion?: string;
    maxVersion?: string;
    features?: string[];
    degradationStrategy?: 'disable' | 'fallback' | 'limited';
}
/**
 * Skill performance tracking
 */
export interface SkillPerformance {
    averageExecutionMs: number;
    successRate: number;
    lastExecuted?: Timestamp;
    executionCount: number;
    failureCount: number;
}
/**
 * Skill memory configuration
 */
export interface SkillMemoryConfig {
    stateRetention: 'session' | 'persistent' | 'none';
    cacheStrategy: CacheStrategy;
    maxStateSize: number;
}
/**
 * Global skill system state
 */
export interface SkillSystemState {
    context: SkillExecutionContext;
    registry: SkillRegistry;
    loader: SkillLoader;
    memory: MemoryIntegration;
    metrics: SkillSystemMetrics;
}
/**
 * Skill execution context configuration
 */
export interface SkillContextConfig {
    sessionId: string;
    userId: string;
    modelId: string;
    memory: {
        hot: HotMemoryInterface;
        warm: WarmMemoryInterface;
        cold: ColdMemoryInterface;
    };
    userContext: UserContext;
    sessionTTL?: number;
}
/**
 * Skill execution context
 */
export declare class SkillExecutionContext {
    sessionId: string;
    userId: string;
    modelId: string;
    level1Summaries: Map<SkillId, SkillSummary>;
    level2Instructions: Map<SkillId, SkillInstructions>;
    level3Resources: Map<string, LoadedResource>;
    activeSkills: Map<SkillId, ActiveSkillState>;
    memory: {
        hot: HotMemoryInterface;
        warm: WarmMemoryInterface;
        cold: ColdMemoryInterface;
    };
    cache: SkillCache;
    sessionTTL: number;
    userContext: UserContext;
    constructor(config: SkillContextConfig);
    loadSkill(skillId: SkillId, level: 1 | 2 | 3): Promise<void>;
    unloadSkill(skillId: SkillId): Promise<void>;
    getActiveSkills(): ActiveSkillState[];
    getTokenUsage(): TokenUsage;
}
/**
 * Active skill state in hot memory
 */
export interface ActiveSkillState {
    skillId: SkillId;
    version: SkillVersion;
    loadedAt: number;
    lastAccessedAt: number;
    executionCount: number;
    state: Record<string, any>;
    dependencies: Set<SkillId>;
    pinned: boolean;
    performance: {
        successCount: number;
        failureCount: number;
        avgExecutionMs: number;
        successRate: number;
    };
}
/**
 * User context for personalization
 */
export interface UserContext {
    userId: string;
    sessionId: string;
    conversationSummary?: string;
    preferences: UserPreferences;
    history: {
        recentSkills: SkillId[];
        favoriteSkills: SkillId[];
        bannedSkills: SkillId[];
    };
}
export interface UserPreferences {
    autoLoadPredicted: boolean;
    maxActiveSkills: number;
    preferredTiers: SkillTier[];
    verbosityLevel: 'minimal' | 'normal' | 'detailed';
}
/**
 * Skill data mapped to three-tier memory architecture
 */
export interface SkillMemoryMapping {
    hot: {
        activeSkills: Map<SkillId, ActiveSkillState>;
        loadedInstructions: Map<SkillId, SkillInstructions>;
        resourceCache: Map<string, CachedResource>;
        metrics: SkillMetrics;
        ttl: number;
    };
    warm: {
        instructionHistory: SkillInstructionHistory[];
        usagePatterns: SkillUsagePattern[];
        performanceHistory: SkillPerformanceRecord[];
        persistentState: Map<SkillId, SkillState>;
        skillEmbeddings: Map<SkillId, number[]>;
    };
    cold: {
        skillManifests: SkillManifest[];
        resources: ResourceManifest[];
        versionHistory: SkillVersionRecord[];
        documentation: SkillDocumentation[];
    };
}
export interface SkillUsagePattern {
    skillId: SkillId;
    userId: string;
    timeOfDay: Map<number, number>;
    dayOfWeek: Map<number, number>;
    commonTriggers: Array<{
        pattern: string;
        count: number;
    }>;
    coActivated: Map<SkillId, number>;
    preferredParameters: Record<string, any>;
    successContexts: string[];
    failureContexts: string[];
    firstSeen: Timestamp;
    lastSeen: Timestamp;
    totalInvocations: number;
}
export interface SkillInstructionHistory {
    skillId: SkillId;
    version: SkillVersion;
    loadedAt: Timestamp;
    accessCount: number;
    lastAccessedAt: Timestamp;
}
export interface SkillPerformanceRecord {
    skillId: SkillId;
    timestamp: Timestamp;
    executionMs: number;
    success: boolean;
    errorCode?: string;
}
export interface SkillState {
    [key: string]: any;
}
export interface SkillVersionRecord {
    skillId: SkillId;
    version: SkillVersion;
    releasedAt: Timestamp;
    changelog: string[];
    breakingChanges: string[];
}
export interface SkillDocumentation {
    skillId: SkillId;
    version: SkillVersion;
    content: string;
    format: 'markdown' | 'html' | 'pdf';
}
export interface CachedResource {
    resourceId: string;
    data: any;
    cachedAt: number;
    size: number;
}
export interface SkillMetrics {
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    avgExecutionMs: number;
}
/**
 * Memory integration interface
 */
export interface MemoryIntegration {
    persistSkillState(skillId: SkillId, state: SkillState, context: SkillExecutionContext): Promise<void>;
    restoreSkillState(skillId: SkillId, context: SkillExecutionContext): Promise<SkillState | null>;
    recordUsagePattern(skillId: SkillId, trigger: TriggerMatch): Promise<void>;
    predictLikelySkills(userContext: UserContext): Promise<SkillPrediction[]>;
}
/**
 * Memory tier interfaces
 */
export interface HotMemoryInterface {
    get(key: string): Promise<any | null>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    getSessionSkills(sessionId: string): Promise<SkillId[]>;
}
export interface WarmMemoryInterface {
    get(key: string): Promise<any | null>;
    set(key: string, value: any, options: {
        ttl?: number;
        tags?: string[];
        importance?: number;
    }): Promise<void>;
    getUserPatterns(userId: string): Promise<SkillUsagePattern[]>;
    searchSimilarSkills(embedding: number[], options: {
        limit: number;
        minSimilarity: number;
    }): Promise<Array<{
        skillId: SkillId;
        similarity: number;
    }>>;
}
export interface ColdMemoryInterface {
    read(path: string): Promise<any | null>;
    write(path: string, data: any): Promise<void>;
    backup(path: string, data: any): Promise<void>;
}
/**
 * Skill registry - manages available skills
 */
export declare class SkillRegistry {
    private skills;
    private index;
    constructor();
    loadFromDirectory(path: string): Promise<void>;
    registerSkill(manifest: SkillManifest): Promise<void>;
    unregisterSkill(skillId: SkillId): Promise<void>;
    getSkill(skillId: SkillId, version?: SkillVersion): Promise<SkillManifest | null>;
    searchSkills(query: SkillQuery): Promise<SkillSearchResult[]>;
    listSkills(filter?: SkillFilter): Promise<SkillManifest[]>;
    getDependencyGraph(skillId: SkillId): Promise<DependencyGraph>;
    private updateIndexes;
    private removeFromIndexes;
}
/**
 * Skill index for fast lookups
 */
export interface SkillIndex {
    byId: Map<SkillId, SkillManifest[]>;
    byTier: Map<SkillTier, Set<SkillId>>;
    byCategory: Map<SkillCategory, Set<SkillId>>;
    byTrigger: Map<string, Set<SkillId>>;
    byTag: Map<string, Set<SkillId>>;
    embeddings: Map<SkillId, number[]>;
}
/**
 * Skill query
 */
export interface SkillQuery {
    text?: string;
    embedding?: number[];
    tier?: SkillTier[];
    category?: SkillCategory[];
    tags?: string[];
    minSuccessRate?: number;
    limit?: number;
}
export interface SkillSearchResult {
    skill: SkillManifest;
    score: number;
    matchReason: string;
    relevanceFactors: {
        semantic: number;
        keyword: number;
        historical: number;
    };
}
export interface SkillFilter {
    tier?: SkillTier[];
    category?: SkillCategory[];
    status?: SkillStatus[];
}
/**
 * Skill loader configuration
 */
export interface SkillLoaderConfig {
    summariesPath: string;
    instructionsPath: string;
    resourcesPath: string;
}
/**
 * Skill loader - manages loading/unloading
 */
export declare class SkillLoader {
    private context;
    private storage;
    private config;
    constructor(context: SkillExecutionContext, config: SkillLoaderConfig);
    loadLevel1(): Promise<Map<SkillId, SkillSummary>>;
    loadLevel2(skillId: SkillId): Promise<SkillInstructions>;
    loadLevel3(skillId: SkillId, resourceIds: string[]): Promise<LoadedResource[]>;
    unload(skillId: SkillId, level: 2 | 3): Promise<void>;
    preload(skillIds: SkillId[]): Promise<void>;
    getLoadedSkills(): Promise<LoadedSkillInfo[]>;
    getTokenUsage(): Promise<TokenUsage>;
}
/**
 * Skill storage interface
 */
export interface SkillStorage {
    getSummary(skillId: SkillId): Promise<SkillSummary>;
    getAllSummaries(): Promise<Map<SkillId, SkillSummary>>;
    getInstructions(skillId: SkillId): Promise<SkillInstructions>;
    cacheInstructions(skillId: SkillId, instructions: SkillInstructions): Promise<void>;
    getResource(skillId: SkillId, resourceId: string): Promise<LoadedResource>;
    streamResource(skillId: SkillId, resourceId: string): AsyncIterator<Chunk>;
}
/**
 * File system implementation of skill storage
 */
export declare class FileSystemSkillStorage implements SkillStorage {
    private config;
    constructor(config: SkillLoaderConfig);
    getSummary(skillId: SkillId): Promise<SkillSummary>;
    getAllSummaries(): Promise<Map<SkillId, SkillSummary>>;
    getInstructions(skillId: SkillId): Promise<SkillInstructions>;
    cacheInstructions(skillId: SkillId, instructions: SkillInstructions): Promise<void>;
    getResource(skillId: SkillId, resourceId: string): Promise<LoadedResource>;
    streamResource(skillId: SkillId, resourceId: string): AsyncIterator<Chunk>;
}
export interface Chunk {
    data: Buffer;
    offset: number;
    total: number;
}
export interface LoadedSkill {
    skillId: SkillId;
    version: SkillVersion;
    level: 1 | 2 | 3;
    instructions?: SkillInstructions;
    dependencies?: Map<SkillId, LoadedSkill>;
    resources?: LoadedResource[];
    loadDurationMs: number;
    tokenCount: number;
}
export interface LoadedResource {
    resourceId: string;
    type: ResourceType;
    data: any;
    size: number;
    loadedAt: number;
    cached: boolean;
}
export interface LoadedSkillInfo {
    skillId: SkillId;
    version: SkillVersion;
    loadedLevels: (1 | 2 | 3)[];
    tokenUsage: number;
    lastAccessedAt: number;
    executionCount: number;
}
export interface TriggerMatcher {
    match(input: string, context: SkillExecutionContext): Promise<TriggerMatch[]>;
}
export interface TriggerMatch {
    skillId: SkillId;
    trigger: TriggerDefinition;
    confidence: number;
    matchedText: string;
    context: string[];
}
export interface SkillExecutor {
    execute(skillId: SkillId, input: SkillInput, context: SkillExecutionContext): Promise<SkillOutput>;
}
export interface SkillInput {
    parameters: Record<string, any>;
    userMessage?: string;
    context?: Record<string, any>;
}
export interface SkillOutput {
    success: boolean;
    result?: any;
    error?: SkillError;
    sideEffects?: SideEffect[];
    metrics: ExecutionMetrics;
}
export interface SkillError {
    code: string;
    message: string;
    recoverable: boolean;
    suggestion?: string;
}
export interface ExecutionMetrics {
    startTime: number;
    endTime: number;
    durationMs: number;
    tokensUsed: number;
    resourcesLoaded: number;
    dependenciesInvoked: number;
}
export interface SkillCache {
    get(key: string, level: 'level1' | 'level2' | 'level3'): Promise<any | null>;
    set(key: string, value: any, level: 'level1' | 'level2' | 'level3', ttl?: number): Promise<void>;
    invalidate(skillId: SkillId): Promise<void>;
    clear(): Promise<void>;
    stats(): Promise<CacheStats>;
}
export interface CacheStrategy {
    type: 'lru' | 'lfu' | 'ttl' | 'adaptive';
    maxSize: number;
    ttl?: number;
    evictionPolicy: 'size' | 'age' | 'access_count';
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
    evictions: number;
}
export interface CacheEntry {
    key: string;
    value: any;
    level: 'level1' | 'level2' | 'level3';
    size: number;
    ttl?: number;
    createdAt: number;
    lastAccessedAt: number;
    accessCount: number;
}
/**
 * Multi-level caching for skills
 */
export declare class SkillCacheManager implements SkillCache {
    private hotMemory;
    private config;
    private l1Cache;
    private l2Cache;
    private stats;
    constructor(hotMemory: HotMemoryInterface, config: CacheStrategy);
    get(key: string, level: 'level1' | 'level2' | 'level3'): Promise<any | null>;
    set(key: string, value: any, level: 'level1' | 'level2' | 'level3', ttl?: number): Promise<void>;
    invalidate(skillId: SkillId): Promise<void>;
    clear(): Promise<void>;
    stats(): Promise<CacheStats>;
    private isExpired;
    private estimateSize;
}
export interface SkillSystemMetrics {
    level1: {
        loaded: number;
        totalTokens: number;
    };
    level2: {
        loaded: number;
        cached: number;
        totalTokens: number;
        cacheHitRate: number;
    };
    level3: {
        resourcesLoaded: number;
        totalBytes: number;
        cacheHitRate: number;
    };
    execution: {
        totalExecutions: number;
        successRate: number;
        avgExecutionMs: number;
    };
    memory: {
        hotMemoryUsed: number;
        warmMemoryUsed: number;
        coldMemoryUsed: number;
    };
}
export interface SkillPerformanceMetrics {
    skillId: SkillId;
    executionCount: number;
    successCount: number;
    failureCount: number;
    avgDurationMs: number;
    minDurationMs: number;
    maxDurationMs: number;
    p50DurationMs: number;
    p95DurationMs: number;
    p99DurationMs: number;
    successRate: number;
    lastExecutedAt: Timestamp;
}
export interface RetryStrategy {
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
    maxBackoffMs: number;
    retryableErrors: string[];
}
export interface Condition {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'regex';
    value: any;
}
export interface ValidationRule {
    type: 'required' | 'type' | 'range' | 'pattern' | 'custom';
    params?: any;
    message: string;
}
export interface DependencyGraph {
    root: SkillId;
    nodes: Map<SkillId, SkillManifest>;
    edges: Array<{
        from: SkillId;
        to: SkillId;
        type: 'required' | 'optional';
    }>;
    depth: number;
    circular: boolean;
}
export interface TokenUsage {
    level1: number;
    level2: number;
    level3: number;
    total: number;
    limit: number;
    utilizationPercent: number;
}
export interface SkillPrediction {
    skillId: SkillId;
    confidence: number;
    reason: 'temporal-pattern' | 'semantic-match' | 'co-activation' | 'user-preference';
}
export interface UnloadResult {
    unloadedCount: number;
    freedTokens: number;
    remainingActive: number;
}
export interface UpdateResult {
    success: boolean;
    previousVersion?: SkillVersion;
    newVersion?: SkillVersion;
    error?: string;
    requiresManualMigration?: boolean;
    migrationSteps?: string[];
    testResults?: TestResults;
}
export interface TestResults {
    passed: boolean;
    total: number;
    successful: number;
    failed: number;
    skipped: number;
    errors: string[];
}
export type UpdateType = 'major' | 'minor' | 'patch';
export interface SkillUpdate {
    skillId: SkillId;
    currentVersion: SkillVersion;
    latestVersion: SkillVersion;
    updateType: UpdateType;
    changelog: string[];
    breakingChanges: string[];
    autoUpdateSafe: boolean;
}
export interface DegradationStrategy {
    action: 'disable' | 'fallback' | 'limited';
    message: string;
    fallbackSkill?: SkillId;
    alternatives?: SkillId[];
    supportedFeatures?: string[];
    unsupportedFeatures?: string[];
}
export interface VerificationConfig {
    requireSignature: boolean;
    publicKey?: string;
    trustAnchors?: string[];
}
export interface VerificationResult {
    skillId: SkillId;
    version: SkillVersion;
    checks: VerificationCheck[];
    passed: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
export interface VerificationCheck {
    name: string;
    passed: boolean;
    message: string;
}
//# sourceMappingURL=skill-types.d.ts.map