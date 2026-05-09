# `_preamble` — shared skill prefix

A small scaffold for skills that share boilerplate. Modeled after gstack's
`{{PREAMBLE}}` pattern, but deliberately trimmed: the shared content in
Sartor's current skill set is modest, and the preamble stays under 30 lines.

## What lives here

- `PREAMBLE.tmpl` — the shared text. Substituted into `SKILL.md.tmpl` files at
  the literal `{{PREAMBLE}}` marker by `scripts/render_skills.py`.

## When to author a skill with the template pipeline

Use the `.tmpl` form if the skill does any of the following:

- SSHes to the GPU server (benefits from the SSH quick-reference block).
- Produces financial, marketplace, or external-communication output
  (benefits from the "no autonomous action" rule stated once).
- Writes output under the canonical paths `reports/`, `data/financial/`,
  `data/research/notes/`, or `sartor/memory/inbox/`.

If none of those apply, stay inline. An author-time `SKILL.md` with no
`.tmpl` is legal and preferred when the preamble would be decoration.

## When NOT to use the pattern

- The skill has a unique register that conflicts with the preamble
  (e.g. `alton-voice`, `interior-report-discipline`). These skills set
  their own rules and the shared preamble would contradict them.
- The skill is a long reference doc (`build-llm-wiki`, `safety-research-wiki`)
  where the preamble would be noise at the top of a tutorial.
- The skill is pre-Era-2 (`agent-*`, `evidence-based-*`,
  `multi-agent-orchestration`, `distributed-systems-*`, `mcp-*`,
  `long-running-*`, `openclaw-*`, `ways-of-working-*`). These predate the
  current convention and are not worth rewriting speculatively.

## Authoring a new templated skill

1. Create `SKILL.md.tmpl` in the skill's directory.
2. Put YAML frontmatter at the top as usual.
3. Place `{{PREAMBLE}}` on a line by itself where the shared block should
   appear — conventionally immediately after the frontmatter.
4. Run `python scripts/render_skills.py` from repo root.
5. Commit both the `.tmpl` and the generated `SKILL.md`. The rendered file
   is the one Claude Code actually reads; the template is the source of
   truth for editors.

## Re-rendering after a preamble change

Edit `PREAMBLE.tmpl`. Run `python scripts/render_skills.py`. Commit all
changed files as one commit so the `.tmpl` and `SKILL.md` stay in sync.

## Why the preamble is small

The gstack review flagged ~600 lines of scaffolding shared across every
gstack skill. Sartor's skills do not share that much. Voice rules live in
`.claude/rules/communication-style.md`; domain rules live in
`.claude/rules/*.md`; `CLAUDE.md` declares identity. All three are
in-context when any skill runs. The preamble is reserved for the short
set of operational conventions the rules files do not cover: the SSH
quick-reference for gpuserver1, the "present data only" posture, and the
output-path conventions for reports.

If the preamble grows past ~50 lines, the abstraction has likely drifted.
Trim it.
