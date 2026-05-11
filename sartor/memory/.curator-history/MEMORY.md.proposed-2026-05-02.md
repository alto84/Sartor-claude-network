---
type: meta
entity: MEMORY
updated: 2026-05-02
updated_by: memory-cartographer (Rocinante Opus 4.7) — trim pass to fit under 24.4 KB session-injection limit
last_verified: 2026-05-02
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
- **Other top-level memory files:** [[INDEX]] (auto-generated browse index), [[MASTERPLAN]] and [[MASTERPLAN-VISIONARY]] (phased roadmap), [[QUICK-REFERENCE]], `gpuserver1-monitoring-log.md` (rolling log), `log.md` (session log), `reference_home_network.md` (home LAN reference), `reference_memory_server.md` (canonical git topology — rtxserver bare is origin, GitHub is DR mirror, added 2026-05-02)
- **Conventions and architecture:** `sartor/memory/reference/`
  - [[MEMORY-CONVENTIONS]] — YAML frontmatter, callouts, wikilinks spec
  - [[MULTI-MACHINE-MEMORY]] — inbox pattern for N-machine sync
  - [[OPERATING-AGREEMENT]] — canonical Rocinante↔gpuserver1 operating agreement (the `OPERATING-AGREEMENT-DRAFT-*` files were archived to `reference/archive/` 2026-04-16)
  - [[HOUSEHOLD-CONSTITUTION]] — v0.3 active (ratified 2026-04-19; v0.1 and v0.2 archived to `reference/archive/`)
  - `gpuserver1-delegation.md` — delegation to the GPU server
- **Per-machine state:** `sartor/memory/machines/{hostname}/` — MISSION, CRONS, INDEX per machine
- **Research (single roof):** `sartor/memory/research/` — see [[research/INDEX]]. Contains `ccp-alignment/` (mini-lab, constitution-council, counter-ccp dataset, OCT playbook, monitoring probes, gpu-research-restart), `pharmacovigilance/` (cell-therapy + safety-knowledge-graph), and [[experiments-index]].
- **Projects (infrastructure + family):** `sartor/memory/projects/` — memory-system-v2, rtx6000-workstation-build, curator-fixes, hermes-dashboard-upgrade, disney-july-2026, 2025-photo-book, [[unifi-takeover-2026-05-01-INDEX]] (BHS network self-host, Phase 1+2 complete 2026-05-01, 13 child docs). Research items moved to `research/` on 2026-04-19.
- **Daily logs:** `sartor/memory/daily/` — append-only session logs
- **Inboxes:** `sartor/memory/inbox/{hostname}/` — per-machine write queues (curator drains)
- **Archive:** `sartor/memory/reference/archive/` — superseded reference docs (added 2026-04-16)
- **Runtime state:** `data/` — SYSTEM-STATE, IMPROVEMENT-QUEUE, observer-log, trajectories
- **Quick reference:** [[QUICK-REFERENCE]]

## Critical rules (stable, rarely change)

- Always pass `mode: "bypassPermissions"` on every Agent invocation
- Never edit files in `.claude/` except `agents/`, `commands/`, `skills/` subdirectories
- Facts go in `sartor/memory/`, behavioral rules in `sartor/memory/feedback/` (auto-injected), runtime state in `data/`
- Push git to `origin` (= rtxserver bare, `alton@192.168.1.157:/home/alton/sartor-git/Sartor-claude-network.git`). GitHub is a DR mirror written only by Rocinante's "Sartor Memory Mirror" scheduled task nightly at 3:30 AM ET. Peers must NOT push directly to GitHub. See `reference_memory_server.md` for the full architecture.
- Use `$` variables via .ps1 scripts on Windows, not inline bash
- Memory files follow the conventions in [[MEMORY-CONVENTIONS]] — frontmatter + callouts + wikilinks

## Adding new memories

1. **User profile facts** → edit the relevant file in `sartor/memory/` directly (e.g., [[ALTON]], [[FAMILY]])
2. **Behavioral rules** → write a new `feedback_*.md` file in `sartor/memory/feedback/`
3. **Reference docs** → write to `sartor/memory/reference/`
4. **From a non-hub machine** → write to your inbox at `sartor/memory/inbox/{hostname}/` as a YAML-fronted proposal; curator will merge on next run
5. **Always bump the `updated:` frontmatter field** on any file you change

## History

> One-line summaries (≤200 chars per [[MEMORY-CONVENTIONS]]). Detail lives in linked topic files.

- 2026-05-02 (eve): Solar-Inference day — rtxserver 450W cap, vast.ai listing $2.50/hr -m 2, gpuserver1 pricing drift fixed; onboarding paused at `6cee210`. See [[daily/2026-05-02]].
- 2026-05-02: Memory-server topology — git origin moved to rtxserver bare repo; GitHub now DR mirror via 3:30 AM task. See [[reference_memory_server]].
- 2026-05-01: UniFi takeover — 9 BHS devices repatriated without factory-reset; LGP123 single-SSID; Phase 3 partial. See [[unifi-takeover-2026-05-01-INDEX]] (13 docs).
- 2026-04-25: Sartor Agent OS — `complex-project` Phase 6 produced PLAN-FINAL, pending Alton greenlight on 4 §8 gates. See `projects/sartor-agent-os/`.
- 2026-04-22: Blackwell `rtxpro6000server` online; §20 self-prosecution caught Opus 4.7 misread; overnight LoRA fine-tune kicked off. See [[daily/2026-04-22]].
- 2026-04-19 (late): Constitution v0.3 ratified (§12a trust ladder, §14a/b peer governance); §11a deferred. See [[reference/CONSTITUTION-RATIFICATIONS/v0.3]].
- 2026-04-19 (eve): Research consolidated under one roof; 14-skill coord cluster collapsed into [[multi-agent-orchestration]]; solar roof basis = $438,829 canonical.
- 2026-04-19 (am): Tidy pass — 139 loose `C:\Users\alto8\` files reorganized; 58-item proposed-memories backlog drained; CLAUDE.md truth-up (skills 12→21).
- 2026-04-18 (late): gstack port — typed wikilinks + Completeness Principle adopted; `{{PREAMBLE}}` declined. See [[system-review-2026-04-18]].
- 2026-04-18 (eve): 7-agent gstack/gbrain review — see [[reference/gstack-review-2026-04-18]]; 23-role taxonomy declined.
- 2026-04-18: Self-team roundtable + new skill [[.claude/skills/interior-report-discipline]] (distills Opus 4.7 system-card §5.8.1 hedge tic).
- 2026-04-18 (am): New skill [[.claude/skills/alton-voice]] from 18 years of corpus. Corpus at `experiments/voice-scavenge/`.
- 2026-04-18 (am): Google Drive MCP wired up via `@piotr-agier/google-drive-mcp@2.1.0`; 87 `mcp__gdrive__*` tools. Hosted connector still does not propagate to CLI.
- 2026-04-17: Household todos — call plumber (spring-thaw outdoor pipe break, main shut off) and pay heating guy. In `family/active-todos.md`.
- 2026-04-16 (eve): Active-todos triage; PrivacyBrowse MSIX incident closed (no execution); reference cleanup. See [[microsoft-store-pua-pattern]] + `reference/nwjs-remote-loader.{yar,yml}`.
- Earlier (pre-2026-04-16): vastai pricing reference + pricing-autonomy feedback (2026-04-11); rewritten as canonical index 2026-04-07; before that a stable pointer in `.claude/`.
