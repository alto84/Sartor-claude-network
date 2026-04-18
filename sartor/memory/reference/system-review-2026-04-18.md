---
name: system-review-2026-04-18
description: Comprehensive 5-audit review of Sartor's Claude Code system alongside the gstack port implementation. Top findings and prioritized action list. Produced by a 7-agent parallel review team applying the session's interior-report discipline and completeness-principle.
type: reference
updated: 2026-04-18
updated_by: Claude (Opus 4.7 1M) orchestrator + 7 analysis agents
tags: [reference, meta/review, action-list]
related: [gstack-review-2026-04-18, skill-conventions, completeness-principle, MEMORY]
---

# System review — 2026-04-18

Full audit reports at `experiments/2026-04-18-gstack-port/` (outside repo). This file is the stable digest and unified action list.

## The two gstack ports evaluated

- **Typed wikilinks (`rel:` prefix):** ADOPTED. MEMORY-CONVENTIONS v0.3 amended, `extract_graph.py` shipped stdlib-clean, 21 edges extracted from a seeded set, graph sidecar at `data/graph.jsonl`. Follow-ups: wire to nightly-memory-curation, add `--validate` mode to catch unresolved targets.
- **`{{PREAMBLE}}` template pattern:** DECLINED on evidence. Cato-style prosecution of my own gstack-review proposal: the premise (duplicated house-voice scaffolding in skills) turned out to be wrong. House voice lives in `.claude/rules/` and CLAUDE.md, shipped in-context every session. Actual shared content across 30 skills is ~15 lines. Template pipeline would add +32 authored lines for ~0 lines of deduplication benefit. Alternative shipped: `reference/skill-conventions.md` memo.
- **Completeness Principle:** ADOPTED. New `feedback/completeness-principle.md` behavioral primitive with enumerated decision procedure.

## Five audits: one-line each

- **Skills:** 30 dirs + 8 loose files, only 12 in CLAUDE.md. Multi-agent coordination cluster = ~130KB describing Raft/BFT/CRDT for a household agent spawning ≤7 subagents. `evidence-based-engineering` duplicates `evidence-based-validation` (25KB each). `safety-research-workflow` (41KB) superseded by `research-effort` (10KB). Zombie references into nonexistent `AGENT_INIT.md`, `SPAWNING_TEMPLATE.md`. Only 3 of 30 skills carry `updated:` frontmatter. Named success: domain-execution skills (morning-briefing, gpu-fleet-check, nonprofit-deadline-scan, tax-estimate) are uniformly load-bearing and well-designed.
- **Memory architecture:** 79.8% frontmatter compliance (217/272). 26.9% of wikilinks unresolved — ~200 of 264 orphans from one speculative `mini-lab-2026-04-11` cell-therapy stub project. **53-item proposed-memories backlog** untouched (2026-04-14 folder 20 items, 2026-04-16 folder 20 items with real unmerged facts: Aneeta employer change, CAQH reattestation, Wohelo $12.9K, Chase Sapphire fraud reissue). Curator has run once as dry-run; live-apply overdue.
- **Scheduled tasks:** GREEN 1 / YELLOW 0 / RED 9. Structural split: ten SKILL.md files in `.claude/scheduled-tasks/` are Claude-prompt templates that no harness invokes; six Windows-scheduled Python modules under `sartor/` do the actual work. Six SKILL.md files have zero OS registration AND zero output evidence. `weekly-skill-evolution` (the gstack-flagged compounding loop) is not firing. `SartorHeartbeat` silent since 2026-04-12.
- **Agents:** 18 on disk, 14 in CLAUDE.md. Four undocumented: auditor, critic, sentinel, wiki-reader. Schema drift: `wiki-reader` uses `allowed-tools` instead of `tools`. `family-scheduler` declares Calendar responsibilities with no MCP tools in its list. **Gstack 23-role collapse pathology does NOT apply at Sartor's scale.** 18 agents have genuine functional separation (GPU/nonprofit/family/tax/research), closest overlap is auditor/critic at ~65%. Documentation drift is the larger issue.
- **Integration (cross-system):** CLAUDE.md truth rate ~71%. Failure mode is uniform under-reporting, not contradiction. 100% forward / 41% reverse on skills. `self-improvement-loop` is a zombie in the scheduled-tasks table. OPERATING-AGREEMENT §2.3 drift: gpuserver1 `_heartbeat.md` stuck at `1970-01-01T00:00:00Z`, curator log has one 2026-04-16 entry. Both load-bearing continuous-operation obligations degraded.

