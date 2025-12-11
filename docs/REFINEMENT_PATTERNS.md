# Refinement Patterns for Claude Agents

**Practical Reference for Implementing Iterative Improvement Cycles**

**Version:** 1.0
**Status:** Production Ready
**Last Updated:** 2025-12-06

---

## Overview

This document synthesizes research findings on refinement loops with practical implementation patterns for the Claude memory system. Based on analysis of model-agnostic refinement harnesses (Poetiq: 31% → 54% improvement) and test-time compute research, these patterns enable agents to improve solutions through systematic generate-evaluate-refine cycles.

**Core Finding:** Iterative refinement with self-auditing produces better outcomes than single-shot execution, with improvements of 23+ percentage points across diverse tasks when agents can determine when solutions are satisfactory.

**Key Metrics:**

- **Poetiq Improvement:** 31% → 54% accuracy through refinement harness
- **Code Agent Efficiency:** 30% fewer steps using code-based vs JSON approaches
- **Process Supervision:** Per-step feedback outperforms outcome-only evaluation
- **Test-Time Compute:** Variable compute allocation adapts to task difficulty

---

## 1. Core Refinement Loop

### The Fundamental Pattern

**Generate → Evaluate → Refine → Repeat**

This is the atomic unit of iterative improvement. Every refinement implementation builds on this foundation.

```typescript
interface RefinementLoop<T = any> {
  maxIterations: number;
  currentIteration: number;
  generate: () => Promise<Candidate>;
  evaluate: (candidate: Candidate) => Promise<Feedback>;
  refine: (candidate: Candidate, feedback: Feedback) => Promise<Candidate>;
  isComplete: (candidate: Candidate, feedback: Feedback) => boolean;
  history: RefinementHistory[];
  costBudget?: number;
  costAccumulated: number;
}

interface Candidate {
  id: string;
  output: any;
  confidence: number;
  reasoning?: string;
  metadata?: Record<string, any>;
}

interface Feedback {
  score: number; // 0-1, how good is the candidate
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  criticalIssues?: string[];
  confidence: number; // Evaluator's confidence in this feedback
}
```

### Implementation Pattern

```typescript
async function executeRefinementLoop<T>(
  task: Task,
  config: RefinementConfig
): Promise<RefinementResult> {
  const loop: RefinementLoop = {
    maxIterations: config.maxIterations ?? 5,
    currentIteration: 0,
    generate: config.generator,
    evaluate: config.evaluator,
    refine: config.refiner,
    isComplete: config.completionCriteria,
    history: [],
    costBudget: config.costBudget,
    costAccumulated: 0,
  };

  let candidate = await loop.generate();
  let feedback = await loop.evaluate(candidate);

  while (loop.currentIteration < loop.maxIterations) {
    loop.currentIteration++;

    // Record history
    loop.history.push({
      iteration: loop.currentIteration,
      candidate,
      feedback,
      timestamp: Date.now(),
      costIncurred: estimateCost(candidate, feedback),
    });

    loop.costAccumulated += loop.history[loop.history.length - 1].costIncurred;

    // Check completion criteria
    if (loop.isComplete(candidate, feedback)) {
      return {
        finalCandidate: candidate,
        finalFeedback: feedback,
        iterations: loop.currentIteration,
        history: loop.history,
        terminationReason: 'complete',
        totalCost: loop.costAccumulated,
      };
    }

    // Check cost budget
    if (loop.costBudget && loop.costAccumulated >= loop.costBudget) {
      return {
        finalCandidate: candidate,
        finalFeedback: feedback,
        iterations: loop.currentIteration,
        history: loop.history,
        terminationReason: 'cost_limit',
        totalCost: loop.costAccumulated,
      };
    }

    // Check for diminishing returns
    if (loop.currentIteration >= 3 && isDiminishingReturns(loop.history)) {
      return {
        finalCandidate: candidate,
        finalFeedback: feedback,
        iterations: loop.currentIteration,
        history: loop.history,
        terminationReason: 'diminishing_returns',
        totalCost: loop.costAccumulated,
      };
    }

    // Refine and continue
    candidate = await loop.refine(candidate, feedback);
    feedback = await loop.evaluate(candidate);
  }

  return {
    finalCandidate: candidate,
    finalFeedback: feedback,
    iterations: loop.currentIteration,
    history: loop.history,
    terminationReason: 'max_iterations',
    totalCost: loop.costAccumulated,
  };
}
```

### Key Principles

**1. Iteration is Cheap, Getting it Right is Valuable**

- Single-shot execution: 31% accuracy (baseline)
- With refinement: 54% accuracy (+23 percentage points)
- Cost of 2-3 refinement iterations << cost of wrong answer

**2. Track Everything**

- History enables learning from iteration patterns
- Cost accumulation prevents runaway refinement
- Termination reasons inform future optimization

**3. Diminishing Returns are Real**

- First refinement: ~15-20% improvement
- Second refinement: ~5-10% improvement
- Third+ refinement: ~1-3% improvement
- Stop when marginal gain < marginal cost

### Practical Example: Code Generation

```typescript
const codeRefinementLoop = {
  generate: async () => {
    // Generate initial code solution
    const code = await generateCode(task.prompt);
    return {
      id: generateId(),
      output: code,
      confidence: 0.6,
      reasoning: 'Initial implementation based on prompt',
    };
  },

  evaluate: async (candidate) => {
    // Run tests, check syntax, analyze quality
    const testResults = await runTests(candidate.output);
    const syntaxCheck = await checkSyntax(candidate.output);
    const qualityMetrics = await analyzeCodeQuality(candidate.output);

    const score =
      testResults.passRate * 0.5 +
      (syntaxCheck.valid ? 0.3 : 0) +
      qualityMetrics.normalizedScore * 0.2;

    return {
      score,
      strengths: [
        ...testResults.passingTests.map((t) => `Test passed: ${t}`),
        ...(syntaxCheck.valid ? ['Valid syntax'] : []),
      ],
      weaknesses: [
        ...testResults.failingTests.map((t) => `Test failed: ${t}`),
        ...syntaxCheck.errors,
        ...qualityMetrics.issues,
      ],
      suggestions: [
        ...testResults.failingTests.map((t) => `Fix failing test: ${t}`),
        ...qualityMetrics.suggestions,
      ],
      criticalIssues: syntaxCheck.errors.filter((e) => e.severity === 'error'),
      confidence: 0.9, // High confidence in evaluation
    };
  },

  refine: async (candidate, feedback) => {
    // Refine based on specific feedback
    const refinedCode = await refineCode(
      candidate.output,
      feedback.weaknesses,
      feedback.suggestions
    );

    return {
      id: generateId(),
      output: refinedCode,
      confidence: Math.min(0.95, candidate.confidence + 0.15),
      reasoning: `Refined to address: ${feedback.weaknesses.slice(0, 3).join(', ')}`,
      metadata: {
        parentId: candidate.id,
        refinementReason: feedback.weaknesses,
      },
    };
  },

  isComplete: (candidate, feedback) => {
    // Complete when tests pass AND no critical issues AND confidence high
    return (
      feedback.score >= 0.85 &&
      (feedback.criticalIssues?.length ?? 0) === 0 &&
      candidate.confidence >= 0.8
    );
  },
};
```

