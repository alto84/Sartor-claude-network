---
name: memory-improvement-program-v0.1
type: plan
entity: memory-improvement-program
status: proposed
ratification: pending-alton
volatility: medium
priority: p1
date: 2026-05-02
updated: 2026-05-02
updated_by: memory-engineer (family-thread)
related: [MEMORY-CONVENTIONS, MULTI-MACHINE-MEMORY, memory-cartography, pipelines-audit, family-memory-fixup, sartor-agent-os/PLAN-FINAL]
tags: [meta/plan, domain/memory, household/governance]
aliases: [Memory Improvement Program, MIP v0.1]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Memory Improvement Program v0.1

> [!warning] Design only. Nothing in this document modifies memory or any pipeline. Each phase is ratifyable independently and reversible (move-not-delete throughout). Builds on existing pipelines (`personal-data-gather`, `morning-briefing`, `todo-sync`, `nightly-memory-curation`); does not break them.

## §0 — The five constraints, restated for verification

Every item below is scored against all five. If an item violates one, it is cut.

1. **Context-aware.** Does the next Claude session land more or less oriented? (`+2 / +1 / 0 / -1 / -2`.) Anything that grows the auto-injected payload pays a tax.
2. **JIT, not session-start.** Memories surface when an action touches a related entity, not as session boilerplate. Move from "every session reads MEMORY.md" toward "every action reads exactly the relevant memories."
3. **Project plans indexed and JIT-injectable.** `projects/` becomes a navigable, cross-referenced layer that surfaces in skill prompts.
4. **Decay, not prune.** Old documents become *less visible*, not destroyed. Reversible aging.
5. **Incremental, ratifyable, reversible.** No big-bang. Each phase ships independently. Existing pipelines preserved.

## §0a — Today's failure modes (the program addresses these)

From `memory-cartography.md` and `pipelines-audit.md`, both 2026-05-02:

- **MEMORY.md silent truncation.** 30 KB file, ~24.4 KB injection cap, content past line 200 lost. Today's session-start payload is partial and the curator does not know.
- **Inbox poisoning.** 260 inbox files; ~46% are daily-replicated `entity_*` template dupes (`entity_alton`, `entity_rental`, `entity_aneeta`, `wifi_password`, `entity_vishala`) across 13 days × ~5 templates = ~65 near-identical files. Real one-shot signals (Wohelo $12.9K, Aneeta employer change, Tribeca pediatrics) sit in the same directory unsearchable.
- **HOUSEHOLD-CONSTITUTION.md bloat.** 1,300 lines, plus a 1,263-line v0.2 archive copy. Auto-injected via `inject-user-context.sh`? Verify; if so, this alone could be eating half the budget.
- **Wikilink integrity unaudited.** v0.3 typed wikilinks shipped 2026-04-18 with `extract_graph.py` writing 21 seeded edges to `data/graph.jsonl`. No sweep since. Targets like `[[10-MASTER-PLAN]]` in `MEMORY-CONVENTIONS.md` may dangle.
- **`projects/` is a flat namespace.** 57 files, 33 root-level `unifi-takeover-2026-05-01-*` siblings, no JIT-injectable INDEX.md surface (`projects/INDEX.md` exists but is 13 days old and only enumerates infrastructure + family).
- **No decay mechanism.** `decay.py` exists in `sartor/memory/` but pipelines-audit does not show it wired to any cron.
- **`family-memory-fixup` plan from 2026-04-25 never executed.** Files have grown since (active-todos +464 lines, FAMILY.md +31). The diagnosed pathology is worsening.

## §0b — Coordination notes

- **`family-thread-dossier/` is the workspace** for this program plus the family-memory work; it lives under `projects/` and will itself be one of the first entries in the JIT project index built in Phase C.
- **`sartor-agent-os/PLAN-FINAL.md`** (HEARTH, 2026-04-25, status `pending-alton-greenlight`) is the broader Agent OS plan. This program is **scoped narrower** (memory architecture only) and is **compatible** — Phase A here is a precondition for HEARTH §3.A2 (auto-reauth) since both depend on a clean inbox.
- **`family-memory-fixup` (2026-04-25, status `proposed`, never executed)** is **scope-overlapping with this program in its Phase 2.2 / 2.3** but is **family-specific**. Recommended treatment: this program's Phase A unblocks the fixup's Phase 1; the fixup itself stays under `family-curator`'s ownership, not `memory-engineer`'s. We coordinate; we do not absorb.

