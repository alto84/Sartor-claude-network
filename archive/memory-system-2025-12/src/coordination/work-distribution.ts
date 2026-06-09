/**
 * Work Distribution System
 *
 * Provides:
 * - Task claiming with optimistic locking
 * - Conflict resolution for concurrent claims
 * - Load balancing across agents
 * - Task reassignment on agent failure
 *
 * @module coordination/work-distribution
 */

import { EventEmitter } from 'events';
import { AgentRole } from '../subagent/bootstrap';
import {
  SubagentRegistry,
  getGlobalRegistry,
  AgentStatus,
  RegisteredAgent,
} from '../subagent/registry';
import { AgentMessageBus } from '../subagent/messaging';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Task status
 */
export enum TaskStatus {
  /** Task is available for claiming */
  AVAILABLE = 'available',
  /** Task has been claimed by an agent */
  CLAIMED = 'claimed',
  /** Task is in progress */
  IN_PROGRESS = 'in_progress',
  /** Task is blocked by dependencies */
  BLOCKED = 'blocked',
  /** Task completed successfully */
  COMPLETED = 'completed',
  /** Task failed */
  FAILED = 'failed',
  /** Task was cancelled */
  CANCELLED = 'cancelled',
}

/**
 * Task priority
 */
export enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Task definition
 */
export interface Task {
  /** Unique task identifier */
  id: string;
  /** Task title */
  title: string;
  /** Task description */
  description: string;
  /** Task status */
  status: TaskStatus;
  /** Task priority */
  priority: TaskPriority;
  /** Required role to execute */
  requiredRole?: AgentRole;
  /** Required capabilities */
  requiredCapabilities: string[];
  /** Task dependencies (IDs of tasks that must complete first) */
  dependencies: string[];
  /** Agent ID that claimed this task */
  claimedBy?: string;
  /** Claim timestamp */
  claimedAt?: Date;
  /** Claim version (for optimistic locking) */
  claimVersion: number;
  /** Task creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Estimated effort in minutes */
  estimatedMinutes?: number;
  /** Actual time spent in minutes */
  actualMinutes?: number;
  /** Start timestamp */
  startedAt?: Date;
  /** Completion timestamp */
  completedAt?: Date;
  /** Task metadata */
  metadata: Record<string, unknown>;
  /** Result data when completed */
  result?: unknown;
  /** Error message if failed */
  error?: string;
  /** Parent task ID (for subtasks) */
  parentTaskId?: string;
  /** Subtask IDs */
  subtaskIds: string[];
  /** Maximum retry attempts */
  maxRetries: number;
  /** Current retry count */
  retryCount: number;
}

/**
 * Claim result
 */
export interface ClaimResult {
  /** Whether claim was successful */
  success: boolean;
  /** The task if claim succeeded */
  task?: Task;
  /** Reason if claim failed */
  reason?: string;
  /** Conflict information if claim failed due to conflict */
  conflict?: {
    claimedBy: string;
    claimedAt: Date;
    claimVersion: number;
  };
}

/**
 * Task filter options
 */
export interface TaskFilter {
  /** Filter by status */
  statuses?: TaskStatus[];
  /** Filter by priority */
  priorities?: TaskPriority[];
  /** Filter by required role */
  roles?: AgentRole[];
  /** Filter by required capability */
  capabilities?: string[];
  /** Filter by assignee */
  claimedBy?: string;
  /** Include only root tasks (no parent) */
  rootOnly?: boolean;
  /** Limit results */
  limit?: number;
}

/**
 * Work distribution statistics
 */
export interface WorkDistributionStats {
  /** Total tasks */
  totalTasks: number;
  /** Tasks by status */
  byStatus: Record<TaskStatus, number>;
  /** Tasks by priority */
  byPriority: Record<TaskPriority, number>;
  /** Tasks by agent */
  byAgent: Record<string, number>;
  /** Average completion time (minutes) */
  avgCompletionTime: number;
  /** Tasks completed in last hour */
  completedLastHour: number;
  /** Tasks failed in last hour */
  failedLastHour: number;
}

/**
 * Task assignment recommendation
 */
