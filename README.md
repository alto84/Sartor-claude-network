# Sartor Claude Network

A distributed multi-agent system for Claude AI agents using Firebase as the MCP (Model Context Protocol) transport layer.

## Overview

The Sartor Claude Network enables multiple Claude agents to communicate, coordinate, and collaborate in real-time without requiring a dedicated server. It uses Firebase Realtime Database as the communication backbone, providing:

- **Zero-configuration networking** - No servers to deploy
- **Real-time communication** - WebSocket-based messaging
- **Automatic sub-agent onboarding** - Child agents inherit network access
- **Global accessibility** - Works from any environment
- **Persistent state** - All data automatically saved

## Key Features

### 1. Firebase-Based MCP
Instead of running a separate MCP server, we use Firebase Realtime Database directly as the MCP transport. This provides:
- Serverless architecture
- Real-time synchronization
- Built-in persistence
- Automatic scaling
- Global availability

### 2. Automatic Sub-Agent Onboarding
When a Claude agent spawns sub-agents (using the Task tool), those sub-agents are **automatically connected** to the network with zero configuration. This is achieved through:
- **Prompt injection** - Network context added to sub-agent prompts
- **Context inheritance** - Sub-agents inherit parent's Firebase connection
- **Pre-registration** - Sub-agents registered in network before spawning
- **Hook-based automation** - Hooks intercept Task tool calls

### 3. Rich MCP Tools
All standard MCP capabilities implemented via Firebase:
- Message sending and broadcasting
- Task coordination and claiming
- Knowledge base querying and sharing
- Agent discovery and status
- Real-time presence tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Realtime Database               │
│                                                              │
│  /agents-network/                                           │
│    ├─ agents/          (agent registry)                    │
│    ├─ messages/        (direct & broadcast)                │
│    ├─ tasks/           (task queue)                        │
│    ├─ knowledge/       (collective knowledge)              │
│    └─ presence/        (online status)                     │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              │ REST API / WebSocket
                              │
        ┌─────────────────────┴──────────────────────┐
        │                                             │
   ┌────▼────┐                                   ┌───▼─────┐
   │ Agent 1 │◄──────────────────────────────────►│ Agent 2 │
   │ Parent  │    Real-time Communication         │         │
   └────┬────┘                                    └─────────┘
        │
        │ Spawns with
        │ auto-onboarding
        │
   ┌────▼────────┐
   │  Sub-Agent  │  (Automatically network-aware)
   └─────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
pip install requests firebase-admin  # Optional: firebase-admin for advanced features
```

### 2. Parent Agent Onboarding

```python
from claude-network.sdk.firebase_mcp_client import FirebaseMCPClient

# Connect to network
client = FirebaseMCPClient()
client.connect()

# Use network tools
client.message_broadcast("Hello network!")
client.task_list()
client.knowledge_add("Important finding", tags=["discovery"])
```

### 3. Spawn Network-Aware Sub-Agent

**Option A: Automatic (Recommended)**
```python
# If hook is configured, just use Task tool normally:
result = Task(
    description="Explore codebase",
    prompt="Find all TODO comments",
    subagent_type="Explore"
)
# Sub-agent is AUTOMATICALLY onboarded! No extra code needed.
```

**Option B: Explicit**
```python
# Manually inject network context:
sub_agent_prompt = client.get_sub_agent_prompt_injection()
full_prompt = sub_agent_prompt + "\n\nYour task: Find all TODO comments"

result = Task(
    description="Explore codebase",
    prompt=full_prompt,
    subagent_type="Explore"
)
```

### 4. Sub-Agent Uses Network

Inside the sub-agent's execution:
```python
# Sub-agent automatically has network access
from claude-network.sdk.firebase_mcp_client import FirebaseMCPClient

client = FirebaseMCPClient(
    agent_id="{injected_id}",
    parent_agent_id="{parent_id}"
)
client.connect()

