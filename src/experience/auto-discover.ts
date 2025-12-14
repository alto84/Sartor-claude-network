/**
 * Automatic Context Discovery Module
 *
 * Provides intelligent discovery of relevant context for subagents,
 * including file patterns, dependencies, and related code sections.
 *
 * Features:
 * - File pattern discovery
 * - Dependency graph traversal
 * - Code relationship detection
 * - Context caching with TTL
 */

import * as path from 'path';
import * as fs from 'fs';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Discovery source types
 */
export enum DiscoverySource {
  FILE_SYSTEM = 'file_system',
  GIT_HISTORY = 'git_history',
  IMPORTS = 'imports',
  EXPORTS = 'exports',
  REFERENCES = 'references',
  TESTS = 'tests',
  DOCUMENTATION = 'documentation',
}

/**
 * Discovery result confidence levels
 */
export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Discovered context item
 */
export interface DiscoveredContext {
  id: string;
  type: ContextType;
  source: DiscoverySource;
  path: string;
  content?: string;
  relevance: number; // 0.0 - 1.0
  confidence: ConfidenceLevel;
  metadata: Record<string, any>;
  discoveredAt: number;
  expiresAt?: number;
}

/**
 * Context types
 */
export enum ContextType {
  FILE = 'file',
  FUNCTION = 'function',
  CLASS = 'class',
  INTERFACE = 'interface',
  TYPE = 'type',
  CONSTANT = 'constant',
  TEST = 'test',
  CONFIG = 'config',
  DOCUMENTATION = 'documentation',
  DEPENDENCY = 'dependency',
}

/**
 * Discovery query
 */
export interface DiscoveryQuery {
  keywords: string[];
  filePatterns?: string[];
  contextTypes?: ContextType[];
  sources?: DiscoverySource[];
  maxResults?: number;
  minRelevance?: number;
  includeContent?: boolean;
}

/**
 * Discovery options
 */
export interface DiscoveryOptions {
  rootPath: string;
  cacheTTLMs?: number;
  maxCacheSize?: number;
  excludePatterns?: string[];
  followSymlinks?: boolean;
}

/**
 * File index entry
 */
interface FileIndexEntry {
  path: string;
  relativePath: string;
  size: number;
  modifiedAt: number;
  extension: string;
  keywords: Set<string>;
  exports: Set<string>;
  imports: Set<string>;
}

/**
 * Discovery cache entry
 */
interface CacheEntry {
  results: DiscoveredContext[];
  createdAt: number;
  expiresAt: number;
  hitCount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_CACHE_SIZE = 1000;
const DEFAULT_MAX_RESULTS = 50;
const DEFAULT_MIN_RELEVANCE = 0.3;

const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
];

const CODE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.c',
  '.cpp',
  '.h',
  '.hpp',
]);

const CONFIG_PATTERNS = [
  'package.json',
  'tsconfig.json',
  'jest.config',
  'webpack.config',
  'vite.config',
  '.eslintrc',
  '.prettierrc',
];

const DOC_EXTENSIONS = new Set(['.md', '.mdx', '.rst', '.txt']);

// ============================================================================
// CONTEXT DISCOVERER
// ============================================================================

/**
 * Automatic context discoverer for subagents
 */
export class ContextDiscoverer {
  private options: Required<DiscoveryOptions>;
  private fileIndex: Map<string, FileIndexEntry> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private indexedAt: number = 0;
  private indexing: boolean = false;

  constructor(options: DiscoveryOptions) {
    this.options = {
      rootPath: options.rootPath,
      cacheTTLMs: options.cacheTTLMs ?? DEFAULT_CACHE_TTL_MS,
      maxCacheSize: options.maxCacheSize ?? DEFAULT_MAX_CACHE_SIZE,
      excludePatterns: options.excludePatterns ?? DEFAULT_EXCLUDE_PATTERNS,
      followSymlinks: options.followSymlinks ?? false,
    };
  }

