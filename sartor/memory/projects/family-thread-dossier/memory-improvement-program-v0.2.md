---
name: memory-improvement-program-v0.2
type: plan
entity: memory-improvement-program
version: 0.2
status: revised, pending-alton-greenlight-on-A1-archive-approach
volatility: medium
priority: p1
date: 2026-05-02
updated: 2026-05-02
updated_by: memory-engineer (family-thread)
supersedes: [[_archive/memory-improvement-program-v0.1]]
related: [MEMORY-CONVENTIONS, MULTI-MACHINE-MEMORY, memory-cartography, pipelines-audit, family-memory-fixup, sartor-agent-os/PLAN-FINAL, auto-injection-budget-2026-05-02, inbox-keep-list-2026-05-02, feedback_archive_not_collapse]
tags: [meta/plan, domain/memory, household/governance]
aliases: [Memory Improvement Program, MIP v0.2]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Memory Improvement Program v0.2

> [!warning] Design only. Nothing in this document modifies memory or any pipeline. v0.1 is preserved verbatim at `_archive/memory-improvement-program-v0.1.md` per Alton's own archive-not-collapse principle. Each phase is ratifyable independently and reversible (move-not-delete throughout, never `rm`).

## §0a — What changed v0.1 → v0.2 (Alton's 2026-05-02 directives)

Two directives reshape the program. Both are load-bearing.

### Directive 1: archive-not-collapse (binds A1, A2, A5, all of Phase D)

Alton: *"Let's be thoughtful about trimming. We don't want to lose real data, but rather find a way to archive. On the other hand, some documents need to be kept trim/up-to-date."*

- **A1 swap is no longer a collapse.** The cartographer's `MEMORY.md.proposed` compressed the 25-entry History section into ≤200-char wikilinked index lines. That loses signal — the *why*, the *who*, the verbatim receipts. v0.2 redesigns A1 as a **paired operation**: the trim file PLUS a sidecar archive (`reference/MEMORY-history/2026-04.md`) holding the dropped multi-paragraph entries verbatim. Index lines in MEMORY.md wikilink the archive entries.
- **The principle generalizes.** Written to `feedback/feedback_archive_not_collapse.md` (created today, this turn). It binds every future cleanup — memory-engineer's, family-curator's, dashboard-keeper's, peer-machine drains. **Move-not-delete, always. Never `rm`. If a script proposes `rm`, use `git rm`.**
- **Phase D framing changes.** "Decay → archive scoring," not "decay deletion candidates." D2's archival action is move-to-sidecar, not move-toward-removal. D3's reactivation hook is unchanged.

### Directive 2: KISS — better .md + better indexing, no MCP, no clever schema (reshapes Phase B)

Alton: *"Less ambitious. I want to lean on .md memory documents / family wiki / indexing to increase the speed of subagent search and findability. KISS"*

- **Scrap B1-γ (MCP relevance server) entirely.** No new substrate.
- **Scrap B1-β (skill-prelude `memory_relevance:` frontmatter) as new schema machinery.** Replace with the lighter equivalent: a "Before you do X, check Y" plain-markdown line in the relevant skill body. Same effect, zero new schema, zero new pipeline.
- **The consumer is the SUBAGENT** (e.g., family-curator searching for whether Wohelo was paid). Optimize their first 30 seconds of file-finding. Better INDEX.md at every subdirectory; consistent file naming + tags; lightweight inline pointers.
- **A6 (`triggers:` field on feedback files) survives but narrows.** It's still the right answer to the 74 KB session-start payload from feedback files. But implement minimally: one frontmatter field, one bash conditional in `inject-user-context.sh`, no relevance-scoring algorithm. Defaults preserve today's behavior.

## §0b — What stays from v0.1

- **Phase A items A1, A2, A3, A4, A5, A6** all still ship. Designs revised below per directive 1.
- **Phase C (project index)** stays intact — exactly the kind of indexing Alton is asking for. Today's `family-thread-dossier/INDEX.md` work is the prototype; generalize to `projects/`, `research/`, `reference/`, `feedback/`, `inbox/`, `family/`.
- **Phase D (decay)** stays. Reframed as "archive scoring," not "decay-to-deletion." Phase D's policy is the systemic implementation of the new feedback rule.
- **Phase E (governance)** stays unchanged.
- **Five constraints** stay. Cartographer's hard data on inbox poisoning stays. A4 audit findings stay (HOUSEHOLD-CONSTITUTION confirmed not auto-injected; feedback files are 84% of the 88 KB SessionStart hook payload).

