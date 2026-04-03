# Phase 6 Memory Tools Quick Reference

## New Memory Types

### REFINEMENT_TRACE
Tracks iterative refinement loops and their outcomes.

**Use Cases:**
- Recording multi-iteration improvement processes
- Tracking refinement success rates
- Analyzing iteration patterns
- Learning optimal iteration counts

### EXPERT_CONSENSUS
Stores multi-agent voting results and consensus decisions.

**Use Cases:**
- Recording expert panel decisions
- Tracking agreement levels
- Finding similar past decisions
- Analyzing voting patterns

## New MCP Tools

### 1. memory_create_refinement_trace

**Purpose:** Create a structured trace of a refinement loop execution.

**Parameters:**
```json
{
  "task_id": "string (required)",
  "iterations": "number (required)",
  "final_result": "string (required)",
  "success": "boolean (required)",
  "duration_ms": "number (required)"
}
```

**Returns:**
```json
{
  "success": true,
  "trace_id": "mem_1234567890_abc"
}
```

**Example Usage:**
```javascript
const trace = await mcpClient.callTool('memory_create_refinement_trace', {
  task_id: 'implement-feature-x',
  iterations: 3,
  final_result: 'Feature X implemented with validation',
  success: true,
  duration_ms: 4500
});

console.log(`Trace stored: ${trace.trace_id}`);
```

**Auto-Generated Metadata:**
- **Importance Score:** 0.8 if success=true, 0.6 if success=false
- **Tags:**
  - `refinement`
  - `task:{task_id}`
  - `iterations:{iterations}`

**Storage Format:**
```json
{
  "task_id": "implement-feature-x",
  "iterations": 3,
  "final_result": "Feature X implemented with validation",
  "success": true,
  "duration_ms": 4500
}
```

---

### 2. memory_search_expert_consensus

**Purpose:** Search for expert consensus memories with optional filtering.

**Parameters:**
```json
{
  "task_type": "string (optional)",
  "min_agreement": "number (optional, 0-1, default: 0.5)",
  "limit": "number (optional, default: 10)"
}
```

**Returns:**
```json
[
  {
    "id": "mem_1234567890_xyz",
    "content": {
      "task_type": "code_review",
      "votes": [...],
      "consensus_decision": "approve",
      "agreement_level": 0.9
    },
    "agreement": 0.9,
    "created_at": "2025-12-10T22:00:00.000Z"
  }
]
```

**Example Usage:**
```javascript
// Find high-agreement code reviews
const consensus = await mcpClient.callTool('memory_search_expert_consensus', {
  task_type: 'code_review',
  min_agreement: 0.8,
  limit: 5
});

consensus.forEach(c => {
  console.log(`Decision: ${c.content.consensus_decision} (${c.agreement * 100}% agreement)`);
});

// Find all consensus decisions with >70% agreement
const highConsensus = await mcpClient.callTool('memory_search_expert_consensus', {
  min_agreement: 0.7,
  limit: 20
});
```

**Filtering Logic:**
1. Filters by `EXPERT_CONSENSUS` memory type
2. Filters by `min_importance` (maps to agreement level)
3. If `task_type` provided, parses JSON content and filters by task type
4. Returns up to `limit` results

---

## Creating Expert Consensus Memories

Use the generic `memory_create` tool with type `expert_consensus`:

**Example:**
```javascript
const votes = [
  { agent: 'auditor-1', decision: 'approve', confidence: 0.95 },
  { agent: 'auditor-2', decision: 'approve', confidence: 0.85 },
  { agent: 'auditor-3', decision: 'reject', confidence: 0.7 }
];

const agreementLevel = calculateAgreement(votes); // 0.73

const consensusMemory = await mcpClient.callTool('memory_create', {
  content: JSON.stringify({
    task_type: 'security_audit',
    votes: votes,
    consensus_decision: 'approve',
    agreement_level: agreementLevel,
    total_voters: 3,
    timestamp: new Date().toISOString()
  }),
  type: 'expert_consensus',
  importance: agreementLevel,
  tags: [
    'consensus',
    'task:security_audit',
    'decision:approve',
    `voters:${votes.length}`
  ]
});
```

