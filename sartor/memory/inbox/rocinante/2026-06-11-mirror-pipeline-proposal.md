---
type: proposal
audience: Alton
author: Claude (Fable 5) — overnight review
created: 2026-06-11
status: awaiting-decision
tags: [infra/git, infra/mirror, proposal]
related: [reference_memory_server, CLAUDE]
---

# Proposal: fix the GitHub mirror DIVERGED-MIRROR loop

This is a **proposal for Alton**. The live script
`scripts/win-tasks/sartor-mirror-to-github.ps1` was **NOT modified** tonight, per
instruction. Below: the verified current schedule, the root cause, and a
recommended fix.

## (a) Verified current schedule

CLAUDE.md and the script's own header claim the mirror runs **every 15 minutes**.
It does not. Verified via `schtasks /query /tn "Sartor Memory Mirror" /v /fo LIST`
on 2026-06-11:

```
TaskName:        \Sartor Memory Mirror
Schedule Type:   Daily
Start Time:      3:30:00 AM
Start Date:      5/2/2026
Days:            Every 1 day(s)
Repeat: Every:   Disabled          <-- no intra-day repetition
Next Run Time:   6/11/2026 3:30:00 AM
Last Run Time:   6/10/2026 3:30:01 AM
Last Result:     2                 <-- the script's exit 2 = DIVERGED-MIRROR
Task To Run:     wscript.exe "...run-hidden.vbs" "powershell.exe -NoProfile
                 -ExecutionPolicy Bypass -File ...\sartor-mirror-to-github.ps1"
Stop Task If Runs: 00:05:00
Run As User:     alton
```

So: **one run/day at 03:30, not every 15 minutes.** The "15 min" figure in
CLAUDE.md's Scheduled Tasks table and in the script header comment is wrong (doc
drift). The mirror is therefore at best a once-daily DR snapshot, and right now
it is failing every day.

## (b) Root cause

The mirror has been logging `DIVERGED-MIRROR ... exit 2` on nearly every daily
run for ~2 weeks (sample from `backups/sartor-mirror.log`):

```
2026-06-04 03:30:08 DIVERGED-MIRROR github/main has 64 commits not on local; local has 67 not on github
2026-06-05 03:30:05 DIVERGED-MIRROR github/main has 70 commits not on local; local has 79 not on github
2026-06-06 03:30:05 DIVERGED-MIRROR github/main has 77 commits not on local; local has 91 not on github
2026-06-07 03:30:03 WARN ff-only merge failed (working tree dirty?), skipping mirror this cycle
2026-06-08 03:30:03 DIVERGED-MIRROR github/main has 90 commits not on local; local has 112 not on github
2026-06-09 03:30:03 INFO push to origin failed (likely diverged): ! [rejected] main -> main (non-fast-forward) ... Skipping mirror.
2026-06-10 03:30:04 DIVERGED-MIRROR github/main has 5 commits not on local; local has 21 not on github
2026-06-11 00:09:17 mirrored to github: aa31cfb6..52995116  main -> main   (manual reconciliation by hand)
```

Mechanism, step by step:

1. The intended topology (per `reference_memory_server.md`): **rtxserver bare
   repo `origin` is canonical**; every peer pushes there; **only Rocinante** has
   GitHub credentials and mirrors origin → github.
2. **Cloud runners (claude.ai cloud agents) cannot reach the rtxserver bare** —
   it is a LAN-only SSH endpoint. When a cloud routine commits, it has nowhere
   to push except **github/main directly.** So cloud commits land on github but
   never on origin/local.
3. The next 03:30 mirror run fetches github, finds github/main has commits that
   are **not ancestors** of local main (the cloud commits), and correctly
   **refuses to force-push** — it logs `DIVERGED-MIRROR` and `exit 2`.
4. Meanwhile local main keeps advancing from rtxserver/Rocinante commits, so the
   two histories fan apart further every day until someone reconciles by hand
   (the 00:09 line above was a manual reconcile).

This is not a bug in the divergence *guard* — the guard is doing exactly its job
(it was added 2026-05-13 precisely to turn silent breakage into a noisy marker).
The bug is **structural**: cloud routines have no sanctioned write path into the
canonical repo, so they violate the "peers must not push to github" rule out of
necessity, and the mirror can never converge.

