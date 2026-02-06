# Sartor - Personal AI Assistant System

> A markdown-first personal assistant that runs across multiple machines, keeps memory in git-synced files, and orchestrates Claude Code instances for complex tasks.

## Philosophy

- **Markdown is the source of truth** - No databases. `git` provides versioning, diffing, and sync.
- **One file per domain** - Not one file per memory entry. Keeps things scannable.
- **Simple over complex** - If it can be a text file, it should be.
- **Local-first** - Everything works offline. Git sync when convenient.

## Architecture

```
sartor/
├── memory/          # What Sartor knows
│   ├── SELF.md      # System identity and capabilities
│   ├── ALTON.md     # User profile and preferences
│   ├── FAMILY.md    # Family context
│   ├── MACHINES.md  # Computer inventory
│   ├── PROJECTS.md  # Active projects
│   ├── BUSINESS.md  # Business context
│   ├── ASTRAZENECA.md # AZ work context
│   ├── TAXES.md     # Tax prep tracking
│   ├── PROCEDURES.md # How-to procedures
│   ├── LEARNINGS.md # Lessons learned
│   └── daily/       # Append-only daily logs
├── tasks/           # What needs doing
│   ├── ACTIVE.md    # Current task queue
│   ├── BACKLOG.md   # Future/someday tasks
│   └── COMPLETED.md # Done tasks
├── harness/         # Autonomous execution
│   ├── runner.py    # Task runner
│   ├── config.yaml  # Autonomy boundaries
│   └── results/     # Execution logs
├── gateway/         # Coordination
│   ├── gateway.py   # HTTP API for memory/tasks
│   └── agents.yaml  # Machine/agent registry
└── README.md        # This file
```

## Sync

Both machines clone the same repo. `git pull` before reading, `git push` after writing.
Git push must happen from Rocinante (has GitHub credentials).

## Memory File Format

Each memory file follows this pattern:
```
# Topic Name
> Last updated: YYYY-MM-DD by who

## Key Facts
- Essential bullets

## Details
Longer form

## Open Questions
- Unknowns

## History
- Date: What changed
```

## Usage

### Check task status
```bash
python3 sartor/harness/runner.py --status
```

### Dry run (see what would execute)
```bash
python3 sartor/harness/runner.py --check
```

### Run autonomous tasks
```bash
python3 sartor/harness/runner.py --run
```

### Search memory
```bash
curl http://localhost:5001/search?q=your+query
```

### Start gateway
```bash
python3 sartor/gateway/gateway.py
```

## Inspired By

- [OpenClaw](https://docs.openclaw.ai/) - Memory patterns, heartbeat, gateway architecture
- Claude Code - Agent orchestration, sub-instances
- Getting Things Done (GTD) - Task management philosophy