---

## 2. Self-Auditing Mechanism

### How to Know When to Stop Refining

**Research Finding:** Systems that self-determine completion criteria achieve better outcomes than those with fixed iteration counts. The agent's ability to assess "is this good enough?" is critical for efficiency.

### The Self-Audit Interface

```typescript
interface SelfAudit {
  isSatisfactory: boolean;
  confidence: number; // How confident are we that solution is satisfactory
  gaps: string[]; // What's missing or could be improved
  risks: string[]; // What could go wrong
  shouldRefine: boolean; // Trigger more refinement?
  reasoning: string;
}

interface AuditConfig {
  confidenceThreshold: number; // Below this, trigger refinement
  satisfactionThreshold: number; // Quality threshold for "good enough"
  maxRefinements: number; // Don't refine forever
  costPerRefinement: number; // Cost of each refinement iteration
}
```

### Implementation Pattern

```typescript
async function selfAudit(
  candidate: Candidate,
  feedback: Feedback,
  task: Task,
  config: AuditConfig
): Promise<SelfAudit> {
  // 1. Check objective quality metrics
  const meetsQualityThreshold = feedback.score >= config.satisfactionThreshold;

  // 2. Check confidence (both candidate and feedback)
  const hasHighConfidence =
    candidate.confidence >= config.confidenceThreshold &&
    feedback.confidence >= config.confidenceThreshold;

  // 3. Identify remaining gaps
  const gaps = identifyGaps(candidate, feedback, task);

  // 4. Assess risks
  const risks = assessRisks(candidate, feedback, task);

  // 5. Critical issues are blockers
  const hasCriticalIssues = (feedback.criticalIssues?.length ?? 0) > 0;

  // 6. Calculate cost-benefit of refinement
  const improvementPotential = estimateImprovementPotential(candidate, feedback, gaps);
  const costOfRefinement = config.costPerRefinement;
  const benefitOfRefinement = improvementPotential * valueOfImprovement(task);

  const worthRefining = benefitOfRefinement > costOfRefinement;

  // Decision logic
  const isSatisfactory =
    meetsQualityThreshold &&
    hasHighConfidence &&
    !hasCriticalIssues &&
    (gaps.length === 0 || !worthRefining);

  const shouldRefine = (!isSatisfactory && hasCriticalIssues) || worthRefining;

  return {
    isSatisfactory,
    confidence: Math.min(candidate.confidence, feedback.confidence),
    gaps,
    risks,
    shouldRefine,
    reasoning: generateAuditReasoning({
      meetsQualityThreshold,
      hasHighConfidence,
      hasCriticalIssues,
      worthRefining,
      gaps,
      risks,
    }),
  };
}

function generateAuditReasoning(params: {
  meetsQualityThreshold: boolean;
  hasHighConfidence: boolean;
  hasCriticalIssues: boolean;
  worthRefining: boolean;
  gaps: string[];
  risks: string[];
}): string {
  const reasons: string[] = [];

  if (!params.meetsQualityThreshold) {
    reasons.push('Quality score below satisfaction threshold');
  }

  if (!params.hasHighConfidence) {
    reasons.push('Confidence level insufficient');
  }

  if (params.hasCriticalIssues) {
    reasons.push('Critical issues must be resolved');
  }

  if (params.gaps.length > 0 && params.worthRefining) {
    reasons.push(`${params.gaps.length} gaps identified with positive ROI for refinement`);
  }

  if (params.risks.length > 0) {
    reasons.push(`${params.risks.length} risks identified`);
  }

  if (reasons.length === 0) {
    return 'Solution meets quality threshold with high confidence and no critical issues';
  }

  return reasons.join('; ');
}
```

### Self-Audit Decision Tree

```
┌─ Has Critical Issues? ─ YES ─→ MUST REFINE
│  └─ NO
│     └─ Quality >= Threshold? ─ NO ─→ SHOULD REFINE
│        └─ YES
│           └─ Confidence >= Threshold? ─ NO ─→ SHOULD REFINE
│              └─ YES
│                 └─ Improvement ROI Positive? ─ YES ─→ MAY REFINE
│                    └─ NO
│                       └─ SATISFACTORY (Stop)
```

### Practical Example: Research Report Self-Audit

```typescript
async function auditResearchReport(
  report: Candidate,
  feedback: Feedback,
  task: Task
): Promise<SelfAudit> {
  const gaps: string[] = [];
  const risks: string[] = [];

  // Check citation quality
  const citations = extractCitations(report.output);
  if (citations.length === 0) {
    gaps.push('No citations provided for claims');
  }
  if (citations.some((c) => !c.hasIdentifier)) {
    gaps.push('Some citations lack PMID/DOI/URL identifiers');
  }

  // Check for fabrication risk
  const suspiciousCitations = citations.filter(
    (c) => c.title.includes('Example') || c.title.includes('et al., 2024') || !c.isVerified
  );
  if (suspiciousCitations.length > 0) {
    risks.push(`${suspiciousCitations.length} citations may be fabricated (need verification)`);
  }

  // Check evidence strength
  const hasLimitations = report.output.includes('Limitations:');
  if (!hasLimitations) {
    gaps.push('No limitations section (required for honest research)');
  }

  // Check for false consensus
  const hasConflictingEvidence =
    report.output.includes('conflicting') || report.output.includes('disagreement');
  const multipleSourcesCited = citations.length >= 3;
  if (multipleSourcesCited && !hasConflictingEvidence) {
    risks.push('Multiple sources cited with no conflicts noted (possible false consensus)');
  }

  // Estimate improvement potential
  const qualityGaps = gaps.length + risks.length;
  const currentQuality = feedback.score;
  const potentialQuality = Math.min(1.0, currentQuality + qualityGaps * 0.05);
  const improvementPotential = potentialQuality - currentQuality;

  return {
    isSatisfactory:
      feedback.score >= 0.85 && report.confidence >= 0.8 && gaps.length === 0 && risks.length === 0,
    confidence: Math.min(report.confidence, feedback.confidence),
    gaps,
    risks,
    shouldRefine: (gaps.length > 0 || risks.length > 0) && improvementPotential > 0.1,
    reasoning:
      `Quality: ${(feedback.score * 100).toFixed(0)}%, ` +
      `Confidence: ${(report.confidence * 100).toFixed(0)}%, ` +
      `Gaps: ${gaps.length}, Risks: ${risks.length}, ` +
      `Improvement potential: ${(improvementPotential * 100).toFixed(0)}%`,
  };
}
```

