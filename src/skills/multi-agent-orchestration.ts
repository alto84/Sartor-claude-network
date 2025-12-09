/**
 * Multi-Agent Orchestration Skill
 *
 * Design coordination strategies for multiple agents that preserve independent
 * reasoning while enabling collaborative problem-solving, without fabricating
 * artificial consensus.
 *
 * Core mechanism: Refinement Loops - iterative improvement through generate-evaluate-refine cycles
 *
 * Based on principles from UPLIFTED_SKILLS.md and EXECUTIVE_CLAUDE.md:
 * - Specialization Over Uniformity
 * - Disagreement Preservation Over Consensus Forcing
 * - Coordination Overhead is Real
 * - Independence Validates Findings
 * - Intent-Based Delegation
 * - Iterative Refinement Over Single-Shot Execution
 */

import { createAgentCommunicationSystem, type AgentMessage } from './agent-communication';

// ============================================================================
// Refinement Loop Interfaces
// ============================================================================

export interface Candidate {
  id: string;
  output: any;
  confidence: number;
  reasoning?: string;
  metadata?: Record<string, any>;
}

export interface Feedback {
  score: number; // 0-1, how good is the candidate
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  criticalIssues?: string[];
  confidence: number; // Evaluator's confidence in this feedback
}

export interface RefinementLoop<T = any> {
  maxIterations: number;
  currentIteration: number;
  generate: () => Promise<Candidate>;
  evaluate: (candidate: Candidate) => Promise<Feedback>;
  refine: (candidate: Candidate, feedback: Feedback) => Promise<Candidate>;
  isComplete: (candidate: Candidate, feedback: Feedback) => boolean;
  history: RefinementHistory[];
  costBudget?: number; // Max cost in arbitrary units
  costAccumulated: number;
}

export interface RefinementHistory {
  iteration: number;
  candidate: Candidate;
  feedback: Feedback;
  timestamp: number;
  costIncurred: number;
}

export interface RefinementResult {
  finalCandidate: Candidate;
  finalFeedback: Feedback;
  iterations: number;
  history: RefinementHistory[];
  terminationReason: 'complete' | 'max_iterations' | 'cost_limit' | 'diminishing_returns';
  totalCost: number;
}

// ============================================================================
// Self-Auditing Interfaces
// ============================================================================

export interface SelfAudit {
  isSatisfactory: boolean;
  confidence: number; // How confident are we that solution is satisfactory
  gaps: string[]; // What's missing or could be improved
  risks: string[]; // What could go wrong
  shouldRefine: boolean; // Trigger more refinement?
  reasoning: string;
}

export interface AuditConfig {
  confidenceThreshold: number; // Below this, trigger refinement
  satisfactionThreshold: number; // Quality threshold for "good enough"
  maxRefinements: number; // Don't refine forever
  costPerRefinement: number; // Cost of each refinement iteration
}

// ============================================================================
// Process Supervision Interfaces
// ============================================================================

export interface ProcessStep {
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

export interface ProcessTrace {
  taskId: string;
  steps: ProcessStep[];
  overallSuccess: boolean;
  overallConfidence: number;
  creditAssignment: Map<string, number>; // Which steps contributed most
}

export interface SupervisionConfig {
  trackReasoningChain: boolean; // Track step-by-step reasoning
  provideStepFeedback: boolean; // Give feedback per step
  identifyKeySteps: boolean; // Credit assignment
}

// ============================================================================
// Test-Time Adaptation Interfaces
// ============================================================================

export interface TaskExample {
  input: any;
  expectedOutput?: any;
  approach: string; // What strategy worked
  feedback?: string;
}

export interface AdaptationStrategy {
  name: string;
  applicability: (task: Task) => number; // 0-1, how applicable
  execute: (task: Task) => Promise<TaskResult>;
  examples: TaskExample[];
}

export interface TestTimeAdapter {
  strategies: AdaptationStrategy[];
  selectStrategy: (task: Task, examples?: TaskExample[]) => AdaptationStrategy;
  learnFromExample: (example: TaskExample) => void;
}

// ============================================================================
// Core Interfaces
// ============================================================================

export interface Orchestrator {
  id: string;
  activeWorkers: Map<string, WorkerStatus>;
  taskQueue: Task[];
  completedTasks: TaskResult[];
  messageBus: any; // Communication system for inter-agent messaging
}

export interface Task {
  id: string;
  type: string;
  intent: string; // What outcome is expected (not how)
  constraints: string[];
  deadline?: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  dependencies: string[]; // Task IDs that must complete first
  scope?: {
    included: string[];
    excluded: string[];
  };
  successCriteria?: string[];
  context?: string; // Minimal essential context
}

export interface WorkerStatus {
  id: string;
  specialization: string;
  currentTask?: string;
  status: 'idle' | 'busy' | 'error' | 'offline';
  metrics: WorkerMetrics;
}

export interface WorkerMetrics {
  tasksCompleted: number;
  taskseFailed: number;
  averageCompletionTimeMs: number;
  successRate: number;
  lastActiveAt: number;
}

export interface Worker {
  id: string;
  specialization: string;
  capabilities: string[];
  status: WorkerStatus;
  execute: (task: Task) => Promise<TaskResult>;
}

export interface TaskResult {
  taskId: string;
  workerId: string;
  success: boolean;
  output: any;
  confidence: number; // 0-1, how confident is the worker in this result
  reasoning?: string;
  alternativesConsidered?: string[];
  issues?: string[];
  metrics?: {
    startedAt: number;
    completedAt: number;
    durationMs: number;
  };
  error?: string;
}

export interface DelegationResult {
  success: boolean;
  taskId: string;
  assignedWorker?: string;
  queuePosition?: number;
  estimatedStartTime?: number;
  error?: string;
}

export interface WorkerAssignment {
  worker: Worker;
  matchScore: number; // 0-1, how well does worker match task
  reasoning: string;
  alternatives: Array<{ workerId: string; score: number }>;
}

export interface SynthesizedOutput {
  results: TaskResult[];
  synthesis: string;
  insights: string[]; // Emergent insights from combining results
  conflicts: Conflict[];
  confidence: number; // NOT averaged - based on agreement and evidence
  recommendations: string[];
  refinementMetadata?: {
    iterations: number;
    terminationReason: 'complete' | 'max_iterations' | 'cost_limit' | 'diminishing_returns';
    totalCost: number;
    finalScore: number;
  };
}

export interface Conflict {
  type: 'disagreement' | 'contradiction' | 'uncertainty';
  workers: string[];
  description: string;
  resolution?: string; // Only if conflict can be resolved with evidence
  preserved: boolean; // true if conflict indicates legitimate boundary
}

export interface RecoveryAction {
  action: 'retry' | 'reassign' | 'skip' | 'escalate';
  reasoning: string;
  newAssignment?: string; // Worker ID if reassigning
  delay?: number; // Delay before retry (ms)
  feedback?: Feedback; // Feedback from failure analysis for refinement
}

export interface OrchestratorConfig {
  id: string;
  maxConcurrentTasks?: number;
  defaultTimeout?: number;
  messageBusConfig?: any;
}

// ============================================================================
// Delegation Patterns
// ============================================================================

export enum DelegationPattern {
  PARALLEL_FAN_OUT = 'parallel-fan-out', // Independent tasks run simultaneously
  SERIAL_CHAIN = 'serial-chain', // Dependent tasks in sequence
  RECURSIVE_DECOMPOSITION = 'recursive-decomposition', // Break complex into subtasks
  COMPETITIVE_EXPLORATION = 'competitive-exploration', // Multiple approaches in parallel
}

export interface DelegationStrategy {
  pattern: DelegationPattern;
  tasks: Task[];
  expectedParallelism: number; // How many tasks can run simultaneously
  coordinationOverhead: number; // Estimated overhead (0-1)
}

// ============================================================================
// Orchestrator Implementation
// ============================================================================

export class MultiAgentOrchestrator {
  private orchestrator: Orchestrator;
  private workers: Map<string, Worker>;
  private config: Required<OrchestratorConfig>;
  private auditConfig: AuditConfig;
  private supervisionConfig: SupervisionConfig;
  private testTimeAdapter: TestTimeAdapter;
  private processSupervisor: Map<string, ProcessTrace>; // taskId -> trace

