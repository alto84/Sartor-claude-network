# Multi-Tier Synchronization System

## Overview

The `tier-sync.ts` module implements automatic promotion and demotion of memories across three storage tiers based on access patterns, age, and importance scores.

## Storage Tiers

| Tier | Backend | Latency | Use Case |
|------|---------|---------|----------|
| **Hot** | Firebase Realtime Database | <100ms | Frequently accessed memories |
| **Warm** | File-based storage | <500ms | Moderate access, default tier |
| **Cold** | GitHub repository | 1-5s | Archival, long-term storage |

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   TierSync Service                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐      ┌──────────────┐              │
│  │  Promotion  │      │  Demotion    │              │
│  │   Logic     │      │    Logic     │              │
│  └─────────────┘      └──────────────┘              │
│        │                     │                       │
│        v                     v                       │
│  ┌──────────────────────────────────────┐           │
│  │         Sync Cycle Coordinator        │           │
│  └──────────────────────────────────────┘           │
│                      │                               │
└──────────────────────┼───────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         v             v             v
    ┌────────┐   ┌─────────┐   ┌─────────┐
    │Firebase│   │  File   │   │ GitHub  │
    │  (Hot) │   │ (Warm)  │   │ (Cold)  │
    └────────┘   └─────────┘   └─────────┘
```

## Promotion Rules

### Warm → Hot

**Condition**: Memory accessed **3+ times** within **24 hours**

**Logic**:
```typescript
if (memory.access_count >= 3 && lastAccess within 24h) {
  promote to hot tier
}
```

**Example**:
- Memory created at 9:00 AM
- Accessed at 10:00 AM, 11:30 AM, 2:00 PM
- Next sync cycle: Promoted to hot tier (Firebase)

### Hot → Warm

**Condition**: Memory not accessed for **1 hour**

**Logic**:
```typescript
if (memory.last_accessed < 1 hour ago || !memory.last_accessed) {
  demote to warm tier
}
```

**Example**:
- Memory in hot tier, last accessed at 1:00 PM
- Current time: 2:30 PM
- Next sync cycle: Demoted to warm tier (file storage)

## Demotion Rules

### Warm → Cold

**Conditions** (ALL must be true):
1. Memory not accessed for **7 days**
2. Importance score **< 0.5**
3. Not tagged with protected tags

**Protected Tags** (never demoted):
- `permanent`
- `critical`

**Logic**:
```typescript
if (
  memory.last_accessed < 7 days ago &&
  memory.importance_score < 0.5 &&
  !hasProtectedTags(memory.tags)
) {
  demote to cold tier
}
```

**Example**:
- Memory created 30 days ago
- Last accessed: 10 days ago
- Importance: 0.3
- Tags: `["general", "logs"]`
- Next sync cycle: Demoted to cold tier (GitHub)

## Usage

### Basic Setup

```typescript
import { createTierSyncService } from './tier-sync';

const syncService = createTierSyncService({
  useFirebase: true,
  useGitHub: true,
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    basePath: 'memories'
  }
});
```

### Manual Promotion

```typescript
// Promote specific memories to hot tier
await syncService.promoteToHot([
  'mem_123',
  'mem_456',
  'mem_789'
]);
```

### Manual Demotion

```typescript
// Demote old/unimportant memories to cold tier
const demotedCount = await syncService.demoteToCold({
  maxAge: 14,              // 14 days
  maxImportance: 0.3,      // importance < 0.3
  excludeTags: ['permanent', 'critical', 'favorite']
});

console.log(`Demoted ${demotedCount} memories`);
```

### Automated Sync Cycle

```typescript
// Run full sync cycle (promotions + demotions)
const report = await syncService.runSyncCycle();

console.log('Sync Report:');
console.log(`  Promotions to hot: ${report.promotions.toHot}`);
console.log(`  Demotions to warm: ${report.demotions.toWarm}`);
console.log(`  Demotions to cold: ${report.demotions.toCold}`);
console.log(`  Errors: ${report.errors.length}`);
```

### Get Statistics

```typescript
const stats = syncService.getStats();

console.log('Sync Statistics:');
console.log(`  Last sync: ${stats.lastSync}`);
console.log(`  Total syncs: ${stats.totalSyncs}`);
console.log(`  Total promotions: ${stats.totalPromotions}`);
console.log(`  Total demotions: ${stats.totalDemotions}`);
```

### Periodic Sync Schedule

```typescript
// Run sync every 30 minutes
const SYNC_INTERVAL = 30 * 60 * 1000;

setInterval(async () => {
  const report = await syncService.runSyncCycle();
  console.log('Sync complete:', report);
}, SYNC_INTERVAL);
```

## Customization

### Custom Promotion Thresholds

Edit constants in `tier-sync.ts`:

```typescript
const PROMOTION_THRESHOLDS = {
  HOT_ACCESS_COUNT: 3,           // Change to 5 for stricter promotion
  HOT_ACCESS_WINDOW_MS: 24 * 60 * 60 * 1000,  // Change to 12h for faster promotion
  WARM_IDLE_TIME_MS: 60 * 60 * 1000,          // Change to 2h for slower demotion
};
```

### Custom Demotion Thresholds

```typescript
const DEMOTION_THRESHOLDS = {
  COLD_MAX_AGE_DAYS: 7,          // Change to 30 for longer retention
  COLD_MAX_IMPORTANCE: 0.5,      // Change to 0.3 for stricter demotion
  PROTECTED_TAGS: ['permanent', 'critical', 'favorite'],  // Add more tags
};
```

### Custom Demotion Criteria at Runtime

```typescript
const criteria: DemotionCriteria = {
  maxAge: 30,                    // Days
  maxImportance: 0.4,            // Threshold
  excludeTags: ['permanent', 'critical', 'system', 'user-favorite']
};

