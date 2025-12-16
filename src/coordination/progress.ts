/**
 * Progress Reporting Module
 *
 * Provides:
 * - Hierarchical progress tracking
 * - Milestone management
 * - Time estimation and tracking
 * - Progress aggregation across agents
 * - Real-time progress updates
 *
 * @module coordination/progress
 */

import { EventEmitter } from 'events';
import { AgentRole } from '../subagent/bootstrap';
import {
  SubagentRegistry,
  getGlobalRegistry,
  RegisteredAgent,
} from '../subagent/registry';
import {
  AgentMessageBus,
  getGlobalMessageBus,
  MessageType,
  MessagePriority,
} from '../subagent/messaging';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Progress status
 */
export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  FAILED = 'failed',
  PAUSED = 'paused',
}

/**
 * Milestone status
 */
export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
  MISSED = 'missed',
  DEFERRED = 'deferred',
}

/**
 * Progress entry
 */
export interface ProgressEntry {
  /** Unique entry ID */
  id: string;
  /** Associated task/item ID */
  taskId: string;
  /** Agent reporting progress */
  agentId: string;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Current status */
  status: ProgressStatus;
  /** Status message */
  message: string;
  /** Details/notes */
  details?: string;
  /** Timestamp */
  timestamp: Date;
  /** Time spent on this update (minutes) */
  timeSpentMinutes?: number;
  /** Estimated remaining time (minutes) */
  estimatedRemainingMinutes?: number;
  /** Blockers if any */
  blockers?: string[];
  /** Metadata */
  metadata: Record<string, unknown>;
}

/**
 * Milestone definition
 */
export interface Milestone {
  /** Milestone ID */
  id: string;
  /** Milestone name */
  name: string;
  /** Description */
  description: string;
  /** Current status */
  status: MilestoneStatus;
  /** Target date */
  targetDate?: Date;
  /** Actual completion date */
  completedDate?: Date;
  /** Required task IDs */
  requiredTaskIds: string[];
  /** Progress percentage (calculated) */
  progress: number;
  /** Parent milestone ID */
  parentMilestoneId?: string;
  /** Child milestone IDs */
  childMilestoneIds: string[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Owner/responsible agent */
  owner?: string;
  /** Tags */
  tags: string[];
}

/**
 * Progress summary for a task/plan
 */
export interface ProgressSummary {
  /** Task/Plan ID */
  id: string;
  /** Overall progress percentage */
  overallProgress: number;
  /** Current status */
  status: ProgressStatus;
  /** Items completed */
  itemsCompleted: number;
  /** Total items */
  totalItems: number;
  /** Items in progress */
  itemsInProgress: number;
  /** Items blocked */
  itemsBlocked: number;
  /** Time spent (minutes) */
  timeSpentMinutes: number;
  /** Estimated total time (minutes) */
  estimatedTotalMinutes: number;
  /** Estimated remaining time (minutes) */
  estimatedRemainingMinutes: number;
  /** Active agents working on this */
  activeAgents: string[];
  /** Last update */
  lastUpdate: Date;
  /** Milestones achieved */
  milestonesAchieved: number;
  /** Total milestones */
  totalMilestones: number;
}

/**
 * Agent progress summary
 */
export interface AgentProgressSummary {
  /** Agent ID */
  agentId: string;
  /** Agent role */
  role: AgentRole;
  /** Tasks completed */
  tasksCompleted: number;
  /** Tasks in progress */
  tasksInProgress: number;
  /** Total time spent (minutes) */
  timeSpentMinutes: number;
  /** Average completion time (minutes) */
  avgCompletionTimeMinutes: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Last activity */
  lastActivity: Date;
  /** Current task ID */
  currentTaskId?: string;
  /** Current task progress */
  currentTaskProgress?: number;
}

/**
 * Progress report options
 */
export interface ReportProgressOptions {
  /** Status message */
  message?: string;
  /** Detailed notes */
  details?: string;
  /** Time spent on this work (minutes) */
  timeSpentMinutes?: number;
  /** Estimated remaining time (minutes) */
  estimatedRemainingMinutes?: number;
  /** Blockers */
  blockers?: string[];
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Broadcast to other agents */
  broadcast?: boolean;
}

/**
 * Progress tracking statistics
 */
export interface ProgressStats {
  /** Total progress entries */
  totalEntries: number;
  /** Entries by status */
  byStatus: Record<ProgressStatus, number>;
  /** Total milestones */
  totalMilestones: number;
  /** Milestones by status */
  milestonesByStatus: Record<MilestoneStatus, number>;
  /** Average progress update frequency (per hour) */
  avgUpdateFrequency: number;
  /** Total time tracked (minutes) */
  totalTimeTracked: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Progress broadcast topic */
const PROGRESS_TOPIC = 'progress';

/** Maximum history entries to keep */
const MAX_HISTORY_ENTRIES = 1000;

// ============================================================================
// PROGRESS TRACKER
// ============================================================================

/**
 * Progress Tracker
 *
 * Centralized progress tracking and reporting for multi-agent coordination.
 */
export class ProgressTracker extends EventEmitter {
  private registry: SubagentRegistry;
  private messageBus: AgentMessageBus;
  private progressHistory: Map<string, ProgressEntry[]> = new Map();
  private latestProgress: Map<string, ProgressEntry> = new Map();
  private milestones: Map<string, Milestone> = new Map();
  private taskTimeTracking: Map<string, { started: Date; totalMinutes: number }> = new Map();
  private agentStats: Map<string, {
    tasksCompleted: number;
    tasksFailed: number;
    totalTimeMinutes: number;
    completionTimes: number[];
  }> = new Map();

