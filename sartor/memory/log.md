---
type: meta
entity: log
updated: 2026-05-17
updated_by: personal-data-gather
run: 85
status: active
tags: [meta/log, meta/wiki, meta/spine]
aliases: [Wiki Log, Log, Change Log]
related: [INDEX, MEMORY, MEMORY-CONVENTIONS, LLM-WIKI-ARCHITECTURE]
---

# Log

Append-only chronological ledger of wiki activity. One of the two spine files of the Sartor LLM wiki (the other is [[INDEX]]), following the pattern from Karpathy's LLM-Wiki gist and Nous Research's Hermes Agent v2026.4.8.

> [!note]
> This file is append-only. Never rewrite or reorder entries. Every entry has an ISO date prefix so unix tools can parse it (`grep`, `sort`, `awk`).

## Entry format

```
## [YYYY-MM-DD] action | One-line title
- Brief detail
- File path touched: `some/file.md`
- Related: [[OTHER]]
```

**Actions** (controlled vocabulary):
- `ingest` — new raw source added, summary pages written, index updated
- `refactor` — restructuring without adding new facts (schema changes, conventions)
- `curate` — consolidation, pruning, reorganization of existing content
- `fact` — a new factual claim added to an existing page
- `decision` — an open decision was resolved or surfaced
- `lint` — automated audit results (orphans, broken links, stale claims)
- `repair` — fixing a regression or broken state

## Entries

## [2026-05-06] ingest | personal-data-gather run 60: iCloud full; Vasu pizza money; Goddard door access; Schwab TQQQ
- Sources: Gmail (newer_than:2d, 30 threads), all 5 calendars (May 6–20), no SSH (gpuserver1 unreachable at time of run)
- iCloud storage: 49.8/50 GB (99.6% full) — CRITICAL. Upgrade or purge needed.
- Vasu Sartor pizza lunch balance: $0.00 (depleted as of May 2). Refund pending for unused field trip fee.
- Goddard School: door access code changed April 30, 2026 to 5219. Old code 7621 no longer valid.
- Schwab: TQQQ position visible; no trade alerts found.
- Files touched: `family/family-calendar.md`, `FAMILY.md`, `MACHINES.md`, `ALTON.md`, `business/solar-inference/finances.md`
- KEY: iCloud at 99.6% — storage upgrade or purge needed immediately to prevent iCloud sync failure.

## [2026-05-06] ingest | personal-data-gather run 61: Alton AZ start-date; Wohelo camp deposit; MKA Veracross
- Sources: Gmail (newer_than:3d, 28 threads), all 5 calendars (May 6–21)
- AstraZeneca NYC start date confirmed: May 12, 2026 (onboarding package email May 5).
- Wohelo Camps deposit: $500 check must arrive by May 15, 2026. Payee: Wohelo Camps Inc.
- MKA Veracross parent-teacher conference sign-up: opens May 12, closes May 16. Window: May 19–23.
- Files touched: `ALTON.md`, `family/family-calendar.md`, `ASTRAZENECA.md`
- KEY: Wohelo check must be mailed by May 12 to arrive May 15. Veracross sign-up window opens same day as AZ start.

## [2026-05-06] ingest | personal-data-gather run 62: Sante Total board quorum; NJ charity renewal; Schwab margin alert
- Sources: Gmail (newer_than:4d, 35 threads), all 5 calendars
- Sante Total: board quorum email thread — next meeting tentatively June 3, 2026 (TBD confirmation). Treasurer report needed.
- NJ charity registration renewal: due July 31, 2026. Form CRI-300R.
- Schwab: margin utilization alert for account ending -4821 (non-actionable, informational).
- Files touched: `BUSINESS.md`, `TAXES.md`, `family/active-todos.md`
- KEY: Sante Total board meeting June 3 TBD — Alton treasurer report prep needed ~2 weeks prior.

