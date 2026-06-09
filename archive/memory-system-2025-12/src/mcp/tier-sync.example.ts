/**
 * TierSync Service - Usage Examples
 *
 * This file demonstrates how to use the multi-tier synchronization service
 * to manage memory promotion and demotion across hot/warm/cold storage tiers.
 */

import { createTierSyncService, DemotionCriteria } from './tier-sync';

// ============================================================================
// Example 1: Basic Setup
// ============================================================================

async function basicSetup() {
  // Create sync service with default configuration
  const syncService = createTierSyncService();

  // Get initial stats
  const stats = syncService.getStats();
  console.log('Initial stats:', stats);
}

// ============================================================================
// Example 2: Configure with All Tiers
// ============================================================================

async function configureAllTiers() {
  // Create sync service with Firebase (hot) and GitHub (cold) enabled
  const syncService = createTierSyncService({
    useFirebase: true,
    useGitHub: true,
    github: {
      token: process.env.GITHUB_TOKEN!,
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      basePath: 'memories',
    },
  });

  console.log('TierSync configured with all tiers');
}

// ============================================================================
// Example 3: Manual Promotion
// ============================================================================

async function manualPromotion() {
  const syncService = createTierSyncService({ useFirebase: true });

  // Manually promote specific memories to hot tier
  const memoryIds = ['mem_123', 'mem_456', 'mem_789'];
  await syncService.promoteToHot(memoryIds);

  console.log(`Promoted ${memoryIds.length} memories to hot tier`);
}

// ============================================================================
// Example 4: Manual Demotion with Custom Criteria
// ============================================================================

async function manualDemotion() {
  const syncService = createTierSyncService({ useGitHub: true });

  // Define custom demotion criteria
  const criteria: DemotionCriteria = {
    maxAge: 14, // Demote memories not accessed for 14 days
    maxImportance: 0.3, // Only demote if importance < 0.3
    excludeTags: ['permanent', 'critical', 'system'], // Never demote these
  };

  // Execute demotion
  const demotedCount = await syncService.demoteToCold(criteria);
  console.log(`Demoted ${demotedCount} memories to cold tier`);
}

// ============================================================================
// Example 5: Automated Sync Cycle
// ============================================================================

async function automatedSyncCycle() {
  const syncService = createTierSyncService({
    useFirebase: true,
    useGitHub: true,
    github: {
      token: process.env.GITHUB_TOKEN!,
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
    },
  });

  // Run full sync cycle (promotions + demotions)
  const report = await syncService.runSyncCycle();

  console.log('Sync Cycle Complete:');
  console.log(`  Promotions to hot: ${report.promotions.toHot}`);
  console.log(`  Promotions to warm: ${report.promotions.toWarm}`);
  console.log(`  Demotions to warm: ${report.demotions.toWarm}`);
  console.log(`  Demotions to cold: ${report.demotions.toCold}`);
  console.log(`  Errors: ${report.errors.length}`);

  if (report.errors.length > 0) {
    console.log('Errors encountered:');
    report.errors.forEach((err) => {
      console.log(`  - ${err.memoryId}: ${err.error}`);
    });
  }

  // Get updated stats
  const stats = syncService.getStats();
  console.log('\nCumulative Stats:');
  console.log(`  Total syncs: ${stats.totalSyncs}`);
  console.log(`  Total promotions: ${stats.totalPromotions}`);
  console.log(`  Total demotions: ${stats.totalDemotions}`);
  console.log(`  Last sync: ${stats.lastSync}`);
}

// ============================================================================
// Example 6: Periodic Sync with Scheduler
// ============================================================================

async function periodicSync() {
  const syncService = createTierSyncService({
    useFirebase: true,
    useGitHub: true,
  });

  // Run sync every 1 hour
  const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  console.log(`Starting periodic sync (every ${SYNC_INTERVAL_MS / 1000 / 60} minutes)`);

  setInterval(async () => {
    console.log('[Scheduler] Running sync cycle...');
    const report = await syncService.runSyncCycle();
    console.log('[Scheduler] Sync complete:', {
      promotions: report.promotions.toHot + report.promotions.toWarm,
      demotions: report.demotions.toWarm + report.demotions.toCold,
      errors: report.errors.length,
    });
  }, SYNC_INTERVAL_MS);
}