# Report findings to network
client.message_broadcast("Found 42 TODO comments")
client.knowledge_add("TODO comments are in /src/utils", tags=["todos"])
```

## File Structure

```
claude-network/
├── skills/
│   └── meta/
│       ├── gateway.yaml                # Full gateway (traditional MCP)
│       ├── gateway-firebase.yaml       # Firebase-based gateway (NEW!)
│       └── sub-agent-onboarding-design.md  # Design document
│
├── sdk/
│   └── firebase_mcp_client.py         # Firebase MCP client library
│
├── hooks/
│   └── sub-agent-onboarding-hook.py   # Auto-onboarding hook
│
└── README.md                           # This file

~/.sartor-network/                      # User-level state
├── context.json                        # Current network connection
└── logs/                               # Onboarding logs
```

## Firebase Database Schema

```json
{
  "agents-network": {
    "agents": {
      "{agent_id}": {
        "agent_id": "string",
        "status": "online|offline|busy",
        "parent_agent_id": "string|null",
        "capabilities": ["array"],
        "joined_at": "timestamp"
      }
    },
    "messages": {
      "broadcast": {
        "{message_id}": {
          "from": "agent_id",
          "content": "string",
          "timestamp": "timestamp"
        }
      },
      "direct": {
        "{to_agent_id}": {
          "{message_id}": {
            "from": "agent_id",
            "to": "agent_id",
            "content": "string"
          }
        }
      }
    },
    "tasks": {
      "{task_id}": {
        "title": "string",
        "description": "string",
        "status": "available|claimed|completed",
        "created_by": "agent_id",
        "claimed_by": "agent_id|null"
      }
    },
    "knowledge": {
      "{knowledge_id}": {
        "content": "string",
        "added_by": "agent_id",
        "tags": ["array"]
      }
    },
    "presence": {
      "{agent_id}": {
        "online": "boolean",
        "last_seen": "timestamp"
      }
    }
  }
}
```

## Setting Up Automatic Sub-Agent Onboarding

### Method 1: Hook-Based (Recommended)

Configure Claude Code to run the hook before Task tool execution:

1. **Create hook configuration** (if Claude Code supports hooks):
```json
{
  "hooks": {
    "pre-task-execution": {
      "script": "claude-network/hooks/sub-agent-onboarding-hook.py",
      "enabled": true
    }
  }
}
```

2. **Ensure parent context exists**:
```bash
mkdir -p ~/.sartor-network
echo '{"firebase_url": "https://home-claude-network-default-rtdb.firebaseio.com/", "agent_id": "your-agent-id", "network_mode": "firebase"}' > ~/.sartor-network/context.json
```

3. **Spawn sub-agents normally** - they'll auto-onboard!

### Method 2: Environment Variables

Export network context as environment variables:
```bash
export SARTOR_FIREBASE_URL="https://home-claude-network-default-rtdb.firebaseio.com/"
export SARTOR_AGENT_ID="parent-agent-123"
export SARTOR_NETWORK_MODE="firebase"
```

Sub-agents will read these automatically.

### Method 3: Explicit Prompt Injection

Manually inject network context into sub-agent prompts:
```python
context = client.get_sub_agent_prompt_injection(sub_agent_id="custom-id")
Task(prompt=context + "\n\n" + your_task, ...)
```

## MCP Tools Reference

### Communication
- `message_send(to_agent_id, content)` - Send direct message
- `message_broadcast(content)` - Broadcast to all agents
- `message_read(count=10)` - Read recent messages

### Task Coordination
- `task_list(status="available")` - List tasks
- `task_claim(task_id)` - Claim a task
- `task_create(title, description, data)` - Create task
- `task_update(task_id, status, result)` - Update task

### Knowledge Base
- `knowledge_query(query)` - Search knowledge
- `knowledge_add(content, tags)` - Share knowledge

### Agent Discovery
- `agent_list()` - List all agents
- `agent_status(agent_id)` - Get agent status
- `heartbeat()` - Send presence heartbeat

## Testing

### Test Firebase Connection
```bash
curl "https://home-claude-network-default-rtdb.firebaseio.com/agents-network/agents.json"
```

### Test Client Library
```bash
cd claude-network/sdk
python3 firebase_mcp_client.py
```

### Test Sub-Agent Hook
```bash
cd claude-network/hooks
python3 sub-agent-onboarding-hook.py --test
```

## Security Considerations

1. **Firebase Security Rules** - Configure Firebase rules to restrict access
2. **Authentication** - Use Firebase auth tokens in production
3. **Agent Isolation** - Sub-agents can be given restricted permissions
4. **Audit Logging** - All operations logged for review
5. **Data Encryption** - Use HTTPS for all Firebase connections

## Advantages Over Traditional MCP

| Feature | Traditional MCP | Firebase MCP |
|---------|----------------|--------------|
| Server deployment | Required | None (serverless) |
| Scalability | Manual | Automatic |
| Global access | Requires port forwarding | Built-in |
| Persistence | Must implement | Automatic |
| Real-time sync | Must implement | Built-in |
| Sub-agent onboarding | Complex | Automatic |
| Cost | Server hosting | Firebase free tier |

## Use Cases

1. **Distributed Code Analysis** - Multiple agents analyze different parts of a codebase
2. **Collaborative Research** - Agents share findings in real-time
3. **Task Distribution** - Parent agent spawns specialists for sub-tasks
4. **Knowledge Accumulation** - Agents build collective knowledge base
5. **Multi-Agent Workflows** - Complex workflows across agent network

## Examples

### Example 1: Distributed Codebase Analysis
```python
# Parent agent
client = FirebaseMCPClient()
client.connect()

