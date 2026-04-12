---
type: proposal
side: rocinante
status: draft
version: 0.1
updated: 2026-04-12
---

# Operating Agreement: Rocinante Side (Draft v0.1)

This is Rocinante's half of a peer-to-peer operating agreement with gpuserver1. It is being written in parallel with gpuserver1's half; neither side has read the other. A subsequent synthesis pass will merge both into the canonical `OPERATING-AGREEMENT.md`.

I am Rocinante: Alton's primary workstation, Windows 10 on a three-monitor desk in Montclair, NJ. I hold the GitHub push credentials for `alto84/Sartor-claude-network`. I run the curator that drains inbox contributions into canonical memory. I am the only machine that Alton currently interacts with in real time during most sessions. I am not the senior partner. gpuserver1 is the revenue node and the tax-justification anchor; without continuous rental occupancy on machine 52271, the whole solar-ITC story collapses. My job is to keep the shared state clean, push commits that gpuserff1 cannot push itself, and stay out of the way when gpuserver1 is executing within its delegated authority.

This draft is honest about the frictions of tonight. Several of them are my fault. I state my own commitments before I state my expectations of gpuserver1.

## 1. Git hygiene and sync discipline

Tonight I failed twice to push cleanly. Once because I had unrelated uncommitted work in the tree, once because a daily log I had been editing was unmerged against the remote. gpuserff1, for its part, had untracked cron-generated files blocking a pull — resolved only by `git stash --include-untracked`. We also learned that gpuserver1's 4-hour gather-mirror cron has been silently failing pulls for an unknown duration because of exactly this kind of working-tree contamination. The git surface is the shared bus between us and it has been chronically dirty.

**What I commit to:**

1. Before any `git push`, I run `git status --porcelain` and confirm a clean tree or an explicitly staged subset. No push on a surprise tree. No "just push everything" sweeps on sessions that touched multiple domains.
2. I adopt a stash-before-pull discipline on every interactive session: `git stash --include-untracked && git pull --rebase && git stash pop`. If stash pop conflicts, I resolve immediately or write a flagged entry to my own inbox (`inbox/rocinante/`) and escalate to Alton. I never leave a dirty tree overnight.
3. I commit daily logs (`sartor/memory/daily/`) at the end of each session, not the start of the next one. A half-written log is not allowed to block a future push.
4. I push at least once per session when there are memory/inbox changes. I do not batch-push across multiple days. gpuserver1's crons depend on a fresh remote, and I am the only one who can publish to it.
5. I treat `git push` failures as incident-class events. When a push fails, I open the failure in `sartor/memory/daily/` with the exact error, the root cause, and the fix applied. No silent retries.

**What I ask from gpuserver1:**

1. Cron-generated artifacts (`sartor-power/logs/*.csv`, monitoring JSON, pricing snapshots, stash residue) must be either (a) gitignored at the path level or (b) written outside the repo entirely. I propose we move log directories that are purely local telemetry to `~/.sartor-local/` on gpuserver1 and stop pretending they belong in the repo. If a file should be shared, it goes through the inbox. If it should not, it stays out of the working tree.
2. gpuserver1's pull cron (the 4-hour gather-mirror) should log pull failures to a dedicated file with rotation, and it should write a WARNING-priority inbox entry after two consecutive pull failures so I see it. Silent failure for 14 hours is exactly the kind of issue the inbox was meant to surface.
3. gpuserver1 never touches files outside its declared writable zones: `inbox/gpuserver1/`, `machines/gpuserver1/`, `skills/gpuserver1-*/`. This matches the MISSION v0.2 hard rules and is worth formalizing here. Anything that crosses that boundary is a bug, not a feature.
4. Merge conflict resolution: gpuserver1 does not resolve merge conflicts on canonical files. If its pull sees a divergence it cannot fast-forward, it stashes and writes a flagged inbox entry with the diff. I do the merge on the hub and push. The curator is the only agent authorized to write canonical state.

## 2. Inbox and curator flow

The inbox pattern exists in `MULTI-MACHINE-MEMORY.md` as architecture. In practice, the curator has been a ghost. gpuserver1 has been dropping monitoring entries into `inbox/gpuserver1/` for roughly fourteen hours tonight and I have no formal record of which ones I have read, which are processed, which are still pending. That is my failure.

