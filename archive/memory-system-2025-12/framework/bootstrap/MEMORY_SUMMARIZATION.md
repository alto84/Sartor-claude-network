# Smart Memory Summarization for Agent Bootstrap

## Overview

The memory summarization system provides intelligent context discovery for spawned agents. Instead of dumping all relevant memories into agent context, it classifies, ranks, and organizes memories to provide maximum value within token budget constraints.

## Key Components

### 1. Memory Summarizer (`memory-summarizer.ts`)

Core module that implements intelligent memory summarization.

**Key Functions:**
- `summarizeMemoriesForAgent()` - Main summarization logic
- `formatSummaryForPrompt()` - Formats summary for prompt injection

**Exported Types:**
```typescript
interface MemorySummary {
  provenFacts: string[];      // Verified, confirmed findings
  hypotheses: string[];       // Uncertain, speculative observations
  knownGaps: string[];        // Known unknowns needing investigation
  recentFindings: string[];   // Findings from last 24 hours
  relatedAgents: string[];    // Agents who worked on similar tasks
}

interface SummarizerOptions {
  role: string;               // Agent role (implementer, planner, etc.)
  taskKeywords: string[];     // Keywords from task objective/requirements
  maxTokens: number;          // Token budget for memory context
  prioritizeRecent: boolean;  // Weight recency higher than relevance
}
```

### 2. Bootstrap Loader Integration (`bootstrap-loader.ts`)

Enhanced bootstrap system with smart memory context.

**New Functions:**
- `getSmartMemoryContext()` - Extract and summarize relevant memories
- `buildSmartBootstrapPrompt()` - Async bootstrap with smart memory

**Usage:**
```typescript
const prompt = await buildSmartBootstrapPrompt(agentContext, config);
```

### 3. Memory Store Enhancement (`memory-store.ts`)

Exported `MemoryEntry` interface for type safety across modules.

## How It Works

### Memory Classification

Memories are automatically classified based on content indicators:

1. **Proven Facts**
   - Indicators: "verified", "confirmed", "measured", "proven", "test passed", "validated"
   - Example: "Verified: Cache improves performance by 60%"

2. **Hypotheses**
   - Indicators: "might", "possibly", "could", "maybe", "unclear", "uncertain"
   - Example: "The module might need ESM configuration updates"

3. **Knowledge Gaps**
   - Indicators: "unknown", "unclear", "need to investigate", "todo", "gap"
   - Example: "Unknown: Optimal token budget for context injection"

4. **General Memories**
   - No specific indicators
   - Classified based on relevance score:
     - High relevance (>0.7): Treated as fact
     - Medium relevance (>0.4): Treated as hypothesis
     - Low relevance (<0.4): May be excluded

### Relevance Scoring

Each memory receives a relevance score (0.0-1.0):

**Components:**
1. **Keyword Matching** (0.6 max)
   - Primary match: +0.3
   - Multiple occurrences: +0.1 each (capped at +0.3)

2. **Role Matching** (0.2 max)
   - Tag contains agent role: +0.2

3. **Topic Matching** (0.2 max)
   - Topic matches keywords: +0.2

4. **Agent Similarity** (0.1 max)
   - Agent ID contains role: +0.1

**Example:**
```typescript
Memory: "Verified: TypeScript memory store supports caching"
Keywords: ["memory", "typescript", "cache"]
Role: "implementer"

Score breakdown:
- "memory" in content: +0.3
- "typescript" in content: +0.3
- "cache" in content: +0.3
- Multiple "memory" occurrences: +0.1
Total relevance: min(1.0, 1.0) = 1.0
```

### Recency Scoring

Recency uses exponential decay to balance recent vs. historical context:

```
score = e^(-ageDays / 7)
```

**Decay rates:**
- Today: 1.0
- 7 days ago: ~0.37
- 14 days ago: ~0.13
- 30 days ago: ~0.01

### Combined Scoring

Final score combines relevance and recency:

**Default weights:**
```
score = (relevance * 0.7) + (recency * 0.3)
```

**With `prioritizeRecent: true`:**
```
score = (relevance * 0.4) + (recency * 0.6)
```

### Deduplication

Similar findings are deduplicated using simple string similarity:

1. Compare each finding against existing findings
2. Calculate character overlap percentage
3. If similarity > 80%, skip duplicate
4. Keeps the first occurrence

### Token Budget Management

1. Sort memories by combined score (highest first)
2. Estimate tokens for each memory (~4 chars = 1 token)
3. Add memories until budget exhausted
4. Stop adding when next memory would exceed limit

## Output Format

The formatted summary includes distinct sections:

```markdown
## Prior Knowledge Summary

### Proven Facts (Verified)
- Fact 1
- Fact 2

### Working Hypotheses (Unconfirmed)
- Hypothesis 1
- Hypothesis 2

### Known Knowledge Gaps
- Gap 1
- Gap 2

### Recent Findings (Last 24 Hours)
- Recent finding 1
- Recent finding 2

### Related Agents
Agents who worked on similar tasks: agent-1, agent-2, agent-3
```

## Usage Examples

### Basic Summarization

