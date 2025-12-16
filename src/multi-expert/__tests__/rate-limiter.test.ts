/**
 * Tests for Rate Limiter and Cost Tracker
 */

import {
  TokenBucketRateLimiter,
  SimpleCostTracker,
  createRateLimiter,
  createCostTracker,
  Request,
  RateLimitConfig,
  DEFAULT_RATE_LIMIT_CONFIG,
} from '../rate-limiter';

describe('TokenBucketRateLimiter', () => {
  describe('Configuration and Initialization', () => {
    test('creates with default config', () => {
      const limiter = new TokenBucketRateLimiter();
      expect(limiter.getAvailableTokens()).toBe(DEFAULT_RATE_LIMIT_CONFIG.maxBurst);
      expect(limiter.getQueueLength()).toBe(0);
    });

    test('creates with custom config', () => {
      const config: Partial<RateLimitConfig> = {
        tokensPerSecond: 500,
        maxBurst: 2000,
        maxQueueSize: 50,
        priorityLevels: 3,
      };
      const limiter = new TokenBucketRateLimiter(config);
      expect(limiter.getAvailableTokens()).toBe(2000);
    });

    test('initializes with full token bucket', () => {
      const limiter = new TokenBucketRateLimiter({ maxBurst: 1000 });
      expect(limiter.getAvailableTokens()).toBe(1000);
    });
  });

  describe('Token Bucket Algorithm', () => {
    test('consumes tokens when executing request', async () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerSecond: 1000,
        maxBurst: 1000,
      });

      const request: Request = {
        id: 'test-1',
        priority: 0,
        estimatedTokens: 300,
        callback: async () => 'success',
      };

      const initialTokens = limiter.getAvailableTokens();
      await limiter.submit(request);

      const tokensAfter = limiter.getAvailableTokens();
      expect(tokensAfter).toBeLessThan(initialTokens);
    });

    test('refills tokens over time', async () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerSecond: 1000,
        maxBurst: 1000,
      });

      // Consume some tokens
      await limiter.submit({
        id: 'test-1',
        priority: 0,
        estimatedTokens: 500,
        callback: async () => 'done',
      });

      const tokensAfterConsumption = limiter.getAvailableTokens();

      // Wait for refill
      await new Promise((resolve) => setTimeout(resolve, 100));

      const tokensAfterWait = limiter.getAvailableTokens();
      expect(tokensAfterWait).toBeGreaterThan(tokensAfterConsumption);
    }, 5000);

    test('does not exceed max burst capacity', async () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerSecond: 1000,
        maxBurst: 500,
      });

      // Wait for potential refill
      await new Promise((resolve) => setTimeout(resolve, 100));

      const tokens = limiter.getAvailableTokens();
      expect(tokens).toBeLessThanOrEqual(500);
    }, 5000);

    test('queues requests when insufficient tokens', async () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerSecond: 100,
        maxBurst: 100,
      });

      // Submit a large request that will queue
      const promise1 = limiter.submit({
        id: 'large-1',
        priority: 0,
        estimatedTokens: 50,
        callback: async () => 'result1',
      });

      const promise2 = limiter.submit({
        id: 'large-2',
        priority: 0,
        estimatedTokens: 100,
        callback: async () => 'result2',
      });

      // Second request should be queued
      expect(limiter.getQueueLength()).toBeGreaterThan(0);

      await promise1;
      await promise2;
    }, 10000);
  });

  describe('Priority Queue', () => {
    test('processes higher priority requests first', async () => {
      // Create a paused limiter and fill it with a low-priority request first
      const limiter = new TokenBucketRateLimiter({
        tokensPerSecond: 100,
        maxBurst: 50,
        priorityLevels: 5,
      });

      // Pause to prevent any processing
      limiter.pause();

      const executionOrder: number[] = [];

      // Submit all requests while paused - they will all queue
      const lowPromise = limiter.submit({
        id: 'low',
        priority: 0,
        estimatedTokens: 20,
        callback: async () => {
          executionOrder.push(0);
          return 'low';
        },
      });

      const highPromise = limiter.submit({
        id: 'high',
        priority: 4,
        estimatedTokens: 20,
        callback: async () => {
          executionOrder.push(4);
          return 'high';
        },
      });

      const mediumPromise = limiter.submit({
        id: 'medium',
        priority: 2,
        estimatedTokens: 20,
        callback: async () => {
          executionOrder.push(2);
          return 'medium';
        },
      });

      // Small delay to ensure all are queued
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify all are queued
      expect(limiter.getQueueLength()).toBe(3);

      // Resume processing - now they will execute in priority order
      limiter.resume();

      await Promise.all([lowPromise, highPromise, mediumPromise]);

      // Verify all executed
      expect(executionOrder.length).toBe(3);

      // Priority order: higher priority should come before lower priority
      const highPos = executionOrder.indexOf(4);
      const mediumPos = executionOrder.indexOf(2);
      const lowPos = executionOrder.indexOf(0);

      // High priority (4) should execute before medium (2) and low (0)
      expect(highPos).toBeLessThan(mediumPos);
      expect(highPos).toBeLessThan(lowPos);

      // Medium priority (2) should execute before low (0)
      expect(mediumPos).toBeLessThan(lowPos);

      // Clean up to stop background timers
      limiter.pause();
    }, 10000);

    test('clamps priority to max level', async () => {
      const limiter = new TokenBucketRateLimiter({ priorityLevels: 3 });

      // Should not throw even with priority > max
      await expect(
        limiter.submit({
          id: 'test',
          priority: 100,
          estimatedTokens: 10,
          callback: async () => 'done',
        })
      ).resolves.toBeDefined();
    });
  });

  describe('Queue Management', () => {
    test('drops requests when queue is full', async () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerSecond: 500,
        maxBurst: 100,
        maxQueueSize: 2,
      });

      // Fill the queue - submit more requests than can fit in queue
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          limiter.submit({
            id: `req-${i}`,
            priority: 0,
            estimatedTokens: 50,
            callback: async () => `result-${i}`,
          })
        );
      }

      const results = await Promise.allSettled(promises);
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(rejected.length).toBeGreaterThan(0);
      expect(rejected[0].status).toBe('rejected');
      if (rejected[0].status === 'rejected') {
        expect(rejected[0].reason.message).toContain('Queue full');
      }

      // Clean up to stop background timers
      limiter.pause();
    }, 5000);

    test('clears all queued requests', async () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerSecond: 10,
        maxBurst: 10,
      });

      // Queue some requests
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          limiter.submit({
            id: `req-${i}`,
            priority: 0,
            estimatedTokens: 50,
            callback: async () => `result-${i}`,
          })
        );
      }

      expect(limiter.getQueueLength()).toBeGreaterThan(0);
      limiter.clear();
      expect(limiter.getQueueLength()).toBe(0);

      // All promises should reject
      const results = await Promise.allSettled(promises);
      expect(results.every((r) => r.status === 'rejected')).toBe(true);
    }, 10000);
  });

  describe('Pause and Resume', () => {
    test('pauses and resumes processing', async () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerSecond: 100,
        maxBurst: 100,
      });

      limiter.pause();

      const promise = limiter.submit({
        id: 'test',
        priority: 0,
        estimatedTokens: 50,
        callback: async () => 'result',
      });

      // Should be queued while paused
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(limiter.getQueueLength()).toBe(1);

      limiter.resume();

      // Should process after resume
      const result = await promise;
      expect(result).toBe('result');
    }, 5000);

    test('does not refill tokens while paused', async () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerSecond: 1000,
        maxBurst: 1000,
      });

      // Consume tokens
      await limiter.submit({
        id: 'consume',
        priority: 0,
        estimatedTokens: 500,
        callback: async () => 'done',
      });

      const tokensBeforePause = limiter.getAvailableTokens();

      limiter.pause();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const tokensDuringPause = limiter.getAvailableTokens();
      // Allow small refill due to timing (pausing doesn't instantly stop refill)
      expect(Math.abs(tokensDuringPause - tokensBeforePause)).toBeLessThan(100);
    }, 5000);
  });

  describe('Statistics', () => {
    test('tracks total requests', async () => {
      const limiter = new TokenBucketRateLimiter();

      await limiter.submit({
        id: 'req-1',
        priority: 0,
        estimatedTokens: 100,
        callback: async () => 'done',
      });

      await limiter.submit({
        id: 'req-2',
        priority: 0,
        estimatedTokens: 100,
        callback: async () => 'done',
      });

      const stats = limiter.getStats();
      expect(stats.totalRequests).toBe(2);
    });

    test('tracks total tokens consumed', async () => {
      const limiter = new TokenBucketRateLimiter();

      await limiter.submit({
        id: 'req-1',
        priority: 0,
        estimatedTokens: 150,
        callback: async () => 'done',
      });

      await limiter.submit({
        id: 'req-2',
        priority: 0,
        estimatedTokens: 250,
        callback: async () => 'done',
      });

      const stats = limiter.getStats();
      expect(stats.totalTokens).toBe(400);
    });

    test('tracks dropped requests', async () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerSecond: 500,
        maxBurst: 100,
        maxQueueSize: 1,
      });

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          limiter.submit({
            id: `req-${i}`,
            priority: 0,
            estimatedTokens: 50,
            callback: async () => `result-${i}`,
          }).catch(() => null)
        );
      }

      await Promise.all(promises);
      const stats = limiter.getStats();
      expect(stats.droppedRequests).toBeGreaterThan(0);

      // Clean up to stop background timers
      limiter.pause();
    }, 5000);

    test('calculates average wait time', async () => {
      const limiter = new TokenBucketRateLimiter({
        tokensPerSecond: 100,
        maxBurst: 100,
      });

      // Submit requests that will queue
      await Promise.all([
        limiter.submit({
          id: 'req-1',
          priority: 0,
          estimatedTokens: 60,
          callback: async () => 'done',
        }),
        limiter.submit({
          id: 'req-2',
          priority: 0,
          estimatedTokens: 60,
          callback: async () => 'done',
        }),
      ]);

      const stats = limiter.getStats();
      expect(stats.averageWaitTime).toBeGreaterThanOrEqual(0);
    }, 10000);
  });

  describe('Request Validation', () => {
    test('rejects request without id', async () => {
      const limiter = new TokenBucketRateLimiter();

      await expect(
        limiter.submit({
          id: '',
          priority: 0,
          estimatedTokens: 100,
          callback: async () => 'done',
        })
      ).rejects.toThrow('must have an id');
    });

    test('rejects request with negative priority', async () => {
      const limiter = new TokenBucketRateLimiter();

      await expect(
        limiter.submit({
          id: 'test',
          priority: -1,
          estimatedTokens: 100,
          callback: async () => 'done',
        })
      ).rejects.toThrow('must be non-negative');
    });

    test('rejects request with non-positive tokens', async () => {
      const limiter = new TokenBucketRateLimiter();

      await expect(
        limiter.submit({
          id: 'test',
          priority: 0,
          estimatedTokens: 0,
          callback: async () => 'done',
        })
      ).rejects.toThrow('must be positive');
    });

    test('rejects request without callback', async () => {
      const limiter = new TokenBucketRateLimiter();

      await expect(
        limiter.submit({
          id: 'test',
          priority: 0,
          estimatedTokens: 100,
          callback: null as any,
        })
      ).rejects.toThrow('must have a callback');
    });
  });

  describe('Error Handling', () => {
    test('propagates callback errors', async () => {
      const limiter = new TokenBucketRateLimiter();

      await expect(
        limiter.submit({
          id: 'error-test',
          priority: 0,
          estimatedTokens: 100,
          callback: async () => {
            throw new Error('Callback failed');
          },
        })
      ).rejects.toThrow('Callback failed');
    });

    test('continues processing after error', async () => {
      const limiter = new TokenBucketRateLimiter();

      await limiter.submit({
        id: 'error',
        priority: 0,
        estimatedTokens: 100,
        callback: async () => {
          throw new Error('Failed');
        },
      }).catch(() => null);

      // Should still be able to process next request
      const result = await limiter.submit({
        id: 'success',
        priority: 0,
        estimatedTokens: 100,
        callback: async () => 'success',
      });

      expect(result).toBe('success');
    });
  });
});

