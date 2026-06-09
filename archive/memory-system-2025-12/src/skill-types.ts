/**
 * Progressive Skill Loading Architecture - Type Definitions
 *
 * Complete TypeScript interfaces for the dynamic skills library
 * with three-level loading (summaries, instructions, resources).
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

import { MemorySystem, MemoryType, BaseMemory, MemoryId } from './memory/memory-schema';

// ============================================================================
// CORE TYPES
// ============================================================================

export type SkillId = string;
export type SkillVersion = string;
export type Timestamp = string;

/**
 * Skill tier classification
 */
export enum SkillTier {
  EXECUTIVE = 'executive', // High-level orchestration (e.g., project-manager)
  SPECIALIST = 'specialist', // Domain expertise (e.g., data-analyst)
  UTILITY = 'utility', // Support functions (e.g., file-reader)
  FOUNDATION = 'foundation', // Core foundational skills
  INFRASTRUCTURE = 'infrastructure', // Infrastructure-level skills
}

/**
 * Skill status
 */
export enum SkillStatus {
  STABLE = 'stable', // Production-ready
  BETA = 'beta', // Testing phase
  ALPHA = 'alpha', // Early development
  DEPRECATED = 'deprecated', // Scheduled for removal
  EXPERIMENTAL = 'experimental', // Experimental feature
}

/**
 * Skill category
 */
export enum SkillCategory {
  CODE = 'code',
  DATA = 'data',
  RESEARCH = 'research',
  COMMUNICATION = 'communication',
  PROJECT_MANAGEMENT = 'project-management',
  CREATIVE = 'creative',
  ANALYSIS = 'analysis',
  AUTOMATION = 'automation',
  INTEGRATION = 'integration',
  SYSTEM = 'system',
  INFRASTRUCTURE = 'infrastructure',
}

/**
 * Resource types for Level 3
 */
export enum ResourceType {
  DOCUMENTATION = 'docs', // Markdown/HTML documentation
  CODE_TEMPLATE = 'template', // Reusable code patterns
  SCHEMA = 'schema', // Data/API schemas
  REFERENCE_DATA = 'data', // Lookup tables, constants
  EXAMPLES = 'examples', // Detailed examples
  INTEGRATION = 'integration', // Third-party integration specs
}

/**
 * Trigger types for skill activation
 */
export enum TriggerType {
  KEYWORD = 'keyword', // Simple keyword match
  PATTERN = 'pattern', // Regex pattern
  SEMANTIC = 'semantic', // Embedding similarity
  EXPLICIT = 'explicit', // User invokes by name
  DEPENDENCY = 'dependency', // Another skill requires this
  SCHEDULED = 'scheduled', // Time-based activation
}

// ============================================================================
// SKILL MANIFEST
// ============================================================================

/**
 * Skill Manifest - Complete metadata for skill registration
 */
export interface SkillManifest {
  // Identity
  id: SkillId;
  name: string;
  version: SkillVersion;

  // Level 1: Summary (always loaded)
  summary: string;
  triggers: TriggerDefinition[];
  tier: SkillTier;

  // Relationships
  dependencies: SkillDependency[];
  conflicts: SkillId[];
  alternatives: SkillId[];

  // Level 2: Instructions (on-demand)
  instructions: SkillInstructions;

  // Level 3: Resources (lazy-loaded)
  resources: ResourceManifest[];

  // Metadata
  metadata: SkillMetadata;

  // Performance
  performance: SkillPerformance;

  // Memory integration
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
  dependencies: string[]; // Just IDs for summary
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
  confidence: number; // 0-1, threshold for activation
  context?: string[]; // Required contextual markers
  priority: number; // Higher = checked first
}

/**
 * Skill dependency specification
 */
export interface SkillDependency {
  skillId: SkillId;
  version?: string; // SemVer range (e.g., "^2.0.0")
  required: boolean; // Hard vs soft dependency
  loadTiming: 'eager' | 'lazy' | 'parallel';
  fallback?: SkillId; // Alternative skill if unavailable
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
  type: string; // TypeScript type
  description: string;
  required: boolean;
  default?: any;
  validation?: ValidationRule[];
  examples: any[];
}

