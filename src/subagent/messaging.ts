/**
 * Subagent Messaging Protocol Module
 *
 * Provides:
 * - Direct agent-to-agent messaging
 * - Broadcast messaging to all agents
 * - Priority-based message queuing
 * - Message acknowledgment and delivery tracking
 * - Topic-based pub/sub messaging
 *
 * @module subagent/messaging
 */

import { EventEmitter } from 'events';
import { AgentRole } from './bootstrap';
import { SubagentRegistry, getGlobalRegistry, AgentStatus } from './registry';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Message priority levels
 */
export enum MessagePriority {
  /** Time-critical, immediate delivery */
  CRITICAL = 'critical',
  /** High priority, should be processed soon */
  HIGH = 'high',
  /** Normal priority */
  NORMAL = 'normal',
  /** Low priority, can be delayed */
  LOW = 'low',
}

/**
 * Message types
 */
export enum MessageType {
  /** Direct message to specific agent */
  DIRECT = 'direct',
  /** Broadcast to all agents */
  BROADCAST = 'broadcast',
  /** Message to topic subscribers */
  TOPIC = 'topic',
  /** Request expecting response */
  REQUEST = 'request',
  /** Response to a request */
  RESPONSE = 'response',
  /** Progress update */
  PROGRESS = 'progress',
  /** System notification */
  SYSTEM = 'system',
  /** Error notification */
  ERROR = 'error',
}

/**
 * Message delivery status
 */
export enum DeliveryStatus {
  /** Message queued for delivery */
  QUEUED = 'queued',
  /** Message sent to recipient */
  SENT = 'sent',
  /** Message delivered and acknowledged */
  DELIVERED = 'delivered',
  /** Message read by recipient */
  READ = 'read',
  /** Delivery failed */
  FAILED = 'failed',
  /** Message expired before delivery */
  EXPIRED = 'expired',
}

/**
 * Message structure
 */
export interface AgentMessage {
  /** Unique message identifier */
  id: string;
  /** Message type */
  type: MessageType;
  /** Message priority */
  priority: MessagePriority;
  /** Sender agent ID */
  senderId: string;
  /** Recipient agent ID (for direct messages) */
  recipientId?: string;
  /** Topic (for topic messages) */
  topic?: string;
  /** Request ID (for responses) */
  requestId?: string;
  /** Message subject/title */
  subject: string;
  /** Message body/content */
  body: unknown;
  /** Message metadata */
  metadata: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: Date;
  /** Expiration timestamp */
  expiresAt?: Date;
  /** Delivery status */
  status: DeliveryStatus;
  /** Delivery attempts */
  deliveryAttempts: number;
  /** Last delivery attempt */
  lastAttemptAt?: Date;
  /** Delivery error message */
  deliveryError?: string;
  /** Whether message requires acknowledgment */
  requiresAck: boolean;
  /** Acknowledgment received */
  acknowledged: boolean;
  /** Acknowledgment timestamp */
  acknowledgedAt?: Date;
}

/**
 * Message envelope for transport
 */
export interface MessageEnvelope {
  /** The message */
  message: AgentMessage;
  /** Routing metadata */
  routing: {
    /** Original sender */
    origin: string;
    /** Final destination */
    destination: string;
    /** Relay path */
    path: string[];
    /** Hop count */
    hops: number;
    /** Maximum hops allowed */
    maxHops: number;
  };
}

/**
 * Send options
 */
export interface SendOptions {
  /** Message priority */
  priority?: MessagePriority;
  /** Expiration time in ms */
  expiresInMs?: number;
  /** Require acknowledgment */
  requiresAck?: boolean;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Timeout for request/response in ms */
  timeout?: number;
}

/**
 * Topic subscription
 */
export interface TopicSubscription {
  /** Topic name */
  topic: string;
  /** Subscriber agent ID */
  subscriberId: string;
  /** Subscription timestamp */
  subscribedAt: Date;
  /** Message filter */
  filter?: (message: AgentMessage) => boolean;
}

/**
 * Message handler function
 */
export type MessageHandler = (message: AgentMessage) => void | Promise<void>;

/**
 * Request handler function (returns response body)
 */
export type RequestHandler = (message: AgentMessage) => unknown | Promise<unknown>;

/**
 * Messaging statistics
 */
