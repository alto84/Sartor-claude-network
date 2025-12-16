# Persistent Instruction System for Autonomous Agents

## Overview

A system for giving agents permanent, resumable objectives they can follow across
multiple sessions and generations.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  PERSISTENT INSTRUCTION FILE                     │
│              .swarm/instructions/MISSION.json                    │
├─────────────────────────────────────────────────────────────────┤
│  {                                                              │
│    "mission_id": "overnight-research-001",                     │
│    "created": "2025-12-15T00:00:00Z",                         │
│    "status": "active",                                         │
│    "objective": "Research and improve the codebase",          │
│    "duration_hours": 8,                                        │
│    "check_interval_minutes": 30,                              │
│    "phases": [...],                                           │
│    "current_phase": 1,                                        │
│    "progress": {...},                                         │
│    "agents_spawned": 0,                                       │
│    "artifacts_produced": []                                   │
│  }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                            │
│                                                                  │
│  1. Reads MISSION.json on spawn                                 │
│  2. Executes current phase or spawns workers                    │
│  3. Updates progress in MISSION.json                            │
│  4. Spawns successor before timeout                             │
│  5. Continues until mission complete or duration exceeded       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mission File Schema

```json
{
  "mission_id": "unique-mission-identifier",
  "created": "ISO8601 timestamp",
  "status": "active|paused|completed|failed",
  "objective": "High-level mission goal",

  "timing": {
    "duration_hours": 8,
    "started_at": null,
    "must_end_by": null,
    "check_interval_minutes": 30,
    "agent_timeout_minutes": 25
  },

  "phases": [
    {
      "phase_id": 1,
      "name": "Research",
      "description": "Gather information",
      "agent_role": "researcher",
      "parallel_agents": 3,
      "requirements": ["Search docs", "Analyze code"],
      "success_criteria": ["Found 10+ relevant files"],
      "status": "pending"
    },
    {
      "phase_id": 2,
      "name": "Analysis",
      "description": "Process findings",
      "depends_on": [1],
      "agent_role": "analyst",
      "parallel_agents": 1,
      "requirements": ["Synthesize research"],
      "success_criteria": ["Analysis document created"],
      "status": "pending"
    }
  ],

  "current_phase": 1,
  "progress": {
    "phases_completed": [],
    "agents_spawned": 0,
    "agents_completed": 0,
    "agents_failed": 0,
    "artifacts_produced": []
  },

  "error_handling": {
    "max_retries_per_phase": 3,
    "on_failure": "continue|pause|abort",
    "alert_on_failure": true
  }
}
```

---

## Example Missions

### Mission 1: 8-Hour Codebase Improvement

```json
{
  "mission_id": "codebase-improvement-001",
  "status": "active",
  "objective": "Analyze and improve the codebase overnight",

  "timing": {
    "duration_hours": 8,
    "check_interval_minutes": 30,
    "agent_timeout_minutes": 25
  },

  "phases": [
    {
      "phase_id": 1,
      "name": "Code Audit",
      "agent_role": "code-auditor",
      "parallel_agents": 3,
      "requirements": [
        "Scan for TODO/FIXME comments",
        "Check for security issues",
        "Identify performance bottlenecks"
      ],
      "status": "pending"
    },
    {
      "phase_id": 2,
      "name": "Prioritization",
      "depends_on": [1],
      "agent_role": "planner",
      "requirements": [
        "Review audit findings",
        "Prioritize by impact/effort",
        "Create improvement plan"
      ],
      "status": "pending"
    },
    {
      "phase_id": 3,
      "name": "Implementation",
      "depends_on": [2],
      "agent_role": "implementer",
      "parallel_agents": 2,
      "requirements": [
        "Fix top priority issues",
        "Write tests for fixes",
        "Document changes"
      ],
      "status": "pending"
    },
    {
      "phase_id": 4,
      "name": "Review",
      "depends_on": [3],
      "agent_role": "reviewer",
      "requirements": [
        "Review all changes",
        "Run test suite",
        "Generate final report"
      ],
      "status": "pending"
    }
  ]
}
```

### Mission 2: Continuous Monitoring (Every 5 Minutes)

