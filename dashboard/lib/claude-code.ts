/**
 * Claude Code Integration Client
 *
 * Provides integration with Claude Code for background task processing.
 * Uses the Agent SDK pattern to spawn Claude Code as a subprocess.
 *
 * @module lib/claude-code
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Types of tasks Claude Code can perform
 */
export type ClaudeTaskType =
  | 'analyze'    // Analyze data, schedules, documents
  | 'organize'   // Organize and categorize items
  | 'summarize'  // Summarize content (emails, documents)
  | 'generate'   // Generate reports, content
  | 'answer';    // Answer complex questions

/**
 * Status of a Claude task
 */
export type ClaudeTaskStatus = 'pending' | 'running' | 'complete' | 'error';

/**
 * Priority level for tasks
 */
export type ClaudeTaskPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * A Claude Code background task
 */
export interface ClaudeTask {
  id: string;
  type: ClaudeTaskType;
  prompt: string;
  context?: Record<string, unknown>;
  status: ClaudeTaskStatus;
  priority: ClaudeTaskPriority;
  result?: string;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy?: string;
  metadata?: {
    category?: string;
    relatedItems?: string[];
    estimatedDuration?: number; // in seconds
    actualDuration?: number; // in seconds
  };
}

/**
 * Input for creating a new task
 */
export interface CreateTaskInput {
  type: ClaudeTaskType;
  prompt: string;
  context?: Record<string, unknown>;
  priority?: ClaudeTaskPriority;
  createdBy?: string;
  metadata?: ClaudeTask['metadata'];
}

/**
 * Task queue statistics
 */
export interface TaskQueueStats {
  pending: number;
  running: number;
  completed: number;
  errors: number;
  totalToday: number;
  averageDuration: number; // in seconds
}

/**
 * Result from a quick Claude question
 */
export interface QuickAskResult {
  answer: string;
  suggestions?: string[];
  confidence?: number;
}

// ============================================================================
// TASK STORAGE (In-memory for now, can be replaced with Firebase)
// ============================================================================

// In-memory task storage - in production, use Firebase
const taskStore: Map<string, ClaudeTask> = new Map();
const taskQueue: string[] = [];

/**
 * Generate a unique task ID
 */
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// CLAUDE CODE CLIENT
// ============================================================================

/**
 * Configuration for Claude Code client
 */
export interface ClaudeCodeConfig {
  baseUrl?: string;
  timeout?: number; // in milliseconds
  maxRetries?: number;
}

/**
 * Claude Code Client
 *
 * Manages background tasks using Claude Code
 */
export class ClaudeCodeClient {
  private config: Required<ClaudeCodeConfig>;

