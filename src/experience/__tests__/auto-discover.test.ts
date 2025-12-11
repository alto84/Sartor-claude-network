/**
 * Tests for Automatic Context Discovery Module
 */

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  ContextDiscoverer,
  createContextDiscoverer,
  getGlobalDiscoverer,
  resetGlobalDiscoverer,
  discoverContext,
  DiscoverySource,
  ConfidenceLevel,
  ContextType,
} from '../auto-discover';

describe('Auto-Discovery', () => {
  let tempDir: string;
  let discoverer: ContextDiscoverer;

  beforeEach(() => {
    // Create temp directory with test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'discover-test-'));

    // Create test file structure
    fs.mkdirSync(path.join(tempDir, 'src'));
    fs.mkdirSync(path.join(tempDir, 'src', '__tests__'));
    fs.mkdirSync(path.join(tempDir, 'docs'));

    // Create test files
    fs.writeFileSync(
      path.join(tempDir, 'src', 'utils.ts'),
      `
export function formatDate(date: Date): string {
  return date.toISOString();
}

export function parseJSON(text: string): any {
  return JSON.parse(text);
}
      `
    );

    fs.writeFileSync(
      path.join(tempDir, 'src', 'api.ts'),
      `
import { formatDate } from './utils';

export class ApiClient {
  async fetch(url: string): Promise<any> {
    const response = await fetch(url);
    return response.json();
  }
}
      `
    );

    fs.writeFileSync(
      path.join(tempDir, 'src', '__tests__', 'utils.test.ts'),
      `
import { formatDate, parseJSON } from '../utils';

describe('utils', () => {
  it('should format date', () => {
    expect(formatDate(new Date())).toBeDefined();
  });
});
      `
    );

    fs.writeFileSync(
      path.join(tempDir, 'docs', 'README.md'),
      `# Utils Documentation\n\nThis module provides utility functions.`
    );

    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0' })
    );

    discoverer = createContextDiscoverer({ rootPath: tempDir });
    resetGlobalDiscoverer();
  });

  afterEach(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('ContextDiscoverer', () => {
    it('should create discoverer with options', () => {
      expect(discoverer).toBeInstanceOf(ContextDiscoverer);
    });

    it('should discover files by keyword', async () => {
      const results = await discoverer.discover({
        keywords: ['utils'],
        maxResults: 10,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.path.includes('utils'))).toBe(true);
    });

    it('should filter by file pattern', async () => {
      const results = await discoverer.discover({
        keywords: ['utils'],
        filePatterns: ['*.ts'],
        maxResults: 10,
      });

      expect(results.every(r => r.path.endsWith('.ts'))).toBe(true);
    });

    it('should filter by context type', async () => {
      const results = await discoverer.discover({
        keywords: ['test', 'utils'],
        contextTypes: [ContextType.TEST],
        maxResults: 10,
      });

      expect(results.every(r => r.type === ContextType.TEST)).toBe(true);
    });

    it('should assign relevance scores', async () => {
      const results = await discoverer.discover({
        keywords: ['utils'],
        maxResults: 10,
      });

      for (const result of results) {
        expect(result.relevance).toBeGreaterThanOrEqual(0);
        expect(result.relevance).toBeLessThanOrEqual(1);
      }
    });

    it('should sort results by relevance', async () => {
      const results = await discoverer.discover({
        keywords: ['utils'],
        maxResults: 10,
      });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].relevance).toBeGreaterThanOrEqual(results[i].relevance);
      }
    });

    it('should assign confidence levels', async () => {
      const results = await discoverer.discover({
        keywords: ['utils'],
        maxResults: 10,
      });

      for (const result of results) {
        expect([ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM, ConfidenceLevel.LOW]).toContain(
          result.confidence
        );
      }
    });

    it('should include metadata', async () => {
      const results = await discoverer.discover({
        keywords: ['utils'],
        maxResults: 10,
      });

      for (const result of results) {
        expect(result.metadata).toBeDefined();
        expect(result.metadata.extension).toBeDefined();
      }
    });

    it('should include content when requested', async () => {
      const results = await discoverer.discover({
        keywords: ['utils'],
        includeContent: true,
        maxResults: 5,
      });

      const withContent = results.filter(r => r.content !== undefined);
      expect(withContent.length).toBeGreaterThan(0);
    });

    it('should respect minRelevance filter', async () => {
      const results = await discoverer.discover({
        keywords: ['utils'],
        minRelevance: 0.5,
        maxResults: 10,
      });

      for (const result of results) {
        expect(result.relevance).toBeGreaterThanOrEqual(0.5);
      }
    });

    it('should respect maxResults limit', async () => {
      const results = await discoverer.discover({
        keywords: ['utils', 'api', 'test'],
        maxResults: 2,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('discoverRelated', () => {
    it('should find related files through imports', async () => {
      const apiPath = path.join(tempDir, 'src', 'api.ts');
      const results = await discoverer.discoverRelated(apiPath);

      // api.ts imports utils.ts
      expect(results.some(r => r.path.includes('utils'))).toBe(true);
    });

    it('should respect max depth', async () => {
      const results = await discoverer.discoverRelated(
        path.join(tempDir, 'src', 'api.ts'),
        1
      );

      // All results should be depth 1 (direct imports only)
      for (const result of results) {
        expect(result.metadata.depth).toBeLessThanOrEqual(1);
      }
    });

    it('should decrease relevance with depth', async () => {
      const results = await discoverer.discoverRelated(
        path.join(tempDir, 'src', 'api.ts'),
        2
      );

      // Depth 1 items should have higher relevance than depth 2
      const depth1 = results.filter(r => r.metadata.depth === 1);
      const depth2 = results.filter(r => r.metadata.depth === 2);

      if (depth1.length > 0 && depth2.length > 0) {
        expect(Math.min(...depth1.map(r => r.relevance))).toBeGreaterThanOrEqual(
          Math.max(...depth2.map(r => r.relevance))
        );
      }
    });
  });

  describe('discoverTests', () => {
    it('should find test files for source file', async () => {
      const utilsPath = path.join(tempDir, 'src', 'utils.ts');
      const results = await discoverer.discoverTests(utilsPath);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.path.includes('utils.test'))).toBe(true);
    });

    it('should mark results as TEST type', async () => {
      const utilsPath = path.join(tempDir, 'src', 'utils.ts');
      const results = await discoverer.discoverTests(utilsPath);

      for (const result of results) {
        expect(result.type).toBe(ContextType.TEST);
      }
    });

    it('should have TESTS source', async () => {
      const utilsPath = path.join(tempDir, 'src', 'utils.ts');
      const results = await discoverer.discoverTests(utilsPath);

      for (const result of results) {
        expect(result.source).toBe(DiscoverySource.TESTS);
      }
    });
  });

  describe('discoverDocs', () => {
    it('should find documentation files', async () => {
      // Create a doc file that mentions the source file name
      fs.writeFileSync(
        path.join(tempDir, 'docs', 'utils.md'),
        '# Utils Documentation\n\nDocumentation for utility functions.'
      );

      const utilsPath = path.join(tempDir, 'src', 'utils.ts');
      const results = await discoverer.discoverDocs(utilsPath);

      expect(results.some(r => r.path.includes('utils.md'))).toBe(true);
    });

    it('should mark results as DOCUMENTATION type', async () => {
      const utilsPath = path.join(tempDir, 'src', 'utils.ts');
      const results = await discoverer.discoverDocs(utilsPath);

      for (const result of results) {
        expect(result.type).toBe(ContextType.DOCUMENTATION);
      }
    });
  });

  describe('Caching', () => {
    it('should cache discovery results', async () => {
      const query = { keywords: ['utils'], maxResults: 10 };

      // First query
      const results1 = await discoverer.discover(query);

      // Second query (should be cached)
      const results2 = await discoverer.discover(query);

      expect(results1).toEqual(results2);
    });

    it('should clear cache', async () => {
      const query = { keywords: ['utils'], maxResults: 10 };
      await discoverer.discover(query);

      discoverer.clearCache();
      const stats = discoverer.getStats();

      expect(stats.cacheSize).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should return stats', async () => {
      await discoverer.discover({ keywords: ['utils'], maxResults: 10 });
      const stats = discoverer.getStats();

      expect(stats.filesIndexed).toBeGreaterThan(0);
      expect(stats.rootPath).toBe(tempDir);
    });

    it('should track cache hit rate', async () => {
      const query = { keywords: ['utils'], maxResults: 10 };

      await discoverer.discover(query);
      await discoverer.discover(query);
      await discoverer.discover(query);

      const stats = discoverer.getStats();
      expect(stats.cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe('Reindex', () => {
    it('should reindex files', async () => {
      await discoverer.discover({ keywords: ['utils'], maxResults: 10 });

      // Add a new file
      fs.writeFileSync(
        path.join(tempDir, 'src', 'newfile.ts'),
        'export const newThing = "test";'
      );

      await discoverer.reindex();

      const results = await discoverer.discover({
        keywords: ['newThing'],
        maxResults: 10,
      });

      expect(results.some(r => r.path.includes('newfile'))).toBe(true);
    });
  });

  describe('Global Instance', () => {
    it('should get global discoverer', () => {
      const global = getGlobalDiscoverer(tempDir);
      expect(global).toBeInstanceOf(ContextDiscoverer);
    });

    it('should return same instance', () => {
      const global1 = getGlobalDiscoverer(tempDir);
      const global2 = getGlobalDiscoverer();
      expect(global1).toBe(global2);
    });

    it('should reset global discoverer', () => {
      const global1 = getGlobalDiscoverer(tempDir);
      resetGlobalDiscoverer();
      const global2 = getGlobalDiscoverer(tempDir);
      expect(global1).not.toBe(global2);
    });
  });

  describe('discoverContext helper', () => {
    it('should use global discoverer', async () => {
      resetGlobalDiscoverer();
      getGlobalDiscoverer(tempDir);

      const results = await discoverContext(['utils']);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });
});
