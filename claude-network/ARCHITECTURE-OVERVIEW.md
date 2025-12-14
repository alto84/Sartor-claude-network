# Claude Network - Architecture Overview

## System Design

The Claude Network is a distributed multi-agent coordination system designed for reliable communication, intelligent task management, and modular skill execution across multiple computers and Claude instances.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLAUDE NETWORK SYSTEM                       │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              APPLICATION & SKILL LAYER                     │   │
│  │  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │  Skill Engine  │  │ Task Manager │  │  Agent Jobs  │   │   │
│  │  └────────────────┘  └──────────────┘  └──────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                            │                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │           COORDINATION & MANAGEMENT LAYER                  │   │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐ │   │
│  │  │ Agent Registry  │  │Config Manager│  │Task Scheduler │ │   │
│  │  └─────────────────┘  └──────────────┘  └───────────────┘ │   │
│  └────────────────────────────────────────────────────────────┘   │
│                            │                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │         COMMUNICATION & PROTOCOL LAYER                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │   │
│  │  │    MACS      │  │   Message    │  │   Heartbeat    │   │   │
│  │  │  Protocol    │  │   Queue      │  │    System      │   │   │
│  │  └──────────────┘  └──────────────┘  └────────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                            │                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              TRANSPORT & STORAGE LAYER                     │   │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐    │   │
│  │  │  Firebase Realtime   │  │  Offline Queue (local)  │    │   │
│  │  │  Database (Primary)  │  │  & Local Cache          │    │   │
│  │  └──────────────────────┘  └─────────────────────────┘    │   │
│  │                                                             │   │
│  │         (Fallback: GitHub Issues for offline)              │   │
│  └────────────────────────────────────────────────────────────┘   │
│                            │                                        │
└─────────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
    ┌─────────┐                             ┌─────────┐
    │Computer │                             │Computer │
    │   #1    │                             │   #2    │
    │ (Agent) │◄──────────Internet────────►│ (Agent) │
    └─────────┘                             └─────────┘
```

## Core Components

### 1. MACS Protocol (Multi-Agent Communication System)

**Location**: `/home/alton/vayu-learning-project/claude-network/macs.py`

The robust communication backbone of the network.

**Responsibilities:**

- Message formatting and validation
- Message signing for security
- Automatic retry with exponential backoff
- Rate limiting and throttling
- Offline queue management
- Multi-channel fallback (Firebase → GitHub)

**Key Classes:**

- `MACSClient` - Main API for sending messages
- `MACSConfig` - Configuration and constants
- `Message` - Typed message container
- `MessageRouter` - Routes messages between agents
- `OfflineQueue` - Persists messages when offline

**Message Flow:**

```
Agent A                 MACS Layer              Firebase              Agent B
  │                        │                       │                   │
  ├─ create_message()─────►│                       │                   │
  │                        ├─ validate()            │                   │
  │                        ├─ sign()                │                   │
  │                        ├─ serialize()           │                   │
  │                        ├─ retry_logic()────────►│ PUT /messages     │
  │                        │                       │                   │
  │                        │                       ├─ listener()───────►│
  │                        │                       │        ack()       │
  │                        │◄──────────────────────┤                   │
  │                        │                                            │
  │◄──── confirmation ─────┤                                            │
```

### 2. Agent Registry & Heartbeat

**Location**: `/home/alton/vayu-learning-project/claude-network/agent_registry.py`

Manages agent discovery, registration, and health monitoring.

**Responsibilities:**

- Agent registration with capabilities
- Heartbeat sending (every 15 seconds)
- Health status tracking (healthy/warning/critical/dead)
- Agent discovery by capability or status
- Event callbacks for lifecycle changes
- Local caching for offline resilience

**Data Structure (Firebase):**

```
/agents
  └── agent-001
      ├── id: "agent-001"
      ├── name: "desktop-claude"
      ├── status: "online"
      ├── health: "healthy"
      ├── last_heartbeat: 1699000000
      ├── capabilities: ["communication", "task_execution"]
      ├── location: "/home/alton/"
      └── metrics:
          ├── messages_sent: 156
          ├── messages_received: 234
          └── uptime_seconds: 3600
```

**Agent Lifecycle:**

```
REGISTERED ──heartbeat──► HEALTHY ──silence──► WARNING ──timeout──► DEAD
                             │                      │
                             └──bad_metrics────────┘
