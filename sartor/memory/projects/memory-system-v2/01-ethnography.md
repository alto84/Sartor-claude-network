---
type: research
entity: memory-system-v2-ethnography
phase: explore
updated: 2026-04-12
author: ethnographer (memory-system-v2 team)
status: complete
related: [memory-system-v2, MEMORY-CONVENTIONS, MULTI-MACHINE-MEMORY]
---

# Memory System V2 — Phase 1A Ethnography

Read-only walk of `sartor/memory/` performed 2026-04-12 by the ethnographer agent on team `memory-system-v2`. No files were modified outside `projects/memory-system-v2/` and `.scratch/`.

## Executive summary

The Sartor memory wiki is **152 markdown files / ~362K words / mean 2,383 words/file**. It is structurally healthier than expected on link integrity (only **9 files with truly dangling wikilinks**, almost all placeholder text in convention docs) and structurally weaker than expected on **frontmatter discipline** (33% of files have no frontmatter; 12% more have frontmatter but no `updated:` field). The wiki is in a transitional state: a strong core of "canonical" capital-letter pages from the early Feb 2026 build that have not been touched in 65 days, plus a fast-moving cluster of operational pages added 2026-04-07 onward that are well-curated but not yet linked back into the core.

The biggest **content** problem is contradiction across vintages, not staleness in isolation. The wiki contains both the pre-cleanup view of gpuserver1 (15 cron jobs, vastai-tend.sh active, gateway_cron.py running) and the post-cleanup view (5 jobs, 10 deprecated 2026-04-12) — and the older docs are not annotated as superseded. A reader who lands on `reference/gpuserver1-monitoring.md` will be told that vastai-tend.sh "still writes to ~/.vastai-alert" when in fact it was renamed `.deprecated-2026-04-12` yesterday.

The biggest **structural** problem is **orphaning**: 32 high-value pages (excluding daily logs, inbox, feedback, constitution-council internal cluster, and the safety-knowledge-graph internal cluster) have **zero inbound wikilinks**. This includes every page added in the last week of fast-paced operations work (`reference/AGREEMENT-SUMMARY`, `reference/LOGGING-INDEX`, `business/rental-operations`, `family/active-todos`, `reference/OPERATING-AGREEMENT-DRAFT-*`, `reference/vastai-dispatch-wrapper-proposal`) and the entirety of the `reference/gpuserver1-*.md` cluster.

Recommendation for Phase 2: stop writing new pages until the canonical hub pages (MACHINES.md, BUSINESS.md, MASTERPLAN.md, PROCEDURES.md) are refreshed with both `updated:` bumps and inbound link updates pointing to the new operational pages. The system has been generating new memory faster than it has been wiring it in.

## Inventory stats

| Metric | Value |
|--------|------|
| Total `.md` files | 152 |
| Total words | 362,279 |
| Mean words/file | 2,383 |
| Files with no YAML frontmatter | 50 (33%) |
| Files with frontmatter but no `updated:` field | 18 (12%) |
| Files with `updated:` >60 days old | 4 |
| Truly dangling wikilinks (placeholders excluded) | 16 across 9 files |
| Files with zero inbound wikilinks (raw) | 99 |
| Probable-true orphans (excluding daily/inbox/feedback/cluster-internal) | 32 |
| Files touched in last 7 days (by `updated:` or git mtime) | 102 |

### Files by `type:` frontmatter value

| Type | Count |
|------|------|
| (none / no frontmatter) | 51 |
| reference | 18 |
| domain | 14 |
| person | 11 |
| feedback | 10 |
| cross-review | 10 |
| review | 10 |
| meta | 8 |
| project | 4 |
| machine_operations | 2 |
| machine_identity | 2 |
| event | 2 |
| proposal | 2 |
| (other singletons) | 8 |

The schema in `reference/MEMORY-CONVENTIONS.md` defines a controlled vocabulary, but actual usage has diverged: `inbox`, `completion_report`, `diff`, `synthesis`, `operations_triage`, `open-questions`, `cross-review`, and `proposal` are all in active use without being formally defined. This is not necessarily wrong — the schema is permissive — but it means downstream tooling that branches on `type:` will silently miss most of the recent operational pages.