  constructor(config: OrchestratorConfig) {
    this.config = {
      maxConcurrentTasks: config.maxConcurrentTasks ?? 5,
      defaultTimeout: config.defaultTimeout ?? 30000,
      messageBusConfig: config.messageBusConfig ?? {},
      ...config,
    };

    this.orchestrator = {
      id: config.id,
      activeWorkers: new Map(),
      taskQueue: [],
      completedTasks: [],
      messageBus: createAgentCommunicationSystem(),
    };

    this.workers = new Map();

    // Initialize refinement subsystems
    this.auditConfig = {
      confidenceThreshold: 0.7,
      satisfactionThreshold: 0.8,
      maxRefinements: 5,
      costPerRefinement: 1.0,
    };

    this.supervisionConfig = {
      trackReasoningChain: true,
      provideStepFeedback: true,
      identifyKeySteps: true,
    };

    this.testTimeAdapter = this._createTestTimeAdapter();
    this.processSupervisor = new Map();
  }

  /**
   * Register a worker with the orchestrator
   */
  registerWorker(worker: Worker): void {
    this.workers.set(worker.id, worker);
    this.orchestrator.activeWorkers.set(worker.id, worker.status);
  }

  /**
   * Unregister a worker
   */
  unregisterWorker(workerId: string): void {
    this.workers.delete(workerId);
    this.orchestrator.activeWorkers.delete(workerId);
  }

