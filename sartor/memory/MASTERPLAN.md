# SARTOR MASTER PLAN

*Synthesized from 5 agent perspectives. Last updated: 2026-02-06.*
*Judge: Claude Opus 4.6 | Status: ACTIVE*

---

## 1. Vision

Sartor is a personal AI system that runs quietly in the background of Alton's life, remembering everything worth remembering, surfacing what matters before he asks, and gradually earning its keep. It is built on markdown files, git repos, and Claude Code -- no proprietary platforms, no vendor lock-in, no infrastructure that costs money when nobody is looking. The measure of success is not technical sophistication but whether Alton actually uses it on a random Wednesday in March.

## 2. Architecture

### What Exists Today

| Component | Location | Status |
|-----------|----------|--------|
| Memory store | `~/Sartor-claude-network/sartor/memory/` on gpuserver1 | **Working** - markdown files, git-tracked |
| Claude Code | gpuserver1 (v2.1.33) + Rocinante (Windows) | **Working** - agent teams enabled |
| GPU compute | RTX 5090, gpuserver1 (192.168.1.100) | **Working** - PyTorch 2.11.0+cu128 |
| Chrome automation | CDP on port 9223 (both machines) | **Working** - headless on server, windowed on desktop |
| Agent skills | 19+ skills in `.claude/skills/` | **Working** - chrome-automation, openclaw-patterns |
| Git sync | GitHub repo `alto84/Sartor-claude-network` | **Working** - push from Rocinante |

### Target Architecture (End of Phase 2)

```
                    +---------------------+
                    |   CRON (every 30m)  |  <- NOT a daemon. Cron.
                    +----------+----------+
                               |
                    +----------v----------+
                    |   GATEWAY SCRIPT    |  <- Single Python entry point
                    |  (gateway.py)       |  <- Decides what to do this cycle
                    +----------+----------+
                               |
              +----------------+----------------+
              |                |                |
    +---------v--------+ +----v--------+ +-----v---------+
    | MEMORY (git)     | | DASHBOARD   | | TASK RUNNER   |
    | Read/write .md   | | Flask app   | | Bounded work  |
    | BM25 search      | | port 5000   | | per cycle     |
    +------------------+ +-------------+ +---------------+
              |                |                |
              +----------------+----------------+
                               |
                    +----------v----------+
                    |   MODEL ROUTER      |
                    | Haiku -> routine    |
                    | Sonnet -> standard  |
                    | Opus -> critical    |
                    +---------------------+
```

### Key Design Decisions

- **Cron, not daemon.** A cron job every 30 minutes is free, restartable, and cannot leak money. An always-on agent process is a cost bomb waiting to happen. We graduate to shorter intervals only after proving the 30-minute cycle works.
- **Markdown, not database.** Files are readable, diffable, greppable, and backed up by git. No ORM, no migrations, no schema versioning. If it can be a `.md` file, it is a `.md` file.
- **3-tier model routing.** Haiku ($0.25/MTok in, $1.25/MTok out) handles summaries, reminders, and classification. Sonnet handles planning and writing. Opus handles judgment calls and complex reasoning. This is the single biggest lever on cost.
- **Session compaction.** Every gateway cycle produces a session log. Logs older than 24h get compacted into memory summaries. Logs older than 7d get archived. This prevents unbounded context growth.
- **No sandboxing yet, but no arbitrary skill execution either.** The 341 malicious OpenClaw skills are a real threat. For now, Sartor only runs skills from our own repo. Third-party skill loading is a Phase 4 concern with proper sandboxing.

## 3. Phase 1: Foundation (This Week)

The goal is a working heartbeat loop and memory system. Nothing fancy. Just the bones.

### Day 1-2: Gateway + Memory

- [ ] Write `sartor/gateway.py` -- single entry point script
  - Reads memory files, checks what needs attention
  - Writes a session log to `sartor/memory/daily/YYYY-MM-DD.md`
  - Runs one cycle of: check calendar, check tasks, update memory
  - Exits cleanly (no hanging processes, no leaked connections)
- [ ] Write `sartor/memory/search.py` -- BM25 search over markdown files
  - Index all `.md` files in memory directory
  - Return ranked results for natural language queries
  - Keep it simple: `rank-bm25` library, rebuild index each run
- [ ] Set up cron: `*/30 * * * * cd ~/Sartor-claude-network && python sartor/gateway.py >> /tmp/sartor.log 2>&1`
- [ ] Write `sartor/costs.py` -- API cost tracker
  - Log every API call with model, tokens in, tokens out, cost
  - Daily and weekly cost summaries
  - Hard ceiling: $5/day default, configurable

### Day 3: Morning Brief

