---
name: claude-swarm
description: Multi-agent coordination system enabling unlimited nested agent hierarchies via file-based coordination
---

# Claude Swarm

A coordination system that enables Claude Code agents to spawn and coordinate nested agent hierarchies, bypassing the Task tool's single-level limitation.

## The Problem

Claude Code's Task tool (subagents) cannot spawn other subagents - the Task tool is not available to spawned agents. This limits coordination to a single level.

## The Solution

External coordination via file-based messaging:
1. Agents write "spawn requests" to `.swarm/requests/`
2. Coordinator service detects requests and spawns new Claude instances
3. Spawned agents can write their own requests (enabling nesting)
4. Results flow back via `.swarm/results/`

## Quick Start

### 1. Set Up the Coordinator

Create the coordinator script and start it:

```bash
# Create the coordinator
mkdir -p ~/.claude-swarm
cat > ~/.claude-swarm/coordinator.js << 'COORDINATOR_EOF'
#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync, renameSync } from 'fs';
import { join, basename } from 'path';
import { spawn } from 'child_process';

const CONFIG = {
  swarmDir: process.env.SWARM_DIR || '.swarm',
  maxAgents: parseInt(process.env.MAX_AGENTS || '5'),
  timeout: parseInt(process.env.AGENT_TIMEOUT || '300') * 1000,
  poll: 500,
};

const dirs = {
  requests: join(CONFIG.swarmDir, 'requests'),
  results: join(CONFIG.swarmDir, 'results'),
  processing: join(CONFIG.swarmDir, 'processing'),
};

Object.values(dirs).forEach(d => mkdirSync(d, { recursive: true }));

const active = new Map();
const processed = new Set();
let stats = { completed: 0, failed: 0 };

function buildPrompt(id, req) {
  const task = req.task || {};
  return `You are Agent "${req.agentRole || 'worker'}" in a multi-agent swarm.

REQUEST ID: ${id}
PARENT: ${req.parentRequestId || 'root'}

OBJECTIVE: ${task.objective || 'Complete the assigned task'}

CONTEXT:
${JSON.stringify(task.context || {}, null, 2)}

REQUIREMENTS:
${(task.requirements || ['Complete the task thoroughly']).map(r => '• ' + r).join('\n')}

INSTRUCTIONS:
1. Complete the task above
2. Be concise but thorough
3. To spawn a child agent, create: ${CONFIG.swarmDir}/requests/child-{id}.json

Child agent format:
{
  "agentRole": "specialist",
  "parentRequestId": "${id}",
  "task": { "objective": "...", "context": {}, "requirements": [] }
}

