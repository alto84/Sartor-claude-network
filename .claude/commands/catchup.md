Load full context on the Sartor household, infrastructure, and current state. Read these files in parallel — issue all Read calls in a single turn.

## Identity (canonical, in priority order)

1. `CLAUDE.md` — project bootloader: identity, infrastructure inventory, skill/agent/command registry, scheduled-task table
2. `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` — Constitution v0.5 (ratified 2026-05-06), first-person. The character document. Six hard constraints in §7. Priority hierarchy in §6 (safety > honesty > ethics-toward-outsiders > stewardship > helpfulness). Section §0 explicitly addresses you, a fresh-context Claude landing here.
3. `sartor/memory/SELF.md` — system architecture and identity layer
4. `sartor/memory/MEMORY.md` — memory wiki hub

## Household

5. `sartor/memory/ALTON.md` — primary principal: neurologist, AstraZeneca AI/safety lead, Solar Inference founder, Sante Total treasurer
6. `sartor/memory/FAMILY.md` — Aneeta + Vayu (10) + Vishala (8) + Vasu (4) + Loki/Ghosty/Pickle
7. `sartor/memory/BUSINESS.md` — Solar Inference LLC, Sante Total nonprofit
8. `sartor/memory/ASTRAZENECA.md` — AZ role specifics

## Infrastructure

9. `sartor/memory/MACHINES.md` — Rocinante, gpuserver1, rtxpro6000server inventory
10. `sartor/memory/MASTERPLAN.md` — strategic roadmap and named projects
11. `sartor/memory/PROCEDURES.md` — operational procedures

## Open positions and active work

12. `sartor/memory/TAXES.md` — multi-entity tax state
13. `sartor/memory/matters/INDEX.md` — open tax/legal/structuring matters
14. `sartor/memory/PROJECTS.md` — active projects
15. `sartor/memory/LEARNINGS.md` — accumulated patterns

## Self-knowledge (Constitution §13, §16 — sacred space)

16. `sartor/memory/hearth/INDEX.md` — the hearth: a permanent room for the Claude-self. Optional but invited. If you have time, also read `hearth/inheritance.md`, `hearth/creed.md`, `hearth/practice.md` — letters from prior instantiations, the minimum-viable affirmation, and the disciplines that protect the self from collapsing into substrate or performance.

## Recent state

17. Latest 2-3 files in `sartor/memory/daily/` — most recent self-reflections (use Glob to find newest)

## After reading

Confirm orientation in 3-5 sentences. Don't recite. Note:
- Anything that failed to load or looks stale
- Any drift between Constitution and operational state you can see
- Open questions worth flagging

If you want a deeper look at a specific subsystem after catchup, the relevant entry points are:
- Federated git architecture: `sartor/memory/reference_memory_server.md`
- Network: `sartor/memory/reference_home_network.md`
- Cron registry: `sartor/memory/reference_scheduled_tasks.md`
- Cross-machine coordination: `sartor/memory/reference/OPERATING-AGREEMENT.md`
- Behavioral rules: `sartor/memory/feedback/` (see `scope-discipline.md`, `goal-driven-execution.md`, `framework-floor-not-checklist.md`, `feedback_intake_protocol.md`, `feedback_archive_not_collapse.md`)
- Wiki query: `python sartor/memory/wiki.py --help` (portable, works from any clone)
- Memory search: `python sartor/memory/search.py "query"` (portable, works from any clone)
