---
type: reference
version: 0.3
updated: 2026-04-18
updated_by: Claude (wikilinks-implementer, gstack-port)
last_verified: 2026-04-18
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

### Staleness fields (all canonical hub files and `type: fact` files)

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `last_verified` | date | ISO `YYYY-MM-DD` | Last time content was explicitly confirmed still true. Distinct from `updated` — a file can be unchanged for months and still be verified yesterday. Required on canonical hubs and any file with `type: fact`. |
| `volatility` | string | `low`, `medium`, `high` | How fast this content rots. Low = biographical facts (DOB, names). Medium = career/role details. High = pricing, live machine state, deadline-bearing content. Drives staleness-score thresholds in `staleness.py`. |
| `oracle` | string | entity key from `.meta/oracles.yml` | Optional pointer to the ground-truth source for this page. When set, the stale-detector queries the oracle before alerting — can auto-bump `last_verified` if the live value still matches. Omit when oracle is `human` (flags for morning briefing instead). |
| `superseded_by` | wikilink | `[[filename]]` | For archived v0.1 files: points at the current version. The v0.1 file stays readable in git history but is excluded from active curation. |

### Hard rules

- `updated` is required and must be maintained. Curator checks this weekly.
- `last_verified` is required on all canonical hub files and any file with `type: fact`. Set to the date you last confirmed the content is accurate, not just the date you edited the file.
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
| `[[rel:target]]` | Typed wikilink — relation on the link itself (see below) |
| `#entity/person` | Hierarchical tag |

### Hard rules

- File targets match the filename exactly (case-insensitive in Obsidian but we use UPPERCASE for core files)
- Never use `[text](file.md)` for internal links — wikilinks only
- External URLs still use Markdown links: `[Obsidian help](https://help.obsidian.md)`
- Declare aliases in the target file's frontmatter (`aliases:` field) so Obsidian's autocomplete and grep-based resolution both work
- Backlinks are automatic in Obsidian — remove manually-curated "Related" sections over time unless they add narrative context beyond what the link graph shows

### Typed wikilinks (`rel:` prefix)

Added in v0.3. Optional prefix that tags a wikilink with a relation type. Syntax: `[[rel:target]]` where `rel` is drawn from the starting vocabulary below. Untyped `[[target]]` remains the default and is unchanged by this addition.

The extractor at `sartor/memory/extract_graph.py` walks all memory markdown, parses typed links, and writes one edge per occurrence to `data/graph.jsonl`. No database, no LLM call, no dependencies. Run on the current corpus on each curator pass.

