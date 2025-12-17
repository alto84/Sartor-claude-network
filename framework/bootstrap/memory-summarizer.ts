/**
 * Memory Summarizer - Smart memory summarization for agent bootstrap
 *
 * Provides intelligent context discovery and summarization for spawned agents.
 * Separates proven facts from hypotheses, identifies knowledge gaps, and ranks by relevance.
 */

import { queryMemory, type MemoryEntry, type QueryFilter } from '../memory/memory-store.js';

// Types
export interface MemorySummary {
  provenFacts: string[];      // Things we know are true
  hypotheses: string[];       // Things we think might be true
  knownGaps: string[];        // Things we know we don't know
  recentFindings: string[];   // From last 24 hours
  relatedAgents: string[];    // Agents who worked on similar tasks
}

export interface SummarizerOptions {
  role: string;
  taskKeywords: string[];
  maxTokens: number;
  prioritizeRecent: boolean;
}

interface ScoredMemory {
  entry: MemoryEntry;
  relevanceScore: number;
  recencyScore: number;
  combinedScore: number;
}

// Constants for scoring
const RECENCY_WEIGHT = 0.3;
const RELEVANCE_WEIGHT = 0.7;
const FACT_INDICATORS = ['verified', 'confirmed', 'measured', 'proven', 'test passed', 'validated'];
const HYPOTHESIS_INDICATORS = ['might', 'possibly', 'could', 'maybe', 'unclear', 'uncertain', 'hypothesis'];
const GAP_INDICATORS = ['unknown', 'unclear', 'need to investigate', 'todo', 'gap', 'missing'];
const RECENT_HOURS = 24;

/**
 * Calculate relevance score based on keyword matching
 */
function calculateRelevanceScore(entry: MemoryEntry, keywords: string[], role: string): number {
  const content = entry.content.toLowerCase();
  const metadata = entry.metadata;
  let score = 0;

  // Keyword matching in content (primary signal)
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    if (content.includes(keywordLower)) {
      score += 0.3;
      // Bonus for multiple occurrences
      const occurrences = (content.match(new RegExp(keywordLower, 'g')) || []).length;
      score += Math.min(occurrences * 0.1, 0.3);
    }
  }

  // Role matching in tags
  if (metadata.tags?.some(tag => tag.toLowerCase().includes(role.toLowerCase()))) {
    score += 0.2;
  }

  // Topic matching
  if (metadata.topic) {
    const topicLower = metadata.topic.toLowerCase();
    for (const keyword of keywords) {
      if (topicLower.includes(keyword.toLowerCase())) {
        score += 0.2;
        break;
      }
    }
  }

  // Agent ID similarity (same agent type or related agents)
  if (metadata.agent_id?.toLowerCase().includes(role.toLowerCase())) {
    score += 0.1;
  }

  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Calculate recency score (exponential decay)
 */
function calculateRecencyScore(timestamp: string): number {
  const memoryTime = new Date(timestamp).getTime();
  const now = Date.now();
  const ageMs = now - memoryTime;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  // Exponential decay: score = e^(-ageDays/7)
  // After 7 days, score is ~0.37
  // After 30 days, score is ~0.01
  return Math.exp(-ageDays / 7);
}

/**
 * Classify memory as fact, hypothesis, or gap
 */
function classifyMemory(content: string): 'fact' | 'hypothesis' | 'gap' | 'general' {
  const contentLower = content.toLowerCase();

  // Check for gap indicators first (highest priority)
  if (GAP_INDICATORS.some(indicator => contentLower.includes(indicator))) {
    return 'gap';
  }

  // Check for fact indicators
  if (FACT_INDICATORS.some(indicator => contentLower.includes(indicator))) {
    return 'fact';
  }

  // Check for hypothesis indicators
  if (HYPOTHESIS_INDICATORS.some(indicator => contentLower.includes(indicator))) {
    return 'hypothesis';
  }

  return 'general';
}

/**
 * Deduplicate similar findings using simple string similarity
 */
