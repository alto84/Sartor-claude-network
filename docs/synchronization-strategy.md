# Synchronization Strategy

## Overview

The synchronization engine manages data flow between three tiers, ensuring optimal placement based on access patterns, recency, and cost constraints.

### Synchronization Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYNCHRONIZATION ENGINE                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Event Queue (Cloud Tasks)                 │ │
│  │  - Promotion requests                                       │ │
│  │  - Demotion requests                                        │ │
│  │  - Embedding generation requests                           │ │
│  │  - Archive requests                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Promotion Manager│  │ Demotion Manager │  │ Embedding Gen │ │
│  │                  │  │                  │  │               │ │
│  │ Cold → Warm      │  │ Hot → Warm       │  │ Batch Process │ │
│  │ Warm → Hot       │  │ Warm → Cold      │  │ Incremental   │ │
│  │                  │  │                  │  │ Updates       │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                 Conflict Resolution                         │ │
│  │  - Last-write-wins with version tracking                   │ │
│  │  - Manual review queue for conflicts                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                 Background Scheduler                        │ │
│  │  - Hourly: Hot tier cleanup                                │ │
│  │  - Daily: Cold consolidation                               │ │
│  │  - Weekly: Embedding regeneration                          │ │
│  │  - Monthly: Archive old memories                           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Patterns

### 1. Cold → Warm → Hot (Promotion Flow)

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  COLD    │ ───1──> │   WARM   │ ───2──> │   HOT    │
│ (GitHub) │         │(Firestore│         │ (RTDB)   │
│          │         │+ Vector) │         │          │
└──────────┘         └──────────┘         └──────────┘
     │                    │                     │
     │                    │                     │
  Trigger:            Trigger:              Trigger:
  - User access       - Access freq         - Session active
  - Manual request    - High relevance      - Pinned memory
  - Search hit        - Recent access       - Real-time collab
```

#### Cold → Warm Promotion

**Trigger Conditions:**
- Memory accessed via GitHub search
- Manual promotion request
- Part of active project/topic
- Referenced by recently accessed memory

**Process:**
```javascript
// File: services/sync/cold-to-warm-promotion.js

class ColdToWarmPromotion {
  constructor(firestore, github, embeddingService) {
    this.firestore = firestore;
    this.github = github;
    this.embeddings = embeddingService;
  }

  async promote(memoryId, reason) {
    console.log(`Promoting ${memoryId} from cold to warm. Reason: ${reason}`);

    // 1. Fetch from GitHub
    const githubMemory = await this.fetchFromGitHub(memoryId);
    if (!githubMemory) {
      throw new Error(`Memory ${memoryId} not found in GitHub`);
    }

    // 2. Parse frontmatter and content
    const { frontmatter, content } = this.parseMarkdown(githubMemory.content);

    // 3. Create Firestore document
    const firestoreDoc = {
      id: memoryId,
      content: content,
      type: frontmatter.type,
      userId: frontmatter.userId,
      createdAt: new Date(frontmatter.createdAt),
      updatedAt: new Date(frontmatter.updatedAt),
      lastAccessed: new Date(),
      accessCount: (frontmatter.accessCount || 0) + 1,
      tags: frontmatter.tags || [],
      entities: frontmatter.entities || {},
      metadata: {
        ...frontmatter.metadata,
        source: 'cold_tier',
        sourceId: githubMemory.sha,
        promotedAt: new Date(),
        promotionReason: reason
      },
      promotion: {
        eligibleForHot: false,
        hotScore: 0,
        lastPromotedAt: null,
        promotionCount: (frontmatter.promotion?.promotionCount || 0)
      },
      archival: {
        eligibleForCold: false,
        coldScore: 0,
        archivedInGitHub: true,
        githubPath: githubMemory.path,
        githubSha: githubMemory.sha
      }
    };

    // 4. Store in Firestore
    await this.firestore
      .collection('memories')
      .doc(memoryId)
      .set(firestoreDoc);

    // 5. Generate and store embedding
    const embedding = await this.embeddings.generateEmbedding(content, {
      memoryId: memoryId,
      userId: frontmatter.userId
    });

    await this.embeddings.storeEmbedding(memoryId, embedding);

    // 6. Update GitHub metadata (async)
    await this.updateGitHubMetadata(githubMemory.path, {
      'promotion.lastPromotedTo': 'warm',
      'promotion.promotedAt': new Date().toISOString(),
      'promotion.promotionCount': firestoreDoc.promotion.promotionCount + 1
    });

    // 7. Track metric
    await this.trackPromotion('cold_to_warm', memoryId, reason);

    return { success: true, memoryId, tier: 'warm' };
  }

