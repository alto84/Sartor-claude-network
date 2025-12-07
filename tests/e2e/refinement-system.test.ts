/**
 * End-to-End Tests: Refinement System
 * Tests the complete refinement → memory → learning pipeline
 */

import { MemorySystem } from '../../src/memory/memory-system';
import { MemoryType } from '../../src/memory/memory-schema';
import { createBridge } from '../../src/integration';
import { createExecutive, AgentRole } from '../../src/executive';
import { createSelfImprovingLoop } from '../../src/executive';
import { createLearningPipeline } from '../../src/executive';

describe('Refinement System E2E', () => {
  let memory: MemorySystem;

  beforeEach(() => {
    memory = new MemorySystem();
  });

  describe('Memory-Refinement Bridge', () => {
    it('should record refinement iterations in memory', async () => {
      const bridge = createBridge(memory);

      const memoryId = await bridge.recordRefinement({
        task: 'Test refinement task',
        iterations: 3,
        initialScore: 0.4,
        finalScore: 0.9,
        improvements: ['Fixed logic', 'Optimized performance', 'Added validation']
      });

      expect(memoryId).toBeDefined();

      const stored = await memory.getMemory(memoryId);
      expect(stored).not.toBeNull();
      expect(stored?.type).toBe(MemoryType.PROCEDURAL);
    });

    it('should retrieve patterns from past refinements', async () => {
      const bridge = createBridge(memory);

      // Store multiple refinements
      await bridge.recordRefinement({
        task: 'Task A',
        iterations: 2,
        initialScore: 0.5,
        finalScore: 0.85,
        improvements: ['Improvement A1']
      });

      await bridge.recordRefinement({
        task: 'Task B',
        iterations: 3,
        initialScore: 0.3,
        finalScore: 0.95,
        improvements: ['Improvement B1', 'Improvement B2']
      });

      const patterns = await bridge.getTopPatterns(5);
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe('Self-Improving Loop', () => {
    it('should identify improvement candidates', async () => {
      const loop = createSelfImprovingLoop(memory);

      // Seed some memories
      await memory.createMemory('Test pattern', MemoryType.PROCEDURAL, {
        importance_score: 0.7,
        tags: ['test']
      });

      const candidates = await loop.identify();
      expect(Array.isArray(candidates)).toBe(true);
    });

    it('should run complete improvement cycle', async () => {
      const loop = createSelfImprovingLoop(memory);

      // Seed data
      await memory.createMemory('Pattern 1', MemoryType.PROCEDURAL, { importance_score: 0.8 });
      await memory.createMemory('Pattern 2', MemoryType.PROCEDURAL, { importance_score: 0.6 });

      const result = await loop.runCycle();

      expect(result).toHaveProperty('identified');
      expect(result).toHaveProperty('implemented');
      expect(typeof result.identified).toBe('number');
    });
  });

  describe('Learning Pipeline', () => {
    it('should extract patterns from memory', async () => {
      const pipeline = createLearningPipeline(memory);

      // Seed procedural memories
      for (let i = 0; i < 5; i++) {
        await memory.createMemory(
          JSON.stringify({ task: 'recurring_task', finalScore: 0.85 }),
          MemoryType.PROCEDURAL
        );
      }

      const patterns = await pipeline.extract();
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should run complete learning pipeline', async () => {
      const pipeline = createLearningPipeline(memory);

      // Seed data
      for (let i = 0; i < 5; i++) {
        await memory.createMemory(
          JSON.stringify({ task: 'learning_task', finalScore: 0.9 }),
          MemoryType.PROCEDURAL
        );
      }

      const stats = await pipeline.runPipeline();

      expect(stats).toHaveProperty('patternsExtracted');
      expect(stats).toHaveProperty('patternsValidated');
      expect(stats).toHaveProperty('patternsStored');
    });
  });

  describe('Full System Integration', () => {
    it('should demonstrate complete refinement → learning flow', async () => {
      const executive = createExecutive();
      const pipeline = createLearningPipeline(memory);

      // Execute tasks through executive
      const results = await executive.orchestrate([
        { id: 'e2e-1', role: AgentRole.PLANNER, description: 'Plan feature', context: '' },
        { id: 'e2e-2', role: AgentRole.IMPLEMENTER, description: 'Build feature', context: '' },
        { id: 'e2e-3', role: AgentRole.AUDITOR, description: 'Review feature', context: '' }
      ]);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);

      // Verify learning captured
      const patterns = await executive.learnFromHistory();
      expect(Array.isArray(patterns)).toBe(true);
    });
  });
});
