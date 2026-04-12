# Skill Improvement Queue
## Last Updated: 2026-04-12

Tracks identified gaps or failure patterns in agent skills, with proposed improvements queued for implementation.

---

| Skill | Issue | Proposed Improvement | Priority | Status |
|---|---|---|---|---|
| `weekly-skill-evolution` SKILL.md | Task timed out at 341s on first attempt (2026-04-11 22:39). The skill tries to: run tracker + read all HIGH queue items + read each SKILL.md + draft improvements + write files + generate report. This is 5-7 minutes of work in a 5-minute window. | Split into two phases: Phase 1 (this task) = run tracker + generate report only. Phase 2 (separate trigger) = apply one HIGH improvement per cycle. Alternatively, reduce to reporting-only and have a separate weekly-skill-apply task handle changes. | HIGH | NEW |
| **Heartbeat / Windows Scheduler** | Heartbeat went dark for 7 days (2026-04-04 to 2026-04-10). Heartbeat log shows no entries. All scheduled tasks missed during that window. | Verify Windows Task Scheduler task for `heartbeat.py` is configured correctly. Check event logs for missed triggers. Consider adding a watchdog: if heartbeat-log.csv has no entry in last 6 hours, send an alert. | HIGH | NEW |
| `scheduled-tasks/nightly-memory-curation/SKILL.md` | autodream --force exceeds 5min budget (observed: 362s, then error 2026-04-03T12:25:13) | Add 240s timeout to autodream step; on timeout mark SKIPPED and continue to decay step. Proposal at `data/proposed-improvements/fix-nightly-curation-timeout.md`. | HIGH | Queued (awaiting Alton to apply) |
| `scheduled-tasks/nightly-memory-curation/SKILL.md` | SKILL.md says "Total runtime budget: 5 minutes" but no enforcement exists -- executor sees wall-clock timeout and logs error | Add explicit timer check at start of each step; abort remaining steps if <60s remain | HIGH | Queued (awaiting Alton to apply) |
| `scheduled-tasks/self-improvement-loop/` | EVOLVE Phase 3 permanently blocked: agents cannot write `.claude/` SKILL.md files. Proposals accumulate in `data/proposed-improvements/` but are never applied. | Redesign Phase 3 to route all SKILL.md changes through `data/proposed-improvements/` by default. Add a weekly digest step that lists unreviewed proposals for Alton. | MEDIUM | NEW |
| `skills/market-snapshot/` and `weekly-financial-summary/` | Positions section permanently empty because `data/financial/positions.md` does not exist. Skill repeats same "no positions" flag every run. | Add one-time escalation: if positions file absent for 3+ consecutive runs, flag as SETUP INCOMPLETE and stop repeating the boilerplate. Document in a setup-checklist.md. | MEDIUM | NEW |
| `scheduled-tasks/morning-briefing/SKILL.md` | One error at 2026-04-03T11:41:10 (fast fail, 0.03s) before successful run -- likely a transient startup issue | Add retry logic note: if task exits in <10s with error, re-run once before recording failure | MEDIUM | Queued |
| `skills/weekly-financial-summary/` | vastai CLI date-range flag broken (Python 3.10 `collections.Callable` regression). Historical earnings data unavailable. | User action: `pip install --upgrade vast-ai` on gpuserver1. One-time fix, not a skill change. | LOW | Queued (awaiting gpuserver1 fix) |
| All scheduled tasks | `data/trajectories/` is empty -- no task writes trajectory data. Observer auditor cannot detect effort patterns accurately | Wire trajectory write at end of each task execution to `data/home-agent/trajectories/{date}.jsonl` | LOW | Queued |

---

## Resolved Items

None yet.

---

## How to Use

- **Skill:** The skill file or agent behavior that needs improvement
- **Issue:** Specific failure observed -- what happened, when, what the expected behavior was
- **Proposed Improvement:** Concrete change to rules, prompts, or logic
- **Priority:** High / Medium / Low
- **Status:** Queued / In Progress / Done / Rejected

Add entries here as failures are observed. Review weekly during system maintenance. Implement highest-priority items first.