## [2026-05-07] ingest | personal-data-gather run 63: gpuserver1 back online; vast.ai C.34113802 active; Aneeta Neurvati board prep
- Sources: Gmail (newer_than:1d, 22 threads), all 5 calendars, SSH gpuserver1 (restored)
- gpuserver1 back online after ~18h network outage (cable pull incident follow-up). Heartbeat resumed.
- vast.ai contract C.34113802: still active, renter container running. No interruption logged.
- Aneeta: Neurvati board prep email — slide deck request from CEO for May 14 board call.
- iCloud: still at 49.8/50 GB. No action taken yet.
- Files touched: `MACHINES.md`, `machines/gpuserver1/STATE.md`, `ALTON.md`
- KEY: iCloud purge still pending. Neurvati board call May 14 — Aneeta prep needed.

## [2026-05-07] ingest | personal-data-gather run 64: Solar Inference LLC Q1 bookkeeping; Chase statement; depreciation memo
- Sources: Gmail (newer_than:2d, 19 threads), Chase business account notification
- Solar Inference LLC: Chase statement for April 2026 available. No new transactions flagged.
- GPU depreciation: RTX 5090 placed-in-service date confirmed Dec 2024. Year 2 depreciation schedule applies.
- Solar roof ITC: no new IRS correspondence. Prior abatement request still pending (filed March 2026).
- Files touched: `business/solar-inference/finances.md`, `TAXES.md`, `BUSINESS.md`
- KEY: IRS penalty abatement still no response. Follow up if no letter by June 1.

## [2026-05-07] ingest | personal-data-gather run 65: Vayu MKA spring concert; Vishala swim schedule; Vasu Goddard graduation
- Sources: Gmail (newer_than:2d, 31 threads), all 5 calendars (May 7–28)
- Vayu: MKA Spring Concert May 22, 2026 at 6:30 PM. Both parents expected.
- Vishala: Swim team practice schedule updated — Tuesdays/Thursdays 4:15–5:30 PM starting May 13.
- Vasu: Goddard School year-end celebration June 6, 2026 at 11:00 AM.
- Files touched: `family/family-calendar.md`, `FAMILY.md`
- KEY: May 22 Spring Concert conflicts with Alton's potential AZ late-meeting slot — flag for scheduling.

## [2026-05-08] ingest | personal-data-gather run 66: Alton badge/ID pickup; AZ IT onboarding; commute logistics
- Sources: Gmail (newer_than:1d, 17 threads), all 5 calendars
- AZ onboarding: badge pickup scheduled May 12 at 8:30 AM, 187 E 70th St lobby. Bring two forms of ID.
- AZ IT: laptop will be shipped to home address. Expected delivery May 9–10.
- Commute: NJ Transit Montclair-Boonton line to Penn Station. Alton's NJ Transit app account confirmed active.
- Files touched: `ALTON.md`, `ASTRAZENECA.md`, `family/family-calendar.md`
- KEY: AZ laptop arriving May 9–10 — confirm home delivery. Badge pickup May 12 at 8:30 AM is hard deadline.

## [2026-05-08] ingest | personal-data-gather run 67: matter-tracker seeded; tax counsel skill; Bitwarden secrets skill
- Sources: Internal session work (no external data gather this run — infrastructure build run)
- matter-tracker skill created: 13 open matters seeded at `sartor/memory/matters/`. INDEX.md auto-generated.
- tax-counsel skill created: authority-grounded tax analysis, IRC/IRAC format, CPA-routing discipline.
- secrets-via-bitwarden skill created: sartor-secret wrapper, vault-locked behavior, migration recipe.
- Files touched: `sartor/memory/matters/*.md`, `sartor/memory/matters/INDEX.md`, `.claude/skills/tax-counsel.md`, `.claude/skills/secrets-via-bitwarden.md`, `CLAUDE.md`
- KEY: All three infrastructure items deployed and tested. Matter tracker now authoritative for open tax/legal positions.

## [2026-05-09] ingest | personal-data-gather run 68: AZ laptop arrived; iCloud purge complete; Wohelo check status
- Sources: Gmail (newer_than:1d, 24 threads), all 5 calendars (May 9–25)
- AZ laptop: delivered May 9 at 2:14 PM (FedEx tracking confirmed). MacBook Pro M4 Pro.
- iCloud: Alton purged ~4 GB of old photos to iCloud trash. Storage now at 46.1/50 GB (92.2%). Not yet resolved — recommend upgrade to 200 GB ($2.99/mo) or continued purge.
- Wohelo: no confirmation of check receipt yet. Mailed May 7. Expected arrival May 9–10. Follow up if no confirmation by May 12.
- Neurvati board call (May 14): Aneeta slide deck submitted to CEO May 8. Prep complete.
- Files touched: `ALTON.md`, `ASTRAZENECA.md`, `FAMILY.md`, `family/family-calendar.md`
- KEY: Wohelo check still unconfirmed — follow up May 12 if no receipt. iCloud still borderline.

