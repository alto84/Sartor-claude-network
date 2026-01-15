/**
 * useClaude Hook
 *
 * React hook for Claude Code background task operations.
 * Provides easy access to create, manage, and track Claude tasks.
 *
 * @module hooks/use-claude
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  ClaudeTask,
  ClaudeTaskType,
  ClaudeTaskStatus,
  ClaudeTaskPriority,
  TaskQueueStats,
  CreateTaskInput,
} from '@/lib/claude-code';
import type { Suggestion } from '@/components/claude/claude-suggestions';

// ============================================================================
// TYPES
// ============================================================================

export interface UseClaudeState {
  tasks: ClaudeTask[];
  stats: TaskQueueStats | null;
  suggestions: Suggestion[];
  isLoading: boolean;
  isCreating: boolean;
  isFetchingSuggestions: boolean;
  error: string | null;
}

export interface UseClaudeActions {
  /** Ask Claude a quick question */
  askClaude: (
    question: string,
    context?: Record<string, unknown>
  ) => Promise<{ answer: string; suggestions?: string[] }>;

  /** Create a background task */
  runTask: (
    type: ClaudeTaskType,
    prompt: string,
    options?: {
      context?: Record<string, unknown>;
      priority?: ClaudeTaskPriority;
      createdBy?: string;
    }
  ) => Promise<ClaudeTask | null>;

  /** Get all tasks */
  getTasks: (options?: {
    status?: ClaudeTaskStatus;
    type?: ClaudeTaskType;
    limit?: number;
    offset?: number;
  }) => Promise<void>;

  /** Get a specific task by ID */
  getTaskStatus: (id: string) => Promise<ClaudeTask | null>;

  /** Retry a failed task */
  retryTask: (id: string) => Promise<ClaudeTask | null>;

  /** Cancel a pending task */
  cancelTask: (id: string) => Promise<boolean>;

  /** Refresh tasks list */
  refreshTasks: () => Promise<void>;

  /** Fetch smart suggestions */
  fetchSuggestions: (context?: {
    calendarEvents?: unknown[];
    pendingTasks?: unknown[];
    recentEmails?: unknown[];
    familyMembers?: unknown[];
  }) => Promise<void>;

  /** Dismiss a suggestion */
  dismissSuggestion: (id: string) => void;

  /** Fetch queue statistics */
  fetchStats: () => Promise<void>;

  /** Clear error state */
  clearError: () => void;
}

export type UseClaudeReturn = UseClaudeState & UseClaudeActions;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing Claude Code operations
 *
 * @param options - Configuration options
 * @returns State and actions for Claude operations
 *
 * @example
 * ```tsx
 * const {
 *   tasks,
 *   isLoading,
 *   askClaude,
 *   runTask,
 *   suggestions,
 * } = useClaude({ autoFetch: true });
 *
 * // Ask a quick question
 * const { answer } = await askClaude("What's on my schedule today?");
 *
 * // Run a background task
 * const task = await runTask('analyze', 'Analyze my emails for important items', {
 *   context: { emails: [...] },
 *   priority: 'high'
 * });
 * ```
 */
