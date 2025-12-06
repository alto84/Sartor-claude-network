# Cost Analysis & Optimization

## Monthly Cost Breakdown

### Tier 1: Hot Memory (Firebase Realtime Database)

**Pricing Model:**
- Storage: $5/GB/month
- Downloads: $1/GB
- Reads: $0.36 per 100K operations
- Writes: $1.08 per 100K operations

**Expected Usage (Medium Scale):**
```
Storage:      100 MB  × $5/GB       = $0.50/month
Downloads:    5 GB    × $1/GB       = $5.00/month
Reads:        1M ops  × $0.36/100K  = $3.60/month
Writes:       500K    × $1.08/100K  = $5.40/month
────────────────────────────────────────────────
Total Hot Tier:                      $14.50/month
```

**Optimization Strategies:**
1. Aggressive TTL policies (6-hour default)
2. Size limit enforcement (100MB max)
3. Batch writes where possible
4. Cache frequently read data client-side
5. Use OnDisconnect() for cleanup

**Cost vs Scale:**
```
Users         Storage    Ops/month   Cost/month
─────────────────────────────────────────────
100           50 MB      500K        $8
1,000         100 MB     2M          $20
10,000        100 MB     10M         $80
100,000       100 MB     50M         $320
```

---

### Tier 2: Warm Memory (Firestore + Vector DB)

#### Firestore

**Pricing Model:**
- Storage: $0.18/GB/month
- Reads: $0.36 per 100K documents
- Writes: $1.08 per 100K documents
- Deletes: $0.02 per 100K documents

**Expected Usage (Medium Scale):**
```
Storage:      10 GB   × $0.18/GB       = $1.80/month
Reads:        5M docs × $0.36/100K     = $18.00/month
Writes:       1M docs × $1.08/100K     = $10.80/month
Deletes:      100K    × $0.02/100K     = $0.02/month
────────────────────────────────────────────────
Total Firestore:                        $30.62/month
```

#### Pinecone (Vector Database)

**Pricing Model:**
- s1.x1 pod: $70/month (100K vectors)
- s1.x2 pod: $140/month (500K vectors)
- s1.x4 pod: $280/month (2M vectors)

**Expected Usage:**
```
Starter:      s1.x1 (100K vectors)    = $70/month
Growth:       s1.x2 (500K vectors)    = $140/month
Scale:        s1.x4 (2M vectors)      = $280/month
────────────────────────────────────────────────
Total Pinecone (Starter):               $70/month
```

**Alternative: Weaviate (Self-hosted)**
```
Cloud Server: 8GB RAM, 4 vCPU          = $40/month
Storage:      100 GB SSD               = $10/month
────────────────────────────────────────────────
Total Weaviate:                         $50/month
```

**Alternative: Qdrant (Managed)**
```
1GB cluster:  1M vectors               = $25/month
4GB cluster:  4M vectors               = $95/month
────────────────────────────────────────────────
Total Qdrant (1GB):                     $25/month
```

**Warm Tier Total (Firestore + Qdrant):**
```
$30.62 + $25 = $55.62/month
```

---

### Tier 3: Cold Memory (GitHub)

**Pricing Model:**
- Free for public repositories
- Private: $4/month (unlimited storage)
- GitHub Actions: 2,000 minutes/month free
- Additional: $0.008/minute

**Expected Usage:**
```
Repository:   Private                  = $4.00/month
Actions:      500 minutes              = $0.00/month (within free tier)
Storage:      Unlimited                = $0.00/month
────────────────────────────────────────────────
Total Cold Tier:                        $4.00/month
```

---

### Embedding Generation (OpenAI)

**Pricing Model:**
- text-embedding-3-small: $0.020 per 1M tokens
- text-embedding-3-large: $0.130 per 1M tokens

**Expected Usage (text-embedding-3-small):**
```
Initial batch:    10K memories × 500 tokens = 5M tokens
Monthly updates:  1K memories × 500 tokens  = 500K tokens

Initial:          5M tokens × $0.020/1M     = $0.10
Monthly:          500K × $0.020/1M          = $0.01/month
────────────────────────────────────────────────
Total Embeddings:                           $0.01/month (after initial)
```

---

### Total Monthly Cost Summary

**Starter Configuration (100-1,000 users):**
```
Hot Tier (Firebase RTDB):               $15/month
Warm Tier (Firestore + Qdrant):         $56/month
Cold Tier (GitHub):                     $4/month
Embeddings (OpenAI):                    $0.01/month
────────────────────────────────────────────────
TOTAL:                                  $75/month
```

**Growth Configuration (1,000-10,000 users):**
```
Hot Tier (Firebase RTDB):               $50/month
Warm Tier (Firestore + Qdrant 4GB):    $126/month
Cold Tier (GitHub):                     $4/month
Embeddings (OpenAI):                    $0.05/month
────────────────────────────────────────────────
TOTAL:                                  $180/month
```

**Scale Configuration (10,000+ users):**
```
Hot Tier (Firebase RTDB):               $200/month
Warm Tier (Firestore + Pinecone s1.x4): $311/month
Cold Tier (GitHub):                     $4/month
Embeddings (OpenAI):                    $0.20/month
────────────────────────────────────────────────
TOTAL:                                  $515/month
```

---

## Cost Optimization Strategies

### 1. Hot Tier Optimization

**Aggressive TTL Policies:**
```javascript
const TTL_CONFIG = {
  sessions: 6 * 60 * 60 * 1000,      // 6 hours (instead of 24)
  memories: 3 * 60 * 60 * 1000,      // 3 hours (instead of 6)
  cache: 30 * 60 * 1000              // 30 minutes (instead of 1 hour)
};

// Potential savings: -40% on storage and reads
// Impact on cost: $14.50 → $8.70/month
```

