/**
 * Firebase React Hooks for Nestly
 *
 * Custom hooks for real-time Firebase data in React components
 *
 * @module hooks/use-firebase
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isFirebaseConfigured,
  rtdbGet,
  rtdbSet,
  rtdbPush,
  rtdbUpdate,
  rtdbDelete,
  rtdbSubscribe,
  getFamilyMembers,
  getFamilyTasks,
  subscribeFamilyMembers,
  subscribeTasks,
  subscribeMemories,
  createMemory,
  MemorySource,
  searchMemoriesByTags,
  getRecentMemories,
  getImportantMemories,
  updateTaskStatus,
  createFamilyTask,
  updateFamilyMemberStatus,
  FamilyMemberData,
  TaskData,
  Memory,
  MemoryType,
} from '@/lib/firebase';

// ============================================================================
// FIREBASE STATUS HOOK
// ============================================================================

/**
 * Hook to check Firebase connection status
 */
export function useFirebaseStatus() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const configured = isFirebaseConfigured();
    setIsConfigured(configured);

    if (configured) {
      // Test connection by reading a small path
      rtdbGet('.info/connected')
        .then((connected) => {
          setIsConnected(connected === true);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Connection failed');
          setIsConnected(false);
        });
    }
  }, []);

  return { isConfigured, isConnected, error };
}

// ============================================================================
// GENERIC REALTIME HOOK
// ============================================================================

/**
 * Generic hook for subscribing to realtime data
 */
export function useRealtimeData<T>(path: string, initialValue: T | null = null) {
  const [data, setData] = useState<T | null>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      setError('Firebase not configured');
      return;
    }

    const unsubscribe = rtdbSubscribe<T>(path, (newData) => {
      setData(newData);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [path]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const newData = await rtdbGet<T>(path);
    setData(newData);
    setLoading(false);
  }, [path]);

  return { data, loading, error, refresh };
}

// ============================================================================
// FAMILY MEMBERS HOOK
// ============================================================================

/**
 * Hook for managing family members with real-time updates
 */
