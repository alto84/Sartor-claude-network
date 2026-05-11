---
entity: docs-user-md-investigation
type: investigation
updated: 2026-05-02
updated_by: pipelines-auditor
related: [pipelines-audit, auto-injection-budget-2026-05-02, memory-improvement-program-v0.1]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# `docs/USER.md` missing — writer pipeline investigation (2026-05-02)

Read-only investigation. No pipeline modified.

## Headline finding

**`docs/USER.md` has never existed in git history.** `git log --all --oneline -- docs/USER.md` returns zero commits. The file was specified in the `memory-curator` agent definition (2026-04-07 era) but no automated cron has ever been wired to call the curator's dialectic-synthesis flow.

The "missing writer" is not broken — **it was never built as an automated job.** The curator agent CAN write USER.md, but only when invoked manually via `/curate`.

## Who is supposed to write it

The agent definition `.claude/agents/memory-curator.md` says explicitly:

> **Update docs/USER.md nightly using thesis/antithesis/synthesis reasoning** (line 18)

And the canonical mirror at `sartor/memory/reference/memory-curator-agent.md` (v2.0, 2026-04-12) elaborates:

> **Cadence:**
> - 06:30 ET — morning pass. Inbox drain only. Attached to the morning-briefing scheduled task.
> - 23:00 ET — nightly pass. Inbox drain + dialectic synthesis. Attached to the nightly-memory-curation scheduled task.

That's the **intended** wiring: nightly-memory-curation should invoke memory-curator's dialectic flow at 23:00 ET, which writes USER.md.

## Why they're not writing it

I read `.claude/scheduled-tasks/nightly-memory-curation/SKILL.md` end-to-end. **The cron does NOT invoke the memory-curator agent.** Its 5 steps are:

1. Run `python sartor/memory/autodream.py --force` (4-phase consolidation: Orient/Gather/Consolidate/Prune)
2. Run `python sartor/memory/decay.py --update` (Mnemex decay scoring)
3. Update `data/SYSTEM-STATE.md` and `data/IMPROVEMENT-QUEUE.md` (bounded-memory Hermes pattern)
4. **READ-ONLY** review of `~/.claude/projects/.../MEMORY.md`
5. Write report to `data/consolidation-log/{date}.md`

There is no Step that invokes the `memory-curator` agent, and no Step that touches `docs/USER.md`, `docs/MEMORY.md`, or `docs/MEMORY-CHANGELOG.md`. The script is a **different curator** (autoDream + Mnemex) than the agent the docs reference.

The agent v2.0 spec (2026-04-12) says it was "upgraded from a stub to a real mechanism" — but that upgrade rewired it for the **inbox-drain** flow (peer-machine coordination), not for the dialectic-synthesis flow it inherited from v1.0. The dialectic flow remained on paper.

The mirror file's frontmatter says `mirror_status: pending-sync` and:
> The runtime stub was not editable in the session that wrote v2.0 (2026-04-12) due to sandbox denial; the sync is a P0 follow-up for the next interactive Rocinante session.

That P0 follow-up never happened. The v2.0 spec lives in the wiki; the runtime stub still says v1.0-stub things; no cron is wired to either.

## What USER.md is supposed to contain (schema)

Per `.claude/agents/memory-curator.md` lines 18-26 + the v2.0 spec lines 184-196:

- Dialectic structure: thesis (current claims about Alton) / antithesis (day's evidence contradicting/complicating) / synthesis (updated integrated understanding)
- Source: `sartor/memory/daily/{YYYY-MM-DD}.md` and `data/trajectories/`
- Cross-domain syntheses must cite specific sessions
- 90-day-no-reinforcement entries flagged for pruning (not auto-deleted)
- Cognitive-load patterns: when does Alton engage deeply vs skim?
- Prior state preserved in `docs/MEMORY-CHANGELOG.md` (also missing — never created)

The companion file `docs/MEMORY.md` (which DOES exist, 9,339 bytes, last touched 2026-04-07) is the institutional-knowledge cousin.

## Common-cause hypothesis — DOES NOT HOLD

dashboard-keeper's mid-April-window theory was that one upstream change broke multiple silent writers (heartbeat-log.csv 30d stale, morning-briefing.cmd silent-fail, USER.md missing). For USER.md specifically, **the hypothesis fails** because:

1. **USER.md never existed.** It's not a regression — it's a never-built. Git log shows zero commits ever touching it.
2. **`docs/MEMORY.md` (the cousin) was last touched 2026-04-07** — by the autoDream-related commit `33df88e Register memory system v2 in docs/MEMORY.md + add bootstrap inbox entry`. After that, untouched. So docs/MEMORY.md staleness IS in the mid-April window, but the cause is the same one that affects USER.md: **no cron writes to docs/.**
3. The mid-April window git log (Apr 10-25) shows commits to `daily-household-health`, `family-scheduler`, `peer-coordinator`, `self-stewardship-cadence`, the comprehensive 2026-04-19 tidy — none of these touched the curator pipeline. The curator stub was last modified 2026-04-12 (per mtime in audit B), but only had its frontmatter touched.

So the heartbeat / morning-briefing failures need a separate root cause; **the USER.md issue is structurally independent**: it's a wiring gap that's existed since the agent was first specified.

## Fix proposal (for memory-engineer's PR)

**Two parts, can ship together:**

**Part 1 — Wire the agent invocation.** Add a Step 6 to `.claude/scheduled-tasks/nightly-memory-curation/SKILL.md`:

> **Step 6: Dialectic synthesis (USER.md + MEMORY.md update)**
> Invoke the `memory-curator` agent with directive: "Run dialectic synthesis pass. Read today's daily log, update docs/USER.md (preserving prior state in docs/MEMORY-CHANGELOG.md), and update docs/MEMORY.md with institutional knowledge from today."
> Budget: 90 seconds. On failure, log and continue (don't block the cron).

**Part 2 — Bootstrap the file.** Create `docs/USER.md` with a v0 seed (current ALTON.md highlights) so the SessionStart hook stops silently skipping it. The first nightly pass after Part 1 ships will overwrite with a real synthesis.

**Optional Part 3 — Sync the v2 spec.** Reconcile `.claude/agents/memory-curator.md` (runtime stub) with `sartor/memory/reference/memory-curator-agent.md` (canonical v2.0). This was the abandoned 2026-04-12 P0 follow-up.

## Cross-reference with my pipelines-audit (2026-05-02)

My earlier audit listed `nightly-memory-curation` as **DRIFTED** because the curator's inbox-drain flow inlines family content into FAMILY.md instead of `family/_history/` (per the family-memory-fixup §2.2). That's a SEPARATE drift from this USER.md gap, but **same agent, same cron** — both should be addressed in any curator-pipeline overhaul. The fixup §2.2 redirect and the dialectic-synthesis wiring are both single-line additions to the cron's invocation directives.

## What I did NOT do this turn

- Did not modify the cron, the agent stub, or any docs/ file.
- Did not create `docs/USER.md` (Part 2 of the fix is the writer's call, not the auditor's).
- Did not investigate whether `docs/MEMORY-CHANGELOG.md` was ever created (also missing, also never written by automation; same root cause).

## History

- 2026-05-02 — investigation by `pipelines-auditor` for memory-engineer's Week-1 PR. Read-only; no pipeline modified.