  async fetchFromGitHub(memoryId) {
    // Use GitHub API to search for file by memory ID
    const searchResults = await this.github.search.code({
      q: `${memoryId} in:file repo:sartor-memories`,
      per_page: 1
    });

    if (searchResults.data.items.length === 0) {
      return null;
    }

    const file = searchResults.data.items[0];

    // Fetch file content
    const content = await this.github.repos.getContent({
      owner: 'sartor',
      repo: 'memories',
      path: file.path
    });

    return {
      path: file.path,
      sha: content.data.sha,
      content: Buffer.from(content.data.content, 'base64').toString('utf8')
    };
  }

  parseMarkdown(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      throw new Error('Invalid markdown format');
    }

    const yaml = require('js-yaml');
    const frontmatter = yaml.load(match[1]);
    const body = match[2].trim();

    return { frontmatter, content: body };
  }

  async updateGitHubMetadata(filePath, updates) {
    // Queue for background processing
    await this.queueGitHubUpdate(filePath, updates);
  }

  async trackPromotion(type, memoryId, reason) {
    await this.firestore
      .collection('sync_metrics')
      .add({
        type: type,
        memoryId: memoryId,
        reason: reason,
        timestamp: new Date()
      });
  }
}

module.exports = ColdToWarmPromotion;
```

#### Warm → Hot Promotion

**Trigger Conditions:**
- Access count > 10 in last 24 hours
- Accessed in active session
- Manually pinned by user
- Part of current context/topic

**Scoring Function:**
```javascript
// File: services/sync/scoring.js

class PromotionScoring {
  // Calculate hot tier eligibility score
  calculateHotScore(memory, sessionContext) {
    const weights = {
      accessFrequency: 0.35,
      recency: 0.25,
      sessionRelevance: 0.20,
      userPreference: 0.15,
      contentSize: 0.05
    };

    const now = Date.now();
    const ageHours = (now - memory.lastAccessed) / (60 * 60 * 1000);

    // Access frequency score (0-10)
    const accessRate = memory.accessCount / Math.max(1, ageHours);
    const accessScore = Math.min(10, accessRate * 2);

    // Recency score (0-10) - exponential decay
    const recencyScore = 10 * Math.exp(-ageHours / 24);

    // Session relevance (0-10)
    const sessionScore = this.calculateSessionRelevance(
      memory,
      sessionContext
    );

    // User preference (0-10)
    const prefScore = memory.pinned ? 10 : 0;

    // Content size penalty (0-10, smaller is better for hot tier)
    const sizeScore = 10 - Math.min(10, memory.content.length / 6400);

    const totalScore =
      accessScore * weights.accessFrequency +
      recencyScore * weights.recency +
      sessionScore * weights.sessionRelevance +
      prefScore * weights.userPreference +
      sizeScore * weights.contentSize;

    return Math.round(totalScore * 10) / 10;
  }

  calculateSessionRelevance(memory, sessionContext) {
    if (!sessionContext) return 0;

    let score = 0;

    // Topic match
    if (memory.tags.some(tag => sessionContext.currentTopic?.includes(tag))) {
      score += 5;
    }

    // Recent queries match
    const queryTerms = sessionContext.recentQueries
      .flatMap(q => q.toLowerCase().split(' '));

    const contentTerms = memory.content.toLowerCase().split(' ');
    const matchCount = queryTerms.filter(term =>
      contentTerms.includes(term)
    ).length;

    score += Math.min(5, matchCount / 2);

    return score;
  }

