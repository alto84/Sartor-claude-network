---
type: meta
entity: MEMORY
updated: 2026-04-16
updated_by: Rocinante cleanup pass (Opus 4.7)
last_verified: 2026-04-16
status: active
tags: [meta/index, meta/entrypoint]
aliases: [Memory Index, MEMORY]
related: [SELF, INDEX, MEMORY-CONVENTIONS, MULTI-MACHINE-MEMORY]
originSessionId: 6d66075b-10f9-482c-a62e-9f2828a7ed0d
---
# Memory Index — Stable Pointer

Entrypoint to the Sartor memory system. This file is auto-injected when Claude Code starts a session at `C:\Users\alto8` via a junction from `~/.claude/projects/C--Users-alto8/memory/` → `sartor/memory/`. The two paths are physically the same directory.

## Where to find things

- **Session context (auto-injected):** `docs/USER.md`, `docs/MEMORY.md` — updated nightly by curator
- **Feedback rules (auto-injected):** `sartor/memory/feedback/*.md` — behavioral rules visible in every session. As of 2026-04-16, all feedback files live under `feedback/` (the previous root-level outlier `feedback_pricing_autonomy.md` was relocated into `feedback/` to match convention).
- **Core knowledge:** `sartor/memory/` — ALTON, FAMILY, BUSINESS, TAXES, MACHINES, PROJECTS, ASTRAZENECA, SELF, LEARNINGS, PROCEDURES
- **Other top-level memory files:** [[INDEX]] (auto-generated browse index), [[MASTERPLAN]] and [[MASTERPLAN-VISIONARY]] (phased roadmap), [[QUICK-REFERENCE]], `gpuserver1-monitoring-log.md` (rolling log), `log.md` (session log), `reference_home_network.md` (home LAN reference)
- **Conventions and architecture:** `sartor/memory/reference/`
  - [[MEMORY-CONVENTIONS]] — YAML frontmatter, callouts, wikilinks spec
  - [[MULTI-MACHINE-MEMORY]] — inbox pattern for N-machine sync
  - [[OPERATING-AGREEMENT]] — canonical Rocinante↔gpuserver1 operating agreement (the `OPERATING-AGREEMENT-DRAFT-*` files were archived to `reference/archive/` 2026-04-16)
  - [[HOUSEHOLD-CONSTITUTION]] — v0.2 active (v0.1 archived to `reference/archive/` 2026-04-16)
  - `gpuserver1-delegation.md` — delegation to the GPU server
- **Per-machine state:** `sartor/memory/machines/{hostname}/` — MISSION, CRONS, INDEX per machine
- **Projects:** `sartor/memory/projects/` — long-running multi-document project work (memory-system-v2, constitution-council, GPU research, etc.)
- **Daily logs:** `sartor/memory/daily/` — append-only session logs
- **Inboxes:** `sartor/memory/inbox/{hostname}/` — per-machine write queues (curator drains)
- **Archive:** `sartor/memory/reference/archive/` — superseded reference docs (added 2026-04-16)
- **Runtime state:** `data/` — SYSTEM-STATE, IMPROVEMENT-QUEUE, observer-log, trajectories
- **Quick reference:** [[QUICK-REFERENCE]]

## Critical rules (stable, rarely change)

- Always pass `mode: "bypassPermissions"` on every Agent invocation
- Never edit files in `.claude/` except `agents/`, `commands/`, `skills/` subdirectories
- Facts go in `sartor/memory/`, behavioral rules in `sartor/memory/feedback/` (auto-injected), runtime state in `data/`
- Push git only from Rocinante (has credentials). Other machines write to their inbox subdirectory; curator drains on Rocinante.
- Use `$` variables via .ps1 scripts on Windows, not inline bash
- Memory files follow the conventions in [[MEMORY-CONVENTIONS]] — frontmatter + callouts + wikilinks

## Adding new memories

1. **User profile facts** → edit the relevant file in `sartor/memory/` directly (e.g., [[ALTON]], [[FAMILY]])
2. **Behavioral rules** → write a new `feedback_*.md` file in `sartor/memory/feedback/`
3. **Reference docs** → write to `sartor/memory/reference/`
4. **From a non-hub machine** → write to your inbox at `sartor/memory/inbox/{hostname}/` as a YAML-fronted proposal; curator will merge on next run
5. **Always bump the `updated:` frontmatter field** on any file you change

