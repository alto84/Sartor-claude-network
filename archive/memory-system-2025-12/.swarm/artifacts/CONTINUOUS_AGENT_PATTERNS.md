# Continuous Agent Patterns

## Pattern 1: Self-Perpetuating Agent

Agent spawns its own successor before timing out:

```json
{
  "agentRole": "continuous-worker",
  "task": {
    "objective": "Monitor system and spawn successor",
    "context": {
      "iteration": 1,
      "max_iterations": 100,
      "state_file": ".swarm/artifacts/continuous-state.json"
    },
    "requirements": [
      "Read state from previous iteration (if exists)",
      "Do 25 minutes of useful work",
      "Save state to state_file",
      "Spawn next iteration with incremented counter",
      "CRITICAL: Spawn successor BEFORE you finish"
    ]
  }
}
```

Agent's final action:
```bash
# Save state
cat > .swarm/artifacts/continuous-state.json << EOF
{"last_iteration": 1, "work_done": ["task1", "task2"], "next_focus": "task3"}
EOF

# Spawn successor (MUST do this before timing out)
cat > .swarm/requests/continuous-$(date +%s).json << 'EOF'
{
  "agentRole": "continuous-worker",
  "task": {
    "objective": "Continue monitoring (iteration 2)",
    "context": {"iteration": 2, "max_iterations": 100},
    "requirements": ["Read state", "Continue work", "Spawn next"]
  }
}
EOF
```

## Pattern 2: Watchdog Daemon

External script that ensures continuous work:

```bash
#!/bin/bash
# continuous-work-daemon.sh

OBJECTIVE="Monitor and improve the codebase"
INTERVAL=1800  # 30 minutes

while true; do
    echo "[$(date)] Spawning work cycle..."

    cat > .swarm/requests/work-cycle-$(date +%s).json << EOF
{
  "agentRole": "continuous-improver",
  "task": {
    "objective": "$OBJECTIVE",
    "context": {"cycle_start": "$(date -Iseconds)"},
    "requirements": [
      "Review recent changes",
      "Identify improvements",
      "Implement one improvement",
      "Document in artifacts/work-log.md"
    ]
  }
}
EOF

    sleep $INTERVAL
done
```

## Pattern 3: Event-Driven Continuous

Agent watches for events and spawns handlers:

```json
{
  "agentRole": "event-watcher",
  "task": {
    "objective": "Watch for changes and react",
    "context": {
      "watch_paths": ["/home/alton/project/src/"],
      "event_types": ["new_file", "modified", "error"]
    },
    "requirements": [
      "Check for changes since last run",
      "For each change, spawn appropriate handler agent",
      "Log events to artifacts/event-log.json",
      "Spawn next watcher before finishing"
    ]
  }
}
```

## Pattern 4: Overnight Research Pipeline

Multi-phase overnight work:

```json
{
  "agentRole": "overnight-orchestrator",
  "task": {
    "objective": "Execute comprehensive overnight research",
    "context": {
      "topics": ["AI safety", "multi-agent systems", "MCP protocols"],
      "phases": ["research", "synthesis", "documentation"],
      "output_dir": ".swarm/artifacts/overnight-research/"
    },
    "requirements": [
      "Phase 1: Spawn 3 researcher agents (one per topic)",
      "Phase 2: Wait for results, spawn synthesizer",
      "Phase 3: Spawn documentation agent",
      "Write final summary to output_dir"
    ]
  }
}
```

## How to Check on Long-Running Agents

```bash
# Watch coordinator activity
tail -f /home/alton/.swarm/coordinator.log

# Count completed work
ls .swarm/results/*.json | wc -l

# See latest results
cat .swarm/results/$(ls -t .swarm/results/ | head -1)

# Check artifacts for agent state
cat .swarm/artifacts/continuous-state.json
```

## Truly Continuous: Coordinator Daemon

For 24/7 operation, run coordinator as a systemd service:

```ini
# /etc/systemd/user/claude-swarm.service
[Unit]
Description=Claude Swarm Coordinator
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/alton/claude-swarm
ExecStart=/usr/bin/node coordinator/local-only.js
Restart=always
RestartSec=10
Environment=AGENT_TIMEOUT_SECONDS=3600
Environment=MAX_CONCURRENT_AGENTS=3

[Install]
WantedBy=default.target
```

Enable with:
```bash
systemctl --user enable claude-swarm
systemctl --user start claude-swarm
```

## Key Insight: Terminal-Level Power

A spawned agent is essentially equivalent to running:
```bash
claude -p "Your task..."
```

This gives the agent:
- Full terminal access via Bash tool
- Read/Write to any file the user can access
- Network access for research
- Ability to install packages (npm, pip, etc.)
- Ability to run long processes in background

The ONLY limitation is the timeout - which we work around with self-perpetuation.
