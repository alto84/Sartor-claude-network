/**
 * Sandboxed Execution Environment
 *
 * Provides isolated execution contexts for expert agents with:
 * - Resource limits (CPU, memory, time)
 * - Safe failure handling (crash isolation)
 * - Execution trace capture
 * - Multiple isolation strategies
 *
 * This module wraps the lower-level SandboxExecutor with a higher-level
 * management interface for coordinating multiple sandboxes.
 *
 * @module multi-expert/sandbox
 */

import { SandboxExecutor, SandboxResult, SandboxConfig } from './sandbox-executor';

/**
 * Resource usage tracking
 */
export interface ResourceUsage {
  /** Memory used in MB */
  memoryMB: number;

  /** CPU time used in ms */
  cpuTimeMs: number;

  /** Wall clock time in ms */
  wallTimeMs: number;

  /** Number of output bytes */
  outputBytes: number;

  /** Peak memory usage in MB */
  peakMemoryMB: number;
}

/**
 * Resource limits configuration
 */
export interface ResourceLimits {
  /** Maximum memory in MB */
  maxMemoryMB: number;

  /** Maximum execution time in ms */
  maxTimeMs: number;

  /** Maximum CPU percentage (0-100) */
  maxCpuPercent: number;

  /** Maximum output size in bytes */
  maxOutputBytes?: number;
}

/**
 * Execution trace step
 */
export interface TraceStep {
  /** Step number */
  step: number;

  /** Timestamp */
  timestamp: number;

  /** Action performed */
  action: string;

  /** Result of the action */
  result: 'success' | 'failure' | 'timeout' | 'error';

  /** Duration in ms */
  durationMs: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Error message if failed */
  error?: string;
}

/**
 * Complete execution trace
 */
export interface ExecutionTrace {
  /** Sandbox ID */
  sandboxId: string;

  /** Start timestamp */
  startTime: number;

  /** End timestamp */
  endTime: number;

  /** Execution steps */
  steps: TraceStep[];

  /** Resource usage */
  resourceUsage: ResourceUsage;

  /** Errors encountered */
  errors: Error[];

  /** Whether execution completed successfully */
  success: boolean;

  /** Exit reason */
  exitReason: 'completed' | 'timeout' | 'memory_limit' | 'error' | 'terminated';
}

/**
 * Managed sandbox configuration
 */
export interface ManagedSandboxConfig {
  /** Unique sandbox identifier */
  id: string;

  /** Resource limits */
  limits: ResourceLimits;

  /** Whether to capture execution trace */
  captureTrace: boolean;

  /** Whether to isolate errors (don't propagate) */
  isolateErrors: boolean;

  /** Working directory */
  workingDir?: string;

  /** Environment variables */
  environment?: Record<string, string>;

  /** Cleanup on destroy */
  autoCleanup?: boolean;
}

/**
 * Sandbox execution options
 */
export interface ExecutionOptions {
  /** Arguments to pass */
  args?: string[];

  /** Input data */
  input?: unknown;

  /** Timeout override (ms) */
  timeout?: number;

  /** Whether to parse JSON output */
  parseJson?: boolean;
}

/**
 * Sandbox statistics
 */
export interface SandboxStats {
  /** Total sandboxes created */
  totalCreated: number;

  /** Currently active sandboxes */
  activeCount: number;

  /** Total executions */
  totalExecutions: number;

  /** Successful executions */
  successfulExecutions: number;

  /** Failed executions */
  failedExecutions: number;

  /** Timeout errors */
  timeoutErrors: number;

  /** Memory limit errors */
  memoryLimitErrors: number;

  /** Average execution time */
  avgExecutionTimeMs: number;

  /** Total cleanup operations */
  cleanupOperations: number;
}

/**
 * Sandbox instance
 */
export interface Sandbox {
  /** Get sandbox ID */
  readonly id: string;

  /** Get sandbox configuration */
  readonly config: ManagedSandboxConfig;

  /** Whether sandbox is active */
  readonly isActive: boolean;

  /** Execute function in sandbox */
  execute(fn: () => Promise<any>, options?: ExecutionOptions): Promise<any>;

  /** Execute code string */
  executeCode(
    code: string,
    language?: 'javascript' | 'typescript' | 'python',
    options?: ExecutionOptions
  ): Promise<any>;

  /** Execute command */
  executeCommand(command: string, options?: ExecutionOptions): Promise<any>;

  /** Get execution trace */
  getTrace(): ExecutionTrace | null;

  /** Get current resource usage */
  getResourceUsage(): ResourceUsage;

  /** Force terminate any running execution */
  forceTerminate(): void;

  /** Cleanup and destroy sandbox */
  cleanup(): void;
}

/**
 * Sandbox manager interface
 */
