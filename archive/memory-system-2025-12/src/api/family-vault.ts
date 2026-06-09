/**
 * Family Vault API - Secure storage for family information
 *
 * Uses the multi-tier memory system:
 * - Hot tier (Firebase RTDB): Active session data, real-time updates
 * - Warm tier (Firestore): Searchable family vault with indexing
 * - Cold tier (GitHub): Archived/deleted items for long-term storage
 *
 * @module api/family-vault
 */

import { initializeFirebase, getDatabase, getApp } from '../mcp/firebase-init';
import { getFirestore, Firestore, FieldValue, Timestamp as FirestoreTimestamp } from 'firebase-admin/firestore';
import { Database } from 'firebase-admin/database';
import { GitHubColdTier } from '../memory/cold-tier';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Types of items that can be stored in the family vault
 */
export type FamilyItemType = 'document' | 'link' | 'note' | 'contact' | 'credential';

/**
 * A family vault item - documents, links, notes, contacts, or credentials
 */
export interface FamilyItem {
  id: string;
  type: FamilyItemType;
  title: string;
  content: string;
  url?: string;
  tags: string[];
  createdBy: string; // family member ID
  createdAt: Date;
  updatedAt: Date;
  importance: number; // 0-1 scale
  encrypted?: boolean;

  // Optional metadata
  metadata?: {
    category?: string;
    expiresAt?: Date;
    reminderAt?: Date;
    attachments?: string[];
    sharedWith?: string[]; // family member IDs
  };

