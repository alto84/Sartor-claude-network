/**
 * Multi-Tier Memory Store using Firestore
 *
 * Alternative to multi-tier-store.ts that uses Firestore instead of Realtime Database.
 * Firestore is often auto-enabled on new Firebase projects and doesn't require
 * manual database creation like Realtime Database does.
 *
 * Combines multiple storage backends:
 * - Hot: Firestore (<100ms)
 * - Warm: File-based storage (<500ms)
 * - Cold: GitHub repository (1-5s)
 *
 * Memories are stored in hot tier first, then promoted/demoted based on access patterns.
 * GitHub is used for long-term archival of important patterns.
 */

import { initializeFirebase, getApp } from './firebase-init';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { FileStore, MemoryType } from './file-store';
import { GitHubColdTier } from '../memory/cold-tier';
import {
  MemorySource,
  TierType,
  MEMORY_COLLECTIONS,
  normalizeMemory as normalizeUnifiedMemory,
  ClaudeSurface,
  StorageBackend,
} from '../memory/unified-types';

interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  importance: number;  // Unified field name (not importance_score)
  tags: string[];
  createdAt: string;
  accessCount?: number;
  lastAccessedAt?: string;
  tier?: TierType;
  source?: MemorySource;
  // Legacy field support
  importance_score?: number;
  created_at?: string;
  access_count?: number;
  last_accessed?: string;
}

interface StoreConfig {
  useFirestore?: boolean;
  useGitHub?: boolean;
  useFile?: boolean;
  github?: {
    token: string;
    owner: string;
    repo: string;
    basePath?: string;
  };
  source?: {
    surface: ClaudeSurface;
    backend: StorageBackend;
  };
}

/**
 * Normalize a memory from any format (legacy or unified) to the current format
 */
function normalizeMemory(raw: any): Memory {
  const normalized = normalizeUnifiedMemory(raw);
  return {
    id: normalized.id,
    content: normalized.content,
    type: normalized.type as MemoryType,
    importance: normalized.importance,
    tags: normalized.tags,
    createdAt: normalized.createdAt,
    accessCount: normalized.accessCount,
    lastAccessedAt: normalized.lastAccessedAt,
    tier: normalized.tier as TierType,
    source: normalized.source,
    // Keep legacy fields for backward compatibility
    importance_score: normalized.importance,
    created_at: normalized.createdAt,
    access_count: normalized.accessCount,
    last_accessed: normalized.lastAccessedAt,
  };
}

/**
 * Multi-tier memory store with Firestore as hot tier
 */
export class FirestoreMultiTierStore {
  private firestoreDb: Firestore | null = null;
  private fileStore: FileStore;
  private githubStore: GitHubColdTier | null = null;

  private useFirestore: boolean = false;
  private useGitHub: boolean = false;

  // Use unified collection name from MEMORY_COLLECTIONS
  private collectionName: string = MEMORY_COLLECTIONS.HOT;

  // Default source tracking
  private defaultSource: MemorySource = { surface: 'api', backend: 'firestore' };

  constructor(config?: StoreConfig) {
    // Always initialize file store as fallback
    this.fileStore = new FileStore();

    // Set source tracking if provided
    if (config?.source) {
      this.defaultSource = {
        surface: config.source.surface,
        backend: config.source.backend,
      };
    }

    // Try Firestore if enabled or by default
    if (config?.useFirestore !== false) {
      const success = initializeFirebase();
      if (success) {
        const app = getApp();
        if (app) {
          try {
            this.firestoreDb = getFirestore(app);
            this.useFirestore = true;
            console.error('[FirestoreMultiTierStore] ✓ Firestore hot tier enabled');
          } catch (error) {
            console.error('[FirestoreMultiTierStore] Firestore initialization failed:', error);
          }
        }
      }
    }

    // Try GitHub if configured
    if (config?.useGitHub && config.github) {
      try {
        this.githubStore = new GitHubColdTier(
          config.github.token,
          config.github.owner,
          config.github.repo,
          config.github.basePath || 'memories'
        );
        this.useGitHub = true;
        console.error('[FirestoreMultiTierStore] ✓ GitHub cold tier enabled');
      } catch (error) {
        console.error('[FirestoreMultiTierStore] GitHub cold tier unavailable:', error);
      }
    }

    // Check environment for GitHub config
    if (
      !this.useGitHub &&
      process.env.GITHUB_TOKEN &&
      process.env.GITHUB_OWNER &&
      process.env.GITHUB_REPO
    ) {
      try {
        this.githubStore = new GitHubColdTier(
          process.env.GITHUB_TOKEN,
          process.env.GITHUB_OWNER,
          process.env.GITHUB_REPO,
          process.env.GITHUB_BASE_PATH || 'memories'
        );
        this.useGitHub = true;
        console.error('[FirestoreMultiTierStore] ✓ GitHub cold tier enabled (from env)');
      } catch (error) {
        console.error('[FirestoreMultiTierStore] GitHub cold tier unavailable:', error);
      }
    }

    if (!this.useFirestore && !this.useGitHub) {
      console.error('[FirestoreMultiTierStore] Using file storage only (no cloud backends configured)');
    }
  }

