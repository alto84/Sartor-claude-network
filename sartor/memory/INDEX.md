---
type: meta
entity: INDEX
updated: 2026-04-09
updated_by: Claude
status: active
next_review: 2026-04-16
tags: [meta/index, meta/wiki, meta/spine]
aliases: [Index, Memory Index, Catalog]
related: [SELF, MEMORY, log, MEMORY-CONVENTIONS, LLM-WIKI-ARCHITECTURE]
---

# Sartor Memory Index

Categorized catalog of the Sartor memory wiki. One of the two spine files (the other is [[log]]), following Karpathy's LLM-Wiki pattern. Every entry is a wikilink + one-line summary. This file is regenerated or updated on every ingest.

## People

- [[ALTON]] — Emmett Alton Sartor: physician-scientist, AZ Medical Director, founder of Solar Inference LLC, Sante Total treasurer; Montclair NJ
- [[FAMILY]] — Aneeta Saxena + three children (Vayu 10, Vishala 8, Vasu 4) + three cats; Neurvati transition and household logistics

## Domains

- [[TAXES]] — TY2025 filing: personal 1040 + Solar Inference 1065 + Sante Total 990-N; three deadlines; Jonathan Francis CPA
- [[BUSINESS]] — Solar Inference LLC, Sante Total nonprofit, AstraZeneca career track; three business entities with entangled tax and timing
- [[ASTRAZENECA]] — AI safety research and Medical Director role; Senior Director application pending; Chief Patient Safety Officer external opportunity under evaluation
- [[PROJECTS]] — Active project tracking across Sartor, safety research, dashboard, and venture work
- [[MACHINES]] — Hardware inventory: Rocinante (Windows workstation), gpuserver1 (Ubuntu + RTX 5090), vast.ai listing, network topology

## Sartor system (meta)

- [[MEMORY]] — Canonical entrypoint; stable pointer replacing the old protected Claude Code directory
- [[SELF]] — Sartor system identity: heartbeat engine, autoDream consolidation, observer agents, gpuserver1 mirror
- [[MASTERPLAN]] — Phased roadmap with ten named projects; synthesized from five agent perspectives
- [[MASTERPLAN-VISIONARY]] — Vision statement for the long-term Sartor trajectory
- [[PROCEDURES]] — Operational workflows: SSH, git, PowerShell, Chrome automation
- [[LEARNINGS]] — Hard-won lessons from building and running Sartor; PowerShell dollar-sign traps, hairpin NAT fixes, Docker+UFW resolutions
- [[QUICK-REFERENCE]] — Fast lookup: commands, URLs, paths (freely editable)
- [[log]] — Append-only chronological ledger of wiki activity (the other spine file)

## Reference

- [[MEMORY-CONVENTIONS]] — YAML frontmatter schema, callout vocabulary, wikilink discipline, tag hierarchy, file templates
- [[MULTI-MACHINE-MEMORY]] — Hub-and-spoke inbox pattern for N-machine sync; Rocinante junction + gpuserver1 symlinks documented
- [[LLM-WIKI-ARCHITECTURE]] — How wiki.py, the indexes, the reader agent, and the scheduled task fit together
- [[gpuserver1-operations]] — Disk management notes, Docker/containerd trap, vast.ai Kaalia rules

## Ledgers

- [[ledgers/kids|Kids Ledger]] — Running allowance/debit ledger for Vayu, Vishala, Vasu; append-only transaction tables

## Feedback (auto-injected behavioral rules)

- `feedback/feedback_agent_bypass.md` — Always pass bypassPermissions on Agent invocations
- `feedback/feedback_memory_conventions.md` — Memory files follow MEMORY-CONVENTIONS.md
- `feedback/feedback_no_permissions.md` — Non-interactive permission mode
- `feedback/feedback_no_scheduled_task_edits.md` — Never edit files inside protected `.claude/` paths
- `feedback/feedback_permissions_fix.md` — Permissions configuration
- `feedback/feedback_preserve_frontmatter.md` — Curator must preserve frontmatter, callouts, wikilinks when consolidating
- `feedback/feedback_protected_paths.md` — Directory protection rules

## Snapshots (point-in-time, not navigable content)

- `snapshots/calendar-2026-04.md` — Calendar snapshot, April 2026
- `snapshots/downloads-inventory.md` — Downloads folder inventory
- `snapshots/gmail-2026-04.md` — Gmail snapshot, April 2026
- `snapshots/life-timeline.md` — Life timeline

## Research (standalone documents, not part of core graph)

- `research/cell-therapy-safety-monitoring-lifecycle.md` — AI-driven safety monitoring across cell therapy clinical development
- `research/graph-based-safety-prediction-research.md` — Graph-based approaches for pharmaceutical safety prediction
- `research/safety-knowledge-graph/` — CAR-T adverse event knowledge graph (CRS, ICANS, ICAHS, mitigations)

## Recent activity

See [[log]] for the append-only chronological ledger with parseable date prefixes.

For session-level activity, see `daily/{date}.md` files (not part of the core wiki graph).

## Generated indexes

See `indexes/` for machine-generated derived artifacts:
- `backlinks.json` — reverse wikilink index
- `tag-index.json` — tag → files map
- `orphans.json` — files with no incoming wikilinks
- `broken-links.json` — wikilinks with no resolvable target
- `_index.md` — Obsidian-visible entry point

## History

- 2026-04-02: Initial index format (file list with titles)
- 2026-04-07: Added YAML frontmatter (memory v2)
- 2026-04-09: Restructured as proper categorized catalog with one-line summaries, following Karpathy LLM-Wiki pattern