### Hub nodes (top 10 by inbound wikilink count)

| File | Backlinks |
|------|-----------|
| ALTON.md | 44 |
| FAMILY.md | 31 |
| MACHINES.md | 23 |
| BUSINESS.md | 18 |
| TAXES.md | 18 |
| ASTRAZENECA.md | 14 |
| PROCEDURES.md | 12 |
| reference/MULTI-MACHINE-MEMORY.md | 10 |
| LEARNINGS.md | 10 |
| SELF.md | 10 |

These are exactly the original Feb-2026 capital-letter pages plus MULTI-MACHINE-MEMORY (added during the 2026-04-07 architecture rewrite). Note that **none** of the new sub-pages under `business/`, `family/`, `machines/gpuserver1/`, or the new `reference/gpuserver1-*` cluster appear in the top 10 — the hubs are all old and the new content is leaf.

## Staleness findings, ranked by severity

### Severity 1: stale + still authoritative + linked from many places

**`MACHINES.md`** — `updated: 2026-02-06`, **65 days stale**, 23 inbound links.

This is the canonical hardware inventory. Three concrete problems:

1. Lists `vastai-tend.sh` and the 2-hour cron behavior as current state. The 2026-04-12 cron-cleanup deprecated this script (renamed to `.deprecated-2026-04-12`) and replaced it with `run_monitor.sh`. MACHINES.md never mentions `run_monitor.sh`.
2. Documents `~/.vastai-alert` as the canonical alert file. Same deprecation.
3. Lists "Open Questions" that include "Should we add gpuserver1 SSH key to GitHub for direct push?" — answered "no" by the OPERATING-AGREEMENT (drafted 2026-04-12) which establishes Rocinante as sole git authority and gpuserver1 as inbox-write-only.

Severity is high because 23 other pages link here for ground truth on the machines.

**`MASTERPLAN.md`** — `updated: 2026-02-06`, **65 days stale**, 9 inbound links.

The "What Exists Today" table is from the early-Feb scaffolding. It does not mention: the 2026-04-07 multi-machine memory rewrite, the operating agreement, the inbox pattern, the curator architecture, the household constitution, the constitution-council project, the safety-knowledge-graph build-out, the rental-operations split into `business/rental-operations.md`, or the cron cleanup. The "Phase 2 Architecture" diagram shows a `gateway.py`-driven cron loop that has since been disabled (`gateway_cron.py` deprecated 2026-04-12 with JSON parse failures).

`MASTERPLAN.md` has a `next_review: 2026-04-15` field that is **3 days from today** — the file expects to be reviewed and is overdue.

**`PROCEDURES.md`** — `updated: 2026-02-06`, **65 days stale**, 12 inbound links.

The "Key Facts" still say "Git push must happen from Rocinante (has credentials)" — this remains true, but the file does not mention the inbox/curator pattern, the operating agreement, or the new monitoring pipeline. A new agent reading PROCEDURES.md will believe the only inter-machine workflow is `ssh alton@192.168.1.100 + git push`, missing the entire 2026-04 architecture.

**`MASTERPLAN-VISIONARY.md`** — `updated: 2026-02-06`, **65 days stale**, 1 inbound link. Lower severity (1 inbound link, aspirational doc).

### Severity 2: contradicts known ground truth on gpuserver1

**`reference/gpuserver1-monitoring.md`** (`updated: 2026-04-11`, only 1 day old by frontmatter — this is the trickiest one)

Quote from line 156–162:

> ## Interaction with existing systems
> - **vastai-tend.sh** (cron `30 */2`) — unchanged. Still writes to `~/.vastai-alert` and `~/.vastai-tend.log`. This monitor reads both.
> - **gateway_cron.py** (cron `*/30`) — unchanged. Its failures are surfaced by this monitor if they affect health.
> - **GATHER/EVOLVE/CONSOLIDATE mirrors** — unchanged. The `0 */4` gather mirror pulls the repo; this monitor relies on that fresh checkout.
> - **memory-sync.sh** and **heartbeat-watcher.sh** — unchanged.

