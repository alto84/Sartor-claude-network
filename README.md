# Claude Swarm 🐝

> Multi-agent coordination enabling unlimited nested agent hierarchies for Claude Code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## The Problem

Claude Code's Task tool (subagents) **cannot spawn other subagents**. The Task tool is simply not available to spawned agents - this is a hard limitation.

## The Solution

**External file-based coordination** that enables unlimited nesting:

```
Orchestrator (spawns via Task)
    └── Agent A (writes to .swarm/requests/)
         └── Agent B (coordinator spawns, writes to .swarm/requests/)
              └── Agent C (coordinator spawns)
                   └── ... (unlimited depth)
```

## Installation

### Option 1: Skill Only (Simplest)

Just install the skill file:

```bash
mkdir -p ~/.claude/skills/claude-swarm
curl -sL https://raw.githubusercontent.com/YOUR_USERNAME/claude-swarm/main/skills/claude-swarm/SKILL.md \
  -o ~/.claude/skills/claude-swarm/SKILL.md
```

### Option 2: Full Installation

```bash
git clone https://github.com/YOUR_USERNAME/claude-swarm.git
cd claude-swarm
npm install

# Install skill
cp -r skills/claude-swarm ~/.claude/skills/

# Optional: Install hooks and commands
cp hooks/*.sh ~/.claude/hooks/
cp commands/*.md ~/.claude/commands/
```

## Quick Start

### 1. Start the Coordinator

```bash
# From the claude-swarm directory
node coordinator/local-only.js

# Or with custom settings
MAX_AGENTS=10 AGENT_TIMEOUT=600 node coordinator/local-only.js
```

### 2. Initialize Your Project

```bash
mkdir -p .swarm/{requests,results,processing,artifacts}
```

### 3. Spawn Agents

Create a request file:

```bash
cat > .swarm/requests/my-agent.json << 'EOF'
{
  "agentRole": "researcher",
  "task": {
    "objective": "Research current AI safety trends",
    "context": {"focus": "technical methods"},
    "requirements": ["Cite sources", "Be thorough"]
  }
}
EOF
```

### 4. Get Results

```bash
# Results appear in .swarm/results/
cat .swarm/results/*.json
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR CLAUDE CODE SESSION                  │
│                                                              │
│   You: "Research AI safety with a team of agents"           │
│                          │                                   │
│                          ▼                                   │
│   Claude writes: .swarm/requests/orchestrator.json          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  COORDINATOR SERVICE                         │
│                                                              │
│   📂 Watches .swarm/requests/ for new JSON files            │
│   🚀 Spawns: claude -p "<agent prompt>"                     │
│   📊 Manages up to 10 concurrent agents                     │
│   💾 Writes results to .swarm/results/                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │ Agent 1 │       │ Agent 2 │       │ Agent 3 │
   │         │       │         │       │         │
   │ Can     │       │ Can     │       │ Can     │
   │ spawn   │──────▶│ spawn   │──────▶│ spawn   │──▶ ...
   │ more!   │       │ more!   │       │ more!   │
   └─────────┘       └─────────┘       └─────────┘
```

## Request Format

```json
{
  "agentRole": "researcher",
  "parentRequestId": "optional-parent-id",
  "task": {
    "objective": "What the agent should accomplish",
    "context": {
      "any": "relevant data"
    },
    "requirements": [
      "Specific requirement 1",
      "Specific requirement 2"
    ]
  }
}
```

## Spawning Nested Agents

Any agent can spawn children by writing to `.swarm/requests/`:

```bash
# From within an agent
cat > .swarm/requests/child-$(date +%s).json << 'EOF'
{
  "agentRole": "specialist",
  "parentRequestId": "$SWARM_REQUEST_ID",
  "task": {
    "objective": "Handle specialized subtask",
    "context": {"fromParent": "data"}
  }
}
EOF
```

## Coordination Patterns

### Fan-Out / Fan-In
```
Orchestrator
    ├── Researcher 1 (parallel)
    ├── Researcher 2 (parallel)
    └── Researcher 3 (parallel)
         ↓
    Synthesize all results
```

### Pipeline
```
Gather → Analyze → Write → Review
```

### Hierarchical
```
Orchestrator
    └── Team Lead
         ├── Worker 1
         └── Worker 2
              └── Specialist
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SWARM_DIR` | `.swarm` | Base directory |
| `MAX_AGENTS` | `5` | Max concurrent agents |
| `AGENT_TIMEOUT` | `300` | Seconds per agent |

## Project Structure

```
claude-swarm/
├── coordinator/
│   ├── index.js           # Firebase + local coordinator
│   ├── local-only.js      # Local-only (no Firebase)
│   └── local-mock.js      # Mock for testing
├── skills/
│   └── claude-swarm/
│       └── SKILL.md       # Main skill documentation
├── hooks/                 # Optional Claude Code hooks
├── commands/              # Optional /team, /status commands
├── firebase/              # Firebase schema (optional)
├── github/                # GitHub Actions workflow (optional)
└── examples/
```

## Runtime Directory

```
.swarm/
├── requests/      # Pending agent requests
├── processing/    # Currently executing
├── results/       # Completed results
└── artifacts/     # Shared data between agents
```

## Examples

### Simple Research Team

```bash
# Start coordinator
node coordinator/local-only.js &

# Create orchestrator
cat > .swarm/requests/research.json << 'EOF'
{
  "agentRole": "research-lead",
  "task": {
    "objective": "Research AI safety trends 2024-2025",
    "requirements": [
      "Spawn 3 researchers for: technical, governance, industry",
      "Collect and synthesize findings"
    ]
  }
}
EOF

# Wait for results
watch -n 5 'ls .swarm/results/ | wc -l'
```

### Code Review Team

```bash
cat > .swarm/requests/review.json << 'EOF'
{
  "agentRole": "review-coordinator",
  "task": {
    "objective": "Comprehensive code review of src/",
    "context": {"repo": ".", "branch": "main"},
    "requirements": [
      "Spawn security reviewer",
      "Spawn performance reviewer",
      "Spawn style reviewer",
      "Aggregate findings"
    ]
  }
}
EOF
```

## Limitations

- **API Latency**: Each agent takes 30-120+ seconds (Claude API response time)
- **No Direct Communication**: Agents communicate only via files
- **Polling Required**: Parents must poll for child results
- **Resource Usage**: Each agent is a separate process

## Troubleshooting

### Agents not spawning
- Check coordinator is running
- Check `.swarm/requests/` for files
- Verify Node.js 18+ installed

### Timeouts
- Increase `AGENT_TIMEOUT` (default 300s)
- Break large tasks into smaller subtasks

### Results missing
- Check `.swarm/processing/` for stuck files
- Review coordinator console output

## Advanced

### Firebase Integration

For real-time coordination across machines, configure Firebase:

```bash
cp .env.example .env
# Edit with your Firebase credentials
node coordinator/index.js
```

### GitHub Actions

For serverless coordination via GitHub Issues, copy the workflow:

```bash
cp github/workflows/agent-worker.yml .github/workflows/
```

## License

MIT

## Contributing

Issues and PRs welcome!
