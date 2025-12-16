# Roadmap Skill - Dynamic Implementation Plan Access

**Version:** 1.0.0
**Status:** Stable
**Created:** 2025-12-06

## Overview

The Roadmap Skill provides dynamic, stateful access to the implementation plan, enabling any agent to query "What should I work on?" with context-aware task recommendations. It tracks progress automatically through hooks integration and maintains a shared understanding of project status across all agents.

## Key Features

- **Progressive Loading**: Minimal token overhead (~35 tokens for summary)
- **Stateful Tracking**: Persistent storage of task completions and agent assignments
- **Hooks Integration**: Automatic context injection at session start
- **Multi-Agent Coordination**: Shared roadmap state across all agents
- **Automatic Progress Tracking**: Detects phase completions and moves to next phase

## Quick Start

### For Agents: Query the Roadmap

```typescript
import { getRoadmapSummary, getNextTasks, getCurrentPhase } from '@/skills';

// Get quick summary (~100 tokens for context)
const summary = getRoadmapSummary();
console.log(summary);
// Output:
// 📍 Current: Phase 4 - Memory System Implementation (pending)
// 📊 Progress: 0/8 tasks (0%)
// 🎯 Objective: Implement tiered memory architecture validated by all skills
//
// 🔜 Next Tasks:
//   1. Implement Hot Tier (Firebase Realtime Database)
//   2. Implement Warm Tier (Firestore + Vector Database)
//   3. Implement Cold Tier (GitHub Storage)

// Get specific next tasks
const nextTasks = getNextTasks(3);
nextTasks.forEach((task) => {
  console.log(`${task.id}: ${task.description}`);
  console.log(`  Priority: ${task.priority}, Estimated: ${task.estimatedHours}h`);
});

// Get current phase details
const phase = getCurrentPhase();
console.log(`Phase: ${phase.name}`);
console.log(`Status: ${phase.status}`);
console.log(`Entry Conditions:`, phase.entryConditions);
console.log(`Exit Conditions:`, phase.exitConditions);
```

### Update Task Status

```typescript
import { updateTaskStatus } from '@/skills';

// Mark task as in-progress
updateTaskStatus('task-4-1', 'in_progress', 'agent-firebase-dev');

// Mark task as completed
updateTaskStatus('task-4-1', 'completed', 'agent-firebase-dev');
```

### Use the RoadmapManager Directly

```typescript
import { RoadmapManager } from '@/skills';

const manager = new RoadmapManager();

// Get all phases
const allPhases = manager.getAllPhases();
allPhases.forEach((phase) => {
  console.log(`${phase.id}: ${phase.name} - ${phase.status}`);
});

// Get detailed summary object
const summary = manager.getRoadmapSummaryObject();
console.log(`Current Phase: ${summary.currentPhaseName}`);
console.log(`Progress: ${summary.progressPercentage}%`);
console.log(`Blockers:`, summary.blockers);
console.log(`Next Tasks:`, summary.nextTasks);

// Add custom task
manager.addTask({
  id: 'task-4-custom',
  phaseId: 'phase-4',
  description: 'Custom Firebase optimization task',
  status: 'pending',
  priority: 5,
  estimatedHours: 10,
});

// Increment refinement loops
manager.incrementRefinementLoops('task-4-1');
```

## Hooks Integration

The roadmap is automatically injected into agent sessions via the `sessionStart` hook.

### Configuration

Located in `/home/user/Sartor-claude-network/.claude/settings.json`:

```json
{
  "hooks": {
    "sessionStart": {
      "script": "/home/user/Sartor-claude-network/.claude/hooks/inject-roadmap.sh",
      "description": "Inject roadmap context into every agent session for awareness",
      "enabled": true
    }
  }
}
```

### Hook Flow

```
Agent Session Start
    ↓
inject-roadmap.sh
    ↓
roadmap-context.sh
    ↓
Compile TypeScript (if needed)
    ↓
Execute roadmap-helper.js
    ↓
Load RoadmapManager
    ↓
Display Summary to Agent
```

### Fallback Behavior

If TypeScript compilation fails or Node.js is unavailable, the hook displays a static fallback summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ROADMAP CONTEXT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Current Phase: Phase 4 - Memory System Implementation
🎯 Objective: Implement tiered memory architecture

🔜 Next Tasks:
  1. Implement Hot Tier (Firebase Realtime Database)
  2. Implement Warm Tier (Firestore + Vector Database)
  3. Implement Cold Tier (GitHub Storage)

