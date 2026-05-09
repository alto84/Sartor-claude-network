# Prosecutor — prosecuting gstack

The brief asks where gstack is hype-engineered prestige structure versus real innovation. Five counts, then one concession, then one prosecution of a sibling draft.

## Count one: the LOC metric

Tan's own README asserts "~810x my 2013 pace (11,417 vs 14 logical lines/day)." The threads post inflates this into the 10K-20K/day hype wrapper. Three problems, each fatal on its own.

First, "logical lines" is undefined in the repo. There is no published counting script. We cannot audit whether generated host variants (claude.ts, codex.ts, factory.ts, kiro.ts, opencode.ts, slate.ts, cursor.ts, openclaw.ts, hermes.ts, gbrain.ts — ten hosts fanning out from one authored change each), regenerated SKILL.md files from `.tmpl` templates, fixture refreshes, and test-table parametrizations are stripped or counted. gstack's own CLAUDE.md confesses the pattern: "SKILL.md files are **generated** from `.tmpl` templates... Commit both the `.tmpl` and generated `.md` files." One authored edit, N mechanical file commits. If "logical" meant de-duplicated-authored it would be a different number; Tan has not shown his work.

Second, the claim is not reproducible. 11,417 logical lines/day sustained, part-time, while running YC full-time, is 4-10x above the believable ceiling for a strong senior with a well-tuned Claude Code workflow (velocity-analyst estimates 1-3K/day ceiling on real authored work). No independent party has replicated it. The number is load-bearing in the social proof and unaudited in the repo.

Third, the metric is performative. A framework that ships with its own productivity numbers baked into the pitch is incentivized to optimize the numbers. 35% test code plus ~18% Go templates gives gstack structural dominance on any line-count basis.

**Verdict: gameable. Not a signal.**

## Count two: role granularity

Twenty-three personae. Four of them — `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/plan-devex-review` — are the same scaffold with a domain-swapped pass list. I verified this independently via `scripts/resolvers/preamble.ts`: every skill at preamble-tier 2+ injects roughly 600+ lines of identical shared boilerplate (preamble bash, upgrade check, writing style migration, lake intro, telemetry prompt, proactive prompt, routing injection, vendoring deprecation, voice directive, AskUserQuestion format, writing style, completeness principle, repo mode, search before building, completion status). The `/qa` and `/cso` templates call `{{PREAMBLE}}` as a literal placeholder. Role-analyst measured 85% shared scaffolding reading the plan-review variants directly. The voice block between `/review` and `/ship` is verbatim identical.

The honest count is ~7 functions — Planner, Builder, Reviewer, Shipper, Retro, Designer, Meta — wearing 23 costumes. A single `/plan-review --lens={ceo,eng,design,devex}` would do the work. The 23-count exists because the surface rewards enumeration: one persona per recognizable startup job title.

**Verdict: prestige structure. A role for every seat at the table.**

## Count three: the conductor hype

The threads post says "A conductor agent forces the AI to think strategically before writing a single line of code." Three facts dismantle this.

First, `conductor.json` in the repo is a five-line npm scripts file: `{"scripts": {"setup": "bin/dev-setup", "archive": "bin/dev-teardown"}}`. It is consumed by Conductor.build, a separate Mac app that spawns parallel Claude Code sessions in git worktrees. gstack's contribution is writing a `.gstack/browse.json` to stop the browser daemon from port-colliding across workspaces. That is workspace isolation, not strategic thinking.

Second, the "plan before code" discipline is commands the user types in order. Nothing in the harness stops a user from typing `/ship` first. The agentscodex review states this plainly: "human-enforced, not automatically enforced." Conductor-analyst's framing is correct: "forcing requires a gate the agent cannot walk around."

Third, base Claude Code already responds to "plan before you code" when a user asks. gstack's contribution is a preloaded persona prompt. That is prompt templating, not a novel strategic faculty.

**Verdict: marketing composite. The threads post attributes to a single "conductor agent" three separate things — Conductor.build the external app, the ordering convention of slash commands, and base-model planning behavior.**

## Count four: viral framing