export interface SideEffect {
  type:
    | 'file_system'
    | 'network'
    | 'memory'
    | 'state'
    | 'messaging'
    | 'agent-invocation'
    | 'none'
    | 'testing'
    | 'data-collection'
    | 'computation'
    | 'cost';
  description: string;
  reversible: boolean;
}

/**
 * Execution procedure
 */
export interface ExecutionProcedure {
  steps: ProcedureStep[];
  parallelizable: boolean;
  estimatedDuration: string; // Human-readable (e.g., "2-5 seconds")
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
  path: string; // Relative path or URL
  size: number; // Bytes
  format: string; // MIME type or file extension
  loadStrategy: 'immediate' | 'lazy' | 'on_request' | 'eager';
  cacheDuration?: number; // Milliseconds, undefined = session
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
  degradationStrategy?: 'disable' | 'fallback' | 'limited' | 'full';
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
  maxStateSize: number; // Max bytes for skill state
}

// ============================================================================
// SKILL SYSTEM STATE
// ============================================================================

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
export class SkillExecutionContext {
  sessionId: string;
  userId: string;
  modelId: string;

  // Loaded skills by level
  level1Summaries: Map<SkillId, SkillSummary>;
  level2Instructions: Map<SkillId, SkillInstructions>;
  level3Resources: Map<string, LoadedResource>;

  // Active skills
  activeSkills: Map<SkillId, ActiveSkillState>;

  // Memory integration
  memory: {
    hot: HotMemoryInterface;
    warm: WarmMemoryInterface;
    cold: ColdMemoryInterface;
  };

  // Context management
  cache: SkillCache;
  sessionTTL: number;

  // User context
  userContext: UserContext;

  constructor(config: SkillContextConfig) {
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
      evictionPolicy: 'access_count',
    });
  }

  async loadSkill(skillId: SkillId, level: 1 | 2 | 3): Promise<void> {
    throw new Error('Not implemented');
  }

  async unloadSkill(skillId: SkillId): Promise<void> {
    throw new Error('Not implemented');
  }

  getActiveSkills(): ActiveSkillState[] {
    return Array.from(this.activeSkills.values());
  }

  getTokenUsage(): TokenUsage {
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
      utilizationPercent: ((level1 + level2) / 200000) * 100,
    };
  }
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

  // Current execution context
  state: Record<string, any>;

  // Loaded dependencies
  dependencies: Set<SkillId>;

  // Pinned (prevent unloading)
  pinned: boolean;

  // Performance tracking
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

// ============================================================================
// MEMORY INTEGRATION
// ============================================================================

/**
 * Skill data mapped to three-tier memory architecture
 */
export interface SkillMemoryMapping {
  // HOT MEMORY (Firebase RTDB)
  hot: {
    activeSkills: Map<SkillId, ActiveSkillState>;
    loadedInstructions: Map<SkillId, SkillInstructions>;
    resourceCache: Map<string, CachedResource>;
    metrics: SkillMetrics;
    ttl: number;
  };

  // WARM MEMORY (Firestore + Vector DB)
  warm: {
    instructionHistory: SkillInstructionHistory[];
    usagePatterns: SkillUsagePattern[];
    performanceHistory: SkillPerformanceRecord[];
    persistentState: Map<SkillId, SkillState>;
    skillEmbeddings: Map<SkillId, number[]>;
  };

  // COLD MEMORY (GitHub Repository)
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

  // Temporal patterns
  timeOfDay: Map<number, number>;
  dayOfWeek: Map<number, number>;

  // Context patterns
  commonTriggers: Array<{
    pattern: string;
    count: number;
  }>;

  // Co-occurrence with other skills
  coActivated: Map<SkillId, number>;

  // User preferences
  preferredParameters: Record<string, any>;

  // Success correlation
  successContexts: string[];
  failureContexts: string[];

