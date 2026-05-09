---
type: diagnostic
project: codebase-cleanup-2026-05-08
captured_by: cluster-a-pipeline (Claude Opus 4.7, 1M context, Rocinante session, 2026-05-08)
machine: Rocinante
status: evidence-only
related: [codebase-cleanup-2026-05-08/PLAN]
tags: [diagnostic, scheduled-task, curator-pass]
---

# A1 — SartorCuratorPass diagnostic

Read-only capture per Phase 1 A1 of the codebase cleanup plan. The plan claimed `SartorCuratorPass` was silent since 2026-04-14T01:39 with no subsequent log entries. The actual state is more nuanced: the task is scheduled, registered, and running cleanly twice a day; the silence is in the logs, not in the runs.

## Headline finding

The Windows Scheduled Task `SartorCuratorPass` is healthy. Last run 2026-05-08 19:30:30, exit code 0. Next run 2026-05-09 07:30:30. Two triggers per day (07:30 and 19:30), both enabled. `NumberOfMissedRuns` is 0.

The "no log" symptom from the plan has a single root cause: the wrapper writes its log file to `C:\Users\alto8\generated\`, a directory that does not exist on this machine. The wrapper does not pre-create the directory. The cmd shell's `>>` redirect to a nonexistent directory fails silently, the Python module still runs to completion, and the task records `LastTaskResult: 0` because the cmd itself returned the python exit code (0). The result: the curator runs as scheduled, emits no on-disk evidence of having run, and the audit looking for log files concluded (incorrectly) that the task was silent.

This is a Phase 2 follow-up (the plan tags A1-fix as Phase 2). Capturing the evidence here so the orchestrator can move directly to the right repair.

## Get-ScheduledTask output

```
TaskName: SartorCuratorPass
State: Ready
TaskPath: \
LastRunTime: 05/08/2026 19:30:30
LastTaskResult: 0
NextRunTime: 05/09/2026 07:30:30
NumberOfMissedRuns: 0

## Actions
Execute: wscript.exe
Arguments: "C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\run-hidden.vbs" "C:\Users\alto8\Sartor-claude-network\scripts\curator-pass-run.cmd"
WorkingDirectory: C:\Users\alto8\Sartor-claude-network

## Triggers
Trigger: CimInstance StartBoundary: 2026-04-12T07:30:00 Enabled: True
Trigger: CimInstance StartBoundary: 2026-04-12T19:30:00 Enabled: True
```

## Wrapper inspection

`C:\Users\alto8\Sartor-claude-network\scripts\curator-pass-run.cmd` (last modified 2026-04-11 23:57):

```
@echo off
setlocal
set LOGFILE=C:\Users\alto8\generated\curator-pass-%date:~10,4%-%date:~4,2%-%date:~7,2%.log
cd /d C:\Users\alto8\Sartor-claude-network
echo === %date% %time% === >> "%LOGFILE%"
python -m sartor.curator_pass -v >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
```

- `C:\Users\alto8\generated\` does not exist. Confirmed via `Test-Path` and an attempt to enumerate it.
- `C:\Users\alto8\Sartor-claude-network\generated\` also does not exist.
- The wrapper uses bare `python` rather than an absolute path. Bare `python` resolves on PATH for the alton user when the task runs, so the python binary itself is not the issue; the dropped-on-the-floor stdout is.
- `run-hidden.vbs` exists and was last modified 2026-05-08 10:09:37, so the indirection layer is current.

## Inbox evidence that proves the runs are real

Even with no log file, the curator's actual side effect (writing into `inbox/rocinante/proposed-memories/`) is visible:

```
05/08/2026 23:30:15  2026-05-09
05/08/2026 19:28:59  2026-05-08
05/08/2026 19:28:59  2026-05-07
```

The `2026-05-08` and `2026-05-09` proposal directories were touched at 19:28:59 and 23:30:15 today — the curator wrote them on the 07:30 and 19:30 runs and then again on a subsequent run. The task is doing work; only the logging is broken.

## Reframing for the plan

The plan's A1 section described two likely outcomes (task unregistered, or task registered but failing on `python` PATH). Neither matches reality. The actual state is a third bucket the plan did not name:

> Task registered, running, exiting cleanly, but its log file is dropped on the floor because the destination directory does not exist.

Phase 2 A1-fix should therefore be one of:

1. Create `C:\Users\alto8\generated\` (smallest possible repair) and retain the existing wrapper. Future runs will start producing dated log files.
2. Edit the wrapper to either `mkdir -p` the target directory at the top, or redirect to a directory that already exists (`C:\Users\alto8\backups\` mirrors the convention used by `sartor-mirror.log`, `hours-log.log`, `peer-sessions-rsync.log`).

Recommendation for Phase 2: option 2 with target `C:\Users\alto8\backups\curator-pass-YYYY-MM-DD.log`, both because it co-locates with the other Sartor scheduled-task logs and because it removes the implicit dependency on a directory whose existence nobody is checking.

## What the plan got right

The plan's framing that the curator backlog is 19 days deep (Phase 3 A4) stands. The proposals directory is not the same thing as the curator's output log; the curator has been adding to the proposal queue twice a day, but the drain step (`curator_pass` consuming proposals into core memory files) is what has actually been silent. Confirming whether `curator_pass.py` only writes proposals (without draining them itself) is a question for the orchestrator to settle when it gets to A4.
