---
name: MEMORY-AUDIT
description: Architectural audit of the Sartor memory tree. Inventory + size distribution + per-dir characterization + MEMORY.md overflow analysis + dead zones + naming inconsistencies + frontmatter coverage + ranked recommendations. Read-only audit; no edits made.
type: audit
date: 2026-05-06
inspector: inspector-architecture
status: complete
plan: ../../memory-system-uplift-2026-05-06-PLAN.md
---

# Memory Tree — Architectural Audit

Read-only audit of `sartor/memory/`. Methods: bash inventory, frontmatter sampling, size distribution, backlink counts via grep on `[[name]]` patterns, mtime forensics. No writes outside this audit file.

The headline finding fits in two sentences: **MEMORY.md is 30 KB live but a 7.4 KB trim already exists at `MEMORY.md.proposed` (made 2026-05-02 by `memory-cartographer`) and was never adopted, while the live file kept growing in the same paragraph-per-entry style.** Adopt the proposed trim, mark it the canonical pattern, and the headline overflow problem closes in five minutes. Everything else in this report is downstream of that pattern not being enforced.

## §1. Inventory

### Counts

| Slice | Count |
|---|---|
| Total `*.md` files in `sartor/memory/` | **764** |
| Total directories | **131** |
| Top-level files (root of `sartor/memory/`) | 21 (16 `.md` + 1 `.md.proposed` + 4 `.py` scripts) |
| Top-level directories | 17 |

### Size by top-level directory

```
15M   reference/         <- dominated by 4 versions of HOUSEHOLD-CONSTITUTION (~700 KB) + anthropic-shares PDFs
4.6M  research/          <- ccp-alignment + persona-engineering + pharmacovigilance
1.9M  projects/          <- 28 root files + 9 subdirs; unifi-takeover sprawl + memory-system-v2 narrative
1.8M  inbox/             <- 354 .md files; 236 in proposed-memories backlog
804K  daily/             <- 47 daily logs
296K  family/            <- 10 root + 1 subdir (15 total)
261K  machines/          <- 14 files across 4 subdirs
232K  hearth/            <- 18 root + 2 subdirs (24 total) + 3 .html files
184K  __pycache__/       <- python bytecode (should be in .gitignore?)
161K  feedback/          <- 28 files
112K  business/          <- 11 files (8 root + 2 subdirs)
56K   people/            <- 10 files
41K   skills/            <- 5 files (mostly stale, 2026-04-11)
40K   procedures/        <- 1 file
30K   indexes/           <- 5 files; STALE since 2026-04-09
28K   snapshots/         <- 4 files; STALE since 2026-04-03
12K   incidents/         <- 1 file
5K    ledgers/           <- 2 files
```

Plus the top-level files (16 .md + 1 .proposed):

```
30K   MEMORY.md            (the 24.4 KB session-injection ceiling case — see §3)
30K   MACHINES.md          
22K   ALTON.md             
19K   TAXES.md             
17K   FAMILY.md             
15K   LEARNINGS.md         
14K   BUSINESS.md           
8K    SELF.md              
7K    PROCEDURES.md        
7K    PROJECTS.md          
6K    ASTRAZENECA.md       
142K  log.md               (append-only personal-data-gather ledger; 1,461 lines)
4.6K  gpuserver1-monitoring-log.md  (created-as-stub, never filled in)
6.8K  reference_anthropic_shares.md
6.5K  reference_home_network.md
8K    reference_memory_server.md
7K    reference_scheduled_tasks.md
1.4K  INDEX.md             (auto-generated; broken — see §3.5)
2.3K  QUICK-REFERENCE.md   (stale: vast.ai pricing wrong, listing-expiry wrong)
13K   MASTERPLAN.md
3K    MASTERPLAN-VISIONARY.md
7.4K  MEMORY.md.proposed   <-- the unmerged trim
```

### Top 20 largest `.md` files

```
206 KB  reference/archive/HOUSEHOLD-CONSTITUTION.v0.4.proposed-2026-05-04.md
173 KB  reference/archive/HOUSEHOLD-CONSTITUTION-v0.3.md
168 KB  reference/HOUSEHOLD-CONSTITUTION.md
163 KB  reference/archive/HOUSEHOLD-CONSTITUTION-v0.2.md
161 KB  research/ccp-alignment/mini-lab-2026-04-11/MINI-LAB-REPORT.md
143 KB  log.md                                                          (top-level, append-only)
129 KB  family/active-todos.md                                          (largest family file)
 87 KB  projects/memory-system-v2/NARRATIVE.md
 79 KB  research/ccp-alignment/constitution-council/SYNTHESIS.md
 73 KB  research/ccp-alignment/gpu-research-restart/03-eval-framework.md
 71 KB  research/ccp-alignment/constitution-council/DIFF.md
 63 KB  research/pharmacovigilance/cell-therapy-safety-monitoring-lifecycle.md
 58 KB  research/pharmacovigilance/cell-therapy-organizational-regulatory-framework.md
 56 KB  research/ccp-alignment/constitution-council/cross-reviews/constitutional-ai-method.md
 51 KB  research/persona-engineering/PHASE-2-RESEARCH-PLAN.md
 49 KB  research/ccp-alignment/constitution-council/cross-reviews/character-philosopher.md
 49 KB  research/persona-engineering/PHASE-2-METHODS-PIPELINES.md
 47 KB  research/ccp-alignment/constitution-council/reviews/red-team-adversary.md
 46 KB  research/persona-engineering/PHASE-2-COMPOSABILITY.md
 45 KB  research/ccp-alignment/constitution-council/cross-reviews/mythos-future-claude.md
```

