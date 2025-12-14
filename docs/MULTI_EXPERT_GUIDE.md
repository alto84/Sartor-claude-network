# Multi-Expert System Guide

## Overview

The Multi-Expert System enables parallel execution of specialized AI experts to solve high-stakes tasks that benefit from diverse perspectives and approaches. Multiple expert configurations run concurrently, producing different solutions that are scored, compared, and voted on to select the best outcome.

### When to Use Multi-Expert

Use the multi-expert system for:

- **High-stakes decisions** - Critical tasks where correctness matters more than speed
- **Complex problems** - Tasks with multiple valid approaches or trade-offs
- **Novel challenges** - Problems where the optimal strategy is unclear
- **Quality-critical work** - Code generation, analysis, or design requiring high confidence

**Do NOT use for:**

- Simple, well-defined tasks with one clear solution
- Time-sensitive operations where speed trumps quality
- Resource-constrained environments (multi-expert consumes more API calls)

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Orchestrator                        │
│         (Top-level coordination pipeline)            │
├─────────────────────────────────────────────────────┤
│  1. Memory Context Retrieval (past solutions)       │
│  2. Expert Pool Creation (diverse archetypes)       │
│  3. Parallel Execution (timeout enforcement)        │
│  4. Scoring & Diversity Evaluation                  │
│  5. Voting for Consensus                            │
│  6. Feedback Collection & Refinement                │
│  7. Memory Storage (learning)                       │
├─────────────────────────────────────────────────────┤
│  Execution Engine  │  Voting System  │  Scoring     │
│  Expert Config     │  Diversity      │  Feedback    │
│  Memory Integration│  Rate Limiter   │  Sandbox     │
└─────────────────────────────────────────────────────┘
```

## Components

### 1. Orchestrator (`orchestrator.ts`)

**Purpose:** Top-level coordinator that integrates all multi-expert components into a unified pipeline.

**Key Functions:**

- `execute(task)` - Run full orchestration pipeline
- `executeWithExperts(task, experts)` - Use custom expert configurations
- `quickExecute(task)` - Fast execution without full pipeline

**Interfaces:**

```typescript
interface OrchestratorConfig {
  expertCount: number;
  archetypes: ExpertArchetype[];
  useMemory: boolean;
  useFeedbackLoop: boolean;
  targetScore: number;
  maxFeedbackIterations: number;
  useVoting: boolean;
  votingMethod: 'majority' | 'ranked-choice' | 'borda' | 'weighted';
  useDiversitySelection: boolean;
  diverseResultCount: number;
  maxConcurrent: number;
  timeout: number;
}
```

### 2. Execution Engine (`execution-engine.ts`)

**Purpose:** Spawns N configurable experts in parallel, distributes tasks, and collects results with timeout enforcement.

**Key Features:**

- Parallel expert execution with configurable concurrency
- Timeout enforcement at task and global levels
- Retry logic with iteration support
- Execution trace capture for debugging

**Interfaces:**

```typescript
interface ExpertTask {
  id: string;
  description: string;
  type: string;
  input: unknown;
  context?: Record<string, unknown>;
  priority?: number;
  deadline?: number;
}

interface ExpertResult {
  expertId: string;
  expertConfig: ExpertConfig;
  taskId: string;
  success: boolean;
  output: unknown;
  confidence: number;
  score: number;
  iterations: number;
  durationMs: number;
  error?: string;
  trace?: ExecutionTrace;
}
```

### 3. Expert Configuration (`expert-config.ts`)

**Purpose:** Defines parameterized expert configurations with 18+ configurable parameters for diverse problem-solving strategies.

**Expert Archetypes:**

- **Performance** - Optimizes for speed and efficiency (low temperature, fewer iterations)
- **Safety** - Prioritizes correctness and error handling (high confidence threshold)
- **Simplicity** - Favors clear, maintainable solutions (conservative strategy)
- **Robustness** - Handles edge cases and failures gracefully (more retries)
- **Creative** - Explores unconventional approaches (high temperature)
- **Balanced** - Default balanced approach (moderate settings)

**Key Parameters:**

```typescript
interface ExpertConfig {
  // Identity
  id: string;
  name: string;
  archetype: ExpertArchetype;
  strategy: 'analytical' | 'exploratory' | 'conservative' | 'aggressive';

