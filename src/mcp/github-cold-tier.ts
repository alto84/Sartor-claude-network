/**
 * GitHub Cold Tier Storage Backend
 *
 * Implements long-term archival storage for memories using GitHub repository.
 * Organizes memories by date: memories/YYYY/MM/memories-YYYY-MM-DD.json
 *
 * Features:
 * - Date-based organization for easy browsing
 * - Local caching to reduce API calls
 * - Graceful degradation without credentials
 * - Rate limit handling
 * - Batch archival support
 */

import { Octokit } from '@octokit/rest';
import { MemoryType } from './file-store';

interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  importance_score: number;
  tags: string[];
  created_at: string;
  access_count?: number;
  last_accessed?: string;
}

interface MemoryMetadata {
  id: string;
  type: MemoryType;
  importance_score: number;
  created_at: string;
  archived_at: string;
  file_path: string;
}

export interface MemoryQuery {
  type?: MemoryType[];
  min_importance?: number;
  tags?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  limit?: number;
}

interface ColdTierStats {
  total_memories: number;
  by_type: Record<MemoryType, number>;
  oldest_memory: string | null;
  newest_memory: string | null;
  total_size_bytes: number;
  storage_backend: string;
  cache_hit_rate: number;
}

interface CacheEntry {
  data: Memory[];
  timestamp: number;
  sha: string;
}

/**
 * GitHub-based cold tier storage with local caching
 */
export class GitHubColdTier {
  private client: Octokit | null = null;
  private owner: string;
  private repo: string;
  private basePath: string;
  private enabled: boolean = false;

  // Local cache to reduce GitHub API calls
  private cache: Map<string, CacheEntry> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Rate limiting
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 100; // 100ms between requests

  constructor(
    token?: string,
    owner?: string,
    repo?: string,
    basePath = 'memories'
  ) {
    this.owner = owner || process.env.GITHUB_OWNER || '';
    this.repo = repo || process.env.GITHUB_REPO || '';
    this.basePath = basePath;

    const authToken = token || process.env.GITHUB_TOKEN;

    if (!authToken || !this.owner || !this.repo) {
      console.warn('[GitHubColdTier] Missing credentials - operating in degraded mode');
      console.warn('[GitHubColdTier] Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO to enable');
      this.enabled = false;
      return;
    }

    try {
      this.client = new Octokit({ auth: authToken });
      this.enabled = true;
      console.error(`[GitHubColdTier] Initialized for ${this.owner}/${this.repo}`);
    } catch (error) {
      console.error('[GitHubColdTier] Failed to initialize:', error);
      this.enabled = false;
    }
  }

  /**
   * Archive memories to GitHub organized by date
   */
  async archive(memories: Memory[]): Promise<void> {
    if (!this.enabled || !this.client) {
      console.warn('[GitHubColdTier] Cannot archive - not configured');
      return;
    }

    if (memories.length === 0) {
      return;
    }

    // Group memories by date
    const memoriesByDate = this.groupByDate(memories);

    // Archive each date group
    const dateEntries = Array.from(memoriesByDate.entries());
    for (const [date, dateMemories] of dateEntries) {
      try {
        await this.archiveForDate(date, dateMemories);
      } catch (error) {
        console.error(`[GitHubColdTier] Failed to archive memories for ${date}:`, error);
      }
    }

    // Invalidate cache for archived dates
    const dates = Array.from(memoriesByDate.keys());
    for (const date of dates) {
      const filePath = this.getFilePathForDate(date);
      this.cache.delete(filePath);
    }
  }

  /**
   * Retrieve memories matching query
   */
  async retrieve(query: MemoryQuery): Promise<Memory[]> {
    if (!this.enabled || !this.client) {
      return [];
    }

    try {
      const allMemories: Memory[] = [];

      // Determine date range to search
      const dateRange = this.getDateRange(query);

      for (const date of dateRange) {
        const filePath = this.getFilePathForDate(date);
        const memories = await this.loadMemoriesFromFile(filePath);
        allMemories.push(...memories);
      }

      // Apply filters
      return this.filterMemories(allMemories, query);
    } catch (error) {
      console.error('[GitHubColdTier] Retrieval failed:', error);
      return [];
    }
  }