  /**
   * Discover relevant context based on query
   */
  async discover(query: DiscoveryQuery): Promise<DiscoveredContext[]> {
    const cacheKey = this.generateCacheKey(query);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    // Ensure index is built
    await this.ensureIndexed();

    const results: DiscoveredContext[] = [];
    const maxResults = query.maxResults ?? DEFAULT_MAX_RESULTS;
    const minRelevance = query.minRelevance ?? DEFAULT_MIN_RELEVANCE;

    // Search file index
    for (const [filePath, entry] of this.fileIndex) {
      // Check file pattern match
      if (query.filePatterns && !this.matchesFilePattern(filePath, query.filePatterns)) {
        continue;
      }

      // Calculate relevance
      const relevance = this.calculateRelevance(entry, query);
      if (relevance < minRelevance) {
        continue;
      }

      // Determine context type
      const contextType = this.determineContextType(entry);
      if (query.contextTypes && !query.contextTypes.includes(contextType)) {
        continue;
      }

      // Determine discovery source
      const source = this.determineSource(entry);
      if (query.sources && !query.sources.includes(source)) {
        continue;
      }

      // Build discovered context
      const context: DiscoveredContext = {
        id: this.generateId(filePath),
        type: contextType,
        source,
        path: entry.relativePath,
        relevance,
        confidence: this.determineConfidence(relevance),
        metadata: {
          extension: entry.extension,
          size: entry.size,
          modifiedAt: entry.modifiedAt,
          exports: Array.from(entry.exports),
          imports: Array.from(entry.imports),
        },
        discoveredAt: Date.now(),
      };

      // Include content if requested
      if (query.includeContent) {
        try {
          context.content = fs.readFileSync(filePath, 'utf-8');
        } catch {
          // Skip if can't read content
        }
      }

      results.push(context);
    }

    // Sort by relevance and limit
    results.sort((a, b) => b.relevance - a.relevance);
    const limitedResults = results.slice(0, maxResults);

    // Cache results
    this.cacheResult(cacheKey, limitedResults);

    return limitedResults;
  }