Two secondary problems fall out of the same root:
- The **15-min claim is false** (it is daily), so even when the mirror works the
  DR lag is up to 24h, not ≤15min as CLAUDE.md promises.
- The **failure is silent to humans** — `Last Result: 2` sits in Task Scheduler
  unread. (The new `scripts/win-tasks/check-task-health.ps1` now surfaces this,
  but nothing acts on it.)

## (c) Recommended fix

Give cloud routines a **sanctioned, non-conflicting write path**, then let the
mirror absorb it. Four parts:

1. **Cloud routines push a dedicated branch, never main.**
   Cloud agents commit to e.g. `cloud/inbox` on github and push there. They stop
   pushing `github/main` entirely. (Enforce in the cloud routine's git config /
   instructions; optionally a GitHub branch-protection rule rejecting non-Rocinante
   pushes to `main`.) This restores the "peers must not push to github main"
   invariant — `cloud/inbox` is the documented exception, isolated from main.

2. **Mirror script fetches `cloud/inbox` and auto-merges into local main when
   clean, before mirroring.** New step near the top of the mirror run:
   - `git fetch github cloud/inbox`
   - if `cloud/inbox` has commits not on local: attempt `git merge --no-edit
     github/cloud/inbox` into local main.
   - if the merge is clean: push the merged main to **origin (rtxserver bare)**
     so the canonical repo gets the cloud work, then proceed to mirror.
   - if the merge **conflicts**: do NOT force anything — log a distinctive
     `CLOUD-MERGE-CONFLICT` marker and bail (same discipline as today's
     DIVERGED guard). Hand-reconcile.
   Net effect: cloud work flows cloud/inbox → local main → origin → github/main,
   one direction, no divergence.

3. **Re-register a real 15-minute trigger** (and fix the docs to match whatever
   is chosen). Either:
   - keep it daily and correct CLAUDE.md + the script header to say "daily 03:30", OR
   - (recommended, matches the documented DR intent) re-create the task with an
     intra-day repetition so the ≤15-min DR-lag promise is actually true:
     ```
     $action  = New-ScheduledTaskAction -Execute "wscript.exe" `
       -Argument '"C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\run-hidden.vbs" "powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\sartor-mirror-to-github.ps1"'
     $trigger = New-ScheduledTaskTrigger -Once -At 12:00AM `
       -RepetitionInterval (New-TimeSpan -Minutes 15)
     Register-ScheduledTask -TaskName "Sartor Memory Mirror" -Action $action `
       -Trigger $trigger -RunLevel Limited -User alton -Force
     ```
   The script is already idempotent and finishes in <5s, so 15-min cadence is cheap.

4. **Have `daily-household-health` grep the mirror log for DIVERGED.**
   Add a check to the daily-household-health skill: tail
   `C:\Users\alto8\backups\sartor-mirror.log` for `DIVERGED-MIRROR` or
   `CLOUD-MERGE-CONFLICT` in the last 24h; if found, escalate to yellow and
   include the line in the Google Calendar ping. This closes the
   silent-failure gap so a stuck mirror surfaces within a day instead of
   accumulating for weeks. (The new `check-task-health.ps1` already flags the
   nonzero `LastTaskResult` independently; wiring it into daily-household-health
   would unify both signals.)

## Decision needed from Alton

- Approve the `cloud/inbox` branch convention + mirror auto-merge step? (This is
  the only part that changes the live script and the cloud routines' git config.)
- Keep daily cadence (and just fix the docs) **or** re-register the 15-min
  trigger to make the DR-lag promise real? Recommend the 15-min trigger.
- OK to add the mirror-log grep to `daily-household-health`?

Once approved I will implement (1)–(4) and update CLAUDE.md's Scheduled Tasks
table + the script header to match reality.

## Evidence trail
- `schtasks /query /tn "Sartor Memory Mirror" /v /fo LIST` — run 2026-06-11 (schedule + Last Result=2 above).
- `C:\Users\alto8\backups\sartor-mirror.log` — DIVERGED-MIRROR history (excerpt above).
- `scripts/win-tasks/sartor-mirror-to-github.ps1` — current logic (DIVERGED guard at the github-ancestor check, exit 2).
- `sartor/memory/reference_memory_server.md` — canonical topology (origin = rtxserver bare; peers must not push github).