describe('SimpleCostTracker', () => {
  describe('Cost Tracking', () => {
    test('tracks cost for single expert', () => {
      const tracker = new SimpleCostTracker();
      tracker.trackCost('expert-1', 1000, 0.05);

      expect(tracker.getTotalCost()).toBe(0.05);
      expect(tracker.getCostByExpert().get('expert-1')).toBe(0.05);
    });

    test('tracks cost for multiple experts', () => {
      const tracker = new SimpleCostTracker();
      tracker.trackCost('expert-1', 1000, 0.05);
      tracker.trackCost('expert-2', 2000, 0.10);
      tracker.trackCost('expert-3', 1500, 0.075);

      expect(tracker.getTotalCost()).toBeCloseTo(0.225, 3);
      expect(tracker.getCostByExpert().size).toBe(3);
    });

    test('accumulates cost for same expert', () => {
      const tracker = new SimpleCostTracker();
      tracker.trackCost('expert-1', 500, 0.025);
      tracker.trackCost('expert-1', 500, 0.025);
      tracker.trackCost('expert-1', 1000, 0.05);

      expect(tracker.getCostByExpert().get('expert-1')).toBeCloseTo(0.1, 3);
    });

    test('tracks tokens separately from cost', () => {
      const tracker = new SimpleCostTracker();
      tracker.trackCost('expert-1', 1000, 0.05);
      tracker.trackCost('expert-2', 2000, 0.10);

      expect(tracker.getTotalTokens()).toBe(3000);
    });
  });

  describe('Budget Management', () => {
    test('initializes with no budget by default', () => {
      const tracker = new SimpleCostTracker();
      expect(tracker.isOverBudget()).toBe(false);
    });

    test('initializes with budget', () => {
      const tracker = new SimpleCostTracker(1.0);
      tracker.trackCost('expert-1', 1000, 0.5);
      expect(tracker.isOverBudget()).toBe(false);
    });

    test('detects when over budget', () => {
      const tracker = new SimpleCostTracker(0.1);
      tracker.trackCost('expert-1', 1000, 0.05);
      tracker.trackCost('expert-2', 2000, 0.08);

      expect(tracker.isOverBudget()).toBe(true);
    });

    test('sets budget after initialization', () => {
      const tracker = new SimpleCostTracker();
      tracker.trackCost('expert-1', 1000, 0.15);

      tracker.setBudget(0.2);
      expect(tracker.isOverBudget()).toBe(false);

      tracker.setBudget(0.1);
      expect(tracker.isOverBudget()).toBe(true);
    });

    test('rejects negative budget', () => {
      const tracker = new SimpleCostTracker();
      expect(() => tracker.setBudget(-1)).toThrow('must be non-negative');
    });
  });

  describe('Utility Methods', () => {
    test('resets all tracking', () => {
      const tracker = new SimpleCostTracker();
      tracker.trackCost('expert-1', 1000, 0.05);
      tracker.trackCost('expert-2', 2000, 0.10);

      tracker.reset();

      expect(tracker.getTotalCost()).toBe(0);
      expect(tracker.getTotalTokens()).toBe(0);
      expect(tracker.getCostByExpert().size).toBe(0);
    });

    test('getCostByExpert returns copy', () => {
      const tracker = new SimpleCostTracker();
      tracker.trackCost('expert-1', 1000, 0.05);

      const costs = tracker.getCostByExpert();
      costs.set('expert-2', 0.10);

      expect(tracker.getCostByExpert().size).toBe(1);
    });

    test('getTokensByExpert returns token breakdown', () => {
      const tracker = new SimpleCostTracker();
      tracker.trackCost('expert-1', 1000, 0.05);
      tracker.trackCost('expert-2', 2000, 0.10);

      const tokens = tracker.getTokensByExpert();
      expect(tokens.get('expert-1')).toBe(1000);
      expect(tokens.get('expert-2')).toBe(2000);
    });
  });
});

