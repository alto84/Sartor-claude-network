---
type: meta
entity: PROCEDURES
updated: 2026-04-12
updated_by: Claude (hub-refresher)
last_verified: 2026-04-12
status: active
tags: [meta/procedures]
aliases: [Workflows]
related: [MACHINES, SELF, MULTI-MACHINE-MEMORY, reference/OPERATING-AGREEMENT, reference/LOGGING-INDEX, machines/gpuserver1/CRONS, machines/rocinante/CRONS]
---

# Procedures - Working Procedures

## Key Facts
- SSH to gpuserver1: ssh alton@192.168.1.100
- Git push must happen from Rocinante (has credentials). gpuserver1 **cannot** push to GitHub; it is inbox-write-only per the [[reference/OPERATING-AGREEMENT|Operating Agreement]].
- PowerShell in Claude Code: use .ps1 script files, not inline $variables
- Chrome CDP toolkit on Rocinante at C:\Users\alto8\chrome-tools\
- Inter-machine memory writes go through the **inbox pattern** — gpuserver1 writes YAML-fronted proposals to `sartor/memory/inbox/gpuserver1/`, Rocinante curator drains them nightly. See [[MULTI-MACHINE-MEMORY]].
- Before reading memory, pull. Before writing memory from Rocinante, pull then push after. Never have gpuserver1 touch git directly.

## SSH Access

```bash
# From Rocinante to gpuserver1 (see [[MACHINES]] for full specs)
ssh alton@192.168.1.100
```

## Chrome Automation (Rocinante)

**Start automation Chrome (separate profile, CDP enabled):**
```
Start-Process "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" -ArgumentList "--remote-debugging-port=9223", "--remote-allow-origins=*", "--user-data-dir=C:\Users\alto8\chrome-automation-profile", "--no-first-run"
```

**CDP Toolkit scripts** (C:\Users\alto8\chrome-tools\):
- cdp-common.ps1 - Shared WebSocket CDP client functions
- cdp-list-tabs.ps1 - List open tabs
- cdp-navigate.ps1 - Navigate to URL
- cdp-eval.ps1 - Evaluate JavaScript
- cdp-screenshot.ps1 - Take screenshot
- cdp-dom.ps1 - Read DOM
- cdp-click.ps1 - Click element
- cdp-type.ps1 - Type text
- cdp-find.ps1 - Find elements
- cdp-new-tab.ps1 - Open new tab
- screenshot.ps1, screenshot-region.ps1 - Screen capture
- click-at.ps1, type-text.ps1 - Input automation
- focus-chrome.ps1 - Focus Chrome window

## Git Workflow

```bash
# Always pull before reading memory
cd ~/Sartor-claude-network && git pull

# After writing memory, push must happen from Rocinante
# On Rocinante:
cd /path/to/Sartor-claude-network && git add . && git commit -m "message" && git push
```

**Important:** gpuserver1 SSH key is NOT added to GitHub by design (per [[reference/OPERATING-AGREEMENT|Operating Agreement]]). All pushes must originate from Rocinante. See [[LEARNINGS]] for early lessons on why.

**Stash-before-pull wrapper:** gather_mirror.sh on gpuserver1 runs `git stash` before `git pull` and `git stash pop` after to prevent local-changes-overwritten errors. This resolved the persistent 1257-line conflict log from the now-deprecated memory-sync.sh.

## Inbox Pattern (Inter-Machine Memory)

gpuserver1 cannot commit to GitHub. When gpuserver1 needs to write a memory update:

1. gpuserver1 writes a YAML-fronted `.md` file to `sartor/memory/inbox/gpuserver1/<category>/`
2. gather_mirror.sh (every 4 hours) pulls the repo, making Rocinante's files visible to gpuserver1
3. Rocinante's nightly curator (memory-curator agent) drains the inbox — reads proposals, writes canonical memory files, commits and pushes
4. The committed state becomes visible to gpuserver1 on its next gather_mirror pull

This pattern is documented in full at [[MULTI-MACHINE-MEMORY]]. The authority split is documented in [[reference/OPERATING-AGREEMENT|Operating Agreement]]: gpuserver1 owns rental-operations facts, Rocinante owns curation, git, and shared-state writes.

**Curator drain cadence:** nightly, 11 PM ET (Rocinante). Inbox proposals from gpuserver1 typically become merged memory within 24 hours.

## PowerShell in Claude Code (Windows)

**Problem:** $ variables get mangled when passed inline via `powershell -Command`

**Solution:** Write .ps1 script files and execute with:
```
powershell -ExecutionPolicy Bypass -File "C:/Users/alto8/script.ps1"
```
Use forward slashes in -File paths. More PowerShell gotchas are tracked in [[LEARNINGS]].

## Dashboard

- MERIDIAN: Running on Rocinante:5055 (FastAPI + uvicorn), access at http://localhost:5055
- Safety research dashboard: gpuserver1:8000 (managed by dashboard-healthcheck.sh cron)
- GPU dashboard: gpuserver1:5060 (managed by dashboard-healthcheck.sh cron)

## Agent Teams

- Claude Code supports agent teams for parallel work
- Can spin up sub-instances for concurrent tasks
- Useful for research + coding in parallel
- Part of the [[SELF|Sartor]] orchestration layer

## Claude in Chrome MCP

- Extension connected via named pipe: \.\pipe\claude-mcp-browser-bridge-alton
- Protocol: 4-byte LE uint32 length + UTF-8 JSON
- Method: execute_tool (not standard MCP methods)
- Test: C:\Users\alto8\chrome-tools\test-mcp-simple.ps1

## Open Questions
- Dashboard authentication: MERIDIAN is LAN-only now (no auth). Phase 3 concern.
- Backup procedures for memory files? (git is the backup; no off-site copy yet)

## Related
- [[MACHINES]] - Hardware specs and access details
- [[LEARNINGS]] - Lessons learned from operating these procedures
- [[SELF]] - Sartor system these procedures support
- [[MULTI-MACHINE-MEMORY]] - Full inbox pattern specification
- [[reference/OPERATING-AGREEMENT|Operating Agreement]] - Authority and domain split
- [[reference/LOGGING-INDEX|Logging Index]] - Authoritative map of all logs across both machines
- [[machines/gpuserver1/CRONS|gpuserver1 CRONS v0.2]] - Active cron jobs on gpuserver1

## History
- 2026-02-06: Initial creation
- 2026-04-07: Multi-machine memory architecture introduced — inbox pattern, Operating Agreement, curator drain. These procedures are now the canonical inter-machine workflow.
- 2026-04-12: Hub refresh (EX-1). Added inbox pattern section, stash-before-pull note, updated dashboard URLs (Rocinante:5055, not gpuserver1:5000), resolved "automate git sync" open question (answer: no — inbox pattern + nightly curator is the intended mechanism), added wikilinks to LOGGING-INDEX, OPERATING-AGREEMENT, gpuserver1/CRONS.

## Consolidated from daily logs (2026-04-05)
- [2026-02-06] (insight) Markdown-first approach aligns well with git workflows and Claude Code context loading
