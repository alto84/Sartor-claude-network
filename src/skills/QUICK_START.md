# Skill Runtime Quick Start

## Installation

```bash
cd /home/user/Sartor-claude-network
npm install  # or yarn install
```

## Basic Usage (3 Steps)

### 1. Import

```typescript
import { SkillRuntime, SKILL_MANIFESTS } from './src/skills';
```

### 2. Initialize

```typescript
const runtime = new SkillRuntime();
await runtime.initialize();

// Register all skills
for (const manifest of SKILL_MANIFESTS) {
  await runtime.registerSkill(manifest);
}
```

### 3. Execute

```typescript
const result = await runtime.executeSkill('evidence-based-validation', {
  claim: 'Your claim here',
  evidenceLevel: 'high',
});

console.log(result);
```

## Common Patterns

### Validate a Technical Claim

```typescript
const result = await runtime.executeSkill('evidence-based-validation', {
  claim: 'Firebase RTDB is faster than Firestore for real-time updates',
  context: 'Building a chat app with 1000+ users',
  evidenceLevel: 'high',
});

if (result.success && result.data.validated) {
  console.log('Claim is supported by evidence!');
  console.log('Confidence:', result.data.confidence);
}
```

### Make an Engineering Decision

```typescript
const result = await runtime.executeSkill('evidence-based-engineering', {
  problem: 'Choose between REST and GraphQL for our API',
  requirements: {
    flexibility: 'high',
    performance: 'critical',
    clientTypes: ['web', 'mobile'],
  },
  alternatives: ['REST', 'GraphQL', 'gRPC'],
});

console.log('Recommendation:', result.data.recommendation);
console.log('Tradeoffs:', result.data.tradeoffs);
```

### Check Skill Status

```typescript
const status = runtime.getSkillStatus('evidence-based-validation');
console.log(status);
// {
//   skillId: 'evidence-based-validation',
//   state: 'ready',
//   executionCount: 5,
//   errorCount: 0,
//   averageExecutionMs: 150
// }
```

### Get Statistics

```typescript
const stats = runtime.getStatistics();
console.log(stats);
// {
//   totalSkills: 2,
//   loadedSkills: 2,
//   activeSkills: 1,
//   totalExecutions: 10,
//   totalErrors: 0
// }
```

## Available Skills

### evidence-based-validation

**When to use:** Need to validate a claim or verify facts  
**Input:** claim, context, evidenceLevel  
**Output:** validated, confidence, evidence, conclusion

### evidence-based-engineering

**When to use:** Making technical decisions or choosing between alternatives  
**Input:** problem, requirements, constraints, alternatives  
**Output:** recommendation, evaluation, tradeoffs, evidence

## Quick Reference

### SkillRuntime Methods

| Method                                   | Description               |
| ---------------------------------------- | ------------------------- |
| `initialize()`                           | Initialize runtime        |
| `registerSkill(manifest)`                | Register a skill          |
| `loadSkill(skillId, options?)`           | Load Level 2 instructions |
| `executeSkill(skillId, input, options?)` | Execute a skill           |
| `listSkills()`                           | List all skills           |
| `getSkillStatus(skillId)`                | Get skill status          |
| `getSummaries()`                         | Get Level 1 summaries     |
| `unloadSkill(skillId)`                   | Unload Level 2            |
| `getStatistics()`                        | Get runtime stats         |

### Execution Options

```typescript
{
  timeout?: number;           // Execution timeout (ms)
  retryOnFailure?: boolean;   // Retry on error
  maxRetries?: number;        // Max retry attempts
  validateInput?: boolean;    // Validate before execution
  trackMetrics?: boolean;     // Track performance metrics
}
```

### Loader Options

```typescript
{
  preloadDependencies?: boolean;  // Load dependencies
  cacheInstructions?: boolean;    // Cache Level 2
  maxConcurrentLoads?: number;    // Concurrent load limit
  timeout?: number;               // Load timeout (ms)
}
```

## Testing

Run the example:

```bash
npx ts-node src/skills/example.ts
```

Or compile and run:

```bash
npx tsc src/skills/example.ts
node src/skills/example.js
```

## Error Handling

```typescript
try {
  const result = await runtime.executeSkill(skillId, input);

  if (!result.success) {
    console.error('Execution failed:', result.error);
    // result.error.code
    // result.error.message
    // result.error.recoverable
  }
} catch (error) {
  console.error('Runtime error:', error);
}
```

## Performance Tips

1. **Preload frequently used skills** during initialization
2. **Enable caching** for repeated executions
3. **Unload unused skills** to free memory
4. **Monitor metrics** to identify bottlenecks
5. **Batch register** skills at startup

## Debugging

Enable debug logging:

```typescript
// The runtime logs to console automatically
// Look for lines starting with [SkillRuntime]
```

Check skill state:

```typescript
const summaries = runtime.getSummaries();
console.log('Registered skills:', Array.from(summaries.keys()));

const status = runtime.getSkillStatus(skillId);
console.log('Current state:', status.state);
```

## Token Usage

| Level               | Per Skill   | Both Skills  |
| ------------------- | ----------- | ------------ |
| Level 1 (Always)    | ~50 tokens  | 94 tokens    |
| Level 2 (On-demand) | ~500 tokens | 1,030 tokens |
| Level 3 (Lazy)      | N/A         | N/A          |

## Next Steps

1. Read `/src/skills/README.md` for detailed documentation
2. Review `/src/skills/IMPLEMENTATION.md` for architecture
3. Explore `/src/skills/example.ts` for more examples
4. Check `/SKILL_LOADING.md` for loading protocol details

## Support

- Documentation: `/src/skills/README.md`
- Examples: `/src/skills/example.ts`
- Types: `/skill-types.ts`
- Architecture: `/SKILL_LOADING.md`
