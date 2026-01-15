# Ralph Wiggum Iteration System

## Overview

The Ralph Wiggum approach is an iterative AI development methodology where a prompt is repeatedly fed to Claude until completion criteria are met. Progress lives in files and git history, not context.

**Why "Ralph Wiggum"?** Like the Simpsons character who keeps trying until something works, this system keeps iterating until the job is done - simple, persistent, effective.

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                   Ralph Loop                         │
│                                                      │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│   │  Read    │───▶│  Claude  │───▶│  Check   │     │
│   │  Prompt  │    │  Does    │    │  Done?   │     │
│   └──────────┘    │  Work    │    └────┬─────┘     │
│        ▲          └──────────┘         │           │
│        │                               │           │
│        │         No ┌──────────┐       │ Yes       │
│        └────────────┤  Update  │◀──────┘           │
│                     │ Progress │      ▼            │
│                     └──────────┘   [EXIT]          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

1. **RALPH-PROMPT.md** defines the task and completion criteria
2. **ralph-loop.ps1** feeds the prompt to Claude repeatedly
3. **progress.txt** tracks what's been done
4. Loop continues until `<promise>ITERATION_COMPLETE</promise>` appears

## Quick Start

```powershell
# Navigate to dashboard directory
cd dashboard

# Run with default 10 iterations
.\scripts\ralph-loop.ps1

# Run with custom max iterations
.\scripts\ralph-loop.ps1 -MaxIterations 20

# Run with verbose output
.\scripts\ralph-loop.ps1 -Verbose
```

## Files

| File | Purpose |
|------|---------|
| `RALPH-PROMPT.md` | Main iteration prompt with tasks and completion criteria |
| `progress.txt` | Tracks improvements made across iterations |
| `scripts/ralph-loop.ps1` | PowerShell script that runs the iteration loop |
| `RALPH-README.md` | This documentation |

## Customizing the Loop

### Modifying Tasks

Edit `RALPH-PROMPT.md` to change:
- The improvement queue (list of tasks to pick from)
- Completion criteria (how many improvements needed)
- Implementation guidelines

### Adjusting Completion Criteria

In `RALPH-PROMPT.md`, modify the completion section:

```markdown
## Completion Criteria
When you've made 5+ meaningful improvements AND all tests pass:
Output: <promise>ITERATION_COMPLETE</promise>
```

Change `5+` to whatever threshold makes sense for your project.

### Adding Pre/Post Hooks

Add hooks in `.claude/settings.json` to run before or after each tool use:

```json
{
  "hooks": {
    "postToolUse": {
      "Edit": [{
        "script": "path/to/your-hook.ps1",
        "description": "Run after file edits"
      }]
    }
  }
}
```

## Progress Tracking

Each iteration appends to `progress.txt`:

```
### Improvement [N]: [Title]
- **What**: Brief description
- **Files Changed**: list of files
- **Tested**: Yes/No
- **Status**: Complete/Partial
```

The loop counts these entries to track progress toward completion.

## Best Practices

1. **Small, Focused Changes**: Each iteration should do ONE thing well
2. **Test After Each Change**: Verify the improvement works before moving on
3. **Clear Progress Logging**: Document what was done for future reference
4. **Git Commits**: Commit after each successful improvement (optional but recommended)

## Troubleshooting

### Claude CLI Not Found

Make sure Claude Code CLI is installed and in your PATH:
```powershell
claude --version
```

### Loop Exits Early

Check the completion criteria in `RALPH-PROMPT.md`. The loop exits when:
- `ITERATION_COMPLETE` appears in progress.txt
- Max iterations reached

### Claude Errors

If Claude encounters errors, they'll be logged and the loop will continue. Check the console output for details.

## Integration with Git

For automatic commits after each improvement, you can modify the loop:

```powershell
# After successful iteration
git add -A
git commit -m "Ralph iteration $iteration: [improvement summary]"
```

## Advanced: Multiple Prompt Files

You can create different prompt files for different tasks:

```powershell
# Run with a different prompt
Get-Content "RALPH-PROMPT-testing.md" | claude
```

## Related Concepts

- **Iterative Development**: Build in small increments
- **Test-Driven Development**: Verify each change works
- **Continuous Improvement**: Always be making things better
- **Context-Free Execution**: Progress lives in files, not memory
