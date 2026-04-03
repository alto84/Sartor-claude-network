# Task System — Sartor Agent Network

## Structure

Three tiers of progressive disclosure:

1. **Task files** (this folder) — what needs doing and when
2. **work/** folders — context, notes, and status for each domain
3. **work/*/reference/** — deep context: documents, rules, research

## Files

### TODAY.md
Daily checklist. Refreshed each morning by the `/morning` command. Tasks are checkbox items with hyperlinks to context.

Sections:
- **Urgent** — deadline within 7 days or time-sensitive
- **This Week** — active items without immediate deadline
- **Completed** — checked off today
- **Log** — session notes and significant actions

At end of day, archive to `archive/YYYY-MM-DD.md`.

### ACTIVE.md
Ongoing work streams across all domains. Each item links to its `work/` folder. Updated as work progresses. Does not reset daily.

### BACKLOG.md
Future and deferred items. Things we know about but are not acting on. Promoted to ACTIVE when the time is right.

### archive/
Old daily logs. Moved here at end of day or week.

## Task Entry Pattern

```markdown
- [ ] Task description — [context](../work/domain/file.md) | [deadline info]
```

For items with multiple context links:
```markdown
- [ ] Task description — [primary context](../work/domain/file.md) | [reference](../work/domain/reference/doc.md)
```

## MERIDIAN Integration

The dashboard at localhost:5055 reads `tasks/TODAY.md` via `/api/daily-tasks`.

## Domain Folders in work/

| Folder | Contents |
|--------|----------|
| `work/family/` | School, medical, household logistics |
| `work/taxes/` | Personal, LLC, and nonprofit tax work |
| `work/solar-inference/` | vast.ai ops, solar roof, WiFi upgrade |
| `work/costco/` | Household purchasing |
