---
type: proposal
to: Alton
from: rocinante-claude (system-uplift purge pass)
date: 2026-06-09
re: CLAUDE.md amendments required by the 2026-06-09 purge + verified review
---

# CLAUDE.md amendment proposal (uplift D-A)

CLAUDE.md changes require your explicit approval, so the purge pass did not
touch it. These rows are now stale or were already fiction per the verified
review (54 findings, `projects/system-uplift-2026-06/GOAL.md`):

## 1. Sartor Infrastructure table
- **Cost tracker | `sartor/costs.py`** — archived 2026-06-09 to
  `archive/sartor-dead-code-2026-06/` (costs.json untouched since April;
  dashboard reads the JSON directly). Strike the row or repoint to the JSON.

## 2. Scheduled Tasks table — runnerless entries (never executed; heartbeat
spine that dispatched them died 2026-05-02 and is now archived)
- `daily-household-health` — zero reports ever produced. KEEP the row but it
  needs a real runner (uplift C6, recommended: thin `claude -p` wrapper per
  the morning-briefing pattern). Until then the table overstates safety.
- `todo-sync`, `market-close-summary`, `weekly-financial-summary`,
  `weekly-nonprofit-review` — no runner, no output. Strike or revive (your
  call per entry).
- Renamed-but-live entries worth truing up: nightly-memory-curation actually
  runs as SartorCuratorPass; improvement loop as SartorImprovementLoop;
  gmail as SartorGmailScan (which has never successfully fetched mail — C10).
- `Sartor Memory Mirror` — actual trigger is daily 03:30, not "every 15
  minutes" as documented.

## 3. Inventory drift (additive)
- Agents table: add `wiki-reader`.
- Skills table: add `computer-control`, `goal`, `untrusted-repo-intake`.
- Commands: add `peer-send`.
- Infrastructure: add gpuserver2 stanza when it goes live (bringup in
  progress per inbox LOG).

## 4. References to archived material
- Any remaining mention of the Dec-2025 platform paths (root `src/`,
  `claude-network/`, root `skills/`/`commands/`) should point to
  `archive/memory-system-2025-12/`.

Reply with approvals per item (or "all") and I'll apply them as one commit.