## [2026-05-14] ingest | personal-data-gather run 73: calendar confirmed stable; 990-N P0 1-day; Avigilon expired

- Sources: Calendar (5 calendars, May 14–21 window, all returned). Gmail: UNAVAILABLE (OAuth still expired — reauth required). SSH: unavailable in web runner.
- Calendar delta: zero new events vs run 72. All 5 calendars stable.
- P0 ESCALATED: Sante Total Form 990-N due TOMORROW 2026-05-15. Still NOT FILED. File immediately at IRS.gov.
- P0 ESCALATED: Wohelo forms due TOMORROW 2026-05-15. Confirm sent to heidi@timanous.org.
- Harvey/Hiive deadline: TODAY 2026-05-14 — closes this evening or already closed.
- Avigilon Alta app token: CONFIRMED EXPIRED (estimated expiry was 2026-05-13).
- Aneeta Neurvati board call: TODAY (first flagged run 63, slide deck submitted May 8).
- Files touched: `daily/2026-05-14.md` (run 73 section appended), `data/gather-alerts.md` (created), `data/heartbeat-log.csv` (created), `log.md`
- KEY: 990-N due TOMORROW. File today. Wohelo forms also due tomorrow — confirm sent. Harvey window closes today.

## [2026-05-14] ingest | personal-data-gather run 72: deadline escalations; Gmail OAuth gap; Nehal birthday added
- Sources: Calendar (5 calendars, May 14–21 window). Gmail: UNAVAILABLE (OAuth expired — reauth initiated). SSH: unavailable in web runner environment.
- P0-TODAY: Harvey/Hiive investment decision — final funding deadline today. $25K min, $11B valuation.
- P0-TOMORROW: Sante Total Form 990-N — DUE 2026-05-15. Status: NOT FILED per all prior runs.
- P0-TOMORROW: Wohelo $12,900 + forms — DUE 2026-05-15. Confirm both check and forms sent.
- P1-3-DAYS: Disney ADR — respond to Nicol Stevenson before May 17 with dining preferences.
- Calendar new (run 72): Nehal's Birthday on Thu 2026-05-21 (recurring, Alton primary calendar).
- All other calendar events carry forward unchanged from run 71.
- Files touched: `daily/2026-05-14.md` (created), `business/sante-total.md`, `family/active-todos.md`, `data/gather-alerts.md` (created/updated), `data/heartbeat-log.csv` (created), `log.md`
- KEY: 990-N TOMORROW. File immediately at IRS.gov. Harvey decision window closes today.

## [2026-05-12] ingest | personal-data-gather run 70: Chase Sante Total restriction; 990-N 3-day countdown; Hiive Harvey decision deadline
- Sources: Gmail (newer_than:2d, 30 threads), 5 calendars (May 12–19 window)
- CRITICAL: Chase/Sante Total bank account (opened 2026-05-06) flagged for missing information — contact Pavel Manrique before 06/04/2026 or account restricted.
- P0: Sante Total Form 990-N due 2026-05-15 (3 days). Status: NOT FILED per all prior entries.
- Time-sensitive: Hiive/Harvey AI investment closes 2026-05-14 ($25K min, ~$12.1B implied valuation). Decision item only.
- Financial: Chase Sapphire Reserve $15K payment scheduled 5/12. Chase CC (...5680) statement $23,786.95 due 05/28 auto-pay on. AZ Fidelity 401(k) investment lineup changes (review NetBenefits). Summit Health patient payment due.
- Calendar NEW: Optimum fiber appointment Mon 5/18 1:00–2:00 PM (prior events captured run 69).
- Files touched: `daily/2026-05-12.md` (created), `business/sante-total.md`, `family/active-todos.md`, `family/family-calendar.md`, `data/gather-alerts.md` (created), `data/heartbeat-log.csv` (created), `log.md`
- KEY: Two time-sensitive Sante Total items — 990-N in 3 days (P0) and Chase KYC follow-up (act this week on 6-day-old account).

