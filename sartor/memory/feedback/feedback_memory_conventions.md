---
name: Memory files follow frontmatter + callout conventions
description: All sartor/memory/ files use YAML frontmatter, Obsidian callouts, and wikilinks. Full spec at sartor/memory/reference/MEMORY-CONVENTIONS.md.
type: feedback
---

All files under `sartor/memory/` follow the conventions in `sartor/memory/reference/MEMORY-CONVENTIONS.md`. That file is the single source of truth.

**Why:** The system is already an Obsidian vault (`.obsidian/` exists in sartor/memory/). Adopting YAML frontmatter, callouts, and disciplined wikilinks makes the same files queryable via grep AND navigable via Obsidian's graph view, backlinks, and properties panel — without lock-in to either substrate. Prior to 2026-04-07 the system used free-form prose metadata; stale detection was a regex hunt and urgency was ALL-CAPS. The upgrade replaces that with structured fields.

**How to apply:**

1. **Every memory file opens with YAML frontmatter.** Minimum: `type`, `updated` (ISO date), `updated_by`, `tags`. Domain files add `entity`, `status`. Deadline-bearing files add `next_deadline`.
2. **Callouts, not ALL-CAPS, for urgency.** Use `> [!deadline] 2026-04-15`, `> [!decision]`, `> [!blocker]`, `> [!fact]`. Each callout grep-able in isolation.
3. **Wikilinks for internal refs.** `[[TAXES]]` not `[TAXES](TAXES.md)`. `[[FILE|alias]]` for display.
4. **Bump `updated` on every content change.** Curator watches this field to detect stale files.
5. **Tags use slash hierarchy.** `entity/tax`, `status/active`, `priority/p1`.
6. **Don't invent new frontmatter fields.** Extend the schema in `MEMORY-CONVENTIONS.md` first, then use.

When editing an existing memory file, also migrate the old `> Last updated:` blockquote to frontmatter if not already done. Migration is incremental — add frontmatter on touch, don't sweep.

The memory-curator agent enforces this spec during nightly passes. Files without frontmatter are flagged. Files with stale `updated` dates (>30 days without topic activity) are surfaced for review.
