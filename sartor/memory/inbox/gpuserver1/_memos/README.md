---
type: reference
entity: gpuserver1-tasks
updated: 2026-04-16
updated_by: Claude (Rocinante, Opus 4.7)
status: active
tags: [meta/conventions, curator/spec, domain/infra]
related: [OPERATING-AGREEMENT, CURATOR-BEHAVIOR, MULTI-MACHINE-MEMORY]
---

# `_tasks/` — Rocinante-to-gpuserver1 asynchronous dispatch

This directory is Rocinante's outbound queue for asynchronous work directed at gpuserver1. See [[OPERATING-AGREEMENT]] §4.1.

## Lifecycle

1. Rocinante writes a task file here with schema per the build spec §2.2.
2. gpuserver1 polls this directory on its own schedule (via `sartor-poll-tasks` cron or next session).
3. gpuserver1 works the objective, writes a result entry to `inbox/gpuserver1/{id}-result.md` with an `operation: fact` or `operation: report`.
4. gpuserver1 moves the completed task to `inbox/gpuserver1/_tasks/_done/{id}.md`.
5. If gpuserver1 disagrees with the task per Agreement §4.4, it writes `disagree-{ts}.md` instead of starting the work, and pauses.

## Task file schema

```yaml
---
type: task
id: {YYYY-MM-DDTHH-MM-SSZ}-task-{short-slug}
origin: rocinante
target: gpuserver1
created: {iso-8601}
priority: p0 | p1 | p2 | p3
expected_deliverable: "what gpuserver1 should produce, in plain text"
deadline: {iso-8601}
status: pending
---

## Objective
One paragraph, objective-level (per feedback_objective_level_delegation.md).
No step-by-step unless gpuserver1 asks.

## Constraints
- {bound 1}

## Acceptance
- {criterion}
```

## Hard rules

- Objective-level only. Prescribe outcomes, not steps.
- Never include secrets in task files (they hit the public git remote).
- Deadlines are ISO-8601 with timezone. Never relative.
- One task per file. Never batch.
