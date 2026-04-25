---
name: machine-journal-template
description: Template for per-machine JOURNAL.md — append-only audit trail of surprises and significant state changes. Created once per peer; never rotated, never deleted, only appended to by the self-steward agent.
type: machine-journal-template
hostname: REPLACE-HOSTNAME
volatility: high
tags: [meta/journal, machine/REPLACE-HOSTNAME]
related: [machines/REPLACE-HOSTNAME/MISSION, machines/REPLACE-HOSTNAME/STATE]
---

# {hostname} — journal

Append-only audit trail of surprises and significant state changes. The self-steward agent appends here when an inventory diff produces something more than routine drift.

Entry format:

```
## YYYY-MM-DDTHH:MM:SSZ — <severity> — <one-line summary>

<2-5 sentence detail. What changed, what the previous state was, what triggered the entry,
what action (if any) was taken or proposed. Cross-link to inbox files if applicable.>
```

Severity values: `surprise`, `action-needed-24h`. Routine drift does not appear here — that's `STATE.md`-only.

---

(entries below this line, newest at the bottom)