export interface AssignmentRecommendation {
  /** Task to assign */
  taskId: string;
  /** Recommended agent */
  agentId: string;
  /** Score (higher is better) */
  score: number;
  /** Reasons for recommendation */
  reasons: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default maximum retries */
const DEFAULT_MAX_RETRIES = 3;

/** Claim timeout in milliseconds (auto-release if no progress) */
const CLAIM_TIMEOUT_MS = 300000; // 5 minutes

/** Priority weights for scoring */
const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  [TaskPriority.CRITICAL]: 4,
  [TaskPriority.HIGH]: 3,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.LOW]: 1,
};

// ============================================================================
// WORK DISTRIBUTOR
// ============================================================================

/**
 * Work Distribution Manager
 *
 * Manages task distribution across agents with optimistic locking
 * and conflict resolution.
 */
export class WorkDistributor extends EventEmitter {
  private registry: SubagentRegistry;
  private tasks: Map<string, Task> = new Map();
  private claimTimeoutTimers: Map<string, NodeJS.Timeout> = new Map();
  private completionTimes: number[] = [];
  private messageBus?: AgentMessageBus;

  constructor(registry?: SubagentRegistry, messageBus?: AgentMessageBus) {
    super();
    this.registry = registry || getGlobalRegistry();
    this.messageBus = messageBus;
  }

  /**
   * Publish task status event to message bus if connected
   */
  private publishTaskEvent(
    eventType: string,
    taskId: string,
    status: TaskStatus,
    agentId?: string,
    extra?: Record<string, unknown>
  ): void {
    if (this.messageBus) {
      this.messageBus.publishToTopic(
        'work-distributor',
        'task.status',
        eventType,
        { taskId, status, agentId, timestamp: new Date().toISOString(), ...extra }
      );
    }
  }

  /**
   * Create a new task
   *
   * @param title - Task title
   * @param description - Task description
   * @param options - Task options
   * @returns Created task
   */
  createTask(
    title: string,
    description: string,
    options: {
      priority?: TaskPriority;
      requiredRole?: AgentRole;
      requiredCapabilities?: string[];
      dependencies?: string[];
      estimatedMinutes?: number;
      parentTaskId?: string;
      metadata?: Record<string, unknown>;
      maxRetries?: number;
    } = {}
  ): Task {
    const id = this.generateId();
    const now = new Date();

    // Validate dependencies exist
    if (options.dependencies) {
      for (const depId of options.dependencies) {
        if (!this.tasks.has(depId)) {
          throw new Error(`Dependency task ${depId} does not exist`);
        }
      }
    }

    const task: Task = {
      id,
      title,
      description,
      status: TaskStatus.AVAILABLE,
      priority: options.priority || TaskPriority.MEDIUM,
      requiredRole: options.requiredRole,
      requiredCapabilities: options.requiredCapabilities || [],
      dependencies: options.dependencies || [],
      claimVersion: 0,
      createdAt: now,
      updatedAt: now,
      estimatedMinutes: options.estimatedMinutes,
      metadata: options.metadata || {},
      parentTaskId: options.parentTaskId,
      subtaskIds: [],
      maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
      retryCount: 0,
    };

    // Check if blocked by dependencies
    if (this.hasPendingDependencies(task)) {
      task.status = TaskStatus.BLOCKED;
    }

    // Add to parent's subtask list
    if (options.parentTaskId) {
      const parent = this.tasks.get(options.parentTaskId);
      if (parent) {
        parent.subtaskIds.push(id);
      }
    }

    this.tasks.set(id, task);
    this.emit('taskCreated', task);
    this.publishTaskEvent('Task Created', id, task.status, undefined, { title: task.title });

    return task;
  }

