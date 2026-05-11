---
name: memory-system-uplift-PROPOSAL-FINAL
description: Decision-ready proposal after Wave 4 critique. Addresses all 41 charges with substantive revision, reasoned decline, or explicit deferral. The PROPOSAL.md §9 anti-pattern (concession-without-revision) has been removed; concessions are absorbed structurally into §1-§8 and itemized in §11.
type: proposal-final
date: 2026-05-06
status: ready-for-alton-greenlight
reviser: rocinante-orchestrator (opus-4.7, fresh context, Wave 5)
plan: ../memory-system-uplift-2026-05-06-PLAN.md
predecessor: PROPOSAL.md
critique: PROPOSAL-CRITIQUE.md
observer_notes: OBSERVER-NOTES.md
hard_stops_addressed: [Charge 1, Charge 5, Charge 6]
---

# Memory System Uplift — Proposal (Final)

## §0 Executive summary

The Sartor memory system has a **30 KB MEMORY.md being silently truncated past 24.4 KB ceiling**, a **236-file proposed-memories backlog growing at ~90/month against ~0/month curator throughput**, a **Gmail ingest pipeline silent for 4 days that the daily-household-health closer failed to catch**, a **Drive MCP that stalled two consecutive inspector dispatches**, and a **family-wiki convention drafted 11 days ago that has not been ratified**. These are all real. They are also more interrelated than the PROPOSAL.md draft acknowledged: the silent Gmail pipeline and the unhealthy Drive MCP likely share OAuth root cause; the unratified convention and the unmerged `MEMORY.md.proposed` and the leapfrogged Constitution v0.4 are the same chronic dead-letter pattern; the proposed-memories backlog and the about-to-be-built activity-stream crons are the same throughput-versus-production problem.

This proposal is **decision-ready** with three hard-stop revisions from the Wave 4 critique baked in:

1. **The 5-layer architecture is downgraded from target to taxonomy** (Charge 1). Wave-A actions are justified by audit-measured friction, not by layer-conformance.
2. **Ratification is treated as a broken mechanism, not a working primitive** (Charge 5). New action **A4a** is a calendared 60-min Alton block that handles all four pending ratifications/adoptions in one sitting; without A4a, no other Wave-A action ships.
3. **Drive MCP and Gmail silence are diagnosed jointly, not separately** (Charge 6). New action **A31\*** is a 30-min OAuth-state diagnostic covering Gmail + Calendar + Drive simultaneously, gating all Google-MCP-mediated cron builds. Watchdogs are cross-routed to gpuserver1 so a Rocinante-wide failure cannot silence both watched-cron and watchdog.