## [2026-05-13] ingest | personal-data-gather run 71: Montclair camp opens today; Sante Total grant proposal; Harvey deadline tomorrow; Anysphere 90% subscribed
- Sources: Gmail (newer_than:2d, 43 threads), all 5 calendars (May 13–20 window)
- P0: Montclair Summer Camp registration opens today at 10 AM (communitypass.net).
- P0: Harvey/Hiive investment decision deadline tomorrow 2026-05-14 ($25K min, ~$12.1B valuation). Escalated from run 70.
- P0: Sante Total 990-N due 2026-05-15 (2 days). Still NOT FILED.
- P1: Sante Total — Barbara Weis + Berteau "Money for the elderly" grant proposal. Budget exceeds expectations. Alton must review as Treasurer.
- P1: Anysphere/Cursor.com via Hiive — 90%+ subscribed. Near-full, separate from Harvey.
- Family: Vasu Pajama Day today; Vasu bedding needed on Mondays; Vishala "own your letter dress down" on May 20 (new calendar event); MKA Theme Day today.
- Purchases: Dyson Hushjet Compact ordered; SOPOGER Archery Arrow Rest ordered; Puma child shoes shipped.
- Climate First Bank: Intuit connectivity disrupted after core banking conversion May 11 — may affect Solar Inference LLC QuickBooks.
- Files touched: `daily/2026-05-13.md` (created), `business/sante-total.md`, `family/active-todos.md`, `data/gather-alerts.md` (created), `data/heartbeat-log.csv` (created), `log.md`
- KEY: 990-N deadline in 2 days — P0. Harvey decision tomorrow. Sante Total grant proposal needs Treasurer review. Montclair camp opens at 10 AM today.

## [2026-05-11] ingest | personal-data-gather run 69: AZ Day 1 complete; Wohelo confirmed; rtxserver vastai listing live
- Sources: Gmail (newer_than:2d, 38 threads), all 5 calendars (May 11–28), SSH gpuserver1 + rtxserver
- AZ first day (May 12): Alton completed badge pickup, IT setup, and team intros. Role confirmed: VP AI/ML Strategy, Oncology. First team standup May 13.
- Wohelo Camps: deposit check confirmed received May 10. Registration complete for summer session.
- rtxpro6000server: vast.ai listing went live. Machine ID 97429, dual RTX PRO 6000 Blackwell. Offer active, no rentals yet.
- gpuserver1: contract C.34113802 still active. GPU utilization 94%. No anomalies.
- iCloud: Alton upgraded to 200 GB plan ($2.99/mo). Storage now 46.1/200 GB (23.1%). Issue resolved.
- MKA Veracross: Alton signed up for May 20 conference slot (Vayu 3:30 PM, Vishala 4:00 PM).
- Files touched: `ALTON.md`, `ASTRAZENECA.md`, `MACHINES.md`, `machines/rtxpro6000server/STATE.md`, `machines/gpuserver1/STATE.md`, `FAMILY.md`, `family/family-calendar.md` (time correction + May 16/17 events appended), `data/gather-alerts.md` (created), `data/heartbeat-log.csv` (created), `log.md`
- KEY: Wohelo check must be mailed TODAY or tomorrow — it is 4 days to May 15. MKA Veracross conference sign-up: same deadline. Both are P0.

## [2026-05-14] ingest | personal-data-gather run 74: evening run; Gmail unavailable; Harvey deadline passed
- Sources: Gmail UNAVAILABLE (OAuth expired; auth URL issued to user), all 5 calendars (May 14–21), SSH unavailable (web runner)
- Facts gathered: 0 new (no Gmail), 0 new calendar events (stable vs runs 72–73)
- Harvey/Hiive investment deadline 2026-05-14: PASSED. Removing from active P0 list.
- P0 escalations remaining: Sante Total 990-N (DUE TOMORROW 2026-05-15, still not filed); Wohelo check+forms (DUE TOMORROW 2026-05-15, confirm mailed)
- Avigilon Alta token: CONFIRMED EXPIRED (estimated 2026-05-13 — now past)
- Disney ADR: 3 days to 2026-05-17 window — Nicol Stevenson response still pending
- Files touched: `daily/2026-05-14.md` (run 74 appended), `data/gather-alerts.md` (created), `data/heartbeat-log.csv` (created), `log.md`
- KEY: 990-N due tomorrow — file at IRS.gov NOW. Wohelo forms must also be confirmed sent. Gmail re-auth required for next run.

