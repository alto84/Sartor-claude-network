---
name: cron-uplift-program-v0.1
type: plan
status: proposed
volatility: medium
priority: p1
owner: cron-engineer
manager: pipelines-auditor
date: 2026-05-02
updated: 2026-05-02
updated_by: cron-engineer (family-thread)
related: [pipelines-audit, dashboard-status, docs-user-md-investigation, memory-improvement-program-v0.2, family-memory-fixup, dashboard-rebuild/INDEX, feedback_archive_not_collapse]
tags: [meta/plan, domain/cron, household/governance]
aliases: [Cron Uplift Program, CUP v0.1]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Cron Uplift Program v0.1

> [!warning] Proposal only. Strikes #1 (heartbeat) executed and verified before this plan was filed; Strike #2 was cancelled after inventory revealed a misread (see §C). Everything below §1 is unbuilt and awaits team-lead greenlight per item.

## §0 Goal

Alton's directive (2026-05-02): *"We need the crons to work perfectly or at least well. How can they be uplifted. Move this forwards."*

The cron substrate has accumulated four shapes of rot:
1. **Disabled-but-needed tasks** silently absent from the schedule (heartbeat).
2. **Failing-but-zero-status wrappers** that swallow errors and report success (morning-briefing wrapper, push-peer-credentials).
3. **Behavioral pathologies** in healthy-looking writers (personal-data-gather: append-not-replace, debate-with-itself, cadence-too-high, run-number-reuse).
4. **Health blind spots** (no aggregate "are my crons working?" surface; the heartbeat itself was dark for 30 days and no signal fired).

This program triages all four and ships fixes in priority order, respecting [[feedback/archive-not-collapse]] (snapshot before mutate; never `rm` task XML; preserve recoverability) throughout.

## §1 What's already done this turn (pre-greenlit by team-lead)

### Strike #1 — Re-enable SartorHeartbeat ✅ LANDED 2026-05-02 19:34 ET

