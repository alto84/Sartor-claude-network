/**
 * WebSocket Mesh Sync
 *
 * Real-time synchronization layer for multi-instance memory mesh:
 * - WebSocket server for real-time connections
 * - CRDT-based conflict resolution
 * - Subscription model for memory changes
 * - Heartbeat/presence detection
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Unique identifier for a mesh node (Claude instance)
 */
export interface NodeId {
  id: string;
  name: string;
  type: 'claude' | 'agent' | 'service' | 'unknown';
}

/**
 * State of a mesh node
 */
export enum NodeState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  SYNCING = 'syncing',
  READY = 'ready',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

/**
 * Mesh node information
 */
export interface MeshNode {
  nodeId: NodeId;
  state: NodeState;
  connectedAt: Date;
  lastHeartbeat: Date;
  metadata: Record<string, unknown>;
  subscriptions: Set<string>;
  vectorClock: VectorClock;
}

/**
 * Vector clock for causal ordering
 */
export interface VectorClock {
  [nodeId: string]: number;
}

/**
 * Types of sync messages
 */
export enum SyncMessageType {
  // Connection
  HANDSHAKE = 'handshake',
  HANDSHAKE_ACK = 'handshake_ack',
  HEARTBEAT = 'heartbeat',
  HEARTBEAT_ACK = 'heartbeat_ack',
  DISCONNECT = 'disconnect',

  // Subscriptions
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  SUBSCRIPTION_ACK = 'subscription_ack',

  // Memory operations
  MEMORY_CREATE = 'memory_create',
  MEMORY_UPDATE = 'memory_update',
  MEMORY_DELETE = 'memory_delete',
  MEMORY_SYNC = 'memory_sync',

  // CRDT operations
  CRDT_OPERATION = 'crdt_operation',
  CRDT_STATE = 'crdt_state',
  CRDT_MERGE = 'crdt_merge',

  // Notifications
  CHANGE_NOTIFICATION = 'change_notification',
  CONFLICT_NOTIFICATION = 'conflict_notification',

  // Control
  REQUEST_STATE = 'request_state',
  STATE_RESPONSE = 'state_response',
  ERROR = 'error',
}

/**
 * Base sync message
 */
export interface SyncMessage {
  type: SyncMessageType;
  id: string;
  sourceNode: string;
  timestamp: number;
  vectorClock: VectorClock;
  payload: unknown;
}

/**
 * Memory change event
 */
export interface MemoryChangeEvent {
  memoryId: string;
  operation: 'create' | 'update' | 'delete';
  previousValue?: unknown;
  newValue?: unknown;
  sourceNode: string;
  timestamp: number;
  vectorClock: VectorClock;
}

/**
 * Subscription filter
 */
export interface SubscriptionFilter {
  memoryTypes?: string[];
  memoryIds?: string[];
  tags?: string[];
  minImportance?: number;
}

// ============================================================================
// CRDT IMPLEMENTATIONS
// ============================================================================

/**
 * G-Counter: Grow-only counter (increment only)
 */
export class GCounter {
  private counts: Map<string, number> = new Map();

  increment(nodeId: string, amount: number = 1): void {
    const current = this.counts.get(nodeId) || 0;
    this.counts.set(nodeId, current + amount);
  }

  value(): number {
    let total = 0;
    this.counts.forEach((count) => {
      total += count;
    });
    return total;
  }

  merge(other: GCounter): GCounter {
    const merged = new GCounter();

    // Merge this counter
    this.counts.forEach((count, nodeId) => {
      merged.counts.set(nodeId, count);
    });

    // Merge other counter (take max)
    other.counts.forEach((count, nodeId) => {
      const current = merged.counts.get(nodeId) || 0;
      merged.counts.set(nodeId, Math.max(current, count));
    });

    return merged;
  }

  toJSON(): Record<string, number> {
    const obj: Record<string, number> = {};
    this.counts.forEach((count, nodeId) => {
      obj[nodeId] = count;
    });
    return obj;
  }

  static fromJSON(json: Record<string, number>): GCounter {
    const counter = new GCounter();
    for (const [nodeId, count] of Object.entries(json)) {
      counter.counts.set(nodeId, count);
    }
    return counter;
  }
}

/**
 * PN-Counter: Positive-Negative counter (increment and decrement)
 */
export class PNCounter {
  private positive: GCounter = new GCounter();
  private negative: GCounter = new GCounter();