  constructor(config: ClaudeCodeConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout || 300000, // 5 minutes
      maxRetries: config.maxRetries || 3,
    };
  }

  /**
   * Create a new background task
   */
  async createTask(input: CreateTaskInput): Promise<ClaudeTask> {
    const task: ClaudeTask = {
      id: generateTaskId(),
      type: input.type,
      prompt: input.prompt,
      context: input.context,
      status: 'pending',
      priority: input.priority || 'normal',
      createdAt: new Date(),
      createdBy: input.createdBy,
      metadata: input.metadata,
    };

    // Store task
    taskStore.set(task.id, task);
    taskQueue.push(task.id);

    // In a real implementation, this would trigger the task runner
    // For now, we'll simulate task execution via the API
    return task;
  }

  /**
   * Get a task by ID
   */
  async getTask(id: string): Promise<ClaudeTask | null> {
    return taskStore.get(id) || null;
  }

  /**
   * Get all tasks
   */
  async getTasks(options?: {
    status?: ClaudeTaskStatus;
    type?: ClaudeTaskType;
    limit?: number;
    offset?: number;
  }): Promise<ClaudeTask[]> {
    let tasks = Array.from(taskStore.values());

    // Filter by status
    if (options?.status) {
      tasks = tasks.filter(t => t.status === options.status);
    }

    // Filter by type
    if (options?.type) {
      tasks = tasks.filter(t => t.type === options.type);
    }

    // Sort by creation date (newest first)
    tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    if (options?.offset) {
      tasks = tasks.slice(options.offset);
    }
    if (options?.limit) {
      tasks = tasks.slice(0, options.limit);
    }

    return tasks;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    id: string,
    status: ClaudeTaskStatus,
    result?: string,
    error?: string
  ): Promise<ClaudeTask | null> {
    const task = taskStore.get(id);
    if (!task) return null;

    const updatedTask: ClaudeTask = {
      ...task,
      status,
      result,
      error,
      ...(status === 'running' && { startedAt: new Date() }),
      ...(status === 'complete' || status === 'error' ? { completedAt: new Date() } : {}),
    };

    // Calculate actual duration
    if (updatedTask.completedAt && updatedTask.startedAt) {
      updatedTask.metadata = {
        ...updatedTask.metadata,
        actualDuration: Math.round(
          (updatedTask.completedAt.getTime() - updatedTask.startedAt.getTime()) / 1000
        ),
      };
    }

    taskStore.set(id, updatedTask);
    return updatedTask;
  }

  /**
   * Cancel a pending task
   */
  async cancelTask(id: string): Promise<boolean> {
    const task = taskStore.get(id);
    if (!task || task.status !== 'pending') return false;

    await this.updateTaskStatus(id, 'error', undefined, 'Task cancelled by user');

    // Remove from queue
    const queueIndex = taskQueue.indexOf(id);
    if (queueIndex > -1) {
      taskQueue.splice(queueIndex, 1);
    }

    return true;
  }

  /**
   * Retry a failed task
   */
  async retryTask(id: string): Promise<ClaudeTask | null> {
    const task = taskStore.get(id);
    if (!task || task.status !== 'error') return null;

    // Create a new task with the same parameters
    const newTask = await this.createTask({
      type: task.type,
      prompt: task.prompt,
      context: task.context,
      priority: task.priority,
      createdBy: task.createdBy,
      metadata: task.metadata,
    });

    return newTask;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<TaskQueueStats> {
    const tasks = Array.from(taskStore.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTasks = tasks.filter(t => t.createdAt >= today);
    const completedTasks = tasks.filter(t =>
      t.status === 'complete' && t.metadata?.actualDuration
    );

    const averageDuration = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => sum + (t.metadata?.actualDuration || 0), 0) / completedTasks.length
      : 0;

    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'complete').length,
      errors: tasks.filter(t => t.status === 'error').length,
      totalToday: todayTasks.length,
      averageDuration: Math.round(averageDuration),
    };
  }

  /**
   * Quick ask Claude a question (immediate response)
   */
  async quickAsk(question: string, context?: Record<string, unknown>): Promise<QuickAskResult> {
    // This calls the API endpoint which handles the actual Claude interaction
    const response = await fetch(`${this.config.baseUrl}/api/claude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'quick-ask',
        question,
        context,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get response from Claude');
    }

    return response.json();
  }

  /**
   * Get smart suggestions based on current context
   */
  async getSuggestions(context: {
    calendarEvents?: unknown[];
    pendingTasks?: unknown[];
    recentEmails?: unknown[];
    familyMembers?: unknown[];
  }): Promise<string[]> {
    const response = await fetch(`${this.config.baseUrl}/api/claude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get-suggestions',
        context,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get suggestions');
    }

    const data = await response.json();
    return data.suggestions || [];
  }

  /**
   * Clear completed tasks older than specified days
   */
  async cleanupOldTasks(olderThanDays: number = 7): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    let removed = 0;
    for (const [id, task] of taskStore.entries()) {
      if (
        (task.status === 'complete' || task.status === 'error') &&
        task.createdAt < cutoff
      ) {
        taskStore.delete(id);
        removed++;
      }
    }

    return removed;
  }
}

// ============================================================================
// PREDEFINED TASK TEMPLATES
// ============================================================================

/**
 * Common task templates for quick task creation
 */