  constructor(registry?: SubagentRegistry, messageBus?: AgentMessageBus) {
    super();
    this.registry = registry || getGlobalRegistry();
    this.messageBus = messageBus || getGlobalMessageBus();
    this.setupMessageHandlers();
  }

  /**
   * Report progress on a task
   *
   * @param agentId - Reporting agent ID
   * @param taskId - Task ID
   * @param percentage - Progress percentage (0-100)
   * @param status - Current status
   * @param options - Additional options
   * @returns Progress entry
   */
  reportProgress(
    agentId: string,
    taskId: string,
    percentage: number,
    status: ProgressStatus,
    options: ReportProgressOptions = {}
  ): ProgressEntry {
    const now = new Date();

    const entry: ProgressEntry = {
      id: this.generateId('progress'),
      taskId,
      agentId,
      percentage: Math.min(100, Math.max(0, percentage)),
      status,
      message: options.message || this.getDefaultMessage(status, percentage),
      details: options.details,
      timestamp: now,
      timeSpentMinutes: options.timeSpentMinutes,
      estimatedRemainingMinutes: options.estimatedRemainingMinutes,
      blockers: options.blockers,
      metadata: options.metadata || {},
    };

    // Store in history
    if (!this.progressHistory.has(taskId)) {
      this.progressHistory.set(taskId, []);
    }
    const history = this.progressHistory.get(taskId)!;
    history.push(entry);

    // Trim history if needed
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.splice(0, history.length - MAX_HISTORY_ENTRIES);
    }

    // Update latest progress
    this.latestProgress.set(taskId, entry);

    // Update time tracking
    this.updateTimeTracking(taskId, agentId, status, options.timeSpentMinutes);

    // Update agent stats
    this.updateAgentStats(agentId, status, options.timeSpentMinutes);

    // Update milestone progress
    this.updateMilestoneProgress(taskId, status);

    // Emit event
    this.emit('progressReported', entry);

    // Broadcast if requested
    if (options.broadcast) {
      this.broadcastProgress(entry);
    }

    return entry;
  }

  /**
   * Start time tracking for a task
   */
  startTimeTracking(taskId: string): void {
    if (!this.taskTimeTracking.has(taskId)) {
      this.taskTimeTracking.set(taskId, {
        started: new Date(),
        totalMinutes: 0,
      });
    }
  }

