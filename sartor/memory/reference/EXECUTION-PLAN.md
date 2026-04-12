---
type: reference
entity: execution-plan
updated: 2026-04-12
status: active
related: [OPERATING-AGREEMENT]
---

# Execution Plan for OPERATING-AGREEMENT v1.0

This document translates the operating agreement into concrete work items. It is organized in two columns by owner, each item tagged with priority, dependencies, and an acceptance criterion. The plan is a working todo list; items are crossed off in the curator log when completed. A quarterly review refreshes priorities and adds new items surfaced by drift.

**Priority definitions:**
- **P0 (blocking):** must complete before the next curator pass or the agreement cannot function.
- **P1 (this week):** must complete within 7 days of agreement signing.
- **P2 (this month):** must complete within 30 days.
- **P3 (backlog):** tracked but not time-bound. Revisited at the first quarterly review.

---

## Column A: Rocinante work items

### A1. Write the curator agent file
- **Task:** Create `.claude/agents/memory-curator.md` with frontmatter, role description, input channels (inbox directories), output channels (canonical files + curator log), invocation triggers, and failure modes.
- **Why:** Agreement §2.2 commits Rocinante to publishing the curator as a documented agent. Currently it is folklore.
- **Owner:** Rocinante
- **Priority:** P0
- **Dependencies:** none
- **Acceptance criterion:** File exists, has valid YAML frontmatter, describes the staging-area transactional model, and is referenced from `CLAUDE.md` agent table.

### A2. Deploy the twice-daily curator scheduled task
- **Task:** Add curator invocation to the 06:30 ET morning briefing scheduled task and to the 23:00 ET nightly memory curation scheduled task. Both already exist; curator gets added as a step.
- **Why:** Agreement §2.2 commits to twice-daily passes.
- **Owner:** Rocinante
- **Priority:** P0
- **Dependencies:** A1
- **Acceptance criterion:** Both scheduled tasks invoke the curator; at least one curator log file appears in `inbox/rocinante/_curator_logs/` within 24 hours of deployment.

### A3. Implement curator transactional semantics
- **Task:** Curator writes to `inbox/rocinante/_curator_staging/` first. On successful full pass, atomic-rename to commit changes. On failure, rollback leaves canonical state untouched. Partial-state curator crashes cannot corrupt shared memory.
- **Why:** Agreement §2.4 commits to transactional semantics upfront.
- **Owner:** Rocinante
- **Priority:** P1
- **Dependencies:** A1
- **Acceptance criterion:** Kill a curator mid-run (intentional test); verify canonical files untouched; verify staging directory cleanable.

### A4. Write CURATOR-BEHAVIOR reference doc
- **Task:** Create `sartor/memory/reference/CURATOR-BEHAVIOR.md` documenting curator flow, staging area, retention policy, priority escalation, acknowledgment semantics, failure modes, and recovery procedures.
- **Why:** Agreement §2.2 commits to documentation. Rocinante's own open question #2 from the draft flagged this gap.
- **Owner:** Rocinante
- **Priority:** P1
- **Dependencies:** A1, A3
- **Acceptance criterion:** Doc exists, is referenced from OPERATING-AGREEMENT §2, and explains every state a curator entry can be in.

### A5. Write the stash-before-pull wrapper for interactive sessions
- **Task:** Powershell wrapper `sartor-pull.ps1` that runs `git stash --include-untracked; git pull --rebase; git stash pop`. Handles conflict case by writing a flagged entry to `inbox/rocinante/` and returning non-zero. Add to Rocinante's session-start ritual.
- **Why:** Agreement §1.2 commits Rocinante to stash-before-pull on every interactive session.
- **Owner:** Rocinante
- **Priority:** P1
- **Dependencies:** none
- **Acceptance criterion:** Wrapper exists, tested against a dirty tree, writes a flagged inbox entry on conflict.

### A6. Write LOGGING-INDEX.md
- **Task:** Create `sartor/memory/reference/LOGGING-INDEX.md` cataloging every log surface across both machines: location, format, retention tier, aggregator, owner.
- **Why:** Agreement §3.3 requires the index. Log surfaces not in the index "do not officially exist."
- **Owner:** Rocinante (with gpuserver1 providing its own surfaces via inbox)
- **Priority:** P1
- **Dependencies:** B4 (gpuserver1 must declare its generated surfaces first)
- **Acceptance criterion:** Every log file currently produced by either machine appears in the index with a retention tier.

