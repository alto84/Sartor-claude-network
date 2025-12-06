# Progressive Skill Loading - Quick Start Guide

Get your dynamic skills library up and running in minutes.

## Table of Contents

1. [Installation](#installation)
2. [5-Minute Setup](#5-minute-setup)
3. [Creating Your First Skill](#creating-your-first-skill)
4. [Loading and Using Skills](#loading-and-using-skills)
5. [Integration with Memory System](#integration-with-memory-system)
6. [Common Patterns](#common-patterns)

---

## Installation

```bash
# 1. Install dependencies
npm install yaml semver

# 2. Create directory structure
mkdir -p skills/{manifests,instructions,resources}
mkdir -p skills/instructions/{executive,specialist,utility}
mkdir -p skills/resources/{docs,templates,schemas,data,examples}

# 3. Copy type definitions
cp skill-types.ts src/types/
```

---

## 5-Minute Setup

### Step 1: Initialize the Skill System

```typescript
import { initializeSkillSystem } from './skills';
import { MemorySystem } from './memory-system';

// Assuming you have a memory system instance
const memorySystem = new MemorySystem(/* config */);

// Initialize skills
const skillSystem = await initializeSkillSystem({
  sessionId: 'session_123',
  userId: 'user_456',
  modelId: 'claude-sonnet-4-5',
  memorySystem
});

console.log('Skills loaded:', skillSystem.context.level1Summaries.size);
```

### Step 2: Register Your First Skill

Create `skills/manifests/hello-world.yaml`:

```yaml
---
id: hello-world
name: Hello World
version: 1.0.0

summary: >
  A simple greeting skill that demonstrates the skill system.

triggers:
  - type: keyword
    pattern: "hello|hi|greet"
    confidence: 0.8
    priority: 10

tier: utility

dependencies: []
conflicts: []
alternatives: []

metadata:
  author: Your Name
  created: "2025-12-06"
  updated: "2025-12-06"
  status: stable
  tags:
    - greeting
    - example
  category: communication

  modelCompatibility:
    - modelId: "claude-sonnet-4-5"
      degradationStrategy: limited

  estimatedTokens:
    level1: 45
    level2: 300
    level3Avg: 0

performance:
  averageExecutionMs: 100
  successRate: 1.0
  executionCount: 0
  failureCount: 0

memory:
  stateRetention: none
  cacheStrategy:
    type: lru
    maxSize: 1048576
  maxStateSize: 0
```

### Step 3: Create Instructions

Create `skills/instructions/utility/hello-world.md`:

```markdown
# Hello World Skill v1.0.0

## Description
A simple greeting skill that responds with personalized greetings.

## When to Use
- User says "hello", "hi", or similar greetings
- Start of conversation
- User requests a greeting

## Input Specification
```typescript
interface HelloWorldInput {
  name?: string;        // User's name (optional)
  language?: string;    // Language for greeting (default: "en")
  formal?: boolean;     // Formal vs casual (default: false)
}
```

## Output Specification
```typescript
interface HelloWorldOutput {
  greeting: string;     // The greeting message
  timestamp: string;    // ISO timestamp
}
```

## Execution Steps
1. Get user's name from input or context
2. Determine appropriate greeting based on formality
3. Localize greeting if language specified
4. Return formatted greeting

## Examples

### Example 1: Simple Greeting
```typescript
const output = await executeSkill('hello-world', {});
// { greeting: "Hello! How can I help you today?", timestamp: "..." }
```

### Example 2: Personalized Greeting
```typescript
const output = await executeSkill('hello-world', {
  name: "Alice",
  formal: true
});
// { greeting: "Good day, Alice. How may I assist you?", timestamp: "..." }
```

## Error Handling
This skill has no failure modes - it always succeeds.

## Performance Notes
- Execution time: <100ms
- Memory usage: Minimal
- No external dependencies
```

### Step 4: Use the Skill

```typescript
import { SkillExecutor } from './skills/executor';

const executor = new SkillExecutor(skillSystem.context);

// Execute the skill
const result = await executor.execute('hello-world', {
  parameters: {
    name: 'Alice',
    formal: false
  }
});

console.log(result.result.greeting);
// Output: "Hi Alice! How can I help you today?"
```

---

## Creating Your First Skill

### Pattern: Data Analysis Skill

```yaml
# skills/manifests/data-analyzer.yaml
---
id: data-analyzer
name: Data Analyzer
version: 1.0.0

summary: >
  Analyzes datasets with statistical methods and creates visualizations.

triggers:
  - type: keyword
    pattern: "analyze|statistics|data|trends"
    confidence: 0.75
    priority: 8

  - type: semantic
    pattern: "I want to understand my data"
    confidence: 0.70
    priority: 5

tier: specialist

dependencies:
  - skillId: python-executor
    version: "^3.0.0"
    required: true
    loadTiming: eager

metadata:
  category: data
  status: stable
  estimatedTokens:
    level1: 50
    level2: 520
    level3Avg: 2400
```

### Instructions Template

```markdown
# {{Skill Name}} v{{version}}

## Description
{{1-2 paragraph description}}

## When to Use
**Triggers:**
- {{trigger pattern 1}}
- {{trigger pattern 2}}

**Applicable To:**
- {{use case 1}}
- {{use case 2}}

**Not Applicable To:**
- {{anti-pattern 1}}
- {{anti-pattern 2}}

## Input Specification
```typescript
interface {{SkillName}}Input {
  // Define inputs
}
```

## Output Specification
```typescript
interface {{SkillName}}Output {
  // Define outputs
}
```

## Execution Steps
1. {{Step 1}}
2. {{Step 2}}
3. {{Step 3}}

## Examples

### Example 1: {{Use Case}}
```typescript
const output = await executeSkill('{{skill-id}}', {
  // input
});
// expected output
```

## Error Handling

### Common Errors
1. **{{Error Type}}**
   - Cause: {{cause}}
   - Recovery: {{recovery strategy}}

## Performance Notes
- Typical execution: {{time}}
- Memory usage: {{memory}}
```

---

## Loading and Using Skills

### Automatic Loading

```typescript
// Skills are loaded progressively:

// 1. Level 1 (Summaries) - Loaded at init
const summaries = skillSystem.context.level1Summaries;
console.log('Available skills:', Array.from(summaries.keys()));

// 2. Level 2 (Instructions) - Loaded on trigger
const userInput = "Can you analyze this data?";
const matches = await matchTriggers(userInput, skillSystem.context);

for (const match of matches) {
  // Automatically loads Level 2 if not loaded
  await skillSystem.loader.loadLevel2(match.skillId);
}

// 3. Level 3 (Resources) - Loaded during execution
const resources = await skillSystem.loader.loadLevel3(
  'data-analyzer',
  ['templates/analysis.py', 'schemas/data.json']
);
```

### Manual Loading

```typescript
// Preload skills you know you'll need
await skillSystem.loader.preload([
  'data-analyzer',
  'code-executor',
  'chart-renderer'
]);

// Check what's loaded
const loadedSkills = await skillSystem.loader.getLoadedSkills();
console.log('Loaded:', loadedSkills.length);

// Check token usage
const tokenUsage = await skillSystem.loader.getTokenUsage();
console.log('Token utilization:', tokenUsage.utilizationPercent + '%');
```

### Unloading Skills

```typescript
// Free up context space
await skillSystem.loader.unload('data-analyzer', 2); // Unload Level 2

// Or unload completely from context
await skillSystem.context.unloadSkill('data-analyzer');
```

---

## Integration with Memory System

### Hot Memory: Active Skill State

```typescript
// Store skill state in hot memory (session-scoped)
await skillSystem.context.memory.hot.set(
  `skill:state:data-analyzer`,
  {
    lastDataset: 'sales_2025.csv',
    analysisType: 'exploratory',
    results: { /* ... */ }
  },
  3600000 // 1 hour TTL
);

// Retrieve skill state
const state = await skillSystem.context.memory.hot.get(
  `skill:state:data-analyzer`
);
```

### Warm Memory: Usage Patterns

```typescript
// Record skill usage for pattern learning
await skillSystem.memory.recordUsagePattern('data-analyzer', {
  skillId: 'data-analyzer',
  trigger: triggerMatch,
  success: true,
  executionMs: 3500
});

// Query usage patterns for prediction
const patterns = await skillSystem.context.memory.warm.getUserPatterns(
  'user_456'
);

console.log('User frequently uses:',
  patterns.map(p => p.skillId)
);
```

### Cold Memory: Skill Manifests

```typescript
// Skill manifests are stored in GitHub
// Loaded once at initialization, then cached

// Backup skill state to cold storage
await skillSystem.context.memory.cold.backup(
  'skills/data-analyzer/state-backup.json',
  skillState
);
```

---

## Common Patterns

### Pattern 1: Predictive Preloading

```typescript
/**
 * Predict and preload likely skills based on user history
 */
async function setupSession(userId: string) {
  const skillSystem = await initializeSkillSystem({
    sessionId: generateSessionId(),
    userId,
    modelId: 'claude-sonnet-4-5',
    memorySystem
  });

  // Get predictions from memory
  const predictions = await skillSystem.memory.predictLikelySkills({
    userId,
    sessionId: skillSystem.context.sessionId,
    preferences: {
      autoLoadPredicted: true,
      maxActiveSkills: 5,
      preferredTiers: ['specialist', 'utility'],
      verbosityLevel: 'normal'
    },
    history: {
      recentSkills: [],
      favoriteSkills: [],
      bannedSkills: []
    }
  });

  // Preload top 3 predictions
  const topSkills = predictions
    .slice(0, 3)
    .map(p => p.skillId);

  await skillSystem.loader.preload(topSkills);

  console.log('Preloaded skills:', topSkills);

  return skillSystem;
}
```

### Pattern 2: Dynamic Skill Chaining

```typescript
/**
 * Execute skills with automatic dependency resolution
 */
async function executeWithDependencies(
  skillId: string,
  input: any,
  context: SkillExecutionContext
) {
  // Get skill manifest
  const manifest = await context.registry.getSkill(skillId);

  // Load dependencies first
  for (const dep of manifest.dependencies) {
    if (dep.required && !context.activeSkills.has(dep.skillId)) {
      await context.loader.loadLevel2(dep.skillId);
    }
  }

  // Execute main skill
  const executor = new SkillExecutor(context);
  return await executor.execute(skillId, input);
}
```

### Pattern 3: Smart Token Budget Management

```typescript
/**
 * Optimize context usage based on token budget
 */
async function optimizeContext(
  context: SkillExecutionContext,
  targetUtilization: number = 0.70  // 70%
) {
  const usage = context.getTokenUsage();

  if (usage.utilizationPercent > targetUtilization * 100) {
    // Unload low-value skills
    const optimizer = new TokenBudgetOptimizer(
      usage.limit,
      context
    );

    await optimizer.optimize(usage.limit * targetUtilization);

    console.log('Optimized context, freed:',
      usage.total - context.getTokenUsage().total,
      'tokens'
    );
  }
}
```

### Pattern 4: Error Recovery with Fallbacks

```typescript
/**
 * Execute skill with automatic fallback
 */
async function executeWithFallback(
  skillId: string,
  input: any,
  context: SkillExecutionContext
): Promise<SkillOutput> {
  const executor = new SkillExecutor(context);

  try {
    // Try primary skill
    return await executor.execute(skillId, input);

  } catch (error) {
    // Get alternatives from manifest
    const manifest = await context.registry.getSkill(skillId);

    for (const alternativeId of manifest.alternatives) {
      try {
        console.log(`Falling back to ${alternativeId}`);
        return await executor.execute(alternativeId, input);

      } catch (altError) {
        continue;
      }
    }

    // No fallbacks worked
    throw error;
  }
}
```

### Pattern 5: Skill Performance Monitoring

```typescript
/**
 * Monitor and log skill performance
 */
class SkillPerformanceMonitor {
  private metrics = new Map<SkillId, SkillPerformanceMetrics>();

  async recordExecution(
    skillId: SkillId,
    durationMs: number,
    success: boolean
  ) {
    const existing = this.metrics.get(skillId) || {
      skillId,
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      avgDurationMs: 0,
      minDurationMs: Infinity,
      maxDurationMs: 0,
      p50DurationMs: 0,
      p95DurationMs: 0,
      p99DurationMs: 0,
      successRate: 0,
      lastExecutedAt: new Date().toISOString()
    };

    existing.executionCount++;
    if (success) {
      existing.successCount++;
    } else {
      existing.failureCount++;
    }

    existing.successRate = existing.successCount / existing.executionCount;
    existing.avgDurationMs = (
      (existing.avgDurationMs * (existing.executionCount - 1)) + durationMs
    ) / existing.executionCount;

    existing.minDurationMs = Math.min(existing.minDurationMs, durationMs);
    existing.maxDurationMs = Math.max(existing.maxDurationMs, durationMs);
    existing.lastExecutedAt = new Date().toISOString();

    this.metrics.set(skillId, existing);
  }

  getMetrics(skillId: SkillId): SkillPerformanceMetrics | undefined {
    return this.metrics.get(skillId);
  }

  getAllMetrics(): SkillPerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }
}

// Usage
const monitor = new SkillPerformanceMonitor();

const startTime = Date.now();
try {
  const result = await executor.execute('data-analyzer', input);
  await monitor.recordExecution(
    'data-analyzer',
    Date.now() - startTime,
    true
  );
} catch (error) {
  await monitor.recordExecution(
    'data-analyzer',
    Date.now() - startTime,
    false
  );
}
```

### Pattern 6: Version-Aware Skill Loading

```typescript
/**
 * Load skill with version compatibility checking
 */
async function loadCompatibleSkill(
  skillId: string,
  context: SkillExecutionContext
): Promise<SkillManifest | null> {

  const manifest = await context.registry.getSkill(skillId);

  // Check model compatibility
  const compatible = manifest.metadata.modelCompatibility.find(
    m => m.modelId === context.modelId
  );

  if (!compatible) {
    console.warn(`Skill ${skillId} not compatible with ${context.modelId}`);
    return null;
  }

  // Check if we need to handle degradation
  if (compatible.degradationStrategy === 'disable') {
    console.warn(`Skill ${skillId} disabled for this model`);
    return null;
  }

  if (compatible.degradationStrategy === 'limited') {
    console.warn(`Skill ${skillId} running with limited features`);
    // Continue with limited feature set
  }

  // Load the skill
  await context.loader.loadLevel2(skillId);

  return manifest;
}
```

---

## Testing Your Skills

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { SkillExecutor } from './skills/executor';

describe('Hello World Skill', () => {
  let executor: SkillExecutor;

  beforeEach(async () => {
    const skillSystem = await initializeSkillSystem({
      sessionId: 'test_session',
      userId: 'test_user',
      modelId: 'claude-sonnet-4-5',
      memorySystem: mockMemorySystem
    });

    executor = new SkillExecutor(skillSystem.context);
  });

  it('should greet without a name', async () => {
    const result = await executor.execute('hello-world', {
      parameters: {}
    });

    expect(result.success).toBe(true);
    expect(result.result.greeting).toContain('Hello');
  });

  it('should greet with a name', async () => {
    const result = await executor.execute('hello-world', {
      parameters: { name: 'Alice' }
    });

    expect(result.success).toBe(true);
    expect(result.result.greeting).toContain('Alice');
  });

  it('should handle formal greetings', async () => {
    const result = await executor.execute('hello-world', {
      parameters: { name: 'Dr. Smith', formal: true }
    });

    expect(result.success).toBe(true);
    expect(result.result.greeting).toMatch(/Good (day|morning|afternoon)/);
  });
});
```

---

## Next Steps

1. **Read the Full Spec**: Check out [SKILL_LOADING.md](./SKILL_LOADING.md) for complete details
2. **Review Type Definitions**: See [skill-types.ts](./skill-types.ts) for all interfaces
3. **Explore Examples**: Look at example skills in `skills/examples/`
4. **Integrate with Memory**: Connect to the three-tier memory system
5. **Create Custom Skills**: Build skills specific to your use case
6. **Monitor Performance**: Use the metrics system to optimize
7. **Version Management**: Implement auto-update for your skills

## Troubleshooting

### Skills Not Loading

```typescript
// Debug: Check skill registry
const allSkills = await skillSystem.registry.listSkills();
console.log('Registered skills:', allSkills.map(s => s.id));

// Debug: Check file paths
const config = skillSystem.loader.config;
console.log('Paths:', config);
```

### High Token Usage

```typescript
// Debug: Check what's loaded
const usage = skillSystem.context.getTokenUsage();
console.log('Level 1:', usage.level1, 'tokens');
console.log('Level 2:', usage.level2, 'tokens');
console.log('Total:', usage.total, '/', usage.limit);

// Optimize
await optimizeContext(skillSystem.context, 0.60); // 60% target
```

### Trigger Not Matching

```typescript
// Debug: Test trigger matching
const matches = await matchTriggers(
  "analyze this data",
  skillSystem.context
);
console.log('Matches:', matches.map(m => ({
  skill: m.skillId,
  confidence: m.confidence
})));
```

---

## Summary

You now have:
- ✅ Progressive skill loading (3 levels)
- ✅ Memory integration (hot/warm/cold)
- ✅ Version management and compatibility
- ✅ Performance monitoring
- ✅ Error handling and fallbacks
- ✅ Token budget optimization

Start building your dynamic skills library today!
