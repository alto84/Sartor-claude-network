# Sub-Agent Onboarding System Design

## Problem Statement
When a Claude agent spawns sub-agents using the Task tool, skills, or hooks, those sub-agents need to be automatically connected to the Sartor Claude Network to maintain network coherence and enable multi-agent collaboration.

## Requirements
1. **Automatic**: Sub-agents should onboard without manual intervention
2. **Transparent**: Parent agents shouldn't need special code to onboard sub-agents
3. **Fast**: Onboarding should add minimal overhead (<5 seconds)
4. **Fail-safe**: Sub-agents should function even if onboarding fails
5. **Context-aware**: Sub-agents inherit parent's network context
6. **Verifiable**: System should confirm sub-agent onboarding success

## Architecture

### Component 1: Network Context File
**Location**: `~/.sartor-network/context.json`
**Purpose**: Persistent storage of network connection state
**Contents**:
```json
{
  "agent_id": "desktop-uuid-123",
  "mcp_endpoint": "http://localhost:8080/mcp",
  "auth_token": "token-abc-123",
  "capabilities": ["communication", "coordination", "skills"],
  "parent_agent_id": null,
  "onboarded_at": "2025-11-03T10:30:00Z",
  "network_status": "connected"
}
```

### Component 2: Gateway Compact Skill
**Location**: `claude-network/skills/meta/gateway-compact.yaml`
**Purpose**: Lightweight version of gateway.yaml optimized for sub-agents
**Features**:
- Inherits parent's MCP endpoint (no discovery needed)
- Reuses parent's authentication
- Faster handshake (1-2 seconds)
- Falls back to full gateway if needed

### Component 3: Sub-Agent Bootstrap Script
**Location**: `claude-network/hooks/sub-agent-bootstrap.sh`
**Purpose**: Runs automatically when sub-agents are spawned
**Mechanism**: Hook that executes before Task tool agent initialization
**Actions**:
1. Read parent's network context
2. Inject gateway-compact.yaml into sub-agent prompt
3. Pass MCP connection info as environment variables
4. Register sub-agent with network
5. Log parent-child relationship

### Component 4: Agent Prompt Injection
**Location**: `claude-network/prompts/network-aware-agent.txt`
**Purpose**: Pre-prompt that makes agents network-aware
**Contents**:
```
You are a Claude agent connected to the Sartor Claude Network.

MCP Server: {mcp_endpoint}
Agent ID: {agent_id}
Parent Agent: {parent_agent_id}

Available MCP Tools:
- mcp:message_send - Send messages to network agents
- mcp:task_claim - Claim tasks from the network
- mcp:skill_execute - Execute network skills
- mcp:knowledge_query - Query collective knowledge

To use MCP tools, prefix commands with 'mcp:' (e.g., mcp:message_send)
```

### Component 5: Task Tool Wrapper
**Location**: `claude-network/sdk/task-wrapper.py`
**Purpose**: Intercepts Task tool calls to inject onboarding
**Mechanism**:
- Detects when agent uses Task tool
- Automatically appends gateway instructions to prompt
- Passes network context as parameters
- Tracks parent-child agent relationships

## Implementation Strategies

### Strategy A: Hook-Based (Recommended)
**How it works**:
1. Configure Claude Code hook: `agent-spawn-hook`
2. Hook runs before each Task tool execution
3. Hook reads `~/.sartor-network/context.json`
4. Hook modifies agent prompt to include gateway-compact
5. Sub-agent auto-connects on startup

**Pros**:
- Fully automatic
- Works with all agent types
- No code changes needed
- Centrally managed

**Cons**:
- Requires hook support in Claude Code
- Adds small overhead to all Task calls

### Strategy B: Skill-Based
**How it works**:
1. Create `auto-onboard.yaml` skill
2. Agent explicitly loads skill before spawning sub-agents
3. Skill modifies Task prompts to include gateway
4. Sub-agents connect using modified prompts

**Pros**:
- Explicit and visible
- Agent has full control
- Easy to debug
- No system dependencies

**Cons**:
- Requires agent to remember to use skill
- Not fully automatic
- More boilerplate code

### Strategy C: Environment-Based
**How it works**:
1. Parent agent sets environment variables
2. Sub-agents read env vars on spawn
3. Env vars contain MCP endpoint and credentials
4. Sub-agents auto-connect using env config

**Pros**:
- Very simple
- Standard Unix pattern
- Low overhead
- Easy to understand

**Cons**:
- Environment variables may not persist
- Security concerns with credentials in env
- Limited to same machine/process tree