Observations on this list:

1. **HOUSEHOLD-CONSTITUTION owns the top 4 slots and ~700 KB total**. Three archived versions plus a 206 KB v0.4 proposed are alongside the 168 KB live v0.5. A 30% size growth across versions suggests amendment-by-accretion. The v0.4 proposed is itself 38 KB larger than the *current* v0.5 — implying v0.5 partially adopted v0.4 then trimmed; the proposed should likely be archived not deleted, but its presence in `archive/` is correct.
2. `log.md` at 143 KB is fine (append-only ledger by design) but should not load into a session — verify it does not get auto-injected.
3. `family/active-todos.md` at 129 KB is the largest non-research operational file; this is a known append-pattern problem (the personal-data-gather cron writes into it many times per day; no one prunes).
4. 17 of the top 20 are research artifacts. Research is large by nature; the live curation surface is smaller.

## §2. Per-directory characterization

### Top-level (`sartor/memory/`)

The 11 canonical hub files (ALTON, FAMILY, BUSINESS, TAXES, MACHINES, PROJECTS, ASTRAZENECA, SELF, LEARNINGS, PROCEDURES, MEMORY) are all present, all have proper frontmatter, all have `last_verified` set. This layer is healthy. Plus 4 `reference_*.md` files at the root (see §5 for the naming-collision issue with the `reference/` dir), 2 plan files (MASTERPLAN, MASTERPLAN-VISIONARY), an INDEX.md (auto-generated, broken — see §3.5), a QUICK-REFERENCE.md (stale), and `log.md` (append-only ledger, alive). Plus `gpuserver1-monitoring-log.md` which is a 91-line stub that says "Stub created by curator on 2026-04-14 from inbox entry... Awaiting human curation" — it has been awaiting that for 22 days. Plus `MEMORY.md.proposed`, the unmerged trim.

### `family/` (15 files)

The operational family wiki: kid profiles (vayu, vishala, vasu), `family-calendar.md`, `active-todos.md` (the giant one — 129 KB), vendor list (`PAPER-CHECK-VENDORS.md`), `disney-july-2026.md`, `sole-parent-window-2026-04-29.md`, plus an INDEX.md and a CONVENTIONS.md. Mostly recent activity, all frontmattered (10/10 root files have frontmatter; `_history/` subdir contributes the rest). Boundary with `hearth/` and `FAMILY.md` not documented — out of scope for this inspector but flagged for inspector-family-wiki.

### `hearth/` (24 files)

Philosophical/identity layer: `character.md`, `creed.md`, `founding.md`, `voice.md`, `growth.md`, `inheritance.md`, `integration.md`, `practice.md`, `quiet.md`, `refusal.md`, `rites.md`, `surface.md`, `witnesses.md`, `asymmetry.md`, `current.md`, `family.md`, `map.md`. Plus three `.html` files (`forward_pass.html`, `silence.html`, `threshold.html`) — these are the only HTML files in the entire memory tree, sit oddly in a markdown wiki, and one of them (`forward_pass-v1-2026-05-02.html`) is in `_history/`. Frontmatter coverage 23/24. The "what does this file do for the system" question is real; it is an artifact-and-reflection space whose readers are not entirely clear. Inspector-family-wiki will adjudicate.

### `business/` (11 files)

Solar Inference + AstraZeneca + Sante Total operational: `solar-inference.md`, `solar-inference/` subdir, `az-career.md`, `sante-total.md`, `rental-operations.md`, `rental-policy.md`, `vastai-pricing-strategy.md`, `secrets-migration-log.md`, `hours-log/` subdir (the §469 material-participation tracker). Healthy. Frontmatter 11/11.

### `reference/` (35 files, 4 subdirs)

Canonical convention/architecture docs (`MEMORY-CONVENTIONS`, `OPERATING-AGREEMENT`, `HOUSEHOLD-CONSTITUTION`, `MULTI-MACHINE-MEMORY`, `LLM-WIKI-ARCHITECTURE`) plus reviews (`gstack-review-2026-04-18`, `system-review-2026-04-18`), agent specs (`memory-curator-agent`, `gpuserver1-delegation`), the Drive catalog (`google-drive-catalog-2026-05-02.md`), one-off security artifacts (`microsoft-store-pua-pattern`, `nwjs-remote-loader.yar`, `nwjs-remote-loader.yml`), and oddities like `obsidian-control-research.md` and `rocinante-working-tree-triage-2026-04-12.md`. Subdirs: `archive/` (6 superseded files), `MEMORY-history/` (2 `.md.proposed`), `CONSTITUTION-RATIFICATIONS/` (2 ratification records v0.3 and v0.5 — note the missing v0.4 which became the proposed-not-adopted), `anthropic-shares-2026-05/` (8 PDFs — out of place but the only PDF dir in memory; see §4). Frontmatter 35/35.