export interface SandboxManager {
  /** Create a new sandbox */
  createSandbox(config: ManagedSandboxConfig): Sandbox;

  /** Get sandbox by ID */
  getSandbox(id: string): Sandbox | undefined;

  /** List all active sandbox IDs */
  listActive(): string[];

  /** Cleanup all sandboxes */
  cleanupAll(): void;

  /** Get manager statistics */
  getStats(): SandboxStats;

  /** Destroy the manager */
  destroy(): void;
}

/**
 * Default resource limits
 */
export const DEFAULT_LIMITS: ResourceLimits = {
  maxMemoryMB: 512,
  maxTimeMs: 30000,
  maxCpuPercent: 80,
  maxOutputBytes: 1024 * 1024, // 1MB
};

/**
 * Default sandbox configuration
 */
export const DEFAULT_MANAGED_SANDBOX_CONFIG: Omit<ManagedSandboxConfig, 'id'> = {
  limits: DEFAULT_LIMITS,
  captureTrace: true,
  isolateErrors: true,
  autoCleanup: true,
};

/**
 * Implementation of Sandbox using SandboxExecutor
 */
class SandboxImpl implements Sandbox {
  private executor: SandboxExecutor;
  private trace: ExecutionTrace | null = null;
  private resourceUsage: ResourceUsage;
  private active: boolean = true;
  private executionCount: number = 0;
  private terminated: boolean = false;

  constructor(public readonly config: ManagedSandboxConfig) {
    // Create underlying executor with mapped config
    this.executor = new SandboxExecutor({
      timeout: config.limits.maxTimeMs,
      maxMemory: config.limits.maxMemoryMB,
      cwd: config.workingDir,
      env: config.environment,
      captureStdout: true,
      captureStderr: true,
      maxOutputSize: config.limits.maxOutputBytes || DEFAULT_LIMITS.maxOutputBytes!,
      parseJson: false,
      shell: true,
    });

    this.resourceUsage = {
      memoryMB: 0,
      cpuTimeMs: 0,
      wallTimeMs: 0,
      outputBytes: 0,
      peakMemoryMB: 0,
    };

    // Initialize trace if enabled
    if (config.captureTrace) {
      this.trace = {
        sandboxId: config.id,
        startTime: Date.now(),
        endTime: 0,
        steps: [],
        resourceUsage: this.resourceUsage,
        errors: [],
        success: false,
        exitReason: 'completed',
      };
    }
  }

  get id(): string {
    return this.config.id;
  }

  get isActive(): boolean {
    return this.active;
  }

