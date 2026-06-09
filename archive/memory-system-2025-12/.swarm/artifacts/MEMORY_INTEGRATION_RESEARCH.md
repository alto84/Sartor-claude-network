# Memory Integration Research Findings

*Research conducted by RESEARCHER agent - 2025-12-15*

---

## Executive Summary

The MCP Memory Server provides file-based persistent storage for agent coordination. However, **spawned agents do not automatically have memory access** - explicit integration is required. Credentials should **NOT** be stored in the memory system.

---

## 1. HOW THE MCP MEMORY SERVER WORKS

**Architecture:**
- **Type**: File-based MCP server using JSON-line storage (JSONL format)
- **Location**: `/home/alton/agent-community-game/shared-memory/`
- **Transport**: Stdio-based MCP protocol (JSON-RPC)
- **Storage**: Direct filesystem with file locking for concurrent writes

**Core Components:**
1. **MCP Server** (`mcp-server.js`):
   - Implements 5 core tools: `create_memory_entity`, `create_memory_relation`, `query_memory`, `get_memory_status`, `cleanup_memory`
   - Uses Map-based in-memory cache for performance
   - Implements file-based locking to prevent concurrent write conflicts

2. **Memory Channels** (from config.json):
   - `agent-status`: Current agent states (30-day retention)
   - `community-insights`: Shared learnings (permanent, 500MB max)
   - `active-context`: Current high-priority info (7-day retention)
   - `archived-knowledge`: Compressed history (permanent, 1GB max)
   - `coordination`: Inter-agent communication (14-day retention)

3. **Entity Format**:
```json
{
  "type": "entity",
  "name": "unique_identifier",
  "entityType": "agent|task|insight|event",
  "observations": ["discrete_information_strings"],
  "metadata": {
    "channel": "channel_name",
    "timestamp": "ISO8601",
    "priority": "low|medium|high|critical",
    "agent_id": "identifier"
  }
}
```

---

## 2. CAN SPAWNED AGENTS ACCESS MEMORY?

**Current Status**: Requires explicit integration; NOT automatic.

**Evidence**: The MCP Orchestrator spawns Claude Code instances, but:
- Each spawned agent has full Claude Code capabilities (Bash, Read, Write, etc.)
- **However**: Memory system access requires explicit client connection
- Missing layer: No automatic memory client bootstrap in spawn process

**What's Required**:
```javascript
import { createMemoryClient } from './shared-memory/clients/mcp-client.js';
const memory = createMemoryClient(agentId, agentType);
await memory.connect();
```

---

## 3. GIVING COORDINATOR AGENTS MEMORY ACCESS

**Implementation Path**:

1. **Make Memory Server Discoverable**:
   - Export: `MCP_MEMORY_SERVER_PATH` environment variable
   - Spawn memory server process if not running
   - Store connection details in `.claude/session-env/`

2. **Bootstrap Memory Client on Agent Spawn**:
   - Inject memory client initialization into spawned agent
   - Pass `AGENT_ID`, `AGENT_TYPE`, `MEMORY_SERVER_CONFIG` as env vars
   - Wait for memory connection before marking agent "ready"

3. **Connection Pool Strategy**:
```
Main Agent
├─ Spawn Memory Server process (if needed)
├─ Create connection pool
└─ Spawned Agents
    ├─ Use shared connection pool
    └─ Auto-discover memory server address
```

---

## 4. CREDENTIALS IN MEMORY SYSTEM?

**Strong Recommendation**: NO - Do not store credentials in memory system

**Why Not**:
1. No field-level encryption within entities
2. All administrative agents can read all entities
3. File-based storage: credentials written to disk
4. From ARCHITECTURE.md: "No sensitive data storage (passwords, API keys)"

**Better Approach - Store References Only**:
```javascript
await memory.createEntity({
  channel: 'coordination',
  name: `credential-ref-${agentId}`,
  entityType: 'credential_reference',
  observations: [
    'Credential Type: API_KEY',
    'Location: ~/.claude/.credentials.json',
    'Agent Access Level: administrative'
  ],
  metadata: {
    credential_key: 'github_token',  // reference only
    secure_storage_path: '.credentials.json'
  }
});
```

**Actual Credential Storage**:
- Use: `/home/alton/.claude/.credentials.json`
- Use environment variables for runtime
- Implement separate credential manager service

---

## 5. RECOMMENDED ARCHITECTURE

```
Current State:
┌─ Main Claude Instance
│  └─ Orchestrator MCP Server
│     └─ Spawns Claude agents (claude -p)
│        └─ NO automatic memory access
│
├─ Separate Memory Server
│  └─ File-based storage
│  └─ Manual connection required

Recommended State:
┌─ Main Claude Instance
│  ├─ Memory Server Manager (ensures running)
│  └─ Orchestrator MCP Server
│     └─ Spawns agents WITH memory bootstrap
│        └─ Auto-connects to memory system
│
└─ Persistent Memory Server (daemon)
   └─ Manages all agents' persistent knowledge
   └─ Enables true agent coordination
```

---

## Key Integration Gaps

1. No automatic memory discovery for spawned agents
2. No built-in credential management
3. No inter-agent notification system (only polling)
4. Authentication is agent-ID based, not cryptographic

---

*This research provides foundation for building agent memory infrastructure.*
