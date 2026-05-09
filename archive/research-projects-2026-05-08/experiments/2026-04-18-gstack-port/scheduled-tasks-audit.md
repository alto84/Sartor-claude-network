# Scheduled-tasks audit — 2026-04-18

Scope: `.claude/scheduled-tasks/` on Rocinante, CLAUDE.md §Scheduled Tasks, Windows Task Scheduler, and the matching output directories (`reports/daily/`, `reports/weekly/`, `data/`, `sartor/memory/daily/`, inbox/).

## Executive finding

There is a structural split between the SKILL.md definitions in `.claude/scheduled-tasks/` and the Windows scheduled tasks that actually fire. The SKILL.md files are Claude-prompt templates. The Windows tasks run plain Python modules under `sartor/`. Only four of the ten SKILL.md definitions have a matching Windows task, and none of the six "weekly" or "every-4h" skill-prompt tasks has ever been registered with the OS scheduler.

## 1. Inventory (10 tasks in `.claude/scheduled-tasks/`)

| Task dir | Intended cadence (SKILL.md) | Intended output |
|----------|-----------------------------|-----------------|
| morning-briefing | Daily 6:30 AM ET | `reports/daily/{date}-morning-briefing.md` |
| gpu-utilization-check | Every 4 hours | `data/gpu-utilization-log.csv`, `data/gpu-alerts.md` |
| market-close-summary | Weekdays 4:30 PM ET | `reports/daily/{date}-market-close.md` |
| nightly-memory-curation | Daily 11 PM ET | `data/consolidation-log/{date}.md`, bumps `data/SYSTEM-STATE.md` |
| weekly-financial-summary | Fridays 6 PM ET | `reports/weekly/{date}-financial-summary.md` |
| weekly-nonprofit-review | Sundays 9 AM ET | `reports/weekly/{date}-nonprofit-review.md` |
| weekly-skill-evolution | Sundays 3 AM ET | `data/skill-proposals/*`, `data/skill-evolution-log.md` |
| personal-data-gather | Every 4 hours | `sartor/memory/daily/{date}.md`, `data/gather-alerts.md`, `data/heartbeat-log.csv` |
| todo-sync | Nightly (post-wiki-reindex) | `data/todo-sync-state.md`, `data/todo-sync-overdue.md`, Google Tasks writes |
| wiki-reindex | Nightly 11 PM ET | `sartor/memory/indexes/*.json`, `data/wiki-state.md`, `data/evolve-log/{date}-wiki-reindex.md` |

CLAUDE.md lists nine rows and adds a `self-improvement-loop` (Every 6 hours) not present in `.claude/scheduled-tasks/`. It omits `personal-data-gather`, `todo-sync`, and `wiki-reindex`, all of which have SKILL.md files. This is a direct documentation drift.

## 2. Firing reality per task

| Task | Last verified output | Rating |
|------|----------------------|--------|
| morning-briefing | No file in `reports/daily/` matching pattern. Only `2026-04-02-knowledge-base-build.md` exists. SKILL.md never invoked. Windows task `SartorMorningBriefing` DID run today at 6:30 (result 0), but it executes `sartor.morning_briefing`, not this skill. | RED |
| gpu-utilization-check | `data/gpu-utilization-log.csv` does not exist. `data/gpu-alerts.md` does not exist. | RED |
| market-close-summary | No `*-market-close.md` in `reports/daily/`. | RED |
| nightly-memory-curation | `data/consolidation-log/` is empty. `data/heartbeat-log.csv` last line is 2026-04-12T23:04:01 — no writes for six days. | RED |
| weekly-financial-summary | `reports/weekly/` does not exist. | RED |
| weekly-nonprofit-review | `reports/weekly/` does not exist. | RED |
| weekly-skill-evolution | `data/skill-proposals/` is empty. `data/evolve-log/` has one file from 2026-04-03. No skill-evolution-log.md. | RED — this is the gstack-review-flagged compounding loop |
| personal-data-gather | `sartor/memory/daily/2026-04-18.md` is fresh and attributed to `personal-data-gather` in frontmatter. But the Windows task is `SartorGmailScan` running `sartor.gmail_scan`, not this skill. The OS task is firing; the SKILL.md is orphaned. | GREEN by output, but the SKILL.md itself is unused |
| todo-sync | `data/todo-sync-state.md` and `data/todo-sync-overdue.md` do not exist. | RED |
| wiki-reindex | `data/evolve-log/2026-04-03-1420.md` is the only evolve-log entry. `data/wiki-state.md` exists but not regenerated on cadence. | RED |

