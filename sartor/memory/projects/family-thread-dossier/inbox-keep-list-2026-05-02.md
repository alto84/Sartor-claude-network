---
name: inbox-keep-list-2026-05-02
description: Keep-list / discard verdicts for inbox files NOT in the bulk-discard set. Singletons in extractor_proposed (body_hash unique == 1) plus all peer_phone_home and peer_inbox_other files. Companion to memory-engineer's Phase A2 drain script.
type: project
status: active
created: 2026-05-02
updated: 2026-05-02
related: [memory-cartography, _inbox_analysis.py]
---

# Inbox keep-list — 2026-05-02

Source: `_inbox_analysis.py` + `_singletons_and_peers.py` in this directory.
Bulk-discard set (~190 files with `dedup_status: already_landed` and stable-entity `extractor_subclass`) is handled separately.

Verdict legend: **KEEP** = real signal, leave in inbox or drain to `_processed/`; **DISCARD** = unique-body but still noise; **REVIEW** = need a human eye.

## Singletons in `extractor_proposed` (body_hash unique == 1)

Total: 46 files.

| date | path | heading | verdict | one-line summary |
|---|---|---|---|---|
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137401-75f4402202ac.md` | Proposed memory: explicit_memorize | REVIEW (explicit user-issued memorize call; check if landed) | - **Category:** `save_verb` / `explicit_memorize` - **Confidence:** 0.95 - **Dedup status:** `new` - **Suggested target: |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137401-7df3ada3936e.md` | Proposed memory: explicit_memorize | DISCARD (self-attested landed) | - **Category:** `save_verb` / `explicit_memorize` - **Confidence:** 0.95 - **Dedup status:** `already_landed` - **Sugges |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137401-93210ab9176a.md` | Proposed memory: explicit_memorize | REVIEW (explicit user-issued memorize call; check if landed) | - **Category:** `save_verb` / `explicit_memorize` - **Confidence:** 0.95 - **Dedup status:** `new` - **Suggested target: |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-287ba3e0a7cc.md` | Proposed memory: rental_price | DISCARD (self-attested landed) | - **Category:** `structured_update` / `rental_price` - **Confidence:** 0.95 - **Dedup status:** `already_landed` - **Sug |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-2881b3cc7fce.md` | Proposed memory: health | DISCARD (self-attested landed) | - **Category:** `structured_update` / `health` - **Confidence:** 0.90 - **Dedup status:** `already_landed` - **Suggested |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-321d985c7b39.md` | Proposed memory: fiscal_outlook | DISCARD (self-attested landed) | - **Category:** `numeric` / `fiscal_outlook` - **Confidence:** 0.75 - **Dedup status:** `already_landed` - **Suggested t |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-3310abd52d95.md` | Proposed memory: dob | DISCARD (self-attested landed) | - **Category:** `structured_update` / `dob` - **Confidence:** 0.90 - **Dedup status:** `already_landed` - **Suggested ta |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-56ba389650c3.md` | Proposed memory: fiscal_outlook | DISCARD (self-attested landed) | - **Category:** `numeric` / `fiscal_outlook` - **Confidence:** 0.75 - **Dedup status:** `already_landed` - **Suggested t |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-685978517cc6.md` | Proposed memory: rule | DISCARD (self-attested landed) | - **Category:** `feedback_rule` / `rule` - **Confidence:** 0.85 - **Dedup status:** `already_landed` - **Suggested targe |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-72a1017f5712.md` | Proposed memory: wifi_password | DISCARD (self-attested landed) | - **Category:** `numeric` / `wifi_password` - **Confidence:** 0.90 - **Dedup status:** `already_landed` - **Suggested ta |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-734f1da2395c.md` | Proposed memory: preference | DISCARD (self-attested landed) | - **Category:** `feedback_preference` / `preference` - **Confidence:** 0.75 - **Dedup status:** `already_landed` - **Sug |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-75c5375f5204.md` | Proposed memory: explicit_memorize | REVIEW (explicit user-issued memorize call; check if landed) | - **Category:** `save_verb` / `explicit_memorize` - **Confidence:** 0.95 - **Dedup status:** `new` - **Suggested target: |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-8c1b24283c01.md` | Proposed memory: rule | DISCARD (self-attested landed) | - **Category:** `feedback_rule` / `rule` - **Confidence:** 0.85 - **Dedup status:** `already_landed` - **Suggested targe |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-9421ef92a6e2.md` | Proposed memory: preference | REVIEW (likely already in feedback/ if rule-shaped) | - **Category:** `feedback_preference` / `preference` - **Confidence:** 0.75 - **Dedup status:** `new` - **Suggested targ |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-952ac9253e0e.md` | Proposed memory: fiscal_outlook | DISCARD (self-attested landed) | - **Category:** `numeric` / `fiscal_outlook` - **Confidence:** 0.75 - **Dedup status:** `already_landed` - **Suggested t |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-9beac90a1086.md` | Proposed memory: dob | DISCARD (self-attested landed) | - **Category:** `structured_update` / `dob` - **Confidence:** 0.90 - **Dedup status:** `already_landed` - **Suggested ta |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-9d82d1c0ff9b.md` | Proposed memory: health | DISCARD (self-attested landed) | - **Category:** `structured_update` / `health` - **Confidence:** 0.90 - **Dedup status:** `already_landed` - **Suggested |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-af1dcf4dbabd.md` | Proposed memory: explicit_memorize | DISCARD (self-attested landed) | - **Category:** `save_verb` / `explicit_memorize` - **Confidence:** 0.95 - **Dedup status:** `already_landed` - **Sugges |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-c51463a34c14.md` | Proposed memory: rule | REVIEW | - **Category:** `feedback_rule` / `rule` - **Confidence:** 0.85 - **Dedup status:** `new` - **Suggested target:** `feedb |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-14/ce-1776137402-f7c2c9bfc134.md` | Proposed memory: rule | DISCARD (self-attested landed) | - **Category:** `feedback_rule` / `rule` - **Confidence:** 0.85 - **Dedup status:** `already_landed` - **Suggested targe |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-aneeta-employer-change.md` | Aneeta employment: left Biogen mid-2025, joined Ne | KEEP (already in FAMILY.md per cart inv; safe to drain to _processed/) | Confirmed in Alton's 2026-04-06 tax-package email to CPA. CLAUDE.md already lists Aneeta as Medical Director at Neurvati |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-az-role-change-confirmed.md` | AZ role change confirmed (per Alton, 2026-04-13) | KEEP (verify against ASTRAZENECA.md) | Alton stated to CPA Jonathan Francis that he "just changed job roles at AZ" and that "all wages were earned in Delaware" |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-caqh-reattestation-needed.md` | CAQH provider profile reattestation required | REVIEW | CAQH email 2026-04-12: one or more CAQH provider profiles linked to alto84@gmail.com require reattestation. Expired prof |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-chase-sapphire-reserve-shipped.md` | New Chase Sapphire Reserve card shipped (2026-04-1 | REVIEW | Chase notification 2026-04-13: replacement/new Chase Sapphire Reserve card shipped. Likely related to the 2026-04-13 fra |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-mka-donation-2025.md` | 2025 charitable contribution: $2,037.17 to MKA | REVIEW | Per Alton's response to CPA, the only major charitable donation in TY2025 was to Montclair Kimberley Academy: - Date: 20 |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-mka-events-april-2026.md` | MKA April 2026 schedule items | REVIEW | Multiple time-sensitive school events surfaced in 4/12-4/16 inbox: |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-mka-vayu-math-support.md` | MKA: Vayu math support flagged by 4th-grade teache | REVIEW | Roshni Shah (MKA Grade 4 teacher / 4th Grade Dean) emailed Alton and Aneeta 2026-04-14 about Vayu's difficulty with the  |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-mortgage-refi-shellpoint-cenlar.md` | 85 Stonebridge: 2025 mortgage transfer Shellpoint  | REVIEW | Per Alton's tax-package email to CPA: - Primary mortgage on 85 Stonebridge Rd was sold mid-2025 from Shellpoint to Cenla |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-newegg-april-deliveries.md` | Newegg hardware deliveries 4/14-4/15 (likely the $ | REVIEW | Multiple Newegg orders delivered/shipped during gather window — consistent with Alton's CPA statement that he "just spen |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-power-mac-pete-berman-coordination.md` | Power Mac LLC scheduled for 2026-04-28, will coord | REVIEW | Power Mac LLC (Ilija Trajceski, info@power-mac.net) confirmed appointment for 85 Stonebridge home theater repairs: - Dat |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-recruiter-pressure-az-context.md` | Recruiter pressure: high inbound volume for Medica | REVIEW | Notable pattern over a 5-day window: - LinkedIn Job Alerts: 10+ Medical Director / Director / VP roles (Amgen, Cohere He |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-sante-total-mike-quigg-recurring-donor.md` | Sante Total: Michael Quigg recurring $250/month do | REVIEW | PayPal payment notification 2026-04-14: Sante Total received $250.00 from Michael Quigg (mike@vt.edu). PayPal subscripti |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-sno-deadlines.md` | Society for Neuro-Oncology 2026 deadlines | REVIEW | SNO digest 2026-04-15 + abstract notice 2026-04-14: - **2026 Clinical Trials Workshop application deadline: 2026-05-15** |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-solar-inference-llc-formation-details.md` | Solar Inference LLC: formation, structure, and TY2 | REVIEW | Detailed status per Alton's tax-package email: - Formed: 2026-09-06 — typo in email; should be 2025-09-06 (Sep 6, 2025)  |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-tax-extension-payments.md` | 2025 tax extension payments: $15k IRS + $3k NJ (CP | REVIEW | CPA Jonathan Francis quantified TY2025 extension payments before LLC pass-through losses are factored: $15,000 federal,  |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-tribeca-pediatrics-payment.md` | Pediatrician confirmed: Tribeca Pediatrics (active | KEEP (provider info — verify against FAMILY.md) | InstaMed receipt 2026-04-13 confirms Tribeca Pediatrics as an active billing relationship. Payment of $170.28 made via p |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-wohelo-payment-12900.md` | Wohelo Camp 2026: Vishala enrolled, $12,900 check  | KEEP (Vishala camp $12,900 — likely already in family/active-todos.md, drain to _processed/) | Director Heidi Gorton (Camp Little Wohelo) confirmed Vishala is enrolled for the full summer 2026 session. Payment instr |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-16/gmail-workstation-37k-pass-through.md` | $37k workstation hardware confirmed for pass-throu | REVIEW | Alton confirmed to CPA the planned 2025/2026 Solar Inference LLC capex flagged for pass-through deductions: - ~$450k sol |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-17/ce-1776396603-820f0319f906.md` | Proposed memory: entity_vishala | DISCARD (self-attested landed) | - **Category:** `proper_noun` / `entity_vishala` - **Confidence:** 0.70 - **Dedup status:** `already_landed` - **Suggest |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-17/ce-1776396603-e73bbd302d41.md` | Proposed memory: entity_aneeta | DISCARD (self-attested landed) | - **Category:** `proper_noun` / `entity_aneeta` - **Confidence:** 0.70 - **Dedup status:** `already_landed` - **Suggeste |
| 2026-04-19 | `inbox/.drained/2026-04-19/rocinante-extractor/2026-04-17/ce-1776396603-ea35b4354972.md` | Proposed memory: dollar_amount | DISCARD (self-attested landed) | - **Category:** `numeric` / `dollar_amount` - **Confidence:** 0.70 - **Dedup status:** `already_landed` - **Suggested ta |
| 2026-05-01 | `inbox/rocinante/proposed-memories/2026-04-27/ce-1777260605-474c88d55829.md` | Proposed memory: task_batch | REVIEW | - **Category:** `imperative` / `task_batch` - **Confidence:** 0.85 - **Dedup status:** `new` - **Suggested target:** `fa |
| 2026-05-01 | `inbox/rocinante/proposed-memories/2026-05-02/ce-1777692603-f059fbcca43c.md` | Proposed memory: wifi_password | DISCARD (self-attested landed) | - **Category:** `numeric` / `wifi_password` - **Confidence:** 0.90 - **Dedup status:** `already_landed` - **Suggested ta |
| 2026-05-01 | `inbox/rocinante/proposed-memories/2026-05-02/ce-1777692603-f1a634b26ffd.md` | Proposed memory: task_batch | REVIEW | - **Category:** `imperative` / `task_batch` - **Confidence:** 0.85 - **Dedup status:** `new` - **Suggested target:** `fa |
| 2026-05-01 | `inbox/rocinante/proposed-memories/2026-05-02/ce-1777692603-f9c738f0851c.md` | Proposed memory: wifi_password | DISCARD (self-attested landed) | - **Category:** `numeric` / `wifi_password` - **Confidence:** 0.90 - **Dedup status:** `already_landed` - **Suggested ta |
| 2026-05-01 | `inbox/rocinante/proposed-memories/2026-05-02/ce-1777692603-fd8e2cb33fe5.md` | Proposed memory: explicit_memorize | REVIEW (explicit user-issued memorize call; check if landed) | - **Category:** `save_verb` / `explicit_memorize` - **Confidence:** 0.95 - **Dedup status:** `new` - **Suggested target: |


