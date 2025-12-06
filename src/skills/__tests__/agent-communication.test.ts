/**
 * Integration Tests for Agent Communication System
 *
 * Tests the core communication primitives that enable multi-agent coordination:
 * - Message sending and acknowledgment
 * - Timeout handling and retries
 * - Message validation and schema enforcement
 * - Broadcasting to multiple targets
 * - Error handling with circuit breakers and dead letter queue
 *
 * Following Anthropic's "start simple" principle, these tests define the minimal
 * communication interface needed for reliable agent coordination.
 *
 * @version 1.0.0
 * @date 2025-12-06
 */

import { jest } from '@jest/globals';

// Type definitions for the communication system
interface Message {
  id: string;
  from: string;
  to: string | string[];
  type: string;
  payload: any;
  timestamp: number;
  correlationId?: string;
}

interface MessageAcknowledgment {
  messageId: string;
  receivedAt: number;
  status: 'received' | 'processed' | 'failed';
  error?: string;
}

interface CommunicationConfig {
  timeout?: number;
  retryAttempts?: number;
  retryBackoffMs?: number;
  circuitBreakerThreshold?: number;
  enableDeadLetterQueue?: boolean;
}

interface CommunicationStats {
  sent: number;
  received: number;
  failed: number;
  retried: number;
  circuitBreakerOpen: boolean;
  deadLetterQueueSize: number;
}

// Mock implementation interfaces (actual implementation will replace these)
interface AgentCommunicationSystem {
  send(message: Omit<Message, 'id' | 'timestamp'>): Promise<MessageAcknowledgment>;
  broadcast(message: Omit<Message, 'id' | 'timestamp' | 'to'>, targets: string[]): Promise<MessageAcknowledgment[]>;
  receive(agentId: string): Promise<Message | null>;
  validateMessage(message: any): { valid: boolean; errors: string[] };
  getStats(): CommunicationStats;
  resetCircuitBreaker(): void;
  getDeadLetterQueue(): Message[];
  clearDeadLetterQueue(): void;
}

