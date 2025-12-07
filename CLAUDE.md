# CLAUDE.md - Project Context for Claude Code

## Project: Sartor-Claude-Network v1.0.0

Multi-tier episodic memory system with refinement-powered executive orchestration.

## Quick Start

When starting a session in this project:
1. Check `MASTER_PLAN.md` for current phase and priorities
2. Review `.claude/AGENT_INIT.md` for role definitions
3. Use `.claude/SPAWNING_TEMPLATE.md` when delegating to subagents

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Executive Claude                    │
│         (Orchestrates via refinement loops)          │
├─────────────────────────────────────────────────────┤
│  Planner  │  Implementer  │  Auditor  │  Cleaner   │
├─────────────────────────────────────────────────────┤
│                   Memory System                      │
│   Hot (<100ms)  │  Warm (<500ms)  │  Cold (<2s)    │
├─────────────────────────────────────────────────────┤
│                 Skills Library                       │
│  (7 skills with self-auditing + refinement)         │
└─────────────────────────────────────────────────────┘
```

## Key Commands

```bash
npm run demo      # See self-improvement in action
npm run benchmark # Check performance metrics
npm test          # Run test suite
npm run build     # Compile TypeScript
npm run mcp       # Start MCP server (stdio, for Claude Desktop)
npm run mcp:http  # Start MCP HTTP server (port 3001, for agents)
```

## MCP Server (Memory Context Protocol)

The project includes an MCP server that exposes the memory system as callable tools for Claude Desktop and other MCP-compatible clients.

### Starting the Server

**For Claude Desktop (stdio):**
```bash
npm run mcp
```

**For Agents (HTTP):**
```bash
npm run mcp:http
```

The HTTP server runs on `http://localhost:3001/mcp` and provides JSON-RPC access to the memory system for agents and other HTTP clients.

### Available Tools

The MCP server provides 4 tools for memory operations:

1. **memory_create** - Create a new memory
   - Parameters: `content` (string), `type` (episodic|semantic|procedural|working), `importance` (0-1, optional), `tags` (array, optional)
   - Returns: Memory ID and type

2. **memory_get** - Retrieve a memory by ID
   - Parameters: `id` (string)
   - Returns: Full memory object with metadata

3. **memory_search** - Search memories by filters
   - Parameters: `type` (optional), `min_importance` (optional), `limit` (default: 10)
   - Returns: Array of matching memories with relevance scores

4. **memory_stats** - Get system statistics
   - Returns: Memory system metrics (counts, performance data)

### Configuring Claude Desktop

To use the MCP server with Claude Desktop:

1. Open `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
2. Add the MCP server configuration:

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

3. Restart Claude Desktop
4. The memory tools will be automatically available in conversations

### Using HTTP Server (For Agents)

The HTTP server provides the same memory tools via HTTP transport, allowing agents to access the memory system directly:

1. Start the server: `npm run mcp:http`
2. Server runs on: `http://localhost:3001/mcp`
3. Protocol: MCP Streamable HTTP with JSON responses
4. Session-based: Server manages sessions with unique IDs

**Example HTTP Request:**
```javascript
// Initialize session
const response = await fetch('http://localhost:3001/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'my-agent', version: '1.0.0' }
    }
  })
});

const sessionId = response.headers.get('mcp-session-id');
// Use sessionId in subsequent requests
```

## Available Skills

Skills in `.claude/skills/`:
- `memory-access.md` - Use the 3-tier memory system
- `refinement-protocol.md` - Execute with iterative refinement
- `agent-roles.md` - Understand the 4 agent roles

## Spawning Subagents

When using the Task tool, always include:
1. **Role** (Planner/Implementer/Auditor/Cleaner)
2. **Scope** (files they can touch)
3. **Context** (current phase, relevant background)
4. **Constraints** (CAN/CANNOT boundaries)

See `.claude/SPAWNING_TEMPLATE.md` for examples.

## Core Principles

1. **Refinement First**: Generate → Evaluate → Refine
2. **Evidence-Based**: No assumptions, verify claims
3. **Self-Auditing**: Check your own work before completing
4. **Memory-Driven**: Record learnings, retrieve patterns
5. **Role-Scoped**: Stay within your assigned boundaries