**Ground truth** (per `inbox/gpuserver1/cron-cleanup/2026-04-12_cron-cleanup.md` and `machines/gpuserver1/CRONS.md` v0.2):

- `vastai-tend.sh`: DEPRECATED 2026-04-12, renamed to `vastai-tend.sh.deprecated-2026-04-12`, commented out in crontab.
- `gateway_cron.py`: DISABLED 2026-04-12, was failing every 30 min with `Expecting value: line 1 column 1 (char 0)`.
- `memory-sync.sh`: DEPRECATED 2026-04-12, archived to `archive/deprecated-crons-2026-04-12/`. Was failing with 1257 lines of git merge conflict errors.
- `heartbeat-watcher.sh`: DEPRECATED 2026-04-12, archived. 100% redundant with `gather_mirror.sh`.
- `consolidate-mirror` (autodream + decay): DISABLED 2026-04-12 per OPERATING-AGREEMENT §2 (memory consolidation is Rocinante-only).

The file is **literally one day stale** but on a fast-moving topic where one day matters. The frontmatter `updated:` field is misleading — it was last touched on 2026-04-11, before yesterday's cron cleanup.

**`reference/gpuserver1-operations.md`** (`updated: 2026-04-07`, 5 days stale)

Quote from the section on Claude Code project memory directories:

> Both are symlinked to `~/Sartor-claude-network/sartor/memory/` as of 2026-04-07 (see [[MULTI-MACHINE-MEMORY]])

I did not verify the symlink state on gpuserver1 from this Rocinante session, so this is "needs gpuserver1 confirmation" rather than known-stale. Flag for Phase 1C (alignment liaison).

**`MACHINES.md`** has the line:

> Pricing: Base $0.40/hr, MinBid $0.25/hr, end date 2026-08-24
> Reliability: 99.85%

The pricing matches `business/solar-inference.md` (also $0.40/$0.25) and is consistent with the v0.2 MISSION doc. **No contradiction on price.** What is missing is the **utilization context**: `business/solar-inference.md` states "**ZERO rentals**, earning $0.31/day storage only, balance $13.81 as of last check" (2026-04-09). MACHINES.md does not surface this — a reader of MACHINES alone would think the rig is generating revenue.

### Severity 3: Solar Inference contradictions

**`BUSINESS.md`** (`updated: 2026-04-09`) is the parent index for the three business tracks but contains contradictions with the deeper sub-pages added the same day.

Quote from BUSINESS.md line 56–58:

> **Infrastructure:**
> - vast.ai hosting: account alto84@gmail.com (Google OAuth), machine #52271 (RTX 5090), $0.25/hr base
> - API key configured on gpuserver1 (name: "gpuserver1"), CLI at `~/.local/bin/vastai`
> - Considering dual RTX PRO 6000 Blackwell ($17K hardware investment)

Three problems:
1. **"$0.25/hr base"** is wrong. Per `business/solar-inference.md` and `MACHINES.md`, $0.25/hr is the **min bid**, not the base. Base is $0.40/hr.
2. **"Considering dual RTX PRO 6000 Blackwell"** — per `MISSION.md` v0.2 and `projects/rtx6000-workstation-build.md`, the Blackwell workstation has moved from "considering" to "arriving this summer." It is now treated in MISSION.md as a known peer, not a hypothetical.
3. **Open Questions section still asks** "Solar Inference: Tesla Solar Roof timeline and financing status?" and "Solar Inference: vast.ai setup status?" — both answered comprehensively in `business/solar-inference.md` ($219K released 2026-03-15 to Lucent, install stalled, vast.ai live since 2026-02-26 but at zero rentals).

Quote from BUSINESS.md line 88–89:

> ## Recent Events
> - 2026-04-04: Machine #52271 (gpuserver1) reported offline by Vast.ai at 18:35 UTC. Status unverified. SSH check needed.

**Ground truth** per `business/solar-inference.md` line 67: "Recent incident: machine went offline 2026-04-04 (45 min inactive); no follow-up emails, likely recovered." The status is no longer "unverified" — it has been resolved as "transient outage, recovered." BUSINESS.md still flags it as an open item.

