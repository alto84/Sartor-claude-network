# Sartor Claude Network

The Sartor household's autonomous agent system. A Claude Code-based home agent
operating from Rocinante (Windows workstation, Montclair NJ) with peer Claude
instances on two Ubuntu GPU servers, managing five domains:

1. **GPU hosting business** — Solar Inference LLC, vast.ai fleet (gpuserver1,
   rtxpro6000server), autonomous bounded repricing, fleet watchdog
2. **Nonprofit administration** — Sante Total Inc. (501(c)(3)) compliance and
   deadline tracking
3. **Family operations** — calendar, school logistics, travel, household
4. **Financial research** — LLC books, tax estimates, portfolio analysis
5. **Personal research** — AI architecture, consciousness studies, persona
   engineering

## Orientation

| What | Where |
|------|-------|
| Agent constitution / operating rules | `CLAUDE.md` (bootloader) + `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` (canonical) |
| Structured memory | `sartor/memory/` (INDEX.md is the map; wiki-indexed nightly) |
| Live Python spine | `sartor/` (curator_pass, morning_briefing, improvement_loop, conversation_extract, staleness) |
| Fleet code (money-touching) | `scripts/fleet/` + `scripts/fleet-watchdog.py` |
| Windows scheduled-task scripts | `scripts/win-tasks/` |
| Agents / skills / commands | `.claude/agents/`, `.claude/skills/`, `.claude/commands/` |
| Dashboard (MERIDIAN, FastAPI) | `dashboard/family/server.py` |
| Machine registry | `sartor/memory/machines/REGISTRY.yaml` |
| Current uplift plan | `sartor/memory/projects/system-uplift-2026-06/GOAL.md` |

## Git topology

Canonical remote is the bare repo on rtxserver
(`alton@rtxserver:/home/alton/sartor-git/Sartor-claude-network.git`).
GitHub is a disaster-recovery mirror written only by Rocinante's scheduled
mirror task — peers never push to GitHub. Full architecture:
`sartor/memory/reference_memory_server.md`.

## History

This repo previously hosted a multi-tier AI memory-system platform
(TypeScript/Firebase, Dec 2025). That platform is retired; its code lives at
`archive/memory-system-2025-12/` with a manifest. Other retired material is
under `archive/` generally — archived, not deleted, so history stays
inspectable.
