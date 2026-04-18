---
type: hub
level: 2
entity: reference-index
updated: 2026-04-16
last_verified: 2026-04-16
related: [PROCEDURES, MACHINES]
tags: [meta/index, domain/reference]
---

# Reference Directory Index

Sub-directory hub for `sartor/memory/reference/`. Covers governance docs, memory architecture, curator spec, and gpuserver1 operational references.

## Governance and Operating Agreements

- [[reference/OPERATING-AGREEMENT|OPERATING-AGREEMENT]] — Canonical operating agreement: Rocinante as sole git authority, gpuserver1 as inbox-write-only, memory consolidation rules
- [[reference/AGREEMENT-SUMMARY|AGREEMENT-SUMMARY]] — Plain-language summary of the operating agreement; use as quick reference
- [[reference/HOUSEHOLD-CONSTITUTION|HOUSEHOLD-CONSTITUTION]] — Household constitution v0.2 (active): governance rules for the Sartor home agent system

### Archived (under `reference/archive/`)

- [[reference/archive/OPERATING-AGREEMENT-DRAFT-GPUSERVER1|OPERATING-AGREEMENT-DRAFT-GPUSERVER1]] — gpuserver1 draft superseded by canonical OPERATING-AGREEMENT (archived 2026-04-16)
- [[reference/archive/OPERATING-AGREEMENT-DRAFT-ROCINANTE|OPERATING-AGREEMENT-DRAFT-ROCINANTE]] — Rocinante draft superseded by canonical OPERATING-AGREEMENT (archived 2026-04-16)
- [[reference/archive/HOUSEHOLD-CONSTITUTION-v0.1|HOUSEHOLD-CONSTITUTION-v0.1]] — Household constitution v0.1 (superseded by v0.2; relocated to archive 2026-04-16)

## Memory Architecture

- [[reference/MEMORY-CONVENTIONS|MEMORY-CONVENTIONS]] — YAML frontmatter spec, callout format, wikilink resolution rules, controlled type vocabulary
- [[reference/MULTI-MACHINE-MEMORY|MULTI-MACHINE-MEMORY]] — Multi-machine memory architecture: inbox pattern, per-machine write queues, curator drain on Rocinante
- [[reference/LLM-WIKI-ARCHITECTURE|LLM-WIKI-ARCHITECTURE]] — LLM-optimized wiki design: hub-and-spoke topology, backlink discipline, page-size recommendations

## Curator Specification

- [[reference/memory-curator-agent|memory-curator-agent]] — Curator agent definition: what the nightly curator reads, writes, and decides
- [[reference/CURATOR-BEHAVIOR|CURATOR-BEHAVIOR]] — Behavioral rules for the curator: what it may and may not modify autonomously
- [[reference/EXECUTION-PLAN|EXECUTION-PLAN]] — Memory system v2 execution plan (phase breakdown, deliverables, owners)
- [[reference/LOGGING-INDEX|LOGGING-INDEX]] — Authoritative map of all log files across both machines

## gpuserver1 Operational References

- [[reference/gpuserver1-monitoring|gpuserver1-monitoring]] — gpuserver1 monitoring architecture (written 2026-04-11; cron references pre-cleanup)
- [[reference/gpuserver1-power-logging|gpuserver1-power-logging]] — Power logging architecture and wattage baselines
- [[reference/gpuserver1-operations|gpuserver1-operations]] — Disk management, symlink setup, Claude Code paths on gpuserver1
- [[reference/gpuserver1-delegation|gpuserver1-delegation]] — Delegation pattern: autonomous vs. routed decisions for gpuserver1

## Multi-Machine Protocols

- [[reference/rocinante-working-tree-triage-2026-04-12|rocinante-working-tree-triage-2026-04-12]] — Triage report of Rocinante working tree as of 2026-04-12; used during cron cleanup

## Research Notes and Proposals

- [[reference/vastai-dispatch-wrapper-proposal|vastai-dispatch-wrapper-proposal]] — Proposal for a vastai CLI wrapper with structured output and error handling
- [[reference/reference_vastai_market_pricing|reference_vastai_market_pricing]] — vastai market pricing data and search commands for RTX 5090 comps
- [[reference/obsidian-control-research|obsidian-control-research]] — Research notes on Obsidian Local REST API and mcp-obsidian plugin for memory visualization