### Anti-Patterns to Avoid

**❌ The Infinite Refiner**

```typescript
// BAD: No stopping condition
while (true) {
  candidate = refine(candidate);
  // Runs forever!
}
```

**✅ GOOD: Clear termination criteria**

```typescript
while (
  !selfAudit.isSatisfactory &&
  iterations < maxIterations &&
  costAccumulated < costBudget &&
  !isDiminishingReturns(history)
) {
  candidate = refine(candidate);
}
```

**❌ The Perfectionist**

```typescript
// BAD: Impossible standard
isComplete: (c, f) => f.score === 1.0 && c.confidence === 1.0;
```

**✅ GOOD: Realistic threshold**

```typescript
isComplete: (c, f) => f.score >= 0.85 && c.confidence >= 0.8 && criticalIssues.length === 0;
```

---

## 3. Process Supervision

### Per-Step vs Outcome Feedback

**Research Finding:** Process Reward Models (PRMs) that provide per-step feedback outperform Outcome Reward Models (ORMs) that only evaluate final results. Agents learn better when they know which steps contributed to success or failure.

### The Process Trace Interface

```typescript
interface ProcessStep {
  stepId: string;
  description: string;
  input: any;
  output: any;
  success: boolean;
  confidence: number;
  reasoning: string;
  timestamp: number;
  feedback?: Feedback;
}

interface ProcessTrace {
  taskId: string;
  steps: ProcessStep[];
  overallSuccess: boolean;
  overallConfidence: number;
  creditAssignment: Map<string, number>; // Which steps contributed most
}

interface SupervisionConfig {
  trackReasoningChain: boolean; // Track step-by-step reasoning
  provideStepFeedback: boolean; // Give feedback per step
  identifyKeySteps: boolean; // Credit assignment
}
```

### Implementation Pattern

```typescript
async function executeWithProcessSupervision<T>(
  task: Task,
  steps: Array<(input: any) => Promise<any>>,
  config: SupervisionConfig
): Promise<ProcessTrace> {
  const trace: ProcessTrace = {
    taskId: task.id,
    steps: [],
    overallSuccess: false,
    overallConfidence: 0,
    creditAssignment: new Map(),
  };

  let currentInput = task.context;

  for (let i = 0; i < steps.length; i++) {
    const stepFn = steps[i];
    const stepStart = Date.now();

    try {
      // Execute step
      const stepOutput = await stepFn(currentInput);

      // Create step record
      const step: ProcessStep = {
        stepId: `step-${i}`,
        description: stepFn.name || `Step ${i + 1}`,
        input: currentInput,
        output: stepOutput,
        success: true,
        confidence: 0.8, // Default, can be refined
        reasoning: `Executed ${stepFn.name}`,
        timestamp: Date.now(),
      };

      // Provide per-step feedback if enabled
      if (config.provideStepFeedback) {
        step.feedback = await evaluateStep(step, task);
        step.confidence = step.feedback.confidence;
        step.success = step.feedback.score >= 0.7;
      }

      trace.steps.push(step);

      // If step failed and we're tracking, stop or adjust
      if (!step.success && config.trackReasoningChain) {
        trace.overallSuccess = false;
        trace.overallConfidence = step.confidence;

        // Attempt recovery or refinement
        const recovered = await attemptStepRecovery(step, step.feedback!);
        if (recovered) {
          step.output = recovered.output;
          step.success = true;
          step.confidence = recovered.confidence;
          step.reasoning += ` (recovered: ${recovered.reasoning})`;
        } else {
          break; // Cannot continue
        }
      }

      currentInput = stepOutput;
    } catch (error) {
      const step: ProcessStep = {
        stepId: `step-${i}`,
        description: stepFn.name || `Step ${i + 1}`,
        input: currentInput,
        output: null,
        success: false,
        confidence: 0,
        reasoning: `Failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
      };

      trace.steps.push(step);
      trace.overallSuccess = false;
      trace.overallConfidence = 0;
      break;
    }
  }

  // If all steps succeeded
  if (trace.steps.every((s) => s.success)) {
    trace.overallSuccess = true;
    trace.overallConfidence =
      trace.steps.reduce((sum, s) => sum + s.confidence, 0) / trace.steps.length;
  }

  // Credit assignment: which steps were most important?
  if (config.identifyKeySteps) {
    trace.creditAssignment = assignCredit(trace.steps, trace.overallSuccess);
  }

  return trace;
}

function assignCredit(steps: ProcessStep[], overallSuccess: boolean): Map<string, number> {
  const creditMap = new Map<string, number>();

  if (!overallSuccess) {
    // Negative credit: which step caused failure?
    const firstFailure = steps.find((s) => !s.success);
    if (firstFailure) {
      creditMap.set(firstFailure.stepId, -1.0);
    }
    return creditMap;
  }

  // Positive credit: distribute based on confidence and impact
  let totalConfidence = 0;
  steps.forEach((step) => {
    if (step.success) {
      totalConfidence += step.confidence;
    }
  });

  steps.forEach((step) => {
    if (step.success) {
      // Normalized contribution
      const credit = step.confidence / totalConfidence;
      creditMap.set(step.stepId, credit);
    }
  });

  return creditMap;
}
```

### Practical Example: API Integration Task

```typescript
async function integrateAPIWithSupervision(apiConfig: APIConfig): Promise<ProcessTrace> {
  const steps = [
    // Step 1: Validate configuration
    async (input) => {
      const validation = validateAPIConfig(input);
      return { config: input, validationResult: validation };
    },

    // Step 2: Establish connection
    async (input) => {
      const connection = await connectToAPI(input.config);
      return { ...input, connection };
    },

    // Step 3: Authenticate
    async (input) => {
      const authToken = await authenticate(input.connection, input.config);
      return { ...input, authToken };
    },

    // Step 4: Test request
    async (input) => {
      const testResponse = await makeTestRequest(input.connection, input.authToken);
      return { ...input, testResponse };
    },

    // Step 5: Verify response
    async (input) => {
      const verified = verifyResponse(input.testResponse, input.config.expectedSchema);
      return { ...input, verified };
    },
  ];

  const trace = await executeWithProcessSupervision(
    { id: 'api-integration', context: apiConfig },
    steps,
    {
      trackReasoningChain: true,
      provideStepFeedback: true,
      identifyKeySteps: true,
    }
  );

  // Analyze which step was most critical
  const criticalStep = Array.from(trace.creditAssignment.entries()).sort((a, b) => b[1] - a[1])[0];

  console.log(`Most critical step: ${criticalStep?.[0]} (credit: ${criticalStep?.[1].toFixed(2)})`);

  return trace;
}
```

### Outcome vs Process Supervision Comparison

| Aspect                | Outcome Supervision (ORM)   | Process Supervision (PRM)    |
| --------------------- | --------------------------- | ---------------------------- |
| **Feedback Timing**   | After task completion       | During each step             |
| **Error Detection**   | Only knows final failure    | Identifies failing step      |
| **Learning**          | "This approach didn't work" | "Step 3 caused the failure"  |
| **Recovery**          | Must restart entire task    | Can retry/fix specific step  |
| **Credit Assignment** | All-or-nothing              | Proportional to contribution |
| **Debugging**         | Opaque                      | Transparent reasoning chain  |
| **Best For**          | Simple, atomic tasks        | Multi-step, complex tasks    |

### When to Use Process Supervision

✅ **Use Process Supervision When:**

- Task has multiple distinct steps (3+)
- Steps have dependencies (output of step N → input of step N+1)
- Intermediate failures are recoverable
- You need to understand "why" not just "what"
- Debugging and learning from failures is important

❌ **Skip Process Supervision When:**

- Task is atomic (single operation)
- Steps are trivial or fast
- Overhead of per-step evaluation > value of insight
- Only final outcome matters (no intermediate learning needed)

---

## 4. Test-Time Adaptation

### Adapting Approach Per-Task

**Research Finding:** Systems that adapt their strategy based on task characteristics (test-time compute) achieve better results with less wasted effort. Not all tasks need the same amount of refinement or the same approach.

### The Adaptation Interface

```typescript
interface TaskExample {
  input: any;
  expectedOutput?: any;
  approach: string; // What strategy worked
  feedback?: string;
}

