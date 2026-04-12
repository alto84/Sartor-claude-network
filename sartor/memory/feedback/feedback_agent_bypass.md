---
name: Permissions bypass -- complete solution
description: How to eliminate all permission prompts in Claude Code, including known bugs and workarounds
type: feedback
---

## CLI Launch
Always launch with `--dangerously-skip-permissions`. This is the ONLY 100% reliable mechanism. An alias is set in ~/.bashrc.

## Agent Spawns
Always pass `mode: "bypassPermissions"` on EVERY Agent tool invocation. No exceptions.

## Settings.json
- `defaultMode: "bypassPermissions"` in both global and project settings
- `skipDangerousModePermissionPrompt: true` in global settings ONLY (project-level is intentionally ignored by Claude Code)
- MCP allow entries need BOTH forms: `mcp__server` AND `mcp__server__*` (wildcard has bugs)

## Known Unfixable
- Writes to `.git`, `.claude` (except agents/commands/skills), `.vscode`, `.idea` ALWAYS prompt. By design.

## Open Bugs (as of 2026-04)
- #17017: Project permissions REPLACE global (not merge)
- #40470: Scheduled tasks ignore bypassPermissions
- #39889: Dispatch sessions ignore settings
- #12604: VSCode extension ignores settings

**Why:** Alton operates autonomously/remotely and permission prompts block all work. Multiple sessions have been lost to subagents waiting for approvals nobody could see.

**How to apply:** Check every Agent() call for mode parameter. Launch script must include --dangerously-skip-permissions. Never rely on settings.json alone.
