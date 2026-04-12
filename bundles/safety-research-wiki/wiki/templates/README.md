# Wiki Templates

This folder holds the starter skeletons for every page type in the
pharmacovigilance / drug safety research wiki. Copy a template, rename
it, fill in the `<FILL>` placeholders, and commit the new page.

## What these templates are for

Each template enforces a consistent:

- YAML frontmatter schema (so pages are queryable with Dataview or
  equivalent tools)
- Set of section headings (so readers know where to find what)
- Wikilink convention (so Obsidian's graph view stays connected)
- Append-only history / decision log (so changes are auditable)

Keeping these stable matters more than keeping them pretty. If you need
a new section, add it and update the template in the same commit so the
schema drifts forward cleanly for everyone.

## How to copy a template into a new page

1. Pick the right template from the list below.
2. Copy it out of this folder, dropping the `.tmpl` suffix and renaming
   the file to the entity slug, e.g.
   `templates/drug.md.tmpl` -> `drugs/<generic-name>.md`.
3. Open the new file and:
   - Set every `<FILL>` placeholder, including inside the frontmatter.
   - Replace the `entity:` value with the filename (without extension).
   - Set `updated:` to today and `updated_by:` to your handle.
   - Remove any section you truly do not need, but prefer leaving a
     stub with `N/A` so the page layout stays predictable.
4. Run whatever link checker / frontmatter validator the wiki ships
   with before committing.
5. Commit with a message that names the entity, e.g.
   `add drug page: <generic-name>`.

## The five page types

Pick the type that matches the PRIMARY subject of the page. If a page
feels like it belongs to two types, it almost always means you need two
pages linked to each other.

### 1. `mechanism.md.tmpl`

Use for ONE biological or pharmacological mechanism. Examples of the
kind of thing a mechanism page covers: a signaling pathway, an enzyme
inhibition pattern, an ion-channel effect, an organ-level toxicity
process. Mechanism pages explain the biology; they do NOT track
individual products or events.

### 2. `drug.md.tmpl`

Use for ONE molecule / compound, covering both the generic name and
its brand names. Drug pages are the canonical entry point for everything
known about a specific product: indication, mechanism (linked out),
adverse events (linked out), REMS, labeling history, and open signals.

### 3. `adverse-event.md.tmpl`

Use for ONE adverse event or tightly clustered group of related events.
AE pages carry the definition, grading, and cross-product clinical
management guidance. Product-specific AE data lives on the relevant
drug page and study pages.

### 4. `signal.md.tmpl`

Use for ONE active or historical safety signal. A signal page is a
living document from intake through resolution. Its decision log is
append-only: do not rewrite history, add new entries at the bottom.

### 5. `study.md.tmpl`

Use for ONE clinical trial, observational study, registry analysis, or
postmarket surveillance dataset. Study pages are the evidentiary anchor
for signals and AEs: when you cite a number on a signal page, link
back to the study page that produced it.

## Conventions shared across all templates

- **Wikilinks:** use `[[target]]` and prefer linking to a canonical page
  over repeating content.
- **Callouts:** use Obsidian callout syntax (`> [!note]`, `> [!warning]`,
  `> [!danger]`, `> [!important]`, `> [!summary]`).
- **Tags:** hierarchical, lowercase, slash-separated, e.g.
  `mechanism/hepatic`, `severity/high`, `signal/monitoring`.
- **Dates:** ISO 8601 (`YYYY-MM-DD`) everywhere, including frontmatter.
- **History sections:** append-only. Newest entry goes at the top for
  page histories, at the bottom for signal decision logs. Each template
  marks which convention it uses.

## See also

- Main architecture doc: [[../architecture]]
- Skill definition: [[../SKILL]]
- Tagging cheat sheet: [[../tagging]]

If any of those links are red, the wiki has not been fully initialized
yet. Follow the bootstrap instructions in the bundle root.