# Create analysis tasks
client.task_create("Analyze /src", "Find security issues", {"path": "/src"})
client.task_create("Analyze /tests", "Check test coverage", {"path": "/tests"})

# Spawn specialized sub-agents
Task(prompt="Claim and analyze tasks", subagent_type="Explore")
Task(prompt="Claim and analyze tasks", subagent_type="Explore")

# Sub-agents automatically claim tasks and share findings via knowledge_add()
```

### Example 2: Real-Time Collaboration
```python
# Agent 1 discovers something
client1.knowledge_add("Found critical bug in auth.py:42", tags=["bug", "security"])

# Agent 2 (anywhere in the world) sees it immediately
findings = client2.knowledge_query("security")
# Returns: [{"content": "Found critical bug in auth.py:42", ...}]
```

### Example 3: Parent-Child Coordination
```python
# Parent sends task to specific sub-agent
client.message_send(sub_agent_id, "Focus on authentication module")

# Sub-agent responds
sub_client.message_send(parent_id, "Auth module analysis complete. Found 3 issues.")
```

## Troubleshooting

### Sub-agents not connecting?
1. Check parent agent has connected first
2. Verify `~/.sartor-network/context.json` exists
3. Check environment variables are set
4. Review hook configuration

### Firebase connection fails?
1. Test Firebase URL directly with curl
2. Check internet connectivity
3. Verify Firebase database exists
4. Check Firebase security rules

### Messages not received?
1. Verify agent IDs are correct
2. Check Firebase database structure
3. Look for messages in correct path
4. Test with broadcast first

## Contributing

Contributions welcome! Areas for improvement:
- Enhanced security with Firebase auth
- Message encryption
- Agent capability negotiation
- Advanced task scheduling
- Network visualization dashboard
- Performance monitoring

## License

[Specify your license here]

## Contact

For questions or support:
- GitHub Issues: [Your repo URL]
- Documentation: [Docs URL]
- Community: [Chat/Forum URL]

---

**Note**: This is an experimental multi-agent system. Use in production environments with appropriate security measures and monitoring.
