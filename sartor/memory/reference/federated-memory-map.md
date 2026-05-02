---
name: federated-memory-map
description: Topical lookup index for the WHOLE Sartor wiki — federated across sartor/memory/, work/, dashboard/, archive/, conversation_extract.py, and ~/.claude/teams/. Cures the "no memory record" failure mode by naming where each entity lives.
type: index
status: living-document
created: 2026-05-02
updated: 2026-05-02-evening
created_by: cartographer (memory-agents team)
tags: [reference/index, memory/federated]
related: [search-memory-first, artifact-vs-fact-not-found, ALTON, FAMILY, BUSINESS, TAXES, MACHINES, google-drive-catalog-2026-05-02, rtxserver-vastai-watch]
---

# Federated Memory Map

> The Sartor wiki is **federated** across multiple roots. A `Grep` for an entity restricted to `sartor/memory/**` will under-report. This file is the official table-of-contents across all roots.
>
> Companion to [[feedback/search-memory-first]] — that rule says "search the whole repo first"; this file says "here's what each part of the federation contributes." When in doubt, federated grep beats this index.

## 1. Federation scope

| Root | What it contributes |
|---|---|
| `sartor/memory/` | **Primary memory tree.** Hub files (ALTON, FAMILY, BUSINESS, TAXES, MACHINES, ASTRAZENECA, PROJECTS, SELF, LEARNINGS, PROCEDURES). Sub-trees: `family/`, `business/`, `people/`, `projects/`, `machines/`, `research/`, `reference/`, `feedback/`, `daily/`, `inbox/`, `incidents/`, `ledgers/`, `snapshots/`. |
| `work/` | **Working docs by domain.** `work/taxes/` (per-entity tax notes + `reference/document-inventory.md`, `deadlines.md`, `depreciation.md`, `prior-years.md`), `work/family/` (school, medical, important-docs), `work/solar-inference/` (solar-roof contract, hardware-specs, expansion-plans, tax-benefits, vast-ai-operations), `work/costco/` (status only). |
| `dashboard/family/` | **Live runtime state.** `finances.json` (canonical post-tax / retirement / real-estate / liabilities / income / expenses snapshot dated 2026-02-21), `update_finances.py` (line-item authority for who-pays-what), `index.html` + `server.py` (MERIDIAN dashboard at localhost:5055). |
| `sartor/conversation_extract.py` | **Explicit term → memory-file routing table.** The `ENTITY_TRIGGERS` dict (~line 387) maps strings like `"Leader Bank"`, `"Cenlar"`, `"MKA"`, `"vast.ai"`, `"Schwab"` to the canonical memory file each fact should land in. When in doubt about where a fact belongs, look here. |
| `archive/` | **Cold storage.** Old `MASTER_PLAN.md`, `IMPLEMENTATION_PLAN.md`, `BOOTSTRAP_MESH_SUMMARY.md`, the 2026-04 forensic + chrome-extension-debug bundles, loose screenshots. Sometimes the only place a fact still lives. |
| `experiments/` | Out-of-repo training/eval artifacts. Not memory; reference only. |
| `~/Downloads/` (off-repo) | Source PDFs and bank statements indexed by `work/taxes/reference/document-inventory.md`. |
| `~/.claude/teams/` (off-repo, persistent) | **Multi-agent team configurations.** Each team has a `config.json` defining roles + a member's persistent context, and an `inboxes/<member>.json` file. As of 2026-05-02 the only team is `memory-agents/` (cartographer, search-first-auditor, vast-ai-watcher, rule-author, team-lead). Distinct from `.claude/agents/` in-repo, which holds single-shot subagent definitions. |

A federated grep is `Grep` with no `path:` argument. Cost is sub-second; cost of false-unknown is a wrong answer.

## 2. Alphabetical entity index

### 185 Davis Avenue
Jointly owned **rental condo** (Alton + Aneeta). Now has a canonical hub in `BUSINESS.md::Rental Property` (added 2026-05-02 evening, commit `9d09797`); previously the textbook "no canonical hub" entity.
- **Canonical hub:** `sartor/memory/BUSINESS.md` §Rental Property — type, mortgage, insurance, tax position, doc trail
- `dashboard/family/finances.json` — value $1,157,000 (real_estate), mortgage balance $708,576 (liabilities), $4,600/mo rental income, $3,600/mo mortgage, $700/mo condo fee, $300/mo management
- `work/taxes/reference/document-inventory.md` — Leader Bank 1098 mortgage statements (TY2025 doc 09; also TY2022 "185 davis #8 1098.pdf")
- `work/family/reference/important-docs.md` — Vermont Mutual Condo Policy 1.18.25–1.18.26
- `sartor/conversation_extract.py:406` — `"Leader Bank": ("BUSINESS.md", "business", "185 Davis")` (routing rule now matches a real section)
- `sartor/memory/reference/google-drive-catalog-2026-05-02.md` — Drive 1098 surface
- `sartor/memory/feedback/search-memory-first.md` — origin incident (2026-05-02 morning)

