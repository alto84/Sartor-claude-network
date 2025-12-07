# MCP Memory Servers

This directory contains two MCP (Model Context Protocol) servers that expose the memory system:

## 1. Stdio Server (`memory-server.ts`)

**Purpose:** For Claude Desktop integration
**Transport:** stdio (Standard Input/Output)
**Command:** `npm run mcp`

This server is designed to be used with Claude Desktop via the MCP protocol. It communicates over stdio, making it suitable for process-based integrations.

### Configuration for Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sartor-memory": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/path/to/sartor-claude-network"
    }
  }
}
```

## 2. HTTP Server (`http-server.ts`)

**Purpose:** For agent-to-agent communication
**Transport:** HTTP with JSON-RPC
**Command:** `npm run mcp:http`
**Port:** 3001
**Endpoint:** `http://localhost:3001/mcp`

This server provides HTTP access to the same memory tools, allowing agents and HTTP clients to interact with the memory system directly.

### Features

- Session-based with unique session IDs
- JSON responses (not SSE streams)
- Supports GET, POST, DELETE methods
- Automatic session cleanup on close

### Example Usage

See `/home/user/Sartor-claude-network/test-mcp-http.ts` for a complete working example.

Basic flow:
1. POST to `/mcp` with `initialize` method to create session
2. Server returns `mcp-session-id` in response headers
3. Use session ID in subsequent requests
4. DELETE to `/mcp` to close session

## Available Tools

Both servers provide the same 4 tools:

1. **memory_create** - Create a new memory
   - Parameters: `content`, `type`, `importance` (optional), `tags` (optional)

2. **memory_get** - Retrieve a memory by ID
   - Parameters: `id`

3. **memory_search** - Search memories
   - Parameters: `type` (optional), `min_importance` (optional), `limit` (optional)

4. **memory_stats** - Get system statistics
   - No parameters

## Implementation Notes

- Both servers use the same memory store implementation
- Memory is stored in-memory (not persistent across restarts)
- HTTP server uses `StreamableHTTPServerTransport` from MCP SDK
- Stdio server uses `StdioServerTransport` from MCP SDK
- Both implement the MCP 2024-11-05 protocol version