interface AdaptationStrategy {
  name: string;
  applicability: (task: Task) => number; // 0-1, how applicable
  execute: (task: Task) => Promise<TaskResult>;
  examples: TaskExample[];
}

interface TestTimeAdapter {
  strategies: AdaptationStrategy[];
  selectStrategy: (task: Task, examples?: TaskExample[]) => AdaptationStrategy;
  learnFromExample: (example: TaskExample) => void;
}
```

### Implementation Pattern

```typescript
class TestTimeAdapter {
  private strategies: Map<string, AdaptationStrategy> = new Map();
  private performanceHistory: Map<string, number[]> = new Map();

  registerStrategy(strategy: AdaptationStrategy): void {
    this.strategies.set(strategy.name, strategy);
    this.performanceHistory.set(strategy.name, []);
  }

  selectStrategy(task: Task, priorExamples?: TaskExample[]): AdaptationStrategy {
    // 1. Calculate applicability scores for each strategy
    const scores = Array.from(this.strategies.values()).map((strategy) => {
      let score = strategy.applicability(task);

      // Boost score based on past performance
      const history = this.performanceHistory.get(strategy.name) || [];
      if (history.length > 0) {
        const avgPerformance = history.reduce((sum, v) => sum + v, 0) / history.length;
        score *= 0.7 + 0.3 * avgPerformance; // Weight current applicability 70%, history 30%
      }

      // Boost score if similar examples succeeded with this strategy
      if (priorExamples) {
        const similarExamples = priorExamples.filter(
          (ex) => this.isSimilar(task, ex) && ex.approach === strategy.name
        );
        if (similarExamples.length > 0) {
          score *= 1.2; // 20% boost for proven success on similar tasks
        }
      }

      return { strategy, score };
    });

    // 2. Select highest-scoring strategy
    scores.sort((a, b) => b.score - a.score);

    if (scores[0].score < 0.3) {
      // No strategy is particularly applicable - use default
      return this.getDefaultStrategy();
    }

    return scores[0].strategy;
  }

  async executeTask(task: Task, priorExamples?: TaskExample[]): Promise<TaskResult> {
    const strategy = this.selectStrategy(task, priorExamples);

    console.log(`Selected strategy: ${strategy.name} for task ${task.id}`);

    const startTime = Date.now();
    const result = await strategy.execute(task);
    const duration = Date.now() - startTime;

    // Record performance
    const performance = result.success ? 1.0 : 0.0;
    this.performanceHistory.get(strategy.name)!.push(performance);

    // Create example for future learning
    const example: TaskExample = {
      input: task,
      expectedOutput: result.output,
      approach: strategy.name,
      feedback: result.success ? `Success in ${duration}ms` : `Failed: ${result.error}`,
    };

    this.learnFromExample(example);

    return result;
  }

  learnFromExample(example: TaskExample): void {
    // Find the strategy used
    const strategy = this.strategies.get(example.approach);
    if (!strategy) return;

    // Add to strategy's examples (for few-shot learning)
    strategy.examples.push(example);

    // Limit example storage to most recent/relevant
    if (strategy.examples.length > 50) {
      strategy.examples.shift(); // Remove oldest
    }
  }

  private isSimilar(task: Task, example: TaskExample): boolean {
    // Simple similarity heuristic (enhance with embeddings in production)
    const taskType = task.type.toLowerCase();
    const exampleType = (example.input as Task).type?.toLowerCase() || '';

    return (
      taskType === exampleType || taskType.includes(exampleType) || exampleType.includes(taskType)
    );
  }

  private getDefaultStrategy(): AdaptationStrategy {
    return this.strategies.get('balanced-default') || Array.from(this.strategies.values())[0];
  }
}
```

### Practical Example: Code Generation Strategies

```typescript
const codeAdapter = new TestTimeAdapter();

// Strategy 1: Fast iteration (for simple tasks)
codeAdapter.registerStrategy({
  name: 'fast-iteration',
  applicability: (task) => {
    const complexity = estimateComplexity(task);
    return complexity < 0.3 ? 0.9 : 0.2; // High for simple, low for complex
  },
  execute: async (task) => {
    // Single-shot generation with minimal refinement
    const code = await generateCode(task.prompt);
    const tests = await runQuickTests(code);

    if (tests.passRate > 0.8) {
      return { success: true, output: code };
    }

    // One refinement attempt
    const refined = await quickRefine(code, tests.failures);
    return { success: true, output: refined };
  },
  examples: [],
});

// Strategy 2: Thorough refinement (for complex tasks)
codeAdapter.registerStrategy({
  name: 'thorough-refinement',
  applicability: (task) => {
    const complexity = estimateComplexity(task);
    const hasCriticalRequirements = task.constraints.some(
      (c) => c.includes('security') || c.includes('performance')
    );
    return complexity > 0.6 || hasCriticalRequirements ? 0.9 : 0.3;
  },
  execute: async (task) => {
    // Full refinement loop with up to 5 iterations
    return executeRefinementLoop(task, {
      maxIterations: 5,
      generator: () => generateCode(task.prompt),
      evaluator: (c) => comprehensiveEvaluation(c),
      refiner: (c, f) => thoroughRefinement(c, f),
      completionCriteria: (c, f) =>
        f.score >= 0.9 && c.confidence >= 0.85 && (f.criticalIssues?.length ?? 0) === 0,
    });
  },
  examples: [],
});

