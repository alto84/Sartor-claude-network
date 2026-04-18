---
type: domain
entity: BUSINESS
updated: 2026-04-18
updated_by: Claude (wikilinks-implementer, gstack-port)
last_verified: 2026-04-16
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

**Current Position:** Senior Medical Director, AI Innovation and Validation, Global Patient Safety
- **Office:** NYC (Empire State Building). Started ~2026-03-31. Remote 2 days/week from Montclair, on-site 3 days/week.
- **Salary band:** $288K-$432K
- **Previous AZ roles:** Medical Director, AI Innovation and Validation (prior title) → before that, Medical Director of Device & Digital Safety. Delaware-office era ended at NYC transition.
- **Open admin item:** CPA Jonathan Francis flagged 2026-04-13 that W-2 still shows DE address with DE-only state withholding; Alton to update HR record to NJ.
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
- vast.ai hosting: account alto84@gmail.com (Google OAuth), Solar Inference LLC [[owns:machines/gpuserver1|machine #52271]] (RTX 5090), $0.40/hr base, $0.25/hr min bid (note: $0.25 is the minimum bid, not the base rate). Price set to $0.35/hr demand as of 2026-04-11.
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
- **[BLOCKER for Solar ITC] Solar contract is in Alton's personal name** — confirmed in 2026-04-06 CPA tax-package email. Must transfer to Solar Inference LLC before placed-in-service date (target: before July 4, 2026 ITC deadline) to capture ~$131K federal credit + ~$373K accelerated depreciation.
- Solar roof basis reconciliation: CLAUDE.md tracks $438,829 (Tesla/Lucent contract); Alton told CPA "~$450k" on 2026-04-14. Resolve which figure is canonical.

## Recent Events
- 2026-04-04: Machine #52271 (gpuserver1) went offline (45 min inactive); **recovered** — no follow-up emails, confirmed transient outage. Status resolved per [[business/solar-inference]].
- 2026-04-07: Berman Home Systems WiFi upgrade deposit signed (Dropbox Sign), install scheduled 2026-04-27 to 2026-04-29.
- 2026-04-11: GPU rental price raised to $0.35/hr demand / $0.26/hr interruptible.
- 2026-04-12: Operating Agreement ratified. gpuserver1 cron cleanup (15 → 4 active jobs). See [[reference/OPERATING-AGREEMENT|Operating Agreement]].
- 2026-04-13: 85 Stonebridge mortgage detail surfaced via CPA tax-package email — primary mortgage transferred mid-2025 from Shellpoint to Cenlar; new HELOC opened through Cenlar. Three 1098s on file. 2025 Montclair property tax paid: $62,187.49.
- 2026-04-14: CPA confirmed 2025 LLC pass-through of $37k workstation hardware capex; ~$450k solar roof basis flagged for 2026 ITC + bonus depreciation. CPA noted "We will pass through the 2025 stuff."
- 2026-04-14: Sante Total received recurring PayPal donation from Michael Quigg ($250/month, annualized $3,000). Subscription I-UWGVA4LYX3V2 active; next payment 2026-05-14.

## Related
- [[ASTRAZENECA]] - Detailed AZ safety AI context and career details
- [[PROJECTS]] - Project-level tracking for all business tracks
- [[TAXES]] - Tax implications of business activities

## History
- 2026-02-06: Initial creation
- 2026-02-20: Major update from claude.ai memory export — Solar Inference LLC details, Sante Total nonprofit, AI industry partnerships
- 2026-04-09: Sub-pages added: [[business/solar-inference]], [[business/sante-total]], [[business/az-career]]
- 2026-04-12: Hub refresh — fixed four contradictions: solar roof contract value corrected ($450K → $438,829), GPU base rate clarified ($0.25 is min bid not base; base is $0.40), 2026-04-04 outage resolved (was "unverified"), Blackwell updated (was "considering" → "arriving summer 2026"). Added last_verified, wikilinks to sub-pages and rental-operations framework.

<!-- curator-drained 2026-04-14T01:39:45+00:00 from rocinante entry=purchase-2026-04-12-workstation -->
## Inbox entry: purchase-2026-04-12-workstation

- Source machine: `rocinante`
- Created: 2026-04-12 21:14:00-04:00
- Operation: append
- Priority: p1
- Drained: 2026-04-14T01:39:45+00:00

# Workstation Purchase: Dual RTX PRO 6000 Blackwell Build

**Date:** 2026-04-12
**Total:** $37,831.29 (including $2,350.59 NJ tax) -- revised after PSU swap
**Vendor:** Newegg (3 orders)
**Payment:** Personal Visa ending 5680 ($37,223.64) + Visa ending 9425 ($607.65). Neither is the Chase business card -- needs LLC capital contribution documentation.

## Components purchased

| Component | Product | Price |
|-----------|---------|-------|
| GPU x2 | NVIDIA RTX PRO 6000 Blackwell, 96GB GDDR7 each (192GB total) | $18,999.98 |
| CPU | AMD Threadripper PRO 7975WX, 32-core, 4.0GHz, sTR5 | $3,799.99 |
| Motherboard | ASUS Pro WS WRX90E-SAGE SE (7x PCIe 5.0 x16, DDR5 ECC, 10GbE) | $1,246.99 |
| RAM | V-COLOR DDR5 256GB (8x32GB) 5600MHz ECC R-DIMM | $9,139.99 |
| PSU | ~~Super Flower 2200W (CANCELLED -- 240V only)~~ be quiet! Dark Power PRO 13 1600W ATX 3.0 Titanium (115-240V) | $499.90 |
| Fans | Super Flower MEGACOOL 140mm 3-pack (re-purchased separately after PSU cancel) | $69.99 |
| Storage 1 | Samsung 990 PRO 4TB NVMe | $879.95 |
| Storage 2 | Samsung SSD 9100 PRO 2TB (PCIe 5.0, 14,800MB/s) | $459.95 |
| Case | Phanteks Enthoo Pro 2 Server Edition (SSI-EEB, 11 PCI slots) | $179.99 |
| CPU Cooler | Noctua NH-U14S TR5-SP6 | $150.99 |
| Case Fans | ARCTIC P14 PWM 5-pack + Super Flower MEGACOOL 3-pack (free gift) | $40.99 |

## Newegg order numbers
- 412968624 (GPUs, $20,258.73)
- 408668539, 408668439, 408668519, 408668479, 408668459, 408668419, 408668499 (components, $17,551.34)

## Action items
- [ ] Document Visa 5680 payment as member capital contribution (or reimburse from Chase 7738)
- [x] ~~240V L6-20 electrical circuit~~ NO LONGER NEEDED -- be quiet! DPP13 supports 115-240V, runs on standard 120V outlet
- [ ] Update MACHINES.md with new workstation entry when it arrives
- [ ] Notify CPA Jonathan Francis of $37,810 capital equipment purchase for depreciation scheduling
- [ ] Consider NJ ST-3 sales tax exemption for future purchases via NeweggBusiness account

## Receipts
Stored at: `work/taxes/solar-inference-receipts/2026-04-12-workstation-purchase/`

<!-- /curator-drained -->

## Latest from gather (2026-04-16)

> [!fact] Solar Inference LLC — formation and TY2025 posture (per CPA tax-package email 2026-04-06)
> Formed **2025-09-06** in NJ as a 50/50 multi-member LLC (Alton + Aneeta). EIN on file (39-4199284). Pre-revenue loss-year initial return. Form 7004 filed 2026-03-14; extended federal deadline 2026-09-15. NJ-1065 $450 fee ($300 + $150 prepayment) due 2026-04-15 regardless of extension. K-1 from LLC won't exist until after 9/15 → CPA managing personal 1040 file-and-amend vs Form 4868 strategy. Open CPA items: RTX 5090 ($2,503.12 on Visa 5680) + LegalZoom (Visa 9425) treatment as capital contribution vs reimbursement; Operating Agreement Exhibit A (capital contributions) blank; **solar contract still in personal name** must transfer before placed-in-service for ITC; Google Workspace invoices missing. See [[business/solar-inference]] for canonical detail.

> [!fact] Sante Total recurring donor (2026-04-14)
> **Michael Quigg** — $250/month via PayPal subscription I-UWGVA4LYX3V2 (active). Annualized $3,000. Next payment 2026-05-14. Logged as ledger fact for Treasurer (Alton); donor PII not for external publication.

> [!fact] 85 Stonebridge mortgage (TY2025)
> Primary mortgage transferred mid-2025 from **Shellpoint to Cenlar**. New HELOC opened through Cenlar. 2025 Montclair property tax: **$62,187.49**. Three 1098s on file. See also [[TAXES]].

> [!fact] Newegg hardware deliveries 2026-04-14 to 2026-04-15
> Workstation components arriving in waves. Order #408668499 delivered 4/14; #412968624 (GPUs) shipped 4/14; #408668519, partial #408668419, #412970644 delivered 4/15. Newegg sent install tips for "New Motherboard + CPU" 4/15. Receipts reconcile with the $37k workstation pass-through line. Build coordination is per [[machines/gpuserver1]] / [[MACHINES]].

> [!fact] Power Mac LLC home theater repair scheduled 2026-04-28 8-9am
> Vendor Ilija Trajceski (info@power-mac.net) confirmed 2026-04-13. Coordinating with Pete Berman during overlapping wifi install window 4/27-4/29. Estimate already accepted.

<!-- curator-drained 2026-04-16T18:30:00Z from rocinante entry=gmail-2026-04-16-si-formation -->
<!-- curator-drained 2026-04-16T18:30:00Z from rocinante entry=gmail-2026-04-16-sante-quigg -->
<!-- curator-drained 2026-04-16T18:30:00Z from rocinante entry=gmail-2026-04-16-mortgage-refi-shellpoint-cenlar -->
<!-- curator-drained 2026-04-16T18:30:00Z from rocinante entry=gmail-2026-04-16-newegg-deliveries -->
<!-- curator-drained 2026-04-16T18:30:00Z from rocinante entry=gmail-2026-04-16-powermac-berman -->
