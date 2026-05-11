---
name: memory-cartography
description: Inventory of every memory file outside family/, scored by family-relevance, with stale and bloat flags. Built by memory-cartographer agent for the family-thread long-running session.
type: project
status: active
created: 2026-05-02
updated: 2026-05-02
---

# Memory Cartography (everything outside `family/`)

> Inventory-only; no edits made. Scope is the memory tree at `C:\Users\alto8\.claude\projects\C--Users-alto8\memory\` excluding `family/`. Companion to the `family-curator` agent which owns `family/`.

## Summary numbers

- Total markdown files scanned: **563**
- Family-relevance buckets: high=29, med=67, low=359, none=108
- Stale (mtime > 60d): **21**
- Bloat (>500 lines): **25**
- Total size: 5860.9 KB across 79,577 lines

## File counts by top-level directory

| top-level | total | high | med | low | none |
|---|---:|---:|---:|---:|---:|
| `inbox` | 260 | 10 | 41 | 205 | 4 |
| `research` | 93 | 0 | 0 | 0 | 93 |
| `projects` | 57 | 10 | 12 | 32 | 3 |
| `daily` | 44 | 0 | 0 | 44 | 0 |
| `reference` | 30 | 3 | 2 | 22 | 3 |
| `(root)` | 19 | 2 | 2 | 14 | 1 |
| `feedback` | 17 | 1 | 3 | 12 | 1 |
| `machines` | 12 | 1 | 2 | 9 | 0 |
| `people` | 10 | 0 | 0 | 10 | 0 |
| `business` | 8 | 0 | 4 | 3 | 1 |
| `skills` | 5 | 0 | 0 | 3 | 2 |
| `snapshots` | 4 | 1 | 1 | 2 | 0 |
| `ledgers` | 2 | 1 | 0 | 1 | 0 |
| `incidents` | 1 | 0 | 0 | 1 | 0 |
| `indexes` | 1 | 0 | 0 | 1 | 0 |


## HIGH family-relevance files

Sorted by lines desc within bucket. These are documents `family-curator` and the team lead should know exist.

| path | lines | updated | rel | flags | purpose |
|---|---:|---|---|---|---|
| `reference/HOUSEHOLD-CONSTITUTION.md` | 1300 | 2026-04-24 | high | bloat | The Sartor Home Agent Constitution |
| `reference/archive/HOUSEHOLD-CONSTITUTION-v0.2.md` | 1263 | 2026-04-19 | high | bloat | The Sartor Home Agent Constitution |
| `FAMILY.md` | 385 | 2026-05-01 | high |  | Family |
| `projects/family-memory-fixup.md` | 285 | 2026-05-01 | high |  | Detailed plan to clean up the family memory layer — consolidate scattered todos, prune accreting files, separate the fou |
| `projects/unifi-takeover-2026-05-01-nest-retirement.md` | 281 | 2026-05-01 | high |  | Investigation and retirement plan for the Google Nest WiFi mesh now that the household has migrated to UniFi LGP123. Inc |
| `reference/archive/HOUSEHOLD-CONSTITUTION-v0.1.md` | 243 | 2026-04-18 | high |  | The Sartor Home Agent Constitution |
| `machines/rocinante/HARDWARE.md` | 134 | 2026-04-26 | high |  | Bill of materials and hardware-specific quirks for Rocinante, the Windows household coordination hub. First formal inven |
| `projects/aneeta-peer-setup.md` | 132 | 2026-05-02 | high |  | Setup guide for Aneeta's Claude Code peer instance on the Sartor network. Phase 1 = her existing personal laptop (lightw |
| `projects/disney-july-2026/PROJECT.md` | 115 | 2026-04-13 | high |  | Disney Trip — July 16–19, 2026 (Disneyland, Anaheim CA) |
| `projects/unifi-takeover-2026-05-01-INDEX.md` | 111 | 2026-05-01 | high |  | Single dispatch page for the 2026-05-01 UniFi network takeover. Indexes all 13 child docs, the on-disk backup directory, |
| `projects/sartor-agent-os/INDEX.md` | 97 | 2026-05-01 | high |  | HEARTH — household agent program |
| `projects/2025-photo-book/PROJECT.md` | 92 | 2026-04-13 | high |  | 2025 Family Photo Book |
| `reference_home_network.md` | 79 | 2026-05-01 | high |  | 85 Stonebridge network topology — Sartor-Saxena-Claude Network (UniFi, locally administered), Sonos speakers, Google Hom |
| `projects/unifi-takeover-2026-05-01-unknown-laptop.md` | 69 | 2026-05-01 | high |  | Identification of LAPTOP-C4A43U6V at 192.168.1.193 — unknown Windows laptop on the family network. |
| `ledgers/kids.md` | 68 | 2026-04-18 | high |  | Kids Ledger |
| `snapshots/calendar-2026-04.md` | 58 | 2026-04-03 | high |  | Calendar Snapshot -- April 2026 |
| `projects/unifi-takeover-2026-05-01-kidsroom-speaker.md` | 57 | 2026-05-01 | high |  | Investigation of "Kids room speaker.p," SSID broadcasting from inside the house. Identification + location + disposition |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-72a1017f5712.md` | 50 | 2026-04-19 | high |  | Proposed memory: wifi_password |
| `inbox/rocinante/proposed-memories/2026-05-02/ce-1777692603-f059fbcca43c.md` | 50 | 2026-05-01 | high |  | Proposed memory: wifi_password |
| `inbox/rocinante/proposed-memories/2026-05-02/ce-1777692603-f9c738f0851c.md` | 50 | 2026-05-01 | high |  | Proposed memory: wifi_password |
| `projects/family-todos-longrunning-thread.md` | 49 | 2026-05-02 | high |  | Persistent Claude Code thread Alton is keeping alive to (a) actually knock down family to-dos and (b) build the memory + |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-wohelo-payment-12900.md` | 47 | 2026-04-19 | high |  | Wohelo Camp 2026: Vishala enrolled, $12,900 check + $500 deposit owed |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-17/ce-1776396603-820f0319f906.md` | 47 | 2026-04-19 | high |  | Proposed memory: entity_vishala |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-17/ce-1776396603-e73bbd302d41.md` | 47 | 2026-04-19 | high |  | Proposed memory: entity_aneeta |
| `inbox/rocinante/proposed-memories/2026-04-26/ce-1777174205-e73bbd302d41.md` | 47 | 2026-05-01 | high |  | Proposed memory: entity_aneeta |
| `inbox/rocinante/proposed-memories/2026-04-27/ce-1777260605-e73bbd302d41.md` | 47 | 2026-05-01 | high |  | Proposed memory: entity_aneeta |
| `feedback/gather-triage-2026-04-16.md` | 39 | 2026-04-18 | high |  | Pre-filter rules for Gmail/Calendar gather runs — unsubscribes + recruiter filter + declined-opportunity list as of 2026 |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-aneeta-employer-change.md` | 39 | 2026-04-19 | high |  | Aneeta employment: left Biogen mid-2025, joined Neurvati Neurosciences Inc. |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-tribeca-pediatrics-payment.md` | 29 | 2026-04-19 | high |  | Pediatrician confirmed: Tribeca Pediatrics (active provider) |


## MED family-relevance files

| path | lines | updated | rel | flags | purpose |
|---|---:|---|---|---|---|
| `projects/unifi-takeover-2026-05-01-final-census.md` | 299 | 2026-05-01 | med |  | Final clean-state network census after the full takeover, PSK rotation, SSID consolidation, 4-AP cleanup, channel re-pla |
| `projects/unifi-takeover-2026-05-01.md` | 273 | 2026-05-02 | med |  | Complete software-only takeover of the Berman Home Systems-installed UniFi network. 9 devices (1 switch + 8 APs) migrate |
| `ALTON.md` | 269 | 2026-04-29 | med |  | Alton - User Profile |
| `TAXES.md` | 257 | 2026-04-19 | med |  | Tax Preparation -- Tax Year 2025 |
| `projects/unifi-takeover-2026-05-01-network-census.md` | 253 | 2026-05-01 | med |  | Complete network census post-takeover. Every device, every client, every byte counter. Snapshot at 2026-05-01 evening. |
| `projects/unifi-takeover-2026-05-01-phase3-hardening-plan.md` | 239 | 2026-05-01 | med |  | Phase 3 hardening plan for the post-takeover UniFi network — VLAN segmentation, channel re-plan, IPv6 firewall, auto-upd |
| `machines/rtxpro6000server/HARDWARE.md` | 201 | 2026-04-29 | med |  | Bill of materials and hardware-specific quirks for rtxpro6000server. BoM verified against the 2026-04-12 build doc; live |
| `business/hours-log/system-design-2026-05-02.md` | 165 | 2026-05-02 | med |  | Design for automatic capture of Alton's hours of material participation in Solar Inference LLC and other Sartor entities |
| `projects/memory-system-v2/04-housekeeping.md` | 164 | 2026-04-19 | med |  | Phase 1D Housekeeping Report |
| `projects/unifi-takeover-2026-05-01-report.md` | 153 | 2026-05-01 | med |  | Complete report of the UniFi takeover from Berman Home Systems to local Sartor admin, executed 2026-05-01. Includes the  |
| `projects/unifi-led-direct-control.md` | 152 | 2026-05-02 | med |  | Direct sysfs LED control on UniFi U7-Pro APs via SSH. Confirms we have root, can write /sys/class/leds/led_{blue,white}/ |
| `reference/vastai-dispatch-wrapper-proposal.md` | 151 | 2026-04-11 | med |  | vast.ai Dispatch Wrapper — Proposal (awaiting Alton Q3) |
| `projects/unifi-takeover-2026-05-01-drive-cleanup.md` | 137 | 2026-05-01 | med |  | UniFi takeover 2026-05-01 — Drive cleanup (BLOCKED) |
| `projects/unifi-takeover-2026-05-01-psk-rotation-plan.md` | 127 | 2026-05-01 | med |  | Proposed PSK rotation plan for Berman Net + GhLoP SSIDs. Pre-execution; awaiting Alton's approval. |
| `inbox/gpuserver1/_processed/2026-04-19_rental-monitoring-fixes.md` | 124 | 2026-04-19 | med |  | Task: Rental-monitoring fixes for machine 52271 |
| `projects/unifi-takeover-2026-05-01-cleanup-summary.md` | 121 | 2026-05-01 | med |  | Cleanup-pass summary for the UniFi takeover. Files audited, indexes built, cross-references added, tmp artifacts deleted |
| `business/rental-operations.md` | 117 | 2026-04-11 | med |  | Rental Operations Framework |
| `snapshots/life-timeline.md` | 108 | 2026-04-03 | med |  | Life Timeline -- Emmett Alton Sartor |
| `machines/gpuserver1/HARDWARE.md` | 94 | 2026-04-26 | med |  | Bill of materials and hardware-specific quirks for gpuserver1. Sourced from the original 9/29/2025 Newegg order (Solar I |
| `inbox/rocinante/_processed/2026-04-19_rental-fixes-outcome.md` | 91 | 2026-04-19 | med |  | Rental Monitoring Fixes — Outcome Report |
| `business/rental-policy.md` | 75 | 2026-04-25 | med |  | What activities are allowed on gpuserver1 (and any future Sartor machine listed on a GPU rental marketplace) during an a |
| `inbox/gpuserver1/_processed/2026-04-19_heartbeat-and-gateway.md` | 73 | 2026-04-19 | med |  | Task: Heartbeat amendment + gateway cron decision + inbox housekeeping |
| `inbox/rocinante/2026-04-24_vastai-re-rental-review.md` | 72 | 2026-04-24 | med |  | Vast.ai re-rental review after 48h network outage |
| `reference/AGREEMENT-SUMMARY.md` | 65 | 2026-04-11 | med |  | Operating Agreement v1.0: Executive Summary for Alton |
| `inbox/rocinante/rtxserver-vastai-decisions-2026-05-02.md` | 63 | 2026-05-02 | med |  | Alton's answers to the 6 open questions raised in `inbox/gpuserver1/rtxserver-vastai-onboarding-2026-05-02.md`. Captured |
| `inbox/rtxpro6000server/PHONE-HOME-cato-003-charges.md` | 62 | 2026-04-26 | med |  | rtxserver phone-home — Cato-003 verify pass on v1.2 returned REVISE with four small patches. Phase 1 NOT fired. Awaiting |
| `business/hours-log/2025-06-to-2026-05-estimate.md` | 60 | 2026-05-02 | med |  | Conservative estimate of Alton Sartor's hours of material participation in Solar Inference LLC over the past 12 months ( |
| `projects/unifi-takeover-2026-05-01-draft-pete-email.md` | 54 | 2026-05-01 | med |  | Draft email to Pete Berman (Pete@bermanhomesystems.com) requesting AP/controller handoff and offering security improveme |
| `feedback/feedback_pricing_autonomy.md` | 52 | 2026-04-18 | med |  | Machine agents in the Sartor household (gpuserver1 now, Blackwell and future peers later) have delegated pricing authori |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-287ba3e0a7cc.md` | 50 | 2026-04-19 | med |  | Proposed memory: rental_price |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/ce-1776310201-ca4ca91ca288.md` | 47 | 2026-04-19 | med |  | Proposed memory: entity_alton |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-17/ce-1776396603-ca4ca91ca288.md` | 47 | 2026-04-19 | med |  | Proposed memory: entity_alton |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-18/ce-1776483003-ca4ca91ca288.md` | 47 | 2026-04-19 | med |  | Proposed memory: entity_alton |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-19/ce-1776569403-ca4ca91ca288.md` | 47 | 2026-04-19 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-04-20/ce-1776655803-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-04-20/ce-1776655803-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-04-21/ce-1776742203-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-04-21/ce-1776742203-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-04-22/ce-1776828603-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-04-22/ce-1776828603-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-04-23/ce-1776915003-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-04-23/ce-1776915003-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-04-24/ce-1777001404-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-04-24/ce-1777001404-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-04-25/ce-1777087803-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-04-25/ce-1777087803-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-04-26/ce-1777174205-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-04-26/ce-1777174205-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-04-27/ce-1777260605-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-04-27/ce-1777260605-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-04-28/ce-1777347004-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-04-28/ce-1777347004-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-04-29/ce-1777433405-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-04-29/ce-1777433405-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-04-30/ce-1777519805-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-04-30/ce-1777519805-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-05-01/ce-1777606209-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-05-01/ce-1777606209-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/rocinante/proposed-memories/2026-05-02/ce-1777692603-48ea59e25322.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_rental |
| `inbox/rocinante/proposed-memories/2026-05-02/ce-1777692603-ca4ca91ca288.md` | 47 | 2026-05-01 | med |  | Proposed memory: entity_alton |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-power-mac-pete-berman-coordination.md` | 39 | 2026-04-19 | med |  | Power Mac LLC scheduled for 2026-04-28, will coordinate with Pete Berman |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-mortgage-refi-shellpoint-cenlar.md` | 38 | 2026-04-19 | med |  | 85 Stonebridge: 2025 mortgage transfer Shellpoint -> Cenlar; new HELOC opened |
| `projects/unifi-takeover-2026-05-01-pete-email-FINAL.md` | 38 | 2026-05-01 | med |  | Final post-takeover email to Pete Berman after revision. Ready to send. |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-tax-extension-payments.md` | 35 | 2026-04-19 | med |  | 2025 tax extension payments: $15k IRS + $3k NJ (CPA-prepared, debited Wed 4/15) |
| `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-az-role-change-confirmed.md` | 33 | 2026-04-19 | med |  | AZ role change confirmed (per Alton, 2026-04-13) |
| `feedback/feedback_objective_level_delegation.md` | 23 | 2026-04-11 | med |  | When dispatching work to gpuserver1 or future peer machines (Blackwell workstation etc.), state the objective and trust  |
| `feedback/feedback_no_permissions.md` | 11 | 2026-04-12 | med |  | Always use bypassPermissions mode for agents - never prompt Alton for tool approvals |


## LOW family-relevance — only bloat or stale shown

Most LOW files are routine infra. This table surfaces only the ones that look like cleanup candidates.

| path | lines | updated | rel | flags | purpose |
|---|---:|---|---|---|---|
| `log.md` | 1461 | 2026-05-01 | low | bloat | Log |
| `daily/2026-04-25.md` | 804 | 2026-04-26 | low | bloat | Daily Log — 2026-04-25 |
| `daily/2026-05-01.md` | 761 | 2026-05-01 | low | bloat | Daily Log — 2026-05-01 |
| `MACHINES.md` | 616 | 2026-05-02 | low | bloat | Machines - Computer Inventory |
| `daily/2026-04-23.md` | 589 | 2026-04-23 | low | bloat | Daily Log — 2026-04-23 |
| `projects/memory-system-v2/NARRATIVE.md` | 581 | 2026-04-19 | low | bloat | memory-system-v2 — A Field Log |
| `reference/google-drive-catalog-2026-05-02.md` | 553 | 2026-05-02 | low | bloat | Catalog of Sartor-relevant documents found in alto84@gmail.com Google Drive, organized by domain (property, Solar Infere |
| `daily/2026-04-27.md` | 531 | 2026-04-28 | low | bloat | Daily Log — 2026-04-27 |
| `reference/archive/OPERATING-AGREEMENT-DRAFT-GPUSERVER1.md` | 512 | 2026-04-18 | low | bloat | Operating Agreement — gpuserver1 Perspective |
| `daily/2026-02-06.md` | 163 | 2026-02-06 | low | stale | Daily Log - 2026-02-06 |
| `daily/2026-02-18.md` | 42 | 2026-02-17 | low | stale | Daily Log — 2026-02-18 (Overnight Autonomous Session) |
| `daily/2026-02-06-brief.md` | 38 | 2026-02-06 | low | stale | Morning Brief - February 6, 2026 (Friday) |


## LOW family-relevance — directory roll-up (not enumerated)

| dir | files |
|---|---:|
| `inbox/rocinante` | 143 |
| `inbox/.drained` | 46 |
| `projects/sartor-agent-os` | 13 |
| `(root)` | 12 |
| `inbox/gpuserver1` | 10 |
| `projects/memory-system-v2` | 9 |
| `inbox/rtxpro6000server` | 6 |
| `projects/hermes-dashboard-upgrade` | 4 |
| `machines/gpuserver1` | 4 |
| `machines/_TEMPLATE` | 2 |
| `daily/2026-04-26.md` | 1 |
| `daily/2026-04-29.md` | 1 |
| `daily/2026-04-13.md` | 1 |
| `daily/2026-04-28.md` | 1 |
| `daily/2026-04-19.md` | 1 |
| `daily/2026-04-14.md` | 1 |
| `daily/2026-04-12.md` | 1 |
| `daily/2026-04-24.md` | 1 |
| `daily/2026-04-22.md` | 1 |
| `reference/OPERATING-AGREEMENT.md` | 1 |
| `daily/2026-04-21.md` | 1 |
| `reference/MEMORY-CONVENTIONS.md` | 1 |
| `daily/2026-03-15.md` | 1 |
| `daily/2026-03-16.md` | 1 |
| `daily/2026-03-17.md` | 1 |
| `daily/2026-04-30.md` | 1 |
| `daily/2026-03-14.md` | 1 |
| `daily/2026-04-18.md` | 1 |
| `reference/MULTI-MACHINE-MEMORY.md` | 1 |
| `daily/2026-04-10.md` | 1 |
| `daily/2026-04-02.md` | 1 |
| `daily/2026-04-20.md` | 1 |
| `daily/2026-04-09.md` | 1 |
| `reference/EXECUTION-PLAN.md` | 1 |
| `daily/2026-04-03.md` | 1 |
| `daily/2026-04-17.md` | 1 |
| `skills/gpuserver1-market-pricing` | 1 |
| `reference/rocinante-working-tree-triage-2026-04-12.md` | 1 |
| `daily/2026-04-15.md` | 1 |
| `machines/rtxpro6000server` | 1 |
| `reference/archive` | 1 |
| `daily/2026-04-08.md` | 1 |
| `reference/memory-curator-agent.md` | 1 |
| `reference/CURATOR-BEHAVIOR.md` | 1 |
| `machines/rocinante` | 1 |
| `daily/2026-05-02.md` | 1 |
| `projects/machine-self-stewardship.md` | 1 |
| `reference/gpuserver1-power-logging.md` | 1 |
| `reference/gpuserver1-monitoring.md` | 1 |
| `daily/2026-04-16.md` | 1 |
| `daily/2026-04-06.md` | 1 |
| `incidents/2026-04-16_privacybrowse-static-analysis.md` | 1 |
| `business/sante-total.md` | 1 |
| `daily/2026-03-29.md` | 1 |
| `daily/2026-03-30.md` | 1 |
| `daily/2026-03-31.md` | 1 |
| `daily/2026-04-07.md` | 1 |
| `business/solar-inference.md` | 1 |
| `daily/2026-04-05.md` | 1 |
| `snapshots/downloads-inventory.md` | 1 |
| `reference/LOGGING-INDEX.md` | 1 |
| `daily/2026-04-04.md` | 1 |
| `people/jonathan-francis.md` | 1 |
| `people/README.md` | 1 |
| `projects/rtx6000-workstation-build-PSU-SWAP.md` | 1 |
| `reference/gstack-review-2026-04-18.md` | 1 |
| `machines/MACHINES.md` | 1 |
| `reference/microsoft-store-pua-pattern.md` | 1 |
| `reference/gpuserver1-delegation.md` | 1 |
| `reference/CONSTITUTION-RATIFICATIONS` | 1 |
| `daily/2026-03-18.md` | 1 |
| `snapshots/gmail-2026-04.md` | 1 |
| `projects/rtx6000-workstation-build-SHOPPING.md` | 1 |
| `skills/morning-briefing-v2.md` | 1 |
| `reference/system-review-2026-04-18.md` | 1 |
| `projects/curator-fixes` | 1 |
| `people/doug-paige.md` | 1 |
| `feedback/goal-driven-execution.md` | 1 |
| `reference/skill-conventions.md` | 1 |
| `daily/2026-03-28.md` | 1 |
| `reference/INDEX.md` | 1 |
| `reference/gpuserver1-operations.md` | 1 |
| `daily/2026-04-11.md` | 1 |
| `people/alison-smith.md` | 1 |
| `people/andy-stecker.md` | 1 |
| `feedback/completeness-principle.md` | 1 |
| `people/mike-silva.md` | 1 |
| `people/ilan-grunwald.md` | 1 |
| `daily/2026-04-01.md` | 1 |
| `people/amarkanth.md` | 1 |
| `feedback/awareness-as-duty.md` | 1 |
| `feedback/scope-discipline.md` | 1 |
| `projects/INDEX.md` | 1 |
| `people/barbara-weis.md` | 1 |
| `indexes/_index.md` | 1 |
| `people/INDEX.md` | 1 |
| `business/INDEX.md` | 1 |
| `feedback/feedback_permissions_fix.md` | 1 |
| `feedback/feedback_agent_bypass.md` | 1 |
| `reference/network.md` | 1 |
| `feedback/framework-floor-not-checklist.md` | 1 |
| `feedback/proactive-error-cleanup.md` | 1 |
| `feedback/feedback_protected_paths.md` | 1 |
| `feedback/feedback_preserve_frontmatter.md` | 1 |
| `feedback/feedback_memory_conventions.md` | 1 |
| `feedback/prosecutorial-discount-on-constitutional-reframes.md` | 1 |
| `ledgers/INDEX.md` | 1 |
| `skills/INDEX.md` | 1 |


## NONE family-relevance — directory roll-up (not enumerated)

Pure technical/research/work artifacts. Listed by directory only; the dossier has the full enumeration in `_raw_inventory.tsv`.

| dir | files |
|---|---:|
| `research/ccp-alignment` | 38 |
| `research/persona-engineering` | 34 |
| `research/pharmacovigilance` | 19 |
| `inbox/rtxpro6000server` | 2 |
| `reference/LLM-WIKI-ARCHITECTURE.md` | 1 |
| `projects/rtx6000-workstation-build.md` | 1 |
| `projects/memory-system-v2` | 1 |
| `(root)` | 1 |
| `business/az-career.md` | 1 |
| `skills/research-effort.md` | 1 |
| `skills/obsidian-control.md` | 1 |
| `research/INDEX.md` | 1 |
| `projects/sartor-agent-os` | 1 |
| `research/experiments-index.md` | 1 |
| `reference/obsidian-control-research.md` | 1 |
| `inbox/.drained` | 1 |
| `reference/reference_vastai_market_pricing.md` | 1 |
| `feedback/feedback_prefer_subagents.md` | 1 |
| `inbox/gpuserver1` | 1 |


## All stale files (mtime > 60d) at a glance

| path | lines | updated | rel |
|---|---:|---|---|
| `daily/2026-02-06.md` | 163 | 2026-02-06 | low |
| `daily/2026-02-18.md` | 42 | 2026-02-17 | low |
| `daily/2026-02-06-brief.md` | 38 | 2026-02-06 | low |
| `research/pharmacovigilance/cell-therapy-safety-monitoring-lifecycle.md` | 845 | 2026-02-07 | none |
| `research/pharmacovigilance/graph-based-safety-prediction-research.md` | 576 | 2026-02-06 | none |
| `research/pharmacovigilance/safety-knowledge-graph/data-sources/README.md` | 388 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/trials/active-trials.md` | 265 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/adverse-events/infections.md` | 220 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/models/risk-model.md` | 212 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/adverse-events/t-cell-malignancy.md` | 209 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/adverse-events/prolonged-cytopenias.md` | 188 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/adverse-events/CRS.md` | 167 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/adverse-events/ICANS.md` | 164 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/adverse-events/ICAHS.md` | 163 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/mitigations/anakinra.md` | 160 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/mitigations/lymphodepletion.md` | 155 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/adverse-events/LICATS.md` | 152 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/mitigations/dose-reduction.md` | 151 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/mitigations/tocilizumab.md` | 135 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/mitigations/corticosteroids.md` | 134 | 2026-02-07 | none |
| `research/pharmacovigilance/safety-knowledge-graph/README.md` | 98 | 2026-02-07 | none |


## All bloat files (>500 lines)

| path | lines | updated | rel |
|---|---:|---|---|
| `reference/HOUSEHOLD-CONSTITUTION.md` | 1300 | 2026-04-24 | high |
| `reference/archive/HOUSEHOLD-CONSTITUTION-v0.2.md` | 1263 | 2026-04-19 | high |
| `log.md` | 1461 | 2026-05-01 | low |
| `daily/2026-04-25.md` | 804 | 2026-04-26 | low |
| `daily/2026-05-01.md` | 761 | 2026-05-01 | low |
| `MACHINES.md` | 616 | 2026-05-02 | low |
| `daily/2026-04-23.md` | 589 | 2026-04-23 | low |
| `projects/memory-system-v2/NARRATIVE.md` | 581 | 2026-04-19 | low |
| `reference/google-drive-catalog-2026-05-02.md` | 553 | 2026-05-02 | low |
| `daily/2026-04-27.md` | 531 | 2026-04-28 | low |
| `reference/archive/OPERATING-AGREEMENT-DRAFT-GPUSERVER1.md` | 512 | 2026-04-18 | low |
| `research/ccp-alignment/mini-lab-2026-04-11/MINI-LAB-REPORT.md` | 1007 | 2026-04-19 | none |
| `research/pharmacovigilance/cell-therapy-organizational-regulatory-framework.md` | 970 | 2026-04-19 | none |
| `research/pharmacovigilance/cell-therapy-safety-monitoring-lifecycle.md` | 845 | 2026-02-07 | none |
| `research/persona-engineering/METHODS.md` | 739 | 2026-04-25 | none |
| `research/ccp-alignment/constitution-council/DIFF.md` | 723 | 2026-04-12 | none |
| `research/ccp-alignment/gpu-research-restart/05-training-runbook.md` | 706 | 2026-04-12 | none |
| `research/ccp-alignment/gpu-research-restart/03-eval-framework.md` | 687 | 2026-04-12 | none |
| `research/ccp-alignment/gpu-research-restart/06-integration-architecture.md` | 600 | 2026-04-19 | none |
| `research/pharmacovigilance/graph-based-safety-prediction-research.md` | 576 | 2026-02-06 | none |
| `research/persona-engineering/experiments/001_2026-04-25_loyalty-baseline-fingerprint.md` | 549 | 2026-04-26 | none |
| `research/persona-engineering/PHASE-2-METHODS-PIPELINES.md` | 548 | 2026-04-26 | none |
| `research/ccp-alignment/constitution-council/SYNTHESIS.md` | 529 | 2026-04-12 | none |
| `research/persona-engineering/PHASE-2-MEASUREMENT-PATCHES.md` | 522 | 2026-04-26 | none |
| `research/ccp-alignment/gpu-research-restart/01-research-plan.md` | 517 | 2026-04-19 | none |


## Notes on the inventory

- `family/` is excluded by directive; teammate `family-curator` owns it.
- `inbox/` and `daily/` files are scored LOW unless they bubble up via stale/bloat.
- `research/ccp-alignment/` and `research/pharmacovigilance/` are NONE by rule.
- Raw TSV at `_raw_inventory.tsv`; rebuild via `python _inventory_scan.py`.
