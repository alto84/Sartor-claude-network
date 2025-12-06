# Roadmap Context Injection Hooks

## Overview

This hook system automatically injects roadmap context into every Claude Code agent session and tracks task completion for continuous self-improvement. Every agent that starts knows where you are in the implementation roadmap and contributes to learning.

## Architecture

```
Session Start
     │
     ├─→ inject-roadmap.sh
     │   ├─ Reads IMPLEMENTATION_ORDER.md
     │   ├─ Determines current phase
     │   ├─ Counts completed tasks
     │   └─ Outputs context to stderr
     │
Agent Works
     │
     ├─→ record-completion.sh (PostToolUse)
     │   ├─ Detects task completion
     │   ├─ Logs to .task-completion-log
     │   ├─ Stores learnings in .learnings.jsonl
     │   └─ Suggests next task
     │
Loop Continues...
```

## Hook Details

### 1. inject-roadmap.sh (SessionStart Hook)

**Purpose:** Automatically inject roadmap context into every agent session

**How it works:**
1. Reads `/home/user/Sartor-claude-network/IMPLEMENTATION_ORDER.md`
2. Determines current phase by checking task completion checkboxes
3. Counts completed vs. total tasks in current phase
4. Identifies next uncompleted task
5. Outputs formatted context to stderr for agent awareness

**Output Format:**
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

**State Management:**
- Checks `.claude/.roadmap-state` file for manually set phase
- Falls back to automatic detection based on checkbox status
- Can be overridden by creating `.claude/.roadmap-state` with phase number (0-5)

**Key Patterns by Phase:**
- Phase 0: Quality gates → Hooks → Standards → Enforcement
- Phase 1: Evidence-Based Validation → Self-Validating Skills
- Phase 2: Communication → Orchestration → Coordination
- Phase 3: Parallel Development → Specialized Skills
- Phase 4: Hot → Warm → Cold → Memory Tiers
- Phase 5: Integration → Self-Improvement → Evolution

### 2. record-completion.sh (PostToolUse Hook)

**Purpose:** Detect task completion and record outcomes for self-improvement

**How it works:**
1. Monitors Write, Edit, and Bash tool usage
2. Applies heuristics to detect task completion:
   - **Write tool:** New skill files, test files, source files
   - **Edit tool:** Roadmap checkbox updates
   - **Bash tool:** Test runs, git commits
3. Logs completions with timestamp
4. Extracts learnings from patterns
5. Suggests next task from roadmap