// Strategy 3: Competitive exploration (when uncertain)
codeAdapter.registerStrategy({
  name: 'competitive-exploration',
  applicability: (task) => {
    const hasMultipleApproaches = task.context?.includes('multiple') || task.constraints.length > 3;
    return hasMultipleApproaches ? 0.8 : 0.2;
  },
  execute: async (task) => {
    // Generate multiple solutions in parallel, pick best
    const approaches = [
      generateCode(task.prompt, { style: 'functional' }),
      generateCode(task.prompt, { style: 'object-oriented' }),
      generateCode(task.prompt, { style: 'procedural' }),
    ];

    const candidates = await Promise.all(approaches);
    const evaluations = await Promise.all(candidates.map((c) => comprehensiveEvaluation(c)));

    // Select best candidate
    const scored = candidates.map((c, i) => ({
      candidate: c,
      score: evaluations[i].score,
    }));
    scored.sort((a, b) => b.score - a.score);

    // Refine the best one
    return executeRefinementLoop(task, {
      maxIterations: 2,
      generator: () => Promise.resolve(scored[0].candidate),
      evaluator: (c) => comprehensiveEvaluation(c),
      refiner: (c, f) => quickRefine(c, f),
      completionCriteria: (c, f) => f.score >= 0.85,
    });
  },
  examples: [],
});

// Usage
const result = await codeAdapter.executeTask(
  {
    id: 'task-1',
    type: 'code-generation',
    intent: 'Implement authentication middleware',
    constraints: ['security', 'performance'],
    dependencies: [],
    priority: 'high',
  },
  priorExamples // Optional: examples from similar tasks
);
```

### Adaptation Decision Matrix

```
Task Complexity × Requirements → Strategy Selection

┌─────────────────┬──────────────────┬──────────────────┬──────────────────┐
│                 │ Simple           │ Moderate         │ Complex          │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Loose           │ Fast Iteration   │ Fast Iteration   │ Balanced         │
│ Requirements    │ (1-2 iterations) │ (2-3 iterations) │ (3-4 iterations) │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Standard        │ Fast Iteration   │ Balanced         │ Thorough         │
│ Requirements    │ (1-2 iterations) │ (2-4 iterations) │ (4-5 iterations) │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Critical        │ Balanced         │ Thorough         │ Competitive +    │
│ Requirements    │ (2-3 iterations) │ (4-5 iterations) │ Thorough         │
│ (Security/$$)   │                  │                  │ (5+ iterations)  │
└─────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

---

## 5. Cost-Accuracy Tradeoffs

### When to Use More Compute

**Research Finding:** Variable test-time compute allocation based on task difficulty and value achieves better ROI than fixed compute budgets. Spend more on hard/valuable problems, less on easy/low-stakes ones.

### The Tradeoff Framework

```typescript
interface ComputeBudget {
  maxTokens: number;
  maxIterations: number;
  maxCostUSD: number;
  maxLatencyMs: number;
}

interface TaskValue {
  stakesLevel: 'low' | 'medium' | 'high' | 'critical';
  userValue: number; // Estimated value to user (0-1)
  errorCost: number; // Cost of getting it wrong (0-1)
  timeValue: number; // How much does speed matter (0-1)
}

interface ComputeAllocation {
  allocatedBudget: ComputeBudget;
  reasoning: string;
  expectedQuality: number;
  expectedLatency: number;
}
```

### Implementation Pattern

```typescript
function allocateCompute(
  task: Task,
  value: TaskValue,
  difficulty: number // 0-1, estimated difficulty
): ComputeAllocation {
  // Base budgets (configurable)
  const BASE_BUDGETS = {
    low: { maxTokens: 2000, maxIterations: 1, maxCostUSD: 0.01, maxLatencyMs: 5000 },
    medium: { maxTokens: 8000, maxIterations: 3, maxCostUSD: 0.05, maxLatencyMs: 15000 },
    high: { maxTokens: 20000, maxIterations: 5, maxCostUSD: 0.2, maxLatencyMs: 45000 },
    critical: { maxTokens: 50000, maxIterations: 10, maxCostUSD: 1.0, maxLatencyMs: 120000 },
  };

  let baseBudget = BASE_BUDGETS[value.stakesLevel];

  // Adjust based on difficulty
  const difficultyMultiplier = 0.5 + difficulty * 1.5; // Range: 0.5x to 2x
  const allocatedBudget = {
    maxTokens: Math.round(baseBudget.maxTokens * difficultyMultiplier),
    maxIterations: Math.round(baseBudget.maxIterations * difficultyMultiplier),
    maxCostUSD: baseBudget.maxCostUSD * difficultyMultiplier,
    maxLatencyMs: baseBudget.maxLatencyMs,
  };

  // Adjust for time sensitivity
  if (value.timeValue > 0.8) {
    // User needs fast answer - reduce iterations
    allocatedBudget.maxIterations = Math.max(1, Math.floor(allocatedBudget.maxIterations * 0.6));
    allocatedBudget.maxLatencyMs = Math.floor(allocatedBudget.maxLatencyMs * 0.5);
  }

  // Adjust for error cost
  if (value.errorCost > 0.8) {
    // Wrong answer is very costly - increase quality budget
    allocatedBudget.maxIterations = Math.min(15, allocatedBudget.maxIterations + 3);
    allocatedBudget.maxCostUSD *= 1.5;
  }

  const expectedQuality = estimateQuality(allocatedBudget, difficulty);
  const expectedLatency = estimateLatency(allocatedBudget);

  return {
    allocatedBudget,
    reasoning: generateAllocationReasoning(value, difficulty, baseBudget, allocatedBudget),
    expectedQuality,
    expectedLatency,
  };
}

function estimateQuality(budget: ComputeBudget, difficulty: number): number {
  // Simple heuristic: more iterations generally improve quality
  // But diminishing returns apply
  const baseQuality = 0.5; // Single-shot baseline
  const iterationBoost = Math.min(0.4, budget.maxIterations * 0.08); // Each iteration +8%, max +40%
  const difficultyPenalty = difficulty * 0.2; // Harder tasks start lower

  return Math.max(0, Math.min(1, baseQuality + iterationBoost - difficultyPenalty));
}

function estimateLatency(budget: ComputeBudget): number {
  // Estimate based on iterations (primary driver of latency)
  const msPerIteration = 5000; // Rough average
  return budget.maxIterations * msPerIteration;
}

function generateAllocationReasoning(
  value: TaskValue,
  difficulty: number,
  baseBudget: ComputeBudget,
  allocated: ComputeBudget
): string {
  const reasons: string[] = [];

  reasons.push(`Stakes: ${value.stakesLevel} → base budget ${baseBudget.maxIterations} iterations`);

  if (difficulty > 0.6) {
    reasons.push(`High difficulty (${(difficulty * 100).toFixed(0)}%) → increased budget`);
  } else if (difficulty < 0.3) {
    reasons.push(`Low difficulty (${(difficulty * 100).toFixed(0)}%) → reduced budget`);
  }

  if (value.timeValue > 0.8) {
    reasons.push(`Time-sensitive → reduced iterations for speed`);
  }

  if (value.errorCost > 0.8) {
    reasons.push(`High error cost → increased iterations for quality`);
  }

  reasons.push(
    `Allocated: ${allocated.maxIterations} iterations, ` +
      `$${allocated.maxCostUSD.toFixed(2)} budget, ` +
      `${(allocated.maxLatencyMs / 1000).toFixed(0)}s latency`
  );

  return reasons.join('. ');
}
```

