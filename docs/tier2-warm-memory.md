# Tier 2: Warm Memory - Detailed Specification

## Firestore + Vector Database

**Purpose**: Semantic search, medium-term storage, and intelligent memory retrieval using embeddings.

### Data Structure & Schema

#### Firestore Collections

```javascript
// Collection: memories
{
  "id": "mem_warm_001",
  "content": "Full text content of the memory...",
  "summary": "Brief summary for quick scanning",
  "type": "conversation" | "document" | "event" | "note",
  "userId": "user_123",
  "createdAt": Timestamp,
  "updatedAt": Timestamp,
  "lastAccessed": Timestamp,
  "accessCount": 156,
  "metadata": {
    "source": "cold_tier" | "hot_tier" | "user_input",
    "sourceId": "github_commit_sha" | "hot_memory_id",
    "version": 3,
    "language": "en",
    "wordCount": 1247,
    "characterCount": 8532
  },
  "tags": ["project_alpha", "deployment", "production"],
  "entities": {
    "people": ["@alice", "@bob"],
    "projects": ["project_alpha"],
    "dates": ["2025-12-05"],
    "locations": ["us-east-1"]
  },
  "embedding": {
    "id": "emb_001",
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "generated_at": Timestamp
  },
  "relationships": {
    "relatedTo": ["mem_warm_002", "mem_warm_015"],
    "supersedes": ["mem_warm_000"],
    "supersededBy": null
  },
  "promotion": {
    "eligibleForHot": true,
    "hotScore": 8.5,
    "lastPromotedAt": Timestamp | null,
    "promotionCount": 2
  },
  "archival": {
    "eligibleForCold": false,
    "coldScore": 2.1,
    "archivedInGitHub": false,
    "githubPath": null
  }
}

// Collection: embeddings (separate for cost optimization)
{
  "id": "emb_001",
  "memoryId": "mem_warm_001",
  "vector": [0.123, -0.456, 0.789, ...],  // 1536 dimensions
  "model": "text-embedding-3-small",
  "version": "v1",
  "generatedAt": Timestamp,
  "metadata": {
    "chunkIndex": 0,
    "totalChunks": 1,
    "textHash": "sha256_hash"
  }
}
```

### Integration with Embedding Generation

```javascript
// File: services/embedding-service.js

const OpenAI = require('openai');
const { Firestore } = require('@google-cloud/firestore');
const { PineconeClient } = require('@pinecone-database/pinecone');

class EmbeddingService {
  constructor(config) {
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    this.firestore = new Firestore();
    this.pinecone = new PineconeClient();
    this.model = config.embeddingModel || 'text-embedding-3-small';
    this.batchSize = config.batchSize || 100;
  }

  // Generate embedding for single memory
  async generateEmbedding(text, metadata = {}) {
    try {
      // Truncate if too long (8191 tokens max for text-embedding-3-small)
      const truncated = this.truncateText(text, 8000);

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: truncated,
        encoding_format: 'float'
      });

      return {
        vector: response.data[0].embedding,
        model: this.model,
        dimensions: response.data[0].embedding.length,
        metadata: {
          ...metadata,
          originalLength: text.length,
          truncated: text.length !== truncated.length,
          tokensUsed: response.usage.total_tokens
        }
      };
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw error;
    }
  }

  // Batch generate embeddings
  async generateBatchEmbeddings(memories) {
    const results = [];

    // Process in batches to avoid rate limits
    for (let i = 0; i < memories.length; i += this.batchSize) {
      const batch = memories.slice(i, i + this.batchSize);
      const texts = batch.map(m => this.truncateText(m.content, 8000));

      try {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: texts,
          encoding_format: 'float'
        });

        response.data.forEach((embedding, idx) => {
          results.push({
            memoryId: batch[idx].id,
            vector: embedding.embedding,
            model: this.model,
            dimensions: embedding.embedding.length
          });
        });

        // Rate limiting: wait between batches
        if (i + this.batchSize < memories.length) {
          await this.sleep(1000);
        }
      } catch (error) {
        console.error(`Batch ${i}-${i + this.batchSize} failed:`, error);
        // Continue with next batch
      }
    }

    return results;
  }

  // Store embedding in both Firestore and Vector DB
  async storeEmbedding(memoryId, embedding) {
    const batch = this.firestore.batch();

    // Store in Firestore
    const embeddingRef = this.firestore
      .collection('embeddings')
      .doc(memoryId);

    batch.set(embeddingRef, {
      id: memoryId,
      memoryId: memoryId,
      vector: embedding.vector,
      model: embedding.model,
      generatedAt: Firestore.Timestamp.now(),
      metadata: embedding.metadata
    });

    // Update memory document
    const memoryRef = this.firestore
      .collection('memories')
      .doc(memoryId);

    batch.update(memoryRef, {
      'embedding.id': memoryId,
      'embedding.model': embedding.model,
      'embedding.dimensions': embedding.dimensions,
      'embedding.generated_at': Firestore.Timestamp.now()
    });

    await batch.commit();

    // Store in Pinecone
    const index = this.pinecone.Index('sartor-memories');
    await index.upsert([{
      id: memoryId,
      values: embedding.vector,
      metadata: {
        memoryId: memoryId,
        model: embedding.model,
        ...embedding.metadata
      }
    }]);

    return { success: true, memoryId };
  }

  truncateText(text, maxTokens) {
    // Rough approximation: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;
    return text.length > maxChars ? text.substring(0, maxChars) : text;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = EmbeddingService;
```

### Semantic Search Implementation

