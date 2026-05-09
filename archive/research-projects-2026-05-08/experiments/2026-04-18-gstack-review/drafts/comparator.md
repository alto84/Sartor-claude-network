# Comparator — gstack vs Sartor

## 1. Organizing axis: roles vs domains

gstack decomposes by **startup job function**: CEO, Eng Manager, Senior Designer, DX Lead, Staff Engineer, QA Lead, Release Engineer, SRE, Perf Engineer, Tech Writer, CSO. Sartor decomposes by **life domain**: GPU hosting, Nonprofit, Family, Finance, Personal Research. Both are correct for their target workload.

Role-based works for gstack because a software product has one artifact (the repo) flowing through one pipeline (plan → build → review → ship). Every role touches the same codebase at a different lifecycle stage, so roles are a natural slicing. Domain-based would be a category error here: a "mobile domain" and a "billing domain" would still each need a CEO, QA, and release engineer.

Domain-based works for Sartor because the five Sartor workloads are orthogonal. GPU pricing has no relationship to Vayu's MKA pickup schedule; Sante Total IRS deadlines do not share state with options Greeks. A "CEO agent" would be a generic manager with no domain priors and no distinct data to act on. What Sartor keeps from the role idea is the `meta-agent`, `critic`, `auditor`, `sentinel` set — lifecycle roles that sit **across** domains, not in place of them.

## 2. Workflow commands: overlap and gaps

Overlap is thin and mostly in review-style verbs. gstack's `/retro` overlaps with Sartor's `/reflect` (both are retrospective skill extraction). gstack's `/review` overlaps with Sartor's `skill-reflector` and `auditor` agents. Everything else diverges.

gstack has no analog for `/morning`, `/markets`, `/nonprofit-status`, `/family-today`, `/gpu-status`, `/curate`. These are all **state-readout** commands: "tell me the current state of domain X." gstack's commands are all **state-change** commands: `/plan-*`, `/review`, `/ship`, `/qa`, `/canary`, `/document-release`. gstack assumes the world is a codebase that you mutate through a pipeline. Sartor assumes the world is five live systems that you observe and occasionally nudge.

What Sartor lacks that gstack has: a ship/deploy pipeline (`/ship`, `/land-and-deploy`), a security review gate (`/cso`, OWASP/STRIDE), perf benchmarking (`/benchmark`), and a browser-backed QA agent (`/browse` as a first-class skill, not just CDP access). Sartor's `/reflect` is lighter-weight than gstack's multi-stage `/retro` + `/learn` loop.

## 3. Scheduled tasks

gstack has **zero** documented cron-style schedules. Everything is command-triggered and human-invoked; the only throttled automation is an upgrade check at 1x/hour. Sartor has 10–11 scheduled tasks spanning daily (morning-briefing, nightly-memory-curation), sub-daily (gpu-utilization-check every 4h, personal-data-gather every 4h, self-improvement-loop every 6h), and weekly (financial summary, nonprofit review, skill evolution).

This is the largest architectural delta. gstack is a **synchronous developer tool**. Sartor is an **asynchronous household daemon**. The cadence difference is not cosmetic — it reflects that gstack assumes a human is driving every session, while Sartor assumes the agent must run whether Alton is at the keyboard or not.

## 4. Agent-to-agent communication

gstack has `/pair-agent` for cross-agent browser sharing (Claude Code ↔ OpenClaw ↔ Hermes ↔ Codex ↔ Cursor via a shared GStack Browser with scoped tokens and tab isolation), and Conductor for 10–15 parallel sessions in isolated workspaces. That is real coordination, but it is **session-concurrent**, not persistent. Epsilla's review explicitly flags "agent drift" as the failure mode: isolated sessions diverge because there is no persistent source of truth between them.

Sartor has a formally documented **inbox pattern** (`sartor/memory/inbox/{hostname}/`), a canonical **OPERATING-AGREEMENT.md** governing the Rocinante↔gpuserver1 split, per-machine MISSION/CRONS/INDEX files, and a curator that drains inboxes nightly. This is heavier machinery than gstack, and it exists because Sartor has a permanent two-machine split with different credentials (Rocinante has git, gpuserver1 does not) that cannot be papered over with a shared browser.

## 5. Memory system

gstack's memory is `/learn` — per-project persistent patterns, reviewable and prunable. It is real, but it is single-agent per project and the Epsilla article calls it out as insufficient at team scale.

Sartor's memory is substantially more elaborate: `MEMORY.md` as a stable index pointer, YAML frontmatter on every memory file, wikilinks across files, domain-segregated memory (`ALTON.md`, `FAMILY.md`, `BUSINESS.md`, `TAXES.md`, etc.), feedback rules auto-injected per session, daily append-only logs, per-machine state, and an archive convention. It is closer to a personal wiki than a cache.

## 6. Honest deltas

**Sartor has, gstack lacks:** persistent multi-machine coordination with an operating agreement, scheduled asynchronous tasks that run without a human, and a structured memory wiki with inbox-mediated writes. Sartor is built to survive between sessions; gstack is built to execute within one.

**gstack has, Sartor lacks:** a real ship pipeline (`/ship`, `/canary`, `/benchmark`, `/document-release`), security and performance review gates as first-class skills, and a multi-agent parallel-session coordinator (Conductor) that runs 10–15 isolated workspaces simultaneously. Sartor has no equivalent to Conductor and no production-deploy discipline, because Sartor is not shipping a product — it is running a household.

## Sources

- [garrytan/gstack repository tree and CLAUDE.md](https://github.com/garrytan/gstack)
- [Epsilla: YC Garry Tan gstack virtual agent team](https://www.epsilla.com/blogs/yc-garry-tan-gstack-virtual-agent-team)
- [Sitepoint: gstack (fetch failed 403, not used)](https://www.sitepoint.com/gstack-garry-tan-claude-code/)
- Local: `C:\Users\alto8\Sartor-claude-network\CLAUDE.md`
- Local: `C:\Users\alto8\Sartor-claude-network\.claude\agents\` (17 agents)
- Local: `C:\Users\alto8\Sartor-claude-network\.claude\skills\` (30+ skills)
- Local: `C:\Users\alto8\Sartor-claude-network\.claude\scheduled-tasks\` (10 tasks)
- Local: `C:\Users\alto8\Sartor-claude-network\sartor\memory\` (inbox, feedback, reference, machines)