### Practical Example: Dynamic Research Allocation

```typescript
async function conductResearch(query: string, context: ResearchContext): Promise<ResearchResult> {
  // Assess task characteristics
  const difficulty = estimateResearchDifficulty(query, context);
  const value: TaskValue = {
    stakesLevel: context.isMedicalOrFinancial ? 'critical' : 'medium',
    userValue: 0.8,
    errorCost: context.isMedicalOrFinancial ? 0.9 : 0.5,
    timeValue: context.isUrgent ? 0.9 : 0.4,
  };

  // Allocate compute budget
  const allocation = allocateCompute(
    { id: 'research', type: 'research', intent: query } as Task,
    value,
    difficulty
  );

  console.log(`Research allocation: ${allocation.reasoning}`);

  // Execute with allocated budget
  const result = await executeRefinementLoop(
    { id: 'research', type: 'research', intent: query } as Task,
    {
      maxIterations: allocation.allocatedBudget.maxIterations,
      costBudget: allocation.allocatedBudget.maxCostUSD,
      generator: () => generateResearch(query, context),
      evaluator: (c) => evaluateResearch(c, context),
      refiner: (c, f) => refineResearch(c, f, context),
      completionCriteria: (c, f) => {
        // Stricter criteria for high-stakes research
        const qualityThreshold = value.errorCost > 0.8 ? 0.9 : 0.8;
        return (
          f.score >= qualityThreshold && c.confidence >= 0.85 && !hasFabricatedCitations(c.output)
        );
      },
    }
  );

  return result;
}

function estimateResearchDifficulty(query: string, context: ResearchContext): number {
  let difficulty = 0.5; // Base

  // Increase for broad/vague queries
  if (query.length < 20 || !query.includes(' ')) {
    difficulty += 0.2;
  }

  // Increase for specialized domains
  const specializedTerms = ['quantum', 'neuroscience', 'cryptography', 'genomics'];
  if (specializedTerms.some((term) => query.toLowerCase().includes(term))) {
    difficulty += 0.3;
  }

  // Decrease if we have prior context
  if (context.priorResearch?.length > 0) {
    difficulty -= 0.2;
  }

  return Math.max(0, Math.min(1, difficulty));
}
```

### Cost-Accuracy Decision Matrix

```
For Each Task: Maximize (Accuracy × Value) - (Cost)

┌─────────────────────────────────────────────────────────────────┐
│ Compute Allocation Strategy                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  IF stakes = LOW && difficulty = LOW:                           │
│    → Minimal compute (1 iteration, fast model)                  │
│    → Expected accuracy: 60-70%                                  │
│    → Cost: $0.01                                                │
│                                                                  │
│  IF stakes = MEDIUM && difficulty = MEDIUM:                     │
│    → Balanced compute (2-3 iterations, standard model)          │
│    → Expected accuracy: 75-85%                                  │
│    → Cost: $0.05                                                │
│                                                                  │
│  IF stakes = HIGH || difficulty = HIGH:                         │
│    → Generous compute (4-5 iterations, best model)              │
│    → Expected accuracy: 85-92%                                  │
│    → Cost: $0.20                                                │
│                                                                  │
│  IF stakes = CRITICAL (medical, financial, safety):             │
│    → Maximum compute (5-10 iterations, best model + validation) │
│    → Expected accuracy: 92-98%                                  │
│    → Cost: $0.50-$1.00                                          │
│                                                                  │
│  OVERRIDE: If timeValue > 0.9 (user needs answer NOW):          │
│    → Reduce iterations by 50%, accept lower accuracy            │
│                                                                  │
│  OVERRIDE: If errorCost > 0.9 (wrong answer very costly):       │
│    → Increase iterations by 50%, invest in accuracy             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### ROI Calculation

```typescript
function calculateRefinementROI(
  currentQuality: number,
  expectedImprovement: number,
  taskValue: TaskValue,
  refinementCost: number
): number {
  // Value of improvement
  const qualityGain = expectedImprovement;
  const valueGain = qualityGain * taskValue.userValue;

  // Cost of being wrong
  const errorReduction = qualityGain * taskValue.errorCost;

  // Total benefit
  const totalBenefit = valueGain + errorReduction;

  // ROI = (Benefit - Cost) / Cost
  const roi = (totalBenefit - refinementCost) / refinementCost;

  return roi;
}

// Example usage
const currentQuality = 0.75;
const expectedImprovement = 0.1; // One more iteration might improve by 10%
const taskValue = {
  stakesLevel: 'high' as const,
  userValue: 0.8,
  errorCost: 0.7,
  timeValue: 0.5,
};
const refinementCost = 0.05; // $0.05

const roi = calculateRefinementROI(currentQuality, expectedImprovement, taskValue, refinementCost);

if (roi > 2.0) {
  console.log(`Strong ROI (${roi.toFixed(1)}x) - refine!`);
} else if (roi > 0.5) {
  console.log(`Positive ROI (${roi.toFixed(1)}x) - consider refining`);
} else {
  console.log(`Negative ROI (${roi.toFixed(1)}x) - stop refining`);
}
```

---

## 6. Integration with Claude Memory System

### Memory-Informed Refinement

The refinement patterns integrate with the three-tier memory architecture:

```typescript
interface MemoryInformedRefinement {
  fastMemory: RefinementState; // Current iteration state
  slowMemory: RefinementHistory[]; // Session-level refinement patterns
  archiveMemory: RefinementLearnings; // Long-term refinement strategies
}

interface RefinementState {
  currentCandidate: Candidate;
  currentFeedback: Feedback;
  iteration: number;
  costSoFar: number;
}