  // Iteration Control
  maxIterations: number;
  minIterations: number;

  // Randomness
  temperature: number; // 0.0 = deterministic, 1.0 = creative
  seed?: number;

  // Timeouts
  taskTimeout: number;
  totalTimeout: number;

  // Quality Thresholds
  confidenceThreshold: number;
  satisfactionThreshold: number;

  // Voting Weight
  votingWeight: number;
}
```

### 4. Voting System (`voting-system.ts`)

**Purpose:** Implements multiple voting strategies for expert consensus.

**Voting Methods:**

- **Majority** - Simple plurality (most first-choice votes wins)
- **Ranked-Choice** - Instant runoff voting (eliminates losers iteratively)
- **Borda Count** - Positional scoring (points based on ranking)
- **Weighted** - Combines vote weight and confidence

**Tie-Breaking:**

- Random selection
- First-come-first-serve
- Highest confidence

### 5. Diversity Scorer (`diversity-scorer.ts`)

**Purpose:** Evaluates solution diversity to promote varied approaches and prevent groupthink.

**Scoring Dimensions:**

- **Archetype Diversity** - How unique is this expert's archetype?
- **Output Uniqueness** - How different is the solution output?
- **Novelty** - How different from previously seen solutions?

**Key Functions:**

```typescript
interface DiversityScore {
  score: number; // Overall diversity (0-100)
  archetypeScore: number; // Archetype uniqueness
  similarityScore: number; // Output similarity (lower = more unique)
  noveltyScore: number; // Novelty vs seen solutions
  breakdown: DiversityBreakdown;
}
```

### 6. Soft Scorer (`soft-scorer.ts`)

**Purpose:** Implements 0-100 soft scoring with partial credit and multi-dimensional evaluation.

**Scoring Dimensions:**

- **Correctness** - How correct is the solution?
- **Completeness** - Are all requirements met?
- **Quality** - Is the solution high quality?
- **Efficiency** - How efficient was the process?

**Phase 6 Enhancements:**

- Multi-dimensional scoring with evidence tracking
- Confidence intervals for statistical rigor
- No fabrication - all scores derived from measured data
- Configurable dimension weights

**Anti-Fabrication Compliance:**

```typescript
// All scores include evidence array with specific data points
interface DimensionScore {
  dimension: ScoreDimension;
  score: number;
  confidence: number;
  evidence: string[]; // REQUIRED - no fabrication!
}
```

### 7. Feedback Loop (`feedback-loop.ts`)

**Purpose:** Integrates iterative refinement with multi-expert execution through structured feedback collection and application.

**Feedback Sources:**

- Validator - Automated validation
- Scorer - Soft scorer analysis
- Expert - Cross-expert feedback
- Oracle - Ground truth comparison
- User - Human feedback
- Self - Self-assessment

**Severity Levels:**

- Critical - Must fix
- Major - Should fix
- Minor - Nice to fix
- Suggestion - Optional improvement

### 8. Memory Integration (`memory-integration.ts`)

**Purpose:** Connects expert execution with the memory system to enable learning from past executions.

**Memory Types:**

- **Solution** - Successful solutions
- **Failure** - Failed attempts (for learning)
- **Pattern** - Recognized patterns
- **Feedback** - Feedback received
- **Performance** - Expert performance metrics

**Key Functions:**

- Store expert results
- Retrieve relevant past solutions
- Track expert performance over time
- Pattern-based solution lookup

### 9. Sandbox (`sandbox.ts`)

**Purpose:** Provides isolated execution contexts with resource limits and safe failure handling.

**Features:**

- Resource limits (CPU, memory, time)
- Crash isolation
- Execution trace capture
- Multiple isolation strategies

### 10. Rate Limiter (`rate-limiter.ts`)

**Purpose:** Implements token bucket algorithm to prevent API throttling during parallel execution.

**Features:**

- Token bucket rate limiting
- Priority-based request scheduling
- Cost tracking across experts
- Budget enforcement
- Queue management

## Usage Examples

### Basic Setup

```typescript
import { Orchestrator, createMockExecutor } from './multi-expert';

