# Progressive Skill Loading Architecture

## Dynamic Skills Library with Three-Level Loading

Version: 1.0.0
Date: 2025-12-06
Author: Technical Architecture Team

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Three-Level Loading Protocol](#three-level-loading-protocol)
3. [Skill Manifest Format](#skill-manifest-format)
4. [Loading Protocol Specification](#loading-protocol-specification)
5. [Memory Integration](#memory-integration)
6. [Version Compatibility](#version-compatibility)
7. [TypeScript Interfaces](#typescript-interfaces)
8. [Implementation Guide](#implementation-guide)
9. [Performance Optimization](#performance-optimization)
10. [Security Considerations](#security-considerations)

---

## System Overview

The Progressive Skill Loading Architecture implements a three-level lazy loading system for AI agent skills, optimizing context window usage and response latency while maintaining comprehensive capability awareness.

### Design Principles

1. **Progressive Disclosure**: Load only what's needed, when it's needed
2. **Context Efficiency**: Minimize token usage with smart loading strategies
3. **Fast Discovery**: Always-loaded summaries enable rapid skill matching
4. **Memory Integration**: Leverage three-tier memory for skill state management
5. **Version Resilience**: Graceful degradation across model updates

### Loading Levels

```
┌─────────────────────────────────────────────────────────────┐
│ LEVEL 1: SUMMARIES (~50 tokens each)                       │
│ - Always loaded in context                                  │
│ - Skill ID, version, triggers, tier classification         │
│ - Total: ~2,500 tokens for 50 skills                       │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ LEVEL 2: INSTRUCTIONS (~500 tokens each)                   │
│ - Loaded on trigger match or explicit invocation           │
│ - Detailed how-to, parameters, examples                    │
│ - 1-5 skills loaded per session typically                  │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ LEVEL 3: RESOURCES (unlimited size)                        │
│ - Loaded only when skill is actively executing             │
│ - Reference data, schemas, large examples, docs            │
│ - Streamed or cached as needed                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Three-Level Loading Protocol

### Level 1: Summaries (Always Loaded)

**Purpose**: Provide complete skill catalog awareness with minimal token cost.

**Token Budget**: ~50 tokens per skill summary

**Content**:

- Skill ID and version
- One-line description
- Trigger keywords/patterns
- Tier classification
- Dependency hints

**Example**:

```yaml
# data-analysis-skill v2.1.0 [specialist]
# Triggers: "analyze data", "statistical", "visualization"
# Deps: python-executor, chart-renderer
# Analyzes datasets with statistical methods and creates visualizations
```

**Loading**: Embedded in system prompt or loaded at session initialization.

**Storage**: Hot memory (Firebase RTDB) for instant access.

---

### Level 2: Instructions (On-Demand)

**Purpose**: Provide detailed execution guidance when skill is activated.

**Token Budget**: ~500 tokens per skill instruction set

**Content**:

- Detailed description and use cases
- Input/output specifications
- Step-by-step procedures
- Common patterns and examples
- Error handling guidelines
- Integration points with other skills

**Example Structure**:

```markdown
## Data Analysis Skill v2.1.0

### Description

Performs comprehensive data analysis on structured datasets including
statistical analysis, trend detection, outlier identification, and
visualization generation.

### When to Use

- User requests data insights or analysis
- Pattern: "analyze", "statistics", "trends", "correlations"
- Applicable to: CSV, JSON, Excel, SQL query results

### Input Specification

{
"dataset": DataSource,
"analysisType": "descriptive" | "inferential" | "exploratory",
"visualizations": boolean,
"outputFormat": "report" | "interactive" | "summary"
}

### Execution Steps

1. Validate and load dataset (Level 3: data-loader)
2. Perform statistical analysis (Level 3: stats-engine)
3. Generate insights narrative
4. Create visualizations if requested
5. Format output according to specification

### Examples

[Detailed examples here]

### Error Handling

[Error scenarios and recovery]
```

**Loading Triggers**:

- Keyword/pattern match in user input
- Explicit skill invocation
- Dependency chain activation
- User preference for this skill domain

**Storage**: Warm memory (Firestore) with semantic search indexing.

---

### Level 3: Resources (As-Needed)

**Purpose**: Provide unlimited supporting resources for active skill execution.

**Token Budget**: Unlimited (streamed/cached dynamically)

**Content**:

- Reference documentation
- Large code examples and templates
- Schema definitions
- Lookup tables and reference data
- Training examples
- API specifications
- Integration guides

**Loading Triggers**:

- Skill enters "executing" state
- Specific resource requested by skill logic
- Error recovery requiring documentation
- User asks for detailed explanation

**Storage**: Cold memory (GitHub) with lazy loading and caching.

**Resource Types**:

```typescript
enum ResourceType {
  DOCUMENTATION = 'docs', // Markdown/HTML documentation
  CODE_TEMPLATE = 'template', // Reusable code patterns
  SCHEMA = 'schema', // Data/API schemas
  REFERENCE_DATA = 'data', // Lookup tables, constants
  EXAMPLES = 'examples', // Detailed examples
  INTEGRATION = 'integration', // Third-party integration specs
}
```

---

## Skill Manifest Format

### Complete Manifest Schema

```typescript
/**
 * Skill Manifest - Complete metadata for skill registration
 */
interface SkillManifest {
  // Identity
  id: string; // Unique skill identifier (kebab-case)
  name: string; // Human-readable name
  version: string; // Semantic version (MAJOR.MINOR.PATCH)

  // Level 1: Summary (always loaded)
  summary: string; // 1-2 sentence description (~50 tokens)
  triggers: TriggerDefinition[]; // When to activate this skill
  tier: SkillTier; // Skill classification

  // Relationships
  dependencies: SkillDependency[]; // Required/optional skills
  conflicts: string[]; // Incompatible skill IDs
  alternatives: string[]; // Alternative skill IDs

  // Level 2: Instructions (on-demand)
  instructions: {
    description: string; // Detailed description
    useCases: string[]; // When to use this skill
    antiPatterns: string[]; // When NOT to use
    interface: SkillInterface; // I/O specifications
    procedure: ExecutionProcedure;
    examples: Example[];
    errorHandling: ErrorStrategy[];
  };

  // Level 3: Resources (lazy-loaded)
  resources: ResourceManifest[];

  // Metadata
  metadata: {
    author: string;
    created: string; // ISO 8601
    updated: string; // ISO 8601
    status: SkillStatus;
    tags: string[];
    category: SkillCategory;
    modelCompatibility: ModelVersion[];
    estimatedTokens: {
      level1: number;
      level2: number;
      level3Avg: number;
    };
  };

  // Performance
  performance: {
    averageExecutionMs: number;
    successRate: number;
    lastExecuted?: string;
    executionCount: number;
    failureCount: number;
  };

  // Memory integration
  memory: {
    stateRetention: 'session' | 'persistent' | 'none';
    cacheStrategy: CacheStrategy;
    maxStateSize: number; // Max bytes for skill state
  };
}

/**
 * Skill tier classification
 */
enum SkillTier {
  EXECUTIVE = 'executive', // High-level orchestration (e.g., project-manager)
  SPECIALIST = 'specialist', // Domain expertise (e.g., data-analyst)
  UTILITY = 'utility', // Support functions (e.g., file-reader)
}

/**
 * Trigger definition for skill activation
 */
interface TriggerDefinition {
  type: TriggerType;
  pattern: string | RegExp;
  confidence: number; // 0-1, threshold for activation
  context?: string[]; // Required contextual markers
  priority: number; // Higher = checked first
}

enum TriggerType {
  KEYWORD = 'keyword', // Simple keyword match
  PATTERN = 'pattern', // Regex pattern
  SEMANTIC = 'semantic', // Embedding similarity
  EXPLICIT = 'explicit', // User invokes by name
  DEPENDENCY = 'dependency', // Another skill requires this
  SCHEDULED = 'scheduled', // Time-based activation
}

/**
 * Skill dependency specification
 */
interface SkillDependency {
  skillId: string;
  version?: string; // SemVer range (e.g., "^2.0.0")
  required: boolean; // Hard vs soft dependency
  loadTiming: 'eager' | 'lazy' | 'parallel';
  fallback?: string; // Alternative skill if unavailable
}

/**
 * Skill I/O interface
 */
interface SkillInterface {
  inputs: ParameterDefinition[];
  outputs: ParameterDefinition[];
  sideEffects: SideEffect[];
  idempotent: boolean;
}

interface ParameterDefinition {
  name: string;
  type: string; // TypeScript type
  description: string;
  required: boolean;
  default?: any;
  validation?: ValidationRule[];
  examples: any[];
}

interface SideEffect {
  type: 'file_system' | 'network' | 'memory' | 'state';
  description: string;
  reversible: boolean;
}

/**
 * Execution procedure
 */
interface ExecutionProcedure {
  steps: ProcedureStep[];
  parallelizable: boolean;
  estimatedDuration: string; // Human-readable (e.g., "2-5 seconds")
  retryStrategy?: RetryStrategy;
}

interface ProcedureStep {
  order: number;
  action: string;
  description: string;
  requiredSkills?: string[]; // Other skills needed for this step
  optional: boolean;
  conditions?: Condition[];
}

/**
 * Resource manifest for Level 3
 */
interface ResourceManifest {
  id: string;
  type: ResourceType;
  name: string;
  description: string;
  path: string; // Relative path or URL
  size: number; // Bytes
  format: string; // MIME type or file extension
  loadStrategy: 'immediate' | 'lazy' | 'on_request';
  cacheDuration?: number; // Milliseconds, undefined = session
  compression?: 'gzip' | 'brotli' | 'none';
}

/**
 * Skill status
 */
enum SkillStatus {
  STABLE = 'stable', // Production-ready
  BETA = 'beta', // Testing phase
  ALPHA = 'alpha', // Early development
  DEPRECATED = 'deprecated', // Scheduled for removal
  EXPERIMENTAL = 'experimental', // Experimental feature
}

/**
 * Skill category
 */
enum SkillCategory {
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
}

/**
 * Model compatibility
 */
interface ModelVersion {
  modelId: string; // e.g., "claude-sonnet-4-5"
  minVersion?: string;
  maxVersion?: string;
  features?: string[]; // Required model features
  degradationStrategy?: 'disable' | 'fallback' | 'limited';
}
```

---

## Loading Protocol Specification

### Session Initialization

```typescript
/**
 * Skill loading protocol for session start
 */
async function initializeSkillSystem(
  sessionId: string,
  userContext: UserContext
): Promise<SkillSystemState> {
  // PHASE 1: Load Level 1 (Summaries) - Always
  const summaries = await loadLevel1Summaries();

  // PHASE 2: Pre-load based on user history
  const likelySkills = await predictLikelySkills(userContext);
  const preloaded = await loadLevel2Batch(likelySkills);

  // PHASE 3: Initialize memory connections
  const memoryState = await initializeSkillMemory(sessionId);

  // PHASE 4: Build execution context
  const context = new SkillExecutionContext({
    sessionId,
    loadedSummaries: summaries,
    preloadedInstructions: preloaded,
    memoryState,
    userContext,
  });

  return {
    context,
    metrics: {
      level1Count: summaries.length,
      level1Tokens: calculateTokens(summaries),
      level2PreloadCount: preloaded.length,
      level2Tokens: calculateTokens(preloaded),
      initDurationMs: performance.now(),
    },
  };
}
```

### Dynamic Loading on Trigger

```typescript
/**
 * Load skill instructions when triggered
 */
async function loadSkillOnTrigger(
  skillId: string,
  context: SkillExecutionContext,
  trigger: TriggerMatch
): Promise<LoadedSkill> {
  // Check if already loaded
  const cached = context.cache.get(skillId, 'level2');
  if (cached && !needsRefresh(cached)) {
    return cached;
  }

  // Load from appropriate tier
  const instructions = await loadLevel2Instructions(skillId);

  // Load dependencies
  const deps = await loadDependencies(instructions.dependencies, context);

  // Cache in warm memory
  await context.memory.warm.set(skillId, instructions, {
    ttl: 3600000, // 1 hour
    tags: ['skill', 'instructions', instructions.tier],
    importance: calculateSkillImportance(trigger),
  });

  // Update context
  context.activeSkills.set(skillId, {
    instructions,
    dependencies: deps,
    loadedAt: Date.now(),
    trigger,
  });

  return {
    skillId,
    instructions,
    dependencies: deps,
    loadDurationMs: performance.now(),
  };
}
```

### Resource Loading on Execution

```typescript
/**
 * Load Level 3 resources during skill execution
 */
async function loadSkillResources(
  skillId: string,
  resourceIds: string[],
  context: SkillExecutionContext
): Promise<LoadedResource[]> {
  const skill = context.activeSkills.get(skillId);
  if (!skill) {
    throw new Error(`Skill ${skillId} not active`);
  }

  const resources = await Promise.all(
    resourceIds.map(async (resourceId) => {
      // Check cache first
      const cached = await context.memory.hot.get(`resource:${skillId}:${resourceId}`);

      if (cached) {
        return cached;
      }

      // Load from cold storage
      const resource = await loadFromColdStorage(skillId, resourceId);

      // Decompress if needed
      const data = await decompressResource(resource);

      // Cache in hot memory if small enough
      if (data.size < 1024 * 1024) {
        // < 1MB
        await context.memory.hot.set(
          `resource:${skillId}:${resourceId}`,
          data,
          { ttl: 600000 } // 10 minutes
        );
      }

      return {
        resourceId,
        data,
        loadedAt: Date.now(),
      };
    })
  );

  return resources;
}
```

### Unloading and Cleanup

```typescript
/**
 * Unload inactive skills to free context space
 */
async function unloadInactiveSkills(
  context: SkillExecutionContext,
  aggressiveness: 'gentle' | 'moderate' | 'aggressive'
): Promise<UnloadResult> {
  const thresholds = {
    gentle: 300000, // 5 minutes idle
    moderate: 120000, // 2 minutes idle
    aggressive: 30000, // 30 seconds idle
  };

  const threshold = thresholds[aggressiveness];
  const now = Date.now();

  const toUnload: string[] = [];

  for (const [skillId, skill] of context.activeSkills) {
    const idleTime = now - skill.lastAccessedAt;

    if (idleTime > threshold && !skill.pinned) {
      toUnload.push(skillId);
    }
  }

  // Unload in reverse dependency order
  const ordered = topologicalSort(toUnload, context);

  for (const skillId of ordered) {
    // Move to warm memory
    const skill = context.activeSkills.get(skillId);
    await context.memory.warm.set(skillId, skill, {
      ttl: 3600000,
      importance: skill.performance.successRate,
    });

    // Remove from active context
    context.activeSkills.delete(skillId);
  }

  return {
    unloadedCount: toUnload.length,
    freedTokens: calculateFreedTokens(toUnload),
    remainingActive: context.activeSkills.size,
  };
}
```

---

## Memory Integration

### Three-Tier Memory Mapping

```typescript
/**
 * Skill data mapped to three-tier memory architecture
 */
interface SkillMemoryMapping {
  // HOT MEMORY (Firebase RTDB)
  hot: {
    // Active skill execution state
    activeSkills: Map<string, ActiveSkillState>;

    // Currently loaded Level 2 instructions
    loadedInstructions: Map<string, SkillInstructions>;

    // Small, frequently accessed resources (< 1MB)
    resourceCache: Map<string, CachedResource>;

    // Skill execution metrics
    metrics: SkillMetrics;

    // TTL: Session duration or 1 hour max
    ttl: number;
  };

  // WARM MEMORY (Firestore + Vector DB)
  warm: {
    // Recently used skill instructions
    instructionHistory: SkillInstructionHistory[];

    // Skill invocation patterns
    usagePatterns: SkillUsagePattern[];

    // Skill performance data
    performanceHistory: SkillPerformanceRecord[];

    // Skill state for persistent skills
    persistentState: Map<string, SkillState>;

    // Embeddings for semantic skill search
    skillEmbeddings: Map<string, number[]>;

    // TTL: 7-30 days based on access frequency
  };

  // COLD MEMORY (GitHub Repository)
  cold: {
    // Complete skill manifests
    skillManifests: SkillManifest[];

    // Level 3 resources
    resources: ResourceManifest[];

    // Skill version history
    versionHistory: SkillVersionRecord[];

    // Skill documentation
    documentation: SkillDocumentation[];

    // No TTL - permanent storage
  };
}

/**
 * Active skill state in hot memory
 */
interface ActiveSkillState {
  skillId: string;
  version: string;
  loadedAt: number;
  lastAccessedAt: number;
  executionCount: number;

  // Current execution context
  state: Record<string, any>;

  // Loaded dependencies
  dependencies: Set<string>;

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
 * Skill usage pattern in warm memory
 */
interface SkillUsagePattern {
  skillId: string;
  userId: string;

  // Temporal patterns
  timeOfDay: Map<number, number>; // Hour -> usage count
  dayOfWeek: Map<number, number>; // Day -> usage count

  // Context patterns
  commonTriggers: Array<{
    pattern: string;
    count: number;
  }>;

  // Co-occurrence with other skills
  coActivated: Map<string, number>; // SkillId -> count

  // User preferences
  preferredParameters: Record<string, any>;

  // Success correlation
  successContexts: string[];
  failureContexts: string[];

  // Metadata
  firstSeen: string;
  lastSeen: string;
  totalInvocations: number;
}
```

### Memory-Driven Skill Predictions

```typescript
/**
 * Predict likely skills based on memory patterns
 */
async function predictLikelySkills(
  userContext: UserContext,
  memorySystem: MemorySystem
): Promise<SkillPrediction[]> {
  const predictions: SkillPrediction[] = [];

  // 1. Check hot memory for recent session patterns
  const recentSkills = await memorySystem.hot.getSessionSkills(userContext.sessionId);

  // 2. Query warm memory for user usage patterns
  const userPatterns = await memorySystem.warm.getUserPatterns(userContext.userId);

  // 3. Temporal predictions
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  for (const pattern of userPatterns) {
    const temporalScore = (pattern.timeOfDay.get(hour) || 0) + (pattern.dayOfWeek.get(day) || 0);

    predictions.push({
      skillId: pattern.skillId,
      confidence: normalizeScore(temporalScore),
      reason: 'temporal-pattern',
    });
  }

  // 4. Semantic predictions from conversation context
  if (userContext.conversationSummary) {
    const embedding = await generateEmbedding(userContext.conversationSummary);

    const similarSkills = await memorySystem.warm.searchSimilarSkills(embedding, {
      limit: 5,
      minSimilarity: 0.7,
    });

    predictions.push(
      ...similarSkills.map((s) => ({
        skillId: s.skillId,
        confidence: s.similarity,
        reason: 'semantic-match',
      }))
    );
  }

  // 5. Co-activation predictions
  for (const activeSkill of recentSkills) {
    const coActivated = userPatterns.find((p) => p.skillId === activeSkill)?.coActivated;

    if (coActivated) {
      for (const [skillId, count] of coActivated) {
        predictions.push({
          skillId,
          confidence: Math.min(count / 100, 1.0),
          reason: 'co-activation',
        });
      }
    }
  }

  // Deduplicate and sort by confidence
  const unique = deduplicatePredictions(predictions);
  return unique.sort((a, b) => b.confidence - a.confidence).slice(0, 5); // Top 5 predictions
}
```

### Skill State Persistence

```typescript
/**
 * Persist skill state to appropriate memory tier
 */
async function persistSkillState(
  skillId: string,
  state: SkillState,
  context: SkillExecutionContext
): Promise<void> {
  const manifest = await getSkillManifest(skillId);

  switch (manifest.memory.stateRetention) {
    case 'session':
      // Store in hot memory (expires with session)
      await context.memory.hot.set(`skill:state:${skillId}`, state, { ttl: context.sessionTTL });
      break;

    case 'persistent':
      // Store in warm memory (long-term)
      await context.memory.warm.set(`skill:state:${skillId}`, state, {
        ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
        tags: ['skill-state', skillId],
        importance: 0.7,
      });

      // Also backup to cold storage periodically
      if (shouldBackupToCold(state)) {
        await context.memory.cold.backup(`skills/${skillId}/state.json`, state);
      }
      break;

    case 'none':
      // No persistence
      break;
  }
}

/**
 * Restore skill state from memory
 */
async function restoreSkillState(
  skillId: string,
  context: SkillExecutionContext
): Promise<SkillState | null> {
  // Try hot memory first
  const hotState = await context.memory.hot.get(`skill:state:${skillId}`);

  if (hotState) {
    return hotState;
  }

  // Try warm memory
  const warmState = await context.memory.warm.get(`skill:state:${skillId}`);

  if (warmState) {
    // Promote to hot memory
    await context.memory.hot.set(`skill:state:${skillId}`, warmState, { ttl: context.sessionTTL });
    return warmState;
  }

  // Try cold storage
  const coldState = await context.memory.cold.read(`skills/${skillId}/state.json`);

  if (coldState) {
    // Promote through the tiers
    await persistSkillState(skillId, coldState, context);
    return coldState;
  }

  return null;
}
```

---

## Version Compatibility

### Semantic Versioning for Skills

```typescript
/**
 * Semantic versioning scheme for skills
 *
 * MAJOR.MINOR.PATCH
 *
 * MAJOR: Breaking changes to interface or behavior
 * MINOR: New features, backward compatible
 * PATCH: Bug fixes, no interface changes
 */
interface SkillVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string; // e.g., "alpha.1", "beta.2"
  build?: string; // e.g., "20251206"
}

/**
 * Version compatibility checker
 */
function isCompatible(
  required: string, // SemVer range (e.g., "^2.0.0", ">=1.5.0 <2.0.0")
  available: string // Actual version (e.g., "2.1.3")
): boolean {
  return semver.satisfies(available, required);
}

/**
 * Version compatibility matrix
 */
interface CompatibilityMatrix {
  skill: string;
  version: string;

  compatibleWith: {
    skills: Map<string, string>; // SkillId -> Version range
    models: Map<string, string>; // ModelId -> Version range
    apis: Map<string, string>; // API -> Version range
  };

  deprecations: Deprecation[];
  migrations: Migration[];
}

interface Deprecation {
  feature: string;
  since: string; // Version when deprecated
  removedIn: string; // Version when removed
  replacement?: string; // Alternative to use
  reason: string;
}

interface Migration {
  fromVersion: string;
  toVersion: string;
  automated: boolean;
  steps: string[];
  breakingChanges: string[];
}
```

### Graceful Degradation

```typescript
/**
 * Handle incompatible skill versions gracefully
 */
async function handleVersionIncompatibility(
  skillId: string,
  requiredVersion: string,
  availableVersion: string,
  context: SkillExecutionContext
): Promise<DegradationStrategy> {
  const manifest = await getSkillManifest(skillId, availableVersion);

  // Check degradation strategy
  const strategy = manifest.metadata.modelCompatibility.find(
    (m) => m.modelId === context.modelId
  )?.degradationStrategy;

  switch (strategy) {
    case 'disable':
      // Skill unavailable
      return {
        action: 'disable',
        message:
          `Skill ${skillId} requires version ${requiredVersion}, ` +
          `but ${availableVersion} is available. Skill disabled.`,
        alternatives: manifest.alternatives,
      };

    case 'fallback':
      // Use alternative skill
      const fallback = manifest.alternatives[0];
      if (fallback) {
        return {
          action: 'fallback',
          fallbackSkill: fallback,
          message: `Using ${fallback} as fallback for ${skillId}`,
        };
      }
      return { action: 'disable' };

    case 'limited':
      // Run with limited functionality
      const limitedFeatures = await detectSupportedFeatures(skillId, availableVersion, context);

      return {
        action: 'limited',
        supportedFeatures: limitedFeatures,
        unsupportedFeatures: manifest.metadata.features.filter((f) => !limitedFeatures.includes(f)),
        message: `Running ${skillId} with limited features`,
      };

    default:
      // Try to auto-upgrade
      return await attemptAutoUpgrade(skillId, requiredVersion, context);
  }
}
```

### Self-Update Mechanism

```typescript
/**
 * Automatic skill update system
 */
class SkillUpdateManager {
  /**
   * Check for skill updates
   */
  async checkUpdates(context: SkillExecutionContext): Promise<SkillUpdate[]> {
    const installedSkills = await this.getInstalledSkills();
    const updates: SkillUpdate[] = [];

    for (const skill of installedSkills) {
      const latest = await this.fetchLatestVersion(skill.id);

      if (semver.gt(latest.version, skill.version)) {
        updates.push({
          skillId: skill.id,
          currentVersion: skill.version,
          latestVersion: latest.version,
          updateType: this.classifyUpdate(skill.version, latest.version),
          changelog: latest.changelog,
          breakingChanges: latest.breakingChanges,
          autoUpdateSafe: this.isAutoUpdateSafe(skill, latest),
        });
      }
    }

    return updates;
  }

  /**
   * Apply skill update
   */
  async applyUpdate(
    skillId: string,
    targetVersion: string,
    context: SkillExecutionContext
  ): Promise<UpdateResult> {
    const current = await this.getSkillManifest(skillId);
    const target = await this.fetchSkillVersion(skillId, targetVersion);

    // Check for breaking changes
    if (this.hasBreakingChanges(current.version, targetVersion)) {
      // Run migration
      const migration = await this.getMigration(current.version, targetVersion);

      if (migration.automated) {
        await this.runMigration(migration, context);
      } else {
        return {
          success: false,
          requiresManualMigration: true,
          migrationSteps: migration.steps,
        };
      }
    }

    // Download new version
    await this.downloadSkill(skillId, targetVersion);

    // Verify integrity
    await this.verifySkillIntegrity(skillId, targetVersion);

    // Backup current version
    await this.backupSkill(skillId, current.version);

    // Switch version
    await this.switchVersion(skillId, targetVersion);

    // Invalidate caches
    await this.invalidateCaches(skillId);

    // Test new version
    const testResults = await this.runSkillTests(skillId);

    if (!testResults.passed) {
      // Rollback
      await this.rollbackSkill(skillId, current.version);
      return {
        success: false,
        error: 'Tests failed',
        testResults,
      };
    }

    return {
      success: true,
      previousVersion: current.version,
      newVersion: targetVersion,
      testResults,
    };
  }

  /**
   * Classify update type
   */
  private classifyUpdate(current: string, latest: string): UpdateType {
    const currentVer = semver.parse(current);
    const latestVer = semver.parse(latest);

    if (latestVer.major > currentVer.major) {
      return 'major';
    } else if (latestVer.minor > currentVer.minor) {
      return 'minor';
    } else {
      return 'patch';
    }
  }

  /**
   * Check if auto-update is safe
   */
  private isAutoUpdateSafe(current: SkillManifest, latest: SkillManifest): boolean {
    // Only auto-update patch versions
    return (
      this.classifyUpdate(current.version, latest.version) === 'patch' &&
      latest.breakingChanges.length === 0
    );
  }
}
```

---

## TypeScript Interfaces

### Complete Type Definitions

```typescript
/**
 * Complete type definitions for skill loading system
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type SkillId = string;
export type SkillVersion = string;
export type Timestamp = string;

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

  constructor(config: SkillContextConfig);

  // Methods
  async loadSkill(skillId: SkillId, level: 1 | 2 | 3): Promise<void>;
  async unloadSkill(skillId: SkillId): Promise<void>;
  getActiveSkills(): ActiveSkillState[];
  getTokenUsage(): TokenUsage;
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
// SKILL REGISTRY
// ============================================================================

/**
 * Skill registry - manages available skills
 */
export class SkillRegistry {
  private skills: Map<SkillId, SkillManifest>;
  private index: SkillIndex;

  async registerSkill(manifest: SkillManifest): Promise<void>;
  async unregisterSkill(skillId: SkillId): Promise<void>;
  async getSkill(skillId: SkillId, version?: SkillVersion): Promise<SkillManifest>;
  async searchSkills(query: SkillQuery): Promise<SkillSearchResult[]>;
  async listSkills(filter?: SkillFilter): Promise<SkillManifest[]>;
  async getDependencyGraph(skillId: SkillId): Promise<DependencyGraph>;
}

/**
 * Skill index for fast lookups
 */
export interface SkillIndex {
  byId: Map<SkillId, SkillManifest[]>; // Multiple versions
  byTier: Map<SkillTier, Set<SkillId>>;
  byCategory: Map<SkillCategory, Set<SkillId>>;
  byTrigger: Map<string, Set<SkillId>>; // Keyword/pattern -> Skills
  byTag: Map<string, Set<SkillId>>;
  embeddings: Map<SkillId, number[]>; // For semantic search
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

// ============================================================================
// SKILL LOADER
// ============================================================================

/**
 * Skill loader - manages loading/unloading
 */
export class SkillLoader {
  private context: SkillExecutionContext;
  private storage: SkillStorage;

  async loadLevel1(): Promise<Map<SkillId, SkillSummary>>;
  async loadLevel2(skillId: SkillId): Promise<SkillInstructions>;
  async loadLevel3(skillId: SkillId, resourceIds: string[]): Promise<LoadedResource[]>;

  async unload(skillId: SkillId, level: 2 | 3): Promise<void>;
  async preload(skillIds: SkillId[]): Promise<void>;

  async getLoadedSkills(): Promise<LoadedSkillInfo[]>;
  async getTokenUsage(): Promise<TokenUsage>;
}

/**
 * Skill storage interface
 */
export interface SkillStorage {
  // Level 1
  getSummary(skillId: SkillId): Promise<SkillSummary>;
  getAllSummaries(): Promise<Map<SkillId, SkillSummary>>;

  // Level 2
  getInstructions(skillId: SkillId): Promise<SkillInstructions>;
  cacheInstructions(skillId: SkillId, instructions: SkillInstructions): Promise<void>;

  // Level 3
  getResource(skillId: SkillId, resourceId: string): Promise<LoadedResource>;
  streamResource(skillId: SkillId, resourceId: string): AsyncIterator<Chunk>;
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

export class KeywordTriggerMatcher implements TriggerMatcher {
  async match(input: string, context: SkillExecutionContext): Promise<TriggerMatch[]>;
}

export class SemanticTriggerMatcher implements TriggerMatcher {
  private embedder: EmbeddingService;

  async match(input: string, context: SkillExecutionContext): Promise<TriggerMatch[]>;
}

export class PatternTriggerMatcher implements TriggerMatcher {
  async match(input: string, context: SkillExecutionContext): Promise<TriggerMatch[]>;
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
```

---

## Implementation Guide

### Step 1: Set Up Skill Registry

```bash
# Create skill registry structure
mkdir -p skills/{manifests,instructions,resources}

# Level 1: Summaries (YAML for readability)
touch skills/manifests/registry.yaml

# Level 2: Instructions (Markdown)
mkdir -p skills/instructions/{executive,specialist,utility}

# Level 3: Resources
mkdir -p skills/resources/{docs,templates,schemas,data,examples}
```

### Step 2: Register Your First Skill

```yaml
# skills/manifests/data-analysis.yaml
---
id: data-analysis
name: Data Analysis
version: 2.1.0

# Level 1 Summary
summary: >
  Analyzes structured datasets with statistical methods and creates
  visualizations for insights discovery.

triggers:
  - type: keyword
    pattern: 'analyze data|statistics|visualization|dataset'
    confidence: 0.8
    priority: 10

  - type: semantic
    pattern: 'I want to understand patterns in my data'
    confidence: 0.75
    priority: 5

tier: specialist

dependencies:
  - skillId: python-executor
    version: '^3.0.0'
    required: true
    loadTiming: eager

  - skillId: chart-renderer
    version: '^1.5.0'
    required: false
    loadTiming: lazy

metadata:
  author: Skills Team
  created: '2024-08-15'
  updated: '2025-12-06'
  status: stable
  tags:
    - data
    - analysis
    - statistics
    - visualization
  category: data

  modelCompatibility:
    - modelId: 'claude-sonnet-4-5'
      features:
        - statistical-reasoning
        - code-execution
      degradationStrategy: limited

  estimatedTokens:
    level1: 48
    level2: 520
    level3Avg: 2400

performance:
  averageExecutionMs: 3500
  successRate: 0.94
  executionCount: 1247
  failureCount: 79

memory:
  stateRetention: session
  cacheStrategy:
    type: lru
    maxSize: 10485760 # 10MB
    ttl: 3600000 # 1 hour
  maxStateSize: 1048576 # 1MB
```

### Step 3: Create Level 2 Instructions

````markdown
<!-- skills/instructions/specialist/data-analysis.md -->

# Data Analysis Skill v2.1.0

## Description

Performs comprehensive data analysis on structured datasets including:

- Descriptive statistics (mean, median, mode, variance, etc.)
- Inferential statistics (hypothesis testing, confidence intervals)
- Exploratory data analysis (correlations, distributions, outliers)
- Trend detection and time series analysis
- Data visualization generation

## When to Use

**Triggers:**

- User uploads or references a dataset
- User asks for "analysis", "statistics", "trends", "correlations"
- User wants to "understand", "explore", or "visualize" data
- User provides structured data (CSV, JSON, Excel, SQL results)

**Applicable To:**

- Tabular data with clear column structure
- Time series data
- Categorical and numerical data
- Datasets from 10 rows to 1M+ rows

**Not Applicable To:**

- Unstructured text (use text-analysis skill)
- Images or videos (use vision skills)
- Real-time streaming data (use stream-analysis skill)

## Input Specification

```typescript
interface DataAnalysisInput {
  // Required
  dataset: DataSource;

  // Optional
  analysisType?: 'descriptive' | 'inferential' | 'exploratory' | 'predictive';
  columns?: string[]; // Specific columns to analyze
  visualizations?: boolean; // Generate charts
  outputFormat?: 'report' | 'interactive' | 'summary' | 'raw';
  statisticalTests?: string[]; // Specific tests to run

  // Advanced
  confidenceLevel?: number; // Default: 0.95
  outlierDetection?: boolean; // Default: true
  correlationThreshold?: number; // Default: 0.7
}

type DataSource =
  | { type: 'csv'; path: string }
  | { type: 'json'; data: object[] }
  | { type: 'url'; url: string }
  | { type: 'sql'; query: string; connection: ConnectionInfo };
```
````

## Output Specification

```typescript
interface DataAnalysisOutput {
  summary: {
    rowCount: number;
    columnCount: number;
    dataTypes: Record<string, string>;
    missingValues: Record<string, number>;
  };

  statistics: {
    descriptive: DescriptiveStats[];
    correlations?: CorrelationMatrix;
    distributions?: Distribution[];
  };

  insights: {
    keyFindings: string[];
    anomalies: Anomaly[];
    recommendations: string[];
  };

  visualizations?: {
    charts: Chart[];
    interactiveUrl?: string;
  };

  raw?: {
    processedData: any[];
    fullReport: string;
  };
}
```

## Execution Steps

1. **Validate Input**
   - Check dataset accessibility
   - Verify format compatibility
   - Estimate processing time
   - Load Level 3 resource: `schemas/data-source-schema.json`

2. **Load Data**
   - Use dependency: `python-executor` or `data-loader`
   - Handle large datasets with streaming if > 100MB
   - Detect and handle encoding issues
   - Load Level 3 resource: `templates/data-loader.py`

3. **Explore Data Structure**
   - Infer column types
   - Detect missing values
   - Identify categorical vs numerical columns
   - Generate basic statistics

4. **Perform Analysis**
   - Run requested statistical tests
   - Calculate descriptive statistics
   - Compute correlations and relationships
   - Detect outliers and anomalies
   - Load Level 3 resource: `templates/statistical-analysis.py`

5. **Generate Insights**
   - Interpret statistical results
   - Identify significant patterns
   - Formulate key findings
   - Create actionable recommendations

6. **Create Visualizations** (if requested)
   - Select appropriate chart types
   - Use dependency: `chart-renderer`
   - Generate publication-quality charts
   - Create interactive dashboard if needed
   - Load Level 3 resource: `templates/visualization-config.json`

7. **Format Output**
   - Compile results according to `outputFormat`
   - Generate narrative report
   - Include methodology notes
   - Provide reproducibility information

## Examples

### Example 1: Quick Statistical Summary

```typescript
const input = {
  dataset: { type: 'csv', path: './sales_data.csv' },
  analysisType: 'descriptive',
  outputFormat: 'summary',
};

const output = await executeSkill('data-analysis', input);
// Returns: Summary statistics with key findings
```

### Example 2: Comprehensive Analysis with Visualizations

```typescript
const input = {
  dataset: { type: 'json', data: salesData },
  analysisType: 'exploratory',
  visualizations: true,
  outputFormat: 'report',
  columns: ['revenue', 'quantity', 'category', 'date'],
};

const output = await executeSkill('data-analysis', input);
// Returns: Full report with charts and insights
```

### Example 3: Hypothesis Testing

```typescript
const input = {
  dataset: { type: 'sql', query: 'SELECT * FROM experiments', connection: db },
  analysisType: 'inferential',
  statisticalTests: ['t-test', 'anova', 'chi-square'],
  confidenceLevel: 0.95,
};

const output = await executeSkill('data-analysis', input);
// Returns: Statistical test results with interpretations
```

## Error Handling

### Common Errors

1. **Dataset Not Found**
   - Verify file path or URL
   - Check access permissions
   - Suggestion: Provide direct data or accessible path

2. **Format Not Supported**
   - Supported: CSV, JSON, Excel, SQL, Parquet
   - Suggestion: Convert to supported format or use data-converter skill

3. **Dataset Too Large**
   - Limit: 1GB for full in-memory analysis
   - Suggestion: Use sampling or streaming analysis
   - Fallback: Offer to analyze a sample

4. **Missing Dependencies**
   - Required: python-executor (v3.0+)
   - Optional: chart-renderer (v1.5+)
   - Suggestion: Install missing dependencies

5. **Invalid Analysis Type**
   - Suggestion: List available analysis types
   - Fallback: Default to 'exploratory'

### Recovery Strategies

- **Partial Success**: Return partial results with warnings
- **Degraded Mode**: Skip visualizations if chart-renderer unavailable
- **Sampling**: Analyze representative sample if dataset too large
- **Format Conversion**: Auto-convert compatible formats

## Integration Points

### Upstream Skills (can invoke this skill)

- `research-assistant`: For research data analysis
- `code-reviewer`: For performance metrics analysis
- `report-generator`: For data-driven reports

### Downstream Skills (this skill invokes)

- `python-executor`: Code execution
- `chart-renderer`: Visualization generation
- `data-loader`: Data import and preprocessing
- `statistical-engine`: Advanced statistics

### Resource Loading

- **On Activation**: Load schemas and validation rules
- **During Execution**: Load templates and examples as needed
- **On Error**: Load troubleshooting guides

## Performance Notes

- **Typical Execution**: 2-5 seconds for datasets < 10,000 rows
- **Large Datasets**: 10-30 seconds for datasets > 100,000 rows
- **With Visualizations**: +2-3 seconds
- **Memory Usage**: ~10-50MB depending on dataset size

## Version History

- **2.1.0** (2025-12-06): Added streaming support for large datasets
- **2.0.0** (2025-10-15): Redesigned with new statistical engine
- **1.5.2** (2025-08-20): Bug fixes in correlation calculations
- **1.5.0** (2025-07-10): Added inferential statistics support

````

### Step 4: Initialize Skill System

```typescript
// Example: skills/index.ts

import { SkillSystemState, SkillExecutionContext } from './types';
import { SkillRegistry } from './registry';
import { SkillLoader } from './loader';
import { MemoryIntegration } from './memory-integration';

/**
 * Initialize the skill system
 */
export async function initializeSkillSystem(
  config: {
    sessionId: string;
    userId: string;
    modelId: string;
    memorySystem: MemorySystem;
  }
): Promise<SkillSystemState> {

  // Create registry
  const registry = new SkillRegistry();
  await registry.loadFromDirectory('./skills/manifests');

  // Create execution context
  const context = new SkillExecutionContext({
    sessionId: config.sessionId,
    userId: config.userId,
    modelId: config.modelId,
    memory: {
      hot: config.memorySystem.hot,
      warm: config.memorySystem.warm,
      cold: config.memorySystem.cold
    },
    userContext: await loadUserContext(config.userId)
  });

  // Create loader
  const loader = new SkillLoader(context, {
    summariesPath: './skills/manifests',
    instructionsPath: './skills/instructions',
    resourcesPath: './skills/resources'
  });

  // Load Level 1 summaries (always loaded)
  const summaries = await loader.loadLevel1();
  context.level1Summaries = summaries;

  // Predict and preload likely skills
  const predictions = await predictLikelySkills(
    context.userContext,
    config.memorySystem
  );

  if (predictions.length > 0) {
    await loader.preload(
      predictions.slice(0, 3).map(p => p.skillId)
    );
  }

  // Create memory integration
  const memory = new MemoryIntegration(
    config.memorySystem,
    context
  );

  // Calculate initial metrics
  const metrics = calculateMetrics(context);

  return {
    context,
    registry,
    loader,
    memory,
    metrics
  };
}
````

---

## Performance Optimization

### Token Budget Management

```typescript
/**
 * Token budget optimizer
 */
class TokenBudgetOptimizer {
  private maxTokens: number;
  private context: SkillExecutionContext;

  constructor(maxTokens: number, context: SkillExecutionContext) {
    this.maxTokens = maxTokens;
    this.context = context;
  }

  /**
   * Get current token usage
   */
  getCurrentUsage(): TokenUsage {
    const level1 = this.calculateLevel1Tokens();
    const level2 = this.calculateLevel2Tokens();
    const level3 = this.calculateLevel3Tokens();
    const total = level1 + level2 + level3;

    return {
      level1,
      level2,
      level3,
      total,
      limit: this.maxTokens,
      utilizationPercent: (total / this.maxTokens) * 100,
    };
  }

  /**
   * Check if we can load more skills
   */
  canLoad(estimatedTokens: number): boolean {
    const current = this.getCurrentUsage();
    return current.total + estimatedTokens <= this.maxTokens;
  }

  /**
   * Optimize token usage by unloading low-value skills
   */
  async optimize(targetTokens: number): Promise<void> {
    const current = this.getCurrentUsage();

    if (current.total <= targetTokens) {
      return; // Already within budget
    }

    const toFree = current.total - targetTokens;

    // Score skills by value
    const scored = Array.from(this.context.activeSkills.entries())
      .map(([skillId, state]) => ({
        skillId,
        state,
        score: this.calculateSkillValue(state),
      }))
      .sort((a, b) => a.score - b.score); // Lowest value first

    let freed = 0;
    for (const { skillId, state } of scored) {
      if (freed >= toFree) break;

      if (!state.pinned) {
        await this.context.unloadSkill(skillId);
        freed += this.estimateSkillTokens(skillId);
      }
    }
  }

  /**
   * Calculate skill value (higher = more valuable)
   */
  private calculateSkillValue(state: ActiveSkillState): number {
    const recencyScore = 1.0 / (1 + (Date.now() - state.lastAccessedAt) / 60000);
    const frequencyScore = Math.min(state.executionCount / 10, 1.0);
    const successScore = state.performance.successRate;

    return recencyScore * 0.4 + frequencyScore * 0.3 + successScore * 0.3;
  }
}
```

### Caching Strategy

```typescript
/**
 * Multi-level caching for skills
 */
class SkillCacheManager implements SkillCache {
  private l1Cache: Map<string, CacheEntry>; // In-memory, < 1MB
  private l2Cache: Map<string, CacheEntry>; // Hot memory, < 10MB
  private stats: CacheStats;

  constructor(
    private hotMemory: HotMemoryInterface,
    private config: CacheStrategy
  ) {
    this.l1Cache = new Map();
    this.l2Cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      maxSize: config.maxSize,
      evictions: 0,
    };
  }

  async get(key: string, level: 'level1' | 'level2' | 'level3'): Promise<any | null> {
    // Try L1 cache (in-memory)
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && !this.isExpired(l1Entry)) {
      this.stats.hits++;
      l1Entry.accessCount++;
      l1Entry.lastAccessedAt = Date.now();
      return l1Entry.value;
    }

    // Try L2 cache (hot memory)
    const l2Entry = this.l2Cache.get(key);
    if (l2Entry && !this.isExpired(l2Entry)) {
      this.stats.hits++;

      // Promote to L1 if small enough
      if (this.estimateSize(l2Entry.value) < 1024 * 1024) {
        this.l1Cache.set(key, l2Entry);
      }

      return l2Entry.value;
    }

    // Try hot memory
    const hotValue = await this.hotMemory.get(key);
    if (hotValue) {
      this.stats.hits++;

      // Cache locally
      await this.set(key, hotValue, level);

      return hotValue;
    }

    this.stats.misses++;
    this.updateHitRate();
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

    // Determine which cache level
    if (entry.size < 1024 * 1024) {
      // < 1MB -> L1
      await this.evictIfNeeded(this.l1Cache, entry.size);
      this.l1Cache.set(key, entry);
    } else if (entry.size < 10 * 1024 * 1024) {
      // < 10MB -> L2
      await this.evictIfNeeded(this.l2Cache, entry.size);
      this.l2Cache.set(key, entry);
    }

    // Also store in hot memory
    await this.hotMemory.set(key, value, ttl);
  }

  private async evictIfNeeded(cache: Map<string, CacheEntry>, requiredSize: number): Promise<void> {
    const currentSize = this.calculateCacheSize(cache);

    if (currentSize + requiredSize <= this.config.maxSize) {
      return;
    }

    // Evict based on strategy
    const entries = Array.from(cache.entries())
      .map(([key, entry]) => ({
        key,
        entry,
        score: this.calculateEvictionScore(entry),
      }))
      .sort((a, b) => a.score - b.score); // Lowest score evicted first

    let freed = 0;
    for (const { key, entry } of entries) {
      if (freed >= requiredSize) break;

      cache.delete(key);
      freed += entry.size;
      this.stats.evictions++;
    }
  }

  private calculateEvictionScore(entry: CacheEntry): number {
    // LRU + LFU hybrid
    const recency = 1.0 / (1 + (Date.now() - entry.lastAccessedAt) / 60000);
    const frequency = Math.min(entry.accessCount / 100, 1.0);

    return recency * 0.6 + frequency * 0.4;
  }
}
```

---

## Security Considerations

### Skill Sandboxing

```typescript
/**
 * Security sandbox for skill execution
 */
interface SkillSandbox {
  // Execution limits
  maxExecutionMs: number;
  maxMemoryBytes: number;
  maxCpuPercent: number;

  // Permission model
  permissions: {
    fileSystem: FileSystemPermission;
    network: NetworkPermission;
    memory: MemoryPermission;
    subprocess: SubprocessPermission;
  };

  // Isolation level
  isolationLevel: 'none' | 'process' | 'container' | 'vm';
}

interface FileSystemPermission {
  allowed: boolean;
  readPaths: string[];
  writePaths: string[];
  excludePaths: string[];
}

interface NetworkPermission {
  allowed: boolean;
  allowedHosts: string[];
  blockedHosts: string[];
  allowedPorts: number[];
}
```

### Skill Verification

```typescript
/**
 * Verify skill integrity and authenticity
 */
async function verifySkill(
  manifest: SkillManifest,
  verificationConfig: VerificationConfig
): Promise<VerificationResult> {
  const checks: VerificationCheck[] = [];

  // 1. Signature verification
  if (verificationConfig.requireSignature) {
    const signatureValid = await verifySignature(manifest, verificationConfig.publicKey);
    checks.push({
      name: 'signature',
      passed: signatureValid,
      message: signatureValid ? 'Signature valid' : 'Invalid or missing signature',
    });
  }

  // 2. Checksum verification
  const checksumValid = await verifyChecksum(manifest);
  checks.push({
    name: 'checksum',
    passed: checksumValid,
    message: checksumValid ? 'Checksum valid' : 'Checksum mismatch',
  });

  // 3. Permission audit
  const permissionsOk = auditPermissions(manifest.permissions);
  checks.push({
    name: 'permissions',
    passed: permissionsOk,
    message: permissionsOk ? 'Permissions acceptable' : 'Excessive permissions requested',
  });

  // 4. Dependency safety
  const depsOk = await checkDependencySafety(manifest.dependencies);
  checks.push({
    name: 'dependencies',
    passed: depsOk,
    message: depsOk ? 'Dependencies verified' : 'Unsafe dependencies detected',
  });

  return {
    skillId: manifest.id,
    version: manifest.version,
    checks,
    passed: checks.every((c) => c.passed),
    riskLevel: calculateRiskLevel(checks),
  };
}
```

---

## Summary

This progressive skill loading architecture provides:

1. **Efficient Context Usage**: Only ~2,500 tokens for 50 skill summaries (Level 1)
2. **On-Demand Loading**: Instructions loaded only when needed (~500 tokens each)
3. **Unlimited Resources**: Large resources loaded only during execution
4. **Memory Integration**: Seamless connection to three-tier memory system
5. **Version Safety**: Semantic versioning with graceful degradation
6. **Performance**: Predictive preloading and intelligent caching
7. **Security**: Sandboxing, verification, and permission controls

The system is production-ready and can scale to hundreds of skills while maintaining fast response times and efficient token usage.
