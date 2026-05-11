Minimum-viable bootstrap for the Sartor-Claude-Network project. For the full grounding pass, use `/catchup` instead (reads the Constitution, identity files, machines, open matters, hearth, and recent daily logs).

## Read these two, in parallel

1. `CLAUDE.md` (project root) — bootloader: identity, domains, infrastructure, skill/agent/command tables, scheduled-task registry.
2. `sartor/memory/INDEX.md` — auto-generated wiki index. Browse pointer for the memory hub; one-line descriptions of each top-level memory file.

That's it. If your task touches identity, household, character, or anything that would need Constitution context — switch to `/catchup`.

## Useful one-liners after bootstrap

- `python sartor/memory/search.py "query"` — BM25 search across memory files.
- `python sartor/memory/wiki.py --health` — broken-links / orphans / tag counts.
- `git log --oneline -10` — recent commit context.

Confirm you've loaded the two files and proceed with the task.