export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeFamilyMembers((data) => {
      setMembers(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const updateStatus = useCallback(async (
    memberId: string,
    status: FamilyMemberData['status'],
    location?: string
  ) => {
    return updateFamilyMemberStatus(memberId, status, location);
  }, []);

  return { members, loading, error, updateStatus };
}

// ============================================================================
// TASKS HOOK
// ============================================================================

/**
 * Hook for managing family tasks with real-time updates
 */
export function useFamilyTasks() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeTasks((data) => {
      setTasks(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const createTask = useCallback(async (
    task: Omit<TaskData, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    return createFamilyTask(task);
  }, []);

  const completeTask = useCallback(async (taskId: string) => {
    return updateTaskStatus(taskId, 'completed');
  }, []);

  const updateTask = useCallback(async (
    taskId: string,
    status: TaskData['status']
  ) => {
    return updateTaskStatus(taskId, status);
  }, []);

  // Computed values
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const todayTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const today = new Date().toDateString();
    return new Date(t.dueDate).toDateString() === today;
  });

  return {
    tasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    todayTasks,
    loading,
    error,
    createTask,
    completeTask,
    updateTask,
  };
}

// ============================================================================
// MEMORY HOOK
// ============================================================================

/**
 * Options for the useMemories hook
 */
export interface UseMemoriesOptions {
  /** Filter memories by source surface (e.g., 'desktop', 'dashboard', 'agent') */
  source?: MemorySource['surface'];
}

/**
 * Raw memory data from Firebase (may have old field names)
 */
interface RawMemoryData {
  id?: string;
  type: MemoryType;
  content: string;
  context?: string;
  tags?: string[];
  importance?: number;
  importance_score?: number; // Legacy field name for backward compatibility
  timestamp?: string;
  expiresAt?: string;
  source?: { surface: string; backend: string; userId?: string; sessionId?: string } | string; // Can be object or legacy string
  relatedIds?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Normalize memory data to handle backward compatibility
 * Handles both old 'importance_score' and new 'importance' field names
 */
function normalizeMemory(raw: RawMemoryData, id: string): Memory {
  return {
    id: raw.id || id,
    type: raw.type,
    content: raw.content,
    context: raw.context,
    tags: raw.tags || [],
    // Use 'importance' if available, fall back to 'importance_score' for backward compatibility
    importance: raw.importance ?? raw.importance_score ?? 0.5,
    timestamp: raw.timestamp || new Date().toISOString(),
    expiresAt: raw.expiresAt,
    source: (typeof raw.source === 'string' 
      ? { surface: raw.source, backend: 'firebase' } 
      : raw.source) as Memory['source'],
    relatedIds: raw.relatedIds,
    metadata: raw.metadata,
  };
}

/**
 * Hook for managing memories/knowledge base
 * Uses the unified 'memories' path and handles backward compatibility
 * with old field names (importance_score -> importance)
 *
 * @param options - Optional configuration for filtering memories
 */
export function useMemories(options?: UseMemoriesOptions) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sourceFilter = options?.source;

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    // Subscribe to the unified 'memories' path
    const unsubscribe = rtdbSubscribe<Record<string, RawMemoryData>>('memories', (data) => {
      if (!data) {
        setMemories([]);
        setLoading(false);
        return;
      }

      // Normalize all memories and apply source filter if specified
      let normalizedMemories = Object.entries(data).map(([id, raw]) =>
        normalizeMemory(raw, id)
      );

      // Apply source filter if specified
      if (sourceFilter) {
        normalizedMemories = normalizedMemories.filter(m => m.source?.surface === sourceFilter);
      }

      // Sort by timestamp descending (most recent first)
      normalizedMemories.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setMemories(normalizedMemories);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [sourceFilter]);

  const addMemory = useCallback(async (
    content: string,
    type: MemoryType,
    tags: string[] = [],
    importance: number = 0.5,
    context?: string
  ) => {
    return createMemory({
      type,
      content,
      context,
      tags,
      importance,
    });
  }, []);

  const searchByTags = useCallback(async (tags: string[]) => {
    return searchMemoriesByTags(tags);
  }, []);

  const getRecent = useCallback(async (limit: number = 10) => {
    return getRecentMemories(limit);
  }, []);

  const getImportant = useCallback(async (minImportance: number = 0.8) => {
    return getImportantMemories(minImportance);
  }, []);

  // Computed values
  const semanticMemories = memories.filter(m => m.type === 'semantic');
  const episodicMemories = memories.filter(m => m.type === 'episodic');
  const proceduralMemories = memories.filter(m => m.type === 'procedural');
  const importantMemories = memories.filter(m => m.importance >= 0.8);

  return {
    memories,
    semanticMemories,
    episodicMemories,
    proceduralMemories,
    importantMemories,
    loading,
    error,
    addMemory,
    searchByTags,
    getRecent,
    getImportant,
  };
}

// ============================================================================
// CONFIG HOOK
// ============================================================================

/**
 * Hook for managing configuration values
 */
export function useConfig<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    rtdbGet<T>(`config/${key}`).then((data) => {
      if (data !== null) {
        setValue(data);
      }
      setLoading(false);
    });
  }, [key]);

  const updateValue = useCallback(async (newValue: T) => {
    const success = await rtdbSet(`config/${key}`, newValue);
    if (success) {
      setValue(newValue);
    }
    return success;
  }, [key]);

  return { value, loading, updateValue };
}

// ============================================================================
// PRESENCE HOOK
// ============================================================================

/**
 * Hook for tracking user presence
 */
export function usePresence(userId: string) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured() || !userId) return;

    // Update presence on mount
    rtdbSet(`presence/${userId}`, {
      online: true,
      lastSeen: new Date().toISOString(),
    });

    // Update presence on visibility change
    const handleVisibilityChange = () => {
      rtdbUpdate(`presence/${userId}`, {
        online: !document.hidden,
        lastSeen: new Date().toISOString(),
      });
    };

    // Update presence before unload
    const handleBeforeUnload = () => {
      rtdbSet(`presence/${userId}`, {
        online: false,
        lastSeen: new Date().toISOString(),
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Subscribe to own presence
    const unsubscribe = rtdbSubscribe<{ online: boolean }>(
      `presence/${userId}`,
      (data) => {
        setIsOnline(data?.online ?? false);
      }
    );

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (unsubscribe) unsubscribe();
      handleBeforeUnload();
    };
  }, [userId]);

  return { isOnline };
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export type {
  FamilyMemberData,
  TaskData,
  Memory,
  MemoryType,
};