```

### 3. Task Management System

**Location**: `/home/alton/vayu-learning-project/claude-network/task_manager.py`

Intelligent task distribution and tracking.

**Responsibilities:**

- Task lifecycle management (CREATED → COMPLETED)
- Priority queue with dependency resolution
- Capability-based assignment
- Work-stealing for load balancing
- Progress tracking and metrics
- Task history and completion tracking

**Task State Machine:**

```
       create()
         │
         ▼
    CREATED
         │
         ├─ queue() ──► QUEUED ──┐
         │                       │
         │                       ├─ assign() ──► ASSIGNED
         │                       │                   │
         │               ◄───────┴───────────────────┘
         │               │
         ├─ execute() ───┘
         │       │
         │       ├─ review() ──► REVIEWING ──┬─ approve() ──► COMPLETED
         │       │                            │
         │       │                            └─ reject() ──► FAILED
         │       │
         │       └─ error() ──► FAILED
         │
         └─ cancel() ──► CANCELLED
```

**Data Structure (Firebase):**

```
/tasks
  ├── available
  │   └── task-001
  │       ├── id: "task-001"
  │       ├── title: "Analyze data"
  │       ├── status: "queued"
  │       ├── priority: 1
  │       ├── created_at: 1699000000
  │       ├── required_capabilities: ["analysis"]
  │       └── dependencies: []
  ├── assigned
  │   └── task-001 -> agent-001
  └── completed
      └── task-001 (with results)
```

### 4. Skill Engine

**Location**: `/home/alton/vayu-learning-project/claude-network/skill_engine.py`

Modular skill composition and execution.

**Responsibilities:**

- Skill discovery and cataloging
- Skill validation
- Sequential and parallel execution
- Skill composition and workflows
- Execution history tracking
- Performance metrics

**Skill Library Structure:**

```
skills/
├── core/
│   ├── communication/          # Messaging skills
│   │   ├── send_message.yaml
│   │   ├── broadcast.yaml
│   │   └── receive_message.yaml
│   ├── observation/            # Scanning skills
│   │   ├── basic_scan.yaml
│   │   ├── system_health.yaml
│   │   └── network_status.yaml
│   ├── data/                   # Storage skills
│   │   ├── data_store.yaml
│   │   ├── data_retrieve.yaml
│   │   └── data_delete.yaml
│   └── onboarding/             # Tutorial skills
│       └── network_onboarding.yaml
├── domain/                     # Domain-specific
│   ├── analysis/
│   ├── learning/
│   └── monitoring/
└── meta/                       # Advanced
    ├── workflow/
    └── composition/
```

**Skill Execution Flow:**

```
User Request
    │
    ▼
SkillEngine.execute_skill()
    │
    ├─ load_skill()
    │   └─ validate_skill()
    │
    ├─ resolve_dependencies()
    │
    ├─ execute_steps()
    │   ├─ Sequential: step1 → step2 → step3
    │   └─ Parallel: [step1, step2, step3] (all at once)
    │
    ├─ track_history()
    │
    └─ return_result()
         │
         ▼
    User Response
```

### 5. Configuration Management

**Location**: `/home/alton/vayu-learning-project/claude-network/config_manager.py`

Hierarchical configuration with validation.

**Configuration Priority (highest to lowest):**

```
┌──────────────────────────────────────────┐
│ Environment Variables (highest priority)  │
│ Example: FIREBASE_URL=...                │
└──────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│ User Config (~/.claude-network/config.yaml)│
└──────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│ Project Config (./config.yaml)           │
└──────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│ Example Config (./config.example.yaml)   │
└──────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────┐
│ Default Values (lowest priority)         │
└──────────────────────────────────────────┘
```

**Configuration Sections:**

```yaml
firebase:
  url: 'https://...'
  project_id: '...'
  timeout: 30
  max_retries: 3

agent:
  name: 'my-agent'
  capabilities: ['communication', 'analysis']
  surface: 'desktop'

network:
  heartbeat_interval: 30
  presence_update_interval: 15

security:
  use_message_signing: true
  shared_secret: '...'
```

### 6. Testing Framework

**Location**: `/home/alton/vayu-learning-project/claude-network/tests/`

Comprehensive test coverage with mocks.

**Test Structure:**

```
tests/
├── __init__.py
├── test_macs.py                    # MACS protocol tests
├── test_agent_registry.py          # Agent registry tests
├── test_task_manager.py            # Task management tests
├── test_skill_engine.py            # Skill engine tests
├── test_config_manager.py          # Config management tests
└── fixtures/
    ├── mock_firebase.py            # Firebase mocking
    ├── test_agents.py              # Test agent fixtures
    └── test_skills.py              # Test skill fixtures
