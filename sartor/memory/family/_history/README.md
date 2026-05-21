---
type: meta
tags: [domain/family, family/ref, meta/archive]
---

# family/_history/ — archive directory

Per `sartor/memory/family/CONVENTIONS.md`, this directory holds the **archive layer** of the Facts → Calendar → Audit schema:

- **Closed events** — past trips, past sole-parent windows, past school years
- **Drained gather-run accretions** from kid pages (`gather-runs-YYYY-MM/{kid}.md`)
- **Resolved active-todo items** older than 7 days (per the proposed schema in `projects/family-wiki-audit-2026-05-20.md`)

## Archive discipline

Files moved here SHOULD:
- Carry their original frontmatter + a new `archived: YYYY-MM-DD` field
- Stay LinkedIn (other docs may still `[[]]`-reference them)
- Be considered immutable — corrections happen in a successor file with a `supersedes:` field

## Directory created

2026-05-20 — during the post-fuseblow audit at `projects/family-wiki-audit-2026-05-20.md`. The directory was referenced throughout CONVENTIONS but had never actually been created; INDEX/wiki tooling expected it to exist.

## First items to migrate (P0 from audit)

- `family/sole-parent-window-2026-04-29.md` (window closed 2026-05-03)