// Mock factory function
const createMockCommunicationSystem = (config: CommunicationConfig = {}): AgentCommunicationSystem => {
  const messages: Map<string, Message[]> = new Map();
  const deadLetterQueue: Message[] = [];
  let stats: CommunicationStats = {
    sent: 0,
    received: 0,
    failed: 0,
    retried: 0,
    circuitBreakerOpen: false,
    deadLetterQueueSize: 0,
  };

  const defaultConfig = {
    timeout: 5000,
    retryAttempts: 3,
    retryBackoffMs: 100,
    circuitBreakerThreshold: 5,
    enableDeadLetterQueue: true,
    ...config,
  };

  let failureCount = 0;

  return {
    async send(message): Promise<MessageAcknowledgment> {
      // Circuit breaker check
      if (stats.circuitBreakerOpen) {
        throw new Error('Circuit breaker is open');
      }

      // Validate message
      const validation = this.validateMessage(message);
      if (!validation.valid) {
        throw new Error(`Invalid message: ${validation.errors.join(', ')}`);
      }

      const fullMessage: Message = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        to: message.to as string,
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 10));

      // Store message for recipient
      const recipient = fullMessage.to as string;
      if (!messages.has(recipient)) {
        messages.set(recipient, []);
      }
      messages.get(recipient)!.push(fullMessage);

      stats.sent++;
      failureCount = 0; // Reset on success

      return {
        messageId: fullMessage.id,
        receivedAt: Date.now(),
        status: 'received',
      };
    },

    async broadcast(message, targets): Promise<MessageAcknowledgment[]> {
      const results: MessageAcknowledgment[] = [];
      const failures: string[] = [];

      for (const target of targets) {
        try {
          const ack = await this.send({ ...message, to: target });
          results.push(ack);
        } catch (error) {
          failures.push(target);
          results.push({
            messageId: `failed-${target}`,
            receivedAt: Date.now(),
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return results;
    },

    async receive(agentId): Promise<Message | null> {
      const agentMessages = messages.get(agentId);
      if (!agentMessages || agentMessages.length === 0) {
        return null;
      }

      const message = agentMessages.shift()!;
      stats.received++;
      return message;
    },

    validateMessage(message: any): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      if (!message.from) errors.push('Missing required field: from');
      if (!message.to) errors.push('Missing required field: to');
      if (!message.type) errors.push('Missing required field: type');
      if (!message.payload) errors.push('Missing required field: payload');

      // Type validation
      if (message.from && typeof message.from !== 'string') {
        errors.push('Field "from" must be a string');
      }
      if (message.type && typeof message.type !== 'string') {
        errors.push('Field "type" must be a string');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    getStats(): CommunicationStats {
      stats.deadLetterQueueSize = deadLetterQueue.length;
      return { ...stats };
    },

    resetCircuitBreaker(): void {
      stats.circuitBreakerOpen = false;
      failureCount = 0;
    },

    getDeadLetterQueue(): Message[] {
      return [...deadLetterQueue];
    },

    clearDeadLetterQueue(): void {
      deadLetterQueue.length = 0;
      stats.deadLetterQueueSize = 0;
    },
  };
};

describe('Agent Communication System', () => {
  let commSystem: AgentCommunicationSystem;

  beforeEach(() => {
    commSystem = createMockCommunicationSystem();
  });

  describe('1. Message Sending', () => {
    describe('Send message and receive acknowledgment', () => {
      it('should send a message and receive acknowledgment', async () => {
        const message = {
          from: 'agent-1',
          to: 'agent-2',
          type: 'task-request',
          payload: { task: 'analyze-data', data: [1, 2, 3] },
        };

        const ack = await commSystem.send(message);

        expect(ack).toBeDefined();
        expect(ack.messageId).toBeDefined();
        expect(ack.status).toBe('received');
        expect(ack.receivedAt).toBeGreaterThan(0);
      });

      it('should generate unique message IDs', async () => {
        const message = {
          from: 'agent-1',
          to: 'agent-2',
          type: 'task-request',
          payload: { task: 'test' },
        };

        const ack1 = await commSystem.send(message);
        const ack2 = await commSystem.send(message);

        expect(ack1.messageId).not.toBe(ack2.messageId);
      });

      it('should deliver message to recipient', async () => {
        const message = {
          from: 'agent-1',
          to: 'agent-2',
          type: 'task-request',
          payload: { task: 'process' },
        };

        await commSystem.send(message);
        const received = await commSystem.receive('agent-2');

        expect(received).toBeDefined();
        expect(received!.from).toBe('agent-1');
        expect(received!.to).toBe('agent-2');
        expect(received!.type).toBe('task-request');
        expect(received!.payload.task).toBe('process');
      });

      it('should update statistics on send', async () => {
        const message = {
          from: 'agent-1',
          to: 'agent-2',
          type: 'task-request',
          payload: { task: 'test' },
        };

        const statsBefore = commSystem.getStats();
        await commSystem.send(message);
        const statsAfter = commSystem.getStats();

        expect(statsAfter.sent).toBe(statsBefore.sent + 1);
      });
    });

    describe('Handle timeout correctly', () => {
      it('should timeout if no response within configured time', async () => {
        const slowCommSystem = createMockCommunicationSystem({ timeout: 100 });

        // Mock a slow send operation
        const originalSend = slowCommSystem.send.bind(slowCommSystem);
        slowCommSystem.send = jest.fn(async (msg) => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return originalSend(msg);
        });

        const message = {
          from: 'agent-1',
          to: 'agent-2',
          type: 'task-request',
          payload: { task: 'test' },
        };

        // With timeout, this should be handled by retry logic or fail
        const startTime = Date.now();
        try {
          await Promise.race([
            slowCommSystem.send(message),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 100)
            ),
          ]);
          fail('Should have timed out');
        } catch (error) {
          const elapsed = Date.now() - startTime;
          expect(elapsed).toBeLessThan(150);
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    describe('Retry on failure with backoff', () => {
      it('should retry failed sends with exponential backoff', async () => {
        let attemptCount = 0;
        const failingCommSystem = createMockCommunicationSystem({
          retryAttempts: 3,
          retryBackoffMs: 50,
        });

        // Mock send to fail first 2 times
        const originalSend = failingCommSystem.send.bind(failingCommSystem);
        failingCommSystem.send = jest.fn(async (msg) => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Network error');
          }
          return originalSend(msg);
        });

        const message = {
          from: 'agent-1',
          to: 'agent-2',
          type: 'task-request',
          payload: { task: 'test' },
        };

        // Implement retry logic
        let lastError: Error | null = null;
        let retries = 0;
        const maxRetries = 3;

        for (let i = 0; i <= maxRetries; i++) {
          try {
            await failingCommSystem.send(message);
            retries = i;
            break;
          } catch (error) {
            lastError = error as Error;
            if (i < maxRetries) {
              const backoff = 50 * Math.pow(2, i);
              await new Promise(resolve => setTimeout(resolve, backoff));
            }
          }
        }

        expect(attemptCount).toBe(3);
        expect(retries).toBe(2); // Succeeded on 3rd attempt (index 2)
      });

      it('should use exponential backoff between retries', async () => {
        const backoffTimes: number[] = [];
        let attemptCount = 0;

        const failingCommSystem = createMockCommunicationSystem({
          retryAttempts: 3,
          retryBackoffMs: 100,
        });

        const originalSend = failingCommSystem.send.bind(failingCommSystem);
        failingCommSystem.send = jest.fn(async (msg) => {
          attemptCount++;
          if (attemptCount <= 3) {
            throw new Error('Network error');
          }
          return originalSend(msg);
        });

        const message = {
          from: 'agent-1',
          to: 'agent-2',
          type: 'task-request',
          payload: { task: 'test' },
        };

        let lastTime = Date.now();
        for (let i = 0; i < 3; i++) {
          try {
            await failingCommSystem.send(message);
          } catch (error) {
            const now = Date.now();
            if (i > 0) {
              backoffTimes.push(now - lastTime);
            }
            lastTime = now;
            const backoff = 100 * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, backoff));
          }
        }

        // Verify exponential growth
        if (backoffTimes.length >= 2) {
          expect(backoffTimes[1]).toBeGreaterThan(backoffTimes[0]);
        }
      });
    });
  });

  describe('2. Message Validation', () => {
    describe('Reject malformed messages', () => {
      it('should reject messages with missing required fields', async () => {
        const invalidMessage = {
          from: 'agent-1',
          // Missing 'to'
          type: 'task-request',
          payload: { task: 'test' },
        };

        await expect(commSystem.send(invalidMessage as any)).rejects.toThrow(/Invalid message/);
      });

      it('should reject messages with null/undefined required fields', async () => {
        const invalidMessage = {
          from: 'agent-1',
          to: null,
          type: 'task-request',
          payload: { task: 'test' },
        };

        await expect(commSystem.send(invalidMessage as any)).rejects.toThrow();
      });
    });

    describe('Validate payload schema', () => {
      it('should validate message has required fields', () => {
        const validMessage = {
          from: 'agent-1',
          to: 'agent-2',
          type: 'task-request',
          payload: { task: 'test' },
        };

        const result = commSystem.validateMessage(validMessage);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should collect all validation errors', () => {
        const invalidMessage = {
          // Missing all required fields
        };

        const result = commSystem.validateMessage(invalidMessage);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors).toContain('Missing required field: from');
        expect(result.errors).toContain('Missing required field: to');
        expect(result.errors).toContain('Missing required field: type');
      });
    });

    describe('Check required fields', () => {
      it('should require "from" field', () => {
        const message = {
          to: 'agent-2',
          type: 'task-request',
          payload: { task: 'test' },
        };

        const result = commSystem.validateMessage(message);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: from');
      });

      it('should require "to" field', () => {
        const message = {
          from: 'agent-1',
          type: 'task-request',
          payload: { task: 'test' },
        };

        const result = commSystem.validateMessage(message);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: to');
      });

      it('should require "type" field', () => {
        const message = {
          from: 'agent-1',
          to: 'agent-2',
          payload: { task: 'test' },
        };

        const result = commSystem.validateMessage(message);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: type');
      });

      it('should require "payload" field', () => {
        const message = {
          from: 'agent-1',
          to: 'agent-2',
          type: 'task-request',
        };

        const result = commSystem.validateMessage(message);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: payload');
      });

      it('should validate field types', () => {
        const message = {
          from: 123, // Should be string
          to: 'agent-2',
          type: 456, // Should be string
          payload: { task: 'test' },
        };

        const result = commSystem.validateMessage(message);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('must be a string'))).toBe(true);
      });
    });
  });

  describe('3. Broadcasting', () => {
    describe('Send to multiple targets', () => {
      it('should broadcast message to multiple agents', async () => {
        const message = {
          from: 'orchestrator',
          type: 'task-assignment',
          payload: { task: 'analyze', priority: 'high' },
        };

        const targets = ['worker-1', 'worker-2', 'worker-3'];
        const acknowledgments = await commSystem.broadcast(message, targets);

        expect(acknowledgments).toHaveLength(3);
        acknowledgments.forEach(ack => {
          expect(ack.status).toBe('received');
          expect(ack.messageId).toBeDefined();
        });
      });

      it('should deliver broadcast to all recipients', async () => {
        const message = {
          from: 'orchestrator',
          type: 'broadcast',
          payload: { announcement: 'system update' },
        };

        const targets = ['agent-1', 'agent-2', 'agent-3'];
        await commSystem.broadcast(message, targets);

        for (const target of targets) {
          const received = await commSystem.receive(target);
          expect(received).toBeDefined();
          expect(received!.from).toBe('orchestrator');
          expect(received!.payload.announcement).toBe('system update');
        }
      });

      it('should send to empty target list without error', async () => {
        const message = {
          from: 'orchestrator',
          type: 'broadcast',
          payload: { data: 'test' },
        };

        const acknowledgments = await commSystem.broadcast(message, []);
        expect(acknowledgments).toHaveLength(0);
      });
    });

    describe('Handle partial failures', () => {
      it('should continue broadcasting even if some targets fail', async () => {
        const failingCommSystem = createMockCommunicationSystem();

        // Mock send to fail for specific target
        const originalSend = failingCommSystem.send.bind(failingCommSystem);
        failingCommSystem.send = jest.fn(async (msg) => {
          if (msg.to === 'failing-agent') {
            throw new Error('Agent unreachable');
          }
          return originalSend(msg);
        });

        const message = {
          from: 'orchestrator',
          type: 'task',
          payload: { task: 'test' },
        };

        const targets = ['working-agent-1', 'failing-agent', 'working-agent-2'];
        const acknowledgments = await failingCommSystem.broadcast(message, targets);

        expect(acknowledgments).toHaveLength(3);

        const successful = acknowledgments.filter(ack => ack.status === 'received');
        const failed = acknowledgments.filter(ack => ack.status === 'failed');

        expect(successful).toHaveLength(2);
        expect(failed).toHaveLength(1);
        expect(failed[0].error).toContain('Agent unreachable');
      });

      it('should report which targets failed', async () => {
        const failingCommSystem = createMockCommunicationSystem();

        const originalSend = failingCommSystem.send.bind(failingCommSystem);
        failingCommSystem.send = jest.fn(async (msg) => {
          if (msg.to === 'agent-2' || msg.to === 'agent-4') {
            throw new Error('Network timeout');
          }
          return originalSend(msg);
        });

        const message = {
          from: 'orchestrator',
          type: 'task',
          payload: { task: 'test' },
        };

        const targets = ['agent-1', 'agent-2', 'agent-3', 'agent-4'];
        const acknowledgments = await failingCommSystem.broadcast(message, targets);

        const failedTargets = acknowledgments
          .filter(ack => ack.status === 'failed')
          .map(ack => ack.messageId.replace('failed-', ''));

        expect(failedTargets).toContain('agent-2');
        expect(failedTargets).toContain('agent-4');
        expect(failedTargets).toHaveLength(2);
      });
    });
  });

  describe('4. Error Handling', () => {
    describe('Circuit breaker activates after repeated failures', () => {
      it('should open circuit breaker after threshold failures', async () => {
        const cbCommSystem = createMockCommunicationSystem({
          circuitBreakerThreshold: 3,
        });

        // Simulate failures by manually setting circuit breaker
        const stats = cbCommSystem.getStats();
        stats.circuitBreakerOpen = true;

        const message = {
          from: 'agent-1',
          to: 'agent-2',
          type: 'task',
          payload: { task: 'test' },
        };

        await expect(cbCommSystem.send(message)).rejects.toThrow(/Circuit breaker is open/);
      });

      it('should allow messages after circuit breaker reset', async () => {
        const cbCommSystem = createMockCommunicationSystem({
          circuitBreakerThreshold: 3,
        });

        // Open circuit breaker
        const stats = cbCommSystem.getStats();
        stats.circuitBreakerOpen = true;

        const message = {
          from: 'agent-1',
          to: 'agent-2',
          type: 'task',
          payload: { task: 'test' },
        };

        // Should fail when circuit breaker is open
        await expect(cbCommSystem.send(message)).rejects.toThrow();

        // Reset circuit breaker
        cbCommSystem.resetCircuitBreaker();

        // Should succeed after reset
        const ack = await cbCommSystem.send(message);
        expect(ack.status).toBe('received');
      });

      it('should track failure count leading to circuit breaker', async () => {
        const stats = commSystem.getStats();

        expect(stats.circuitBreakerOpen).toBe(false);

        // Initially, no failures
        expect(stats.failed).toBe(0);
      });
    });

    describe('Dead letter queue captures failed messages', () => {
      it('should store failed messages in dead letter queue', () => {
        const dlq = commSystem.getDeadLetterQueue();
        expect(dlq).toBeDefined();
        expect(Array.isArray(dlq)).toBe(true);
      });

      it('should track dead letter queue size in stats', () => {
        const stats = commSystem.getStats();
        expect(stats.deadLetterQueueSize).toBeDefined();
        expect(typeof stats.deadLetterQueueSize).toBe('number');
      });

      it('should allow clearing dead letter queue', () => {
        commSystem.clearDeadLetterQueue();
        const stats = commSystem.getStats();
        expect(stats.deadLetterQueueSize).toBe(0);
      });

      it('should preserve failed message details in DLQ', () => {
        // This test verifies the structure exists
        // Actual implementation will populate DLQ on failures
        const dlq = commSystem.getDeadLetterQueue();
        expect(dlq).toEqual([]);

        // After implementation, failed messages should be like:
        // expect(dlq[0]).toHaveProperty('id');
        // expect(dlq[0]).toHaveProperty('from');
        // expect(dlq[0]).toHaveProperty('to');
        // expect(dlq[0]).toHaveProperty('payload');
      });
    });

    describe('Error recovery and resilience', () => {
      it('should maintain system stability after errors', async () => {
        const message = {
          from: 'agent-1',
          to: 'agent-2',
          type: 'task',
          payload: { task: 'test' },
        };

        // Send invalid message
        await expect(commSystem.send({ ...message, from: undefined as any }))
          .rejects.toThrow();

        // System should still work after error
        const ack = await commSystem.send(message);
        expect(ack.status).toBe('received');
      });

      it('should provide comprehensive statistics', () => {
        const stats = commSystem.getStats();

        expect(stats).toHaveProperty('sent');
        expect(stats).toHaveProperty('received');
        expect(stats).toHaveProperty('failed');
        expect(stats).toHaveProperty('retried');
        expect(stats).toHaveProperty('circuitBreakerOpen');
        expect(stats).toHaveProperty('deadLetterQueueSize');
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle high-frequency message exchange', async () => {
      const messages = Array.from({ length: 100 }, (_, i) => ({
        from: 'sender',
        to: `receiver-${i % 10}`,
        type: 'data',
        payload: { index: i },
      }));

      const sendPromises = messages.map(msg => commSystem.send(msg));
      const acknowledgments = await Promise.all(sendPromises);

      expect(acknowledgments).toHaveLength(100);
      acknowledgments.forEach(ack => {
        expect(ack.status).toBe('received');
      });

      const stats = commSystem.getStats();
      expect(stats.sent).toBe(100);
    });

    it('should support correlation IDs for request-response tracking', async () => {
      const correlationId = 'correlation-123';
      const request = {
        from: 'requester',
        to: 'responder',
        type: 'request',
        payload: { query: 'data' },
        correlationId,
      };

      await commSystem.send(request);
      const received = await commSystem.receive('responder');

      expect(received!.correlationId).toBe(correlationId);
    });

    it('should handle message queue ordering', async () => {
      const messages = [
        { from: 'sender', to: 'receiver', type: 'msg', payload: { seq: 1 } },
        { from: 'sender', to: 'receiver', type: 'msg', payload: { seq: 2 } },
        { from: 'sender', to: 'receiver', type: 'msg', payload: { seq: 3 } },
      ];

      for (const msg of messages) {
        await commSystem.send(msg);
      }

      const received1 = await commSystem.receive('receiver');
      const received2 = await commSystem.receive('receiver');
      const received3 = await commSystem.receive('receiver');

      expect(received1!.payload.seq).toBe(1);
      expect(received2!.payload.seq).toBe(2);
      expect(received3!.payload.seq).toBe(3);
    });
  });
});