  increment(nodeId: string, amount: number = 1): void {
    this.positive.increment(nodeId, amount);
  }

  decrement(nodeId: string, amount: number = 1): void {
    this.negative.increment(nodeId, amount);
  }

  value(): number {
    return this.positive.value() - this.negative.value();
  }

  merge(other: PNCounter): PNCounter {
    const merged = new PNCounter();
    merged.positive = this.positive.merge(other.positive);
    merged.negative = this.negative.merge(other.negative);
    return merged;
  }

  toJSON(): { positive: Record<string, number>; negative: Record<string, number> } {
    return {
      positive: this.positive.toJSON(),
      negative: this.negative.toJSON(),
    };
  }

  static fromJSON(json: {
    positive: Record<string, number>;
    negative: Record<string, number>;
  }): PNCounter {
    const counter = new PNCounter();
    counter.positive = GCounter.fromJSON(json.positive);
    counter.negative = GCounter.fromJSON(json.negative);
    return counter;
  }
}

/**
 * LWW-Register: Last-Writer-Wins Register
 */
export class LWWRegister<T> {
  private value_: T | undefined;
  private timestamp_: number = 0;
  private nodeId_: string = '';

  constructor(initialValue?: T, nodeId?: string) {
    if (initialValue !== undefined && nodeId) {
      this.value_ = initialValue;
      this.timestamp_ = Date.now();
      this.nodeId_ = nodeId;
    }
  }

  set(value: T, nodeId: string, timestamp?: number): void {
    const ts = timestamp ?? Date.now();
    if (ts > this.timestamp_ || (ts === this.timestamp_ && nodeId > this.nodeId_)) {
      this.value_ = value;
      this.timestamp_ = ts;
      this.nodeId_ = nodeId;
    }
  }

  get(): T | undefined {
    return this.value_;
  }

  getTimestamp(): number {
    return this.timestamp_;
  }

  getNodeId(): string {
    return this.nodeId_;
  }

  merge(other: LWWRegister<T>): LWWRegister<T> {
    const merged = new LWWRegister<T>();
    const otherTs = other.getTimestamp();
    const otherNodeId = other.getNodeId();

    if (
      otherTs > this.timestamp_ ||
      (otherTs === this.timestamp_ && otherNodeId > this.nodeId_)
    ) {
      merged.value_ = other.get();
      merged.timestamp_ = otherTs;
      merged.nodeId_ = otherNodeId;
    } else {
      merged.value_ = this.value_;
      merged.timestamp_ = this.timestamp_;
      merged.nodeId_ = this.nodeId_;
    }

    return merged;
  }

  toJSON(): { value: T | undefined; timestamp: number; nodeId: string } {
    return {
      value: this.value_,
      timestamp: this.timestamp_,
      nodeId: this.nodeId_,
    };
  }

  static fromJSON<T>(json: { value: T | undefined; timestamp: number; nodeId: string }): LWWRegister<T> {
    const register = new LWWRegister<T>();
    register.value_ = json.value;
    register.timestamp_ = json.timestamp;
    register.nodeId_ = json.nodeId;
    return register;
  }
}

/**
 * OR-Set: Observed-Remove Set (add and remove elements)
 */
export class ORSet<T> {
  private elements: Map<string, { value: T; timestamp: number; nodeId: string }> = new Map();
  private tombstones: Map<string, { timestamp: number; nodeId: string }> = new Map();

  private generateId(value: T): string {
    return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
  }

  add(value: T, nodeId: string, timestamp?: number): void {
    const ts = timestamp ?? Date.now();
    const id = this.generateId(value);

    // Check if tombstoned
    const tombstone = this.tombstones.get(id);
    if (tombstone && tombstone.timestamp >= ts) {
      return; // Already removed with later timestamp
    }

    this.elements.set(id, { value, timestamp: ts, nodeId });
  }

  remove(value: T, nodeId: string, timestamp?: number): void {
    const ts = timestamp ?? Date.now();
    const id = this.generateId(value);

    const element = this.elements.get(id);
    if (element && element.timestamp <= ts) {
      this.elements.delete(id);
      this.tombstones.set(id, { timestamp: ts, nodeId });
    }
  }

  has(value: T): boolean {
    const id = this.generateId(value);
    return this.elements.has(id);
  }