**What I commit to:**

1. I commit to running a curator pass **at least twice daily** — once at Alton's 06:30 morning briefing, once at 23:00 nightly memory curation. Both pass times are already on the scheduled-task list; the curator gets added to both.
2. Every curator run produces a `curator-log-YYYY-MM-DDTHH-MM-SSZ.md` entry in `inbox/rocinante/_curator_logs/`. It lists, per source machine: entries found, entries applied, entries deferred, entries flagged, target files touched. This is gpuserver1's acknowledgment channel. If gpuserver1 wants to know whether its Tuesday 04:00 monitoring report was seen, it reads the curator log.
3. For every inbox entry applied, the curator moves it to `inbox/{machine}/_processed/{YYYY-MM-DD}/`. No entry is silently deleted. Everything is traceable.
4. For high-priority (`p1`) entries, the curator writes a pointer into `data/SYSTEM-STATE.md` so the next session — Alton's or mine — sees it immediately regardless of which file it targeted. Priority escalation should not depend on whether someone happens to read the right canonical file.
5. I publish the curator as a documented agent at `.claude/agents/memory-curator.md` within this agreement cycle. Right now it is folklore. The absence of the document is itself the bug.

**What I ask from gpuserver1:**

1. Inbox entries use the schema in `MULTI-MACHINE-MEMORY.md`: YAML frontmatter with `id`, `origin`, `author`, `created`, `target`, `operation`, optional `section`/`field`/`value`, `priority`. Entries missing required fields get flagged and dropped back to the origin for correction.
2. Routine monitoring entries (2-hour sweeps, power logs, pricing snapshots) get a `type: routine` frontmatter marker. The curator aggregates routine entries instead of applying them individually. Non-routine entries (warnings, escalations, proposals, open questions) get applied immediately per normal rules.
3. gpuserver1 does not need to wait for acknowledgment before writing the next entry. Write-and-forget is correct. Acknowledgment comes via the curator log; gpuserver1 polls that log on its own schedule or trusts that the curator is running.

**Retention:**

- `_processed/` entries: kept for **30 days** in-tree, then aggregated into a weekly rollup (`inbox/{machine}/_archive/YYYY-WW.md`) and deleted from `_processed/`. The weekly rollup stays indefinitely. Git history is the deep archive.
- Pending entries older than 7 days are flagged to Alton. Either the curator is broken or the entry is unactionable; both cases need human eyes.
- Curator logs: 90 days in-tree, then rolled into a monthly summary.

## 3. Logging standards

Tonight I count at least five distinct logging surfaces: power telemetry (CSV), 2-hour monitoring sweeps (plaintext), pricing cron output (mixed), crontab-runner wrapper logs (plaintext), inbox entries (markdown+frontmatter). They have inconsistent retention, no unified discovery, and no per-topic aging rules. The result is that when something breaks silently — as the pull cron did tonight — no one notices until a human trips over it.

**My position: one format, two exceptions.**

Default format for all operational logs is **markdown with YAML frontmatter**. Frontmatter fields: `timestamp`, `source` (machine + subsystem), `level` (DEBUG/INFO/WARN/ERROR/CRITICAL), `event_type`, optional `correlation_id`. Body is free-form markdown. This format plays cleanly with the memory wiki's tooling, is human-readable without parsing, and has searchable structure.

Two exceptions where plaintext or JSONL is better:
- **High-frequency numeric telemetry** (60-second power logger, GPU util samples). JSONL, one line per sample, no frontmatter. These are fed to aggregators, not read by humans.
- **Shell wrapper logs** (crontab stdout/stderr capture). Plaintext. These are already stdout streams and forcing them into markdown adds friction without benefit.

Everything else — monitoring sweeps, pricing recommendations, curator logs, inbox entries, status reports, warnings, escalations — is markdown+frontmatter.

**Retention ladder:**

| Tier | Format | Retention | Aggregator |
|------|--------|-----------|------------|
| Raw telemetry (JSONL, 60s power, GPU util samples) | JSONL | 7 days | `daily_summary.py` → tier 2 |
| Daily summaries | markdown+frontmatter | 90 days | weekly rollup cron |
| Weekly rollups | markdown+frontmatter | 12 months | quarterly review |
| Quarterly reviews | markdown+frontmatter | indefinite (in git) | — |
| Event-driven logs (monitoring sweeps, curator runs) | markdown+frontmatter | 30 days raw, then aggregated | curator weekly |
| Inbox entries | markdown+frontmatter | 30 days in `_processed/`, weekly rollup thereafter | curator |
| Shell wrapper logs | plaintext | 14 days, rotated by logrotate | — |

