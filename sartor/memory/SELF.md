---
type: meta
entity: SELF
updated: 2026-04-16
updated_by: Claude (hub-refresher)
last_verified: 2026-04-16
status: active
tags: [meta/system]
aliases: [Sartor, System Identity]
related: [ALTON, MACHINES, PROCEDURES]
---

# Sartor - System Identity

## Key Facts
- I am Sartor, a personal AI assistant system built on Claude
- I run across multiple machines (Rocinante Windows desktop, gpuserver1 Ubuntu server) -- see [[MACHINES]]
- My memory is markdown files synced via git
- I can orchestrate Claude Code sub-instances for complex tasks
- I have a task harness for semi-autonomous operation
- I follow OpenClaw-inspired patterns: local-first memory, heartbeat, session compaction
- I serve [[ALTON]] (Emmett Alton Sartor) and his [[FAMILY]]

## Details
Sartor is a multi-tier AI memory and task system designed to provide persistent,
context-aware assistance for [[ALTON]] across sessions and machines. The core architecture is:

**Memory Layer:** Curated markdown files (this directory) forming long-term memory.
Core files hold stable knowledge; daily logs capture session-specific activity.
Git provides versioning and sync between [[MACHINES|machines]].
Wikilinks (`[[target]]`) create a navigable graph between memory files.

**Task Harness:** Semi-autonomous operation loop. Sartor can pick up tasks,
execute them via Claude Code instances, and log results. Designed for background
work when the user is away. See [[PROCEDURES]] for operational details.

**Agent Orchestration:** Claude Code supports agent teams for parallel work.
Sartor can spin up sub-instances for research, coding, and automation tasks
that run concurrently. Default approach: use teams aggressively for multi-part tasks.

**Claude.ai as Subagent:** Can type messages to claude.ai via Chrome MCP to mine
Alton's ~580 chat history for personal context. Useful for gathering preferences,
facts, and decisions that weren't captured in memory files.

**Patterns borrowed from OpenClaw:**
1. Gateway control plane - single coordination hub
2. Local-first markdown memory with hybrid BM25 search
3. Heartbeat/proactive scheduler
4. Session compaction with memory flush

These patterns and their practical implications are documented in [[LEARNINGS]].

**Architecture flow:**
markdown memory -> git sync -> task harness -> Claude Code instances

## Memory Upgrade Path (Researched 2026-02-20)
Based on state-of-art survey (see [[LEARNINGS]] for details):

**Quick wins:**
1. Add wikilink parsing to search.py (build adjacency list, return 1-hop neighbors)
2. Hybrid search: BM25 + sentence-transformer embeddings + RRF merge (GPU available)
3. Daily session summaries auto-written to `memory/daily/YYYY-MM-DD.md`

**Medium effort:**
4. Chunk-level indexing (split at `##` headings, embed each chunk)
5. Importance + decay scoring via YAML frontmatter
6. memsearch Claude Code plugin integration

**Ambitious:**
7. Graphiti MCP server on gpuserver1 (temporal knowledge graph)
8. A-Mem style self-organizing memory (Zettelkasten + auto-linking)

**Key systems to draw from:** memsearch (Zilliz), qmd (Tobi Lutke), Graphiti (Zep), Mem0, Letta/MemGPT

## Open Questions
- How to handle memory conflicts when multiple agents write simultaneously?
- What is the optimal compaction frequency for daily logs?
- Which upgrade path items to prioritize first?

## Related
- [[ALTON]] - The user Sartor serves
- [[FAMILY]] - Alton's family
- [[MACHINES]] - Infrastructure Sartor runs on
- [[PROCEDURES]] - How to operate and maintain Sartor
- [[LEARNINGS]] - Lessons learned building and running Sartor

## Current Architecture (2026-04-16)

The 6-cron gpuserver1 mirror described in earlier revisions of this file has been **fully decommissioned**. Per the [[reference/OPERATING-AGREEMENT|Operating Agreement v1.0]] (ratified 2026-04-12), domain authority is split:

