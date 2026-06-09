/**
 * Tier Synchronization Service
 *
 * Manages automatic promotion/demotion of memories between storage tiers:
 * - Hot: Firebase Realtime Database (<100ms) - frequently accessed
 * - Warm: File-based storage (<500ms) - moderate access
 * - Cold: GitHub repository (1-5s) - archival
 *
 * Promotion Rules:
 * - Memory accessed 3+ times in 24 hours → promote to hot
 * - Memory in hot tier not accessed for 1 hour → demote to warm
 *
 * Demotion Rules:
 * - Memory not accessed for 7 days AND importance < 0.5 → demote to cold
 * - Never demote memories tagged "permanent" or "critical"
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

export interface DemotionCriteria {
  maxAge?: number; // Days since last access
  maxImportance?: number; // Importance threshold (demote if below)
  excludeTags?: string[]; // Never demote these
}

export interface SyncReport {
  promotions: {
    toHot: number;
    toWarm: number;
  };
  demotions: {
    toWarm: number;
    toCold: number;
  };
  errors: Array<{ memoryId: string; error: string }>;
  timestamp: string;
}

export interface SyncStats {
  lastSync: string | null;
  totalSyncs: number;
  totalPromotions: number;
  totalDemotions: number;
  lastReport: SyncReport | null;
}

export interface TierSyncService {
  // Promote frequently accessed memories to faster tier
  promoteToHot(memoryIds: string[]): Promise<void>;

  // Demote old/low-importance memories to slower tier
  demoteToCold(criteria: DemotionCriteria): Promise<number>;

  // Run full sync cycle
  runSyncCycle(): Promise<SyncReport>;

  // Get sync statistics
  getStats(): SyncStats;
}

/**
 * Default promotion/demotion thresholds
 */
const PROMOTION_THRESHOLDS = {
  HOT_ACCESS_COUNT: 3, // 3+ accesses
  HOT_ACCESS_WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours
  WARM_IDLE_TIME_MS: 60 * 60 * 1000, // 1 hour
};

const DEMOTION_THRESHOLDS = {
  COLD_MAX_AGE_DAYS: 7, // 7 days
  COLD_MAX_IMPORTANCE: 0.5, // importance < 0.5
  PROTECTED_TAGS: ['permanent', 'critical'], // Never demote
};

/**
 * Multi-tier synchronization service implementation
 */
export class TierSync implements TierSyncService {
  private firebaseDb: ReturnType<typeof getDatabase> | null = null;
  private fileStore: FileStore;
  private githubStore: GitHubColdTier | null = null;

  private useFirebase: boolean = false;
  private useGitHub: boolean = false;

  private basePath: string = 'mcp-memories';

  // Stats tracking
  private stats: SyncStats = {
    lastSync: null,
    totalSyncs: 0,
    totalPromotions: 0,
    totalDemotions: 0,
    lastReport: null,
  };

