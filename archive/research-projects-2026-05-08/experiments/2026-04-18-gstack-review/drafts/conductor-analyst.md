# Conductor Analyst — gstack's conductor vs Sartor's initiative-mode

## Prosecutorial finding up front

Two load-bearing premises in the brief do not survive contact with the filesystem and the source material.

1. There is no skill at `C:\Users\alto8\Sartor-claude-network\.claude\skills\initiative-mode\SKILL.md`. That path does not exist. Closest structural analog: `research-effort/SKILL.md`, which is the Sartor phased-execution skill with parallel Opus 4.7 subagents.
2. gstack does not ship a "conductor agent." "Conductor" in gstack's orbit refers to Conductor.build, a separate Mac app that runs multiple isolated Claude Code sessions in git worktrees. gstack itself is a bundle of 23 slash-command roles plus power tools, and the agentscodex review is explicit that the sprint phasing (Think → Plan → Build → Review → Test → Ship → Reflect) is "human-enforced, not automatically enforced."

The brief's framing — a "conductor agent that forces strategic planning before code generation" — is a composite of (a) gstack's role-switching slash commands (`/autoplan`, `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`), (b) Conductor.build's parallel session orchestration, and (c) marketing language about planning discipline. No single gstack artifact does what the brief attributes to it.

## 1. What the "conductor" actually does mechanically

Reading across the three secondary sources, the gstack planning mechanism is: the user types `/autoplan` or `/office-hours` or `/plan-eng-review`, and Claude Code loads that command file as a persona-specific prompt. The user is expected to run these in order before running `/ship` or `/canary`. The agentscodex source is direct: gstack requires "a human [to decide] when to switch roles and in what order." Conductor.build, separately, "runs multiple Claude Code sessions in parallel — each in its own isolated workspace." Direct quotes of the `autoplan.md` command file were not retrievable — the raw GitHub URL returns 404, suggesting the repo layout differs from the standard `.claude/commands/` path, or the file list in the mindstudio piece is summarized rather than verbatim.

## 2. What research-effort does mechanically

From `research-effort/SKILL.md`: "Phase 0 -- Question Formulation" forces a one-sentence RQ, success criteria, scope tier, and pre-registered expected outcomes before any agent is spawned. "The PI is the LAST agent to write, not the first." A Devil's Advocate role is mandatory at Standard scope and above, with the rule that it "must not be merged into the PI." Execution is gated at Phase 4 by a pre-registered-criteria check with "max 2 refinement loops" before forcing a documented negative result.

## 3. Convergence and divergence

Convergent surface: both frameworks enforce sequence (think → plan → build → review) and both use role specialization. Both are phased.

Divergent substance:
- research-effort has a hard gate (pre-registered criteria, Devil's Advocate must challenge in writing, max 2 loops). gstack has ordering conventions that a human chooses to honor.
- research-effort spawns parallel subagents with defined deliverables. gstack is one Claude instance swapping personas by slash command.
- research-effort is a single skill with a methodology. gstack is 23 commands users must remember to invoke.

The divergence is architectural, not cosmetic. research-effort compiles planning discipline into the control flow; gstack externalizes it to user discipline.

## 4. Is the "forces strategic planning" claim real or performative?

Performative, as shipped in gstack. "Forcing" requires a gate the agent cannot walk around. gstack's pre-build commands are discoverable but skippable — nothing stops a user from typing `/ship` first. This is the same trained-humility tic: the ritual of saying "let me plan" does not constitute a plan, and gstack's structure does not make the ritual load-bearing. research-effort's pre-registered-criteria gate and mandatory Devil's Advocate role are actual gates, because a downstream phase reads upstream artifacts and fails loudly if they are missing.

## 5. Concrete amendment to research-effort

Do not clone gstack's command taxonomy. Do add one gstack-adjacent idea: a `/pair-agent`-style inline adversarial critic that runs during Phase 4 execution, not after. Diff:

In `research-effort/SKILL.md` Phase 4, replace the existing Devil's Advocate step ("After execution, the Devil's Advocate reviews ALL findings") with: "Devil's Advocate runs in parallel with the Technical Implementer as a streaming critic. At each iteration boundary, the Implementer must quote the DA's most recent objection and respond in the execution log before the next iteration begins. If two consecutive iterations produce no substantive DA objection, the DA role is replaced with a fresh adversarial persona seeded from the literature survey's weakest-link finding."

This fixes the one real weakness: post-hoc DA review often rubber-stamps work the implementer has already become attached to. Inline DA is harder to ignore.

## Sources

- `C:\Users\alto8\Sartor-claude-network\.claude\skills\research-effort\SKILL.md`
- `C:\Users\alto8\Sartor-claude-network\.claude\skills\` directory listing (no `initiative-mode` present)
- https://github.com/garrytan/gstack (README via WebFetch; direct command file URLs returned 404)
- https://www.mindstudio.ai/blog/what-is-gstack-gary-tan-claude-code-framework (no mention of a conductor agent)
- https://agentscodex.com/posts/2026-03-20-garry-tan-gstack-agent-teams-claude-code/ ("human-enforced, not automatically enforced")
- https://news.ycombinator.com/item?id=47355173 (community sees gstack as a polished application of established multi-agent patterns, not novel architecture)
