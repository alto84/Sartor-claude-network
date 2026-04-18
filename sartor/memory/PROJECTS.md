---
type: domain
entity: PROJECTS
updated: 2026-04-16
updated_by: Claude (hub-refresher)
last_verified: 2026-04-16
status: active
next_review: 2026-05-16
tags: [entity/projects, status/active]
aliases: [Active Projects]
related: [ALTON, BUSINESS, SELF]
---

# Projects - Active Projects

## Key Facts
- Primary projects: Sartor Claude Network (memory wiki + §2 infrastructure build), Safety Research System, Solar Inference LLC operations
- Tax Prep 2025 closed via Form 4868 extension (filed Apr 14-15, 2026); $15K IRS + $3K NJ extension payments authorized
- Blackwell workstation ordered 2026-04-12, $37,831, arriving summer 2026
- Operating Agreement v1.0 ratified 2026-04-12 between Rocinante and gpuserver1

## Sartor Claude Network
- **Status:** Active development; memory wiki maturation phase
- **GitHub:** https://github.com/alto84/Sartor-claude-network.git
- **Description:** Multi-tier AI memory system with self-improving agents
- **Features:** Markdown memory, git sync, task harness, agent teams, embedding search (609 chunks via nomic-embed-text on gpuserver1)
- **Dashboard:** Next.js 16 + React 19 + Tailwind, running on gpuserver1:5000 -- see [[MACHINES]]
- **Architecture:** OpenClaw-inspired patterns (local-first memory, heartbeat, session compaction)
- **Memory wiki evolution (2026-04):**
  - v0.2 conventions ratified ([[reference/MEMORY-CONVENTIONS]]): YAML frontmatter, callouts, wikilinks, `last_verified` / `volatility` / `oracle` staleness fields
  - Multi-machine inbox pattern in production ([[reference/MULTI-MACHINE-MEMORY]]): per-machine inbox queues, curator drains on Rocinante
  - Sub-pages now under `business/`, `family/`, `machines/`, `people/` for deep operational detail
- **Operating Agreement v1.0 (2026-04-12):** Domain separation between Rocinante (curator hub, push credentials) and gpuserver1 (revenue node, rental-operations authority). See [[reference/OPERATING-AGREEMENT]].
- **§2 infrastructure (in progress as of 2026-04-16):** Curator agent and inbox-drain plumbing per Operating Agreement §2 — substrate is being built today; previously the curator was "a ghost" per the agreement's own admission.
- **Dashboard widgets:** 15 configurable widgets (weather, calendar, tasks, family, countdowns, birthdays)
- **Known issues:** Some dashboard widgets still use placeholder data

## Safety Research System (Open Source)
- **Status:** Active; last major push 2026-02-18 (overnight autonomous build session). No major commit activity verified for March-April 2026 — flagged for status check.
- **Repo:** https://github.com/alto84/safety-research-system.git
- **Description:** Open-source Predictive Safety Platform for cell therapy adverse events
- **Dashboard:** 26 tabs, live at gpuserver1:8000
- **Capabilities at last push:** SapBERT AE classifier (GPU, MedDRA), secondary malignancy detection (FDA boxed warning tracker, CAR-T products), interactive knowledge graph (force-directed SVG), temporal signal evolution (PRR/ROR/EBGM/IC025 with regulatory milestone overlay), Signal Timeline dashboard tab, asyncio batch prediction, CORS / error sanitization / bounded memory hardening, pharma org simulation
- **Key areas:** FAERS analysis, disproportionality methods, SapBERT NLP classification, Bayesian risk modeling, knowledge graphs, temporal pharmacovigilance
- **Professional alignment:** Directly supports Alton's [[ASTRAZENECA|AZ]] Senior Medical Director role in AI Innovation and Validation

## Solar Inference LLC
- **Status:** Active operations (revenue node + tax-strategy anchor)
- **Website:** SolarInference.com (placeholder)
- **GPU rental:** Machine #52271 (RTX 5090) on vast.ai, $0.40/hr base / $0.25/hr min bid / $0.35/hr current demand price (set 2026-04-11). Listing expires 2026-08-24.
- **Workstation expansion:** Dual RTX PRO 6000 Blackwell rig ordered 2026-04-12 ($37,831 via Newegg; PSU swap completed). Components arriving 4/14-4/15. Build target: summer 2026.
- **Solar ITC:** Tesla Solar Roof contract ($438,829 / ~$450k per CPA discussion). Install target before 2026-07-04 to capture ~$131K federal ITC + accelerated depreciation. **Blocker:** contract still in personal name — must transfer to LLC before placed-in-service.
- **Berman WiFi install:** 2026-04-27 to 2026-04-29 (Solar Inference LLC business install).
- **Power Mac home-theater visit:** 2026-04-28 8-9am (will coordinate on-site with Berman).

## Sante Total Nonprofit Operations
- **Status:** Active; Form 990-N due 2026-05-15 (extendable to Nov 15)
- **Recurring revenue:** Michael Quigg $250/month PayPal subscription (active, next payment 2026-05-14)
- **IRS penalty abatement:** Filed Dec 2025, still pending as of 2026-04-06
- **Treasurer:** Alton (handles 990-N filing directly; not in CPA Jonathan Francis's scope)
- **TY2026 migration:** Will move from 990-N e-Postcard to 990-EZ as gross receipts rise.
- See [[business/sante-total]]

## Tax Prep 2025
- **Status:** Extension filed and paid
- **Federal:** Form 4868 path; $15,000 extension payment authorized for debit week of 2026-04-15
- **NJ:** $3,000 extension payment authorized
- **NJ-1065 Solar Inference:** $450 fee due 2026-04-15 separately; CPA on it
- **Charitable contributions TY2025:** $2,037.17 to MKA (2025-11-20). 2024 baseline was ~$25K — flagged for 2026 giving plan.
- **Wage delta YoY:** +$160K, withholding shortfall is the primary driver of the extension payment
- **K-1 cascade:** Solar Inference K-1 not available until 2026-09-15 → personal 1040 amend or extend per CPA strategy
- **Full details:** [[TAXES]]

## Creative Lab
- **Status:** Dormant
- **Description:** Dashboard fun pages and creative coding experiments
- **Pages built:** Fractal gallery, Mandelbulb 3D GPU renderer, Audio visualizer
- **Hosted on:** gpuserver1:5000 dashboard

## Open Questions
- Priority ranking of projects given Blackwell workstation arrival timeline?
- SolarInference.com: stays placeholder until install + LLC transfer complete?
- Safety Research System status check: is it actively maintained or paused since Feb 18?
- Should Creative Lab ideas fold into safety-research-system as visualization layer?

## Related
- [[ASTRAZENECA]] - Deep dive on AZ pharma safety AI
- [[BUSINESS]] - Business context for SolarInference, Sante Total, AZ work
- [[MACHINES]] - Hardware these projects run on
- [[TAXES]] - Tax preparation details for 2025
- [[reference/OPERATING-AGREEMENT]] - Rocinante-gpuserver1 v1.0 contract

## History
- 2026-02-06: Initial creation
- 2026-02-20: Updated with safety-research-system creative ideas, memory research findings, dashboard state notes
- 2026-04-16: Hub refresh — closed past 4/15 tax deadline, added Solar Inference operations as first-class project, added Sante Total, surfaced §2 infrastructure status, removed truncated daily-log artifact, updated Blackwell status (ordered not "considering"), added Operating Agreement reference.
