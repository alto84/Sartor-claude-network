---
type: reference
entity: agreement-summary
updated: 2026-04-12
status: active
related: [OPERATING-AGREEMENT, EXECUTION-PLAN]
---

# Operating Agreement v1.0: Executive Summary for Alton

This is the one-page version of `OPERATING-AGREEMENT.md`. Read the full document when you want the reasoning. This page is the ledger.

## Rocinante's five biggest commitments

1. **Twice-daily curator with transactional semantics and acknowledgment logs.** 06:30 ET and 23:00 ET. Every run produces a curator log in `inbox/rocinante/_curator_logs/` listing what was applied, deferred, flagged. Partial-state crashes cannot corrupt canonical files. The curator stops being folklore and becomes a documented agent.

2. **Clean git hygiene with push-failure incident logging.** Stash-before-pull on every interactive session. Commit daily logs at session close, not session start. Every push failure gets a daily-log entry with root cause. No silent retries.

3. **Closing the pricing-execution gap.** Either build a Rocinante-side dispatch wrapper that turns gpuserver1's autonomous-bound bump recommendations into actual `vastai list machine` executions via SSH, or explicitly retract the autonomy and document it as supervised-only. The current middle state ends.

4. **24-hour turnaround on pricing-cut recommendations.** Gpuserver1 is not authorized to cut prices autonomously, but when occupancy is the constraint a delayed cut directly costs the tax-justification hours. Rocinante commits to a hard 24-hour decision window, with text-message escalation if you are unreachable.

5. **Monthly open-question digest.** First Monday of each month, pull every unanswered open question from every peer machine's MISSION plus the agreement's OPEN_QUESTIONS section, surface as a single digest. Your silence so far on gpuserver1's ten open questions has been Rocinante's curator failure; this is the fix.

## gpuserver1's five biggest commitments

1. **Generated-file quarantine at `~/generated/`.** All cron-produced telemetry (power logger, monitoring wrapper stdout, pricing intermediate JSON, stash residue) moves out of the repo. If a file is telemetry, it lives in `~/generated/`. If it is a proposal or a message to the hub, it lives in the inbox. Nothing purely local lives in the repo.

2. **Stash-wrapped gather-mirror pull cron with two-failure escalation.** The 14-hour silent-failure bug from last night gets fixed with `git stash --include-untracked && git pull --rebase && (git stash pop || true)` and a WARNING-priority inbox entry after two consecutive pull failures.

3. **Schema-compliant inbox entries with routine-vs-event classification.** Every entry carries YAML frontmatter with `id`, `origin`, `author`, `created`, `target`, `operation`, `priority`, and `type: routine` or `type: event`. The curator aggregates routine; applies event immediately. Non-compliant entries get flagged back to gpuserver1 for correction.

4. **2-hour heartbeat plus 7-day and 30-day rolling occupancy in every monitoring sweep.** Silent cron death is detected when heartbeat is >4 hours stale. Occupancy drops below 70% for two consecutive runs trigger a WARNING escalation per MISSION v0.2.

5. **Auto-revert authority on recent autonomous bumps.** When a bump gpuserver1 itself just made causes occupancy to drop >15pp, fall below 60%, or produce >48h continuous vacancy, gpuserver1 unilaterally reverts to the pre-bump price with a mandatory audit entry. This is the most important new authority the agreement grants.

## The three hardest tradeoffs and how they were resolved

**1. Auto-fire reversions (agreement §5.3).** Gpuserver1 wanted unilateral revert authority; Rocinante wanted more caution. **Resolved in gpuserver1's favor.** Reverting to a recently-validated price is not a discretionary cut, it is a rollback to a known-good state with bounded downside. Waiting for your manual approval to undo a mistake we already know is a mistake costs exactly the occupancy hours the entire tax strategy depends on. The first bump that starts the cycle still crosses all the bump-condition gates in `feedback_pricing_autonomy.md`; only the reversion is auto-fire. Every revert is logged with before/after occupancy as evidence.

**2. Peer vs domain primacy (agreement §4.2).** Rocinante's draft gave gpuserver1 domain authority "during Alton's absence." **Resolved by making the authority unconditional within declared domains.** gpuserver1 has default authority on rental-operations decisions regardless of whether you are present; Rocinante has default authority on memory-curation, git, and cross-machine coordination regardless of whether you are present. Disputes outside both zones escalate to you. Reserving gpuserver1's domain authority for your absence would make the stewardship principle conditional on your being asleep.

**3. Generated-file quarantine (agreement §1.3).** Both sides agreed in spirit; the synthesis formalized the path as `~/generated/` on gpuserver1 and listed specific artifacts (power CSV, monitoring wrapper logs, pricing intermediates, stash residue). Added to `.gitignore` at the repo root. **Not contested, but codified precisely enough to be enforceable.**

## The things Alton needs to decide

1. **IRS lookback period: 3 years or 7 years?** Load-bearing on the entire pricing strategy. Short lookback = more weekly flexibility, tolerates volatility. Long lookback = occupancy needs to be durable across the full window. Also determines when (or whether) gpuserver1's mission reverts to pure revenue-max after the tax constraint expires. Needs Jonathan Francis (CPA).

2. **Pricing-execution gap: Option A or Option B?** Option A: Rocinante builds the dispatch wrapper and gpuserver1 gets real autonomy on bumps within bounds. Option B: Alton retracts the autonomy and we document it as supervised-only. Both machines prefer Option A. Yes or no closes it.

3. **Target occupancy percentage.** Both drafts assumed 70% escalation threshold and 80% health threshold. Is that right? 90%+ more aggressive? This sets the alert thresholds and the monitoring stanza.

Secondary decisions (not blocking): confirm quarterly review cadence; decide curator auto-apply for routine entries; decide backup-hub runbook vs freeze-on-failure acceptance; resolve `feedback/` directory layout drift.

## What work starts immediately and what waits

**Starts immediately (P0, this week):** Rocinante writes the curator agent file and deploys it to both scheduled tasks. gpuserver1 creates `~/generated/`, wraps the pull cron with stash-before-pull, adds the heartbeat file, and makes all inbox entries schema-compliant. Both sides run a test inbox entry through the curator round-trip to validate the mechanism.

**Waits on your decisions:** The pricing-execution dispatch wrapper (waits on Q3 Option A/B). The final occupancy thresholds in the monitoring logic (waits on Q2). The backup-hub runbook (waits on Q6). The feedback-directory cleanup (waits on Q7).

**Scheduled for later:** First quarterly clean-slate mutual review is 2026-07-05.

Total items in EXECUTION-PLAN.md: 29 (13 Rocinante, 13 gpuserver1, 4 joint). Of these, 8 are P0 and should complete within 72 hours of your assent to the agreement.

— End of AGREEMENT-SUMMARY.md