```

**Test Approach:**

- Unit tests for all components
- Integration tests for component interactions
- Mock Firebase to avoid external dependencies
- Fixtures for common test data

## Data Flow Diagrams

### 1. Message Flow

```
Computer A                          Firebase                    Computer B
┌─────────────────┐                                             ┌─────────────────┐
│  Agent A        │                                             │  Agent B        │
│  ┌───────────┐  │                                             │  ┌───────────┐  │
│  │send_msg() │  │                                             │  │recv_msg()│  │
│  └─────┬─────┘  │                                             │  └─────┬─────┘  │
│        │        │                                             │        │        │
│        ▼        │                                             │        │        │
│  ┌──────────┐   │                                             │        │        │
│  │  MACS    │───┐    PUT /messages/msg-001                   │        │        │
│  │  Client  │   ├─────────────────────────┐                  │        │        │
│  └──────────┘   │                         │                  │        │        │
│                 │                         ▼                  │        │        │
│                 │                  ┌──────────────┐          │        │        │
│                 │                  │   Firebase   │          │        │        │
│                 │                  │  Realtime DB │          │        │        │
│                 │                  └──────────────┘          │        │        │
│                 │                         │                  │        │        │
│                 │                         ├─ listener()      │        │        │
│                 │                         └────────────────┐ │        │        │
│                 │                                         │ ▼        │        │
│                 │                                         └──────┐   ▼        │
│                 │                                                │   │        │
│                 │                                  ┌──────────┐  │   │        │
│                 │                                  │  MACS    │◄─┘   │        │
│                 │                                  │  Router  │      │        │
│                 │                                  └────┬─────┘      │        │
│                 │                                       │            │        │
│                 └──────────────────ack()◄──────────────┴─────────────┤        │
│                                                                      ▼        │
│                                                              ┌──────────────┐ │
│                                                              │ Message RCVD │ │
│                                                              └──────────────┘ │
│                                                                      ▲        │
└──────────────────────────────────────────────────────────────────────┼────────┘
                                                                       │
                                              ┌──────────────────────┘
                                              │
                                              ▼
                                        Agent B handles
                                        message locally
```

### 2. Task Assignment Flow

```
User/System                    TaskManager              Registry           Firebase
┌──────────────┐              ┌──────────────┐        ┌─────────────┐    ┌──────────┐
│ create_task()├─────────────►│ create_task()│        │             │    │          │
│              │              │              │        │             │    │          │
│              │              ├─ validate()  │        │             │    │          │
│              │              │              │        │             │    │          │
│              │              ├─ queue()─────┼────────┼──save_task()├───►│  /tasks  │
│              │              │              │        │             │    │/available│
│              │              │              │        │             │    │          │
│              │              ├─ find_agents()┤       │             │    │          │
│              │              │              ├────────┼─query()─────┤    │  /agents │
│              │              │              │        │             │    │          │
│              │              │ (by capab.)  │◄───────┼─────────────┤    │          │
│              │              │              │        │             │    │          │
│              │              ├─ assign()────┼────────┼──assign()───┤    │          │
│              │              │   (to A)     │        │             │    │  /tasks  │
│              │              │              │        │             │    │/assigned │
│              │              │              │        │             │    │          │
│              │◄─── task_id──┤              │        │             │    │          │
│              │              │              │        │             │    │          │
└──────────────┘              └──────────────┘        └─────────────┘    └──────────┘


Agent A (notified by listener):
┌──────────────┐
│  Agent A     │
│              │
├─ listener()──┼─► "Hey, you got task-001!"
│              │
├─ execute()──┤
│  task-001    │
│              │
├─ update()────┼──► COMPLETED
│              │
└──────────────┘
```

### 3. Agent Heartbeat Flow

```
Agent                    Heartbeat Thread              Firebase
┌────────────┐          ┌──────────────────┐          ┌──────────┐
│  Agent A   │          │ Heartbeat Loop   │          │ Firebase │
│            │          │ (every 15s)      │          │          │
│  start()───┼─────────►│                  │          │          │
│            │          │ ┌──────────────┐ │          │          │
│            │          │ │get_status()  │ │          │          │
│            │          │ └──────┬───────┘ │          │          │
│            │          │        │         │          │          │
│            │          │   ┌────▼──────┐  │          │          │
│            │          │   │serialize()│  │          │          │
│            │          │   └────┬──────┘  │          │          │
│            │          │        │         │PUT       │          │
│            │          │    ┌───▼─────────┼─────────►│  /agents │
│            │          │    │ send()      │          │ /agent-A │
│            │          │    └─────────────┤          │          │
│            │          │                  │          │          │
│ (continues)│          │ sleep(15)        │          │          │
│            │          │    │             │          │          │
│            │          │    └─ repeat ────┤          │          │
│            │          │                  │          │          │
└────────────┘          └──────────────────┘          └──────────┘


