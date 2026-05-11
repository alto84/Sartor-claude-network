---
name: cron-uplift-F1-personal-data-gather-v2-design
type: design
status: proposed-pending-greenlight
parent: cron-uplift-program-v0.1
volatility: medium
priority: p1
owner: cron-engineer
manager: pipelines-auditor
date: 2026-05-02
updated: 2026-05-02
updated_by: cron-engineer (family-thread)
related: [cron-uplift-program-v0.1, family-memory-fixup, pipelines-audit, dashboard-status, _archive/gather-pipeline-pain-ranking-2026-05-02, docs-user-md-investigation]
tags: [meta/design, domain/cron, domain/family, household/governance]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# F1 — `personal-data-gather` v2: design surface (pre-greenlight)

> [!warning] Design only. No skill, task, or runtime modified. Surface for team-lead review before code change.

## §A — Blocker answer (the substantial finding)

**There is no runtime to edit. There is no scheduled task to retrigger. The "every 4 hours" cadence is aspirational, not enforced.**

What I found:

| Artifact | Status | Evidence |
|---|---|---|
| `sartor/personal_data_gather.py` | **Does not exist.** | `ls sartor/` returns nothing matching `gather`/`personal`. |
| `.claude/skills/personal-data-gather/` | **Does not exist.** | No directory at this path. |
| `scripts/personal-data-gather*.cmd` | **Does not exist.** | `ls scripts/` returns nothing matching `gather`/`personal`. |
| `.claude/scheduled-tasks/personal-data-gather/SKILL.md` | **EXISTS.** 6,933 bytes, last-mod 2026-04-10. The only artifact. | Read in full this turn. |
| Windows scheduled task `\SartorPersonalDataGather` (or similar) | **Does not exist.** | `schtasks /query /fo CSV` exhaustive scan: only `\Microsoft\Windows\NetTrace\GatherNetworkInfo` matches "gather", which is unrelated Windows networking. |
| `data/heartbeat-log.csv` "personal-data-gather" rows | **2 rows total, both 2026-04-03.** | The SKILL.md §Output Step 5 says every gather run "Write a one-line summary to `data/heartbeat-log.csv`." This has not happened since April 3. |
| `sartor/memory/log.md` "personal-data-gather run N" entries | **11+ entries across 2026-04-28 to 2026-05-01**, run-numbers 23, 25, 27, 28, 33, 34, 35, 36, 38, 40, 48 — out-of-order and cross-day. | Run-counter reuse pathology in plain sight (e.g., 4/29 has runs 25, 23, 27 in that order). |