  values(): T[] {
    const result: T[] = [];
    this.elements.forEach((element) => {
      result.push(element.value);
    });
    return result;
  }

  size(): number {
    return this.elements.size;
  }

  merge(other: ORSet<T>): ORSet<T> {
    const merged = new ORSet<T>();

    // Copy this set's elements
    this.elements.forEach((element, id) => {
      merged.elements.set(id, { ...element });
    });

    // Copy this set's tombstones
    this.tombstones.forEach((tombstone, id) => {
      merged.tombstones.set(id, { ...tombstone });
    });

    // Merge other set's elements
    other.elements.forEach((element, id) => {
      const existing = merged.elements.get(id);
      const tombstone = merged.tombstones.get(id);

      // Skip if tombstoned with later timestamp
      if (tombstone && tombstone.timestamp >= element.timestamp) {
        return;
      }

      if (!existing || element.timestamp > existing.timestamp) {
        merged.elements.set(id, { ...element });
      }
    });

    // Merge other set's tombstones
    other.tombstones.forEach((tombstone, id) => {
      const existing = merged.tombstones.get(id);

      if (!existing || tombstone.timestamp > existing.timestamp) {
        merged.tombstones.set(id, { ...tombstone });
        // Remove element if tombstone is newer
        const element = merged.elements.get(id);
        if (element && element.timestamp <= tombstone.timestamp) {
          merged.elements.delete(id);
        }
      }
    });

    return merged;
  }

  toJSON(): {
    elements: Array<{ id: string; value: T; timestamp: number; nodeId: string }>;
    tombstones: Array<{ id: string; timestamp: number; nodeId: string }>;
  } {
    const elements: Array<{ id: string; value: T; timestamp: number; nodeId: string }> = [];
    this.elements.forEach((element, id) => {
      elements.push({ id, ...element });
    });

    const tombstones: Array<{ id: string; timestamp: number; nodeId: string }> = [];
    this.tombstones.forEach((tombstone, id) => {
      tombstones.push({ id, ...tombstone });
    });

    return { elements, tombstones };
  }

  static fromJSON<T>(json: {
    elements: Array<{ id: string; value: T; timestamp: number; nodeId: string }>;
    tombstones: Array<{ id: string; timestamp: number; nodeId: string }>;
  }): ORSet<T> {
    const set = new ORSet<T>();
    for (const element of json.elements) {
      set.elements.set(element.id, {
        value: element.value,
        timestamp: element.timestamp,
        nodeId: element.nodeId,
      });
    }
    for (const tombstone of json.tombstones) {
      set.tombstones.set(tombstone.id, {
        timestamp: tombstone.timestamp,
        nodeId: tombstone.nodeId,
      });
    }
    return set;
  }
}

/**
 * LWW-Element-Map: Last-Writer-Wins Map
 */
export class LWWMap<K, V> {
  private entries: Map<string, LWWRegister<V>> = new Map();
  private keySet: ORSet<K> = new ORSet<K>();

  private keyToString(key: K): string {
    return JSON.stringify(key);
  }

  set(key: K, value: V, nodeId: string, timestamp?: number): void {
    const ts = timestamp ?? Date.now();
    const keyStr = this.keyToString(key);

    this.keySet.add(key, nodeId, ts);

    let register = this.entries.get(keyStr);
    if (!register) {
      register = new LWWRegister<V>();
      this.entries.set(keyStr, register);
    }
    register.set(value, nodeId, ts);
  }

  get(key: K): V | undefined {
    const keyStr = this.keyToString(key);
    const register = this.entries.get(keyStr);
    return register?.get();
  }

  delete(key: K, nodeId: string, timestamp?: number): void {
    const ts = timestamp ?? Date.now();
    this.keySet.remove(key, nodeId, ts);
  }

  has(key: K): boolean {
    return this.keySet.has(key);
  }

  keys(): K[] {
    return this.keySet.values();
  }

  size(): number {
    return this.keySet.size();
  }

  merge(other: LWWMap<K, V>): LWWMap<K, V> {
    const merged = new LWWMap<K, V>();
    merged.keySet = this.keySet.merge(other.keySet);

    // Merge registers for all keys
    const allKeys = new Set<string>();
    this.entries.forEach((_, k) => allKeys.add(k));
    other.entries.forEach((_, k) => allKeys.add(k));

    allKeys.forEach((keyStr) => {
      const thisRegister = this.entries.get(keyStr);
      const otherRegister = other.entries.get(keyStr);

      if (thisRegister && otherRegister) {
        merged.entries.set(keyStr, thisRegister.merge(otherRegister));
      } else if (thisRegister) {
        merged.entries.set(keyStr, thisRegister);
      } else if (otherRegister) {
        merged.entries.set(keyStr, otherRegister);
      }
    });

    return merged;
  }
}

