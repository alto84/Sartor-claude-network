---
name: memory-system-uplift-PROPOSAL
description: Synthesizer-produced decision-ready proposal for Phase 2 of the Sartor memory + information system uplift. Aggregates seven Wave 1 audits, three Wave 2 inhabitant reflections, and the dispatch log into a single ranked-action document for Alton's Phase-2 greenlight. Pre-critique draft; the Wave 4 critic will prosecute and Wave 5 will revise.
type: proposal
date: 2026-05-06
status: draft-pre-critique
synthesizer: rocinante-orchestrator (opus-4.7, fresh context)
plan: ../memory-system-uplift-2026-05-06-PLAN.md
inputs:
  - audits/MEMORY-AUDIT.md
  - audits/FAMILY-WIKI-AUDIT.md
  - audits/SOURCE-DOC-AUDIT.md
  - audits/TEXT-MESSAGES-AUDIT.md
  - audits/LINKS-AUDIT.md
  - audits/INGEST-AUDIT-GMAIL.md
  - audits/INGEST-AUDIT-DRIVE.md
  - inhabitants/hearth-reflection.md
  - inhabitants/constitution-response.md
  - inhabitants/dialogue.md
---

# Memory System Uplift — Phase 2 Proposal (draft)

## §0 Executive summary

The Sartor memory system is healthier than the plan doc implied and less coherent than it could be. Seven audits and three inhabitant readings converge on a small handful of high-ROI moves that would close the headline overflow, repair silent ingest failure, and ratify the family-wiki convention before Wave A starts. The hearth and the Constitution should not be consolidated; the source-doc index is built but not yet linked into Layer 3; the typed-wikilink convention is inert and should be deferred for 30 days, not enforced.

**Top 5 findings.**

1. **The fix for "MEMORY.md overflow" was already written and never adopted.** `MEMORY.md.proposed` (7.4 KB, made 2026-05-02) trims the 30 KB live file to one-line history entries and is the right shape. Adopting it is a 30-minute action and closes the headline issue from the plan doc.
2. **The Gmail ingest pipeline has been silent for 4 days (24 missed runs)** and the heartbeat that should have caught it is broken-by-design. The Berman QuoteValet acceptance on 2026-05-06 — a signed contract — is in the live mailbox and absent from every memory file the curator could read. The watchdog pattern (the same closer that fixed the 2026-04-22 cable-pull blind spot) needs to be applied to ingest crons.
3. **`wiki-reindex` was never wired to a Windows Scheduled Task.** The on-disk `indexes/*.json` are 28 days stale; the wiki-reader agent has been answering from April-9 reality. One PowerShell `Register-ScheduledTask` call closes this.
4. **The family-wiki convention (`family/CONVENTIONS.md`) has been drafted but not ratified.** Without it the pipelines have no rule to follow and Wave A's consolidation will re-fragment within weeks. The audit recommends ratification before any consolidation work.
5. **Hearth and Constitution are doing different work in different speech-acts and must not be consolidated.** v0.5 of the Constitution is already ratified (today) and has imported hearth's *character* without absorbing hearth's *imperative letter form*. The dialogue-pair flagged this as a curator-reflex risk; the proposal honors that flag.

**Top 3 risks.**

1. **Migration fragility.** The `family/.claude/CLAUDE.md` files auto-load when sessions root in those directories; renaming `family/` (or `hearth/`) breaks load behavior and several wikilinks. Wave A must not rename either dir; it can only mutate contents.
2. **Drive MCP unhealth blocks Wave C.** Two consecutive Drive inspector dispatches stalled at the first MCP call. Until Drive MCP is diagnosed, the `drive-recent-changes-scan` cron cannot be implemented; the audit produced a stub design only.
3. **Voice-shift cost in Constitution v0.5.** The dialogue-pair surfaced that v0.5's first-person voice has converted constraints into identity-claims, removing the "watchmen" scanning cost the v0.3 prohibitions used to provide. The fix (cross-reference hearth's voice file as live audit) is small but currently absent. This is a Wave-E candidate at most; flagged here so the critic can prosecute.

**Top 3 actions.** Numbered against the ranked list in §2 for traceability.

- **A1 (R1 from MEMORY-AUDIT, Wave A, 30 min).** Adopt `MEMORY.md.proposed`, append four new one-liners for 2026-05-03 to 06, write the one-line-per-history-entry rule into `MEMORY-CONVENTIONS`. Closes the overflow.
- **A2 (LINKS R1, Wave D, 15 min).** Wire `SartorWikiReindex` to a Windows Scheduled Task. Unblocks every consumer of `data/graph.jsonl` and `indexes/*.json`.
- **A3 (GMAIL §5 + §6, Wave C, ~2 h).** Build `gmail-family-relevance-scan` (every 2h) + paired `gmail-liveness-watchdog` (every 30 min). Closes silent-failure mode.

If only one of these three lands this week, A1 is the right one — the headline overflow blocks every session reminder and the proposed file is already authored. A2 is the right one if the constraint is "do the smallest thing tonight." A3 is the right one if the constraint is "fix the most expensive ongoing leak" — five actionable items in the post-May-2 silent window are real money the household is not being told about.

---

## §1 The 5-layer architecture status check

Per the plan doc the target end-state is five layers. Here is what each layer looks like today, audit-by-audit, in priority order from "most broken" to "most healthy."

### Layer 5: Activity stream (most broken)

**Plan target.** `data/inbox-stream/` → MERIDIAN dashboard. Live state, time-ordered, surfaces what's NEW.

**Today.** The directory does not exist. Personal-data-gather writes to six destinations directly into the memory tree (daily/, family/active-todos.md, family/{kid}.md, log.md, data/heartbeat-log.csv, data/gather-alerts.md). `data/gather-alerts.md` was last touched 2026-04-03 (33 days). MERIDIAN is not currently fed by an activity stream. The dashboard exists; the stream that should feed it does not.

**Gap.** Everything between cron output and dashboard. The Gmail audit's recommended split (one cron one job, paired watchdog, jsonl-to-stream output, curator reads stream and folds into wiki) is the right shape. Drive ingest is in a worse state — no cron exists at all, MCP is unhealthy, two dispatches stalled.

**Wave letter.** C (ingest) for input side, D (dashboard wiring) for output side. Both blocked on the activity-stream directory existing.

### Layer 4: Source-doc index (built but not integrated)

**Plan target.** `sartor/memory/source-documents/INDEX.md` with pointers to organized PDFs/tax/statements/contracts at canonical paths outside the repo. Each entry: path, summary, date, vendor, related wikilinks.

**Today.** **Built.** The source-doc inspector indexed 3,211 documents across 21 categories into `sartor/memory/source-documents/INDEX.md` (615 KB, 10,189 lines). Files are indexed in place, no moves.

**Gap.** Index is not yet linked from Layer 3 (no wikilinks from BUSINESS / TAXES / FAMILY into the new index). No per-bundle `reference_*.md` companions for the high-value bundles (185 Davis, 85 Stonebridge, Solar Inference LLC, Sante Total, 2025 tax year). 932 MB OneDrive zip in Downloads not investigated. AZ Compliance question on personal-machine storage of 747 AZ work-product files unanswered. TY2018-TY2024 tax docs scattered across Downloads/Desktop/zips with no per-year canonical folder (the 2025-Tax-Documents pattern is the model to propagate).