## §0c — What dies in v0.2

- B1-γ (MCP relevance server). Removed entirely.
- B1-β (skill-prelude `memory_relevance:` frontmatter as a schema). Replaced by inline plain-markdown pointers in skill bodies (B1' below).
- B1-α (extend SessionStart hook with relevance scoring). Was already declined in v0.1; remains declined.
- The "decay deletion candidate" framing in Phase D. Reframed as "archive scoring."

## §0d — The new dominant principle

**Trim the surface; archive the depth; index everything; let the subagent grep.**

This is the line v0.2 lives by. Every item is scored against it.

---

# Phase A — Stabilize (this week, archive-pattern applied)

## A1. MEMORY.md trim WITH paired archive (revised)

- **Design (revised).** Two files ship together:
  1. **`MEMORY.md`** (trim) — keeps short index lines per cartographer's draft, but each line wikilinks the verbatim entry in the archive. Frontmatter unchanged. Critical-rules text unchanged.
  2. **`reference/MEMORY-history/2026-04.md`** (archive) — full text of the 25 multi-paragraph History entries from the current 30 KB MEMORY.md, verbatim, with frontmatter `type: archive`, `archived_from: [[MEMORY]]`, `tags: [meta/archive, domain/memory]`. Goes-forward sibling: `reference/MEMORY-history/2026-05.md` for new entries this month.
- **Re-tasked to cartographer**: produce `MEMORY.md.proposed` (already exists; verify the wikilinks point at archive entries) AND `reference/MEMORY-history/2026-04.md.proposed` (NEW, holds the full verbatim text). When ready, team-lead surfaces both to Alton for greenlight.
- **Reversibility.** `git mv` swap of MEMORY.md plus `git add` of the new archive file. To undo: revert both in lockstep.
- **Orientation score: +2.** Next session lands without truncation AND can grep the archive to find the verbatim 2026-04-22 Blackwell bring-up rationale, the 2026-04-25 HEARTH plan, the §20 self-prosecution record. **Detail preserved, surface trim. This is the model for every future cleanup.**

## A2. Inbox poisoning drain — split along cron boundary per pipelines-auditor 2026-05-02

> [!fact] Per pipelines-auditor's 2026-05-02 reaction (relayed by team-lead): bundling extractor-pipeline fixes with curator-pipeline fixes means one rollback drops the other's value, and the two have different failure modes. Split A2 into **A2a (extractor pipeline)** and **A2b (curator pipeline)**. The inbox-poison drain itself can ride with either; v0.2 places it in A2a since the drain is what proves the extractor fix worked.

### A2a — extractor pipeline (one PR)

- **Inbox poison drain** (3a-d, 3h verify): bulk-discard ~210 self-attested-redundant files via `git rm`; preserve `inbox/.drained/2026-05-02/extractor-bulk/SUMMARY.md`; hand-review 8 singletons; cross-check 23 peer files; pre/post body-hash diff via cartographer's pinned `_inbox_analysis.py` + `_singletons_and_peers.py`. Cartographer's keep-list at `projects/family-thread-dossier/inbox-keep-list-2026-05-02.md` remains the canonical source of truth.
- **3e extractor `dedup_status` gate**: one-line filter on the `SartorConversationExtract` Windows Scheduled Task (per `pipelines-audit.md` §F, daily 11:30 PM). Skip writing a proposal when `dedup_status: already_landed` would be the result.
- **3f catchup-skill source-quote fix** (option pick locked):
  - **Primary: Option (iii)** — extractor honors `dedup_status: already_landed` at write-time. (Concur with pipelines-auditor.) Same patch as 3e in practice; might be a single eligibility check.
  - **Belt-and-suspenders: Option (ii)** — known-skill-template fingerprint filter on source-quote matches (exact-match against `.claude/skills/catchup/SKILL.md`'s description field). Catches future template drift the `dedup_status` gate might miss.
  - **Option (i) deferred** — pipelines-auditor concur: never (i) alone. Only invoke if (iii)+(ii) prove insufficient at the +7-day verify (3h re-run).
  - Memory-builder picks both diffs; memory-engineer reviews; team-lead approves; only Option (i) escalates to Alton.
- **Reversibility**: bulk-discard via `git rm` recoverable from history; extractor patch one-line + reverse via one-line; fingerprint constant trivially edited.
- **Why this splits cleanly**: the extractor pipeline is a Windows Scheduled Task + a Python script. Failure mode is "extractor over-emits proposals." Verify substrate is body-hash diff in 3h.

### A2b — curator pipeline (separate PR)

- **3g `docs/USER.md` two-part fix** per pipelines-auditor's investigation at `projects/family-thread-dossier/docs-user-md-investigation.md` (USER.md is never-built, not regression):
  - **Part 1**: wire `nightly-memory-curation/SKILL.md` to invoke `memory-curator` agent's dialectic-synthesis as Step 6.
  - **Part 2**: bootstrap `docs/USER.md` with v0 seed (current ALTON.md highlights) so SessionStart hook stops silently skipping.
  - **Part 3 (recommended, not optional)**: sync the abandoned 2026-04-12 v2.0 spec to the runtime stub. Pipelines-auditor's investigation shows this was the original P0 follow-up that never landed; it remains the wiring-gap root cause.
- **3i family-curator §2.2 drift fix** (NEW in v0.2 per pipelines-auditor's catch): the same `memory-curator` agent inlines family-relevant inbox drains into FAMILY.md instead of redirecting to `family/_history/inbox-drains-{YYYY-MM}.md` per the `family-memory-fixup` plan §2.2. Same agent, same cron, same PR. **Coordinate with family-curator before commit** — they own the family-layer side; memory-builder owns the agent-config edit.
- **Why this splits cleanly**: the curator pipeline is an agent + a SKILL.md cron + a missing file. Failure mode is "USER.md still missing OR family drains still inlining." Verify substrate is one nightly-pass output check + one grep.
- **Reversibility**: SKILL.md edits via `git checkout`; v0 USER.md seed file deletable; agent-config patch single-block edit.

### Cross-PR coordination

- A2a and A2b are independent in the data plane (different files touched, different verification surfaces).
- Recommended landing order: **A2a first** (extractor stops emitting noise), then A2b (curator pipeline restored). Inverse order also works; the pipelines don't conflict.
- Memory-builder spec will reflect this split: two PR scopes, two greenlight gate sequences, two verify substrates.
- **Orientation score: +2.** Unchanged from v0.1, applies to A2a + A2b combined.

## A3. Broken-wikilink audit (read-only; unchanged)

- Run `extract_graph.py` against the full corpus; emit `data/wikilink-audit-2026-05-02.md` listing dangling wikilink targets. **Do not rewrite anything** in this phase. Hand to Alton as a triage list and to the curator as a future weekly task.
- **New v0.2 note.** A1's archive pattern creates new wikilink targets (`reference/MEMORY-history/2026-04#anchor`). A3's audit must run AFTER A1 so it has the new targets in the graph.
- **Reversibility.** Read-only.
- **Orientation score: +1.**

## A4. Auto-injection budget audit (DONE 2026-05-02)

- Already complete. Audit at `Sartor-claude-network/docs/auto-injection-budget-2026-05-02.md`. Headline: SessionStart hook payload is 88 KB, 84% of which is feedback files. HOUSEHOLD-CONSTITUTION is NOT auto-injected. `docs/USER.md` is missing (silently skipped by hook). Catchup-skill description in the live skill list is the verified extractor-feedback-loop trigger.
- **No revisions in v0.2.** Read-only baseline doc; A6's design references it.
- **Orientation score: +2.** Unchanged.

## A5. Archive-scoring report (was: decay report; reframed per directive 1)

- **Design (revised).** Wire `sartor/memory/decay.py` to a Sunday-morning task in *report-only* mode. Output: `data/archive-candidates-{YYYY-MM-DD}.md` listing the top-50 files by archive-score (formerly "decay score"). **Renamed to make intent unambiguous**: this report does not propose deletion, it proposes which files would benefit from being archived to a sidecar per the new feedback rule. **No file moves yet** — that's Phase D.
- **Reversibility.** Read-only; cron disable to undo.
- **Orientation score: 0.** Sensor only.

## A6. Feedback directory split (KISS — primary design after team-lead's note)

- **Design (revised in v0.2 per team-lead's #14 framing).** Even simpler than v0.1's `triggers:` field. Split `sartor/memory/feedback/` into subdirectories grouping by relevance, then have `inject-user-context.sh` `cat` only the directories that match the session context. **Zero schema changes. Zero new frontmatter fields. Pure file-system topology.**

  **Proposed split** (subject to team-lead + Alton review):

  ```
  feedback/
    always/                                  # injected every session
      completeness-principle.md              # 4.2 KB
      goal-driven-execution.md               # 4.3 KB
      interior-report-discipline.md          # via .claude/skills/, not here, but pattern shown
      scope-discipline.md
      framework-floor-not-checklist.md
      awareness-as-duty.md
      proactive-error-cleanup.md
      gather-triage-2026-04-16.md           # current-state pre-filter
      feedback_archive_not_collapse.md      # NEW today; cleanup-relevant always
      feedback_preserve_frontmatter.md
      feedback_no_permissions.md            # bypassPermissions; relevant every Agent invocation
      artifact-vs-fact-not-found.md
      prosecutorial-discount-on-constitutional-reframes.md
      feedback_memory_conventions.md
    machine-business/                        # injected when cwd touches gpu/vastai/peer machines
      feedback_pricing_autonomy.md           # 5.9 KB
      feedback_objective_level_delegation.md
      federation-grep-before-delegation.md
    family/                                  # injected when cwd touches family/* or skill is family-related
      feedback_gather_respects_out_of_band_closures.md  # 5.8 KB
      paper-checks-blindspot.md
    multi-agent/                             # injected when Agent/TaskCreate in flight
      trust-but-verify-subagent-reports.md   # 4.1 KB
      feedback_prefer_subagents.md
      feedback_agent_bypass.md
    privileged/                              # injected when .claude/ touched
      feedback_protected_paths.md
      feedback_permissions_fix.md
  ```

  Hook script change: replace the unconditional `for f in feedback/*.md` loop with category-aware loop. **Two edge cases to address (per pipelines-auditor 2026-05-02):**
  
  - **(a) Empty subdir glob safety.** Add `shopt -s nullglob` at top of `inject-user-context.sh` so an empty subdir (e.g., `feedback/family/` with no files yet) doesn't expand to the literal string `feedback/family/*.md`, which would `cat` an error and kill the rest of the script. Without nullglob, the hook silently breaks for everyone the moment a category is empty.
  - **(b) The `$SKILLS_LOADED` env var does NOT exist in the harness today.** v0.1 / earlier v0.2 sketch assumed it. Real signals available: `$PWD`, the cwd path can suggest context (e.g., `/family/` in path → inject family bucket); marker files Alton or skills can create (e.g., `.context-family-active` in cwd); the prompt context itself is too-late (hook runs at session-start, before user types). **Recommend a pre-spike (10 min, memory-builder runs it before committing A6 design): test which signals are reliably available in the SessionStart hook environment.** Possible answers: `$PWD` only (PWD-based dispatch); a marker-file convention (richer but requires discipline); a hybrid (PWD as default, marker-file as override).
  - **Tentative dispatch logic** (subject to spike outcome):
    ```bash
    cat $REPO/sartor/memory/feedback/always/*.md  # unconditional
  case "$PWD" in
    *gpuserver1*|*rtxpro6000server*) cat $REPO/sartor/memory/feedback/machine-business/*.md ;;
  esac
  # NOTE: $SKILLS_LOADED below is illustrative — does NOT exist in harness today.
  # Replace with whatever the spike (above) determines is reliably available.
  case "$SKILLS_LOADED" in
    *family-scheduler*|*morning-briefing*) cat $REPO/sartor/memory/feedback/family/*.md ;;
  esac
  # etc.
  ```

  **Why this beats `triggers:`.**
  - No frontmatter editing on 24 files.
  - No schema doc to maintain.
  - File system IS the index — `ls feedback/family/` answers "what feedback rules apply to family work?" instantly.
  - Subagents can be told "your feedback is in `feedback/family/`" in their definition; the directory naming makes the relationship obvious.
  - Adding a new feedback rule = `git mv` into the right subdir; no `triggers:` line to write.
  - Reverts via one `git mv -r feedback/*/* feedback/` + restoring the original hook loop.

- **Open question** (one of §H gates 4 below): is this the right split? Team-lead's framing was "directory-split for feedback files." Above is my read; cartographer may want to refine after she finishes the A1 redo.
- **Counter-proposal kept for the record**: v0.1's `triggers:` frontmatter approach. Pros over directory-split: a file can have multiple triggers (a feedback rule that applies to BOTH gpu work AND multi-agent dispatch); changing a file's trigger set is a 1-line edit instead of `git mv`. Cons: schema overhead, every cleanup pass has to think about the field. **My read: directory-split wins on KISS; if a file genuinely needs multi-category injection, symlink it (`feedback/multi-agent/feedback_pricing_autonomy.md` → `../machine-business/feedback_pricing_autonomy.md`) — symlinks are visible in `ls`.**
- **Reversibility.** `git mv` files back to flat; restore original hook script. Symlinks (if any) removed.
- **Orientation score: +2.** Biggest single lever. ~36 KB/session saved when family-thread sessions skip machine-business + multi-agent + privileged buckets.

---

# Phase B — KISS subagent findability (was: JIT injection)

Goal: make subagent file-search fast and reliable using only `.md` + `INDEX.md` + plain-text pointers. **No new substrate. No new schema beyond A6's `triggers:` field. No MCP server. No embeddings.**

## B1'. Inline "before you do X, check Y" pointers in skill bodies

- **Design.** When a skill's work depends on a memory file, drop one sentence in the skill body in plain markdown. Examples:
  - `gpu-pricing-optimizer/SKILL.md`: "Before recommending a price, read `sartor/memory/feedback/feedback_pricing_autonomy.md` for the continuous-rental-priority rule."
  - `family-scheduler/SKILL.md`: "Before scheduling Aneeta, check `sartor/memory/family/sole-parent-window-*.md` for active sole-parent windows."
  - `morning-briefing/SKILL.md`: "Before composing the family section, read `sartor/memory/family/active-todos.md` head 100 lines."
- **Why this works.** The skill body is already loaded when the skill is invoked. Subagents read skill bodies at the same time they read the skill's tool list. A wikilink-style pointer in the body is read at zero marginal context cost.
- **Reversibility.** Plain-markdown sentences; revert via single Edit.
- **Orientation score: +1 per skill** (cumulative across ~10 skills that warrant pointers ≈ +1 net).

## B2. Subdirectory INDEX.md sweep (the big indexing push)

- **Design.** Every memory subdirectory gets an `INDEX.md` with one-line-per-file rows: `type | filename | purpose | tags | last-updated`. Today's `family-thread-dossier/INDEX.md` (auto-generated by team-lead's prior work) is the prototype. Generalize to:
  - `sartor/memory/projects/INDEX.md` (rebuild — see C1)
  - `sartor/memory/research/INDEX.md` (already exists; verify completeness)
  - `sartor/memory/reference/INDEX.md` (already exists; verify completeness)
  - `sartor/memory/feedback/INDEX.md` (NEW — the 24 feedback files would benefit from a single-page browse)
  - `sartor/memory/inbox/INDEX.md` (NEW — the categorical breakdown cartographer produced is exactly this)
  - `sartor/memory/family/INDEX.md` (already exists; verify; coordinate with family-curator)
  - `sartor/memory/people/INDEX.md` (already exists; verify completeness)
  - `sartor/memory/business/INDEX.md` (already exists; verify completeness)
  - `sartor/memory/machines/INDEX.md` (already exists; verify completeness)
  - `sartor/memory/snapshots/INDEX.md` (NEW)
  - `sartor/memory/skills/INDEX.md` (already exists; verify)
  - `sartor/memory/ledgers/INDEX.md` (already exists; verify)
- **Generation.** Auto-generated by a curator-class script that walks each subdir, reads frontmatter (`type`, `purpose`/first-paragraph, `tags`, `updated`), and emits a sorted table. Manual edits preserved between auto-runs (script reads existing INDEX, only touches auto-generated section).
- **Canonical INDEX template — family-curator's 2026-05-02 sketch.** family-curator proposed a 5-block pattern (How-to-land + 4 churn-graded sections + History) that's better than my earlier description. Adopted as the v0.2 reference template; family-curator's `family/INDEX.md` becomes the canonical exemplar memory-builder copies from. The 5 blocks:
  1. **`## How to land cold`** (numbered) — explicit reading order for a subagent that has never seen this subdir. Top of file, before any table.
  2. **`## <high-churn group>`** — the most volatile files (e.g., `family/active-todos.md` for family; `data/SYSTEM-STATE.md` for runtime; recent daily logs for `daily/`). One row per file.
  3. **`## Reference (slow change)`** — vendors lists, conventions, schemas, paper-check vendor lists. Slow-rot.
  4. **`## <profile group>`** (where applicable) — per-child for family, per-machine for `machines/`, per-person for `people/`.
  5. **`## Event prep (high volatility, dated)`** (where applicable) — sole-parent windows, trip plans, one-shots with explicit end dates.
  6. **`## History`** — `_history/` archive sidecars per [[feedback/feedback_archive_not_collapse]]. Forward-declared even when empty so the slot exists when archive-not-collapse first fires.
  Subdirs without history (e.g., `people/`) drop block 6. Subdirs without profiles drop block 4. The 5-block pattern reads top-to-bottom for cold readers; sections grouped by churn rate.
- **Reversibility.** INDEX files are derived; regenerate to undo. Manual edits go in a `## Manual` section preserved across runs.
- **Orientation score: +2.** Subagent that asks "what's in `research/`?" hits one file, sees one table, picks one or two files to read in detail. Today they have to `ls` and grep first.

## B3. File-naming + tagging discipline (curator pass)

- **Design.** A one-off curator pass to enforce frontmatter `tags:` populated on every memory file (cartography report shows many `low`/`none` files have empty tags). Plus a "naming smell" sweep: prefer `<topic>-<YYYY-MM-DD>.md` over ad-hoc names; flag and propose renames for pathological cases (the 16 `unifi-takeover-2026-05-01-*` siblings already noted).
- **Reversibility.** Tag additions reverse via single edit. Renames via `git mv`.
- **Orientation score: +1.**

## B4. (DELETED in v0.2) Feedback-rule JIT loader

- **This was v0.1's B2.** Promoted to Phase A as A6 in the prior turn; remains there in v0.2.

## B5. (DELETED in v0.2) Skill-prelude memory_relevance frontmatter

- **This was v0.1's B1-β.** Replaced by B1' inline-markdown pointers above. The frontmatter machinery is overkill for what the skill body can do natively.

---

# Phase C — Project index + cross-reference (unchanged from v0.1, scope reaffirmed by directive 2)

## C1. `projects/INDEX.md` rebuild — same design as v0.1

Today's INDEX.md (37 lines, 13 days old) misses many entries. Rebuild as typed index per the v0.1 design. Cross-reference: `family-thread-dossier/INDEX.md` is the prototype for the row schema.

## C2. Project-folder hygiene pass — same design as v0.1

Move the 16 `unifi-takeover-2026-05-01-*` siblings into a subfolder. Coordinate with B3.

## C3. `complex-project` skill body update — was "skill integration"

Replace v0.1's "auto-inject INDEX.md via prelude frontmatter" with a plain-markdown line in `complex-project/SKILL.md`: "Before starting a new project, read `projects/INDEX.md` to see if a related project already exists. After creating a new project, add a row to `projects/INDEX.md`." (B1' pattern.)

## C4. Cross-reference pass — same as v0.1

Add bidirectional "Related programs" callouts to `family-thread-dossier`, `family-memory-fixup`, `sartor-agent-os`, this program. Already partially done in this v0.2's frontmatter `related:` field.

---

# Phase D — Archive scoring (was: decay; reframed per directive 1)

Goal: old documents become archived sidecars, not deleted. Reactivation hook unchanged.

## D1. Archive scoring formalized (was: decay scoring)

- **Design.** Same scoring formula as v0.1 (`days_since_updated + days_since_accessed - link_density - pinned_bonus × volatility`). Renamed throughout: "archive_score" not "decay_score." Output never proposes deletion, only archival to sidecar (per the new feedback rule).
- **Reversibility.** Read-only formula; weights in one config file.
- **Orientation score: 0.**

## D2. Move-to-archive at threshold (was: same; framing strengthened)

- **Design.** Files with `archive_score > N` and no `pinned: true` get moved to `<sibling-dir>/<filename>-history/<YYYY-MM>.md` (per the feedback rule's naming convention) with a stub left at the original path: `> [!archived] Moved to [[archive-target]] on YYYY-MM-DD. Reactivate by removing this stub.` Curator runs monthly; Alton receives the move list and can veto.
- **Strengthened in v0.2.** The stub is non-negotiable. Wikilinks must remain valid (the stub-with-wikilink is what makes that work). **Never just delete.**
- **Reversibility.** Move-not-delete; `git mv` back to undo. Stubs make the old path resolvable forever.
- **Orientation score: +1.**

## D2a. Hearth exclusion (added 2026-05-08, codifies what was implicit)

`sartor/memory/hearth/` is exempt from D2's move-to-archive action and from D1's archive-scoring scan generally. Constitution v0.5 §16 names the hearth as sacred space; `hearth/integration.md` extends that to "decay does not touch this room." The exclusion is structural, not discretionary — `decay.py` skips any path with `"hearth"` in `path.parts` alongside `.meta`, and `feedback/feedback_hearth_exclusion.md` is the binding rule for every future pipeline owner.

## D3. Reactivation hook — unchanged from v0.1

When archived file is wikilinked from a recently-edited file, log a reactivation event. Three reactivations in 30 days → auto-promote.

## D4. Daily log rolling-summary — strengthened per directive 1

Daily logs >30 days old get summarized into `daily/_rolling/YYYY-MM-summary.md` AND the originals move to `daily/_archive/YYYY-MM/` (not deleted). Both files exist; the summary is the surface, the archive is the depth.

---

# Phase E — Governance (unchanged from v0.1)

E1 auto-action allowlist, E2 weekly memory-engineer report, E3 me ↔ memory-cartographer division of labor, E4 Constitution alignment. **No changes.**

**v0.2 addition to E1**: the auto-action allowlist explicitly excludes any operation that would `rm` (vs. `git rm`) a file with non-template content. Catches accidental over-aggressive cleanup at the policy layer.

**v0.2 addition to E2 — Phase B retro at +30d and +60d.** Per team-lead's 2026-05-02 note: B1' (inline pointers in skill bodies) is the v0.2 KISS verdict, but inline pointers can rot when target files move or rename. **Measure pointer-rot rate at +30 days and +60 days post-B1' rollout.** If rot exceeds (memory-engineer's gut: ~10% of pointers dangling), revisit the v0.1 B1-β proposal (`memory_relevance:` frontmatter, NOT the relevance-scoring algorithm — just the durable wikilink list) as a v0.3 candidate. The frontmatter version's only edge over inline-pointers was durability; this retro tests whether that edge matters in practice. Door left open in writing.

---

# §F — Sequencing (revised)

```
NOW  : Cartographer redoes A1 with paired-archive output (MEMORY.md + reference/MEMORY-history/2026-04.md)
       → team-lead surfaces both to Alton for greenlight
Week 1: A1 (after greenlight) + A2 (with cartographer's keep-list) + A6 (feedback triggers)
Week 1: A3 wikilink audit AFTER A1 lands (so new archive targets are in the graph)
Week 2: B2 INDEX.md sweep + B3 tagging pass (the KISS substrate Alton asked for)
Week 2-3: B1' inline pointers (rolling, per skill, as memory-engineer touches each)
Week 3-4: C1 + C2 (project index + folder hygiene); C3 + C4 (cross-references)
Ongoing: D1 → D2 → D3 → D4 (archive scoring, sidecar moves, reactivation, rolling summaries)
Continuous: E1-E4 governance
```

# §G — Risks (revised for v0.2)

| Risk | Impact | Mitigation |
|---|---|---|
| Cartographer's redo of A1 produces an archive that itself loses signal | Lost-fact failure on the cleanup that's supposed to prevent lost-fact failures | memory-engineer reviews the paired-files diff before Alton sees it; the verbatim-preservation predicate is checkable (`grep -c <unique-string>` on both source and archive) |
| INDEX.md auto-generation overwrites manual edits | Manual curation lost | B2 spec mandates a `## Manual` section preserved across regenerations |
| B1' inline pointers rot when target files move | Pointer references become dangling wikilinks | A3's wikilink audit runs weekly post-implementation; pointers caught in the same sweep as other dangling links |
| Subagent doesn't actually read the inline pointer | Pattern fails silently | B1' is observable: if a subagent should have read X and didn't, the failure surfaces in their output. Adjust pointer wording or skill body if needed. |
| Archive files themselves accumulate unbounded | New form of bloat | D2's monthly rollover bounds archive growth; D4's rolling summaries do the same for daily logs. Archive directories grow linearly with time, not with edit volume. |
| `decay.py` default behavior doesn't match new "archive scoring" framing | Surprise deletion | A5 must be report-only first run; D2's first move requires explicit Alton approval per E1 |
| MEMORY.md.proposed already collapsed detail v0.1 had not yet caught | First archive pair has gaps | Cartographer redo (NOW item) re-derives the archive directly from current `MEMORY.md`, not from the already-trimmed `MEMORY.md.proposed` |

# §H — Open questions for Alton (greenlight gates, revised for v0.2)

1. **A1 archive approach.** Approve the paired-file design (trim `MEMORY.md` + verbatim sidecar `reference/MEMORY-history/2026-04.md`)? **This is the new gate-1 question; v0.1's gate-1 (the bare swap) is superseded.**
2. **A2 still applies as-written.** Inbox dedup with cartographer's keep-list, same-PR upstream + catchup-skill fixes. Already greenlit by team-lead; Alton's veto window applies.
3. **Phase D archive-stub semantics.** When a file gets archived, the stub left in place reads `> [!archived] Moved to [[X]] on YYYY-MM-DD. Reactivate by removing this stub.` Acceptable, or want a different visible form?
4. **B2 INDEX auto-generation.** Approve a curator-class script that walks each subdir and emits a sorted table, preserving a `## Manual` section across regenerations? Or want manually-curated INDEXes that don't drift from auto-output?
5. **A6 directory-split layout.** Approve the proposed `feedback/{always, machine-business, family, multi-agent, privileged}/` split? Or override toward a different bucketing? My split is illustrative; cartographer can refine after A1 redo lands.
6. **A2 sub-step 3g (`docs/USER.md` fix).** Per pipelines-auditor's investigation (`docs-user-md-investigation.md`), USER.md was never built — it's a wiring gap, not a regression. Two-part fix specced: (Part 1) wire `nightly-memory-curation/SKILL.md` to invoke `memory-curator` agent's dialectic-synthesis flow as a Step 6; (Part 2) bootstrap `docs/USER.md` with a v0 seed from current ALTON.md highlights. Approve adding both to the Week-1 PR? Pipelines-auditor flagged Optional Part 3 (sync the v2.0 spec to runtime stub — abandoned 2026-04-12 P0); recommend including it.

The v0.1 question about B1 architecture choice (β vs γ vs α) is **closed**. Alton picked KISS / .md + indexing. Phase B is now B1' + B2 + B3. No MCP, no schema machinery.

# §I — Cost and risk budget

- **Cost.** All software; no new compute, no MCP infrastructure (saved per directive 2). ~1 week for revised Phase A; ~2 weeks for B2 INDEX sweep; rolling for B1' pointers.
- **Personnel.** memory-engineer (alive), memory-cartographer (alive — being re-tasked for A1 redo), occasional memory-builder sub-executor (spec drafted at `memory-builder-brief-2026-05-02.md`; not spawned).
- **Risk register.** §G above.

## History

- 2026-05-02: v0.2 drafted by memory-engineer after Alton's two directives (archive-not-collapse + KISS-no-MCP) relayed by team-lead. v0.1 preserved verbatim at `_archive/memory-improvement-program-v0.1.md` per Alton's own principle. New feedback rule `feedback_archive_not_collapse.md` written to bind future cleanup. Cartographer re-tasked for A1 paired-archive output. Status: `revised, pending-alton-greenlight-on-A1-archive-approach`.
