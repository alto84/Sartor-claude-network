---
type: reference
entity: QUICK-REFERENCE
updated: 2026-04-07
updated_by: Claude
status: active
tags: [meta/reference]
aliases: [Quick Ref, Reference]
related: [MACHINES, PROCEDURES]
---

# Quick Reference
> Freely editable. Update whenever details change.

## Rocinante (Primary Workstation)
- **Chrome:** `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe` v144
- **Chrome tools:** `C:\Users\alto8\chrome-tools\` (CDP toolkit, screenshots)
- **Automation Chrome:** Port 9223, profile at `C:\Users\alto8\chrome-automation-profile\`
- **Claude in Chrome MCP:** Named pipe `\\.\pipe\claude-mcp-browser-bridge-alton`

## gpuserver1
- **SSH:** `ssh alton@192.168.1.100` (RTX 5090, 128GB RAM, Ubuntu 22.04)
- **Vast.ai:** Machine 52271, Offer 32099437, $0.40/hr GPU, $0.25 min bid
- **Listing expiry:** 2026-08-24
- **Delegate:** `ssh alton@192.168.1.100 "claude --dangerously-skip-permissions -p 'PROMPT'"`
- **Cannot do:** git push (no GitHub creds), browser automation (headless)

## Key URLs
- **Repo:** https://github.com/alto84/Sartor-claude-network.git
- **Dashboard:** gpuserver1:5000 (Flask) / localhost:5055 (MERIDIAN)
- **Gateway:** gpuserver1:5001

## PowerShell on Windows
- `$` variables get mangled inline. Use `.ps1` script files with `-ExecutionPolicy Bypass -File`.

## Memory Architecture
| Layer | Location | Protected? | Update frequency |
|-------|----------|-----------|-----------------|
| Auto-memory index | `~/.claude/projects/*/memory/MEMORY.md` | YES | Monthly (frozen) |
| Session context | `docs/USER.md` + `docs/MEMORY.md` | No | Nightly (curator) |
| Knowledge base | `sartor/memory/*.md` | No | As needed |
| Feedback/rules | `sartor/memory/feedback/` | No | As learned |
| Reference docs | `sartor/memory/reference/` | No | As learned |
| Runtime state | `data/` | No | Every tick |

## Protected Paths (NEVER edit)
- `.claude/rules/` -- behavioral rules only, no facts
- `.claude/scheduled-tasks/` -- proposals go to `data/proposed-improvements/`
- `.claude/settings.json` / `.claude/settings.local.json`
- `CLAUDE.md` -- ask user first per constitution
- `~/.claude/projects/*/memory/` -- frozen pointer index

## Safe to Edit in .claude/
- `.claude/agents/*.md`
- `.claude/commands/*.md`
- `.claude/skills/*.md`
