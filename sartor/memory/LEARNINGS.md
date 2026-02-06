# Learnings - Lessons Learned
> Last updated: 2026-02-06 by Claude

## Key Facts
- Collection of hard-won lessons from building and operating Sartor
- Focus on practical gotchas and solutions
- Updated as new lessons are discovered

## PowerShell and Claude Code
- **Problem:** PowerShell dollar-sign variables get mangled when passed inline via powershell -Command in Claude Code
- **Solution:** Write .ps1 script files and execute with powershell -ExecutionPolicy Bypass -File path
- **Tip:** Use forward slashes in -File paths even on Windows

## Chrome and CDP
- **Problem:** Chrome default profile blocks CDP (Chrome DevTools Protocol) connections
- **Solution:** Use a separate automation profile with --user-data-dir flag
- **Automation Chrome:** Runs on port 9223 with temp profile at C:\Users\alto8\chrome-automation-profile
## Claude in Chrome MCP
- **Discovery:** The extension IS connected and functional despite Claude Code reporting not connected
- **Root cause:** The not connected error comes from Claude Code MCP client, not the extension
- **Protocol:** Named pipe, uses execute_tool method (not standard MCP initialize/tools/list)
- **Lesson:** Dig into the actual protocol before assuming something is broken

## Git Credentials
- **Problem:** gpuserver1 has SSH key generated but NOT added to GitHub
- **Solution:** All git push operations must happen from Rocinante which has stored credentials
- **Workflow:** Write on gpuserver1, commit locally, push from Rocinante

## Architecture Philosophy
- **Lesson:** Over-engineering kills projects - keep it simple
- **Principle:** Markdown over databases for human-readable, git-friendly storage
- **Pattern:** OpenClaw memory pattern works well: curated core files + append-only daily logs
- **Why it works:** Easy to read, easy to diff, easy to merge, no infrastructure needed

## Session Management
- **Pattern:** Session compaction with memory flush (from OpenClaw)
- **How:** At end of session, summarize key learnings into core files, append to daily log
- **Benefit:** Prevents context loss across sessions while keeping files manageable

## Open Questions
- Best practices for memory file size limits?
- When to split a core file into multiple files?
- How to handle contradictory information across memory files?

## History
- 2026-02-06: Initial creation