await syncService.demoteToCold(criteria);
```

## Integration with MCP Server

Add tier sync to your MCP server initialization:

```typescript
import { createTierSyncService } from './tier-sync';

// In server initialization
const syncService = createTierSyncService({
  useFirebase: true,
  useGitHub: true
});

// Run initial sync
await syncService.runSyncCycle();

// Schedule periodic syncs
setInterval(() => {
  syncService.runSyncCycle().catch(err => {
    console.error('[MCP] Sync failed:', err);
  });
}, 30 * 60 * 1000);  // Every 30 minutes
```

## Monitoring

### Sync Reports

Each sync cycle returns a detailed report:

```typescript
interface SyncReport {
  promotions: {
    toHot: number;      // Memories promoted to hot tier
    toWarm: number;     // Memories promoted to warm tier
  };
  demotions: {
    toWarm: number;     // Memories demoted from hot to warm
    toCold: number;     // Memories demoted from warm to cold
  };
  errors: Array<{
    memoryId: string;
    error: string;
  }>;
  timestamp: string;
}
```

### Statistics Tracking

Cumulative statistics are maintained:

```typescript
interface SyncStats {
  lastSync: string | null;      // ISO timestamp of last sync
  totalSyncs: number;            // Total sync cycles run
  totalPromotions: number;       // Total promotions across all syncs
  totalDemotions: number;        // Total demotions across all syncs
  lastReport: SyncReport | null; // Most recent sync report
}
```

## Performance Considerations

### Hot Tier Capacity

- Firebase has practical limits on concurrent connections
- Recommend keeping hot tier under 1000 memories
- Aggressive demotion of idle memories prevents bloat

### Cold Tier Rate Limits

- GitHub API has rate limits (5000 requests/hour for authenticated users)
- Batch cold tier operations when possible
- Consider running cold demotions during off-peak hours

### Sync Frequency

Recommended intervals based on workload:

| Workload | Sync Interval | Rationale |
|----------|---------------|-----------|
| Low | 1-2 hours | Minimize API calls |
| Medium | 30-60 minutes | Balance freshness and overhead |
| High | 15-30 minutes | Keep tiers optimized |
| Critical | 5-10 minutes | Real-time optimization (requires careful rate limit management) |

## Error Handling

The sync service handles errors gracefully:

1. **Firebase unavailable**: Skips hot tier operations, continues with warm/cold
2. **GitHub unavailable**: Skips cold tier operations, continues with hot/warm
3. **Memory not found**: Logs warning, continues processing other memories
4. **Network errors**: Retries with exponential backoff (configured in backend clients)

All errors are captured in the sync report:

```typescript
if (report.errors.length > 0) {
  console.error('Sync errors encountered:');
  report.errors.forEach(err => {
    console.error(`  ${err.memoryId}: ${err.error}`);
  });
}
```

## Testing

### Unit Tests

```bash
npm test src/mcp/tier-sync.test.ts
```

### Integration Tests

Requires actual backends configured:

```bash
# Set environment variables
export FIREBASE_CONFIG='{...}'
export GITHUB_TOKEN='ghp_...'
export GITHUB_OWNER='your-org'
export GITHUB_REPO='your-repo'

# Run integration tests
npm test src/mcp/tier-sync.test.ts -- --runInBand
```

### Example Scenarios

```bash
# Run specific example
ts-node src/mcp/tier-sync.example.ts automatedSyncCycle

# Run all examples
for example in basicSetup manualPromotion manualDemotion; do
  ts-node src/mcp/tier-sync.example.ts $example
done
```

## Files

| File | Purpose |
|------|---------|
| `tier-sync.ts` | Core implementation |
| `tier-sync.test.ts` | Unit and integration tests |
| `tier-sync.example.ts` | Usage examples and patterns |
| `TIER_SYNC_README.md` | This documentation |

## Related Modules

- `multi-tier-store.ts` - Multi-tier memory store (uses tier-sync internally)
- `file-store.ts` - Warm tier implementation
- `firebase-init.ts` - Hot tier initialization
- `../memory/cold-tier.ts` - Cold tier (GitHub) implementation

## Future Enhancements

Potential improvements for future iterations:

1. **Machine Learning**: Predict access patterns, preemptive promotion
2. **Cost Optimization**: Balance tier costs vs. latency requirements
3. **Compression**: Compress old memories before cold tier archival
4. **Deduplication**: Detect and merge duplicate memories
5. **Analytics**: Dashboard for tier distribution and sync efficiency
6. **A/B Testing**: Compare different promotion/demotion thresholds