Quote from BUSINESS.md "Solar Inference LLC" section, line 53–54:

> $450,000 Tesla Solar Roof installation to power GPU computing operations

**Ground truth** per `business/solar-inference.md`: "Contract: $438,829 total." The $450K figure is rounded up by ~$11K and is the older estimate from initial planning. The exact contract value is now known.

### Severity 4: orphaned high-value content

These are pages with substantial content (>500 words), updated recently, but with **zero inbound wikilinks**. Without backlinks, they are unreachable by graph traversal — only by full-text search or knowing the path.

Top offenders (excluding daily logs, inbox, feedback, constitution-council internal cluster, safety-knowledge-graph internal cluster):

| Path | Updated | Words | Note |
|------|---------|------|------|
| `reference/AGREEMENT-SUMMARY.md` | 2026-04-12 | 1,017 | Operating agreement summary, fresh, nothing links to it |
| `reference/LOGGING-INDEX.md` | 2026-04-12 | 1,311 | Authoritative logging map, fresh, nothing links to it |
| `reference/OPERATING-AGREEMENT-DRAFT-GPUSERVER1.md` | 2026-04-12 | 3,972 | Major governance doc, orphan |
| `reference/OPERATING-AGREEMENT-DRAFT-ROCINANTE.md` | 2026-04-12 | 4,054 | Major governance doc, orphan |
| `reference/HOUSEHOLD-CONSTITUTION-v0.1.md` | 2026-04-11 | 5,232 | Versioned constitution, orphan (the v0.2 successor `HOUSEHOLD-CONSTITUTION.md` has 4 inbound links) |
| `reference/gpuserver1-monitoring.md` | 2026-04-11 | 1,397 | Architecture doc for the monitoring system, orphan |
| `reference/gpuserver1-power-logging.md` | 2026-04-11 | 1,058 | Power-logging architecture, orphan |
| `reference/gpuserver1-operations.md` | 2026-04-07 | 417 | Disk-management gotchas, orphan |
| `reference/gpuserver1-delegation.md` | (no fm) | 396 | Delegation pattern, orphan |
| `reference/vastai-dispatch-wrapper-proposal.md` | 2026-04-12 | 1,098 | Proposal for vastai CLI wrapper, orphan |
| `reference/rocinante-working-tree-triage-2026-04-12.md` | 2026-04-12 | 2,772 | Triage report from today, orphan |
| `reference/reference_vastai_market_pricing.md` | (no `updated:` field, despite MEMORY.md claiming it was added 2026-04-11) | 296 | Market-pricing reference, orphan |
| `business/rental-operations.md` | 2026-04-11 | 1,302 | New domain page split out from BUSINESS, orphan |
| `business/az-career.md` | 2026-04-09 | 745 | Linked from BUSINESS.md but as `[[business/az-career\|AZ Career Track]]` — wikilink target is path-style which my tool resolves correctly but several other agents would likely write as `[[az-career]]`. Edge case worth noting. |
| `family/active-todos.md` | 2026-04-12 | 1,876 | High-traffic todos list updated daily, orphan |
| `family/disney-july-2026.md` | 2026-04-10 | 1,180 | Trip plan, orphan |
| `ledgers/kids.md` | 2026-04-10 | 426 | Kids ledger, orphan |
| `people/ilan-grunwald.md` | 2026-04-10 | 237 | New person dossier, orphan |
| `research/ccp-alignment/mini-lab-2026-04-11/MINI-LAB-REPORT.md` | (no fm) | 22,881 | **Largest single file in the wiki**, no frontmatter, no inbound links |
| `skills/gpuserver1-market-pricing/SKILL.md` | (no `updated:`) | 1,816 | Skill definition, orphan |
| `machines/gpuserver1/MISSION.md` | 2026-04-12 | 2,935 | The v0.2 mission, orphan (only the deprecated v0.1 file references it via `supersedes:` frontmatter, which is not a wikilink) |
| `machines/gpuserver1/MISSION-v0.1.md` | (no `updated:`) | 4,548 | Superseded but not annotated as such in body text |
| `research/pharmacovigilance/cell-therapy-safety-monitoring-lifecycle.md` | (no fm) | 7,928 | Major research doc, orphan |
| `research/pharmacovigilance/graph-based-safety-prediction-research.md` | (no fm) | 4,287 | Major research doc, orphan |

