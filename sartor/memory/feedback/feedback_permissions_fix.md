---
name: Permission system permanent fix
description: How to configure Claude Code so agents never prompt for permissions — includes confirmed bugs
type: feedback
---

Claude Code permissions have a confirmed merge bug (GitHub issue #17017): project `.claude/settings.json` REPLACES global `~/.claude/settings.json` permissions — does NOT merge them. This means you must duplicate all permission config at every level.

**Why:** Without `defaultMode: "bypassPermissions"` at all levels, agents fall back to default mode and prompt for every Write/Edit/Bash. The `permissions.allow` list whitelists tools but doesn't set the mode.

**How to apply:** Every `.claude/settings.json` (global, project, home-agent) must have:
```json
{
  "permissions": {
    "defaultMode": "bypassPermissions",
    "allow": ["Read", "Write", "Edit", "Bash", "Grep", "Glob", "WebSearch", "WebFetch", "Agent", ...]
  },
  "skipDangerousModePermissionPrompt": true
}
```

Every agent `.md` frontmatter must have: `permissionMode: bypassPermissions`

Every Agent tool call must include: `mode: "bypassPermissions"`

Known bugs to watch:
- Bug #17017: Project settings REPLACE global (not merge)
- Bug #18160: `Bash(ls *)` pattern matching has edge cases — use bare `Bash` instead
- Bug #117 (SDK): SDK hardcodes `allowDangerouslySkipPermissions: false` for subagents
- Protected dirs (.git, .claude, .vscode) still prompt even in bypassPermissions