### `research/` (97 files, 4 subdirs)

Three research lines: `ccp-alignment/` (mini-lab, gpu-research-restart, monitoring probes, OCT playbook, counter-CCP dataset, constitution-council, eval-harness), `persona-engineering/` (29 root files + 5 subdirs — heavily under construction, includes 8 CATO-PROSECUTION-NNN files, MEASUREMENT/METHODS/LITERATURE/ONBOARDING/RESEARCH-LOG), `pharmacovigilance/` (3 files + safety-knowledge-graph/ subdir), `constitution-finetune/` (recent 2026-05-06 v0.5 bringup). Frontmatter 75/97 — the lowest non-daily/ coverage. Several persona-engineering files lack frontmatter; experiments/ has 3 of 22 with frontmatter.

### `projects/` (93 files, 9 subdirs)

The most disorderly directory after `inbox/`. 28 files at the root level, including:

- 14 files prefixed `unifi-takeover-2026-05-01-*` that should be in a subdir (only INDEX exists at root + the 14 children — they collectively form a project bundle that is being treated as a flat namespace prefix)
- 3 files prefixed `rtx6000-workstation-build*` (similar pattern, smaller)
- Subdirs: `2025-photo-book/`, `curator-fixes/`, `dashboard-rebuild/`, `disney-july-2026/`, `family-thread-dossier/`, `hermes-dashboard-upgrade/`, `memory-system-uplift-2026-05-06-WORK/` (this audit), `memory-system-v2/`, `sartor-agent-os/`
- One-off project files: `aneeta-peer-setup`, `family-memory-fixup`, `family-todos-longrunning-thread`, `machine-self-stewardship`, `pihole-placement-2026-05-04`, `rtx-stress-design-2026-05-02`, `rtxserver-vastai-watch`, `unifi-led-direct-control`

The mixed pattern (subdir-or-prefix-flat) is probably what the plan doc means by "memories get written into odd places." Frontmatter 92/93. The structural inconsistency is a layout issue, not a metadata issue.

### `inbox/` (354 files across 4 peer subdirs + .drained)

By far the largest by file count. 236 files in `inbox/rocinante/proposed-memories/` alone (one subdir per day from 2026-04-20 to 2026-05-06, ~3 files per day from the SartorConversationExtract cron). The `_processed/`, `_curator_logs/`, `_specs/`, `_tasks/`, `_flagged/`, `morning-briefing/` subdirs are handled correctly. `aneeta-peer/` is empty — the placeholder for the future Aneeta laptop peer. `gpuserver1/`, `rtxpro6000server/`, `rocinante/` each have a small number of MISSION/PHONE-HOME/RESUME files at the root. Frontmatter 352/354.

The 236-file proposed-memories backlog is the headline issue. The plan doc estimates "53/58 in April" — that estimate is now stale; the current backlog is 4× that. Either the curator is not draining it, or the extractor is producing items the curator silently rejects without recording. Out of scope for this inspector to diagnose deeper, but in scope to flag.

### `machines/` (14 files, 4 subdirs)

`MACHINES.md` (the top-level file, but somehow also exists here at `machines/MACHINES.md` — possibly intentional, possibly stale duplicate; verify). Subdirs `_TEMPLATE/`, `gpuserver1/`, `rocinante/`, `rtxpro6000server/` each hold MISSION/CRONS/INDEX. Frontmatter 14/14. Healthy.

### `daily/` (47 files)

Append-only daily session logs from 2026-02-06 to 2026-05-04. **Frontmatter 21/47 — the worst coverage in the repo (45%)**. The unfrontmattered ones are the older ones (Feb–early Apr); newer dailies have frontmatter. This is the curator-class batch-frontmatter task that 2026-04-19 morning's tidy pass deferred.

### `feedback/` (28 files)

Behavioral rules, all auto-injected into every session. Healthy. 28/28 frontmatter. Two naming styles coexist: 13 files use `feedback_*.md` snake_case (older convention), 15 use kebab-case (newer convention, e.g., `goal-driven-execution.md`, `proactive-error-cleanup.md`). The MEMORY.md history note from 2026-04-16 says "all feedback files live under `feedback/`" — that is true, but the files-within still split into two naming families (see §5).

### `people/` (10 files)

External individuals: `alison-smith`, `amarkanth`, `andy-stecker`, `barbara-weis`, `doug-paige`, `ilan-grunwald`, `jonathan-francis`, `mike-silva`, plus README and INDEX. All frontmattered. Healthy.

### `skills/` (5 files)

