/**
 * Refinement-Memory Bridge
 * Connects refinement loop outcomes to persistent memory
 */

import { MemorySystem } from '../memory/memory-system';
import { MemoryType } from '../memory/memory-schema';

export interface RefinementRecord {
  id: string;
  task: string;
  iterations: number;
  initialScore: number;
  finalScore: number;
  improvements: string[];
  timestamp: string;
}

export class RefinementMemoryBridge {
  constructor(private memory: MemorySystem) {}

  async recordRefinement(record: Omit<RefinementRecord, 'id' | 'timestamp'>): Promise<string> {
    const content = JSON.stringify({
      task: record.task,
      iterations: record.iterations,
      improvement: record.finalScore - record.initialScore,
      improvements: record.improvements,
    });

    const mem = await this.memory.createMemory(content, MemoryType.PROCEDURAL, {
      importance_score: Math.min(1, (record.finalScore - record.initialScore) * 2),
      tags: ['refinement', 'learning'],
    });

    return mem.id;
  }

  async findSimilarRefinements(taskDescription: string): Promise<RefinementRecord[]> {
    const results = await this.memory.searchMemories({
      filters: {
        type: [MemoryType.PROCEDURAL],
        min_importance: 0.3,
      },
      limit: 5,
    });

    return results.map(r => JSON.parse(r.memory.content));
  }

  async getTopPatterns(limit = 10): Promise<string[]> {
    const results = await this.memory.searchMemories({
      filters: { min_importance: 0.7 },
      limit,
    });

    return results.flatMap(r => {
      try {
        const data = JSON.parse(r.memory.content);
        return data.improvements || [];
      } catch {
        return [];
      }
    });
  }
}

export function createBridge(memory: MemorySystem): RefinementMemoryBridge {
  return new RefinementMemoryBridge(memory);
}