function deduplicateFindings(findings: string[]): string[] {
  const deduplicated: string[] = [];

  for (const finding of findings) {
    const findingLower = finding.toLowerCase();
    const isDuplicate = deduplicated.some(existing => {
      const existingLower = existing.toLowerCase();
      // Simple similarity check: 80% character overlap
      const overlap = [...findingLower].filter(char => existingLower.includes(char)).length;
      const similarity = overlap / Math.max(findingLower.length, existingLower.length);
      return similarity > 0.8;
    });

    if (!isDuplicate) {
      deduplicated.push(finding);
    }
  }

  return deduplicated;
}

/**
 * Extract related agents from memories
 */
function extractRelatedAgents(memories: ScoredMemory[]): string[] {
  const agentSet = new Set<string>();

  for (const { entry } of memories) {
    if (entry.metadata.agent_id) {
      agentSet.add(entry.metadata.agent_id);
    }
  }

  return Array.from(agentSet);
}

/**
 * Filter recent findings (last 24 hours)
 */
function filterRecentFindings(memories: ScoredMemory[]): string[] {
  const cutoffTime = Date.now() - (RECENT_HOURS * 60 * 60 * 1000);
  const recent: string[] = [];

  for (const { entry } of memories) {
    const timestamp = new Date(entry.metadata.timestamp).getTime();
    if (timestamp >= cutoffTime) {
      recent.push(entry.content);
    }
  }

  return deduplicateFindings(recent);
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Summarize memories for agent context injection
 */
export async function summarizeMemoriesForAgent(options: SummarizerOptions): Promise<MemorySummary> {
  const { role, taskKeywords, maxTokens, prioritizeRecent } = options;

  // Query all memory types
  const filters: QueryFilter[] = [
    { type: 'semantic', limit: 100 },
    { type: 'episodic', limit: 50 },
  ];

  // Add keyword-based filtering if specific topics exist
  const topicKeywords = taskKeywords.filter(k => k.length > 3); // Filter short keywords
  if (topicKeywords.length > 0) {
    // Search for each keyword
    for (const keyword of topicKeywords.slice(0, 3)) { // Limit to top 3 keywords
      filters.push({ search: keyword, limit: 20 });
    }
  }

  // Collect all memories
  const allMemories: MemoryEntry[] = [];
  for (const filter of filters) {
    const results = queryMemory(filter);
    allMemories.push(...results);
  }

  // Deduplicate by ID
  const uniqueMemories = Array.from(
    new Map(allMemories.map(m => [m.id, m])).values()
  );

  // Score and rank memories
  const scoredMemories: ScoredMemory[] = uniqueMemories.map(entry => {
    const relevanceScore = calculateRelevanceScore(entry, taskKeywords, role);
    const recencyScore = calculateRecencyScore(entry.metadata.timestamp);

    // Adjust weights based on prioritization
    const relevanceWeight = prioritizeRecent ? 0.4 : RELEVANCE_WEIGHT;
    const recencyWeight = prioritizeRecent ? 0.6 : RECENCY_WEIGHT;

    const combinedScore = (relevanceScore * relevanceWeight) + (recencyScore * recencyWeight);

    return {
      entry,
      relevanceScore,
      recencyScore,
      combinedScore,
    };
  });

  // Sort by combined score (highest first)
  scoredMemories.sort((a, b) => b.combinedScore - a.combinedScore);

  // Classify memories and collect findings
  const provenFacts: string[] = [];
  const hypotheses: string[] = [];
  const knownGaps: string[] = [];
  let currentTokens = 0;

  for (const scored of scoredMemories) {
    const content = scored.entry.content;
    const tokens = estimateTokens(content);

    // Stop if we exceed token budget
    if (currentTokens + tokens > maxTokens) {
      break;
    }

    const classification = classifyMemory(content);

    switch (classification) {
      case 'fact':
        provenFacts.push(content);
        break;
      case 'hypothesis':
        hypotheses.push(content);
        break;
      case 'gap':
        knownGaps.push(content);
        break;
      case 'general':
        // Distribute general memories based on relevance score
        if (scored.relevanceScore > 0.7) {
          provenFacts.push(content);
        } else if (scored.relevanceScore > 0.4) {
          hypotheses.push(content);
        }
        break;
    }

    currentTokens += tokens;
  }

  // Extract additional metadata
  const recentFindings = filterRecentFindings(scoredMemories);
  const relatedAgents = extractRelatedAgents(scoredMemories);

  // Deduplicate all categories
  return {
    provenFacts: deduplicateFindings(provenFacts),
    hypotheses: deduplicateFindings(hypotheses),
    knownGaps: deduplicateFindings(knownGaps),
    recentFindings: deduplicateFindings(recentFindings),
    relatedAgents,
  };
}

/**
 * Format summary for prompt injection
 */
export function formatSummaryForPrompt(summary: MemorySummary): string {
  const sections: string[] = [];

  // Header
  sections.push('## Prior Knowledge Summary\n');

  // Proven Facts
  if (summary.provenFacts.length > 0) {
    sections.push('### Proven Facts (Verified)');
    for (const fact of summary.provenFacts) {
      sections.push(`- ${fact}`);
    }
    sections.push('');
  }

  // Hypotheses
  if (summary.hypotheses.length > 0) {
    sections.push('### Working Hypotheses (Unconfirmed)');
    for (const hypothesis of summary.hypotheses) {
      sections.push(`- ${hypothesis}`);
    }
    sections.push('');
  }

  // Known Gaps
  if (summary.knownGaps.length > 0) {
    sections.push('### Known Knowledge Gaps');
    for (const gap of summary.knownGaps) {
      sections.push(`- ${gap}`);
    }
    sections.push('');
  }

  // Recent Findings
  if (summary.recentFindings.length > 0) {
    sections.push('### Recent Findings (Last 24 Hours)');
    for (const finding of summary.recentFindings) {
      sections.push(`- ${finding}`);
    }
    sections.push('');
  }

  // Related Agents
  if (summary.relatedAgents.length > 0) {
    sections.push('### Related Agents');
    sections.push(`Agents who worked on similar tasks: ${summary.relatedAgents.join(', ')}`);
    sections.push('');
  }

  // Footer note
  if (summary.provenFacts.length === 0 &&
      summary.hypotheses.length === 0 &&
      summary.knownGaps.length === 0 &&
      summary.recentFindings.length === 0) {
    sections.push('_No relevant prior knowledge found. Starting fresh._');
  }

  return sections.join('\n');
}

/**
 * CLI interface for testing
 */
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('memory-summarizer.ts');

if (isMainModule) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: memory-summarizer.ts <role> [keywords...] [--max-tokens=N] [--prioritize-recent]');
    console.log('\nExample:');
    console.log('  memory-summarizer.ts implementer api client --max-tokens=1000 --prioritize-recent');
    process.exit(1);
  }

  const role = args[0];
  const keywords: string[] = [];
  let maxTokens = 2000;
  let prioritizeRecent = false;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--max-tokens=')) {
      maxTokens = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--prioritize-recent') {
      prioritizeRecent = true;
    } else {
      keywords.push(arg);
    }
  }

  console.log(`Summarizing memories for role: ${role}`);
  console.log(`Keywords: ${keywords.join(', ')}`);
  console.log(`Max tokens: ${maxTokens}`);
  console.log(`Prioritize recent: ${prioritizeRecent}\n`);

  const summary = await summarizeMemoriesForAgent({
    role,
    taskKeywords: keywords,
    maxTokens,
    prioritizeRecent,
  });

  console.log('=== SUMMARY ===\n');
  console.log(formatSummaryForPrompt(summary));

  console.log('\n=== STATS ===');
  console.log(`Proven Facts: ${summary.provenFacts.length}`);
  console.log(`Hypotheses: ${summary.hypotheses.length}`);
  console.log(`Known Gaps: ${summary.knownGaps.length}`);
  console.log(`Recent Findings: ${summary.recentFindings.length}`);
  console.log(`Related Agents: ${summary.relatedAgents.length}`);
}

export default { summarizeMemoriesForAgent, formatSummaryForPrompt };