For detailed roadmap, see: /home/user/Sartor-claude-network/IMPLEMENTATION_ORDER.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ IMPLEMENTATION_ORDER.md (Source of Truth)                   │
│ - Defines phases 0-5                                        │
│ - Lists all tasks with priorities                           │
│ - Specifies entry/exit conditions                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ roadmap-skill.ts (RoadmapManager)                           │
│ - Loads roadmap definition                                  │
│ - Manages state persistence                                 │
│ - Tracks task completions                                   │
│ - Handles phase transitions                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ .claude/roadmap-state.json (Persistent State)               │
│ - Current phase                                             │
│ - Task statuses (pending/in_progress/completed)             │
│ - Agent assignments                                         │
│ - Refinement loop counts                                    │
│ - Last updated timestamp                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Agents (Query Interface)                                    │
│ - getRoadmapSummary() - Quick context                       │
│ - getNextTasks() - What to work on                          │
│ - getCurrentPhase() - Phase details                         │
│ - updateTaskStatus() - Mark progress                        │
└─────────────────────────────────────────────────────────────┘
```

### State File Format

```json
{
  "currentPhase": "phase-4",
  "phases": {
    "phase-0": { "status": "completed", "tasks": [...] },
    "phase-1": { "status": "completed", "tasks": [...] },
    "phase-4": { "status": "in_progress", "tasks": [...] }
  },
  "tasks": {
    "task-4-1": {
      "id": "task-4-1",
      "phaseId": "phase-4",
      "description": "Implement Hot Tier...",
      "status": "in_progress",
      "assignedAgent": "agent-firebase-dev",
      "priority": 1,
      "estimatedHours": 40,
      "refinementLoops": 2
    }
  },
  "lastUpdated": "2025-12-06T21:45:00.000Z"
}
```

## API Reference

### Functions

#### `getRoadmapSummary(): string`

Returns a quick roadmap summary (~100 tokens) for agent context.

**Returns:** Formatted string with current phase, progress, and next tasks.

#### `getNextTasks(limit?: number): RoadmapTask[]`

Gets the next tasks to work on (up to `limit`, default 5).

**Parameters:**

- `limit` (optional): Maximum number of tasks to return (default: 5)

**Returns:** Array of pending tasks sorted by priority.

#### `getCurrentPhase(): RoadmapPhase | null`

Gets the current phase details.

**Returns:** Current phase object or null if no phase found.

#### `updateTaskStatus(taskId: string, status: TaskStatus, assignedAgent?: string): void`

Updates task status and optionally assigns an agent.

**Parameters:**

- `taskId`: Task identifier
- `status`: 'pending' | 'in_progress' | 'completed'
- `assignedAgent` (optional): Agent identifier

**Side Effects:** Saves state to disk, may trigger phase completion check.

#### `getRoadmapSummaryObject(): RoadmapSummary`

Gets detailed roadmap summary as structured object.

**Returns:** Object with currentPhase, nextTasks, progress, blockers.

### Classes

#### `RoadmapManager`

**Constructor:**

```typescript
new RoadmapManager(stateFilePath?: string)
```

**Methods:**

- `getCurrentPhase(): RoadmapPhase | null`
- `getAllPhases(): RoadmapPhase[]`
- `getNextTasks(limit?: number): RoadmapTask[]`
- `getInProgressTasks(): RoadmapTask[]`
- `updateTaskStatus(taskId, status, assignedAgent?): void`
- `getRoadmapSummary(): string`
- `getRoadmapSummaryObject(): RoadmapSummary`
- `addTask(task: RoadmapTask): void`
- `incrementRefinementLoops(taskId: string): void`

### Types

```typescript
interface RoadmapPhase {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  tasks: RoadmapTask[];
  dependencies: string[];
  entryConditions: string[];
  exitConditions: string[];
  duration?: string;
  objective?: string;
}

interface RoadmapTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedAgent?: string;
  refinementLoops?: number;
  phaseId: string;
  priority?: number;
  estimatedHours?: number;
}

interface RoadmapSummary {
  currentPhase: string;
  currentPhaseName: string;
  nextTasks: RoadmapTask[];
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
  blockers: string[];
}
```

## Token Budget

The Roadmap Skill is optimized for minimal token overhead:

- **Level 1 (Always Loaded):** 35 tokens - Summary in manifest
- **Level 2 (On-Demand):** 400 tokens - Full instructions and examples
- **Level 3 (Resources):** 1000 tokens avg - IMPLEMENTATION_ORDER.md reference
- **Runtime Summary:** ~100 tokens - Quick context for agents

Total overhead for always-loaded context: **35 tokens**

## Integration with Other Skills

### Evidence-Based Validation

Roadmap tasks are validated against documented phases in IMPLEMENTATION_ORDER.md.

### Multi-Agent Orchestration

Orchestrator can query roadmap to assign tasks to worker agents based on current phase priorities.

### Self-Improvement Loop

Task completion patterns and refinement loops are tracked for learning and optimization.

### Refinement Loop

The `refinementLoops` counter tracks how many times a task has been refined, enabling quality metrics.

## Usage Patterns

### Pattern 1: Agent Task Assignment

```typescript
import { getNextTasks, updateTaskStatus } from '@/skills';

// Agent asks: "What should I work on?"
const tasks = getNextTasks(1);
const task = tasks[0];

// Claim the task
updateTaskStatus(task.id, 'in_progress', 'my-agent-id');

// Do the work...
// ...