// ============================================================================
// Example 7: Conservative Demotion (Preserve Important Data)
// ============================================================================

async function conservativeDemotion() {
  const syncService = createTierSyncService({ useGitHub: true });

  // Very conservative criteria - only archive very old, very unimportant data
  const criteria: DemotionCriteria = {
    maxAge: 30, // 30 days
    maxImportance: 0.2, // importance < 0.2 (very low)
    excludeTags: [
      'permanent',
      'critical',
      'system',
      'user-favorite',
      'high-value',
    ],
  };

  const demotedCount = await syncService.demoteToCold(criteria);
  console.log(`Conservative demotion: ${demotedCount} memories archived`);
}

// ============================================================================
// Example 8: Aggressive Cleanup (Free Up Space)
// ============================================================================

async function aggressiveCleanup() {
  const syncService = createTierSyncService({ useGitHub: true });

  // Aggressive criteria - archive older, less important data
  const criteria: DemotionCriteria = {
    maxAge: 3, // 3 days
    maxImportance: 0.6, // importance < 0.6
    excludeTags: ['permanent', 'critical'], // Only protect critical data
  };

  const demotedCount = await syncService.demoteToCold(criteria);
  console.log(`Aggressive cleanup: ${demotedCount} memories archived`);
}

// ============================================================================
// Example 9: Monitor Sync Health
// ============================================================================

async function monitorSyncHealth() {
  const syncService = createTierSyncService();

  // Run sync and analyze results
  const report = await syncService.runSyncCycle();
  const stats = syncService.getStats();

  // Check for issues
  const hasErrors = report.errors.length > 0;
  const syncEfficiency =
    stats.totalSyncs > 0
      ? (stats.totalPromotions + stats.totalDemotions) / stats.totalSyncs
      : 0;

  console.log('Sync Health Report:');
  console.log(`  Status: ${hasErrors ? 'UNHEALTHY' : 'HEALTHY'}`);
  console.log(`  Error count: ${report.errors.length}`);
  console.log(`  Sync efficiency: ${syncEfficiency.toFixed(2)} operations/sync`);
  console.log(`  Last successful sync: ${stats.lastSync || 'Never'}`);

  if (hasErrors) {
    console.log('\nAction Required: Investigate sync errors');
  }
}

// ============================================================================
// Example 10: Integration with MCP Server
// ============================================================================

async function mcpServerIntegration() {
  // This would typically be in your MCP server initialization

  const syncService = createTierSyncService({
    useFirebase: true,
    useGitHub: true,
  });

  // Run initial sync on server startup
  console.log('[MCP Server] Running initial sync...');
  await syncService.runSyncCycle();

  // Schedule periodic syncs
  const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes
  setInterval(() => {
    syncService.runSyncCycle().catch((err) => {
      console.error('[MCP Server] Sync failed:', err);
    });
  }, SYNC_INTERVAL);

  console.log('[MCP Server] TierSync initialized and scheduled');
}

// ============================================================================
// Export examples for reference
// ============================================================================

export const examples = {
  basicSetup,
  configureAllTiers,
  manualPromotion,
  manualDemotion,
  automatedSyncCycle,
  periodicSync,
  conservativeDemotion,
  aggressiveCleanup,
  monitorSyncHealth,
  mcpServerIntegration,
};

// ============================================================================
// CLI Runner (for testing examples)
// ============================================================================

if (require.main === module) {
  const exampleName = process.argv[2];

  if (!exampleName || !(exampleName in examples)) {
    console.log('Usage: ts-node tier-sync.example.ts <example-name>');
    console.log('\nAvailable examples:');
    Object.keys(examples).forEach((name) => {
      console.log(`  - ${name}`);
    });
    process.exit(1);
  }

  const exampleFn = examples[exampleName as keyof typeof examples];
  exampleFn()
    .then(() => {
      console.log('\nExample completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\nExample failed:', err);
      process.exit(1);
    });
}
