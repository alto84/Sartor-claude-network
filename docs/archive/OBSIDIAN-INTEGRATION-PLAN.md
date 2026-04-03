# Obsidian + Sartor Claude Network Integration Plan

## Executive Summary

This document outlines the integration of Obsidian vault access into the Sartor Claude Network, creating a unified system where:
- Claude.ai (web) can read/write to your Obsidian vault via MCP
- Claude Code (CLI) can access the same vault
- Notes feed into the 3-tier memory system for semantic search and learning
- The self-improving agent can learn from your knowledge base
- Family dashboard data (calendar, tasks, notes) flows through a single architecture

**Key Insight**: The Sartor Claude Network already has MCP server infrastructure, multi-tier memory, and Firebase/GitHub backends. We're extending it, not building from scratch.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Claude.ai (Web)         Claude Code (CLI)         Claude Desktop           │
│       │                        │                         │                   │
│       ▼                        ▼                         ▼                   │
│  Streamable HTTP            Direct                    STDIO                  │
│  (OAuth 2.1)               Integration               Transport              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKER (MCP Gateway)                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Endpoints:                                                          │    │
│  │   /mcp          - Streamable HTTP (Claude.ai)                       │    │
│  │   /sse          - SSE fallback (legacy)                             │    │
│  │   /health       - Health check                                      │    │
│  │   /oauth/*      - OAuth 2.1 flow                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Tools Exposed:                                                             │
│  ├── obsidian_* (vault operations)                                          │
│  ├── memory_* (Sartor memory system)                                        │
│  ├── search_* (semantic search across both)                                 │
│  └── dashboard_* (family dashboard aggregation)                             │
│                                                                             │
│  URL: https://sartor-mcp.altonsartor.workers.dev                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
┌───────────────────────────────────┐   ┌───────────────────────────────────┐
│     CLOUDFLARE TUNNEL             │   │       FIREBASE/FIRESTORE          │
│     (obsidian-api.sartor.net)     │   │       (Memory Tiers)              │
│                                   │   │                                   │
│  ┌─────────────────────────────┐  │   │  ┌─────────────────────────────┐  │
│  │ Local Obsidian REST API     │  │   │  │ Hot Tier (Firebase RTDB)    │  │
│  │ https://127.0.0.1:27124     │  │   │  │ - Active session data       │  │
│  │                             │  │   │  │ - Note metadata cache       │  │
│  │ Operations:                 │  │   │  │ - <100ms latency            │  │
│  │ - Read/Write notes          │  │   │  └─────────────────────────────┘  │
│  │ - Search vault              │  │   │  ┌─────────────────────────────┐  │
│  │ - Execute commands          │  │   │  │ Warm Tier (Firestore)       │  │
│  │ - Periodic notes            │  │   │  │ - Semantic search           │  │
│  │                             │  │   │  │ - Note embeddings           │  │
│  └─────────────────────────────┘  │   │  │ - 100-500ms latency         │  │
│              │                    │   │  └─────────────────────────────┘  │
│              ▼                    │   │  ┌─────────────────────────────┐  │
│  ┌─────────────────────────────┐  │   │  │ Cold Tier (GitHub)          │  │
│  │ Obsidian Desktop            │  │   │  │ - Note version history      │  │
│  │ (Windows/Mac)               │  │   │  │ - Long-term archival        │  │
│  │                             │  │   │  │ - 1-5s latency              │  │
│  │ Vault: C:\...\SartorVault   │  │   │  └─────────────────────────────┘  │
│  └─────────────────────────────┘  │   │                                   │
└───────────────────────────────────┘   └───────────────────────────────────┘
                                                        │
                                                        ▼
                                        ┌───────────────────────────────────┐
                                        │     SARTOR CLAUDE NETWORK         │
                                        │     (Self-Improving Agent)        │
                                        │                                   │
                                        │  - HypothesisGenerator            │
                                        │  - SelfImprovingLoop              │
                                        │  - Multi-Expert Orchestrator      │
                                        │  - Ollama (gpuserver1)            │
                                        │                                   │
                                        │  Notes inform:                    │
                                        │  - Pattern learning               │
                                        │  - Task context                   │
                                        │  - Decision history               │
                                        └───────────────────────────────────┘
```

---

## Phase 1: Local Obsidian Setup (30 minutes)

### 1.1 Install Obsidian Local REST API Plugin

1. Open Obsidian
2. Settings → Community plugins → Browse
3. Search "Local REST API" by coddingtonbear
4. Install and enable
5. Settings → Local REST API:
   - Note the **API Key** (64-char hex string)
   - Port: `27124` (HTTPS)
   - Enable "Bind to localhost only" (we'll expose via tunnel)

### 1.2 Verify Local API

```powershell
# From Windows (PowerShell)
$headers = @{ "Authorization" = "Bearer YOUR_API_KEY" }
Invoke-RestMethod -Uri "https://127.0.0.1:27124/" -Headers $headers -SkipCertificateCheck

# Expected: JSON with vault info
```

---

## Phase 2: Cloudflare Tunnel (1 hour)

### 2.1 Install Cloudflared

```powershell
# Windows
winget install --id Cloudflare.cloudflared
```

### 2.2 Authenticate

```bash
cloudflared tunnel login
# Opens browser - authorize with Cloudflare account
```

### 2.3 Create Named Tunnel

```bash
cloudflared tunnel create obsidian-vault
# Note the Tunnel ID (UUID)
```

### 2.4 Configure Tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: C:\Users\alto8\.cloudflared\YOUR_TUNNEL_ID.json

ingress:
  - hostname: obsidian-api.sartor.net
    service: https://localhost:27124
    originRequest:
      noTLSVerify: true  # Obsidian uses self-signed cert
  - service: http_status:404
```

### 2.5 Route DNS

```bash
cloudflared tunnel route dns obsidian-vault obsidian-api.sartor.net
```

### 2.6 Run as Service

```powershell
# Install as Windows service
cloudflared service install

# Or run manually for testing
cloudflared tunnel run obsidian-vault
```

### 2.7 Verify Tunnel

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://obsidian-api.sartor.net/
```

---

## Phase 3: Extend Sartor Claude Network (2-3 hours)

### 3.1 Add Obsidian MCP Server

Create `src/mcp/obsidian-server.ts`:

```typescript
/**
 * Obsidian MCP Server
 *
 * Exposes Obsidian vault operations through MCP protocol,
 * integrated with Sartor memory system for persistence and search.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MemorySystem } from "../memory/memory-system";
import { MemoryType } from "../memory/memory-schema";

interface ObsidianConfig {
  apiUrl: string;      // https://obsidian-api.sartor.net or localhost
  apiKey: string;
  syncToMemory: boolean;
}

async function obsidianFetch(config: ObsidianConfig, path: string, options: RequestInit = {}) {
  const response = await fetch(`${config.apiUrl}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Accept': 'application/vnd.olrapi.note+json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Obsidian API error: ${response.status}`);
  }

  return response.json();
}

export async function createObsidianMCPServer(
  config: ObsidianConfig,
  memorySystem?: MemorySystem
) {
  const server = new Server({
    name: "sartor-obsidian",
    version: "1.0.0",
  }, {
    capabilities: { tools: {} }
  });

  // ===== VAULT OPERATIONS =====

  server.setRequestHandler("tools/list", async () => ({
    tools: [
      {
        name: "obsidian_list",
        description: "List files and folders in the Obsidian vault",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Subdirectory path (empty for root)" }
          }
        }
      },
      {
        name: "obsidian_read",
        description: "Read a note's content and metadata",
        inputSchema: {
          type: "object",
          properties: {
            filepath: { type: "string", description: "Path to note (e.g., 'folder/note.md')" }
          },
          required: ["filepath"]
        }
      },
      {
        name: "obsidian_write",
        description: "Create or replace a note",
        inputSchema: {
          type: "object",
          properties: {
            filepath: { type: "string", description: "Path for note" },
            content: { type: "string", description: "Markdown content" }
          },
          required: ["filepath", "content"]
        }
      },
      {
        name: "obsidian_append",
        description: "Append content to an existing note",
        inputSchema: {
          type: "object",
          properties: {
            filepath: { type: "string", description: "Path to note" },
            content: { type: "string", description: "Content to append" }
          },
          required: ["filepath", "content"]
        }
      },
      {
        name: "obsidian_search",
        description: "Search across all notes in the vault",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" }
          },
          required: ["query"]
        }
      },
      {
        name: "obsidian_daily",
        description: "Get or create today's daily note",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string", description: "Content to append (optional)" }
          }
        }
      },
      {
        name: "obsidian_patch",
        description: "Insert content at a specific heading in a note",
        inputSchema: {
          type: "object",
          properties: {
            filepath: { type: "string" },
            heading: { type: "string", description: "Heading to insert under (e.g., '## Tasks')" },
            content: { type: "string" },
            position: { type: "string", enum: ["beginning", "end"], default: "end" }
          },
          required: ["filepath", "heading", "content"]
        }
      },
      // ===== MEMORY INTEGRATION =====
      {
        name: "obsidian_sync_to_memory",
        description: "Sync a note to Sartor memory system for semantic search",
        inputSchema: {
          type: "object",
          properties: {
            filepath: { type: "string", description: "Note to sync" }
          },
          required: ["filepath"]
        }
      },
      {
        name: "search_all",
        description: "Semantic search across both Obsidian vault and Sartor memories",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            sources: {
              type: "array",
              items: { type: "string", enum: ["obsidian", "memory", "all"] },
              default: ["all"]
            }
          },
          required: ["query"]
        }
      }
    ]
  }));

  server.setRequestHandler("tools/call", async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "obsidian_list": {
        const path = args?.path || "";
        const endpoint = path ? `/vault/${encodeURIComponent(path)}/` : '/vault/';
        const data = await obsidianFetch(config, endpoint);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "obsidian_read": {
        const { filepath } = args as { filepath: string };
        const data = await obsidianFetch(config, `/vault/${encodeURIComponent(filepath)}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "obsidian_write": {
        const { filepath, content } = args as { filepath: string; content: string };
        await obsidianFetch(config, `/vault/${encodeURIComponent(filepath)}`, {
          method: 'PUT',
          body: content,
          headers: { 'Content-Type': 'text/markdown' },
        });

        // Auto-sync to memory if enabled
        if (config.syncToMemory && memorySystem) {
          await memorySystem.createMemory(
            `Note: ${filepath}\n\n${content.substring(0, 1000)}`,
            MemoryType.EPISODIC,
            { tags: ['obsidian', 'note'], importance_score: 0.6 }
          );
        }

        return { content: [{ type: "text", text: `Wrote to ${filepath}` }] };
      }

      case "obsidian_append": {
        const { filepath, content } = args as { filepath: string; content: string };
        await obsidianFetch(config, `/vault/${encodeURIComponent(filepath)}`, {
          method: 'POST',
          body: content,
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Insertion-Position': 'end'
          },
        });
        return { content: [{ type: "text", text: `Appended to ${filepath}` }] };
      }

      case "obsidian_search": {
        const { query } = args as { query: string };
        const data = await obsidianFetch(config, `/search/simple/?query=${encodeURIComponent(query)}`, {
          method: 'POST'
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "obsidian_daily": {
        const { content } = args as { content?: string };
        const data = await obsidianFetch(config, '/periodic/daily/', {
          method: content ? 'POST' : 'GET',
          body: content,
          headers: content ? { 'Content-Type': 'text/markdown' } : {},
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }

      case "obsidian_patch": {
        const { filepath, heading, content, position = 'end' } = args as any;
        await obsidianFetch(config, `/vault/${encodeURIComponent(filepath)}`, {
          method: 'PATCH',
          body: content,
          headers: {
            'Content-Type': 'text/markdown',
            'Target-Type': 'heading',
            'Target': heading,
            'Operation': 'append',
            'Content-Insertion-Position': position,
          },
        });
        return { content: [{ type: "text", text: `Patched ${filepath} at "${heading}"` }] };
      }

      case "obsidian_sync_to_memory": {
        if (!memorySystem) {
          return { content: [{ type: "text", text: "Memory system not configured" }] };
        }
        const { filepath } = args as { filepath: string };
        const note = await obsidianFetch(config, `/vault/${encodeURIComponent(filepath)}`);

        const memoryId = await memorySystem.createMemory(
          `Obsidian Note: ${filepath}\n\nFrontmatter: ${JSON.stringify(note.frontmatter)}\n\nContent:\n${note.content}`,
          MemoryType.SEMANTIC,
          {
            tags: ['obsidian', ...(note.tags || [])],
            importance_score: 0.7,
          }
        );

        return { content: [{ type: "text", text: `Synced to memory: ${memoryId}` }] };
      }

      case "search_all": {
        const { query, sources = ['all'] } = args as { query: string; sources?: string[] };
        const results: any = {};

        if (sources.includes('all') || sources.includes('obsidian')) {
          results.obsidian = await obsidianFetch(config, `/search/simple/?query=${encodeURIComponent(query)}`, {
            method: 'POST'
          });
        }

        if (memorySystem && (sources.includes('all') || sources.includes('memory'))) {
          results.memory = await memorySystem.searchMemories({
            query,
            limit: 10,
          });
        }

        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  return server;
}

// CLI entry point for Claude Desktop
if (import.meta.url === `file://${process.argv[1]}`) {
  const config: ObsidianConfig = {
    apiUrl: process.env.OBSIDIAN_API_URL || 'https://127.0.0.1:27124',
    apiKey: process.env.OBSIDIAN_API_KEY || '',
    syncToMemory: process.env.OBSIDIAN_SYNC_TO_MEMORY === 'true',
  };

  const server = await createObsidianMCPServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```

### 3.2 Add Cloudflare Worker Entry Point

Create `workers/sartor-mcp/src/index.ts`:

```typescript
/**
 * Sartor MCP Gateway - Cloudflare Worker
 *
 * Unified MCP endpoint for Claude.ai supporting:
 * - Obsidian vault operations
 * - Sartor memory system
 * - Semantic search across both
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface Env {
  OBSIDIAN_API_URL: string;
  OBSIDIAN_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  MCP_ACCESS_TOKEN?: string;  // Optional auth token
}

async function obsidianFetch(env: Env, path: string, options: RequestInit = {}) {
  const response = await fetch(`${env.OBSIDIAN_API_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.OBSIDIAN_API_KEY}`,
      'Accept': 'application/vnd.olrapi.note+json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Obsidian API error: ${response.status} - ${text}`);
  }

  return response.json();
}

export class SartorMCP extends McpAgent {
  server = new McpServer({
    name: "sartor-claude-network",
    version: "1.0.0",
  });

  async init() {
    // ===== OBSIDIAN TOOLS =====

    this.server.tool(
      "obsidian_list",
      "List files and folders in the Obsidian vault",
      { path: z.string().optional().describe("Subdirectory path") },
      async ({ path }) => {
        const endpoint = path ? `/vault/${encodeURIComponent(path)}/` : '/vault/';
        const data = await obsidianFetch(this.env, endpoint);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    this.server.tool(
      "obsidian_read",
      "Read a note's content and metadata (frontmatter, tags)",
      { filepath: z.string().describe("Path to note, e.g., 'Projects/myproject.md'") },
      async ({ filepath }) => {
        const data = await obsidianFetch(this.env, `/vault/${encodeURIComponent(filepath)}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    this.server.tool(
      "obsidian_write",
      "Create or overwrite a note with markdown content",
      {
        filepath: z.string().describe("Path for note"),
        content: z.string().describe("Markdown content"),
      },
      async ({ filepath, content }) => {
        await obsidianFetch(this.env, `/vault/${encodeURIComponent(filepath)}`, {
          method: 'PUT',
          body: content,
          headers: { 'Content-Type': 'text/markdown' },
        });
        return { content: [{ type: "text", text: `Created/updated: ${filepath}` }] };
      }
    );

    this.server.tool(
      "obsidian_append",
      "Append content to an existing note",
      {
        filepath: z.string(),
        content: z.string(),
      },
      async ({ filepath, content }) => {
        await obsidianFetch(this.env, `/vault/${encodeURIComponent(filepath)}`, {
          method: 'POST',
          body: content,
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Insertion-Position': 'end'
          },
        });
        return { content: [{ type: "text", text: `Appended to: ${filepath}` }] };
      }
    );

    this.server.tool(
      "obsidian_search",
      "Full-text search across the entire vault",
      { query: z.string().describe("Search query") },
      async ({ query }) => {
        const data = await obsidianFetch(this.env, `/search/simple/?query=${encodeURIComponent(query)}`, {
          method: 'POST'
        });
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    this.server.tool(
      "obsidian_daily",
      "Get or append to today's daily note",
      {
        content: z.string().optional().describe("Content to append (omit to just read)"),
        action: z.enum(['read', 'append']).default('read')
      },
      async ({ content, action }) => {
        if (action === 'append' && content) {
          await obsidianFetch(this.env, '/periodic/daily/', {
            method: 'POST',
            body: content,
            headers: { 'Content-Type': 'text/markdown' },
          });
          return { content: [{ type: "text", text: "Appended to daily note" }] };
        } else {
          const data = await obsidianFetch(this.env, '/periodic/daily/');
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }
      }
    );

    this.server.tool(
      "obsidian_patch",
      "Insert content under a specific heading in a note",
      {
        filepath: z.string(),
        heading: z.string().describe("Heading to insert under, e.g., '## Tasks'"),
        content: z.string(),
        position: z.enum(['beginning', 'end']).default('end'),
      },
      async ({ filepath, heading, content, position }) => {
        await obsidianFetch(this.env, `/vault/${encodeURIComponent(filepath)}`, {
          method: 'PATCH',
          body: content,
          headers: {
            'Content-Type': 'text/markdown',
            'Target-Type': 'heading',
            'Target': heading,
            'Operation': 'append',
            'Content-Insertion-Position': position,
          },
        });
        return { content: [{ type: "text", text: `Inserted under "${heading}" in ${filepath}` }] };
      }
    );

    this.server.tool(
      "obsidian_delete",
      "Delete a note from the vault",
      { filepath: z.string() },
      async ({ filepath }) => {
        await obsidianFetch(this.env, `/vault/${encodeURIComponent(filepath)}`, {
          method: 'DELETE',
        });
        return { content: [{ type: "text", text: `Deleted: ${filepath}` }] };
      }
    );

    // ===== DASHBOARD TOOLS (Future) =====

    this.server.tool(
      "dashboard_summary",
      "Get a summary of today's dashboard: tasks, calendar, notes",
      {},
      async () => {
        // TODO: Aggregate from multiple sources
        const daily = await obsidianFetch(this.env, '/periodic/daily/').catch(() => null);

        const summary = {
          date: new Date().toISOString().split('T')[0],
          dailyNote: daily ? 'exists' : 'not created',
          // calendar: await getCalendarEvents(),
          // tasks: await getTasks(),
        };

        return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
      }
    );
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Optional: Bearer token auth
    if (env.MCP_ACCESS_TOKEN) {
      const auth = request.headers.get('Authorization');
      if (auth !== `Bearer ${env.MCP_ACCESS_TOKEN}`) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // MCP endpoints
    if (url.pathname === "/mcp" || url.pathname === "/sse") {
      return SartorMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "ok",
        server: "sartor-mcp",
        version: "1.0.0"
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Root info
    if (url.pathname === "/") {
      return new Response(JSON.stringify({
        name: "Sartor Claude Network MCP Server",
        endpoints: {
          mcp: "/mcp (Streamable HTTP)",
          sse: "/sse (SSE fallback)",
          health: "/health"
        },
        tools: [
          "obsidian_list", "obsidian_read", "obsidian_write",
          "obsidian_append", "obsidian_search", "obsidian_daily",
          "obsidian_patch", "obsidian_delete", "dashboard_summary"
        ]
      }, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
```

### 3.3 Update package.json

Add to `package.json`:

```json
{
  "scripts": {
    "mcp:obsidian": "tsx src/mcp/obsidian-server.ts",
    "worker:dev": "cd workers/sartor-mcp && wrangler dev",
    "worker:deploy": "cd workers/sartor-mcp && wrangler deploy"
  }
}
```

### 3.4 Create Worker Config

Create `workers/sartor-mcp/wrangler.toml`:

```toml
name = "sartor-mcp"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[vars]
# Non-sensitive defaults

# Secrets (set via wrangler secret put):
# OBSIDIAN_API_URL
# OBSIDIAN_API_KEY
# MCP_ACCESS_TOKEN (optional)
```

---

## Phase 4: Deploy and Connect (1 hour)

### 4.1 Deploy Worker

```bash
cd workers/sartor-mcp

# Set secrets
wrangler secret put OBSIDIAN_API_URL
# Enter: https://obsidian-api.sartor.net

wrangler secret put OBSIDIAN_API_KEY
# Enter: your 64-char API key

wrangler secret put MCP_ACCESS_TOKEN
# Enter: a strong random token for Claude.ai auth

# Deploy
wrangler deploy
```

### 4.2 Connect to Claude.ai

1. Go to [claude.ai](https://claude.ai)
2. Profile → Settings → Connectors
3. Click "Add custom connector"
4. Enter URL: `https://sartor-mcp.altonsartor.workers.dev/sse`
5. If using auth token, add header: `Authorization: Bearer YOUR_MCP_ACCESS_TOKEN`

### 4.3 Test in Claude.ai

```
List the files in my Obsidian vault
```

```
Read the note at "Projects/sartor-network.md"
```

```
Append "- [ ] Review integration plan" to my daily note under the ## Tasks heading
```

---

## Phase 5: Claude Desktop Integration (Optional)

### 5.1 Configure Claude Desktop

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sartor-obsidian": {
      "command": "npx",
      "args": ["tsx", "C:\\Users\\alto8\\Sartor-claude-network\\src\\mcp\\obsidian-server.ts"],
      "env": {
        "OBSIDIAN_API_URL": "https://127.0.0.1:27124",
        "OBSIDIAN_API_KEY": "your-api-key",
        "NODE_TLS_REJECT_UNAUTHORIZED": "0"
      }
    }
  }
}
```

---

## Phase 6: Memory Integration (Future Enhancement)

### 6.1 Sync Notes to Memory Tiers

Notes can flow into the Sartor memory system:

```
Obsidian Note → Hot Tier (metadata, recent access)
             → Warm Tier (embeddings for semantic search)
             → Cold Tier (version history via GitHub)
```

### 6.2 Memory Type Mapping

| Obsidian Content | Memory Type | Use Case |
|------------------|-------------|----------|
| Note content | EPISODIC | Timestamped knowledge |
| Tags, frontmatter | SEMANTIC | Decontextualized facts |
| Workflows, SOPs | PROCEDURAL | Learned patterns |
| Current open note | WORKING | Active context |

### 6.3 Bidirectional Sync

```typescript
// Future: When Sartor learns something, create a note
async function memoryToObsidian(memory: Memory) {
  if (memory.importance_score > 0.8) {
    await obsidianWrite(
      `Learnings/${memory.id}.md`,
      `---
source: sartor-memory
type: ${memory.type}
importance: ${memory.importance_score}
---

${memory.content}`
    );
  }
}
```

---

## Phase 7: Family Dashboard (Future)

### 7.1 Additional Connectors

- **Google Calendar**: Use existing MCP server `@anthropic/mcp-server-google-calendar`
- **Task Manager**: Todoist or Obsidian Tasks plugin
- **Financial**: Plaid for account balances (read-only)

### 7.2 Dashboard Aggregation

The `dashboard_summary` tool will aggregate:
- Today's calendar events
- Open tasks from Obsidian
- Recent notes
- Financial snapshot
- Weather

---

## Security Considerations

### Authentication Layers

1. **Cloudflare Tunnel**: Only exposes Obsidian API through authenticated tunnel
2. **Obsidian API Key**: 256-bit token required for all requests
3. **Worker Auth Token**: Optional bearer token for Claude.ai requests
4. **OAuth 2.1**: For production multi-user scenarios

### Sensitive Data

- Never commit API keys (use wrangler secrets)
- Obsidian vault stays local - only accessed via tunnel
- Firebase rules restrict access to authenticated users

### Network Security

- All traffic over HTTPS
- Tunnel encrypts localhost connection
- Worker runs on Cloudflare edge (DDoS protection)

---

## File Structure After Integration

```
Sartor-claude-network/
├── src/
│   └── mcp/
│       ├── memory-server.ts      # Existing
│       ├── http-server.ts        # Existing
│       ├── obsidian-server.ts    # NEW: Local Obsidian MCP
│       └── obsidian-client.ts    # NEW: Reusable Obsidian API client
├── workers/
│   └── sartor-mcp/               # NEW: Cloudflare Worker
│       ├── src/
│       │   └── index.ts
│       ├── wrangler.toml
│       └── package.json
├── docs/
│   └── OBSIDIAN-INTEGRATION-PLAN.md  # This document
└── .cloudflared/
    └── config.yml                # Tunnel config
```

---

## Quick Start Checklist

- [ ] Install Obsidian Local REST API plugin
- [ ] Note API key from plugin settings
- [ ] Install cloudflared
- [ ] Create and configure tunnel
- [ ] Run tunnel as service
- [ ] Create worker directory
- [ ] Set worker secrets
- [ ] Deploy worker
- [ ] Add connector in Claude.ai
- [ ] Test: "List my Obsidian vault"

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Connection refused" | Obsidian not running | Start Obsidian |
| "401 Unauthorized" | Wrong API key | Check plugin settings |
| "Tunnel not found" | Tunnel not running | `cloudflared tunnel run` |
| Worker timeout | Tunnel down | Check cloudflared service |
| "Certificate error" | Self-signed cert | Add `noTLSVerify: true` |

---

## Next Steps

1. **Immediate**: Set up local Obsidian + tunnel
2. **This week**: Deploy worker, connect Claude.ai
3. **Next week**: Add memory sync, test semantic search
4. **Future**: Calendar, tasks, financial dashboard
