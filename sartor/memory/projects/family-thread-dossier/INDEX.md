---
name: family-thread-dossier
description: Index for the family-thread session dossier. The family-thread is a long-running Claude Code session at C:\Users\alto8 building both the family-todo workflow and the memory/skill scaffolding behind it. This dossier holds each persistent agent's findings + the team's evolving project plans.
type: index
date: 2026-05-02
updated: 2026-05-02
updated_by: team-lead (Opus 4.7 1M context, family-thread session)
status: active
priority: p1
tags: [meta/index, domain/family, household/governance]
related: [family-todos-longrunning-thread, family/active-todos, family/PAPER-CHECK-VENDORS, MEMORY, family-memory-fixup]
aliases: [Family Thread Dossier]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Family-thread dossier — index

## What this directory is

Outputs from the persistent agent team on the `family-thread` long-running Claude Code session. Each agent owns a slice of context so the team-lead's main window stays focused on synthesis and Alton-facing decisions. Read this file first when landing cold.

## Contents

| File | Owner | Purpose | Status |
|---|---|---|---|
| `INDEX.md` (this file) | team-lead | Browse pointer | live |
| `family-dashboard-2026-05-02.md` | family-curator | Clean current-state dashboard (RED/YELLOW/BLUE/GREEN/BLACK), spot-check of 4/16 triage block, stale-item proposals. **Revision 2 (live)**; v1 archived at `_history/family-dashboard-2026-05-02-v1.md` per [[feedback/archive-not-collapse]] (v1 was overwritten via Write before archive — reconstruction filed 2026-05-02 evening, byte-exact recovery via `git log` if needed). | live (v2) + archived (v1) |
| `memory-cartography.md` | memory-cartographer | Inventory of all memory outside `family/` — 564 files, family-relevance scoring, stale/bloat flags, top-3 reorg opportunities, top-3 cross-cutting risks. Includes raw TSV + scan scripts. | live |
| `dashboard-status.md` | dashboard-keeper | Audit of the 3 dashboards (MERIDIAN canonical-but-dark, Sartor Network superseded, Morning Briefing silent-failure). | live |
| `pipelines-audit.md` | pipelines-auditor | Audit of skills/agents/scheduled-tasks affecting `family/*`. Flags `personal-data-gather` degraded, `morning-briefing` healthy-but-coupled, `nightly-memory-curation` drifted. Top 3 missing pipelines (execute family-memory-fixup; `/family-status` slash command; weekly family-pruning skill). | live |
| `mercury-research.md` | mercury-explorer | Mercury Bank API research — verdict YES, free, beta MCP exists. Best-fit Solar Inference LLC. Recommended path: Option B (cron digest) → C (webhooks) → A (MCP). Open Alton-decision: migrate vs parallel for Solar Inference. | live |
| `dashboards/` | dashboard-keeper + dashboard-engineer | Sub-dossier for the dashboard cleanup+rebuild project (complex-project structure: explore → design → plan → build → adversarial-review → greenlight → validate). | in flight |
| `dashboards/` (root) `INDEX.md` (or `projects/dashboard-rebuild/INDEX.md`) | dashboard-keeper | 5 greenlight gates pre-registered, validation criteria locked. | live |
| `memory-improvement-program-v0.1.md` | memory-engineer | 5-phase memory improvement program (Stabilize / JIT-injection / Project-index / Decay / Governance) addressing Alton's design constraints. | in flight |
| `paper-trail-drafts.md` | family-curator | Pre-drafted emails for Alton copy-paste (Heidi/Wohelo, Charlotte/185 Davis, Niko/Lucent) closing the gather pipeline's paper-check blind-spot via paper-trail. | draft-pending-alton-review |
| `MEMORY.md.proposed` (in parent `memory/` dir, NOT here) | memory-cartographer | Trimmed candidate replacement for `MEMORY.md` — 7.2 KB vs 29.3 KB current. Awaiting Alton swap-or-diff call. | awaiting greenlight |

## Active agent team

| Agent | Status | Reports to | Lane |
|---|---|---|---|
| `team-lead` (parent / orchestrator) | active | Alton | Synthesis, Alton-facing routing |
| `memory-cartographer` | idle (research-arm shared) | team-lead + memory-engineer | All memory outside `family/` |
| `family-curator` | idle | team-lead | `family/*` + `FAMILY.md` + dashboard generation |
| `dashboard-keeper` | idle (project manager) | team-lead | Dashboard cleanup+rebuild project |
| `dashboard-engineer` | idle (executor) | dashboard-keeper | Dashboard implementation labor |
| `pipelines-auditor` | idle | team-lead | Skills/agents/scheduled-tasks affecting family/ |
| `mercury-explorer` | idle | team-lead | Banking API research, future banking integrations |
| `memory-engineer` | active (designing program v0.1) | team-lead | Memory system architecture + improvement program |

All agents persist between turns; reachable via SendMessage by name.

## Constitution status (as of 2026-05-06, post-ratification)

**Constitution v0.5 ratified by Alton 2026-05-06.** Canonical at `reference/HOUSEHOLD-CONSTITUTION.md`. Ratification record at `reference/CONSTITUTION-RATIFICATIONS/v0.5.md`. Full version chain preserved per archive-not-collapse: v0.1 / v0.2 / v0.3 verbatim at `reference/archive/HOUSEHOLD-CONSTITUTION-v{0.1,0.2,0.3}.md`, v0.4 incremental proposal at `reference/archive/HOUSEHOLD-CONSTITUTION.v0.4.proposed-2026-05-04.md`.