```javascript
// File: services/semantic-search.js

class SemanticSearchService {
  constructor(embeddingService, pinecone, firestore) {
    this.embeddings = embeddingService;
    this.pinecone = pinecone;
    this.firestore = firestore;
  }

  // Semantic search using vector similarity
  async semanticSearch(query, options = {}) {
    const {
      userId = null,
      topK = 10,
      filter = {},
      minScore = 0.7
    } = options;

    // Generate query embedding
    const queryEmbedding = await this.embeddings.generateEmbedding(query);

    // Search in Pinecone
    const index = this.pinecone.Index('sartor-memories');
    const searchFilter = { ...filter };
    if (userId) searchFilter.userId = userId;

    const results = await index.query({
      vector: queryEmbedding.vector,
      topK: topK * 2,  // Fetch more, filter later
      filter: searchFilter,
      includeMetadata: true
    });

    // Filter by minimum score and fetch full data from Firestore
    const matches = results.matches
      .filter(m => m.score >= minScore)
      .slice(0, topK);

    const memoryIds = matches.map(m => m.id);
    const memories = await this.fetchMemoriesById(memoryIds);

    return matches.map(match => ({
      ...memories[match.id],
      score: match.score,
      searchType: 'semantic'
    }));
  }

  // Keyword search using Firestore
  async keywordSearch(query, options = {}) {
    const {
      userId = null,
      limit = 10,
      type = null
    } = options;

    let firestoreQuery = this.firestore.collection('memories');

    if (userId) {
      firestoreQuery = firestoreQuery.where('userId', '==', userId);
    }

    if (type) {
      firestoreQuery = firestoreQuery.where('type', '==', type);
    }

    // Firestore doesn't support full-text search natively
    // Use tags or implement with Algolia/Elasticsearch
    const words = query.toLowerCase().split(' ');
    const tagMatches = firestoreQuery
      .where('tags', 'array-contains-any', words)
      .limit(limit);

    const snapshot = await tagMatches.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      searchType: 'keyword'
    }));
  }

  // Hybrid search: combine semantic + keyword
  async hybridSearch(query, options = {}) {
    const {
      semanticWeight = 0.7,
      keywordWeight = 0.3,
      topK = 10
    } = options;

    // Run both searches in parallel
    const [semanticResults, keywordResults] = await Promise.all([
      this.semanticSearch(query, { ...options, topK: topK * 2 }),
      this.keywordSearch(query, { ...options, limit: topK * 2 })
    ]);

    // Merge and re-rank
    const merged = this.mergeResults(
      semanticResults,
      keywordResults,
      semanticWeight,
      keywordWeight
    );

    return merged.slice(0, topK);
  }

  // Merge results with weighted scoring
  mergeResults(semantic, keyword, semanticW, keywordW) {
    const scoreMap = new Map();

    // Add semantic scores
    semantic.forEach((result, idx) => {
      const score = result.score * semanticW;
      scoreMap.set(result.id, {
        ...result,
        combinedScore: score,
        semanticRank: idx + 1,
        keywordRank: null
      });
    });

    // Add keyword scores
    keyword.forEach((result, idx) => {
      // Normalize keyword score (use inverse rank)
      const score = (1 / (idx + 1)) * keywordW;

      if (scoreMap.has(result.id)) {
        const existing = scoreMap.get(result.id);
        existing.combinedScore += score;
        existing.keywordRank = idx + 1;
      } else {
        scoreMap.set(result.id, {
          ...result,
          combinedScore: score,
          semanticRank: null,
          keywordRank: idx + 1
        });
      }
    });

    // Sort by combined score
    return Array.from(scoreMap.values())
      .sort((a, b) => b.combinedScore - a.combinedScore);
  }

  // Fetch memories from Firestore by IDs
  async fetchMemoriesById(ids) {
    const memories = {};

    // Firestore 'in' queries limited to 10 items
    const chunks = this.chunkArray(ids, 10);

    for (const chunk of chunks) {
      const snapshot = await this.firestore
        .collection('memories')
        .where(Firestore.FieldPath.documentId(), 'in', chunk)
        .get();

      snapshot.docs.forEach(doc => {
        memories[doc.id] = { id: doc.id, ...doc.data() };
      });
    }

    return memories;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

module.exports = SemanticSearchService;
```

### Vector Database Configuration

```javascript
// Pinecone Configuration
const pineconeConfig = {
  indexName: "sartor-memories",
  dimension: 1536,  // text-embedding-3-small
  metric: "cosine",
  pods: 1,
  replicas: 1,
  podType: "s1.x1",

  // Metadata filtering
  metadataConfig: {
    indexed: [
      "userId",
      "type",
      "tags",
      "createdAt",
      "accessCount"
    ]
  }
};

// Weaviate Schema (Alternative)
const weaviateSchema = {
  class: "Memory",
  vectorizer: "none",  // We provide vectors
  properties: [
    {
      name: "content",
      dataType: ["text"],
      indexInverted: true
    },
    {
      name: "userId",
      dataType: ["string"],
      indexInverted: true
    },
    {
      name: "tags",
      dataType: ["string[]"],
      indexInverted: true
    }
  ]
};
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Memories collection
    match /memories/{memoryId} {
      allow read: if isAuthenticated() && (
        isOwner(resource.data.userId) || isAdmin()
      );

      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid &&
        request.resource.data.keys().hasAll([
          'content', 'type', 'userId', 'createdAt', 'tags'
        ]);

      allow update: if isAuthenticated() && (
        isOwner(resource.data.userId) || isAdmin()
      );

      allow delete: if isAuthenticated() && (
        isOwner(resource.data.userId) || isAdmin()
      );
    }

    // Embeddings collection
    match /embeddings/{embeddingId} {
      allow read: if isAuthenticated();
      allow write: if request.auth.token.service_account == true;
    }
  }
}
```
