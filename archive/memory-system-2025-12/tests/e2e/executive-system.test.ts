/**
 * End-to-End Test: Executive System
 * Tests the full refinement → memory → learning loop
 */

import { ExecutiveClaude, AgentRole, createExecutive } from '../../src/executive';
import { MemorySystem } from '../../src/memory/memory-system';

describe('Executive System E2E', () => {
  let executive: ExecutiveClaude;

  beforeEach(() => {
    executive = createExecutive();
  });

  describe('Task Delegation', () => {
    it('should delegate and complete a single task', async () => {
      const result = await executive.delegateTask({
        id: 'task-1',
        role: AgentRole.IMPLEMENTER,
        description: 'Test task',
        context: 'Unit test context',
      });

      expect(result.success).toBe(true);
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('should orchestrate multiple tasks in role order', async () => {
      const tasks = [
        { id: 't1', role: AgentRole.PLANNER, description: 'Plan', context: '' },
        { id: 't2', role: AgentRole.IMPLEMENTER, description: 'Build', context: '' },
        { id: 't3', role: AgentRole.AUDITOR, description: 'Review', context: '' },
        { id: 't4', role: AgentRole.CLEANER, description: 'Clean', context: '' },
      ];

      const results = await executive.orchestrate(tasks);

      expect(results).toHaveLength(4);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('Learning from History', () => {
    it('should retrieve learned patterns', async () => {
      // First create some tasks to learn from
      await executive.delegateTask({
        id: 'learn-1',
        role: AgentRole.IMPLEMENTER,
        description: 'Learning task 1',
        context: '',
      });

      const patterns = await executive.learnFromHistory();
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe('Active Task Tracking', () => {
    it('should track active tasks', () => {
      expect(executive.getActiveTaskCount()).toBe(0);
    });
  });
});
