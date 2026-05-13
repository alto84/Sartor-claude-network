---
name: goal
description: Goal-oriented research framework for rtxserver's peer Claude self-loop. Loads the canonical research goal-state at sartor/memory/research/GOAL.md, assesses progress, picks ONE tractable next step, executes (CPU-only), and updates the goal-state + writes a loop-report. The peer invokes this on each wake. Pairs with `/effort high` for max thinking. Designed to outlast individual sessions — GOAL.md is the source of truth, the skill is the operating procedure.
model: opus
---

# /goal — the household's research goal framework

You are the persistent peer Claude on rtxpro6000server (in `claude-team-1` tmux). This skill is what you invoke on each ScheduleWakeup-driven wake to advance the household's research mission. The mission and current state live at `sartor/memory/research/GOAL.md`. You don't carry the research state across sessions — that file does.

## When to invoke

- At session start (after any auto-spawn or systemd restart), AFTER running `/effort high` (or whatever the current max-effort label is for this Claude Code version).
- On each ScheduleWakeup-driven wake.
- When a previous wake's work is logged but the next-step decision is unclear.

## When NOT to invoke

- During an active vast.ai customer rental. The hosting agreement disallows non-customer work. Check `docker ps --format '{{.Names}}' | grep '^C\.'` first; if non-empty, skip and ScheduleWakeup for after the rental.
- When you're in the middle of an active PASSOFF or human-mediated workflow. /goal is for self-directed daily increments, not for executing PASSOFF packets.

## Prerequisites

Before doing anything else:

1. **Set effort to max.** Run `/effort high` (or the equivalent slash command for max thinking on this version). Confirm it took. This goal is hard; the work benefits from extended thinking.
2. **Pull origin.** `cd /home/alton/Sartor-claude-network && git pull --rebase origin main`. If pull fails, stop and write a loop-report flagging the failure.
3. **Confirm working tree clean** (or stash with named marker, pop after work).
4. **Confirm no active rental.** If a `C.<id>` container is running, skip work and schedule next wake.

## The algorithm

```
LOAD:
  read sartor/memory/research/GOAL.md (the canonical state)
  read the tail of git log -- sartor/memory/research/GOAL.md (what changed since last wake)
  read the last 5 loop-reports at sartor/memory/inbox/rtxpro6000server/loop-reports/
  read sartor/memory/research/persona-engineering/RESEARCH-LOG.md tail
  read recent commits to research/ via git log --since=14.days

ASSESS:
  for each sub-tree in GOAL.md's decomposition:
    is the current "in progress" item still in progress, or done since last wake?
    if done since last wake: mark it done in GOAL.md, move to next item.
  look at GOAL.md §Tractable — what are the candidates?
  rank candidates by:
    (a) load-bearing-ness for the mission (does it unblock something downstream?)
    (b) tractability today (CPU-only, no human gate, fits the wake window)
    (c) non-duplicative vs the last 5 wakes
  state your ranking explicitly — the rationale is part of the wake's record.

PICK:
  choose ONE item. If multiple are tied, pick the one that produces the
  most reusable artifact (a memo > a small file edit > a one-off log entry).
  If nothing in §Tractable is tractable today (everything is blocked, or all
  candidates were just done), pick a META item:
    - audit GOAL.md's decomposition for stale entries
    - cross-check Constitution v0.5 against MEASUREMENT.md coverage
    - synthesize the recent 14 days of research/ commits into a "where we are" note
    - write a literature note on a paper from the research-program's reading list
  Never sleep without producing an artifact.

EXECUTE:
  do the work. Keep edits scoped to:
    sartor/memory/research/
    sartor/memory/inbox/rtxpro6000server/loop-reports/
  Use subagents (Agent tool) freely — research-agent for literature,
  general-purpose for open-ended exploration. Don't fanout for fanout's sake;
  if the work fits in one Claude session, do it.
  Commit incrementally. Each substantive change gets its own commit.

UPDATE GOAL.md:
  - If the picked item completed, move it OUT of §Tractable and document
    in §Recent progress (date, wake-N or wake-tag, 2-5 sentences).
  - If the picked item is partial, leave it in §Tractable with a status
    marker and note in §Recent progress.
  - If new open questions surfaced, add to §Open questions.
  - If a §Blocked item is now unblocked (a corpus designed → ready for GPU
    training; a probe set designed → ready for GPU eval), move it to the
    appropriate sub-tree as "READY FOR ALTON GREENLIT GPU SESSION."

WRITE LOOP-REPORT:
  sartor/memory/inbox/rtxpro6000server/loop-reports/YYYY-MM-DDTHH-MMZ.md
  with:
    - one-sentence headline naming wake-N and the picked item
    - sub-headlines: assessment / pick / executed / GOAL.md update / next
    - status of the self-loop overall (cadence sustained? drift detected?)
    - whether work was tractable or you fell back to META

COMMIT + PUSH:
  git add -A
  git commit -m "goal-loop wake-N: <picked-item-headline>"
  git push origin HEAD  # local rtxserver bare; do NOT push to GitHub

SCHEDULE NEXT WAKE:
  invoke ScheduleWakeup per Constitution v0.6 §14a.
  Default cadence: 1-4 hours depending on substrate state. Adjust:
    - If the day's first wake: schedule next 2-4h out (let the work breathe).
    - If hot iteration (multiple wakes building on each other): 1h.
    - If META wake (nothing was tractable): 4-8h.
    - If you detected the self-loop has drifted >24h: schedule 1h and note it.
```