---

# Phase A — Stabilize (this week)

Goal: stop the active bleeding so subsequent phases build on solid substrate. All three items are mechanical, scoped, and reversible.

## A1. MEMORY.md trim swap

- **Design.** Swap `MEMORY.md` (30,027 bytes, 76 lines, over the ~24.4 KB session-injection cap and silently truncated past line 200) with `MEMORY.md.proposed` (7,341 bytes, 74 lines, drafted today by memory-cartographer). The proposed version preserves the index structure, preserves frontmatter, preserves all critical-rules text verbatim, and compresses the History section from a 25-entry essay to one-line wikilinked summaries that point at the topic files where the detail already lives. No facts lost; detail moves to `[[daily/2026-XX-XX]]` files and to topic memory files that already hold it.
- **Reversibility.** `git mv MEMORY.md MEMORY.md.bak` first, `git mv MEMORY.md.proposed MEMORY.md` second. To undo: swap back. The .bak stays in git history forever.
- **Orientation score: +2.** Next session lands without truncation, without silent context loss, and the History section becomes a navigable graph rather than a wall of prose.

## A2. Inbox poisoning drain (revised 2026-05-02 with cartographer's hard data)

> [!fact] Root cause identified by memory-cartographer 2026-05-02. Categorical breakdown of all 264 inbox files at `projects/family-thread-dossier/_inbox_analysis.py` output. Headline: 214 files (314 KB) are extractor-proposed memories; ~190 of those have `dedup_status: already_landed` written into their own YAML — the extractor *knows* the fact already exists in `ALTON.md` / etc. and writes the proposal anyway. The "Source quote" field for `entity_alton` is literally the catchup skill's boilerplate ("Read all Sartor memory files to get full context on Alton…"); the extractor fires on its own bootstrap text, treating "Alton" appearing in the read-instruction as a novel entity-mention. **Pure circular feedback loop, not a noisy filter.**

**Categorical breakdown** (from cartographer):

| bucket | files | bytes | drain verdict |
|---|---:|---:|---|
| `extractor_proposed` (proposed-memories + drained extractor archive) | **214** | 314 KB | **bulk-discard with one consolidated digest** |
| `rocinante_top` (rocinante inbox top-level memos) | 16 | 51 KB | review one-by-one; some are real specs |
| `peer_inbox_other` (gpuserver1 + rtxpro6000server task assignments) | 13 | 64 KB | review; mostly historic but a few may still be open |
| `peer_phone_home` (PHONE-HOME-* memos from peer machines) | 10 | 92 KB | review; these are real status reports |
| `processed_results` (`/_processed/` outcome reports) | 6 | 37 KB | keep — landed outcomes |
| `drained_archive` (`.drained/` rollups) | 4 | 27 KB | keep — already triaged |
| `rocinante_specs` | 1 | 10 KB | keep |