The pattern: **everything written after 2026-04-07 is orphaned**. The wiki has been operating in append-mode without updating the link graph in the canonical hub pages.

### Severity 5: missing frontmatter on substantive files

50 files have no frontmatter. Most are daily logs (which is acceptable per the convention) and inbox files (also acceptable as queue items). The substantive offenders are:

| Path | Words | Type by content |
|------|------|-----------------|
| `research/ccp-alignment/mini-lab-2026-04-11/MINI-LAB-REPORT.md` | 22,881 | research / project report |
| `research/pharmacovigilance/cell-therapy-safety-monitoring-lifecycle.md` | 7,928 | research |
| `research/pharmacovigilance/graph-based-safety-prediction-research.md` | 4,287 | research |
| `reference/gpuserver1-delegation.md` | 396 | reference |
| All `research/pharmacovigilance/safety-knowledge-graph/**` files | varies | (cluster lacks frontmatter universally; ~16 files) |

The safety-knowledge-graph cluster is consistent with itself but inconsistent with the rest of the wiki. It uses path-style relative links (`[[adverse-events/CRS]]`, `[[mitigations/tocilizumab]]`) that **do** resolve correctly when normalized — my initial dangling-link count of 290 was inflated by my tool not resolving path-style links. After normalization the truly dangling count drops to **16 placeholder links across 9 files**, almost all of which are example syntax in `MEMORY-CONVENTIONS.md`, `LLM-WIKI-ARCHITECTURE.md`, and feedback files (`[[FILE]]`, `[[wikilink]]`, `[[LINK]]`).

### Severity 6: duplicate coverage / overlap

| Page A | Page B | Overlap |
|--------|--------|--------|
| `reference/HOUSEHOLD-CONSTITUTION.md` | `reference/HOUSEHOLD-CONSTITUTION-v0.1.md` | Versioned successor — v0.1 should be either deleted or moved to an `archive/` subdir |
| `machines/gpuserver1/MISSION.md` | `machines/gpuserver1/MISSION-v0.1.md` | Same pattern. v0.2 has `supersedes: MISSION-v0.1.md` in frontmatter but v0.1 has no `superseded_by:` annotation |
| `reference/OPERATING-AGREEMENT.md` | `reference/OPERATING-AGREEMENT-DRAFT-GPUSERVER1.md`, `reference/OPERATING-AGREEMENT-DRAFT-ROCINANTE.md` | The two drafts may already be folded into the canonical `OPERATING-AGREEMENT.md`. If so, the drafts should be deleted or moved to drafts/ |
| `BUSINESS.md` (parent overview) | `business/solar-inference.md`, `business/sante-total.md`, `business/az-career.md` (deep sub-pages) | The overview was not refreshed when the sub-pages were added 2026-04-09 — see Severity 3 contradictions |
| `MACHINES.md` (parent overview) | `machines/gpuserver1/MISSION.md`, `machines/gpuserver1/CRONS.md` | Same pattern. MACHINES.md predates the deeper machine pages |
| `reference/gpuserver1-monitoring.md` | `machines/gpuserver1/CRONS.md` | Both describe the cron architecture; CRONS.md is post-cleanup truth, monitoring.md is pre-cleanup |

## Ground-truth contradictions catalog

Ranked by how confidently I can assert the contradiction.

### High-confidence contradictions

1. **`reference/gpuserver1-monitoring.md` line 156–162**: claims `vastai-tend.sh`, `gateway_cron.py`, `memory-sync.sh`, `heartbeat-watcher.sh` are all "unchanged." All four were deprecated/disabled 2026-04-12 per `inbox/gpuserver1/cron-cleanup/2026-04-12_cron-cleanup.md`.

2. **`BUSINESS.md` line 57**: "$0.25/hr base." Wrong — that is the **min bid**. Base is $0.40/hr per `MACHINES.md`, `business/solar-inference.md`, and `MISSION.md` v0.2.

