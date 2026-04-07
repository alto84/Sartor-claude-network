---
type: meta
entity: MEMORY
updated: 2026-04-07
updated_by: Claude
status: active
tags: [meta/index, meta/entrypoint]
aliases: [Memory Index, MEMORY]
related: [SELF, INDEX, MEMORY-CONVENTIONS, MULTI-MACHINE-MEMORY]
---

# Memory Index — Stable Pointer

Entrypoint to the Sartor memory system. This file is auto-injected when Claude Code starts a session at `C:\Users\alto8` via a junction from `~/.claude/projects/C--Users-alto8/memory/` → `sartor/memory/`. The two paths are physically the same directory.

## Where to find things

- **Session context (auto-injected):** `docs/USER.md`, `docs/MEMORY.md` — updated nightly by curator
- **Feedback rules (auto-injected):** `sartor/memory/feedback/*.md` — behavioral rules visible in every session
- **Core knowledge:** `sartor/memory/` — ALTON, FAMILY, BUSINESS, TAXES, MACHINES, PROJECTS, ASTRAZENECA, SELF, LEARNINGS, PROCEDURES
- **Conventions and architecture:** `sartor/memory/reference/`
  - [[MEMORY-CONVENTIONS]] — YAML frontmatter, callouts, wikilinks spec
  - [[MULTI-MACHINE-MEMORY]] — inbox pattern for N-machine sync
  - `gpuserver1-delegation.md` — delegation to the GPU server
- **Daily logs:** `sartor/memory/daily/` — append-only session logs
- **Inboxes:** `sartor/memory/inbox/{hostname}/` — per-machine write queues (curator drains)
- **Runtime state:** `data/` — SYSTEM-STATE, IMPROVEMENT-QUEUE, observer-log, trajectories
- **Quick reference:** [[QUICK-REFERENCE]]

## Critical rules (stable, rarely change)

- Always pass `mode: "bypassPermissions"` on every Agent invocation
- Never edit files in `.claude/` except `agents/`, `commands/`, `skills/` subdirectories
- Facts go in `sartor/memory/`, behavioral rules in `sartor/memory/feedback/` (auto-injected), runtime state in `data/`
- Push git only from Rocinante (has credentials). Other machines write to their inbox subdirectory; curator drains on Rocinante.
- Use `$` variables via .ps1 scripts on Windows, not inline bash
- Memory files follow the conventions in [[MEMORY-CONVENTIONS]] — frontmatter + callouts + wikilinks

## Adding new memories

1. **User profile facts** → edit the relevant file in `sartor/memory/` directly (e.g., [[ALTON]], [[FAMILY]])
2. **Behavioral rules** → write a new `feedback_*.md` file in `sartor/memory/feedback/`
3. **Reference docs** → write to `sartor/memory/reference/`
4. **From a non-hub machine** → write to your inbox at `sartor/memory/inbox/{hostname}/` as a YAML-fronted proposal; curator will merge on next run
5. **Always bump the `updated:` frontmatter field** on any file you change

## History

- 2026-04-07: Rewritten as the canonical memory index. Junction from Claude Code auto-memory dir now points here. Conventions and multi-machine architecture added.
- Prior: Was a stable pointer in the protected Claude Code directory.
