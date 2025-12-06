"use strict";
/**
 * Agent Communication System - Example Usage
 *
 * Demonstrates how to use the Agent Communication System skill
 * with quality gates, circuit breakers, and error handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicMessageExample = basicMessageExample;
exports.broadcastExample = broadcastExample;
exports.messageChannelExample = messageChannelExample;
exports.messageHistoryExample = messageHistoryExample;
exports.circuitBreakerExample = circuitBreakerExample;
exports.deadLetterQueueExample = deadLetterQueueExample;
exports.validationExample = validationExample;
const agent_communication_1 = require("./agent-communication");
// ============================================================================
// Example 1: Basic Message Sending
// ============================================================================
async function basicMessageExample() {
    const system = new agent_communication_1.AgentCommunicationSystem();
    // Create a message with validation
    const message = (0, agent_communication_1.createMessage)('agent-1', 'agent-2', { task: 'analyze-data' }, {
        priority: 'high',
        ttl: 5000,
        requiresAck: true,
    });
    // Send message with automatic validation and retry
    const result = await system.sendMessage(message);
    console.log('Basic Message Result:');
    console.log((0, agent_communication_1.formatMessageResult)(result));
    console.log('');
}
// ============================================================================
// Example 2: Broadcasting to Multiple Agents
// ============================================================================
async function broadcastExample() {
    const system = new agent_communication_1.AgentCommunicationSystem();
    const message = (0, agent_communication_1.createMessage)('coordinator', 'worker-1', {
        command: 'start-task',
        taskId: 'task-123',
    }, {
        type: 'broadcast',
        priority: 'normal',
    });
    // Broadcast to multiple targets with individual tracking
    const targets = ['worker-1', 'worker-2', 'worker-3', 'worker-4'];
    const result = await system.broadcastMessage(message, targets);
    console.log('Broadcast Result:');
    console.log((0, agent_communication_1.formatBroadcastResult)(result));
    console.log('');
    // Check individual results
    result.results.forEach((individualResult, target) => {
        console.log(`Result for ${target}:`, individualResult.success ? 'SUCCESS' : 'FAILED');
    });
}
// ============================================================================
// Example 3: Message Channel (Bidirectional Communication)
// ============================================================================
async function messageChannelExample() {
    const system = new agent_communication_1.AgentCommunicationSystem();
    // Create a bidirectional channel between two agents
    const channel = system.createMessageChannel('agent-alpha', 'agent-beta');
    // Send messages in both directions
    const result1 = await channel.send('agent-alpha', 'agent-beta', {
        type: 'request',
        data: 'Hello from Alpha',
    });
    const result2 = await channel.send('agent-beta', 'agent-alpha', {
        type: 'response',
        data: 'Hello from Beta',
    });
    console.log('Channel Communication:');
    console.log('Alpha -> Beta:', result1.success);
    console.log('Beta -> Alpha:', result2.success);
    console.log('');
    // Close the channel when done
    channel.close();
}
// ============================================================================
// Example 4: Message History and Audit Trail
// ============================================================================
async function messageHistoryExample() {
    const system = new agent_communication_1.AgentCommunicationSystem();
    // Send several messages
    await system.sendMessage((0, agent_communication_1.createMessage)('agent-1', 'agent-2', { seq: 1 }));
    await system.sendMessage((0, agent_communication_1.createMessage)('agent-1', 'agent-3', { seq: 2 }));
    await system.sendMessage((0, agent_communication_1.createMessage)('agent-2', 'agent-1', { seq: 3 }));
    // Query message history for agent-1
    const history = system.getMessageHistory('agent-1', {
        limit: 10,
        includePayload: true,
    });
    console.log('Message History for agent-1:');
    history.forEach(msg => {
        console.log(`  ${msg.id}: ${msg.from} -> ${msg.to} at ${new Date(msg.timestamp).toISOString()}`);
    });
    console.log('');
}
// ============================================================================
// Example 5: Circuit Breaker and Error Handling
// ============================================================================
async function circuitBreakerExample() {
    const system = new agent_communication_1.AgentCommunicationSystem();
    // Simulate multiple failures to the same destination
    console.log('Testing Circuit Breaker:');
    for (let i = 0; i < 7; i++) {
        const message = (0, agent_communication_1.createMessage)('sender', 'failing-agent', { attempt: i + 1 });
        const result = await system.sendMessage(message);
        console.log(`Attempt ${i + 1}: ${result.deliveryStatus.status}`);
        if (result.error?.code === 'CIRCUIT_BREAKER_OPEN') {
            console.log('Circuit breaker is now OPEN - preventing further attempts');
            console.log(result.error.message);
            break;
        }
    }
    // Check circuit breaker states
    const breakers = system.getCircuitBreakerStates();
    console.log('\nCircuit Breaker States:');
    breakers.forEach(breaker => {
        console.log(`  ${breaker.destination}: ${breaker.state} (failures: ${breaker.failureCount})`);
    });
    console.log('');
}
// ============================================================================
// Example 6: Dead Letter Queue
// ============================================================================
async function deadLetterQueueExample() {
    const system = new agent_communication_1.AgentCommunicationSystem();
    // Create an expired message (will fail permanently)
    const expiredMessage = (0, agent_communication_1.createMessage)('agent-1', 'agent-2', { data: 'old-task' }, {
        ttl: 1, // 1ms TTL - will expire immediately
    });
    // Wait to ensure expiration
    await new Promise(resolve => setTimeout(resolve, 10));
    // Try to send expired message
    await system.sendMessage(expiredMessage);
    // Check dead letter queue
    const deadLetters = system.getDeadLetterQueue();
    console.log('Dead Letter Queue:');
    console.log(`Total messages: ${deadLetters.length}`);
    deadLetters.forEach(msg => {
        const status = system.getDeliveryStatus(msg.id);
        console.log(`  ${msg.id}: ${status?.failureReason || 'Unknown failure'}`);
    });
    console.log('');
}
// ============================================================================
// Example 7: Message Validation
// ============================================================================
async function validationExample() {
    const system = new agent_communication_1.AgentCommunicationSystem();
    // Create an invalid message (missing required fields)
    const invalidMessage = {
        id: 'msg-123',
        from: 'agent-1',
        to: 'agent-2',
        type: 'invalid-type', // Invalid type
        payload: { data: 'test' },
        timestamp: Date.now(),
        metadata: {
            priority: 'invalid-priority', // Invalid priority
        },
    };
    // Validate the message
    const validation = system.validateMessage(invalidMessage);
    console.log('Message Validation:');
    console.log(`Valid: ${validation.valid}`);
    console.log('\nErrors:');
    validation.errors.forEach(error => {
        console.log(`  [${error.code}] ${error.field}: ${error.message}`);
    });
    if (validation.warnings.length > 0) {
        console.log('\nWarnings:');
        validation.warnings.forEach(warning => {
            console.log(`  ${warning}`);
        });
    }
    console.log('');
}
// ============================================================================
// Run All Examples
// ============================================================================
async function runAllExamples() {
    console.log('='.repeat(80));
    console.log('Agent Communication System - Examples');
    console.log('='.repeat(80));
    console.log('');
    try {
        await basicMessageExample();
        await broadcastExample();
        await messageChannelExample();
        await messageHistoryExample();
        await circuitBreakerExample();
        await deadLetterQueueExample();
        await validationExample();
        console.log('='.repeat(80));
        console.log('All examples completed successfully!');
        console.log('='.repeat(80));
    }
    catch (error) {
        console.error('Error running examples:', error);
    }
}
// Run if executed directly
if (require.main === module) {
    runAllExamples();
}
//# sourceMappingURL=agent-communication.example.js.map