**Output Format:**
```
[COMPLETION] Detected potential task completion: Test execution completed
[COMPLETION] To mark complete, manually edit: /home/user/Sartor-claude-network/IMPLEMENTATION_ORDER.md
[LEARNING] Tests executed - verify coverage maintained at 85%+

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[TASK COMPLETION RECORDED]
Task: Test execution completed
Tool: Bash
Logged to: /home/user/Sartor-claude-network/.claude/.task-completion-log
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Data Files:**

#### `.task-completion-log` (CSV format)
```
timestamp|tool|task|outcome
2025-12-06T21:46:15Z|Bash|Test execution completed|success
2025-12-06T21:50:32Z|Write|Created deliverable: skill.md|success
```

#### `.learnings.jsonl` (JSON Lines format)
```json
{"timestamp":"2025-12-06T21:46:15Z","tool":"Bash","task":"Test execution completed","outcome":"success"}
{"timestamp":"2025-12-06T21:50:32Z","tool":"Write","task":"Created deliverable: skill.md","outcome":"success"}
```

**Task Detection Heuristics:**
- Skill file creation: `*.claude/skills/*/*.md`
- Test file creation: `tests/**/*.test.{js,ts}`
- Source file creation: `src/**/*.{js,ts}`
- Roadmap updates: Edits to `IMPLEMENTATION_ORDER.md`
- Test execution: `npm test`, `jest`, `npm run test`
- Milestone commits: `git commit`

**Learning Extraction:**
- Write tool → "Created new file - verify tests and documentation added"
- Edit tool → "Modified existing file - verify quality hooks passed"
- Bash (test) → "Tests executed - verify coverage maintained at 85%+"
- Bash (commit) → "Code committed - verify hooks validated changes"

## Configuration

### settings.json Registration

The hooks are registered in `.claude/settings.json`:

```json
{
  "hooks": {
    "sessionStart": {
      "script": "/home/user/Sartor-claude-network/.claude/hooks/inject-roadmap.sh",
      "description": "Inject roadmap context into every agent session for awareness",
      "enabled": true
    },
    "postToolUse": {
      "Edit": [
        {
          "script": "/home/user/Sartor-claude-network/.claude/hooks/record-completion.sh",
          "args": ["Edit", "${file_path}"],
          "description": "Detect and record task completion for self-improvement",
          "enabled": true,
          "blocking": false
        }
      ],
      "Write": [
        {
          "script": "/home/user/Sartor-claude-network/.claude/hooks/record-completion.sh",
          "args": ["Write", "${file_path}"],
          "description": "Detect and record task completion for self-improvement",
          "enabled": true,
          "blocking": false
        }
      ],
      "Bash": {
        "script": "/home/user/Sartor-claude-network/.claude/hooks/record-completion.sh",
        "args": ["Bash", "${command}"],
        "description": "Detect and record task completion from bash commands",
        "enabled": true,
        "blocking": false
      }
    }
  }
}
```

## Usage

### Automatic Operation

Hooks run automatically:
- **SessionStart:** Runs when Claude Code session starts
- **PostToolUse:** Runs after Write, Edit, or Bash tool usage

No manual intervention required.

### Manual Phase Control

Override automatic phase detection:

```bash
# Set current phase manually (0-5)
echo "2" > .claude/.roadmap-state

# Remove to return to automatic detection
rm .claude/.roadmap-state
```

### Viewing Logs

**Task completion log:**
```bash
cat .claude/.task-completion-log
```

**Learnings (JSONL):**
```bash
cat .claude/.learnings.jsonl
```

**Parse learnings with jq:**
```bash
cat .claude/.learnings.jsonl | jq .
```

**Filter by tool:**
```bash
grep "Bash" .claude/.task-completion-log
cat .claude/.learnings.jsonl | jq 'select(.tool == "Bash")'
```

**Count completions by tool:**
```bash
cat .claude/.learnings.jsonl | jq -r '.tool' | sort | uniq -c
```

### Testing Hooks

**Test inject-roadmap.sh:**
```bash
/home/user/Sartor-claude-network/.claude/hooks/inject-roadmap.sh 2>&1
```

**Test record-completion.sh:**
```bash
# Simulate Write tool
/home/user/Sartor-claude-network/.claude/hooks/record-completion.sh Write /path/to/file.md

# Simulate Bash tool
/home/user/Sartor-claude-network/.claude/hooks/record-completion.sh Bash "npm test"
```

## Self-Improvement Loop

The system enables continuous learning:

1. **Capture:** Hooks record every task completion
2. **Analyze:** JSONL data can be analyzed for patterns
3. **Learn:** Identify successful vs. problematic patterns
4. **Improve:** Update skill prompts based on learnings
5. **Validate:** Evidence-Based Validation reviews changes
6. **Deploy:** Improved skills used in next session

### Example Analysis

**Find most common task types:**
```bash
cat .claude/.learnings.jsonl | jq -r '.task' | sort | uniq -c | sort -rn
```

**Calculate success rate:**
```bash
total=$(cat .claude/.learnings.jsonl | wc -l)
success=$(cat .claude/.learnings.jsonl | jq -r 'select(.outcome == "success")' | wc -l)
echo "scale=2; ($success / $total) * 100" | bc
```

**Time series analysis:**
```bash
cat .claude/.learnings.jsonl | jq -r '[.timestamp, .tool, .outcome] | @csv'
```

## Benefits

### For Agents
- **Context Awareness:** Every agent knows current phase and priorities
- **Alignment:** All agents work toward same roadmap goals
- **Learning:** Agents contribute to collective knowledge
- **Efficiency:** No need to ask "what should I work on?"

### For Users
- **Transparency:** See what agents are learning
- **Progress Tracking:** Automatic task completion logging
- **Data-Driven:** JSONL format enables analysis
- **Continuous Improvement:** System gets better over time

### For System
- **Self-Documenting:** Learnings create audit trail
- **Pattern Recognition:** Data reveals successful approaches
- **Quality Feedback:** Detect recurring issues
- **Evidence-Based Evolution:** Changes backed by data

## Maintenance

### Log Rotation

Logs grow over time. Implement rotation:

```bash
# Archive old logs (weekly)
timestamp=$(date +%Y%m%d)
cp .claude/.task-completion-log .claude/.task-completion-log.$timestamp
cp .claude/.learnings.jsonl .claude/.learnings.jsonl.$timestamp

