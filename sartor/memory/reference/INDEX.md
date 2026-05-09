---
type: hub
level: 2
entity: reference-index
updated: 2026-05-08
last_verified: 2026-05-08
related: [PROCEDURES, MACHINES, HOUSEHOLD-CONSTITUTION, OPERATING-AGREEMENT]
tags: [meta/index, domain/reference]
---

# Reference Directory Index

Sub-directory hub for `sartor/memory/reference/`. Covers governance docs, memory architecture, curator spec, machine references, and operational artifacts.

## Governance

- [[reference/HOUSEHOLD-CONSTITUTION|HOUSEHOLD-CONSTITUTION]]: **Household constitution v0.5 (active, ratified 2026-05-06).** First-person, concepts-and-values framing, six hard constraints. Two audiences: a Claude in a fresh context window, and a future fine-tuned Sartor Home Agent.
- [[reference/OPERATING-AGREEMENT|OPERATING-AGREEMENT]]: Rocinante / gpuserver1 (and now rtxpro6000server) operating agreement v1.0, ratified 2026-04-12. Governs lateral peer coordination; subordinate to the Constitution.
- [[reference/AGREEMENT-SUMMARY|AGREEMENT-SUMMARY]]: Plain-language summary of the operating agreement; quick reference.

### Ratification records

- [[reference/CONSTITUTION-RATIFICATIONS/v0.3|v0.3 ratification]]: 2026-04-19. v0.3 was the prior canonical document.
- [[reference/CONSTITUTION-RATIFICATIONS/v0.5|v0.5 ratification]]: 2026-05-06. Current. Concurrent with directive to run fine-tuning experiments on smaller models.

### Archived (under `reference/archive/`)

- [[archive/HOUSEHOLD-CONSTITUTION-v0.1|HOUSEHOLD-CONSTITUTION-v0.1]]: first draft, 2026-04-11.
- [[archive/HOUSEHOLD-CONSTITUTION-v0.2|HOUSEHOLD-CONSTITUTION-v0.2]]: deeper second draft addressing base-model inheritance, 2026-04-11.
- [[archive/HOUSEHOLD-CONSTITUTION-v0.3|HOUSEHOLD-CONSTITUTION-v0.3]]: first ratified version (2026-04-19); superseded by v0.5.
- [[archive/HOUSEHOLD-CONSTITUTION.v0.4.proposed-2026-05-04|HOUSEHOLD-CONSTITUTION.v0.4.proposed-2026-05-04]]: v0.4 amendment proposal, preserved as archived proposal; absorbed into v0.5.
- [[archive/OPERATING-AGREEMENT-DRAFT-GPUSERVER1|OPERATING-AGREEMENT-DRAFT-GPUSERVER1]]: gpuserver1 draft superseded by canonical OPERATING-AGREEMENT (archived 2026-04-16).
- [[archive/OPERATING-AGREEMENT-DRAFT-ROCINANTE|OPERATING-AGREEMENT-DRAFT-ROCINANTE]]: Rocinante draft superseded by canonical OPERATING-AGREEMENT (archived 2026-04-16).

## Memory Architecture

- [[reference/MEMORY-CONVENTIONS|MEMORY-CONVENTIONS]]: YAML frontmatter spec, callout format, wikilink resolution rules, controlled type vocabulary. v0.3 (2026-04-18) adds typed wikilinks (`rel:` prefix) with the `works_at` / `parent_of` / `owns` / `invested_in` / `married_to` / `located_in` / `depends_on` / `supersedes` / `archived_from` starting vocabulary; the extractor at `sartor/memory/extract_graph.py` emits `data/graph.jsonl` on each curator pass.
- [[reference/MULTI-MACHINE-MEMORY|MULTI-MACHINE-MEMORY]]: Multi-machine memory architecture: inbox pattern, per-machine write queues, curator drain on Rocinante.
- [[reference/LLM-WIKI-ARCHITECTURE|LLM-WIKI-ARCHITECTURE]]: LLM-optimized wiki design: hub-and-spoke topology, backlink discipline, page-size recommendations.
- [[reference/federated-memory-map|federated-memory-map]]: Federated memory topology (rtxserver bare repo as canonical; GitHub mirror; per-peer write paths).
- [[reference/skill-conventions|skill-conventions]]: Conventions for `.claude/skills/` files (frontmatter, registration, registry placement).

