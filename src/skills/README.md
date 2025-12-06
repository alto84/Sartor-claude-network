# Skill Runtime System

A progressive skill loading and execution system implementing three-level lazy loading for AI agent skills.

## Overview

The Skill Runtime provides a foundation for loading and executing skills during development. It implements the progressive loading architecture defined in `/SKILL_LOADING.md`.

### Three-Level Loading Protocol

1. **Level 1: Summaries** (~50 tokens each)
   - Always loaded in context
   - Skill ID, version, triggers, tier classification
   - Enables rapid skill discovery and matching

2. **Level 2: Instructions** (~500 tokens each)
   - Loaded on-demand when skill is invoked
   - Detailed how-to, parameters, examples
   - Cached for performance

3. **Level 3: Resources** (unlimited size)
   - Loaded only during active execution
   - Reference data, schemas, large examples
   - Streamed or cached as needed

## Architecture

```
src/skills/
├── types.ts              # Core type definitions
├── skill-runtime.ts      # Runtime loader and executor
├── skill-manifest.ts     # Skill manifest definitions
├── index.ts              # Module exports
├── example.ts            # Usage examples
└── README.md             # This file
```

## Available Skills

### Evidence-Based Validation

**ID:** `evidence-based-validation`  
**Version:** 1.0.0  
**Tier:** Specialist

Validates claims and decisions using empirical evidence, research data, and quantitative analysis.

**Triggers:**
- Keywords: validate, verify, evidence, proof, research, study
- Patterns: "is this true", "is that correct"
- Context: questioning assumptions

**Example:**
```typescript
const result = await runtime.executeSkill('evidence-based-validation', {
  claim: 'TypeScript reduces bugs by 15%',
  context: 'Considering TypeScript adoption',
  evidenceLevel: 'high'
});
```

### Evidence-Based Engineering

**ID:** `evidence-based-engineering`  
**Version:** 1.0.0  
**Tier:** Specialist

Applies evidence-based methodology to engineering decisions using benchmarks, case studies, and research.

**Triggers:**
- Keywords: architecture, design, framework, technology choice
- Patterns: "which should I use", "what is the best approach"
- Context: technical decision-making

**Example:**
```typescript
const result = await runtime.executeSkill('evidence-based-engineering', {
  problem: 'Choose database for real-time app',
  requirements: {
    realTime: true,
    scale: '10k users'
  },
  alternatives: ['Firebase RTDB', 'Firestore']
});
```

## Usage

### Basic Usage

```typescript
import { SkillRuntime } from './skills';
import { EVIDENCE_BASED_VALIDATION } from './skills';

// Create runtime
const runtime = new SkillRuntime();

// Initialize
await runtime.initialize();

// Register skills
await runtime.registerSkill(EVIDENCE_BASED_VALIDATION);

// Execute skill
const result = await runtime.executeSkill('evidence-based-validation', {
  claim: 'Some claim to validate',
  evidenceLevel: 'high'
});

console.log(result);
```

### Advanced Usage

```typescript
// Load with options
const manifest = await runtime.loadSkill('evidence-based-validation', {
  preloadDependencies: true,
  cacheInstructions: true,
  timeout: 30000
});

// Execute with options
const result = await runtime.executeSkill('evidence-based-validation', input, {
  timeout: 60000,
  retryOnFailure: true,
  maxRetries: 2,
  validateInput: true,
  trackMetrics: true
});

// Check status
const status = runtime.getSkillStatus('evidence-based-validation');
console.log(status);

// Get statistics
const stats = runtime.getStatistics();
console.log(stats);

// Unload skill
await runtime.unloadSkill('evidence-based-validation');
```

## API Reference

### SkillRuntime

#### `initialize(): Promise<void>`
Initialize the skill runtime and load Level 1 summaries.

#### `registerSkill(manifest: SkillManifest): Promise<void>`
Register a skill with the runtime.

#### `loadSkill(skillId: string, options?: SkillLoaderOptions): Promise<SkillManifest>`
Load a skill's Level 2 instructions.

#### `executeSkill(skillId: string, input: unknown, options?: SkillExecutionOptions): Promise<SkillResult>`
Execute a skill with the given input.

#### `listSkills(): SkillManifest[]`
List all available skills.

#### `getSkillStatus(skillId: string): SkillRuntimeStatus | null`
Get the status of a specific skill.

#### `getSummaries(): Map<string, SkillSummary>`
Get all Level 1 summaries.

#### `unloadSkill(skillId: string): Promise<void>`
Unload a skill's Level 2 instructions from memory.

#### `getStatistics(): RuntimeStatistics`
Get runtime statistics.

## Development

### Running the Example

```bash
# Compile TypeScript
npx tsc src/skills/example.ts

# Run the example
node src/skills/example.js
```

### Creating New Skills

1. Define the manifest in `skill-manifest.ts`:

```typescript
export const MY_NEW_SKILL: SkillManifest = {
  id: 'my-new-skill',
  name: 'My New Skill',
  version: '1.0.0',
  summary: 'Brief description (~50 tokens)',
  triggers: [...],
  tier: SkillTier.SPECIALIST,
  dependencies: [...],
  instructions: {...},
  resources: [...],
  metadata: {...},
  performance: {...},
  memory: {...}
};
```

2. Add to SKILL_MANIFESTS array
3. Register with runtime
4. Execute!

## Design Principles

1. **Progressive Disclosure**: Load only what's needed, when it's needed
2. **Context Efficiency**: Minimize token usage with smart loading
3. **Fast Discovery**: Always-loaded summaries enable rapid skill matching
4. **Memory Integration**: Leverage three-tier memory for state management
5. **Version Resilience**: Graceful degradation across updates

## Future Enhancements

- [ ] Trigger matching engine
- [ ] Dependency resolution and auto-loading
- [ ] Level 3 resource streaming
- [ ] Memory tier integration (hot/warm/cold)
- [ ] Skill versioning and updates
- [ ] Performance profiling
- [ ] Caching optimization
- [ ] Skill validation and verification
- [ ] Semantic search for skill discovery
- [ ] Usage pattern tracking

## References

- `/SKILL_LOADING.md` - Complete loading architecture
- `/skill-types.ts` - Complete type definitions
- `/SARTOR_ARCHITECTURE.md` - Overall system architecture