// Mark complete
updateTaskStatus(task.id, 'completed', 'my-agent-id');
```

### Pattern 2: Progress Reporting

```typescript
import { getRoadmapSummaryObject } from '@/skills';

const summary = getRoadmapSummaryObject();

const report = `
# Project Status Report

**Current Phase:** ${summary.currentPhaseName}
**Overall Progress:** ${summary.progressPercentage}%
**Completed Tasks:** ${summary.completedTasks}/${summary.totalTasks}

## Next Priorities

${summary.nextTasks
  .map((task, idx) => `${idx + 1}. ${task.description} (${task.estimatedHours}h)`)
  .join('\n')}

${summary.blockers.length > 0 ? `## Blockers\n${summary.blockers.join('\n')}` : ''}
`;

console.log(report);
```

### Pattern 3: Multi-Agent Coordination

```typescript
import { getNextTasks, updateTaskStatus, getCurrentPhase } from '@/skills';

// Orchestrator distributes work
const phase = getCurrentPhase();
const tasks = getNextTasks(10);

// Assign to available agents
const agents = ['agent-1', 'agent-2', 'agent-3'];
agents.forEach((agentId, idx) => {
  if (tasks[idx]) {
    updateTaskStatus(tasks[idx].id, 'in_progress', agentId);
    console.log(`Assigned ${tasks[idx].id} to ${agentId}`);
  }
});
```

## Testing

### Manual Testing

```bash
# Compile TypeScript
cd /home/user/Sartor-claude-network
npx tsc src/skills/roadmap-skill.ts --outDir dist --module commonjs --target es2020 --esModuleInterop --skipLibCheck

# Run roadmap context hook manually
./.claude/hooks/roadmap-context.sh

# View full roadmap
./.claude/hooks/roadmap-context.sh --full
```

### Programmatic Testing

```typescript
import { RoadmapManager } from '@/skills/roadmap-skill';

// Use custom state file for testing
const manager = new RoadmapManager('/tmp/test-roadmap-state.json');

// Test task updates
const task = manager.getNextTasks(1)[0];
manager.updateTaskStatus(task.id, 'in_progress', 'test-agent');

// Verify state
const summary = manager.getRoadmapSummaryObject();
console.assert(summary.nextTasks[0].id !== task.id, 'Task should be removed from next tasks');

// Cleanup
fs.unlinkSync('/tmp/test-roadmap-state.json');
```

## Troubleshooting

### Issue: Hook not displaying roadmap

**Symptoms:** No roadmap context shown at session start

**Solutions:**

1. Check hook is enabled in `.claude/settings.json`
2. Verify script has execute permissions: `chmod +x .claude/hooks/*.sh`
3. Check Node.js is installed: `which node`
4. Try manual execution: `./.claude/hooks/inject-roadmap.sh`

### Issue: State file not updating

**Symptoms:** Task status changes don't persist

**Solutions:**

1. Check write permissions: `.claude/` directory must be writable
2. Verify state file path: default is `.claude/roadmap-state.json`
3. Check for file system errors in logs
4. Try deleting state file to reinitialize: `rm .claude/roadmap-state.json`

### Issue: TypeScript compilation fails

**Symptoms:** Hook shows fallback summary instead of dynamic roadmap

**Solutions:**

1. Install TypeScript: `npm install -g typescript`
2. Check tsconfig exists: `cat tsconfig.json`
3. Compile manually: `npx tsc src/skills/roadmap-skill.ts --outDir dist --module commonjs`
4. Check compilation errors in output

## Future Enhancements

### Planned Features

1. **Task Dependencies**: Model dependencies between tasks within a phase
2. **Time Tracking**: Record actual hours spent vs estimated hours
3. **Velocity Metrics**: Calculate team velocity based on completed tasks
4. **Slack Integration**: Send progress updates to Slack channels
5. **GitHub Integration**: Sync task status with GitHub Issues
6. **Gantt Chart Generation**: Visualize roadmap as timeline
7. **Risk Detection**: Identify tasks at risk of delay
8. **Resource Allocation**: Suggest optimal agent assignments

### Extension Points

The Roadmap Skill is designed for extensibility:

- Custom task types via `RoadmapTask` extension
- Custom phase types via `RoadmapPhase` extension
- Custom state storage backends (currently file-based)
- Custom summary formatters
- Custom progress visualizations

## References

- **Source Code:** `/home/user/Sartor-claude-network/src/skills/roadmap-skill.ts`
- **Hooks:** `/home/user/Sartor-claude-network/.claude/hooks/roadmap-context.sh`
- **Manifest:** `/home/user/Sartor-claude-network/src/skills/skill-manifest.ts` (ROADMAP_SKILL)
- **Implementation Plan:** `/home/user/Sartor-claude-network/IMPLEMENTATION_ORDER.md`

## Support

For issues or questions:

1. Check this documentation
2. Review implementation in `roadmap-skill.ts`
3. Test hooks manually
4. Check state file format

---

**Version:** 1.0.0
**Last Updated:** 2025-12-06
**Maintainer:** Sartor Architecture Team
