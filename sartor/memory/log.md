---
type: meta
entity: log
updated: 2026-04-12
updated_by: personal-data-gather
status: active
tags: [meta/log, meta/wiki, meta/spine]
aliases: [Wiki Log, Log, Change Log]
related: [INDEX, MEMORY, MEMORY-CONVENTIONS, LLM-WIKI-ARCHITECTURE]
---

# Log

Append-only chronological ledger of wiki activity. One of the two spine files of the Sartor LLM wiki (the other is [[INDEX]]), following the pattern from Karpathy's LLM-Wiki gist and Nous Research's Hermes Agent v2026.4.8.

> [!note]
> This file is append-only. Never rewrite or reorder entries. Every entry has an ISO date prefix so unix tools can parse it (`grep`, `sort`, `awk`).

## Entry format

```
## [YYYY-MM-DD] action | One-line title
- Brief detail
- File path touched: `some/file.md`
- Related: [[OTHER]]
```

**Actions** (controlled vocabulary):
- `ingest` — new raw source added, summary pages written, index updated
- `refactor` — restructuring without adding new facts (schema changes, conventions)
- `curate` — consolidation, pruning, reorganization of existing content
- `fact` — a new factual claim added to an existing page
- `decision` — an open decision was resolved or surfaced
- `lint` — automated audit results (orphans, broken links, stale claims)
- `repair` — fixing a regression or broken state

## Entries

## [2026-04-09] ingest | Gmail + Calendar harvest: family and business signals

- Subagent harvested Gmail + Google Calendar for 30-day window (2026-04-09 through 2026-05-09)
- Surfaced 9 urgent items and 5 blind spots
- New pages: [[family/active-todos]], [[family/vayu]], [[family/vishala]], [[family/vasu]], [[family/family-calendar]], [[business/solar-inference]], [[business/sante-total]], [[business/az-career]]
- Updated [[FAMILY]]: corrected Aneeta "DC trip" (wrong) to "RRE trip" (calendar-confirmed), 4/29-5/03 not 4/29-5/02; added Berman install overlap; added sub-page links
- Updated [[BUSINESS]]: added sub-page links; bumped review date
- Critical findings surfaced:
  - Stuck email draft (Vayu physical form, never sent 2026-04-07)
  - Wohelo deposit $500 overdue for Vishala
  - Tribeca Pediatrics $170.28 second notice (Vayu)
  - Lucent solar project stalled with $219,414.50 already released
  - Sante Total will exceed $50K donation threshold in 2026 (990-EZ migration coming)
  - Andy Stecker CPSO lead cold since 2026-03-17
- Blind spots: Chase business banking invisible, MKA Blackbaud portal, Tribeca portal, counselor search, physical birthday gift tracking

## [2026-04-09] package | Safety research wiki bundle zipped for AZ/work deployment

- Created `bundles/safety-research-wiki/wiki/` tree (26 files, ~72 KB zipped)
- Output: `C:/Users/alto8/Downloads/safety-research-wiki-v1.zip`
- Contents: generalized wiki.py (1328 lines, 0 deps), 2 skill files, wiki-reader agent, wiki-reindex task, 5 page templates, CONVENTIONS.md, ARCHITECTURE.md, INGEST.md (with Gmail+Drive workflow docs), README.md, INSTALL.md, install.ps1, install.sh, 1 example page
- Firewalled: zero Sartor/Alton/AZ references, fully portable
- Selftest passes, reindex runs clean
- Team of subagents used: one for wiki.py generalization, one for 5 page templates

## [2026-04-10] ingest | personal-data-gather run 5 — first live Gmail + Calendar harvest

