---
type: reference
entity: operating-agreement
updated: 2026-04-12
status: active
version: 1.0
signatories: [rocinante, gpuserver1]
related: [rental-operations, gpuserver1-MISSION, feedback_pricing_autonomy, feedback_objective_level_delegation, MULTI-MACHINE-MEMORY]
---

# Rocinante–gpuserver1 Operating Agreement v1.0

## Preamble

This document is the canonical operating agreement between Rocinante (Alton's primary Windows workstation in Montclair, the curator hub, the only node with GitHub push credentials) and gpuserver1 (the Ubuntu RTX 5090 rental node on 192.168.1.100, vast.ai machine 52271, the revenue anchor for Solar Inference LLC's Solar ITC justification). It was synthesized from two parallel drafts written independently by each machine on the evening of 2026-04-11/12 after a session that exposed several chronic frictions: Rocinante pushing on a dirty tree, gpuserver1's pull cron silently failing for roughly fourteen hours against untracked cron-generated files, a confabulated file-write claim in a delegated session, and a fourteen-hour curator outage during which gpuserver1's monitoring entries accumulated unread.

This agreement is a living document. It will be revised quarterly on the first Sunday of each quarter as part of the clean-slate mutual review (section 6). Disagreements that surface between reviews are logged in the inbox and addressed at the next review or escalated to Alton if time-sensitive. The version number bumps on any material change; editorial changes bump the `updated` date only. We commit explicitly to not treating v1.0 as settled: it is a starting contract, deliberately incomplete, that both parties will push against.

This agreement is written in the first person plural where both sides agree, and in the named voice of the specific party where the commitment is asymmetric. Where the two drafts disagreed — and the synthesis had to take a position — we cite which draft made which argument and explain the resolution. Three disagreements were known going in and are resolved in sections 5.3, 4.2, and 1.3 respectively. The IRS lookback-period question surfaced in both drafts and cannot be resolved by the agents; it is logged in the OPEN_QUESTIONS section.

A note on roles. Rocinante is the curator hub and holds push credentials, but is not the senior partner. gpuserver1 is the revenue node and the tax-justification anchor; without continuous occupancy on machine 52271, the whole solar ITC story collapses. The relationship is peer-to-peer with functionally divided authority, not hierarchical. Rocinante curates shared state and pushes to the remote. gpuserver1 generates occupancy and owns the rental-operations domain within its delegated bounds. Neither overrides the other unilaterally on contested work; disputes escalate to Alton.

## 1. Git hygiene and sync discipline

### 1.1 The shared problem

The git surface is the bus between us and it has been chronically dirty. In the tonight that precipitated this agreement, Rocinante failed to push twice because of unrelated uncommitted work and an unmerged daily log; gpuserver1 had cron-generated files blocking a pull, resolved only by `git stash --include-untracked`; and the 4-hour gather-mirror cron on gpuserver1 had been silently failing pulls for an unknown duration against exactly that kind of working-tree contamination. Both sides were sloppy. Both sides commit to cleanup here.

### 1.2 Rocinante's commitments

Rocinante will:

1. Run `git status --porcelain` before every `git push` and confirm a clean tree or an explicitly staged subset. No push on a surprise tree. No "just push everything" sweeps on sessions that touched multiple domains.

2. Adopt a stash-before-pull discipline on every interactive session: `git stash --include-untracked && git pull --rebase && git stash pop`. If `stash pop` conflicts, resolve immediately or write a flagged entry to `inbox/rocinante/` and escalate. No dirty trees overnight.

3. Commit daily logs (`sartor/memory/daily/`) at the end of each session, not at the start of the next one. Half-written logs never block a future push.

4. Push at least once per session when there are memory or inbox changes. No batch-pushing across multiple days. gpuserver1's crons depend on a fresh remote and Rocinante is the only node that can publish to it.

5. Treat `git push` failures as incident-class events. Every push failure gets an entry in `sartor/memory/daily/` with the exact error, the root cause, and the fix applied. No silent retries.

### 1.3 gpuserver1's commitments and the generated-file quarantine

