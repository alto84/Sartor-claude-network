/**
 * Unit tests for memory summarizer
 */

import { summarizeMemoriesForAgent, formatSummaryForPrompt } from './memory-summarizer';
import { storeMemory, clearCache, queryMemory } from '../memory/memory-store';

describe('Memory Summarizer', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
  });

  describe('summarizeMemoriesForAgent', () => {
    it('should classify proven facts correctly', async () => {
      // Store a verified fact
      storeMemory({
        type: 'semantic',
        content: 'Verified: The memory store supports caching with TTL.',
        metadata: {
          timestamp: new Date().toISOString(),
          topic: 'memory',
          tags: ['verified'],
        },
      });

      const summary = await summarizeMemoriesForAgent({
        role: 'implementer',
        taskKeywords: ['memory'],
        maxTokens: 1000,
        prioritizeRecent: true,
      });

      expect(summary.provenFacts.length).toBeGreaterThan(0);
    });

    it('should classify hypotheses correctly', async () => {
      storeMemory({
        type: 'semantic',
        content: 'The module might need ESM configuration updates.',
        metadata: {
          timestamp: new Date().toISOString(),
          topic: 'typescript',
          tags: ['hypothesis'],
        },
      });

      const summary = await summarizeMemoriesForAgent({
        role: 'implementer',
        taskKeywords: ['typescript'],
        maxTokens: 1000,
        prioritizeRecent: true,
      });

      expect(summary.hypotheses.length).toBeGreaterThan(0);
    });

    it('should identify knowledge gaps', async () => {
      storeMemory({
        type: 'semantic',
        content: 'Unknown: Need to investigate the best approach for embeddings.',
        metadata: {
          timestamp: new Date().toISOString(),
          topic: 'research',
          tags: ['gap'],
        },
      });

      const summary = await summarizeMemoriesForAgent({
        role: 'researcher',
        taskKeywords: ['embeddings', 'research'],
        maxTokens: 1000,
        prioritizeRecent: true,
      });

      expect(summary.knownGaps.length).toBeGreaterThan(0);
    });

    it('should extract related agents', async () => {
      storeMemory({
        type: 'episodic',
        content: 'Completed implementation of feature X.',
        metadata: {
          timestamp: new Date().toISOString(),
          agent_id: 'implementer-001',
        },
      });

      const summary = await summarizeMemoriesForAgent({
        role: 'implementer',
        taskKeywords: ['implementation'],
        maxTokens: 1000,
        prioritizeRecent: true,
      });

      expect(summary.relatedAgents).toContain('implementer-001');
    });

    it('should respect token budget', async () => {
      // Store many memories
      for (let i = 0; i < 50; i++) {
        storeMemory({
          type: 'semantic',
          content: `Test memory ${i} with lots of content to consume tokens. This is a longer piece of text to ensure we test token budgeting properly.`,
          metadata: {
            timestamp: new Date().toISOString(),
            topic: 'test',
          },
        });
      }

      const summary = await summarizeMemoriesForAgent({
        role: 'tester',
        taskKeywords: ['test'],
        maxTokens: 500, // Small budget
        prioritizeRecent: false,
      });

      // Should have results but not all 50 memories
      const totalItems = summary.provenFacts.length +
        summary.hypotheses.length +
        summary.knownGaps.length;

      expect(totalItems).toBeLessThan(50);
      expect(totalItems).toBeGreaterThan(0);
    });

    it('should prioritize recent findings when enabled', async () => {
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 2 days ago
      const recentDate = new Date().toISOString();

      storeMemory({
        type: 'semantic',
        content: 'Old finding from 2 days ago.',
        metadata: {
          timestamp: oldDate,
          topic: 'test',
        },
      });

      storeMemory({
        type: 'semantic',
        content: 'Recent finding from today.',
        metadata: {
          timestamp: recentDate,
          topic: 'test',
        },
      });

      const summary = await summarizeMemoriesForAgent({
        role: 'tester',
        taskKeywords: ['finding'],
        maxTokens: 1000,
        prioritizeRecent: true,
      });

      // Recent findings should include the recent one
      expect(summary.recentFindings).toContain('Recent finding from today.');
    });
  });

  describe('formatSummaryForPrompt', () => {
    it('should format empty summary correctly', () => {
      const summary = {
        provenFacts: [],
        hypotheses: [],
        knownGaps: [],
        recentFindings: [],
        relatedAgents: [],
      };

      const formatted = formatSummaryForPrompt(summary);

      expect(formatted).toContain('No relevant prior knowledge found');
    });

    it('should format populated summary with all sections', () => {
      const summary = {
        provenFacts: ['Fact 1', 'Fact 2'],
        hypotheses: ['Hypothesis 1'],
        knownGaps: ['Gap 1'],
        recentFindings: ['Recent 1'],
        relatedAgents: ['agent-1', 'agent-2'],
      };

      const formatted = formatSummaryForPrompt(summary);

      expect(formatted).toContain('Proven Facts');
      expect(formatted).toContain('Working Hypotheses');
      expect(formatted).toContain('Known Knowledge Gaps');
      expect(formatted).toContain('Recent Findings');
      expect(formatted).toContain('Related Agents');
      expect(formatted).toContain('agent-1');
      expect(formatted).toContain('agent-2');
    });

    it('should use bullet points for items', () => {
      const summary = {
        provenFacts: ['Fact 1'],
        hypotheses: [],
        knownGaps: [],
        recentFindings: [],
        relatedAgents: [],
      };

      const formatted = formatSummaryForPrompt(summary);

      expect(formatted).toContain('- Fact 1');
    });
  });
});
