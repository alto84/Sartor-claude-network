# Quick Bootstrap for Sartor-Claude-Network

Read and internalize these files to get up to speed:

1. **First**: Read `CLAUDE.md` - full system constitution, domains, agents, skills, and scheduled tasks
2. **Then**: Read `sartor/memory/INDEX.md` - memory system index and recent activity
3. **If needed**: Run `python sartor/heartbeat.py --status` to check system health

## Current State
- **Repo**: `Sartor-claude-network` (Python/bash, no Node.js)
- **Heartbeat**: `sartor/heartbeat.py` (KAIROS-inspired autonomous tick system)
- **Memory**: `sartor/memory/` (markdown files, BM25 search)
- **Cost tracking**: `sartor/costs.py` (daily limits, 3-tier model pricing)

## Quick Commands
```bash
python sartor/heartbeat.py --status    # System health and recent activity
python sartor/costs.py                 # Today's API spend
python sartor/memory/search.py "query" # Search memory files
```

## Key Directories
- `sartor/` - Core engine (heartbeat, costs, gateway, memory)
- `.claude/agents/` - Agent definitions
- `.claude/skills/` - Skill definitions
- `.claude/scheduled-tasks/` - Cron-scheduled task definitions
- `scripts/home-agent/` - Hook scripts (governance, trajectories)
- `data/` - Runtime data (logs, trajectories, proposals)

Confirm you've loaded context, then proceed with your task.