GREEN: 1. YELLOW: 0. RED: 9.

## 3. Discrepancies with CLAUDE.md

- CLAUDE.md §Scheduled Tasks claims nine tasks; `.claude/scheduled-tasks/` has ten. `personal-data-gather`, `todo-sync`, `wiki-reindex` are present in the directory but missing from CLAUDE.md. `self-improvement-loop` is in CLAUDE.md but has no SKILL.md dir.
- Cadences documented in CLAUDE.md are aspirational, not observed. None of the cadences match a registered Windows trigger except morning-briefing (6:30 AM daily) and a coarse approximation of personal-data-gather (SartorGmailScan at 06/10/14/18/22 = every 4 hours).

## 4. Windows Task Scheduler state

Six tasks are registered with `Sartor*` prefix. All enabled except `SartorHeartbeat`:

| OS task | Action | Trigger | Corresponds to SKILL.md |
|--------|--------|---------|-------------------------|
| SartorMorningBriefing | `python -m sartor.morning_briefing` | Daily 06:30 | morning-briefing (by schedule, different code path) |
| SartorCuratorPass | `scripts/curator-pass-run.cmd` | Daily 07:30 + 19:30 | nightly-memory-curation (partial, different code path) |
| SartorGmailScan | `scripts/gmail-scan-run.cmd` | Every 4h (06/10/14/18/22) | personal-data-gather (partial, different code path) |
| SartorConversationExtract | `python -m sartor.conversation_extract` | Daily 23:30 | not defined as a SKILL.md |
| SartorImprovementLoop | `scripts/improvement-loop-run.cmd` | Weekly Monday 20:00 | self-improvement-loop (CLAUDE.md ghost) — not weekly-skill-evolution |
| SartorHeartbeat | `pythonw sartor/heartbeat.py` | Every 30 min | DISABLED — stopped writing 2026-04-12 |

Six SKILL.md files have no OS registration: gpu-utilization-check, market-close-summary, weekly-financial-summary, weekly-nonprofit-review, weekly-skill-evolution, todo-sync, wiki-reindex.

## 5. Failing tasks

- `SartorHeartbeat`: Disabled, last run 2026-04-12. `data/heartbeat-log.csv` confirms the cutoff. Although `LastTaskResult = 0`, the task is no longer firing because State = Disabled.
- All six unregistered SKILL.md tasks (listed above) have no failure signal because they never run. Zero evidence in the output directories corroborates that.
- `SartorImprovementLoop` last ran 2026-04-12 20:00 with result 0; next run 2026-04-19. It fires weekly, not every 6 hours as CLAUDE.md claims.
- `gpuserver1` heartbeat file is the placeholder-uninitialized red state from 2026-04-16 (not updated since).

## 6. `weekly-skill-evolution` — the gstack priority

Not firing. No OS registration. No output in `data/skill-proposals/`, no `data/skill-evolution-log.md`, no record of having run. This is the highest-impact fix: it is the only task that would let the system improve its own skills over time, and the gstack review flagged it specifically. As of today it is purely aspirational.

## 7. Prioritized action list

1. Register `weekly-skill-evolution` with Windows Task Scheduler (Sunday 03:00). If the SKILL.md pattern is not the live execution path, port the logic into a `sartor.skill_evolution` module on the same harness pattern as `morning_briefing` and `curator_pass`. This is the compounding loop. Do this first.
2. Re-enable `SartorHeartbeat` or replace it. The 30-minute heartbeat is the signal that confirms everything else is alive. Six days of silence is a blind system.
3. Reconcile CLAUDE.md §Scheduled Tasks to reality. Remove `self-improvement-loop` (no SKILL.md). Add `personal-data-gather`, `todo-sync`, `wiki-reindex`. Annotate which SKILL.md files are `harness-prompt` vs which are `python-module-shim`.
4. Decide the SKILL.md status: either wire them into a real harness (Claude Code CLI executed by the `.cmd` shims) or mark the six unregistered ones as DEPRECATED so future audits do not re-open the question.
5. Register `gpu-utilization-check` as a 4-hour OS task or delete the SKILL.md. It has never produced a log file.
6. Register or retire `wiki-reindex` and `todo-sync`. These are cheap, deterministic, and the expected feeder for `morning-briefing` overdue surfacing.
7. Restore `reports/weekly/` directory plus weekly tasks (financial, nonprofit) or strike them from documentation.
8. Add a self-check: a nightly task that reads `data/heartbeat-log.csv` plus `reports/daily/` and alerts if any cadence target missed its window. The current audit would have caught this failure mode weeks earlier.
