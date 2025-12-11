/**
 * Rate Limiter for Parallel LLM Calls
 *
 * Implements token bucket algorithm with priority-based request scheduling
 * and cost tracking to prevent API throttling during multi-expert execution.
 *
 * Features:
 * - Token bucket rate limiting with configurable refill rate
 * - Priority queue for request scheduling (higher priority first)
 * - Cost tracking across all experts
 * - Budget enforcement
 * - Queue management with size limits
 * - Pause/resume capability
 *
 * @module multi-expert/rate-limiter
 */

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  /** Tokens refilled per second */
  tokensPerSecond: number;

  /** Maximum burst capacity (bucket size) */
  maxBurst: number;

  /** Maximum queued requests before rejection */
  maxQueueSize: number;

  /** Number of priority levels (0 to priorityLevels-1) */
  priorityLevels: number;
}

/**
 * Request to be rate-limited
 */
export interface Request {
  /** Unique request identifier */
  id: string;

  /** Priority level (higher = more urgent, 0-based) */
  priority: number;

  /** Estimated tokens this request will consume */
  estimatedTokens: number;

  /** Callback to execute when rate limit allows */
  callback: () => Promise<any>;
}

/**
 * Rate limiter statistics
 */
export interface RateLimitStats {
  /** Total requests processed */
  totalRequests: number;

  /** Total tokens consumed */
  totalTokens: number;

  /** Current queue length */
  queuedRequests: number;

  /** Requests dropped due to queue full */
  droppedRequests: number;

  /** Average wait time in milliseconds */
  averageWaitTime: number;
}

/**
 * Token bucket rate limiter
 */
export interface RateLimiter {
  /** Submit a request for execution */
  submit(request: Request): Promise<any>;

  /** Get current available tokens */
  getAvailableTokens(): number;

  /** Get current queue length */
  getQueueLength(): number;

  /** Get statistics */
  getStats(): RateLimitStats;

  /** Pause processing (stops refilling and executing) */
  pause(): void;

  /** Resume processing */
  resume(): void;

  /** Clear all queued requests */
  clear(): void;
}

/**
 * Cost tracker for multi-expert execution
 */
export interface CostTracker {
  /** Track cost for an expert */
  trackCost(expertId: string, tokens: number, cost: number): void;

  /** Get total cost across all experts */
  getTotalCost(): number;

  /** Get cost breakdown by expert */
  getCostByExpert(): Map<string, number>;

  /** Get total tokens consumed */
  getTotalTokens(): number;

  /** Get tokens breakdown by expert */
  getTokensByExpert(): Map<string, number>;

  /** Set budget limit */
  setBudget(budget: number): void;

  /** Check if over budget */
  isOverBudget(): boolean;

  /** Reset all tracking */
  reset(): void;
}

/**
 * Default rate limiter configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  tokensPerSecond: 1000,
  maxBurst: 5000,
  maxQueueSize: 100,
  priorityLevels: 5,
};

/**
 * Priority queue item
 */
interface QueuedRequest {
  request: Request;
  enqueuedAt: number;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

/**
 * Token Bucket Rate Limiter Implementation
 */
export class TokenBucketRateLimiter implements RateLimiter {
  private config: RateLimitConfig;
  private tokens: number;
  private lastRefill: number;
  private queue: QueuedRequest[][];
  private processing: boolean;
  private paused: boolean;
  private refillInterval: NodeJS.Timeout | null;

  // Statistics
  private stats: {
    totalRequests: number;
    totalTokens: number;
    droppedRequests: number;
    totalWaitTime: number;
  };

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
    this.tokens = this.config.maxBurst;
    this.lastRefill = Date.now();
    this.queue = Array.from({ length: this.config.priorityLevels }, () => []);
    this.processing = false;
    this.paused = false;
    this.refillInterval = null;

    this.stats = {
      totalRequests: 0,
      totalTokens: 0,
      droppedRequests: 0,
      totalWaitTime: 0,
    };

    // Start refill timer
    this.startRefillTimer();
  }

  /**
   * Submit a request for rate-limited execution
   */
  async submit(request: Request): Promise<any> {
    this.validateRequest(request);
    this.stats.totalRequests++;

    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        request,
        enqueuedAt: Date.now(),
        resolve,
        reject,
      };

      // Check queue capacity
      const totalQueued = this.queue.reduce((sum, level) => sum + level.length, 0);
      if (totalQueued >= this.config.maxQueueSize) {
        this.stats.droppedRequests++;
        reject(new Error('Queue full: request dropped'));
        return;
      }

      // Add to priority queue
      const priorityIndex = Math.min(request.priority, this.config.priorityLevels - 1);
      this.queue[priorityIndex].push(queuedRequest);