# Truncate current logs
> .claude/.task-completion-log
> .claude/.learnings.jsonl
```

### Performance

Hooks are designed for minimal overhead:
- **inject-roadmap.sh:** <100ms (runs once per session)
- **record-completion.sh:** <50ms (runs after tool use)
- **Non-blocking:** Don't delay agent operations

### Debugging

Enable verbose output:

```bash
# Add to top of hook scripts
set -x  # Print commands as they execute
```

Check hook execution:
```bash
# Claude Code logs show hook output
# Look for [ROADMAP CONTEXT] and [TASK COMPLETION RECORDED] markers
```

## Extending the System

### Add New Task Detection Heuristics

Edit `detect_task_completion()` in `record-completion.sh`:

```bash
detect_task_completion() {
    case "$tool" in
        "NewTool")
            # Add detection logic
            echo "Detected new task type"
            ;;
    esac
}
```

### Add New Learning Patterns

Edit `extract_learning()` in `record-completion.sh`:

```bash
extract_learning() {
    case "$tool" in
        "NewTool")
            learning="New learning pattern"
            ;;
    esac
}
```

### Custom Phase Patterns

Edit `get_key_pattern()` in `inject-roadmap.sh`:

```bash
get_key_pattern() {
    case $phase_num in
        6)
            echo "New Phase Pattern"
            ;;
    esac
}
```

## Troubleshooting

### Hook Not Running

1. Check hook is executable: `ls -l .claude/hooks/inject-roadmap.sh`
2. Verify registration in `.claude/settings.json`
3. Check `enabled: true` in settings
4. Look for errors in Claude Code output

### Wrong Phase Detected

1. Check `.claude/.roadmap-state` doesn't exist (or contains correct phase)
2. Verify checkbox format in `IMPLEMENTATION_ORDER.md`: `- [x]` or `- [ ]`
3. Test detection: `.claude/hooks/inject-roadmap.sh 2>&1`

### Logs Not Created

1. Verify write permissions: `touch .claude/.task-completion-log`
2. Check disk space: `df -h`
3. Run hook manually with verbose output: `bash -x .claude/hooks/record-completion.sh Write test.md`

## Future Enhancements

Potential improvements:
- **ML-based learning:** Train model on `.learnings.jsonl` data
- **Predictive suggestions:** Recommend tasks based on patterns
- **Automated roadmap updates:** Mark checkboxes automatically (with validation)
- **Skill performance tracking:** Correlate learnings with skill usage
- **Integration with memory system:** Store learnings in warm/cold tiers
- **Dashboard:** Visualize progress and patterns
- **Alerts:** Notify when phase complete or issues detected

## References

- [IMPLEMENTATION_ORDER.md](/home/user/Sartor-claude-network/IMPLEMENTATION_ORDER.md) - The roadmap
- [.claude/settings.json](/home/user/Sartor-claude-network/.claude/settings.json) - Hook configuration
- [Claude Code Hooks Documentation](https://docs.anthropic.com/claude-code/hooks)
- [Evidence-Based Validation Principles](/home/user/Sartor-claude-network/.claude/hooks/README.md)

---

**Version:** 1.0.0
**Created:** 2025-12-06
**Status:** Active and operational
