import * as admin from 'firebase-admin';
import { Database, Reference } from 'firebase-admin/database';

interface StoredEntry {
  value: any;
  expiry: number;
}

interface HotTier {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

/**
 * Hot memory tier using Firebase RTDB
 * - <100ms target latency for get/set operations
 * - TTL support with default 1 hour
 * - Automatic cleanup of expired entries
 */
class HotTierImpl implements HotTier {
  private db: Database;
  private basePath: string;
  private readonly DEFAULT_TTL = 3600000; // 1 hour in ms

  constructor(dbInstance?: Database, basePath: string = 'hot-memory') {
    this.db = dbInstance || admin.database();
    this.basePath = basePath;
  }

  /**
   * Get value from hot tier with automatic expiry check
   */
  async get(key: string): Promise<any> {
    const path = `${this.basePath}/${this.sanitizeKey(key)}`;
    const snapshot = await this.db.ref(path).get();

    if (!snapshot.exists()) {
      return null;
    }

    const entry = snapshot.val() as StoredEntry;

    // Check if expired
    if (entry.expiry && entry.expiry < Date.now()) {
      await this.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value with TTL (default 1 hour)
   */
  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const path = `${this.basePath}/${this.sanitizeKey(key)}`;
    const entry: StoredEntry = {
      value,
      expiry: Date.now() + ttl,
    };

    await this.db.ref(path).set(entry);
  }

  /**
   * Delete entry from hot tier
   */
  async delete(key: string): Promise<void> {
    const path = `${this.basePath}/${this.sanitizeKey(key)}`;
    await this.db.ref(path).remove();
  }

  /**
   * List all non-expired keys matching prefix
   */
  async list(prefix: string): Promise<string[]> {
    const path = this.basePath;
    const snapshot = await this.db.ref(path).get();

    if (!snapshot.exists()) {
      return [];
    }

    const now = Date.now();
    const results: string[] = [];

    snapshot.forEach((child) => {
      const key = child.key;
      const entry = child.val() as StoredEntry;

      // Filter by prefix and check expiry
      if (key && key.startsWith(prefix) && (!entry.expiry || entry.expiry > now)) {
        results.push(key);
      }
    });

    return results;
  }

  /**
   * Sanitize key for Firebase path safety
   */
  private sanitizeKey(key: string): string {
    return encodeURIComponent(key)
      .replace(/\./g, '_')
      .replace(/#/g, '_')
      .replace(/\$/g, '_')
      .replace(/\[/g, '_')
      .replace(/\]/g, '_');
  }

  /**
   * Get database instance for advanced operations
   */
  getDatabase(): Database {
    return this.db;
  }

  /**
   * Clear all entries (use with caution)
   */
  async clear(): Promise<void> {
    await this.db.ref(this.basePath).remove();
  }

  /**
   * Get stats about hot tier
   */
  async getStats(): Promise<{ total: number; expired: number }> {
    const snapshot = await this.db.ref(this.basePath).get();

    if (!snapshot.exists()) {
      return { total: 0, expired: 0 };
    }

    const now = Date.now();
    let total = 0;
    let expired = 0;

    snapshot.forEach((child) => {
      total++;
      const entry = child.val() as StoredEntry;
      if (entry.expiry && entry.expiry < now) {
        expired++;
      }
    });

    return { total, expired };
  }
}

export { HotTier, HotTierImpl };
