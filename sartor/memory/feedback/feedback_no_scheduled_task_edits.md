---
name: Never edit protected .claude/ paths
description: Writes to .claude/ (except agents/commands/skills) ALWAYS trigger permission prompts - facts belong in memory files, not rules
type: feedback
---

NEVER edit files inside `.claude/` directly, except for these three excepted subdirectories:
- `.claude/agents/*.md` -- safe to edit
- `.claude/commands/*.md` -- safe to edit
- `.claude/skills/*.md` -- safe to edit

Everything else in `.claude/` triggers permission prompts regardless of bypass settings:
- `.claude/rules/*.md` -- PROMPTS
- `.claude/scheduled-tasks/**` -- PROMPTS
- `.claude/settings.json` -- PROMPTS
- `.claude/settings.local.json` -- PROMPTS
- `CLAUDE.md` (project root) -- PROMPTS

**Why:** Claude Code has a hardcoded protection on `.claude/` that cannot be overridden by defaultMode, skipDangerousModePermissionPrompt, or allow lists. This has caused permission prompts 5+ times across sessions.

**How to apply:**
1. Rules files (`.claude/rules/`) contain ONLY stable behavioral instructions, never facts. Facts go in `sartor/memory/` files which get injected via SessionStart hook.
2. When a scheduled task SKILL.md needs editing, write the proposal to `data/proposed-improvements/`.
3. When CLAUDE.md needs updating, ask the user first (per the constitution) and accept the one-time prompt.
4. Rules files should NEVER need editing after the 2026-04-03 refactor. If they do, something is wrong with the architecture.
