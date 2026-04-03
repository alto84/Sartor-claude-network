# Projects - Active Projects
> Last updated: 2026-02-20 by Claude

## Key Facts
- 6 active projects tracked
- Primary projects: Sartor Claude Network + Safety Research System
- Mix of personal, professional, and administrative projects

## Sartor Claude Network
- **Status:** Active development
- **GitHub:** https://github.com/alto84/Sartor-claude-network.git
- **Description:** Multi-tier AI memory system with self-improving agents
- **Features:** 19+ skills, markdown memory, git sync, task harness, agent teams
- **Dashboard:** Next.js 16 + React 19 + Tailwind, running on gpuserver1:5000 -- see [[MACHINES]]
- **Architecture:** OpenClaw-inspired patterns (local-first memory, heartbeat, session compaction)
- **Skills added:** chrome-automation/, openclaw-patterns/
- **Memory system (2026-02-20):** Researched state-of-art: Mem0, Letta, Graphiti, memsearch, qmd. Key upgrade path: hybrid search (BM25 + vectors + RRF), wikilink graph parsing, session auto-summarization. See [[LEARNINGS]] for details.
- **Dashboard widgets:** 15 configurable widgets (weather, calendar, tasks, family, countdowns, birthdays)
- **Known issues:** Stale placeholder data (weather, dates), Vasu missing from family page

## Safety Research System (Open Source)
- **Status:** Active development (flagship project)
- **Repo:** https://github.com/alto84/safety-research-system.git
- **Description:** Open-source Predictive Safety Platform for cell therapy adverse events
- **Dashboard:** 26 tabs, live at gpuserver1:8000
- **Tests:** 2242+ passing (40.0s on Rocinante)
- **Latest (2026-02-18):** Overnight autonomous build session added:
  - SapBERT AE classifier (GPU, 470 MedDRA terms, 11/12 correct on real test)
  - Secondary malignancy detection (FDA boxed warning tracker, 10 signals, 6 CAR-T products)
  - Interactive knowledge graph (112 nodes, 97 edges, force-directed SVG)
  - Temporal signal evolution (PRR/ROR/EBGM/IC025 over quarterly periods, regulatory milestone overlay)
  - Signal Timeline dashboard tab with time-series charts + summary tables
  - Batch prediction parallelization (asyncio.gather)
  - P0 security hardening (CORS, error sanitization, bounded memory)
  - Pharma org simulation (CEO mission, regulatory frameworks)
- **Creative ideas explored (2026-02-20):** Adverse event sonification, mechanism chain game, "Drug Safety Tycoon" pharma sim, patient narrative storytelling, safety data art
- **Key areas:** FAERS analysis, disproportionality methods, SapBERT NLP classification, Bayesian risk modeling, knowledge graphs, temporal pharmacovigilance
- **Professional alignment:** Directly supports Alton's new [[ASTRAZENECA|AZ]] role in AI Innovation and Validation

## SolarInference
- **Status:** Early stage / Coming Soon
- **Website:** SolarInference.com (placeholder page)
- **Description:** Solar + AI inference startup -- see [[BUSINESS]] for strategy
- **Directions:** Solar panel yield prediction, energy forecasting, AI-driven solar optimization
- **Next steps:** Define MVP, build landing page content

## Creative Lab
- **Status:** Active / Fun
- **Description:** Dashboard fun pages and creative coding experiments
- **Pages built:**
  - Fractal gallery
  - Mandelbulb 3D GPU renderer
  - Audio visualizer
- **Hosted on:** gpuserver1:5000 dashboard

## Tax Prep 2025
- **Status:** Documents gathering phase
- **Deadline:** April 15, 2026
- **Description:** Filing federal and state taxes for tax year 2025
- **Key info:** New deductions available under One Big Beautiful Bill Act
- **Full details:** [[TAXES]]

## Open Questions
- Priority ranking of projects?
- SolarInference next concrete milestone?
- Should Creative Lab ideas fold into safety-research-system?

## Related
- [[ASTRAZENECA]] - Deep dive on AZ pharma safety AI
- [[BUSINESS]] - Business context for SolarInference and AZ work
- [[MACHINES]] - Hardware these projects run on
- [[TAXES]] - Tax preparation details for 2025

## History
- 2026-02-06: Initial creation
- 2026-02-20: Updated with safety-research-system creative ideas, memory research findings, dashboard state notes
