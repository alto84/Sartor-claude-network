# Message Bus Quickstart

## Overview

The message bus provides inter-agent communication with priority queuing, pub/sub topics, and request/response patterns. It's already implemented (989 lines in `src/subagent/messaging.ts`) and ready to use.

**What it does:**
- Send direct messages between specific agents
- Broadcast to all active agents
- Subscribe to topics for filtered updates
- Request/response with timeout handling
- Priority-based message queuing (CRITICAL > HIGH > NORMAL > LOW)
- Automatic delivery tracking and acknowledgment

## Import Statement

```typescript
import {
  getGlobalMessageBus,
  MessagePriority,
  MessageType,
  type AgentMessage
} from './src/subagent/messaging';

const messageBus = getGlobalMessageBus();
```

## Quick Examples

### 1. Send Direct Message to Another Agent

```typescript
// Send a direct message
const message = messageBus.sendToAgent(
  'agent-1',              // Your agent ID
  'agent-2',              // Recipient agent ID
  'Task Assignment',      // Subject
  { task: 'review-pr' },  // Body (any data)
  {
    priority: MessagePriority.HIGH,  // Optional: HIGH, NORMAL, LOW, CRITICAL
    requiresAck: true                 // Optional: require acknowledgment
  }
);

// Register handler to receive messages
messageBus.registerHandler('agent-1', (message: AgentMessage) => {
  console.log(`Received: ${message.subject}`);
  console.log(`From: ${message.senderId}`);
  console.log(`Body:`, message.body);

  // Acknowledge receipt
  messageBus.acknowledge(message.id, 'agent-1');
});
```

### 2. Broadcast to All Agents

```typescript
// Broadcast to all active agents
const broadcast = messageBus.broadcastToAll(
  'orchestrator',              // Your agent ID
  'System Update',             // Subject
  { version: '1.2.0', ... },   // Body
  { priority: MessagePriority.NORMAL }
);

// All agents with registered handlers will receive this
```

### 3. Subscribe to a Topic

```typescript
// Subscribe to a topic
messageBus.subscribe(
  'agent-3',              // Your agent ID
  'code-reviews',         // Topic name
  (message) => {          // Optional filter
    return message.metadata?.language === 'typescript';
  }
);

// Publish to topic
messageBus.publishToTopic(
  'agent-1',              // Your agent ID
  'code-reviews',         // Topic name
  'New PR Ready',         // Subject
  { prId: 123 },          // Body
  {
    priority: MessagePriority.NORMAL,
    metadata: { language: 'typescript' }
  }
);

// Only subscribers to 'code-reviews' receive this
```

## When to Use

**Use the message bus when:**
- Agents need to coordinate on shared tasks
- Broadcasting status updates to all agents
- Publishing events that multiple agents care about (topics)
- Requesting data from another agent with timeout handling
- Priority matters (critical messages jump the queue)

**Don't use when:**
- Simple function calls within same agent suffice
- Synchronous return values are needed immediately (use `sendRequest()` instead)
- Communicating with external systems (use HTTP/IPC)
- Data is better stored in shared state (use registry or coordination layer)

## Advanced Features

**Request/Response:**
```typescript
// Send request and wait for response
const response = await messageBus.sendRequest(
  'agent-1', 'agent-2', 'Get Status', {},
  { timeout: 5000 }  // 5 second timeout
);
```

**Check Message History:**
```typescript
// Get messages sent by an agent
const history = messageBus.getHistory({
  senderId: 'agent-1',
  limit: 10
});
```

**View Statistics:**
```typescript
const stats = messageBus.getStats();
// Returns: messagesSent, messagesReceived, byType, byPriority, etc.
```

## Full Implementation

For complete API documentation, types, and advanced usage, see:
**`src/subagent/messaging.ts`** (989 lines)
