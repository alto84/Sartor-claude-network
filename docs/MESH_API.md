# Mesh Architecture API Documentation

## Overview

The Mesh Architecture provides three core modules for multi-instance memory synchronization:

1. **Memory Safety** - Security and audit layer
2. **WebSocket Sync** - Real-time CRDT-based synchronization
3. **Knowledge Graph** - Entity relationship modeling

---

## Memory Safety API

### Import

```typescript
import {
  InjectionScanner,
  AuditLogger,
  MemorySafetyManager,
  MemoryTrustLevel,
  ThreatType,
  ThreatSeverity,
} from './src/mcp/memory-safety';
```

### MemoryTrustLevel Enum

```typescript
enum MemoryTrustLevel {
  VERIFIED = 'verified', // Human reviewed or trusted source
  TRUSTED = 'trusted', // Authenticated agent, not yet verified
  UNTRUSTED = 'untrusted', // Unknown source
  QUARANTINED = 'quarantined', // Potentially malicious, awaiting review
}
```

### InjectionScanner

Scans content for prompt injection and other attacks.

```typescript
const scanner = new InjectionScanner();

// Full scan
const result = scanner.scan(content, agentId);
// Returns: { safe: boolean, threats: DetectedThreat[], trustLevel, scanDurationMs, scanId }

// Quick scan (critical patterns only)
const isSafe = scanner.quickScan(content);
// Returns: boolean

// Add custom pattern
scanner.addPattern(
  /custom\s+pattern/gi,
  ThreatType.PROMPT_INJECTION,
  ThreatSeverity.HIGH,
  'Description'
);
```

### AuditLogger

Full audit trail for memory operations.

```typescript
const logger = new AuditLogger({ consoleOutput: true });

// Log an operation
const entry = logger.log(MemoryOperation.CREATE, memoryId, agentId, MemoryTrustLevel.TRUSTED, {
  newState: { content: '...' },
  scanResult,
});

// Query entries
logger.getEntriesForMemory(memoryId);
logger.getEntriesForAgent(agentId);
logger.getQuarantinedEntries();
logger.getEntriesWithThreats();

// Statistics
const stats = logger.getStats();
// { totalEntries, byOperation, byTrustLevel, threatsDetected, quarantinedCount }

// Add listener
logger.addListener((entry) => console.log('New audit entry:', entry));
```

### MemorySafetyManager

Unified safety interface.

```typescript
const manager = new MemorySafetyManager({ consoleOutput: false });

// Validate memory before storage
const { allowed, scanResult, trustLevel } = await manager.validateMemory(
  memoryId,
  content,
  agentId
);

// Quick safety check
const isSafe = manager.quickCheck(content);

// Check quarantine status
manager.isQuarantined(memoryId);

// Release from quarantine
await manager.releaseFromQuarantine(memoryId, reviewerId);
```

---

## WebSocket Sync API

### Import

```typescript
import {
  MeshSyncServer,
  GCounter,
  PNCounter,
  LWWRegister,
  ORSet,
  LWWMap,
  VectorClockOps,
} from './src/mcp/websocket-sync';
```

### CRDT Types

#### GCounter (Grow-only Counter)

```typescript
const counter = new GCounter();
counter.increment('node1', 5);
counter.value(); // 5

// Merge two counters
const merged = counter1.merge(counter2);

// Serialization
const json = counter.toJSON();
const restored = GCounter.fromJSON(json);
```

#### PNCounter (Positive-Negative Counter)

```typescript
const counter = new PNCounter();
counter.increment('node1', 10);
counter.decrement('node1', 3);
counter.value(); // 7
```

#### LWWRegister (Last-Writer-Wins Register)

```typescript
const register = new LWWRegister<string>();
register.set('value', 'node1', timestamp);
register.get(); // 'value'

// Merge preserves latest write
const merged = reg1.merge(reg2);
```

#### ORSet (Observed-Remove Set)

```typescript
const set = new ORSet<string>();
set.add('apple', 'node1', timestamp);
set.remove('apple', 'node1', timestamp);
set.has('apple'); // false
set.values(); // []
```

#### LWWMap (Last-Writer-Wins Map)