  /**
   * List memory metadata (without loading full content)
   */
  async list(options: { limit?: number } = {}): Promise<MemoryMetadata[]> {
    if (!this.enabled || !this.client) {
      return [];
    }

    try {
      const metadata: MemoryMetadata[] = [];
      const files = await this.listAllMemoryFiles();

      for (const file of files) {
        const memories = await this.loadMemoriesFromFile(file);
        for (const memory of memories) {
          metadata.push({
            id: memory.id,
            type: memory.type,
            importance_score: memory.importance_score,
            created_at: memory.created_at,
            archived_at: new Date().toISOString(),
            file_path: file,
          });

          if (options.limit && metadata.length >= options.limit) {
            return metadata;
          }
        }
      }

      return metadata;
    } catch (error) {
      console.error('[GitHubColdTier] List failed:', error);
      return [];
    }
  }

  /**
   * Get statistics about cold tier storage
   */
  async getStats(): Promise<ColdTierStats> {
    const stats: ColdTierStats = {
      total_memories: 0,
      by_type: {
        [MemoryType.EPISODIC]: 0,
        [MemoryType.SEMANTIC]: 0,
        [MemoryType.PROCEDURAL]: 0,
        [MemoryType.WORKING]: 0,
        [MemoryType.REFINEMENT_TRACE]: 0,
        [MemoryType.EXPERT_CONSENSUS]: 0,
      },
      oldest_memory: null,
      newest_memory: null,
      total_size_bytes: 0,
      storage_backend: this.enabled ? 'github' : 'disabled',
      cache_hit_rate: this.getCacheHitRate(),
    };

    if (!this.enabled) {
      return stats;
    }

    try {
      const metadata = await this.list();
      stats.total_memories = metadata.length;

      for (const mem of metadata) {
        stats.by_type[mem.type]++;

        if (!stats.oldest_memory || mem.created_at < stats.oldest_memory) {
          stats.oldest_memory = mem.created_at;
        }
        if (!stats.newest_memory || mem.created_at > stats.newest_memory) {
          stats.newest_memory = mem.created_at;
        }
      }

      // Estimate size (rough approximation)
      stats.total_size_bytes = metadata.length * 1024; // ~1KB per memory
    } catch (error) {
      console.error('[GitHubColdTier] Stats failed:', error);
    }

    return stats;
  }

