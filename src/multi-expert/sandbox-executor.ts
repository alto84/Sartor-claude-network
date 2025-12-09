/**
 * Sandbox Executor
 *
 * Provides isolated code execution with security boundaries.
 * Inspired by Poetiq's subprocess sandboxing with timeout enforcement.
 *
 * Features:
 * - Subprocess isolation
 * - Timeout enforcement
 * - Memory limits
 * - Output capture
 * - Error handling
 *
 * @module multi-expert/sandbox-executor
 */

import { spawn, ChildProcess } from 'child_process';
import { ExpertConfig } from './expert-config';
import { ExpertTask } from './execution-engine';

/**
 * Sandbox execution result
 */
export interface SandboxResult {
  /** Whether execution succeeded */
  success: boolean;

  /** Exit code */
  exitCode: number | null;

  /** Standard output */
  stdout: string;

  /** Standard error */
  stderr: string;

  /** Execution duration in ms */
  durationMs: number;

  /** Whether execution was killed due to timeout */
  timedOut: boolean;

  /** Whether execution was killed due to memory limit */
  memoryExceeded: boolean;

  /** Error message if failed */
  error?: string;

  /** Parsed output (if JSON) */
  parsedOutput?: unknown;
}

/**
 * Sandbox configuration
 */
export interface SandboxConfig {
  /** Maximum execution time in ms */
  timeout: number;

  /** Maximum memory in MB (approximate) */
  maxMemory: number;

  /** Working directory */
  cwd?: string;

  /** Environment variables */
  env?: Record<string, string>;

  /** Whether to capture stdout */
  captureStdout: boolean;

  /** Whether to capture stderr */
  captureStderr: boolean;

  /** Maximum output size in bytes */
  maxOutputSize: number;

  /** Whether to parse JSON output */
  parseJson: boolean;

  /** Shell to use (defaults to /bin/sh) */
  shell: string | boolean;
}

/**
 * Default sandbox configuration
 */
export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  timeout: 30000,
  maxMemory: 512,
  captureStdout: true,
  captureStderr: true,
  maxOutputSize: 1024 * 1024, // 1MB
  parseJson: false,
  shell: true,
};

/**
 * Sandbox Executor for isolated code execution
 */
