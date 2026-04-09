---
name: Preserve YAML frontmatter and callouts when consolidating
description: autoDream and the memory-curator MUST preserve existing YAML frontmatter, Obsidian callouts, wikilinks, and v2 structure when writing back to memory files. Never regenerate a file from scratch.
type: feedback
---

When the memory-curator, autoDream, or any scheduled-task writes back to a file under `sartor/memory/`, it MUST preserve the existing structure, not regenerate the file from scratch.

**Why:** On 2026-04-09, the nightly consolidation (commit `ecf408e`) regenerated 8 core memory files (TAXES, INDEX, SELF, ASTRAZENECA, LEARNINGS, MACHINES, PROCEDURES, PROJECTS) and silently reverted the memory v2 upgrade committed on 2026-04-07 (commit `03b6f72`). YAML frontmatter disappeared. Obsidian callouts disappeared. Restructured content reverted to pre-upgrade prose. The curator even flagged TAXES.md as "ARCHIVE despite April 15 deadline" in its own commit message — a direct consequence of the regression it caused. Nearly 450 lines of curated content were deleted in a single run. Restoring took manual intervention.

**How to apply:**

1. **Read the file before writing.** Any consolidation step must start by reading the current content so it knows what's there.
2. **Preserve frontmatter verbatim.** If a file starts with a `---\n...\n---\n` block, that block is authoritative. Do not rewrite it from templates. Only update the `updated:` and `updated_by:` fields.
3. **Preserve callouts verbatim.** `> [!deadline]`, `> [!decision]`, `> [!blocker]`, `> [!fact]`, `> [!warning]`, `> [!todo]`, `> [!note]`, `> [!example]` blocks are structured signals. Never replace them with prose.
4. **Preserve wikilinks.** Do not rewrite `[[FILE]]` references as markdown links or plain text.
5. **Append, don't overwrite.** Daily-log consolidation should add a `## Consolidated from daily logs (YYYY-MM-DD)` section at the BOTTOM of the file, not replace the file's existing sections.
6. **Respect the conventions spec.** The canonical format is defined at `sartor/memory/reference/MEMORY-CONVENTIONS.md`. If a consolidation step would produce a file that violates the spec, it must fail loudly rather than silently write the bad version.
7. **Bump `updated:` date on any content change.** If you write anything to a file, update its frontmatter `updated` field to today's ISO date.

**Detection contract:** any commit that touches more than 5 core memory files AND deletes more than 100 lines should be flagged for human review before pushing. The `memory-curator` agent SHOULD NOT auto-commit mass deletions of structured content.

**Related:** See `sartor/memory/reference/MEMORY-CONVENTIONS.md` for the canonical format and `sartor/memory/reference/LLM-WIKI-ARCHITECTURE.md` for how the wiki layer depends on this structure.
