---
type: meta
entity: log
updated: 2026-04-09
updated_by: Claude
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

## History

- 2026-04-09: Log spine file created as part of Karpathy pattern adoption