  /**
   * Claim a task (with optimistic locking)
   *
   * @param taskId - Task ID to claim
   * @param agentId - Agent claiming the task
   * @param expectedVersion - Expected claim version (for optimistic locking)
   * @returns Claim result
   */
  claimTask(
    taskId: string,
    agentId: string,
    expectedVersion?: number
  ): ClaimResult {
    const task = this.tasks.get(taskId);
    if (!task) {
      return { success: false, reason: 'Task not found' };
    }

    // Check task is available
    if (task.status !== TaskStatus.AVAILABLE) {
      if (task.status === TaskStatus.CLAIMED || task.status === TaskStatus.IN_PROGRESS) {
        return {
          success: false,
          reason: 'Task already claimed',
          conflict: {
            claimedBy: task.claimedBy!,
            claimedAt: task.claimedAt!,
            claimVersion: task.claimVersion,
          },
        };
      }
      return { success: false, reason: `Task status is ${task.status}` };
    }

    // Check dependencies
    if (this.hasPendingDependencies(task)) {
      return { success: false, reason: 'Task has pending dependencies' };
    }

    // Optimistic locking check
    if (expectedVersion !== undefined && task.claimVersion !== expectedVersion) {
      return {
        success: false,
        reason: 'Version mismatch (concurrent modification)',
        conflict: task.claimedBy
          ? {
              claimedBy: task.claimedBy,
              claimedAt: task.claimedAt!,
              claimVersion: task.claimVersion,
            }
          : undefined,
      };
    }

    // Check agent eligibility
    const eligibility = this.checkEligibility(task, agentId);
    if (!eligibility.eligible) {
      return { success: false, reason: eligibility.reason };
    }

    // Claim the task
    task.status = TaskStatus.CLAIMED;
    task.claimedBy = agentId;
    task.claimedAt = new Date();
    task.claimVersion++;
    task.updatedAt = new Date();

    // Update registry
    this.registry.updateCurrentTask(agentId, taskId);

    // Set claim timeout
    this.setClaimTimeout(taskId);

    this.emit('taskClaimed', { task, agentId });
    this.publishTaskEvent('Task Claimed', task.id, task.status, agentId);

    return { success: true, task };
  }

  /**
   * Start working on a claimed task
   *
   * @param taskId - Task ID
   * @param agentId - Agent ID (must match claimer)
   * @returns Updated task or undefined
   */
  startTask(taskId: string, agentId: string): Task | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    if (task.claimedBy !== agentId) {
      return undefined;
    }

    if (task.status !== TaskStatus.CLAIMED) {
      return undefined;
    }

    task.status = TaskStatus.IN_PROGRESS;
    task.startedAt = new Date();
    task.updatedAt = new Date();

    // Clear claim timeout, set progress timeout
    this.clearClaimTimeout(taskId);
    this.setProgressTimeout(taskId);

    this.emit('taskStarted', { task, agentId });
    this.publishTaskEvent('Task Started', task.id, task.status, agentId);

