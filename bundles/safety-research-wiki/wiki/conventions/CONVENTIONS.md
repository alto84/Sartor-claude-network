# Conventions

The file format spec the wiki enforces. Anything not following these conventions will either be flagged by `wiki.py --lint` or silently ignored.

## Frontmatter (YAML)

Every page begins with a YAML frontmatter block:

```yaml
---
type: mechanism
entity: IL-6-signaling
updated: 2026-04-09
updated_by: <your name>
status: active
tags: [mechanism/cytokine, severity/serious]
aliases: [IL-6, Interleukin-6]
related: [CRS, ICANS, tocilizumab]
---
```

### Required fields

| Field | Type | Values |
|-------|------|--------|
| `type` | string | `mechanism`, `drug`, `adverse-event`, `signal`, `study`, `reference`, `meta`, `note` |
| `entity` | string | canonical name, usually matches the filename stem |
| `updated` | ISO date | `YYYY-MM-DD`, bumped on every content change |
| `updated_by` | string | author of the last change |
| `status` | string | `active`, `archived`, `draft` |
| `tags` | list | hierarchical tags, slash-separated (`mechanism/cytokine`) |

### Optional fields (by type)

**Drug pages:** `generic_name`, `brand_names`, `drug_class`, `mechanism_of_action`, `indication`

**Adverse event pages:** `grading_system`, `preferred_term_meddra`

**Signal pages:** `opened` (ISO date), `closed` (ISO date or null), `severity` (low/medium/high)

**Study pages:** `phase`, `population`, `primary_endpoint`, `nct_id`

**All pages:** `aliases` (list of alternate names), `related` (list of wikilink targets)

### Hard rules

- `updated` must be ISO format `YYYY-MM-DD`. No relative dates.
- `tags` uses lowercase with `/` for hierarchy.
- Required fields cannot be empty. If a value is truly unknown, use `<FILL>` as the placeholder — lint will catch it.
- Frontmatter replaces any older metadata format (no `> Last updated:` blockquotes).

## Wikilinks

Cross-references use Obsidian-native `[[FILE]]` syntax.

| Pattern | Meaning |
|---------|---------|
| `[[CRS]]` | Link to `CRS.md` anywhere in the vault (case-insensitive stem match) |
| `[[CRS\|cytokine release]]` | Link with display alias |
| `[[CRS#Grading]]` | Link to a section heading within `CRS.md` |
| `[[mitigations/tocilizumab]]` | Path-based link for files in subdirectories |

### Hard rules

- Internal cross-references always use wikilinks, never Markdown links (`[text](file.md)`)
- External URLs use Markdown links: `[Chen et al. 2026](https://doi.org/...)`
- File targets match the filename stem, case-insensitive
- Never create a wikilink to a file you don't plan to create — use a `> [!todo]` callout instead

## Callouts

Obsidian-native callouts for scannable structured signaling:

```markdown
> [!warning]
> This finding contradicts the 2024 paper [[Chen-2024]] which claimed the opposite.
> New evidence from [[Kim-2026]] supersedes but reconciliation is pending.

> [!todo]
> Source for the 48h IL-6 peak claim is still pending. Check the 2026 Nature paper.

> [!fact] Verified claim
> Tisagenlecleucel was approved for ALL on 2017-08-30 (FDA).

> [!signal] Active signal
> LVEF decline cluster in CAR-T postmarket — see [[signal-2026-03-lvef-carT]]
```

### Callout vocabulary

| Callout | When to use |
|---------|-------------|
| `> [!warning]` | Risk, contradiction, or caution |
| `> [!todo]` | Pending work or missing source |
| `> [!fact]` | Verified claim with citation |
| `> [!signal]` | Active or pending safety signal |
| `> [!decision]` | Open decision requiring review |
| `> [!blocker]` | Something preventing progress |
| `> [!note]` | General annotation |
| `> [!example]` | Concrete example |

## Tags (hierarchical)

Use slash hierarchy. Keep vocabulary small (5-10 prefixes) and extend by adding terms, not prefixes.

| Prefix | Examples |
|--------|----------|
| `mechanism/` | `mechanism/cytokine`, `mechanism/cardiac`, `mechanism/hepatic` |
| `drug/` | `drug/car-t`, `drug/mab`, `drug/small-molecule` |
| `indication/` | `indication/DLBCL`, `indication/ALL`, `indication/MM` |
| `ae/` | `ae/cardiac`, `ae/hepatic`, `ae/cytokine`, `ae/neuro` |
| `severity/` | `severity/mild`, `severity/moderate`, `severity/serious`, `severity/fatal` |
| `signal/` | `signal/active`, `signal/closed`, `signal/under-review` |
| `study/` | `study/phase1`, `study/phase3`, `study/rwd`, `study/faers` |
| `status/` | `status/active`, `status/archived`, `status/draft`, `status/internal` |

Never use a tag not in this list without adding it to the list first.

## File naming

- Use lowercase with hyphens: `hepatotoxicity-DILI.md`, `tisagenlecleucel.md`
- For signals: `signal-<YYYY-MM>-<slug>.md`
- For studies: the NCT ID or a descriptive slug
- Spaces in filenames are allowed but discouraged

## Section ordering

Inside each page type, sections should follow the template order. The wiki doesn't enforce this, but consistency helps readers (and agents) scan quickly.

## Hard rules (summary)

1. Every page has YAML frontmatter with all required fields
2. Dates are ISO format
3. Internal references are wikilinks, not markdown links
4. Urgency and structure use callouts, not ALL-CAPS or bold prose
5. Tags use the documented hierarchy
6. Bump `updated` on every content change
7. Never include patient-level data
8. Never include internal compound code names unless the page is tagged `status/internal`
