/**
 * Bootstrap Mesh - Unified Multi-Source Memory Interface
 *
 * Tries backends in priority order: MCP HTTP → Local File → GitHub → Firebase
 * Each backend fails gracefully and automatically falls back to the next.
 * Logs backend status to stderr for transparency.
 */

import { FileStore, MemoryType } from './file-store';
import { GitHubColdTier } from '../memory/cold-tier';
import { initializeFirebase, getDatabase } from './firebase-init';
import { Database } from 'firebase-admin/database';

/**
 * Simplified Memory interface (aligned with FileStore)
 */
export interface Memory {
  id: string;
  content: string;
  type: string;
  importance_score: number;
  tags: string[];
  created_at: string;
}

/**
 * Options for loading memories
 */
export interface LoadOptions {
  type?: string;
  minImportance?: number;
  limit?: number;
  tags?: string[];
}

/**
 * Backend status information
 */
export interface BackendStatus {
  mcp: boolean;
  local: boolean;
  github: boolean;
  firebase: boolean;
}

/**
 * Configuration for creating a bootstrap mesh
 */
export interface BootstrapMeshConfig {
  mcpUrl?: string;
  localPath?: string;
  github?: {
    token: string;
    owner: string;
    repo: string;
  };
  firebase?: boolean;
}

/**
 * MCP Session state
 */
interface MCPSession {
  sessionId: string | null;
  initialized: boolean;
  lastUsed: number;
}

/**
 * Bootstrap mesh implementation
 */
export class BootstrapMesh {
  // Backend instances
  private mcpUrl: string;
  private fileStore: FileStore;
  private githubStore: GitHubColdTier | null = null;
  private firebaseDb: Database | null = null;

  // Backend availability
  private mcpAvailable = false;
  private fileAvailable = false;
  private githubAvailable = false;
  private firebaseAvailable = false;

  // MCP session management
  private mcpSession: MCPSession = {
    sessionId: null,
    initialized: false,
    lastUsed: 0,
  };

  // Active backend tracking
  private activeBackend: string = 'none';

  constructor(config?: BootstrapMeshConfig) {
    // Set MCP URL
    this.mcpUrl = config?.mcpUrl || 'http://localhost:3001/mcp';

    // Initialize file store (always available)
    this.fileStore = new FileStore(config?.localPath);
    this.fileAvailable = true;
    console.error('[BootstrapMesh] ✓ Local file store initialized');

    // Initialize GitHub if configured
    if (config?.github) {
      try {
        this.githubStore = new GitHubColdTier(
          config.github.token,
          config.github.owner,
          config.github.repo,
          'memories'
        );
        this.githubAvailable = true;
        console.error('[BootstrapMesh] ✓ GitHub cold tier initialized');
      } catch (error) {
        console.error('[BootstrapMesh] GitHub initialization failed:', error);
      }
    } else if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
      // Try environment variables
      try {
        this.githubStore = new GitHubColdTier(
          process.env.GITHUB_TOKEN,
          process.env.GITHUB_OWNER,
          process.env.GITHUB_REPO,
          'memories'
        );
        this.githubAvailable = true;
        console.error('[BootstrapMesh] ✓ GitHub cold tier initialized from env vars');
      } catch (error) {
        console.error('[BootstrapMesh] GitHub initialization from env failed:', error);
      }
    }

    // Initialize Firebase if requested
    if (config?.firebase !== false) {
      try {
        const success = initializeFirebase();
        if (success) {
          this.firebaseDb = getDatabase();
          if (this.firebaseDb) {
            this.firebaseAvailable = true;
            console.error('[BootstrapMesh] ✓ Firebase hot tier initialized');
          }
        }
      } catch (error) {
        console.error('[BootstrapMesh] Firebase initialization failed:', error);
      }
    }

    // Check MCP availability (async, will be tested on first use)
    this.checkMCPAvailability().catch(() => {
      console.error('[BootstrapMesh] MCP HTTP server not available');
    });

