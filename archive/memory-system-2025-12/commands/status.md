# /status - Show swarm coordination status

Display the current state of the agent swarm, including active agents, pending tasks, and recent activity.

## Usage

```
/status
/status --verbose
/status --agent <agent-id>
```

## Behavior

Read and display information from:
- `.swarm/state.json` - Current swarm state
- `.swarm/PROGRESS.md` - Activity log
- `.swarm/requests/` - Pending requests
- `.swarm/results/` - Completed results
- `.swarm/mail/` - Message queues

## Output Format

### Basic Status

```
═══════════════════════════════════════════════════════════
  SWARM STATUS
═══════════════════════════════════════════════════════════

  Swarm ID:    swarm-20251202-120000
  Objective:   Research AI safety trends
  Phase:       research (2/4)
  Runtime:     3m 24s

  ┌─────────────────────────────────────────────────────┐
  │  AGENTS                                              │
  ├──────────────┬──────────┬──────────┬────────────────┤
  │ Role         │ Status   │ Progress │ Runtime        │
  ├──────────────┼──────────┼──────────┼────────────────┤
  │ orchestrator │ active   │ -        │ 3m 24s         │
  │ researcher-1 │ completed│ 100%     │ 1m 12s         │
  │ researcher-2 │ active   │ 60%      │ 2m 01s         │
  │ researcher-3 │ active   │ 45%      │ 1m 45s         │
  └──────────────┴──────────┴──────────┴────────────────┘

  Completed: 1 │ Active: 3 │ Pending: 0 │ Failed: 0

═══════════════════════════════════════════════════════════
```

### Verbose Status (--verbose)

```
═══════════════════════════════════════════════════════════
  SWARM STATUS (VERBOSE)
═══════════════════════════════════════════════════════════

  ... basic status ...

  ┌─────────────────────────────────────────────────────┐
  │  RECENT ACTIVITY (last 5)                           │
  ├─────────────────────────────────────────────────────┤
  │ 12:05:00 │ researcher-1 │ Completed initial research│
  │ 12:04:30 │ researcher-2 │ Found 3 policy documents  │
  │ 12:03:00 │ orchestrator │ Spawned researcher-3      │
  │ 12:02:00 │ orchestrator │ Spawned researcher-2      │
  │ 12:01:00 │ orchestrator │ Spawned researcher-1      │
  └─────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────┐
  │  ARTIFACTS                                          │
  ├─────────────────────────────────────────────────────┤
  │ alignment-papers.json    │ researcher-1 │ 15 items  │
  │ policy-timeline.json     │ researcher-2 │ 3 items   │
  └─────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────┐
  │  MESSAGES                                           │
  ├─────────────────────────────────────────────────────┤
  │ Inbox: 2 unread │ Outbox: 0 pending                │
  └─────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════
```

## Implementation

Read state and format output:

```bash
# Check if swarm exists
if [ ! -f ".swarm/state.json" ]; then
    echo "No active swarm. Use /team to start one."
    exit 0
fi

# Read state
STATE=$(cat .swarm/state.json)

# Extract fields
SWARM_ID=$(echo "$STATE" | jq -r '.swarmId')
OBJECTIVE=$(echo "$STATE" | jq -r '.objective')
PHASE=$(echo "$STATE" | jq -r '.phase')

# Count agents by status
ACTIVE=$(echo "$STATE" | jq '[.agents | to_entries[] | select(.value.status == "active")] | length')
COMPLETED=$(echo "$STATE" | jq '[.agents | to_entries[] | select(.value.status == "completed")] | length')
FAILED=$(echo "$STATE" | jq '[.agents | to_entries[] | select(.value.status == "failed")] | length')

# Count pending requests
PENDING=$(ls -1 .swarm/requests/*.json 2>/dev/null | wc -l)

# Count unread messages
UNREAD=$(find .swarm/mail/inbox -name "*.json" 2>/dev/null | wc -l)

# Format and display
```

## Agent Detail (--agent)

```
/status --agent researcher-1

═══════════════════════════════════════════════════════════
  AGENT: researcher-1
═══════════════════════════════════════════════════════════

  Role:        researcher
  Status:      completed
  Request ID:  req-abc123

  Task:
    Objective: Research technical AI safety methods
    Started:   2025-12-02T12:01:00Z
    Completed: 2025-12-02T12:02:12Z
    Duration:  1m 12s

  Output:
    File: .swarm/artifacts/alignment-papers.json
    Size: 15 items

  Messages Sent: 2
  Messages Received: 1

═══════════════════════════════════════════════════════════
```

## No Swarm Active

```
/status

═══════════════════════════════════════════════════════════
  SWARM STATUS
═══════════════════════════════════════════════════════════

  No active swarm.

  To start a swarm:
    /team <task description>

  To view past swarms:
    ls .swarm/archive/

═══════════════════════════════════════════════════════════
```

## Files Read

| File | Purpose |
|------|---------|
| `.swarm/state.json` | Current state |
| `.swarm/PROGRESS.md` | Activity log |
| `.swarm/requests/*.json` | Pending requests |
| `.swarm/results/*.json` | Completed results |
| `.swarm/mail/inbox/` | Unread messages |
| `.swarm/artifacts/` | Output files |