export const taskTemplates = {
  /**
   * Analyze schedule for conflicts
   */
  analyzeSchedule: (events: unknown[], familyMember?: string): CreateTaskInput => ({
    type: 'analyze',
    prompt: `Analyze the following calendar events for ${familyMember || 'the family'} and identify any scheduling conflicts, tight transitions, or potential issues. Suggest solutions if conflicts are found.`,
    context: { events, familyMember },
    priority: 'normal',
    metadata: { category: 'schedule' },
  }),

  /**
   * Summarize emails
   */
  summarizeEmails: (emails: unknown[], focusAreas?: string[]): CreateTaskInput => ({
    type: 'summarize',
    prompt: `Summarize the following emails, highlighting action items, important dates, and urgent matters. ${focusAreas ? `Focus on: ${focusAreas.join(', ')}` : ''}`,
    context: { emails, focusAreas },
    priority: 'normal',
    metadata: { category: 'email' },
  }),

  /**
   * Organize documents
   */
  organizeDocuments: (documents: unknown[]): CreateTaskInput => ({
    type: 'organize',
    prompt: 'Review the following documents and suggest an organization structure with categories, tags, and importance levels.',
    context: { documents },
    priority: 'low',
    metadata: { category: 'documents' },
  }),

  /**
   * Generate weekly report
   */
  generateWeeklyReport: (data: {
    events?: unknown[];
    completedTasks?: unknown[];
    upcomingTasks?: unknown[];
    highlights?: string[];
  }): CreateTaskInput => ({
    type: 'generate',
    prompt: 'Generate a friendly weekly family report summarizing activities, accomplishments, and upcoming events.',
    context: data,
    priority: 'normal',
    metadata: { category: 'report' },
  }),

  /**
   * Answer complex family question
   */
  answerQuestion: (
    question: string,
    relevantContext?: Record<string, unknown>
  ): CreateTaskInput => ({
    type: 'answer',
    prompt: question,
    context: relevantContext,
    priority: 'high',
    metadata: { category: 'question' },
  }),

  /**
   * Analyze grocery list
   */
  analyzeGroceryList: (currentList: string[], history?: unknown[]): CreateTaskInput => ({
    type: 'analyze',
    prompt: 'Analyze the current grocery list and shopping history to suggest items that might be running low or commonly purchased items that are missing.',
    context: { currentList, history },
    priority: 'low',
    metadata: { category: 'shopping' },
  }),

  /**
   * Prepare meeting notes
   */
  prepareMeetingNotes: (meeting: {
    title: string;
    attendees?: string[];
    agenda?: string[];
    relatedDocuments?: unknown[];
  }): CreateTaskInput => ({
    type: 'generate',
    prompt: `Prepare briefing notes for the meeting "${meeting.title}". Include key points to discuss, relevant background information, and suggested questions.`,
    context: meeting,
    priority: 'high',
    metadata: { category: 'meeting' },
  }),
};

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default Claude Code client instance
 */
export const claudeCode = new ClaudeCodeClient();

/**
 * Create a new Claude Code client with custom configuration
 */
export function createClaudeCodeClient(config?: ClaudeCodeConfig): ClaudeCodeClient {
  return new ClaudeCodeClient(config);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get human-readable task type label
 */
export function getTaskTypeLabel(type: ClaudeTaskType): string {
  const labels: Record<ClaudeTaskType, string> = {
    analyze: 'Analyze',
    organize: 'Organize',
    summarize: 'Summarize',
    generate: 'Generate',
    answer: 'Answer',
  };
  return labels[type];
}

/**
 * Get task type icon name (for lucide-react)
 */
export function getTaskTypeIcon(type: ClaudeTaskType): string {
  const icons: Record<ClaudeTaskType, string> = {
    analyze: 'BarChart3',
    organize: 'FolderTree',
    summarize: 'FileText',
    generate: 'Sparkles',
    answer: 'MessageCircle',
  };
  return icons[type];
}

/**
 * Get status color class
 */
export function getStatusColor(status: ClaudeTaskStatus): string {
  const colors: Record<ClaudeTaskStatus, string> = {
    pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    running: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    complete: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    error: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  };
  return colors[status];
}

/**
 * Get priority color class
 */
export function getPriorityColor(priority: ClaudeTaskPriority): string {
  const colors: Record<ClaudeTaskPriority, string> = {
    low: 'text-gray-600',
    normal: 'text-blue-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
  };
  return colors[priority];
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}
