/**
 * Memory Store - Persistent storage for agent memories
 *
 * Provides episodic, semantic, and working memory storage.
 * Includes in-memory caching layer with TTL support for performance.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

// Types
export interface MemoryEntry {
  id: string;
  type: 'episodic' | 'semantic' | 'working';
  content: string;
  metadata: {
    timestamp: string;
    agent_id?: string;
    session_id?: string;
    topic?: string;
    tags?: string[];
    source?: string;
  };
}

interface MemoryStore {
  entries: MemoryEntry[];
  last_updated: string;
}

// Cache entry with TTL tracking
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccess: number;
}

// Cache configuration
interface CacheConfig {
  enabled: boolean;
  ttlMs: number;           // Time-to-live in milliseconds
  maxEntries: number;      // Maximum cache entries before eviction
  cleanupIntervalMs: number; // How often to run cleanup
}

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  ttlMs: 60000,            // 1 minute TTL
  maxEntries: 100,         // Max 100 cached files
  cleanupIntervalMs: 30000 // Cleanup every 30 seconds
};

// Memory cache
const storeCache = new Map<string, CacheEntry<MemoryStore>>();
let cacheConfig: CacheConfig = { ...DEFAULT_CACHE_CONFIG };
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

// Configuration
const MEMORY_BASE_PATH = process.env.MEMORY_PATH || '.swarm/memory';

// Cache management functions
export function configureCaching(config: Partial<CacheConfig>): void {
  cacheConfig = { ...cacheConfig, ...config };

  // Restart cleanup timer with new interval if enabled
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }

  if (cacheConfig.enabled && cacheConfig.cleanupIntervalMs > 0) {
    cleanupTimer = setInterval(cleanupExpiredCache, cacheConfig.cleanupIntervalMs);
  }
}

export function getCacheStats(): { size: number; config: CacheConfig; entries: string[] } {
  return {
    size: storeCache.size,
    config: { ...cacheConfig },
    entries: Array.from(storeCache.keys())
  };
}

export function clearCache(): void {
  storeCache.clear();
}

function isExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() - entry.timestamp > cacheConfig.ttlMs;
}

function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of storeCache.entries()) {
    if (now - entry.timestamp > cacheConfig.ttlMs) {
      storeCache.delete(key);
    }
  }
}

function evictLRU(): void {
  if (storeCache.size <= cacheConfig.maxEntries) return;

  // Find least recently accessed entry
  let oldestKey: string | null = null;
  let oldestAccess = Infinity;

  for (const [key, entry] of storeCache.entries()) {
    if (entry.lastAccess < oldestAccess) {
      oldestAccess = entry.lastAccess;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    storeCache.delete(oldestKey);
  }
}

function getCached(path: string): MemoryStore | null {
  if (!cacheConfig.enabled) return null;

  const cached = storeCache.get(path);
  if (!cached) return null;

  if (isExpired(cached)) {
    storeCache.delete(path);
    return null;
  }

  // Update last access time
  cached.lastAccess = Date.now();
  return cached.data;
}

function setCache(path: string, data: MemoryStore): void {
  if (!cacheConfig.enabled) return;

  // Evict if at capacity
  if (storeCache.size >= cacheConfig.maxEntries) {
    evictLRU();
  }

  storeCache.set(path, {
    data,
    timestamp: Date.now(),
    lastAccess: Date.now()
  });
}

function invalidateCache(path: string): void {
  storeCache.delete(path);
}

// Ensure directories exist
function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

// Get storage path for memory type
function getStoragePath(type: string, subPath?: string): string {
  const basePath = join(MEMORY_BASE_PATH, type);
  ensureDir(basePath);
  return subPath ? join(basePath, subPath) : basePath;
}

// Generate unique ID
function generateId(): string {
  return `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Store a memory entry
export function storeMemory(entry: Omit<MemoryEntry, 'id'>): MemoryEntry {
  const fullEntry: MemoryEntry = {
    id: generateId(),
    ...entry,
    metadata: {
      ...entry.metadata,
      timestamp: entry.metadata.timestamp || new Date().toISOString(),
    },
  };

  // Determine storage file based on type
  let storagePath: string;

  switch (entry.type) {
    case 'episodic':
      const date = fullEntry.metadata.timestamp.split('T')[0];
      storagePath = getStoragePath('episodic', `${date}.json`);
      break;
    case 'semantic':
      const topic = fullEntry.metadata.topic || 'general';
      storagePath = getStoragePath('semantic', `${topic}.json`);
      break;
    case 'working':
      const agentId = fullEntry.metadata.agent_id || 'default';
      storagePath = getStoragePath('working', `${agentId}.json`);
      break;
    default:
      throw new Error(`Unknown memory type: ${entry.type}`);
  }

  // Load existing from cache or disk
  let store: MemoryStore = getCached(storagePath) || { entries: [], last_updated: '' };

  // If not in cache and file exists, load from disk
  if (!getCached(storagePath) && existsSync(storagePath)) {
    try {
      store = JSON.parse(readFileSync(storagePath, 'utf-8'));
    } catch (e) {
      // If file is corrupted, start fresh
      store = { entries: [], last_updated: '' };
    }
  }

  // Add entry and save
  store.entries.push(fullEntry);
  store.last_updated = new Date().toISOString();
  writeFileSync(storagePath, JSON.stringify(store, null, 2));

  // Update cache with new data
  setCache(storagePath, store);

  return fullEntry;
}

// Query memories
export interface QueryFilter {
  type?: 'episodic' | 'semantic' | 'working';
  topic?: string;
  agent_id?: string;
  tags?: string[];
  after?: string;
  before?: string;
  limit?: number;
  search?: string;
}

export function queryMemory(filter: QueryFilter): MemoryEntry[] {
  const results: MemoryEntry[] = [];

  // Determine which directories to search
  const types = filter.type ? [filter.type] : ['episodic', 'semantic', 'working'];

  for (const type of types) {
    const typePath = getStoragePath(type);
    if (!existsSync(typePath)) continue;

    // Read all files in the type directory
    const files = readdirSync(typePath).filter((f: string) => f.endsWith('.json'));

    for (const file of files) {
      const filePath = join(typePath, file);
      try {
        // Try cache first, then disk
        let store = getCached(filePath);
        if (!store) {
          store = JSON.parse(readFileSync(filePath, 'utf-8'));
          setCache(filePath, store);
        }

        for (const entry of store.entries) {
          // Apply filters
          if (filter.topic && entry.metadata.topic !== filter.topic) continue;
          if (filter.agent_id && entry.metadata.agent_id !== filter.agent_id) continue;
          if (filter.after && entry.metadata.timestamp < filter.after) continue;
          if (filter.before && entry.metadata.timestamp > filter.before) continue;
          if (filter.tags && !filter.tags.some(t => entry.metadata.tags?.includes(t))) continue;
          if (filter.search && !entry.content.toLowerCase().includes(filter.search.toLowerCase())) continue;

          results.push(entry);
        }
      } catch (e) {
        // Skip corrupted files
        continue;
      }
    }
  }

  // Sort by timestamp (newest first)
  results.sort((a, b) =>
    new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime()
  );

  // Apply limit
  if (filter.limit) {
    return results.slice(0, filter.limit);
  }

  return results;
}

// Clear working memory for an agent
export function clearWorkingMemory(agentId: string): void {
  const path = getStoragePath('working', `${agentId}.json`);
  const emptyStore: MemoryStore = { entries: [], last_updated: new Date().toISOString() };
  if (existsSync(path)) {
    writeFileSync(path, JSON.stringify(emptyStore));
  }
  // Invalidate cache for this file
  invalidateCache(path);
}

// Retention policy configuration
export interface RetentionPolicy {
  type: 'episodic' | 'semantic' | 'working';
  maxAgeDays?: number;         // Delete entries older than this
  maxEntries?: number;         // Keep only this many entries (newest)
  topic?: string;              // Apply only to specific topic
}

export interface CleanupResult {
  type: string;
  topic?: string;
  filesProcessed: number;
  entriesRemoved: number;
  entriesKept: number;
}

// Apply retention policy to clean up old memories
export function applyRetentionPolicy(policy: RetentionPolicy): CleanupResult {
  const result: CleanupResult = {
    type: policy.type,
    topic: policy.topic,
    filesProcessed: 0,
    entriesRemoved: 0,
    entriesKept: 0
  };

  const typePath = getStoragePath(policy.type);
  if (!existsSync(typePath)) return result;

  const files = readdirSync(typePath).filter((f: string) => f.endsWith('.json'));
  const cutoffDate = policy.maxAgeDays
    ? new Date(Date.now() - policy.maxAgeDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  for (const file of files) {
    // If topic filter specified, only process matching files
    if (policy.topic && !file.startsWith(policy.topic)) continue;

    const filePath = join(typePath, file);
    result.filesProcessed++;

    try {
      const store: MemoryStore = JSON.parse(readFileSync(filePath, 'utf-8'));
      const originalCount = store.entries.length;
      let entries = store.entries;

      // Apply age filter
      if (cutoffDate) {
        entries = entries.filter(e => e.metadata.timestamp >= cutoffDate);
      }

      // Apply max entries filter (keep newest)
      if (policy.maxEntries && entries.length > policy.maxEntries) {
        entries.sort((a, b) =>
          new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime()
        );
        entries = entries.slice(0, policy.maxEntries);
      }

      result.entriesRemoved += originalCount - entries.length;
      result.entriesKept += entries.length;

      // Write back if changes were made
      if (entries.length < originalCount) {
        store.entries = entries;
        store.last_updated = new Date().toISOString();
        writeFileSync(filePath, JSON.stringify(store, null, 2));
        invalidateCache(filePath);
      }
    } catch (e) {
      // Skip corrupted files
      continue;
    }
  }

  return result;
}

// Run cleanup across all memory types with default policies
export function runCleanup(policies?: RetentionPolicy[]): CleanupResult[] {
  const defaultPolicies: RetentionPolicy[] = policies || [
    { type: 'episodic', maxAgeDays: 30 },     // Keep 30 days of episodic memory
    { type: 'working', maxAgeDays: 1 },       // Working memory cleared after 1 day
    { type: 'semantic', maxEntries: 1000 }    // Keep max 1000 semantic entries per topic
  ];

  return defaultPolicies.map(policy => applyRetentionPolicy(policy));
}

// Get memory statistics
export function getMemoryStats(): {
  episodic: { files: number; entries: number };
  semantic: { files: number; entries: number };
  working: { files: number; entries: number };
  totalEntries: number;
} {
  const stats = {
    episodic: { files: 0, entries: 0 },
    semantic: { files: 0, entries: 0 },
    working: { files: 0, entries: 0 },
    totalEntries: 0
  };

  for (const type of ['episodic', 'semantic', 'working'] as const) {
    const typePath = getStoragePath(type);
    if (!existsSync(typePath)) continue;

    const files = readdirSync(typePath).filter((f: string) => f.endsWith('.json'));
    stats[type].files = files.length;

    for (const file of files) {
      try {
        const store: MemoryStore = JSON.parse(readFileSync(join(typePath, file), 'utf-8'));
        stats[type].entries += store.entries.length;
      } catch (e) {
        continue;
      }
    }
    stats.totalEntries += stats[type].entries;
  }

  return stats;
}

// Summarize memories for context injection
export function summarizeMemories(filter: QueryFilter, maxTokens: number = 2000): string {
  const memories = queryMemory({ ...filter, limit: 50 }); // Get recent relevant memories

  if (memories.length === 0) {
    return 'No relevant memories found.';
  }

  // Simple summarization - in production, could use LLM
  let summary = `## Relevant Memories (${memories.length} found)\n\n`;
  let tokenEstimate = summary.length / 4; // Rough token estimate

  for (const mem of memories) {
    const entry = `### ${mem.metadata.topic || mem.type} (${mem.metadata.timestamp.split('T')[0]})\n${mem.content}\n\n`;
    const entryTokens = entry.length / 4;

    if (tokenEstimate + entryTokens > maxTokens) {
      summary += '\n... (additional memories truncated for context limit)';
      break;
    }

    summary += entry;
    tokenEstimate += entryTokens;
  }

  return summary;
}

// Export for CLI usage
// ESM-compatible entry point detection
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('memory-store.ts');

if (isMainModule) {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'store':
      const [type, content, topic] = args;
      const entry = storeMemory({
        type: type as 'episodic' | 'semantic' | 'working',
        content,
        metadata: { topic, timestamp: new Date().toISOString() },
      });
      console.log('Stored:', entry.id);
      break;

    case 'query':
      const [queryType, queryTopic] = args;
      const results = queryMemory({ type: queryType as any, topic: queryTopic, limit: 10 });
      console.log(JSON.stringify(results, null, 2));
      break;

    case 'summarize':
      const [sumTopic, sumTokens] = args;
      const summary = summarizeMemories({ topic: sumTopic }, parseInt(sumTokens) || 2000);
      console.log(summary);
      break;

    case 'stats':
      const memStats = getMemoryStats();
      console.log('=== Memory Statistics ===');
      console.log(`Episodic: ${memStats.episodic.files} files, ${memStats.episodic.entries} entries`);
      console.log(`Semantic: ${memStats.semantic.files} files, ${memStats.semantic.entries} entries`);
      console.log(`Working: ${memStats.working.files} files, ${memStats.working.entries} entries`);
      console.log(`Total: ${memStats.totalEntries} entries`);
      break;

    case 'cleanup':
      console.log('=== Running Memory Cleanup ===');
      const cleanupResults = runCleanup();
      for (const res of cleanupResults) {
        console.log(`${res.type}: processed ${res.filesProcessed} files, removed ${res.entriesRemoved}, kept ${res.entriesKept}`);
      }
      break;

    case 'cleanup-policy':
      const [policyType, maxAge, maxEntriesArg] = args;
      if (!policyType) {
        console.log('Usage: memory-store.ts cleanup-policy <type> [maxAgeDays] [maxEntries]');
        break;
      }
      const policyResult = applyRetentionPolicy({
        type: policyType as 'episodic' | 'semantic' | 'working',
        maxAgeDays: maxAge ? parseInt(maxAge) : undefined,
        maxEntries: maxEntriesArg ? parseInt(maxEntriesArg) : undefined
      });
      console.log(`Cleanup result: ${policyResult.filesProcessed} files, ${policyResult.entriesRemoved} removed, ${policyResult.entriesKept} kept`);
      break;

    default:
      console.log('Usage: memory-store.ts [store|query|summarize|stats|cleanup|cleanup-policy] [args...]');
      console.log('Commands:');
      console.log('  store <type> <content> <topic>   - Store a memory entry');
      console.log('  query <type> <topic>             - Query memories');
      console.log('  summarize <topic> [maxTokens]    - Summarize memories');
      console.log('  stats                            - Show memory statistics');
      console.log('  cleanup                          - Run default cleanup policies');
      console.log('  cleanup-policy <type> [maxAgeDays] [maxEntries] - Run custom policy');
  }
}
