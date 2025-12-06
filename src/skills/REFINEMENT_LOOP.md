# Refinement Loop - Core Iterative Refinement Mechanism

## Overview

The Refinement Loop is the **CENTRAL mechanism** for iterative quality improvement in the Sartor architecture. Based on Poetiq's generate-evaluate-refine approach, it provides a standardized way to execute any non-trivial task that requires quality assurance.

**File:** `/home/user/Sartor-claude-network/src/skills/refinement-loop.ts`

## Key Features

### 1. Self-Auditing
Automatically determines when to stop refinement based on:
- Confidence threshold reached
- Maximum iterations exhausted
- Cost budget exceeded
- No significant improvement detected
- Timeout reached

### 2. Process Supervision
Optionally records every step of the refinement process:
- Action taken
- Result produced
- Score achieved
- Reasoning
- Cost incurred

This creates a complete process trace for learning and debugging.

### 3. Cost Awareness
Tracks and respects budget constraints:
- Total cost accumulation
- Remaining budget calculation
- Estimated cost to completion
- Automatic stop when budget exceeded

### 4. Confidence Tracking
Monitors confidence scores across iterations:
- Confidence history tracking
- Improvement delta calculation
- Plateau detection (no improvement)
- Convergence determination

## Core Interfaces

### RefinementConfig
```typescript
interface RefinementConfig {
  maxIterations: number;           // Stop after N iterations
  confidenceThreshold: number;     // Stop when score >= threshold (0-1)
  costBudget?: number;             // Optional cost limit
  processSupervision: boolean;     // Enable process trace recording
  timeout?: number;                // Optional timeout in ms
  minImprovementDelta?: number;    // Minimum improvement required (0-1)
}
```

### Feedback
```typescript
interface Feedback {
  issue: string;                              // What needs improvement
  severity: 'critical' | 'major' | 'minor';  // How important
  suggestion?: string;                        // How to fix
  aspect?: string;                            // Which aspect this relates to
}
```

### EvaluationResult
```typescript
interface EvaluationResult {
  score: number;            // Confidence score (0-1)
  feedback: Feedback[];     // Issues found
  acceptable: boolean;      // Passes minimum quality bar?
  reasoning?: string;       // Why this score?
  cost?: number;           // Cost of evaluation
}
```

### RefinementResult
```typescript
interface RefinementResult<T> {
  candidate: T;                    // Final refined result
  confidence: number;              // Final confidence score
  iterations: number;              // Total iterations performed
  totalCost: number;              // Total cost incurred
  converged: boolean;             // Reached confidence threshold?
  stopReason: string;             // Why we stopped
  processTrace?: ProcessStep[];   // Process trace if enabled
  remainingFeedback: Feedback[];  // Any unresolved issues
  confidenceHistory: number[];    // Score progression
  durationMs: number;             // Total time taken
}
```

## Usage

### Basic Usage: RefinementLoop Class

```typescript
import { RefinementLoop, createEvaluation, createFeedback } from './skills/refinement-loop';

// Configure the loop
const config = {
  maxIterations: 5,
  confidenceThreshold: 0.9,
  processSupervision: true,
  costBudget: 500
};

const loop = new RefinementLoop<CodeCandidate>(config);

// Generate: Create initial candidate
const generate = async () => ({
  code: 'function add(a, b) { return a + b; }',
  language: 'javascript'
});

// Evaluate: Check quality
const evaluate = async (candidate) => {
  const issues = [];
  let score = 1.0;

  if (!candidate.code.includes('/**')) {
    issues.push(createFeedback(
      'Missing documentation',
      'minor',
      'Add JSDoc comment'
    ));
    score -= 0.2;
  }

  return createEvaluation(score, issues, `Score: ${score}`, 10);
};

// Refine: Improve based on feedback
const refine = async (candidate, feedback) => {
  if (feedback.issue.includes('documentation')) {
    return {
      ...candidate,
      code: `/** Adds two numbers */\n${candidate.code}`
    };
  }
  return candidate;
};

// Run the refinement loop
const result = await loop.run(generate, evaluate, refine);

console.log(`Converged: ${result.converged}`);
console.log(`Confidence: ${result.confidence}`);
console.log(`Iterations: ${result.iterations}`);
console.log(`Final code:\n${result.candidate.code}`);
```

### Simplified Usage: withRefinement Helper

For simple cases where you just need to refine until a score is reached:

```typescript
import { withRefinement } from './skills/refinement-loop';

const result = await withRefinement(
  async () => generateSolution(),
  async (solution) => evaluateQuality(solution), // Returns 0-1 score
  {
    maxIterations: 3,
    confidenceThreshold: 0.85
  }
);
```

## Standard Pattern

The refinement loop implements this pattern:

```
1. GENERATE initial candidate
2. EVALUATE candidate → score + feedback
3. If confident enough → DONE
4. If max iterations → DONE
5. If budget exceeded → DONE
6. If no improvement → DONE
7. REFINE candidate based on feedback
8. Go to step 2
```

## Integration with Skills

Any skill can use the refinement loop for quality improvement:

### Example: Code Generation Skill

```typescript
import { withRefinement, createRefinementLoop } from './skills';

async function generateHighQualityCode(requirements: string) {
  const loop = createRefinementLoop({
    maxIterations: 5,
    confidenceThreshold: 0.9,
    processSupervision: true
  });

  return loop.run(
    async () => initialCodeGeneration(requirements),
    async (code) => runLinterAndTests(code),
    async (code, feedback) => applyFixes(code, feedback)
  );
}
```