Begin your task:`;
}

function spawnAgent(id, req) {
  if (active.size >= CONFIG.maxAgents) return false;

  const proc = spawn('claude', ['-p', buildPrompt(id, req)], {
    env: { ...process.env, SWARM_REQUEST_ID: id, SWARM_PARENT_ID: req.parentRequestId || '' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let out = '', err = '';
  proc.stdout.on('data', d => out += d);
  proc.stderr.on('data', d => err += d);

  const timer = setTimeout(() => {
    proc.kill('SIGTERM');
    console.log(\`⏰ Timeout: \${id.slice(0,12)}\`);
  }, CONFIG.timeout);

  active.set(id, { proc, timer, start: Date.now() });

  proc.on('close', code => {
    clearTimeout(timer);
    active.delete(id);
    const duration = Date.now() - active.get(id)?.start || 0;
    const status = code === 0 ? 'success' : 'failed';
    stats[status === 'success' ? 'completed' : 'failed']++;

    writeFileSync(join(dirs.results, \`\${id}.json\`), JSON.stringify({
      requestId: id, status, output: out || err, durationMs: duration,
      completedAt: new Date().toISOString()
    }, null, 2));

    console.log(\`\${status === 'success' ? '✅' : '❌'} \${id.slice(0,12)} (\${(duration/1000).toFixed(1)}s)\`);
  });

  return true;
}

function poll() {
  try {
    for (const file of readdirSync(dirs.requests).filter(f => f.endsWith('.json'))) {
      if (processed.has(file)) continue;
      processed.add(file);

      const path = join(dirs.requests, file);
      if (!existsSync(path)) continue;

      try {
        const req = JSON.parse(readFileSync(path, 'utf-8'));
        const id = req.requestId || \`req-\${Date.now()}-\${Math.random().toString(36).slice(2,8)}\`;

        renameSync(path, join(dirs.processing, file));
        console.log(\`📥 \${id.slice(0,12)} (\${req.agentRole || 'worker'})\`);

        if (spawnAgent(id, { ...req, requestId: id })) {
          unlinkSync(join(dirs.processing, file));
        } else {
          renameSync(join(dirs.processing, file), path);
          processed.delete(file);
        }
      } catch (e) { console.error(\`Error: \${e.message}\`); }
    }
  } catch (e) {}
}

console.log(\`
╔═══════════════════════════════════════════════════════════╗
║              CLAUDE SWARM COORDINATOR                     ║
╠═══════════════════════════════════════════════════════════╣
║  Max agents: \${CONFIG.maxAgents}  |  Timeout: \${CONFIG.timeout/1000}s                      ║
║  Directory: \${CONFIG.swarmDir}                                     ║
╚═══════════════════════════════════════════════════════════╝
\`);
console.log('🔍 Watching for requests...\n');

setInterval(poll, CONFIG.poll);
setInterval(() => {
  if (active.size > 0 || stats.completed > 0)
    console.log(\`📊 Active: \${active.size} | Done: \${stats.completed} | Failed: \${stats.failed}\`);
}, 10000);

process.on('SIGINT', () => { console.log('\n👋 Stopped'); process.exit(0); });
COORDINATOR_EOF

chmod +x ~/.claude-swarm/coordinator.js
```

### 2. Start the Coordinator

In a separate terminal:

```bash
cd /your/project
node ~/.claude-swarm/coordinator.js
```

Or with custom settings:

```bash
MAX_AGENTS=10 AGENT_TIMEOUT=600 node ~/.claude-swarm/coordinator.js
```

### 3. Initialize Swarm Directory

```bash
mkdir -p .swarm/{requests,results,processing}
```

## Usage Patterns

### Pattern 1: Spawn a Single Agent

```bash
cat > .swarm/requests/my-agent.json << 'EOF'
{
  "agentRole": "researcher",
  "task": {
    "objective": "Research current trends in AI safety",
    "context": {"focus": "technical methods"},
    "requirements": [
      "Find recent papers",
      "Summarize key findings",
      "Note limitations"
    ]
  }
}
EOF
```

### Pattern 2: Spawn a Team (Fan-Out)

```bash
# Create orchestrator that spawns workers
cat > .swarm/requests/orchestrator.json << 'EOF'
{
  "agentRole": "orchestrator",
  "task": {
    "objective": "Coordinate research on AI governance",
    "context": {
      "regions": ["US", "EU", "China"],
      "spawnPerRegion": true
    },
    "requirements": [
      "Spawn one researcher per region",
      "Collect and synthesize results"
    ]
  }
}
EOF
```

The orchestrator can then spawn children:

```bash
# Orchestrator creates these files:
cat > .swarm/requests/researcher-us.json << 'EOF'
{
  "agentRole": "researcher-us",
  "parentRequestId": "orchestrator-123",
  "task": {
    "objective": "Research US AI governance",
    "requirements": ["Cover executive orders", "Note agency actions"]
  }
}
EOF
```

### Pattern 3: Pipeline (Sequential)

```bash
# Stage 1: Gather
cat > .swarm/requests/stage1-gather.json << 'EOF'
{
  "agentRole": "gatherer",
  "task": {
    "objective": "Gather raw data on topic X",
    "requirements": ["Save to .swarm/artifacts/raw-data.json"]
  }
}
EOF

# After stage 1 completes, stage 2:
cat > .swarm/requests/stage2-analyze.json << 'EOF'
{
  "agentRole": "analyzer",
  "parentRequestId": "stage1-gather",
  "task": {
    "objective": "Analyze gathered data",
    "context": {"input": ".swarm/artifacts/raw-data.json"}
  }
}
EOF
```

