# Delegation Reminder Hook

## Purpose

Reminds the orchestrator (main Claude Code instance) to delegate work to subagents instead of doing substantial implementation directly.

## Problem

The orchestrator frequently forgets its role as a coordinator and starts:

- Implementing features directly
- Searching the codebase for implementation details
- Writing multi-file changes
- Doing research tasks

This violates the core directive: **Orchestrator coordinates, subagents execute.**

## Solution

A pre-tool hook (`delegation-reminder.sh`) that:

1. Detects when the orchestrator is about to do substantial work
2. Shows a reminder to delegate (max once every 5 minutes)
3. Provides clear guidance on what to delegate vs do directly
4. Non-blocking (doesn't prevent the work, just reminds)

## How It Works

### Trigger Detection

The hook runs before these tools:

- **Edit**: When editing files in `src/`, `lib/`, or `services/`
- **Write**: When creating files in implementation directories
- **Grep**: After multiple searches (3+ in a session)

### Cooldown System

- Reminder shows max once every 5 minutes
- Prevents annoyance from repeated warnings
- Resets after cooldown period expires
- State tracked in `/tmp/claude_delegation_reminder_last_shown`

### What Gets Flagged

**Substantial Work (triggers reminder):**

- Editing files in `src/`, `lib/`, `services/`
- Creating new implementation files
- Multiple consecutive searches (research behavior)

**Non-Substantial Work (no reminder):**

- Editing `.claude/` config files
- Editing `.md` documentation
- Single edits or searches
- Synthesizing results
- Updating todo lists

## The Reminder

When triggered, shows:

```
╔════════════════════════════════════════════════════════════════╗
║              ORCHESTRATOR DELEGATION REMINDER                  ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  You are the ORCHESTRATOR. Your role is COORDINATION.         ║
║                                                                ║
║  Before doing substantial work directly, ask:                 ║
║  • Can a subagent do this?                                    ║
║  • Could this be parallelized?                                ║
║  • Am I synthesizing results, or doing direct execution?      ║
║                                                                ║
║  DELEGATE to subagents for:                                   ║
║  ✓ Codebase searches (Explore agent)                          ║
║  ✓ Implementation work (IMPLEMENTER agent)                    ║
║  ✓ Code audits (AUDITOR agent)                                ║
║  ✓ Multi-file edits (IMPLEMENTER agent)                       ║
║  ✓ Research tasks (general-purpose agent)                     ║
║                                                                ║
║  DO DIRECTLY only when:                                       ║
║  ✓ Simple one-line edits                                      ║
║  ✓ Synthesizing agent results                                 ║
║  ✓ Updating todo lists                                        ║
║  ✓ Coordination tasks                                         ║
║                                                                ║
║  Use Task tool to spawn subagents.                            ║
║  See: .claude/SPAWNING_TEMPLATE.md                            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

## Configuration

### Enable/Disable

Edit `.claude/settings.json`:

```json
{
  "preToolUse": {
    "Edit": {
      "script": "/home/user/Sartor-claude-network/.claude/hooks/delegation-reminder.sh",
      "enabled": true // Set to false to disable
    }
  }
}
```

### Adjust Cooldown

Edit `delegation-reminder.sh`:

```bash
COOLDOWN_SECONDS=300  # Change to desired seconds (default: 300 = 5 minutes)
```

### Customize Detection

Edit `is_substantial_work()` function in `delegation-reminder.sh`:

```bash
# Add more patterns to detect
if [[ "$context" =~ (your/custom/path/) ]]; then
    return 0  # This is substantial
fi
```

## Testing

### Manual Test

```bash
# Test with implementation file (should show reminder)
./.claude/hooks/delegation-reminder.sh "Edit" "src/memory/test.ts"

# Test with config file (should NOT show reminder)
./.claude/hooks/delegation-reminder.sh "Edit" ".claude/settings.json"

# Test cooldown (should NOT show second time)
./.claude/hooks/delegation-reminder.sh "Edit" "src/memory/test2.ts"
```

### Reset Cooldown

```bash
rm -f /tmp/claude_delegation_reminder_last_shown
```

## Integration with Other Systems

This hook works alongside:

1. **ORCHESTRATOR_BOOTSTRAP.md**: Enhanced with stronger delegation language
2. **Memory MCP**: mem_directive_001 contains the core directive
3. **SPAWNING_TEMPLATE.md**: Provides templates for delegation
4. **Quality hooks**: Runs before quality-check.sh and safety-check.sh

## Effectiveness Metrics

Track these to measure effectiveness:

1. **Delegation Rate**: % of substantial tasks delegated vs done directly
2. **Reminder Frequency**: How often reminders are shown per session
3. **False Positive Rate**: % of reminders shown for legitimate direct work
4. **Agent Spawn Rate**: Number of subagents spawned per session (should increase)

## Troubleshooting

### Reminder Not Showing

1. Check hook is enabled in `.claude/settings.json`
2. Verify file has execute permissions: `chmod +x delegation-reminder.sh`
3. Check cooldown hasn't been triggered: `rm -f /tmp/claude_delegation_reminder_last_shown`
4. Verify pattern matching in `is_substantial_work()`

### Too Many Reminders

1. Increase `COOLDOWN_SECONDS` in the script
2. Tighten detection criteria in `is_substantial_work()`
3. Add more exclusions for legitimate direct work

### Reminder Showing for Direct Work

1. Add patterns to exclude in `is_substantial_work()`
2. Document as false positive and adjust detection logic
3. Consider context-specific exclusions

## Design Rationale

### Why Pre-Tool Hook?

- Catches work **before** it starts
- Provides opportunity to reconsider approach
- Non-blocking (doesn't prevent legitimate work)
- Aligns with "pause and ask" philosophy

### Why Cooldown System?

- Prevents annoyance from repeated reminders
- User requested "every 5-10 minutes" timing
- Balances awareness with usability
- Respects user's workflow

### Why Non-Blocking?

- Sometimes direct work IS appropriate
- Orchestrator should have judgment
- Hook provides awareness, not enforcement
- Trust but verify approach

### Why Detect Substantial Work?

- Not all work requires delegation
- Simple edits are fine to do directly
- Focus reminder on high-impact patterns
- Reduce false positives

## Future Enhancements

Potential improvements:

1. **Learn from overrides**: Track when reminder is ignored for legitimate work
2. **Context-aware detection**: Use git diff to estimate work complexity
3. **Integration with Task tool**: Auto-suggest delegation templates
4. **Metrics dashboard**: Show delegation patterns over time
5. **Adaptive cooldown**: Adjust based on compliance rate

## See Also

- `.claude/ORCHESTRATOR_BOOTSTRAP.md` - Core orchestrator protocol
- `.claude/SPAWNING_TEMPLATE.md` - How to delegate to subagents
- `.claude/hooks/README.md` - General hooks documentation
- `CLAUDE.md` - Full system documentation