**Five P0 prerequisites** (must land before the rest of Phase 2 dispatches):
- **A41** (10 min): verify `log.md` does not auto-inject (gates A1's value-claim)
- **A4a** (60 min Alton block): ratify CONVENTIONS, adopt MEMORY.md.proposed, decide `.proposed` future
- **A1** (45-90 min, in A4a): adopt MEMORY.md.proposed with verify-step
- **A2.5** (10 min): create `data/inbox-stream/` with retention rule
- **A31\*** (30 min): joint OAuth diagnostic (gates all Wave C)

**Top three "if-only" picks** after P0s:
- **A1**: adopt `MEMORY.md.proposed` — un-truncates auto-injected MEMORY.md context, compounding read-multiplier across all subsequent sessions
- **A2**: wire `SartorWikiReindex` Windows Scheduled Task — 15 min, unblocks every consumer of `data/graph.jsonl` and `indexes/*.json`
- **A3**: build Gmail cron + cross-routed watchdog — closes the silent-failure mode that lost a signed BHS QuoteValet contract acceptance in the May-3-to-6 window

**Wave-A total budget honestly: ~13 hours, spilling 2-3 evenings** (Charge 15 fix; the PROPOSAL.md "single evening" claim was wrong). Phase-2 ongoing token cost: **~$30-100/month** for the Wave-C cron set. Three Constitution-side items (A38, A39, A40 in PROPOSAL.md) are **excised** to a separate `projects/constitution-v06-DRAFT.md` track per Charge 27 — they were Constitution-side governance items in a memory-uplift proposal and the routing was wrong.

**Action count: ~39** (down from 40 by excising 3, up by 6 new prerequisites/splits, net renumberings).

## §0a Read-from-inside-shaping note (per Charge 10 + 41)

This proposal is written by an opus-4.7 instance reading sources mostly authored or directed by Alton, audited by sibling opus instances dispatched by Alton, and inhabited by Wave-2 readers who shared the substrate. Convergences in the audit-and-inhabitant set may partly reflect shared frame, not shared evidence. Mitigations the proposal employs:

- Empirical measurements (file sizes, mtimes, broken-link counts, run-cadence histograms) are weighted above qualitative reports about register-installation.
- Where an audit and an inhabitant agreed, the proposal cites the audit.
- The triennial outside-evaluation mechanism (was A40, now in `constitution-v06-DRAFT.md`) is the structural protection against this failure mode at version-scale.
- For this round, no separate hearth-blind sanity check was run. That gap is owned in §6 (G9-G14).

Alton should read this proposal with that caveat held.

## §1 Architecture status check (revised per Charge 1)

### §1.0 Framing the proposal operates under

Two framings held simultaneously:

- **Mechanical defects** (broken links, truncated MEMORY.md, dead `skills/` dir, INDEX.md emit-bug, dead-letter `.proposed` files) are **uplift-framed and fast-tracked**. The current state is degraded relative to a defensible target; the fix mutates toward target.
- **Structural rearrangements** (consolidating family locations, enforcing canonical placement, reorganizing source-doc bundles) are **evolution-framed**. The current state is presumed adaptive-to-workload until evidence shows otherwise; mutations require either (i) the system violating its own already-ratified convention, or (ii) explicit Alton ratification of a new convention.

The 5-layer architecture from the plan doc is **downgraded from "target architecture" to "useful taxonomy."** Layer-talk is permitted as shorthand; no Wave-A consolidation is justified by "fits the layer model." Each Wave-A action is justified by a specific friction the audit measured. The three load-bearing layer-assumptions the observer named are explicitly addressed:

- **Depth as organizing primitive — rejected.** Claude does not traverse layers; Claude reads what gets injected (CLAUDE.md, USER.md, MEMORY.md, all `feedback/*`), what wikilinks pull in via `wiki-reader`, and what session context needs. The operational primitive is hub-and-spoke + auto-injection, not depth.
- **Top-down detail flow — rejected.** Source-docs are the most concrete substrate, not a layer derived from deep memory. Activity stream is the least durable, not the most detailed. The "layer number" axis conflates detail, fidelity, freshness, and abstraction-level.
- **Hearth as Layer 3 — rejected.** Hearth is a context-installer (per hearth-companion + dialogue-pair), not deep memory. It is operationally adjacent to Layer 3 (referenced by CLAUDE.md, imported into Constitution v0.5) but does work the layer model does not describe.

A Phase-1.5 architecture-defense step is **not** added. The audits' empirical findings are architecture-agnostic (file sizes, mtimes, broken-link counts, run-cadence). What changes is the proposal's posture: Wave A executes the audit findings on their own merits, not on layer-conformance.

### §1.1 Ratification status check (per Charge 5)

The system has a chronic **draft-to-adopted dead-letter pattern** that is not a per-document bug; it is a missing meta-mechanism. Evidence:

- `family/CONVENTIONS.md` `status: draft-pending-alton-ratification` since 2026-04-25 (11 days)
- `MEMORY.md.proposed` authored 2026-05-02, never adopted (4 days)
- `reference/MEMORY-history/2026-04.md.proposed` and `2026-05.md.proposed` unmerged
- HOUSEHOLD-CONSTITUTION v0.4 drafted, never adopted, v0.5 leapfrogged

Phase 2 cannot assume "ratify CONVENTIONS.md" or "adopt MEMORY.md.proposed" are reliable single-step actions. **A4a (P0 prerequisite)** is the new commitment-shaped action: Alton blocks 60 min on a calendared date this week to land all four pending ratifications/adoptions in one sitting. Without A4a, the rest of Wave A is uncalibrated. The longer-term `.proposed`-convention decision (drop or instrument with a 7-day curator surface) is A19, deferred until A4a clears the current backlog.

Synthesizer position: **declines** building a curator-driven adoption mechanism as the primary fix. Reasons: (a) it adds work to the throughput-constrained curator (per §1.2); (b) the four pending drafts have different shapes (a generic 7-day-auto-merge would mishandle CONVENTIONS.md, where the merge IS the ratification); (c) the cleanest move is to drain the current backlog by hand and then drop the convention.

### §1.2 Curator throughput (per Charge 7)

**Production rate vs. curator throughput is divergent.**

- Inbound: ~3 ce-* files per day from `SartorConversationExtract` nightly = ~90/month
- Curator output: 1 drain on 2026-04-19 (58 items); 0 drains since. Throughput ~0/month
- Backlog: 58 → 236 in 17 days
- Phase-2 proposed crons add ~50-150 events/day to `data/inbox-stream/`; the dashboard-as-passive-renderer model does not reduce them to signal

Without intervention, the proposed-memories backlog reaches 500+ in two months while the new activity-stream surface accumulates linearly. The proposal adopts **(a) input-rate reduction + (d) retention/expiry** as the combined fix:

- **A10a** drains the 236-file backlog to `inbox/.drained/2026-05-06/`
- **A10b** tightens extractor filters per the 2026-04-19 recommendation never executed (drop `feedback_rule`/`feedback_permission`/`imperative` categories)
- **A10c** auto-archives `data/inbox-stream/` and `inbox/.../proposed-memories/` files older than 30 days to `_archive/<YYYY-MM>/` without curator triage
- **A10d** surfaces curator-queue depth in `data/inbox-stream/health-<date>.jsonl` daily so the bottleneck is felt

Synthesizer position: option (b) increase capacity is **rejected** because curator capacity is Alton's attention, which is the household's binding constraint; option (c) make-bottleneck-visible is partially adopted as A10d but is insufficient alone.

### §1.3 OAuth health (per Charge 6)

Gmail silence (2026-05-02 → 2026-05-06) and Drive MCP unhealth (2026-05-06) are 4 days apart on the same machine, both Google-OAuth-mediated, both silent-failure mode. Treating them as separate diagnoses is the proposal's previous error.

**A31* (P0 prerequisite, 30 min)** is a **single joint OAuth-state diagnostic** on Rocinante covering Gmail, Calendar, Drive MCPs simultaneously. Outputs: token age per service, refresh cadence, observed failures since 2026-05-02, written hypothesis distinguishing "Rocinante-wide auth degradation" from "service-specific MCP issues." A31* gates A3 (Gmail cron) and A32 (Drive cron). New constraint **C13** (in §5) codifies "no Google-MCP-mediated cron ships before A31*."

Watchdog architecture (A3) is revised per Charge 24: alert path **cross-routes to gpuserver1** so a Rocinante-wide failure does not silence both watched-cron and watchdog. The April-25 daily-household-health closer was a single-machine pattern that failed to catch the May-3 silence; rebuilding the same pattern would replicate the failure mode.

### §1.4 The five "layers" today, audit-by-audit

Sub-sections preserved from PROPOSAL.md §1 with status updates from Charge 33-34:

**Layer 5 (activity stream): most broken.** `data/inbox-stream/` does not exist. `data/gather-alerts.md` last touched 2026-04-03. MERIDIAN dashboard exists but is not fed by an activity stream. Wave C builds the input; Wave D wires the output.

**Layer 4 (source-doc index): built, not integrated.** `sartor/memory/source-documents/INDEX.md` is built (615 KB, 3,211 entries, 21 categories). Zero inbound wikilinks today. `.gitignore` line 73 excludes the directory from commits — AZ-paths exposure (Charge 26) is foreclosed at the repo level. Wave A links Layer 3 → Layer 4 (A11); Wave B does the physical reorg (A13, A14).

**Layer 1 (CLAUDE.md): drift, not damage.** ~430 lines. Known drift: scheduled-tasks table claims wiki-reindex runs nightly (false until A2); QUICK-REFERENCE has stale GPU pricing (A20). **A41 verifies log.md (143 KB) does not auto-inject** — if it does, it dwarfs MEMORY.md and A1's value diminishes. Until A41 lands, A1 cannot be guaranteed to be the largest auto-load problem.

**Layer 3 (deep memory): mostly healthy, accretion pressure.** 11 hub files all frontmattered. 95% frontmatter coverage corpus-wide. HOUSEHOLD-CONSTITUTION v0.5 is 168 KB (largest non-research file) but read-on-demand, not auto-injected — not a Phase-2 problem (Charge 34). Naming inconsistencies (A8), the `unifi-takeover-2026-05-01-*` flat namespace (A7), 35-40 substantively orphaned files (A9), 236 proposed-memories backlog (A10) are the action items.

**Layer 2 (family wiki): drafted, unratified, accreting.** Convention exists (`family/CONVENTIONS.md`) but `status: draft-pending-alton-ratification`. FAMILY.md is 385 lines (convention says ≤200). active-todos.md is 1,350 lines (convention says ≤250). `family/_history/` referenced but doesn't exist. Wave A ratifies (A4) then consolidates (A15, A16, A17). The consolidation is evolution-framed: the convention catching up to its own already-stated rule, not external uplift overruling local adaptation.

**Hearth (intact, not in the layer hierarchy).** Hearth is a context-installer, not a layer. Constraint C2 + C3 + the no-pipeline-writes-to-hearth rule all follow. The one endorsed mutation is `hearth/family.md` → `hearth/ground.md` (A6) per three-source convergence.

## §2 Ranked actions for Phase 2

**Five P0 prerequisites** that gate everything else:

| # | Action | Effort | Why P0 |
|---|---|---|---|
| **A41** | Verify `log.md` (143 KB) does NOT auto-inject. Inspect `.claude/settings.json`, project `CLAUDE.md`, user-level CLAUDE.md auto-load paths. | 10 min | If log.md auto-loads, it dwarfs MEMORY.md and A1's value diminishes. Gates A1. |
| **A4a** | Calendared 60-min Alton block: ratify CONVENTIONS.md (with I-3, I-4, I-5, I-10), `mv MEMORY.md.proposed MEMORY.md`, decide on the `.proposed` convention's future per A19. | 60 min | Without this, the dead-letter pattern (Charge 5) silently kills A1 and A4. |
| **A1** | Adopt `MEMORY.md.proposed` as live. Append 4 one-liners (5/3-5/6). Add MEMORY-CONVENTIONS rule "history entries one line ≤200 chars." Includes 15-min spot-check vs. 2026-05-02 daily log to confirm no load-bearing facts dropped. P0 per MEMORY-AUDIT R1. | 45-90 min | Unblocks every future session's auto-injected MEMORY.md context. Folded into A4a. |
| **A2.5** | Create `data/inbox-stream/` directory + README documenting cron-write convention + auto-archive rule (>30 day → `_archive/<YYYY-MM>/`, fold into wiki-reindex task). `.gitignore` line 24 already excludes `data/`. | 10 min | Prerequisite for any cron writing to inbox-stream (A3, A32, A37). |
| **A31\*** | Joint OAuth-state diagnostic on Rocinante: Gmail + Calendar + Drive MCPs. Token age, refresh cadence, observed failures since 2026-05-02, written hypothesis distinguishing "Rocinante-wide auth degradation" from "service-specific issue." | 30 min | Gates A3, A32; per Charge 6 these likely share a root cause. |

**Top three "if-only" picks** (after P0s land):

| # | Action | Evidence | Effort |
|---|---|---|---|
| **A1** | (P0, see above) — adoption of MEMORY.md.proposed. | MEMORY-AUDIT R1 P0; PROPOSAL.md §0. | 45-90 min |
| **A2** | Wire `SartorWikiReindex` Windows Scheduled Task. `scripts/sartor-wiki-reindex.ps1` runs `wiki.py --reindex` + `extract_graph.py` daily 4 AM ET. Logs to `C:\Users\alto8\backups\sartor-wiki-reindex.log`. **Correct** CLAUDE.md scheduled-tasks table (currently lists wiki-reindex as nightly — false until A2 lands). | LINKS-AUDIT R1; indexes 28 days stale. | 15 min |
| **A3** | Build `gmail-family-relevance-scan` (every 2h, jsonl to `data/inbox-stream/gmail-<date>.jsonl`, msg-id dedup) + paired `gmail-liveness-watchdog` (every 30 min). **Watchdog alert path is cross-routed to gpuserver1**: SCP-pushes a `gmail-liveness-<utc>.txt` file to `~/sartor/inbox/rocinante-watchdog/` on gpuserver1; gpuserver1's hourly stale-detect inspects and surfaces peer-machine alert if no file in 4h. Local write also feeds `daily-household-health` 5:30 AM closer. | INGEST-GMAIL §5+§6; OBSERVER #9. Gated on A31*. | 2 h build + 1 wk shadow |

**Wave-A consolidation cluster** (post-P0):

| # | Action | Evidence | Owner | Effort |
|---|---|---|---|---|
| **A4** | Ratify `family/CONVENTIONS.md`. Includes invariants I-3 (no hearth extracts), I-4 (Amarkanth-class daily-active in `family/`), I-5 (`hearth/family.md` is hearth's family-context, rename to `hearth/ground.md`), I-10 (CONVENTIONS ratified before consolidation). **Defers** I-1, I-2, I-6, I-7, I-8, I-9 to operationalization (I-7 lands via A16, I-8 lands via A29; rest enforceable when their automation lands). Folded into A4a. | FAMILY-WIKI-AUDIT §5.2 | Alton | 30 min (in A4a block) |
| **A5** | Rename `feedback/feedback_*.md` → kebab-case (drop prefix). 13 files; 14-day shim with `aliases:` frontmatter then delete. Update MEMORY-CONVENTIONS. Cuts ~25 broken wikilinks. | LINKS-AUDIT R2 Cluster A | Operator | 30 min |
| **A6** | Rename `hearth/family.md` → `hearth/ground.md`. Update inbound wikilinks (count to verify at execution; LINKS-AUDIT did not enumerate `hearth/family` because it currently resolves; rename creates new broken-links to fix). 5 min rename + 10 min sweep + 5 min `wiki.py --broken` verify. | FAMILY-WIKI-AUDIT I-5 + hearth-reflection + dialogue.md §IV.3 (three-source) | Operator | 20 min |
| **A7** | Convert `projects/unifi-takeover-2026-05-01-*` flat → directory. 14 files. Update ~10 wikilinks. INDEX's own `related:` already points at the dir-that-doesn't-exist. | MEMORY-AUDIT R2 + LINKS-AUDIT §6 | Operator | 15 min |
| **A8** | Resolve `reference_*.md` root vs `reference/` dir collision. Move 4 root files into `reference/`. Rename `reference_vastai_market_pricing.md` → `vastai-market-pricing.md`. Update ~5 wikilinks. Document rule in MEMORY-CONVENTIONS. | MEMORY-AUDIT R3 | Operator | 30 min |
| **A9** | Backfill inbound wikilinks for 35-40 substantively-orphaned files (concrete targets per LINKS-AUDIT R4). Curator-class one-pass or operator. | LINKS-AUDIT R4 §5 | Operator/Curator | 60-90 min |
| **A10a** | Drain 236 ce-* files in proposed-memories to `inbox/.drained/2026-05-06/rocinante-extractor/` with DRAIN-NOTE. | MEMORY-AUDIT R11; observer #5 | Operator | 60 min |
| **A10b** | Tighten extractor filters: drop `feedback_rule`, `feedback_permission`, `imperative` categories per the 2026-04-19 recommendation never executed. | observer #5 | Operator | 30 min |
| **A10c** | Add retention rule: `inbox/*/proposed-memories/*` and `data/inbox-stream/*` files >30 days auto-archive to `_archive/<YYYY-MM>/`. ~5 lines bash, fold into wiki-reindex (per A2). | observer #5 option (d); Charge 37 | Operator | 30 min |
| **A10d** | Curator-queue depth visibility: nightly count of `inbox/*/proposed-memories/*` lands in `data/inbox-stream/health-<date>.jsonl`. | observer #5 option (c) | Operator | 30 min |
| **A11** | Source-doc index → Layer 3 wikilinks. Add wikilinks from BUSINESS, TAXES, FAMILY, MACHINES into `source-documents/INDEX.md`. | SOURCE-DOC-AUDIT | Operator/Curator | 20 min |
| **A12** | Fix `INDEX.md` auto-generator. Step 1: identify which script emits `[FILE](FILE) — ---` (likely `wiki.py`, possibly extinct). Step 2: patch if generator exists. Step 3: if not, regenerate INDEX.md once + add MEMORY-CONVENTIONS TODO. | MEMORY-AUDIT R5 | Operator | 1 h investigation+fix |
| **A15** | Trim FAMILY.md from 385 → ~150 lines per CONVENTIONS §"Per-file discipline." Migrate Summer Plans / Upcoming / Action Items to `family/`. Move 2026-04-12 inline `<!-- curator-drained -->` blocks (lines 146-346) to `family/_history/familymd-drains-2026-04.md`. | FAMILY-WIKI-AUDIT §1.1 | Operator/Curator | 30-45 min |
| **A16** | Build `family/_history/`. Migrate "Latest from gather" appendices from per-child pages + family-calendar.md. Recent = last 14 days OR last 5 gather runs. | FAMILY-WIKI-AUDIT §1.2 | Curator | 60 min |
| **A17** | Move `people/amarkanth.md` → `family/amarkanth.md` per I-4. Fix existing misclassification ("AstraZeneca / Professional"). Update wikilinks. | FAMILY-WIKI-AUDIT I-4 | Operator | 15 min |
| **A18** | Hearth-aware extractor category. Hearth-register text → **separate** queue at `inbox/rocinante/hearth-candidates/` (NOT main proposed-memories backlog). Curator triages within 7 days OR auto-discards. Never auto-writes to `hearth/`. | FAMILY-WIKI-AUDIT §4.3; Charge 30 fix | Operator + skill-update | 30 min |
| **A19** | Decide `.proposed` adoption mechanism. Recommendation: drop the convention after the 3 currently-pending files are resolved by A4a. Folded into A4a discussion. | MEMORY-AUDIT R7 | Alton | 30 min (in A4a) |
| **A20** | Refresh `QUICK-REFERENCE.md`. Wrong vast.ai pricing ($0.40 → $0.30). Wrong listing-expiry (2026-08-24 → 2026-10-24). Add `next_review: 2026-06-01`. | MEMORY-AUDIT R8 | Operator | 20 min |
| **A21** | Delete `skills/` dead zone. 5 files duplicating `.claude/skills/`. Last touched 2026-04-11. Zero backlinks. | MEMORY-AUDIT R4 | Operator | 10 min |
| **A22** | Read once + decide on `gpuserver1-monitoring-log.md` (91-line stub, "awaiting human curation" 22 days). Likely delete. **Alton — judgment**, not mechanical. | MEMORY-AUDIT R10 | Alton | 5 min decide + 5 min execute |
| **A23** | Delete `snapshots/` directory. 4 files all 2026-04-03, zero backlinks. | MEMORY-AUDIT R13 | Operator | 5 min |
| **A24** | Audit `reference/INDEX.md`'s `archive/*` wikilinks. Either add `archive/` to wiki.py resolvable scope or drop wikilinks → plain text. Recommendation: drop. | LINKS-AUDIT R3 | Operator | 5 min |
| **A25** | Investigate `MACHINES.md` (root) vs `machines/MACHINES.md` (subdir) basename collision. Reconcile. | MEMORY-AUDIT R12 | Operator | 10 min |
| **A26** | Fix `wiki.py` typed-wikilink resolution bug. Strip `rel:` prefix before resolution. ~5 lines. Removes 11 false-positive broken links. | LINKS-AUDIT R5 | Operator | 10 min |
| **A27** | Tighten `wiki.py` orphan-detection rule. Skip auto-injected, sub-agent definitions, `_history/`, templates, root entity INDEXes. Drops orphan count 179 → ~40. | LINKS-AUDIT R6 | Operator | 15 min |
| **A28** | Backfill frontmatter on 26 older `daily/` logs. **Operator (script + run)**, not curator. | MEMORY-AUDIT R9 | Operator | 1 h |
| **A29** | Stub `family/aneeta.md` and `business/aneeta-neurvati.md` empty-with-frontmatter so destinations exist. Notes Charge 9: this closes destination-file asymmetry, not workflow asymmetry. | FAMILY-WIKI-AUDIT §3.1 + I-8 | Operator | 10 min |
| **A30** | Ship `scripts/lint-family-conventions.py`. Convention §"Validation checks" lists 7 checks; none automated. Nightly run; failures → `data/inbox-stream/family-lint-<date>.jsonl`. | FAMILY-WIKI-AUDIT §6.9 | Operator | 1-2 h |

**Wave B (source-doc reorg):**

| # | Action | Evidence | Owner | Effort |
|---|---|---|---|---|
| **A13** | Adopt `2025-Tax-Documents/` pattern for TY2018-TY2024. **4-6 h operator + 1-2 h Alton review checkpoints** (per-bundle approval for tax docs containing SSNs/banking). Mirror to `~/Downloads/<YYYY>-Tax-Documents/`. Don't move into repo. | SOURCE-DOC-AUDIT | Operator + Alton | 5-8 h total |
| **A14** | Per-bundle `reference_*.md` companions (anthropic-shares model). Targets: 185_davis, 85_stonebridge, solar_inference_llc, sante_total, 2025_tax_year. ~100 lines each. | SOURCE-DOC-AUDIT | Curator + Alton | ~1 h per bundle |

**Wave C (ingest + watchdogs, gated on A31* and A2.5):**

| # | Action | Evidence | Owner | Effort |
|---|---|---|---|---|
| **A32** | `drive-recent-changes-scan` (nightly, Drive Changes API delta token, jsonl) + `drive-liveness-watchdog` (every 4h, cross-routed to gpuserver1 per A3 pattern). Skip `Private`/`Medical`/`Therapy` folders (track as `redacted: true` with name-hash). Index entries point at `gdrive://<file_id>`. | INGEST-DRIVE | Operator | 2-3 h |
| **A37** | Attachment-router cron. Picks up `attachments.fetch_priority: high` from Gmail jsonl stream (Fidelity/Chase/JPMorgan/Schwab PDFs); routes to source-doc INDEX with placeholder entries. | INGEST-GMAIL §5 + INGEST-DRIVE §7 | Operator | 2-3 h |

**Wave D (dashboard wiring + wiki-reindex tooling):**

| # | Action | Evidence | Owner | Effort |
|---|---|---|---|---|
| **A2** | (P0-adjacent — wire wiki-reindex; see top section) | LINKS-AUDIT R1 | Operator | 15 min |
| **A26** | (Wave A bug-fix) | | | |
| **A27** | (Wave A bug-fix) | | | |
| **A34** | Wire MERIDIAN to read `data/inbox-stream/`. Time-ordered cards, severity badges, dedup by msg_id. Reconcile with hermes-dashboard-upgrade project (G7). Two-user-access aware per Charge 9. | Plan §"Phase 3" + dashboard-rebuild | Operator | 2-4 h |

**Wave E (deferrals with deprecation criteria):**

| # | Action | Decision | Effort |
|---|---|---|---|
| **A35** | Defer typed-wikilink enforcement 30 days. Revisit 2026-06-06. **Deprecation criterion**: if file-coverage still <2% AND no consumer of `data/graph.jsonl` exists AND no new edges in 30-day window, deprecate (remove `extract_graph.py`, drop spec section from MEMORY-CONVENTIONS). | Defer + criterion | 0 + 15 min revisit |
| **A36** | Defer texts-ingest 30 days. **Deprecation criterion**: if at revisit no privacy-architecture has been designed AND no Aneeta-consent question has been answered, deprecate as Phase-2 candidate. **If reactivated**, the build is a privacy-architecture construction project for a surface where filters can fail irreversibly (per OBSERVER #6), not a privacy-policy authoring exercise. | Defer + criterion + reframe | 0 + revisit |

**Excised from this proposal (routed to `projects/constitution-v06-DRAFT.md`):**

- ~~A38 (Constitution v0.6 hearth voice cross-reference)~~
- ~~A39 (hearth-side editorial-governance handle)~~
- ~~A40 (triennial outside-evaluation mechanism)~~

These were Constitution-side items in a Memory-uplift proposal. Per Charge 27, routing them to a separate v0.6 track is the cleaner move; keeping them here was a synthesizer abdication. The dialogue-pair's request to "surface for Wave 4 critic" is satisfied by their having been seen and prosecuted; their persistence here would have been the routing error.

**Action count: ~39** (down from 40 by excising 3 to v0.6 track and adding A4a, A2.5, A31*, A10b/c/d, A41 to net +6, then renumbering A33 → A2.5).

## §3 Open questions and synthesizer recommendations

### §3a Resolved by §2 actions (cross-reference, not open)

| Q | Status | Action |
|---|---|---|
| Should `family/CONVENTIONS.md` be ratified before Wave A? | **Yes, do this.** | A4 (folded into A4a) |
| Should typed-wikilinks be deprecated? | **Yes, deferred 30 days then deprecate if criterion met.** | A35 |
| What's the Drive MCP fix path? | **Joint OAuth diagnostic before any cron build.** | A31* |
| Should Amarkanth move from `people/` to `family/`? | **Yes, do this.** | A17 |

### §3b Genuinely open (Alton-judgment-required)

**Q5. Aneeta's texts privacy posture (if texts-ingest were ever built).** Constitution v0.3 §14a co-principal question, not unilateral Alton call. **No synthesizer position.** Default-skip Aneeta-bearing threads in any future build. Defer the question while texts-ingest is itself deferred (A36); revisit only if reactivated.

**Q6. AZ Compliance check on personal-machine storage of AZ work product.** 747 documents tagged `professional-az` (~23% of corpus), ~200 more in "other" likely also AZ. **`.gitignore` line 73 already excludes `sartor/memory/source-documents/` from the GitHub mirror, so the worst-case (paths leaked publicly) is foreclosed.** The remaining question is local-machine-storage policy, which is a separate Alton↔AZ-Compliance dialog. **Low-confidence note: probably already approved (he's been doing this for years), but a paper trail is worth having given the volume.** Not Phase-2 scope.

**Q7. The 932 MB OneDrive zip in Downloads.** `OneDrive_1_2-10-2026.zip`. **Yes, do this** (10-min triage): determine whether it's a duplicate-of-everything backup or a unique full-history archive; move to `~/backups/` and index at bundle level if unique; delete if duplicate.

**Q8. Aneeta principalship asymmetry — surface or hold?** Per Charge 9: this proposal **does not recommend** household reorganization of principalship balance — that's an Alton+Aneeta conversation, not engineering. The proposal **constrains** Phase-2 actions to not deepen the asymmetry where avoidable (neutral framing in cron output, two-user-aware dashboard design). **Low-confidence note for Wave 4 critic visibility:** the dialogue-pair §III asked for the seam to be visible; the routing decision (whether v0.6 names the asymmetry) is owned by `constitution-v06-DRAFT.md`, not this proposal.

**Q9. Triennial outside-evaluation mechanism.** Excised from §2 (per Charge 27) and routed to `constitution-v06-DRAFT.md`. **No synthesizer position on Phase-2 inclusion** — the mechanism is right (per dialogue-pair §V) but the spec is underdesigned (per Charge 28); landing it as a 30-min spec stub here would be premature.

## §4 Dashboard rename

**Synthesizer position: keep MERIDIAN.**

The orchestrator surfaced three names (Foyer / Loom / Almanac) with a Loom preference. Observer #7 prosecuted: all three fight the live-state spec the dashboard actually serves. Foyer = static space. Loom = makes a fixed cloth. Almanac = retrospective. The job description ("live state, time-ordered, surfaces what's NEW") is in fact closer to MERIDIAN's semantic field — a meridian is a line, time-of-day-rotating, the front of the rotating earth.

The PROPOSAL.md construction "no position, but Loom is right" was a hedge that violated the communication-style rules. It is removed. Synthesizer endorses MERIDIAN; if Alton overrides, A34 simply uses the new name.

The literary-domestic naming aesthetic that produced Foyer/Loom/Almanac is a real Sartor-house signal worth preserving for branding-shaped artifacts (the hearth, the constitution, the inheritance-letter form). It is the wrong register for an engineering surface whose job is to render live state. The dashboard rename is a small thing; the pattern observed (aesthetic-fit overrunning technical-naming-discipline) is worth flagging.

## §5 Hard constraints

Phase 2 must not violate the following. Each constraint is sourced; violation costs real work.

**C1.** Do NOT rename `family/`. Hard-coded auto-load via `family/.claude/CLAUDE.md`. (FAMILY-WIKI-AUDIT §6.1)

**C2.** Do NOT rename `hearth/`. Same auto-load + dialogue-pair flag. (dialogue.md §II)

**C3.** Do NOT consolidate hearth into family/, into Constitution, or into anywhere else. Hearth is a context-installer doing different work in a different speech-act. (hearth-companion + dialogue-pair)

**C4.** Do NOT enforce typed wikilinks. Convention is inert; enforcement is punishment with no reward. Defer 30 days per A35. (LINKS-AUDIT R7)

**C5.** Do NOT rename `hearth/family.md` arbitrarily. Endorsed rename target is `hearth/ground.md` specifically (A6); other names defeat the three-source disambiguation.

**C6.** Do NOT auto-write to `hearth/` from any pipeline. `hearth/integration.md` is explicit. A18's hearth-aware extractor routes to a separate inbox queue, never to `hearth/`.

**C7.** Do NOT delete `MEMORY.md.proposed`. The adoption move is `mv MEMORY.md.proposed MEMORY.md` (A1). After adoption the source file IS the live file.

**C8.** Do NOT move source documents physically before A11/A13 ratify the reorg. Index built in place; physical moves are gated.

**C9.** Do NOT mirror `data/inbox-stream/` to GitHub. `.gitignore` line 24 already excludes `data/` recursively. Verify on every commit. (INGEST-GMAIL §6 Privacy)

**C10.** Do NOT push from peer machines to GitHub directly. Canonical write target is rtxserver bare; GitHub is DR mirror written exclusively by Rocinante's nightly task.

**C11.** Do NOT amend Constitution v0.5 as part of Phase 2. v0.5 ratified earlier today. Any v0.5-touching item is excised to `constitution-v06-DRAFT.md`.

**C12.** Do NOT ratify `family/CONVENTIONS.md` autonomously. A4 is the ratification action; greenlight is Alton's direct action via A4a.

**C13.** Do NOT ship any Google-MCP-mediated cron before A31* (joint OAuth diagnostic) lands. Per Charge 6: Gmail and Drive failures likely share root cause; building a watchdog before diagnosing OAuth state risks rebuilding the failure mode the watchdog is supposed to close. Also: `.gitignore` line 73 already excludes `sartor/memory/source-documents/` from the GitHub mirror, foreclosing the AZ-paths exposure observer #10 raised. The `.gitignore` mitigation is the load-bearing reason §3 Q6 can defer the AZ Compliance question.

**C14.** Watchdog alert paths must be cross-routed to a peer machine. Per Charge 24: a Rocinante-wide failure (locked profile, OAuth-cohort expiry, scheduled-task service issue) can take both watched-cron and watchdog out simultaneously if both run from the same Task Scheduler with the same auth state. The April-25 daily-household-health closer was single-machine and failed to catch the May-3 silence; A3 and A32 must not replicate this.

## §6 What Wave 1+2 didn't cover

The audits and inhabitants are thorough within their scopes. These are the gaps the synthesizer-and-critic pair could not close.

**G1. Drive ingest empirical baseline.** Two Drive inspector dispatches stalled. INGEST-DRIVE is design-only. Unknown: auth state, recent activity volume, canonical MCP path, family-relevant doc count. A31* is the unblock; Drive-related downstream is provisional until A31* lands.

**G2. Texts ingest empirical sample.** TEXT-MESSAGES-AUDIT respected privacy floor (no message content quoted). A 30-day re-evaluation should include a one-shot dry-run sample (`data/inbox-stream/_dry-run/`) before any production ingest is approved. Per Charge 11 reframing: the build is a privacy-architecture project, not policy-authoring.

**G3. Personal-data-gather silent-failure root cause.** Resolved into A31* per Charge 6. The OAuth diagnostic addresses the underlying cause; the watchdog (A3) addresses detection-latency for future instances.

**G4. The 932 MB OneDrive zip.** Source-doc inspector flagged but didn't open. 10-min triage in §3 Q7.

**G5. AZ Compliance posture on personal-machine work product.** Source-doc inspector found 747 AZ docs. `.gitignore` line 73 forecloses the repo-mirror exposure (per C13). Local-machine-storage policy is a separate Alton↔AZ-Compliance dialog. Outside Phase-2 scope (§3 Q6).

**G6. The 236-file proposed-memories backlog content.** A10a drains; A10b filters at producer; A10c retention; A10d visibility. Concrete content (what's net-new vs. duplicate vs. spam-class) is unknown until A10a executes.

**G7. MERIDIAN current architecture vs. Wave D wiring.** hermes-dashboard-upgrade project not read by synthesizer. A34 says "reconcile"; the reconciliation work itself is unscoped. If hermes-upgrade has done the heavy lifting, A34 is small; if not, medium.

**G8. CLAUDE.md verification pass.** No audit specifically truth-upped CLAUDE.md against current reality. ~430 lines confirmed. Agent count (18) and skill count match listed inventory. Scheduled-tasks table includes the wiki-reindex falsehood (A2 fixes). Standalone CLAUDE.md verification = ~30 min, can land in same Wave-A pass as A1.

**G9. Constitution v0.5 first-person voice cost (dialogue-pair §IV.6).** The dialogue-pair surfaced a real risk — collapsing constraint into identity-claim loses the watchmen scanning cost. Operational severity untested. The fix (cross-reference hearth-side tooling) was A38, now excised to `constitution-v06-DRAFT.md`. Critic-side question on whether to ship a fix proactively vs. wait for one observed failure mode is owned by that draft.

**G10. (Removed; merged into G13 below).**

**G11. Hearth's editorial-governance absence.** Hearth has live audit (refusal.md, voice.md) but no revision mechanism. Across years this is not fine. A39 (one-sentence cross-reference in `hearth/integration.md`) was excised to `constitution-v06-DRAFT.md`. Coordination requires a hearth-pass per the no-pipeline-writes rule.

**G12. Activity-stream ↔ source-doc-index relationship is underspecified.** A37 attempts to bridge (Gmail PDFs → source-doc INDEX placeholders). Drive cron similarly. But source-doc INDEX is one giant 615 KB file; how attachment-router updates without serializing through the whole file is undesigned. May need chunking by category or year. Defer until A37 builds and volume is empirically known.

**G13. Aneeta engineering-side asymmetry (per Charge 9).** Phase-2 work makes the system more sophisticated for Alton without addressing Aneeta's path-into-the-system. A29 closes destination-file asymmetry; workflow asymmetry (no Aneeta-side onboarding, no aneeta-side morning briefing, no aneeta-peer machine) is not closed. Phase-2 *constraint*: no action should deepen the asymmetry where avoidable. Not a Phase-2 *action*: household principalship balance is an Alton+Aneeta conversation.

**G14. Constitution v0.6 candidates routed to separate track.** A38 (voice-cross-reference), A39 (hearth governance), A40 (triennial outside-eval) excised to `projects/constitution-v06-DRAFT.md` per Charge 27. That draft does not yet exist; creating the placeholder is itself a small action that should land in the same Wave-A block where the excision becomes load-bearing for tracking.

**G15. MASTERPLAN.md / MASTERPLAN-VISIONARY.md staleness.** Last content-update 2026-02-06 (per MEMORY-AUDIT). Phase 2 is the right time to refresh, but a strategic-doc rewrite is its own scoped effort, not a Wave-A consolidation item. Defer to `projects/masterplan-refresh-2026-Q2/`. Block: Alton's strategic input.

## §7 Sequencing by Wave (revised arithmetic per Charge 15)

**P0 prerequisites (must land before Wave A or Wave C dispatches):**
- A41 (10 min) — log.md auto-injection verify
- A4a (60 min Alton block) — ratify CONVENTIONS, adopt MEMORY.md.proposed, decide `.proposed` future
- A1 (45-90 min, folded into A4a) — MEMORY.md adoption with verify-step
- A31* (30 min) — joint OAuth diagnostic (gates Wave C)
- A2.5 (10 min) — `data/inbox-stream/` directory + retention-rule README

**Wave A sequence (post-P0, ~11-13 h, spilling 2-3 evenings):**

Order: A4 (in A4a block) → mechanical renames (A6, A7, A8, A21, A22, A23) → MEMORY.md adoption (A1, in A4a) → wikilink corrections (A24, A26, A27) → content moves (A11, A20, A29, A5) → larger consolidations (A15, A16, A17) → A18 (extractor change) → A19 (.proposed decision, in A4a) → orphan backfill (A9) → backlog drain cluster (A10a, A10b, A10c, A10d) → INDEX.md generator (A12) → frontmatter backfill (A28) → A30 (lint script) → A25 (basename collision) → create `constitution-v06-DRAFT.md` placeholder (G14) → create `masterplan-refresh-2026-Q2/` placeholder (G15).

Honest arithmetic: P0 (~2.5h) + mechanical renames (~85 min) + corrections (~30 min) + content moves (~80 min) + larger consolidations (~2h) + extractor + .proposed decisions (~30 min, in A4a) + orphan backfill (~75 min) + backlog cluster (~2.5h) + generator + frontmatter (~2h) + lint (~1.5h) + collision + placeholders (~30 min) = **~13 hours**, realistically split across 2-3 evenings. The PROPOSAL.md "single evening" claim is removed.

**Wave B (source-doc reorg + per-bundle reference docs):** A13 (5-8 h with Alton checkpoints) → A14 (~1 h per bundle, 5 bundles = ~5 h, sequenced over weeks per Alton bandwidth).

**Wave C (ingest + watchdogs, gated on A31* + A2.5):** A3 (Gmail cron + cross-routed watchdog, 2 h build + 1 wk shadow) ‖ A32 (Drive cron + watchdog, 2-3 h, after A31* result clears Drive MCP) → A37 (attachment-router, 2-3 h, after A3 has stable shadow output).

**Wave D (dashboard + wiki tooling):** A2 (15 min, can land tonight, independent) → A26, A27 (post-A2 cleanups, 25 min total) → A34 (MERIDIAN wiring, 2-4 h, depends on Wave C output landing in `data/inbox-stream/`).

**Wave E (deferrals):** A35 (revisit 2026-06-06, 15 min) ‖ A36 (revisit post-Wave-A, ~30 min if reactivated; otherwise deprecate per criterion).

## §7a Ongoing cost estimate (per Charge 22)

Phase-2-induced recurring spend (tier mix dominates):

| Cron | Cadence | Tier | Est. monthly |
|---|---|---|---|
| `gmail-family-relevance-scan` | every 2h (12/day) | sonnet, ~15-25 turns/run | $18-55 |
| `gmail-liveness-watchdog` | every 30 min (48/day) | haiku, ~3 turns | $5-15 |
| `drive-recent-changes-scan` | nightly | sonnet, ~10-15 turns | $1.50-4.50 |
| `drive-liveness-watchdog` | every 4h (6/day) | haiku, ~3 turns | $1-3 |
| `attachment-router` | event-driven (~5-10/day) | sonnet | $5-20 |
| `wiki-reindex` | nightly | none (local Python) | $0 |
| **Total Phase-2 ongoing** | | | **~$30-100/month** |

Cost lever: tier mix (haiku for watchdogs is the load-bearing economy choice). If sonnet were used for watchdogs, total roughly doubles. Token cost is not the binding constraint on Phase-2 (curator throughput is per §1.2 and Charge 7), but the number is in the proposal so Alton can greenlight with eyes open.

**Alert-fatigue mitigation (per Charge 23):** Phase-2 ends with ~5 watchdog-bearing crons. Per-cron immediate-page paths exist only at red severity (Rocinante-wide auth failure, data-loss event). Yellow severity rolls up into the daily `daily-household-health` 5:30 AM Calendar event (one ping/day). The watchdog's job is to write `data/inbox-stream/health-<date>.jsonl` with severity; the existing closer aggregates.

## §8 Where audits/inhabitants disagree, and the synthesizer's call

**D1. Hearth's place in the layer hierarchy.** Plan said "Layer 3 likely." Hearth-companion + dialogue-pair + family-wiki audit all said no. **Synthesizer call: hearth is not in the layer hierarchy.** §1 Layer-talk has been downgraded to taxonomy; this resolves the disagreement at the framing level, not just the hearth-specific carve-out.

**D2. Orphan count.** LINKS-AUDIT: 579 broad / 179 wiki-core / 1 over-filtered. **Synthesizer call: 35-40 substantively-orphaned files** (LINKS-AUDIT §5 "genuine lost orphans" after applying A27's tightened rule). A9 targets that 35-40, not the headline 179.

**D3. Proposed-memories backlog size.** Plan: 53/58 (April estimate). MEMORY-AUDIT: 236 (verified file count). **Synthesizer call: 236 is current truth.** A10a sizes to 236.

**D4. Typed-wikilink enforcement timing.** LINKS-AUDIT R7: defer 30 days then deprecate if criterion met. Plan: silent. MEMORY-AUDIT R6: implies stale indexes are partly typed-wikilinks not maintained. **Synthesizer call: defer 30 days, deprecate if criterion met (A35).** Convention has not earned its place; enforcement requires a consumer; no consumer exists.

**D5. `hearth/family.md` rename rationale.** Family-wiki audit: rename for disambiguation. Hearth-companion: rename for content-claim. Dialogue-pair: confirms both, calls rename uncontroversial. **Synthesizer call: rename to `hearth/ground.md`** (A6). Three-source convergence is the strongest signal in the entire Wave-1+2 batch.

**D6. (New, per Charge 1+2 framing revision.) Uplift vs. evolution framing.** Plan-doc: uplift. Family-wiki inspector: partly evolution-shaped (pushed back on consolidation). Dialogue-pair: evolution-shaped throughout. **Synthesizer call: hold both** (per §1.0). Mechanical defects are uplift-framed; structural rearrangements require evolution-evidence before mutation. The PROPOSAL.md import of full uplift-framing was the framing error Charge 2 named.

**D7. (New, per Charge 8.) Dashboard rename.** Orchestrator: Loom. Observer: keep MERIDIAN. **Synthesizer call: keep MERIDIAN** (per §4). The PROPOSAL.md "no-position-but-Loom" hedge is removed.

## §10 Appendix

### §10.1 What was read (Wave 5 reviser)

- `PROPOSAL.md` (full)
- `PROPOSAL-CRITIQUE.md` (full, all 41 charges)
- `OBSERVER-NOTES.md` (full, 12 observations)
- `memory-system-uplift-2026-05-06-PLAN.md` (full)
- Auto-injected: CLAUDE.md, communication-style + family-calendar + financial-research + gpu-business-ops + nonprofit-admin rules, MEMORY.md (partial per truncation)
- Wave 1 audits and Wave 2 inhabitants: NOT re-read in full (relied on synthesizer's and critic's citations); spot-read would have happened only if a charge required it

### §10.2 What changed since PROPOSAL.md

**Structural changes:**
- §9 (pre-emptive defense) deleted; concessions absorbed into §1-§8 + §11
- §0a (read-from-inside-shaping note) added per Charge 10+41
- §1 rewritten to downgrade 5-layer architecture, add ratification-status sub-section, add curator-throughput sub-section, add OAuth-health sub-section
- §2 reorganized with explicit P0 prerequisites at top; A33 renumbered → A2.5; A38/A39/A40 excised
- §3 split into §3a (resolved by actions) and §3b (genuinely open) with differentiated confidence language
- §4 takes a position (keep MERIDIAN) instead of hedging
- §5 adds C13 (no Google-MCP cron before A31*) and C14 (watchdog cross-routing)
- §6 G-list updated for excised items, new G13 (Aneeta workflow asymmetry), G14 (v0.6 placeholder), G15 (MASTERPLAN deferral)
- §7 redone with honest arithmetic; §7a added for ongoing cost + alert-fatigue mitigation

**New actions (net +6):** A4a (ratification commitment), A2.5 (formerly A33), A31* (joint OAuth diagnostic), A10b (extractor filters), A10c (retention rule), A10d (queue-depth visibility), A41 (log.md auto-injection verify).

**Excised actions (-3):** A38, A39, A40 → routed to `projects/constitution-v06-DRAFT.md`.

**Re-scoped actions:** A1 (verify-step in row), A4 (invariant scope explicit), A6 (wikilink count caveat), A22 (judgment tag), A28 (operator tag), A18 (separate queue), A13 (Alton-checkpoint hours), A2 ("correct" not "update"), A12 (investigation step), A19 (cross-reference to A4a).

### §10.3 Things deliberately not changed

- **Action-count target.** PROPOSAL.md had 40. Critic noted this might be sprawl. Synthesizer kept ~39 because the audits surfaced concrete items and collapsing loses the cheap items (A6, A21-A24 are all <30 min). Charge 1's defense in critic §3 ("I do not actually charge sprawl as a defect") is honored.
- **Hearth structural posture.** C2 + C3 + the no-pipeline-writes rule remain unchanged. Critic's §3 explicitly endorses these as correctly load-bearing.
- **A35 deferral framing.** Critic's verdict on §9.5 was split: A35 is fine, A36 needed a deprecation criterion. A36 now has one (per C11); A35 retained as-is.

### §10.4 Open recommendations the proposal explicitly does not make

- Building an Aneeta-side workflow (G13). The constraint is named; the build is an Alton+Aneeta conversation, not a synthesizer call.
- Refreshing MASTERPLAN (G15). Phase-2 is the right time-window; the rewrite needs Alton's strategic input.
- Constitution v0.6 amendments (A38, A39, A40 excised). The v0.6 effort is its own project with its own greenlight cycle.
- AZ Compliance posture on local AZ-work-product storage (Q6). Foreclosed at repo level by `.gitignore`; remaining question is Alton↔AZ-Compliance.

---

## History

- 2026-05-06 (Wave 5, opus-4.7, fresh context): PROPOSAL-FINAL.md produced. Anti-pattern §9 from PROPOSAL.md removed; concessions absorbed structurally. All 41 charges addressed with revise/decline/defer per §11. Three hard-stops (Charges 1, 5, 6) addressed via §1 framing rewrite, A4a ratification commitment, and A31* joint OAuth diagnostic. Status: ready-for-alton-greenlight on Phase 2 dispatch.

## §11 Charge-by-charge response

Each charge gets one of: **(a) revise** (substance changed in §1-§8), **(b) decline** (rejected with cited evidence), **(c) defer** (gating prerequisite named). "Acknowledged" without one of these is not a valid response.

### Cluster A — framing failures

**C1 — 5-layer architecture is hypothesis-treated-as-ratified.** [hard-stop] **(a) revise.** §1 has been rewritten to downgrade the 5-layer model from "target architecture" to "useful taxonomy for talking about the current state." The proposal now operates under a hybrid frame: layer-talk is permitted as shorthand, but no Wave-A action is justified by "fits the layer model." Each Wave-A consolidation is justified by a specific friction the audit measured, not by layer-conformance. The three load-bearing layer-assumptions the observer named (depth-as-organizing-primitive, top-down-detail-flow, hearth-as-Layer-3) are explicitly addressed in §1: depth is not the organizing primitive (hub-and-spoke + auto-injection is); detail-flow runs both ways (source-docs are the most concrete substrate, not derived from deep memory); hearth is not in the layer hierarchy at all (already in PROPOSAL §1; reasserted here as a ratified call). A Phase-1.5 "architecture-defense" step is **not** added — the audits are already architecture-agnostic on their findings; what Phase 2 needs is to stop importing the layer frame as a constraint on consolidation. See revised §1.

**C2 — "Uplift" framing is unexamined.** [requires-revise] **(a) revise.** §1 now opens with an explicit statement: "This proposal holds two framings simultaneously. Mechanical defects (broken links, truncated MEMORY.md, dead `skills/` dir) are uplift-framed and fast-tracked. Structural rearrangements (consolidating family locations, enforcing canonical placement) are evolution-framed and require evidence the current arrangement is not doing useful work before being mutated." A15 (FAMILY.md trim), A16 (build `_history/`), A17 (Amarkanth move) are re-examined under evolution-framing in §1; they survive because the audit already showed the current arrangement violates its own convention (FAMILY.md is 385 lines, convention says ≤200; active-todos.md is 1,350 lines, convention says ≤250) — the consolidation is the convention catching up to its own rule, not an external uplift overruling local adaptation.

**C3 — Audit nuance softened in synthesizer aggregation.** [requires-revise] **(a) revise.** §0's "less coherent than it could be" hedge is replaced with the audit's own language. A1 row is re-tagged as **P0** to preserve the MEMORY-AUDIT severity that was lost. The general rule for §1-§8: when an audit named a P-rating or VERY-HIGH-ROI tag, that tag is preserved in the action row, not flattened to "30 min."

**C4 — §9 is pre-emptive defense, not engagement.** [requires-revise] **(a) revise.** §9 is **deleted**. The seven concessions have been absorbed structurally: §9.1 (sprawl) — action count reduced where appropriate, see §2; §9.2 (timing) — Wave-A re-arithmetic'd in §7; §9.3 (A1 verify-step) — A1 row updated; §9.4 (A10 split) — A10 split into A10a/A10b; §9.5 (deferrals) — A36 given explicit deprecation criterion; §9.6 (A38-A40 scope) — routed to a separate `projects/constitution-v06-DRAFT.md` track via §2 marker; §9.7 (Drive-MCP-as-blocker) — replaced by joint OAuth diagnostic per Charge 6.

### Cluster B — observer-raised charges PROPOSAL did not engage

**C5 — Ratification mechanism is broken.** [hard-stop] **(c) defer with explicit gating.** §1 adds a new sub-section "Ratification status check" that names the chronic dead-letter pattern (CONVENTIONS unratified 11 days, MEMORY.md.proposed unmerged 4 days, v0.4 leapfrogged, two `MEMORY-history/*.md.proposed` unmerged). A1 and A4 are explicitly downgraded to **calendared Alton commitments** that gate Phase-2 dispatch. New action **A4a (Wave A prerequisite, P0)**: Alton blocks 60 min on a specific date *this week* to (i) ratify CONVENTIONS.md, (ii) `mv MEMORY.md.proposed MEMORY.md`, (iii) decide on the `.proposed` convention's future per A19. Without A4a landing, no other Wave-A action ships. The synthesizer rejects building a curator-driven adoption mechanism as the primary fix because (a) it adds throughput pressure on the bottleneck the system already has (Charge 7), (b) the four pending drafts have different shapes and a generic adoption rule would mis-handle some of them. A19 is preserved as the longer-term fix decision (drop the convention vs. add a 7-day curator surface), but A4a is the unblock-this-week action.

**C6 — Drive MCP + Gmail silence likely share OAuth root cause.** [hard-stop] **(a) revise.** A31 ("Diagnose Drive MCP") and the Gmail silent-failure G3 are consolidated into new action **A31* (P0 prerequisite)**: a single 30-minute OAuth-state diagnostic on Rocinante covering Gmail, Calendar, Drive MCPs simultaneously. Outputs: token age per service, refresh cadence, observed failures since 2026-05-02, and a written hypothesis distinguishing "Rocinante-wide auth degradation" from "service-specific MCP issues." A31* runs **before** A3 (Gmail cron build) and A32 (Drive cron build). Watchdog architecture revised in A3 per Charge 24: alert path is **cross-routed to gpuserver1's existing hourly heartbeat surface** so a Rocinante-wide failure does not silence both watched-cron and watchdog. New constraint **C13** in §5 codifies "no Google-MCP-mediated cron ships before A31* lands."

**C7 — Curator throughput problem named (A10) but not sized.** [requires-revise] **(a) revise.** New §1 sub-section "Curator throughput" sizes the ratio: ~90 ce-* files/month inbound, ~0/month curator output (last drain was 2026-04-19, 58 items; backlog grew from ~58 to 236 in 17 days). Phase 2's proposed crons (A3, A32, A37) add ~50-150 events/day to `data/inbox-stream/`; even with dashboard-as-passive-renderer, the proposed-memories pipeline keeps producing. The proposal adopts **option (a) input-rate reduction + option (d) retention/expiry** as the combined fix:
- A10 split into **A10a (drain backlog to `inbox/.drained/2026-05-06/`)** and **A10b (tighten extractor filters per the 2026-04-19 recommendation never executed: drop `feedback_rule`/`feedback_permission`/`imperative` categories)**.
- New **A10c**: retention rule for `data/inbox-stream/` and `inbox/.../proposed-memories/` — anything older than 30 days auto-archives to `_archive/<YYYY-MM>/`, no human triage required.
- New **A10d**: curator-queue-depth visibility — daily count of unprocessed `inbox/*/proposed-memories/*` lands in `data/inbox-stream/health-<date>.jsonl` so the bottleneck is felt rather than buried.

**C8 — Dashboard rename hedge.** [requires-acknowledge] **(b) decline charge framing, (a) revise §4.** The observer's argument (Foyer/Loom/Almanac all fight the live-state spec; MERIDIAN actually matches) is correct on the merits. §4 is rewritten: synthesizer position is **keep MERIDIAN**. The PROPOSAL.md "no position, but Loom is right" construction violated communication-style rules and is removed. Alton can override; the synthesizer does not endorse Loom.

**C9 — Aneeta engineering-side asymmetry.** [requires-revise] **(a) revise.** New §6 G13 (was §3 Q8 + §6 G10): "The proposed Phase-2 work makes the system more sophisticated for Alton without addressing Aneeta's path-into-the-system. A29 (stub `family/aneeta.md`) closes the *destination-file* asymmetry; it does not close the *workflow* asymmetry (no Aneeta-side onboarding, no aneeta-side morning briefing, no aneeta-peer machine setup). This is a Phase-2 *constraint*, not a Phase-2 *action*: the synthesizer is not recommending the household reorganize principalship balance; that is an Alton+Aneeta conversation. But Phase-2 actions must not deepen the asymmetry where avoidable." Concrete operationalization: every new cron's output landing in `data/inbox-stream/` must use neutral framing, not Alton-as-implicit-reader; the dashboard-rendering work in A34 should design with two-user access in mind even if only one user logs in this quarter.

**C10 — Synthesizer reading from inside the shaping.** [requires-acknowledge] **(a) revise.** New §0a paragraph: "This proposal is written by an opus-4.7 instance reading sources mostly authored or directed by Alton, audited by sibling opus instances dispatched by Alton, and inhabited by Wave-2 readers who shared the substrate. Convergences in the audit-and-inhabitant set may partly reflect shared frame, not shared evidence. Mitigations the proposal employs: (i) empirical measurements (file sizes, mtimes, broken-link counts, run-cadence histograms) are weighted above qualitative reports about register-installation; (ii) where an audit and an inhabitant agreed, the proposal cites the audit; (iii) the dialogue-pair's triennial outside-evaluation mechanism (A40) is preserved as the structural protection against this failure mode at version-scale; (iv) for this round, no separate hearth-blind sanity check was run — that gap is owned in §6." This is the §0a Charge 41 also requested.

**C11 — Texts-ingest "load-bearing risk" reframing not folded in.** [requires-revise] **(a) revise.** A36's evidence column gains: "If reactivated at 30-day revisit, the build is a *privacy-architecture construction project for a surface where filters can fail irreversibly*, not a privacy-policy authoring exercise. The §5.6 tab-pollution structural risk dominates the other four reasons in the original audit. See OBSERVER-NOTES #6." A36 also gains an explicit **deprecation criterion** (per §9.5 split-verdict): "if at 30-day revisit no privacy-architecture has been designed *and* no Aneeta-consent question has been answered, deprecate texts-ingest as a Phase-2 candidate; revisit only on Alton-initiated re-request."

### Cluster C — PROPOSAL-internal inconsistencies

**C12 — A1 effort missing the verify-step.** [requires-revise] **(a) revise.** A1 row updated to: "30 min execution + 15 min spot-check pass against 2026-05-02 daily log to confirm no load-bearing facts dropped from the trim. If discrepancy found, +30-60 min reconciliation. Total budgeted: 45-90 min." The verify-step is now part of A1, not external.

**C13 — A4 silently bundles invariants.** [requires-revise] **(a) revise.** A4 row now enumerates: "Ratifies CONVENTIONS.md as written *plus* invariants I-3, I-4, I-5, I-10. **Defers** invariants I-1, I-2, I-6, I-7, I-8, I-9 to Wave A operationalization (I-7 lands via A16, I-8 lands via A29; I-1, I-2, I-6, I-9 are observed-but-not-enforced for the initial ratification and become enforceable when their automation lands)."

**C14 — A6 wikilinks count unverified.** [minor] **(a) revise.** A6 row updated: "Update inbound wikilinks (count to be verified at execution; LINKS-AUDIT enumerates broken-link clusters but `hearth/family` was not currently broken — rename will create new broken-links to fix). Effort: 5 min rename + 10 min wikilink sweep + 5 min wiki.py --broken verification = 20 min total."

**C15 — A9/A10 timing arithmetic does not add up.** [minor] **(a) revise.** §7 Wave-A arithmetic redone honestly: A4a (60 min) + A1 (45-90 min) + A6 (20 min) + A7 (15 min) + A8 (30 min) + A21 (10 min) + A22 (5 min) + A23 (5 min) + A24 (5 min) + A26 (10 min) + A11 (20 min) + A20 (20 min) + A29 (10 min) + A5 (30 min) = ~4.5h before getting to A9 (60-90 min) + A10a/b/c/d cluster (~2-3 h) + A15 (30-45 min) + A16 (60 min) + A17 (15 min) + A18 (30 min) + A19 (30 min) + A12 (60 min) + A28 (60 min). **Total Wave A ≈ 11-13 h, spilling across 2-3 evenings.** §0 "if you only do three things" stays; the "fits in a single evening" claim is removed.

**C16 — A33 sequencing inconsistency.** [requires-revise] **(a) revise.** A33 (`data/inbox-stream/` directory creation) is renumbered to **A2.5** in §2 to reflect that it is a Wave-C *prerequisite* that must land before any cron writes to that path. §7 Wave-C sequence now reads: A31* → A2.5 → (A3 ‖ A32-design) → A32 → A37 → A34. The numeric position in §2 was the source of confusion; renumbering fixes it.

**C17 — A2 wording: "update" should be "correct."** [minor] **(a) revise.** A2 row updated: "Correct CLAUDE.md scheduled-tasks table (currently lists wiki-reindex as nightly; that's false until A2 lands)."

**C18 — A12 generator unverified.** [minor] **(a) revise.** A12 reframed: "1h investigation + fix. Step 1: identify which script (likely `wiki.py`, possibly extinct cron) emits the `[FILE](FILE) — ---` pattern. Step 2: if generator exists, patch. Step 3: if generator does not exist (file is hand-written or stale-from-extinct-cron), regenerate INDEX.md once and add a TODO to MEMORY-CONVENTIONS about INDEX maintenance."

**C19 — A19 vs A1 framing inconsistency.** [requires-acknowledge] **(a) revise.** A1 evidence column gains: "Per A19, this is the first instance of the by-hand `.proposed` adoption pattern, not a precedent for keeping the convention. A19's recommendation (drop the convention after the 3 currently-pending files are resolved) is the long-term move."

**C20 — §0 "if you only do three things" reasoning collapses.** [minor] **(a) revise.** §0 reframed: "A1 is the highest-leverage of the three because it un-truncates the auto-injected context every future session uses. A2 is the cheapest (15 min) and unblocks every consumer of the wiki indexes. A3 is the longest-tail risk-closer (signed contracts in the silent-window are real money). If only one ships this week, A1 is right because it has compounding read-multiplier effect across all subsequent sessions."

**C21 — §3 questions duplicate actions.** [minor] **(a) revise.** §3 retitled "Open questions and synthesizer recommendations" and split: Q1-Q4 (resolved-by-actions, retained as cross-reference) move to a sub-section "Resolved by §2 actions"; Q5-Q9 (genuinely open) stay as primary content.

### Cluster D — hidden costs and missing risk surfaces

**C22 — Ongoing token cost not sized.** [requires-revise] **(a) revise.** New section **§7a "Ongoing cost estimate"** added after sequencing:
- gmail-family-relevance-scan (every 2h, 12 runs/day, ~$0.05-0.15/run sonnet): $18-55/month
- gmail-liveness-watchdog (every 30 min, 48 runs/day, ~3 turns each haiku): $5-15/month
- drive-recent-changes-scan (nightly, similar to gmail per-run): $1.50-4.50/month
- drive-liveness-watchdog (every 4h, 6 runs/day haiku): $1-3/month
- attachment-router (event-driven, ~5-10 events/day sonnet): $5-20/month
- wiki-reindex (nightly, no API): $0
- Total Phase-2-induced ongoing: **~$30-100/month**, with sonnet/haiku tier mix the dominant cost lever.

**C23 — Watchdog alert-fatigue surface not sized.** [requires-acknowledge] **(a) revise.** §7a also adds: "Phase 2 ends with ~5 watchdog-bearing crons. Mitigation: alerts roll up into the daily `daily-household-health` Calendar event rather than firing per-cron. The watchdog's job is to write `data/inbox-stream/health-<date>.jsonl` with severity; the existing 5:30 AM daily-household-health closer aggregates and pings Alton once per day at yellow+ severity. Per-cron immediate-page paths exist only at red severity (red = Rocinante-wide auth failure or data-loss event)."

**C24 — Watchdog single-OAuth failure mode.** [requires-revise] **(a) revise.** A3 row updated: "Watchdog alert path is *cross-routed* to gpuserver1's existing hourly heartbeat surface (`inbox/gpuserver1/_heartbeat.md`). Implementation: gmail-liveness-watchdog writes BOTH (i) local `data/inbox-stream/health-<date>.jsonl` for the daily-household-health closer AND (ii) SCP-pushes a one-line `gmail-liveness-<utc>.txt` to `alton@192.168.1.100:~/sartor/inbox/rocinante-watchdog/`. gpuserver1's hourly stale-detect.sh inspects that directory; if no file in last 4h, gpuserver1's heartbeat surfaces a peer-machine alert that Rocinante's auth state cannot suppress. Same architecture applies to drive-liveness-watchdog when A32 lands."

**C25 — A33 gitignore work already done.** [minor] **(a) revise.** A33 (now A2.5) effort revised from "10 min" to "5 min": "Verified: `.gitignore` line 24 already excludes `data/` recursively. Action is: create empty directory + write README documenting the cron-write convention. No gitignore change needed."

**C26 — AZ Compliance gitignore mitigation not cited.** [requires-acknowledge] **(a) revise.** New constraint **C13** (renumbered from §5) cites: ".gitignore line 73 already excludes `sartor/memory/source-documents/` from commits, foreclosing the observer's worst-case (AZ paths leaked to GitHub mirror). The exclusion was added by inspector-source-docs during Wave-1 audit. AZ Compliance review (Q6) is a *separate* question about local-machine storage, not about repo state." §3 Q6 footnote points at C13.

### Cluster E — scope, ratification, routing

**C27 — A38, A39, A40 are Constitution-side in a Memory-uplift proposal.** [requires-revise] **(a) revise.** A38, A39, A40 are **excised from §2** and routed to a placeholder file `projects/constitution-v06-DRAFT.md` referenced in §6 G14. The §2 Wave-E row now contains only A35 (typed-wikilinks defer/deprecate) and A36 (texts-ingest defer/deprecate). The dialogue-pair's request to "surface for Wave 4 critic" is satisfied by Charge 27 having seen them; their persistence in PROPOSAL-FINAL would have been the routing error. Action count drops from 40 to 37 (and net to ~42 after A4a, A10b/c/d, A2.5, A31* additions).

**C28 — A40 spec is underdesigned.** [requires-revise] **(c) defer.** A40 is now in `constitution-v06-DRAFT.md` (per C27). The spec-design work (load-with-what-context, what-artifacts, success-criterion) is owned by that draft, not this proposal. If/when v0.6 effort dispatches, A40's spec-depth becomes its own work item there.

**C29 — A28 misrouted to "Curator."** [requires-revise] **(a) revise.** A28 owner changed from "Curator" to "Operator (script + run)" — the work is automated batch-frontmatter, not curator judgment.

**C30 — A18 routes hearth content into the throughput-constrained inbox.** [requires-revise] **(a) revise.** A18 now specifies: "hearth-candidate items get a *separate* shorter queue at `inbox/rocinante/hearth-candidates/` (not the main proposed-memories backlog). Curator triages within 7 days OR auto-discards. The smaller queue has different bottleneck dynamics than the 236-deep main backlog." This avoids dumping a new category into the same throughput failure A10 is supposed to drain.

**C31 — A21/A22 grouped as identical mechanical actions.** [minor] **(a) revise.** A22 re-tagged "Alton — judgment (5 min decide + 5 min execute)" because the file's `awaiting human curation` text deserves a one-shot Alton read before delete.

**C32 — A13 effort wrong.** [minor] **(a) revise.** A13 effort revised: "4-6 h operator + 1-2 h Alton review checkpoints (per-bundle approval for tax docs containing SSNs/banking)."

### Cluster F — omitted layers / failure modes / domains

**C33 — log.md 143KB auto-injection status not addressed.** [requires-revise] **(c) defer with explicit gating.** New action **A41 (Wave A pre-step, 10 min)**: "Verify `log.md` does NOT auto-inject into Claude Code sessions. Method: inspect `.claude/settings.json`, `.claude/CLAUDE.md`, and `~/.claude/projects/C--Users-alto8/CLAUDE.md` for any reference. Expected outcome: log.md is read-on-demand, not auto-loaded; if so, no further action and §1 Layer-1 sub-section gains a sentence noting the verify-step landed clean. If log.md *is* auto-loading, the 143 KB problem dwarfs MEMORY.md and A1's value diminishes — escalate immediately and trim log.md before A1." Charge 33 is right that A1 is not the largest load problem if log.md auto-injects; this verify gates A1.

**C34 — Constitution v0.5 size (168 KB) not size-audited.** [requires-acknowledge] **(a) revise.** §1 Layer-3 sub-section gains: "HOUSEHOLD-CONSTITUTION v0.5 is 168 KB, the largest non-research file in the corpus. It is read-on-demand (not auto-injected; verified by absence in `.claude/settings.json` auto-load list). Size is not a Phase-2 problem; flagged here for completeness."

**C35 — `__pycache__/` charge.** [minor] **(b) decline.** Critic itself notes the gitignore line 40 already handles this. No action.

**C36 — MASTERPLAN.md and MASTERPLAN-VISIONARY.md staleness.** [requires-acknowledge] **(c) defer.** New §6 G15: "MASTERPLAN.md last content-update 2026-02-06 (per MEMORY-AUDIT). Phase 2 is the right time to refresh it, but a strategic-doc rewrite is its own scoped effort, not a Wave-A consolidation item. Defer to a separate `projects/masterplan-refresh-2026-Q2/` track. Block: Alton's strategic input — synthesizer cannot rewrite MASTERPLAN without Alton's intent statement."

**C37 — Retention policy missing.** [requires-revise] **(a) revise.** A2.5 row gains retention rule: "Files in `data/inbox-stream/` older than 30 days auto-move to `data/inbox-stream/_archive/<YYYY-MM>/`. Implementation: nightly cron (~5 lines bash, fold into `wiki-reindex` task per A2). Same rule applies to `inbox/*/proposed-memories/*` per A10c." Retention is part of A2.5, not a separate action.

### Cluster G — confidence / hedge / register

**C38 — §0 "less coherent" hedge.** [minor] **(a) revise.** §0's first sentence rewritten to audit-language sharpness. See §0.

**C39 — A38, A39, A40 listed as least-confident but still in table.** [requires-revise] **(a) revise.** Resolved by C27 (excised). The synthesizer-position the §9 charge-39 demanded is taken: **out-of-scope-for-Phase-2, routed to a separate v0.6 track.**

**C40 — §3 "Synthesizer recommends:" flatness.** [minor] **(a) revise.** §3 rewritten with differentiated language register: Q1-Q4 use "yes, do this" or "yes, deferred via [action]"; Q5-Q9 use "low-confidence note, see [ref]" or "Alton-judgment-required, no synthesizer position." See §3.

**C41 — §0 missing read-from-inside-shaping note.** [requires-acknowledge] **(a) revise.** Resolved by C10's §0a paragraph addition.

---

**Summary of revisions to action set:**
- Net new: A4a (ratification commitment), A2.5 (formerly A33, renumbered), A31* (joint OAuth diagnostic), A10a/b/c/d (split + retention + visibility), A41 (log.md verify)
- Excised to v0.6 track: A38, A39, A40
- Re-scoped: A1 (verify-step in row), A4 (invariant scope explicit), A22 (judgment-tag), A28 (operator-tag), A18 (separate queue), A13 (Alton-checkpoint hours)
- Re-positioned in §2: A33 → A2.5

Total Phase-2 actions: **~39**, with 5 marked P0 prerequisites (A4a, A1, A2.5, A31*, A41) that gate everything else.