Reread the threads text: "The CEO of Y Combinator, Garry Tan, just open-sourced his exact personal AI setup!" "It literally turns Claude Code into a full virtual tech company!" "Ship software like the head of YC." The pedigree is doing the work. Strip "CEO of Y Combinator" from the pitch and the repo is a well-organized Claude Code skill pack with some real production-deploy tooling. The viral lift does not attach to the repo — it attaches to the credential.

The secondary coverage compounds this. MindStudio's blog made zero quantified claims and did not mention a conductor at all — the hype exists in the threads post and the README, not in serious technical write-ups. The HN thread notably did not debate LOC gaming; it surfaced telemetry, agent-autonomy loops, and composability complaints. The people actually reading the code found different concerns than the people retweeting the name.

**Verdict: credential arbitrage. "Ship like the head of YC" is the product, not gstack.**

## Concession

Three things in gstack are real and worth importing.

First, `/ship` with the VERSION/package.json drift detection, the separate CHANGELOG discipline, and the migration-script registration is substantive release engineering that base Claude Code does not do. The tax of release plumbing is real; automating it is a clean win.

Second, the `{{PREAMBLE}}` template architecture — one resolver compiling to N skill files with tier-based composition — is a legitimately good separation of shared behavior from role-specific logic. Sartor's `feedback/` and auto-injection pattern is the same insight shaped differently.

Third, the Boil the Lake / Completeness Principle is a correct observation about AI-assisted coding economics and is embedded as an actual constraint (the `Completeness: X/10` calibration in every AskUserQuestion). That is a real behavioral primitive, not hype.

## Prosecuting a sibling: scout

Scout earns a prosecution for a single lapse at line 50: "Claude-fingerprint tells in the docs themselves: README opens with a Karpathy pull-quote then immediately pivots to metric-driven validation... capitalized-phrase pattern... Not disqualifying, worth naming." This is fence-sitting. The observation is correct and load-bearing — it confirms gstack's documentation is AI-polished, which matters for count four (hype framing). "Not disqualifying, worth naming" is the audition-rhetoric tic of flagging a point while pre-emptively conceding it so no one gets mad. Either the Claude-fingerprint matters to the prosecution of gstack's authorial voice or it does not. It does. Scout should have prosecuted it instead of labeling it and moving on.

## Sources

- https://github.com/garrytan/gstack (repo root listing, 227 commits, TS 72% + Go templates 18%)
- https://raw.githubusercontent.com/garrytan/gstack/main/CLAUDE.md (verbatim, confirms template generation pattern)
- https://raw.githubusercontent.com/garrytan/gstack/main/scripts/resolvers/preamble.ts (verbatim, confirms ~600+ lines shared scaffolding per skill)
- https://raw.githubusercontent.com/garrytan/gstack/main/conductor.json (verbatim: 5-line npm scripts file)
- https://raw.githubusercontent.com/garrytan/gstack/main/qa/SKILL.md.tmpl (confirms `{{PREAMBLE}}` placeholder)
- https://raw.githubusercontent.com/garrytan/gstack/main/cso/SKILL.md.tmpl (confirms `{{PREAMBLE}}` placeholder)
- https://www.threads.com/@github.awesome/post/DV0wsEaFN9U (hype language verbatim)
- https://www.mindstudio.ai/blog/what-is-gstack-gary-tan-claude-code-framework (no quantified claims, no conductor)
- https://news.ycombinator.com/item?id=47355173 (community concerns were telemetry and autonomy loops, not LOC)
- Local: `C:\Users\alto8\experiments\2026-04-18-gstack-review\drafts\scout.md`
- Local: `C:\Users\alto8\experiments\2026-04-18-gstack-review\drafts\velocity-analyst.md`
- Local: `C:\Users\alto8\experiments\2026-04-18-gstack-review\drafts\role-analyst.md`
- Local: `C:\Users\alto8\experiments\2026-04-18-gstack-review\drafts\conductor-analyst.md`
- Local: `C:\Users\alto8\experiments\2026-04-18-gstack-review\drafts\comparator.md`
- Local: `C:\Users\alto8\experiments\2026-04-18-gstack-review\drafts\memory-analyst.md` (not read — out of scope for prosecution)