```json
{
  "mission_id": "home-monitor-001",
  "status": "active",
  "objective": "Monitor system health and alert on issues",

  "timing": {
    "duration_hours": 24,
    "check_interval_minutes": 5,
    "agent_timeout_minutes": 4
  },

  "phases": [
    {
      "phase_id": 1,
      "name": "Health Check",
      "repeating": true,
      "agent_role": "monitor",
      "requirements": [
        "Check disk space (df -h)",
        "Check memory usage (free -m)",
        "Check running processes",
        "Check for error logs",
        "Write status to artifacts/health-{timestamp}.json"
      ],
      "alert_conditions": [
        "disk_usage > 90%",
        "memory_usage > 80%",
        "error_count > 10"
      ]
    }
  ]
}
```

### Mission 3: Self-Improving System

```json
{
  "mission_id": "self-improvement-001",
  "status": "active",
  "objective": "Continuously improve own capabilities",

  "timing": {
    "duration_hours": 168,
    "check_interval_minutes": 60,
    "agent_timeout_minutes": 55
  },

  "phases": [
    {
      "phase_id": 1,
      "name": "Capability Assessment",
      "repeating": true,
      "agent_role": "self-assessor",
      "requirements": [
        "Review recent agent outputs in .swarm/results/",
        "Identify patterns in failures",
        "Document capability gaps",
        "Propose improvements to prompts/instructions"
      ]
    },
    {
      "phase_id": 2,
      "name": "Prompt Optimization",
      "depends_on": [1],
      "agent_role": "optimizer",
      "requirements": [
        "Read assessment findings",
        "Modify agent prompts to address gaps",
        "Test modified prompts",
        "Track improvement metrics"
      ]
    },
    {
      "phase_id": 3,
      "name": "Validation",
      "depends_on": [2],
      "agent_role": "validator",
      "requirements": [
        "Compare before/after performance",
        "Document what worked",
        "Roll back if worse",
        "Commit improvements if better"
      ]
    }
  ],

  "meta": {
    "improvement_targets": [
      "task_completion_rate",
      "response_quality",
      "error_rate",
      "efficiency"
    ],
    "measurement_method": "Compare 10 similar tasks before/after"
  }
}
```

---

## Orchestrator Agent Template

The master orchestrator that reads and executes missions:

```json
{
  "agentRole": "mission-orchestrator",
  "task": {
    "objective": "Execute the mission defined in .swarm/instructions/MISSION.json",
    "context": {
      "mission_file": ".swarm/instructions/MISSION.json",
      "results_dir": ".swarm/results/",
      "artifacts_dir": ".swarm/artifacts/"
    },
    "requirements": [
      "READ the mission file to understand current state",
      "IDENTIFY which phase needs execution",
      "SPAWN worker agents for current phase if needed",
      "CHECK results directory for completed agent work",
      "UPDATE mission file with progress",
      "SPAWN successor orchestrator before timeout (save 2 min buffer)",
      "COMPLETE mission when all phases done or time exceeded"
    ]
  }
}
```

---

## Firebase Real-Time Enhancement

With Firebase, agents could:

1. **Subscribe to mission updates** - Real-time phase transitions
2. **Report progress live** - No polling needed
3. **Coordinate dynamically** - Agents see each other's status
4. **Alert immediately** - Push notifications on failures

```
Firebase Collections:
├── missions/                 # Mission definitions
│   └── {mission_id}/
├── agents/                   # Active agent status
│   └── {agent_id}/
│       ├── status: "running"
│       ├── phase: 1
│       └── last_heartbeat: timestamp
├── progress/                 # Real-time progress
│   └── {mission_id}/
└── alerts/                   # Alert queue
```

---

## Starting a Mission

```bash
# Create mission file
cat > .swarm/instructions/MISSION.json << 'EOF'
{ ... mission definition ... }
EOF

# Create orchestrator request
cat > .swarm/requests/start-mission.json << 'EOF'
{
  "agentRole": "mission-orchestrator",
  "task": {
    "objective": "Start and manage the mission",
    "context": {"mission_file": ".swarm/instructions/MISSION.json"}
  }
}
EOF
```

---

## Key Patterns

1. **Self-Perpetuation**: Orchestrator spawns successor before timeout
2. **Phase Gates**: Don't proceed until dependencies complete
3. **Progress Tracking**: All state in mission file (resumable)
4. **Failure Recovery**: Retry failed phases, pause on repeated failures
5. **Time Bounds**: Hard stop when duration exceeded
