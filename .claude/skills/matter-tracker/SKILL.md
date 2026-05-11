---
name: matter-tracker
description: Use to open, update, close, or audit Sartor tax/legal/financial matters. A matter is an open position with facts, authority, risk grade, status, action items, deadlines, and cross-references. Lives at `sartor/memory/matters/{slug}.md`. Distinct from `family/active-todos.md` (household logistics) and `tasks/ACTIVE.md` (engineering work). Pairs with `tax-counsel` skill — tax-counsel produces analysis, matter-tracker persists the open position.
model: opus
---

# Matter Tracker

## Overview

A "matter" in this system is any open tax, legal, or financial-structuring position with future action attached. Examples: §163(h)(3) HELOC tracing, §721(b) investment-company risk on Anthropic shares contribution, §48 ITC track on solar, §469 material-participation hours documentation. These are NOT family logistics (which live in `family/active-todos.md`) and NOT engineering tasks (which live in `tasks/ACTIVE.md`).

The reason matters need their own home: they recur, have authority citations, have risk grades, and need explicit close-out. Stuffing them into a flat todo list loses the structure that makes them actionable.

**Announce at start:** "Operating matter-tracker."

## File location

Each matter is one file at `sartor/memory/matters/{slug}.md`. Slug is kebab-case: `heloc-163h3-tracing.md`, `solar-itc-48-vs-25d.md`, etc.

Index file at `sartor/memory/matters/INDEX.md` — auto-maintained by this skill on every open/close/update. Lists all matters with status, risk, priority, deadline.

## Matter file schema

```markdown
---
type: matter
matter: <slug>
status: open               # open | watching | closed | superseded
risk: high                 # low | medium | high
priority: p1               # p1 | p2 | p3
opened: 2026-05-08
updated: 2026-05-08
last_action: 2026-05-08
deadline: 2026-10-15       # ISO date if any
authority: [IRC-163h3, Reg-1.163-10T, Notice-88-74]
related: [reference_heloc, TAXES, ALTON]
---

# Matter: <descriptive title>

## Issue

One sentence. What's the open question?

## Facts

Bullet list of the load-bearing facts. Cross-link to memory wiki where each fact lives.
Flag any fact that's both load-bearing AND uncertain with `> [!warning]`.

## Authority

The controlling IRC sections, regs, guidance. If grey, name competing readings.

## Analysis

Working analysis. Updated as facts evolve. Use append-only where possible — preserve the audit trail.

## Position

The current position with risk grade. Updated as analysis evolves.

## Action items

- [ ] Specific action with owner and target date
- [ ] ...

## CPA / counsel routing

What needs to go to Jonathan Francis (or other counsel) and how.

## History

- 2026-05-08: opened. Initial analysis. Position: HIGH risk pending fact-pattern reconstruction.
- ...

## Resolution

(Filled in only on close-out.) What was the final position. What was filed. What changed.
```

## Operations

### Open a new matter

When invoked with "open a matter on X":

1. Generate slug from issue
2. Check `INDEX.md` for duplicate (slug or near-match)
3. Run `tax-counsel` skill in parallel if the matter is tax-flavored — get IRAC analysis
4. Write the matter file with frontmatter + issue + facts + authority + initial position
5. Append to `INDEX.md` table
6. Cross-link from any relevant memory file (TAXES.md, BUSINESS.md, etc.) — leave a `> [!matter]` callout pointing to the matter file
7. If deadline exists, optionally surface to `family/active-todos.md` or Google Tasks via `todo-sync`

### Update a matter

When new facts emerge or analysis shifts:

1. Read existing matter file
2. Append to `## Analysis` section (don't rewrite — preserve audit trail)
3. Bump `updated:` and `last_action:` frontmatter
4. If risk grade changes, update both frontmatter AND `## Position`
5. Add a `## History` entry
6. Update `INDEX.md` if status/risk/priority/deadline changed

### Close a matter

When the question is resolved:

1. Set `status: closed` in frontmatter
2. Fill in `## Resolution` section
3. Add closing `## History` entry with date + final disposition
4. Update `INDEX.md` — keep the closed matter visible for one quarter, then archive
5. Remove the `> [!matter]` callouts from related memory files

### Audit all matters

When invoked with "audit matters" or as part of a quarterly review:

1. Read every matter file
2. Flag matters where:
   - `last_action` > 60 days ago AND `status: open` (stale)
   - `deadline` is within 30 days
   - `risk: high` AND no recent action
   - Authority cites are sparse (likely incomplete)
3. Produce a one-screen summary

## INDEX.md format

```markdown
---
type: meta
entity: matters-index
updated: 2026-05-08
---

# Matters Index

Open tax, legal, and financial-structuring matters for the Sartor household. Each matter lives in `matters/{slug}.md`.

## Open — high priority

| Slug | Matter | Risk | Deadline | Last action |
|---|---|---|---|---|
| [heloc-163h3-tracing](heloc-163h3-tracing.md) | §163(h)(3) HELOC use-of-proceeds tracing | HIGH | 2026-10-15 | 2026-05-08 |
| ... | ... | ... | ... | ... |

## Open — medium priority

| ... |

## Watching

| ... |

## Closed (last quarter)

| ... |
```

## Conventions

- **One matter per file.** Don't bundle. The §721(b) Anthropic-shares-contribution question is a different matter from §1411 NIIT on covered-call closes.
- **Cross-reference, don't duplicate.** If a fact lives in `reference_heloc.md`, link to it; don't restate.
- **Authority is canonical.** Always cite IRC section, regulation, guidance. "I think this is taxable" without authority is not a position.
- **Risk grade is the headline.** Frontmatter `risk:` field drives the index sort.
- **Deadline is the action driver.** No deadline → no urgency. If you don't know the deadline, write `deadline: unknown` and add an action item to find out.
- **History is append-only.** Never rewrite history entries. The audit trail matters under exam.
- **Close-out discipline.** When a matter resolves, fill in `## Resolution` with what was actually filed/done. Future-Alton (or future-CPA, or future-auditor) needs to reconstruct what happened.

## When NOT to use this

- **Family logistics** → `family/active-todos.md`
- **Engineering tasks** → `tasks/ACTIVE.md`
- **One-off CPA questions with no future action** → just send the email, log in `daily/`
- **GPU operations / vast.ai issues** → `inbox/gpuserver1/`

## Coordination with other skills

- `tax-counsel` — produces the IRAC analysis that seeds a matter
- `alton-voice` — drafts external communications referencing a matter
- `tax-estimate` — runs scenarios that may close-out or update a matter
- `task-review` — handles Google Tasks; matter-tracker can sync deadlines via `todo-sync`

## Output

When opening or updating a matter, end with:

```
Matter <slug> [opened|updated|closed]. Status: <status>, risk: <risk>.
INDEX.md updated.
[Action items list]
```
