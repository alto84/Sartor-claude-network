# Roadmap Skill - Quick Start for Agents

## What is this?

The Roadmap Skill lets any agent query "What should I work on?" and get context-aware task recommendations with automatic progress tracking.

## For Agents: TL;DR

```typescript
import { getRoadmapSummary, getNextTasks, updateTaskStatus } from '@/skills';

// 1. See what's happening
console.log(getRoadmapSummary());

// 2. Get next task
const task = getNextTasks(1)[0];

// 3. Claim it
updateTaskStatus(task.id, 'in_progress', 'my-agent-id');

// 4. Do the work...

// 5. Mark complete
updateTaskStatus(task.id, 'completed', 'my-agent-id');
```

## Common Queries

### "What should I work on?"
```typescript
const tasks = getNextTasks(3);
tasks.forEach(t => console.log(`${t.id}: ${t.description} (${t.priority})`));
```

### "Where are we in the roadmap?"
```typescript
const phase = getCurrentPhase();
console.log(`Phase: ${phase.name} (${phase.status})`);
console.log(`Objective: ${phase.objective}`);
```

### "What's our progress?"
```typescript
const summary = getRoadmapSummaryObject();
console.log(`Progress: ${summary.progressPercentage}%`);
console.log(`Done: ${summary.completedTasks}/${summary.totalTasks}`);
```

### "What's blocking us?"
```typescript
const summary = getRoadmapSummaryObject();
if (summary.blockers.length > 0) {
  console.log('Blockers:', summary.blockers);
}
```

## API Quick Reference

| Function | Returns | Purpose |
|----------|---------|---------|
| `getRoadmapSummary()` | string | Human-readable summary (~100 tokens) |
| `getNextTasks(n?)` | RoadmapTask[] | Next n tasks (default 5) |
| `getCurrentPhase()` | RoadmapPhase | Current phase details |
| `updateTaskStatus(id, status, agent?)` | void | Update task progress |
| `getRoadmapSummaryObject()` | RoadmapSummary | Structured summary data |

## Task Statuses

```typescript
'pending'      // Not started
'in_progress'  // Someone working on it
'completed'    // Done!
```

## Current Roadmap (Phase 4)

**Phase:** Memory System Implementation
**Objective:** Implement tiered memory architecture

**Tasks:**
1. Implement Hot Tier (Firebase Realtime Database) - 40h
2. Implement Warm Tier (Firestore + Vector Database) - 60h
3. Implement Cold Tier (GitHub Storage) - 40h
4. Create memory system integration tests - 20h

## Best Practices

### ✅ DO
- Query roadmap at session start
- Update task status immediately
- Check for blockers before starting
- Claim tasks before working on them

### ❌ DON'T
- Skip task status updates
- Work on multiple tasks simultaneously (mark previous complete first)
- Manually edit `.claude/roadmap-state.json`
- Mark tasks complete without finishing

## Automatic Context

The roadmap is automatically displayed when you start a session:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Current: Phase 4 - Memory System Implementation (pending)
📊 Progress: 0/8 tasks (0%)
🎯 Objective: Implement tiered memory architecture validated by all skills

🔜 Next Tasks:
  1. Implement Hot Tier (Firebase Realtime Database)
  2. Implement Warm Tier (Firestore + Vector Database)
  3. Implement Cold Tier (GitHub Storage)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Token Cost

- Always-loaded summary: **35 tokens**
- Quick summary call: **~100 tokens**
- Detailed summary: **~150 tokens**

**Total overhead: 35 tokens** (always-loaded context)

## Troubleshooting

**"Where's the roadmap state stored?"**
→ `.claude/roadmap-state.json` (auto-created)

**"How do I reset the roadmap?"**
→ `rm .claude/roadmap-state.json` (will reinitialize)

**"Task status not persisting?"**
→ Check `.claude/` directory is writable

**"Hook not showing roadmap?"**
→ Run `./.claude/hooks/roadmap-context.sh` manually to debug

## Full Documentation

See `/home/user/Sartor-claude-network/src/skills/ROADMAP_SKILL.md` for complete guide.

---

**Remember:** The roadmap is your friend! Query it anytime to know what to work on.