**Size-based Eviction:**
```javascript
const SIZE_LIMITS = {
  maxHotTierSize: 50 * 1024 * 1024,  // 50MB (instead of 100MB)
  evictionThreshold: 0.85             // Evict at 85% (instead of 90%)
};

// Potential savings: -50% on storage
// Impact on cost: $14.50 → $11.00/month
```

**Batch Operations:**
```javascript
// Instead of:
for (const memory of memories) {
  await db.ref('memories').child(memory.id).set(memory);
  // Cost: 100 write ops
}

// Use:
await db.ref('memories').update(
  Object.fromEntries(memories.map(m => [m.id, m]))
);
// Cost: 1 write op

// Potential savings: -90% on writes
// Impact on cost: $5.40 → $0.54/month
```

### 2. Warm Tier Optimization

**Selective Embedding Storage:**
```javascript
// Don't store embeddings in Firestore (1536 floats × 4 bytes = 6KB per doc)
// Only store embedding reference

// Before:
{
  content: "...",
  embedding: [0.123, -0.456, ...],  // 6KB
  // Total doc size: ~8KB
}

// After:
{
  content: "...",
  embeddingId: "emb_001",           // 20 bytes
  // Total doc size: ~2KB
}

// Savings: -75% on storage
// Impact: $1.80 → $0.45/month
```

**Lazy Embedding Generation:**
```javascript
// Generate embeddings on-demand instead of immediately
// Only for memories that will be searched

// Before: 1000 memories/day × $0.020/1M tokens = $0.01/day
// After: 200 searched memories/day × $0.020/1M = $0.002/day

// Savings: -80% on embedding costs
// Impact: $0.30/month → $0.06/month
```

**Vector Database Choice:**
```
Pinecone s1.x1:   $70/month  (100K vectors, managed)
Qdrant 1GB:       $25/month  (1M vectors, managed)
Weaviate self:    $50/month  (unlimited, self-hosted)

Recommendation: Qdrant for best cost/performance
Savings: $45/month vs Pinecone
```

### 3. Cold Tier Optimization

**Compression:**
```javascript
// Compress old embeddings
// Before: 1536 floats × 4 bytes = 6KB per embedding
// After: gzip compressed = ~1.5KB per embedding

// Impact: GitHub storage unlimited, but reduces clone time
```

**Archival Frequency:**
```javascript
// Instead of daily consolidation:
const ARCHIVAL_POLICY = {
  frequency: 'weekly',              // Weekly instead of daily
  minAccessCount: 10,               // Only archive if <10 accesses
  minAge: 90 * 24 * 60 * 60 * 1000 // 90 days instead of 30
};

// Savings: -70% on GitHub Actions minutes
// Impact: Stays within free tier
```

### 4. Overall Architecture Optimization

**Tiering Thresholds:**
```javascript
const PROMOTION_THRESHOLDS = {
  coldToWarm: {
    minAccessCount: 5,      // Increase from 3
    minRecency: 48          // Increase from 24 hours
  },
  warmToHot: {
    minAccessCount: 20,     // Increase from 10
    minRecency: 12          // Decrease to 12 hours
  }
};

// Result: Fewer promotions = less storage in expensive tiers
// Estimated savings: -30% overall
```

**Caching Strategy:**
```javascript
// Client-side caching reduces read operations
const CACHE_CONFIG = {
  enabled: true,
  ttl: 5 * 60 * 1000,       // 5 minutes
  maxSize: 50               // 50 memories per client
};

// Savings: -50% on Firestore reads
// Impact: $18.00 → $9.00/month
```

---

## Cost Projections

### Optimized Starter Configuration
```
Hot Tier (optimized):                   $8/month
Warm Tier (Firestore + Qdrant):         $35/month
Cold Tier (GitHub):                     $4/month
Embeddings (lazy):                      $0.01/month
────────────────────────────────────────────────
TOTAL:                                  $47/month
Savings vs baseline:                    -37%
```

### Cost per User
```
100 users:      $47 / 100    = $0.47/user/month
1,000 users:    $95 / 1,000  = $0.095/user/month
10,000 users:   $350 / 10,000 = $0.035/user/month
```

### Break-even Analysis
```
Development cost:     $10,000 (one-time)
Monthly operating:    $47-$350/month

If charging $5/user/month:
- 100 users:  $500/month revenue → 20 months to break even
- 1,000 users: $5,000/month revenue → 2 months to break even
- 10,000 users: $50,000/month revenue → <1 month to break even
```

---

## Monitoring & Alerts

```javascript
// Cost monitoring thresholds
const COST_ALERTS = {
  daily: {
    warning: 3,    // $3/day
    critical: 5    // $5/day
  },
  monthly: {
    warning: 75,   // $75/month
    critical: 100  // $100/month
  }
};

// Set up Cloud Monitoring alerts
async function setupCostAlerts() {
  // Monitor Firebase usage
  await monitoring.createAlert({
    metric: 'firebase.database.network.sent_bytes',
    threshold: 5 * 1024 * 1024 * 1024, // 5GB/day
    notification: 'email@example.com'
  });

  // Monitor Firestore reads
  await monitoring.createAlert({
    metric: 'firestore.document_reads',
    threshold: 2000000, // 2M reads/day
    notification: 'email@example.com'
  });
}
```

---

## Recommendations

1. **Start with optimized configuration**: $47/month
2. **Use Qdrant instead of Pinecone**: Save $45/month
3. **Implement client-side caching**: Save 50% on reads
4. **Aggressive TTL policies**: Save 40% on hot storage
5. **Lazy embedding generation**: Save 80% on embedding costs
6. **Weekly archival**: Stay within GitHub free tier

**Total potential savings: 50-60% vs baseline**
