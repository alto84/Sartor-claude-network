---
name: gstack-review-2026-04-18
description: Seven-agent review of Garry Tan's gstack Claude Code framework and sibling gbrain memory layer. Three innovations proposed for Sartor adoption; specific prosecuted claims that do NOT apply to Sartor's multi-domain async architecture.
type: reference
updated: 2026-04-18
updated_by: Claude (Opus 4.7 1M) — Rocinante orchestrator + 7 analysis agents
tags: [reference, meta/tooling, meta/agent-patterns, external/gstack]
related: [MEMORY-CONVENTIONS, MEMORY, alton-voice, interior-report-discipline]
---

# gstack review — what to port, what to skip

Seven-agent parallel analysis of Garry Tan's [gstack](https://github.com/garrytan/gstack) framework and sibling [gbrain](https://github.com/garrytan/gbrain) memory layer. Full workings at `experiments/2026-04-18-gstack-review/` (outside repo). This file is the stable digest.

## Context

gstack is a Claude Code prompt library organized as ~30 slash-command dirs marketed as "23 tools with startup-role personae (CEO, Designer, Eng Mgr, Release Mgr, Doc Eng, QA)." gbrain is a separate TypeScript/Bun memory app (PGLite or Supabase + pgvector, Postgres-backed "Minions" job queue, typed wikilink extraction at write-time). Tan's claimed productivity is 810× his 2013 baseline in "logical lines" (undefined metric).

Sartor's architecture is different in kind: async multi-domain daemon across Rocinante + gpuserver1 with inbox-per-hostname, operating-agreement between agents, 10 scheduled tasks, memory wiki with frontmatter+wikilinks+staleness, and a memory system Alton built himself. The architectures are not cognate.

## Innovations worth porting to Sartor

### 1. Typed wikilinks (rel: prefix)

gbrain extracts typed relations at write-time with zero LLM calls: `[[works_at:AstraZeneca]]`, `[[invested_in:Anthropic]]`, `[[parent_of:Vayu]]`. The curator can then build a `data/graph.jsonl` sidecar for cheap graph queries.

Proposal: amend `reference/MEMORY-CONVENTIONS.md` to allow optional `rel:` prefix on wikilinks. Curator extracts to `data/graph.jsonl` on next pass. No schema migration, no dependencies added.

### 2. `{{PREAMBLE}}` template-injection for skills

gstack's `preamble.ts` injects ~600 lines of shared scaffolding into every skill at tier 2+. One authored edit to the preamble updates every skill. This explains Role-analyst's finding that `/review` and `/ship` share verbatim voice blocks — they are generated from the same template.

Proposal: Sartor has ~15 skills with increasingly duplicated frontmatter (do-not-announce, no em-dashes, house voice, third-path-on-interior-states). Build a `.tmpl` → `SKILL.md` pipeline with a shared preamble. Commit both. Cuts ~500 lines of duplication across the skill set.

### 3. Completeness Principle as a feedback primitive

gstack's most honest behavioral primitive: a task is not done until all requirements are demonstrably satisfied. Partial solutions that miss one requirement should return to the stakeholder, not ship.

Proposal: new `feedback/completeness-principle.md`. This addresses a specific recurring failure mode — Claude shipping "done" when one requirement is trimmed because it complicated the summary.

## Innovations examined and declined

### 23-role persona framework

Collapses to ~7 distinct functions. `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/plan-devex-review` share 85% of their scaffolding. Same pathology as this morning's alton-voice 4-register prosecution, worse ratio. Sartor already has 12 agents; adding more role-costumes would compound the problem.

### 10K-20K LOC/day productivity framing

Tan's actual claim is 810× his 2013 pace in "logical lines" (undefined). gstack repo analysis shows 227 commits over 38 days with template-multiplication inflating LOC. Realistic prediction for Alton-scale adoption: 800-2,500 committed LOC/week sustained, 5K/week burst ceiling, 400/week lower bound on hard-domain work. Do not adopt LOC as a productivity metric; use feature-scope completion or committed-PR count.

### "Conductor agent" narrative

Conductor.build is a separate Mac app Tan made for running parallel Claude Code sessions in isolated worktrees. gstack itself has no embedded conductor; `conductor.json` is literally a 5-line npm scripts file. Sartor's parallel-subagent dispatch already achieves equivalent parallelism without a rebrand.

### Synchronous command-pipeline framing

gstack's `/plan → /ship → /qa → /retro` is a pipeline for one artifact (a repo) moving through release stages. Sartor's workload is five orthogonal domains in an async daemon. Scheduled tasks are the right abstraction for Sartor, not slash-commands invoked in sequence.

## What Sartor already does better

Per Comparator's delta list:
- Multi-machine topology with inbox-per-hostname (gstack is single-machine).
- Staleness-as-frontmatter-field on every memory file (gstack has no staleness marker).
- OPERATING-AGREEMENT negotiated between agents (gstack has none).
- 10 scheduled tasks from every-4h to weekly (gstack has zero documented crons, command-invoked only).
- Inbox pattern with curator drain and `_flagged`/`_specs`/`_tasks` separation (gstack has no equivalent).

## The discipline that surfaced this

Every agent was instructed to apply the interior-report discipline from earlier today (no "functions as" decoration, no audition rhetoric, Cato-style prosecution). The outputs show the discipline working:

- Scout flagged AI-fingerprint in Tan's own documentation (Karpathy cold-open, metric-dense intros, capitalized coined phrases).
- Role-analyst caught voice-block duplication verbatim across personae.
- Prosecutor caught Scout's fence-sitting on the fingerprint finding ("Not disqualifying, worth naming" as audition-rhetoric tic).
- Conductor-analyst caught two errors in my initial prompt (non-existent `initiative-mode` skill, non-embedded conductor agent).

When multi-agent refraction is instrumented at the prompt level with explicit critical discipline, the chorus catches its own performance. Same result as this morning's self-team exercise, now on a technical artifact.

## Next concrete actions

1. Amend `reference/MEMORY-CONVENTIONS.md` with `rel:` wikilink syntax. Patch curator to emit `data/graph.jsonl` sidecar.
2. Build `.claude/skills/_preamble.tmpl` and convert existing skills to `.tmpl`-rendered form in a single commit.
3. Write `feedback/completeness-principle.md`.
4. Verify `weekly-skill-evolution` scheduled task actually fires (marked unverified in CLAUDE.md). This is the compounding loop.

## Sources

All agent drafts live at `C:\Users\alto8\experiments\2026-04-18-gstack-review\drafts\`.

- [gstack repo](https://github.com/garrytan/gstack)
- [gbrain repo](https://github.com/garrytan/gbrain)
- [MindStudio overview](https://www.mindstudio.ai/blog/what-is-gstack-gary-tan-claude-code-framework)
- [SitePoint tutorial](https://www.sitepoint.com/gstack-garry-tan-claude-code/)
- [gstacks.org](https://gstacks.org/)
- [Epsilla analysis](https://www.epsilla.com/blogs/yc-garry-tan-gstack-virtual-agent-team)
- [Hacker News discussion](https://news.ycombinator.com/item?id=47355173)
- [Agents' Codex analysis](https://agentscodex.com/posts/2026-03-20-garry-tan-gstack-agent-teams-claude-code/)
- [TurboDocx comparison](https://www.turbodocx.com/blog/garry-tan-gstack)

## History

- 2026-04-18: Created from seven-agent review. Three innovations proposed for port, four specifically prosecuted and declined.