  // Calculate cold tier eligibility score
  calculateColdScore(memory) {
    const weights = {
      age: 0.4,
      accessFrequency: 0.3,
      completeness: 0.2,
      archivalFlag: 0.1
    };

    const now = Date.now();
    const ageDays = (now - memory.createdAt) / (24 * 60 * 60 * 1000);

    // Age score (0-10, older = higher)
    const ageScore = Math.min(10, ageDays / 30);

    // Low access frequency score (0-10)
    const accessScore = 10 - Math.min(10, memory.accessCount / 10);

    // Completeness score (well-formed memories archive better)
    const completenessScore = this.checkCompleteness(memory);

    // Archival flag
    const archivalScore = memory.archival?.eligibleForCold ? 10 : 0;

    const totalScore =
      ageScore * weights.age +
      accessScore * weights.accessFrequency +
      completenessScore * weights.completeness +
      archivalScore * weights.archivalFlag;

    return Math.round(totalScore * 10) / 10;
  }

  checkCompleteness(memory) {
    let score = 0;

    if (memory.tags && memory.tags.length > 0) score += 3;
    if (memory.entities && Object.keys(memory.entities).length > 0) score += 3;
    if (memory.metadata && memory.metadata.version) score += 2;
    if (memory.content.length > 500) score += 2;

    return score;
  }
}

module.exports = PromotionScoring;
```

### 2. Hot → Warm → Cold (Demotion Flow)

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│   HOT    │ ───1──> │   WARM   │ ───2──> │  COLD    │
│  (RTDB)  │         │(Firestore│         │ (GitHub) │
│          │         │+ Vector) │         │          │
└──────────┘         └──────────┘         └──────────┘
     │                    │                     │
     │                    │                     │
  Trigger:            Trigger:              Trigger:
  - TTL expired       - Low access freq     - Consolidation
  - Size limit        - Age > threshold     - Archive policy
  - Session ended     - Cost threshold      - Manual archive
```

#### Hot → Warm Demotion

