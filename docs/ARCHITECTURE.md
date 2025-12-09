# Multi-Tier Storage Architecture Specification

## Firebase + GitHub + Vector Database

Version: 1.0.0
Date: 2025-12-06
Author: Technical Architecture Team

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Tier 1: Hot Memory (Firebase Realtime DB)](#tier-1-hot-memory)
4. [Tier 2: Warm Memory (Firestore + Vector DB)](#tier-2-warm-memory)
5. [Tier 3: Cold Memory (GitHub Repository)](#tier-3-cold-memory)
6. [Synchronization Strategy](#synchronization-strategy)
7. [Data Flow Patterns](#data-flow-patterns)
8. [Performance Characteristics](#performance-characteristics)
9. [Cost Optimization](#cost-optimization)
10. [Implementation Roadmap](#implementation-roadmap)

---

## System Overview

This architecture implements a three-tiered memory system optimized for different access patterns, latency requirements, and cost profiles:

- **Tier 1 (Hot)**: Sub-100ms access, real-time sync, high cost, small dataset
- **Tier 2 (Warm)**: 100-500ms access, semantic search, medium cost, medium dataset
- **Tier 3 (Cold)**: 1-5s access, bulk storage, low cost, unlimited dataset

### Design Principles

1. **Data Temperature**: Frequently accessed data stays hot, rarely accessed moves cold
2. **Automatic Tiering**: Background processes manage data movement
3. **Semantic Awareness**: Vector embeddings enable intelligent search across tiers
4. **Version Control**: All data changes tracked in Git for auditability
5. **Cost Efficiency**: Minimize expensive storage through intelligent eviction

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                         │
│  (Web, Mobile, CLI, API Consumers)                                  │
└───────────────┬─────────────────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY / ROUTER                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Query Analyzer & Tier Router                               │    │
│  │  - Determines which tier(s) to query                        │    │
│  │  - Manages parallel queries                                 │    │
│  │  - Aggregates results                                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
└───┬──────────────────────┬──────────────────────┬───────────────────┘
    │                      │                      │
    ▼                      ▼                      ▼
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│   TIER 1: HOT   │  │  TIER 2: WARM    │  │   TIER 3: COLD      │
│                 │  │                  │  │                     │
│ Firebase RTDB   │  │  Firestore       │  │  GitHub Repo        │
│  ┌───────────┐  │  │  ┌────────────┐  │  │  ┌───────────────┐  │
│  │ Sessions  │  │  │  │ Memories   │  │  │  │ memories/     │  │
│  │ Context   │  │  │  │ Documents  │  │  │  │  2025/        │  │
│  │ Cache     │  │  │  │ Metadata   │  │  │  │    12/        │  │
│  └───────────┘  │  │  └────────────┘  │  │  │      *.md     │  │
│                 │  │                  │  │  │               │  │
│  TTL: 1-24 hrs  │  │  Vector Search   │  │  │  Version Ctrl │  │
│  Size: <100MB   │  │  ┌────────────┐  │  │  │  Unlimited    │  │
│  Latency: <100ms│  │  │ Pinecone/  │  │  │  │  Latency: 1-5s│  │
│                 │  │  │ Weaviate   │  │  │  └───────────────┘  │
│                 │  │  │ Qdrant     │  │  │                     │
│                 │  │  └────────────┘  │  │                     │
│                 │  │  Latency: 100-  │  │                     │
│                 │  │  500ms          │  │                     │
└────────┬────────┘  └────────┬─────────┘  └──────────┬──────────┘
         │                    │                       │
         └────────────────────┼───────────────────────┘
                              │
                              ▼
                 ┌────────────────────────────┐
                 │  SYNCHRONIZATION ENGINE    │
                 │  ┌──────────────────────┐  │
                 │  │ Promotion Manager    │  │
                 │  │ - Access frequency   │  │
                 │  │ - Recency scoring    │  │
                 │  │ - Manual pins        │  │
                 │  └──────────────────────┘  │
                 │  ┌──────────────────────┐  │
                 │  │ Demotion Manager     │  │
                 │  │ - TTL expiration     │  │
                 │  │ - Size limits        │  │
                 │  │ - Cost thresholds    │  │
                 │  └──────────────────────┘  │
                 │  ┌──────────────────────┐  │
                 │  │ Embedding Generator  │  │
                 │  │ - OpenAI/Cohere API  │  │
                 │  │ - Batch processing   │  │
                 │  │ - Incremental updates│  │
                 │  └──────────────────────┘  │
                 └────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────────┐
                 │    MONITORING & METRICS    │
                 │  - Tier hit rates          │
                 │  - Query latencies         │
                 │  - Storage costs           │
                 │  - Sync queue depth        │
                 └────────────────────────────┘
```

### Data Flow Example

```
User Query: "Find memories about project X"
    │
    ├─> [1] Check TIER 1 (Hot) - Session context
    │   └─> Cache hit? Return immediately
    │
    ├─> [2] Check TIER 2 (Warm) - Vector search
    │   ├─> Generate query embedding
    │   ├─> Hybrid search (semantic + keyword)
    │   └─> Return top K results
    │
    └─> [3] Check TIER 3 (Cold) - Full text search
        ├─> GitHub API search or local clone
        ├─> Parse markdown files
        └─> Return matches

    [4] Aggregate results by relevance
    [5] Promote frequently accessed to higher tier
    [6] Return to user (total latency: 150-800ms)
```

---

## Tier 1: Hot Memory

### Firebase Realtime Database

**Purpose**: Ultra-low latency access to active session data, frequently accessed memories, and real-time collaboration state.

### Data Structure & Schema

```javascript
{
  // Root structure
  "hot_memory": {
    // Active sessions - auto-expire after 24 hours
    "sessions": {
      "{session_id}": {
        "userId": "user_123",
        "startedAt": 1733500800000,
        "lastActive": 1733504400000,
        "ttl": 1733587200000,  // Unix timestamp for expiration
        "context": {
          "currentTopic": "project_alpha",
          "recentQueries": [
            "status of deployment",
            "error logs from yesterday"
          ],
          "activeMemories": [
            "mem_hot_001",
            "mem_hot_002"
          ]
        },
        "preferences": {
          "theme": "dark",
          "language": "en",
          "notifications": true
        }
      }
    },

    // Frequently accessed memories (promoted from warm tier)
    "memories": {
      "{memory_id}": {
        "id": "mem_hot_001",
        "content": "Deployment completed successfully at 2025-12-05 14:30 UTC",
        "type": "event",
        "timestamp": 1733500800000,
        "userId": "user_123",
        "accessCount": 42,
        "lastAccessed": 1733504400000,
        "promotedAt": 1733490000000,
        "tags": ["deployment", "success", "production"],
        "metadata": {
          "source": "warm_tier",
          "embeddingId": "emb_vec_001",
          "confidence": 0.95
        },
        // TTL enforced at this level
        "ttl": 1733587200000
      }
    },

    // Real-time cache for quick lookups
    "cache": {
      "queries": {
        "{query_hash}": {
          "query": "recent deployments",
          "results": ["mem_hot_001", "mem_hot_003"],
          "cachedAt": 1733504000000,
          "ttl": 1733507600000,  // 1 hour TTL
          "hitCount": 15
        }
      },
      "aggregations": {
        "recent_tags": {
          "deployment": 12,
          "error": 5,
          "success": 8
        },
        "updatedAt": 1733504400000,
        "ttl": 1733508000000
      }
    },

    // User presence for collaboration
    "presence": {
      "{user_id}": {
        "online": true,
        "lastSeen": 1733504400000,
        "currentSession": "session_abc123",
        "activeDocument": "mem_hot_001",
        // Auto-removed on disconnect
        ".sv": { "timestamp": true }
      }
    },

    // Real-time sync state
    "sync_status": {
      "last_warm_sync": 1733503800000,
      "last_cold_sync": 1733500200000,
      "pending_promotions": 3,
      "pending_demotions": 7,
      "queue_depth": 10
    }
  }
}
```

### TTL and Eviction Policies

```javascript
// File: config/firebase-rtdb-rules.js

const TTL_POLICIES = {
  sessions: {
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    maxTTL: 7 * 24 * 60 * 60 * 1000, // 7 days (for pinned sessions)
    cleanupInterval: 60 * 60 * 1000, // Check every hour
  },
  memories: {
    defaultTTL: 6 * 60 * 60 * 1000, // 6 hours
    accessBasedExtension: 3 * 60 * 60 * 1000, // +3 hours per access
    maxTTL: 24 * 60 * 60 * 1000, // 24 hours max
    demotionThreshold: 5, // Demote if <5 accesses in TTL period
    sizeLimit: 100 * 1024 * 1024, // 100MB total size limit
  },
  cache: {
    queryTTL: 60 * 60 * 1000, // 1 hour
    aggregationTTL: 30 * 60 * 1000, // 30 minutes
    maxEntries: 1000, // Max cached queries
  },
  presence: {
    disconnectTimeout: 5 * 60 * 1000, // 5 minutes
  },
};

// Eviction Strategy
const EVICTION_STRATEGY = {
  // LRU + Access Frequency hybrid
  algorithm: 'LRU_ACCESS_WEIGHTED',

  // Scoring function for eviction candidates
  scoreMemory: (memory) => {
    const now = Date.now();
    const ageHours = (now - memory.lastAccessed) / (60 * 60 * 1000);
    const accessRate = memory.accessCount / Math.max(1, ageHours);
    const recencyBonus = Math.exp(-ageHours / 6); // Exponential decay

    return accessRate * recencyBonus;
  },

  // Size-based eviction when limit reached
  onSizeLimitReached: 'evict_lowest_score',

  // Batch eviction to avoid thrashing
  evictionBatchSize: 10,
  evictionThreshold: 0.9, // Trigger at 90% capacity
};
```

### Real-time Sync Configuration

```javascript
// File: config/firebase-realtime-sync.js

const realtimeConfig = {
  // Connection settings
  persistence: {
    enabled: true,
    cacheSizeBytes: 10 * 1024 * 1024, // 10MB local cache
  },

  // Sync configuration
  sync: {
    // Only sync active data paths
    paths: [
      '/hot_memory/sessions/${userId}',
      '/hot_memory/memories',
      '/hot_memory/cache/queries',
      '/hot_memory/presence/${userId}',
    ],

    // Keep-alive for real-time listeners
    keepAlive: true,
    reconnectDelay: 1000,
    maxReconnectAttempts: 10,

    // Bandwidth optimization
    compression: true,
    batchWrites: true,
    batchInterval: 50, // ms
  },

  // Listener priorities
  listenerPriorities: {
    sessions: 'high',
    presence: 'high',
    memories: 'medium',
    cache: 'low',
  },

  // Offline behavior
  offline: {
    persistQueries: true,
    queueWrites: true,
    maxQueueSize: 100,
  },
};

// Example: Initialize with sync
const initializeRealtimeDB = (firebase, userId) => {
  const db = firebase.database();

  // Enable offline persistence
  db.setPersistenceEnabled(true);

  // Set up session listener
  const sessionRef = db.ref(`hot_memory/sessions/${userId}`);
  sessionRef.on('value', (snapshot) => {
    const session = snapshot.val();
    if (session && session.ttl < Date.now()) {
      // Auto-cleanup expired session
      sessionRef.remove();
    }
  });

  // Set up presence
  const presenceRef = db.ref(`hot_memory/presence/${userId}`);
  const connectedRef = db.ref('.info/connected');

  connectedRef.on('value', (snapshot) => {
    if (snapshot.val() === true) {
      presenceRef.onDisconnect().remove();
      presenceRef.set({
        online: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
      });
    }
  });

  return db;
};
```

### Security Rules

```json
{
  "rules": {
    "hot_memory": {
      "sessions": {
        "$session_id": {
          // Users can only read/write their own sessions
          ".read": "auth != null && data.child('userId').val() === auth.uid",
          ".write": "auth != null && (
            !data.exists() ||
            data.child('userId').val() === auth.uid
          )",

          // Validate structure
          ".validate": "newData.hasChildren(['userId', 'startedAt', 'lastActive', 'ttl'])",

          // Auto-index for queries
          ".indexOn": ["userId", "lastActive", "ttl"]
        }
      },

      "memories": {
        "$memory_id": {
          // Read: authenticated users
          // Write: only the owner or admin
          ".read": "auth != null",
          ".write": "auth != null && (
            data.child('userId').val() === auth.uid ||
            root.child('users').child(auth.uid).child('role').val() === 'admin'
          )",

          // Validate TTL is set and in future
          ".validate": "newData.child('ttl').val() > now",

          // Prevent oversized content (max 64KB per memory)
          "content": {
            ".validate": "newData.isString() && newData.val().length < 65536"
          },

          ".indexOn": ["userId", "timestamp", "lastAccessed", "ttl", "type"]
        }
      },

      "cache": {
        "queries": {
          "$query_hash": {
            // Public read, write only via cloud functions
            ".read": "auth != null",
            ".write": "auth.token.service_account === true"
          }
        },
        "aggregations": {
          ".read": "auth != null",
          ".write": "auth.token.service_account === true"
        }
      },

      "presence": {
        "$user_id": {
          // Users can only write their own presence
          ".read": "auth != null",
          ".write": "auth != null && auth.uid === $user_id",
          ".validate": "newData.hasChildren(['online', 'lastSeen'])"
        }
      },

      "sync_status": {
        // Read by all authenticated, write only by service accounts
        ".read": "auth != null",
        ".write": "auth.token.service_account === true",
        ".indexOn": ["last_warm_sync", "last_cold_sync"]
      }
    }
  }
}
```

### Hot Tier Metrics & Monitoring

```javascript
// File: monitoring/hot-tier-metrics.js

const hotTierMetrics = {
  // Track these metrics
  metrics: {
    sessionCount: 0,
    memoryCount: 0,
    cacheHitRate: 0.0,
    avgAccessLatency: 0,
    storageBytes: 0,
    readOps: 0,
    writeOps: 0,
    evictionCount: 0,
  },

  // Alert thresholds
  alerts: {
    storageBytes: {
      warning: 80 * 1024 * 1024, // 80MB
      critical: 95 * 1024 * 1024, // 95MB
    },
    cacheHitRate: {
      warning: 0.6, // Below 60%
      critical: 0.4, // Below 40%
    },
    avgAccessLatency: {
      warning: 100, // 100ms
      critical: 200, // 200ms
    },
  },

  // Cost tracking
  costs: {
    storagePerGB: 5.0, // $5/GB/month
    readsPer100k: 0.36, // $0.36 per 100k reads
    writesPer100k: 1.08, // $1.08 per 100k writes
    downloadPerGB: 0.12, // $0.12 per GB downloaded
  },
};
```

---