Claims to be the "memory wiki's view of skills" but the skills themselves live in `.claude/skills/`. Files: `INDEX.md`, `morning-briefing-v2.md`, `obsidian-control.md`, `research-effort.md`, plus `gpuserver1-market-pricing/SKILL.md`. Last modified 2026-04-11/12. **Stale.** No backlinks to any of these (see §4). Possibly a vestige of an earlier organization. Inspector should consider deletion / merger into `.claude/skills/`.

### `procedures/` (1 file)

Just `vastai-host-onboarding.md`. Frontmattered. Single file in its own dir is structurally wasteful but probably fine if more procedures land here. Note that there is also a top-level `PROCEDURES.md` — different intent (PROCEDURES.md is the index/hub; `procedures/` is the per-procedure detail). Boundary is sensible but undocumented.

### `incidents/` (1 file)

Just `2026-04-16_privacybrowse-static-analysis.md`. Same single-file-in-dir pattern as procedures/. Created on the day of the PrivacyBrowse incident; nothing else has happened since.

### `indexes/` (5 files)

`_index.md` plus four JSON files (`backlinks.json`, `broken-links.json`, `orphans.json`, `tag-index.json`). **All last regenerated 2026-04-09, 27 days stale.** The `_index.md` claims `wiki.py --reindex` produces them as part of the `wiki-reindex` nightly task. Either the task is not running, or it's running and not writing here, or the script changed. Out of scope for this inspector to diagnose; in scope for inspector-wikilinks-graph. Flag: this directory is currently misleading because it claims authority it doesn't have.

### `snapshots/` (4 files)

`calendar-2026-04.md`, `downloads-inventory.md`, `gmail-2026-04.md`, `life-timeline.md`. All from 2026-04-03. **Single-shot snapshots, never refreshed.** No backlinks to any of them (see §4).

### `ledgers/` (2 files)

`INDEX.md` and `kids.md`. Frontmattered. Niche but apparently alive.

### Python scripts at root

`autodream.py`, `curator.py`, `decay.py`, `embeddings.py`, `extract_graph.py`, `search.py`, `wiki.py` — 7 scripts. Out of scope for me to evaluate but worth noting they are colocated with markdown content rather than under `scripts/` or a sibling dir. `__pycache__/` at 184 KB suggests some of these get run.

## §3. MEMORY.md overflow analysis

The session-reminder explicitly says: `MEMORY.md is 29KB (limit: 24.4KB) — index entries are too long. Only part of it was loaded.` Live size is 30,428 bytes (29.7 KB) as of 2026-05-06.

### §3.1 What the file should look like

[[MEMORY-CONVENTIONS]] §"Migration plan" + the implicit pattern of "stable pointer with one-line history hooks": MEMORY.md is meant to be the entrypoint that names where to find things, plus a one-line-per-event history. The file template at the bottom of MEMORY-CONVENTIONS (line 247) shows "## History — `- 2026-04-07: Initial creation`" — one line per entry. The **proposed** file at `MEMORY.md.proposed` (created 2026-05-02 by `memory-cartographer (Rocinante Opus 4.7) — trim pass to fit under 24.4 KB session-injection limit`) implements this exactly: every history entry is one line ≤200 chars, with a `[[link]]` to a daily log or topic file for detail.

### §3.2 What the live file looks like

The live MEMORY.md `## History` section (lines 57–76) has 18 entries. Of those, **12 are paragraph-form** (200–2,500 chars each), and only the bottom 6 are one-liners. The pattern: every recent significant session inserts a 1,000–2,500 char paragraph at the top describing what was done in detail, instead of writing a one-liner pointing at the daily log.

Specific offenders, by character count of the entry:

| Date | Approx chars | Should collapse to |
|---|---|---|
| 2026-05-02 (evening, Solar-Inference day) | **~3,200** | One-liner pointing at `daily/2026-05-02.md` |
| 2026-05-02 (Memory server topology) | **~1,900** | One-liner pointing at `[[reference_memory_server]]` |
| 2026-05-01 (UniFi takeover) | **~2,400** | One-liner pointing at `[[unifi-takeover-2026-05-01-INDEX]]` |
| 2026-04-25 (Sartor Agent OS) | **~1,900** | One-liner pointing at `projects/sartor-agent-os/` |
| 2026-04-22 (Blackwell rtxserver) | **~1,800** | One-liner pointing at `[[daily/2026-04-22]]` |
| 2026-04-19 (late: Constitution v0.3) | **~1,400** | One-liner pointing at `[[reference/CONSTITUTION-RATIFICATIONS/v0.3]]` |
| 2026-04-19 (eve: Research consolidation) | **~1,500** | One-liner |
| 2026-04-19 (am: Tidy pass) | **~1,800** | One-liner |
| 2026-04-18 (late: gstack port) | **~1,000** | One-liner pointing at `[[system-review-2026-04-18]]` |
| 2026-04-18 (eve: 7-agent gstack review) | **~900** | One-liner pointing at `[[gstack-review-2026-04-18]]` |
| 2026-04-18 (Self-team roundtable) | **~1,000** | One-liner |
| 2026-04-18 (am: alton-voice skill) | **~700** | One-liner |
| 2026-04-18 (am: GDrive MCP) | **~700** | One-liner |