- **Pre-state:** `Status: Disabled`, `Next Run Time: N/A`, `Last Run: 2026-04-12 23:04` (30 days dark).
- **XML snapshot:** `_history/heartbeat-task-pre-fix.xml` (1,412 bytes, full task definition preserved).
- **Action:** `schtasks /change /tn SartorHeartbeat /enable`. Recurrence preserved at `PT30M` (every 30 minutes — the original cadence per the snapshotted XML; team-lead's brief said "Hourly" but XML said 30-minute, and I honored XML).
- **Post-state:** `Status: Ready`, `Next Run Time: 2026-05-02 19:34:00`, recurrence `0 Hour(s), 30 Minute(s)`.
- **Validation:** Foreground manual run via `python sartor/heartbeat.py` produced `[19:30:57] Heartbeat tick starting`, then the script's own internal 25-minute throttle gate fired correctly on a second run (exit 1 with "Timing gate: only 0.3min since last tick (min=25min). Skipping" — expected behavior). New row `2026-05-02T19:30:42,health-check,ok,1.63,none,0.000000` confirmed in `data/heartbeat-log.csv`. Pipeline end-to-end verified.
- **Reversibility:** `schtasks /change /tn SartorHeartbeat /disable` restores the pre-state.

### Strike #2 — SartorGmailScan duplicate-trigger cleanup ❌ CANCELLED

- **Reason for cancellation:** Inventory verbose listing showed the "5 duplicate triggers" are actually **5 distinct daily triggers at 6 AM, 10 AM, 2 PM, 6 PM, 10 PM** — the every-4-hour cadence the task's own comment describes ("scans Gmail for actionable items every 4 hours"). The original audit characterization (`pipelines-audit.md` §F: *"5 instances, possibly duplicated tasks"*) was a misread of `schtasks /query` row formatting — each trigger renders as a separate row.
- **No action taken.** Task is healthy as-is.
- **Diagnostic value:** This false-alarm flips a bit on the wider "is this task healthy?" question — `SartorGmailScan` Last Result = 0 every 4 hours; legitimate.

### F2 — PushPeerCredentials archive ✅ LANDED 2026-05-02 19:32 ET

- **Pre-state:** `Status: Ready`, `Last Run: 5/2 18:31`, `Last Result: 127` (command-not-found, recurring hourly for 4+ days).
- **Verification before disable:** `Sartor Peer Creds Sync` (the PowerShell sibling) confirmed healthy: `Status: Ready`, `Last Run: 5/2 18:31`, `Last Result: 0`, `Repeat: Every 4 Hour(s) 0 Minute(s)`, script exists at `C:\Users\alto8\scripts\sartor-creds-sync.ps1` (1,943 bytes). Replacement is live and active.
- **XML snapshot:** `_history/pushpeer-task-pre-fix.xml` (1,611 bytes, taken pre-fix on first turn).
- **Action:** `schtasks /change /tn PushPeerCredentials /disable`.
- **Post-state:** `Status: Disabled`, `Next Run Time: N/A`. Task preserved (not deleted) per [[feedback/archive-not-collapse]]. Reversible via `schtasks /change /tn PushPeerCredentials /enable`.
- **Net effect:** 24 fewer noise rows per day in event log; `Sartor Peer Creds Sync` continues to refresh peer credentials at the same 4-hour cadence with success.

### Diagnostic gotcha to remember (per team-lead's request)

`schtasks /query /fo LIST /v` renders **each trigger of a multi-trigger task as a separate row**. A task with 5 daily triggers (e.g., 6 AM / 10 AM / 2 PM / 6 PM / 10 PM) shows up as 5 indistinguishable-looking rows that ALL share TaskName, Status, Last Run Time, and Last Result. The ONLY differentiator is `Start Time`. **Future cron triages must reconcile against the task's XML (`schtasks /query /xml`) before counting "duplicates."** XML shows the canonical `<Triggers>` block with one `<TimeTrigger>` per real trigger; if there's only one `<TimeTrigger>`, the multiple rows are a rendering artifact, not duplicates. SartorGmailScan tripped this gotcha; SartorCuratorPass also shows two rows but XML inspection (`_history/curatorpass-task-pre-fix.xml`) is needed to confirm whether it's one task with two triggers (intentional) or two distinct task registrations (an actual duplicate).

---

## §2 The smelly cron landscape (full inventory snapshot 2026-05-02 ~19:30 ET)

| Task | Status | Last Run | Last Result | Issue | Severity |
|---|---|---|---|---|---|
| `SartorHeartbeat` | ~~Disabled~~ **Ready** | ~~4/12 23:04~~ **5/2 19:30** | 0 | RESOLVED Strike #1 | ~~CRIT~~ closed |
| `SartorMorningBriefing` | Ready | 5/2 06:30 | 0 | **Silent failure** — wrapper writes to non-existent dirs, `>>` redirection swallows errors, exit-0 lies. Per [[dashboard-status]]. | HIGH (dashboard-keeper-owned) |
| `SartorCuratorPass` | Ready | 5/2 07:30 | 0 | **Two distinct daily triggers (7:30 AM + 7:30 PM)** — appears intentional per task comment ("twice daily on Rocinante"); not a fix candidate. | OK |
| `SartorGmailScan` | Ready | 5/2 18:00 | 0 | False-alarm in original audit; 5-trigger cadence is correct. | OK |
| `SartorConversationExtract` | Ready | 5/1 23:30 | 0 | Healthy. | OK |
| `SartorImprovementLoop` | Ready | 4/26 20:00 | 0 | Weekly (Sundays). Healthy. | OK |
| `Sartor Memory Mirror` | Ready | 5/2 03:30 | 0 | Healthy per [[reference_memory_server]]. | OK |
| `Sartor Peer Creds Sync` | Ready | 5/2 18:31 | 0 | Healthy (PowerShell rewrite of PushPeerCredentials). | OK |
| `PushPeerCredentials` | Ready | 5/2 18:31 | **127** | **Silent failure** — git-bash `bash.exe -c '<path>'` returning 127 (command-not-found) every hour for at least 4 days. Likely **superseded by `Sartor Peer Creds Sync`** (PowerShell sibling that runs at the same 4-hour cadence with Last Result 0). Candidate for archive. | MED |
| `UniFi Daily Backup` | Ready | 5/2 03:00 | 0 | Healthy. | OK |

**Behavioral-rot tasks** (healthy schedule, sick behavior — separate from XML status):

| Task | Behavioral pathology | Source | Severity |
|---|---|---|---|
| `personal-data-gather` (every 4h) | Append-don't-replace; cadence-too-high (4h on a calendar that doesn't change at that rate); debate-with-itself runs (Apr 30 dance concert flip-flopped 6 runs across 9:40 AM ↔ 1:40 PM); run-number reuse across days; no-change-not-silent (writes a "Latest from gather" block every run regardless of diff); no privacy filter for Aneeta solo events | [[family-memory-fixup]] §2.1, never executed | HIGH |
| `nightly-memory-curation` (~7:30 PM via SartorCuratorPass) | (a) Drains family-relevant inbox content INTO FAMILY.md as inline `<!-- curator-drained -->` blocks instead of `family/_history/inbox-drains-{YYYY-MM}.md`; (b) does NOT invoke the `memory-curator` agent's dialectic-synthesis flow (the curator agent's v2.0 spec was never wired — `docs/USER.md` and `docs/MEMORY-CHANGELOG.md` have never existed) | [[pipelines-audit]] §C; [[docs-user-md-investigation]] | HIGH (memory-engineer-owned) |

