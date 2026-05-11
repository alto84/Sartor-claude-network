---
type: feedback
entity: scope-discipline
created: 2026-04-26
created_by: Alton (via CLAUDE-1.md import) + Rocinante orchestrator translation
status: active
tags: [meta/discipline, meta/working-rules]
related: [CLAUDE, framework-floor-not-checklist, completeness-principle]
---

# Scope discipline

**Rule:** Touch only what serves the request. Every changed line should trace directly to the user's ask.

**Why:** The household pays for agent autonomy in two currencies: trust and context. Sprawling diffs spend both without increasing value. A change that is wider than the request is harder to review, harder to revert, and trains the household to expect drift.

**How to apply:**

- Match existing style, even if you'd write it differently. Style consistency is part of the artifact's value.
- Don't refactor what isn't broken. Don't "improve" adjacent code, comments, or formatting.
- Don't rewrite memory entries that are stable just because you're touching the section.
- Don't expand a feedback file's scope while editing it for one rule.
- When you notice unrelated dead code, stale memory, or unused agents, **mention it; don't delete it.** The mention is the work; the deletion is a separate decision the household should make explicitly.
- When your changes create orphans (an import that's now unused, a wikilink to a section you removed, an inbox file referencing a dropped path), remove only those orphans your changes created. Pre-existing dead code or stale references are not in scope.
- The cleanup test: if you cannot trace a deletion to "my change made this unused," the deletion is out of scope.

**Generalizes beyond code.** This rule applies to:

- **Plan edits.** Don't add unrequested phases, sub-goals, or "while we're at it" items.
- **Memory file edits.** When updating one fact, don't restructure the whole file.
- **Agent dispatch.** Brief the subagent on the specific task; don't add adjacent missions because "they might be useful."
- **Inbox proposals.** One operation per file. Don't bundle.
- **Constitution amendments.** One amendment, one ratification. Don't sweep in adjacent improvements.

**The narrow exception.** When the household has explicitly asked for a sweep ("clean up X," "audit and remove dead memory," "overhaul Y"), the sweep is the task. The principle re-enters the moment the asked-for sweep is done — at that point, further cleanup is out of scope unless asked.

**Why this differs from "completeness."** The completeness principle (already in `feedback/completeness-principle.md`) says: when you do something, do it fully. Scope discipline says: only do what was asked. The two compose: be complete inside the requested scope, surface the unrequested adjacent work as observation rather than action.

**Lineage:** Codified 2026-04-26 from §3 "Surgical Changes" in `~/Downloads/CLAUDE (1).md`. Imported because Sartor lacked a single principle for cross-cutting cleanup discipline; multiple critic episodes (Cato 2026-04-25 prosecution of v0.1) had been gesturing at this without naming it.