### Pattern 4: From Within Claude Code

When you're already in a Claude Code session:

```bash
# Create request file
echo '{
  "agentRole": "specialist",
  "task": {
    "objective": "Deep dive into authentication code",
    "context": {"files": ["src/auth/"]},
    "requirements": ["Find security issues", "Suggest fixes"]
  }
}' > .swarm/requests/security-audit.json

# Poll for result
while [ ! -f .swarm/results/security-audit*.json ]; do sleep 2; done
cat .swarm/results/security-audit*.json
```

## Spawning Children (Nested Agents)

Any agent can spawn child agents by creating request files:

```javascript
// Inside an agent's execution
const childRequest = {
  agentRole: "sub-specialist",
  parentRequestId: process.env.SWARM_REQUEST_ID,
  task: {
    objective: "Handle subtask",
    context: { parentData: "..." }
  }
};

// Write to requests directory
fs.writeFileSync(
  `.swarm/requests/child-${Date.now()}.json`,
  JSON.stringify(childRequest, null, 2)
);
```

Or via bash:

```bash
cat > .swarm/requests/child-$(date +%s).json << EOF
{
  "agentRole": "child-worker",
  "parentRequestId": "$SWARM_REQUEST_ID",
  "task": {
    "objective": "Child task",
    "context": {}
  }
}
EOF
```

## Polling for Results

### Simple Poll

```bash
# Wait for specific result
REQUEST_ID="my-agent"
while [ ! -f ".swarm/results/${REQUEST_ID}"*.json ]; do
  sleep 2
done
cat ".swarm/results/${REQUEST_ID}"*.json
```

### Poll with Timeout

```bash
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  if ls .swarm/results/*.json 2>/dev/null | grep -q .; then
    echo "Results ready!"
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done
```

### Aggregate Multiple Results

```bash
# Wait for all children of a parent
PARENT_ID="orchestrator-123"
EXPECTED=3
while true; do
  COUNT=$(grep -l "$PARENT_ID" .swarm/results/*.json 2>/dev/null | wc -l)
  if [ "$COUNT" -ge "$EXPECTED" ]; then
    echo "All $EXPECTED children complete"
    break
  fi
  sleep 2
done

# Combine results
cat .swarm/results/*.json | jq -s '.'
```

## Request Schema

```typescript
interface AgentRequest {
  // Identity
  requestId?: string;           // Auto-generated if not provided
  agentRole: string;            // e.g., "researcher", "analyst"
  parentRequestId?: string;     // For nested agents

  // Task definition
  task: {
    objective: string;          // What to accomplish
    context?: object;           // Input data
    requirements?: string[];    // Constraints
    timeoutSeconds?: number;    // Override default timeout
  };
}
```

## Result Schema

```typescript
interface AgentResult {
  requestId: string;
  status: "success" | "failed";
  output: string;               // Agent's output
  durationMs: number;
  completedAt: string;          // ISO timestamp
}
```

## Directory Structure

```
.swarm/
├── requests/           # Pending requests (input)
│   └── agent-123.json
├── processing/         # Currently executing
├── results/            # Completed results (output)
│   ├── agent-123.json
│   └── child-456.json
└── artifacts/          # Shared data between agents
    └── shared-data.json
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SWARM_DIR` | `.swarm` | Base directory for swarm files |
| `MAX_AGENTS` | `5` | Maximum concurrent agents |
| `AGENT_TIMEOUT` | `300` | Timeout per agent (seconds) |
| `SWARM_REQUEST_ID` | - | Set by coordinator for spawned agents |
| `SWARM_PARENT_ID` | - | Parent's request ID (if nested) |

## Best Practices

### 1. Always Pass Context