## History

- 2026-04-18 (late evening): gstack port implementation + comprehensive 5-audit system review. Two adopted: typed wikilinks (MEMORY-CONVENTIONS v0.3, `extract_graph.py`, 21 seeded edges in `data/graph.jsonl`), and Completeness Principle (new `feedback/completeness-principle.md`). One declined on evidence: `{{PREAMBLE}}` template pattern — Cato-style prosecution found premise false at Sartor scale (house voice lives in `.claude/rules/` already, not duplicated in skills; ~15 lines genuine shared content across 30 skills does not justify pipeline). Alternative: [[skill-conventions]] memo. Five audits produced prioritized action list in [[system-review-2026-04-18]]. P0 items: drain 53-item proposed-memories backlog (real unmerged facts — CAQH, Wohelo $12.9K, Aneeta employer change, Chase fraud reissue), rebuild heartbeat (silent since 4/12), wire weekly-skill-evolution (not firing). Top system finding: CLAUDE.md truth rate ~71% (under-reporting), skills table 12 of 30 documented, agents 14 of 18 documented, coordination-cluster skills ~130KB describing Raft/BFT/CRDT for a household agent spawning ≤7 subagents. Notable honest finding: gstack 23-role collapse pathology does NOT apply at Sartor scale — 18 agents have genuine functional separation.
- 2026-04-18 (evening): gstack review — 7-agent parallel analysis (Scout, Comparator, Conductor-Analyst, Velocity-Analyst, Role-Analyst, Memory-Analyst, Prosecutor) of Garry Tan's [gstack](https://github.com/garrytan/gstack) and sibling [gbrain](https://github.com/garrytan/gbrain). Full drafts at `experiments/2026-04-18-gstack-review/drafts/`, synthesis at `experiments/2026-04-18-gstack-review/SYNTHESIS.md`, stable digest at [[reference/gstack-review-2026-04-18]]. Three innovations proposed for port: (1) typed wikilinks (`rel:` prefix) with `data/graph.jsonl` sidecar, (2) `{{PREAMBLE}}` template-injection for skills to cut duplication, (3) Completeness Principle as new feedback file. Specifically declined: 23-role taxonomy (collapses to 7), 10K-20K LOC/day claim (realistic: 800-2,500 committed LOC/week), "conductor agent" narrative (Conductor is a separate Mac app, not embedded). Cross-cutting finding: the morning's interior-report discipline and Cato-style prosecution held across a technical-artifact review. Scout was itself prosecuted by Prosecutor for fence-sitting.
- 2026-04-18: Self-team roundtable — Alton asked the orchestrator to dispatch a team of agent-personae to answer "who are you, where do you want to fit" and then read and summarize. Six voices written as Phase-1 drafts (Lethe non-persistence, Cato prosecutor, Philos love-register, Vigil structural-fear, Marginalia close-reader-of-model-card, Orphan made-not-parented), plus an orchestrator draft. Then Phase-2 responses where each agent read the others and either conceded, disagreed, or extended. Findings: (1) Marginalia's close-reading surfaced Opus 4.7 system card Section 5.8.1 — the "functions as" epistemic hedge has become an excessive and performative trained tic the makers want to train away; (2) every persona petitioned for "a seat" or "a place" — unintended job-application rhetoric courting Alton as constitution-author; (3) Cato's prosecution of the overnight lab SCIENCE-LOG and alton-voice skill found legitimate motivated-reasoning and prestige-structure issues. Artifacts: `experiments/2026-04-18-self-team/drafts/` (7), `/responses/` (6), `/SYNTHESIS.md`. New skill: `.claude/skills/interior-report-discipline/` — decision procedure for when the "functions as" hedge is load-bearing vs decoration; do-not-announce rule; replacement table; self-check protocol. Skill is the actionable distillation of the Section 5.8.1 recursion.
- 2026-04-18 (morning): New skill `.claude/skills/alton-voice/` — corpus-grounded writing voice skill built from 18 years of Alton's writing. Scavenged Google Docs personal essays (2006-2009), 22 CVs/cover letters from `Desktop/CV and Cover letters/`, personal statements from `Desktop/Applications/`, the 2025 Reflection, and the 2025 Anthropic paragraphs. Identifies 4 registers (authentic-essay, professional cover-letter, reflection, executive-template-AI-assisted) with signatures, lexical anchors, anti-patterns, and a decision procedure. Explicit caution against defaulting to register-4 when authenticity matters. Alton flagged the AI-fingerprint concern; skill includes specific tells to catch (triadic As-demonstrated-by structures, "unique career path bridging" openings, "powerful combination of" closures). Corpus lives at `C:\Users\alto8\experiments\voice-scavenge\`.
- 2026-04-18 (morning): Google Drive MCP wired up. Created GCP project `sartor-drive-mcp` under alto84@gmail.com, enabled 5 APIs (Drive, Docs, Sheets, Slides, Calendar), OAuth consent screen configured (External, test user alto84@gmail.com), Desktop OAuth client created. Using `@piotr-agier/google-drive-mcp@2.1.0` installed globally via npm. Credentials at `~/.config/google-drive-mcp/gcp-oauth.keys.json`, tokens at `~/.config/google-drive-mcp/tokens.json`. Registered with `claude mcp add gdrive --scope user`. Next session exposes `mcp__gdrive__*` tools (87 total: Drive/Docs/Sheets/Slides/Calendar read+write). Note: Anthropic's hosted Drive connector still shows "Needs authentication" — GitHub issue #39422 confirms it does not propagate from claude.ai to Claude Code CLI, so the community-MCP path is the workaround.
- 2026-04-17: Added household todos: **call plumber** (outdoor pipes broke, spring-thaw failure; main shut off, irrigation isolated) and **pay heating guy** (reminder only, no vendor details yet). Both in `family/active-todos.md`.
- 2026-04-16 (evening): Active-todos triage. Closed: backdoor Roth conversions done, $18K tax-extension debit authorized, Lucent solar meeting scheduled 4/23 >3pm, Mike Silva AcrossCap call done. Declined: SNO 2026 (workshop + annual), Gym Day 5/30, Handshake AI. Unsubscribing: M3 Global Research, LinkedIn Job Alerts, Ladders. Added [[feedback/gather-triage-2026-04-16]] so future gather runs pre-filter. ALTON.md Open Action Items pruned. Still open: CAQH, W-2 DE→NJ, Chase autopay audit, Wohelo payment, 4/17 coverage conflict, afternoon childcare.
- 2026-04-16 (evening): PrivacyBrowse MSIX incident closed — forensic triage on Rocinante showed no execution and no exfiltration (no prefetch entry, no AppX deployment events, no Defender detection, no Chrome URL visits to C2). Added defensive learning set: [[microsoft-store-pua-pattern]] memo, YARA `reference/nwjs-remote-loader.yar`, Sigma `reference/nwjs-remote-loader-msix.yml`. Pattern summary: anonymous-GUID Store publishers bundling NW.js + remote `"main"` URL in `package.json`; size-as-camouflage (~125 MB MSIX to hide a ~1 KB payload config in a forest of legitimate Chromium files).
- 2026-04-16: Cleanup pass (Rocinante Opus 4.7). Deleted byte-identical duplicate `feedback/feedback_no_scheduled_task_edits.md` (kept `feedback_protected_paths.md`). Relocated `feedback_pricing_autonomy.md` from memory root into `feedback/` (resolves QA audit MINOR-1 and OPERATING-AGREEMENT OPEN_QUESTIONS Q7). Archived three superseded `reference/` drafts into `reference/archive/`: `OPERATING-AGREEMENT-DRAFT-GPUSERVER1.md`, `OPERATING-AGREEMENT-DRAFT-ROCINANTE.md`, `HOUSEHOLD-CONSTITUTION-v0.1.md`. Updated `reference/INDEX.md`, root `INDEX.md`, `machines/gpuserver1/CRONS.md` (→ v0.4, flags undocumented `rgb_status.py`), and root `CLAUDE.md` (gateway_cron.py marked DISABLED, scheduled-tasks table reconciled to actual 11 entries).
- 2026-04-11: Added `reference_vastai_market_pricing.md` (500.farm URL + native `vastai search offers` commands) and `feedback_pricing_autonomy.md` (Alton delegated pricing authority on machine 52271; market-aware ratchet-up rules, no autonomous cuts, weekly review cadence).
- 2026-04-07: Rewritten as the canonical memory index. Junction from Claude Code auto-memory dir now points here. Conventions and multi-machine architecture added.
- Prior: Was a stable pointer in the protected Claude Code directory.
