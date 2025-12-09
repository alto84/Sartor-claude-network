/**
 * Firebase-backed Memory Store for MCP Server
 *
 * Uses Firebase Realtime Database for hot tier storage.
 * Falls back to file-based storage if Firebase is unavailable.
 */

import { initializeFirebase, getDatabase } from './firebase-init';
import { FileStore } from './file-store';

export enum MemoryType {
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  PROCEDURAL = 'procedural',
  WORKING = 'working',
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
 * Firebase-backed memory store with automatic fallback to file storage
 */
export class FirebaseStore {
  private db: ReturnType<typeof getDatabase>;
  private basePath: string = 'mcp-memories';
  private fallbackStore: FileStore | null = null;
  private useFirebase: boolean = false;

  constructor() {
    // Try to initialize Firebase
    const success = initializeFirebase();
    if (success) {
      this.db = getDatabase();
      if (this.db) {
        this.useFirebase = true;
        console.error('[FirebaseStore] Using Firebase Realtime Database');
      }
    }

    // Fallback to file store if Firebase unavailable
    if (!this.useFirebase) {
      console.error('[FirebaseStore] Firebase unavailable, falling back to file storage');
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

    if (this.useFirebase && this.db) {
      await this.db.ref(`${this.basePath}/${id}`).set(memory);
    } else if (this.fallbackStore) {
      return this.fallbackStore.createMemory(content, type, options);
    }

    return memory;
  }

  async getMemory(id: string): Promise<Memory | undefined> {
    if (this.useFirebase && this.db) {
      const snapshot = await this.db.ref(`${this.basePath}/${id}`).get();
      return snapshot.exists() ? (snapshot.val() as Memory) : undefined;
    } else if (this.fallbackStore) {
      return this.fallbackStore.getMemory(id);
    }
    return undefined;
  }

  async searchMemories(
    filters: { type?: MemoryType[]; min_importance?: number },
    limit: number
  ): Promise<Memory[]> {
    if (this.useFirebase && this.db) {
      const snapshot = await this.db.ref(this.basePath).get();
      if (!snapshot.exists()) return [];

      const memories: Memory[] = [];
      snapshot.forEach((child) => {
        const mem = child.val() as Memory;
        if (filters.type && !filters.type.includes(mem.type)) return;
        if (filters.min_importance !== undefined && mem.importance_score < filters.min_importance)
          return;
        memories.push(mem);
      });

      return memories.slice(0, limit);
    } else if (this.fallbackStore) {
      return this.fallbackStore.searchMemories(filters, limit);
    }
    return [];
  }

  async getStats(): Promise<{
    total: number;
    by_type: { episodic: number; semantic: number; procedural: number; working: number };
    storage: string;
  }> {
    const stats = {
      total: 0,
      by_type: { episodic: 0, semantic: 0, procedural: 0, working: 0 },
      storage: this.useFirebase ? 'firebase' : 'file',
    };

    if (this.useFirebase && this.db) {
      const snapshot = await this.db.ref(this.basePath).get();
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const mem = child.val() as Memory;
          stats.total++;
          if (mem.type in stats.by_type) {
            stats.by_type[mem.type as keyof typeof stats.by_type]++;
          }
        });
      }
    } else if (this.fallbackStore) {
      const fallbackStats = this.fallbackStore.getStats();
      return { ...fallbackStats, storage: 'file' };
    }

    return stats;
  }

  isUsingFirebase(): boolean {
    return this.useFirebase;
  }
}

export { MemoryType as FirebaseMemoryType };