## peer_phone_home (10 files)

Status reports from peer machines (gpuserver1, rtxpro6000server). All KEEP unless already drained.

| date | path | heading | verdict | one-line summary |
|---|---|---|---|---|
| 2026-04-26 | `inbox/rtxpro6000server/PHONE-HOME-cato-003-charges.md` | Cato-003 verdict: REVISE. Phase 1 NOT fired. | KEEP-IF-OPEN (review: drain to _processed/ if outcome is landed) | ## Headline |
| 2026-04-26 | `inbox/rtxpro6000server/PHONE-HOME-deepseek-v4-arch-gap.md` | DeepSeek-V4-Flash arch-gap. vLLM AND SGLang both l | KEEP-IF-OPEN (review: drain to _processed/ if outcome is landed) | ## Headline |
| 2026-04-26 | `inbox/rtxpro6000server/PHONE-HOME-phase-1-sanity-failure.md` | Phase 1 baseline ran clean. Both pre-registered sa | KEEP-IF-OPEN (review: drain to _processed/ if outcome is landed) | ## Headline |
| 2026-04-29 | `inbox/rtxpro6000server/PHONE-HOME-phase-2-plan-greenlit-experiment-002-pre-fire.md` | Phase 2 Plan greenlit. Experiment 002 ready for fi | KEEP-IF-OPEN (review: drain to _processed/ if outcome is landed) | ## Headline |
| 2026-04-29 | `inbox/rtxpro6000server/PHONE-HOME-fan-control-pwm-no-effect.md` | PHONE-HOME — fan control directive blocked: PWM wr | KEEP-IF-OPEN (review: drain to _processed/ if outcome is landed) | ## Verdict |
| 2026-04-29 | `inbox/rtxpro6000server/PHONE-HOME-bmc-fan-source-bindings-proposal.md` | PHONE-HOME — proposed BMC fan-source bindings, rea | KEEP-IF-OPEN (review: drain to _processed/ if outcome is landed) | ## Verdict |
| 2026-04-29 | `inbox/rocinante/PHONE-HOME-cooling-upgrade-recommendation.md` | PHONE-HOME — cooling upgrade recommendation for rt | KEEP-IF-OPEN (review: drain to _processed/ if outcome is landed) | ## Headline |
| 2026-05-02 | `inbox/rocinante/PHONE-HOME-experiment-002-fire-ready.md` | PHONE-HOME — experiment 002 fire-ready, awaiting p | KEEP-IF-OPEN (review: drain to _processed/ if outcome is landed) | ## Verdict from grep-verify |
| 2026-05-02 | `inbox/rtxpro6000server/PHONE-HOME-stress-2026-05-02-anomaly.md` | PHONE-HOME — A1 TCTL_75 abort; pre-registered Phas | KEEP-IF-OPEN (review: drain to _processed/ if outcome is landed) | ## Verdict |
| 2026-05-02 | `inbox/rtxpro6000server/PHONE-HOME-vastai-onboarding-host-package-gap.md` | PHONE-HOME — vast.ai host package not installed; g | KEEP-IF-OPEN (review: drain to _processed/ if outcome is landed) | ## What's done (pre-key + post-key pre-work) |


