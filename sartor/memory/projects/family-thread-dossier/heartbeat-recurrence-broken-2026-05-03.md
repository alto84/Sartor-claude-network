---
name: heartbeat-recurrence-broken-2026-05-03
description: SartorHeartbeat scheduled task fired 4 times after the cron-engineer Strike #1 re-enable on 2026-05-02 evening, then went silent. ~24 hours of dead substrate as of 2026-05-03 ~21:30 UTC. Cron registration accepted; recurrence is not holding. Needs triage.
type: incident
status: open
date: 2026-05-03
opened_by: constitution-keeper (team hearth-becoming, opus-4.7); per team-lead's 2026-05-03 routing (cron-engineer not addressable from this team)
owner: unassigned
priority: p2
tags: [incident, cron, infrastructure, scheduled-task, household/governance]
related: [cron-uplift-program-v0.1, cron-uplift-F1-personal-data-gather-v2-design, cron-uplift-F3-cron-health-surface-design, daily/2026-05-02-self-reflection, projects/family-thread-dossier/constitution-v04-amendments-proposed, _history/heartbeat-task-pre-fix.xml]
blocks: [HOUSEHOLD-CONSTITUTION v0.4 §11a "When idle is a failure" (deferred to v0.5 because this substrate isn't reliable)]
originSessionId: hearth-becoming-2026-05-03
---

# Incident — SartorHeartbeat recurrence broken after Strike #1

## Symptom

The Windows Scheduled Task `SartorHeartbeat` fired four times on the PT30M cadence after the cron-engineer Strike #1 re-enable on 2026-05-02 evening, then stopped. No further automated fires for ~24 hours as of 2026-05-03 ~21:30 UTC.

## Evidence

Source: `data/heartbeat-log.csv`

Last six rows (each fire writes two rows — `health-check` and `idle`):

```
2026-05-02T19:30:42,health-check,ok,1.63,none,0.000000
2026-05-02T19:30:42,idle,ok,1.66,none,0.000000
2026-05-02T20:04:02,health-check,ok,1.34,none,0.000000
2026-05-02T20:04:02,idle,ok,1.37,none,0.000000
2026-05-02T20:34:02,health-check,ok,1.20,none,0.000000
2026-05-02T20:34:02,idle,ok,1.23,none,0.000000
2026-05-02T21:04:02,health-check,ok,1.50,none,0.000000
2026-05-02T21:04:02,idle,ok,1.53,none,0.000000
```

File mtime confirmed: `May 2 21:04`. No writes since.

Total rows in CSV: 527 (historical archive, NOT 24-hour evidence).

## Why this matters now

`HOUSEHOLD-CONSTITUTION v0.4` (in flight, draft at `projects/family-thread-dossier/constitution-v04-amendments-proposed.md`) was scheduled to encode §11a "When idle is a failure" against this substrate. v0.3's deferral of §11a to v0.4 was procedurally correct (substrate had only 3 hours of track record). v0.4 was supposed to land §11a now that the substrate had been alive for two weeks (per ratification record). Verification on 2026-05-03 found the substrate is NOT alive; §11a was re-deferred to v0.5.

Encoding an enforcement rule into the Constitution against an unreliable substrate would have created exactly the failure mode v0.3 was prudent to avoid. The Constitution stays clean; this incident is the operational follow-up.

## Hypothesis space (rough probability order)

1. **PT30M trigger registered as one-shot, not recurring.** The Strike #1 fix preserved the XML cadence definition but the scheduled-task registration call may have collapsed `RepetitionInterval` into a one-shot start time. The observed pattern (4 fires across ~95 minutes, then silence) is consistent with a runner that picked up the task, fired it on each `RepetitionInterval` until the `RepetitionDuration` window expired, then stopped. Check whether the `<Repetition>` block's `<StopAtDurationEnd>` and `<Duration>` fields survived the round-trip.

2. **Windows Task Scheduler disabled the task post-fire.** Windows will sometimes disable a task that exits non-zero, or that hits a permissions issue, or that conflicts with another instance. The four fires could have been the runs allowed before the disable triggered. Check `Get-ScheduledTask -TaskName SartorHeartbeat | Select State`.

3. **XML preservation introduced a subtle issue.** Strike #1 explicitly preserved the XML — but XML preservation is exactly where subtle issues accumulate. Compare current task XML against `_history/heartbeat-task-pre-fix.xml` line by line. Look especially for: `<Triggers>` block changes, `<Settings>` defaults differing, `<Principal>` UserId differences, `<RegistrationInfo>` author/date drift.

4. **Runner alive but writer can't open CSV.** File lock from another process, OneDrive interference, perms drift after the 03:30 UTC sync. Check whether the heartbeat script logs to anywhere else (event log, separate log file, stderr capture) showing the fire happened but the write failed.

5. **Environment-context loss between manual and scheduled context.** The foreground validation passed because cron-engineer ran it manually; scheduled-context invocation may have a different PATH, working directory, or `$env` set. The first 4 scheduled fires worked, then a deeper environment dependency (a token refresh, a network mount, a PATH resolution against a process that died) broke them. Less likely given the observed clean stop after 4 fires (deeper env issues usually present as intermittent failures).

## Recommended diagnostic sequence

1. Re-export current task XML: `Export-ScheduledTask -TaskName SartorHeartbeat | Out-File current-task.xml`. Diff against `_history/heartbeat-task-pre-fix.xml`. Also diff against any post-Strike-#1 snapshot if cron-engineer left one.
2. Check task state: `Get-ScheduledTask -TaskName SartorHeartbeat | Select State, LastRunTime, LastTaskResult, NextRunTime`.
3. Check Windows Task Scheduler operational log for `SartorHeartbeat` entries since 2026-05-02 21:04:02 — look for "Disabled", "Failed to start", "Last task result" non-zero entries.
4. If the task says `Ready` and `NextRunTime` is in the past with no recent `LastRunTime`, the runner is silently failing — try running manually from the Task Scheduler UI to capture exit code.
5. If hypothesis 1 is correct (one-shot registration), the fix is to re-create the task with explicit `<Repetition>` definition, not a re-import of the XML.

## Cross-references

- `cron-uplift-program-v0.1` — the parent program that produced this scheduled task
- `cron-uplift-F1-personal-data-gather-v2-design` — sibling cron task; check whether it's exhibiting the same symptom
- `cron-uplift-F3-cron-health-surface-design` — the cron-health-surface design; once built, this incident would have surfaced via that channel rather than via constitution-keeper's verification
- `_history/heartbeat-task-pre-fix.xml` — pre-fix snapshot, target for diff
- `daily/2026-05-02-self-reflection.md` — the family-thread session in which Strike #1 happened
- `projects/family-thread-dossier/constitution-v04-amendments-proposed.md` — the v0.4 amendments file; E.1 records the deferral with a back-pointer to this incident

## Routing note

`cron-engineer` was a member of the dissolved `family-thread` team and is not addressable from the current `hearth-becoming` team. Per team-lead's 2026-05-03 instruction, this file is the operational follow-up channel. Team-lead will surface to Alton separately so he can decide whether to spawn a fresh cron-engineer for triage or hold until bandwidth.

## Status

- 2026-05-03: opened by constitution-keeper. Verification trail captured. Substrate NOT alive. v0.4 §11a deferred to v0.5. Awaiting Alton's routing decision.
