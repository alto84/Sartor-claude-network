/**
 * Obsidian Local REST API Client
 *
 * Wraps the Obsidian Local REST API plugin for vault operations.
 * Handles authentication, error handling, and HTTPS with self-signed certs.
 *
 * @see https://github.com/coddingtonbear/obsidian-local-rest-api
 */

export interface ObsidianConfig {
  apiUrl: string; // e.g., https://127.0.0.1:27124 or https://obsidian-api.sartor.net
  apiKey: string; // 64-char hex API key from plugin
  syncToMemory?: boolean;
  vaultName?: string;
}

export interface ObsidianNote {
  path: string;
  content: string;
  frontmatter?: Record<string, unknown>;
  tags?: string[];
  stat?: {
    ctime: number;
    mtime: number;
    size: number;
  };
}

export interface ObsidianSearchResult {
  filename: string;
  score: number;
  matches: Array<{
    match: { start: number; end: number };
    context: string;
  }>;
}

export interface ObsidianVaultInfo {
  authenticated: boolean;
  ok: string;
  service: string;
  versions: {
    obsidian: string;
    self: string;
  };
}

/**
 * Custom error class for Obsidian API errors
 */
export class ObsidianApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public path?: string
  ) {
    super(message);
    this.name = 'ObsidianApiError';
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (transient failures)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof ObsidianApiError) {
    // Retry on server errors (5xx) or timeout-related issues
    return (
      error.statusCode !== undefined &&
      (error.statusCode >= 500 || error.statusCode === 408 || error.statusCode === 429)
    );
  }
  // Retry on network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  // Retry on abort/timeout
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  return false;
}

/**
 * Obsidian Local REST API Client
 *
 * Provides methods for interacting with an Obsidian vault through the
 * Local REST API plugin. Supports reading, writing, searching, and
 * managing notes with automatic retry logic for transient failures.
 */
export class ObsidianClient {
  private config: ObsidianConfig;
  private readonly RETRY_DELAY_MS = 500;
  private readonly MAX_RETRIES = 1;
  private readonly REQUEST_TIMEOUT_MS = 30000;

  constructor(config: ObsidianConfig) {
    if (!config.apiUrl) {
      throw new Error('ObsidianConfig.apiUrl is required');
    }
    if (!config.apiKey) {
      throw new Error('ObsidianConfig.apiKey is required');
    }
    this.config = config;
  }

