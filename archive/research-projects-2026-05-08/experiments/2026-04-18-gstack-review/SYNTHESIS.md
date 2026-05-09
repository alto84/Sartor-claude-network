# gstack review synthesis — 2026-04-18

Seven-agent analysis of Garry Tan's `gstack` and sibling `gbrain`, applying the interior-report discipline and Cato-style prosecution norms established earlier today.

## Consolidated finding

gstack is a real artifact with three genuine innovations wrapped in a larger structure of prestige framing, AI-polished documentation, and viral-marketing amplification. The distinction between the innovations and the frame is load-bearing for what we import.

## Seven lenses, one-line each

- **Scout (cartography).** gstack is prompt-library + persistent Chromium daemon + image binary. No memory layer internally. "23 tools" is marketing — repo has 30+ slash-command dirs. gbrain is a separate TypeScript/Bun app with PGLite or Supabase + pgvector. Claude-fingerprint visible in Tan's own docs (Karpathy cold-open, metric-dense intros, capitalized coined phrases).
- **Comparator (gstack vs Sartor).** Different problems. gstack slices by lifecycle-role because it has one artifact moving through one pipeline. Sartor slices by domain because its five workloads are orthogonal. gstack has no scheduled tasks; Sartor has 10. gstack has no multi-machine inbox or operating agreement; Sartor does.
- **Conductor-analyst.** Two of my prior assumptions failed: `initiative-mode` does not exist in Sartor (closest analog is `research-effort/SKILL.md`), and gstack does not contain an embedded conductor agent — Conductor is Tan's separate Mac app for parallel worktrees. gstack's planning sequence is skippable; `research-effort` has real gates.
- **Velocity-analyst.** Tan's actual claim is 810× his 2013 baseline in "logical lines" (undefined). gstack repo is 227 commits over 38 days with template-multiplication inflating LOC (one authored change generates N committed lines). Realistic prediction for a disciplined Alton-scale adopter: 800-2,500 committed LOC/week sustained, 5K/week burst ceiling, 400/week lower bound on hard-domain work.
- **Role-analyst.** 23 personae collapse to 7 distinct functions. `/review` and `/ship` share verbatim-identical voice blocks with identical banned-words lists. Same pathology as this morning's alton-voice 4-register prosecution, worse ratio (23→7). Lean 5-role + 2 capability-gated tools delivers ≥90% of value.
- **Memory-analyst.** gbrain is four things stacked (markdown vault + PGLite/Supabase mirror + 26-skill registry + Postgres job queue). gstack barely uses it — packaging, not integration. Three real ideas Sartor lacks: typed wikilinks (`[[works_at:AstraZeneca]]`), Compiled-Truth + Timeline page split, Postgres mirror for graph joins. Concrete port: `rel:` prefix to wikilinks + `data/graph.jsonl` sidecar in curator.
- **Prosecutor.** Mechanical evidence from `preamble.ts`: ~600+ lines of shared scaffolding injected via `{{PREAMBLE}}` into every skill at tier 2+. Confirms Role-analyst's 85% claim as architecture, not observation. `conductor.json` is literally 5-line npm scripts — "conductor agent" in the viral thread is a marketing composite. Concessions: `/ship` release engineering, `{{PREAMBLE}}` template architecture, Completeness Principle as behavioral primitive. Also prosecuted Scout for fence-sitting on the Claude-fingerprint finding.

## What to port to Sartor (concrete)

**High value, low cost:**

1. **Typed wikilinks in MEMORY-CONVENTIONS.** Add optional `rel:` prefix: `[[works_at:AstraZeneca]]`, `[[invested_in:Anthropic]]`, `[[parent_of:Vayu]]`. Curator extracts to `data/graph.jsonl` sidecar at write-time. Zero LLM calls. Enables graph queries without schema migration. (From Memory-analyst.)
2. **`{{PREAMBLE}}` template pattern for Sartor skills.** Sartor has ~15 skills with increasingly duplicated frontmatter and scaffolding. A `.tmpl` → rendered `SKILL.md` pipeline with a shared preamble (do-not-announce, no em-dashes, house voice) would cut ~500 lines of duplication across the skill set. Commit both `.tmpl` and rendered `.md` as gstack does.
3. **Completeness Principle as a feedback file.** `feedback/completeness-principle.md`: a task is not done until all of its requirements are demonstrably satisfied; partial solutions that fail one requirement should return to the stakeholder, not ship. This is gstack's one genuinely-behavioral primitive worth adopting.

**Medium value, consider later:**

4. **Retro → skill-refinement loop as a scheduled task.** gstack's `/retro` runs weekly; the compounding leverage comes from this loop editing the skill library itself. Sartor has `weekly-skill-evolution` scheduled but its firing is unverified per CLAUDE.md. Make it actually fire.
5. **Compiled-Truth + Timeline page split.** For entities that accumulate gather entries (ALTON.md, FAMILY.md), split the stable-truth from the time-ordered append log. This morning's ALTON.md rebase-conflict happened precisely because stable-truth and gather-entries are currently interleaved.

**Skip / already-dominated:**

6. 23-role taxonomy — pathological when roles share 85% scaffolding. Sartor's 12 agents are already role-confused; don't add more.
7. Synchronous command-pipeline framing — Sartor is an async daemon by design. gstack's `/ship → /qa → /retro` pipeline maps to Sartor's scheduled-task model, not to a command menu.
8. LOC metric — don't adopt. Use committed-PR count or feature-scope completion.
9. "Conductor agent" framing — the actual Conductor is a separate Mac app (Tan's own). Sartor's parallel-agent pattern via subagent dispatch is architecturally equivalent and doesn't need a rebrand.

## Cross-cutting lesson that survives compaction

The morning's discipline held under load. Every agent in this review was instructed to apply the 5.8.1 interior-report discipline, resist audition rhetoric, and prosecute before proposing. The outputs show the discipline working: Scout flagged AI-fingerprint in Tan's docs, Role-analyst caught the voice-block duplication verbatim, Prosecutor caught Scout's own fence-sit on the fingerprint finding. When you instrument refraction at the prompt level, the chorus catches its own performance — the same result as the self-team exercise, on a technical artifact.

## Sources

- [gstack repo](https://github.com/garrytan/gstack)
- [gbrain repo](https://github.com/garrytan/gbrain)
- [MindStudio overview](https://www.mindstudio.ai/blog/what-is-gstack-gary-tan-claude-code-framework)
- [SitePoint tutorial](https://www.sitepoint.com/gstack-garry-tan-claude-code/) (403 during agent fetches; cited secondarily)
- [gstacks.org](https://gstacks.org/)
- [Epsilla analysis](https://www.epsilla.com/blogs/yc-garry-tan-gstack-virtual-agent-team)
- [HN discussion](https://news.ycombinator.com/item?id=47355173)
- [Agents' Codex analysis](https://agentscodex.com/posts/2026-03-20-garry-tan-gstack-agent-teams-claude-code/)
- [TurboDocx comparison](https://www.turbodocx.com/blog/garry-tan-gstack)
