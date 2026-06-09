# Firestore Schema for Claude Swarm

## Collections

### `agent_requests`
The task queue. Agents write requests here, coordinator picks them up.

```typescript
interface AgentRequest {
  // Identity
  requestId: string;          // Auto-generated document ID
  parentRequestId?: string;   // If nested, the parent's ID

  // Status lifecycle
  status: 'pending' | 'acknowledged' | 'executing' | 'completed' | 'failed';

  // Agent specification
  agentRole: string;          // e.g., 'researcher', 'analyst', 'writer'
  agentVersion?: string;      // Optional version tag

  // Task definition
  task: {
    objective: string;        // What to accomplish
    context: Record<string, any>;  // Input data
    requirements: string[];   // Constraints and expectations
    timeoutSeconds?: number;  // Max execution time (default: 300)
    allowSubRequests?: boolean;  // Can spawn children (default: true)
  };

  // Tracking
  priority?: number;          // 1-10, higher = more urgent
  source?: 'firebase' | 'local' | 'github';

  // Timestamps
  createdAt: string;          // ISO timestamp
  acknowledgedAt?: string;
  startedAt?: string;

  // Error handling
  error?: string;
  retryCount?: number;

  // TTL (Firestore auto-delete)
  ttl: Timestamp;             // Set to 24h from creation
}
```

### `agent_results`
Output from completed agents. Parent agents poll this collection.

```typescript
interface AgentResult {
  // Identity
  resultId: string;           // Same as requestId
  requestId: string;          // Reference to original request

  // Status
  status: 'success' | 'failed';

  // Output
  output?: {
    text?: string;            // Main textual output
    data?: Record<string, any>;  // Structured data
    artifacts?: string[];     // File paths or URLs
    citations?: string[];     // Sources used
  };

  // Error (if failed)
  error?: {
    code: string;
    message: string;
    stack?: string;
  };

  // Metrics
  durationMs: number;
  tokensUsed?: number;

  // Sub-results (if agent spawned children)
  childResults?: Record<string, {
    status: string;
    summary?: string;
  }>;

  // Timestamps
  completedAt: string;

  // TTL
  ttl: Timestamp;
}
```

### `agent_workers`
Registry of active agent processes. Used for health monitoring.

```typescript
interface AgentWorker {
  workerId: string;           // Process ID or unique identifier
  status: 'idle' | 'busy' | 'dead';

  // Current work
  activeRequestIds: string[];

  // Capabilities
  agentRole?: string;
  capabilities?: string[];

  // Health
  lastHeartbeat: Timestamp;
  startedAt: Timestamp;
  completedRequests: number;
  failedRequests: number;

  // Resource usage
  memoryMb?: number;
  cpuPercent?: number;
}
```

### `agent_logs`
Audit trail for debugging and compliance.

```typescript
interface AgentLog {
  logId: string;
  timestamp: Timestamp;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

  // Context
  requestId?: string;
  workerId?: string;
  agentRole?: string;

  // Content
  message: string;
  details?: Record<string, any>;

  // TTL (7 days)
  ttl: Timestamp;
}
```

### `swarm_state`
Shared coordination state for the swarm.

```typescript
interface SwarmState {
  stateId: string;            // e.g., 'global', 'team-alpha'

  // Team composition
  activeAgents: number;
  maxAgents: number;

  // Current objective (if team mode)
  objective?: string;

  // Shared data pool
  sharedData?: Record<string, {
    value: any;
    sourceAgent: string;
    timestamp: Timestamp;
  }>;

  // Coordination
  pendingDecisions?: Array<{
    id: string;
    question: string;
    votes: Record<string, string>;  // agentId -> vote
    deadline: Timestamp;
  }>;

  // Last update
  updatedAt: Timestamp;
}
```

## Status Transitions

```
agent_requests status flow:

  pending ──────┬──────► acknowledged ──────► executing ──────┬──────► completed
                │                                              │
                │                                              └──────► failed
                │
                └──────► (queue full) ──────► pending (retry)
```

## TTL Configuration

Set up TTL policies in Firebase Console:
- `agent_requests`: Delete after 24 hours
- `agent_results`: Delete after 24 hours
- `agent_logs`: Delete after 7 days
- `agent_workers`: Delete after 1 hour (stale workers)

## Queries

Common queries used by the coordinator:

```javascript
// Get pending requests (sorted by priority, then time)
db.collection('agent_requests')
  .where('status', '==', 'pending')
  .orderBy('priority', 'desc')
  .orderBy('createdAt', 'asc')
  .limit(10)

// Get result for a request
db.collection('agent_results')
  .doc(requestId)
  .get()

// Get all children of a parent request
db.collection('agent_requests')
  .where('parentRequestId', '==', parentId)

// Get recent logs for debugging
db.collection('agent_logs')
  .where('requestId', '==', requestId)
  .orderBy('timestamp', 'desc')
  .limit(50)
```
