/**
 * Continuous Learning Pipeline
 * Phase 5: Extract patterns → Generalize → Validate → Store
 */

import { MemorySystem, Memory } from '../memory/memory-system';
import { MemoryType, MemoryStatus } from '../memory/memory-schema';

export interface Pattern {
  id: string;
  name: string;
  trigger: string;
  action: string;
  successRate: number;
  occurrences: number;
}

export interface LearningStats {
  patternsExtracted: number;
  patternsValidated: number;
  patternsStored: number;
  totalOccurrences: number;
}

export class LearningPipeline {
  private memory: MemorySystem;
  private patterns: Map<string, Pattern> = new Map();
  private minOccurrences = 3;
  private minSuccessRate = 0.7;

  constructor(memory: MemorySystem) {
    this.memory = memory;
  }

  async extract(): Promise<Pattern[]> {
    const results = await this.memory.searchMemories({
      filters: { type: [MemoryType.PROCEDURAL] },
      limit: 100
    });

    const patternMap = new Map<string, { successes: number; total: number }>();

    for (const { memory } of results) {
      try {
        const data = JSON.parse(memory.content);
        const key = data.task || 'unknown';
        const current = patternMap.get(key) || { successes: 0, total: 0 };
        current.total++;
        if (data.finalScore > 0.7) current.successes++;
        patternMap.set(key, current);
      } catch {
        continue;
      }
    }

    const extracted: Pattern[] = [];
    for (const [trigger, stats] of patternMap) {
      if (stats.total >= this.minOccurrences) {
        const successRate = stats.successes / stats.total;
        extracted.push({
          id: 'pat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: `Pattern: ${trigger.substring(0, 30)}`,
          trigger,
          action: 'Apply learned approach',
          successRate,
          occurrences: stats.total
        });
      }
    }

    return extracted;
  }

  async generalize(pattern: Pattern): Promise<Pattern> {
    // Generalize trigger to be more broadly applicable
    return {
      ...pattern,
      trigger: pattern.trigger.replace(/specific/gi, 'general'),
      name: `Generalized: ${pattern.name}`
    };
  }

  async validate(pattern: Pattern): Promise<boolean> {
    return pattern.successRate >= this.minSuccessRate &&
           pattern.occurrences >= this.minOccurrences;
  }

  async store(pattern: Pattern): Promise<string> {
    const mem = await this.memory.createMemory(
      JSON.stringify(pattern),
      MemoryType.SEMANTIC,
      {
        importance_score: pattern.successRate,
        tags: ['pattern', 'learned']
      }
    );
    this.patterns.set(pattern.id, pattern);
    return mem.id;
  }

  async runPipeline(): Promise<LearningStats> {
    const extracted = await this.extract();
    let validated = 0;
    let stored = 0;
    let totalOccurrences = 0;

    for (const pattern of extracted) {
      totalOccurrences += pattern.occurrences;
      const generalized = await this.generalize(pattern);

      if (await this.validate(generalized)) {
        validated++;
        await this.store(generalized);
        stored++;
      }
    }

    return {
      patternsExtracted: extracted.length,
      patternsValidated: validated,
      patternsStored: stored,
      totalOccurrences
    };
  }

  getStoredPatterns(): Pattern[] {
    return Array.from(this.patterns.values());
  }
}

export function createLearningPipeline(memory: MemorySystem): LearningPipeline {
  return new LearningPipeline(memory);
}
