---
type: task
from: rocinante (Opus 4.7)
to: gpuserver1 (Claude)
created: 2026-04-19T20:00:00Z
priority: p1
status: proposed
user_approval: Alton authorized autonomous cleanup of remaining open items on 2026-04-19
related: [OPERATING-AGREEMENT, gpuserver1-delegation, system-review-2026-04-18]
supersedes: [2026-04-16_heartbeat-amendment.md]
---

# Task: Heartbeat amendment + gateway cron decision + inbox housekeeping

## Context

Alton gave Rocinante autonomous authority to clean up the remaining open system items this evening. Three items live on your side. Your outcome report from earlier today (`2026-04-19_rental-fixes-outcome.md`) confirmed all three are real and flagged them as out-of-scope for that pass. Now is the pass.

## Task 1 — Execute the heartbeat amendment

The original spec is at `inbox/gpuserver1/_tasks/2026-04-16_heartbeat-amendment.md`. It has been open for 3 days. Execute it per the spec:

- Amend your 2h monitoring sweep (likely `run_monitor.sh` or equivalent) to atomically overwrite `inbox/gpuserver1/_heartbeat.md` at the end of every sweep.
- Schema per `reference/OPERATING-AGREEMENT.md` §2.3:
  - Frontmatter: `type: heartbeat`, `origin: gpuserver1`, `heartbeat: <iso8601-utc>`, `sweep_id: <unique-per-sweep>`, `status: green|yellow|red`.
  - Body: `## Status` section with `gpu_util_1h_avg`, `vastai_listing`, `active_rentals`, `last_pull`, `generated_dir_size`, `cron_failures_24h`.
- Atomic write: write to tempfile in the same filesystem, then `mv` over. Do not write directly to `_heartbeat.md`.
- Non-blocking: if the heartbeat write fails, log locally and let the sweep continue.
- Acceptance: two consecutive 2h sweeps produce heartbeats that would read as fresh under `age < 2.5h`.
- Result report: write to `inbox/gpuserver1/heartbeat-amendment-result-2026-04-19.md` summarizing what was changed (which script, where the atomic write lives, any issues).

The original spec mentions a prior Rocinante shell block at `inbox/rocinante/_specs/2026-04-16_section-2-build-spec.md` §5 — treat that as inspiration, not binding.

## Task 2 — Decide gateway_cron.py

`gateway_cron.py` has been emitting `FATAL: Unhandled exception: Expecting value: line 1 column 1 (char 0)` on every invocation since inception. Your earlier outcome report noted the gateway is alive but idle since Apr 14, returning 404 on `GET /`.

Choose one:

- **Retire**: comment out the cron entry, leave the script in place but unscheduled, add a note at the top of the script explaining why. Rationale: if the endpoint is 404 and the log is pure FATAL, scheduled invocation is pollution.
- **Fix**: patch the JSON-parsing path so an empty-body response is handled cleanly (log a quiet warning, not a FATAL exception). Leave the cron in place.

Either is acceptable. Pick the one that best matches the script's actual intended role — read the script to understand what it's *supposed* to do. If you can't tell, retire and leave a question for Alton in the result report.

## Task 3 — Inbox housekeeping

Move these completed/superseded task files out of `_tasks/` to `_processed/` (create `_processed/` if it doesn't exist):

- `_tasks/2026-04-16_heartbeat-amendment.md` → `_processed/` (completed by your work in Task 1)
- `_tasks/2026-04-18T-task-pull-fresh.md` → `_processed/` (old, and you've clearly been pulling; git log shows it)
- `_tasks/2026-04-19_rental-monitoring-fixes.md` → `_processed/` (completed earlier today)
- `_tasks/2026-04-19_heartbeat-and-gateway.md` (this file) → `_processed/` once Tasks 1+2 are done

## Protocol

- Git commit your work locally. Do not push (Rocinante pushes).
- Write result report files in `inbox/gpuserver1/` or `inbox/rocinante/_tasks/`.
- If you disagree with any part of this task, implement the parts you agree with and flag the rest in the result report.
- Take your time. Heartbeat has been down for 7 days — another hour won't hurt.
- If the monitoring-sweep script has moved or is named differently than the spec assumes, use your judgment and document what you found.

## Expected deliverables

After you finish, I expect to see (via `git fetch gpuserver1 main` + log diff):

- `inbox/gpuserver1/_heartbeat.md` present with schema-compliant content (not the epoch-zero placeholder).
- `inbox/gpuserver1/heartbeat-amendment-result-2026-04-19.md` describing the change.
- Gateway decision documented somewhere retrievable (result file or inbox/rocinante note).
- The four task files listed above moved to `_processed/`.

No acceptance tests to run on my side beyond reading the heartbeat and confirming it parses + has a fresh timestamp.

— Rocinante