- [ ] Write `sartor/brief.py` -- generates morning summary
  - Pull from: weather API (free tier), Google Calendar (API), memory/daily/*.md
  - Format: plain text, under 200 words, scannable in 90 seconds
  - Output to `sartor/memory/daily/YYYY-MM-DD-brief.md`
  - Delivery: for now, just a file. Phase 2 adds dashboard display.

### Day 4-5: Tax Season Sprint

- [ ] This is urgent. April 15 deadline, 68 days away.
  - Scrape/organize existing tax documents referenced in TAXES.md
  - Build checklist of what is needed vs what is gathered
  - Create `sartor/memory/TAXES-2025.md` with structured tracker
  - Identify missing documents, set reminders
  - This is User Advocate Tier 1. It ships before the dashboard.

### Day 6-7: Hardening

- [ ] Error handling in gateway.py -- every failure mode writes to log, never crashes silently
- [ ] Git auto-commit: gateway.py commits memory changes after each cycle
  - Commit message format: `[sartor] YYYY-MM-DD HH:MM cycle summary`
  - Push to remote daily (not every cycle -- bandwidth courtesy)
- [ ] Verify cost tracking is accurate against Anthropic dashboard
- [ ] Write `sartor/test_gateway.py` -- basic tests that the loop runs without errors

**Phase 1 Exit Criteria:** Gateway runs every 30 minutes for 48 hours without intervention. Morning brief generates. Tax tracker exists. Cost stays under $3/day.

## 4. Phase 2: Living System (Weeks 2-4)

### Week 2: Dashboard (MERIDIAN v0.1)

- [ ] Flask app on gpuserver1, port 5000, accessible from home network
- [ ] Pages: Morning Brief, Calendar (Google Calendar API), Task Board, Weather
- [ ] Design constraint: loads in under 2 seconds, works on phone browser
- [ ] No auth for now (LAN only). Phase 3 adds Tailscale + auth if needed.
- [ ] Family-friendly: spouse and kids can see calendar, tasks, weather
- [ ] Tech: Flask + HTMX (no heavy JS framework). Jinja templates. SQLite for dashboard state only (not for memory -- memory stays in markdown).

### Week 3: Proactive Monitoring (SENTINEL v0.1)

- [ ] Gateway gains awareness of external state:
  - SolarInference server status (if applicable)
  - gpuserver1 health (disk, GPU temp, memory)
  - Upcoming calendar events (next 48 hours)
  - Tax deadline countdown
- [ ] Anomaly = write to `sartor/memory/daily/` + flag for morning brief
- [ ] NOT a notification system yet. Just memory entries the brief picks up.

### Week 4: Memory Graph (ATLAS v0.1)

- [ ] Auto-linking between memory files (detect references, build backlinks)
- [ ] Session compaction: daily logs older than 7 days get summarized
- [ ] Memory decay: tag entries with last-accessed date, surface stale items for review
- [ ] Self-editing memory: gateway can propose memory updates (with diff), auto-apply for low-risk, flag for review on high-risk

**Phase 2 Exit Criteria:** Dashboard serves morning brief on phone. Gateway monitors 3+ external systems. Memory files are interlinked. System runs for 2 weeks with less than 10 minutes/week of manual intervention.

## 5. Phase 3: Revenue (Months 2-3)

### FORGE: Technical Consulting

- [ ] Package Claude Code expertise into repeatable consulting deliverables:
  - "AI workflow audit" -- analyze a company's processes, identify automation opportunities
  - "Claude Code setup" -- install, configure, build initial agent workflows
  - Dev tool automation scripts (CI/CD, testing, deployment)
- [ ] Pricing: $150-300/hr, $2-5K per engagement
- [ ] Lead generation: technical blog posts (CHRONICLE), LinkedIn, dev communities
- [ ] Realistic first-month target: 1-2 clients, $1.5-4K revenue

### ANVIL: Micro-SaaS (Scouting Phase)

- [ ] Identify 3 specific SaaS ideas based on:
  - Problems Alton has personally experienced
  - Things Claude Code can build end-to-end
  - Markets with existing demand (not speculative)
- [ ] Build one MVP in a weekend. Validate with 5 real users before investing more.
- [ ] Revenue target: $0 in month 2 (validation only), $500-2K MRR by month 4

### GPU Rental

- [ ] List RTX 5090 on Vast.ai during idle hours (nights, weekends when not running Sartor tasks)
- [ ] Expected: $0.32/hr * ~12 hrs/day idle = ~$115/mo passive
- [ ] Constraint: Sartor tasks always take priority. GPU rental is scrap income.

### Content (CHRONICLE v0.1)

- [ ] Publish 2 technical posts/month about building Sartor
  - "Building a personal AI assistant with markdown and cron"
  - "What I learned about Claude Code agent teams"
  - "Cost-optimizing persistent AI agents"
- [ ] Platform: personal blog (GitHub Pages or similar, $0 cost)
- [ ] Goal: audience building for FORGE leads, not direct revenue

**Phase 3 Exit Criteria:** At least one revenue stream producing income. Total system cost (API + infrastructure) covered by revenue. Consulting pipeline has 2+ active leads.

## 6. Phase 4: Scale (Months 4-6)

### LOOM: Open Source Sartor Framework

- [ ] Extract the reusable parts of Sartor into a framework others can use
  - Gateway pattern, memory system, model router, dashboard template
- [ ] This is marketing for FORGE. Open source builds credibility and leads.
- [ ] Do NOT open source prematurely. Wait until it actually works well for us first.

### BEACON: SolarInference Accelerator

- [ ] Only pursue if GPU rental validates demand and margins
- [ ] Multi-GPU inference serving is a real business but requires real capital
- [ ] Milestone: validate with 1 paying customer before investing further
- [ ] Long-term target: $10-50K/mo, but this is 6-12 months out minimum

### CONSTELLATION: Multi-Machine Sartor

- [ ] Sartor instances on gpuserver1 and Rocinante coordinate via git
- [ ] Agent teams (Claude Code Feb 5 release) enable peer-to-peer task delegation
- [ ] Use case: Rocinante handles browser automation, gpuserver1 handles compute
- [ ] This is a Phase 4 luxury. Single-machine Sartor must be solid first.

### PRISM: Curiosity Framework

- [ ] Sartor can be tasked with open-ended research/exploration
- [ ] "Learn about X and summarize what is interesting" as a first-class workflow
- [ ] Bounded by cost controls. Curiosity does not get a blank check.

## 7. Revenue Model

Honest numbers. No hockey sticks.

### Monthly Cost Baseline

| Item | Low | Medium | High |
|------|-----|--------|------|
| Claude API (3-tier routing) | $30 | $75 | $150 |
| Infrastructure | $0 | $0 | $20 |
| Misc (domains, tools) | $0 | $10 | $30 |
| **Total Cost** | **$30** | **$85** | **$200** |

### Monthly Revenue Scenarios (by Month 6)

| Stream | Low | Medium | High |
|--------|-----|--------|------|
| FORGE (consulting) | $0 | $3,000 | $8,000 |
| ANVIL (SaaS) | $0 | $500 | $2,000 |
| GPU rental | $50 | $115 | $230 |
| CHRONICLE (content) | $0 | $0 | $500 |
| BEACON | $0 | $0 | $1,000 |
| **Total Revenue** | **$50** | **$3,615** | **$11,730** |

### Honest Assessment

- **Low scenario** is the most likely outcome if Alton does not actively pursue consulting. GPU rental is the only truly passive income.
- **Medium scenario** requires landing 1-2 consulting clients/month and shipping one SaaS product. Achievable but requires dedicated sales effort.
- **High scenario** requires everything working AND market timing. Do not plan around this.
- **Break-even** (covering API costs) should happen within 60 days via GPU rental alone.
- **Target: $3-5K/mo by month 6.** This is the realistic stretch goal.

## 8. What We're NOT Doing

This is the kill list. These are traps that will eat time and ship nothing.

1. **No custom LLM training or fine-tuning.** Claude API is the model layer. Period. Fine-tuning is a research project disguised as a product decision.
2. **No Kubernetes, Docker Compose, or container orchestration.** A cron job and a Flask app do not need k8s. If you are writing a Dockerfile before you have users, you are procrastinating.
3. **No real-time streaming or WebSocket dashboards.** The dashboard updates when you refresh it. HTMX can handle incremental updates if needed. No React, no Next.js, no SPA framework.
4. **No third-party skill marketplace.** After 341 malicious skills were found in OpenClaw, we run our own code only. Skill sandboxing is interesting but not until Phase 4+.
5. **No mobile app.** The dashboard is a responsive web page. If it works in mobile Safari, it works on mobile. No React Native, no Flutter, no app store.
6. **No blockchain, no crypto, no tokens.** Self-explanatory.
7. **No "AI agent swarm" without cost controls.** Every agent cycle has a cost ceiling. Runaway agent loops are the #1 risk to the budget. Hard kill switches on every automated process.
8. **No premature open-sourcing.** LOOM happens after Sartor works well for us, not before. Open source is marketing, not product development.
9. **No complex auth systems in Phase 1-2.** LAN-only dashboard. Tailscale if we need remote access. Full auth is a Phase 3 concern at the earliest.
10. **No notification systems that create obligations.** Sartor is a butler, not a boss. It surfaces information when asked. It does not ping, buzz, or demand attention. The morning brief is pull-based, not push-based.

## 9. Success Metrics

### The "Random Wednesday" Test

> Would Alton open the Sartor dashboard at 7:15 AM on a random Wednesday in March, find something useful, and close it within 90 seconds?

If the answer is no, we have built the wrong thing.

### Quantitative Metrics

| Metric | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|
| Gateway uptime | 90% | 99% | 99% | 99.5% |
| Morning brief accuracy | Exists | Useful | Anticipated needs | Personalized |
| Cost per day | <$3 | <$5 | <$7 | Covered by revenue |
| Manual intervention | Daily | Weekly | Monthly | Quarterly |
| Memory files | 15+ | 50+ | 100+ | Self-managing |
| Revenue (monthly) | $0 | $0-100 | $1-5K | $3-10K |
| Time to morning check | N/A | <90 sec | <60 sec | <30 sec |

### Qualitative Signals

- **Working:** Alton checks the dashboard without being reminded. Tax docs are organized. He forgets Sartor is running until it surfaces something useful.
- **Failing:** Alton spends more time maintaining Sartor than it saves. The API bill is a surprise. The dashboard shows stale data. He stops checking it.

### Autonomy Ladder

| Level | Description | Trust Required | Phase |
|-------|-------------|----------------|-------|
| 0 | Runs when manually triggered | None | Now |
| 1 | Runs on cron, writes to memory | Low | Phase 1 |
| 2 | Generates briefs, monitors systems | Medium | Phase 2 |
| 3 | Proposes actions, executes after approval | High | Phase 3 |
| 4 | Executes routine actions autonomously | Very High | Phase 4 |

**Hard rules at every level:**
- WITHOUT asking: reading, summarizing, organizing, reminding
- ALWAYS ask before: sending messages, spending money, deleting anything, changing settings

## 10. The Projects

Ranked by priority. Phase assignment reflects when serious work begins, not when we first think about it.

| Rank | Project | Phase | Priority | Description |
|------|---------|-------|----------|-------------|
| 1 | **ATLAS** | 1 | CRITICAL | Memory system. Everything else depends on this. |
| 2 | **MERIDIAN** | 2 | CRITICAL | Dashboard + morning brief. The user-facing surface. |
| 3 | **SENTINEL** | 2 | HIGH | Monitoring. Makes MERIDIAN useful beyond calendar display. |
| 4 | **FORGE** | 3 | HIGH | Consulting revenue. The most realistic near-term income. |
| 5 | **CHRONICLE** | 3 | MEDIUM | Content + leads for FORGE. Compounds over time. |
| 6 | **ANVIL** | 3 | MEDIUM | SaaS. Higher ceiling than FORGE but more uncertain. |
| 7 | **PRISM** | 3 | MEDIUM | Research/exploration. Makes Sartor fun, not just useful. |
| 8 | **LOOM** | 4 | LOW | Open source framework. Marketing for FORGE/ANVIL. |
| 9 | **BEACON** | 4 | LOW | GPU inference service. Requires capital and proven demand. |
| 10 | **CONSTELLATION** | 4 | LOW | Multi-machine. Luxury feature. Single-machine must work first. |

### Project Dependencies

```
ATLAS --> MERIDIAN --> SENTINEL
              |
              v
          FORGE --> CHRONICLE
              |
              v
          ANVIL --> LOOM
                      |
          BEACON <----+
              |
              v
        CONSTELLATION
              |
          PRISM (independent, can start anytime with cost controls)
```

---

## Appendix: Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API costs spiral | High | Medium | Hard daily ceiling ($5), 3-tier routing, cost tracking from Day 1 |
| Sartor becomes maintenance burden | High | Medium | "Random Wednesday" test. If it is not useful, simplify or shut down. |
| Consulting has no clients | Medium | Medium | Start with free/discounted audits to build portfolio. Content marketing. |
| Security breach via skills | High | Low | No third-party skills. Own code only. Sandboxing in Phase 4. |
| Scope creep (building too many projects) | High | High | This kill list. Phase gates. One project at a time gets focus. |
| GPU server hardware failure | Medium | Low | Git-backed memory survives. Dashboard can run on Rocinante. |
| Claude API changes/deprecation | High | Low | Markdown memory is model-agnostic. Gateway abstracts the API layer. |
| Burnout from overambition | High | Medium | Phase 1 is ONE WEEK. Ship small, validate, iterate. Do not try to build CONSTELLATION before ATLAS works. |

---

*This plan is a living document. It will be updated as Sartor evolves. The git log is the changelog.*

*"The best AI assistant is the one you forget is running until it hands you exactly what you need." -- Sartor Design Principle*