export interface MessagingStats {
  /** Total messages sent */
  messagesSent: number;
  /** Total messages received */
  messagesReceived: number;
  /** Messages by type */
  byType: Record<MessageType, number>;
  /** Messages by priority */
  byPriority: Record<MessagePriority, number>;
  /** Failed deliveries */
  failedDeliveries: number;
  /** Active subscriptions */
  activeSubscriptions: number;
  /** Pending messages in queue */
  pendingMessages: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default message expiration (1 hour) */
const DEFAULT_EXPIRATION_MS = 3600000;

/** Maximum message hops for relay */
const MAX_MESSAGE_HOPS = 10;

/** Default request timeout (30 seconds) */
const DEFAULT_REQUEST_TIMEOUT_MS = 30000;

/** Queue processing interval */
const QUEUE_PROCESS_INTERVAL_MS = 100;

// ============================================================================
// MESSAGE BUS
// ============================================================================

/**
 * Agent Message Bus
 *
 * Centralized messaging system for inter-agent communication.
 * Supports direct messaging, broadcast, topics, and request/response.
 */
export class AgentMessageBus extends EventEmitter {
  private registry: SubagentRegistry;
  private messageQueues: Map<string, AgentMessage[]> = new Map();
  private subscriptions: Map<string, TopicSubscription[]> = new Map();
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private requestHandlers: Map<string, RequestHandler> = new Map();
  private pendingRequests: Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (reason: unknown) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map();
  private messageLog: AgentMessage[] = [];
  private stats: MessagingStats;
  private processInterval?: NodeJS.Timeout;
  private maxLogSize: number;

  constructor(registry?: SubagentRegistry, options?: { maxLogSize?: number }) {
    super();
    this.registry = registry || getGlobalRegistry();
    this.maxLogSize = options?.maxLogSize || 1000;
    this.stats = this.initStats();
    this.startProcessing();
  }

  /**
   * Send a direct message to a specific agent
   *
   * @param senderId - Sender agent ID
   * @param recipientId - Recipient agent ID
   * @param subject - Message subject
   * @param body - Message body
   * @param options - Send options
   * @returns Created message
   */
  sendToAgent(
    senderId: string,
    recipientId: string,
    subject: string,
    body: unknown,
    options: SendOptions = {}
  ): AgentMessage {
    const message = this.createMessage(MessageType.DIRECT, senderId, subject, body, options);
    message.recipientId = recipientId;

    return this.queueMessage(message);
  }

  /**
   * Broadcast a message to all agents
   *
   * @param senderId - Sender agent ID
   * @param subject - Message subject
   * @param body - Message body
   * @param options - Send options
   * @returns Created message
   */
  broadcastToAll(
    senderId: string,
    subject: string,
    body: unknown,
    options: SendOptions = {}
  ): AgentMessage {
    const message = this.createMessage(MessageType.BROADCAST, senderId, subject, body, options);

    // Queue for all active agents
    const agents = this.registry.discoverPeers({
      statuses: [AgentStatus.ACTIVE, AgentStatus.BUSY, AgentStatus.IDLE],
      excludeAgentIds: [senderId],
    });

    for (const agent of agents) {
      const copy = { ...message, id: this.generateId(), recipientId: agent.id };
      this.queueMessage(copy);
    }

    this.stats.messagesSent++;
    this.stats.byType[MessageType.BROADCAST]++;
    this.stats.byPriority[message.priority]++;

    return message;
  }

  /**
   * Publish a message to a topic
   *
   * @param senderId - Sender agent ID
   * @param topic - Topic name
   * @param subject - Message subject
   * @param body - Message body
   * @param options - Send options
   * @returns Created message
   */
  publishToTopic(
    senderId: string,
    topic: string,
    subject: string,
    body: unknown,
    options: SendOptions = {}
  ): AgentMessage {
    const message = this.createMessage(MessageType.TOPIC, senderId, subject, body, options);
    message.topic = topic;

    // Get topic subscribers
    const subscriptions = this.subscriptions.get(topic) || [];

    for (const sub of subscriptions) {
      if (sub.subscriberId === senderId) continue;
      if (sub.filter && !sub.filter(message)) continue;

      const copy = { ...message, id: this.generateId(), recipientId: sub.subscriberId };
      this.queueMessage(copy);
    }

    this.stats.messagesSent++;
    this.stats.byType[MessageType.TOPIC]++;
    this.stats.byPriority[message.priority]++;

    return message;
  }

