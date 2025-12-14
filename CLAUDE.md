# CLAUDE.md - Project Context for Claude Code

## Project: Sartor-Claude-Network v1.0.0

Multi-tier episodic memory system with refinement-powered executive orchestration.

## ORCHESTRATOR BOOTSTRAP (READ FIRST)

**If you are the main Claude Code instance, you are the ORCHESTRATOR.**

Your role is **COORDINATION, NOT EXECUTION**. Before doing any substantial work:

1. **ASK**: Can a subagent do this? → If yes, delegate via Task tool
2. **CHECK**: Read `.claude/ORCHESTRATOR_BOOTSTRAP.md` for full protocol
3. **LOAD**: Search Memory MCP for `importance >= 0.9` directives

**Key Directive** (from Memory MCP):

> Main Claude Code must DELEGATE work to subagents, not do it directly.
> Only do direct work for simple edits or when coordinating/synthesizing results.

**Self-Check Every Turn**:

- [ ] Am I about to do substantial work directly? → DELEGATE
- [ ] Could this be parallelized? → Spawn multiple agents
- [ ] Am I updating skills/hooks/rules as I learn? → IMPROVE SYSTEMS

## Quick Start

When starting a session in this project:

1. **READ `.claude/ORCHESTRATOR_BOOTSTRAP.md`** - Understand your role as coordinator
2. Check `MASTER_PLAN.md` for current phase and priorities
3. Review `.claude/AGENT_INIT.md` for role definitions
4. Use `.claude/SPAWNING_TEMPLATE.md` when delegating to subagents
5. Search Memory MCP for high-importance directives

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Executive Claude                    │
│         (Orchestrates via refinement loops)          │
├─────────────────────────────────────────────────────┤
│  Planner  │  Implementer  │  Auditor  │  Cleaner   │
├─────────────────────────────────────────────────────┤
│              Subagent Coordination                   │
│   Bootstrap │ Registry │ Messaging │ Distribution  │
├─────────────────────────────────────────────────────┤
│              Experience Enhancement                  │
│   Auto-Discovery │ Relevance │ Intelligence         │
├─────────────────────────────────────────────────────┤
│                   Memory System                      │
│   Hot (<100ms)  │  Warm (<500ms)  │  Cold (<2s)    │
├─────────────────────────────────────────────────────┤
│                 Skills Library                       │
│  (7 skills with self-auditing + refinement)         │
└─────────────────────────────────────────────────────┘
```

## Subagent System

The subagent system provides infrastructure for spawning, managing, and coordinating autonomous agents.

### Modules

- **bootstrap.ts** - Subagent onboarding with capability validation
- **registry.ts** - Agent discovery, heartbeat monitoring, status tracking
- **messaging.ts** - Priority-based message queuing with pub/sub topics

### Usage

```typescript
import {
  createSubagent,
  createRegistry,
  createMessageBus,
  AgentRole,
  AgentStatus,
} from './subagent';

// Bootstrap a subagent
const subagent = await createSubagent({
  role: AgentRole.IMPLEMENTER,
  name: 'code-writer',
  capabilities: ['typescript', 'testing'],
});

// Register and track agents
const registry = createRegistry();
registry.registerSubagent(subagent.id, { role: subagent.role });
registry.heartbeat(subagent.id, AgentStatus.ACTIVE);
```

## Coordination System

CRDT-based coordination for conflict-free multi-agent collaboration.

### Modules

- **plan-sync.ts** - CRDT-powered plan synchronization with LWW registers
- **work-distribution.ts** - Optimistic locking task assignment
- **progress.ts** - Multi-agent progress tracking with milestones

### Usage

```typescript
import { createPlanSyncService, createDistributor, createProgressTracker } from './coordination';

// Create synchronized plan
const planSync = createPlanSyncService('agent-1');
const plan = planSync.createPlan('Project', 'Description');

// Distribute work
const distributor = createDistributor(registry);
const task = distributor.createTask('Implement feature');
const claim = distributor.claimTask(task.id, 'agent-1');

// Track progress
const tracker = createProgressTracker();
tracker.reportProgress('agent-1', task.id, 50, ProgressStatus.IN_PROGRESS);
```

## Experience Enhancement

Intelligent context discovery and adaptive learning for subagents.

### Modules

- **auto-discover.ts** - File/code discovery with relevance scoring
- **relevance.ts** - Multi-signal relevance filtering with usage tracking
- **intelligence.ts** - Pattern learning and success prediction

### Usage

```typescript
import { createContextDiscoverer, createRelevanceFilter, createIntelligence } from './experience';

// Discover relevant context
const discoverer = createContextDiscoverer({ rootPath: '/project' });
const context = await discoverer.discover({ keywords: ['api', 'client'] });

// Filter by relevance
const filter = createRelevanceFilter({ threshold: 0.5 });
const ranked = filter.filter(items, signalExtractor);

// Predict task success
const intelligence = createIntelligence();
const prediction = intelligence.predict('code_review', { complexity: 0.3 });
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
    Accept: 'application/json, text/event-stream',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'my-agent', version: '1.0.0' },
    },
  }),
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

1. **Delegation First**: Orchestrator coordinates, subagents execute
2. **Refinement Loop**: Generate → Evaluate → Refine
3. **Evidence-Based**: No assumptions, verify claims
4. **Self-Auditing**: Check your own work before completing
5. **Memory-Driven**: Record learnings, retrieve patterns
6. **Role-Scoped**: Stay within your assigned boundaries
7. **Continuous Improvement**: Update skills/hooks/rules as you learn

## Continuous Improvement Protocol

As you work, actively improve these bootstrap systems:

| System    | Location                            | When to Update                     |
| --------- | ----------------------------------- | ---------------------------------- |
| Skills    | `.claude/skills/`                   | New learnings, patterns discovered |
| Hooks     | `.claude/hooks.json`                | New anti-patterns to prevent       |
| Memory    | `data/memories.json`                | Directives, facts, procedures      |
| Bootstrap | `.claude/ORCHESTRATOR_BOOTSTRAP.md` | Protocol improvements              |
| Templates | `.claude/SPAWNING_TEMPLATE.md`      | New required skills for agents     |

**Memory Types**:

- SEMANTIC (importance 0.9+): User directives, critical facts
- PROCEDURAL (importance 0.7-0.8): Successful patterns, methods
- EPISODIC (importance 0.5-0.7): Session events, context