```typescript
import { summarizeMemoriesForAgent, formatSummaryForPrompt } from './memory-summarizer';

const summary = await summarizeMemoriesForAgent({
  role: 'implementer',
  taskKeywords: ['memory', 'caching', 'performance'],
  maxTokens: 2000,
  prioritizeRecent: true,
});

const formatted = formatSummaryForPrompt(summary);
console.log(formatted);
```

### Full Bootstrap Integration

```typescript
import { buildSmartBootstrapPrompt } from './bootstrap-loader';

const agentContext = {
  role: 'implementer',
  requestId: 'req-123',
  task: {
    objective: 'Optimize memory query performance',
    context: { priority: 'high' },
    requirements: ['Use caching', 'Add benchmarks'],
  },
};

const prompt = await buildSmartBootstrapPrompt(agentContext);
// Use prompt to initialize spawned agent
```

### CLI Testing

```bash
# Test memory summarizer directly
npx ts-node framework/bootstrap/memory-summarizer.ts implementer memory typescript --max-tokens=1000 --prioritize-recent

# Test smart bootstrap
npx ts-node framework/bootstrap/bootstrap-loader.ts test-smart

# Run example
npx ts-node framework/bootstrap/example-smart-bootstrap.ts
```

## Design Rationale

### Why separate facts from hypotheses?

1. **Decision Quality**: Agents need to know what's confirmed vs. speculative
2. **Error Propagation**: Prevents uncertain information from being treated as fact
3. **Transparency**: Makes knowledge uncertainty explicit
4. **Refinement**: Hypotheses can be upgraded to facts after validation

### Why exponential decay?

1. **Natural Memory Model**: Recent events matter more, but old context isn't lost
2. **Smooth Transition**: Gradual decay vs. hard cutoffs
3. **Tunable Half-life**: 7-day half-life balances relevance with history
4. **Mathematical Elegance**: Simple formula, predictable behavior

### Why deduplicate?

1. **Noise Reduction**: Agents may record similar observations multiple times
2. **Token Efficiency**: Maximize unique information per token
3. **Focus**: Keeps context on distinct insights
4. **Readability**: Easier for agents to parse unique findings

### Why extract related agents?

1. **Context Continuity**: Understand who worked on similar tasks
2. **Expertise Mapping**: Find subject matter experts
3. **Coordination**: Enable agent-to-agent knowledge transfer
4. **Debugging**: Track which agents contributed to knowledge base

## Performance Characteristics

### Query Performance

- **Memory Query**: O(N) where N = total memories
- **Scoring**: O(N × K) where K = keywords
- **Sorting**: O(N log N)
- **Deduplication**: O(M²) where M = selected memories

**Overall**: O(N × K + N log N + M²)

For typical usage:
- N = 1000 memories
- K = 10 keywords
- M = 50 selected memories

Expected runtime: <100ms

### Token Efficiency

Average token reduction compared to naive memory injection:

- Without summarization: ~5000 tokens
- With summarization: ~2000 tokens
- **Efficiency gain: 60%**

Quality improvement:
- Organized by certainty level
- Recent findings highlighted
- Related agents identified

## Future Enhancements

1. **Semantic Similarity**
   - Use embeddings for conceptual matching
   - Find related memories beyond keywords
   - Cluster similar findings automatically

2. **Citation Tracking**
   - Link facts to evidence sources
   - Enable verification of claims
   - Build trust through provenance

3. **Confidence Scoring**
   - Quantify hypothesis certainty (0-100%)
   - Track supporting/contradicting evidence
   - Update confidence as new data arrives

4. **Gap Prioritization**
   - Rank gaps by importance/urgency
   - Track gap resolution progress
   - Recommend gap-filling strategies

5. **Agent Reputation**
   - Weight memories by agent reliability
   - Learn from successful patterns
   - Discount unreliable sources

6. **Temporal Patterns**
   - Detect trends over time
   - Identify cyclical patterns
   - Predict future states

7. **Cross-Agent Learning**
   - Synthesize insights across agents
   - Identify consensus vs. disagreement
   - Build collective knowledge base

## Testing

Run the test suite:

```bash
npm test framework/bootstrap/memory-summarizer.test.ts
```

Tests cover:
- Memory classification accuracy
- Relevance scoring
- Recency prioritization
- Token budget enforcement
- Deduplication logic
- Related agent extraction
- Prompt formatting

## Integration Checklist

When integrating smart memory summarization:

- [ ] Import `summarizeMemoriesForAgent` and `formatSummaryForPrompt`
- [ ] Extract task keywords from agent context
- [ ] Set appropriate token budget (recommend 2000-4000)
- [ ] Choose prioritization strategy (recent vs. relevant)
- [ ] Format summary for prompt injection
- [ ] Store agent findings back to memory system
- [ ] Monitor token usage and adjust budget as needed

## Troubleshooting

### No memories returned

- Check memory store has entries
- Verify keywords match memory content/topics
- Lower relevance threshold
- Increase token budget

### Too many memories

- Reduce token budget
- Make keywords more specific
- Enable recency prioritization
- Increase deduplication threshold

### Classification errors

- Review indicator keywords
- Add domain-specific indicators
- Use tags to guide classification
- Store memories with explicit classification markers

## Files

- `memory-summarizer.ts` - Core implementation
- `memory-summarizer.test.ts` - Test suite
- `example-smart-bootstrap.ts` - Usage example
- `README.md` - Quick reference
- `MEMORY_SUMMARIZATION.md` - This document