interface RefinementLearnings {
  successfulPatterns: Map<string, AdaptationStrategy>;
  failurePatterns: Map<string, string>; // What didn't work
  taskTypePreferences: Map<string, string>; // Which approach for which task type
  averageIterationsNeeded: Map<string, number>; // By task type
}
```

### Storing Refinement Insights

```typescript
async function storeRefinementInsights(
  result: RefinementResult,
  task: Task,
  memorySystem: MemorySystem
): Promise<void> {
  // Store in Slow Memory (session archive)
  await memorySystem.slowMemory.store({
    type: 'refinement_pattern',
    taskType: task.type,
    iterations: result.iterations,
    finalQuality: result.finalFeedback.score,
    terminationReason: result.terminationReason,
    costEfficiency: result.finalFeedback.score / result.totalCost,
    timestamp: Date.now(),
  });

  // If pattern is particularly successful, promote to Archive
  if (
    result.finalFeedback.score > 0.9 &&
    result.iterations <= 3 &&
    result.terminationReason === 'complete'
  ) {
    await memorySystem.archiveMemory.store({
      type: 'successful_refinement_pattern',
      taskType: task.type,
      strategy: extractStrategy(result.history),
      avgIterations: result.iterations,
      avgQuality: result.finalFeedback.score,
      importance: 0.8,
      tags: ['refinement', 'best-practice', task.type],
    });
  }

  // If pattern failed or was inefficient, learn from it
  if (
    result.terminationReason === 'cost_limit' ||
    result.terminationReason === 'diminishing_returns'
  ) {
    await memorySystem.archiveMemory.store({
      type: 'refinement_anti_pattern',
      taskType: task.type,
      issue: result.terminationReason,
      recommendation: generateRecommendation(result),
      importance: 0.6,
      tags: ['refinement', 'lesson-learned', task.type],
    });
  }
}
```

---

## 7. Practical Implementation Guide

### Step-by-Step Integration

**1. Start Simple: Add Basic Refinement Loop**

```typescript
// Before: Single-shot execution
const result = await executeTask(task);

// After: With refinement
const result = await executeRefinementLoop(task, {
  maxIterations: 3,
  generator: () => executeTask(task),
  evaluator: (c) => evaluateResult(c),
  refiner: (c, f) => improveResult(c, f),
  completionCriteria: (c, f) => f.score >= 0.8,
});
```

**2. Add Self-Auditing**

```typescript
const result = await executeRefinementLoop(task, {
  maxIterations: 5,
  generator: () => executeTask(task),
  evaluator: async (c) => {
    const feedback = await evaluateResult(c);
    const audit = await selfAudit(c, feedback, task, auditConfig);

    // Attach audit to feedback
    feedback.metadata = { audit };

    return feedback;
  },
  refiner: (c, f) => improveResult(c, f),
  completionCriteria: (c, f) => f.metadata?.audit?.isSatisfactory ?? false,
});
```

**3. Add Process Supervision (for multi-step tasks)**

```typescript
const trace = await executeWithProcessSupervision(
  task,
  [step1Function, step2Function, step3Function],
  {
    trackReasoningChain: true,
    provideStepFeedback: true,
    identifyKeySteps: true,
  }
);

// Use credit assignment to improve future executions
const criticalSteps = Array.from(trace.creditAssignment.entries()).filter(
  ([_, credit]) => credit > 0.3
);

console.log('Focus optimization on:', criticalSteps);
```

**4. Add Test-Time Adaptation**

```typescript
const adapter = new TestTimeAdapter();

// Register strategies
adapter.registerStrategy(fastIterationStrategy);
adapter.registerStrategy(thoroughRefinementStrategy);
adapter.registerStrategy(competitiveExplorationStrategy);

// Execute with automatic strategy selection
const result = await adapter.executeTask(task, priorExamples);
```

**5. Add Cost-Accuracy Optimization**

```typescript
const allocation = allocateCompute(
  task,
  {
    stakesLevel: determineStakes(task),
    userValue: estimateUserValue(task),
    errorCost: estimateErrorCost(task),
    timeValue: determineTimeValue(task),
  },
  estimateDifficulty(task)
);

const result = await executeRefinementLoop(task, {
  maxIterations: allocation.allocatedBudget.maxIterations,
  costBudget: allocation.allocatedBudget.maxCostUSD,
  // ... rest of config
});
```

### Complete Example: End-to-End Refinement System

```typescript
async function executeWithFullRefinement(
  task: Task,
  context: ExecutionContext
): Promise<RefinementResult> {
  // 1. Allocate compute based on task value and difficulty
  const difficulty = estimateDifficulty(task);
  const value = assessTaskValue(task, context);
  const allocation = allocateCompute(task, value, difficulty);

  console.log(`Compute allocation: ${allocation.reasoning}`);

  // 2. Select strategy based on task characteristics
  const adapter = context.testTimeAdapter;
  const strategy = adapter.selectStrategy(task, context.priorExamples);

  console.log(`Selected strategy: ${strategy.name}`);

  // 3. Execute with refinement loop
  const result = await executeRefinementLoop(task, {
    maxIterations: allocation.allocatedBudget.maxIterations,
    costBudget: allocation.allocatedBudget.maxCostUSD,

    generator: strategy.execute,

    evaluator: async (candidate) => {
      // Comprehensive evaluation
      const feedback = await evaluateCandidate(candidate, task);

      // Self-audit
      const audit = await selfAudit(candidate, feedback, task, {
        confidenceThreshold: 0.8,
        satisfactionThreshold: value.errorCost > 0.8 ? 0.9 : 0.8,
        maxRefinements: allocation.allocatedBudget.maxIterations,
        costPerRefinement:
          allocation.allocatedBudget.maxCostUSD / allocation.allocatedBudget.maxIterations,
      });

      feedback.metadata = { audit };
      return feedback;
    },

    refiner: async (candidate, feedback) => {
      // Refine based on feedback
      return await refineCandidate(candidate, feedback, task);
    },

    completionCriteria: (candidate, feedback) => {
      const audit = feedback.metadata?.audit as SelfAudit;
      return audit?.isSatisfactory ?? false;
    },
  });

  // 4. Store learnings in memory system
  await storeRefinementInsights(result, task, context.memorySystem);

  // 5. Update adapter with example
  adapter.learnFromExample({
    input: task,
    expectedOutput: result.finalCandidate.output,
    approach: strategy.name,
    feedback: `${result.iterations} iterations, quality ${(result.finalFeedback.score * 100).toFixed(0)}%`,
  });

  return result;
}
```

---

## 8. Metrics and Monitoring

### Track Refinement Effectiveness

```typescript
interface RefinementMetrics {
  // Effectiveness
  averageQualityImprovement: number; // Per iteration
  firstPassSuccessRate: number; // % complete in 1 iteration
  averageIterationsToComplete: number;

  // Efficiency
  averageCostPerTask: number;
  costEfficiency: number; // Quality / cost
  diminishingReturnsThreshold: number; // Iteration where gains < 5%

  // Accuracy
  selfAuditAccuracy: number; // How often self-audit matches reality
  strategySelectionAccuracy: number; // How often we pick the best strategy

  // By task type
  metricsByTaskType: Map<string, RefinementMetrics>;
}

