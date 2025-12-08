/**
 * MCP Module Index
 *
 * Exports MCP server components and memory client for the Sartor memory system.
 *
 * ## Running the Memory MCP Server
 *
 * The memory server exposes the 3-tier episodic memory system as MCP tools that
 * Claude and other AI applications can call. It runs as a standalone process.
 *
 * ### Option 1: Command Line (Development)
 * ```bash
 * npx ts-node src/mcp/memory-server.ts
 * ```
 *
 * ### Option 2: Claude Desktop Configuration
 * Add to your Claude Desktop config (~/.claude/claude_desktop_config.json):
 * ```json
 * {
 *   "mcpServers": {
 *     "sartor-memory": {
 *       "command": "npx",
 *       "args": ["ts-node", "src/mcp/memory-server.ts"],
 *       "cwd": "/path/to/Sartor-claude-network"
 *     }
 *   }
 * }
 * ```
 *
 * ### Available Tools
 * Once running, the server provides:
 * - **memory_create**: Create a new memory (episodic/semantic/procedural/working)
 * - **memory_get**: Retrieve a memory by ID
 * - **memory_search**: Search memories by type and importance
 * - **memory_stats**: Get memory system statistics
 *
 * ### Memory Client Library
 * For programmatic access within Node.js, import the memory system directly:
 * ```typescript
 * import { MemorySystem } from '../memory/memory-system';
 * const memory = new MemorySystem();
 * ```
 */

// MCP Server metadata
export const MCP_SERVER_NAME = 'sartor-memory';
export const MCP_SERVER_VERSION = '1.0.0';
export const MCP_SERVER_PATH = './memory-server.ts';

// Export MemorySystem for programmatic use
export { MemorySystem, type Memory } from '../memory/memory-system';
export { MemoryType } from '../memory/memory-schema';

// Export MCP HTTP Client for agent communication
export { MCPHttpClient } from './mcp-http-client';

// Export Bootstrap Mesh for unified multi-source memory access
export {
  BootstrapMesh,
  createBootstrapMesh,
  type Memory as BootstrapMemory,
  type LoadOptions,
  type BackendStatus,
  type BootstrapMeshConfig,
} from './bootstrap-mesh';

// Export Local Memory Reader for direct file access (no server required)
export {
  LocalMemoryReader,
  quickLoadMemories,
  type Memory as LocalMemory,
  type SearchOptions,
  type MemoryStats as LocalMemoryStats,
} from './local-memory-reader';