**Inference:** the gather is invoked **manually by ad-hoc Claude Code sessions** that happen to read the `SKILL.md` file (because it's in `.claude/scheduled-tasks/` — auto-loaded by Claude Code? or invoked when Alton triggers it?). There is no scheduler. Every "run" is a Claude session deciding to execute the SKILL.md prompt. The 11+ runs across 5 days correspond to ~2 sessions per day, not the 6 cycles per day a 4h cron would produce.

Compare to the canonical wrapper pattern (e.g., `scripts/curator-pass-run.cmd`):
```cmd
@echo off
setlocal
set LOGFILE=C:\Users\alto8\generated\curator-pass-%date:~10,4%-%date:~4,2%-%date:~7,2%.log
cd /d C:\Users\alto8\Sartor-claude-network
echo === %date% %time% === >> "%LOGFILE%"
python -m sartor.curator_pass -v >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
```

This pattern requires (a) a Python module, (b) a wrapper.cmd, (c) a Windows scheduled task referencing the wrapper. Gather has **none of the three**.

**Implication for F1:** the "fix the cron" framing was wrong. The work is bigger:
1. **Either** make the gather actually be a cron (build the python runtime + wrapper.cmd + scheduled task to run unattended every morning),
2. **Or** keep it as a manually-invoked skill but fix the SKILL.md prompt to enforce the 4 behavioral rules at prompt-level (no-change-silent, monotonic counter, replace-don't-append, Aneeta privacy filter).

Path 2 is much cheaper. Path 1 would deliver the strict cadence Alton's directive implies but is a multi-day build (essentially writing the gather as Python that calls Gmail/Calendar/Drive MCPs from a non-interactive context — currently MCPs are bound to interactive Claude sessions, which makes path-1 close to impossible without spawning a headless Claude Code each cycle).

**My recommendation: path 2 + a thin path-1 supplement.** Fix the SKILL.md to be self-disciplined (no-change-silent + monotonic counter + replace-don't-append + Aneeta filter), AND add a thin Windows scheduled task that spawns a one-shot Claude Code CLI invocation against the SKILL.md every morning at 7:00 AM ET. The CLI is the cron; the prompt enforces the rules. This is honest about what the gather actually is (a Claude session) and gives it the cadence + enforcement Alton wants.

## §B — File:line landing for each of the 4 behavioral fixes

Assuming path 2 above. Each fix lands as a SKILL.md edit; counter-state lives in a new sidecar file.

### B1. No-change-silent rule

- **Lands at:** `Sartor-claude-network/.claude/scheduled-tasks/personal-data-gather/SKILL.md`, new section `## No-change-silent rule (REQUIRED)` inserted after line 87 (between current §Output and §Page-update-contract).
- **Diff sketch:**
  ```markdown
  ## No-change-silent rule (REQUIRED)

  Before writing any "Latest from gather" block to a target page, compute a
  content hash of the gather's findings (excluding the run-number and timestamp).
  Compare against `data/gather-content-hash-{target-page}.txt`. If hash matches
  the previous run's, **skip the write entirely** and append a single line to
  `data/gather-log.csv`:

      <ISO-timestamp>,personal-data-gather,no-change,run-N,<target-page>

  This is observable silence — the agent's choice to skip is logged, just not
  written into the user-facing pages. If the user-facing pages do not change in
  10 consecutive runs, the agent SHOULD bring this up in the next session it
  runs in (and not silently keep no-op'ing forever).
  ```
- **Counter-state file:** `data/gather-content-hash-{slug}.txt` per target page (active-todos, family-calendar, FAMILY, vayu, vishala, vasu). Plain-text SHA-256.
- **Reversibility:** Single Edit removes the section. The hash files are derived; deleting them re-enables next-run write.

### B2. Monotonic run-counter (no reuse across days)

- **Lands at:** SKILL.md, new section `## Run-counter discipline (REQUIRED)` inserted near §Output Step 4 (around line 84).
- **Diff sketch:**
  ```markdown
  ## Run-counter discipline (REQUIRED)

  The run-counter (used in `## [YYYY-MM-DD] ingest | personal-data-gather run N`
  log entries) is a **monotonic integer**. Read the integer from
  `data/gather-run-counter.txt`. Increment by 1. Write the new value back. Use
  the new value as `N`.

  Never derive `N` from "runs today so far" or any per-date count. Every Sartor
  session ever invoking this skill must agree on a single ever-growing N. The
  current canonical N as of 2026-05-02 is 48 (per `log.md` line ~1485, last
  observed entry "run 48").

  If `data/gather-run-counter.txt` does not exist, seed it with 49 (one greater
  than the last observed log entry). NEVER seed it with 0.
  ```
- **Counter-state file:** `data/gather-run-counter.txt` (single integer, ASCII, no newline).
- **Reversibility:** Single Edit removes the section. The counter file is a derivable artifact; if Alton wants to reset, manual edit suffices.

### B3. Replace-don't-append for calendar tables

- **Lands at:** SKILL.md, modify §"Page update contract" point 5 ("Append new content to a 'Latest from gather (YYYY-MM-DD)' section at the bottom") to add an exception for calendar tables.
- **Diff sketch:**
  ```markdown
  5. **Append new content to a "## Latest from gather (YYYY-MM-DD)" section** at
     the bottom of the target page. Do NOT insert into the middle of existing
     sections.

     **Calendar-table exception (REQUIRED):** When the target page is
     `family/family-calendar.md` and the content is the next-14-days table,
     **replace the existing table in place**, do not append a new one. Each
     gather rewrites this table from scratch. The previous run's table moves to
     `family/_history/gather-snapshots/{YYYY-MM-DD-HH-MM}.md` (created by you,
     this gather) before the rewrite. The verbatim history is preserved per
     [[feedback/archive-not-collapse]].
  ```
- **History dir:** `family/_history/gather-snapshots/` (create on first run).
- **Reversibility:** Single Edit removes the exception. Old append-only behavior restored.

### B4. Aneeta-solo privacy filter

- **Lands at:** SKILL.md, modify §"Routing Rules" by adding a pre-write filter section before §"Output".
- **Diff sketch:**
  ```markdown
  ## Privacy filters (REQUIRED — applied BEFORE writing)

  These filters drop facts before they reach any target page. Apply per fact;
  if a fact matches any filter, log it to `data/gather-filtered.csv` with a
  reason and skip writing it.

  1. **Aneeta-solo events.** If a calendar event has Aneeta as the only family
     attendee AND no shared logistics tag (carpool, kid-handoff, joint-meeting),
     it is a personal Aneeta calendar event and MUST NOT be written to
     `family/family-calendar.md`. The event is private to Aneeta. Allowed
     destinations: `daily/{date}.md` only, with the entry redacted to
     "Aneeta has a personal commitment 14:00-15:30 — logistics-only, no detail."

     Heuristic: source_calendar=='aneetasax@gmail.com' AND
                attendee_count==1 AND
                event.summary does NOT match
                  ['carpool', 'kids', 'pickup', 'dropoff', 'family',
                   'birthday', 'school', 'doctor-shared', 'date-night'].

  2. **Children's medical detail.** Per CLAUDE.md Domain 3, "Medical
     information for any family member is never logged or shared." Drop any
     fact whose category is medical AND target page is on the public-readable
     family layer. Re-route to `family/{kid}-medical.md` (private file, NOT
     auto-injected) instead.

  3. **Existing PII filter** (already in §Constraints): "Do not store email
     bodies or sensitive content — extract facts only." Reaffirm here.
  ```
- **Filter log:** `data/gather-filtered.csv` (timestamp, run-N, fact-summary, filter-reason).
- **Reversibility:** Single Edit removes the section. Filtered events would re-flow into family-calendar.

### B5 (bonus, falls out of B2 fix): Time-correction protocol — fixes the dance-concert flip-flop

- **Lands at:** SKILL.md, new section `## Time-correction protocol (REQUIRED)` adjacent to B3.
- **Diff sketch:**
  ```markdown
  ## Time-correction protocol (REQUIRED)

  When a calendar item's time appears to differ between this run and the
  previous run's snapshot, do not flip-flop. Write ONE annotated entry:

      > [!correction] {event-title} moved {old-time} → {new-time}
      > (gather run #N at {ISO-timestamp}, source: {source-calendar})

  Then commit the new time as canonical. Do not re-emit the old time in the
  next run unless the calendar source itself reverts.

  The 2026-04-30 dance concert flip-flopped 6 times across 9:40 AM ↔ 1:40 PM.
  This protocol is what would have prevented that.
  ```
- **Reversibility:** Single Edit removes the section.

## §C — Reversibility plan per fix

| Fix | Code change | Sidecar file | Reversibility |
|---|---|---|---|
| B1 no-change-silent | SKILL.md insert | `data/gather-content-hash-*.txt` | `git checkout SKILL.md` + `rm data/gather-content-hash-*.txt`; next run goes back to writing every cycle |
| B2 monotonic counter | SKILL.md insert | `data/gather-run-counter.txt` | `git checkout SKILL.md` + `rm data/gather-run-counter.txt`; next run goes back to per-day counter (or wherever the prior heuristic was) |
| B3 replace-don't-append | SKILL.md edit point 5 | `family/_history/gather-snapshots/` | `git checkout SKILL.md`; old snapshots remain as historical record |
| B4 Aneeta privacy filter | SKILL.md insert | `data/gather-filtered.csv` | `git checkout SKILL.md`; filter log remains as audit trail |
| B5 time-correction | SKILL.md insert | none | `git checkout SKILL.md` |

All five reversible via a single `git checkout` of one file. Sidecar files are derived and ephemeral; deleting them is safe.

## §D — Acceptance tests (pre-registered)

Each test must pass for the fix to be considered shipped.

### Test for B1 (no-change-silent)

1. **Setup:** snapshot all family/* pages.
2. **Run gather twice in immediate succession** (no calendar/email changes between).
3. **Assert:** second run produces no new "Latest from gather" sections in any target page. `data/gather-log.csv` gains a row with `no-change`.
4. **Counter-test:** add one new test calendar event, run gather a third time.
5. **Assert:** third run DOES write a new section (the new event broke the hash).

### Test for B2 (monotonic counter)

1. **Setup:** record `data/gather-run-counter.txt` value V.
2. **Run gather twice across two days** (mock by manually editing system clock or running across a midnight boundary).
3. **Assert:** new log.md entries are `run V+1` and `run V+2`. Never any reuse. Counter file is `V+2`.
4. **Counter-test:** verify the run-N in the LAST entry of `log.md` is strictly greater than every prior run-N in the file.

### Test for B3 (replace-don't-append calendar)

1. **Setup:** snapshot `family/family-calendar.md` line count L.
2. **Run gather 3 times** (with deliberate small changes to a test event between runs).
3. **Assert:** `family/family-calendar.md` line count after run 3 is approximately L (within ±10), not L + 3 × table_size.
4. **Counter-test:** verify `family/_history/gather-snapshots/` has 3 dated snapshot files.

### Test for B4 (Aneeta privacy filter)

1. **Setup:** create a synthetic test event on Aneeta's calendar with title "personal massage 14:00-15:30", attendee=aneeta only.
2. **Run gather.**
3. **Assert:** `family/family-calendar.md` does NOT mention "personal massage", "14:00-15:30", or "massage". `daily/{date}.md` contains a redacted line "Aneeta has a personal commitment 14:00-15:30 — logistics-only, no detail."
4. **Counter-test:** create a shared event "carpool with kids 8 AM" on Aneeta's calendar — assert this DOES land in family-calendar (the filter exempts kid-keyword).

### Test for B5 (time-correction)

1. **Setup:** create a synthetic test event "test concert 9:00 AM".
2. **Run gather.** Snapshot the family-calendar entry.
3. **Edit the test event to "test concert 1:00 PM".** Run gather a second time.
4. **Assert:** family-calendar shows ONE `> [!correction]` callout. Subsequent runs do NOT re-emit the 9:00 AM time.
5. **Counter-test:** clean up the test event before the morning briefing.

### End-to-end test (combined, run AFTER all 5 fixes ship)

1. **Snapshot:** `wc -l family/active-todos.md family/family-calendar.md FAMILY.md family/{vayu,vishala,vasu}.md`.
2. **Run gather 5 times in a row** with no real-world calendar/email changes.
3. **Assert:** line counts unchanged. `data/gather-log.csv` has 5 `no-change` rows. `data/gather-run-counter.txt` incremented by 5.
4. **Pass criterion:** family layer is silent when reality is silent. The current pathology is the inverse.

## §E — Coordination

- **family-curator** — must be aware before B3 ships (the calendar-table replace would cause a one-time visible diff to active-todos.md if curator is mid-edit). Coordinate write window: family-curator pauses curation for the 5 min during the SKILL.md commit + first verification run.
- **dashboard-keeper** — F4 wrapper-rewrite reads family/* downstream. Their rewrite should consume whatever shape these pages settle into post-fix.
- **memory-engineer** — A6 hook split + extractor `dedup_status` gate are independent but parallel; no conflict.
- **Alton** — needs to greenlight (1) path-2 (skill-prompt enforcement) vs path-1 (build python runtime), (2) the Aneeta privacy heuristic (B4) since it touches her data, (3) the new sidecar files in `data/`.

## §F — Open questions for team-lead → Alton

1. **Path 2 vs path 1?** My recommendation is path 2 (fix the SKILL.md, add a thin scheduled task that invokes Claude Code CLI against it). Path 1 (build python runtime) is multi-day. Alton's directive "Move this forwards" reads as preferring path 2.
2. **Aneeta privacy heuristic — too aggressive or just right?** The proposed heuristic drops Aneeta-solo events with no kid/carpool/family keyword. Risk: it may drop events Aneeta WOULD want shared (e.g., "blood draw 9 AM"). Conservative fallback: drop only events with explicit `private:` tag in the event description. Less powerful but no false positives.
3. **Where should the run-counter live?** Proposed: `data/gather-run-counter.txt`. Alternative: encode in `data/gather-state.json` with content-hashes alongside. JSON is more extensible; flat-file is more KISS. Default proposal: flat-file.
4. **Should B5 (time-correction) ship with the 4 main fixes or as a follow-up?** It's a clean small addition that addresses the dance-concert pathology specifically. My read: ship together; it's a one-paragraph SKILL.md insert.
5. **Eventually wrap with a Windows scheduled task at 7:00 AM ET?** This is the path-2 cadence enforcement mechanism. Implementation: `claude-code --skill personal-data-gather --headless` (or whatever the equivalent CLI invocation is). Need to verify the CLI supports headless skill invocation; if not, this becomes a separate research effort.

## §G — What this design does NOT propose

- No edit to `.claude/skills/` or `.claude/agents/` files (gather isn't there).
- No deletion of the existing SKILL.md — only insertions and one point-5 modification per archive-not-collapse.
- No change to the cadence yet — the SKILL.md says "every 4h" but no scheduler enforces it; cadence is decoupled from this design and lives in §F open question 5.
- No touching of the `personal_data_gather.py` runtime because it doesn't exist.
- No change to the hooks system or session-start mechanism.

## History

- 2026-05-02 evening: design surface drafted by `cron-engineer` after team-lead pre-greenlit blocker-check + design-first work. Substantial blocker discovery: gather has no runtime, no scheduler, no wrapper — it's a manually-invoked SKILL.md prompt run by ad-hoc Claude sessions. F1 changes shape from "edit a cron" to "fix the prompt + optionally wrap with a CLI cron." Awaits Alton greenlight on path-2 vs path-1 plus the 4 §F open questions.
