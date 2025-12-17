/**
 * Tests for GitHub Cold Tier Storage
 *
 * Note: These tests verify the API structure and graceful degradation.
 * Integration tests with actual GitHub API require credentials.
 */

import { GitHubColdTier, createGitHubColdTier } from '../github-cold-tier';
import { MemoryType } from '../file-store';

describe('GitHubColdTier', () => {
  describe('Initialization without credentials', () => {
    it('should initialize in degraded mode without credentials', () => {
      const coldTier = new GitHubColdTier();
      expect(coldTier.isEnabled()).toBe(false);
    });

    it('should create instance via factory function', () => {
      const coldTier = createGitHubColdTier();
      expect(coldTier).toBeInstanceOf(GitHubColdTier);
      expect(coldTier.isEnabled()).toBe(false);
    });
  });

  describe('Graceful degradation', () => {
    let coldTier: GitHubColdTier;

    beforeEach(() => {
      coldTier = new GitHubColdTier();
    });

    it('should return empty array when archiving without credentials', async () => {
      const memories = [
        {
          id: 'mem_1',
          content: 'Test memory',
          type: MemoryType.EPISODIC,
          importance_score: 0.8,
          tags: ['test'],
          created_at: new Date().toISOString(),
        },
      ];

      await expect(coldTier.archive(memories)).resolves.toBeUndefined();
    });

    it('should return empty array when retrieving without credentials', async () => {
      const result = await coldTier.retrieve({ limit: 10 });
      expect(result).toEqual([]);
    });

    it('should return empty metadata when listing without credentials', async () => {
      const result = await coldTier.list({ limit: 10 });
      expect(result).toEqual([]);
    });

    it('should return disabled stats without credentials', async () => {
      const stats = await coldTier.getStats();
      expect(stats.storage_backend).toBe('disabled');
      expect(stats.total_memories).toBe(0);
    });
  });

  describe('Cache management', () => {
    it('should clear cache without errors', () => {
      const coldTier = new GitHubColdTier();
      expect(() => coldTier.clearCache()).not.toThrow();
    });

    it('should have zero cache hit rate initially', async () => {
      const coldTier = new GitHubColdTier();
      const stats = await coldTier.getStats();
      expect(stats.cache_hit_rate).toBe(0);
    });
  });

  describe('Backward compatibility methods', () => {
    let coldTier: GitHubColdTier;

    beforeEach(() => {
      coldTier = new GitHubColdTier();
    });

    it('should return null when getting without credentials', async () => {
      const result = await coldTier.get('test/path.json');
      expect(result).toBeNull();
    });

    it('should not throw when setting without credentials', async () => {
      await expect(
        coldTier.set('test/path.json', { data: 'test' }, 'Test commit')
      ).resolves.toBeUndefined();
    });

    it('should not throw when deleting without credentials', async () => {
      await expect(
        coldTier.delete('test/path.json', 'Delete test')
      ).resolves.toBeUndefined();
    });
  });

  describe('Query interface', () => {
    it('should accept query with type filter', async () => {
      const coldTier = new GitHubColdTier();
      const result = await coldTier.retrieve({
        type: [MemoryType.SEMANTIC, MemoryType.EPISODIC],
        limit: 10,
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should accept query with importance filter', async () => {
      const coldTier = new GitHubColdTier();
      const result = await coldTier.retrieve({
        min_importance: 0.8,
        limit: 5,
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should accept query with date range', async () => {
      const coldTier = new GitHubColdTier();
      const result = await coldTier.retrieve({
        date_range: {
          start: '2024-01-01',
          end: '2024-01-31',
        },
        limit: 10,
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should accept query with tags filter', async () => {
      const coldTier = new GitHubColdTier();
      const result = await coldTier.retrieve({
        tags: ['important', 'review'],
        limit: 10,
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