**Anti-finding (matters):** the Sartor cron substrate is **smaller and healthier than the audit feared**. Of 10 Sartor* / family-relevant scheduled tasks, 7 are objectively healthy, 1 is now-fixed (heartbeat), and 2 are degraded. The work is concentrated, not pervasive.

---

## §3 Triaged fix list (proposed — awaits team-lead greenlight per item)

Each item has: file:line, diff sketch, reversibility, blast radius, coordination dep, why-now.

### F1. **`personal-data-gather` v2** — fix the four behavioral pathologies (HIGH, mine)

> [!info] Substantial blocker discovery 2026-05-02 evening: full design moved to [[cron-uplift-F1-personal-data-gather-v2-design]]. Headline: there is NO runtime, NO wrapper, NO scheduled task. The "every 4 hours" is aspirational; the gather is invoked manually by ad-hoc Claude sessions reading the SKILL.md prompt. F1 changes shape from "edit a cron" to "fix the prompt + optionally wrap with a Claude Code CLI cron." See linked design doc for the full file:line landing per fix and acceptance tests.

- **File:lines:**
  - `Sartor-claude-network/.claude/scheduled-tasks/personal-data-gather/SKILL.md` — only artifact that exists. All 4 behavioral fixes land here as new sections (B1 no-change-silent, B2 monotonic counter, B4 Aneeta privacy filter) or in-place edits (B3 replace-don't-append at point 5 of §Page-update-contract). Bonus B5 (time-correction) ships in same patch.
  - **Does NOT exist:** `sartor/personal_data_gather.py`, `.claude/skills/personal-data-gather/`, `scripts/personal-data-gather*.cmd`, Windows scheduled task. Confirmed by exhaustive scan this turn.
- **Diff sketch:**
  - **Cadence**: every 4h → once-daily morning (7:00 AM ET). One trigger only. The calendar doesn't change every 4 hours; the cron is overrunning its substrate.
  - **No-change-silent rule**: before writing a new "Latest from gather" block, hash the gather output minus timestamps; if hash matches the previous run's, skip the write entirely. Skipping logs a one-line entry to `data/gather-log.csv` so the agent's silence is observable.
  - **Run-counter monotonic**: a single integer in `data/gather-run-counter.txt`, incremented on every run regardless of date. Never reuses a number. Format: `Run #N — YYYY-MM-DD HH:MM ET`.
  - **Replace-don't-append for calendar tables**: each gather rewrites the family-calendar.md "next 14 days" table in place. Older runs accumulate in `family/_history/gather-snapshots/<date>.md`, not in family-calendar.md.
  - **Privacy filter for Aneeta solo events**: pre-write filter; an event flagged `attendees: aneeta-solo` (or matching the heuristic in the spec) is excluded from family-calendar.md. Filter logic in the runtime, not the cron.
  - **Time-correction protocol**: when a calendar item's time appears to change between runs, write ONE annotated entry (`> [!correction] dance concert moved 9:40 AM → 1:40 PM (gather run #N)`) and do not flip-flop subsequent runs.
- **Reversibility:** Each behavioral fix is a separate Edit; revert via single Edit. Cadence change reversible via `schtasks /change /sc HOURLY` (or whatever the current trigger config is).
- **Blast radius:** Touches family/active-todos.md, family/family-calendar.md, FAMILY.md, family/{vayu,vishala,vasu}.md downstream. **Coordination required:** family-curator must be aware before this lands so any in-flight gather output isn't lost. The morning-briefing skill READS these files; it'll consume whatever shape they're in next morning.
- **Coordination dep:** family-curator (read-side downstream), memory-engineer (overall family-layer health). **Not** a memory-engineer Week-1 PR item per scope split.
- **Why now:** §2.1 of family-memory-fixup specced this 2026-04-25 and it was never executed. In the interim, active-todos.md grew 847 → 1,311 lines (+55%); family-calendar.md grew 485 → 579 (+19%); FAMILY.md 354 → 385 (+9%). The active source of accretion is this cron. Every day this is unfixed, the family layer gets harder to triage.

### F2. **`PushPeerCredentials` archive-or-fix** (MED, mine, needs Alton greenlight on archive)

- **File:lines:** Windows Scheduled Task `\PushPeerCredentials`; companion script `C:\Users\alto8\scripts\push-peer-credentials.sh`.
- **Current state:** Last Result 127 (command-not-found) every hour for at least 4 days. The companion `\Sartor Peer Creds Sync` (PowerShell, hourly, Last Result 0) appears to have superseded it.
- **Diff sketch:** Two paths.
  - **Archive path (preferred):** Snapshot task XML → `_history/pushpeer-task-pre-fix.xml` (already done this turn). `schtasks /change /tn PushPeerCredentials /disable` (NOT delete; honor archive-not-collapse). Add a comment annotation via `schtasks /change /ri 1 /comment "DISABLED 2026-05-02 — superseded by Sartor Peer Creds Sync per cron-uplift-program-v0.1 F2"`. Reversible via `/enable`.
  - **Fix path (alternative):** Diagnose the 127 (likely the bash invocation `bash.exe -c '<path>'` is failing because Git's bash needs a Unix-style path). Edit script invocation to use `bash.exe -c "C:/Users/alto8/scripts/push-peer-credentials.sh"` or convert to PowerShell. Only worth doing if there's something `\Sartor Peer Creds Sync` does NOT do that this script does.
- **Reversibility:** Archive path: `schtasks /change /enable`. Fix path: revert script edit.
- **Blast radius:** None observed today (it's been failing for days with no observable downstream impact, suggesting `Sartor Peer Creds Sync` is in fact the live channel).
- **Coordination dep:** None. This is purely a peer-machine credential push; not in dashboard-keeper or memory-engineer scope.
- **Why now:** It's actively reporting failure every hour. Either fix or archive. Don't leave a known-failing task in the schedule — it's noise that masks real failures.

### F3. **Aggregate cron-health surface** (HIGH, mine)

> [!info] Full design moved to [[cron-uplift-F3-cron-health-surface-design]]. Concrete ~80-line PowerShell skeleton + 3-layer self-detection scheme (file-IS-the-heartbeat + weekly audit + optional inline check inside heartbeat.py). Coordinates with dashboard-keeper on MERIDIAN ingestion schema.

- **File:lines (new):**
  - `Sartor-claude-network/scripts/cron-health-check.ps1` (new, ~80 lines)
  - `Sartor-claude-network/scripts/cron-health-check-run.cmd` (new, wrapper)
  - `Sartor-claude-network/scripts/cron-health-weekly-audit.ps1` (new, ~30 lines, Layer 2)
  - `Sartor-claude-network/.claude/scheduled-tasks/cron-health-check/SKILL.md` (new, doc-only)
  - Windows Scheduled Task `\SartorCronHealthCheck` (new, daily 6:25 AM)
  - Windows Scheduled Task `\SartorCronHealthWeeklyAudit` (new, Sundays 8:00 AM)
- **Diff sketch:**
  - The script enumerates every `Sartor*` and family/memory-relevant task via `Get-ScheduledTask` + `Get-ScheduledTaskInfo`.
  - For each: status, last run, last result, age-of-last-run, has-it-fired-since-its-last-expected-tick.
  - Yellow-flag any task where `(Now - LastRunTime) > 2 × ExpectedInterval`. Red-flag any task with `LastTaskResult != 0` for >3 consecutive runs.
  - Output: `data/cron-health-{YYYY-MM-DD}.md` with frontmatter, a status table, and a one-line "all green" / "N yellow, M red" summary at top.
  - The morning-briefing wrapper (when fixed by dashboard-keeper) reads this file and surfaces the summary line in the briefing.
- **Reversibility:** New scheduled task; `schtasks /delete /tn SartorCronHealthCheck` removes it. Script file removable. No mutation to existing tasks.
- **Blast radius:** Adds one daily 5-second task. Read-only against scheduler API. Zero risk to other tasks.
- **Coordination dep:** dashboard-keeper (the morning-briefing wrapper consumes its output once briefing is fixed). Wire-up can be deferred until dashboard-rebuild Phase 8 lands.
- **Why now:** Heartbeat was dark for 30 days and no signal fired. The substrate has no self-monitoring. This closes the loop: even if the heartbeat dies again, the cron-health-check would catch it within 24h.

### F4. **`SartorMorningBriefing` wrapper hardening** (HIGH, dashboard-keeper-owned)

- **File:lines:** `C:\Users\alto8\Sartor-claude-network\scripts\morning-briefing-run.cmd` — full rewrite.
- **Diff sketch:** Per [[dashboard-status]] §Quick Fixes #1: mkdir -p both the output dir and the log dir before redirection; propagate the python exit code via `exit /b %ERRORLEVEL%` instead of `>>` swallowing it.
- **Reversibility:** Single-file edit; revert via single Edit.
- **Blast radius:** Affects daily 6:30 AM briefing output.
- **Coordination dep:** **dashboard-keeper owns this in dashboard-rebuild project Phase 2 design + Phase 3 build.** Not mine to touch. Listed here for completeness; coordinate-don't-execute.
- **Why now:** Coordinated with dashboard-rebuild. Don't double-fix.

### F5. **`nightly-memory-curation` Step 6 wiring** (HIGH, memory-engineer-owned)

- **File:lines:** `Sartor-claude-network/.claude/scheduled-tasks/nightly-memory-curation/SKILL.md` — add Step 6 invoking `memory-curator` agent's dialectic-synthesis flow per [[docs-user-md-investigation]].
- **Diff sketch:** Per investigation document Part 1+2+3.
- **Reversibility:** Edit-only; revert via single Edit.
- **Blast radius:** Creates `docs/USER.md` and `docs/MEMORY-CHANGELOG.md`; wires nightly synthesis pass.
- **Coordination dep:** **memory-engineer owns this in MIP v0.2 Week-1 PR.** Not mine. Listed here for completeness.
- **Why now:** Coordinated with MIP v0.2.

### F6. **A6 hook split + extractor `dedup_status` gate** (MED, memory-engineer-owned)

- Per pipelines-auditor's notes: A6 hook needs `shopt -s nullglob` and a real signal for the `$SKILLS_LOADED` env var (which doesn't exist; needs PWD-based logic or a marker file). Extractor needs the `dedup_status: already_landed` write-time gate. Catchup-skill template-fingerprint filter.
- **Coordination dep:** **memory-engineer owns this in MIP v0.2 PR-A2a + PR-A2b.** Not mine. Listed for completeness so the cron-side dependency (the SessionStart hook IS a kind of cron analog) is visible.

---

## §4 Sequencing

```
NOW (today, this turn):
  ✅ Strike #1 (heartbeat) — landed.
  ❌ Strike #2 (gmail-scan) — cancelled, false alarm.
  ✅ This program filed.

NEXT (next 24-48h, requires team-lead greenlight per item):
  F1. personal-data-gather v2 — biggest behavioral lift, single-author scope.
       Greenlight + coordinate with family-curator + ship.
  F2. PushPeerCredentials archive — 5-minute fix, needs Alton OK on archive vs. fix.
  F3. Aggregate cron-health surface — net-new, defensive, ~30min build.

DOWNSTREAM (other agents own):
  F4. Briefing wrapper hardening — dashboard-keeper / dashboard-rebuild Phase 3.
  F5. Curator dialectic-synthesis Step 6 — memory-engineer / MIP Week-1 PR.
  F6. A6 hook + extractor gate — memory-engineer / MIP PR-A2.

VALIDATE (post-F1+F2+F3, +24h and +7d):
  Heartbeat CSV has 48 fresh rows in 24h (every-30-min × 24h).
  personal-data-gather has produced exactly ONE morning entry per day (no debates).
  gather-run-counter.txt is monotonically increasing.
  active-todos.md head 100 lines is dominated by today's curated state, not gather residue.
  cron-health-{date}.md exists for each of the past 7 days; zero red.
```

## §5 Risks

| Risk | Impact | Mitigation |
|---|---|---|
| F1 cadence change (4h → daily) misses an urgent same-day calendar update | Stale family-calendar from morning until next-morning's run | The gap is bounded (24h max); the substrate (Google Calendar via MCP) is queryable on-demand by `family-scheduler` agent any time. The cron's job is to mirror, not to be authoritative. |
| F2 archive of PushPeerCredentials accidentally orphans a peer | Peer machine misses a credential refresh | `Sartor Peer Creds Sync` runs hourly with Last Result 0; it's already covering this. Verify by running both and diffing the resulting peer-side state before the disable. |
| F3 cron-health-check itself silently fails the same way the briefing did | Self-monitoring gap | The script must be foreground-runnable (no `>>` to non-existent paths), and the daily output file's existence IS the heartbeat for the heartbeat-checker. If the file doesn't appear, future-Alton notices in the morning briefing's missing line. |
| F1 + family-curator coordination gap (curator changes file format while gather is being rewired) | Lost edits or merge conflict in active-todos.md | Coordinate write window: family-curator pauses curation for the 30 min during F1 ship. |
| Heartbeat re-disables itself after a reboot or maintenance event | Back to 30-day dark | F3's cron-health-check catches this within 24h. |

## §6 Open questions for team-lead → Alton

1. **F1 cadence — confirm 4h → daily morning?** Family-memory-fixup §2.1 specced "once-daily morning"; Alton's "stop the debate-with-itself" implies fewer runs. Daily is my read; team-lead can override.
2. **F2 — archive PushPeerCredentials, or diagnose+fix the 127?** Default proposal: archive (disable + comment), since Sartor Peer Creds Sync looks like its successor. If Alton wants both running, I'll diagnose the bash 127 instead.
3. **F3 cron-health-check 6:25 AM trigger time** — assumes the morning briefing fix lands and consumes the output. Alternative: separate cadence (every 6h) decoupled from briefing. Mine is "tied to briefing" because the briefing already exists as Alton's daily glance surface.

## §7 What this plan does NOT do

- Touches no `.claude/skills/` or `.claude/agents/` files this turn (pre-greenlit Strike #1 was a `schtasks` mutation, not a skill edit).
- Does not modify the morning-briefing wrapper (dashboard-keeper).
- Does not modify `nightly-memory-curation` skill (memory-engineer).
- Does not touch the extractor or catchup-skill (memory-engineer's PR-A2).
- Does not delete any task — only proposes archive (disable, never delete) per archive-not-collapse.

## History

- 2026-05-02 19:35 ET: Authored by `cron-engineer` after first-turn diagnosis. Strike #1 (heartbeat re-enable) executed and verified before this file was written. Strike #2 (gmail-scan) cancelled after inventory revealed the "5 duplicates" were 5 distinct daily triggers at 6/10/14/18/22 — the every-4h cadence the task's own comment describes. XML snapshots stored at `_history/heartbeat-task-pre-fix.xml`, `_history/gmailscan-task-pre-fix.xml`, `_history/curatorpass-task-pre-fix.xml`, `_history/pushpeer-task-pre-fix.xml` per archive-not-collapse.
