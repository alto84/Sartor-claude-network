# Roadmap Context Injection - Quick Start Guide

## What Is This?

An automatic system that makes every Claude Code agent aware of your implementation roadmap and tracks progress for continuous improvement.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Agent Session Starts                                       │
│  ↓                                                           │
│  [inject-roadmap.sh runs]                                   │
│  ↓                                                           │
│  Agent sees:                                                │
│    • Current Phase: 0 - Bootstrap Quality Infrastructure    │
│    • Status: 0/9 tasks complete                             │
│    • Next: Git repository initialized                       │
│    • Key Pattern: Quality gates → Hooks → Standards        │
│  ↓                                                           │
│  Agent performs work (knows what to focus on!)              │
│  ↓                                                           │
│  [record-completion.sh runs after each tool use]            │
│  ↓                                                           │
│  System logs:                                               │
│    • What was completed                                     │
│    • How it was done                                        │
│    • Patterns observed                                      │
│  ↓                                                           │
│  Learning data accumulates for improvement                  │
└─────────────────────────────────────────────────────────────┘
```

## Installation Status

✓ Installed and ready to use!

**Files created:**
- `.claude/hooks/inject-roadmap.sh` - SessionStart hook
- `.claude/hooks/record-completion.sh` - PostToolUse hook  
- `.claude/settings.json` - Updated with hook registration
- `.claude/hooks/ROADMAP_HOOKS_README.md` - Full documentation
- `.claude/hooks/INSTALLATION_SUMMARY.md` - Installation details

**Data files (created automatically):**
- `.claude/.task-completion-log` - CSV log of completions
- `.claude/.learnings.jsonl` - JSON Lines for analysis

## Quick Test

Run the demonstration:
```bash
/home/user/Sartor-claude-network/.claude/hooks/test-hooks-demo.sh
```

Or test hooks individually:
```bash
# See current roadmap context
/home/user/Sartor-claude-network/.claude/hooks/inject-roadmap.sh 2>&1

# Simulate task completion
/home/user/Sartor-claude-network/.claude/hooks/record-completion.sh Bash "npm test"
```

## What Happens Automatically

### Every Session Start
Agent sees roadmap context printed to stderr:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ROADMAP CONTEXT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Phase: 0 - Bootstrap Quality Infrastructure
Status: 0/9 tasks complete
Next: Git repository initialized
Key Pattern: Quality gates → Hooks → Standards → Enforcement
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### After Tool Use (Write/Edit/Bash)
System detects completions and logs:
```
[TASK COMPLETION RECORDED]
Task: Test execution completed
Tool: Bash
Logged to: .claude/.task-completion-log
```

## View Learning Data

**See all completions:**
```bash
cat .claude/.task-completion-log
```

**Analyze with jq:**
```bash
# Count by tool type
cat .claude/.learnings.jsonl | jq -r '.tool' | sort | uniq -c

# Show recent learnings
tail -10 .claude/.learnings.jsonl | jq .
```

## Manual Phase Control

**Check current phase:**
```bash
/home/user/Sartor-claude-network/.claude/hooks/inject-roadmap.sh 2>&1 | grep "Current Phase"
```

**Override phase detection:**
```bash
# Set to Phase 2
echo "2" > .claude/.roadmap-state

# Return to automatic
rm .claude/.roadmap-state
```

## Update Roadmap Progress

Edit `IMPLEMENTATION_ORDER.md` and mark tasks complete:
```markdown
### Entry Criteria
- [x] Git repository initialized        ← Changed from [ ] to [x]
- [ ] Claude Code CLI available         ← Still incomplete
```

Hooks automatically detect the change on next session.

## Common Tasks

**View current phase:**
```bash
.claude/hooks/inject-roadmap.sh 2>&1
```

**Count tasks completed:**
```bash
wc -l < .claude/.task-completion-log
```

**Find what agents are working on:**
```bash
grep -i "test" .claude/.task-completion-log
```

**Success rate:**
```bash
total=$(cat .claude/.learnings.jsonl | wc -l)
success=$(cat .claude/.learnings.jsonl | jq -r 'select(.outcome == "success")' | wc -l)
echo "$success of $total succeeded"
```

## Benefits

### For You
- **Visibility:** See what agents are learning
- **Progress:** Track task completion automatically
- **Data:** Analyze patterns in JSONL format
- **Alignment:** All agents work toward same goals

### For Agents
- **Context:** Know current phase instantly
- **Focus:** See next task to tackle
- **Learning:** Contribute to collective knowledge
- **Efficiency:** No "what should I do?" questions

### For System
- **Self-documenting:** Audit trail of all work
- **Pattern recognition:** Data reveals what works
- **Continuous improvement:** Gets better over time
- **Evidence-based:** Changes backed by data

## Troubleshooting

**Hook not running?**
- Check: `ls -l .claude/hooks/*.sh` (should be executable)
- Verify: `grep sessionStart .claude/settings.json`

**Wrong phase detected?**
- Check: `cat .claude/.roadmap-state` (remove if exists)
- Verify: Checkbox format in `IMPLEMENTATION_ORDER.md`

**No logs created?**
- Create manually: `touch .claude/.task-completion-log`
- Test hook: `.claude/hooks/record-completion.sh Bash "echo test"`

## Next Steps

1. **Start using it:** Just begin a new session - hooks run automatically
2. **Monitor progress:** Check `.task-completion-log` periodically  
3. **Analyze patterns:** Use jq to find insights
4. **Update roadmap:** Mark tasks [x] as you complete them
5. **Read more:** See `ROADMAP_HOOKS_README.md` for details

## Documentation

- **Full Guide:** `.claude/hooks/ROADMAP_HOOKS_README.md`
- **Installation Details:** `.claude/hooks/INSTALLATION_SUMMARY.md`
- **Roadmap:** `IMPLEMENTATION_ORDER.md`

## Demo

Watch it in action:
```bash
/home/user/Sartor-claude-network/.claude/hooks/test-hooks-demo.sh
```

---

**Status:** ✓ Ready to use
**Version:** 1.0.0
**Date:** 2025-12-06

**Every agent session now automatically receives roadmap context!**