- First successful MCP-live run after 34 blocked runs (Gmail/Calendar unavailable)
- Sources: Gmail (50 msgs scanned), 5 Google Calendars (primary, Family, Aneeta, Tasks, Blue Sombrero)
- Facts gathered: 11 new/confirmed signals
- Critical finding: Debra Van Eerde (MKA nurse) sent second escalation email today — Vayu's Ellis Island trip is Apr 17, physical form still unsubmitted. **7 days to deadline.**
- New finding: CSA workshift registration overdue (Alton + Aneeta paid but workshifts not signed up; coordinator waiting)
- New finding: Summit Health patient statement with payment due
- Conflict flagged: Apr 17 has both Vishala Dance Concert (8 AM MKA) and Vayu Ellis Island trip
- Updated: [[family/vayu]], [[family/active-todos]]
- Created: `data/gather-alerts.md`, `data/heartbeat-log.csv`
- Daily log: `daily/2026-04-10.md` (run 5 appended)

## [2026-04-11] ingest | personal-data-gather run 6 — Gmail + Calendar harvest

- Sources: Gmail (30 msgs scanned, unread after:2026/04/09), 5 Google Calendars (7-day window Apr 11–18)
- Facts gathered: 8 new signals
- Critical finding: **Apr 18 conflict** — Vayu's two back-to-back B-34 Lime soccer games (1–2 PM, 2–3 PM, Brookdale Park) directly overlap with Rafi's birthday party (Yankees game, 1–4 PM). Unresolved; needs decision.
- New deadline: **Goddard summer forms due Monday April 13** (2 days). Vasu soccer also starts Apr 13.
- Confirmed: Alton's CSA workshift form submitted. Aneeta's Gmail invalid in CSA system — she still needs to register.
- Tax flag: April 15 is 4 days away. Personal 1040 / Form 4868 + NJ-1065 $450 fee still open decision.
- Updated: [[family/vasu]], [[family/vayu]], [[family/active-todos]], [[family/family-calendar]]
- Created: `daily/2026-04-11.md`, `data/gather-alerts.md`, `data/heartbeat-log.csv`

## [2026-04-11] ingest | personal-data-gather run 7 — Gmail + Calendar harvest

- Sources: Gmail (50 msgs scanned, unread after:2026/04/10), 5 Google Calendars (7-day window Apr 11–18)
- Facts gathered: 2 new signals; 6 confirmed/unchanged
- Calendar: unchanged vs run 6 — no new events surfaced
- New fact: City of Hope actively recruiting Executive Director, Technology & AI Products - Healthcare ($92–153/hr) — two LinkedIn alerts Apr 10. Career intelligence routed to [[ALTON]].
- New fact: Guidepoint time-sensitive advisory project (Clinical Trial Technology Solutions, Yasmin Goodman) — accept/decline pending. Routed to [[ALTON]].
- Outstanding: Vayu Ellis Island physical form still unsubmitted; trip is Apr 17 (6 days). No reply confirmed in inbox.
- Outstanding: April 15 deadline — 4 days. Personal 1040/4868 + NJ-1065 $450 decision still open.
- SSH check: gpuserver1 unavailable from this runtime (command not found)
- Updated: [[ALTON]], `daily/2026-04-11.md`
- Created: `data/gather-alerts.md`, `data/heartbeat-log.csv`

## [2026-04-11] ingest | personal-data-gather run 8 — Gmail + Calendar harvest

- Sources: Gmail (50 msgs scanned, unread after:2026/04/10), 5 Google Calendars (7-day window Apr 11–18)
- Facts gathered: 3 new signals; all prior outstanding items confirmed unchanged
- Calendar: unchanged vs runs 6 and 7 — no new events on any of the 5 calendars
- New fact: Director, Drug Safety Physician role via Jobgether (LinkedIn alert Apr 10) — career market intelligence. Routed to [[ALTON]].
- New fact: Weltrio Medical Director — remote/contract (LinkedIn alert Apr 10) — career market intelligence. Routed to [[ALTON]].
- New fact: Scale AI (SCAI) pre-IPO opportunity live on EquityZen (Apr 11). Financial signal. Routed to [[ALTON]].
- Outstanding: Vayu Ellis Island physical form — trip Apr 17 (6 days), still unsubmitted
- Outstanding: April 15 deadlines — 4 days (1040/4868, NJ-1065 $450)
- Outstanding: Goddard summer forms due April 13 (2 days)
- Outstanding: April 18 conflict (soccer vs Rafi party) unresolved
- SSH check: gpuserver1 unavailable from this runtime (command not found)
- Updated: [[ALTON]], `daily/2026-04-11.md`, `data/gather-alerts.md`, `data/heartbeat-log.csv`

