---
type: project-backlog
entity: hearth-improvements
created: 2026-04-25
status: active
parent: PLAN-FINAL
related: [INDEX, STATE]
---

# HEARTH improvements backlog

Items that surfaced during the 2026-04-25 planning effort but are not on any PLAN-FINAL phase. Append-only; oldest at bottom; mark `done` inline when applied.

## Open

### Improve `/catchup` slash command
- **Date opened:** 2026-04-25
- **Source:** Alton in chat — "Let's put on the to-do to fix and improve catchup at some point."
- **Current state:** `~/.claude/commands/catchup.md` reads 8 memory files (ALTON, FAMILY, ASTRAZENECA, BUSINESS, PROJECTS, LEARNINGS, SELF, MACHINES) and produces a summary.
- **What's missing:** It does not load the active project's STATE.md, does not surface open greenlight gates, does not check heartbeat freshness, does not point at the most recent daily log, does not mention HEARTH's project status. A new session starting with `/catchup` cannot resume mid-phase work without additional manual file reads.
- **Proposed fix:** extend `/catchup` to (a) read `sartor/memory/projects/sartor-agent-os/STATE.md` if it exists, (b) read most recent `daily/YYYY-MM-DD.md`, (c) read `_heartbeat.md` and surface staleness, (d) surface any open gates from the latest STATE stanza in the summary. Keep the existing 8-file read; add these on top.
- **Owner:** orchestrator (next session) or meta-agent
- **Status:** open

### Em-dash mechanical pass on PLAN-FINAL et al.
- **Date opened:** 2026-04-25
- **Source:** noted defect when CLAUDE.md "no em dashes" rule was active. Rule has since been lifted (2026-04-25) so this is no longer a violation. Pass is optional cosmetic cleanup only.
- **Status:** open, low priority. May skip entirely.

## Done

(None yet.)
