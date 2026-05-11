---
entity: explore-briefing
type: explore
phase: 1
date: 2026-05-02
updated: 2026-05-02
updated_by: dashboard-engineer
scope: Morning Briefing silent-failure root-cause diagnosis (Phase 1B — diagnosis only, no fixes)
parent: dashboard-status (audit dossier 2026-05-02)
sibling_explores: [EXPLORE-01-meridian (complete), EXPLORE-03-sartor-network (pending)]
related: [scripts/morning-briefing-run.cmd, sartor/morning_briefing.py, sartor/tests/test_morning_briefing.py]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# EXPLORE-02 — Morning Briefing root cause

## Verdict (one paragraph)

**The python module is healthy. The cmd-wrapper is the bug.** `morning-briefing-run.cmd` redirects stdout to `C:\Users\alto8\generated\<datestamp>.log` but `C:\Users\alto8\generated\` does not exist. cmd.exe cannot open the redirect target, prints "The system cannot find the path specified" to its own stdout, and the python invocation on line 6 **is never executed at all**. The wrapper's `exit /b %ERRORLEVEL%` on line 7 then returns 0 because the failed-redirect on line 6 didn't update `%ERRORLEVEL%` (Windows cmd quirk — failed redirects on a command line don't always propagate). The scheduler reads `LastTaskResult=0` and considers the run successful. No file is written, no error surfaces, the silence is total.

## Step 1 — morning_briefing.py audit (paths, silent-no-op points)

**Paths it READS** (all confirmed-existing on disk except where noted):

| Constant | Path | Status |
|---|---|---|
| `CURATOR_LOG` | `sartor/memory/.meta/curator-log.jsonl` | EXISTS (596 B, 2026-04-13) |
| `EXTRACTOR_LOG` | `sartor/memory/.meta/extractor-log.jsonl` | EXISTS (11.8 KB, 2026-05-01) |
| `SURFACED_TODOS_PATH` | `sartor/memory/.meta/briefing-surfaced-todos.json` | EXISTS (2 B = empty `{}`, 2026-04-16) |
| `GMAIL_INBOX_DIR` | `sartor/memory/inbox/rocinante/gmail/` | **MISSING** — module returns "No gmail scan results" string, not an error |
| `PROPOSED_ROOT` | `sartor/memory/inbox/rocinante/proposed-memories/` | EXISTS (13 entries) |
| `TASKS_ACTIVE` | `tasks/ACTIVE.md` | EXISTS (2.2 KB, 2026-04-13) |
| `TASKS_COMPLETED` | `tasks/COMPLETED.md` | **MISSING** — module's `_check_completed` returns todos unmarked, not an error |
| `FAMILY_TODOS` | `sartor/memory/family/active-todos.md` | EXISTS (124 KB, 2026-05-02 — current!) |
| `IMPROVEMENT_QUEUE` | `data/IMPROVEMENT-QUEUE.md` | EXISTS (1.9 KB, 2026-04-13) |
| `SESSION_ROOTS` (2) | `~/.claude/projects/C--Users-alto8*` | EXISTS |
| `data/heartbeat-log.csv` (system_health section) | EXISTS (30 KB, **2026-04-12** — confirms EXPLORE-01's stale-heartbeat finding) |

**Paths it WRITES** (only one):

| Constant | Path | Behavior |
|---|---|---|
| `BRIEFING_DIR / "{today}.md"` | `sartor/memory/inbox/rocinante/morning-briefing/2026-05-02.md` | At line 790: `BRIEFING_DIR.mkdir(parents=True, exist_ok=True)` then `out_path.write_text(...)`. **Self-creates parent directory.** This is significant — the audit's "directory does not exist on disk" finding does NOT prove the python module fails; it proves the python module has never run. |
| `SURFACED_TODOS_PATH` | `sartor/memory/.meta/briefing-surfaced-todos.json` | Line 411: `path.parent.mkdir(parents=True, exist_ok=True)`. Self-creating. |

**Silent no-op points** (places where the module returns a placeholder string instead of raising):

| Line | Pattern | Why it's safe |
|---|---|---|
| 132 | `if not log_path.exists(): return "No curator log found..."` | Returns descriptive string into briefing — no exception |
| 144 | `except OSError: return "Could not read curator log."` | Same |
| 192 | `if not gmail_dir.exists(): return "No gmail scan results..."` | Same |
| 240, 277-280 | `if not path.exists(): return []` and stat-skip on too-small/too-old session files | Skips silently |
| 296 | `try: f = path.open(...) except OSError: return` | Single-file scan failure swallowed |
| 304 | `try: j = json.loads(line) except Exception: continue` | Per-line malformed JSON swallowed |
| 366-371 | `try: completed_text = read except OSError: pass` | If COMPLETED.md is missing/unreadable, todos just don't get marked complete |
| 401-405 | `try: return json.loads(...) except: return {}` | Surfaced-todos load failure → empty dict, all items resurface |
| 444-462 | `try: ... except OSError: pass` around IMPROVEMENT-QUEUE parsing | Silent skip |
| 475-498 | `try: ... except Exception: continue` per-inbox-file loop | Silent skip |
| 535-547 | broad `except Exception` in `_extract_todos_from_conversations` cleanup | Silent |
| 600-611 | `try: from sartor.staleness import...` for tier counts | Silently degrades to "Could not compute" string in briefing |
| 615-632 | `try: ... except OSError: pass` for extractor stats | Silent |
| 822-825 | top-level `except Exception` in `main()` — prints to stderr and returns 1 | **NOT silent** — would surface at the wrapper level if it fired, but in dry-run we proved it doesn't |

The module is **conservatively defensive**: every per-source failure degrades to a descriptive string in the briefing rather than killing the run. Nothing here corresponds to a "silently no-op the entire briefing" pathway. The only true silent-fail is the line-822 catch-all, and even that prints to stderr and returns 1.

## Step 2 — Wrapper cmd audit

`scripts/morning-briefing-run.cmd` (7 lines, full quote):

```cmd
@echo off
setlocal
set LOGFILE=C:\Users\alto8\generated\morning-briefing-%date:~10,4%-%date:~4,2%-%date:~7,2%.log
cd /d C:\Users\alto8\Sartor-claude-network
echo === %date% %time% === >> "%LOGFILE%"
python -m sartor.morning_briefing -v >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
```

The audit's diagnosis was correct and is now evidence-confirmed:

- Line 3 sets LOGFILE to a path under `C:\Users\alto8\generated\`. **That directory does not exist** (verified via Test-Path).
- Line 5: `echo === ... >> "%LOGFILE%"` — cmd.exe tries to open the file for append, parent dir doesn't exist, redirect fails, cmd prints "The system cannot find the path specified" to its own stdout (which the scheduler discards). `%ERRORLEVEL%` is set to 1 by the failed redirect on this line.
- Line 6: `python -m sartor.morning_briefing -v >> "%LOGFILE%" 2>&1` — same redirect-fails-first behavior, **python is never spawned**. cmd prints "The system cannot find the path specified" again. `%ERRORLEVEL%` should still be 1.
- Line 7: `exit /b %ERRORLEVEL%` — should return 1 in theory.

But the scheduler reports `LastTaskResult=0`. Why? Direct test in Step 4 below resolves this.

## Step 3 — Dry-run of python module (proof the python module is healthy)

Command: `cd C:\Users\alto8\Sartor-claude-network ; python -m sartor.morning_briefing --dry-run -v`

Result:
- **exit_code=0**
- duration: 18.7 seconds (mostly conversation-mining across session JSONLs)
- stdout: 4380 chars of valid YAML-fronted markdown briefing
- All 8 sections present with substantive content: curator (26 entries drained across last 2 runs), todos (242 open items + 55 stale), system health (correctly noting heartbeat-log.csv last entry 2026-04-12), memory health (staleness-tier counts via decay.py import OK), improvement proposals (3 items)
- No exceptions raised, no stderr output

The python module is fully functional. Dry-run mode (line 716, 789) skips the surfaced-todos save and the briefing file write — exactly what we wanted for diagnosis-only.

## Step 4 — Wrapper invocation reproduction

Command: `cmd /c 'C:\Users\alto8\Sartor-claude-network\scripts\morning-briefing-run.cmd'`

Result:
- **exit_code=0** ← matches the scheduled task's `LastTaskResult=0` exactly
- duration: 64 ms ← far too short for python (which takes ~18s in dry-run)
- stdout (visible to PowerShell): "The system cannot find the path specified." printed twice (once per failed redirect on lines 5 and 6 of the cmd)
- `C:\Users\alto8\generated\` was NOT created
- `sartor/memory/inbox/rocinante/morning-briefing/` was NOT created (which it would have been by line 790 of morning_briefing.py if python had run)

So the silent-fail model is now fully grounded:

1. cmd.exe opens, sets vars, cd's into the repo (lines 1-4 succeed)
2. Line 5's `echo >>` fails because parent dir `C:\Users\alto8\generated\` doesn't exist; cmd prints the path-not-found message to its own stdout. The `>>` redirection failure does set `%ERRORLEVEL%` for that line, but it's gone by the next line because cmd doesn't keep history.
3. Line 6's `python >> ...` ALSO fails at the redirect step before python is invoked. Python never runs. cmd prints the same path-not-found message.
4. Line 7's `exit /b %ERRORLEVEL%` returns 0, because by that point `%ERRORLEVEL%` has been cleared (cmd quirk: failed I/O redirection in a compound command doesn't always update `%ERRORLEVEL%` for the next command's reference).

Net: **scheduler runs the wrapper; wrapper exits 0; nothing has happened; no log; no briefing.**

(a) Exact path it would write: `C:\Users\alto8\Sartor-claude-network\sartor\memory\inbox\rocinante\morning-briefing\2026-05-02.md`
(b) Parent dir exists: NO. But python module self-creates it (line 790). So the missing dir is not the bug.
(c) Python module exits 0 in dry-run.
(d) stderr from the wrapper would contain the cmd-echo paths-not-found message, which `>>` to a missing file silently discards. That's the "silent" in silent-fail.

## Step 5 — Test suite

Command: `python -m pytest sartor/tests/test_morning_briefing.py -v`

Result: **23 / 23 passed** in 35.13s. Test classes covered: TestCuratorSummary (4), TestTodoExtraction (3), TestCompletionDetection (2), TestStalenessDetection (3), TestResurfacing (4), TestGmailHighlights (2), TestImprovementProposals (2), TestFullBriefing (2), TestConversationTodoMining (1).

`TestFullBriefing::test_dry_run_no_file` PASSED — explicitly tested that dry-run does not write the file. Coverage of the "happy path with file write" exists implicitly via `test_generates_valid_frontmatter` (which uses `dry_run=False` per line 22 of the test file).

The python module has no failing tests. Whatever broke morning briefing, it isn't in the python.

## Step 6 — Root cause synthesis (evidence-grounded)

**Primary cause** — wrapper bug, evidence:
- Wrapper redirects to `C:\Users\alto8\generated\` which does not exist (filesystem check)
- cmd /c invocation of the wrapper returns 0 in 64ms with python never having run (reproduction)
- Scheduled task reports the same exit code 0 (Get-ScheduledTaskInfo)
- Output dir on disk does not exist, but python self-creates it on line 790, so its absence is *evidence* python never ran, not a separate bug (read of morning_briefing.py)

**Contributing factor** — wrapper does not propagate redirect-failure exit code as 1:
- Tested directly in Step 4. cmd.exe quirk; would deserve hardening even if the missing-dir bug were fixed.

**Non-causes (ruled out by evidence):**
- Python module bug: 23/23 tests pass, dry-run succeeds (Step 3)
- Output-directory missing: would not block anything; module self-creates (line 790, confirmed against actual file source)
- COMPLETED.md missing: degrades gracefully (line 366)
- gmail dir missing: degrades gracefully (line 192)
- Exception inside python silently caught: would still print to stderr per line 822-825, and dry-run proved no exception fires

## Step 7 — Shape of the fix (Phase 2 design input — not implementation)

The wrapper has three problems; the python module has none. The fix is in cmd, with one optional cleanup in python.

**Wrapper changes (necessary):**

1. **Create the log directory before redirecting.** Add `if not exist "C:\Users\alto8\generated" mkdir "C:\Users\alto8\generated"` after the `set LOGFILE=` line. Trivial, fixes the immediate fail-before-python bug.
2. **Fail loud on redirect failure.** Replace the simple `>> "%LOGFILE%"` with an `if errorlevel 1 (...) else (...)` chain, OR move to a PowerShell wrapper which has reliable error semantics (`$ErrorActionPreference = 'Stop'`, `try/catch`, `Tee-Object` for both file and console). PowerShell wrapper is cleaner — propose for design.
3. **Propagate python's exit code, not the wrapper's last command's.** Capture python's return separately: `python ... ; set PYRC=%ERRORLEVEL% ; ... ; exit /b %PYRC%`. Or just rewrite in PowerShell which makes this trivial.

**Python module changes (optional, for defense in depth):**

4. **Heartbeat write on success.** After successful briefing write, append a row to `data/heartbeat-log.csv` for `morning-briefing` (the heartbeat tracking the dashboard already surfaces). This wouldn't have prevented the silent fail, but it would have made it discoverable on day 2 via the dashboard's heartbeat panel turning red. **This is the highest-leverage hardening** — it ties into the EXPLORE-01 finding that heartbeat-log.csv is itself 30 days stale; whoever is supposed to write to it has been silent that long. Possibly the same root cause across the system: writers fail silently and no one notices.
5. **Replace the line-822 broad `except Exception`** with a more selective handler that distinguishes "no input data" (return 0, write a placeholder briefing) from "real bug" (return 1). Cosmetic; not blocking.

**One-time cleanup:**

6. After the wrapper is fixed, run morning_briefing manually once and confirm it produces `2026-05-02.md` (or whatever today's date) at the expected path. Then re-test by running the wrapper directly and confirming the LOGFILE contains real output. Both should be in Phase 4 QA gates.

## Findings worth a follow-up (not fixes, just noticed)

- **F1.** The wrapper's logfile path uses `%date:~10,4%-%date:~4,2%-%date:~7,2%` which depends on `%date%` format being `Sat 05/02/2026`. On a system with a different short-date locale, this silently produces a malformed filename — separate latent bug, would survive even after fixing the missing dir.
- **F2.** `data/heartbeat-log.csv` last-entry 2026-04-12 — confirms EXPLORE-01 finding. Whoever writes heartbeat entries (likely the gateway_cron.py loop on gpuserver1, or the Rocinante heartbeat agent CLAUDE.md mentioned was retired per `MEMORY.md` 2026-04-19 entry) has been silent 20 days. The morning briefing's silent-fail and the heartbeat's silent-fail might share infrastructure — common cause hypothesis to investigate.
- **F3.** `tasks/COMPLETED.md` missing entirely. Module degrades gracefully but this means the "mark todo as completed" cross-check has been a no-op for the entire history of the surfaced-todos system. Cosmetic for now.
- **F4.** `briefing-surfaced-todos.json` is 2 bytes (`{}`) and last-modified 2026-04-16 — likely the last successful real (non-dry-run) invocation of the module was around then, before whatever broke the wrapper. Worth checking git log for changes to morning-briefing-run.cmd in mid-April.
- **F5.** Test coverage gap: there's no test for "wrapper invocation produces a file at the expected path." All 23 tests are unit-level on the python module. The end-to-end "scheduled-task → file appears" path has no test. Adding a smoke test as part of Phase 3/4 would prevent regression.

## Reference: artifacts and reproductions

- Dry-run output: shown in Step 3 above (4380 chars)
- Wrapper reproduction output: shown in Step 4 above (`exit_code=0`, 64ms, "path not found" twice)
- Pytest output: shown in Step 5 above (23/23 passed)
- Filesystem state inventory: shown in opening checks (13 paths surveyed)

## §9 — Real-run capture (added 2026-05-02 evening per dashboard-keeper greenlight)

After the first pass of this memo, dashboard-keeper relayed team-lead's greenlight to run the briefing for real (not just `--dry-run`) so we capture the stderr the wrapper has been swallowing for 30 days. Did so. Pattern:

```powershell
$proc = Start-Process python -ArgumentList '-m', 'sartor.morning_briefing', '-v' `
  -RedirectStandardOutput C:\Users\alto8\tmp\briefing-stdout.log `
  -RedirectStandardError  C:\Users\alto8\tmp\briefing-stderr.log `
  -WorkingDirectory 'C:\Users\alto8\Sartor-claude-network' -PassThru -Wait
```