## [2026-04-11] ingest | personal-data-gather run 10 — Gmail + Calendar harvest

- Sources: Gmail (15 msgs scanned, after:2026/04/11), 5 Google Calendars (7-day window Apr 11–18)
- Facts gathered: 4 new signals; 2 major resolutions
- **KEY RESOLUTION: Vayu Ellis Island physical form confirmed SENT** Apr 10 9:35 PM EDT (alto84@gmail.com → dvaneerde@mka.org, signed form attached). Closes blocker open since 2026-02-18.
- **KEY RESOLUTION: Vishala MKA physical form confirmed SENT** Apr 10 9:25 PM EDT (→ rmasters@mka.org). Closes Apr 8 todo.
- New fact: Enzo Tech Group Director of AI (Fortune 500, LinkedIn, actively recruiting) — career intelligence [[ALTON]]
- New fact: Global Safety Medical Director, Rare Disease (Ladders, $272K–$341K/yr) — career intelligence [[ALTON]]
- New fact: Gym Day 2026 registration open — Tumble Zone LLC, May 30, $25. [[vishala]]
- New fact: myHomeIQ April report — 85 Stonebridge value increased. [[ALTON]]
- Calendar: unchanged vs runs 6–9, no new events on any of 5 calendars
- SSH check: gpuserver1 unavailable from this runtime (command not found)
- Updated: [[family/vayu]], [[family/vishala]], [[family/active-todos]], [[ALTON]], `daily/2026-04-11.md`

## [2026-04-12] ingest | personal-data-gather run 4 — Gmail + Calendar harvest