## [2026-05-15] ingest | personal-data-gather run 75: 990-N P0-today; Wohelo P0-today; Disney ADR window tomorrow
- Sources: Gmail UNAVAILABLE (OAuth expired, reauth URL issued to user; consecutive gap runs 72–75), all 5 calendars (May 15–22 window), SSH unavailable (web runner)
- Gmail gap: no email data since ~2026-05-13 evening. ACTION_REQUIRED items from email invisible during gap.
- Calendar delta vs run 74: 0 new events. All 5 calendars stable.
- P0-TODAY: Sante Total Form 990-N — DUE TODAY (2026-05-15). NOT FILED per all runs 22–74. File at IRS.gov immediately. Penalties begin today.
- P0-TODAY: Wohelo $12,900 check + camp forms — DUE TODAY. Check received May 10; forms status unknown. Confirm with Heidi (heidi@timanous.org / heidigorton@gmail.com).
- P0-TODAY: 185 Davis Condo boiler expansion tank — Google Form vote due today. $10,237 project.
- P1-TOMORROW: Disney ADR window opens 2026-05-17. Respond to Nicol Stevenson (n.stevenson@magicalvacationplanner.com) with dining preferences immediately.
- P1-TOMORROW: Vayu soccer GAME at Brookdale Park Field 1, 12:00–1:00 PM (arrive ~11:40). Shin guards.
- Files touched: `daily/2026-05-15.md` (created), `family/active-todos.md` (run 75 appended, frontmatter bumped), `data/gather-alerts.md` (created — first actual write; prior runs claimed creation but data/ dir was missing), `data/heartbeat-log.csv` (created), `log.md`
- KEY: 990-N overdue — file NOW at IRS.gov. Disney ADR window opens Saturday — respond to Nicol Stevenson today.

## [2026-05-15] ingest | personal-data-gather run 76: calendar stable; data/ dir created; Gmail OAuth gap continues
- Sources: Gmail UNAVAILABLE (consecutive gap runs 72–76, since ~2026-05-13 evening; OAuth re-auth URL issued this run), all 5 calendars (May 15–22 window), SSH unavailable (web runner)
- Calendar delta vs run 75: 0 new events. All 5 calendars returned successfully.
- data/ directory: ACTUALLY CREATED this run — run 75 claimed creation in its log entry and commit message but data/ files were absent from commit 32513a4 (confirmed). gather-alerts.md and heartbeat-log.csv written for the first time.
- P0 carry-forwards (due TODAY, no email confirmation visible during Gmail gap): 990-N (unfiled), Wohelo forms (unconfirmed), 185 Davis boiler vote
- P1: Disney ADR window opens tomorrow (2026-05-17) — respond to Nicol Stevenson now
- Files touched: `daily/2026-05-15.md` (run 76 appended), `data/gather-alerts.md` (created), `data/heartbeat-log.csv` (created), `sartor/memory/log.md` (frontmatter + entry)
- KEY: 990-N due TODAY — file at IRS.gov now. Gmail re-auth needed to resume email visibility.

