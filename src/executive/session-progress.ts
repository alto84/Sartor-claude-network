/**
 * Session Progress Tracker
 * Implements Anthropic's "institutional memory" pattern via progress file
 * Agents read this file to understand prior work and avoid duplicate effort
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TaskRecord {
  taskId: string;
  description: string;
  role: string;
  status: 'attempted' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  iterations: number;
  finalScore?: number;
  errors?: string[];
}

export interface PatternLearned {
  pattern: string;
  evidence: string[];
  confidence: number;
  learnedAt: string;
}

export interface SessionProgress {
  sessionId: string;
  startedAt: string;
  updatedAt: string;
  tasksAttempted: number;
  tasksCompleted: number;
  tasksFailed: number;
  tasks: TaskRecord[];
  errors: string[];
  patternsLearned: PatternLearned[];
  notes: string[];
}

export class SessionProgressTracker {
  private sessionId: string;
  private progressPath: string;
  private progress: SessionProgress;

  constructor(progressPath?: string) {
    this.sessionId = 'session_' + Date.now().toString(36);
    this.progressPath = progressPath ?? path.join(process.cwd(), 'data', 'session-progress.json');
    this.progress = this.loadOrCreate();
  }

  private loadOrCreate(): SessionProgress {
    try {
      if (fs.existsSync(this.progressPath)) {
        const data = fs.readFileSync(this.progressPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load session progress, creating new:', error);
    }

    // Create new session
    return {
      sessionId: this.sessionId,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasksAttempted: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      tasks: [],
      errors: [],
      patternsLearned: [],
      notes: [],
    };
  }

  private save(): void {
    try {
      const dir = path.dirname(this.progressPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.progress.updatedAt = new Date().toISOString();
      fs.writeFileSync(this.progressPath, JSON.stringify(this.progress, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save session progress:', error);
    }
  }

  recordTaskStart(taskId: string, description: string, role: string): void {
    const record: TaskRecord = {
      taskId,
      description,
      role,
      status: 'attempted',
      startTime: new Date().toISOString(),
      iterations: 0,
    };

    this.progress.tasks.push(record);
    this.progress.tasksAttempted++;
    this.save();
  }

  recordTaskComplete(
    taskId: string,
    iterations: number,
    finalScore: number,
    success: boolean
  ): void {
    const task = this.progress.tasks.find((t) => t.taskId === taskId);
    if (!task) {
      console.warn(`Task ${taskId} not found in progress tracker`);
      return;
    }

    task.status = success ? 'completed' : 'failed';
    task.endTime = new Date().toISOString();
    task.iterations = iterations;
    task.finalScore = finalScore;

    if (success) {
      this.progress.tasksCompleted++;
    } else {
      this.progress.tasksFailed++;
    }

    this.save();
  }

  recordError(error: string): void {
    this.progress.errors.push(`[${new Date().toISOString()}] ${error}`);
    this.save();
  }

  recordPattern(pattern: string, evidence: string[], confidence: number): void {
    this.progress.patternsLearned.push({
      pattern,
      evidence,
      confidence,
      learnedAt: new Date().toISOString(),
    });
    this.save();
  }

  addNote(note: string): void {
    this.progress.notes.push(`[${new Date().toISOString()}] ${note}`);
    this.save();
  }

  getProgress(): SessionProgress {
    return { ...this.progress };
  }

  getSummary(): {
    successRate: number;
    avgIterations: number;
    patternsCount: number;
    errorsCount: number;
  } {
    const completed = this.progress.tasks.filter((t) => t.status === 'completed');
    const avgIterations =
      completed.length > 0
        ? completed.reduce((sum, t) => sum + t.iterations, 0) / completed.length
        : 0;

    return {
      successRate:
        this.progress.tasksAttempted > 0
          ? this.progress.tasksCompleted / this.progress.tasksAttempted
          : 0,
      avgIterations,
      patternsCount: this.progress.patternsLearned.length,
      errorsCount: this.progress.errors.length,
    };
  }

  reset(): void {
    this.progress = {
      sessionId: 'session_' + Date.now().toString(36),
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasksAttempted: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      tasks: [],
      errors: [],
      patternsLearned: [],
      notes: [],
    };
    this.save();
  }
}

export function createProgressTracker(progressPath?: string): SessionProgressTracker {
  return new SessionProgressTracker(progressPath);
}