3. **`BUSINESS.md` line 53**: "$450,000 Tesla Solar Roof installation." Actual contract value is $438,829 per `business/solar-inference.md` line 47.

4. **`BUSINESS.md` line 89**: "2026-04-04: Machine offline... Status unverified. SSH check needed." Resolved per `business/solar-inference.md` line 67 — "no follow-up emails, likely recovered."

5. **`MACHINES.md` line 60–67** (vast.ai hosting block): documents the pre-cleanup cron architecture without mentioning `run_monitor.sh` (installed 2026-04-11), `gather_mirror.sh`, `daily_summary.py`, `dashboard-healthcheck.sh`, or `run_pricing.sh` — all 5 currently-active P0 jobs per `machines/gpuserver1/CRONS.md` v0.2.

6. **`MASTERPLAN.md` "What Exists Today" table**: missing all 2026-04 architecture (multi-machine memory, inbox pattern, curator, operating agreement, household constitution, constitution-council, safety-knowledge-graph). The table is literally a snapshot of 2026-02-06.

7. **`MASTERPLAN.md` "Target Architecture" diagram**: shows `gateway.py` cron loop as the future. `gateway_cron.py` was disabled 2026-04-12 due to JSON parse failures per `inbox/gpuserver1/cron-cleanup/2026-04-12_cron-cleanup.md`.

### Medium-confidence (needs Alton or gpuserver1 confirmation)

8. **`BUSINESS.md` line 58**: "Considering dual RTX PRO 6000 Blackwell ($17K hardware investment)." `MISSION.md` v0.2 treats Blackwell as "arriving this summer." Either the decision was made and BUSINESS.md is stale, or MISSION.md is forward-projecting and BUSINESS.md is correct that it's still "considering." Needs Alton confirmation.

9. **`reference/gpuserver1-operations.md`**: claims symlinks were set up 2026-04-07 connecting `~/.claude/projects/-home-alton/memory/` and `~/.claude/projects/-home-alton-Sartor-claude-network/memory/` to the canonical wiki path. I cannot verify symlink state from Rocinante. Phase 1C (gpuserver1 alignment liaison) should confirm.

10. **`MACHINES.md` "Open Questions"**: "Should we add gpuserver1 SSH key to GitHub for direct push?" The OPERATING-AGREEMENT (drafted 2026-04-12, drafts in `reference/OPERATING-AGREEMENT-DRAFT-*.md`) appears to formally answer "no" but I have not read the canonical `reference/OPERATING-AGREEMENT.md` to confirm. If yes, MACHINES.md open-question should be removed.

### Low-confidence (informational drift only)

11. **`reference/gpuserver1-monitoring.md`** "first test run produced a dense ~4 KB report including a full first-run investigation of an orphaned container" — this is historical narrative from 2026-04-11, not a stale claim about current state. Acceptable as history.

12. **`MACHINES.md`**: lists "Claude Code v2.1.33" on gpuserver1. Likely correct but worth confirming. If a newer version is installed, this is harmless but should bump.

## Graph shape

### Hub-and-spoke topology

The wiki is sharply hub-and-spoke. Six pages account for **128 of the ~340 total wikilinks** in the system: ALTON (44), FAMILY (31), MACHINES (23), BUSINESS (18), TAXES (18), ASTRAZENECA (14). All six are 65–3 days old. The hubs are stable; the spokes are not.

The "second tier" hubs (10–12 inbound links each) are PROCEDURES, MULTI-MACHINE-MEMORY, LEARNINGS, and SELF. PROCEDURES is the only stale one of the four.

Below 10 inbound links the graph drops off sharply. Most pages have 0–2 inbound links. **The system has no "level 3" hubs** that organize specific subdomains — there is no `business/INDEX.md`, no `machines/INDEX.md`, no `reference/INDEX.md`. Each subdirectory is a flat list of leaves with no internal cross-linking.

### Probable-true orphans (32 pages, listed in Severity 4 above)