// ============================================================================
// VECTOR CLOCK OPERATIONS
// ============================================================================

/**
 * Utilities for vector clock operations
 */
export class VectorClockOps {
  /**
   * Create a new vector clock
   */
  static create(nodeId: string): VectorClock {
    return { [nodeId]: 1 };
  }

  /**
   * Increment clock for a node
   */
  static increment(clock: VectorClock, nodeId: string): VectorClock {
    return {
      ...clock,
      [nodeId]: (clock[nodeId] || 0) + 1,
    };
  }

  /**
   * Merge two vector clocks (take max of each component)
   */
  static merge(a: VectorClock, b: VectorClock): VectorClock {
    const result: VectorClock = { ...a };
    for (const [nodeId, timestamp] of Object.entries(b)) {
      result[nodeId] = Math.max(result[nodeId] || 0, timestamp);
    }
    return result;
  }

  /**
   * Compare two vector clocks
   * Returns:
   *  -1 if a happened before b
   *   0 if concurrent
   *   1 if a happened after b
   */
  static compare(a: VectorClock, b: VectorClock): -1 | 0 | 1 {
    let aBeforeB = false;
    let bBeforeA = false;

    const allNodes = new Set<string>();
    Object.keys(a).forEach((k) => allNodes.add(k));
    Object.keys(b).forEach((k) => allNodes.add(k));

    allNodes.forEach((nodeId) => {
      const aVal = a[nodeId] || 0;
      const bVal = b[nodeId] || 0;

      if (aVal < bVal) aBeforeB = true;
      if (bVal < aVal) bBeforeA = true;
    });

    if (aBeforeB && !bBeforeA) return -1;
    if (bBeforeA && !aBeforeB) return 1;
    return 0; // Concurrent or equal
  }

  /**
   * Check if a happened before b
   */
  static happenedBefore(a: VectorClock, b: VectorClock): boolean {
    return this.compare(a, b) === -1;
  }

  /**
   * Check if clocks are concurrent
   */
  static areConcurrent(a: VectorClock, b: VectorClock): boolean {
    return this.compare(a, b) === 0 && JSON.stringify(a) !== JSON.stringify(b);
  }
}

// ============================================================================
// WEBSOCKET SYNC SERVER
// ============================================================================

/**
 * Configuration for the sync server
 */
export interface SyncServerConfig {
  heartbeatIntervalMs: number;
  heartbeatTimeoutMs: number;
  maxNodes: number;
  enableCompression: boolean;
  maxMessageSize: number;
}

/**
 * Events emitted by the sync server
 */
export interface SyncServerEvents {
  nodeConnected: (node: MeshNode) => void;
  nodeDisconnected: (nodeId: string, reason: string) => void;
  messageReceived: (nodeId: string, message: SyncMessage) => void;
  memoryChanged: (event: MemoryChangeEvent) => void;
  conflictDetected: (memoryId: string, local: unknown, remote: unknown) => void;
  error: (error: Error) => void;
}

/**
 * WebSocket-like interface for abstraction
 */
export interface WebSocketLike {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
  readyState: number;
}

/**
 * WebSocket Mesh Sync Server
 *
 * Manages real-time synchronization between multiple Claude instances
 */
export class MeshSyncServer extends EventEmitter {
  private nodeId: string;
  private config: SyncServerConfig;
  private nodes: Map<string, MeshNode> = new Map();
  private connections: Map<string, WebSocketLike> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // memoryId -> nodeIds
  private vectorClock: VectorClock;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private memoryState: LWWMap<string, unknown> = new LWWMap();

  constructor(nodeId: string, config?: Partial<SyncServerConfig>) {
    super();
    this.nodeId = nodeId;
    this.config = {
      heartbeatIntervalMs: config?.heartbeatIntervalMs ?? 5000,
      heartbeatTimeoutMs: config?.heartbeatTimeoutMs ?? 15000,
      maxNodes: config?.maxNodes ?? 100,
      enableCompression: config?.enableCompression ?? true,
      maxMessageSize: config?.maxMessageSize ?? 1024 * 1024, // 1MB
    };
    this.vectorClock = VectorClockOps.create(nodeId);
  }