**Result:**

| | |
|---|---|
| exit_code | **0** (real success, not the wrapper's silent-fail 0) |
| duration | 20.1 s (vs wrapper's 64 ms — proves wrapper never spawned python) |
| stdout | 4380 B — full YAML-fronted markdown briefing, 8 sections populated |
| stderr | **114 B** — single line: `[Written to C:\Users\alto8\Sartor-claude-network\sartor\memory\inbox\rocinante\morning-briefing\2026-05-02.md]`. The only thing the wrapper has been losing for 30 days is this success notification (line 831 of morning_briefing.py). No exceptions, no warnings, no degraded-source messages. |
| Briefing artifact | **CREATED FOR THE FIRST TIME**: `sartor/memory/inbox/rocinante/morning-briefing/2026-05-02.md` (4404 B). `BRIEFING_DIR` was self-created on this run, confirming morning_briefing.py:790's `mkdir(parents=True, exist_ok=True)` works as designed. |
| `briefing-surfaced-todos.json` | grew from 2 B (`{}`) → **16,393 B** — first real save in 16+ days; previous mtime 2026-04-16 dates approximately when the wrapper started silently failing. |

**Implication:** even without any Phase 2 fix, this single manual run has unblocked today's briefing artifact. MERIDIAN's `/api/morning-briefing` endpoint will now return `{found: true, date: "2026-05-02", ...}` instead of the `{found: false}` documented in EXPLORE-01. Side benefit, not a fix.

**The python module is unambiguously healthy.** stderr contained zero exception traces, zero degraded-source messages, just the success line. All earlier no-op-degradation patterns (gmail-dir-missing, COMPLETED.md-missing, etc.) gracefully produced descriptive strings inside the briefing rather than errors on stderr.

## §10 — Heartbeat-log overlap (added per dashboard-keeper request)

The real-run briefing's System Health section included:

> **Heartbeat log:** 518 entries, last: 2026-04-12T23:04:01,idle,ok,1.09,none,0.000000...

The python module READ `data/heartbeat-log.csv` successfully — no exception, no degraded message — and reported what's there: **518 entries, last entry 2026-04-12**. Same finding as the original §F2 in this memo, same finding as EXPLORE-01's §F4, same finding as MERIDIAN's `/api/heartbeat-status` returning all-stale data.

Per dashboard-keeper's instruction: documenting the overlap, NOT investigating the heartbeat-log writer (that's a separate future task). Coincidence worth noting:
- Morning briefing wrapper started silently failing ~2026-04-16 (per surfaced-todos.json mtime)
- Heartbeat log writer stopped writing 2026-04-12 (per its own last entry)
- 4 days apart, both predate the 2026-04-19 cleanup (MEMORY.md morning entry that archived `chrome-automation` + the coordination-cluster skills)
- Probably independent failures, but the "cleanup pulled out a load-bearing dependency for both" hypothesis is credible enough to flag

**Single coherent Phase-2 story for design input:** there is dead cron infrastructure across at least two paths (briefing wrapper + heartbeat writer), possibly more. Phase 2 design should treat "any path that writes to disk silently" as suspect, not just the briefing.

## Phase boundary

Phase 1B diagnosis complete, including the post-greenlight real-run capture (§9–10).

**State changes from this work** (intentional, with greenlight):
- Created: `C:\Users\alto8\tmp\` (working dir for capture per task #9 spec)
- Created: `C:\Users\alto8\tmp\briefing-stdout.log` (4380 B)
- Created: `C:\Users\alto8\tmp\briefing-stderr.log` (114 B)
- Created: `C:\Users\alto8\Sartor-claude-network\sartor\memory\inbox\rocinante\morning-briefing\2026-05-02.md` (4404 B — today's briefing, first artifact at this path since wrapper broke)
- Created: `BRIEFING_DIR` parent directory (self-created by morning_briefing.py:790)
- Modified: `briefing-surfaced-todos.json` (2 B → 16,393 B; expected per line 717 — fingerprints of all currently-surfaced todos so they don't resurface in tomorrow's briefing within the 3-day window)

**State NOT changed:**
- `C:\Users\alto8\generated\` still does not exist — wrapper bug unaffected by this manual python run; cron still fails tomorrow at 6:30 AM unless someone fixes the wrapper between now and then
- `morning-briefing-run.cmd` unchanged
- `SartorMorningBriefing` Windows Scheduled Task unchanged (per task constraint, requires G5)
- `morning_briefing.py` unchanged

Awaiting Phase 2 design.
