---
type: feedback
entity: goal-driven-execution
created: 2026-04-26
created_by: Alton (via CLAUDE-1.md import) + Rocinante orchestrator translation
status: active
tags: [meta/discipline, meta/verification]
related: [CLAUDE, complex-project, framework-floor-not-checklist]
---

# Goal-driven execution

**Rule:** Define the success criterion before starting non-trivial work. Loop until the criterion is met, not until you feel done.

**Why:** "Make it work" is not a success criterion. It produces drift, post-hoc rationalization of partial completion, and the failure mode where the agent claims done because it's tired of working. A pre-stated criterion is the only thing that can be checked by a fresh-context reviewer (or by next-Claude reading STATE.md).

## Transform vague tasks into verifiable goals

| Vague | Verifiable |
|---|---|
| Add validation | Write tests for invalid inputs, then make them pass |
| Fix the bug | Write a test that reproduces it, then make it pass |
| Refactor X | Tests pass before AND after; behavior unchanged |
| Improve documentation | Three named-scenario users can complete their flow without asking |
| Clean up memory | Audit produces concrete delete-list with reasons; staleness measure decreases by N |
| Build dashboard | A specific page renders X data, refreshes on Y, loads under 2 seconds |
| Run experiment | Pre-registered buckets in advance; results land in exactly one |

The pattern: a verifiable goal names what would falsify "done."

## For multi-step tasks, state a brief plan with verify-steps

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

The verify-step is the discipline. Without it, "loop until verified" decays into "loop until tired."

## Strong vs. weak success criteria

- **Strong:** "Heartbeat alarm fires when I `kill -9` the curator process; SMS arrives within 5 minutes; dashboard shows red." Falsifiable. Can be checked.
- **Weak:** "Heartbeat alarm works." Cannot be checked. Failure modes are invisible.

Strong criteria let the orchestrator loop independently. Weak criteria require constant clarification — you can't tell if you're done.

## The operating skills

The two `superpowers` skills are the live versions of this principle:

- **`superpowers:test-driven-development`** — write the test first, then make it pass. The "Add validation → Write tests for invalid inputs" pattern is this skill.
- **`superpowers:verification-before-completion`** — before claiming done, run the verification command and confirm output. Evidence before assertions.

Invoke them on any non-trivial task. They are not bureaucracy; they are the difference between "I think it works" and "I verified it works."

## How this composes with the household

- **`complex-project` Phase 8 (Validate)** is the project-scale version: pre-registered interpretation criteria checked against frozen buckets. Same idea, longer time horizon.
- **`STATE.md` exit criteria** for HEARTH phases are written so a fresh Claude can verify pass/fail (Lethe's mortality clause). Same idea, multi-session horizon.
- **The Constitution's calibration commitment (§3)** maps to the same discipline at the epistemic layer: don't claim more confidence than your evidence supports. Goal-driven execution is calibration-in-action.

## When this rule does NOT apply

- Trivial fixes. "Change the typo" doesn't need a verify-step beyond reading the diff.
- Open-ended exploration. Brainstorming, research scoping, "tell me what's interesting in this corpus" — these are not goal-driven; they are context-gathering. Goal-driven execution applies once a specific task emerges.
- Conversation. Answering a question doesn't need a pre-registered criterion. Saying "I don't know" is itself the verification when honest.

The framework-floor-not-checklist rule applies here too: load the discipline when the task is non-trivial; just decide otherwise.

**Lineage:** Codified 2026-04-26 from §4 "Goal-Driven Execution" in `~/Downloads/CLAUDE (1).md`. Imported because Sartor's existing Phase-8 pattern lived only inside `complex-project` skill scope; this raises it to a household-wide working rule.