  /**
   * Stop time tracking for a task
   */
  stopTimeTracking(taskId: string): number {
    const tracking = this.taskTimeTracking.get(taskId);
    if (tracking) {
      const elapsed = (Date.now() - tracking.started.getTime()) / 60000;
      tracking.totalMinutes += elapsed;
      return tracking.totalMinutes;
    }
    return 0;
  }

  /**
   * Get latest progress for a task
   */
  getLatestProgress(taskId: string): ProgressEntry | undefined {
    return this.latestProgress.get(taskId);
  }

  /**
   * Get progress history for a task
   */
  getProgressHistory(taskId: string, limit?: number): ProgressEntry[] {
    const history = this.progressHistory.get(taskId) || [];
    if (limit) {
      return history.slice(-limit);
    }
    return [...history];
  }

  /**
   * Get progress summary for a task/plan
   */
  getProgressSummary(taskIds: string[]): ProgressSummary {
    let totalProgress = 0;
    let itemsCompleted = 0;
    let itemsInProgress = 0;
    let itemsBlocked = 0;
    let timeSpent = 0;
    let estimatedTotal = 0;
    const activeAgents = new Set<string>();
    let lastUpdate = new Date(0);

    for (const taskId of taskIds) {
      const latest = this.latestProgress.get(taskId);
      if (latest) {
        totalProgress += latest.percentage;
        if (latest.status === ProgressStatus.COMPLETED) {
          itemsCompleted++;
        } else if (latest.status === ProgressStatus.IN_PROGRESS) {
          itemsInProgress++;
          activeAgents.add(latest.agentId);
        } else if (latest.status === ProgressStatus.BLOCKED) {
          itemsBlocked++;
        }
        if (latest.timestamp > lastUpdate) {
          lastUpdate = latest.timestamp;
        }
      }

      const tracking = this.taskTimeTracking.get(taskId);
      if (tracking) {
        timeSpent += tracking.totalMinutes;
      }
    }

    const overallProgress = taskIds.length > 0 ? totalProgress / taskIds.length : 0;
    const milestones = this.getMilestonesForTasks(taskIds);
    const milestonesAchieved = milestones.filter(
      (m) => m.status === MilestoneStatus.ACHIEVED
    ).length;

    return {
      id: taskIds.join(','),
      overallProgress: Math.round(overallProgress),
      status: this.determineOverallStatus(itemsCompleted, itemsInProgress, itemsBlocked, taskIds.length),
      itemsCompleted,
      totalItems: taskIds.length,
      itemsInProgress,
      itemsBlocked,
      timeSpentMinutes: Math.round(timeSpent),
      estimatedTotalMinutes: estimatedTotal,
      estimatedRemainingMinutes: Math.max(0, estimatedTotal - timeSpent),
      activeAgents: Array.from(activeAgents),
      lastUpdate,
      milestonesAchieved,
      totalMilestones: milestones.length,
    };
  }

  /**
   * Get agent progress summary
   */
  getAgentSummary(agentId: string): AgentProgressSummary | undefined {
    const agent = this.registry.getAgent(agentId);
    if (!agent) return undefined;

    const stats = this.agentStats.get(agentId) || {
      tasksCompleted: 0,
      tasksFailed: 0,
      totalTimeMinutes: 0,
      completionTimes: [],
    };

    const avgCompletionTime =
      stats.completionTimes.length > 0
        ? stats.completionTimes.reduce((a, b) => a + b, 0) / stats.completionTimes.length
        : 0;

    const successRate =
      stats.tasksCompleted + stats.tasksFailed > 0
        ? stats.tasksCompleted / (stats.tasksCompleted + stats.tasksFailed)
        : 1;

    // Find current task progress
    let currentTaskProgress: number | undefined;
    if (agent.currentTaskId) {
      const latestProgress = this.latestProgress.get(agent.currentTaskId);
      currentTaskProgress = latestProgress?.percentage;
    }

    return {
      agentId,
      role: agent.role,
      tasksCompleted: stats.tasksCompleted,
      tasksInProgress: agent.currentTaskId ? 1 : 0,
      timeSpentMinutes: Math.round(stats.totalTimeMinutes),
      avgCompletionTimeMinutes: Math.round(avgCompletionTime),
      successRate,
      lastActivity: agent.lastActivity,
      currentTaskId: agent.currentTaskId,
      currentTaskProgress,
    };
  }