  /**
   * Start the sync server
   */
  start(): void {
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, this.config.heartbeatIntervalMs);

    console.log(`[MESH] Sync server started for node ${this.nodeId}`);
  }

  /**
   * Stop the sync server
   */
  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Disconnect all nodes
    this.connections.forEach((ws, nodeId) => {
      this.sendMessage(nodeId, {
        type: SyncMessageType.DISCONNECT,
        payload: { reason: 'Server shutdown' },
      });
      ws.close(1000, 'Server shutdown');
    });

    this.nodes.clear();
    this.connections.clear();

    console.log(`[MESH] Sync server stopped`);
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws: WebSocketLike, initialNodeInfo?: Partial<NodeId>): void {
    const tempId = crypto.randomUUID();

    ws.on('message', (data: unknown) => {
      try {
        const message = JSON.parse(data as string) as SyncMessage;
        this.handleMessage(tempId, message);
      } catch (error) {
        console.error('[MESH] Failed to parse message:', error);
      }
    });

    ws.on('close', () => {
      const nodeId = this.findNodeIdByConnection(ws);
      if (nodeId) {
        this.handleDisconnect(nodeId, 'Connection closed');
      }
    });

    ws.on('error', (error: unknown) => {
      console.error('[MESH] WebSocket error:', error);
      const nodeId = this.findNodeIdByConnection(ws);
      if (nodeId) {
        this.handleDisconnect(nodeId, 'Connection error');
      }
    });

    // Temporarily store connection
    this.connections.set(tempId, ws);

    // Wait for handshake
    console.log(`[MESH] New connection pending handshake`);
  }

  /**
   * Find node ID by WebSocket connection
   */
  private findNodeIdByConnection(ws: WebSocketLike): string | undefined {
    let foundNodeId: string | undefined;
    this.connections.forEach((conn, nodeId) => {
      if (conn === ws) {
        foundNodeId = nodeId;
      }
    });
    return foundNodeId;
  }

  /**
   * Handle incoming message
   */
  private handleMessage(tempId: string, message: SyncMessage): void {
    switch (message.type) {
      case SyncMessageType.HANDSHAKE:
        this.handleHandshake(tempId, message);
        break;

      case SyncMessageType.HEARTBEAT:
        this.handleHeartbeat(message.sourceNode);
        break;

      case SyncMessageType.SUBSCRIBE:
        this.handleSubscribe(message.sourceNode, message.payload as SubscriptionFilter);
        break;

      case SyncMessageType.UNSUBSCRIBE:
        this.handleUnsubscribe(message.sourceNode, message.payload as string[]);
        break;

      case SyncMessageType.MEMORY_CREATE:
      case SyncMessageType.MEMORY_UPDATE:
      case SyncMessageType.MEMORY_DELETE:
        this.handleMemoryOperation(message);
        break;

      case SyncMessageType.CRDT_OPERATION:
        this.handleCRDTOperation(message);
        break;

      case SyncMessageType.REQUEST_STATE:
        this.handleStateRequest(message.sourceNode);
        break;

      default:
        console.log(`[MESH] Unknown message type: ${message.type}`);
    }

    // Update vector clock
    if (message.vectorClock) {
      this.vectorClock = VectorClockOps.merge(this.vectorClock, message.vectorClock);
    }

    this.emit('messageReceived', message.sourceNode, message);
  }

  /**
   * Handle handshake from new node
   */
  private handleHandshake(tempId: string, message: SyncMessage): void {
    const payload = message.payload as { nodeId: NodeId; metadata?: Record<string, unknown> };

    if (this.nodes.size >= this.config.maxNodes) {
      const ws = this.connections.get(tempId);
      if (ws) {
        ws.close(1013, 'Max nodes reached');
      }
      this.connections.delete(tempId);
      return;
    }

    // Move connection from temp ID to actual node ID
    const ws = this.connections.get(tempId);
    if (ws) {
      this.connections.delete(tempId);
      this.connections.set(payload.nodeId.id, ws);
    }

    // Create node record
    const node: MeshNode = {
      nodeId: payload.nodeId,
      state: NodeState.CONNECTED,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      metadata: payload.metadata ?? {},
      subscriptions: new Set(),
      vectorClock: message.vectorClock || VectorClockOps.create(payload.nodeId.id),
    };

    this.nodes.set(payload.nodeId.id, node);

    // Send handshake acknowledgment
    this.sendMessage(payload.nodeId.id, {
      type: SyncMessageType.HANDSHAKE_ACK,
      payload: {
        accepted: true,
        serverNodeId: this.nodeId,
        currentNodes: this.getNodeList(),
      },
    });

    // Notify other nodes
    this.broadcast(
      {
        type: SyncMessageType.CHANGE_NOTIFICATION,
        payload: {
          event: 'node_joined',
          node: {
            id: payload.nodeId.id,
            name: payload.nodeId.name,
            type: payload.nodeId.type,
          },
        },
      },
      [payload.nodeId.id]
    );

    console.log(`[MESH] Node connected: ${payload.nodeId.name} (${payload.nodeId.id})`);
    this.emit('nodeConnected', node);
  }

  /**
   * Handle heartbeat from node
   */
  private handleHeartbeat(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.lastHeartbeat = new Date();
      this.sendMessage(nodeId, {
        type: SyncMessageType.HEARTBEAT_ACK,
        payload: { timestamp: Date.now() },
      });
    }
  }

  /**
   * Handle subscription request
   */
  private handleSubscribe(nodeId: string, filter: SubscriptionFilter): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // For now, subscribe to all memories (filter can be implemented later)
    if (filter.memoryIds) {
      for (const memoryId of filter.memoryIds) {
        node.subscriptions.add(memoryId);

        if (!this.subscriptions.has(memoryId)) {
          this.subscriptions.set(memoryId, new Set());
        }
        this.subscriptions.get(memoryId)!.add(nodeId);
      }
    }

    this.sendMessage(nodeId, {
      type: SyncMessageType.SUBSCRIPTION_ACK,
      payload: { subscribed: filter.memoryIds || [] },
    });
  }

  /**
   * Handle unsubscribe request
   */
  private handleUnsubscribe(nodeId: string, memoryIds: string[]): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    for (const memoryId of memoryIds) {
      node.subscriptions.delete(memoryId);
      const subscribers = this.subscriptions.get(memoryId);
      if (subscribers) {
        subscribers.delete(nodeId);
        if (subscribers.size === 0) {
          this.subscriptions.delete(memoryId);
        }
      }
    }
  }

  /**
   * Handle memory operation
   */
  private handleMemoryOperation(message: SyncMessage): void {
    const payload = message.payload as MemoryChangeEvent;

    // Update local CRDT state
    this.vectorClock = VectorClockOps.increment(this.vectorClock, this.nodeId);

    if (message.type === SyncMessageType.MEMORY_DELETE) {
      this.memoryState.delete(payload.memoryId, message.sourceNode, message.timestamp);
    } else {
      // Check for conflicts
      const existing = this.memoryState.get(payload.memoryId);
      if (existing && VectorClockOps.areConcurrent(payload.vectorClock, this.vectorClock)) {
        this.emit('conflictDetected', payload.memoryId, existing, payload.newValue);
      }

      this.memoryState.set(
        payload.memoryId,
        payload.newValue,
        message.sourceNode,
        message.timestamp
      );
    }

    // Notify subscribers
    const subscribers = this.subscriptions.get(payload.memoryId);
    if (subscribers) {
      subscribers.forEach((subscriberNodeId) => {
        if (subscriberNodeId !== message.sourceNode) {
          this.sendMessage(subscriberNodeId, {
            type: SyncMessageType.CHANGE_NOTIFICATION,
            payload: {
              ...payload,
              vectorClock: this.vectorClock,
            },
          });
        }
      });
    }

    // Broadcast to all nodes for sync
    this.broadcast(message, [message.sourceNode]);

    this.emit('memoryChanged', payload);
  }

  /**
   * Handle CRDT operation
   */
  private handleCRDTOperation(message: SyncMessage): void {
    const payload = message.payload as {
      memoryId: string;
      operation: string;
      data: unknown;
    };

    // Apply CRDT operation and broadcast
    this.broadcast(message, [message.sourceNode]);
  }

  /**
   * Handle state request
   */
  private handleStateRequest(nodeId: string): void {
    // Send current memory state
    this.sendMessage(nodeId, {
      type: SyncMessageType.STATE_RESPONSE,
      payload: {
        vectorClock: this.vectorClock,
        nodeCount: this.nodes.size,
        // Memory state would be serialized here
      },
    });
  }

  /**
   * Handle node disconnect
   */
  private handleDisconnect(nodeId: string, reason: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Clean up subscriptions
    node.subscriptions.forEach((memoryId) => {
      const subscribers = this.subscriptions.get(memoryId);
      if (subscribers) {
        subscribers.delete(nodeId);
        if (subscribers.size === 0) {
          this.subscriptions.delete(memoryId);
        }
      }
    });

    // Remove node
    this.nodes.delete(nodeId);
    this.connections.delete(nodeId);

    // Notify other nodes
    this.broadcast({
      type: SyncMessageType.CHANGE_NOTIFICATION,
      payload: {
        event: 'node_left',
        nodeId,
        reason,
      },
    });

    console.log(`[MESH] Node disconnected: ${node.nodeId.name} - ${reason}`);
    this.emit('nodeDisconnected', nodeId, reason);
  }

  /**
   * Check heartbeats and disconnect stale nodes
   */
  private checkHeartbeats(): void {
    const now = Date.now();
    const timeout = this.config.heartbeatTimeoutMs;

    this.nodes.forEach((node, nodeId) => {
      const lastHeartbeat = node.lastHeartbeat.getTime();
      if (now - lastHeartbeat > timeout) {
        this.handleDisconnect(nodeId, 'Heartbeat timeout');
      }
    });
  }

  /**
   * Send message to a specific node
   */
  sendMessage(
    nodeId: string,
    message: Omit<SyncMessage, 'id' | 'sourceNode' | 'timestamp' | 'vectorClock'>
  ): void {
    const ws = this.connections.get(nodeId);
    if (!ws || ws.readyState !== 1) return;

    const fullMessage: SyncMessage = {
      ...message,
      id: crypto.randomUUID(),
      sourceNode: this.nodeId,
      timestamp: Date.now(),
      vectorClock: this.vectorClock,
    };

    try {
      ws.send(JSON.stringify(fullMessage));
    } catch (error) {
      console.error(`[MESH] Failed to send message to ${nodeId}:`, error);
    }
  }

  /**
   * Broadcast message to all nodes except excluded ones
   */
  broadcast(
    message: Omit<SyncMessage, 'id' | 'sourceNode' | 'timestamp' | 'vectorClock'>,
    exclude: string[] = []
  ): void {
    this.nodes.forEach((_, nodeId) => {
      if (!exclude.includes(nodeId)) {
        this.sendMessage(nodeId, message);
      }
    });
  }

  /**
   * Notify memory change to subscribers
   */
  notifyMemoryChange(event: MemoryChangeEvent): void {
    this.vectorClock = VectorClockOps.increment(this.vectorClock, this.nodeId);

    const message: Omit<SyncMessage, 'id' | 'sourceNode' | 'timestamp' | 'vectorClock'> = {
      type:
        event.operation === 'create'
          ? SyncMessageType.MEMORY_CREATE
          : event.operation === 'update'
            ? SyncMessageType.MEMORY_UPDATE
            : SyncMessageType.MEMORY_DELETE,
      payload: {
        ...event,
        vectorClock: this.vectorClock,
      },
    };

    this.broadcast(message);
  }

  /**
   * Get list of connected nodes
   */
  getNodeList(): Array<{ id: string; name: string; type: string; state: NodeState }> {
    const list: Array<{ id: string; name: string; type: string; state: NodeState }> = [];
    this.nodes.forEach((node) => {
      list.push({
        id: node.nodeId.id,
        name: node.nodeId.name,
        type: node.nodeId.type,
        state: node.state,
      });
    });
    return list;
  }

  /**
   * Get node by ID
   */
  getNode(nodeId: string): MeshNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get server stats
   */
  getStats(): {
    nodeId: string;
    connectedNodes: number;
    totalSubscriptions: number;
    vectorClock: VectorClock;
  } {
    let totalSubscriptions = 0;
    this.subscriptions.forEach((subscribers) => {
      totalSubscriptions += subscribers.size;
    });

    return {
      nodeId: this.nodeId,
      connectedNodes: this.nodes.size,
      totalSubscriptions,
      vectorClock: this.vectorClock,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MeshSyncServer;