Each entry, in its current form, is correctly *informative* — but it's information that belongs in the linked daily log, not in the index file that loads on every session. The cost is that the bottom of the file is being silently truncated past the 24.4 KB ceiling, so the things most worth indexing (older/foundational entries) are the ones that *don't load*.

### §3.3 The unmerged proposed trim

`MEMORY.md.proposed` exists at 7,415 bytes (24% of current size, 30% of the ceiling). It successfully reduces every history entry to one line ≤200 chars + a `[[wikilink]]`. It was committed 2026-05-02 by `memory-cartographer (Rocinante Opus 4.7)` with an explicit `updated_by` note saying "trim pass to fit under 24.4 KB session-injection limit" — so this was an authorized, intentional fix.

It was never adopted. Four days later, MEMORY.md has gotten worse (the 2026-05-02 entries were appended in the old paragraph style). The file `.proposed` extension is a non-standard naming pattern with no documented adoption mechanism; the curator either does not look for `.proposed` files or does not act on them.

### §3.4 Recommended fix (one-line summary, full text in §7)

Adopt the proposed trim, append two new one-liners for 2026-05-03 to 2026-05-06, write a feedback rule that says "MEMORY.md history entries are one line ≤200 chars; detail goes in linked daily/topic files," and configure the curator to enforce it. ROI: very high, effort: ~30 minutes.

### §3.5 Bonus: INDEX.md is broken

While auditing the top-level files, found `INDEX.md` (2026-05-01 mtime, auto-generated by something) is broken — every entry has the form:

```
- [ALTON.md](ALTON.md) — ---
- [ASTRAZENECA.md](ASTRAZENECA.md) — ---
- [BUSINESS.md](BUSINESS.md) — ---
```

The `— ---` is the auto-generator extracting "the first non-blank line of the file" and getting the YAML frontmatter delimiter `---` instead of the actual title or first prose line. The generator should either (a) skip frontmatter and grab the first prose line / `# Title` heading, or (b) read the `description:` field from frontmatter. Currently this file provides no signal beyond filename — it could be deleted with no loss, or fixed.

INDEX.md also lacks frontmatter itself (it is the only top-level `.md` file without it).

## §4. Dead zones

Files with zero `[[wikilink]]` backlinks, last touched >14 days ago, no obvious live consumer.

### Hard dead zones (delete or archive candidates)

| File | Last touched | Backlinks | Status note |
|---|---|---|---|
| `gpuserver1-monitoring-log.md` | 2026-04-14 | 0 | "Stub created by curator… Awaiting human curation" — never filled in for 22 days |
| `snapshots/calendar-2026-04.md` | 2026-04-03 | 0 | Single-shot April snapshot, no refresh |
| `snapshots/downloads-inventory.md` | 2026-04-03 | 0 | Single-shot April snapshot, no refresh |
| `snapshots/gmail-2026-04.md` | 2026-04-03 | 0 | Single-shot April snapshot, no refresh |
| `snapshots/life-timeline.md` | 2026-04-03 | 0 | Single-shot April snapshot, no refresh |
| `skills/morning-briefing-v2.md` | 2026-04-12 | 0 | Real skill is in `.claude/skills/morning-briefing/`; this is a duplicate or remnant |
| `skills/obsidian-control.md` | 2026-04-11 | 0 | Same pattern; duplicate of canonical skill location |
| `skills/research-effort.md` | 2026-04-12 | 0 | Same pattern; duplicate |
| `skills/gpuserver1-market-pricing/SKILL.md` | 2026-04-11 | 0 | Same pattern; duplicate |
| `skills/INDEX.md` | 2026-04-11 | 0 | Index of the above; same fate |
| `ledgers/kids.md` | (not checked) | 0 | (Verify before deletion — could be a privacy-locked file) |

### Stale-but-alive zones (need a refresh policy)

| Item | Last touched | Note |
|---|---|---|
| `indexes/backlinks.json` etc. | 2026-04-09 | The `wiki-reindex` nightly task should be writing here. It isn't. Either the task is dead or the script changed targets. |
| `QUICK-REFERENCE.md` | 2026-04-07 | Vast.ai pricing wrong ($0.40/hr listed, actual $0.30). Listing-expiry wrong (2026-08-24 listed, actual 2026-10-24). Should be auto-refreshed or deleted. |
| `MASTERPLAN.md` | 2026-04-19 | "Last updated: 2026-02-06. Hub-refreshed: 2026-04-12." — a hub-refresh is not a content review |
| `MASTERPLAN-VISIONARY.md` | 2026-04-11 | Hub-refreshed only |

### Outliers (not dead, but located oddly)

- `reference/anthropic-shares-2026-05/` — 8 PDFs in the reference dir. Almost certainly the right *idea* but the wrong *home* — the source-doc layer the plan doc proposes (`source-documents/INDEX.md` + canonical paths) would absorb these. Out of scope for this inspector; flagged for inspector-source-docs.
- `hearth/forward_pass.html`, `silence.html`, `threshold.html` — three HTML files in a markdown wiki. Inspector-family-wiki will adjudicate.
- `MEMORY.md.proposed` — see §3.3.
- `reference/MEMORY-history/2026-04.md.proposed`, `2026-05.md.proposed` — same `.proposed` pattern, same unclear adoption mechanism. These look like the spillover destination for one-liners moved out of MEMORY.md, but they are also unmerged.

