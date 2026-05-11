---
name: archive-not-collapse
description: When cleaning up a user-facing memory file, never let detail vanish. Trim the user-facing surface AND move the dropped detail verbatim into a discoverable sidecar archive. Move-not-delete, always.
type: feedback
updated: 2026-05-02
updated_by: memory-engineer (family-thread)
related: [MEMORY-CONVENTIONS, decay, memory-improvement-program-v0.2, feedback/intake-protocol]
tags: [feedback, behavioral-primitive, memory/governance, household/governance]
triggers: [Edit, Write, git rm, decay, archive, prune, trim, cleanup, condense, summarize]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Archive, Don't Collapse

**Rule.** When you are about to clean up, trim, condense, or shorten any user-facing memory file (MEMORY.md, FAMILY.md, active-todos.md, daily logs, project files, INDEX files, anything else), the dropped detail MUST be moved verbatim into a discoverable sidecar archive file before the user-facing version is shortened. Never let signal disappear into a summary. Never `rm`; always `git mv` or `git rm` (the latter only because git history preserves recoverability).

**Why.** Alton, 2026-05-02 chat: *"Let's be thoughtful about trimming. We don't want to lose real data, but rather find a way to archive. On the other hand, some documents need to be kept trim/up-to-date."* The user-facing surface needs to be readable in seconds; the detail needs to remain findable. Collapsing detail into ≤200-character index lines (as the original 2026-05-02 MEMORY.md trim proposed to do) loses the *why*, the *who*, and the *receipts*. A future Claude searching for "when did the solar contract transfer get scheduled?" needs the verbatim text, not the headline.

**How to apply.**

1. **Identify the cleanup target.** Any file you are about to shorten by removing or compressing prose.
2. **Pick the archive location** before you touch the user-facing file. Naming convention:
   - For history sections of an index file: `<sibling-dir>/<filename>-history/<YYYY-MM>.md`. Example: `MEMORY.md` → `reference/MEMORY-history/2026-04.md`.
   - For superseded versions of a whole file: `reference/archive/<filename>-v<n>.md` (already in use for HOUSEHOLD-CONSTITUTION).
   - For drained inbox content: `inbox/.drained/<YYYY-MM-DD>/<bucket>/SUMMARY.md` plus the original files preserved (or git-rm'd, recoverable from history).
   - For closed family todos: `family/_history/triage-<YYYY-MM-DD>.md`.
3. **Move detail verbatim, then trim the surface.** Write the archive file FIRST (with frontmatter, dated, including the verbatim text being moved). THEN edit the user-facing file to a short index line that wikilinks the archive file. Example: `- 2026-04-19: Constitution v0.3 ratified. See [[reference/MEMORY-history/2026-04#2026-04-19-eve]] for full ratification record.`
4. **Wikilinks always go both ways.** The archive file's frontmatter has `archived_from: [[<source-file>]]`; the source file's index line wikilinks the archive. A grep for either name finds both.
5. **Never `rm`.** Use `git rm` if you must (git history is the safety net) or `git mv`. Never `rm`. If a script proposes `rm`, replace with `git rm` and add a commit-message note explaining what was removed and how to recover.
6. **The principle generalizes.** This applies to memory cleanup (memory-engineer / memory-cartographer), family layer pruning (family-curator), dashboard rebuild (dashboard-keeper), peer-machine drains, and any future cleanup work. If you're uncertain whether something counts as "cleanup," err on the side of archiving.
7. **Pipeline-emitted identifiers may reuse numbers across days.** For files written by pipelines that may reuse identifier numbers across days (e.g., `personal-data-gather` reuses `run-N` headers), the archive sidecar MUST preserve BOTH the identifier AND the source date in section headers. Stripping either renders the archive non-chronological. Example: `## Latest from gather (2026-04-29) — run 25` keeps both; `## run 25` alone is broken because run 25 also appears on 2026-04-30 and 2026-05-01 in `family/active-todos.md` today.
8. **Closure callouts are first-class signal; bridge to the don't-resurrect rule.** `[!fact] RESOLVED` and `[!done]` callouts mid-block are not noise — they're the closure record that downstream pipelines (notably `personal-data-gather` per [[feedback/gather-respects-out-of-band-closures]]) grep against to know not to resurrect the item. **Verbatim copy goes to the archive sidecar AND a one-line resolution summary must survive in the trim file under the most-recent `## YYYY-MM-DD Alton check-in` (or `… triage`) section.** The check-in section is the durable contract between the archive-not-collapse rule and the don't-resurrect rule. Drop the summary and the next gather run resurrects "Tribeca Pediatrics $170.28" three days after Alton paid it.

**Specific patterns to catch in cleanup-PR drafts before committing:**

- Index-line summaries that drop names, dollar amounts, decision rationale, dates, or contacts. These are signal; they go in the archive sidecar verbatim.
- Multi-paragraph history entries collapsed to "see git log." Git log doesn't have the *why*; the prose did. Move the prose.
- "Already in [[topic-file]]" claims without verifying the topic file actually has the detail. If unsure, archive first; verify second.
- `rm` operations in scripts. Always `git rm` instead.
- Cleanup commits that only show deletions. A clean cleanup PR shows additions to an archive file PLUS deletions in the user-facing file, in lockstep.

**Exceptions where collapse-without-archive is correct:**

- The dropped content is purely template noise self-attested as redundant (e.g., extractor-proposed memories with `dedup_status: already_landed` writing "Source quote" boilerplate). The bulk-discard via `git rm` plus a `SUMMARY.md` count-table is sufficient because the content carries no unique signal worth preserving verbatim.
- The dropped content is duplicate of a canonical source already verified to hold the same fact. Even then, prefer to leave a wikilink stub: `> [!archived] This entry moved into [[canonical-file]]. Removed 2026-05-02 because duplicate.`
- The cleanup is a one-line typo or formatting fix, not a content removal.

**Relation to other disciplines.**

- **completeness-principle** handles output-scope silent trimming. This handles input-scope (memory) silent trimming. Same underlying pattern: trained generator smoothing over a gap the user would want to know about.
- **MEMORY-CONVENTIONS §migration plan** says "migrate on touch." This rule extends: when you migrate, don't collapse — archive then trim.
- **Phase D of the memory-improvement-program** is the systemic implementation: decay scoring + move-to-archive + reactivation hook. This feedback rule is the per-action discipline that makes Phase D's policy automatic.

## History

- 2026-05-02: created by memory-engineer after Alton's "be thoughtful about trimming, archive instead" directive on the v0.1 MEMORY.md swap proposal. The original A1 swap would have collapsed the History section into ≤200-char wikilinked index lines without preserving the verbatim detail; this rule binds future cleanup work to the archive-first pattern. Pinned to `feedback/` so it auto-injects into every session via the SessionStart hook (until the A6 `triggers:` mechanism narrows it; this file should keep `triggers: [Edit, Write, git rm, ...]` because cleanup decisions are routine).
