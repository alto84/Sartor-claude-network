/**
 * Memory System Status API
 *
 * Provides typed functions for checking the health and status of all memory
 * system backends (Firebase RTDB, Firestore, Obsidian, Google Drive).
 *
 * @module lib/memory-status-api
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Types of memory backends
 */
export type BackendType = 'firebase' | 'firestore' | 'obsidian' | 'gdrive' | 'github';

/**
 * Status of an individual backend
 */
export interface BackendStatus {
  name: string;
  type: BackendType;
  connected: boolean;
  latency?: number;
  lastChecked: Date;
  error?: string;
  details?: {
    version?: string;
    region?: string;
    endpoint?: string;
  };
}

/**
 * Statistics for memory tiers
 */
export interface MemoryTierStats {
  hot: {
    count: number;
    sizeBytes: number;
  };
  warm: {
    count: number;
    sizeBytes: number;
  };
  cold: {
    count: number;
  };
}

/**
 * Overall memory system health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'offline';

/**
 * Complete memory system status
 */
export interface MemorySystemStatus {
  overall: HealthStatus;
  backends: BackendStatus[];
  tiers: MemoryTierStats;
  lastSync: Date;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format latency to human readable string
 */
export function formatLatency(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Get relative time string
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// ============================================================================
// API FUNCTIONS - Real Backend Checks
// ============================================================================

/**
 * Parse API response and convert date strings to Date objects
 */
function parseBackendStatus(backend: Record<string, unknown>): BackendStatus {
  return {
    name: backend.name as string,
    type: backend.type as BackendType,
    connected: backend.connected as boolean,
    latency: backend.latency as number | undefined,
    lastChecked: new Date(backend.lastChecked as string),
    error: backend.error as string | undefined,
    details: backend.details as BackendStatus['details'],
  };
}

/**
 * Get complete memory system status from the API
 */
export async function getMemorySystemStatus(): Promise<MemorySystemStatus> {
  try {
    const response = await fetch('/api/memory-status');

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      overall: data.overall as HealthStatus,
      backends: (data.backends as Record<string, unknown>[]).map(parseBackendStatus),
      tiers: data.tiers as MemoryTierStats,
      lastSync: new Date(data.lastSync as string),
    };
  } catch (error) {
    console.error('Failed to fetch memory system status:', error);
    // Return offline status if API call fails
    return {
      overall: 'offline',
      backends: [],
      tiers: {
        hot: { count: 0, sizeBytes: 0 },
        warm: { count: 0, sizeBytes: 0 },
        cold: { count: 0 },
      },
      lastSync: new Date(),
    };
  }
}

/**
 * Check health of a specific backend
 */
export async function checkBackendHealth(backend: BackendType): Promise<BackendStatus> {
  const status = await getMemorySystemStatus();
  const backendStatus = status.backends.find(b => b.type === backend);

  if (!backendStatus) {
    return {
      name: backend,
      type: backend,
      connected: false,
      lastChecked: new Date(),
      error: 'Backend not found',
    };
  }

  return backendStatus;
}

/**
 * Refresh status for all backends
 */
export async function refreshAllBackends(): Promise<ApiResponse<MemorySystemStatus>> {
  try {
    const status = await getMemorySystemStatus();
    return {
      success: true,
      data: status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh backend status',
    };
  }
}

/**
 * Get tier statistics only (lightweight call)
 */
export async function getTierStats(): Promise<ApiResponse<MemoryTierStats>> {
  try {
    const status = await getMemorySystemStatus();
    return {
      success: true,
      data: status.tiers,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tier stats',
    };
  }
}

// ============================================================================
// HEALTH CHECK UTILITIES
// ============================================================================

/**
 * Get status icon type based on health
 */
export function getStatusIcon(status: HealthStatus): 'check' | 'alert' | 'error' {
  switch (status) {
    case 'healthy':
      return 'check';
    case 'degraded':
      return 'alert';
    case 'offline':
      return 'error';
  }
}

/**
 * Get status color class based on health
 */
export function getStatusColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'text-green-500';
    case 'degraded':
      return 'text-yellow-500';
    case 'offline':
      return 'text-red-500';
  }
}

/**
 * Get background color class based on health
 */
export function getStatusBgColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'degraded':
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    case 'offline':
      return 'bg-red-100 dark:bg-red-900/30';
  }
}

/**
 * Get backend icon name based on type
 */
export function getBackendIcon(type: BackendType): string {
  switch (type) {
    case 'firebase':
    case 'firestore':
      return 'Database';
    case 'obsidian':
      return 'HardDrive';
    case 'gdrive':
    case 'github':
      return 'Cloud';
    default:
      return 'Server';
  }
}
