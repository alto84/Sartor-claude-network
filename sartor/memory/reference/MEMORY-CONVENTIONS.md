---
type: reference
updated: 2026-04-07
updated_by: Claude
tags: [meta/conventions, curator/spec]
aliases: [Conventions, Memory Conventions]
---

# Memory Conventions

Single source of truth for how memory files in `sartor/memory/` are written. The curator enforces this. New files start here. Existing files are migrated incrementally.

`sartor/memory/` is already an Obsidian vault (`.obsidian/` exists). These conventions lean into that fact so the same files work in Obsidian, grep, and curator scripts.

## Why this exists

Before this spec, every file used `> Last updated: YYYY-MM-DD` prose. Urgency was ALL-CAPS. Relationships were hand-curated "Related" sections. Stale-detection was regex hunting. None of that is queryable.

This spec adds:
1. **YAML frontmatter** — turns prose metadata into queryable structured fields
2. **Obsidian callouts** — turns urgency prose into scannable visual signals
3. **Wikilink discipline** — turns ad-hoc `[[LINK]]` usage into a navigable graph

The changes are additive. Old prose stays readable. New metadata enables new queries.

## Frontmatter schema

Every memory file starts with YAML frontmatter. Minimum fields:

```yaml
---
type: domain
updated: 2026-04-07
updated_by: Claude
tags: [...]
---
```

### Core fields (all files)

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `type` | string | `person`, `domain`, `meta`, `reference`, `daily`, `skill` | What kind of file this is |
| `updated` | date | ISO `YYYY-MM-DD` | Last content change. Curator updates on edit. |
| `updated_by` | string | `Claude`, `Alton`, or agent name | Who made the last change |
| `tags` | list | hierarchical, e.g. `[entity/tax, status/active]` | Queryable cross-cuts. Use `/` for nesting. |

### Optional fields by file type

**Domain files** (TAXES, BUSINESS, FAMILY, MACHINES, PROJECTS, ASTRAZENECA):
```yaml
entity: TAXES              # canonical name, usually matches filename
status: active             # active | pending | archived | stale
next_review: 2026-05-01    # when to re-check for staleness
aliases: [Tax, Taxes]      # alternate names for this entity
related: [BUSINESS, ALTON] # explicit links (optional — wikilinks in body also work)
```

**Deadline-bearing files**:
```yaml
next_deadline: 2026-04-15  # earliest open deadline in this file
```

**Person files** (ALTON, and any future person):
```yaml
name: "Emmett Alton Sartor"
aliases: [Alton, Emmett, alto8, alto84]
```

**Reference files** (like this one):
```yaml
type: reference
```

### Hard rules

- `updated` is required and must be maintained. Curator checks this weekly.
- `type` is required.
- `tags` is required but can be empty `[]`.
- Use lowercase for tag values. Hyphens ok. Slashes for hierarchy.
- Dates are ISO `YYYY-MM-DD`. Never relative ("yesterday", "next week").
- Frontmatter replaces the old `> Last updated: ...` blockquote. Delete the blockquote on migration.

## Callouts

Use callouts to signal urgency, decisions, and blockers inline. Rendered in Obsidian, grep-friendly in plain text.

| Callout | Obsidian type | When to use |
|---------|---------------|-------------|
| `> [!deadline] 2026-04-15` | `info` (aliased) | Time-sensitive item |
| `> [!decision]` | `question` (aliased) | Open decision requiring Alton |
| `> [!blocker]` | `danger` (aliased) | Something blocking other work |
| `> [!fact]` | `note` (aliased) | Verified factual claim (helps disambiguate from speculation) |
| `> [!warning]` | `warning` | Risk or caution |
| `> [!todo]` | `todo` | Action item with owner |
| `> [!example]` | `example` | Concrete example |

### Examples

```markdown
> [!deadline] 2026-04-15
> Personal 1040 — file or extend via Form 4868

> [!decision]
> File 1040 now or extend? Waiting on Jonathan Francis's recommendation.

> [!blocker]
> Solar contract must transfer from personal name to LLC before system is placed in service.

> [!fact] Aneeta TY2025 Neurvati W-2
> Box 1 wages $194,289.10, NJ withheld $11,276.62, EIN 87-1954898
```

### Hard rules