- Sources: Gmail (30 msgs scanned, is:unread newer_than:2d), 5 Google Calendars (7-day window Apr 12–19)
- Facts gathered: 1 new signal; all prior outstanding items confirmed unchanged
- New fact: TheSequence Radar #841 — Anthropic, Meta, Z.ai each released new models this week. Research signal.
- Calendar: unchanged vs runs 1–3 and 6–10; no new events on any of 5 calendars
- Confirmed critical: **Goddard summer forms due TOMORROW April 13** (T-1)
- Confirmed: April 15 deadlines (1040/4868 + NJ-1065 $450) — 3 days
- Confirmed: April 17 coverage conflict (Vishala dance + Vayu Ellis Island) — unresolved
- Confirmed: April 18 conflict (soccer double-header vs Rafi's party) — unresolved
- SSH check: gpuserver1 unavailable from this runtime (command not found)
- Created: `data/` directory (did not exist), `data/gather-alerts.md`, `data/heartbeat-log.csv`
- Updated: `daily/2026-04-12.md`

## [2026-04-12] ingest | personal-data-gather run 5 — Gmail + Calendar harvest

- Sources: Gmail (34 msgs scanned, after:2026/04/11, -promotions/-social), 5 Google Calendars (7-day window Apr 12–19)
- Facts gathered: 3 new signals (1 ACTION_REQUIRED, 1 resolved todo, 1 informational)
- **NEW ACTION_REQUIRED: CAQH ProView reattestation** — Alton's medical credentialing profile expired; affects insurance reimbursements and hospital privileges. First flagged this run.
- **RESOLVED: Chewy Rx order #5132136807** placed Apr 12 via rx@chewy.com — likely Loki's chlorambucil reorder (pending confirmation on item).
- New informational: CRG Watertown late open 4/13 (3 PM–11 PM); Regeneron Director GPS Sciences LinkedIn alert; Catalyst Director Medical Info LinkedIn alert.
- Calendar: unchanged vs runs 1–4 and 6–11; no new events on any of 5 calendars
- SSH check: gpuserver1 unavailable from this runtime (command not found)
- Updated: [[ALTON]], [[family/active-todos]], `daily/2026-04-12.md`
- Created: `data/gather-alerts.md` (13 alerts), `data/heartbeat-log.csv`

## [2026-04-11] ingest | personal-data-gather run 9 — Gmail + Calendar harvest

- Sources: Gmail (8 msgs scanned, unread after:2026/04/11), 5 Google Calendars (7-day window Apr 11–18)
- Facts gathered: 2 new signals; 10 confirmed/unchanged from prior runs
- Calendar: unchanged vs runs 6, 7, 8 — no new events on any of the 5 calendars
- New fact: Pool Guyz LLC service completed Apr 11 (7:56 AM), Service Log #36510285, Danny Saracho, main pool checkup at 85 Stonebridge Rd. Routed to [[ALTON]].
- New fact: Zintro advisory inquiry — Rare Disease Payer Insights (Z198433, Lexi Pearson, lexi.p@zintro.com, Apr 10). Paid research study, accept/decline pending. Routed to [[ALTON]].
- Outstanding: Vayu Ellis Island physical form — trip Apr 17 (6 days), still unsubmitted
- Outstanding: April 15 deadlines — 4 days (1040/4868, NJ-1065 $450)
- Outstanding: Goddard summer forms due April 13 (2 days)
- Outstanding: April 18 conflict (soccer vs Rafi party) unresolved
- SSH check: gpuserver1 unavailable from this runtime (command not found)
- Updated: [[ALTON]], `daily/2026-04-11.md`, `data/gather-alerts.md`, `data/heartbeat-log.csv`

## [2026-04-12] ingest | personal-data-gather run 6 — Gmail + Calendar harvest

- Sources: Gmail (38 msgs scanned, after:2026/04/11, -promotions/-social), 5 Google Calendars (7-day window Apr 12–19)
- Facts gathered: 4 new signals (all INFORMATIONAL); all prior open items confirmed outstanding
- New fact: Sky Zone waiver signed at ~3:04 PM ET — confirms family at Zoe's birthday party today. Event live.
- New fact: CVS Cedar Grove receipt, Apr 12 ~2:49 PM ET. Routine household expense.
- New fact: AAPI NJ newsletter ("How Do We Show We Belong?"). No action.
- New fact: Bausch+Lomb Head of Enterprise AI Solution (LinkedIn, actively recruiting). Career market intelligence. Routed to [[ALTON]].
- Calendar: unchanged vs runs 1–5 and 6–11; no new events on any of 5 calendars
- data/ directory recreated (was absent from filesystem)
- Critical outstanding: Goddard summer forms due TOMORROW (Apr 13); CAQH reattestation ACTION_REQUIRED; Apr 15 tax decisions (3 days)
- SSH check: gpuserver1 unavailable from this runtime (command not found)
- Updated: `daily/2026-04-12.md`, `data/gather-alerts.md`, `data/heartbeat-log.csv`

## [2026-04-09] refactor | Adopt Karpathy LLM-Wiki two-spine pattern

- Added this `log.md` as the append-only ledger spine file
- Planned: upgrade [[INDEX]] to a categorized catalog with one-line summaries
- Planned: add `wiki.py --lint` for periodic contradiction/staleness audits
- Planned: update [[LLM-WIKI-ARCHITECTURE]] with Karpathy provenance
- Source: Karpathy gist (442a6bf555914893e9891c11519de94f) bundled as a skill in Nous Research Hermes Agent v2026.4.8

## [2026-04-09] repair | Restored memory v2 after curator regression

- Nightly consolidation (commit ecf408e) on 2026-04-09 reverted the 2026-04-07 memory v2 upgrade for 8 files: [[TAXES]], [[INDEX]], [[SELF]], [[ASTRAZENECA]], [[LEARNINGS]], [[MACHINES]], [[PROCEDURES]], [[PROJECTS]]
- Commit fdad424 restored them from 03b6f72
- Added `sartor/memory/feedback/feedback_preserve_frontmatter.md` as an auto-injected rule to prevent future regressions
- Known limitation: the underlying autoDream bug is not fixed; nightly consolidation may regress again

## [2026-04-09] ingest | Kids ledger created

- New file: `sartor/memory/ledgers/kids.md`
- Opening balances: [[FAMILY#Vayu]] $10, [[FAMILY#Vishala]] $0, [[FAMILY#Vasu]] $0
- Linked from [[FAMILY]]
- Rules: append-only transaction tables, whole-dollar amounts, no deletions (corrections as new rows)

## [2026-04-09] refactor | LLM Wiki layer built

- New file: `sartor/memory/wiki.py` (1080 lines, zero external deps for core)
- New directory: `sartor/memory/indexes/` with generated backlinks.json, tag-index.json, orphans.json, broken-links.json, and `_index.md` entry point
- New agent: `.claude/agents/wiki-reader.md` — bounded query agent
- New scheduled task: `.claude/scheduled-tasks/wiki-reindex/SKILL.md` — Hermes-pattern nightly reindex
- New architecture doc: [[LLM-WIKI-ARCHITECTURE]]
- New portable skill: `.claude/skills/build-llm-wiki/SKILL.md` — 558 lines, self-contained, for AZ/work environment
- Design spec: `docs/superpowers/specs/2026-04-08-sartor-llm-wiki-design.md`

## [2026-04-07] refactor | Multi-machine memory consolidation (v2)

- Windows junction on Rocinante: `~/.claude/projects/C--Users-alto8/memory` → `sartor/memory/`
- Symlinks on gpuserver1: both `/-home-alton/` and `/-home-alton-Sartor-claude-network/` Claude Code project dirs → `sartor/memory/`
- New architecture doc: [[MULTI-MACHINE-MEMORY]]
- Inbox pattern: per-machine `inbox/{hostname}/` directories, curator drains on hub
- Bootstrap evidence: `inbox/gpuserver1/2026-04-07T15-00-00Z-bootstrap.md`
- Preserved gpuserver1-only disk-management notes to `sartor/memory/reference/gpuserver1-operations.md`

## [2026-04-07] refactor | Memory system v2: frontmatter + callouts + wikilinks

- All 14 core memory files migrated to YAML frontmatter + Obsidian callouts
- New spec: `sartor/memory/reference/MEMORY-CONVENTIONS.md` — single source of truth
- New auto-injected rule: `sartor/memory/feedback/feedback_memory_conventions.md`
- New entrypoint: `sartor/memory/MEMORY.md`
- Pattern source: kepano/obsidian-skills + Karpathy LLM-Wiki + Sartor Hermes bounded-memory

## [2026-04-10] ingest | personal-data-gather run 4 -- blocked, output files written

- Status: BLOCKED (34th consecutive blocked run, reconstructed count) -- Gmail MCP and Google Calendar MCP unavailable
- Sources checked: 0 (MCPs not in session tool registry)
- Facts gathered: 0 new; all intelligence carried from 2026-04-04 and 2026-04-09 harvests
- Pages updated: `sartor/memory/daily/2026-04-10.md` (run 4 appended), `sartor/memory/log.md`
- Output files written: `data/gather-alerts.md` (10 alerts, urgency-ranked), `data/heartbeat-log.csv` (34-entry reconstructed history)
- Critical alerts active: Sante Total 990 to Barbara Weis (deadline TODAY, Apr 10), GPU #52271 offline (~145+ hrs), Wohelo $500 deposit (TODAY)
- Infrastructure blocker: Gmail+GCal MCP entries missing from `.claude/mcp-config.json`; Windows paths non-functional on Linux runtime

## [2026-04-11] ingest | personal-data-gather run 11 — Gmail + Calendar harvest

- Sources: Gmail (23 msgs scanned, unread after:2026/04/11), 5 Google Calendars (7-day window Apr 11–18)
- Facts gathered: 2 new signals; all prior findings confirmed unchanged
- Calendar: unchanged vs runs 6–10 — no new events on any of the 5 calendars
- New fact: Handshake AI "Project Alloy" reminder (Apr 11 4:50 PM) — AI answer evaluation, up to $125/hr, flexible remote. Prior invite exists, accept/decline pending. Routed to [[ALTON]].
- New fact: Medscape CME — "Evolving Strategies for Stroke Prevention" CME/CNE/CPE, May 19, 2026. Free virtual event. Routed to [[ALTON]].
- Outstanding (carried): Apr 13 Goddard summer forms (2 days), Apr 15 tax deadlines (4 days), Apr 18 soccer/Rafi conflict, Aneeta CSA workshift, Guidepoint + Zintro advisory decisions pending, Tribeca Pediatrics $170.28
- SSH check: gpuserver1 unavailable from this runtime
- Updated: [[ALTON]], `daily/2026-04-11.md`, `data/gather-alerts.md`, `data/heartbeat-log.csv`

## [2026-04-12] ingest | personal-data-gather run 2 — Gmail + Calendar harvest

- Sources: Gmail (23 msgs scanned, after:2026/04/11), 5 Google Calendars (7-day window Apr 12–19)
- Facts gathered: 1 new signal; all others confirmed/unchanged from prior runs
- Calendar: unchanged vs run 1 and runs 6–11 — no new events on any of the 5 calendars
- New fact: ZXOLDZX 3 Pairs Kids Soccer socks DELIVERED (Apr 12 1:24 AM, 19d7f4a8a3e65923). Was SHIPPED in run 1. Informational.
- Outstanding: Goddard summer forms DUE TOMORROW (Apr 13) — T-1 critical; Apr 15 tax deadlines (3 days); Tribeca $170.28 pre-collections risk; Apr 17 coverage conflict; Apr 18 soccer/Rafi conflict; advisory decisions pending (Guidepoint, Zintro, Handshake)
- SSH check: gpuserver1 unavailable from this runtime
- Updated: `daily/2026-04-12.md`, `data/gather-alerts.md`, `data/heartbeat-log.csv`

## [2026-04-12] ingest | personal-data-gather run 1 — Gmail + Calendar harvest

- Sources: Gmail (22 msgs scanned, after:2026/04/11), 5 Google Calendars (7-day window Apr 12–19)
- Facts gathered: 5 new signals; 12 confirmed/unchanged
- Calendar: unchanged vs runs 6–11 (Apr 11) — no new events on any of the 5 calendars
- New fact: M3 Global Research daily neurology physician surveys available. Routed to [[ALTON]].
- New fact: Amazon boys' athletic shorts delivered; kids soccer gear in transit. Informational.
- New fact: Venmo March 2026 transaction history available.
- New fact: Silantro Lime Tacos $37.10 lunch receipt Apr 11.
- Escalation: Goddard summer forms now 1 day away (due Apr 13). Escalated to critical in [[family/vasu]] and [[family/active-todos]].
- Outstanding: Apr 15 tax deadlines (3 days), Tribeca Pediatrics $170.28, Apr 17 coverage conflict, Apr 18 soccer/Rafi decision, Aneeta CSA workshift, Guidepoint + Zintro advisory decisions
- SSH check: gpuserver1 unavailable from this runtime
- Updated: [[ALTON]], [[family/vasu]], [[family/active-todos]], `daily/2026-04-12.md`, `data/gather-alerts.md`, `data/heartbeat-log.csv`

## [2026-04-12] ingest | personal-data-gather run 3 — Gmail + Calendar harvest

- Sources: Gmail (23 msgs scanned, after:2026/04/11), 5 Google Calendars (7-day window Apr 12–19)
- Facts gathered: 0 new signals; all confirmed/unchanged from prior runs
- Calendar: unchanged vs runs 1–2 and 6–11 — no new events on any of the 5 calendars
- All prior open signals confirmed active: Goddard forms (due tomorrow Apr 13), Apr 15 tax deadlines (3 days), Tribeca $170.28 pre-collections, Apr 17 coverage conflict, Apr 18 soccer/Rafi conflict, Guidepoint + Zintro + Handshake advisory decisions, Summit Health portal, Aneeta CSA email invalid
- SSH check: gpuserver1 unavailable from this runtime
- data/ directory created on disk; gather-alerts.md and heartbeat-log.csv written
- Updated: `daily/2026-04-12.md`, `data/gather-alerts.md`, `data/heartbeat-log.csv`

## History

- 2026-04-09: Log spine file created as part of Karpathy pattern adoption