  // Soft delete tracking
  deleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

/**
 * Search filters for vault queries
 */
export interface VaultSearchFilters {
  type?: FamilyItemType[];
  tags?: string[];
  createdBy?: string;
  minImportance?: number;
  maxImportance?: number;
  startDate?: Date;
  endDate?: Date;
  includeDeleted?: boolean;
}

/**
 * Result from a vault search
 */
export interface VaultSearchResult {
  items: FamilyItem[];
  total: number;
  hasMore: boolean;
}

/**
 * Vault statistics
 */
export interface VaultStats {
  totalItems: number;
  byType: Record<FamilyItemType, number>;
  byMember: Record<string, number>;
  recentlyAdded: number; // last 7 days
  highImportance: number; // importance >= 0.8
  storage: 'firebase' | 'firestore' | 'file';
}

/**
 * Configuration for the FamilyVault
 */
export interface FamilyVaultConfig {
  hotTierPath?: string;
  warmTierCollection?: string;
  coldTierBasePath?: string;
  importanceThresholdForCold?: number;
  github?: {
    token: string;
    owner: string;
    repo: string;
  };
}

// ============================================================================
// IMPORTANCE SCORING
// ============================================================================

/**
 * Calculate importance score for a family item
 * Based on type, tags, and recency
 */
export function calculateImportance(item: Partial<FamilyItem>): number {
  let score = 0.5; // Base score

  // Type-based scoring
  const typeScores: Record<FamilyItemType, number> = {
    credential: 0.9,  // Credentials are highly important
    document: 0.7,    // Documents are important
    contact: 0.6,     // Contacts are moderately important
    note: 0.4,        // Notes are less critical
    link: 0.3,        // Links are least critical
  };

  if (item.type) {
    score = typeScores[item.type] || 0.5;
  }

  // Tag-based adjustments
  const importantTags = ['urgent', 'important', 'critical', 'legal', 'medical', 'financial'];
  const lowPriorityTags = ['archive', 'old', 'reference', 'misc'];

  if (item.tags) {
    for (const tag of item.tags) {
      if (importantTags.includes(tag.toLowerCase())) {
        score = Math.min(1, score + 0.1);
      }
      if (lowPriorityTags.includes(tag.toLowerCase())) {
        score = Math.max(0, score - 0.05);
      }
    }
  }

  // Encrypted items are more important
  if (item.encrypted) {
    score = Math.min(1, score + 0.1);
  }

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

// ============================================================================
// FAMILY VAULT CLASS
// ============================================================================

/**
 * Family Vault - Multi-tier storage for family information
 *
 * Provides CRUD operations with automatic tier management:
 * - Hot tier for active/session data
 * - Warm tier for searchable persistent storage
 * - Cold tier for archived/deleted items
 */
export class FamilyVault {
  private db: Database | null = null;
  private firestore: Firestore | null = null;
  private coldTier: GitHubColdTier | null = null;

  private hotTierPath: string;
  private warmTierCollection: string;
  private coldTierBasePath: string;
  private importanceThresholdForCold: number;

  private useFirebase: boolean = false;
  private useFirestore: boolean = false;
  private useColdTier: boolean = false;

  constructor(config: FamilyVaultConfig = {}) {
    this.hotTierPath = config.hotTierPath || 'family-vault/hot';
    this.warmTierCollection = config.warmTierCollection || 'family-vault';
    this.coldTierBasePath = config.coldTierBasePath || 'family-vault-archive';
    this.importanceThresholdForCold = config.importanceThresholdForCold || 0.8;

    this.initializeBackends(config);
  }

  /**
   * Initialize storage backends
   */
  private initializeBackends(config: FamilyVaultConfig): void {
    // Initialize Firebase
    const success = initializeFirebase();

    if (success) {
      // Hot tier - Firebase RTDB
      this.db = getDatabase();
      if (this.db) {
        this.useFirebase = true;
        console.error('[FamilyVault] Hot tier (Firebase RTDB) enabled');
      }

      // Warm tier - Firestore
      const app = getApp();
      if (app) {
        try {
          this.firestore = getFirestore(app);
          this.useFirestore = true;
          console.error('[FamilyVault] Warm tier (Firestore) enabled');
        } catch (error) {
          console.error('[FamilyVault] Firestore initialization failed:', error);
        }
      }
    }

    // Cold tier - GitHub
    if (config.github) {
      try {
        this.coldTier = new GitHubColdTier(
          config.github.token,
          config.github.owner,
          config.github.repo,
          this.coldTierBasePath
        );
        this.useColdTier = true;
        console.error('[FamilyVault] Cold tier (GitHub) enabled');
      } catch (error) {
        console.error('[FamilyVault] GitHub cold tier failed:', error);
      }
    } else if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
      try {
        this.coldTier = new GitHubColdTier(
          process.env.GITHUB_TOKEN,
          process.env.GITHUB_OWNER,
          process.env.GITHUB_REPO,
          this.coldTierBasePath
        );
        this.useColdTier = true;
        console.error('[FamilyVault] Cold tier (GitHub) enabled from env');
      } catch (error) {
        console.error('[FamilyVault] GitHub cold tier failed:', error);
      }
    }

    if (!this.useFirebase && !this.useFirestore) {
      console.error('[FamilyVault] WARNING: No cloud backends available. Storage will fail.');
    }
  }

  /**
   * Generate a unique ID for a family item
   */
  private generateId(): string {
    return `fv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Serialize a FamilyItem for storage
   */
  private serializeItem(item: FamilyItem): Record<string, any> {
    return {
      ...item,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
      deletedAt: item.deletedAt instanceof Date ? item.deletedAt.toISOString() : item.deletedAt,
      metadata: item.metadata ? {
        ...item.metadata,
        expiresAt: item.metadata.expiresAt instanceof Date ? item.metadata.expiresAt.toISOString() : item.metadata.expiresAt,
        reminderAt: item.metadata.reminderAt instanceof Date ? item.metadata.reminderAt.toISOString() : item.metadata.reminderAt,
      } : undefined,
    };
  }

  /**
   * Deserialize a stored item to FamilyItem
   */
  private deserializeItem(data: Record<string, any>): FamilyItem {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : undefined,
      metadata: data.metadata ? {
        ...data.metadata,
        expiresAt: data.metadata.expiresAt ? new Date(data.metadata.expiresAt) : undefined,
        reminderAt: data.metadata.reminderAt ? new Date(data.metadata.reminderAt) : undefined,
      } : undefined,
    } as FamilyItem;
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new family item
   *
   * @param item - Partial item data (id and timestamps will be auto-generated)
   * @returns The created item with generated ID and timestamps
   */
  async createFamilyItem(item: Omit<FamilyItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<FamilyItem> {
    const now = new Date();
    const id = this.generateId();

    // Calculate importance if not provided
    const importance = item.importance ?? calculateImportance(item);

    const newItem: FamilyItem = {
      ...item,
      id,
      importance,
      createdAt: now,
      updatedAt: now,
    };

    const serialized = this.serializeItem(newItem);

    // Store in hot tier (Firebase RTDB) for quick access
    if (this.useFirebase && this.db) {
      try {
        await this.db.ref(`${this.hotTierPath}/${id}`).set(serialized);
      } catch (error) {
        console.error('[FamilyVault] Hot tier write failed:', error);
      }
    }

    // Store in warm tier (Firestore) for searchability
    if (this.useFirestore && this.firestore) {
      try {
        await this.firestore.collection(this.warmTierCollection).doc(id).set(serialized);
      } catch (error) {
        console.error('[FamilyVault] Warm tier write failed:', error);
        throw error; // Warm tier is primary, so throw if it fails
      }
    }

    // Archive high-importance items to cold tier
    if (this.useColdTier && this.coldTier && importance >= this.importanceThresholdForCold) {
      try {
        await this.coldTier.set(
          `${item.type}/${id}.json`,
          serialized,
          `Archive high-importance family item: ${item.title}`
        );
        console.error(`[FamilyVault] Archived to cold tier: ${id}`);
      } catch (error) {
        console.error('[FamilyVault] Cold tier archive failed:', error);
      }
    }

    return newItem;
  }

  /**
   * Get a family item by ID
   *
   * @param id - The item ID
   * @returns The item or null if not found
   */
  async getFamilyItem(id: string): Promise<FamilyItem | null> {
    // Try hot tier first (fastest)
    if (this.useFirebase && this.db) {
      try {
        const snapshot = await this.db.ref(`${this.hotTierPath}/${id}`).get();
        if (snapshot.exists()) {
          return this.deserializeItem(snapshot.val());
        }
      } catch (error) {
        console.error('[FamilyVault] Hot tier read failed:', error);
      }
    }

    // Try warm tier
    if (this.useFirestore && this.firestore) {
      try {
        const doc = await this.firestore.collection(this.warmTierCollection).doc(id).get();
        if (doc.exists) {
          return this.deserializeItem(doc.data() as Record<string, any>);
        }
      } catch (error) {
        console.error('[FamilyVault] Warm tier read failed:', error);
      }
    }

    // Try cold tier last
    if (this.useColdTier && this.coldTier) {
      try {
        // Search across type directories
        for (const type of ['document', 'link', 'note', 'contact', 'credential'] as FamilyItemType[]) {
          const result = await this.coldTier.get(`${type}/${id}.json`);
          if (result) {
            return this.deserializeItem(result);
          }
        }
      } catch (error) {
        console.error('[FamilyVault] Cold tier read failed:', error);
      }
    }

    return null;
  }

  /**
   * Update a family item
   *
   * @param id - The item ID
   * @param updates - Fields to update
   * @returns The updated item or null if not found
   */
  async updateFamilyItem(id: string, updates: Partial<Omit<FamilyItem, 'id' | 'createdAt'>>): Promise<FamilyItem | null> {
    const existing = await this.getFamilyItem(id);
    if (!existing) {
      return null;
    }

    // Recalculate importance if relevant fields changed
    let importance = existing.importance;
    if (updates.type || updates.tags || updates.encrypted !== undefined) {
      importance = calculateImportance({ ...existing, ...updates });
    }
    if (updates.importance !== undefined) {
      importance = updates.importance;
    }

    const updatedItem: FamilyItem = {
      ...existing,
      ...updates,
      importance,
      updatedAt: new Date(),
    };

    const serialized = this.serializeItem(updatedItem);

    // Update hot tier
    if (this.useFirebase && this.db) {
      try {
        await this.db.ref(`${this.hotTierPath}/${id}`).set(serialized);
      } catch (error) {
        console.error('[FamilyVault] Hot tier update failed:', error);
      }
    }

    // Update warm tier
    if (this.useFirestore && this.firestore) {
      try {
        await this.firestore.collection(this.warmTierCollection).doc(id).set(serialized);
      } catch (error) {
        console.error('[FamilyVault] Warm tier update failed:', error);
        throw error;
      }
    }

    return updatedItem;
  }

  /**
   * Delete a family item (soft delete - moves to cold tier)
   *
   * @param id - The item ID
   * @param deletedBy - ID of the family member performing the deletion
   * @returns True if deleted, false if not found
   */
  async deleteFamilyItem(id: string, deletedBy: string): Promise<boolean> {
    const existing = await this.getFamilyItem(id);
    if (!existing) {
      return false;
    }

    // Mark as deleted
    const deletedItem: FamilyItem = {
      ...existing,
      deleted: true,
      deletedAt: new Date(),
      deletedBy,
      updatedAt: new Date(),
    };

    const serialized = this.serializeItem(deletedItem);

    // Archive to cold tier before removing from hot/warm
    if (this.useColdTier && this.coldTier) {
      try {
        await this.coldTier.set(
          `deleted/${existing.type}/${id}.json`,
          serialized,
          `Soft delete family item: ${existing.title}`
        );
        console.error(`[FamilyVault] Archived deleted item to cold tier: ${id}`);
      } catch (error) {
        console.error('[FamilyVault] Cold tier archive failed:', error);
      }
    }

    // Remove from hot tier
    if (this.useFirebase && this.db) {
      try {
        await this.db.ref(`${this.hotTierPath}/${id}`).remove();
      } catch (error) {
        console.error('[FamilyVault] Hot tier delete failed:', error);
      }
    }

    // Update in warm tier (keep for recovery, but mark deleted)
    if (this.useFirestore && this.firestore) {
      try {
        await this.firestore.collection(this.warmTierCollection).doc(id).set(serialized);
      } catch (error) {
        console.error('[FamilyVault] Warm tier update failed:', error);
      }
    }

    return true;
  }

  /**
   * Permanently delete an item (hard delete)
   *
   * @param id - The item ID
   * @returns True if deleted, false if not found
   */
  async permanentlyDeleteFamilyItem(id: string): Promise<boolean> {
    let found = false;

    // Remove from hot tier
    if (this.useFirebase && this.db) {
      try {
        const snapshot = await this.db.ref(`${this.hotTierPath}/${id}`).get();
        if (snapshot.exists()) {
          await this.db.ref(`${this.hotTierPath}/${id}`).remove();
          found = true;
        }
      } catch (error) {
        console.error('[FamilyVault] Hot tier delete failed:', error);
      }
    }

    // Remove from warm tier
    if (this.useFirestore && this.firestore) {
      try {
        const doc = await this.firestore.collection(this.warmTierCollection).doc(id).get();
        if (doc.exists) {
          await this.firestore.collection(this.warmTierCollection).doc(id).delete();
          found = true;
        }
      } catch (error) {
        console.error('[FamilyVault] Warm tier delete failed:', error);
      }
    }

    return found;
  }

  // ============================================================================
  // SEARCH OPERATIONS
  // ============================================================================

  /**
   * Search the family vault
   *
   * @param query - Text query to search for (searches title and content)
   * @param filters - Additional filters
   * @param limit - Maximum number of results (default 50)
   * @param offset - Number of results to skip (default 0)
   * @returns Search results with total count
   */
  async searchVault(
    query: string = '',
    filters: VaultSearchFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<VaultSearchResult> {
    const results: FamilyItem[] = [];

    // Search warm tier (Firestore) - primary search
    if (this.useFirestore && this.firestore) {
      try {
        let firestoreQuery = this.firestore.collection(this.warmTierCollection)
          .limit(limit + offset);

        // Apply type filter
        if (filters.type && filters.type.length > 0) {
          firestoreQuery = firestoreQuery.where('type', 'in', filters.type);
        }

        // Apply createdBy filter
        if (filters.createdBy) {
          firestoreQuery = firestoreQuery.where('createdBy', '==', filters.createdBy);
        }

        // Apply importance filter
        if (filters.minImportance !== undefined) {
          firestoreQuery = firestoreQuery.where('importance', '>=', filters.minImportance);
        }

        // Apply deleted filter
        if (!filters.includeDeleted) {
          firestoreQuery = firestoreQuery.where('deleted', '!=', true);
        }

        const snapshot = await firestoreQuery.get();

        snapshot.forEach((doc) => {
          const item = this.deserializeItem(doc.data() as Record<string, any>);

          // Apply text query filter (client-side)
          if (query) {
            const lowerQuery = query.toLowerCase();
            const matchesTitle = item.title.toLowerCase().includes(lowerQuery);
            const matchesContent = item.content.toLowerCase().includes(lowerQuery);
            const matchesTags = item.tags.some(tag => tag.toLowerCase().includes(lowerQuery));

            if (!matchesTitle && !matchesContent && !matchesTags) {
              return; // Skip this item
            }
          }

          // Apply additional filters (client-side)
          if (filters.tags && filters.tags.length > 0) {
            const hasTag = filters.tags.some(tag => item.tags.includes(tag));
            if (!hasTag) return;
          }

          if (filters.maxImportance !== undefined && item.importance > filters.maxImportance) {
            return;
          }

          if (filters.startDate && item.createdAt < filters.startDate) {
            return;
          }

          if (filters.endDate && item.createdAt > filters.endDate) {
            return;
          }

          results.push(item);
        });
      } catch (error) {
        console.error('[FamilyVault] Search failed:', error);
        throw error;
      }
    } else if (this.useFirebase && this.db) {
      // Fallback to hot tier if Firestore unavailable
      try {
        const snapshot = await this.db.ref(this.hotTierPath).get();
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const item = this.deserializeItem(child.val());

            // Apply all filters client-side
            if (!filters.includeDeleted && item.deleted) return;
            if (filters.type && filters.type.length > 0 && !filters.type.includes(item.type)) return;
            if (filters.createdBy && item.createdBy !== filters.createdBy) return;
            if (filters.minImportance !== undefined && item.importance < filters.minImportance) return;
            if (filters.maxImportance !== undefined && item.importance > filters.maxImportance) return;
            if (filters.tags && filters.tags.length > 0 && !filters.tags.some(tag => item.tags.includes(tag))) return;
            if (filters.startDate && item.createdAt < filters.startDate) return;
            if (filters.endDate && item.createdAt > filters.endDate) return;

            if (query) {
              const lowerQuery = query.toLowerCase();
              const matchesTitle = item.title.toLowerCase().includes(lowerQuery);
              const matchesContent = item.content.toLowerCase().includes(lowerQuery);
              const matchesTags = item.tags.some(tag => tag.toLowerCase().includes(lowerQuery));

              if (!matchesTitle && !matchesContent && !matchesTags) return;
            }

            results.push(item);
          });
        }
      } catch (error) {
        console.error('[FamilyVault] Hot tier search failed:', error);
        throw error;
      }
    }

    // Sort by importance (descending) then by date (newest first)
    results.sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      items: paginatedResults,
      total: results.length,
      hasMore: results.length > offset + limit,
    };
  }

  /**
   * Get items by tags
   *
   * @param tags - Tags to search for (OR logic)
   * @param limit - Maximum results
   * @returns Matching items
   */
  async getByTags(tags: string[], limit: number = 50): Promise<FamilyItem[]> {
    const result = await this.searchVault('', { tags }, limit);
    return result.items;
  }

  /**
   * Get items by type
   *
   * @param type - Item type
   * @param limit - Maximum results
   * @returns Matching items
   */
  async getByType(type: FamilyItemType, limit: number = 50): Promise<FamilyItem[]> {
    const result = await this.searchVault('', { type: [type] }, limit);
    return result.items;
  }

  /**
   * Get high-importance items
   *
   * @param minImportance - Minimum importance threshold (default 0.8)
   * @param limit - Maximum results
   * @returns High-importance items
   */
  async getHighImportance(minImportance: number = 0.8, limit: number = 50): Promise<FamilyItem[]> {
    const result = await this.searchVault('', { minImportance }, limit);
    return result.items;
  }

  /**
   * Get recently added items
   *
   * @param days - Number of days to look back (default 7)
   * @param limit - Maximum results
   * @returns Recent items
   */
  async getRecentItems(days: number = 7, limit: number = 50): Promise<FamilyItem[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.searchVault('', { startDate }, limit);
    return result.items;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get vault statistics
   *
   * @returns Vault statistics
   */
  async getStats(): Promise<VaultStats> {
    const stats: VaultStats = {
      totalItems: 0,
      byType: {
        document: 0,
        link: 0,
        note: 0,
        contact: 0,
        credential: 0,
      },
      byMember: {},
      recentlyAdded: 0,
      highImportance: 0,
      storage: this.useFirestore ? 'firestore' : (this.useFirebase ? 'firebase' : 'file'),
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get stats from warm tier (Firestore)
    if (this.useFirestore && this.firestore) {
      try {
        const snapshot = await this.firestore.collection(this.warmTierCollection)
          .where('deleted', '!=', true)
          .get();

        snapshot.forEach((doc) => {
          const data = doc.data();
          stats.totalItems++;

          // By type
          if (data.type && data.type in stats.byType) {
            stats.byType[data.type as FamilyItemType]++;
          }

          // By member
          if (data.createdBy) {
            stats.byMember[data.createdBy] = (stats.byMember[data.createdBy] || 0) + 1;
          }

          // Recently added
          const createdAt = new Date(data.createdAt);
          if (createdAt >= sevenDaysAgo) {
            stats.recentlyAdded++;
          }

          // High importance
          if (data.importance >= 0.8) {
            stats.highImportance++;
          }
        });
      } catch (error) {
        console.error('[FamilyVault] Stats query failed:', error);
      }
    } else if (this.useFirebase && this.db) {
      // Fallback to hot tier
      try {
        const snapshot = await this.db.ref(this.hotTierPath).get();
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const data = child.val();
            if (data.deleted) return;

            stats.totalItems++;

            if (data.type && data.type in stats.byType) {
              stats.byType[data.type as FamilyItemType]++;
            }

            if (data.createdBy) {
              stats.byMember[data.createdBy] = (stats.byMember[data.createdBy] || 0) + 1;
            }

            const createdAt = new Date(data.createdAt);
            if (createdAt >= sevenDaysAgo) {
              stats.recentlyAdded++;
            }

            if (data.importance >= 0.8) {
              stats.highImportance++;
            }
          });
        }
      } catch (error) {
        console.error('[FamilyVault] Stats query failed:', error);
      }
    }

    return stats;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get backend status
   *
   * @returns Status of each storage tier
   */
  getBackendStatus(): { hot: boolean; warm: boolean; cold: boolean } {
    return {
      hot: this.useFirebase,
      warm: this.useFirestore,
      cold: this.useColdTier,
    };
  }

  /**
   * Restore a deleted item
   *
   * @param id - The item ID
   * @returns The restored item or null if not found
   */
  async restoreDeletedItem(id: string): Promise<FamilyItem | null> {
    const item = await this.getFamilyItem(id);
    if (!item || !item.deleted) {
      return null;
    }

    return this.updateFamilyItem(id, {
      deleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
    });
  }

  /**
   * Bulk create items
   *
   * @param items - Array of items to create
   * @returns Created items
   */
  async bulkCreate(items: Array<Omit<FamilyItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<FamilyItem[]> {
    const results: FamilyItem[] = [];

    for (const item of items) {
      const created = await this.createFamilyItem(item);
      results.push(created);
    }

    return results;
  }

  /**
   * Export all items (for backup)
   *
   * @param includeDeleted - Whether to include soft-deleted items
   * @returns All items in the vault
   */
  async exportAll(includeDeleted: boolean = false): Promise<FamilyItem[]> {
    const result = await this.searchVault('', { includeDeleted }, 10000);
    return result.items;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a FamilyVault instance
 *
 * @param config - Optional configuration
 * @returns FamilyVault instance
 */
export function createFamilyVault(config?: FamilyVaultConfig): FamilyVault {
  return new FamilyVault(config);
}