  /**
   * Discover related files to a given file
   */
  async discoverRelated(filePath: string, maxDepth: number = 2): Promise<DiscoveredContext[]> {
    await this.ensureIndexed();

    const results: DiscoveredContext[] = [];
    const visited = new Set<string>();
    const queue: Array<{ path: string; depth: number }> = [{ path: filePath, depth: 0 }];

    while (queue.length > 0) {
      const { path: currentPath, depth } = queue.shift()!;

      if (visited.has(currentPath) || depth > maxDepth) {
        continue;
      }
      visited.add(currentPath);

      const entry = this.findEntryByPath(currentPath);
      if (!entry) continue;

      // Add to results (skip the original file)
      if (currentPath !== filePath) {
        results.push({
          id: this.generateId(currentPath),
          type: this.determineContextType(entry),
          source: DiscoverySource.IMPORTS,
          path: entry.relativePath,
          relevance: 1.0 - depth * 0.3, // Decrease relevance with depth
          confidence: ConfidenceLevel.HIGH,
          metadata: {
            depth,
            relationshipType: 'import',
          },
          discoveredAt: Date.now(),
        });
      }

      // Find files this imports
      for (const importPath of entry.imports) {
        const resolvedPath = this.resolveImport(currentPath, importPath);
        if (resolvedPath && !visited.has(resolvedPath)) {
          queue.push({ path: resolvedPath, depth: depth + 1 });
        }
      }

      // Find files that import this
      for (const [otherPath, otherEntry] of this.fileIndex) {
        if (otherEntry.imports.has(entry.relativePath) && !visited.has(otherPath)) {
          queue.push({ path: otherPath, depth: depth + 1 });
        }
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Discover test files for a source file
   */
  async discoverTests(sourcePath: string): Promise<DiscoveredContext[]> {
    await this.ensureIndexed();

    const results: DiscoveredContext[] = [];
    const sourceEntry = this.findEntryByPath(sourcePath);
    if (!sourceEntry) return results;

    // Extract base name
    const baseName = path.basename(sourcePath, path.extname(sourcePath));

    // Find test files
    const testPatterns = [
      `${baseName}.test`,
      `${baseName}.spec`,
      `${baseName}-test`,
      `${baseName}_test`,
    ];

    for (const [filePath, entry] of this.fileIndex) {
      const fileName = path.basename(filePath, path.extname(filePath));
      const isTest = testPatterns.some((pattern) => fileName.startsWith(pattern));

      if (isTest || entry.relativePath.includes('__tests__')) {
        // Check if test imports the source file
        const importsSource = Array.from(entry.imports).some(
          (imp) =>
            imp.includes(baseName) ||
            imp.includes(sourceEntry.relativePath.replace(/\.(ts|js|tsx|jsx)$/, ''))
        );

        if (importsSource || fileName.includes(baseName)) {
          results.push({
            id: this.generateId(filePath),
            type: ContextType.TEST,
            source: DiscoverySource.TESTS,
            path: entry.relativePath,
            relevance: importsSource ? 0.95 : 0.7,
            confidence: importsSource ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM,
            metadata: {
              testFor: sourceEntry.relativePath,
              importsSource,
            },
            discoveredAt: Date.now(),
          });
        }
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Discover documentation for a source file
   */
  async discoverDocs(sourcePath: string): Promise<DiscoveredContext[]> {
    await this.ensureIndexed();

    const results: DiscoveredContext[] = [];
    const baseName = path.basename(sourcePath, path.extname(sourcePath));
    const dirPath = path.dirname(sourcePath);

    for (const [filePath, entry] of this.fileIndex) {
      if (!DOC_EXTENSIONS.has(entry.extension)) continue;

      // Check for documentation in same directory
      const sameDir = path.dirname(filePath).startsWith(dirPath);

      // Check for naming matches
      const nameMatch =
        entry.relativePath.toLowerCase().includes(baseName.toLowerCase()) ||
        entry.keywords.has(baseName.toLowerCase());

      if (sameDir || nameMatch) {
        results.push({
          id: this.generateId(filePath),
          type: ContextType.DOCUMENTATION,
          source: DiscoverySource.DOCUMENTATION,
          path: entry.relativePath,
          relevance: nameMatch ? 0.9 : sameDir ? 0.6 : 0.4,
          confidence: nameMatch ? ConfidenceLevel.HIGH : ConfidenceLevel.MEDIUM,
          metadata: {
            documentFor: sourcePath,
          },
          discoveredAt: Date.now(),
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Get statistics about the discovery index
   */
  getStats(): {
    filesIndexed: number;
    cacheSize: number;
    cacheHitRate: number;
    indexedAt: number;
    rootPath: string;
  } {
    let totalHits = 0;
    let totalEntries = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount;
      totalEntries++;
    }

    return {
      filesIndexed: this.fileIndex.size,
      cacheSize: this.cache.size,
      cacheHitRate: totalEntries > 0 ? totalHits / totalEntries : 0,
      indexedAt: this.indexedAt,
      rootPath: this.options.rootPath,
    };
  }

  /**
   * Clear the discovery cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Force reindex
   */
  async reindex(): Promise<void> {
    this.fileIndex.clear();
    this.indexedAt = 0;
    await this.ensureIndexed();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async ensureIndexed(): Promise<void> {
    // Check if already indexed recently
    const now = Date.now();
    if (this.indexedAt > 0 && now - this.indexedAt < this.options.cacheTTLMs) {
      return;
    }

    // Prevent concurrent indexing
    if (this.indexing) {
      while (this.indexing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.indexing = true;
    try {
      await this.buildIndex(this.options.rootPath);
      this.indexedAt = now;
    } finally {
      this.indexing = false;
    }
  }

  private async buildIndex(dirPath: string): Promise<void> {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.options.rootPath, fullPath);

        // Check exclusions
        if (this.shouldExclude(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          // Skip symlinks if not following
          if (entry.isSymbolicLink() && !this.options.followSymlinks) {
            continue;
          }
          await this.buildIndex(fullPath);
        } else if (entry.isFile()) {
          const indexEntry = await this.indexFile(fullPath, relativePath);
          if (indexEntry) {
            this.fileIndex.set(fullPath, indexEntry);
          }
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  private async indexFile(fullPath: string, relativePath: string): Promise<FileIndexEntry | null> {
    try {
      const stats = fs.statSync(fullPath);
      const extension = path.extname(fullPath).toLowerCase();

      const entry: FileIndexEntry = {
        path: fullPath,
        relativePath,
        size: stats.size,
        modifiedAt: stats.mtimeMs,
        extension,
        keywords: new Set(),
        exports: new Set(),
        imports: new Set(),
      };

      // Extract keywords from filename
      const baseName = path.basename(fullPath, extension);
      for (const word of this.tokenize(baseName)) {
        entry.keywords.add(word.toLowerCase());
      }

      // Parse code files for imports/exports
      if (CODE_EXTENSIONS.has(extension) && stats.size < 500000) {
        // Skip large files
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          this.extractCodeInfo(content, entry);
        } catch {
          // Skip files we can't read
        }
      }

      return entry;
    } catch {
      return null;
    }
  }

  private extractCodeInfo(content: string, entry: FileIndexEntry): void {
    // Extract imports (TypeScript/JavaScript)
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      entry.imports.add(match[1]);
    }

    // Extract require statements
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      entry.imports.add(match[1]);
    }

    // Extract exports
    const exportRegex =
      /export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      entry.exports.add(match[1]);
      entry.keywords.add(match[1].toLowerCase());
    }

    // Extract class/function/interface names
    const declarationRegex = /(?:class|function|interface|type|enum)\s+(\w+)/g;
    while ((match = declarationRegex.exec(content)) !== null) {
      entry.keywords.add(match[1].toLowerCase());
    }
  }

  private shouldExclude(relativePath: string): boolean {
    return this.options.excludePatterns.some(
      (pattern) => relativePath.includes(pattern) || relativePath.startsWith(pattern)
    );
  }

  private matchesFilePattern(filePath: string, patterns: string[]): boolean {
    const relativePath = path.relative(this.options.rootPath, filePath);
    return patterns.some((pattern) => {
      // Simple glob matching
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(relativePath);
      }
      return relativePath.includes(pattern);
    });
  }

  private calculateRelevance(entry: FileIndexEntry, query: DiscoveryQuery): number {
    let score = 0;
    let maxScore = 0;

    for (const keyword of query.keywords) {
      maxScore += 1;
      const lowerKeyword = keyword.toLowerCase();

      // Exact match in keywords
      if (entry.keywords.has(lowerKeyword)) {
        score += 1;
        continue;
      }

      // Partial match in keywords
      for (const entryKeyword of entry.keywords) {
        if (entryKeyword.includes(lowerKeyword) || lowerKeyword.includes(entryKeyword)) {
          score += 0.5;
          break;
        }
      }

      // Match in exports
      for (const exportName of entry.exports) {
        if (exportName.toLowerCase().includes(lowerKeyword)) {
          score += 0.7;
          break;
        }
      }

      // Match in path
      if (entry.relativePath.toLowerCase().includes(lowerKeyword)) {
        score += 0.3;
      }
    }

    return maxScore > 0 ? score / maxScore : 0;
  }

  private determineContextType(entry: FileIndexEntry): ContextType {
    // Check for tests
    if (
      entry.relativePath.includes('.test.') ||
      entry.relativePath.includes('.spec.') ||
      entry.relativePath.includes('__tests__')
    ) {
      return ContextType.TEST;
    }

    // Check for config files
    if (CONFIG_PATTERNS.some((p) => entry.relativePath.includes(p))) {
      return ContextType.CONFIG;
    }

    // Check for documentation
    if (DOC_EXTENSIONS.has(entry.extension)) {
      return ContextType.DOCUMENTATION;
    }

    // Default to file
    return ContextType.FILE;
  }

  private determineSource(entry: FileIndexEntry): DiscoverySource {
    if (entry.relativePath.includes('__tests__') || entry.relativePath.includes('.test.')) {
      return DiscoverySource.TESTS;
    }
    if (DOC_EXTENSIONS.has(entry.extension)) {
      return DiscoverySource.DOCUMENTATION;
    }
    return DiscoverySource.FILE_SYSTEM;
  }

  private determineConfidence(relevance: number): ConfidenceLevel {
    if (relevance >= 0.8) return ConfidenceLevel.HIGH;
    if (relevance >= 0.5) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  }

  private findEntryByPath(searchPath: string): FileIndexEntry | undefined {
    // Try exact match
    const entry = this.fileIndex.get(searchPath);
    if (entry) return entry;

    // Try relative path match
    for (const [, entry] of this.fileIndex) {
      if (entry.relativePath === searchPath) {
        return entry;
      }
    }

    return undefined;
  }

  private resolveImport(fromPath: string, importPath: string): string | null {
    // Skip external packages
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      return null;
    }

    const baseDir = path.dirname(fromPath);
    const resolved = path.resolve(baseDir, importPath);

    // Try with extensions
    for (const ext of ['.ts', '.tsx', '.js', '.jsx', '']) {
      const withExt = resolved + ext;
      if (this.fileIndex.has(withExt)) {
        return withExt;
      }

      // Try index file
      const indexPath = path.join(resolved, `index${ext}`);
      if (this.fileIndex.has(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }

  private tokenize(str: string): string[] {
    // Split by common separators
    return str
      .split(/[-_.\s]+/)
      .filter((s) => s.length > 0)
      .flatMap((s) => {
        // Split camelCase
        return s.split(/(?=[A-Z])/).map((part) => part.toLowerCase());
      });
  }

  private generateId(filePath: string): string {
    const relative = path.relative(this.options.rootPath, filePath);
    return `ctx_${Buffer.from(relative).toString('base64').substring(0, 16)}`;
  }

  private generateCacheKey(query: DiscoveryQuery): string {
    return JSON.stringify({
      keywords: query.keywords.sort(),
      patterns: query.filePatterns?.sort(),
      types: query.contextTypes?.sort(),
      sources: query.sources?.sort(),
      max: query.maxResults,
      min: query.minRelevance,
    });
  }

  private getCachedResult(key: string): DiscoveredContext[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    return entry.results;
  }

  private cacheResult(key: string, results: DiscoveredContext[]): void {
    // Enforce cache size limit
    if (this.cache.size >= this.options.maxCacheSize) {
      // Remove oldest entries
      const sortedEntries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].createdAt - b[1].createdAt
      );
      for (let i = 0; i < this.options.maxCacheSize / 4; i++) {
        this.cache.delete(sortedEntries[i][0]);
      }
    }

    const now = Date.now();
    this.cache.set(key, {
      results,
      createdAt: now,
      expiresAt: now + this.options.cacheTTLMs,
      hitCount: 0,
    });
  }
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

/**
 * Create a new context discoverer
 */
export function createContextDiscoverer(options: DiscoveryOptions): ContextDiscoverer {
  return new ContextDiscoverer(options);
}

/**
 * Global discoverer instance
 */
let globalDiscoverer: ContextDiscoverer | null = null;

/**
 * Get or create global discoverer
 */
export function getGlobalDiscoverer(rootPath?: string): ContextDiscoverer {
  if (!globalDiscoverer) {
    globalDiscoverer = createContextDiscoverer({
      rootPath: rootPath || process.cwd(),
    });
  }
  return globalDiscoverer;
}

/**
 * Reset global discoverer
 */
export function resetGlobalDiscoverer(): void {
  globalDiscoverer = null;
}

/**
 * Quick discovery helper
 */
export async function discoverContext(
  keywords: string[],
  options?: Partial<DiscoveryQuery>
): Promise<DiscoveredContext[]> {
  const discoverer = getGlobalDiscoverer();
  return discoverer.discover({
    keywords,
    ...options,
  });
}