  /**
   * Create a milestone
   */
  createMilestone(
    name: string,
    description: string,
    options: {
      targetDate?: Date;
      requiredTaskIds?: string[];
      parentMilestoneId?: string;
      owner?: string;
      tags?: string[];
    } = {}
  ): Milestone {
    const now = new Date();
    const id = this.generateId('milestone');

    const milestone: Milestone = {
      id,
      name,
      description,
      status: MilestoneStatus.PENDING,
      targetDate: options.targetDate,
      requiredTaskIds: options.requiredTaskIds || [],
      progress: 0,
      parentMilestoneId: options.parentMilestoneId,
      childMilestoneIds: [],
      createdAt: now,
      updatedAt: now,
      owner: options.owner,
      tags: options.tags || [],
    };

    this.milestones.set(id, milestone);

    // Update parent if exists
    if (options.parentMilestoneId) {
      const parent = this.milestones.get(options.parentMilestoneId);
      if (parent) {
        parent.childMilestoneIds.push(id);
      }
    }

    // Calculate initial progress
    this.recalculateMilestoneProgress(id);

    this.emit('milestoneCreated', milestone);
    return milestone;
  }

  /**
   * Update milestone status
   */
  updateMilestoneStatus(milestoneId: string, status: MilestoneStatus): Milestone | undefined {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) return undefined;

    const oldStatus = milestone.status;
    milestone.status = status;
    milestone.updatedAt = new Date();

    if (status === MilestoneStatus.ACHIEVED) {
      milestone.completedDate = new Date();
      milestone.progress = 100;
    }

    this.emit('milestoneStatusChanged', { milestone, oldStatus, newStatus: status });
    return milestone;
  }

  /**
   * Get milestone by ID
   */
  getMilestone(milestoneId: string): Milestone | undefined {
    return this.milestones.get(milestoneId);
  }

  /**
   * Get all milestones
   */
  getAllMilestones(): Milestone[] {
    return Array.from(this.milestones.values());
  }

  /**
   * Get milestones for tasks
   */
  getMilestonesForTasks(taskIds: string[]): Milestone[] {
    const taskIdSet = new Set(taskIds);
    return Array.from(this.milestones.values()).filter((m) =>
      m.requiredTaskIds.some((id) => taskIdSet.has(id))
    );
  }

