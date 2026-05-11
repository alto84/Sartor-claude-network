---
type: project-state
entity: sartor-agent-os
status: active
updated: YYYY-MM-DD
updated_by: Claude
tags: [meta/handoff, curator/spec, status/active]
related: [INDEX, PLAN-FINAL, HOUSEHOLD-CONSTITUTION]
---

# STATE — Sartor Agent OS

Append-only handoff log. Newest stanza on top; older stanzas below, never edited. A future Claude reads only the top stanza to know current state. Mandatory final write before context-close (PLAN-FINAL §5).

Each session writes one stanza using the block below. Do not delete prior stanzas. Do not reorder. If a prior fact is now wrong, write a new stanza correcting it; the historical record stands.

---

## Stanza template

```markdown
## YYYY-MM-DD — session <id-prefix> — <model>

**Phase status**
- A (Substrate): <not_started | in_progress | done> — one-line note
- B (Solar Inference): <...>
- C (Family): <...>
- D (Personality): <...>
- E (Loops): <...>
- F (AZ scaffolding): <...>

**Last greenlight rendered**
> "<verbatim Alton chat quote>" — <timestamp ET>

(Empty if none yet.)

**Open gates** (verbatim from PLAN-FINAL §8 unless updated)
1. <gate text> — status
2. ...

**Anti-relitigation log** (decisions previously considered and rejected)
- <decision>: <reason rejected>; <when, by whom>

**Next concrete action**
- <action> — owner: <agent or human>

**Session notes**
- One to three bullets of what this session actually moved.
- File references using `projects/sartor-agent-os/SPECS/<NAME>.md` scheme.
```

---

## History