export function useClaude(options: {
  autoFetch?: boolean;
  pollingInterval?: number; // in milliseconds
} = {}): UseClaudeReturn {
  const { autoFetch = true, pollingInterval = 5000 } = options;

  // State
  const [tasks, setTasks] = useState<ClaudeTask[]>([]);
  const [stats, setStats] = useState<TaskQueueStats | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for polling
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const hasActiveTasks = tasks.some(t => t.status === 'pending' || t.status === 'running');

  // ============================================================================
  // API CALLS
  // ============================================================================

  /**
   * Ask Claude a quick question
   */
  const askClaude = useCallback(async (
    question: string,
    context?: Record<string, unknown>
  ): Promise<{ answer: string; suggestions?: string[] }> => {
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quick-ask',
          question,
          context,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get response');
      }

      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  /**
   * Create a background task
   */
  const runTask = useCallback(async (
    type: ClaudeTaskType,
    prompt: string,
    options?: {
      context?: Record<string, unknown>;
      priority?: ClaudeTaskPriority;
      createdBy?: string;
    }
  ): Promise<ClaudeTask | null> => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-task',
          type,
          prompt,
          ...options,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create task');
      }

      const task = await response.json();

      // Add to local state
      setTasks(prev => [
        {
          ...task,
          createdAt: new Date(task.createdAt),
          startedAt: task.startedAt ? new Date(task.startedAt) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        },
        ...prev,
      ]);

      return task;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Get all tasks
   */
  const getTasks = useCallback(async (options?: {
    status?: ClaudeTaskStatus;
    type?: ClaudeTaskType;
    limit?: number;
    offset?: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.status) params.set('status', options.status);
      if (options?.type) params.set('type', options.type);
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.offset) params.set('offset', String(options.offset));

      const query = params.toString();
      const response = await fetch(`/api/claude${query ? `?${query}` : ''}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch tasks');
      }

      const data = await response.json();
      const tasksWithDates = data.tasks.map((task: ClaudeTask) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        startedAt: task.startedAt ? new Date(task.startedAt) : undefined,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }));

      setTasks(tasksWithDates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get a specific task
   */
  const getTaskStatus = useCallback(async (id: string): Promise<ClaudeTask | null> => {
    try {
      const response = await fetch(`/api/claude?id=${id}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch task');
      }

      const task = await response.json();
      return {
        ...task,
        createdAt: new Date(task.createdAt),
        startedAt: task.startedAt ? new Date(task.startedAt) : undefined,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  /**
   * Retry a failed task
   */
  const retryTask = useCallback(async (id: string): Promise<ClaudeTask | null> => {
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retry-task',
          taskId: id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to retry task');
      }

      const newTask = await response.json();

      // Update local state
      setTasks(prev => [
        {
          ...newTask,
          createdAt: new Date(newTask.createdAt),
        },
        ...prev,
      ]);

      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  /**
   * Cancel a pending task
   */
  const cancelTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel-task',
          taskId: id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel task');
      }

      // Update local state
      setTasks(prev => prev.map(t =>
        t.id === id
          ? { ...t, status: 'error' as ClaudeTaskStatus, error: 'Cancelled by user', completedAt: new Date() }
          : t
      ));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  /**
   * Refresh tasks list
   */
  const refreshTasks = useCallback(async () => {
    await getTasks();
  }, [getTasks]);

  /**
   * Fetch smart suggestions
   */
  const fetchSuggestions = useCallback(async (context?: {
    calendarEvents?: unknown[];
    pendingTasks?: unknown[];
    recentEmails?: unknown[];
    familyMembers?: unknown[];
  }) => {
    setIsFetchingSuggestions(true);

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-suggestions',
          context: context || {},
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch suggestions');
      }

      const data = await response.json();

      // Convert suggestions to proper format
      const formattedSuggestions: Suggestion[] = (data.suggestions || []).map(
        (text: string, index: number) => ({
          id: `suggestion_${Date.now()}_${index}`,
          type: 'insight' as const,
          title: 'Claude suggests',
          description: text,
          priority: 'normal' as const,
          action: {
            label: 'Learn more',
          },
          dismissable: true,
        })
      );

      setSuggestions(formattedSuggestions);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []);

  /**
   * Dismiss a suggestion
   */
  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  /**
   * Fetch queue statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/claude?stats=true');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      getTasks();
      fetchStats();
    }
  }, [autoFetch, getTasks, fetchStats]);

  // Poll for updates when there are active tasks
  useEffect(() => {
    if (hasActiveTasks) {
      pollingRef.current = setInterval(() => {
        getTasks();
      }, pollingInterval);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [hasActiveTasks, pollingInterval, getTasks]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    tasks,
    stats,
    suggestions,
    isLoading,
    isCreating,
    isFetchingSuggestions,
    error,

    // Actions
    askClaude,
    runTask,
    getTasks,
    getTaskStatus,
    retryTask,
    cancelTask,
    refreshTasks,
    fetchSuggestions,
    dismissSuggestion,
    fetchStats,
    clearError,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for quick Claude questions
 */
export function useQuickAsk() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(async (
    question: string,
    context?: Record<string, unknown>
  ): Promise<{ answer: string; suggestions?: string[] } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quick-ask',
          question,
          context,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get response');
      }

      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { ask, isLoading, error };
}

/**
 * Hook for Claude task queue stats
 */
export function useClaudeStats() {
  const [stats, setStats] = useState<TaskQueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await window.fetch('/api/claude?stats=true');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, isLoading, error, refetch: fetch };
}

/**
 * Hook for watching a specific task
 */
export function useClaudeTask(taskId: string | null) {
  const [task, setTask] = useState<ClaudeTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/claude?id=${taskId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setTask(null);
          return;
        }
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch task');
      }

      const data = await response.json();
      setTask({
        ...data,
        createdAt: new Date(data.createdAt),
        startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  // Initial fetch and polling for active tasks
  useEffect(() => {
    if (!taskId) {
      setTask(null);
      return;
    }

    fetchTask();

    // Poll while task is active
    const startPolling = () => {
      pollingRef.current = setInterval(() => {
        fetchTask();
      }, 2000);
    };

    startPolling();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [taskId, fetchTask]);

  // Stop polling when task completes
  useEffect(() => {
    if (task && (task.status === 'complete' || task.status === 'error')) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [task]);

  return { task, isLoading, error, refetch: fetchTask };
}
