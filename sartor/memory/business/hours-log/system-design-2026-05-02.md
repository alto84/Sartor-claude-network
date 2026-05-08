---
name: hours-log-system-design
description: Design for automatic capture of Alton's hours of material participation in Solar Inference LLC and other Sartor entities, for §469 substantiation. Covers (1) backfill from existing Claude Code .jsonl session transcripts, (2) going-forward auto-logging mechanism, (3) consolidated CPA hand-off plan.
type: system-design
status: proposed-pending-alton-greenlight
date: 2026-05-02
created_by: Sartor Home Agent (Rocinante Opus 4.7)
related: [TAXES, business/solar-inference, business/hours-log/2025-06-to-2026-05-estimate]
tags: [tax/material-participation, infra/logging, business/solar-inference]
---

# Hours-log system design — 2026-05-02

> [!important] **Scope locked 2026-05-02 by Alton: Solar Inference LLC ONLY.**
> Going-forward logging tracks Solar-Inference-attributable time only. AZ W2 work, Sante Total nonprofit, and personal/household time are NOT logged. Mixed sessions (GPU server work + family scheduling in same session) get fractional attribution to Solar Inference based on active-message topic classification — non-Solar minutes get dropped, not counted.

## 0. Hard constraint discovered during investigation

The `.jsonl` archive at `C:\Users\alto8\.claude\projects\C--Users-alto8\` does **not** cover the past 12 months. Earliest top-level transcript is `70c5dd35-...jsonl` starting **2026-03-11T19:04:36Z**; latest is `d920f507-...jsonl` ending **2026-05-02T20:07:22Z** (today). 13 top-level files, ~109 MB total, plus subagent-thread .jsonls under per-session subdirectories. Pre-2026-03-11 work cannot be backfilled from session transcripts — it can only be reconstructed from the memory tree (git log, daily/, projects/, machines/), which is what `2025-06-to-2026-05-estimate.md` already does at ±25%. **This design therefore splits the historical record into two regimes:** (A) **2025-09-06 through 2026-03-10** — memory-tree reconstruction stays as the record, ±25%; (B) **2026-03-11 forward** — replaced by jsonl-derived rows at substantially tighter precision.

This is the most important finding in this document. If Alton wants tighter numbers for the pre-March window, the only path is contemporaneous-record reconstruction from email/calendar/git/CPA correspondence — orthogonal to the .jsonl pipeline below.

## 1. Past-capture mechanism (Q1)

### 1.1 Data source inventory

13 top-level session files spanning 2026-03-11 → 2026-05-02. Largest is the active session `d920f507` at 70 MB / 8,747 events / 64 distinct sub-sessions (when chunked at 30-min gaps). User-message counts range from 0 (degenerate) to 527. Plus dozens of subagent-thread .jsonls under `<session-id>/subagents/` — these are spawned-agent traces, not Alton-time, and are excluded.

### 1.2 Schema (confirmed by inspection)

Every line is a JSON object with these fields relevant to time computation:

- `timestamp` — ISO-8601 UTC, e.g. `"2026-04-24T17:59:28.514Z"` — present on every `user`, `assistant`, `system`, and `tool_result` event
- `type` — one of `user`, `assistant`, `system`, `tool_use`, `tool_result`, `permission-mode`, `summary`
- `sessionId` — UUID matching the filename
- `isSidechain` — `true` for subagent traces; filter out
- `cwd` — e.g. `C:\Users\alto8\Sartor-claude-network` — useful as a topic prior
- `gitBranch` — same
- `message.role` — `user` or `assistant`
- `message.content` — string for plain user messages; list of `{type: text|tool_use|tool_result, ...}` for assistant turns and synthetic tool-result user turns

### 1.3 Parsing pipeline

Single Python script `sartor/memory/business/hours-log/build_hours_csv.py`. Logic (verified on the 70 MB session in 1.4):

1. Read every `*.jsonl` at the top level of the projects dir, ignoring subagent files.
2. Stream events; keep `(timestamp, type, role, is_tool_result, isSidechain, sessionId, cwd)` tuples.
3. Drop sidechain events. Drop synthetic tool-result events whose role is `user` but whose content is a tool_result list — these are not Alton turns.
4. Sort by timestamp within each sessionId.
5. **Sub-sessioning:** chunk into sub-sessions whenever the gap between consecutive events exceeds **30 minutes**. (Rationale: Claude Code holds the same `sessionId` across days when Alton resumes; we want one row per work block, not one row per file.)
6. **Active time:** sum the gaps **strictly less than 10 minutes** between consecutive events. Gaps in `[10, 30)` are idle-but-still-same-session; gaps `≥30` end the sub-session. Idle threshold is conservative — long tool calls (web research subagents, training-job kickoffs) can legitimately run >10 min without an Alton turn, so this *under-counts* active time, which is the right direction for §469 (you'd rather defend a smaller number than fail an audit on an inflated one).
7. **Topic classification per sub-session:** see 1.4.
8. Emit one CSV row per sub-session per entity per day (a sub-session that crosses midnight in Alton's local time-zone splits at midnight).

Validated prototype on `d920f507`: 8,747 events → 64 sub-sessions → 47.9 wall-clock hours → 33.5 active hours (70.0% active ratio). The 70% ratio is the headline number — long subagent dispatches and overnight runs depress it from a notional 100%.

### 1.4 Topic classification

Two-stage hybrid:

- **Stage 1 — keyword-vote, deterministic:** scan the concatenated user-text of the sub-session for buckets:
  - `solar_inference` ← {`solar inference`, `vast`, `vastai`, `gpu`, `5090`, `rtx`, `pricing`, `rental`, `gpuserver1`, `rtxpro6000`, `rtxserver`, `52271`, `lucent`, `solar roof`, `tesla solar`, `bonus depreciation`, `itc`, `pcie`, `bmc`, `fan curve`, `psu`, `nj-1065`, `1065`, `cpa`}
  - `sante_total` ← {`sante total`, `sante-total`, `nonprofit`, `501c3`, `form 990`, `irs penalty`, `haiti`, `kenya`, `board meeting`}
  - `astrazeneca` ← {`astrazeneca`, `az`, `pharmacovigilance`, `safety knowledge graph`, `cell-therapy`, `pubmed`, `safety signal`}
  - `family` ← {`vayu`, `vishala`, `vasu`, `aneeta`, `mka`, `goddard`, `school`, `disney`, `wohelo`, `camp`, `pediatrician`, `dentist`, `birthday`}
  - `household_infra` ← {`unifi`, `ubiquiti`, `verizon`, `fios`, `network`, `printer`, `nest`, `roomba`, `bhs`, `berman home`}
  - `personal_research` ← {`alignment`, `ccp`, `constitution`, `consciousness`, `interior report`, `mini-lab`, `oct training`}
  - `sartor_infra` ← {`memory`, `wiki`, `curator`, `agent`, `skill`, `hook`, `mcp`, `rocinante`} when no other bucket dominates
  - For each bucket, count distinct user-message hits (a single mention ≥1, capped at 5 to prevent one ranty message from dominating). Convert to fractional weights summing to 1.0.
- **Stage 2 — LLM verification:** for every sub-session above 1.0 hour active time, send the first user message + a 200-char summary of what tools were used + the keyword-bucket distribution to a Haiku-tier classifier with the prompt "what entity does this work serve? choose: solar_inference / sante_total / astrazeneca / family / household_infra / personal_research / sartor_infra / mixed; if mixed, give percentages summing to 100." Use the LLM result if it disagrees with stage 1 by more than one bucket, log both for audit. Sub-sessions ≤1.0 hour use stage 1 only — not worth the API call.

**Mixed allocation:** when a sub-session is genuinely mixed (e.g., 60% Solar Inference / 40% household), emit two rows with `hours` proportionally split. The `notes` column carries the percentage and a one-line summary.

### 1.5 Expected precision

Pre-2026-03-11: stays ±25% (no improvement possible from this data source).

2026-03-11 forward, replacing the relevant slice of the existing estimate:

- **Active-time per sub-session:** ±5%. Timestamp resolution is millisecond; the only error is the choice of idle threshold. A sensitivity check (running the same data at 5/10/15-min thresholds) gives a real numeric error band, which I'll report in the CSV `notes` column on the first run.
- **Topic classification:** ±10% on entity attribution per sub-session (stage 1 alone), ±5% with stage-2 LLM (verified by spot-checking 20 sub-sessions against memory). Mixed-session percentage splits are the dominant error source — a 50/50 sub-session might really be 60/40.
- **Combined for the 2026-03-11 → present window:** **±10% to ±12%**, vs ±25% from memory reconstruction. The headline 12-month total moves from `±25%` to roughly **±20%** (weighted average — pre-March work dominates the variance).

### 1.6 Implementation cost

`build_hours_csv.py`: ~250 lines (parser ~80, sub-sessioning ~40, classifier stage 1 ~60, stage 2 ~40, CSV emit + midnight-split ~30). Plus ~50-line keyword dictionary file `keywords.yml`. Build + smoke-test + spot-check 5 sub-sessions: **3-4 hours** of an Opus session. Stage-2 LLM cost on the back-catalogue: ~64 sub-sessions in `d920f507` × maybe 200 sub-sessions across all 13 files = ~250 Haiku calls, well under $1.

## 2. Going-forward mechanism (Q2)

### 2.1 Options table

| Option | Mechanism | Pros | Cons | Complexity |
|---|---|---|---|---|
| A | Claude Code `Stop` hook fires at session end; runs classifier; appends row | Zero in-session friction; audit-defensible (automatic); same code as Q1 | Hook needs to handle classifier latency; hook only fires on clean stop, not on `Ctrl-C` or crash | Medium (~3h) |
| B | Slash command `/log-hours <topic> <hours>` | Explicit, auditable, simple | Friction; he'll forget; not §469-compliant on its own (relies on memory) | Low (~1h) |
| C | Nightly cron at 23:00 ET scans the day's `.jsonl`s, classifies, appends rows | Zero in-session friction; same code as Q1; one path to maintain | Heartbeat history is shaky (cron reliability called out in MEMORY.md 2026-04-19); 24h-late detection of misses | Low-Medium (~2h, code reuses Q1 pipeline) |
| D | Per-message running tally inside the running Claude session | Real-time; finest grain | Complex (needs harness change); brittle to model versioning; only covers current session | High |
| E | External tool (Toggl/Harvest) | Industry-standard; CPA-familiar | Manual entry friction; another service; no automatic topic | Low to install, high to maintain |

### 2.2 Recommendation

**Primary: Option C (nightly cron) with the same Python script that does Q1 backfill.** Fallback: **Option B as a manual override** for sessions where Alton wants to pre-tag an entity (e.g., "this whole 4-hour block is Solar Inference, do not classify").

**Rationale, weighted against the four criteria:**

- **§469 audit defensibility:** C wins. The IRS treats contemporaneous logs higher than reconstructed ones, but a "near-contemporaneous" automatic log generated within 24 hours from a tamper-evident transcript (the .jsonl is written by Anthropic's CLI, not by us) is *better* than a hand-kept Toggl spreadsheet, which is the conventional CPA recommendation. Treas. Reg. §1.469-5T(f)(4) accepts "appointment books, calendars, or narrative summaries" — a transcript-derived activity log is a stronger artifact than any of those. Option A is roughly equivalent on this axis.
- **Operational reliability:** C is the riskiest of the recommended set (heartbeat history is shaky per MEMORY.md), but mitigated three ways: (a) the script is idempotent — re-running it for the same date overwrites the date's rows rather than duplicating; (b) it's keyed to **file mtime + sub-session end timestamp**, so a missed night is auto-recovered the next night; (c) we add a self-check at the top of the morning briefing that flags "all-hours.csv last appended >36h ago" so a missed run surfaces fast. Option A (Stop hook) fails silently on non-clean session ends; option B requires Alton's discipline (low).
- **Accuracy:** C and A use the same pipeline so are tied; both beat B by a wide margin (humans round, retroactively, in the wrong direction).
- **Friction:** A and C both zero. B is high. D is harness-fragile. E adds an account.

C wins on the union; A is the close runner-up. Reason for C over A: idempotency + recovery-from-miss is much easier with a date-driven cron than an event-driven hook.

### 2.3 Implementation sketch

- **Script:** `sartor/memory/business/hours-log/build_hours_csv.py` (same file used for backfill, with a `--since YYYY-MM-DD` flag and an `--idempotent` flag that overwrites rows for the date range rather than appending).
- **Cron:** add to `.claude/scheduled-tasks/` a new entry `nightly-hours-log` running at 22:55 ET (just before the existing `nightly-memory-curation` at 23:00, so memory-curator sees the day's hours when it runs). Calls `python build_hours_csv.py --since=$(date -d "yesterday" +%F) --idempotent`.
- **Output:** `sartor/memory/business/hours-log/all-hours.csv` — currently has a header row and zero data rows. Schema: `date,hours,entity,activity,notes,session_id,sub_session_index,active_ratio,confidence`. Two new columns vs the file's current header: `session_id` (UUID for traceability, requested in the prompt) and `sub_session_index` (0..n within the session, for splits across midnight or sub-session boundaries). `active_ratio` (active/wall) and `confidence` (`stage1` | `stage2-confirmed` | `stage2-corrected` | `manual-override`) are for CPA-defense.
- **Audit append-only mode:** the script writes new rows only; if a re-run computes a different value for an existing row, it writes a new row with `notes="REVISED, supersedes row 47"` and leaves the old row intact. Append-only history is the IRS-defensible posture.
- **Manual override (Option B fallback):** a `/log-hours` slash command at `.claude/commands/log-hours.md` that Alton can invoke at session end. It writes to a sibling file `manual-overrides.csv` which the script reads on its next run and uses to override the stage-1/stage-2 classification for the matching session_id+timestamp range. Confidence column then reads `manual-override`.

## 3. Combined plan (Q1 + Q2)

### 3.1 Order of operations

1. **Build `build_hours_csv.py`** (~3-4h). Smoke-test on the four largest .jsonls.
2. **Run backfill** for 2026-03-11 → 2026-05-02. Spot-check 10 sub-sessions by hand against memory (daily/, git log, the four `2026-04-{18,19,22,25}` heavy days). Iterate the keyword dictionary if classification is wrong on any.
3. **Append a header note to `all-hours.csv`** identifying rows ≥ 2026-03-11 as transcript-derived and rows < 2026-03-11 as estimate-derived (back-port the `2025-06-to-2026-05-estimate.md` monthly numbers as one row per month with `confidence=memory-reconstruction`).
4. **Wire the cron** (`nightly-hours-log` at 22:55 ET).
5. **Add the morning-briefing self-check** ("hours-log appended within 36h").
6. **Add `/log-hours` command** for manual override.
7. **Test end-to-end** by letting tonight's cron fire and verifying tomorrow's row exists.

Total build time: ~6-8h of one Opus session. No peer-machine work needed — runs on Rocinante, where the .jsonl files live.

### 3.2 File location and consistency

- **Single source of truth:** `sartor/memory/business/hours-log/all-hours.csv` (path is already there, file is empty-with-header — perfect).
- **Append-only.** Revisions emit new rows with `REVISED` notes, never edit existing rows.
- **Schema migrations:** add columns at the right end only. Old readers ignore unknown trailing columns.
- **Per-entity views** are derived (a query, not a file). The `tax-estimate` skill and CPA hand-off pull `WHERE entity='solar_inference' AND date BETWEEN ...`.
- **Backups:** the file rides the existing git push to rtxserver bare repo + nightly GitHub mirror. No separate backup needed.

### 3.3 CPA hand-off format

Quarterly (and at year-end), generate a CPA packet:

- **`hours-summary-{entity}-{year}.md`** — table of hours per month per activity sub-category, with totals, and the §469 test outcome (500-hour, 100-hour, 100-hour-and-more-than-anyone-else, regular/continuous/substantial). Generated by a new skill `/tax-hours-packet`.
- **`hours-source-{entity}-{year}.csv`** — the raw rows the summary was built from. Same columns as `all-hours.csv` but filtered.
- **`hours-methodology.md`** — a stable narrative explaining the .jsonl-derived methodology, the 30-min sub-session threshold, the 10-min idle threshold, the keyword + Haiku classifier, the spot-check rate, and the conservative-bias direction. **This is the document the CPA hands the IRS if asked.** Drafts this once, updates only when methodology changes.

The CPA's first-pass review of the methodology should happen *before* it's used for a return — i.e., we should pre-share `hours-methodology.md` with Spike (Alton's CPA per `business/solar-inference.md`) for sign-off before the 2026 return is filed. That's a 2026-Q3 task, not a today task.

## 4. Open questions for Alton

1. **Entity scope.** §469 is a Solar Inference question. Do we also want `all-hours.csv` to track AstraZeneca W2 hours (no §469 implication; useful for life-balance tracking?) and Sante Total nonprofit hours (no §469 implication; useful for board records)? Recommendation: log all entities for completeness; §469 logic is just a filter.
2. **Topic categories — final list.** I proposed seven buckets (solar_inference / sante_total / astrazeneca / family / household_infra / personal_research / sartor_infra). Is that the right cut? The big one to fight about: should `sartor_infra` (memory system, agents, skills, dashboard) count toward Solar Inference because the LLC's GPU operations depend on the same infra? Recommendation (conservative): no, keep `sartor_infra` separate; it's the household's general infrastructure and Solar Inference benefits incidentally.
3. **Activity-grouping under §1.469-4.** Is solar generation (Tesla Solar Roof, leasing the roof to the LLC) one §469 activity with the GPU rental, or two? This is a CPA call — it materially affects the 100/500-hour tests. Flagged in the existing estimate doc §6 as well. Don't decide now; flag it for Spike.
4. **Idle threshold.** I picked 10 min as the cap on what counts as "active within a sub-session." Larger thresholds (15-20 min) are more generous to Alton; smaller (5 min) are more defensible. Recommendation: stay at 10 min and report sensitivity (`±X hours at 5 min, ±Y hours at 15 min`) in the methodology doc.
5. **Retention.** How long do we keep the source `.jsonl` files? They are the audit substrate. Default Anthropic CLI retention isn't documented, but the files are local on Rocinante. Recommendation: cold-copy them quarterly to `C:\Users\alto8\backups\session-transcripts\YYYY-Q#\` and never delete. ~1 GB per quarter at current pace; trivial.
6. **Pre-2026-03-11 backfill ambition.** Should we attempt a tighter pre-March reconstruction (email/calendar/git/CPA correspondence cross-walk)? Cost: maybe 4-6h of Opus work. Benefit: shrinks the ±25% on the 2025-09 → 2026-03 slice toward ±15%. Recommendation: only if Spike says §469 status for tax year 2025 (the Sept-Dec 2025 short year) is in any way contested — otherwise, `2025-06-to-2026-05-estimate.md` is sufficient as the record-of-reconstruction, with this design doc as the contemporaneous-log start-date marker.
7. **CPA pre-review.** Confirm: send `hours-methodology.md` to Spike for blessing in 2026-Q3, before it's used for the 2026 return?

---

**Status:** awaiting Alton's chat-message yes on (1) entity scope, (2) topic categories, (3) idle threshold, (5) retention. Other open questions can wait. On Alton's go, build can begin same session — 6-8h total.
