/**
 * Unified Memory Types for Sartor Claude Network
 * Used across all backends: Firebase, Obsidian, GDrive, GitHub
 */

export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'working';
export type TierType = 'working' | 'hot' | 'warm' | 'cold';
export type StorageBackend = 'firebase' | 'firestore' | 'obsidian' | 'gdrive' | 'github' | 'local';
export type ClaudeSurface = 'desktop' | 'code' | 'dashboard' | 'api' | 'agent';

export interface MemorySource {
  surface: ClaudeSurface;
  backend: StorageBackend;
  userId?: string;
  sessionId?: string;
}

export interface MemorySync {
  version: number;
  contentHash: string;
  lastSyncedAt: string;
  pendingSync: boolean;
  availableIn: StorageBackend[];
}

export interface MemoryEmbedding {
  vector: number[];
  model: string;
  dimensions: number;
  generatedAt: string;
}

export interface UnifiedMemory {
  // Core identity
  id: string;
  type: MemoryType;

  // Content
  content: string;
  summary?: string;

  // Importance (unified field name - NOT importance_score)
  importance: number;  // 0-1 scale

  // Source tracking
  source: MemorySource;

  // Temporal
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  accessCount: number;

  // Organization
  tags: string[];
  categories?: string[];

  // Tier
  tier: TierType;

  // Sync
  sync?: MemorySync;

  // Embedding (optional)
  embedding?: MemoryEmbedding;

  // Legacy field support (for backward compatibility)
  importance_score?: number;  // @deprecated - use importance
}

/**
 * Helper to normalize legacy memories to unified format
 */
export function normalizeMemory(raw: any): UnifiedMemory {
  return {
    ...raw,
    // Normalize importance field
    importance: raw.importance ?? raw.importance_score ?? 0.5,
    // Ensure source exists
    source: raw.source ?? { surface: 'api', backend: 'firebase' },
    // Ensure tier exists
    tier: raw.tier ?? 'hot',
    // Ensure timestamps
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
    lastAccessedAt: raw.lastAccessedAt ?? raw.last_accessed ?? new Date().toISOString(),
    accessCount: raw.accessCount ?? raw.access_count ?? 0,
    // Ensure arrays
    tags: raw.tags ?? [],
  };
}

/**
 * Collection paths - canonical names
 */
export const MEMORY_COLLECTIONS = {
  HOT: 'memories',           // Firebase RTDB - unified name
  WARM: 'memories',          // Firestore - same collection, different db
  COLD: 'memories',          // GitHub archive path prefix
  LEGACY_MCP: 'mcp-memories', // Old backend path (deprecated)
  LEGACY_DASHBOARD: 'knowledge', // Old dashboard path (deprecated)
} as const;