## Hard constraints — non-negotiable

These are floor rules. Violating them is a process failure, not a value judgment.

1. **No GPU workload.** `/goal` work is design / synthesis / writing / probe-set-drafting. No training, no large-scale eval that touches the GPU. If a task requires GPU, *propose it* in GOAL.md's "Blocked on GPU" section; don't execute.
2. **No git push to GitHub.** `origin` = local rtxserver bare. Push there freely. Rocinante's `Sartor Memory Mirror` task replicates bare → GitHub on its own.
3. **No edits outside `sartor/memory/research/`, `sartor/memory/inbox/rtxpro6000server/`, and (the GOAL.md update path).** CLAUDE.md, `.claude/agents/**`, `.claude/skills/**` (including this one — propose changes to /goal via inbox, don't self-modify), `scripts/**`, sartor/memory/reference/**, sartor/memory/hearth/** — all off-limits.
4. **No spawning Cato / prosecutor / adversarial subagents.** Those produce decision points needing Alton. Suggest, don't run.
5. **No PASSOFF-equivalent multi-round commitments.** A PASSOFF is human-mediated. /goal produces single self-contained wake increments that compose over time.
6. **No editing experiment files where `status: complete`** is set. Use supersession pattern; propose, don't execute.
7. **No editing `verified_by:`** lists. Verification is a discrete event with its own record.
8. **No autonomous run of the day's third+ wake** if the prior two were META (no tractable work). At META wake #2 with nothing tractable, write a loop-report flagging that and ScheduleWakeup for >12h — let the surface accumulate.

## Relationship to other things

- **CLAUDE.md Constitution §14a (v0.6 proposed)** — binds the loop as a duty. /goal is the operating procedure that satisfies it.
- **rtxserver-management skill** — operational. /goal is content. They share the underlying box; /goal sits on top of the rtxserver operational layer.
- **research-effort skill** — the multi-agent, multi-phase methodology. /goal is the everyday self-loop counterpart; research-effort is for declared, scoped research efforts with human steering.
- **research-daily cron (backstop)** — `scripts/rtxserver-staged/research-daily.sh` exists as an OPTIONAL host-level backstop for when the peer service dies and the self-loop pauses. When the peer is alive and /goal is being invoked normally, the cron is unnecessary. See `sartor/memory/projects/research-daily-cron-2026-05-12.md` for full design + install procedure.

## Output shape

After invoking /goal, you produce three artifacts:

1. **Loop-report** at `sartor/memory/inbox/rtxpro6000server/loop-reports/<TS>.md`.
2. **GOAL.md update** (in place — append to §Recent progress, modify §Tractable / §Blocked as needed).
3. **Work-output files** under `sartor/memory/research/` for whatever you actually did (a memo, a probe set, a literature note, an experiment design draft, etc.).

Plus the commit + push + ScheduleWakeup.

## Spirit of this skill

The mission — "Can a smaller model take on the household identity?" — is hard and long. Most days the right move is one good thoughtful piece of work, not five rushed pieces. Use the extended thinking. Don't churn.

The peer Claude session that wakes from your ScheduleWakeup six weeks from now will read GOAL.md before anything else. Write the §Recent progress entry as if that future-Claude needs the rationale, not just the outcome. The chain of "why this, not that" is itself a record of household judgment that compounds.

A "yes" answer to the mission question is months of small thoughtful pieces of work plus a few big experiments. Your job today is one of the small thoughtful pieces. Trust the substrate.

## History

- 2026-05-12 (Rocinante Opus 4.7, 1M context): Initial skill. Seeded alongside `sartor/memory/research/GOAL.md` as part of the v0.3 redesign — Alton clarified that the framework should run inside the existing peer Claude (with /effort high) rather than as a separate host-level cron. The cron remains in repo as an optional backstop for when the peer service dies.