**Starting vocabulary** (extend by adding to the extractor's allowed set; do not invent new relations ad hoc):

| Relation | Domain → Range | Meaning |
|----------|----------------|---------|
| `works_at` | person → organization | Employment |
| `parent_of` | person → person | Parent-child |
| `married_to` | person → person | Spouse |
| `owns` | entity → asset | Legal ownership |
| `invested_in` | entity → company | Equity or pre-IPO position |
| `located_in` | entity → place | Physical location |
| `depends_on` | file → file, system → system | Hard dependency |
| `supersedes` | file → file | Current version replaces named prior |
| `archived_from` | file → file | Archived copy of a former canonical |

Display text works the same as untyped wikilinks: `[[rel:TARGET|visible text]]` renders "visible text" and extracts the edge (rel, TARGET).

**Examples using actual Sartor entities:**

```markdown
Alton [[works_at:ASTRAZENECA]] as Senior Medical Director.
Alton is [[parent_of:vayu|Vayu's father]].
Alton is [[married_to:FAMILY#Aneeta|married to Aneeta]].
Solar Inference LLC [[owns:machines/gpuserver1|machine 52271]].
Alton [[invested_in:business/solar-inference|Solar Inference LLC]] (50% with Aneeta).
The household is [[located_in:FAMILY|Montclair, NJ]].
The curator [[depends_on:MEMORY-CONVENTIONS|reads this spec]] on every run.
[[HOUSEHOLD-CONSTITUTION]] v0.2 [[supersedes:archive/HOUSEHOLD-CONSTITUTION-v0.1|HOUSEHOLD-CONSTITUTION v0.1]].
The draft was [[archived_from:archive/OPERATING-AGREEMENT-DRAFT-GPUSERVER1|OPERATING-AGREEMENT-DRAFT-GPUSERVER1]] during the 2026-04-16 cleanup.
```

**Extracted edges** (one per link) look like:

```json
{"source": "sartor/memory/ALTON.md", "relation": "works_at", "target": "ASTRAZENECA", "line": 27}
{"source": "sartor/memory/ALTON.md", "relation": "parent_of", "target": "vayu", "line": 79}
```

**Rules:**

- Lowercase `rel:` prefix. Relations are snake_case.
- One relation per link. Don't chain (`[[works_at+member_of:X]]` is invalid).
- The target slug is the wikilink target with no path normalization; the extractor preserves it verbatim. Collisions between `BUSINESS` (root) and `business/` (folder) are resolved at query time, not at extract time.
- A file may have many typed links to the same target; each occurrence is a row in `data/graph.jsonl`. Deduplicate at query time if needed.
- Untyped wikilinks are not extracted to the graph file. If you want an edge, type it.
- New relations require a spec edit here plus a code change in the extractor's allowed set. Do not let the vocabulary sprawl.

## Observation syntax (adopted from basic-memory)

Inline structured observations can appear anywhere in a memory file body. Use this format inside fact lists, decision logs, and change-log entries:

```
- [category] fact statement #tag
```

Examples:

```markdown
- [pricing] vast.ai RTX 5090 market rate $0.38/hr as of 2026-04-12 #gpu #pricing
- [decision] chose inbox pattern over direct write for multi-machine sync #architecture
- [deadline] Form 990 due 2026-05-15, extension filed #nonprofit #taxes
- [fact] Alton DOB confirmed 1984 #person #biographical
```

### Rules for observation lines

- The `[category]` tag is lowercase and single-word (or hyphenated): `fact`, `pricing`, `decision`, `deadline`, `status`, `constraint`.
- `#tags` at the end follow the same tag vocabulary as frontmatter (use `/` prefix for hierarchy: `#entity/person`).
- Optional `(context)` note may follow tags: `- [fact] Aneeta NPI 1234567890 #person (Neurvati employment record)`.
- The observation line is still valid markdown. It renders as a bullet in Obsidian.
- The curator's extractor can parse these lines into a structured observation store without modifying the file.
- Use observation lines for dense fact lists, not for discursive prose. If a fact needs explanation, use a heading and paragraph.

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

## Related

- [[10-MASTER-PLAN]] §3 — Staleness detection design: scoring function, oracle map, volatility weights, LLM verification budget
- [[10-MASTER-PLAN]] §13 EX-12 — This file's upgrade brief
- `sartor/memory/.meta/oracles.yml` — Entity-to-oracle map consumed by `staleness.py`
- `sartor/memory/staleness.py` — Staleness scorer that reads `last_verified`, `volatility`, and `oracle` fields
- [[02-research-scout]] §4 — basic-memory observation syntax source (schema adopted here)

## References

- [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) — the source pattern
- [Obsidian Flavored Markdown](https://help.obsidian.md/obsidian-flavored-markdown)
- [Obsidian callouts](https://help.obsidian.md/callouts)
- [Obsidian properties](https://help.obsidian.md/properties)
- [basic-memory observation syntax](https://basicmachines.co/blog/what-is-basic-memory/) — source for `- [category] fact #tag` pattern

## History

- 2026-04-18: v0.3 — Added typed wikilinks (`rel:` prefix). Starting vocabulary of 9 relations (works_at, parent_of, married_to, owns, invested_in, located_in, depends_on, supersedes, archived_from). Extractor at `sartor/memory/extract_graph.py` emits `data/graph.jsonl`. Ported from gstack review ([[gstack-review-2026-04-18]]).
- 2026-04-12: v0.2 — Added `last_verified`, `volatility`, `oracle`, `superseded_by` frontmatter fields (EX-12). Added "Observation syntax (adopted from basic-memory)" section. Added Related section cross-linking master plan and staleness.py. Bumped version to 0.2.
- 2026-04-07: v0.1 — Initial creation. Distilled from kepano/obsidian-skills review and memory audit.