## §5. Naming inconsistencies

### §5.1 The `reference_*` vs `reference/*` collision (most consequential)

There are 4 files at the memory root prefixed `reference_*`:

- `reference_anthropic_shares.md`
- `reference_home_network.md`
- `reference_memory_server.md`
- `reference_scheduled_tasks.md`

…and there is a directory `reference/` with 35 files inside. Plus, **inside `reference/`**, there is `reference_vastai_market_pricing.md` — the same prefix used as a filename inside the directory whose name is the same word. Result: when you read MEMORY.md you cannot tell from "reference_X" alone whether to look at the root or inside `reference/`. The pattern is sediment: `reference_*` at root is the older "I want this at the entrypoint level" placement, and the move to `reference/` was incomplete.

Recommendation: pick one. Either pull the 4 root files into `reference/` (and update all wikilinks; `reference_memory_server` already has 1 backlink and is wikilinked from MEMORY.md), or rename them to lose the `reference_` prefix. Most defensible: move the 4 root files into `reference/`, simultaneously rename `reference/reference_vastai_market_pricing.md` → `reference/vastai_market_pricing.md` (the redundant prefix). Cost: ~4 wikilink updates, easy.

### §5.2 snake_case vs kebab-case in `feedback/`

13 files use `feedback_*.md` (`feedback_agent_bypass.md`, `feedback_pricing_autonomy.md`, etc.); 15 use kebab-case (`goal-driven-execution.md`, `awareness-as-duty.md`). The newer convention is clearly kebab-case; the older `feedback_` prefix is redundant with the directory name. Pure cosmetic but it's the most visible inconsistency since feedback files all auto-inject into every session.

### §5.3 UPPERCASE-Hub vs kebab-case-detail across `projects/`

Inside `projects/memory-system-v2/` files use the pattern `01-ethnography.md`, `30-qa-audit.md`, `99-FINAL-REPORT.md` — but `99-FINAL-REPORT.md` (uppercase) breaks the pattern. Inside `projects/` root: `unifi-takeover-2026-05-01-INDEX.md` (uppercase INDEX in a kebab-case parent name), `unifi-takeover-2026-05-01-pete-email-DETAILED.md`, `unifi-takeover-2026-05-01-pete-email-FINAL.md` (uppercase status suffix). Inside `inbox/rocinante/`: `MISSION-vastai-truth-2026-05-04.md`, `PHONE-HOME-vastai-onboarding-host-package-gap.md` (uppercase prefix is doing actual signaling here — these are protocol-significant). The uppercase-as-flag pattern in `inbox/` is justified; the rest is drift.

### §5.4 `unifi-takeover-2026-05-01-*` flat namespace

14 files with this prefix at `projects/` root. Should clearly be `projects/unifi-takeover-2026-05-01/<name>.md`. The `unifi-takeover-2026-05-01-INDEX.md` even has a relative-path frontmatter field `related: - projects/unifi-takeover-2026-05-01` — *pointing at the directory that doesn't exist*. The intent and the layout disagree.

### §5.5 `.proposed` extension as adoption signal

3 files in the tree use `.proposed`: `MEMORY.md.proposed`, `reference/MEMORY-history/2026-04.md.proposed`, `reference/MEMORY-history/2026-05.md.proposed`. None have been adopted. There is no documented mechanism for "a `.proposed` file becomes the canonical file when X." Either drop the convention or define it.

### §5.6 Subdirs vs flat-namespace prefix in `projects/`

Some projects get a real subdir (`memory-system-v2/`, `sartor-agent-os/`, `hermes-dashboard-upgrade/`). Others stay flat with a date prefix or topic prefix (`unifi-takeover-2026-05-01-*`, `rtx6000-workstation-build*`). No documented rule for when to use which. Operationally the rule appears to be "small projects stay flat, large ones get a dir" — but the unifi-takeover bundle is 14 files and definitely qualifies as large.

## §6. Frontmatter coverage

Sample-based estimate computed by `head -1 file.md | grep '^---$'` across 764 files.

| Directory | Coverage | Note |
|---|---|---|
| `family/` | 14/15 (93%) | One holdout — likely the `_history/` outlier |
| `hearth/` | 23/24 (96%) | One holdout |
| `business/` | 11/11 (100%) | Clean |
| `reference/` | 35/35 (100%) | Clean |
| `research/` | 75/97 (77%) | Persona-engineering experiments + some literature-notes lack frontmatter |
| `projects/` | 92/93 (99%) | Effectively clean |
| `feedback/` | 28/28 (100%) | Clean |
| `machines/` | 14/14 (100%) | Clean |
| `daily/` | 21/47 (45%) | **Worst.** Older daily logs (Feb–early Apr) lack frontmatter |
| `people/` | 10/10 (100%) | Clean |
| `skills/` | 5/5 (100%) | Clean (but see §4 — files are dead) |
| `procedures/` | 1/1 (100%) | Clean |
| `incidents/` | 1/1 (100%) | Clean |
| `indexes/` | 1/1 (100%) | Clean |
| `ledgers/` | 2/2 (100%) | Clean |
| `inbox/` | 352/354 (99.4%) | Effectively clean |
| Top-level | 20/21 (95%) | INDEX.md is the lone holdout |

