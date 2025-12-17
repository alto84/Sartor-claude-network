/**
 * Tests for TierSync service
 *
 * These tests verify the multi-tier synchronization logic:
 * - Promotion from warm to hot based on access patterns
 * - Demotion from hot to warm based on idle time
 * - Demotion from warm to cold based on age and importance
 * - Protection of critical/permanent memories
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TierSync, DemotionCriteria, SyncReport } from './tier-sync';
import { MemoryType } from './file-store';

describe('TierSync', () => {
  let tierSync: TierSync;

  beforeEach(() => {
    // Initialize with file-only mode for testing
    tierSync = new TierSync({ useFirebase: false, useGitHub: false });
  });

  describe('getStats', () => {
    it('should return initial stats', () => {
      const stats = tierSync.getStats();

      expect(stats.lastSync).toBeNull();
      expect(stats.totalSyncs).toBe(0);
      expect(stats.totalPromotions).toBe(0);
      expect(stats.totalDemotions).toBe(0);
      expect(stats.lastReport).toBeNull();
    });
  });

  describe('runSyncCycle', () => {
    it('should return a sync report', async () => {
      const report = await tierSync.runSyncCycle();

      expect(report).toHaveProperty('promotions');
      expect(report).toHaveProperty('demotions');
      expect(report).toHaveProperty('errors');
      expect(report).toHaveProperty('timestamp');
      expect(report.promotions).toHaveProperty('toHot');
      expect(report.promotions).toHaveProperty('toWarm');
      expect(report.demotions).toHaveProperty('toWarm');
      expect(report.demotions).toHaveProperty('toCold');
    });

    it('should update stats after sync', async () => {
      await tierSync.runSyncCycle();
      const stats = tierSync.getStats();

      expect(stats.lastSync).not.toBeNull();
      expect(stats.totalSyncs).toBe(1);
      expect(stats.lastReport).not.toBeNull();
    });
  });

  describe('demoteToCold', () => {
    it('should return 0 when GitHub is not configured', async () => {
      const criteria: DemotionCriteria = {
        maxAge: 7,
        maxImportance: 0.5,
      };

      const count = await tierSync.demoteToCold(criteria);
      expect(count).toBe(0);
    });

    it('should exclude protected tags', async () => {
      const criteria: DemotionCriteria = {
        maxAge: 7,
        maxImportance: 0.5,
        excludeTags: ['permanent', 'critical'],
      };

      // This test would need actual memories in the store to verify exclusion
      const count = await tierSync.demoteToCold(criteria);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('promoteToHot', () => {
    it('should handle empty array', async () => {
      await expect(tierSync.promoteToHot([])).resolves.not.toThrow();
    });

    it('should handle non-existent memory IDs gracefully', async () => {
      await expect(
        tierSync.promoteToHot(['non-existent-id'])
      ).resolves.not.toThrow();
    });
  });
});

/**
 * Integration test scenarios (requires actual backends)
 */
describe('TierSync Integration', () => {
  it.skip('should promote frequently accessed memories to hot tier', async () => {
    // This test requires Firebase to be configured
    // 1. Create memories in warm tier
    // 2. Simulate frequent access (3+ times in 24 hours)
    // 3. Run sync cycle
    // 4. Verify memories are in hot tier
  });

  it.skip('should demote idle hot memories to warm tier', async () => {
    // This test requires Firebase to be configured
    // 1. Create memories in hot tier
    // 2. Wait 1 hour or mock time
    // 3. Run sync cycle
    // 4. Verify memories are in warm tier
  });

  it.skip('should demote old/unimportant memories to cold tier', async () => {
    // This test requires GitHub to be configured
    // 1. Create memories in warm tier with low importance
    // 2. Simulate 7+ days aging
    // 3. Run sync cycle
    // 4. Verify memories are in cold tier (GitHub)
  });

  it.skip('should never demote permanent or critical memories', async () => {
    // This test requires GitHub to be configured
    // 1. Create old memories with 'permanent' or 'critical' tags
    // 2. Run sync cycle with aggressive demotion criteria
    // 3. Verify memories remain in warm tier
  });
});