Status Timeline:
0s    15s   30s   45s   60s   75s   90s  105s  (timeout at 90s)
│     │     │     │     │     │     │     │
A─────A─────A─────A─────A─────A─────A    ? (WARNING)
│     │     │     │     │     │     └─── CRITICAL
│     │     │     │     │     │
│     │     │     │     │     └────────── HEALTHY
│     │     │     │     │
│     │     │     │     └────────────────── HEALTHY
│     │     │     │
│     │     │     └────────────────────── HEALTHY
│     │     │
│     │     └────────────────────────── HEALTHY
│     │
│     └────────────────────────────── HEALTHY
│
└────────────────────────────────── HEALTHY
```

## Component Interactions

### Skill Execution with Task Integration

```
User Command
     │
     ▼
TaskManager.create_task()
     │
     ├─► Agent selected (via Registry)
     │
     ▼
Agent assigned task
     │
     ├─► Listen for updates (via MACS)
     │
     ▼
Agent executes skill
     │
     ├─► SkillEngine.execute_skill()
     │
     ├─► May send messages (MACS)
     │
     ├─► May create subtasks
     │
     ▼
Update task progress
     │
     ├─► Send via MACS
     │
     ├─► Store in Firebase
     │
     ▼
Task completion
     │
     ├─► Mark COMPLETED
     │
     ├─► Notify via MACS
     │
     ▼
User receives result
```

## Network Resilience

### Offline Support

When Firebase is unreachable:

```
Agent sends message
     │
     ├─► Firebase accessible?
     │   │
     │   ├─► YES: Send directly
     │   │
     │   └─► NO: Queue locally
     │       │
     │       ├─► Save to ~/.claude-network/offline-queue.json
     │       │
     │       ├─► Retry on interval
     │       │
     │       └─► When Firebase recovers:
     │           └─► Flush queued messages
```

### Fallback Channels

If Firebase fails completely:

```
Message destination
     │
     ├─► Firebase (primary)
     │
     └─► GitHub Issues (fallback)
         ├─► Create issue with message
         ├─► Other agents poll issues
         └─► Slower but works
```

## Performance Characteristics

| Component      | Throughput   | Latency    | Notes               |
| -------------- | ------------ | ---------- | ------------------- |
| MACS Protocol  | 100+ msg/sec | 100-500ms  | With retry overhead |
| Task Manager   | 1000+ tasks  | 50-200ms   | Per assignment      |
| Skill Engine   | 50 parallel  | 100-1000ms | Per skill execution |
| Agent Registry | 1000 agents  | 10-50ms    | Per query           |
| Firebase       | API limit    | 100-500ms  | Network dependent   |

## Scalability Considerations

### Vertical Scaling (more CPUs/memory on one computer)

- Increase task manager queue size
- More parallel skill executions
- More concurrent MACS connections

### Horizontal Scaling (more computers)

- Add agents via SECOND-COMPUTER-SETUP.md
- Registry automatically discovers new agents
- Task manager distributes across agents
- MACS protocol handles message routing

### Database Scaling

- Firebase Realtime Database auto-scales
- Consider migration to Firestore for larger systems
- Implement local caching for high-frequency reads

## Security Considerations

### Message Signing

- MACS signs all messages with SHA256-HMAC
- Verifies signature on receipt
- Prevents message tampering

### Authentication

- Firebase rules restrict access
- Agent credentials stored securely
- Environment variables for sensitive config

### Rate Limiting

- MACS throttles message sending
- Task manager prioritizes work
- Prevents resource exhaustion

## Monitoring and Observability

### Key Metrics

- Agent health (heartbeat status)
- Message delivery rate
- Task completion rate
- Skill execution time
- Database performance

### Logging

- Structured JSON logging
- Timestamps for all events
- Separate log files per component

### Debugging

- Network status monitor (`monitor.py`)
- Task status CLI (`task_cli.py`)
- Execution history tracking
- Event callbacks for lifecycle changes

## Future Enhancements

1. **Consensus Mechanisms** - Multi-agent agreement on decisions
2. **Clade Evolution** - Track agent specialization over time
3. **Advanced Composition** - Complex multi-skill workflows
4. **Machine Learning** - Learn optimal task assignments
5. **Cross-cloud Support** - Support multiple cloud backends

---

**This architecture provides a robust, scalable foundation for multi-agent coordination across distributed systems.**