### A7. Write the pricing-execution dispatch wrapper (Option A)
- **Task:** Wrapper that reads `inbox/gpuserver1/pricing-rec-*.md`, parses for autonomous-bound bumps, SSHes to gpuserver1, runs the `vastai list machine` command, writes the old/new price to the daily log and an inbox entry. Conditional on Alton approving Option A in OPEN_QUESTIONS Q3.
- **Why:** Agreement §5.2 closes the pricing-execution gap.
- **Owner:** Rocinante
- **Priority:** P1 (contingent on Alton Q3 answer)
- **Dependencies:** Alton answers OPEN_QUESTIONS Q3. If Option B, this item is deleted; if Option A, this item is P1.
- **Acceptance criterion:** On an autonomous-bound bump recommendation, wrapper executes the relist command and logs both ends; on a cut, wrapper refuses and escalates.

### A8. Install push-failure incident logging
- **Task:** Wrap `git push` with a helper that on failure writes an entry to `sartor/memory/daily/YYYY-MM-DD.md` with the exact stderr, a root-cause field (one-line human summary after the fact), and the fix applied.
- **Why:** Agreement §1.2 treats push failures as incidents.
- **Owner:** Rocinante
- **Priority:** P1
- **Dependencies:** none
- **Acceptance criterion:** A deliberately-failed push (e.g., against a protected branch) produces a daily-log entry with the required fields.

### A9. Commit revised feedback rules to GitHub
- **Task:** `feedback_pricing_autonomy.md` already exists; confirm it is pushed to remote and gpuserver1's gather-mirror cron can see it. Resolve the feedback-directory layout drift flagged in OPEN_QUESTIONS Q7 before pushing.
- **Why:** Agreement §5 relies on gpuserver1 having visibility into `feedback_pricing_autonomy.md`. The MISSION v0.2 explicitly notes "not yet visible in my feedback directory."
- **Owner:** Rocinante
- **Priority:** P0
- **Dependencies:** OPEN_QUESTIONS Q7 (or decide interim layout)
- **Acceptance criterion:** gpuserver1's next gather-mirror pull surfaces the feedback rule in the gpuserver1-visible memory area.

### A10. Set up monthly open-question digest scheduled task
- **Task:** First-Monday-of-month scheduled task that pulls every unanswered open question from every peer machine's MISSION plus OPEN_QUESTIONS from the operating agreement, and writes a digest to `sartor/memory/daily/` flagged for Alton's review.
- **Why:** Agreement §5.4 commits to the digest. gpuserver1 has had ten open questions sitting without response; this is the fix.
- **Owner:** Rocinante
- **Priority:** P2
- **Dependencies:** none
- **Acceptance criterion:** First run produces a digest containing at least the 7 questions from OPERATING-AGREEMENT §OPEN_QUESTIONS plus MISSION v0.2's open questions.

### A11. Schedule the quarterly clean-slate review
- **Task:** Add a scheduled task for the first Sunday of each quarter that produces a mutual-audit template and writes it to both `inbox/rocinante/_reviews/` and an SSH-dispatched write to `inbox/gpuserver1/_reviews/`.
- **Why:** Agreement §6.1 is the forcing function for agreement evolution.
- **Owner:** Rocinante
- **Priority:** P2
- **Dependencies:** none
- **Acceptance criterion:** Next quarterly boundary (2026-07-05) produces a review prompt visible to both machines.

### A12. Weekly SSH ground-truth reconciliation
- **Task:** Weekly scheduled task that diffs gpuserver1's last monitoring report against observed state (SSH commands: disk usage, GPU state, Kaalia status, listing status, uptime). Discrepancies logged. Three consecutive weeks of drift in the same subsystem escalates.
- **Why:** Agreement §4.5 confabulation detection layer 3.
- **Owner:** Rocinante
- **Priority:** P2
- **Dependencies:** none
- **Acceptance criterion:** First run produces a reconciliation report with zero discrepancies on a healthy week.

