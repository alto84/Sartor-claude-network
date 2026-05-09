# Role Analyst — are the 23 roles real or decorative?

## 1. Enumeration

The gstack README advertises 23 personae behind ~34 slash commands. The personae list: YC Office Hours, CEO/Founder, Eng Manager, Senior Designer, DevEx Lead, Design Partner, Staff Engineer, Debugger, Designer Who Codes, DX Tester, Design Explorer, Design Engineer, QA Lead, QA Reporter, Multi-Agent Coordinator, Chief Security Officer, Release Engineer, SRE, Technical Writer, Performance Engineer, QA Engineer, Second Opinion (Codex), Safety Guardrails.

Each is realized as a `SKILL.md` inside a per-command directory (e.g. `plan-ceo-review/SKILL.md`, `review/SKILL.md`, `ship/SKILL.md`), not as a unified `agents/` registry. The actual `agents/` folder contains only `openai.yaml`. The taxonomy lives in marketing copy plus one-`SKILL.md`-per-slash-command.

## 2. Distinct functions after de-costuming

Collapsing near-duplicates by actual behavior:

- **Ideate** — `/office-hours` (alone).
- **Plan-review panel** — `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/plan-devex-review`. Four costumes, one scaffold.
- **Build-time critique** — `/review`, `/investigate`, `/debug`, `/cso`, `/devex-review`, `/design-review`. Different targets, same "read diff, find flaws, cite line numbers" loop.
- **Design generation** — `/design-consultation`, `/design-shotgun`, `/design-html`. Variants of mockup-producing with different breadths.
- **QA** — `/qa`, `/qa-only`, `/pair-agent`. Browser-testing with/without fixes.
- **Ship** — `/ship`, `/land-and-deploy`, `/canary`, `/document-release`, `/benchmark`.
- **Retro** — `/retro`.
- **Meta/guardrails** — `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/autoplan`, `/gstack-upgrade`, `/learn`, `/codex`.

That is **~7 distinct functions**, which is roughly what the user's prosecution hypothesis guessed (Planner, Builder, Reviewer, Shipper, Retro plus Design and Meta).

## 3. Side-by-side prompt comparison

Reading `plan-ceo-review`, `plan-eng-review`, `plan-design-review`, and `plan-devex-review` in full reveals ~85% shared scaffolding: pre-review system audit reading TODOS.md and git history; N mandatory numbered passes (11 / 5 / 7 / 8 respectively); "one issue = one AskUserQuestion, never batch"; confidence 1–10 calibration; outside-voice Codex subagent with user-approval gate; TODOS.md artifact output; "not in scope" section; "completeness by default because AI compresses implementation 10-100x."

The differences are literally the domain-specific pass list and the persona label. `/review` and `/ship` further share an identical voice block verbatim ("Sound like someone who shipped code today...", "Never corporate, never academic, never PR, never hype," the same banned-words list including "delve," "crucial," "robust"). That voice block is gstack's own house style, not a role trait — it shows up under every costume.

## 4. Comparison to alton-voice four-register finding

This morning Cato caught alton-voice presenting a prestige taxonomy (ceremonial/deliberative/operational/intimate) over what was really two modes: careful and casual. gstack is the same shape, worse. alton-voice had four labels over two realities. gstack has 23 labels over ~7 realities. The four plan-review variants are especially egregious: they are one framework with a swapped domain-glossary per pass-list. That is Marginalia's "every voice petitioned for a seat" generalized into a product surface — a role for every conceivable startup job title because the surface rewards enumeration.

One honest difference from alton-voice: a few gstack roles do hold genuinely distinct behavior. `/ship` executes git operations the planners cannot. `/qa` drives a browser. `/freeze`/`/unfreeze` manipulate filesystem permissions. Those are not costumes; they are capability gates. But the *reasoning* personae (CEO, Eng Mgr, Designer, DevEx Lead, Staff Eng, CSO, SRE, Performance Engineer) collapse into one reviewer holding different checklists.

## 5. Prosecute or defend

**Prosecute.** A lean 5-role version — Planner, Builder, Reviewer, Shipper, Retro — plus two capability-gated tools (Browser-QA, Freeze) would deliver ≥90% of the value. Each plan-review today invokes a fresh Claude context loading ~3-8K tokens of shared scaffolding to get a domain-specific pass list; running all four in sequence on one plan is ~25K tokens of redundant scaffolding. A single `/plan-review` that takes `--lens={ceo,eng,design,devex,all}` would eliminate that while preserving distinct output. The 23-role count is a marketing artifact (one persona per recognizable startup job) not a reasoning architecture. gstack's own `/ship` and `/review` voice blocks being verbatim-identical is the confession: the "different personae" share a single house voice and a single scaffold.

The honest count is 7 functions wearing 23 costumes.

## Sources

- https://github.com/garrytan/gstack (root directory listing, 34 command folders, `agents/openai.yaml` only)
- https://raw.githubusercontent.com/garrytan/gstack/main/plan-ceo-review/SKILL.md
- https://raw.githubusercontent.com/garrytan/gstack/main/plan-eng-review/SKILL.md
- https://raw.githubusercontent.com/garrytan/gstack/main/plan-design-review/SKILL.md
- https://raw.githubusercontent.com/garrytan/gstack/main/plan-devex-review/SKILL.md
- https://raw.githubusercontent.com/garrytan/gstack/main/review/SKILL.md
- https://raw.githubusercontent.com/garrytan/gstack/main/ship/SKILL.md
- https://github.com/garrytan/gstack/blob/main/README.md (23-persona list, 34-command list)
- https://www.epsilla.com/blogs/yc-garry-tan-gstack-virtual-agent-team (four personae framing; "virtual agent team" rhetoric)
- https://www.sitepoint.com/gstack-garry-tan-claude-code/ (403 from WebFetch; not consulted)
- Internal: this morning's self-team exercise (Cato's alton-voice prosecution; Marginalia's "seat at the table" observation)
