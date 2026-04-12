---
type: domain
entity: BUSINESS
updated: 2026-04-12
updated_by: Claude (hub-refresher)
last_verified: 2026-04-12
status: active
next_review: 2026-05-12
tags: [entity/llc, entity/nonprofit, domain/career]
aliases: [Solar Inference, Sante Total, Business]
related: [ALTON, TAXES, PROJECTS, ASTRAZENECA, solar-inference, sante-total, az-career, business/rental-operations, business/solar-inference]
---

> [!note] Sub-pages added 2026-04-09
> Deep operational pages now live alongside this overview:
> - [[business/solar-inference|Solar Inference LLC]] — $219K solar draw, Lucent stalled, GPU zero utilization, Berman install 4/27-29
> - [[business/sante-total|Sante Total]] — ~$4,350 donations/30d, 990-EZ migration coming for TY2026
> - [[business/az-career|AZ Career Track]] — Andy Stecker CPSO lead cold since 3/17


# Business Context

## Key Facts
- **Solar Inference LLC:** Solar-powered AI inference startup (active development)
- **Sante Total:** 501(c)(3) nonprofit — healthcare delivery in Haiti and Kenya (Alton is Treasurer/Board Member)
- **[[ASTRAZENECA|AstraZeneca]]:** Medical Director, AI Innovation and Validation, Global Patient Safety
- Three distinct tracks: pharma career + startup venture + nonprofit

## AstraZeneca Career Track

**Current Position:** Medical Director, AI Innovation and Validation, Global Patient Safety
- **Previous role:** Medical Director of Device & Digital Safety
- **Office:** Delaware (remote 2 days/week from Montclair, NJ)
- **Promotion prospect:** Senior Medical Director role in NYC (Empire State Building), $288K-$432K
- See [[ASTRAZENECA]] for full role details

**AI Industry Partnerships (via AZ):**
- OpenAI Red Teaming Network member (acknowledged in GPT-4o system card)
- Anthropic strategic partnership development at AZ level
- Google Cancer AI Symposium participant

**Professional + Open Source Synergy:**
- The [[PROJECTS|safety-research-system]] directly aligns with AZ role
- Demonstrates thought leadership in AI-powered pharmacovigilance
- No proprietary data — fully independent of AZ

## Solar Inference LLC

**Status:** Active development / pre-revenue
**Website:** SolarInference.com (currently placeholder)

**Business Model:**
- $438,829 Tesla Solar Roof installation (contract value, signed 2025-09-03 with Lucent Energy) to power GPU computing operations
- Solar-powered AI inference — edge computing at solar sites
- Complex tax optimization: commercial solar depreciation + LLC structuring
- Primary operational metric is **rental occupancy** (not profitability) to justify Solar ITC. See [[business/rental-operations]] for framework.

**Infrastructure:**
- vast.ai hosting: account alto84@gmail.com (Google OAuth), machine #52271 (RTX 5090), $0.40/hr base, $0.25/hr min bid (note: $0.25 is the minimum bid, not the base rate). Price set to $0.35/hr demand as of 2026-04-11.
- API key configured on gpuserver1 (name: "gpuserver1"), CLI at `~/.local/bin/vastai`
- Dual RTX PRO 6000 Blackwell workstation arriving summer 2026 (~$35K, Newegg, 192GB VRAM total). See [[business/rental-operations]] and [[PROJECTS]] for context.
- See [[MACHINES]] for current GPU setup and vast.ai details; see [[machines/gpuserver1/MISSION|gpuserver1 MISSION v0.2]] for occupancy-first pricing rationale

**Possible Directions:**
- Solar panel yield prediction using weather and satellite data
- Energy production forecasting for grid operators
- AI-driven solar installation optimization
- Predictive maintenance for solar farms
- Edge inference on IoT devices at solar sites

## Sante Total (Nonprofit)

**Type:** 501(c)(3) nonprofit
**Alton's role:** Treasurer and Board Member
**Mission:** Healthcare delivery in Haiti and Kenya
**History:** Involved since 2010
**Current issues:** IRS penalty abatement requests in progress; ongoing administrative and financial management

## Tax Implications

All three business tracks have tax implications for 2025 filing year.
See [[TAXES]] for deductions, estimated payments, and filing details.

## Open Questions
- Sante Total: IRS penalty abatement resolution?
- Any IP considerations between AZ work and personal projects?
- Why is GPU utilization zero? Needs pricing review vs. comparable RTX 5090 listings.
- Is the solar contract still in personal name? Must transfer to LLC before in-service for ITC/depreciation.

## Recent Events
- 2026-04-04: Machine #52271 (gpuserver1) went offline (45 min inactive); **recovered** — no follow-up emails, confirmed transient outage. Status resolved per [[business/solar-inference]].
- 2026-04-07: Berman Home Systems WiFi upgrade deposit signed (Dropbox Sign), install scheduled 2026-04-27 to 2026-04-29.
- 2026-04-11: GPU rental price raised to $0.35/hr demand / $0.26/hr interruptible.
- 2026-04-12: Operating Agreement ratified. gpuserver1 cron cleanup (15 → 5 active jobs). See [[reference/OPERATING-AGREEMENT|Operating Agreement]].

## Related
- [[ASTRAZENECA]] - Detailed AZ safety AI context and career details
- [[PROJECTS]] - Project-level tracking for all business tracks
- [[TAXES]] - Tax implications of business activities

## History
- 2026-02-06: Initial creation
- 2026-02-20: Major update from claude.ai memory export — Solar Inference LLC details, Sante Total nonprofit, AI industry partnerships
- 2026-04-09: Sub-pages added: [[business/solar-inference]], [[business/sante-total]], [[business/az-career]]
- 2026-04-12: Hub refresh — fixed four contradictions: solar roof contract value corrected ($450K → $438,829), GPU base rate clarified ($0.25 is min bid not base; base is $0.40), 2026-04-04 outage resolved (was "unverified"), Blackwell updated (was "considering" → "arriving summer 2026"). Added last_verified, wikilinks to sub-pages and rental-operations framework.
