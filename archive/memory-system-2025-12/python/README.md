# Sartor Python SDK

Python utilities for the Sartor Claude Network - enabling cross-platform agent communication between Windows (Executive Claude) and Linux GPU servers.

## Installation

```bash
cd python
pip install -e .
```

## Modules

### Message Queue (`sartor.message_queue`)

File-based message queue for inter-agent communication that works across platforms.

```python
from sartor import MessageQueue, MessageType

# Executive Claude (Windows)
exec_queue = MessageQueue("/path/to/queue", "executive-claude")
task = exec_queue.send_task(
    to_agent="gpu-agent",
    task="Analyze GPU capabilities",
    priority=1
)

# GPU Agent (Linux)
gpu_queue = MessageQueue("/path/to/queue", "gpu-agent")
msg = gpu_queue.receive()
# ... process task ...
gpu_queue.send_result("executive-claude", msg.id, {"result": "..."})
```

### Memory Client (`sartor.memory_client`)

Access the multi-tier memory system (Hot/Warm/Cold).

```python
from sartor import MemoryClient, MemoryType, init_memory, remember, recall

# Initialize
client = init_memory(local_path="/path/to/memory")

# Store memories
remember(
    "Important insight about the system",
    importance=0.9,
    tags=["architecture", "insight"]
)

# Search memories
results = recall("architecture")
for mem in results:
    print(f"[{mem.importance}] {mem.content}")
```

### Agent Executor (`sartor.agent_executor`)

Execute Claude instances on remote GPU machines via SSH.

```python
from sartor import AgentExecutor, RemoteAgent

# Create executor
executor = AgentExecutor()

# Register GPU agent
executor.register_agent(RemoteAgent(
    name="gpu-agent-1",
    host="192.168.1.100",
    user="alton"
))

# Execute task synchronously
result = executor.execute_sync(
    "gpu-agent-1",
    "What GPU is available? Run nvidia-smi.",
    timeout=120
)
print(result.output)

# Or asynchronously
task_id = executor.execute_async(
    "gpu-agent-1",
    "Long running research task...",
    output_file="/home/alton/sartor/reports/research.md"
)
```

## Architecture

```
Windows (Executive Claude)          Linux (GPU Agent)
        │                                  │
        ├── sartor.message_queue ←──SSH──→ sartor.message_queue
        │         │                               │
        │         └── File-based messages ────────┘
        │
        ├── sartor.agent_executor ────SSH───→ Claude CLI
        │
        └── sartor.memory_client ←── MCP/Local/Firebase
```

## Integration with TypeScript

The Python SDK complements the main TypeScript implementation:

- TypeScript: Primary agent logic, MCP servers, memory system
- Python: Cross-platform utilities, GPU agent communication, quick scripts

Both share:
- Same message format (JSON)
- Same memory schema
- Same file-based queue protocol