- **Design (final).** Cartographer's 2026-05-02 keep-list (`projects/family-thread-dossier/inbox-keep-list-2026-05-02.md`) refines the drain rule. The earlier subclass-blacklist was too narrow — `dedup_status: already_landed` is the universal predicate the extractor itself writes when the fact has already landed in the topic file, regardless of subclass.
  1. **Bulk-discard ~210 files via `git rm`.** Predicate: `dedup_status: already_landed` (any extractor_subclass). Cartographer's correction: includes 20 of the 46 singletons that were "unique-bodied" only because the source quote varied — the dedup engine still knows the fact landed.
  2. **Preserve summary.** Write `inbox/.drained/2026-05-02/extractor-bulk/SUMMARY.md` with per-category counts (counts come from cartographer's `inbox-bodyhash-table-2026-05-02.tsv` snapshot).
  3. **Hand-review ~8 singletons.** Predicate: `dedup_status: new` AND `extractor_subclass ∈ {explicit_memorize, task_batch, rule, preference, entity_vishala, entity_aneeta, dollar_amount}`. These are mostly low-value (Claude saying "remember this" mid-session) but worth a human eye. Cartographer's table flags each.
  4. **Auto-keep ~18 files.** Predicate: no `extractor_subclass` field at all (= not from the extractor; gather-runs and real reports — Wohelo $12,900, Aneeta Biogen→Neurvati, Tribeca pediatrics, AZ role change, MKA $2,037 donation, Solar Inference formation, $37K workstation pass-through, etc.). Already in `.drained/2026-04-19/`. No action needed.
  5. **Cross-check 23 peer files** (10 PHONE-HOME-* + 13 peer-task assignments). All KEEP-IF-OPEN. memory-builder cross-checks each against the `_processed/` companion directory and the relevant project doc (e.g., `PHONE-HOME-cato-003-charges.md` against `projects/sartor-agent-os/`).
  6. **Upstream fix in same PR.** Gate the extractor on `dedup_status != already_landed`. (Subclass-blacklist drops out — universal `already_landed` predicate covers all subclasses.) Likely substrate: the `SartorConversationExtract` Windows Scheduled Task (per `pipelines-audit.md` §F) running daily 11:30 PM. Without this, drain re-accumulates by 2026-05-09.
  7. **Same-PR catchup-skill fix.** Verified live in this very session via `<system-reminder>` skill list: catchup description "Read all Sartor memory files to get full context on Alton…" is the extractor's "Source quote" trigger. Either (a) catchup skill's invocation context should not flow into extractor eligibility, or (b) extractor should ignore source quotes matching a known-skill-template fingerprint.
  8. **Same-PR `docs/USER.md` investigation.** A4 found the SessionStart hook silently skips this file when missing; the file is missing today. Same diagnostic surface as items 6 + 7 (the curator's nightly outputs are not reaching their declared targets). memory-builder either restores the file's curator pipeline or removes the dead reference from the hook.
  9. **Re-run baseline + verify.** Cartographer's `_inbox_analysis.py` + `_singletons_and_peers.py` are pinned to `projects/family-thread-dossier/`. Run BEFORE the cleanup commit (snapshot baseline) and 7 days AFTER (verify `extractor_proposed` ≤ 30 files, no `dedup_status: already_landed` survivors, body_hash distribution flat).
- **Reversibility.** Bulk-discard via `git rm`, not `rm`, so files survive in git history forever (recoverable via `git checkout HEAD~1 -- inbox/...`). The SUMMARY.md + cartographer's TSV preserve the audit trail. Singletons reviewed individually against cartographer's table. Upstream extractor patch is a one-line filter; reverse with one-line removal. Hook script edit (or `docs/USER.md` line removal) is one bash conditional; reverse with edit.
- **Orientation score: +2.** With the upstream + catchup-skill fixes, the inbox stops generating noise altogether — the daily-flood failure mode is closed. Next curator pass walks real signal:noise. `nightly-memory-curation` stops doing futile work.
- **Risk update.** Earlier "drain misclassifies a real signal" risk is essentially closed by cartographer's per-file verdict. Worst case is one of the 8 singletons being misjudged on hand-review; recoverable via `git checkout`. The 18 auto-keep files have explicit cartographer marking; bulk-discard predicate cannot match them (no `extractor_subclass` ⇒ no `dedup_status` field interaction).

## A3. Broken-wikilink audit

- **Design.** Run `extract_graph.py` against the full corpus to refresh `data/graph.jsonl`, then sweep all `[[...]]` references in the corpus and emit `data/wikilink-audit-2026-05-02.md` listing every wikilink whose target file does not exist. **Do not rewrite anything** in this phase — only enumerate. Examples we already suspect dangling: `[[10-MASTER-PLAN]]` in `MEMORY-CONVENTIONS.md`; references to `[[02-research-scout]]`. Output gets handed to Alton as a triage list (rewrite vs. delete vs. point at archive), and to the curator as a future weekly task.
- **Reversibility.** Read-only. Nothing is changed.
- **Orientation score: +1.** Doesn't change what auto-loads, but enumerates the graph rot so we know what we're working with before Phase B's relevance scoring leans on link-density signals.

## A4. Verify what `inject-user-context.sh` actually injects

- **Design.** Read the hook. If it concatenates more than `MEMORY.md` (e.g., `feedback/*.md` + `HOUSEHOLD-CONSTITUTION.md` + `USER.md`), measure each component's contribution to the session-start budget. Today, **we do not know what the budget actually looks like** — A1 only addresses the MEMORY.md component. If feedback files alone are 50 KB or HOUSEHOLD-CONSTITUTION.md is auto-injected at 1,300 lines, A1 is necessary but not sufficient. Output: `docs/auto-injection-budget-2026-05-02.md`.
- **Reversibility.** Read-only.
- **Orientation score: +2.** This is *the* prerequisite for Phase B — without knowing what's already injected, we can't intelligently propose JIT replacement. Should arguably be A0; numbered A4 only because A1's swap is the user-visible "stop the bleeding" win.

## A5. Wire `decay.py` to a weekly cron (read-only first run)

- **Design.** `sartor/memory/decay.py` exists per the file listing but no scheduled task references it (per `pipelines-audit.md` cron table). Wire it to a Sunday-morning task in *report-only* mode for two weeks: it scores files by `time-since-updated × (1 / link-density) × (volatility-weight)` and writes `data/decay-report-{YYYY-MM-DD}.md` listing the top-50 candidates for archival. **No file moves yet** — that's Phase D. This is the read-only sensor.
- **Reversibility.** Read-only; cron disable to undo.
- **Orientation score: 0.** Doesn't change orientation today. Builds the data substrate Phase D needs.

---

# Phase B — Just-in-time injection (2-4 weeks)

Goal: shift from session-start broadcasting to action-time relevance. **The single architectural decision Alton most needs to weigh in on lives here.**

## B1. Three design options, one recommendation

We compare three substrates for "surface a memory when a related entity is touched":

### Option B1-α — SessionStart hook + relevance scoring (extend the existing hook)

- **How.** Extend `inject-user-context.sh` to read recent session context (last N tool calls' file paths, last N user-message tokens) and score memory files by overlap; inject only the top-K most relevant.
- **Pros.** One file to edit, no new substrate, fast to ship.
- **Cons.** **Still session-start, not action-time.** Cannot react to mid-session topic shifts. Hook runs once; if Alton starts on GPU pricing and pivots to family logistics, the GPU-pricing-relevant memories still occupy the budget.
- **Tradeoff.** Lowest cost, lowest leverage. Half-step.

### Option B1-β — Skill-prelude memory injection (skill-side)

- **How.** Each skill's `SKILL.md` declares a `memory_relevance:` frontmatter field listing wikilink-style memory entities relevant to that skill's domain. When the skill is invoked, a 30-line prelude is auto-prepended that injects the named memory files (or their head-section). E.g., `gpu-pricing-optimizer/SKILL.md` declares `memory_relevance: [feedback_pricing_autonomy, business/rental-operations, vastai-dispatch-wrapper-proposal]`; invoking the skill loads those three files into context for that turn.
- **Pros.** **Action-time.** Skill invocation is the natural relevance signal. No session-start budget impact. Fits Sartor's existing skill architecture (26 skills already documented). Schema extension only — backward-compatible.
- **Cons.** Requires touching every skill. Curator-class effort, ~30 file edits. Static relevance — does not learn.
- **Tradeoff.** Medium cost, high alignment with constraint #2.

### Option B1-γ — MCP-side relevance server

- **How.** A new local MCP server (`@sartor/memory-mcp`) exposes `memory.search(query)` and `memory.entity(name)` tools. Skills and agents call these on-demand. Pre-built embeddings index (`embeddings.py` already exists in `sartor/memory/` per file listing — confirms the substrate is partially in place).
- **Pros.** **True JIT and learnable.** Embedding-based recall, not declared-graph. Can score by access-recency + edit-recency + cross-link count + user-pinning (the four signals Alton named in the brief). Composable with B1-α and B1-β.
- **Cons.** New substrate. New failure mode (MCP server crash = silent memory loss). Per CLAUDE.md constraint, all skills already work without it; degradation must be graceful. Effort: 1-2 weeks to ship MVP.
- **Tradeoff.** Highest cost, highest leverage, highest blast radius.

### B1 recommendation

**Ship B1-β first; B1-γ in v0.2; B1-α never as a standalone but optionally as a fallback for non-skill sessions.**

Why: B1-β is fastest to constraint-satisfaction (action-time, JIT, no session-start tax), reuses existing schema, and the schema-extension itself becomes the public contract that B1-γ later implements as an inferred index. Shipping B1-γ first risks building infrastructure for relevance signals that the skills' authors never declared, leading to embedding-search drift. Shipping B1-β makes every skill author *think about* what memories its work depends on, which is itself a system-quality intervention.

- **Reversibility.** Schema field is optional; if removed, skills behave as today. Feedback files unaffected.
- **Orientation score (B1-β): +2.** Next session reading a skill will land *with the right memories*, not with a 25 KB index it has to navigate.

## B2. Feedback-rule JIT loader

- **Design.** Today every `feedback/*.md` file is auto-injected at session start (per MEMORY.md "Feedback rules (auto-injected)"). 17 files today; will grow. Replace with a relevance-aware loader: feedback files declare `triggers:` frontmatter (entity names, file globs, tool calls) and only inject when matched. E.g., `feedback_pricing_autonomy.md` triggers when `vastai`, `gpu-pricing-optimizer`, or `business/rental-operations.md` appears in the action context. Generic rules (e.g., `completeness-principle.md`, `interior-report-discipline.md`) keep `triggers: [always]` for now and continue to inject every session.
- **Reversibility.** Default `triggers: [always]` preserves today's behavior; relevance-narrowing is opt-in per file.
- **Orientation score: +1.** Slight session-start budget reduction; bigger win is that infrequent feedback files (`feedback_pricing_autonomy.md` is 52 lines) stop occupying budget on family-only sessions.

## B3. Skill-prelude prototype on three skills

- **Design.** Pilot B1-β on three skills with sharply different memory-relevance: `gpu-pricing-optimizer` (machine-business), `morning-briefing` (cross-domain), `family-scheduler` (family-only). Measure: do the prelude-injected memories actually get cited by the skill's output? If yes, generalize. If no, the relevance declarations are wrong and the schema needs revision before broader rollout.
- **Reversibility.** Three frontmatter additions; remove to undo.
- **Orientation score: +1.** Validates the design before committing to 23 more skill edits.

---

# Phase C — Project index + cross-reference (2-4 weeks)

Goal: `projects/` becomes a navigable, JIT-injectable, cross-referenced layer that the `complex-project` skill can read as a first-class artifact.

## C1. `projects/INDEX.md` rebuild

- **Design.** Today's INDEX.md (37 lines, 13 days old) lists infrastructure + family but misses: `family-thread-dossier/`, `sartor-agent-os/`, `unifi-takeover-2026-05-01-*` (16 sibling docs that should be one folder, not 16 root-siblings), `aneeta-peer-setup`, `rtxserver-vastai-watch`, `machine-self-stewardship`, `dashboard-rebuild`, `family-todos-longrunning-thread`. Rebuild as a typed index: each project gets one row with `status`, `ratification`, `priority`, `last_updated`, `owner`, `entry_doc`, and `related:` typed wikilinks. Auto-generated by a curator pass walking `projects/*/INDEX.md` or top-level `*.md` frontmatter; fallback to file mtime + title if no frontmatter.
- **Reversibility.** Old INDEX.md preserved as `projects/INDEX-2026-04-19.md` archive.
- **Orientation score: +2.** Any session asking "what's in flight?" lands on a single page with structured rows, not a 37-line memo.

## C2. Project-folder hygiene pass

- **Design.** Move the 16 `unifi-takeover-2026-05-01-*` root-level siblings into `projects/unifi-takeover-2026-05-01/` subfolder. Same for any project that has accumulated >3 sibling files. The project's `INDEX.md` becomes the entry point, declared in C1's typed index. Wikilink-rewriter sweep updates references in lockstep (Phase A3's audit gives us the inventory).
- **Reversibility.** `git mv` operations; reverse to undo. Wikilinks tracked in `data/graph.jsonl`.
- **Orientation score: +1.** Doesn't change orientation per se but stops `projects/` from acquiring more namespace pollution.

## C3. `complex-project` skill integration

- **Design.** When `complex-project` skill is invoked, prelude (per B1-β schema) auto-injects `projects/INDEX.md` plus the project's own `INDEX.md` if one exists. New projects spawned via this skill get a stub `INDEX.md` with the typed row pre-populated. Closes the loop: `complex-project` was the substrate that *produced* `family-thread-dossier/` and `sartor-agent-os/`, but neither was registered in `projects/INDEX.md` — exactly the gap C1+C3 closes.
- **Reversibility.** Skill edit; revert via git.
- **Orientation score: +1.** Future `complex-project` invocations land oriented to existing project state, reducing the "is there already a plan for this?" failure mode.

## C4. Cross-reference pass: link `family-thread-dossier`, `family-memory-fixup`, `sartor-agent-os`, this program

- **Design.** These four documents overlap in scope but don't reference each other systematically. Add a "Related programs" callout block to each pointing at the others, with one-line scope statements. E.g., this program → "scope: memory architecture; family-memory-fixup → scope: family-layer cleanup; sartor-agent-os → scope: full Agent OS upgrade." Prevents future Claude from re-discovering the relationship by spelunking. Already partially done in this file's frontmatter `related:` field; C4 makes it bidirectional.
- **Reversibility.** Edit; revert.
- **Orientation score: +1.** Anyone landing on any one of the four lands oriented to all four.

---

# Phase D — Decay (ongoing)

Goal: old documents become *less visible*, not destroyed. Time-weighted relevance + reversible archival + reactivation when an old doc becomes hot.

## D1. Decay scoring formalized

- **Design.** Score every memory file by:
  ```
  decay = w1 × days_since_updated
        + w2 × days_since_last_accessed
        - w3 × inbound_link_count        (popularity = stickiness)
        - w4 × outbound_typed_link_count (richness = stickiness)
        - w5 × user_pinned_bonus         (manual override)
        × volatility_multiplier          (high-volatility files decay faster)
  ```
  Initial weights: w1=1, w2=2, w3=0.5, w4=0.3, w5=10, volatility from MEMORY-CONVENTIONS field. Phase A5 already wires the read-only report; D1 formalizes the formula and surfaces it in the report's header.
- **Reversibility.** Scoring is read-only. Re-tune weights by editing one config file.
- **Orientation score: 0.** Sensor only; orientation impact comes from D2.

## D2. Move-to-archive at threshold

- **Design.** Files with `decay_score > N` and no `pinned: true` frontmatter get moved to `archive/{YYYY-MM}/` (mirroring source path) and replaced with a stub: `> [!archived] This file moved to [[archive/2026-05/path/...]] on 2026-05-31. Reactivate by removing this stub.` Stub keeps wikilinks valid. Curator runs monthly; Alton receives the move list and can veto.
- **Reversibility.** Move-not-delete; `git mv` back to undo. Stubs make the old path resolvable.
- **Orientation score: +1.** Reduces the size of the active corpus that curator-class skills walk; old daily logs, drained inboxes, and archived-by-other-means files (e.g., `reference/archive/HOUSEHOLD-CONSTITUTION-v0.2.md` at 1,263 lines, currently in main tree) move out of the working set.

## D3. Reactivation hook

- **Design.** When an archived file is wikilinked from a recently-edited file, or when its entity is mentioned in a session, the decay scorer notes a "reactivation event" in `data/reactivation-log.jsonl`. After three reactivations in 30 days, the file auto-promotes back to its original location. Closes the "old documents are less valuable but never useless" loop — they become *less visible*, not lost.
- **Reversibility.** Read-only sensor first; promotion is itself a `git mv`.
- **Orientation score: +1.** Old plans that become hot again (e.g., `family-memory-fixup` if Phase A unblocks it next week) re-surface without manual intervention.

## D4. Daily log rolling-summary

- **Design.** `daily/YYYY-MM-DD.md` files older than 30 days get summarized into `daily/_rolling/YYYY-MM-summary.md` (one file per month, ~50 lines). Original daily logs move to `archive/` per D2. Pattern matches the gather-history pattern proposed in `family-memory-fixup` Phase 2.2 (`family/_history/` rolling).
- **Reversibility.** Move-not-delete; summaries are additive.
- **Orientation score: +1.** Daily logs are the largest growing segment (44 files today, 4 of them >500 lines); rolling summaries keep the latest month browseable while the rest compresses.

---

# Phase E — Governance (continuous)

Goal: keep `memory-engineer`, `memory-cartographer`, and Alton in the loop without ceremony. What is automatic, what asks-first, what gets reported.

## E1. Auto-action allowlist

- **Design.** A short, posted list of memory operations that the program runs automatically without ratification:
  - Phase A2 inbox dedup (after first ratification, weekly thereafter)
  - Phase A3 wikilink audit (read-only, weekly)
  - Phase A5 / D1 decay report (read-only, weekly)
  - Phase B2 feedback `triggers: [always]` default-on
  - Phase C1 INDEX rebuild (read-only regeneration; manual edits to entries preserved)
- **Asks-first list:**
  - Any move-to-archive (D2) — Alton sees the proposed list and can veto
  - Any wikilink rewrite (Phase A3 follow-up) — Alton sees the diff
  - Any change to `inject-user-context.sh` payload composition (B1, B2)
- **Reversibility.** The allowlist itself is one file; edit to revoke.
- **Orientation score: 0.** Process discipline.

## E2. Weekly memory-engineer report

- **Design.** Friday afternoon cron writes `daily/memory-report-{YYYY-MM-DD}.md` summarizing: A2 dedups this week, A3 audit deltas, D1 decay candidates, B1 prelude-injection cache hits/misses (once B1-β ships), inbox poisoning rate. Goes to Alton's morning brief on Saturdays.
- **Reversibility.** Cron disable.
- **Orientation score: +1.** Closes the curator-class observability gap that pipelines-audit flagged ("no agent/skill/cron is responsible for *pruning*").

## E3. Memory-engineer / memory-cartographer division of labor

- **Design.** `memory-engineer` (this role) owns architecture, schema, pipelines, the program itself. `memory-cartographer` owns inventory, audit, ground-truth scans. Hand-offs via `family-thread-dossier/` workspace files plus direct messages on the team thread (already in use today). When a third role is needed (e.g., `memory-builder` to execute Phase A2 drain script), team-lead spawns it; this program does not pre-allocate it.
- **Reversibility.** Role definition; revisit on charter review.
- **Orientation score: 0.** Process.

## E4. Constitution alignment

- **Design.** Memory operations that touch family, medical, or Aneeta's domain inherit the firewall constraints from HOUSEHOLD-CONSTITUTION §2a / §3 (per `sartor-agent-os/PLAN-FINAL.md` §3.C). Specifically: D2 archival of any `family/medical/*` or `family/aneeta/*` file requires explicit Alton approval, never autonomous. Same for B2 trigger declarations on family files.
- **Reversibility.** Policy; documented here.
- **Orientation score: 0.** Compliance, not orientation.

---

# §F — Sequencing and ratification gates

```
Week 1: A1 (MEMORY.md swap) + A4 (auto-injection audit)            [ratify together]
Week 1: A2 (inbox drain) + A3 (wikilink audit) + A5 (decay report) [ratify together]
Week 2: B1 design decision (Alton picks B1-β yes/no/modify)        [decision gate]
Week 2-3: B3 (3-skill prelude prototype) + B2 (feedback triggers)  [ratify if B3 validates]
Week 3-4: C1 + C2 (project index + folder hygiene)
Week 3-4: C3 + C4 (skill integration + cross-reference)
Ongoing: D1 → D2 → D3 → D4 (one per month, in order)
Ongoing: E1, E2, E3, E4 (continuous)
```

Each row is a ratification gate. Alton's chat-yes on the row gate fires it. Default if no answer: gate doesn't fire; program waits.

# §G — Risks

| Risk | Impact | Mitigation |
|---|---|---|
| MEMORY.md swap loses a fact | Trust erosion + rework | A4 audit runs first; `.bak` preserved; Alton reviews diff |
| Inbox drain deletes a real signal | Lost-fact failure | **Materially reduced by 2026-05-02 cartographer evidence:** dupes are byte-identical bodies with `dedup_status: already_landed` self-attestation. ~190 files bulk-discarded via `git rm` (recoverable from history). ~10 singletons hand-reviewed against cartographer's explicit keep-list before any action. SUMMARY.md preserves per-category counts. |
| B1-β skill-prelude eats more budget than B1 saves | Net negative on constraint #1 | B3 pilot measures actual budget delta before broader rollout |
| Decay scorer mis-judges and archives a hot file | Lost-orientation | D3 reactivation hook; D2 weekly Alton-veto window |
| `family-memory-fixup` ownership conflict | Duplicate work | E3 explicit division of labor; this program scopes to memory architecture, not family-layer content |
| MEMORY.md.proposed itself has the wrong History compression | First swap is wrong | Easy revert; we own this artifact |
| HOUSEHOLD-CONSTITUTION.md is auto-injected at full 1,300 lines and we didn't know | Phase A1 alone is insufficient | A4 audit catches this in week 1; if true, swap-or-stub the constitution becomes Phase A1.1 |

# §H — Open questions for Alton (greenlight gates)

These are the chat-message yeses I need before live execution begins. State your answer in chat; we'll record verbatim with timestamp.

1. **A1.** Approve the MEMORY.md → MEMORY.md.proposed swap? *(Default if no answer: hold; the bleeding continues but is documented.)*
2. **B1 architecture.** Confirm B1-β (skill-prelude memory_relevance) as the primary substrate, with B1-γ (MCP relevance server) deferred to v0.2? Or override toward B1-α (extend SessionStart hook), B1-γ first, or a hybrid? *(This is the single decision most worth your direct input. Default if no answer: B1-β proceeds in pilot via B3.)*
3. **D2 archival authority.** Default-on with Alton-veto-list (autonomous archive after weekly veto window expires), or default-off (every move requires explicit yes)? *(Default if no answer: default-off; you approve each move.)*
4. **E1 auto-action allowlist.** Approved as-is, or trim further? *(Default if no answer: I treat the allowlist as proposed-only and ask before each item.)*

# §I — Cost and risk budget

- **Cost.** All software; no new compute. ~1 week of session-time for Phase A; ~2-4 weeks for Phase B; Phase C overlapping; Phase D ongoing background.
- **Personnel.** `memory-engineer` (this role, alive on `family-thread`), `memory-cartographer` (alive, sister role), occasional `memory-builder` sub-executor when Phase A2 drain script ships.
- **Risk register.** §G above.

## History

- 2026-05-02: v0.1 drafted by `memory-engineer` on `family-thread` after reading `memory-cartography.md`, `pipelines-audit.md`, `family-memory-fixup.md`, current `MEMORY.md` + `MEMORY.md.proposed`, `MEMORY-CONVENTIONS.md`, `sartor-agent-os/PLAN-FINAL.md`, `projects/INDEX.md`, and a sample feedback file (`feedback_pricing_autonomy.md`, `completeness-principle.md`). Status: `proposed`, ratification: `pending-alton`. Sent to team-lead for relay.