  async createMemory(
    content: string,
    type: MemoryType,
    options: { importance?: number; importance_score?: number; tags?: string[]; source?: MemorySource }
  ): Promise<Memory> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    // Support both importance and importance_score for backward compatibility
    const importanceValue = options.importance ?? options.importance_score ?? 0.5;

    const memory: Memory = {
      id,
      content,
      type,
      importance: importanceValue,
      tags: options.tags ?? [],
      createdAt: now,
      accessCount: 0,
      lastAccessedAt: now,
      tier: this.useFirestore ? 'hot' : 'warm',
      source: options.source ?? this.defaultSource,
      // Legacy fields for backward compatibility
      importance_score: importanceValue,
      created_at: now,
      access_count: 0,
      last_accessed: now,
    };

    // Store in hot tier (Firestore) if available
    if (this.useFirestore && this.firestoreDb) {
      try {
        await this.firestoreDb.collection(this.collectionName).doc(id).set(memory);
      } catch (error) {
        console.error('[FirestoreMultiTierStore] Firestore write failed, falling back to file:', error);
        return normalizeMemory(this.fileStore.createMemory(content, type, options));
      }
    } else {
      // Fall back to file storage
      return normalizeMemory(this.fileStore.createMemory(content, type, options));
    }

    // Also archive to GitHub if importance is high and GitHub is enabled
    if (this.useGitHub && this.githubStore && memory.importance >= 0.8) {
      try {
        await this.githubStore.set(
          `${type}/${id}.json`,
          memory,
          `Archive high-importance memory: ${id}`
        );
        console.error(`[FirestoreMultiTierStore] Archived to GitHub: ${id}`);
      } catch (error) {
        console.error('[FirestoreMultiTierStore] GitHub archive failed:', error);
      }
    }