// Create orchestrator with default settings
const orchestrator = new Orchestrator(createMockExecutor());

// Define task
const task = {
  id: 'task-001',
  description: 'Implement user authentication',
  type: 'code-generation',
  input: {
    requirements: ['JWT tokens', 'email verification', 'password reset'],
  },
};

// Execute with multi-expert
const result = await orchestrator.execute(task);

console.log('Winner:', result.winner);
console.log('Score:', result.winnerScore);
console.log('Consensus:', result.votingResult);
```

### Custom Expert Configuration

```typescript
import { createExpertPool, Orchestrator } from './multi-expert';

// Create diverse expert pool
const experts = createExpertPool('custom-task', ['performance', 'safety', 'creative']);

// Execute with custom experts
const result = await orchestrator.executeWithExperts(task, experts);
```

### Advanced Configuration

```typescript
import { Orchestrator, createMockExecutor } from './multi-expert';

const orchestrator = new Orchestrator(createMockExecutor(), {
  expertCount: 7,
  archetypes: [
    'performance',
    'safety',
    'simplicity',
    'robustness',
    'creative',
    'balanced',
    'balanced',
  ],
  useMemory: true,
  useFeedbackLoop: true,
  targetScore: 90,
  maxFeedbackIterations: 5,
  useVoting: true,
  votingMethod: 'weighted',
  useDiversitySelection: true,
  diverseResultCount: 3,
  maxConcurrent: 5,
  timeout: 600000, // 10 minutes
});
```

### With Rate Limiting

```typescript
const orchestrator = new Orchestrator(createMockExecutor(), {
  useRateLimiter: true,
  rateLimitConfig: {
    tokensPerSecond: 500,
    maxBurst: 2000,
    maxQueueSize: 50,
  },
});
```

### With Sandboxed Execution

```typescript
const orchestrator = new Orchestrator(createMockExecutor(), {
  useSandbox: true,
  sandboxConfig: {
    limits: {
      maxMemoryMB: 256,
      maxTimeMs: 30000,
      maxCpuPercent: 70,
    },
    captureTrace: true,
    isolateErrors: true,
  },
});
```

### Accessing Results

```typescript
// Execute
const result = await orchestrator.execute(task);

// Best result
console.log('Winner:', result.winner.output);
console.log('Expert:', result.winner.expertConfig.name);
console.log('Archetype:', result.winner.expertConfig.archetype);

// Scored results (ranked)
for (const { result: r, score } of result.scoredResults.slice(0, 3)) {
  console.log(`${r.expertId}: ${score.overall} (${score.confidence})`);
}

// Diversity
console.log('Diverse solutions:', result.diverseResults.length);
console.log('Pool diversity:', result.diversityScore);

// Voting
if (result.votingResult) {
  console.log('Consensus level:', result.votingResult.consensusLevel);
  console.log('Vote counts:', result.votingResult.voteCounts);
}

// Pool statistics
console.log('Average score:', result.poolStats.avgScore);
console.log('Pass rate:', result.poolStats.passRate);
console.log('Excellent rate:', result.poolStats.excellentRate);