  /**
   * Get progress statistics
   */
  getStats(): ProgressStats {
    const byStatus: Record<ProgressStatus, number> = {
      [ProgressStatus.NOT_STARTED]: 0,
      [ProgressStatus.IN_PROGRESS]: 0,
      [ProgressStatus.COMPLETED]: 0,
      [ProgressStatus.BLOCKED]: 0,
      [ProgressStatus.FAILED]: 0,
      [ProgressStatus.PAUSED]: 0,
    };

    const milestonesByStatus: Record<MilestoneStatus, number> = {
      [MilestoneStatus.PENDING]: 0,
      [MilestoneStatus.IN_PROGRESS]: 0,
      [MilestoneStatus.ACHIEVED]: 0,
      [MilestoneStatus.MISSED]: 0,
      [MilestoneStatus.DEFERRED]: 0,
    };

    let totalEntries = 0;
    let totalTimeTracked = 0;

    this.progressHistory.forEach((history) => {
      totalEntries += history.length;
    });

    this.latestProgress.forEach((entry) => {
      byStatus[entry.status]++;
    });

    this.milestones.forEach((milestone) => {
      milestonesByStatus[milestone.status]++;
    });

    this.taskTimeTracking.forEach((tracking) => {
      totalTimeTracked += tracking.totalMinutes;
    });

    // Calculate average update frequency (entries per hour over last day)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let recentEntries = 0;
    this.progressHistory.forEach((history) => {
      recentEntries += history.filter((e) => e.timestamp.getTime() > oneDayAgo).length;
    });
    const avgUpdateFrequency = recentEntries / 24;

    return {
      totalEntries,
      byStatus,
      totalMilestones: this.milestones.size,
      milestonesByStatus,
      avgUpdateFrequency,
      totalTimeTracked: Math.round(totalTimeTracked),
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.progressHistory.clear();
    this.latestProgress.clear();
    this.milestones.clear();
    this.taskTimeTracking.clear();
    this.agentStats.clear();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default status message
   */
  private getDefaultMessage(status: ProgressStatus, percentage: number): string {
    switch (status) {
      case ProgressStatus.NOT_STARTED:
        return 'Task not started';
      case ProgressStatus.IN_PROGRESS:
        return `Task in progress (${percentage}% complete)`;
      case ProgressStatus.COMPLETED:
        return 'Task completed';
      case ProgressStatus.BLOCKED:
        return 'Task blocked';
      case ProgressStatus.FAILED:
        return 'Task failed';
      case ProgressStatus.PAUSED:
        return 'Task paused';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Update time tracking
   */
  private updateTimeTracking(
    taskId: string,
    agentId: string,
    status: ProgressStatus,
    timeSpentMinutes?: number
  ): void {
    if (!this.taskTimeTracking.has(taskId)) {
      this.taskTimeTracking.set(taskId, {
        started: new Date(),
        totalMinutes: 0,
      });
    }

    const tracking = this.taskTimeTracking.get(taskId)!;

    if (timeSpentMinutes) {
      tracking.totalMinutes += timeSpentMinutes;
    }

    if (status === ProgressStatus.COMPLETED || status === ProgressStatus.FAILED) {
      // Calculate final time if not already provided
      if (!timeSpentMinutes) {
        const elapsed = (Date.now() - tracking.started.getTime()) / 60000;
        tracking.totalMinutes = elapsed;
      }
    }
  }

  /**
   * Update agent statistics
   */
  private updateAgentStats(
    agentId: string,
    status: ProgressStatus,
    timeSpentMinutes?: number
  ): void {
    if (!this.agentStats.has(agentId)) {
      this.agentStats.set(agentId, {
        tasksCompleted: 0,
        tasksFailed: 0,
        totalTimeMinutes: 0,
        completionTimes: [],
      });
    }

    const stats = this.agentStats.get(agentId)!;

    if (timeSpentMinutes) {
      stats.totalTimeMinutes += timeSpentMinutes;
    }

    if (status === ProgressStatus.COMPLETED) {
      stats.tasksCompleted++;
      if (timeSpentMinutes) {
        stats.completionTimes.push(timeSpentMinutes);
        // Keep only last 100 times
        if (stats.completionTimes.length > 100) {
          stats.completionTimes.shift();
        }
      }
    } else if (status === ProgressStatus.FAILED) {
      stats.tasksFailed++;
    }
  }

  /**
   * Update milestone progress based on task status
   */
  private updateMilestoneProgress(taskId: string, status: ProgressStatus): void {
    this.milestones.forEach((milestone) => {
      if (milestone.requiredTaskIds.includes(taskId)) {
        this.recalculateMilestoneProgress(milestone.id);
      }
    });
  }

  /**
   * Recalculate milestone progress
   */
  private recalculateMilestoneProgress(milestoneId: string): void {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) return;

    if (milestone.requiredTaskIds.length === 0) {
      // If no required tasks, check child milestones
      if (milestone.childMilestoneIds.length > 0) {
        let totalProgress = 0;
        for (const childId of milestone.childMilestoneIds) {
          const child = this.milestones.get(childId);
          if (child) {
            totalProgress += child.progress;
          }
        }
        milestone.progress = Math.round(totalProgress / milestone.childMilestoneIds.length);
      }
    } else {
      // Calculate based on required tasks
      let totalProgress = 0;
      for (const taskId of milestone.requiredTaskIds) {
        const latest = this.latestProgress.get(taskId);
        if (latest) {
          totalProgress += latest.percentage;
        }
      }
      milestone.progress = Math.round(totalProgress / milestone.requiredTaskIds.length);
    }

    // Update status based on progress
    if (milestone.progress >= 100 && milestone.status !== MilestoneStatus.ACHIEVED) {
      this.updateMilestoneStatus(milestoneId, MilestoneStatus.ACHIEVED);
    } else if (
      milestone.progress > 0 &&
      milestone.progress < 100 &&
      milestone.status === MilestoneStatus.PENDING
    ) {
      milestone.status = MilestoneStatus.IN_PROGRESS;
    }

    milestone.updatedAt = new Date();

    // Update parent milestone
    if (milestone.parentMilestoneId) {
      this.recalculateMilestoneProgress(milestone.parentMilestoneId);
    }
  }

  /**
   * Determine overall status from task statuses
   */
  private determineOverallStatus(
    completed: number,
    inProgress: number,
    blocked: number,
    total: number
  ): ProgressStatus {
    if (completed === total) return ProgressStatus.COMPLETED;
    if (blocked > 0 && inProgress === 0) return ProgressStatus.BLOCKED;
    if (inProgress > 0) return ProgressStatus.IN_PROGRESS;
    return ProgressStatus.NOT_STARTED;
  }

  /**
   * Broadcast progress to other agents
   */
  private broadcastProgress(entry: ProgressEntry): void {
    this.messageBus.publishToTopic(
      entry.agentId,
      PROGRESS_TOPIC,
      'Progress Update',
      entry,
      { priority: MessagePriority.LOW }
    );
  }

  /**
   * Setup message handlers for progress updates
   */
  private setupMessageHandlers(): void {
    // Subscribe to progress topic for this module
    // Progress updates from other agents will be handled here
    this.messageBus.subscribe('progress-tracker', PROGRESS_TOPIC);
    this.messageBus.registerHandler('progress-tracker', (message) => {
      if (message.type === MessageType.TOPIC && message.topic === PROGRESS_TOPIC) {
        const entry = message.body as ProgressEntry;
        this.emit('remoteProgressReceived', entry);
      }
    });
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/** Global progress tracker */
let globalProgressTracker: ProgressTracker | null = null;

/**
 * Get global progress tracker
 */
export function getGlobalProgressTracker(): ProgressTracker {
  if (!globalProgressTracker) {
    globalProgressTracker = new ProgressTracker();
  }
  return globalProgressTracker;
}

/**
 * Create new progress tracker
 */
export function createProgressTracker(
  registry?: SubagentRegistry,
  messageBus?: AgentMessageBus
): ProgressTracker {
  return new ProgressTracker(registry, messageBus);
}

/**
 * Reset global progress tracker (for testing)
 */
export function resetGlobalProgressTracker(): void {
  if (globalProgressTracker) {
    globalProgressTracker.clear();
    globalProgressTracker = null;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Report progress using global tracker
 */
export function reportProgress(
  agentId: string,
  taskId: string,
  percentage: number,
  status: ProgressStatus,
  options?: ReportProgressOptions
): ProgressEntry {
  return getGlobalProgressTracker().reportProgress(agentId, taskId, percentage, status, options);
}

/**
 * Create milestone using global tracker
 */
export function createMilestone(
  name: string,
  description: string,
  options?: {
    targetDate?: Date;
    requiredTaskIds?: string[];
    parentMilestoneId?: string;
    owner?: string;
    tags?: string[];
  }
): Milestone {
  return getGlobalProgressTracker().createMilestone(name, description, options);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ProgressTracker;
