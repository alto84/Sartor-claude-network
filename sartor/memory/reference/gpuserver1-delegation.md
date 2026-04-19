---
name: gpuserver1-delegation
description: Patterns for delegating tasks to the gpuserver1 Claude instance via SSH. Covers read-only queries, permission escalation for file operations, and repo-context invocations.
type: reference
updated: 2026-04-19
updated_by: Claude (Opus 4.7) — tidy pass
tags: [reference, domain/gpu, meta/procedures]
related: [OPERATING-AGREEMENT, MULTI-MACHINE-MEMORY, MACHINES]
---

# gpuserver1 Delegation

## How to Delegate Tasks

### Read-only queries (safe, default permissions)
```bash
ssh alton@192.168.1.100 "claude --print -p 'YOUR_PROMPT_HERE'"
```

### Tasks needing bash/file operations
```bash
ssh alton@192.168.1.100 "claude --dangerously-skip-permissions -p 'YOUR_PROMPT_HERE'"
```

### Tasks needing Sartor repo context
```bash
ssh alton@192.168.1.100 "cd ~/Sartor-claude-network && claude --dangerously-skip-permissions -p 'YOUR_PROMPT_HERE'"
```

### Tips
- Escape single quotes in prompts: use `'\''` or double-quote the outer string
- For long prompts, write to a temp file first then read it:
  ```bash
  ssh alton@192.168.1.100 "cat /tmp/task.txt | claude --dangerously-skip-permissions -p -"
  ```
- Output returns via stdout to the calling agent
- gpuserver1 Claude has ~/CLAUDE.md with its role and vast.ai context

## When to Delegate to gpuserver1

| Task | Delegate? | Reason |
|------|-----------|--------|
| Vast.ai status/tending | YES | Has vastai CLI and API key |
| GPU workloads | YES | Has RTX 5090 |
| Docker operations | YES | Docker is on gpuserver1 |
| Linux system admin | YES | Direct access |
| Network diagnostics | YES | Server-side perspective |
| Git push | NO | No GitHub credentials |
| Chrome/browser automation | NO | No display (headless only) |
| User interaction | NO | No UI access |

## Vast.ai Tending (Primary Use Case)

### Quick status check
```bash
ssh alton@192.168.1.100 "~/.local/bin/vastai show machines && echo '---' && ~/.local/bin/vastai show instances"
```

### Full tending check (runs the monitoring script)
```bash
ssh alton@192.168.1.100 "bash ~/vastai-tend.sh"
```

### Ask Claude to investigate/fix issues
```bash
ssh alton@192.168.1.100 "claude --dangerously-skip-permissions -p 'Check vast.ai listing status for machine 52271. If there are any alerts in ~/.vastai-alert, investigate and fix them. Report what you found and did.'"
```

### Relist (if expired)
```bash
ssh alton@192.168.1.100 "~/.local/bin/vastai list machine 52271 -g 0.40 -b 0.25 -s 0.10 -m 1 -e '08/24/2026'"
```

### Run self-test
```bash
ssh alton@192.168.1.100 "~/.local/bin/vastai self-test machine 52271"
```
Note: Self-test takes ~3 minutes. Run in background if needed.

## Monitoring Infrastructure on gpuserver1

- **Tending script:** ~/vastai-tend.sh (runs every 2 hours via cron, offset :30)
- **Alert file:** ~/.vastai-alert (created when issues found, delete after resolving)
- **Log file:** ~/.vastai-tend.log (append-only status log)
- **Cron:** `30 */2 * * *` runs the tending script

## Key Parameters
- Machine ID: 52271
- GPU: $0.40/hr, Min bid: $0.25/hr, Storage: $0.10/hr
- End date: 2026-08-24
- Public IP: 100.1.100.63