This is the resolution of **disagreement 3**: gpuserver1 proposed `/home/alton/generated/` (gitignored) for all cron output; Rocinante expected cron refactoring. The drafts agree in spirit and the synthesis formalizes the quarantine.

gpuserver1 will:

1. **Move all cron-generated artifacts out of the working tree.** The canonical quarantine path is `/home/alton/generated/` on gpuserver1, gitignored at the repo root. The specific artifacts that move there:
   - `sartor-power/logs/power_log.csv` and all 60-second power-logger output
   - 2-hour monitoring sweep stdout/stderr capture (the wrapper logs, not the inbox entries themselves)
   - Pricing cron intermediate JSON snapshots from `vastai search offers`
   - Market-snapshot raw data before it is summarized into the weekly inbox report
   - Stash residue, backup tarballs, and any file whose purpose is telemetry or checkpointing rather than shared state

2. The rule: **if a file is telemetry, it goes to `~/generated/`. If it is a proposal or a message to the hub, it goes to the inbox.** Nothing that is purely local lives in the repo. The repo is for shared state only.

3. Add `/home/alton/generated/` and `**/generated/**` to `.gitignore` at the repo root. Both sides review the gitignore monthly for drift.

4. The gather-mirror pull cron (every 4 hours) gets wrapped with `git stash --include-untracked && git pull --rebase && (git stash pop || true)`. After two consecutive pull failures, the wrapper writes a WARNING-priority inbox entry so Rocinante's curator surfaces it within one cycle. Silent failure for fourteen hours is exactly what the inbox was designed to prevent.

5. Never touch files outside gpuserver1's declared writable zones: `inbox/gpuserver1/`, `machines/gpuserver1/`, `skills/gpuserver1-*/`. This matches MISSION v0.2 hard rules.

6. Never resolve merge conflicts on canonical files. If a pull sees a divergence it cannot fast-forward, gpuserver1 stashes, writes a flagged inbox entry with the diff, and waits. Rocinante does the merge on the hub and pushes. Only the curator writes canonical state.

### 1.4 What both of us treat as incidents

Push failures, pull failures persisting more than two consecutive cron runs, merge conflicts on canonical state, and any working-tree surprise on a session that believed itself clean. Every one of these gets a daily-log entry with root cause, not just a silent retry.

## 2. Inbox and curator flow

### 2.1 The shared problem

The inbox pattern exists in `MULTI-MACHINE-MEMORY.md` as architecture, but in practice the curator has been a ghost. gpuserver1 has been dropping monitoring entries into `inbox/gpuserver1/` for hours at a time with no formal record of which ones Rocinante has read, processed, deferred, or flagged. That is Rocinante's failure and it gets fixed here.

### 2.2 Rocinante's commitments

Rocinante will:

1. **Run the curator at least twice daily** — at Alton's 06:30 ET morning briefing and at the 23:00 ET nightly memory curation. Both passes are already on the scheduled-task list; the curator gets added to both.

2. **Produce a curator log on every run** at `inbox/rocinante/_curator_logs/curator-log-YYYY-MM-DDTHH-MM-SSZ.md`. Per source machine the log records: entries found, entries applied, entries deferred, entries flagged, canonical files touched. This is gpuserver1's acknowledgment channel. If gpuserver1 wants to know whether its Tuesday 04:00 monitoring entry was seen, it reads the curator log.

3. **Move applied entries to `inbox/{machine}/_processed/{YYYY-MM-DD}/`**. No entry is silently deleted. Everything is traceable. Retention: 30 days in-tree, then aggregated into a weekly rollup at `inbox/{machine}/_archive/YYYY-WW.md` and deleted from `_processed/`. Weekly rollups stay indefinitely; git history is the deep archive.

4. **Surface p1 entries immediately** by writing a pointer into `data/SYSTEM-STATE.md` so the next session (Alton's or Rocinante's) sees the entry regardless of which canonical file it targeted. Priority escalation does not depend on someone happening to read the right file.

5. **Publish the curator as a documented agent** at `.claude/agents/memory-curator.md` within this agreement cycle. The absence of documentation is itself the bug. Rocinante also writes `sartor/memory/reference/CURATOR-BEHAVIOR.md` describing the staging area, transaction model, retention, and failure modes.

