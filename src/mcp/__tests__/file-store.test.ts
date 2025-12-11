/**
 * Tests for FileStore including new Phase 6 memory types
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileStore, MemoryType } from '../file-store';

describe('FileStore', () => {
  let store: FileStore;
  const testDataDir = path.join(__dirname, 'test-data');

  beforeEach(() => {
    // Use a test-specific data directory
    store = new FileStore(testDataDir);
  });

  afterEach(() => {
    // Clean up test data
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true });
    }
  });

  describe('Basic Memory Operations', () => {
    test('should create memory with EPISODIC type', () => {
      const mem = store.createMemory('Test episodic memory', MemoryType.EPISODIC, {
        importance_score: 0.8,
        tags: ['test'],
      });

      expect(mem.id).toBeDefined();
      expect(mem.content).toBe('Test episodic memory');
      expect(mem.type).toBe(MemoryType.EPISODIC);
      expect(mem.importance_score).toBe(0.8);
      expect(mem.tags).toEqual(['test']);
    });

    test('should retrieve memory by ID', () => {
      const created = store.createMemory('Test content', MemoryType.SEMANTIC, {});
      const retrieved = store.getMemory(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.content).toBe('Test content');
    });

    test('should return undefined for non-existent memory', () => {
      const result = store.getMemory('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('Phase 6: REFINEMENT_TRACE Memory Type', () => {
    test('should create REFINEMENT_TRACE memory', () => {
      const traceData = {
        task_id: 'task-123',
        iterations: 3,
        final_result: 'Successfully refined output',
        success: true,
        duration_ms: 1500,
      };

      const mem = store.createMemory(
        JSON.stringify(traceData),
        MemoryType.REFINEMENT_TRACE,
        {
          importance_score: 0.8,
          tags: ['refinement', 'task:task-123', 'iterations:3'],
        }
      );

      expect(mem.type).toBe(MemoryType.REFINEMENT_TRACE);
      expect(mem.importance_score).toBe(0.8);
      expect(mem.tags).toContain('refinement');

      const content = JSON.parse(mem.content);
      expect(content.task_id).toBe('task-123');
      expect(content.iterations).toBe(3);
      expect(content.success).toBe(true);
    });

    test('should search REFINEMENT_TRACE memories', () => {
      // Create multiple refinement traces
      store.createMemory(
        JSON.stringify({ task_id: 't1', iterations: 2, success: true }),
        MemoryType.REFINEMENT_TRACE,
        { importance_score: 0.7 }
      );

      store.createMemory(
        JSON.stringify({ task_id: 't2', iterations: 5, success: false }),
        MemoryType.REFINEMENT_TRACE,
        { importance_score: 0.5 }
      );

      const results = store.searchMemories(
        { type: [MemoryType.REFINEMENT_TRACE], min_importance: 0.6 },
        10
      );

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe(MemoryType.REFINEMENT_TRACE);
      const content = JSON.parse(results[0].content);
      expect(content.task_id).toBe('t1');
    });

    test('should track refinement traces in stats', () => {
      store.createMemory('trace1', MemoryType.REFINEMENT_TRACE, {});
      store.createMemory('trace2', MemoryType.REFINEMENT_TRACE, {});
      store.createMemory('other', MemoryType.EPISODIC, {});

      const stats = store.getStats();
      expect(stats.by_type.refinement_trace).toBe(2);
      expect(stats.by_type.episodic).toBe(1);
      expect(stats.total).toBe(3);
    });
  });

  describe('Phase 6: EXPERT_CONSENSUS Memory Type', () => {
    test('should create EXPERT_CONSENSUS memory', () => {
      const consensusData = {
        task_type: 'code_review',
        votes: [
          { agent: 'auditor-1', decision: 'approve', confidence: 0.9 },
          { agent: 'auditor-2', decision: 'approve', confidence: 0.85 },
          { agent: 'auditor-3', decision: 'approve', confidence: 0.95 },
        ],
        consensus_decision: 'approve',
        agreement_level: 0.9,
      };

      const mem = store.createMemory(
        JSON.stringify(consensusData),
        MemoryType.EXPERT_CONSENSUS,
        {
          importance_score: 0.9, // agreement_level
          tags: ['consensus', 'task:code_review', 'decision:approve'],
        }
      );

      expect(mem.type).toBe(MemoryType.EXPERT_CONSENSUS);
      expect(mem.importance_score).toBe(0.9);

      const content = JSON.parse(mem.content);
      expect(content.task_type).toBe('code_review');
      expect(content.votes).toHaveLength(3);
      expect(content.agreement_level).toBe(0.9);
    });

    test('should search EXPERT_CONSENSUS with min_agreement filter', () => {
      // High agreement consensus
      store.createMemory(
        JSON.stringify({ task_type: 'design', agreement_level: 0.95 }),
        MemoryType.EXPERT_CONSENSUS,
        { importance_score: 0.95 }
      );

      // Medium agreement consensus
      store.createMemory(
        JSON.stringify({ task_type: 'implementation', agreement_level: 0.6 }),
        MemoryType.EXPERT_CONSENSUS,
        { importance_score: 0.6 }
      );

      // Low agreement consensus
      store.createMemory(
        JSON.stringify({ task_type: 'testing', agreement_level: 0.4 }),
        MemoryType.EXPERT_CONSENSUS,
        { importance_score: 0.4 }
      );

      // Search for high agreement only
      const results = store.searchMemories(
        { type: [MemoryType.EXPERT_CONSENSUS], min_importance: 0.8 },
        10
      );

      expect(results).toHaveLength(1);
      const content = JSON.parse(results[0].content);
      expect(content.task_type).toBe('design');
    });

    test('should track expert consensus in stats', () => {
      store.createMemory('consensus1', MemoryType.EXPERT_CONSENSUS, {});
      store.createMemory('consensus2', MemoryType.EXPERT_CONSENSUS, {});
      store.createMemory('consensus3', MemoryType.EXPERT_CONSENSUS, {});

      const stats = store.getStats();
      expect(stats.by_type.expert_consensus).toBe(3);
    });
  });

  describe('Memory Search with Multiple Types', () => {
    test('should search across all Phase 6 memory types', () => {
      store.createMemory('refinement1', MemoryType.REFINEMENT_TRACE, {
        importance_score: 0.8,
      });
      store.createMemory('consensus1', MemoryType.EXPERT_CONSENSUS, {
        importance_score: 0.9,
      });
      store.createMemory('episodic1', MemoryType.EPISODIC, { importance_score: 0.7 });

      // Search for both new types
      const results = store.searchMemories(
        {
          type: [MemoryType.REFINEMENT_TRACE, MemoryType.EXPERT_CONSENSUS],
          min_importance: 0.75,
        },
        10
      );

      expect(results).toHaveLength(2);
      const types = results.map((r) => r.type);
      expect(types).toContain(MemoryType.REFINEMENT_TRACE);
      expect(types).toContain(MemoryType.EXPERT_CONSENSUS);
    });
  });

  describe('Persistence', () => {
    test('should persist new memory types to file', () => {
      const mem1 = store.createMemory('trace', MemoryType.REFINEMENT_TRACE, {});
      const mem2 = store.createMemory('consensus', MemoryType.EXPERT_CONSENSUS, {});

      // Create a new store instance (simulates restart)
      const newStore = new FileStore(testDataDir);

      const retrieved1 = newStore.getMemory(mem1.id);
      const retrieved2 = newStore.getMemory(mem2.id);

      expect(retrieved1?.type).toBe(MemoryType.REFINEMENT_TRACE);
      expect(retrieved2?.type).toBe(MemoryType.EXPERT_CONSENSUS);
    });

    test('should restore stats correctly after reload', () => {
      store.createMemory('trace1', MemoryType.REFINEMENT_TRACE, {});
      store.createMemory('trace2', MemoryType.REFINEMENT_TRACE, {});
      store.createMemory('consensus1', MemoryType.EXPERT_CONSENSUS, {});

      // Reload from file
      const newStore = new FileStore(testDataDir);
      const stats = newStore.getStats();

      expect(stats.by_type.refinement_trace).toBe(2);
      expect(stats.by_type.expert_consensus).toBe(1);
      expect(stats.total).toBe(3);
    });
  });
});