    return task;
  }

  /**
   * Complete a task
   *
   * @param taskId - Task ID
   * @param agentId - Agent ID (must match claimer)
   * @param result - Task result
   * @returns Updated task or undefined
   */
  completeTask(taskId: string, agentId: string, result?: unknown): Task | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    if (task.claimedBy !== agentId) {
      return undefined;
    }

    if (task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.CLAIMED) {
      return undefined;
    }

    const now = new Date();
    task.status = TaskStatus.COMPLETED;
    task.completedAt = now;
    task.updatedAt = now;
    task.result = result;

    // Calculate actual time
    if (task.startedAt) {
      task.actualMinutes = Math.round((now.getTime() - task.startedAt.getTime()) / 60000);
      this.completionTimes.push(task.actualMinutes);
      // Keep only last 100 completion times
      if (this.completionTimes.length > 100) {
        this.completionTimes.shift();
      }
    }

    // Clear timeout
    this.clearClaimTimeout(taskId);

    // Update registry
    this.registry.updateCurrentTask(agentId, null);

    // Unblock dependent tasks
    this.unblockDependentTasks(taskId);

    this.emit('taskCompleted', { task, agentId, result });
    this.publishTaskEvent('Task Completed', task.id, task.status, agentId);

    return task;
  }

  /**
   * Fail a task
   *
   * @param taskId - Task ID
   * @param agentId - Agent ID
   * @param error - Error message
   * @returns Updated task or undefined
   */
  failTask(taskId: string, agentId: string, error: string): Task | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    if (task.claimedBy !== agentId) {
      return undefined;
    }

    task.retryCount++;

    if (task.retryCount < task.maxRetries) {
      // Release for retry
      task.status = TaskStatus.AVAILABLE;
      task.claimedBy = undefined;
      task.claimedAt = undefined;
      task.updatedAt = new Date();
      task.error = error;

      this.emit('taskRetrying', { task, agentId, error, attempt: task.retryCount });
    } else {
      // Max retries exceeded
      task.status = TaskStatus.FAILED;
      task.completedAt = new Date();
      task.updatedAt = new Date();
      task.error = error;

      this.emit('taskFailed', { task, agentId, error });
      this.publishTaskEvent('Task Failed', task.id, task.status, agentId, { error });
    }

    // Clear timeout
    this.clearClaimTimeout(taskId);

    // Update registry
    this.registry.updateCurrentTask(agentId, null);

    return task;
  }

  /**
   * Release a claimed task
   *
   * @param taskId - Task ID
   * @param agentId - Agent ID
   * @returns Updated task or undefined
   */
  releaseTask(taskId: string, agentId: string): Task | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    if (task.claimedBy !== agentId) {
      return undefined;
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) {
      return undefined;
    }

    task.status = TaskStatus.AVAILABLE;
    task.claimedBy = undefined;
    task.claimedAt = undefined;
    task.updatedAt = new Date();

    // Clear timeout
    this.clearClaimTimeout(taskId);

    // Update registry
    this.registry.updateCurrentTask(agentId, null);

    this.emit('taskReleased', { task, agentId });

    return task;
  }

  /**
   * Cancel a task
   *
   * @param taskId - Task ID
   * @returns Whether task was cancelled
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === TaskStatus.COMPLETED) {
      return false;
    }

    const oldStatus = task.status;
    task.status = TaskStatus.CANCELLED;
    task.updatedAt = new Date();

    // Clear timeout if any
    this.clearClaimTimeout(taskId);

    // Update registry if claimed
    if (task.claimedBy) {
      this.registry.updateCurrentTask(task.claimedBy, null);
    }

    this.emit('taskCancelled', { task, oldStatus });

    return true;
  }

  /**
   * Get a task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get tasks matching filter
   */
  getTasks(filter: TaskFilter = {}): Task[] {
    let tasks = Array.from(this.tasks.values());

    if (filter.statuses) {
      tasks = tasks.filter((t) => filter.statuses!.includes(t.status));
    }

    if (filter.priorities) {
      tasks = tasks.filter((t) => filter.priorities!.includes(t.priority));
    }

    if (filter.roles) {
      tasks = tasks.filter((t) => t.requiredRole && filter.roles!.includes(t.requiredRole));
    }

    if (filter.capabilities && filter.capabilities.length > 0) {
      tasks = tasks.filter((t) =>
        filter.capabilities!.every((cap) => t.requiredCapabilities.includes(cap))
      );
    }

    if (filter.claimedBy) {
      tasks = tasks.filter((t) => t.claimedBy === filter.claimedBy);
    }

    if (filter.rootOnly) {
      tasks = tasks.filter((t) => !t.parentTaskId);
    }

    // Sort by priority
    tasks.sort(
      (a, b) => PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]
    );

    if (filter.limit) {
      tasks = tasks.slice(0, filter.limit);
    }

    return tasks;
  }

  /**
   * Get available tasks for an agent
   */
  getAvailableTasksForAgent(agentId: string, limit?: number): Task[] {
    const agent = this.registry.getAgent(agentId);
    if (!agent) return [];

    const agentCapabilities = agent.capabilities.map((c) => c.name);

    let tasks = this.getTasks({ statuses: [TaskStatus.AVAILABLE] });

    // Filter by eligibility
    tasks = tasks.filter((task) => {
      // Check role
      if (task.requiredRole && task.requiredRole !== agent.role) {
        return false;
      }

      // Check capabilities
      if (task.requiredCapabilities.length > 0) {
        const hasAll = task.requiredCapabilities.every((cap) =>
          agentCapabilities.includes(cap)
        );
        if (!hasAll) return false;
      }

      // Check dependencies
      if (this.hasPendingDependencies(task)) {
        return false;
      }

      return true;
    });

    if (limit) {
      tasks = tasks.slice(0, limit);
    }

    return tasks;
  }

  /**
   * Get task assignment recommendations
   */
  getAssignmentRecommendations(limit: number = 10): AssignmentRecommendation[] {
    const recommendations: AssignmentRecommendation[] = [];
    const availableTasks = this.getTasks({ statuses: [TaskStatus.AVAILABLE] });
    const activeAgents = this.registry.discoverPeers({
      statuses: [AgentStatus.ACTIVE, AgentStatus.IDLE],
    });

    for (const task of availableTasks) {
      if (this.hasPendingDependencies(task)) continue;

      let bestAgent: RegisteredAgent | null = null;
      let bestScore = -1;
      const bestReasons: string[] = [];

      for (const agent of activeAgents) {
        const eligibility = this.checkEligibility(task, agent.id);
        if (!eligibility.eligible) continue;

        let score = 0;
        const reasons: string[] = [];

        // Role match bonus
        if (task.requiredRole && agent.role === task.requiredRole) {
          score += 20;
          reasons.push('Role match');
        }

        // Capability match bonus
        const agentCaps = agent.capabilities.map((c) => c.name);
        const capMatches = task.requiredCapabilities.filter((cap) =>
          agentCaps.includes(cap)
        ).length;
        if (capMatches > 0) {
          score += capMatches * 10;
          reasons.push(`${capMatches} capability matches`);
        }

        // Capability proficiency bonus
        for (const reqCap of task.requiredCapabilities) {
          const agentCap = agent.capabilities.find((c) => c.name === reqCap);
          if (agentCap) {
            score += agentCap.proficiency * 10;
          }
        }

        // Idle agent preference
        if (agent.status === AgentStatus.IDLE) {
          score += 15;
          reasons.push('Agent is idle');
        }

        // Recent activity bonus
        const activityRecency = Date.now() - agent.lastActivity.getTime();
        if (activityRecency < 60000) {
          // Active in last minute
          score += 5;
          reasons.push('Recently active');
        }

        if (score > bestScore) {
          bestScore = score;
          bestAgent = agent;
          bestReasons.length = 0;
          bestReasons.push(...reasons);
        }
      }

      if (bestAgent && bestScore > 0) {
        recommendations.push({
          taskId: task.id,
          agentId: bestAgent.id,
          score: bestScore,
          reasons: bestReasons,
        });
      }
    }

    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, limit);
  }

  /**
   * Get statistics
   */
  getStats(): WorkDistributionStats {
    const stats: WorkDistributionStats = {
      totalTasks: this.tasks.size,
      byStatus: {} as Record<TaskStatus, number>,
      byPriority: {} as Record<TaskPriority, number>,
      byAgent: {},
      avgCompletionTime: 0,
      completedLastHour: 0,
      failedLastHour: 0,
    };

    // Initialize counters
    for (const status of Object.values(TaskStatus)) {
      stats.byStatus[status] = 0;
    }
    for (const priority of Object.values(TaskPriority)) {
      stats.byPriority[priority] = 0;
    }

    const oneHourAgo = Date.now() - 3600000;

    for (const task of this.tasks.values()) {
      stats.byStatus[task.status]++;
      stats.byPriority[task.priority]++;

      if (task.claimedBy) {
        stats.byAgent[task.claimedBy] = (stats.byAgent[task.claimedBy] || 0) + 1;
      }

      if (task.completedAt && task.completedAt.getTime() > oneHourAgo) {
        if (task.status === TaskStatus.COMPLETED) {
          stats.completedLastHour++;
        } else if (task.status === TaskStatus.FAILED) {
          stats.failedLastHour++;
        }
      }
    }

    // Calculate average completion time
    if (this.completionTimes.length > 0) {
      stats.avgCompletionTime =
        this.completionTimes.reduce((a, b) => a + b, 0) / this.completionTimes.length;
    }

    return stats;
  }

  /**
   * Clear all tasks (for testing)
   */
  clear(): void {
    for (const taskId of this.tasks.keys()) {
      this.clearClaimTimeout(taskId);
    }
    this.tasks.clear();
    this.completionTimes = [];
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Generate unique task ID
   */
  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if task has pending dependencies
   */
  private hasPendingDependencies(task: Task): boolean {
    for (const depId of task.dependencies) {
      const dep = this.tasks.get(depId);
      if (!dep || dep.status !== TaskStatus.COMPLETED) {
        return true;
      }
    }
    return false;
  }

  /**
   * Unblock tasks dependent on completed task
   */
  private unblockDependentTasks(completedTaskId: string): void {
    for (const task of this.tasks.values()) {
      if (task.status === TaskStatus.BLOCKED && task.dependencies.includes(completedTaskId)) {
        if (!this.hasPendingDependencies(task)) {
          task.status = TaskStatus.AVAILABLE;
          task.updatedAt = new Date();
          this.emit('taskUnblocked', task);
        }
      }
    }
  }

  /**
   * Check agent eligibility for task
   */
  private checkEligibility(
    task: Task,
    agentId: string
  ): { eligible: boolean; reason?: string } {
    const agent = this.registry.getAgent(agentId);
    if (!agent) {
      return { eligible: false, reason: 'Agent not found' };
    }

    if (
      agent.status !== AgentStatus.ACTIVE &&
      agent.status !== AgentStatus.IDLE
    ) {
      return { eligible: false, reason: 'Agent not available' };
    }

    if (task.requiredRole && agent.role !== task.requiredRole) {
      return { eligible: false, reason: `Requires role ${task.requiredRole}` };
    }

    const agentCapabilities = agent.capabilities.map((c) => c.name);
    for (const cap of task.requiredCapabilities) {
      if (!agentCapabilities.includes(cap)) {
        return { eligible: false, reason: `Missing capability ${cap}` };
      }
    }

    return { eligible: true };
  }

  /**
   * Set claim timeout
   */
  private setClaimTimeout(taskId: string): void {
    this.clearClaimTimeout(taskId);

    const timer = setTimeout(() => {
      const task = this.tasks.get(taskId);
      if (task && task.status === TaskStatus.CLAIMED) {
        // Auto-release timed out claim
        task.status = TaskStatus.AVAILABLE;
        const agentId = task.claimedBy;
        task.claimedBy = undefined;
        task.claimedAt = undefined;
        task.updatedAt = new Date();

        if (agentId) {
          this.registry.updateCurrentTask(agentId, null);
        }

        this.emit('claimTimeout', { task, agentId });
      }
    }, CLAIM_TIMEOUT_MS);

    this.claimTimeoutTimers.set(taskId, timer);
  }

  /**
   * Set progress timeout (longer than claim timeout)
   */
  private setProgressTimeout(taskId: string): void {
    this.clearClaimTimeout(taskId);

    const timer = setTimeout(() => {
      const task = this.tasks.get(taskId);
      if (task && task.status === TaskStatus.IN_PROGRESS) {
        this.emit('progressTimeout', task);
        // Don't auto-release - emit event for coordinator to handle
      }
    }, CLAIM_TIMEOUT_MS * 2);

    this.claimTimeoutTimers.set(taskId, timer);
  }

  /**
   * Clear claim timeout
   */
  private clearClaimTimeout(taskId: string): void {
    const timer = this.claimTimeoutTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.claimTimeoutTimers.delete(taskId);
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/** Global work distributor instance */
let globalDistributor: WorkDistributor | null = null;

/**
 * Get the global work distributor
 */
export function getGlobalDistributor(): WorkDistributor {
  if (!globalDistributor) {
    globalDistributor = new WorkDistributor();
  }
  return globalDistributor;
}

/**
 * Create a new work distributor
 */
export function createDistributor(registry?: SubagentRegistry): WorkDistributor {
  return new WorkDistributor(registry);
}

/**
 * Reset the global distributor (for testing)
 */
export function resetGlobalDistributor(): void {
  if (globalDistributor) {
    globalDistributor.clear();
    globalDistributor = null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default WorkDistributor;