    console.error('[BootstrapMesh] Initialization complete');
  }

  /**
   * Check if MCP HTTP server is available
   */
  private async checkMCPAvailability(): Promise<boolean> {
    try {
      const response = await fetch(this.mcpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'ping',
        }),
      });

      if (response.ok) {
        this.mcpAvailable = true;
        console.error('[BootstrapMesh] ✓ MCP HTTP server is available');
        return true;
      }
    } catch (error) {
      // MCP server not available, will use fallback
    }

    this.mcpAvailable = false;
    return false;
  }

  /**
   * Initialize MCP session if not already done
   */
  private async ensureMCPSession(): Promise<boolean> {
    if (this.mcpSession.initialized && this.mcpSession.sessionId) {
      // Session already initialized and valid
      return true;
    }

    try {
      const response = await fetch(this.mcpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'bootstrap-mesh',
              version: '1.0.0',
            },
          },
        }),
      });

      if (response.ok) {
        const sessionId = response.headers.get('mcp-session-id');
        if (sessionId) {
          this.mcpSession.sessionId = sessionId;
          this.mcpSession.initialized = true;
          this.mcpSession.lastUsed = Date.now();
          console.error('[BootstrapMesh] ✓ MCP session initialized:', sessionId);
          return true;
        }
      }
    } catch (error) {
      console.error('[BootstrapMesh] MCP session initialization failed:', error);
    }

    return false;
  }

  /**
   * Call MCP tool
   */
  private async callMCPTool(toolName: string, args: Record<string, any>): Promise<any> {
    if (!this.mcpAvailable) {
      throw new Error('MCP not available');
    }

    // Ensure session is initialized
    const sessionReady = await this.ensureMCPSession();
    if (!sessionReady) {
      throw new Error('MCP session initialization failed');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.mcpSession.sessionId) {
      headers['mcp-session-id'] = this.mcpSession.sessionId;
    }

    const response = await fetch(this.mcpUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP call failed: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    if (data.error) {
      throw new Error(`MCP error: ${data.error.message}`);
    }

    return data.result?.content?.[0]?.text ? JSON.parse(data.result.content[0].text) : data.result;
  }

  /**
   * Load memories from available backends (tries in priority order)
   */
  async loadMemories(options: LoadOptions = {}): Promise<Memory[]> {
    const { type, minImportance, limit = 10, tags = [] } = options;

    // Try MCP HTTP first
    if (this.mcpAvailable) {
      try {
        console.error('[BootstrapMesh] Trying MCP HTTP...');
        const result = await this.callMCPTool('memory_search', {
          type,
          min_importance: minImportance,
          limit,
        });

        if (result && Array.isArray(result.memories)) {
          this.activeBackend = 'mcp';
          console.error(`[BootstrapMesh] ✓ Loaded ${result.memories.length} memories from MCP`);

          // Filter by tags if specified
          let memories = result.memories;
          if (tags.length > 0) {
            memories = memories.filter((m: Memory) => tags.some((tag) => m.tags?.includes(tag)));
          }

          return memories;
        }
      } catch (error) {
        console.error('[BootstrapMesh] MCP load failed, trying next backend...');
        this.mcpAvailable = false;
      }
    }

    // Try Local File
    if (this.fileAvailable) {
      try {
        console.error('[BootstrapMesh] Trying local file store...');

        const filters: any = {};
        if (type) {
          filters.type = [type as MemoryType];
        }
        if (minImportance !== undefined) {
          filters.min_importance = minImportance;
        }

        let memories = this.fileStore.searchMemories(filters, limit);

        // Filter by tags if specified
        if (tags.length > 0) {
          memories = memories.filter((m) => tags.some((tag) => m.tags.includes(tag)));
        }

        if (memories.length > 0) {
          this.activeBackend = 'local';
          console.error(`[BootstrapMesh] ✓ Loaded ${memories.length} memories from local file`);
          return memories;
        }
      } catch (error) {
        console.error('[BootstrapMesh] Local file load failed:', error);
      }
    }

    // Try GitHub
    if (this.githubAvailable && this.githubStore) {
      try {
        console.error('[BootstrapMesh] Trying GitHub cold tier...');

        const memories: Memory[] = [];
        const types = type ? [type] : ['episodic', 'semantic', 'procedural', 'working'];

        for (const memType of types) {
          const files = await this.githubStore.list(memType);

          for (const file of files.slice(0, limit)) {
            const memory = await this.githubStore.get(`${memType}/${file}`);
            if (memory) {
              // Apply filters
              if (minImportance !== undefined && memory.importance_score < minImportance) {
                continue;
              }
              if (tags.length > 0 && !tags.some((tag) => memory.tags?.includes(tag))) {
                continue;
              }

              memories.push(memory);

              if (memories.length >= limit) break;
            }
          }

          if (memories.length >= limit) break;
        }

        if (memories.length > 0) {
          this.activeBackend = 'github';
          console.error(`[BootstrapMesh] ✓ Loaded ${memories.length} memories from GitHub`);
          return memories;
        }
      } catch (error) {
        console.error('[BootstrapMesh] GitHub load failed:', error);
      }
    }

    // Try Firebase
    if (this.firebaseAvailable && this.firebaseDb) {
      try {
        console.error('[BootstrapMesh] Trying Firebase...');

        const snapshot = await this.firebaseDb.ref('mcp-memories').get();
        if (snapshot.exists()) {
          const memories: Memory[] = [];

          snapshot.forEach((child) => {
            const mem = child.val() as Memory;

            // Apply filters
            if (type && mem.type !== type) return;
            if (minImportance !== undefined && mem.importance_score < minImportance) return;
            if (tags.length > 0 && !tags.some((tag) => mem.tags?.includes(tag))) return;

            memories.push(mem);
          });

          const limited = memories
            .sort((a, b) => b.importance_score - a.importance_score)
            .slice(0, limit);

          if (limited.length > 0) {
            this.activeBackend = 'firebase';
            console.error(`[BootstrapMesh] ✓ Loaded ${limited.length} memories from Firebase`);
            return limited;
          }
        }
      } catch (error) {
        console.error('[BootstrapMesh] Firebase load failed:', error);
      }
    }

    // All backends failed
    this.activeBackend = 'none';
    console.error('[BootstrapMesh] ⚠ All backends failed, returning empty array');
    return [];
  }

  /**
   * Get a specific memory by ID
   */
  async getMemory(id: string): Promise<Memory | null> {
    // Try MCP HTTP first
    if (this.mcpAvailable) {
      try {
        const result = await this.callMCPTool('memory_get', { id });
        if (result?.memory) {
          return result.memory;
        }
      } catch (error) {
        console.error('[BootstrapMesh] MCP get failed:', error);
        this.mcpAvailable = false;
      }
    }

    // Try Local File
    if (this.fileAvailable) {
      const memory = this.fileStore.getMemory(id);
      if (memory) {
        return memory;
      }
    }

    // Try GitHub
    if (this.githubAvailable && this.githubStore) {
      try {
        const types = ['episodic', 'semantic', 'procedural', 'working'];
        for (const type of types) {
          const memory = await this.githubStore.get(`${type}/${id}.json`);
          if (memory) {
            return memory;
          }
        }
      } catch (error) {
        console.error('[BootstrapMesh] GitHub get failed:', error);
      }
    }

    // Try Firebase
    if (this.firebaseAvailable && this.firebaseDb) {
      try {
        const snapshot = await this.firebaseDb.ref(`mcp-memories/${id}`).get();
        if (snapshot.exists()) {
          return snapshot.val() as Memory;
        }
      } catch (error) {
        console.error('[BootstrapMesh] Firebase get failed:', error);
      }
    }

    return null;
  }

  /**
   * Save a memory (writes to first available backend)
   */
  async saveMemory(memory: Omit<Memory, 'id'>): Promise<string> {
    const memoryType = memory.type as MemoryType;

    // Try MCP HTTP first
    if (this.mcpAvailable) {
      try {
        const result = await this.callMCPTool('memory_create', {
          content: memory.content,
          type: memory.type,
          importance: memory.importance_score,
          tags: memory.tags,
        });

        if (result?.id) {
          console.error(`[BootstrapMesh] ✓ Saved memory to MCP: ${result.id}`);
          return result.id;
        }
      } catch (error) {
        console.error('[BootstrapMesh] MCP save failed:', error);
        this.mcpAvailable = false;
      }
    }

    // Try Local File
    if (this.fileAvailable) {
      const created = await this.fileStore.createMemory(memory.content, memoryType, {
        importance_score: memory.importance_score,
        tags: memory.tags,
      });
      console.error(`[BootstrapMesh] ✓ Saved memory to local file: ${created.id}`);
      return created.id;
    }

    // Try Firebase
    if (this.firebaseAvailable && this.firebaseDb) {
      try {
        const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullMemory = {
          id,
          ...memory,
          created_at: new Date().toISOString(),
        };

        await this.firebaseDb.ref(`mcp-memories/${id}`).set(fullMemory);
        console.error(`[BootstrapMesh] ✓ Saved memory to Firebase: ${id}`);
        return id;
      } catch (error) {
        console.error('[BootstrapMesh] Firebase save failed:', error);
      }
    }

    // Try GitHub (last resort, slowest)
    if (this.githubAvailable && this.githubStore) {
      try {
        const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullMemory = {
          id,
          ...memory,
          created_at: new Date().toISOString(),
        };

        await this.githubStore.set(
          `${memory.type}/${id}.json`,
          fullMemory,
          `Create memory: ${memory.content.substring(0, 50)}`
        );
        console.error(`[BootstrapMesh] ✓ Saved memory to GitHub: ${id}`);
        return id;
      } catch (error) {
        console.error('[BootstrapMesh] GitHub save failed:', error);
      }
    }

    throw new Error('All backends failed to save memory');
  }

  /**
   * Get status of all backends
   */
  getBackendStatus(): BackendStatus {
    return {
      mcp: this.mcpAvailable,
      local: this.fileAvailable,
      github: this.githubAvailable,
      firebase: this.firebaseAvailable,
    };
  }

  /**
   * Get which backend is currently active
   */
  getActiveBackend(): string {
    return this.activeBackend;
  }
}

/**
 * Factory function to create a bootstrap mesh
 */
export function createBootstrapMesh(config?: BootstrapMeshConfig): BootstrapMesh {
  return new BootstrapMesh(config);
}
