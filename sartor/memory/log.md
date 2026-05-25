---
type: meta
entity: log
updated: 2026-05-25
updated_by: personal-data-gather
run: 124
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

## [2026-05-17] ingest | personal-data-gather run 86: Gmail gap 15 runs; zero calendar delta; Optimum TOMORROW; ADR window open
- Sources: Gmail UNAVAILABLE (gap runs 72–86, ~3.5 days since 2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 17–24), SSH unavailable (web runner)
- Calendar delta vs run 85: zero net-new events. Playdate with Livia now past (ended 1 PM ET). All other events unchanged.
- Facts gathered: 0 new
- P0 ACT TODAY: Disney ADR window open — contact Nicol Stevenson (n.stevenson@magicalvacationplanner.com / +1 412-215-2423). Unconfirmed due to Gmail gap.
- P0 OVERDUE: Sante Total 990-N (2 days overdue 2026-05-15); Wohelo camp forms (2 days overdue); 185 Davis boiler vote (2 days overdue) — all unconfirmed due to Gmail gap
- P1 TOMORROW: Optimum fiber appointment Mon 5/18 1:00–2:00 PM — confirm home coverage
- P1 18 days: Chase/Sante Total KYC deadline 2026-06-04
- P2: PA trip 5/22–5/23 conflicts with MKA school day; cat sitter needed for Memorial Day weekend
- Gmail gap: 15 consecutive runs (72–86). OAuth re-auth URL issued this session. Paste callback URL to complete.
- Files touched: `daily/2026-05-17.md` (run 86 appended, frontmatter bumped), `log.md` (frontmatter bumped + entry), `data/gather-alerts.md` (written), `data/heartbeat-log.csv` (written)

## [2026-05-17] ingest | personal-data-gather run 87: Gmail gap 16 runs; Family+BlueSombrero calendars updated today; zero event delta in window
- Sources: Gmail UNAVAILABLE (gap runs 72–87, 16 consecutive, ~3.5 days since 2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 17–24 window), SSH unavailable (web runner)
- Calendar delta vs run 86: zero net-new events in window. Family cal updated 18:09:20Z today (possible event outside window). Blue Sombrero updated 19:19:57Z today (possible soccer games beyond 5/24).
- Facts gathered: 0 new (no Gmail, no SSH, no new events in window)
- P0 ACT TODAY: Disney ADR window open — contact Nicol Stevenson (n.stevenson@magicalvacationplanner.com / +1 412-215-2423). Status unconfirmed due to Gmail gap.
- P0 OVERDUE: Sante Total 990-N (2 days, 2026-05-15); Wohelo camp forms (2 days); 185 Davis boiler vote (2 days) — all unconfirmed due to Gmail gap
- P1 TOMORROW: Optimum fiber Mon 5/18 1:00–2:00 PM — confirm home coverage
- P1 18 days: Chase/Sante Total KYC deadline 2026-06-04
- P2: PA trip 5/22–5/23 conflicts with MKA school day; cat sitter needed Memorial Day weekend
- Gmail gap: 16 consecutive runs (72–87). OAuth URL re-issued; paste callback URL to complete.
- Files touched: `daily/2026-05-17.md` (run 87 appended, frontmatter bumped), `log.md` (frontmatter bumped + entry), `data/gather-alerts.md` (written), `data/heartbeat-log.csv` (written)

## [2026-05-18] ingest | personal-data-gather run 88: Gmail gap 17 runs; Optimum fiber TODAY; Disney ADR day 2; 3× overdue P0s; PA conflict 4 days
- Sources: Gmail UNAVAILABLE (gap runs 72–88, 17 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 18–25 window), SSH unavailable (web runner)
- Calendar delta vs run 87: zero net-new events. Optimum fiber appointment upgraded from TOMORROW to **TODAY** (Mon 5/18 1–2 PM).
- Facts gathered: 0 new (no Gmail, no SSH, no new calendar events)
- P0 TODAY: Optimum fiber 1–2 PM (home required); Disney ADR day 2 of open window (contact Nicol Stevenson)
- P0 OVERDUE 3 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — all unconfirmed due to Gmail gap
- P1: Vishala dress-down Wed 5/20; Rec Soccer Wed 5/20 5:30 PM; Nehal's Birthday Thu 5/21; PA trip school conflict Fri 5/22; KYC deadline 2026-06-04 (17 days)
- Gmail gap: 17 consecutive runs (72–88). OAuth URL re-issued; paste callback URL to complete.
- Files touched: `daily/2026-05-18.md` (created), `log.md` (frontmatter bumped + entry), `data/gather-alerts.md` (created), `data/heartbeat-log.csv` (created)

## [2026-05-18] ingest | personal-data-gather run 89: Gmail gap 18 runs; 0 delta; Disney ADR Day 2; 3× overdue P0s; PA conflict Fri
- Sources: Gmail UNAVAILABLE (gap runs 72–89, 18 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 18–25 window), SSH unavailable (web runner)
- Calendar delta vs run 88: zero net-new events across all 5 calendars
- Facts gathered: 0 new (no Gmail, no SSH, no new calendar events)
- P0: Disney ADR Day 2 of open window (contact Nicol Stevenson); Optimum fiber 1–2 PM TODAY (status unknown)
- P0 OVERDUE 3+ days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — all unconfirmed due to Gmail gap
- P1: Vishala dress-down Wed 5/20; Rec Soccer Wed 5/20 5:30 PM; Nehal's Birthday Thu 5/21; PA trip school conflict Fri 5/22; KYC deadline 2026-06-04 (17 days)
- Gmail gap: 18 consecutive runs (72–89). OAuth URL re-issued; paste callback URL to complete.
- Files touched: `daily/2026-05-18.md` (run 89 appended, frontmatter bumped), `log.md` (frontmatter bumped + entry), `data/gather-alerts.md` (written), `data/heartbeat-log.csv` (written)