## peer_inbox_other (13 files)

Task assignments to peer machines or peer-to-peer memos.

| date | path | heading | verdict | one-line summary |
|---|---|---|---|---|
| 2026-04-18 | `inbox/gpuserver1/_inbox-only-log.md` | inbox-only | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | _Stub created by curator on 2026-04-12 from inbox entry `gpuserver1-2026-04-12T01-42-00Z-alignment-report` (origin: gpus |
| 2026-04-18 | `inbox/gpuserver1/_tasks/README.md` | `_tasks/` — Rocinante-to-gpuserver1 asynchronous d | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | This directory is Rocinante's outbound queue for asynchronous work directed at gpuserver1. See [[OPERATING-AGREEMENT]] § |
| 2026-04-19 | `inbox/gpuserver1/vastai/2026-04-19T1935Z-state-change.md` | vast.ai state change 2026-04-19T19:35:10+00:00 | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | Machine 52271: listed=true rented=true |
| 2026-04-19 | `inbox/gpuserver1/_heartbeat.md` |  | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | - gpu_util_1h_avg: 51% - vastai_listing: listed - active_rentals: 1 - last_pull: 2026-04-20 01:13:57 +0000 - generated_d |
| 2026-04-19 | `inbox/gpuserver1/gateway-cron-decision-2026-04-20.md` | gateway_cron.py Decision: RETIRE | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | ## Decision |
| 2026-04-19 | `inbox/gpuserver1/heartbeat-amendment-result-2026-04-20.md` | Heartbeat Amendment Result | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | ## What was changed |
| 2026-04-22 | `inbox/gpuserver1/2026-04-23_new-peer-rtxpro6000server.md` | New peer online: rtxpro6000server (192.168.1.157) | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | Welcome back. During a window when gpuserver1 was unreachable over the LAN (SSH timeout on 2026-04-22 ~23:45 ET from Roc |
| 2026-04-24 | `inbox/gpuserver1/2026-04-24_corpus-qc-summary.md` | Track C v2 Corpus QC — gpuserver1 summary | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | ## What gpuserver1 did |
| 2026-04-24 | `inbox/gpuserver1/2026-04-24_cpu-delegation.md` | gpuserver1 CPU-only delegation — 2026-04-24 | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | Rocinante orchestrator delegated Track C v2 corpus QC to gpuserver1. Machine 52271 has an active reservation contract th |
| 2026-04-25 | `inbox/rtxpro6000server/_heartbeat.md` | rtxpro6000server heartbeat 2026-04-24T18:45:34Z | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | ``` index, temperature.gpu, temperature.memory, fan.speed [%], power.draw [W], utilization.gpu [%], memory.used [MiB] 0, |
| 2026-04-29 | `inbox/rtxpro6000server/RESUME-after-shutdown-2026-04-27.md` | RESUME — rtxpro6000server fan-control work, post-2 | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | ## TL;DR for the next session |
| 2026-04-29 | `inbox/rtxpro6000server/IPMI-FAN-RESEARCH.md` | Research — ASUS ASMB11 raw IPMI fan-PWM command | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | ## Verdict |
| 2026-05-02 | `inbox/rtxpro6000server/RESUME-vastai-onboarding-2026-05-02.md` | RESUME — vast.ai onboarding for rtxpro6000server ( | KEEP-IF-OPEN (review: drain to _processed/ if task complete) | ## What happened |
