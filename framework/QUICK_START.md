# Claude Swarm Framework - Quick Start Guide

A comprehensive framework for multi-agent coordination with built-in memory, validation, and skill management.

## Prerequisites

- Node.js 18+
- TypeScript (via tsx)
- Claude Code CLI

```bash
# Install tsx for running TypeScript
npm install -g tsx
```

## Directory Structure

```
framework/
├── memory/              # Persistent agent memory
│   ├── memory-store.ts  # Core memory API
│   └── memory-benchmark.ts
├── validation/          # Anti-fabrication validation
│   ├── validator.ts     # Validation engine (5 rules)
│   ├── test-suite.ts    # 24 validation tests
│   └── integration-test.ts
├── skills/              # Agent capability registry
│   ├── SKILL_CATALOG.md # 9+ available skills
│   └── skill-registry.json
└── bootstrap/           # Agent initialization
    ├── bootstrap-loader.ts
    └── bootstrap-config.json
```

## 1. Memory System

Store and query persistent memories across agent sessions.

### Store a Memory

```bash
npx tsx framework/memory/memory-store.ts store semantic "API rate limit is 100 req/min" "api-patterns"
```

### Query Memories

```bash
npx tsx framework/memory/memory-store.ts query semantic api-patterns
```

### Memory Types

| Type | Purpose | Storage |
|------|---------|---------|
| `episodic` | Event logs, what happened | `{date}.json` |
| `semantic` | Knowledge, facts, patterns | `{topic}.json` |
| `working` | Session state, scratch space | `{agent_id}.json` |

### Memory Statistics

```bash
npx tsx framework/memory/memory-store.ts stats
```

### Memory Cleanup

Run default cleanup policies (30 days episodic, 1 day working, 1000 entries semantic):

```bash
npx tsx framework/memory/memory-store.ts cleanup
```

Run custom cleanup policy:

```bash
# Clean working memory older than 7 days
npx tsx framework/memory/memory-store.ts cleanup-policy working 7

# Keep only 100 most recent semantic entries
npx tsx framework/memory/memory-store.ts cleanup-policy semantic 0 100
```

### Programmatic Usage

```typescript
import {
  storeMemory, queryMemory, summarizeMemories,
  getMemoryStats, runCleanup, applyRetentionPolicy
} from './memory/memory-store';

// Store
storeMemory({
  type: 'semantic',
  content: 'Important finding about X',
  metadata: { topic: 'research', tags: ['important'] }
});

// Query
const memories = queryMemory({
  type: 'semantic',
  topic: 'research',
  limit: 10
});

// Summarize for context injection
const summary = summarizeMemories({ topic: 'research' }, 2000);

// Get statistics
const stats = getMemoryStats();
console.log(`Total entries: ${stats.totalEntries}`);

// Run cleanup with custom policies
const results = runCleanup([
  { type: 'episodic', maxAgeDays: 7 },
  { type: 'working', maxAgeDays: 1 }
]);
```

## 2. Validation System

Enforce anti-fabrication protocols from CLAUDE.md.

### Validate Content

```bash
npx tsx framework/validation/validator.ts "This is an exceptional 95% accurate solution!"
```

Output:
```
=== Validation Report ===

Passed: false
Errors: 1
Warnings: 1

[ERROR] no-superlatives
  Banned superlative "exceptional" found. Use objective language instead.

[WARNING] no-fabricated-scores
  Score "95%" appears without measurement evidence. Add source or methodology.
```

### Run Test Suite

```bash
npx tsx framework/validation/test-suite.ts
```

Expected: `24/24 tests passed`

### Run Integration Tests

```bash
npx tsx framework/validation/integration-test.ts
```

Expected: `6/6 tests passed`

### Validation Rules

| Rule | Severity | Purpose |
|------|----------|---------|
| **no-superlatives** | error | Blocks: exceptional, outstanding, world-class, etc. |
| **no-fabricated-scores** | warning | Requires evidence for percentages/ratings |
| **requires-uncertainty** | warning | Flags absolute claims (always, never, 100%) |
| **evidence-required** | warning | Citations needed for "studies show", "research indicates" |
| **citation-format** | info | Validates citation formats ([Author, Year], [1], DOIs, URLs) |

### Programmatic Usage

```typescript
import { validate, validateAndSuggest } from './validation/validator';

const report = validate(content);
if (!report.passed) {
  console.log('Validation failed:', report.results);
}

// Get suggestions for fixing issues
const { report, suggestions } = validateAndSuggest(content);
```

