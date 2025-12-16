/**
 * Firestore-backed Memory Store for MCP Server
 *
 * Uses Google Cloud Firestore for hot tier storage.
 * Firestore is often auto-enabled on new Firebase projects and doesn't require
 * manual database creation like Realtime Database does.
 *
 * This store uses the same interface as firebase-store.ts and can serve as
 * a drop-in replacement when Realtime Database is unavailable.
 */

import { initializeFirebase, getApp } from './firebase-init';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { FileStore } from './file-store';

export enum MemoryType {
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  PROCEDURAL = 'procedural',
  WORKING = 'working',
  REFINEMENT_TRACE = 'refinement_trace',
  EXPERT_CONSENSUS = 'expert_consensus',
}

interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  importance_score: number;
  tags: string[];
  created_at: string;
}

/**
 * Firestore-backed memory store with automatic fallback to file storage
 */
export class FirestoreStore {
  private db: Firestore | null = null;
  private collectionName: string = 'mcp-memories';
  private fallbackStore: FileStore | null = null;
  private useFirestore: boolean = false;

  constructor() {
    // Try to initialize Firebase
    const success = initializeFirebase();
    if (success) {
      const app = getApp();
      if (app) {
        try {
          this.db = getFirestore(app);
          this.useFirestore = true;
          console.error('[FirestoreStore] Using Firestore database');
        } catch (error) {
          console.error(`[FirestoreStore] Error initializing Firestore: ${error}`);
        }
      }
    }

    // Fallback to file store if Firestore unavailable
    if (!this.useFirestore) {
      console.error('[FirestoreStore] Firestore unavailable, falling back to file storage');
      this.fallbackStore = new FileStore();
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
    };

    if (this.useFirestore && this.db) {
      try {
        await this.db.collection(this.collectionName).doc(id).set(memory);
      } catch (error) {
        console.error(`[FirestoreStore] Error creating memory: ${error}`);
        throw error;
      }
    } else if (this.fallbackStore) {
      return this.fallbackStore.createMemory(content, type, options);
    }

    return memory;
  }

  async getMemory(id: string): Promise<Memory | undefined> {
    if (this.useFirestore && this.db) {
      try {
        const doc = await this.db.collection(this.collectionName).doc(id).get();
        return doc.exists ? (doc.data() as Memory) : undefined;
      } catch (error) {
        console.error(`[FirestoreStore] Error getting memory: ${error}`);
        throw error;
      }
    } else if (this.fallbackStore) {
      return this.fallbackStore.getMemory(id);
    }
    return undefined;
  }

  async searchMemories(
    filters: { type?: MemoryType[]; min_importance?: number },
    limit: number
  ): Promise<Memory[]> {
    if (this.useFirestore && this.db) {
      try {
        let query = this.db.collection(this.collectionName).limit(limit);

        // Apply type filter if specified
        if (filters.type && filters.type.length > 0) {
          query = query.where('type', 'in', filters.type) as any;
        }

        // Apply importance filter if specified
        if (filters.min_importance !== undefined) {
          query = query.where('importance_score', '>=', filters.min_importance) as any;
        }

        const snapshot = await query.get();
        const memories: Memory[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          // Double-check filters in case Firestore doesn't support them all
          if (filters.type && !filters.type.includes(data.type as MemoryType)) return;
          if (filters.min_importance !== undefined && data.importance_score < filters.min_importance)
            return;
          memories.push(data as Memory);
        });

        return memories;
      } catch (error) {
        console.error(`[FirestoreStore] Error searching memories: ${error}`);
        throw error;
      }
    } else if (this.fallbackStore) {
      return this.fallbackStore.searchMemories(filters, limit);
    }
    return [];
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
    storage: string;
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
      storage: this.useFirestore ? 'firestore' : 'file',
    };

    if (this.useFirestore && this.db) {
      try {
        const snapshot = await this.db.collection(this.collectionName).get();

        snapshot.forEach((doc) => {
          const mem = doc.data() as Memory;
          stats.total++;
          if (mem.type in stats.by_type) {
            stats.by_type[mem.type as keyof typeof stats.by_type]++;
          }
        });
      } catch (error) {
        console.error(`[FirestoreStore] Error getting stats: ${error}`);
        throw error;
      }
    } else if (this.fallbackStore) {
      const fallbackStats = this.fallbackStore.getStats();
      return { ...fallbackStats, storage: 'file' };
    }

    return stats;
  }

  isUsingFirestore(): boolean {
    return this.useFirestore;
  }
}

export { MemoryType as FirestoreMemoryType };
