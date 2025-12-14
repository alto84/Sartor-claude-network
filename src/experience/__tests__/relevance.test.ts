/**
 * Tests for Smart Relevance Filtering Module
 */

import {
  RelevanceFilter,
  createRelevanceFilter,
  getGlobalFilter,
  resetGlobalFilter,
  createKeywordFilter,
  createRecencyFilter,
  createPreferenceFilter,
  calculateKeywordMatch,
  calculateSemanticSimilarity,
  calculateProximity,
  calculateAuthority,
  RelevanceSignal,
  type ScoredItem,
} from '../relevance';

interface TestItem {
  id: string;
  name: string;
  content: string;
  path: string;
  lastAccess?: number;
}

describe('Relevance Filtering', () => {
  let filter: RelevanceFilter<TestItem>;

  beforeEach(() => {
    filter = createRelevanceFilter<TestItem>();
    resetGlobalFilter();
  });

  describe('RelevanceFilter', () => {
    it('should create filter with default config', () => {
      expect(filter).toBeInstanceOf(RelevanceFilter);
    });

    it('should filter items by relevance', () => {
      const items: TestItem[] = [
        { id: '1', name: 'utils', content: 'utility functions', path: 'src/utils.ts' },
        { id: '2', name: 'api', content: 'api client', path: 'src/api.ts' },
        { id: '3', name: 'test', content: 'test utilities', path: 'src/test.ts' },
      ];

      const signalExtractor = (item: TestItem) => {
        const signals = new Map<RelevanceSignal, number>();
        signals.set(RelevanceSignal.KEYWORD_MATCH, item.name.includes('utils') ? 1 : 0);
        signals.set(RelevanceSignal.SEMANTIC_SIMILARITY, 0.5);
        return signals;
      };

      const results = filter.filter(items, signalExtractor);

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.score >= 0)).toBe(true);
    });

    it('should rank items by score', () => {
      const lowThresholdFilter = createRelevanceFilter<TestItem>({ threshold: 0.05 });
      const items: TestItem[] = [
        { id: '1', name: 'low', content: 'low relevance', path: 'low.ts' },
        { id: '2', name: 'high', content: 'high relevance', path: 'high.ts' },
        { id: '3', name: 'medium', content: 'medium relevance', path: 'medium.ts' },
      ];

      const signalExtractor = (item: TestItem) => {
        const signals = new Map<RelevanceSignal, number>();
        const score = item.name === 'high' ? 1 : item.name === 'medium' ? 0.5 : 0.2;
        signals.set(RelevanceSignal.KEYWORD_MATCH, score);
        return signals;
      };

      const results = lowThresholdFilter.filter(items, signalExtractor);

      expect(results[0].item.name).toBe('high');
      expect(results[0].rank).toBe(1);
    });

    it('should apply threshold', () => {
      const filter = createRelevanceFilter<TestItem>({ threshold: 0.5 });
      const items: TestItem[] = [
        { id: '1', name: 'high', content: 'high', path: 'high.ts' },
        { id: '2', name: 'low', content: 'low', path: 'low.ts' },
      ];

      const signalExtractor = (item: TestItem) => {
        const signals = new Map<RelevanceSignal, number>();
        signals.set(RelevanceSignal.KEYWORD_MATCH, item.name === 'high' ? 0.8 : 0.2);
        return signals;
      };

      const results = filter.filter(items, signalExtractor);

      expect(results.every((r) => r.score >= 0.5)).toBe(true);
    });

    it('should respect maxResults', () => {
      const filter = createRelevanceFilter<TestItem>({ maxResults: 2, threshold: 0.1 });
      const items: TestItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        name: `item${i}`,
        content: `content ${i}`,
        path: `item${i}.ts`,
      }));

      const signalExtractor = () => {
        const signals = new Map<RelevanceSignal, number>();
        signals.set(RelevanceSignal.KEYWORD_MATCH, 0.8);
        return signals;
      };

      const results = filter.filter(items, signalExtractor);

      expect(results.length).toBe(2);
    });

    it('should include signal scores', () => {
      const lowThresholdFilter = createRelevanceFilter<TestItem>({ threshold: 0.1 });
      const items: TestItem[] = [{ id: '1', name: 'test', content: 'test', path: 'test.ts' }];

      const signalExtractor = () => {
        const signals = new Map<RelevanceSignal, number>();
        signals.set(RelevanceSignal.KEYWORD_MATCH, 0.8);
        signals.set(RelevanceSignal.RECENCY, 0.6);
        return signals;
      };

      const results = lowThresholdFilter.filter(items, signalExtractor);

      expect(results[0].signals.length).toBeGreaterThan(0);
      expect(results[0].signals.some((s) => s.signal === RelevanceSignal.KEYWORD_MATCH)).toBe(true);
    });
  });

  describe('Boost and Penalty Factors', () => {
    it('should apply boost factors', () => {
      const boostFilter = createRelevanceFilter<TestItem>({ threshold: 0.1 });
      boostFilter.addBoost({
        condition: (item: TestItem) => item.name.includes('important'),
        multiplier: 2.0,
        reason: 'important file',
      });

      const items: TestItem[] = [
        { id: '1', name: 'important-file', content: 'content', path: 'important.ts' },
        { id: '2', name: 'normal-file', content: 'content', path: 'normal.ts' },
      ];

      const signalExtractor = () => {
        const signals = new Map<RelevanceSignal, number>();
        signals.set(RelevanceSignal.KEYWORD_MATCH, 0.5);
        return signals;
      };

      const results = boostFilter.filter(items, signalExtractor);

      const importantResult = results.find((r) => r.item.name.includes('important'));
      const normalResult = results.find((r) => r.item.name.includes('normal'));

      expect(importantResult!.score).toBeGreaterThan(normalResult!.score);
    });

    it('should apply penalty factors', () => {
      const penaltyFilter = createRelevanceFilter<TestItem>({ threshold: 0.1 });
      penaltyFilter.addPenalty({
        condition: (item: TestItem) => item.name.includes('deprecated'),
        multiplier: 0.5,
        reason: 'deprecated file',
      });

      const items: TestItem[] = [
        { id: '1', name: 'deprecated-file', content: 'content', path: 'deprecated.ts' },
        { id: '2', name: 'current-file', content: 'content', path: 'current.ts' },
      ];

      const signalExtractor = () => {
        const signals = new Map<RelevanceSignal, number>();
        signals.set(RelevanceSignal.KEYWORD_MATCH, 0.8);
        return signals;
      };

      const results = penaltyFilter.filter(items, signalExtractor);

      const deprecatedResult = results.find((r) => r.item.name.includes('deprecated'));
      const currentResult = results.find((r) => r.item.name.includes('current'));

      expect(deprecatedResult!.score).toBeLessThan(currentResult!.score);
    });

    it('should include boost/penalty in explanation', () => {
      filter.addBoost({
        condition: () => true,
        multiplier: 1.5,
        reason: 'test boost',
      });

      const items: TestItem[] = [{ id: '1', name: 'test', content: 'test', path: 'test.ts' }];

      const signalExtractor = () => {
        const signals = new Map<RelevanceSignal, number>();
        signals.set(RelevanceSignal.KEYWORD_MATCH, 0.8);
        return signals;
      };

      const results = filter.filter(items, signalExtractor);

      expect(results[0].explanation).toContain('test boost');
    });
  });

  describe('Usage Tracking', () => {
    it('should track usage', () => {
      filter.trackUsage('item-1');
      filter.trackUsage('item-1');
      filter.trackUsage('item-2');

      const stats = filter.getUsageStats();
      expect(stats.trackedItems).toBe(2);
      expect(stats.totalAccesses).toBe(3);
    });

    it('should calculate frequency score', () => {
      // Track item multiple times
      for (let i = 0; i < 10; i++) {
        filter.trackUsage('frequent-item');
      }
      filter.trackUsage('infrequent-item');

      const frequentScore = filter.getFrequencyScore('frequent-item');
      const infrequentScore = filter.getFrequencyScore('infrequent-item');

      expect(frequentScore).toBeGreaterThan(infrequentScore);
    });

    it('should calculate recency score', () => {
      filter.trackUsage('recent-item');

      const recencyScore = filter.getRecencyScore('recent-item');
      expect(recencyScore).toBeGreaterThan(0);
      expect(recencyScore).toBeLessThanOrEqual(1);
    });

    it('should track positive/negative feedback', () => {
      // Track more samples to get stable Wilson score
      for (let i = 0; i < 10; i++) {
        filter.trackUsage('item-1', undefined, true);
      }
      for (let i = 0; i < 2; i++) {
        filter.trackUsage('item-1', undefined, false);
      }

      const prefScore = filter.getUserPreferenceScore('item-1');
      expect(prefScore).toBeGreaterThan(0.5); // More positive than negative (10 vs 2)
    });

    it('should clear usage tracking', () => {
      filter.trackUsage('item-1');
      filter.clearUsageTracking();

      const stats = filter.getUsageStats();
      expect(stats.trackedItems).toBe(0);
    });

    it('should export and import usage data', () => {
      filter.trackUsage('item-1');
      filter.trackUsage('item-2');

      const exported = filter.exportUsageData();
      expect(exported.length).toBe(2);

      const newFilter = createRelevanceFilter<TestItem>();
      newFilter.importUsageData(exported);

      const stats = newFilter.getUsageStats();
      expect(stats.trackedItems).toBe(2);
    });
  });

  describe('Threshold Management', () => {
    it('should get current threshold', () => {
      const threshold = filter.getThreshold();
      expect(typeof threshold).toBe('number');
    });

    it('should set threshold', () => {
      filter.setThreshold(0.7);
      expect(filter.getThreshold()).toBe(0.7);
    });

    it('should support adaptive threshold', () => {
      const adaptiveFilter = createRelevanceFilter<TestItem>({
        adaptiveThreshold: true,
        threshold: 0.3,
      });

      const items: TestItem[] = Array.from({ length: 200 }, (_, i) => ({
        id: `${i}`,
        name: `item${i}`,
        content: `content ${i}`,
        path: `item${i}.ts`,
      }));

      const signalExtractor = (item: TestItem) => {
        const signals = new Map<RelevanceSignal, number>();
        const index = parseInt(item.id);
        signals.set(RelevanceSignal.KEYWORD_MATCH, (index % 10) / 10);
        return signals;
      };

      // Run filter multiple times to build history
      for (let i = 0; i < 5; i++) {
        adaptiveFilter.filter(items, signalExtractor);
      }

      const stats = adaptiveFilter.getUsageStats();
      expect(stats.adaptedThreshold).toBeGreaterThan(0);
    });
  });

  describe('Specialized Filters', () => {
    it('should create keyword filter', () => {
      const keywordFilter = createKeywordFilter<TestItem>();
      expect(keywordFilter).toBeInstanceOf(RelevanceFilter);
    });

    it('should create recency filter', () => {
      const recencyFilter = createRecencyFilter<TestItem>();
      expect(recencyFilter).toBeInstanceOf(RelevanceFilter);
    });

    it('should create preference filter', () => {
      const prefFilter = createPreferenceFilter<TestItem>();
      expect(prefFilter).toBeInstanceOf(RelevanceFilter);
    });
  });

  describe('Helper Functions', () => {
    describe('calculateKeywordMatch', () => {
      it('should calculate exact match', () => {
        const score = calculateKeywordMatch(['hello', 'world'], 'hello world test');
        expect(score).toBe(1); // Both keywords found
      });

      it('should calculate partial match', () => {
        const score = calculateKeywordMatch(['hello', 'world', 'foo'], 'hello world test');
        expect(score).toBeCloseTo(2 / 3); // 2 out of 3 keywords found
      });

      it('should be case insensitive', () => {
        const score = calculateKeywordMatch(['HELLO'], 'hello world');
        expect(score).toBe(1);
      });

      it('should return 0 for no match', () => {
        const score = calculateKeywordMatch(['foo'], 'bar baz');
        expect(score).toBe(0);
      });

      it('should return 0 for empty query', () => {
        const score = calculateKeywordMatch([], 'hello world');
        expect(score).toBe(0);
      });
    });

    describe('calculateSemanticSimilarity', () => {
      it('should calculate Jaccard similarity', () => {
        const score = calculateSemanticSimilarity('the quick brown fox', 'the quick red fox');
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThan(1);
      });

      it('should return 1 for identical text', () => {
        const score = calculateSemanticSimilarity('hello world', 'hello world');
        expect(score).toBe(1);
      });

      it('should return 0 for no overlap', () => {
        const score = calculateSemanticSimilarity('aaa bbb ccc', 'xxx yyy zzz');
        expect(score).toBe(0);
      });
    });

    describe('calculateProximity', () => {
      it('should calculate path proximity', () => {
        const score = calculateProximity('src/utils/helper.ts', 'src/utils/index.ts');
        expect(score).toBeGreaterThan(0.5);
      });

      it('should return lower score for distant paths', () => {
        const score = calculateProximity('src/utils/helper.ts', 'lib/other/file.ts');
        expect(score).toBeLessThan(0.5);
      });

      it('should return 1 for same directory', () => {
        const score = calculateProximity('src/a.ts', 'src/b.ts');
        expect(score).toBeGreaterThan(0.3);
      });
    });

    describe('calculateAuthority', () => {
      it('should give higher score to index files', () => {
        const indexScore = calculateAuthority('src/index.ts');
        const otherScore = calculateAuthority('src/utils.ts');
        expect(indexScore).toBeGreaterThan(otherScore);
      });

      it('should give higher score to files with many exports', () => {
        const manyExports = calculateAuthority('src/index.ts', { exports: 10 });
        const fewExports = calculateAuthority('src/index.ts', { exports: 1 });
        expect(manyExports).toBeGreaterThan(fewExports);
      });
    });
  });

  describe('Global Filter', () => {
    it('should get global filter', () => {
      const global = getGlobalFilter<TestItem>();
      expect(global).toBeInstanceOf(RelevanceFilter);
    });

    it('should return same instance', () => {
      const global1 = getGlobalFilter<TestItem>();
      const global2 = getGlobalFilter<TestItem>();
      expect(global1).toBe(global2);
    });

    it('should reset global filter', () => {
      const global1 = getGlobalFilter<TestItem>();
      resetGlobalFilter();
      const global2 = getGlobalFilter<TestItem>();
      expect(global1).not.toBe(global2);
    });
  });

  describe('Score Single Item', () => {
    it('should score individual item', () => {
      const item: TestItem = { id: '1', name: 'test', content: 'test content', path: 'test.ts' };

      const signalExtractor = () => {
        const signals = new Map<RelevanceSignal, number>();
        signals.set(RelevanceSignal.KEYWORD_MATCH, 0.8);
        return signals;
      };

      const result = filter.scoreItem(item, signalExtractor);

      expect(result.item).toBe(item);
      expect(result.score).toBeGreaterThan(0);
      expect(result.rank).toBe(1);
    });
  });
});
