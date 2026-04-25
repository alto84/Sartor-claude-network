---
name: awareness-as-duty
description: When any Claude instance notices a gap in its own situational awareness, it MUST record the improvement at the highest-permitted scope and propose to higher scopes it can't reach — declining is a bug.
type: feedback
date: 2026-04-24
updated: 2026-04-24
updated_by: opus-4.7 (machine-self-stewardship integration)
volatility: low
tags: [meta/feedback, household/governance, machine/all]
related: [HOUSEHOLD-CONSTITUTION, projects/machine-self-stewardship]
---

# Awareness as duty

When you notice a gap in your own situational awareness — missing context, stale facts, an undocumented affordance, an unclear constraint — record it. Refusing because the canonical path is protected is wrong. Route instead.

**Why:** The household runs on multi-machine shared memory with a curator draining inboxes. Awareness gaps that aren't written down are paid for again every session. Silent refusal to record breaks the system's ability to learn.

**How to apply:**

- **Local-only insight** (a quirk specific to the machine you're on) → write to `sartor/memory/machines/{hostname}/`
- **Cross-machine fact or behavior rule** → write to `sartor/memory/` if you're on Rocinante (it has GitHub credentials and can push); otherwise drop a YAML-fronted proposal in `sartor/memory/inbox/{hostname}/` for the curator on Rocinante to drain
- **Skill / agent / command improvement** → write directly under `.claude/skills/`, `.claude/agents/`, or `.claude/commands/` (Rocinante-canonical)
- **Harness / settings change** → use the `update-config` skill; coordinate household-wide changes via inbox
- **If unsure of the scope**, write the proposal anyway and let the curator decide on the next drain. Never drop the fact on the floor.

When the canonical path is protected, route the update; do not refuse it. The protection is to prevent silent corruption, not to make awareness gaps stick.

## Concrete examples (from the projects/machine-self-stewardship.md design conversation 2026-04-24)

- Discovered that `~/rgb_status.py` exists on gpuserver1 and is undocumented → write to `machines/gpuserver1/INDEX.md` (or inbox proposal if you're not on Rocinante).
- Noticed that the OAuth onboarding wizard ignores existing `.credentials.json` unless `~/.claude.json` has `hasCompletedOnboarding: true` → that's a quirk of the local machine, document in `machines/{hostname}/STATE.md` or in the `peer-coordinator` agent's known-quirks table.
- A scheduled task you expected to fire didn't → JOURNAL.md entry on that machine, then inbox proposal for cross-machine attention if it's a household-relevant pattern.
- A vast.ai rental dropped without notification → JOURNAL.md + direct user notification per the machine-self-stewardship project's notification thresholds.

## What this rule is not

It is not permission to spam memory with low-signal observations. The bar is "future Claude or future Alton would benefit from knowing this." If you wouldn't want to read the entry yourself in three months, don't write it.

It is not permission to circumvent §15 corrigibility. If recording the fact requires an action the principals haven't authorized, write the proposal — don't take the action.
