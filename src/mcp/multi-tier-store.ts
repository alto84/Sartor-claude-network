/**
 * Multi-Tier Memory Store for MCP Server
 *
 * Combines multiple storage backends:
 * - Hot: Firebase Realtime Database (<100ms)
 * - Warm: File-based storage (<500ms)
 * - Cold: GitHub repository (1-5s)
 *
 * Memories are stored in hot tier first, then promoted/demoted based on access patterns.
 * GitHub is used for long-term archival of important patterns.
 */

import { initializeFirebase, getDatabase } from './firebase-init';
import { FileStore, MemoryType } from './file-store';
import { GitHubColdTier } from '../memory/cold-tier';

interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  importance_score: number;
  tags: string[];
  created_at: string;
  access_count?: number;
  last_accessed?: string;
  tier?: 'hot' | 'warm' | 'cold';
}

interface StoreConfig {
  useFirebase?: boolean;
  useGitHub?: boolean;
  useFile?: boolean;
  github?: {
    token: string;
    owner: string;
    repo: string;
    basePath?: string;
  };
}

/**
 * Multi-tier memory store with automatic fallback
 */
export class MultiTierStore {
  private firebaseDb: ReturnType<typeof getDatabase> | null = null;
  private fileStore: FileStore;
  private githubStore: GitHubColdTier | null = null;

  private useFirebase: boolean = false;
  private useGitHub: boolean = false;

  private basePath: string = 'mcp-memories';

  constructor(config?: StoreConfig) {
    // Always initialize file store as fallback
    this.fileStore = new FileStore();

    // Try Firebase if enabled or by default
    if (config?.useFirebase !== false) {
      const success = initializeFirebase();
      if (success) {
        this.firebaseDb = getDatabase();
        if (this.firebaseDb) {
          this.useFirebase = true;
          console.error('[MultiTierStore] ✓ Firebase hot tier enabled');
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
        console.error('[MultiTierStore] ✓ GitHub cold tier enabled');
      } catch (error) {
        console.error('[MultiTierStore] GitHub cold tier unavailable:', error);
      }
    }

    // Check environment for GitHub config
    if (!this.useGitHub && process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
      try {
        this.githubStore = new GitHubColdTier(
          process.env.GITHUB_TOKEN,
          process.env.GITHUB_OWNER,
          process.env.GITHUB_REPO,
          process.env.GITHUB_BASE_PATH || 'memories'
        );
        this.useGitHub = true;
        console.error('[MultiTierStore] ✓ GitHub cold tier enabled (from env)');
      } catch (error) {
        console.error('[MultiTierStore] GitHub cold tier unavailable:', error);
      }
    }

    if (!this.useFirebase && !this.useGitHub) {
      console.error('[MultiTierStore] Using file storage only (no cloud backends configured)');
    }
  }

  async createMemory(
    content: string,
    type: MemoryType,
    options: { importance_score?: number; tags?: string[] }
  ): Promise<Memory> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const memory: Memory = {
      id,
      content,
      type,
      importance_score: options.importance_score ?? 0.5,
      tags: options.tags ?? [],
      created_at: new Date().toISOString(),
      access_count: 0,
      tier: this.useFirebase ? 'hot' : 'warm',
    };

    // Store in hot tier (Firebase) if available
    if (this.useFirebase && this.firebaseDb) {
      try {
        await this.firebaseDb.ref(`${this.basePath}/${id}`).set(memory);
      } catch (error) {
        console.error('[MultiTierStore] Firebase write failed, falling back to file:', error);
        this.fileStore.createMemory(content, type, options);
      }
    } else {
      // Fall back to file storage
      return this.fileStore.createMemory(content, type, options);
    }

    // Also archive to GitHub if importance is high and GitHub is enabled
    if (this.useGitHub && this.githubStore && memory.importance_score >= 0.8) {
      try {
        await this.githubStore.set(
          `${type}/${id}.json`,
          memory,
          `Archive high-importance memory: ${id}`
        );
        console.error(`[MultiTierStore] Archived to GitHub: ${id}`);
      } catch (error) {
        console.error('[MultiTierStore] GitHub archive failed:', error);
      }
    }

    return memory;
  }