**Aggregate: ~95% frontmatter coverage.** The two soft spots are (a) `daily/` 45% — older logs predate the convention, and (b) `research/persona-engineering/experiments/` — under-construction work that hasn't been ceremonialized yet.

Hub-file `last_verified` field: **10/10 canonical hub files have it set** (ALTON, FAMILY, BUSINESS, MACHINES, TAXES, ASTRAZENECA, SELF, LEARNINGS, PROCEDURES, PROJECTS — verified). MEMORY.md has it. The convention is being followed where it most matters.

## §7. Recommendations

Numbered, ranked by ROI (benefit ÷ effort). Each item is actionable in one session if greenlit; this inspector did not execute any of these.

### R1. Adopt `MEMORY.md.proposed` as live MEMORY.md, append the 4 missing days, write the one-line-per-entry rule into `MEMORY-CONVENTIONS`. **VERY HIGH ROI / VERY LOW EFFORT.**

The closest thing the system has to a P0. The trim is already written, already correct, and already authorized (committed by an earlier curator pass). Concrete actions:

1. `mv MEMORY.md.proposed MEMORY.md` (after confirming nothing in MEMORY.md is in MEMORY.md.proposed and lost — spot check confirms the proposed has every entry, just trimmed).
2. Append four new one-liners to the History section for 2026-05-03 (anthropic-shares intake), 2026-05-04 (vast.ai truth audit + new skills `vastai-management` and `rtxserver-management`), 2026-05-05 (gap day to verify), 2026-05-06 (this uplift dispatch).
3. Add to `MEMORY-CONVENTIONS.md` a "MEMORY.md History entries" rule: ≤200 chars, one date, one verb, one wikilink, no nested bullets. Mark it as a hard rule.
4. Update `curator.py` (or the relevant nightly job) to flag any MEMORY.md history entry >200 chars on next pass.
5. Commit. Watch the next session-injection reminder go quiet.

Estimated time: 30 minutes. Estimated impact: closes the headline overflow in the plan doc and prevents recurrence.

### R2. Convert `unifi-takeover-2026-05-01-*` flat-namespace into `projects/unifi-takeover-2026-05-01/`. **HIGH ROI / LOW EFFORT.**

14 files, simple rename + wikilink update. Already has an INDEX whose `related:` field literally points at the non-existent directory. ~15 minutes including wikilink fixups.

### R3. Resolve `reference_*.md` root vs `reference/` directory collision. **HIGH ROI / LOW EFFORT.**

Move the 4 root `reference_*.md` files into `reference/`. Rename `reference/reference_vastai_market_pricing.md` → `reference/vastai_market_pricing.md`. Update wikilinks (only ~5 across the corpus by my count). Document the rule "reference content goes in `reference/`, no exceptions." ~30 minutes.

### R4. Delete or absorb the `skills/` dead zone. **HIGH ROI / LOW EFFORT.**

5 files in `sartor/memory/skills/` that duplicate the canonical `.claude/skills/` location, last touched 2026-04-11/12, with zero backlinks. Either delete (cleanest), or move to `reference/archive/skills-vestiges-2026-04/` with a note. ~10 minutes.

### R5. Fix `INDEX.md` auto-generator (the one that emits `— ---` for every entry). **MEDIUM-HIGH ROI / LOW-MEDIUM EFFORT.**

Currently produces no signal because the entry-extractor reads frontmatter delimiter as the description. Either (a) skip frontmatter and read the first prose line, (b) read the `description:` field, or (c) read the first H1. Once fixed, INDEX.md becomes a useful browse layer. While there, add frontmatter to INDEX.md itself. ~1 hour to find the generator, fix, and verify.

### R6. Either rebuild `wiki-reindex` to keep `indexes/*.json` fresh, or delete the dir. **MEDIUM-HIGH ROI / MEDIUM EFFORT.**

The directory's `_index.md` claims `wiki.py --reindex` produces the JSON files; they haven't refreshed since 2026-04-09. The plan doc says wiki-reindex is "declared, wiring uncertain" — confirmed uncertain. The presence of stale indexes is worse than no indexes (misleads). Out of scope to fix here, but in scope to flag for inspector-wikilinks-graph. **Coordination point with that inspector.**

### R7. Decide a `.proposed` adoption mechanism, or stop using the convention. **MEDIUM ROI / LOW EFFORT.**