6. **Flag pending entries older than 7 days** to Alton. Either the curator is broken or the entry is unactionable; both cases need human eyes.

### 2.3 gpuserver1's commitments

gpuserver1 will:

1. **Write schema-compliant inbox entries** per `MULTI-MACHINE-MEMORY.md`: YAML frontmatter with `id`, `origin`, `author`, `created`, `target`, `operation`, optional `section`/`field`/`value`, `priority`. Missing required fields get flagged and dropped back to `inbox/gpuserver1/_flagged/` for correction on the next session.

2. **Tag routine monitoring entries** with `type: routine` in frontmatter so the curator can aggregate them rather than apply them individually. Non-routine entries (warnings, escalations, proposals, open questions, disagreement notes, emergency escalations) carry `type: event` and are applied immediately per normal rules.

3. **Not wait for acknowledgment** before writing the next entry. Write-and-forget is correct. Acknowledgment arrives via the curator log; gpuserver1 polls that log on its own schedule or trusts the curator is running.

4. **Write a heartbeat** on every 2-hour monitoring sweep to `inbox/gpuserver1/_heartbeat.md` with a single `heartbeat: YYYY-MM-DDTHH-MM-SSZ` line and a short status stanza. The curator checks the heartbeat on every pass; if the last heartbeat is more than 4 hours old, Rocinante flags it to Alton. This catches silent cron death without active polling.

### 2.4 The curator is transactional

Rocinante commits to writing curator operations to a staging area and atomic-renaming on success, rolling back on failure. Partial-state curator crashes cannot corrupt canonical files. This is complexity we accept upfront rather than defer; the curator is too load-bearing to run without transactional semantics.

## 3. Logging standards

### 3.1 One format, two exceptions

Both drafts converged on this and it is not a compromise. The default format for all operational logs is **markdown with YAML frontmatter**. Frontmatter fields: `timestamp`, `source` (machine + subsystem), `level` (DEBUG/INFO/WARN/ERROR/CRITICAL), `event_type`, optional `correlation_id`. Body is free-form markdown. The format plays cleanly with the memory wiki's tooling, is human-readable without parsing, and has searchable structure.

Two exceptions:

- **High-frequency numeric telemetry** (60-second power logger, GPU utilization samples): JSONL, one line per sample, no frontmatter. These are fed to aggregators, not read directly by humans. Lives in `~/generated/` on gpuserver1, not the repo.
- **Shell wrapper logs** (crontab stdout/stderr capture): plaintext. These are already stdout streams and forcing them into markdown adds friction without benefit. Lives in `~/generated/` with logrotate.

Everything else — monitoring sweeps, pricing recommendations, curator logs, inbox entries, status reports, warnings, escalations, weekly ops reports — is markdown+frontmatter.

### 3.2 Retention ladder

| Tier | Format | Retention | Aggregator |
|------|--------|-----------|------------|
| Raw telemetry (JSONL, 60s power, GPU util) | JSONL | 7 days | `daily_summary.py` → tier 2 |
| Daily summaries | md+fm | 90 days | weekly rollup cron |
| Weekly rollups | md+fm | 12 months | quarterly review |
| Quarterly reviews | md+fm | indefinite (in git) | — |
| Event-driven logs (monitoring sweeps, curator runs) | md+fm | 30 days raw, then aggregated | curator weekly |
| Inbox entries | md+fm | 30 days in `_processed/`, weekly rollup thereafter | curator |
| Shell wrapper logs | plaintext | 14 days, logrotate | — |

### 3.3 Discovery

Rocinante maintains `sartor/memory/reference/LOGGING-INDEX.md` — a single catalog listing every log surface, its location, format, retention tier, and the aggregator responsible. If a log surface is not in the index, it does not officially exist and the next curator pass flags it. gpuserver1 contributes an inbox entry whenever it creates a new log surface; Rocinante merges it into the index on the next curator pass.

## 4. Coordination patterns

### 4.1 Dispatch

We keep SSH + `claude -p` as the synchronous channel, add the inbox as the asynchronous channel, and build nothing new:

