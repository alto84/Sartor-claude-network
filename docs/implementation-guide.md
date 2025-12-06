# Implementation Guide

## Quick Start

### Prerequisites

- Node.js 18+
- Firebase account
- GitHub account
- Vector database account (Pinecone/Weaviate/Qdrant)
- OpenAI API key (for embeddings)

### Installation

```bash
# Clone repository
git clone https://github.com/sartor/claude-network.git
cd claude-network

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

```bash
# .env
FIREBASE_PROJECT_ID=sartor-memories
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=service-account@sartor-memories.iam.gserviceaccount.com

GITHUB_TOKEN=ghp_...
GITHUB_OWNER=sartor
GITHUB_REPO=memories

PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX=sartor-memories

OPENAI_API_KEY=sk-...

NODE_ENV=production
```

### Firebase Setup

1. **Create Firebase Project**
```bash
npm install -g firebase-tools
firebase login
firebase init
```

2. **Enable Services**
- Realtime Database
- Firestore
- Authentication
- Cloud Functions
- Cloud Storage

3. **Deploy Security Rules**
```bash
firebase deploy --only database,firestore:rules
```

4. **Initialize Database Structure**
```bash
node scripts/init-firebase.js
```

### GitHub Repository Setup

1. **Create Memory Repository**
```bash
gh repo create sartor-memories --private
cd sartor-memories
mkdir -p memories/{2025,archive,embeddings} indexes schemas scripts .github/workflows
```

2. **Set Up GitHub Actions**
```bash
# Copy workflow files
cp ../claude-network/workflows/*.yml .github/workflows/

# Add secrets
gh secret set FIREBASE_SERVICE_ACCOUNT < service-account.json
gh secret set FIRESTORE_PROJECT_ID -b "sartor-memories"
```

3. **Initialize Structure**
```bash
git add .
git commit -m "Initial commit: memory system structure"
git push origin main
```

### Vector Database Setup

#### Option 1: Pinecone

```bash
# Create index
node scripts/setup-pinecone.js
```

```javascript
// scripts/setup-pinecone.js
const { PineconeClient } = require('@pinecone-database/pinecone');

async function setup() {
  const pinecone = new PineconeClient();
  await pinecone.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT
  });

  await pinecone.createIndex({
    createRequest: {
      name: 'sartor-memories',
      dimension: 1536,
      metric: 'cosine',
      pods: 1,
      podType: 's1.x1'
    }
  });

  console.log('Pinecone index created');
}

setup();
```

#### Option 2: Weaviate

```bash
# Create schema
node scripts/setup-weaviate.js
```

#### Option 3: Qdrant

```bash
# Create collection
node scripts/setup-qdrant.js
```

## Architecture Deployment

### Step 1: Deploy Hot Tier (Firebase RTDB)

```javascript
// services/hot-tier/index.js
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
});

const db = admin.database();

class HotTier {
  constructor() {
    this.db = db;
  }

  async createSession(userId, sessionData) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionRef = this.db.ref(`hot_memory/sessions/${sessionId}`);

    await sessionRef.set({
      userId,
      startedAt: Date.now(),
      lastActive: Date.now(),
      ttl: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      context: sessionData.context || {},
      preferences: sessionData.preferences || {}
    });

    return sessionId;
  }

  async getSession(sessionId) {
    const snapshot = await this.db.ref(`hot_memory/sessions/${sessionId}`).once('value');
    return snapshot.val();
  }

  async updateSession(sessionId, updates) {
    await this.db.ref(`hot_memory/sessions/${sessionId}`).update({
      ...updates,
      lastActive: Date.now()
    });
  }

  async promoteMemory(memoryId, memoryData) {
    const memoryRef = this.db.ref(`hot_memory/memories/${memoryId}`);

    await memoryRef.set({
      ...memoryData,
      promotedAt: Date.now(),
      ttl: Date.now() + 6 * 60 * 60 * 1000 // 6 hours
    });
  }

  async getMemory(memoryId) {
    const snapshot = await this.db.ref(`hot_memory/memories/${memoryId}`).once('value');
    return snapshot.val();
  }

  async extendTTL(memoryId) {
    const memoryRef = this.db.ref(`hot_memory/memories/${memoryId}`);
    const snapshot = await memoryRef.once('value');

    if (snapshot.exists()) {
      const current = snapshot.val();
      const newTTL = Math.min(
        Date.now() + 24 * 60 * 60 * 1000, // Max 24 hours
        current.ttl + 3 * 60 * 60 * 1000   // +3 hours
      );

      await memoryRef.update({
        lastAccessed: Date.now(),
        accessCount: (current.accessCount || 0) + 1,
        ttl: newTTL
      });
    }
  }
}

module.exports = new HotTier();
```

### Step 2: Deploy Warm Tier (Firestore + Vector DB)

```javascript
// services/warm-tier/index.js
const { Firestore } = require('@google-cloud/firestore');
const { PineconeClient } = require('@pinecone-database/pinecone');
const EmbeddingService = require('../embedding-service');

class WarmTier {
  constructor() {
    this.firestore = new Firestore();
    this.pinecone = new PineconeClient();
    this.embeddings = new EmbeddingService({
      openaiApiKey: process.env.OPENAI_API_KEY,
      embeddingModel: 'text-embedding-3-small'
    });
  }

  async initialize() {
    await this.pinecone.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT
    });

    this.index = this.pinecone.Index('sartor-memories');
  }

  async createMemory(memoryData) {
    const memoryId = memoryData.id || this.generateMemoryId();

    // Store in Firestore
    await this.firestore
      .collection('memories')
      .doc(memoryId)
      .set({
        ...memoryData,
        id: memoryId,
        createdAt: Firestore.Timestamp.now(),
        updatedAt: Firestore.Timestamp.now(),
        accessCount: 0,
        lastAccessed: Firestore.Timestamp.now()
      });

    // Generate and store embedding
    const embedding = await this.embeddings.generateEmbedding(
      memoryData.content,
      { memoryId, userId: memoryData.userId }
    );

    await this.embeddings.storeEmbedding(memoryId, embedding);

    return memoryId;
  }

  async getMemory(memoryId) {
    const doc = await this.firestore
      .collection('memories')
      .doc(memoryId)
      .get();

    if (!doc.exists) {
      return null;
    }

    // Update access tracking
    await this.firestore
      .collection('memories')
      .doc(memoryId)
      .update({
        lastAccessed: Firestore.Timestamp.now(),
        accessCount: Firestore.FieldValue.increment(1)
      });

    return { id: doc.id, ...doc.data() };
  }

  async searchMemories(query, options = {}) {
    const {
      userId = null,
      topK = 10,
      filter = {},
      searchType = 'hybrid'
    } = options;

    if (searchType === 'semantic' || searchType === 'hybrid') {
      // Generate query embedding
      const queryEmbedding = await this.embeddings.generateEmbedding(query);

      // Search in Pinecone
      const results = await this.index.query({
        vector: queryEmbedding.vector,
        topK: topK * 2,
        filter: userId ? { userId } : {},
        includeMetadata: true
      });

      // Fetch full memories from Firestore
      const memoryIds = results.matches.map(m => m.id);
      const memories = await this.fetchMemoriesByIds(memoryIds);

      return memories;
    }

    // Keyword search
    return this.keywordSearch(query, options);
  }

  async fetchMemoriesByIds(ids) {
    const memories = [];

    // Firestore 'in' limited to 10 items
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      const snapshot = await this.firestore
        .collection('memories')
        .where(Firestore.FieldPath.documentId(), 'in', chunk)
        .get();

      snapshot.docs.forEach(doc => {
        memories.push({ id: doc.id, ...doc.data() });
      });
    }

    return memories;
  }

  generateMemoryId() {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 3);
    return `mem_warm_${date}_${random}`;
  }
}

module.exports = new WarmTier();
```

### Step 3: Deploy Cold Tier (GitHub)

Already handled by GitHub Actions workflows.

### Step 4: Deploy Synchronization Engine

```javascript
// services/sync/index.js
const HotToWarmDemotion = require('./hot-to-warm-demotion');
const WarmToColdDemotion = require('./warm-to-cold-demotion');
const ColdToWarmPromotion = require('./cold-to-warm-promotion');
const WarmToHotPromotion = require('./warm-to-hot-promotion');
const SyncScheduler = require('./scheduler');

class SyncEngine {
  constructor() {
    this.hotToWarm = new HotToWarmDemotion();
    this.warmToCold = new WarmToColdDemotion();
    this.coldToWarm = new ColdToWarmPromotion();
    this.warmToHot = new WarmToHotPromotion();

    this.scheduler = new SyncScheduler({
      hotDemotion: this.hotToWarm,
      warmDemotion: this.warmToCold,
      coldPromotion: this.coldToWarm,
      warmPromotion: this.warmToHot
    });
  }

  async start() {
    console.log('Starting synchronization engine...');

    // Schedule background jobs
    this.scheduler.scheduleAll();

    console.log('Synchronization engine running');
  }

  async stop() {
    console.log('Stopping synchronization engine...');
    // Cleanup
  }
}

module.exports = new SyncEngine();
```

### Step 5: Deploy API Gateway

```javascript
// services/api/index.js
const express = require('express');
const hotTier = require('../hot-tier');
const warmTier = require('../warm-tier');
const syncEngine = require('../sync');

const app = express();
app.use(express.json());

// Query router - determines which tier(s) to check
app.post('/api/query', async (req, res) => {
  const { query, userId, sessionId } = req.body;

  try {
    // 1. Check hot tier (session context)
    const sessionContext = await hotTier.getSession(sessionId);

    // 2. Check warm tier (semantic search)
    const warmResults = await warmTier.searchMemories(query, {
      userId,
      topK: 10,
      searchType: 'hybrid'
    });

    // 3. Optionally check cold tier (via GitHub API)
    // For now, skip unless warm tier has no results

    // 4. Aggregate and return
    res.json({
      results: warmResults,
      sessionContext
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create memory
app.post('/api/memories', async (req, res) => {
  const { content, type, userId, tags } = req.body;

  try {
    const memoryId = await warmTier.createMemory({
      content,
      type,
      userId,
      tags
    });

    res.json({ memoryId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get memory (checks all tiers)
app.get('/api/memories/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Check hot tier first
    let memory = await hotTier.getMemory(id);

    // If not in hot, check warm
    if (!memory) {
      memory = await warmTier.getMemory(id);

      // If found and frequently accessed, promote to hot
      if (memory && memory.accessCount > 10) {
        await hotTier.promoteMemory(id, memory);
      }
    }

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json(memory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);

  // Start sync engine
  syncEngine.start();
});
```

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test hot tier
node tests/hot-tier.test.js

# Test warm tier
node tests/warm-tier.test.js

# Test sync engine
node tests/sync.test.js
```

## Monitoring

### Metrics Dashboard

```javascript
// services/monitoring/metrics.js
class MetricsCollector {
  async collectMetrics() {
    return {
      tiers: {
        hot: await this.getHotTierMetrics(),
        warm: await this.getWarmTierMetrics(),
        cold: await this.getColdTierMetrics()
      },
      sync: await this.getSyncMetrics(),
      costs: await this.getCostMetrics()
    };
  }

  async getHotTierMetrics() {
    // Query Firebase RTDB
    const snapshot = await admin.database()
      .ref('hot_memory/memories')
      .once('value');

    const memories = snapshot.val() || {};
    const count = Object.keys(memories).length;
    const size = JSON.stringify(memories).length;

    return { count, size, latency: 0 };
  }

  async getWarmTierMetrics() {
    // Query Firestore
    const snapshot = await firestore
      .collection('memories')
      .count()
      .get();

    return {
      count: snapshot.data().count,
      vectorCount: await this.getVectorCount()
    };
  }

  async getColdTierMetrics() {
    // Query GitHub API
    const { data } = await github.repos.get({
      owner: 'sartor',
      repo: 'memories'
    });

    return {
      size: data.size,
      commits: data.commits || 0
    };
  }
}
```

## Production Checklist

- [ ] Firebase project created and configured
- [ ] Firestore indexes deployed
- [ ] Firebase security rules deployed
- [ ] GitHub repository created
- [ ] GitHub Actions workflows configured
- [ ] GitHub secrets added
- [ ] Vector database index created
- [ ] OpenAI API key configured
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Tests passing
- [ ] Monitoring dashboard set up
- [ ] Alerts configured
- [ ] Backup strategy implemented
- [ ] Documentation updated
- [ ] Security audit completed
