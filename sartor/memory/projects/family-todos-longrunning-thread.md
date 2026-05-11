---
name: family-todos-longrunning-thread
description: Persistent Claude Code thread Alton is keeping alive to (a) actually knock down family to-dos and (b) build the memory + skills + context infrastructure required for the assistant to follow along coherently across many sessions.
type: project
date: 2026-05-02
updated: 2026-05-02
updated_by: opus-4.7 (1M context, auto-mode session)
status: active
priority: p1
tags: [meta/thread, domain/family, household/governance, skill-building]
related: [family/active-todos, family-memory-fixup, FAMILY, MEMORY]
aliases: [Family Todos Longrunning Thread, Family Thread]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Family to-dos longrunning thread

## What this thread is

Alton is intentionally keeping a single Claude Code session alive over time as a forge for two parallel goals:

1. **Workstream**: actually close family to-dos (calls, payments, signups, coverage decisions, etc.).
2. **Forge**: build the memory layer, skill scaffolding, and context-loading patterns the assistant needs to be useful across many sessions on this same problem domain.

The thread is named `family-todos` (per `claude -n` convention) and is intended to be addressable via `/remote-control "family-todos"` so Alton can drive it from his phone or laptop.

## Why: prior failure mode

A 2026-04-25 audit (`projects/family-memory-fixup.md`, opus-4.7) identified the structural pathology: family todos live in five different files, the `personal-data-gather` agent appends gather-debate inline into the user-facing calendar, and the canonical dashboard at the top of `family/active-todos.md` was last triaged 2026-04-16 — even when this thread started (2026-05-02), the dashboard was already 16 days stale.

That plan was filed `status: proposed` and never executed. This thread is, in effect, the execution context for it (or for whatever supersedes it after this session's discussion).

## Working pattern (to refine over time)

- TaskCreate is the spine. Tasks track the open todos AND the skill-building work in parallel.
- Each session in this thread starts with: `catchup` skill, then read [[family/active-todos]] dashboard, then read this file, then read TaskList.
- New facts discovered during the workstream get written to the right `family/*` file as they appear (not at end-of-session — context is lost too easily).
- New behavioral lessons go to `feedback/` per usual auto-memory rules.

## Open question to resolve at thread start

Does Alton want to:
- **(A) Ratify and execute** the 2026-04-25 fixup plan — meaning we spend the first chunk of the thread on structural cleanup before knocking down individual todos, OR
- **(B) Work ad-hoc** — knock down individual todos as they surface, treat the structural cleanup as opportunistic, accept the friction of triaging the 1311-line file each session.

This file gets updated once Alton answers.

## History

- 2026-05-02 — Created at thread start (Rocinante, Opus 4.7 1M context, auto mode). Anchors the dual-purpose nature of the thread so future sessions land oriented.