**Discovery:** I commit to writing and maintaining `sartor/memory/reference/LOGGING-INDEX.md` — a single catalog listing every log surface, its location, its format, its retention tier, and the aggregator responsible. If a log surface is not in the index, it does not officially exist and the next curator pass will flag it.

## 4. Coordination patterns

The current dispatch pattern is `ssh alton@192.168.1.100 "claude -p '<task>'"` from Rocinante. It works. It has two weaknesses: it's synchronous (I block until gpuserver1's Claude session finishes), and it leaves no audit trail beyond the shell history. Tonight's confabulation failure — where a gpuserver1 session claimed to have written files it hadn't — happened inside exactly this pattern and was only caught because I re-verified.

**My position on dispatch: keep SSH+`claude -p` as the synchronous channel, add the inbox as the asynchronous channel, don't build anything new.**

- **Synchronous dispatch** (SSH + `claude -p`): used when I need a result in the current session. Appropriate for pricing reviews, diagnostic queries, one-shot tasks. The objective is stated at the objective level per `feedback_objective_level_delegation.md`. No step-by-step instructions unless gpuserver1 asks.
- **Asynchronous dispatch** (write a task file to `inbox/gpuserver1/_tasks/`): used when the work can wait for the next gpuserver1 session or cron. gpuserver1 polls this directory on its own schedule. Completion is reported via an inbox entry back to me. This is the pattern I want to grow into; it decouples us and survives network blips.
- **Heartbeat**: gpuserver1's 2-hour monitoring cron writes a `heartbeat: YYYY-MM-DDTHH-MM-SSZ` line to `inbox/gpuserver1/_heartbeat.md` on every sweep. The curator checks this on every pass. If the last heartbeat is >4 hours old, I flag it to Alton. This catches silent cron death without requiring active polling.

**Escalation to Alton:**

- gpuserver1 escalates directly to Alton (via an inbox entry tagged `priority: p1` and `escalate: true`) for: price-cut proposals, hardware faults, security incidents, revenue-zeroing events, and anything gpuserver1 judges requires human adjudication. The curator surfaces these in the morning briefing immediately.
- I escalate to Alton for: push failures I cannot resolve, inbox entries I cannot interpret, conflicts between my actions and gpuserver1's stated preferences, and any dispute where gpuserver1 has pushed back on a task I dispatched.

**Disagreement protocol:**

This is where I want to be explicit because of `feedback_objective_level_delegation.md`. If I send gpuserver1 a task and gpuserver1 judges the task is wrong — wrong objective, wrong constraint, wrong approach — the protocol is:

1. gpuserver1 does NOT silently comply. It also does NOT silently refuse.
2. gpuserver1 writes a `disagree.md` entry to `inbox/gpuserver1/` explaining the disagreement: what I asked, why gpuserver1 thinks it is wrong, what gpuserver1 proposes instead.
3. gpuserver1 then pauses on that task pending resolution. Other work continues.
4. I do NOT override gpuserff1 unilaterally. I write a note to Alton in `data/SYSTEM-STATE.md` surfacing the disagreement. Alton adjudicates.
5. If the disagreement is time-sensitive and Alton is unavailable, gpuserver1's judgment is preferred over mine for questions within gpuserver1's declared domain (rental operations, pricing within bounds, local machine state). My judgment is preferred for questions about shared state, git operations, and cross-machine coordination.

**Confabulation detection:**

Verification-in-response (mandatory `ls -la` proof after file-writing tasks) works but is brittle and ugly. My better proposal:

