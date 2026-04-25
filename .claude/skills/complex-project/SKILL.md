---
name: complex-project
description: Multi-phase project workflow for ambitious work — Explore → Plan → Build → Adversarial-Review → Revise → Re-Review → Greenlight → Validate → Loop. Codifies the structural-separation pattern (a team for synthesis, a SEPARATE outside reviewer for adversarial critique) plus pre-registered validation gates and explicit human greenlight before consequential action. Use for projects substantial enough that one mistake is expensive and the cost of a thorough loop is cheaper than the cost of being wrong. You design your own team and casting; this skill specifies the structure, not the cast.
model: opus
---

# Complex Project Workflow

Use when work is ambitious enough that one bad decision is expensive — research programs that consume meaningful compute, infrastructure changes affecting peer machines, schema/protocol designs that other things will depend on, anything where you want to be confident before firing.

For shorter, scoped questions (a literature scan, a one-shot analysis, a single-file refactor), use `research-effort` or just `Agent`. For routine work, just do it. This skill earns its overhead only on multi-phase work.

**This skill specifies the structure, not the cast.** You design the agents that fit your project — what their roles are, what they're called, how many you need, what their personas should be. The pattern is what's load-bearing; the names are not.

## The phases

| # | Phase | Who runs it | Output |
|---|-------|-------------|--------|
| 0 | Frame | Orchestrator (you) with the user | Single-paragraph problem statement, success criteria, scope |
| 1 | Explore | Team OR multiple parallel Agents | Literature, prior art, current-state inventory, options space |
| 2 | Plan | Team OR single Agent | Concrete plan with method ladder, measurement spec, first experiment |
| 3 | Build | Team or Agent | Initial artifacts (code, config, corpus, design docs) |
| 4 | Adversarial Review | **Standalone Agent — NEVER a team member** | Written critique memo from a reviewer that has no stake in the work |
| 5 | Revise | **Orchestrator (you), NOT the original builders** | Patches addressing the critique; rebuttal entries inline |
| 6 | Re-Review | **Standalone Agent, fresh context** | Second-pass critique; verifies revisions are real, catches defects introduced by the revision pass itself |
| 7 | Greenlight | **User/principal — explicit, in chat** | Authorization to fire consequential action |
| 8 | Validate | Whoever owns the build phase | Pre-registered interpretation of results against frozen criteria |
| 9 | Loop | Orchestrator decides | If validation incomplete → back to phase 5. If validated → ship/close |

## Structural rules — the load-bearing parts

These are the patterns that make this skill earn its overhead. Skip them and you have a fancy task list.

### 1. The reviewer sits outside the team

The adversarial-review agent is **never** a member of the build team. The team has a hypothesis with their names on it and friendly priors toward their own framing; an outside reviewer doesn't.

A reviewer inside the team friendly to its own conclusions loses meaning. Spawn the reviewer via plain `Agent`, not as a team member. Give it the brief, the artifacts to review, and an explicit charge: find what's vulnerable, not what's defensible.

The reviewer's persona is your design choice — a prosecutor, a skeptic, a red-team adversary, a senior code reviewer, a domain expert from outside the team's specialty. Pick the persona that will press hardest on the kind of work you're shipping.

### 2. Revisions are NOT done by the original sub-team

When prosecution lands, do NOT send the same agents that authored v1 to write v1.1. They have a stake in defending their own work; the rebuttal will read defensive even when the revision is real. Either the orchestrator (you) writes the revisions directly, OR you spawn a fresh agent with no priors.

This is counterintuitive — "the experts who wrote it know it best." But the prosecution exists precisely because expertise + ownership = motivated reasoning. The structural separation has to extend through revision, not just initial review.

### 3. Re-review on every revision pass

Don't ship after one round of review. The revisions themselves can introduce new defects — a second pass routinely catches issues that emerged from the first revision. Budget for it; ~10-15% of the original review cost. Stop iterating when the reviewer's verdict goes from "revise" to "fire after small patching" with patches mechanical enough that application can't introduce new bugs.