```json
{
  "task": {
    "objective": "Analyze code",
    "context": {
      "originalGoal": "Security audit of auth system",
      "priorFindings": ["Issue A", "Issue B"],
      "targetFiles": ["src/auth/"]
    }
  }
}
```

### 2. Use Clear Role Names

- `researcher-security` not just `researcher`
- `analyzer-performance` not just `analyzer`
- Helps with debugging and log readability

### 3. Limit Nesting Depth

Recommended max: 3 levels
- Level 0: Orchestrator
- Level 1: Primary workers
- Level 2: Specialists
- Level 3: Only if truly necessary

### 4. Handle Failures

```bash
RESULT=$(cat .swarm/results/my-agent*.json)
STATUS=$(echo "$RESULT" | jq -r '.status')

if [ "$STATUS" = "failed" ]; then
  echo "Agent failed, retrying..."
  # Retry logic
fi
```

### 5. Clean Up Old Results

```bash
# Archive completed results
mkdir -p .swarm/archive
mv .swarm/results/*.json .swarm/archive/

# Or delete old results
find .swarm/results -name "*.json" -mmin +60 -delete
```

## Troubleshooting

### Agents Not Spawning

1. Check coordinator is running: `ps aux | grep coordinator`
2. Check requests directory: `ls -la .swarm/requests/`
3. Check for JSON errors in request files

### Agents Timing Out

1. Increase timeout: `AGENT_TIMEOUT=600`
2. Simplify the task objective
3. Break into smaller subtasks

### Results Not Appearing

1. Check processing directory: `ls -la .swarm/processing/`
2. Check coordinator logs for errors
3. Verify agent completed (check exit code)

### Too Many Agents

1. Reduce `MAX_AGENTS`
2. Implement queuing in your orchestrator
3. Use sequential instead of parallel spawning

## Advanced: GitHub Actions Integration

For persistent, serverless coordination, use GitHub Issues:

```yaml
# .github/workflows/swarm-worker.yml
name: Swarm Worker
on:
  issues:
    types: [opened, labeled]

jobs:
  process:
    if: contains(github.event.issue.labels.*.name, 'agent-request')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g @anthropic-ai/claude-code
      - name: Execute Agent
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          TASK=$(echo '${{ github.event.issue.body }}' | jq -r '.task.objective')
          RESULT=$(claude -p "$TASK")
          gh issue comment ${{ github.event.issue.number }} --body "$RESULT"
          gh issue edit ${{ github.event.issue.number }} --add-label "completed"
```

## Advanced: Firebase Real-Time Sync

For real-time coordination across machines:

```javascript
// Use Firebase MCP Server
// Agents read/write to Firestore instead of local files
// Coordinator watches Firestore with onSnapshot()
```

## Limitations

1. **API Latency**: Each `claude -p` call takes 30-120+ seconds
2. **No Direct Communication**: Agents communicate via files only
3. **Polling Required**: Parent must poll for child results
4. **Resource Usage**: Each agent is a separate process

## Complete Example: Research Team

```bash
# 1. Start coordinator
node ~/.claude-swarm/coordinator.js &

# 2. Create research team orchestrator
cat > .swarm/requests/research-lead.json << 'EOF'
{
  "agentRole": "research-lead",
  "task": {
    "objective": "Coordinate research on AI safety trends 2024-2025",
    "context": {
      "outputDir": ".swarm/artifacts",
      "format": "markdown"
    },
    "requirements": [
      "Spawn 3 researchers: technical, governance, industry",
      "Wait for all results",
      "Synthesize into final report"
    ]
  }
}
EOF

# 3. Monitor progress
watch -n 5 'ls -la .swarm/results/ && echo "---" && cat .swarm/results/*.json | jq -s "length"'

# 4. Get final results
cat .swarm/results/research-lead*.json | jq '.output'
```

## Version History

- **1.0.0** - Initial release with local file-based coordination
- Supports nested agents, fan-out/fan-in, pipelines
- Tested with up to 10 concurrent agents