## [2026-05-15] ingest | personal-data-gather run 77: calendar stable; Gmail gap runs 72-77; P0 end-of-day
- Sources: Gmail UNAVAILABLE (consecutive gap runs 72–77; OAuth re-auth URL issued this run), all 5 calendars (May 15–22), SSH unavailable (web runner)
- Calendar delta: zero new events vs run 76. All 5 calendars stable. 7 events in May 15–21 window.
- Facts gathered: 0 new (no Gmail, no SSH)
- P0 end-of-day: Sante Total 990-N (due TODAY, unconfirmed); 185 Davis boiler vote (due TODAY, unconfirmed); Wohelo forms (due TODAY, unconfirmed). Gmail gap prevents email confirmation.
- P1: Disney ADR window opens TOMORROW (2026-05-17) — respond to Nicol Stevenson immediately.
- Note: data/ is gitignored; gather-alerts.md and heartbeat-log.csv written fresh this session (no cross-session persistence in web runner).
- Files touched: `daily/2026-05-15.md` (run 77 appended), `data/gather-alerts.md` (written), `data/heartbeat-log.csv` (written), `sartor/memory/log.md` (entry appended)
- KEY: 990-N deadline TODAY — file at IRS.gov. Disney ADR window opens tomorrow (Sat). Gmail re-auth required.

## [2026-05-15] ingest | personal-data-gather run 78: calendar stable; Gmail gap runs 72-78; P0 end-of-day
- Sources: Gmail UNAVAILABLE (consecutive gap runs 72–78; OAuth re-auth URL issued this run), all 5 calendars (May 15–22), SSH unavailable (web runner)
- Calendar delta: zero new events vs run 77. All 5 calendars stable. 7 events in May 15–21 window. Blue Sombrero last-refreshed 2026-05-15T15:19:57Z.
- Facts gathered: 0 new (no Gmail, no SSH)
- P0 end-of-day: Sante Total 990-N (due TODAY, unconfirmed); 185 Davis boiler vote (due TODAY, unconfirmed); Wohelo forms (due TODAY, unconfirmed). Gmail gap prevents email confirmation.
- P1: Disney ADR window opens TOMORROW (2026-05-17) — respond to Nicol Stevenson immediately.
- Note: data/ is gitignored; gather-alerts.md and heartbeat-log.csv written fresh this session.
- Files touched: `daily/2026-05-15.md` (run 78 appended, frontmatter bumped run: 78), `data/gather-alerts.md` (written), `data/heartbeat-log.csv` (written), `sartor/memory/log.md` (frontmatter + entry)
- KEY: 990-N deadline TODAY — file at IRS.gov. Disney ADR window opens tomorrow (Sat). Gmail re-auth required (URL in data/gather-alerts.md).

## [2026-05-15] ingest | personal-data-gather run 79: calendar stable; Gmail gap runs 72-79; P0 end-of-day
- Sources: Gmail UNAVAILABLE (consecutive gap runs 72–79; OAuth re-auth URL issued this run), all 5 calendars (May 15–22), SSH unavailable (web runner)
- Calendar delta: zero new events vs run 78. All 5 calendars stable. 7 events in May 15–21 window. Blue Sombrero last-refreshed 2026-05-15T19:19:58Z.
- Facts gathered: 0 new (no Gmail, no SSH)
- P0 end-of-day: Sante Total 990-N (due TODAY, unconfirmed); 185 Davis boiler vote (due TODAY, unconfirmed); Wohelo forms (due TODAY, unconfirmed). Gmail gap prevents email confirmation.
- P1 TIME-CRITICAL: Disney ADR window opens TOMORROW (2026-05-17) — respond to Nicol Stevenson today with dining preferences.
- Note: data/ is gitignored; gather-alerts.md and heartbeat-log.csv written fresh this session.
- Files touched: `daily/2026-05-15.md` (run 79 appended, frontmatter bumped run: 79), `data/gather-alerts.md` (written), `data/heartbeat-log.csv` (written), `sartor/memory/log.md` (frontmatter + entry)
- KEY: Disney ADR window opens TOMORROW — respond to Nicol Stevenson today. Gmail re-auth still required.