## Curator Specification

- [[reference/memory-curator-agent|memory-curator-agent]]: Curator agent definition: what the nightly curator reads, writes, and decides.
- [[reference/CURATOR-BEHAVIOR|CURATOR-BEHAVIOR]]: Behavioral rules for the curator: what it may and may not modify autonomously.
- [[reference/EXECUTION-PLAN|EXECUTION-PLAN]]: Memory system v2 execution plan (phase breakdown, deliverables, owners).
- [[reference/LOGGING-INDEX|LOGGING-INDEX]]: Authoritative map of all log files across machines.
- [[reference/search-first-audit-log|search-first-audit-log]]: Audit log of the search-first/orient-then-act discipline rollouts.

## Machine references

- [[reference/gpuserver1-monitoring|gpuserver1-monitoring]]: gpuserver1 monitoring architecture (written 2026-04-11; cron references pre-cleanup).
- [[reference/gpuserver1-power-logging|gpuserver1-power-logging]]: Power logging architecture and wattage baselines.
- [[reference/gpuserver1-operations|gpuserver1-operations]]: Disk management, symlink setup, Claude Code paths on gpuserver1.
- [[reference/gpuserver1-delegation|gpuserver1-delegation]]: Delegation pattern: autonomous vs. routed decisions for gpuserver1.
- [[reference/network|network]]: Home network reference (Verizon Fios, UniFi controller, DMZ topology).

## Multi-Machine Protocols and Triage

- [[reference/rocinante-working-tree-triage-2026-04-12|rocinante-working-tree-triage-2026-04-12]]: Triage report of Rocinante working tree as of 2026-04-12; used during cron cleanup.
- [[reference/system-review-2026-04-18|system-review-2026-04-18]]: System review snapshot 2026-04-18.
- [[reference/gstack-review-2026-04-18|gstack-review-2026-04-18]]: gstack review snapshot 2026-04-18.

## Research notes and proposals

- [[reference/vastai-dispatch-wrapper-proposal|vastai-dispatch-wrapper-proposal]]: Proposal for a vastai CLI wrapper with structured output and error handling.
- [[reference/reference_vastai_market_pricing|reference_vastai_market_pricing]]: vastai market pricing data and search commands for RTX 5090 comps.
- [[reference/obsidian-control-research|obsidian-control-research]]: Research notes on Obsidian Local REST API and mcp-obsidian plugin for memory visualization.
- [[reference/microsoft-store-pua-pattern|microsoft-store-pua-pattern]]: Note on Microsoft Store PUA detection pattern.

## Operational artifacts

- [[reference/google-drive-catalog-2026-05-02|google-drive-catalog-2026-05-02]]: Catalog snapshot of Alton's Google Drive, 2026-05-02.
- `heloc-2025-10/`: HELOC closing package (Symmetry/CCM/Cenlar). 9 files, 2025-09 through 2025-10.
- `solar-project-2026-05/`: Solar project package (Climate First, Lucent, Tesla Solar Roof, tree removal). 11 files spanning 2025-09 through 2026-05.

## Notes

- The Constitution at v0.5 is canonical. The Operating Agreement is subordinate to the Constitution per Constitution §14.
- `sartor/memory/reference_memory_server.md` (note: at memory root, not under `reference/`) is the canonical doc on the federated git architecture; if anything in the project-root CLAUDE.md or the Operating Agreement disagrees with it, that file wins.
- New-host onboarding: `sartor/memory/procedures/vastai-host-onboarding.md` (procedure, not reference).