// Metadata
console.log('Total time:', result.totalDurationMs, 'ms');
console.log('Target reached:', result.metadata.targetReached);
```

## Configuration Reference

### Expert Archetypes

| Archetype       | Temperature | Max Iterations | Strategy     | Best For                   |
| --------------- | ----------- | -------------- | ------------ | -------------------------- |
| **Performance** | 0.3         | 2              | Aggressive   | Speed-critical tasks       |
| **Safety**      | 0.2         | 5              | Conservative | Correctness-critical tasks |
| **Simplicity**  | 0.4         | 3              | Conservative | Maintainability            |
| **Robustness**  | 0.4         | 4              | Analytical   | Edge case handling         |
| **Creative**    | 0.8         | 4              | Exploratory  | Novel problems             |
| **Balanced**    | 0.5         | 3              | Analytical   | General use                |

### Scoring Dimensions

| Dimension       | Weight | Evidence Sources                           |
| --------------- | ------ | ------------------------------------------ |
| **Quality**     | 30%    | Expert confidence, iterations, errors      |
| **Safety**      | 20%    | Success status, errors, timeout compliance |
| **Efficiency**  | 20%    | Duration vs timeout, iterations used       |
| **Correctness** | 20%    | Result score, expert confidence            |
| **Readability** | 10%    | Output structure, documentation            |

### Voting Strategies

| Method            | Description        | Use When                           |
| ----------------- | ------------------ | ---------------------------------- |
| **Majority**      | Simple plurality   | Quick decisions, clear preferences |
| **Ranked-Choice** | Instant runoff     | Avoiding vote splitting            |
| **Borda Count**   | Positional scoring | Valuing consensus                  |
| **Weighted**      | By confidence      | Trusting expert confidence         |

## Best Practices

### When to Use Multi-Expert vs Single

**Use Multi-Expert:**

- High-stakes decisions (production code, critical analysis)
- Complex problems with multiple approaches
- Need for diverse perspectives
- Quality matters more than speed
- Budget allows for parallel API calls

**Use Single Expert:**

- Simple, well-defined tasks
- Time-sensitive operations
- Resource-constrained environments
- Prototyping or exploration
- Low-stakes decisions

### Resource Management

**Optimize Concurrency:**

```typescript
// Low-resource environment
const config = {
  expertCount: 3,
  maxConcurrent: 2,
  timeout: 60000,
};

// High-resource environment
const config = {
  expertCount: 10,
  maxConcurrent: 10,
  timeout: 300000,
};
```

**Enable Rate Limiting:**

```typescript
// Prevent API throttling
const config = {
  useRateLimiter: true,
  rateLimitConfig: {
    tokensPerSecond: 1000, // Adjust to your API limits
    maxBurst: 5000,
  },
};
```

**Use Memory Wisely:**

```typescript
// Enable memory for learning
const config = {
  useMemory: true,
  // Memory will store solutions and track performance
};

// Disable for one-off tasks
const config = {
  useMemory: false,
};
```

### Error Handling

**Graceful Degradation:**

```typescript
try {
  const result = await orchestrator.execute(task);

  if (!result.winner) {
    console.error('No successful experts!');
    // Fallback strategy
  }

  if (result.metadata.targetReached) {
    // High confidence in result
  } else {
    // Consider manual review
  }
} catch (error) {
  console.error('Orchestration failed:', error);
  // Fallback to single expert or manual approach
}
```

**Check Quality Metrics:**

```typescript
const result = await orchestrator.execute(task);

// Validate consensus
if (result.votingResult && result.votingResult.consensusLevel < 0.5) {
  console.warn('Low consensus - experts disagree!');
  // Review diverse solutions manually
}

// Validate confidence
if (result.winnerScore.overall < 70) {
  console.warn('Low quality score - review needed');
}

// Check pool performance
if (result.poolStats.passRate < 50) {
  console.warn('Less than half of experts succeeded!');
}
```

**Monitor Resource Usage:**

```typescript
// Check rate limiter
const rateLimiter = orchestrator.getRateLimiter();
if (rateLimiter) {
  const stats = rateLimiter.getStats();
  console.log('Dropped requests:', stats.droppedRequests);
  console.log('Average wait:', stats.averageWaitTime);
}

// Check sandbox usage
const sandbox = orchestrator.getSandboxManager();
if (sandbox) {
  const stats = sandbox.getStats();
  console.log('Active sandboxes:', stats.activeCount);
  console.log('Timeout errors:', stats.timeoutErrors);
}
```

### Cleanup

**Always cleanup after execution:**

```typescript
const orchestrator = new Orchestrator(executor);