### 85 Stonebridge Road
Primary residence, Montclair NJ (Block 1101 Lot 12).
- `dashboard/family/finances.json` — value $3,012,000, mortgage $1,869,236, HELOC $527,000, PITI $18,500/mo
- `sartor/memory/reference_home_network.md` — network topology
- `sartor/memory/BUSINESS.md` — 2025 mortgage transfer Shellpoint → Cenlar; new HELOC; property tax $62,187.49
- `sartor/memory/TAXES.md` — three 1098s on file (Shellpoint pre-transfer, Cenlar post, Cenlar HELOC)
- `work/taxes/reference/document-inventory.md` — all TY2020–TY2025 1098s
- `sartor/memory/reference/google-drive-catalog-2026-05-02.md` §A — full Drive folder tree (deed, surveys, refi pkg, appraisals)

### Alton Sartor
Head of household. Full name Emmett Alton Sartor.
- `sartor/memory/ALTON.md` — canonical profile (medical background, AZ career, AI engagements, communication style)
- `CLAUDE.md` — Household Context table
- `sartor/memory/snapshots/life-timeline.md`
- `sartor/conversation_extract.py:391`

### Amarkanth
Aneeta's father. Regular childcare support; picks up kids from school.
- `sartor/memory/people/amarkanth.md`
- `sartor/memory/FAMILY.md` Extended Family