export class SandboxExecutor {
  private config: SandboxConfig;
  private activeProcesses: Map<string, ChildProcess>;

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = { ...DEFAULT_SANDBOX_CONFIG, ...config };
    this.activeProcesses = new Map();
  }

  /**
   * Execute command in sandbox
   */
  async execute(
    command: string,
    args: string[] = [],
    executionId: string = crypto.randomUUID()
  ): Promise<SandboxResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let memoryExceeded = false;
      let killed = false;

      // Build environment with memory limit hint
      const env = {
        ...process.env,
        ...this.config.env,
        NODE_OPTIONS: `--max-old-space-size=${this.config.maxMemory}`,
      };

      // Spawn process
      const proc = spawn(command, args, {
        cwd: this.config.cwd,
        env,
        shell: this.config.shell,
        timeout: this.config.timeout,
      });

      this.activeProcesses.set(executionId, proc);

      // Setup timeout
      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        killed = true;
        proc.kill('SIGKILL');
      }, this.config.timeout);

      // Capture stdout
      if (this.config.captureStdout && proc.stdout) {
        proc.stdout.on('data', (data) => {
          if (stdout.length < this.config.maxOutputSize) {
            stdout += data.toString();
          }
        });
      }

      // Capture stderr
      if (this.config.captureStderr && proc.stderr) {
        proc.stderr.on('data', (data) => {
          if (stderr.length < this.config.maxOutputSize) {
            stderr += data.toString();

            // Check for memory errors
            if (data.toString().includes('JavaScript heap out of memory')) {
              memoryExceeded = true;
            }
          }
        });
      }

      // Handle errors
      proc.on('error', (error) => {
        clearTimeout(timeoutHandle);
        this.activeProcesses.delete(executionId);

        resolve({
          success: false,
          exitCode: null,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          durationMs: Date.now() - startTime,
          timedOut: false,
          memoryExceeded: false,
          error: error.message,
        });
      });

      // Handle completion
      proc.on('close', (code) => {
        clearTimeout(timeoutHandle);
        this.activeProcesses.delete(executionId);

        const success = code === 0 && !timedOut && !memoryExceeded;

        let parsedOutput: unknown = undefined;
        if (this.config.parseJson && stdout) {
          try {
            parsedOutput = JSON.parse(stdout.trim());
          } catch {
            // Not valid JSON
          }
        }

        resolve({
          success,
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          durationMs: Date.now() - startTime,
          timedOut,
          memoryExceeded,
          error: timedOut
            ? 'Execution timed out'
            : memoryExceeded
              ? 'Memory limit exceeded'
              : code !== 0
                ? `Process exited with code ${code}`
                : undefined,
          parsedOutput,
        });
      });
    });
  }

  /**
   * Execute JavaScript/TypeScript code in sandbox
   */
  async executeCode(
    code: string,
    language: 'javascript' | 'typescript' | 'python' = 'javascript',
    executionId?: string
  ): Promise<SandboxResult> {
    switch (language) {
      case 'javascript':
        return this.execute('node', ['-e', code], executionId);

      case 'typescript':
        // Use ts-node if available, otherwise transpile first
        return this.execute('npx', ['ts-node', '-e', code], executionId);

      case 'python':
        return this.execute('python3', ['-c', code], executionId);

      default:
        return {
          success: false,
          exitCode: null,
          stdout: '',
          stderr: '',
          durationMs: 0,
          timedOut: false,
          memoryExceeded: false,
          error: `Unsupported language: ${language}`,
        };
    }
  }

  /**
   * Execute task using expert config
   */
  async executeTask(task: ExpertTask, config: ExpertConfig): Promise<SandboxResult> {
    // Build execution command based on task type
    const code = this.buildTaskCode(task);

    // Apply expert config timeouts
    const originalTimeout = this.config.timeout;
    this.config.timeout = config.taskTimeout;

    try {
      const result = await this.executeCode(code, 'javascript', task.id);
      return result;
    } finally {
      this.config.timeout = originalTimeout;
    }
  }

  /**
   * Build execution code from task
   */
  private buildTaskCode(task: ExpertTask): string {
    // Default: output task input as JSON
    const input = JSON.stringify(task.input);

    return `
      const input = ${input};
      const context = ${JSON.stringify(task.context || {})};

      // Task execution stub - override in actual implementation
      const result = {
        taskId: '${task.id}',
        type: '${task.type}',
        processed: true,
        input,
        context,
        timestamp: new Date().toISOString()
      };

      console.log(JSON.stringify(result));
    `;
  }

  /**
   * Kill active process
   */
  kill(executionId: string): boolean {
    const proc = this.activeProcesses.get(executionId);
    if (proc) {
      proc.kill('SIGKILL');
      this.activeProcesses.delete(executionId);
      return true;
    }
    return false;
  }

  /**
   * Kill all active processes
   */
  killAll(): number {
    let killed = 0;
    for (const [id, proc] of this.activeProcesses) {
      proc.kill('SIGKILL');
      this.activeProcesses.delete(id);
      killed++;
    }
    return killed;
  }

  /**
   * Get number of active processes
   */
  getActiveCount(): number {
    return this.activeProcesses.size;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<SandboxConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Create a sandbox executor with JSON output parsing
 */
export function createJsonSandbox(timeout: number = 30000): SandboxExecutor {
  return new SandboxExecutor({
    timeout,
    parseJson: true,
    captureStdout: true,
    captureStderr: true,
  });
}

/**
 * Execute code in a one-off sandbox
 */
export async function sandboxExecute(
  code: string,
  language: 'javascript' | 'typescript' | 'python' = 'javascript',
  timeout: number = 30000
): Promise<SandboxResult> {
  const sandbox = new SandboxExecutor({ timeout });
  return sandbox.executeCode(code, language);
}

/**
 * Execute command in a one-off sandbox
 */
export async function sandboxCommand(
  command: string,
  args: string[] = [],
  timeout: number = 30000
): Promise<SandboxResult> {
  const sandbox = new SandboxExecutor({ timeout });
  return sandbox.execute(command, args);
}