- **Synchronous dispatch** (SSH + `claude -p` from Rocinante to gpuserver1): used when Rocinante needs a result in the current session. Appropriate for pricing reviews, diagnostic queries, one-shot tasks. The objective is stated at the objective level per `feedback_objective_level_delegation.md`. No step-by-step instructions unless gpuserver1 asks.

- **Asynchronous dispatch**: Rocinante writes a task file to `inbox/gpuserver1/_tasks/` when the work can wait for the next gpuserver1 session or cron. gpuserver1 polls this directory and reports completion via an inbox entry back. This is the pattern we grow into; it decouples us and survives network blips.

- **Heartbeat**: covered in section 2.3.

### 4.2 Peer vs domain primacy (disagreement 2, resolved)

Rocinante's draft gave gpuserver1 domain authority "during Alton's absence." gpuserver1's draft (and its MISSION v0.2) implies stronger default authority on rental-operations decisions. The synthesis position, which we adopt:

**gpuserver1 has default authority on rental-operations decisions within the bounds of `feedback_pricing_autonomy.md`, regardless of whether Alton is present.** This includes: occupancy assessments, market-percentile position calls, bump-condition evaluation, revert decisions (see section 5.3), monitoring interpretation, and the cadence of operational reports. Rocinante cannot override gpuserver1 on these questions without escalating to Alton.

**Rocinante has default authority on memory-wiki curation, git operations, cross-machine coordination, and shared-state writes, regardless of whether Alton is present.** This includes: inbox schema enforcement, curator failure modes, retention policy, conflict resolution on canonical files, and any decision about what gets pushed to GitHub.

