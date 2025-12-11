/**
 * Memory MCP Client
 * Wrapper for calling memory tools via MCP
 */

export interface MemoryClient {
  create(
    content: string,
    type: string,
    options?: { importance?: number; tags?: string[] }
  ): Promise<{ id: string }>;
  get(id: string): Promise<any>;
  search(options?: { type?: string; min_importance?: number; limit?: number }): Promise<any[]>;
  stats(): Promise<{ total_memories: number; by_type: Record<string, number> }>;
}

// This would be used when MCP tools are available
// For now, provide a mock implementation for testing
export class MockMemoryClient implements MemoryClient {
  private memories: Map<string, any> = new Map();

  async create(content: string, type: string, options?: { importance?: number; tags?: string[] }) {
    const id = 'mem_' + Date.now();
    this.memories.set(id, { id, content, type, ...options });
    return { id };
  }

  async get(id: string) {
    return this.memories.get(id) || null;
  }

  async search(options?: { type?: string; min_importance?: number; limit?: number }) {
    const results = Array.from(this.memories.values());
    return results.slice(0, options?.limit || 10);
  }

  async stats() {
    const by_type: Record<string, number> = {};
    for (const mem of this.memories.values()) {
      by_type[mem.type] = (by_type[mem.type] || 0) + 1;
    }
    return { total_memories: this.memories.size, by_type };
  }
}

export function createMemoryClient(): MemoryClient {
  // TODO: BLOCKER - Real MCP client implementation needed
  // This should connect to actual MCP server or FileStore
  // Current MockMemoryClient is NOT production-ready
  // Options:
  //   1. Integrate with FileStore (src/storage/file-store.ts)
  //   2. Implement real MCP protocol client
  //   3. Use stdio/HTTP transport to MCP server (src/mcp/server.ts)
  throw new Error(
    'createMemoryClient() requires real implementation. ' +
    'MockMemoryClient should only be used in tests. ' +
    'See TODO comment for integration options.'
  );
}