    return memory;
  }

  async getMemory(id: string): Promise<Memory | undefined> {
    // Try hot tier first
    if (this.useFirestore && this.firestoreDb) {
      try {
        const doc = await this.firestoreDb.collection(this.collectionName).doc(id).get();
        if (doc.exists) {
          const rawMemory = doc.data();
          const memory = normalizeMemory(rawMemory);
          const now = new Date().toISOString();
          await this.firestoreDb.collection(this.collectionName).doc(id).update({
            accessCount: (memory.accessCount || 0) + 1,
            lastAccessedAt: now,
            access_count: (memory.accessCount || 0) + 1,
            last_accessed: now,
          });
          return memory;
        }
      } catch (error) {
        console.error('[FirestoreMultiTierStore] Firestore read failed:', error);
      }
    }

    // Try warm tier (file)
    const fileResult = this.fileStore.getMemory(id);
    if (fileResult) return normalizeMemory(fileResult);

    // Try cold tier (GitHub)
    if (this.useGitHub && this.githubStore) {
      try {
        // Search across type directories
        for (const type of ['episodic', 'semantic', 'procedural', 'working', 'refinement_trace', 'expert_consensus']) {
          const result = await this.githubStore.get(`${type}/${id}.json`);
          if (result) return normalizeMemory(result);
        }
      } catch (error) {
        console.error('[FirestoreMultiTierStore] GitHub read failed:', error);
      }
    }

    return undefined;
  }

  async searchMemories(
    filters: { type?: MemoryType[]; min_importance?: number },
    limit: number
  ): Promise<Memory[]> {
    const results: Memory[] = [];

    // Search hot tier
    if (this.useFirestore && this.firestoreDb) {
      try {
        let query = this.firestoreDb.collection(this.collectionName).limit(limit);

        // Apply type filter if specified (Firestore supports 'in' queries)
        if (filters.type && filters.type.length > 0 && filters.type.length <= 10) {
          query = query.where('type', 'in', filters.type) as any;
        }

        // Apply importance filter if specified
        if (filters.min_importance !== undefined) {
          query = query.where('importance', '>=', filters.min_importance) as any;
        }

        const snapshot = await query.get();
        snapshot.forEach((doc) => {
          const rawMem = doc.data();
          const mem = normalizeMemory(rawMem);
          // Double-check filters in case we couldn't apply them in query
          if (filters.type && filters.type.length > 10 && !filters.type.includes(mem.type)) return;
          if (filters.min_importance !== undefined && mem.importance < filters.min_importance)
            return;
          results.push({ ...mem, tier: 'hot' });
        });
      } catch (error) {
        console.error('[FirestoreMultiTierStore] Firestore search failed:', error);
      }
    }

    // Search warm tier
    const fileResults = this.fileStore.searchMemories(filters, limit);
    for (const rawMem of fileResults) {
      const mem = normalizeMemory(rawMem);
      if (!results.find((r) => r.id === mem.id)) {
        results.push({ ...mem, tier: 'warm' });
      }
    }

    // Sort by importance and return limited results
    return results
      .sort((a, b) => (b.importance || 0) - (a.importance || 0))
      .slice(0, limit);
  }

  async getStats(): Promise<{
    total: number;
    by_type: {
      episodic: number;
      semantic: number;
      procedural: number;
      working: number;
      refinement_trace: number;
      expert_consensus: number;
    };
    by_tier: { hot: number; warm: number; cold: number };
    backends: { firestore: boolean; github: boolean; file: boolean };
  }> {
    const stats = {
      total: 0,
      by_type: {
        episodic: 0,
        semantic: 0,
        procedural: 0,
        working: 0,
        refinement_trace: 0,
        expert_consensus: 0,
      },
      by_tier: { hot: 0, warm: 0, cold: 0 },
      backends: {
        firestore: this.useFirestore,
        github: this.useGitHub,
        file: true,
      },
    };

    // Count hot tier
    if (this.useFirestore && this.firestoreDb) {
      try {
        const snapshot = await this.firestoreDb.collection(this.collectionName).get();
        snapshot.forEach((doc) => {
          const mem = doc.data() as Memory;
          stats.total++;
          stats.by_tier.hot++;
          if (mem.type in stats.by_type) {
            stats.by_type[mem.type as keyof typeof stats.by_type]++;
          }
        });
      } catch (error) {
        console.error('[FirestoreMultiTierStore] Firestore stats failed:', error);
      }
    }

    // Count warm tier (file) - avoid double counting
    const fileStats = this.fileStore.getStats();
    if (!this.useFirestore) {
      stats.total += fileStats.total;
      stats.by_tier.warm = fileStats.total;
      stats.by_type.episodic += fileStats.by_type.episodic;
      stats.by_type.semantic += fileStats.by_type.semantic;
      stats.by_type.procedural += fileStats.by_type.procedural;
      stats.by_type.working += fileStats.by_type.working;
      stats.by_type.refinement_trace += fileStats.by_type.refinement_trace;
      stats.by_type.expert_consensus += fileStats.by_type.expert_consensus;
    }

    return stats;
  }

  /**
   * Archive a memory to cold storage (GitHub)
   */
  async archiveToGitHub(id: string): Promise<boolean> {
    if (!this.useGitHub || !this.githubStore) {
      console.error('[FirestoreMultiTierStore] GitHub not configured');
      return false;
    }

    const memory = await this.getMemory(id);
    if (!memory) {
      console.error('[FirestoreMultiTierStore] Memory not found:', id);
      return false;
    }

    try {
      await this.githubStore.set(`${memory.type}/${id}.json`, memory, `Archive memory: ${id}`);
      return true;
    } catch (error) {
      console.error('[FirestoreMultiTierStore] Archive failed:', error);
      return false;
    }
  }

  getBackendStatus(): { firestore: boolean; github: boolean; file: boolean } {
    return {
      firestore: this.useFirestore,
      github: this.useGitHub,
      file: true,
    };
  }
}

export { MemoryType, normalizeMemory };