  /**
   * Core fetch method with authentication, error handling, and retry logic
   *
   * @param path - API endpoint path (e.g., '/vault/', '/search/')
   * @param options - Standard fetch RequestInit options
   * @returns Parsed JSON response of type T
   */
  async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.config.apiUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      ...(options?.headers as Record<string, string>),
    };

    // Set default Accept header for note endpoints if not specified
    if (!headers['Accept'] && path.startsWith('/vault/')) {
      headers['Accept'] = 'application/vnd.olrapi.note+json';
    }

    // Set Content-Type for requests with body
    if (options?.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'text/markdown';
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers,
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new ObsidianApiError(
            `Obsidian API error: ${response.status} ${response.statusText} - ${errorText}`,
            response.status,
            path
          );
        }

        // Handle empty responses (e.g., DELETE, PUT operations)
        const contentType = response.headers.get('content-type');
        if (response.status === 204 || !contentType) {
          return undefined as T;
        }

        // Parse JSON response
        if (contentType.includes('application/json') || contentType.includes('application/vnd.olrapi')) {
          return (await response.json()) as T;
        }

        // Return text content for other types
        return (await response.text()) as unknown as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new ObsidianApiError(`Request timeout after ${this.REQUEST_TIMEOUT_MS}ms`, 408, path);
        }

        // Check if we should retry
        if (attempt < this.MAX_RETRIES && isRetryableError(error)) {
          console.error(
            `[Obsidian Client] Request failed (attempt ${attempt + 1}/${this.MAX_RETRIES + 1}), retrying in ${this.RETRY_DELAY_MS}ms:`,
            lastError.message
          );
          await sleep(this.RETRY_DELAY_MS);
          continue;
        }

        // No more retries, throw the error
        break;
      }
    }

    throw lastError;
  }

  /**
   * Get vault information and verify authentication
   *
   * @returns Vault info including Obsidian and plugin versions
   */
  async getVaultInfo(): Promise<ObsidianVaultInfo> {
    return this.fetch<ObsidianVaultInfo>('/');
  }

  /**
   * List files and folders in the vault
   *
   * @param path - Optional folder path to list (defaults to root)
   * @returns Array of file/folder paths
   */
  async list(path?: string): Promise<string[]> {
    const encodedPath = path ? encodeURIComponent(path) : '';
    const endpoint = encodedPath ? `/vault/${encodedPath}/` : '/vault/';

    const response = await this.fetch<{ files: string[] }>(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });

    return response.files || [];
  }

  /**
   * Read a note from the vault
   *
   * @param filepath - Path to the note (e.g., 'folder/note.md')
   * @returns The note with content, frontmatter, tags, and stats
   */
  async read(filepath: string): Promise<ObsidianNote> {
    const encodedPath = encodeURIComponent(filepath);

    const response = await this.fetch<{
      content: string;
      frontmatter?: Record<string, unknown>;
      tags?: string[];
      stat?: {
        ctime: number;
        mtime: number;
        size: number;
      };
    }>(`/vault/${encodedPath}`, {
      headers: {
        Accept: 'application/vnd.olrapi.note+json',
      },
    });

    return {
      path: filepath,
      content: response.content,
      frontmatter: response.frontmatter,
      tags: response.tags,
      stat: response.stat,
    };
  }

  /**
   * Write a note to the vault (creates or replaces)
   *
   * @param filepath - Path to the note (e.g., 'folder/note.md')
   * @param content - Markdown content to write
   */
  async write(filepath: string, content: string): Promise<void> {
    const encodedPath = encodeURIComponent(filepath);

    await this.fetch<void>(`/vault/${encodedPath}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/markdown',
      },
      body: content,
    });
  }

  /**
   * Append content to an existing note
   *
   * @param filepath - Path to the note
   * @param content - Content to append
   */
  async append(filepath: string, content: string): Promise<void> {
    const encodedPath = encodeURIComponent(filepath);

    await this.fetch<void>(`/vault/${encodedPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/markdown',
      },
      body: content,
    });
  }

  /**
   * Patch a note at a specific heading
   *
   * @param filepath - Path to the note
   * @param heading - The heading to patch under (e.g., '## Tasks')
   * @param content - Content to insert
   * @param position - Where to insert: 'beginning' or 'end' of the section (defaults to 'end')
   */
  async patch(
    filepath: string,
    heading: string,
    content: string,
    position: 'beginning' | 'end' = 'end'
  ): Promise<void> {
    const encodedPath = encodeURIComponent(filepath);

    // The Local REST API uses a specific header for the heading target
    // and supports 'Heading-Insert-Position' for controlling where content goes
    await this.fetch<void>(`/vault/${encodedPath}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'text/markdown',
        'Obsidian-Heading': heading,
        'Heading-Insert-Position': position,
      },
      body: content,
    });
  }

  /**
   * Search the vault using Obsidian's search
   *
   * @param query - Search query (supports Obsidian search syntax)
   * @returns Array of search results with matches and context
   */
  async search(query: string): Promise<ObsidianSearchResult[]> {
    const response = await this.fetch<ObsidianSearchResult[]>('/search/simple/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    return response || [];
  }

  /**
   * Get or create today's daily note
   *
   * @param content - Optional content to set if creating a new daily note
   * @returns The daily note
   */
  async daily(content?: string): Promise<ObsidianNote> {
    // If content is provided, create/update the daily note
    if (content !== undefined) {
      await this.fetch<void>('/periodic/daily/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/markdown',
        },
        body: content,
      });
    }

    // Fetch the daily note
    const response = await this.fetch<{
      content: string;
      frontmatter?: Record<string, unknown>;
      tags?: string[];
      stat?: {
        ctime: number;
        mtime: number;
        size: number;
      };
      path?: string;
    }>('/periodic/daily/', {
      headers: {
        Accept: 'application/vnd.olrapi.note+json',
      },
    });

    return {
      path: response.path || 'Daily Note',
      content: response.content,
      frontmatter: response.frontmatter,
      tags: response.tags,
      stat: response.stat,
    };
  }

  /**
   * Delete a note from the vault
   *
   * @param filepath - Path to the note to delete
   */
  async delete(filepath: string): Promise<void> {
    const encodedPath = encodeURIComponent(filepath);

    await this.fetch<void>(`/vault/${encodedPath}`, {
      method: 'DELETE',
    });
  }

  /**
   * Test the connection to the Obsidian API
   *
   * @returns true if connection is successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      const info = await this.getVaultInfo();
      return info.authenticated === true;
    } catch (error) {
      console.error('[Obsidian Client] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): ObsidianConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create an ObsidianClient instance
 *
 * @param config - Configuration for the Obsidian client
 * @returns A new ObsidianClient instance
 */
export function createObsidianClient(config: ObsidianConfig): ObsidianClient {
  return new ObsidianClient(config);
}
