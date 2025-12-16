# Critical Finding: Coordinator Agent Failures

*Analysis conducted 2025-12-15*

---

## The Problem

All coordinator-spawned agents **timed out with empty output**.

**Evidence:**
```json
{
  "requestId": "req-1765833894096-rvjica",
  "status": "failed",
  "output": "",           // <-- EMPTY
  "durationMs": 600019,   // <-- Exactly 10 minutes (timeout)
  "exitCode": null        // <-- Process was killed
}
```

Three different experiments all showed the same pattern:
- 10-minute timeout
- Zero output
- Exit code null (killed, not exited)

---

## Root Cause Analysis

### Hypothesis 1: `claude -p` Has Limited Capabilities

The coordinator spawns agents with:
```javascript
spawn('claude', ['-p', prompt], { ... })
```

The `-p` flag runs Claude in **prompt mode**, which may:
- Only process the prompt and return text
- NOT have access to tools (Bash, Read, Write, etc.)
- NOT be interactive or capable of complex tasks

**Evidence**: The prompts asked agents to:
- Read files
- Write files
- Run bash commands
- Spawn child agents

If `-p` mode lacks tools, agents would be stuck trying to use unavailable capabilities.

### Hypothesis 2: Missing Permissions

Standard `claude` invocation may require:
- `--dangerously-skip-permissions` for full tool access
- User confirmation for operations
- Permission file configuration

Without these, agents may hang waiting for permission approval.

### Hypothesis 3: Working Directory Issues

The agents inherit `process.cwd()` from the coordinator, but:
- May not have correct paths to `.swarm/` directories
- May be in the wrong directory to execute their tasks

---

## Comparison: Why Task Tool Agents Work

| Aspect | Task Tool Agents | Coordinator Agents |
|--------|------------------|-------------------|
| Execution | Within Claude Code context | Separate `claude -p` process |
| Tool Access | Full (inherits parent) | Likely none (prompt mode) |
| Permissions | Inherits parent | None (requires flags) |
| Output | Captured and returned | Empty (likely stdout issue) |
| Working Dir | Correct | May be incorrect |

---

## Recommended Solutions

### Solution 1: Use Full Claude Code Mode

Instead of:
```javascript
spawn('claude', ['-p', prompt], {...})
```

Use:
```javascript
spawn('claude', [
  '--dangerously-skip-permissions',
  '-p', prompt
], {...})
```

Or for interactive sessions:
```javascript
spawn('claude', [
  '--dangerously-skip-permissions',
  '--chat'
], {...})
// Then send prompt via stdin
```

### Solution 2: Verify Tool Availability

Test what `-p` mode actually supports:
```bash
claude -p "Run: ls -la"
# Does this execute the command or just respond with text?
```

### Solution 3: Use Claude Code MCP Server Instead

The `/home/alton/claude-code-mcp-server/` spawns full Claude Code instances:
```typescript
spawn("claude", ["--chat"], {...})
```

This gives agents full capabilities including the Task tool for further nesting.

### Solution 4: Hybrid Approach

For complex tasks, use Task tool agents (internal):
- They work reliably
- They have full tool access
- They can complete within reasonable time

Reserve coordinator for:
- Simple notification tasks
- Monitoring (if prompt mode is sufficient)
- Tasks that don't require tools

---

## Key Insight

**The file-based coordinator's current implementation may not be suitable for complex agent tasks.**

The Task tool within Claude Code is the more reliable path for multi-agent coordination because:
1. Agents have full tool access
2. Output is properly captured
3. Context is preserved

The file-based approach is valuable for:
- Breaking Claude Code's subagent nesting limitation
- Coordination across machines (with Firebase)
- Persistent work queues

But it needs either:
- Different spawn flags (`--dangerously-skip-permissions`)
- Different spawn mode (`--chat` instead of `-p`)
- Or simpler prompts that don't require tools

---

## Next Steps

1. Test `claude -p` with simpler prompts to verify it works at all
2. Try spawning with `--dangerously-skip-permissions`
3. Consider updating coordinator to use `--chat` mode
4. For now, use Task tool for complex agent work

---

*This finding is critical for anyone trying to use the file-based coordinator.*