  async execute(fn: () => Promise<any>, options?: ExecutionOptions): Promise<any> {
    if (!this.active) {
      throw new Error(`Sandbox ${this.id} is not active`);
    }

    const stepStart = Date.now();
    this.executionCount++;

    try {
      // Convert function to executable code
      const code = `(${fn.toString()})()`;
      const result = await this.executeCode(code, 'javascript', options);

      this.recordStep({
        step: this.executionCount,
        timestamp: stepStart,
        action: 'execute_function',
        result: 'success',
        durationMs: Date.now() - stepStart,
      });

      return result;
    } catch (error) {
      this.recordStep({
        step: this.executionCount,
        timestamp: stepStart,
        action: 'execute_function',
        result: 'error',
        durationMs: Date.now() - stepStart,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (this.config.isolateErrors) {
        return null;
      }
      throw error;
    }
  }

  async executeCode(
    code: string,
    language: 'javascript' | 'typescript' | 'python' = 'javascript',
    options?: ExecutionOptions
  ): Promise<any> {
    if (!this.active) {
      throw new Error(`Sandbox ${this.id} is not active`);
    }

    const stepStart = Date.now();
    const executionId = `${this.id}-exec-${this.executionCount++}`;

    try {
      const result = await this.executor.executeCode(code, language, executionId);

      // Update resource usage
      this.updateResourceUsage(result);

      // Record step
      this.recordStep({
        step: this.executionCount,
        timestamp: stepStart,
        action: `execute_${language}`,
        result: result.success ? 'success' : result.timedOut ? 'timeout' : 'failure',
        durationMs: result.durationMs,
        metadata: {
          exitCode: result.exitCode,
          timedOut: result.timedOut,
          memoryExceeded: result.memoryExceeded,
        },
        error: result.error,
      });

      // Handle failures
      if (!result.success) {
        const error = new Error(result.error || 'Execution failed');

        if (this.trace) {
          this.trace.errors.push(error);
          // Only update exit reason if not already terminated
          if (!this.terminated) {
            if (result.timedOut) {
              this.trace.exitReason = 'timeout';
            } else if (result.memoryExceeded) {
              this.trace.exitReason = 'memory_limit';
            } else {
              this.trace.exitReason = 'error';
            }
          }
        }

        if (this.config.isolateErrors) {
          return null;
        }
        throw error;
      }

      // Parse output if needed
      if (options?.parseJson && result.parsedOutput !== undefined) {
        return result.parsedOutput;
      }

      return result.stdout || result.parsedOutput;
    } catch (error) {
      this.recordStep({
        step: this.executionCount,
        timestamp: stepStart,
        action: `execute_${language}`,
        result: 'error',
        durationMs: Date.now() - stepStart,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (this.trace) {
        this.trace.errors.push(error instanceof Error ? error : new Error(String(error)));
        // Only update exit reason if not already terminated
        if (!this.terminated) {
          this.trace.exitReason = 'error';
        }
      }

      if (this.config.isolateErrors) {
        return null;
      }
      throw error;
    }
  }

  async executeCommand(command: string, options?: ExecutionOptions): Promise<any> {
    if (!this.active) {
      throw new Error(`Sandbox ${this.id} is not active`);
    }

    const stepStart = Date.now();
    const executionId = `${this.id}-cmd-${this.executionCount++}`;

    try {
      const result = await this.executor.execute(command, options?.args || [], executionId);

      this.updateResourceUsage(result);

      this.recordStep({
        step: this.executionCount,
        timestamp: stepStart,
        action: 'execute_command',
        result: result.success ? 'success' : result.timedOut ? 'timeout' : 'failure',
        durationMs: result.durationMs,
        metadata: {
          command,
          args: options?.args,
          exitCode: result.exitCode,
        },
        error: result.error,
      });

      if (!result.success) {
        const error = new Error(result.error || 'Command execution failed');
        if (this.trace) {
          this.trace.errors.push(error);
          // Only update exit reason if not already terminated
          if (!this.terminated) {
            if (result.timedOut) {
              this.trace.exitReason = 'timeout';
            } else if (result.memoryExceeded) {
              this.trace.exitReason = 'memory_limit';
            } else {
              this.trace.exitReason = 'error';
            }
          }
        }

        if (this.config.isolateErrors) {
          return null;
        }
        throw error;
      }

      return result.stdout;
    } catch (error) {
      this.recordStep({
        step: this.executionCount,
        timestamp: stepStart,
        action: 'execute_command',
        result: 'error',
        durationMs: Date.now() - stepStart,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (this.trace && !this.terminated) {
        this.trace.exitReason = 'error';
      }

      if (this.config.isolateErrors) {
        return null;
      }
      throw error;
    }
  }

  getTrace(): ExecutionTrace | null {
    if (this.trace && this.trace.endTime === 0) {
      // Update end time if still running
      return {
        ...this.trace,
        endTime: Date.now(),
      };
    }
    return this.trace;
  }

  getResourceUsage(): ResourceUsage {
    return { ...this.resourceUsage };
  }

  forceTerminate(): void {
    this.terminated = true;
    this.executor.killAll();

    if (this.trace) {
      this.trace.exitReason = 'terminated';
      this.trace.success = false;
      this.trace.endTime = Date.now();
    }

    this.recordStep({
      step: this.executionCount + 1,
      timestamp: Date.now(),
      action: 'force_terminate',
      result: 'success',
      durationMs: 0,
    });
  }

  cleanup(): void {
    this.forceTerminate();
    this.active = false;

    if (this.trace && this.trace.endTime === 0) {
      this.trace.endTime = Date.now();
      this.trace.success = this.trace.exitReason === 'completed';
    }
  }

  private updateResourceUsage(result: SandboxResult): void {
    // Update wall time
    this.resourceUsage.wallTimeMs += result.durationMs;

    // Estimate CPU time (approximation)
    this.resourceUsage.cpuTimeMs += result.durationMs * 0.8;

    // Update output bytes
    const outputSize = (result.stdout?.length || 0) + (result.stderr?.length || 0);
    this.resourceUsage.outputBytes += outputSize;

    // Note: Memory tracking is approximate in Node.js without native addons
    // We track it based on memory exceeded flags
    if (result.memoryExceeded) {
      this.resourceUsage.memoryMB = this.config.limits.maxMemoryMB;
      this.resourceUsage.peakMemoryMB = Math.max(
        this.resourceUsage.peakMemoryMB,
        this.config.limits.maxMemoryMB
      );
    }
  }

  private recordStep(step: TraceStep): void {
    if (this.trace) {
      this.trace.steps.push(step);
    }
  }
}

/**
 * Implementation of SandboxManager
 */
class SandboxManagerImpl implements SandboxManager {
  private sandboxes: Map<string, Sandbox> = new Map();
  private stats: SandboxStats = {
    totalCreated: 0,
    activeCount: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    timeoutErrors: 0,
    memoryLimitErrors: 0,
    avgExecutionTimeMs: 0,
    cleanupOperations: 0,
  };

  createSandbox(config: ManagedSandboxConfig): Sandbox {
    if (this.sandboxes.has(config.id)) {
      throw new Error(`Sandbox with id ${config.id} already exists`);
    }

    const sandbox = new SandboxImpl(config);
    this.sandboxes.set(config.id, sandbox);

    this.stats.totalCreated++;
    this.stats.activeCount++;

    return sandbox;
  }

  getSandbox(id: string): Sandbox | undefined {
    return this.sandboxes.get(id);
  }

  listActive(): string[] {
    const active: string[] = [];
    for (const [id, sandbox] of this.sandboxes.entries()) {
      if (sandbox.isActive) {
        active.push(id);
      }
    }
    return active;
  }

  cleanupAll(): void {
    for (const sandbox of this.sandboxes.values()) {
      if (sandbox.isActive) {
        sandbox.cleanup();
        this.stats.cleanupOperations++;
      }
    }
    this.sandboxes.clear();
    this.stats.activeCount = 0;
  }

  getStats(): SandboxStats {
    // Update active count
    this.stats.activeCount = this.listActive().length;
    return { ...this.stats };
  }

  destroy(): void {
    this.cleanupAll();
    this.sandboxes.clear();
  }
}

/**
 * Create a new sandbox manager
 */
export function createSandboxManager(): SandboxManager {
  return new SandboxManagerImpl();
}

/**
 * Create a sandbox with default configuration
 */
export function createSandbox(id: string, overrides?: Partial<ManagedSandboxConfig>): Sandbox {
  const manager = createSandboxManager();
  const config: ManagedSandboxConfig = {
    ...DEFAULT_MANAGED_SANDBOX_CONFIG,
    id,
    ...overrides,
    limits: {
      ...DEFAULT_LIMITS,
      ...overrides?.limits,
    },
  };

  return manager.createSandbox(config);
}

/**
 * Execute code in a one-off sandbox
 */
export async function sandboxedExecute(
  code: string,
  options?: {
    language?: 'javascript' | 'typescript' | 'python';
    timeout?: number;
    maxMemory?: number;
    captureTrace?: boolean;
  }
): Promise<{ result: any; trace?: ExecutionTrace }> {
  const id = `oneoff-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const sandbox = createSandbox(id, {
    limits: {
      maxMemoryMB: options?.maxMemory || DEFAULT_LIMITS.maxMemoryMB,
      maxTimeMs: options?.timeout || DEFAULT_LIMITS.maxTimeMs,
      maxCpuPercent: DEFAULT_LIMITS.maxCpuPercent,
    },
    captureTrace: options?.captureTrace ?? true,
    isolateErrors: false,
    autoCleanup: true,
  });

  try {
    const result = await sandbox.executeCode(code, options?.language);
    const trace = sandbox.getTrace();

    return {
      result,
      trace: trace || undefined,
    };
  } finally {
    sandbox.cleanup();
  }
}

/**
 * Execute multiple tasks in parallel sandboxes
 */
export async function parallelSandboxedExecute<T>(
  tasks: Array<{
    id: string;
    code: string;
    language?: 'javascript' | 'typescript' | 'python';
  }>,
  options?: {
    timeout?: number;
    maxMemory?: number;
    maxConcurrent?: number;
  }
): Promise<Array<{ id: string; result: T; trace?: ExecutionTrace; error?: Error }>> {
  const manager = createSandboxManager();
  const maxConcurrent = options?.maxConcurrent || 5;

  const results: Array<{ id: string; result: T; trace?: ExecutionTrace; error?: Error }> = [];

  // Process tasks in batches
  for (let i = 0; i < tasks.length; i += maxConcurrent) {
    const batch = tasks.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async (task) => {
      const sandbox = manager.createSandbox({
        id: task.id,
        limits: {
          maxMemoryMB: options?.maxMemory || DEFAULT_LIMITS.maxMemoryMB,
          maxTimeMs: options?.timeout || DEFAULT_LIMITS.maxTimeMs,
          maxCpuPercent: DEFAULT_LIMITS.maxCpuPercent,
        },
        captureTrace: true,
        isolateErrors: true,
        autoCleanup: true,
      });

      try {
        const result = await sandbox.executeCode(task.code, task.language);
        const trace = sandbox.getTrace();

        return {
          id: task.id,
          result: result as T,
          trace: trace || undefined,
        };
      } catch (error) {
        return {
          id: task.id,
          result: null as T,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      } finally {
        sandbox.cleanup();
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  manager.destroy();

  return results;
}

// Re-export types from sandbox-executor for convenience
export type { SandboxResult } from './sandbox-executor';