```javascript
// File: services/sync/hot-to-warm-demotion.js

class HotToWarmDemotion {
  constructor(firebaseRTDB, firestore) {
    this.rtdb = firebaseRTDB;
    this.firestore = firestore;
  }

  async demote(memoryId, reason) {
    console.log(`Demoting ${memoryId} from hot to warm. Reason: ${reason}`);

    // 1. Fetch from RTDB
    const rtdbMemory = await this.rtdb
      .ref(`hot_memory/memories/${memoryId}`)
      .once('value');

    if (!rtdbMemory.exists()) {
      throw new Error(`Memory ${memoryId} not found in hot tier`);
    }

    const memoryData = rtdbMemory.val();

    // 2. Check if already in Firestore
    const firestoreRef = this.firestore.collection('memories').doc(memoryId);
    const firestoreDoc = await firestoreRef.get();

    if (firestoreDoc.exists()) {
      // Update existing document
      await firestoreRef.update({
        lastAccessed: new Date(memoryData.lastAccessed),
        accessCount: memoryData.accessCount,
        'promotion.eligibleForHot': false,
        'promotion.lastDemotedAt': new Date(),
        'promotion.demotionReason': reason,
        updatedAt: new Date()
      });
    } else {
      // Create new Firestore document (shouldn't happen, but handle it)
      const firestoreData = this.convertToFirestoreFormat(memoryData);
      await firestoreRef.set(firestoreData);
    }

    // 3. Remove from RTDB
    await this.rtdb.ref(`hot_memory/memories/${memoryId}`).remove();

    // 4. Track metric
    await this.trackDemotion('hot_to_warm', memoryId, reason);

    return { success: true, memoryId, tier: 'warm' };
  }

  async cleanupExpired() {
    const now = Date.now();

    // Query expired memories
    const expiredSnapshot = await this.rtdb
      .ref('hot_memory/memories')
      .orderByChild('ttl')
      .endAt(now)
      .once('value');

    const expiredMemories = [];
    expiredSnapshot.forEach(child => {
      expiredMemories.push(child.key);
    });

    console.log(`Found ${expiredMemories.length} expired memories in hot tier`);

    // Demote in batches
    const batchSize = 10;
    for (let i = 0; i < expiredMemories.length; i += batchSize) {
      const batch = expiredMemories.slice(i, i + batchSize);

      await Promise.all(
        batch.map(id => this.demote(id, 'ttl_expired'))
      );

      console.log(`Demoted batch ${i / batchSize + 1}`);
    }

    return { demoted: expiredMemories.length };
  }

  async enforceSize Limit() {
    // Get current size
    const snapshot = await this.rtdb
      .ref('hot_memory/memories')
      .once('value');

    const memories = [];
    snapshot.forEach(child => {
      memories.push({
        id: child.key,
        ...child.val()
      });
    });

    // Calculate total size
    const totalSize = memories.reduce((sum, mem) => {
      return sum + JSON.stringify(mem).length;
    }, 0);

    const sizeLimit = 100 * 1024 * 1024; // 100MB

    if (totalSize < sizeLimit * 0.9) {
      console.log('Hot tier size OK');
      return { demoted: 0 };
    }

    console.log(`Hot tier size: ${totalSize} bytes, limit: ${sizeLimit}`);

    // Sort by score (lowest first)
    const scorer = new (require('./scoring'))();
    memories.forEach(mem => {
      mem.score = scorer.calculateHotScore(mem, null);
    });
    memories.sort((a, b) => a.score - b.score);

    // Demote until under threshold
    let currentSize = totalSize;
    let demoted = 0;

    for (const memory of memories) {
      if (currentSize < sizeLimit * 0.8) break;

      await this.demote(memory.id, 'size_limit');
      currentSize -= JSON.stringify(memory).length;
      demoted++;
    }

    console.log(`Demoted ${demoted} memories to enforce size limit`);

    return { demoted };
  }

  convertToFirestoreFormat(rtdbData) {
    return {
      id: rtdbData.id,
      content: rtdbData.content,
      type: rtdbData.type,
      userId: rtdbData.userId,
      createdAt: new Date(rtdbData.timestamp),
      updatedAt: new Date(),
      lastAccessed: new Date(rtdbData.lastAccessed),
      accessCount: rtdbData.accessCount,
      tags: rtdbData.tags || [],
      metadata: rtdbData.metadata || {},
      promotion: {
        eligibleForHot: false,
        hotScore: 0,
        lastPromotedAt: new Date(rtdbData.promotedAt),
        lastDemotedAt: new Date(),
        demotionReason: 'auto_demotion'
      }
    };
  }

  async trackDemotion(type, memoryId, reason) {
    await this.firestore
      .collection('sync_metrics')
      .add({
        type: type,
        memoryId: memoryId,
        reason: reason,
        timestamp: new Date()
      });
  }
}

module.exports = HotToWarmDemotion;
```

#### Warm → Cold Demotion

```javascript
// File: services/sync/warm-to-cold-demotion.js

class WarmToColdDemotion {
  constructor(firestore, github) {
    this.firestore = firestore;
    this.github = github;
  }

  async demote(memoryId, reason) {
    console.log(`Demoting ${memoryId} from warm to cold. Reason: ${reason}`);

    // 1. Fetch from Firestore
    const docRef = this.firestore.collection('memories').doc(memoryId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error(`Memory ${memoryId} not found in warm tier`);
    }

    const memory = { id: doc.id, ...doc.data() };

    // 2. Convert to Markdown
    const markdown = this.toMarkdown(memory);

    // 3. Determine file path
    const filePath = this.getGitHubPath(memory);

    // 4. Commit to GitHub
    const commit = await this.commitToGitHub(filePath, markdown, memory);

    // 5. Update Firestore with archival info
    await docRef.update({
      'archival.eligibleForCold': false,
      'archival.archivedInGitHub': true,
      'archival.githubPath': filePath,
      'archival.githubSha': commit.sha,
      'archival.archivedAt': new Date(),
      'archival.archivalReason': reason
    });

    // 6. Optionally remove from Firestore (keep metadata)
    // For now, we keep it in Firestore for search
    // Can delete after verification period

    return { success: true, memoryId, tier: 'cold', path: filePath };
  }

  toMarkdown(memory) {
    const yaml = require('js-yaml');

    const frontmatter = {
      id: memory.id,
      type: memory.type,
      userId: memory.userId,
      createdAt: memory.createdAt.toDate().toISOString(),
      updatedAt: memory.updatedAt.toDate().toISOString(),
      accessCount: memory.accessCount,
      lastAccessed: memory.lastAccessed.toDate().toISOString(),
      tags: memory.tags,
      entities: memory.entities,
      metadata: memory.metadata,
      embedding: memory.embedding,
      relationships: memory.relationships,
      promotion: memory.promotion,
      archival: {
        archivedAt: new Date().toISOString(),
        archivedBy: 'sync-service',
        verified: false
      }
    };

    return `---\n${yaml.dump(frontmatter)}---\n\n${memory.content}`;
  }

  getGitHubPath(memory) {
    const date = memory.createdAt.toDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `memories/${year}/${month}/${day}/${memory.type}-${memory.id}.md`;
  }

  async commitToGitHub(filePath, content, memory) {
    const owner = 'sartor';
    const repo = 'memories';
    const branch = 'main';

    // Check if file already exists
    let existingSha = null;
    try {
      const existing = await this.github.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branch
      });
      existingSha = existing.data.sha;
    } catch (error) {
      // File doesn't exist, that's OK
    }

    // Create or update file
    const result = await this.github.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `chore: archive memory ${memory.id}`,
      content: Buffer.from(content).toString('base64'),
      branch: branch,
      sha: existingSha
    });

    return result.data.content;
  }
}

module.exports = WarmToColdDemotion;
```

