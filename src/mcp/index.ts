/**
 * MCP Module Index
 *
 * Exports MCP server components for the memory system.
 */

// Note: The memory-server.ts is meant to be run as a standalone process,
// not imported as a module. Use: npx ts-node src/mcp/memory-server.ts
//
// Or configure in Claude Desktop:
// {
//   "mcpServers": {
//     "sartor-memory": {
//       "command": "npx",
//       "args": ["ts-node", "src/mcp/memory-server.ts"],
//       "cwd": "/path/to/Sartor-claude-network"
//     }
//   }
// }

export const MCP_SERVER_PATH = './memory-server.ts';
