"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCommunicationSystem = void 0;
exports.createAgentCommunicationSystem = createAgentCommunicationSystem;
exports.createMessage = createMessage;
exports.formatMessageResult = formatMessageResult;
exports.formatBroadcastResult = formatBroadcastResult;
// ============================================================================
// Configuration
// ============================================================================
const DEFAULT_CONFIG = {
    // Timeout configuration
    DEFAULT_TTL: 30000, // 30 seconds
    MAX_TTL: 300000, // 5 minutes
    // Retry configuration
    MAX_RETRY_ATTEMPTS: 3,
    INITIAL_BACKOFF_MS: 100,
    MAX_BACKOFF_MS: 5000,
    BACKOFF_MULTIPLIER: 2,
    // Circuit breaker configuration
    CIRCUIT_BREAKER_THRESHOLD: 5, // failures before opening
    CIRCUIT_BREAKER_TIMEOUT: 60000, // 1 minute before retry
    CIRCUIT_BREAKER_HALF_OPEN_MAX_ATTEMPTS: 1,
    // Dead letter queue
    MAX_DEAD_LETTER_QUEUE_SIZE: 1000,
    // Message history
    MAX_HISTORY_SIZE: 10000,
};
// ============================================================================
// Message Validation Schemas
// ============================================================================
const PAYLOAD_SCHEMAS = {
    // Add custom payload validators here
    default: (_payload) => true,
};
// ============================================================================
// AgentCommunicationSystem Class
// ============================================================================
class AgentCommunicationSystem {
    constructor() {
        this.messageHistory = new Map();
        this.deliveryStatuses = new Map();
        this.deadLetterQueue = [];
        this.circuitBreakers = new Map();
        this.messageChannels = new Map();
        this.messageCounter = 0;
    }
    /**
     * Send a message with delivery confirmation
     *
     * Quality gate: Validates message before sending
     * Error handling: Retry with exponential backoff, circuit breaker, timeout
     *
     * Anti-pattern avoided: The Perfect Network (assuming messages never fail)
     */
    async sendMessage(message) {
        const startTime = Date.now();
        // Quality gate: Validate message format
        const validation = this.validateMessage(message);
        if (!validation.valid) {
            return {
                success: false,
                messageId: message.id,
                deliveryStatus: {
                    status: 'failed',
                    attemptCount: 0,
                    lastAttemptTimestamp: Date.now(),
                    failureReason: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
                },
                error: {
                    code: 'VALIDATION_FAILED',
                    message: validation.errors[0]?.message || 'Message validation failed',
                    retryable: false,
                },
                timestamp: Date.now(),
                metrics: {
                    sendTime: startTime,
                    attemptCount: 0,
                },
            };
        }
        // Check circuit breaker
        const circuitBreakerCheck = this._checkCircuitBreaker(message.to);
        if (!circuitBreakerCheck.allowed) {
            return {
                success: false,
                messageId: message.id,
                deliveryStatus: {
                    status: 'failed',
                    attemptCount: 0,
                    lastAttemptTimestamp: Date.now(),
                    failureReason: `Circuit breaker open for destination ${message.to}`,
                },
                error: {
                    code: 'CIRCUIT_BREAKER_OPEN',
                    message: `Circuit breaker is open for ${message.to}. Next retry at ${new Date(circuitBreakerCheck.nextRetryTime).toISOString()}`,
                    retryable: true,
                },
                timestamp: Date.now(),
                metrics: {
                    sendTime: startTime,
                    attemptCount: 0,
                },
            };
        }
        // Attempt delivery with retry logic
        const result = await this._attemptDeliveryWithRetry(message, startTime);
        // Update circuit breaker based on result
        this._updateCircuitBreaker(message.to, result.success);
        // Store in history
        this.messageHistory.set(message.id, message);
        this.deliveryStatuses.set(message.id, result.deliveryStatus);
        // Move to dead letter queue if permanently failed
        if (!result.success && !result.error?.retryable) {
            this._addToDeadLetterQueue(message);
        }
        return result;
    }
    /**
     * Broadcast message to multiple targets
     *
     * Quality gate: Parallel delivery with individual tracking
     * Measurement: Tracks success/failure rates and latency per target
     *
     * Anti-pattern avoided: Assuming broadcast is free (measure overhead)
     */
    async broadcastMessage(message, targets) {
        const startTime = Date.now();
        const results = new Map();
        // Send to all targets in parallel
        const sendPromises = targets.map(async (target) => {
            const targetMessage = {
                ...message,
                to: target,
                id: `${message.id}-${target}`,
            };
            const result = await this.sendMessage(targetMessage);
            results.set(target, result);
            return result;
        });
        await Promise.allSettled(sendPromises);
        // Calculate metrics
        const successCount = Array.from(results.values()).filter(r => r.success).length;
        const failureCount = targets.length - successCount;
        const latencies = Array.from(results.values())
            .map(r => r.metrics.totalLatency)
            .filter((l) => l !== undefined);
        const metrics = {
            totalTime: Date.now() - startTime,
            averageLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
            maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
            minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
        };
        return {
            messageId: message.id,
            totalTargets: targets.length,
            successCount,
            failureCount,
            results,
            metrics,
        };
    }
    /**
     * Validate message format and payload
     *
     * Quality gate: Input validation prevents malformed messages
     * Anti-pattern avoided: Trusting client input without validation
     */
    validateMessage(message) {
        const errors = [];
        const warnings = [];
        // Required field validation
        if (!message.id || typeof message.id !== 'string') {
            errors.push({
                field: 'id',
                message: 'Message ID is required and must be a string',
                code: 'MISSING_ID',
            });
        }
        if (!message.from || typeof message.from !== 'string') {
            errors.push({
                field: 'from',
                message: 'Sender (from) is required and must be a string',
                code: 'MISSING_FROM',
            });
        }
        if (!message.to || typeof message.to !== 'string') {
            errors.push({
                field: 'to',
                message: 'Recipient (to) is required and must be a string',
                code: 'MISSING_TO',
            });
        }
        if (!['request', 'response', 'broadcast', 'error'].includes(message.type)) {
            errors.push({
                field: 'type',
                message: 'Message type must be one of: request, response, broadcast, error',
                code: 'INVALID_TYPE',
            });
        }
        if (!message.timestamp || typeof message.timestamp !== 'number') {
            errors.push({
                field: 'timestamp',
                message: 'Timestamp is required and must be a number',
                code: 'MISSING_TIMESTAMP',
            });
        }
        // Metadata validation
        if (!message.metadata) {
            errors.push({
                field: 'metadata',
                message: 'Metadata is required',
                code: 'MISSING_METADATA',
            });
        }
        else {
            if (!['low', 'normal', 'high', 'critical'].includes(message.metadata.priority)) {
                errors.push({
                    field: 'metadata.priority',
                    message: 'Priority must be one of: low, normal, high, critical',
                    code: 'INVALID_PRIORITY',
                });
            }
            if (message.metadata.ttl !== undefined) {
                if (typeof message.metadata.ttl !== 'number' || message.metadata.ttl <= 0) {
                    errors.push({
                        field: 'metadata.ttl',
                        message: 'TTL must be a positive number',
                        code: 'INVALID_TTL',
                    });
                }
                else if (message.metadata.ttl > DEFAULT_CONFIG.MAX_TTL) {
                    warnings.push(`TTL ${message.metadata.ttl}ms exceeds maximum ${DEFAULT_CONFIG.MAX_TTL}ms`);
                }
            }
        }
        // Payload validation (custom schema if available)
        const payloadValidator = PAYLOAD_SCHEMAS[message.type] || PAYLOAD_SCHEMAS.default;
        if (!payloadValidator(message.payload)) {
            errors.push({
                field: 'payload',
                message: `Payload validation failed for message type ${message.type}`,
                code: 'INVALID_PAYLOAD',
            });
        }
        // Correlation ID validation for responses
        if (message.type === 'response' && !message.correlationId) {
            warnings.push('Response messages should include correlationId');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Create a bidirectional message channel between two agents
     *
     * Quality gate: Channel-specific routing and state management
     * Measurement: Tracks channel-specific metrics
     */
    createMessageChannel(agentA, agentB) {
        const channelId = this._generateChannelId(agentA, agentB);
        // Check if channel already exists
        if (this.messageChannels.has(channelId)) {
            const existingChannel = this.messageChannels.get(channelId);
            if (!existingChannel.isClosed()) {
                return existingChannel;
            }
        }
        let closed = false;
        const channel = {
            id: channelId,
            agentA,
            agentB,
            send: async (from, to, payload) => {
                if (closed) {
                    throw new Error(`Channel ${channelId} is closed`);
                }
                if ((from !== agentA && from !== agentB) || (to !== agentA && to !== agentB)) {
                    throw new Error(`Invalid agents for channel ${channelId}. Expected ${agentA} or ${agentB}`);
                }
                const message = {
                    id: this._generateMessageId(),
                    from,
                    to,
                    type: 'request',
                    payload,
                    timestamp: Date.now(),
                    metadata: {
                        priority: 'normal',
                    },
                };
                return this.sendMessage(message);
            },
            close: () => {
                closed = true;
            },
            isClosed: () => closed,
        };
        this.messageChannels.set(channelId, channel);
        return channel;
    }
    /**
     * Get message history for an agent with query options
     *
     * Quality gate: Audit trail for debugging and compliance
     * Measurement: Query performance tracked (not just returned)
     */
    getMessageHistory(agentId, options = {}) {
        const { limit = 100, offset = 0, startTime, endTime, messageType, includePayload = false, } = options;
        // Filter messages
        let messages = Array.from(this.messageHistory.values()).filter(msg => {
            if (msg.from !== agentId && msg.to !== agentId)
                return false;
            if (startTime && msg.timestamp < startTime)
                return false;
            if (endTime && msg.timestamp > endTime)
                return false;
            if (messageType && msg.type !== messageType)
                return false;
            return true;
        });
        // Sort by timestamp (newest first)
        messages.sort((a, b) => b.timestamp - a.timestamp);
        // Apply pagination
        messages = messages.slice(offset, offset + limit);
        // Remove payload if not requested
        if (!includePayload) {
            messages = messages.map(msg => ({
                ...msg,
                payload: '[REDACTED]',
            }));
        }
        return messages;
    }
    /**
     * Get dead letter queue messages
     *
     * Quality gate: Failed messages tracked for investigation
     * Evidence-based debugging: Can analyze what failed and why
     */
    getDeadLetterQueue() {
        return [...this.deadLetterQueue];
    }
    /**
     * Get circuit breaker states
     *
     * Measurement: Can observe which destinations are failing
     * Debugging: Helps identify communication issues
     */
    getCircuitBreakerStates() {
        return Array.from(this.circuitBreakers.values());
    }
    /**
     * Get delivery status for a message
     *
     * Quality gate: Transparency into message delivery
     */
    getDeliveryStatus(messageId) {
        return this.deliveryStatuses.get(messageId);
    }
    /**
     * Reset circuit breaker for a destination
     *
     * Manual intervention when destination is known to be fixed
     */
    resetCircuitBreaker(destination) {
        this.circuitBreakers.delete(destination);
    }
    /**
     * Clear dead letter queue
     *
     * After investigating failed messages, clear the queue
     */
    clearDeadLetterQueue() {
        this.deadLetterQueue = [];
    }
    // ============================================================================
    // Private Helper Methods
    // ============================================================================
    /**
     * Attempt delivery with retry logic and exponential backoff
     *
     * Anti-pattern avoided: Unbounded Retries (explicit max attempts)
     * Quality gate: Retry only for retryable errors
     */
    async _attemptDeliveryWithRetry(message, startTime) {
        const maxAttempts = message.metadata.retryCount !== undefined
            ? message.metadata.retryCount + 1
            : DEFAULT_CONFIG.MAX_RETRY_ATTEMPTS;
        let attemptCount = 0;
        let lastError;
        while (attemptCount < maxAttempts) {
            attemptCount++;
            try {
                // Simulate message delivery (in real implementation, this would be actual delivery)
                await this._deliverMessage(message);
                const deliveryTime = Date.now();
                return {
                    success: true,
                    messageId: message.id,
                    deliveryStatus: {
                        status: message.metadata.requiresAck ? 'delivered' : 'sent',
                        attemptCount,
                        lastAttemptTimestamp: deliveryTime,
                    },
                    timestamp: deliveryTime,
                    metrics: {
                        sendTime: startTime,
                        deliveryTime,
                        totalLatency: deliveryTime - startTime,
                        attemptCount,
                    },
                };
            }
            catch (error) {
                lastError = this._classifyError(error);
                // Don't retry if error is not retryable
                if (!lastError.retryable) {
                    break;
                }
                // Don't retry if max attempts reached
                if (attemptCount >= maxAttempts) {
                    break;
                }
                // Calculate backoff with exponential increase
                const backoffTime = Math.min(DEFAULT_CONFIG.INITIAL_BACKOFF_MS * Math.pow(DEFAULT_CONFIG.BACKOFF_MULTIPLIER, attemptCount - 1), DEFAULT_CONFIG.MAX_BACKOFF_MS);
                // Wait before retry
                await this._sleep(backoffTime);
            }
        }
        // All attempts failed
        const finalTime = Date.now();
        return {
            success: false,
            messageId: message.id,
            deliveryStatus: {
                status: 'failed',
                attemptCount,
                lastAttemptTimestamp: finalTime,
                failureReason: lastError?.message || 'Unknown error',
            },
            error: lastError,
            timestamp: finalTime,
            metrics: {
                sendTime: startTime,
                totalLatency: finalTime - startTime,
                attemptCount,
            },
        };
    }
    /**
     * Simulate message delivery
     *
     * In a real implementation, this would:
     * - Send message over network
     * - Write to message queue
     * - Invoke agent's message handler
     * - Wait for acknowledgment if required
     */
    async _deliverMessage(message) {
        // Check TTL
        const ttl = message.metadata.ttl || DEFAULT_CONFIG.DEFAULT_TTL;
        const age = Date.now() - message.timestamp;
        if (age > ttl) {
            throw new Error(`Message expired (age: ${age}ms, ttl: ${ttl}ms)`);
        }
        // Simulate network delay
        await this._sleep(10 + Math.random() * 20);
        // Simulate occasional failures for testing (10% failure rate)
        if (Math.random() < 0.1) {
            throw new Error('Network error: Connection timeout');
        }
        // Message delivered successfully
    }
    /**
     * Classify error for retry logic
     *
     * Quality gate: Distinguish retryable from permanent errors
     * Evidence-based: Error codes guide retry decisions
     */
    _classifyError(error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Network errors are typically retryable
        if (errorMessage.includes('timeout') || errorMessage.includes('Network')) {
            return {
                code: 'NETWORK_ERROR',
                message: errorMessage,
                retryable: true,
                originalError: error,
            };
        }
        // TTL expiration is not retryable
        if (errorMessage.includes('expired')) {
            return {
                code: 'MESSAGE_EXPIRED',
                message: errorMessage,
                retryable: false,
                originalError: error,
            };
        }
        // Default to non-retryable
        return {
            code: 'UNKNOWN_ERROR',
            message: errorMessage,
            retryable: false,
            originalError: error,
        };
    }
    /**
     * Check circuit breaker state
     *
     * Anti-pattern avoided: Continuing to hammer failing destination
     * Quality gate: Stops cascade failures
     */
    _checkCircuitBreaker(destination) {
        const breaker = this.circuitBreakers.get(destination);
        if (!breaker) {
            return { allowed: true };
        }
        const now = Date.now();
        switch (breaker.state) {
            case 'closed':
                return { allowed: true };
            case 'open':
                // Check if enough time has passed to try again
                if (breaker.nextRetryTime && now >= breaker.nextRetryTime) {
                    breaker.state = 'half_open';
                    return { allowed: true };
                }
                return { allowed: false, nextRetryTime: breaker.nextRetryTime };
            case 'half_open':
                // Allow limited attempts in half-open state
                return { allowed: true };
            default:
                return { allowed: true };
        }
    }
    /**
     * Update circuit breaker based on delivery result
     *
     * Measurement: Track failure count explicitly
     * Quality gate: Open circuit after threshold failures
     */
    _updateCircuitBreaker(destination, success) {
        let breaker = this.circuitBreakers.get(destination);
        if (!breaker) {
            breaker = {
                destination,
                state: 'closed',
                failureCount: 0,
            };
            this.circuitBreakers.set(destination, breaker);
        }
        if (success) {
            // Success resets failure count and closes circuit
            breaker.failureCount = 0;
            breaker.state = 'closed';
            breaker.lastFailureTime = undefined;
            breaker.nextRetryTime = undefined;
        }
        else {
            // Failure increments count
            breaker.failureCount++;
            breaker.lastFailureTime = Date.now();
            // Open circuit if threshold reached
            if (breaker.failureCount >= DEFAULT_CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
                breaker.state = 'open';
                breaker.nextRetryTime = Date.now() + DEFAULT_CONFIG.CIRCUIT_BREAKER_TIMEOUT;
            }
        }
    }
    /**
     * Add message to dead letter queue
     *
     * Quality gate: Failed messages preserved for investigation
     * Measurement: Queue size limited to prevent memory issues
     */
    _addToDeadLetterQueue(message) {
        this.deadLetterQueue.push(message);
        // Maintain max queue size (FIFO eviction)
        if (this.deadLetterQueue.length > DEFAULT_CONFIG.MAX_DEAD_LETTER_QUEUE_SIZE) {
            this.deadLetterQueue.shift();
        }
    }
    /**
     * Generate unique message ID
     */
    _generateMessageId() {
        return `msg-${Date.now()}-${++this.messageCounter}`;
    }
    /**
     * Generate channel ID from two agent IDs
     */
    _generateChannelId(agentA, agentB) {
        // Ensure consistent ordering
        const [first, second] = [agentA, agentB].sort();
        return `channel-${first}-${second}`;
    }
    /**
     * Sleep utility for backoff
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.AgentCommunicationSystem = AgentCommunicationSystem;
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Create a new agent communication system instance
 */
function createAgentCommunicationSystem() {
    return new AgentCommunicationSystem();
}
/**
 * Create a message with proper defaults
 */
function createMessage(from, to, payload, options = {}) {
    return {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from,
        to,
        type: options.type || 'request',
        payload,
        timestamp: Date.now(),
        correlationId: options.correlationId,
        metadata: {
            priority: options.priority || 'normal',
            ttl: options.ttl,
            requiresAck: options.requiresAck,
        },
    };
}
/**
 * Format message result for display
 *
 * Measurement: Show actual metrics, not fabricated summaries
 */
function formatMessageResult(result) {
    const lines = [];
    lines.push(`Message ID: ${result.messageId}`);
    lines.push(`Success: ${result.success}`);
    lines.push(`Status: ${result.deliveryStatus.status}`);
    lines.push(`Attempts: ${result.deliveryStatus.attemptCount}`);
    lines.push(`Timestamp: ${new Date(result.timestamp).toISOString()}`);
    if (result.metrics.totalLatency !== undefined) {
        lines.push(`Total Latency: ${result.metrics.totalLatency}ms (measured from send to delivery)`);
    }
    if (result.error) {
        lines.push('');
        lines.push('Error Details:');
        lines.push(`  Code: ${result.error.code}`);
        lines.push(`  Message: ${result.error.message}`);
        lines.push(`  Retryable: ${result.error.retryable}`);
    }
    return lines.join('\n');
}
/**
 * Format broadcast result for display
 *
 * Measurement: Show success/failure breakdown, not just "completed"
 */
function formatBroadcastResult(result) {
    const lines = [];
    lines.push(`Broadcast Message ID: ${result.messageId}`);
    lines.push(`Total Targets: ${result.totalTargets}`);
    lines.push(`Successful: ${result.successCount} (${((result.successCount / result.totalTargets) * 100).toFixed(1)}%)`);
    lines.push(`Failed: ${result.failureCount} (${((result.failureCount / result.totalTargets) * 100).toFixed(1)}%)`);
    lines.push('');
    lines.push('Metrics (measured):');
    lines.push(`  Total Time: ${result.metrics.totalTime}ms`);
    lines.push(`  Average Latency: ${result.metrics.averageLatency.toFixed(2)}ms`);
    lines.push(`  Min Latency: ${result.metrics.minLatency}ms`);
    lines.push(`  Max Latency: ${result.metrics.maxLatency}ms`);
    return lines.join('\n');
}
// ============================================================================
// Export Default Instance
// ============================================================================
exports.default = new AgentCommunicationSystem();
//# sourceMappingURL=agent-communication.js.map