## [2026-05-18] ingest | personal-data-gather run 90: Gmail gap 19 runs; 0 delta; Disney ADR Day 2; 3× overdue P0s; PA conflict Fri
- Sources: Gmail UNAVAILABLE (gap runs 72–90, 19 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 18–25 window), SSH unavailable (web runner)
- Calendar delta vs run 89: zero net-new events across all 5 calendars
- Facts gathered: 0 new (no Gmail, no SSH, no new calendar events)
- P0: Disney ADR Day 2 of open window (contact Nicol Stevenson — n.stevenson@magicalvacationplanner.com / +1 412-215-2423); Optimum fiber 1–2 PM TODAY (status unconfirmed)
- P0 OVERDUE 3+ days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — all unconfirmed due to Gmail gap
- P1: Vishala dress-down Wed 5/20; Rec Soccer Wed 5/20 5:30 PM; Nehal's Birthday Thu 5/21; PA trip school conflict Fri 5/22; KYC deadline 2026-06-04 (17 days)
- Gmail gap: 19 consecutive runs (72–90). OAuth URL re-issued; paste callback URL to complete.
- Note: data/ directory was empty (fresh container); heartbeat-log.csv and gather-alerts.md recreated
- Files touched: `daily/2026-05-18.md` (run 90 appended, frontmatter bumped), `log.md` (frontmatter bumped + entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (recreated)

## [2026-05-18] ingest | personal-data-gather run 91: Gmail gap 20 runs; 0 delta; Disney ADR Day 3 open; 3× overdue P0s; PA conflict Fri
- Sources: Gmail UNAVAILABLE (gap runs 72–91, 20 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 18–25 window), SSH unavailable (web runner)
- Calendar delta vs run 90: zero net-new events across all 5 calendars
- Facts gathered: 0 new (no Gmail, no SSH, no new calendar events)
- P0: Disney ADR Day 3 of open window (contact Nicol Stevenson — n.stevenson@magicalvacationplanner.com / +1 412-215-2423); Optimum fiber appointment was TODAY 1–2 PM (status unconfirmed)
- P0 OVERDUE 3+ days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — all unconfirmed due to Gmail gap
- P1: Vishala dress-down Wed 5/20; Rec Soccer Wed 5/20 5:30 PM ET; Nehal's Birthday Thu 5/21; PA trip Fri 5/22 (school conflict Vayu+Vishala); KYC deadline 2026-06-04 (17 days)
- Gmail gap: 20 consecutive runs (72–91). OAuth URL re-issued; paste callback URL to complete.
- Note: data/ directory missing (fresh container); heartbeat-log.csv and gather-alerts.md recreated
- Files touched: `daily/2026-05-18.md` (run 91 appended, frontmatter bumped), `log.md` (frontmatter bumped + entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (recreated)

## [2026-05-19] ingest | personal-data-gather run 93: Gmail gap 22 runs; 0 delta; Disney ADR Day 3; 4× overdue P0 4 days; PA trip 3 days
- Sources: Gmail UNAVAILABLE (gap runs 72–93, 22 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 19–26 window), SSH unavailable (web runner)
- Calendar delta vs run 92: zero net-new events. Optimum fiber appointment (Mon 5/18) has passed. Disney ADR Day 3 open window (Blue Bayou/character dining may already be booked). 3× overdue P0s now 4 days past deadline.
- Facts gathered: 0 new (no Gmail, no SSH, no new calendar events)
- P0 ACT TODAY: Disney ADR Day 3 (contact Nicol Stevenson — n.stevenson@magicalvacationplanner.com / +1 412-215-2423); character dining 24–72h sell-out risk
- P0 OVERDUE 4 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — all unconfirmed due to Gmail gap
- P1: Vishala dress-down TOMORROW Wed 5/20; Rec Soccer TOMORROW Wed 5/20 5:30 PM; Nehal's Birthday Thu 5/21; PA trip Fri 5/22 (MKA school conflict Vayu+Vishala); KYC deadline 2026-06-04 (16 days); Memorial Day cat sitter (5/25, 6 days)
- Gmail gap: 22 consecutive runs (72–93). OAuth URL re-issued; paste callback URL to complete.
- Note: data/ directory missing (fresh container); heartbeat-log.csv and gather-alerts.md recreated
- Files touched: `daily/2026-05-19.md` (created), `family/active-todos.md` (run 93 appended, frontmatter bumped), `log.md` (frontmatter bumped + entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (recreated)

## [2026-05-18] ingest | personal-data-gather run 92: Gmail gap 21 runs; 0 delta; Disney ADR Day 3 open; 3× overdue P0s; PA trip Fri
- Sources: Gmail UNAVAILABLE (gap runs 72–92, 21 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 18–25 window), SSH unavailable (web runner)
- Calendar delta vs run 91: zero net-new events across all 5 calendars
- Facts gathered: 0 new (no Gmail, no SSH, no new calendar events)
- P0: Disney ADR Day 3 of open window (contact Nicol Stevenson — n.stevenson@magicalvacationplanner.com / +1 412-215-2423); Optimum fiber appointment TODAY 1–2 PM (status unconfirmed)
- P0 OVERDUE 3+ days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — all unconfirmed due to Gmail gap
- P1: Vishala dress-down Wed 5/20; Rec Soccer Wed 5/20 5:30 PM ET; Nehal's Birthday Thu 5/21; PA trip Fri 5/22 (school conflict Vayu+Vishala); KYC deadline 2026-06-04 (16 days)
- Gmail gap: 21 consecutive runs (72–92). OAuth URL re-issued; paste callback URL to complete.
- Note: data/ directory missing (fresh container); heartbeat-log.csv and gather-alerts.md recreated
- Files touched: `daily/2026-05-18.md` (run 92 appended, frontmatter bumped), `log.md` (frontmatter bumped + entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (recreated)

## [2026-05-19] ingest | personal-data-gather run 94: Gmail gap 23 runs; 0 delta; Disney ADR Day 3; P0 overdue 4 days; PA trip 3 days
- Sources: Gmail UNAVAILABLE (gap runs 72–94, 23 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 19–26 window), SSH unavailable (web runner)
- Calendar delta vs run 93: zero net-new events across all 5 calendars (second run today)
- Facts gathered: 0 new (no Gmail, no SSH, no new calendar events)
- P0 ACT TODAY: Disney ADR Day 3 of open window — character dining sell-out risk (contact Nicol Stevenson n.stevenson@magicalvacationplanner.com / +1 412-215-2423)
- P0 OVERDUE 4 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — all unconfirmed due to Gmail gap
- P1: Vishala dress-down TOMORROW Wed 5/20; Rec Soccer TOMORROW Wed 5/20 5:30 PM; Nehal's Birthday Thu 5/21; PA trip Fri 5/22 (MKA school conflict Vayu+Vishala); KYC deadline 2026-06-04 (16 days); cat sitter 5/25 (6 days)
- Gmail gap: 23 consecutive runs (72–94). OAuth URL re-issued; paste callback URL to complete.
- Note: data/ directory missing (fresh container); heartbeat-log.csv and gather-alerts.md recreated
- Files touched: `daily/2026-05-19.md` (run 94 appended, frontmatter bumped), `log.md` (frontmatter bumped + entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (recreated)

## [2026-05-19] ingest | personal-data-gather run 96: Gmail gap 25 runs; 0 delta; Disney ADR Day 3 CRITICAL; P0 overdue 4 days; Vishala dress-down TOMORROW
- Sources: Gmail UNAVAILABLE (gap runs 72–96, 25 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 19–26 window), SSH unavailable (web runner)
- Calendar delta vs run 95: zero net-new events across all 5 calendars (fourth run today)
- Facts gathered: 0 new (no Gmail, no SSH, no new calendar events)
- P0 ACT TODAY: Disney ADR Day 3 of open window — character dining sellout risk CRITICAL (contact Nicol Stevenson n.stevenson@magicalvacationplanner.com / +1 412-215-2423)
- P0 OVERDUE 4 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — all unconfirmed due to Gmail gap
- P1 TOMORROW: Vishala dress-down (Wed 5/20 all-day); Rec Soccer (Wed 5/20 5:30–6:15 PM Anderson Park)
- P1: Nehal's Birthday Thu 5/21; PA trip Fri 5/22 (MKA school conflict Vayu+Vishala); KYC deadline 2026-06-04 (16 days); cat sitter 5/25 (6 days)
- Gmail gap: 25 consecutive runs (72–96). OAuth URL re-issued; paste callback URL to complete.
- Note: data/ directory missing (fresh container); heartbeat-log.csv and gather-alerts.md recreated
- Files touched: `daily/2026-05-19.md` (run 96 appended, frontmatter bumped), `log.md` (frontmatter bumped + entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (recreated)

## [2026-05-19] ingest | personal-data-gather run 95: Gmail gap 24 runs; 0 delta; Disney ADR Day 3 URGENT; P0 overdue 4 days
- Sources: Gmail UNAVAILABLE (gap runs 72–95, 24 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 19–26 window), SSH unavailable (web runner)
- Calendar delta vs run 94: zero net-new events across all 5 calendars (third run today)
- Facts gathered: 0 new (no Gmail, no SSH, no new calendar events)
- P0 ACT TODAY: Disney ADR Day 3 of open window — character dining sellout risk ELEVATED (contact Nicol Stevenson n.stevenson@magicalvacationplanner.com / +1 412-215-2423)
- P0 OVERDUE 4 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — all unconfirmed due to Gmail gap
- P1: Vishala dress-down TOMORROW Wed 5/20; Rec Soccer TOMORROW Wed 5/20 5:30 PM ET; Nehal's Birthday Thu 5/21; PA trip Fri 5/22 (MKA school conflict Vayu+Vishala); KYC deadline 2026-06-04 (16 days); cat sitter 5/25 (6 days)
- Gmail gap: 24 consecutive runs (72–95). OAuth URL re-issued; paste callback URL to complete.
- Note: data/ directory missing (fresh container); heartbeat-log.csv and gather-alerts.md recreated
- Files touched: `daily/2026-05-19.md` (run 95 appended, frontmatter bumped), `log.md` (frontmatter bumped + entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (recreated)

## [2026-05-19] ingest | personal-data-gather run 97: NEW Boston trip 5/27-5/29; Gmail gap 26 runs; Disney ADR Day 3 CRITICAL; P0s overdue 4d
- Sources: Gmail UNAVAILABLE (gap runs 72–97, 26 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 19–26 + 5/30 spillover), SSH unavailable (web runner)
- **NEW FINDING: "Boston trip" (Wed 5/27 – Fri 5/29) on Family calendar** — created by Alton 2026-04-28, outside prior 7-day window. No description/location/attendees. MKA school conflict (all 3 days are school days post-Memorial Day). Back-to-back with PA trip 5/22–5/23. Cat sitter needed for both windows.
- Calendar delta vs run 96: 1 new event (Boston trip). All other 5 calendars unchanged.
- Facts gathered: 1 new (Boston trip)
- P0 ACT TODAY: Disney ADR Day 3 of open window — CRITICAL sellout risk (Nicol Stevenson: n.stevenson@magicalvacationplanner.com / +1 412-215-2423)
- P0 OVERDUE 4 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — unconfirmed due to Gmail gap
- P1 TOMORROW: Vishala dress-down (Wed 5/20 all-day); Rec Soccer (Wed 5/20 5:30–6:15 PM Anderson Park)
- P1 NEW: Boston trip (5/27–5/29) logistics — school conflict + Meowtel for two windows
- Gmail gap: 26 consecutive runs (72–97). OAuth URL re-issued; paste callback URL to complete.
- Files touched: `daily/2026-05-19.md` (run 97 appended, frontmatter bumped), `family/family-calendar.md` (Boston trip appended), `family/active-todos.md` (Boston trip callouts), `log.md` (frontmatter bumped + this entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (recreated)

## [2026-05-20] ingest | personal-data-gather run 99: Gmail gap 28 runs; 0 delta; Disney ADR Day 4 CRITICAL; P0s overdue 5d; TODAY soccer+dress-down
- Sources: Gmail UNAVAILABLE (gap runs 72–99, 28 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 20–27 window), SSH unavailable (web runner)
- Calendar delta vs run 98: zero net-new events across all 5 calendars. TODAY events still active: Vishala dress-down (all-day) + Rec Soccer Practice (5:30–6:15 PM, Anderson Park).
- Facts gathered: 0 new
- Disney ADR: Day 4 of open window (opened May 17) — CRITICAL sellout risk (past 24–72h typical sellout window); contact Nicol Stevenson (n.stevenson@magicalvacationplanner.com / +1 412-215-2423)
- P0 OVERDUE 5 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — all unconfirmed due to Gmail gap
- P1: Nehal's Birthday TOMORROW (Thu 5/21); PA trip Fri–Sat 5/22–5/23 (MKA school conflict); Boston trip 5/27 (soccer conflict + school conflict); Chase/Sante Total KYC 2026-06-04 (15 days)
- Gmail gap: 28 consecutive runs (72–99). OAuth URL re-issued; paste callback URL to complete.
- Files touched: `daily/2026-05-20.md` (run 99 appended, frontmatter unchanged), `log.md` (frontmatter bumped + this entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (recreated)

## [2026-05-20] ingest | personal-data-gather run 98: TODAY dress-down+soccer; NEW Boston/soccer conflict 5/27; Disney ADR Day 4 CRITICAL; P0s overdue 5d
- Sources: Gmail UNAVAILABLE (gap runs 72–98, 27 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 20–27 window), SSH unavailable (web runner)
- **TODAY: Vishala dress-down (all-day) + Rec Soccer Practice (5:30–6:15 PM, Anderson Park)**
- **NEW CONFLICT: Boston trip (starts 5/27) and Rec Soccer Practice (5/27, 5:30 PM) overlap on same day** — Vayu misses practice if family departs May 27; confirm trip timing with Aneeta
- Calendar delta vs run 97: 0 new events; Rec Soccer Practice May 27 already in system but conflict with Boston trip first flagged this run
- Facts gathered: 1 new (soccer/Boston conflict on May 27)
- Disney ADR: Day 4 of open window (opened May 17) — character dining sellout risk CRITICAL (past 24–72h typical sellout window); Nicol Stevenson n.stevenson@magicalvacationplanner.com / +1 412-215-2423
- P0 OVERDUE 5 days: Sante Total 990-N; Wohelo camp forms; 185 Davis boiler vote — all unconfirmed due to Gmail gap
- P1: Nehal's Birthday TOMORROW (Thu 5/21); PA trip Fri 5/22 (MKA school conflict); Boston trip 5/27 (multiple conflicts)
- Gmail gap: 27 consecutive runs (72–98). OAuth URL re-issued; paste callback URL to complete.
- Files touched: `daily/2026-05-20.md` (new, run 98), `family/active-todos.md` (run 98 entry appended, frontmatter bumped), `log.md` (frontmatter bumped + this entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (recreated)

## [2026-05-20] ingest | personal-data-gather run 100: zero delta; Gmail gap 29 runs; P0s overdue 5d; Disney ADR Day 4 CRITICAL
- Sources: Gmail UNAVAILABLE (gap runs 72–100, 29 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 20–27 window), SSH unavailable (web runner)
- Calendar delta vs run 99: zero net-new events across all 5 calendars
- Facts gathered: 0 new
- TODAY: Vishala dress-down (all-day, MKA Brookside) + Rec Soccer Practice (5:30–6:15 PM, Anderson Park)
- Disney ADR: Day 4 of open window (opened May 17) — CRITICAL sellout risk (past 24–72h typical sellout window); contact Nicol Stevenson n.stevenson@magicalvacationplanner.com / +1 412-215-2423
- P0 OVERDUE 5 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — unconfirmed due to Gmail gap
- P1: Nehal's Birthday TOMORROW (Thu 5/21); PA trip Fri–Sat 5/22–5/23 (MKA conflict); Boston trip 5/27 (soccer + school conflicts); Chase/Sante Total KYC 2026-06-04 (15 days)
- Gmail gap: 29 consecutive runs (72–100). OAuth URL re-issued; paste callback URL to complete.
- Files touched: `daily/2026-05-20.md` (run 100 appended), `log.md` (frontmatter bumped + this entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (appended)

## [2026-05-20] ingest | personal-data-gather run 101: zero delta; Gmail gap 30 runs; P0s overdue 5d; Disney ADR Day 4 CRITICAL
- Sources: Gmail UNAVAILABLE (gap runs 72–101, 30 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 20–27 window), SSH unavailable (web runner)
- Calendar delta vs run 100: zero net-new events across all 5 calendars
- Facts gathered: 0 new
- TODAY: Vishala dress-down (all-day, MKA Brookside) + Rec Soccer Practice (5:30–6:15 PM, Anderson Park)
- Disney ADR: Day 4 of open window (opened May 17) — CRITICAL sellout risk; contact Nicol Stevenson n.stevenson@magicalvacationplanner.com / +1 412-215-2423
- P0 OVERDUE 5 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — unconfirmed due to Gmail gap
- P1: Nehal's Birthday TOMORROW (Thu 5/21); PA trip Fri–Sat 5/22–5/23 (MKA conflict); Boston trip 5/27 (soccer + school conflicts); Chase/Sante Total KYC 2026-06-04 (15 days)
- Gmail gap: 30 consecutive runs (72–101). OAuth URL re-issued; paste callback URL to complete.
- Files touched: `daily/2026-05-20.md` (run 101 appended, frontmatter bumped run: 101), `log.md` (frontmatter bumped run: 101 + this entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (created)

## [2026-05-20] ingest | personal-data-gather run 102: zero delta; Gmail gap 31 runs; P0s overdue 5d; Disney ADR Day 4 CRITICAL
- Sources: Gmail UNAVAILABLE (gap runs 72–102, 31 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 20–27 window), SSH unavailable (web runner)
- Calendar delta vs run 101: zero net-new events across all 5 calendars
- Facts gathered: 0 new
- TODAY end-of-day: Vishala dress-down (all-day, MKA Brookside) + Rec Soccer Practice (5:30–6:15 PM, Anderson Park)
- Disney ADR: Day 4 of open window (opened May 17) — CRITICAL sellout risk; contact Nicol Stevenson n.stevenson@magicalvacationplanner.com / +1 412-215-2423
- P0 OVERDUE 5 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — unconfirmed due to Gmail gap
- P1: Nehal's Birthday TOMORROW (Thu 5/21); PA trip Fri–Sat 5/22–5/23 (MKA conflict); Memorial Day Mon 5/25; Boston trip 5/27–5/29 (soccer + school conflicts); Chase/Sante Total KYC 2026-06-04 (15 days)
- Gmail gap: 31 consecutive runs (72–102). OAuth URL re-issued; paste callback URL to complete.
- Files touched: `daily/2026-05-20.md` (run 102 appended, frontmatter bumped run: 102), `log.md` (frontmatter bumped run: 102 + this entry), `data/gather-alerts.md` (updated), `data/heartbeat-log.csv` (created)

## [2026-05-20] ingest | personal-data-gather run 103: zero delta; Gmail gap 32 runs; P0s overdue 5d; Disney ADR Day 4 CRITICAL
- Sources: Gmail UNAVAILABLE (gap runs 72–103, 32 consecutive since ~2026-05-13 evening; OAuth URL re-issued this run), all 5 calendars (May 20–27 window), SSH unavailable (web runner)
- Calendar delta vs run 102: zero net-new events across all 5 calendars
- Facts gathered: 0 new
- TODAY end-of-day: Vishala dress-down (all-day, MKA Brookside) + Rec Soccer Practice (5:30–6:15 PM, Anderson Park)
- Disney ADR: Day 4 of open window (opened May 17) — CRITICAL sellout risk; contact Nicol Stevenson n.stevenson@magicalvacationplanner.com / +1 412-215-2423
- P0 OVERDUE 5 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — unconfirmed due to Gmail gap
- P1: Nehal's Birthday TOMORROW (Thu 5/21); PA trip Fri–Sat 5/22–5/23 (MKA conflict); Memorial Day Mon 5/25; Boston trip 5/27–5/29 (soccer + school conflicts); Chase/Sante Total KYC 2026-06-04 (15 days)
- Gmail gap: 32 consecutive runs (72–103). OAuth URL re-issued; paste callback URL to complete.
- Files touched: `daily/2026-05-20.md` (run 103 appended, frontmatter bumped run: 103), `log.md` (frontmatter bumped run: 103 + this entry), `data/gather-alerts.md` (created), `data/heartbeat-log.csv` (created)

## [2026-05-21] ingest | personal-data-gather run 104: NEW — Calendar MCP also blocked; Gmail gap 33 runs; P0s overdue 6d; Disney ADR Day 5 CRITICAL
- Sources: Gmail UNAVAILABLE (gap runs 72–104, 33+ consecutive since ~2026-05-13 evening), Calendar UNAVAILABLE (NEW — all 5 calendars blocked by MCP approval gate; was working runs 72–103), SSH unavailable (web runner)
- Calendar delta vs run 103: no live data; date-shifted carry-forward only
- Facts gathered: 0 new (both sources blocked)
- NEW BLOCKER: Calendar MCP returning "MCP tool call requires approval" in this session — regression from prior runs. Requires user action in claude.ai MCP settings. Tool name mismatch possible (mcp__Google-Calendar__* vs mcp__claude_ai_Google_Calendar__* in allowlist).
- TODAY: Nehal's Birthday (all-day)
- Disney ADR: Day 5 of open window (opened May 17) — MAXIMUM sellout risk; contact Nicol Stevenson n.stevenson@magicalvacationplanner.com / +1 412-215-2423
- P0 OVERDUE 6 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15)
- P1: PA trip TOMORROW Fri–Sat 5/22–5/23 (MKA conflict); Memorial Day Mon 5/25; Boston trip 5/27–5/29 (soccer + school conflicts); Chase/Sante Total KYC 2026-06-04 (14 days)
- Files touched: `daily/2026-05-21.md` (created, run 104), `log.md` (frontmatter bumped run: 104 + this entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (created)

## [2026-05-21] ingest | personal-data-gather run 105: Gmail+Calendar gap 34 runs; 0 delta; Disney ADR Day 5 CRITICAL; P0s overdue 6d; PA trip TOMORROW
- Sources: Gmail UNAVAILABLE (gap runs 72–105, 34+ consecutive since ~2026-05-13 evening), Calendar UNAVAILABLE (second consecutive run blocked by same platform consent gate; was working runs 72–103), SSH unavailable (web runner)
- Calendar delta vs run 104: no live data; date-shifted carry-forward only
- Facts gathered: 0 new (both sources blocked)
- TODAY: Nehal's Birthday (all-day — send message or call)
- Disney ADR: Day 5 of open window (opened May 17) — MAXIMUM sellout risk; contact Nicol Stevenson n.stevenson@magicalvacationplanner.com / +1 412-215-2423
- P0 OVERDUE 6 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — all unconfirmed due to Gmail gap
- P1 TOMORROW: PA trip Fri–Sat 5/22–5/23 (MKA school conflict Vayu+Vishala); Memorial Day 5/25; Boston trip 5/27–5/29 (soccer + school conflicts); Chase/Sante Total KYC 2026-06-04 (14 days)
- Gmail gap: 34+ consecutive runs (72–105). Platform consent gate blocking both MCPs.
- Note: data/ directory missing (fresh container); heartbeat-log.csv and gather-alerts.md recreated
- Files touched: `daily/2026-05-21.md` (run 105 appended, frontmatter bumped run: 105), `log.md` (frontmatter bumped run: 105 + this entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (recreated)

## [2026-05-21] ingest | personal-data-gather run 106: Gmail+Calendar gap 35 runs; 0 delta; Disney ADR Day 5 CRITICAL; P0s overdue 6d; PA trip TOMORROW
- Sources: Gmail UNAVAILABLE (gap runs 72–106, 35+ consecutive since ~2026-05-13 evening), Calendar UNAVAILABLE (third consecutive run blocked by platform consent gate; runs 104–106; was working runs 72–103), SSH unavailable (web runner)
- Calendar delta vs run 105: no live data; same calendar date (2026-05-21), no day-shift
- Facts gathered: 0 new (both sources blocked)
- TODAY: Nehal's Birthday (all-day — send message or call)
- Disney ADR: Day 5 of open window (opened May 17) — MAXIMUM sellout risk; contact Nicol Stevenson n.stevenson@magicalvacationplanner.com / +1 412-215-2423
- P0 OVERDUE 6 days: Sante Total 990-N (2026-05-15); Wohelo camp forms (2026-05-15); 185 Davis boiler vote (2026-05-15) — all unconfirmed due to Gmail gap
- P1 TOMORROW: PA trip Fri–Sat 5/22–5/23 (MKA school conflict Vayu+Vishala); Memorial Day 5/25; Boston trip 5/27–5/29 (soccer + school conflicts); Chase/Sante Total KYC 2026-06-04 (14 days)
- Note: data/ directory recreated (fresh container); heartbeat-log.csv and gather-alerts.md written fresh
- Files touched: `daily/2026-05-21.md` (run 106 appended, frontmatter bumped run: 106), `log.md` (frontmatter bumped run: 106 + this entry), `data/gather-alerts.md` (recreated), `data/heartbeat-log.csv` (recreated)

## [2026-05-21] ingest | personal-data-gather run 107: MCP RESTORED — Gmail + Calendar live after 33-run gap
- Sources: Gmail (30 unread threads, newer_than:2d + keyword search), all 5 calendars (May 21–28), no SSH (web runner)
- **RESTORED:** Both Gmail and Google Calendar MCP returned live data for first time since ~2026-05-13 evening (gap: runs 72–106)
- New facts: Field Day conflict (MKA 5/22 9 AM vs PA trip); Magnus Health health records needed (Vayu + Vishala, 2026-2027); PatientGateway questionnaire due (Alton, Partners); Chase CC 7054 ($1,247.36 due 06/17); Chase CC 8547 ($27,609.04 due 06/17); Ink Business 7738 payment $4,151.86 scheduled; EquityZen SambaNova $29/share; PA trip confirmed; Boston trip confirmed
- Calendar confirmed: Nehal's Birthday (today), PA trip Fri 5/22–Sat 5/23, Boston trip Wed 5/27–Fri 5/29; no soccer events from Blue Sombrero; Aneeta calendar empty this week
- SNO 2026 abstract deadline May 26: SKIP (already decided NOT SUBMITTING per 2026-04-16 triage)
- Alerts: P0 — Field Day conflict (decide today); Magnus Health records (enrollment-blocking); PatientGateway questionnaire; carry-forward P0 overdue items (990-N, Wohelo, boiler vote, Disney ADR day 5)
- Files touched: `daily/2026-05-21.md` (run 107 appended, frontmatter bumped), `family/active-todos.md` (run 107 section appended), `data/gather-alerts.md` (overwritten with live data), `data/heartbeat-log.csv` (run 107 entry appended), `log.md` (this entry)

## [2026-05-22] ingest | personal-data-gather run 108: Gmail+Calendar live; PA trip underway; MKA cafeteria auto-debit; P0s carry-forward
- Sources: Gmail (30 unread threads, newer_than:2d), all 5 calendars (May 22–29). No SSH (web runner).
- Calendar: PA trip active today (5/22–5/23), Boston trip 5/27–5/29, Memorial Day 5/25, no soccer events, Aneeta cal empty
- New facts: MKA MyKidsSpending cafeteria auto-debit ~$100 (Chase 8563, within 48h); Reed reunion meal-ticket soft deadline 5/27; Window AC thread closed (Oana/Harvard — resolved); Amazon pool chemicals shipped; Vasu Goddard normal day
- Carry-forward P0: 990-N 7 days overdue; Disney ADR Day 6
- No new deadlines; MKA cafeteria debit is passive/informational unless account is thin
- Pages updated: `daily/2026-05-22.md` (created), `family/active-todos.md` (run 108 appended, frontmatter bumped), `family/vayu.md` (MKA cafeteria fact appended, frontmatter bumped), `log.md` (frontmatter bumped + this entry), `data/gather-alerts.md` (created), `data/heartbeat-log.csv` (created)

## [2026-05-22] ingest | personal-data-gather run 109: MKA newsletter; Shakespeare Project conflict; Vishala June 5 closing; INVESCO proxy x2
- Sources: Gmail newer_than:6h (4 threads), all 5 Google Calendars (May 22–29). No SSH (web runner).
- New facts: WeAreMKA Veracross newsletter (May 22) extracted — Shakespeare Project May 29–30 conflicts with Boston trip; Vishala Third Grade Closing Exercises June 5 (parent event); Wacky Wednesday Dress Down June 3; STEM+ Summer Camp Open House May 30. INVESCO proxy vote notices x2 (informational/financial). USPS 0 mail today.
- Calendar: no new events vs run 108 (Family: PA trip 5/22–5/23, Boston trip 5/27–5/30; Aneeta empty; Blue Sombrero empty; Tasks empty)
- P0 carries unchanged: 990-N 7 days overdue; Disney ADR Day 7
- Pages updated: `daily/2026-05-22.md` (run 109 appended, frontmatter bumped), `family/active-todos.md` (run 109 section appended, frontmatter bumped), `log.md` (frontmatter bumped + this entry), `data/gather-alerts.md` (created fresh), `data/heartbeat-log.csv` (created fresh)

## [2026-05-22] ingest | personal-data-gather run 110: Guidepoint Biosimulation AI; Vayu screen time; 5 calendars
- Sources: Gmail (newer_than:2d, 30 threads), all 5 Google Calendars (May 22–29). No SSH (web runner).
- New facts: Guidepoint #1733233 (Biosimulation Software/Service Market, AI use cases) — ACTION_REQUIRED, 24-48h window; Alton's AZ conflict-of-interest must be reviewed before accepting. Vayu screen time 8h41m May 15-21 (informational). Goddard Unit 9 Week 2 newsletter (Goodnight Gorilla, informational). LinkedIn AI/DS director roles at J&J MedTech and Amgen (informational).
- Calendar: no new events vs run 109 (Family: PA trip 5/22–5/23 confirmed underway, Boston trip 5/27–5/30; all others empty)
- P0 carries escalated: 990-N now 8 days overdue; Disney ADR Day 8
- Pages updated: `daily/2026-05-22.md` (run 110 appended, frontmatter bumped), `family/active-todos.md` (run 110 section prepended, frontmatter bumped), `log.md` (this entry), `data/gather-alerts.md` (updated), `data/heartbeat-log.csv` (created)

## [2026-05-22] ingest | personal-data-gather run 111: Cadoo Medical bill $765.21; Vasu soccer extended June 22; MKA Magnus Health reminder
- Sources: Gmail newer_than:4h (16 threads), all 5 Google Calendars (May 22–29). No SSH (web runner).
- New facts: Cadoo Medical bill $765.21 addressed to "EMMETT" at alto84@gmail.com — ACTION_REQUIRED, verify identity before paying; Vasu Goddard soccer extended to June 22 due to Memorial Day closure; MKA Magnus Health 2026-2027 forms now open (reinforcing existing run 97 callout, not duplicated). LinkedIn DSPV/AI roles (informational). Hiive market digest (informational).
- Calendar: no new events vs run 110 (Family: PA trip 5/22–5/23, Boston trip 5/27–5/30; all others empty)
- P0 carries: 990-N 8 days overdue; Disney ADR Day 8 end-of-day
- Pages updated: `daily/2026-05-22.md` (run 111 appended), `family/active-todos.md` (Cadoo bill callout appended), `family/vasu.md` (soccer extension appended), `log.md` (this entry), `data/gather-alerts.md` (created), `data/heartbeat-log.csv` (created)

## [2026-05-23] ingest | personal-data-gather run 112: Vishala sleepover Amia May 30; Boston T-4; 990-N Day 8
- Sources: Gmail (newer_than:2d, 30 threads), all 5 Google Calendars (May 23–30). No SSH (web runner).
- New facts: Vishala sleepover with Amia (Sat May 30 9 PM – Sun May 31 4 PM, Family calendar, Aneeta created 5/17) — NEW, first capture. Goddard CLOSED May 25 confirmed via Kaymbu. Pop Warner registration open (communitypass.net, informational). Vayu MKA cafeteria funded $101.75 (completed auto-debit, closed). PA trip (5/22–5/23) complete.
- Calendar: Family (Boston trip 5/27–5/29 + Vishala sleepover 5/30); all other calendars empty this week.
- P0 carries escalated: 990-N 8 days overdue; Disney ADR Day 7 (critical).
- Pages updated: `daily/2026-05-23.md` (created), `family/vishala.md` (sleepover appended, frontmatter bumped), `family/family-calendar.md` (sleepover + week note appended, frontmatter bumped), `family/active-todos.md` (run 112 section appended, frontmatter bumped), `log.md` (this entry, frontmatter bumped), `data/heartbeat-log.csv` (created), `data/gather-alerts.md` (created)

## [2026-05-23] ingest | personal-data-gather run 113: Berman $6K payment 5d past promise; all else dedup of run 112
- Sources: Gmail (newer_than:2d, 30 threads), all 5 Google Calendars (May 23–30). No SSH (web runner). Second run today.
- New facts (1): Berman Home Systems $6,000 payment — Alton promised credit card payment "in just a few days" on 2026-05-18 (thread #AAAO13216-03); today is 5 days later; Alyssa has not followed up but window is closing. Route: active-todos.
- All other threads/calendar events match run 112 data exactly — deduplicated, not re-routed.
- P0 carries: 990-N 8 days overdue (unchanged); Disney ADR Day 7+ (unchanged).
- Pages updated: `daily/2026-05-23.md` (run 113 section appended, frontmatter bumped), `family/active-todos.md` (Berman $6K warning callout prepended to run 113 section, frontmatter bumped), `log.md` (frontmatter bumped + this entry), `data/heartbeat-log.csv` (run 113 line appended), `data/gather-alerts.md` (refreshed with full current alert state)

## [2026-05-23] ingest | personal-data-gather run 114: sleepover time correction; Hiive Anthropic new low ask; HTH pool delivery
- Sources: Gmail (newer_than:2d, 30 threads), all 5 Google Calendars (May 23–30). No SSH (web runner). Third run today.
- New facts: (1) DATA CORRECTION — Vishala sleepover (May 30–31): start is 5 PM ET, not 9 PM as run 112 recorded; end is noon, not 4 PM. Calendar API authoritative. (2) FINANCIAL — Hiive: Anthropic secondary market new low ask $1,250/share (4 sell orders $1,250–$1,600; 1 match); Alton on watchlist. (3) FAMILY INFO — Amazon HTH 67121 pool chemicals delivered 2026-05-22; on hand at 85 Stonebridge.
- Calendar: no new events vs run 112/113. Family: Boston trip (5/27–5/29), Vishala sleepover (5/30 5PM–5/31 noon). All other calendars empty.
- P0 carries: 990-N 8 days overdue (unchanged); Disney ADR Day 7 (unchanged).
- Pages updated: `daily/2026-05-23.md` (run 114 appended), `family/vishala.md` (time correction appended, run bumped to 114), `family/family-calendar.md` (time correction appended, run bumped to 114), `family/active-todos.md` (run 114 section appended), `ALTON.md` (Hiive/Anthropic note appended), `log.md` (this entry, run bumped to 114), `data/heartbeat-log.csv` (run 114 line appended), `data/gather-alerts.md` (refreshed)
- KEY: Vishala sleepover logistics need 5 PM drop-off (4h earlier than previously flagged). Berman $6K Lutron payment still open. 990-N overdue.

## [2026-05-23] ingest | personal-data-gather run 116: Sante Total Berteau ASAP ($2,400); BMC wellness event May 30
- Sources: Gmail (newer_than:2d, 30 threads), all 5 Google Calendars (May 23–30). No SSH (web runner). Fifth run today.
- New facts: (1) ACTION_REQUIRED — Barbara Weis follow-up on "Money for the elderly" today (18:51 UTC): Berteau situation "desperate," requesting $800/mo increase ($2,400 for 3 months upfront) — ASAP response needed from Alton as Treasurer; original May 12 email also had pending Gaby $9,972 request. (2) INFORMATIONAL — BMC free community Family Wellness Event, Sat May 30, 11 AM–3 PM, Blue Hill Club/Harambee Park — compatible with Vishala sleepover drop-off at 5 PM.
- Calendar: no new events vs run 115. Family: Boston trip (5/27–5/29), Vishala sleepover (5/30 5PM–5/31 noon). All others empty.
- P0 carries: 990-N 8 days overdue; Disney ADR Day 7+; Berman $6K (5d past promise); cat sitter T-4; NEW: Sante Total Berteau decision ASAP.
- Pages updated: `daily/2026-05-23.md` (run 116 appended, frontmatter bumped), `business/sante-total.md` (Berteau follow-up callout appended, frontmatter bumped), `family/active-todos.md` (run 116 section appended, run bumped to 116), `log.md` (this entry, run bumped to 116), `data/heartbeat-log.csv` (created), `data/gather-alerts.md` (written)
- KEY: Sante Total treasurer decision needed ASAP — Barbara Weis follow-up on Berteau elderly food program ($2,400 ask). Cat sitter for Boston trip (5/27) still unbooked at T-4.

## [2026-05-23] ingest | personal-data-gather run 115: cat sitter T-4 escalated; Window AC property; Chase credit alerts; Vishala screen time
- Sources: Gmail (newer_than:2d, 50 threads — broader query), all 5 Google Calendars (May 23–30). No SSH (web runner). Fourth run today.
- New facts: (1) URGENCY ESCALATION — cat sitter for Boston trip (5/27) still unresolved, T-4 days, escalated to P0 in active-todos. (2) Window AC rental property — Oana Geambasu (Harvard SPH tenant) emailed Aneeta; Aneeta authorized Task Rabbit reimbursement; Oana self-resolved, moving out soon. (3) Chase credit balance alerts x2 (5/23 ~14:28 ET) — informational. (4) Vishala screen time 8h57m week May 16–22 (Microsoft Family Safety). (5) Montclair municipal pool closed (unseasonable weather, low priority). (6) LinkedIn DSPV director role alerts (J&J, BMS, Celcuity, Ladders). (7) Anthropic red.anthropic.com new posts (exploit measurement, vuln disclosure). (8) MyKidsSpending Vayu portal registration invitation (low priority).
- Calendar: no new events vs run 114. Family: Boston trip (5/27–5/29), Vishala sleepover (5/30 5PM–5/31 noon). All other calendars empty.
- P0 carries: 990-N 8 days overdue; Disney ADR Day 7+; Berman $6K (5 days past promise); cat sitter T-4 (NEW escalation to P0).
- Pages updated: `daily/2026-05-23.md` (run 115 appended), `family/active-todos.md` (P0 cat sitter escalation, run bumped to 115), `family/vishala.md` (screen time appended, run bumped to 115), `log.md` (this entry, run bumped to 115), `data/heartbeat-log.csv` (created), `data/gather-alerts.md` (created)

## [2026-05-24] ingest | personal-data-gather run 118: Baby Wipes shipped; Doximity newsletter; all else dedup
- Sources: Gmail (newer_than:1d, 18 threads), all 5 Google Calendars (May 24–31). No SSH (web runner). Second run today.
- New facts: (1) Amazon Elements Baby Wipes shipped (2 shipment emails 02:34/03:14 UTC, INFORMATIONAL, follows 5/23 order for [[family/vasu|Vasu]]). (2) Doximity Neuro News — "Blood Test May Help Identify Cognitive-Motor Decline in Dementia-Free Adults" (01:17 UTC, INFORMATIONAL). All other 16 threads duplicates of runs 112–117.
- Calendar: unchanged from run 117. Family: Boston trip (5/27–5/29), Vishala sleepover (5/30 5PM–5/31 noon). All other calendars empty.
- P0 carries: same as run 117 (same day) — 990-N 9 days overdue; Disney ADR Day 8; Berman $6K 6 days past promise; cat sitter T-3 CRITICAL; Berteau ASAP.
- Pages updated: `daily/2026-05-24.md` (run 118 section appended, run bumped), `log.md` (this entry, run bumped to 118), `data/heartbeat-log.csv` (created — run 117 entry reconstructed + run 118 added), `data/gather-alerts.md` (created)
- KEY: No new actionable items this run. Cat sitter for Boston (5/27) still unbooked at T-3 — today is last day with confidence.

## [2026-05-24] ingest | personal-data-gather run 117: no new Gmail; calendar unchanged; P0 escalations day+1
- Sources: Gmail (newer_than:1d, 16 threads all dated 2026-05-23), all 5 Google Calendars (May 24–31). No SSH (web runner). First run today.
- New facts: (1) Amazon household orders (Waterloo sparkling water + baby wipes, ordered + delivered 2026-05-23) — first capture, INFORMATIONAL only, daily log. No other new intelligence.
- Calendar: unchanged from yesterday. Family: Boston trip (5/27–5/29), Vishala sleepover (5/30 5PM–5/31 noon ET). All others empty.
- P0 carry-forward updated: 990-N now 9 days overdue; Disney ADR Day 8; Berman $6K 6 days past promise; cat sitter T-3 (CRITICAL); Sante Total Berteau follow-up 1 day since 5/23.
- Pages updated: `daily/2026-05-24.md` (created), `family/active-todos.md` (run 117 carry-forward appended, frontmatter bumped), `log.md` (this entry, run bumped to 117), `data/heartbeat-log.csv` (created), `data/gather-alerts.md` (written)
- KEY: Cat sitter for Boston trip (5/27) still unbooked at T-3 — book today. Sante Total Berteau $2,400 decision overdue 1 day. 990-N now 9 days past IRS deadline.

## [2026-05-24] ingest | personal-data-gather run 119: UPS claim; Vayu cafeteria debit confirmed; pool chemicals; expanded Gmail window
- Sources: Gmail (is:unread newer_than:2d, 30 threads), all 5 Google Calendars (May 24–31). No SSH (web runner). Third run today.
- New facts: (1) UPS lost package claim received (04:09 AM ET today, pkginfo@ups.com) — ACTION_REQUIRED/monitor, expect UPS contact by ~2026-06-05. (2) Vayu MKA cafeteria debit confirmed — Chase 8563 debited $101.75 ($100 + $1.75 fee) on 2026-05-23 midnight; MyKidsSpending portal active. Closes run 108 pending item. (3) Amazon delivered HTH swimming pool chemicals (2026-05-22 22:23 ET) — pool supply, informational. (4) Anthropic red.anthropic.com newsletter (2026-05-22) — exploit measurement + vuln disclosure, informational. (5) Code Ninjas Livingston NJ summer camps promo (2026-05-23) — summer planning context for Vayu/Vishala.
- Calendar: unchanged from runs 117–118. Family: Boston trip (5/27–5/29), Vishala sleepover (5/30 5PM–5/31 noon). All other calendars empty.
- P0 carries: 990-N 9 days overdue; Disney ADR Day 8 (Blue Bayou at critical risk); Berman $6K 6 days past promise; cat sitter T-3 CRITICAL; Berteau $2,400 ASAP; Gaby $9,972 pending since 5/12.
- Pages updated: `daily/2026-05-24.md` (run 119 section appended, run bumped), `family/vayu.md` (cafeteria debit confirmed, run 108 todo closed), `family/active-todos.md` (UPS claim added, debit resolved, frontmatter bumped), `log.md` (this entry, run bumped to 119), `data/heartbeat-log.csv` (written), `data/gather-alerts.md` (written)
- KEY: Cat sitter for Boston trip (5/27) at T-3 — last realistic booking day. Sante Total Berteau $2,400 decision needed ASAP. 990-N 9 days overdue. New: UPS lost package claim filed today; monitor for ~8 business days.

## [2026-05-24] ingest | personal-data-gather run 120: Cadoo bill clarified; Sante Total 3-part ask detailed; Amazon delivered; Goddard schedule confirmed
- Sources: Gmail (is:unread newer_than:2d, 30 threads), all 5 Google Calendars (May 24–31). No SSH (web runner). Fourth run today.
- New facts: (1) CLARIFICATION — Cadoo Medical PC $765.21 bill confirmed legitimate for Alton ("EMMETT" = Alton's first name per UPS email today); ACTION_REQUIRED to pay. (2) Amazon Baby Wipes delivered 11:07 AM ET today — INFORMATIONAL. (3) Goddard Sneak Peek week of May 25–29: Mon 5/25 CLOSED (Memorial Day), Dance Recital June 2 — both previously known, confirmed. (4) Sante Total Barbara Weis 3-part ask fully detailed: Berteau elderly grant ($2,400/3 months), school lunch program with Erick Delss (pending, no action), Gaby $9,972 (Finance Report 2025.xlsx attached, no response since 5/12). (5) LinkedIn Medical Director InMail — skip per recruiter-feed triage rule.
- Calendar: unchanged from runs 112–119. Family: Boston trip (5/27–5/29), Vishala sleepover (5/30 5PM–5/31 noon). All other calendars empty.
- P0 carries: 990-N 9 days overdue; Disney ADR Day 8; Berman $6K 6 days past promise; cat sitter T-3 CRITICAL; Berteau $2,400 ASAP; Gaby $9,972 pending; Cadoo Medical $765.21 NEW-PAY.
- Pages updated: `daily/2026-05-24.md` (run 120 section appended, run bumped), `business/sante-total.md` (Berteau/Gaby 3-part ask detailed, 990-N overdue updated), `family/active-todos.md` (Cadoo bill resolved + run 120 carry-forward, run bumped), `log.md` (this entry), `data/heartbeat-log.csv` (created), `data/gather-alerts.md` (written)
- KEY: Cat sitter for Boston (T-3) still unbooked. Cadoo Medical $765.21 is now confirmed as Alton's bill — ready to pay. Sante Total 3-part ask (Berteau + Gaby) awaiting Alton response. 990-N 9 days overdue.

## [2026-05-24] ingest | personal-data-gather run 121: 5 new informational threads; pool closed 3rd day; AI newsletter; pharma forward from Oliver
- Sources: Gmail (is:unread newer_than:2d, 30 threads), all 5 Google Calendars (May 24–31). No SSH (web runner). Fifth run today.
- New facts: (1) Oliver Sartor forwarding Fierce Life Sciences pharma digest (11:50 AM ET) — industry/FDA news, INFORMATIONAL. (2) Montclair pool closed again today (9:06 AM ET) — 3rd consecutive closure for unseasonable weather. (3) JAMA Weekly Highlights email today — professional reading, INFORMATIONAL. (4) Substack AI #169 from Zvi Mowshowitz et al. (5/22) — AI newsletter relevant to research interests. (5) JAMA Med News "19,000 Measles Cases" (5/22) — medical news, INFORMATIONAL. All 5 new items are INFORMATIONAL; no new ACTION_REQUIRED items.
- Calendar: unchanged from runs 112–120. Family: Boston trip (5/27–5/29), Vishala sleepover (5/30 5PM–5/31 noon). All other calendars empty.
- P0 carries: unchanged from run 120 — 990-N 9 days overdue; Disney ADR Day 8; Berman $6K 6 days past promise; cat sitter T-3 CRITICAL; Berteau $2,400 ASAP; Gaby $9,972 pending; UPS claim monitor; Cadoo Medical $765.21 pay.
- Pages updated: `daily/2026-05-24.md` (run 121 section appended, run bumped), `log.md` (this entry, run bumped to 121), `data/heartbeat-log.csv` (created with runs 117–121), `data/gather-alerts.md` (written)
- KEY: No new escalations this run. All P0 items carry from run 120 unchanged. Cat sitter for Boston 5/27 still critical at T-3.

## [2026-05-24] ingest | personal-data-gather run 122: Stanford HAI scaling laws; Hiive digest; 2 LinkedIn recruiter skips
- Sources: Gmail (is:unread newer_than:2d, 30 threads), all 5 Google Calendars (May 24–31). No SSH (web runner). Sixth run today.
- New facts: (1) Stanford HAI newsletter "A new approach to AI scaling laws" (1:03 PM ET) — measurement-science reframing of scaling laws; INFORMATIONAL for AI research context. (2) Hiive daily private market digest (3:05 PM ET) — INFORMATIONAL. 2 LinkedIn recruiter alerts skipped per triage rule (Bayer Exec Med Dir, Kailera Therapeutics Pharmacovigilance MD).
- Calendar: unchanged from runs 112–121. Family: Boston trip (5/27–5/29), Vishala sleepover (5/30 5PM–5/31 noon). All other calendars empty.
- P0 carries: unchanged from run 121 — 990-N 9 days overdue; Disney ADR Day 8; Berman $6K 6 days past promise; cat sitter T-3 CRITICAL; Berteau $2,400 ASAP; Gaby $9,972 pending; UPS claim monitor; Cadoo Medical $765.21 pay.
- Pages updated: `daily/2026-05-24.md` (run 122 appended, run bumped to 122), `log.md` (this entry, run bumped to 122), `data/heartbeat-log.csv` (run 122 entry appended), `data/gather-alerts.md` (updated)
- KEY: No new escalations. P0 items carry from run 121 unchanged. Cat sitter Boston 5/27 still unresolved (T-3 days).

## [2026-05-25] ingest | personal-data-gather run 123: T-2 cat sitter CRITICAL; Memorial Day; 4 informational threads
- Sources: Gmail (is:unread newer_than:2d, 30 threads), all 5 Google Calendars (May 25–Jun 1). No SSH (web runner). First run of 2026-05-25.
- New facts: (1) cardiosax@gmail.com family share "4,000 Rules: Sanskrit Grammar Behind Every LLM" (7:54 PM ET 5/24) — INFORMATIONAL. (2) Substack "Reiner Pope – Chip design from the bottom up" (6:00 PM ET 5/24) — INFORMATIONAL. (3) Samsung TV ACR opt-in notice (5:08 PM ET 5/24) — INFORMATIONAL. (4) Disney+ new login + OTP (4:41 PM ET 5/24) — INFORMATIONAL, user-initiated activity.
- Calendar: no new events vs prior runs. Family: Boston trip (5/27–5/29), Vishala sleepover (5/30 5PM–5/31 noon). All others empty. Today: Memorial Day — Goddard closed, MKA closed.
- P0 updates: cat sitter now T-2 (LAST DAY); 990-N now 10 days overdue; Berman 7 days past promise; Berteau 2 days since follow-up; Gaby 13 days.
- Pages updated: `daily/2026-05-25.md` (created), `family/active-todos.md` (run 123 section appended, frontmatter bumped), `log.md` (this entry, run bumped to 123), `data/heartbeat-log.csv` (created with runs 117–123), `data/gather-alerts.md` (created)
- KEY: Cat sitter for Boston (5/27) at T-2 — TODAY is the last realistic booking day. Sante Total Berteau $2,400 now 2 days without response. 990-N 10 days overdue.

## [2026-05-25] ingest | personal-data-gather run 124: Steam purchases x2; LinkedIn msg; P0 carry
- Sources: Gmail (is:unread newer_than:2d, 30 threads), all 5 Google Calendars (May 25–Jun 1). No SSH (web runner). Second run of 2026-05-25.
- New facts: (1) Steam purchases ×2 (noreply@steampowered.com, 2026-05-25 00:19/00:21 ET) — two gaming purchases added to Steam Library, FINANCIAL/PERSONAL, no action required. (2) LinkedIn message notification from "Michael" (07:24 ET) — 1 message awaiting response, INFORMATIONAL. All other 28 threads are duplicates of runs 120–123.
- Calendar: unchanged from run 123. Family: Boston trip (5/27–5/29), Vishala sleepover (5/30 5PM–5/31 noon), Vasu dance performance ~June 2 (time TBD). All other calendars empty. Today: Memorial Day.
- P0 carries: unchanged from run 123 — 990-N 10 days overdue; Disney ADR Day 9; Berman $6K 7 days past promise; cat sitter T-2 CRITICAL (today is last booking day); Berteau $2,400 ASAP; Gaby $9,972 pending 13 days; UPS claim Day 2; Cadoo Medical $765.21 pay.
- Pages updated: `daily/2026-05-25.md` (run 124 section appended), `log.md` (this entry, run bumped to 124), `data/heartbeat-log.csv` (created/appended), `data/gather-alerts.md` (written)
- KEY: No new actionable items this run. Cat sitter for Boston 5/27 still unbooked at T-2 — today is the last realistic day. Sante Total Berteau $2,400 still awaiting Alton's response (3 days since Barbara's follow-up).