try {
  const result = await orchestrator.execute(task);
  // Use result...
} finally {
  // Cleanup sandboxes, rate limiters, etc.
  orchestrator.cleanup();
}
```

## Performance Considerations

### Execution Time

Multi-expert execution time = `max(expert_durations) + overhead`

**Overhead includes:**

- Expert pool creation: ~10-50ms
- Scoring all results: ~50-200ms
- Voting: ~10-50ms
- Memory storage: ~50-200ms

**Total overhead:** ~120-500ms

### API Costs

**Token consumption:** `expertCount * avgTokensPerExpert`

Example with 5 experts averaging 2000 tokens each:

- Total: 10,000 tokens
- Cost (GPT-4): ~$0.30 per execution

**Use cost tracking:**

```typescript
import { createCostTracker } from './multi-expert';

const costTracker = createCostTracker(10.0); // $10 budget

// Track each expert
costTracker.trackCost('expert-1', 2000, 0.06);

// Check budget
if (costTracker.isOverBudget()) {
  console.warn('Over budget!');
}

console.log('Total cost:', costTracker.getTotalCost());
console.log('Total tokens:', costTracker.getTotalTokens());
```

### Memory Usage

**In-memory storage:**

- Each expert result: ~1-10KB
- Execution trace: ~5-50KB
- Total for 5 experts: ~30-300KB

**Memory integration:**

- Stored memories: unlimited (persisted to disk/DB)
- Performance cache: ~100KB per 100 experts

## Troubleshooting

### Common Issues

**Issue: All experts timeout**

```typescript
// Solution: Increase timeout or reduce task complexity
const config = {
  timeout: 600000, // Increase to 10 minutes
  expertCount: 3, // Reduce expert count
};
```

**Issue: Low consensus**

```typescript
// Solution: Use more similar experts or adjust voting
const config = {
  archetypes: ['balanced', 'balanced', 'balanced'], // More similar
  votingMethod: 'borda', // Values consensus over plurality
};
```

**Issue: Poor quality scores**

```typescript
// Solution: Adjust expert configurations
const config = {
  archetypes: ['safety', 'safety', 'robustness'], // Quality-focused
  targetScore: 85, // Raise quality bar
  useFeedbackLoop: true, // Enable refinement
  maxFeedbackIterations: 5,
};
```

**Issue: High API costs**

```typescript
// Solution: Enable rate limiting and reduce expert count
const config = {
  expertCount: 3, // Reduce from default 5
  useRateLimiter: true,
  rateLimitConfig: {
    tokensPerSecond: 500, // Slow down requests
  },
};
```

## File Paths Reference

All multi-expert components are located in:

- `/home/alton/Sartor-claude-network/src/multi-expert/`

**Core Files:**

- `orchestrator.ts` - Top-level coordinator
- `execution-engine.ts` - Parallel expert execution
- `expert-config.ts` - Expert archetypes and configuration
- `voting-system.ts` - Consensus mechanisms
- `diversity-scorer.ts` - Solution diversity scoring
- `soft-scorer.ts` - Multi-dimensional scoring
- `feedback-loop.ts` - Iterative refinement
- `memory-integration.ts` - Memory system integration
- `sandbox.ts` - Isolated execution
- `rate-limiter.ts` - API rate limiting
- `index.ts` - Module exports

**Tests:**

- `__tests__/` - Component tests

## Next Steps

1. **Start Simple:** Use default orchestrator configuration
2. **Measure Performance:** Track execution time and API costs
3. **Tune Configuration:** Adjust expert count, archetypes, and voting
4. **Enable Features:** Add feedback loops, memory, sandboxing as needed
5. **Monitor Quality:** Check consensus, scores, and pool statistics
6. **Optimize:** Balance quality, speed, and cost for your use case

## Related Documentation

- `/home/alton/Sartor-claude-network/docs/ARCHITECTURE.md` - System architecture
- `/home/alton/Sartor-claude-network/docs/REFINEMENT_PATTERNS.md` - Refinement patterns
- `/home/alton/Sartor-claude-network/docs/MEMORY_SYSTEM_SPEC.md` - Memory system
- `/home/alton/Sartor-claude-network/CLAUDE.md` - Project context
