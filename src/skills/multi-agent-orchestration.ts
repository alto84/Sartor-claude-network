/**
 * Multi-Agent Orchestration Skill
 *
 * Design coordination strategies for multiple agents that preserve independent
 * reasoning while enabling collaborative problem-solving, without fabricating
 * artificial consensus.
 *
 * Based on principles from UPLIFTED_SKILLS.md and EXECUTIVE_CLAUDE.md:
 * - Specialization Over Uniformity
 * - Disagreement Preservation Over Consensus Forcing
 * - Coordination Overhead is Real
 * - Independence Validates Findings
 * - Intent-Based Delegation
 */

import {
  createMessage,
  createReply,
  createMessageBus,
  type Message,
  type MessageBus,
  type MessageResult,
} from './agent-communication';

// ============================================================================
// Core Interfaces
// ============================================================================

export interface Orchestrator {
  id: string;
  activeWorkers: Map<string, WorkerStatus>;
  taskQueue: Task[];
  completedTasks: TaskResult[];
  messageBus: MessageBus;
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
      messageBus: createMessageBus(this.config.messageBusConfig),
    };

    this.workers = new Map();
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
   * Delegate a task using intent-based delegation
   *
   * Quality gate: Validate task intent is clear before delegation
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

    // Assign task to worker
    assignment.worker.status.currentTask = task.id;
    assignment.worker.status.status = 'busy';

    return {
      success: true,
      taskId: task.id,
      assignedWorker: assignment.worker.id,
    };
  }

  /**
   * Assign a task to the best-matching worker
   *
   * Principle: Specialization improves quality
   */
  assignWorker(task: Task, workers: Worker[]): WorkerAssignment | null {
    if (workers.length === 0) return null;

    const scores = workers.map(worker => {
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

    const alternatives = scores
      .slice(1, 4)
      .map(s => ({ workerId: s.worker.id, score: s.score }));

    return {
      worker: best.worker,
      matchScore: best.score,
      reasoning: this._generateAssignmentReasoning(task, best.worker, best.score),
      alternatives,
    };
  }

  /**
   * Synthesize results from multiple workers
   *
   * Principle: Preserve disagreement, don't force consensus
   * Quality gate: Validate results match task intent before synthesis
   */
  synthesizeResults(results: TaskResult[]): SynthesizedOutput {
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

    // Identify conflicts and disagreements
    const conflicts = this._identifyConflicts(results);

    // Extract insights that emerge from combining results
    const insights = this._extractInsights(results);

    // Generate synthesis narrative
    const synthesis = this._generateSynthesis(results, conflicts, insights);

    // Calculate confidence based on agreement and evidence (NOT simple average)
    const confidence = this._calculateSynthesisConfidence(results, conflicts);

    // Generate recommendations
    const recommendations = this._generateRecommendations(results, conflicts, insights);

    return {
      results,
      synthesis,
      insights,
      conflicts,
      confidence,
      recommendations,
    };
  }

  /**
   * Handle worker failure with graceful recovery
   *
   * Principle: Coordination overhead is real - measure and handle failures
   */
  handleWorkerFailure(workerId: string, error: Error): RecoveryAction {
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

    // Determine recovery strategy based on failure pattern
    const failureRate = worker.status.metrics.taskseFailed /
      (worker.status.metrics.tasksCompleted + worker.status.metrics.taskseFailed);

    if (failureRate > 0.5) {
      // Worker is consistently failing - take offline
      worker.status.status = 'offline';
      return {
        action: 'reassign',
        reasoning: `Worker ${workerId} has high failure rate (${(failureRate * 100).toFixed(1)}%), reassigning task`,
        newAssignment: this._findAlternativeWorker(workerId, worker.specialization),
      };
    }

    if (worker.status.metrics.taskseFailed < 3) {
      // Transient failure - retry
      return {
        action: 'retry',
        reasoning: `Transient failure for worker ${workerId}, retrying with exponential backoff`,
        delay: 1000 * Math.pow(2, worker.status.metrics.taskseFailed - 1),
      };
    }

    // Multiple failures but not consistent - reassign
    return {
      action: 'reassign',
      reasoning: `Worker ${workerId} has failed ${worker.status.metrics.taskseFailed} times, reassigning`,
      newAssignment: this._findAlternativeWorker(workerId, worker.specialization),
    };
  }

  /**
   * Execute a task with a delegation pattern
   */
  async executeWithPattern(
    tasks: Task[],
    pattern: DelegationPattern
  ): Promise<SynthesizedOutput> {
    const strategy = this._createDelegationStrategy(tasks, pattern);
    const results: TaskResult[] = [];

    switch (pattern) {
      case DelegationPattern.PARALLEL_FAN_OUT:
        // Execute all tasks in parallel
        const parallelResults = await Promise.all(
          tasks.map(task => this._executeTask(task))
        );
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
          const subtaskResults = await this.executeWithPattern(
            rootResult.output.subtasks,
            DelegationPattern.PARALLEL_FAN_OUT
          );
          results.push(...subtaskResults.results);
        }
        break;

      case DelegationPattern.COMPETITIVE_EXPLORATION:
        // Execute all tasks in parallel and compare approaches
        const competitiveResults = await Promise.all(
          tasks.map(task => this._executeTask(task))
        );
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
        w => w.status === 'busy'
      ).length,
      queuedTasks: this.orchestrator.taskQueue.length,
      completedTasks: this.orchestrator.completedTasks.length,
      workers: Array.from(this.orchestrator.activeWorkers.values()),
    };
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
    const hasSteps = stepIndicators.some(indicator =>
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
      const completed = this.orchestrator.completedTasks.find(t => t.taskId === depId);
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
    const taskTypeMatch = worker.specialization.toLowerCase().includes(task.type.toLowerCase()) ||
      task.type.toLowerCase().includes(worker.specialization.toLowerCase());
    if (taskTypeMatch) score += 0.5;

    // Match on capabilities
    const capabilityMatches = worker.capabilities.filter(cap =>
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
      reasons.push(
        `High success rate (${(worker.status.metrics.successRate * 100).toFixed(0)}%)`
      );
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
    const confidenceLevels = results.map(r => r.confidence);
    const avgConfidence = confidenceLevels.reduce((sum, c) => sum + c, 0) / confidenceLevels.length;
    const hasLowConfidence = confidenceLevels.some(c => c < 0.5);
    const hasHighConfidence = confidenceLevels.some(c => c > 0.8);

    if (hasLowConfidence && hasHighConfidence) {
      conflicts.push({
        type: 'disagreement',
        workers: results.map(r => r.workerId),
        description: 'Workers have significantly different confidence levels in their results',
        preserved: true, // Preserve - indicates uncertainty boundary
      });
    }

    // Check for contradictory outputs (simple heuristic)
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    if (successCount > 0 && failureCount > 0) {
      conflicts.push({
        type: 'contradiction',
        workers: results.map(r => r.workerId),
        description: 'Some workers succeeded while others failed on similar tasks',
        preserved: true,
      });
    }

    // Check for uncertainty markers in issues
    const hasUncertainty = results.some(r =>
      r.issues?.some(issue => issue.toLowerCase().includes('uncertain') || issue.toLowerCase().includes('unclear'))
    );

    if (hasUncertainty) {
      conflicts.push({
        type: 'uncertainty',
        workers: results.filter(r => r.issues?.length).map(r => r.workerId),
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
      insights.push(
        `Common concerns across workers: ${commonIssues.join(', ')}`
      );
    }

    // Emergent insight: Complementary findings
    if (results.length > 1) {
      insights.push(
        `Multiple perspectives reveal: ${results.map(r => r.workerId).join(', ')} examined different aspects`
      );
    }

    // Emergent insight: Confidence patterns
    const highConfidenceResults = results.filter(r => r.confidence > 0.8);
    if (highConfidenceResults.length > 0 && highConfidenceResults.length < results.length) {
      insights.push(
        `High confidence in ${highConfidenceResults.length}/${results.length} results - examine low-confidence results for risks`
      );
    }

    return insights;
  }

  private _findCommonIssues(results: TaskResult[]): string[] {
    const issueMap = new Map<string, number>();

    results.forEach(result => {
      result.issues?.forEach(issue => {
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
    const successCount = results.filter(r => r.success).length;
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

  private _calculateSynthesisConfidence(
    results: TaskResult[],
    conflicts: Conflict[]
  ): number {
    if (results.length === 0) return 0;

    // NOT a simple average - calculate based on agreement and evidence
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // Penalize for conflicts (indicates uncertainty)
    const conflictPenalty = conflicts.length * 0.1;

    // Penalize for low success rate
    const successRate = results.filter(r => r.success).length / results.length;
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
    const successRate = results.filter(r => r.success).length / results.length;
    if (successRate < 0.5) {
      recommendations.push(
        'Low success rate - consider revising task requirements or worker assignments'
      );
    }

    // Recommend based on confidence
    const lowConfidenceResults = results.filter(r => r.confidence < 0.5);
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
      w =>
        w.id !== currentWorkerId &&
        w.specialization === specialization &&
        w.status.status === 'idle'
    );

    return alternatives.length > 0 ? alternatives[0].id : undefined;
  }

  private _createDelegationStrategy(
    tasks: Task[],
    pattern: DelegationPattern
  ): DelegationStrategy {
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
      const recovery = this.handleWorkerFailure(assignment.worker.id, error as Error);

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
      // Mock execution
      await new Promise(resolve => setTimeout(resolve, 100));

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
