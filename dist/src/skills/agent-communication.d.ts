/**
 * Agent Communication System Skill
 *
 * Implements reliable message passing between agents with proper routing, delivery guarantees,
 * and shared state management, while avoiding the illusion of zero-cost communication.
 *
 * Based on principles from UPLIFTED_SKILLS.md:
 * - Message Delivery Has Failure Modes
 * - Shared State Requires Conflict Resolution
 * - Routing Strategy Affects Performance
 * - Quality Gates in Communication
 */
export interface AgentMessage {
    id: string;
    from: string;
    to: string;
    type: 'request' | 'response' | 'broadcast' | 'error';
    payload: unknown;
    timestamp: number;
    correlationId?: string;
    metadata: MessageMetadata;
}
export interface MessageMetadata {
    priority: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number;
    retryCount?: number;
    requiresAck?: boolean;
}
export interface MessageResult {
    success: boolean;
    messageId: string;
    deliveryStatus: DeliveryStatus;
    timestamp: number;
    error?: ErrorDetails;
    metrics: DeliveryMetrics;
}
export interface BroadcastResult {
    messageId: string;
    totalTargets: number;
    successCount: number;
    failureCount: number;
    results: Map<string, MessageResult>;
    metrics: BroadcastMetrics;
}
export interface DeliveryStatus {
    status: 'sent' | 'delivered' | 'acknowledged' | 'failed' | 'timeout' | 'dead_letter';
    attemptCount: number;
    lastAttemptTimestamp: number;
    failureReason?: string;
}
export interface ErrorDetails {
    code: string;
    message: string;
    retryable: boolean;
    originalError?: unknown;
}
export interface DeliveryMetrics {
    sendTime: number;
    deliveryTime?: number;
    totalLatency?: number;
    attemptCount: number;
}
export interface BroadcastMetrics {
    totalTime: number;
    averageLatency: number;
    maxLatency: number;
    minLatency: number;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: string[];
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
export interface MessageChannel {
    id: string;
    agentA: string;
    agentB: string;
    send(from: string, to: string, payload: unknown): Promise<MessageResult>;
    close(): void;
    isClosed(): boolean;
}
export interface QueryOptions {
    limit?: number;
    offset?: number;
    startTime?: number;
    endTime?: number;
    messageType?: AgentMessage['type'];
    includePayload?: boolean;
}
export interface CircuitBreakerState {
    destination: string;
    state: 'closed' | 'open' | 'half_open';
    failureCount: number;
    lastFailureTime?: number;
    nextRetryTime?: number;
}
export declare class AgentCommunicationSystem {
    private messageHistory;
    private deliveryStatuses;
    private deadLetterQueue;
    private circuitBreakers;
    private messageChannels;
    private messageCounter;
    /**
     * Send a message with delivery confirmation
     *
     * Quality gate: Validates message before sending
     * Error handling: Retry with exponential backoff, circuit breaker, timeout
     *
     * Anti-pattern avoided: The Perfect Network (assuming messages never fail)
     */
    sendMessage(message: AgentMessage): Promise<MessageResult>;
    /**
     * Broadcast message to multiple targets
     *
     * Quality gate: Parallel delivery with individual tracking
     * Measurement: Tracks success/failure rates and latency per target
     *
     * Anti-pattern avoided: Assuming broadcast is free (measure overhead)
     */
    broadcastMessage(message: AgentMessage, targets: string[]): Promise<BroadcastResult>;
    /**
     * Validate message format and payload
     *
     * Quality gate: Input validation prevents malformed messages
     * Anti-pattern avoided: Trusting client input without validation
     */
    validateMessage(message: AgentMessage): ValidationResult;
    /**
     * Create a bidirectional message channel between two agents
     *
     * Quality gate: Channel-specific routing and state management
     * Measurement: Tracks channel-specific metrics
     */
    createMessageChannel(agentA: string, agentB: string): MessageChannel;
    /**
     * Get message history for an agent with query options
     *
     * Quality gate: Audit trail for debugging and compliance
     * Measurement: Query performance tracked (not just returned)
     */
    getMessageHistory(agentId: string, options?: QueryOptions): AgentMessage[];
    /**
     * Get dead letter queue messages
     *
     * Quality gate: Failed messages tracked for investigation
     * Evidence-based debugging: Can analyze what failed and why
     */
    getDeadLetterQueue(): AgentMessage[];
    /**
     * Get circuit breaker states
     *
     * Measurement: Can observe which destinations are failing
     * Debugging: Helps identify communication issues
     */
    getCircuitBreakerStates(): CircuitBreakerState[];
    /**
     * Get delivery status for a message
     *
     * Quality gate: Transparency into message delivery
     */
    getDeliveryStatus(messageId: string): DeliveryStatus | undefined;
    /**
     * Reset circuit breaker for a destination
     *
     * Manual intervention when destination is known to be fixed
     */
    resetCircuitBreaker(destination: string): void;
    /**
     * Clear dead letter queue
     *
     * After investigating failed messages, clear the queue
     */
    clearDeadLetterQueue(): void;
    /**
     * Attempt delivery with retry logic and exponential backoff
     *
     * Anti-pattern avoided: Unbounded Retries (explicit max attempts)
     * Quality gate: Retry only for retryable errors
     */
    private _attemptDeliveryWithRetry;
    /**
     * Simulate message delivery
     *
     * In a real implementation, this would:
     * - Send message over network
     * - Write to message queue
     * - Invoke agent's message handler
     * - Wait for acknowledgment if required
     */
    private _deliverMessage;
    /**
     * Classify error for retry logic
     *
     * Quality gate: Distinguish retryable from permanent errors
     * Evidence-based: Error codes guide retry decisions
     */
    private _classifyError;
    /**
     * Check circuit breaker state
     *
     * Anti-pattern avoided: Continuing to hammer failing destination
     * Quality gate: Stops cascade failures
     */
    private _checkCircuitBreaker;
    /**
     * Update circuit breaker based on delivery result
     *
     * Measurement: Track failure count explicitly
     * Quality gate: Open circuit after threshold failures
     */
    private _updateCircuitBreaker;
    /**
     * Add message to dead letter queue
     *
     * Quality gate: Failed messages preserved for investigation
     * Measurement: Queue size limited to prevent memory issues
     */
    private _addToDeadLetterQueue;
    /**
     * Generate unique message ID
     */
    private _generateMessageId;
    /**
     * Generate channel ID from two agent IDs
     */
    private _generateChannelId;
    /**
     * Sleep utility for backoff
     */
    private _sleep;
}
/**
 * Create a new agent communication system instance
 */
export declare function createAgentCommunicationSystem(): AgentCommunicationSystem;
/**
 * Create a message with proper defaults
 */
export declare function createMessage(from: string, to: string, payload: unknown, options?: {
    type?: AgentMessage['type'];
    priority?: MessageMetadata['priority'];
    ttl?: number;
    requiresAck?: boolean;
    correlationId?: string;
}): AgentMessage;
/**
 * Format message result for display
 *
 * Measurement: Show actual metrics, not fabricated summaries
 */
export declare function formatMessageResult(result: MessageResult): string;
/**
 * Format broadcast result for display
 *
 * Measurement: Show success/failure breakdown, not just "completed"
 */
export declare function formatBroadcastResult(result: BroadcastResult): string;
declare const _default: AgentCommunicationSystem;
export default _default;
//# sourceMappingURL=agent-communication.d.ts.map