  constructor(config?: {
    useFirebase?: boolean;
    useGitHub?: boolean;
    github?: {
      token: string;
      owner: string;
      repo: string;
      basePath?: string;
    };
  }) {
    // Initialize file store (always available)
    this.fileStore = new FileStore();

    // Try Firebase if enabled
    if (config?.useFirebase !== false) {
      const success = initializeFirebase();
      if (success) {
        this.firebaseDb = getDatabase();
        if (this.firebaseDb) {
          this.useFirebase = true;
          console.error('[TierSync] ✓ Firebase hot tier enabled');
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
        console.error('[TierSync] ✓ GitHub cold tier enabled');
      } catch (error) {
        console.error('[TierSync] GitHub cold tier unavailable:', error);
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
        console.error('[TierSync] ✓ GitHub cold tier enabled (from env)');
      } catch (error) {
        console.error('[TierSync] GitHub cold tier unavailable:', error);
      }
    }
  }

  /**
   * Promote specific memories to hot tier
   */
  async promoteToHot(memoryIds: string[]): Promise<void> {
    if (!this.useFirebase || !this.firebaseDb) {
      console.error('[TierSync] Firebase not available, cannot promote to hot');
      return;
    }

    for (const id of memoryIds) {
      try {
        // Try to get from warm tier (file store)
        const memory = this.fileStore.getMemory(id);
        if (!memory) {
          console.error(`[TierSync] Memory ${id} not found in warm tier`);
          continue;
        }

        // Write to hot tier (Firebase)
        await this.firebaseDb.ref(`${this.basePath}/${id}`).set({
          ...memory,
          tier: 'hot',
        });

        console.error(`[TierSync] Promoted ${id} to hot tier`);
      } catch (error) {
        console.error(`[TierSync] Failed to promote ${id}:`, error);
      }
    }
  }

  /**
   * Demote memories to cold tier based on criteria
   */
  async demoteToCold(criteria: DemotionCriteria): Promise<number> {
    if (!this.useGitHub || !this.githubStore) {
      console.error('[TierSync] GitHub not available, cannot demote to cold');
      return 0;
    }

    let demotedCount = 0;
    const cutoffDate = criteria.maxAge
      ? new Date(Date.now() - criteria.maxAge * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const excludeTags = criteria.excludeTags || DEMOTION_THRESHOLDS.PROTECTED_TAGS;

    // Check warm tier (file store) for demotion candidates
    const allMemories = this.fileStore.searchMemories({}, 1000);

    for (const memory of allMemories) {
      // Skip if has protected tags
      if (memory.tags.some((tag) => excludeTags.includes(tag))) {
        continue;
      }

      // Skip if importance is too high
      if (
        criteria.maxImportance !== undefined &&
        memory.importance_score >= criteria.maxImportance
      ) {
        continue;
      }

      // Skip if not old enough
      if (cutoffDate && memory.last_accessed && memory.last_accessed >= cutoffDate) {
        continue;
      }

      try {
        // Archive to GitHub (cold tier)
        await this.githubStore.set(
          `${memory.type}/${memory.id}.json`,
          { ...memory, tier: 'cold' },
          `Demote memory to cold tier: ${memory.id}`
        );

        demotedCount++;
        console.error(`[TierSync] Demoted ${memory.id} to cold tier`);
      } catch (error) {
        console.error(`[TierSync] Failed to demote ${memory.id}:`, error);
      }
    }

    return demotedCount;
  }

  /**
   * Run full synchronization cycle
   * 1. Identify promotion candidates
   * 2. Identify demotion candidates
   * 3. Execute promotions
   * 4. Execute demotions
   * 5. Return report
   */
  async runSyncCycle(): Promise<SyncReport> {
    const report: SyncReport = {
      promotions: { toHot: 0, toWarm: 0 },
      demotions: { toWarm: 0, toCold: 0 },
      errors: [],
      timestamp: new Date().toISOString(),
    };

    console.error('[TierSync] Starting sync cycle...');

    // === PROMOTIONS ===

    // 1. Promote from warm to hot (frequently accessed)
    if (this.useFirebase && this.firebaseDb) {
      const promotionCandidates = await this.identifyPromotionCandidates();
      try {
        await this.promoteToHot(promotionCandidates);
        report.promotions.toHot = promotionCandidates.length;
      } catch (error) {
        report.errors.push({
          memoryId: 'batch',
          error: `Promotion to hot failed: ${error}`,
        });
      }
    }

    // === DEMOTIONS ===

    // 2. Demote from hot to warm (idle memories)
    if (this.useFirebase && this.firebaseDb) {
      const idleCandidates = await this.identifyIdleHotMemories();
      for (const id of idleCandidates) {
        try {
          await this.demoteHotToWarm(id);
          report.demotions.toWarm++;
        } catch (error) {
          report.errors.push({
            memoryId: id,
            error: `Demotion to warm failed: ${error}`,
          });
        }
      }
    }

    // 3. Demote from warm to cold (old/unimportant)
    if (this.useGitHub && this.githubStore) {
      const coldCount = await this.demoteToCold({
        maxAge: DEMOTION_THRESHOLDS.COLD_MAX_AGE_DAYS,
        maxImportance: DEMOTION_THRESHOLDS.COLD_MAX_IMPORTANCE,
        excludeTags: DEMOTION_THRESHOLDS.PROTECTED_TAGS,
      });
      report.demotions.toCold = coldCount;
    }

    // Update stats
    this.stats.lastSync = report.timestamp;
    this.stats.totalSyncs++;
    this.stats.totalPromotions += report.promotions.toHot + report.promotions.toWarm;
    this.stats.totalDemotions += report.demotions.toWarm + report.demotions.toCold;
    this.stats.lastReport = report;

    console.error('[TierSync] Sync cycle complete:', report);

    return report;
  }

  /**
   * Get sync statistics
   */
  getStats(): SyncStats {
    return { ...this.stats };
  }

  // === PRIVATE HELPERS ===

  /**
   * Identify memories in warm tier that should be promoted to hot
   * Rule: 3+ accesses in last 24 hours
   */
  private async identifyPromotionCandidates(): Promise<string[]> {
    const candidates: string[] = [];
    const allMemories = this.fileStore.searchMemories({}, 1000);
    const cutoffTime = Date.now() - PROMOTION_THRESHOLDS.HOT_ACCESS_WINDOW_MS;

    for (const memory of allMemories) {
      // Check if memory has been accessed frequently
      if (
        memory.access_count &&
        memory.access_count >= PROMOTION_THRESHOLDS.HOT_ACCESS_COUNT
      ) {
        // Check if accesses are recent (within window)
        if (memory.last_accessed) {
          const lastAccessTime = new Date(memory.last_accessed).getTime();
          if (lastAccessTime >= cutoffTime) {
            candidates.push(memory.id);
          }
        }
      }
    }

    return candidates;
  }

  /**
   * Identify memories in hot tier that haven't been accessed recently
   * Rule: Not accessed for 1 hour
   */
  private async identifyIdleHotMemories(): Promise<string[]> {
    if (!this.useFirebase || !this.firebaseDb) {
      return [];
    }

    const candidates: string[] = [];
    const cutoffTime = Date.now() - PROMOTION_THRESHOLDS.WARM_IDLE_TIME_MS;

    try {
      const snapshot = await this.firebaseDb.ref(this.basePath).get();
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const memory = child.val() as Memory;
          if (memory.last_accessed) {
            const lastAccessTime = new Date(memory.last_accessed).getTime();
            if (lastAccessTime < cutoffTime) {
              candidates.push(memory.id);
            }
          } else {
            // No last_accessed means never accessed, demote immediately
            candidates.push(memory.id);
          }
        });
      }
    } catch (error) {
      console.error('[TierSync] Failed to identify idle hot memories:', error);
    }