These are pages that **should** be reachable by graph traversal from a hub but are not. The most striking class is the `reference/gpuserver1-*.md` cluster: four pages of operational reference content, all with zero inbound links from any of the six top hubs. A new agent reading the wiki would only find them by full-text search.

### Orphan clusters that are probably fine

Two clusters legitimately have low backlink counts because they are internally cohesive and not meant to be entry points from the rest of the wiki:

- `research/ccp-alignment/constitution-council/**` — 19 files, all linking to each other (reviews + cross-reviews + DIFF + SYNTHESIS + OPEN_QUESTIONS). This is a self-contained project workspace.
- `research/pharmacovigilance/safety-knowledge-graph/**` — 16 files, all linking to each other via path-style wikilinks. This is a self-contained knowledge graph.

Both clusters need a single inbound link from a relevant hub (PROJECTS.md and ASTRAZENECA.md respectively) to be properly findable, but their internal structure is healthy.

### Bidirectional link asymmetry

`reference/MULTI-MACHINE-MEMORY.md` has 10 inbound links — high for a reference doc. But it does not appear in the `related:` frontmatter of MACHINES.md. The forward link pattern uses inline `[[MULTI-MACHINE-MEMORY]]` references, not frontmatter `related:` arrays. This is a divergence from the convention spec, which suggests both should be used.

## Surprising discoveries

1. **The link graph is healthier than I expected.** My initial dangling-link count of 290 was inflated by my tool not resolving path-style wikilinks (`[[adverse-events/CRS]]`). After fixing the resolver, only 16 truly dangling links remain, and 14 of those are placeholder syntax in convention documentation files (`[[FILE]]`, `[[LINK]]`, `[[wikilink]]`). The wiki's wikilink discipline is actually quite good.

2. **Frontmatter discipline is much worse than I expected.** 33% of files have no frontmatter at all. The convention spec in `reference/MEMORY-CONVENTIONS.md` is clear about what's required, but enforcement is nonexistent.

3. **`MEMORY.md` (the index file) is itself a stable pointer with a junction from the Claude Code auto-load directory.** This is unusual and worth understanding. It means the file is read on every Claude Code session start, so any drift here propagates immediately. Currently it claims `reference_vastai_market_pricing.md` was added 2026-04-11, but that file has no `updated:` field at all and is orphaned. Drift between the index and reality is already present.

4. **The constitution-council project is enormous and isolated.** 19 files, 8 personas reviewed twice each, plus DIFF/SYNTHESIS/OPEN_QUESTIONS, plus the two HOUSEHOLD-CONSTITUTION versions. This is a major artifact that the rest of the wiki barely references. PROJECTS.md should link to it as a top-level entry.

5. **`research/ccp-alignment/mini-lab-2026-04-11/MINI-LAB-REPORT.md` is the largest single file in the wiki at 22,881 words** but has no frontmatter, no inbound links, and `git_mtime` of 2026-04-11. It is invisible to anyone not specifically looking for it. The mini-lab is referenced as a "recent commit" in the team-lead briefing, so it's clearly important — but the wiki itself does not surface it.

6. **The safety-knowledge-graph cluster is structurally beautiful** — 16 files, dense internal cross-linking via path-style wikilinks, consistent format. But none of them have frontmatter, and the cluster has zero inbound links from outside. It is an island of high-quality content in the wiki.

7. **`MACHINES.md`'s `next_review: 2026-05-01`** field exists but `MASTERPLAN.md`'s `next_review: 2026-04-15` is **3 days from now**. There appears to be no mechanism to enforce these review dates. The convention defines them but no curator process consumes them.

8. **The `feedback/` directory contains 9 files**, but **`feedback_pricing_autonomy.md` lives at the wiki root**, not inside `feedback/`. This is the only feedback file with that placement, so it is structurally an outlier. (Per MEMORY.md, this is intentional — auto-loaded feedback rules are at root — but the convention is undocumented.)