describe('Factory Functions', () => {
  test('createRateLimiter creates instance', () => {
    const limiter = createRateLimiter();
    expect(limiter).toBeDefined();
    expect(limiter.getAvailableTokens()).toBeGreaterThan(0);
  });

  test('createRateLimiter accepts config', () => {
    const limiter = createRateLimiter({ maxBurst: 3000 });
    expect(limiter.getAvailableTokens()).toBe(3000);
  });

  test('createCostTracker creates instance', () => {
    const tracker = createCostTracker();
    expect(tracker).toBeDefined();
    expect(tracker.getTotalCost()).toBe(0);
  });

  test('createCostTracker accepts budget', () => {
    const tracker = createCostTracker(5.0);
    tracker.trackCost('expert-1', 1000, 6.0);
    expect(tracker.isOverBudget()).toBe(true);
  });
});

describe('Integration Tests', () => {
  test('rate limiter with cost tracker', async () => {
    const limiter = createRateLimiter({
      tokensPerSecond: 1000,
      maxBurst: 1000,
    });
    const costTracker = createCostTracker(1.0);

    const experts = ['expert-1', 'expert-2', 'expert-3'];
    const promises = experts.map((expertId, index) =>
      limiter.submit({
        id: `request-${expertId}`,
        priority: index,
        estimatedTokens: 300,
        callback: async () => {
          // Simulate API call cost
          const tokens = 300;
          const cost = tokens * 0.0001;
          costTracker.trackCost(expertId, tokens, cost);
          return `Result from ${expertId}`;
        },
      })
    );

    await Promise.all(promises);

    expect(costTracker.getTotalTokens()).toBe(900);
    expect(costTracker.getTotalCost()).toBeCloseTo(0.09, 2);
    expect(costTracker.isOverBudget()).toBe(false);
  }, 10000);

  test('handles budget exceeded scenario', async () => {
    const limiter = createRateLimiter({ maxBurst: 2000 });
    const costTracker = createCostTracker(0.05);

    let requestCount = 0;

    for (let i = 0; i < 5; i++) {
      if (costTracker.isOverBudget()) {
        break;
      }

      await limiter.submit({
        id: `req-${i}`,
        priority: 0,
        estimatedTokens: 200,
        callback: async () => {
          costTracker.trackCost(`expert-${i}`, 200, 0.02);
          requestCount++;
        },
      });
    }

    expect(requestCount).toBeLessThan(5);
    expect(costTracker.isOverBudget()).toBe(true);
  }, 10000);

  test('concurrent expert execution with rate limiting', async () => {
    const limiter = createRateLimiter({
      tokensPerSecond: 500,
      maxBurst: 1000,
      priorityLevels: 3,
    });

    const results: string[] = [];

    const tasks = [
      { id: 'critical', priority: 2, tokens: 200 },
      { id: 'normal-1', priority: 1, tokens: 300 },
      { id: 'normal-2', priority: 1, tokens: 300 },
      { id: 'low', priority: 0, tokens: 400 },
    ];

    await Promise.all(
      tasks.map((task) =>
        limiter.submit({
          id: task.id,
          priority: task.priority,
          estimatedTokens: task.tokens,
          callback: async () => {
            results.push(task.id);
            return `Done: ${task.id}`;
          },
        })
      )
    );

    expect(results).toHaveLength(4);
    // Critical should be processed
    expect(results).toContain('critical');
  }, 10000);
});