## Prioritized unified action list

### P0 (real-world consequences, this week)

1. **Drain the 53-item proposed-memories backlog.** Contains real unmerged signals (CAQH deadline, Wohelo check $12.9K, Aneeta employer change, Chase fraud reissue). These are items Alton is losing visibility on because the curator has not live-applied.
2. **Rebuild the heartbeat.** `SartorHeartbeat` has been silent 6 days. Without it, the system cannot detect its own failures. Either re-enable `heartbeat.py` or replace.
3. **Wire `weekly-skill-evolution`.** Port to a `sartor.skill_evolution` Python module on the same `.cmd`-shim harness pattern as the other live Windows tasks; OS-register for Sundays 03:00. This is the compounding loop the gstack review specifically flagged; without it the skill library does not improve itself.

### P1 (system coherence, this month)

4. **Update CLAUDE.md truthfully.** Skills table 12 → 30 (include today's `alton-voice`, `interior-report-discipline`, plus the 15 undocumented skill dirs). Agents 14 → 18 (add auditor, critic, sentinel, wiki-reader). Commands: add `/bootstrap`, `/research`. Scheduled tasks: resolve or remove `self-improvement-loop`; add `todo-sync`, `wiki-reindex`, `personal-data-gather`.
5. **Delete or merge duplicate skills.** `evidence-based-engineering` → merge into `evidence-based-validation` (pick one). `safety-research-workflow` (41KB) → archive or merge into `research-effort` (10KB). Coordination cluster (`multi-agent-orchestration` + `agent-communication-system` + `agent-coordinator` + `agent-introspection` + 3 loose files = ~130KB) → collapse into one `multi-agent-patterns` skill at ≤20KB; the elaborate Raft/BFT/CRDT scaffolding is for a scale Sartor does not operate at.
6. **Fix OPERATING-AGREEMENT §2.3 drift.** gpuserver1 heartbeat-amendment task (`inbox/gpuserver1/_tasks/2026-04-16_heartbeat-amendment.md`) has been pending for 2 days. Escalate or resolve.
7. **Bulk-migrate 9 older feedback files to v0.3 frontmatter.** Single-commit, low-effort, closes the largest single memory-compliance gap.

### P2 (structure, next month)

8. **Clean up mini-lab-2026-04-11 orphaned wikilinks.** 200 of 264 orphans trace to speculative stubs (CRS/ICANS/tocilizumab/risk-model) that were never created. Either create the stubs or convert the wikilinks to plain text.
9. **Wire `extract_graph.py` to nightly-memory-curation** so the graph sidecar stays fresh. Add `--validate` mode to warn on unresolved typed-link targets.
10. **Schema-drift fixes.** `wiki-reader.md`: rename `allowed-tools` → `tools`, add `permissionMode`/`maxTurns`/`memory`. `family-scheduler`: add Calendar MCP to its tool list OR document read-only scope.

## Methodological note

Every audit agent was briefed to apply the session's interior-report discipline and completeness-principle, and to carry forward the self-team discussion's norm of Cato-style prosecution before proposing. The effect was visible:

- The preamble-implementer prosecuted its own premise and declined the port on evidence.
- The wikilinks-implementer flagged four follow-up gaps explicitly rather than smoothing them.
- The agents-auditor explicitly named that gstack's role-collapse pathology DOES NOT apply to Sartor (refusing the easy "same pattern" finding).
- The skills-auditor named domain-execution skills as "uniformly load-bearing" alongside the duplication critique.

The discipline from this morning held across a full-system technical review. That is a result in its own right.

## Sources

All agent outputs at `C:\Users\alto8\experiments\2026-04-18-gstack-port\`:

- `wikilinks-impl.md` — typed-wikilinks implementation report
- `preamble-impl.md` — preamble evaluation with decline-on-evidence recommendation
- `skills-audit.md` — 900-word skills audit
- `memory-audit.md` — 1000-word memory architecture audit
- `scheduled-tasks-audit.md` — 700-word scheduled tasks audit
- `agents-audit.md` — 700-word agents audit
- `integration-audit.md` — 800-word cross-system audit

## History

- 2026-04-18: Created from 7-agent parallel review. Two gstack ports adopted, one declined on evidence; ten prioritized actions identified across three tiers.