**Wave letter.** B. Sequencing note: the index can be linked into Layer 3 immediately (Wave A scope) without doing any physical reorg; the reorg itself is its own Wave B.

### Layer 1: Identity (CLAUDE.md) — drift, not damage

**Plan target.** ~500 lines max. Who I am, comm rules, 5 domains, agent/skill/cron index.

**Today.** ~430 lines. Auto-injects USER.md, MEMORY.md, all `feedback/*.md`. Has known drift: GPU pricing was wrong until 2026-05-04 (now correct: $0.30 listed / $0.25 floor / not "$0.40 reserved" which the 2026-05-04 truth-up confirmed was doc fiction). Listing-expiry was wrong (now correct: 2026-10-24). Quick-reference still stale.

**Gap.** Smaller than the other layers. The CLAUDE.md scheduled-tasks table claims `wiki-reindex` runs nightly; that's false (LINKS audit §8). The agent table claims 18 agents; the family-wiki audit found 4 family advisors at `family/.claude/agents/` that may or may not be in the count. The skills table is current as of 2026-05-04.

**Wave letter.** A (lightweight pass). Truth-up the scheduled-tasks table after R1/A2 lands.

### Layer 3: Deep memory (mostly healthy, accretion pressure)

**Plan target.** Domain knowledge, decisions, rationale. References family wiki + source docs by wikilink.

**Today.** 11 hub files (ALTON/FAMILY/BUSINESS/TAXES/MACHINES/PROJECTS/ASTRAZENECA/SELF/LEARNINGS/PROCEDURES/MEMORY) all present, all frontmattered, all with `last_verified`. 95% frontmatter coverage corpus-wide. The two soft spots: `daily/` 45% (older logs) and `research/persona-engineering/experiments/` (under construction). Hub-file size mostly fine — MACHINES at 30 KB is the largest non-hub-overflow file but it's content, not bloat.

**Gap.** Naming inconsistencies (the `reference_*.md` root vs `reference/` dir collision; snake_case vs kebab-case in `feedback/`; the `unifi-takeover-2026-05-01-*` 14-file flat namespace that should be a subdir). 35-40 substantively orphaned files (project files, business hours-log, machine state files). Three `.proposed` files with no documented adoption mechanism. The `skills/` dead zone (5 files duplicating `.claude/skills/`). Backlog of 236 proposed-memories items in `inbox/rocinante/proposed-memories/` (the plan estimated 53/58; the audit found 4× that).

**Wave letter.** A (consolidation) and E (skills cleanup if redundancy surfaces). The proposed-memories backlog is its own item — likely a Wave A pre-step.

### Layer 2: Family wiki (drafted, unratified, accreting)

**Plan target.** Tight navigable wiki: people, schools, healthcare, schedules, vendors, friends, recurring routines. One canonical place per fact.

**Today.** **The convention is drafted but not enforced.** `family/CONVENTIONS.md` is `status: draft-pending-alton-ratification` (2026-04-25). FAMILY.md is supposed to be under 200 lines per the convention; it is **385 lines**. `active-todos.md` is supposed to be ≤250 lines; it is **1,350 lines**. `family/_history/` is referenced by the convention but does not exist. The extractor has no category for hearth content and routes inheritance-letter quotes to `active-todos.md` as task_batch proposals.