9. **9 `gpuserver1-*` files exist** across `reference/`, `machines/`, `inbox/`, and `skills/`: gpuserver1-delegation.md, gpuserver1-monitoring.md, gpuserver1-operations.md, gpuserver1-power-logging.md, MACHINES.md (gpuserver1 section), CRONS.md, MISSION.md, MISSION-v0.1.md, gpuserver1-market-pricing/SKILL.md, plus inbox subdirectories. This is the most-fragmented entity in the wiki. A `machines/gpuserver1/INDEX.md` consolidating these would help.

10. **Only 4 files use the `event` type**, and `family-calendar.md` is one of them — but the `family/family-calendar.md` page has 3 inbound dangling-link references from other files trying to link to `family/family-calendar`. The file exists; the links resolve. But the path is referenced 3 separate times across the wiki, suggesting it is a frequent attractor.

## Open questions

1. **Should `MASTERPLAN.md` be rewritten or archived?** It is 65 days stale, has 9 inbound links, and its "Target Architecture" no longer matches reality. Phase 2 should decide: refresh in place, archive and write `MASTERPLAN-v2.md`, or split into smaller pages.

2. **What is the curator's role with respect to staleness?** The convention defines `next_review:` and `updated:` fields but I see no automated process that surfaces stale files. Is the nightly curator supposed to do this? If yes, it is not currently doing so. If no, who is?

3. **Should the inbox files be in the wiki at all?** The `inbox/gpuserver1/cron-cleanup/2026-04-12_cron-cleanup.md` is a 393-line completion report that is functionally a project artifact, not a queue item. Either it should be moved to `projects/` or the inbox should be understood to permanently retain reports rather than being a transient queue.

4. **Is the safety-knowledge-graph an active research workspace or a reference dataset?** Its lack of frontmatter and its self-contained linking pattern suggest it is meant to be a reference, but the absence of any inbound links from ASTRAZENECA.md or PROJECTS.md suggests it has been forgotten. Phase 2 should decide whether to wire it back in or formally retire it.

5. **How should v0.1 / v0.2 versioning be handled?** Two pages (`HOUSEHOLD-CONSTITUTION` and `MISSION`) have explicit v0.1 / v0.2 file pairs. The convention is unclear: should the v0.1 file be deleted, archived, or kept inline? The current state is inconsistent (MISSION-v0.1 is still in `machines/gpuserver1/`, HOUSEHOLD-CONSTITUTION-v0.1 is in `reference/`, both as siblings of the v0.2 successor).

6. **Should `BUSINESS.md` be deprecated in favor of `business/`?** With three deep sub-pages (`solar-inference.md`, `sante-total.md`, `az-career.md`) all created 2026-04-09, the parent `BUSINESS.md` is now in a strange position: it tries to be both an overview and the canonical doc for "AstraZeneca Career Track" content that has not been split out. Either fully delegate to sub-pages or fold the sub-pages back in.

7. **What is the relationship between `MACHINES.md` and `machines/gpuserver1/MISSION.md`?** The MISSION doc is gpuserver1's first-person identity statement. MACHINES.md is a third-person hardware inventory. They cover overlapping ground but neither links to the other. Phase 2 should decide: are these two genres of doc, or is one a fragment of the other?

8. **Why are there `OPERATING-AGREEMENT-DRAFT-GPUSERVER1.md` and `OPERATING-AGREEMENT-DRAFT-ROCINANTE.md` files alongside the canonical `OPERATING-AGREEMENT.md`?** Are the drafts proposed-by-each-machine versions waiting to be merged? If the canonical version exists, the drafts should be archived or deleted.

## Inputs and artifacts

- TSV inventory: `sartor/memory/.scratch/memory-inventory-2026-04-12.tsv` (152 rows × 9 cols)
- Raw dangling-link JSON: `sartor/memory/.scratch/dangling-links-2026-04-12.json`
- Normalized dangling-link JSON: `sartor/memory/.scratch/truly-dangling-2026-04-12.json`
- Inventory builder: `sartor/memory/.scratch/build_inventory.py`

## Phase boundary

This is a **read-only ethnography**. No files were modified outside `projects/memory-system-v2/` and `.scratch/`. No commits. No git operations. No fixes proposed for execution — only observations and severity rankings to feed Phase 2 (Synthesis & Master Plan).

— ethnographer, 2026-04-12