**Recommended JSON Schema:**
```typescript
{
  task_type: string;           // Type of task being voted on
  votes: Array<{               // Individual expert votes
    agent: string;             // Agent ID
    decision: string;          // Their decision
    confidence: number;        // Confidence level (0-1)
    reasoning?: string;        // Optional explanation
  }>;
  consensus_decision: string;  // Final decision
  agreement_level: number;     // Agreement score (0-1)
  total_voters?: number;       // Number of voters
  timestamp?: string;          // When consensus reached
  metadata?: any;              // Additional context
}
```

---

## Integration Patterns

### Refinement Loop Pattern
```typescript
async function executeWithRefinement(task) {
  const startTime = Date.now();
  let iterations = 0;
  let result = null;
  let success = false;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    result = await attemptTask(task);

    if (await validateResult(result)) {
      success = true;
      break;
    }

    result = await refineResult(result);
  }

  const duration = Date.now() - startTime;

  // Record the trace
  await mcpClient.callTool('memory_create_refinement_trace', {
    task_id: task.id,
    iterations,
    final_result: JSON.stringify(result),
    success,
    duration_ms: duration
  });

  return { result, success, iterations };
}
```

### Expert Voting Pattern
```typescript
async function expertVote(task, experts) {
  const votes = await Promise.all(
    experts.map(expert => expert.vote(task))
  );

  const decisions = votes.map(v => v.decision);
  const agreementLevel = calculateAgreement(votes);
  const consensusDecision = majorityDecision(decisions);

  // Store consensus
  await mcpClient.callTool('memory_create', {
    content: JSON.stringify({
      task_type: task.type,
      votes,
      consensus_decision: consensusDecision,
      agreement_level: agreementLevel
    }),
    type: 'expert_consensus',
    importance: agreementLevel,
    tags: [
      'consensus',
      `task:${task.type}`,
      `decision:${consensusDecision}`
    ]
  });

  return { consensusDecision, agreementLevel };
}
```

### Learning from History Pattern
```typescript
async function shouldRefine(task) {
  // Find similar refinement traces
  const traces = await mcpClient.callTool('memory_search', {
    type: 'refinement_trace',
    min_importance: 0.5,
    limit: 100
  });

  // Filter by similar task type
  const similarTraces = traces.filter(t => {
    const content = JSON.parse(t.content);
    return content.task_id.includes(task.category);
  });

  // Calculate average iterations for successful refinements
  const successful = similarTraces.filter(t =>
    JSON.parse(t.content).success
  );

  if (successful.length > 0) {
    const avgIterations = successful.reduce((sum, t) =>
      sum + JSON.parse(t.content).iterations, 0
    ) / successful.length;

    console.log(`Similar tasks typically need ${avgIterations.toFixed(1)} iterations`);
  }
}

async function findSimilarDecisions(taskType) {
  // Find high-agreement decisions for this task type
  const consensus = await mcpClient.callTool('memory_search_expert_consensus', {
    task_type: taskType,
    min_agreement: 0.75,
    limit: 10
  });

  console.log(`Found ${consensus.length} high-confidence precedents:`);
  consensus.forEach(c => {
    console.log(`- ${c.content.consensus_decision} (${c.agreement * 100}% agreement)`);
  });

  return consensus;
}
```

---

## Statistics and Monitoring

### Checking Memory Distribution
```javascript
const stats = await mcpClient.callTool('memory_stats', {});

console.log(`Total memories: ${stats.total}`);
console.log(`Refinement traces: ${stats.by_type.refinement_trace}`);
console.log(`Expert consensus: ${stats.by_type.expert_consensus}`);
```