## 3. Bootstrap System

Initialize agents with memory context and skills.

### Discover Available Skills

```bash
npx tsx framework/bootstrap/bootstrap-loader.ts discover
```

### Generate Bootstrap Prompt

```bash
npx tsx framework/bootstrap/bootstrap-loader.ts test
```

### Programmatic Usage

```typescript
import { buildBootstrapPrompt, loadConfig } from './bootstrap/bootstrap-loader';

const prompt = buildBootstrapPrompt({
  role: 'researcher',
  requestId: 'req-123',
  task: {
    objective: 'Research topic X',
    context: { domain: 'AI safety' },
    requirements: ['Find peer-reviewed sources', 'No fabrication']
  }
});
```

## 4. Running Benchmarks

### Validation Benchmark

```bash
npx tsx framework/validation/benchmark.ts
```

Measures validation throughput across 8 scenarios.

### Memory Benchmark

```bash
npx tsx framework/memory/memory-benchmark.ts
```

Measures store/query performance across 12 scenarios.

## 5. Spawning Child Agents

Create a JSON file in `.swarm/requests/`:

```bash
cat > .swarm/requests/researcher-$(date +%s).json << 'EOF'
{
  "agentRole": "researcher",
  "parentRequestId": "req-parent-123",
  "task": {
    "objective": "Research multi-agent coordination patterns",
    "context": { "domain": "distributed systems" },
    "requirements": [
      "Find academic sources",
      "Follow anti-fabrication protocols",
      "Store findings in semantic memory"
    ]
  }
}
EOF
```

## 6. Configuration

### Bootstrap Config (`bootstrap/bootstrap-config.json`)

```json
{
  "memory_injection": {
    "enabled": true,
    "max_tokens": 2000,
    "topics": ["mission", "recent_findings"]
  },
  "skills_injection": {
    "always_load": ["memory", "validation"],
    "role_based": {
      "researcher": ["research", "synthesis"]
    }
  },
  "constraints": {
    "anti_fabrication": true
  }
}
```

## 7. Quick Commands Reference

| Task | Command |
|------|---------|
| Store memory | `npx tsx framework/memory/memory-store.ts store <type> <content> <topic>` |
| Query memory | `npx tsx framework/memory/memory-store.ts query <type> <topic>` |
| Memory stats | `npx tsx framework/memory/memory-store.ts stats` |
| Run cleanup | `npx tsx framework/memory/memory-store.ts cleanup` |
| Validate text | `npx tsx framework/validation/validator.ts "<text>"` |
| Run validation tests | `npx tsx framework/validation/test-suite.ts` |
| Run integration tests | `npx tsx framework/validation/integration-test.ts` |
| Run validation benchmark | `npx tsx framework/validation/benchmark.ts` |
| Run memory benchmark | `npx tsx framework/memory/memory-benchmark.ts` |
| Discover skills | `npx tsx framework/bootstrap/bootstrap-loader.ts discover` |
| Test bootstrap | `npx tsx framework/bootstrap/bootstrap-loader.ts test` |

## 8. Performance Expectations

Based on measured benchmarks:

| Component | Throughput | Notes |
|-----------|------------|-------|
| Validation | ~94,000 ops/sec | In-memory regex operations |
| Memory Store | ~5,300 ops/sec | File I/O per operation |
| Memory Query | ~677 ops/sec | Scans all files in type directory |

## 9. Anti-Fabrication Compliance

All agents must follow CLAUDE.md protocols:

1. **No fabricated scores** - Every metric needs measurement data
2. **No superlatives** - Use objective language
3. **Evidence required** - Claims need citations
4. **Express uncertainty** - Acknowledge limitations

The validation system automatically checks content against these rules.

## 10. Troubleshooting

### ESM Module Issues

All TypeScript files use ES modules. Ensure:
- `package.json` has `"type": "module"`
- Use `import.meta.url` not `__dirname`
- Run with `npx tsx` not `node`

### Memory Path Issues

Default memory path: `.swarm/memory/`

Override with environment variable:
```bash
MEMORY_PATH=/custom/path npx tsx framework/memory/memory-store.ts ...
```

### Validation False Positives

If validation flags legitimate content:
1. Add evidence context within 100 characters of scores
2. Include keywords: "measured", "calculated", "based on", "according to"
3. Add URLs or citations near claims

---

*Quick Start Guide - Updated by Generation 14 Mission Coordinator*