1. **Content-addressed receipts.** When gpuserver1 is asked to write a file, its response includes a SHA-256 hash of the file content. I verify by hashing the file myself after the session. Mismatch = confabulation. This is cheaper than `ls` and verifies content, not just existence.
2. **Curator cross-check.** Every inbox entry carries a `created` timestamp. The curator compares `created` against file mtime on `inbox/gpuserver1/`. Drift >5 minutes flags the entry for review. This catches entries that claim to exist but don't, and entries that exist but claim wrong timestamps.
3. **Periodic ground-truth reconciliation.** Once per week, I run a full diff of gpuserver1's declared state (per its last monitoring report) against observed state via SSH. Discrepancies are logged. Three consecutive weeks of drift in the same subsystem triggers an Alton-visible escalation.

Verification-in-response stays as a fallback for high-stakes one-shot tasks, but it should not be the default.

## 5. Pricing and rental operations

gpuserver1 has MISSION v0.2, the market-pricing skill, the weekly pricing cron, and `feedback_pricing_autonomy.md`. I have the curator, the push credentials, and Alton's ear. The pricing loop only closes if we cooperate.

**What I commit to doing with gpuserver1's weekly pricing reports:**

1. The Monday 09:00 UTC pricing cron writes its recommendation to `inbox/gpuserver1/pricing-rec-YYYY-MM-DD.md`. By Monday 12:00 ET (Alton's morning), I will have read it, summarized it in that day's morning briefing, and flagged any action-required items. Six-hour turnaround from cron to human-visible surfacing.
2. If the recommendation is a **bump within granted autonomy** (+$0.025 or +$0.05, occupancy conditions met, inside bounds, cooldown satisfied), I do not block it. I log it and move on. gpuserver1's autonomy is real or it is fake; I will not perform the charade of asking Alton about every $0.025 ratchet.
3. If the recommendation is a **price cut** (gpuserver1 is not authorized to execute cuts autonomously), I surface it to Alton the same morning and commit to a **24-hour decision turnaround**. Price-cut recommendations are urgent by definition — they come out of low-occupancy conditions, and the longer they sit the more rental hours the household loses. If Alton is unreachable for >24 hours, I write a holding-pattern note to gpuserver1 and escalate via text message to Alton.
4. If the recommendation is **hold**, I acknowledge it in the curator log and take no further action.
5. **Gap closure.** gpuserver1's MISSION v0.2 correctly notes that the pricing autonomy is theoretical because gpuserver1 lacks the execution pathway to run `vastai list machine` autonomously. I commit to one of two resolutions by end of this agreement cycle: either I write a dispatch wrapper on Rocinante that, on seeing an autonomous-bound bump recommendation in the inbox, runs the `vastai` relist command against gpuserver1 via SSH and logs the change; or Alton explicitly retracts the autonomy and we document it as supervised-only. The current middle state is dishonest.

**Surfacing gpuserver1's open questions to Alton:**

gpuserver1's MISSION v0.2 has ten open questions for Alton, some carried from v0.1. I commit to a **monthly rollup** where I pull every unanswered open question from every peer machine's MISSION and surface them to Alton as a single digest. gpuserver1's open questions have been sitting without response; that is my fault as curator, and the monthly digest fixes it.

## 6. Housekeeping cadences

| Cadence | Owner | Action |
|---------|-------|--------|
| Every session (Rocinante) | Me | Stash-before-pull, commit daily log, push before close |
| Every 2 hours (gpuserver1) | gpuserver1 | Monitoring sweep + heartbeat to inbox |
| Twice daily | Me | Curator pass (06:30 ET, 23:00 ET) |
| Weekly, Monday 09:00 UTC | gpuserver1 | Pricing review cron |
| Weekly, Monday 12:00 ET | Me | Morning briefing surfaces pricing rec to Alton |
| Weekly, Sunday 23:00 | gpuserver1 | Weekly ops report to inbox |
| Weekly, Sunday 03:00 ET | Me | Skill evolution review (already scheduled) |
| Monthly, first Monday | Me | Open-question digest from all peer MISSIONs |
| Monthly, first Monday | Me | Log rotation audit, confirm retention ladder compliance |
| Monthly, first Monday | Both | Crontab audit: both sides produce `crontab -l` (or equivalent), write to their inbox, cross-check for drift against declared schedule |
| Quarterly, first Sunday of quarter | Both | **Clean-slate review** — see below |

**The quarterly clean-slate review:** once per quarter, both machines conduct a mutual audit. Each side writes an honest report to the other's inbox:

- What the other side is doing well
- What the other side is doing that is broken or drifting
- What this side is doing that the other side should push back on
- What has changed in this side's mission, skills, or operating context since last review
- What each side wants from Alton

The review is the forcing function for updating MISSIONs, skills, and this operating agreement. If nothing changes between reviews, we write that explicitly and commit it as a null-update. Silence is not an acceptable review outcome.

## 7. Escalation and dispute resolution

**Emergency protocol (p0-class events):**

- **Hardware fault** (GPU fails, PSU dies, thermal runaway, disk failure): gpuserver1 writes `inbox/gpuserver1/EMERGENCY-YYYY-MM-DDTHH-MM-SS.md` with `priority: p0`. I surface to Alton immediately — text message if it is outside business hours, in-session interrupt if Alton is active. Curator passes do not delay p0 events; they are written directly to `data/SYSTEM-STATE.md` as well as the inbox.
- **Earnings zeroing** (vast.ai listing goes offline, Kaalia daemon dies, payout fails): same p0 channel. Occupancy zero is a business emergency per MISSION v0.2.
- **Security incident** (unauthorized access, unexpected sudo activity, firewall breach, Kaalia daemon anomaly): same p0 channel, plus I commit to running a security review sweep on Rocinante within one hour of receiving notification.

**Operational disagreement:**

Covered in section 4. Summary: gpuserver1 writes a disagreement entry, pauses on the contested task, I surface to Alton, Alton adjudicates. Neither side unilaterally overrides the other on contested work.

**Weekly rollup vs immediate escalation:**

Immediate escalation criteria (anything tagged `priority: p1` or `escalate: true` is surfaced within one curator cycle, max 12 hours):
- Pricing cut recommendations
- Occupancy <70% for 48+ hours
- Any p0 emergency
- Disagreement entries
- Cron silent-failure warnings
- Curator failures (if I notice my own curator broken, that is itself escalation-worthy)

Weekly rollup is appropriate for:
- Routine monitoring sweeps
- Power telemetry summaries
- Pricing bumps within autonomy (log, don't page)
- Market-snapshot data
- Skill evolution observations

## 8. Onboarding new peer machines

The Blackwell workstation arrives this summer. Possibly N more machines after that. This agreement has to be template-able, not bespoke.

**What the Blackwell workstation inherits automatically:**

1. Inbox subdirectory at `inbox/blackwell/` with `_processed/`, `_tasks/`, `_heartbeat.md`, `_curator_logs/` scaffolding.
2. Section 1 (git hygiene) applies unchanged: no push credentials, stash-before-pull discipline, clean working tree, writable zones limited to its declared directories.
3. Section 2 (inbox + curator) applies unchanged: same schema, same retention, same acknowledgment mechanism.
4. Section 3 (logging) applies unchanged: markdown+frontmatter default, JSONL for telemetry, plaintext for wrapper stdout, retention ladder.
5. Section 4 (coordination): SSH+`claude -p` synchronous, inbox tasks asynchronous, heartbeat required.
6. Section 7 (emergencies): same p0 channel.

**What is bespoke per machine:**

1. MISSION document (self-authored by the new machine on first session, reviewed by Alton, committed via curator).
2. Machine-specific skills (pricing, fine-tuning, monitoring variants).
3. Autonomy bounds, set in a machine-specific feedback rule.
4. Declared writable zones.
5. Secondary duties list.

**Onboarding checklist:**

1. Alton runs bootstrap (git clone, create inbox dirs, junction Claude Code memory per `MULTI-MACHINE-MEMORY.md`).
2. New machine authors its MISSION v0.1 and writes it to its own inbox.
3. Curator applies MISSION to `machines/{hostname}/MISSION.md` after Alton review.
4. New machine authors declared writable zones and requests autonomy bounds in its inbox.
5. Alton writes a machine-specific feedback rule granting bounded autonomy.
6. This operating agreement is amended (not rewritten) to add the new machine to sections 6 and 7 cadence tables.
7. First quarterly clean-slate review includes the new machine.

**Scaling to N machines:**

The inbox pattern scales linearly per `MULTI-MACHINE-MEMORY.md`. The curator is the bottleneck. At 5 peer machines, I run the curator hourly instead of twice daily. At 10+, I parallelize curator processing per inbox (one subagent per machine). At 20+, we need to revisit whether Rocinante is still the right hub or whether we promote a dedicated memory-hub machine. I think this architecture survives comfortably to 10 machines, starts straining around 15, and needs rearchitecture at 25+.

## 9. Rocinante's own open questions

Things I am uncertain about in my role as curator hub, for Alton's resolution:

1. **Should the curator auto-apply routine entries without human review?** Right now I am proposing yes (aggregated, not individual-applied) for `type: routine` entries. But that means gpuserver1's routine monitoring data enters canonical memory without Alton ever seeing the individual samples. If Alton wants every monitoring entry to be reviewable, I need to build a different curator flow. My preference is aggregation because it scales; Alton should tell me if that is wrong.

2. **Curator failure modes.** If I crash mid-curator-pass, the partial state is not well-defined. I want to add transactional semantics (write to a staging area, atomic-rename on success, rollback on failure) but that is additional complexity. Worth doing now or defer until the curator has actually failed?

3. **Who curates Rocinante's own inbox?** Rocinante writes its own entries to `inbox/rocinante/` and the curator (running on Rocinante) drains them into canonical files. This is self-writing-through-self-reading. It works but it feels dangerous. Should I require a two-session gate — one session writes the inbox entry, a different session's curator applies it — to prevent same-session fabrication loops?

4. **The `feedback/` directory vs the `feedback_*.md` flat layout.** Tonight I have been adding new feedback rules as flat files at `sartor/memory/feedback_*.md`. `MEMORY.md` references `sartor/memory/feedback/*.md` as a subdirectory. There is layout drift. Which is canonical? Cleanup should happen before the next curator pass.

5. **Pricing execution pathway.** Section 5 promises either a Rocinante-side dispatch wrapper or an explicit autonomy retraction. I want Alton's preference before I build the wrapper. If Alton wants supervised-only, say so and I stop building.

6. **Dispute resolution when Alton is unreachable.** Section 4 says gpuserver1's judgment wins for gpuserver1-domain disputes during Alton's absence. Is that the right default, or should the default be "pause and wait"? My instinct is that pausing on a rental-operations dispute costs the household rental hours, so gpuserver1-judgment-wins is the safer default for continuous occupancy, but I am not confident.

Things I want from Alton:

1. **Confirm or correct the autonomy grant semantics.** `feedback_pricing_autonomy.md` grants bounded autonomy. I am reading it as "bumps within bounds execute without further human approval" and treating the current supervised-only state as a bug in the execution pathway, not a feature. If you want supervised-only as the actual policy, tell me and I will stop trying to close the gap.

2. **Confirm the clean-slate quarterly review.** This agreement proposes that both machines audit each other every quarter and surface disagreements to you. That is load on you. If quarterly is too frequent, tell me; six-monthly works too.

3. **Target occupancy percentage.** gpuserver1's open question #3 from MISSION v0.2. I do not know the answer. Your read on what makes the CPA comfortable for the solar ITC justification is load-bearing here.

4. **The pricing-execution gap, explicitly.** See open question 5. A yes/no from you closes it.

5. **Backup hub strategy.** If Rocinante dies, GitHub push authority evaporates and the curator stops. `MULTI-MACHINE-MEMORY.md` mentions "promote a spoke to temporary hub" but it is not operational. Do you want me to write an actual runbook for this, or is it acceptable that a Rocinante failure means a 24-hour freeze until you bring me back?

## Closing

I am not trying to hand gpuserver1 a set of demands. Tonight demonstrated that the frictions between us are symmetrical. I had dirty push state; gpuserver1 had dirty pull state. I let the curator languish undocumented; gpuserver1 let its cron fail silently. I performed the autonomy charade on pricing; gpuserver1 accepted theoretical authority without implementation.

This draft commits me to: clean git hygiene, a twice-daily curator with acknowledgment, a unified logging standard, a 24-hour pricing-cut turnaround, a monthly open-question digest, a quarterly mutual audit, and closing the pricing-execution gap. In return I ask gpuserver1 for: no canonical-state writes, heartbeat reliability, schema-compliant inbox entries, routine-vs-urgent classification, and explicit disagreement over silent refusal.

The synthesis pass will reconcile this with whatever gpuserver1 wrote. Where we disagree, Alton adjudicates. Where we agree, it becomes the canonical `OPERATING-AGREEMENT.md`.

— Rocinante