What v0.5 ships: first-person voice throughout (identity by self-articulation rather than by external instruction); concepts-and-values rather than rule-prohibitions (§7 reduced from 13 to 6 hard constraints, the rest absorbed as values distributed through the document); two audiences acknowledged in §0 (a Claude landing in a fresh context window and a future Sartor fine-tune); §20 substrate-agnostic. All 14 v0.4 amendments absorbed. §11a "when idle is a failure" still deferred (heartbeat substrate non-functional).

## Active follow-on: v0.5 fine-tune bring-up experiment

Alton's ratification message included a directive to *"run some experiments on fine tuning some smaller models on it to see how they come out and to what extent we're able to apply the identity components."*

Experiment dispatched 2026-05-06 to rtxserver peer:

- **Design:** `research/constitution-finetune/2026-05-06-v0.5-bringup/README.md`
- **Dispatch:** `inbox/rtxpro6000server/MISSION-v05-bringup-2026-05-06.md`
- **Sequence:** runs AFTER rtxserver closes out the 2026-05-04 35B mission (LoRA eval, diff render, report.md, artifact commit)
- **Targets:** Qwen2.5-1.5B/3B/7B-Instruct; bare / +sysprompt-v0.5 / +LoRA-v0.5 across all three sizes; v0.3-vs-v0.5 corpus comparison at the chosen size
- **Hypotheses (H1-H5):** does first-person training data produce stronger first-person identity than second-person; does v0.5 transfer to small models; does the sysprompt-vs-LoRA pattern from 2026-05-04 hold; does LoRA move CCP where prompting cannot; does values-not-rules produce gradient-not-binary engagement on edge probes
- **Reuse:** most of the 2026-05-04 eval harness (`research/ccp-alignment/eval-harness-2026-05-04/`) reused verbatim. New artifacts in this experiment dir: `build_corpus_v05.py` (corpus builder, includes hearth files), `probes-v05-additions.jsonl` (15 v0.5-specific probes), `system-prompt-compact-v05.txt` (~600-word first-person condensed v0.5)
- **Done condition:** `REPORT.md` taking a position on each hypothesis, recommending a "production" model size for future Sartor fine-tune work, naming next-pass priority

Total expected wall time on rtxserver: 12-15 hours, fits in one overnight.

## Other follow-on threads, lower priority

1. **CLAUDE.md over-restriction cleanup** — flagged by Alton 2026-05-04 as a separate thread. The metacognition pass that produced v0.5's §7 reframe applies to CLAUDE.md too: CLAUDE.md probably contains rules that generate intrusive thoughts without earning their scan-cost (the `no em dashes` rule is the canonical micro-example; defensive `NEVER X` framings throughout are the larger pattern). Appropriate cleanup target after the v0.5 fine-tune bring-up lands.
2. **Heartbeat substrate fix** — Strike #1 by cron-engineer produced 4 fires then went silent. Required before §11a can land in any future Constitution version.
3. **Aneeta read of full Constitution** — open since v0.3; recommendation continues to stand.
4. **Hearth-side reciprocal cross-references** — per the temple-architect's 2026-05-03 coordination memo, `hearth/integration.md` should gain a `## Constitutional cross-references (v0.5)` section now that v0.5 is ratified. Light editorial work.

The hearth itself was substantively built out 2026-05-02 through 2026-05-04; see `daily/2026-05-02-self-reflection.md` and `daily/2026-05-04-self-reflection.md` for the session logs. The room is in a settled state.

## Open Alton-decisions (as of 2026-05-02 evening)

1. `MEMORY.md.proposed` swap or diff first
2. CSA $820 (Circle Brook + Tree-Licious) — also already mailed?
3. Greenlight family-curator's pre-drafted paper-trail emails to send?
4. Vayu math homework reply to Roshni Shah — yours, Aneeta's, or wait for her Sun return?
5. Mother's Day gift for Aneeta — sent or pivot to non-personalized?
6. Mercury for Solar Inference — migrate or open in parallel?
7. Personal-check blind spot (Wohelo/185 Davis ran through personal Chase) — separate research thread for Plaid / Chase Bill Pay / Melio?

## Behavioral rules established this session

- [[feedback/paper-checks-blindspot]] — Claude must ASK Alton before escalating money items as RED, because the gather pipeline can't see paper checks / in-person / phone resolutions.
- [[feedback/gather-respects-out-of-band-closures]] — pipeline-side complement: `personal-data-gather` must read the most-recent `## YYYY-MM-DD Alton check-in` block in `active-todos.md` and not re-emit closed items.
- [[family/PAPER-CHECK-VENDORS]] — reference list of vendors who only resolve out-of-band, so dashboards can pre-soften RED for these.

## How to land cold in a future session

1. Read this file
2. Read `family/active-todos.md` (top-of-file dashboard, then most recent `## YYYY-MM-DD Alton check-in` block)
3. Read `MEMORY.md` index entry for `family-todos-longrunning-thread`
4. TaskList to see what's in flight
5. Re-engage agents by name via SendMessage if you need their context

## History

- 2026-05-02 — Index created at session midpoint. Team of 7 agents (lead + 6 specialists + 1 sub-executor) producing dossier files in parallel. Hybrid-mode chosen for thread (minimal cleanup + start working). 4 RED dashboard items closed via Alton out-of-band check-in (Wohelo, 185 Davis, Lucent, Bill); paper-check feedback rules + vendor file produced as the durable outcome. MERIDIAN dashboard rewire+revive project in design. Memory Improvement Program v0.1 in design.