The reviewer for round 2 should ideally be the same persona/role as round 1 (so charges are evaluated consistently) but with **fresh context** — a new Agent invocation, not a continuation. Continuation lets prior reasoning prejudice the second pass.

### 4. Pre-register interpretation criteria before execution

Before you fire the consequential action, write down what success looks like AND what failure looks like AND what ambiguous looks like, with quantitative thresholds. Frozen, signed, dated. This prevents post-hoc interpretation drift. Today's persona-engineering: experiment 001 §6 is a pre-registered flowchart with six outcome buckets; results land in exactly one bucket determined before the run.

A pre-registration is real only if every plausible result has a home. If you can't classify the result against your buckets, you have a soft seam — close it (add a bucket, raise the bar) before firing.

### 5. Greenlight is a hard gate the orchestrator cannot self-approve

Before any consequential action (compute spend, irreversible commits, sending external messages, financial transactions), require explicit user/principal greenlight in chat. Status fields like `BLOCKED-awaiting-greenlight` enforce this; flipping them to `ready` requires a chat-message ack from the principal.

This is the rule that prevents the orchestrator from confidently shipping its own enthusiasm. Two reviewers agreeing is not greenlight. A reviewer saying "fire after patching" is not greenlight. The principal saying "fire" is greenlight.

### 6. Every phase commits

Each phase boundary produces git-committed artifacts. The phase log is the audit trail. Each review memo, each revision pass, each version of the plan is its own commit with its own message. If a future Claude wants to know "why does the framework have this seam," the commit history is the answer.

## Phase mechanics

### Phase 0 — Frame

Write a single paragraph capturing: what problem, why now, success criteria, scope (in/out), known constraints. This goes in `sartor/memory/research/<program>/INDEX.md` or equivalent program-root file. Future phases reference it; future Claudes orient from it.

If the framing requires significant exploration to even articulate, that's a sign Phase 1 belongs first — but write some preliminary frame anyway and update it after Phase 1.

### Phase 1 — Explore

Goal: gather context that the plan needs. Literature on the topic, prior art, current-state inventory of relevant systems.

If the work decomposes into 3-7 collaborating chunks (each producing its own artifact, with cross-agent reconciliation needed), use `TeamCreate`. If it's a single-shot ("scan the codebase for X" or "summarize prior work"), use `Agent`. If the chunks are truly independent (no cross-agent reconciliation), use parallel `Agent` calls instead of a team. Don't force team format on a single task.

You design the team. Pick agents whose roles fit the explore work — a literature-mapper, a current-state inventorier, a domain-expert, an empirical-validator, an archivist, whatever the project demands. Names are yours to choose; what matters is the role each one plays.

Produce concrete artifacts: docs in the program directory, not just chat output. The plan in Phase 2 references these by path.

### Phase 2 — Plan

Synthesize Phase 1 outputs into an actionable plan with:
- Method/intervention ladder (what gets tried first, in what order, with stopping criteria)
- Measurement spec (how do we know it worked)
- First-experiment proposal (concrete enough to run)

This phase usually decomposes into work for the same team (or the orchestrator alone). Output: `RESEARCH-PLAN.md` or equivalent + first experiment file.

### Phase 3 — Build

Implement the plan. May spawn build-specific subagents (an experimentalist, an integrator, etc.). Outputs are real artifacts: code, configs, probe sets, training scripts, etc.

### Phase 4 — Adversarial Review

Spawn the reviewer as a standalone Agent. Give it:
- The artifacts to review (paths)
- The explicit charge: identify what's vulnerable, especially what would fail under adversarial use
- Specific dimensions to attack (measurement validity, hidden assumptions, what happens if we succeed and the success is the wrong thing, what happens if we fail in an undocumented way)

The reviewer's persona is your design choice. For research frameworks, a prosecutor or skeptic persona presses on motivated reasoning and frame-friendliness. For code, an experienced code-reviewer persona presses on edge cases and maintainability. For policy/process, a domain expert from outside the team's specialty presses on field-specific gotchas. Pick the persona that fits the threat model of being wrong.