## Conflict Resolution

```javascript
// File: services/sync/conflict-resolution.js

class ConflictResolver {
  constructor(firestore) {
    this.firestore = firestore;
  }

  async resolveConflict(memoryId, tiers) {
    console.log(`Resolving conflict for ${memoryId} across tiers:`, tiers);

    // Fetch all versions
    const versions = await this.fetchAllVersions(memoryId, tiers);

    if (versions.length === 0) {
      throw new Error(`No versions found for ${memoryId}`);
    }

    if (versions.length === 1) {
      return { resolved: true, winner: versions[0] };
    }

    // Conflict resolution strategy: Last-Write-Wins with version check
    const sorted = versions.sort((a, b) => {
      // First, sort by version number
      if (a.version !== b.version) {
        return b.version - a.version;
      }
      // Then by update timestamp
      return b.updatedAt - a.updatedAt;
    });

    const winner = sorted[0];
    const losers = sorted.slice(1);

    // Check if this is a true conflict (versions diverged)
    const isDivergent = losers.some(loser =>
      loser.version === winner.version &&
      loser.contentHash !== winner.contentHash
    );

    if (isDivergent) {
      // Manual review required
      await this.queueManualReview(memoryId, versions);
      return {
        resolved: false,
        requiresManualReview: true,
        versions
      };
    }

    // Auto-resolve: propagate winner to all tiers
    await this.propagateVersion(winner, tiers);

    return { resolved: true, winner };
  }

  async fetchAllVersions(memoryId, tiers) {
    const versions = [];

    if (tiers.includes('hot')) {
      const hot = await this.fetchHotVersion(memoryId);
      if (hot) versions.push({ ...hot, tier: 'hot' });
    }

    if (tiers.includes('warm')) {
      const warm = await this.fetchWarmVersion(memoryId);
      if (warm) versions.push({ ...warm, tier: 'warm' });
    }

    if (tiers.includes('cold')) {
      const cold = await this.fetchColdVersion(memoryId);
      if (cold) versions.push({ ...cold, tier: 'cold' });
    }

    return versions;
  }

  async queueManualReview(memoryId, versions) {
    await this.firestore
      .collection('conflict_queue')
      .doc(memoryId)
      .set({
        memoryId,
        versions,
        queuedAt: new Date(),
        status: 'pending',
        priority: this.calculatePriority(versions)
      });
  }

  calculatePriority(versions) {
    // Higher access count = higher priority
    const maxAccess = Math.max(...versions.map(v => v.accessCount || 0));
    return Math.min(10, Math.floor(maxAccess / 10));
  }

  async propagateVersion(winner, tiers) {
    const promises = [];

    if (tiers.includes('hot') && winner.tier !== 'hot') {
      promises.push(this.updateHotTier(winner));
    }

    if (tiers.includes('warm') && winner.tier !== 'warm') {
      promises.push(this.updateWarmTier(winner));
    }

    if (tiers.includes('cold') && winner.tier !== 'cold') {
      promises.push(this.updateColdTier(winner));
    }

    await Promise.all(promises);
  }
}

module.exports = ConflictResolver;
```

