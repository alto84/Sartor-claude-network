# Agent Status System - Quick Start

## TL;DR

```bash
# Update agent status
./scripts/status-update.sh "my-agent-001" "currentTask" "Working on feature X"
./scripts/status-update.sh "my-agent-001" "progress" "0.5"

# View all statuses
./scripts/status-read.sh

# Clean old files
./scripts/status-cleanup.sh
```

## Common Patterns

### Initialize New Agent
```bash
AGENT_ID="agent-planner-001"
./scripts/status-update.sh "$AGENT_ID" "role" "PLANNER"
./scripts/status-update.sh "$AGENT_ID" "status" "active"
./scripts/status-update.sh "$AGENT_ID" "currentTask" "Planning system architecture"
./scripts/status-update.sh "$AGENT_ID" "progress" "0.0"
```

### Update Progress
```bash
./scripts/status-update.sh "$AGENT_ID" "progress" "0.25"  # 25% done
./scripts/status-update.sh "$AGENT_ID" "progress" "0.50"  # 50% done
./scripts/status-update.sh "$AGENT_ID" "progress" "1.0"   # Complete
```

### Record Findings
```bash
# Each call appends to findings array
./scripts/status-update.sh "$AGENT_ID" "findings" "Found optimal solution"
./scripts/status-update.sh "$AGENT_ID" "findings" "Tests pass with 95% coverage"
```

### Mark Complete
```bash
./scripts/status-update.sh "$AGENT_ID" "status" "completed"
./scripts/status-update.sh "$AGENT_ID" "progress" "1.0"
```

### Handle Errors
```bash
./scripts/status-update.sh "$AGENT_ID" "status" "error"
./scripts/status-update.sh "$AGENT_ID" "errorMessage" "TypeScript compilation failed"
./scripts/status-update.sh "$AGENT_ID" "findings" "Missing type definitions"
```

## Status Values

**Recommended status values:**
- `active` - Currently working
- `idle` - Waiting for work
- `blocked` - Waiting for dependency
- `completed` - Task finished
- `error` - Failed with error

## Monitoring

### Real-time Watch
```bash
watch -n 1 ./scripts/status-read.sh
```

### Check Specific Agent
```bash
cat data/agent-status/agent-planner-001.json
```

### Find Active Agents
```bash
grep -l '"status": "active"' data/agent-status/*.json
```

### Coordination Example
```bash
# Wait for planner to finish
while ! grep -q '"status": "completed"' data/agent-status/agent-planner-001.json; do
  sleep 1
done

# Then start implementer
./scripts/status-update.sh "agent-implementer-001" "status" "active"
```

## File Locations

- Scripts: `/home/alton/Sartor-claude-network/scripts/status-*.sh`
- Status files: `/home/alton/Sartor-claude-network/data/agent-status/*.json`
- Documentation: `/home/alton/Sartor-claude-network/scripts/README-status.md`

## Testing

```bash
./scripts/test-status-system.sh
```

## Troubleshooting

**Stale lock files?**
```bash
rm data/agent-status/*.lock
```

**Invalid JSON?**
```bash
for f in data/agent-status/*.json; do
  python3 -m json.tool "$f" > /dev/null 2>&1 || echo "Invalid: $f"
done
```

**Clean everything?**
```bash
rm -rf data/agent-status/*
```