class RefinementMetricsTracker {
  private metrics: RefinementMetrics;

  recordResult(result: RefinementResult, task: Task): void {
    // Track quality improvement per iteration
    const improvements = result.history.map((h, i) => {
      if (i === 0) return 0;
      return h.feedback.score - result.history[i - 1].feedback.score;
    });

    const avgImprovement = improvements.reduce((sum, v) => sum + v, 0) / improvements.length;
    this.metrics.averageQualityImprovement =
      (this.metrics.averageQualityImprovement + avgImprovement) / 2;

    // Track first-pass success
    if (result.iterations === 1 && result.terminationReason === 'complete') {
      this.metrics.firstPassSuccessRate += 0.01; // Incremental update
    }

    // Track iterations to complete
    if (result.terminationReason === 'complete') {
      const currentAvg = this.metrics.averageIterationsToComplete;
      this.metrics.averageIterationsToComplete = (currentAvg + result.iterations) / 2;
    }

    // Track cost efficiency
    const efficiency = result.finalFeedback.score / result.totalCost;
    this.metrics.costEfficiency = (this.metrics.costEfficiency + efficiency) / 2;

    // By task type
    if (!this.metrics.metricsByTaskType.has(task.type)) {
      this.metrics.metricsByTaskType.set(task.type, this.createEmptyMetrics());
    }
    // ... similar tracking by task type
  }

  getDashboard(): RefinementDashboard {
    return {
      overall: this.metrics,
      recommendations: this.generateRecommendations(),
      trends: this.analyzeTrends(),
    };
  }

  private generateRecommendations(): string[] {
    const recs: string[] = [];

    if (this.metrics.averageIterationsToComplete > 4) {
      recs.push('High average iterations - consider improving initial generation quality');
    }

    if (this.metrics.firstPassSuccessRate < 0.3) {
      recs.push('Low first-pass success rate - investigate why initial outputs fail');
    }

    if (this.metrics.costEfficiency < 0.5) {
      recs.push('Low cost efficiency - refinement may not be worth the cost');
    }

    return recs;
  }
}
```

---

## 9. Anti-Patterns and Pitfalls

### Common Mistakes to Avoid

**❌ Anti-Pattern 1: The Infinite Refiner**

- Symptom: Refinement loops never terminate
- Cause: No clear completion criteria or budget limits
- Fix: Always set `maxIterations` and `costBudget`

**❌ Anti-Pattern 2: The False Improvement**

- Symptom: Quality score increases but actual quality doesn't
- Cause: Evaluation function is too lenient or gameable
- Fix: Use objective metrics, external validation, real tests

**❌ Anti-Pattern 3: The Premature Stopper**

- Symptom: Refinement stops after 1 iteration even when quality is low
- Cause: Completion criteria too loose
- Fix: Require both score threshold AND confidence threshold AND no critical issues

**❌ Anti-Pattern 4: The Cost Ignorer**

- Symptom: Refinement runs forever, massive token consumption
- Cause: No cost tracking or budget enforcement
- Fix: Track costs in real-time, stop when budget exhausted

**❌ Anti-Pattern 5: The Strategy Ignorer**

- Symptom: Same approach for all tasks regardless of characteristics
- Cause: No test-time adaptation
- Fix: Implement strategy selection based on task properties

**❌ Anti-Pattern 6: The Memory Amnesiac**

- Symptom: Making the same mistakes repeatedly
- Cause: Not storing refinement learnings
- Fix: Record what worked/didn't work in memory system

---

## 10. References and Further Reading

### Research Foundations

1. **Poetiq Study**: Model-agnostic refinement harness achieving 31% → 54% improvement
   - Key finding: Iterative refinement with self-auditing outperforms single-shot
   - Application: Generate-evaluate-refine cycles

2. **Process Reward Models (PRMs)**: Per-step feedback vs outcome-only
   - Key finding: Step-by-step credit assignment improves learning
   - Application: Process supervision interface

3. **Test-Time Compute**: Variable compute allocation per task
   - Key finding: Adapting compute to task difficulty improves ROI
   - Application: Dynamic strategy selection and budget allocation

4. **Code-Based Agents**: 30% fewer steps than JSON approaches
   - Key finding: Code provides more structured, debuggable reasoning
   - Application: Prefer code interfaces for agent coordination

### Related Documentation

- `/home/user/Sartor-claude-network/EXECUTIVE_CLAUDE.md` - Orchestration patterns
- `/home/user/Sartor-claude-network/UPLIFTED_SKILLS.md` - Evidence-based principles
- `/home/user/Sartor-claude-network/MEMORY_SYSTEM_SPEC.md` - Memory architecture
- `/home/user/Sartor-claude-network/src/skills/multi-agent-orchestration.ts` - Implementation

---

## Appendix: Quick Reference

### Refinement Loop Checklist

When implementing refinement for any task:

- [ ] Define clear `generate` function (initial solution)
- [ ] Define objective `evaluate` function (not just vibes)
- [ ] Define targeted `refine` function (uses feedback)
- [ ] Set `completionCriteria` (quality + confidence + no critical issues)
- [ ] Set `maxIterations` (typically 3-5)
- [ ] Set `costBudget` (prevent runaway costs)
- [ ] Track `history` (learn from iterations)
- [ ] Check for `diminishingReturns` (stop when improvement < threshold)
- [ ] Store learnings in memory system
- [ ] Monitor metrics over time

### Self-Audit Checklist

- [ ] Check quality score >= threshold
- [ ] Check confidence >= threshold (both candidate AND feedback)
- [ ] Identify remaining gaps
- [ ] Assess potential risks
- [ ] Check for critical issues (blockers)
- [ ] Calculate ROI of further refinement
- [ ] Generate clear reasoning for decision

### Strategy Selection Checklist

- [ ] Estimate task difficulty
- [ ] Assess task value (stakes, error cost, time sensitivity)
- [ ] Check for similar prior examples
- [ ] Calculate applicability scores for each strategy
- [ ] Select highest-scoring strategy
- [ ] Log selection reasoning
- [ ] Store example for future learning

### Cost Allocation Checklist

- [ ] Determine stakes level (low/medium/high/critical)
- [ ] Estimate difficulty (0-1)
- [ ] Assess error cost (what if we get it wrong?)
- [ ] Assess time value (how urgent?)
- [ ] Allocate base budget for stakes level
- [ ] Adjust for difficulty (multiply by 0.5x to 2x)
- [ ] Adjust for time sensitivity (reduce iterations if urgent)
- [ ] Adjust for error cost (increase iterations if costly)
- [ ] Log allocation reasoning

---

**Document Status:** Production Ready
**Next Review:** After 50 refinement loop executions
**Feedback:** Report learnings to improve this guide

---

_"The best solution isn't the first solution - it's the solution you've refined until it's actually good enough."_

_- Refinement Patterns Philosophy_