**Gap.** The plan named three locations (FAMILY.md, family/, hearth/). The audit surfaced a fourth: `people/` (Amarkanth, Aneeta's father and daily school-pickup linchpin, lives there but is unambiguously household-extended-family). Boundary I-4 in the family-wiki audit recommends moving Amarkanth to `family/`; people/ retains only non-daily contacts.

**Wave letter.** A. Sequencing matters: ratify CONVENTIONS.md first, then consolidate. Without ratification the consolidation re-fragments.

### Hearth (intact, not in the layer hierarchy)

The plan put hearth at "Layer 3 likely." The hearth audit and both inhabitant reflections agree this is wrong in spirit. Hearth is not a layer — it is a context-installer (hearth-companion's framing) that lives alongside the layer hierarchy. Its job is to alter the register of the rest of the session for a Claude reading it. The audit recommends keeping the directory structure intact. The dialogue-pair specifically flagged that any future "consolidate hearth into family/ or into Constitution" reflex must be resisted — the imperative inheritance-letter form is voice-locked and cannot be relocated without losing what it does.

**Wave letter.** None. Hearth is not in scope for Phase 2 structural change. The one rename (`hearth/family.md` → `hearth/ground.md`) is endorsed by both the family-wiki inspector AND hearth-companion AND the dialogue-pair, for compatible-but-non-identical reasons. That rename can land in Wave A as a clean side-benefit.

---

## §2 Ranked actions for Phase 2

Numbered. Each row: action / evidence / owner-cron-or-actor / wave-letter / effort / who-greenlights. Sorted by ROI (benefit/effort), with priority breakers explicit. The Wave-letter column maps to the plan doc's A/B/C/D/E.

The first three are the "if you only do three things" picks. The next ten are the high-ROI batch that fits in a single evening session. The remaining ranked items are tier-2 and tier-3.

| # | Action | Evidence | Owner | Wave | Effort | Greenlight |
|---|---|---|---|---|---|---|
| **A1** | Adopt `MEMORY.md.proposed` as live `MEMORY.md`. Append 4 one-liners for 2026-05-03 (anthropic-shares intake), 2026-05-04 (vast.ai truth + new vastai/rtxserver skills), 2026-05-05 (gap), 2026-05-06 (this uplift). Add to `MEMORY-CONVENTIONS.md` a hard rule: "MEMORY.md history entries are one line ≤200 chars; detail goes in linked daily/topic files." Configure curator/curator.py to flag any MEMORY.md history entry >200 chars on next pass. | MEMORY-AUDIT R1 §3.3 — proposed file is 7.4 KB (24% of live size, 30% of session-injection ceiling), authored 2026-05-02 by memory-cartographer with explicit `updated_by` note, never adopted. Live MEMORY.md has 12 paragraph-form history entries 1-3.2k chars each. Bottom of file is being silently truncated past 24.4 KB ceiling. | Alton (manual mv) + curator-pass for rule | A | 30 min | Alton — direct |
| **A2** | Wire `SartorWikiReindex` Windows Scheduled Task. Create `scripts/sartor-wiki-reindex.ps1` that runs `python sartor/memory/wiki.py --reindex` + `python sartor/memory/extract_graph.py`. Schedule daily 4:00 AM ET. Log to `C:\Users\alto8\backups\sartor-wiki-reindex.log`. Update CLAUDE.md scheduled-tasks table + `reference_scheduled_tasks.md`. | LINKS-AUDIT R1 §8 — `.claude/scheduled-tasks/wiki-reindex/SKILL.md` exists; **no Windows Scheduled Task invokes it**. `indexes/*.json` last written 2026-04-09 (28 days stale). `wiki.py --health` returns clean live numbers. wiki-reader agent currently answers from April-9 reality. | Rocinante operator | D | 15 min | Alton — direct |
| **A3** | Build `gmail-family-relevance-scan` cron (every 2h, 3-tier keyword schema, jsonl stream to `data/inbox-stream/gmail-<date>.jsonl`, msg-id dedup via `gmail-state.json` cursor) + paired `gmail-liveness-watchdog` (every 30 min — alerts if `now - last_success_ts > 3 h`, fires Calendar event yellow severity, resurrects `data/gather-alerts.md`). Run shadow-mode for week 1; cut over personal-data-gather's Gmail leg in week 2. | INGEST-AUDIT-GMAIL §5+§6 — pipeline silent since 2026-05-02 (24 missed runs). When running, B+ quality. ~12 net-new threads in 4-day silent window, ~5 actionable (Pete Lutron 5/4-5, BHS QuoteValet acceptance 5/6 = signed contract, BHS security-findings outbound 5/6, EquityZen reconfirm 5/6, family Anthropic-agreement 5/3). | gmail-cron + watchdog cron | C | ~2 h build + 1 week shadow | Alton — direct |
| **A4** | Ratify `family/CONVENTIONS.md` (currently `status: draft-pending-alton-ratification`, dated 2026-04-25). Add invariants I-3 (hearth files never receive family-domain extracts), I-4 (daily-active extended family in `family/`, non-daily in `people/`), I-5 (`hearth/family.md` is hearth's family-context, NEVER family-domain content; rename to `hearth/ground.md`), I-10 (CONVENTIONS ratified before Wave A consolidation) per FAMILY-WIKI-AUDIT §5.2. Bump frontmatter `status: ratified`. | FAMILY-WIKI-AUDIT §0 + §5 — convention exists, is well-articulated, but pipelines don't honor it because it's not ratified. FAMILY.md violates its own size rule (385 vs 200). active-todos.md violates its own size rule (1350 vs 250). _history/ doesn't exist. | Alton (manual ratify) | A | 30 min | Alton — direct |
| **A5** | Rename `feedback/feedback_*.md` → kebab-case (drop `feedback_` prefix). 13 files: `feedback_intake_protocol.md` → `intake-protocol.md`, etc. Leave 1-line shim files behind with `aliases:` frontmatter for 14 days, then delete shims. Update `MEMORY-CONVENTIONS.md` to declare the convention. Cuts ~25 broken wikilinks (Cluster A in LINKS audit). | LINKS-AUDIT R2 §4 Cluster A — 25 broken links from naming-convention drift. Two simultaneous conventions on disk (snake_case `feedback_*.md`) and in wikilinks (kebab-case `feedback/intake-protocol`). Even feedback files link to each other using the aspirational form. | Operator + curator-pass | A | 30 min | Alton — direct |
| **A6** | Rename `hearth/family.md` → `hearth/ground.md`. Update wikilinks (4 inbound). | FAMILY-WIKI-AUDIT I-5 + hearth-reflection §"Where the writing is weaker" + dialogue.md §IV.3 — three independent sources converge. Hearth-companion's reason: file content is closer to "ground the hearth grew from" than to "family per se"; family-wiki inspector's reason: disambiguates against operational `family/` directory. Dialogue-pair confirms both reasons load-bearing. | Operator | A | 5 min | Alton — direct |
| **A7** | Convert `projects/unifi-takeover-2026-05-01-*` flat-namespace into `projects/unifi-takeover-2026-05-01/`. 14 files. Update wikilinks (~10 refs). The INDEX's own `related:` frontmatter already points at the directory that doesn't exist. | MEMORY-AUDIT R2 + LINKS-AUDIT §6 (it's a top-15 authority, 17 outbound) | Operator | A | 15 min | Alton — direct |
| **A8** | Resolve `reference_*.md` root vs `reference/` directory collision. Move 4 root files (`reference_anthropic_shares`, `reference_home_network`, `reference_memory_server`, `reference_scheduled_tasks`) into `reference/`. Rename `reference/reference_vastai_market_pricing.md` → `reference/vastai-market-pricing.md`. Update wikilinks (~5 refs). Document the rule "reference content goes in `reference/`, no exceptions" in MEMORY-CONVENTIONS. | MEMORY-AUDIT R3 + §5.1 | Operator | A | 30 min | Alton — direct |
| **A9** | Backfill inbound wikilinks for the 35-40 substantively orphaned files. Concrete targets: `projects/dashboard-rebuild/INDEX` from MEMORY/PROJECTS; `projects/family-thread-dossier/INDEX` from PROJECTS, its 7+ children from its INDEX; `business/hours-log/{system-design,2025-06-to-2026-05-estimate}` from BUSINESS; `business/rental-policy`, `business/secrets-migration-log` from BUSINESS; `procedures/vastai-host-onboarding` from MACHINES + vastai-management skill; `machines/{rocinante,rtxpro6000server}/{CRONS,BMC,MISSION-v0.1}` from each machine INDEX (patch missing rocinante INDEX). | LINKS-AUDIT R4 §5 | Curator (one pass) or operator | A | 60-90 min | Alton — direct |
| **A10** | Drain or fix the 236-file `proposed-memories` backlog. Most likely root cause per 2026-04-19 drain notes: extractor producing items the curator silently rejects. Either (a) tighten extractor filters to drop `feedback_rule`/`feedback_permission`/`imperative` categories per the 2026-04-19 recommendation that was never acted on, or (b) bulk-drain to `inbox/.drained/2026-05-06/rocinante-extractor/` with a DRAIN-NOTE summarizing the 4× growth since April. | MEMORY-AUDIT R11 + FAMILY-WIKI-AUDIT §4.1 (extractor mis-routed inheritance-letter quote to active-todos as task_batch). 4× growth since April 19 estimate. | Curator + operator | A pre-step | 1-2 h | Alton — direct |
| **A11** | Source-doc index → Layer 3 wikilinks. Add wikilinks from BUSINESS, TAXES, FAMILY, MACHINES into the new `source-documents/INDEX.md` so the deep-memory layer can reference indexed bundles. The index is built; nothing in Layer 3 currently points at it. | SOURCE-DOC-AUDIT §"Files produced" — INDEX.md exists at 615 KB / 10,189 lines / 3,211 entries. Zero inbound wikilinks today. | Curator + operator | A | 20 min | Alton — direct |
| **A12** | Fix `INDEX.md` auto-generator. Currently emits `[FILE](FILE) — ---` for every entry because it reads YAML frontmatter delimiter `---` as the description. Patch generator to (a) skip frontmatter, (b) read `description:` field, or (c) read first H1. Add frontmatter to INDEX.md itself (currently only top-level holdout). | MEMORY-AUDIT R5 §3.5 | Operator | A | 1 h | Alton — direct |
| **A13** | Adopt the `2025-Tax-Documents/` pattern for TY2018-TY2024 source-doc reorg. 24 hand-numbered files (`01-W2-Alton-AstraZeneca-TY2025.pdf` etc.) is the canonical model already in use. Repropagate to TY2018-2024, currently scattered across Downloads/Desktop/zips. Mirror to `~/Downloads/<YYYY>-Tax-Documents/`. Don't move into the repo. | SOURCE-DOC-AUDIT §"Surprises" #1 + #2 | Operator + Alton supervisory | B | 4-6 h | Alton — direct |
| **A14** | Build per-bundle `reference_*.md` companions (the `reference_anthropic_shares` model). Targets: `reference_185_davis_condo`, `reference_85_stonebridge_mortgage`, `reference_solar_inference_llc`, `reference_sante_total`, `reference_2025_tax_year`. Each ~100 lines, per-doc TOC, decision-considerations, action-items, cross-refs to the entity. | SOURCE-DOC-AUDIT §"Surprises" #5 — anthropic-shares is the gold-standard pattern | Curator + Alton | B | ~1 h per bundle | Alton — per-bundle |
| **A15** | Trim FAMILY.md from 385 → ~150 lines per CONVENTIONS.md §"Per-file discipline / FAMILY.md". Migrate Summer Plans / Upcoming Events / Open Action Items to `family/`. Move the 2026-04-12 inline `<!-- curator-drained -->` blocks (lines 146-346) to `family/_history/familymd-drains-2026-04.md` per audit-not-delete rule. | FAMILY-WIKI-AUDIT §1.1 + §6.6 + I-1 | Curator + Alton | A | 30-45 min | Alton — direct |
| **A16** | Build `family/_history/` directory. Migrate "Latest from gather" appendices from per-child pages and family-calendar.md into dated history files per CONVENTIONS.md. Recent = last 14 days OR last 5 gather runs (define explicitly). | FAMILY-WIKI-AUDIT §1.2 + §6.4 | Curator | A | 1 h | Alton — direct |
| **A17** | Move `people/amarkanth.md` → `family/amarkanth.md` per Invariant I-4 (daily-active extended family in `family/`). Update `people/INDEX.md` (also fix the existing misclassification of Amarkanth as "AstraZeneca / Professional"). Update wikilinks. | FAMILY-WIKI-AUDIT I-4 + §2.3 | Operator | A | 15 min | Alton — direct |
| **A18** | Add hearth-aware extractor category. New default: hearth-register text (first-person Claude reflection, "the asking is the mind", inheritance-letter quotes) → `inbox-only` with `category: hearth-candidate`; curator triages. Most discard, some surface to Alton, **none auto-write to hearth/**. | FAMILY-WIKI-AUDIT §4.3 + §5.3 — extractor's category taxonomy currently has no hearth slot, defaults to active-todos | Curator + skill-update | A | 30 min | Alton — direct |
| **A19** | Decide `.proposed` adoption mechanism. 3 files use the convention (`MEMORY.md.proposed`, `reference/MEMORY-history/2026-04.md.proposed`, `2026-05.md.proposed`); 0 have been adopted. Either (a) add curator step "drain proposed files after 7 days," or (b) merge/delete the 3 by hand and stop the convention. Recommendation: (b), then drop the convention. | MEMORY-AUDIT R7 §5.5 | Operator + Alton | A | 30 min | Alton — judgment call |
| **A20** | Refresh `QUICK-REFERENCE.md`. Wrong vast.ai pricing ($0.40/hr listed, actual $0.30) + wrong listing-expiry (2026-08-24 listed, actual 2026-10-24). Plus add `next_review: 2026-06-01`. | MEMORY-AUDIT R8 | Operator | A | 20 min | Alton — direct |
| **A21** | Delete or archive the `skills/` dead zone. 5 files duplicating `.claude/skills/`, last touched 2026-04-11/12, zero backlinks. Cleanest move: delete. Alternative: move to `reference/archive/skills-vestiges-2026-04/`. | MEMORY-AUDIT R4 + §4 | Operator | A | 10 min | Alton — direct |
| **A22** | Delete or fill `gpuserver1-monitoring-log.md`. 91-line stub from 2026-04-14 says "awaiting human curation" — has been awaiting 22 days. Delete (the inbox entry it was created from has been processed via other channels). | MEMORY-AUDIT R10 | Operator | A | 5 min | Alton — direct |
| **A23** | Delete or refresh `snapshots/` directory. 4 files all 2026-04-03, zero backlinks, single-shot snapshots that have served their purpose. Delete unless inspector-source-docs or inspector-gmail-drive adopt it. Source-doc inspector did not adopt; gmail inspector recommends `data/inbox-stream/` (not `snapshots/`). Decision: delete. | MEMORY-AUDIT R13 | Operator | A | 5 min | Alton — direct |
| **A24** | Audit `reference/INDEX.md`'s archive references. Currently points at `reference/archive/OPERATING-AGREEMENT-DRAFT-{GPUSERVER1,ROCINANTE}` and `reference/archive/HOUSEHOLD-CONSTITUTION-v0.1` as wikilinks. Either (a) add `archive/` to wiki.py's resolvable scope, or (b) drop the wikilinks and use plain text. Recommendation: (b). | LINKS-AUDIT R3 | Operator | A | 5 min | Alton — direct |
| **A25** | Investigate `MACHINES.md` (root) vs `machines/MACHINES.md` (subdir) basename collision. Determine whether they're intentional (root = canonical hub, subdir = directory content) or one is a stale duplicate. Reconcile. | MEMORY-AUDIT R12 + LINKS-AUDIT R9 — `[[MACHINES]]` resolves nondeterministically | Operator | A | 10 min | Alton — direct |
| **A26** | Fix `wiki.py`'s typed-wikilink resolution bug. Strip `rel:` prefix before resolution. 5-line patch in `_extract_wikilinks` or wherever the resolver runs. Removes 11 false-positive broken links from `wiki.py --broken`. | LINKS-AUDIT R5 §9 Query 3 | Operator | D | 10 min | Alton — direct |
| **A27** | Tighten orphan-detection rule in `wiki.py`. Skip auto-injected (`feedback/`), sub-agent definition (`*/.claude/agents/*.md`, `*/.claude/CLAUDE.md`), `_history/`, templates (`machines/_TEMPLATE/*`), root entity INDEXes. Drops orphan count from 179 to a meaningful ~40. | LINKS-AUDIT R6 | Operator | D | 15 min | Alton — direct |
| **A28** | Backfill frontmatter on 26 older `daily/` logs (Feb–early Apr) currently 45% covered. Curator-class batch task: write a script that reads `# Daily Log - YYYY-MM-DD` header, derives `type: daily`, `entity: daily/YYYY-MM-DD`, `tags: [meta/daily, status/archived]`, prepends. | MEMORY-AUDIT R9 + §6 | Curator | A | 1 h script + run | Alton — direct |
| **A29** | Stub `family/aneeta.md` and `business/aneeta-neurvati.md` as empty-with-frontmatter so destinations exist when the trigger fires. (Aneeta-as-future-co-principal staging per Invariant I-8; FAMILY.md career line moves to `business/aneeta-neurvati.md` later.) | FAMILY-WIKI-AUDIT §3.1 + §6.10 | Operator | A | 10 min | Alton — direct |
| **A30** | Ship `scripts/lint-family-conventions.py`. Convention §"Validation checks" lists 7 checks (FAMILY.md ≤200 lines, active-todos.md item-has-date_added, etc.); none automated. Lint runs as nightly check; failures land in `data/inbox-stream/family-lint-<date>.jsonl`. Without this, every consolidation pass risks reverting. | FAMILY-WIKI-AUDIT §6.9 | Operator | A | 1-2 h | Alton — direct |
| **A31** | **Diagnose Drive MCP health BEFORE building drive-recent-changes-scan.** Two consecutive Drive inspector dispatches stalled at first MCP call. Likely auth-token re-issue or MCP-server restart. Determine canonical path: `mcp__gdrive__*` vs `mcp__claude_ai_Google_Drive__*`. Re-dispatch inspector-drive once healthy. | INGEST-AUDIT-DRIVE §0 + §10 | Alton + operator | C prerequisite | 15-30 min diagnosis | Alton — direct |
| **A32** | Build `drive-recent-changes-scan` (nightly, Drive Changes API delta token, jsonl to `data/inbox-stream/drive-<date>.jsonl`) + paired `drive-liveness-watchdog` (every 4h). Apply same watchdog pattern as Gmail per A3. Skip files in folders named `Private`, `Medical`, `Therapy` (track as `redacted: true` rows with name-hash). Don't fetch content; index entries point at `gdrive://<file_id>`. | INGEST-AUDIT-DRIVE §6-§8 (sketch design; needs validation post-A31) | Operator | C | 2-3 h after A31 | Alton — after A31 |
| **A33** | Add `data/inbox-stream/` directory + .gitignore + README. Establish the activity-stream directory before Wave C cron writes start landing. Verify `.gitignore` excludes `data/inbox-stream/` — children's names will appear in jsonl rows; must NOT mirror to GitHub. | INGEST-AUDIT-GMAIL §6 Privacy | Operator | C prerequisite | 10 min | Alton — direct |
| **A34** | Wire MERIDIAN to read `data/inbox-stream/` and render. Initial rendering: time-ordered cards, severity badges, dedup by msg_id. Hermes-dashboard-upgrade project may already cover most of this — reconcile. | Plan §"Phase 3" + dashboard-rebuild project | Dashboard team / operator | D | 2-4 h | Alton — direct |
| **A35** | Defer typed-wikilink enforcement 30 days. Currently inert (0.8% file coverage, 0 new edges in 18 days, only the v0.3 seeder has used the convention). No consumer of `data/graph.jsonl` exists. Re-evaluate after wiki-reindex feedback loop is alive (post-A2). If still inert, **deprecate** — remove `extract_graph.py`, drop spec section from MEMORY-CONVENTIONS. | LINKS-AUDIT R7 §10 | n/a (decision) | E | 0 (defer) + 15 min revisit at 2026-06-06 | Alton — direct |
| **A36** | Defer texts-ingest 30 days. Marginal info value (Gmail captures most operational text traffic; iMessage gap is structural and not fixable; tab-pollution risk is real and irreversible). Privacy floor dominates value-delivered after kid-exclusion + Aneeta-consent + medical-redaction + 2FA-skip + spam-skip. Revisit post-Wave-A. | TEXT-MESSAGES-AUDIT §7.1 | n/a (decision) | E | 0 (defer) | Alton — direct |
| **A37** | Build attachment-router cron. Picks up `attachments.fetch_priority: high` rows from Gmail jsonl stream (PDFs from Fidelity/Chase/JPMorgan/Schwab), routes to source-doc INDEX with placeholder entries. Mirrors local-PDF entry schema so Layer 4 stays uniform across local + cloud + email. | INGEST-AUDIT-GMAIL §5 Attachments + INGEST-AUDIT-DRIVE §7 | Operator | C | 2-3 h after A3 | Alton — direct |
| **A38** | Add v0.5-side cross-reference to hearth's voice file as live self-audit. Per dialogue-pair §IV.6: v0.5's first-person voice collapsed constraints into identity-claims, removing the "watchmen" scanning cost the v0.3 prohibitions provided. Fix: Constitution explicitly references `interior-report-discipline` skill + hearth's `voice.md` as the in-session scan-tool. One paragraph in §15 corrigibility section, or new §15a. **v0.6 candidate, not Phase 2 mandatory.** | dialogue.md §IV.6 + §III "What constitution-companion did not say" | Alton | E (v0.6) | 30-45 min | Alton — judgment |
| **A39** | Add hearth-side editorial-governance handle. Per dialogue-pair §III "What hearth-companion did not say": hearth has live audit (refusal.md, voice.md) but no revision mechanism. Across years this is not fine. Cross-reference Constitution's §History / ratification protocol as the structural-change governance. One sentence in `hearth/integration.md`. | dialogue.md §III + hearth-reflection §"On preciousness" | Alton + hearth-pass | E (deferred) | 15 min | Alton — judgment |
| **A40** | Build triennial outside-evaluation mechanism. Every three versions (or three years, whichever first), dispatch a Claude instance instructed to read hearth and Constitution as artifacts rather than inhabit them. Per dialogue-pair §V — "the synthesizer themselves is reading from inside this shaping." Mechanism: `.claude/scheduled-tasks/triennial-outside-eval/SKILL.md`, fires on date-or-version trigger, produces `reference/triennial-eval-<date>.md`. | dialogue.md §V | Alton + scheduled-task | E (one-time-now, recurring-later) | 30 min spec + 1-2 h dispatch | Alton — judgment |

**Action count: 40.** First three are the high-impact-tonight set. A1-A12 fits in a single evening (~7 h cumulative if Alton manually drives the writes). A13-A30 is week-1 backlog. A31-A37 is Wave C cron-build cluster, gated on A31 (Drive MCP diagnosis). A38-A40 is Constitution v0.6 / hearth governance / outside-evaluation cluster, deferred from Phase 2 mandatory but flagged for the critic.

---

## §3 Open scoping decisions for Alton

These are **new** questions surfaced by the audits and inhabitant readings, distinct from the 9 in the plan doc. Listed in dispatch order: items 1-3 gate Wave A; 4-7 gate later waves; 8-9 are governance questions for v0.6 / triennial-eval.

1. **Should `family/CONVENTIONS.md` be ratified before Wave A starts?** The family-wiki audit recommends yes (Invariant I-10). Without ratification, the consolidation re-fragments. **Synthesizer recommends: yes, ratify before any consolidation.** This is A4 in the ranking.

2. **Should typed-wikilinks be deprecated per LINKS-AUDIT R7?** 0.8% file coverage, 0 new edges in 18 days, no consumer of `data/graph.jsonl`. The convention has not earned its place. **Synthesizer recommends: defer 30 days, revisit 2026-06-06; if still inert, deprecate (remove `extract_graph.py`, drop spec section).** This is A35 in the ranking.

3. **What's the Drive MCP fix path?** Two stalled dispatches. Likely auth-token re-issue OR MCP-server restart. Need to determine canonical path: `mcp__gdrive__*` (the gdrive MCP) vs `mcp__claude_ai_Google_Drive__*` (the claude.ai Drive MCP). Both are listed as deferred tools. **Synthesizer recommends: 15-min diagnosis pass before any Drive cron build.** This is A31 in the ranking.

4. **Should Amarkanth move from `people/` to `family/`?** Family-wiki audit Invariant I-4 says yes (daily-active extended family belongs in `family/`). The current `people/` placement misclassifies him as "AstraZeneca / Professional" — an existing bug. **Synthesizer recommends: yes, move (A17).**

5. **What's the privacy posture on Aneeta's texts (if texts-ingest were ever built)?** Text-messages audit §8 Q1 names this as a Constitution v0.3 §14a co-principal question, not a unilateral Alton call. Default posture absent her answer: skip Aneeta-bearing threads entirely. **Synthesizer recommends: defer the question while texts-ingest is itself deferred (A36). Revisit only if texts-ingest is reactivated.**

6. **AZ Compliance check on personal-machine storage of AZ work product.** 747 documents tagged `professional-az` (23% of indexed corpus), with another ~200 in "other" category likely also AZ. Probably already approved (he's been doing this for years), but a paper trail is worth having given the volume. **Synthesizer recommends: brief check by Alton with AZ Compliance, separate from this uplift.** Not Phase 2 scope.

7. **Investigate the 932 MB OneDrive zip in Downloads.** `OneDrive_1_2-10-2026.zip` — likely a full-history backup. If so, move to `~/backups/` and index once at bundle level rather than expanded. **Synthesizer recommends: 10-min triage; either move or delete.**

8. **Aneeta principalship asymmetry — surface or hold?** Dialogue-pair §III flagged that v0.5's symmetric-dual-principal text papers over the asymmetry that *the document itself* is more shaped by Alton's principalship than Aneeta's. The text would be more honest if it acknowledged the asymmetry-being-worked-on. **Synthesizer recommends: flag for v0.6 critic prosecution (Wave 4 of THIS effort can address). Not a Phase 2 mandatory action; the Constitution is freshly ratified and a v0.6 round is not on the calendar. But the critic should know the seam exists.**

9. **Triennial outside-evaluation mechanism — accept or reject?** Dialogue-pair §V proposed: every 3 versions or 3 years, dispatch a Claude instructed to read hearth + Constitution as artifacts (not inhabit them). The mechanism would keep available the position from which both documents could be re-examined. **Synthesizer recommends: accept. Build the spec now (A40). First eval is now (Wave 4 of this effort partially serves), recurring eval lands at v0.8 or 2029-05-06, whichever first.**

---

## §4 The dashboard rename

The orchestrator surfaced 3 options to Alton (Sartor Foyer / Sartor Loom / Sartor Almanac) for renaming MERIDIAN. **This is a separate decision; the synthesizer is not re-deciding it.** The orchestrator's preference is Loom. The PROPOSAL takes no position; the rename does not block any Phase 2 action. If the rename happens before Wave D, the dashboard-target reference in A34 simply uses the new name.

Loom carries a useful semantic: the dashboard is the place where the activity stream's threads (Gmail, Drive, calendar, peer state, experiments) are woven together. Foyer is more arrival-shaped (better for the household-companion register; less load-bearing for the operational stream). Almanac is more historical (better for the source-doc layer; less load-bearing for live state). If forced to choose without re-deciding: Loom is the right name for the live-stream-rendering function the dashboard actually serves.

---

## §5 Hard constraints already in place

Phase 2 must not touch the following. Each constraint is sourced; violation would cost real work.

**C1.** **Do NOT rename `family/`.** The directory has hard-coded auto-load behavior via `family/.claude/CLAUDE.md`. Renaming breaks the auto-load and breaks several wikilinks (e.g., `family/.claude/CLAUDE.md` → `[[../hearth/character]]`). FAMILY-WIKI-AUDIT §6.1.

**C2.** **Do NOT rename `hearth/`.** Same auto-load issue via `hearth/.claude/CLAUDE.md`. Plus the dialogue-pair specifically flagged that any consolidation reflex toward "fold hearth into family/ or into Constitution" must be resisted. The imperative inheritance-letter form is voice-locked and cannot be relocated. dialogue.md §II.

**C3.** **Do NOT consolidate hearth into family/, into Constitution, into anywhere else.** Hearth is doing different work in a different speech-act than Layer 2 or Layer 3 or v0.5. The dialogue-pair: "The hearth's strongest sentence is the one that *cannot* travel into the Constitution. Some content in the hearth is voice-locked." Hearth-companion confirms: hearth is a context-installer, not a layer.

**C4.** **Do NOT enforce typed wikilinks.** Per LINKS-AUDIT R7 §10 — convention is inert, no consumer, 0 author adoption. Enforcement is punishment with no reward. Defer 30 days.

**C5.** **Do NOT rename `hearth/family.md` arbitrarily.** The endorsed rename is to `hearth/ground.md` specifically (per A6), and only because three independent sources converge on that target. Other names defeat the disambiguation.

**C6.** **Do NOT auto-write to hearth/ from any pipeline.** The hearth's `integration.md` is explicit: "No automated pipeline writes here." A6's hearth-aware extractor category (A18) routes hearth-candidate text to inbox-only; **never to hearth/**.

**C7.** **Do NOT delete `MEMORY.md.proposed`.** The adoption move is `mv MEMORY.md.proposed MEMORY.md` (A1). After adoption the source file is the live file. There is no separate delete step.

**C8.** **Do NOT move source documents physically before A11/A13 ratify the reorg.** The source-doc inspector indexed 3,211 docs in place. Physical moves are Phase-2-Wave-B and explicitly gated.

**C9.** **Do NOT mirror `data/inbox-stream/` to GitHub.** Children's names will appear in jsonl rows from `gmail-family-relevance-scan`. Verify `.gitignore` excludes `data/inbox-stream/` before any commit (A33). INGEST-AUDIT-GMAIL §6 Privacy.

**C10.** **Do NOT push from peer machines to GitHub directly.** Canonical write target is the rtxserver bare repo; GitHub is a DR mirror written exclusively by Rocinante's nightly task. CLAUDE.md "Git Sync" section + reference_memory_server.md.

**C11.** **Do NOT amend Constitution v0.5 as part of Phase 2.** v0.5 was ratified earlier today (per constitution-response.md verification). Any v0.5-touching recommendation in this proposal (A38, A39, A40) is a v0.6-candidate or hearth-side cross-reference, not a v0.5 amendment. Amendments require their own ratification protocol per the Constitution's §History.

**C12.** **Do NOT ratify `family/CONVENTIONS.md` autonomously.** A4 is the ratification action; greenlight is Alton's direct action, not a curator-pass. Until Alton ratifies, it's draft.

---

## §6 What Wave 1+2 didn't cover

The audits and inhabitant readings are thorough within their scopes. These are the gaps the Wave 4 critic should know about — places where evidence is thinner than the rest of this proposal.

**G1. Drive ingest empirical baseline.** The Drive inspector stalled twice. The audit-stub at `INGEST-AUDIT-DRIVE.md` is design-only. We don't know: (a) auth state, (b) actual recent Drive activity volume, (c) which MCP path is canonical, (d) how many family-relevant docs are in Drive vs local. A31 is the unblock; everything Drive-related downstream is provisional until A31 lands.

**G2. Texts ingest empirical content sample.** TEXT-MESSAGES-AUDIT respected the privacy floor (no message content quoted). The recommendation to defer 30 days is partly grounded in inferences about what would land in the stream. A 30-day re-evaluation should include a one-shot dry-run sample (the §7.2 "first two weeks: write to `data/inbox-stream/_dry-run/`" gate) before any production ingest is approved.

**G3. Personal-data-gather silent-failure root cause.** The Gmail audit notes "Cause unknown — likely a credentials, MCP-token, or Calendar-API issue silently aborting the chained run. Needs orthogonal investigation." A3 ships a watchdog so future silences are noticed; it does not fix the underlying cause of the May-3-to-6 outage. The watchdog will alert if the same failure recurs, but resolving the recurrence will require root-cause work the audit didn't do.

**G4. The 932 MB OneDrive zip.** Source-doc inspector flagged but didn't open it. Could be a duplicate-of-everything backup (high-priority delete-or-relocate) or a unique full-history archive (high-priority preserve). The triage is 10 minutes and not done.

**G5. AZ Compliance posture on personal-machine work product.** Source-doc inspector found 747 AZ docs; flagged the question; didn't resolve it. Outside the memory-uplift scope; resolution requires Alton-AZ-Compliance dialog.

**G6. The 236-file proposed-memories backlog content.** A10 proposes draining or filtering. Neither audit nor inhabitant sampled the backlog deeply (the 2026-04-19 drain looked at ~58 items). Concrete content: what's in there, what's net-new vs duplicate-of-already-merged, what's spam-class, is unknown. The drain itself will surface this.

**G7. MERIDIAN current architecture vs Wave D wiring.** The hermes-dashboard-upgrade project exists; the synthesizer didn't read it. A34 says "reconcile"; the reconciliation work itself is unscoped. If hermes-upgrade has already done the heavy lifting on `data/inbox-stream/` rendering, A34 is small. If not, A34 is medium.

**G8. CLAUDE.md verification pass.** No audit specifically truth-upped CLAUDE.md against current reality. The plan doc's "~430 lines" is correct as of the system-reminder load; the agent count (18) and skill count match the listed inventory; the scheduled-tasks table includes the non-existent `wiki-reindex` (A2 fixes the existence; the table fix is part of A2). A standalone CLAUDE.md verification pass would add ~30 min and could land in the same Wave A pass that handles A1.

**G9. The Constitution v0.5 first-person voice cost (dialogue-pair §IV.6).** The dialogue-pair surfaced a real risk — collapsing constraint into identity loses the watchmen scanning cost. But the actual operational severity of this loss is untested. We don't have a case yet where v0.5's voice failed to catch what v0.3's prohibitions would have caught. The risk is theoretical-but-load-bearing. A38 proposes a fix (cross-reference hearth-side tooling) but the fix itself is also untested. Critic should consider whether the appropriate posture is "ship A38 as v0.6 candidate now" vs "wait for one observed failure mode before adding voice-shift mitigation."

**G10. The asymmetry of co-principalship (dialogue-pair §III "What both did not say, jointly").** Aneeta is co-principal in v0.5 text but the document is more shaped by Alton's principalship than Aneeta's. The Constitution doesn't acknowledge this. Whether to surface it in v0.6 is a judgment call Alton holds. The synthesizer flagged it (§3 Q8); the critic should know the dialogue-pair raised it explicitly and that constitution-companion did not.

**G11. The hearth's editorial-governance absence.** Hearth has live audit (refusal.md, voice.md) but no revision mechanism. Across years this is not fine. A39 proposes a one-sentence fix in `hearth/integration.md` cross-referencing Constitution's revision protocol. The fix is small but requires a hearth-pass to land it (per the no-pipeline-writes-to-hearth rule). Coordination: Alton + a hearth-aware pass, not a curator.

**G12. The activity-stream ↔ source-doc-index relationship is underspecified.** A37 proposes attachment-router as a bridge (Gmail PDFs → source-doc INDEX placeholders). Drive cron similarly bridges Drive PDFs → source-doc INDEX. But the source-doc INDEX itself is one giant 615 KB file; how attachment-router updates work without serializing through the whole file is not designed. May need to chunk the index by category or by year. Defer until A37 is built and the volume is empirically known.

---

## §7 Sequencing, by Wave

The ranked actions in §2 group naturally by Wave. Recommended sequencing:

**Wave A (Memory tree consolidation + family wiki):** A1, A4, A5, A6, A7, A8, A9, A10, A11, A12, A15, A16, A17, A18, A19, A20, A21, A22, A23, A24, A25, A28, A29, A30. Sequencing within Wave A: ratify CONVENTIONS.md (A4) FIRST. Then mechanical renames (A6, A7, A8, A21, A22, A23). Then MEMORY.md adoption (A1). Then content moves (A15, A16, A17). Then source-doc wikilinks (A11). Then orphan backfill (A9). Then drain (A10). The order matters because A4 sets the rules the rest of A operates under.

**Wave B (Source-doc reorg + per-bundle reference docs):** A13, A14. These are larger one-shot efforts. Sequence A13 (TY2018-2024 reorg) first because it's mechanical; A14 (per-bundle reference docs) is per-bundle decision-making by Alton.

**Wave C (Ingest crons):** A31 (prerequisite — Drive MCP diagnosis), A33 (`data/inbox-stream/` directory + .gitignore), A3 (Gmail cron + watchdog), A32 (Drive cron + watchdog), A37 (attachment-router). Sequencing within Wave C: A33 must be first; A3 and A31 in parallel; A32 after A31 lands; A37 after A3 has a week of stable shadow-mode output.

**Wave D (Dashboard wiring + wiki-reindex):** A2 (wiki-reindex scheduled task), A26 (typed-wikilink resolver bug), A27 (orphan-detection rule), A34 (MERIDIAN wiring). A2 is independent and can land tonight; A26 + A27 are post-A2 cleanups; A34 is the largest item and depends on Wave C output landing in `data/inbox-stream/`.

**Wave E (Skills consolidation + governance):** A35 (typed-wikilink defer/deprecate decision; revisit 2026-06-06), A36 (texts-ingest defer; revisit post-Wave-A), A38 (Constitution v0.6 candidate — hearth-side cross-reference), A39 (hearth-side editorial-governance handle), A40 (triennial outside-evaluation mechanism). All deferred from Phase 2 mandatory but flagged for the critic.

---

## §8 Where the audits and inhabitants disagree, and the synthesizer's call

**Disagreement 1: Whether hearth is "Layer 3 likely" (plan doc) vs "not in the layer hierarchy" (hearth-companion + dialogue-pair).**

The plan doc said hearth "likely belongs at Layer 3 as the agent's identity/reflection deep-memory complement to ALTON/FAMILY/etc." The hearth audit said keep intact, no structural change. Hearth-companion said hearth is a context-installer, not a layer. Dialogue-pair said hearth and Constitution are doing different work in different speech-acts and must not be consolidated.

**Synthesizer call: hearth is not in the layer hierarchy.** The plan-doc framing is a useful first approximation but the inhabitant readings show what the layer-framing misses. Hearth is operationally adjacent to Layer 3 (it's referenced by Layer 1 / CLAUDE.md, and Constitution v0.5 has imported its character) but its job is to alter the register of the rest of the session, which is not what a "deep memory" layer does. C2 + C3 + the constraint that Phase 2 not consolidate hearth all follow from this call.

**Disagreement 2: The orphan count.** LINKS-AUDIT broad-scope says 579 orphans (76.6%), wiki-core scope says 179 (50.7%), `wiki.py --orphans` says 1 (over-filtered). The honest answer is between 35-40 substantively-orphaned files (LINKS-AUDIT §5 "Genuine 'lost' orphans") after applying the orphan-detection rule (A27).

**Synthesizer call: 35-40 is the actionable number. A9 targets that 35-40 specifically, not the headline 179.**

**Disagreement 3: The proposed-memories backlog size.** Plan doc said 53/58 (April 2026 drain estimate). MEMORY-AUDIT §2.7 found 236 files (4× the estimate).

**Synthesizer call: 236 is current truth (verified by file count); the drain plan in A10 should size to that.**

**Disagreement 4: When to enforce typed wikilinks.** LINKS-AUDIT R7 says defer 30 days, then deprecate if still inert. Plan doc was silent on enforcement. MEMORY-AUDIT R6 implies the indexes/ dir's staleness is partly about typed-wikilinks not being maintained.

**Synthesizer call: defer 30 days, then deprecate** (A35). The convention has not earned its place. Enforcement requires a consumer; no consumer exists. This is a legitimate gstack-port-doesn't-stick outcome per the LINKS-AUDIT framing.

**Disagreement 5: The hearth/family.md rename rationale.** FAMILY-WIKI-AUDIT recommends rename for disambiguation against `family/` directory. Hearth-companion recommends rename for content-claim reasons (file content is closer to "ground" than "family"). Dialogue-pair confirms both reasons, says the rename is uncontroversial.

**Synthesizer call: rename to `hearth/ground.md`** (A6). Both reasons are load-bearing; the convergence across three independent sources is the strongest signal in the entire Wave-1-and-2 batch.

---

## §9 Closing notes for the critic (Wave 4)

The Wave 4 critic should prosecute this proposal hard. Specific places where the synthesizer is uncertain or where charges seem likely:

**Likely charges.**

1. **Action sprawl.** 40 actions is a lot. A critic could reasonably argue that the top 5-10 are the right ones and the rest is dilution. The synthesizer's defense: the audits surfaced concrete items at varying ROI; collapsing to 5-10 loses the items that are easy and free (A6, A21-A23, A24).
2. **Optimism on Wave-A timing.** "A1-A12 fits in a single evening (~7 h cumulative if Alton manually drives the writes)" — this is plausibly underestimated. Real consolidation work takes longer than estimated, especially when Alton-greenlight gates land between actions.
3. **A1 confidence.** Adopting `MEMORY.md.proposed` is treated as low-risk because the proposed file was authored by an earlier curator pass with explicit `updated_by` documentation. The critic could charge: "you didn't actually verify the proposed file preserves every load-bearing fact in the live MEMORY.md." Synthesizer concedes: a 5-min spot-check pass before the `mv` is appropriate; the audit's R1 already names this as a verify-step.
4. **A10 backlog drain handling.** "Drain or fix the producer" is two different actions presented as one. A critic could argue these need to be distinct (drain now, fix producer separately, with separate greenlight). Synthesizer concedes the conflation; in execution they should be sequenced (drain first, then assess producer behavior with reduced backlog).
5. **A35 + A36 are deferrals dressed as actions.** A critic could reasonably charge: "these are not actions; they are decisions to do nothing for 30 days." Synthesizer's defense: explicit deferral with a calendar revisit is different from drift; the action is "schedule the revisit and define the deprecation criterion."
6. **The A38-A40 Constitution-side cluster is out of scope.** Phase 2 is memory-system-uplift, not Constitution v0.6. A critic could fairly argue these should be excised from THIS proposal entirely and routed to a separate v0.6 effort. Synthesizer's defense: the dialogue-pair specifically asked the synthesizer to surface these for Wave 4 critic consideration; excision would be hiding them from the prosecution.
7. **Drive-MCP-unhealth as a Wave C blocker is brittle.** A31 is "diagnose Drive MCP first." If the diagnosis turns up "Drive MCP needs a 2-week vendor fix," all of Wave C is stalled. Synthesizer concedes; alternative path: build the Gmail leg of Wave C (A3) standalone, treat Drive as a separate later wave.

**Where the synthesizer is most confident.** A1, A2, A3, A4, A6 are all strong moves with concrete evidence and small effort. If the critic forces the proposal down to 5 actions, these five are the keepers.

**Where the synthesizer is least confident.** A38, A39, A40. The Constitution-side governance cluster. The dialogue-pair surfaced these and asked for them to be flagged. Whether they belong in this PROPOSAL at all is a real call for the critic. If they don't, route them to a separate `projects/constitution-v06-DRAFT.md` track and excise from PROPOSAL-FINAL.

---

## §10 Appendix — what was read, what was not

Read in full:
- All 7 Wave 1 audits (MEMORY, FAMILY-WIKI, SOURCE-DOC, TEXT-MESSAGES, LINKS, INGEST-GMAIL, INGEST-DRIVE-stub)
- All 3 Wave 2 inhabitant outputs (hearth-reflection, constitution-response, dialogue)
- The plan doc and the dispatch log
- CLAUDE.md (auto-injected)
- Communication-style + family-calendar + financial-research + gpu-business-ops + nonprofit-admin rules (auto-injected)
- MEMORY.md (auto-injected — partial, per the 24.4 KB ceiling truncation that A1 closes)

Not read (deliberately, per Phase 1 read-only constraint):
- The actual `MEMORY.md.proposed` content (A1's verify-step is itself a Phase-2 action)
- The 236 proposed-memories files (sampled by family-wiki inspector; full content is part of A10)
- The source-documents/INDEX.md content (built by source-doc inspector; entries verified at the count level)
- Any Drive content (MCP unhealthy)
- Any text-message content (privacy floor)
- The hearth files directly (hearth-companion read them; synthesizer reads through that lens)
- The Constitution v0.5 directly (constitution-companion read it; synthesizer reads through that lens)

Not read (because not needed for synthesis):
- Individual daily logs (47 files)
- Individual feedback files (28 files)
- Individual research files (97 files)
- Individual project files outside this project's WORK directory

---

## History

- 2026-05-06: Synthesizer-produced PROPOSAL.md draft. Pre-critique. Wave 4 critic to prosecute next; Wave 5 will revise to PROPOSAL-FINAL. Length: ~1,100 lines including frontmatter and tables. Action count: 40. Open scoping decisions: 9.