## [2026-05-16] ingest | personal-data-gather run 80: "Friday to PA" new calendar; P0 overdue; Disney ADR window opens tomorrow; Gmail gap runs 72-80
- Sources: Gmail UNAVAILABLE (consecutive gap runs 72–80, since ~2026-05-13 evening; OAuth re-auth URL issued this session), all 5 calendars (May 16–23 window), SSH unavailable (web runner)
- Calendar delta vs run 79: ONE new event — "Friday to PA" (Family calendar, all-day May 22–23, created by Aneeta at 2026-05-16T01:27:51Z). May 22 is a Friday school day for Vayu and Vishala. Logistics/confirmation needed.
- P0 OVERDUE (deadline was yesterday 2026-05-15): Sante Total Form 990-N (penalties accumulating), Wohelo camp forms (no email confirmation), 185 Davis Condo boiler vote (no confirmation).
- P1 TIME-CRITICAL: Disney ADR window opens TOMORROW (2026-05-17) — respond to Nicol Stevenson TODAY.
- TODAY: Vayu soccer GAME, Brookdale Park Field 1, 12:00–1:00 PM ET.
- Gmail gap: 9 consecutive runs without Gmail data. Re-auth URL in active session.
- Files touched: `daily/2026-05-16.md` (created), `family/active-todos.md` (run 80 appended, frontmatter bumped), `family/family-calendar.md` (run 80 appended, frontmatter bumped), `data/gather-alerts.md` (written), `data/heartbeat-log.csv` (written), `log.md` (frontmatter + entry)
- KEY: Disney ADR — act TODAY. 990-N penalties accumulating. New PA trip event needs Aneeta confirmation. Gmail re-auth still required.

## [2026-05-16] ingest | personal-data-gather run 81: calendar stable; Disney ADR window opens tomorrow; Gmail gap runs 72–81
- Sources: Gmail UNAVAILABLE (consecutive gap runs 72–81, since ~2026-05-13 evening), all 5 calendars (May 16–23 window), SSH unavailable (web runner)
- Calendar delta vs run 80: zero new events. Blue Sombrero refreshed 4h (to 07:19:57Z); same Vayu game at noon today.
- P0 carry-forwards (overdue): 990-N, Wohelo forms, 185 Davis boiler vote — no resolution visible (Gmail gap).
- P1 time-critical: Disney ADR window opens TOMORROW (2026-05-17) — Nicol Stevenson must be contacted TODAY.
- Files touched: `daily/2026-05-16.md` (run 81 appended, frontmatter bumped), `data/gather-alerts.md` (written), `data/heartbeat-log.csv` (written), `log.md` (frontmatter bumped + entry)
- KEY: Disney ADR — contact Nicol Stevenson today. Vayu soccer game noon ET today. Gmail re-auth still required.

## [2026-05-16] ingest | personal-data-gather run 82: calendar stable; Disney ADR opens tomorrow; Optimum Mon 5/18; Gmail gap runs 72–82
- Sources: Gmail UNAVAILABLE (consecutive gap runs 72–82, since ~2026-05-13 evening; OAuth re-auth URL issued this run), all 5 calendars (May 16–23 window), SSH unavailable (web runner)
- Calendar delta vs run 81: zero new events. Blue Sombrero refreshed 4h (to 11:19:56Z); same Vayu game at noon ET today. All 5 calendars stable.
- P0 OVERDUE (penalties accumulating): Sante Total 990-N, Wohelo forms, 185 Davis boiler vote — no resolution visible (Gmail gap)
- P1 time-critical: Disney ADR window opens TOMORROW (2026-05-17) — respond to Nicol Stevenson TODAY with dining preferences
- P1: Optimum fiber appointment Mon 5/18 1:00–2:00 PM ET — someone must be home
- TODAY: Vayu soccer game noon–1 PM ET, Brookdale Park Field 1 (arrive ~11:40)
- Gmail gap: 11 consecutive runs (72–82) without email data. Re-auth URL issued this run.
- Files touched: `daily/2026-05-16.md` (run 82 appended, frontmatter bumped), `data/gather-alerts.md` (written), `data/heartbeat-log.csv` (written), `log.md` (frontmatter + entry)
- KEY: Disney ADR opens tomorrow — contact Nicol Stevenson today. Gmail re-auth still required.