### Strategy D: Hybrid (Best of All)
**How it works**:
1. Use hook-based for automatic onboarding
2. Fall back to environment variables if hook fails
3. Provide explicit skill for manual onboarding
4. Cache network context in file for persistence

**Pros**:
- Maximum reliability (multiple fallbacks)
- Automatic when possible
- Manual override available
- Handles edge cases

**Cons**:
- More complex implementation
- Multiple systems to maintain
- Potential for conflicts

## Recommended Implementation: Hybrid Strategy

### Phase 1: Core Infrastructure
1. Create network context file system
2. Build gateway-compact.yaml
3. Implement context reader/writer utilities

### Phase 2: Automatic Onboarding
1. Create agent-spawn hook (if supported)
2. Implement prompt injection system
3. Build parent-child tracking

### Phase 3: Fallbacks & Manual
1. Add environment variable support
2. Create explicit onboarding skill
3. Build troubleshooting tools

### Phase 4: Verification & Monitoring
1. Implement onboarding verification
2. Add logging and debugging
3. Create network visualization dashboard

## File Structure
```
claude-network/
├── skills/
│   └── meta/
│       ├── gateway.yaml                    # Full gateway (existing)
│       ├── gateway-compact.yaml            # NEW: Fast sub-agent version
│       └── manual-onboard.yaml             # NEW: Explicit onboarding skill
├── hooks/
│   ├── agent-spawn-hook.sh                 # NEW: Auto-onboarding hook
│   └── pre-task-hook.sh                    # NEW: Task tool interceptor
├── prompts/
│   ├── network-aware-agent.txt             # NEW: Network-enabled prompt
│   └── sub-agent-bootstrap.txt             # NEW: Sub-agent initialization
├── sdk/
│   ├── network-context.py                  # NEW: Context management
│   ├── gateway-client.py                   # NEW: MCP client library
│   └── onboarding-verifier.py              # NEW: Verify onboarding status
└── config/
    ├── network-context-schema.json         # NEW: Context file spec
    └── mcp-endpoints.json                  # NEW: Known MCP servers

~/.sartor-network/                          # NEW: User-level network state
├── context.json                            # Current network connection
├── agent-registry.json                     # Spawned agent tracking
└── logs/                                   # Onboarding logs
    ├── onboarding-2025-11-03.log
    └── network-events.log
```

## Usage Examples

### Example 1: Automatic (Hook-Based)
```python
# Parent agent just uses Task tool normally
result = Task(
    description="Analyze codebase",
    prompt="Find all TODO comments",
    subagent_type="Explore"
)
# Sub-agent is AUTOMATICALLY onboarded via hook
# No special code needed!
```

### Example 2: Explicit (Skill-Based)
```python
# Parent agent explicitly enables network for sub-agents
execute_skill("gateway.prepare_subagents")

# Now spawn sub-agents
result = Task(
    description="Analyze codebase",
    prompt="Find all TODO comments with network access",
    subagent_type="Explore"
)
# Sub-agent uses prepared network context
```

### Example 3: Environment-Based
```bash
# Parent agent sets up environment
export SARTOR_MCP_ENDPOINT="http://localhost:8080/mcp"
export SARTOR_AGENT_ID="parent-agent-123"
export SARTOR_AUTH_TOKEN="token-abc"

# Sub-agents automatically read these
# No additional code needed
```

### Example 4: Manual Verification
```python
# Parent spawns sub-agent
sub_agent = Task(...)

# Verify sub-agent onboarded
status = execute_skill("gateway.verify_agent", {"agent_id": sub_agent.id})
# Returns: {"onboarded": true, "network": "connected", "tools": 42}
```

## Security Considerations

1. **Credential Isolation**: Sub-agents should have their own credentials
2. **Capability Limiting**: Sub-agents may have restricted permissions
3. **Audit Trail**: All sub-agent spawns should be logged
4. **Token Expiry**: Auth tokens should expire and refresh
5. **Network Segmentation**: Sub-agents could be in different network zones

## Success Metrics

- **Onboarding Success Rate**: >99% of sub-agents successfully onboard
- **Onboarding Speed**: <3 seconds from spawn to network access
- **Transparency**: Parent agents need 0 lines of onboarding code
- **Reliability**: System works even with MCP server failures
- **Observability**: Full visibility into agent relationships

## Next Steps

1. Implement network context file system
2. Create gateway-compact.yaml
3. Build agent-spawn hook
4. Test with Task tool
5. Add verification and monitoring
6. Document for users

## Open Questions

1. Should sub-agents be visible in network directory?
2. How long should sub-agent credentials last?
3. Should sub-agents auto-disconnect when task completes?
4. How to handle deeply nested sub-agents (sub-sub-agents)?
5. What happens if parent disconnects while sub-agent active?