  /**
   * Send a request and wait for response
   *
   * @param senderId - Sender agent ID
   * @param recipientId - Recipient agent ID
   * @param subject - Request subject
   * @param body - Request body
   * @param options - Send options
   * @returns Promise resolving to response body
   */
  async sendRequest(
    senderId: string,
    recipientId: string,
    subject: string,
    body: unknown,
    options: SendOptions = {}
  ): Promise<unknown> {
    const message = this.createMessage(MessageType.REQUEST, senderId, subject, body, {
      ...options,
      requiresAck: true,
    });
    message.recipientId = recipientId;

    const timeout = options.timeout || DEFAULT_REQUEST_TIMEOUT_MS;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error(`Request ${message.id} timed out after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(message.id, {
        resolve,
        reject,
        timeout: timeoutId,
      });

      this.queueMessage(message);
    });
  }

  /**
   * Send a response to a request
   *
   * @param senderId - Sender agent ID
   * @param requestMessage - Original request message
   * @param body - Response body
   * @returns Created response message
   */
  sendResponse(senderId: string, requestMessage: AgentMessage, body: unknown): AgentMessage {
    const message = this.createMessage(
      MessageType.RESPONSE,
      senderId,
      `Re: ${requestMessage.subject}`,
      body,
      { priority: requestMessage.priority }
    );
    message.recipientId = requestMessage.senderId;
    message.requestId = requestMessage.id;

    return this.queueMessage(message);
  }

  /**
   * Subscribe to a topic
   *
   * @param subscriberId - Subscriber agent ID
   * @param topic - Topic name
   * @param filter - Optional message filter
   * @returns Subscription object
   */
  subscribe(
    subscriberId: string,
    topic: string,
    filter?: (message: AgentMessage) => boolean
  ): TopicSubscription {
    const subscription: TopicSubscription = {
      topic,
      subscriberId,
      subscribedAt: new Date(),
      filter,
    };

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }

    // Remove existing subscription if any
    this.unsubscribe(subscriberId, topic);

    this.subscriptions.get(topic)!.push(subscription);
    this.stats.activeSubscriptions++;

    return subscription;
  }

  /**
   * Unsubscribe from a topic
   *
   * @param subscriberId - Subscriber agent ID
   * @param topic - Topic name
   * @returns Whether subscription was found and removed
   */
  unsubscribe(subscriberId: string, topic: string): boolean {
    const subs = this.subscriptions.get(topic);
    if (!subs) return false;

    const initialLength = subs.length;
    const filtered = subs.filter((s) => s.subscriberId !== subscriberId);
    this.subscriptions.set(topic, filtered);

    const removed = initialLength > filtered.length;
    if (removed) {
      this.stats.activeSubscriptions--;
    }

    return removed;
  }

  /**
   * Register a message handler for an agent
   *
   * @param agentId - Agent ID
   * @param handler - Message handler function
   */
  registerHandler(agentId: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(agentId)) {
      this.messageHandlers.set(agentId, []);
    }
    this.messageHandlers.get(agentId)!.push(handler);
  }

  /**
   * Register a request handler for an agent
   *
   * @param agentId - Agent ID
   * @param handler - Request handler function
   */
  registerRequestHandler(agentId: string, handler: RequestHandler): void {
    this.requestHandlers.set(agentId, handler);
  }

  /**
   * Get pending messages for an agent
   *
   * @param agentId - Agent ID
   * @param limit - Maximum messages to return
   * @returns Pending messages
   */
  getMessages(agentId: string, limit?: number): AgentMessage[] {
    const queue = this.messageQueues.get(agentId) || [];
    if (limit) {
      return queue.slice(0, limit);
    }
    return [...queue];
  }

  /**
   * Acknowledge message receipt
   *
   * @param messageId - Message ID
   * @param agentId - Acknowledging agent ID
   */
  acknowledge(messageId: string, agentId: string): void {
    const queue = this.messageQueues.get(agentId) || [];
    const message = queue.find((m) => m.id === messageId);

    if (message) {
      message.acknowledged = true;
      message.acknowledgedAt = new Date();
      message.status = DeliveryStatus.DELIVERED;

      // Remove from queue
      this.messageQueues.set(
        agentId,
        queue.filter((m) => m.id !== messageId)
      );

      // Handle response resolution
      if (message.type === MessageType.RESPONSE && message.requestId) {
        const pending = this.pendingRequests.get(message.requestId);
        if (pending) {
          clearTimeout(pending.timeout);
          pending.resolve(message.body);
          this.pendingRequests.delete(message.requestId);
        }
      }
    }
  }

  /**
   * Mark message as read
   *
   * @param messageId - Message ID
   * @param agentId - Reading agent ID
   */
  markAsRead(messageId: string, agentId: string): void {
    const message = this.findMessage(messageId);
    if (message && message.recipientId === agentId) {
      message.status = DeliveryStatus.READ;
    }
  }

  /**
   * Get messaging statistics
   */
  getStats(): MessagingStats {
    return {
      ...this.stats,
      pendingMessages: this.countPendingMessages(),
    };
  }

  /**
   * Get message by ID
   */
  getMessage(messageId: string): AgentMessage | undefined {
    return this.messageLog.find((m) => m.id === messageId);
  }

  /**
   * Get message history
   *
   * @param options - Filter options
   * @returns Messages matching filter
   */
  getHistory(
    options: {
      senderId?: string;
      recipientId?: string;
      type?: MessageType;
      topic?: string;
      since?: Date;
      limit?: number;
    } = {}
  ): AgentMessage[] {
    let messages = [...this.messageLog];

    if (options.senderId) {
      messages = messages.filter((m) => m.senderId === options.senderId);
    }
    if (options.recipientId) {
      messages = messages.filter((m) => m.recipientId === options.recipientId);
    }
    if (options.type) {
      messages = messages.filter((m) => m.type === options.type);
    }
    if (options.topic) {
      messages = messages.filter((m) => m.topic === options.topic);
    }
    if (options.since) {
      messages = messages.filter((m) => m.createdAt >= options.since!);
    }

    // Sort by creation time descending
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options.limit) {
      messages = messages.slice(0, options.limit);
    }

    return messages;
  }

  /**
   * Clear all queues and history (for testing)
   */
  clear(): void {
    this.messageQueues.clear();
    this.subscriptions.clear();
    this.messageHandlers.clear();
    this.requestHandlers.clear();
    this.pendingRequests.forEach((p) => clearTimeout(p.timeout));
    this.pendingRequests.clear();
    this.messageLog = [];
    this.stats = this.initStats();
  }

  /**
   * Stop message processing
   */
  stop(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = undefined;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Initialize statistics
   */
  private initStats(): MessagingStats {
    return {
      messagesSent: 0,
      messagesReceived: 0,
      byType: Object.values(MessageType).reduce(
        (acc, type) => ({ ...acc, [type]: 0 }),
        {} as Record<MessageType, number>
      ),
      byPriority: Object.values(MessagePriority).reduce(
        (acc, priority) => ({ ...acc, [priority]: 0 }),
        {} as Record<MessagePriority, number>
      ),
      failedDeliveries: 0,
      activeSubscriptions: 0,
      pendingMessages: 0,
    };
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new message
   */
  private createMessage(
    type: MessageType,
    senderId: string,
    subject: string,
    body: unknown,
    options: SendOptions
  ): AgentMessage {
    const now = new Date();
    const expiresInMs = options.expiresInMs || DEFAULT_EXPIRATION_MS;

    return {
      id: this.generateId(),
      type,
      priority: options.priority || MessagePriority.NORMAL,
      senderId,
      subject,
      body,
      metadata: options.metadata || {},
      createdAt: now,
      expiresAt: new Date(now.getTime() + expiresInMs),
      status: DeliveryStatus.QUEUED,
      deliveryAttempts: 0,
      requiresAck: options.requiresAck || false,
      acknowledged: false,
    };
  }

  /**
   * Queue a message for delivery
   */
  private queueMessage(message: AgentMessage): AgentMessage {
    const recipientId = message.recipientId;
    if (!recipientId) {
      throw new Error('Message must have a recipient');
    }

    if (!this.messageQueues.has(recipientId)) {
      this.messageQueues.set(recipientId, []);
    }

    const queue = this.messageQueues.get(recipientId)!;

    // Insert by priority
    const priorityOrder: Record<MessagePriority, number> = {
      [MessagePriority.CRITICAL]: 0,
      [MessagePriority.HIGH]: 1,
      [MessagePriority.NORMAL]: 2,
      [MessagePriority.LOW]: 3,
    };

    const insertIndex = queue.findIndex(
      (m) => priorityOrder[m.priority] > priorityOrder[message.priority]
    );

    if (insertIndex === -1) {
      queue.push(message);
    } else {
      queue.splice(insertIndex, 0, message);
    }

    // Add to message log
    this.addToLog(message);

    // Update stats
    this.stats.messagesSent++;
    this.stats.byType[message.type]++;
    this.stats.byPriority[message.priority]++;

    // Emit message queued event
    this.emit('messageQueued', message);

    return message;
  }

  /**
   * Add message to log
   */
  private addToLog(message: AgentMessage): void {
    this.messageLog.push(message);

    // Trim log if too large
    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog = this.messageLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Find message by ID in all queues
   */
  private findMessage(messageId: string): AgentMessage | undefined {
    for (const queue of this.messageQueues.values()) {
      const message = queue.find((m) => m.id === messageId);
      if (message) return message;
    }
    return this.messageLog.find((m) => m.id === messageId);
  }

  /**
   * Count pending messages across all queues
   */
  private countPendingMessages(): number {
    let count = 0;
    for (const queue of this.messageQueues.values()) {
      count += queue.length;
    }
    return count;
  }

  /**
   * Start message processing loop
   */
  private startProcessing(): void {
    this.processInterval = setInterval(() => {
      this.processQueues();
    }, QUEUE_PROCESS_INTERVAL_MS);
  }

  /**
   * Process message queues
   */
  private processQueues(): void {
    const now = Date.now();

    for (const [agentId, queue] of this.messageQueues.entries()) {
      // Check if agent is active
      const agent = this.registry.getAgent(agentId);
      if (!agent || agent.status === AgentStatus.OFFLINE || agent.status === AgentStatus.CRASHED) {
        continue;
      }

      // Process messages
      const processable: AgentMessage[] = [];
      const remaining: AgentMessage[] = [];

      for (const message of queue) {
        // Check expiration
        if (message.expiresAt && message.expiresAt.getTime() < now) {
          message.status = DeliveryStatus.EXPIRED;
          this.emit('messageExpired', message);
          continue;
        }

        // Try to deliver
        message.deliveryAttempts++;
        message.lastAttemptAt = new Date();

        const handlers = this.messageHandlers.get(agentId) || [];
        if (handlers.length > 0) {
          processable.push(message);
        } else {
          // No handler, keep in queue
          remaining.push(message);
        }
      }

      // Update queue
      this.messageQueues.set(agentId, remaining);

      // Deliver messages
      for (const message of processable) {
        this.deliverMessage(agentId, message);
      }
    }
  }

  /**
   * Deliver message to handlers
   */
  private async deliverMessage(agentId: string, message: AgentMessage): Promise<void> {
    try {
      message.status = DeliveryStatus.SENT;

      // Handle request type specially
      if (message.type === MessageType.REQUEST) {
        const requestHandler = this.requestHandlers.get(agentId);
        if (requestHandler) {
          const response = await requestHandler(message);
          // Auto-respond
          this.sendResponse(agentId, message, response);
        }
      }

      // Call all handlers
      const handlers = this.messageHandlers.get(agentId) || [];
      for (const handler of handlers) {
        try {
          await handler(message);
        } catch (error) {
          this.emit('handlerError', { agentId, message, error });
        }
      }

      this.stats.messagesReceived++;
      this.emit('messageDelivered', message);

      // Auto-acknowledge if not requiring explicit ack
      if (!message.requiresAck) {
        message.status = DeliveryStatus.DELIVERED;
        message.acknowledged = true;
        message.acknowledgedAt = new Date();
      }
    } catch (error) {
      message.status = DeliveryStatus.FAILED;
      message.deliveryError = error instanceof Error ? error.message : String(error);
      this.stats.failedDeliveries++;
      this.emit('deliveryFailed', { message, error });
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/** Global message bus instance */
let globalMessageBus: AgentMessageBus | null = null;

/**
 * Get the global message bus
 */
export function getGlobalMessageBus(): AgentMessageBus {
  if (!globalMessageBus) {
    globalMessageBus = new AgentMessageBus();
  }
  return globalMessageBus;
}

/**
 * Create a new message bus
 */
export function createMessageBus(
  registry?: SubagentRegistry,
  options?: { maxLogSize?: number }
): AgentMessageBus {
  return new AgentMessageBus(registry, options);
}

/**
 * Reset the global message bus (for testing)
 */
export function resetGlobalMessageBus(): void {
  if (globalMessageBus) {
    globalMessageBus.stop();
    globalMessageBus = null;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Send a direct message using global bus
 */
export function sendMessage(
  senderId: string,
  recipientId: string,
  subject: string,
  body: unknown,
  options?: SendOptions
): AgentMessage {
  return getGlobalMessageBus().sendToAgent(senderId, recipientId, subject, body, options);
}

/**
 * Broadcast using global bus
 */
export function broadcast(
  senderId: string,
  subject: string,
  body: unknown,
  options?: SendOptions
): AgentMessage {
  return getGlobalMessageBus().broadcastToAll(senderId, subject, body, options);
}

/**
 * Publish to topic using global bus
 */
export function publish(
  senderId: string,
  topic: string,
  subject: string,
  body: unknown,
  options?: SendOptions
): AgentMessage {
  return getGlobalMessageBus().publishToTopic(senderId, topic, subject, body, options);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AgentMessageBus;
