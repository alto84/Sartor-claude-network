# Procedures - Working Procedures
> Last updated: 2026-02-06 by Claude

## Key Facts
- SSH to gpuserver1: ssh alton@192.168.1.100
- Git push must happen from Rocinante (has credentials)
- PowerShell in Claude Code: use .ps1 script files, not inline $variables
- Chrome CDP toolkit on Rocinante at C:\Users\alto8\chrome-tools\

## SSH Access

```bash
# From Rocinante to gpuserver1
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

**Important:** gpuserver1 SSH key is NOT added to GitHub. All pushes must originate from Rocinante which has stored git credentials.

## PowerShell in Claude Code (Windows)

**Problem:** $ variables get mangled when passed inline via `powershell -Command`

**Solution:** Write .ps1 script files and execute with:
```
powershell -ExecutionPolicy Bypass -File "C:/Users/alto8/script.ps1"
```
Use forward slashes in -File paths.

## Dashboard

- Running on gpuserver1:5000
- Flask app
- Access from Rocinante browser: http://192.168.1.100:5000

## Agent Teams

- Claude Code supports agent teams for parallel work
- Can spin up sub-instances for concurrent tasks
- Useful for research + coding in parallel

## Claude in Chrome MCP

- Extension connected via named pipe: \.\pipe\claude-mcp-browser-bridge-alton
- Protocol: 4-byte LE uint32 length + UTF-8 JSON
- Method: execute_tool (not standard MCP methods)
- Test: C:\Users\alto8\chrome-tools\test-mcp-simple.ps1

## Open Questions
- Should we automate git sync on a schedule?
- Dashboard authentication needed?
- Backup procedures for memory files?

## History
- 2026-02-06: Initial creation