### Example: Architecture Design Skill

```typescript
import { RefinementLoop } from './skills';

async function designArchitecture(specs: ArchitectureSpecs) {
  const config = {
    maxIterations: 4,
    confidenceThreshold: 0.85,
    costBudget: 1000,
    processSupervision: true
  };

  const loop = new RefinementLoop<ArchitectureDesign>(config);

  const result = await loop.run(
    () => generateInitialDesign(specs),
    (design) => validateAgainstRequirements(design, specs),
    (design, feedback) => refineDesign(design, feedback)
  );

  return result.candidate;
}
```

## Advanced Features

### Process Trace Analysis

When `processSupervision` is enabled, you can analyze the refinement process:

```typescript
const result = await loop.run(generate, evaluate, refine);

// Get complete process trace
const trace = loop.getProcessTrace();

trace.forEach(step => {
  console.log(`Action: ${step.action}`);
  console.log(`Score: ${step.score}`);
  console.log(`Reasoning: ${step.reasoning}`);
  console.log(`Cost: ${step.cost}`);
});
```

### Budget Management

Track and manage costs throughout refinement:

```typescript
const loop = new RefinementLoop({
  maxIterations: 10,
  confidenceThreshold: 0.9,
  costBudget: 500
});

// During execution
console.log(`Remaining budget: ${loop.getRemainingBudget()}`);
console.log(`Estimated cost to complete: ${loop.estimateCostToComplete()}`);
```

### Confidence History

Analyze improvement trends:

```typescript
const result = await loop.run(generate, evaluate, refine);

console.log('Confidence over time:');
result.confidenceHistory.forEach((score, i) => {
  console.log(`Iteration ${i}: ${(score * 100).toFixed(1)}%`);
});
```

## Helper Functions

### createFeedback()
```typescript
const feedback = createFeedback(
  'Issue description',
  'critical',           // severity
  'How to fix it',      // suggestion
  'aspect-name'         // aspect
);
```

### createEvaluation()
```typescript
const evaluation = createEvaluation(
  0.85,                 // score
  [feedback1, feedback2], // feedback
  'Good progress',      // reasoning
  20                    // cost
);
```

### formatRefinementResult()
```typescript
const result = await loop.run(...);
console.log(formatRefinementResult(result));

// Output:
// === Refinement Result ===
// Iterations: 3
// Final Confidence: 92.0%
// Converged: Yes
// Stop Reason: confidence
// ...
```

## Best Practices

### 1. Choose Appropriate Thresholds
```typescript
// For production code
{ confidenceThreshold: 0.95, maxIterations: 5 }

// For prototypes
{ confidenceThreshold: 0.75, maxIterations: 3 }

// For critical systems
{ confidenceThreshold: 0.99, maxIterations: 10 }
```

### 2. Provide Meaningful Feedback
```typescript
// Good - actionable feedback
createFeedback(
  'Function lacks input validation',
  'major',
  'Add typeof checks for numeric parameters',
  'input-validation'
);

// Bad - vague feedback
createFeedback('Code could be better', 'minor');
```

### 3. Track Costs
```typescript
const evaluate = async (candidate) => {
  const startTime = Date.now();
  const result = await expensiveAnalysis(candidate);
  const cost = Date.now() - startTime;

  return createEvaluation(result.score, result.issues, undefined, cost);
};
```

### 4. Handle Plateaus
```typescript
const config = {
  maxIterations: 10,
  confidenceThreshold: 0.9,
  minImprovementDelta: 0.05  // Stop if improvement < 5%
};
```

## Testing

See `/home/user/Sartor-claude-network/src/skills/refinement-loop.test.ts` for comprehensive test suite.

Run tests:
```bash
npm test refinement-loop.test.ts
```

## Examples

See `/home/user/Sartor-claude-network/src/skills/refinement-loop.example.ts` for complete examples including:

1. Code Quality Refinement
2. Simple Refinement with Helper
3. Architecture Design Refinement
4. Cost-Aware Refinement

Run examples:
```bash
npx ts-node src/skills/refinement-loop.example.ts
```

## Skill Manifest

The refinement loop is registered as a skill with ID `refinement-loop`:

```typescript
import { getSkillManifest } from './skills';

const manifest = getSkillManifest('refinement-loop');
console.log(manifest.summary);
// "Core iterative refinement mechanism using generate-evaluate-refine cycles..."
```

## Related Concepts

- **Poetiq's Approach**: Generate → Evaluate → Refine until confident
- **Self-Auditing**: Knows when to stop without external intervention
- **Process Supervision**: Records traces for learning and debugging
- **Cost Awareness**: Respects resource constraints
- **Evidence-Based**: Decisions based on scores and feedback, not assumptions

## Future Enhancements

Potential improvements:
- [ ] Multi-objective optimization (multiple evaluation criteria)
- [ ] Adaptive refinement strategies (learn which refinements work best)
- [ ] Parallel candidate exploration (evaluate multiple variants)
- [ ] Incremental refinement (refine parts independently)
- [ ] Collaborative refinement (multiple agents contribute)

## Summary

The Refinement Loop is the standard way to execute quality-critical tasks in Sartor. Use it whenever:

- Quality matters more than speed
- You need iterative improvement
- You want self-auditing (automatic stop conditions)
- You need to track costs
- You want process traces for learning

**Key principle**: Never settle for first-draft quality when refinement is possible.
