# Active Tasks
> Last updated: 2026-02-06

## In Progress

- [ ] **Phase 1: Foundation (MASTERPLAN)** - Heartbeat loop, dashboard, cost controls
  - Priority: Critical
  - Owner: Claude (Sartor)
  - Started: 2026-02-06
  - Tags: research, organize_files
  - Status: Day 1 complete. Gateway cron running. Search + cost tracker working.

- [ ] **Gather 2025 tax documents** - Collect W-2, 1099s, etc. for April 15 filing
  - Priority: High (68 days to deadline)
  - Owner: Alton
  - Started: 2026-02-06
  - Tags: organize_files

## Completed Today

- [x] **Set up Sartor memory system** - Markdown-first memory files, 11 core .md files
  - Completed: 2026-02-06
- [x] **Build gateway cron loop** - gateway_cron.py runs every 30 min
  - Completed: 2026-02-06
- [x] **Integrate memory search (BM25)** - search.py indexes all .md files
  - Completed: 2026-02-06
- [x] **Build cost tracker** - costs.py with daily limits and 3-tier pricing
  - Completed: 2026-02-06
- [x] **Create master plan** - 5-agent think tank synthesized into MASTERPLAN.md
  - Completed: 2026-02-06
- [x] **Upgrade system monitor display** - Matrix rain, starfield, history graphs
  - Completed: 2026-02-06
- [x] **Set up X11 display on gpuserver1** - Physical monitor showing sysmonitor
  - Completed: 2026-02-06

## Pending

- [ ] **Build morning brief generator** - Phase 1 Day 3
  - Priority: High
  - Tags: research, summarize
  - Depends on: Gateway cron (done)

- [ ] **Build MERIDIAN dashboard v0.1** - Phase 2 Week 2
  - Priority: High
  - Tags: generate_code
  - Depends on: Morning brief

- [ ] **Add SSH key to GitHub for gpuserver1** - So gpuserver1 can push directly
  - Priority: Medium
  - Blocked by: Alton (needs to add key to GitHub account)

- [ ] **Set up SolarInference website** - Beyond "Coming Soon" placeholder
  - Priority: Low
  - Blocked by: Business plan decisions

- [ ] **GPU rental setup (Vast.ai)** - Phase 3 passive income
  - Priority: Low
  - Tags: research
  - Depends on: Phase 1 complete