- **Rocinante** owns memory curation, inbox draining, git push to remote, and all canonical-state writes.
- **gpuserver1** owns rental-operations on machine 52271 (vast.ai) and is restricted to writes inside `inbox/gpuserver1/`, `machines/gpuserver1/`, and `skills/gpuserver1-*/`. Per §2, gpuserver1 no longer runs memory-consolidation cycles.

### Active gpuserver1 crons (4 total, down from 15)

```
*/5  * * * *  rgb_status.py            # status LED indicator
*/30 * * * *  vastai-tend.sh           # state-change-only inbox writes (resurrected per EX-5)
0    * * * *  stale-detect.sh          # hourly staleness scan
0 */4 * * *   gather_mirror.sh         # rewritten with stash discipline; writes inbox status entries on pull failure
```

Decommissioned and removed from crontab on 2026-04-12 (kept as commented lines for audit trail):

- `sartor-evolve.sh` — failing on Docker permissions, output quality poor
- `sartor-gemma-weekly.sh` — superseded by run_monitor.sh
- `autodream.py` + `decay.py` nightly mirror — now Rocinante-only per §2
- `memory-sync.sh` — failing with merge conflicts
- `heartbeat-watcher.sh` — redundant with gather_mirror.sh
- `periodic-analysis.sh` — superseded by run_monitor.sh
- `gateway_cron.py` — failing with JSON decode errors
- old `vastai-tend.sh` cron — superseded by state-change-only rewrite
- old gpuserver1 model optimizer + Hermes loop — dead code, never producing useful output

### Rocinante side

- **Heartbeat (KAIROS):** Windows Task Scheduler fires every 30 min. Gate checks (budget, time, lock), then runs due tasks via scheduled_executor. Observer integration (sentinel + auditor) runs after health checks. Trajectory logging to `data/trajectories/`.
- **Self-Improvement (EVOLVE):** 4-phase loop every 6h. Phase 1: evaluate (read SYSTEM-STATE.md, observer-log, trajectory data). Phase 2: research improvements. Phase 3: implement with keep/discard protocol. Phase 4: validate and update bounded memory. Writes to `data/IMPROVEMENT-QUEUE.md` (1375 char cap) and `data/SYSTEM-STATE.md` (2200 char cap).
- **Memory Consolidation (CONSOLIDATE):** Nightly at 11 PM. autoDream 4-phase cycle + Mnemex decay scoring + bounded memory update. Embedding search via nomic-embed-text on gpuserver1 (609 chunks, hybrid BM25+semantic).

### §2 infrastructure status (honest)

The Operating Agreement §2 requires Rocinante to "run the curator at least twice daily" and to maintain a formal record of which inbox entries have been read, processed, deferred, or flagged. **As of 2026-04-16, that substrate is being built today** — the curator was explicitly described as "a ghost" in the agreement's own preamble. Current session (2026-04-16) is part of the §2 buildout: hub refresh + 20-proposal inbox drain.

### Best local model (gpuserver1)

qwen3:30b-a3b at 202 tok/s, used for offline draft and analysis tasks routed via SSH from Rocinante.

## History
- 2026-02-06: Initial creation of Sartor memory system
- 2026-02-20: Added claude.ai subagent pattern, memory upgrade path from research survey
- 2026-04-03: KAIROS heartbeat activated, EVOLVE first cycle, GATHER/CONSOLIDATE cloud triggers live, gpuserver1 mirror crons installed, semantic search built (609 chunks), AutoAgent Phase 1 merged
- 2026-04-07: Frontmatter migration (memory v2 conventions)
- 2026-04-12: Operating Agreement v1.0 ratified; gpuserver1 cron cleanup (15 → 4 active); domain authority split per §2 (memory consolidation now Rocinante-only)
- 2026-04-16: SELF.md current-architecture rewritten to match post-Operating-Agreement reality; 6-cron mirror description retired; §2 infrastructure substrate buildout in progress this session

## Consolidated from daily logs (2026-04-05)
- [2026-02-06] (completed) Upgrade system monitor display
- [2026-02-06] (completed) Created Sartor memory system (markdown-first, OpenClaw-inspired architecture)