  // Metadata
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
  persistSkillState(
    skillId: SkillId,
    state: SkillState,
    context: SkillExecutionContext
  ): Promise<void>;
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
  set(
    key: string,
    value: any,
    options: {
      ttl?: number;
      tags?: string[];
      importance?: number;
    }
  ): Promise<void>;
  getUserPatterns(userId: string): Promise<SkillUsagePattern[]>;
  searchSimilarSkills(
    embedding: number[],
    options: {
      limit: number;
      minSimilarity: number;
    }
  ): Promise<Array<{ skillId: SkillId; similarity: number }>>;
}

export interface ColdMemoryInterface {
  read(path: string): Promise<any | null>;
  write(path: string, data: any): Promise<void>;
  backup(path: string, data: any): Promise<void>;
}

// ============================================================================
// SKILL REGISTRY
// ============================================================================

/**
 * Skill registry - manages available skills
 */
export class SkillRegistry {
  private skills: Map<SkillId, SkillManifest[]>;
  private index: SkillIndex;

  constructor() {
    this.skills = new Map();
    this.index = {
      byId: new Map(),
      byTier: new Map(),
      byCategory: new Map(),
      byTrigger: new Map(),
      byTag: new Map(),
      embeddings: new Map(),
    };
  }

  async loadFromDirectory(path: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async registerSkill(manifest: SkillManifest): Promise<void> {
    const versions = this.skills.get(manifest.id) || [];
    versions.push(manifest);
    this.skills.set(manifest.id, versions);

    // Update indexes
    this.updateIndexes(manifest);
  }

  async unregisterSkill(skillId: SkillId): Promise<void> {
    this.skills.delete(skillId);
    this.removeFromIndexes(skillId);
  }

  async getSkill(skillId: SkillId, version?: SkillVersion): Promise<SkillManifest | null> {
    const versions = this.skills.get(skillId);
    if (!versions || versions.length === 0) {
      return null;
    }

    if (version) {
      return versions.find((v) => v.version === version) || null;
    }

    // Return latest version
    return versions[versions.length - 1];
  }

  async searchSkills(query: SkillQuery): Promise<SkillSearchResult[]> {
    throw new Error('Not implemented');
  }

  async listSkills(filter?: SkillFilter): Promise<SkillManifest[]> {
    const allSkills: SkillManifest[] = [];
    for (const versions of this.skills.values()) {
      allSkills.push(versions[versions.length - 1]); // Latest version
    }
    return allSkills;
  }

  async getDependencyGraph(skillId: SkillId): Promise<DependencyGraph> {
    throw new Error('Not implemented');
  }

  private updateIndexes(manifest: SkillManifest): void {
    // Implementation
  }

  private removeFromIndexes(skillId: SkillId): void {
    // Implementation
  }
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

// ============================================================================
// SKILL LOADER
// ============================================================================

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
export class SkillLoader {
  private context: SkillExecutionContext;
  private storage: SkillStorage;
  private config: SkillLoaderConfig;

  constructor(context: SkillExecutionContext, config: SkillLoaderConfig) {
    this.context = context;
    this.config = config;
    this.storage = new FileSystemSkillStorage(config);
  }

  async loadLevel1(): Promise<Map<SkillId, SkillSummary>> {
    return await this.storage.getAllSummaries();
  }

  async loadLevel2(skillId: SkillId): Promise<SkillInstructions> {
    return await this.storage.getInstructions(skillId);
  }

  async loadLevel3(skillId: SkillId, resourceIds: string[]): Promise<LoadedResource[]> {
    const resources: LoadedResource[] = [];
    for (const resourceId of resourceIds) {
      const resource = await this.storage.getResource(skillId, resourceId);
      resources.push(resource);
    }
    return resources;
  }

  async unload(skillId: SkillId, level: 2 | 3): Promise<void> {
    if (level === 2) {
      this.context.level2Instructions.delete(skillId);
    } else if (level === 3) {
      // Remove all resources for this skill
      for (const [key, _] of this.context.level3Resources) {
        if (key.startsWith(`${skillId}:`)) {
          this.context.level3Resources.delete(key);
        }
      }
    }
  }

  async preload(skillIds: SkillId[]): Promise<void> {
    for (const skillId of skillIds) {
      const instructions = await this.loadLevel2(skillId);
      this.context.level2Instructions.set(skillId, instructions);
    }
  }

  async getLoadedSkills(): Promise<LoadedSkillInfo[]> {
    const infos: LoadedSkillInfo[] = [];
    for (const [skillId, state] of this.context.activeSkills) {
      infos.push({
        skillId,
        version: state.version,
        loadedLevels: [1, 2], // Simplified
        tokenUsage: 550,
        lastAccessedAt: state.lastAccessedAt,
        executionCount: state.executionCount,
      });
    }
    return infos;
  }

  async getTokenUsage(): Promise<TokenUsage> {
    return this.context.getTokenUsage();
  }
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
export class FileSystemSkillStorage implements SkillStorage {
  constructor(private config: SkillLoaderConfig) {}

  async getSummary(skillId: SkillId): Promise<SkillSummary> {
    throw new Error('Not implemented');
  }

  async getAllSummaries(): Promise<Map<SkillId, SkillSummary>> {
    throw new Error('Not implemented');
  }

  async getInstructions(skillId: SkillId): Promise<SkillInstructions> {
    throw new Error('Not implemented');
  }

  async cacheInstructions(skillId: SkillId, instructions: SkillInstructions): Promise<void> {
    throw new Error('Not implemented');
  }

  async getResource(skillId: SkillId, resourceId: string): Promise<LoadedResource> {
    throw new Error('Not implemented');
  }

  async *streamResource(skillId: SkillId, resourceId: string): AsyncIterator<Chunk> {
    throw new Error('Not implemented');
  }
}

export interface Chunk {
  data: Buffer;
  offset: number;
  total: number;
}

// ============================================================================
// LOADING RESULTS
// ============================================================================

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

// ============================================================================
// TRIGGER MATCHING
// ============================================================================

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

// ============================================================================
// EXECUTION
// ============================================================================

export interface SkillExecutor {
  execute(
    skillId: SkillId,
    input: SkillInput,
    context: SkillExecutionContext
  ): Promise<SkillOutput>;
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

// ============================================================================
// CACHING
// ============================================================================

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
export class SkillCacheManager implements SkillCache {
  private l1Cache: Map<string, CacheEntry>;
  private l2Cache: Map<string, CacheEntry>;
  private _stats: CacheStats;

  constructor(
    private hotMemory: HotMemoryInterface,
    private config: CacheStrategy
  ) {
    this.l1Cache = new Map();
    this.l2Cache = new Map();
    this._stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      maxSize: config.maxSize,
      evictions: 0,
    };
  }

  async get(key: string, level: 'level1' | 'level2' | 'level3'): Promise<any | null> {
    // Try L1 cache
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && !this.isExpired(l1Entry)) {
      this._stats.hits++;
      return l1Entry.value;
    }

    // Try L2 cache
    const l2Entry = this.l2Cache.get(key);
    if (l2Entry && !this.isExpired(l2Entry)) {
      this._stats.hits++;
      return l2Entry.value;
    }

    this._stats.misses++;
    return null;
  }

  async set(
    key: string,
    value: any,
    level: 'level1' | 'level2' | 'level3',
    ttl?: number
  ): Promise<void> {
    const entry: CacheEntry = {
      key,
      value,
      level,
      size: this.estimateSize(value),
      ttl: ttl || this.config.ttl,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
    };

    if (entry.size < 1024 * 1024) {
      this.l1Cache.set(key, entry);
    } else {
      this.l2Cache.set(key, entry);
    }
  }

  async invalidate(skillId: SkillId): Promise<void> {
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

  async clear(): Promise<void> {
    this.l1Cache.clear();
    this.l2Cache.clear();
  }

  async stats(): Promise<CacheStats> {
    return this._stats;
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.createdAt > entry.ttl;
  }

  private estimateSize(value: any): number {
    return JSON.stringify(value).length;
  }
}

// ============================================================================
// METRICS & MONITORING
// ============================================================================

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

// ============================================================================
// UTILITY TYPES
// ============================================================================

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
  edges: Array<{ from: SkillId; to: SkillId; type: 'required' | 'optional' }>;
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

// ============================================================================
// VERSION MANAGEMENT
// ============================================================================

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