  /**
   * Check if GitHub cold tier is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Clear local cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  // ============================================================================
  // Backward Compatibility Methods (for multi-tier-store.ts)
  // ============================================================================

  /**
   * Get a single memory by path (backward compatible with old interface)
   */
  async get(path: string): Promise<any> {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      const fullPath = this.joinPath(this.basePath, path);

      // Check cache first
      const cachedFile = this.getCached(fullPath);
      if (cachedFile && cachedFile.data.length === 1) {
        return cachedFile.data[0];
      }

      // Rate limiting
      await this.rateLimitDelay();

      const response = await this.client.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      });

      if (Array.isArray(response.data)) {
        throw new Error(`Directory: ${path}`);
      }

      if (!('content' in response.data) || !response.data.content) {
        throw new Error(`No content: ${path}`);
      }

      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw new Error(`Get failed: ${error.message}`);
    }
  }

  /**
   * Set a single memory by path (backward compatible with old interface)
   */
  async set(path: string, content: any, message: string): Promise<void> {
    if (!this.enabled || !this.client) {
      console.warn('[GitHubColdTier] Cannot set - not configured');
      return;
    }

    try {
      const fullPath = this.joinPath(this.basePath, path);
      const jsonContent = JSON.stringify(content, null, 2);
      const base64Content = Buffer.from(jsonContent).toString('base64');

      // Rate limiting
      await this.rateLimitDelay();

      let sha: string | undefined;
      try {
        const existing = await this.client.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: fullPath,
        });
        if (!Array.isArray(existing.data)) {
          sha = existing.data.sha;
        }
      } catch {
        // File doesn't exist
      }

      await this.client.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
        message,
        content: base64Content,
        ...(sha && { sha }),
      });

      // Invalidate cache for this path
      this.cache.delete(fullPath);
    } catch (error: any) {
      throw new Error(`Set failed: ${error.message}`);
    }
  }

  /**
   * Delete a memory by path (backward compatible with old interface)
   */
  async delete(path: string, message: string): Promise<void> {
    if (!this.enabled || !this.client) {
      console.warn('[GitHubColdTier] Cannot delete - not configured');
      return;
    }

    try {
      const fullPath = this.joinPath(this.basePath, path);

      // Rate limiting
      await this.rateLimitDelay();

      const response = await this.client.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
      });

      if (Array.isArray(response.data)) {
        throw new Error(`Directory: ${path}`);
      }

      await this.client.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path: fullPath,
        message,
        sha: response.data.sha,
      });

      // Invalidate cache
      this.cache.delete(fullPath);
    } catch (error: any) {
      if (error.status === 404) {
        return;
      }
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Join path parts into a single path
   */
  private joinPath(...parts: string[]): string {
    return parts
      .filter((p) => p)
      .join('/')
      .replace(/\/+/g, '/');
  }

  /**
   * Group memories by date (YYYY-MM-DD)
   */
  private groupByDate(memories: Memory[]): Map<string, Memory[]> {
    const groups = new Map<string, Memory[]>();

    for (const memory of memories) {
      const date = memory.created_at.split('T')[0]; // YYYY-MM-DD
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(memory);
    }

    return groups;
  }

  /**
   * Archive memories for a specific date
   */
  private async archiveForDate(date: string, memories: Memory[]): Promise<void> {
    if (!this.client) return;

    const filePath = this.getFilePathForDate(date);

    // Rate limiting
    await this.rateLimitDelay();

    try {
      // Load existing memories for this date
      const existing = await this.loadMemoriesFromFile(filePath, false);

      // Merge with new memories (deduplicate by ID)
      const memoryMap = new Map<string, Memory>();
      for (const mem of existing) {
        memoryMap.set(mem.id, mem);
      }
      for (const mem of memories) {
        memoryMap.set(mem.id, mem);
      }

      const allMemories = Array.from(memoryMap.values());
      const content = JSON.stringify(allMemories, null, 2);
      const base64Content = Buffer.from(content).toString('base64');

      // Get current file SHA if it exists
      let sha: string | undefined;
      try {
        const response = await this.client.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
        });
        if (!Array.isArray(response.data)) {
          sha = response.data.sha;
        }
      } catch (error: any) {
        if (error.status !== 404) {
          throw error;
        }
        // File doesn't exist yet
      }

      // Create or update file
      await this.client.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: `Archive ${memories.length} memories for ${date}`,
        content: base64Content,
        ...(sha && { sha }),
      });

      console.error(`[GitHubColdTier] Archived ${memories.length} memories to ${filePath}`);
    } catch (error) {
      console.error(`[GitHubColdTier] Archive failed for ${date}:`, error);
      throw error;
    }
  }

  /**
   * Load memories from a specific file path
   */
  private async loadMemoriesFromFile(
    filePath: string,
    useCache = true
  ): Promise<Memory[]> {
    if (!this.client) return [];

    // Check cache first
    if (useCache) {
      const cached = this.getCached(filePath);
      if (cached) {
        this.cacheHits++;
        return cached.data;
      }
      this.cacheMisses++;
    }

    // Rate limiting
    await this.rateLimitDelay();

    try {
      const response = await this.client.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
      });

      if (Array.isArray(response.data)) {
        return [];
      }

      if (!('content' in response.data) || !response.data.content) {
        return [];
      }

      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      const memories = JSON.parse(content) as Memory[];

      // Cache the result
      if (useCache) {
        this.setCached(filePath, memories, response.data.sha);
      }

      return memories;
    } catch (error: any) {
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get file path for a given date
   */
  private getFilePathForDate(date: string): string {
    const [year, month] = date.split('-');
    return `${this.basePath}/${year}/${month}/memories-${date}.json`;
  }

  /**
   * Get date range to search based on query
   */
  private getDateRange(query: MemoryQuery): string[] {
    const dates: string[] = [];

    if (query.date_range) {
      const start = new Date(query.date_range.start);
      const end = new Date(query.date_range.end);

      const current = new Date(start);
      while (current <= end) {
        dates.push(this.formatDate(current));
        current.setDate(current.getDate() + 1);
      }
    } else {
      // Default: search last 30 days
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(this.formatDate(date));
      }
    }

    return dates;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * List all memory files in the repository
   */
  private async listAllMemoryFiles(): Promise<string[]> {
    if (!this.client) return [];

    const files: string[] = [];

    try {
      // List year directories
      const yearsResponse = await this.client.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: this.basePath,
      });

      if (!Array.isArray(yearsResponse.data)) {
        return [];
      }

      for (const yearDir of yearsResponse.data) {
        if (yearDir.type !== 'dir') continue;

        // List month directories
        const monthsResponse = await this.client.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: yearDir.path,
        });

        if (!Array.isArray(monthsResponse.data)) continue;

        for (const monthDir of monthsResponse.data) {
          if (monthDir.type !== 'dir') continue;

          // List memory files
          const filesResponse = await this.client.repos.getContent({
            owner: this.owner,
            repo: this.repo,
            path: monthDir.path,
          });

          if (!Array.isArray(filesResponse.data)) continue;

          for (const file of filesResponse.data) {
            if (file.type === 'file' && file.name.endsWith('.json')) {
              files.push(file.path);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.status === 404) {
        return [];
      }
      console.error('[GitHubColdTier] Failed to list files:', error);
    }

    return files;
  }

  /**
   * Filter memories based on query criteria
   */
  private filterMemories(memories: Memory[], query: MemoryQuery): Memory[] {
    let filtered = memories;

    if (query.type && query.type.length > 0) {
      filtered = filtered.filter((m) => query.type!.includes(m.type));
    }

    if (query.min_importance !== undefined) {
      filtered = filtered.filter((m) => m.importance_score >= query.min_importance!);
    }

    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter((m) =>
        query.tags!.some((tag) => m.tags.includes(tag))
      );
    }

    // Sort by importance (descending) and created_at (descending)
    filtered.sort((a, b) => {
      if (b.importance_score !== a.importance_score) {
        return b.importance_score - a.importance_score;
      }
      return b.created_at.localeCompare(a.created_at);
    });

    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  /**
   * Get cached entry if valid
   */
  private getCached(filePath: string): CacheEntry | null {
    const entry = this.cache.get(filePath);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.CACHE_TTL) {
      this.cache.delete(filePath);
      return null;
    }

    return entry;
  }

  /**
   * Set cache entry
   */
  private setCached(filePath: string, data: Memory[], sha: string): void {
    this.cache.set(filePath, {
      data,
      timestamp: Date.now(),
      sha,
    });
  }

  /**
   * Calculate cache hit rate
   */
  private getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    if (total === 0) return 0;
    return this.cacheHits / total;
  }

  /**
   * Rate limiting delay
   */
  private async rateLimitDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const delay = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }
}

/**
 * Factory function to create GitHub cold tier instance
 */
export function createGitHubColdTier(
  token?: string,
  owner?: string,
  repo?: string,
  basePath?: string
): GitHubColdTier {
  return new GitHubColdTier(token, owner, repo, basePath);
}

/**
 * Export the interface for cold tier stores
 */
export interface ColdTierStore {
  archive(memories: Memory[]): Promise<void>;
  retrieve(query: MemoryQuery): Promise<Memory[]>;
  list(options?: { limit?: number }): Promise<MemoryMetadata[]>;
  getStats(): Promise<ColdTierStats>;
  isEnabled(): boolean;
  clearCache(): void;
}