### Analyzing Refinement Patterns
```javascript
const allTraces = await mcpClient.callTool('memory_search', {
  type: 'refinement_trace',
  limit: 1000
});

const stats = {
  total: allTraces.length,
  successful: 0,
  avgIterations: 0,
  avgDuration: 0
};

allTraces.forEach(trace => {
  const data = JSON.parse(trace.content);
  if (data.success) stats.successful++;
  stats.avgIterations += data.iterations;
  stats.avgDuration += data.duration_ms;
});

stats.avgIterations /= stats.total;
stats.avgDuration /= stats.total;
stats.successRate = (stats.successful / stats.total) * 100;

console.log('Refinement Statistics:', stats);
```

### Analyzing Consensus Patterns
```javascript
const allConsensus = await mcpClient.callTool('memory_search_expert_consensus', {
  min_agreement: 0,
  limit: 1000
});

const byTaskType = {};
allConsensus.forEach(c => {
  const taskType = c.content.task_type;
  if (!byTaskType[taskType]) {
    byTaskType[taskType] = {
      count: 0,
      avgAgreement: 0,
      decisions: {}
    };
  }

  byTaskType[taskType].count++;
  byTaskType[taskType].avgAgreement += c.agreement;

  const decision = c.content.consensus_decision;
  byTaskType[taskType].decisions[decision] =
    (byTaskType[taskType].decisions[decision] || 0) + 1;
});

// Calculate averages
Object.keys(byTaskType).forEach(type => {
  byTaskType[type].avgAgreement /= byTaskType[type].count;
});

console.log('Consensus by Task Type:', byTaskType);
```

---

## Best Practices

### Refinement Traces
1. **Always record both success and failure** - Failures teach patterns too
2. **Use consistent task_id naming** - Enables pattern detection
3. **Store meaningful final_result** - Include what was learned
4. **Track duration** - Helps identify performance issues

### Expert Consensus
1. **Store all votes, not just decision** - Enables deeper analysis
2. **Use importance_score = agreement_level** - Natural filtering
3. **Include reasoning in votes** - Builds knowledge base
4. **Tag by task type and decision** - Enables quick retrieval

### General
1. **Search before creating** - Leverage existing knowledge
2. **Use structured JSON** - Maintains schema flexibility
3. **Monitor memory growth** - Implement cleanup if needed
4. **Analyze patterns regularly** - Extract actionable insights

---

## Testing

### Verify Refinement Trace Creation
```bash
npm test -- file-store.test.ts -t "REFINEMENT_TRACE"
```

### Verify Expert Consensus Search
```bash
npm test -- file-store.test.ts -t "EXPERT_CONSENSUS"
```

### Full Test Suite
```bash
npm test -- file-store.test.ts
```

---

## MCP Server Configuration

### Starting the Server (stdio mode)
```bash
npm run mcp
```

### Starting the HTTP Server
```bash
npm run mcp:http
```

The HTTP server runs on `http://localhost:3001/mcp` and supports both new tools.

---

## Troubleshooting

### Tool not found error
**Cause:** Server not restarted after code changes
**Solution:** Rebuild and restart MCP server
```bash
npm run build
npm run mcp
```

### Empty search results
**Cause:** Wrong memory type or filters too restrictive
**Solution:** Check memory type and lower min_agreement/min_importance
```javascript
// Try broader search first
const all = await mcpClient.callTool('memory_search', {
  type: 'expert_consensus',
  limit: 100
});
console.log(`Found ${all.length} total consensus memories`);
```

### JSON parse errors in consensus search
**Cause:** Invalid JSON in memory content
**Solution:** Validate JSON before storing
```javascript
// Always validate before storing
const content = JSON.stringify(consensusData);
try {
  JSON.parse(content); // Verify it's valid
  await mcpClient.callTool('memory_create', {
    content,
    type: 'expert_consensus',
    ...
  });
} catch (e) {
  console.error('Invalid JSON:', e);
}
```

---

## Future Enhancements

Potential improvements for consideration:
- Aggregation queries (avg agreement by task type)
- Time-based filtering (recent consensus only)
- Trend analysis (agreement improving over time?)
- Automatic cleanup of old low-importance memories
- Cross-referencing refinement traces with consensus decisions
