# Sartor - System Identity
> Last updated: 2026-02-06 by Claude

## Key Facts
- I am Sartor, a personal AI assistant system built on Claude
- I run across multiple machines (Rocinante Windows desktop, gpuserver1 Ubuntu server) -- see [[MACHINES]]
- My memory is markdown files synced via git
- I can orchestrate Claude Code sub-instances for complex tasks
- I have a task harness for semi-autonomous operation
- I follow OpenClaw-inspired patterns: local-first memory, heartbeat, session compaction

## Details
Sartor is a multi-tier AI memory and task system designed to provide persistent,
context-aware assistance for [[ALTON]] across sessions and machines. The core architecture is:

**Memory Layer:** Curated markdown files (this directory) forming long-term memory.
Core files hold stable knowledge; daily logs capture session-specific activity.
Git provides versioning and sync between [[MACHINES|machines]].

**Task Harness:** Semi-autonomous operation loop. Sartor can pick up tasks,
execute them via Claude Code instances, and log results. Designed for background
work when the user is away. See [[PROCEDURES]] for operational details.

**Agent Orchestration:** Claude Code supports agent teams for parallel work.
Sartor can spin up sub-instances for research, coding, and automation tasks
that run concurrently.

**Patterns borrowed from OpenClaw:**
1. Gateway control plane - single coordination hub
2. Local-first markdown memory with hybrid BM25 search
3. Heartbeat/proactive scheduler
4. Session compaction with memory flush

These patterns and their practical implications are documented in [[LEARNINGS]].

**Architecture flow:**
markdown memory -> git sync -> task harness -> Claude Code instances

## Open Questions
- How to handle memory conflicts when multiple agents write simultaneously?
- What is the optimal compaction frequency for daily logs?
- Should we implement BM25 search over memory files?

## Related
- [[ALTON]] - The user Sartor serves
- [[MACHINES]] - Infrastructure Sartor runs on
- [[PROCEDURES]] - How to operate and maintain Sartor
- [[LEARNINGS]] - Lessons learned building and running Sartor

## History
- 2026-02-06: Initial creation of Sartor memory system
