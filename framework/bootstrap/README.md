# Bootstrap Framework

## Purpose
Orient new agents with mission context, skills, and memory, enabling:
- Consistent agent initialization
- Mission alignment
- Capability awareness

## Architecture

### Bootstrap Process

```
New Agent Spawn
      │
      ▼
┌─────────────────┐
│ Load Bootstrap  │
│ Configuration   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Inject Memory   │
│ Context         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load Required   │
│ Skills          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Inject Mission  │
│ Context         │
└────────┬────────┘
         │
         ▼
   Agent Ready
```

### Bootstrap Configuration

```json
{
  "bootstrap": {
    "memory": {
      "inject_relevant": true,
      "max_context_tokens": 2000,
      "topics": ["mission", "recent_findings"]
    },
    "skills": {
      "required": ["validation", "research"],
      "optional": ["memory-query"]
    },
    "mission": {
      "objective": "...",
      "constraints": ["..."],
      "success_criteria": ["..."]
    }
  }
}
```

### Bootstrap Prompt Template

```markdown
# Agent Bootstrap

## Mission Context
{mission_objective}

## Current State
{memory_summary}

## Available Skills
{skill_list}

## Your Role
{agent_role}

## Constraints
{constraints}

## Success Criteria
{success_criteria}
```

### Integration with Coordinator

The coordinator injects bootstrap context into agent prompts:
1. Read bootstrap config
2. Query relevant memory
3. Load skill descriptions
4. Build full agent prompt

## Files

- `bootstrap-config.json` - Default configuration
- `bootstrap-loader.ts` - Bootstrap injection
- `memory-summarizer.ts` - Smart memory summarization
- `templates/` - Prompt templates
- `BOOTSTRAP_SKILL.md` - Self-bootstrap capability

## Smart Memory Summarization

The memory summarizer provides intelligent context discovery for agent bootstrap.

### Key Features

1. **Memory Classification**
   - **Facts**: Verified, confirmed, measured findings
   - **Hypotheses**: Uncertain, speculative observations
   - **Gaps**: Known unknowns that need investigation

2. **Relevance Scoring**
   - Keyword matching (0.6 weight)
   - Role matching (0.2 weight)
   - Topic matching (0.2 weight)
   - Agent similarity (0.1 weight)

3. **Recency Prioritization**
   - Exponential decay scoring (7-day half-life)
   - Highlights findings from last 24 hours
   - Balances recent vs. historical context

4. **Token Budget Management**
   - Respects context limits
   - Prioritizes highest-scored memories
   - Deduplicates similar findings

### Usage

```typescript
import { summarizeMemoriesForAgent, formatSummaryForPrompt } from './memory-summarizer';

// Summarize memories for an agent
const summary = await summarizeMemoriesForAgent({
  role: 'implementer',
  taskKeywords: ['memory', 'typescript', 'api'],
  maxTokens: 2000,
  prioritizeRecent: true,
});

// Format for prompt injection
const formatted = formatSummaryForPrompt(summary);
```

### Smart Bootstrap

Use `buildSmartBootstrapPrompt()` for async bootstrap with intelligent memory context:

```typescript
import { buildSmartBootstrapPrompt } from './bootstrap-loader';

const prompt = await buildSmartBootstrapPrompt({
  role: 'implementer',
  requestId: 'req-123',
  task: {
    objective: 'Implement feature X',
    context: { priority: 'high' },
    requirements: ['Use TypeScript', 'Add tests'],
  },
});
```

### CLI Testing

```bash
# Test smart bootstrap
npx ts-node framework/bootstrap/bootstrap-loader.ts test-smart

# Test memory summarizer directly
npx ts-node framework/bootstrap/memory-summarizer.ts implementer memory typescript --max-tokens=1000
```

### Classification Indicators

| Category | Indicators |
|----------|-----------|
| **Facts** | verified, confirmed, measured, proven, test passed, validated |
| **Hypotheses** | might, possibly, could, maybe, unclear, uncertain, hypothesis |
| **Gaps** | unknown, unclear, need to investigate, todo, gap, missing |

### Scoring Formula

**Relevance + Recency Combined:**
```
score = (relevance * 0.7) + (recency * 0.3)
```

**With `prioritizeRecent: true`:**
```
score = (relevance * 0.4) + (recency * 0.6)
```

**Recency Decay:**
```
score = e^(-ageDays / 7)
```