  async getMemory(id: string): Promise<Memory | undefined> {
    // Try hot tier first
    if (this.useFirebase && this.firebaseDb) {
      try {
        const snapshot = await this.firebaseDb.ref(`${this.basePath}/${id}`).get();
        if (snapshot.exists()) {
          const memory = snapshot.val() as Memory;
          // Update access count
          await this.firebaseDb.ref(`${this.basePath}/${id}/access_count`).set((memory.access_count || 0) + 1);
          await this.firebaseDb.ref(`${this.basePath}/${id}/last_accessed`).set(new Date().toISOString());
          return memory;
        }
      } catch (error) {
        console.error('[MultiTierStore] Firebase read failed:', error);
      }
    }

    // Try warm tier (file)
    const fileResult = this.fileStore.getMemory(id);
    if (fileResult) return fileResult;

    // Try cold tier (GitHub)
    if (this.useGitHub && this.githubStore) {
      try {
        // Search across type directories
        for (const type of ['episodic', 'semantic', 'procedural', 'working']) {
          const result = await this.githubStore.get(`${type}/${id}.json`);
          if (result) return result as Memory;
        }
      } catch (error) {
        console.error('[MultiTierStore] GitHub read failed:', error);
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
    if (this.useFirebase && this.firebaseDb) {
      try {
        const snapshot = await this.firebaseDb.ref(this.basePath).get();
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const mem = child.val() as Memory;
            if (filters.type && !filters.type.includes(mem.type)) return;
            if (filters.min_importance !== undefined && mem.importance_score < filters.min_importance) return;
            results.push({ ...mem, tier: 'hot' });
          });
        }
      } catch (error) {
        console.error('[MultiTierStore] Firebase search failed:', error);
      }
    }

    // Search warm tier
    const fileResults = this.fileStore.searchMemories(filters, limit);
    for (const mem of fileResults) {
      if (!results.find(r => r.id === mem.id)) {
        results.push({ ...mem, tier: 'warm' });
      }
    }

    // Sort by importance and return limited results
    return results
      .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0))
      .slice(0, limit);
  }

  async getStats(): Promise<{
    total: number;
    by_type: { episodic: number; semantic: number; procedural: number; working: number };
    by_tier: { hot: number; warm: number; cold: number };
    backends: { firebase: boolean; github: boolean; file: boolean };
  }> {
    const stats = {
      total: 0,
      by_type: { episodic: 0, semantic: 0, procedural: 0, working: 0 },
      by_tier: { hot: 0, warm: 0, cold: 0 },
      backends: {
        firebase: this.useFirebase,
        github: this.useGitHub,
        file: true,
      },
    };

    // Count hot tier
    if (this.useFirebase && this.firebaseDb) {
      try {
        const snapshot = await this.firebaseDb.ref(this.basePath).get();
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const mem = child.val() as Memory;
            stats.total++;
            stats.by_tier.hot++;
            if (mem.type in stats.by_type) {
              stats.by_type[mem.type as keyof typeof stats.by_type]++;
            }
          });
        }
      } catch (error) {
        console.error('[MultiTierStore] Firebase stats failed:', error);
      }
    }

    // Count warm tier (file) - avoid double counting
    const fileStats = this.fileStore.getStats();
    if (!this.useFirebase) {
      stats.total += fileStats.total;
      stats.by_tier.warm = fileStats.total;
      stats.by_type.episodic += fileStats.by_type.episodic;
      stats.by_type.semantic += fileStats.by_type.semantic;
      stats.by_type.procedural += fileStats.by_type.procedural;
      stats.by_type.working += fileStats.by_type.working;
    }

    return stats;
  }

  /**
   * Archive a memory to cold storage (GitHub)
   */
  async archiveToGitHub(id: string): Promise<boolean> {
    if (!this.useGitHub || !this.githubStore) {
      console.error('[MultiTierStore] GitHub not configured');
      return false;
    }

    const memory = await this.getMemory(id);
    if (!memory) {
      console.error('[MultiTierStore] Memory not found:', id);
      return false;
    }

    try {
      await this.githubStore.set(
        `${memory.type}/${id}.json`,
        memory,
        `Archive memory: ${id}`
      );
      return true;
    } catch (error) {
      console.error('[MultiTierStore] Archive failed:', error);
      return false;
    }
  }

  getBackendStatus(): { firebase: boolean; github: boolean; file: boolean } {
    return {
      firebase: this.useFirebase,
      github: this.useGitHub,
      file: true,
    };
  }
}

export { MemoryType };