```typescript
const map = new LWWMap<string, number>();
map.set('key', 100, 'node1', timestamp);
map.get('key'); // 100
map.delete('key', 'node1', timestamp);
```

### VectorClockOps

```typescript
// Create clock
let clock = VectorClockOps.create('node1');

// Increment
clock = VectorClockOps.increment(clock, 'node1');

// Merge clocks
const merged = VectorClockOps.merge(clock1, clock2);

// Compare
VectorClockOps.compare(a, b); // -1 (a before b), 0 (concurrent), 1 (a after b)
VectorClockOps.happenedBefore(a, b);
VectorClockOps.areConcurrent(a, b);
```

### MeshSyncServer

```typescript
const server = new MeshSyncServer('node-id', {
  heartbeatIntervalMs: 5000,
  heartbeatTimeoutMs: 15000,
  maxNodes: 100,
});

// Start/stop
server.start();
server.stop();

// Handle WebSocket connection
server.handleConnection(ws, { id: 'client-1', name: 'Claude', type: 'claude' });

// Notify memory change
server.notifyMemoryChange({
  memoryId: 'mem-123',
  operation: 'create',
  newValue: { content: '...' },
  sourceNode: 'node-id',
  timestamp: Date.now(),
  vectorClock: { 'node-id': 1 },
});

// Send message to specific node
server.sendMessage(nodeId, { type: SyncMessageType.MEMORY_UPDATE, payload: {...} });

// Broadcast to all nodes
server.broadcast({ type: SyncMessageType.CHANGE_NOTIFICATION, payload: {...} });

// Get stats
const stats = server.getStats();
// { nodeId, connectedNodes, totalSubscriptions, vectorClock }
```

---

## Knowledge Graph API

### Import

```typescript
import { KnowledgeGraph, EntityType, RelationType } from './src/mcp/knowledge-graph';
```

### EntityType Enum

```typescript
enum EntityType {
  MEMORY,
  CONCEPT,
  PERSON,
  ORGANIZATION,
  LOCATION,
  EVENT,
  PROJECT,
  TASK,
  SKILL,
  DOCUMENT,
  CODE,
  CUSTOM,
}
```

### RelationType Enum

```typescript
enum RelationType {
  // Hierarchical
  PARENT_OF,
  CHILD_OF,
  CONTAINS,
  PART_OF,
  // Associative
  RELATED_TO,
  SIMILAR_TO,
  OPPOSITE_OF,
  DERIVED_FROM,
  // Temporal
  PRECEDES,
  FOLLOWS,
  CONCURRENT_WITH,
  // Causal
  CAUSES,
  CAUSED_BY,
  ENABLES,
  PREVENTS,
  // Ownership
  CREATED_BY,
  OWNED_BY,
  ASSIGNED_TO,
  // References
  REFERENCES,
  IMPLEMENTS,
  EXTENDS,
  DEPENDS_ON,
  CUSTOM,
}
```

### Entity Operations

```typescript
const graph = new KnowledgeGraph();

// Create entity
const entity = graph.createEntity(EntityType.CONCEPT, 'TypeScript', {
  description: 'A typed programming language',
  properties: { version: '5.0' },
  observations: ['Compiles to JavaScript'],
  tags: ['programming', 'typed'],
  importance: 0.8,
});

// Get entity
const entity = graph.getEntity(id);

// Update entity
graph.updateEntity(id, {
  name: 'Updated Name',
  properties: { newProp: 'value' },
});

// Delete entity
graph.deleteEntity(id);

// Add observation
graph.addObservation(entityId, 'New observation');
```

### Relationship Operations

```typescript
// Create relationship
const rel = graph.createRelationship(sourceId, targetId, RelationType.RELATED_TO, {
  weight: 0.9,
  bidirectional: true,
  properties: { reason: 'Both are programming languages' },
});

// Get relationships
const rels = graph.getRelationshipsForEntity(entityId, 'both'); // 'outgoing' | 'incoming' | 'both'

// Update relationship
graph.updateRelationship(relId, { weight: 1.0 });

// Delete relationship
graph.deleteRelationship(relId);
```

### Graph Queries