- Deadline callouts always include the ISO date after the bang: `> [!deadline] 2026-04-15`
- Decisions always state what's being decided, not just "need to decide"
- Don't use ALL-CAPS prose for urgency anymore. Use a callout.
- One callout per concern — don't nest unless you have a good reason.

## Wikilinks

All cross-file references use Obsidian `[[FILE]]` syntax, not Markdown links.

| Pattern | Meaning |
|---------|---------|
| `[[TAXES]]` | Link to `TAXES.md` |
| `[[TAXES\|tax filing]]` | Link with display alias |
| `[[TAXES#Filing Status by Entity]]` | Link to a heading in TAXES.md |
| `[[daily/2026-04-07]]` | Link to a subfolder file |
| `#entity/person` | Hierarchical tag |

### Hard rules

- File targets match the filename exactly (case-insensitive in Obsidian but we use UPPERCASE for core files)
- Never use `[text](file.md)` for internal links — wikilinks only
- External URLs still use Markdown links: `[Obsidian help](https://help.obsidian.md)`
- Declare aliases in the target file's frontmatter (`aliases:` field) so Obsidian's autocomplete and grep-based resolution both work
- Backlinks are automatic in Obsidian — remove manually-curated "Related" sections over time unless they add narrative context beyond what the link graph shows

## Tag vocabulary

Use these prefixes. Extend by adding new terms, not new prefixes.

| Prefix | Examples | Meaning |
|--------|----------|---------|
| `entity/` | `entity/person`, `entity/tax`, `entity/llc`, `entity/nonprofit` | What entity this file concerns |
| `status/` | `status/active`, `status/pending`, `status/archived`, `status/stale` | Lifecycle state |
| `priority/` | `priority/p1`, `priority/p2`, `priority/p3` | Triage signal |
| `domain/` | `domain/gpu`, `domain/family`, `domain/career`, `domain/infra` | Coarse bucket |
| `curator/` | `curator/spec`, `curator/needs-review` | Signals to the curator agent |
| `meta/` | `meta/conventions`, `meta/roadmap` | Meta-level files |

## File type template

Use this as the starting point for any new memory file.

```markdown
---
type: domain
entity: FILENAME_UPPER
updated: 2026-04-07
updated_by: Claude
status: active
next_review: 2026-05-01
tags: [entity/example, status/active]
aliases: [Example]
---

# File Title

One-paragraph orientation: what this file is about and who should read it.

## Key Facts

- Fact one
- Fact two

## Status

> [!deadline] 2026-04-15
> Critical item if any

Current state in prose.

## Open Questions

- [ ] Question one
- [ ] Question two

## Related

- [[SOMETHING]]
- [[OTHER]]

## History

- 2026-04-07: Initial creation
```

## Migration plan

Don't migrate everything at once. Migrate on touch:

1. Any file you edit, add frontmatter before committing
2. Curator's nightly pass upgrades one stale file per run
3. Target: all 14 core hub files migrated within 14 days

Keep the "History" section for narrative change log. Frontmatter `updated` is just the latest date.

## What NOT to put in frontmatter

- Full prose descriptions (put in body)
- Long lists of facts (put in body)
- Duplicated content that belongs somewhere else
- Anything that changes more than once per week (put in body or task tracker)

Frontmatter is for *stable metadata that answers queries*. If it's a one-time note or a piece of content, it goes in the body.

## Querying the wiki

Once files have frontmatter, these queries become trivial via grep or a Python helper:

```bash
# Find all stale files (not updated in 30+ days)
grep -l "^updated: 202[6-9]-" sartor/memory/*.md | xargs -I{} ...

# Find all deadlines in next 14 days
grep -rh "> \[!deadline\]" sartor/memory/ | sort

# Find all open decisions
grep -rh "> \[!decision\]" sartor/memory/

# Find all files tagged entity/tax
grep -l "entity/tax" sartor/memory/*.md
```

A proper helper script at `sartor/memory/query.py` can wrap these, but grep works fine.

## References

- [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) — the source pattern
- [Obsidian Flavored Markdown](https://help.obsidian.md/obsidian-flavored-markdown)
- [Obsidian callouts](https://help.obsidian.md/callouts)
- [Obsidian properties](https://help.obsidian.md/properties)

## History

- 2026-04-07: Initial creation. Distilled from kepano/obsidian-skills review and memory audit.