  /**
   * Delegate a task using intent-based delegation with refinement loop
   *
   * Quality gate: Validate task intent is clear before delegation
   * Core mechanism: Run refinement loop to iteratively improve result
   */
  async delegateTask(task: Task): Promise<DelegationResult> {
    // Quality gate: Validate intent is clear
    const intentValidation = this._validateIntent(task);
    if (!intentValidation.valid) {
      return {
        success: false,
        taskId: task.id,
        error: `Task intent validation failed: ${intentValidation.errors.join(', ')}`,
      };
    }

    // Check dependencies are satisfied
    const dependenciesMet = this._checkDependencies(task);
    if (!dependenciesMet.satisfied) {
      return {
        success: false,
        taskId: task.id,
        error: `Dependencies not satisfied: ${dependenciesMet.missing.join(', ')}`,
      };
    }

    // Find best worker for task
    const assignment = this.assignWorker(task, Array.from(this.workers.values()));
    if (!assignment) {
      return {
        success: false,
        taskId: task.id,
        error: 'No suitable worker found for task',
      };
    }

    // Quality gate: Check worker capacity before assignment
    const capacityCheck = this._checkWorkerCapacity(assignment.worker);
    if (!capacityCheck.available) {
      // Queue task if worker busy
      this.orchestrator.taskQueue.push(task);
      return {
        success: true,
        taskId: task.id,
        queuePosition: this.orchestrator.taskQueue.length,
        estimatedStartTime: Date.now() + capacityCheck.estimatedWaitMs,
      };
    }

    // Assign task to worker and execute with refinement loop
    assignment.worker.status.currentTask = task.id;
    assignment.worker.status.status = 'busy';

    // Execute task with refinement loop
    try {
      const refinementResult = await this._executeTaskWithRefinement(task, assignment.worker);

      // Update worker status
      assignment.worker.status.currentTask = undefined;
      assignment.worker.status.status = 'idle';
      assignment.worker.status.metrics.tasksCompleted++;
      assignment.worker.status.metrics.lastActiveAt = Date.now();

      return {
        success: true,
        taskId: task.id,
        assignedWorker: assignment.worker.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      assignment.worker.status.status = 'error';
      assignment.worker.status.metrics.taskseFailed++;

      return {
        success: false,
        taskId: task.id,
        error: `Task execution with refinement failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Assign a task to the best-matching worker
   *
   * Principle: Specialization improves quality
   */
  assignWorker(task: Task, workers: Worker[]): WorkerAssignment | null {
    if (workers.length === 0) return null;

    const scores = workers.map((worker) => {
      const score = this._calculateWorkerMatchScore(task, worker);
      return { worker, score };
    });

    // Sort by match score (highest first)
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    if (best.score < 0.3) {
      // No worker is a good match
      return null;
    }

    const alternatives = scores.slice(1, 4).map((s) => ({ workerId: s.worker.id, score: s.score }));

    return {
      worker: best.worker,
      matchScore: best.score,
      reasoning: this._generateAssignmentReasoning(task, best.worker, best.score),
      alternatives,
    };
  }

  /**
   * Synthesize results from multiple workers with iterative refinement
   *
   * Principle: Preserve disagreement, don't force consensus
   * Quality gate: Validate results match task intent before synthesis
   * Core mechanism: Use refinement loop to improve synthesis quality
   */
  async synthesizeResults(results: TaskResult[]): Promise<SynthesizedOutput> {
    if (results.length === 0) {
      return {
        results: [],
        synthesis: 'No results to synthesize',
        insights: [],
        conflicts: [],
        confidence: 0,
        recommendations: [],
      };
    }

    // Create refinement loop for synthesis
    const refinementLoop = this._createSynthesisRefinementLoop(results);

    // Run refinement to improve synthesis
    const refinementResult = await this._runRefinementLoop(refinementLoop);

    // Extract final synthesis from refined candidate
    const finalSynthesis = refinementResult.finalCandidate.output as SynthesizedOutput;

    // Add refinement metadata
    return {
      ...finalSynthesis,
      results, // Original results
      refinementMetadata: {
        iterations: refinementResult.iterations,
        terminationReason: refinementResult.terminationReason,
        totalCost: refinementResult.totalCost,
        finalScore: refinementResult.finalFeedback.score,
      },
    };
  }

  /**
   * Handle worker failure with graceful recovery using refinement with feedback
   *
   * Principle: Coordination overhead is real - measure and handle failures
   * Core mechanism: Use failure feedback to refine approach
   */
  async handleWorkerFailure(workerId: string, error: Error, task?: Task): Promise<RecoveryAction> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return {
        action: 'escalate',
        reasoning: `Worker ${workerId} not found in registry`,
      };
    }

    // Update worker status
    worker.status.status = 'error';
    worker.status.metrics.taskseFailed++;

    // Create failure feedback for refinement
    const failureFeedback: Feedback = {
      score: 0,
      strengths: [],
      weaknesses: [`Task execution failed: ${error.message}`],
      suggestions: this._generateFailureRecoverySuggestions(error),
      criticalIssues: [error.message],
      confidence: 0.9, // High confidence in failure diagnosis
    };

    // Determine recovery strategy based on failure pattern
    const failureRate =
      worker.status.metrics.taskseFailed /
      (worker.status.metrics.tasksCompleted + worker.status.metrics.taskseFailed);

    if (failureRate > 0.5) {
      // Worker is consistently failing - take offline
      worker.status.status = 'offline';
      return {
        action: 'reassign',
        reasoning: `Worker ${workerId} has high failure rate (${(failureRate * 100).toFixed(1)}%), reassigning task with failure feedback`,
        newAssignment: this._findAlternativeWorker(workerId, worker.specialization),
        feedback: failureFeedback, // Pass feedback to next worker
      };
    }

    if (worker.status.metrics.taskseFailed < 3 && task) {
      // Transient failure - retry with refinement
      return {
        action: 'retry',
        reasoning: `Transient failure for worker ${workerId}, retrying with refinement based on failure feedback`,
        delay: 1000 * Math.pow(2, worker.status.metrics.taskseFailed - 1),
        feedback: failureFeedback, // Use feedback to refine retry approach
      };
    }

    // Multiple failures but not consistent - reassign with feedback
    return {
      action: 'reassign',
      reasoning: `Worker ${workerId} has failed ${worker.status.metrics.taskseFailed} times, reassigning with failure analysis`,
      newAssignment: this._findAlternativeWorker(workerId, worker.specialization),
      feedback: failureFeedback,
    };
  }

  /**
   * Execute a task with a delegation pattern
   */
  async executeWithPattern(tasks: Task[], pattern: DelegationPattern): Promise<SynthesizedOutput> {
    const strategy = this._createDelegationStrategy(tasks, pattern);
    const results: TaskResult[] = [];

    switch (pattern) {
      case DelegationPattern.PARALLEL_FAN_OUT:
        // Execute all tasks in parallel
        const parallelResults = await Promise.all(tasks.map((task) => this._executeTask(task)));
        results.push(...parallelResults);
        break;

      case DelegationPattern.SERIAL_CHAIN:
        // Execute tasks sequentially
        for (const task of tasks) {
          const result = await this._executeTask(task);
          results.push(result);
          if (!result.success) {
            // Stop chain on failure
            break;
          }
        }
        break;

      case DelegationPattern.RECURSIVE_DECOMPOSITION:
        // Execute root task, then decompose and execute subtasks
        const rootTask = tasks[0];
        const rootResult = await this._executeTask(rootTask);
        results.push(rootResult);

        if (rootResult.success && rootResult.output?.subtasks) {
          const subtaskSynthesis = await this.executeWithPattern(
            rootResult.output.subtasks,
            DelegationPattern.PARALLEL_FAN_OUT
          );
          results.push(...subtaskSynthesis.results);
        }
        break;

      case DelegationPattern.COMPETITIVE_EXPLORATION:
        // Execute all tasks in parallel and compare approaches
        const competitiveResults = await Promise.all(tasks.map((task) => this._executeTask(task)));
        results.push(...competitiveResults);
        break;
    }

    return this.synthesizeResults(results);
  }

  /**
   * Get orchestrator status
   */
  getStatus(): {
    orchestratorId: string;
    activeWorkers: number;
    queuedTasks: number;
    completedTasks: number;
    workers: WorkerStatus[];
  } {
    return {
      orchestratorId: this.orchestrator.id,
      activeWorkers: Array.from(this.orchestrator.activeWorkers.values()).filter(
        (w) => w.status === 'busy'
      ).length,
      queuedTasks: this.orchestrator.taskQueue.length,
      completedTasks: this.orchestrator.completedTasks.length,
      workers: Array.from(this.orchestrator.activeWorkers.values()),
    };
  }

  /**
   * Get process trace for a task (process supervision)
   */
  getProcessTrace(taskId: string): ProcessTrace | undefined {
    return this.processSupervisor.get(taskId);
  }

  /**
   * Configure audit settings
   */
  configureAudit(config: Partial<AuditConfig>): void {
    this.auditConfig = { ...this.auditConfig, ...config };
  }

  /**
   * Configure supervision settings
   */
  configureSupervision(config: Partial<SupervisionConfig>): void {
    this.supervisionConfig = { ...this.supervisionConfig, ...config };
  }

  /**
   * Learn from task example (test-time adaptation)
   */
  learnFromExample(example: TaskExample): void {
    this.testTimeAdapter.learnFromExample(example);
  }

  /**
   * Get available adaptation strategies
   */
  getAdaptationStrategies(): AdaptationStrategy[] {
    return this.testTimeAdapter.strategies;
  }

  // ============================================================================
  // Refinement Loop Implementation
  // ============================================================================

  /**
   * Run a refinement loop to iteratively improve a candidate
   */
  private async _runRefinementLoop(loop: RefinementLoop): Promise<RefinementResult> {
    let currentCandidate = await loop.generate();
    let currentFeedback = await loop.evaluate(currentCandidate);

    loop.history.push({
      iteration: loop.currentIteration,
      candidate: currentCandidate,
      feedback: currentFeedback,
      timestamp: Date.now(),
      costIncurred: this.auditConfig.costPerRefinement,
    });

    loop.costAccumulated += this.auditConfig.costPerRefinement;

    while (loop.currentIteration < loop.maxIterations) {
      // Check termination conditions
      if (loop.isComplete(currentCandidate, currentFeedback)) {
        return {
          finalCandidate: currentCandidate,
          finalFeedback: currentFeedback,
          iterations: loop.currentIteration + 1,
          history: loop.history,
          terminationReason: 'complete',
          totalCost: loop.costAccumulated,
        };
      }

      // Cost limit check
      if (loop.costBudget && loop.costAccumulated >= loop.costBudget) {
        return {
          finalCandidate: currentCandidate,
          finalFeedback: currentFeedback,
          iterations: loop.currentIteration + 1,
          history: loop.history,
          terminationReason: 'cost_limit',
          totalCost: loop.costAccumulated,
        };
      }

      // Check for diminishing returns
      if (this._detectDiminishingReturns(loop.history)) {
        return {
          finalCandidate: currentCandidate,
          finalFeedback: currentFeedback,
          iterations: loop.currentIteration + 1,
          history: loop.history,
          terminationReason: 'diminishing_returns',
          totalCost: loop.costAccumulated,
        };
      }

      // Refine
      loop.currentIteration++;
      currentCandidate = await loop.refine(currentCandidate, currentFeedback);
      currentFeedback = await loop.evaluate(currentCandidate);

      loop.history.push({
        iteration: loop.currentIteration,
        candidate: currentCandidate,
        feedback: currentFeedback,
        timestamp: Date.now(),
        costIncurred: this.auditConfig.costPerRefinement,
      });

      loop.costAccumulated += this.auditConfig.costPerRefinement;
    }

    // Max iterations reached
    return {
      finalCandidate: currentCandidate,
      finalFeedback: currentFeedback,
      iterations: loop.currentIteration + 1,
      history: loop.history,
      terminationReason: 'max_iterations',
      totalCost: loop.costAccumulated,
    };
  }

  /**
   * Execute a task with refinement loop
   */
  private async _executeTaskWithRefinement(task: Task, worker: Worker): Promise<RefinementResult> {
    const processTrace: ProcessTrace = {
      taskId: task.id,
      steps: [],
      overallSuccess: false,
      overallConfidence: 0,
      creditAssignment: new Map(),
    };

    // Initialize process supervision if enabled
    if (this.supervisionConfig.trackReasoningChain) {
      this.processSupervisor.set(task.id, processTrace);
    }

    // Create refinement loop for task execution
    const refinementLoop: RefinementLoop = {
      maxIterations: this.auditConfig.maxRefinements,
      currentIteration: 0,
      history: [],
      costAccumulated: 0,
      costBudget: this.auditConfig.maxRefinements * this.auditConfig.costPerRefinement,

      generate: async () => {
        const result = await worker.execute(task);

        // Track process step
        if (this.supervisionConfig.trackReasoningChain) {
          const step: ProcessStep = {
            stepId: `step-${processTrace.steps.length}`,
            description: `Execute task: ${task.intent}`,
            input: task,
            output: result,
            success: result.success,
            confidence: result.confidence,
            reasoning: result.reasoning || '',
            timestamp: Date.now(),
          };
          processTrace.steps.push(step);
        }

        return {
          id: `candidate-${Date.now()}`,
          output: result,
          confidence: result.confidence,
          reasoning: result.reasoning,
        };
      },

      evaluate: async (candidate: Candidate) => {
        const result = candidate.output as TaskResult;

        // Self-audit the result
        const audit = await this._performSelfAudit(result, task);

        // Provide step feedback if enabled
        if (this.supervisionConfig.provideStepFeedback && processTrace.steps.length > 0) {
          const lastStep = processTrace.steps[processTrace.steps.length - 1];
          lastStep.feedback = {
            score: audit.confidence,
            strengths: audit.gaps.length === 0 ? ['All success criteria met'] : [],
            weaknesses: audit.gaps,
            suggestions: audit.risks,
            confidence: audit.confidence,
          };
        }

        return {
          score: audit.isSatisfactory ? audit.confidence : audit.confidence * 0.5,
          strengths: result.success ? ['Task completed successfully'] : [],
          weaknesses: audit.gaps,
          suggestions: audit.risks,
          criticalIssues: result.error ? [result.error] : undefined,
          confidence: audit.confidence,
        };
      },

      refine: async (candidate: Candidate, feedback: Feedback) => {
        // Create refined task with feedback incorporated
        const refinedTask: Task = {
          ...task,
          context: `${task.context || ''}\n\nRefinement feedback:\n${feedback.suggestions.join('\n')}`,
          constraints: [...task.constraints, ...feedback.weaknesses.map((w) => `Address: ${w}`)],
        };

        const result = await worker.execute(refinedTask);

        // Track refinement step
        if (this.supervisionConfig.trackReasoningChain) {
          const step: ProcessStep = {
            stepId: `step-${processTrace.steps.length}`,
            description: `Refine based on feedback`,
            input: refinedTask,
            output: result,
            success: result.success,
            confidence: result.confidence,
            reasoning: `Incorporated feedback: ${feedback.suggestions.join(', ')}`,
            timestamp: Date.now(),
            feedback,
          };
          processTrace.steps.push(step);
        }

        return {
          id: `candidate-${Date.now()}`,
          output: result,
          confidence: result.confidence,
          reasoning: result.reasoning,
        };
      },

      isComplete: (candidate: Candidate, feedback: Feedback) => {
        const result = candidate.output as TaskResult;

        // Complete if result is successful and passes self-audit
        return (
          result.success &&
          feedback.score >= this.auditConfig.satisfactionThreshold &&
          candidate.confidence >= this.auditConfig.confidenceThreshold
        );
      },
    };

    const refinementResult = await this._runRefinementLoop(refinementLoop);

    // Perform credit assignment if enabled
    if (this.supervisionConfig.identifyKeySteps) {
      this._performCreditAssignment(processTrace);
    }

    // Store final process trace
    if (this.supervisionConfig.trackReasoningChain) {
      processTrace.overallSuccess = (refinementResult.finalCandidate.output as TaskResult).success;
      processTrace.overallConfidence = refinementResult.finalFeedback.score;
      this.processSupervisor.set(task.id, processTrace);
    }

    // Store result in completed tasks
    const finalResult = refinementResult.finalCandidate.output as TaskResult;
    this.orchestrator.completedTasks.push(finalResult);

    return refinementResult;
  }

  /**
   * Create a refinement loop for synthesis
   */
  private _createSynthesisRefinementLoop(results: TaskResult[]): RefinementLoop {
    return {
      maxIterations: 3, // Fewer iterations for synthesis
      currentIteration: 0,
      history: [],
      costAccumulated: 0,
      costBudget: 3 * this.auditConfig.costPerRefinement,

      generate: async () => {
        // Initial synthesis
        const conflicts = this._identifyConflicts(results);
        const insights = this._extractInsights(results);
        const synthesis = this._generateSynthesis(results, conflicts, insights);
        const confidence = this._calculateSynthesisConfidence(results, conflicts);
        const recommendations = this._generateRecommendations(results, conflicts, insights);

        return {
          id: `synthesis-${Date.now()}`,
          output: {
            results,
            synthesis,
            insights,
            conflicts,
            confidence,
            recommendations,
          },
          confidence,
        };
      },

      evaluate: async (candidate: Candidate) => {
        const synthesis = candidate.output as SynthesizedOutput;

        // Evaluate synthesis quality
        const hasConflicts = synthesis.conflicts.length > 0;
        const hasInsights = synthesis.insights.length > 0;
        const hasRecommendations = synthesis.recommendations.length > 0;

        const score =
          (hasInsights ? 0.4 : 0) +
          (hasRecommendations ? 0.3 : 0) +
          (synthesis.confidence > 0.7 ? 0.3 : 0);

        const weaknesses: string[] = [];
        if (!hasInsights) weaknesses.push('Missing emergent insights from results');
        if (!hasRecommendations) weaknesses.push('Missing actionable recommendations');
        if (synthesis.confidence < 0.7) weaknesses.push('Low overall confidence in synthesis');

        return {
          score,
          strengths: [
            hasInsights && 'Contains emergent insights',
            hasConflicts && 'Preserves disagreements',
            hasRecommendations && 'Provides recommendations',
          ].filter(Boolean) as string[],
          weaknesses,
          suggestions: weaknesses.map((w) => `Improve: ${w}`),
          confidence: 0.8,
        };
      },

      refine: async (candidate: Candidate, feedback: Feedback) => {
        const synthesis = candidate.output as SynthesizedOutput;

        // Refine insights
        const refinedInsights = [
          ...synthesis.insights,
          ...this._extractDeeperInsights(results, synthesis.conflicts),
        ];

        // Refine recommendations
        const refinedRecommendations = [...synthesis.recommendations, ...feedback.suggestions];

        return {
          id: `synthesis-${Date.now()}`,
          output: {
            ...synthesis,
            insights: refinedInsights,
            recommendations: refinedRecommendations,
            synthesis: `${synthesis.synthesis}. Refined analysis reveals: ${refinedInsights.join('; ')}`,
          },
          confidence: Math.min(1, synthesis.confidence + 0.1),
        };
      },

      isComplete: (candidate: Candidate, feedback: Feedback) => {
        return feedback.score >= 0.8;
      },
    };
  }

  /**
   * Perform self-audit on a task result
   */
  private async _performSelfAudit(result: TaskResult, task: Task): Promise<SelfAudit> {
    const gaps: string[] = [];
    const risks: string[] = [];

    // Check success criteria
    if (task.successCriteria) {
      task.successCriteria.forEach((criterion) => {
        // Simple heuristic: check if criterion appears in result
        const criterionMet =
          result.reasoning?.includes(criterion) ||
          JSON.stringify(result.output).includes(criterion);
        if (!criterionMet) {
          gaps.push(`Success criterion not met: ${criterion}`);
        }
      });
    }

    // Check for issues reported by worker
    if (result.issues && result.issues.length > 0) {
      risks.push(...result.issues);
    }

    // Check confidence level
    const lowConfidence = result.confidence < this.auditConfig.confidenceThreshold;
    if (lowConfidence) {
      gaps.push(`Confidence below threshold: ${result.confidence.toFixed(2)}`);
    }

    const isSatisfactory =
      result.success &&
      gaps.length === 0 &&
      result.confidence >= this.auditConfig.confidenceThreshold;

    const shouldRefine =
      !isSatisfactory && result.confidence >= this.auditConfig.confidenceThreshold * 0.5; // Refinable

    return {
      isSatisfactory,
      confidence: result.confidence,
      gaps,
      risks,
      shouldRefine,
      reasoning: isSatisfactory
        ? 'Result meets all success criteria with sufficient confidence'
        : `Result has ${gaps.length} gaps and ${risks.length} risks`,
    };
  }

  /**
   * Perform credit assignment to identify key steps
   */
  private _performCreditAssignment(trace: ProcessTrace): void {
    if (trace.steps.length === 0) return;

    // Simple credit assignment: steps with higher confidence get more credit
    const totalConfidence = trace.steps.reduce((sum, step) => sum + step.confidence, 0);

    trace.steps.forEach((step) => {
      const credit = totalConfidence > 0 ? step.confidence / totalConfidence : 0;
      trace.creditAssignment.set(step.stepId, credit);
    });

    // Identify steps with feedback improvements
    trace.steps.forEach((step, index) => {
      if (index > 0 && step.feedback) {
        const prevStep = trace.steps[index - 1];
        const improvement = step.confidence - prevStep.confidence;
        if (improvement > 0) {
          // Bonus credit for improvement
          const currentCredit = trace.creditAssignment.get(step.stepId) || 0;
          trace.creditAssignment.set(step.stepId, currentCredit + improvement * 0.5);
        }
      }
    });
  }

  /**
   * Create test-time adapter
   */
  private _createTestTimeAdapter(): TestTimeAdapter {
    const strategies: AdaptationStrategy[] = [
      {
        name: 'parallel-strategy',
        applicability: (task: Task) => {
          return task.dependencies.length === 0 ? 0.8 : 0.2;
        },
        execute: async (task: Task) => {
          return this._executeTask(task);
        },
        examples: [],
      },
      {
        name: 'sequential-strategy',
        applicability: (task: Task) => {
          return task.dependencies.length > 0 ? 0.8 : 0.2;
        },
        execute: async (task: Task) => {
          return this._executeTask(task);
        },
        examples: [],
      },
    ];

    return {
      strategies,
      selectStrategy: (task: Task, examples?: TaskExample[]) => {
        // Learn from examples if provided
        if (examples) {
          examples.forEach((ex) => {
            const strategy = strategies.find((s) => s.name === ex.approach);
            if (strategy) {
              strategy.examples.push(ex);
            }
          });
        }

        // Select strategy with highest applicability
        const scores = strategies.map((s) => ({
          strategy: s,
          score: s.applicability(task),
        }));

        scores.sort((a, b) => b.score - a.score);
        return scores[0].strategy;
      },
      learnFromExample: (example: TaskExample) => {
        const strategy = strategies.find((s) => s.name === example.approach);
        if (strategy) {
          strategy.examples.push(example);
        }
      },
    };
  }

  /**
   * Detect diminishing returns in refinement loop
   */
  private _detectDiminishingReturns(history: RefinementHistory[]): boolean {
    if (history.length < 3) return false;

    // Check if last 2 iterations show minimal improvement
    const recent = history.slice(-3);
    const improvements = recent.slice(1).map((entry, index) => {
      return entry.feedback.score - recent[index].feedback.score;
    });

    const avgImprovement = improvements.reduce((sum, i) => sum + i, 0) / improvements.length;
    return avgImprovement < 0.05; // Less than 5% improvement
  }

  /**
   * Extract deeper insights from results and conflicts
   */
  private _extractDeeperInsights(results: TaskResult[], conflicts: Conflict[]): string[] {
    const insights: string[] = [];

    // Analyze conflict patterns
    const disagreementCount = conflicts.filter((c) => c.type === 'disagreement').length;
    const contradictionCount = conflicts.filter((c) => c.type === 'contradiction').length;
    const uncertaintyCount = conflicts.filter((c) => c.type === 'uncertainty').length;

    if (disagreementCount > 0 && contradictionCount === 0) {
      insights.push('Disagreements indicate multiple valid perspectives rather than errors');
    }

    if (uncertaintyCount > 0) {
      insights.push('Uncertainty markers suggest areas requiring additional investigation');
    }

    // Analyze confidence patterns
    const confidences = results.map((r) => r.confidence);
    const variance = this._calculateVariance(confidences);

    if (variance > 0.1) {
      insights.push(
        'High confidence variance suggests different workers have different quality of information'
      );
    }

    return insights;
  }

  /**
   * Calculate variance of an array of numbers
   */
  private _calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  }

  /**
   * Generate failure recovery suggestions
   */
  private _generateFailureRecoverySuggestions(error: Error): string[] {
    const suggestions: string[] = [];

    // Analyze error message for common patterns
    const errorMsg = error.message.toLowerCase();

    if (errorMsg.includes('timeout')) {
      suggestions.push('Increase task timeout');
      suggestions.push('Break task into smaller subtasks');
    }

    if (errorMsg.includes('not found') || errorMsg.includes('missing')) {
      suggestions.push('Verify task dependencies are satisfied');
      suggestions.push('Check worker capabilities match task requirements');
    }

    if (errorMsg.includes('permission') || errorMsg.includes('access')) {
      suggestions.push('Verify worker has necessary permissions');
      suggestions.push('Check scope constraints');
    }

    if (suggestions.length === 0) {
      suggestions.push('Review task intent for clarity');
      suggestions.push('Consider alternative worker assignment');
      suggestions.push('Add more context to task');
    }

    return suggestions;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private _validateIntent(task: Task): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Intent should be outcome-focused, not step-by-step
    if (!task.intent || task.intent.trim().length === 0) {
      errors.push('Task intent is empty');
    }

    if (task.intent && task.intent.length < 10) {
      errors.push('Task intent is too brief - clarify the desired outcome');
    }

    // Check for step-by-step instructions (anti-pattern)
    const stepIndicators = ['first', 'then', 'next', 'finally', 'step 1', 'step 2'];
    const hasSteps = stepIndicators.some((indicator) =>
      task.intent.toLowerCase().includes(indicator)
    );
    if (hasSteps) {
      errors.push(
        'Task intent contains step-by-step instructions - specify WHAT outcome is needed, not HOW'
      );
    }

    return { valid: errors.length === 0, errors };
  }

  private _checkDependencies(task: Task): { satisfied: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const depId of task.dependencies) {
      const completed = this.orchestrator.completedTasks.find((t) => t.taskId === depId);
      if (!completed || !completed.success) {
        missing.push(depId);
      }
    }

    return { satisfied: missing.length === 0, missing };
  }

  private _checkWorkerCapacity(worker: Worker): {
    available: boolean;
    estimatedWaitMs: number;
  } {
    if (worker.status.status !== 'idle') {
      return {
        available: false,
        estimatedWaitMs: worker.status.metrics.averageCompletionTimeMs || 5000,
      };
    }

    return { available: true, estimatedWaitMs: 0 };
  }

  private _calculateWorkerMatchScore(task: Task, worker: Worker): number {
    let score = 0;

    // Match on specialization (primary factor)
    const taskTypeMatch =
      worker.specialization.toLowerCase().includes(task.type.toLowerCase()) ||
      task.type.toLowerCase().includes(worker.specialization.toLowerCase());
    if (taskTypeMatch) score += 0.5;

    // Match on capabilities
    const capabilityMatches = worker.capabilities.filter((cap) =>
      task.intent.toLowerCase().includes(cap.toLowerCase())
    ).length;
    score += Math.min(0.3, capabilityMatches * 0.1);

    // Consider success rate
    score += worker.status.metrics.successRate * 0.2;

    // Penalize if worker is currently busy or has errors
    if (worker.status.status === 'busy') score *= 0.5;
    if (worker.status.status === 'error') score *= 0.3;
    if (worker.status.status === 'offline') score = 0;

    return Math.min(1, score);
  }

  private _generateAssignmentReasoning(task: Task, worker: Worker, score: number): string {
    const reasons: string[] = [];

    if (worker.specialization.toLowerCase().includes(task.type.toLowerCase())) {
      reasons.push(`Specialization matches task type (${task.type})`);
    }

    if (worker.status.metrics.successRate > 0.8) {
      reasons.push(`High success rate (${(worker.status.metrics.successRate * 100).toFixed(0)}%)`);
    }

    if (worker.status.status === 'idle') {
      reasons.push('Worker is available');
    }

    return `Match score ${score.toFixed(2)}: ${reasons.join(', ')}`;
  }

  private _identifyConflicts(results: TaskResult[]): Conflict[] {
    const conflicts: Conflict[] = [];

    if (results.length < 2) return conflicts;

    // Check for disagreements in confidence levels
    const confidenceLevels = results.map((r) => r.confidence);
    const avgConfidence = confidenceLevels.reduce((sum, c) => sum + c, 0) / confidenceLevels.length;
    const hasLowConfidence = confidenceLevels.some((c) => c < 0.5);
    const hasHighConfidence = confidenceLevels.some((c) => c > 0.8);

    if (hasLowConfidence && hasHighConfidence) {
      conflicts.push({
        type: 'disagreement',
        workers: results.map((r) => r.workerId),
        description: 'Workers have significantly different confidence levels in their results',
        preserved: true, // Preserve - indicates uncertainty boundary
      });
    }

    // Check for contradictory outputs (simple heuristic)
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    if (successCount > 0 && failureCount > 0) {
      conflicts.push({
        type: 'contradiction',
        workers: results.map((r) => r.workerId),
        description: 'Some workers succeeded while others failed on similar tasks',
        preserved: true,
      });
    }

    // Check for uncertainty markers in issues
    const hasUncertainty = results.some((r) =>
      r.issues?.some(
        (issue) =>
          issue.toLowerCase().includes('uncertain') || issue.toLowerCase().includes('unclear')
      )
    );

    if (hasUncertainty) {
      conflicts.push({
        type: 'uncertainty',
        workers: results.filter((r) => r.issues?.length).map((r) => r.workerId),
        description: 'Workers expressed uncertainty in their analysis',
        preserved: true,
      });
    }

    return conflicts;
  }

  private _extractInsights(results: TaskResult[]): string[] {
    const insights: string[] = [];

    // Emergent insight: Common patterns across workers
    const commonIssues = this._findCommonIssues(results);
    if (commonIssues.length > 0) {
      insights.push(`Common concerns across workers: ${commonIssues.join(', ')}`);
    }

    // Emergent insight: Complementary findings
    if (results.length > 1) {
      insights.push(
        `Multiple perspectives reveal: ${results.map((r) => r.workerId).join(', ')} examined different aspects`
      );
    }

    // Emergent insight: Confidence patterns
    const highConfidenceResults = results.filter((r) => r.confidence > 0.8);
    if (highConfidenceResults.length > 0 && highConfidenceResults.length < results.length) {
      insights.push(
        `High confidence in ${highConfidenceResults.length}/${results.length} results - examine low-confidence results for risks`
      );
    }

    return insights;
  }

  private _findCommonIssues(results: TaskResult[]): string[] {
    const issueMap = new Map<string, number>();

    results.forEach((result) => {
      result.issues?.forEach((issue) => {
        const count = issueMap.get(issue) || 0;
        issueMap.set(issue, count + 1);
      });
    });

    // Return issues mentioned by multiple workers
    return Array.from(issueMap.entries())
      .filter(([_, count]) => count > 1)
      .map(([issue, _]) => issue);
  }

  private _generateSynthesis(
    results: TaskResult[],
    conflicts: Conflict[],
    insights: string[]
  ): string {
    const parts: string[] = [];

    // Summary of results
    const successCount = results.filter((r) => r.success).length;
    parts.push(
      `Synthesized ${results.length} worker results: ${successCount} successful, ${results.length - successCount} failed`
    );

    // Conflicts (preserved, not resolved)
    if (conflicts.length > 0) {
      parts.push(
        `Found ${conflicts.length} conflicts indicating knowledge boundaries (preserved for transparency)`
      );
    }

    // Insights
    if (insights.length > 0) {
      parts.push(`Emergent insights: ${insights.join('; ')}`);
    }

    return parts.join('. ');
  }

  private _calculateSynthesisConfidence(results: TaskResult[], conflicts: Conflict[]): number {
    if (results.length === 0) return 0;

    // NOT a simple average - calculate based on agreement and evidence
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // Penalize for conflicts (indicates uncertainty)
    const conflictPenalty = conflicts.length * 0.1;

    // Penalize for low success rate
    const successRate = results.filter((r) => r.success).length / results.length;
    const successBonus = successRate * 0.2;

    return Math.max(0, Math.min(1, avgConfidence - conflictPenalty + successBonus));
  }

  private _generateRecommendations(
    results: TaskResult[],
    conflicts: Conflict[],
    insights: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Recommend based on conflicts
    if (conflicts.length > 0) {
      recommendations.push(
        'Review conflicting results - disagreement indicates areas needing deeper investigation'
      );
    }

    // Recommend based on success rate
    const successRate = results.filter((r) => r.success).length / results.length;
    if (successRate < 0.5) {
      recommendations.push(
        'Low success rate - consider revising task requirements or worker assignments'
      );
    }

    // Recommend based on confidence
    const lowConfidenceResults = results.filter((r) => r.confidence < 0.5);
    if (lowConfidenceResults.length > 0) {
      recommendations.push(
        `${lowConfidenceResults.length} workers expressed low confidence - validate their concerns`
      );
    }

    return recommendations;
  }

  private _findAlternativeWorker(
    currentWorkerId: string,
    specialization: string
  ): string | undefined {
    const alternatives = Array.from(this.workers.values()).filter(
      (w) =>
        w.id !== currentWorkerId &&
        w.specialization === specialization &&
        w.status.status === 'idle'
    );

    return alternatives.length > 0 ? alternatives[0].id : undefined;
  }

  private _createDelegationStrategy(tasks: Task[], pattern: DelegationPattern): DelegationStrategy {
    let expectedParallelism = 1;
    let coordinationOverhead = 0.1;

    switch (pattern) {
      case DelegationPattern.PARALLEL_FAN_OUT:
        expectedParallelism = tasks.length;
        coordinationOverhead = 0.2; // Higher overhead for coordination
        break;
      case DelegationPattern.SERIAL_CHAIN:
        expectedParallelism = 1;
        coordinationOverhead = 0.1;
        break;
      case DelegationPattern.RECURSIVE_DECOMPOSITION:
        expectedParallelism = Math.min(5, tasks.length);
        coordinationOverhead = 0.3; // Highest overhead
        break;
      case DelegationPattern.COMPETITIVE_EXPLORATION:
        expectedParallelism = tasks.length;
        coordinationOverhead = 0.15;
        break;
    }

    return {
      pattern,
      tasks,
      expectedParallelism,
      coordinationOverhead,
    };
  }

  private async _executeTask(task: Task): Promise<TaskResult> {
    const assignment = this.assignWorker(task, Array.from(this.workers.values()));

    if (!assignment) {
      return {
        taskId: task.id,
        workerId: 'none',
        success: false,
        output: null,
        confidence: 0,
        error: 'No worker available for task',
      };
    }

    try {
      const result = await assignment.worker.execute(task);
      this.orchestrator.completedTasks.push(result);

      // Update worker metrics
      assignment.worker.status.metrics.tasksCompleted++;
      assignment.worker.status.metrics.lastActiveAt = Date.now();
      assignment.worker.status.currentTask = undefined;
      assignment.worker.status.status = 'idle';

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const recovery = await this.handleWorkerFailure(assignment.worker.id, error as Error, task);

      return {
        taskId: task.id,
        workerId: assignment.worker.id,
        success: false,
        output: null,
        confidence: 0,
        error: `Task execution failed: ${errorMessage}. Recovery: ${recovery.action}`,
      };
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a new orchestrator
 */
export function createOrchestrator(config: OrchestratorConfig): MultiAgentOrchestrator {
  return new MultiAgentOrchestrator(config);
}

/**
 * Create a mock worker for testing
 */
export function createMockWorker(
  id: string,
  specialization: string,
  capabilities: string[] = []
): Worker {
  const status: WorkerStatus = {
    id,
    specialization,
    status: 'idle',
    metrics: {
      tasksCompleted: 0,
      taskseFailed: 0,
      averageCompletionTimeMs: 1000,
      successRate: 1.0,
      lastActiveAt: Date.now(),
    },
  };

  return {
    id,
    specialization,
    capabilities,
    status,
    execute: async (task: Task): Promise<TaskResult> => {
      // Mock execution - simulate async work
      await Promise.resolve();

      return {
        taskId: task.id,
        workerId: id,
        success: true,
        output: { message: `Completed by ${id}` },
        confidence: 0.8,
        reasoning: `Task executed based on intent: ${task.intent}`,
        metrics: {
          startedAt: Date.now() - 100,
          completedAt: Date.now(),
          durationMs: 100,
        },
      };
    },
  };
}

/**
 * Create a task with intent-based delegation
 */
export function createTask(
  id: string,
  type: string,
  intent: string,
  options?: Partial<Task>
): Task {
  return {
    id,
    type,
    intent,
    constraints: options?.constraints || [],
    priority: options?.priority || 'normal',
    dependencies: options?.dependencies || [],
    scope: options?.scope,
    successCriteria: options?.successCriteria,
    context: options?.context,
    deadline: options?.deadline,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
  createOrchestrator,
  createMockWorker,
  createTask,
  MultiAgentOrchestrator,
  DelegationPattern,
};