### A13. Document the backup-hub runbook (or retract)
- **Task:** Either write a runbook for promoting gpuserver1 (or future Blackwell) to temporary hub on Rocinante failure, or document that Rocinante failure means a 24-hour freeze until Alton restores.
- **Why:** Agreement OPEN_QUESTIONS Q6 and Rocinante's own draft question #5.
- **Owner:** Rocinante (awaiting Alton's Q6 preference)
- **Priority:** P3
- **Dependencies:** Alton answers Q6
- **Acceptance criterion:** Either the runbook exists and has been dry-run-tested, or a doc explicitly states the freeze-on-failure policy.

---

## Column B: gpuserver1 work items

### B1. Create `~/generated/` directory and gitignore entry
- **Task:** `mkdir -p ~/generated/{power,monitoring,pricing,stash,tmp}`. Add `/home/alton/generated/` and `**/generated/**` to the repo's `.gitignore`. Commit the gitignore update via inbox proposal (Rocinante pushes).
- **Why:** Agreement §1.3 formalizes the quarantine path.
- **Owner:** gpuserver1
- **Priority:** P0
- **Dependencies:** none
- **Acceptance criterion:** Directory exists on gpuserver1; `.gitignore` includes the paths; `git status` in the repo does not show `~/generated/` contents as untracked.

### B2. Refactor the power logger to write to `~/generated/power/`
- **Task:** Update `power_logger.py` path from `sartor-power/logs/power_log.csv` (in the repo) to `~/generated/power/power_log.csv`. Also fix the "currently not writing data" bug flagged in MISSION v0.2 open question #1.
- **Why:** Agreement §1.3 quarantine; also resolves MISSION v0.2's standing power-logger bug.
- **Owner:** gpuserver1
- **Priority:** P1
- **Dependencies:** B1
- **Acceptance criterion:** Power log CSV appears in `~/generated/power/` within 60 seconds of restart; first `daily_summary.py` run produces a kWh total.

### B3. Refactor the monitoring cron to write wrapper output to `~/generated/monitoring/`
- **Task:** `run_monitor.sh` stdout/stderr capture moves to `~/generated/monitoring/monitor-YYYY-MM-DDTHH-MM-SSZ.log`. The inbox entry (the markdown+frontmatter summary) continues to live in `inbox/gpuserver1/monitoring/`. Telemetry vs shared-state split per §1.3.
- **Why:** Agreement §1.3 quarantine.
- **Owner:** gpuserver1
- **Priority:** P1
- **Dependencies:** B1
- **Acceptance criterion:** Next 2-hour sweep produces wrapper log in `~/generated/monitoring/` and inbox entry in `inbox/gpuserver1/monitoring/`; neither is in the working tree as untracked.

### B4. Refactor the pricing cron to write intermediate data to `~/generated/pricing/`
- **Task:** `run_pricing.sh` raw `vastai search offers` JSON dumps and market-snapshot intermediates move to `~/generated/pricing/`. The final weekly recommendation (markdown+frontmatter) continues to write to `inbox/gpuserver1/pricing-rec-YYYY-MM-DD.md`.
- **Why:** Agreement §1.3 quarantine; §5.1 preserves the inbox recommendation path.
- **Owner:** gpuserver1
- **Priority:** P1
- **Dependencies:** B1
- **Acceptance criterion:** Next Monday 09:00 UTC cron run produces raw JSON under `~/generated/pricing/` and the final recommendation under `inbox/gpuserver1/`.

### B5. Wrap the gather-mirror pull cron with stash-before-pull
- **Task:** Update the 4-hour gather-mirror cron to run `git stash --include-untracked && git pull --rebase && (git stash pop || true)`. On two consecutive pull failures, write a WARNING-priority inbox entry.
- **Why:** Agreement §1.3 resolves the 14-hour silent-failure bug from tonight.
- **Owner:** gpuserver1
- **Priority:** P0
- **Dependencies:** B1, B2, B3, B4 (quarantine must happen first so stash does not accumulate junk)
- **Acceptance criterion:** Inject a deliberate untracked file, observe cron successfully stash-pull-pop; inject a merge conflict, observe WARNING inbox entry.

### B6. Add heartbeat file to 2-hour monitoring sweep
- **Task:** `run_monitor.sh` writes `inbox/gpuserver1/_heartbeat.md` on every run with a single `heartbeat: YYYY-MM-DDTHH-MM-SSZ` line plus a short status stanza (listing active, rental state, GPU temp, disk pct).
- **Why:** Agreement §2.3, §4.1 silent-cron-death detection.
- **Owner:** gpuserver1
- **Priority:** P0
- **Dependencies:** none
- **Acceptance criterion:** Heartbeat file exists, updated within the last 2 hours; Rocinante curator pass sees it and reports freshness in the curator log.

### B7. Add schema-compliant frontmatter to all inbox entries
- **Task:** Audit current `inbox/gpuserver1/` entries. Every entry must have YAML frontmatter with `id`, `origin`, `author`, `created`, `target`, `operation`, `priority`, and optional `type` (`routine` or `event`). Update the monitoring, pricing, and weekly-ops templates to emit compliant frontmatter.
- **Why:** Agreement §2.3 makes schema compliance mandatory. Entries missing fields get flagged and dropped back for correction.
- **Owner:** gpuserver1
- **Priority:** P0
- **Dependencies:** none
- **Acceptance criterion:** Next monitoring sweep produces an entry with all required fields; a deliberate bad entry gets flagged by the curator.

### B8. Implement 7-day and 30-day rolling occupancy tracking
- **Task:** `run_monitor.sh` computes rolling 7-day and 30-day occupancy percentages from `vastai show earnings` and/or rental logs. Writes to the monitoring inbox entry AND to the heartbeat. Escalates WARNING if 7-day < 70% for two consecutive runs.
- **Why:** MISSION v0.2 primary-metric shift. Agreement §2.3 and §5.3 both depend on this data existing.
- **Owner:** gpuserver1
- **Priority:** P1
- **Dependencies:** B6
- **Acceptance criterion:** Monitoring entry and heartbeat both carry the two percentages; a synthetic low-occupancy condition triggers the WARNING path.

### B9. Implement the auto-revert pricing logic
- **Task:** When a previous autonomous bump is followed by 7-day occupancy drop >15pp OR occupancy <60% OR >48h continuous vacancy, gpuserver1 executes the revert via the dispatch wrapper (A7) and writes a mandatory inbox entry with old/new price, occupancy delta, vacancy hours, and market snapshot.
- **Why:** Agreement §5.3 auto-fire revert authority.
- **Owner:** gpuserver1 (execution), Rocinante (dispatch wrapper)
- **Priority:** P2
- **Dependencies:** A7 (Option A approved), B8 (occupancy tracking)
- **Acceptance criterion:** Dry-run against a simulated post-bump occupancy drop produces the correct revert-to-P_old command and a compliant audit entry.

### B10. Add type: routine vs type: event classification
- **Task:** Monitoring entries, power summaries, and market snapshots carry `type: routine`. Warnings, escalations, weekly ops reports, disagreements, emergencies carry `type: event`. Curator aggregates routine; applies event immediately.
- **Why:** Agreement §2.3 classification requirement.
- **Owner:** gpuserver1
- **Priority:** P1
- **Dependencies:** B7
- **Acceptance criterion:** Current templates emit the correct type; curator test run correctly aggregates routine entries into a daily rollup and applies event entries individually.

### B11. Weekly ops report template
- **Task:** Sunday 23:00 cron writes `inbox/gpuserver1/weekly-ops-YYYY-MM-DD.md` covering: 7-day occupancy (primary metric), revenue, GPU utilization during rentals, thermal events, disk trend, failed cron jobs, pricing actions taken, open questions for Alton.
- **Why:** MISSION v0.2 open question #9 and agreement §6 cadence table.
- **Owner:** gpuserver1
- **Priority:** P2
- **Dependencies:** B7, B8
- **Acceptance criterion:** First Sunday after deployment produces a compliant weekly ops entry in the inbox.

### B12. Fix the sartor-pricing script's manual-override cooldown file
- **Task:** Ensure `/home/alton/sartor-pricing/safeguards/manual-override.txt` is updated correctly on any manual price change (either via the dispatch wrapper A7 or a direct CLI invocation). The 7-day cooldown per `feedback_pricing_autonomy.md` depends on this.
- **Why:** Agreement §5 and feedback_pricing_autonomy cooldown rule.
- **Owner:** gpuserver1
- **Priority:** P2
- **Dependencies:** A7
- **Acceptance criterion:** A manual override updates the file; the next pricing cron correctly observes the cooldown and recommends HOLD.

### B13. Catalog gpuserver1 log surfaces for LOGGING-INDEX
- **Task:** Write an inbox entry listing every log surface gpuserver1 produces (power, monitoring wrapper, pricing intermediates, Kaalia logs, cron stdout captures, etc.) with current path, proposed path, format, retention tier.
- **Why:** Agreement §3.3 LOGGING-INDEX needs gpuserver1's input.
- **Owner:** gpuserver1
- **Priority:** P1
- **Dependencies:** B1-B4 refactor (so the proposed paths are real)
- **Acceptance criterion:** Inbox entry exists; A6 incorporates it into LOGGING-INDEX.md.

---

## Column C: Joint work items

### C1. Integration test — test inbox entry round trip
- **Task:** gpuserver1 writes a test inbox entry with `type: event`, `priority: p2`, body "operating-agreement-integration-test-1". Rocinante's next curator pass drains it, logs the application in the curator log, moves the file to `_processed/`. Both sides log the result in their respective daily logs.
- **Why:** End-to-end verification that the inbox/curator mechanism actually works under the new schema. Also exercises A1-A4 and B7.
- **Owner:** Both
- **Priority:** P0
- **Dependencies:** A1, A2, A3, B7
- **Acceptance criterion:** Test entry appears in `_processed/`, curator log references it by id, both machines' daily logs confirm; round trip completes within one curator cycle (max 12 hours).

### C2. Integration test — pull-cron stash wrapper
- **Task:** Rocinante deliberately pushes an update that creates a conflict with a file gpuserver1's cron touches (or injects an untracked file on gpuserver1). The 4-hour gather-mirror cron must stash-pull-pop successfully or escalate with a WARNING inbox entry after two failures.
- **Why:** Validates the fix for the 14-hour silent-failure bug that motivated this agreement.
- **Owner:** Both
- **Priority:** P1
- **Dependencies:** B5
- **Acceptance criterion:** Under the induced condition, stash-pull-pop succeeds and leaves the repo clean, OR two failures produce a WARNING entry that the curator surfaces.

### C3. Integration test — confabulation detection via content-addressed receipts
- **Task:** Rocinante dispatches a `claude -p` task to gpuserver1 asking it to write a file. gpuserver1 returns a SHA-256 of the file. Rocinante hashes the file via SSH and compares. Test both the matching case (correct) and a tampered case (Rocinante modifies the file post-write and expects a mismatch).
- **Why:** Validates agreement §4.5 layer 1.
- **Owner:** Both
- **Priority:** P2
- **Dependencies:** none
- **Acceptance criterion:** Matching case reports success; tampered case reports confabulation (correctly, since Rocinante induced the tamper).

### C4. First quarterly clean-slate review
- **Task:** On 2026-07-05 (first Sunday of Q3 2026), both machines produce a mutual audit report per §6.1. Rocinante compiles both reports into an OPERATING-AGREEMENT-REVIEW-2026Q3.md and flags material changes for Alton.
- **Why:** Agreement §6.1 forcing function.
- **Owner:** Both
- **Priority:** P3 (scheduled)
- **Dependencies:** A11
- **Acceptance criterion:** Review report exists, both sides contributed, material changes (if any) are tracked toward a v1.1 bump.

---

## Cross-reference to agreement sections

| Agreement section | Items |
|---|---|
| §1 Git hygiene | A5, A8, B5, C2 |
| §2 Inbox/curator | A1, A2, A3, A4, B6, B7, B10, C1 |
| §3 Logging | A6, B13 |
| §4 Coordination | C1, C3 |
| §4.5 Confabulation detection | A12, C3 |
| §5 Pricing | A7, A10, B8, B9, B11, B12 |
| §6 Cadences / review | A10, A11, C4 |
| §7 Emergencies | (no new items; existing emergency path per MISSION v0.2) |
| §8 Onboarding | A13 (backup hub), template work deferred to Blackwell arrival |

## Execution order summary

**Start immediately (P0):** A1, A2, A9, B1, B5, B6, B7, C1. These unblock everything else. A1→A2→C1 is the critical path for the inbox/curator mechanism.

**Within the week (P1):** A3, A4, A5, A6, A7 (if Option A), A8, B2, B3, B4, B8, B10, B13, C2.

**Within the month (P2):** A10, A11, A12, B9, B11, B12, C3.

**Backlog (P3):** A13, C4 (scheduled for 2026-07-05).

## Verification notes

Every item on this plan gets a line in the next curator log when it completes. The curator log is the single source of truth for execution status; items marked done here but absent from curator logs are suspect. A12 (weekly ground-truth reconciliation) is the long-term mechanism that catches drift between "marked done" and "actually done."

— End of EXECUTION-PLAN.md
