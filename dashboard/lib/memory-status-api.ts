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
// SIMULATED DATA (Replace with real checks later)
// ============================================================================

/**
 * Simulate checking Firebase RTDB connection
 */
async function checkFirebaseRTDB(): Promise<BackendStatus> {
  // Simulate network latency
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
  const latency = Date.now() - startTime;

  // Simulate occasional connection issues (5% failure rate)
  const connected = Math.random() > 0.05;

  return {
    name: 'Firebase RTDB',
    type: 'firebase',
    connected,
    latency: connected ? latency : undefined,
    lastChecked: new Date(),
    error: connected ? undefined : 'Connection timeout',
    details: {
      region: 'us-central1',
      endpoint: 'sartor-family-default-rtdb.firebaseio.com',
    },
  };
}

/**
 * Simulate checking Firestore connection
 */
async function checkFirestore(): Promise<BackendStatus> {
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, Math.random() * 60 + 30));
  const latency = Date.now() - startTime;

  const connected = Math.random() > 0.03;

  return {
    name: 'Firestore',
    type: 'firestore',
    connected,
    latency: connected ? latency : undefined,
    lastChecked: new Date(),
    error: connected ? undefined : 'Service unavailable',
    details: {
      region: 'us-central1',
    },
  };
}

/**
 * Simulate checking Obsidian Local REST API connection
 */
async function checkObsidian(): Promise<BackendStatus> {
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10));
  const latency = Date.now() - startTime;

  // Obsidian is local, so more likely to be connected when running
  const connected = Math.random() > 0.1;

  return {
    name: 'Obsidian',
    type: 'obsidian',
    connected,
    latency: connected ? latency : undefined,
    lastChecked: new Date(),
    error: connected ? undefined : 'Local REST API not responding',
    details: {
      endpoint: 'http://localhost:27123',
      version: connected ? '1.5.8' : undefined,
    },
  };
}

/**
 * Simulate checking Google Drive connection
 */
async function checkGoogleDrive(): Promise<BackendStatus> {
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  const latency = Date.now() - startTime;

  // Google Drive might have auth issues
  const connected = Math.random() > 0.08;

  return {
    name: 'Google Drive',
    type: 'gdrive',
    connected,
    latency: connected ? latency : undefined,
    lastChecked: new Date(),
    error: connected ? undefined : 'OAuth token expired',
    details: {
      endpoint: 'drive.googleapis.com',
    },
  };
}

/**
 * Simulate checking GitHub archive connection
 */
async function checkGitHub(): Promise<BackendStatus> {
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, Math.random() * 80 + 40));
  const latency = Date.now() - startTime;

  const connected = Math.random() > 0.02;

  return {
    name: 'GitHub Archive',
    type: 'github',
    connected,
    latency: connected ? latency : undefined,
    lastChecked: new Date(),
    error: connected ? undefined : 'Rate limit exceeded',
    details: {
      endpoint: 'api.github.com',
    },
  };
}

/**
 * Get simulated tier statistics
 */
function getSimulatedTierStats(): MemoryTierStats {
  return {
    hot: {
      count: Math.floor(Math.random() * 50) + 100,
      sizeBytes: Math.floor(Math.random() * 5000000) + 2000000, // 2-7 MB
    },
    warm: {
      count: Math.floor(Math.random() * 200) + 500,
      sizeBytes: Math.floor(Math.random() * 50000000) + 20000000, // 20-70 MB
    },
    cold: {
      count: Math.floor(Math.random() * 1000) + 2000,
    },
  };
}

/**
 * Calculate overall health based on backend statuses
 */
function calculateOverallHealth(backends: BackendStatus[]): HealthStatus {
  const connectedCount = backends.filter(b => b.connected).length;
  const totalCount = backends.length;
  const ratio = connectedCount / totalCount;

  // Firebase RTDB is critical for hot tier
  const firebaseStatus = backends.find(b => b.type === 'firebase');
  const isCriticalDown = firebaseStatus && !firebaseStatus.connected;

  if (isCriticalDown || ratio < 0.5) return 'offline';
  if (ratio < 1) return 'degraded';
  return 'healthy';
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Check health of a specific backend
 */
export async function checkBackendHealth(backend: BackendType): Promise<BackendStatus> {
  switch (backend) {
    case 'firebase':
      return checkFirebaseRTDB();
    case 'firestore':
      return checkFirestore();
    case 'obsidian':
      return checkObsidian();
    case 'gdrive':
      return checkGoogleDrive();
    case 'github':
      return checkGitHub();
    default:
      throw new Error(`Unknown backend type: ${backend}`);
  }
}

/**
 * Get complete memory system status
 */
export async function getMemorySystemStatus(): Promise<MemorySystemStatus> {
  // Check all backends in parallel
  const [firebase, firestore, obsidian, gdrive, github] = await Promise.all([
    checkFirebaseRTDB(),
    checkFirestore(),
    checkObsidian(),
    checkGoogleDrive(),
    checkGitHub(),
  ]);

  const backends = [firebase, firestore, obsidian, gdrive, github];
  const overall = calculateOverallHealth(backends);
  const tiers = getSimulatedTierStats();

  return {
    overall,
    backends,
    tiers,
    lastSync: new Date(Date.now() - Math.floor(Math.random() * 300000)), // Within last 5 mins
  };
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
    // In production, this would query actual storage metrics
    await new Promise(resolve => setTimeout(resolve, 50));
    const stats = getSimulatedTierStats();
    return {
      success: true,
      data: stats,
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