      // Try to process immediately
      this.processQueue();
    });
  }

  /**
   * Get current available tokens
   */
  getAvailableTokens(): number {
    this.refillTokens();
    return Math.floor(this.tokens);
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.reduce((sum, level) => sum + level.length, 0);
  }

  /**
   * Get statistics
   */
  getStats(): RateLimitStats {
    const queuedRequests = this.getQueueLength();
    const avgWaitTime =
      this.stats.totalRequests > 0 ? this.stats.totalWaitTime / this.stats.totalRequests : 0;

    return {
      totalRequests: this.stats.totalRequests,
      totalTokens: this.stats.totalTokens,
      queuedRequests,
      droppedRequests: this.stats.droppedRequests,
      averageWaitTime: avgWaitTime,
    };
  }

  /**
   * Pause processing
   */
  pause(): void {
    this.paused = true;
    if (this.refillInterval) {
      clearInterval(this.refillInterval);
      this.refillInterval = null;
    }
  }

  /**
   * Resume processing
   */
  resume(): void {
    this.paused = false;
    this.startRefillTimer();
    this.processQueue();
  }

  /**
   * Clear all queued requests
   */
  clear(): void {
    for (const level of this.queue) {
      for (const item of level) {
        item.reject(new Error('Queue cleared'));
      }
      level.length = 0;
    }
  }

  /**
   * Start the token refill timer
   */
  private startRefillTimer(): void {
    if (this.refillInterval) {
      clearInterval(this.refillInterval);
    }

    // Refill every 100ms for smooth operation
    this.refillInterval = setInterval(() => {
      if (!this.paused) {
        this.refillTokens();
        this.processQueue();
      }
    }, 100);
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsedMs = now - this.lastRefill;
    const elapsedSeconds = elapsedMs / 1000;

    const tokensToAdd = elapsedSeconds * this.config.tokensPerSecond;
    this.tokens = Math.min(this.tokens + tokensToAdd, this.config.maxBurst);
    this.lastRefill = now;
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    if (this.processing || this.paused) {
      return;
    }

    this.processing = true;

    // Process by priority (highest first)
    for (let priority = this.config.priorityLevels - 1; priority >= 0; priority--) {
      const levelQueue = this.queue[priority];

      while (levelQueue.length > 0) {
        const item = levelQueue[0];

        // Refill tokens before checking
        this.refillTokens();

        // Check if we have enough tokens
        if (this.tokens >= item.request.estimatedTokens) {
          // Dequeue and execute
          levelQueue.shift();
          this.executeRequest(item);
        } else {
          // Not enough tokens, stop processing this priority level
          break;
        }
      }
    }

    this.processing = false;
  }

  /**
   * Execute a request
   */
  private async executeRequest(item: QueuedRequest): Promise<void> {
    const { request, enqueuedAt, resolve, reject } = item;

    // Consume tokens
    this.tokens -= request.estimatedTokens;
    this.stats.totalTokens += request.estimatedTokens;

    // Track wait time
    const waitTime = Date.now() - enqueuedAt;
    this.stats.totalWaitTime += waitTime;

    try {
      const result = await request.callback();
      resolve(result);
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Validate a request
   */
  private validateRequest(request: Request): void {
    if (!request.id) {
      throw new Error('Request must have an id');
    }
    if (request.priority < 0) {
      throw new Error('Priority must be non-negative');
    }
    if (request.estimatedTokens <= 0) {
      throw new Error('Estimated tokens must be positive');
    }
    if (typeof request.callback !== 'function') {
      throw new Error('Request must have a callback function');
    }
  }
}

/**
 * Cost Tracker Implementation
 */
export class SimpleCostTracker implements CostTracker {
  private costByExpert: Map<string, number>;
  private tokensByExpert: Map<string, number>;
  private budget: number | null;

  constructor(budget?: number) {
    this.costByExpert = new Map();
    this.tokensByExpert = new Map();
    this.budget = budget ?? null;
  }

  /**
   * Track cost for an expert
   */
  trackCost(expertId: string, tokens: number, cost: number): void {
    const currentCost = this.costByExpert.get(expertId) || 0;
    const currentTokens = this.tokensByExpert.get(expertId) || 0;

    this.costByExpert.set(expertId, currentCost + cost);
    this.tokensByExpert.set(expertId, currentTokens + tokens);
  }

  /**
   * Get total cost across all experts
   */
  getTotalCost(): number {
    let total = 0;
    for (const cost of this.costByExpert.values()) {
      total += cost;
    }
    return total;
  }

  /**
   * Get cost breakdown by expert
   */
  getCostByExpert(): Map<string, number> {
    return new Map(this.costByExpert);
  }

  /**
   * Set budget limit
   */
  setBudget(budget: number): void {
    if (budget < 0) {
      throw new Error('Budget must be non-negative');
    }
    this.budget = budget;
  }

  /**
   * Check if over budget
   */
  isOverBudget(): boolean {
    if (this.budget === null) {
      return false;
    }
    return this.getTotalCost() > this.budget;
  }

  /**
   * Get total tokens consumed
   */
  getTotalTokens(): number {
    let total = 0;
    for (const tokens of this.tokensByExpert.values()) {
      total += tokens;
    }
    return total;
  }

  /**
   * Get tokens by expert
   */
  getTokensByExpert(): Map<string, number> {
    return new Map(this.tokensByExpert);
  }

  /**
   * Reset all tracking
   */
  reset(): void {
    this.costByExpert.clear();
    this.tokensByExpert.clear();
  }
}

/**
 * Create a rate limiter with default config
 */
export function createRateLimiter(config?: Partial<RateLimitConfig>): RateLimiter {
  return new TokenBucketRateLimiter(config);
}

/**
 * Create a cost tracker
 */
export function createCostTracker(budget?: number): CostTracker {
  return new SimpleCostTracker(budget);
}
