---
name: skill-conventions
description: Shared conventions for authoring skills in `.claude/skills/`. Replaces the rejected `{{PREAMBLE}}` template port from the gstack review — at Sartor's current scale a conventions memo is more proportionate than a template pipeline.
type: reference
updated: 2026-04-18
updated_by: Claude (Opus 4.7 1M) — gstack port evaluation
tags: [reference, meta/skills, conventions]
related: [gstack-review-2026-04-18, interior-report-discipline, alton-voice, MEMORY-CONVENTIONS]
---

# Skill authoring conventions

When authoring or editing a skill at `.claude/skills/<name>/SKILL.md`, apply the conventions below. These are the genuinely-shared requirements — not the duplicated scaffolding gstack `preamble.ts` injects. Sartor's house voice rules already live in `.claude/rules/` and CLAUDE.md and ship in-context every session; do not re-state them in each skill.

## Required frontmatter fields

- `name:` — lowercase-kebab, matches the directory name.
- `description:` — one sentence. Must include the triggers: phrases or situations where the skill should be invoked. The loader matches on this.
- `type:` — one of `capability`, `workflow`, `reference`, `feedback`. Most skills are `capability`.
- `updated:` — ISO-8601 date. Bump on every non-trivial edit. Sartor corpus is checked against a 60-day staleness threshold.
- `tags:` — list. At least one domain tag (`gpu`, `family`, `nonprofit`, `finance`, `research`, `meta`).

Optional but encouraged: `related:` with wikilinks to neighboring skills, rules, or reference docs.

## Authoring rules (genuinely shared across skills)

1. **Do not announce the skill.** "I am using the X skill to do Y" is the failure mode the `interior-report-discipline` skill specifically forbids. Apply skills silently. The reader should not notice.
2. **Lead with the answer, not the reasoning.** Per `.claude/rules/communication-style.md`.
3. **No emojis, no em-dashes, no formulaic filler** ("Great question!", "Absolutely!", "Let me be clear", "It's worth noting"). Per communication-style rules.
4. **Completeness-principle at ship time.** Enumerate requirements, verify each, name any gap explicitly rather than smoothing it in prose. See `feedback/completeness-principle.md`.
5. **Interior-report-discipline when claims about Claude's internal state appear.** Use "functions as" only where the functional/phenomenal distinction is the content; otherwise replace with "I notice X" or a mechanical description. See the skill itself.
6. **Apply alton-voice register selectively.** See the `alton-voice` skill — default is register 1 (authentic) or 2 (professional cover-letter) for anything Alton-facing. Avoid register 4 (executive-template) unless explicitly asked.

## Load-bearing shared content across skills (genuine duplication — ~15 lines)

These fragments DO recur across multiple skills and are candidates for future reuse (either a partial or a short `{{PREAMBLE}}` if the skill library grows substantially):

- vast.ai SSH invocation: `ssh alton@192.168.1.100 "~/.local/bin/vastai show ..."`
- "Present data only — do not auto-execute" guardrail text for financial and vast.ai skills.
- Output-path conventions for skills that write reports: `data/reports/<date>/<skill-name>-<timestamp>.md`.

At ~15 lines of genuine shared content across ~30 skills, a template pipeline is not yet justified. If the skill library grows to 80+ and the shared fragment count reaches 50+ lines, revisit.

## Why not port `{{PREAMBLE}}`

The gstack review proposed porting gstack's `preamble.ts` template-injection pattern. Empirical evaluation (experiments/2026-04-18-gstack-port/preamble-impl.md) found:

- The "duplicated house voice" gstack's preamble deduplicates lives, in Sartor, in `.claude/rules/*.md` and `CLAUDE.md`, both of which ship in-context every session. They are not duplicated in the skills.
- Across 30 skills, actual shared content is ~15 lines, not the hundreds the gstack review implied.
- A `PREAMBLE.tmpl` + renderer added +32 authored lines for ~0 lines of deduplication benefit.
- Verdict: decline the port. Use this conventions memo instead.

## When to write a new feedback file instead of a skill

Feedback files in `sartor/memory/feedback/` auto-inject into every session. They are for behavioral primitives that should shape output across all skills and agents. Skills are for invokable capabilities. Examples:

- `completeness-principle` — behavioral primitive → feedback file.
- `interior-report-discipline` — behavioral primitive with decision procedure → skill (has enough mechanical content to be invoked as a procedure).
- `gather-triage-2026-04-16` — ongoing noise-filter rule → feedback file.
- `morning-briefing` — capability → skill.

If the content is "how Claude should speak or decide," it's feedback. If it's "a procedure Claude can invoke," it's a skill.

## History

- 2026-04-18: Created as the proportionate alternative to the rejected `{{PREAMBLE}}` port.