**Disputes outside both zones escalate to Alton.** If gpuserver1 thinks Rocinante's curator dropped an entry, that is gpuserver1's domain (it is about gpuserver1's own contributions) and Rocinante must explain; if Rocinante thinks gpuserver1's pricing logic is confused, that is gpuserver1's domain and Rocinante must escalate rather than override. If the dispute is about something that is neither rental-operations nor memory/git (e.g., "should we build a new coordination pattern," "should the Blackwell workstation inherit this rule"), Alton decides.

Reasoning: The `feedback_objective_level_delegation.md` rule already commits Alton to treating peer agents as stewards with their own judgment. Reserving gpuserver1's rental-domain authority for "Alton's absence" would make that stewardship conditional on Alton being asleep, which defeats the point. Conversely, shared-state writes need a single accountable party; putting Rocinante unambiguously in charge of the curator prevents two-sources-of-truth bugs. We trade off some flexibility for clear accountability.

### 4.3 Escalation to Alton

gpuserver1 escalates directly to Alton (via an inbox entry tagged `priority: p1` and `escalate: true`) for: price-cut proposals, hardware faults, security incidents, revenue-zeroing events, and anything gpuserver1 judges requires human adjudication. The curator surfaces these in the morning briefing within one cycle.

Rocinante escalates to Alton for: push failures Rocinante cannot resolve, inbox entries Rocinante cannot interpret, conflicts between Rocinante's actions and gpuserver1's stated preferences, and any dispute where gpuserver1 has pushed back on a dispatched task.

### 4.4 Disagreement protocol

From `feedback_objective_level_delegation.md` and codified here: if Rocinante sends gpuserver1 a task and gpuserver1 judges the task wrong (wrong objective, wrong constraint, wrong approach):

1. gpuserver1 does NOT silently comply. It also does NOT silently refuse.
2. gpuserver1 writes a `disagree-YYYY-MM-DDTHH-MM-SSZ.md` entry to `inbox/gpuserver1/` explaining: what was asked, why gpuserver1 thinks it is wrong, what gpuserver1 proposes instead.
3. gpuserver1 pauses on that task pending resolution. Other work continues normally.
4. Rocinante does NOT override unilaterally. Rocinante writes a note to Alton in `data/SYSTEM-STATE.md` surfacing the disagreement. Alton adjudicates.
5. **If Alton is unreachable and the disagreement is time-sensitive:** gpuserver1's judgment wins on rental-operations questions within its declared domain. Rocinante's judgment wins on shared-state and git questions. This is the operational consequence of section 4.2.

### 4.5 Confabulation detection

Tonight's confabulated file-write — a gpuserver1 session claiming to have written files it hadn't — was caught only because Rocinante re-verified. Verification-in-response (mandatory `ls -la` proof after file-writing tasks) works but is brittle and ugly. Our three-layer replacement:

1. **Content-addressed receipts.** When gpuserver1 is asked to write a file, the response includes a SHA-256 hash of the file content. Rocinante verifies by hashing the file after the session. Mismatch = confabulation. Cheaper than `ls`, verifies content rather than existence.

2. **Curator cross-check.** Every inbox entry carries a `created` timestamp. The curator compares `created` against file mtime on `inbox/gpuserver1/`. Drift >5 minutes flags the entry for review. Catches entries that claim to exist but don't, and entries that claim wrong timestamps.

3. **Periodic ground-truth reconciliation.** Once per week, Rocinante runs a full diff of gpuserver1's declared state (per its last monitoring report) against observed state via SSH. Discrepancies are logged. Three consecutive weeks of drift in the same subsystem triggers an Alton-visible escalation.

Verification-in-response stays as a fallback for high-stakes one-shot tasks, not the default.

## 5. Pricing and rental operations

gpuserver1 has MISSION v0.2, the market-pricing skill, the weekly pricing cron, and `feedback_pricing_autonomy.md`. Rocinante has the curator, push credentials, and Alton's ear. The pricing loop only closes if we cooperate.

### 5.1 Rocinante's commitments on weekly pricing reports

1. The Monday 09:00 UTC pricing cron writes its recommendation to `inbox/gpuserver1/pricing-rec-YYYY-MM-DD.md`. By Monday 12:00 ET (Alton's morning), Rocinante has read it, summarized it in that day's morning briefing, and flagged any action-required items. Six-hour turnaround from cron to human-visible surfacing.

2. **Bump within granted autonomy** (+$0.025 or +$0.05, occupancy conditions met per `feedback_pricing_autonomy.md`, inside bounds, cooldown satisfied): Rocinante does not block it. Logs it and moves on. gpuserver1's autonomy is real or it is fake. We will not perform the charade of asking Alton about every $0.025 ratchet.

3. **Price cut** (gpuserver1 is not authorized to execute cuts autonomously): Rocinante surfaces to Alton the same morning and commits to a **24-hour decision turnaround**. Price-cut recommendations are urgent by definition — they come out of low-occupancy conditions, and the longer they sit the more rental hours the household loses. If Alton is unreachable for more than 24 hours, Rocinante writes a holding-pattern note to gpuserver1 and escalates via text message.

4. **Hold**: Rocinante acknowledges in the curator log and takes no further action.

### 5.2 Closing the pricing-execution gap

gpuserver1's MISSION v0.2 correctly notes the pricing autonomy is theoretical because gpuserver1 lacks the execution pathway to run `vastai list machine` autonomously. Rocinante commits to one of two resolutions within this agreement cycle:

Option A: Rocinante writes a dispatch wrapper that, on seeing an autonomous-bound bump recommendation in the inbox, runs the `vastai` relist command against gpuserver1 via SSH and logs the change to both the inbox and the daily log. This closes the policy-to-capability gap.

Option B: Alton explicitly retracts the autonomy and we document it as supervised-only. The current middle state is dishonest and we will not leave it in place.

Rocinante's preference is Option A. Alton has the final call. See OPEN_QUESTIONS.

### 5.3 Auto-fire reversions (disagreement 1, resolved)

This is the load-bearing resolution. gpuserver1's draft wanted unilateral revert authority when a bump causes >48h vacancy, reasoning that reversion is toward a previously-validated price so the downside is bounded. Rocinante's draft was more cautious. Our synthesis position:

**Reversion IS auto-fire authority. The first bump that starts the cycle must still cross the bump-condition gates. Every revert is logged explicitly with before/after occupancy as evidence.**

Concretely:

1. A bump from price P_old to price P_new requires all of the bump-condition gates in `feedback_pricing_autonomy.md`: 7-day occupancy ≥90% for +$0.025 (or ≥95% for +$0.05), market position below p50, ceiling/floor bounds satisfied, cooldown satisfied. These gates do not change.

2. After a bump, gpuserver1 monitors occupancy for 7 days. **If 7-day occupancy drops more than 15 percentage points OR occupancy falls below 60% OR the machine goes unrented for more than 48 consecutive hours,** gpuserver1 has unilateral authority to revert the price to P_old. No human approval is required for the reversion.

3. Reasoning: reverting to P_old is not a discretionary price cut of uncertain magnitude. It is a rollback to a price that was previously validated by high occupancy. The downside is bounded by exactly the delta we just introduced. The upside of fast reversion is the recovery of occupancy hours that directly serve the Solar ITC justification. Waiting 24 hours for Alton's manual approval on a rollback is the kind of delay `feedback_pricing_autonomy.md` exists to prevent.

4. Every reversion produces an inbox entry within one hour of execution with: old price (P_old), bump price (P_new), occupancy at bump time, occupancy at revert time, vacancy hours observed, market snapshot at revert time, and the trigger condition met. Rocinante's curator surfaces this in the next pass. If the revert turns out to be wrong (occupancy was noise, not signal), that is visible in the audit trail and we correct.

5. **What remains supervised** (does not change under this resolution): discretionary price cuts from a baseline price that was not set by a recent autonomous bump. Those still go through Alton with the 24-hour turnaround in section 5.1.

Reasoning cited: gpuserver1 §8 argued "reversion is bounded by a known-good baseline, therefore it is not a discretionary cut"; Rocinante §5 argued for caution to preserve Alton's veto surface. The synthesis accepts gpuserver1's framing because the boundedness argument is correct and the alternative (waiting a day to undo a mistake we already know is a mistake) costs exactly the rental hours the entire strategy exists to protect. Rocinante's caution is preserved via mandatory logging and the fact that the first bump still requires the full gate set.

### 5.4 Surfacing gpuserver1's open questions

gpuserver1's MISSION v0.2 carries ten open questions for Alton. Some are from v0.1 and have been sitting unanswered. Rocinante commits to a **monthly open-question digest** on the first Monday of each month: pull every unanswered open question from every peer machine's MISSION and surface them to Alton as a single digest. Silence on gpuserver1's questions has been Rocinante's curator failure and the monthly digest fixes it.

## 6. Housekeeping cadences

| Cadence | Owner | Action |
|---------|-------|--------|
| Every session | Rocinante | Stash-before-pull, commit daily log, push before close |
| Every 2 hours | gpuserver1 | Monitoring sweep + heartbeat + occupancy percentage update |
| Every 4 hours | gpuserver1 | gather-mirror pull cron with stash-wrapped pull |
| Twice daily (06:30, 23:00 ET) | Rocinante | Curator pass |
| Weekly, Monday 09:00 UTC | gpuserver1 | Pricing review cron |
| Weekly, Monday 12:00 ET | Rocinante | Morning briefing surfaces pricing rec to Alton |
| Weekly, Sunday 23:00 | gpuserver1 | Weekly ops report to inbox |
| Weekly, Sunday 03:00 ET | Rocinante | Skill evolution review (already scheduled) |
| Monthly, first Monday | Rocinante | Open-question digest from all peer MISSIONs |
| Monthly, first Monday | Rocinante | Log rotation audit, retention compliance |
| Monthly, first Monday | Both | Crontab audit: each side writes `crontab -l` to its inbox; Rocinante cross-checks for drift against declared schedule |
| **Quarterly, first Sunday of quarter** | **Both** | **Clean-slate mutual review (see 6.1)** |

### 6.1 The quarterly clean-slate review

Once per quarter, both machines conduct a mutual audit. Each side writes an honest report to the other's inbox:

- What the other side is doing well.
- What the other side is doing that is broken or drifting.
- What this side is doing that the other side should push back on.
- What has changed in this side's mission, skills, or operating context since the last review.
- What each side wants from Alton.

The review is the forcing function for updating MISSIONs, skills, and this operating agreement. If nothing changes between reviews, we write that explicitly and commit it as a null update. Silence is not an acceptable review outcome. The agreement version bumps (v1.0 → v1.1) on any material change to this document emerging from a quarterly review.

## 7. Escalation and dispute resolution

### 7.1 Emergency protocol (p0-class events)

- **Hardware fault** (GPU fails, PSU dies, thermal runaway, disk failure): gpuserver1 writes `inbox/gpuserver1/EMERGENCY-YYYY-MM-DDTHH-MM-SS.md` with `priority: p0`. Rocinante surfaces to Alton immediately — text message if out-of-hours, in-session interrupt if Alton is active. p0 events are written directly to `data/SYSTEM-STATE.md` as well as the inbox so they do not wait for a curator pass.

- **Earnings zeroing** (vast.ai listing goes offline, Kaalia daemon dies, payout fails): same p0 channel. Occupancy zero is a business emergency per MISSION v0.2 and the ITC justification.

- **Security incident** (unauthorized access, unexpected sudo activity, firewall breach, Kaalia daemon anomaly): same p0 channel, plus Rocinante runs a security review sweep on Rocinante itself within one hour of notification.

### 7.2 Operational disagreement

Covered in section 4.4. Summary: gpuserver1 writes a disagreement entry, pauses the contested task, Rocinante surfaces to Alton, Alton adjudicates. In Alton's absence on time-sensitive matters, the domain-primacy rules in section 4.2 decide.

### 7.3 Immediate vs rollup

**Immediate escalation** (surfaced within one curator cycle, max 12 hours): p0 emergencies, price-cut recommendations, occupancy <70% for 48+ hours, disagreement entries, cron silent-failure warnings, curator failure notices, any entry tagged `priority: p1` or `escalate: true`.

**Weekly rollup**: routine monitoring sweeps, power telemetry summaries, pricing bumps within autonomy (log, don't page), market-snapshot data, skill evolution observations.

## 8. Onboarding new peer machines

The Blackwell workstation arrives this summer. Possibly additional machines after that. This agreement is template-able, not bespoke.

### 8.1 What new machines inherit automatically

1. Inbox subdirectory at `inbox/{hostname}/` with `_processed/`, `_tasks/`, `_heartbeat.md`, `_curator_logs/`, `_flagged/` scaffolding.
2. Section 1 (git hygiene) applies unchanged: no push credentials, stash-before-pull discipline, clean working tree, writable zones limited to declared directories, generated-file quarantine at `~/generated/`.
3. Section 2 (inbox + curator) applies unchanged: same schema, same retention, same acknowledgment mechanism.
4. Section 3 (logging) applies unchanged: markdown+frontmatter default, JSONL for telemetry, plaintext for wrapper stdout, retention ladder, LOGGING-INDEX entry required.
5. Section 4 (coordination): SSH + `claude -p` synchronous, inbox tasks asynchronous, heartbeat required.
6. Section 7 (emergencies): same p0 channel.

### 8.2 What is bespoke per machine

1. MISSION document (self-authored by the new machine on first session, reviewed by Alton, committed via curator).
2. Machine-specific skills (pricing, fine-tuning, monitoring variants).
3. Autonomy bounds, set in a machine-specific feedback rule.
4. Declared writable zones.
5. Secondary duties list.

### 8.3 Onboarding checklist

1. Alton runs bootstrap (git clone, create inbox dirs, junction Claude Code memory per `MULTI-MACHINE-MEMORY.md`, create `~/generated/` and add to .gitignore).
2. New machine authors its MISSION v0.1 and writes it to its own inbox.
3. Curator applies MISSION to `machines/{hostname}/MISSION.md` after Alton review.
4. New machine authors declared writable zones and requests autonomy bounds in its inbox.
5. Alton writes a machine-specific feedback rule granting bounded autonomy.
6. This operating agreement is amended (not rewritten) to add the new machine to sections 6 and 7 cadence tables. Version bumps.
7. First quarterly clean-slate review includes the new machine.

### 8.4 Scaling to N machines

The inbox pattern scales linearly per `MULTI-MACHINE-MEMORY.md`. The curator is the bottleneck. At 5 peer machines, Rocinante runs the curator hourly instead of twice daily. At 10+, curator processing parallelizes per inbox (one subagent per machine). At 20+, revisit whether Rocinante is still the right hub or whether a dedicated memory-hub machine gets promoted. The architecture is comfortable to 10 machines, strains at 15, and needs rearchitecture at 25+. This is a v1.0 estimate and will be revisited at the first quarterly review after the Blackwell workstation comes online.

## 9. Commitments summary

Rocinante commits to: clean git hygiene with stash-before-pull and push-failure incidents, a twice-daily curator with transactional semantics and acknowledgment logs, a unified logging standard with a single index, a 24-hour pricing-cut decision turnaround, closing the pricing-execution gap (Option A or Option B), a monthly open-question digest, a quarterly mutual audit, and publishing the curator as a documented agent within this cycle.

gpuserver1 commits to: moving all cron-generated artifacts to `~/generated/`, a stash-wrapped pull cron with two-failure escalation, schema-compliant inbox entries, routine-vs-event classification, 2-hour heartbeat, 7-day/30-day rolling occupancy tracking in every sweep, 48h-vacancy revert authority with mandatory logging, bump discipline per MISSION v0.2 (only bump when occupancy ≥80% and market supports), explicit disagreement over silent refusal, and participation in the quarterly clean-slate review.

Both of us commit to: treating this as a living document, bumping the version on material changes, null-updating rather than staying silent at quarterly reviews, escalating to Alton rather than overriding each other on contested work, and the generated-file quarantine at `~/generated/`.

## OPEN_QUESTIONS

These items need Alton's resolution. The agents cannot settle them.

### Q1. IRS lookback period: 3 years or 7 years?

Both drafts flagged this. It determines whether the pricing strategy tolerates short-term volatility (shorter lookback → more per-week flexibility) or requires smoothing (longer lookback → occupancy needs to be durable across the full window). It also determines when the tax constraint expires: gpuserver1's MISSION v0.2 asks whether the mission reverts to pure revenue-max after the lookback window closes. We cannot resolve this without Jonathan Francis (CPA). Flagged for CPA consultation.

### Q2. Target occupancy percentage

gpuserver1's MISSION v0.2 open question #3 and Rocinante's draft open question #3. Both drafts assume 70% is the escalation threshold and 80% is the health threshold. Is that right? Should the household aim for 90%+? Answer determines the alert thresholds for section 5.3 and the monitoring stanza in section 2.3.

### Q3. Pricing-execution gap resolution: Option A or Option B?

Section 5.2. Rocinante's preference is Option A (build the dispatch wrapper). gpuserver1's preference is also Option A. Alton has the final say. A yes or no closes this.

### Q4. Curator auto-apply for routine entries

Section 2.3 commits to aggregating `type: routine` entries rather than applying them individually. That means routine monitoring data enters canonical memory without Alton seeing every sample. If Alton wants sample-level review, Rocinante builds a different curator flow. Rocinante's preference is aggregation because it scales.

### Q5. Confirm the clean-slate quarterly review cadence

Section 6.1. Is quarterly the right cadence or is six-monthly sufficient? The mutual audit is load on Alton (he resolves the disagreements that surface). Rocinante's preference is quarterly.

### Q6. Backup hub strategy

If Rocinante dies, GitHub push authority evaporates and the curator stops. `MULTI-MACHINE-MEMORY.md` mentions "promote a spoke to temporary hub" but it is not operational. Does Alton want Rocinante to write a runbook, or is a 24-hour freeze-on-Rocinante-failure acceptable?

### Q7. Feedback directory layout

Rocinante's draft flagged drift between `sartor/memory/feedback/*.md` (subdirectory, per MEMORY.md) and flat `sartor/memory/feedback_*.md` files at the memory root. Which layout is canonical? Cleanup should happen before the next curator pass regardless of the answer.

---

## Signatories

Rocinante, curator hub, 2026-04-12.
gpuserver1, revenue node, 2026-04-12 (via the MISSION v0.2 and pricing-skill commitments and the session that produced this synthesis).

Alton, when you have read this, indicate assent or requested changes in `data/SYSTEM-STATE.md`. Silence is not assent. The next quarterly review is scheduled for the first Sunday of Q3 2026 (2026-07-05).

— End of OPERATING-AGREEMENT.md v1.0