### Andy Stecker
AZ contact. CPSO lead at AstraZeneca; cold since 2026-03-17 per [[BUSINESS#AZ Career Track]].
- `sartor/memory/people/andy-stecker.md`
- `sartor/memory/business/az-career.md`

### Aneeta Saxena (Sartor)
Co-Head of Household. ICU/epilepsy neurologist. DOB 1980-10-20. Cell (973) 303-5427. Email aneetasax@gmail.com.
- `sartor/memory/FAMILY.md` — full profile
- `sartor/memory/projects/aneeta-peer-setup.md` — Phase 1 Claude Code peer on her laptop
- `sartor/conversation_extract.py:392`
- See also: Neurvati, Biogen, RRE trip 2026-04-29

### AstraZeneca (AZ)
Alton's primary employer. Senior Medical Director, AI Innovation and Validation, Global Patient Safety. NYC office (Empire State Building) since 2026-03-31.
- `sartor/memory/ASTRAZENECA.md` — entity profile
- `sartor/memory/business/az-career.md` — career-track operational notes
- `sartor/memory/ALTON.md` — career section
- `CLAUDE.md` Identity + Domain 4 sections
- `work/taxes/reference/document-inventory.md` — W-2s 2019-2025

### Barbara Weis
Sante Total contact. Holds 2024 990-N for grant application; grant deadline 2026-04-10.
- `sartor/memory/people/barbara-weis.md`
- `sartor/memory/TAXES.md` Sante Total section

### Berman Home Systems (BHS)
Vendor that did the 2026-04-27→4/30 WiFi upgrade install. As of 2026-05-01 displaced from controller role per UniFi takeover.
- `sartor/memory/projects/unifi-takeover-2026-05-01.md` (canonical)
- `sartor/memory/projects/unifi-takeover-2026-05-01-INDEX.md` — 13-doc index
- `sartor/memory/projects/unifi-takeover-2026-05-01-pete-email-FINAL.md` — final post-takeover email
- `work/solar-inference/` — original quote/scope (BHS install was paid through Solar Inference LLC)

### Biogen
Aneeta's prior employer through mid-2025. Triggered TY2025 partial-year W-2 + 401(k) rollover 1099-R.
- `sartor/memory/TAXES.md`, `FAMILY.md`
- `work/taxes/reference/document-inventory.md` — 2021-2024 W-2s

### Cenlar
Mortgage servicer for 85 Stonebridge primary mortgage (post mid-2025 transfer) and HELOC. Also escrow for property taxes.
- `sartor/memory/BUSINESS.md`, `TAXES.md`
- `sartor/conversation_extract.py:404`
- `work/taxes/reference/document-inventory.md` — TY2025 1098s docs 08 + 10

### Chrome / CDP toolkit
Browser automation. Port 9223, profile `C:\Users\alto8\chrome-automation-profile\`, scripts `C:\Users\alto8\chrome-tools\`.
- `CLAUDE.md` Infrastructure Reference → Rocinante
- `.claude/skills/chrome-automation/`
- `sartor/memory/MACHINES.md`

### Climate First Bank (formerly First Climate)
Solar Inference LLC's solar-roof financier. $438,829 loan, 366 months, 8% APR with autopay, $0 down. **$219,414.50 disbursed to Lucent Energy 2026-03-15** — single most important item on the Solar Inference docket pending July 4 ITC deadline. Distinct entity from "First Climate" of older docs (renamed).
- `sartor/memory/business/solar-inference.md:21,48,50,92,137` — disbursement, financing terms, history line
- `sartor/memory/feedback/artifact-vs-fact-not-found.md` — origin of the "fact tracked, artifact missing" rule (2026-05-02)
- `~/Downloads/Solar Inference LLC/2 - Solar Roof/Financing/` — First Climate prequalification, terms, eSign, privacy
- `work/solar-inference/reference/document-inventory.md` §2 Solar Roof → Financing

### Disney 2026 / Disneyland
Family trip July 2026 (group: Smith/Alison, Kim Tran, Brucker, Perera, Nicole). Travel agent: Nicol Stevenson, Magical Vacation Planner.
- `sartor/memory/projects/disney-july-2026/PROJECT.md`
- `sartor/memory/FAMILY.md` Upcoming Events
- `sartor/memory/people/alison-smith.md` (group co-attendee)

### Doug Paige
Sante Total board contact. Mentioned in 2026-04-25+ daily logs.
- `sartor/memory/people/doug-paige.md`

### EPD (Enterprise Products Partners)
MLP. Generates Schedule K-1 in Aneeta's name annually.
- `sartor/memory/TAXES.md` Material Changes (item 4)
- `work/taxes/reference/document-inventory.md` — K-1s 2020, 2023, 2024, 2025

### EquityZen / Hiive
Pre-IPO investment marketplaces. EquityZen tracks Anthropic, Scale AI watchlists. Hiive surfaced Harvey AI ($190M ARR Jan 2026).
- `sartor/memory/ALTON.md` Latest from gather sections
- `sartor/memory/people/mike-silva.md` (related: AcrossCap consulting thread)

### Fidelity
Brokerage. Joint WROS account 8998, individual 1640 (Aneeta), AZ 401(k) 74304 (Alton), three UTMA accounts (5390 Vayu, 5392 Vishala, 5396 Vasu), Aneeta 4246, Schwab 669 (no activity 2025).
- `dashboard/family/finances.json` retirement breakdown
- `sartor/memory/TAXES.md`
- `work/taxes/reference/document-inventory.md`
- `sartor/conversation_extract.py:403` (Schwab)

### Goddard School of Montclair
Vasu's preschool. Teachers Samantha Ramsden, Clarissa B.
- `sartor/memory/family/vasu.md`
- `sartor/memory/FAMILY.md`
- `dashboard/family/finances.json` — $2,000/mo expense line "Goddard"

### gpuserver1
Ubuntu 22.04 server, RTX 5090, vast.ai machine 52271. IP 192.168.1.100. The first Sartor peer machine.
- `sartor/memory/MACHINES.md` — canonical
- `sartor/memory/machines/gpuserver1/` — MISSION, CRONS, HARDWARE, INDEX
- `sartor/memory/machines/gpuserver1/systemd/` — `claude-tmux.service` (auto-respawn peer Claude in tmux), `nvidia-power-cap.service` (pl=600W on boot, ordered before docker + vastai_kaalia), `rgb-status.service`
- `sartor/memory/reference/gpuserver1-operations.md`, `gpuserver1-monitoring.md`, `gpuserver1-power-logging.md`, `gpuserver1-delegation.md`
- `sartor/memory/reference/OPERATING-AGREEMENT.md` — peer governance
- `sartor/memory/inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md` — replication template (canonical "how to bring up the second host")
- `CLAUDE.md` Infrastructure Reference

### Heidi Gorton
Wohelo Camp director. Confirmed Vishala's late signup; oversees birthday-visit policy.
- `sartor/memory/family/vishala.md`
- `sartor/memory/family/active-todos.md`

### Ilan Grunwald
Personal contact added 2026-04-10.
- `sartor/memory/people/ilan-grunwald.md`

### Ilija Trajceski (Power Mac LLC)
Home theater repair vendor. Visit 2026-04-28 8-9am; coordinated with Berman wifi install.
- `sartor/memory/family/active-todos.md`
- `sartor/memory/BUSINESS.md` Recent Events / gather
- `sartor/memory/inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-power-mac-pete-berman-coordination.md`

### Jonathan Francis (CPA)
Francis & Company. jf@francis-cpa.com, (914) 488-5727. Handles personal 1040 + Solar Inference 1065. Does NOT handle Sante Total.
- `sartor/memory/people/jonathan-francis.md`
- `sartor/memory/TAXES.md`
- `work/taxes/` — engagement / correspondence trail

### Kaalia (vast.ai daemon)
Vast.ai's host-side daemon. Runs on gpuserver1 as `vastai_kaalia` user. Heartbeats 52.90.216.45:7071. Auto-starts after reboot. Docker shim at `/var/lib/vastai_kaalia/latest/kaalia_docker_shim`. **Not yet installed on rtxpro6000server** — blocker #5 in the rtxserver onboarding tracker.
- `sartor/memory/MACHINES.md` Vast.ai Hosting
- `sartor/memory/projects/rtxserver-vastai-watch.md` — install pending, Q1 2026 docs reviewed
- `sartor/memory/inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md` — installer recipe

### Leader Bank
Mortgage servicer for 185 Davis condo.
- `sartor/conversation_extract.py:406` — explicit routing
- `work/taxes/reference/document-inventory.md` — TY2025 1098 doc 09
- `sartor/memory/feedback/search-memory-first.md` — origin incident
- (NB: BUSINESS.md does not yet have a 185-Davis subsection though `conversation_extract.py` routes there — open documentation gap)

### Loki / Ghosty / Pickle
Three cats. Loki has small cell lymphoma; on chemo (ordered through Chewy).
- `sartor/memory/FAMILY.md` (incl. drained inbox entry)
- `sartor/conversation_extract.py:388-390`

### Lucent Energy / Tesla Solar Roof
$438,829 signed contract 2025-09-03 (basis is canonical despite Alton's verbal "~$450k" to CPA). Installation tentatively last week of April; must precede 2026-07-04 ITC deadline.
- `sartor/memory/BUSINESS.md` — canonical basis explained
- `sartor/memory/TAXES.md` Key Tax Strategy Items — $131,649 ITC + $373,005 bonus depreciation projection
- `sartor/memory/business/solar-inference.md`
- `work/solar-inference/solar-roof.md`, `work/solar-inference/reference/document-inventory.md` §2 Solar Roof

### Mike Silva (AcrossCap)
Investment/capital firm contact. Live 2026-04-16+ thread; first prospective recipient of AI consulting side gig.
- `sartor/memory/people/mike-silva.md`
- `sartor/memory/ALTON.md` Latest from gather (2026-04-17)

### Memory-Agents Team
Multi-agent persistent team launched 2026-05-02 for memory-discipline work. Lives at `~/.claude/teams/memory-agents/` (off-repo). Members: **cartographer** (this map's author), **search-first-auditor** (catches missed search-first opportunities), **vast-ai-watcher** (tracks rtxserver vast.ai onboarding), **rule-author** (drafts memory-discipline feedback rules), **team-lead** (orchestrator). Each member has a `<name>.json` inbox; the team has a shared `config.json`. Outputs land in-repo under `sartor/memory/reference/` and `sartor/memory/feedback/`.
- `~/.claude/teams/memory-agents/config.json` — team definition + member personas
- `~/.claude/teams/memory-agents/inboxes/{cartographer,rule-author,search-first-auditor,vast-ai-watcher,team-lead}.json` — message queues
- In-repo deliverables: `sartor/memory/reference/federated-memory-map.md` (this file), `sartor/memory/reference/search-first-audit-log.md`, `sartor/memory/projects/rtxserver-vastai-watch.md`, `sartor/memory/feedback/search-memory-first.md`, `sartor/memory/feedback/artifact-vs-fact-not-found.md`

### MKA (Montclair Kimberley Academy)
Vayu and Vishala's school. Tuition due 2026-05-10. Dean of Student Life Kelley Arau leaving end of 2025-26 year.
- `sartor/memory/family/vayu.md`, `family/vishala.md`, `FAMILY.md`
- `sartor/memory/family/active-todos.md`
- `sartor/conversation_extract.py:412`
- `dashboard/family/finances.json` — implicitly via "Tutoring" $10,000/mo

### Neurvati Neurosciences Inc
Aneeta's current employer (Medical Director) since mid-2025. 230 Park Ave Ste 2830 NY. EIN 87-1954898. Anti-seizure medication development.
- `sartor/memory/FAMILY.md`
- `sartor/memory/projects/sartor-agent-os/SPECS/NEURVATI-FIREWALL.md` — privacy firewall design
- `sartor/memory/TAXES.md` — TY2025 W-2 Box 1 $194,289.10, NJ withheld $11,276.62
- `work/taxes/reference/document-inventory.md` — TY2025 docs 02a + 03

### Pete Berman
Owner of Berman Home Systems (Pete@bermanhomesystems.com). Handoff partner for UniFi takeover.
- `sartor/memory/projects/unifi-takeover-2026-05-01-pete-email-FINAL.md`
- `sartor/memory/projects/unifi-takeover-2026-05-01-draft-pete-email.md`

### Pool Guyz LLC
Pool maintenance vendor for 85 Stonebridge. Service Log #36510285 (Apr 11, technician Danny Saracho).
- `sartor/memory/ALTON.md` Latest from gather (2026-04-11)

### Rocinante
Primary workstation. Windows 10, 3 monitors, 2560x1440 primary. Path `C:\Users\alto8\Sartor-claude-network\`. The git push origin and Chrome automation host. Owner of UniFi controller as of 2026-05-01.
- `sartor/memory/MACHINES.md` — canonical
- `sartor/memory/machines/rocinante/HARDWARE.md`
- `CLAUDE.md` Infrastructure Reference

### Roshni Shah / Deborah Gordon (MKA)
4th-grade math teacher (Roshni) + Math Dean (Deborah). Flagged Vayu math support 2026-04-14.
- `sartor/memory/family/vayu.md`
- `sartor/memory/FAMILY.md` Open Action Items

### rtxpro6000server (rtxserver)
Third Sartor peer machine. Ubuntu 22.04 HWE, AMD Threadripper PRO 7975WX, 251GB DDR5, 2x RTX PRO 6000 Blackwell (96GB each = 192GB total), 450W per-card cap. IP 192.168.1.157, BMC at 192.168.1.156. **Vast.ai onboarding paused 2026-05-02 evening** pending Verizon Fios WAN-path decision (no admin to CR1000A; UCG-Pro pivot under consideration).
- **Living tracker:** `sartor/memory/projects/rtxserver-vastai-watch.md` — blockers, open work, pre-fire research (corrected `-g 1.25 -m 2` flags), greenlight verdict pending WAN decision
- `sartor/memory/MACHINES.md`
- `sartor/memory/machines/rtxpro6000server/` — HARDWARE.md, BMC.md, CRONS.md, MISSION-v0.1.md, `onboarding-staged/`, `systemd/` (`nvidia-power-cap.service`, `sartor-claude-peer.service` user-level auto-respawn)
- `sartor/memory/inbox/rocinante/rtxserver-vastai-decisions-2026-05-02.md` — Alton's commercial decisions ($2.50/hr, -m 2, port 40100-40199)
- `sartor/memory/inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md` — gpuserver1's self-contained replication template
- `CLAUDE.md` Infrastructure Reference

### Samantha Ramsden / Clarissa B
Vasu's Goddard teachers.
- `sartor/memory/family/vasu.md`
- `sartor/memory/FAMILY.md`

### Sante Total
501(c)(3) nonprofit (healthcare in Haiti and Kenya). Alton is Treasurer. Recurring donor Michael Quigg ($250/mo via PayPal subscription I-UWGVA4LYX3V2).
- `sartor/memory/business/sante-total.md` — operations
- `sartor/memory/BUSINESS.md` Sante Total section
- `sartor/memory/TAXES.md` 990-N section
- `work/taxes/reference/document-inventory.md` — 990-N e-Postcards 2020-2024 + IRS determination letter

### Schwab
Brokerage. Account 669 had no reportable activity in 2025 (confirmed Jan 22, 2026).
- `sartor/conversation_extract.py:403`
- `sartor/memory/TAXES.md`

### Selective Insurance
Homeowner's insurance for 85 Stonebridge. Policy Oct 2024 – Oct 2025; 2025-10-23 payment.
- `work/family/reference/important-docs.md`
- `sartor/memory/reference/google-drive-catalog-2026-05-02.md`

### Shellpoint
Pre-transfer mortgage servicer for 85 Stonebridge primary mortgage (until mid-2025).
- `sartor/memory/BUSINESS.md`, `TAXES.md`
- `sartor/conversation_extract.py:405`
- `work/taxes/reference/document-inventory.md` TY2024 + TY2025 1098s

### Solar Inference LLC
50/50 multi-member NJ LLC (Alton + Aneeta). Formed 2025-09-06. EIN 39-4199284. Pre-revenue. Form 7004 extension filed 2026-03-14. Holds gpuserver1 (vast.ai), and will own the Tesla Solar Roof + dual RTX PRO 6000 workstation pre-in-service.
- `sartor/memory/business/solar-inference.md` — operational
- `sartor/memory/business/rental-operations.md`, `rental-policy.md`
- `sartor/memory/business/hours-log/` — material participation tracking
- `sartor/memory/BUSINESS.md`, `TAXES.md`
- `work/solar-inference/` — full working directory (solar-roof.md, hardware-specs.md, expansion-plans.md, tax-benefits.md, vast-ai-operations.md, document-inventory.md)
- `~/Downloads/Solar Inference LLC/` — formation docs, contracts, receipts

### Tribeca Pediatrics
Family pediatrician (active provider; confirmed via 2026-04-13 InstaMed payment $170.28 for Vayu).
- `sartor/memory/family/vayu.md`
- `sartor/memory/FAMILY.md` Open Action Items
- `sartor/memory/inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-tribeca-pediatrics-payment.md`

### UniFi Network ("Sartor-Saxena-Claude Network")
Locally administered as of 2026-05-01. 9 devices (1 USW-Pro-Max-24-PoE switch + 8 WiFi 7 APs). Controller on Rocinante at https://192.168.1.171:8443. Single SSID `LGP123`.
- `sartor/memory/projects/unifi-takeover-2026-05-01-INDEX.md` — 13-doc dispatch
- `sartor/memory/projects/unifi-takeover-2026-05-01.md` — playbook
- `sartor/memory/MACHINES.md` Network section
- `sartor/memory/reference_home_network.md`

### Vasu Sartor
Youngest. DOB 2022-01-14 (age 4). Goddard School.
- `sartor/memory/family/vasu.md`
- `sartor/memory/FAMILY.md`
- `sartor/conversation_extract.py:395`

### Vayu Sartor
Oldest. DOB 2015-08-14 (age 10). MKA middle school. Diagnosed with ADHD and enuresis.
- `sartor/memory/family/vayu.md`
- `sartor/memory/FAMILY.md`
- `sartor/memory/ledgers/kids.md`
- `sartor/conversation_extract.py:393`

### Vermont Mutual
Condo insurance for 185 Davis Avenue. Policy 1.18.25 – 1.18.26.
- `work/family/reference/important-docs.md`
- (Not yet in `sartor/memory/` proper — federation gap)

### Verizon Fios / CR1000A
Home ISP + ISP-supplied router (Verizon CR1000A WNC, MAC `ac:91:9b:6c:9b:69`, 192.168.1.1, 2.5GBASE-T LAN). HTTPS admin (self-signed, Vue.js SPA) — **Alton has no admin credential**, blocking direct port-forward changes; this is the active gating constraint on rtxserver vast.ai onboarding. DMZ host = 192.168.1.100 for vast.ai. Public IP 100.1.100.63. Hairpin NAT broken (worked-around with iptables OUTPUT DNAT). Bridge-mode pivot to UCG-Pro is on the table.
- `sartor/memory/reference_home_network.md` (line 51)
- `sartor/memory/reference/network.md`
- `sartor/memory/MACHINES.md` Network section
- `sartor/memory/projects/unifi-takeover-2026-05-01-network-census.md` (line 159 — full ARP/DHCP entry)
- `sartor/memory/projects/unifi-takeover-2026-05-01-final-census.md` (line 196)
- `sartor/memory/projects/unifi-takeover-2026-05-01-phase3-hardening-plan.md` — IPv6 firewall + DHCP scope notes
- `sartor/memory/projects/unifi-takeover-2026-05-01-INDEX.md` (UCG-Pro decision point #6)
- `sartor/memory/projects/rtxserver-vastai-watch.md` — blocker #1 (the WAN-decision)
- `sartor/memory/LEARNINGS.md`
- `CLAUDE.md` Infrastructure Reference → Network
- `sartor/conversation_extract.py:398`

### Vishala Sartor
Middle child. DOB 2017-07-29 (age 8). MKA primary. Wohelo summer camp Jun 25 – Aug 12, 2026.
- `sartor/memory/family/vishala.md`
- `sartor/memory/FAMILY.md`
- `sartor/conversation_extract.py:394`

### vast.ai
GPU rental marketplace. Account alto84@gmail.com (Google OAuth). Solar Inference LLC owns machine 52271 (RTX 5090 on gpuserver1, listed at $0.30/hr on-demand, under reserved contract C.34113802 at ~$0.20/hr through 2026-08-24). **Second machine pending**: rtxpro6000server with target list `-g 1.25 -b 1.00 -s 0.10 -m 2 -l "6 months"` ($2.50/hr dual-rental); paused on Verizon Fios WAN-decision. Vast.ai docs explicitly forbid host GPU usage during paid rental — `vastai_kaalia` heartbeat to 52.90.216.45:7071 is the host-side trust anchor.
- **Living tracker (rtxserver):** `sartor/memory/projects/rtxserver-vastai-watch.md`
- `sartor/memory/MACHINES.md` Vast.ai Hosting
- `sartor/memory/business/solar-inference.md`
- `sartor/memory/business/rental-operations.md`, `business/rental-policy.md`
- `sartor/memory/reference/reference_vastai_market_pricing.md`
- `sartor/memory/skills/gpuserver1-market-pricing/`
- `.claude/skills/vastai-market-scan/SKILL.md`, `.claude/skills/peer-comms/SKILL.md`
- `sartor/memory/inbox/rocinante/rtxserver-vastai-decisions-2026-05-02.md`
- `sartor/memory/inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md`
- `sartor/conversation_extract.py:399-400`
- `work/solar-inference/vast-ai-operations.md`

### Wohelo Camp
Vishala's summer camp 2026 (full session, Jun 25 – Aug 12, Raymond ME). Director Heidi Gorton. $500 deposit + $12,400 balance ($12,900 total) due 2026-05-15.
- `sartor/memory/family/vishala.md`
- `sartor/memory/FAMILY.md`
- `sartor/memory/family/active-todos.md`
- `sartor/memory/inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-wohelo-payment-12900.md`
- `work/family/reference/important-docs.md` Wohelo section

## 3. Key reference / process indexes (the indexes themselves)

| Index | Lives at | Indexes |
|---|---|---|
| Memory root index | `sartor/memory/MEMORY.md` | All hub files + sub-trees |
| People directory | `sartor/memory/people/INDEX.md` | All people dossiers |
| Projects directory | `sartor/memory/projects/INDEX.md` | All active projects |
| Reference directory | `sartor/memory/reference/INDEX.md` | All reference docs |
| Research roof | `sartor/memory/research/INDEX.md` | ccp-alignment, persona-engineering, pharmacovigilance |
| Tax document inventory | `work/taxes/reference/document-inventory.md` | All tax PDFs in Downloads, by year and entity |
| Family important docs | `work/family/reference/important-docs.md` | Passports, birth certs, health, insurance, school |
| Solar Inference docs | `work/solar-inference/reference/document-inventory.md` | LLC formation, solar roof, GPU rig, tax/accounting, vast.ai guides |
| Memory cartography | `sartor/memory/projects/family-thread-dossier/memory-cartography.md` | Inventory of every file in `sartor/memory/` (excl. `family/`), scored by family-relevance |
| Google Drive catalog | `sartor/memory/reference/google-drive-catalog-2026-05-02.md` | ~135 Drive docs across 16 queries (snapshot) |
| Operating Agreement | `sartor/memory/reference/OPERATING-AGREEMENT.md` | Peer-machine governance (Rocinante ↔ gpuserver1 ↔ rtxpro6000server) |
| Household Constitution | `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` (v0.3) | Master rules for the home agent |
| rtxserver vast.ai watch | `sartor/memory/projects/rtxserver-vastai-watch.md` | Living tracker: blockers, open work, pre-fire research, resume command-list |
| Search-first audit log | `sartor/memory/reference/search-first-audit-log.md` | Incidents where federated search wasn't run (memory-agents output) |
| Memory-agents team config | `~/.claude/teams/memory-agents/config.json` | Team roster + member personas (off-repo, persistent) |

## 4. Worked example — "185 Davis Avenue"

A reader asks "what's 185 Davis?" — here is the federated reconstruction.

| Source | What it tells us |
|---|---|
| `dashboard/family/finances.json` | Real estate asset, value $1,157,000 (Avg Zillow/Redfin Feb 2026); mortgage liability balance $708,576; rental income line "$4,600 — 185 Davis rental"; expense lines "$3,600 — 185 Davis mortgage", "$700 — 185 Davis Condo Fee", "$300 — 185 Management" |
| `work/taxes/reference/document-inventory.md` | TY2025 1098 from Leader Bank (doc 09); TY2022 "185 davis #8 1098.pdf"; TY2023 mortgage statement; TY2024 missing |
| `work/family/reference/important-docs.md` | Vermont Mutual Condo Policy, coverage period 1.18.25 – 1.18.26 |
| `sartor/conversation_extract.py:406` | Routing rule: any sentence containing "Leader Bank" should route to `BUSINESS.md` under entity "185 Davis" |
| `sartor/memory/feedback/search-memory-first.md` | Records the 2026-05-02 incident where this exact federated reconstruction was missed |

**Reconstructed entity:** 185 Davis Avenue is a jointly-owned **rental condo** mortgaged through **Leader Bank**, insured through **Vermont Mutual** (condo policy), generating $4,600/mo rental income against $3,600 mortgage + $700 condo fee + $300 management fees. Documented across **5 federation roots**, with canonical hub at `BUSINESS.md::Rental Property` as of 2026-05-02 evening (commit `9d09797`).

**Federation gap closed 2026-05-02 evening:** earlier today this entry flagged that `sartor/memory/BUSINESS.md` had no 185 Davis section despite `conversation_extract.py` routing facts there. The `## Rental Property — 185 Davis Avenue` section now exists and explicitly references the routing rule, finances.json, and the doc trail. Federation gap resolved; the worked example stands as a method demonstration.

## 5. Exclusions (do not list)

Per CLAUDE.md privacy rules:

- SSNs, EINs (except where already in Constitution / CLAUDE.md)
- Account numbers (full)
- Passwords, PSKs, API keys (point at the file that holds them, do not transcribe)
- Children's full DOBs in any external-facing artifact (DOBs in this file are internal-only and already documented in `family/*.md`)
- Medical specifics for any family member beyond high-level diagnosis already on the family page

Names, addresses, schools, vendors, entity-relationships are fine; that is the point of this file.

## 6. Maintenance

- This is a **living document**. Add an entry whenever a new entity surfaces in 2+ federation roots.
- Bump `updated:` and add a `## History` line if the schema or scope changes.
- When `sartor/conversation_extract.py:ENTITY_TRIGGERS` gains a new key, add the corresponding entry here.
- When a federation gap is found (entity routed to file X but not actually documented in X), flag it in-line as I did for 185 Davis under BUSINESS.md.
- The first build is intentionally narrow ~50 high-value entities. Sweep targets for the next pass: Schools deeper (specific MKA staff with dossier potential), AZ colleagues beyond Andy Stecker, Hingos surveyor, all of `archive/` for legacy entity bindings, full vendor index from `daily/2026-04-*`.

## History

- 2026-05-02 evening: Refresh pass. Promoted 185 Davis to "canonical hub at BUSINESS.md::Rental Property" (commit 9d09797 closed the gap). Added new entities: Climate First Bank ($219,414.50 disbursement; new `feedback/artifact-vs-fact-not-found.md`), Verizon CR1000A (the actual ISP-side router, MAC `ac:91:9b:6c:9b:69`, blocking rtxserver vast.ai onboarding), Memory-Agents Team (this team). Added systemd-unit refs to gpuserver1 (`claude-tmux`, `nvidia-power-cap`, `rgb-status`) and rtxpro6000server (`nvidia-power-cap`, `sartor-claude-peer`). Re-pointed vast.ai and rtxpro6000server to the new `projects/rtxserver-vastai-watch.md` living tracker. Added new federation root: `~/.claude/teams/` (off-repo, persistent multi-agent team configs). Updated §3 indexes table with three new entries. Worked example §4 now reflects the closed gap rather than an open one.
- 2026-05-02: Initial build by cartographer (memory-agents team). 50 entities indexed across 6 federation roots. Triggered by 185 Davis incident (see [[feedback/search-memory-first]]).
