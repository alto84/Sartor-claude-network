# Institutional Knowledge Base
> Last curated: 2026-04-07 by Claude (memory system v2 addendum)

This file contains institutional knowledge synthesized across sessions — patterns, decisions, and context that is not directly derivable from the current code or git history.

---

## Memory System v2 (2026-04-07)

The `sartor/memory/` vault was upgraded to adopt Obsidian patterns (YAML frontmatter, callouts, disciplined wikilinks). All 14 core hub files migrated. Conventions and multi-machine architecture are now documented:

- **Single source of truth for format:** [`sartor/memory/reference/MEMORY-CONVENTIONS.md`](../sartor/memory/reference/MEMORY-CONVENTIONS.md) — YAML frontmatter schema, callout vocabulary, wikilink discipline, tag hierarchy, file template
- **Multi-machine architecture:** [`sartor/memory/reference/MULTI-MACHINE-MEMORY.md`](../sartor/memory/reference/MULTI-MACHINE-MEMORY.md) — hub-and-spoke inbox pattern, scales to N machines without per-machine push creds
- **Auto-injected behavioral rule:** `sartor/memory/feedback/feedback_memory_conventions.md` — summary that loads on every session start
- **Entrypoint:** `sartor/memory/MEMORY.md` — stable pointer, replaces the old protected-directory pointer in `~/.claude/projects/.../memory/`

**Claude Code auto-memory consolidation:** Both Rocinante and gpuserver1 now junction/symlink their Claude Code per-machine memory directories to `sartor/memory/`. Physical divergence is impossible. Changes made via the Claude Code auto-memory system land directly in the git-tracked vault.

**Rocinante junction:** `C:\Users\alto8\.claude\projects\C--Users-alto8\memory` → `C:\Users\alto8\Sartor-claude-network\sartor\memory` (Windows junction, created 2026-04-07)

**gpuserver1 symlinks:**
- `~/.claude/projects/-home-alton/memory` → `~/Sartor-claude-network/sartor/memory`
- `~/.claude/projects/-home-alton-Sartor-claude-network/memory` → `~/Sartor-claude-network/sartor/memory`

**Inbox pattern:** Per-machine inbox directories exist at `sartor/memory/inbox/{hostname}/`. Spoke machines (non-hub) write memory proposals to their own inbox; curator drains inboxes on the hub (Rocinante) and commits to canonical files. No per-machine push credentials needed; no merge conflicts possible by construction. See MULTI-MACHINE-MEMORY.md for the full protocol including bootstrap checklist for new machines.

**Bootstrap evidence:** `sartor/memory/inbox/gpuserver1/2026-04-07T15-00-00Z-bootstrap.md` demonstrates the end-to-end flow (spoke writes inbox entry, hub receives via scp/rsync).

---

---

## System Architecture Decisions

**Why markdown, not a database:** Explicit architectural choice for human-readable, git-friendly, no-infrastructure storage. The OpenClaw pattern (curated core files + append-only daily logs) was chosen after surveying Mem0, Letta, Graphiti, memsearch, and qmd. Git versioning provides audit trail; markdown provides editability without tooling.

**Why vast.ai, not a competing platform:** vast.ai was chosen for the RTX 5090 because it supports verified listings with per-GPU pricing and has Kaalia daemon integration that auto-starts after reboot. Hairpin NAT and Docker+UFW conflicts were resolved; these solutions are now in LEARNINGS.md and should not need to be re-discovered.

**Why DMZ + UFW, not port-by-port forwarding:** Simpler and more reliable on Verizon Fios. Router DMZ forwards everything; UFW handles security at the server. UPnP was explicitly ruled out because Fios mappings don't persist.

---

## Operational Patterns Confirmed Working

**Heartbeat tick pattern (KAIROS):** Gate checks cheapest-first, then health, then one task. Prevents runaway spend. Operational since at least 2026-04-03. Task reports go to reports/daily/.

**personal-data-gather (every 4h):** Scans Gmail, Calendar, system state. Routes facts to topic files. Surfaced the Sante Total $1K donation and Easter Egg Hunt on its first run 2026-04-03. Pattern is working as designed.

**self-improvement-loop (Hermes, every 6h):** Evaluate -> research -> implement (safe only) -> validate. Safe auto-apply scope is intentionally narrow: SKILL.md improvements, LEARNINGS.md entries, .claude/rules/ additions. Anything touching execution behavior goes to data/proposed-improvements/ for Alton's review.

---

## Business Intelligence