    return candidates;
  }

  /**
   * Demote a memory from hot tier to warm tier
   */
  private async demoteHotToWarm(id: string): Promise<void> {
    if (!this.useFirebase || !this.firebaseDb) {
      return;
    }

    try {
      // Get from hot tier
      const snapshot = await this.firebaseDb.ref(`${this.basePath}/${id}`).get();
      if (!snapshot.exists()) {
        console.error(`[TierSync] Memory ${id} not found in hot tier`);
        return;
      }

      const memory = snapshot.val() as Memory;

      // Write to warm tier (file store)
      await this.fileStore.createMemory(memory.content, memory.type, {
        importance_score: memory.importance_score,
        tags: memory.tags,
      });

      // Remove from hot tier
      await this.firebaseDb.ref(`${this.basePath}/${id}`).remove();

      console.error(`[TierSync] Demoted ${id} from hot to warm tier`);
    } catch (error) {
      console.error(`[TierSync] Failed to demote ${id} from hot to warm:`, error);
      throw error;
    }
  }
}

/**
 * Factory function to create a TierSync service
 */
export function createTierSyncService(config?: {
  useFirebase?: boolean;
  useGitHub?: boolean;
  github?: {
    token: string;
    owner: string;
    repo: string;
    basePath?: string;
  };
}): TierSyncService {
  return new TierSync(config);
}
