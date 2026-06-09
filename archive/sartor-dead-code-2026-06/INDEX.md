# Archive: sartor/ dead code (2026-06-09 purge pass)

System-uplift WP-C (`sartor/memory/projects/system-uplift-2026-06/GOAL.md`).
The Feb-era heartbeat spine last ran 2026-05-02; no registered Windows task
invoked any of these at archival time. Live references verified absent
(only data-file paths like `data/heartbeat-log.csv` and string literals remain
in live code, which read artifacts, not these modules).

| File | What it was | Why archived |
|------|-------------|--------------|
| heartbeat.py | KAIROS heartbeat engine (30-min health/dispatch loop) | dead since 2026-05-02; no runner |
| scheduled_executor.py | Heartbeat-driven task dispatcher for .claude/scheduled-tasks | dead with heartbeat |
| run_observers.py | Sentinel/auditor/critic observer runner | dead with heartbeat |
| brief.py | Early briefing CLI | superseded by morning_briefing.py |
| safety_api.py + test_safety_api.py | Live-server safety API experiment | never deployed; test polluted pytest collection |
| costs.py | CostTracker (3-tier pricing) | costs.json untouched since April; dashboard reads the JSON directly. TestCostTracker removed from test_sartor.py in same commit |
| create-heartbeat-task.ps1 | Registered the dead heartbeat Windows task | orphan of heartbeat.py |

CLAUDE.md still lists `sartor/costs.py` as the cost tracker — correction is
in the pending CLAUDE.md amendment proposal (uplift D-A), not made
autonomously per the approval rule.