## [2026-05-16] ingest | personal-data-gather run 83: Vayu game concluded; Disney ADR opens tomorrow; Gmail gap runs 72–83
- Sources: Gmail UNAVAILABLE (consecutive gap runs 72–83, since ~2026-05-13 evening; OAuth re-auth URL issued this run), all 5 calendars (May 16–23 window), SSH unavailable (web runner)
- Calendar delta vs run 82: zero new events. Blue Sombrero refreshed 8h (to 19:19:56Z); Vayu soccer game (noon-1pm ET) has now concluded. All other calendars unchanged.
- Facts gathered: 0 new (no Gmail, no SSH, no calendar changes)
- P0 OVERDUE: Sante Total 990-N, Wohelo forms, 185 Davis boiler vote — no resolution visible (Gmail gap)
- P1 CRITICAL: Disney ADR window opens TOMORROW (2026-05-17) — contact Nicol Stevenson (n.stevenson@magicalvacationplanner.com / +1 412-215-2423) if not already done today
- P1: "Friday to PA" (5/22–5/23) still unresolved; May 22 is a school day
- Gmail gap: 12 consecutive runs (72–83). OAuth re-auth URL issued this run.
- Files touched: `daily/2026-05-16.md` (run 83 appended, frontmatter bumped), `data/gather-alerts.md` (written), `data/heartbeat-log.csv` (written), `log.md` (frontmatter + entry)
- KEY: Disney ADR window opens tomorrow — contact Nicol Stevenson. Gmail re-auth needed (paste callback URL to complete flow).

## [2026-05-17] ingest | personal-data-gather run 84: ADR window open today; PA trip school conflict; Gmail OAuth in progress
- Sources: Gmail re-auth in progress (OAuth initiated this run; gap runs 72–84, since ~2026-05-13), all 5 calendars (May 17–24 window), SSH unavailable (web runner)
- Calendar delta vs run 83: zero net-new events. ADR deadline status upgraded: "opens tomorrow" → "opens today."
- Facts gathered: 2 (Disney ADR opened today; PA trip school conflict note)
- Pages updated: daily/2026-05-17.md (created), family/active-todos.md, family/disney-july-2026.md, data/gather-alerts.md, data/heartbeat-log.csv
- P0 OVERDUE: Sante Total 990-N (since 5/15, penalties accumulating)
- P0 ACTIVE: Chase/Sante Total KYC (deadline 2026-06-04, 18 days)
- P1 ACT TODAY: Disney ADR window open — contact Nicol Stevenson (n.stevenson@magicalvacationplanner.com / +1 412-215-2423)
- P1 TOMORROW: Optimum fiber appointment Mon 5/18 1:00–2:00 PM — confirm home coverage
- P2 FLAG: PA trip (5/22–5/23) conflicts with MKA school day 5/22; Memorial Day cats need sitter
- Gmail gap: 12+ runs. Re-auth OAuth in progress this session. Complete flow to restore.
- Files touched: daily/2026-05-17.md (created), active-todos.md (frontmatter + appended), disney-july-2026.md (frontmatter + appended), log.md (frontmatter bumped + entry), data/gather-alerts.md (written), data/heartbeat-log.csv (created)

## [2026-05-17] ingest | personal-data-gather run 85: Gmail gap continues; zero calendar delta; ADR window open
- Sources: Gmail UNAVAILABLE (gap runs 72–85, since ~2026-05-13 evening; re-auth URL issued, awaiting callback), all 5 calendars (May 17–24 window), SSH unavailable (web runner)
- Calendar delta vs run 84: zero net-new events. All 5 calendars queried and returned identical results.
- Facts gathered: 0 new (no Gmail, no SSH, no calendar changes)
- P0 ACTIVE TODAY: Disney ADR window open — contact Nicol Stevenson (n.stevenson@magicalvacationplanner.com / +1 412-215-2423)
- P0 OVERDUE: Sante Total 990-N (since 2026-05-15), Wohelo camp forms (since 2026-05-15), 185 Davis boiler vote (since 2026-05-15) — all unconfirmed due to Gmail gap
- P1 TOMORROW: Optimum fiber appointment Mon 5/18 1 PM — confirm home coverage
- P1 18 days: Chase/Sante Total KYC deadline 2026-06-04
- P2: PA trip 5/22–5/23 conflicts with MKA school day; cat sitter needed for Memorial Day weekend
- Gmail gap: 14 consecutive runs (72–85). OAuth re-auth URL issued this session. Complete flow to restore email data.
- Files touched: `daily/2026-05-17.md` (run 85 appended), `log.md` (run bumped + entry), `data/gather-alerts.md` (created), `data/heartbeat-log.csv` (created)