```typescript
// Search entities
const results = graph.searchEntities('programming', {
  types: [EntityType.CONCEPT],
  limit: 10,
  minRelevance: 0.3,
});
// Returns: [{ entity, relevance }]

// Get neighbors
const neighbors = graph.getNeighbors(entityId, {
  relationTypes: [RelationType.RELATED_TO],
  entityTypes: [EntityType.CONCEPT],
  minWeight: 0.5,
  maxResults: 10,
});

// Find shortest path
const path = graph.findShortestPath(startId, endId, {
  maxDepth: 5,
  relationTypes: [RelationType.RELATED_TO],
});
// Returns: { nodes, edges, totalWeight, length }

// Find all paths
const paths = graph.findAllPaths(startId, endId, {
  maxDepth: 3,
  maxResults: 10,
});

// Traverse graph
const result = graph.traverse(startId, { maxDepth: 2 });
// Returns: { entities, relationships, paths, metadata }
```

### Semantic Linking

```typescript
// Find similar entities
const links = graph.findSimilar(entityId, {
  limit: 5,
  minSimilarity: 0.3,
  types: [EntityType.CONCEPT],
});
// Returns: [{ sourceId, targetId, similarity, linkType, confidence }]

// Auto-create semantic links
const linksCreated = graph.createSemanticLinks(
  0.3, // minSimilarity
  0.5 // relationWeight
);
```

### Utilities

```typescript
// Get all entities/relationships
graph.getAllEntities();
graph.getAllRelationships();

// Filter by type
graph.getEntitiesByType(EntityType.PERSON);
graph.getRelationshipsByType(RelationType.DEPENDS_ON);

// Statistics
const stats = graph.getStats();
// { entityCount, relationshipCount, entityTypes, relationTypes, avgRelationshipsPerEntity, indexedWords }

// Serialization
const json = graph.toJSON();
graph.fromJSON(json);

// Clear graph
graph.clear();
```

---

## Usage Examples

### Complete Safety Flow

```typescript
import { MemorySafetyManager, MemoryTrustLevel } from './src/mcp/memory-safety';

const manager = new MemorySafetyManager();

// Validate before storing
const { allowed, trustLevel, scanResult } = await manager.validateMemory(
  'mem-123',
  userProvidedContent,
  'agent-claude-1'
);

if (!allowed) {
  console.log('Content quarantined:', scanResult.threats);
  // Await human review
} else {
  // Safe to store
  await storeMemory(content, trustLevel);
}
```

### Multi-Instance Sync

```typescript
import { MeshSyncServer, LWWMap } from './src/mcp/websocket-sync';

// Instance 1
const server1 = new MeshSyncServer('node-1');
server1.start();

// When memory changes
server1.notifyMemoryChange({
  memoryId: 'mem-123',
  operation: 'update',
  newValue: { content: 'Updated content' },
  sourceNode: 'node-1',
  timestamp: Date.now(),
  vectorClock: server1.getStats().vectorClock,
});
```

### Knowledge Graph Memory Organization

```typescript
import { KnowledgeGraph, EntityType, RelationType } from './src/mcp/knowledge-graph';

const graph = new KnowledgeGraph();

// Create entities for memories
const project = graph.createEntity(EntityType.PROJECT, 'Website Redesign');
const task1 = graph.createEntity(EntityType.TASK, 'Design mockups');
const task2 = graph.createEntity(EntityType.TASK, 'Implement frontend');

// Link them
graph.createRelationship(project.id, task1.id, RelationType.CONTAINS);
graph.createRelationship(project.id, task2.id, RelationType.CONTAINS);
graph.createRelationship(task1.id, task2.id, RelationType.PRECEDES);

// Query
const projectTasks = graph.getNeighbors(project.id, {
  relationTypes: [RelationType.CONTAINS],
});
```

---

## Error Handling

All operations that can fail return `undefined` or throw errors:

```typescript
try {
  const entity = graph.getEntity('non-existent');
  if (!entity) {
    console.log('Entity not found');
  }
} catch (error) {
  console.error('Operation failed:', error);
}
```

## Performance Considerations

- **InjectionScanner**: O(n\*p) where n = content length, p = pattern count
- **Knowledge Graph**: BFS is O(V + E), graph queries are O(E)
- **CRDTs**: Merge operations are O(n) where n = entries
- **Vector Clocks**: Compare is O(k) where k = node count

---

_Last updated: December 2024_