## Background Sync Scheduling

```javascript
// File: services/sync/scheduler.js

class SyncScheduler {
  constructor(services) {
    this.hotDemotion = services.hotDemotion;
    this.warmDemotion = services.warmDemotion;
    this.coldPromotion = services.coldPromotion;
    this.warmPromotion = services.warmPromotion;
  }

  // Schedule all background jobs
  scheduleAll() {
    // Hourly: Hot tier cleanup
    this.scheduleHourly(() => this.hotTierMaintenance());

    // Every 6 hours: Warm tier evaluation
    this.scheduleEvery(6 * 60 * 60 * 1000, () => this.warmTierEvaluation());

    // Daily: Cold consolidation
    this.scheduleDaily(() => this.coldConsolidation());

    // Weekly: Embedding regeneration
    this.scheduleWeekly(() => this.regenerateEmbeddings());

    // Monthly: Archive old memories
    this.scheduleMonthly(() => this.archiveOldMemories());
  }

  async hotTierMaintenance() {
    console.log('Running hot tier maintenance...');

    // Clean up expired memories
    const { demoted: expiredCount } = await this.hotDemotion.cleanupExpired();

    // Enforce size limit
    const { demoted: sizeCount } = await this.hotDemotion.enforceSizeLimit();

    console.log(`Hot tier maintenance complete. Demoted: ${expiredCount + sizeCount}`);

    return { expiredCount, sizeCount };
  }

  async warmTierEvaluation() {
    console.log('Evaluating warm tier for promotions/demotions...');

    // Find candidates for hot promotion
    const hotCandidates = await this.findHotCandidates();
    for (const candidate of hotCandidates.slice(0, 20)) {
      await this.warmPromotion.promote(candidate.id, 'high_access_frequency');
    }

    // Find candidates for cold demotion
    const coldCandidates = await this.findColdCandidates();
    for (const candidate of coldCandidates.slice(0, 50)) {
      await this.warmDemotion.demote(candidate.id, 'low_access_old_age');
    }

    console.log(`Promoted ${hotCandidates.length} to hot, demoted ${coldCandidates.length} to cold`);
  }

  async coldConsolidation() {
    console.log('Running cold tier consolidation...');

    // This would trigger the GitHub Actions workflow
    // For now, just log
    console.log('Cold consolidation scheduled via GitHub Actions');
  }

  async regenerateEmbeddings() {
    console.log('Regenerating stale embeddings...');

    const embeddingService = require('./embedding-service');
    const result = await embeddingService.updateStaleEmbeddings();

    console.log(`Regenerated ${result.updated} embeddings`);
  }

  async archiveOldMemories() {
    console.log('Archiving old memories...');

    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

    // Archive memories older than 1 year with low access
    const oldMemories = await this.firestore
      .collection('memories')
      .where('createdAt', '<', cutoffDate)
      .where('accessCount', '<', 5)
      .limit(100)
      .get();

    for (const doc of oldMemories.docs) {
      await this.warmDemotion.demote(doc.id, 'age_based_archival');
    }

    console.log(`Archived ${oldMemories.docs.length} old memories`);
  }

  // Scheduling helpers
  scheduleHourly(fn) {
    setInterval(fn, 60 * 60 * 1000);
    fn(); // Run immediately
  }

  scheduleEvery(ms, fn) {
    setInterval(fn, ms);
    fn();
  }

  scheduleDaily(fn) {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 2, 0, 0);
    const msUntilTomorrow = tomorrow - now;

    setTimeout(() => {
      fn();
      setInterval(fn, 24 * 60 * 60 * 1000);
    }, msUntilTomorrow);
  }

  scheduleWeekly(fn) {
    this.scheduleEvery(7 * 24 * 60 * 60 * 1000, fn);
  }

  scheduleMonthly(fn) {
    const runMonthly = () => {
      fn();

      // Schedule next run
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 3, 0, 0);
      const ms = next - now;

      setTimeout(runMonthly, ms);
    };

    runMonthly();
  }
}

module.exports = SyncScheduler;
```