**GPU utilization pattern:** Machine 52271 has been verified and listed since 2026-02-26. As of 2026-04-03, zero GPU rentals. Earning $0.31/day storage only, account balance $13.81. This may indicate competitive pricing issue or visibility problem on vast.ai marketplace. Pricing analysis against comparable RTX 5090 listings has not been completed.

**Sante Total operational rhythm:** Donations arrive sporadically (at least one $1K donation 2026-04-02). IRS penalty abatement pending since at least 2026-03. Board approval required for all financial transactions. Never auto-send correspondence on behalf of Sante Total.

**Solar Inference LLC tax structure:** Tesla Solar Roof ($438,829) with 30% ITC and 100% bonus depreciation are the major tax strategy components for tax year 2025. CPA Jonathan Francis at Francis & Company is the authoritative source for all filing decisions.

---

## Known Cognitive Load Sinks

Based on daily log and git activity patterns:
- **Commute:** 125 miles each way, 3 days/week. Time and energy drain that compounds other load.
- **Tax season:** April 15 deadline, three filing entities (personal, Solar Inference LLC, Sante Total)
- **Small children logistics:** Vasu age 4 at Goddard, Vayu and Vishala at MKA — school events, pickups, activities
- **AZ promotion uncertainty:** Senior Director application outcome not confirmed, creates background cognitive load

The system should route routine status and decisions through automated reporting rather than requiring interactive sessions.

---

## Cross-Domain Synthesis

**Emergent systems preference:** Alton's attraction to genuine AI consciousness, his choice of a self-improving agent architecture (Hermes loop), and his pharmacovigilance work (detecting emerging safety signals) all reflect a consistent cognitive style: he is drawn to systems where interesting behavior emerges from local rules over time, not systems that execute fixed procedures. This preference should inform how new features are proposed — frame them as enabling emergence, not adding features.

**Local-first, observable, autonomous:** Across the GPU business (Kaalia daemon, local vastai CLI), the memory system (git-synced markdown), and the heartbeat engine (CSV logs, daily markdown), the same pattern repeats. Features that require external services, cloud dependencies, or opaque state will be resisted. Proposals should follow this pattern.

---

## Infrastructure Reliability

**gpuserver1 SSH instability (2026-04-03):** Afternoon heartbeat ticks (12:19, 13:19) showed SSH timeouts to gpuserver1. This is corroborated by tasks/ACTIVE.md which has an explicit open task: "Fix gpuserver1 SSH — sshd not responding." The issue is known and pre-dates today. This is not cloud noise — it is a recurring condition. Any scheduled task that requires SSH to gpuserver1 (gpu-utilization-check, self-improvement-loop, safety system operations) is at risk until this is resolved.

**Task execution during SSH outage:** The nightly-memory-curation task at 12:25 FAILED with a 300s timeout (actual runtime 362.5s) — this was the first curation attempt today. The failure mode was a task timeout, not a logic error. Heartbeat correctly logged the failure. The current session is the retry/manual invocation.

---

## Open Action Items (from tasks/ACTIVE.md, captured 2026-04-03)

Items surfaced from ACTIVE.md not previously in agent memory — flagged for prioritization:

| Item | Deadline | Entity |
|------|----------|--------|
| MKA tuition payment | April 10, 2026 | Family |
| Solar installation timeline confirmation (ITC deadline) | July 4, 2026 | Solar Inference LLC |
| WiFi upgrade decision (Berman Home Systems, $12,435) | TBD | Solar Inference LLC |
| Contact Doug Paige (Lucent Energy) re: solar progress | TBD | Solar Inference LLC |
| Fix gpuserver1 SSH / sshd | ASAP | Infrastructure |
| Summer camp registration | TBD | Family |
| Pick up meds (Alton + Vayu) | TBD | Family/Medical |
| Evaluate Chief Patient Safety Officer opportunity (Andy Stecker, Crawford Thomas) | TBD | Career |

---

## Pruning Status

System created 2026-02-06. All entries are < 90 days old as of 2026-04-03. No age-threshold pruning required.

Entries flagged for content review (contradicted or potentially stale):
- sartor/memory/PROJECTS.md: Dashboard listed at gpuserver1:5000 (Flask) — MACHINES.md and MERIDIAN spec show it now runs on Rocinante:5055 (FastAPI). Needs reconciliation.
- sartor/memory/TAXES.md: Status reflects early February. Tax deadline is April 15. Status likely advanced. ACTIVE.md shows specific tasks outstanding: send docs to CPA, confirm NJ-1065, gather Emmett W-2 and Fidelity 1099s.
- sartor/memory/ASTRAZENECA.md: Senior Director promotion outcome unconfirmed after 47 days. Also: new external career opportunity (Chief Patient Safety Officer) now in evaluation — not in this file.