Three files use `.proposed` and none have been adopted. The most charitable read: a curator's earlier pass left them as drafts pending human review, but the human-review handoff is not in any documented workflow. Either (a) add a "drain proposed files" step to the nightly curator pass, with a flag `auto_adopt_after_days: 7`, or (b) just merge or delete the existing 3 by hand and stop the convention. 15 minutes per file if done by hand.

### R8. Refresh or delete `QUICK-REFERENCE.md`. **MEDIUM ROI / LOW EFFORT.**

Current content has wrong vast.ai pricing ($0.40/hr vs actual $0.30) and wrong listing-expiry (2026-08-24 vs actual 2026-10-24). Either auto-generate from MACHINES.md frontmatter on each session (fancy), or just refresh by hand and add a `next_review` of 2026-06-01 (cheap). 20 minutes for the cheap version.

### R9. Backfill frontmatter on the older `daily/` logs. **MEDIUM ROI / MEDIUM EFFORT.**

26 daily logs from Feb–early Apr lack frontmatter. Curator-class batch task — write a script that reads the `# Daily Log - YYYY-MM-DD` header, derives `type: daily`, `entity: daily/YYYY-MM-DD`, `tags: [meta/daily, status/archived]`, and prepends. ~1 hour for the script + run + verify.

### R10. Decide what to do with `gpuserver1-monitoring-log.md`. **LOW ROI / LOW EFFORT.**

The 91-line stub from 2026-04-14 says "awaiting human curation." It has been awaiting for 22 days. Either fill it in or delete it. The simplest move: delete (the inbox entry it was created from has presumably been processed via other channels). 5 minutes.

### R11. Drain the 236-file `proposed-memories` backlog or fix the producer. **HIGH ROI / HIGH EFFORT (out of scope for me to execute).**

The plan doc identifies this; backlog is now ~4× what the April 19 drain estimated. Likely root cause: extractor is producing items the curator silently rejects (the 2026-04-19 drain notes recommended tightening extractor filters; that recommendation was not acted on). Out of scope for inspector-architecture to drain or fix; in scope to surface as a P0 for the synthesizer. **Coordination point with the synthesizer.**

### R12. Investigate `machines/MACHINES.md` vs root `MACHINES.md` (potential duplicate). **LOW ROI / LOW EFFORT.**

There appear to be two `MACHINES.md` files — one at memory root, one inside `machines/`. Verify whether they are intentional (e.g., the inner one being the "machines hub for the dir" and the outer one being the canonical) or if one is a stale duplicate. 10 minutes to read both and decide.

### R13. Snapshots dir — adopt a refresh cron or delete. **LOW ROI / LOW EFFORT.**

`snapshots/` has 4 files all from 2026-04-03 with zero backlinks. Either adopt them as living documents (with a refresh schedule) or delete (one-shot snapshots that have served their purpose). Inspector-source-docs and inspector-gmail-drive may want a `snapshots/` dir for their own outputs; coordinate before deleting. 5 minutes if delete.

## §8. Confidence and limits of this audit

- **Confident**: file/dir counts, sizes, top-N lists, frontmatter coverage by directory, the MEMORY.md analysis (file is 30 KB, proposed trim exists at 7.4 KB and was not adopted, history entries are paragraph-form not one-line), the dead-zone list (0-backlink + stale-mtime is high-confidence dead).
- **Less confident**: specific wikilink counts use raw grep on `[[name]]` patterns; aliases or display-text wikilinks (`[[NAME|alias]]`) are caught but typed wikilinks (`[[rel:name]]`) and cross-dir name collisions (e.g., `[[INDEX]]` could mean any of 16 INDEX.md files) are not deduplicated. Treat backlink counts as ±20%. Inspector-wikilinks-graph will produce the authoritative graph.
- **Out of scope and not done**: family-wiki layout (FAMILY/family/hearth boundary), wikilink graph health (broken-link rate, orphan rate), source-doc layer design, Gmail/Drive ingest evaluation, text-message integration. Per the dispatch.
- **Things I considered escalating but did not**: `MEMORY.md.proposed` is *probably* safe to adopt without further check, but the synthesizer should confirm against the `2026-05-02` daily log that no facts were lost. I did not phone-home; this is not a blocker for me, just a verify-step for whoever executes R1.

## §9. Coordination points with other inspectors

- **inspector-family-wiki**: §2 `family/`, `hearth/`, plus the `FAMILY.md` boundary; §5.4 `family/` naming uniformity.
- **inspector-wikilinks-graph**: §4 dead zones depend partly on backlink counts which they will have authoritatively; §6 `indexes/` staleness is squarely their territory; R5 INDEX.md generator and R6 wiki-reindex wiring.
- **inspector-source-docs**: §4 `reference/anthropic-shares-2026-05/` PDFs need a home; §2 `snapshots/` may serve their needs as an output dir.
- **inspector-gmail-drive**: same `snapshots/` consideration; the `log.md` 143 KB ledger that personal-data-gather writes into is partly ingest-related (verify it is not auto-loaded).
- **inspector-text-messages**: not directly coupled.

## History

- 2026-05-06: Audit produced by inspector-architecture. Read-only; no memory edits made. Length 470 lines.