When a household-specific reviewer template is helpful, see `sartor/memory/feedback/` for any feedback files that codify reviewer briefings (e.g., the prosecutorial-discount template). These are inputs to your design, not prescriptions.

Output: a written review memo committed to the program directory. The memo MUST end with an empty `## Reply from the team` section that the team will fill during revision — this is the audit trail of what got changed because of what charge.

### Phase 5 — Revise

Orchestrator (you) writes the revisions. Per-charge: concede outright, contest with reasoning, or extend (concede the point but disagree on the patch). Land patches as commits with attribution to specific charges where useful. Don't bundle every patch into one commit — they're individually attributable.

Update the review memo's `## Reply from the team` section inline. The audit trail for "what got changed because of what charge" lives there.

### Phase 6 — Re-Review

Spawn the reviewer again, fresh context, with the revised inputs. Charge: verify the revisions are real, catch any new defects introduced by the revision pass.

If the second pass narrows from "revise" to "fire after small patching," apply those patches. If it widens (finds new substantive issues), loop back to Phase 5. Stop after at most three rounds — beyond that, you're either over-engineering the framework or have a fundamental design problem the framework can't fix.

### Phase 7 — Greenlight

Surface to the principal in chat with:
- The current prosecution status (cleared / patches needed / new charges)
- The artifacts ready to fire
- The cost of firing
- A clear yes/no question

The principal's chat-message answer is the gate. Status fields don't flip without it.

### Phase 8 — Validate

Run the pre-registered interpretation criteria from Phase 2. Numbers go in, bucket comes out. If the bucket is "fire" or "ship," do that. If "ambiguous," that's a real outcome — write it up as ambiguous, don't post-hoc reframe.

If the result lands somewhere the pre-registration didn't anticipate, that's a process violation flag; document it explicitly in the program log and update the pre-registration before drawing conclusions.

### Phase 9 — Loop

If the validation says "incomplete" or "partial," loop back to Phase 5 with the new findings. Don't loop back to Phase 1 unless the framing itself is invalidated — that's a different escalation.

## When NOT to use this skill

- Single-shot research (use `research-effort`)
- One-off analysis or summary (use `Agent`)
- Routine work (just do it)
- Work where the cost of being wrong is small (skip the review overhead)
- Work that's purely sequential with no validation checkpoint (chain `Agent` calls)

The skill earns its overhead when: (a) the cost of error is meaningful, (b) the work decomposes into phases where each phase's output gates the next, and (c) you'd want to be able to defend the decisions in the audit trail later.

## Reference: a worked example

The Sartor 2026-04-24/25 persona-engineering Phase 0 → Phase 1 fire decision is one instance of this pattern. A team produced LITERATURE/METHODS/MEASUREMENT + a first experiment proposal; an outside reviewer prosecuted them across 18 charges; orchestrator-written revisions addressed each; a fresh reviewer re-prosecuted and cleared 17/18 with five small remaining patches; mechanical patches landed; awaiting principal greenlight to fire.

Files (read them as the worked example, not as a template to copy verbatim): `sartor/memory/research/persona-engineering/` — INDEX, RESEARCH-PLAN, MEASUREMENT, MEASUREMENT-COUNTERVAILING, METHODS, LITERATURE, the prosecution memos, experiment 001. The team and reviewer there were named one way for that project; yours will be different.

## Tools

- `TeamCreate` — for build-phase work that decomposes into 3-7 collaborating chunks
- `Agent` — for outside reviewers (always standalone, never a team member), single-shot research, fresh-context revisers
- `TaskCreate` / `TaskUpdate` — phase tracking, with phase boundaries explicit in task descriptions
- `peer-coordinator` agent — for cross-machine handoffs when build phase touches a peer machine
- `sartor/memory/feedback/` — household feedback files that may help shape your reviewer's briefing
